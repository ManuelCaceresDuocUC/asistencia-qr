import { prisma } from "@/lib/db";
import Link from "next/link";
import ManualEntry from "@/components/ManualEntry"; 
import DateFilter from "@/components/DateFilter";
import { unstable_noStore as noStore } from 'next/cache';
import ClearButton from "@/components/ClearButton"; 

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DashboardPage(props: Props) {
  noStore();

  // --- 1. PROCESAMIENTO DE PARÁMETROS ---
  const searchParams = await props.searchParams;
  const dateFromUrl = typeof searchParams.date === 'string' ? searchParams.date : undefined;

  // --- 2. CÁLCULO DE FECHAS ---
  const chileTime = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });
  const selectedDateStr = dateFromUrl || chileTime;
  
  const startOfDay = new Date(`${selectedDateStr}T04:00:00.000Z`);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);
  endOfDay.setMilliseconds(-1); 

  // --- 3. CONSULTAS DB ---
  const allUsers = await prisma.user.findMany({
    orderBy: { nombre: 'asc' }
  });

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

  // --- 4. LÓGICA DE CONTADORES ---
  const estadoActualPorUsuario = new Map();
  asistenciasDelDia.forEach((registro) => {
    if (!estadoActualPorUsuario.has(registro.userId)) {
      estadoActualPorUsuario.set(registro.userId, registro.estado);
    }
  });

  // Variables para contadores
  let aBordo = 0, enTierra = 0, permiso = 0, comision = 0, categoria = 0;
  
  const sinRegistroIds = new Set(allUsers.map(u => u.id));

  allUsers.forEach(user => {
    if (estadoActualPorUsuario.has(user.id)) {
      sinRegistroIds.delete(user.id);
      const estado = estadoActualPorUsuario.get(user.id);
      
      if (estado === 'A_BORDO') aBordo++;
      else if (estado === 'EN_TIERRA') enTierra++;
      else if (estado === 'PERMISO') permiso++;
      else if (estado === 'COMISION') comision++;
      else if (estado === 'CATEGORIA') categoria++;
    }
  });
  const sinMarcar = sinRegistroIds.size;

  // --- 5. COLORES DE ESTADOS ---
  const getBadgeColor = (estado: string) => {
    switch (estado) {
      case 'A_BORDO': return 'bg-green-900 text-green-300 border-green-700';
      case 'EN_TIERRA': return 'bg-yellow-900 text-yellow-300 border-yellow-700';
      case 'PERMISO': return 'bg-purple-900 text-purple-300 border-purple-700';
      case 'COMISION': return 'bg-cyan-900 text-cyan-300 border-cyan-700';
      case 'CATEGORIA': return 'bg-rose-900 text-rose-300 border-rose-700'; 
      default: return 'bg-gray-700 text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-bold text-yellow-500">
              📋 Bitácora: <span className="text-white">{selectedDateStr}</span>
          </h1>
          <div className="flex items-center gap-4">
            <DateFilter />
            <ClearButton dateStr={selectedDateStr} count={asistenciasDelDia.length} />
            <Link href="/scan" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold transition">
              Escanear QR 📷
            </Link>
          </div>
        </div>

        {/* --- TARJETAS DE RESUMEN --- */}
        <div key={selectedDateStr} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
          
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
          
          <div className="bg-gray-800 p-4 rounded-xl border-l-4 border-cyan-500 shadow-lg">
            <p className="text-gray-400 text-xs uppercase font-bold">Comisión</p>
            <p className="text-2xl font-bold text-white">{comision}</p>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-xl border-l-4 border-rose-500 shadow-lg">
            <p className="text-gray-400 text-xs uppercase font-bold">Categoría</p>
            <p className="text-2xl font-bold text-white">{categoria}</p>
          </div>

          <div className="bg-gray-800 p-4 rounded-xl border-l-4 border-red-500 shadow-lg">
            <p className="text-gray-400 text-xs uppercase font-bold">Sin Marcar</p>
            <p className="text-2xl font-bold text-red-400">{sinMarcar}</p>
          </div>

        </div>

        <ManualEntry users={allUsers} />

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
                  <th className="p-4">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700 text-sm">
                {asistenciasDelDia.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500 italic">
                      No hay registros para la fecha <span className="font-bold text-white">{selectedDateStr}</span>.
                    </td>
                  </tr>
                ) : (
                  asistenciasDelDia.map((registro) => (
                    <tr key={registro.id} className="hover:bg-gray-700/50 transition">
                      <td className="p-4 text-gray-300 font-mono align-top">
                          {new Date(registro.timestamp).toLocaleTimeString('es-CL', {
                            hour: '2-digit', 
                            minute:'2-digit',
                            timeZone: 'America/Santiago' 
                          })}
                      </td>
                      <td className="p-4 font-bold text-white align-top">{registro.user.nombre}</td>
                      <td className="p-4 align-top">
                        <span className={`px-2 py-1 rounded-md text-xs font-bold border ${getBadgeColor(registro.estado)}`}>
                          {registro.estado.replace('_', ' ')}
                        </span>
                      </td>
                      
                      <td className="p-4 align-top">
                        <div className="flex flex-col gap-1">
                          {registro.description && (
                            <div className="flex items-start gap-1 mt-1 bg-gray-900/50 p-2 rounded border border-gray-700 max-w-xs">
                              <span className="text-lg leading-none">📝</span>
                              <span className="text-yellow-100 text-xs italic break-words">
                                {registro.description}
                              </span>
                            </div>
                          )}
                        </div>
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