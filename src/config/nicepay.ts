import { config } from './index.js';

const ENDPOINTS = {
  sandbox: {
    api: 'https://sandbox-api.nicepay.co.kr/v1',
    sdk: 'https://pay.nicepay.co.kr/v1/js/',  // JS SDK는 항상 운영 도메인 사용
  },
  production: {
    api: 'https://api.nicepay.co.kr/v1',
    sdk: 'https://pay.nicepay.co.kr/v1/js/',
  },
} as const;

export const nicepayConfig = {
  ...ENDPOINTS[config.nicepay.mode],
  clientId: config.nicepay.clientId,
  secretKey: config.nicepay.secretKey,
  mode: config.nicepay.mode,

  timeouts: {
    connection: 5_000,
    approval: 30_000,
    general: 10_000,
  },

  paths: {
    approve: '/payments',
    cancel: '/payments/{tid}/cancel',
    netCancel: '/payments/netcancel',
    inquiryByTid: '/payments/{tid}',
    inquiryByOrderId: '/payments/find/{orderId}',
    checkAmount: '/check-amount/{tid}',
    accessToken: '/access-token',
    billingRegister: '/subscribe/regist',
    billingCharge: '/subscribe/{bid}/payments',
    billingExpire: '/subscribe/{bid}/expire',
  },

  webhookIps: ['121.133.126.86', '121.133.126.87'],
} as const;
