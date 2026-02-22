import { createHash, createCipheriv, randomBytes, timingSafeEqual } from 'crypto';

/**
 * SHA-256 hex digest
 */
export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

/**
 * Generate ediDate in ISO 8601 format
 */
export function generateEdiDate(): string {
  return new Date().toISOString();
}

/**
 * Generate Basic Auth header value
 */
export function generateBasicAuth(clientId: string, secretKey: string): string {
  const credentials = Buffer.from(`${clientId}:${secretKey}`).toString('base64');
  return `Basic ${credentials}`;
}

// ============================================================
// Signature Generation
// ============================================================

/** For approval request: sha256(tid + amount + ediDate + secretKey) */
export function generateApprovalSignData(tid: string, amount: number, ediDate: string, secretKey: string): string {
  return sha256(`${tid}${amount}${ediDate}${secretKey}`);
}

/** For cancel request: sha256(tid + ediDate + secretKey) */
export function generateCancelSignData(tid: string, ediDate: string, secretKey: string): string {
  return sha256(`${tid}${ediDate}${secretKey}`);
}

/** For net-cancel request: sha256(orderId + ediDate + secretKey) */
export function generateNetCancelSignData(orderId: string, ediDate: string, secretKey: string): string {
  return sha256(`${orderId}${ediDate}${secretKey}`);
}

/** For billing register: sha256(orderId + ediDate + secretKey) */
export function generateBillingRegisterSignData(orderId: string, ediDate: string, secretKey: string): string {
  return sha256(`${orderId}${ediDate}${secretKey}`);
}

/** For billing charge: sha256(orderId + bid + ediDate + secretKey) */
export function generateBillingChargeSignData(orderId: string, bid: string, ediDate: string, secretKey: string): string {
  return sha256(`${orderId}${bid}${ediDate}${secretKey}`);
}

// ============================================================
// Signature Verification (using timingSafeEqual)
// ============================================================

/** Verify auth callback signature: sha256(authToken + clientId + amount + secretKey) */
export function verifyAuthSignature(
  authToken: string, clientId: string, amount: number, secretKey: string,
  receivedSignature: string,
): boolean {
  const expected = sha256(`${authToken}${clientId}${amount}${secretKey}`);
  return safeCompare(expected, receivedSignature);
}

/** Verify approval/webhook signature: sha256(tid + amount + ediDate + secretKey) */
export function verifyResponseSignature(
  tid: string, amount: number, ediDate: string, secretKey: string,
  receivedSignature: string,
): boolean {
  const expected = sha256(`${tid}${amount}${ediDate}${secretKey}`);
  return safeCompare(expected, receivedSignature);
}

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// ============================================================
// AES Encryption (for billing card data)
// ============================================================

/**
 * AES-256-ECB encryption for billing encData
 * NicePay requires: AES/ECB/PKCS5Padding with hex-encoded secretKey as key
 */
export function encryptCardData(
  cardNo: string, expYear: string, expMonth: string,
  idNo: string, cardPw: string, secretKey: string,
): string {
  const plainText = `cardNo=${cardNo}&expYear=${expYear}&expMonth=${expMonth}&idNo=${idNo}&cardPw=${cardPw}`;

  // NicePay uses first 32 bytes of secretKey as AES-256 key
  const key = Buffer.from(secretKey.padEnd(32, '0').slice(0, 32), 'utf8');
  const cipher = createCipheriv('aes-256-ecb', key, null);
  cipher.setAutoPadding(true);

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return encrypted;
}
