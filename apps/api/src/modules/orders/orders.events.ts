/**
 * Customer-facing order events (BR-163).
 *
 * Published AFTER the business transaction commits, never inside it: the
 * notification subscriber writes with the pool, and an order that rolled back
 * must not have told the customer it was confirmed. Publishing is best-effort —
 * a failure to look up the recipient or to publish is logged and swallowed, so a
 * notification problem can never turn a committed order into a 500.
 */
import type { Executor } from '../../db/pool.js';
import { eventBus as defaultBus, type EventBus } from '../../events/bus.js';
import { logger } from '../../logger.js';

export type OrderEventName = 'order.confirmed' | 'order.dispatched' | 'order.delivered' | 'order.cancelled';

export interface OrderRecipient {
  userId: string;
  orderNumber: string;
  totalAmount: string;
}

/** The customer's login user for an order; null for a walk-in sale (no customer). */
export async function findOrderRecipient(db: Executor, orderId: string): Promise<OrderRecipient | null> {
  const res = await db.query<OrderRecipient>(
    `SELECT c.user_id AS "userId", o.order_number AS "orderNumber", o.total_amount::text AS "totalAmount"
       FROM orders o
       JOIN customers c ON c.id = o.customer_id
      WHERE o.id = $1`,
    [orderId],
  );
  return res.rows[0] ?? null;
}

export interface OrderEventPublisher {
  publish(name: OrderEventName, orderId: string): Promise<void>;
}

export function createOrderEventPublisher(opts: {
  db: Executor;
  bus?: EventBus;
  lookup?: (db: Executor, orderId: string) => Promise<OrderRecipient | null>;
}): OrderEventPublisher {
  const bus = opts.bus ?? defaultBus;
  const lookup = opts.lookup ?? findOrderRecipient;
  return {
    async publish(name, orderId) {
      try {
        const recipient = await lookup(opts.db, orderId);
        if (recipient === null) return;
        if (name === 'order.confirmed') {
          await bus.publish(name, {
            userId: recipient.userId,
            orderId,
            orderNumber: recipient.orderNumber,
            totalAmount: recipient.totalAmount,
          });
        } else {
          await bus.publish(name, { userId: recipient.userId, orderId, orderNumber: recipient.orderNumber });
        }
      } catch (err) {
        logger.warn({ err, eventName: name, orderId }, 'order event not published (order unaffected)');
      }
    },
  };
}
