/**
 * The per-tab sections of AnimalDetailScreen and their helpers must not carry
 * user-facing English: every label, placeholder, empty state, accessibility
 * label and message is an i18n key present (non-empty) in BOTH farmer.en.json
 * and farmer.ta.json. Dev's own screen file keeps its existing copy untouched
 * (no design or copy change), so only the new files are scanned.
 *
 * The scan is a source check in the style of input_management.test.tsx,
 * made rule-based instead of a fixed literal list so a newly added hard-coded
 * string fails it. Comments are stripped first.
 *
 * Deliberately NOT flagged: testIDs, style names, enum codes (UPPER_SNAKE) —
 * identifiers, never shown.
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import errorsEn from '../../../i18n/errors.en.json';
import errorsTa from '../../../i18n/errors.ta.json';
import farmerEn from '../../../i18n/farmer.en.json';
import farmerTa from '../../../i18n/farmer.ta.json';
import { VIEW_I18N_KEYS } from '../screens/farm/livestock/animalRecordView';
import { formI18nKeys } from '../screens/farm/livestock/animalRecordForms';

const DIR = path.resolve(__dirname, '../screens/farm/livestock');
const SECTIONS = [
  'AnimalHealthSection.tsx',
  'AnimalFeedSection.tsx',
  'AnimalBreedingSection.tsx',
  'AnimalHousingSection.tsx',
  'animalDetailSectionParts.tsx',
  'AnimalRecordFormModal.tsx',
];
const HELPERS = ['animalRecordView.ts', 'useAnimalRecords.ts', 'animalRecordForms.ts'];

const read = (file: string): string => fs.readFileSync(path.join(DIR, file), 'utf8');

/** Source with block / JSX comments (`{/* … *\/}` leaves `{}`) and line comments removed. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
}

/** The component + helpers, i.e. everything above the StyleSheet (style keys are identifiers). */
function sectionCode(file: string): string {
  const src = stripComments(read(file));
  const stylesAt = src.indexOf('const styles = StyleSheet.create(');
  return stylesAt === -1 ? src : src.slice(0, stylesAt);
}

const ENGLISH_WORD = /[A-Za-z]{2,}/;

describe.each(SECTIONS)('%s: no hard-coded user-facing English', (file) => {
  const code = sectionCode(file);
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

});

describe('AnimalDetailScreen helpers: no hard-coded user-facing English', () => {
  for (const file of HELPERS) {
    it(`${file}: no English sentence literals, alerts or labels`, () => {
      const code = stripComments(read(file))
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
    const keys = new Set<string>([...VIEW_I18N_KEYS, ...formI18nKeys()]);
    for (const file of [...SECTIONS, ...HELPERS]) {
      for (const m of read(file).matchAll(/(['"`])((?:farmer|error)\.[A-Za-z0-9_.-]+)\1/g)) keys.add(m[2]!);
    }
    expect(keys.size).toBeGreaterThan(80);
    const missing = [...keys].filter((k) => !(en[k] ?? '').trim() || !(ta[k] ?? '').trim());
    expect(missing).toEqual([]);
  });

  it('every farmer.livestock.detail.* key in en has a non-empty ta translation, and vice versa', () => {
    const enKeys = Object.keys(farmerEn).filter((k) => k.startsWith('farmer.livestock.detail.'));
    const taKeys = Object.keys(farmerTa).filter((k) => k.startsWith('farmer.livestock.detail.'));
    expect(enKeys.filter((k) => !((farmerTa as Record<string, string>)[k] ?? '').trim())).toEqual([]);
    expect(taKeys.filter((k) => !((farmerEn as Record<string, string>)[k] ?? '').trim())).toEqual([]);
  });

});
