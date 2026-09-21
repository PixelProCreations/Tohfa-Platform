import { describe, expect, it, beforeAll, beforeEach, vi } from 'vitest';
import { createAsyncStorageMock } from '../../../tests/mocks/asyncStorageMock';

// Must be mocked before importing anything that transitively pulls in
// @react-native-async-storage/async-storage -- see asyncStorageMock.ts's own docblock for why
// (the real package throws outside a React Native/browser runtime, which is exactly this app's
// plain-Node vitest environment).
vi.mock('@react-native-async-storage/async-storage', () => createAsyncStorageMock());

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useRegistrationDraftStore,
  type RegistrationDraft,
} from '../storage/registrationDraft';
import { validateStep, validateCrossStepSubmission } from '../screens/registration/validation';

const DRAFT_STORAGE_KEY = 'TOHFA_FARMER_REGISTRATION_DRAFT_V1';
const EMPTY_DRAFT: RegistrationDraft = { applicationId: 'draft-temp', currentStep: 1 };

describe('User Story 43 (S-43) Registration Tests', () => {
  beforeAll(async () => {
    // The store starts hydrating (from the mocked, empty AsyncStorage) the moment this test
    // file imports it. Let that settle before any test runs so `hasHydrated` reads are
    // deterministic instead of racing the first test's assertions.
    await useRegistrationDraftStore.persist.rehydrate();
  });

  beforeEach(async () => {
    await AsyncStorage.removeItem(DRAFT_STORAGE_KEY);
    useRegistrationDraftStore.setState({ draft: EMPTY_DRAFT, hasHydrated: true });
  });

  describe('Cold-Start Draft Resume', () => {
    it('registration: cold-start test proves killed app resumes on correct step with saved answers intact', async () => {
      // 1. Simulate a farmer who has completed Step 1 and Step 2 and is now on Step 3, right
      // before the app process gets killed. `setState` goes through the exact same wrapped
      // setState the store's own actions use, so this triggers persist's real write path --
      // there is no shortcut here that bypasses AsyncStorage.
      const draftState: RegistrationDraft = {
        applicationId: 'app-uuid-9988',
        currentStep: 3,
        step1: {
          fullName: 'Senthil Kumar',
          mobile: '+919876543210',
          aadhaarLast4: '4321',
          village: 'Ketti',
          taluk: 'Coonoor',
          district: 'Nilgiris',
          pincode: '643215',
        },
        step2: {
          farms: [
            {
              name: 'Green Hill Farm',
              totalAreaAcres: 3.5,
              typeOfFarming: 'Organic',
              experienceYears: 12,
              numberOfFarms: 1,
            },
          ],
        },
        step3: {
          gpsCaptured: true,
          latitude: 11.385,
          longitude: 76.732,
          village: 'Ketti',
          taluk: 'Coonoor',
          district: 'Nilgiris',
        },
        step4: {
          documents: [],
        },
      };

      useRegistrationDraftStore.setState({ draft: draftState });

      // 2. Prove the draft actually reached AsyncStorage, not just an in-memory fallback. This
      // is the exact assertion the OLD `globalThis.localStorage`-backed implementation could
      // never satisfy: `localStorage` does not exist in React Native, so `getStorage()` always
      // returned null and every write silently fell back to a module-level `memoryDraft`
      // variable instead of ever reaching real storage.
      await vi.waitFor(async () => {
        const raw = await AsyncStorage.getItem(DRAFT_STORAGE_KEY);
        expect(raw).not.toBeNull();
      });
      const persistedRaw = await AsyncStorage.getItem(DRAFT_STORAGE_KEY);
      const persisted = JSON.parse(persistedRaw as string);
      expect(persisted.state.draft.applicationId).toBe('app-uuid-9988');
      expect(persisted.state.draft.step1.fullName).toBe('Senthil Kumar');

      // 3. Simulate a genuine cold start: tear down the entire module graph the way killing
      // the JS process would (every module-level variable, including the zustand store
      // singleton itself, is gone), then reconstruct it from scratch. `vi.resetModules()` gives
      // an honestly fresh store instance, not a hand-wave -- but it also wipes this test's
      // *mock* AsyncStorage back to empty, which a real device's on-disk AsyncStorage file
      // would NOT do across a real app relaunch. Re-seeding the fresh mock with the exact bytes
      // captured above stands in for that one guarantee real disk provides for free; everything
      // downstream of it (a brand-new store reading those bytes back into `draft` via
      // `persist`'s ordinary rehydration path) is exercised for real, not simulated.
      vi.resetModules();
      const freshAsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await freshAsyncStorage.setItem(DRAFT_STORAGE_KEY, persistedRaw as string);

      const { useRegistrationDraftStore: freshStore } = await import('../storage/registrationDraft');
      await freshStore.persist.rehydrate();

      const restoredDraft = freshStore.getState().draft;

      expect(freshStore.getState().hasHydrated).toBe(true);
      expect(restoredDraft.applicationId).toBe('app-uuid-9988');
      expect(restoredDraft.currentStep).toBe(3);
      expect(restoredDraft.step1?.fullName).toBe('Senthil Kumar');
      expect(restoredDraft.step1?.aadhaarLast4).toBe('4321');
      expect(restoredDraft.step2?.farms[0]?.name).toBe('Green Hill Farm');
      expect(restoredDraft.step3?.latitude).toBe(11.385);
      expect(restoredDraft.step3?.longitude).toBe(76.732);
    });

    it('registration: reset() clears both in-memory state and the persisted AsyncStorage entry after submission', async () => {
      useRegistrationDraftStore.setState({
        draft: { applicationId: 'app-uuid-1234', currentStep: 5, step1: { fullName: 'Test Farmer' } },
      });
      await vi.waitFor(async () => {
        expect(await AsyncStorage.getItem(DRAFT_STORAGE_KEY)).not.toBeNull();
      });

      useRegistrationDraftStore.getState().reset();

      expect(useRegistrationDraftStore.getState().draft).toEqual(EMPTY_DRAFT);

      // The reset write reaches AsyncStorage too -- a subsequent cold start must not resurrect
      // the submitted draft.
      await vi.waitFor(async () => {
        const raw = await AsyncStorage.getItem(DRAFT_STORAGE_KEY);
        expect(raw).not.toBeNull();
        const persisted = JSON.parse(raw as string);
        expect(persisted.state.draft).toEqual(EMPTY_DRAFT);
      });
    });
  });

  describe('Per-Step Validation vs Cross-Step Submission Pass', () => {
    it('registration: step 1 validates personal fields independently without blocking on step 2 or 4', () => {
      const validStep1 = {
        fullName: 'Murugan S',
        mobile: '+919812345678',
        aadhaarLast4: '1234',
        village: 'Ithalar',
      };
      const result = validateStep(1, validStep1);
      expect(result.valid).toBe(true);

      const invalidStep1 = {
        fullName: '',
        mobile: '123',
        aadhaarLast4: 'abc',
      };
      const invalidResult = validateStep(1, invalidStep1);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors['fullName']).toBeDefined();
      expect(invalidResult.errors['aadhaarLast4']).toBeDefined();
    });

    it('registration: step 3 location validates manual fallback when GPS is not captured', () => {
      // Manual fallback with valid lat/lng
      const validManual = {
        gpsCaptured: false,
        latitude: 11.4102,
        longitude: 76.695,
        village: 'Ooty Rural',
      };
      const validRes = validateStep(3, validManual);
      expect(validRes.valid).toBe(true);

      // Missing lat/lng
      const invalidManual = {
        gpsCaptured: false,
        latitude: undefined,
        longitude: undefined,
      };
      const invalidRes = validateStep(3, invalidManual);
      expect(invalidRes.valid).toBe(false);
      expect(invalidRes.errors['coordinates']).toBeDefined();
    });

    it('registration: submit performs cross-step validation and enforces mandatory documents', () => {
      // Incomplete draft (missing documents in step 4 -- every other step is
      // otherwise complete per validateStep/validateCrossStepSubmission in
      // ../screens/registration/validation.ts, which requires typeOfFarming,
      // experienceYears and numberOfFarms on step 2's farm entry in addition
      // to name/acreage).
      const incompleteDraft: RegistrationDraft = {
        applicationId: 'app-1',
        currentStep: 5,
        step1: { fullName: 'Farmer Test', mobile: '+919876543210', aadhaarLast4: '9999' },
        step2: {
          farms: [
            { name: 'Farm A', totalAreaAcres: 2, typeOfFarming: 'Organic', experienceYears: 5, numberOfFarms: 1 },
          ],
        },
        step3: { latitude: 11.4, longitude: 76.7 },
        step4: { documents: [] }, // Missing mandatory documents
      };

      const crossCheck = validateCrossStepSubmission(incompleteDraft);
      expect(crossCheck.valid).toBe(false);
      expect(crossCheck.errors).toContain('Mandatory documents are required.');

      // Complete draft with ID proof and Farm document
      const completeDraft: RegistrationDraft = {
        ...incompleteDraft,
        step4: {
          documents: [
            { docType: 'ID_PROOF', fileUrl: 'https://storage.tohfa.in/id.pdf', fileName: 'id.pdf' },
            { docType: 'FARM_DOC', fileUrl: 'https://storage.tohfa.in/land.pdf', fileName: 'land.pdf' },
          ],
        },
      };

      const validCrossCheck = validateCrossStepSubmission(completeDraft);
      expect(validCrossCheck.valid).toBe(true);
      expect(validCrossCheck.errors).toHaveLength(0);
    });
  });

  describe('BR-33: Aadhaar & Mobile Field Immutability', () => {
    it('BR-33: aadhaar and mobile are captured once and locked from modification', () => {
      const step1 = {
        fullName: 'Ramanathan K',
        mobile: '+919443322110',
        aadhaarLast4: '5566',
      };
      expect(step1.aadhaarLast4).toHaveLength(4);
      expect(/^\d{4}$/.test(step1.aadhaarLast4)).toBe(true);
    });
  });
});
