import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ScreenStatusBar } from '@tohfa/mobile-ui';
import { authPalette as P, typography } from '../../theme';
import { useFieldValidation } from '../../utils/validation';
import { EROSION_FORM_FIELD_ORDER, EROSION_FORM_RULES, SOIL_NOTES_MAX_LENGTH, type ErosionFormField } from './soilFormRules';
import { createErosionNote, type CreateErosionNoteInput, type ErosionRiskLevel } from '../../api/soil';
import { DIM, GLYPH, ICON, OPACITY, RAD, SP } from './soilForms/constants';
import { formatDisplayDate, parseSoilDate, toIsoTimestamp } from './soilForms/dateUtils';
import { DateField, FieldLabel, PresetChip, SuccessContextRow, ZonePickerField } from './soilForms/fields';
import { CheckCircleIcon, MountainSlopeIcon } from './soilForms/icons';
import { sf } from './soilForms/i18n';
import { SoilFormShell, SoilSuccessModal } from './soilForms/SoilFormShell';
import { styles as shared } from './soilForms/styles';
import { useFormFields, useSoilFormShell } from './soilForms/useSoilFormShell';

// ─────────────────────────────────────────────
// Options & Presets
// ─────────────────────────────────────────────

/**
 * `level` is the API wire value (canonical English); `id` selects the
 * translated badge label and description.
 */
const RISK_OPTIONS = [
  { level: 'Low Risk', id: 'low' },
  { level: 'Moderate Risk', id: 'moderate' },
  { level: 'High Risk', id: 'high' },
] as const satisfies ReadonlyArray<{ level: ErosionRiskLevel; id: string }>;

const RISK_ID: Record<ErosionRiskLevel, (typeof RISK_OPTIONS)[number]['id']> = {
  'Low Risk': 'low',
  'Moderate Risk': 'moderate',
  'High Risk': 'high',
};

/**
 * `value` is the canonical English text appended to the practice notes (which
 * are sent to the API as-is); only the chip label is translated.
 */
const CONSERVATION_PRESETS = [
  { id: 'contourBunding', value: 'Contour Bunding' },
  { id: 'mulching', value: 'Mulching & Ground Cover' },
  { id: 'terracing', value: 'Terracing along Slope' },
  { id: 'vetiver', value: 'Vetiver Grass Barrier' },
  { id: 'coverCropping', value: 'Cover Cropping' },
  { id: 'siltTraps', value: 'Silt Traps / Small Check Dam' },
  { id: 'windbreaks', value: 'Tree Windbreaks' },
  { id: 'minTillage', value: 'Zero / Minimum Tillage' },
] as const;

export interface CreateErosionNoteScreenProps {
  farmId: string;
  plotId?: string | undefined;
  onBack?: (() => void) | undefined;
  onSave?: (() => void) | undefined;
}

