/**
 * Vitest global setup. Runs once per test file (see vitest.config.ts).
 *
 * The point of this file is that a unit test must NEVER need a running
 * Postgres, Redis or a populated .env. We supply the minimum viable
 * environment here; tests that genuinely need a database opt in explicitly via
 * `describeIfDatabase` in factories.ts.
 */
import http from 'node:http';
import https from 'node:https';
import { assertSafeTestDatabase } from './dbSafety.js';

// Node >= 19 keeps HTTP sockets alive by default. supertest starts a fresh server on an
// ephemeral port for every request, and a reused port lets the next request ride a stale
// pooled socket: an intermittent "socket hang up". Tests never need connection reuse.
http.globalAgent = new http.Agent({ keepAlive: false });
https.globalAgent = new https.Agent({ keepAlive: false });

process.env['NODE_ENV'] = 'test';
process.env['LOG_LEVEL'] ??= 'silent';
process.env['JWT_SECRET'] ??= 'test-secret-value-that-is-long-enough-32';
if (!process.env['DATABASE_URL']) {
  process.env['DATABASE_URL'] = 'postgres://tohfa:tohfa@localhost:5432/tohfa_test';
  // Lets integration tests tell "nobody configured a database" (visible skip)
  // from "a database was configured but is broken" (must fail): see
  // requireDatabaseTables in dbFixtures.ts.
  process.env['TOHFA_TEST_DATABASE_URL_DEFAULTED'] = '1';
}
process.env['REDIS_URL'] ??= 'redis://localhost:6379';
process.env['PAYMENT_PROVIDER'] ??= 'mock';
process.env['SMS_PROVIDER'] ??= 'mock';

// Refuse to run against a non-local database. Must stay BEFORE anything that
// can create a pool (config.ts / db/pool.ts are only imported by the tests).
assertSafeTestDatabase(process.env);
