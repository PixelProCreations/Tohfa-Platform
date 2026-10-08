import React from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

const PALETTE = {
  primary:       '#F0562A',
  pageBg:        '#FAF7F2',
  cardBg:        '#FFFFFF',
  textInk:       '#1E1612',
  textSecondary: '#6B7280',
  textMuted:     '#9CA3AF',
  border:        '#EBE5DC',
  divider:       '#F4EFE9',

  greenBg:       '#E6F7ED',
  greenIcon:     '#059669',
  brownText:     '#92400E',
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

function SuccessCheckIcon({ size = 34, color = '#059669' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2.2" />
      <Path
        d="M8 12.5l2.5 2.5 5.5-5.5"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ReceiptIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 2v20l3-2 3 2 3-2 3 2 4-2V2l-4 2-3-2-3 2-3-2-3 2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M8 8h8M8 12h8M8 16h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function NotificationBellRingIcon({ size = 26, color = PALETTE.textInk }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10.3 21a1.94 1.94 0 0 0 3.4 0"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 2C2.8 3.7 2 5.7 2 8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M22 8c0-2.3-.8-4.3-2-6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface TopUpSuccessData {
  walletBalance?: string;
  topUpAmount?: string;
  transactionId?: string;
  customerName?: string;
  fiscalCashTag?: string;
  warehouseName?: string;
  dateTime?: string;
}

export interface SubWarehouseTopUpSuccessScreenProps {
  onBack?: () => void;
  onDone?: () => void;
  onViewTransaction?: (data: TopUpSuccessData) => void;
  data?: TopUpSuccessData;
}

export function SubWarehouseTopUpSuccessScreen({
  onBack,
  onDone,
  onViewTransaction,
  data = {},
}: SubWarehouseTopUpSuccessScreenProps) {
  const walletBalance = data.walletBalance || '₹6,500.00';
  const topUpAmount = data.topUpAmount || '₹2,000.00';
  const transactionId = data.transactionId || 'WT-20260925-001245';
  const customerName = data.customerName || 'Ravi Kumar';
  const fiscalCashTag = data.fiscalCashTag || 'FC-20260925-0012';
  const warehouseName = data.warehouseName || 'Coonoor Warehouse';
  const dateTime = data.dateTime || '25 Sep 2026, 10:42 AM';

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack || onDone}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowBackIcon size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Top-Up Successful</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <SuccessCheckIcon size={36} color={PALETTE.greenIcon} />
          </View>

          <Text style={styles.successHeading}>Top-Up Successful</Text>
          <Text style={styles.successSub}>{topUpAmount}</Text>
        </View>

        {/* Details Card */}
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Wallet Balance</Text>
              <Text style={styles.fieldValue}>{walletBalance}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Transaction ID</Text>
              <Text style={styles.fieldValue}>{transactionId}</Text>
            </View>
          </View>

          <View style={[styles.twoColRow, { marginTop: 16 }]}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Customer</Text>
              <Text style={styles.fieldValue}>{customerName}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Fiscal Cash Tag</Text>
              <Text style={styles.fieldValue}>{fiscalCashTag}</Text>
            </View>
          </View>

          <View style={[styles.twoColRow, { marginTop: 16 }]}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Warehouse</Text>
              <Text style={styles.fieldValue}>{warehouseName}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Date & Time</Text>
              <Text style={styles.fieldValue}>{dateTime}</Text>
            </View>
          </View>
        </View>

        {/* Customer Notification Sent */}
        <View style={styles.notificationNoticeWrap}>
          <NotificationBellRingIcon size={26} color={PALETTE.textInk} />
          <Text style={styles.notificationNoticeText}>Customer notification sent</Text>
        </View>
      </ScrollView>

      {/* Sticky Bottom Buttons */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.viewTxBtn}
          onPress={() => {
            if (onViewTransaction) {
              onViewTransaction({
                walletBalance,
                topUpAmount,
                transactionId,
                customerName,
                fiscalCashTag,
                warehouseName,
                dateTime,
              });
            }
          }}
          activeOpacity={0.85}
        >
          <ReceiptIcon size={20} color="#FFFFFF" />
          <Text style={styles.viewTxBtnText}>View Transaction</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.doneBtn}
          onPress={onDone || onBack}
          activeOpacity={0.75}
        >
          <Text style={styles.doneBtnText}>Done</Text>
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
    paddingTop: 36,
    paddingBottom: 130,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: PALETTE.greenBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successHeading: {
    fontFamily: 'Poppins',
    fontSize: 22,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginBottom: 6,
  },
  successSub: {
    fontFamily: 'Poppins',
    fontSize: 14.5,
    fontWeight: '500',
    color: PALETTE.textSecondary,
  },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    padding: 18,
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
    paddingRight: 4,
  },
  fieldLabel: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.textSecondary,
    marginBottom: 4,
  },
  fieldValue: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  notificationNoticeWrap: {
    marginTop: 24,
    alignItems: 'flex-start',
  },
  notificationNoticeText: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '400',
    color: PALETTE.textInk,
    marginTop: 8,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: PALETTE.pageBg,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 26 : 16,
    borderTopWidth: 1,
    borderTopColor: PALETTE.divider,
    gap: 10,
  },
  viewTxBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  viewTxBtnText: {
    fontFamily: 'Poppins',
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  doneBtn: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: PALETTE.primary,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    fontFamily: 'Poppins',
    color: PALETTE.brownText,
    fontSize: 15,
    fontWeight: '700',
  },
});
