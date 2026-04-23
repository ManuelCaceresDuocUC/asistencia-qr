import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Tu lista de personal (la que manda)
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
    { nombre: "Tapia", qrCode: "XTapia"},
    { nombre: "Ahumada", qrCode: "591912-6" },
    { nombre: "Torres", qrCode: "593712-3" },
    { nombre: "Bravo", qrCode: "602614-2" },
    { nombre: "Aguila", qrCode: "602414-7" },
    { nombre: "Perez", qrCode: "617517-7" },
    { nombre: "Araya", qrCode: "616217-5" },
    { nombre: "Tarifeño", qrCode: "DCabrera"},
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
    { nombre: "Abarca", qrCode: "628225-7" },
    { nombre: "Garcia", qrCode: "628825-1" },
    { nombre: "Vidal", qrCode: "FVidal"},
    { nombre: "Pastor", qrCode: "FPastor"},
    { nombre: "Sazo", qrCode: "BSazo"},
    { nombre: "Guerra", qrCode: "SGuerra"},
    { nombre: "Ramirez", qrCode: "PRamirez"}
  ];

  console.log('🌱 Comenzando la sincronización total...')

  // --- PASO 1: Obtener todos los QR que queremos conservar ---
  const qrsAKeep = personal.map(p => p.qrCode);

  // --- PASO 2: Borrar de la DB los que NO están en la lista ---
  const deleted = await prisma.user.deleteMany({
    where: {
      qrCode: {
        notIn: qrsAKeep
      }
    }
  });
  
  if (deleted.count > 0) {
    console.log(`🗑️ Se eliminaron ${deleted.count} usuarios que ya no están en la lista.`);
  }

  // --- PASO 3: Ejecutar el upsert para actualizar o crear los actuales ---
  for (const persona of personal) {
    const usuario = await prisma.user.upsert({
      where: { qrCode: persona.qrCode }, 
      update: {
        nombre: persona.nombre 
      }, 
      create: { 
        nombre: persona.nombre,
        qrCode: persona.qrCode
      }
    })
    console.log(`✅ Usuario procesado: ${usuario.nombre}`)
  }

  console.log('🏁 Sincronización finalizada con éxito.')
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