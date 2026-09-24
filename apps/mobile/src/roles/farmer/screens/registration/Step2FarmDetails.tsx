import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { colors, spacing, typography, useTheme } from '../../theme';
import { t } from '../../../../i18n/farmer';
import { validateStep } from './validation';
import { AREA_COMPARISON_EPSILON_ACRES, roundAcresForDisplay } from './acreage';
import { useRegistrationDraftStore } from '../../storage/registrationDraft';
import type { FarmLocationData, Step2FarmData } from '../../storage/registrationDraft';

interface Step2Props {
  initialData?: Step2FarmData | undefined;
  onSave: (data: Step2FarmData) => void;
  onBack: () => void;
}

/**
 * The GROUND-derived figure: the sum of the parcels the farmer has marked in Step 3
 * (`FarmLocationData.areaAcres`). It is shown beside the farmer's own stated total, never as the
 * total itself -- see `Step2FarmData`'s docblock for why the two are kept apart and allowed to
 * disagree. `null` means no parcel has been added yet, which on the first pass through the
 * stepper is the normal state and is rendered as nothing at all, not as "0 acres".
 */
function deriveTotalAreaAcres(locations: FarmLocationData[] | undefined): number | null {
  if (!locations || locations.length === 0) return null;
  const total = locations.reduce((sum, location) => sum + (location.areaAcres || 0), 0);
  return total > 0 ? total : null;
}

/**
 * "2.5 acres" in the active locale. The rounding lives in `./acreage` so this screen and the
 * Step 5 review, which put the same comparison in front of the same farmer, cannot drift apart.
 */
function formatAcres(areaAcres: number): string {
  return t('farmer.registration.step2.acresValue', { acres: roundAcresForDisplay(areaAcres) });
}

/**
 * The GROUND-derived plot COUNT: how many parcels the farmer has actually marked in Step 3. It is
 * the counterpart to their stated `numberOfFarms` in exactly the way the parcel-area sum is the
 * counterpart to their stated `totalAreaAcres`, and it is shown beside that claim, never as it.
 * `null` -- not 0 -- while nothing has been marked, because on the first pass through the stepper
 * that is the normal state and must render as nothing at all.
 */
function deriveMarkedFarmCount(locations: FarmLocationData[] | undefined): number | null {
  if (!locations || locations.length === 0) return null;
  return locations.length;
}

/**
 * "1 farm" / "3 farms" in the active locale. The i18n runtime is deliberately plural-free (see
 * `src/i18n/runtime.ts`: no dependency is carried for `{{name}}` interpolation on low-end
 * Android), so the singular and plural forms are two catalogue keys rather than a CLDR rule.
 */
function formatFarms(count: number): string {
  return count === 1
    ? t('farmer.registration.step2.farmCountOne')
    : t('farmer.registration.step2.farmCountOther', { count });
}

/**
 * An empty box means "not answered", which is not the same as zero -- and `Number('')` is 0, so
 * the empty case has to be caught before parsing or a farmer who skipped the field would silently
 * submit a 0. `undefined` is what `validateStep(2, ...)` reads as "required".
 */
function parseOptionalNumber(text: string): number | undefined {
  const trimmed = text.trim();
  if (trimmed.length === 0) return undefined;
  return Number(trimmed);
}

/**
 * The farming types, as {stored value, label key} pairs.
 *
 * `value` is what gets persisted and sent to the server as `typeOfFarming`; only `labelKey` is
 * translated. Rendering the translated label as the stored value would mean a farmer who switched
 * the app to Tamil submitted a different `typeOfFarming` string than one who did not, and the
 * server would have two spellings of the same category.
 */
const FARMING_TYPES = [
  { value: 'Natural', labelKey: 'farmer.registration.step2.farmingTypeNatural' },
  { value: 'Organic', labelKey: 'farmer.registration.step2.farmingTypeOrganic' },
  { value: 'Bio-dynamic', labelKey: 'farmer.registration.step2.farmingTypeBiodynamic' },
  { value: 'Others', labelKey: 'farmer.registration.step2.farmingTypeOthers' },
] as const;

/**
 * Step 2 describes the farmer's ONE farming operation. A farmer does not have N farms; they have
 * one operation whose land sits in several physical places, and those places are Step 3's
 * `FarmLocationData[]`. So every field here is asked exactly once, for the whole operation, and
 * nothing repeats.
 *
 * All three numeric fields are held as text while the farmer types, not as numbers: a half-typed
 * "2." or a cleared field has no numeric value, and `Number('')` is 0 -- which would make "not
 * answered yet" indistinguishable from a real zero. They are parsed once, on Continue.
 */
