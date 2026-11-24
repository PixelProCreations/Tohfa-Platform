/**
 * Boot-time configuration.
 *
 * Every environment variable the API reads is declared and validated HERE and
 * nowhere else. `process.env` must never be touched outside this file — that
 * way a missing variable is a loud crash at boot instead of an `undefined`
 * surfacing three weeks later inside a payout job.
 */
import { config as loadDotenv } from 'dotenv';
import { join } from 'node:path';
import { z } from 'zod';
import { parseDatabaseSsl } from './db/poolConfig.js';
import { REPO_ROOT } from './paths.js';

loadDotenv({ path: join(REPO_ROOT, '.env') });

const csv = z
  .string()
  .transform((value) =>
    value
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.length > 0),
  );

const intFromEnv = (min: number, max: number) =>
  z.coerce.number().int().min(min).max(max);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: intFromEnv(1, 65535).default(3000),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  // TLS for the Postgres connection: false (default) | true | no-verify.
  // Semantics and the pg `sslmode=require` caveat live in db/poolConfig.ts.
  DATABASE_SSL: z
    .string()
    .default('false')
    .refine(
      (value) => {
        try {
          parseDatabaseSsl(value);
          return true;
        } catch {
          return false;
        }
      },
      'DATABASE_SSL must be one of: false, true, no-verify',
    ),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  // Short on purpose: `requireAuth` verifies the JWT signature/expiry, plus a
  // Redis-backed per-user "don't trust tokens issued before this moment"
  // stamp (see auth/tokenInvalidation.ts) that password change/reset write.
  // Ordinary logout and refresh-token rotation still only invalidate the
  // *refresh* token immediately -- that is a deliberate, narrower scope (see
  // tokenInvalidation.ts's docblock) -- so an access token already issued for
  // those stays valid until it naturally expires. This TTL is that window.
  // 5 minutes bounds it tightly without materially increasing
  // refresh-endpoint traffic, since the client already refreshes
  // transparently on a 401.
  JWT_ACCESS_TTL: z.string().min(1).default('5m'),
  JWT_REFRESH_TTL: z.string().min(1).default('30d'),

  AZURE_STORAGE_CONNECTION_STRING: z.string().default(''),
  AZURE_BLOB_CONTAINER: z.string().default('tohfa-media'),

  // Base of every product image URL (modules/catalog/catalog.image.ts, BR-16/BR-195): the URL is
  // always <base>/<catalog key>.jpg, never anything derived from a listing, farm or upload. Production
  // keeps the CDN default; local dev sets http://localhost:3000/product-images (the API's own dev-only
  // static route, storage/productImages.routes.ts). Empty means unset. Trailing slashes are dropped.
  PRODUCT_IMAGE_BASE_URL: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z
      .string()
      .url()
      .refine((value) => /^https?:\/\//.test(value), 'PRODUCT_IMAGE_BASE_URL must be an http(s) URL')
      .refine((value) => !/[?#]/.test(value), 'PRODUCT_IMAGE_BASE_URL must not carry a query or fragment')
      .default('https://cdn.tohfa.in/products')
      .transform((value) => value.replace(/\/+$/, '')),
  ),

  RAZORPAY_KEY_ID: z.string().default(''),
  RAZORPAY_KEY_SECRET: z.string().default(''),
  RAZORPAY_WEBHOOK_SECRET: z.string().default(''),
  RAZORPAYX_ACCOUNT: z.string().default(''),
  PAYMENT_PROVIDER: z.enum(['mock', 'razorpay']).default('mock'),

  SMS_PROVIDER: z.enum(['mock', 'msg91']).default('mock'),
  MSG91_AUTH_KEY: z.string().default(''),
  /** DLT-approved Flow template id for the OTP SMS (##OTP## variable). */
  MSG91_OTP_TEMPLATE_ID: z.string().default(''),
  FCM_SERVER_KEY: z.string().default(''),
  SENTRY_DSN: z.string().default(''),

  // OAuth social login (BR-39). Alternate login/prefill only — see
  // apps/api/src/modules/auth/oauth.providers.ts. Real console credentials do
  // not exist yet, so these default to '' like the other not-yet-provisioned
  // provider keys above; an empty GOOGLE_OAUTH_CLIENT_ID or missing
  // FACEBOOK_APP_SECRET makes the corresponding verifier fail closed with
  // OAUTH_TOKEN_INVALID at request time rather than the app refusing to boot.
  GOOGLE_OAUTH_CLIENT_ID: z.string().default(''),
  FACEBOOK_APP_ID: z.string().default(''),
  FACEBOOK_APP_SECRET: z.string().default(''),

  // No mock/no-op fallback by design — an empty key makes the weather
  // gateway fail closed with WEATHER_PROVIDER_ERROR at request time (see
  // apps/api/src/weather/openweathermap.weather.ts) rather than the app
  // refusing to boot, so the rest of the API stays usable without one.
  OPENWEATHERMAP_API_KEY: z.string().default(''),

  OTP_LENGTH: intFromEnv(4, 8).default(6),
  OTP_TTL_SECONDS: intFromEnv(30, 3600).default(300),
  OTP_MAX_ATTEMPTS: intFromEnv(1, 20).default(3),
  OTP_RESEND_SECONDS: intFromEnv(0, 3600).default(60),

  // S-20 rate limiting. Limits are configuration, never literals in code.
  // The auth surface limiter keys by mobile AND by IP; the per-mobile budget is
  // deliberately larger than the BR-32 3-attempt OTP lockout so the sliding
  // window cannot pre-empt the challenge lockout.
  AUTH_RATE_LIMIT_MAX: intFromEnv(1, 10_000).default(20),
  AUTH_RATE_LIMIT_WINDOW_SECONDS: intFromEnv(1, 86_400).default(300),
  AUTH_RATE_LIMIT_IP_MAX: intFromEnv(1, 10_000).default(120),
  AUTH_RATE_LIMIT_IP_WINDOW_SECONDS: intFromEnv(1, 86_400).default(300),

  // Vendor-neutral email (customer email OTP). `log` is dev/test only; production needs smtp.
  EMAIL_TRANSPORT: z.enum(['smtp', 'log', 'disabled']).optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: intFromEnv(1, 65535).default(587),
  SMTP_SECURE: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  EMAIL_FROM_NAME: z.string().min(1).default('TOHFA'),
  EMAIL_OTP_MAX_SENDS_PER_HOUR: intFromEnv(1, 100).default(3),

  CORS_ORIGINS: csv.default('http://localhost:4200'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
});

export type Config = Omit<z.infer<typeof envSchema>, 'EMAIL_TRANSPORT'> & {
  /** Resolved: unset means `log` outside production; production requires `smtp`. */
  readonly EMAIL_TRANSPORT: 'smtp' | 'log' | 'disabled';
  readonly isProduction: boolean;
  readonly isTest: boolean;
};

function load(): Config {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const lines = parsed.error.issues.map(
      (issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`,
    );
    // Deliberately not the logger: the logger itself depends on this config.
    throw new Error(`Invalid environment configuration:\n${lines.join('\n')}`);
  }

  const value = parsed.data;

  // Fail loudly rather than silently falling back to mocks in production.
  if (value.NODE_ENV === 'production') {
    if (value.PAYMENT_PROVIDER === 'mock') {
      throw new Error('PAYMENT_PROVIDER=mock is not allowed when NODE_ENV=production');
    }
    if (value.SMS_PROVIDER === 'mock') {
      throw new Error('SMS_PROVIDER=mock is not allowed when NODE_ENV=production');
    }
  }

  let emailTransport = value.EMAIL_TRANSPORT;
  if (value.NODE_ENV === 'production') {
    if (emailTransport !== 'smtp') {
      throw new Error(
        'EMAIL_TRANSPORT=smtp is required when NODE_ENV=production (customer email OTP needs a real mail transport)',
      );
    }
  } else {
    emailTransport ??= 'log';
  }
  if (emailTransport === 'smtp') {
    const missing = (['SMTP_HOST', 'EMAIL_FROM'] as const).filter((k) => !value[k]);
    if (missing.length > 0) throw new Error(`EMAIL_TRANSPORT=smtp requires ${missing.join(', ')}`);
    if ((value.SMTP_USER === undefined) !== (value.SMTP_PASS === undefined)) {
      throw new Error('SMTP_USER and SMTP_PASS must be set together');
    }
  }

  return {
    ...value,
    EMAIL_TRANSPORT: emailTransport,
    isProduction: value.NODE_ENV === 'production',
    isTest: value.NODE_ENV === 'test',
  };
}

export const config: Config = load();
