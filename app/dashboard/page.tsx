// app/dashboard/page.tsx
import { prisma } from "@/lib/db";
import Link from "next/link";
import ManualEntry from "@/components/ManualEntry"; // Importamos el form

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // 1. Buscamos asistencias
  const asistencias = await prisma.assistance.findMany({
    orderBy: { timestamp: 'desc' },
    include: { user: true },
  });

  // 2. Buscamos usuarios para el dropdown
  const users = await prisma.user.findMany({
    orderBy: { nombre: 'asc' }
  });

  // Función para colores según estado
  const getBadgeColor = (estado: string) => {
    switch (estado) {
      case 'A_BORDO': return 'bg-green-900 text-green-300 border-green-700';
      case 'EN_TIERRA': return 'bg-yellow-900 text-yellow-300 border-yellow-700';
      case 'PERMISO': return 'bg-purple-900 text-purple-300 border-purple-700';
      default: return 'bg-gray-700 text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-5xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-yellow-500">📋 Bitácora de Personal</h1>
          <Link href="/scan" className="text-blue-400 hover:underline">Ir al Escáner →</Link>
        </div>

        {/* Formulario de registro manual */}
        <ManualEntry users={users} />

        {/* Tabla */}
        <div className="bg-gray-800 rounded-xl overflow-hidden shadow-2xl border border-gray-700">
          <table className="w-full text-left">
            <thead className="bg-gray-950 text-gray-400 uppercase text-sm">
              <tr>
                <th className="p-4">Hora</th>
                <th className="p-4">Nombre</th>
                <th className="p-4">Estado</th>
                <th className="p-4">Evidencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {asistencias.map((registro) => (
                <tr key={registro.id} className="hover:bg-gray-700/50 transition">
                  <td className="p-4 text-gray-400">
                    <span className="text-xs">{new Date(registro.timestamp).toLocaleDateString('es-CL',{
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'America/Santiago'
                    })}</span>
                  </td>
                  <td className="p-4 font-bold">{registro.user.nombre}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getBadgeColor(registro.estado)}`}>
                      {registro.estado.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4">
                    {registro.evidenceUrl ? (
                      <a href={registro.evidenceUrl} target="_blank" className="text-blue-400 hover:underline text-sm">Ver Foto 📸</a>
                    ) : (
                      <span className="text-gray-600 text-sm italic">Registro Manual</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}