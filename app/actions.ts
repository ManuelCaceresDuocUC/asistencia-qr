// app/actions.ts
'use server'

import { prisma } from "@/lib/db";
import { s3Client } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { revalidatePath } from "next/cache";

// 1. Acción del QR (Automático A_BORDO)
export async function registrarAsistencia(qrCode: string, fotoBase64: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { qrCode: qrCode }
    });

    if (!user) return { success: false, message: "Usuario no encontrado ❌" };

    // --- LÓGICA DE S3 RESTAURADA ---
    
    // 1. Convertir base64 a Buffer (binario)
    const buffer = Buffer.from(fotoBase64.replace(/^data:image\/\w+;base64,/, ""), "base64");
    
    // 2. Crear nombre único
    const fileName = `${user.qrCode}_${Date.now()}.jpg`;

    // 3. Configurar el comando de subida
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: "image/jpeg",
    });

    // 4. ¡ENVIAR A S3! (Esto faltaba, por eso s3Client no se usaba)
    await s3Client.send(command);

    // 5. Construir la URL pública
    const photoUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

    // -------------------------------

    // Guardar en Base de Datos
    await prisma.assistance.create({
      data: {
        userId: user.id,
        evidenceUrl: photoUrl,
        estado: 'A_BORDO' 
      }
    });

    revalidatePath('/dashboard'); 
    return { success: true, message: `¡Bienvenido a bordo, ${user.nombre}! 🚢` };

  } catch (error) { // Quitamos el :any para que el linter no llore
    console.error("Error en registrarAsistencia:", error);
    return { success: false, message: "Error interno al registrar" };
  }
}

// 2. Acción Manual (Desde el Dashboard)
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