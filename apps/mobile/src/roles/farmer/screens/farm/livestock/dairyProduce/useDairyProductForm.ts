import { useCallback } from 'react';
import {
  VALUE_ADDED_CONFIG,
  VALUE_ADDED_TYPES,
  apiOptionLabel,
  type ValueAddedType,
} from './model';
import { useFormState } from './useFormState';

type PerProduct<V> = Record<ValueAddedType, V>;

interface DairyProductFormState {
  quantity: PerProduct<string>;
  /** Raw milk converted -- only curd & paneer record it. */
  milkUsed: { curd: string; paneer: string };
  /** The selected option id within each product's own option group. */
  variant: PerProduct<string>;
  menuOpen: PerProduct<boolean>;
}

function perProduct<V>(make: (p: ValueAddedType) => V): PerProduct<V> {
  return Object.fromEntries(VALUE_ADDED_TYPES.map((p) => [p, make(p)])) as PerProduct<V>;
}

const INITIAL: DairyProductFormState = {
  quantity: perProduct(() => ''),
  milkUsed: { curd: '', paneer: '' },
  variant: perProduct((p) => VALUE_ADDED_CONFIG[p].defaultVariant),
  menuOpen: perProduct(() => false),
};

/** State for all six value-added dairy forms (curd, paneer, butter, ghee,
 *  buttermilk, cheese) -- they share one shape, so one hook. */
export function useDairyProductForm() {
  const [state, update] = useFormState<DairyProductFormState>(INITIAL);

  const setQuantity = useCallback(
    (p: ValueAddedType, v: string) => update((s) => ({ quantity: { ...s.quantity, [p]: v } })),
    [update],
  );
  const setMilkUsed = useCallback(
    (p: 'curd' | 'paneer', v: string) => update((s) => ({ milkUsed: { ...s.milkUsed, [p]: v } })),
    [update],
  );
  const toggleMenu = useCallback(
    (p: ValueAddedType) => update((s) => ({ menuOpen: { ...s.menuOpen, [p]: !s.menuOpen[p] } })),
    [update],
  );
  const selectVariant = useCallback(
    (p: ValueAddedType, id: string) =>
      update((s) => ({ variant: { ...s.variant, [p]: id }, menuOpen: { ...s.menuOpen, [p]: false } })),
    [update],
  );
  /** Quantities clear after a save; milk-used and variant choices persist. */
  const resetQuantities = useCallback(() => update({ quantity: perProduct(() => '') }), [update]);

  /** Trimmed quantity string + the batch description saved with the log
   *  (canonical English -- persisted, so never locale-dependent). */
  const read = (p: ValueAddedType): { quantity: string; batchInfo: string } => {
    const label = apiOptionLabel(VALUE_ADDED_CONFIG[p].group, state.variant[p]);
    const used = p === 'curd' || p === 'paneer' ? state.milkUsed[p] : '';
    let batchInfo = label;
    if (used && p === 'curd') batchInfo = `${label} (${used} L milk)`;
    if (used && p === 'paneer') batchInfo = `${label} · ${used} L milk`;
    return { quantity: state.quantity[p].trim(), batchInfo };
  };

  return { state, setQuantity, setMilkUsed, toggleMenu, selectVariant, resetQuantities, read };
}

export type DairyProductForm = ReturnType<typeof useDairyProductForm>;
