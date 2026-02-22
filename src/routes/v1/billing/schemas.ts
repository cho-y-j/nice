export const registerSchema = {
  tags: ['Billing'],
  summary: '빌링키 등록 (카드 등록)',
  description: '정기결제를 위한 카드를 등록하고 빌링키(bid)를 발급받습니다.',
  security: [{ apiKey: [] }],
  body: {
    type: 'object',
    required: ['orderId', 'cardNo', 'expYear', 'expMonth'],
    properties: {
      orderId: { type: 'string', description: '고유 주문번호 (등록용)' },
      cardNo: { type: 'string', description: '카드번호 (16자리)' },
      expYear: { type: 'string', description: '유효기간 년도 (YY)' },
      expMonth: { type: 'string', description: '유효기간 월 (MM)' },
      idNo: { type: 'string', description: '생년월일 6자리 또는 사업자번호 10자리' },
      cardPw: { type: 'string', description: '카드 비밀번호 앞 2자리' },
      buyerName: { type: 'string', description: '구매자 이름' },
      buyerEmail: { type: 'string', description: '구매자 이메일' },
      buyerTel: { type: 'string', description: '구매자 전화번호' },
    },
  },
};

export const chargeSchema = {
  tags: ['Billing'],
  summary: '빌링 결제 (정기 과금)',
  description: '등록된 빌링키로 결제를 실행합니다.',
  security: [{ apiKey: [] }],
  params: {
    type: 'object',
    required: ['bid'],
    properties: {
      bid: { type: 'string', description: 'NicePay 빌링키' },
    },
  },
  body: {
    type: 'object',
    required: ['orderId', 'amount', 'goodsName'],
    properties: {
      orderId: { type: 'string', description: '고유 주문번호 (결제 건별 유니크)' },
      amount: { type: 'integer', minimum: 100, description: '결제금액 (원)' },
      goodsName: { type: 'string', description: '상품명' },
      cardQuota: { type: 'integer', description: '할부개월 (0=일시불)' },
      buyerName: { type: 'string', description: '구매자 이름' },
      buyerEmail: { type: 'string', description: '구매자 이메일' },
      buyerTel: { type: 'string', description: '구매자 전화번호' },
    },
  },
};

export const expireSchema = {
  tags: ['Billing'],
  summary: '빌링키 삭제',
  description: '등록된 빌링키를 삭제(만료)합니다.',
  security: [{ apiKey: [] }],
  params: {
    type: 'object',
    required: ['bid'],
    properties: {
      bid: { type: 'string', description: 'NicePay 빌링키' },
    },
  },
  body: {
    type: 'object',
    required: ['orderId'],
    properties: {
      orderId: { type: 'string', description: '삭제 요청 주문번호' },
    },
  },
};
