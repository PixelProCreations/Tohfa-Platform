/**
 * Add Certification form: the client-side pre-check of BR-48 and the mapping
 * of the server's 422 back onto the form's fields. Pure (no React, no `t()`),
 * so it runs in this app's plain-Node vitest -- see
 * tests/certification_form.test.ts.
 *
 * BR-48 is ENFORCED by the server (`certificationCreateSchema` +
 * `certificationDateErrors` in apps/api/src/modules/certifications). These are
 * the same rules, run before anything is sent so the farmer sees the problem
 * under the field; when the server still disagrees (a changed window, a clock
 * at the day boundary) its answer is shown under the same field.
 *
 * Messages are returned as translation keys + params; the screen renders them
 * with `t()`.
 */
import type { TranslationKey } from '../../../../i18n/farmer';
import { ApiError, NetworkError } from '../../../../shell/api/client';
import type { Certification, CertificationCreate, CertificationUpdate } from '../../api/farmer';

export type CertificationType = Certification['certType'];

/** The `CertificationType` enum of docs/openapi.yaml, in the order the chooser lists it. */
export const CERTIFICATION_TYPES: ReadonlyArray<CertificationType> = ['PGS', 'NPOP', 'OTHER'];

export const CERT_TYPE_LABEL_KEY: Record<CertificationType, TranslationKey> = {
  PGS: 'farmer.certifications.add.type.PGS',
  NPOP: 'farmer.certifications.add.type.NPOP',
  OTHER: 'farmer.certifications.add.type.OTHER',
};

/**
 * Input-length limits of `CertificationCreate` (docs/openapi.yaml maxLength,
 * the server's zod schema). Field sizes, not business thresholds -- the one
 * business threshold here, the lapsed-certificate window, comes from
 * GET /config/farmer.
 */
export const CERT_NUMBER_MAX_LENGTH = 80;
export const ISSUING_BODY_MAX_LENGTH = 160;
export const CUSTOM_TYPE_NAME_MAX_LENGTH = 80;

export const CERT_FORM_MESSAGES = {
  typeRequired: 'farmer.certifications.add.error.typeRequired',
  numberRequired: 'farmer.certifications.add.error.numberRequired',
  numberTooLong: 'farmer.certifications.add.error.numberTooLong',
  issuerRequired: 'farmer.certifications.add.error.issuerRequired',
  issuerTooLong: 'farmer.certifications.add.error.issuerTooLong',
  dateRequired: 'farmer.certifications.add.error.dateRequired',
  dateInvalid: 'farmer.certifications.add.error.dateInvalid',
  issuedInFuture: 'farmer.certifications.add.error.issuedInFuture',
  expiryNotAfterIssue: 'farmer.certifications.add.error.expiryNotAfterIssue',
  expiryTooOld: 'farmer.certifications.add.error.expiryTooOld',
  expiryTooFar: 'farmer.certifications.add.error.expiryTooFar',
  customNameRequired: 'farmer.certifications.add.error.customNameRequired',
  customNameTooLong: 'farmer.certifications.add.error.customNameTooLong',
  /**
   * The server answered a 422 on `body.certNumber` that the client-side rules
   * do not explain -- in practice the number is already in use. The server
   * words this generically on purpose (it must not reveal whose number it is),
   * so the screen shows this localized equivalent rather than the server text.
   */
  certNumberTaken: 'farmer.certifications.add.error.certNumberTaken',
} as const satisfies Record<string, TranslationKey>;

export type CertificationFormField =
  | 'certType'
  | 'customTypeName'
  | 'certNumber'
  | 'issuingBody'
  | 'issuedOn'
  | 'expiresOn';

/** A localized message (rendered with `t(key, params)`), or the server's own text as a fallback. */
export type FieldMessage =
  | { key: TranslationKey; params?: Record<string, string | number> }
  | { text: string };

export type CertificationFormErrors = Partial<Record<CertificationFormField, FieldMessage>>;

export interface CertificationFormInput {
  /** Anything the chooser holds; only an exact `CERTIFICATION_TYPES` value is accepted. */
  certType: string | null | undefined;
  /** The name of an OTHER certification; ignored (and never sent) for PGS / NPOP. */
  customTypeName?: string | undefined;
  certNumber: string;
  issuingBody: string;
  /** YYYY-MM-DD as the API takes it ('' = not chosen). Convert the picker's DD/MM/YYYY with displayDateToIso. */
  issuedOn: string;
  expiresOn: string;
}

