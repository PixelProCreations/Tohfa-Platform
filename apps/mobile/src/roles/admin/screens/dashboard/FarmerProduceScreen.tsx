import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { adminColors } from '../../theme';

// ─── Theme Colors ────────────────────────────────────────────────────────────
const THEME = {
  headerBg: adminColors.brand, // Matches Purchases screen & theme primary (#F0562A)
  white: adminColors.onBrand,
  canvas: adminColors.canvas,
  card: adminColors.card,
  border: adminColors.border,
  ink: adminColors.ink,
  muted: adminColors.muted,
  labelMuted: '#78716C',
  brandOrange: adminColors.brand,
  amberText: '#B45309',
  amberBg: '#FEF3C7',
  redText: '#DC2626',
  greenText: '#15803D',
  greenBg: '#EAF7EE',
};

function BackArrowIcon({ size = 22, color = THEME.white }: { size?: number; color?: string }) {
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

function ProduceExactFruitIcon({
  size = 22,
  color = THEME.white,
  leafColor,
}: {
  size?: number;
  color?: string;
  leafColor?: string;
}) {
  const isWhite = color?.toLowerCase() === '#ffffff' || color?.toLowerCase() === '#fff';
  const resolvedLeafColor = leafColor ?? (isWhite ? color : '#5C6B63');

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="14" r="5.8" stroke={color} strokeWidth="2.2" />
      <Path
        d="M12 8.2c.3-1.8 1.1-3 2.3-3.6"
        stroke={resolvedLeafColor}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Path
        d="M11.8 8.2C11.6 5.8 9.6 4.2 7.8 4.8c-.3 2.1 1.5 3.6 4 3.4z"
        fill={resolvedLeafColor}
      />
    </Svg>
  );
}

export interface ProduceListingItem {
  id: string;
  name: string;
  grade: string;
  quantity: string;
  pricePerKg: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  statusLabel: string;
}

export interface FarmerProduceScreenProps {
  farmerName?: string;
  farmerId?: string;
  onBack: () => void;
}

export function FarmerProduceScreen({
  farmerName = 'Ramesh Kumar',
  farmerId = 'FR-00124',
  onBack,
}: FarmerProduceScreenProps) {
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');

  const listings: ProduceListingItem[] = [
    {
      id: 'prod-1',
      name: 'Tomato',
      grade: 'Grade 1',
      quantity: '50 KG',
      pricePerKg: '₹100/KG',
      status: 'Pending',
      statusLabel: 'Pending Review',
    },
    {
      id: 'prod-2',
      name: 'Carrot',
      grade: 'Grade 2',
      quantity: '80 KG',
      pricePerKg: '₹70/KG',
      status: 'Approved',
      statusLabel: 'Approved',
    },
    {
      id: 'prod-3',
      name: 'Beans',
      grade: 'Grade 1',
      quantity: '75 KG',
      pricePerKg: '₹95/KG',
      status: 'Approved',
      statusLabel: 'Approved',
    },
    {
      id: 'prod-4',
      name: 'Onion',
      grade: 'Grade 3',
      quantity: '120 KG',
      pricePerKg: '₹40/KG',
      status: 'Rejected',
      statusLabel: 'Rejected',
    },
  ];

  const filteredListings = useMemo(() => {
    if (selectedFilter === 'All') return listings;
    return listings.filter((item) => item.status === selectedFilter);
  }, [listings, selectedFilter]);

  const filterTabs: Array<'All' | 'Pending' | 'Approved' | 'Rejected'> = [
    'All',
    'Pending',
    'Approved',
    'Rejected',
  ];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

      {/* Terracotta Header: ← Farmer Produce */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={24} color={THEME.white} />
          </TouchableOpacity>
          <ProduceExactFruitIcon size={24} color={THEME.white} />
          <Text style={[styles.headerTitle, { marginLeft: 8 }]}>Farmer Produce</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* 2x2 Summary Metric Cards Matching Mockup 1 */}
        <View style={styles.kpiGrid}>
          {/* TOTAL LISTINGS */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>TOTAL LISTINGS</Text>
            <Text style={styles.kpiValueDark}>18</Text>
          </View>

          {/* PENDING */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>PENDING</Text>
            <Text style={styles.kpiValueAmber}>03</Text>
          </View>

          {/* APPROVED */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>APPROVED</Text>
            <Text style={styles.kpiValueDark}>12</Text>
          </View>

          {/* REJECTED */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>REJECTED</Text>
            <Text style={styles.kpiValueRed}>03</Text>
          </View>
        </View>

        {/* Filter Pills Row: All, Pending, Approved, Rejected */}
        <View style={styles.filterPillsRow}>
          {filterTabs.map((tab) => {
            const active = selectedFilter === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.filterPill, active ? styles.filterPillActive : styles.filterPillInactive]}
                onPress={() => setSelectedFilter(tab)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterPillText, active ? styles.filterTextActive : styles.filterTextInactive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Produce Cards Matching Mockup 1 */}
        {filteredListings.map((prod) => {
          const isPending = prod.status === 'Pending';
          const isApproved = prod.status === 'Approved';
          const isRejected = prod.status === 'Rejected';

          return (
            <View key={prod.id} style={styles.produceCard}>
              <View style={styles.produceHeaderRow}>
                <Text style={styles.produceName}>{prod.name}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    isPending && styles.badgePending,
                    isApproved && styles.badgeApproved,
                    isRejected && styles.badgeRejected,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      isPending && styles.textPending,
                      isApproved && styles.textApproved,
                      isRejected && styles.textRejected,
                    ]}
                  >
                    {prod.statusLabel}
                  </Text>
                </View>
              </View>
              <Text style={styles.produceMeta}>
                {prod.grade} · {prod.quantity} · {prod.pricePerKg}
              </Text>
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.canvas,
  },
  header: {
    backgroundColor: THEME.headerBg,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.white,
    letterSpacing: -0.2,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },

  // 2x2 KPI Grid
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: THEME.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  kpiLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: THEME.labelMuted,
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  kpiValueDark: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.ink,
  },
  kpiValueAmber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#D97706',
  },
  kpiValueRed: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.redText,
  },

  // Filter Pills
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterPillActive: {
    backgroundColor: THEME.brandOrange,
    borderColor: THEME.brandOrange,
  },
  filterPillInactive: {
    backgroundColor: THEME.card,
    borderColor: THEME.border,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  filterTextActive: {
    color: THEME.white,
  },
  filterTextInactive: {
    color: THEME.ink,
  },

  // Produce Listing Cards
  produceCard: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  produceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  produceName: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.ink,
  },
  produceMeta: {
    fontSize: 13,
    color: THEME.muted,
  },

  // Badges
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
  },
  textPending: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '800',
  },
  badgeApproved: {
    backgroundColor: THEME.greenBg,
  },
  textApproved: {
    color: THEME.greenText,
    fontSize: 12,
    fontWeight: '800',
  },
  badgeRejected: {
    backgroundColor: '#FEE2E2',
  },
  textRejected: {
    color: THEME.redText,
    fontSize: 12,
    fontWeight: '800',
  },

  // Disclaimer
  disclaimerCard: {
    backgroundColor: THEME.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 6,
  },
  disclaimerText: {
    fontSize: 12.5,
    color: '#6B7280',
    lineHeight: 18,
  },
});
