/**
 * Source guard for the ported application-review screens (Module 1, Phase 2D):
 * the wired files take every colour and type size from the admin theme, carry
 * no role-string checks or fail-open permission fallbacks, no design spec
 * caption, no demo fixtures, and no Request More Info entry. Checked on the
 * source because there is no full device renderer here.
 *
 * AdminApplicationApproveScreen and AdminApplicationRequestInfoScreen are the
 * legacy screens Phase 3 removes; they are not scanned.
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const DIR = path.resolve(__dirname, '../screens/registration');
const LEGACY = new Set(['AdminApplicationApproveScreen.tsx', 'AdminApplicationRequestInfoScreen.tsx', 'legacyDemoApplications.ts', 'index.ts']);

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx)$/.test(name) && !LEGACY.has(name)) out.push(full);
  }
  return out;
}

const FILES = walk(DIR);
const code = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
const read = (f: string) => fs.readFileSync(f, 'utf8');
const relName = (f: string) => path.relative(DIR, f);

function offenders(pattern: RegExp, stripComments = true): string[] {
  return FILES.filter((f) => pattern.test(stripComments ? code(read(f)) : read(f))).map(relName);
}

describe('application review screens: source guard', () => {
  it('scans the wired screens and their parts', () => {
    const names = FILES.map(relName);
    expect(names).toContain('AdminPendingApplicationsScreen.tsx');
    expect(names).toContain('AdminApplicationDetailScreen.tsx');
    expect(names).toContain('AdminApplicationRejectScreen.tsx');
  });

  it('no raw colours and no numeric fontSize (admin theme tokens only)', () => {
    expect(offenders(/(['"`])#(?:[0-9A-Fa-f]{8}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{3,4})\1|\brgba?\s*\(/)).toEqual([]);
    expect(offenders(/fontSize\s*:\s*[0-9]/)).toEqual([]);
    expect(offenders(/fontFamily\s*:/)).toEqual([]);
  });

  it('no role strings, no fail-open `can`, no `as any`', () => {
    expect(offenders(/\b(SUPER_ADMIN|TOHFA_ADMIN|FARMER_ADMIN|MAIN_WH_ADMIN|SUB_WH_ADMIN)\b/)).toEqual([]);
    expect(offenders(/\brole\??\s*[:=]/)).toEqual([]);
    expect(offenders(/can\s*\?\s*can\(/)).toEqual([]);
    expect(offenders(/can=\{\s*\(\)\s*=>\s*true\s*\}/)).toEqual([]);
    expect(offenders(/\bas any\b/)).toEqual([]);
  });

  it('no spec caption, demo fixtures, Request More Info or cosmetic blocked banner', () => {
    expect(offenders(/M3-S03b/, false)).toEqual([]);
    expect(offenders(/DEMO_PENDING_APPLICATIONS|Sathish|APP-2026|1\.8 acres/)).toEqual([]);
    expect(offenders(/useRequestApplicationInfo|RequestInfo|onRequestMoreInfo\s*\(/)).toEqual([]);
    expect(offenders(/isBlocked|blockedAlert/)).toEqual([]);
  });

  it('every unwired design control is marked DESIGN-ONLY', () => {
    const all = FILES.map(read).join('\n');
    expect(all).toMatch(/DESIGN-ONLY: no endpoint yet[\s\S]{0,400}farmerApps\.markVerified/);
    expect(all).toMatch(/DESIGN-ONLY: no endpoint yet[\s\S]{0,400}farmerApps\.saveProgress/);
  });
});
