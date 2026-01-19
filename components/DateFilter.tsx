'use client';

// Ya no necesitamos useRouter
import { useSearchParams } from 'next/navigation';

export default function DateFilter() {
  const searchParams = useSearchParams();
  
  // 1. CORRECCIÓN DE FECHA LOCAL (CHILE)
  // toISOString() usa UTC. Si son las 21:00 en Chile, UTC es mañana.
  // Usamos 'en-CA' porque devuelve formato YYYY-MM-DD local.
  const today = new Date().toLocaleDateString('en-CA');
  
  const dateParam = searchParams.get('date');
  // Si hay fecha en la URL usala, si no, usa la de hoy local
  const date = dateParam || today;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    
    // 2. RECARGA FORZADA (NUCLEAR OPTION ☢️)
    // En lugar de router.push, manipulamos window.location directamente.
    // Esto obliga al navegador a destruir la página y cargarla de cero.
    // Garantiza que la base de datos se consulte de nuevo.
    
    const params = new URLSearchParams(window.location.search);
    
    if (newDate) {
      params.set('date', newDate);
    } else {
      params.delete('date');
    }

    // Al asignar esto, el navegador recarga automáticamente
    window.location.search = params.toString();
  };

  return (
    <div className="flex items-center gap-2 bg-gray-800 p-3 rounded-lg border border-gray-700 shadow-md">
      <label className="text-gray-400 text-sm font-bold">📅 Filtrar por Día:</label>
      <input 
        type="date" 
        value={date}
        onChange={handleChange}
        className="bg-gray-700 text-white border border-gray-600 rounded px-3 py-1 text-sm focus:outline-none focus:border-yellow-500 font-mono cursor-pointer"
      />
    </div>
  );
}