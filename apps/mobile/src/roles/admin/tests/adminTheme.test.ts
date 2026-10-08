import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { hex, neutral, roleHex, semantic, tokens } from '@tohfa/design-tokens';
import { RoleCode } from '@tohfa/shared-types';
import { buildThemeForRole } from '@tohfa/mobile-ui/src/theme';
import {
  ADMIN_BUTTON_HEIGHT,
  ADMIN_FONT_STACK,
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminTheme,
  adminType,
  useAdminTheme,
} from '../theme';

const ADMIN_ROLES = [
  RoleCode.SUPER_ADMIN,
  RoleCode.TOHFA_ADMIN,
  RoleCode.FARMER_ADMIN,
  RoleCode.MAIN_WH_ADMIN,
  RoleCode.SUB_WH_ADMIN,
] as const;

const NON_ADMIN_ROLES = [RoleCode.FARMER, RoleCode.CUSTOMER] as const;

// ── WCAG 2.x relative luminance / contrast ratio ────────────────────────────
function channel(c8: number): number {
  const c = c8 / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}
function luminance(hexValue: string): number {
  const n = parseInt(hexValue.slice(1), 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}
function contrast(fg: string, bg: string): number {
  const a = luminance(fg);
  const b = luminance(bg);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

/** Every string leaf of a nested object, with its dotted path. */
function colourLeaves(obj: object, prefix = ''): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') out.push([p, v]);
    else if (v && typeof v === 'object') out.push(...colourLeaves(v as object, p));
  }
  return out;
}

