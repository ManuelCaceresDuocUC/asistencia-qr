import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-black text-white relative overflow-hidden">
      
      {/* Fondo decorativo */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-800 via-black to-black opacity-50 z-0"></div>

      <div className="z-10 text-center space-y-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-transparent bg-clip-text">
          Control de Bandas
        </h1>
        <p className="text-gray-400 text-xl">Sistema de Asistencia QR</p>
        
        <div className="grid gap-6 mt-8 w-full max-w-xs mx-auto">
          <Link 
            href="/scan" 
            className="group relative flex items-center justify-center gap-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-4 px-8 rounded-xl text-xl transition-all shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.6)]"
          >
            📷 Registrar Entrada
          </Link>

          <Link 
            href="/dashboard" 
            className="flex items-center justify-center gap-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white font-semibold py-4 px-8 rounded-xl transition-all"
          >
            📋 Ver Historial
          </Link>
        </div>
      </div>
    </main>
  );
}