import { useCallback } from 'react';
import { OPTION_IDS } from './model';
import { useFormState } from './useFormState';

interface EggFormState {
  flockIndex: number;
  /** An `OPTION_IDS.eggSession` id. */
  session: string;
  count: string;
  damaged: string;
  flockOpen: boolean;
  sessionOpen: boolean;
}

const INITIAL: EggFormState = {
  flockIndex: 0,
  session: OPTION_IDS.eggSession[0] ?? 'morning',
  count: '',
  damaged: '',
  flockOpen: false,
  sessionOpen: false,
};

export function useEggForm() {
  const [state, update] = useFormState<EggFormState>(INITIAL);

  return {
    state,
    setCount: useCallback((count: string) => update({ count }), [update]),
    setDamaged: useCallback((damaged: string) => update({ damaged }), [update]),
    toggleFlockMenu: useCallback(
      () => update((s) => ({ flockOpen: !s.flockOpen, sessionOpen: false })),
      [update],
    ),
    toggleSessionMenu: useCallback(
      () => update((s) => ({ sessionOpen: !s.sessionOpen, flockOpen: false })),
      [update],
    ),
    selectFlock: useCallback((flockIndex: number) => update({ flockIndex, flockOpen: false }), [update]),
    selectSession: useCallback((session: string) => update({ session, sessionOpen: false }), [update]),
    resetEntries: useCallback(() => update({ count: '', damaged: '' }), [update]),
  };
}

export type EggForm = ReturnType<typeof useEggForm>;
