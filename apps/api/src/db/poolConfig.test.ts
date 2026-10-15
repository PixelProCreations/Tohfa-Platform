import pg from 'pg';
import { describe, expect, it } from 'vitest';
import { applyDatabaseSsl, buildPoolConfig, parseDatabaseSsl } from './poolConfig.js';

const SUPABASE =
  'postgresql://postgres.abcdefgh:p%40ss@aws-0-ap-south-1.pooler.supabase.com:5432/postgres';

/** What pg will REALLY do with a config: ask its own parser, no network. */
function resolvedSsl(config: pg.PoolConfig): unknown {
  const client = new pg.Client(config);
  return (client as unknown as { connectionParameters: { ssl: unknown } }).connectionParameters.ssl;
}

describe('parseDatabaseSsl', () => {
  it('defaults to off and accepts the documented values', () => {
    expect(parseDatabaseSsl(undefined)).toBe('off');
    expect(parseDatabaseSsl('')).toBe('off');
    expect(parseDatabaseSsl('false')).toBe('off');
    expect(parseDatabaseSsl('true')).toBe('verify');
    expect(parseDatabaseSsl('no-verify')).toBe('no-verify');
  });

  it('rejects anything else instead of silently connecting without TLS', () => {
    expect(() => parseDatabaseSsl('require')).toThrow(/DATABASE_SSL/);
  });
});

describe('applyDatabaseSsl', () => {
  it('leaves the URL byte-for-byte unchanged when off', () => {
    expect(applyDatabaseSsl(`${SUPABASE}?sslmode=require`, 'off')).toBe(`${SUPABASE}?sslmode=require`);
  });

  it('replaces a conflicting sslmode and keeps unrelated parameters and credentials', () => {
    const url = applyDatabaseSsl(`${SUPABASE}?sslmode=require&connect_timeout=5`, 'no-verify');
    expect(url).toBe(`${SUPABASE}?connect_timeout=5&sslmode=no-verify`);
  });

  it('adds the parameter when the URL has no query string', () => {
    expect(applyDatabaseSsl(SUPABASE, 'verify')).toBe(`${SUPABASE}?sslmode=verify-full`);
  });
});

describe('buildPoolConfig', () => {
  it('local default: no TLS requested, URL untouched', () => {
    const config = buildPoolConfig({
      databaseUrl: 'postgres://tohfa:tohfa@localhost:5432/tohfa',
      ssl: 'off',
      max: 10,
    });
    expect(config.connectionString).toBe('postgres://tohfa:tohfa@localhost:5432/tohfa');
    expect(config.max).toBe(10);
    expect(resolvedSsl(config)).toBeFalsy();
  });

  it('no-verify: TLS on, certificate not verified, even when the URL says sslmode=require', () => {
    const ssl = resolvedSsl(
      buildPoolConfig({ databaseUrl: `${SUPABASE}?sslmode=require`, ssl: 'no-verify', max: 4 }),
    ) as { rejectUnauthorized?: boolean };
    expect(ssl).toBeTruthy();
    expect(ssl.rejectUnauthorized).toBe(false);
  });

  it('true: TLS on and certificate verified (rejectUnauthorized is never false)', () => {
    const ssl = resolvedSsl(
      buildPoolConfig({ databaseUrl: SUPABASE, ssl: 'verify', max: 4 }),
    ) as { rejectUnauthorized?: boolean };
    expect(ssl).toBeTruthy();
    expect(ssl.rejectUnauthorized).not.toBe(false);
  });

  it('documents the pg behaviour this module exists for: bare sslmode=require verifies the certificate', () => {
    // If a future pg release changes this (libpq semantics in pg 9), this test
    // fails and DATABASE_SSL=no-verify can be re-evaluated.
    const ssl = resolvedSsl({ connectionString: `${SUPABASE}?sslmode=require` }) as {
      rejectUnauthorized?: boolean;
    };
    expect(ssl).toBeTruthy();
    expect(ssl.rejectUnauthorized).not.toBe(false);
  });
});
