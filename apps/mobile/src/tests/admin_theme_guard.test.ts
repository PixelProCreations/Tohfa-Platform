/**
 * Admin theme guard (ratchet) for apps/mobile/src/roles/admin.
 *
 * Admin screens must take every colour from src/roles/admin/theme (which reads
 * @tohfa/design-tokens), the same rule root CLAUDE.md §2.7 sets for the whole
 * repo. ~240 admin screens predate the theme and still carry raw hex/rgba
 * values, so a zero-tolerance check would be red on day one and therefore
 * useless. This is a RATCHET instead: admin_theme_guard.baseline.json records
 * what each file has today, and the test fails only when something gets worse.
 *
 *   1. Raw colour literals — a quoted '#RGB' / '#RGBA' / '#RRGGBB' /
 *      '#RRGGBBAA', or an rgb()/rgba() call. A file may not exceed its
 *      baseline count; a file NOT in the baseline may not have any.
 *   2. fontFamily: 'Poppins' — the admin PDF specifies the native system font.
 *      Same ratchet: no file may add one.
 *   3. Imports of the FARMER theme from admin code. The general cross-role
 *      guard (cross_role_import_guard.test.ts) already forbids every cross-role
 *      import, but it is red today with pre-existing violations, so it cannot
 *      tell a NEW farmer-theme import apart from the old ones. This narrow
 *      check can: only the files listed in the baseline may still do it.
 *
 * Scope: every .ts/.tsx/.js/.jsx file under src/roles/admin, EXCEPT the theme
 * module itself (src/roles/admin/theme/**) and tests. swa/ IS scanned; its
 * SWA_COLORS blocks are simply baselined until it is converted (last).
 *
 * Converted a screen? Lock the improvement in by regenerating the baseline:
 *
 *   UPDATE_ADMIN_THEME_BASELINE=1 pnpm --filter @tohfa/mobile exec vitest run src/tests/admin_theme_guard.test.ts
 *
 * Never regenerate to make a failure go away — move the colour into the theme
 * instead. How: src/roles/admin/theme/README.md.
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const ADMIN_DIR = path.resolve(__dirname, '../roles/admin');
const THEME_DIR = path.join(ADMIN_DIR, 'theme');
const BASELINE_PATH = path.resolve(__dirname, 'admin_theme_guard.baseline.json');
const README_HINT = 'How to fix: apps/mobile/src/roles/admin/theme/README.md ("Converting a screen").';
const UPDATE_COMMAND =
  'UPDATE_ADMIN_THEME_BASELINE=1 pnpm --filter @tohfa/mobile exec vitest run src/tests/admin_theme_guard.test.ts';

// The only place outside tokens.json where colour syntax is allowed to appear:
// these patterns describe what a raw colour literal looks like.
const HEX_LITERAL = /(['"`])#(?:[0-9A-Fa-f]{8}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{3,4})\1/g;
const RGB_CALL = /\brgba?\s*\(/g;
const POPPINS = /fontFamily\s*:\s*['"`]Poppins/g;
const IMPORT_SPECIFIER = /(?:from\s+|require\(\s*|import\(\s*)['"`]([^'"`]+)['"`]/g;

interface Hit {
  line: number;
  text: string;
}

interface FileScan {
  colours: Hit[];
  poppins: Hit[];
  importsFarmerTheme: boolean;
}

interface Baseline {
  rawColours: Record<string, number>;
  poppins: Record<string, number>;
  farmerThemeImports: string[];
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      if (full === THEME_DIR || name === 'tests' || name === 'node_modules') continue;
      out.push(...walk(full));
    } else if (/\.(tsx?|jsx?)$/.test(name) && !/\.test\.(tsx?|jsx?)$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

function rel(file: string): string {
  return path.relative(ADMIN_DIR, file).split(path.sep).join('/');
}

/** True if an import specifier written in `fromFile` points into src/roles/farmer/theme. */
function isFarmerThemeImport(fromFile: string, specifier: string): boolean {
  const target = specifier.startsWith('.')
    ? path.resolve(path.dirname(fromFile), specifier).split(path.sep).join('/')
    : specifier;
  return /(^|\/)roles\/farmer\/theme(\/|$)/.test(target);
}

function scanFile(file: string): FileScan {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const colours: Hit[] = [];
  const poppins: Hit[] = [];
  lines.forEach((text, i) => {
    // matchAll with fresh iterators: no shared lastIndex between files/lines.
    for (const m of text.matchAll(HEX_LITERAL)) colours.push({ line: i + 1, text: m[0] });
    for (const m of text.matchAll(RGB_CALL)) colours.push({ line: i + 1, text: m[0] });
    for (const m of text.matchAll(POPPINS)) poppins.push({ line: i + 1, text: m[0] });
  });
  const importsFarmerTheme = [...content.matchAll(IMPORT_SPECIFIER)].some(
    (m) => m[1] !== undefined && isFarmerThemeImport(file, m[1]),
  );
  return { colours, poppins, importsFarmerTheme };
}

function scanAdmin(): Map<string, FileScan> {
  const result = new Map<string, FileScan>();
  for (const file of walk(ADMIN_DIR).sort()) result.set(rel(file), scanFile(file));
  return result;
}

function toBaseline(scan: Map<string, FileScan>): Baseline {
  const rawColours: Record<string, number> = {};
  const poppins: Record<string, number> = {};
  const farmerThemeImports: string[] = [];
  for (const [file, s] of scan) {
    if (s.colours.length > 0) rawColours[file] = s.colours.length;
    if (s.poppins.length > 0) poppins[file] = s.poppins.length;
    if (s.importsFarmerTheme) farmerThemeImports.push(file);
  }
  return { rawColours, poppins, farmerThemeImports };
}

