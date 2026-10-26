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
import { adminColors, adminRadius, adminSpacing, adminType } from '../../theme';
import { t } from '../../i18n';
import { OverviewDashboardCard, OverviewCardsGrid } from '../../components/OverviewDashboardCard';

function BackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
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
  color = adminColors.onBrand,
  leafColor,
}: {
  size?: number;
  color?: string;
  leafColor?: string;
}) {
  const isWhite = color?.toLowerCase() === adminColors.onBrand.toLowerCase();
  const resolvedLeafColor = leafColor ?? (isWhite ? color : adminColors.muted);

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

  const filterTabs: Array<{ key: 'All' | 'Pending' | 'Approved' | 'Rejected'; label: string }> = [
    { key: 'All', label: t('farmerProduce.tab.all') },
    { key: 'Pending', label: t('farmerProduce.tab.pending') },
    { key: 'Approved', label: t('farmerProduce.tab.approved') },
    { key: 'Rejected', label: t('farmerProduce.tab.rejected') },
  ];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Terracotta Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={24} color={adminColors.onBrand} />
          </TouchableOpacity>
          <ProduceExactFruitIcon size={24} color={adminColors.onBrand} />
          <Text style={styles.headerTitle}>{t('farmerProduce.title')}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* 2x2 Summary Metric Cards (Static Display Only) */}
        <OverviewCardsGrid style={{ marginBottom: adminSpacing.md }}>
          <OverviewDashboardCard
            value="18"
            title={t('farmerProduce.kpi.totalListings')}
            subtitle="All listings"
            icon="orders"
            disabled
          />
          <OverviewDashboardCard
            value="03"
            title={t('farmerProduce.kpi.pending')}
            subtitle="Needs review"
            icon="orders"
            tone="warning"
            disabled
          />
          <OverviewDashboardCard
            value="12"
            title={t('farmerProduce.kpi.approved')}
            subtitle="Verified ready"
            icon="pickup"
            disabled
          />
          <OverviewDashboardCard
            value="03"
            title={t('farmerProduce.kpi.rejected')}
            subtitle="Needs attention"
            icon="box"
            tone="danger"
            disabled
          />
        </OverviewCardsGrid>

        {/* Filter Pills Row */}
        <View style={styles.filterPillsRow}>
          {filterTabs.map(({ key, label }) => {
            const active = selectedFilter === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.filterPill, active ? styles.filterPillActive : styles.filterPillInactive]}
                onPress={() => setSelectedFilter(key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterPillText, active ? styles.filterTextActive : styles.filterTextInactive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Produce Cards */}
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

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.2,
    marginLeft: adminSpacing.xs,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xxl,
  },

  // 2x2 KPI Grid
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.md,
    marginBottom: adminSpacing.lg,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
  },
  kpiLabel: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.muted,
    letterSpacing: 0.4,
    marginBottom: adminSpacing.xs,
  },
  kpiValueDark: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  kpiValueAmber: {
    ...adminType.rowTitle,
    color: adminColors.warning.text,
  },
  kpiValueRed: {
    ...adminType.rowTitle,
    color: adminColors.danger.text,
  },

  // Filter Pills
  filterPillsRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.lg,
  },
  filterPill: {
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.sm,
    borderRadius: adminRadius.md,
    borderWidth: 1,
  },
  filterPillActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  filterPillInactive: {
    backgroundColor: adminColors.card,
    borderColor: adminColors.border,
  },
  filterPillText: {
    ...adminType.body,
    fontWeight: '700',
  },
  filterTextActive: {
    color: adminColors.onBrand,
  },
  filterTextInactive: {
    color: adminColors.ink,
  },

  // Produce Listing Cards
  produceCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  produceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.xs,
  },
  produceName: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  produceMeta: {
    ...adminType.body,
    color: adminColors.muted,
  },

  // Badges
  statusBadge: {
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 4,
    borderRadius: adminRadius.sm,
  },
  statusBadgeText: {
    ...adminType.caption,
    fontWeight: '800',
  },
  badgePending: {
    backgroundColor: adminColors.warning.bg,
  },
  textPending: {
    color: adminColors.warning.text,
  },
  badgeApproved: {
    backgroundColor: adminColors.success.bg,
  },
  textApproved: {
    color: adminColors.success.text,
  },
  badgeRejected: {
    backgroundColor: adminColors.danger.bg,
  },
  textRejected: {
    color: adminColors.danger.text,
  },
  bottomSpacer: {
    height: adminSpacing.xxl,
  },
});
