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
import Svg, { Path, Rect } from 'react-native-svg';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const PALETTE = {
  titleRust:     '#8E3314', // Exact deep rust/terracotta for headings
  orange:        '#E85226', // Vibrant orange
  heroBg:        '#CE4A1E', // Rich rust-orange for Net Revenue card
  pageBg:        '#FAF8F5', // Warm light cream
  cardBg:        '#FFFFFF',
  ink:           '#1A1412',
  labelMuted:    '#6D6761',
  border:        '#EDE8E0',
  blueBox:       '#EBF5FF',
  blueIcon:      '#2563EB',
  amberBox:      '#FEF5E7',
  amberIcon:     '#B45309',
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function BackChevronIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 19l-7-7 7-7"
        stroke="#1A1412"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CreditCardIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="2" stroke={PALETTE.blueIcon} strokeWidth="2" />
      <Path d="M2 10h20" stroke={PALETTE.blueIcon} strokeWidth="2" />
    </Svg>
  );
}

function NoteIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={PALETTE.amberIcon}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
        stroke={PALETTE.amberIcon}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BarChartIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 20V10M12 20V4M6 20v-6"
        stroke="#1A1412"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function WalletIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"
        stroke="#1A1412"
        strokeWidth="2"
      />
      <Path
        d="M16 3H4a2 2 0 0 0-2 2v2M18 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"
        stroke="#1A1412"
        strokeWidth="2"
      />
    </Svg>
  );
}

function DocumentIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke="#1A1412"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 2v6h6" stroke="#1A1412" strokeWidth="2" />
    </Svg>
  );
}

function LedgerIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="3" width="16" height="18" rx="2" stroke="#1A1412" strokeWidth="2" />
      <Path d="M8 7h8M8 11h8M8 15h5" stroke="#1A1412" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Component Props ──────────────────────────────────────────────────────────
export interface FinancialDashboardScreenProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

export function FinancialDashboardScreen({
  onBack,
  onNavigate,
}: FinancialDashboardScreenProps) {
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
        <Text style={styles.screenTitle}>Financial Dashboard</Text>
        <Text style={styles.screenSub}>Platform-wide finance overview · September 2026</Text>

        {/* Hero Card: Net Revenue (MTD) */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Net Revenue (MTD)</Text>
          <Text style={styles.heroAmount}>₹18,40,200</Text>

          <View style={styles.heroDivider} />

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatCol}>
              <Text style={styles.heroStatLabel}>Expenses</Text>
              <Text style={styles.heroStatValue}>₹3,12,400</Text>
            </View>

            <View style={styles.heroStatCol}>
              <Text style={styles.heroStatLabel}>Net Profit</Text>
              <Text style={styles.heroStatValue}>₹15,27,800</Text>
            </View>

            <View style={styles.heroStatCol}>
              <Text style={styles.heroStatLabel}>Margin</Text>
              <Text style={styles.heroStatValue}>83%</Text>
            </View>
          </View>
        </View>

        {/* 2 Summary Mini-Cards (Static Information Cards) */}
        <View style={styles.miniCardsRow}>
          {/* Card 1: Farmer Dues Pending */}
          <View style={styles.miniCard}>
            <View style={[styles.miniIconBox, { backgroundColor: PALETTE.blueBox }]}>
              <CreditCardIcon />
            </View>
            <Text style={styles.miniVal}>₹4.2L</Text>
            <Text style={styles.miniLabel}>Farmer Dues Pending</Text>
          </View>

          {/* Card 2: Expenses Awaiting Approval */}
          <View style={styles.miniCard}>
            <View style={[styles.miniIconBox, { backgroundColor: PALETTE.amberBox }]}>
              <NoteIcon />
            </View>
            <Text style={styles.miniVal}>18</Text>
            <Text style={styles.miniLabel}>Expenses Awaiting Approval</Text>
          </View>
        </View>

        {/* 4 Navigation Cards */}
        <View style={styles.navActionsCol}>
          <TouchableOpacity
            style={styles.navCard}
            onPress={() => onNavigate('PLStatement')}
            activeOpacity={0.75}
          >
            <BarChartIcon />
            <Text style={styles.navCardText}>View P&L Statement</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navCard}
            onPress={() => onNavigate('FarmerPayoutDues')}
            activeOpacity={0.75}
          >
            <WalletIcon />
            <Text style={styles.navCardText}>Farmer Payout Dues</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navCard}
            onPress={() => onNavigate('Expenses')}
            activeOpacity={0.75}
          >
            <DocumentIcon />
            <Text style={styles.navCardText}>Expenses</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navCard}
            onPress={() => onNavigate('GSTAccounting')}
            activeOpacity={0.75}
          >
            <LedgerIcon />
            <Text style={styles.navCardText}>GST & Accounting</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    color: PALETTE.titleRust,
    letterSpacing: -0.3,
  },
  screenSub: {
    fontSize: 13,
    fontWeight: '400',
    color: PALETTE.labelMuted,
    marginTop: 4,
    marginBottom: 20,
  },
  heroCard: {
    backgroundColor: PALETTE.heroBg,
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#8E3314',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 6,
  },
  heroAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    marginBottom: 14,
  },
  heroStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroStatCol: {
    flex: 1,
  },
  heroStatLabel: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.85,
    marginBottom: 3,
  },
  heroStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  miniCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  miniCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  miniIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  miniVal: {
    fontSize: 18,
    fontWeight: '800',
    color: PALETTE.ink,
    marginBottom: 4,
  },
  miniLabel: {
    fontSize: 12,
    color: PALETTE.labelMuted,
    lineHeight: 16,
  },
  navActionsCol: {
    gap: 10,
  },
  navCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  navCardText: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.ink,
  },
});
