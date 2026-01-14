// app/dashboard/page.tsx
import { prisma } from "@/lib/db";
import Link from "next/link";

// Hacemos que la página no se guarde en caché para ver siempre datos nuevos
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // 1. Buscamos las asistencias e incluimos los datos del usuario
  const asistencias = await prisma.assistance.findMany({
    orderBy: {
      timestamp: 'desc', // Las más nuevas primero
    },
    include: {
      user: true, // Trae el nombre del usuario asociado
    },
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-yellow-500">📋 Historial de Asistencias</h1>
          <Link 
            href="/scan" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
          >
            📷 Ir al Escáner
          </Link>
        </div>

        <div className="bg-gray-800 rounded-xl overflow-hidden shadow-2xl border border-gray-700">
          <table className="w-full text-left">
            <thead className="bg-gray-950 text-gray-400 uppercase text-sm">
              <tr>
                <th className="p-4">Hora</th>
                <th className="p-4">Nombre</th>
                <th className="p-4">Evidencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {asistencias.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-500">
                    Aún no hay registros de asistencia.
                  </td>
                </tr>
              ) : (
                asistencias.map((registro) => (
                  <tr key={registro.id} className="hover:bg-gray-700/50 transition">
                    <td className="p-4">
                      {new Date(registro.timestamp).toLocaleString('es-CL', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: 'short'
                      })}
                    </td>
                    <td className="p-4 font-medium text-lg">
                      {registro.user.nombre}
                      <span className="block text-xs text-gray-500">{registro.user.qrCode}</span>
                    </td>
                    <td className="p-4">
                      {registro.evidenceUrl ? (
                        <div className="relative group w-16 h-16">
                            {/* Usamos img normal para no configurar dominios de Next.js todavía */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                                src={registro.evidenceUrl} 
                                alt="Evidencia" 
                                className="w-16 h-16 object-cover rounded-md border border-gray-600 group-hover:scale-150 transition-transform origin-left z-10 relative"
                            />
                            <a 
                                href={registro.evidenceUrl} 
                                target="_blank" 
                                className="text-xs text-blue-400 hover:underline mt-1 block"
                            >
                                Ver full
                            </a>
                        </div>
                      ) : (
                        <span className="text-gray-600">Sin foto</span>
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
  );
}