interface SavedSuccessData {
  plotName: string;
  riskLevel: ErosionRiskLevel;
  dateStr: string;
  practiceNotes?: string | undefined;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export function CreateErosionNoteScreen({
  farmId,
  plotId: initialPlotId,
  onBack,
  onSave,
}: CreateErosionNoteScreenProps): React.JSX.Element {
  const shell = useSoilFormShell<SavedSuccessData>({ farmId, initialPlotId, onBack, onSave });
  const { state, selectedPlotName } = shell;

  // The risk level is typed (ErosionRiskLevel), so it is kept apart from the
  // free-text fields.
  const [riskLevel, setRiskLevel] = useState<ErosionRiskLevel>('Low Risk');
  const { values, setField, update } = useFormFields(() => ({
    logDate: formatDisplayDate(new Date()),
    practiceNotes: '',
  }));
  const { logDate, practiceNotes } = values;

  const validation = useFieldValidation<ErosionFormField>({
    values: { logDate, practiceNotes },
    rules: EROSION_FORM_RULES,
    order: EROSION_FORM_FIELD_ORDER,
  });

  const handleTogglePreset = (preset: string) => {
    if (!practiceNotes.includes(preset)) {
      update((prev) => ({
        practiceNotes: prev.practiceNotes.trim()
          ? `${prev.practiceNotes.trim()}\n${GLYPH.bullet}${preset}`
          : `${GLYPH.bullet}${preset}`,
      }));
    }
  };

  const handleSelectDate = (date: Date) => {
    update({ logDate: formatDisplayDate(date) });
    shell.setDatePickerVisible(false);
  };

  const handleSave = () =>
    shell.runSave(
      () => {
        if (!state.selectedPlotId) return sf('erosion.error.zoneRequired');
        // Errors render inline under the date and notes fields; it blocks the save here.
        if (!validation.validateAll().valid) return sf('erosion.error.fixFields');
        return null;
      },
      async () => {
        const payload: CreateErosionNoteInput = {
          riskLevel,
          loggedAt: toIsoTimestamp(logDate),
          ...(practiceNotes.trim() ? { practiceNotes: practiceNotes.trim() } : {}),
        };
        await createErosionNote(farmId, state.selectedPlotId, payload);
        return {
          plotName: selectedPlotName,
          riskLevel,
          dateStr: logDate,
          practiceNotes: practiceNotes.trim() || undefined,
        };
      },
      sf('erosion.error.saveFailed'),
    );

  const success = state.successData;

  return (
    <SoilFormShell
      statusBar={<ScreenStatusBar barStyle="dark-content" backgroundColor={P.white} />}
      title={sf('erosion.title')}
      subtitle={sf('erosion.subtitle')}
      state={state}
      onBack={onBack}
      onSelectPlot={shell.selectPlot}
      setZonePickerVisible={shell.setZonePickerVisible}
      setDatePickerVisible={shell.setDatePickerVisible}
      saveLabel={sf('erosion.save')}
      saveA11yLabel={sf('erosion.saveA11y')}
      onSavePress={() => void handleSave()}
      datePickerTitle={sf('erosion.datePickerTitle')}
      datePickerValue={parseSoilDate(logDate)}
      onSelectDate={handleSelectDate}
      successModal={
        <SoilSuccessModal
          visible={!!success}
          onClose={shell.closeSuccess}
          title={sf('erosion.success.title')}
          subtitle={sf('erosion.success.subtitle')}
          plotName={success?.plotName}
          dateLabel={sf('erosion.success.dateLogged')}
          dateValue={success?.dateStr}
        >
          <SuccessContextRow
            label={sf('erosion.success.riskAssessment')}
            value={success ? sf(`erosion.risk.${RISK_ID[success.riskLevel]}.label`) : undefined}
            valueStyle={
              success?.riskLevel === 'Low Risk'
                ? local.successRiskLow
                : success?.riskLevel === 'Moderate Risk'
                ? local.successRiskModerate
                : local.successRiskHigh
            }
          />
          {success?.practiceNotes ? (
            <SuccessContextRow
              label={sf('erosion.success.notes')}
              value={success.practiceNotes}
              numberOfLines={3}
              notes
            />
          ) : null}
        </SoilSuccessModal>
      }
    >
      {/* ── Target Zone ── */}
      <ZonePickerField plotName={selectedPlotName} onOpen={() => shell.setZonePickerVisible(true)} />

      {/* ── Observation Date ── */}
      <DateField
        label={sf('erosion.observationDate')}
        value={logDate}
        onChangeText={setField('logDate')}
        onOpenPicker={() => shell.setDatePickerVisible(true)}
        containerStyle={shared.fieldContainer}
        onBlur={() => validation.onBlur('logDate')}
        error={validation.messageFor('logDate')}
      />

      {/* ── Erosion Risk Level ── */}
      <View style={shared.fieldContainer}>
        <FieldLabel
          label={sf('erosion.riskLabel')}
          required
          icon={<MountainSlopeIcon size={ICON.mountain} color={P.twAmber800} />}
        />

        <View style={local.riskCardsList}>
          {RISK_OPTIONS.map((opt) => {
            const isSelected = riskLevel === opt.level;
            const tone = RISK_TONE[opt.id];
            return (
              <TouchableOpacity
                key={opt.level}
                style={[local.riskCard, isSelected && tone.cardSelected]}
                onPress={() => setRiskLevel(opt.level)}
                activeOpacity={OPACITY.card}
              >
                <View style={local.riskCardHeader}>
                  <View
                    style={[local.riskBadge, isSelected ? tone.badgeSelected : tone.badge]}
                  >
                    <Text style={[local.riskBadgeText, tone.badgeText]}>
                      {sf(`erosion.risk.${opt.id}.label`)}
                    </Text>
                  </View>
                  {isSelected ? (
                    <CheckCircleIcon size={ICON.riskCheck} color={RISK_COLORS[opt.id].text} />
                  ) : (
                    <View style={local.radioUnchecked} />
                  )}
                </View>
                <Text style={local.riskDescText}>{sf(`erosion.risk.${opt.id}.description`)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Conservation Practice Presets ── */}
      <View style={shared.fieldContainer}>
        <Text style={shared.inputLabel}>{sf('erosion.practicesLabel')}</Text>
        <Text style={shared.chipHeader}>{sf('erosion.practicesHint')}</Text>

        <View style={shared.presetChipsWrap}>
          {CONSERVATION_PRESETS.map((preset) => {
            const isIncluded = practiceNotes.includes(preset.value);
            return (
              <PresetChip
                key={preset.id}
                label={sf(`erosion.practice.${preset.id}`)}
                prefix={isIncluded ? GLYPH.check : GLYPH.plus}
                active={isIncluded}
                onPress={() => handleTogglePreset(preset.value)}
              />
            );
          })}
        </View>
      </View>

      {/* ── Detailed Observation Notes ── */}
      <View style={shared.fieldContainer}>
        <FieldLabel label={sf('erosion.notesLabel')} optional />
        <TextInput
          style={[shared.textArea, local.notesArea]}
          value={practiceNotes}
          onChangeText={setField('practiceNotes')}
          placeholder={sf('erosion.notesPlaceholder')}
          placeholderTextColor={P.twGray400}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={SOIL_NOTES_MAX_LENGTH}
          onBlur={() => validation.onBlur('practiceNotes')}
        />
        {validation.messageFor('practiceNotes') ? (
          <Text style={local.fieldError}>{validation.messageFor('practiceNotes')}</Text>
        ) : null}
      </View>
    </SoilFormShell>
  );
}

// ─────────────────────────────────────────────
// Screen-specific styles (shared ones live in ./soilForms/styles)
// ─────────────────────────────────────────────

/** Badge background / text / border colours per risk level. */
const RISK_COLORS = {
  low: { bg: P.twGreen50, text: P.twGreen700, border: P.twGreen600 },
  moderate: { bg: P.twAmber50, text: P.twAmber800, border: P.twAmber600 },
  high: { bg: P.twRed50, text: P.twRed700, border: P.twRed600 },
} as const;

function riskTone(c: (typeof RISK_COLORS)[keyof typeof RISK_COLORS]) {
  return StyleSheet.create({
    cardSelected: { borderColor: c.border, backgroundColor: c.bg },
    badge: { backgroundColor: c.bg, borderColor: c.border },
    badgeSelected: { backgroundColor: P.white, borderColor: c.border },
    badgeText: { color: c.text },
  });
}

const RISK_TONE = {
  low: riskTone(RISK_COLORS.low),
  moderate: riskTone(RISK_COLORS.moderate),
  high: riskTone(RISK_COLORS.high),
} as const;

const local = StyleSheet.create({
  fieldError: {
    fontSize: typography.bodySmall,
    color: P.twRed600,
    marginTop: SP.xs,
  },
  riskCardsList: {
    gap: SP.sm,
    marginTop: SP.xs,
  },
  riskCard: {
    borderRadius: RAD.card,
    borderWidth: DIM.hairline,
    borderColor: P.slate200,
    padding: SP.md,
    backgroundColor: P.white,
  },
  riskCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SP.s6,
  },
  riskBadge: {
    paddingHorizontal: SP.sm,
    paddingVertical: SP.s3,
    borderRadius: RAD.chip,
    borderWidth: DIM.hairline,
  },
  riskBadgeText: {
    fontSize: DIM.smallFont,
    fontWeight: '700',
  },
  radioUnchecked: {
    width: DIM.radio,
    height: DIM.radio,
    borderRadius: DIM.radioRadius,
    borderWidth: DIM.borderThick,
    borderColor: P.slate300,
  },
  riskDescText: {
    fontSize: typography.bodySmall,
    color: P.slate600,
    lineHeight: DIM.lineHeight,
  },
  notesArea: {
    minHeight: DIM.erosionNotesMinHeight,
  },
  successRiskLow: {
    color: P.twGreen700,
    fontWeight: '700',
  },
  successRiskModerate: {
    color: P.twAmber800,
    fontWeight: '700',
  },
  successRiskHigh: {
    color: P.twRed600,
    fontWeight: '700',
  },
});
