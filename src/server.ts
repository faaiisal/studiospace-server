import { env } from './config/env';
import { connectDB } from './config/db';
import app from './app';

const startServer = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('MongoDB connected');

    app.listen(env.PORT, () => {
      console.log(`🚀 StudioSpace Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
      console.log(`📍 Health check: http://localhost:${env.PORT}/health`);
      console.log(`🔗 Frontend URL: ${env.FRONTEND_URL}`);
    });
  } catch (error: any) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown handlers
process.on('unhandledRejection', (err: any) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  process.exit(1);
});

process.on('uncaughtException', (err: any) => {
  console.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

