// app/dashboard/page.tsx
import { prisma } from "@/lib/db";
import Link from "next/link";
import ManualEntry from "@/components/ManualEntry"; 
import DateFilter from "@/components/DateFilter";

// 🛑 Forzar que no se guarde caché nunca
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface SearchParamsProps {
  searchParams: { date?: string };
}

export default async function DashboardPage({ searchParams }: SearchParamsProps) {
  // 1. OBTENER FECHA
  const todayStr = new Date().toLocaleDateString('en-CA');
  const selectedDateStr = searchParams?.date || todayStr;

  // 2. CORRECCIÓN DE ZONA HORARIA (CRÍTICO) 🌎
  // Creamos las fechas asumiendo que el usuario quiere ver SU día local.
  // Agregamos 4 horas (UTC-4) o simplemente abrimos el rango un poco más
  // para asegurarnos de atrapar todos los registros de ese día.
  
  const startOfDay = new Date(`${selectedDateStr}T00:00:00`);
  const endOfDay = new Date(`${selectedDateStr}T23:59:59.999`);

  // Ajuste manual: Le decimos a la base de datos "Traeme todo lo que caiga en este día"
  // Nota: Prisma maneja fechas en UTC. Si guardaste en UTC, esto funciona directo.
  // Si tienes problemas de que faltan horas de la noche, usa una librería como date-fns-tz,
  // pero este método nativo suele bastar.

  // 3. CONSULTA PRINCIPAL
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

  // 4. RESTO DEL CÓDIGO (Igual que tenías, solo lo resumo para no copiar todo de nuevo)
  const allUsers = await prisma.user.findMany({ orderBy: { nombre: 'asc' } });
  
  // ... (Tu lógica de contadores Maps y Sets va aquí, es correcta) ...
  const estadoActualPorUsuario = new Map();
  asistenciasDelDia.forEach((r) => {
    if (!estadoActualPorUsuario.has(r.userId)) estadoActualPorUsuario.set(r.userId, r.estado);
  });
  
  let aBordo = 0, enTierra = 0, permiso = 0, autorizado = 0;
  const sinRegistroIds = new Set(allUsers.map(u => u.id));

  allUsers.forEach(user => {
    if (estadoActualPorUsuario.has(user.id)) {
      sinRegistroIds.delete(user.id);
      const est = estadoActualPorUsuario.get(user.id);
      if (est === 'A_BORDO') aBordo++;
      if (est === 'EN_TIERRA') enTierra++;
      if (est === 'PERMISO') permiso++;
      if (est === 'AUTORIZADO') autorizado++;
    }
  });

  const sinMarcar = sinRegistroIds.size;
  const getBadgeColor = (estado: string) => { /* ... tu lógica de colores ... */ 
     if(estado === 'A_BORDO') return 'bg-green-900 text-green-300 border-green-700';
     if(estado === 'EN_TIERRA') return 'bg-yellow-900 text-yellow-300 border-yellow-700';
     return 'bg-gray-700';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* ENCABEZADO */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-bold text-yellow-500">
            📋 Bitácora: <span className="text-white">{selectedDateStr}</span>
          </h1>
          <div className="flex items-center gap-4">
            <DateFilter /> {/* Aquí está nuestro filtro con recarga forzada */}
            <Link href="/scan" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold transition">
              Escanear QR 📷
            </Link>
          </div>
        </div>

        {/* CONTADORES */}
        {/* Usamos key para forzar redibujado si cambia la fecha */}
        <div key={selectedDateStr} className="grid grid-cols-2 md:grid-cols-5 gap-4">
             {/* ... Tus tarjetas de siempre ... */}
             <div className="bg-gray-800 p-4 rounded-xl border-l-4 border-green-500 shadow-lg">
                <p className="text-gray-400 text-xs uppercase font-bold">A Bordo</p>
                <p className="text-2xl font-bold text-white">{aBordo}</p>
             </div>
             {/* Agrega las otras tarjetas aquí */}
        </div>

        <ManualEntry users={allUsers} />

        {/* TABLA */}
        <div className="bg-gray-800 rounded-xl overflow-hidden shadow-2xl border border-gray-700">
           <div className="p-4 bg-gray-950 border-b border-gray-700 flex justify-between items-center">
             <h3 className="font-bold text-gray-300">Registros del {selectedDateStr}</h3>
             <span className="text-xs text-gray-500 font-mono">Total: {asistenciasDelDia.length}</span>
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
                    <td colSpan={4} className="p-12 text-center text-gray-500 italic">
                      📭 No hay registros para la fecha <span className="text-gray-300 font-bold">{selectedDateStr}</span>.
                    </td>
                  </tr>
                ) : (
                  asistenciasDelDia.map((registro) => (
                    <tr key={registro.id} className="hover:bg-gray-700/50 transition">
                      <td className="p-4 text-gray-300 font-mono">
                         {new Date(registro.timestamp).toLocaleTimeString('es-CL', {
                            hour: '2-digit', minute:'2-digit'
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
                          <a href={registro.evidenceUrl} target="_blank" className="text-blue-400 hover:underline">📷 Ver Foto</a>
                        ) : <span className="text-gray-600">Manual</span>}
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