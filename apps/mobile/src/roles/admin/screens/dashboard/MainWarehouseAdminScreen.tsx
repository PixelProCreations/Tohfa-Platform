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
import {
  adminColors,
  adminRadius,
  adminSpacing,
  adminType,
} from '../../theme';
import { OverviewDashboardCard } from '../../components';
import { MainWarehouseListScreen, type WarehouseListItem } from './MainWarehouseListScreen';
import { MainWarehouseDetailScreen } from './MainWarehouseDetailScreen';
import { MainWarehouseAddScreen, type AddedWarehouseData } from './MainWarehouseAddScreen';
import { MainWarehouseManageSWAsScreen } from './MainWarehouseManageSWAsScreen';
import { NotificationsScreen } from '../warehouse/notifications/NotificationsScreen';
import { NotificationSettingsScreen } from '../warehouse/profile-settings/NotificationSettingsScreen';
import { defaultNotifications } from '../warehouse/notifications/fixtures';
import { WarehouseSelector } from '../warehouse/inventory';
import { WarehouseEditProfileScreen } from '../warehouse/profile-settings/WarehouseEditProfileScreen';
import { WarehouseAdminFlow } from '../warehouse/warehouse-admin/WarehouseAdminFlow';
import type { NotificationItem, WarehouseScope } from '../warehouse/notifications/types';

const MAIN_SCOPE: WarehouseScope = {
  warehouseId: undefined,
  warehouseName: 'All Warehouses',
};

function BellIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ArrowBackIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
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

