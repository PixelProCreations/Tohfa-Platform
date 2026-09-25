import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import {
  ADMIN_PALETTE,
  AdminBackChevronIcon,
} from './CreateAdminAccountScreen';

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function CheckIcon({ color = '#FFFFFF', size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CrossIcon({ color = ADMIN_PALETTE.dangerText, size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WarehouseIcon({ color = ADMIN_PALETTE.textSecondary, size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 21h18M3 10h18M5 10v11M9 10v11M15 10v11M19 10v11M12 3l9 7H3l9-7z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface AdminAccountRequest {
  id: string;
  candidateName: string;
  mobile: string;
  requestedRole: 'SW' | 'FA';
  requestedWarehouse: string;
  submittedBy: string;
  submittedAt: string;
  reason: string;
}

const MOCK_REQUESTS: AdminAccountRequest[] = [
  {
    id: 'req-101',
    candidateName: 'Dhanalakshmi V',
    mobile: '9443219088',
    requestedRole: 'SW',
    requestedWarehouse: 'Kotagiri Sub-Warehouse (SW)',
    submittedBy: 'Anitha Raghavan (TOHFA Admin)',
    submittedAt: 'Today, 09:30 AM',
    reason: 'New warehouse opening for high-volume cabbage and carrot harvest cycle in Kotagiri zone.',
  },
  {
    id: 'req-102',
    candidateName: 'Ravi Chandran',
    mobile: '9842109844',
    requestedRole: 'SW',
    requestedWarehouse: 'Coonoor Sub-Warehouse (SW)',
    submittedBy: 'Suresh Mani (TOHFA Admin)',
    submittedAt: 'Yesterday, 04:15 PM',
    reason: 'Backfill replacement for warehouse dispatch assistant supervisor.',
  },
];

export interface AdminRequestsApprovalScreenProps {
  onBack?: (() => void) | undefined;
  onRequestHandled?: (() => void) | undefined;
}

export function AdminRequestsApprovalScreen({
  onBack,
  onRequestHandled,
}: AdminRequestsApprovalScreenProps) {
  const [requests, setRequests] = useState<AdminAccountRequest[]>(MOCK_REQUESTS);

  const handleApprove = (req: AdminAccountRequest) => {
    const tempPass = 'Tohfa@' + Math.floor(1000 + Math.random() * 9000);
    Alert.alert(
      'Account Request Approved',
      `Admin account for ${req.candidateName} (${req.requestedWarehouse}) has been created.\n\nTemporary Password: ${tempPass}\n\nSMS credentials sent to +91 ${req.mobile}.`,
      [
        {
          text: 'OK',
          onPress: () => {
            setRequests((prev) => prev.filter((r) => r.id !== req.id));
            onRequestHandled?.();
          },
        },
      ]
    );
  };

  const handleReject = (req: AdminAccountRequest) => {
    Alert.alert(
      'Reject Request',
      `Are you sure you want to reject the admin creation request for ${req.candidateName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject Request',
          style: 'destructive',
          onPress: () => {
            setRequests((prev) => prev.filter((r) => r.id !== req.id));
            onRequestHandled?.();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={ADMIN_PALETTE.pageBg} />

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
      </View>

      {/* Title Block */}
      <View style={styles.titleBlock}>
        <Text style={styles.screenTitle}>Admin Account Requests</Text>
        <Text style={styles.screenSubtitle}>
          Sign-off required by Super Admin before regional staff accounts are provisioned
        </Text>
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.requestCard}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.candidateName}>{item.candidateName}</Text>
                <Text style={styles.candidateMobile}>+91 {item.mobile}</Text>
              </View>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>
                  {item.requestedRole === 'SW' ? 'Sub Warehouse Admin' : 'Field Admin'}
                </Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <WarehouseIcon />
              <Text style={styles.metaText}>{item.requestedWarehouse}</Text>
            </View>

            <View style={styles.reasonCard}>
              <Text style={styles.reasonLabel}>Request Rationale</Text>
              <Text style={styles.reasonText}>{item.reason}</Text>
            </View>

            <View style={styles.submittedByRow}>
              <Text style={styles.submittedByText}>
                Requested by <Text style={{ fontWeight: '700', color: ADMIN_PALETTE.textPrimary }}>{item.submittedBy}</Text> · {item.submittedAt}
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.rejectBtn}
                onPress={() => handleReject(item)}
                activeOpacity={0.8}
              >
                <CrossIcon />
                <Text style={styles.rejectBtnText}>Reject</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.approveBtn}
                onPress={() => handleApprove(item)}
                activeOpacity={0.85}
              >
                <CheckIcon />
                <Text style={styles.approveBtnText}>Approve & Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>All Requests Processed</Text>
            <Text style={styles.emptySubtitle}>
              There are no pending admin account requests at this moment.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ADMIN_PALETTE.pageBg,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    marginBottom: 12,
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
  titleBlock: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: ADMIN_PALETTE.textHeading,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 13,
    color: ADMIN_PALETTE.textSecondary,
    lineHeight: 18,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 14,
  },
  requestCard: {
    backgroundColor: ADMIN_PALETTE.cardBg,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: ADMIN_PALETTE.borderSoft,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  candidateName: {
    fontSize: 16,
    fontWeight: '800',
    color: ADMIN_PALETTE.textPrimary,
  },
  candidateMobile: {
    fontSize: 12.5,
    color: ADMIN_PALETTE.textSecondary,
    marginTop: 1,
  },
  roleBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '600',
    color: ADMIN_PALETTE.textPrimary,
  },
  reasonCard: {
    backgroundColor: ADMIN_PALETTE.pageBg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: ADMIN_PALETTE.borderSoft,
    marginBottom: 10,
  },
  reasonLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: ADMIN_PALETTE.textSecondary,
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  reasonText: {
    fontSize: 12.5,
    color: ADMIN_PALETTE.textPrimary,
    lineHeight: 17,
  },
  submittedByRow: {
    marginBottom: 14,
  },
  submittedByText: {
    fontSize: 11.5,
    color: ADMIN_PALETTE.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 12,
    backgroundColor: ADMIN_PALETTE.dangerBg,
    borderWidth: 1,
    borderColor: ADMIN_PALETTE.dangerBorder,
    gap: 6,
  },
  rejectBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: ADMIN_PALETTE.dangerText,
  },
  approveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 12,
    backgroundColor: ADMIN_PALETTE.primaryOrange,
    gap: 6,
    shadowColor: ADMIN_PALETTE.primaryOrange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  approveBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ADMIN_PALETTE.textPrimary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: ADMIN_PALETTE.textSecondary,
    textAlign: 'center',
  },
});