function sum(record: Record<string, number>): number {
  return Object.values(record).reduce((a, b) => a + b, 0);
}

function describeHits(file: string, hits: Hit[], limit = 15): string {
  const shown = hits.slice(0, limit).map((h) => `    src/roles/admin/${file}:${h.line}  ${h.text}`);
  if (hits.length > limit) shown.push(`    … and ${hits.length - limit} more`);
  return shown.join('\n');
}

const scan = scanAdmin();

if (process.env.UPDATE_ADMIN_THEME_BASELINE === '1') {
  const next = toBaseline(scan);
  const doc = {
    $comment:
      'GENERATED by src/tests/admin_theme_guard.test.ts — do not edit by hand. Per-file counts of raw colour literals (quoted hex + rgb()/rgba() calls) and fontFamily Poppins under src/roles/admin (theme/ and tests excluded), plus the admin files that still import the farmer theme. Counts may only go down. Regenerate after converting a screen: ' +
      UPDATE_COMMAND,
    totals: {
      filesWithRawColours: Object.keys(next.rawColours).length,
      rawColours: sum(next.rawColours),
      filesWithPoppins: Object.keys(next.poppins).length,
      poppins: sum(next.poppins),
      farmerThemeImports: next.farmerThemeImports.length,
    },
    ...next,
  };
  fs.writeFileSync(BASELINE_PATH, `${JSON.stringify(doc, null, 2)}\n`);
}

const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8')) as Baseline;

describe('Admin theme guard (ratchet) — src/roles/admin', () => {
  it('scans the admin tree (sanity: the walker found files and skipped the theme module)', () => {
    expect(scan.size).toBeGreaterThan(100);
    expect([...scan.keys()].some((f) => f.startsWith('theme/'))).toBe(false);
    expect([...scan.keys()].some((f) => f.startsWith('screens/swa/'))).toBe(true);
  });

  it('no admin file adds raw colour literals (hex or rgb/rgba) beyond its baseline', () => {
    const offenders: string[] = [];
    for (const [file, s] of scan) {
      const allowed = baseline.rawColours[file] ?? 0;
      if (s.colours.length > allowed) {
        const why =
          allowed === 0
            ? `${file}: ${s.colours.length} raw colour(s) in a file with no baseline allowance`
            : `${file}: ${s.colours.length} raw colour(s), baseline allows ${allowed}`;
        offenders.push(`  ${why}\n${describeHits(file, s.colours)}`);
      }
    }
    expect(
      offenders,
      `Raw colour literals added to admin code (${offenders.length} file(s)):\n${offenders.join('\n')}\nUse adminColors / adminShadow from src/roles/admin/theme instead of a literal. ${README_HINT}`,
    ).toEqual([]);
  });

  it("no admin file adds fontFamily: 'Poppins' beyond its baseline (the admin PDF uses the system font)", () => {
    const offenders: string[] = [];
    for (const [file, s] of scan) {
      const allowed = baseline.poppins[file] ?? 0;
      if (s.poppins.length > allowed) {
        offenders.push(
          `  ${file}: ${s.poppins.length} Poppins, baseline allows ${allowed}\n${describeHits(file, s.poppins)}`,
        );
      }
    }
    expect(
      offenders,
      `fontFamily 'Poppins' added to admin code:\n${offenders.join('\n')}\nUse adminType from src/roles/admin/theme (no fontFamily = native system font). ${README_HINT}`,
    ).toEqual([]);
  });

  it('no new admin file imports the farmer theme (admin styling comes from src/roles/admin/theme)', () => {
    const allowed = new Set(baseline.farmerThemeImports);
    const offenders = [...scan]
      .filter(([file, s]) => s.importsFarmerTheme && !allowed.has(file))
      .map(([file]) => `  src/roles/admin/${file}`);
    expect(
      offenders,
      `Admin files importing src/roles/farmer/theme:\n${offenders.join('\n')}\nImport from src/roles/admin/theme instead. ${README_HINT}`,
    ).toEqual([]);
  });

  it('reports baseline entries that can be tightened (warn only, never fails)', () => {
    const notes: string[] = [];
    for (const [file, count] of Object.entries(baseline.rawColours)) {
      const now = scan.get(file);
      if (!now) notes.push(`  ${file}: in baseline but no longer exists`);
      else if (now.colours.length < count)
        notes.push(`  ${file}: raw colours ${count} -> ${now.colours.length}`);
    }
    for (const [file, count] of Object.entries(baseline.poppins)) {
      const now = scan.get(file);
      if (!now) notes.push(`  ${file}: in baseline (Poppins) but no longer exists`);
      else if (now.poppins.length < count) notes.push(`  ${file}: Poppins ${count} -> ${now.poppins.length}`);
    }
    for (const file of baseline.farmerThemeImports) {
      const now = scan.get(file);
      if (!now || !now.importsFarmerTheme) notes.push(`  ${file}: no longer imports the farmer theme`);
    }
    if (notes.length > 0) {
      console.warn(
        `Admin theme guard: the baseline can be tightened (${notes.length} entr${notes.length === 1 ? 'y' : 'ies'}):\n${notes.join('\n')}\nLock it in with:\n  ${UPDATE_COMMAND}`,
      );
    }
    expect(true).toBe(true);
  });
});
