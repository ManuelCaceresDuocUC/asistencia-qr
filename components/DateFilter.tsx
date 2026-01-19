'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function DateFilter() {
  const searchParams = useSearchParams();
  
  // 1. Función Helper para obtener la fecha de Chile (YYYY-MM-DD)
  // Se usa para el valor por defecto si no hay nada en la URL.
  const getChileDate = () => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });
  };

  // 2. INICIALIZACIÓN DIRECTA (Aquí estaba el error)
  // En lugar de usar useEffect, calculamos el valor inicial directamente.
  // Si searchParams cambia (por ejemplo, al dar atrás en el navegador), 
  // en este caso particular como forzamos recarga, el componente se monta de nuevo.
  const initialDate = searchParams.get('date') || getChileDate();
  
  // Inicializamos el estado con el valor calculado
  const [date, setDate] = useState(initialDate);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDate(newDate); // Actualización visual inmediata
    
    // 3. RECARGA FORZADA (NUCLEAR OPTION ☢️)
    const params = new URLSearchParams(window.location.search);
    
    if (newDate) {
      params.set('date', newDate);
    } else {
      params.delete('date');
    }

    // Esto recarga la página, por lo que el componente se desmonta y 
    // se vuelve a montar con el nuevo searchParams.
    window.location.search = params.toString();
  };

  return (
    <div className="flex items-center gap-2 bg-gray-800 p-3 rounded-lg border border-gray-700 shadow-md">
      <label className="text-gray-400 text-sm font-bold">📅 Filtrar:</label>
      <input 
        type="date" 
        value={date}
        onChange={handleChange}
        className="bg-gray-700 text-white border border-gray-600 rounded px-3 py-1 text-sm focus:outline-none focus:border-yellow-500 font-mono cursor-pointer"
      />
    </div>
  );
}