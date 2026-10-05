import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

import { MainWarehouseReturnHistoryScreen } from './MainWarehouseReturnHistoryScreen'; // trigger update

const PALETTE = {
  primary: '#F0562A',
  headerOrange: '#F0562A',
  pageBg: '#F4F0EB',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#6B7280',
  border: '#EBE5DC',
  greenBg: '#E8F5E9',
  greenIcon: '#059669',
  brownText: '#8A5A30',
};

function ArrowBackIcon({ size = 20, color = '#FFFFFF' }) {
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

function SuccessCheckIcon({ size = 32, color = '#059669' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M8 12.5l3 3 5-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function MainWarehouseRefundCompletedScreen({ onBack }: { onBack?: () => void }) {
  const [showHistory, setShowHistory] = useState(false);

  if (showHistory) {
    return <MainWarehouseReturnHistoryScreen onBack={() => setShowHistory(false)} />;
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerOrange} />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <ArrowBackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Refund Completed</Text>
        </View>
        <Text style={styles.headerSubtitle}>RMA-2026-00125</Text>
      </View>

      <View style={styles.mainContainer}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.successHeader}>
            <View style={styles.iconCircle}>
              <SuccessCheckIcon />
            </View>
            <Text style={styles.successTitle}>Refund Completed</Text>
            <Text style={styles.successAmount}>₹375 · Wallet Credited</Text>
          </View>

          <Text style={styles.sectionTitle}>Timeline</Text>
          <View style={styles.card}>
            <View style={styles.timelineRow}>
              <Text style={styles.timelineLabel}>Return Approved</Text>
              <Text style={styles.timelineValue}>25 Sep · 11:20 AM</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.timelineRow}>
              <Text style={styles.timelineLabel}>Refund Initiated</Text>
              <Text style={styles.timelineValue}>25 Sep · 11:22 AM</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.timelineRow}>
              <Text style={styles.timelineLabel}>Wallet Credited</Text>
              <Text style={styles.timelineValue}>25 Sep · 11:22 AM</Text>
            </View>
          </View>

        </ScrollView>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowHistory(true)} activeOpacity={0.8}>
          <Text style={styles.primaryBtnText}>View Return History</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PALETTE.pageBg },
  header: {
    backgroundColor: PALETTE.headerOrange,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  backBtn: { marginRight: 12 },
  headerTitle: { fontFamily: 'Poppins', fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  headerSubtitle: { fontFamily: 'Poppins', fontSize: 11, color: '#FFFFFF', marginLeft: 32, fontWeight: '500' },
  mainContainer: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  successHeader: {
    alignItems: 'center',
    marginTop: 48,
    marginBottom: 32,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: PALETTE.greenBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 8,
  },
  successAmount: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: PALETTE.textSecondary,
    fontWeight: '500',
  },
  sectionTitle: { fontFamily: 'Poppins', fontSize: 13, fontWeight: '800', color: PALETTE.brownText, marginBottom: 8 },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 16,
  },
  timelineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timelineLabel: { fontFamily: 'Poppins', fontSize: 12, fontWeight: '800', color: '#111' },
  timelineValue: { fontFamily: 'Poppins', fontSize: 11, color: PALETTE.textSecondary, fontWeight: '500' },
  divider: { height: 1, borderStyle: 'dashed', borderWidth: 1, borderColor: PALETTE.border, marginVertical: 12 },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
  },
  primaryBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginBottom: 12,
  },
  primaryBtnText: { fontFamily: 'Poppins', color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
