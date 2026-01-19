// app/actions.ts
'use server'

import { prisma } from "@/lib/db";
import { s3Client } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { revalidatePath } from "next/cache";

// 1. Acción del QR (Se mantiene igual, no la toques)
export async function registrarAsistencia(qrCode: string, fotoBase64: string) {
  // ... (Tu código del QR aquí, igual que antes) ...
  // Solo pego la parte manual abajo para no hacer spam de código
  try {
    const user = await prisma.user.findUnique({ where: { qrCode: qrCode } });
    if (!user) return { success: false, message: "Usuario no encontrado ❌" };

    const ultimoRegistro = await prisma.assistance.findFirst({
      where: { userId: user.id },
      orderBy: { timestamp: 'desc' }
    });

    if (ultimoRegistro?.estado === 'A_BORDO') {
      return { success: false, message: `⚠️ ${user.nombre} ya se encuentra A BORDO.` };
    }

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

// 2. Acción Manual (CORRIGE el registro existente de hoy)
export async function registrarManual(userId: string, nuevoEstado: 'A_BORDO' | 'EN_TIERRA' | 'PERMISO' | 'AUTORIZADO') {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, message: "Usuario no encontrado" };

    // Definimos el rango de "HOY" para no editar registros de ayer por error
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Buscamos si ya tiene un registro HOY
    const registroHoy = await prisma.assistance.findFirst({
      where: { 
        userId: userId,
        timestamp: {
          gte: todayStart,
          lte: todayEnd
        }
      },
      orderBy: { timestamp: 'desc' } // Tomamos el último de hoy
    });

    if (registroHoy) {
      // CASO A: ACTUALIZAR (Ya existe registro hoy)
      // Solo cambiamos el estado. La evidencia (foto) y la hora se mantienen.
      await prisma.assistance.update({
        where: { id: registroHoy.id },
        data: { 
          estado: nuevoEstado 
        }
      });
      
      revalidatePath('/dashboard');
      return { success: true, message: `✅ Registro corregido: ${user.nombre} ahora está ${nuevoEstado.replace('_', ' ')}` };

    } else {
      // CASO B: CREAR (No ha marcado nada hoy)
      await prisma.assistance.create({
        data: {
          userId: userId,
          estado: nuevoEstado,
          evidenceUrl: null // Manual puro, sin foto
        }
      });

      revalidatePath('/dashboard');
      return { success: true, message: `✅ Nuevo registro manual: ${user.nombre}` };
    }

  } catch (error) {
    console.error("Error en registrarManual:", error);
    return { success: false, message: "Error al guardar manual" };
  }
}