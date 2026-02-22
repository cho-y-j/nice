import { NicePayClient } from './nicepay/client.js';
import { NicePayError, NetworkCancelledError } from './nicepay/errors.js';
import type { ApprovalResponse } from './nicepay/types.js';

/**
 * Wraps the approval call with automatic net-cancel (망취소) on timeout.
 *
 * If the approval API times out or has a network error, we MUST call
 * the net-cancel endpoint to prevent phantom charges (money debited
 * but no approval record).
 *
 * Net-cancel is valid for 1 hour after the original request.
 */
export async function approveWithNetCancel(
  client: NicePayClient,
  tid: string,
  amount: number,
  orderId: string,
  logger: { warn: (...args: any[]) => void; error: (...args: any[]) => void },
): Promise<ApprovalResponse> {
  try {
    return await client.approve(tid, amount);
  } catch (error) {
    if (error instanceof NicePayError && (error.code === 'TIMEOUT' || error.code === 'NETWORK_ERROR')) {
      logger.warn({ tid, orderId, errorCode: error.code }, 'Approval timeout/network error, initiating net-cancel (망취소)');

      try {
        await client.netCancel(orderId, amount);
        logger.warn({ orderId }, 'Net-cancel (망취소) completed successfully');
      } catch (netCancelError) {
        logger.error({ orderId, error: netCancelError }, 'Net-cancel (망취소) also failed');
      }

      throw new NetworkCancelledError(orderId);
    }

    throw error;
  }
}
