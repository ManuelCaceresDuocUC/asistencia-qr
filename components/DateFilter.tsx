// components/DateFilter.tsx
'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export default function DateFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  // Usamos el parámetro o la fecha local (formato YYYY-MM-DD)
  // 'en-CA' es un truco para obtener siempre formato YYYY-MM-DD
  const today = new Date().toLocaleDateString('en-CA');
  const dateParam = searchParams.get('date');
  const date = dateParam || today;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    
    // Mantenemos otros parámetros si existieran
    const params = new URLSearchParams(searchParams);
    
    if (newDate) {
      params.set('date', newDate);
    } else {
      params.delete('date');
    }

    // 1. Cambiamos la URL (replace es más suave que push para filtros)
    router.replace(`${pathname}?${params.toString()}`);
    
    // 2. 🛑 EL TRUCO MAGICO: Forzamos al servidor a recargar los datos
    router.refresh();
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