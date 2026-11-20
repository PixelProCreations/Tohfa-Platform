/** Email OTP template: plain text + simple HTML. TOHFA branding only, never farm information. */
export interface OtpEmail {
  subject: string;
  text: string;
  html: string;
}

export function renderOtpEmail(code: string, ttlMinutes: number): OtpEmail {
  const subject = `${code} is your TOHFA verification code`;
  const text = [
    'TOHFA',
    '',
    `Your verification code is: ${code}`,
    `It expires in ${ttlMinutes} minutes.`,
    '',
    'If you did not request this, you can safely ignore this email.',
  ].join('\n');
  const html =
    `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#1f2933">` +
    `<h2 style="color:#2f7d32">TOHFA</h2>` +
    `<p>Your verification code is:</p>` +
    `<p style="font-size:28px;letter-spacing:6px;font-weight:bold">${escapeHtml(code)}</p>` +
    `<p>It expires in ${ttlMinutes} minutes.</p>` +
    `<p style="color:#6b7280">If you did not request this, you can safely ignore this email.</p>` +
    `</body></html>`;
  return { subject, text, html };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/**
 * Generic branded notification email (BR-185). Built only from the in-app
 * notification title/body: no farm identity, no OTP, nothing extra. All
 * interpolated text is HTML-escaped.
 */
export function renderNotificationEmail(title: string | null, body: string): OtpEmail {
  const subject = title && title.trim().length > 0 ? title.trim() : 'TOHFA notification';
  const text = ['TOHFA', '', subject, '', body].join('\n');
  const paragraphs = body
    .split(/\n+/)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join('');
  const html =
    `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#1f2933">` +
    `<h2 style="color:#2f7d32">TOHFA</h2>` +
    `<h3>${escapeHtml(subject)}</h3>` +
    paragraphs +
    `<p style="color:#6b7280">You are receiving this because you have a TOHFA account.</p>` +
    `</body></html>`;
  return { subject, text, html };
}
