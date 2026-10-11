import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import {
  ScopeHeader,
  SearchBar,
  StatusBadge,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import type { WarehouseScreenBaseProps } from './types';

function SnowflakeIcon({ size = 18, color = '#1E293B' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07l14.14-14.14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M12 6l-2-2m4 0l-2 2M12 18l-2 2m4 0l-2-2M6 12l-2-2m0 4l2-2M18 12l2-2m0 4l-2-2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function StorageBoxIcon({ size = 18, color = '#1E293B' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M3 10h18M10 14h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

interface LocationItem {
  id: string;
  title: string;
  section: string;
  status: 'Occupied' | 'Empty';
  statusTone: 'danger' | 'success' | 'warning';
  stockItems?: number;
}

interface StorageGroup {
  type: string;
  icon: React.ReactNode;
  items: LocationItem[];
}

const STORAGE_GROUPS: StorageGroup[] = [
  {
    type: 'Cold Storage',
    icon: <SnowflakeIcon size={18} color="#1E293B" />,
    items: [
      {
        id: 'cs-1',
        title: 'Rack 02 · Shelf 03',
        section: 'Section A',
        status: 'Occupied',
        statusTone: 'danger',
        stockItems: 12,
      },
      {
        id: 'cs-2',
        title: 'Rack 01 · Shelf 01',
        section: 'Section A',
        status: 'Occupied',
        statusTone: 'success',
        stockItems: 6,
      },
      {
        id: 'cs-3',
        title: 'Rack 03 · Shelf 02',
        section: 'Section B',
        status: 'Empty',
        statusTone: 'danger',
      },
    ],
  },
  {
    type: 'Dry Storage',
    icon: <StorageBoxIcon size={18} color="#1E293B" />,
    items: [
      {
        id: 'ds-1',
        title: 'Rack 01 · Shelf 01',
        section: 'Section C',
        status: 'Occupied',
        statusTone: 'success',
      },
    ],
  },
];

export interface StorageLocationsScreenProps extends WarehouseScreenBaseProps {
  onSelectLocation?: ((locationId: string) => void) | undefined;
}

export function StorageLocationsScreen({ scope, onBack, onSelectLocation }: StorageLocationsScreenProps) {
  const [query, setQuery] = useState('');

  const q = query.toLowerCase().trim();

  const filteredGroups = STORAGE_GROUPS.map((group) => {
    const items = group.items.filter((item) => {
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.section.toLowerCase().includes(q) ||
        group.type.toLowerCase().includes(q)
      );
    });
    return { ...group, items };
  }).filter((group) => group.items.length > 0);

  return (
    <WalletScreen
      title="Storage Locations"
      onBack={onBack}
      headerExtra={<ScopeHeader scope={scope} label={scope.warehouseName ?? 'Coonoor Warehouse'} />}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.searchWrap}>
          <SearchBar value={query} onChangeText={setQuery} placeholder="Search location, rack, shelf" />
        </View>

        {filteredGroups.map((group) => (
          <View key={group.type} style={styles.groupContainer}>
            <View style={styles.groupHeader}>
              {group.icon}
              <Text style={styles.groupTitle}>{group.type}</Text>
            </View>

            <View style={styles.treeWrapper}>
              <View style={styles.treeLine} />
              <View style={styles.cardsColumn}>
                {group.items.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.card}
                    onPress={() => onSelectLocation?.(item.id)}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.title} ${item.section}`}
                  >
                    <View style={styles.cardTop}>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <StatusBadge label={item.status} tone={item.statusTone} />
                    </View>
                    <Text style={styles.cardSubtitle}>{item.section}</Text>
                    {item.stockItems !== undefined ? (
                      <View style={styles.stockRow}>
                        <Text style={styles.stockLabel}>Stock Items</Text>
                        <Text style={styles.stockValue}>{item.stockItems}</Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: adminSpacing.lg,
    paddingBottom: 40,
  },
  searchWrap: {
    marginBottom: adminSpacing.lg,
  },
  groupContainer: {
    marginBottom: adminSpacing.lg,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  treeWrapper: {
    flexDirection: 'row',
    position: 'relative',
  },
  treeLine: {
    width: 2,
    backgroundColor: '#E2DCD5',
    marginLeft: 8,
    marginRight: 14,
    borderRadius: 1,
  },
  cardsColumn: {
    flex: 1,
    gap: 12,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 14,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  cardSubtitle: {
    fontSize: 13,
    color: adminColors.muted,
    marginBottom: 6,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  stockLabel: {
    fontSize: 13,
    color: adminColors.muted,
  },
  stockValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
});
