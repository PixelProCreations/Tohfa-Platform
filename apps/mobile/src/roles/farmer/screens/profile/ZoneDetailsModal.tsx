import React, { useRef } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { authPalette as P, useTheme, colors, typography, weights, spacing, radius, MIN_TOUCH_TARGET } from '../../theme';
import { t } from '../../../../i18n/farmer';
import { EXPOSURE_OPTIONS, IRRIGATION_OPTIONS, SOIL_OPTIONS, type ZoneOption } from './zoneMap';
import type { ZoneBoundaryEditor } from './useZoneBoundaryEditor';

interface ZoneDetailsModalProps {
  editor: ZoneBoundaryEditor;
}

/**
 * The zone details popup -- name, area and the three descriptive fields -- driven entirely by the
 * zone editor's draft state (see useZoneBoundaryEditor). The scrim is not tap-to-dismiss: it holds
 * typed input (same treatment as registration Step 3's details popup).
 *
 * On the confirm step (`detailsIntent === 'confirm'`) its Save is what actually writes the zone,
 * so that is the only time it shows a spinner and the editor's save error; opened from the editor
 * card's name button it only keeps the draft, as it always did.
 */
export function ZoneDetailsModal({ editor }: ZoneDetailsModalProps) {
  const { colors } = useTheme();
  const areaInputRef = useRef<TextInput>(null);
  const { draft, updateDraft, metrics, submitting } = editor;
  const isConfirmStep = editor.detailsIntent === 'confirm';

  function renderOptionChips(options: readonly ZoneOption[], value: string, onChange: (next: string) => void) {
    return (
      <View style={styles.chipsRow}>
        {options.map((option) => {
          const isSelected = value === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.chipBtn, isSelected && { backgroundColor: P.lightGreen50, borderColor: colors.brandGreen }]}
              onPress={() => onChange(option.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <Text style={[styles.chipText, isSelected && { color: colors.brandGreen, fontWeight: weights.bold }]}>
                {t(option.labelKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  return (
    <Modal visible={editor.isDetailsOpen} transparent={true} animationType="fade" onRequestClose={editor.closeDetails}>
      <KeyboardAvoidingView style={styles.modalRoot} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modalScrim} pointerEvents="none" />
        <View style={styles.detailsCard}>
          <Text style={[styles.detailsTitle, { color: colors.textDark }]}>{t('farmer.zones.add.details.title')}</Text>
          <Text style={[styles.detailsSubtitle, { color: colors.textSubtle }]}>
            {t('farmer.zones.add.details.subtitle')}
          </Text>

          <ScrollView style={styles.detailsScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={[styles.detailsLabel, { color: colors.textBody }]}>
              {t('farmer.zones.field.name')} <Text style={{ color: colors.requiredRed }}>*</Text>
            </Text>
            <TextInput
              style={styles.detailsInput}
              value={draft.name}
              onChangeText={(name) => updateDraft({ name })}
              placeholder={t('farmer.zones.add.namePlaceholder')}
              placeholderTextColor={colors.textPlaceholder}
              autoFocus={!editor.details.name}
              returnKeyType="next"
              onSubmitEditing={() => areaInputRef.current?.focus()}
              testID="add-zone-name-input"
            />

            <Text style={[styles.detailsLabel, { color: colors.textBody }]}>{t('farmer.zones.add.areaLabel')}</Text>
            <TextInput
              ref={areaInputRef}
              style={styles.detailsInput}
              value={draft.areaText}
              onChangeText={(areaText) => updateDraft({ areaText })}
              keyboardType="decimal-pad"
              placeholder={t('farmer.zones.add.areaPlaceholder')}
              placeholderTextColor={colors.textPlaceholder}
              testID="add-zone-area-input"
            />
            {metrics.areaAcres > 0 ? (
              <Text style={styles.hintText}>
                {t('farmer.zones.add.areaMeasuredHint', { value: metrics.areaAcres.toFixed(2) })}
              </Text>
            ) : null}

            <Text style={[styles.detailsLabel, { color: colors.textBody }]}>{t('farmer.zones.field.soil')}</Text>
            {renderOptionChips(SOIL_OPTIONS, draft.soil, (soil) => updateDraft({ soil }))}

            <Text style={[styles.detailsLabel, { color: colors.textBody }]}>{t('farmer.zones.field.exposure')}</Text>
            {renderOptionChips(EXPOSURE_OPTIONS, draft.exposure, (exposure) => updateDraft({ exposure }))}

            <Text style={[styles.detailsLabel, { color: colors.textBody }]}>{t('farmer.zones.field.irrigation')}</Text>
            {renderOptionChips(IRRIGATION_OPTIONS, draft.irrigation, (irrigation) => updateDraft({ irrigation }))}

            {isConfirmStep && editor.errorMsg ? <Text style={styles.errorText}>{editor.errorMsg}</Text> : null}
          </ScrollView>

          <View style={styles.detailsActions}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.detailsActionBtn, styles.detailsCancelBtn, { borderColor: colors.brandGreen }]}
              onPress={editor.closeDetails}
              disabled={submitting}
            >
              <Text style={[styles.detailsActionText, { color: colors.brandGreen }]}>{t('farmer.common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.detailsActionBtn, { backgroundColor: colors.brandGreen, opacity: submitting ? 0.7 : 1 }]}
              onPress={editor.submitDetails}
              disabled={submitting}
              testID="add-zone-details-save"
            >
              {submitting ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={[styles.detailsActionText, { color: colors.white }]}>{t('farmer.common.save')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  modalScrim: {
    ...StyleSheet.absoluteFillObject,
    // `black` is the token reserved for scrims; dimmed with opacity rather than an rgba literal.
    backgroundColor: P.black,
    opacity: 0.5,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.xl,
    shadowColor: P.black,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  detailsTitle: { fontSize: typography.bodyLarge, fontWeight: '800' },
  detailsSubtitle: { fontSize: typography.bodySmall, marginTop: spacing.xs },
  detailsScroll: { maxHeight: (MIN_TOUCH_TARGET + spacing.lg) * 8, marginTop: spacing.sm },
  detailsLabel: {
    fontSize: typography.bodySmall,
    fontWeight: weights.semibold,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  detailsInput: {
    height: MIN_TOUCH_TARGET,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    borderRadius: radius.card,
    paddingHorizontal: spacing.compact,
    fontSize: typography.body,
    color: colors.textDark,
    backgroundColor: colors.white,
  },
  hintText: { fontSize: typography.bodySmall, color: P.grey600, marginTop: spacing.xs },
  errorText: { color: colors.requiredRed, fontSize: typography.bodySmall, marginTop: spacing.md },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chipBtn: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bgLight,
  },
  chipText: { fontSize: typography.body, color: colors.textDark },
  detailsActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  detailsActionBtn: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsCancelBtn: { borderWidth: 1.5, backgroundColor: colors.white },
  detailsActionText: { fontSize: typography.bodyLarge, fontWeight: weights.bold },
});
