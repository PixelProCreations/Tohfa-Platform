import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
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
  greenBg: '#E8F5E9',
  greenText: '#2E7D32',
  redText: '#DC2626',
  infoGreyBg: '#F4EFE9',
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

function ArrowRightIcon({ size = 18, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14M12 5l7 7-7 7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ShieldCheckIcon({ size = 16, color = '#2E7D32' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface FiscalTagData {
  fiscalCashTag: string;
}

export interface MainWarehouseFiscalTagScreenProps {
  initialData: {
    customerName: string;
    customerId: string;
    currentBalance: number;
    topUpAmount: number;
    fiscalCashTag?: string;
  };
  onBack: () => void;
  onReviewTopUp: (data: FiscalTagData) => void;
}

export function MainWarehouseFiscalTagScreen({
  initialData,
  onBack,
  onReviewTopUp,
}: MainWarehouseFiscalTagScreenProps) {
  const [fiscalTag, setFiscalTag] = useState(initialData.fiscalCashTag || '');
  const [error, setError] = useState(false);

  const handleReview = () => {
    if (!fiscalTag.trim()) {
      setError(true);
      return;
    }
    setError(false);
    onReviewTopUp({ fiscalCashTag: fiscalTag });
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerOrange} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <ArrowBackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Fiscal Cash Tag</Text>
        </View>
      </View>

      <View style={styles.mainContainer}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.label}>Customer</Text>
            <Text style={styles.value}>{initialData.customerName}</Text>
            
            <Text style={[styles.label, { marginTop: 12 }]}>Top-Up Amount</Text>
            <Text style={styles.value}>₹{initialData.topUpAmount}</Text>
          </View>

          <Text style={styles.sectionTitle}>Fiscal Cash Tag</Text>
          <TextInput
            style={[styles.input, error && styles.inputError]}
            placeholder="e.g. OOTY-2026-08-18-0042"
            placeholderTextColor={PALETTE.textSecondary}
            value={fiscalTag}
            onChangeText={(text) => {
              setFiscalTag(text);
              if (error) setError(false);
            }}
          />
          {error && <Text style={styles.errorText}>Fiscal cash tag is required.</Text>}

          <View style={[styles.greenInfoBox, error ? {marginTop: 0} : {marginTop: 8}]}>
            <View style={{marginTop: 2}}><ShieldCheckIcon /></View>
            <Text style={styles.greenInfoText}>
              Gated by permission: wallet.cash_topup.fiscal_tag — also enforced server-side.
            </Text>
          </View>

          <View style={styles.greyInfoBox}>
            <Text style={styles.greyInfoText}>
              One physical fiscal cash tag cannot fund two wallet credits — a duplicate tag is rejected as a clear conflict.
            </Text>
          </View>
        </ScrollView>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleReview} activeOpacity={0.8}>
          <Text style={styles.primaryBtnText}>Review Top-Up</Text>
          <ArrowRightIcon />
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
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: 12 },
  headerTitle: { fontFamily: 'Poppins', fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  mainContainer: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  label: { fontFamily: 'Poppins', fontSize: 11, color: '#555', marginBottom: 4, fontWeight: '600' },
  value: { fontFamily: 'Poppins', fontSize: 14, fontWeight: '800', color: PALETTE.textInk },
  sectionTitle: { fontFamily: 'Poppins', fontSize: 12, fontWeight: '700', color: '#777', marginBottom: 8 },
  input: {
    fontFamily: 'Poppins',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: PALETTE.textInk,
    marginBottom: 8,
  },
  inputError: {
    borderColor: PALETTE.redText,
  },
  errorText: {
    fontFamily: 'Poppins',
    color: PALETTE.redText,
    fontSize: 12,
    marginBottom: 16,
    fontWeight: '600',
  },
  greenInfoBox: {
    flexDirection: 'row',
    backgroundColor: PALETTE.greenBg,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'flex-start',
    gap: 8,
  },
  greenInfoText: { fontFamily: 'Poppins', fontSize: 12, color: PALETTE.greenText, fontWeight: '600', flex: 1, lineHeight: 18 },
  greyInfoBox: {
    backgroundColor: PALETTE.infoGreyBg,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  greyInfoText: { fontFamily: 'Poppins', fontSize: 11, color: '#555', fontWeight: '600', lineHeight: 18 },
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
