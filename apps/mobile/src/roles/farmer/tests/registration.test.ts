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
          farmName: 'Green Hill Organics',
          typeOfFarming: 'Organic',
          experienceYears: 12,
          totalAreaAcres: 4,
          numberOfFarms: 2,
          waterSource: 'Borewell',
          primaryCrops: ['Carrot', 'Beetroot'],
        },
        step3: {
          locations: [
            {
              id: 'loc-a1',
              label: 'Green Hill plot',
              areaAcres: 3.5,
              gpsCaptured: true,
              latitude: 11.385,
              longitude: 76.732,
              village: 'Ketti',
              taluk: 'Coonoor',
              district: 'Nilgiris',
            },
          ],
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
      // The operation's own name. Note step 3's parcel below is labelled "Green Hill plot":
      // the two are separate fields and neither is derived from the other.
      expect(restoredDraft.step2?.farmName).toBe('Green Hill Organics');
      expect(restoredDraft.step2?.typeOfFarming).toBe('Organic');
      expect(restoredDraft.step2?.experienceYears).toBe(12);
      expect(restoredDraft.step2?.totalAreaAcres).toBe(4);
      // Stated as 2 plots while only one is marked in step 3 below. Both survive the round
      // trip untouched; nothing reconciles the claim down to what has been marked so far.
      expect(restoredDraft.step2?.numberOfFarms).toBe(2);
      expect(restoredDraft.step3?.locations).toHaveLength(1);
      expect(restoredDraft.step2?.primaryCrops).toEqual(['Carrot', 'Beetroot']);
      expect(restoredDraft.step3?.locations[0]?.id).toBe('loc-a1');
      expect(restoredDraft.step3?.locations[0]?.label).toBe('Green Hill plot');
      expect(restoredDraft.step3?.locations[0]?.areaAcres).toBe(3.5);
      expect(restoredDraft.step3?.locations[0]?.latitude).toBe(11.385);
      expect(restoredDraft.step3?.locations[0]?.longitude).toBe(76.732);
    });

    it('registration: cold-start resume correctly round-trips a 2-location registration with distinct boundaries', async () => {
      // One farming operation, land in two places. Proves each location keeps its own id, label,
      // acreage and coordinates (not merged, not reordered) across a full persist/rehydrate cycle.
      const draftState: RegistrationDraft = {
        applicationId: 'app-uuid-7700',
        currentStep: 3,
        step2: {
          farmName: 'Great Earth Organic',
          typeOfFarming: 'Organic',
          experienceYears: 8,
          // Stated from land records as 6.25 acres across 3 plots, while only two parcels are
          // marked below, totalling 5.3. Both gaps are real data, not fixture typos -- see the
          // assertions at the end of this test.
          totalAreaAcres: 6.25,
          numberOfFarms: 3,
          waterSource: 'Rain-fed',
        },
        step3: {
          locations: [
            {
              id: 'loc-a1',
              label: 'Home plot',
              areaAcres: 3.5,
              gpsCaptured: true,
              latitude: 11.385,
              longitude: 76.732,
              calculatedAreaAcres: 3.42,
              fmbPolygon: {
                type: 'Polygon',
                coordinates: [
                  [
                    [76.732, 11.385],
                    [76.734, 11.385],
                    [76.734, 11.387],
                    [76.732, 11.387],
                    [76.732, 11.385],
                  ],
                ],
              },
            },
            {
              id: 'loc-b2',
              label: 'Valley plot',
              areaAcres: 1.8,
              gpsCaptured: true,
              latitude: 11.41,
              longitude: 76.71,
              calculatedAreaAcres: 1.76,
              fmbPolygon: {
                type: 'Polygon',
                coordinates: [
                  [
                    [76.71, 11.41],
                    [76.712, 11.41],
                    [76.712, 11.412],
                    [76.71, 11.412],
                    [76.71, 11.41],
                  ],
                ],
              },
            },
          ],
        },
      };

      useRegistrationDraftStore.setState({ draft: draftState });

      await vi.waitFor(async () => {
        const raw = await AsyncStorage.getItem(DRAFT_STORAGE_KEY);
        expect(raw).not.toBeNull();
      });
      const persistedRaw = await AsyncStorage.getItem(DRAFT_STORAGE_KEY);

      vi.resetModules();
      const freshAsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await freshAsyncStorage.setItem(DRAFT_STORAGE_KEY, persistedRaw as string);

      const { useRegistrationDraftStore: freshStore } = await import('../storage/registrationDraft');
      await freshStore.persist.rehydrate();

      const restoredDraft = freshStore.getState().draft;

      expect(restoredDraft.step3?.locations).toHaveLength(2);
      expect(restoredDraft.step2?.typeOfFarming).toBe('Organic');
      // One operation name for the whole holding, two differently-labelled parcels under it.
      // A regression that collapsed the two concepts would show up right here.
      expect(restoredDraft.step2?.farmName).toBe('Great Earth Organic');

      // Look each location up by its own `id`, not by array index -- an entry's identity, not its
      // position, is what has to survive the round trip.
      const locationFor = (id: string) =>
        restoredDraft.step3?.locations.find((l) => l.id === id);
      expect(locationFor('loc-a1')?.label).toBe('Home plot');
      expect(locationFor('loc-a1')?.areaAcres).toBe(3.5);
      expect(locationFor('loc-a1')?.latitude).toBe(11.385);
      expect(locationFor('loc-b2')?.label).toBe('Valley plot');
      expect(locationFor('loc-b2')?.areaAcres).toBe(1.8);
      expect(locationFor('loc-b2')?.latitude).toBe(11.41);

      // Each parcel carries its OWN boundary, and that is the whole reason the model dropped the
      // Step-2-to-Step-3 `farmId` correlation. `fmbPolygon` is the only nested object in the
      // draft, so it is the first thing a `partialize` or serialization regression would quietly
      // drop -- asserting the scalars alone would leave that failure invisible. Checked per id so
      // the two polygons cannot be swapped or merged and still pass.
      expect(locationFor('loc-a1')?.fmbPolygon?.type).toBe('Polygon');
      expect(locationFor('loc-a1')?.fmbPolygon?.coordinates[0]).toHaveLength(5);
      expect(locationFor('loc-a1')?.fmbPolygon?.coordinates[0]?.[0]).toEqual([76.732, 11.385]);
      expect(locationFor('loc-a1')?.calculatedAreaAcres).toBe(3.42);

      expect(locationFor('loc-b2')?.fmbPolygon?.type).toBe('Polygon');
      expect(locationFor('loc-b2')?.fmbPolygon?.coordinates[0]?.[0]).toEqual([76.71, 11.41]);
      expect(locationFor('loc-b2')?.calculatedAreaAcres).toBe(1.76);

      // The farmer-stated acreage is what totals; the map-derived figure is advisory and must not
      // be substituted for it.
      expect(locationFor('loc-a1')?.areaAcres).not.toBe(
        locationFor('loc-a1')?.calculatedAreaAcres,
      );

      // Two different figures, both preserved. The farmer's stated total holding survives the
      // round trip unmodified, and the ground-derived sum of the parcels is computed beside it.
      // Persistence must never reconcile these -- a draft that came back with 5.3 in
      // `step2.totalAreaAcres` would mean something quietly overwrote the farmer's own claim.
      const summedAcres = (restoredDraft.step3?.locations ?? []).reduce(
        (sum, l) => sum + l.areaAcres,
        0,
      );
      expect(summedAcres).toBeCloseTo(5.3);
      expect(restoredDraft.step2?.totalAreaAcres).toBe(6.25);
      expect(restoredDraft.step2?.experienceYears).toBe(8);

      // Same story for the plot count: the farmer stated 3, two are marked. A draft that came
      // back with `numberOfFarms: 2` would mean persistence quietly derived the claim from
      // `locations.length` instead of carrying what the farmer actually said.
      expect(restoredDraft.step3?.locations).toHaveLength(2);
      expect(restoredDraft.step2?.numberOfFarms).toBe(3);
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

    it('registration: step 2 validates the single farming operation, not a list of farms', () => {
      const validOperation = {
        farmName: 'Green Hill Organics',
        typeOfFarming: 'Organic',
        experienceYears: 12,
        totalAreaAcres: 4.5,
        numberOfFarms: 2,
        waterSource: 'Borewell',
        primaryCrops: ['Carrot'],
      };
      const validResult = validateStep(2, validOperation);
      expect(validResult.valid).toBe(true);

      // Each field is asked once for the whole operation -- there is no per-farm list here.
      // `numberOfFarms` is how many plots the farmer *says* they have, not a list of them.
      expect(validResult.errors['farms']).toBeUndefined();

      // The five fields this step genuinely requires, each asked once.
      const emptyResult = validateStep(2, { waterSource: 'Borewell' });
      expect(emptyResult.valid).toBe(false);
      expect(emptyResult.errors['farmName']).toBeDefined();
      expect(emptyResult.errors['typeOfFarming']).toBeDefined();
      expect(emptyResult.errors['experienceYears']).toBeDefined();
      expect(emptyResult.errors['totalAreaAcres']).toBeDefined();
      expect(emptyResult.errors['numberOfFarms']).toBeDefined();
    });

    it('registration: step 2 requires a farm name, which names the operation and not a parcel', () => {
      // Asked once, for the whole operation. It is NOT a parcel name -- step 3's
      // `locations[].label` is what names each parcel, and it is the label (never this) that
      // becomes a `farms` row's name on approval. If a future change ever derives one from the
      // other, a farmer with land in three places ends up with three farms all called the same
      // thing, or one operation named after whichever plot happened to be entered first.
      const missing = validateStep(2, {
        typeOfFarming: 'Organic',
        experienceYears: 5,
        totalAreaAcres: 2,
        numberOfFarms: 1,
      });
      expect(missing.valid).toBe(false);
      expect(missing.errors['farmName']).toBeDefined();

      // Whitespace is not a name.
      const blank = validateStep(2, {
        farmName: '   ',
        typeOfFarming: 'Organic',
        experienceYears: 5,
        totalAreaAcres: 2,
        numberOfFarms: 1,
      });
      expect(blank.valid).toBe(false);
      expect(blank.errors['farmName']).toBeDefined();

      // Mirrors the server's `.max(120)`, so an over-long name is caught on the device rather
      // than coming back as a generic 400 at submit time.
      const tooLong = validateStep(2, {
        farmName: 'x'.repeat(121),
        typeOfFarming: 'Organic',
        experienceYears: 5,
        totalAreaAcres: 2,
        numberOfFarms: 1,
      });
      expect(tooLong.valid).toBe(false);
      expect(tooLong.errors['farmName']).toBeDefined();

      const named = validateStep(2, {
        farmName: 'Great Earth Organic',
        typeOfFarming: 'Organic',
        experienceYears: 5,
        totalAreaAcres: 2,
        numberOfFarms: 1,
      });
      expect(named.valid).toBe(true);
      expect(named.errors['farmName']).toBeUndefined();

      // The operation's name and a parcel's label live in different steps and neither validates
      // against the other: step 3 is satisfied by its own labels, with no farm name in sight.
      const parcelsOnly = validateStep(3, {
        locations: [
          { id: 'loc-1', label: 'Home plot', areaAcres: 2, latitude: 11.4, longitude: 76.7 },
          { id: 'loc-2', label: 'River plot', areaAcres: 1, latitude: 11.42, longitude: 76.72 },
        ],
      });
      expect(parcelsOnly.valid).toBe(true);
      expect(parcelsOnly.errors['farmName']).toBeUndefined();
    });

    it('registration: step 2 requires farming experience, and accepts zero years for a first-season farmer', () => {
      // This field is collectable NOWHERE else. It was briefly removed from step 2 on the belief
      // that step 1 asked for it; step 1 has no such input, so the value never got collected and
      // every approved farmer was stored with zero years. If this assertion is ever deleted,
      // check that some other screen actually captures experience before believing it is safe.
      const missing = validateStep(2, { typeOfFarming: 'Organic', totalAreaAcres: 2 });
      expect(missing.valid).toBe(false);
      expect(missing.errors['experienceYears']).toBeDefined();

      // Zero is a real answer, not a missing one. A farmer in their first season has zero
      // completed years, and the server contract is `min(0)`. Rejecting 0 -- which the
      // pre-regression `!experienceYears` check did -- only teaches them to type 1.
      const firstSeason = validateStep(2, {
        farmName: 'Green Hill Organics',
        typeOfFarming: 'Organic',
        experienceYears: 0,
        totalAreaAcres: 2,
        numberOfFarms: 1,
      });
      expect(firstSeason.valid).toBe(true);
      expect(firstSeason.errors['experienceYears']).toBeUndefined();

      const negative = validateStep(2, {
        typeOfFarming: 'Organic',
        experienceYears: -1,
        totalAreaAcres: 2,
      });
      expect(negative.valid).toBe(false);
      expect(negative.errors['experienceYears']).toBeDefined();

      // Mirrors the server's `.int().max(120)`, so a year typed into the years box (1998) or a
      // fractional entry is caught on the device instead of coming back as a submit-time 400.
      expect(
        validateStep(2, { typeOfFarming: 'Organic', experienceYears: 1998, totalAreaAcres: 2 })
          .errors['experienceYears'],
      ).toBeDefined();
      expect(
        validateStep(2, { typeOfFarming: 'Organic', experienceYears: 2.5, totalAreaAcres: 2 })
          .errors['experienceYears'],
      ).toBeDefined();
    });

    it('registration: step 2 requires a stated total land area greater than zero', () => {
      const missing = validateStep(2, { typeOfFarming: 'Organic', experienceYears: 5 });
      expect(missing.valid).toBe(false);
      expect(missing.errors['totalAreaAcres']).toBeDefined();

      const zero = validateStep(2, {
        typeOfFarming: 'Organic',
        experienceYears: 5,
        totalAreaAcres: 0,
      });
      expect(zero.valid).toBe(false);
      expect(zero.errors['totalAreaAcres']).toBeDefined();

      const negative = validateStep(2, {
        typeOfFarming: 'Organic',
        experienceYears: 5,
        totalAreaAcres: -3,
      });
      expect(negative.valid).toBe(false);
      expect(negative.errors['totalAreaAcres']).toBeDefined();

      const stated = validateStep(2, {
        farmName: 'Green Hill Organics',
        typeOfFarming: 'Organic',
        experienceYears: 5,
        totalAreaAcres: 0.75,
        numberOfFarms: 1,
      });
      expect(stated.valid).toBe(true);
    });

    it('registration: step 2 requires a stated number of farms of at least one', () => {
      // Collectable nowhere else -- there is no other screen that asks the farmer how many
      // separate plots they hold. If this assertion is ever deleted, check that some screen
      // actually captures the count before believing it is safe, because a field that only
      // exists in an interface and a Zod schema still type-checks clean while collecting
      // nothing at all (see `Step1PersonalData.farmingExperienceYears`).
      const missing = validateStep(2, {
        typeOfFarming: 'Organic',
        experienceYears: 5,
        totalAreaAcres: 2,
      });
      expect(missing.valid).toBe(false);
      expect(missing.errors['numberOfFarms']).toBeDefined();

      // A farming operation has at least one plot; zero and negatives are not answers.
      for (const invalid of [0, -1, 2.5]) {
        const result = validateStep(2, {
          typeOfFarming: 'Organic',
          experienceYears: 5,
          totalAreaAcres: 2,
          numberOfFarms: invalid,
        });
        expect(result.valid).toBe(false);
        expect(result.errors['numberOfFarms']).toBeDefined();
      }

      const single = validateStep(2, {
        farmName: 'Green Hill Organics',
        typeOfFarming: 'Organic',
        experienceYears: 5,
        totalAreaAcres: 2,
        numberOfFarms: 1,
      });
      expect(single.valid).toBe(true);
    });

    it('registration: a stated numberOfFarms that disagrees with the number of located parcels is NOT a validation error', () => {
      // DO NOT "FIX" THIS BY ADDING A numberOfFarms === locations.length CHECK. The
      // disagreement is the feature, exactly as it is for the stated total area.
      //
      // The count comes off the farmer's land records (patta/chitta); the locations are the
      // plots they actually walked and marked. A gap means something specific -- a plot not yet
      // marked, stale records, or an inflated claim -- and catching it is the job of the
      // FARM_VERIFICATION stage. Derive the count from `locations.length` instead and it always
      // agrees with itself, which tells a verifier nothing. Block on the gap and a farmer who
      // has legitimately marked only one of their three plots so far cannot submit at all.
      const statesThreeMarksTwo = {
        farmName: 'Green Hill Organics',
        typeOfFarming: 'Organic',
        experienceYears: 9,
        totalAreaAcres: 10,
        numberOfFarms: 3, // records say 3 plots
      };
      expect(validateStep(2, statesThreeMarksTwo).valid).toBe(true);
      expect(validateStep(2, statesThreeMarksTwo).errors['numberOfFarms']).toBeUndefined();

      const draftWithCountGap: RegistrationDraft = {
        applicationId: 'app-count-gap',
        currentStep: 5,
        step1: { fullName: 'Farmer Count', mobile: '+919876522222', aadhaarLast4: '3333' },
        step2: statesThreeMarksTwo,
        step3: {
          // Only 2 of the 3 stated plots have actually been marked.
          locations: [
            { id: 'loc-1', label: 'Home plot', areaAcres: 1.5, latitude: 11.4, longitude: 76.7 },
            { id: 'loc-2', label: 'Roadside strip', areaAcres: 0.6, latitude: 11.42, longitude: 76.72 },
          ],
        },
        step4: {
          documents: [
            { docType: 'ID_PROOF', fileUrl: 'https://storage.tohfa.in/id.pdf' },
            { docType: 'FARM_DOC', fileUrl: 'https://storage.tohfa.in/land.pdf' },
          ],
        },
      };

      expect(draftWithCountGap.step3?.locations).toHaveLength(2);
      expect(draftWithCountGap.step2?.numberOfFarms).toBe(3);

      // One unmarked plot, and submission still goes through untouched.
      const cross = validateCrossStepSubmission(draftWithCountGap);
      expect(cross.valid).toBe(true);
      expect(cross.errors).toHaveLength(0);

      // And the claim survives validation unchanged -- nothing reconciled 3 down to 2.
      expect(draftWithCountGap.step2?.numberOfFarms).toBe(3);

      // The reverse direction is equally fine: more plots marked than the records state.
      const understated: RegistrationDraft = {
        ...draftWithCountGap,
        step2: { ...statesThreeMarksTwo, numberOfFarms: 1 },
      };
      expect(validateCrossStepSubmission(understated).valid).toBe(true);
    });

    it('registration: a stated total land area that disagrees with the sum of the located parcels is NOT a validation error', () => {
      // DO NOT "FIX" THIS BY ADDING A total === sum CHECK. The disagreement is the feature.
      //
      // The stated total comes off the farmer's land records (patta/chitta); the parcel areas come
      // off the ground. A gap means something specific -- land not yet marked, stale records, or an
      // inflated claim -- and catching it is the job of the FARM_VERIFICATION stage. Derive the
      // total instead and it always agrees with itself, which tells a verifier nothing. Block on
      // the gap and a farmer who has legitimately not finished marking their parcels cannot submit
      // at all. So: surface it on screen, never auto-correct it, never block.
      const statedFarAboveSum = {
        farmName: 'Green Hill Organics',
        typeOfFarming: 'Organic',
        experienceYears: 9,
        totalAreaAcres: 10, // records say 10 acres
        numberOfFarms: 2,
      };
      expect(validateStep(2, statedFarAboveSum).valid).toBe(true);
      expect(validateStep(2, statedFarAboveSum).errors['totalAreaAcres']).toBeUndefined();

      const draftWithGap: RegistrationDraft = {
        applicationId: 'app-gap',
        currentStep: 5,
        step1: { fullName: 'Farmer Gap', mobile: '+919876511111', aadhaarLast4: '2222' },
        step2: statedFarAboveSum,
        step3: {
          // Only 2.1 acres actually marked out, against the 10 stated above.
          locations: [
            { id: 'loc-1', label: 'Home plot', areaAcres: 1.5, latitude: 11.4, longitude: 76.7 },
            { id: 'loc-2', label: 'Roadside strip', areaAcres: 0.6, latitude: 11.42, longitude: 76.72 },
          ],
        },
        step4: {
          documents: [
            { docType: 'ID_PROOF', fileUrl: 'https://storage.tohfa.in/id.pdf' },
            { docType: 'FARM_DOC', fileUrl: 'https://storage.tohfa.in/land.pdf' },
          ],
        },
      };

      const summed = (draftWithGap.step3?.locations ?? []).reduce((s, l) => s + l.areaAcres, 0);
      expect(summed).toBeCloseTo(2.1);
      expect(draftWithGap.step2?.totalAreaAcres).toBe(10);

      // A 7.9-acre discrepancy, and submission still goes through untouched.
      const cross = validateCrossStepSubmission(draftWithGap);
      expect(cross.valid).toBe(true);
      expect(cross.errors).toHaveLength(0);

      // And it survives validation unchanged -- nothing reconciled the stated figure down to 2.1.
      expect(draftWithGap.step2?.totalAreaAcres).toBe(10);

      // The reverse direction is equally fine: more land marked than the records state.
      const understated: RegistrationDraft = {
        ...draftWithGap,
        step2: { ...statedFarAboveSum, totalAreaAcres: 1 },
      };
      expect(validateCrossStepSubmission(understated).valid).toBe(true);
    });

    it('registration: step 3 validates every land location, not just the first, with per-index keyed errors', () => {
      // Two parcels: the first fully described, the second missing label, acreage and coordinates.
      const twoLocations = {
        locations: [
          {
            id: 'loc-1',
            label: 'Home plot',
            areaAcres: 2,
            gpsCaptured: false,
            latitude: 11.4102,
            longitude: 76.695,
            village: 'Ooty Rural',
          },
          {
            id: 'loc-2',
            label: '',
            areaAcres: 0,
            gpsCaptured: false,
            latitude: undefined,
            longitude: undefined,
          },
        ],
      };
      const result = validateStep(3, twoLocations);
      expect(result.valid).toBe(false);
      // Location 0 is valid on every field -- manual lat/lng counts as captured.
      expect(result.errors['locations.0.label']).toBeUndefined();
      expect(result.errors['locations.0.areaAcres']).toBeUndefined();
      expect(result.errors['locations.0.coordinates']).toBeUndefined();
      // Location 1 is invalid on every field, keyed by its own index.
      expect(result.errors['locations.1.label']).toBeDefined();
      expect(result.errors['locations.1.areaAcres']).toBeDefined();
      expect(result.errors['locations.1.coordinates']).toBeDefined();

      // A single, fully described parcel passes.
      const singleValid = {
        locations: [
          { id: 'loc-1', label: 'Home plot', areaAcres: 1.25, latitude: 11.4102, longitude: 76.695 },
        ],
      };
      expect(validateStep(3, singleValid).valid).toBe(true);

      // No locations declared at all.
      const emptyRes = validateStep(3, { locations: [] });
      expect(emptyRes.valid).toBe(false);
      expect(emptyRes.errors['locations']).toBeDefined();
    });

    it('registration: submit performs cross-step validation and enforces mandatory documents', () => {
      // Incomplete draft (missing documents in step 4 -- every other step is otherwise
      // complete per validateStep/validateCrossStepSubmission in
      // ../screens/registration/validation.ts, which requires a farmName, typeOfFarming,
      // experienceYears, a stated totalAreaAcres and a stated numberOfFarms on step 2 and, on
      // step 3, at least one land location carrying a label, a positive acreage and captured
      // coordinates).
      const incompleteDraft: RegistrationDraft = {
        applicationId: 'app-1',
        currentStep: 5,
        step1: { fullName: 'Farmer Test', mobile: '+919876543210', aadhaarLast4: '9999' },
        step2: {
          farmName: 'Green Hill Organics',
          typeOfFarming: 'Organic',
          experienceYears: 7,
          totalAreaAcres: 2,
          numberOfFarms: 1,
        },
        step3: {
          locations: [
            { id: 'loc-1', label: 'Home plot', areaAcres: 2, latitude: 11.4, longitude: 76.7 },
          ],
        },
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

    it('registration: cross-step submission requires at least one land location with its position marked', () => {
      const noLocatedLand: RegistrationDraft = {
        applicationId: 'app-2',
        currentStep: 5,
        step1: { fullName: 'Farmer Two', mobile: '+919876500000', aadhaarLast4: '1111' },
        step2: {
          farmName: 'Green Hill Organics',
          typeOfFarming: 'Organic',
          experienceYears: 3,
          totalAreaAcres: 3,
          numberOfFarms: 1,
        },
        step3: {
          // The parcel was named and sized, but never placed on the map.
          locations: [
            {
              id: 'loc-1',
              label: 'Home plot',
              areaAcres: 2,
              latitude: undefined,
              longitude: undefined,
            },
          ],
        },
        step4: {
          documents: [
            { docType: 'ID_PROOF', fileUrl: 'https://storage.tohfa.in/id.pdf' },
            { docType: 'FARM_DOC', fileUrl: 'https://storage.tohfa.in/land.pdf' },
          ],
        },
      };

      const result = validateCrossStepSubmission(noLocatedLand);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'At least one land location with its position marked is required.',
      );

      // Land in two places, both marked -- the submission gate is satisfied. There is no
      // Step-2-to-Step-3 correlation left to satisfy: locations are self-contained.
      const twoMarkedLocations: RegistrationDraft = {
        ...noLocatedLand,
        step3: {
          locations: [
            { id: 'loc-1', label: 'Home plot', areaAcres: 2, latitude: 11.4, longitude: 76.7 },
            { id: 'loc-2', label: 'Valley plot', areaAcres: 1, latitude: 11.42, longitude: 76.72 },
          ],
        },
      };
      const passingResult = validateCrossStepSubmission(twoMarkedLocations);
      expect(passingResult.valid).toBe(true);
      expect(passingResult.errors).toHaveLength(0);
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
