import type { EmailSender } from '../../../email/email.types.js';
import { renderNotificationEmail } from '../../../email/templates.js';
import { AppError } from '../../../http/problem.js';

export interface EmailDispatchInput {
  notificationId: string;
  userId: string;
  title?: string | null | undefined;
  body: string;
  attempt: number;
  maxAttempts: number;
}

export interface EmailDispatchDeps {
  sender: EmailSender;
  getDeliveryStatus(id: string): Promise<string | null>;
  getVerifiedEmail(userId: string): Promise<string | null>;
  markDelivery(
    id: string,
    outcome: { status: 'SENT' | 'DELIVERED' | 'FAILED'; error?: string | undefined },
  ): Promise<unknown>;
  deadLetter(error: string): Promise<void>;
}

export type EmailDispatchResult = 'sent' | 'skipped' | 'replayed';

/**
 * BR-185: EMAIL channel dispatcher. Returns normally for sent/skipped/replayed;
 * throws only for a transient send failure (so the queue retries with backoff),
 * after dead-lettering on the final attempt.
 */
export async function dispatchEmailNotification(
  input: EmailDispatchInput,
  deps: EmailDispatchDeps,
): Promise<EmailDispatchResult> {
  // Idempotency: QUEUED (first run) and FAILED (retry) may send; anything
  // settled (SENT/DELIVERED/READ) or a missing row is a replay and a no-op.
  const status = await deps.getDeliveryStatus(input.notificationId);
  if (status !== 'QUEUED' && status !== 'FAILED') return 'replayed';

  const to = await deps.getVerifiedEmail(input.userId);
  if (!to) {
    await deps.markDelivery(input.notificationId, {
      status: 'DELIVERED',
      error: 'skipped: no verified email',
    });
    return 'skipped';
  }

  if (!deps.sender.configured) {
    await deps.markDelivery(input.notificationId, {
      status: 'DELIVERED',
      error: 'skipped: email not configured',
    });
    return 'skipped';
  }

  const mail = renderNotificationEmail(input.title ?? null, input.body);
  try {
    await deps.sender.send({ to, ...mail });
  } catch (err) {
    if (err instanceof AppError && err.code === 'EMAIL_NOT_CONFIGURED') {
      await deps.markDelivery(input.notificationId, {
        status: 'DELIVERED',
        error: 'skipped: email not configured',
      });
      return 'skipped';
    }
    const message = err instanceof Error ? err.message : 'Email dispatch error';
    await deps.markDelivery(input.notificationId, { status: 'FAILED', error: message });
    if (input.attempt >= input.maxAttempts) await deps.deadLetter(message);
    throw err;
  }
  await deps.markDelivery(input.notificationId, { status: 'SENT' });
  return 'sent';
}
