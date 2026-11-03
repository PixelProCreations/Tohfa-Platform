/**
 * AnimalDetailScreen and its helpers must not carry user-facing English:
 * every label, placeholder, dropdown option, accessibility label, alert and
 * validation message is an i18n key present (non-empty) in BOTH farmer.en.json
 * and farmer.ta.json. Dropdowns hold API enum values and display a translated
 * label from an `enum -> key` table (animalRecordForms.ts `*_OPTIONS`).
 *
 * The scan is a source check in the style of input_management.test.tsx /
 * log_fertigation.test.ts, made rule-based instead of a fixed literal list so a
 * newly added hard-coded string fails it. Comments are stripped first.
 *
 * Deliberately NOT flagged (and why):
 *   - testIDs, style names, enum codes (UPPER_SNAKE) — identifiers, never shown.
 *   - `AnimalFormData` values handed to RegisterAnimalScreen / EditAnimalScreen
 *     (`speciesFormValue`, `genderFormValue`, `organicStatusToFormValue`,
 *     `sourceToFormValue`, `formatRegisterFormDate`): those screens parse the
 *     English form values, so they are an inter-screen data contract, not
 *     display text. The scan checks they are not rendered (see the last test).
 *   - Date parsing tables in animalRecordForms.ts (MONTHS / FULL_MONTHS): input
 *     parsing, never displayed.
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import errorsEn from '../../../i18n/errors.en.json';
import errorsTa from '../../../i18n/errors.ta.json';
import farmerEn from '../../../i18n/farmer.en.json';
import farmerTa from '../../../i18n/farmer.ta.json';
import { FORM_I18N_KEYS } from '../screens/farm/livestock/animalRecordForms';
import { VIEW_I18N_KEYS } from '../screens/farm/livestock/animalRecordView';

const DIR = path.resolve(__dirname, '../screens/farm/livestock');
const SCREEN = 'AnimalDetailScreen.tsx';
const HELPERS = ['animalRecordForms.ts', 'animalRecordView.ts', 'useAnimalRecords.ts', 'animalAttachment.ts'];

const read = (file: string): string => fs.readFileSync(path.join(DIR, file), 'utf8');

/** Source with block / JSX comments (`{/* … *\/}` leaves `{}`) and line comments removed. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
}

/** The component + helpers, i.e. everything above the StyleSheet (style keys are identifiers). */
function screenCode(): string {
  const src = stripComments(read(SCREEN));
  const stylesAt = src.indexOf('const styles = StyleSheet.create(');
  return stylesAt === -1 ? src : src.slice(0, stylesAt);
}

const ENGLISH_WORD = /[A-Za-z]{2,}/;

