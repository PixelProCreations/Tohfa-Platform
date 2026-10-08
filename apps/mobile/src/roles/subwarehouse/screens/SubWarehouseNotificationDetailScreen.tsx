import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

const PALETTE = {
  primary: '#F0562A',
  primaryDark: '#D4451B',
  primaryLight: '#FFF0EB',
  pageBg: '#FAF7F2',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  border: '#EBE5DC',
  buttonBg: '#DF8435', // matching the button color in the screenshot
};

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WarehouseIcon({ size = 16, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 22v-2h16v2H4z" fill={color} />
      <Path d="M6 20V9L12 4l6 5v11H6z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 13v7h6v-7H9z" fill={color} />
    </Svg>
  );
}

function ReviewTrayIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 10l5 5 5-5M12 15V3" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WalletIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="12" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M22 12h-4v2h4" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

export interface SubWarehouseNotificationDetailScreenProps {
  onBack?: (() => void) | undefined;
  onActionPress?: (() => void) | undefined;
  onReviewReceiving?: (() => void) | undefined;
  warehouseName?: string | undefined;
  notificationData?: {
    type?: 'goods' | 'wallet' | 'order' | undefined;
    title?: string | undefined;
    message?: string | undefined;
    reference?: string | undefined;
  } | undefined;
}

export function SubWarehouseNotificationDetailScreen({
  onBack,
  onActionPress,
  onReviewReceiving,
  warehouseName = 'Coonoor Warehouse',
  notificationData,
}: SubWarehouseNotificationDetailScreenProps) {
  const type = notificationData?.type || 'goods';
  const title = notificationData?.title || (type === 'wallet' ? 'Wallet Credited' : 'Goods Received');
  const message = notificationData?.message || (type === 'wallet' ? 'A customer wallet transaction has been completed.\nAmount: ₹500 · 25 Sep 2026 · 09:45 AM' : 'New goods receiving activity is available for Coonoor Warehouse. Received: 420 kg · 25 Sep 2026 · 10:20 AM');
  const reference = notificationData?.reference || (type === 'wallet' ? 'TOP-002845' : 'GR-00245');

  const buttonLabel = type === 'wallet' ? 'View Wallet Report' : 'View Receiving';

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Top Brand Header (#F0562A) ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.75}
          >
            <ArrowBackIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitleText}>Notification Detail</Text>
        </View>
        <View style={styles.warehousePillRow}>
          <View style={styles.warehousePill}>
            <WarehouseIcon size={12} color="#FFFFFF" />
            <Text style={styles.warehousePillText}>{warehouseName}</Text>
          </View>
        </View>
      </View>

      {/* ─── Scrollable Main Content Body ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainContainer}>
          <Text style={styles.sectionHeading}>{title}</Text>
          <View style={styles.card}>
            <Text style={styles.messageText}>{message}</Text>
          </View>

          <Text style={styles.sectionHeading}>Reference</Text>
          <View style={styles.card}>
            <Text style={styles.infoGridLabel}>Reference</Text>
            <Text style={styles.infoGridValue}>{reference}</Text>
          </View>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={onActionPress || onReviewReceiving}
            activeOpacity={0.85}
          >
            {type === 'wallet' ? <WalletIcon size={18} color="#FFFFFF" /> : <ReviewTrayIcon size={18} color="#FFFFFF" />}
            <Text style={styles.actionButtonText}>{buttonLabel}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  headerBanner: {
    backgroundColor: '#DF8435', // the header in the screenshot looks like this color
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    marginRight: 12,
    padding: 2,
  },
  headerTitleText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  warehousePillRow: {
    flexDirection: 'row',
  },
  warehousePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  warehousePillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  mainContainer: {},
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginBottom: 8,
    marginTop: 4,
  },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 20,
  },
  messageText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 22,
  },
  infoGridLabel: {
    fontSize: 12,
    color: '#7A726C',
    fontWeight: '600',
    marginBottom: 4,
  },
  infoGridValue: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  actionButton: {
    backgroundColor: PALETTE.buttonBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 10,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});
