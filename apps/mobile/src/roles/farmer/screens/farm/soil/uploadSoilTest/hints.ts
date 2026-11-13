import { RANGES } from './constants';

export type HintKind = 'warn' | 'ok' | 'info';

/** `textKey` is a `farmer.uploadSoilTest.*` suffix, resolved with `st()`. */
export interface Hint {
  kind: HintKind;
  textKey: string;
}

export function classifyOrganicCarbon(v: number): Hint | null {
  if (!(v > 0)) return null;
  const { low, high } = RANGES.oc;
  if (v >= low && v <= high) return { kind: 'info', textKey: 'hint.oc.medium' };
  if (v < low) return { kind: 'info', textKey: 'hint.oc.low' };
  return { kind: 'info', textKey: 'hint.oc.high' };
}

export function isPhAcidic(v: number): boolean {
  return v > 0 && v < RANGES.ph.low;
}

export function classifyPh(v: number): Hint | null {
  if (isPhAcidic(v)) return { kind: 'warn', textKey: 'hint.ph.acidic' };
  if (v >= RANGES.ph.low && v <= RANGES.ph.high) return { kind: 'ok', textKey: 'hint.ph.good' };
  if (v > RANGES.ph.high) return { kind: 'warn', textKey: 'hint.ph.alkaline' };
  return null;
}

export function classifyNitrogen(v: number): Hint | null {
  const { low, high } = RANGES.nitrogen;
  if (v > 0 && v < low) return { kind: 'warn', textKey: 'hint.n.low' };
  if (v >= low && v <= high) return { kind: 'ok', textKey: 'hint.n.medium' };
  if (v > high) return { kind: 'info', textKey: 'hint.n.high' };
  return null;
}

export function classifyPhosphorus(v: number): Hint | null {
  const { low, high } = RANGES.phosphorus;
  if (v > 0 && v < low) return { kind: 'warn', textKey: 'hint.p.low' };
  if (v >= low && v <= high) return { kind: 'ok', textKey: 'hint.p.medium' };
  if (v > high) return { kind: 'ok', textKey: 'hint.p.high' };
  return null;
}

export function classifyPotassium(v: number): Hint | null {
  const { low, high } = RANGES.potassium;
  if (v > 0 && v < low) return { kind: 'warn', textKey: 'hint.k.low' };
  if (v >= low && v <= high) return { kind: 'ok', textKey: 'hint.k.good' };
  if (v > high) return { kind: 'ok', textKey: 'hint.k.high' };
  return null;
}
