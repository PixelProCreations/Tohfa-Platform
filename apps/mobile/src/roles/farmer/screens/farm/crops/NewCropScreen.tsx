import React, { useCallback, useEffect, useMemo } from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { ErrorState, Skeleton, ScreenStatusBar, appAlert } from '@tohfa/mobile-ui';
import { t } from '../../../../../i18n/farmer';
import { ApiError, extractFieldErrors, formatErrorMessage } from '../../../../../shell/api/client';
import { parseMoney, toPaise } from '@tohfa/shared-types';
import { authPalette as P } from '../../../theme';
import { listDiaryPlots, type DiaryPlot } from '../../../api/farmDiary';
import { createFarmCrop, listCropMaster, type CreateFarmCropBody } from '../../../api/crops';
import { toCropItem, type CropItem } from './cropItems';
import { BasicStep } from './newCrop/BasicStep';
import { CalendarModal } from './newCrop/CalendarModal';
import { GRADE_TO_API, parseDisplayDate, toIsoDate } from './newCrop/constants';
import { DatesGradeStep } from './newCrop/DatesGradeStep';
import { ArrowBackIcon, ArrowRightIcon, CheckmarkIcon } from './newCrop/icons';
import { nt } from './newCrop/i18n';
import { PickerModals } from './newCrop/PickerModals';
import { ICON_SIZE, SKELETON_HEIGHT, SKELETON_RADIUS, styles } from './newCrop/styles';
import { useNewCropForm } from './newCrop/useNewCropForm';
import { useFieldValidation } from '../../../utils/validation';
import {
  NEW_CROP_FIELD_ORDER,
  NEW_CROP_RULES,
  NEW_CROP_STEP_ONE_FIELDS,
  newCropFieldValues,
} from './newCrop/validation';

export interface NewCropScreenProps {
  onBack?: () => void;
  onCancel?: () => void;
  onSaveCrop?: (crop: CropItem) => void;
}

