import React from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Icon } from '@tohfa/mobile-ui';
import { authPalette as P, useTheme, colors, typography, weights, spacing, radius, MIN_TOUCH_TARGET } from '../../theme';
import { t, type TranslationKey } from '../../../../i18n/farmer';
import { manualRowIssue, type ManualRowIssue } from '../registration/manualPoints';
import type { ZoneBoundaryEditor } from './useZoneBoundaryEditor';

interface ZoneBoundaryEditorCardProps {
  editor: ZoneBoundaryEditor;
  /** The colour the zone is drawn in on the map -- its swatch here uses the same one. */
  zoneColor: string;
}

/** i18n key for one manual point row's own inline problem (see `manualRowIssue`). */
const MANUAL_ROW_ISSUE_KEY: Record<ManualRowIssue, TranslationKey> = {
  incomplete: 'farmer.registration.step3.bothCoordinates',
  latitudeRange: 'farmer.registration.step3.latitudeRange',
  longitudeRange: 'farmer.registration.step3.longitudeRange',
};

/**
 * The bottom card while one zone is being drawn or edited on the Zones map: its name (opening the
 * details popup), how it is positioned, the mapped area and point count, the vertex-edit and
 * delete-boundary actions, and the typed-coordinates fallback. Purely presentational -- every value
 * and handler comes from useZoneBoundaryEditor.
 *
 * Edit-vertices, Delete boundary and manual entry stay here as labelled buttons rather than joining
 * the map's icon row: each needs its words to be understood, and they are used far less often than
 * draw / undo / confirm.
 */
