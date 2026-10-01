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
  highBadgeBg:   '#FEE2E2',
  highBadgeText: '#DC2626',
  pendingBadgeBg:'#FFF0EB',
  pendingBadgeText:'#F0562A',
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

function CheckCircleIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface SubWarehouseTaskDetailScreenProps {
  onBack?: () => void;
  onMarkInProgress?: () => void;
}

export function SubWarehouseTaskDetailScreen({
  onBack,
  onMarkInProgress,
}: SubWarehouseTaskDetailScreenProps): React.JSX.Element {
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

          <Text style={styles.headerTitle}>Task Details</Text>
        </View>
      </View>

      {/* ─── Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Task Card */}
        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            <Text style={styles.taskTitle}>QC Follow-up</Text>
            <View style={styles.highBadge}>
              <Text style={styles.highBadgeText}>HIGH</Text>
            </View>
          </View>
          <Text style={styles.taskRef}>GR-00245</Text>
          <Text style={styles.taskDesc}>
            Review receiving exception for GR-00245.
          </Text>
        </View>

        {/* Task Information Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Task Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>Pending</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Priority</Text>
            <Text style={[styles.infoValue, { color: '#DC2626', fontWeight: '700' }]}>High</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Due Date</Text>
            <Text style={styles.infoValue}>25 Sep 2026 · 12:30 PM</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Reference</Text>
            <Text style={styles.infoValue}>GR-00245</Text>
          </View>

          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoLabel}>Assigned To</Text>
            <Text style={styles.infoValue}>Ramesh Kumar</Text>
          </View>
        </View>

        {/* Related Information Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Related Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Warehouse</Text>
            <Text style={styles.infoValue}>Coonoor Warehouse</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type</Text>
            <Text style={styles.infoValue}>Goods Receipt</Text>
          </View>

          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoLabel}>Created On</Text>
            <Text style={styles.infoValue}>24 Sep 2026 · 10:15 AM</Text>
          </View>
        </View>
      </ScrollView>

      {/* ─── Bottom Button ─── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onMarkInProgress ? onMarkInProgress : () => Alert.alert('Status Updated', 'Task marked as In Progress')}
          activeOpacity={0.8}
        >
          <View style={styles.btnRow}>
            <CheckCircleIcon size={18} />
            <Text style={styles.actionBtnText}>Mark as In Progress</Text>
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
  taskTitle: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  highBadge: {
    backgroundColor: PALETTE.highBadgeBg,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  highBadgeText: {
    fontFamily: 'Poppins',
    fontSize: 10.5,
    fontWeight: '700',
    color: PALETTE.highBadgeText,
  },
  taskRef: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.textSecondary,
    marginBottom: 8,
  },
  taskDesc: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: '#4B5563',
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
  pendingBadge: {
    backgroundColor: PALETTE.pendingBadgeBg,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pendingBadgeText: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.pendingBadgeText,
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
