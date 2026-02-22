import { eq } from 'drizzle-orm';
import { payments } from '../db/schema/index.js';
import { AmountTamperingError, PaymentNotFoundError } from './nicepay/errors.js';
import type { AppDb } from '../db/index.js';

/**
 * Verify that the received amount matches what was stored during prepare.
 * This is the primary defense against amount tampering attacks.
 */
export async function verifyAmount(db: AppDb, orderId: string, receivedAmount: number): Promise<void> {
  const result = await db.select({ amount: payments.amount }).from(payments).where(eq(payments.orderId, orderId)).limit(1);

  if (!result[0]) {
    throw new PaymentNotFoundError(orderId);
  }

  if (result[0].amount !== receivedAmount) {
    throw new AmountTamperingError(orderId, result[0].amount, receivedAmount);
  }
}
