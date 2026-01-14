// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  
  // Lista de personal para cargar
  const personal = [
    { nombre: "Z1° M. Cáceres", qrCode: "19.665.507-7", email: "manuel.caceresmarin@gmail.com" },
    { nombre: "C1° C. Ahumada", qrCode: "17.225.375-k", email: "capitan@barco.com" },
    ]

  console.log('🌱 Comenzando la carga de datos...')

  for (const persona of personal) {
    const usuario = await prisma.user.upsert({
      where: { qrCode: persona.qrCode }, // Busca por QR
      update: {}, // Si existe, no hace nada
      create: {   // Si no existe, lo crea
        nombre: persona.nombre,
        email: persona.email,
        qrCode: persona.qrCode
      }
    })
    console.log(`✅ Usuario creado/verificado: ${usuario.nombre} (QR: ${usuario.qrCode})`)
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