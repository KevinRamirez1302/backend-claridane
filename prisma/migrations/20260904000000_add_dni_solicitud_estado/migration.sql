-- ─────────────────────────────────────────────────────────────
-- Migración: add_dni_solicitud_estado
-- Añade columna Socio.dni, crea enum EstadoSolicitud y tabla Solicitud
-- ─────────────────────────────────────────────────────────────

-- 1. Agregar enum EstadoSolicitud
CREATE TYPE "EstadoSolicitud" AS ENUM ('pendiente', 'aceptada', 'rechazada');

-- 2. Agregar columna dni a Socio (temporalmente nullable para evitar error en filas existentes)
ALTER TABLE "Socio" ADD COLUMN "dni" TEXT;

-- 3. Rellenar dni con un valor único para socios existentes (evita violación de NOT NULL y UNIQUE)
UPDATE "Socio" SET "dni" = 'PENDIENTE-' || "id"::TEXT WHERE "dni" IS NULL;

-- 4. Hacer la columna NOT NULL
ALTER TABLE "Socio" ALTER COLUMN "dni" SET NOT NULL;

-- 5. Agregar índice UNIQUE sobre Socio.dni
CREATE UNIQUE INDEX "Socio_dni_key" ON "Socio"("dni");

-- 6. Crear tabla Solicitud
CREATE TABLE "Solicitud" (
    "id"             SERIAL NOT NULL,
    "nombre"         TEXT NOT NULL,
    "apellidos"      TEXT NOT NULL,
    "email"          TEXT NOT NULL,
    "telefono"       TEXT,
    "dni"            TEXT NOT NULL,
    "fechaNacimiento" TEXT NOT NULL,
    "plan"           "PlanId" NOT NULL,
    "estado"         "EstadoSolicitud" NOT NULL DEFAULT 'pendiente',
    "fechaSolicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Solicitud_pkey" PRIMARY KEY ("id")
);

-- 7. Crear tabla EquipoRival
CREATE TABLE "EquipoRival" (
    "id"        SERIAL NOT NULL,
    "nombre"    TEXT NOT NULL,
    "municipio" TEXT NOT NULL,
    "isla"      TEXT NOT NULL,
    "terrero"   TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "logo"      TEXT,

    CONSTRAINT "EquipoRival_pkey" PRIMARY KEY ("id")
);
