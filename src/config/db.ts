import mongoose from 'mongoose';
import { env } from './env';

export const connectDB = async (): Promise<void> => {
  try {
    // Vercel serverless: reuse existing connection
    if (mongoose.connection.readyState === 1) {
      console.log('MongoDB already connected');
      return;
    }
    // Explicitly set dbName to 'studiospace' to avoid falling back to 'test' when Atlas URI has empty path
    const conn = await mongoose.connect(env.MONGO_URI, {
      dbName: 'studiospace',
    } as any);
    console.log(`MongoDB Connected: ${conn.connection.host} / ${conn.connection.name}`);
  } catch (error: any) {
    console.error(`MongoDB connection error: ${error.message}`);
    throw error;
  }
};

