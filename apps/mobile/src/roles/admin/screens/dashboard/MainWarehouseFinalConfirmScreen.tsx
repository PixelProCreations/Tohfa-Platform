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
  greenBorder: '#059669',
  orangeBorder: '#F0562A',
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

export interface FinalConfirmDetails {
  customerName: string;
  topUpAmount: number;
}

export interface MainWarehouseFinalConfirmScreenProps {
  details: FinalConfirmDetails;
  onBack: () => void;
  onConfirm: () => void;
}

export function MainWarehouseFinalConfirmScreen({
  details,
  onBack,
  onConfirm,
}: MainWarehouseFinalConfirmScreenProps) {
  
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
          
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Confirm Cash Top-Up?</Text>
            
            <View style={styles.summaryBox}>
              <Text style={styles.summaryText}>
                ₹{details.topUpAmount} will be credited to {details.customerName}'s wallet.
              </Text>
            </View>

            <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm} activeOpacity={0.8}>
              <Text style={styles.confirmBtnText}>Confirm Top-Up</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.cancelBtn} onPress={onBack} activeOpacity={0.8}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Success is never shown before the server confirms the transaction — the balance is never simulated by editing the display.
            </Text>
          </View>
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
  mainContainer: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  confirmCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: PALETTE.orangeBorder,
    padding: 16,
    marginBottom: 24,
  },
  confirmTitle: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '800',
    color: '#8A5A30',
    marginBottom: 16,
  },
  summaryBox: {
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  summaryText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  confirmBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: PALETTE.greenBorder,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmBtnText: {
    fontFamily: 'Poppins',
    color: PALETTE.greenText,
    fontSize: 15,
    fontWeight: '800',
  },
  cancelBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: PALETTE.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontFamily: 'Poppins',
    color: '#555',
    fontSize: 15,
    fontWeight: '800',
  },
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
});
