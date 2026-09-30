import React, { useState } from 'react';
import {
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

const PALETTE = {
  primary: '#F0562A',
  pageBg: '#F7F5F0',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#7A726C',
  textMuted: '#9E9690',
  border: '#EBE5DC',
  greenBadgeBg: '#E8F5E9',
  greenBadgeText: '#064E3B',
  redBadgeBg: '#FEE2E2',
  redBadgeText: '#991B1B',
};

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }) {
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

function LockIcon({ size = 14, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="11" width="14" height="10" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M8 11V7a4 4 0 0 1 8 0v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = PALETTE.textSecondary }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M20 20l-4-4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function SnowflakeIcon({ size = 18, color = PALETTE.textInk }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BoxIcon({ size = 18, color = PALETTE.textInk }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <Path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface SubWarehouseStorageInfoScreenProps {
  onBack: () => void;
  onTabChange?: ((tab: 'Home' | 'Receiving' | 'Inventory' | 'More') => void) | undefined;
  onSelectLocation?: (id: string) => void;
}

const COLD_STORAGE_DATA = [
  { id: 'cs1', title: 'Rack 02 · Shelf 03', section: 'Section A', stockItems: 12, status: 'Occupied', statusType: 'red' },
  { id: 'cs2', title: 'Rack 01 · Shelf 01', section: 'Section A', stockItems: 6, status: 'Occupied', statusType: 'green' },
  { id: 'cs3', title: 'Rack 03 · Shelf 02', section: 'Section B', stockItems: 0, status: 'Empty', statusType: 'red' },
];

const DRY_STORAGE_DATA = [
  { id: 'ds1', title: 'Rack 01 · Shelf 01', section: 'Section C', stockItems: 0, status: 'Occupied', statusType: 'green' },
];

export function SubWarehouseStorageInfoScreen({
  onBack,
  onSelectLocation,
}: SubWarehouseStorageInfoScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const renderCard = (item: any) => {
    const isRed = item.statusType === 'red';
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => onSelectLocation?.(item.id)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <View style={[styles.badge, { backgroundColor: isRed ? PALETTE.redBadgeBg : PALETTE.greenBadgeBg }]}>
            <Text style={[styles.badgeText, { color: isRed ? PALETTE.redBadgeText : PALETTE.greenBadgeText }]}>
              {item.status}
            </Text>
          </View>
        </View>
        <Text style={styles.cardSectionText}>{item.section}</Text>
        {item.stockItems > 0 && (
          <View style={styles.stockInfoRow}>
            <Text style={styles.stockLabel}>Stock Items</Text>
            <Text style={styles.stockValue}>{item.stockItems}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />
      
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <ArrowBackIcon size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Storage Locations</Text>
        </View>
        <View style={styles.warehousePill}>
          <LockIcon size={13} color="#FFFFFF" />
          <Text style={styles.warehousePillText}>Coonoor Warehouse</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Search */}
        <View style={styles.searchBox}>
          <SearchIcon />
          <TextInput
            style={styles.searchInput}
            placeholder="Search location, rack, shelf"
            placeholderTextColor={PALETTE.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Cold Storage */}
        <View style={styles.sectionHeader}>
          <SnowflakeIcon />
          <Text style={styles.sectionTitle}>Cold Storage</Text>
        </View>
        <View style={styles.sectionList}>
          {COLD_STORAGE_DATA.map(renderCard)}
        </View>

        {/* Dry Storage */}
        <View style={styles.sectionHeader}>
          <BoxIcon />
          <Text style={styles.sectionTitle}>Dry Storage</Text>
        </View>
        <View style={styles.sectionList}>
          {DRY_STORAGE_DATA.map(renderCard)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PALETTE.primary },
  header: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  warehousePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginLeft: 44,
    marginTop: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  warehousePillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: PALETTE.textInk,
    padding: 0,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  sectionList: {
    gap: 12,
    paddingLeft: 14,
    borderLeftWidth: 1,
    borderColor: '#D7D0C8',
    marginLeft: 8,
    marginBottom: 16,
  },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardSectionText: {
    fontSize: 13,
    color: PALETTE.textSecondary,
    marginBottom: 12,
  },
  stockInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stockLabel: {
    fontSize: 13,
    color: PALETTE.textSecondary,
  },
  stockValue: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
});
