/**
 * Add Certification form: the client-side pre-check of BR-48
 * (screens/certifications/certificationForm.ts), the server-error mapping the
 * screen uses for a 422, and the two API calls it makes (createCertification,
 * getSystemConfig). Plain Node, no React -- see this app's CLAUDE.md "Testing".
 *
 * BR-48 is ENFORCED server-side (apps/api/src/modules/certifications,
 * docs/rules.md BR-48). This pre-check mirrors the same rules so a farmer sees
 * the problem under the field before anything is sent; the server's answer is
 * still authoritative and is shown under the same fields when it disagrees.
 * The window (`cert_expiry_max_past_days`) comes from GET /config/farmer, never
 * a constant -- the tests pass it in and move it.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CERT_FORM_MESSAGES,
  renderFieldErrors,
  CERT_NUMBER_MAX_LENGTH,
  CERT_TYPE_LABEL_KEY,
  CUSTOM_TYPE_NAME_MAX_LENGTH,
  buildCertificationPatch,
  certificationDisplayName,
  certificationErrorKind,
  editNeedsReverification,
  resolveCertificateContentType,
  CERTIFICATION_TYPES,
  addDaysIso,
  displayDateToIso,
  isCalendarDate,
  isoToDisplayDate,
  serverCertificationFieldErrors,
  todayInKolkata,
  validateCertificationForm,
  ISSUING_BODY_MAX_LENGTH,
  type CertificationFormInput,
} from '../screens/certifications/certificationForm';
import { createCertification, getSystemConfig, type Certification } from '../api/farmer';
import { ApiError, NetworkError, setAccessToken } from '../../../shell/api/client';
import { en } from '../../../i18n/farmer';
import ta from '../../../i18n/farmer.ta.json';

// The server's own fixed clock in certifications.test.ts: 2026-10-05 (IST).
const TODAY = '2026-10-05';
const MAX_PAST = 365;
const MAX_FUTURE = 730;

function input(overrides: Partial<CertificationFormInput> = {}): CertificationFormInput {
  return {
    certType: 'PGS',
    certNumber: 'PGS-TN-2026-0042',
    issuingBody: 'PGS India Council',
    issuedOn: '2025-01-10',
    expiresOn: '2027-01-09',
    ...overrides,
  };
}

function check(
  overrides: Partial<CertificationFormInput> = {},
  maxPastDays = MAX_PAST,
  today = TODAY,
  maxFutureDays = MAX_FUTURE,
) {
  return validateCertificationForm(input(overrides), { today, maxPastDays, maxFutureDays });
}

function errorsOf(
  overrides: Partial<CertificationFormInput> = {},
  maxPastDays = MAX_PAST,
  today = TODAY,
  maxFutureDays = MAX_FUTURE,
) {
  const result = check(overrides, maxPastDays, today, maxFutureDays);
  return result.ok ? {} : result.errors;
}

function problemResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/problem+json' },
  });
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('Add certification form: client pre-check of BR-48', () => {
  it('accepts a complete, valid certificate and returns the trimmed request body', () => {
    const result = check({ certNumber: '  PGS-1  ', issuingBody: '  Council  ' });
    expect(result).toEqual({
      ok: true,
      value: {
        certType: 'PGS',
        certNumber: 'PGS-1',
        issuingBody: 'Council',
        issuedOn: '2025-01-10',
        expiresOn: '2027-01-09',
      },
    });
  });

  it('BR-48a: accepts an expiresOn of today', () => {
    expect(check({ expiresOn: TODAY }).ok).toBe(true);
  });

  it('BR-48a: accepts an already-expired expiresOn exactly 365 days before today (2025-10-05)', () => {
    expect(check({ issuedOn: '2024-10-05', expiresOn: '2025-10-05' }).ok).toBe(true);
  });

  it('BR-48a: rejects an expiresOn 366 days before today (2025-10-04) on expiresOn, naming the earliest allowed date', () => {
    expect(errorsOf({ issuedOn: '2024-10-05', expiresOn: '2025-10-04' })).toEqual({
      expiresOn: { key: CERT_FORM_MESSAGES.expiryTooOld, params: { days: 365, date: '05/10/2025' } },
    });
  });

  it('BR-48a: accepts an expiresOn of tomorrow', () => {
    expect(check({ expiresOn: '2026-10-06' }).ok).toBe(true);
  });

  it('BR-48h: accepts an expiresOn exactly 730 days (2 years) after today (2028-10-04) and rejects 731 days (2028-10-05)', () => {
    expect(addDaysIso(TODAY, 730)).toBe('2028-10-04');
    expect(check({ expiresOn: '2028-10-04' }).ok).toBe(true);
    expect(errorsOf({ expiresOn: '2028-10-05' })).toEqual({
      expiresOn: { key: CERT_FORM_MESSAGES.expiryTooFar, params: { days: 730, date: '04/10/2028' } },
    });
    expect(errorsOf({ expiresOn: '2099-12-31' }).expiresOn).toMatchObject({ key: CERT_FORM_MESSAGES.expiryTooFar });
  });

  it('BR-48h: the future window is the configured cert_expiry_max_future_days -- set to 30, the boundary moves to 30 days', () => {
    // 2026-11-04 is today + 30.
    expect(check({ expiresOn: '2026-11-04' }, MAX_PAST, TODAY, 30).ok).toBe(true);
    expect(errorsOf({ expiresOn: '2026-11-05' }, MAX_PAST, TODAY, 30)).toEqual({
      expiresOn: { key: CERT_FORM_MESSAGES.expiryTooFar, params: { days: 30, date: '04/11/2026' } },
    });
    // 0 = only today or earlier.
    expect(check({ expiresOn: TODAY }, MAX_PAST, TODAY, 0).ok).toBe(true);
    expect(check({ expiresOn: '2026-10-06' }, MAX_PAST, TODAY, 0).ok).toBe(false);
  });

  it('BR-48h: the future window counts from the Asia/Kolkata day it is given', () => {
    // 2028-10-05 is 730 days after 2026-10-06 but 731 after 2026-10-05.
    expect(check({ expiresOn: '2028-10-05' }, MAX_PAST, '2026-10-06').ok).toBe(true);
    expect(check({ expiresOn: '2028-10-05' }, MAX_PAST, '2026-10-05').ok).toBe(false);
  });

  it('BR-48f: the ordering message still wins over the future-window message', () => {
    expect(errorsOf({ issuedOn: '2030-01-01', expiresOn: '2029-01-01' }).expiresOn).toEqual({
      key: CERT_FORM_MESSAGES.expiryNotAfterIssue,
    });
  });

  it('BR-48b: the window is the configured cert_expiry_max_past_days -- set to 30, the boundary moves to 30 days', () => {
    expect(check({ issuedOn: '2026-01-01', expiresOn: '2026-09-05' }, 30).ok).toBe(true);
    expect(errorsOf({ issuedOn: '2026-01-01', expiresOn: '2026-09-04' }, 30)).toEqual({
      expiresOn: { key: CERT_FORM_MESSAGES.expiryTooOld, params: { days: 30, date: '05/09/2026' } },
    });
    // The same date is fine under 365 and refused under 30.
    expect(check({ issuedOn: '2024-10-05', expiresOn: '2025-10-05' }, 365).ok).toBe(true);
    expect(check({ issuedOn: '2024-10-05', expiresOn: '2025-10-05' }, 30).ok).toBe(false);
    // 0 = no lapsed certificate may be recorded; today is still fine.
    expect(check({ expiresOn: TODAY }, 0).ok).toBe(true);
    expect(check({ issuedOn: '2026-01-01', expiresOn: '2026-10-04' }, 0).ok).toBe(false);
  });

  it('BR-48c: "today" is the Asia/Kolkata calendar date, not the UTC date', () => {
    // 00:30 IST on 5 Oct is still 4 Oct in UTC.
    expect(todayInKolkata(Date.parse('2026-10-04T19:00:00.000Z'))).toBe('2026-10-05');
    expect(todayInKolkata(Date.parse('2026-10-05T18:29:59.999Z'))).toBe('2026-10-05');
    expect(todayInKolkata(Date.parse('2026-10-05T18:30:00.000Z'))).toBe('2026-10-06');
    // And the form follows whichever day it is given.
    expect(check({ issuedOn: '2026-10-06' }, MAX_PAST, '2026-10-05').ok).toBe(false);
    expect(check({ issuedOn: '2026-10-06' }, MAX_PAST, '2026-10-06').ok).toBe(true);
  });

  it('BR-48d: rejects an issuedOn in the future (tomorrow) on issuedOn', () => {
    expect(errorsOf({ issuedOn: '2026-10-06' })).toEqual({
      issuedOn: { key: CERT_FORM_MESSAGES.issuedInFuture },
    });
  });

  it('BR-48d: accepts an issuedOn of today', () => {
    expect(check({ issuedOn: TODAY, expiresOn: '2027-10-05' }).ok).toBe(true);
  });

  it('BR-48d: reports both date fields at once', () => {
    const errors = errorsOf({ issuedOn: '2026-10-06', expiresOn: '2025-10-04' });
    expect(Object.keys(errors).sort()).toEqual(['expiresOn', 'issuedOn']);
    expect(errors.issuedOn).toEqual({ key: CERT_FORM_MESSAGES.issuedInFuture });
  });

  it('BR-48e: rejects impossible calendar dates for both fields', () => {
    for (const bad of ['2026-02-30', '2027-02-29', '2100-02-29', '2026-13-01', '2026-00-10', '2026-04-31', '0000-01-01']) {
      expect(isCalendarDate(bad), bad).toBe(false);
      expect(errorsOf({ issuedOn: bad }).issuedOn, `issuedOn ${bad}`).toEqual({ key: CERT_FORM_MESSAGES.dateInvalid });
      expect(errorsOf({ expiresOn: bad }).expiresOn, `expiresOn ${bad}`).toEqual({ key: CERT_FORM_MESSAGES.dateInvalid });
    }
  });

  it('BR-48e: accepts real leap days (2028-02-29, 2000-02-29)', () => {
    expect(isCalendarDate('2028-02-29')).toBe(true);
    expect(isCalendarDate('2000-02-29')).toBe(true);
    expect(check({ issuedOn: '2000-02-29', expiresOn: '2028-02-29' }).ok).toBe(true);
  });

  it('BR-48e: rejects date-times and other formats; an empty date is "required"', () => {
    for (const bad of ['2026-10-05T00:00:00Z', '05/10/2026', '2026-1-5', ' 2026-10-05', '20261005', 'tomorrow']) {
      expect(errorsOf({ expiresOn: bad }).expiresOn, bad).toEqual({ key: CERT_FORM_MESSAGES.dateInvalid });
    }
    expect(errorsOf({ issuedOn: '', expiresOn: '' })).toEqual({
      issuedOn: { key: CERT_FORM_MESSAGES.dateRequired },
      expiresOn: { key: CERT_FORM_MESSAGES.dateRequired },
    });
  });

  it('BR-48e: the picker\'s DD/MM/YYYY is converted to the YYYY-MM-DD the API takes, and back for messages', () => {
    expect(displayDateToIso('05/10/2026')).toBe('2026-10-05');
    expect(displayDateToIso('29/02/2028')).toBe('2028-02-29');
    // Shape only; calendar validity is the validator's job.
    expect(displayDateToIso('30/02/2026')).toBe('2026-02-30');
    expect(isCalendarDate(displayDateToIso('30/02/2026')!)).toBe(false);
    for (const other of ['', '5/10/2026', '05/10/26', '2026-10-05', '05-10-2026', ' 05/10/2026']) {
      expect(displayDateToIso(other), other).toBeNull();
    }
    expect(isoToDisplayDate('2025-10-05')).toBe('05/10/2025');
  });

  it('BR-48f: rejects an expiresOn equal to, or before, issuedOn', () => {
    expect(errorsOf({ issuedOn: '2026-01-01', expiresOn: '2026-01-01' })).toEqual({
      expiresOn: { key: CERT_FORM_MESSAGES.expiryNotAfterIssue },
    });
    expect(errorsOf({ issuedOn: '2026-03-01', expiresOn: '2026-02-01' })).toEqual({
      expiresOn: { key: CERT_FORM_MESSAGES.expiryNotAfterIssue },
    });
    // The ordering message wins over the window, as on the server (its schema
    // answers before the date-window check runs).
    expect(errorsOf({ issuedOn: '2024-06-01', expiresOn: '2024-01-01' }).expiresOn).toEqual({
      key: CERT_FORM_MESSAGES.expiryNotAfterIssue,
    });
  });

  it('BR-48g: certNumber and issuingBody are trimmed, must be non-empty, and are capped at 80 and 160 characters', () => {
    expect(CERT_NUMBER_MAX_LENGTH).toBe(80);
    expect(ISSUING_BODY_MAX_LENGTH).toBe(160);

    for (const blank of ['', '   ', '\t\n']) {
      expect(errorsOf({ certNumber: blank }).certNumber).toEqual({ key: CERT_FORM_MESSAGES.numberRequired });
      expect(errorsOf({ issuingBody: blank }).issuingBody).toEqual({ key: CERT_FORM_MESSAGES.issuerRequired });
    }

    const n80 = 'N'.repeat(80);
    const b160 = 'B'.repeat(160);
    const ok = check({ certNumber: `  ${n80}  `, issuingBody: ` ${b160} ` });
    expect(ok.ok && ok.value.certNumber).toBe(n80);
    expect(ok.ok && ok.value.issuingBody).toBe(b160);

    expect(errorsOf({ certNumber: 'N'.repeat(81) }).certNumber).toEqual({
      key: CERT_FORM_MESSAGES.numberTooLong,
      params: { max: 80 },
    });
    expect(errorsOf({ issuingBody: 'B'.repeat(161) }).issuingBody).toEqual({
      key: CERT_FORM_MESSAGES.issuerTooLong,
      params: { max: 160 },
    });
  });

  it('BR-48g / BR-02h: OTHER is accepted (as are PGS and NPOP) and sent as the exact enum value', () => {
    expect(CERTIFICATION_TYPES).toEqual(['PGS', 'NPOP', 'OTHER']);
    for (const certType of CERTIFICATION_TYPES) {
      // OTHER needs its name (BR-48i); PGS / NPOP don't.
      const result = check({ certType, customTypeName: 'Fair Trade' });
      expect(result.ok && result.value.certType, certType).toBe(certType);
    }
  });

  it('BR-48g: rejects an unknown or missing certType', () => {
    for (const bogus of ['BOGUS', 'pgs', 'Other', '', null, undefined]) {
      expect(errorsOf({ certType: bogus }).certType, String(bogus)).toEqual({ key: CERT_FORM_MESSAGES.typeRequired });
    }
  });

  it('reports every invalid field together, so the farmer sees them all at once', () => {
    expect(Object.keys(errorsOf({ certType: null, certNumber: '', issuingBody: '', issuedOn: '', expiresOn: '' })).sort()).toEqual(
      ['certNumber', 'certType', 'expiresOn', 'issuedOn', 'issuingBody'],
    );
  });
});

describe('Add certification form: the server\'s 422 errors map, field by field (BR-48)', () => {
  const validationFailed = (errors: Record<string, string[]>) =>
    new ApiError({
      type: 'https://docs.tohfa.in/problems/validation-failed',
      title: 'Request validation failed',
      status: 422,
      code: 'VALIDATION_FAILED',
      detail: 'One or more fields are invalid.',
      errors,
    });

  it('BR-48: maps each body.<field> key to that field, using the server message when the rule cannot be re-derived locally', () => {
    const mapped = serverCertificationFieldErrors(
      validationFailed({
        'body.expiresOn': ['Must be on or after 2025-10-05: a certificate that expired more than 365 days ago cannot be recorded.'],
        'body.issuedOn': ['Must not be in the future (today is 2026-10-05).'],
        'body.issuingBody': ['String must contain at most 160 character(s)'],
        'body.certType': ["Invalid enum value. Expected 'PGS' | 'NPOP' | 'OTHER', received 'X'"],
      }),
      {},
    );
    expect(mapped).toEqual({
      fields: {
        expiresOn: { text: 'Must be on or after 2025-10-05: a certificate that expired more than 365 days ago cannot be recorded.' },
        issuedOn: { text: 'Must not be in the future (today is 2026-10-05).' },
        issuingBody: { text: 'String must contain at most 160 character(s)' },
        certType: { text: "Invalid enum value. Expected 'PGS' | 'NPOP' | 'OTHER', received 'X'" },
      },
      other: [],
    });
  });

  it('BR-48: prefers the localized message when re-checking with the server\'s current window flags the same field', () => {
    // The server moved its window to 30 days; re-validating with the refreshed
    // config reproduces the rule, so the farmer gets it in their language.
    const recheck = validateCertificationForm(input({ issuedOn: '2026-01-01', expiresOn: '2026-09-01' }), {
      today: TODAY,
      maxPastDays: 30,
      maxFutureDays: MAX_FUTURE,
    });
    expect(recheck.ok).toBe(false);
    const mapped = serverCertificationFieldErrors(
      validationFailed({ 'body.expiresOn': ['Must be on or after 2026-09-05: ...'] }),
      recheck.ok ? {} : recheck.errors,
    );
    expect(mapped?.fields.expiresOn).toEqual({
      key: CERT_FORM_MESSAGES.expiryTooOld,
      params: { days: 30, date: '05/09/2026' },
    });
  });

  it('BR-48: a server error on body.certNumber (e.g. a number that cannot be used) maps to the cert-number field with the LOCALIZED certNumberTaken message, not the server text', () => {
    const mapped = serverCertificationFieldErrors(
      validationFailed({ 'body.certNumber': ["This certificate number can't be used. Check the number and try again."] }),
      {},
    );
    expect(mapped).toEqual({
      fields: { certNumber: { key: CERT_FORM_MESSAGES.certNumberTaken } },
      other: [],
    });
    expect(CERT_FORM_MESSAGES.certNumberTaken).toBe('farmer.certifications.add.error.certNumberTaken');
    // Rendered through the screens' translate: the English / Tamil catalogue text, never the server's English.
    const rendered = renderFieldErrors(mapped!.fields, (key) => (en as Record<string, string>)[key] ?? key);
    expect(rendered.certNumber).toBe((en as Record<string, string>)['farmer.certifications.add.error.certNumberTaken']);
    // ...and in Tamil: the Tamil catalogue text, which is not the server's English.
    const renderedTa = renderFieldErrors(mapped!.fields, (key) => (ta as Record<string, string>)[key] ?? key);
    expect(renderedTa.certNumber).toBe((ta as Record<string, string>)['farmer.certifications.add.error.certNumberTaken']);
    expect(renderedTa.certNumber).not.toBe(rendered.certNumber);
  });

  it('BR-48: when the client-side re-check also flags the cert number (blank / too long), that specific localized rule wins over certNumberTaken', () => {
    const recheck = validateCertificationForm(input({ certNumber: 'N'.repeat(CERT_NUMBER_MAX_LENGTH + 1) }), {
      today: TODAY,
      maxPastDays: MAX_PAST,
      maxFutureDays: MAX_FUTURE,
    });
    expect(recheck.ok).toBe(false);
    const mapped = serverCertificationFieldErrors(
      validationFailed({ 'body.certNumber': ['String must contain at most 80 character(s)'] }),
      recheck.ok ? {} : recheck.errors,
    );
    expect(mapped?.fields.certNumber).toEqual({
      key: CERT_FORM_MESSAGES.numberTooLong,
      params: { max: CERT_NUMBER_MAX_LENGTH },
    });
  });

  it('BR-48: the duplicate-number 422 reaches the cert-number field the same way for a PATCH (the edit screen shares this mapper)', () => {
    // POST and PATCH answer with the same Problem shape; the Edit screen calls this same function.
    const mapped = serverCertificationFieldErrors(
      validationFailed({ 'body.certNumber': ['anything the server says'] }),
      {},
    );
    expect(mapped?.fields.certNumber).toEqual({ key: 'farmer.certifications.add.error.certNumberTaken' });
  });

  it('BR-48: keys the form has no field for are returned separately, never dropped', () => {
    const mapped = serverCertificationFieldErrors(
      validationFailed({ 'body.documentUrl': ['Invalid url'], body: ['Expected object, received null'] }),
      {},
    );
    expect(mapped).toEqual({ fields: {}, other: ['Invalid url', 'Expected object, received null'] });
  });

  it('anything other than a 422 VALIDATION_FAILED with an errors map is left to the generic error handling', () => {
    expect(serverCertificationFieldErrors(new ApiError({ type: 'about:blank', title: 'Boom', status: 500, code: 'INTERNAL' }), {})).toBeNull();
    expect(
      serverCertificationFieldErrors(new ApiError({ type: 'about:blank', title: 'No', status: 403, code: 'FORBIDDEN' }), {}),
    ).toBeNull();
    expect(
      serverCertificationFieldErrors(
        new ApiError({ type: 'about:blank', title: 'Request validation failed', status: 422, code: 'VALIDATION_FAILED' }),
        {},
      ),
    ).toBeNull();
    expect(serverCertificationFieldErrors(new NetworkError(new Error('offline')), {})).toBeNull();
    expect(serverCertificationFieldErrors(new Error('x'), {})).toBeNull();
  });
});

describe('Add certification form: API calls', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setAccessToken('token-farmer-a');
  });
  afterEach(() => setAccessToken(null));

  it('BR-48: createCertification surfaces a server 422 (ApiError with the errors map) instead of saving a local copy', async () => {
    const problem = {
      type: 'https://docs.tohfa.in/problems/validation-failed',
      title: 'Request validation failed',
      status: 422,
      code: 'VALIDATION_FAILED',
      detail: 'One or more fields are invalid.',
      errors: { 'body.expiresOn': ['Must be a real calendar date in YYYY-MM-DD format'] },
      traceId: 'trace-1',
    };
    global.fetch = vi.fn(async () => problemResponse(problem, 422)) as typeof fetch;

    const attempt = createCertification({
      certType: 'PGS',
      certNumber: 'PGS-1',
      issuingBody: 'Council',
      issuedOn: '2025-01-01',
      expiresOn: '2026-02-30',
    });
    await expect(attempt).rejects.toBeInstanceOf(ApiError);
    await attempt.catch((err: unknown) => {
      expect((err as ApiError).problem.errors).toEqual(problem.errors);
      expect(serverCertificationFieldErrors(err, {})?.fields.expiresOn).toEqual({
        text: 'Must be a real calendar date in YYYY-MM-DD format',
      });
    });
  });

  it('BR-02h: createCertification sends certType OTHER exactly as the API enum', async () => {
    let sentBody: unknown;
    global.fetch = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      sentBody = JSON.parse(String(init?.body));
      return jsonResponse(
        {
          id: 'c1',
          certType: 'OTHER',
          certNumber: 'IND-1',
          issuingBody: 'Some Scheme',
          issuedOn: '2025-01-01',
          expiresOn: '2027-01-01',
          verificationStatus: 'UNVERIFIED',
          daysToExpiry: 400,
          blocksListings: true,
        },
        201,
      );
    }) as typeof fetch;

    const created = await createCertification({
      certType: 'OTHER',
      certNumber: 'IND-1',
      issuingBody: 'Some Scheme',
      issuedOn: '2025-01-01',
      expiresOn: '2027-01-01',
    });
    expect(sentBody).toMatchObject({ certType: 'OTHER', issuedOn: '2025-01-01', expiresOn: '2027-01-01' });
    expect(created.certType).toBe('OTHER');
  });

  it('BR-48b: getSystemConfig returns the server\'s certExpiryMaxPastDays (authoritative)', async () => {
    const urls: string[] = [];
    global.fetch = vi.fn(async (url: RequestInfo | URL) => {
      urls.push(String(url));
      return jsonResponse({ certExpiryWarningDays: 45, certExpiryMaxPastDays: 30, certExpiryMaxFutureDays: 200 });
    }) as typeof fetch;
    expect(await getSystemConfig()).toEqual({
      certExpiryWarningDays: 45,
      certExpiryMaxPastDays: 30,
      certExpiryMaxFutureDays: 200,
    });
    expect(urls[0]).toContain('/v1/config/farmer');
  });

  it('BR-48b: getSystemConfig falls back to 30 / 365 / 730 when the endpoint fails, and per field when one is missing or malformed', async () => {
    global.fetch = vi.fn(async () =>
      problemResponse({ type: 'about:blank', title: 'Boom', status: 500, code: 'INTERNAL' }, 500),
    ) as typeof fetch;
    expect(await getSystemConfig()).toEqual({
      certExpiryWarningDays: 30,
      certExpiryMaxPastDays: 365,
      certExpiryMaxFutureDays: 730,
    });

    global.fetch = vi.fn(async () => jsonResponse({ certExpiryWarningDays: 14 })) as typeof fetch;
    expect(await getSystemConfig()).toEqual({
      certExpiryWarningDays: 14,
      certExpiryMaxPastDays: 365,
      certExpiryMaxFutureDays: 730,
    });

    global.fetch = vi.fn(async () =>
      jsonResponse({ certExpiryWarningDays: 14, certExpiryMaxPastDays: -1, certExpiryMaxFutureDays: 1.5 }),
    ) as typeof fetch;
    expect(await getSystemConfig()).toEqual({
      certExpiryWarningDays: 14,
      certExpiryMaxPastDays: 365,
      certExpiryMaxFutureDays: 730,
    });

    // 0 is a real setting, not "missing" -- for both windows.
    global.fetch = vi.fn(async () =>
      jsonResponse({ certExpiryWarningDays: 14, certExpiryMaxPastDays: 0, certExpiryMaxFutureDays: 0 }),
    ) as typeof fetch;
    expect(await getSystemConfig()).toEqual({
      certExpiryWarningDays: 14,
      certExpiryMaxPastDays: 0,
      certExpiryMaxFutureDays: 0,
    });
  });
});

describe('Add certification form: strings', () => {
  const enCatalogue = en as Record<string, string>;
  const taCatalogue = ta as Record<string, string>;
  const placeholders = (text: string) => (text.match(/\{\{\w+\}\}/g) ?? []).sort();

  it('BR-48: every validation message and type label exists, non-empty, in English and Tamil with the same placeholders', () => {
    const keys = [...Object.values(CERT_FORM_MESSAGES), ...Object.values(CERT_TYPE_LABEL_KEY)];
    for (const key of keys) {
      expect(enCatalogue[key], `en ${key}`).toBeTruthy();
      expect(taCatalogue[key], `ta ${key}`).toBeTruthy();
      expect(placeholders(taCatalogue[key]!), key).toEqual(placeholders(enCatalogue[key]!));
    }
    expect(placeholders(enCatalogue[CERT_FORM_MESSAGES.expiryTooOld]!)).toEqual(['{{date}}', '{{days}}']);
    expect(placeholders(enCatalogue[CERT_FORM_MESSAGES.numberTooLong]!)).toEqual(['{{max}}']);
    expect(placeholders(enCatalogue[CERT_FORM_MESSAGES.issuerTooLong]!)).toEqual(['{{max}}']);
  });

  it('every farmer.certifications.add.* key has a Tamil translation', () => {
    const addKeys = Object.keys(enCatalogue).filter((k) => k.startsWith('farmer.certifications.add.'));
    expect(addKeys.length).toBeGreaterThan(0);
    for (const key of addKeys) expect(taCatalogue[key], key).toBeTruthy();
  });
});

describe('Certification form: the OTHER certification name (customTypeName)', () => {
  it('BR-48i: an OTHER certificate requires a name, trimmed, 1 to 80 characters', () => {
    expect(CUSTOM_TYPE_NAME_MAX_LENGTH).toBe(80);
    for (const blank of [undefined, '', '   ', '\t']) {
      expect(errorsOf({ certType: 'OTHER', customTypeName: blank }).customTypeName, String(blank)).toEqual({
        key: CERT_FORM_MESSAGES.customNameRequired,
      });
    }
    const n80 = 'N'.repeat(80);
    const ok = check({ certType: 'OTHER', customTypeName: `  ${n80}  ` });
    expect(ok.ok && ok.value.customTypeName).toBe(n80);
    expect(errorsOf({ certType: 'OTHER', customTypeName: 'N'.repeat(81) }).customTypeName).toEqual({
      key: CERT_FORM_MESSAGES.customNameTooLong,
      params: { max: 80 },
    });
  });

  it('BR-48i: the trimmed name is part of the request body for OTHER', () => {
    const result = check({ certType: 'OTHER', customTypeName: '  Fair Trade  ' });
    expect(result).toEqual({
      ok: true,
      value: {
        certType: 'OTHER',
        customTypeName: 'Fair Trade',
        certNumber: 'PGS-TN-2026-0042',
        issuingBody: 'PGS India Council',
        issuedOn: '2025-01-10',
        expiresOn: '2027-01-09',
      },
    });
  });

  it('BR-48i: PGS and NPOP ignore whatever name is in the box and never send one', () => {
    for (const certType of ['PGS', 'NPOP']) {
      const result = check({ certType, customTypeName: 'left over from OTHER' });
      expect(result.ok, certType).toBe(true);
      expect(result.ok && 'customTypeName' in result.value, certType).toBe(false);
    }
    // And a too-long leftover name does not block a PGS save.
    expect(check({ certType: 'PGS', customTypeName: 'N'.repeat(500) }).ok).toBe(true);
  });

  it('BR-48i: the name error is reported together with the other field errors', () => {
    expect(Object.keys(errorsOf({ certType: 'OTHER', customTypeName: '', certNumber: '' })).sort()).toEqual([
      'certNumber',
      'customTypeName',
    ]);
  });

  it('BR-48i: the server\'s body.customTypeName error lands on the name field', () => {
    const err = new ApiError({
      type: 'https://docs.tohfa.in/problems/validation-failed',
      title: 'Request validation failed',
      status: 422,
      code: 'VALIDATION_FAILED',
      errors: { 'body.customTypeName': ['customTypeName is required when certType is OTHER'] },
    });
    expect(serverCertificationFieldErrors(err, {})).toEqual({
      fields: { customTypeName: { text: 'customTypeName is required when certType is OTHER' } },
      other: [],
    });
  });
});

describe('Certification display name', () => {
  const translate = (key: string, params?: Record<string, string | number>) =>
    `${key}${params ? JSON.stringify(params) : ''}`;

  it('BR-48i: OTHER shows "Other · <custom name>" using the translated labels, never the raw enum', () => {
    expect(certificationDisplayName({ certType: 'OTHER', customTypeName: 'Fair Trade' }, translate)).toBe(
      'farmer.certifications.typeWithName{"type":"farmer.certifications.add.type.OTHER","name":"Fair Trade"}',
    );
    const real = certificationDisplayName(
      { certType: 'OTHER', customTypeName: 'Fair Trade' },
      (key, params) => (key === 'farmer.certifications.typeWithName' ? `${params?.type} · ${params?.name}` : (en as Record<string, string>)[key]!),
    );
    expect(real).toBe('Other · Fair Trade');
  });

  it('PGS and NPOP show only their translated label', () => {
    expect(certificationDisplayName({ certType: 'PGS', customTypeName: null }, translate)).toBe(
      'farmer.certifications.add.type.PGS',
    );
    expect(certificationDisplayName({ certType: 'NPOP' }, translate)).toBe('farmer.certifications.add.type.NPOP');
  });

  it('an OTHER certificate without a stored name (older record) falls back to the plain "Other" label', () => {
    expect(certificationDisplayName({ certType: 'OTHER', customTypeName: null }, translate)).toBe(
      'farmer.certifications.add.type.OTHER',
    );
    expect(certificationDisplayName({ certType: 'OTHER', customTypeName: '   ' }, translate)).toBe(
      'farmer.certifications.add.type.OTHER',
    );
  });
});

describe('Edit certification: merged validation and the patch that is sent', () => {
  const original: Certification = {
    id: 'c1',
    certType: 'PGS',
    customTypeName: null,
    certNumber: 'PGS-1',
    issuingBody: 'Council',
    issuedOn: '2025-01-10',
    expiresOn: '2027-01-09',
    documentUrl: 'https://files.example/doc.pdf',
    verificationStatus: 'VERIFIED',
    daysToExpiry: 100,
    blocksListings: false,
  };
  const formOf = (overrides: Partial<CertificationFormInput> = {}): CertificationFormInput => ({
    certType: original.certType,
    certNumber: original.certNumber,
    issuingBody: original.issuingBody,
    issuedOn: original.issuedOn,
    expiresOn: original.expiresOn,
    ...overrides,
  });
  const patchFor = (overrides: Partial<CertificationFormInput> = {}, documentUrl?: string, base = original) => {
    const checked = validateCertificationForm(formOf(overrides), { today: TODAY, maxPastDays: MAX_PAST, maxFutureDays: MAX_FUTURE });
    if (!checked.ok) throw new Error(`form invalid: ${JSON.stringify(checked.errors)}`);
    return buildCertificationPatch(base, checked.value, documentUrl);
  };

  it('BR-49: an untouched form produces an empty patch, so no request is made', () => {
    expect(patchFor()).toEqual({});
    // Whitespace around an unchanged value is not a change either.
    expect(patchFor({ certNumber: '  PGS-1  ', issuingBody: ' Council ' })).toEqual({});
    expect(patchFor({}, original.documentUrl!)).toEqual({});
  });

  it('BR-49: only the fields that changed are in the patch', () => {
    expect(patchFor({ certNumber: 'PGS-2' })).toEqual({ certNumber: 'PGS-2' });
    expect(patchFor({ expiresOn: '2027-06-01', issuingBody: 'New Council' })).toEqual({
      expiresOn: '2027-06-01',
      issuingBody: 'New Council',
    });
    expect(patchFor({}, 'https://files.example/new.pdf')).toEqual({ documentUrl: 'https://files.example/new.pdf' });
  });

  it('BR-49: changing PGS to OTHER sends the type and the name; changing OTHER back to NPOP sends the type and customTypeName null', () => {
    expect(patchFor({ certType: 'OTHER', customTypeName: ' Fair Trade ' })).toEqual({
      certType: 'OTHER',
      customTypeName: 'Fair Trade',
    });
    const otherCert: Certification = { ...original, certType: 'OTHER', customTypeName: 'Fair Trade' };
    expect(patchFor({ certType: 'NPOP', customTypeName: 'Fair Trade' }, undefined, otherCert)).toEqual({
      certType: 'NPOP',
      customTypeName: null,
    });
  });

  it('BR-49: renaming an OTHER certificate sends only the name; an unchanged name sends nothing', () => {
    const otherCert: Certification = { ...original, certType: 'OTHER', customTypeName: 'Fair Trade' };
    expect(patchFor({ certType: 'OTHER', customTypeName: 'GlobalG.A.P.' }, undefined, otherCert)).toEqual({
      customTypeName: 'GlobalG.A.P.',
    });
    expect(patchFor({ certType: 'OTHER', customTypeName: ' Fair Trade ' }, undefined, otherCert)).toEqual({});
  });

  it('BR-48 / BR-49: the merged result is validated like a new certificate -- a patch that would break a rule never gets built', () => {
    // Both windows, the ordering and the name apply to an edit exactly as to an add.
    expect(errorsOf({ expiresOn: '2028-10-05' }).expiresOn).toMatchObject({ key: CERT_FORM_MESSAGES.expiryTooFar });
    expect(errorsOf({ expiresOn: '2025-10-04', issuedOn: '2024-01-01' }).expiresOn).toMatchObject({
      key: CERT_FORM_MESSAGES.expiryTooOld,
    });
    expect(errorsOf({ certType: 'OTHER', customTypeName: '' }).customTypeName).toEqual({
      key: CERT_FORM_MESSAGES.customNameRequired,
    });
  });

  it('BR-49: editing resets a VERIFIED or REJECTED certificate to unverified, so the edit screen warns for those and not for UNVERIFIED', () => {
    expect(editNeedsReverification('VERIFIED')).toBe(true);
    expect(editNeedsReverification('REJECTED')).toBe(true);
    expect(editNeedsReverification('UNVERIFIED')).toBe(false);
  });

  it('BR-49: the re-verification notice exists in English and Tamil', () => {
    for (const catalogue of [en as Record<string, string>, ta as Record<string, string>]) {
      expect(catalogue['farmer.certifications.edit.reverifyNotice']).toBeTruthy();
      expect(catalogue['farmer.certifications.edit.savedReverifyBody']).toBeTruthy();
    }
  });
});

describe('Certification screens: error classification and document type', () => {
  it('a 404 is "notFound", a transport failure is "network", everything else is "other"', () => {
    expect(certificationErrorKind(new ApiError({ type: 'about:blank', title: 'Not found', status: 404, code: 'NOT_FOUND' }))).toBe('notFound');
    expect(certificationErrorKind(new ApiError({ type: 'about:blank', title: 'Boom', status: 500, code: 'INTERNAL' }))).toBe('other');
    expect(certificationErrorKind(new NetworkError(new Error('offline')))).toBe('network');
    expect(certificationErrorKind(new Error('x'))).toBe('other');
  });

  it('only PDF / JPEG / PNG / WebP can be attached; the picker\'s MIME type wins, the extension is the fallback', () => {
    expect(resolveCertificateContentType('a.pdf', 'application/pdf')).toBe('application/pdf');
    expect(resolveCertificateContentType('scan.JPG', null)).toBe('image/jpeg');
    expect(resolveCertificateContentType('scan.jpeg', undefined)).toBe('image/jpeg');
    expect(resolveCertificateContentType('scan.png', 'application/octet-stream')).toBe('image/png');
    expect(resolveCertificateContentType('scan.webp', null)).toBe('image/webp');
    expect(resolveCertificateContentType('photo', 'image/png')).toBe('image/png');
    expect(resolveCertificateContentType('notes.docx', null)).toBeNull();
    expect(resolveCertificateContentType('noext', null)).toBeNull();
  });
});

describe('Certification screens: new strings', () => {
  const enCatalogue = en as Record<string, string>;
  const taCatalogue = ta as Record<string, string>;
  const placeholders = (text: string) => (text.match(/\{\{\w+\}\}/g) ?? []).sort();

  const NEW_KEYS = [
    'farmer.certifications.add.error.customNameRequired',
    'farmer.certifications.add.error.customNameTooLong',
    'farmer.certifications.add.error.expiryTooFar',
    'farmer.certifications.typeWithName',
    'farmer.certifications.doc.error.pickFailed',
    'farmer.certifications.doc.error.uploadFailed',
    'farmer.certifications.doc.error.unsupported',
    'farmer.certifications.doc.kind.pdf',
    'farmer.certifications.doc.kind.image',
    'farmer.certifications.doc.meta',
    'farmer.certifications.doc.attached',
    'farmer.certifications.doc.defaultName',
    'farmer.certifications.noDocument.title',
    'farmer.certifications.noDocument.body',
    'farmer.certifications.viewDocument.title',
    'farmer.certifications.edit.replaceDoc',
    'farmer.certifications.edit.reverifyNotice',
    'farmer.certifications.edit.savedTitle',
    'farmer.certifications.edit.savedBody',
    'farmer.certifications.edit.savedReverifyBody',
    'farmer.certifications.edit.saveFailedBody',
    'farmer.certifications.edit.deleteFailedBody',
    'farmer.certifications.edit.goneTitle',
    'farmer.certifications.edit.goneBody',
    'farmer.certifications.add.error.certNumberTaken',
    'farmer.certifications.loadError',
  ];

  it('BR-48 / BR-49 / BR-50: every new key exists in English and Tamil with matching placeholders', () => {
    for (const key of NEW_KEYS) {
      expect(enCatalogue[key], `en ${key}`).toBeTruthy();
      expect(taCatalogue[key], `ta ${key}`).toBeTruthy();
      expect(placeholders(taCatalogue[key]!), key).toEqual(placeholders(enCatalogue[key]!));
    }
    expect(placeholders(enCatalogue['farmer.certifications.add.error.expiryTooFar']!)).toEqual(['{{date}}', '{{days}}']);
    expect(placeholders(enCatalogue['farmer.certifications.add.error.customNameTooLong']!)).toEqual(['{{max}}']);
    expect(placeholders(enCatalogue['farmer.certifications.typeWithName']!)).toEqual(['{{name}}', '{{type}}']);
    expect(placeholders(enCatalogue['farmer.certifications.doc.meta']!)).toEqual(['{{kind}}', '{{size}}']);
  });

  it('BR-48: the form messages map covers the three new validation messages', () => {
    expect(CERT_FORM_MESSAGES.customNameRequired).toBe('farmer.certifications.add.error.customNameRequired');
    expect(CERT_FORM_MESSAGES.customNameTooLong).toBe('farmer.certifications.add.error.customNameTooLong');
    expect(CERT_FORM_MESSAGES.expiryTooFar).toBe('farmer.certifications.add.error.expiryTooFar');
  });
});

describe('Certification screens: upload helper text matches the server limits', () => {
  // apps/api/src/modules/uploads/uploads.schema.ts: sizeBytes max 26_214_400 (25 MiB);
  // apps/api/src/storage/imageProcessor.ts ALLOWED_MIME_TYPES: jpeg, png, webp, pdf.
  const enCatalogue = en as Record<string, string>;
  const taCatalogue = ta as Record<string, string>;
  const KEYS = ['farmer.certifications.edit.uploadHelper', 'farmer.certifications.add.uploadPrompt'];

  it('the certificate upload helper states the real 25 MB limit and WebP, in English and Tamil, never the stale 10 MB', () => {
    for (const catalogue of [enCatalogue, taCatalogue]) {
      const helper = catalogue['farmer.certifications.edit.uploadHelper']!;
      expect(helper).toContain('25 MB');
      expect(helper).not.toContain('10 MB');
      expect(helper).toContain('WebP');
    }
  });

  it('no certification upload string still advertises a PDF/JPG/PNG-only list or a 10 MB limit', () => {
    for (const key of KEYS) {
      for (const catalogue of [enCatalogue, taCatalogue]) {
        expect(catalogue[key], key).toBeTruthy();
        expect(catalogue[key]!, key).not.toContain('10 MB');
        expect(catalogue[key]!, key).toContain('WebP');
      }
    }
  });
});

describe('Certification screens: every farmer.* translation key they reference exists in English and Tamil', () => {
  const enCatalogue = en as Record<string, string>;
  const taCatalogue = ta as Record<string, string>;
  const FILES = [
    '../screens/certifications/CertificationsScreen.tsx',
    '../screens/certifications/AddCertificationScreen.tsx',
    '../screens/certifications/EditCertificationScreen.tsx',
    '../screens/certifications/certificationForm.ts',
    '../screens/profile/ProfileScreen.tsx',
  ];

  it.each(FILES)('%s: no key is missing from either catalogue, and no bare error.generic key is used', (file) => {
    const source = fs.readFileSync(path.resolve(__dirname, file), 'utf8');
    const keys = new Set([...source.matchAll(/['"`](farmer\.[A-Za-z0-9_.]+)['"`]/g)].map((m) => m[1]!));
    expect(keys.size).toBeGreaterThan(0);
    for (const key of keys) {
      expect(enCatalogue[key], `en ${key}`).toBeTruthy();
      expect(taCatalogue[key], `ta ${key}`).toBeTruthy();
    }
    expect(source).not.toContain("t('error.generic')");
  });

  it('the load-error message is translated, with no placeholders to drift', () => {
    expect(enCatalogue['farmer.certifications.loadError']).toBeTruthy();
    expect(taCatalogue['farmer.certifications.loadError']).toBeTruthy();
    expect(taCatalogue['farmer.certifications.loadError']).not.toBe(enCatalogue['farmer.certifications.loadError']);
  });
});
