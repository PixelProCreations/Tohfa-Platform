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
import { CalendarIcon, ChevronDownIcon, ClockOutlineIcon, PersonIcon } from './StaffParts';
import { hasStaffRosterAccess } from './StaffScreen';
import type { AttendanceStatus, PermissionCheck, StaffMember, WarehouseScreenBaseProps } from './types';

function _CheckmarkIcon({ size = 16, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function _getStatusColor(status?: string | null): string {
  switch (status) {
    case 'Present':
    case 'Active':
      return '#16A34A';
    case 'Absent':
      return '#DC2626';
    case 'Late Arrival':
    case 'Early Leave':
    case 'Half Day':
      return '#D97706';
    case 'On Leave':
      return '#E11D48';
    case 'Week Off':
      return '#6B7280';
    default:
      return adminColors.brand;
  }
}

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

const _STATUS_OPTIONS = [
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
  onNavigateToAttendanceCorrection?: ((staff: StaffMember) => void) | undefined;
}

export function StaffDetailScreen({
  scope,
  can,
  role,
  onBack,
  staff,
  onEditProfile,
  onNavigateToAttendanceCorrection,
}: StaffDetailScreenProps) {
  const member = staff ?? DEFAULT_STAFF_MEMBER;
  const [_showStatusDropdown, _setShowStatusDropdown] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [_showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [currentAttendance, _setCurrentAttendance] = useState<AttendanceStatus>((staff?.attendance as AttendanceStatus) || 'Present');

  if (!hasStaffRosterAccess(can, scope)) {
    return (
      <WalletScreen title="Staff Detail" onBack={onBack}>
        <EmptyState title="Staff roster not available" subtitle="Your role does not include the warehouse staff roster." />

    </WalletScreen>
    );
  }

  const isDriver = member.type === 'driver' || member.role.toLowerCase().includes('driver');
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isTohfa = isTohfaAdminUser(can, role);
  const isSubWH = role === 'SUB_WH_ADMIN';
  const isMainWH =
    !isSubWH &&
    (role === 'MAIN_WH_ADMIN' ||
      isAllWarehouses(scope) ||
      (can ? can('admin.staff.attendance.mark') || can('admin.staff.manage') : false));

  // Role & subtitle displays matching Screenshot 2 (Warehouse Staff) and Screenshot 3 (Driver)
  const roleSubtitleDisplay = isDriver
    ? 'Driver'
    : member.role.toLowerCase().includes('admin')
    ? member.role
    : 'Warehouse Staff';

  const roleValueDisplay = isDriver
    ? 'Drive'
    : member.role.toLowerCase().includes('admin')
    ? member.role
    : 'Ground Staff';

  // RBAC: "Update active status *" dropdown is enabled for TOHFA_ADMIN and MAIN_WH_ADMIN only,
  // strictly hidden for SUB_WH_ADMIN per RBAC shared-screen specifications.
  const _hasUpdateStatus = !isSubWH && (isTohfa || isMainWH || isSuperAdmin);
  const canDeactivate = isTohfa || isSuperAdmin;
  const canEdit = (isTohfa || isSuperAdmin) && !!onEditProfile;

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
            member.status = nextStatus as StaffMember['status'];
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
        {/* Top Profile Card Matching Image 2 */}
        <View style={styles.profileCard}>
          <View style={styles.profileTopRow}>
            <View style={styles.avatarCircle}>
              <PersonIcon size={26} color="#8B5E3C" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{member.name}</Text>
              <Text style={styles.profileRoleSubtitle}>{roleSubtitleDisplay}</Text>
            </View>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>{currentStatusDisplay}</Text>
            </View>
          </View>

          {/* Row 2: Attendance Pill + Orange Update Button */}
          <View style={styles.attendanceActionRow}>
            <TouchableOpacity
              style={styles.attendancePill}
              onPress={() => setShowAttendanceModal(true)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      currentAttendance === 'Present'
                        ? '#16A34A'
                        : currentAttendance === 'Absent'
                        ? '#DC2626'
                        : '#D97706',
                  },
                ]}
              />
              <Text style={styles.attendancePillText}>{currentAttendance}</Text>
              <ChevronDownIcon size={14} color="#6B7280" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.updateOrangeBtn}
              onPress={() => setShowAttendanceModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.updateOrangeBtnText}>Update</Text>
            </TouchableOpacity>
          </View>

          {/* Row 3: Date, Check-in, Check-out */}
          <View style={styles.clockRow}>
            <View style={styles.clockItem}>
              <CalendarIcon size={14} color="#6B7280" />
              <Text style={styles.clockTimeText}>25 Sep 2026</Text>
            </View>
            <View style={styles.clockItem}>
              <ClockOutlineIcon size={14} color="#6B7280" />
              <Text style={styles.clockTimeText}>Check-in {currentAttendance === 'Absent' ? '--:--' : '9:02 AM'}</Text>
            </View>
            <View style={styles.clockItem}>
              <Text style={styles.clockTimeText}>Check-out {currentAttendance === 'Absent' ? '--:--' : '06:05 PM'}</Text>
            </View>
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
              <Text style={styles.gridValue}>{roleValueDisplay}</Text>
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

        {/* Attendance Summary Section with Edit for Super Admin (Image 2) */}
        <View style={styles.sectionHeaderWithEdit}>
          <SectionTitle>Attendance Summary</SectionTitle>
          {isSuperAdmin && (
            <TouchableOpacity
              style={styles.summaryEditBtn}
              onPress={() => onNavigateToAttendanceCorrection ? onNavigateToAttendanceCorrection(member) : onEditProfile?.(member)}
              activeOpacity={0.8}
            >
              <PencilIcon size={12} color={adminColors.brand} />
              <Text style={styles.summaryEditBtnText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>
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

        {/* Responsibility Summary (Super Admin Image 2) */}
        {isSuperAdmin && (
          <>
            <SectionTitle>Responsibility Summary</SectionTitle>
            <View style={styles.detailCard}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.responsibilityTagsRow}>
                {['Goods Receiving', 'Inventory', 'Orders', 'Sales', 'Finance'].map((tag) => (
                  <View key={tag} style={styles.responsibilityTag}>
                    <Text style={styles.responsibilityTagText}>{tag}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </>
        )}

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

        {/* Bottom Actions: Image 2 dual buttons for Super Admin */}
        {isSuperAdmin ? (
          <View style={styles.superAdminActionRow}>
            {isDeactivated ? (
              <>
                <TouchableOpacity
                  style={styles.reactivateGreenBtn}
                  onPress={handleToggleDeactivate}
                  activeOpacity={0.85}
                >
                  <Text style={styles.reactivateGreenBtnText}>Re-Activate account</Text>
                </TouchableOpacity>

                <View style={styles.disabledDeactivateBtn}>
                  <Text style={styles.disabledDeactivateBtnText}>Deactivate</Text>
                </View>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.deactivateRedBtn}
                  onPress={handleToggleDeactivate}
                  activeOpacity={0.85}
                >
                  <Text style={styles.deactivateRedBtnText}>Deactivate</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.endSessionsBtn}
                  onPress={() => {
                    Alert.alert(
                      'End Active Sessions',
                      `All active login sessions for ${member.name} have been terminated.`,
                      [{ text: 'OK' }]
                    );
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.endSessionsBtnText}>End active Sessions</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        ) : (
          canDeactivate && (
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
          )
        )}
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  profileRoleSubtitle: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 2,
  },
  activeBadge: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
  },
  attendanceActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    width: '100%',
  },
  attendancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: adminColors.canvas,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  attendancePillText: {
    fontSize: 13,
    fontWeight: '600',
    color: adminColors.ink,
  },
  updateOrangeBtn: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
  },
  updateOrangeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  clockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    width: '100%',
  },
  clockDateText: {
    fontSize: 12,
    color: adminColors.muted,
    marginRight: 8,
  },
  clockTimeText: {
    fontSize: 12,
    color: adminColors.muted,
  },

  headerEditBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
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
    marginRight: adminSpacing.md,
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

  // Update Status Dropdown Section (Main Warehouse Admin & Tohfa Admin)
  updateStatusContainer: {
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  updateStatusLabel: {
    ...adminType.sectionHead,
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
  },
  dropdownButton: {
    height: 50,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...adminShadow.sm,
  },
  dropdownButtonActive: {
    borderColor: adminColors.brand,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  dropdownValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusIndicatorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dropdownPlaceholderText: {
    fontSize: 14,
    color: adminColors.muted,
  },
  dropdownSelectedText: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
  },
  dropdownMenu: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginTop: 4,
    width: '100%',
    ...adminShadow.md,
    elevation: 4,
    overflow: 'hidden',
  },
  dropdownMenuItem: {
    paddingVertical: 13,
    paddingHorizontal: adminSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownMenuItemSelected: {
    backgroundColor: '#FFF7ED',
  },
  dropdownItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dropdownMenuItemText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  dropdownMenuItemTextSelected: {
    color: adminColors.brandDeep,
    fontWeight: '700',
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
  sectionHeaderWithEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 4,
  },
  summaryEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  summaryEditBtnText: {
    ...adminType.caption,
    color: adminColors.brand,
    fontWeight: '700',
  },
  responsibilityTagsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  responsibilityTag: {
    backgroundColor: adminColors.canvas,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  responsibilityTagText: {
    ...adminType.caption,
    color: adminColors.ink,
    fontWeight: '600',
  },
  superAdminActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  deactivateRedBtn: {
    flex: 1,
    height: 46,
    borderRadius: adminRadius.md,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deactivateRedBtnText: {
    ...adminType.rowTitle,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  endSessionsBtn: {
    flex: 1.2,
    height: 46,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    borderWidth: 1.2,
    borderColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  endSessionsBtnText: {
    ...adminType.rowTitle,
    color: '#EF4444',
    fontWeight: '700',
  },
  reactivateGreenBtn: {
    flex: 1.2,
    height: 46,
    borderRadius: adminRadius.md,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactivateGreenBtnText: {
    ...adminType.rowTitle,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  disabledDeactivateBtn: {
    flex: 1,
    height: 46,
    borderRadius: adminRadius.md,
    backgroundColor: '#FCA5A5',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.6,
  },
  disabledDeactivateBtnText: {
    ...adminType.rowTitle,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
