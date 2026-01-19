// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {

  // Lista de personal (Sin email, como pediste)
  const personal = [
    { nombre: "SO P. Cabezas", qrCode: "659196-8" },
    { nombre: "SO R. Sepulveda", qrCode: "663898-8" },
    { nombre: "S2 M. Vallejos", qrCode: "585709-6" },
    { nombre: "S2 M. Leon", qrCode: "585809-7" },
    { nombre: "S2 F. Galarce", qrCode: "584609-7" },
    { nombre: "S2 P. Ramirez", qrCode: "585509-1" },
    { nombre: "S2 C. Llancabur", qrCode: "585009-9" },
    { nombre: "S2 J. Lewis", qrCode: "603910-6" },
    { nombre: "C1 R. Olivares", qrCode: "612311-8" },
    { nombre: "C1 J. Toledo", qrCode: "612911-2" },
    { nombre: "C1 R. Arratia", qrCode: "611111-8" },
    { nombre: "C1 C. Ahumada", qrCode: "591912-6" },
    { nombre: "C1 S. Torres", qrCode: "593712-3" },
    { nombre: "C1 A. Vergara", qrCode: "603814-2" },
    { nombre: "C1 F. Bravo", qrCode: "602614-2" },
    { nombre: "C1 C. Aguila", qrCode: "602414-7" },
    { nombre: "C2 F. Perez", qrCode: "617517-5" },
    { nombre: "C2 M. Araya", qrCode: "616217-5" },
    { nombre: "C2 D. Cabrera", qrCode: "DCabrera"},
    { nombre: "C2 O. Martinez", qrCode: "OMartinez"},
    { nombre: "C2 N. Manriquez", qrCode: "648220-9" },
    { nombre: "C2 B. Astudillo", qrCode: "628121-7" },
    { nombre: "C2 P. Villar", qrCode: "625222-7" },
    { nombre: "C2 Peña", qrCode: "FPeña"},
    { nombre: "C2 D. Orellana", qrCode: "624722-3" },
    { nombre: "Z1 M. Cáceres", qrCode: "609923-6" },
    { nombre: "Z1 D. Carvajal", qrCode: "610023-3" },
    { nombre: "Z1 B. Cordova", qrCode: "597224-6" },
    { nombre: "Z1 J. Contreras", qrCode: "628525-4" },
    { nombre: "Z1 N. Vega", qrCode: "629725-4" },
    { nombre: "Z1 A. Abarca", qrCode: "628225-7" },
    { nombre: "Z1 A. Leiton", qrCode: "629025-8" },
    { nombre: "Z1 A. Garcia", qrCode: "628825-1" },
    { nombre: "Z1 F. Vidal", qrCode: "FVidal"},
    { nombre: "Z1 Pastor", qrCode: "FPastor"},
    { nombre: "Z1 Sazo", qrCode: "BSazo"},
    { nombre: "Z1 Guzman", qrCode: "CGuzman"},
    { nombre: "Z1 Rodriguez", qrCode: "NRodriguez"},
    { nombre: "Z1 Guerra", qrCode: "SGuerra"}
  ];

  console.log('🌱 Comenzando la carga de datos...')

  for (const persona of personal) {
    const usuario = await prisma.user.upsert({
      where: { qrCode: persona.qrCode }, // Busca por QR
      update: {}, // Si existe, no hace nada
      create: {   // Si no existe, lo crea
        nombre: persona.nombre,
        qrCode: persona.qrCode
        // Ya no enviamos email aquí
      }
    })
    console.log(`✅ Usuario verificado: ${usuario.nombre} (QR: ${usuario.qrCode})`)
  }

  console.log('🏁 Carga finalizada.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })