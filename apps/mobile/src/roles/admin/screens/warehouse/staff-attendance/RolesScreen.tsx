/**
 * Roles Screen (Matching Image 4)
 * Displays 7 System Roles with KPI Summary Cards, Search Bar, and View navigation.
 * Super Admin system role management.
 * Strictly adheres to Admin Design Tokens from ../../../theme.
 */
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../../theme';
import type { WarehouseScreenBaseProps } from './types';

export interface RolesScreenProps extends WarehouseScreenBaseProps {
  role?: string | undefined;
  onSelectRole?: (roleId: string, roleName: string) => void;
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function BackArrowWhiteIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={adminColors.onBrand}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SearchIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={adminColors.muted} strokeWidth="2" />
      <Path d="M20 20l-4-4" stroke={adminColors.muted} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function FilterSlidersIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M4 6h16M4 12h16M4 18h16" stroke={adminColors.brand} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="8" cy="6" r="2" fill={adminColors.brand} />
      <Circle cx="16" cy="12" r="2" fill={adminColors.brand} />
      <Circle cx="10" cy="18" r="2" fill={adminColors.brand} />
    </Svg>
  );
}

function ChevronRightOrangeIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={adminColors.brand} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CrownIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      {/* 3 Jewels */}
      <Circle cx="4.5" cy="8.5" r="1.5" stroke={adminColors.brand} strokeWidth="1.8" />
      <Circle cx="12" cy="6" r="1.5" stroke={adminColors.brand} strokeWidth="1.8" />
      <Circle cx="19.5" cy="8.5" r="1.5" stroke={adminColors.brand} strokeWidth="1.8" />
      {/* Crown Outline */}
      <Path
        d="M5 10l3.5 5 3.5-7 3.5 7 3.5-5v8H5V10z"
        stroke={adminColors.brand}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Base Line */}
      <Line x1="4" y1="20" x2="20" y2="20" stroke={adminColors.brand} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function BankPillarIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3L3 7.5h18L12 3z" stroke={adminColors.brand} strokeWidth="1.8" strokeLinejoin="round" />
      <Line x1="3" y1="9" x2="21" y2="9" stroke={adminColors.brand} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="6" y1="10.5" x2="6" y2="17" stroke={adminColors.brand} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="10" y1="10.5" x2="10" y2="17" stroke={adminColors.brand} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="14" y1="10.5" x2="14" y2="17" stroke={adminColors.brand} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="18" y1="10.5" x2="18" y2="17" stroke={adminColors.brand} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="3" y1="18" x2="21" y2="18" stroke={adminColors.brand} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="2" y1="20.5" x2="22" y2="20.5" stroke={adminColors.brand} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function FarmerAdminShieldIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21s7-3.5 7-9V5.5l-7-2.5-7 2.5V12c0 5.5 7 9 7 9z"
        stroke={adminColors.brand}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* User inside shield */}
      <Circle cx="12" cy="10" r="2" stroke={adminColors.brand} strokeWidth="1.5" />
      <Path d="M9 16c0-1.7 1.3-3 3-3s3 1.3 3 3" stroke={adminColors.brand} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

function MainWarehouseIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M3 20V9l9-5 9 5v11H3z" stroke={adminColors.brand} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {/* Wide Roll-up Shutter Door */}
      <Rect x="7" y="11" width="10" height="9" stroke={adminColors.brand} strokeWidth="1.6" />
      <Line x1="7" y1="14" x2="17" y2="14" stroke={adminColors.brand} strokeWidth="1.4" />
      <Line x1="7" y1="17" x2="17" y2="17" stroke={adminColors.brand} strokeWidth="1.4" />
    </Svg>
  );
}

function SubWarehouseIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M4 20V10l8-4 8 4v10H4z" stroke={adminColors.brand} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="8" y="12" width="8" height="8" stroke={adminColors.brand} strokeWidth="1.6" />
      <Line x1="8" y1="15" x2="16" y2="15" stroke={adminColors.brand} strokeWidth="1.4" />
      <Line x1="8" y1="17.5" x2="16" y2="17.5" stroke={adminColors.brand} strokeWidth="1.4" />
    </Svg>
  );
}

function FarmerHatIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      {/* Straw Hat Crown */}
      <Path d="M9 8.5a3 3 0 016 0" stroke={adminColors.brand} strokeWidth="1.8" strokeLinecap="round" />
      {/* Hat Brim */}
      <Path d="M4 11c2.5-1 13.5-1 16 0" stroke={adminColors.brand} strokeWidth="1.8" strokeLinecap="round" />
      {/* Face */}
      <Path d="M8 12v1.5a4 4 0 008 0V12" stroke={adminColors.brand} strokeWidth="1.6" strokeLinecap="round" />
      {/* Shoulders & Overalls */}
      <Path d="M5 20v-1a5 5 0 0110 0v1" stroke={adminColors.brand} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="10" y1="16" x2="10" y2="20" stroke={adminColors.brand} strokeWidth="1.4" />
      <Line x1="14" y1="16" x2="14" y2="20" stroke={adminColors.brand} strokeWidth="1.4" />
    </Svg>
  );
}

function CustomerCartIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="20" r="1.5" fill={adminColors.brand} />
      <Circle cx="18" cy="20" r="1.5" fill={adminColors.brand} />
      <Path
        d="M2 3h3.5l2.6 11a2 2 0 002 1.5h9.8a2 2 0 002-1.5L23 6H6"
        stroke={adminColors.brand}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="9" y1="9" x2="20" y2="9" stroke={adminColors.brand} strokeWidth="1.2" strokeLinecap="round" />
      <Line x1="10.5" y1="12" x2="18.5" y2="12" stroke={adminColors.brand} strokeWidth="1.2" strokeLinecap="round" />
    </Svg>
  );
}

function InfoCircleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" fill={adminColors.brand} />
      <Path d="M12 8v1M12 12v4" stroke={adminColors.onBrand} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

interface RoleItem {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const SYSTEM_ROLES: RoleItem[] = [
  {
    id: 'super_admin',
    name: 'Super Admin',
    description: 'Full system-level control across all modules and settings.',
    icon: <CrownIcon />,
  },
  {
    id: 'tohfa_admin',
    name: 'TOHFA Admin',
    description: 'Manages day-to-day TOHFA operations and oversees teams.',
    icon: <BankPillarIcon />,
  },
  {
    id: 'farmer_admin',
    name: 'Farmer Admin',
    description: 'Manages assigned farmers, farm operations and farmer records.',
    icon: <FarmerAdminShieldIcon />,
  },
  {
    id: 'main_warehouse_admin',
    name: 'Main Warehouse Admin',
    description: 'Manages main warehouse inventory, operations and staff.',
    icon: <MainWarehouseIcon />,
  },
  {
    id: 'sub_warehouse_admin',
    name: 'Sub warehouse Admin',
    description: 'Manages assigned farmers, farm operations and farmer records.',
    icon: <SubWarehouseIcon />,
  },
  {
    id: 'farmer',
    name: 'Farmer',
    description: 'Manages assigned farmers, farm operations and farmer records.',
    icon: <FarmerHatIcon />,
  },
  {
    id: 'customer',
    name: 'Customer',
    description: 'Manages assigned farmers, farm operations and farmer records.',
    icon: <CustomerCartIcon />,
  },
];

export function RolesScreen({
  onBack,
  onSelectRole,
}: RolesScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRoles = useMemo(() => {
    if (!searchQuery.trim()) return SYSTEM_ROLES;
    const q = searchQuery.toLowerCase();
    return SYSTEM_ROLES.filter(
      (r) => r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <BackArrowWhiteIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Roles</Text>
      </View>

      <View style={styles.container}>
        <FlatList
          data={filteredRoles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listPad}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {/* Top Overview Cards */}
              <View style={styles.kpiRow}>
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiValue}>7</Text>
                  <Text style={styles.kpiLabel}>System Roles</Text>
                </View>

                <View style={styles.kpiCard}>
                  <Text style={styles.kpiValueLarge}>Permission-based</Text>
                  <Text style={styles.kpiLabel}>Access</Text>
                </View>
              </View>

              {/* Search Bar */}
              <View style={styles.searchBar}>
                <SearchIcon />
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search common or scientific name"
                  placeholderTextColor={adminColors.muted}
                />
                <TouchableOpacity activeOpacity={0.7}>
                  <FilterSlidersIcon />
                </TouchableOpacity>
              </View>

              {/* Section Header */}
              <Text style={styles.sectionHeader}>{filteredRoles.length} Roles</Text>
            </>
          }
          renderItem={({ item }) => (
            <View style={styles.roleCard}>
              <View style={styles.roleIconBox}>{item.icon}</View>

              <View style={styles.roleInfo}>
                <Text style={styles.roleName}>{item.name}</Text>
                <Text style={styles.roleDesc}>{item.description}</Text>
              </View>

              <TouchableOpacity
                style={styles.viewBtn}
                onPress={() => onSelectRole?.(item.id, item.name)}
                activeOpacity={0.8}
              >
                <Text style={styles.viewBtnText}>View</Text>
                <ChevronRightOrangeIcon />
              </TouchableOpacity>
            </View>
          )}
          ListFooterComponent={
            <View style={styles.footerNoteBox}>
              <InfoCircleIcon />
              <Text style={styles.footerNoteText}>
                Role access is controlled by assigned permissions.
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: adminColors.brand,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 12,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontSize: 20,
  },
  container: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  listPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 16,
    paddingBottom: 36,
  },

  // KPI Row
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  kpiValue: {
    ...adminType.title,
    color: adminColors.ink,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  kpiValueLarge: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  kpiLabel: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },

  // Search Bar
  searchBar: {
    height: 48,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
    marginBottom: 16,
    ...adminShadow.sm,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
  },

  sectionHeader: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    fontSize: 13,
    marginBottom: 12,
  },

  // Role Card
  roleCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    ...adminShadow.sm,
  },
  roleIconBox: {
    width: 44,
    height: 44,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  roleInfo: {
    flex: 1,
    marginRight: 8,
  },
  roleName: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    fontSize: 15,
    marginBottom: 3,
  },
  roleDesc: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    fontSize: 11.5,
    lineHeight: 15,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: adminColors.brandTint,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: adminRadius.sm,
  },
  viewBtnText: {
    ...adminType.rowMeta,
    color: adminColors.brand,
    fontWeight: '700',
  },

  // Footer Note
  footerNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.md,
    padding: 12,
    marginTop: 8,
  },
  footerNoteText: {
    flex: 1,
    ...adminType.rowMeta,
    color: adminColors.ink,
    fontSize: 12,
  },
});

