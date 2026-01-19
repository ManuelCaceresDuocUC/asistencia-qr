import { prisma } from "@/lib/db";
import Link from "next/link";
import ManualEntry from "@/components/ManualEntry"; 
import DateFilter from "@/components/DateFilter";

// Esto es vital para evitar caché de datos viejos
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface SearchParamsProps {
  searchParams: { date?: string };
}

export default async function DashboardPage({ searchParams }: SearchParamsProps) {
  // 1. OBTENER FECHA
  // Si no hay fecha, usamos la fecha actual ajustada a formato YYYY-MM-DD
  const todayStr = new Date().toLocaleDateString('en-CA'); 
  const selectedDateStr = searchParams?.date || todayStr;

  // =====================================================================
  // 🛠️ CORRECCIÓN DE ZONA HORARIA (SOLUCIÓN DEFINITIVA)
  // =====================================================================
  // El servidor (Vercel/Railway/etc) suele estar en UTC.
  // Chile es UTC-4 (Invierno) o UTC-3 (Verano).
  // Para asegurar que atrapamos todo el día local, buscamos desde las 
  // 04:00 AM UTC (que es media noche en Chile) hasta las 04:00 AM del día siguiente.

  // Inicio: Concatenamos la fecha seleccionada + 4 AM UTC
  const startOfDay = new Date(`${selectedDateStr}T04:00:00.000Z`);
  
  // Fin: Clonamos el inicio, sumamos 1 día y restamos 1 milisegundo
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);
  endOfDay.setMilliseconds(-1); 
  
  // Debug (opcional): Puedes ver esto en la consola del servidor para verificar
  console.log(`Buscando desde: ${startOfDay.toISOString()} hasta ${endOfDay.toISOString()}`);
  // =====================================================================

  // 2. OBTENER USUARIOS
  const allUsers = await prisma.user.findMany({
    orderBy: { nombre: 'asc' }
  });

  // 3. OBTENER ASISTENCIA (Con el rango corregido)
  const asistenciasDelDia = await prisma.assistance.findMany({
    where: {
      timestamp: {
        gte: startOfDay,
        lte: endOfDay
      }
    },
    orderBy: { timestamp: 'desc' },
    include: { user: true },
  });

  // 4. LÓGICA DE ESTADÍSTICAS (Tu lógica estaba perfecta, se mantiene igual)
  const estadoActualPorUsuario = new Map();

  asistenciasDelDia.forEach((registro) => {
    if (!estadoActualPorUsuario.has(registro.userId)) {
      estadoActualPorUsuario.set(registro.userId, registro.estado);
    }
  });

  let aBordo = 0;
  let enTierra = 0;
  let permiso = 0;
  let autorizado = 0;
  
  const sinRegistroIds = new Set(allUsers.map(u => u.id));

  allUsers.forEach(user => {
    if (estadoActualPorUsuario.has(user.id)) {
      sinRegistroIds.delete(user.id);
      const estado = estadoActualPorUsuario.get(user.id);
      if (estado === 'A_BORDO') aBordo++;
      else if (estado === 'EN_TIERRA') enTierra++;
      else if (estado === 'PERMISO') permiso++;
      else if (estado === 'AUTORIZADO') autorizado++;
    }
  });

  const sinMarcar = sinRegistroIds.size;

  const getBadgeColor = (estado: string) => {
    switch (estado) {
      case 'A_BORDO': return 'bg-green-900 text-green-300 border-green-700';
      case 'EN_TIERRA': return 'bg-yellow-900 text-yellow-300 border-yellow-700';
      case 'PERMISO': return 'bg-purple-900 text-purple-300 border-purple-700';
      case 'AUTORIZADO': return 'bg-blue-900 text-blue-300 border-blue-700';
      default: return 'bg-gray-700 text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-bold text-yellow-500">
             📋 Bitácora: <span className="text-white">{selectedDateStr}</span>
          </h1>
          <div className="flex items-center gap-4">
            <DateFilter />
            <Link href="/scan" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold transition">
              Escanear QR 📷
            </Link>
          </div>
        </div>

        {/* IMPORTANTE: key={selectedDateStr}
            Esto obliga a React a destruir y volver a crear los componentes 
            cuando la fecha cambia, asegurando que los números se actualicen.
        */}
        <div key={selectedDateStr} className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-gray-800 p-4 rounded-xl border-l-4 border-green-500 shadow-lg">
            <p className="text-gray-400 text-xs uppercase font-bold">A Bordo</p>
            <p className="text-2xl font-bold text-white">{aBordo}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-xl border-l-4 border-yellow-500 shadow-lg">
            <p className="text-gray-400 text-xs uppercase font-bold">En Tierra</p>
            <p className="text-2xl font-bold text-white">{enTierra}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-xl border-l-4 border-purple-500 shadow-lg">
            <p className="text-gray-400 text-xs uppercase font-bold">Permiso</p>
            <p className="text-2xl font-bold text-white">{permiso}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-xl border-l-4 border-blue-500 shadow-lg">
            <p className="text-gray-400 text-xs uppercase font-bold">Autorizado</p>
            <p className="text-2xl font-bold text-white">{autorizado}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-xl border-l-4 border-red-500 shadow-lg">
            <p className="text-gray-400 text-xs uppercase font-bold">Sin Marcar</p>
            <p className="text-2xl font-bold text-red-400">{sinMarcar}</p>
          </div>
        </div>

        <ManualEntry users={allUsers} />

        {/* Tabla de Registros */}
        <div className="bg-gray-800 rounded-xl overflow-hidden shadow-2xl border border-gray-700">
          <div className="p-4 bg-gray-950 border-b border-gray-700 flex justify-between items-center">
             <h3 className="font-bold text-gray-300">Historial del día ({selectedDateStr})</h3>
             <span className="text-xs text-gray-500">Total registros: {asistenciasDelDia.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-950/50 text-gray-400 uppercase text-xs">
                <tr>
                  <th className="p-4">Hora</th>
                  <th className="p-4">Nombre</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4">Evidencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700 text-sm">
                {asistenciasDelDia.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500 italic">
                      No hay movimientos registrados en el rango seleccionado.
                    </td>
                  </tr>
                ) : (
                  asistenciasDelDia.map((registro) => (
                    <tr key={registro.id} className="hover:bg-gray-700/50 transition">
                      <td className="p-4 text-gray-300 font-mono">
                         {/* Usamos America/Santiago explícitamente */}
                         {new Date(registro.timestamp).toLocaleTimeString('es-CL', {
                            hour: '2-digit', 
                            minute:'2-digit',
                            timeZone: 'America/Santiago' 
                          })}
                      </td>
                      <td className="p-4 font-bold text-white">{registro.user.nombre}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-md text-xs font-bold border ${getBadgeColor(registro.estado)}`}>
                          {registro.estado.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4">
                        {registro.evidenceUrl ? (
                          <a href={registro.evidenceUrl} target="_blank" className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1">
                            <span>📷</span> Ver Foto
                          </a>
                        ) : (
                          <span className="text-gray-600 italic">Manual</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}