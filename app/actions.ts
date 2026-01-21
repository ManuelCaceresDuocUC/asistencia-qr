// app/actions.ts
'use server'

import { prisma } from "@/lib/db";
import { s3Client } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { revalidatePath } from "next/cache";

// ==============================================================================
// 1. ACCIÓN QR (Se mantiene igual, la descripción queda nula o vacía)
// ==============================================================================
export async function registrarAsistencia(qrCode: string, fotoBase64: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { qrCode: qrCode }
    });

    if (!user) return { success: false, message: "Usuario no encontrado ❌" };

    // Rango de fechas: HOY (00:00 a 23:59 del servidor)
    // Nota: Si el servidor no está en hora chilena, esto podría variar.
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const ultimoRegistroHoy = await prisma.assistance.findFirst({
      where: { 
        userId: user.id,
        timestamp: {
          gte: startOfDay 
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    if (ultimoRegistroHoy?.estado === 'A_BORDO') {
      return { 
        success: false, 
        message: `⚠️ ${user.nombre} ya marcó entrada HOY.` 
      };
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
        estado: 'A_BORDO',
        description: null // QR no lleva descripción manual
      }
    });

    revalidatePath('/dashboard'); 
    return { success: true, message: `¡Bienvenido a bordo, ${user.nombre}! 🚢` };

  } catch (error) { 
    console.error("Error en registrarAsistencia:", error);
    return { success: false, message: "Error interno al registrar" };
  }
}

// ==============================================================================
// 2. ACCIÓN MANUAL (ACTUALIZADA para recibir FormData y Descripción)
// ==============================================================================
export async function registrarManual(formData: FormData) {
  try {
    // 1. Extraer datos del formulario
    const userId = formData.get('userId') as string;
    const rawEstado = formData.get('estado') as string;
    // Capturamos la descripción (puede venir vacía)
    const descriptionRaw = formData.get('description') as string | null;
    
    // Limpiamos la descripción: si es string vacío, lo pasamos a null
    const description = descriptionRaw && descriptionRaw.trim() !== '' ? descriptionRaw : null;

    // Casteamos el estado para que TypeScript no se queje
    // Asegúrate de haber agregado 'COMISION' en tu schema.prisma enum
    const nuevoEstado = rawEstado as 'A_BORDO' | 'EN_TIERRA' | 'PERMISO' | 'AUTORIZADO' | 'COMISION';

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, message: "Usuario no encontrado" };

    // 2. Definimos rango de HOY
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 3. Buscamos registro existente
    const registroHoy = await prisma.assistance.findFirst({
      where: { 
        userId: userId,
        timestamp: {
          gte: todayStart,
          lte: todayEnd
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    if (registroHoy) {
      // CASO A: ACTUALIZAR (Ya existe)
      await prisma.assistance.update({
        where: { id: registroHoy.id },
        data: { 
          estado: nuevoEstado,
          description: description // <--- Actualizamos la descripción
        }
      });
      
      revalidatePath('/dashboard');
      return { success: true, message: `✅ Registro corregido: ${user.nombre} -> ${nuevoEstado}` };

    } else {
      // CASO B: CREAR (Nuevo)
      await prisma.assistance.create({
        data: {
          userId: userId,
          estado: nuevoEstado,
          evidenceUrl: null, // Sin foto
          description: description // <--- Guardamos la descripción
        }
      });

      revalidatePath('/dashboard');
      return { success: true, message: `✅ Nuevo registro: ${user.nombre} (${nuevoEstado})` };
    }

  } catch (error) {
    console.error("Error en registrarManual:", error);
    return { success: false, message: "Error al guardar manual" };
  }
}