export interface CertificationFormContext {
  /** Today's Asia/Kolkata calendar date, YYYY-MM-DD -- todayInKolkata(). */
  today: string;
  /** `certExpiryMaxPastDays` from GET /config/farmer (system_config.cert_expiry_max_past_days). */
  maxPastDays: number;
  /** `certExpiryMaxFutureDays` from GET /config/farmer (system_config.cert_expiry_max_future_days). */
  maxFutureDays: number;
}

/** The validated, trimmed fields of the form -- the body of a POST, or the merged state a PATCH is diffed from. */
export type CertificationFormValue = Omit<CertificationCreate, 'documentUrl'>;

export type CertificationFormResult =
  | { ok: true; value: CertificationFormValue }
  | { ok: false; errors: CertificationFormErrors };

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DISPLAY_DATE = /^(\d{2})\/(\d{2})\/(\d{4})$/;

/** Asia/Kolkata is a fixed UTC+05:30 with no DST, so a plain offset is exact. */
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

/**
 * True only for a real calendar date written exactly as YYYY-MM-DD (year
 * 0001-9999) -- the same test as the server's `isCalendarDate`, so 2026-02-30,
 * 2027-02-29 and 2100-02-29 are refused and 2028-02-29 / 2000-02-29 accepted.
 */
export function isCalendarDate(value: string): boolean {
  const match = ISO_DATE.exec(value);
  if (match === null) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const daysInMonth = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]!;
  return day <= daysInMonth;
}

