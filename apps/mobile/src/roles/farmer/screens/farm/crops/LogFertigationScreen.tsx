import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar } from '@tohfa/mobile-ui';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { format, type Money } from '@tohfa/shared-types';
import { authPalette as P, typography } from '../../../theme';
import { t } from '../../../../../i18n/farmer';
import { useActiveCropItems, type CropItem } from './cropItems';
import { createCropInput, ApiError, type CropInputUnit } from '../../../api/crops';
import { COST_INR_MAX, computeCostInr, isWithinCostLimit, parseQuantity } from './fertigationCost';
import {
  APPLICATION_METHODS,
  APPROVED_FERTIGATION_INPUTS,
  FERTIGATION_UNITS,
  methodLabelKey,
  nutrientReferenceFor,
  unitLabelKey,
  type ApprovedFertigationInput,
} from './fertigationCatalogue';
import { todayInKolkata } from '../../certifications/certificationForm';

// ─────────────────────────────────────────────
// Vector Icons (Strictly no emojis, theme tokens only)
// ─────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = P.deepGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FieldBoxIcon({ size = 15, color = P.forestGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="3" stroke={color} strokeWidth="2.4" />
      <Line x1="3" y1="12" x2="21" y2="12" stroke={color} strokeWidth="1.8" strokeDasharray="3 3" />
      <Line x1="12" y1="3" x2="12" y2="21" stroke={color} strokeWidth="1.8" strokeDasharray="3 3" />
    </Svg>
  );
}

function InfoCircleIcon({ size = 16, color = P.forestGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Line x1="12" y1="11" x2="12" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="12" cy="8" r="1.2" fill={color} />
    </Svg>
  );
}

function FlaskIcon({ size = 16, color = P.forestGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10 3v4.5L5 18a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3L14 7.5V3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="8.5" y1="3" x2="15.5" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="7" y1="15.5" x2="17" y2="15.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 18, color = P.forestGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9l6 6 6-6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CalculatorIcon({ size = 18, color = P.forestGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="2" width="16" height="20" rx="3" stroke={color} strokeWidth="2" />
      <Rect x="7" y="5" width="10" height="4" rx="1" fill={color} fillOpacity={0.2} stroke={color} strokeWidth="1.5" />
      <Circle cx="8" cy="13" r="1" fill={color} />
      <Circle cx="12" cy="13" r="1" fill={color} />
      <Circle cx="16" cy="13" r="1" fill={color} />
      <Circle cx="8" cy="17" r="1" fill={color} />
      <Circle cx="12" cy="17" r="1" fill={color} />
      <Circle cx="16" cy="17" r="1" fill={color} />
    </Svg>
  );
}

