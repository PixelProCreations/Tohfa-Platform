import { t } from '../../../../i18n/farmer';
import type {
  RegistrationDraft,
  Step1PersonalData,
  Step2FarmData,
  Step3LocationData,
  Step4DocumentsData,
} from '../../storage/registrationDraft';

/**
 * Per-step and cross-step validation for the farmer registration flow.
 *
 * Every message here is rendered to a farmer -- as a field error under an input, or as the banner
 * on the review screen -- so each one is a catalogue key rather than an English literal (root
 * `CLAUDE.md` 2.7, `apps/mobile/CLAUDE.md` "Design system, money, i18n content"). The Nilgiris
 * farmers this flow exists for are the likeliest users of the Tamil locale, and a validation
 * message is the worst place to fall back to English: it is the only thing standing between them
 * and a form they cannot get past. `t()` falls back to the English string for any key Tamil has
 * not caught up on, so a screen never renders a bare key.
 */

export interface StepValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export interface CrossStepValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateStep(step: number, data: unknown): StepValidationResult {
  const errors: Record<string, string> = {};

  if (step === 1) {
    const s1 = (data ?? {}) as Step1PersonalData;
    if (!s1.fullName || s1.fullName.trim().length < 2) {
      errors['fullName'] = t('farmer.registration.validation.fullName');
    }
    if (!s1.mobile || !/^\+[1-9][0-9]{7,14}$/.test(s1.mobile.trim())) {
      errors['mobile'] = t('farmer.registration.validation.mobile');
    }
    const aadhaarInput = (s1.aadhaarNumber || s1.aadhaarLast4 || '').replace(/\s+/g, '').trim();
    if (!aadhaarInput) {
      errors['aadhaarLast4'] = t('farmer.registration.validation.aadhaarRequired');
    } else if (!/^\d{12}$/.test(aadhaarInput)) {
      // Accept last-4 only when restoring a draft (aadhaarNumber not present)
      if (!s1.aadhaarNumber && aadhaarInput.length === 4 && /^\d{4}$/.test(aadhaarInput)) {
        // draft restored — last4 only, skip full check
      } else {
        errors['aadhaarLast4'] = t('farmer.registration.validation.aadhaarInvalid');
      }
    }
    if (s1.addressLine1 !== undefined && s1.addressLine1.trim().length === 0) {
      errors['addressLine1'] = t('farmer.registration.validation.addressLine1');
    }
    if (s1.village !== undefined && s1.village.trim().length === 0) {
      errors['village'] = t('farmer.registration.validation.village');
    }
    if (s1.taluk !== undefined && s1.taluk.trim().length === 0) {
      errors['taluk'] = t('farmer.registration.validation.taluk');
    }
    if (s1.district !== undefined && s1.district.trim().length === 0) {
      errors['district'] = t('farmer.registration.validation.district');
    }
    // Real Indian PIN codes never start with 0 -- matches the server's
    // `farmers.pincode` CHECK constraint (`^[1-9][0-9]{5}$`,
    // db/migrations/0003_farmers_and_farms.sql) so a farmer is told at data-entry
    // time rather than approval silently dropping an invalid value later.
    if (s1.pincode !== undefined && s1.pincode.trim().length > 0 && !/^[1-9][0-9]{5}$/.test(s1.pincode.trim())) {
      errors['pincode'] = t('farmer.registration.validation.pincode');
    }
  } else if (step === 2) {
    // One farming operation per farmer, so this step is a single object, not a list -- each field
    // below is asked exactly once, for the whole operation.
    const s2 = (data ?? {}) as Step2FarmData;

    // The name of the whole operation, not of a parcel -- Step 3's `locations[].label` names
    // those, and is validated separately in the step-3 branch below. Bounded at 120 to mirror the
    // server's `z.string().min(1).max(120)` so an over-long name is caught here rather than
    // coming back as a generic 400 at submit time.
    if (!s2.farmName || s2.farmName.trim().length === 0) {
      errors['farmName'] = t('farmer.registration.validation.farmNameRequired');
    } else if (s2.farmName.trim().length > 120) {
      errors['farmName'] = t('farmer.registration.validation.farmNameTooLong');
    }

    if (!s2.typeOfFarming || s2.typeOfFarming.trim().length === 0) {
      errors['typeOfFarming'] = t('farmer.registration.validation.typeOfFarmingRequired');
    }

    // Zero is a VALID answer, so presence is checked as `undefined`, not falsiness. The
    // pre-regression rule was `!experienceYears || experienceYears <= 0` ("must be greater than
    // zero"), which is not followed here: it conflicts with the server contract
    // (`z.number().int().min(0).max(120)`) and with reality, since a farmer in their first season
    // has zero completed years and rejecting that only teaches them to type 1. The falsiness idiom
    // is also what made 0 indistinguishable from "not answered" in the first place.
    if (s2.experienceYears === undefined) {
      errors['experienceYears'] = t('farmer.registration.validation.experienceRequired');
    } else if (!Number.isFinite(s2.experienceYears) || s2.experienceYears < 0) {
      errors['experienceYears'] = t('farmer.registration.validation.experienceNegative');
    } else if (!Number.isInteger(s2.experienceYears) || s2.experienceYears > 120) {
      // Mirrors the server's `.int().max(120)` so a typo (a year like 1998, or 2.5) is caught here
      // rather than coming back as a generic 400 at submit time.
      errors['experienceYears'] = t('farmer.registration.validation.experienceWholeNumber');
    }

    // The farmer's STATED total holding, from their land records -- not the sum of Step 3's
    // parcels. Deliberately NOT cross-checked against that sum: the two come from different
    // sources (paper vs ground) and a difference is the signal FARM_VERIFICATION looks for. Mid
    // registration a farmer legitimately has parcels still unmarked, so a "total must equal sum"
    // check here would trap them. Show the difference on screen; never block on it, and never
    // overwrite what they stated. See `Step2FarmData`'s docblock.
    if (s2.totalAreaAcres === undefined) {
      errors['totalAreaAcres'] = t('farmer.registration.validation.totalAreaRequired');
    } else if (!Number.isFinite(s2.totalAreaAcres) || s2.totalAreaAcres <= 0) {
      errors['totalAreaAcres'] = t('farmer.registration.validation.totalAreaPositive');
    }

    // The farmer's STATED count of separate plots, from the same land records as the stated total
    // area. Like that total, it is deliberately NOT checked against Step 3 -- `locations.length` is
    // what they actually marked, and the two are allowed to disagree for exactly the same reason.
    // A farmer who states 3 plots and has so far marked 1 must still be able to move on. Show the
    // difference; never reconcile it, never block on it. See `Step2FarmData`'s docblock.
    if (s2.numberOfFarms === undefined) {
      errors['numberOfFarms'] = t('farmer.registration.validation.numberOfFarmsRequired');
    } else if (
      !Number.isFinite(s2.numberOfFarms) ||
      !Number.isInteger(s2.numberOfFarms) ||
      s2.numberOfFarms < 1
    ) {
      // Mirrors the server's `.int().positive()`: a farming operation has at least one plot, and
      // half a plot is not a thing. Caught here rather than as a generic 400 at submit time.
      errors['numberOfFarms'] = t('farmer.registration.validation.numberOfFarmsWholeNumber');
    }
  } else if (step === 3) {
    // What repeats is a land LOCATION: a labelled parcel with its own acreage and its own
    // boundary. Each entry is self-contained -- there is nothing here to correlate back to
    // Step 2.
    const s3 = (data ?? {}) as Step3LocationData;
    if (!s3.locations || s3.locations.length === 0) {
      errors['locations'] = t('farmer.registration.validation.locationsRequired');
    } else {
      s3.locations.forEach((location, index) => {
        if (!location?.label || location.label.trim().length === 0) {
          errors[`locations.${index}.label`] = t(
            'farmer.registration.validation.locationLabelRequired',
          );
        }
        if (!location?.areaAcres || location.areaAcres <= 0) {
          errors[`locations.${index}.areaAcres`] = t(
            'farmer.registration.validation.locationAreaPositive',
          );
        }
        if (location?.latitude === undefined || location?.longitude === undefined) {
          errors[`locations.${index}.coordinates`] = t(
            'farmer.registration.validation.locationCoordinatesRequired',
          );
        }
      });
    }
  } else if (step === 4) {
    const s4 = (data ?? {}) as Step4DocumentsData;
    if (!s4.documents || s4.documents.length === 0) {
      errors['documents'] = t('farmer.registration.validation.documentsRequired');
    } else {
      // Defensive, not reachable through the Step4Documents screen itself: its own picker
      // gates the upload action, so a fresh ID_PROOF/FARM_DOC entry always carries a
      // `docSubType`. This exists for any other caller of `validateStep(4, ...)` (or a draft
      // restored from before `docSubType` existed) so a document with no sub-type is still
      // caught here rather than silently accepted. CERTIFICATE/OTHER never carry one -- see
      // `DocumentItemData`'s docblock -- so they are not checked.
      s4.documents.forEach((doc, index) => {
        if ((doc.docType === 'ID_PROOF' || doc.docType === 'FARM_DOC') && !doc.docSubType) {
          errors[`documents.${index}.docSubType`] = t(
            'farmer.registration.validation.documentSubTypeRequired',
          );
        }
      });
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateCrossStepSubmission(draft: RegistrationDraft): CrossStepValidationResult {
  const errors: string[] = [];

  const s1Check = validateStep(1, draft.step1);
  if (!s1Check.valid) {
    errors.push(t('farmer.registration.validation.step1Incomplete'));
  }

  const s2Check = validateStep(2, draft.step2);
  if (!s2Check.valid) {
    errors.push(t('farmer.registration.validation.step2Incomplete'));
  }

  const s3Check = validateStep(3, draft.step3);
  if (!s3Check.valid) {
    errors.push(t('farmer.registration.validation.step3Incomplete'));
  }

  // The old check matched every Step 2 farm to a Step 3 boundary by `farmId`. That correlation
  // no longer exists: there is one farming operation, and its land locations are self-contained
  // in Step 3, so nothing has to be matched across the two steps. What survives as a genuine
  // submission gate is that the farmer declared at least one land location and marked it -- an
  // application with no located land cannot be assessed. This overlaps the per-step check above
  // by design: that one tells the farmer *which step* to return to, this one names the missing
  // thing.
  //
  // Note what is NOT gated here, and must never be: neither `step2.totalAreaAcres` nor
  // `step2.numberOfFarms` is checked against the Step 3 parcels. Those are the farmer's own
  // stated figures off their land records, the parcels are the ground, and the gap between them
  // is the signal FARM_VERIFICATION exists to read. Blocking submission on it would trap a
  // farmer who has legitimately not finished marking their plots.
  const locations = draft.step3?.locations ?? [];
  const hasLocatedLand = locations.some(
    (location) => location.latitude !== undefined && location.longitude !== undefined,
  );
  if (!hasLocatedLand) {
    errors.push(t('farmer.registration.validation.locatedLandRequired'));
  }

  const documents = draft.step4?.documents ?? [];
  const hasIdProof = documents.some((d) => d.docType === 'ID_PROOF');
  const hasFarmDoc = documents.some((d) => d.docType === 'FARM_DOC');

  if (!hasIdProof || !hasFarmDoc) {
    errors.push(t('farmer.registration.validation.mandatoryDocuments'));
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
