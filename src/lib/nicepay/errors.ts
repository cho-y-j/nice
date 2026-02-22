export class NicePayError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly resultCode?: string,
    public readonly resultMsg?: string,
  ) {
    super(message);
    this.name = 'NicePayError';
  }
}

export class PaymentNotFoundError extends NicePayError {
  constructor(identifier: string) {
    super(`Payment not found: ${identifier}`, 'PAYMENT_NOT_FOUND');
  }
}

export class AmountTamperingError extends NicePayError {
  constructor(orderId: string, expected: number, received: number) {
    super(
      `Amount mismatch for order ${orderId}: expected ${expected}, received ${received}`,
      'AMOUNT_MISMATCH',
    );
  }
}

export class SignatureVerificationError extends NicePayError {
  constructor(context: string) {
    super(`Signature verification failed: ${context}`, 'SIGNATURE_INVALID');
  }
}

export class AuthenticationFailedError extends NicePayError {
  constructor(resultCode: string, resultMsg: string) {
    super(`Authentication failed: ${resultMsg} (${resultCode})`, 'AUTH_FAILED', resultCode, resultMsg);
  }
}

export class ApprovalFailedError extends NicePayError {
  constructor(resultCode: string, resultMsg: string) {
    super(`Approval failed: ${resultMsg} (${resultCode})`, 'APPROVAL_FAILED', resultCode, resultMsg);
  }
}

export class NetworkCancelledError extends NicePayError {
  constructor(orderId: string) {
    super(`Network cancellation triggered for order ${orderId}`, 'NETWORK_CANCELLED');
  }
}

export class BillingKeyNotFoundError extends NicePayError {
  constructor(bid: string) {
    super(`Billing key not found: ${bid}`, 'BILLING_KEY_NOT_FOUND');
  }
}
