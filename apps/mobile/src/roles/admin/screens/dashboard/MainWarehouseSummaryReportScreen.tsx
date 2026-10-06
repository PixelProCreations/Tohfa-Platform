import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

const PALETTE = {
  primary: '#F0562A',
  headerOrange: '#F0562A',
  pageBg: '#F4F0EB',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#6B7280',
  border: '#EBE5DC',
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

export function MainWarehouseSummaryReportScreen({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<'daily' | 'monthly'>('daily');

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerOrange} />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <ArrowBackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Daily / Monthly Summary</Text>
        </View>
      </View>

      <View style={styles.mainContainer}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tabBtn, tab === 'daily' && styles.tabBtnActive]}
              onPress={() => setTab('daily')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabBtnText, tab === 'daily' && styles.tabBtnTextActive]}>Daily</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabBtn, tab === 'monthly' && styles.tabBtnActive]}
              onPress={() => setTab('monthly')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabBtnText, tab === 'monthly' && styles.tabBtnTextActive]}>Monthly</Text>
            </TouchableOpacity>
          </View>

          {/* Date Selector Box */}
          <TouchableOpacity style={styles.dateBox} activeOpacity={0.8}>
            <Text style={styles.dateText}>{tab === 'daily' ? '25 Sep 2026' : 'September 2026'}</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Sales</Text>
          <View style={styles.card}>
            <View style={[styles.row, {marginBottom: 0}]}>
              <View style={styles.col}>
                <Text style={styles.label}>Orders</Text>
                <Text style={styles.value}>{tab === 'daily' ? '84' : '2,140'}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Sales</Text>
                <Text style={styles.value}>{tab === 'daily' ? '₹24,850' : '₹5,84,200'}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Finance</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Revenue</Text>
                <Text style={styles.value}>{tab === 'daily' ? '₹24,850' : '₹5,84,200'}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Expenses</Text>
                <Text style={styles.value}>{tab === 'daily' ? '₹6,420' : '₹1,48,600'}</Text>
              </View>
            </View>
            <View style={[styles.row, {marginBottom: 0}]}>
              <View style={styles.col}>
                <Text style={styles.label}>Net Movement</Text>
                <Text style={styles.value}>{tab === 'daily' ? '₹18,430' : '₹4,35,600'}</Text>
              </View>
            </View>
          </View>
          
          {tab === 'monthly' && (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>Monthly totals and trends only — individual transaction screens are never duplicated here.</Text>
            </View>
          )}
          
        </ScrollView>
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
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: 12 },
  headerTitle: { fontFamily: 'Poppins', fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  mainContainer: { flex: 1, backgroundColor: PALETTE.pageBg },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },
  tabContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    backgroundColor: '#F4F0EB',
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#FFF',
    borderColor: PALETTE.primary,
  },
  tabBtnText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '800',
    color: '#555',
  },
  tabBtnTextActive: {
    color: PALETTE.primary,
  },
  dateBox: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  dateText: {
    fontFamily: 'Poppins',
    fontSize: 16,
    color: PALETTE.textInk,
  },
  sectionTitle: { fontFamily: 'Poppins', fontSize: 13, fontWeight: '800', color: PALETTE.brownText, marginBottom: 8 },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 24,
  },
  row: { flexDirection: 'row', marginBottom: 16 },
  col: { flex: 1 },
  label: { fontFamily: 'Poppins', fontSize: 11, fontWeight: '800', color: '#6B7280', marginBottom: 4 },
  value: { fontFamily: 'Poppins', fontSize: 14, fontWeight: '800', color: PALETTE.textInk },
  infoBox: {
    backgroundColor: '#F4F0EB',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginTop: 8,
  },
  infoText: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: '#333',
    fontWeight: '500',
    lineHeight: 16,
  },
});
