import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import studioRoutes from './modules/studios/studio.routes';
import bookingRoutes from './modules/bookings/booking.routes';
import wishlistRoutes from './modules/wishlist/wishlist.routes';

const app = express();

// Security
app.use(helmet());
app.use(cookieParser());

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS
const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    // Allow no origin (mobile apps, curl)
    if (!origin) return callback(null, true);

    // Check against allowlist
    if (env.CLIENT_URLS.includes(origin) || env.CLIENT_URLS.includes('*')) {
      return callback(null, true);
    }

    // In dev, allow all localhost
    if (!env.isProduction && origin.includes('localhost')) {
      return callback(null, true);
    }

    // Allow vercel preview domains if configured with wildcard logic?
    // For MVP, allow any vercel.app if FRONTEND_URL is vercel
    if (origin.includes('vercel.app')) {
      return callback(null, true);
    }

    console.warn(`CORS blocked origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  message: { success: false, message: 'Too many requests, try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts, try later' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', generalLimiter);

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'StudioSpace API is running',
    timestamp: new Date().toISOString(),
    env: env.NODE_ENV,
  });
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'StudioSpace API is running',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/studios', studioRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/wishlist', wishlistRoutes);

// Root
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to StudioSpace API - Find Your Space. Create Something Extraordinary.',
    docs: '/api/health',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      studios: '/api/studios',
      bookings: '/api/bookings',
      wishlist: '/api/wishlist',
    },
  });
});

// 404 + error handler
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

