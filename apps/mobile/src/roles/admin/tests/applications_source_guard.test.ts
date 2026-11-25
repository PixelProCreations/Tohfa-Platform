/**
 * Source guard for the ported application-review screens (Module 1, Phase 2D):
 * the wired files take every colour and type size from the admin theme, carry
 * no role-string checks or fail-open permission fallbacks, no design spec
 * caption, no demo fixtures, and no Request More Info entry. Checked on the
 * source because there is no full device renderer here.
 *
 * AdminApplicationApproveScreen and AdminApplicationRequestInfoScreen were
 * re-ported from the design of record on 2026-11-25 (API-backed, no demo
 * data), so they are scanned like every other file here.
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const DIR = path.resolve(__dirname, '../screens/registration');
const LEGACY = new Set(['legacyDemoApplications.ts', 'index.ts']);

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
    expect(names).toContain('AdminApplicationApproveScreen.tsx');
    expect(names).toContain('AdminApplicationRequestInfoScreen.tsx');
  });

  it('no raw colours and no numeric fontSize (admin theme tokens only)', () => {
    expect(offenders(/(['"`])#(?:[0-9A-Fa-f]{8}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{3,4})\1|\brgba?\s*\(/)).toEqual([]);
    expect(offenders(/fontSize\s*:\s*[0-9]/)).toEqual([]);
    expect(offenders(/fontFamily\s*:/)).toEqual([]);
  });

  /**
   * The 2026-11-19 design's visual treatment was ported onto the review
   * screen (card radii, hairlines, the segmented header pills, the green
   * farming chips, the dark boundary panel, the orange action bar). The
   * design file states all of that in raw hex and raw pixel numbers; none of
   * those numbers may land here. Every colour, size, gap and radius on this
   * screen resolves through adminColors / adminSpacing / adminRadius /
   * adminType, so a design change is a token change, not a hunt through JSX.
   */
  it('the review screen states no raw colour, spacing or radius literal', () => {
    const SCREEN = FILES.filter((f) => {
      const rel = relName(f);
      return (
        rel === 'AdminApplicationDetailScreen.tsx' ||
        rel === 'AdminApplicationApproveScreen.tsx' ||
        rel === 'AdminApplicationRequestInfoScreen.tsx' ||
        rel === 'AdminApplicationRejectScreen.tsx' ||
        rel === 'designMetrics.ts' ||
        rel.startsWith('detail/') ||
        rel === 'applications/ApplicationParts.tsx' ||
        rel === 'applications/DecisionScreenParts.tsx'
      );
    });
    expect(SCREEN.length).toBeGreaterThan(12);
    const found: string[] = [];
    const LITERAL = [
      // colour
      /(['"`])#(?:[0-9A-Fa-f]{8}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{3,4})\1|\brgba?\s*\(/,
      // spacing
      /\b(?:padding|margin)(?:Top|Bottom|Left|Right|Vertical|Horizontal|Start|End)?\s*:\s*-?[0-9]/,
      /\b(?:gap|rowGap|columnGap)\s*:\s*-?[0-9]/,
      // radius and box size
      /\bborder(?:Top|Bottom)?(?:Left|Right|Start|End)?Radius\s*:\s*[0-9]/,
      /\b(?:width|height|minHeight|maxHeight|minWidth|maxWidth)\s*:\s*[0-9]/,
      // type
      /fontSize\s*:\s*[0-9]/,
      /fontFamily\s*:/,
    ];
    for (const file of SCREEN) {
      const src = code(read(file));
      for (const pattern of LITERAL) {
        const hit = pattern.exec(src);
        if (hit !== null) found.push(`${relName(file)}: ${hit[0]}`);
      }
    }
    expect(found, 'use adminColors / adminSpacing / adminRadius / adminType instead of a literal').toEqual([]);
  });

  it('no role strings, no fail-open `can`, no `as any`', () => {
    expect(offenders(/\b(SUPER_ADMIN|TOHFA_ADMIN|FARMER_ADMIN|MAIN_WH_ADMIN|SUB_WH_ADMIN)\b/)).toEqual([]);
    expect(offenders(/\brole\??\s*[:=]/)).toEqual([]);
    expect(offenders(/can\s*\?\s*can\(/)).toEqual([]);
    expect(offenders(/can=\{\s*\(\)\s*=>\s*true\s*\}/)).toEqual([]);
    expect(offenders(/\bas any\b/)).toEqual([]);
  });

  it('no spec caption, demo fixtures, legacy host callback or cosmetic blocked banner', () => {
    expect(offenders(/M3-S03/, false)).toEqual([]);
    expect(offenders(/DEMO_PENDING_APPLICATIONS|Sathish|APP-2026|1\.8 acres|98XXX/)).toEqual([]);
    expect(offenders(/onRequestMoreInfo\s*\(/)).toEqual([]);
    expect(offenders(/isBlocked|blockedAlert/)).toEqual([]);
  });

  it('no audit mode, screen or option is left in this flow (owner decision 2026-11-25)', () => {
    expect(offenders(/ScheduleAudit|waiting_audit|schedule_form|modePill|Waiting Audit|Audit Completed/)).toEqual([]);
  });

  /**
   * The 2026-11-19 redesign (origin/Superadmin-main) is a pure mock: every
   * name, file, id, date and coordinate in it is a placeholder with no API
   * behind it. None of them may be copied across, not as a value and not as a
   * `??` fallback.
   */
  it('no literal from the 2026-11-19 design file survives in the source', () => {
    const fixtures = [
      /Great Earth Organic Farm/,
      /\bKumar\b/,
      /TOHFA-2026-4817/,
      /aadhaar_suresh|land_deed\.pdf/,
      /PGS Organic|NPOP certificate/,
      /3782\s?4591\s?0023/,
      /11\.4064|76\.6932/,
      /98765 43210/,
      /Kotagiri Village/,
      /12 \/ 06 \/ 1985/,
      /0[59] Oct 2026|10 Oct 2026|15 Mar 2027/,
      /All requirements met\. Ready for approval/,
      /Identity proof re-upload/,
      /Please re-upload a clear scan/,
      // The redesign's remaining placeholders, from the sections ported in the
      // second pass (personal details, farm details, locations, documents).
      /Sathish/,
      /Thottam Street/,
      /Ooty, zone A/,
      /2\.45 ac|1\.02 ha|0\.85 ha|0\.58 ha/,
      /Zone [ABC]\b/,
      /\bTomato\b|\bCarrot\b|\bCabbage\b/,
      /±\s?8\s?m|1\.2 MB|3\.4 MB|2\.1 MB/,
      /fmb-0101|kyc-doc-1|PLT-00124/,
      /99801 00100/,
      /Review in progress|Documents Under Review'/,
      // The audit flow the design carries is deliberately not ported.
      /waiting_audit|schedule_form|Schedule Audit|Audit Scheduled/,
      // Its locally-held tracking state, which no endpoint can persist.
      /setTrackingStatus|trackingOptions|handleSelectTrackingStatus/,
    ];
    for (const fixture of fixtures) {
      expect(offenders(fixture, false), `design fixture ${String(fixture)}`).toEqual([]);
    }
  });

  it('every wired review control in detail/decision screens is gated by applicationAccess / can*', () => {
    const all = FILES.map(read).join('\n');
    expect(offenders(/DESIGN-ONLY: no endpoint yet/, false)).toEqual(['AdminPendingApplicationsScreen.tsx']);
    expect(all).toMatch(/access\.canVerifyDocument/);
    expect(all).toMatch(/access\.canVerifyFmb/);
    expect(all).toMatch(/access\.canAdvance/);
    expect(all).toMatch(/access\.canAddNote/);
    expect(all).toMatch(/access\.canRequestInfo/);
    expect(all).toMatch(/access\.canDecide/);
  });

  /**
   * The second pass draws the applicant's own answers (farming type, FMB
   * state, tracking). None of them may become something a reviewer can change
   * from here: there is no endpoint for any of it, and a control that looks
   * editable claims one exists.
   */
  it('nothing newly drawn is interactive: no chip, pill or toggle carries an onPress', () => {
    const all = FILES.map(read).join('\n');
    for (const testId of ['farmerApps.farmingTypeChip', 'farmerApps.otpBadge', 'farmerApps.stepBadge', 'farmerApps.declaration']) {
      const block = new RegExp(`testID="${testId.replace('.', '\\.')}"[\\s\\S]{0,400}?>`);
      const match = block.exec(all);
      expect(match, `${testId} is not drawn`).not.toBeNull();
      expect(match![0], `${testId} has an onPress`).not.toMatch(/onPress/);
    }
  });
});
