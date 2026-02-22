export const RESULT_CODE = {
  SUCCESS: '0000',
} as const;

export const PAYMENT_STATUS = {
  READY: 'ready',
  PAID: 'paid',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  PARTIAL_CANCELLED: 'partialCancelled',
  EXPIRED: 'expired',
} as const;

export const PAY_METHODS = [
  'card',
  'bank',
  'vbank',
  'cellphone',
  'naverpay',
  'kakaopay',
  'samsungpay',
  'cardAndEasyPay',
] as const;

export type PayMethod = typeof PAY_METHODS[number];

export const CARD_CODES: Record<string, string> = {
  '01': '비씨',
  '02': 'KB국민',
  '03': '하나(외환)',
  '04': '삼성',
  '06': '신한',
  '07': '현대',
  '08': '롯데',
  '11': 'NH농협',
  '12': '수협',
  '13': '제주',
  '14': '씨티',
  '15': '우리',
  '16': '광주',
  '21': '카카오뱅크',
  '22': '케이뱅크',
};

export const BANK_CODES: Record<string, string> = {
  '002': '산업은행',
  '003': '기업은행',
  '004': 'KB국민은행',
  '007': '수협은행',
  '011': 'NH농협은행',
  '020': '우리은행',
  '023': 'SC제일은행',
  '027': '한국씨티은행',
  '031': '대구은행',
  '032': '부산은행',
  '034': '광주은행',
  '035': '제주은행',
  '037': '전북은행',
  '039': '경남은행',
  '045': '새마을금고',
  '048': '신협',
  '071': '우체국',
  '081': '하나은행',
  '088': '신한은행',
  '089': '케이뱅크',
  '090': '카카오뱅크',
  '092': '토스뱅크',
};
