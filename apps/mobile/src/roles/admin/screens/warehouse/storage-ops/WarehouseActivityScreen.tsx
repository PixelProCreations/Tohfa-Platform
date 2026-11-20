import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { adminColors, adminShadow, adminSpacing } from '../../../theme';
import {
  ChipGroup,
  EmptyState,
  HeaderIconButton,
  ScopeHeader,
  SearchBar,
  StatusBadge,
  WalletScreen,
} from '../wallet-cashtopup/WalletParts';
import { StatusMetricCard } from '../../../components';
import { ACTIVITIES } from './fixtures';
import type {
  ActivityCategory,
  ActivityModule,
  ActivityPreset,
  WarehouseScreenBaseProps,
} from './types';

function SlidersIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const CATEGORY_CHIPS = [
  'All',
  'Receiving',
  'Storage',
  'Verification',
  'Material Handling',
] as const;

export const ACTIVITY_STATUS_TONE: Record<string, 'success' | 'warning' | 'danger'> = {
  Completed: 'success',
  Pending: 'warning',
  Open: 'danger',
};

export function ActivityCategoryIcon(_props?: { category?: ActivityCategory; size?: number }) {
  return null;
}

export interface WarehouseActivityScreenProps extends WarehouseScreenBaseProps {
  initialPreset?: ActivityPreset | undefined;
  onSelectActivity: (activityId: string) => void;
  onOpenModule?: ((module: ActivityModule) => void) | undefined;
  onExport?: (() => void) | undefined;
}

export function WarehouseActivityScreen({
  scope,
  onBack,
  initialPreset = 'Today',
  onSelectActivity,
}: WarehouseActivityScreenProps) {
  const isToday = initialPreset === 'Today';
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<(typeof CATEGORY_CHIPS)[number]>('All');

  // Filter activities for this warehouse and preset
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ACTIVITIES.filter((act) => {
      if (isToday && act.day !== 'Today') return false;

      const matchesCategory =
        category === 'All' ||
        act.category.toLowerCase().includes(category.toLowerCase()) ||
        (category === 'Verification' && act.category.toLowerCase().includes('verification')) ||
        (category === 'Storage' && act.category.toLowerCase().includes('storage'));

      const matchesQuery =
        !q ||
        act.title.toLowerCase().includes(q) ||
        act.subtitle.toLowerCase().includes(q) ||
        act.category.toLowerCase().includes(q);

      return matchesCategory && matchesQuery;
    });
  }, [category, query, isToday]);

  return (
    <WalletScreen
      title={isToday ? "Today's Operations" : 'Warehouse Activity'}
      subtitle={isToday ? '24 Activities · 24 Sep 2026' : undefined}
      onBack={onBack}
      headerExtra={
        <ScopeHeader
          scope={scope}
          label={scope.warehouseName ?? 'Coonoor Warehouse'}
        />
      }
      headerRight={
        <HeaderIconButton onPress={() => { }} accessibilityLabel="Filter">
          <SlidersIcon size={20} color={adminColors.onBrand} />
        </HeaderIconButton>
      }
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!isToday && (
          <View style={{ marginBottom: adminSpacing.md }}>
            <SearchBar value={query} onChangeText={setQuery} placeholder="Search activity..." />
          </View>
        )}

        {/* ─── Top 2x2 KPI Cards (reusable StatusMetricCard) ─── */}
        {isToday && (
          <View style={styles.kpiGrid}>
            <StatusMetricCard
              icon="receiving"
              value="3"
              label="RECEIVING"
              onPress={() => setCategory('Receiving')}
            />
            <StatusMetricCard
              icon="box"
              value="8"
              label="STORAGE"
              onPress={() => setCategory('Storage')}
            />
            <StatusMetricCard
              icon="check"
              value="2"
              label="VERIFICATION"
              onPress={() => setCategory('Verification')}
            />
            <StatusMetricCard
              icon="alert"
              value="3"
              label="ISSUES"
              tone="danger"
              onPress={() => setCategory('Material Handling')}
            />
          </View>
        )}

        {/* ─── Filter Chips ─── */}
        <View style={styles.chipsContainer}>
          <ChipGroup
            options={CATEGORY_CHIPS}
            value={category}
            onChange={(val) => setCategory(val as (typeof CATEGORY_CHIPS)[number])}
          />
        </View>

        {/* ─── Activity List ─── */}
        {visible.length === 0 ? (
          <EmptyState title="No activities found" subtitle="No logged warehouse activities match your search or filter." />
        ) : (
          visible.map((act) => {
            const timeText = act.when.includes('·') ? (act.when.split('·')[1]?.trim() ?? act.when) : act.when;
            const tone = ACTIVITY_STATUS_TONE[act.status] || 'success';
            return (
              <TouchableOpacity
                key={act.id}
                style={styles.card}
                onPress={() => onSelectActivity(act.id)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={`${act.title} ${act.subtitle}`}
              >
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle}>{act.title}</Text>
                  <StatusBadge label={act.status} tone={tone} />
                </View>
                <Text style={styles.cardSubtitle}>{act.subtitle}</Text>
                <Text style={styles.cardTime}>{timeText}</Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: adminSpacing.lg,
    paddingBottom: 40,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    marginBottom: 20,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '700',
    color: adminColors.ink,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: adminColors.muted,
    marginTop: 4,
    letterSpacing: 0.3,
  },
  chipsContainer: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    marginBottom: 12,
    ...adminShadow.sm,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: adminColors.ink,
  },
  cardSubtitle: {
    fontSize: 12,
    color: adminColors.muted,
    marginBottom: 6,
  },
  cardTime: {
    fontSize: 11,
    color: adminColors.muted,
    fontWeight: '500',
  },
});
