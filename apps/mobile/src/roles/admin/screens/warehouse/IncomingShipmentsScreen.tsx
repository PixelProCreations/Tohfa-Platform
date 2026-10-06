import React, { useState } from 'react';
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
import Svg, { Circle, Defs, LinearGradient, Path, Polygon, Rect, Stop } from 'react-native-svg';

const PALETTE = {
  primary:       '#F0562A', // Brand Orange
  headerBg:      '#F0562A',
  headerPillBg:  'rgba(255, 255, 255, 0.22)',
  headerText:    '#FFFFFF',

  orangeDeep:    '#7A2E14',
  primarySoft:   '#FDF3F0', // Orange Tint
  pageBg:        '#F3EFE9', // App canvas soft cream

  textInk:       '#1A1A1A',
  textSecondary: '#5F5E5A',
  border:        '#EEDCD3', // Border - Card and input borders
  borderRow:     '#F2ECE5',
  cardBg:        '#FFFFFF',

  greenBadgeBg:  '#EAF3DE',
  greenBadgeText:'#0D684D',
  blueBadgeBg:   '#E6F1FB',
  blueBadgeText: '#0C447C',
  amberBadgeBg:  '#FEF3E2',
  amberBadgeText:'#854F0B',
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

function SlidersFilterIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M1 14h6M9 8h6M17 16h6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TruckIcon({ size = 18, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="1" y="3" width="15" height="13" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M16 8h4l3 3v5h-7V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="5.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
      <Circle cx="18.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function TransferArrowsIcon({ size = 18, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 8h15M15 4l4 4-4 4M20 16H5M9 12l-4 4 4 4" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export type ShipmentStatusTab = 'All' | 'Expected' | 'Arrived' | 'In Progress' | 'Completed';

export interface IncomingShipmentsScreenProps {
  onBack?: () => void;
  onOpenFilters?: () => void;
  onSelectShipment?: (shipmentId: string) => void;
}

export function IncomingShipmentsScreen({
  onBack,
  onOpenFilters,
  onSelectShipment,
}: IncomingShipmentsScreenProps) {
  const [activeFilterTab, setActiveFilterTab] = useState<ShipmentStatusTab>('All');

  const FILTER_TABS: ShipmentStatusTab[] = ['All', 'Expected', 'Arrived', 'In Progress', 'Completed'];

  const SHIPMENTS = [
    {
      id: 'SHP-000124',
      product: 'Tomato',
      type: 'Farmer Admin',
      source: 'Farmer Admin',
      destination: 'Coonoor',
      quantity: '500 KG',
      status: 'Arrived' as const,
      iconType: 'truck' as const,
    },
    {
      id: 'SHP-000119',
      product: 'Carrot Grade 1',
      type: 'Transfer',
      source: 'Kotagiri',
      destination: 'Ooty (Transfer)',
      quantity: '200 KG',
      status: 'In Progress' as const,
      iconType: 'transfer' as const,
    },
    {
      id: 'SHP-000120',
      product: 'Cabbage',
      type: 'Farmer Admin',
      source: 'Farmer Admin',
      destination: 'Kotagiri',
      quantity: '350 KG',
      status: 'Expected' as const,
      iconType: 'truck' as const,
    },
    {
      id: 'SHP-000115',
      product: 'Potato Jyoti',
      type: 'Transfer',
      source: 'Ooty',
      destination: 'Coonoor (Transfer)',
      quantity: '600 KG',
      status: 'Completed' as const,
      iconType: 'transfer' as const,
    },
  ];

  const filteredShipments = SHIPMENTS.filter((s) => {
    if (activeFilterTab === 'All') return true;
    return s.status === activeFilterTab;
  });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* ─── Top Header Banner ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerTitleGroup}>
            {onBack && (
              <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
                <ArrowBackIcon size={22} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <Text style={styles.headerTitle}>Incoming Shipments</Text>
          </View>
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={onOpenFilters}
            activeOpacity={0.7}
            accessibilityLabel="Search and Filters"
          >
            <SlidersFilterIcon size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Horizontal Filter Tabs ─── */}
        <View style={styles.tabsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterTabsRow}
          >
            {FILTER_TABS.map((tab) => {
              const isActive = activeFilterTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveFilterTab(tab)}
                  activeOpacity={0.8}
                  style={[
                    styles.tabPill,
                    isActive ? styles.tabPillActive : styles.tabPillInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.tabPillText,
                      isActive ? styles.tabPillTextActive : styles.tabPillTextInactive,
                    ]}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Horizontal Scroll Track Indicator with Left & Right Triangles */}
          <View style={styles.scrollIndicatorRow}>
            <Svg width={8} height={10} viewBox="0 0 8 10" fill="none">
              <Polygon points="8,0 0,5 8,10" fill="#7E7973" />
            </Svg>
            <View style={styles.scrollTrackBar} />
            <Svg width={8} height={10} viewBox="0 0 8 10" fill="none">
              <Polygon points="0,0 8,5 0,10" fill="#7E7973" />
            </Svg>
          </View>
        </View>

        {/* ─── Documented Context Disclaimer Box ─── */}
        <View style={styles.contextBox}>
          <Text style={styles.contextText}>
            Shipment Type is limited to two documented contexts: Farmer Admin → Main Warehouse (consolidated produce) and Warehouse Transfer — no other type is invented.
          </Text>
        </View>

        {/* ─── Shipment Card Container (Smooth 18px corners) ─── */}
        <View style={styles.shipmentCardContainer}>
          {filteredShipments.map((item, index) => {
            const isLast = index === filteredShipments.length - 1;
            const isArrived = item.status === 'Arrived';
            const isInProgress = item.status === 'In Progress';
            const isCompleted = item.status === 'Completed';

            const badgeBg = isArrived
              ? PALETTE.greenBadgeBg
              : isInProgress
              ? PALETTE.blueBadgeBg
              : isCompleted
              ? PALETTE.greenBadgeBg
              : PALETTE.amberBadgeBg;

            const badgeText = isArrived
              ? PALETTE.greenBadgeText
              : isInProgress
              ? PALETTE.blueBadgeText
              : isCompleted
              ? PALETTE.greenBadgeText
              : PALETTE.amberBadgeText;

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.shipmentRow,
                  !isLast && styles.shipmentRowBorder,
                ]}
                onPress={() => onSelectShipment?.(item.id)}
                activeOpacity={0.7}
              >
                {/* Left Icon Square */}
                <View style={styles.iconSquare}>
                  {item.iconType === 'truck' ? (
                    <TruckIcon size={18} color={PALETTE.primary} />
                  ) : (
                    <TransferArrowsIcon size={18} color={PALETTE.primary} />
                  )}
                </View>

                {/* Middle Info */}
                <View style={styles.shipmentInfo}>
                  <Text style={styles.shipmentTitle}>
                    {item.id} · {item.product}
                  </Text>
                  <Text style={styles.shipmentSubtitle}>
                    {item.source} → {item.destination} · {item.quantity}
                  </Text>
                </View>

                {/* Right Status Badge */}
                <View style={[styles.badge, { backgroundColor: badgeBg }]}>
                  <Text style={[styles.badgeText, { color: badgeText }]}>
                    {item.status}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  header: {
    backgroundColor: PALETTE.headerBg,
    paddingTop: Platform.OS === 'ios' ? 8 : 10,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    padding: 4,
    marginRight: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: PALETTE.headerPillBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
  },
  tabsContainer: {
    marginBottom: 12,
  },
  filterTabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 8,
  },
  tabPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100, // Full 100px from Design System PDF
  },
  tabPillActive: {
    backgroundColor: PALETTE.primary,
  },
  tabPillInactive: {
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  tabPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  tabPillTextActive: {
    color: '#FFFFFF',
  },
  tabPillTextInactive: {
    color: PALETTE.textInk,
  },
  scrollIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
    marginBottom: 4,
  },
  scrollTrackBar: {
    width: '68%',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7E7973',
  },
  contextBox: {
    backgroundColor: PALETTE.primarySoft,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 12,
    marginBottom: 14,
  },
  contextText: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.orangeDeep,
    lineHeight: 18,
  },
  shipmentCardContainer: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14, // LG 14px from Design System PDF
    borderWidth: 1,
    borderColor: PALETTE.border,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  shipmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  shipmentRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.borderRow,
  },
  iconSquare: {
    width: 36,
    height: 36,
    borderRadius: 8, // XS 8px from Design System PDF
    backgroundColor: PALETTE.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  shipmentInfo: {
    flex: 1,
  },
  shipmentTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  shipmentSubtitle: {
    fontSize: 11.5,
    fontWeight: '500',
    color: PALETTE.textSecondary,
    marginTop: 3,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
});
