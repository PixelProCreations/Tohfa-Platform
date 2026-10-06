import React, { useState } from 'react';
import {
  Pressable,
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
import type { ReturnHistoryRecord } from './SubWarehouseReturnHistoryDetailScreen';
export type { ReturnHistoryRecord };

// ─── Design Tokens (Primary Brand Color: #F0562A) ────────────────────────────
const PALETTE = {
  primary:       '#F0562A',
  primaryDark:   '#D4451B',
  primarySoft:   '#FFF7ED',
  pageBg:        '#FAF7F2',
  cardBg:        '#FFFFFF',
  textInk:       '#1E1612',
  textSecondary: '#7A726C',
  textMuted:     '#9E9690',
  border:        '#EBE5DC',
  greenBadge:    '#ECFDF5',
  greenText:     '#059669',
  redBadge:      '#FEE2E2',
  redText:       '#DC2626',
  amberBadge:    '#FEF3C7',
  amberText:     '#92400E',
};

// ─── Icons ───────────────────────────────────────────────────────────────────
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

function SlidersIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = '#9E9690' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M21 21l-4.35-4.35" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Bottom Tabs Icons ───────────────────────────────────────────────────────
function HomeTabIcon({ active = false }: { active?: boolean }) {
  const color = active ? PALETTE.primary : '#9E9690';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 22V12h6v10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReceivingTabIcon({ active = false }: { active?: boolean }) {
  const color = active ? PALETTE.primary : '#9E9690';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3v12M7 10l5 5 5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function InventoryTabIcon({ active = false }: { active?: boolean }) {
  const color = active ? PALETTE.primary : '#9E9690';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M8 12h8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M3 9h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function MoreTabIcon({ active = true }: { active?: boolean }) {
  const color = active ? PALETTE.primary : '#9E9690';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
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

export const INITIAL_RETURN_HISTORY: ReturnHistoryRecord[] = [
  {
    rmaId: 'RMA-2026-00125',
    orderId: 'ORD-002145',
    customerName: 'Ravi Kumar',
    reasonTag: 'Damaged',
    status: 'Completed',
    date: '25 Sep 2026',
    refundAmount: '₹200',
    inspectionResult: 'Issue Confirmed',
    returnedQuantity: '1.8 KG',
    inspectionNotes: '2 KG received. 0.5 KG visibly damaged.',
    decision: 'Approved',
    decisionDate: '25 Sep 2026',
    processedBy: 'SWA – Suresh',
    refundStatus: 'Completed',
    refundMethod: 'TOHFA Wallet',
    refundReference: 'REF-2026-001245',
    timeline: [
      { id: '1', title: 'Issue Reported', time: '25 Sep, 10:30 AM', isLast: false },
      { id: '2', title: 'Inspection Completed', time: '25 Sep, 10:55 AM', isLast: false },
      { id: '3', title: 'Return Approved', time: '25 Sep, 11:20 AM', isLast: false },
      { id: '4', title: 'Refund Completed', time: '25 Sep, 11:22 AM', isLast: true },
    ],
  },
  {
    rmaId: 'RMA-2026-00108',
    orderId: 'ORD-002098',
    customerName: 'Ganesh K.',
    reasonTag: 'Late',
    status: 'Rejected',
    date: '22 Sep 2026',
    inspectionResult: 'No Defect Found',
    returnedQuantity: '0.0 KG',
    inspectionNotes: 'Customer return request rejected due to return window elapsed.',
    decision: 'Rejected',
    decisionDate: '22 Sep 2026',
    processedBy: 'SWA – Suresh',
    refundStatus: 'None',
    refundMethod: 'N/A',
    timeline: [
      { id: '1', title: 'Issue Reported', time: '22 Sep, 02:15 PM', isLast: false },
      { id: '2', title: 'Return Rejected', time: '22 Sep, 03:00 PM', isLast: true },
    ],
  },
];

export interface SubWarehouseReturnHistoryScreenProps {
  onBack: () => void;
  onSelectRecord: (record: ReturnHistoryRecord) => void;
  onTabChange?: (tab: 'Home' | 'Receiving' | 'Inventory' | 'More') => void;
}

export function SubWarehouseReturnHistoryScreen({
  onBack,
  onSelectRecord,
  onTabChange,
}: SubWarehouseReturnHistoryScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Approved' | 'Rejected' | 'Completed'>('All');

  const filteredItems = INITIAL_RETURN_HISTORY.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.rmaId.toLowerCase().includes(q) ||
      item.orderId.toLowerCase().includes(q) ||
      item.customerName.toLowerCase().includes(q);

    const matchesFilter =
      activeFilter === 'All' || item.status === activeFilter;

    return matchesSearch && matchesFilter;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Return History</Text>

          <TouchableOpacity
            style={styles.sliderButton}
            activeOpacity={0.8}
          >
            <SlidersIcon size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Search Bar ─── */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} color="#9E9690" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search RMA, Ticket, Order or Customer"
            placeholderTextColor="#9E9690"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* ─── Filter Chips ─── */}
        <View style={styles.chipsRow}>
          {(['All', 'Approved', 'Rejected', 'Completed'] as const).map((chip) => {
            const isActive = activeFilter === chip;
            return (
              <TouchableOpacity
                key={chip}
                style={[styles.chipBtn, isActive && styles.chipBtnActive]}
                onPress={() => setActiveFilter(chip)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {chip}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── Return History Cards List ─── */}
        <View style={styles.cardsList}>
          {filteredItems.map((item) => {
            const isCompleted = item.status === 'Completed';
            const isRejected = item.status === 'Rejected';

            return (
              <TouchableOpacity
                key={item.rmaId}
                style={styles.rmaCard}
                onPress={() => onSelectRecord(item)}
                activeOpacity={0.85}
              >
                {/* Top Row: RMA ID + Status Badge */}
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.rmaIdText}>{item.rmaId}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      isCompleted && styles.statusBadgeCompleted,
                      isRejected && styles.statusBadgeRejected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        isCompleted && styles.statusBadgeTextCompleted,
                        isRejected && styles.statusBadgeTextRejected,
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>

                {/* Customer Name */}
                <Text style={styles.customerName}>{item.customerName}</Text>

                {/* Order ID */}
                <Text style={styles.orderId}>{item.orderId}</Text>

                {/* Reason Tag + Refund Amount */}
                <View style={styles.tagAmountRow}>
                  <View style={styles.reasonTag}>
                    <Text style={styles.reasonTagText}>{item.reasonTag}</Text>
                  </View>

                  {item.refundAmount && (
                    <Text style={styles.refundText}>
                      Refund {item.refundAmount}
                    </Text>
                  )}
                </View>

                {/* Date */}
                <Text style={styles.dateText}>{item.date}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 28 }} />
      </ScrollView>

      {/* ─── Bottom Navigation Bar ─── */}
      <View style={styles.bottomTabBar}>
        <Pressable
          style={styles.tabItem}
          onPress={() => onTabChange?.('Home')}
          accessibilityRole="tab"
        >
          <HomeTabIcon active={false} />
          <Text style={styles.tabLabel}>Home</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => onTabChange?.('Receiving')}
          accessibilityRole="tab"
        >
          <ReceivingTabIcon active={false} />
          <Text style={styles.tabLabel}>Receiving</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => onTabChange?.('Inventory')}
          accessibilityRole="tab"
        >
          <InventoryTabIcon active={false} />
          <Text style={styles.tabLabel}>Inventory</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => onTabChange?.('More')}
          accessibilityRole="tab"
        >
          <MoreTabIcon active={true} />
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>More</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ─── Stylesheet ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PALETTE.primary,
  },
  header: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
    marginLeft: 6,
  },
  sliderButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: PALETTE.textInk,
    paddingVertical: 0,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  chipBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  chipBtnActive: {
    borderColor: PALETTE.primary,
    backgroundColor: PALETTE.primarySoft,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.textSecondary,
  },
  chipTextActive: {
    color: PALETTE.primary,
    fontWeight: '800',
  },
  cardsList: {
    gap: 14,
  },
  rmaCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  rmaIdText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#8D4321',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeCompleted: {
    backgroundColor: PALETTE.greenBadge,
  },
  statusBadgeRejected: {
    backgroundColor: PALETTE.redBadge,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  statusBadgeTextCompleted: {
    color: PALETTE.greenText,
  },
  statusBadgeTextRejected: {
    color: PALETTE.redText,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 2,
  },
  orderId: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    marginBottom: 12,
  },
  tagAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reasonTag: {
    backgroundColor: PALETTE.amberBadge,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  reasonTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.amberText,
  },
  refundText: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.greenText,
  },
  dateText: {
    fontSize: 12,
    color: PALETTE.textMuted,
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9E9690',
  },
  tabLabelActive: {
    color: PALETTE.primary,
    fontWeight: '800',
  },
});
