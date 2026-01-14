// components/ManualEntry.tsx
'use client'

import { useState } from 'react';
import { registrarManual } from '@/app/actions';

// 1. Definimos EXACTAMENTE los textos permitidos
type EstadoAsistencia = 'A_BORDO' | 'EN_TIERRA' | 'PERMISO' | 'AUTORIZADO';

interface SimpleUser {
  id: string;
  nombre: string;
}

export default function ManualEntry({ users }: { users: SimpleUser[] }) {
  const [selectedUser, setSelectedUser] = useState('');
  
  // 2. Le decimos a useState que solo acepte nuestro tipo EstadoAsistencia
  const [selectedEstado, setSelectedEstado] = useState<EstadoAsistencia>('EN_TIERRA');
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return alert('Selecciona un usuario');

    setLoading(true);
    
    // 3. ¡Ya no necesitamos "as any"! 
    // Como selectedEstado ya tiene el tipo correcto, TypeScript es feliz.
    const res = await registrarManual(selectedUser, selectedEstado);
    
    alert(res.message);
    setLoading(false);
    window.location.reload(); 
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 p-4 rounded-xl border border-gray-700 mb-8 flex flex-wrap gap-4 items-end">
      
      <div className="flex flex-col gap-2">
        <label className="text-sm text-gray-400">Usuario:</label>
        <select 
          className="bg-gray-900 text-white p-2 rounded border border-gray-600"
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
        >
          <option value="">-- Seleccionar --</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.nombre}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm text-gray-400">Estado:</label>
        <select 
          className="bg-gray-900 text-white p-2 rounded border border-gray-600"
          value={selectedEstado}
          // Aquí forzamos el tipo al cambiar el valor para que coincida
          onChange={(e) => setSelectedEstado(e.target.value as EstadoAsistencia)}
        >
          <option value="A_BORDO">A BORDO 🚢</option>
          <option value="EN_TIERRA">EN TIERRA 🌍</option>
          <option value="PERMISO">PERMISO 🏠</option>
          <option value="AUTORIZADO">AUTORIZADO ✅</option>
        </select>
      </div>

      <button 
        disabled={loading}
        type="submit" 
        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded h-10 font-bold transition disabled:opacity-50"
      >
        {loading ? 'Guardando...' : '+ Agregar Manual'}
      </button>
    </form>
  );
}