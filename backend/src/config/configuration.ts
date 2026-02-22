export const configuration = () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  jwt: {
    secret: process.env.JWT_SECRET,
    accessTtl: process.env.JWT_ACCESS_TTL || '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL || '7d',
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  signer: {
    url: process.env.SIGNER_URL || 'http://signer:3001',
    secret: process.env.SIGNER_SECRET,
  },
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
  },
  exports: {
    dir: process.env.EXPORT_DIR || '/tmp/exports',
    expiryDays: 7,
  },
});
