/**
 * Test-database safety guard.
 *
 * The integration suites COMMIT rows (users, farmers, prices, wallets ...) and
 * several of them mutate global tables (system_config, fair_prices). Pointing a
 * test run at a shared remote database (the team's Supabase instance, staging)
 * would pollute or corrupt it, so the run is refused unless the target is local.
 *
 * This file is deliberately dependency-free (no pg, no config, no dotenv): it
 * runs from vitest's globalSetup and setup file BEFORE any pool exists, and it
 * must never open a connection itself.
 *
 * Escape hatch: `ALLOW_REMOTE_TEST_DB=true` for CI-like setups that really do
 * run against a disposable remote database.
 */

/** Hosts that mean "this machine / this compose network". Compared lowercase. */
const LOCAL_HOSTNAMES: ReadonlySet<string> = new Set([
  'localhost',
  '::1', // bare form, as it appears in a `host=` query parameter
  '[::1]', // bracketed form, as WHATWG URL reports it
  'host.docker.internal',
  'postgres', // the docker-compose service name
]);

export interface DatabaseTarget {
  /** True when the run may proceed against this target. */
  readonly local: boolean;
  /** Every host the driver could connect to (never includes credentials). */
  readonly hosts: readonly string[];
  /** Human-readable explanation, safe to print (no password). */
  readonly reason: string;
}

/** True for a Unix-socket directory/path (`/var/run/postgresql`). */
function isSocketPath(host: string): boolean {
  return host.startsWith('/');
}

function isLocalHost(rawHost: string): boolean {
  let host = rawHost.trim().toLowerCase();
  // `%2Fvar%2Frun%2Fpostgresql` is how a socket dir is written in a URL authority.
  try {
    host = decodeURIComponent(host);
  } catch {
    return false;
  }
  if (isSocketPath(host)) return true;
  if (LOCAL_HOSTNAMES.has(host)) return true;
  // 127.0.0.0/8 is all loopback.
  return /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host);
}

/**
 * Classify a DATABASE_URL. Never throws, never connects. Anything it cannot
 * positively identify as local is reported as NOT local (fail closed).
 *
 * `env` is consulted only for `PGHOST`, which node-postgres falls back to when
 * the URL carries no host at all (`postgresql:///db`).
 */
export function classifyDatabaseUrl(
  rawUrl: string | undefined,
  env: Readonly<Record<string, string | undefined>> = {},
): DatabaseTarget {
  const url = (rawUrl ?? '').trim();
  if (url === '') {
    return { local: true, hosts: [], reason: 'DATABASE_URL is unset; database tests are skipped.' };
  }

  // pg-connection-string treats a leading "/" as "<socket dir> <dbname>".
  if (url.startsWith('/')) {
    const socket = url.split(' ')[0] ?? url;
    return { local: true, hosts: [socket], reason: 'unix-socket path' };
  }

  let parsed: URL;
  try {
    // WHATWG URL splits the authority at the LAST "@", so a password that
    // contains a raw "@" still yields the real host.
    parsed = new URL(url);
  } catch {
    return {
      local: false,
      hosts: [],
      reason: 'DATABASE_URL is not a parseable URL, so its host cannot be verified as local.',
    };
  }
  if (parsed.protocol !== 'postgres:' && parsed.protocol !== 'postgresql:') {
    return {
      local: false,
      hosts: [],
      reason: `DATABASE_URL has unexpected scheme "${parsed.protocol}" (want postgres:// or postgresql://).`,
    };
  }

  const hosts: string[] = [];
  // libpq / node-postgres let `?host=` and `?hostaddr=` override the authority.
  const queryHost = parsed.searchParams.get('host');
  const queryHostAddr = parsed.searchParams.get('hostaddr');
  if (parsed.hostname !== '') hosts.push(parsed.hostname);
  if (queryHost !== null && queryHost !== '') hosts.push(queryHost);
  if (queryHostAddr !== null && queryHostAddr !== '') hosts.push(queryHostAddr);
  if (hosts.length === 0) {
    // No host anywhere in the URL: the driver uses PGHOST, else the local socket.
    const pgHost = env['PGHOST'];
    if (pgHost !== undefined && pgHost !== '') hosts.push(pgHost);
    else return { local: true, hosts: [], reason: 'no host in URL (local socket default)' };
  }

  const remote = hosts.filter((h) => !isLocalHost(h));
  return remote.length === 0
    ? { local: true, hosts, reason: 'all hosts are local' }
    : { local: false, hosts, reason: `host "${remote.join('", "')}" is not a local database host.` };
}

/**
 * Abort (throw) when a test run is about to target a non-local database.
 * The message never contains the URL's credentials.
 */
export function assertSafeTestDatabase(
  env: Readonly<Record<string, string | undefined>> = process.env,
): void {
  if (env['NODE_ENV'] !== 'test') return;
  if (env['ALLOW_REMOTE_TEST_DB'] === 'true') return;

  const target = classifyDatabaseUrl(env['DATABASE_URL'], env);
  if (target.local) return;

  throw new Error(
    [
      'REFUSING TO RUN TESTS: DATABASE_URL points at a non-local database.',
      `  ${target.reason}`,
      '  The integration suites COMMIT rows and mutate global tables; run against a shared or remote',
      '  database and they will pollute or corrupt it.',
      '  Use a local Postgres (e.g. postgres://tohfa:tohfa@localhost:5432/tohfa_test), or, for a',
      '  disposable remote test database ONLY, set ALLOW_REMOTE_TEST_DB=true.',
    ].join('\n'),
  );
}
