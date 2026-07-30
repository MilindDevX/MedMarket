import 'dotenv/config';
import './config/env.ts';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import prisma from './config/prisma.ts';
import { generalLimiter, authLimiter } from './middleware/rateLimit.middleware.ts';
import { globalErrorHandler } from './middleware/errorHandler.middleware.ts';
import { mountSwagger } from './config/swagger.ts';
import { initExpiryQueue, shutdownExpiryQueue } from './queues/expiry.queue.ts';
import { scheduleNightlyExpiryJob } from './queues/expiry.scheduler.ts';

import authRouter         from './routes/auth.routes.ts';
import pharmacyRouter     from './routes/pharmacy.routes.ts';
import adminRouter        from './routes/admin.routes.ts';
import medicineRouter     from './routes/medicine.routes.ts';
import inventoryRouter    from './routes/inventory.routes.ts';
import orderRouter        from './routes/order.routes.ts';
import storeRouter        from './routes/store.routes.ts';
import addressRouter      from './routes/address.routes.ts';
import consumerRouter     from './routes/consumer.routes.ts';
import notificationRouter from './routes/notification.routes.ts';
import documentRouter     from './routes/document.routes.ts';
import aiRouter           from './routes/ai.routes.ts';

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());

// SEC-8: Support comma-separated CORS origins for staging + production
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());
app.use(cors({
  origin:  allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// CQ-7: Use 'combined' format in production for structured logs
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// SEC-1: Limit JSON body size to prevent DoS via oversized payloads
app.use(express.json({ limit: '1mb' }));
app.use(generalLimiter);

// ── API Docs — available at /api/docs ──
mountSwagger(app);

app.get('/', (_req, res) => res.redirect('/api/docs'));

app.get('/health', (_req, res) => {
  res.json({ status:'ok', timestamp:new Date().toISOString(), service:'MedMarket API', version:'1.0.0' });
});

app.use('/api/v1/auth',               authLimiter, authRouter);
app.use('/api/v1/pharmacy/inventory', inventoryRouter);
app.use('/api/v1/pharmacy/documents', documentRouter);
app.use('/api/v1/pharmacy',           pharmacyRouter);
app.use('/api/v1/admin',              adminRouter);
app.use('/api/v1/medicines',          medicineRouter);
app.use('/api/v1/orders',             orderRouter);
app.use('/api/v1/stores',             storeRouter);
app.use('/api/v1/consumer/addresses', addressRouter);
app.use('/api/v1/notifications',      notificationRouter);
app.use('/api/v1/consumer',           consumerRouter);
app.use('/api/v1/ai',                 aiRouter);

// ── Global error handler — must be registered LAST ──
app.use(globalErrorHandler);

async function main() {
  await prisma.$connect();
  console.log('✅ Database connected');

  // ── BullMQ — expiry notification queue ──
  initExpiryQueue().catch(e => console.error(e));
  scheduleNightlyExpiryJob().catch(e => console.error(e));

  app.listen(PORT, () => {
    console.log(`🚀 MedMarket API running on port ${PORT}`);
    
    // Keep backend warm (Render free tier sleeps after 15 mins of inactivity)
    const backendUrl = process.env.NODE_ENV === 'production' 
      ? 'https://medmarket-g08v.onrender.com' 
      : `http://localhost:${PORT}`;
      
    setInterval(() => {
      fetch(`${backendUrl}/health`).catch(() => {});
    }, 14 * 60 * 1000); // 14 minutes
  });
}

// ── Graceful shutdown ──────────────────────────────────────────────────────
async function shutdown(signal: string) {
  console.log(`\n${signal} received — shutting down gracefully`);
  await shutdownExpiryQueue();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

main();
