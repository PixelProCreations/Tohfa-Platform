import React, { useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const PALETTE = {
  primary:       '#E85226', // Brand orange
  brandRust:     '#7E2E11', // Deep rust/terracotta for headings
  pageBg:        '#FAF8F5', // Warm light cream
  cardBg:        '#FFFFFF',
  ink:           '#1A1412',
  labelMuted:    '#78716C',
  border:        '#EDE6DD',
  borderLight:   '#F3EFEA',
  
  revenueBg:     '#F0FDF4',
  revenueBorder: '#DCFCE7',
  revenueText:   '#15803D',
  revenuePillBg: '#DCFCE7',
  
  expenseBg:     '#FEF2F2',
  expenseBorder: '#FEE2E2',
  expenseText:   '#DC2626',
  expensePillBg: '#FEE2E2',
  
  profitCardBg:  '#F4EFEB',
  profitBorder:  '#E6DDD3',
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function BackChevronIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 19l-7-7 7-7"
        stroke={PALETTE.brandRust}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ExportDocIcon({ color = '#FFFFFF' }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function CheckCircleIcon() {
  return (
    <Svg width={44} height={44} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
        stroke="#16A34A"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M22 4L12 14.01l-3-3"
        stroke="#16A34A"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface PLStatementScreenProps {
  onBack: () => void;
  onExportPdf?: () => void;
}

export function PLStatementScreen({
  onBack,
  onExportPdf,
}: PLStatementScreenProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  function handleExport() {
    setIsExporting(true);
    // Simulate generation and show confirmed download popup
    setTimeout(() => {
      setIsExporting(false);
      setShowSuccessModal(true);
    }, 600);
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.pageBg} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button First */}
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <BackChevronIcon />
        </TouchableOpacity>

        {/* Heading Next */}
        <Text style={styles.screenTitle}>P&L Statement</Text>
        <Text style={styles.screenSub}>September 2026 · SA/TA verified</Text>

        {/* Primary Statement Card */}
        <View style={styles.statementCard}>
          {/* Revenue Section */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.revenuePill}>
              <Text style={styles.revenuePillText}>REVENUE STREAMS</Text>
            </View>
            <Text style={styles.periodText}>MTD Sep 2026</Text>
          </View>

          <View style={styles.lineRow}>
            <View style={styles.lineLabelCol}>
              <Text style={styles.lineLabel}>Revenue — Online</Text>
              <Text style={styles.lineSubLabel}>Direct consumer & app sales</Text>
            </View>
            <Text style={styles.lineValue}>₹12,88,140</Text>
          </View>

          <View style={styles.lineRow}>
            <View style={styles.lineLabelCol}>
              <Text style={styles.lineLabel}>Revenue — Live Market</Text>
              <Text style={styles.lineSubLabel}>Spot auction & daily mandi</Text>
            </View>
            <Text style={styles.lineValue}>₹1,84,020</Text>
          </View>

          <View style={styles.lineRow}>
            <View style={styles.lineLabelCol}>
              <Text style={styles.lineLabel}>Revenue — Horeca / B2B</Text>
              <Text style={styles.lineSubLabel}>Contract institutional supply</Text>
            </View>
            <Text style={styles.lineValue}>₹3,68,040</Text>
          </View>

          {/* Total Revenue Highlight */}
          <View style={styles.totalRevenueBox}>
            <Text style={styles.totalRevenueLabel}>Total Revenue</Text>
            <Text style={styles.totalRevenueVal}>₹18,40,200</Text>
          </View>

          <View style={styles.sectionDivider} />

          {/* Expenses Section */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.expensePill}>
              <Text style={styles.expensePillText}>EXPENDITURES</Text>
            </View>
            <Text style={styles.periodText}>Actuals Outflow</Text>
          </View>

          <View style={styles.lineRow}>
            <View style={styles.lineLabelCol}>
              <Text style={styles.lineLabel}>Farmer Payouts</Text>
              <Text style={styles.lineSubLabel}>Direct farmgate procurement</Text>
            </View>
            <Text style={styles.expenseVal}>-₹8,20,000</Text>
          </View>

          <View style={styles.lineRow}>
            <View style={styles.lineLabelCol}>
              <Text style={styles.lineLabel}>Warehouse Operations</Text>
              <Text style={styles.lineSubLabel}>Cold storage, grading & packing</Text>
            </View>
            <Text style={styles.expenseVal}>-₹2,10,400</Text>
          </View>

          <View style={styles.lineRow}>
            <View style={styles.lineLabelCol}>
              <Text style={styles.lineLabel}>Staff & Payroll</Text>
              <Text style={styles.lineSubLabel}>Logistics, QA & warehouse crew</Text>
            </View>
            <Text style={styles.expenseVal}>-₹1,02,000</Text>
          </View>

          {/* Total Expenses Highlight */}
          <View style={styles.totalExpensesBox}>
            <Text style={styles.totalExpensesLabel}>Total Expenses</Text>
            <Text style={styles.totalExpensesVal}>-₹11,32,400</Text>
          </View>

          <View style={styles.sectionDivider} />

          {/* Net Profit Highlight Banner */}
          <View style={styles.netProfitContainer}>
            <View>
              <Text style={styles.netProfitSub}>NET PROFIT (EBITDA)</Text>
              <Text style={styles.netProfitVal}>₹15,27,800</Text>
            </View>
            <View style={styles.marginBadge}>
              <Text style={styles.marginBadgeText}>83.0% Margin</Text>
            </View>
          </View>
        </View>

        {/* Export Button: Brand Terracotta / Orange */}
        <TouchableOpacity
          style={styles.exportBtn}
          onPress={handleExport}
          activeOpacity={0.8}
          disabled={isExporting}
        >
          <ExportDocIcon color="#FFFFFF" />
          <Text style={styles.exportBtnText}>
            {isExporting ? 'Generating PDF Document...' : 'Export as PDF'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Confirmation Modal / Popup for Proper Download */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <CheckCircleIcon />
            </View>
            <Text style={styles.modalTitle}>Downloaded Properly</Text>
            <Text style={styles.modalBody}>
              The P&L Statement for September 2026 has been generated and downloaded properly to your device.
            </Text>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => setShowSuccessModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: PALETTE.brandRust,
    letterSpacing: -0.3,
  },
  screenSub: {
    fontSize: 13,
    fontWeight: '400',
    color: PALETTE.labelMuted,
    marginTop: 4,
    marginBottom: 20,
  },
  statementCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 16,
    shadowColor: '#1A1412',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  revenuePill: {
    backgroundColor: PALETTE.revenuePillBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  revenuePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: PALETTE.revenueText,
    letterSpacing: 0.5,
  },
  expensePill: {
    backgroundColor: PALETTE.expensePillBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  expensePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: PALETTE.expenseText,
    letterSpacing: 0.5,
  },
  periodText: {
    fontSize: 11,
    fontWeight: '500',
    color: PALETTE.labelMuted,
  },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.borderLight,
  },
  lineLabelCol: {
    flex: 1,
    marginRight: 10,
  },
  lineLabel: {
    fontSize: 13,
    color: PALETTE.ink,
    fontWeight: '600',
  },
  lineSubLabel: {
    fontSize: 11,
    color: PALETTE.labelMuted,
    marginTop: 2,
  },
  lineValue: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  totalRevenueBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: PALETTE.revenueBg,
    borderWidth: 1,
    borderColor: PALETTE.revenueBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
  },
  totalRevenueLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.revenueText,
  },
  totalRevenueVal: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.revenueText,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: PALETTE.border,
    marginVertical: 16,
  },
  expenseVal: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.expenseText,
  },
  totalExpensesBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: PALETTE.expenseBg,
    borderWidth: 1,
    borderColor: PALETTE.expenseBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
  },
  totalExpensesLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.expenseText,
  },
  totalExpensesVal: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.expenseText,
  },
  netProfitContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: PALETTE.profitCardBg,
    borderWidth: 1,
    borderColor: PALETTE.profitBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  netProfitSub: {
    fontSize: 11,
    fontWeight: '800',
    color: PALETTE.brandRust,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  netProfitVal: {
    fontSize: 20,
    fontWeight: '900',
    color: PALETTE.revenueText,
    letterSpacing: -0.3,
  },
  marginBadge: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: PALETTE.revenueBorder,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  marginBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.revenueText,
  },
  exportBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: PALETTE.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  exportBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Modal / Popup Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: PALETTE.ink,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalBody: {
    fontSize: 13,
    color: PALETTE.labelMuted,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  modalBtn: {
    backgroundColor: PALETTE.primary,
    width: '100%',
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

