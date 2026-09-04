import './config/env'; // Valida variables de entorno al arrancar
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { env } from './config/env';
import router from './routes/index';
import { errorHandler } from './middleware/errorHandler';
import { generalRateLimiter } from './middleware/rateLimiter';

const app = express();

// ── Proxy (Nginx en producción) ───────────────────────────────────────────────
// Necesario para que express-rate-limit lea la IP real del cliente y no la del proxy
app.set('trust proxy', 1);

// ── Seguridad ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true, // Necesario para enviar cookies (refresh token)
  })
);

// ── Parsers ──────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Logging ──────────────────────────────────────────────────────────────────
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// ── Rate Limiting general ────────────────────────────────────────────────────
app.use(generalRateLimiter);

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', env: env.NODE_ENV, timestamp: new Date().toISOString() });
});

// ── Rutas de la API ──────────────────────────────────────────────────────────
app.use('/api', router);

// ── 404 para rutas desconocidas ──────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Ruta no encontrada' },
  });
});

// ── Manejador global de errores ──────────────────────────────────────────────
app.use(errorHandler);

// ── Arranque del servidor ────────────────────────────────────────────────────
app.listen(env.PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║   🏆 Club de Lucha Aridane — API REST        ║
  ║   Entorno : ${env.NODE_ENV.padEnd(33)}║
  ║   Puerto  : ${String(env.PORT).padEnd(33)}║
  ║   CORS    : ${env.CORS_ORIGIN.padEnd(33)}║
  ╚══════════════════════════════════════════════╝
  `);
});

export default app;
