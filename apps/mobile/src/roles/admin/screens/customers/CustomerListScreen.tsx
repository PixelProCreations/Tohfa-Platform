import React from 'react';
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
import Svg, { Circle, Path } from 'react-native-svg';

const PALETTE = {
  primary: '#F0562A',
  headerBg: '#F0562A',
  pageBg: '#F3EFE9',
  cardBg: '#FFFFFF',
  border: '#EEDCD3',
  textInk: '#1A1A1A',
  textSecondary: '#5F5E5A',
  orangeDeep: '#7A2E14',
  greenBg: '#EAF3DE',
  greenText: '#1E8E5A',
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

function UsersGroupIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path
        d="M23 21v-2a4 4 0 0 0-3-3.87"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 3.13a4 4 0 0 1 0 7.75"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = '#888888' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M20 20l-3.5-3.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export interface CustomerItem {
  id: string;
  name: string;
  phone: string;
  status: 'Active' | 'Inactive';
  ordersCount: number;
  purchasesAmount: string;
  warehouse: string;
}

export interface CustomerListScreenProps {
  onBack?: () => void;
  onOpenSearch?: () => void;
  onSearchPress?: () => void;
  onFilterPress?: () => void;
  onSelectCustomer?: (customer?: CustomerItem) => void;
}

export const SAMPLE_CUSTOMERS: CustomerItem[] = [
  {
    id: 'CUS-001245',
    name: 'Rajesh Kumar',
    phone: '+91 XXXXX XXXXX',
    status: 'Active',
    ordersCount: 12,
    purchasesAmount: '₹8,450',
    warehouse: 'Coonoor',
  },
  {
    id: 'CUS-001246',
    name: 'Anand Verma',
    phone: '+91 98451 22340',
    status: 'Active',
    ordersCount: 8,
    purchasesAmount: '₹6,120',
    warehouse: 'Ooty',
  },
  {
    id: 'CUS-001247',
    name: 'Priya Sundaram',
    phone: '+91 97410 88921',
    status: 'Active',
    ordersCount: 15,
    purchasesAmount: '₹11,350',
    warehouse: 'Coonoor',
  },
];

export function CustomerListScreen({
  onBack,
  onOpenSearch,
  onSearchPress,
  onFilterPress,
  onSelectCustomer,
}: CustomerListScreenProps) {
  const handleSearch = onSearchPress || onOpenSearch;
  const handleFilter = onFilterPress || onOpenSearch;
  const KPIS = [
    { label: 'TOTAL CUSTOMERS', value: '1,248' },
    { label: 'ACTIVE', value: '1,102' },
    { label: 'WITH ORDERS', value: '864' },
    { label: 'WITH ISSUES', value: '23' },
  ];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleWrap}>
            {onBack && (
              <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
                <ArrowBackIcon size={22} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <UsersGroupIcon size={22} color="#FFFFFF" />
            <Text style={styles.headerTitle}>Customers</Text>
          </View>
          <TouchableOpacity
            style={styles.searchHeaderBtn}
            onPress={onOpenSearch}
            activeOpacity={0.8}
          >
            <SearchIcon size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* 4 KPI Cards (2 cols x 2 rows) */}
        <View style={styles.kpiGrid}>
          {KPIS.map((item, idx) => (
            <View key={idx} style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>{item.label}</Text>
              <Text style={styles.kpiValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Search Bar Input */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={onOpenSearch}
          activeOpacity={0.8}
        >
          <SearchIcon size={18} color="#888888" />
          <Text style={styles.searchPlaceholder}>Search by name, Customer ID or mobile</Text>
        </TouchableOpacity>

        {/* Customer Cards List */}
        <View style={styles.customersList}>
          {SAMPLE_CUSTOMERS.map((cust) => (
            <TouchableOpacity
              key={cust.id}
              style={styles.customerCard}
              onPress={() => onSelectCustomer?.(cust)}
              activeOpacity={0.8}
            >
              <View style={styles.cardTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.customerName}>{cust.name}</Text>
                  <Text style={styles.customerSub}>
                    {cust.id} · {cust.phone}
                  </Text>
                </View>
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>{cust.status}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.cardBottomRow}>
                <Text style={styles.statsText}>
                  Orders {cust.ordersCount} · Purchases {cust.purchasesAmount}
                </Text>
                <Text style={styles.warehouseText}>{cust.warehouse}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.headerBg,
  },
  headerBanner: {
    backgroundColor: PALETTE.headerBg,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 10,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    marginRight: 4,
    padding: 2,
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  searchHeaderBtn: {
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
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14, // LG 14px from Design System PDF
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  kpiLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: PALETTE.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
    textAlign: 'left',
  },
  kpiValue: {
    fontSize: 19,
    fontWeight: '800', // Bold in all dashboards
    color: PALETTE.textInk,
    lineHeight: 24,
    letterSpacing: -0.3,
    textAlign: 'left',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12, // MD 12px from Design System PDF
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  searchPlaceholder: {
    fontSize: 13.5,
    color: '#888888',
  },
  customersList: {
    gap: 12,
  },
  customerCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  customerName: {
    fontSize: 15.5,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 3,
  },
  customerSub: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    fontWeight: '500',
  },
  activeBadge: {
    backgroundColor: PALETTE.greenBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: PALETTE.greenText,
  },
  divider: {
    height: 1,
    backgroundColor: PALETTE.border,
    marginVertical: 12,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  warehouseText: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    fontWeight: '500',
  },
});
