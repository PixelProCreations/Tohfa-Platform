import React, { useEffect, useRef, useState } from 'react';
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
import { authPalette as P, typography } from '../../../theme';
import { t } from '../../../../../i18n/farmer';
import { createIdempotencyKeyCache } from '../../../../../shell/api/idempotency';
import { ApiError, createCropInput, type CropInputUnit } from '../../../api/crops';
import { todayInKolkata } from '../../certifications/certificationForm';
import { useActiveCropItems, type CropItem } from './cropItems';
import {
  APPLICATION_METHODS,
  APPROVED_FERTIGATION_INPUTS,
  FERTIGATION_UNITS,
  methodLabelKey,
  unitLabelKey,
  type ApprovedFertigationInput,
} from './fertigationCatalogue';
import { parseQuantity } from './fertigationQuantity';

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

function CalendarIcon({ size = 16, color = P.twGray600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="3" stroke={color} strokeWidth="2" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
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
// Data sources
// ─────────────────────────────────────────────
//
//  - crops: the farmer's real active crops (cropItems.ts, API-backed);
//  - approved inputs (name, type, method, dosage): the LOCAL list in
//    fertigationCatalogue.ts, because no catalogue endpoint exists yet;
//  - unit price / cost, per-crop pH and NPK targets, and the next application
//    date have NO source (no API field, no system_config key), so the designed
//    cards render the neutral "—" value and nothing invented is POSTed.

const DEFAULT_INPUT: ApprovedFertigationInput = APPROVED_FERTIGATION_INPUTS[0]!;
const UNITS: readonly CropInputUnit[] = FERTIGATION_UNITS.map((u) => u.unit);

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

  // Selected crop / field
  // Crop picker options: the farmer's real active crops (see cropItems.ts).
  const {
    items: cropOptions,
    loading: cropsLoading,
    error: cropsError,
    reload: reloadCrops,
  } = useActiveCropItems();
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

  // One Idempotency-Key per logical save: a retry of the same body after a
  // failure replays the same key, a changed form gets a new one (root CLAUDE.md 2.4).
  const idempotencyKeys = useRef(createIdempotencyKeyCache()).current;

  // Modals
  const [showCropModal, setShowCropModal] = useState(false);
  const [showInputModal, setShowInputModal] = useState(false);
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);

  // No unit price, crop reference values or next date have a real source yet
  // (see "Data sources" above): the designed cards show this neutral value.
  const noValue = t('farmer.logFertigation.empty');
  const unitLabel = (value: CropInputUnit): string => t(unitLabelKey(value));
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

  // While the crop list failed to load and nothing is selected, the field
  // selector is a retry; otherwise it opens the crop picker.
  const handleFieldPress = () => {
    if (!selectedCrop && cropsError) {
      void reloadCrops();
      return;
    }
    setShowCropModal(true);
  };

  const fieldText = selectedCrop
    ? t('farmer.logFertigation.field.option', { zone: selectedCrop.zone, crop: selectedCrop.name })
    : cropsLoading
      ? t('farmer.logFertigation.field.loading')
      : cropsError
        ? t('farmer.logFertigation.field.loadError')
        : t('farmer.logFertigation.field.placeholder');

  const handleSave = async () => {
    if (isSaving) return;
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

    // Only what the farmer chose or typed is recorded. The cost and the NPK
    // percentages are optional in the API and have no real source here, so
    // they are omitted rather than filled with placeholder numbers.
    const phi = phiDays.trim();
    const body = {
      inputType: selectedInput.backendType,
      inputName: selectedInput.name,
      appliedOn: todayInKolkata(),
      // The API types quantity as a JSON number (numeric(10,2)); parsedQuantity
      // has at most 2 decimals, so Number() serialises back to the same digits.
      quantity: Number(parsedQuantity),
      unit,
      applicationMethod: method ? method.slice(0, 100) : undefined,
      notes: phi ? t('farmer.logFertigation.notes', { phi }) : undefined,
    };
    const key = idempotencyKeys.keyFor(JSON.stringify([selectedCrop.id, body]));

    setIsSaving(true);
    try {
      const created = await createCropInput(selectedCrop.id, body, key);
      idempotencyKeys.reset();
      Alert.alert(
        t('farmer.logFertigation.alert.savedTitle'),
        t('farmer.logFertigation.alert.savedBody', { input: selectedInput.name, crop: selectedCrop.name }),
        [
          {
            text: t('farmer.logFertigation.alert.ok'),
            onPress: () => {
              if (onSave) {
                onSave(created);
              } else if (onBack) {
                onBack();
              }
            },
          },
        ],
      );
    } catch (err: unknown) {
      const message =
        err instanceof ApiError && err.problem.detail
          ? err.problem.detail
          : t('farmer.logFertigation.error.saveFailed');
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
            onPress={handleFieldPress}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.logFertigation.field.select')}
          >
            <Text style={styles.selectBoxTextGreen}>{fieldText}</Text>
            <ChevronDownIcon size={18} color={P.forestGreen} />
          </TouchableOpacity>
        </View>

        {/* Reference Card (REFERENCE · CARROT) */}
        <View style={styles.referenceCard} testID="logFertigation.referenceCard">
          <View style={styles.referenceHeader}>
            <InfoCircleIcon size={16} color={P.forestGreen} />
            <Text style={styles.referenceHeaderText}>
              {t('farmer.logFertigation.reference.title', {
                crop: selectedCrop ? selectedCrop.name.toUpperCase() : noValue,
              })}
            </Text>
          </View>

          <View style={styles.statBoxesRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue} testID="logFertigation.referenceValue">{noValue}</Text>
              <Text style={styles.statLabel}>{t('farmer.logFertigation.reference.idealPh')}</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statValue} testID="logFertigation.referenceValue">{noValue}</Text>
              <Text style={styles.statLabel}>{t('farmer.logFertigation.reference.n')}</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statValue} testID="logFertigation.referenceValue">{noValue}</Text>
              <Text style={styles.statLabel}>{t('farmer.logFertigation.reference.p')}</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statValue} testID="logFertigation.referenceValue">{noValue}</Text>
              <Text style={styles.statLabel}>{t('farmer.logFertigation.reference.k')}</Text>
            </View>
          </View>

          <Text style={styles.referenceFooterNote}>
            {t('farmer.logFertigation.reference.footer')}
          </Text>
        </View>

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

          <Text style={styles.helpText}>
            {t('farmer.logFertigation.input.help')}
          </Text>
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
                keyboardType="numeric"
                accessibilityLabel={t('farmer.logFertigation.quantity.label')}
              />
              <TouchableOpacity
                style={styles.unitBtn}
                onPress={() => setShowUnitModal(true)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t('farmer.logFertigation.unit.select')}
              >
                <Text style={styles.unitBtnText}>{unitLabel(unit)}</Text>
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
              keyboardType="numeric"
              accessibilityLabel={t('farmer.logFertigation.phi.a11y')}
            />
          </View>
        </View>

        {/* Cost Calculation Card — no unit price has a real source yet, so no cost is shown or sent */}
        <View style={styles.costCard}>
          <View style={styles.costLeftRow}>
            <View style={styles.calcIconBox}>
              <CalculatorIcon size={18} color={P.forestGreen} />
            </View>
            <View>
              <Text style={styles.costFormula}>
                {t('farmer.logFertigation.cost.formula', {
                  qty: quantity,
                  unit: unitLabel(unit).toUpperCase(),
                  price: noValue,
                })}
              </Text>
              <Text style={styles.costAmount} testID="logFertigation.cost">
                {t('farmer.logFertigation.cost.amount', { amount: noValue })}
              </Text>
            </View>
          </View>

          <View style={styles.editableBadge}>
            <Text style={styles.editableBadgeText}>{t('farmer.logFertigation.cost.badge')}</Text>
          </View>
        </View>

        {/* Next Application Date — the crop-inputs API has no next-date/interval field yet */}
        <View style={styles.formGroup} testID="logFertigation.nextDate">
          <View style={styles.labelRow}>
            <CalendarIcon size={16} color={P.twGray600} />
            <Text style={styles.labelDate}>{t('farmer.logFertigation.nextDate.label')}</Text>
          </View>

          <View style={styles.dateBox}>
            <Text style={styles.dateText}>{noValue}</Text>
            <View style={styles.dateDaysBadge}>
              <Text style={styles.dateDaysBadgeText}>{noValue}</Text>
            </View>
          </View>
        </View>

        {/* Bottom Button: Save application */}
        <TouchableOpacity
          testID="logFertigation.save"
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel={t('farmer.logFertigation.save')}
          accessibilityState={{ disabled: isSaving, busy: isSaving }}
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
              <TouchableOpacity onPress={() => setShowCropModal(false)}>
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
              <TouchableOpacity onPress={() => setShowInputModal(false)}>
                <CloseIcon size={18} color={P.twGray800} />
              </TouchableOpacity>
            </View>
            {APPROVED_FERTIGATION_INPUTS.map((item) => {
              const isSelected = selectedInput.name === item.name;
              return (
                <TouchableOpacity
                  key={item.name}
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
                        price: noValue,
                        unit: unitLabel(item.unit),
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
              <TouchableOpacity onPress={() => setShowMethodModal(false)}>
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
              <TouchableOpacity onPress={() => setShowUnitModal(false)}>
                <CloseIcon size={18} color={P.twGray800} />
              </TouchableOpacity>
            </View>
            {UNITS.map((u) => {
              const isSelected = unit === u;
              return (
                <TouchableOpacity
                  key={u}
                  style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                  onPress={() => {
                    setUnit(u);
                    setShowUnitModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      isSelected && styles.modalItemTextSelected,
                    ]}
                  >
                    {unitLabel(u)}
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
  labelDate: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.twGray800,
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
  dateBox: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  dateText: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.twGray900,
  },
  dateDaysBadge: {
    backgroundColor: P.twGray100,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dateDaysBadgeText: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: P.twGray500,
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
  saveBtnText: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.white,
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