function WarehouseIcon({ color = adminColors.onBrand, size = 16 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronDownIcon({ color = adminColors.onBrand, size = 16 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function AddWarehouseIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 11v6M9 14h6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ManageSWAsIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" />
      <Path d="M17 11v6M14 14h6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M9 14c-4.42 0-8 2.24-8 5v2h10" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function WarehouseListIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M8 9h8M8 13h8M8 17h8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}


function NoSWaIcon({ size = 20, color = adminColors.danger.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" />
      <Path d="M5.5 21v-2a4 4 0 014-4h5a4 4 0 014 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M3 3l18 18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export interface MainWarehouseItem {
  id: string;
  name: string;
  code: string;
  status: 'Active' | 'Near Capacity';
  capacity: string;
  stock: string;
  swa: string;
  staff: string;
  needsAttention?: boolean | undefined;
  attentionText?: string | undefined;
  attentionDesc?: string | undefined;
}

const MAIN_WAREHOUSES_DATA: MainWarehouseItem[] = [
  {
    id: 'WH-OOTY',
    name: 'Ooty',
    code: 'WH-001',
    status: 'Active',
    capacity: '68%',
    stock: '4,820 kg',
    swa: 'SWA-01',
    staff: '12',
  },
  {
    id: 'WH-COON',
    name: 'Coonoor',
    code: 'WH-002',
    status: 'Active',
    capacity: '74%',
    stock: '5,240 kg',
    swa: 'SWA-02',
    staff: '15',
  },
  {
    id: 'WH-KOTA',
    name: 'Kotagiri',
    code: 'WH-003',
    status: 'Active',
    capacity: '52%',
    stock: '2,320 kg',
    swa: 'SWA-03',
    staff: '8',
  },
  {
    id: 'WH-GUDA',
    name: 'Gudalur Market',
    code: 'WH-004',
    status: 'Near Capacity',
    capacity: '81%',
    stock: '6,120 kg',
    swa: 'Unassigned',
    staff: '6',
    needsAttention: true,
    attentionText: 'Gudalur Market has no assigned SWA',
    attentionDesc: 'Create a Sub Warehouse Admin',
  },
];

const INITIAL_WAREHOUSES: WarehouseListItem[] = [
  {
    name: 'Ooty',
    id: 'WH-001',
    location: 'Ooty, Nilgiris',
    status: 'Active',
    stock: '4,820 kg',
    capacity: '68%',
    staff: '12',
  },
  {
    name: 'Coonoor',
    id: 'WH-002',
    location: 'Coonoor, Nilgiris',
    status: 'Active',
    stock: '5,240 kg',
    capacity: '74%',
    staff: '15',
  },
  {
    name: 'Kotagiri',
    id: 'WH-003',
    location: 'Kotagiri, Nilgiris',
    status: 'Active',
    stock: '2,320 kg',
    capacity: '52%',
    staff: '8',
  },
  {
    name: 'Gudalur Market',
    id: 'WH-004',
    location: 'Gudalur, Nilgiris',
    status: 'Near Capacity',
    stock: '6,120 kg',
    capacity: '81%',
    staff: '6',
  },
];

export function MainWarehouseAdminScreen({ onBack }: { onBack: () => void }) {
  const [showWarehouseOverview, setShowWarehouseOverview] = useState(false);
  const [showList, setShowList] = useState(false);
  const [showAddScreen, setShowAddScreen] = useState(false);
  const [showManageSWAs, setShowManageSWAs] = useState(false);
  const [manageSWAView, setManageSWAView] = useState<'list' | 'detail'>('list');
  const [manageSWAAdminId, setManageSWAAdminId] = useState<string | undefined>(undefined);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [notificationsList, setNotificationsList] = useState<readonly NotificationItem[]>(() => defaultNotifications(MAIN_SCOPE));
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);
  const [warehouses, setWarehouses] = useState<WarehouseListItem[]>(INITIAL_WAREHOUSES);

  const handleWarehouseAdded = (newWh: AddedWarehouseData) => {
    setWarehouses((prev) => [
      ...prev,
      {
        name: newWh.name,
        id: newWh.id,
        location: newWh.location,
        status: newWh.status,
        stock: newWh.stock,
        capacity: newWh.capacity,
        staff: newWh.staff,
      },
    ]);
    setShowAddScreen(false);
    setShowList(true);
  };

  if (showWarehouseOverview) {
    return (
      <WarehouseAdminFlow
        scope={MAIN_SCOPE}
        can={() => true}
        initialScreen="WarehouseOverview"
        onBack={() => setShowWarehouseOverview(false)}
        onManageWarehouses={() => {
          setShowWarehouseOverview(false);
          setShowList(true);
        }}
      />
    );
  }

  if (showNotificationSettings) {
    return (
      <NotificationSettingsScreen
        scope={MAIN_SCOPE}
        can={() => true}
        onBack={() => setShowNotificationSettings(false)}
      />
    );
  }

  if (showNotifications) {
    return (
      <NotificationsScreen
        scope={MAIN_SCOPE}
        can={() => true}
        onBack={() => setShowNotifications(false)}
        notifications={notificationsList}
        onMarkAsRead={(id) => {
          setNotificationsList((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
        }}
        onMarkAllAsRead={() => {
          setNotificationsList((prev) => prev.map((n) => ({ ...n, isRead: true })));
        }}
        onSelectNotification={() => {}}
      />
    );
  }

  if (selectedWarehouse) {
    return <MainWarehouseDetailScreen onBack={() => setSelectedWarehouse(null)} warehouse={selectedWarehouse} />;
  }

  if (showManageSWAs) {
    return (
      <MainWarehouseManageSWAsScreen
        onBack={() => {
          setShowManageSWAs(false);
          setManageSWAView('list');
          setManageSWAAdminId(undefined);
        }}
        initialView={manageSWAView}
        initialAdminId={manageSWAAdminId}
      />
    );
  }

  if (showAddScreen) {
    return (
      <WarehouseEditProfileScreen
        scope={MAIN_SCOPE}
        mode="add"
        can={() => true}
        onBack={() => setShowAddScreen(false)}
        onSaveSuccess={() => {
          setShowAddScreen(false);
          setShowList(true);
        }}
      />
    );
  }

  if (showList) {
    return <MainWarehouseListScreen onBack={() => setShowList(false)} warehouses={warehouses} />;
  }

  // Filtered warehouses based on dropdown selection
  const displayedWarehouses = selectedWarehouseId === undefined
    ? MAIN_WAREHOUSES_DATA
    : MAIN_WAREHOUSES_DATA.filter((w) => w.id === selectedWarehouseId || w.code === selectedWarehouseId || w.name.toLowerCase() === selectedWarehouseId.toLowerCase());

  // Dynamic stats calculation
  const totalWh = displayedWarehouses.length;
  const activeWh = displayedWarehouses.filter((w) => w.status === 'Active' || w.status === 'Near Capacity').length;
  const needsAttentionCount = displayedWarehouses.filter((w) => w.needsAttention).length;
  const pendingSwaCount = displayedWarehouses.filter((w) => w.swa === 'Unassigned').length;

  const attentionItems = displayedWarehouses.filter((w) => w.needsAttention);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <ArrowBackIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Warehouse Management</Text>
          </View>
          <TouchableOpacity style={styles.bellBtn} activeOpacity={0.8} onPress={() => setShowNotifications(true)}>
            <BellIcon />
          </TouchableOpacity>
        </View>
        <WarehouseSelector
          scope={MAIN_SCOPE}
          selectedId={selectedWarehouseId}
          onSelect={(id) => {
            setSelectedWarehouseId(id);
          }}
        />
      </View>

      <View style={styles.mainContainer}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.statsGrid}>
            <OverviewDashboardCard
              value="4"
              title="Total Warehouses"
              subtitle="All locations"
              icon="box"
            />
            <OverviewDashboardCard
              value="4"
              title="Active"
              subtitle="Operational"
              icon="pickup"
              tone="success"
            />
            <OverviewDashboardCard
              value="1"
              title="Needs Attention"
              subtitle="Action required"
              icon="alert"
              tone="warning"
            />
            <OverviewDashboardCard
              value="1"
              title="Pending SWA"
              subtitle="Unassigned admin"
              icon="orders"
              tone="danger"
            />
          </View>

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Warehouse Overview</Text>
            <TouchableOpacity onPress={() => setShowWarehouseOverview(true)} activeOpacity={0.7}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {displayedWarehouses.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.overviewCard}
              onPress={() => setSelectedWarehouse(item.name)}
              activeOpacity={0.8}
            >
              <View style={styles.overviewHeaderRow}>
                <Text style={styles.overviewTitle}>{item.name}</Text>
                {item.status === 'Active' ? (
                  <View style={styles.tagGreen}><Text style={styles.tagGreenText}>Active</Text></View>
                ) : (
                  <View style={styles.tagWarning}><Text style={styles.tagWarningText}>Near Capacity</Text></View>
                )}
              </View>
              <View style={styles.overviewStatsRow}>
                <View style={styles.overviewCol}>
                  <Text style={styles.overviewStatVal}>{item.capacity}</Text>
                  <Text style={styles.overviewStatLabel}>Capacity</Text>
                </View>
                <View style={styles.overviewCol}>
                  <Text style={styles.overviewStatVal}>{item.stock}</Text>
                  <Text style={styles.overviewStatLabel}>Inventory</Text>
                </View>
                <View style={styles.overviewCol}>
                  <Text style={styles.overviewStatVal}>{item.swa}</Text>
                  <Text style={styles.overviewStatLabel}>SWA</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {attentionItems.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Needs Attention</Text>
              {attentionItems.map((att) => (
                <TouchableOpacity
                  key={att.id}
                  style={[styles.attentionCard, styles.attentionCardDanger]}
                  activeOpacity={0.8}
                  onPress={() => {
                    setManageSWAView('detail');
                    setManageSWAAdminId('4');
                    setShowManageSWAs(true);
                  }}
                >
                  <View style={styles.attentionIcon}><NoSWaIcon /></View>
                  <View style={styles.attentionTextWrap}>
                    <Text style={styles.attentionTitle}>{att.attentionText}</Text>
                    <Text style={styles.attentionDesc}>{att.attentionDesc}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}

          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={() => setShowAddScreen(true)} activeOpacity={0.8}>
              <View style={styles.actionIconWrap}><AddWarehouseIcon /></View>
              <Text style={styles.actionLabel}>Add Warehouse</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => {
                setManageSWAView('list');
                setManageSWAAdminId(undefined);
                setShowManageSWAs(true);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.actionIconWrap}><ManageSWAsIcon /></View>
              <Text style={styles.actionLabel}>Manage SWAs</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => setShowList(true)} activeOpacity={0.8}>
              <View style={styles.actionIconWrap}><WarehouseListIcon /></View>
              <Text style={styles.actionLabel}>Warehouse List</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: adminSpacing.lg }} />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminColors.canvas },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: adminSpacing.lg },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { ...adminType.title, color: adminColors.onBrand, marginLeft: adminSpacing.md },
  bellBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    padding: adminSpacing.sm,
    borderRadius: adminRadius.full,
  },
  warehouseDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.brandDeep,
    alignSelf: 'flex-start',
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    borderRadius: adminRadius.xs,
    gap: adminSpacing.sm,
  },
  warehouseText: { ...adminType.rowTitle, color: adminColors.onBrand },
  
  mainContainer: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: adminSpacing.lg, paddingBottom: adminSpacing.xl },
  
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10, marginBottom: adminSpacing.lg },
  statCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    width: '48%',
    marginBottom: adminSpacing.md,
  },
  statLabel: { ...adminType.caption, color: adminColors.muted, marginBottom: adminSpacing.sm },
  statValue: { ...adminType.title, color: adminColors.ink },
  statValueWarning: { color: adminColors.warning.text },
  statValueDanger: { color: adminColors.danger.text },

  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.md,
    marginTop: adminSpacing.sm,
  },
  sectionTitle: { ...adminType.sectionHead, color: adminColors.brandDeep, marginBottom: adminSpacing.md, marginTop: adminSpacing.sm },
  viewAllText: { ...adminType.rowTitle, color: adminColors.brand },
  
  overviewCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.lg,
  },
  overviewHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: adminSpacing.lg },
  overviewTitle: { ...adminType.rowTitle, color: adminColors.ink },
  tagGreen: { backgroundColor: adminColors.success.bg, paddingHorizontal: adminSpacing.sm, paddingVertical: adminSpacing.xs / 2, borderRadius: adminRadius.full },
  tagGreenText: { ...adminType.caption, color: adminColors.success.text },
  tagWarning: { backgroundColor: adminColors.warning.bg, paddingHorizontal: adminSpacing.sm, paddingVertical: adminSpacing.xs / 2, borderRadius: adminRadius.full },
  tagWarningText: { ...adminType.caption, color: adminColors.warning.text },
  
  overviewStatsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: adminColors.border, paddingTop: adminSpacing.lg },
  overviewCol: { flex: 1, alignItems: 'center' },
  overviewStatVal: { ...adminType.rowTitle, color: adminColors.ink, marginBottom: adminSpacing.xs / 2 },
  overviewStatLabel: { ...adminType.caption, color: adminColors.muted },

  attentionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
  },
  attentionCardWarning: {
    borderLeftColor: adminColors.warning.border,
    borderLeftWidth: 4,
  },
  attentionCardDanger: {
    borderLeftColor: adminColors.danger.border,
    borderLeftWidth: 4,
  },
  attentionIcon: { marginRight: adminSpacing.md },
  attentionTextWrap: { flex: 1 },
  attentionTitle: { ...adminType.rowTitle, color: adminColors.ink, marginBottom: adminSpacing.xs / 2 },
  attentionDesc: { ...adminType.rowMeta, color: adminColors.muted },

  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: adminSpacing.md,
  },
  actionCard: {
    width: '48%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.lg,
    paddingHorizontal: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconWrap: { marginBottom: adminSpacing.sm },
  actionLabel: { ...adminType.rowTitle, color: adminColors.ink, textAlign: 'center' },
});