function CheckmarkIcon({ size = 18, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={color}
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CloseIcon({ size = 18, color = P.twGray800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6l12 12"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────
//
// Data sources:
//  - crops: the farmer's real active crops (cropItems.ts, API-backed);
//  - approved inputs, unit prices, dosage and the crop reference card: the LOCAL
//    catalogue in fertigationCatalogue.ts, because no catalogue endpoint exists yet;
//  - cost: exact integer-paise maths in fertigationCost.ts, POSTed as a 2dp string.
//
// There is deliberately no "next application date". The crop-inputs API (BR-56)
// has no interval or next-date field, so any date shown here would be invented
// (the old screen hard-coded a fixed calendar date and a "+14 days" badge), and a system-suggested
// schedule is the kind of automation BR-38 holds until the client decides.

const DEFAULT_INPUT: ApprovedFertigationInput = APPROVED_FERTIGATION_INPUTS[0]!;

export interface LogFertigationScreenProps {
  crop?: CropItem | null | undefined;
  onBack?: (() => void) | undefined;
  onSave?: ((data?: unknown) => void) | undefined;
}

export function LogFertigationScreen({
  crop,
  onBack,
  onSave,
}: LogFertigationScreenProps): React.JSX.Element {
  // Android hardware back
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (onBack) {
        onBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [onBack]);

  // Crop picker options: the farmer's real active crops (see cropItems.ts).
  const { items: cropOptions } = useActiveCropItems();
  const [selectedCrop, setSelectedCrop] = useState<CropItem | null>(crop ?? null);
  useEffect(() => {
    if (!selectedCrop && cropOptions[0]) setSelectedCrop(cropOptions[0]);
  }, [cropOptions, selectedCrop]);

  // Selected input
  const [selectedInput, setSelectedInput] = useState<ApprovedFertigationInput>(DEFAULT_INPUT);
  const [method, setMethod] = useState<string>(DEFAULT_INPUT.method);
  const [quantity, setQuantity] = useState<string>(DEFAULT_INPUT.defaultQty);
  const [unit, setUnit] = useState<CropInputUnit>(DEFAULT_INPUT.unit);
  const [phiDays, setPhiDays] = useState<string>(DEFAULT_INPUT.phiDays);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Modals
  const [showCropModal, setShowCropModal] = useState(false);
  const [showInputModal, setShowInputModal] = useState(false);
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);

  // Cost: the catalogue price is per the input's own unit. With another unit selected
  // there is no approved conversion (BR-56f lists its unit conversions as unapproved
  // defaults), so no cost is computed or sent rather than a wrong one.
  const unitMatchesPrice = unit === selectedInput.unit;
  const cost: Money | null = unitMatchesPrice ? computeCostInr(quantity, selectedInput.pricePerUnit) : null;

  const refData = nutrientReferenceFor(selectedCrop?.name);
  const methodLabel = (value: string): string => {
    const key = methodLabelKey(value);
    return key ? t(key) : value;
  };

  const handleSelectInput = (item: ApprovedFertigationInput) => {
    setSelectedInput(item);
    setMethod(item.method);
    setQuantity(item.defaultQty);
    setUnit(item.unit);
    setPhiDays(item.phiDays);
    setShowInputModal(false);
  };

  const handleSave = async () => {
    if (!selectedCrop?.id) {
      Alert.alert(
        t('farmer.logFertigation.alert.cropRequiredTitle'),
        t('farmer.logFertigation.alert.cropRequiredBody'),
      );
      return;
    }
    const parsedQuantity = parseQuantity(quantity);
    if (parsedQuantity === null) {
      Alert.alert(
        t('farmer.logFertigation.alert.invalidQuantityTitle'),
        t('farmer.logFertigation.alert.invalidQuantityBody'),
      );
      return;
    }
    if (cost !== null && !isWithinCostLimit(cost)) {
      Alert.alert(
        t('farmer.logFertigation.alert.costTooHighTitle'),
        t('farmer.logFertigation.alert.costTooHighBody', { max: format(COST_INR_MAX) }),
      );
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const created = await createCropInput(selectedCrop.id, {
        inputType: selectedInput.backendType,
        inputName: selectedInput.name,
        appliedOn: todayInKolkata(),
        // The API contract types quantity as a JSON number (numeric(10,2), not money).
        // parsedQuantity has at most 2 decimals, so Number() serialises back to the
        // same digits; the cost above was computed from the string, never this number.
        quantity: Number(parsedQuantity),
        unit,
        applicationMethod: method ? method.slice(0, 100) : undefined,
        costInr: cost ?? undefined,
        nitrogenPct: selectedInput.nitrogenPct,
        phosphorusPct: selectedInput.phosphorusPct,
        potassiumPct: selectedInput.potassiumPct,
        notes: t('farmer.logFertigation.notes', { dosage: t(selectedInput.dosageKey), phi: phiDays }),
      });

      Alert.alert(
        t('farmer.logFertigation.alert.savedTitle'),
        t('farmer.logFertigation.alert.savedBody', { input: selectedInput.name, crop: selectedCrop.name }),
        [
          {
            text: t('farmer.logFertigation.alert.ok'),
            onPress: () => {
              if (onSave) {
                onSave({
                  crop: selectedCrop,
                  inputName: selectedInput.name,
                  method,
                  quantity: parsedQuantity,
                  unit,
                  phiDays,
                  cost,
                  createdInput: created,
                });
              } else if (onBack) {
                onBack();
              }
            },
          },
        ],
      );
    } catch (err: unknown) {
      const message =
        err instanceof ApiError
          ? err.problem.detail || err.message
          : t('farmer.logFertigation.error.saveFailed');
      setSaveError(message);
      Alert.alert(t('farmer.logFertigation.alert.saveFailedTitle'), message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('farmer.logFertigation.back')}
        >
          <ArrowBackIcon size={20} color={P.deepGreen} />
        </TouchableOpacity>

        <View style={styles.headerTextGroup}>
          <Text style={styles.headerTitle}>{t('farmer.logFertigation.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('farmer.logFertigation.subtitle')}</Text>
        </View>

        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={t('farmer.logFertigation.cancel')}
        >
          <Text style={styles.cancelButtonText}>{t('farmer.logFertigation.cancel')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Field Selector */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <FieldBoxIcon size={15} color={P.forestGreen} />
            <Text style={styles.label}>
              {t('farmer.logFertigation.field.label')} <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
          </View>

          <TouchableOpacity
            style={styles.selectBoxGreen}
            onPress={() => setShowCropModal(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.logFertigation.field.select')}
          >
            <Text style={styles.selectBoxTextGreen}>
              {selectedCrop
                ? t('farmer.logFertigation.field.option', { zone: selectedCrop.zone, crop: selectedCrop.name })
                : t('farmer.logFertigation.field.placeholder')}
            </Text>
            <ChevronDownIcon size={18} color={P.forestGreen} />
          </TouchableOpacity>
        </View>

        {/* Reference Card — only for crops the local reference table knows */}
        {refData && selectedCrop ? (
          <View style={styles.referenceCard} testID="logFertigation.referenceCard">
            <View style={styles.referenceHeader}>
              <InfoCircleIcon size={16} color={P.forestGreen} />
              <Text style={styles.referenceHeaderText}>
                {t('farmer.logFertigation.reference.title', { crop: selectedCrop.name.toUpperCase() })}
              </Text>
            </View>

            <View style={styles.statBoxesRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{refData.idealPh}</Text>
                <Text style={styles.statLabel}>{t('farmer.logFertigation.reference.idealPh')}</Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statValue}>{refData.nKgHa}</Text>
                <Text style={styles.statLabel}>{t('farmer.logFertigation.reference.n')}</Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statValue}>{refData.pKgHa}</Text>
                <Text style={styles.statLabel}>{t('farmer.logFertigation.reference.p')}</Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statValue}>{refData.kKgHa}</Text>
                <Text style={styles.statLabel}>{t('farmer.logFertigation.reference.k')}</Text>
              </View>
            </View>

            <Text style={styles.referenceFooterNote}>{t('farmer.logFertigation.reference.footer')}</Text>
          </View>
        ) : null}

        {/* Input Name Selector */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <FlaskIcon size={16} color={P.forestGreen} />
            <Text style={styles.label}>
              {t('farmer.logFertigation.input.label')} <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
          </View>

          <TouchableOpacity
            style={styles.selectBoxGreen}
            onPress={() => setShowInputModal(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.logFertigation.input.select')}
          >
            <Text style={styles.selectBoxTextGreen}>{selectedInput.name}</Text>
            <ChevronDownIcon size={18} color={P.forestGreen} />
          </TouchableOpacity>

          <Text style={styles.helpText}>{t('farmer.logFertigation.input.help')}</Text>
        </View>

        {/* Type & Method Row */}
        <View style={styles.rowTwoCols}>
          {/* Type */}
          <View style={styles.col}>
            <Text style={styles.subLabel}>{t('farmer.logFertigation.inputType.label')}</Text>
            <View style={styles.autoFieldBox}>
              <Text style={styles.autoFieldValue}>{t(selectedInput.typeKey)}</Text>
              <View style={styles.autoBadge}>
                <Text style={styles.autoBadgeText}>{t('farmer.logFertigation.auto')}</Text>
              </View>
            </View>
          </View>

          {/* Method */}
          <View style={styles.col}>
            <Text style={styles.subLabel}>{t('farmer.logFertigation.method.label')}</Text>
            <TouchableOpacity
              style={styles.methodSelectBox}
              onPress={() => setShowMethodModal(true)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.logFertigation.method.select')}
            >
              <Text style={styles.methodSelectText}>{methodLabel(method)}</Text>
              <ChevronDownIcon size={18} color={P.twGray500} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Dosage Guidance */}
        <View style={styles.formGroup}>
          <Text style={styles.subLabel}>{t('farmer.logFertigation.dosage.label')}</Text>
          <View style={styles.dosageBox}>
            <Text style={styles.dosageText}>{t(selectedInput.dosageKey)}</Text>
          </View>
        </View>

        {/* Quantity & PHI (days) Row */}
        <View style={styles.rowTwoCols}>
          {/* Quantity */}
          <View style={styles.colQty}>
            <Text style={styles.subLabel}>{t('farmer.logFertigation.quantity.label')}</Text>
            <View style={styles.qtyInputRow}>
              <TextInput
                testID="logFertigation.quantity"
                style={styles.qtyInput}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="decimal-pad"
                accessibilityLabel={t('farmer.logFertigation.quantity.label')}
              />
              <TouchableOpacity
                style={styles.unitBtn}
                onPress={() => setShowUnitModal(true)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t('farmer.logFertigation.unit.select')}
              >
                <Text style={styles.unitBtnText}>{t(unitLabelKey(unit))}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* PHI (days) */}
          <View style={styles.colPhi}>
            <Text style={styles.subLabel}>{t('farmer.logFertigation.phi.label')}</Text>
            <TextInput
              style={styles.phiInput}
              value={phiDays}
              onChangeText={setPhiDays}
              keyboardType="number-pad"
              accessibilityLabel={t('farmer.logFertigation.phi.a11y')}
            />
          </View>
        </View>

        {/* Cost Calculation Card */}
        <View style={styles.costCard}>
          <View style={styles.costLeftRow}>
            <View style={styles.calcIconBox}>
              <CalculatorIcon size={18} color={P.forestGreen} />
            </View>
            <View>
              <Text style={styles.costFormula}>
                {t('farmer.logFertigation.cost.formula', {
                  qty: quantity,
                  unit: t(unitLabelKey(selectedInput.unit)),
                  price: format(selectedInput.pricePerUnit),
                })}
              </Text>
              <Text testID="logFertigation.cost" style={styles.costAmount}>
                {cost !== null
                  ? format(cost)
                  : unitMatchesPrice
                    ? t('farmer.logFertigation.cost.unavailable')
                    : t('farmer.logFertigation.cost.unitMismatch', { unit: t(unitLabelKey(selectedInput.unit)) })}
              </Text>
            </View>
          </View>

          <View style={styles.editableBadge}>
            <Text style={styles.editableBadgeText}>{t('farmer.logFertigation.auto')}</Text>
          </View>
        </View>

        {/* Error Banner */}
        {saveError ? (
          <View style={styles.errorBanner} accessibilityRole="alert">
            <Text style={styles.errorBannerText}>{saveError}</Text>
          </View>
        ) : null}

        {/* Bottom Button: Save application */}
        <TouchableOpacity
          testID="logFertigation.save"
          style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel={t('farmer.logFertigation.save')}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={P.white} />
          ) : (
            <CheckmarkIcon size={18} color={P.white} />
          )}
          <Text style={styles.saveBtnText}>
            {isSaving ? t('farmer.logFertigation.saving') : t('farmer.logFertigation.save')}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal: Select Field / Crop */}
      <Modal
        visible={showCropModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCropModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCropModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('farmer.logFertigation.field.modalTitle')}</Text>
              <TouchableOpacity
                onPress={() => setShowCropModal(false)}
                accessibilityRole="button"
                accessibilityLabel={t('farmer.logFertigation.cancel')}
              >
                <CloseIcon size={18} color={P.twGray800} />
              </TouchableOpacity>
            </View>
            {cropOptions.map((item) => {
              const isSelected = selectedCrop?.id === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                  onPress={() => {
                    setSelectedCrop(item);
                    setShowCropModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      isSelected && styles.modalItemTextSelected,
                    ]}
                  >
                    {t('farmer.logFertigation.field.option', { zone: item.zone, crop: item.name })}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal: Select Input Name */}
      <Modal
        visible={showInputModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInputModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowInputModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('farmer.logFertigation.input.modalTitle')}</Text>
              <TouchableOpacity
                onPress={() => setShowInputModal(false)}
                accessibilityRole="button"
                accessibilityLabel={t('farmer.logFertigation.cancel')}
              >
                <CloseIcon size={18} color={P.twGray800} />
              </TouchableOpacity>
            </View>
            {APPROVED_FERTIGATION_INPUTS.map((item) => {
              const isSelected = selectedInput.name === item.name;
              return (
                <TouchableOpacity
                  key={item.name}
                  testID={`logFertigation.input.${item.name}`}
                  style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                  onPress={() => handleSelectInput(item)}
                >
                  <View>
                    <Text
                      style={[
                        styles.modalItemText,
                        isSelected && styles.modalItemTextSelected,
                      ]}
                    >
                      {t('farmer.logFertigation.input.option', { name: item.name, type: t(item.typeKey) })}
                    </Text>
                    <Text style={styles.modalSubItemText}>
                      {t('farmer.logFertigation.input.optionDetail', {
                        price: format(item.pricePerUnit),
                        unit: t(unitLabelKey(item.unit)),
                        method: methodLabel(item.method),
                      })}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal: Select Method */}
      <Modal
        visible={showMethodModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMethodModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMethodModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('farmer.logFertigation.method.modalTitle')}</Text>
              <TouchableOpacity
                onPress={() => setShowMethodModal(false)}
                accessibilityRole="button"
                accessibilityLabel={t('farmer.logFertigation.cancel')}
              >
                <CloseIcon size={18} color={P.twGray800} />
              </TouchableOpacity>
            </View>
            {APPLICATION_METHODS.map((m) => {
              const isSelected = method === m.value;
              return (
                <TouchableOpacity
                  key={m.value}
                  style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                  onPress={() => {
                    setMethod(m.value);
                    setShowMethodModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      isSelected && styles.modalItemTextSelected,
                    ]}
                  >
                    {t(m.labelKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal: Select Unit */}
      <Modal
        visible={showUnitModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUnitModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowUnitModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('farmer.logFertigation.unit.modalTitle')}</Text>
              <TouchableOpacity
                onPress={() => setShowUnitModal(false)}
                accessibilityRole="button"
                accessibilityLabel={t('farmer.logFertigation.cancel')}
              >
                <CloseIcon size={18} color={P.twGray800} />
              </TouchableOpacity>
            </View>
            {FERTIGATION_UNITS.map((u) => {
              const isSelected = unit === u.unit;
              return (
                <TouchableOpacity
                  key={u.unit}
                  testID={`logFertigation.unit.${u.unit}`}
                  style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                  onPress={() => {
                    setUnit(u.unit);
                    setShowUnitModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      isSelected && styles.modalItemTextSelected,
                    ]}
                  >
                    {t(u.labelKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.white,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 6 : 4,
    paddingBottom: 10,
    backgroundColor: P.white,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTextGroup: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: P.twGray900,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: typography.body,
    color: P.twGray500,
    marginTop: 1,
  },
  cancelButtonText: {
    fontSize: typography.bodyLarge,
    fontWeight: '600',
    color: P.twGray600,
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  scrollView: {
    flex: 1,
    backgroundColor: P.white,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 36,
  },
  formGroup: {
    marginTop: 14,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.twGray900,
    marginLeft: 6,
  },
  requiredAsterisk: {
    color: P.red700,
    fontWeight: '700',
  },
  selectBoxGreen: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: P.forestGreen,
    backgroundColor: P.white,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectBoxTextGreen: {
    fontSize: typography.bodyLarge,
    fontWeight: '600',
    color: P.twGray900,
  },
  helpText: {
    fontSize: typography.bodySmall,
    lineHeight: 16,
    color: P.twGray400,
    marginTop: 6,
  },
  referenceCard: {
    backgroundColor: P.nearWhiteTint2,
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: P.twGray200,
  },
  referenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  referenceHeaderText: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: P.twGray600,
    letterSpacing: 0.6,
    marginLeft: 6,
  },
  statBoxesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: P.white,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: P.twGray100,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: typography.title,
    fontWeight: '700',
    color: P.twGray900,
  },
  statLabel: {
    fontSize: typography.caption,
    color: P.twGray500,
    marginTop: 2,
  },
  referenceFooterNote: {
    fontSize: typography.caption,
    color: P.twGray500,
    marginTop: 10,
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  col: {
    flex: 1,
  },
  colQty: {
    flex: 1.25,
  },
  colPhi: {
    flex: 1,
  },
  subLabel: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.twGray800,
    marginBottom: 6,
  },
  autoFieldBox: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.twGray50,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  autoFieldValue: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray900,
  },
  autoBadge: {
    backgroundColor: P.twGray200,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  autoBadgeText: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: P.twGray500,
  },
  methodSelectBox: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  methodSelectText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray900,
  },
  dosageBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    padding: 12,
  },
  dosageText: {
    fontSize: typography.body,
    lineHeight: 18,
    color: P.twGray700,
  },
  qtyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyInput: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    paddingHorizontal: 14,
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.twGray900,
  },
  unitBtn: {
    width: 50,
    height: 48,
    borderRadius: 12,
    backgroundColor: P.twGray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  unitBtnText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.twGray700,
  },
  phiInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    paddingHorizontal: 14,
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.twGray900,
  },
  costCard: {
    backgroundColor: P.greenTint1,
    borderWidth: 1.2,
    borderColor: P.green300,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  costLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calcIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: P.green200,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  costFormula: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: P.twGray500,
    letterSpacing: 0.4,
  },
  costAmount: {
    fontSize: typography.title,
    fontWeight: '700',
    color: P.twGray900,
    marginTop: 2,
  },
  editableBadge: {
    backgroundColor: P.white,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: P.green200,
  },
  editableBadgeText: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: P.forestGreen,
    letterSpacing: 0.3,
  },
  saveBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: P.forestGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 22,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  saveBtnDisabled: {
    opacity: 0.65,
  },
  saveBtnText: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.white,
  },
  errorBanner: {
    backgroundColor: P.twRed50,
    borderWidth: 1,
    borderColor: P.twRed200,
    borderRadius: 14,
    padding: 12,
    marginTop: 16,
  },
  errorBannerText: {
    color: P.twRed700,
    fontSize: typography.bodySmall,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: P.white,
    borderRadius: 18,
    padding: 20,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.twGray900,
  },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray50,
  },
  modalItemSelected: {
    backgroundColor: P.twGreen50,
    borderRadius: 8,
  },
  modalItemText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray900,
  },
  modalItemTextSelected: {
    color: P.forestGreen,
    fontWeight: '700',
  },
  modalSubItemText: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    marginTop: 2,
  },
});
