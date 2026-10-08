import React, { useState } from 'react';
import {
  FlatList,
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

// ─── Design Tokens (Primary Brand Color: #F0562A) ────────────────────────────
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
  divider:       '#F4EFE9',
  greenBadge:    '#DCFCE7',
  greenText:     '#15803D',
  amberBadge:    '#FEF3C7',
  amberText:     '#B45309',
  redBadge:      '#FEE2E2',
  redText:       '#B91C1C',
};

// ─── Icons ───────────────────────────────────────────────────────────────────
function ReturnBoxHeaderIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 3h6a1 1 0 0 1 1 1v1H8V4a1 1 0 0 1 1-1z"
        stroke={color}
        strokeWidth="1.8"
      />
      <Rect
        x="3.5"
        y="5"
        width="17"
        height="16"
        rx="3.5"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path
        d="M14.5 13H8.5M8.5 13l2.8-2.8M8.5 13l2.8 2.8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BellIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LockIcon({ size = 12, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke={color} strokeWidth="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = '#9E9690' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M21 21l-4.35-4.35" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function FilterIcon({ size = 18, color = '#7A726C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 6h16M6 12h12M8 18h8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function NewBadgeIcon({ size = 20, color = '#8D4321' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="4" width="20" height="16" rx="3" stroke={color} strokeWidth="1.8" />
      <Path d="M6 15V9l3 6V9M13 9v6h3M13 12h2M18 9v6" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function HistoryClockIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 7v5l3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ArrowForwardIcon({ size = 18, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function EditNoteIcon({ size = 20, color = '#8D4321' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckCircleIcon({ size = 20, color = '#8D4321' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Path d="M8 12l2.5 2.5 5.5-5.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PendingDotsIcon({ size = 20, color = '#EF4444' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Circle cx="8" cy="12" r="1.2" fill={color} />
      <Circle cx="12" cy="12" r="1.2" fill={color} />
      <Circle cx="16" cy="12" r="1.2" fill={color} />
    </Svg>
  );
}

// ─── Bottom Navigation Icons ──────────────────────────────────────────────────
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

// ─── Data Types ──────────────────────────────────────────────────────────────
export interface RmaRecord {
  id: string;
  rmaId: string;
  orderId: string;
  customerName: string;
  customerId: string;
  customerPhone: string;
  orderDate: string;
  salesChannel: string;
  paymentStatus: string;
  productName: string;
  grade: string;
  quantityPurchased: string;
  unitPrice: string;
  lineTotal: string;
  issueCategory: 'Damaged' | 'Quality' | 'Quantity' | 'Missing' | 'Wrong' | 'Late';
  reportedDate: string;
  timestampText: string;
  description: string;
  ticketId: string;
  requestedQuantity: string;
  requestedResolution: string;
  status: 'New' | 'Under Review' | 'Approved' | 'Pending Resolution';
}

export const INITIAL_RMA_ITEMS: RmaRecord[] = [
  {
    id: 'rma-1',
    rmaId: 'RMA-2026-00125',
    orderId: 'ORD-002145',
    customerName: 'Ravi Kumar',
    customerId: 'CUS-001245',
    customerPhone: '+91 XXXXX XXXXX',
    orderDate: '24 Sep 2026',
    salesChannel: 'Online Order',
    paymentStatus: 'Paid',
    productName: 'Tomato',
    grade: 'Grade 1',
    quantityPurchased: '5 KG',
    unitPrice: '₹100 / KG',
    lineTotal: '₹500',
    issueCategory: 'Damaged',
    reportedDate: '25 Sep 2026',
    timestampText: '25 Sep 2026 · 10:30 AM',
    description: 'Customer reported damaged produce after pickup.',
    ticketId: 'TKT-2026-00125',
    requestedQuantity: '2 KG',
    requestedResolution: 'Refund',
    status: 'New',
  },
  {
    id: 'rma-2',
    rmaId: 'RMA-2026-00119',
    orderId: 'ORD-002130',
    customerName: 'Anitha',
    customerId: 'CUS-001188',
    customerPhone: '+91 98412 34567',
    orderDate: '23 Sep 2026',
    salesChannel: 'Market Counter',
    paymentStatus: 'Paid',
    productName: 'Cabbage',
    grade: 'Grade 1',
    quantityPurchased: '3 KG',
    unitPrice: '₹40 / KG',
    lineTotal: '₹120',
    issueCategory: 'Quality',
    reportedDate: '24 Sep 2026',
    timestampText: '24 Sep 2026 · 3:15 PM',
    description: 'Outer leaves wilting and discoloration observed.',
    ticketId: 'TKT-2026-00119',
    requestedQuantity: '1 KG',
    requestedResolution: 'Refund',
    status: 'Under Review',
  },
  {
    id: 'rma-3',
    rmaId: 'RMA-2026-00115',
    orderId: 'ORD-002102',
    customerName: 'Kavitha S.',
    customerId: 'CUS-001045',
    customerPhone: '+91 94432 11223',
    orderDate: '22 Sep 2026',
    salesChannel: 'Online Order',
    paymentStatus: 'Paid',
    productName: 'Garlic',
    grade: 'Premium',
    quantityPurchased: '2 KG',
    unitPrice: '₹220 / KG',
    lineTotal: '₹440',
    issueCategory: 'Missing',
    reportedDate: '23 Sep 2026',
    timestampText: '23 Sep 2026 · 11:20 AM',
    description: 'Item missing from dispatch crate box.',
    ticketId: 'TKT-2026-00115',
    requestedQuantity: '1 KG',
    requestedResolution: 'Replacement',
    status: 'Approved',
  },
  {
    id: 'rma-4',
    rmaId: 'RMA-2026-00108',
    orderId: 'ORD-002095',
    customerName: 'Suresh M.',
    customerId: 'CUS-000982',
    customerPhone: '+91 98844 55667',
    orderDate: '21 Sep 2026',
    salesChannel: 'HORECA Supply',
    paymentStatus: 'Paid',
    productName: 'Potato',
    grade: 'Grade 2',
    quantityPurchased: '20 KG',
    unitPrice: '₹35 / KG',
    lineTotal: '₹700',
    issueCategory: 'Wrong',
    reportedDate: '22 Sep 2026',
    timestampText: '22 Sep 2026 · 04:45 PM',
    description: 'Received small grade potatoes instead of Grade 1 standard.',
    ticketId: 'TKT-2026-00108',
    requestedQuantity: '5 KG',
    requestedResolution: 'Credit Note',
    status: 'Pending Resolution',
  },
];

export interface SubWarehouseReturnsIssuesScreenProps {
  onBack: () => void;
  onSelectRma: (rma: RmaRecord) => void;
  onTabChange?: (tab: 'Home' | 'Receiving' | 'Inventory' | 'More') => void;
  onNavigateToNotifications?: () => void;
  onNavigateToHistory?: () => void;
  warehouseName?: string;
}

export function SubWarehouseReturnsIssuesScreen({
  onBack,
  onSelectRma,
  onTabChange,
  onNavigateToNotifications,
  onNavigateToHistory,
  warehouseName = 'Coonoor Warehouse',
}: SubWarehouseReturnsIssuesScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredItems = INITIAL_RMA_ITEMS.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.rmaId.toLowerCase().includes(q) ||
      item.orderId.toLowerCase().includes(q) ||
      item.customerName.toLowerCase().includes(q);

    const matchesCategory =
      !selectedCategory || item.issueCategory.toUpperCase() === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleGroup}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
              activeOpacity={0.8}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <ReturnBoxHeaderIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Returns & Issues</Text>
          </View>

          <TouchableOpacity
            style={styles.bellButton}
            onPress={onNavigateToNotifications}
            activeOpacity={0.8}
            accessibilityLabel="Notifications"
          >
            <BellIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Warehouse Pill Chip */}
        <View style={styles.warehousePill}>
          <LockIcon size={12} color="rgba(255, 255, 255, 0.9)" />
          <Text style={styles.warehousePillText}>{warehouseName} · Active</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 4 Metric Cards (2x2 Grid) ─── */}
        <View style={styles.metricsGrid}>
          {/* Card 1: New Requests (Matching Reference Design: CheckCircleIcon) */}
          <View style={styles.metricCard}>
            <View style={styles.metricIconWrap}>
              <CheckCircleIcon size={20} color="#8D4321" />
            </View>
            <Text style={styles.metricValue}>8</Text>
            <Text style={styles.metricLabel}>New Requests</Text>
          </View>

          {/* Card 2: Under Review (Matching Reference Design: PendingDotsIcon) */}
          <View style={styles.metricCard}>
            <View style={styles.metricIconWrap}>
              <PendingDotsIcon size={20} color="#8D4321" />
            </View>
            <Text style={styles.metricValue}>5</Text>
            <Text style={styles.metricLabel}>Under Review</Text>
          </View>

          {/* Card 3: Approved */}
          <View style={styles.metricCard}>
            <View style={styles.metricIconWrap}>
              <CheckCircleIcon size={20} color="#8D4321" />
            </View>
            <Text style={styles.metricValue}>12</Text>
            <Text style={styles.metricLabel}>Approved</Text>
          </View>

          {/* Card 4: Pending Resolution */}
          <View style={styles.metricCard}>
            <View style={styles.metricIconWrap}>
              <PendingDotsIcon size={20} color="#EF4444" />
            </View>
            <Text style={[styles.metricValue, { color: '#EF4444' }]}>3</Text>
            <Text style={styles.metricLabel}>Pending Resolution</Text>
          </View>
        </View>

        {/* ─── Issue Category Summary ─── */}
        <Text style={styles.sectionTitle}>Issue Category Summary</Text>
        <View style={styles.categoryGrid}>
          {[
            { count: '4', label: 'QUALITY' },
            { count: '2', label: 'QUANTITY' },
            { count: '1', label: 'MISSING' },
            { count: '1', label: 'WRONG' },
            { count: '3', label: 'DAMAGED' },
            { count: '2', label: 'LATE' },
          ].map((cat) => {
            const isSelected = selectedCategory === cat.label;
            return (
              <TouchableOpacity
                key={cat.label}
                style={[
                  styles.categoryBox,
                  isSelected && styles.categoryBoxSelected,
                ]}
                onPress={() => setSelectedCategory(isSelected ? null : cat.label)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryCount,
                    isSelected && { color: PALETTE.primary },
                  ]}
                >
                  {cat.count}
                </Text>
                <Text
                  style={[
                    styles.categoryLabel,
                    isSelected && { color: PALETTE.primary, fontWeight: '700' },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── Return Requests Header ─── */}
        <View style={styles.listSectionHeader}>
          <Text style={styles.sectionTitleNoMargin}>Return Requests</Text>
          <TouchableOpacity
            style={styles.historyInlineLink}
            onPress={onNavigateToHistory}
            activeOpacity={0.7}
          >
            <HistoryClockIcon size={14} color={PALETTE.primary} />
            <Text style={styles.historyInlineText}>View History →</Text>
          </TouchableOpacity>
        </View>

        {/* ─── RMA List Cards ─── */}
        <View style={styles.listContainer}>
          {filteredItems.map((item) => {
            const isDamaged = item.issueCategory === 'Damaged';
            const isQuality = item.issueCategory === 'Quality';
            const isNew = item.status === 'New';
            const isUnderReview = item.status === 'Under Review';

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.rmaCard}
                onPress={() => onSelectRma(item)}
                activeOpacity={0.8}
              >
                {/* Top Row: RMA ID + Status Badge */}
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.rmaIdText}>{item.rmaId}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      isNew && styles.statusBadgeNew,
                      isUnderReview && styles.statusBadgeUnderReview,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        isNew && styles.statusBadgeTextNew,
                        isUnderReview && styles.statusBadgeTextUnderReview,
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>

                {/* Customer Name */}
                <Text style={styles.customerNameText}>{item.customerName}</Text>

                {/* Order ID */}
                <Text style={styles.orderIdText}>{item.orderId}</Text>

                {/* Issue Tag + Quantity */}
                <View style={styles.tagQuantityRow}>
                  <View
                    style={[
                      styles.issueTag,
                      isDamaged && styles.issueTagDamaged,
                      isQuality && styles.issueTagQuality,
                    ]}
                  >
                    <Text
                      style={[
                        styles.issueTagText,
                        isDamaged && styles.issueTagTextDamaged,
                        isQuality && styles.issueTagTextQuality,
                      ]}
                    >
                      {item.issueCategory}
                    </Text>
                  </View>

                  <Text style={styles.quantityText}>{item.requestedQuantity}</Text>
                </View>

                {/* Date & Time */}
                <Text style={styles.timestampText}>{item.timestampText}</Text>
              </TouchableOpacity>
            );
          })}

          {filteredItems.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No RMA records found</Text>
            </View>
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ─── Bottom Navigation Bar (Matching Screenshot) ─── */}
      <View style={styles.bottomTabBar}>
        <Pressable
          style={styles.tabItem}
          onPress={() => onTabChange && onTabChange('Home')}
        >
          <HomeTabIcon active={false} />
          <Text style={styles.tabLabel}>Home</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => onTabChange && onTabChange('Receiving')}
        >
          <ReceivingTabIcon active={false} />
          <Text style={styles.tabLabel}>Receiving</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => onTabChange && onTabChange('Inventory')}
        >
          <InventoryTabIcon active={false} />
          <Text style={styles.tabLabel}>Inventory</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => onTabChange && onTabChange('More')}
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
    marginBottom: 8,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  bellButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warehousePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    marginTop: 2,
    gap: 6,
  },
  warehousePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  /* 4 Metric Cards Grid */
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  metricCard: {
    width: '48.5%',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  metricIconWrap: {
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: PALETTE.textInk,
    lineHeight: 28,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.textSecondary,
    marginTop: 2,
  },

  /* Issue Category Summary */
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryBox: {
    width: '31.5%',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBoxSelected: {
    borderColor: PALETTE.primary,
    backgroundColor: PALETTE.primarySoft,
  },
  categoryCount: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  categoryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: PALETTE.textSecondary,
    marginTop: 2,
    letterSpacing: 0.5,
  },

  /* Search Bar */
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: PALETTE.textInk,
    padding: 0,
  },

  /* RMA List */
  listContainer: {
    gap: 12,
  },
  rmaCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  rmaIdText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#8D4321',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
  },
  statusBadgeNew: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeUnderReview: {
    backgroundColor: '#FEF9C3',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  statusBadgeTextNew: {
    color: '#B45309',
  },
  statusBadgeTextUnderReview: {
    color: '#A16207',
  },
  customerNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 2,
  },
  orderIdText: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.textMuted,
    marginBottom: 8,
  },
  tagQuantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  issueTag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: '#FFEDD5',
  },
  issueTagDamaged: {
    backgroundColor: '#FFEDD5',
  },
  issueTagQuality: {
    backgroundColor: '#FEF3C7',
  },
  issueTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C2410C',
  },
  issueTagTextDamaged: {
    color: '#C2410C',
  },
  issueTagTextQuality: {
    color: '#B45309',
  },
  quantityText: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  timestampText: {
    fontSize: 11,
    color: PALETTE.textMuted,
    fontWeight: '500',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: PALETTE.textMuted,
    fontWeight: '600',
  },

  /* Bottom Tab Bar */
  bottomTabBar: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
    paddingBottom: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9E9690',
  },
  tabLabelActive: {
    color: PALETTE.primary,
    fontWeight: '700',
  },
  /* History Header Pill */
  historyHeaderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
    gap: 5,
  },
  historyHeaderPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  /* List Section Header */
  listSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 6,
  },
  sectionTitleNoMargin: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  historyInlineLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  historyInlineText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.primary,
  },
  /* Bottom History Card */
  bottomHistoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 10,
  },
  bottomHistoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  bottomHistoryIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomHistoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  bottomHistorySub: {
    fontSize: 11,
    color: PALETTE.textSecondary,
    marginTop: 2,
  },
});