export function ZoneBoundaryEditorCard({ editor, zoneColor }: ZoneBoundaryEditorCardProps) {
  const { colors } = useTheme();
  const { mode, details, hasBoundary, metrics, pointCount, positioning, manualPoints, manualShape } = editor;

  const positioningBadge = editor.isEditingMap ? (
    <View style={[styles.badge, { backgroundColor: P.orange50 }]}>
      <Text style={[styles.badgeText, { color: P.orange900 }]}>{t('farmer.registration.step3.editing')}</Text>
    </View>
  ) : positioning === 'drawn' ? (
    <View style={[styles.badge, { backgroundColor: colors.brandGreenLight }]}>
      <Text style={[styles.badgeText, { color: colors.brandGreen }]}>{t('farmer.zones.add.badge.drawn')}</Text>
    </View>
  ) : positioning === 'manual' ? (
    <View style={[styles.badge, { backgroundColor: P.blue50 }]}>
      <Text style={[styles.badgeText, { color: P.blue700 }]}>{t('farmer.registration.step3.manualBadge')}</Text>
    </View>
  ) : (
    <View style={[styles.badge, { backgroundColor: P.grey100 }]}>
      <Text style={[styles.badgeText, { color: P.grey600 }]}>{t('farmer.zones.add.badge.none')}</Text>
    </View>
  );

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.zoneNameButton}
          onPress={() => editor.openDetails('edit')}
          accessibilityRole="button"
          accessibilityLabel={t('farmer.zones.add.editDetailsA11y')}
          testID="add-zone-details"
        >
          <View style={[styles.zoneSwatch, { backgroundColor: zoneColor }]} />
          <View style={styles.zoneNameTextCol}>
            <Text style={styles.zoneName} numberOfLines={1}>
              {details.name.trim() || t('farmer.zones.add.unnamed')}
            </Text>
            <Text style={styles.zoneNameSub} numberOfLines={1}>
              {details.name.trim()
                ? details.areaText.trim()
                  ? t('farmer.zones.acres', { value: details.areaText.trim() })
                  : ''
                : t('farmer.zones.add.tapToName')}
            </Text>
          </View>
          <Icon name="edit" size={14} color={colors.brandGreen} />
        </TouchableOpacity>
        {positioningBadge}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>{t('farmer.zones.add.stat.mappedArea')}</Text>
          <Text style={styles.statValue}>
            {metrics.areaAcres > 0 ? t('farmer.zones.acres', { value: metrics.areaAcres.toFixed(2) }) : '—'}
          </Text>
        </View>
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>{t('farmer.zones.add.stat.points')}</Text>
          <Text style={styles.statValue}>{pointCount}</Text>
          <Text style={styles.statSub}>{t('farmer.zones.add.stat.pointsSub')}</Text>
        </View>
      </View>

      {/* Only a zone loaded as it was saved can be here -- the map refuses new out-of-farm taps
          and drags. Shown up front so the farmer knows what to fix before trying to save. */}
      {editor.boundaryOutsideFarm ? (
        <Text style={[styles.fieldErrorText, styles.boundaryWarningText]}>
          {t('farmer.zones.add.boundaryOutsideFarm')}
        </Text>
      ) : null}

      <View style={styles.boundaryActionsRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.boundaryActionBtn,
            mode === 'edit' ? { backgroundColor: colors.brandGreen } : styles.editBtn,
            mode === 'view' && !hasBoundary && styles.disabledBtn,
          ]}
          onPress={editor.handleEditBoundary}
          disabled={mode === 'view' && !hasBoundary}
          accessibilityRole="button"
          accessibilityState={{ disabled: mode === 'view' && !hasBoundary }}
        >
          <Text style={mode === 'edit' ? styles.doneBtnText : styles.editBtnText}>
            {mode === 'edit' ? t('farmer.map.doneEditing') : t('farmer.map.editBoundary')}
          </Text>
        </TouchableOpacity>
        {hasBoundary && mode === 'view' ? (
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.boundaryActionBtn, styles.deleteBtn]}
            onPress={editor.handleDeleteBoundary}
            accessibilityRole="button"
            testID="add-zone-delete-boundary"
          >
            <Icon name="delete" size={15} color={colors.requiredRed} />
            <Text style={styles.deleteBtnText}>{t('farmer.zones.add.deleteBoundary')}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Fallback when drawing on the map is not practical -- a link under the primary path, not a
          second button competing with it (same as Step 3). */}
      <TouchableOpacity activeOpacity={0.7} style={styles.manualToggle} onPress={editor.handleToggleManualEntry}>
        <Text style={[styles.manualToggleText, { color: colors.brandGreen }]}>
          {editor.manualEntryOpen ? t('farmer.zones.add.manualEntryHide') : t('farmer.zones.add.manualEntryToggle')}
        </Text>
      </TouchableOpacity>

      {editor.manualEntryOpen ? (
        <View>
          <ScrollView style={styles.manualPointsList} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
            {manualPoints.map((row, index) => {
              const issue = manualRowIssue(row);
              // Checked only once the row is otherwise fine, so each row shows one message at most.
              // A point is a lat/lng PAIR, so being outside the farm marks both fields.
              const outsideFarm = issue === null && editor.isManualRowOutsideFarm(row);
              const latHasError =
                outsideFarm || issue === 'latitudeRange' || (issue === 'incomplete' && row.latText.trim() === '');
              const lngHasError =
                outsideFarm || issue === 'longitudeRange' || (issue === 'incomplete' && row.lngText.trim() === '');
              return (
                <View key={row.id} style={styles.manualPointBlock}>
                  <View style={styles.manualPointRow}>
                    <Text style={styles.manualPointIndex}>{index + 1}</Text>
                    <TextInput
                      style={[styles.fieldInput, latHasError && styles.inputError]}
                      value={row.latText}
                      onChangeText={(text) => editor.handleManualPointChange(row.id, 'latText', text)}
                      keyboardType="numbers-and-punctuation"
                      placeholder={t('farmer.registration.gps.manualLat')}
                      placeholderTextColor={colors.textPlaceholder}
                      accessibilityLabel={t('farmer.registration.gps.manualLat')}
                    />
                    <TextInput
                      style={[styles.fieldInput, lngHasError && styles.inputError]}
                      value={row.lngText}
                      onChangeText={(text) => editor.handleManualPointChange(row.id, 'lngText', text)}
                      keyboardType="numbers-and-punctuation"
                      placeholder={t('farmer.registration.gps.manualLng')}
                      placeholderTextColor={colors.textPlaceholder}
                      accessibilityLabel={t('farmer.registration.gps.manualLng')}
                    />
                    {manualPoints.length >= 2 ? (
                      <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.manualPointRemoveBtn}
                        onPress={() => editor.handleRemoveManualPoint(row.id)}
                        accessibilityRole="button"
                        accessibilityLabel={t('farmer.registration.step3.manualRemovePoint', { index: index + 1 })}
                      >
                        <Icon name="close" size={16} color={colors.textSubtle} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  {issue ? (
                    <Text style={styles.fieldErrorText}>{t(MANUAL_ROW_ISSUE_KEY[issue])}</Text>
                  ) : outsideFarm ? (
                    <Text style={styles.fieldErrorText}>{t('farmer.zones.add.manualRowOutsideFarm')}</Text>
                  ) : null}
                </View>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.manualAddPointBtn}
            onPress={editor.handleAddManualPoint}
            accessibilityRole="button"
          >
            <Icon name="add" size={14} color={colors.brandGreen} />
            <Text style={[styles.manualAddPointText, { color: colors.brandGreen }]}>
              {t('farmer.registration.step3.manualAddPoint')}
            </Text>
          </TouchableOpacity>

          {editor.manualShapeError ? (
            <Text style={styles.fieldErrorText}>{editor.manualShapeError}</Text>
          ) : manualShape.kind === 'empty' ? (
            <Text style={styles.manualHintText}>{t('farmer.zones.add.manualPointsHint')}</Text>
          ) : null}
        </View>
      ) : null}

      {editor.errorMsg ? <Text style={styles.fieldErrorText}>{editor.errorMsg}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    shadowColor: P.black,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  zoneNameButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: MIN_TOUCH_TARGET,
  },
  zoneSwatch: { width: spacing.lg, height: spacing.lg, borderRadius: radius.sm },
  zoneNameTextCol: { flexShrink: 1 },
  zoneName: { fontSize: typography.bodyLarge, fontWeight: '800', color: P.nearBlack },
  zoneNameSub: { fontSize: typography.caption, fontWeight: weights.semibold, color: P.grey600 },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
  },
  badgeText: { fontSize: typography.caption, fontWeight: weights.bold },

  statsRow: { flexDirection: 'row', marginBottom: spacing.sm },
  statCol: { flex: 1 },
  statLabel: { fontSize: typography.caption, color: P.grey600, fontWeight: weights.bold, marginBottom: spacing.xs },
  statValue: { fontSize: typography.body, fontWeight: '800', color: P.nearBlack },
  statSub: { fontSize: typography.caption, color: P.grey600, marginTop: 2 },

  boundaryActionsRow: { flexDirection: 'row', gap: spacing.sm },
  boundaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtn: { borderWidth: 1.5, borderColor: colors.brandGreen },
  editBtnText: { color: colors.brandGreen, fontSize: typography.bodySmall, fontWeight: weights.bold },
  doneBtnText: { color: colors.white, fontSize: typography.bodySmall, fontWeight: weights.bold },
  disabledBtn: { opacity: 0.5 },
  deleteBtn: { borderWidth: 1.5, borderColor: colors.requiredRed },
  deleteBtnText: { color: colors.requiredRed, fontSize: typography.bodySmall, fontWeight: weights.bold },

  manualToggle: { marginTop: spacing.sm, alignSelf: 'center', minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' },
  manualToggleText: { fontSize: typography.bodySmall, fontWeight: weights.semibold },
  // Three rows' worth before the list scrolls, so a long typed outline never pushes the card up
  // over the whole map (same cap as Step 3).
  manualPointsList: { maxHeight: (MIN_TOUCH_TARGET + spacing.sm) * 3 },
  manualPointBlock: { marginBottom: spacing.sm },
  manualPointRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  manualPointIndex: {
    minWidth: spacing.lg,
    textAlign: 'center',
    fontSize: typography.bodySmall,
    fontWeight: weights.bold,
    color: P.grey600,
  },
  fieldInput: {
    flex: 1,
    height: MIN_TOUCH_TARGET,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    borderRadius: radius.card,
    paddingHorizontal: spacing.compact,
    fontSize: typography.body,
    color: colors.textDark,
    backgroundColor: colors.white,
  },
  inputError: { borderColor: colors.requiredRed },
  manualPointRemoveBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualAddPointBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    minHeight: MIN_TOUCH_TARGET,
  },
  manualAddPointText: { fontSize: typography.body, fontWeight: weights.semibold },
  manualHintText: { fontSize: typography.bodySmall, color: P.grey600, marginTop: spacing.xs },
  fieldErrorText: { color: colors.requiredRed, fontSize: typography.bodySmall, marginTop: spacing.xs },
  boundaryWarningText: { marginTop: 0, marginBottom: spacing.sm },
});
