// Namespaced config factory consumed by ConfigModule.forRoot({ load: [configuration] }).
// Feature modules should inject ConfigService and read config.get('app.port') etc.
// rather than touching process.env directly — this is the seam that makes it
// possible to swap the config source later (e.g. a secrets manager) without
// touching feature code.
export default () => ({
  app: {
    env: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '4000', 10),
    corsOrigin: (process.env.CORS_ORIGIN ?? 'http://localhost:3000').split(','),
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    logLevel: process.env.LOG_LEVEL ?? 'info',
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    accessTokenTtl: '15m',
    refreshTokenTtl: '7d',
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
  btcpay: {
    url: process.env.BTCPAY_URL,
    apiKey: process.env.BTCPAY_API_KEY,
    storeId: process.env.BTCPAY_STORE_ID,
    webhookSecret: process.env.BTCPAY_WEBHOOK_SECRET,
  },
  throttle: {
    ttlMs: parseInt(process.env.THROTTLE_TTL_MS ?? '60000', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
  },
});
