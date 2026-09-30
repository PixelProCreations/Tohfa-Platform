import React, { useState } from 'react';
import {
  Alert,
  Platform,
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

import {
  SubWarehouseTopUpDetailsScreen,
  type TopUpDetailsData,
} from './SubWarehouseTopUpDetailsScreen';

const PALETTE = {
  primary:       '#F0562A',
  primaryDark:   '#D4451B',
  pageBg:        '#FAF7F2',
  cardBg:        '#FFFFFF',
  textInk:       '#1E1612',
  textSecondary: '#6B7280',
  textMuted:     '#9CA3AF',
  border:        '#EBE5DC',
  divider:       '#F4EFE9',

  greenBadge:    '#DCFCE7',
  greenText:     '#15803D',
  amberBadge:    '#FEF3C7',
  amberText:     '#B45309',
  brownCode:     '#92400E',

  tabInactive:   '#827A74',
  tabBorder:     '#EAE4DB',
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

function SlidersIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth="2" />
      <Path d="M21 21l-4.35-4.35" stroke={color} strokeWidth="2" strokeLinecap="round" />
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

export interface SubWarehouseTopUpHistoryScreenProps {
  onBack?: () => void;
  onTabChange?: (tab: 'Home' | 'Receiving' | 'Inventory' | 'More') => void;
  onSelectTransaction?: (tx: TopUpDetailsData) => void;
}

export function SubWarehouseTopUpHistoryScreen({
  onBack,
  onTabChange,
  onSelectTransaction,
}: SubWarehouseTopUpHistoryScreenProps) {
  const [selectedTx, setSelectedTx] = useState<TopUpDetailsData | null>(null);
  const [search, setSearch] = useState('');
  const [itemsCount, setItemsCount] = useState(2);

  const transactions = [
    {
      id: 'WT-20260925-001245',
      customer: 'Ravi Kumar · CUS-001245',
      fiscalTag: 'FC-20260925-0012',
      amount: '₹2,000',
      date: '25 Sep 2026',
      time: '10:42 AM',
      status: 'Completed',
    },
    {
      id: 'WT-20260925-001238',
      customer: 'Priya Stores · CUS-00152',
      fiscalTag: 'FC-20260925-0009',
      amount: '₹1,000',
      date: '25 Sep 2026',
      time: '09:15 AM',
      status: 'Pending',
    },
    {
      id: 'WT-20260925-001220',
      customer: 'Anand Kumar · CUS-00188',
      fiscalTag: 'FC-20260925-0004',
      amount: '₹5,000',
      date: '25 Sep 2026',
      time: '08:30 AM',
      status: 'Completed',
    },
    {
      id: 'WT-20260924-001198',
      customer: 'Mani Fresh Produce · CUS-00094',
      fiscalTag: 'FC-20260924-0021',
      amount: '₹3,500',
      date: '24 Sep 2026',
      time: '05:10 PM',
      status: 'Completed',
    },
  ];

  const filtered = transactions
    .slice(0, itemsCount)
    .filter(
      (tx) =>
        tx.id.toLowerCase().includes(search.toLowerCase()) ||
        tx.customer.toLowerCase().includes(search.toLowerCase()) ||
        tx.fiscalTag.toLowerCase().includes(search.toLowerCase())
    );

  if (selectedTx) {
    return (
      <SubWarehouseTopUpDetailsScreen
        details={selectedTx}
        onBack={() => setSelectedTx(null)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Top-Up History</Text>
        </View>

        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => Alert.alert('Filter', 'Filter by Date, Amount range or Status.')}
          activeOpacity={0.8}
        >
          <SlidersIcon size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Metric Cards Row */}
        <View style={styles.metricRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricNumber}>24</Text>
            <Text style={styles.metricLabel}>TODAY</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricNumber}>186</Text>
            <Text style={styles.metricLabel}>THIS MONTH</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={[styles.metricNumber, { fontSize: 16 }]}>₹1,42,500</Text>
            <Text style={styles.metricLabel}>CASH COLLECTED</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} color={PALETTE.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Customer ID / Transaction ID / Fiscal Tag"
            placeholderTextColor={PALETTE.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Transactions List */}
        <View style={styles.txList}>
          {filtered.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.txCard}
              onPress={() => {
                const details: TopUpDetailsData = {
                  customerName: item.customer.split(' · ')[0] || 'Ravi Kumar',
                  customerId: item.customer.split(' · ')[1] || 'CUS-001245',
                  previousBalance: '₹2,500',
                  topUpAmount: item.amount,
                  newBalance: '₹4,500',
                  transactionId: item.id,
                  status: item.status,
                  type: 'Cash Top-Up',
                  fiscalCashTag: item.fiscalTag,
                  dateTime: `${item.date}, ${item.time}`,
                  createdBy: 'SWA – Suresh',
                  createdAt: `${item.date}, ${item.time}`,
                  warehouse: 'Coonoor',
                };
                if (onSelectTransaction) onSelectTransaction(details);
                else setSelectedTx(details);
              }}
              activeOpacity={0.75}
            >
              <View style={styles.txTopRow}>
                <Text style={styles.txIdText}>{item.id}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    item.status === 'Completed'
                      ? styles.badgeCompleted
                      : styles.badgePending,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      item.status === 'Completed'
                        ? styles.textCompleted
                        : styles.textPending,
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>

              <Text style={styles.txCustomerText}>{item.customer}</Text>

              <View style={styles.txMiddleRow}>
                <Text style={styles.txFiscalTag}>Fiscal Tag: {item.fiscalTag}</Text>
                <Text style={styles.txAmountText}>{item.amount}</Text>
              </View>

              <View style={styles.txBottomRow}>
                <Text style={styles.txDateText}>{item.date}</Text>
                <Text style={styles.txTimeText}>{item.time}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Load More Link */}
        {itemsCount < transactions.length && (
          <TouchableOpacity
            style={styles.loadMoreBtn}
            onPress={() => setItemsCount((c) => Math.min(c + 2, transactions.length))}
            activeOpacity={0.7}
          >
            <Text style={styles.loadMoreText}>Load More ↓</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Bottom Tab Bar */}
      <View style={styles.bottomTabBar}>
        <Pressable
          style={styles.tabItem}
          onPress={() => onTabChange ? onTabChange('Home') : (onBack && onBack())}
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  header: {
    backgroundColor: PALETTE.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 6,
    paddingBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  metricCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  metricNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  metricLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: PALETTE.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 6,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 14,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    color: PALETTE.textInk,
  },
  txList: {
    gap: 12,
  },
  txCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  txTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txIdText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.brownCode,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeCompleted: {
    backgroundColor: PALETTE.greenBadge,
  },
  badgePending: {
    backgroundColor: PALETTE.amberBadge,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  textCompleted: {
    color: PALETTE.greenText,
  },
  textPending: {
    color: PALETTE.amberText,
  },
  txCustomerText: {
    fontSize: 12.5,
    fontWeight: '500',
    color: PALETTE.textSecondary,
    marginTop: 4,
  },
  txMiddleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  txFiscalTag: {
    fontSize: 12,
    color: PALETTE.textSecondary,
  },
  txAmountText: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  txBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  txDateText: {
    fontSize: 11.5,
    color: PALETTE.textSecondary,
  },
  txTimeText: {
    fontSize: 11.5,
    color: PALETTE.textSecondary,
  },
  loadMoreBtn: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadMoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.brownCode,
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.tabBorder,
    paddingVertical: 7,
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
