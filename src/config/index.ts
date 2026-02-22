import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '3100', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',

  nicepay: {
    clientId: process.env.NICEPAY_CLIENT_ID || '',
    secretKey: process.env.NICEPAY_SECRET_KEY || '',
    mode: (process.env.NICEPAY_MODE || 'sandbox') as 'sandbox' | 'production',
  },

  db: {
    url: process.env.DB_URL || './data/gateway.db',
  },

  security: {
    apiKeys: (process.env.API_KEYS || '').split(',').filter(Boolean),
  },

  redirectUrls: {
    defaultSuccess: process.env.DEFAULT_SUCCESS_URL || 'http://localhost:3000/payment/success',
    defaultFailure: process.env.DEFAULT_FAILURE_URL || 'http://localhost:3000/payment/failure',
  },
} as const;
