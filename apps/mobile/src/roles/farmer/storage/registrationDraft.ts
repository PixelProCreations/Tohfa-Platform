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
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StateStorage } from 'zustand/middleware';
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

/**
 * Step 2 describes the farmer's ONE farming operation, not a list of farms. A farmer runs a
 * single operation whose land happens to sit in several physical places; the places are Step 3's
 * `FarmLocationData[]`.
 *
 * `experienceYears` is asked here, once, because it describes the operation/farmer -- not each
 * parcel. It briefly lived nowhere at all: it was dropped from this step on the belief that Step 1
 * already collected it as `Step1PersonalData.farmingExperienceYears`. Step 1 never had an input for
 * that field, so nothing populated it and every approved farmer landed on
 * `farmers.farming_experience_years = 0` permanently. Asking it once per *operation* (here) is
 * right; asking it once per *farm* -- the model before that -- was the original mistake. Do not
 * move it to `FarmLocationData`.
 *
 * `totalAreaAcres` and `numberOfFarms` are the farmer's OWN STATED figures, typically read off their
 * land records (patta/chitta). They are deliberately NOT derived from Step 3 -- not from summing the
 * parcels' `areaAcres`, and not from `locations.length` -- and each is allowed to disagree with its
 * Step 3 counterpart. The parcels come from the ground; the stated figures come from paper. A gap
 * between them is the signal `FARM_VERIFICATION` exists to catch -- unmarked land, stale records, or
 * an inflated claim -- and a derived figure would always agree with itself and so tell a verifier
 * nothing. Surface the difference; never auto-correct it, and never block on it (a farmer
 * mid-registration legitimately has parcels still unmarked).
 *
 * `numberOfFarms` is a claim only. It must never drive how many `farms` rows approval creates --
 * that count comes from the actual Step 3 `locations`.
 */
export interface Step2FarmData {
  /**
   * The name of the whole farming OPERATION, e.g. "Great Earth Organic". Asked once, here.
   *
   * Distinct from `FarmLocationData.label`, which names ONE parcel ("Home plot", "River plot").
   * Approval keeps them separate too: `farmName` stays in the `step2_farm_details` JSONB, while
   * each `farms` row takes its `name` from its own location's `label`.
   */
  farmName?: string | undefined;
  typeOfFarming?: string | undefined;
  experienceYears?: number | undefined;
  totalAreaAcres?: number | undefined;
  numberOfFarms?: number | undefined;
  waterSource?: string | undefined;
  primaryCrops?: string[] | undefined;
}

/**
 * A stable, client-generated key for one land location within a single registration draft -- not
 * a database primary key. It only has to be unique within that draft, so it does not need to be a
 * real UUID (there is no UUID library in this app; see `correlationId()` in
 * `src/shell/api/client.ts` for the same reasoning applied to a log key). It exists so that a
 * re-render or a reorder of the locations list keeps each entry attached to its own map boundary
 * rather than to its position in the array.
 */
