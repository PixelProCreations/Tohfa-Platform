/**
 * Local draft persistence for Farmer Registration (S-43).
 * Survives process kills and cold starts.
 *
 * Backed by Zustand's `persist` middleware, with an AsyncStorage-based `StateStorage` adapter
 * (`@react-native-async-storage/async-storage` is already a dependency of this app). This used
 * to read/write `globalThis.localStorage`, which does not exist in React Native at all -- it is
 * a browser-only API. `getStorage()` always returned `null`, so every read/write silently fell
 * back to a module-level `memoryDraft` variable that was wiped on every app restart. A farmer
 * who filled out 3 of 5 registration steps and had the app killed lost everything, despite this
 * file's own docblock claiming otherwise. See `storage/tokenStorage.ts` for the same bug shape,
 * fixed the same session (Keychain-backed there, because farmer tokens need stronger-than-disk
 * protection; a registration draft has no such requirement, so plain AsyncStorage is the right
 * tier here, matching `roles/customer/storage/tokenStorage.ts`'s reasoning in the other
 * direction).
 *
 * Storage key: kept as `TOHFA_FARMER_REGISTRATION_DRAFT_V1`, the same name the old (broken)
 * code used. There is no real prior persisted data to migrate -- the old code never actually
 * wrote anything AsyncStorage/localStorage could read back -- so this is just naming
 * continuity, not a migration concern.
 */

import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Step1PersonalData {
  fullName?: string | undefined;
  mobile?: string | undefined;
  dob?: string | undefined;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'UNDISCLOSED' | string | undefined;
  aadhaarNumber?: string | undefined;
  aadhaarLast4?: string | undefined;
  address?: string | undefined;
  farmingExperienceYears?: number | undefined;
  addressLine1?: string | undefined;
  addressLine2?: string | undefined;
  village?: string | undefined;
  taluk?: string | undefined;
  district?: string | undefined;
  state?: string | undefined;
  country?: string | undefined;
  pincode?: string | undefined;
}

export interface FarmItemData {
  name: string;
  totalAreaAcres: number;
  typeOfFarming?: string | undefined;
  experienceYears?: number | undefined;
  numberOfFarms?: number | undefined;
  waterSource?: string | undefined;
  primaryCrops?: string[] | undefined;
}

export interface Step2FarmData {
  farms: FarmItemData[];
}

export interface Step3LocationData {
  gpsCaptured?: boolean | undefined;
  latitude?: number | undefined;
  longitude?: number | undefined;
  areaAcres?: number | undefined;
  calculatedAreaAcres?: number | undefined;
  calculatedAreaHectares?: number | undefined;
  fmbPolygon?: {
    type: 'Polygon';
    coordinates: number[][][];
  } | undefined;
  village?: string | undefined;
  taluk?: string | undefined;
  district?: string | undefined;
}

export interface DocumentItemData {
  docType: 'ID_PROOF' | 'FARM_DOC' | 'CERTIFICATE' | 'OTHER';
  fileUrl: string;
  fileName?: string | undefined;
}

export interface Step4DocumentsData {
  documents: DocumentItemData[];
}

export interface Step5ReviewData {
  confirmed?: boolean | undefined;
  notes?: string | undefined;
}

export interface RegistrationDraft {
  applicationId: string;
  currentStep: number;
  step1?: Step1PersonalData | undefined;
  step2?: Step2FarmData | undefined;
  step3?: Step3LocationData | undefined;
  step4?: Step4DocumentsData | undefined;
  step5?: Step5ReviewData | undefined;
}

const DRAFT_STORAGE_KEY = 'TOHFA_FARMER_REGISTRATION_DRAFT_V1';

const INITIAL_DRAFT: RegistrationDraft = {
  applicationId: 'draft-temp',
  currentStep: 1,
};

// Zustand's `persist` middleware talks to a `StateStorage` (getItem/setItem/removeItem all
// returning string | null, synchronously or as a promise) -- not directly to whatever storage
// engine backs it. AsyncStorage already matches that shape method-for-method; this adapter only
// exists to normalize its `null | undefined` return into the `string | null` persist expects.
const asyncStorageAdapter: StateStorage = {
  getItem: async (name) => (await AsyncStorage.getItem(name)) ?? null,
  setItem: async (name, value) => {
    await AsyncStorage.setItem(name, value);
  },
  removeItem: async (name) => {
    await AsyncStorage.removeItem(name);
  },
};

interface RegistrationDraftStore {
  draft: RegistrationDraft;
  /**
   * True once `persist` has finished attempting to read `DRAFT_STORAGE_KEY` from AsyncStorage
   * (whether or not a draft existed there) and `draft` reflects the result. Replaces the old
   * manual `loading` state that `RegistrationFlowScreen` used to track the same thing by hand.
   */
  hasHydrated: boolean;
  setHasHydrated: (hydrated: boolean) => void;
  /** Sets the server-assigned application id once step 1 creates the real draft record. */
  setApplicationId: (applicationId: string) => void;
  /** Merges `payload` into the given step's slot and advances `currentStep` (capped at 5). */
  updateStepAndAdvance: (step: number, payload: unknown) => void;
  /** Jumps directly to a given step (used by Step 5's per-section "Edit" links). */
  goToStep: (step: number) => void;
  /** Moves back one step (floored at step 1). */
  goBack: () => void;
  /** Resets the draft to its initial, empty state -- used after a successful submission. */
  reset: () => void;
}

export const useRegistrationDraftStore = create<RegistrationDraftStore>()(
  persist(
    (set, get) => ({
      draft: INITIAL_DRAFT,
      hasHydrated: false,
      setHasHydrated: (hydrated) => set({ hasHydrated: hydrated }),
      setApplicationId: (applicationId) =>
        set({ draft: { ...get().draft, applicationId } }),
      updateStepAndAdvance: (step, payload) => {
        const stepKey = `step${step}` as keyof RegistrationDraft;
        const current = get().draft;
        set({
          draft: {
            ...current,
            currentStep: Math.min(5, step + 1),
            [stepKey]: payload,
          } as RegistrationDraft,
        });
      },
      goToStep: (step) => set({ draft: { ...get().draft, currentStep: step } }),
      goBack: () =>
        set({ draft: { ...get().draft, currentStep: Math.max(1, get().draft.currentStep - 1) } }),
      reset: () => set({ draft: INITIAL_DRAFT }),
    }),
    {
      name: DRAFT_STORAGE_KEY,
      storage: createJSONStorage(() => asyncStorageAdapter),
      // Only `draft` is meaningful state to persist; `hasHydrated` is a runtime-only flag that
      // must always start `false` on a fresh process, never read back from a prior run.
      partialize: (state) => ({ draft: state.draft }),
      onRehydrateStorage: () => () => {
        // Called after the read from AsyncStorage settles, whether it found a draft, found
        // nothing (fresh install), or failed (corrupt JSON / storage error) -- in every case
        // `draft` in state is now final and it is safe to stop showing the loading UI.
        useRegistrationDraftStore.getState().setHasHydrated(true);
      },
    },
  ),
);
