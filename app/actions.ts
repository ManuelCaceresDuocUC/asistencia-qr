'use server'

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { EstadoAsistencia } from "@prisma/client"; // Importa el Enum real
/**
 * Función auxiliar para obtener el rango de tiempo que usa el Dashboard (04:00 AM UTC)
 */
function getDashboardRange(fechaStr?: string) {
    const baseDate = fechaStr 
        ? fechaStr 
        : new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });
    
    const start = new Date(`${baseDate}T04:00:00.000Z`);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    end.setMilliseconds(-1);
    
    return { start, end };
}

// ==============================================================================
// 1. ACCIÓN QR
// ==============================================================================
export async function registrarAsistencia(codigoLeido: string) {
    const qrLimpio = codigoLeido.trim();
    try {
        if (!qrLimpio) return { success: false, message: 'Código QR vacío ❌' };

        const user = await prisma.user.findUnique({ where: { qrCode: qrLimpio } });
        if (!user) return { success: false, message: `QR no registrado: ${qrLimpio}` };

        // UNIFICADO: Usamos el rango de 04:00 AM
        const { start, end } = getDashboardRange();

        const registroExistente = await prisma.assistance.findFirst({
            where: {
                userId: user.id,
                timestamp: { gte: start, lte: end }
            }
        });

        if (registroExistente) {
            await prisma.assistance.update({
                where: { id: registroExistente.id },
                data: {
                    estado: 'A_BORDO',
                    timestamp: new Date(),
                    description: 'Escaneo QR ⚡ (Actualizado)'
                }
            });
            revalidatePath('/dashboard');
            return { success: true, message: `🔄 ${user.nombre} actualizado a: A BORDO` };
        } else {
            await prisma.assistance.create({
                data: {
                    userId: user.id,
                    estado: 'A_BORDO',
                    timestamp: new Date(),
                    description: 'Escaneo QR ⚡'
                }
            });
            revalidatePath('/dashboard');
            return { success: true, message: `✅ ${user.nombre} A Bordo` };
        }
    } catch (error) {
        return { success: false, message: 'Error interno del servidor' };
    }
}

// ==============================================================================
// 2. ACCIÓN MANUAL
// ==============================================================================
export async function registrarManual(formData: FormData) {
    try {
        const userId = formData.get('userId') as string;
        const rawEstado = formData.get('estado') as string;
        const descriptionRaw = formData.get('description') as string | null;
        const description = descriptionRaw?.trim() || null;
        const startDateStr = formData.get('startDate') as string | null;
        const endDateStr = formData.get('endDate') as string | null;

    // Forzamos a que sea un valor válido del Enum
         const nuevoEstado = rawEstado.trim() as EstadoAsistencia;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return { success: false, message: "Usuario no encontrado" };

        // CASO A: RANGO DE FECHAS
        if (startDateStr && endDateStr) {
            const start = new Date(startDateStr);
            const end = new Date(endDateStr);
            start.setUTCHours(12, 0, 0, 0);
            end.setUTCHours(12, 0, 0, 0);

            const recordsToCreate = [];
            const current = new Date(start);
            while (current <= end) {
                recordsToCreate.push({
                    userId,
                    estado: nuevoEstado,
                    description,
                    timestamp: new Date(current)
                });
                current.setDate(current.getDate() + 1);
            }
            await prisma.$transaction(recordsToCreate.map(data => prisma.assistance.create({ data })));
            revalidatePath('/dashboard');
            return { success: true, message: `✅ Registros generados (Rango)` };
        }

        // CASO B: REGISTRO SIMPLE (HOY) - UNIFICADO CON DASHBOARD
        const { start, end } = getDashboardRange();

        const registroHoy = await prisma.assistance.findFirst({
            where: { 
                userId,
                timestamp: { gte: start, lte: end }
            }
        });

        if (registroHoy) {
            await prisma.assistance.update({
                where: { id: registroHoy.id },
                data: { estado: nuevoEstado, description }
            });
        } else {
            await prisma.assistance.create({
                data: { userId, estado: nuevoEstado, description, timestamp: new Date() }
            });
        }

        revalidatePath('/dashboard');
        return { success: true, message: `✅ Registro manual exitoso` };

    } catch (error) {
        console.error(error);
        return { success: false, message: "Error al guardar manual" };
    }
}

// 3. ACCIÓN PARA LIMPIAR EL DÍA
export async function limpiarRegistrosDia(fechaStr: string) {
    try {
        const { start, end } = getDashboardRange(fechaStr);
        const deleted = await prisma.assistance.deleteMany({
            where: { timestamp: { gte: start, lte: end } }
        });
        revalidatePath('/dashboard');
        return { success: true, message: `🗑️ Se eliminaron ${deleted.count} registros.` };
    } catch (error) {
        return { success: false, message: "Error al borrar." };
    }
}

// 4. ELIMINAR UNO
export async function eliminarRegistro(id: string) {
    try {
        await prisma.assistance.delete({ where: { id } });
        revalidatePath('/dashboard');
        return { success: true, message: `🗑️ Registro eliminado.` };
    } catch (error) {
        return { success: false, message: "Error al eliminar." };
    }
}