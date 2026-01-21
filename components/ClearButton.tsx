// components/ClearButton.tsx
'use client';

import { useState } from 'react';
import { limpiarRegistrosDia } from '@/app/actions';

export default function ClearButton({ dateStr, count }: { dateStr: string, count: number }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (count === 0) return alert("No hay registros para borrar hoy.");

    // ⚠️ LA PREGUNTA DE SEGURIDAD
    const confirmado = window.confirm(
      `⚠️ ¡PELIGRO!\n\nEstás a punto de eliminar ${count} registros del día ${dateStr}.\n\n¿Estás realmente seguro? Esta acción no se puede deshacer.`
    );

    if (confirmado) {
      setLoading(true);
      const res = await limpiarRegistrosDia(dateStr);
      alert(res.message);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading || count === 0}
      className={`
        px-4 py-2 rounded-lg font-bold transition flex items-center gap-2
        ${count === 0 
          ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
          : 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/50'
        }
      `}
      title="Borrar toda la lista de hoy"
    >
      {loading ? (
        <span>⏳ Borrando...</span>
      ) : (
        <>
          🗑️ <span className="hidden md:inline">Limpiar Lista</span>
        </>
      )}
    </button>
  );
}