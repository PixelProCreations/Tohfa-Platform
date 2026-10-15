/**
 * Pool configuration, separated from `pool.ts` so that it has NO dependency on
 * `config.ts`. That matters for two reasons:
 *
 *   1. `db:migrate` / `db:seed` can run with only DATABASE_URL set (config.ts
 *      demands JWT_SECRET, REDIS_URL, ... because it validates the whole API's
 *      environment on import).
 *   2. It is a pure function, so it is unit-testable without a database.
 *
 * ## TLS and `sslmode=require`
 *
 * pg >= 8.16 (pg-connection-string >= 2.9) treats `sslmode=require`,
 * `prefer` and `verify-ca` in a connection string as aliases for
 * `verify-full`, NOT as libpq's "encrypt but do not verify". A managed
 * Postgres such as Supabase presents a certificate signed by the provider's
 * own CA, which Node does not trust by default, so `?sslmode=require` fails
 * with `self-signed certificate in certificate chain`.
 *
 * `DATABASE_SSL` therefore makes the intent explicit (and, unlike a URL
 * parameter, is the same for the pool, the migrator and the seed scripts):
 *
 *   unset | false | off   leave the URL untouched (local Docker Postgres)
 *   true                  TLS with full certificate verification
 *                         (`sslmode=verify-full`; add `sslrootcert=/path/ca.crt`
 *                         to the URL, or set NODE_EXTRA_CA_CERTS, to trust a
 *                         provider CA)
 *   no-verify             TLS, certificate NOT verified (encrypted, but open to
 *                         an active man-in-the-middle). The pragmatic choice
 *                         for a Supabase pooler/direct host without the CA.
 *
 * pg resolves `ssl` from the connection string AFTER the explicit `ssl` pool
 * option (see pg/lib/connection-parameters.js: `Object.assign({}, config,
 * parse(config.connectionString))`), so an explicit `ssl: {...}` option would
 * be silently overwritten by a `sslmode=` in the URL. We therefore rewrite the
 * URL instead of passing `ssl`.
 */
import type pg from 'pg';

export type DatabaseSsl = 'off' | 'verify' | 'no-verify';

const OFF = new Set(['', 'false', '0', 'off']);
const VERIFY = new Set(['true', '1', 'verify']);

/** Parse the DATABASE_SSL env value. Throws on anything unrecognised. */
export function parseDatabaseSsl(raw: string | undefined): DatabaseSsl {
  const value = (raw ?? '').trim().toLowerCase();
  if (OFF.has(value)) return 'off';
  if (VERIFY.has(value)) return 'verify';
  if (value === 'no-verify') return 'no-verify';
  throw new Error(`DATABASE_SSL must be one of: false, true, no-verify (got "${raw ?? ''}")`);
}

/** Query parameters that decide TLS behaviour and must not fight DATABASE_SSL. */
const SSL_PARAMS = new Set(['ssl', 'sslmode', 'uselibpqcompat']);

/**
 * Return the connection string with the TLS mode forced to match `mode`.
 * `off` returns the URL byte-for-byte unchanged. The URL is edited as text
 * (not re-serialised through `URL`) so credentials keep their exact encoding.
 */
export function applyDatabaseSsl(databaseUrl: string, mode: DatabaseSsl): string {
  if (mode === 'off') return databaseUrl;

  const hashIndex = databaseUrl.indexOf('#');
  const withoutHash = hashIndex === -1 ? databaseUrl : databaseUrl.slice(0, hashIndex);
  const queryIndex = withoutHash.indexOf('?');
  const base = queryIndex === -1 ? withoutHash : withoutHash.slice(0, queryIndex);
  const kept =
    queryIndex === -1
      ? []
      : withoutHash
          .slice(queryIndex + 1)
          .split('&')
          .filter((pair) => pair.length > 0)
          .filter((pair) => !SSL_PARAMS.has((pair.split('=')[0] ?? '').toLowerCase()));

  kept.push(`sslmode=${mode === 'verify' ? 'verify-full' : 'no-verify'}`);
  return `${base}?${kept.join('&')}`;
}

export interface PoolConfigInput {
  databaseUrl: string;
  ssl: DatabaseSsl;
  max: number;
}

export function buildPoolConfig(input: PoolConfigInput): pg.PoolConfig {
  return {
    connectionString: applyDatabaseSsl(input.databaseUrl, input.ssl),
    max: input.max,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    application_name: 'tohfa-api',
  };
}
