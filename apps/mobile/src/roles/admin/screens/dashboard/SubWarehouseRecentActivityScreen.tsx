import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

// ─── Design Tokens (#F0562A Subwarehouse Brand Palette) ───────────────────────
const PALETTE = {
  primary:       '#F0562A',
  primaryDark:   '#D4451B',
  primarySoft:   '#FEF1EC',
  primaryBorder: '#FCD9CE',
  pageBg:        '#FAF7F2',
  cardBg:        '#FFFFFF',
  textInk:       '#1E1612',
  textSecondary: '#7A726C',
  textMuted:     '#9E9690',
  border:        '#EBE5DC',
  divider:       '#F0ECE6',
  metricBoxBg:   '#FAF7F2',

  // Badge Colors
  badgeBg:       '#FEF1EC',
  badgeText:     '#8A4A1B',
  redVariance:   '#DC2626',

  tabInactive:   '#827A74',
  tabBorder:     '#EAE4DB',
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────

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

function ChevronDownIcon({ size = 16, color = PALETTE.textInk }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9l6 6 6-6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function HomeTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 21V12h6v9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReceivingTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M12 3v12m0 0l4-4m-4 4l-4-4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function InventoryTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3m18 0v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8m18 0H3m7 4h4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function MoreTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="5" cy="5" r="1.5" fill={color} />
      <Circle cx="12" cy="5" r="1.5" fill={color} />
      <Circle cx="19" cy="5" r="1.5" fill={color} />
      <Circle cx="5" cy="12" r="1.5" fill={color} />
      <Circle cx="12" cy="12" r="1.5" fill={color} />
      <Circle cx="19" cy="12" r="1.5" fill={color} />
      <Circle cx="5" cy="19" r="1.5" fill={color} />
      <Circle cx="12" cy="19" r="1.5" fill={color} />
      <Circle cx="19" cy="19" r="1.5" fill={color} />
    </Svg>
  );
}

// ─── Types & Activity Data ────────────────────────────────────────────────────

export interface ActivityItem {
  id: string;
  title: string;
  type: 'Inventory' | 'Receiving' | 'Orders' | 'Cash' | 'QC';
  subtitle: string;
  operator: string;
  time: string;
  dateTag: 'Today' | 'Yesterday' | 'Earlier';
  metrics?: {
    system: string;
    counted: string;
    variance: string;
  };
}

const ACTIVITIES_DATA: ActivityItem[] = [
  {
    id: 'act-1',
    title: 'Stock Verification',
    type: 'Inventory',
    subtitle: 'Tomato — Grade 1',
    operator: 'By Suresh',
    time: '10:25 AM',
    dateTag: 'Today',
    metrics: {
      system: '100 KG',
      counted: '95 KG',
      variance: '-5 KG',
    },
  },
  {
    id: 'act-2',
    title: 'Goods Received',
    type: 'Receiving',
    subtitle: 'GR-00124 · 150 KG Tomato',
    operator: 'By Suresh',
    time: '10:42 AM',
    dateTag: 'Today',
  },
  {
    id: 'act-3',
    title: 'Order Packed',
    type: 'Orders',
    subtitle: 'ORD-10242 · 3 items',
    operator: 'By Suresh',
    time: '10:20 AM',
    dateTag: 'Today',
  },
  {
    id: 'act-4',
    title: 'Cash Top-Up',
    type: 'Cash',
    subtitle: '₹2,000 · Customer CUS-1042',
    operator: 'By Suresh',
    time: '09:55 AM',
    dateTag: 'Today',
  },
  {
    id: 'act-5',
    title: 'QC Completed',
    type: 'QC',
    subtitle: 'GR-00123 · Carrot, Grade 1 · Accepted in full',
    operator: 'By Suresh',
    time: '09:20 AM',
    dateTag: 'Today',
  },
];

export interface SubWarehouseRecentActivityScreenProps {
  onBack?: () => void;
  onTabChange?: (tab: 'Home' | 'Receiving' | 'Inventory' | 'More') => void;
}

