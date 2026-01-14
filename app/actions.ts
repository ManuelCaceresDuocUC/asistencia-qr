// app/actions.ts
'use server'

import { prisma } from "@/lib/db";
import { s3Client } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { revalidatePath } from "next/cache";

// 1. Acción del QR (Automático A_BORDO con Validación)
export async function registrarAsistencia(qrCode: string, fotoBase64: string) {
  try {
    // A. Buscamos al usuario
    const user = await prisma.user.findUnique({
      where: { qrCode: qrCode }
    });

    if (!user) return { success: false, message: "Usuario no encontrado ❌" };

    // ============================================================
    // 🛑 NUEVA VALIDACIÓN: Verificar si ya está a bordo
    // ============================================================
    const ultimoRegistro = await prisma.assistance.findFirst({
      where: { userId: user.id },
      orderBy: { timestamp: 'desc' } // Traemos el más reciente
    });

    // Si existe un registro anterior Y su estado es A_BORDO...
    if (ultimoRegistro?.estado === 'A_BORDO') {
      return { 
        success: false, 
        message: `⚠️ ${user.nombre} ya se encuentra A BORDO.` 
      };
    }
    // ============================================================

    // B. Lógica de subida a S3
    const buffer = Buffer.from(fotoBase64.replace(/^data:image\/\w+;base64,/, ""), "base64");
    const fileName = `${user.qrCode}_${Date.now()}.jpg`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: "image/jpeg",
    });

    await s3Client.send(command);

    const photoUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

    // C. Guardar en Base de Datos
    await prisma.assistance.create({
      data: {
        userId: user.id,
        evidenceUrl: photoUrl,
        estado: 'A_BORDO' 
      }
    });

    revalidatePath('/dashboard'); 
    return { success: true, message: `¡Bienvenido a bordo, ${user.nombre}! 🚢` };

  } catch (error) { 
    console.error("Error en registrarAsistencia:", error);
    return { success: false, message: "Error interno al registrar" };
  }
}

// 2. Acción Manual (Desde el Dashboard - Esta queda igual)
export async function registrarManual(userId: string, estado: 'A_BORDO' | 'EN_TIERRA' | 'PERMISO' | 'AUTORIZADO') {
  try {
    await prisma.assistance.create({
      data: {
        userId: userId,
        estado: estado,
        evidenceUrl: null 
      }
    });

    revalidatePath('/dashboard');
    return { success: true, message: "Registro manual guardado ✅" };
  } catch (error) {
    console.error("Error en registrarManual:", error);
    return { success: false, message: "Error al guardar manual" };
  }
}