export const Step2FarmDetails: React.FC<Step2Props> = ({ initialData, onSave, onBack }) => {
  const theme = useTheme();
  const { colors } = theme;

  const [farmName, setFarmName] = useState<string>(initialData?.farmName ?? '');
  const [typeOfFarming, setTypeOfFarming] = useState<string>(
    initialData?.typeOfFarming ?? 'Organic',
  );
  const [experienceText, setExperienceText] = useState<string>(
    initialData?.experienceYears !== undefined ? String(initialData.experienceYears) : '',
  );
  const [totalAreaText, setTotalAreaText] = useState<string>(
    initialData?.totalAreaAcres !== undefined ? String(initialData.totalAreaAcres) : '',
  );
  const [numberOfFarmsText, setNumberOfFarmsText] = useState<string>(
    initialData?.numberOfFarms !== undefined ? String(initialData.numberOfFarms) : '',
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // Read-only view of the parcels Step 3 owns, so the figure shown alongside the farmer's stated
  // total always reflects what they have actually marked rather than a copy taken when this
  // screen last saved.
  const locations = useRegistrationDraftStore((s) => s.draft.step3?.locations);
  const markedAreaAcres = deriveTotalAreaAcres(locations);
  const markedFarmCount = deriveMarkedFarmCount(locations);

  const statedAreaAcres = parseOptionalNumber(totalAreaText);
  const statedFarmCount = parseOptionalNumber(numberOfFarmsText);

  // Informational only. It is shown when -- and only when -- the farmer has both stated a total
  // and marked at least one parcel, so a farmer on their first pass (no parcels yet) is never
  // told their figure disagrees with land they simply have not marked. It never blocks Continue
  // and never rewrites what they typed; the gap is the signal FARM_VERIFICATION looks for.
  const mismatchAgainstAcres =
    markedAreaAcres !== null &&
    statedAreaAcres !== undefined &&
    Number.isFinite(statedAreaAcres) &&
    Math.abs(statedAreaAcres - markedAreaAcres) > AREA_COMPARISON_EPSILON_ACRES
      ? markedAreaAcres
      : null;

  // The same comparison, one step up: how many plots the farmer says they have against how many
  // they have actually marked. Shown only once at least one parcel exists, for the same reason --
  // a farmer who has not reached Step 3 yet has not contradicted anything. Both sides are whole
  // plots, so unlike the acreage there is no float noise to absorb and no epsilon applies.
  const mismatchAgainstFarmCount =
    markedFarmCount !== null &&
    statedFarmCount !== undefined &&
    Number.isFinite(statedFarmCount) &&
    statedFarmCount !== markedFarmCount
      ? markedFarmCount
      : null;

  const farmNameError = fieldErrors['farmName'];
  const typeError = fieldErrors['typeOfFarming'];
  const experienceError = fieldErrors['experienceYears'];
  const totalAreaError = fieldErrors['totalAreaAcres'];
  const numberOfFarmsError = fieldErrors['numberOfFarms'];

  function handleContinue() {
    const payload: Step2FarmData = {
      farmName: farmName.trim(),
      typeOfFarming: typeOfFarming.trim(),
      experienceYears: parseOptionalNumber(experienceText),
      totalAreaAcres: parseOptionalNumber(totalAreaText),
      numberOfFarms: parseOptionalNumber(numberOfFarmsText),
      // Not collected by this screen; carried through so re-saving Step 2 does not wipe them.
      ...(initialData?.waterSource !== undefined ? { waterSource: initialData.waterSource } : {}),
      ...(initialData?.primaryCrops !== undefined
        ? { primaryCrops: initialData.primaryCrops }
        : {}),
    };

    const validation = validateStep(2, payload);
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      return;
    }

    setFieldErrors({});
    onSave(payload);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bgLight }]}>
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Farm Name — the whole OPERATION's name, asked once. Not a parcel name: Step 3's
            per-location `label` names those. `validateStep(2, ...)` has required `farmName` since
            the contract landed, so without this input Continue could never pass and the farmer was
            stuck on this step with no visible reason. */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.textBody }]}>
            {t('farmer.registration.step2.farmNameLabel')}{' '}
            <Text style={{ color: colors.requiredRed }}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: colors.borderLight,
                color: colors.textDark,
                backgroundColor: colors.white,
              },
              farmNameError ? styles.inputError : null,
            ]}
            value={farmName}
            onChangeText={(text) => {
              setFarmName(text);
              clearFieldError('farmName');
            }}
            placeholder={t('farmer.registration.step2.farmNamePlaceholder')}
            placeholderTextColor={colors.textPlaceholder}
          />
          {farmNameError ? <Text style={styles.fieldErrorText}>{farmNameError}</Text> : null}
        </View>

        {/* Type of Farming */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.textBody, marginBottom: spacing.sm }]}>
            {t('farmer.registration.step2.typeOfFarmingLabel')}{' '}
            <Text style={{ color: colors.requiredRed }}>*</Text>
          </Text>
          <View style={styles.gridContainer}>
            {FARMING_TYPES.map((farmingType) => {
              const isSelected = typeOfFarming === farmingType.value;
              return (
                <TouchableOpacity
                  key={farmingType.value}
                  activeOpacity={0.8}
                  style={[
                    styles.gridItem,
                    {
                      backgroundColor: isSelected ? colors.brandGreenLight : colors.white,
                      borderColor: isSelected ? colors.brandGreen : colors.borderLight,
                      borderWidth: isSelected ? 2 : 1.5,
                    },
                    typeError ? styles.inputError : null,
                  ]}
                  onPress={() => {
                    // The stored value, never the translated label — see FARMING_TYPES.
                    setTypeOfFarming(farmingType.value);
                    // Only this field's error: the step now has five, and blanking the whole map
                    // here would silently drop the experience, area and plot-count messages too.
                    clearFieldError('typeOfFarming');
                  }}
                >
                  <Text
                    style={[
                      styles.gridItemText,
                      {
                        color: isSelected ? colors.brandGreen : colors.textBody,
                        fontWeight: isSelected ? '700' : '600',
                      },
                    ]}
                  >
                    {t(farmingType.labelKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {typeError ? <Text style={styles.fieldErrorText}>{typeError}</Text> : null}
        </View>

        {/* Years of Experience — the ONLY place the app collects this. Step 1 has no input for
            it despite `Step1PersonalData.farmingExperienceYears` existing, so without this field
            every approved farmer lands on farming_experience_years = 0 permanently. */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.textBody }]}>
            {t('farmer.registration.step2.experienceLabel')}{' '}
            <Text style={{ color: colors.requiredRed }}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: colors.borderLight,
                color: colors.textDark,
                backgroundColor: colors.white,
              },
              experienceError ? styles.inputError : null,
            ]}
            value={experienceText}
            onChangeText={(text) => {
              // Whole years only, matching the server's `.int()` — strip anything the numeric
              // keypad or a paste could still introduce rather than failing at submit time.
              setExperienceText(text.replace(/[^0-9]/g, ''));
              clearFieldError('experienceYears');
            }}
            keyboardType="number-pad"
            placeholder={t('farmer.registration.step2.experiencePlaceholder')}
            placeholderTextColor={colors.textPlaceholder}
          />
          {experienceError ? <Text style={styles.fieldErrorText}>{experienceError}</Text> : null}
        </View>

        {/* Total Land Area — the farmer's OWN stated holding, typically off their land records.
            The sum of the parcels marked in Step 3 sits beside it as context, never as the value:
            the two come from different sources and are meant to be comparable, not identical. */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: colors.textBody }]}>
              {t('farmer.registration.step2.areaLabel')}{' '}
              <Text style={{ color: colors.requiredRed }}>*</Text>
            </Text>
            {markedAreaAcres !== null ? (
              <Text style={[styles.labelAside, { color: colors.textSubtle }]}>
                {t('farmer.registration.step2.markedSoFar', {
                  value: formatAcres(markedAreaAcres),
                })}
              </Text>
            ) : null}
          </View>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: colors.borderLight,
                color: colors.textDark,
                backgroundColor: colors.white,
              },
              totalAreaError ? styles.inputError : null,
            ]}
            value={totalAreaText}
            onChangeText={(text) => {
              setTotalAreaText(text.replace(/[^0-9.]/g, ''));
              clearFieldError('totalAreaAcres');
            }}
            keyboardType="decimal-pad"
            placeholder={t('farmer.registration.step2.areaPlaceholder')}
            placeholderTextColor={colors.textPlaceholder}
          />
          {totalAreaError ? <Text style={styles.fieldErrorText}>{totalAreaError}</Text> : null}
          {/* Deliberately styled as a neutral note, not an error: a farmer mid-registration
              legitimately has land left to mark, so this must read as information and must not
              stop them continuing. */}
          {mismatchAgainstAcres !== null ? (
            <Text style={[styles.helperText, { color: colors.textSubtle }]}>
              {t('farmer.registration.step2.areaMismatchNote', {
                value: formatAcres(mismatchAgainstAcres),
              })}
            </Text>
          ) : null}
        </View>

        {/* Number of Separate Farms — the farmer's OWN stated count of separate plots, off the
            same land records as the total area. It is a claim, never `locations.length`: approval
            still creates one `farms` row per Step 3 location, so nothing here decides how many
            farms exist. The number marked so far sits beside it as context only. */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: colors.textBody }]}>
              {t('farmer.registration.step2.numberOfFarmsLabel')}{' '}
              <Text style={{ color: colors.requiredRed }}>*</Text>
            </Text>
            {markedFarmCount !== null ? (
              <Text style={[styles.labelAside, { color: colors.textSubtle }]}>
                {t('farmer.registration.step2.markedSoFar', {
                  value: formatFarms(markedFarmCount),
                })}
              </Text>
            ) : null}
          </View>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: colors.borderLight,
                color: colors.textDark,
                backgroundColor: colors.white,
              },
              numberOfFarmsError ? styles.inputError : null,
            ]}
            value={numberOfFarmsText}
            onChangeText={(text) => {
              // Whole plots only, matching the server's `.int().positive()` — half a plot is not
              // a thing, so strip anything a paste could still introduce.
              setNumberOfFarmsText(text.replace(/[^0-9]/g, ''));
              clearFieldError('numberOfFarms');
            }}
            keyboardType="number-pad"
            placeholder={t('farmer.registration.step2.numberOfFarmsPlaceholder')}
            placeholderTextColor={colors.textPlaceholder}
          />
          {numberOfFarmsError ? (
            <Text style={styles.fieldErrorText}>{numberOfFarmsError}</Text>
          ) : null}
          {/* Neutral note, not an error, and not a reason to stop: a farmer part-way through
              marking their plots is in a normal state, and the gap is precisely what
              FARM_VERIFICATION is meant to look at. */}
          {mismatchAgainstFarmCount !== null ? (
            <Text style={[styles.helperText, { color: colors.textSubtle }]}>
              {t('farmer.registration.step2.farmCountMismatchNote', {
                value: formatFarms(mismatchAgainstFarmCount),
              })}
            </Text>
          ) : null}
        </View>

        <Text style={[styles.helperText, { color: colors.textSubtle }]}>
          {t('farmer.registration.step2.numberOfFarmsHelper')}
        </Text>
      </ScrollView>

      {/* Sticky Bottom Footer */}
      <View
        style={[
          styles.footer,
          {
            borderTopColor: colors.borderDivider,
            backgroundColor: colors.white,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          style={[
            styles.footerBtn,
            styles.backButton,
            { borderColor: colors.brandGreen, backgroundColor: colors.white },
          ]}
          onPress={onBack}
        >
          <Text style={[styles.footerBtnText, { color: colors.brandGreen }]}>
            {t('farmer.registration.back')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={[
            styles.footerBtn,
            styles.nextButton,
            { backgroundColor: colors.brandGreen },
          ]}
          onPress={handleContinue}
        >
          <Text style={[styles.footerBtnText, { color: colors.white }]}>
            {t('farmer.registration.step2.nextButton')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

/**
 * The gap between a field's label and the control under it. The approved registration screens use
 * 6dp here, which is between `spacing.xs` (4) and `spacing.sm` (8) and so has no step of its own
 * in `@tohfa/design-tokens`; snapping it to either would shift every field on the screen. It is
 * named once and shared by the label and the aside beside it so the two cannot drift onto
 * different baselines, and is the one raw spacing value this screen still defines.
 */
const LABEL_BOTTOM_GAP = 6;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: LABEL_BOTTOM_GAP,
  },
  // Puts the ground-derived parcel sum on the same line as the label, so it reads as context for
  // the figure below rather than as a second value competing with it.
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  labelAside: {
    fontSize: typography.caption,
    marginBottom: LABEL_BOTTOM_GAP,
  },
  input: {
    width: '100%',
    height: 46,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridItem: {
    width: '48%',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridItemText: {
    fontSize: 14,
  },
  helperText: {
    fontSize: 11,
    marginTop: 5,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 12,
  },
  footerBtn: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    borderWidth: 1.5,
  },
  nextButton: {
    borderWidth: 0,
  },
  footerBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  inputError: {
    borderColor: colors.requiredRed,
    borderWidth: 1.5,
  },
  fieldErrorText: {
    color: colors.requiredRed,
    fontSize: 12,
    marginTop: 4,
  },
});
