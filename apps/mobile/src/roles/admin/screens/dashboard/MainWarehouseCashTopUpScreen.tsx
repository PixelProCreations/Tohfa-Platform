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
import Svg, { Path, Circle } from 'react-native-svg';
import { formatCashTopUpCap } from '../../config/businessThresholds';

const PALETTE = {
  primary: '#F0562A',
  pageBg: '#FAF7F2',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#7A726C',
  border: '#EBE5DC',
  greenText: '#10B981',
  buttonBg: '#F0562A',
  infoBg: 'rgba(240, 86, 42, 0.1)',
};

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }) {
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

function ArrowRightIcon({ size = 18, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14M12 5l7 7-7 7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InfoIcon({ size = 16, color = '#F0562A' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 16v-4M12 8h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export interface CashTopUpData {
  customerName: string;
  customerCode: string;
  currentBalance: number;
  topUpAmount: number;
}

export interface MainWarehouseCashTopUpScreenProps {
  initialCustomer: { name: string; code: string; currentBalance: number };
  onBack: () => void;
  onContinue: (data: CashTopUpData) => void;
}

export function MainWarehouseCashTopUpScreen({
  initialCustomer,
  onBack,
  onContinue,
}: MainWarehouseCashTopUpScreenProps) {
  const [amount, setAmount] = useState('2000');
  
  const handleReview = () => {
    onContinue({
      customerName: initialCustomer.name,
      customerCode: initialCustomer.code,
      currentBalance: initialCustomer.currentBalance,
      topUpAmount: parseInt(amount || '0', 10),
    });
  };

  const parsedAmount = parseInt(amount || '0', 10);
  const newBalance = initialCustomer.currentBalance + parsedAmount;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#F0562A" />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <ArrowBackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cash Top-Up</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>Customer</Text>
          <Text style={styles.value}>{initialCustomer.name}</Text>
          
          <Text style={[styles.label, { marginTop: 12 }]}>Current Wallet Balance</Text>
          <Text style={styles.value}>₹{initialCustomer.currentBalance.toLocaleString('en-IN')}</Text>
        </View>

        <View style={styles.inputCard}>
          <Text style={styles.rupeeSymbol}>₹</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={PALETTE.textSecondary}
          />
        </View>

        <View style={styles.quickAmounts}>
          {['500', '1000', '2000', '5000'].map((amt) => (
            <TouchableOpacity 
              key={amt} 
              style={[styles.quickBtn, amount === amt && styles.quickBtnActive]}
              onPress={() => setAmount(amt)}
            >
              <Text style={[styles.quickBtnText, amount === amt && styles.quickBtnTextActive]}>
                ₹{Number(amt).toLocaleString('en-IN')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoBox}>
          <InfoIcon />
          <Text style={styles.infoText}>Maximum cash top-up: {formatCashTopUpCap()} per transaction</Text>
        </View>

        <Text style={styles.sectionTitle}>Balance Preview</Text>
        <View style={styles.previewCard}>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Current Balance</Text>
            <Text style={styles.previewValue}>₹{initialCustomer.currentBalance.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.previewDivider} />
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Cash Top-Up</Text>
            <Text style={[styles.previewValue, { color: PALETTE.greenText }]}>+ ₹{parsedAmount.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.previewDivider} />
          <View style={styles.previewRow}>
            <Text style={[styles.previewLabel, { fontWeight: '700', color: '#F0562A' }]}>New Balance</Text>
            <Text style={[styles.previewValue, { fontWeight: '700', color: '#F0562A' }]}>₹{newBalance.toLocaleString('en-IN')}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleReview}>
          <Text style={styles.primaryBtnText}>Review Top-Up</Text>
          <ArrowRightIcon />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0562A' },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  
  content: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  label: { fontSize: 12, color: PALETTE.textSecondary, marginBottom: 4, fontWeight: '600' },
  value: { fontSize: 16, fontWeight: '700', color: PALETTE.textInk },
  
  inputCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 16,
  },
  rupeeSymbol: { fontSize: 24, fontWeight: '700', color: '#F0562A', marginRight: 12 },
  input: { fontSize: 36, fontWeight: '800', color: PALETTE.textInk, padding: 0, minWidth: 100 },
  
  quickAmounts: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  quickBtn: {
    backgroundColor: PALETTE.infoBg,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  quickBtnActive: { backgroundColor: '#F0562A' },
  quickBtnText: { fontSize: 13, fontWeight: '700', color: '#F0562A' },
  quickBtnTextActive: { color: '#FFF' },
  
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.infoBg,
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    gap: 8,
  },
  infoText: { fontSize: 12, color: '#F0562A', fontWeight: '600' },
  
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#F0562A', marginBottom: 8 },
  previewCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
  },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  previewLabel: { fontSize: 14, color: PALETTE.textInk, fontWeight: '600' },
  previewValue: { fontSize: 14, color: PALETTE.textInk, fontWeight: '700' },
  previewDivider: { height: 1, backgroundColor: PALETTE.border },
  
  footer: { backgroundColor: PALETTE.pageBg, padding: 16, paddingBottom: 24 },
  primaryBtn: {
    backgroundColor: '#F0562A',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
