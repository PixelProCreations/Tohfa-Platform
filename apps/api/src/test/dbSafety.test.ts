import { describe, expect, it } from 'vitest';
import { assertSafeTestDatabase, classifyDatabaseUrl } from './dbSafety.js';

describe('classifyDatabaseUrl', () => {
  it.each([
    ['localhost', 'postgres://tohfa:tohfa@localhost:5432/tohfa_test'],
    ['LOCALHOST upper case', 'postgres://tohfa:tohfa@LOCALHOST:5432/tohfa_test'],
    ['127.0.0.1', 'postgresql://u:p@127.0.0.1:5432/db'],
    ['another 127/8 loopback', 'postgresql://u:p@127.1.2.3:5432/db'],
    ['IPv6 loopback ::1', 'postgresql://u:p@[::1]:5432/db'],
    ['IPv6 loopback long form', 'postgresql://u:p@[0:0:0:0:0:0:0:1]:5432/db'],
    ['host.docker.internal', 'postgres://u:p@host.docker.internal:5432/db'],
    ['compose service name postgres', 'postgres://u:p@postgres:5432/db'],
    ['URL-encoded socket dir in the authority', 'postgres://u:p@%2Fvar%2Frun%2Fpostgresql/db'],
    ['empty host + ?host=<socket dir>', 'postgresql:///db?host=/var/run/postgresql'],
    ['bare socket path', '/var/run/postgresql tohfa_test'],
    ['no host anywhere (local socket default)', 'postgresql:///db'],
    ['password containing "@" with a local host', 'postgres://tohfa:p@ss@w0rd@localhost:5432/db'],
  ])('treats %s as local', (_name, url) => {
    const result = classifyDatabaseUrl(url);
    expect(result.local, result.reason).toBe(true);
  });

  it.each([
    ['supabase.co', 'postgresql://u:p@db.example.supabase.co:5432/postgres'],
    ['supabase pooler', 'postgresql://postgres.abc:p@aws-0-ap-south-1.pooler.supabase.com:6543/postgres'],
    ['a public IPv4', 'postgres://u:p@203.0.113.7:5432/db'],
    ['a public IPv6', 'postgres://u:p@[2001:db8::1]:5432/db'],
    ['a look-alike prefix (localhost.evil.com)', 'postgres://u:p@localhost.evil.com:5432/db'],
    ['a look-alike suffix (evil-localhost)', 'postgres://u:p@evil-localhost:5432/db'],
    ['a look-alike 127 prefix (127.0.0.1.evil.com)', 'postgres://u:p@127.0.0.1.evil.com:5432/db'],
    ['?host= override of a local authority', 'postgres://u:p@localhost:5432/db?host=db.example.supabase.co'],
    ['?hostaddr= override of a local authority', 'postgres://u:p@localhost:5432/db?hostaddr=203.0.113.7'],
    ['an unparseable value', 'not a url at all'],
    ['a non-postgres scheme', 'mysql://u:p@localhost:3306/db'],
  ])('treats %s as NOT local', (_name, url) => {
    const result = classifyDatabaseUrl(url);
    expect(result.local, result.reason).toBe(false);
  });

  it('takes the host after the LAST "@" when the password contains an "@"', () => {
    // If the classifier split at the FIRST "@" it would see host "ss@w0rd@db.example.supabase.co"
    // or "p"; the real host is the remote one and must be refused.
    const remote = classifyDatabaseUrl('postgres://tohfa:p@localhost@db.example.supabase.co:5432/db');
    expect(remote.local).toBe(false);
    expect(remote.hosts).toEqual(['db.example.supabase.co']);

    const local = classifyDatabaseUrl('postgres://tohfa:p@db.example.supabase.co@localhost:5432/db');
    expect(local.local).toBe(true);
    expect(local.hosts).toEqual(['localhost']);
  });

  it('allows an unset or empty DATABASE_URL (database tests are then skipped)', () => {
    expect(classifyDatabaseUrl(undefined).local).toBe(true);
    expect(classifyDatabaseUrl('').local).toBe(true);
    expect(classifyDatabaseUrl('   ').local).toBe(true);
  });

  it('falls back to PGHOST when the URL has no host, and refuses a remote PGHOST', () => {
    expect(classifyDatabaseUrl('postgresql:///db', { PGHOST: 'db.example.supabase.co' }).local).toBe(false);
    expect(classifyDatabaseUrl('postgresql:///db', { PGHOST: 'localhost' }).local).toBe(true);
  });

  it('never puts credentials in the reason or hosts', () => {
    const result = classifyDatabaseUrl('postgresql://alice:s3cr3t-pw@db.example.supabase.co:5432/postgres');
    expect(JSON.stringify(result)).not.toContain('s3cr3t-pw');
    expect(JSON.stringify(result)).not.toContain('alice');
  });
});

describe('assertSafeTestDatabase', () => {
  const REMOTE = 'postgresql://u:topsecret@db.example.supabase.co:5432/postgres';

  it('throws for NODE_ENV=test with a remote DATABASE_URL, without echoing the password', () => {
    let message = '';
    try {
      assertSafeTestDatabase({ NODE_ENV: 'test', DATABASE_URL: REMOTE });
    } catch (e) {
      message = (e as Error).message;
    }
    expect(message).toContain('REFUSING TO RUN TESTS');
    expect(message).toContain('db.example.supabase.co');
    expect(message).toContain('ALLOW_REMOTE_TEST_DB');
    expect(message).not.toContain('topsecret');
  });

  it('passes for a local DATABASE_URL', () => {
    expect(() =>
      assertSafeTestDatabase({ NODE_ENV: 'test', DATABASE_URL: 'postgres://tohfa:tohfa@localhost:5432/t' }),
    ).not.toThrow();
  });

  it('passes when DATABASE_URL is unset', () => {
    expect(() => assertSafeTestDatabase({ NODE_ENV: 'test' })).not.toThrow();
  });

  it('passes with the explicit ALLOW_REMOTE_TEST_DB=true override, and only for exactly "true"', () => {
    expect(() =>
      assertSafeTestDatabase({ NODE_ENV: 'test', DATABASE_URL: REMOTE, ALLOW_REMOTE_TEST_DB: 'true' }),
    ).not.toThrow();
    expect(() =>
      assertSafeTestDatabase({ NODE_ENV: 'test', DATABASE_URL: REMOTE, ALLOW_REMOTE_TEST_DB: '1' }),
    ).toThrow(/REFUSING/);
  });

  it('does nothing outside NODE_ENV=test (the guard is a test-run guard, not an app guard)', () => {
    expect(() => assertSafeTestDatabase({ NODE_ENV: 'production', DATABASE_URL: REMOTE })).not.toThrow();
  });
});
