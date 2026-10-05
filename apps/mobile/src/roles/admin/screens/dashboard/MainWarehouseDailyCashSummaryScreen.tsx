import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

const PALETTE = {
  primary:       '#F0562A', // Used for header & button
  pageBg:        '#F7F4EF',
  cardBg:        '#FFFFFF',
  textInk:       '#000000',
  textSecondary: '#6B7280',
  border:        '#EAE5DF',
  greenBg:       '#E7F7F0',
  greenText:     '#009A60',
};

function ArrowBackIcon({ size = 24, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 12H4M10 18l-6-6 6-6"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckIcon({ size = 14, color = '#009A60' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ScalesIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3v18M6 7l6-3 6 3M6 7l-3 7h6l-3-7zM18 7l-3 7h6l-3-7zM4 21h16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface MainWarehouseDailyCashSummaryScreenProps {
  onBack?: () => void;
}

export function MainWarehouseDailyCashSummaryScreen({
  onBack,
}: MainWarehouseDailyCashSummaryScreenProps) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Daily Cash Summary</Text>
        </View>
        <Text style={styles.headerSub}>25 Sep 2026 · Coonoor</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Reconciled Box */}
        <View style={styles.reconciledBox}>
          <Text style={styles.reconciledValue}>₹0</Text>
          <View style={styles.reconciledLabelRow}>
            <CheckIcon size={12} color={PALETTE.greenText} />
            <Text style={styles.reconciledLabelText}>
              Reconciled — Physical cash matches system cash
            </Text>
          </View>
        </View>

        {/* System Cash & Transactions Row */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>SYSTEM CASH</Text>
            <Text style={styles.kpiValue}>₹18,500</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>TRANSACTIONS</Text>
            <Text style={styles.kpiValue}>12</Text>
          </View>
        </View>

        {/* Physical Cash Entry */}
        <Text style={styles.sectionTitle}>Physical Cash Entry</Text>
        <View style={styles.physicalEntryCard}>
          <Text style={styles.rupeeSymbol}>₹</Text>
          <Text style={styles.physicalEntryText}>18500</Text>
        </View>

        {/* Breakdown Card */}
        <View style={styles.breakdownCard}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>System Recorded</Text>
            <Text style={styles.breakdownValue}>₹18,500</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Physical Count</Text>
            <Text style={styles.breakdownValue}>₹18500</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabelBold}>Variance</Text>
            <Text style={styles.breakdownValueBold}>₹0</Text>
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            A variance never automatically modifies the wallet ledger or cash records — it always surfaces as Review Required instead.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8}>
          <ScalesIcon size={20} color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>Reconcile Cash</Text>
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
  header: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  headerSub: {
    color: '#FFFFFF',
    fontSize: 13,
    paddingLeft: 40,
    opacity: 0.9,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  reconciledBox: {
    backgroundColor: PALETTE.greenBg,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  reconciledValue: {
    fontSize: 24,
    fontWeight: '800',
    color: PALETTE.greenText,
    marginBottom: 8,
  },
  reconciledLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reconciledLabelText: {
    color: PALETTE.greenText,
    fontSize: 12,
    fontWeight: '700',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: PALETTE.textSecondary,
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 10,
  },
  physicalEntryCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 20,
    gap: 16,
  },
  rupeeSymbol: {
    fontSize: 20,
    fontWeight: '700',
    color: '#92400E',
  },
  physicalEntryText: {
    fontSize: 28,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  breakdownCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  breakdownLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.textInk,
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  breakdownLabelBold: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  breakdownValueBold: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  divider: {
    height: 1,
    backgroundColor: PALETTE.border,
    marginVertical: 12,
  },
  infoBox: {
    backgroundColor: '#F5E6D3',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 11,
    color: '#704214',
    lineHeight: 16,
  },
  bottomBar: {
    padding: 16,
    paddingBottom: 24,
    backgroundColor: PALETTE.pageBg,
  },
  primaryBtn: {
    backgroundColor: PALETTE.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
