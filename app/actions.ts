// app/actions.ts
'use server'

import { prisma } from "@/lib/db"; // Tu conexión a BD
import { s3Client } from "@/lib/s3"; // Tu conexión a AWS
import { PutObjectCommand } from "@aws-sdk/client-s3";

export async function registrarAsistencia(qrCode: string, fotoBase64: string) {
    console.log("------------------------------------------------");
  console.log("🔍 ETIQUETA ESCANEADA:", `"${qrCode}"`); // Las comillas nos mostrarán si hay espacios
  console.log("📏 Longitud del texto:", qrCode.length);
  
    try {
    // 1. Buscar si el usuario existe por su código QR
    const user = await prisma.user.findUnique({
      where: { qrCode: qrCode }
    });

    if (!user) {
      return { success: false, message: "Usuario no encontrado ❌" };
    }

    // 2. Subir la foto a AWS S3
    // La foto viene en formato base64 ("data:image/jpeg..."), hay que limpiarla
    const base64Data = fotoBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Nombre único para el archivo: ID_Usuario + Fecha
    const fileName = `evidencia-${user.id}-${Date.now()}.jpg`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: "image/jpeg",
    });

    await s3Client.send(command);

    // Construimos la URL pública (asumiendo que tu bucket permite lectura o usarás URLs firmadas después)
    const photoUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${fileName}`;

    // 3. Guardar el registro en la Base de Datos
    await prisma.assistance.create({
      data: {
        userId: user.id,
        evidenceUrl: photoUrl,
        timestamp: new Date()
      }
    });

    return { success: true, message: `¡Hola ${user.nombre}! Asistencia guardada ✅` };

  } catch (error) {
    console.error("Error en servidor:", error);
    return { success: false, message: "Error interno del servidor ⚠️" };
  }
}