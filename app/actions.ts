// app/actions.ts
'use server'

import { prisma } from "@/lib/db";
import { s3Client } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { revalidatePath } from "next/cache";

// ==============================================================================
// 1. ACCIÓN QR (Se mantiene igual, lógica de foto y S3)
// ==============================================================================
export async function registrarAsistencia(userId: string) {
  try {
    // 1. Validar que el usuario exista
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, message: 'Usuario no encontrado ❌' };

    // 2. Crear el registro DIRECTAMENTE (Sin subir fotos)
    await prisma.assistance.create({
      data: {
        userId: user.id,
        estado: 'A_BORDO', // O el estado por defecto que uses
        timestamp: new Date(),
        evidenceUrl: null, // Ya no hay foto
        description: 'Ingreso vía QR Rápido' 
      }
    });

    revalidatePath('/dashboard');
    return { success: true, message: `✅ Registro exitoso: ${user.nombre}` };

  } catch (error) {
    console.error(error);
    return { success: false, message: 'Error al registrar.' };
  }
}

// ==============================================================================
// 2. ACCIÓN MANUAL (Soporta Rangos de Fechas y Descripción)
// ==============================================================================
export async function registrarManual(formData: FormData) {
  try {
    // 1. Extraer datos del formulario
    const userId = formData.get('userId') as string;
    const rawEstado = formData.get('estado') as string;
    
    // Descripción
    const descriptionRaw = formData.get('description') as string | null;
    const description = descriptionRaw && descriptionRaw.trim() !== '' ? descriptionRaw : null;
    
    // Fechas para Rango (Bulk Create)
    const startDateStr = formData.get('startDate') as string | null;
    const endDateStr = formData.get('endDate') as string | null;

    // Casteo de tipos (Asegúrate que 'COMISION' esté en tu schema.prisma enum EstadoAsistencia)
    const nuevoEstado = rawEstado as 'A_BORDO' | 'EN_TIERRA' | 'PERMISO' | 'AUTORIZADO' | 'COMISION';

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, message: "Usuario no encontrado" };

    // =====================================================================
    // CASO A: RANGO DE FECHAS (Creación Masiva)
    // =====================================================================
    if (startDateStr && endDateStr) {
      const start = new Date(startDateStr);
      const end = new Date(endDateStr);
      
      // Ajustamos hora a mediodía UTC para evitar saltos de día por zona horaria
      start.setUTCHours(12, 0, 0, 0);
      end.setUTCHours(12, 0, 0, 0);

      const recordsToCreate = [];
      const current = new Date(start);

      // Bucle: Generamos un objeto por cada día
      while (current <= end) {
        recordsToCreate.push({
          userId: userId,
          estado: nuevoEstado,
          description: description, // La misma descripción para todos los días
          evidenceUrl: null,
          timestamp: new Date(current) // Importante: Nueva instancia de fecha
        });

        // Avanzamos un día
        current.setDate(current.getDate() + 1);
      }

      // Ejecutamos transacción en base de datos
      await prisma.$transaction(
        recordsToCreate.map(data => prisma.assistance.create({ data }))
      );

      revalidatePath('/dashboard');
      return { 
        success: true, 
        message: `✅ Se generaron ${recordsToCreate.length} registros para ${user.nombre} (Del ${startDateStr} al ${endDateStr})` 
      };
    }

    // =====================================================================
    // CASO B: REGISTRO SIMPLE (HOY)
    // =====================================================================
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const registroHoy = await prisma.assistance.findFirst({
      where: { 
        userId: userId,
        timestamp: { gte: todayStart, lte: todayEnd }
      },
      orderBy: { timestamp: 'desc' }
    });

    if (registroHoy) {
      // ACTUALIZAR (Ya existe registro hoy)
      await prisma.assistance.update({
        where: { id: registroHoy.id },
        data: { 
          estado: nuevoEstado,
          description: description 
        }
      });
      
      revalidatePath('/dashboard');
      return { success: true, message: `✅ Registro corregido: ${user.nombre} -> ${nuevoEstado}` };

    } else {
      // CREAR (Nuevo registro hoy)
      await prisma.assistance.create({
        data: {
          userId: userId,
          estado: nuevoEstado,
          evidenceUrl: null,
          description: description
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

// 3. ACCIÓN PARA LIMPIAR EL DÍA (DELETE)
export async function limpiarRegistrosDia(fechaStr: string) {
  try {
    // Definimos el mismo rango de horario que usas en el Dashboard
    // Inicio: 04:00 AM UTC (aprox 00:00 Chile)
    const startOfDay = new Date(`${fechaStr}T04:00:00.000Z`);
    
    // Fin: 04:00 AM UTC del día siguiente
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    endOfDay.setMilliseconds(-1);

    // Borramos TODOS los registros dentro de ese rango
    const deleted = await prisma.assistance.deleteMany({
      where: {
        timestamp: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    revalidatePath('/dashboard');
    return { success: true, message: `🗑️ Se eliminaron ${deleted.count} registros del día ${fechaStr}.` };

  } catch (error) {
    console.error("Error al limpiar:", error);
    return { success: false, message: "Error al intentar borrar los registros." };
  }
}