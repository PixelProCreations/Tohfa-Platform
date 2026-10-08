import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { ActivityItem } from './SubWarehouseTodayOperationsScreen';

const PALETTE = {
  primary: '#F0562A',
  primaryDark: '#D4451B',
  primarySoft: '#FEF1EC',
  pageBg: '#FAF7F2',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#7A726C',
  textMuted: '#9E9690',
  border: '#EBE5DC',
  greenBadgeBg: '#E8F5E9',
  greenBadgeText: '#0D9488',
  amberBadgeBg: '#FEF3C7',
  amberBadgeText: '#D97706',
  redBadgeBg: '#FEE2E2',
  redBadgeText: '#DC2626',
  blueBadgeBg: '#E0F2FE',
  blueBadgeText: '#0284C7',
  tabInactive: '#827A74',
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 24, color = '#FFFFFF' }: { size?: number; color?: string }) {
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

function SearchIcon({ size = 18, color = '#7A726C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M20 20l-4-4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function LockBadgeIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" stroke="#FFFFFF" strokeWidth="2.2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function ChevronRight({ size = 16, color = '#9E9690' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Module Icons
function ReceivingIcon({ size = 18, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function StorageIcon({ size = 18, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 3v18M20 3v18M4 7h16M4 14h16M4 21h16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function VerificationIcon({ size = 18, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 11l3 3L22 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MaterialIcon({ size = 18, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="8" y="2" width="8" height="4" rx="1" stroke={color} strokeWidth="2" />
      <Path d="M9 14l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IssueIcon({ size = 18, color = '#DC2626' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 8v4M12 16h.01" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

export type SubWHTab = 'Home' | 'Receiving' | 'Inventory' | 'More';

export interface SubWarehouseWarehouseActivityScreenProps {
  onBack: () => void;
  onTabChange?: (tab: SubWHTab) => void;
  onNavigateToReceiving?: () => void;
  onNavigateToMaterialHandling?: () => void;
  onNavigateToStorage?: () => void;
  onNavigateToStockVerification?: () => void;
  onNavigateToOperationalIssues?: () => void;
  onSelectActivity?: (activity: ActivityItem) => void;
}

const WAREHOUSE_ACTIVITIES: ActivityItem[] = [
  {
    id: 'w1',
    activityId: 'ACT-004820',
    title: 'Goods Received',
    category: 'Receiving',
    subtitle: 'GRN-00291 · Tomato · Grade 1 · 140 KG',
    time: 'Today · 10:42 AM',
    status: 'Completed',
    moduleType: 'receiving',
    action: 'GRN-00291 received and verified · Tomato Grade 1 · 140 KG',
    reference: 'Related GRN GRN-00291',
    notes: 'Received in good condition from Main Warehouse (Ooty Hub). Operator: Suresh.',
  },
  {
    id: 'w2',
    activityId: 'ACT-004822',
    title: 'Storage location updated',
    category: 'Storage',
    subtitle: 'Rack 02 · Cold Storage · Tomato moved',
    time: 'Today · 09:50 AM',
    status: 'Completed',
    moduleType: 'storage',
    action: 'Tomato moved to Cold Storage · Rack 02, Shelf 03',
    reference: 'Related Batch BAT-COO-00241',
    notes: 'Relocated to make room for incoming Section B stock. Operator: Suresh.',
  },
  {
    id: 'w3',
    activityId: 'ACT-004821',
    title: 'Material Handling',
    category: 'Material Handling',
    subtitle: 'Packaging Box · Issued 20 units',
    time: 'Today · 09:50 AM',
    status: 'Completed',
    moduleType: 'material_handling',
    action: 'Packaging boxes issued for order fulfillment · 20 units',
    reference: 'Related Order ORD-1018',
    notes: 'Issued to packing station 1. Operator: Suresh.',
  },
  {
    id: 'w4',
    activityId: 'ACT-004823',
    title: 'Stock Verification',
    category: 'Verification',
    subtitle: 'Tomato · Grade 1 · Variance -5 KG detected',
    time: 'Today · 08:20 AM',
    status: 'Pending',
    moduleType: 'verification',
    action: 'Physical stock verification conducted · Tomato Grade 1',
    reference: 'Variance Check VER-2026-09',
    notes: 'Variance of -5 KG detected during morning cycle count. System: 100 KG, Counted: 95 KG.',
  },
  {
    id: 'w5',
    activityId: 'ACT-004824',
    title: 'Operational Issue',
    category: 'Issues',
    subtitle: 'Cold storage maintenance required',
    time: 'Today · 08:05 AM',
    status: 'Open',
    moduleType: 'operational_issue',
    action: 'Cold storage maintenance required in Section A',
    reference: 'Issue Ticket ISS-0028',
    notes: 'Cooling unit running above target temperature.',
  },
  {
    id: 'w6',
    activityId: 'ACT-004819',
    title: 'Goods Received',
    category: 'Receiving',
    subtitle: 'GRN-00290 · Potato · Grade 2 · 220 KG',
    time: 'Today · 07:45 AM',
    status: 'Completed',
    moduleType: 'receiving',
    action: 'Direct grower shipment accepted and inspected',
    reference: 'Related GRN GRN-00290',
    notes: 'Unloaded at Bay 2.',
  },
  {
    id: 'w7',
    activityId: 'ACT-004818',
    title: 'Stock Verification',
    category: 'Verification',
    subtitle: 'Carrot · Grade 1 · Verified count 80 KG',
    time: 'Yesterday · 04:15 PM',
    status: 'Completed',
    moduleType: 'verification',
    action: 'Physical count matched system balance 100%',
    reference: 'Verification Log VER-2026-08',
    notes: 'Rack 02 Shelf 03 verified by Suresh.',
  },
  {
    id: 'w8',
    activityId: 'ACT-004817',
    title: 'Storage location updated',
    category: 'Storage',
    subtitle: 'Rack 03 · Ambient · Potato 220 KG placed',
    time: 'Yesterday · 02:30 PM',
    status: 'Completed',
    moduleType: 'storage',
    action: 'Pallet position confirmed in Rack 03 Shelf 01',
    reference: 'Batch BAT-COO-00238',
    notes: 'Ambient storage zone allocated.',
  },
];

const FILTER_TABS = ['All', 'Receiving', 'Storage', 'Verification', 'Material Handling', 'Issues'];

export function SubWarehouseWarehouseActivityScreen({
  onBack,
  onTabChange,
  onNavigateToReceiving,
  onNavigateToMaterialHandling,
  onNavigateToStorage,
  onNavigateToStockVerification,
  onNavigateToOperationalIssues,
  onSelectActivity,
}: SubWarehouseWarehouseActivityScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');

  const filteredActivities = useMemo(() => {
    return WAREHOUSE_ACTIVITIES.filter((item) => {
      if (activeTab !== 'All' && item.category !== activeTab) {
        return false;
      }
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          (item.reference && item.reference.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [activeTab, searchQuery]);

  const handleCardPress = (item: ActivityItem) => {
    if (onSelectActivity) {
      onSelectActivity(item);
      return;
    }
    switch (item.moduleType) {
      case 'receiving':
        if (onNavigateToReceiving) onNavigateToReceiving();
        else onTabChange?.('Receiving');
        break;
      case 'material_handling':
        if (onNavigateToMaterialHandling) onNavigateToMaterialHandling();
        break;
      case 'storage':
        if (onNavigateToStorage) onNavigateToStorage();
        break;
      case 'verification':
        if (onNavigateToStockVerification) onNavigateToStockVerification();
        else onTabChange?.('Inventory');
        break;
      case 'operational_issue':
        if (onNavigateToOperationalIssues) onNavigateToOperationalIssues();
        break;
      default:
        break;
    }
  };

  const getModuleIcon = (category: string) => {
    switch (category) {
      case 'Receiving':
        return <ReceivingIcon size={18} color={PALETTE.primary} />;
      case 'Storage':
        return <StorageIcon size={18} color={PALETTE.primary} />;
      case 'Verification':
        return <VerificationIcon size={18} color="#0D9488" />;
      case 'Material Handling':
        return <MaterialIcon size={18} color="#D97706" />;
      case 'Issues':
        return <IssueIcon size={18} color="#DC2626" />;
      default:
        return <StorageIcon size={18} color={PALETTE.primary} />;
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Header: Warehouse Activity ─── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Go back"
          >
            <ArrowBackIcon size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Warehouse Activity</Text>
            <Text style={styles.headerSubtitle}>Activity History & Log</Text>
          </View>

          <View style={styles.lockBadge}>
            <LockBadgeIcon />
            <Text style={styles.lockBadgeText}>Coonoor</Text>
          </View>
        </View>
      </View>

      <View style={styles.contentWrap}>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} color={PALETTE.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search activity, GRN, rack, product..."
            placeholderTextColor={PALETTE.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.searchClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {FILTER_TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Activities List */}
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {filteredActivities.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No activities found</Text>
              <Text style={styles.emptySub}>No logged warehouse activities match your search or filter.</Text>
            </View>
          ) : (
            filteredActivities.map((act) => {
              const isCompleted = act.status === 'Completed';
              const isPending = act.status === 'Pending';

              const badgeBg = isCompleted
                ? PALETTE.greenBadgeBg
                : isPending
                ? PALETTE.amberBadgeBg
                : PALETTE.redBadgeBg;

              const badgeTextColor = isCompleted
                ? PALETTE.greenBadgeText
                : isPending
                ? PALETTE.amberBadgeText
                : PALETTE.redBadgeText;

              return (
                <TouchableOpacity
                  key={act.id}
                  style={styles.activityCard}
                  onPress={() => handleCardPress(act)}
                  activeOpacity={0.75}
                >
                  <View style={styles.cardTopRow}>
                    <View style={styles.categoryBadgeRow}>
                      <View style={styles.iconBox}>{getModuleIcon(act.category)}</View>
                      <Text style={styles.cardCategoryText}>{act.category}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
                      <Text style={[styles.statusBadgeText, { color: badgeTextColor }]}>
                        {act.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.cardTitle}>{act.title}</Text>
                  <Text style={styles.cardSubtitle}>{act.subtitle}</Text>

                  <View style={styles.cardFooter}>
                    <Text style={styles.cardTime}>{act.time}</Text>
                    <View style={styles.detailLinkRow}>
                      <Text style={styles.detailLinkText}>View Detail</Text>
                      <ChevronRight size={14} color={PALETTE.primary} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.primary,
  },
  header: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12.5,
    marginTop: 2,
    fontWeight: '500',
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 5,
  },
  lockBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  contentWrap: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: PALETTE.textInk,
    padding: 0,
  },
  searchClear: {
    fontSize: 14,
    color: PALETTE.textMuted,
    paddingHorizontal: 4,
  },

  filterScroll: {
    maxHeight: 46,
    marginBottom: 8,
    paddingLeft: 16,
  },
  filterContent: {
    paddingRight: 24,
    gap: 8,
  },
  filterPill: {
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: PALETTE.primary,
    borderColor: PALETTE.primary,
  },
  filterPillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.textSecondary,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 36,
    gap: 12,
  },

  emptyCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: PALETTE.textSecondary,
    textAlign: 'center',
  },

  activityCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: PALETTE.pageBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCategoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 3,
  },
  cardSubtitle: {
    fontSize: 13,
    color: PALETTE.textSecondary,
    marginBottom: 10,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F4EFE9',
    paddingTop: 10,
    marginTop: 2,
  },
  cardTime: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.textMuted,
  },
  detailLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  detailLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.primary,
  },
});
