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
  openBadgeBg:   '#FFF0EB',
  openBadgeText: '#F0562A',
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

function ClipboardCheckIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface SubWarehouseGoodsReceiptDetailScreenProps {
  onBack?: () => void;
  onTakeAction?: () => void;
}

export function SubWarehouseGoodsReceiptDetailScreen({
  onBack,
  onTakeAction,
}: SubWarehouseGoodsReceiptDetailScreenProps): React.JSX.Element {
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

          <Text style={styles.headerTitle}>Goods Receipt Details</Text>
        </View>
      </View>

      {/* ─── Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Receipt Card */}
        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            <Text style={styles.receiptId}>GR-00245</Text>
            <View style={styles.openBadge}>
              <Text style={styles.openBadgeText}>Open</Text>
            </View>
          </View>
          <Text style={styles.receiptSubtitle}>
            Expected: 500 kg | Received: 460 kg
          </Text>
        </View>

        {/* Receipt Information Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Receipt Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Product</Text>
            <Text style={styles.infoValue}>Tomato Grade 1</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Expected Qty</Text>
            <Text style={styles.infoValue}>500 kg</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Received Qty</Text>
            <Text style={styles.infoValue}>460 kg</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Variance</Text>
            <Text style={[styles.infoValue, { color: '#DC2626', fontWeight: '700' }]}>40 kg (8%)</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <View style={styles.openBadge}>
              <Text style={styles.openBadgeText}>Open</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>25 Sep 2026 · 10:42 AM</Text>
          </View>

          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoLabel}>Supplier</Text>
            <Text style={styles.infoValue}>ABC Farmers Co-op</Text>
          </View>
        </View>

        {/* Notes Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.notesText}>
            Quantity received is less than expected. Please review and take action.
          </Text>
        </View>
      </ScrollView>

      {/* ─── Bottom Button ─── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onTakeAction ? onTakeAction : () => Alert.alert('Action Taken', 'Initiating quantity mismatch reconciliation.')}
          activeOpacity={0.8}
        >
          <View style={styles.btnRow}>
            <ClipboardCheckIcon size={18} />
            <Text style={styles.actionBtnText}>Take Action</Text>
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
  receiptId: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  openBadge: {
    backgroundColor: PALETTE.openBadgeBg,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  openBadgeText: {
    fontFamily: 'Poppins',
    fontSize: 10.5,
    fontWeight: '700',
    color: PALETTE.openBadgeText,
  },
  receiptSubtitle: {
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
  notesText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 19,
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
