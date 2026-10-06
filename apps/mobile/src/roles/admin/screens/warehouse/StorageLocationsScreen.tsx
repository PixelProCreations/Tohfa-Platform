import React, { useState } from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
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
  badgeBg: '#FDF3F0',
  badgeText: '#7A2E14',
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

function SearchIcon({ size = 18, color = '#888888' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M20 20l-3.5-3.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export interface StorageLocationsScreenProps {
  onBack?: () => void;
  onSelectLocation?: (locationId: string) => void;
  onBrowseHierarchy?: () => void;
}

export function StorageLocationsScreen({
  onBack,
  onSelectLocation,
  onBrowseHierarchy,
}: StorageLocationsScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* Top Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          {onBack && (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
              <ArrowBackIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Storage Locations</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchBox}>
          <SearchIcon size={18} color="#888888" />
          <TextInput
            style={styles.searchInput}
            placeholder="Location name, ID, rack, shelf, bin"
            placeholderTextColor="#888888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* ─── Storage Hierarchy ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Storage Hierarchy</Text>
          <TouchableOpacity onPress={onBrowseHierarchy} activeOpacity={0.7}>
            <Text style={styles.browseLink}>Browse →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.hierarchyCard}>
          <Text style={styles.hierarchyRoot}>Coonoor</Text>
          <View style={styles.treeIndent1}>
            <Text style={styles.hierarchyBranch}>Cold Storage</Text>
            <View style={styles.treeIndent2}>
              <Text style={styles.hierarchySubBranch}>Section A</Text>
              <View style={styles.treeIndent3}>
                <Text style={styles.hierarchyLeaf}>Rack 01 → Shelf 01 / Shelf 02</Text>
                <Text style={styles.hierarchyLeaf}>Rack 02 → Shelf 01 / Shelf 02</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ─── Locations ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Locations</Text>
        </View>

        {/* Rack 02 · Shelf 03 Card */}
        <TouchableOpacity
          style={styles.locationCard}
          onPress={() => onSelectLocation?.('LOC-COO-A02-S03')}
          activeOpacity={0.8}
        >
          <View style={styles.locationTopRow}>
            <Text style={styles.locationTitle}>Rack 02 · Shelf 03</Text>
            <View style={styles.occupiedBadge}>
              <Text style={styles.occupiedBadgeText}>Occupied</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.locationStatsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Warehouse</Text>
              <Text style={styles.statValue}>Coonoor</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Stock Items</Text>
              <Text style={styles.statValue}>12</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Occupancy</Text>
              <Text style={styles.statValue}>68%</Text>
            </View>
          </View>
        </TouchableOpacity>

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
  },
  backBtn: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
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
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: PALETTE.textInk,
    paddingVertical: 0,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.orangeDeep,
  },
  browseLink: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.orangeDeep,
  },
  hierarchyCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  hierarchyRoot: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 6,
  },
  treeIndent1: {
    marginLeft: 14,
  },
  hierarchyBranch: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginBottom: 6,
  },
  treeIndent2: {
    marginLeft: 14,
  },
  hierarchySubBranch: {
    fontSize: 12.5,
    fontWeight: '600',
    color: PALETTE.textSecondary,
    marginBottom: 6,
  },
  treeIndent3: {
    marginLeft: 14,
    gap: 4,
  },
  hierarchyLeaf: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    fontWeight: '500',
  },
  locationCard: {
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
  locationTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  occupiedBadge: {
    backgroundColor: PALETTE.badgeBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  occupiedBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: PALETTE.badgeText,
  },
  divider: {
    height: 1,
    backgroundColor: PALETTE.border,
    marginVertical: 12,
  },
  locationStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCol: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
});
