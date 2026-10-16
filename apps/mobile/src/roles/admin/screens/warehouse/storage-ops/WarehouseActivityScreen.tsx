import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { adminColors, adminSpacing, adminType } from '../../../theme';
import {
  ChipGroup,
  EmptyState,
  ScopeHeader,
  SearchBar,
  StatusBadge,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { STORAGE_WAREHOUSES } from './fixtures';
import type {
  ActivityCategory,
  ActivityModule,
  ActivityPreset,
  ActivityStatus,
  WarehouseScreenBaseProps,
} from './types';

const CATEGORY_CHIPS = [
  'All',
  'Receiving',
  'Storage',
  'Material Handling',
  'Stock Verification',
  'Staff',
] as const;

export const ACTIVITY_STATUS_TONE: Record<string, 'success' | 'warning' | 'danger'> = {
  Completed: 'success',
  Pending: 'warning',
  Open: 'danger',
};

export function ActivityCategoryIcon(_props?: { category?: ActivityCategory; size?: number }) {
  return null;
}

interface ActivityRecord {
  id: string;
  title: string;
  category: ActivityCategory;
  status: ActivityStatus;
  subtitle: string;
  when: string;
}

const DEFAULT_ACTIVITIES: ActivityRecord[] = [
  {
    id: 'ACT-004822',
    title: 'Storage Activity',
    category: 'Storage',
    status: 'Completed',
    subtitle: 'Tomato moved to Cold Storage · Rack 02',
    when: 'Today · 10:42 AM',
  },
  {
    id: 'ACT-004821',
    title: 'Material Handling',
    category: 'Material Handling',
    status: 'Completed',
    subtitle: 'Packaging Box issued · 20 units',
    when: 'Today · 09:50 AM',
  },
  {
    id: 'ACT-004820',
    title: 'Receiving',
    category: 'Receiving',
    status: 'Completed',
    subtitle: 'GRN-00291 · Tomato · 140 KG',
    when: 'Today · 10:42 AM',
  },
];

export interface WarehouseActivityScreenProps extends WarehouseScreenBaseProps {
  initialPreset?: ActivityPreset | undefined;
  onSelectActivity: (activityId: string) => void;
  onOpenModule?: ((module: ActivityModule) => void) | undefined;
  onExport?: (() => void) | undefined;
}

export function WarehouseActivityScreen({
  scope,
  onBack,
  initialPreset: _initialPreset,
  onSelectActivity,
  onOpenModule: _onOpenModule,
  onExport: _onExport,
}: WarehouseActivityScreenProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<(typeof CATEGORY_CHIPS)[number]>('All');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DEFAULT_ACTIVITIES.filter((act) => {
      const matchesCategory =
        category === 'All' ||
        act.category === category ||
        (category === 'Stock Verification' && act.category === 'Verification');
      const matchesQuery =
        !q ||
        act.title.toLowerCase().includes(q) ||
        act.subtitle.toLowerCase().includes(q) ||
        act.category.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  return (
    <WalletScreen
      title="Warehouse Activity"
      onBack={onBack}
      headerExtra={
        <ScopeHeader
          scope={scope}
          label={scope.warehouseName ?? 'Coonoor Warehouse'}
          warehouseOptions={STORAGE_WAREHOUSES}
        />
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.searchWrap}>
          <SearchBar value={query} onChangeText={setQuery} placeholder="Search activity" />
        </View>

        <View style={styles.chipsContainer}>
          <ChipGroup options={CATEGORY_CHIPS} value={category} onChange={setCategory} />
        </View>

        {visible.length === 0 ? (
          <EmptyState title="No activities found" subtitle="No logged warehouse activities match your search or filter." />
        ) : (
          visible.map((act) => (
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
                <StatusBadge label={act.status} tone="success" />
              </View>
              <Text style={styles.cardSubtitle}>{act.subtitle}</Text>
              <Text style={styles.cardTime}>{act.when}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  chipsContainer: {
    marginBottom: adminSpacing.lg,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 14,
    marginBottom: 10,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  cardSubtitle: {
    ...adminType.body,
    color: adminColors.muted,
    marginBottom: 4,
  },
  cardTime: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
});
