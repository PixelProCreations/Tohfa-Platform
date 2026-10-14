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

// ─── Design Tokens ────────────────────────────────────────────────────────────
const PALETTE = {
  titleRust:     '#8E3314',
  orange:        '#E85226',
  pageBg:        '#FAF8F5',
  cardBg:        '#FFFFFF',
  ink:           '#1A1412',
  labelMuted:    '#6D6761',
  border:        '#EDE8E0',
  chevron:       '#E85226',
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

function RightChevronIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18l6-6-6-6"
        stroke={PALETTE.chevron}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DocIcon() {
  return (
    <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="#FFFFFF" strokeWidth="1.8" />
    </Svg>
  );
}

export interface GSTAccountingScreenProps {
  onBack: () => void;
  onNavigateToReport: () => void;
  onNavigateToLedger: () => void;
}

export function GSTAccountingScreen({
  onBack,
  onNavigateToReport,
  onNavigateToLedger,
}: GSTAccountingScreenProps) {
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
        <Text style={styles.screenTitle}>GST & Accounting</Text>
        <Text style={styles.screenSub}>Filing reports & manual entries</Text>

        {/* Navigation Cards */}
        <View style={styles.cardList}>
          {/* Card 1: GST Filing Report */}
          <TouchableOpacity
            style={styles.navCard}
            onPress={onNavigateToReport}
            activeOpacity={0.75}
          >
            <View style={styles.cardTextCol}>
              <Text style={styles.cardTitle}>GST Filing Report — Q2 2026</Text>
              <Text style={styles.cardSub}>Covers Jul-Sep, all B2B/Horeca invoices</Text>
            </View>
            <RightChevronIcon />
          </TouchableOpacity>

          {/* Card 2: Basic Accounting Ledger */}
          <TouchableOpacity
            style={styles.navCard}
            onPress={onNavigateToLedger}
            activeOpacity={0.75}
          >
            <View style={styles.cardTextCol}>
              <Text style={styles.cardTitle}>Basic Accounting Ledger</Text>
              <Text style={styles.cardSub}>Manual entries — no automated journal posting</Text>
            </View>
            <RightChevronIcon />
          </TouchableOpacity>
        </View>

        {/* Bottom Primary Button */}
        <TouchableOpacity
          style={styles.generateBtn}
          onPress={onNavigateToReport}
          activeOpacity={0.8}
        >
          <DocIcon />
          <Text style={styles.generateBtnText}>Generate GST Filing Report</Text>
        </TouchableOpacity>

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
  cardList: {
    gap: 12,
    marginBottom: 24,
  },
  navCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 18,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: PALETTE.ink,
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 12,
    color: PALETTE.labelMuted,
    lineHeight: 16,
  },
  generateBtn: {
    backgroundColor: PALETTE.orange,
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: PALETTE.orange,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 3,
  },
  generateBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
