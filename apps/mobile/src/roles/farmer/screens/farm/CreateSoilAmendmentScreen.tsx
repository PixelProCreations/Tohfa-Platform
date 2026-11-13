import React from 'react';
import { StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { authPalette as P, typography } from '../../theme';
import { useFieldValidation } from '../../utils/validation';
import {
  AMENDMENT_FORM_FIELD_ORDER,
  AMENDMENT_FORM_RULES,
  SOIL_AMENDMENT_TYPE_MAX_LENGTH,
  SOIL_NOTES_MAX_LENGTH,
  SOIL_QUANTITY_MAX_CHARS,
  type AmendmentFormField,
} from './soilFormRules';
import { createSoilAmendment, type CreateSoilAmendmentInput } from '../../api/soil';
import { DIM, ICON, OPACITY, RAD, SP } from './soilForms/constants';
import { formatDisplayDate, parseSoilDate, toIsoDate } from './soilForms/dateUtils';
import { DateField, FieldLabel, PresetChip, SuccessContextRow, ZonePickerField } from './soilForms/fields';
import { LeafSproutIcon } from './soilForms/icons';
import { SHARED_KEYS, sf, t } from './soilForms/i18n';
import { SoilFormShell, SoilSuccessModal } from './soilForms/SoilFormShell';
import { styles as shared } from './soilForms/styles';
import { useFormFields, useSoilFormShell } from './soilForms/useSoilFormShell';

// ─────────────────────────────────────────────
// Presets & Options
// ─────────────────────────────────────────────

/**
 * `value` is the canonical English text written into the amendment-type field
 * and sent to the API (locale-independent); only the chip label is translated.
 */
const AMENDMENT_PRESETS = [
  { id: 'fym', value: 'Farmyard Manure (FYM)' },
  { id: 'vermicompost', value: 'Vermicompost' },
  { id: 'greenManure', value: 'Green Manure / Dhaincha' },
  { id: 'poultryManure', value: 'Poultry Manure' },
  { id: 'biochar', value: 'Biochar / Charcoal' },
  { id: 'neemCake', value: 'Neem Cake' },
  { id: 'lime', value: 'Agricultural Lime / Gypsum' },
  { id: 'boneMeal', value: 'Bone Meal' },
  { id: 'jeevamrutha', value: 'Jeevamrutha' },
  { id: 'other', value: 'Other Organic Amendment' },
] as const;

const DEFAULT_AMENDMENT = AMENDMENT_PRESETS[0].value;
const QUANTITY_PRESETS = [100, 250, 500, 1000, 2000];
const DEFAULT_QUANTITY = '500';

export interface CreateSoilAmendmentScreenProps {
  farmId: string;
  plotId?: string | undefined;
  onBack?: (() => void) | undefined;
  onSave?: (() => void) | undefined;
}

interface SavedSuccessData {
  plotName: string;
  amendmentType: string;
  quantityKg: number;
  appliedDate: string;
  notes?: string | undefined;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export function CreateSoilAmendmentScreen({
  farmId,
  plotId: initialPlotId,
  onBack,
  onSave,
}: CreateSoilAmendmentScreenProps): React.JSX.Element {
  const shell = useSoilFormShell<SavedSuccessData>({ farmId, initialPlotId, onBack, onSave });
  const { state, selectedPlotName } = shell;

  const { values, setField, update } = useFormFields(() => ({
    amendmentType: DEFAULT_AMENDMENT as string,
    quantityKg: DEFAULT_QUANTITY,
    appliedDate: formatDisplayDate(new Date()),
    notes: '',
  }));
  const { amendmentType, quantityKg, appliedDate, notes } = values;

  const validation = useFieldValidation<AmendmentFormField>({
    values: { amendmentType, quantityKg, appliedDate, notes },
    rules: AMENDMENT_FORM_RULES,
    order: AMENDMENT_FORM_FIELD_ORDER,
  });
  const fieldError = (field: AmendmentFormField) => {
    const message = validation.messageFor(field);
    return message ? <Text style={local.fieldError}>{message}</Text> : null;
  };

  const handleSelectDate = (date: Date) => {
    update({ appliedDate: formatDisplayDate(date) });
    shell.setDatePickerVisible(false);
  };

  const handleSave = () =>
    shell.runSave(
      () => {
        if (!state.selectedPlotId) return sf('amendment.error.zoneRequired');
        // Field errors render inline under each input; they block the save here.
        if (!validation.validateAll().valid) return sf('amendment.error.fixFields');
        if (!amendmentType.trim()) return sf('amendment.error.typeRequired');
        const numQty = parseFloat(quantityKg);
        if (isNaN(numQty) || numQty <= 0) return sf('amendment.error.quantityInvalid');
        if (!toIsoDate(appliedDate)) return sf('amendment.error.dateInvalid');
        return null;
      },
      async () => {
        const numQty = parseFloat(quantityKg);
        const payload: CreateSoilAmendmentInput = {
          amendmentType: amendmentType.trim(),
          quantityKg: numQty,
          // Validated above, so never null here.
          appliedDate: toIsoDate(appliedDate) as string,
          ...(notes.trim() ? { notes: notes.trim() } : {}),
        };
        await createSoilAmendment(farmId, state.selectedPlotId, payload);
        return {
          plotName: selectedPlotName,
          amendmentType: amendmentType.trim(),
          quantityKg: numQty,
          appliedDate,
          notes: notes.trim() || undefined,
        };
      },
      sf('amendment.error.saveFailed'),
    );

  const success = state.successData;

  return (
    <SoilFormShell
      statusBar={<StatusBar barStyle="dark-content" />}
      title={sf('amendment.title')}
      subtitle={sf('amendment.subtitle')}
      state={state}
      onBack={onBack}
      onSelectPlot={shell.selectPlot}
      setZonePickerVisible={shell.setZonePickerVisible}
      setDatePickerVisible={shell.setDatePickerVisible}
      saveLabel={sf('amendment.save')}
      saveA11yLabel={sf('amendment.saveA11y')}
      onSavePress={() => void handleSave()}
      datePickerTitle={sf('amendment.datePickerTitle')}
      datePickerValue={parseSoilDate(appliedDate)}
      onSelectDate={handleSelectDate}
      successModal={
        <SoilSuccessModal
          visible={!!success}
          onClose={shell.closeSuccess}
          title={sf('amendment.success.title')}
          subtitle={sf('amendment.success.subtitle')}
          plotName={success?.plotName}
          dateLabel={sf('amendment.success.appliedDate')}
          dateValue={success?.appliedDate}
        >
          <SuccessContextRow
            label={sf('amendment.success.type')}
            value={success?.amendmentType}
            numberOfLines={1}
          />
          <SuccessContextRow
            label={sf('amendment.success.quantity')}
            value={sf('common.qtyKg', { qty: success?.quantityKg ?? '' })}
            valueStyle={local.quantityValue}
          />
          {success?.notes ? (
            <SuccessContextRow
              label={sf('amendment.success.notes')}
              value={success.notes}
              numberOfLines={2}
              notes
            />
          ) : null}
        </SoilSuccessModal>
      }
    >
      {/* ── Zone Selection ── */}
      <ZonePickerField plotName={selectedPlotName} onOpen={() => shell.setZonePickerVisible(true)} />

      {/* ── Amendment Type ── */}
      <View style={shared.fieldContainer}>
        <FieldLabel
          label={sf('amendment.typeLabel')}
          required
          icon={<LeafSproutIcon size={ICON.label} color={P.twGreen700} />}
        />
        <TextInput
          style={local.textInput}
          value={amendmentType}
          onChangeText={setField('amendmentType')}
          placeholder={sf('amendment.typePlaceholder')}
          placeholderTextColor={P.twGray400}
          maxLength={SOIL_AMENDMENT_TYPE_MAX_LENGTH}
          onBlur={() => validation.onBlur('amendmentType')}
        />
        {fieldError('amendmentType')}

        {/* Presets Chips */}
        <Text style={[shared.chipHeader, local.chipHeaderGap]}>{sf('amendment.commonPresets')}</Text>
        <View style={shared.presetChipsWrap}>
          {AMENDMENT_PRESETS.map((preset) => (
            <PresetChip
              key={preset.id}
              label={sf(`amendment.preset.${preset.id}`)}
              active={amendmentType === preset.value}
              onPress={() => update({ amendmentType: preset.value })}
            />
          ))}
        </View>
      </View>

      {/* ── Quantity (kg) & Applied Date ── */}
      <View style={local.twoColRow}>
        <View style={local.colHalf}>
          <FieldLabel label={t(SHARED_KEYS.quantityKg)} required />
          <TextInput
            style={local.textInput}
            value={quantityKg}
            onChangeText={setField('quantityKg')}
            keyboardType="decimal-pad"
            placeholder={DEFAULT_QUANTITY}
            placeholderTextColor={P.twGray400}
            maxLength={SOIL_QUANTITY_MAX_CHARS}
            onBlur={() => validation.onBlur('quantityKg')}
          />
          {fieldError('quantityKg')}
        </View>

        <DateField
          label={sf('amendment.appliedDate')}
          value={appliedDate}
          onChangeText={setField('appliedDate')}
          onOpenPicker={() => shell.setDatePickerVisible(true)}
          containerStyle={local.colHalf}
          onBlur={() => validation.onBlur('appliedDate')}
          error={validation.messageFor('appliedDate')}
        />
      </View>

      {/* Quantity Quick Shortcuts */}
      <View style={local.qtyShortcutsRow}>
        {QUANTITY_PRESETS.map((q) => {
          const active = quantityKg === String(q);
          return (
            <TouchableOpacity
              key={q}
              style={[local.qtyShortcutChip, active && local.qtyShortcutChipActive]}
              onPress={() => update({ quantityKg: String(q) })}
              activeOpacity={OPACITY.pressed}
            >
              <Text style={[local.qtyShortcutText, active && local.qtyShortcutTextActive]}>
                {sf('common.qtyKg', { qty: q })}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Method & Notes ── */}
      <View style={shared.fieldContainer}>
        <FieldLabel label={sf('amendment.notesLabel')} optional />
        <TextInput
          style={[shared.textArea, local.notesArea]}
          value={notes}
          onChangeText={setField('notes')}
          placeholder={sf('amendment.notesPlaceholder')}
          placeholderTextColor={P.twGray400}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          maxLength={SOIL_NOTES_MAX_LENGTH}
          onBlur={() => validation.onBlur('notes')}
        />
        {fieldError('notes')}
      </View>
    </SoilFormShell>
  );
}

// ─────────────────────────────────────────────
// Screen-specific styles (shared ones live in ./soilForms/styles)
// ─────────────────────────────────────────────

const local = StyleSheet.create({
  fieldError: {
    fontSize: typography.bodySmall,
    color: P.twRed600,
    marginTop: SP.xs,
  },
  textInput: {
    borderWidth: DIM.hairline,
    borderColor: P.slate200,
    borderRadius: RAD.field,
    paddingHorizontal: SP.s14,
    height: DIM.inputHeight,
    fontSize: typography.body,
    color: P.slate800,
    backgroundColor: P.white,
    fontWeight: '500',
  },
  chipHeaderGap: {
    marginTop: SP.sm,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: SP.md,
    marginBottom: SP.s6,
  },
  colHalf: {
    flex: 1,
  },
  qtyShortcutsRow: {
    flexDirection: 'row',
    gap: SP.s6,
    marginBottom: SP.lg,
  },
  qtyShortcutChip: {
    flex: 1,
    paddingVertical: SP.s6,
    borderRadius: RAD.chip,
    backgroundColor: P.twGray50,
    borderWidth: DIM.hairline,
    borderColor: P.slate200,
    alignItems: 'center',
  },
  qtyShortcutChipActive: {
    backgroundColor: P.twGreen50,
    borderColor: P.twGreen600,
  },
  qtyShortcutText: {
    fontSize: DIM.smallFont,
    fontWeight: '600',
    color: P.slate600,
  },
  qtyShortcutTextActive: {
    color: P.twGreen800,
    fontWeight: '700',
  },
  notesArea: {
    minHeight: DIM.amendmentNotesMinHeight,
  },
  quantityValue: {
    color: P.twGreen700,
    fontWeight: '700',
  },
});
