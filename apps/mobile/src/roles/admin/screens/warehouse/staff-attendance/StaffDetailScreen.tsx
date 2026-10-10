/**
 * Staff Detail: one roster member (driver or warehouse staff).
 *
 * Gate (FINAL_LIST 121): reached only through the Staff list, which needs
 * `warehouse.staff.list_view`; the screen checks the code again and renders a
 * not-available note without it.
 *
 * Actions:
 *   - "Assign Delivery" is removed: no rbac code exists for it, and rbac
 *     Principle 9 has no delivery fleet (SPEC_GAPS W4t-2).
 *   - "Edit Driver/Staff Profile" opens Edit Staff Profile. No edit code exists
 *     in docs/rbac.json; per the owner it stays available behind the roster
 *     code (SPEC_GAPS W4t-1). No code is invented here.
 *
 * Absorbs Main MainWarehouseStaffDetailScreen (pair M14-S02): the dated
 * activity timeline, the tappable attendance summary (opens Attendance
 * History) and, for the Main view, the driver's contact / vehicle row with the
 * "illustrative fields" note. The warehouse comes from the member's record or
 * the viewer's scope, never a hard-coded name.
 */
// Design id: M14-S02
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import {
  EmptyState,
  InfoCard,
  InfoNote,
  isAllWarehouses,
  SectionTitle,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import {
  DEFAULT_STAFF_MEMBER,
  DRIVER_DELIVERY_SUMMARY,
  STAFF_ACTIVITY,
  STAFF_ATTENDANCE_SUMMARY,
  staffWarehouseName,
} from './fixtures';
import { ProhibitedIcon, RingTimeline, StaffAvatar } from './StaffParts';
import { STAFF_ROSTER_CODE } from './StaffScreen';
import type { StaffMember, WarehouseScreenBaseProps } from './types';

export interface StaffDetailScreenProps extends WarehouseScreenBaseProps {
  staff?: StaffMember | undefined;
  onEditProfile?: ((staff: StaffMember) => void) | undefined;
  /** Attendance summary tap (Main): opens Attendance History. */
  onViewAttendanceHistory?: ((staff: StaffMember) => void) | undefined;
}

export function StaffDetailScreen({ scope, can, onBack, staff, onEditProfile, onViewAttendanceHistory }: StaffDetailScreenProps) {
  if (!can(STAFF_ROSTER_CODE)) {
    return (
      <WalletScreen title="Staff Detail" onBack={onBack}>
        <EmptyState title="Staff roster not available" subtitle="Your role does not include the warehouse staff roster." />
      </WalletScreen>
    );
  }

  const member = staff ?? DEFAULT_STAFF_MEMBER;
  const isDriver = member.type === 'driver';
  const isMain = isAllWarehouses(scope);
  const warehouseName = member.warehouseId ? staffWarehouseName(member.warehouseId) : scope.warehouseName ?? '';
  const summary = STAFF_ATTENDANCE_SUMMARY;
  const timeline = STAFF_ACTIVITY.map((item) => ({
    id: item.id,
    title: item.id === 'a-2' && warehouseName ? `Assigned to ${warehouseName}` : item.title,
    subtitle: item.when,
  }));

  const attendanceCard = (
    <InfoCard
      rows={[
        [
          { label: 'Present', value: `${summary.present} days` },
          { label: 'Absent', value: `${summary.absent} days` },
          { label: 'Leave', value: `${summary.leave} day${summary.leave === 1 ? '' : 's'}` },
        ],
      ]}
    />
  );

  return (
    <WalletScreen
      title="Staff Detail"
      onBack={onBack}
      footer={
        onEditProfile ? (
          <WalletFooter>
            <WalletButton label={`Edit ${isDriver ? 'Driver' : 'Staff'} Profile`} onPress={() => onEditProfile(member)} />
          </WalletFooter>
        ) : undefined
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <StaffAvatar type={member.type} large />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{member.name}</Text>
            <Text style={styles.profileMeta}>
              {isDriver ? 'Driver ID' : 'Staff ID'}: {member.staffId} · {member.status}
            </Text>
          </View>
        </View>

        {isDriver ? (
          <>
            <SectionTitle>Driver Information</SectionTitle>
            <InfoCard
              rows={[
                [
                  { label: 'Driver ID', value: member.staffId },
                  { label: 'Status', value: member.status },
                ],
                [{ label: 'Assigned Warehouse', value: warehouseName || '—' }],
                ...(isMain
                  ? [
                      [
                        { label: 'Contact', value: member.phone ?? '—' },
                        { label: 'Vehicle Details', value: member.vehicleDetails ?? '—' },
                      ],
                    ]
                  : []),
              ]}
            />
            {isMain ? (
              <InfoNote>
                Vehicle, license and document fields are illustrative and must be confirmed against the final driver data model
                before becoming mandatory.
              </InfoNote>
            ) : null}

            <SectionTitle>Delivery Summary</SectionTitle>
            <InfoCard
              rows={[
                [
                  { label: "Today's Deliveries", value: String(member.deliveriesToday ?? 0) },
                  { label: 'Completed', value: String(DRIVER_DELIVERY_SUMMARY.completedToday) },
                ],
                [{ label: 'Pending', value: String(DRIVER_DELIVERY_SUMMARY.pendingToday) }],
              ]}
            />

            <SectionTitle>Performance</SectionTitle>
            <InfoCard
              rows={[
                [
                  { label: 'Completed Deliveries', value: String(DRIVER_DELIVERY_SUMMARY.completedTotal) },
                  { label: 'Cancelled', value: String(DRIVER_DELIVERY_SUMMARY.cancelled) },
                ],
                [{ label: 'Failed', value: String(DRIVER_DELIVERY_SUMMARY.failed) }],
              ]}
            />
            <InfoNote>Only metrics the backend actually defines are shown — no invented performance figures.</InfoNote>
          </>
        ) : (
          <>
            <SectionTitle>Basic Information</SectionTitle>
            <InfoCard
              rows={[
                [
                  { label: 'Name', value: member.name },
                  { label: 'Staff ID', value: member.staffId },
                ],
                [
                  { label: 'Role', value: member.role },
                  { label: 'Status', value: member.status },
                ],
                [{ label: 'Warehouse', value: warehouseName || '—' }],
              ]}
            />

            <SectionTitle>Contact Information</SectionTitle>
            <InfoCard
              rows={[
                [
                  { label: 'Phone', value: member.phone ?? '—' },
                  { label: 'Email', value: member.email ?? '—' },
                ],
              ]}
            />
            <InfoNote tone="danger" icon={<ProhibitedIcon />}>
              No salary, payroll, bank account, or Aadhaar fields — the source doesn&apos;t define a complete warehouse-staff HR
              data model, so none is invented here.
            </InfoNote>
          </>
        )}

        <SectionTitle>Attendance Summary</SectionTitle>
        {onViewAttendanceHistory ? (
          <TouchableOpacity
            onPress={() => onViewAttendanceHistory(member)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Open attendance history"
          >
            {attendanceCard}
          </TouchableOpacity>
        ) : (
          attendanceCard
        )}

        <SectionTitle>Activity</SectionTitle>
        <RingTimeline items={timeline} />
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
  },
  profileInfo: { flex: 1 },
  profileName: { ...adminType.title, color: adminColors.ink },
  profileMeta: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },
});
