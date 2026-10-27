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
  isAllWarehouses,
  SectionTitle,
  WalletScreen,
  WarehouseTabBar,
} from '../wallet-cashtopup/WalletParts';
import { StatusDot } from './ProfileParts';
import type { OperatingInfo, WarehouseScreenBaseProps, WarehouseSelectionProps } from './types';
import { OPERATING_INFO, PROFILE_WAREHOUSES } from './warehouseFixtures';
import { useWarehouseOptions } from '../shared/useWarehouseOptions';
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
  warehouseOptions: customWarehouseOptions,
  selectedWarehouseId,
  onSelectWarehouse,
  operatingInfo = OPERATING_INFO,
  today = new Date(),
}: OperatingInfoScreenProps) {
  const isMain = isAllWarehouses(scope);
  const { scopes: fetchedWarehouseOptions } = useWarehouseOptions();
  const warehouseOptions = customWarehouseOptions ?? (fetchedWarehouseOptions.length > 0 ? fetchedWarehouseOptions : PROFILE_WAREHOUSES);

  const warehouseId = singleWarehouseId(scope, selectedWarehouseId, warehouseOptions);
  const info = recordFor(operatingInfo, warehouseId);
  const todayName = !isMain ? 'Thursday' : WEEKDAYS[today.getDay()];
  const todayRow = info?.week.find((d) => d.day === todayName);

  return (
    <WalletScreen
      title="Operating Information"
      onBack={onBack}
      headerExtra={
        <SingleWarehouseHeader scope={scope} warehouseId={warehouseId} options={warehouseOptions} onSelect={onSelectWarehouse} />
      }
      footer={onTabChange ? <WarehouseTabBar activeTab="More" onTabChange={onTabChange} /> : undefined}
    >
      {info === undefined ? (
        <EmptyState title="No operating information" subtitle="Nothing is configured for this warehouse yet." />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Operating Status</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Warehouse Status</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={[styles.statusText, info.status !== 'Operational' && styles.statusClosed]}>{info.status}</Text>
            </View>
          </View>
          {!isMain ? (
            <View style={styles.infoBanner}>
              <Text style={styles.infoBannerText}>
                SWA cannot change this status — it's managed by authorized higher-level warehouse/configuration roles.
              </Text>
            </View>
          ) : isMain ? (
            <>
              <View style={warehouseProfileLayout.gap} />
              <InfoNote>
                Warehouse admins cannot change this status; it is managed by authorized higher-level warehouse configuration roles.
              </InfoNote>
            </>
          ) : null}

          <View style={styles.todayCard}>
            <Text style={styles.todayLabel}>Today</Text>
            <Text style={styles.todayValue}>{todayRow?.hours ? `Open · ${todayRow.hours}` : 'Closed'}</Text>
          </View>

          <Text style={styles.sectionTitle}>Operating Hours</Text>
          <View style={styles.hoursCard}>
            {info.week.map((day, index) => {
              const isToday = day.day === todayName;
              const isLast = index === info.week.length - 1;
              return (
                <View
                  key={day.day}
                  style={[
                    styles.dayRow,
                    !isLast && !isToday && styles.dayRowBorder,
                    isToday && styles.dayRowHighlight,
                  ]}
                >
                  <Text style={[styles.dayLabel, isToday && styles.dayLabelHighlight]}>
                    {isToday ? `${day.day} (Today)` : day.day}
                  </Text>
                  <Text style={[styles.dayValue, !day.hours && styles.dayValueClosed]}>
                    {day.hours ?? 'Closed'}
                  </Text>
                </View>
              );
            })}
          </View>

          {!isMain ? (
            <View style={styles.infoBanner}>
              <Text style={styles.infoBannerText}>
                Hours shown are example UI values — actual hours come from warehouse configuration, never hard-coded.
              </Text>
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>Operational Services</Text>
          <View style={styles.card}>
            <View style={styles.services}>
              {info.services.map((service) => (
                <View key={service} style={styles.servicePill}>
                  <CheckIcon size={14} color={adminColors.success.text} />
                  <Text style={styles.serviceText}>{service}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* FULFILLMENT INFORMATION */}
          <Text style={styles.sectionTitle}>Fulfillment Information</Text>
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, gap: adminSpacing.lg }}>
                <View>
                  <Text style={styles.label}>Customer Pickup</Text>
                  <Text style={{ ...adminType.rowTitle, color: adminColors.ink, marginTop: 2 }}>
                    {info.fulfillment.find((f) => f.label === 'Customer Pickup')?.value ?? 'Available'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.label}>Market Sales</Text>
                  <Text style={{ ...adminType.rowTitle, color: adminColors.ink, marginTop: 2 }}>
                    {info.fulfillment.find((f) => f.label === 'Market Sales')?.value ?? 'Available'}
                  </Text>
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Home Delivery</Text>
                <Text style={{ ...adminType.rowTitle, color: adminColors.ink, marginTop: 2 }}>
                  {info.fulfillment.find((f) => f.label === 'Home Delivery')?.value ?? 'Available'}
                </Text>
              </View>
            </View>
          </View>

          {/* DAILY OPERATIONAL CAPACITY */}
          <Text style={styles.sectionTitle}>Daily Operational Capacity</Text>
          <View style={[styles.card, { paddingVertical: 4, paddingHorizontal: 0 }]}>
            {info.dailyCapacity.map((row, index) => {
              const isLast = index === info.dailyCapacity.length - 1;
              return (
                <View
                  key={row.label}
                  style={[
                    {
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingHorizontal: adminSpacing.lg,
                      paddingVertical: adminSpacing.md,
                    },
                    !isLast && { borderBottomWidth: 1, borderBottomColor: adminColors.border },
                  ]}
                >
                  <Text style={{ ...adminType.body, color: adminColors.muted, fontWeight: '500' }}>{row.label}</Text>
                  <Text style={{ ...adminType.rowTitle, color: adminColors.ink }}>{row.value}</Text>
                </View>
              );
            })}
          </View>

          {/* Info banner below capacity */}
          {!isMain ? (
            <View style={styles.infoBanner}>
              <Text style={styles.infoBannerText}>
                Capacity numbers shown only if configured — never invented.
              </Text>
            </View>
          ) : (
            <InfoNote>Capacity numbers are shown only when configured.</InfoNote>
          )}

          {/* SPECIAL OPERATING DAYS */}
          {info.specialDays.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Special Operating Days</Text>
              <View style={[styles.card, { paddingVertical: 4, paddingHorizontal: 0 }]}>
                {info.specialDays.map((row, index) => {
                  const isLast = index === info.specialDays.length - 1;
                  return (
                    <View
                      key={row.date}
                      style={[
                        {
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          paddingHorizontal: adminSpacing.lg,
                          paddingVertical: adminSpacing.md,
                        },
                        !isLast && { borderBottomWidth: 1, borderBottomColor: adminColors.border },
                      ]}
                    >
                      <Text style={{ ...adminType.body, color: adminColors.muted, fontWeight: '500' }}>{row.date}</Text>
                      <Text style={{ ...adminType.rowTitle, color: adminColors.ink }}>{row.note}</Text>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {/* OPERATING NOTES */}
          <Text style={styles.sectionTitle}>Operating Notes</Text>
          <View style={styles.card}>
            <Text style={{ ...adminType.body, color: adminColors.muted, lineHeight: 20 }}>{info.notes}</Text>
          </View>
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
  scrollContent: {
    padding: adminSpacing.lg,
    paddingBottom: adminSpacing.xxl,
  },
  sectionTitle: {
    ...adminType.title,
    color: adminColors.ink,
    marginBottom: adminSpacing.md,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
  },
  label: {
    ...adminType.caption,
    color: adminColors.muted,
    fontWeight: '500',
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.success.text,
  },
  statusText: {
    ...adminType.rowTitle,
    color: adminColors.success.text,
  },
  statusClosed: {
    color: adminColors.danger.text,
  },
  infoBanner: {
    backgroundColor: adminColors.info.bg,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: adminColors.info.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    marginBottom: adminSpacing.lg,
  },
  infoBannerText: {
    ...adminType.rowMeta,
    lineHeight: 18,
    color: adminColors.info.text,
    fontWeight: '600',
  },
  todayCard: {
    backgroundColor: adminColors.brandSoft.bg,
    borderRadius: adminRadius.lg,
    borderWidth: 1.5,
    borderColor: adminColors.brandSoft.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.xl,
  },
  todayLabel: {
    ...adminType.caption,
    fontWeight: '500',
    color: adminColors.brandSoft.text,
    marginBottom: 4,
  },
  todayValue: {
    ...adminType.rowTitle,
    color: adminColors.brandSoft.text,
  },
  hoursCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 4,
    marginBottom: adminSpacing.md,
    overflow: 'hidden',
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
  },
  dayRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  dayRowHighlight: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.sm,
    marginHorizontal: 6,
    marginVertical: 2,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
  },
  dayLabel: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  dayLabelHighlight: {
    color: adminColors.brandDeep,
    fontWeight: '700',
  },
  dayValue: {
    ...adminType.body,
    fontWeight: '500',
    color: adminColors.ink,
  },
  dayValueClosed: {
    color: adminColors.muted,
  },
  services: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.sm,
  },
  servicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 6,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.success.bg,
  },
  serviceText: {
    ...adminType.rowMeta,
    fontWeight: '600',
    color: adminColors.success.text,
  },
  notes: {
    ...adminType.body,
    color: adminColors.muted,
    lineHeight: 18,
  },
});
