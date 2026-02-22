import { nicepayConfig } from '../../config/nicepay.js';
import { generateBasicAuth, generateEdiDate, generateApprovalSignData, generateCancelSignData, generateNetCancelSignData } from './crypto.js';
import { RESULT_CODE } from './constants.js';
import { NicePayError, ApprovalFailedError } from './errors.js';
import type {
  ApprovalRequest, ApprovalResponse,
  CancelRequest, CancelResponse,
  NetCancelRequest, NicePayBaseResponse,
  BillingRegisterRequest, BillingRegisterResponse,
  BillingChargeRequest, BillingChargeResponse,
  BillingExpireRequest, BillingExpireResponse,
  InquiryResponse,
} from './types.js';

export class NicePayClient {
  private baseUrl: string;
  private authHeader: string;

  constructor() {
    this.baseUrl = nicepayConfig.api;
    this.authHeader = generateBasicAuth(nicepayConfig.clientId, nicepayConfig.secretKey);
  }

  // ============================================================
  // Payment Approval
  // ============================================================

  async approve(tid: string, amount: number): Promise<ApprovalResponse> {
    const ediDate = generateEdiDate();
    const signData = generateApprovalSignData(tid, amount, ediDate, nicepayConfig.secretKey);

    const response = await this.request<ApprovalResponse>(
      `${this.baseUrl}/payments/${tid}`,
      'POST',
      { amount, ediDate, signData },
      nicepayConfig.timeouts.approval,
    );

    if (response.resultCode !== RESULT_CODE.SUCCESS) {
      throw new ApprovalFailedError(response.resultCode, response.resultMsg);
    }

    return response;
  }

  // ============================================================
  // Cancel / Refund
  // ============================================================

  async cancel(tid: string, params: {
    reason: string;
    orderId: string;
    cancelAmt?: number;
    taxFreeAmt?: number;
    refundAccount?: string;
    refundBankCode?: string;
    refundHolder?: string;
  }): Promise<CancelResponse> {
    const ediDate = generateEdiDate();
    const signData = generateCancelSignData(tid, ediDate, nicepayConfig.secretKey);

    const body: CancelRequest = {
      reason: params.reason,
      orderId: params.orderId,
      ediDate,
      signData,
      ...(params.cancelAmt !== undefined && { cancelAmt: params.cancelAmt }),
      ...(params.taxFreeAmt !== undefined && { taxFreeAmt: params.taxFreeAmt }),
      ...(params.refundAccount && { refundAccount: params.refundAccount }),
      ...(params.refundBankCode && { refundBankCode: params.refundBankCode }),
      ...(params.refundHolder && { refundHolder: params.refundHolder }),
    };

    const response = await this.request<CancelResponse>(
      `${this.baseUrl}/payments/${tid}/cancel`,
      'POST',
      body,
    );

    if (response.resultCode !== RESULT_CODE.SUCCESS) {
      throw new NicePayError(`Cancel failed: ${response.resultMsg}`, 'CANCEL_FAILED', response.resultCode, response.resultMsg);
    }

    return response;
  }

  // ============================================================
  // Net Cancel (망취소)
  // ============================================================

  async netCancel(orderId: string, amount: number): Promise<NicePayBaseResponse> {
    const ediDate = generateEdiDate();
    const signData = generateNetCancelSignData(orderId, ediDate, nicepayConfig.secretKey);

    const body: NetCancelRequest = {
      orderAmount: amount,
      orderId,
      ediDate,
      signData,
    };

    return this.request<NicePayBaseResponse>(
      `${this.baseUrl}/payments/netcancel`,
      'POST',
      body,
    );
  }

  // ============================================================
  // Inquiry
  // ============================================================

  async inquiryByTid(tid: string): Promise<InquiryResponse> {
    return this.request<InquiryResponse>(
      `${this.baseUrl}/payments/${tid}`,
      'GET',
    );
  }

  async inquiryByOrderId(orderId: string, orderDate: string): Promise<InquiryResponse> {
    return this.request<InquiryResponse>(
      `${this.baseUrl}/payments/find/${orderId}?orderDate=${orderDate}`,
      'GET',
    );
  }

  // ============================================================
  // Billing
  // ============================================================

  async billingRegister(body: BillingRegisterRequest): Promise<BillingRegisterResponse> {
    const response = await this.request<BillingRegisterResponse>(
      `${this.baseUrl}/subscribe/regist`,
      'POST',
      body,
    );

    if (response.resultCode !== RESULT_CODE.SUCCESS) {
      throw new NicePayError(`Billing register failed: ${response.resultMsg}`, 'BILLING_REGISTER_FAILED', response.resultCode, response.resultMsg);
    }

    return response;
  }

  async billingCharge(bid: string, body: BillingChargeRequest): Promise<BillingChargeResponse> {
    const response = await this.request<BillingChargeResponse>(
      `${this.baseUrl}/subscribe/${bid}/payments`,
      'POST',
      body,
    );

    if (response.resultCode !== RESULT_CODE.SUCCESS) {
      throw new NicePayError(`Billing charge failed: ${response.resultMsg}`, 'BILLING_CHARGE_FAILED', response.resultCode, response.resultMsg);
    }

    return response;
  }

  async billingExpire(bid: string, body: BillingExpireRequest): Promise<BillingExpireResponse> {
    const response = await this.request<BillingExpireResponse>(
      `${this.baseUrl}/subscribe/${bid}/expire`,
      'POST',
      body,
    );

    if (response.resultCode !== RESULT_CODE.SUCCESS) {
      throw new NicePayError(`Billing expire failed: ${response.resultMsg}`, 'BILLING_EXPIRE_FAILED', response.resultCode, response.resultMsg);
    }

    return response;
  }

  // ============================================================
  // HTTP Client
  // ============================================================

  private async request<T>(url: string, method: string, body?: unknown, timeout?: number): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      timeout || nicepayConfig.timeouts.general,
    );

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.authHeader,
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: controller.signal,
      });

      const data = await response.json() as T;
      return data;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new NicePayError(`Request timeout: ${url}`, 'TIMEOUT');
      }
      throw new NicePayError(`Network error: ${error.message}`, 'NETWORK_ERROR');
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
