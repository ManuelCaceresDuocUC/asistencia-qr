// components/ManualEntry.tsx
'use client'

import { useState } from 'react';
import { registrarManual } from '@/app/actions';

type EstadoAsistencia = 'A_BORDO' | 'EN_TIERRA' | 'PERMISO' | 'AUTORIZADO' | 'COMISION';

interface SimpleUser {
  id: string;
  nombre: string;
}

export default function ManualEntry({ users }: { users: SimpleUser[] }) {
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedEstado, setSelectedEstado] = useState<EstadoAsistencia>('EN_TIERRA');
  const [description, setDescription] = useState('');
  
  // NUEVOS ESTADOS PARA FECHAS
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [loading, setLoading] = useState(false);

  // Estados que habilitan el modo rango de fechas
  const estadosDeRango = ['PERMISO', 'AUTORIZADO', 'COMISION'];
  const showDateRange = estadosDeRango.includes(selectedEstado);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return alert('Selecciona un usuario');
    
    // Validaciones simples
    if (showDateRange && (!startDate || !endDate)) {
      return alert('Debes seleccionar fecha de inicio y fin para este estado.');
    }
    if (showDateRange && startDate > endDate) {
      return alert('La fecha de inicio no puede ser posterior a la de fin.');
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('userId', selectedUser);
    formData.append('estado', selectedEstado);
    if (description) formData.append('description', description);
    
    // Enviamos las fechas si aplica
    if (showDateRange) {
      formData.append('startDate', startDate);
      formData.append('endDate', endDate);
    }

    const res = await registrarManual(formData);
    
    alert(res.message);
    setLoading(false);
    
    if (res.success) {
      setDescription('');
      setStartDate('');
      setEndDate('');
      window.location.reload(); 
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-8 flex flex-col gap-4">
      
      <div className="flex flex-wrap gap-4 items-end">
        {/* SELECT USUARIO */}
        <div className="flex flex-col gap-2 min-w-[200px] flex-1">
          <label className="text-sm text-gray-400">Usuario:</label>
          <select 
            className="bg-gray-900 text-white p-2 rounded border border-gray-600 h-10"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
          >
            <option value="">-- Seleccionar --</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.nombre}</option>
            ))}
          </select>
        </div>

        {/* SELECT ESTADO */}
        <div className="flex flex-col gap-2 min-w-[200px] flex-1">
          <label className="text-sm text-gray-400">Estado:</label>
          <select 
            className="bg-gray-900 text-white p-2 rounded border border-gray-600 h-10"
            value={selectedEstado}
            onChange={(e) => setSelectedEstado(e.target.value as EstadoAsistencia)}
          >
            <option value="A_BORDO">A BORDO 🚢</option>
            <option value="EN_TIERRA">EN TIERRA 🌍</option>
            <option value="PERMISO">PERMISO 🏠 (Rango)</option>
            <option value="AUTORIZADO">AUTORIZADO ✅ (Rango)</option>
            <option value="COMISION">COMISIÓN 📋 (Rango)</option>
          </select>
        </div>
      </div>

      {/* SECCIÓN DE FECHAS (Solo visible si es Permiso, Comisión, etc) */}
      {showDateRange && (
        <div className="p-4 bg-gray-900/50 border border-gray-600 rounded-lg animate-in fade-in slide-in-from-top-2">
           <p className="text-xs text-blue-300 mb-2 font-bold">📅 Configurar Rango de Fechas</p>
           <div className="flex gap-4">
             <div className="flex-1">
               <label className="text-xs text-gray-400 block mb-1">Desde:</label>
               <input 
                 type="date" 
                 className="w-full bg-gray-800 text-white p-2 rounded border border-gray-600 text-sm"
                 value={startDate}
                 onChange={(e) => setStartDate(e.target.value)}
                 required={showDateRange}
               />
             </div>
             <div className="flex-1">
               <label className="text-xs text-gray-400 block mb-1">Hasta:</label>
               <input 
                 type="date" 
                 className="w-full bg-gray-800 text-white p-2 rounded border border-gray-600 text-sm"
                 value={endDate}
                 onChange={(e) => setEndDate(e.target.value)}
                 required={showDateRange}
               />
             </div>
           </div>
        </div>
      )}

      {/* CAMPO DE DESCRIPCIÓN */}
      <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-400 font-bold">
            Motivo / Descripción (Opcional):
          </label>
          <textarea
            className="bg-gray-900 text-white p-2 rounded border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            placeholder="Ej: Vacaciones legales, Comisión de servicio en Santiago..."
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
      </div>

      <button 
        disabled={loading}
        type="submit" 
        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-bold transition disabled:opacity-50 mt-2"
      >
        {loading ? 'Procesando...' : showDateRange ? '📅 Guardar Periodo Completo' : '💾 Guardar Registro'}
      </button>
    </form>
  );
}