/**
 * Design-tokens build sync guard.
 *
 * Why this exists: Metro resolves `@tohfa/design-tokens` through the package's
 * `main` field, i.e. the BUILT `packages/design-tokens/dist/` (gitignored), while
 * `tsc` (tsconfig `paths`) and this test suite read `src/`. When a token is added
 * to src/tokens.json and the package is not rebuilt, typecheck and tests stay
 * green but the device bundle throws at module load:
 *
 *   Error: Unknown design token colour: adminWhitePillOverlay
 *
 * and, because Metro's guarded require then returns `undefined` for every module
 * that imported the admin theme, a confusing cascade such as
 * "Cannot read property 'MOCK_DAYS' of undefined" in farmer/App.tsx.
 *
 * `pnpm --filter @tohfa/mobile start|android|ios` now rebuild the packages first
 * (see the pre* scripts in apps/mobile/package.json); this test catches a stale
 * build on a developer machine before it reaches a device.
 *
 * When dist/ does not exist at all there is nothing stale to compare; Metro then
 * fails loudly with "Unable to resolve module", so that case is not asserted here.
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const PKG_DIR = path.resolve(__dirname, '../../../../packages/design-tokens');
const SRC_TOKENS = path.join(PKG_DIR, 'src/tokens.json');
const DIST_TOKENS = path.join(PKG_DIR, 'dist/tokens.json');
const FIX_HINT =
  'packages/design-tokens/dist is stale. Run: pnpm --filter @tohfa/mobile build:packages ' +
  '(then restart Metro with --reset-cache).';

describe('Design tokens — built output matches source (what Metro bundles)', () => {
  it('dist/tokens.json, when present, is identical to src/tokens.json', () => {
    if (!fs.existsSync(DIST_TOKENS)) return;
    const src: unknown = JSON.parse(fs.readFileSync(SRC_TOKENS, 'utf8'));
    const dist: unknown = JSON.parse(fs.readFileSync(DIST_TOKENS, 'utf8'));
    expect(dist, FIX_HINT).toEqual(src);
  });
});
