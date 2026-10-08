import React, { useState } from 'react';
import {
  Pressable,
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

// ─── Design Tokens (Primary Brand Color: #F0562A) ────────────────────────────
const PALETTE = {
  primary:       '#F0562A',
  primarySoft:   '#FFF7ED',
  pageBg:        '#FAF7F2',
  cardBg:        '#FFFFFF',
  textInk:       '#1E1612',
  textSecondary: '#7A726C',
  textMuted:     '#9E9690',
  border:        '#EBE5DC',
  divider:       '#F4EFE9',
  greenText:     '#059669',
  redText:       '#DC2626',
  amberText:     '#D97706',
  blueBoxBg:     '#EFF6FF',
  blueBoxBorder: '#BFDBFE',
  blueBoxText:   '#1E40AF',
  redBoxBg:      '#FEF2F2',
  redBoxBorder:  '#FECACA',
  redBoxText:    '#DC2626',
};

// ─── Icons ───────────────────────────────────────────────────────────────────
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

function StaffGroupIcon({ size = 24, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" />
      <Path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SlidersIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}


function HistoryIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 8v4l3 3M3.05 11a9 9 0 1 1 .5 4m-.5-4v-4h4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CalendarIcon({ size = 16, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ArrowRightIcon({ size = 16, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14M12 5l7 7-7 7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WarehouseStoreIcon({ size = 12, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 21V9l9-5 9 5v12H3z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 21V12h6v9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = '#9E9690' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M21 21l-4.35-4.35" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function TruckIcon({ size = 20, color = '#7A726C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="1" y="3" width="15" height="13" rx="2" stroke={color} strokeWidth="1.8" />
      <Path d="M16 8h4l3 3v5h-7V8z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="5.5" cy="18.5" r="2.5" stroke={color} strokeWidth="1.8" />
      <Circle cx="18.5" cy="18.5" r="2.5" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function PersonUserIcon({ size = 20, color = '#7A726C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function ProhibitedCircleIcon({ size = 16, color = '#DC2626' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M4.93 4.93l14.14 14.14" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Bottom Navigation Icons ──────────────────────────────────────────────────
function HomeTabIcon({ active = false }: { active?: boolean }) {
  const color = active ? PALETTE.primary : '#9E9690';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 22V12h6v10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReceivingTabIcon({ active = false }: { active?: boolean }) {
  const color = active ? PALETTE.primary : '#9E9690';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3v12M7 10l5 5 5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function InventoryTabIcon({ active = false }: { active?: boolean }) {
  const color = active ? PALETTE.primary : '#9E9690';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M8 12h8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M3 9h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function MoreTabIcon({ active = true }: { active?: boolean }) {
  const color = active ? PALETTE.primary : '#9E9690';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="5" cy="5" r="2" fill={color} />
      <Circle cx="12" cy="5" r="2" fill={color} />
      <Circle cx="19" cy="5" r="2" fill={color} />
      <Circle cx="5" cy="12" r="2" fill={color} />
      <Circle cx="12" cy="12" r="2" fill={color} />
      <Circle cx="19" cy="12" r="2" fill={color} />
      <Circle cx="5" cy="19" r="2" fill={color} />
      <Circle cx="12" cy="19" r="2" fill={color} />
      <Circle cx="19" cy="19" r="2" fill={color} />
    </Svg>
  );
}

export interface StaffMember {
  id: string;
  name: string;
  staffId: string;
  type: 'driver' | 'warehouse';
  role: string;
  status: 'Active' | 'Inactive';
  attendance: 'Present' | 'Absent' | 'On Leave';
  deliveriesToday?: number;
  phone?: string;
  email?: string;
  warehouse?: string;
}

export const INITIAL_STAFF_MEMBERS: StaffMember[] = [
  {
    id: 'staff-1',
    name: 'Arun Kumar',
    staffId: 'DRV-0018',
    type: 'driver',
    role: 'Driver',
    status: 'Active',
    attendance: 'Present',
    deliveriesToday: 6,
    phone: 'XXXXXXXXXX',
    email: 'arun.k@email.com',
    warehouse: 'Coonoor Warehouse',
  },
  {
    id: 'staff-2',
    name: 'Karthik',
    staffId: 'STF-0024',
    type: 'warehouse',
    role: 'Warehouse Staff',
    status: 'Active',
    attendance: 'Present',
    phone: 'XXXXXXXXXX',
    email: 'example@email.com',
    warehouse: 'Coonoor Warehouse',
  },
  {
    id: 'staff-3',
    name: 'Manoj',
    staffId: 'DRV-0022',
    type: 'driver',
    role: 'Driver',
    status: 'Active',
    attendance: 'Absent',
    deliveriesToday: 0,
    phone: 'XXXXXXXXXX',
    email: 'manoj.d@email.com',
    warehouse: 'Coonoor Warehouse',
  },
];

export interface SubWarehouseStaffScreenProps {
  onBack: () => void;
  onSelectStaff: (staff: StaffMember) => void;
  onNavigateToHistory?: () => void;
  onNavigateToTodayAttendance?: () => void;
  onTabChange?: (tab: 'Home' | 'Receiving' | 'Inventory' | 'More') => void;
  warehouseName?: string;
}

export function SubWarehouseStaffScreen({
  onBack,
  onSelectStaff,
  onNavigateToHistory,
  onNavigateToTodayAttendance,
  onTabChange,
  warehouseName = 'Coonoor Warehouse',
}: SubWarehouseStaffScreenProps) {
  const [activeFilter, setActiveFilter] = useState<'All' | 'Warehouse Staff' | 'Drivers'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStaff = INITIAL_STAFF_MEMBERS.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.staffId.toLowerCase().includes(q) ||
      item.role.toLowerCase().includes(q);

    const matchesFilter =
      activeFilter === 'All' ||
      (activeFilter === 'Warehouse Staff' && item.type === 'warehouse') ||
      (activeFilter === 'Drivers' && item.type === 'driver');

    return matchesSearch && matchesFilter;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <StaffGroupIcon size={22} color="#FFFFFF" />
            <Text style={styles.headerTitle}>Staff</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>


            <TouchableOpacity
              style={styles.sliderButton}
              activeOpacity={0.8}
            >
              <SlidersIcon size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Warehouse Pill Chip */}
        <View style={styles.warehousePill}>
          <WarehouseStoreIcon size={13} color="#FFFFFF" />
          <Text style={styles.warehousePillText}>{warehouseName}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 4 Metrics Cards (2x2 Grid) ─── */}
        <View style={styles.metricsGrid}>
          {/* Card 1: Total Visible */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>TOTAL VISIBLE</Text>
            <Text style={styles.metricValueBlack}>12</Text>
          </View>

          {/* Card 2: Present Today */}
          <TouchableOpacity
            style={styles.metricCard}
            onPress={onNavigateToHistory}
            activeOpacity={onNavigateToHistory ? 0.75 : 1}
          >
            <Text style={styles.metricLabel}>PRESENT TODAY</Text>
            <Text style={styles.metricValueGreen}>9</Text>
          </TouchableOpacity>

          {/* Card 3: Absent */}
          <TouchableOpacity
            style={styles.metricCard}
            onPress={onNavigateToHistory}
            activeOpacity={onNavigateToHistory ? 0.75 : 1}
          >
            <Text style={styles.metricLabel}>ABSENT</Text>
            <Text style={styles.metricValueRed}>2</Text>
          </TouchableOpacity>

          {/* Card 4: On Leave */}
          <TouchableOpacity
            style={styles.metricCard}
            onPress={onNavigateToHistory}
            activeOpacity={onNavigateToHistory ? 0.75 : 1}
          >
            <Text style={styles.metricLabel}>ON LEAVE</Text>
            <Text style={styles.metricValueAmber}>1</Text>
          </TouchableOpacity>
        </View>



        {/* ─── Filter Chips ─── */}
        <View style={styles.chipsRow}>
          {(['All', 'Warehouse Staff', 'Drivers'] as const).map((chip) => {
            const isActive = activeFilter === chip;
            return (
              <TouchableOpacity
                key={chip}
                style={[styles.chipBtn, isActive && styles.chipBtnActive]}
                onPress={() => setActiveFilter(chip)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {chip}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── Search Bar ─── */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} color="#9E9690" />
          <TextInput
            style={styles.searchInput}
            placeholder="Staff name, Staff ID, Driver ID, Role"
            placeholderTextColor="#9E9690"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* ─── Staff List Cards ─── */}
        <View style={styles.staffList}>
          {filteredStaff.map((staff) => (
            <TouchableOpacity
              key={staff.id}
              style={styles.staffCard}
              onPress={() => onSelectStaff(staff)}
              activeOpacity={0.85}
            >
              {/* Top Profile Header */}
              <View style={styles.staffCardHeader}>
                <View style={styles.avatarCircle}>
                  {staff.type === 'driver' ? (
                    <TruckIcon size={20} color="#7A726C" />
                  ) : (
                    <PersonUserIcon size={20} color="#7A726C" />
                  )}
                </View>
                <View style={styles.staffCardInfo}>
                  <Text style={styles.staffName}>{staff.name}</Text>
                  <Text style={styles.staffId}>
                    {staff.type === 'driver' ? 'Driver ID: ' : 'Staff ID: '}
                    {staff.staffId}
                  </Text>
                </View>
              </View>

              <View style={styles.cardDivider} />

              {/* Bottom 3 Columns */}
              {staff.type === 'driver' ? (
                <View style={styles.threeColRow}>
                  <View style={styles.col}>
                    <Text style={styles.colLabel}>Status</Text>
                    <Text style={styles.colVal}>{staff.status}</Text>
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.colLabel}>Today's Attendance</Text>
                    <Text style={styles.colVal}>{staff.attendance}</Text>
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.colLabel}>Deliveries Today</Text>
                    <Text style={styles.colVal}>{staff.deliveriesToday ?? 6}</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.threeColRow}>
                  <View style={styles.col}>
                    <Text style={styles.colLabel}>Role</Text>
                    <Text style={styles.colVal}>{staff.role}</Text>
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.colLabel}>Status</Text>
                    <Text style={styles.colVal}>{staff.status}</Text>
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.colLabel}>Attendance</Text>
                    <Text style={styles.colVal}>{staff.attendance}</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        
        {/* ─── Bottom Action Tabs ─── */}
        <View style={styles.actionTabsRow}>
          <TouchableOpacity
            style={styles.actionTabCard}
            onPress={onNavigateToTodayAttendance}
            activeOpacity={0.8}
          >
            <CalendarIcon size={22} color={PALETTE.primary} />
            <Text style={styles.actionTabText}>Attendance</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionTabCard}
            onPress={onNavigateToHistory}
            activeOpacity={0.8}
          >
            <HistoryIcon size={22} color={PALETTE.primary} />
            <Text style={styles.actionTabText}>Attendance History</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Red HR Disclaimer Card ─── */}
        <View style={styles.redDisclaimerCard}>
          <ProhibitedCircleIcon size={18} color={PALETTE.redBoxText} />
          <Text style={styles.redDisclaimerText}>
            No admin staff list, Create Admin, Disable Admin, Change Role, or Edit Permissions anywhere in this module — SWA's role matrix doesn't grant admin-staff visibility or HR administration.
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ─── Bottom Navigation Bar ─── */}
      <View style={styles.bottomTabBar}>
        <Pressable
          style={styles.tabItem}
          onPress={() => onTabChange?.('Home')}
          accessibilityRole="tab"
        >
          <HomeTabIcon active={false} />
          <Text style={styles.tabLabel}>Home</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => onTabChange?.('Receiving')}
          accessibilityRole="tab"
        >
          <ReceivingTabIcon active={false} />
          <Text style={styles.tabLabel}>Receiving</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => onTabChange?.('Inventory')}
          accessibilityRole="tab"
        >
          <InventoryTabIcon active={false} />
          <Text style={styles.tabLabel}>Inventory</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => onTabChange?.('More')}
          accessibilityRole="tab"
        >
          <MoreTabIcon active={true} />
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>More</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ─── Stylesheet ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PALETTE.primary,
  },
  header: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 6,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  sliderButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warehousePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  warehousePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 14,
  },
  metricCard: {
    width: '48%',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.textSecondary,
    marginBottom: 6,
  },
  metricValueBlack: {
    fontSize: 22,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  metricValueGreen: {
    fontSize: 22,
    fontWeight: '800',
    color: PALETTE.greenText,
  },
  metricValueRed: {
    fontSize: 22,
    fontWeight: '800',
    color: PALETTE.redText,
  },
  metricValueAmber: {
    fontSize: 22,
    fontWeight: '800',
    color: PALETTE.amberText,
  },
  blueInfoBox: {
    backgroundColor: PALETTE.blueBoxBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.blueBoxBorder,
    padding: 12,
    marginBottom: 14,
  },
  blueInfoText: {
    fontSize: 12,
    color: PALETTE.blueBoxText,
    lineHeight: 18,
    fontWeight: '500',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  chipBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  chipBtnActive: {
    borderColor: PALETTE.primary,
    backgroundColor: PALETTE.primarySoft,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.textSecondary,
  },
  chipTextActive: {
    color: PALETTE.primary,
    fontWeight: '800',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: PALETTE.textInk,
    paddingVertical: 0,
  },
  staffList: {
    gap: 12,
    marginBottom: 14,
  },
  staffCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  staffCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffCardInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 2,
  },
  staffId: {
    fontSize: 12,
    color: PALETTE.textSecondary,
  },
  cardDivider: {
    height: 1,
    backgroundColor: PALETTE.divider,
    marginVertical: 12,
  },
  threeColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
  },
  colLabel: {
    fontSize: 11,
    color: PALETTE.textSecondary,
    marginBottom: 4,
  },
  colVal: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  
  actionTabsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionTabCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEDCD3',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  actionTabText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.primary,
    marginTop: 8,
  },

  redDisclaimerCard: {
    flexDirection: 'row',
    backgroundColor: PALETTE.redBoxBg,
    borderWidth: 1,
    borderColor: PALETTE.redBoxBorder,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    alignItems: 'flex-start',
  },
  redDisclaimerText: {
    flex: 1,
    fontSize: 12,
    color: PALETTE.redBoxText,
    lineHeight: 18,
    fontWeight: '500',
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9E9690',
  },
  tabLabelActive: {
    color: PALETTE.primary,
    fontWeight: '800',
  },
  /* Header Attendance Pill */
  headerAttendancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 5,
  },
  headerAttendancePillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

});
