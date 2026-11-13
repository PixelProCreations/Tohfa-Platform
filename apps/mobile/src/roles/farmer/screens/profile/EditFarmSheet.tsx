/**
 * FMB Sketch -> a farm's Edit button: every farm detail PATCH /farms/{farmId} accepts (name, area,
 * village, taluk, district, notes) plus the boundary, on the same Step 3 map controls as the main
 * map (FarmMapPanel). Saves everything in ONE PATCH so details and boundary can never half-save.
 *
 * Rendered by the caller only while a farm is being edited, so its map (and Mapbox view) only
 * exists while the sheet is open, and every open starts from a fresh draft.
 */
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Icon, ModalSafeArea, type FarmBoundaryMapHandle, type FarmBoundaryMapMode } from '@tohfa/mobile-ui';
import { colors, radius, spacing, typography } from '../../theme';
import { authPalette as P } from '../../theme';
import { calculatePolygonMetrics } from '../../utils/geo';
import { t, type TranslationKey } from '../../../../i18n/farmer';
import { formatErrorMessage } from '../../../../shell/api/client';
import { updateFarm, type Farm } from '../../api/farms';
import { buildFarmMapTarget } from './farmMapPreview';
import { FarmMapPanel } from './FarmMapPanel';
import type { MapboxFeature } from '../registration/mapControls';
import {
  buildFarmUpdate,
  draftFromFarm,
  NAME_MAX,
  NOTES_MAX,
  PLACE_MAX,
  openVertexCount,
  type EditFarmDraft,
  type EditFarmErrors,
  type EditFarmField,
  type LngLatPair,
} from './editFarmForm';

interface EditFarmSheetProps {
  farm: Farm;
  /** True when the sheet opens straight after "Add another farm": the title says Add, not Edit. */
  isNew?: boolean;
  /** The ring to start from: the main map's live one when it is the same farm, else the saved one. */
  initialCoords: LngLatPair[];
  onClose: () => void;
  onSaved: (updated: Farm) => void;
}

function errorText(key: EditFarmErrors[EditFarmField]): string | null {
  return key ? t(`farmer.fmb.edit.${key}` as TranslationKey) : null;
}

