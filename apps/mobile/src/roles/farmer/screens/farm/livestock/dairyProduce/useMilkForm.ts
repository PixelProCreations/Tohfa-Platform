import { useCallback } from 'react';
import { OPTION_IDS } from './model';
import { useFormState } from './useFormState';

interface MilkFormState {
  animalIndex: number;
  /** An `OPTION_IDS.milkSession` id. */
  session: string;
  quantity: string;
  fat: string;
  animalOpen: boolean;
  sessionOpen: boolean;
}

const INITIAL: MilkFormState = {
  animalIndex: 0,
  session: OPTION_IDS.milkSession[0] ?? 'morningAm',
  quantity: '',
  fat: '',
  animalOpen: false,
  sessionOpen: false,
};

export function useMilkForm() {
  const [state, update] = useFormState<MilkFormState>(INITIAL);

  return {
    state,
    setQuantity: useCallback((quantity: string) => update({ quantity }), [update]),
    setFat: useCallback((fat: string) => update({ fat }), [update]),
    // Opening one menu closes its sibling, as before.
    toggleAnimalMenu: useCallback(
      () => update((s) => ({ animalOpen: !s.animalOpen, sessionOpen: false })),
      [update],
    ),
    toggleSessionMenu: useCallback(
      () => update((s) => ({ sessionOpen: !s.sessionOpen, animalOpen: false })),
      [update],
    ),
    selectAnimal: useCallback((animalIndex: number) => update({ animalIndex, animalOpen: false }), [update]),
    selectSession: useCallback((session: string) => update({ session, sessionOpen: false }), [update]),
    /** After a successful save only the entered amounts are cleared. */
    resetEntries: useCallback(() => update({ quantity: '', fat: '' }), [update]),
  };
}

export type MilkForm = ReturnType<typeof useMilkForm>;
