export const prepareSchema = {
  tags: ['Payments'],
  summary: '결제 준비',
  description: '결제를 준비하고 JS SDK 파라미터를 반환합니다. 금액이 서버에 저장되어 변조를 방지합니다.',
  security: [{ apiKey: [] }],
  body: {
    type: 'object',
    required: ['orderId', 'amount', 'goodsName', 'method', 'returnUrl'],
    properties: {
      orderId: { type: 'string', description: '고유 주문번호' },
      amount: { type: 'integer', minimum: 100, description: '결제금액 (원)' },
      goodsName: { type: 'string', maxLength: 40, description: '상품명' },
      method: {
        type: 'string',
        enum: ['card', 'bank', 'vbank', 'cellphone', 'naverpay', 'kakaopay', 'samsungpay', 'cardAndEasyPay'],
        description: '결제수단',
      },
      returnUrl: { type: 'string', format: 'uri', description: '게이트웨이 approve 엔드포인트 URL' },
      successUrl: { type: 'string', description: '결제 성공 시 리다이렉트 URL' },
      failureUrl: { type: 'string', description: '결제 실패 시 리다이렉트 URL' },
      buyerName: { type: 'string', description: '구매자 이름' },
      buyerEmail: { type: 'string', format: 'email', description: '구매자 이메일' },
      buyerTel: { type: 'string', description: '구매자 전화번호' },
      mallReserved: { type: 'string', description: '가맹점 예비필드' },
    },
  },
  // Response schema omitted intentionally to prevent Fastify serializer
  // from stripping nested object properties (sdkParams)
};

export const statusSchema = {
  tags: ['Payments'],
  summary: '결제 상태 조회 (TID)',
  security: [{ apiKey: [] }],
  params: {
    type: 'object',
    required: ['tid'],
    properties: {
      tid: { type: 'string', description: 'NicePay TID' },
    },
  },
};

export const findSchema = {
  tags: ['Payments'],
  summary: '결제 조회 (주문번호)',
  security: [{ apiKey: [] }],
  params: {
    type: 'object',
    required: ['orderId'],
    properties: {
      orderId: { type: 'string', description: '주문번호' },
    },
  },
};

export const cancelSchema = {
  tags: ['Payments'],
  summary: '결제 취소/환불',
  security: [{ apiKey: [] }],
  params: {
    type: 'object',
    required: ['tid'],
    properties: {
      tid: { type: 'string' },
    },
  },
  body: {
    type: 'object',
    required: ['reason', 'orderId'],
    properties: {
      reason: { type: 'string', description: '취소 사유' },
      orderId: { type: 'string', description: '주문번호' },
      cancelAmt: { type: 'integer', description: '부분취소 금액 (생략 시 전체취소)' },
      taxFreeAmt: { type: 'integer', description: '비과세 금액' },
      refundAccount: { type: 'string', description: '환불계좌번호 (가상계좌 환불 시 필수)' },
      refundBankCode: { type: 'string', description: '환불은행코드 (가상계좌 환불 시 필수)' },
      refundHolder: { type: 'string', description: '환불계좌 예금주 (가상계좌 환불 시 필수)' },
    },
  },
};
