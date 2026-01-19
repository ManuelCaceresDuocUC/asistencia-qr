// components/DateFilter.tsx
'use client';

import { useSearchParams } from 'next/navigation';

export default function DateFilter() {
  const searchParams = useSearchParams();
  
  // 1. Obtenemos fecha de la URL o la de hoy (Local Chile)
  // Usamos el truco de 'en-CA' para que el formato sea siempre YYYY-MM-DD
  const today = new Date().toLocaleDateString('en-CA');
  const dateParam = searchParams.get('date');
  const date = dateParam || today;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    
    // 2. 🛑 RECARGA FORZADA
    // En lugar de usar el router de Next.js, usamos el navegador nativo.
    // Esto obliga al servidor a entregarnos datos nuevos sí o sí.
    const params = new URLSearchParams(window.location.search);
    
    if (newDate) {
      params.set('date', newDate);
    } else {
      params.delete('date');
    }

    // Esto recarga la página completamente con la nueva fecha
    window.location.search = params.toString();
  };

  return (
    <div className="flex items-center gap-2 bg-gray-800 p-3 rounded-lg border border-gray-700 shadow-md">
      <label className="text-gray-400 text-sm font-bold">📅 Ver fecha:</label>
      <input 
        type="date" 
        value={date}
        onChange={handleChange}
        className="bg-gray-700 text-white border border-gray-600 rounded px-3 py-1 text-sm focus:outline-none focus:border-yellow-500 font-mono cursor-pointer"
      />
    </div>
  );
}