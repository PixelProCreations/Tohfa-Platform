import React, { useState } from 'react';
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

// ─── Design Tokens (#F0562A Brand + Inspect Element Tokens) ─────────────────
const PALETTE = {
  primary:       '#F0562A',
  pageBg:        '#F7F5EE',
  cardBg:        '#FFFFFF',
  textInk:       '#1D2420',
  textSecondary: '#6B7280',
  textBody:      '#4B5563',
  border:        '#E7E2D6',
  buttonPrimary: '#F0562A',
  buttonSecondaryBorder: '#F0562A',
  buttonSecondaryText: '#F0562A',
  dismissBorder: '#FECDD3',
  dismissText:   '#DC2626',
  activeChipBg:  '#FFF0EB',
  activeChipBorder: '#F0562A',
  activeChipText:   '#F0562A',
  chipBg:        '#FFFFFF',
  chipBorder:    '#E5E7EB',
  chipText:      '#4B5563',
  amberAccent:   '#F0562A',
  redAccent:     '#DC2626',
  blueBoxBg:     '#EFF6FF',
  blueBoxBorder: '#BFDBFE',
  blueBoxText:   '#1E40AF',
};

// ─── Pure SVG Icons ─────────────────────────────────────────────────────────

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

function ClipboardCheckIcon({ size = 18, color = '#DC2626' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function AlertCircleIcon({ size = 18, color = '#DC2626' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v4m0 4h.01"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ExternalLinkIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Component Props ─────────────────────────────────────────────────────────

export interface SubWarehouseApprovalAlertsScreenProps {
  onBack?: () => void;
  onOpenRecord?: (alertId?: string) => void;
  onSnooze?: (alertId?: string) => void;
  onDismiss?: (alertId?: string) => void;
  onNavigateToExpenseRecord?: () => void;
  onNavigateToGoodsReceiptDetail?: () => void;
}

interface AlertItem {
  id: string;
  type: 'approval' | 'exception';
  title: string;
  reference: string;
  actionText: string;
  isCritical?: boolean;
  status: 'active' | 'snoozed' | 'dismissed';
}

const INITIAL_ALERTS: AlertItem[] = [
  {
    id: 'EXP-001245',
    type: 'approval',
    title: 'Approval Required — Expense / Operational Record',
    reference: 'Reference EXP-001245',
    actionText: 'Action Required: Review · Today · 11:20 AM',
    status: 'active',
  },
  {
    id: 'GR-00245',
    type: 'exception',
    title: 'Quantity Mismatch',
    reference: 'GR-00245',
    actionText: 'Expected 500 kg · Received 460 kg · Status Open · 25 Sep · 10:42 AM',
    isCritical: true,
    status: 'active',
  },
];

export function SubWarehouseApprovalAlertsScreen({
  onBack,
  onOpenRecord,
  onSnooze,
  onDismiss,
  onNavigateToExpenseRecord,
  onNavigateToGoodsReceiptDetail,
}: SubWarehouseApprovalAlertsScreenProps): React.JSX.Element {
  const [activeFilter, setActiveFilter] = useState<'All' | 'Approvals' | 'Exceptions' | 'Snoozed'>('All');
  const [alerts, setAlerts] = useState<AlertItem[]>(INITIAL_ALERTS);
  const [selectedAlertId, setSelectedAlertId] = useState<string>('EXP-001245');

  const activeAlerts = alerts.filter((a) => a.status === 'active');
  const approvalsCount = alerts.filter((a) => a.type === 'approval' && a.status === 'active').length;
  const exceptionsCount = alerts.filter((a) => a.type === 'exception' && a.status === 'active').length;
  const criticalCount = alerts.filter((a) => a.isCritical && a.status === 'active').length;
  const snoozedCount = alerts.filter((a) => a.status === 'snoozed').length;

  const filteredAlerts = alerts.filter((a) => {
    if (activeFilter === 'Snoozed') return a.status === 'snoozed';
    if (a.status !== 'active') return false;
    if (activeFilter === 'Approvals') return a.type === 'approval';
    if (activeFilter === 'Exceptions') return a.type === 'exception';
    return true;
  });

  const handleSnooze = () => {
    if (onSnooze) {
      onSnooze(selectedAlertId);
      return;
    }
    setAlerts((prev) =>
      prev.map((a) => (a.id === selectedAlertId ? { ...a, status: 'snoozed' } : a))
    );
    Alert.alert('Alert Snoozed', `${selectedAlertId} has been snoozed for 1 hour.`);
  };

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss(selectedAlertId);
      return;
    }
    setAlerts((prev) =>
      prev.map((a) => (a.id === selectedAlertId ? { ...a, status: 'dismissed' } : a))
    );
    Alert.alert('Alert Dismissed', `${selectedAlertId} has been dismissed.`);
  };

  const handleOpenRecord = () => {
    if (selectedAlertId === 'EXP-001245' && onNavigateToExpenseRecord) {
      onNavigateToExpenseRecord();
    } else if (selectedAlertId === 'GR-00245' && onNavigateToGoodsReceiptDetail) {
      onNavigateToGoodsReceiptDetail();
    } else if (onOpenRecord) {
      onOpenRecord(selectedAlertId);
    } else {
      Alert.alert('Open Record', `Opening record ${selectedAlertId}`);
    }
  };

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

          <Text style={styles.headerTitle}>Approval / Exception Alerts</Text>
        </View>
      </View>

      {/* ─── Scrollable Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 4 Stat Cards in 2x2 Grid ─── */}
        <View style={styles.statGrid}>
          <View style={styles.statRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>ALL ALERTS</Text>
              <Text style={styles.statNumber}>{activeAlerts.length > 0 ? 12 + activeAlerts.length : 0}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>APPROVAL</Text>
              <Text style={styles.statNumber}>{4 + approvalsCount}</Text>
            </View>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>EXCEPTIONS</Text>
              <Text style={styles.statNumber}>{8 + exceptionsCount}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>CRITICAL</Text>
              <Text style={[styles.statNumber, { color: PALETTE.redAccent }]}>{1 + criticalCount}</Text>
            </View>
          </View>
        </View>

        {/* ─── Filter Chips ─── */}
        <View style={styles.chipsRow}>
          {(['All', 'Approvals', 'Exceptions', 'Snoozed'] as const).map((chip) => {
            const isActive = activeFilter === chip;
            return (
              <TouchableOpacity
                key={chip}
                style={[styles.chip, isActive && styles.activeChip]}
                onPress={() => setActiveFilter(chip)}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, isActive && styles.activeChipText]}>
                  {chip === 'Snoozed' ? `Snoozed (${snoozedCount})` : chip}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── Alert Card 1: Approval Required (Amber Accent) ─── */}
        {filteredAlerts.some((a) => a.id === 'EXP-001245') && (
          <TouchableOpacity
            style={[
              styles.alertCard,
              styles.amberBar,
              selectedAlertId === 'EXP-001245' && styles.selectedAlertCard,
            ]}
            onPress={() => {
              setSelectedAlertId('EXP-001245');
              if (onNavigateToExpenseRecord) onNavigateToExpenseRecord();
            }}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeaderRow}>
              <View style={styles.iconSquare}>
                <ClipboardCheckIcon size={18} />
              </View>
              <View style={styles.cardHeaderContent}>
                <Text style={styles.alertTitle}>
                  Approval Required — Expense / Operational Record
                </Text>
                <Text style={styles.alertRef}>Reference EXP-001245</Text>
                <Text style={styles.alertAction}>
                  Action Required: Review · Today · 11:20 AM
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* ─── Blue Info Box ─── */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            SWA can view this alert, but only actions the role matrix actually grants appear — SWA does not get an approval action here since expense-claim approval isn't granted.
          </Text>
        </View>

        {/* ─── Alert Card 2: Quantity Mismatch (Red Accent) ─── */}
        {filteredAlerts.some((a) => a.id === 'GR-00245') && (
          <TouchableOpacity
            style={[
              styles.alertCard,
              styles.redBar,
              selectedAlertId === 'GR-00245' && styles.selectedAlertCard,
            ]}
            onPress={() => {
              setSelectedAlertId('GR-00245');
              if (onNavigateToGoodsReceiptDetail) onNavigateToGoodsReceiptDetail();
            }}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeaderRow}>
              <View style={styles.iconSquare}>
                <AlertCircleIcon size={18} />
              </View>
              <View style={styles.cardHeaderContent}>
                <Text style={styles.alertTitle}>Quantity Mismatch</Text>
                <Text style={styles.alertRef}>GR-00245</Text>
                <Text style={styles.alertAction}>
                  Expected 500 kg · Received 460 kg · Status Open · 25 Sep · 10:42 AM
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {filteredAlerts.length === 0 && (
          <View style={{ paddingVertical: 28, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Poppins', fontSize: 13, color: PALETTE.textSecondary }}>
              No alerts in this category.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ─── Sticky Bottom Action Bar ─── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleOpenRecord}
          activeOpacity={0.8}
        >
          <View style={styles.btnRow}>
            <ExternalLinkIcon size={18} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>Open Related Record</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={handleSnooze}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryBtnText}>Snooze</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dismissBtn}
          onPress={handleDismiss}
          activeOpacity={0.7}
        >
          <Text style={styles.dismissBtnText}>Dismiss</Text>
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
    backgroundColor: PALETTE.pageBg,
  },
  statGrid: {
    gap: 10,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  statLabel: {
    fontFamily: 'Poppins',
    fontSize: 10,
    fontWeight: '700',
    color: PALETTE.textSecondary,
    letterSpacing: 0.5,
  },
  statNumber: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginTop: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    backgroundColor: PALETTE.chipBg,
    borderWidth: 1,
    borderColor: PALETTE.chipBorder,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  activeChip: {
    backgroundColor: PALETTE.activeChipBg,
    borderColor: PALETTE.activeChipBorder,
  },
  chipText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.chipText,
  },
  activeChipText: {
    color: PALETTE.activeChipText,
    fontWeight: '700',
  },
  alertCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
    marginBottom: 12,
  },
  selectedAlertCard: {
    borderColor: PALETTE.primary,
    backgroundColor: '#FFFAF8',
  },
  amberBar: {
    borderLeftWidth: 4,
    borderLeftColor: PALETTE.amberAccent,
  },
  redBar: {
    borderLeftWidth: 4,
    borderLeftColor: PALETTE.redAccent,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconSquare: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  cardHeaderContent: {
    flex: 1,
  },
  alertTitle: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textInk,
    lineHeight: 18,
  },
  alertRef: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: PALETTE.textSecondary,
    marginTop: 4,
  },
  alertAction: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: PALETTE.textBody,
    marginTop: 4,
  },
  infoBox: {
    backgroundColor: PALETTE.blueBoxBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.blueBoxBorder,
    padding: 13,
    marginBottom: 14,
  },
  infoText: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '500',
    color: PALETTE.blueBoxText,
    lineHeight: 16.5,
  },
  bottomBar: {
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: '#F0ECE3',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: PALETTE.buttonPrimary,
    borderRadius: 10,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryBtnText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryBtn: {
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.buttonSecondaryBorder,
    borderRadius: 10,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.buttonSecondaryText,
  },
  dismissBtn: {
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.dismissBorder,
    borderRadius: 10,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissBtnText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.dismissText,
  },
});
