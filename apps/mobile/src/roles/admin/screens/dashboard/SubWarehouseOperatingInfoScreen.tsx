import React from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// ─── Design Tokens (#F0562A Unified Subwarehouse Palette) ────────────────────
const PALETTE = {
  primary: '#F0562A',
  primaryDark: '#D4451B',
  primaryLight: '#FFF0EB',
  primarySoft: '#FEF1EC',
  primaryBorder: '#FCD9CE',

  todayCardBg: '#FFF8F5',
  todayCardBorder: '#F9D8CB',
  todayHighlightRow: '#FEF1EC',

  pageBg: '#FAF7F2',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#7A726C',
  textMuted: '#9E9690',
  border: '#EBE5DC',
  divider: '#F4EFE9',

  // Status & Tags
  greenBadge: '#DCFCE7',
  greenText: '#15803D',
  greenDot: '#10B981',

  // Info Banner (Blue)
  infoBg: '#EFF6FF',
  infoBorder: '#BFDBFE',
  infoText: '#1D4ED8',

  // Warning Banner (Red)
  warningBg: '#FEF2F2',
  warningBorder: '#FECACA',
  warningText: '#DC2626',

  tabInactive: '#827A74',
  tabBorder: '#EAE4DB',
};

// ─── SVG Icons ───────────────────────────────────────────────────────────────

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

