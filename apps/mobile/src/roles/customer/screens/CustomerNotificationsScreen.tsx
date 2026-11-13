import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import {
  customerColors,
  customerFonts,
  customerRadius,
  customerSpacing,
} from '../theme';

export interface CustomerNotificationsScreenProps {
  onNavigate?: (screen: string, params?: Record<string, unknown>) => void;
  onBack?: () => void;
}

const BackArrowSvg = ({ color = '#1A2E1A', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 12H5M5 12L12 19M5 12L12 5"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ChevronRightSvg = ({ color = '#9CA3AF', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 18L15 12L9 6"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const PackageSvg = ({ color = '#2E7D32', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M16.5 9.4L7.55 4.24M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M3.29 7L12 12.01L20.71 7M12 22.08V12"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const WalletSvg = ({ color = '#2E7D32', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"
      stroke={color}
      strokeWidth={1.8}
    />
    <Path
      d="M16 3H4a2 2 0 00-2 2v2h18V5a2 2 0 00-2-2z"
      stroke={color}
      strokeWidth={1.8}
    />
    <Circle cx={16} cy={14} r={1.5} fill={color} />
  </Svg>
);

const StarSvg = ({ color = '#F59E0B', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const TruckSvg = ({ color = '#9333EA', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x={1} y={3} width={15} height={13} rx={1} stroke={color} strokeWidth={1.8} />
    <Path d="M16 8h4l3 3v5h-7V8z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx={5.5} cy={18.5} r={2.5} stroke={color} strokeWidth={1.8} />
    <Circle cx={18.5} cy={18.5} r={2.5} stroke={color} strokeWidth={1.8} />
  </Svg>
);

const LeafSvg = ({ color = '#2E7D32', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M11 20A7 7 0 019.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M2 21c0-3 1.85-5.36 5.08-6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const ReturnSvg = ({ color = '#DC2626', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 14L4 9l5-5"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M20 20v-7a4 4 0 00-4-4H4"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const CustomerNotificationsScreen: React.FC<CustomerNotificationsScreenProps> = ({
  onNavigate,
  onBack,
}) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeftGroup}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onBack || (() => onNavigate?.('CustomerAccount'))}
            style={styles.circleIconButton}
            accessibilityLabel="Back"
          >
            <BackArrowSvg color={customerColors.heading} size={18} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── SECTION 1: TODAY ────────────────────────────────────────────────── */}
        <Text style={styles.sectionHeader}>Today</Text>
        <View style={styles.groupContainer}>
          {/* Row 1 */}
          <TouchableOpacity activeOpacity={0.7} style={styles.notificationRow}>
            <View style={[styles.iconBox, { backgroundColor: '#EDF8EE' }]}>
              <PackageSvg size={18} color="#2E7D32" />
            </View>
            <View style={styles.textCol}>
              <Text style={styles.notifTitle}>Order Shipped</Text>
              <Text style={styles.notifDesc} numberOfLines={2}>
                Your order ORD-20261115-39 has been Shippedand its way to you.
              </Text>
            </View>
            <View style={styles.rightCol}>
              <View style={styles.timeRow}>
                <Text style={styles.timeText}>10:24 AM</Text>
                <View style={styles.unreadDot} />
              </View>
              <ChevronRightSvg color="#9CA3AF" size={15} />
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />

          {/* Row 2 */}
          <TouchableOpacity activeOpacity={0.7} style={styles.notificationRow}>
            <View style={[styles.iconBox, { backgroundColor: '#EDF8EE' }]}>
              <WalletSvg size={18} color="#2E7D32" />
            </View>
            <View style={styles.textCol}>
              <Text style={styles.notifTitle}>Wallet Top-up Successful</Text>
              <Text style={styles.notifDesc} numberOfLines={2}>
                ₹1,000 has been added to your TOHFA Market app Wallet
              </Text>
            </View>
            <View style={styles.rightCol}>
              <View style={styles.timeRow}>
                <Text style={styles.timeText}>09:10 AM</Text>
                <View style={styles.unreadDot} />
              </View>
              <ChevronRightSvg color="#9CA3AF" size={15} />
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />

          {/* Row 3 */}
          <TouchableOpacity activeOpacity={0.7} style={styles.notificationRow}>
            <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
              <StarSvg size={18} color="#D97706" />
            </View>
            <View style={styles.textCol}>
              <Text style={styles.notifTitle}>Rate Your Purchase</Text>
              <Text style={styles.notifDesc} numberOfLines={2}>
                ₹1,000 has been added to your TOHFA Market app Wallet
              </Text>
            </View>
            <View style={styles.rightCol}>
              <View style={styles.timeRow}>
                <Text style={styles.timeText}>08:32 AM</Text>
                <View style={styles.unreadDot} />
              </View>
              <ChevronRightSvg color="#9CA3AF" size={15} />
            </View>
          </TouchableOpacity>
        </View>

        {/* ── SECTION 2: YESTERDAY ────────────────────────────────────────────── */}
        <Text style={[styles.sectionHeader, { marginTop: 22 }]}>Yesterday</Text>
        <View style={styles.groupContainer}>
          {/* Row 4 */}
          <TouchableOpacity activeOpacity={0.7} style={styles.notificationRow}>
            <View style={[styles.iconBox, { backgroundColor: '#F3E8FF' }]}>
              <TruckSvg size={18} color="#9333EA" />
            </View>
            <View style={styles.textCol}>
              <Text style={styles.notifTitle}>Order Out for Delivery</Text>
              <Text style={styles.notifDesc} numberOfLines={2}>
                Your Order ORD-20261115-0076 is out for delivery.
              </Text>
            </View>
            <View style={styles.rightCol}>
              <Text style={styles.timeText}>10:24 AM</Text>
              <ChevronRightSvg color="#9CA3AF" size={15} />
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />

          {/* Row 5 */}
          <TouchableOpacity activeOpacity={0.7} style={styles.notificationRow}>
            <View style={[styles.iconBox, { backgroundColor: '#EDF8EE' }]}>
              <LeafSvg size={18} color="#2E7D32" />
            </View>
            <View style={styles.textCol}>
              <Text style={styles.notifTitle}>New Organic Arrivals</Text>
              <Text style={styles.notifDesc} numberOfLines={2}>
                Fresh organic fruits from Nilgiris are now available! Check them out.
              </Text>
            </View>
            <View style={styles.rightCol}>
              <Text style={styles.timeText}>09:10 AM</Text>
              <ChevronRightSvg color="#9CA3AF" size={15} />
            </View>
          </TouchableOpacity>
        </View>

        {/* ── SECTION 3: EARLIER ──────────────────────────────────────────────── */}
        <Text style={[styles.sectionHeader, { marginTop: 22 }]}>Earlier</Text>
        <View style={styles.groupContainer}>
          {/* Row 6 */}
          <TouchableOpacity activeOpacity={0.7} style={styles.notificationRow}>
            <View style={[styles.iconBox, { backgroundColor: '#FEE2E2' }]}>
              <ReturnSvg size={18} color="#DC2626" />
            </View>
            <View style={styles.textCol}>
              <Text style={styles.notifTitle}>Return Request Updated</Text>
              <Text style={styles.notifDesc} numberOfLines={2}>
                Your return request for ORD-20261029-0068 has been approved.
              </Text>
            </View>
            <View style={styles.rightCol}>
              <Text style={styles.timeText}>31 Oct 2026</Text>
              <ChevronRightSvg color="#9CA3AF" size={15} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: customerSpacing.base,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 12 : 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  circleIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1A2E1A',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 22,
    color: '#1A2E1A',
    fontFamily: customerFonts.editorial,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: customerSpacing.base,
    paddingTop: 8,
  },
  sectionHeader: {
    fontSize: 16,
    color: customerColors.heading,
    fontFamily: customerFonts.editorial,
    marginBottom: 10,
  },
  groupContainer: {
    gap: 4,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textCol: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: customerColors.body,
    fontFamily: customerFonts.semibold,
  },
  notifDesc: {
    fontSize: 10,
    color: customerColors.muted,
    fontFamily: customerFonts.regular,
    marginTop: 2,
    lineHeight: 14,
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 10,
    color: customerColors.muted,
    fontFamily: customerFonts.regular,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#F0F0F0',
    marginLeft: 50,
  },
});

