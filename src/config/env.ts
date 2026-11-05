import dotenv from 'dotenv';
dotenv.config();

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] || fallback;
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, fallback: string = ''): string {
  return process.env[name] || fallback;
}

const rawMongoUri = process.env.MONGO_URI || process.env.MONGODB_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/studiospace';

export const env = {
  NODE_ENV: optionalEnv('NODE_ENV', 'development'),
  PORT: parseInt(optionalEnv('PORT', '5000'), 10),
  MONGO_URI: requireEnv('MONGO_URI', rawMongoUri),
  // Keep alias for backward compatibility with docs that use MONGODB_URL
  MONGODB_URL: rawMongoUri,
  JWT_SECRET: (() => {
    const secret = requireEnv('JWT_SECRET', 'dev-secret-change-in-prod');
    if (optionalEnv('NODE_ENV', 'development') === 'production' && secret === 'dev-secret-change-in-prod') {
      throw new Error('JWT_SECRET must be set to a strong random value in production');
    }
    return secret;
  })(),
  JWT_EXPIRES_IN: optionalEnv('JWT_EXPIRES_IN', '1d'),
  BCRYPT_SALT_ROUNDS: parseInt(optionalEnv('BCRYPT_SALT_ROUNDS', '10'), 10),
  FRONTEND_URL: optionalEnv('FRONTEND_URL', 'http://localhost:3000'),
  CLIENT_URLS: optionalEnv('CLIENT_URLS', 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  GOOGLE_CLIENT_ID: optionalEnv('GOOGLE_CLIENT_ID'),
  GOOGLE_CLIENT_SECRET: optionalEnv('GOOGLE_CLIENT_SECRET'),
  GOOGLE_CALLBACK_URL: optionalEnv(
    'GOOGLE_CALLBACK_URL',
    'http://localhost:5000/api/auth/google/callback'
  ),
  isProduction: optionalEnv('NODE_ENV', 'development') === 'production',
};

