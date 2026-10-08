import 'dotenv/config';

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';

import { allowedOrigins } from './config/cors';
import { assertJwtSecrets } from './utils/jwt';
import { registerProcessHandlers } from './lib/gracefulShutdown';
import { errorHandler } from './middlewares/errorHandler';
import { notFoundHandler } from './middlewares/notFoundHandler';
import { apiRateLimiter } from './middlewares/rateLimiter';

import authRoutes from './routes/auth.routes';
import studentRoutes from './routes/student.routes';
import dailyLogRoutes from './routes/dailyLog.routes';
import chatRoutes from './routes/chat.routes';
import aiRoutes from './routes/ai.routes';
import schoolAdminRoutes from './routes/schoolAdmin.routes';
import supportRoutes from './routes/support.routes';
import foodAnalysisRoutes from './routes/foodAnalysis.routes';
import adminRoutes from './routes/admin.routes';
import publicRoutes from './routes/public.routes';
import { initFoodAnalysisScheduler } from './services/scheduler';

// Muhim muhit o'zgaruvchilarini tekshirish
const requiredEnvVars = ['DATABASE_URL'];
for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    throw new Error(`[FATAL] Muhim environment o'zgaruvchi topilmadi: ${key}`);
  }
}

// JWT kalitlari yo'q bo'lsa — darhol to'xtatish
assertJwtSecrets();

const app: Express = express();
const port = Number(process.env.PORT) || 5000;
const isProduction = process.env.NODE_ENV === 'production';

if (process.env.TRUST_PROXY === 'true' || isProduction) {
  app.set('trust proxy', 1);
}

// 1) CORS — barcha middleware va routelardan OLDIN
app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use('/api', apiRateLimiter);

app.get(['/health', '/api/health'], (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'Yordamchi Backend API ishlamoqda',
    version: '1.0.0',
  });
});

// Dual mounting: /api/... hamda /... (proxy mosligi uchun)
app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/v1/auth', authRoutes);

app.use('/students', studentRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/v1/students', studentRoutes);

app.use('/daily-logs', dailyLogRoutes);
app.use('/api/daily-logs', dailyLogRoutes);
app.use('/api/v1/daily-logs', dailyLogRoutes);

app.use('/chats', chatRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/v1/chats', chatRoutes);

app.use('/ai', aiRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/v1/ai', aiRoutes);

app.use('/school-admin', schoolAdminRoutes);
app.use('/api/school-admin', schoolAdminRoutes);
app.use('/api/v1/school-admin', schoolAdminRoutes);

app.use('/support', supportRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/v1/support', supportRoutes);

app.use('/food-analysis', foodAnalysisRoutes);
app.use('/api/food-analysis', foodAnalysisRoutes);
app.use('/api/v1/food-analysis', foodAnalysisRoutes);

app.use('/admin', adminRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/v1/admin', adminRoutes);

app.use('/public', publicRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/v1/public', publicRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  if (!isProduction) {
    console.log('[socket.io] Ulandi:', socket.id);
  }

  socket.on('disconnect', () => {
    if (!isProduction) {
      console.log('[socket.io] Uzildi:', socket.id);
    }
  });
});

registerProcessHandlers(httpServer, io);

if (require.main === module) {
  httpServer.listen(port, () => {
    console.log();
    console.log();
    initFoodAnalysisScheduler();
  });
}

export { app, httpServer, io };