export function generateLocationId(): string {
  return `farm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * One physical parcel of the farmer's land: a farmer-facing `label` (which becomes `farms.name`
 * server-side), the acreage the farmer states for THIS parcel, and its own GPS boundary. There is
 * deliberately no cross-step correlation key here -- a location is self-contained, so nothing has
 * to be matched back to a Step 2 entry.
 */
export interface FarmLocationData {
  id: string;
  label: string;
  areaAcres: number;
  gpsCaptured?: boolean | undefined;
  latitude?: number | undefined;
  longitude?: number | undefined;
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

/**
 * Just the parcels. There are no totals here: the farmer's stated figures are
 * `Step2FarmData.totalAreaAcres` and `Step2FarmData.numberOfFarms`, while the sum of these
 * `areaAcres` and this array's `length` are the separate, ground-derived counterparts computed for
 * display next to them. Keeping both, and letting them drift, is the point -- see `Step2FarmData`.
 * Do not add a total or a count to this step, and do not write either derived figure back over what
 * the farmer stated.
 */
export interface Step3LocationData {
  locations: FarmLocationData[];
}

/**
 * Fixed option set for the ID Proof row's document-type picker (Step 4). User-confirmed list --
 * do not add or remove an option here without re-confirming, since the mobile UI is what
 * constrains which strings a farmer can pick (the server's `docSubType` field is a plain,
 * unvalidated string; this list is the only real enforcement of what counts as valid).
 */
export const ID_PROOF_SUB_TYPES = [
  'Aadhaar Card',
  'Voter ID',
  'Passport',
  'PAN Card',
  'Driving Licence',
  'Birth Certificate',
  'Others',
] as const;

/** Fixed option set for the Farm Documents row's document-type picker (Step 4). Same caveat as
 * `ID_PROOF_SUB_TYPES` above -- "Others" exists in both lists as its own per-docType catch-all,
 * not a single value shared between them. */
export const FARM_DOC_SUB_TYPES = [
  'Patta',
  'Chitta',
  'Lease Agreement',
  'Land Deed',
  'Electricity Bill',
  'Water Bill',
  'Others',
] as const;

export type IdProofSubType = (typeof ID_PROOF_SUB_TYPES)[number];
export type FarmDocSubType = (typeof FARM_DOC_SUB_TYPES)[number];

export interface DocumentItemData {
  docType: 'ID_PROOF' | 'FARM_DOC' | 'CERTIFICATE' | 'OTHER';
  fileUrl: string;
  fileName?: string | undefined;
  /**
   * Which specific document this is, e.g. "Aadhaar Card" for an ID_PROOF row or "Patta" for a
   * FARM_DOC row -- without it a `FARM_VERIFICATION` reviewer has to open the file to find out
   * what it even is. Optional at the type/schema level because CERTIFICATE/OTHER rows never
   * collect one (Step 4's UI only offers this picker for the ID Proof and Farm Documents rows)
   * and because older drafts saved before this field existed have none. Valid values come from
   * `ID_PROOF_SUB_TYPES` when `docType === 'ID_PROOF'` and from `FARM_DOC_SUB_TYPES` when
   * `docType === 'FARM_DOC'` -- both lists include "Others" as their own catch-all.
   */
  docSubType?: string | undefined;
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
  /**
   * One-shot restore from the server's full draft (`getFarmerApplicationDraft` /
   * `GET /farmers/applications/:id`), for the "lost the local draft, recovered via a
   * `CONFLICT` on create" path in `RegistrationFlowScreen.tsx`. Unlike `updateStepAndAdvance`,
   * this replaces the whole `draft` in one `set()` -- it does not merge into whatever is
   * currently there (there is nothing worth preserving: the entire reason this runs is that
   * the local draft was lost), does not advance `currentStep` past what the server reports,
   * and has no side effect that would re-`PATCH` any step back to the server. Looping
   * `updateStepAndAdvance` once per recovered step would work too, but each call fires its own
   * `saveFarmerApplicationStep` network request for data the server already has -- a wasted
   * round trip per step for data that's already durable server-side.
   *
   * A step argument comes back from the server as a bare `{}` when that step was never saved
   * (see `FullDraftResponse`'s docblock in `api/registration.ts`); such a step is left
   * `undefined` here rather than overwriting anything with an empty object, mirroring how
   * `RegistrationDraft.stepN` is `undefined` for a step never reached in the normal flow.
   */
  restoreFullDraft: (serverDraft: {
    applicationId: string;
    currentStep: number;
    step1Personal?: Record<string, unknown> | undefined;
    step2FarmDetails?: Record<string, unknown> | undefined;
    step3Location?: Record<string, unknown> | undefined;
    step4Documents?: Record<string, unknown> | undefined;
  }) => void;
}

/** `{}` from the server means "this step was never saved" -- see `restoreFullDraft` above. */
function definedIfNonEmpty<T>(value: Record<string, unknown> | undefined): T | undefined {
  return value !== undefined && Object.keys(value).length > 0 ? (value as T) : undefined;
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
      restoreFullDraft: (serverDraft) =>
        set({
          draft: {
            applicationId: serverDraft.applicationId,
            currentStep: Math.min(5, Math.max(1, serverDraft.currentStep)),
            step1: definedIfNonEmpty<Step1PersonalData>(serverDraft.step1Personal),
            step2: definedIfNonEmpty<Step2FarmData>(serverDraft.step2FarmDetails),
            step3: definedIfNonEmpty<Step3LocationData>(serverDraft.step3Location),
            step4: definedIfNonEmpty<Step4DocumentsData>(serverDraft.step4Documents),
          },
        }),
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
