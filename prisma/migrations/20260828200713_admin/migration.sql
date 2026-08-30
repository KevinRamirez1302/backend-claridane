-- CreateEnum
CREATE TYPE "CategoriaNoticia" AS ENUM ('club', 'competicion', 'fichaje', 'institucional');

-- CreateEnum
CREATE TYPE "PlanId" AS ENUM ('socio', 'socio_premium');

-- CreateEnum
CREATE TYPE "NivelPatrocinador" AS ENUM ('principal', 'oficial', 'colaborador');

-- CreateTable
CREATE TABLE "Admin" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Socio" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "telefono" TEXT,
    "plan" "PlanId" NOT NULL,
    "numSocio" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "eliminado" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "renovadoEn" TIMESTAMP(3),

    CONSTRAINT "Socio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "adminId" INTEGER,
    "socioId" INTEGER,
    "expira" TIMESTAMP(3) NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Noticia" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "resumen" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "imagen" TEXT NOT NULL,
    "imagenPublicId" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL,
    "categoria" "CategoriaNoticia" NOT NULL,
    "autor" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Noticia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Jugador" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "clasificaciones" TEXT[],
    "equipos" TEXT[],
    "foto" TEXT NOT NULL,
    "fotoPublicId" TEXT,
    "nacionalidad" TEXT NOT NULL,
    "edad" INTEGER,
    "peso" DOUBLE PRECISION,
    "altura" DOUBLE PRECISION,
    "luchadas" INTEGER,
    "puntosFavor" INTEGER,
    "puntosContra" INTEGER,
    "bio" TEXT,

    CONSTRAINT "Jugador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partido" (
    "id" SERIAL NOT NULL,
    "esLocal" BOOLEAN NOT NULL,
    "rival" TEXT NOT NULL,
    "logoRival" TEXT NOT NULL,
    "competicion" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "resultado" TEXT,
    "esProximo" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Partido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PosicionClasificacion" (
    "id" SERIAL NOT NULL,
    "posicion" INTEGER NOT NULL,
    "equipo" TEXT NOT NULL,
    "luchadas" INTEGER NOT NULL,
    "ganadas" INTEGER NOT NULL,
    "empatadas" INTEGER NOT NULL,
    "perdidas" INTEGER NOT NULL,
    "puntosFavor" INTEGER NOT NULL,
    "puntosContra" INTEGER NOT NULL,
    "puntos" INTEGER NOT NULL,
    "esClub" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PosicionClasificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patrocinador" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "logo" TEXT NOT NULL,
    "logoPublicId" TEXT,
    "url" TEXT,
    "nivel" "NivelPatrocinador" NOT NULL,

    CONSTRAINT "Patrocinador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HitoHistorico" (
    "id" SERIAL NOT NULL,
    "anio" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "imagen" TEXT,
    "imagenPublicId" TEXT,

    CONSTRAINT "HitoHistorico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElementoGaleria" (
    "id" SERIAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT,
    "miniatura" TEXT,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElementoGaleria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FAQ" (
    "id" SERIAL NOT NULL,
    "pregunta" TEXT NOT NULL,
    "respuesta" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "FAQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanMembresia" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "precio" DOUBLE PRECISION NOT NULL,
    "beneficios" TEXT[],
    "destacado" BOOLEAN NOT NULL,
    "color" TEXT NOT NULL,

    CONSTRAINT "PlanMembresia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_username_key" ON "Admin"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Socio_email_key" ON "Socio"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Socio_numSocio_key" ON "Socio"("numSocio");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_socioId_fkey" FOREIGN KEY ("socioId") REFERENCES "Socio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
