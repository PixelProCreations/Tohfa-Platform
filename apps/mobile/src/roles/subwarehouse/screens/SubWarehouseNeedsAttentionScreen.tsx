import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// ─── Design Tokens (#F0562A Brand Palette) ──────────────────────────────────
const PALETTE = {
  primary:       '#F0562A',
  primaryDark:   '#D4451B',
  primaryLight:  '#FFF0EB',
  primarySoft:   '#FEF1EC',
  primaryBorder: '#FCD9CE',

  pageBg:        '#FAF7F2',
  cardBg:        '#FFFFFF',
  textInk:       '#1E1612',
  textSecondary: '#6B7280',
  textMuted:     '#9CA3AF',
  border:        '#E5E0D8',
  divider:       '#F3EFEA',

  amberText:     '#B45309',
  amberBg:       '#FEF3C7',
  amberBorder:   '#F59E0B',

  redText:       '#DC2626',
  redBg:         '#FEE2E2',
  redBorder:     '#EF4444',

  greenText:     '#15803D',
  greenBg:       '#DCFCE7',
  greenBorder:   '#22C55E',

  blueText:      '#1D4ED8',
  blueBg:        '#DBEAFE',

  tabBorder:     '#EAE4DB',
};

type IssueCategory = 'all' | 'payment_pending' | 'stock_issue' | 'failed_sale' | 'invoice_issue';

interface AttentionItem {
  id: string;
  category: 'payment_pending' | 'stock_issue' | 'failed_sale' | 'invoice_issue';
  title: string;
  customer: string;
  channel: string;
  amount: string;
  time: string;
  note: string;
  primaryAction: string;
  secondaryAction?: string;
  resolved?: boolean;
}

const INITIAL_ITEMS: AttentionItem[] = [
  {
    id: 'SALE-00248',
    category: 'payment_pending',
    title: 'Payment Pending',
    customer: 'Suresh Kumar · 3 Items',
    channel: 'Direct Sale',
    amount: '₹1,200',
    time: 'Today · 4:15 PM',
    note: 'Customer took items; cashier awaiting cash collection / UPI confirmation.',
    primaryAction: 'Collect Cash',
    secondaryAction: 'Send UPI Link',
  },
  {
    id: 'SALE-00249',
    category: 'payment_pending',
    title: 'Payment Pending',
    customer: 'Hotel Nilgiri Grand · 12 Crates',
    channel: 'HORECA Sale',
    amount: '₹3,400',
    time: 'Today · 10:30 AM',
    note: 'Produce delivered to kitchen; credit invoice awaiting signoff.',
    primaryAction: 'Record Bank Transfer',
    secondaryAction: 'Send Reminder',
  },
  {
    id: 'SALE-00250',
    category: 'stock_issue',
    title: 'Stock Discrepancy',
    customer: 'Green Mart · 50 kg Carrot',
    channel: 'Market Day Sale',
    amount: '₹2,100',
    time: 'Today · 1:45 PM',
    note: 'Batch #CRT-104 is short by 10 kg due to sorting spoilage in sorting area.',
    primaryAction: 'Reallocate from Batch #CRT-105',
    secondaryAction: 'Adjust Qty to 40 kg',
  },
  {
    id: 'SALE-00245',
    category: 'failed_sale',
    title: 'Payment Failed',
    customer: 'Ramesh G · 1 Item',
    channel: 'Direct Sale',
    amount: '₹850',
    time: 'Today · 11:15 AM',
    note: 'UPI gateway timed out after customer QR scan at checkout terminal.',
    primaryAction: 'Retry Payment',
    secondaryAction: 'Switch to Cash',
  },
  {
    id: 'INV-2026-089',
    category: 'invoice_issue',
    title: 'Invoice Review Needed',
    customer: 'Nilgiri Organic Spices Co.',
    channel: 'B2B Sale',
    amount: '₹4,800',
    time: 'Today · 9:00 AM',
    note: 'GSTIN validation mismatch on buyer profile. Reverse charge check required.',
    primaryAction: 'Approve & Issue Invoice',
    secondaryAction: 'Edit Tax Details',
  },
];

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

function WarningTriangleIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 9v4M12 17h.01" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function MoneyIcon({ size = 20, color = '#D97706' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="12" rx="2" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
      <Path d="M6 12h.01M18 12h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function StockBoxIcon({ size = 20, color = '#EF4444' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <Path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ExclamationCircleIcon({ size = 20, color = '#DC2626' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 8v4M12 16h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function InvoiceDocumentIcon({ size = 20, color = '#D97706' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckCircleIcon({ size = 18, color = '#15803D' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M8 12l3 3 5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface SubWarehouseNeedsAttentionScreenProps {
  initialCategory?: IssueCategory;
  onBack: () => void;
}

export function SubWarehouseNeedsAttentionScreen({
  initialCategory = 'all',
  onBack,
}: SubWarehouseNeedsAttentionScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<IssueCategory>(initialCategory);
  const [items, setItems] = useState<AttentionItem[]>(INITIAL_ITEMS);

  const filteredItems = items.filter((item) => {
    if (selectedCategory === 'all') return true;
    return item.category === selectedCategory;
  });

  const activeCount = items.filter((i) => !i.resolved).length;

  const handleResolveAction = (item: AttentionItem, actionName: string) => {
    Alert.alert(
      actionName,
      `Execute "${actionName}" for ${item.id} (${item.customer})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'default',
          onPress: () => {
            setItems((prev) =>
              prev.map((i) => (i.id === item.id ? { ...i, resolved: true } : i))
            );
            Alert.alert('Action Completed', `Issue for ${item.id} has been resolved successfully.`);
          },
        },
      ]
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'payment_pending':
        return <MoneyIcon size={20} color="#D97706" />;
      case 'stock_issue':
        return <StockBoxIcon size={20} color="#EF4444" />;
      case 'failed_sale':
        return <ExclamationCircleIcon size={20} color="#DC2626" />;
      case 'invoice_issue':
        return <InvoiceDocumentIcon size={20} color="#D97706" />;
      default:
        return <WarningTriangleIcon size={20} color="#D97706" />;
    }
  };

  const getCategoryBorderColor = (category: string) => {
    switch (category) {
      case 'payment_pending':
        return '#D97706';
      case 'stock_issue':
        return '#EF4444';
      case 'failed_sale':
        return '#DC2626';
      case 'invoice_issue':
        return '#D97706';
      default:
        return '#D47018';
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Header Banner ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTitleRow}>
            <WarningTriangleIcon size={22} color="#FFFFFF" />
            <Text style={styles.headerTitleText}>Needs Attention</Text>
          </View>

          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{activeCount} Active</Text>
          </View>
        </View>

        <Text style={styles.headerSubtitle}>
          Coonoor Warehouse · Sales & Order Resolution Queue
        </Text>
      </View>

      {/* ─── Filter Categories Tab Scroll ─── */}
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <TouchableOpacity
            style={[styles.filterChip, selectedCategory === 'all' && styles.filterChipActive]}
            onPress={() => setSelectedCategory('all')}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedCategory === 'all' && styles.filterChipTextActive,
              ]}
            >
              All ({items.filter((i) => !i.resolved).length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedCategory === 'payment_pending' && styles.filterChipActive,
            ]}
            onPress={() => setSelectedCategory('payment_pending')}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedCategory === 'payment_pending' && styles.filterChipTextActive,
              ]}
            >
              Payment Pending (2)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedCategory === 'stock_issue' && styles.filterChipActive,
            ]}
            onPress={() => setSelectedCategory('stock_issue')}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedCategory === 'stock_issue' && styles.filterChipTextActive,
              ]}
            >
              Stock Issue (1)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedCategory === 'failed_sale' && styles.filterChipActive,
            ]}
            onPress={() => setSelectedCategory('failed_sale')}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedCategory === 'failed_sale' && styles.filterChipTextActive,
              ]}
            >
              Failed Sale (1)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedCategory === 'invoice_issue' && styles.filterChipActive,
            ]}
            onPress={() => setSelectedCategory('invoice_issue')}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedCategory === 'invoice_issue' && styles.filterChipTextActive,
              ]}
            >
              Invoice Issue (1)
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* ─── Issue List ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <CheckCircleIcon size={44} color="#15803D" />
            <Text style={styles.emptyTitle}>All Issues Resolved!</Text>
            <Text style={styles.emptySub}>
              There are no pending alerts in this category right now.
            </Text>
          </View>
        ) : (
          filteredItems.map((item) => {
            const isResolved = item.resolved;
            const borderColor = getCategoryBorderColor(item.category);

            return (
              <View
                key={item.id}
                style={[
                  styles.card,
                  { borderLeftColor: isResolved ? '#22C55E' : borderColor },
                  isResolved && styles.cardResolved,
                ]}
              >
                {/* Card Top Row */}
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View style={styles.iconCircle}>{getCategoryIcon(item.category)}</View>
                    <View>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <Text style={styles.cardId}>
                        {item.id} · {item.channel}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardHeaderRight}>
                    <Text style={styles.cardAmount}>{item.amount}</Text>
                    {isResolved ? (
                      <View style={styles.resolvedBadge}>
                        <Text style={styles.resolvedBadgeText}>Resolved</Text>
                      </View>
                    ) : (
                      <Text style={styles.cardTime}>{item.time}</Text>
                    )}
                  </View>
                </View>

                {/* Customer & Issue Note */}
                <View style={styles.cardBody}>
                  <Text style={styles.customerText}>Customer: {item.customer}</Text>
                  <View style={styles.noteBox}>
                    <Text style={styles.noteText}>{item.note}</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                {!isResolved && (
                  <View style={styles.cardActions}>
                    {item.secondaryAction && (
                      <TouchableOpacity
                        style={styles.secondaryBtn}
                        onPress={() => handleResolveAction(item, item.secondaryAction!)}
                        activeOpacity={0.75}
                      >
                        <Text style={styles.secondaryBtnText}>{item.secondaryAction}</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={styles.primaryBtn}
                      onPress={() => handleResolveAction(item, item.primaryAction)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.primaryBtnText}>{item.primaryAction}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}

        <View style={{ height: 32 }} />
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
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitleText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  headerBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.88)',
    fontWeight: '500',
    marginTop: 2,
    marginLeft: 4,
  },
  filterBar: {
    backgroundColor: PALETTE.pageBg,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.divider,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  filterChipActive: {
    backgroundColor: PALETTE.primary,
    borderColor: PALETTE.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderLeftWidth: 4,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardResolved: {
    opacity: 0.65,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: PALETTE.pageBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  cardId: {
    fontSize: 11,
    color: PALETTE.textSecondary,
    fontWeight: '500',
    marginTop: 1,
  },
  cardHeaderRight: {
    alignItems: 'flex-end',
  },
  cardAmount: {
    fontSize: 17,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  cardTime: {
    fontSize: 11,
    color: PALETTE.textMuted,
    fontWeight: '500',
    marginTop: 2,
  },
  resolvedBadge: {
    backgroundColor: PALETTE.greenBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 3,
  },
  resolvedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: PALETTE.greenText,
  },
  cardBody: {
    marginBottom: 12,
  },
  customerText: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.textInk,
    marginBottom: 6,
  },
  noteBox: {
    backgroundColor: '#FAF5EE',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EFE7DA',
  },
  noteText: {
    fontSize: 12,
    color: '#574C43',
    lineHeight: 17,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: PALETTE.divider,
    paddingTop: 12,
  },
  secondaryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: PALETTE.cardBg,
  },
  secondaryBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.textSecondary,
  },
  primaryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: PALETTE.primary,
  },
  primaryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginTop: 14,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: PALETTE.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
