import React, { useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import {
  ADMIN_PALETTE,
  AdminBackChevronIcon,
  type AdminRoleType,
} from './CreateAdminAccountScreen';
import { type AdminAccountRequest } from './AdminRequestsApprovalScreen';

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function CheckCircleIcon({ color = '#15803D', size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M8 12l2.5 2.5L16 9" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CrossCircleIcon({ color = '#DC2626', size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M15 9l-6 6M9 9l6 6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UserIcon({ color = ADMIN_PALETTE.primaryOrange, size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function BuildingIcon({ color = ADMIN_PALETTE.primaryOrange, size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 21h18M3 10h18M5 10v11M9 10v11M15 10v11M19 10v11M12 3l9 7H3l9-7z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ShieldIcon({ color = ADMIN_PALETTE.primaryOrange, size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CalendarIcon({ color = ADMIN_PALETTE.textSecondary, size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Component Props ──────────────────────────────────────────────────────────
export interface AdminRequestDetailScreenProps {
  request?: AdminAccountRequest | undefined;
  onBack: () => void;
  onApprove?: ((requestId: string) => void) | undefined;
  onReject?: ((requestId: string, reason?: string) => void) | undefined;
}

const DEFAULT_REQUEST: AdminAccountRequest = {
  id: 'REQ-0941',
  candidateName: 'Ramesh Patel',
  mobile: '+91 98450 11223',
  requestedRole: 'SW',
  requestedWarehouse: 'Hubli Sub-Warehouse #4',
  submittedBy: 'Kavita Iyer (Tohfa Admin)',
  submittedAt: '24 Sep 2026, 11:30 AM',
  reason: 'Expanding logistics coverage for North Karnataka hub. Candidate has 4 years experience in cold-storage inventory operations.',
};

export function AdminRequestDetailScreen({
  request = DEFAULT_REQUEST,
  onBack,
  onApprove,
  onReject,
}: AdminRequestDetailScreenProps) {
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const getRoleLabel = (r: 'SW' | 'FA' | 'MW' | 'TA' | 'SA' | string) => {
    switch (r) {
      case 'SW':
        return 'Sub-Warehouse Admin';
      case 'FA':
        return 'Farmer Admin';
      case 'MW':
        return 'Main Warehouse Admin';
      case 'TA':
        return 'Tohfa Admin';
      case 'SA':
        return 'Super Admin';
      default:
        return 'Admin';
    }
  };

  const handleApprove = () => {
    Alert.alert(
      'Approve Admin Request',
      `Are you sure you want to approve ${request.candidateName} as ${getRoleLabel(request.requestedRole)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve & Provision',
          onPress: () => {
            if (onApprove) {
              onApprove(request.id);
            }
            Alert.alert('Account Approved', `Account for ${request.candidateName} has been provisioned and login SMS dispatched.`);
            onBack();
          },
        },
      ],
    );
  };

  const confirmReject = () => {
    setRejectModalVisible(false);
    if (onReject) {
      onReject(request.id, rejectReason);
    }
    Alert.alert('Request Rejected', `The request for ${request.candidateName} has been declined.`);
    onBack();
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={ADMIN_PALETTE.pageBg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Back to requests"
        >
          <AdminBackChevronIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Details</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Banner */}
        <View style={styles.statusBanner}>
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>PENDING REVIEW</Text>
          </View>
          <Text style={styles.requestIdText}>{request.id}</Text>
        </View>

        {/* Candidate Profile Card */}
        <View style={styles.card}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitial}>
                {request.candidateName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.avatarMeta}>
              <Text style={styles.candidateName}>{request.candidateName}</Text>
              <Text style={styles.candidateMobile}>{request.mobile}</Text>
            </View>
          </View>
        </View>

        {/* Role & Assignment Info */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Requested Assignment</Text>

          <View style={styles.detailRow}>
            <View style={styles.iconBox}>
              <ShieldIcon size={16} />
            </View>
            <View style={styles.detailMeta}>
              <Text style={styles.detailLabel}>Assigned Role</Text>
              <Text style={styles.detailValue}>{getRoleLabel(request.requestedRole)}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.iconBox}>
              <BuildingIcon size={16} />
            </View>
            <View style={styles.detailMeta}>
              <Text style={styles.detailLabel}>Assigned Facility / Warehouse</Text>
              <Text style={styles.detailValue}>{request.requestedWarehouse}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.iconBox}>
              <UserIcon size={16} />
            </View>
            <View style={styles.detailMeta}>
              <Text style={styles.detailLabel}>Submitted By</Text>
              <Text style={styles.detailValue}>{request.submittedBy}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.iconBox}>
              <CalendarIcon size={16} />
            </View>
            <View style={styles.detailMeta}>
              <Text style={styles.detailLabel}>Submission Timestamp</Text>
              <Text style={styles.detailValue}>{request.submittedAt}</Text>
            </View>
          </View>
        </View>

        {/* Business Justification */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Submission Justification</Text>
          <View style={styles.reasonBox}>
            <Text style={styles.reasonText}>{request.reason}</Text>
          </View>
        </View>

        {/* Verification Checklist */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Pre-Approval Checks</Text>
          <View style={styles.checkItem}>
            <CheckCircleIcon size={18} />
            <Text style={styles.checkItemText}>Aadhaar / Mobile KYC record matched</Text>
          </View>
          <View style={styles.checkItem}>
            <CheckCircleIcon size={18} />
            <Text style={styles.checkItemText}>No duplicate active admin accounts found</Text>
          </View>
          <View style={styles.checkItem}>
            <CheckCircleIcon size={18} />
            <Text style={styles.checkItemText}>Warehouse supervisor headcount approved</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.approveBtn}
            onPress={handleApprove}
            activeOpacity={0.85}
          >
            <CheckCircleIcon color="#FFFFFF" size={18} />
            <Text style={styles.approveBtnText}>Approve & Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.rejectBtn}
            onPress={() => setRejectModalVisible(true)}
            activeOpacity={0.85}
          >
            <CrossCircleIcon color="#DC2626" size={18} />
            <Text style={styles.rejectBtnText}>Decline Request</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Reject Modal */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Decline Admin Request</Text>
            <Text style={styles.modalSubtitle}>
              Please provide a reason for declining {request.candidateName}&apos;s account creation.
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Incomplete KYC documentation or duplicate location..."
              placeholderTextColor={ADMIN_PALETTE.textMuted}
              multiline
              numberOfLines={3}
              value={rejectReason}
              onChangeText={setRejectReason}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setRejectModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmRejectBtn}
                onPress={confirmReject}
              >
                <Text style={styles.modalConfirmRejectText}>Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ADMIN_PALETTE.pageBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: ADMIN_PALETTE.pageBg,
    borderBottomWidth: 1,
    borderBottomColor: ADMIN_PALETTE.borderSoft,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: ADMIN_PALETTE.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ADMIN_PALETTE.borderSoft,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: ADMIN_PALETTE.textHeading,
  },
  headerRightPlaceholder: {
    width: 38,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  statusBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  statusPill: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.5,
  },
  requestIdText: {
    fontSize: 13,
    fontWeight: '700',
    color: ADMIN_PALETTE.textSecondary,
  },
  card: {
    backgroundColor: ADMIN_PALETTE.cardBg,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: ADMIN_PALETTE.borderSoft,
    shadowColor: '#000000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: ADMIN_PALETTE.primaryOrangeLight,
    borderWidth: 1.5,
    borderColor: ADMIN_PALETTE.primaryOrangeBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: '800',
    color: ADMIN_PALETTE.primaryOrange,
  },
  avatarMeta: {
    flex: 1,
  },
  candidateName: {
    fontSize: 18,
    fontWeight: '700',
    color: ADMIN_PALETTE.textPrimary,
    marginBottom: 3,
  },
  candidateMobile: {
    fontSize: 14,
    color: ADMIN_PALETTE.textSecondary,
    fontWeight: '500',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: ADMIN_PALETTE.textHeading,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: ADMIN_PALETTE.primaryOrangeLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailMeta: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: ADMIN_PALETTE.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: ADMIN_PALETTE.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: ADMIN_PALETTE.borderSoft,
    marginVertical: 4,
  },
  reasonBox: {
    backgroundColor: '#FAF8F5',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: ADMIN_PALETTE.borderSoft,
  },
  reasonText: {
    fontSize: 13,
    color: ADMIN_PALETTE.textPrimary,
    lineHeight: 20,
    fontWeight: '500',
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 10,
  },
  checkItemText: {
    fontSize: 13,
    color: ADMIN_PALETTE.textPrimary,
    fontWeight: '500',
  },
  actionsContainer: {
    marginTop: 8,
    gap: 10,
  },
  approveBtn: {
    backgroundColor: '#15803D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  rejectBtn: {
    backgroundColor: ADMIN_PALETTE.cardBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    gap: 8,
  },
  rejectBtnText: {
    color: '#DC2626',
    fontSize: 15,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 360,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: ADMIN_PALETTE.textHeading,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: ADMIN_PALETTE.textSecondary,
    marginBottom: 14,
    lineHeight: 18,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: ADMIN_PALETTE.borderSoft,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: ADMIN_PALETTE.textPrimary,
    textAlignVertical: 'top',
    minHeight: 80,
    backgroundColor: '#FAF8F5',
    marginBottom: 16,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: ADMIN_PALETTE.textSecondary,
  },
  modalConfirmRejectBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalConfirmRejectText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
