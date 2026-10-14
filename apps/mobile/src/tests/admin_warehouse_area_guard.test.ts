/**
 * Admin warehouse area guard (zero tolerance) for
 * apps/mobile/src/roles/admin/screens/warehouse/<area>/**.
 *
 * Each area sub-folder (billing-invoices, customers, orders, ...) holds the
 * CONVERTED screens shared by the Main and Sub warehouse shells. They were
 * moved onto the admin theme on purpose, so unlike admin_theme_guard.test.ts
 * there is no baseline here: any violation fails. The loose legacy files in
 * the warehouse/ root are NOT scanned; they are converted area by area and
 * then move into a folder, at which point this guard starts covering them.
 *
 * The admin theme guard cannot catch a numeric `fontSize: 13`, because it only
 * looks at colours and Poppins. This guard does. Per file, with line numbers:
 *
 *   1. numeric fontSize        spread an adminType style instead
 *   2. any fontFamily          adminType carries no family (native system font)
 *   3. raw colour literals     quoted hex or rgb()/rgba() calls
 *   4. `export *` in an index  re-export by name so the public surface is explicit
 *   5. `export default`        use a named export
 *
 * Comment lines (starting with //, * or /*) are skipped so doc comments that
 * mention these constructs do not trip the guard.
 *
 * How to fix: import adminType / adminColors from src/roles/admin/theme and see
 * apps/mobile/src/roles/admin/theme/README.md ("Converting a screen").
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const WAREHOUSE_DIR = path.resolve(__dirname, '../roles/admin/screens/warehouse');
const README_HINT = 'How to fix: apps/mobile/src/roles/admin/theme/README.md ("Converting a screen").';

const HEX_LITERAL = /(['"`])#(?:[0-9A-Fa-f]{8}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{3,4})\1/;
const RGB_CALL = /\brgba?\s*\(/;
const NUMERIC_FONT_SIZE = /fontSize\s*:\s*[0-9]/;
const FONT_FAMILY = /\bfontFamily\s*:/;
const EXPORT_STAR = /^\s*export\s*\*/;
const EXPORT_DEFAULT = /^\s*export\s+default\b/;

interface Hit {
  file: string;
  line: number;
  text: string;
}

function areaDirs(): string[] {
  return fs
    .readdirSync(WAREHOUSE_DIR)
    .map((n) => path.join(WAREHOUSE_DIR, n))
    .filter((p) => fs.statSync(p).isDirectory())
    .sort();
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      if (name === 'node_modules') continue;
      out.push(...walk(full));
    } else if (/\.tsx?$/.test(name) && !/\.test\./.test(name)) {
      out.push(full);
    }
  }
  return out;
}

function rel(file: string): string {
  return `src/roles/admin/screens/warehouse/${path.relative(WAREHOUSE_DIR, file).split(path.sep).join('/')}`;
}

const areas = areaDirs();
const files = areas.flatMap(walk).sort();

function isComment(line: string): boolean {
  const t = line.trim();
  return t.startsWith('//') || t.startsWith('*') || t.startsWith('/*');
}

function find(test: (line: string, file: string) => boolean): Hit[] {
  const hits: Hit[] = [];
  for (const file of files) {
    fs.readFileSync(file, 'utf8')
      .split('\n')
      .forEach((text, i) => {
        if (!isComment(text) && test(text, file)) hits.push({ file: rel(file), line: i + 1, text: text.trim() });
      });
  }
  return hits;
}

function fmt(hits: Hit[]): string {
  return hits.map((h) => `  ${h.file}:${h.line}  ${h.text}`).join('\n');
}

describe('Admin warehouse area guard (zero tolerance)', () => {
  it('scans the area folders (sanity: found areas and files, no loose root files)', () => {
    expect(areas.length).toBeGreaterThanOrEqual(5);
    expect(files.length).toBeGreaterThan(20);
    for (const f of files) {
      expect(path.dirname(f)).not.toBe(WAREHOUSE_DIR);
      expect(path.relative(WAREHOUSE_DIR, f).split(path.sep).length).toBeGreaterThan(1);
    }
  });

  it('no numeric fontSize (spread an adminType style instead)', () => {
    const hits = find((l) => NUMERIC_FONT_SIZE.test(l));
    expect(
      hits,
      `Numeric fontSize in warehouse area screens:\n${fmt(hits)}\nSpread an adminType style instead. ${README_HINT}`,
    ).toEqual([]);
  });

  it('no fontFamily property (adminType uses the native system font)', () => {
    const hits = find((l) => FONT_FAMILY.test(l));
    expect(
      hits,
      `fontFamily in warehouse area screens:\n${fmt(hits)}\nUse adminType (no fontFamily). ${README_HINT}`,
    ).toEqual([]);
  });

  it('no raw colour literals (hex or rgb/rgba)', () => {
    const hits = find((l) => HEX_LITERAL.test(l) || RGB_CALL.test(l));
    expect(
      hits,
      `Raw colours in warehouse area screens:\n${fmt(hits)}\nUse adminColors / adminShadow from src/roles/admin/theme. ${README_HINT}`,
    ).toEqual([]);
  });

  it('no `export *` in an area index.ts (re-export by name)', () => {
    const hits = find((l, f) => path.basename(f) === 'index.ts' && EXPORT_STAR.test(l));
    expect(hits, `export * in area index files:\n${fmt(hits)}\nRe-export names explicitly.`).toEqual([]);
  });

  it('no `export default` (use named exports)', () => {
    const hits = find((l) => EXPORT_DEFAULT.test(l));
    expect(hits, `export default in warehouse area screens:\n${fmt(hits)}\nUse a named export.`).toEqual([]);
  });
});
