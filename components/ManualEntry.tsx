// components/ManualEntry.tsx
'use client'

import { useState } from 'react';
import { registrarManual } from '@/app/actions';

// 1. Agregamos 'COMISION' al tipo
type EstadoAsistencia = 'A_BORDO' | 'EN_TIERRA' | 'PERMISO' | 'AUTORIZADO' | 'COMISION';

interface SimpleUser {
  id: string;
  nombre: string;
}

export default function ManualEntry({ users }: { users: SimpleUser[] }) {
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedEstado, setSelectedEstado] = useState<EstadoAsistencia>('EN_TIERRA');
  const [description, setDescription] = useState(''); // Estado para la descripción
  const [loading, setLoading] = useState(false);

  // Estados que requieren descripción
  const estadosConDescripcion = ['PERMISO', 'AUTORIZADO', 'COMISION'];
  const showDescription = estadosConDescripcion.includes(selectedEstado);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return alert('Selecciona un usuario');
    // Validación: Si requiere descripción y está vacía
    if (showDescription && !description.trim()) {
      return alert('Debes ingresar un motivo o descripción para este estado.');
    }

    setLoading(true);

    // 2. CREAMOS EL FORMDATA MANUALMENTE
    // (Porque tu Server Action ahora espera un FormData, no variables sueltas)
    const formData = new FormData();
    formData.append('userId', selectedUser);
    formData.append('estado', selectedEstado);
    if (description) {
      formData.append('description', description);
    }

    // Enviamos el formData
    const res = await registrarManual(formData);
    
    alert(res.message);
    setLoading(false);
    
    // Limpiamos campos si fue exitoso
    if (res.success) {
      setDescription('');
      // Opcional: recargar si quieres ver el cambio al instante
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
            <option value="PERMISO">PERMISO 🏠</option>
            <option value="AUTORIZADO">AUTORIZADO ✅</option>
            <option value="COMISION">COMISIÓN 📋</option>
          </select>
        </div>
      </div>

      {/* CAMPO DE DESCRIPCIÓN CONDICIONAL */}
      {showDescription && (
        <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <label className="text-sm text-yellow-500 font-bold">
            Motivo / Descripción (Requerido para {selectedEstado}):
          </label>
          <textarea
            className="bg-gray-900 text-white p-2 rounded border border-yellow-600 focus:outline-none focus:ring-1 focus:ring-yellow-500 text-sm"
            placeholder="Ej: Trámite médico, Compra de insumos, etc..."
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required // Validación nativa del navegador
          />
        </div>
      )}

      <button 
        disabled={loading}
        type="submit" 
        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-bold transition disabled:opacity-50 mt-2"
      >
        {loading ? 'Guardando...' : '💾 Guardar Registro Manual'}
      </button>
    </form>
  );
}