import React, { useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
  ADMIN_BUTTON_HEIGHT,
} from '../../theme';
import {
  ADMIN_PALETTE,
  AdminBackChevronIcon,
} from './CreateAdminAccountScreen';

export interface AdminActivityEntry {
  id: string;
  adminName: string;
  adminRole: string;
  actionTitle: string;
  timestamp: string;
  ipAddress: string;
  device: string;
  category: 'AUTH' | 'KYC' | 'CONFIG' | 'PAYOUT' | 'WAREHOUSE';
  details: string;
}

const MOCK_ACTIVITY: AdminActivityEntry[] = [
  {
    id: 'log-1',
    adminName: 'Rajesh Kumar',
    adminRole: 'SA',
    actionTitle: 'Dual-Approval Signed: ₹45,200',
    timestamp: 'Today, 10:42 AM',
    ipAddress: '103.14.120.4',
    device: 'iPhone 15 Pro (Admin App)',
    category: 'PAYOUT',
    details: 'Signed off Tier-2 batch payout for 3 organic carrot farmers in Kotagiri zone.',
  },
  {
    id: 'log-2',
    adminName: 'Anitha Raghavan',
    adminRole: 'TA',
    actionTitle: 'Farmer KYC Verified & Approved',
    timestamp: 'Today, 09:15 AM',
    ipAddress: '103.14.120.18',
    device: 'Pixel 8 (Admin App)',
    category: 'KYC',
    details: 'Verified PGS-India Organic scope certificate for Ramanathan K (Farm #2041).',
  },
  {
    id: 'log-3',
    adminName: 'Rajesh Kumar',
    adminRole: 'SA',
    actionTitle: 'Channel Quota Updated',
    timestamp: 'Yesterday, 06:20 PM',
    ipAddress: '103.14.120.4',
    device: 'Web Console',
    category: 'CONFIG',
    details: 'Updated reserve buffer from 8% to 10% for weekend tourist demand surge in Ooty.',
  },
  {
    id: 'log-4',
    adminName: 'Prakash Velu',
    adminRole: 'SW',
    actionTitle: 'QR Batch Dispatch Recorded',
    timestamp: 'Yesterday, 03:30 PM',
    ipAddress: '103.14.120.91',
    device: 'Zebra TC26 Handheld',
    category: 'WAREHOUSE',
    details: 'Scanned 14 crates of Nilgiri Tea (Grade A, 280kg total) for Main Hub transport.',
  },
  {
    id: 'log-5',
    adminName: 'Suresh Mani',
    adminRole: 'TA',
    actionTitle: 'Admin Account Request Submitted',
    timestamp: 'Yesterday, 04:15 PM',
    ipAddress: '103.14.120.22',
    device: 'Galaxy S23 (Admin App)',
    category: 'AUTH',
    details: 'Requested Sub Warehouse Admin account creation for Ravi Chandran (Coonoor Hub).',
  },
];

