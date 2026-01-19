// app/scan/page.tsx
'use client'

import { useState, useRef } from 'react'; // Agregamos useRef
import { Scanner } from '@yudiel/react-qr-scanner';
import Link from 'next/link';
import { registrarAsistencia } from '../actions';

interface IScannerData {
  rawValue: string;
  format?: string;
}

export default function ScanPage() {
  const [mensaje, setMensaje] = useState('Esperando código QR...');
  const [procesando, setProcesando] = useState(false);
  const [colorEstado, setColorEstado] = useState('text-yellow-400');

  // 🛡️ MEMORIA INSTANTÁNEA (Evita el efecto ametralladora)
  const ultimoCodigoLeido = useRef<string | null>(null);

  const handleScan = async (result: IScannerData[]) => {
    // Si no hay datos, salimos
    if (!result || result.length === 0) return;

    const codigoLeido = result[0].rawValue;

    // 🛑 BLOQUEO MAESTRO 🛑
    // 1. Si el estado visual dice "procesando"... ALTO.
    // 2. Si el código que ve la cámara es IDÉNTICO al que leímos hace 1 segundo... ALTO.
    if (procesando || codigoLeido === ultimoCodigoLeido.current) return;

    // ✅ PASÓ EL FILTRO: Iniciamos proceso
    ultimoCodigoLeido.current = codigoLeido; // Guardamos en memoria inmediata
    setProcesando(true);
    setMensaje('📸 Procesando...');
    setColorEstado('text-blue-400');

    try {
      // 1. CAPTURAR FOTO DEL VIDEO
      const videoElement = document.querySelector('video');
      let fotoBase64 = '';

      if (videoElement) {
        const canvas = document.createElement("canvas");
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
            fotoBase64 = canvas.toDataURL("image/jpeg", 0.7);
        }
      }

      // 2. ENVIAR AL SERVIDOR
      const respuesta = await registrarAsistencia(codigoLeido, fotoBase64);

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

    // 3. ENFRIAMIENTO (Cool-down)
    // Esperamos 3 segundos antes de permitir leer CUALQUIER código de nuevo.
    setTimeout(() => {
      setProcesando(false);
      ultimoCodigoLeido.current = null; // Borramos la memoria para permitir leer al mismo usuario si vuelve a pasar
      setMensaje('Esperando siguiente...');
      setColorEstado('text-yellow-400');
    }, 3000);
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
            scanDelay={500} // Revisamos cada 500ms, pero nuestro filtro useRef bloquea lo repetido
            constraints={{ facingMode: 'user' }} // 'user' es cámara frontal (selfie), 'environment' es trasera
        />
        
        {/* Capa oscura cuando está ocupado */}
        {procesando && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
                <div className="text-4xl animate-spin mb-4">⏳</div>
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

      <Link href="/" className="mt-8 text-gray-500 hover:text-white transition underline">
        ← Volver
      </Link>
    </div>
  );
}