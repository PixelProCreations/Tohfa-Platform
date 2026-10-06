import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { MainWarehouseStaffDetailScreen } from './MainWarehouseStaffDetailScreen';
import { MainWarehouseAttendanceScreen } from './MainWarehouseAttendanceScreen';

const PALETTE = {
  primary: '#F0562A',
  headerOrange: '#F0562A',
  pageBg: '#F4F0EB',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#6B7280',
  border: '#EBE5DC',
  brownText: '#8A5A30',
  tabInactive: '#786F66',
  greenBg: '#E8F5E9',
  greenText: '#15803D',
};

function SettingsIcon({ size = 20, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M1 14h6M9 8h6M17 16h6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WarehouseIcon({ color = '#FFF', size = 16 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronDownIcon({ color = '#FFF', size = 16 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = '#999' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth="2" />
      <Path d="M21 21l-4.35-4.35" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function DriverIcon({ size = 24, color = '#8A5A30' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 5h12v14H3V5zm12 3h4l3 3v8h-7V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="7" cy="19" r="2" stroke={color} strokeWidth="2" />
      <Circle cx="17" cy="19" r="2" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function StaffIcon({ size = 24, color = '#8A5A30' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2" />
      <Path d="M20 21c0-4-3-7-8-7s-8 3-8 7" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function AttendanceIcon({ size = 20, color = '#F0562A' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M9 16l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Tab Bar Icons
function HomeTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 21v-7a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReceivingTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M12 8v8M8 12l4 4 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InventoryTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M3 10h18M10 14h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function MoreTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
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

export function MainWarehouseStaffScreen({ onBack }: { onBack: () => void }) {
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [showAttendance, setShowAttendance] = useState(false);

  if (showAttendance) {
    return <MainWarehouseAttendanceScreen initialView="main" onBack={() => setShowAttendance(false)} />;
  }

  if (selectedStaffId) {
    return <MainWarehouseStaffDetailScreen staffId={selectedStaffId} onBack={() => setSelectedStaffId(null)} />;
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerOrange} />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <View style={{marginRight: 12}}>
              <StaffIcon color="#FFFFFF" size={24} />
            </View>
            <Text style={styles.headerTitle}>Staff</Text>
          </View>
          <TouchableOpacity style={styles.settingsBtn} activeOpacity={0.8}>
            <SettingsIcon />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.warehouseDropdown} activeOpacity={0.8}>
          <WarehouseIcon />
          <Text style={styles.warehouseText}>All Warehouses</Text>
          <ChevronDownIcon />
        </TouchableOpacity>
      </View>

      <View style={styles.mainContainer}>
        <TouchableOpacity style={styles.attendanceBanner} onPress={() => setShowAttendance(true)} activeOpacity={0.8}>
          <View style={styles.attendanceBannerContent}>
            <View style={styles.attendanceIconBox}><AttendanceIcon /></View>
            <View>
              <Text style={styles.attendanceBannerTitle}>Attendance Dashboard</Text>
              <Text style={styles.attendanceBannerSub}>View today's attendance & history</Text>
            </View>
          </View>
          <Path d="M9 18l6-6-6-6" stroke="#F0562A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path d="M9 18l6-6-6-6" stroke="#F0562A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>

        <View style={styles.searchContainer}>
          <SearchIcon />
          <TextInput
            style={styles.searchInput}
            placeholder="Staff name, Staff ID, Driver ID, Role"
            placeholderTextColor="#999"
          />
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <Text style={styles.sectionTitle}>DRIVERS</Text>
          <TouchableOpacity style={styles.card} onPress={() => setSelectedStaffId('DRV-0018')} activeOpacity={0.8}>
            <View style={styles.cardHeader}>
              <View style={styles.iconCircle}>
                <DriverIcon />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.name}>Arun Kumar</Text>
                <Text style={styles.idText}>Driver ID: DRV-0018</Text>
                <View style={styles.tagsRow}>
                  <View style={styles.tagGreen}><Text style={styles.tagGreenText}>Active</Text></View>
                  <View style={styles.tagGreen}><Text style={styles.tagGreenText}>Present</Text></View>
                </View>
                <Text style={styles.footerText}>Deliveries Today: <Text style={{color: '#000', fontWeight: '800'}}>6</Text></Text>
              </View>
            </View>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>WAREHOUSE STAFF</Text>
          <TouchableOpacity style={styles.card} onPress={() => setSelectedStaffId('STF-0024')} activeOpacity={0.8}>
            <View style={styles.cardHeader}>
              <View style={styles.iconCircle}>
                <StaffIcon />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.name}>Karthik</Text>
                <Text style={styles.idText}>Staff ID: STF-0024 · Warehouse Staff</Text>
                <View style={styles.tagsRow}>
                  <View style={styles.tagGreen}><Text style={styles.tagGreenText}>Active</Text></View>
                  <View style={styles.tagGreen}><Text style={styles.tagGreenText}>Present</Text></View>
                </View>
              </View>
            </View>
          </TouchableOpacity>
          
        </ScrollView>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={onBack}>
          <HomeTabIcon active={false} />
          <Text style={styles.tabLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <ReceivingTabIcon active={false} />
          <Text style={styles.tabLabel}>Receiving</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <InventoryTabIcon active={false} />
          <Text style={styles.tabLabel}>Inventory</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <MoreTabIcon active={true} />
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>More</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PALETTE.pageBg },
  header: {
    backgroundColor: PALETTE.headerOrange,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headerTitle: { fontFamily: 'Poppins', fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  settingsBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 8,
  },
  warehouseDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  warehouseText: { fontFamily: 'Poppins', color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  mainContainer: { flex: 1, backgroundColor: PALETTE.pageBg },
  attendanceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF0EB',
    margin: 16,
    marginBottom: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0562A',
  },
  attendanceBannerContent: { flexDirection: 'row', alignItems: 'center' },
  attendanceIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  attendanceBannerTitle: { fontFamily: 'Poppins', fontSize: 14, fontWeight: '800', color: '#F0562A' },
  attendanceBannerSub: { fontFamily: 'Poppins', fontSize: 11, color: '#C47432', fontWeight: '500' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 12,
    margin: 16,
    paddingHorizontal: 12,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 13,
    color: '#000',
    marginLeft: 8,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 24 },
  sectionTitle: { fontFamily: 'Poppins', fontSize: 11, fontWeight: '800', color: PALETTE.textSecondary, marginBottom: 8, marginTop: 8 },
  
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: { flexDirection: 'row', gap: 16 },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FAEEE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: { flex: 1 },
  name: { fontFamily: 'Poppins', fontSize: 14, fontWeight: '800', color: '#000', marginBottom: 2 },
  idText: { fontFamily: 'Poppins', fontSize: 11, color: '#666', marginBottom: 8 },
  tagsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  tagGreen: { backgroundColor: PALETTE.greenBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tagGreenText: { fontFamily: 'Poppins', fontSize: 10, fontWeight: '800', color: PALETTE.greenText },
  footerText: { fontFamily: 'Poppins', fontSize: 11, color: '#666' },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EBE5DC',
    paddingBottom: 20,
    paddingTop: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontFamily: 'Poppins',
    fontSize: 10,
    color: PALETTE.tabInactive,
    marginTop: 4,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: PALETTE.primary,
  },
});
