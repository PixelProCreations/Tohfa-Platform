/**
 * Admin status-bar guard (zero tolerance) for
 * apps/mobile/src/roles/admin/screens/**.
 *
 * React Native 0.88 removed `backgroundColor` from RN's own `<StatusBar />`
 * (see packages/mobile-ui/src/SystemBars.tsx for the full story). A screen that
 * renders the raw `<StatusBar barStyle="..." />` therefore sets NO colour for
 * the strip behind the status bar, and Android keeps whatever colour the
 * previously-mounted screen pushed — the user sees a green strip above an
 * orange header. The bug has now recurred twice, hence this guard.
 *
 * The correct element is `ScreenStatusBar` from `@tohfa/mobile-ui`, which pushes
 * its `backgroundColor` onto a stack on mount and pops it on unmount, so every
 * screen owns the strip while it is on top:
 *
 *   <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
 *   <ScreenStatusBar barStyle="dark-content"  backgroundColor={PALETTE.pageBg} />
 *
 * Pick the colour that screen actually paints at the top of its own page, from
 * a token — never a literal hex (admin_theme_guard.test.ts enforces that too).
 *
 * Non-rendering uses of the RN import (`StatusBar.currentHeight`,
 * `StatusBar.setBarStyle(...)`) are fine and deliberately not flagged: only a
 * rendered `<StatusBar ...>` element is.
 *
 * Scope: every .ts/.tsx/.js/.jsx file under src/roles/admin/screens, tests
 * excluded. There is no baseline — any offender fails.
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const SCREENS_DIR = path.resolve(__dirname, '../roles/admin/screens');
const HINT =
  'Render <ScreenStatusBar barStyle="..." backgroundColor={<this screen\'s own top-band token>} /> from @tohfa/mobile-ui instead, and drop StatusBar from the react-native import.';

/** `<StatusBar` as a JSX element: followed by whitespace, `/` or `>`. */
const STATUS_BAR_ELEMENT = /<StatusBar(?=[\s/>])/;

interface Hit {
  file: string;
  line: number;
  text: string;
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      if (name === 'node_modules' || name === 'tests' || name === '__tests__') continue;
      out.push(...walk(full));
    } else if (/\.(tsx?|jsx?)$/.test(name) && !/\.test\.(tsx?|jsx?)$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

function rel(file: string): string {
  return path.relative(SCREENS_DIR, file).split(path.sep).join('/');
}

/** Does this file import `StatusBar` (as a named binding) from react-native? */
function importsStatusBarFromReactNative(content: string): boolean {
  const imports = content.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]react-native['"]/gs);
  for (const m of imports) {
    const named = (m[1] ?? '').split(',').map((s) => s.trim().split(/\s+as\s+/)[0]?.trim());
    if (named.includes('StatusBar')) return true;
  }
  return false;
}

function scan(): Hit[] {
  const hits: Hit[] = [];
  for (const file of walk(SCREENS_DIR).sort()) {
    const content = fs.readFileSync(file, 'utf8');
    if (!importsStatusBarFromReactNative(content)) continue;
    content.split('\n').forEach((text, i) => {
      if (STATUS_BAR_ELEMENT.test(text)) {
        hits.push({ file: rel(file), line: i + 1, text: text.trim() });
      }
    });
  }
  return hits;
}

describe('Admin status-bar guard — src/roles/admin/screens', () => {
  it('scans the admin screens tree (sanity: the walker found files)', () => {
    expect(walk(SCREENS_DIR).length).toBeGreaterThan(100);
  });

  it('no admin screen renders a raw <StatusBar> from react-native (it cannot set a colour on RN 0.88)', () => {
    const offenders = scan().map((h) => `  src/roles/admin/screens/${h.file}:${h.line}  ${h.text}`);
    expect(
      offenders,
      `Raw <StatusBar> rendered in ${offenders.length} place(s) under src/roles/admin/screens:\n${offenders.join('\n')}\n${HINT}`,
    ).toEqual([]);
  });
});
