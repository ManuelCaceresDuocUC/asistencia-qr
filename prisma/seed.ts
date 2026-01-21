// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {

  // Lista de personal (Sin email, como pediste)
  const personal = [
    { nombre: "Sepulveda", qrCode: "663898-8" },
    { nombre: "Vallejos", qrCode: "585709-5" },
    { nombre: "Leon", qrCode: "585809-7" },
    { nombre: "Galarce", qrCode: "584609-7" },
    { nombre: "Llancabur", qrCode: "585009-9" },
    { nombre: "Lewis", qrCode: "603910-6" },
    { nombre: "Olivares", qrCode: "612311-8" },
    { nombre: "Toledo", qrCode: "612911-2" },
    { nombre: "Arratia", qrCode: "611111-8" },
    { nombre: "Zambrano", qrCode: "XZambrano"},
    { nombre: "Tapia", qrCode: "XTapia"},
    { nombre: "Ahumada", qrCode: "591912-6" },
    { nombre: "Torres", qrCode: "593712-3" },
    { nombre: "Bravo", qrCode: "602614-2" },
    { nombre: "Aguila", qrCode: "602414-7" },
    { nombre: "Perez", qrCode: "617517-7" },
    { nombre: "Araya", qrCode: "616217-5" },
    { nombre: "Cabrera", qrCode: "DCabrera"},
    { nombre: "Espinoza", qrCode: "JEspinoza"},
    { nombre: "Martinez", qrCode: "OMartinez"},
    { nombre: "Delgado", qrCode: "ADelgado"},
    { nombre: "Manriquez", qrCode: "648220-8" },
    { nombre: "Astudillo", qrCode: "628121-7" },
    { nombre: "Villar", qrCode: "625222-7" },
    { nombre: "Peña", qrCode: "FPeña"},
    { nombre: "Cáceres", qrCode: "609923-6" },
    { nombre: "Carvajal", qrCode: "610023-3" },
    { nombre: "Ojeda", qrCode: "DOjeda"},
    { nombre: "Cordova", qrCode: "597224-6" },
    { nombre: "Díaz", qrCode: "JDiaz"},
    { nombre: "Abarca", qrCode: "628225-7" },
    { nombre: "Leiton", qrCode: "629025-8" },
    { nombre: "Garcia", qrCode: "628825-1" },
    { nombre: "Vidal", qrCode: "FVidal"},
    { nombre: "Pastor", qrCode: "FPastor"},
    { nombre: "Sazo", qrCode: "BSazo"},
    { nombre: "Guzman", qrCode: "CGuzman"},
    { nombre: "Rodriguez", qrCode: "NRodriguez"},
    { nombre: "Guerra", qrCode: "SGuerra"}
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