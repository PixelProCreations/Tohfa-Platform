/**
 * Design-parity guard: every screen component in the DESIGN branch must have a
 * counterpart in the built admin app, or be explicitly accounted for.
 *
 * Why this exists: hand audits of design coverage were wrong twice. Folder
 * names are meaningless because the design keeps many screens inline inside
 * huge files (dashboard/TohfaAdminDashboardScreen.tsx alone holds ~15), and
 * once the wrong design branch was audited. This test turns coverage into a
 * number and fails loudly on a screen nobody noticed.
 *
 * Design branch of record: origin/Superadmin-main (owner-confirmed 2026-11-11).
 * Do NOT use tofhafarmfin-rbac; it is stale.
 *
 * How it works
 *  1. ONE `git grep` pass over the design branch's admin screens extracts every
 *     `function XxxScreen|Modal|Sheet(` declaration (no per-file `git show`).
 *  2. The local tree apps/mobile/src/roles/admin/ is read once into memory and
 *     reduced to the set of identifiers it contains. "Present" = the name
 *     appears as a whole word anywhere in a local .ts/.tsx file.
 *  3. The missing set is compared with design_parity.baseline.json.
 *
 * Baseline lists:
 *  - `notYetBuilt`: designed, missing, and known. Shrinks as screens are
 *    ported. A name that becomes present MUST be removed (the test fails
 *    until it is), so progress is visible and the list stays honest.
 *  - `deliberatelyDropped`: screens the owner has decided never to build (for
 *    example the "Add Warehouse" screen the owner cancelled). Entries here
 *    are allowed to be missing forever and are never flagged as stale.
 *
 * Skips cleanly (does not fail) when git or the design branch is unavailable:
 * no git binary, branch not fetched, shallow CI clone. A test that fails
 * because a branch is absent is worse than no test.
 */
import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import baseline from './design_parity.baseline.json';

const DESIGN_BRANCH = 'origin/Superadmin-main';
const DESIGN_SCREENS_PATH = 'apps/mobile/src/roles/admin/screens/';
const ADMIN_ROOT = path.resolve(__dirname, '..');
// Same pattern as the audit definition, applied to each declaration line.
const SCREEN_DECL = /^(?:export )?function ([A-Z][A-Za-z0-9]*(?:Screen|Modal|Sheet))\(/gm;

function git(args: string[], cwd: string): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
}

/** Repo root, or null when git is missing / this is not a git checkout. */
function repoRoot(): string | null {
  try {
    return git(['rev-parse', '--show-toplevel'], __dirname).trim();
  } catch {
    return null;
  }
}

function branchReadable(root: string): boolean {
  try {
    git(['rev-parse', '--verify', '--quiet', `${DESIGN_BRANCH}^{commit}`], root);
    return true;
  } catch {
    return false;
  }
}

/** One git grep pass: every candidate declaration line in the design screens. */
function designScreenNames(root: string): string[] {
  let out = '';
  try {
    out = git(
      [
        'grep', '-h', '-I', '-E',
        '-e', '^(export )?function [A-Z][A-Za-z0-9]*(Screen|Modal|Sheet)\\(',
        DESIGN_BRANCH, '--', `${DESIGN_SCREENS_PATH}*.tsx`,
      ],
      root,
    );
  } catch {
    // git grep exits 1 when nothing matches; treated as an empty design set,
    // which the sanity assertion below turns into a loud failure.
    out = '';
  }
  const names = new Set<string>();
  for (const m of out.matchAll(SCREEN_DECL)) names.add(m[1] as string);
  return [...names].sort();
}

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (/\.(ts|tsx)$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

/** Every identifier appearing in the local admin tree, read once. */
function localIdentifiers(): Set<string> {
  const ids = new Set<string>();
  for (const file of walk(ADMIN_ROOT)) {
    // Whole-word match == membership of the word-token set.
    for (const m of fs.readFileSync(file, 'utf8').matchAll(/[A-Za-z0-9_$]+/g)) ids.add(m[0]);
  }
  return ids;
}

const root = repoRoot();
const available = root !== null && branchReadable(root);

if (!available) {
  // eslint-disable-next-line no-console
  console.warn(`[design_parity] SKIPPED: ${DESIGN_BRANCH} is not readable here (no git, branch not fetched, or shallow clone).`);
}

describe.skipIf(!available)(`design parity vs ${DESIGN_BRANCH}`, () => {
  const designed = available ? designScreenNames(root as string) : [];
  const local = available ? localIdentifiers() : new Set<string>();
  const present = designed.filter((n) => local.has(n));
  const missing = designed.filter((n) => !local.has(n));

  const notYetBuilt = new Set<string>(baseline.notYetBuilt);
  const dropped = new Set<string>(baseline.deliberatelyDropped);

  it('reports the parity number', () => {
    // eslint-disable-next-line no-console
    console.log(
      `[design_parity] ${DESIGN_BRANCH}: ${designed.length} design screens, ${present.length} present, ${missing.length} missing ` +
        `(${missing.filter((n) => dropped.has(n)).length} deliberately dropped, ${missing.filter((n) => notYetBuilt.has(n)).length} not yet built)`,
    );
    // A design set this small means the extraction broke, not that the port is done.
    expect(designed.length).toBeGreaterThan(100);
  });

  it('every missing design screen is accounted for in the baseline', () => {
    const unaccounted = missing.filter((n) => !notYetBuilt.has(n) && !dropped.has(n));
    expect(
      unaccounted,
      `Design screens with no local counterpart and not in design_parity.baseline.json. ` +
        `Build them, or (if the owner has decided) add to notYetBuilt / deliberatelyDropped:\n  ${unaccounted.join('\n  ')}`,
    ).toEqual([]);
  });

  it('notYetBuilt contains no screen that now exists locally', () => {
    const stale = [...notYetBuilt].filter((n) => local.has(n)).sort();
    expect(
      stale,
      `These screens are now built. Remove them from notYetBuilt in design_parity.baseline.json:\n  ${stale.join('\n  ')}`,
    ).toEqual([]);
  });

  it('baseline names are real design screens and appear in one list only', () => {
    const designedSet = new Set(designed);
    const unknown = [...notYetBuilt, ...dropped].filter((n) => !designedSet.has(n)).sort();
    expect(unknown, `Baseline names not found in the design branch (typo or screen removed from design):\n  ${unknown.join('\n  ')}`).toEqual([]);
    const both = [...notYetBuilt].filter((n) => dropped.has(n));
    expect(both, 'Names listed in both notYetBuilt and deliberatelyDropped').toEqual([]);
  });
});