describe('Admin theme — colours come from the design tokens', () => {
  it('brand, canvas and neutral roles equal their admin tokens', () => {
    expect(adminColors.brand).toBe(hex('adminOrange'));
    expect(adminColors.brandDeep).toBe(hex('adminOrangeDeep'));
    expect(adminColors.brandTint).toBe(hex('adminOrangeTint'));
    expect(adminColors.canvas).toBe(hex('adminBackground'));
    expect(adminColors.ink).toBe(neutral('adminInk'));
    expect(adminColors.muted).toBe(neutral('adminMuted'));
    expect(adminColors.border).toBe(neutral('adminBorder'));
    expect(adminColors.card).toBe(neutral('adminCard'));
    expect(adminColors.placeholder).toBe(neutral('adminPlaceholder'));
    expect(adminColors.onBrand).toBe(neutral('white'));
  });

  it('semantic text/bg/border pairs equal their admin tokens', () => {
    expect(adminColors.success).toEqual({
      text: hex('adminSuccess'),
      bg: hex('adminSuccessBg'),
      border: semantic('adminSuccessBorder'),
    });
    expect(adminColors.warning).toEqual({
      text: hex('adminWarning'),
      bg: hex('adminWarningBg'),
      border: semantic('adminWarningBorder'),
    });
    expect(adminColors.danger).toEqual({
      text: hex('adminDanger'),
      bg: hex('adminDangerBg'),
      border: semantic('adminDangerBorder'),
    });
    expect(adminColors.info).toEqual({
      text: hex('adminInfo'),
      bg: hex('adminInfoBg'),
      border: semantic('adminInfoBorder'),
    });
    expect(adminColors.purple).toEqual({
      text: hex('adminPurple'),
      bg: hex('adminPurpleBg'),
      border: semantic('adminPurpleBorder'),
    });
    expect(adminColors.brandSoft).toEqual({
      text: hex('adminOrangeDeep'),
      bg: hex('adminOrangeTint'),
      border: semantic('adminBrandBorder'),
    });
    expect(adminColors.toast).toEqual({
      bg: neutral('adminInk'),
      text: neutral('white'),
      icon: hex('adminSuccessOnDark'),
    });
  });

  it('the PDF-specified borders resolve to the PDF colours (danger = error input, brand = active chip)', () => {
    // From the PDF's own drawing: the error-state input is stroked in Danger and
    // the active filter chip in Orange. These two are specified, not derived.
    expect(adminColors.danger.border).toBe(hex('adminDanger'));
    expect(adminColors.brandSoft.border).toBe(hex('adminOrange'));
    // The stash's ADMIN_PALETTE bug: danger border must NOT be the neutral card border.
    expect(adminColors.danger.border).not.toBe(adminColors.border);
  });

  it('every colour in the theme is a valid 6-digit hex', () => {
    const leaves = colourLeaves(adminColors);
    expect(leaves.length).toBeGreaterThan(20);
    for (const [name, value] of leaves) {
      expect(value, `adminColors.${name}`).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});

describe('Admin theme — WCAG contrast of text/background pairs', () => {
  const pairs: Array<{ name: string; fg: string; bg: string }> = [
    { name: 'success.text on success.bg', fg: adminColors.success.text, bg: adminColors.success.bg },
    { name: 'warning.text on warning.bg', fg: adminColors.warning.text, bg: adminColors.warning.bg },
    { name: 'danger.text on danger.bg', fg: adminColors.danger.text, bg: adminColors.danger.bg },
    { name: 'info.text on info.bg', fg: adminColors.info.text, bg: adminColors.info.bg },
    { name: 'purple.text on purple.bg', fg: adminColors.purple.text, bg: adminColors.purple.bg },
    { name: 'brandSoft.text on brandSoft.bg', fg: adminColors.brandSoft.text, bg: adminColors.brandSoft.bg },
    { name: 'ink on card', fg: adminColors.ink, bg: adminColors.card },
    { name: 'ink on canvas', fg: adminColors.ink, bg: adminColors.canvas },
    { name: 'muted on card', fg: adminColors.muted, bg: adminColors.card },
    { name: 'muted on canvas', fg: adminColors.muted, bg: adminColors.canvas },
    { name: 'brandDeep on canvas', fg: adminColors.brandDeep, bg: adminColors.canvas },
    { name: 'onBrand on brand', fg: adminColors.onBrand, bg: adminColors.brand },
    { name: 'brand on card', fg: adminColors.brand, bg: adminColors.card },
    { name: 'brand on brandTint', fg: adminColors.brand, bg: adminColors.brandTint },
    { name: 'danger.text on card', fg: adminColors.danger.text, bg: adminColors.card },
    { name: 'toast.text on toast.bg', fg: adminColors.toast.text, bg: adminColors.toast.bg },
    { name: 'toast.icon on toast.bg', fg: adminColors.toast.icon, bg: adminColors.toast.bg },
    { name: 'placeholder on card', fg: adminColors.placeholder, bg: adminColors.card },
  ];

  /**
   * Pairs the PDF itself uses that fall below WCAG AA 4.5:1 for normal text.
   * They are REPORTED here, not "fixed": the PDF is the client's signed-off
   * design and changing a colour is a design decision, not a code one. If a
   * token changes and one of these starts passing (or a new pair starts
   * failing), this list must be updated deliberately.
   */
  const KNOWN_BELOW_AA = [
    'danger.text on danger.bg',
    'onBrand on brand',
    'brand on card',
    'brand on brandTint',
    'danger.text on card',
    'placeholder on card',
  ];

  it('prints the contrast table (for the record)', () => {
    const table = pairs.map((p) => `${contrast(p.fg, p.bg).toFixed(2)}:1  ${p.name}`).join('\n');
    console.warn(`Admin theme contrast ratios (WCAG AA normal text = 4.5:1):\n${table}`);
    expect(pairs.length).toBe(18);
  });

  it('every pair meets 4.5:1 except the documented PDF exceptions', () => {
    const below = pairs.filter((p) => contrast(p.fg, p.bg) < 4.5).map((p) => p.name);
    expect(below.sort()).toEqual([...KNOWN_BELOW_AA].sort());
  });

  it('the documented exceptions still meet 3:1 (AA large text / UI components), except the placeholder', () => {
    for (const p of pairs) {
      if (!KNOWN_BELOW_AA.includes(p.name) || p.name === 'placeholder on card') continue;
      expect(contrast(p.fg, p.bg), p.name).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('Admin theme — type, radius, spacing, elevation', () => {
  const styles = [
    ['title', 'adminTitle'],
    ['kpiValue', 'adminTitle'],
    ['sectionHead', 'adminSectionHead'],
    ['rowTitle', 'adminRowTitle'],
    ['body', 'adminBody'],
    ['rowMeta', 'adminRowMeta'],
    ['caption', 'adminCaption'],
  ] as const;

  it('each text style equals its typeStyle token (size, line height, RN string weight)', () => {
    for (const [themeName, tokenName] of styles) {
      const token = tokens.typeStyle[tokenName];
      expect(adminType[themeName], themeName).toEqual({
        fontSize: token.size,
        lineHeight: token.lineHeight,
        fontWeight: String(token.weight),
      });
    }
  });

  it('uses the native system font: no fontFamily is set, and no Poppins/Manrope anywhere', () => {
    for (const [themeName] of styles) {
      expect(adminType[themeName], themeName).not.toHaveProperty('fontFamily');
    }
    expect(JSON.stringify(adminTheme)).not.toMatch(/poppins|manrope/i);
    expect(ADMIN_FONT_STACK).toBe(tokens.fontStack.adminSans);
    expect(ADMIN_FONT_STACK).not.toMatch(/poppins|manrope/i);
  });

  it('radius scale equals the admin radius tokens (XS 8, SM 10, MD 12, LG 14, XL 16, Full 100 per the PDF)', () => {
    expect(adminRadius).toEqual({
      xs: tokens.radius.adminXs,
      sm: tokens.radius.adminSm,
      md: tokens.radius.adminMd,
      lg: tokens.radius.adminLg,
      xl: tokens.radius.adminXl,
      full: tokens.radius.adminFull,
    });
    // Strictly increasing, so a typo in tokens.json is caught here.
    const steps = Object.values(adminRadius);
    expect([...steps].sort((a, b) => a - b)).toEqual(steps);
  });

  it('spacing is the platform spacing scale (the admin PDF defines none of its own)', () => {
    expect(adminSpacing).toBe(tokens.spacing);
  });

  it('button height equals the admin size token', () => {
    expect(ADMIN_BUTTON_HEIGHT).toBe(tokens.size.adminButtonHeight);
  });

  it('shadows map the token shadows onto React Native style props', () => {
    const map = [
      ['sm', 'adminSm'],
      ['md', 'adminMd'],
      ['lg', 'adminLg'],
    ] as const;
    for (const [themeName, tokenName] of map) {
      const s = tokens.shadow[tokenName];
      expect(adminShadow[themeName], themeName).toEqual({
        shadowColor: s.color,
        shadowOffset: { width: s.x, height: s.y },
        shadowOpacity: s.opacity,
        // CSS blur is a diameter-like value; iOS shadowRadius is roughly half of it.
        shadowRadius: s.blur / 2,
        elevation: s.elevation,
      });
    }
  });

  it('adminTheme / useAdminTheme expose the same objects', () => {
    expect(useAdminTheme()).toBe(adminTheme);
    expect(adminTheme.colors).toBe(adminColors);
    expect(adminTheme.type).toBe(adminType);
    expect(adminTheme.radius).toBe(adminRadius);
    expect(adminTheme.spacing).toBe(adminSpacing);
    expect(adminTheme.shadow).toBe(adminShadow);
    expect(adminTheme.buttonHeight).toBe(ADMIN_BUTTON_HEIGHT);
  });

  it('the theme source contains no raw colour literals and no Poppins', () => {
    const src = fs.readFileSync(path.resolve(__dirname, '../theme/index.ts'), 'utf8');
    expect(src).not.toMatch(/#[0-9A-Fa-f]{3,8}\b/);
    expect(src).not.toMatch(/rgba?\(/);
    expect(src).not.toMatch(/poppins/i);
  });
});

describe('Admin roles resolve to the admin primary', () => {
  it('roleHex: all five admin roles map to the admin orange; farmer and customer stay on primary', () => {
    for (const role of ADMIN_ROLES) {
      expect(roleHex(role), role).toBe(adminColors.brand);
    }
    for (const role of NON_ADMIN_ROLES) {
      expect(roleHex(role), role).toBe(hex('primary'));
    }
  });

  it('buildThemeForRole (packages/mobile-ui): admin roles get the admin primary, farmer/customer unchanged', () => {
    for (const role of ADMIN_ROLES) {
      expect(buildThemeForRole(role).colors.primary, role).toBe(adminColors.brand);
    }
    for (const role of NON_ADMIN_ROLES) {
      expect(buildThemeForRole(role).colors.primary, role).toBe(hex('primary'));
    }
  });
});
