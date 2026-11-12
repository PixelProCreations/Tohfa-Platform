import { useCallback, useState } from 'react';
import { useFieldValidation } from '../../../utils/validation';
import { FARM_RULES, PERSONAL_RULES, type FarmField, type PersonalField } from '../profileValidation';
import type { FarmDetailsData, PersonalDetailsData } from './profileHelpers';

const PERSONAL_ORDER: readonly PersonalField[] = ['fullName', 'dob', 'yearsInOrganic', 'farmName', 'location'];
const FARM_ORDER: readonly FarmField[] = ['acres', 'zones', 'waterSource'];

export interface PersonalEditForm {
  fullName: string;
  dob: string;
  yearsInOrganic: string;
  farmingType: string;
  farmName: string;
  location: string;
}

/** Draft values for the "edit personal details" modal. */
export function usePersonalEditForm(initial: PersonalDetailsData) {
  const [form, setForm] = useState<PersonalEditForm>(() => ({
    fullName: initial.fullName,
    dob: initial.dob,
    yearsInOrganic: '14',
    farmingType: initial.farmingType,
    farmName: initial.farmName,
    location: initial.location,
  }));
  const setField = useCallback(
    (key: keyof PersonalEditForm, value: string) => setForm((prev) => ({ ...prev, [key]: value })),
    [],
  );
  // Inline errors + the save gate (validateAll); farmingType is a chip, not typed text.
  const validation = useFieldValidation<PersonalField>({ values: form, rules: PERSONAL_RULES, order: PERSONAL_ORDER });
  const resetValidation = validation.reset;
  /** Reset the draft from the saved details (called when the modal opens). */
  const resetFrom = useCallback((saved: PersonalDetailsData) => {
    setForm({
      fullName: saved.fullName,
      dob: saved.dob,
      yearsInOrganic: saved.yearsInOrganic,
      farmingType: saved.farmingType,
      farmName: saved.farmName,
      location: saved.location,
    });
    resetValidation();
  }, [resetValidation]);
  return { form, setField, resetFrom, validation };
}

export interface FarmEditForm {
  acres: string;
  zones: string;
  waterSource: string;
}

/** Draft values for the "edit farm" modal. */
export function useFarmEditForm(initial: FarmDetailsData) {
  const [form, setForm] = useState<FarmEditForm>(() => ({
    acres: initial.acres,
    zones: initial.zones,
    waterSource: initial.waterSource,
  }));
  const setField = useCallback(
    (key: keyof FarmEditForm, value: string) => setForm((prev) => ({ ...prev, [key]: value })),
    [],
  );
  const validation = useFieldValidation<FarmField>({ values: form, rules: FARM_RULES, order: FARM_ORDER });
  const resetValidation = validation.reset;
  /** Reset the draft from the saved details; the "—" placeholder becomes an empty field. */
  const resetFrom = useCallback((saved: FarmDetailsData) => {
    setForm({
      acres: saved.acres === '—' ? '' : saved.acres,
      zones: saved.zones === '—' ? '' : saved.zones,
      waterSource: saved.waterSource === '—' ? '' : saved.waterSource,
    });
    resetValidation();
  }, [resetValidation]);
  return { form, setField, resetFrom, validation };
}
