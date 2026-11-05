/**
 * Staff Detail: one roster member (driver or warehouse staff).
 *
 * Visual layout matches design mockups:
 * - Image 2: Staff Detail (Ground Staff / non-driver) with Edit Header Button & Deactivate Button
 * - Image 3: Driver Staff Detail (includes Delivery Summary)
 * - Image 4 & 5: Main Warehouse Admin (includes "Update active status *" dropdown)
 * - Single shared screen architecture driven by RBAC.
 */
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { adminColors, adminRadius, adminSpacing, adminType, adminShadow } from '../../../theme';
import {
  EmptyState,
  isAllWarehouses,
  SectionTitle,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import {
  DEFAULT_STAFF_MEMBER,
  DRIVER_DELIVERY_SUMMARY,
  STAFF_ATTENDANCE_SUMMARY,
  staffWarehouseName,
} from './fixtures';
import { ChevronDownIcon, PersonIcon } from './StaffParts';
import { hasStaffRosterAccess } from './StaffScreen';
import type { PermissionCheck, StaffMember, WarehouseScreenBaseProps } from './types';

function PencilIcon({ size = 16, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const STATUS_OPTIONS = [
  'Present',
  'Absent',
  'Late Arrival',
  'Early Leave',
  'Half Day',
  'On Leave',
  'Week Off',
];

export function isTohfaAdminUser(can?: PermissionCheck, role?: string): boolean {
  if (role === 'TOHFA_ADMIN' || role === 'SUPER_ADMIN') return true;
  if (role === 'MAIN_WH_ADMIN' || role === 'SUB_WH_ADMIN') return false;
  if (!can) return false;
  return can('admin.farmer_admin.create') || can('admin.account.disable');
}

export interface StaffDetailScreenProps extends WarehouseScreenBaseProps {
  role?: string | undefined;
  staff?: StaffMember | undefined;
  onEditProfile?: ((staff: StaffMember) => void) | undefined;
  onViewAttendance?: ((staff: StaffMember) => void) | undefined;
  onViewAttendanceHistory?: ((staff: StaffMember) => void) | undefined;
  onAssignDelivery?: ((staff: StaffMember) => void) | undefined;
}

export function StaffDetailScreen({
  scope,
  can,
  role,
  onBack,
  staff,
  onEditProfile,
}: StaffDetailScreenProps) {
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  if (!hasStaffRosterAccess(can, scope)) {
    return (
      <WalletScreen title="Staff Detail" onBack={onBack}>
        <EmptyState title="Staff roster not available" subtitle="Your role does not include the warehouse staff roster." />
      </WalletScreen>
    );
  }

  const member = staff ?? DEFAULT_STAFF_MEMBER;
  const isDriver = member.type === 'driver' || member.role.toLowerCase().includes('driver');
  const isMain = isAllWarehouses(scope);
  const isTohfa = isTohfaAdminUser(can, role);
  const hasUpdateStatus = isTohfa || can('admin.staff.status_update') || can('warehouse.staff.update_status');
  const canDeactivate = isTohfa;
  const canEdit = isTohfa && !!onEditProfile;

  const warehouseName = member.warehouseId ? staffWarehouseName(member.warehouseId) : scope.warehouseName ?? 'Coonoor';
  const summary = STAFF_ATTENDANCE_SUMMARY;

  const currentStatusDisplay = selectedStatus || member.status || 'Active';
  const isDeactivated = currentStatusDisplay.toLowerCase() === 'inactive' || currentStatusDisplay.toLowerCase() === 'deactivated';

  const handleToggleDeactivate = () => {
    const nextStatus = isDeactivated ? 'Active' : 'Inactive';
    Alert.alert(
      isDeactivated ? 'Activate Staff' : 'Deactivate Staff',
      `Are you sure you want to ${isDeactivated ? 'activate' : 'deactivate'} ${member.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isDeactivated ? 'Activate' : 'Deactivate',
          style: isDeactivated ? 'default' : 'destructive',
          onPress: () => {
            setSelectedStatus(nextStatus);
            member.status = nextStatus as any;
          },
        },
      ]
    );
  };

  return (
    <WalletScreen
      title="Staff Detail"
      onBack={onBack}
      headerRight={
        canEdit ? (
          <TouchableOpacity
            style={styles.headerEditBtn}
            onPress={() => onEditProfile?.(member)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Edit Staff Profile"
          >
            <PencilIcon size={16} color="#FFFFFF" />
          </TouchableOpacity>
        ) : undefined
      }
      footer={undefined}
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <PersonIcon size={26} color="#8B5E3C" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{member.name}</Text>
            <Text style={styles.profileMeta}>
              {isDriver ? 'Driver ID' : 'Staff ID'}: {member.staffId} · {currentStatusDisplay}
            </Text>
          </View>
        </View>

        {/* Profile Information Section */}
        <SectionTitle>Profile Information</SectionTitle>
        <View style={styles.detailCard}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Email Address</Text>
              <Text style={styles.gridValue}>{member.email || 'arunkumar@company.com'}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Mobile Number</Text>
              <Text style={styles.gridValue}>{member.phone || '+91 98765 43210'}</Text>
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Role</Text>
              <Text style={styles.gridValue}>{isDriver ? 'Drive' : (member.role || 'Ground Staff')}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Account Created</Text>
              <Text style={styles.gridValue}>15 Mar 2026</Text>
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Staff ID</Text>
              <Text style={styles.gridValue}>{member.staffId || 'DRV-0018'}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Last Loginh</Text>
              <Text style={styles.gridValue}>02 Nov 2026, 09:24 AM</Text>
            </View>
          </View>

          <View style={[styles.gridRow, { marginBottom: 0 }]}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Assigned zone / Warehouse</Text>
              <Text style={styles.gridValue}>
                {warehouseName ? `${warehouseName.replace(/Warehouse/i, '').trim()} Zone` : 'Coonoor Zone'}
              </Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Status</Text>
              <Text style={styles.gridValue}>{currentStatusDisplay}</Text>
            </View>
          </View>
        </View>

        {/* Update Active Status Dropdown (Main Warehouse / Update Permission Only - Images 4 & 5) */}
        {hasUpdateStatus && (
          <View style={styles.updateStatusContainer}>
            <Text style={styles.updateStatusLabel}>Update active status *</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowStatusDropdown((prev) => !prev)}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <Text style={selectedStatus ? styles.dropdownSelectedText : styles.dropdownPlaceholderText}>
                {selectedStatus || 'Select..'}
              </Text>
              <ChevronDownIcon size={18} color={adminColors.muted} />
            </TouchableOpacity>

            {/* Dropdown Menu List (Image 5) */}
            {showStatusDropdown && (
              <View style={styles.dropdownMenu}>
                {STATUS_OPTIONS.map((statusOption, idx) => (
                  <TouchableOpacity
                    key={statusOption}
                    style={[
                      styles.dropdownMenuItem,
                      idx === STATUS_OPTIONS.length - 1 && { borderBottomWidth: 0 },
                    ]}
                    onPress={() => {
                      setSelectedStatus(statusOption);
                      setShowStatusDropdown(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.dropdownMenuItemText}>{statusOption}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Delivery Summary Section (Driver Only - Image 3) */}
        {isDriver && (
          <>
            <SectionTitle>Delivery Summary</SectionTitle>
            <View style={styles.detailCard}>
              <View style={styles.gridRow}>
                <View style={styles.gridCol}>
                  <Text style={styles.gridLabel}>Today's Deliveries</Text>
                  <Text style={styles.gridValue}>{String(member.deliveriesToday ?? 6)}</Text>
                </View>
                <View style={styles.gridCol}>
                  <Text style={styles.gridLabel}>Completed</Text>
                  <Text style={styles.gridValue}>{String(DRIVER_DELIVERY_SUMMARY.completedToday ?? 4)}</Text>
                </View>
              </View>
              <View style={[styles.gridRow, { marginBottom: 0 }]}>
                <View style={styles.gridCol}>
                  <Text style={styles.gridLabel}>Pending</Text>
                  <Text style={styles.gridValue}>{String(DRIVER_DELIVERY_SUMMARY.pendingToday ?? 2)}</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Performance Section */}
        <SectionTitle>Performance</SectionTitle>
        <View style={styles.detailCard}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Completed Deliveries</Text>
              <Text style={styles.gridValue}>{String(DRIVER_DELIVERY_SUMMARY.completedTotal ?? 124)}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Cancelled</Text>
              <Text style={styles.gridValue}>{String(DRIVER_DELIVERY_SUMMARY.cancelled ?? 3)}</Text>
            </View>
          </View>
          <View style={[styles.gridRow, { marginBottom: 0 }]}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Failed</Text>
              <Text style={styles.gridValue}>{String(DRIVER_DELIVERY_SUMMARY.failed ?? 2)}</Text>
            </View>
          </View>
        </View>

        {/* Attendance Summary Section */}
        <SectionTitle>Attendance Summary</SectionTitle>
        <View style={styles.detailCard}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Present</Text>
              <Text style={styles.gridValue}>{`${summary.present ?? 22} days`}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Absent</Text>
              <Text style={styles.gridValue}>{`${summary.absent ?? 2} days`}</Text>
            </View>
          </View>
          <View style={[styles.gridRow, { marginBottom: 0 }]}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Leave</Text>
              <Text style={styles.gridValue}>{`${summary.leave ?? 1} day`}</Text>
            </View>
          </View>
        </View>

        {/* Activity Section */}
        <SectionTitle>Activity</SectionTitle>
        <View style={styles.activityContainer}>
          {/* Step 1: Profile Created */}
          <View style={styles.activityRow}>
            <View style={styles.timelineNode}>
              <View style={styles.statusDotGreen} />
              <View style={styles.statusConnectingLine} />
            </View>
            <View style={styles.activityTextWrap}>
              <Text style={styles.activityTitle}>Profile Created</Text>
            </View>
          </View>

          {/* Step 2: Assigned to Coonoor */}
          <View style={styles.activityRow}>
            <View style={styles.timelineNode}>
              <View style={styles.statusDotGreen} />
              <View style={styles.statusConnectingLine} />
            </View>
            <View style={styles.activityTextWrap}>
              <Text style={styles.activityTitle}>
                {warehouseName ? `Assigned to ${warehouseName.replace(/Warehouse/i, '').trim()}` : 'Assigned to Coonoor'}
              </Text>
            </View>
          </View>

          {/* Step 3: Attendance Recorded */}
          <View style={styles.activityRow}>
            <View style={styles.timelineNode}>
              <View style={styles.statusDotGreen} />
            </View>
            <View style={styles.activityTextWrap}>
              <Text style={styles.activityTitle}>Attendance Recorded</Text>
            </View>
          </View>
        </View>

        {/* Deactivate Button (Image 2) */}
        {canDeactivate && (
          <TouchableOpacity
            style={[
              styles.deactivateBtn,
              isDeactivated && styles.activateBtn,
            ]}
            onPress={handleToggleDeactivate}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <Text style={styles.deactivateBtnText}>
              {isDeactivated ? 'Activate' : 'Deactivate'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  headerEditBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    ...adminShadow.sm,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF3E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: { flex: 1 },
  profileName: {
    ...adminType.title,
    fontSize: 18,
    fontWeight: '700',
    color: adminColors.ink,
  },
  profileMeta: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 3,
    fontSize: 13,
  },

  detailCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    ...adminShadow.sm,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.md,
  },
  gridCol: {
    flex: 1,
  },
  gridLabel: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
    marginBottom: 4,
  },
  gridValue: {
    ...adminType.rowTitle,
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
  },

  // Update Status Dropdown Section (Main Warehouse Admin)
  updateStatusContainer: {
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.xs,
  },
  updateStatusLabel: {
    ...adminType.sectionHead,
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
  },
  dropdownButton: {
    height: 48,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...adminShadow.sm,
  },
  dropdownPlaceholderText: {
    fontSize: 14,
    color: adminColors.muted,
  },
  dropdownSelectedText: {
    fontSize: 14,
    fontWeight: '600',
    color: adminColors.ink,
  },
  dropdownMenu: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginTop: adminSpacing.xs,
    width: '60%',
    ...adminShadow.sm,
    elevation: 4,
  },
  dropdownMenuItem: {
    paddingVertical: 12,
    paddingHorizontal: adminSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownMenuItemText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },

  // Activity Timeline
  activityContainer: {
    paddingHorizontal: adminSpacing.xs,
    paddingTop: adminSpacing.xs,
    paddingBottom: adminSpacing.sm,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 48,
  },
  timelineNode: {
    alignItems: 'center',
    width: 24,
    marginRight: adminSpacing.md,
  },
  statusDotGreen: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#16A34A',
  },
  statusConnectingLine: {
    width: 2,
    flex: 1,
    minHeight: 34,
    backgroundColor: '#16A34A',
    marginVertical: 2,
  },
  activityTextWrap: {
    flex: 1,
    paddingTop: 0,
  },
  activityTitle: {
    ...adminType.rowTitle,
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
  },

  // Deactivate Button
  deactivateBtn: {
    backgroundColor: '#EF4444',
    height: 48,
    borderRadius: adminRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.lg,
    marginBottom: adminSpacing.xl,
    ...adminShadow.sm,
  },
  activateBtn: {
    backgroundColor: '#16A34A',
  },
  deactivateBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
