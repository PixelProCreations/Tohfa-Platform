import React from 'react';
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
  greenText: '#059669',
  brownText: '#8A5A30',
  infoGreyBg: '#FCECDD', // more of an orange-beige in the image
  infoText: '#C2410C',
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

export interface ConfirmTopUpDetails {
  customerName: string;
  customerCode: string;
  currentBalance: number;
  topUpAmount: number;
  fiscalCashTag: string;
  warehouseName?: string;
}

export interface MainWarehouseConfirmCashTopUpScreenProps {
  details: ConfirmTopUpDetails;
  onBack: () => void;
  onSuccess: (confirmed: ConfirmTopUpDetails) => void;
}

export function MainWarehouseConfirmCashTopUpScreen({
  details,
  onBack,
  onSuccess,
}: MainWarehouseConfirmCashTopUpScreenProps) {
  
  const newBalance = details.currentBalance + details.topUpAmount;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerOrange} />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <ArrowBackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Top-Up Confirmation</Text>
        </View>
      </View>

      <View style={styles.mainContainer}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Current Wallet Balance</Text>
                <Text style={styles.value}>₹{details.currentBalance.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Cash Top-Up</Text>
                <Text style={[styles.value, {color: PALETTE.greenText}]}>+ ₹{details.topUpAmount.toLocaleString('en-IN')}</Text>
              </View>
            </View>
            
            <View style={[styles.row, {marginBottom: 0, marginTop: 4}]}>
              <View style={styles.col}>
                <Text style={styles.label}>New Wallet Balance</Text>
                <Text style={[styles.value, {color: PALETTE.brownText}]}>₹{newBalance.toLocaleString('en-IN')}</Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Warehouse</Text>
                <Text style={styles.value}>{details.warehouseName || 'Coonoor'}</Text>
              </View>
            </View>
            <View style={[styles.row, {marginBottom: 0}]}>
              <View style={styles.col}>
                <Text style={styles.label}>Fiscal Cash Tag</Text>
                <Text style={styles.value}>{details.fiscalCashTag || ''}</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Success is never shown before the server confirms the transaction — the balance is never simulated by editing the display.
            </Text>
          </View>
        </ScrollView>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => onSuccess(details)} activeOpacity={0.8}>
          <Text style={styles.primaryBtnText}>Confirm Top-Up</Text>
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
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  col: {
    flex: 1,
  },
  label: { fontFamily: 'Poppins', fontSize: 11, color: '#555', marginBottom: 4, fontWeight: '600' },
  value: { fontFamily: 'Poppins', fontSize: 14, fontWeight: '800', color: PALETTE.textInk },
  infoBox: {
    backgroundColor: PALETTE.infoGreyBg,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  infoText: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: PALETTE.infoText,
    fontWeight: '600',
    lineHeight: 16,
  },
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
  },
  primaryBtnText: { fontFamily: 'Poppins', color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