function CheckCircleSvg({ size = 22, color = adminColors.success.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M8 12.5l2.8 2.8L16 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CrossCircleSvg({ size = 22, color = adminColors.danger.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M15 9l-6 6M9 9l6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ExchangeSvg({ size = 22, color = adminColors.info.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 8h14M14 4l4 4-4 4M20 16H6M10 12l-4 4 4 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const FA_ACTIVITY_TODAY = [
  {
    id: 'fa-1',
    type: 'APPROVED',
    title: 'Listing approved',
    detail: 'Tomato — Grade 1 · 10 min ago',
    farmer: 'Farmer: Ramesh · FR-00241',
    time: '10:24 AM',
  },
  {
    id: 'fa-2',
    type: 'REJECTED',
    title: 'Listing rejected',
    detail: 'Carrot — Grade 2 · 45 min ago',
    farmer: 'Farmer: Kumar · FR-00388',
    time: '09:50 AM',
  },
  {
    id: 'fa-3',
    type: 'COUNTER',
    title: 'Counter-offer sent',
    detail: 'Beans — 75 KG (Offered ₹45/KG)',
    farmer: 'Farmer: Kumar · FR-00388',
    time: '09:09 AM',
  },
  {
    id: 'fa-4',
    type: 'APPROVED',
    title: 'Farm audit completed',
    detail: 'Annual PGS scope audit verified',
    farmer: 'Farmer: Selvi · Coonoor Zone',
    time: '08:30 AM',
  },
];

const FA_ACTIVITY_WEEK = [
  {
    id: 'fa-w1',
    type: 'APPROVED',
    title: 'Listing approved',
    detail: 'Carrot — Grade 1 · 120 KG',
    farmer: 'Farmer: Mani · FR-00305',
    time: 'Yesterday, 04:15 PM',
  },
  {
    id: 'fa-w2',
    type: 'COUNTER',
    title: 'Counter-offer accepted',
    detail: 'Tomato — 65 KG (Settled ₹50/KG)',
    farmer: 'Farmer: Suresh · FR-00189',
    time: '28 Sep, 02:40 PM',
  },
  {
    id: 'fa-w3',
    type: 'REJECTED',
    title: 'Listing rejected',
    detail: 'Beans — Grade 2 · Quality incomplete',
    farmer: 'Farmer: Ramesh · FR-00241',
    time: '27 Sep, 11:20 AM',
  },
];

export interface AdminActivityLogsScreenProps {
  adminId?: string | undefined;
  onBack?: (() => void) | undefined;
  role?: string | undefined;
  onNavigateToListings?: (() => void) | undefined;
}

export function AdminActivityLogsScreen({ adminId, onBack, role, onNavigateToListings }: AdminActivityLogsScreenProps) {
  const [selectedCat, setSelectedCat] = useState<string>('ALL');
  const [faPeriod, setFaPeriod] = useState<'today' | 'week'>('today');

  // If role is FARMER_ADMIN, render S05 FA Activity matching Screenshot
  if (role === 'FARMER_ADMIN') {
    const activityItems = faPeriod === 'today' ? FA_ACTIVITY_TODAY : FA_ACTIVITY_WEEK;

    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Orange Brand Header */}
        <View style={styles.faHeader}>
          <TouchableOpacity
            style={styles.faBackBtn}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path
                d="M19 12H5M12 19l-7-7 7-7"
                stroke={adminColors.onBrand}
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.faHeaderTitle}>Farmer Admin Activity</Text>
        </View>

        {/* Period Filter Pills: Today / This Week */}
        <View style={styles.faPillRow}>
          <TouchableOpacity
            style={[styles.faPill, faPeriod === 'today' && styles.faPillActive]}
            onPress={() => setFaPeriod('today')}
            activeOpacity={0.75}
          >
            <Text style={[styles.faPillText, faPeriod === 'today' && styles.faPillTextActive]}>
              Today
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.faPill, faPeriod === 'week' && styles.faPillActive]}
            onPress={() => setFaPeriod('week')}
            activeOpacity={0.75}
          >
            <Text style={[styles.faPillText, faPeriod === 'week' && styles.faPillTextActive]}>
              This Week
            </Text>
          </TouchableOpacity>
        </View>

        {/* Activity Items List */}
        <FlatList
          data={activityItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.faListContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            return (
              <TouchableOpacity
                style={styles.faCard}
                onPress={() => onNavigateToListings?.()}
                activeOpacity={0.8}
              >
                <View style={styles.faIconCircle}>
                  {item.type === 'APPROVED' && <CheckCircleSvg size={24} color={adminColors.success.text} />}
                  {item.type === 'REJECTED' && <CrossCircleSvg size={24} color={adminColors.danger.text} />}
                  {item.type === 'COUNTER' && <ExchangeSvg size={24} color={adminColors.info.text} />}
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.faCardTitleRow}>
                    <Text style={styles.faCardTitle}>{item.title}</Text>
                    <Text style={styles.faCardTime}>{item.time}</Text>
                  </View>
                  <Text style={styles.faCardDetail}>{item.detail}</Text>
                  <Text style={styles.faCardFarmer}>{item.farmer}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={<View style={{ height: 40 }} />}
        />
      </SafeAreaView>
    );
  }

  const categories = ['ALL', 'PAYOUT', 'KYC', 'CONFIG', 'WAREHOUSE', 'AUTH'];

  const filteredLogs = MOCK_ACTIVITY.filter(
    (l) => selectedCat === 'ALL' || l.category === selectedCat
  );

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'PAYOUT':
        return { bg: adminColors.warning.bg, text: adminColors.warning.text };
      case 'KYC':
        return { bg: adminColors.success.bg, text: adminColors.success.text };
      case 'CONFIG':
        return { bg: adminColors.brandTint, text: adminColors.brand };
      case 'WAREHOUSE':
        return { bg: adminColors.info.bg, text: adminColors.info.text };
      case 'AUTH':
        return { bg: adminColors.brandTint, text: adminColors.brandDeep };
      default:
        return { bg: adminColors.canvas, text: adminColors.muted };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={ADMIN_PALETTE.pageBg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <AdminBackChevronIcon />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <View style={styles.titleBlock}>
        <Text style={styles.screenTitle}>Admin Activity Audit</Text>
        <Text style={styles.screenSubtitle}>
          Immutable administrative activity log with IP & device authentication trail
        </Text>
      </View>

      {/* Category Pills */}
      <View style={styles.catWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(c) => c}
          contentContainerStyle={styles.catList}
          renderItem={({ item }) => {
            const isSel = selectedCat === item;
            return (
              <TouchableOpacity
                style={[styles.catPill, isSel && styles.catPillActive]}
                onPress={() => setSelectedCat(item)}
                activeOpacity={0.7}
              >
                <Text style={[styles.catPillText, isSel && styles.catPillTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Logs Feed */}
      <FlatList
        data={filteredLogs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.logListContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const catMeta = getCategoryColor(item.category);

          return (
            <View style={styles.logCard}>
              <View style={styles.logCardHeader}>
                <View style={[styles.catBadge, { backgroundColor: catMeta.bg }]}>
                  <Text style={[styles.catBadgeText, { color: catMeta.text }]}>
                    {item.category}
                  </Text>
                </View>

                <Text style={styles.logTime}>{item.timestamp}</Text>
              </View>

              <Text style={styles.actionTitle}>{item.actionTitle}</Text>
              <Text style={styles.actionDetails}>{item.details}</Text>

              <View style={styles.logCardFooter}>
                <Text style={styles.actorName}>
                  By <Text style={{ fontWeight: '700', color: ADMIN_PALETTE.textPrimary }}>{item.adminName} ({item.adminRole})</Text>
                </Text>
                <Text style={styles.ipText}>{item.ipAddress}</Text>
              </View>
            </View>
          );
        }}
        ListFooterComponent={<View style={{ height: 110 }} />}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ADMIN_PALETTE.pageBg,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    marginBottom: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: ADMIN_PALETTE.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ADMIN_PALETTE.borderSoft,
  },
  titleBlock: {
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: ADMIN_PALETTE.textHeading,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 13,
    color: ADMIN_PALETTE.textSecondary,
    lineHeight: 18,
  },
  catWrapper: {
    marginBottom: 14,
  },
  catList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: ADMIN_PALETTE.cardBg,
    borderWidth: 1,
    borderColor: ADMIN_PALETTE.borderSoft,
  },
  catPillActive: {
    backgroundColor: ADMIN_PALETTE.primaryOrange,
    borderColor: ADMIN_PALETTE.primaryOrange,
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: ADMIN_PALETTE.textSecondary,
  },
  catPillTextActive: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  logListContent: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 40,
  },
  logCard: {
    backgroundColor: ADMIN_PALETTE.cardBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: ADMIN_PALETTE.borderSoft,
    ...adminShadow.sm,
  },
  logCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  catBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  catBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  logTime: {
    fontSize: 11.5,
    color: ADMIN_PALETTE.textMuted,
  },
  actionTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: ADMIN_PALETTE.textPrimary,
    marginBottom: 4,
  },
  actionDetails: {
    fontSize: 12.5,
    color: ADMIN_PALETTE.textSecondary,
    lineHeight: 17,
    marginBottom: 10,
  },
  logCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: ADMIN_PALETTE.pageBg,
  },
  actorName: {
    fontSize: 11.5,
    color: ADMIN_PALETTE.textSecondary,
  },
  ipText: {
    fontSize: 11,
    color: ADMIN_PALETTE.textMuted,
    fontFamily: 'monospace',
  },

  // ─── Farmer Admin Activity Styles (Image 3 Screen 2) ───
  faHeader: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  faBackBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faHeaderTitle: {
    flex: 1,
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.3,
  },
  faPillRow: {
    flexDirection: 'row',
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.md,
    gap: 10,
  },
  faPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  faPillActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  faPillText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },
  faPillTextActive: {
    color: adminColors.onBrand,
  },
  faListContent: {
    paddingHorizontal: adminSpacing.lg,
    gap: 12,
    paddingTop: 4,
  },
  faCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    ...adminShadow.sm,
  },
  faIconCircle: {
    width: 40,
    height: 40,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  faCardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  faCardTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    letterSpacing: -0.2,
  },
  faCardTime: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  faCardDetail: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '600',
    marginBottom: 3,
  },
  faCardFarmer: {
    ...adminType.caption,
    color: adminColors.muted,
  },
});
