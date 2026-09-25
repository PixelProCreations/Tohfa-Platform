import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import {
  ADMIN_PALETTE,
  AdminAccountData,
  AdminBackChevronIcon,
  AdminRoleType,
} from './CreateAdminAccountScreen';

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function EditPencilIcon({ color = ADMIN_PALETTE.primaryOrange, size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function KeyResetIcon({ color = ADMIN_PALETTE.blueText, size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 2l-2 2m-1.5 1.5L14 9M3 13a7 7 0 1 0 14 0 7 7 0 0 0-14 0zm7-3v6m-3-3h6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ShieldCheckIcon({ color = ADMIN_PALETTE.successText, size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 12l2 2 4-4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function WarehouseMapIcon({ color = ADMIN_PALETTE.textSecondary, size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function PhoneCallIcon({ color = ADMIN_PALETTE.textSecondary, size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface AdminDetailProfileScreenProps {
  admin: AdminAccountData;
  onBack?: (() => void) | undefined;
  onEdit?: ((admin: AdminAccountData) => void) | undefined;
  onViewPermissionsMatrix?: (() => void) | undefined;
  onViewActivityLogs?: ((adminId: string) => void) | undefined;
}

export function AdminDetailProfileScreen({
  admin,
  onBack,
  onEdit,
  onViewPermissionsMatrix,
  onViewActivityLogs,
}: AdminDetailProfileScreenProps) {
  const [currentStatus, setCurrentStatus] = useState<'ACTIVE' | 'PENDING' | 'DISABLED'>(
    admin.status ?? 'ACTIVE'
  );

  const getRoleTitle = (role: AdminRoleType) => {
    switch (role) {
      case 'SA':
        return 'Super Administrator';
      case 'TA':
        return 'TOHFA Platform Administrator';
      case 'SW':
        return 'Sub Warehouse Operations Lead';
      case 'FA':
        return 'Field & Finance Administrator';
      case 'MW':
        return 'Main Hub Logistics Controller';
    }
  };

  const handleResetPassword = () => {
    const tempPass = 'Tohfa@' + Math.floor(1000 + Math.random() * 9000);
    Alert.alert(
      'Password Reset Dispatched',
      `Temporary access password for ${admin.fullName}:\n\n${tempPass}\n\nSMS notification dispatched to +91 ${admin.mobile}.`
    );
  };

  const handleToggleStatus = () => {
    const next = currentStatus === 'DISABLED' ? 'ACTIVE' : 'DISABLED';
    Alert.alert(
      next === 'DISABLED' ? 'Suspend Account' : 'Reactivate Account',
      `Are you sure you want to ${next === 'DISABLED' ? 'suspend login rights' : 'reactivate'} for ${admin.fullName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: next === 'DISABLED' ? 'Suspend' : 'Activate',
          style: next === 'DISABLED' ? 'destructive' : 'default',
          onPress: () => {
            setCurrentStatus(next);
            Alert.alert('Status Updated', `Account is now ${next}.`);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={ADMIN_PALETTE.pageBg} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <AdminBackChevronIcon />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.editHeaderBtn}
            onPress={() => onEdit?.(admin)}
            activeOpacity={0.7}
          >
            <EditPencilIcon size={15} />
            <Text style={styles.editHeaderBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Card Header */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>
              {admin.fullName.charAt(0).toUpperCase()}
            </Text>
          </View>

          <Text style={styles.profileName}>{admin.fullName}</Text>
          <Text style={styles.profileRoleTitle}>{getRoleTitle(admin.role)}</Text>

          <View style={styles.badgeRow}>
            <View style={styles.roleTag}>
              <Text style={styles.roleTagText}>{admin.role} · Tier {admin.role === 'SA' ? '1' : admin.role === 'TA' ? '2' : '3'}</Text>
            </View>

            <View
              style={[
                styles.statusTag,
                currentStatus === 'ACTIVE'
                  ? styles.statusActive
                  : currentStatus === 'PENDING'
                  ? styles.statusPending
                  : styles.statusDisabled,
              ]}
            >
              <Text
                style={[
                  styles.statusTagText,
                  currentStatus === 'ACTIVE'
                    ? styles.statusTextActive
                    : currentStatus === 'PENDING'
                    ? styles.statusTextPending
                    : styles.statusTextDisabled,
                ]}
              >
                ● {currentStatus === 'ACTIVE' ? 'Active' : currentStatus === 'PENDING' ? 'Pending Setup' : 'Suspended'}
              </Text>
            </View>
          </View>
        </View>

        {/* Contact & Assignment Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Contact & Jurisdiction</Text>

          <View style={styles.infoRow}>
            <PhoneCallIcon />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Registered Mobile</Text>
              <Text style={styles.infoValue}>+91 {admin.mobile}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <WarehouseMapIcon />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Assigned Hub / Warehouse</Text>
              <Text style={styles.infoValue}>{admin.warehouse ?? 'Central Platform Administration'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <ShieldCheckIcon />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Two-Factor Authentication (2FA)</Text>
              <Text style={[styles.infoValue, { color: ADMIN_PALETTE.successText }]}>
                SMS OTP Verified · Active
              </Text>
            </View>
          </View>
        </View>

        {/* Permissions Snapshot */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Access & Permissions</Text>
            {onViewPermissionsMatrix && (
              <TouchableOpacity onPress={onViewPermissionsMatrix} activeOpacity={0.7}>
                <Text style={styles.viewMatrixLink}>View Full Matrix →</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.permissionItem}>
            <Text style={styles.permName}>Farmer KYC & Farm Registration</Text>
            <Text style={styles.permBadge}>
              {admin.role === 'SA' || admin.role === 'TA' ? 'Full Approval' : 'Field Inspection Only'}
            </Text>
          </View>

          <View style={styles.permissionItem}>
            <Text style={styles.permName}>Dual-Approval Payouts (&gt; ₹10,000)</Text>
            <Text style={styles.permBadge}>
              {admin.role === 'SA' ? 'Final Sign-off' : admin.role === 'TA' ? 'First Level Review' : 'No Access'}
            </Text>
          </View>

          <View style={styles.permissionItem}>
            <Text style={styles.permName}>Channel Allocation Quotas</Text>
            <Text style={styles.permBadge}>
              {admin.role === 'SA' ? 'Edit & Publish' : 'Read Only'}
            </Text>
          </View>

          <View style={styles.permissionItem}>
            <Text style={styles.permName}>Daily Dispatch & Barcode Scans</Text>
            <Text style={styles.permBadge}>
              {admin.role === 'SW' || admin.role === 'MW' ? 'Assigned Hub Dispatch' : 'System-Wide Overview'}
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.resetPasswordBtn}
            onPress={handleResetPassword}
            activeOpacity={0.8}
          >
            <KeyResetIcon />
            <Text style={styles.resetPasswordBtnText}>Generate New Temporary Password</Text>
          </TouchableOpacity>

          {onViewActivityLogs && (
            <TouchableOpacity
              style={styles.activityLogsBtn}
              onPress={() => onViewActivityLogs(admin.id ?? 'adm-001')}
              activeOpacity={0.8}
            >
              <Text style={styles.activityLogsBtnText}>View Admin Activity Audit Logs</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.suspendBtn,
              currentStatus === 'DISABLED' && styles.reactivateBtn,
            ]}
            onPress={handleToggleStatus}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.suspendBtnText,
                currentStatus === 'DISABLED' && styles.reactivateBtnText,
              ]}
            >
              {currentStatus === 'DISABLED' ? 'Reactivate Login Rights' : 'Suspend Admin Login Access'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ADMIN_PALETTE.pageBg,
  },
  container: {
    flex: 1,
    backgroundColor: ADMIN_PALETTE.pageBg,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 110,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: ADMIN_PALETTE.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ADMIN_PALETTE.borderSoft,
  },
  editHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ADMIN_PALETTE.primaryOrangeLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ADMIN_PALETTE.primaryOrangeBorder,
    gap: 6,
  },
  editHeaderBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: ADMIN_PALETTE.primaryOrange,
  },
  profileCard: {
    backgroundColor: ADMIN_PALETTE.cardBg,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ADMIN_PALETTE.borderSoft,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: ADMIN_PALETTE.primaryOrangeLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: ADMIN_PALETTE.primaryOrangeBorder,
  },
  avatarInitial: {
    fontSize: 26,
    fontWeight: '800',
    color: ADMIN_PALETTE.primaryOrange,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    color: ADMIN_PALETTE.textHeading,
    marginBottom: 2,
  },
  profileRoleTitle: {
    fontSize: 13,
    color: ADMIN_PALETTE.textSecondary,
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleTag: {
    backgroundColor: '#FFF1EB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleTagText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: ADMIN_PALETTE.primaryOrange,
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusActive: {
    backgroundColor: ADMIN_PALETTE.successBg,
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusDisabled: {
    backgroundColor: ADMIN_PALETTE.dangerBg,
  },
  statusTagText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  statusTextActive: {
    color: ADMIN_PALETTE.successText,
  },
  statusTextPending: {
    color: '#B45309',
  },
  statusTextDisabled: {
    color: ADMIN_PALETTE.dangerText,
  },

  // Section Card
  sectionCard: {
    backgroundColor: ADMIN_PALETTE.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: ADMIN_PALETTE.borderSoft,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: ADMIN_PALETTE.textHeading,
    marginBottom: 12,
  },
  viewMatrixLink: {
    fontSize: 12,
    fontWeight: '700',
    color: ADMIN_PALETTE.primaryOrange,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 11.5,
    color: ADMIN_PALETTE.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: ADMIN_PALETTE.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: ADMIN_PALETTE.borderSoft,
    marginVertical: 6,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: ADMIN_PALETTE.pageBg,
  },
  permName: {
    fontSize: 12.5,
    fontWeight: '600',
    color: ADMIN_PALETTE.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  permBadge: {
    fontSize: 11.5,
    fontWeight: '700',
    color: ADMIN_PALETTE.textSecondary,
  },

  // Actions
  actionSection: {
    gap: 10,
  },
  resetPasswordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ADMIN_PALETTE.blueBg,
    borderRadius: 14,
    height: 48,
    borderWidth: 1,
    borderColor: ADMIN_PALETTE.blueBorder,
    gap: 8,
  },
  resetPasswordBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: ADMIN_PALETTE.blueText,
  },
  activityLogsBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ADMIN_PALETTE.cardBg,
    borderRadius: 14,
    height: 48,
    borderWidth: 1,
    borderColor: ADMIN_PALETTE.borderSoft,
  },
  activityLogsBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: ADMIN_PALETTE.textPrimary,
  },
  suspendBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ADMIN_PALETTE.dangerBg,
    borderRadius: 14,
    height: 48,
    borderWidth: 1,
    borderColor: ADMIN_PALETTE.dangerBorder,
  },
  suspendBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: ADMIN_PALETTE.dangerText,
  },
  reactivateBtn: {
    backgroundColor: ADMIN_PALETTE.successBg,
    borderColor: '#86EFAC',
  },
  reactivateBtnText: {
    color: ADMIN_PALETTE.successText,
  },
});
