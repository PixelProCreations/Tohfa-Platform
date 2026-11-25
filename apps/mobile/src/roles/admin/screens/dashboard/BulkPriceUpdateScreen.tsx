/**
 * Screen 41 — Bulk Price Update, wired to GET /fair-prices (the rows) and
 * POST /fair-prices/bulk (the write).
 *
 * BR-08: only a Super Admin may change a ceiling, so Apply is DISABLED, not
 * hidden, without pricing.fair_price.bulk_update; the list itself needs
 * pricing.fair_price.view. The server authorises both again (CLAUDE.md 2.1).
 *
 * Money (root CLAUDE.md 2.2): the percentage is a percentage, not money. Each
 * new ceiling is computed from the row's real ceiling in integer paise
 * (applyPercentToCeiling) and sent as a Money string. Nothing here parses a
 * rupee string or multiplies a float.
 *
 * All-or-nothing: the server rejects the whole batch if one row fails, so this
 * screen never reports a partial success, and reports no success at all until
 * a real 200 comes back.
 *
 * The design groups crops under Vegetables / Fruits / Dairy / Grains. A fair
 * price ceiling carries no category (pricingTypes: FairPriceRowView.category
 * is null), so the single section header renders the dash rather than inventing
 * four groups. The fixture's hardcoded palette is left exactly as it was.
 */
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Icon, ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import { adminErrorKey } from '../../api/errors';
import { useBulkFairPriceUpdate, useFairPriceList } from '../../api/pricingHooks';
import { buildBulkFairPriceItems, formatPrice, toBulkDraftRows, todayInIndia } from '../../api/pricingMappers';
import { t } from '../../i18n';
import type { Can } from '../../permissions/can';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';
import { queryViewState } from '../warehouse/shared/queryViewState';

const P = {
  pageBg: '#FAF8F5',
  cardBg: '#FFFFFF',
  orange: '#E8562A',
  orangeBg: '#FFECE8',
  orangeText: '#E8562A',
  ink: '#5D2510',
  darkBrown: '#5D2510',
  body: '#6B6560',
  muted: '#9A8F88',
  lightGray: '#B0A9A3',
  border: '#EDE9E4',
  danger: '#C62828',
  success: '#2E7D32',
};

export interface BulkPriceUpdateScreenProps {
  onBack: () => void;
  /** Permission check from /auth/me. Missing means nothing is permitted (fail closed). */
  can?: Can | undefined;
  /** The caller's warehouse, for the query cache key only. */
  warehouseId?: string | undefined;
  /** Fires only after the server applied the batch (a real 200). */
  onApplied?: ((applied: number) => void) | undefined;
}

/** One percentage point, the fixture's step. A UI step, not a business threshold. */
const STEP_PERCENT = 1;

