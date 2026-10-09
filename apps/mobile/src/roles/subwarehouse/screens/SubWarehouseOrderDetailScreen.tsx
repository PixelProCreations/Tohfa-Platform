import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

const PALETTE = {
  primary:       '#F0562A', // Orange (Brand Palette)
  orangeDeep:    '#7A2E14', // Orange Deep
  orangeTint:    '#FDF3F0', // Orange Tint
  pageBg:        '#F3EFE9', // Background: App canvas
  cardBg:        '#FFFFFF', // Card surfaces
  textInk:       '#1A1A1A', // Ink: Primary text
  textSecondary: '#5F5E5A', // Muted: Secondary text
  textMuted:     '#5F5E5A',
  border:        '#EEDCD3', // Border: Card and input borders
  divider:       '#EEDCD3',
  pickupBadgeBg: '#EAF3DE', // Success BG
  pickupBadgeText:'#173404', // Success
  buttonPrimary: '#F0562A',
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

function PackageIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface SubWarehouseOrderDetailScreenProps {
  onBack?: (() => void) | undefined;
  onViewStatus?: (() => void) | undefined;
  order?: {
    id?: string | undefined;
    orderNo?: string | undefined;
    customer?: string | undefined;
    items?: string | undefined;
    price?: string | undefined;
    totalAmount?: string | undefined;
    status?: string | undefined;
    pickupType?: string | undefined;
    type?: string | undefined;
    date?: string | undefined;
  } | undefined;
}

export function SubWarehouseOrderDetailScreen({
  onBack,
  onViewStatus,
  order,
}: SubWarehouseOrderDetailScreenProps): React.JSX.Element {
  const orderId = order?.orderNo || 'ORD-00251';
  const orderStatus = order?.status || 'Ready for Pickup';
  const orderDate = order?.date || '24 Sep 2026';
  const orderItems = order?.items || '3 Items';
  const orderAmount = order?.price || order?.totalAmount || '₹850';
  const customerName = order?.customer || 'Rajesh Kumar';
  const pickupType = order?.type || order?.pickupType || 'Pickup';

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Header Banner ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Back"
          >
            <ArrowBackIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Order Details</Text>
        </View>
      </View>

      {/* ─── Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Order Card */}
        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            <Text style={styles.orderId}>{orderId}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>{orderStatus}</Text>
            </View>
          </View>
          <Text style={styles.orderSubtitle}>{orderDate} · {orderItems}</Text>
        </View>

        {/* Order Information Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Order Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Customer</Text>
            <Text style={styles.infoValue}>{customerName}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Items</Text>
            <Text style={styles.infoValue}>{orderItems}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total Amount</Text>
            <Text style={[styles.infoValue, { color: PALETTE.textInk, fontWeight: '700' }]}>{orderAmount}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>{orderStatus}</Text>
            </View>
          </View>

          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoLabel}>Pickup Type</Text>
            <Text style={styles.infoValue}>{pickupType}</Text>
          </View>
        </View>
      </ScrollView>

      {/* ─── Bottom Button ─── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onViewStatus ? onViewStatus : () => Alert.alert('Pickup Status', 'Order is staged at Bay 2 for customer pickup.')}
          activeOpacity={0.8}
        >
          <View style={styles.btnRow}>
            <PackageIcon size={18} />
            <Text style={styles.actionBtnText}>View Pickup Status</Text>
          </View>
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
  headerBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    paddingRight: 14,
    paddingVertical: 4,
  },
  headerTitle: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderId: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  statusBadge: {
    backgroundColor: PALETTE.pickupBadgeBg,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusBadgeText: {
    fontFamily: 'Poppins',
    fontSize: 10.5,
    fontWeight: '700',
    color: PALETTE.pickupBadgeText,
  },
  orderSubtitle: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.textSecondary,
  },
  sectionTitle: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.divider,
  },
  infoLabel: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: PALETTE.textSecondary,
  },
  infoValue: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.textInk,
  },
  bottomBar: {
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionBtn: {
    backgroundColor: PALETTE.buttonPrimary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtnText: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
