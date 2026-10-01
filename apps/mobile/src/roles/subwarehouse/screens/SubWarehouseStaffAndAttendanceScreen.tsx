import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

const PALETTE = {
  primary: '#F0562A',
  primaryHeader: '#F0562A',
  pageBg: '#F7F5F0',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#7A726C',
  border: '#EBE5DC',
  greenText: '#059669',
  redText: '#DC2626',
  avatarBg: '#FEF3C7',
  avatarText: '#B45309',
};

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LockIcon({ size = 12, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect fill="none" x="5" y="11" width="14" height="10" rx="2" stroke={color} strokeWidth="2" />
      <Path fill="none" d="M8 11V7a4 4 0 0 1 8 0v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function UsersIcon({ color = '#B45309' }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path fill="none" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle fill="none" cx="9" cy="7" r="4" stroke={color} strokeWidth="2" />
      <Path fill="none" d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckCircleIcon({ color = '#059669' }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle fill="none" cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path fill="none" d="M8 12l3 3 5-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function XCircleIcon({ color = '#DC2626' }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle fill="none" cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path fill="none" d="M15 9l-6 6M9 9l6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PercentIcon({ color = '#1E1612' }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path fill="none" d="M19 5L5 19" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle fill="none" cx="6.5" cy="6.5" r="2.5" stroke={color} strokeWidth="2" />
      <Circle fill="none" cx="17.5" cy="17.5" r="2.5" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function HomeTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primaryHeader : PALETTE.textSecondary;
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path fill="none" d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path fill="none" d="M9 22V12h6v10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReceivingTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primaryHeader : PALETTE.textSecondary;
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path fill="none" d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InventoryTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primaryHeader : PALETTE.textSecondary;
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path fill="none" d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <Path fill="none" d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MoreTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primaryHeader : PALETTE.textSecondary;
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
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

export interface SubWarehouseStaffAndAttendanceScreenProps {
  onBack: () => void;
  onNavigateToDetail: (staffId: string) => void;
  onTabChange?: (tab: 'Home' | 'Receiving' | 'Inventory' | 'More') => void;
}

const STAFF_DATA = [
  { id: '1', name: 'Ramesh Kumar', role: 'Warehouse Staff', initials: 'RK', status: 'Present', checkIn: '08:42 AM' },
  { id: '2', name: 'Arun', role: 'Warehouse Staff', initials: 'AR', status: 'Absent' },
  { id: '3', name: 'Priya', role: 'Warehouse Staff', initials: 'PR', status: 'Present', checkIn: '08:50 AM' },
];

export function SubWarehouseStaffAndAttendanceScreen({
  onBack,
  onNavigateToDetail,
}: SubWarehouseStaffAndAttendanceScreenProps) {
  const [activeTab, setActiveTab] = useState("Today's Attendance");

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primaryHeader} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <ArrowBackIcon size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Staff & Attendance</Text>
        </View>
        <View style={styles.warehousePill}>
          <LockIcon size={12} color="#FFFFFF" />
          <Text style={styles.warehousePillText}>Coonoor Warehouse</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        
        {/* Top Grid */}
        <View style={styles.grid}>
          <View style={styles.gridCard}>
            <View style={styles.iconWrap}><UsersIcon /></View>
            <Text style={styles.gridVal}>10</Text>
            <Text style={styles.gridLabel}>Total Staff</Text>
          </View>
          <View style={styles.gridCard}>
            <View style={styles.iconWrap}><CheckCircleIcon /></View>
            <Text style={styles.gridVal}>8</Text>
            <Text style={styles.gridLabel}>Present</Text>
          </View>
          <View style={styles.gridCard}>
            <View style={styles.iconWrap}><XCircleIcon /></View>
            <Text style={[styles.gridVal, { color: PALETTE.redText }]}>2</Text>
            <Text style={styles.gridLabel}>Absent</Text>
          </View>
          <View style={styles.gridCard}>
            <View style={styles.iconWrap}><PercentIcon /></View>
            <Text style={styles.gridVal}>80%</Text>
            <Text style={styles.gridLabel}>Attendance</Text>
          </View>
        </View>

        {/* Tab Row */}
        <View style={styles.tabRow}>
          {[{ id: "Today's Attendance", label: "Today's\nAttendance" }, { id: 'Staff', label: 'Staff' }, { id: 'History', label: 'History' }].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabPill, isActive && styles.tabPillActive]}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.dateTitle}>24 September 2026</Text>

        {/* Staff List */}
        <View style={styles.list}>
          {STAFF_DATA.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.staffCard} 
              onPress={() => onNavigateToDetail(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.initials}</Text>
              </View>
              <View style={styles.staffInfo}>
                <Text style={styles.staffName}>{item.name}</Text>
                <Text style={styles.staffRole}>{item.role}</Text>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: item.status === 'Present' ? PALETTE.greenText : PALETTE.redText }]} />
                  <Text style={[styles.statusText, { color: item.status === 'Present' ? PALETTE.greenText : PALETTE.redText }]}>
                    {item.status}
                  </Text>
                  {item.checkIn && (
                    <Text style={styles.checkInText}> Check-in <Text style={{ color: PALETTE.textInk }}>{item.checkIn}</Text></Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>

      {/* Bottom Nav Placeholder (handled by parent usually, but matching image we have bottom nav) */}
      <View style={styles.bottomNav}>
         <TouchableOpacity style={styles.navItem} onPress={() => onTabChange?.('Home')}>
           <HomeTabIcon active={false} />
           <Text style={styles.navLabel}>Home</Text>
         </TouchableOpacity>
         <TouchableOpacity style={styles.navItem} onPress={() => onTabChange?.('Receiving')}>
           <ReceivingTabIcon active={false} />
           <Text style={styles.navLabel}>Receiving</Text>
         </TouchableOpacity>
         <TouchableOpacity style={styles.navItem} onPress={() => onTabChange?.('Inventory')}>
           <InventoryTabIcon active={false} />
           <Text style={styles.navLabel}>Inventory</Text>
         </TouchableOpacity>
         <TouchableOpacity style={styles.navItem} onPress={() => onTabChange?.('More')}>
           <MoreTabIcon active={true} />
           <Text style={[styles.navLabel, { color: '#B45309', fontWeight: '800' }]}>More</Text>
         </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PALETTE.pageBg },
  header: {
    backgroundColor: PALETTE.primaryHeader,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 32, height: 32, justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
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
  warehousePillText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  gridCard: { width: '48%', backgroundColor: PALETTE.cardBg, borderRadius: 12, paddingVertical: 20, paddingHorizontal: 16, borderWidth: 1, borderColor: PALETTE.border },
  iconWrap: { marginBottom: 12 },
  gridVal: { fontSize: 24, fontWeight: '800', color: PALETTE.textInk, marginBottom: 4 },
  gridLabel: { fontSize: 13, fontWeight: '600', color: PALETTE.textSecondary },

  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  tabPill: { flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: PALETTE.cardBg, borderWidth: 1, borderColor: PALETTE.border, alignItems: 'center', justifyContent: 'center' },
  tabPillActive: { backgroundColor: PALETTE.primaryHeader, borderColor: PALETTE.primaryHeader },
  tabText: { fontSize: 13, fontWeight: '600', color: PALETTE.textSecondary, textAlign: 'center' },
  tabTextActive: { color: '#FFFFFF', fontWeight: '800' },

  dateTitle: { fontSize: 14, fontWeight: '800', color: PALETTE.textInk, marginBottom: 12 },

  list: { gap: 12 },
  staffCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: PALETTE.cardBg, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: PALETTE.border },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: PALETTE.avatarBg, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  avatarText: { fontSize: 16, fontWeight: '800', color: PALETTE.avatarText },
  staffInfo: { flex: 1 },
  staffName: { fontSize: 16, fontWeight: '800', color: PALETTE.textInk, marginBottom: 2 },
  staffRole: { fontSize: 12, color: PALETTE.textSecondary, marginBottom: 6 },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 6, height: 6, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: '800' },
  checkInText: { fontSize: 12, color: PALETTE.textSecondary, marginLeft: 8 },

  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: PALETTE.cardBg, borderTopWidth: 1, borderColor: PALETTE.border, paddingVertical: 12, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  navItem: { alignItems: 'center', gap: 4 },
  navLabel: { fontSize: 11, fontWeight: '600', color: PALETTE.textSecondary },
});
