/**
 * Needs Attention: the live warehouse alerts (BR-77) with the viewer's own
 * dismiss and snooze (BR-78).
 *
 * Data: GET /admin/alerts?state=active|snoozed (cursor paged), scoped to
 * scope.warehouseId for a Sub admin (BR-30); Main lists every warehouse it can
 * see, with the warehouse named on each card. Permission `alert.own.view` is
 * checked by the server. Alert types: LOW_STOCK, BATCH_NEAR_EXPIRY,
 * CAPACITY_NEAR_FULL; they carry no severity, so none is shown.
 *
 * Dismiss: POST /admin/alerts/{itemKey}/dismiss. Snooze: POST .../snooze with
 * `until` one hour ahead (the design's snooze; the server caps it with
 * system_config.alert_snooze_max_hours). Neither moves money, so no
 * Idempotency-Key; a replay is harmless.
 *
 * The Sales hub used to open a mock sales-resolution queue here (payment
 * pending, failed sale, invoice issue). No endpoint serves that queue; its
 * categories open this list (stock issue -> LOW_STOCK, see
 * alertFilterFromCategory).
 */
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { adminErrorKey } from '../../../api/errors';
import { t } from '../../../i18n';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType, type AdminTone } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import { useWarehouseOptions } from '../shared/useWarehouseOptions';
import { ChipGroup, WalletButton, WalletScreen, isAllWarehouses, walletLayout } from '../wallet-cashtopup/WalletParts';
import { HOME_CODES } from './HomeParts';
import {
  ALERT_FILTERS,
  ALERT_FILTER_LABEL,
  ALERT_STATE_FILTERS,
  alertFilterFromCategory,
  countAlertsByFilter,
  snoozeUntil,
  warehouseLabel,
  type AlertFilter,
  type AlertStateFilter,
  type AttentionAlert,
} from './mappers_dashboardHome';
import type { AttentionFilter, WarehouseScreenBaseProps } from './types';
import { useAttentionAlerts, useDismissAttentionAlert, useSnoozeAttentionAlert } from './useDashboardHomeData';

const TYPE_TONE: Record<AttentionAlert['type'], AdminTone> = {
  LOW_STOCK: 'danger',
  BATCH_NEAR_EXPIRY: 'warning',
  CAPACITY_NEAR_FULL: 'warning',
  UNKNOWN: 'info',
};

const STATE_LABEL = {
  active: 'alerts.filter.active',
  snoozed: 'alerts.filter.snoozed',
} as const;

function AlertIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 8v4M12 16h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export interface NeedsAttentionScreenProps extends WarehouseScreenBaseProps {
  initialCategory?: AttentionFilter | undefined;
}

export function NeedsAttentionScreen({ scope, can, onBack, initialCategory }: NeedsAttentionScreenProps) {
  const [typeFilter, setTypeFilter] = useState<AlertFilter>(() => alertFilterFromCategory(initialCategory));
  const [stateFilter, setStateFilter] = useState<AlertStateFilter>('active');
  const alerts = useAttentionAlerts(scope, stateFilter);
  const dismiss = useDismissAttentionAlert();
  const snooze = useSnoozeAttentionAlert();
  const allWarehouses = isAllWarehouses(scope);
  const { options } = useWarehouseOptions({ enabled: allWarehouses && can(HOME_CODES.allView) });

  const counts = countAlertsByFilter(alerts.items);
  const visible = alerts.items.filter((a) => typeFilter === 'all' || a.type === typeFilter);
  const state = queryViewState({ isLoading: alerts.isLoading, error: alerts.error, itemCount: alerts.items.length });
  const busy = dismiss.isPending || snooze.isPending;
  const onFail = (error: unknown) => Alert.alert(t('alerts.actionFailed.title'), t(adminErrorKey(error)));

  const scopeLabel = allWarehouses ? t('dashboardHome.allWarehouses') : (scope.warehouseName ?? '');

  return (
    <WalletScreen
      title={t('dashboardHome.alerts.title')}
      subtitle={scopeLabel}
      onBack={onBack}
      headerRight={
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{t('dashboardHome.alerts.count', { count: alerts.items.length })}</Text>
        </View>
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.filters}>
          <ChipGroup options={ALERT_STATE_FILTERS} value={stateFilter} onChange={setStateFilter} labelOf={(f) => t(STATE_LABEL[f])} />
          <ChipGroup
            options={ALERT_FILTERS}
            value={typeFilter}
            onChange={setTypeFilter}
            labelOf={(f) => t('dashboardHome.alerts.filterCount', { label: t(ALERT_FILTER_LABEL[f]), count: counts[f] })}
          />
        </View>

        {state === 'loading' ? (
          <AdminLoadingState />
        ) : state === 'error' ? (
          <AdminErrorState error={alerts.error} onRetry={alerts.refresh} />
        ) : visible.length === 0 ? (
          <AdminEmptyState title={t(stateFilter === 'active' ? 'alerts.empty.active' : 'alerts.empty.snoozed')} />
        ) : (
          visible.map((item) => {
            const tone = TYPE_TONE[item.type];
            return (
              <View key={item.itemKey} style={[styles.card, { borderLeftColor: adminColors[tone].border }]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: adminColors[tone].bg }]}>
                    <AlertIcon color={adminColors[tone].text} />
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardMeta}>
                      {[allWarehouses ? warehouseLabel(options, item.warehouseId) : '', item.since].filter((s) => s !== '').join(' · ')}
                    </Text>
                  </View>
                </View>
                <Text style={styles.noteText}>{item.message}</Text>
                {item.snoozedUntil !== undefined ? (
                  <Text style={styles.cardMeta}>{t('alerts.snoozedUntil', { time: item.snoozedUntil })}</Text>
                ) : null}
                <View style={styles.cardActions}>
                  <WalletButton
                    label={t('alerts.dismiss')}
                    variant="outline"
                    flex
                    disabled={busy}
                    onPress={() => dismiss.mutate(item.itemKey, { onError: onFail })}
                  />
                  {!item.snoozed ? (
                    <WalletButton
                      label={t('dashboardHome.alerts.snooze')}
                      flex
                      disabled={busy}
                      onPress={() => snooze.mutate({ itemKey: item.itemKey, until: snoozeUntil(new Date()) }, { onError: onFail })}
                    />
                  ) : null}
                </View>
              </View>
            );
          })
        )}
        {alerts.hasMore ? <WalletButton label={t('dashboardHome.loadMore')} variant="outline" onPress={alerts.loadMore} /> : null}
      </ScrollView>
    </WalletScreen>
  );
}

const ICON_CIRCLE = 40;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerBadge: {
    backgroundColor: adminColors.brandTint,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.full,
  },
  headerBadgeText: { ...adminType.caption, color: adminColors.brandDeep },
  filters: { marginTop: adminSpacing.sm, marginBottom: adminSpacing.md, gap: adminSpacing.sm },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderLeftWidth: 4,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
    gap: adminSpacing.sm,
    ...adminShadow.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.sm },
  iconCircle: {
    width: ICON_CIRCLE,
    height: ICON_CIRCLE,
    borderRadius: adminRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { ...adminType.sectionHead, color: adminColors.ink },
  cardMeta: { ...adminType.rowMeta, color: adminColors.muted },
  noteText: { ...adminType.body, color: adminColors.muted },
  cardActions: { flexDirection: 'row', gap: adminSpacing.sm },
});
