# 🏆 Club de Lucha Aridane — API REST (Backend)

API REST construida con **Node.js + Express + TypeScript + Prisma + PostgreSQL**.

---

## 🚀 Arranque Rápido (Desarrollo Local)

### 1. Requisitos
- [Node.js 20+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (para PostgreSQL local)
- [pnpm](https://pnpm.io/)
- Cuenta gratuita en [Cloudinary](https://cloudinary.com/)

### 2. Instalar dependencias
```bash
pnpm install
```

### 3. Configurar variables de entorno
El archivo `.env` ya está creado con valores de desarrollo. Edita las credenciales de Cloudinary:
```env
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

### 4. Levantar PostgreSQL con Docker
```bash
docker compose -f docker-compose.dev.yml up -d
```

### 5. Crear la base de datos y tablas
```bash
pnpm db:migrate
# Cuando te pregunte nombre de migración: "init"
```

### 6. Cargar datos iniciales (seed)
```bash
pnpm db:seed
```
Esto creará el admin inicial (`admin / 123456`), los planes de membresía y datos de ejemplo.

### 7. Arrancar el servidor en modo desarrollo
```bash
pnpm dev
```
El servidor estará en **http://localhost:3000**

---

## 📡 Endpoints Disponibles

| Módulo | Base URL |
|---|---|
| Auth | `POST /api/auth/admin/login` |
| Noticias | `GET /api/noticias` |
| Plantilla | `GET /api/plantilla` |
| Clasificación | `GET /api/clasificacion` |
| Partidos | `GET /api/partidos` |
| Socios | `POST /api/socios/registro` |
| Planes | `GET /api/planes` |
| Patrocinadores | `GET /api/patrocinadores` |
| Historia | `GET /api/historia` |
| Galería | `GET /api/galeria` |
| FAQs | `GET /api/faqs` |
| Contacto | `POST /api/contacto` |
| Health | `GET /health` |

---

## 🛠️ Scripts Disponibles

```bash
pnpm dev          # Desarrollo con hot reload (tsx watch)
pnpm build        # Compilar TypeScript → dist/
pnpm start        # Producción (dist/app.js)
pnpm db:migrate   # Crear migración nueva (desarrollo)
pnpm db:deploy    # Aplicar migraciones (producción)
pnpm db:seed      # Poblar la BD con datos iniciales
pnpm db:studio    # Abrir Prisma Studio (GUI de la BD)
```

---

## 🚀 Despliegue en VPS (Producción)

```bash
git clone <repo> /var/www/clubaridane-api
cd /var/www/clubaridane-api
pnpm install
cp .env.example .env && nano .env   # Editar con credenciales de producción
pnpm db:deploy                       # Aplica las migraciones
pnpm db:seed                         # Solo la primera vez
pnpm build
pm2 start ecosystem.config.js --env production
```

---

## 🔐 Autenticación

La API usa **JWT con doble token**:
- `accessToken` (15 min) → se envía en el header `Authorization: Bearer <token>`
- `refreshToken` (7 días) → se almacena en una cookie `HttpOnly` automáticamente

```bash
# Login de admin
curl -X POST http://localhost:3000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}'
```
