import React, { useState } from 'react';
import {
  Alert,
  Modal,
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
import Svg, { Circle, Path, Rect } from 'react-native-svg';

const PALETTE = {
  primary: '#F0562A', // Brand Orange
  primaryDark: '#D8451B',
  primarySoft: '#FDF1EB',
  headerBg: '#F0562A',
  pageBg: '#F3EFE9', // App canvas soft cream
  cardBg: '#FFFFFF',
  border: '#EEDCD3',
  borderSubtle: '#F2ECE5',
  textInk: '#1A1A1A',
  textSecondary: '#5F5E5A',
  textMuted: '#8C8983',
  orangeDeep: '#7A2E14',
  greenSuccess: '#16A34A',
  greenBg: '#DCFCE7',
  amberWarning: '#D97706',
  amberBg: '#FEF3C7',
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

function GearSettingsIcon({ size = 16, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
      <Path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke={color}
        strokeWidth="2"
      />
    </Svg>
  );
}

function EyeDetailIcon({ size = 16, color = PALETTE.textSecondary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function PlusIcon({ size = 16, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

function SearchIcon({ size = 16, color = '#8C8983' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M21 21l-4.35-4.35" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export interface ManageWarehousesScreenProps {
  onBack?: () => void;
  onConfigureSettings?: (warehouseName: string) => void;
  onSelectWarehouse?: (warehouseName: string) => void;
  onNavigateCapacity?: () => void;
}

export function ManageWarehousesScreen({
  onBack,
  onConfigureSettings,
  onSelectWarehouse,
  onNavigateCapacity,
}: ManageWarehousesScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'All' | 'Active' | 'Near Capacity'>('All');

  const WAREHOUSES = [
    {
      id: 'WH-01',
      name: 'Kotagiri Warehouse',
      city: 'Kotagiri',
      type: 'Sub-Warehouse Hub',
      capacityUsed: 4820,
      capacityTotal: 6000,
      status: 'Operational',
      threshold: '25%',
      hours: '6:00 AM – 6:00 PM',
      staffCount: '2 members',
      isNearCapacity: false,
    },
    {
      id: 'WH-02',
      name: 'Ooty Warehouse',
      city: 'Ooty',
      type: 'Sub-Warehouse Hub',
      capacityUsed: 4500,
      capacityTotal: 6000,
      status: 'Operational',
      threshold: '25%',
      hours: '6:00 AM – 6:00 PM',
      staffCount: '2 members',
      isNearCapacity: false,
    },
    {
      id: 'WH-03',
      name: 'Coonoor Warehouse',
      city: 'Coonoor',
      type: 'Sub-Warehouse Hub',
      capacityUsed: 4400,
      capacityTotal: 5000,
      status: 'Near Capacity',
      threshold: '20%',
      hours: '6:00 AM – 6:00 PM',
      staffCount: '3 members',
      isNearCapacity: true,
    },
  ];

  const filteredWarehouses = WAREHOUSES.filter((wh) => {
    const matchesSearch =
      wh.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wh.city.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterTab === 'Active') return matchesSearch && wh.status === 'Operational';
    if (filterTab === 'Near Capacity') return matchesSearch && wh.isNearCapacity;
    return matchesSearch;
  });

  const handleAddWarehouse = () => {
    Alert.alert(
      'Add Warehouse Hub',
      'System Admin permission is required to provision a new warehouse node. Please contact the infrastructure admin team.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* ─── Top Header Banner (Brand Orange Theme) ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          {onBack && (
            <TouchableOpacity
              onPress={onBack}
              activeOpacity={0.7}
              style={styles.backBtn}
              accessibilityLabel="Back"
            >
              <ArrowBackIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Manage Warehouses</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          Multi-hub configuration & administrative controls
        </Text>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Input Box */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} color="#8C8983" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search warehouse by name or city..."
            placeholderTextColor="#8C8983"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Chips */}
        <View style={styles.filterChipsRow}>
          {(['All', 'Active', 'Near Capacity'] as const).map((tab) => {
            const isSelected = filterTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setFilterTab(tab)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* List of Warehouse Cards */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Configured Warehouses</Text>
          <Text style={styles.sectionSubCount}>{filteredWarehouses.length} Active Hubs</Text>
        </View>

        {filteredWarehouses.map((wh) => {
          const percentUsed = Math.round((wh.capacityUsed / wh.capacityTotal) * 100);
          return (
            <View key={wh.id} style={styles.whCard}>
              {/* Card Header */}
              <View style={styles.whCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.whName}>{wh.name}</Text>
                  <Text style={styles.whCityType}>
                    {wh.city} · {wh.type}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    wh.isNearCapacity ? styles.statusBadgeAmber : styles.statusBadgeGreen,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      wh.isNearCapacity ? styles.statusBadgeTextAmber : styles.statusBadgeTextGreen,
                    ]}
                  >
                    {wh.status}
                  </Text>
                </View>
              </View>

              {/* Capacity Usage Progress */}
              <View style={styles.capacitySection}>
                <View style={styles.capacityLabelRow}>
                  <Text style={styles.capacityLabel}>Storage Capacity Utilization</Text>
                  <Text style={styles.capacityValue}>
                    {wh.capacityUsed.toLocaleString()} / {wh.capacityTotal.toLocaleString()} kg ({percentUsed}%)
                  </Text>
                </View>
                <View style={styles.capacityTrack}>
                  <View
                    style={[
                      styles.capacityFill,
                      {
                        width: `${percentUsed}%`,
                        backgroundColor: wh.isNearCapacity ? PALETTE.amberWarning : PALETTE.primary,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Key Config Meta Grid */}
              <View style={styles.metaGrid}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>LOW-STOCK TRIGGER</Text>
                  <Text style={styles.metaVal}>{wh.threshold}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>OPERATING HOURS</Text>
                  <Text style={styles.metaVal}>{wh.hours}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>ASSIGNED STAFF</Text>
                  <Text style={styles.metaVal}>{wh.staffCount}</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.cardActionsRow}>
                {/* 1. Configure Settings (Opens WarehouseSettingsScreen) */}
                <TouchableOpacity
                  style={styles.actionBtnPrimary}
                  onPress={() => onConfigureSettings && onConfigureSettings(wh.name)}
                  activeOpacity={0.8}
                >
                  <GearSettingsIcon size={15} color="#FFFFFF" />
                  <Text style={styles.actionBtnPrimaryText}>Settings</Text>
                </TouchableOpacity>

                {/* 2. View Hub Detail */}
                <TouchableOpacity
                  style={styles.actionBtnSecondary}
                  onPress={() => onSelectWarehouse && onSelectWarehouse(wh.name)}
                  activeOpacity={0.8}
                >
                  <EyeDetailIcon size={15} color={PALETTE.textInk} />
                  <Text style={styles.actionBtnSecondaryText}>View Hub</Text>
                </TouchableOpacity>

                {/* 3. Capacity Overview */}
                {onNavigateCapacity && (
                  <TouchableOpacity
                    style={styles.actionBtnSecondary}
                    onPress={onNavigateCapacity}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.actionBtnSecondaryText}>Capacity</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}

        {/* Add New Warehouse Button */}
        <TouchableOpacity
          style={styles.addWarehouseBtn}
          onPress={handleAddWarehouse}
          activeOpacity={0.85}
        >
          <View style={styles.addIconCircle}>
            <PlusIcon size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.addWarehouseBtnText}>Provision New Warehouse Hub</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PALETTE.headerBg,
  },
  headerBanner: {
    backgroundColor: PALETTE.headerBg,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 6 : 8,
    paddingBottom: 14,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  backBtn: {
    marginRight: 10,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.92)',
    fontWeight: '500',
    marginTop: 2,
  },
  container: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  contentPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: PALETTE.textInk,
    marginLeft: 8,
    padding: 0,
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  filterChipActive: {
    backgroundColor: PALETTE.primary,
    borderColor: PALETTE.primary,
  },
  filterChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: PALETTE.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.orangeDeep,
    letterSpacing: -0.2,
  },
  sectionSubCount: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.textSecondary,
  },
  whCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  whCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  whName: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  whCityType: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeGreen: {
    backgroundColor: PALETTE.greenBg,
  },
  statusBadgeAmber: {
    backgroundColor: PALETTE.amberBg,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusBadgeTextGreen: {
    color: PALETTE.greenSuccess,
  },
  statusBadgeTextAmber: {
    color: PALETTE.amberWarning,
  },
  capacitySection: {
    marginBottom: 12,
  },
  capacityLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  capacityLabel: {
    fontSize: 11.5,
    color: PALETTE.textSecondary,
    fontWeight: '600',
  },
  capacityValue: {
    fontSize: 11.5,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  capacityTrack: {
    height: 7,
    backgroundColor: '#F3EFE9',
    borderRadius: 3.5,
    overflow: 'hidden',
  },
  capacityFill: {
    height: '100%',
    borderRadius: 3.5,
  },
  metaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FAF8F5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PALETTE.borderSubtle,
    padding: 10,
    marginBottom: 14,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: PALETTE.textMuted,
  },
  metaVal: {
    fontSize: 12.5,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginTop: 2,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtnPrimary: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.primary,
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6,
  },
  actionBtnPrimaryText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6,
  },
  actionBtnSecondaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  addWarehouseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: PALETTE.primary,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 6,
  },
  addIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: PALETTE.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  addWarehouseBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: PALETTE.primary,
  },
});
