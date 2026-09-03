import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // ── Admin inicial ────────────────────────────────────────────────────────
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error(
      '❌ ADMIN_PASSWORD no está definida en .env.\n' +
      'Añade: ADMIN_PASSWORD=tu_contraseña_segura'
    );
  }

  const adminExistente = await prisma.admin.findUnique({ where: { username: 'admin' } });
  if (!adminExistente) {
    await prisma.admin.create({
      data: {
        username: 'admin',
        passwordHash: await bcrypt.hash(adminPassword, 12),
      },
    });
    console.log('✅ Admin creado: admin / [contraseña desde .env]');
  } else {
    await prisma.admin.update({
      where: { username: 'admin' },
      data: { passwordHash: await bcrypt.hash(adminPassword, 12) },
    });
    console.log('✅ Admin existente actualizado con nueva contraseña');
  }

  // ── Planes de membresía ──────────────────────────────────────────────────
  await prisma.planMembresia.upsert({
    where: { id: 'socio' },
    update: {},
    create: {
      id: 'socio',
      nombre: 'Socio',
      precio: 60,
      beneficios: [
        'Entrada gratuita a todos los partidos en casa',
        'Carnet de socio digital y físico',
        '10% de descuento en tienda oficial',
        'Acceso a la app exclusiva del club',
        'Voto en la Asamblea General',
        'Newsletter mensual del club',
      ],
      destacado: false,
      color: 'club-green',
    },
  });

  await prisma.planMembresia.upsert({
    where: { id: 'socio_premium' },
    update: {},
    create: {
      id: 'socio_premium',
      nombre: 'Socio Premium',
      precio: 120,
      beneficios: [
        'Todo lo incluido en el plan Socio',
        'Acceso al área VIP del estadio',
        'Invitaciones a eventos exclusivos del club',
        'Asistencia a entrenamientos (1 vez al mes)',
        '20% de descuento en tienda oficial',
        'Contenido digital premium y behind-the-scenes',
        'Prioridad en la compra de entradas para partidos especiales',
        'Meet & greet con el equipo (2 veces por temporada)',
      ],
      destacado: true,
      color: 'club-orange',
    },
  });
  console.log('✅ Planes de membresía creados');

  // ── Noticias ─────────────────────────────────────────────────────────────
  const noticiaCount = await prisma.noticia.count();
  if (noticiaCount === 0) {
    await prisma.noticia.createMany({
      data: [
        {
          titulo: 'El CL Aridane disputa los cuartos de la Liga DISA ante el CL Tegueste en el Camilo León',
          resumen: 'El terrero de Los Llanos acogió la gran eliminatoria regional con destacada actuación del tridente Raúl Peñate, Carlos Matoso y Carlos Jiménez.',
          contenido: 'El terrero Camilo León de Los Llanos de Aridane vibró con el duelo de cuartos de final de la Liga DISA – Gobierno de Canarias entre el CL Aridane y el CL Tegueste de Tenerife...',
          imagen: '/images/noticias/tegueste.jpg',
          fecha: new Date('2026-06-18T20:30:00Z'),
          categoria: 'competicion',
          autor: 'Departamento de Prensa',
        },
        {
          titulo: 'Presentación oficial de la temporada 2025/2026 en el Camilo León con luchada ante el CL Almogarén',
          resumen: 'El club presentó todas sus categorías, desde la Escuela de Lucha Llanoresa hasta la Primera Categoría, ante un terrero abarrotado.',
          contenido: 'El Club de Lucha Aridane celebró su presentación oficial de la temporada 2025-2026 en el terrero Camilo León...',
          imagen: '/images/noticias/presentacion.jpg',
          fecha: new Date('2025-09-20T19:00:00Z'),
          categoria: 'club',
          autor: 'Junta Directiva',
        },
        {
          titulo: 'Emocionante derbi insular del Valle de Aridane frente al CL Tamanca-Las Manchas',
          resumen: 'Gran ambiente en las gradas y duelos de alto voltaje en el enfrentamiento de la competición insular de La Palma.',
          contenido: 'Una vez más, el derbi insular entre el CL Aridane y el CL Tamanca-Las Manchas demostró la grandeza y tradición de la lucha canaria en La Palma...',
          imagen: '/images/noticias/derbi.jpg',
          fecha: new Date('2026-04-12T21:00:00Z'),
          categoria: 'competicion',
          autor: 'Redacción Deportiva',
        },
      ],
    });
    console.log('✅ Noticias de ejemplo creadas');
  }

  // ── Plantilla / Jugadores ─────────────────────────────────────────────────
  const plantillaPath = path.resolve(__dirname, '../../clubAridane/src/data/plantilla.json');
  if (fs.existsSync(plantillaPath)) {
    const rawPlantilla = fs.readFileSync(plantillaPath, 'utf-8');
    const jugadoresData = JSON.parse(rawPlantilla);
    
    console.log(`⏳ Insertando ${jugadoresData.length} miembros de la plantilla...`);

    for (const item of jugadoresData) {
      await prisma.jugador.upsert({
        where: { id: item.id },
        update: {
          nombre: item.nombre,
          clasificaciones: item.clasificaciones || [],
          equipos: item.equipos || [],
          foto: item.foto || '',
          nacionalidad: item.nacionalidad || 'Español',
          edad: item.edad ?? null,
          peso: item.peso ?? null,
          altura: item.altura ?? null,
          luchadas: item.luchadas ?? null,
          puntosFavor: item.puntosFavor ?? null,
          puntosContra: item.puntosContra ?? null,
          bio: item.bio ?? null,
        },
        create: {
          id: item.id,
          nombre: item.nombre,
          clasificaciones: item.clasificaciones || [],
          equipos: item.equipos || [],
          foto: item.foto || '',
          nacionalidad: item.nacionalidad || 'Español',
          edad: item.edad ?? null,
          peso: item.peso ?? null,
          altura: item.altura ?? null,
          luchadas: item.luchadas ?? null,
          puntosFavor: item.puntosFavor ?? null,
          puntosContra: item.puntosContra ?? null,
          bio: item.bio ?? null,
        },
      });
    }
    console.log(`✅ ${jugadoresData.length} miembros de la plantilla cargados correctamente`);
  } else {
    console.log('⚠️ No se encontró plantilla.json en la ruta especificada');
  }

  // ── FAQs ─────────────────────────────────────────────────────────────────
  const faqCount = await prisma.fAQ.count();
  if (faqCount === 0) {
    await prisma.fAQ.createMany({
      data: [
        {
          pregunta: '¿Cómo puedo hacerme socio?',
          respuesta: 'Puedes hacerte socio rellenando el formulario en nuestra web o acudiendo directamente al club.',
          orden: 1,
        },
        {
          pregunta: '¿Cuánto cuesta la cuota anual?',
          respuesta: 'La cuota de Socio es de 60€/año y la de Socio Premium es de 120€/año.',
          orden: 2,
        },
        {
          pregunta: '¿Qué beneficios tiene ser socio?',
          respuesta: 'Entrada gratuita a luchadas, carnet digital y físico, descuentos en tienda y voto en la Asamblea General.',
          orden: 3,
        },
      ],
    });
    console.log('✅ FAQs de ejemplo creadas');
  }

  // ── Clasificación ─────────────────────────────────────────────────────────
  const clasifCount = await prisma.posicionClasificacion.count();
  if (clasifCount === 0) {
    await prisma.posicionClasificacion.createMany({
      data: [
        { posicion: 1, equipo: 'CL Adargoma', luchadas: 14, ganadas: 11, empatadas: 1, perdidas: 2, puntosFavor: 142, puntosContra: 98, puntos: 23, esClub: false },
        { posicion: 2, equipo: 'CL Aridane', luchadas: 14, ganadas: 10, empatadas: 2, perdidas: 2, puntosFavor: 138, puntosContra: 102, puntos: 22, esClub: true },
        { posicion: 3, equipo: 'CL Tegueste', luchadas: 14, ganadas: 9, empatadas: 1, perdidas: 4, puntosFavor: 125, puntosContra: 110, puntos: 19, esClub: false },
        { posicion: 4, equipo: 'CL Tamanca', luchadas: 14, ganadas: 7, empatadas: 2, perdidas: 5, puntosFavor: 118, puntosContra: 115, puntos: 16, esClub: false },
      ],
    });
    console.log('✅ Clasificación de ejemplo creada');
  }

  // ── Partido próximo ───────────────────────────────────────────────────────
  const partidoCount = await prisma.partido.count();
  if (partidoCount === 0) {
    await prisma.partido.create({
      data: {
        esLocal: true,
        rival: 'CL Adargoma',
        logoRival: '/images/rivales/adargoma.png',
        competicion: 'Liga DISA',
        fecha: new Date('2026-09-15T19:00:00Z'),
        resultado: null,
        esProximo: true,
      },
    });
    console.log('✅ Próximo partido creado');
  }

  console.log('🎉 Seed completado con éxito');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
