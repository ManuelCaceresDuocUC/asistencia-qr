'use client'

import { useState, useRef } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import Link from 'next/link';
// Asegúrate de que tu server action ya no espere la foto (ver paso 2)
import { registrarAsistencia } from '../actions';

interface IScannerData {
  rawValue: string;
  format?: string;
}

export default function ScanPage() {
  const [mensaje, setMensaje] = useState('Esperando código QR...');
  const [procesando, setProcesando] = useState(false);
  const [colorEstado, setColorEstado] = useState('text-yellow-400');

  // 🛡️ MEMORIA INSTANTÁNEA
  const ultimoCodigoLeido = useRef<string | null>(null);

  const handleScan = async (result: IScannerData[]) => {
    if (!result || result.length === 0) return;

    const codigoLeido = result[0].rawValue;

    // 🛑 BLOQUEO MAESTRO (Evita lecturas repetidas muy seguidas)
    if (procesando || codigoLeido === ultimoCodigoLeido.current) return;

    // ✅ PASÓ EL FILTRO
    ultimoCodigoLeido.current = codigoLeido;
    setProcesando(true);
    setMensaje('🚀 Registrando...');
    setColorEstado('text-blue-400');

    try {
      // 👇 AQUÍ ESTÁ EL CAMBIO: Ya no capturamos foto, solo enviamos el ID.
      // Si tu función en actions.ts aún pide 2 argumentos, cámbiala o pasa null aquí.
      const respuesta = await registrarAsistencia(codigoLeido);

      if (respuesta.success) {
        setMensaje(respuesta.message || 'Éxito');
        setColorEstado('text-green-500');
      } else {
        setMensaje(respuesta.message || 'Error');
        setColorEstado('text-red-500');
      }

    } catch (error) {
      console.error(error);
      setMensaje('Error de conexión');
      setColorEstado('text-red-500');
    }

    // 3. ENFRIAMIENTO RÁPIDO
    // Al no subir fotos, podemos reducir el tiempo de espera a 2 segundos
    setTimeout(() => {
      setProcesando(false);
      ultimoCodigoLeido.current = null; 
      setMensaje('Esperando siguiente...');
      setColorEstado('text-yellow-400');
    }, 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
      <h1 className={`text-3xl font-bold mb-6 ${colorEstado}`}>
        {procesando ? 'Procesando...' : 'Parte Banda ESNAVAL'}
      </h1>
      
      <div className={`w-full max-w-sm aspect-square border-4 rounded-xl overflow-hidden shadow-lg relative transition-colors duration-300 ${procesando ? 'border-blue-500' : 'border-yellow-400'}`}>
        <Scanner 
            onScan={handleScan}
            allowMultiple={true} 
            scanDelay={500} 
            // Corregí el typo: es 'environment' (con n antes de la m)
            constraints={{ facingMode: 'environment' }} 
        />
        
        {/* Capa oscura más ligera */}
        {procesando && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
                <div className="text-5xl animate-bounce mb-4">⚡</div>
                <span className="text-white text-xl font-bold">Guardando...</span>
            </div>
        )}
      </div>

      <div className="mt-8 p-4 bg-gray-900 border border-gray-700 rounded-lg w-full max-w-sm text-center">
        <p className="text-gray-400 text-sm mb-1">Estado:</p>
        <p className={`text-lg font-mono font-bold ${colorEstado}`}>
          {mensaje}
        </p>
      </div>

      <Link href="/dashboard" className="mt-8 text-gray-500 hover:text-white transition underline">
        ← Volver al Dashboard
      </Link>
    </div>
  );
}