export function BulkPriceUpdateScreen({ onBack, can, warehouseId, onApplied }: BulkPriceUpdateScreenProps) {
  const canView = can !== undefined && can('pricing.fair_price.view');
  const canBulk = can !== undefined && can('pricing.fair_price.bulk_update');
  const list = useFairPriceList(warehouseId, {}, { enabled: canView });
  const write = useBulkFairPriceUpdate({ enabled: canBulk });
  const effectiveFrom = useMemo(() => todayInIndia(), []);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [percentage, setPercentage] = useState(5);
  const [applied, setApplied] = useState<number | null>(null);

  const drafts = useMemo(() => toBulkDraftRows(list.items, selectedIds, percentage), [list.items, selectedIds, percentage]);
  const items = useMemo(() => buildBulkFairPriceItems(drafts, effectiveFrom), [drafts, effectiveFrom]);
  const anySelected = selectedIds.length > 0;

  const toggleSelection = (id: string) => {
    setApplied(null);
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const increment = () => {
    setApplied(null);
    setPercentage((p) => p + STEP_PERCENT);
  };
  const decrement = () => {
    setApplied(null);
    setPercentage((p) => Math.max(STEP_PERCENT, p - STEP_PERCENT));
  };

  const applyDisabled = !canBulk || items === null || write.isPending;
  const errorKey = write.error === undefined || write.error === null ? null : adminErrorKey(write.error);

  const handleApply = () => {
    if (applyDisabled || items === null) return;
    setApplied(null);
    write.run(items, (result) => {
      // Only a real 200 reaches here.
      setApplied(result.applied);
      setSelectedIds([]);
      write.finish();
      if (onApplied) onApplied(result.applied);
    });
  };

  const dash = t('pricingUpdate.noValue');
  const view = queryViewState({ isLoading: list.isLoading, error: list.error, itemCount: list.items.length });

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={P.pageBg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('pricingUpdate.back')}
        >
          <Icon name="chevron_right" size={20} color={P.ink} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Title */}
        <Text style={styles.title}>{t('pricingUpdate.bulk.title')}</Text>
        <Text style={styles.subtitle}>{t('pricingUpdate.bulk.subtitle')}</Text>

        {!canView ? <AdminEmptyState title={t('pricingCeiling.notAvailable.title')} subtitle={t('pricingCeiling.notAvailable.subtitle')} /> : null}
        {canView && view === 'loading' ? <AdminLoadingState /> : null}
        {canView && view === 'error' ? <AdminErrorState error={list.error} onRetry={list.refresh} /> : null}
        {canView && view === 'empty' ? <AdminEmptyState title={t('pricingUpdate.bulk.empty')} /> : null}

        {canView && view === 'ready' ? (
          <>
            {/* Ceiling list. The design's category grouping has no API source, so the
                single section header shows the dash instead of invented groups. */}
            <View style={styles.cropList}>
              <Text style={styles.categoryHeader}>{dash}</Text>
              {drafts.map((draft) => (
                <TouchableOpacity
                  key={draft.row.id}
                  style={styles.cropCard}
                  onPress={() => toggleSelection(draft.row.id)}
                  activeOpacity={0.7}
                  testID={`pricingUpdate.bulk.row.${draft.row.id}`}
                >
                  <View
                    style={[styles.checkbox, draft.selected && styles.checkboxSelected]}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: draft.selected }}
                  >
                    {draft.selected && <Icon name="check" size={16} color="#FFFFFF" />}
                  </View>
                  <View style={styles.cropInfo}>
                    <Text style={styles.cropName}>{draft.row.cropName ?? dash}</Text>
                    <Text style={styles.cropPrice}>
                      {t('pricingUpdate.bulk.currentPrice', { price: formatPrice(draft.row.ceilingPrice) ?? dash })}
                    </Text>
                    {draft.selected ? (
                      <Text style={styles.cropPrice} testID={`pricingUpdate.bulk.row.${draft.row.id}.proposed`}>
                        {t('pricingUpdate.bulk.proposedPrice', { price: formatPrice(draft.proposedCeiling) ?? dash })}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.percentBadge}>
                    <Text style={styles.percentBadgeText}>{t('pricingUpdate.bulk.percent', { percent: percentage })}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Percentage Control */}
            <Text style={styles.sectionLabel}>{t('pricingUpdate.bulk.sectionLabel')}</Text>
            <View style={styles.percentCard}>
              <TouchableOpacity
                style={styles.circleBtn}
                onPress={decrement}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t('pricingUpdate.bulk.decrease')}
                testID="pricingUpdate.bulk.decrease"
              >
                <Text style={styles.btnSymbol}>−</Text>
              </TouchableOpacity>

              <Text style={styles.percentDisplay}>{t('pricingUpdate.bulk.percent', { percent: percentage })}</Text>

              <TouchableOpacity
                style={styles.circleBtn}
                onPress={increment}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t('pricingUpdate.bulk.increase')}
                testID="pricingUpdate.bulk.increase"
              >
                <Text style={styles.btnSymbol}>+</Text>
              </TouchableOpacity>
            </View>

            {/* Apply Button */}
            <TouchableOpacity
              style={[styles.applyBtn, applyDisabled && styles.applyBtnDisabled]}
              onPress={handleApply}
              disabled={applyDisabled}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ disabled: applyDisabled, busy: write.isPending }}
              testID="pricingUpdate.bulk.apply"
            >
              {write.isPending ? (
                <ActivityIndicator color="#FFFFFF" style={{ marginRight: 8 }} />
              ) : (
                <Icon name="check_circle" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              )}
              <Text style={styles.applyBtnText}>
                {write.isPending ? t('pricingUpdate.bulk.applying') : t('pricingUpdate.bulk.apply')}
              </Text>
            </TouchableOpacity>

            <Text style={styles.noteText}>{t('pricingUpdate.bulk.effectiveNote', { date: effectiveFrom })}</Text>
            {!canBulk ? <Text style={styles.noteText}>{t('pricingUpdate.bulk.notPermitted')}</Text> : null}
            {canBulk && anySelected && items === null ? <Text style={styles.noteText}>{t('pricingUpdate.bulk.unreadable')}</Text> : null}
            {errorKey !== null ? (
              <Text style={styles.errorText} testID="pricingUpdate.bulk.error">
                {t(errorKey)}
              </Text>
            ) : null}
            {applied !== null && errorKey === null ? (
              <Text style={styles.successText} testID="pricingUpdate.bulk.applied">
                {t('pricingUpdate.bulk.applied', { count: applied })}
              </Text>
            ) : null}
          </>
        ) : null}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: P.pageBg,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: P.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: P.darkBrown,
    marginBottom: 6,
    letterSpacing: -0.3,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  subtitle: {
    fontSize: 13,
    color: P.lightGray,
    marginBottom: 20,
    lineHeight: 18,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  cropList: {
    gap: 12,
    marginBottom: 24,
  },
  categoryHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: P.darkBrown,
    marginBottom: 8,
    marginTop: 0,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  cropCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.cardBg,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: P.border,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: P.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: P.orange,
    borderColor: P.orange,
  },
  cropInfo: {
    flex: 1,
  },
  cropName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 3,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  cropPrice: {
    fontSize: 12,
    color: P.lightGray,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  percentBadge: {
    backgroundColor: '#FFEBE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  percentBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: P.orangeText,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: P.darkBrown,
    marginBottom: 16,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  percentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    backgroundColor: P.cardBg,
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: P.border,
    marginBottom: 20,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: P.pageBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: P.border,
  },
  btnSymbol: {
    fontSize: 20,
    fontWeight: '400',
    color: P.darkBrown,
    lineHeight: 24,
  },
  percentDisplay: {
    fontSize: 36,
    fontWeight: '700',
    color: P.darkBrown,
    lineHeight: 40,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.orange,
    borderRadius: 10,
    paddingVertical: 14,
  },
  applyBtnDisabled: {
    backgroundColor: P.muted,
    opacity: 0.5,
  },
  applyBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  noteText: {
    fontSize: 12,
    color: P.lightGray,
    marginTop: 10,
    lineHeight: 17,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    color: P.danger,
    marginTop: 10,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  successText: {
    fontSize: 13,
    fontWeight: '600',
    color: P.success,
    marginTop: 10,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
});
