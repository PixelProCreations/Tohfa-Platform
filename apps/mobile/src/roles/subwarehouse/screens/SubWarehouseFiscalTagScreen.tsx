import React, { useState } from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

const PALETTE = {
  primary:       '#F0562A',
  pageBg:        '#FAF7F2',
  cardBg:        '#FFFFFF',
  textInk:       '#1E1612',
  textSecondary: '#6B7280',
  textMuted:     '#9CA3AF',
  border:        '#EBE5DC',
  divider:       '#F4EFE9',

  blueInfoBg:    '#EBF3FC',
  blueInfoBorder:'#BFDBFE',
  blueInfoText:  '#1E40AF',

  amberBoxBg:    '#FEF3C7',
  amberBoxBorder:'#FDE68A',
  amberBoxText:  '#92400E',
};

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
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

function ArrowForwardIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12h14M12 5l7 7-7 7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function InfoCircleIcon({ size = 18, color = '#1E40AF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 8h.01M12 11v5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ShieldCheckIcon({ size = 18, color = '#92400E' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface FiscalTagScreenData {
  customerName?: string;
  customerId?: string;
  currentBalance?: number;
  topUpAmount?: number;
  fiscalCashTag?: string;
  warehouseName?: string;
  processedBy?: string;
}

export interface SubWarehouseFiscalTagScreenProps {
  onBack?: () => void;
  onReviewTopUp?: (data: FiscalTagScreenData) => void;
  initialData?: FiscalTagScreenData;
}

export function SubWarehouseFiscalTagScreen({
  onBack,
  onReviewTopUp,
  initialData = {},
}: SubWarehouseFiscalTagScreenProps) {
  const customerName = initialData.customerName || 'Ravi Kumar';
  const customerId = initialData.customerId || 'CUS-001245';
  const currentBalance = initialData.currentBalance ?? 4500;
  const topUpAmount = initialData.topUpAmount ?? 2000;
  const expectedNewBalance = currentBalance + topUpAmount;
  const warehouseName = initialData.warehouseName || 'Coonoor Warehouse';
  const processedBy = initialData.processedBy || 'SWA – Suresh';

  const [tag, setTag] = useState<string>(initialData.fiscalCashTag || 'FC-20260925-0012');

  const handleSimulateDuplicate = () => {
    Alert.alert(
      'Duplicate Fiscal Tag Error (demo)',
      `Tag ${tag} was already recorded for another transaction today.\n\nTag must be unique per warehouse register.`
    );
  };

  const handleContinue = () => {
    if (!tag.trim()) {
      Alert.alert('Required Field', 'Please enter a valid Fiscal Cash Tag.');
      return;
    }

    if (onReviewTopUp) {
      onReviewTopUp({
        customerName,
        customerId,
        currentBalance,
        topUpAmount,
        fiscalCashTag: tag.trim(),
        warehouseName,
        processedBy,
      });
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowBackIcon size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fiscal Cash Tag</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Transaction Summary Section */}
        <Text style={styles.sectionTitle}>Transaction Summary</Text>
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Customer</Text>
              <Text style={styles.fieldValue}>{customerName}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Customer ID</Text>
              <Text style={styles.fieldValue}>{customerId}</Text>
            </View>
          </View>

          <View style={[styles.twoColRow, { marginTop: 14 }]}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Current Balance</Text>
              <Text style={styles.fieldValue}>₹{currentBalance.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Top-Up Amount</Text>
              <Text style={styles.fieldValue}>₹{topUpAmount.toLocaleString('en-IN')}</Text>
            </View>
          </View>

          <View style={[styles.col, { marginTop: 14 }]}>
            <Text style={styles.fieldLabel}>Expected New Balance</Text>
            <Text style={styles.fieldValue}>₹{expectedNewBalance.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {/* Fiscal Cash Tag Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Fiscal Cash Tag</Text>
          <Text style={styles.requiredText}>Required</Text>
        </View>

        <View style={styles.inputCard}>
          <TextInput
            style={styles.tagInput}
            value={tag}
            onChangeText={setTag}
            placeholder="e.g. FC-20260925-0012"
            placeholderTextColor={PALETTE.textMuted}
          />
        </View>

        {/* Duplicate Tag Error Demo Button */}
        <TouchableOpacity
          style={styles.demoBtn}
          onPress={handleSimulateDuplicate}
          activeOpacity={0.75}
        >
          <Text style={styles.demoBtnText}>Simulate duplicate tag error (demo)</Text>
        </TouchableOpacity>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Sticky Bottom Review Top-Up Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.reviewBtn}
          onPress={handleContinue}
          activeOpacity={0.85}
        >
          <ArrowForwardIcon size={18} color="#FFFFFF" />
          <Text style={styles.reviewBtnText}>Review Top-Up</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  header: {
    backgroundColor: PALETTE.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 6,
    paddingBottom: 14,
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: 'Poppins',
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginTop: 8,
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 8,
  },
  requiredText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: PALETTE.textSecondary,
    fontWeight: '500',
  },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
  },
  fieldLabel: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.textSecondary,
    marginBottom: 3,
  },
  fieldValue: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  inputCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    marginBottom: 12,
  },
  tagInput: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.textInk,
    paddingVertical: 0,
  },
  blueInfoCard: {
    backgroundColor: PALETTE.blueInfoBg,
    borderWidth: 1,
    borderColor: PALETTE.blueInfoBorder,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 14,
  },
  infoIconWrap: {
    marginTop: 1,
  },
  blueInfoText: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.blueInfoText,
    lineHeight: 16,
  },
  demoBtn: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: PALETTE.primary,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  demoBtnText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  shieldBox: {
    backgroundColor: '#FFF8F2',
    borderWidth: 1,
    borderColor: '#F5C6A0',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  shieldText: {
    fontFamily: 'Poppins',
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.amberBoxText,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: PALETTE.pageBg,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    borderTopWidth: 1,
    borderTopColor: PALETTE.divider,
  },
  reviewBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  reviewBtnText: {
    fontFamily: 'Poppins',
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
