'use client'; // 👈 Esto permite el onClick

import { eliminarRegistro } from "@/app/actions";

export function BotonEliminar({ id }: { id: string }) {
  const handleEliminar = async () => {
    if (confirm("¿Estás seguro de eliminar este registro?")) {
      const res = await eliminarRegistro(id);
      if (res.success) {
        alert(res.message);
      }
    }
  };

  return (
    <button 
      onClick={handleEliminar}
      className="text-red-500 hover:underline"
    >
      Eliminar
    </button>
  );
}