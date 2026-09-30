import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

const PALETTE = {
  primary:       '#F0562A',
  pageBg:        '#F7F5EE',
  cardBg:        '#FFFFFF',
  textInk:       '#1D2420',
  textSecondary: '#6B7280',
  textMuted:     '#9CA3AF',
  border:        '#E7E2D6',
  divider:       '#F0ECE3',
  pendingBadgeBg:'#FEE2E2',
  pendingBadgeText:'#DC2626',
  statusAmberBg: '#FFF0EB',
  statusAmberText:'#F0562A',
  buttonPrimary: '#F0562A',
};

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 13l4 4L19 7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PaperclipIcon({ size = 15, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface SubWarehouseExpenseRecordScreenProps {
  onBack?: () => void;
  onApprove?: () => void;
}

export function SubWarehouseExpenseRecordScreen({
  onBack,
  onApprove,
}: SubWarehouseExpenseRecordScreenProps): React.JSX.Element {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Header Banner ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Back"
          >
            <ArrowBackIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Expense / Operational Record</Text>
        </View>
      </View>

      {/* ─── Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Expense Card */}
        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            <Text style={styles.expenseId}>EXP-001245</Text>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>Pending Approval</Text>
            </View>
          </View>
          <Text style={styles.expenseSubtitle}>
            Review expense claim for warehouse operations.
          </Text>
        </View>

        {/* Record Information Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Record Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type</Text>
            <Text style={styles.infoValue}>Expense Claim</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Amount</Text>
            <Text style={[styles.infoValue, { color: PALETTE.textInk, fontWeight: '700' }]}>₹2,500</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Submitted By</Text>
            <Text style={styles.infoValue}>Admin User</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Submitted On</Text>
            <Text style={styles.infoValue}>25 Sep 2026 · 11:20 AM</Text>
          </View>

          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoLabel}>Status</Text>
            <View style={styles.amberBadge}>
              <Text style={styles.amberBadgeText}>Pending Approval</Text>
            </View>
          </View>
        </View>

        {/* Details Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Details</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Category</Text>
            <Text style={styles.infoValue}>Operational</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Description</Text>
            <Text style={[styles.infoValue, { flex: 1, textAlign: 'right' }]}>Fuel expense for forklift</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Warehouse</Text>
            <Text style={styles.infoValue}>Coonoor Warehouse</Text>
          </View>

          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoLabel}>Attachment</Text>
            <TouchableOpacity
              style={styles.attachmentRow}
              onPress={() => Alert.alert('Attachment', 'Viewing invoice.pdf')}
              activeOpacity={0.7}
            >
              <PaperclipIcon size={14} />
              <Text style={styles.attachmentText}>invoice.pdf</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* ─── Bottom Button ─── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onApprove ? onApprove : () => Alert.alert('Review Action', 'Expense submitted for authorization.')}
          activeOpacity={0.8}
        >
          <View style={styles.btnRow}>
            <CheckIcon size={18} />
            <Text style={styles.actionBtnText}>Approve / Review</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  headerBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    paddingRight: 14,
    paddingVertical: 4,
  },
  headerTitle: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  expenseId: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  pendingBadge: {
    backgroundColor: PALETTE.pendingBadgeBg,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pendingBadgeText: {
    fontFamily: 'Poppins',
    fontSize: 10.5,
    fontWeight: '700',
    color: PALETTE.pendingBadgeText,
  },
  expenseSubtitle: {
    fontFamily: 'Poppins',
    fontSize: 12.5,
    color: PALETTE.textSecondary,
    lineHeight: 18,
  },
  sectionTitle: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.divider,
  },
  infoLabel: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: PALETTE.textSecondary,
  },
  infoValue: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.textInk,
  },
  amberBadge: {
    backgroundColor: PALETTE.statusAmberBg,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  amberBadgeText: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.statusAmberText,
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  attachmentText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.primary,
    textDecorationLine: 'underline',
  },
  bottomBar: {
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionBtn: {
    backgroundColor: PALETTE.buttonPrimary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtnText: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