describe('AnimalDetailScreen: no hard-coded user-facing English', () => {
  // TabKey ('Health' | 'Feed' | ...) is an internal identifier (testIDs animalDetail.tab.<Key>); the tab
  // captions are translated separately. Its literals are removed before the scan.
  const code = screenCode()
    .replace(/useState<TabKey>\('\w+'\)/g, 'useState<TabKey>(TAB)')
    .replace(/activeTab === '\w+'/g, 'activeTab === TAB')
    .replace(/setActiveTab\('\w+'\)/g, 'setActiveTab(TAB)');
  const lines = code.split('\n');

  it('no English JSX text between tags (inline)', () => {
    const hits: string[] = [];
    for (const [i, line] of lines.entries()) {
      for (const m of line.matchAll(/(?<![=-])>\s*([^<>{}]*?)\s*<\//g)) {
        if (ENGLISH_WORD.test(m[1]!)) hits.push(`${i + 1}: ${m[1]}`);
      }
    }
    expect(hits).toEqual([]);
  });

  it('no English JSX text on its own line or before an inline <Text> (e.g. "Calving date <Text>*</Text>")', () => {
    const hits = lines
      .map((line, i) => ({ line, n: i + 1 }))
      .filter(({ line }) => /^\s*[A-Z][a-z]+(?:[ ,./&()'-]+[A-Za-z0-9&()'%<>µ-]+)*\s*(<Text\b|$)/.test(line))
      // A bare capitalised identifier on its own line (a component name in a multi-line JSX tag) is code.
      .filter(({ line }) => !/^\s*[A-Z][A-Za-z]*\s*$/.test(line) || /^\s*(Yes|No|Other|Normal|None|Male|Female|Cancel|Save|Back|Notes|Location)\s*$/.test(line))
      .map(({ line, n }) => `${n}: ${line.trim()}`);
    expect(hits).toEqual([]);
  });

  it('no English placeholder / accessibilityLabel / label / title literal props', () => {
    const hits = [
      ...code.matchAll(/\b(placeholder|accessibilityLabel|accessibilityHint|label|title)=(["'])([^"']*)\2/g),
      ...code.matchAll(/\b(placeholder|accessibilityLabel|accessibilityHint|label|title)=\{\s*(["'`])([^"'`]*)\2\s*\}/g),
    ]
      .filter((m) => ENGLISH_WORD.test(m[3]!))
      .map((m) => m[0]);
    expect(hits).toEqual([]);
  });

  it('no English Alert titles, messages or button texts', () => {
    expect([...code.matchAll(/Alert\.alert\(\s*(['"`])[^'"`]*[A-Za-z]{2,}/g)].map((m) => m[0])).toEqual([]);
    expect([...code.matchAll(/Alert\.alert\([^)]*?,\s*`[^`]*[A-Za-z]{2,}[^`]*`/g)].map((m) => m[0])).toEqual([]);
    expect([...code.matchAll(/\btext:\s*(['"`])[^'"`]*[A-Za-z]{2,}/g)].map((m) => m[0])).toEqual([]);
  });

  it('option lists hold API enum codes, not English labels', () => {
    const hits: string[] = [];
    for (const m of code.matchAll(/\b[A-Z_]+_OPTIONS\b[^=\n]*=\s*\[([^\]]*)\]/g)) {
      for (const lit of m[1]!.matchAll(/(['"`])([^'"`]*)\1/g)) {
        if (!/^[A-Z0-9_]*$/.test(lit[2]!)) hits.push(`${m[0].slice(0, 40)}… '${lit[2]}'`);
      }
    }
    expect(hits).toEqual([]);
  });

  it('picker / pill state starts from an enum code (or blank / a number), never an English label', () => {
    const hits = [...code.matchAll(/useState(?:<[^>]*>)?\(\s*(['"])([^'"]*)\1\s*\)/g)]
      .map((m) => m[2]!)
      .filter((v) => !/^[A-Z0-9_.]*$/.test(v));
    expect(hits).toEqual([]);
  });

  it('enum comparisons / setters use codes, not English labels', () => {
    // Label-shaped literals only (a capitalised word or a space: 'Heat cycle', 'Yes', 'Milk');
    // lower-case internal states such as 'loading' / 'picked' are identifiers, not labels.
    const hits = [
      ...code.matchAll(/[!=]==\s*(['"])([^'"]*(?:[A-Z][a-z]|\s)[^'"]*)\1/g),
      ...code.matchAll(/\bset[A-Z]\w*\(\s*(['"])([^'"]*(?:[A-Z][a-z]|\s)[^'"]*)\1\s*\)/g),
    ].map((m) => m[0]);
    expect(hits).toEqual([]);
  });

  it('no function returns an English label, except the *FormValue mappers of the AnimalFormData contract', () => {
    const withoutContract = code.replace(/function \w+FormValue\([\s\S]*?\n}/g, '');
    const hits = [...withoutContract.matchAll(/return\s+(['"`])([^'"`]*[A-Za-z]{2,}[^'"`]*)\1/g)].map((m) => m[0]);
    expect(hits).toEqual([]);
  });

  it('the English AnimalFormData contract values are never rendered', () => {
    // The header / modal cards show translated species and gender, not the English form values.
    expect(code).not.toMatch(/display(Species|Gender)\s*=\s*animal\s*\?\s*\w+FormValue\(/);
    expect(code).not.toMatch(/\{\s*\w+FormValue\(/);
  });
});

describe('AnimalDetailScreen helpers: no hard-coded user-facing English', () => {
  for (const file of HELPERS) {
    it(`${file}: no English sentence literals, alerts or labels`, () => {
      const code = stripComments(read(file))
        // Date-input parsing tables (never displayed).
        .replace(/const MONTHS[\s\S]*?};/, '')
        .replace(/const FULL_MONTHS[\s\S]*?\];/, '')
        // RegisterAnimalScreen's English form-date contract (see header).
        .replace(/export function formatRegisterFormDate[\s\S]*?\n}/, '');
      expect(code).not.toMatch(/Alert\.alert/);
      // A capitalised English word followed by more words, in a string literal: a UI sentence or label.
      const hits = [...code.matchAll(/(['"`])([A-Z][a-z]+(?: [A-Za-z]+)+[^'"`]*)\1/g)].map((m) => m[2]);
      expect(hits).toEqual([]);
    });
  }
});

describe('farmer.livestock.detail.* keys: en/ta parity', () => {
  const en: Record<string, string> = { ...errorsEn, ...farmerEn };
  const ta: Record<string, string> = { ...errorsTa, ...farmerTa };

  it('every key used by the screen, its helpers and the option tables exists, non-empty, in en AND ta', () => {
    const keys = new Set<string>([...FORM_I18N_KEYS, ...VIEW_I18N_KEYS]);
    for (const file of [SCREEN, ...HELPERS]) {
      for (const m of read(file).matchAll(/(['"`])((?:farmer|error)\.[A-Za-z0-9_.-]+)\1/g)) keys.add(m[2]!);
    }
    expect(keys.size).toBeGreaterThan(300);
    const missing = [...keys].filter((k) => !(en[k] ?? '').trim() || !(ta[k] ?? '').trim());
    expect(missing).toEqual([]);
  });

  it('every farmer.livestock.detail.* key in en has a non-empty ta translation, and vice versa', () => {
    const enKeys = Object.keys(farmerEn).filter((k) => k.startsWith('farmer.livestock.detail.'));
    const taKeys = Object.keys(farmerTa).filter((k) => k.startsWith('farmer.livestock.detail.'));
    expect(enKeys.filter((k) => !((farmerTa as Record<string, string>)[k] ?? '').trim())).toEqual([]);
    expect(taKeys.filter((k) => !((farmerEn as Record<string, string>)[k] ?? '').trim())).toEqual([]);
  });

  it('ta is actually translated: option labels are not copied English', () => {
    const copied = Object.keys(farmerEn)
      .filter((k) => k.startsWith('farmer.livestock.detail.option.') || k.startsWith('farmer.livestock.detail.housing.verdict.'))
      .filter((k) => /[A-Za-z]{3,}/.test((farmerEn as Record<string, string>)[k]!))
      .filter((k) => (farmerTa as Record<string, string>)[k] === (farmerEn as Record<string, string>)[k]);
    expect(copied).toEqual([]);
  });
});
