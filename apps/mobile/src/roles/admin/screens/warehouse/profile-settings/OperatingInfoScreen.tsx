/**
 * Operating Information for the Main and Sub warehouse admins (FINAL_LIST #81).
 *
 * Was roles/subwarehouse SubWarehouseOperatingInfoScreen. Gate: none.
 * Read-only for both roles here: warehouse.profile.edit (the operating-hours
 * edit, PATCH /warehouses/{id}) is `none` for a Sub admin, and Main's edit is
 * a later phase. Sub sees its own warehouse (locked pill); Main picks one in
 * the header selector.
 *
 * Live (plan phase 8): the status and the week come from GET
 * /warehouses/{id} (`isActive`, `operatingHours`). The hours are read only
 * in the one shape docs/openapi.yaml defines (all seven days, closed or
 * HH:MM-HH:MM); anything else, or nothing stored, reads "not configured"
 * (./mappers.ts toOperatingWeek). Today's row is the IST weekday.
 *
 * Hidden, because the warehouse record has no such field: Operational
 * Services, Fulfillment Information, Daily Operational Capacity, Special
 * Operating Days and Operating Notes.
 */
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import { Card, InfoNote, SectionTitle, WalletScreen, WarehouseTabBar } from '../wallet-cashtopup/WalletParts';
import { StatusDot } from './ProfileParts';
import type { OperatingDayView, WarehouseProfileView, WarehouseScreenBaseProps, WarehouseSelectionProps } from './types';
import { DetailRow, singleWarehouseId, SingleWarehouseHeader, warehouseProfileLayout } from './WarehouseProfileParts';

export interface OperatingInfoScreenProps extends WarehouseScreenBaseProps, WarehouseSelectionProps {
  /** The live warehouse (GET /warehouses/{id}); undefined until it loads. */
  profile?: WarehouseProfileView | undefined;
  /** The stored week (./mappers.ts toOperatingWeek); null = not configured. */
  week?: readonly OperatingDayView[] | null | undefined;
  /** There is no warehouse the API knows to ask for (Main with a sample selection). */
  unavailable?: boolean | undefined;
  isLoading?: boolean | undefined;
  error?: unknown;
  onRetry?: (() => void) | undefined;
  onRefresh?: (() => void) | undefined;
  isRefreshing?: boolean | undefined;
}

export function OperatingInfoScreen({
  scope,
  onBack,
  onTabChange,
  warehouseOptions,
  selectedWarehouseId,
  onSelectWarehouse,
  profile,
  week = null,
  unavailable = false,
  isLoading = false,
  error,
  onRetry,
  onRefresh,
  isRefreshing = false,
}: OperatingInfoScreenProps) {
  const headerWarehouseId = singleWarehouseId(scope, selectedWarehouseId, warehouseOptions);
  const state = unavailable ? 'unavailable' : profile !== undefined ? 'ready' : queryViewState({ isLoading, error, itemCount: 0 });
  const todayRow = week?.find((d) => d.isToday);

  return (
    <WalletScreen
      title="Operating Information"
      onBack={onBack}
      headerExtra={
        <SingleWarehouseHeader scope={scope} warehouseId={headerWarehouseId} options={warehouseOptions} onSelect={onSelectWarehouse} />
      }
      footer={onTabChange ? <WarehouseTabBar onTabChange={onTabChange} onBack={onBack} /> : undefined}
    >
      {state === 'unavailable' ? (
        <AdminEmptyState title={t('profile.warehouse.unavailable')} />
      ) : state === 'loading' ? (
        <AdminLoadingState />
      ) : state !== 'ready' || profile === undefined ? (
        <AdminErrorState error={error} onRetry={onRetry} />
      ) : (
        <ScrollView
          contentContainerStyle={warehouseProfileLayout.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={onRefresh ? <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} /> : undefined}
        >
          <SectionTitle>Operating Status</SectionTitle>
          <Card>
            <Text style={styles.label}>Warehouse Status</Text>
            <View style={styles.statusRow}>
              <StatusDot color={profile.isActive ? adminColors.success.text : adminColors.danger.text} />
              <Text style={[styles.statusText, !profile.isActive && styles.statusClosed]}>{profile.statusLabel}</Text>
            </View>
          </Card>
          <View style={warehouseProfileLayout.gap} />
          <InfoNote>
            Warehouse admins cannot change this status; it is managed by authorized higher-level warehouse configuration roles.
          </InfoNote>

          {week === null ? (
            <>
              <SectionTitle>Operating Hours</SectionTitle>
              <AdminEmptyState title={t('profile.operating.notConfigured')} />
            </>
          ) : (
            <>
              <View style={warehouseProfileLayout.gap} />
              <View style={styles.todayCard}>
                <Text style={styles.todayLabel}>{t('profile.operating.today')}</Text>
                <Text style={styles.todayValue}>
                  {todayRow?.hours ? t('profile.operating.openNow', { hours: todayRow.hours }) : t('profile.operating.closed')}
                </Text>
              </View>

              <SectionTitle>Operating Hours</SectionTitle>
              <Card>
                {week.map((day, index) => (
                  <DetailRow
                    key={day.day}
                    first={index === 0}
                    highlight={day.isToday}
                    label={day.isToday ? t('profile.operating.dayToday', { day: day.day }) : day.day}
                    value={day.hours ?? t('profile.operating.closed')}
                    valueTone={day.hours ? undefined : 'danger'}
                  />
                ))}
              </Card>
            </>
          )}
        </ScrollView>
      )}
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  label: { ...adminType.rowMeta, color: adminColors.muted },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.sm, marginTop: adminSpacing.xs },
  statusText: { ...adminType.sectionHead, color: adminColors.success.text },
  statusClosed: { color: adminColors.danger.text },
  todayCard: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.brandSoft.border,
    padding: adminSpacing.lg,
  },
  todayLabel: { ...adminType.rowMeta, color: adminColors.brandDeep },
  todayValue: { ...adminType.sectionHead, color: adminColors.brandDeep, marginTop: 2 },
});