function LockBadgeIcon({ size = 12, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" stroke={color} strokeWidth="2.2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function CheckIcon({ size = 14, color = PALETTE.greenText }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={color}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SlashCircleIcon({ size = 18, color = '#DC2626' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M4.93 4.93l14.14 14.14" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function HomeTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 22V12h6v10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReceivingTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 10l5 5 5-5M12 15V3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InventoryTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <Path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MoreTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="5" cy="5" r="2" fill={color} />
      <Circle cx="12" cy="5" r="2" fill={color} />
      <Circle cx="19" cy="5" r="2" fill={color} />
      <Circle cx="5" cy="12" r="2" fill={color} />
      <Circle cx="12" cy="12" r="2" fill={color} />
      <Circle cx="19" cy="12" r="2" fill={color} />
      <Circle cx="5" cy="19" r="2" fill={color} />
      <Circle cx="12" cy="19" r="2" fill={color} />
      <Circle cx="19" cy="19" r="2" fill={color} />
    </Svg>
  );
}

export interface SubWarehouseOperatingInfoScreenProps {
  onBack: () => void;
  onTabChange?: ((tab: 'Home' | 'Receiving' | 'Inventory' | 'More') => void) | undefined;
}

export function SubWarehouseOperatingInfoScreen({
  onBack,
  onTabChange,
}: SubWarehouseOperatingInfoScreenProps) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        decelerationRate={0.985}
        bounces={true}
      >
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
            <Text style={styles.headerTitleText}>Operating Information</Text>
          </View>

          {/* Locked Warehouse Pill */}
          <View style={styles.lockedPill}>
            <LockBadgeIcon size={12} color="#FFFFFF" />
            <Text style={styles.lockedPillText}>Coonoor Warehouse</Text>
          </View>
        </View>

        {/* ─── Main Content Body ─── */}
        <View style={styles.mainContainer}>
          {/* 1. Operating Status Section */}
          <Text style={styles.sectionHeading}>Operating Status</Text>
          <View style={styles.card}>
            <Text style={styles.infoLabel}>Warehouse Status</Text>
            <View style={styles.operationalStatusRow}>
              <View style={styles.greenDot} />
              <Text style={styles.operationalText}>Operational</Text>
            </View>
          </View>

          {/* Blue Info Notice Box */}
          <View style={styles.blueNoticeBox}>
            <Text style={styles.blueNoticeText}>
              SWA cannot change this status — it's managed by authorized higher-level warehouse/configuration roles.
            </Text>
          </View>

          {/* Today Open Card */}
          <View style={styles.todayCard}>
            <Text style={styles.todayLabel}>Today</Text>
            <Text style={styles.todayValue}>Open · 09:00 AM – 06:00 PM</Text>
          </View>

          {/* 2. Operating Hours Section */}
          <Text style={styles.sectionHeading}>Operating Hours</Text>
          <View style={styles.hoursCard}>
            {/* Monday */}
            <View style={styles.hoursRow}>
              <Text style={styles.dayLabel}>Monday</Text>
              <Text style={styles.hoursValue}>09:00 AM – 06:00 PM</Text>
            </View>

            {/* Tuesday */}
            <View style={styles.hoursRow}>
              <Text style={styles.dayLabel}>Tuesday</Text>
              <Text style={styles.hoursValue}>09:00 AM – 06:00 PM</Text>
            </View>

            {/* Wednesday */}
            <View style={styles.hoursRow}>
              <Text style={styles.dayLabel}>Wednesday</Text>
              <Text style={styles.hoursValue}>09:00 AM – 06:00 PM</Text>
            </View>

            {/* Thursday (Today) Highlighted */}
            <View style={[styles.hoursRow, styles.hoursRowHighlight]}>
              <Text style={[styles.dayLabel, styles.dayLabelHighlight]}>Thursday (Today)</Text>
              <Text style={[styles.hoursValue, styles.hoursValueHighlight]}>09:00 AM – 06:00 PM</Text>
            </View>

            {/* Friday */}
            <View style={styles.hoursRow}>
              <Text style={styles.dayLabel}>Friday</Text>
              <Text style={styles.hoursValue}>09:00 AM – 06:00 PM</Text>
            </View>

            {/* Saturday */}
            <View style={styles.hoursRow}>
              <Text style={styles.dayLabel}>Saturday</Text>
              <Text style={styles.hoursValue}>09:00 AM – 05:00 PM</Text>
            </View>

            {/* Sunday */}
            <View style={[styles.hoursRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.dayLabel}>Sunday</Text>
              <Text style={styles.closedValue}>Closed</Text>
            </View>
          </View>

          {/* Blue Info Notice Box */}
          <View style={styles.blueNoticeBox}>
            <Text style={styles.blueNoticeText}>
              Hours shown are example UI values — actual hours come from warehouse configuration, never hard-coded.
            </Text>
          </View>

          {/* 3. Operational Services Section */}
          <Text style={styles.sectionHeading}>Operational Services</Text>
          <View style={styles.card}>
            <View style={styles.servicesWrap}>
              <View style={styles.servicePill}>
                <CheckIcon size={14} color={PALETTE.greenText} />
                <Text style={styles.servicePillText}>Customer Pickup</Text>
              </View>

              <View style={styles.servicePill}>
                <CheckIcon size={14} color={PALETTE.greenText} />
                <Text style={styles.servicePillText}>Market Sales</Text>
              </View>

              <View style={styles.servicePill}>
                <CheckIcon size={14} color={PALETTE.greenText} />
                <Text style={styles.servicePillText}>Cash Top-Up</Text>
              </View>

              <View style={styles.servicePill}>
                <CheckIcon size={14} color={PALETTE.greenText} />
                <Text style={styles.servicePillText}>Goods Receiving</Text>
              </View>

              <View style={styles.servicePill}>
                <CheckIcon size={14} color={PALETTE.greenText} />
                <Text style={styles.servicePillText}>Order Fulfillment</Text>
              </View>
            </View>
          </View>

          {/* Blue Info Notice Box */}
          <View style={styles.blueNoticeBox}>
            <Text style={styles.blueNoticeText}>
              Only services actually configured for this warehouse are shown — none is invented.
            </Text>
          </View>

          {/* 4. Fulfillment Information Section */}
          <Text style={styles.sectionHeading}>Fulfillment Information</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Customer Pickup</Text>
                <Text style={styles.infoValue}>Available</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Home Delivery</Text>
                <Text style={styles.infoValue}>Available</Text>
              </View>
            </View>

            <View style={styles.dividerLine} />

            <View style={styles.infoRow}>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Market Sales</Text>
                <Text style={styles.infoValue}>Available</Text>
              </View>
              <View style={styles.infoCol} />
            </View>
          </View>

          {/* 5. Daily Operational Capacity Section */}
          <Text style={styles.sectionHeading}>Daily Operational Capacity</Text>
          <View style={styles.card}>
            <View style={styles.capacityDataRow}>
              <Text style={styles.capacityDataLabel}>Orders</Text>
              <Text style={styles.capacityDataValue}>320 / day</Text>
            </View>
            <View style={styles.capacityDataRow}>
              <Text style={styles.capacityDataLabel}>Receiving</Text>
              <Text style={styles.capacityDataValue}>50 receipts / day</Text>
            </View>
            <View style={[styles.capacityDataRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.capacityDataLabel}>Market Sales</Text>
              <Text style={styles.capacityDataValue}>180 / day</Text>
            </View>
          </View>

          {/* Blue Info Notice Box */}
          <View style={styles.blueNoticeBox}>
            <Text style={styles.blueNoticeText}>
              Capacity numbers shown only if configured — never invented.
            </Text>
          </View>

          {/* 6. Special Operating Days Section */}
          <Text style={styles.sectionHeading}>Special Operating Days</Text>
          <View style={styles.card}>
            <View style={styles.capacityDataRow}>
              <Text style={styles.capacityDataLabel}>25 Dec</Text>
              <Text style={styles.closedBoldValue}>Closed</Text>
            </View>
            <View style={[styles.capacityDataRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.capacityDataLabel}>01 Jan</Text>
              <Text style={styles.closedBoldValue}>Closed</Text>
            </View>
          </View>

          {/* 7. Operating Notes Section */}
          <Text style={styles.sectionHeading}>Operating Notes</Text>
          <View style={styles.card}>
            <Text style={styles.notesText}>
              Warehouse-specific operational information configured by authorized administration.
            </Text>
          </View>

          {/* 8. Red Warning Alert Box */}
          <View style={styles.redWarningBox}>
            <SlashCircleIcon size={18} color={PALETTE.warningText} />
            <Text style={styles.redWarningText}>
              No Edit Operating Hours, Change Status, Change Capacity, or Configure Services — all remain with authorized higher-level roles.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ─── Bottom Navigation Bar ─── */}
      <View style={styles.bottomTabBar}>
        <Pressable
          style={styles.tabItem}
          onPress={() => {
            if (onTabChange) onTabChange('Home');
            else onBack();
          }}
          accessibilityRole="tab"
        >
          <HomeTabIcon active={false} />
          <Text style={styles.tabLabel}>Home</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => {
            if (onTabChange) onTabChange('Receiving');
          }}
          accessibilityRole="tab"
        >
          <ReceivingTabIcon active={false} />
          <Text style={styles.tabLabel}>Receiving</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => {
            if (onTabChange) onTabChange('Inventory');
          }}
          accessibilityRole="tab"
        >
          <InventoryTabIcon active={false} />
          <Text style={styles.tabLabel}>Inventory</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => {
            if (onTabChange) onTabChange('More');
          }}
          accessibilityRole="tab"
        >
          <MoreTabIcon active={true} />
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>More</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ─── Stylesheet ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.primary,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingBottom: 24,
  },

  // ─── Header Banner ─────────────────────────────────────────────────────────
  headerBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleText: {
    fontSize: 21,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  lockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginLeft: 6,
  },
  lockedPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ─── Main Container ────────────────────────────────────────────────────────
  mainContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // ─── Section Headings ──────────────────────────────────────────────────────
  sectionHeading: {
    fontSize: 15.5,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginTop: 6,
    marginBottom: 10,
    letterSpacing: -0.2,
  },

  // ─── Standard White Card ───────────────────────────────────────────────────
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  infoCol: {
    flex: 1,
    paddingRight: 8,
  },
  infoLabel: {
    fontSize: 11.5,
    color: PALETTE.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  dividerLine: {
    height: 1,
    backgroundColor: PALETTE.divider,
    marginVertical: 10,
  },
  operationalStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 2,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PALETTE.greenDot,
  },
  operationalText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.greenText,
  },

  // ─── Today Open Card ───────────────────────────────────────────────────────
  todayCard: {
    backgroundColor: PALETTE.todayCardBg,
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: PALETTE.todayCardBorder,
    marginBottom: 16,
  },
  todayLabel: {
    fontSize: 11.5,
    color: PALETTE.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  todayValue: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.primary,
  },

  // ─── Operating Hours Card ──────────────────────────────────────────────────
  hoursCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 12,
    overflow: 'hidden',
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.divider,
  },
  hoursRowHighlight: {
    backgroundColor: PALETTE.todayHighlightRow,
  },
  dayLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  dayLabelHighlight: {
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  hoursValue: {
    fontSize: 12.5,
    color: PALETTE.textSecondary,
    fontWeight: '500',
  },
  hoursValueHighlight: {
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  closedValue: {
    fontSize: 12.5,
    color: PALETTE.textSecondary,
    fontWeight: '500',
  },
  closedBoldValue: {
    fontSize: 13,
    color: PALETTE.textInk,
    fontWeight: '800',
  },

  // ─── Services Wrap ─────────────────────────────────────────────────────────
  servicesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  servicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: PALETTE.greenBadge,
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  servicePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.greenText,
  },

  // ─── Daily Capacity Rows ───────────────────────────────────────────────────
  capacityDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.divider,
  },
  capacityDataLabel: {
    fontSize: 13,
    color: PALETTE.textSecondary,
    fontWeight: '500',
  },
  capacityDataValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: PALETTE.textInk,
  },

  // ─── Notes ─────────────────────────────────────────────────────────────────
  notesText: {
    fontSize: 12.5,
    lineHeight: 18,
    color: PALETTE.textSecondary,
    fontWeight: '500',
  },

  // ─── Blue Info Box ─────────────────────────────────────────────────────────
  blueNoticeBox: {
    backgroundColor: PALETTE.infoBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.infoBorder,
    padding: 12,
    marginBottom: 14,
  },
  blueNoticeText: {
    fontSize: 11.5,
    lineHeight: 16.5,
    color: PALETTE.infoText,
    fontWeight: '500',
  },

  // ─── Red Warning Box ───────────────────────────────────────────────────────
  redWarningBox: {
    backgroundColor: PALETTE.warningBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.warningBorder,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  redWarningText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 17,
    color: PALETTE.warningText,
    fontWeight: '500',
  },

  // ─── Bottom Tab Bar ────────────────────────────────────────────────────────
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.tabBorder,
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    color: PALETTE.tabInactive,
    marginTop: 2.5,
  },
  tabLabelActive: {
    color: PALETTE.primary,
    fontWeight: '800',
  },
});
