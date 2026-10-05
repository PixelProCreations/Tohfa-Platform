import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { MainWarehouseListScreen } from './MainWarehouseListScreen';
import { MainWarehouseAddScreen } from './MainWarehouseAddScreen';
import { MainWarehouseManageSWAsScreen } from './MainWarehouseManageSWAsScreen';

const PALETTE = {
  primary: '#F0562A',
  headerOrange: '#F0562A',
  pageBg: '#F4F0EB',
  cardBg: '#FFFFFF',
  textSecondary: '#6B7280',
  border: '#EBE5DC',
  brownText: '#8A5A30',
  greenBg: '#E8F5E9',
  greenText: '#15803D',
  warningBg: '#FEF3C7',
  warningText: '#D97706',
  tabInactive: '#786F66',
};

function BellIcon({ size = 20, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

function AddWarehouseIcon({ size = 24, color = '#F0562A' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 11v6M9 14h6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ManageSWAsIcon({ size = 24, color = '#F0562A' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" />
      <Path d="M17 11v6M14 14h6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M9 14c-4.42 0-8 2.24-8 5v2h10" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function WarehouseListIcon({ size = 24, color = '#F0562A' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M8 9h8M8 13h8M8 17h8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function WarningIcon({ size = 20, color = '#D97706' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 9v4M12 17h.01" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function NoSWaIcon({ size = 20, color = '#DC2626' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" />
      <Path d="M5.5 21v-2a4 4 0 014-4h5a4 4 0 014 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M3 3l18 18" stroke={color} strokeWidth="2" strokeLinecap="round" />
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


export function MainWarehouseAdminScreen({ onBack }: { onBack: () => void }) {
  const [showList, setShowList] = useState(false);
  const [showAddScreen, setShowAddScreen] = useState(false);
  const [showManageSWAs, setShowManageSWAs] = useState(false);

  if (showManageSWAs) {
    return <MainWarehouseManageSWAsScreen onBack={() => setShowManageSWAs(false)} />;
  }

  if (showAddScreen) {
    return <MainWarehouseAddScreen onBack={() => setShowAddScreen(false)} />;
  }

  if (showList) {
    return <MainWarehouseListScreen onBack={() => setShowList(false)} />;
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerOrange} />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <WarehouseIcon size={20} />
            <Text style={styles.headerTitle}>Warehouse Management</Text>
          </View>
          <TouchableOpacity style={styles.bellBtn} activeOpacity={0.8}>
            <BellIcon />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.warehouseDropdown} activeOpacity={0.8}>
          <WarehouseIcon />
          <Text style={styles.warehouseText}>All Warehouses</Text>
          <ChevronDownIcon />
        </TouchableOpacity>
      </View>

      <View style={styles.mainContainer}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>TOTAL WAREHOUSES</Text>
              <Text style={styles.statValue}>4</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>ACTIVE</Text>
              <Text style={styles.statValue}>4</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>NEEDS ATTENTION</Text>
              <Text style={[styles.statValue, {color: PALETTE.warningText}]}>2</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>PENDING SWA</Text>
              <Text style={[styles.statValue, {color: '#DC2626'}]}>3</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Warehouse Overview</Text>
          <View style={styles.overviewCard}>
            <View style={styles.overviewHeaderRow}>
              <Text style={styles.overviewTitle}>Ooty</Text>
              <View style={styles.tagGreen}><Text style={styles.tagGreenText}>Active</Text></View>
            </View>
            <View style={styles.overviewStatsRow}>
              <View style={styles.overviewCol}>
                <Text style={styles.overviewStatVal}>68%</Text>
                <Text style={styles.overviewStatLabel}>Capacity</Text>
              </View>
              <View style={styles.overviewCol}>
                <Text style={styles.overviewStatVal}>4,820 kg</Text>
                <Text style={styles.overviewStatLabel}>Inventory</Text>
              </View>
              <View style={styles.overviewCol}>
                <Text style={styles.overviewStatVal}>SWA-01</Text>
                <Text style={styles.overviewStatLabel}>SWA</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.overviewCard}>
            <View style={styles.overviewHeaderRow}>
              <Text style={styles.overviewTitle}>Gudalur Market</Text>
              <View style={styles.tagWarning}><Text style={styles.tagWarningText}>Near Capacity</Text></View>
            </View>
            <View style={styles.overviewStatsRow}>
              <View style={styles.overviewCol}>
                <Text style={styles.overviewStatVal}>81%</Text>
                <Text style={styles.overviewStatLabel}>Capacity</Text>
              </View>
              <View style={styles.overviewCol}>
                <Text style={styles.overviewStatVal}>6,120 kg</Text>
                <Text style={styles.overviewStatLabel}>Inventory</Text>
              </View>
              <View style={styles.overviewCol}>
                <Text style={styles.overviewStatVal}>Unassigned</Text>
                <Text style={styles.overviewStatLabel}>SWA</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Needs Attention</Text>
          <View style={[styles.attentionCard, {borderLeftColor: '#D97706', borderLeftWidth: 4}]}>
            <View style={styles.attentionIcon}><WarningIcon /></View>
            <View style={{flex: 1}}>
              <Text style={styles.attentionTitle}>Gudalur Market nearing capacity</Text>
              <Text style={styles.attentionDesc}>81% utilization</Text>
            </View>
          </View>
          <View style={[styles.attentionCard, {borderLeftColor: '#DC2626', borderLeftWidth: 4}]}>
            <View style={styles.attentionIcon}><NoSWaIcon /></View>
            <View style={{flex: 1}}>
              <Text style={styles.attentionTitle}>Gudalur Market has no assigned SWA</Text>
              <Text style={styles.attentionDesc}>Create a Sub Warehouse Admin</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={() => setShowAddScreen(true)} activeOpacity={0.8}>
              <View style={{marginBottom: 8}}><AddWarehouseIcon /></View>
              <Text style={styles.actionLabel}>Add Warehouse</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => setShowManageSWAs(true)} activeOpacity={0.8}>
              <View style={{marginBottom: 8}}><ManageSWAsIcon /></View>
              <Text style={styles.actionLabel}>Manage SWAs</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => setShowList(true)} activeOpacity={0.8}>
              <View style={{marginBottom: 8}}><WarehouseListIcon /></View>
              <Text style={styles.actionLabel}>Warehouse List</Text>
            </TouchableOpacity>
          </View>
          
        </ScrollView>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem}>
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
        <TouchableOpacity style={styles.tabItem} onPress={onBack}>
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
  headerTitle: { fontFamily: 'Poppins', fontSize: 18, fontWeight: '800', color: '#FFFFFF', marginLeft: 12 },
  bellBtn: {
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
  
  mainContainer: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },
  
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 },
  statCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    width: '48%',
    marginBottom: 12,
  },
  statLabel: { fontFamily: 'Poppins', fontSize: 10, fontWeight: '800', color: PALETTE.textSecondary, marginBottom: 8 },
  statValue: { fontFamily: 'Poppins', fontSize: 18, fontWeight: '800', color: '#000' },

  sectionTitle: { fontFamily: 'Poppins', fontSize: 14, fontWeight: '800', color: '#8A5A30', marginBottom: 12, marginTop: 8 },
  
  overviewCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 16,
  },
  overviewHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  overviewTitle: { fontFamily: 'Poppins', fontSize: 14, fontWeight: '800', color: '#000' },
  tagGreen: { backgroundColor: PALETTE.greenBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tagGreenText: { fontFamily: 'Poppins', fontSize: 10, fontWeight: '800', color: PALETTE.greenText },
  tagWarning: { backgroundColor: PALETTE.warningBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tagWarningText: { fontFamily: 'Poppins', fontSize: 10, fontWeight: '800', color: PALETTE.warningText },
  
  overviewStatsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: PALETTE.border, paddingTop: 16 },
  overviewCol: { flex: 1, alignItems: 'center' },
  overviewStatVal: { fontFamily: 'Poppins', fontSize: 13, fontWeight: '800', color: '#000', marginBottom: 2 },
  overviewStatLabel: { fontFamily: 'Poppins', fontSize: 10, color: '#666' },

  attentionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 12,
  },
  attentionIcon: { marginRight: 12 },
  attentionTitle: { fontFamily: 'Poppins', fontSize: 13, fontWeight: '800', color: '#000', marginBottom: 2 },
  attentionDesc: { fontFamily: 'Poppins', fontSize: 11, color: '#666' },

  actionsGrid: { flexDirection: 'row', gap: 12 },
  actionCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    alignItems: 'center',
  },
  actionLabel: { fontFamily: 'Poppins', fontSize: 11, fontWeight: '800', color: '#000', textAlign: 'center' },

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