export function NewCropScreen({
  onBack,
  onCancel,
  onSaveCrop,
}: NewCropScreenProps): React.JSX.Element {
  const form = useNewCropForm();
  const { state, set } = form;
  const { step } = state;
  const fieldValues = useMemo(() => newCropFieldValues(state), [state]);
  const validation = useFieldValidation({ values: fieldValues, rules: NEW_CROP_RULES, order: NEW_CROP_FIELD_ORDER });

  const { set: setForm, optionsLoaded } = form;
  const loadOptions = useCallback(async () => {
    setForm({ loadingOptions: true, optionsError: null });
    try {
      const [fetchedPlots, fetchedCrops] = await Promise.all([listDiaryPlots(), listCropMaster()]);
      optionsLoaded(fetchedPlots, fetchedCrops);
    } catch (err: unknown) {
      setForm({ optionsError: err });
    } finally {
      setForm({ loadingOptions: false });
    }
  }, [setForm, optionsLoaded]);

  useEffect(() => {
    void loadOptions();
    // Deliberately mount-only (loadOptions is stable); the ErrorState retry
    // button below calls loadOptions() again directly.
  }, []);

  const handleNextStep = () => {
    if (!state.cropName.trim() || !state.selectedCropMasterId) {
      appAlert(nt('alert.requiredTitle'), nt('alert.selectCrop'), undefined, { tone: 'warning' });
      return;
    }
    if (!state.selectedPlotId) {
      appAlert(nt('alert.requiredTitle'), nt('alert.selectZone'), undefined, { tone: 'warning' });
      return;
    }
    // Step-one text fields (seed variety / company, quantity, cost) must be valid before moving on.
    const { valid, firstInvalid } = validation.validateAll();
    if (!valid && firstInvalid !== null && NEW_CROP_STEP_ONE_FIELDS.includes(firstInvalid)) return;
    set({ step: 2 });
  };

  const handleSave = async () => {
    if (state.isSubmitting) return;
    set({ submitError: '', fieldErrors: {} });

    const { valid, firstInvalid } = validation.validateAll();
    if (!valid) {
      // Send the farmer to the step that holds the first invalid field.
      if (firstInvalid !== null && NEW_CROP_STEP_ONE_FIELDS.includes(firstInvalid)) set({ step: 1 });
      return;
    }

    const { selectedPlotId, selectedCropMasterId } = state;
    if (!selectedPlotId || !selectedCropMasterId) {
      set({ submitError: t('farmer.crops.newCrop.missingSelectionError') });
      return;
    }

    // Cost (Rs.) -> integer paise. Routed through parseMoney/toPaise, never a
    // raw `* 100` float multiply, exactly as NewFarmDiaryEntryStep3Screen's
    // wage-rate handling does (root CLAUDE.md §2.2).
    let seedCostPaise: number | undefined;
    const trimmedCost = state.costRs.trim();
    if (trimmedCost.length > 0) {
      try {
        seedCostPaise = toPaise(parseMoney(trimmedCost));
      } catch {
        set({ fieldErrors: { costRs: t('farmer.crops.newCrop.costInvalid') } });
        return;
      }
    }

    const trimmedQuantity = state.quantityUsed.trim().replace(/,/g, '');
    let seedQuantity: number | undefined;
    if (trimmedQuantity.length > 0) {
      const parsed = Number(trimmedQuantity);
      if (!Number.isFinite(parsed) || parsed < 0) {
        set({ fieldErrors: { quantityUsed: t('farmer.crops.newCrop.qtyInvalid') } });
        return;
      }
      seedQuantity = parsed;
    }

    const trimmedYield = state.expectedQtyKg.trim().replace(/,/g, '');
    let expectedYieldKg: number | undefined;
    if (trimmedYield.length > 0) {
      const parsed = Number(trimmedYield);
      if (!Number.isFinite(parsed) || parsed < 0) {
        set({ fieldErrors: { expectedQtyKg: t('farmer.crops.newCrop.qtyInvalid') } });
        return;
      }
      expectedYieldKg = parsed;
    }

    const seedVariety = state.seedVariety.trim();
    const seedCompany = state.seedCompany.trim();
    const body: CreateFarmCropBody = {
      cropMasterId: selectedCropMasterId,
      plantedOn: toIsoDate(parseDisplayDate(state.plantationDate)),
      expectedHarvestOn: toIsoDate(parseDisplayDate(state.expectedHarvestDate)),
      expectedGrade: GRADE_TO_API[state.expectedGrade],
      ...(expectedYieldKg !== undefined ? { expectedYieldKg } : {}),
      ...(seedVariety ? { seedVariety } : {}),
      ...(seedCompany ? { seedCompany } : {}),
      ...(seedQuantity !== undefined ? { seedQuantity } : {}),
      ...(seedQuantity !== undefined ? { seedQuantityUnit: state.quantityUnit } : {}),
      ...(seedCostPaise !== undefined ? { seedCostPaise } : {}),
    };

    set({ isSubmitting: true });
    try {
      const created = await createFarmCrop(selectedPlotId, body);

      const plot: DiaryPlot = state.plots.find((p) => p.id === selectedPlotId) ?? {
        id: selectedPlotId,
        name: state.selectedZone,
        areaAcres: null,
      };
      const createdCrop: CropItem = toCropItem(created, plot);

      if (onSaveCrop) {
        onSaveCrop(createdCrop);
      } else if (onBack) {
        onBack();
      }
    } catch (err: unknown) {
      if (err instanceof ApiError && err.is('CROP_PLOT_ALREADY_GROWING')) {
        // Defensive only: creation always starts a crop PLANNED, never
        // GROWING (crops.service.ts's createFarmCrop), so BR-46 cannot
        // actually fire from this screen today. It fires for real from a
        // PATCH status transition (CropDetailScreen), which is handled the
        // same way there. Kept here in case that server behavior changes.
        set({ submitError: t('farmer.crops.newCrop.plotAlreadyGrowing') });
      } else {
        set({
          submitError: formatErrorMessage(err, t('farmer.crops.newCrop.saveError')),
          fieldErrors: extractFieldErrors(err),
        });
      }
    } finally {
      set({ isSubmitting: false });
    }
  };

  if (state.loadingOptions) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenStatusBar barStyle="dark-content" backgroundColor={P.white} />
        <View style={styles.optionsLoadingContainer}>
          <Skeleton width="100%" height={SKELETON_HEIGHT} borderRadius={SKELETON_RADIUS} />
          <Skeleton width="100%" height={SKELETON_HEIGHT} borderRadius={SKELETON_RADIUS} />
          <Skeleton width="100%" height={SKELETON_HEIGHT} borderRadius={SKELETON_RADIUS} />
        </View>
      </SafeAreaView>
    );
  }

  if (state.optionsError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenStatusBar barStyle="dark-content" backgroundColor={P.white} />
        <View style={styles.optionsErrorContainer}>
          <ErrorState error={state.optionsError} onRetry={loadOptions} />
        </View>
      </SafeAreaView>
    );
  }

  if (state.plots.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenStatusBar barStyle="dark-content" backgroundColor={P.white} />
        <View style={styles.optionsErrorContainer}>
          <Text style={styles.noPlotsText}>{t('farmer.crops.newCrop.noPlotsMessage')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* ── Top Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (step === 2) {
              set({ step: 1 });
            } else if (onBack) {
              onBack();
            }
          }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={nt('header.goBackA11y')}
        >
          <ArrowBackIcon size={ICON_SIZE.back} color={P.deepGreen} />
        </TouchableOpacity>

        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>{nt('header.title')}</Text>
          <Text style={styles.headerSubtitle}>
            {step === 1 ? nt('header.subtitleStep1') : nt('header.subtitleStep2')}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={onCancel ?? onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={nt('header.cancelA11y')}
        >
          <Text style={styles.cancelBtnText}>{nt('header.cancel')}</Text>
        </TouchableOpacity>
      </View>

      {/* ── 2-Step Progress Indicator ── */}
      <View style={styles.progressRow}>
        <View style={[styles.progressBarSegment, styles.progressBarActive]} />
        <View
          style={[
            styles.progressBarSegment,
            step === 2 ? styles.progressBarActive : styles.progressBarInactive,
          ]}
        />
      </View>

      {/* ── Main Form Content ── */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {step === 1 ? (
          <BasicStep form={form} validation={validation} />
        ) : (
          <DatesGradeStep form={form} validation={validation} />
        )}
      </ScrollView>

      {/* ── Fixed Bottom Actions ── */}
      <View style={styles.bottomFooter}>
        {step === 1 ? (
          <TouchableOpacity
            style={styles.primaryActionButton}
            onPress={handleNextStep}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryActionText}>{nt('footer.next')}</Text>
            <ArrowRightIcon size={ICON_SIZE.action} color={P.white} />
          </TouchableOpacity>
        ) : (
          <>
            {state.submitError ? (
              <Text style={styles.submitErrorText}>{state.submitError}</Text>
            ) : null}
            <View style={styles.twoButtonsFooter}>
              <TouchableOpacity
                style={styles.backFooterButton}
                onPress={() => set({ step: 1 })}
                activeOpacity={0.85}
                disabled={state.isSubmitting}
              >
                <Text style={styles.backFooterButtonText}>{nt('footer.back')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveCropButton, state.isSubmitting && styles.saveCropButtonDisabled]}
                onPress={() => void handleSave()}
                activeOpacity={0.85}
                disabled={state.isSubmitting}
              >
                <CheckmarkIcon size={ICON_SIZE.action} color={P.white} />
                <Text style={styles.saveCropButtonText}>
                  {state.isSubmitting ? nt('footer.saving') : nt('footer.save')}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      <PickerModals form={form} />
      <CalendarModal form={form} />
    </SafeAreaView>
  );
}
