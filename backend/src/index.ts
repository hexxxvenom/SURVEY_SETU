import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import 'express-async-errors';

import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import surveyRoutes from './routes/surveys';
import responseRoutes from './routes/responses';

dotenv.config();

// SECURITY: Crash immediately if critical env vars are missing
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set. Server cannot start.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Security: Helmet sets secure HTTP headers (X-Content-Type-Options, HSTS, X-Frame-Options, etc.)
app.use(helmet());

// Performance: Gzip compress all responses (~70% payload reduction for JSON)
app.use(compression());

// Security: Restrict CORS to known origins only
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
}));

// Security: Limit request body size to prevent DoS via massive payloads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files statically (with helmet protection headers)
app.use('/uploads', express.static('uploads'));

// Setup routes
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/surveys', surveyRoutes);
app.use('/responses', responseRoutes);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global Error Handler – never leak stack traces to the client
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ 
    error: statusCode === 500 ? 'Internal Server Error' : err.message 
  });
});

app.listen(PORT, () => {
  console.log(`SurveySetu API running on port ${PORT}`);
});
