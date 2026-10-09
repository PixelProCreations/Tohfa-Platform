/**
 * Operating Information for the Main and Sub warehouse admins (FINAL_LIST #81).
 *
 * Was roles/subwarehouse SubWarehouseOperatingInfoScreen. Gate: none.
 * Read-only for both roles: there is no edit control and no rbac code or
 * endpoint for warehouse operating hours / services (SPEC_GAPS W4m-1). Sub
 * sees its own warehouse (locked pill); Main picks one of the four in the
 * header selector.
 *
 * The week no longer hard-codes "Thursday (Today)": today's row is derived
 * from the device date. Hours, services and capacities come from the
 * warehouse record (mock until an endpoint exists), never from the screen.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import {
  Card,
  CheckIcon,
  EmptyState,
  InfoCard,
  InfoNote,
  SectionTitle,
  WalletScreen,
  WarehouseTabBar,
} from '../wallet-cashtopup/WalletParts';
import { StatusDot } from './ProfileParts';
import type { OperatingInfo, WarehouseScreenBaseProps, WarehouseSelectionProps } from './types';
import { OPERATING_INFO, PROFILE_WAREHOUSES } from './warehouseFixtures';
import { DetailRow, recordFor, singleWarehouseId, SingleWarehouseHeader, warehouseProfileLayout } from './WarehouseProfileParts';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export interface OperatingInfoScreenProps extends WarehouseScreenBaseProps, WarehouseSelectionProps {
  operatingInfo?: readonly OperatingInfo[] | undefined;
  /** Injected for tests; defaults to the device clock. */
  today?: Date | undefined;
}

export function OperatingInfoScreen({
  scope,
  onBack,
  onTabChange,
  warehouseOptions = PROFILE_WAREHOUSES,
  selectedWarehouseId,
  onSelectWarehouse,
  operatingInfo = OPERATING_INFO,
  today = new Date(),
}: OperatingInfoScreenProps) {
  const warehouseId = singleWarehouseId(scope, selectedWarehouseId, warehouseOptions);
  const info = recordFor(operatingInfo, warehouseId);
  const todayName = WEEKDAYS[today.getDay()];
  const todayRow = info?.week.find((d) => d.day === todayName);

  return (
    <WalletScreen
      title="Operating Information"
      onBack={onBack}
      headerExtra={
        <SingleWarehouseHeader scope={scope} warehouseId={warehouseId} options={warehouseOptions} onSelect={onSelectWarehouse} />
      }
      footer={onTabChange ? <WarehouseTabBar onTabChange={onTabChange} onBack={onBack} /> : undefined}
    >
      {info === undefined ? (
        <EmptyState title="No operating information" subtitle="Nothing is configured for this warehouse yet." />
      ) : (
        <ScrollView contentContainerStyle={warehouseProfileLayout.scrollContent} showsVerticalScrollIndicator={false}>
          <SectionTitle>Operating Status</SectionTitle>
          <Card>
            <Text style={styles.label}>Warehouse Status</Text>
            <View style={styles.statusRow}>
              <StatusDot color={info.status === 'Operational' ? adminColors.success.text : adminColors.danger.text} />
              <Text style={[styles.statusText, info.status !== 'Operational' && styles.statusClosed]}>{info.status}</Text>
            </View>
          </Card>
          <View style={warehouseProfileLayout.gap} />
          <InfoNote>
            Warehouse admins cannot change this status; it is managed by authorized higher-level warehouse configuration roles.
          </InfoNote>
          <View style={warehouseProfileLayout.gap} />
          <View style={styles.todayCard}>
            <Text style={styles.todayLabel}>Today</Text>
            <Text style={styles.todayValue}>{todayRow?.hours ? `Open · ${todayRow.hours}` : 'Closed'}</Text>
          </View>

          <SectionTitle>Operating Hours</SectionTitle>
          <Card>
            {info.week.map((day, index) => {
              const isToday = day.day === todayName;
              return (
                <DetailRow
                  key={day.day}
                  first={index === 0}
                  highlight={isToday}
                  label={isToday ? `${day.day} (Today)` : day.day}
                  value={day.hours ?? 'Closed'}
                  valueTone={day.hours ? undefined : 'danger'}
                />
              );
            })}
          </Card>

          <SectionTitle>Operational Services</SectionTitle>
          <Card>
            <View style={styles.services}>
              {info.services.map((service) => (
                <View key={service} style={styles.servicePill}>
                  <CheckIcon size={14} color={adminColors.success.text} />
                  <Text style={styles.serviceText}>{service}</Text>
                </View>
              ))}
            </View>
          </Card>
          <View style={warehouseProfileLayout.gap} />
          <InfoNote>Only services actually configured for this warehouse are shown.</InfoNote>

          <SectionTitle>Fulfillment Information</SectionTitle>
          <InfoCard rows={pairs(info.fulfillment.map((f) => ({ label: f.label, value: f.value })))} />

          <SectionTitle>Daily Operational Capacity</SectionTitle>
          <Card>
            {info.dailyCapacity.map((row, index) => (
              <DetailRow key={row.label} first={index === 0} label={row.label} value={row.value} />
            ))}
          </Card>
          <View style={warehouseProfileLayout.gap} />
          <InfoNote>Capacity numbers are shown only when configured.</InfoNote>

          {info.specialDays.length > 0 ? (
            <>
              <SectionTitle>Special Operating Days</SectionTitle>
              <Card>
                {info.specialDays.map((row, index) => (
                  <DetailRow key={row.date} first={index === 0} label={row.date} value={row.note} valueTone="danger" />
                ))}
              </Card>
            </>
          ) : null}

          <SectionTitle>Operating Notes</SectionTitle>
          <Card>
            <Text style={styles.notes}>{info.notes}</Text>
          </Card>
        </ScrollView>
      )}
    </WalletScreen>
  );
}

/** Lay label/value fields out two per row for InfoCard. */
function pairs<T>(items: readonly T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));
  return rows;
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
  services: { flexDirection: 'row', flexWrap: 'wrap', gap: adminSpacing.sm },
  servicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.success.bg,
  },
  serviceText: { ...adminType.caption, color: adminColors.success.text },
  notes: { ...adminType.body, color: adminColors.muted },
});
