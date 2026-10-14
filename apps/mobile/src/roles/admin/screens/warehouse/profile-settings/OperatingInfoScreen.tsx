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
  const isMain = isAllWarehouses(scope);
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
                  <CheckIcon size={14} color="#166534" />
                  <Text style={styles.serviceText}>{service}</Text>
                </View>
              ))}
            </View>
          </View>

          {isMain ? (
            <>
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
            </>
          ) : null}
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
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#18181B',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#15803D',
  },
  statusClosed: {
    color: adminColors.danger.text,
  },
  infoBanner: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  infoBannerText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#1E40AF',
    fontWeight: '600',
  },
  todayCard: {
    backgroundColor: '#FDF4E7',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FB923C',
    padding: 16,
    marginBottom: 20,
  },
  todayLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#78716C',
    marginBottom: 4,
  },
  todayValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#9A3412',
  },
  hoursCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dayRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dayRowHighlight: {
    backgroundColor: '#FDF2E2',
    borderRadius: 8,
    marginHorizontal: 6,
    marginVertical: 2,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  dayLabelHighlight: {
    color: '#1F2937',
    fontWeight: '700',
  },
  dayValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  dayValueClosed: {
    color: '#6B7280',
  },
  services: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  servicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
  },
  serviceText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
  },
  notes: {
    fontSize: 13,
    color: adminColors.muted,
    lineHeight: 18,
  },
});
