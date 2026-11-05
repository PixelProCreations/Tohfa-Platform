import React, { useState, useEffect, useRef } from 'react';
import {
  Alert,
  BackHandler,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import Svg, { Path } from 'react-native-svg';
import { t } from '../../../../../i18n/farmer';
import { createIdempotencyKeyCache } from '../../../../../shell/api/idempotency';
import {
  createCropInput,
  type CreateCropInputRequest,
  type CropInputUnit,
} from '../../../api/crops';
import { todayInKolkata } from '../../certifications/certificationForm';
import { authPalette as P, typography } from '../../../theme';
import type { CropItem } from './ProduceCalendarScreen';
import { useActiveCropItems } from './cropItems';
import { parseQuantity } from './fertigationQuantity';
import { parseAppliedOn } from './inputApplications';

// ─────────────────────────────────────────────
// Inline Vector Icons (strictly no emoji, no raw hex)
// ─────────────────────────────────────────────

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

function ChevronDownIcon({ size = 18, color = P.twGray500 }: { size?: number; color?: string }) {
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

// ─────────────────────────────────────────────
// Types & Options
// ─────────────────────────────────────────────

export interface AddInputAppliedScreenProps {
  crop?: CropItem | null | undefined;
  initialInputType?: 'Fertigation' | 'Pest Treatment' | undefined;
  onBack?: (() => void) | undefined;
  /**
   * Called after POST /farmers/me/crops/:farmCropId/inputs succeeds. No argument: App.tsx passes
   * `goBack`, whose first parameter is a fallback screen name, and the history screen refetches on mount.
   */
  onSave?: (() => void) | undefined;
}

const UNITS = ['ml', 'L', 'kg', 'g'];
/** The unit picker's labels (Dev's) mapped to the API's CropInputUnit. */
const API_UNIT: Record<string, CropInputUnit> = { ml: 'ML', L: 'LITRE', kg: 'KG', g: 'GRAM' };
const PURPOSES = [
  'General nutrition',
  'Pest prevention',
  'Disease control',
  'Soil fertility',
  'Flowering booster',
];
const PEST_OPTIONS = [
  'Aphids',
  'Fruit Borer',
  'Early Blight',
  'Leaf Curl Virus',
  'Whiteflies',
  'Mites',
  'Cutworms',
  'Powdery Mildew',
];
const APPLIED_BY_OPTIONS = [
  'Self',
  'Raju (Worker)',
  'Mani (Worker)',
  'Contractor',
];

/**
 * The crop field shown when the screen is opened without a crop (Input
 * Management → Full history → +, which is farm-wide). It is its own component
 * so the active-crop list is only fetched on that path: opened from a crop,
 * the crop is fixed and nothing extra is loaded. Nothing is preselected — an
 * input is never recorded against a crop the farmer did not choose.
 */
function CropPickerField({
  selected,
  onSelect,
}: {
  selected: CropItem | null;
  onSelect: (crop: CropItem) => void;
}): React.JSX.Element {
  const { items, loading, error, reload } = useActiveCropItems();
  const [open, setOpen] = useState(false);

  const label = selected
    ? t('farmer.addInput.crop.option', { crop: selected.name, zone: selected.zoneShort || selected.zone })
    : loading
      ? t('farmer.addInput.crop.loading')
      : error
        ? t('farmer.addInput.crop.loadError')
        : items.length === 0
          ? t('farmer.addInput.crop.empty')
          : t('farmer.addInput.crop.placeholder');

  // While the list failed to load and nothing is chosen, the field is a retry
  // (same behaviour as LogFertigationScreen's crop selector).
  const handlePress = () => {
    if (!selected && error) {
      void reload();
      return;
    }
    setOpen(true);
  };

  return (
    <View style={styles.fieldSection}>
      <View style={styles.fieldLabelRow}>
        <Text style={styles.fieldLabel}>{t('farmer.addInput.crop.label')}</Text>
        <Text style={styles.asterisk}> *</Text>
      </View>
      <TouchableOpacity
        testID="addInput.cropPicker"
        style={styles.dropdownBox}
        onPress={handlePress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={t('farmer.addInput.crop.selectA11y')}
      >
        <Text style={styles.dropdownText}>{label}</Text>
        <ChevronDownIcon size={18} color={P.twGray500} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>{t('farmer.addInput.crop.title')}</Text>
            {items.map((item) => {
              const isSelected = selected?.id === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  testID={`addInput.cropOption.${item.id}`}
                  style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                  onPress={() => {
                    onSelect(item);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.modalItemText, isSelected && styles.modalItemTextSelected]}>
                    {t('farmer.addInput.crop.option', { crop: item.name, zone: item.zoneShort || item.zone })}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

export function AddInputAppliedScreen({
  crop,
  initialInputType,
  onBack,
  onSave,
}: AddInputAppliedScreenProps): React.JSX.Element {
  // Hardware back button handler for Android
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

  // The real crop the input is recorded against; no sample crop is shown or saved to.
  // Opened from a crop it is fixed; opened farm-wide (no crop) the farmer picks one.
  const hasFixedCrop = Boolean(crop?.id);
  const [pickedCrop, setPickedCrop] = useState<CropItem | null>(null);
  const targetCrop = hasFixedCrop ? (crop ?? null) : pickedCrop;
  const cropZone = targetCrop?.zoneShort || targetCrop?.zone || '';
  const subtitle = !targetCrop?.id
    ? t('farmer.inputHistory.placeholder')
    : targetCrop.variety
      ? t('farmer.inputHistory.cropSubtitle', { crop: targetCrop.name, variety: targetCrop.variety, zone: cropZone })
      : t('farmer.inputHistory.cropSubtitleNoVariety', { crop: targetCrop.name, zone: cropZone });

  // Form states. Quantity and date start empty: the farmer types them (Dev's
  // "4 L" / "200 ml" and "17 Sep 2026, 09:20 AM" were sample values, kept only as placeholders).
  const [inputType, setInputType] = useState<'Fertigation' | 'Pest Treatment'>(
    initialInputType ?? 'Pest Treatment',
  );
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState(
    initialInputType === 'Fertigation' ? 'L' : 'ml',
  );
  const [dateTime, setDateTime] = useState('');
  const [saving, setSaving] = useState(false);
  // One Idempotency-Key per logical save: a retry of the same body replays it (CLAUDE.md 2.4).
  const idempotencyRef = useRef(createIdempotencyKeyCache());
  const [purpose, setPurpose] = useState('General nutrition');
  const [targetPest, setTargetPest] = useState('Aphids');
  const [appliedBy, setAppliedBy] = useState('Self');
  const [notes, setNotes] = useState('');

  // Dropdown Modals
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showPurposeModal, setShowPurposeModal] = useState(false);
  const [showPestModal, setShowPestModal] = useState(false);
  const [showAppliedByModal, setShowAppliedByModal] = useState(false);

  const handleSelectType = (nextType: 'Fertigation' | 'Pest Treatment') => {
    setInputType(nextType);
    if (nextType === 'Fertigation') {
      if (unit === 'ml') setUnit('L');
    } else {
      if (unit === 'L') setUnit('ml');
    }
  };

  const showError = (message: string) => Alert.alert(t('farmer.addInput.error.title'), message);

  /**
   * POST /farmers/me/crops/:farmCropId/inputs (BR-56). Only what the API stores
   * is sent: Purpose / Target pest / Applied by have no field in the crop input
   * contract, so they are not persisted (see the report; NEEDS OWNER DECISION).
   * "Fertigation" is sent as inputType OTHER — the form does not say whether it
   * was manure, fertilizer or a bio-input, and that is not guessed.
   */
  const handleSave = async () => {
    if (saving) return;
    if (!productName.trim()) {
      Alert.alert(t('farmer.addInput.required.title'), t('farmer.addInput.required.body'));
      return;
    }
    if (!targetCrop?.id) {
      showError(t('farmer.addInput.error.noCrop'));
      return;
    }
    const cropId = targetCrop.id;
    // Same BR-56a check as LogFertigationScreen: crop_inputs.quantity is
    // numeric(10,2), so more than 2 decimals, zero, a sign or an exponent is
    // rejected here rather than sent.
    const parsedQuantity = parseQuantity(quantity);
    if (parsedQuantity === null) {
      showError(t('farmer.addInput.error.quantity'));
      return;
    }
    const qty = Number(parsedQuantity);
    const date = parseAppliedOn(dateTime, todayInKolkata());
    if (!date.ok) {
      showError(date.reason === 'future' ? t('farmer.addInput.error.futureDate') : t('farmer.addInput.error.date'));
      return;
    }
    const apiUnit = API_UNIT[unit];
    if (apiUnit === undefined) {
      showError(t('farmer.addInput.error.quantity'));
      return;
    }

    const body: CreateCropInputRequest = {
      inputType: inputType === 'Pest Treatment' ? 'PESTICIDE' : 'OTHER',
      inputName: productName.trim(),
      appliedOn: date.appliedOn,
      quantity: qty,
      unit: apiUnit,
      ...(notes.trim() === '' ? {} : { notes: notes.trim() }),
    };

    setSaving(true);
    try {
      await createCropInput(
        cropId,
        body,
        idempotencyRef.current.keyFor(JSON.stringify({ cropId, body })),
      );
      idempotencyRef.current.reset();
      if (onSave) {
        onSave();
      } else if (onBack) {
        onBack();
      }
    } catch {
      showError(t('farmer.addInput.error.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* ── Top Header Bar ── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.addInput.closeA11y')}
          >
            <CloseIcon size={18} color={P.twGray800} />
          </TouchableOpacity>

          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTitle}>{t('farmer.addInput.title')}</Text>
            <Text style={styles.headerSubtitle}>{subtitle}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 0. Crop (only when opened farm-wide, without a crop) ── */}
        {hasFixedCrop ? null : <CropPickerField selected={pickedCrop} onSelect={setPickedCrop} />}

        {/* ── 1. Input Type ── */}
        <View style={styles.fieldSection}>
          <View style={styles.fieldLabelRow}>
            <Text style={styles.fieldLabel}>{t('farmer.addInput.inputType')}</Text>
            <Text style={styles.asterisk}> *</Text>
          </View>

          <View style={styles.segmentedContainer}>
            <TouchableOpacity
              style={[
                styles.segmentButton,
                inputType === 'Fertigation' && styles.segmentButtonActive,
              ]}
              onPress={() => handleSelectType('Fertigation')}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.addInput.type.fertigation')}
            >
              <Text
                style={[
                  styles.segmentButtonText,
                  inputType === 'Fertigation' && styles.segmentButtonTextActive,
                ]}
              >
                {t('farmer.addInput.type.fertigation')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentButton,
                inputType === 'Pest Treatment' && styles.segmentButtonActive,
              ]}
              onPress={() => handleSelectType('Pest Treatment')}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.addInput.type.pest')}
            >
              <Text
                style={[
                  styles.segmentButtonText,
                  inputType === 'Pest Treatment' && styles.segmentButtonTextActive,
                ]}
              >
                {t('farmer.addInput.type.pest')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 2. Product / Input Name ── */}
        <View style={styles.fieldSection}>
          <View style={styles.fieldLabelRow}>
            <Text style={styles.fieldLabel}>{t('farmer.addInput.productName')}</Text>
            <Text style={styles.asterisk}> *</Text>
          </View>

          <View style={styles.inputBox}>
            <TextInput
              style={styles.textInput}
              value={productName}
              onChangeText={setProductName}
              placeholder={
                inputType === 'Pest Treatment'
                  ? t('farmer.addInput.productPlaceholder.pest')
                  : t('farmer.addInput.productPlaceholder.fertigation')
              }
              placeholderTextColor={P.twGray400}
              accessibilityLabel={t('farmer.addInput.productNameA11y')}
            />
          </View>
          <Text style={styles.helperText}>{t('farmer.addInput.productHelper')}</Text>
        </View>

        {/* ── 3. Quantity ── */}
        <View style={styles.fieldSection}>
          <View style={styles.fieldLabelRow}>
            <Text style={styles.fieldLabel}>{t('farmer.addInput.quantity')}</Text>
            <Text style={styles.asterisk}> *</Text>
          </View>

          <View style={styles.quantityRow}>
            <View style={[styles.inputBox, styles.quantityInputBox]}>
              <TextInput
                style={styles.textInput}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                placeholder={t('farmer.addInput.quantityPlaceholder')}
                placeholderTextColor={P.twGray400}
                accessibilityLabel={t('farmer.addInput.quantityA11y')}
              />
            </View>

            <TouchableOpacity
              style={styles.unitDropdown}
              onPress={() => setShowUnitModal(true)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.addInput.selectUnitA11y')}
            >
              <Text style={styles.unitText}>{unit}</Text>
              <ChevronDownIcon size={18} color={P.twGray500} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 4. Date & Time ── */}
        <View style={styles.fieldSection}>
          <View style={styles.fieldLabelRow}>
            <Text style={styles.fieldLabel}>{t('farmer.addInput.dateTime')}</Text>
            <Text style={styles.asterisk}> *</Text>
          </View>

          <View style={styles.inputBox}>
            <TextInput
              style={styles.textInput}
              value={dateTime}
              onChangeText={setDateTime}
              placeholder={t('farmer.addInput.dateTimePlaceholder')}
              placeholderTextColor={P.twGray400}
              accessibilityLabel={t('farmer.addInput.dateTimeA11y')}
            />
          </View>
          <Text style={styles.helperText}>{t('farmer.addInput.dateTimeHelper')}</Text>
        </View>

        {/* ── 5. Target Pest / Issue (for Pest Treatment) OR Purpose (for Fertigation) ── */}
        {inputType === 'Pest Treatment' ? (
          <View style={styles.fieldSection}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>{t('farmer.addInput.targetPest')}</Text>
              <Text style={styles.asterisk}> *</Text>
            </View>

            <TouchableOpacity
              style={styles.dropdownBox}
              onPress={() => setShowPestModal(true)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.addInput.targetPestA11y')}
            >
              <Text style={styles.dropdownText}>{targetPest}</Text>
              <ChevronDownIcon size={18} color={P.twGray500} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>{t('farmer.addInput.purpose')}</Text>

            <TouchableOpacity
              style={styles.dropdownBox}
              onPress={() => setShowPurposeModal(true)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.addInput.purposeA11y')}
            >
              <Text style={styles.dropdownText}>{purpose}</Text>
              <ChevronDownIcon size={18} color={P.twGray500} />
            </TouchableOpacity>
          </View>
        )}

        {/* ── 6. Applied By ── */}
        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>{t('farmer.addInput.appliedBy')}</Text>

          <TouchableOpacity
            style={styles.dropdownBox}
            onPress={() => setShowAppliedByModal(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.addInput.appliedByA11y')}
          >
            <Text style={styles.dropdownText}>{appliedBy}</Text>
            <ChevronDownIcon size={18} color={P.twGray500} />
          </TouchableOpacity>
        </View>

        {/* ── 7. Notes ── */}
        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>{t('farmer.addInput.notes')}</Text>

          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            placeholder={t('farmer.addInput.notesPlaceholder')}
            placeholderTextColor={P.twGray400}
            textAlignVertical="top"
            accessibilityLabel={t('farmer.addInput.notesA11y')}
          />
        </View>

        {/* ── Bottom Buttons ── */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onBack}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.addInput.cancel')}
          >
            <Text style={styles.cancelButtonText}>{t('farmer.addInput.cancel')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => void handleSave()}
            disabled={saving}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.addInput.save')}
          >
            <Text style={styles.saveButtonText}>{t('farmer.addInput.save')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Unit Selection Modal ── */}
      <Modal visible={showUnitModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowUnitModal(false)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>{t('farmer.addInput.selectUnitTitle')}</Text>
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
                    {u}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Target Pest Selection Modal ── */}
      <Modal visible={showPestModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowPestModal(false)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>{t('farmer.addInput.targetPestTitle')}</Text>
            {PEST_OPTIONS.map((p) => {
              const isSelected = targetPest === p;
              return (
                <TouchableOpacity
                  key={p}
                  style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                  onPress={() => {
                    setTargetPest(p);
                    setShowPestModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      isSelected && styles.modalItemTextSelected,
                    ]}
                  >
                    {p}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Purpose Selection Modal ── */}
      <Modal visible={showPurposeModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowPurposeModal(false)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>{t('farmer.addInput.purposeTitle')}</Text>
            {PURPOSES.map((item) => {
              const isSelected = purpose === item;
              return (
                <TouchableOpacity
                  key={item}
                  style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                  onPress={() => {
                    setPurpose(item);
                    setShowPurposeModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      isSelected && styles.modalItemTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Applied By Selection Modal ── */}
      <Modal visible={showAppliedByModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowAppliedByModal(false)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>{t('farmer.addInput.appliedByTitle')}</Text>
            {APPLIED_BY_OPTIONS.map((item) => {
              const isSelected = appliedBy === item;
              return (
                <TouchableOpacity
                  key={item}
                  style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                  onPress={() => {
                    setAppliedBy(item);
                    setShowAppliedByModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      isSelected && styles.modalItemTextSelected,
                    ]}
                  >
                    {item}
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
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 6 : 4,
    paddingBottom: 10,
    backgroundColor: P.white,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray200,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: P.twGray900,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: typography.bodySmall,
    fontWeight: '500',
    color: P.twGray500,
    marginTop: 1,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: P.white,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 36,
  },
  fieldSection: {
    marginBottom: 16,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: P.twGray700,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  asterisk: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.red700,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: P.mintTintBg,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: P.twGreen100,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonActive: {
    backgroundColor: P.forestGreen,
    shadowColor: P.forestGreen,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentButtonText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.forestGreen,
  },
  segmentButtonTextActive: {
    color: P.white,
    fontWeight: '700',
  },
  inputBox: {
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: typography.body,
    fontWeight: '500',
    color: P.twGray900,
    padding: 0,
  },
  helperText: {
    fontSize: typography.caption,
    fontWeight: '400',
    color: P.twGray500,
    marginTop: 6,
    lineHeight: 15,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quantityInputBox: {
    flex: 1,
  },
  unitDropdown: {
    height: 48,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 12,
    backgroundColor: P.white,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: 76,
  },
  unitText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray900,
    marginRight: 6,
  },
  dropdownBox: {
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: typography.body,
    fontWeight: '500',
    color: P.twGray900,
  },
  notesInput: {
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 12,
    padding: 12,
    fontSize: typography.body,
    fontWeight: '400',
    color: P.twGray900,
    minHeight: 74,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: P.twGray300,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.twGray800,
  },
  saveButton: {
    flex: 1.3,
    height: 48,
    borderRadius: 12,
    backgroundColor: P.forestGreen,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.forestGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButtonText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.white,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  pickerModalContent: {
    width: '100%',
    backgroundColor: P.white,
    borderRadius: 16,
    padding: 18,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  pickerModalTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.twGray900,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  modalItem: {
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  modalItemSelected: {
    backgroundColor: P.twGreen50,
  },
  modalItemText: {
    fontSize: typography.body,
    fontWeight: '500',
    color: P.twGray800,
  },
  modalItemTextSelected: {
    color: P.forestGreen,
    fontWeight: '700',
  },
});
