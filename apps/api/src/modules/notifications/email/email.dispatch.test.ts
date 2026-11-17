import { describe, expect, it, vi } from 'vitest';
import { AppError } from '../../../http/problem.js';
import type { EmailMessage, EmailSender } from '../../../email/email.types.js';
import { renderNotificationEmail } from '../../../email/templates.js';
import { dispatchEmailNotification, type EmailDispatchDeps } from './email.dispatch.js';
import { EVENT_EMAIL_MAP, EVENT_TEMPLATE_MAP } from '../notifications.service.js';

function setup(opts: {
  status?: string | null;
  email?: string | null;
  configured?: boolean;
  sendError?: unknown;
}) {
  const sent: EmailMessage[] = [];
  const sender: EmailSender = {
    configured: opts.configured ?? true,
    send: vi.fn(async (m: EmailMessage) => {
      if (opts.sendError) throw opts.sendError;
      sent.push(m);
    }),
  };
  const markDelivery = vi.fn(async () => undefined);
  const deadLetter = vi.fn(async () => undefined);
  const deps: EmailDispatchDeps = {
    sender,
    getDeliveryStatus: async () => (opts.status === undefined ? 'QUEUED' : opts.status),
    getVerifiedEmail: async () => (opts.email === undefined ? 'a@b.com' : opts.email),
    markDelivery,
    deadLetter,
  };
  return { deps, sent, markDelivery, deadLetter, sender };
}
const input = { notificationId: 'n1', userId: 'u1', title: 'Order confirmed', body: 'Order #1 ok', attempt: 1, maxAttempts: 3 };

describe('BR-185 email dispatcher', () => {
  it('sends to the verified email and marks SENT', async () => {
    const t = setup({});
    expect(await dispatchEmailNotification(input, t.deps)).toBe('sent');
    expect(t.sent).toHaveLength(1);
    expect(t.sent[0]).toMatchObject({ to: 'a@b.com', subject: 'Order confirmed' });
    expect(t.markDelivery).toHaveBeenCalledWith('n1', { status: 'SENT' });
  });

  it.each([[null], ['']])('skips when no verified email (%s) without failing', async (email) => {
    const t = setup({ email });
    expect(await dispatchEmailNotification(input, t.deps)).toBe('skipped');
    expect(t.sent).toHaveLength(0);
    expect(t.markDelivery).toHaveBeenCalledWith('n1', {
      status: 'DELIVERED',
      error: 'skipped: no verified email',
    });
  });

  it('replayed settled job does not send twice', async () => {
    for (const status of ['SENT', 'DELIVERED', 'READ', null]) {
      const t = setup({ status });
      expect(await dispatchEmailNotification(input, t.deps)).toBe('replayed');
      expect(t.sent).toHaveLength(0);
    }
  });

  it('unconfigured transport is skipped, not retried', async () => {
    const t = setup({ configured: false });
    expect(await dispatchEmailNotification(input, t.deps)).toBe('skipped');
    const t2 = setup({ sendError: new AppError('EMAIL_NOT_CONFIGURED') });
    expect(await dispatchEmailNotification(input, t2.deps)).toBe('skipped');
    expect(t2.deadLetter).not.toHaveBeenCalled();
  });

  it('failure throws for retry; dead-letters only on the last attempt; FAILED row is retryable', async () => {
    const t = setup({ sendError: new Error('smtp down') });
    await expect(dispatchEmailNotification(input, t.deps)).rejects.toThrow('smtp down');
    expect(t.deadLetter).not.toHaveBeenCalled();
    const last = setup({ sendError: new Error('smtp down'), status: 'FAILED' });
    await expect(
      dispatchEmailNotification({ ...input, attempt: 3 }, last.deps),
    ).rejects.toThrow('smtp down');
    expect(last.deadLetter).toHaveBeenCalledWith('smtp down');
  });

  it('escapes HTML and carries no farm info', () => {
    const m = renderNotificationEmail('<b>Hi</b>', '<script>alert(1)</script>\nline2');
    expect(m.html).not.toContain('<script>');
    expect(m.html).not.toContain('<b>Hi</b>');
    expect(m.html).toContain('&#60;script&#62;');
    expect(m.html).toContain('<p>line2</p>');
    expect(m.text.toLowerCase()).not.toContain('farm');
    expect(m.html.toLowerCase()).not.toContain('farm');
  });

  it('wiring: email events are known events; customer transactional events flagged', () => {
    for (const e of Object.keys(EVENT_EMAIL_MAP)) expect(EVENT_TEMPLATE_MAP).toHaveProperty(e);
    for (const e of ['order.confirmed', 'order.dispatched', 'order.delivered', 'wallet.credited', 'wallet.debited'])
      expect(EVENT_EMAIL_MAP[e as keyof typeof EVENT_EMAIL_MAP]?.transactional).toBe(true);
  });
});
