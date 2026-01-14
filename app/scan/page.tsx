// app/scan/page.tsx
'use client'

import { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import Link from 'next/link';
import { registrarAsistencia } from '../actions'; // Importamos la lógica del servidor

interface IScannerData {
  rawValue: string;
  format?: string;
}

export default function ScanPage() {
  const [mensaje, setMensaje] = useState('Esperando código QR...');
  const [procesando, setProcesando] = useState(false); // Para evitar doble escaneo
  const [colorEstado, setColorEstado] = useState('text-yellow-400');

  const handleScan = async (result: IScannerData[]) => {
    // Si ya estamos procesando una asistencia, ignoramos nuevos escaneos
    if (procesando) return;

    if (result && result.length > 0) {
      const codigoLeido = result[0].rawValue;
      
      if (codigoLeido) {
        setProcesando(true);
        setMensaje('📸 Procesando y subiendo foto...');
        setColorEstado('text-blue-400');

        try {
          // 1. CAPTURAR FOTO DEL VIDEO
          // Buscamos el elemento <video> que genera la librería
          const videoElement = document.querySelector('video');
          let fotoBase64 = '';

          if (videoElement) {
            const canvas = document.createElement("canvas");
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;
            const ctx = canvas.getContext("2d");
            // Dibujamos el frame actual
            if (ctx) {
                ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                fotoBase64 = canvas.toDataURL("image/jpeg", 0.7); // Calidad 70%
            }
          }

          // 2. ENVIAR AL SERVIDOR (Server Action)
          const respuesta = await registrarAsistencia(codigoLeido, fotoBase64);

          if (respuesta.success) {
            setMensaje(respuesta.message || 'Éxito');
            setColorEstado('text-green-500');
            // Sonido de éxito (opcional)
            const audio = new Audio('/success.mp3'); // Si tuvieras uno
            // audio.play().catch(() => {}); 
          } else {
            setMensaje(respuesta.message || 'Error');
            setColorEstado('text-red-500');
          }

        } catch (error) {
          console.error(error);
          setMensaje('Error de conexión');
          setColorEstado('text-red-500');
        }

        // 3. RESETEAR EL SISTEMA DESPUÉS DE 3 SEGUNDOS
        setTimeout(() => {
          setProcesando(false);
          setMensaje('Esperando siguiente...');
          setColorEstado('text-yellow-400');
        }, 3000);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
      <h1 className={`text-3xl font-bold mb-6 ${colorEstado}`}>
        {procesando ? 'Procesando...' : 'Kiosco de Asistencia'}
      </h1>
      
      <div className={`w-full max-w-sm aspect-square border-4 rounded-xl overflow-hidden shadow-lg relative transition-colors duration-300 ${procesando ? 'border-blue-500' : 'border-yellow-400'}`}>
        <Scanner 
            onScan={handleScan}
            allowMultiple={true} 
            scanDelay={2000}
            // Importante: Pausar el escáner visualmente si estamos procesando (opcional)
        />
        
        {procesando && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                <span className="text-white text-xl font-bold">⏳ Guardando...</span>
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