import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

const PALETTE = {
  primary:       '#F0562A',
  pageBg:        '#FAF7F2',
  cardBg:        '#FFFFFF',
  textDark:      '#1E1612',
  textSecondary: '#7A726C',
  border:        '#EBE5DC',
  greenBg:       '#E7F7F0',
  greenText:     '#009A60',
};

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LockIconSmall({ size = 12, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function MainWarehouseDailyCashScreen({
  warehouseName = 'All Warehouses',
  date = '25 Sep 2026',
  onBack,
}: any) {
  const [actualCash, setActualCash] = useState('22080');
  const [breakdownTab, setBreakdownTab] = useState<'Cash In' | 'Cash Out'>('Cash In');

  const expectedClosing = 22080;
  const parsedActual = Number(actualCash) || 0;
  const difference = parsedActual - expectedClosing;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />
      
      {/* Header */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.75} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <ArrowBackIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Daily Cash Summary</Text>
        </View>

        <TouchableOpacity style={styles.headerPill} activeOpacity={0.8}>
          <LockIconSmall size={11} color="#FFFFFF" />
          <Text style={styles.headerPillText}>{warehouseName}</Text>
        </TouchableOpacity>
        <Text style={styles.headerDate}>{date}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Opening Cash */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Opening Cash</Text>
          <Text style={styles.cardBigValue}>₹15,000</Text>
        </View>

        {/* Breakdown Tabs */}
        <View style={styles.tabsRow}>
          <TouchableOpacity 
            style={[styles.tabBtn, breakdownTab === 'Cash In' && styles.tabBtnActive]} 
            onPress={() => setBreakdownTab('Cash In')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, breakdownTab === 'Cash In' && styles.tabBtnTextActive]}>Cash In</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabBtn, breakdownTab === 'Cash Out' && styles.tabBtnActive]} 
            onPress={() => setBreakdownTab('Cash Out')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, breakdownTab === 'Cash Out' && styles.tabBtnTextActive]}>Cash Out</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContentCard}>
          {breakdownTab === 'Cash In' ? (
            <>
              <View style={styles.txRow}>
                <Text style={styles.txTitle}>Customer Cash Top-Up</Text>
                <Text style={styles.txAmountGreen}>+₹5,000</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.txRow}>
                <Text style={styles.txTitle}>Direct Sale</Text>
                <Text style={styles.txAmountGreen}>+₹2,500</Text>
              </View>
            </>
          ) : (
            <View style={styles.txRow}>
              <Text style={styles.txTitle}>No Cash Out</Text>
              <Text style={styles.txAmountGreen}>₹0</Text>
            </View>
          )}
        </View>

        {/* Expected Closing Cash */}
        <Text style={styles.sectionHeading}>Expected Closing Cash</Text>
        <View style={[styles.card, { marginBottom: 12 }]}>
          <Text style={[styles.cardBigValue, { color: '#8B5E3C' }]}>₹22,080</Text>
        </View>

        {/* Info Callout */}
        <View style={styles.orangeCallout}>
          <Text style={styles.orangeCalloutText}>
            Expected Closing = Opening + Cash In - Cash Out, calculated server-side and never manually overridable.
          </Text>
        </View>

        {/* Cash Reconciliation */}
        <Text style={styles.sectionHeading}>Cash Reconciliation</Text>
        <View style={styles.card}>
          <View style={styles.reconRow}>
            <Text style={styles.reconLabel}>Expected Cash</Text>
            <Text style={styles.reconValueBold}>₹22,080</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.reconRow}>
            <Text style={styles.reconLabel}>Actual Physical Cash</Text>
            <TextInput
              style={styles.actualInput}
              value={actualCash}
              onChangeText={setActualCash}
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.reconRow}>
            <Text style={styles.reconLabel}>Difference</Text>
            <Text style={[styles.reconValueBold, { color: PALETTE.greenText }]}>
              {difference >= 0 ? `₹${difference}` : `-₹${Math.abs(difference)}`}
            </Text>
          </View>
        </View>

        {/* Reconciled Success Box (only if difference is 0) */}
        {difference === 0 && (
          <View style={styles.successBox}>
            <Text style={styles.successAmount}>₹0</Text>
            <Text style={styles.successText}>Cash reconciled.</Text>
          </View>
        )}

      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.submitBtn} activeOpacity={0.8} onPress={() => {}}>
          <Text style={styles.submitBtnText}>Submit Reconciliation</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PALETTE.pageBg },
  headerBanner: { backgroundColor: PALETTE.primary, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  backButton: { marginRight: 12, padding: 2 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.2 },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 8,
    gap: 6,
  },
  headerPillText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  headerDate: { fontSize: 13, color: '#FFFFFF', fontWeight: '600', opacity: 0.9 },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },
  
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 16,
  },
  cardLabel: { fontSize: 13, fontWeight: '600', color: PALETTE.textSecondary, marginBottom: 4 },
  cardBigValue: { fontSize: 18, fontWeight: '800', color: PALETTE.textDark },
  
  tabsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  tabBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  tabBtnActive: { backgroundColor: PALETTE.primary, borderColor: PALETTE.primary },
  tabBtnText: { fontSize: 13, fontWeight: '700', color: PALETTE.textSecondary },
  tabBtnTextActive: { color: '#FFFFFF' },
  
  tabContentCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 20,
  },
  txRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  txTitle: { fontSize: 13, fontWeight: '700', color: PALETTE.textDark },
  txAmountGreen: { fontSize: 13, fontWeight: '700', color: PALETTE.greenText },
  divider: { height: 1, backgroundColor: PALETTE.border, marginVertical: 12 },
  
  sectionHeading: { fontSize: 15, fontWeight: '800', color: '#8B5E3C', marginBottom: 8 },
  
  orangeCallout: {
    backgroundColor: '#FDF3E7',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
  },
  orangeCalloutText: { fontSize: 12.5, fontWeight: '600', color: '#8B5E3C', lineHeight: 18 },
  
  reconRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reconLabel: { fontSize: 13, fontWeight: '600', color: PALETTE.textSecondary },
  reconValueBold: { fontSize: 18, fontWeight: '800', color: PALETTE.textDark },
  
  actualInput: {
    fontSize: 18,
    fontWeight: '800',
    color: PALETTE.textDark,
    padding: 0,
    margin: 0,
    textAlign: 'right',
  },
  
  successBox: {
    backgroundColor: PALETTE.greenBg,
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  successAmount: { fontSize: 24, fontWeight: '800', color: PALETTE.greenText, marginBottom: 4 },
  successText: { fontSize: 14, fontWeight: '700', color: PALETTE.greenText },

  footer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderColor: PALETTE.border,
  },
  submitBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
