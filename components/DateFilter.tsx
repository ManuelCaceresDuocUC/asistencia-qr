// components/DateFilter.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function DateFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Obtenemos la fecha de la URL o usamos la de hoy
  const dateParam = searchParams.get('date');
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(dateParam || today);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDate(newDate);
    // Actualizamos la URL para que el servidor recargue los datos
    router.push(`/dashboard?date=${newDate}`);
  };

  return (
    <div className="flex items-center gap-2 bg-gray-800 p-3 rounded-lg border border-gray-700">
      <label className="text-gray-400 text-sm font-bold">Filtrar por Día:</label>
      <input 
        type="date" 
        value={date}
        onChange={handleChange}
        className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
      />
    </div>
  );
}