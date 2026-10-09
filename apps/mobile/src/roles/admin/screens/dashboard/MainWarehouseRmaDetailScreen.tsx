import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { MainWarehouseInspectProductScreen } from './MainWarehouseInspectProductScreen';
import { MainWarehouseReviewReturnRequestScreen } from './MainWarehouseReviewReturnRequestScreen';
import type { PermissionCheck, WarehouseScope } from '../warehouse/finance-expenses';

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

function ClipboardIcon({ size = 18, color = '#FFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="8" y="2" width="8" height="4" rx="1" stroke={color} strokeWidth="2" />
      <Path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M9 14l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface MainWarehouseRmaDetailScreenProps {
  scope: WarehouseScope;
  can: PermissionCheck;
  onBack: () => void;
}

export function MainWarehouseRmaDetailScreen({ scope, can, onBack }: MainWarehouseRmaDetailScreenProps) {
  const [inspecting, setInspecting] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  if (reviewing) {
    return <MainWarehouseReviewReturnRequestScreen scope={scope} can={can} onBack={() => setReviewing(false)} />;
  }

  if (inspecting) {
    return <MainWarehouseInspectProductScreen scope={scope} can={can} onBack={() => setInspecting(false)} onSaved={() => { setInspecting(false); setReviewing(true); }} />;
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerOrange} />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <ArrowBackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>RMA Detail</Text>
        </View>
        <Text style={styles.headerSubtitle}>RMA-2026-00125 · Under Review</Text>
      </View>

      <View style={styles.mainContainer}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Customer</Text>
            <Text style={styles.value}>Ravi Kumar</Text>
            <Text style={[styles.label, {marginTop: 12}]}>Mobile</Text>
            <Text style={styles.value}>+91 XXXXX XXXXX</Text>
          </View>
          <TouchableOpacity style={styles.outlineBtn} activeOpacity={0.8}>
            <Text style={styles.outlineBtnText}>View Customer</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Returned Product</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Product</Text>
                <Text style={styles.value}>Organic Tomato</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Ordered Qty</Text>
                <Text style={styles.value}>2 KG</Text>
              </View>
            </View>
            <View style={[styles.row, {marginBottom: 0}]}>
              <View style={styles.col}>
                <Text style={styles.label}>Returned Qty</Text>
                <Text style={styles.value}>1.8 KG</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Return Amount</Text>
                <Text style={styles.value}>₹450</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Return Reason</Text>
          <View style={styles.card}>
            <Text style={styles.value}>Damaged Product</Text>
            <View style={styles.divider} />
            <Text style={styles.label}>Customer Comment</Text>
            <Text style={[styles.value, {fontWeight: '500'}]}>Product arrived damaged.</Text>
          </View>

          <Text style={styles.sectionTitle}>Refund Information</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Refund Amount</Text>
            <Text style={styles.value}>₹450</Text>
            <Text style={[styles.label, {marginTop: 12}]}>Refund Method</Text>
            <Text style={styles.value}>Wallet</Text>
          </View>

        </ScrollView>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => setInspecting(true)} activeOpacity={0.8}>
          <ClipboardIcon />
          <Text style={styles.primaryBtnText}>Inspect Product</Text>
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
  mainContainer: { flex: 1, backgroundColor: PALETTE.pageBg },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },
  sectionTitle: { fontFamily: 'Poppins', fontSize: 13, fontWeight: '800', color: PALETTE.brownText, marginBottom: 8, marginTop: 8 },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 16,
  },
  label: { fontFamily: 'Poppins', fontSize: 11, color: '#555', marginBottom: 4, fontWeight: '600' },
  value: { fontFamily: 'Poppins', fontSize: 14, fontWeight: '800', color: PALETTE.textInk },
  row: { flexDirection: 'row', marginBottom: 16 },
  col: { flex: 1 },
  divider: { height: 1, backgroundColor: PALETTE.border, marginVertical: 12 },
  outlineBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: PALETTE.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  outlineBtnText: { fontFamily: 'Poppins', color: PALETTE.brownText, fontSize: 13, fontWeight: '800' },
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  primaryBtnText: { fontFamily: 'Poppins', color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