export function EditFarmSheet({ farm, isNew = false, initialCoords, onClose, onSaved }: EditFarmSheetProps) {
  const mapRef = useRef<FarmBoundaryMapHandle>(null);
  const [draft, setDraft] = useState<EditFarmDraft>(() => draftFromFarm(farm, initialCoords));
  const [mode, setMode] = useState<FarmBoundaryMapMode>('view');
  const [errors, setErrors] = useState<EditFarmErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Opens on the farm's own saved position; the drawn shape itself comes from `initialCoords`.
  const target = buildFarmMapTarget(farm);
  const points = openVertexCount(draft.coords);
  const measuredAcres = points >= 3 ? calculatePolygonMetrics(draft.coords).areaAcres : 0;

  function setField<K extends keyof EditFarmDraft>(field: K, value: EditFarmDraft[K]) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  /** Step 3 keeps the searched place's village and district; so does this form (only if blank). */
  function handlePlaceSelected(item: MapboxFeature) {
    const district = item.context?.find((c) => c.id.startsWith('district'))?.text;
    setDraft((prev) => ({
      ...prev,
      village: prev.village.trim() ? prev.village : (item.text ?? prev.village),
      district: prev.district.trim() || !district ? prev.district : district,
    }));
  }

  async function handleSave() {
    if (saving) return;
    const result = buildFarmUpdate(farm, draft);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updateFarm(farm.id, result.body);
      onSaved(updated);
    } catch (err) {
      setSaveError(formatErrorMessage(err, t('farmer.fmb.edit.saveError')));
    } finally {
      setSaving(false);
    }
  }

  function renderInput(
    field: Exclude<EditFarmField, 'boundary'>,
    draftKey: Exclude<keyof EditFarmDraft, 'coords'>,
    labelKey: TranslationKey,
    placeholderKey: TranslationKey | null,
    extra?: { keyboardType?: 'decimal-pad'; multiline?: boolean; maxLength?: number },
  ) {
    const message = errorText(errors[field]);
    return (
      <View style={styles.field}>
        <Text style={styles.label}>{t(labelKey)}</Text>
        <TextInput
          style={[styles.input, extra?.multiline && styles.inputMultiline, message ? styles.inputError : null]}
          value={draft[draftKey]}
          onChangeText={(value: string) => setField(draftKey, value)}
          placeholder={placeholderKey ? t(placeholderKey) : undefined}
          placeholderTextColor={colors.textPlaceholder}
          keyboardType={extra?.keyboardType}
          multiline={extra?.multiline}
          editable={!saving}
          maxLength={extra?.maxLength}
          testID={`fmb-edit-farm-${field}`}
        />
        {message ? <Text style={styles.errorText}>{message}</Text> : null}
      </View>
    );
  }

  const boundaryMessage = errorText(errors.boundary);

  return (
    <Modal
      visible={true}
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <ModalSafeArea style={styles.screen}>
        <View style={styles.header}>
          <View style={styles.headerTitleBox}>
            <Text style={styles.title}>{t(isNew ? 'farmer.fmb.edit.addTitle' : 'farmer.fmb.edit.title')}</Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {farm.name}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.common.close')}
            testID="fmb-edit-farm-close"
          >
            <Icon name="close" size={20} color={colors.textSubtle} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          // A drag on the map while drawing must move vertices, not the form.
          scrollEnabled={mode === 'view'}
        >
          <Text style={styles.sectionTitle}>{t('farmer.fmb.edit.boundaryLabel')}</Text>
          <FarmMapPanel
            mapRef={mapRef}
            mapKey={farm.id}
            target={target}
            coords={draft.coords}
            onPolygonChange={(next) => setField('coords', next)}
            mode={mode}
            onModeChange={setMode}
            testIDPrefix="fmb-edit"
            containerStyle={styles.mapContainer}
            onPlaceSelected={handlePlaceSelected}
          />
          <View style={styles.padded}>
            <Text style={styles.boundarySummary} testID="fmb-edit-farm-boundary-summary">
              {points >= 3
                ? t('farmer.fmb.edit.boundarySummary', { points, area: measuredAcres.toFixed(2) })
                : t('farmer.fmb.edit.boundaryNone')}
            </Text>
            {boundaryMessage ? <Text style={styles.errorText}>{boundaryMessage}</Text> : null}

            <Text style={styles.sectionTitle}>{t('farmer.fmb.edit.detailsLabel')}</Text>
            {renderInput('name', 'name', 'farmer.fmb.edit.nameLabel', 'farmer.fmb.edit.namePlaceholder', { maxLength: NAME_MAX })}
            {renderInput('area', 'areaText', 'farmer.fmb.edit.areaLabel', 'farmer.fmb.edit.areaPlaceholder', {
              keyboardType: 'decimal-pad',
              maxLength: 12,
            })}
            {renderInput('village', 'village', 'farmer.fmb.edit.villageLabel', null, { maxLength: PLACE_MAX })}
            {renderInput('taluk', 'taluk', 'farmer.fmb.edit.talukLabel', null, { maxLength: PLACE_MAX })}
            {renderInput('district', 'district', 'farmer.fmb.edit.districtLabel', null, { maxLength: PLACE_MAX })}
            <Text style={styles.hint}>{t('farmer.fmb.edit.placeHint')}</Text>
            {renderInput('notes', 'notes', 'farmer.fmb.edit.notesLabel', 'farmer.fmb.edit.notesPlaceholder', {
              multiline: true,
              maxLength: NOTES_MAX,
            })}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          {saveError ? (
            <Text style={[styles.errorText, styles.footerError]} testID="fmb-edit-farm-error">
              {saveError}
            </Text>
          ) : null}
          <View style={styles.footerRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={saving}
              accessibilityRole="button"
              testID="fmb-edit-farm-cancel"
            >
              <Text style={styles.cancelText}>{t('farmer.common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnBusy]}
              onPress={() => void handleSave()}
              disabled={saving}
              accessibilityRole="button"
              accessibilityState={{ busy: saving, disabled: saving }}
              testID="fmb-edit-farm-save"
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.saveText}>{t('farmer.fmb.edit.save')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ModalSafeArea>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgLight },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.input,
    paddingVertical: spacing.lg,
  },
  headerTitleBox: { flex: 1 },
  title: { fontSize: typography.title, fontWeight: '700', color: colors.textDark },
  subtitle: { fontSize: typography.body, color: colors.textSubtle, marginTop: spacing.xs / 2 },
  closeBtn: {
    width: spacing.largeSection,
    height: spacing.largeSection,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: P.grey300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xl },
  padded: { paddingHorizontal: spacing.input },
  sectionTitle: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: colors.textSubtle,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.input,
  },
  // Same height as FMB Sketch's own map panel.
  mapContainer: { width: '100%', height: 360, position: 'relative' },
  boundarySummary: {
    fontSize: typography.body,
    color: colors.textDark,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  field: { marginBottom: spacing.md },
  label: { fontSize: typography.body, fontWeight: '600', color: colors.textDark, marginBottom: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.bodyLarge,
    color: colors.textDark,
    backgroundColor: colors.white,
  },
  inputMultiline: { minHeight: spacing.modalGap + spacing.lg, textAlignVertical: 'top' },
  inputError: { borderColor: P.red600 },
  hint: { fontSize: typography.bodySmall, color: colors.textSubtle, marginTop: -spacing.xs, marginBottom: spacing.md },
  errorText: { color: P.red600, fontSize: typography.bodySmall, fontWeight: '600', marginTop: spacing.xs },
  footer: {
    paddingHorizontal: spacing.input,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderDivider,
    backgroundColor: colors.bgLight,
  },
  footerError: { textAlign: 'center', marginBottom: spacing.sm, marginTop: 0 },
  footerRow: { flexDirection: 'row', gap: spacing.md },
  cancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { fontSize: typography.bodyLarge, fontWeight: '600', color: colors.textSubtle },
  saveBtn: {
    flex: 2,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.brandGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnBusy: { opacity: 0.7 },
  saveText: { fontSize: typography.bodyLarge, fontWeight: '700', color: colors.white },
});
