import { connectDB } from '../src/config/db';
import app from '../src/app';

// Vercel serverless: cache DB connection across invocations
let isConnected = false;

export default async function handler(req: any, res: any) {
  try {
    if (!isConnected) {
      await connectDB();
      isConnected = true;
    }
  } catch (err: any) {
    console.error('Vercel handler DB connection failed:', err.message);
    // Do not crash, let errorHandler middleware handle if needed
    // Return 500 if DB not connected for health checks to still work
    if (req.path === '/health' || req.path === '/api/health' || req.url?.includes('/health')) {
      // Allow health to report DB failure but not 500
    }
  }
  return app(req, res);
}