export function SubWarehouseRecentActivityScreen({
  onBack,
  onTabChange,
}: SubWarehouseRecentActivityScreenProps) {
  const [activeTab, setActiveTab] = useState<'Home' | 'Receiving' | 'Inventory' | 'More'>('Home');
  const [dateFilter, setDateFilter] = useState<'Today' | 'Yesterday' | 'This Week' | 'All Time'>('Today');
  const [typeFilter, setTypeFilter] = useState<'All Activities' | 'Inventory' | 'Receiving' | 'Orders' | 'Cash' | 'QC'>('All Activities');
  const [showDateModal, setShowDateModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);

  const handleTabPress = (tab: 'Home' | 'Receiving' | 'Inventory' | 'More') => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const filteredActivities = ACTIVITIES_DATA.filter((item) => {
    if (typeFilter !== 'All Activities' && item.type !== typeFilter) {
      return false;
    }
    if (dateFilter === 'Today' && item.dateTag !== 'Today') {
      return false;
    }
    return true;
  });

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Top Brand Header ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          {onBack && (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={onBack}
              activeOpacity={0.8}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel="Go back"
            >
              <ArrowBackIcon size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Recent Activity</Text>
        </View>
      </View>

      {/* ─── Filter Pills Bar ─── */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={styles.filterPill}
          onPress={() => setShowDateModal(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.filterPillText}>{dateFilter}</Text>
          <ChevronDownIcon size={16} color={PALETTE.textInk} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterPill}
          onPress={() => setShowTypeModal(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.filterPillText}>{typeFilter}</Text>
          <ChevronDownIcon size={16} color={PALETTE.textInk} />
        </TouchableOpacity>
      </View>

      {/* ─── Activity List ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredActivities.map((act) => (
          <View key={act.id} style={styles.activityCard}>
            {/* Card Header Row */}
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>{act.title}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{act.type}</Text>
              </View>
            </View>

            {/* Subtitle */}
            <Text style={styles.cardSubtitle}>{act.subtitle}</Text>

            {/* Optional Metrics (3 columns for Stock Verification) */}
            {act.metrics && (
              <View style={styles.metricsRow}>
                <View style={styles.metricBox}>
                  <Text style={styles.metricValue}>{act.metrics.system}</Text>
                  <Text style={styles.metricLabel}>SYSTEM</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricValue}>{act.metrics.counted}</Text>
                  <Text style={styles.metricLabel}>COUNTED</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={[styles.metricValue, { color: PALETTE.redVariance }]}>
                    {act.metrics.variance}
                  </Text>
                  <Text style={styles.metricLabel}>VARIANCE</Text>
                </View>
              </View>
            )}

            {/* Bottom Meta Row */}
            <View style={styles.cardFooterRow}>
              <Text style={styles.footerOperator}>{act.operator}</Text>
              <Text style={styles.footerTime}>{act.time}</Text>
            </View>
          </View>
        ))}

        {filteredActivities.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No activity records match your filter.</Text>
          </View>
        )}
      </ScrollView>

      {/* ─── Bottom Navigation Bar ─── */}
      <View style={styles.bottomTabBar}>
        <Pressable
          style={styles.tabItem}
          onPress={() => handleTabPress('Home')}
          accessibilityRole="tab"
        >
          <HomeTabIcon active={activeTab === 'Home'} />
          <Text style={[styles.tabLabel, activeTab === 'Home' && styles.tabLabelActive]}>Home</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => handleTabPress('Receiving')}
          accessibilityRole="tab"
        >
          <ReceivingTabIcon active={activeTab === 'Receiving'} />
          <Text style={[styles.tabLabel, activeTab === 'Receiving' && styles.tabLabelActive]}>Receiving</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => handleTabPress('Inventory')}
          accessibilityRole="tab"
        >
          <InventoryTabIcon active={activeTab === 'Inventory'} />
          <Text style={[styles.tabLabel, activeTab === 'Inventory' && styles.tabLabelActive]}>Inventory</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => handleTabPress('More')}
          accessibilityRole="tab"
        >
          <MoreTabIcon active={activeTab === 'More'} />
          <Text style={[styles.tabLabel, activeTab === 'More' && styles.tabLabelActive]}>More</Text>
        </Pressable>
      </View>

      {/* ─── Date Filter Modal ─── */}
      <Modal
        visible={showDateModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDateModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowDateModal(false)}>
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Select Date Filter</Text>
            {(['Today', 'Yesterday', 'This Week', 'All Time'] as const).map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.modalOptionRow, dateFilter === d && styles.modalOptionActive]}
                onPress={() => {
                  setDateFilter(d);
                  setShowDateModal(false);
                }}
              >
                <Text style={[styles.modalOptionText, dateFilter === d && styles.modalOptionTextActive]}>
                  {d}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* ─── Type Filter Modal ─── */}
      <Modal
        visible={showTypeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTypeModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowTypeModal(false)}>
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Select Activity Type</Text>
            {(['All Activities', 'Inventory', 'Receiving', 'Orders', 'Cash', 'QC'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.modalOptionRow, typeFilter === t && styles.modalOptionActive]}
                onPress={() => {
                  setTypeFilter(t);
                  setShowTypeModal(false);
                }}
              >
                <Text style={[styles.modalOptionText, typeFilter === t && styles.modalOptionTextActive]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Stylesheet ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.primary,
  },
  headerBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  filterBar: {
    backgroundColor: PALETTE.pageBg,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    gap: 10,
  },
  filterPill: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  filterPillText: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 24,
    gap: 12,
  },
  activityCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.textInk,
    letterSpacing: -0.2,
  },
  badge: {
    backgroundColor: PALETTE.badgeBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.badgeText,
  },
  cardSubtitle: {
    fontSize: 13,
    color: PALETTE.textSecondary,
    marginTop: 4,
    marginBottom: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  metricBox: {
    flex: 1,
    backgroundColor: PALETTE.metricBoxBg,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
    letterSpacing: -0.3,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: PALETTE.textSecondary,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 2,
  },
  footerOperator: {
    fontSize: 12,
    color: PALETTE.textSecondary,
  },
  footerTime: {
    fontSize: 12,
    color: PALETTE.textSecondary,
  },
  emptyState: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: PALETTE.textSecondary,
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.tabBorder,
    paddingVertical: 8,
    paddingBottom: 12,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.tabInactive,
    marginTop: 3,
  },
  tabLabelActive: {
    color: PALETTE.primary,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    padding: 18,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginBottom: 12,
  },
  modalOptionRow: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  modalOptionActive: {
    backgroundColor: PALETTE.primarySoft,
  },
  modalOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.textInk,
  },
  modalOptionTextActive: {
    color: PALETTE.primary,
    fontWeight: '700',
  },
});
