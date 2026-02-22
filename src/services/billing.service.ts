import { eq } from 'drizzle-orm';
import { billingKeys, payments } from '../db/schema/index.js';
import { nicepayConfig } from '../config/nicepay.js';
import { generateBillingId, generatePaymentId } from '../utils/generate-id.js';
import { encryptCardData, generateEdiDate, generateBillingRegisterSignData, generateBillingChargeSignData } from '../lib/nicepay/crypto.js';
import { BillingKeyNotFoundError } from '../lib/nicepay/errors.js';
import { PAYMENT_STATUS } from '../lib/nicepay/constants.js';
import type { AppDb } from '../db/index.js';
import type { NicePayClient } from '../lib/nicepay/client.js';

interface RegisterParams {
  orderId: string;
  cardNo: string;
  expYear: string;
  expMonth: string;
  idNo?: string;
  cardPw?: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerTel?: string;
}

interface ChargeParams {
  orderId: string;
  amount: number;
  goodsName: string;
  cardQuota?: number;
  buyerName?: string;
  buyerEmail?: string;
  buyerTel?: string;
}

interface ExpireParams {
  orderId: string;
}

export class BillingService {
  constructor(
    private db: AppDb,
    private nicepay: NicePayClient,
    private logger: { warn: (...args: any[]) => void; error: (...args: any[]) => void; info: (...args: any[]) => void },
  ) {}

  /**
   * Register billing key (카드 등록)
   */
  async register(params: RegisterParams) {
    const ediDate = generateEdiDate();
    const signData = generateBillingRegisterSignData(params.orderId, ediDate, nicepayConfig.secretKey);

    // Encrypt card data with AES-256
    const encData = encryptCardData(
      params.cardNo,
      params.expYear,
      params.expMonth,
      params.idNo || '',
      params.cardPw || '',
      nicepayConfig.secretKey,
    );

    const result = await this.nicepay.billingRegister({
      encData,
      orderId: params.orderId,
      encMode: 'A2', // AES-256
      ediDate,
      signData,
      buyerName: params.buyerName,
      buyerEmail: params.buyerEmail,
      buyerTel: params.buyerTel,
    });

    // Store billing key
    const id = generateBillingId();
    await this.db.insert(billingKeys).values({
      id,
      bid: result.bid,
      orderId: params.orderId,
      status: 'active',
      cardCode: result.cardCode,
      cardName: result.cardName,
      cardNumMasked: result.cardNum,
      buyerName: params.buyerName,
      buyerEmail: params.buyerEmail,
      buyerTel: params.buyerTel,
      authDate: result.authDate,
    });

    return {
      billingId: id,
      bid: result.bid,
      orderId: params.orderId,
      cardCode: result.cardCode,
      cardName: result.cardName,
      cardNumMasked: result.cardNum,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Charge using billing key (정기 과금)
   */
  async charge(bid: string, params: ChargeParams) {
    // Verify billing key exists
    const billingRows = await this.db.select().from(billingKeys).where(eq(billingKeys.bid, bid)).limit(1);
    if (!billingRows[0] || billingRows[0].status !== 'active') {
      throw new BillingKeyNotFoundError(bid);
    }

    const ediDate = generateEdiDate();
    const signData = generateBillingChargeSignData(params.orderId, bid, ediDate, nicepayConfig.secretKey);

    const result = await this.nicepay.billingCharge(bid, {
      orderId: params.orderId,
      amount: params.amount,
      goodsName: params.goodsName,
      ediDate,
      signData,
      cardQuota: params.cardQuota,
      buyerName: params.buyerName,
      buyerEmail: params.buyerEmail,
      buyerTel: params.buyerTel,
    });

    // Store payment record
    const paymentId = generatePaymentId();
    await this.db.insert(payments).values({
      id: paymentId,
      orderId: params.orderId,
      tid: result.tid,
      status: PAYMENT_STATUS.PAID,
      amount: params.amount,
      balanceAmt: result.balanceAmt,
      payMethod: 'card',
      goodsName: params.goodsName,
      approveNo: result.approveNo,
      cardInfo: result.card ? JSON.stringify(result.card) : null,
      buyerName: params.buyerName,
      buyerEmail: params.buyerEmail,
      buyerTel: params.buyerTel,
      returnUrl: '',
      paidAt: result.paidAt,
      expiresAt: new Date().toISOString(),
    });

    return {
      paymentId,
      tid: result.tid,
      bid,
      orderId: params.orderId,
      status: PAYMENT_STATUS.PAID,
      amount: params.amount,
      approveNo: result.approveNo,
      paidAt: result.paidAt,
      card: result.card ? {
        cardCode: result.card.cardCode,
        cardName: result.card.cardName,
        cardNum: result.card.cardNum,
      } : null,
    };
  }

  /**
   * Expire billing key (카드 삭제)
   */
  async expire(bid: string, params: ExpireParams) {
    const billingRows = await this.db.select().from(billingKeys).where(eq(billingKeys.bid, bid)).limit(1);
    if (!billingRows[0]) {
      throw new BillingKeyNotFoundError(bid);
    }

    const ediDate = generateEdiDate();
    const signData = generateBillingRegisterSignData(params.orderId, ediDate, nicepayConfig.secretKey);

    await this.nicepay.billingExpire(bid, {
      orderId: params.orderId,
      ediDate,
      signData,
    });

    await this.db.update(billingKeys).set({
      status: 'expired',
      expiredAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).where(eq(billingKeys.bid, bid));

    return {
      bid,
      status: 'expired',
      expiredAt: new Date().toISOString(),
    };
  }
}