/** Today's calendar date in Asia/Kolkata (the server's "today" for BR-48), as YYYY-MM-DD. */
export function todayInKolkata(nowMs: number = Date.now()): string {
  return new Date(nowMs + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** Shift a YYYY-MM-DD calendar date by whole days (negative = earlier), as the server does. */
export function addDaysIso(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * The date picker's `DD/MM/YYYY` (the format this screen shows) as the API's
 * `YYYY-MM-DD`. Shape only -- calendar validity is `isCalendarDate`'s job.
 * Null for anything else, including an empty string.
 */
export function displayDateToIso(display: string): string | null {
  const match = DISPLAY_DATE.exec(display);
  if (match === null) return null;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

/** YYYY-MM-DD as the screen's DD/MM/YYYY, for dates quoted in messages. */
export function isoToDisplayDate(iso: string): string {
  const match = ISO_DATE.exec(iso);
  return match === null ? iso : `${match[3]}/${match[2]}/${match[1]}`;
}

function isCertificationType(value: unknown): value is CertificationType {
  return typeof value === 'string' && (CERTIFICATION_TYPES as readonly string[]).includes(value);
}

/**
 * BR-48, every rule the server applies to POST /farmers/me/certifications:
 * a known type; certNumber / issuingBody non-blank after trimming and at most
 * 80 / 160 characters; both dates real YYYY-MM-DD calendar dates; expiresOn
 * strictly after issuedOn; issuedOn not after today; expiresOn not more than
 * `maxPastDays` days before today (exactly `maxPastDays` days ago is allowed)
 * nor more than `maxFutureDays` days after it (exactly that many is allowed);
 * an OTHER certificate carries a non-blank name of at most 80 characters, and
 * PGS / NPOP never carry one. "Today" is Asia/Kolkata. Every failing field is
 * reported at once, one message per field.
 *
 * The edit screen runs the same function over the whole form, i.e. over the
 * merged result of the stored certificate and the farmer's changes, which is
 * what the server validates a PATCH against.
 */
export function validateCertificationForm(
  input: CertificationFormInput,
  context: CertificationFormContext,
): CertificationFormResult {
  const errors: CertificationFormErrors = {};

  const certType = isCertificationType(input.certType) ? input.certType : null;
  if (certType === null) errors.certType = { key: CERT_FORM_MESSAGES.typeRequired };

  const customTypeName = (input.customTypeName ?? '').trim();
  if (certType === 'OTHER') {
    if (customTypeName.length === 0) {
      errors.customTypeName = { key: CERT_FORM_MESSAGES.customNameRequired };
    } else if (customTypeName.length > CUSTOM_TYPE_NAME_MAX_LENGTH) {
      errors.customTypeName = {
        key: CERT_FORM_MESSAGES.customNameTooLong,
        params: { max: CUSTOM_TYPE_NAME_MAX_LENGTH },
      };
    }
  }

  const certNumber = input.certNumber.trim();
  if (certNumber.length === 0) {
    errors.certNumber = { key: CERT_FORM_MESSAGES.numberRequired };
  } else if (certNumber.length > CERT_NUMBER_MAX_LENGTH) {
    errors.certNumber = { key: CERT_FORM_MESSAGES.numberTooLong, params: { max: CERT_NUMBER_MAX_LENGTH } };
  }

  const issuingBody = input.issuingBody.trim();
  if (issuingBody.length === 0) {
    errors.issuingBody = { key: CERT_FORM_MESSAGES.issuerRequired };
  } else if (issuingBody.length > ISSUING_BODY_MAX_LENGTH) {
    errors.issuingBody = { key: CERT_FORM_MESSAGES.issuerTooLong, params: { max: ISSUING_BODY_MAX_LENGTH } };
  }

  const issuedOk = isCalendarDate(input.issuedOn);
  const expiresOk = isCalendarDate(input.expiresOn);

  if (!issuedOk) {
    errors.issuedOn = { key: input.issuedOn === '' ? CERT_FORM_MESSAGES.dateRequired : CERT_FORM_MESSAGES.dateInvalid };
  } else if (input.issuedOn > context.today) {
    errors.issuedOn = { key: CERT_FORM_MESSAGES.issuedInFuture };
  }

  if (!expiresOk) {
    errors.expiresOn = { key: input.expiresOn === '' ? CERT_FORM_MESSAGES.dateRequired : CERT_FORM_MESSAGES.dateInvalid };
  } else if (issuedOk && input.expiresOn <= input.issuedOn) {
    // Before the window check, as on the server: its schema refuses the
    // ordering before the date-window check ever runs.
    errors.expiresOn = { key: CERT_FORM_MESSAGES.expiryNotAfterIssue };
  } else {
    const earliest = addDaysIso(context.today, -context.maxPastDays);
    const latest = addDaysIso(context.today, context.maxFutureDays);
    if (input.expiresOn < earliest) {
      errors.expiresOn = {
        key: CERT_FORM_MESSAGES.expiryTooOld,
        params: { days: context.maxPastDays, date: isoToDisplayDate(earliest) },
      };
    } else if (input.expiresOn > latest) {
      errors.expiresOn = {
        key: CERT_FORM_MESSAGES.expiryTooFar,
        params: { days: context.maxFutureDays, date: isoToDisplayDate(latest) },
      };
    }
  }

  if (certType === null || Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      certType,
      ...(certType === 'OTHER' ? { customTypeName } : {}),
      certNumber,
      issuingBody,
      issuedOn: input.issuedOn,
      expiresOn: input.expiresOn,
    },
  };
}

const SERVER_FIELD: Record<string, CertificationFormField> = {
  'body.certType': 'certType',
  'body.customTypeName': 'customTypeName',
  'body.certNumber': 'certNumber',
  'body.issuingBody': 'issuingBody',
  'body.issuedOn': 'issuedOn',
  'body.expiresOn': 'expiresOn',
};

/**
 * A 422 VALIDATION_FAILED from POST / PATCH /farmers/me/certifications, as field
 * messages. The Problem's `errors` is a map keyed `body.<field>` with a list
 * of English messages (apps/api/src/http/errorHandler.ts zodToAppError).
 *
 * The server's text is never parsed. Instead `localRecheck` -- the form
 * re-validated by the caller with freshly fetched config -- supplies the
 * localized message when it flags the same field (the rule is then known);
 * otherwise the server's first message for that field is shown as-is -- except
 * `body.certNumber`, whose unexplained failure is the number being unusable and
 * maps to the localized `certNumberTaken` message. Keys
 * the form has no field for are returned in `other`, never dropped.
 *
 * Null for anything else (another status or code, no `errors`, a network
 * error): the screen's generic error handling applies.
 */
export function serverCertificationFieldErrors(
  err: unknown,
  localRecheck: CertificationFormErrors,
): { fields: CertificationFormErrors; other: string[] } | null {
  if (!(err instanceof ApiError)) return null;
  const { problem } = err;
  if (problem.status !== 422 || problem.code !== 'VALIDATION_FAILED' || problem.errors === undefined) return null;
  const entries = Object.entries(problem.errors);
  if (entries.length === 0) return null;

  const fields: CertificationFormErrors = {};
  const other: string[] = [];
  for (const [key, messages] of entries) {
    const field = SERVER_FIELD[key];
    const texts = messages.filter((m) => m.trim().length > 0);
    if (field === undefined) {
      other.push(...texts);
      continue;
    }
    const first = texts[0];
    const local = localRecheck[field];
    if (local !== undefined) fields[field] = local;
    else if (first !== undefined) {
      // A certNumber error the client rules (blank / too long) did not predict is
      // the number being unusable (BR-48): show the localized message, not the server's English.
      fields[field] = field === 'certNumber' ? { key: CERT_FORM_MESSAGES.certNumberTaken } : { text: first };
    }
  }
  return { fields, other };
}

/**
 * What the screens show for a certificate's type: the translated label, and for
 * OTHER "<Other> · <custom name>" -- never the raw enum. An OTHER certificate
 * with no stored name (a record from before names existed) shows just "Other".
 * `translate` is the screen's `t`, so this stays free of the i18n runtime.
 */
export function certificationDisplayName(
  cert: Pick<Certification, 'certType'> & { customTypeName?: string | null | undefined },
  translate: (key: TranslationKey, params?: Record<string, string | number>) => string,
): string {
  const typeLabel = translate(CERT_TYPE_LABEL_KEY[cert.certType]);
  const name = (cert.customTypeName ?? '').trim();
  if (cert.certType !== 'OTHER' || name.length === 0) return typeLabel;
  return translate('farmer.certifications.typeWithName', { type: typeLabel, name });
}

/**
 * BR-49: any change to a certificate's details sends a VERIFIED or REJECTED one
 * back to UNVERIFIED (the server does this; the edit screen only warns).
 */
export function editNeedsReverification(status: Certification['verificationStatus']): boolean {
  return status !== 'UNVERIFIED';
}

/**
 * The PATCH body for an edit: only the fields whose validated value differs
 * from the stored certificate (so an untouched form yields `{}` and sends
 * nothing). Moving away from OTHER sends `customTypeName: null` explicitly, as
 * the server requires; a PGS / NPOP certificate never has a name to compare.
 * `documentUrl` is the URL of a newly uploaded document, if any.
 */
export function buildCertificationPatch(
  original: Certification,
  next: CertificationFormValue,
  documentUrl?: string | undefined,
): CertificationUpdate {
  const patch: CertificationUpdate = {};
  if (next.certType !== original.certType) patch.certType = next.certType;

  const originalName = original.certType === 'OTHER' ? (original.customTypeName ?? null) : null;
  const nextName = next.certType === 'OTHER' ? (next.customTypeName ?? null) : null;
  if (nextName !== originalName) patch.customTypeName = nextName;

  if (next.certNumber !== original.certNumber) patch.certNumber = next.certNumber;
  if (next.issuingBody !== original.issuingBody) patch.issuingBody = next.issuingBody;
  if (next.issuedOn !== original.issuedOn) patch.issuedOn = next.issuedOn;
  if (next.expiresOn !== original.expiresOn) patch.expiresOn = next.expiresOn;
  if (documentUrl !== undefined && documentUrl !== (original.documentUrl ?? null)) patch.documentUrl = documentUrl;
  return patch;
}

/** How a failed certification request should be reported (validation 422s are handled before this). */
export type CertificationErrorKind = 'notFound' | 'network' | 'other';

export function certificationErrorKind(err: unknown): CertificationErrorKind {
  if (err instanceof NetworkError) return 'network';
  if (err instanceof ApiError && (err.problem.status === 404 || err.is('NOT_FOUND'))) return 'notFound';
  return 'other';
}

const CERTIFICATE_CONTENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'] as const;
export type CertificateContentType = (typeof CERTIFICATE_CONTENT_TYPES)[number];

const EXTENSION_CONTENT_TYPE: Record<string, CertificateContentType> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

/**
 * The MIME type to sign a certificate upload with: the picker's own type when
 * it is one POST /uploads/sign accepts, else the file extension's; null when
 * the file is not a PDF / JPEG / PNG / WebP (the screen then attaches nothing).
 */
export function resolveCertificateContentType(
  fileName: string,
  mimeType: string | null | undefined,
): CertificateContentType | null {
  if (mimeType != null && (CERTIFICATE_CONTENT_TYPES as readonly string[]).includes(mimeType)) {
    return mimeType as CertificateContentType;
  }
  const dot = fileName.lastIndexOf('.');
  const extension = dot === -1 ? '' : fileName.slice(dot + 1).toLowerCase();
  return EXTENSION_CONTENT_TYPE[extension] ?? null;
}

/**
 * The date picker fills DD/MM/YYYY (the format the screens show); the API takes
 * YYYY-MM-DD. '' stays '' ("not chosen"); anything else unconvertible is passed
 * through so the validator reports it as an invalid date.
 */
export function pickerDateToIso(display: string): string {
  if (display === '') return '';
  return displayDateToIso(display) ?? display;
}

/** Field messages as the strings a screen renders: localized with `translate`, or the server's own text. */
export function renderFieldErrors(
  errors: CertificationFormErrors,
  translate: (key: TranslationKey, params?: Record<string, string | number>) => string,
): Partial<Record<CertificationFormField, string>> {
  const out: Partial<Record<CertificationFormField, string>> = {};
  for (const [field, message] of Object.entries(errors) as Array<[CertificationFormField, FieldMessage | undefined]>) {
    if (message === undefined) continue;
    out[field] = 'key' in message ? translate(message.key, message.params) : message.text;
  }
  return out;
}
