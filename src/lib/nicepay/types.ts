// ============================================================
// NicePay API Request/Response Types
// ============================================================

// --- Common ---
export interface NicePayBaseResponse {
  resultCode: string;
  resultMsg: string;
  tid?: string;
  orderId?: string;
  ediDate?: string;
  signature?: string;
  amount?: number;
}

// --- Payment Approval ---
export interface ApprovalRequest {
  amount: number;
  ediDate: string;
  signData: string;
  cardQuota?: string;
  useShopInterest?: boolean;
}

export interface ApprovalResponse extends NicePayBaseResponse {
  tid: string;
  cancelledTid?: string;
  orderId: string;
  ediDate: string;
  signature: string;
  status: string;
  paidAt: string;
  failedAt?: string;
  cancelledAt?: string;
  payMethod: string;
  amount: number;
  balanceAmt: number;
  goodsName: string;
  mallReserved?: string;
  useEscrow: boolean;
  currency: string;
  channel: string;
  approveNo?: string;
  buyerName?: string;
  buyerTel?: string;
  buyerEmail?: string;
  issuedCashReceipt: boolean;
  receiptUrl?: string;
  card?: CardInfo;
  vbank?: VbankInfo;
  bank?: BankInfo;
  cellphone?: CellphoneInfo;
}

export interface CardInfo {
  cardCode: string;
  cardName: string;
  cardNum: string;
  cardQuota: number;
  isInterestFree: boolean;
  cardType: string;
  canPartCancel: string;
  acquCardCode: string;
  acquCardName: string;
}

export interface VbankInfo {
  vbankCode: string;
  vbankName: string;
  vbankNumber: string;
  vbankExpDate: string;
  vbankHolder: string;
}

export interface BankInfo {
  bankCode: string;
  bankName: string;
}

export interface CellphoneInfo {
  cellphoneNo: string;
}

// --- Cancel ---
export interface CancelRequest {
  reason: string;
  orderId: string;
  cancelAmt?: number;
  taxFreeAmt?: number;
  ediDate: string;
  signData: string;
  refundAccount?: string;
  refundBankCode?: string;
  refundHolder?: string;
}

export interface CancelResponse extends NicePayBaseResponse {
  tid: string;
  cancelledTid: string;
  orderId: string;
  status: string;
  cancelledAt: string;
  amount: number;
  balanceAmt: number;
  cancelAmt: number;
}

// --- Net Cancel ---
export interface NetCancelRequest {
  orderAmount: number;
  orderId: string;
  ediDate: string;
  signData: string;
}

// --- Billing ---
export interface BillingRegisterRequest {
  encData: string;
  orderId: string;
  encMode: string;
  ediDate: string;
  signData: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerTel?: string;
}

export interface BillingRegisterResponse extends NicePayBaseResponse {
  bid: string;
  orderId: string;
  authDate: string;
  cardCode: string;
  cardName: string;
  cardNum?: string;
}

export interface BillingChargeRequest {
  orderId: string;
  amount: number;
  goodsName: string;
  cardQuota?: number;
  useShopInterest?: boolean;
  ediDate: string;
  signData: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerTel?: string;
}

export interface BillingChargeResponse extends ApprovalResponse {
  bid: string;
}

export interface BillingExpireRequest {
  orderId: string;
  ediDate: string;
  signData: string;
}

export interface BillingExpireResponse extends NicePayBaseResponse {
  bid: string;
  orderId: string;
}

// --- Inquiry ---
export interface InquiryResponse extends ApprovalResponse {
  cancels?: CancelHistoryItem[];
}

export interface CancelHistoryItem {
  tid: string;
  amount: number;
  cancelledAt: string;
  reason: string;
  receiptUrl?: string;
}

// --- Webhook ---
export interface WebhookPayload {
  resultCode: string;
  resultMsg: string;
  tid: string;
  orderId: string;
  amount: number;
  ediDate: string;
  signature: string;
  status: string;
  payMethod: string;
  useEscrow?: boolean;
  paidAt?: string;
  failedAt?: string;
  cancelledAt?: string;
  approveNo?: string;
  mallReserved?: string;
}

// --- Auth Response (from returnUrl POST) ---
export interface AuthCallbackParams {
  authResultCode: string;
  authResultMsg: string;
  tid: string;
  clientId: string;
  orderId: string;
  amount: string;
  authToken: string;
  signature: string;
  mallReserved?: string;
}
