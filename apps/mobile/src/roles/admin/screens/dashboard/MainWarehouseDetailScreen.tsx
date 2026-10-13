import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import {
  adminColors,
  adminRadius,
  adminSpacing,
  adminType,
} from '../../theme';
import { makeCan, type Can } from '../../permissions/can';
import { DocumentsScreen } from '../warehouse/profile-settings';
import type { WarehouseScope } from '../warehouse/profile-settings/types';

/** Main Warehouse view: no warehouseId means every warehouse. */
const MAIN_WAREHOUSE_SCOPE: WarehouseScope = {};
/** No permission list is wired into this screen yet: fail closed (Documents is read-only and checks no code). */
const NO_PERMISSIONS: Can = makeCan();

function ArrowBackIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 12H4M10 18l-6-6 6-6" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DocumentIcon({ color = adminColors.brand }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

interface WarehouseDetailData {
  name: string;
  id: string;
  location: string;
  status: string;
  stock: string;
  utilization: string;
  receiving: string;
  orders: string;
  address: string;
  swa: string;
  staff: string;
}

const WAREHOUSE_DETAILS: Record<string, WarehouseDetailData> = {
  Ooty: {
    name: 'Ooty Warehouse',
    id: 'WH-001',
    location: 'Ooty, Nilgiris',
    status: 'Active',
    stock: '4,820 kg',
    utilization: '68%',
    receiving: '420 kg',
    orders: '86',
    address: 'Charing Cross, Ooty, Nilgiris - 643001',
    swa: 'SWA-01 (Arun)',
    staff: '12',
  },
  Coonoor: {
    name: 'Coonoor Warehouse',
    id: 'WH-002',
    location: 'Coonoor, Nilgiris',
    status: 'Active',
    stock: '5,240 kg',
    utilization: '74%',
    receiving: '380 kg',
    orders: '84',
    address: '14 Market Road, Coonoor, Tamil Nadu 643101',
    swa: 'Karthik Kumar',
    staff: '15',
  },
  'Gudalur Market': {
    name: 'Gudalur Market Warehouse',
    id: 'WH-003',
    location: 'Gudalur, Nilgiris',
    status: 'Near Capacity',
    stock: '6,120 kg',
    utilization: '81%',
    receiving: '360 kg',
    orders: '70',
    address: 'Gudalur Market, Gudalur, Nilgiris - 643212',
    swa: 'Unassigned',
    staff: '6',
  },
};

export function MainWarehouseDetailScreen({
  onBack,
  can = NO_PERMISSIONS,
  warehouse = 'Coonoor',
}: {
  onBack: () => void;
  can?: Can | undefined;
  warehouse?: string | undefined;
}) {
  const [showDocs, setShowDocs] = useState(false);
  const data = WAREHOUSE_DETAILS[warehouse] ?? WAREHOUSE_DETAILS['Coonoor']!;

  if (showDocs) {
    // MainWarehouseDocumentsScreen was absorbed into the shared DocumentsScreen (W4 part B).
    return <DocumentsScreen scope={MAIN_WAREHOUSE_SCOPE} can={can} onBack={() => setShowDocs(false)} />;
  }
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ArrowBackIcon />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Warehouse Detail</Text>
            <Text style={styles.headerSub}>{data.name}</Text>
          </View>
        </View>
      </View>

      <View style={styles.mainContainer}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Warehouse Name</Text>
                <Text style={styles.value}>{data.name}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Warehouse ID</Text>
                <Text style={styles.value}>{data.id}</Text>
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Location</Text>
                <Text style={styles.value}>{data.location}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Status</Text>
                <Text style={styles.value}>{data.status}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Operational KPIs</Text>
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>CURRENT STOCK</Text>
              <Text style={styles.kpiValue}>{data.stock}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>UTILIZATION</Text>
              <Text style={styles.kpiValue}>{data.utilization}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>TODAY'S RECEIVING</Text>
              <Text style={styles.kpiValue}>{data.receiving}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>TODAY'S ORDERS</Text>
              <Text style={styles.kpiValue}>{data.orders}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Warehouse Information</Text>
          <View style={styles.card}>
            <View style={{ marginBottom: adminSpacing.lg }}>
              <Text style={styles.label}>Address</Text>
              <Text style={styles.value}>{data.address}</Text>
            </View>
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Assigned SWA</Text>
                <Text style={styles.value}>{data.swa}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Staff Count</Text>
                <Text style={styles.value}>{data.staff}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={() => setShowDocs(true)} activeOpacity={0.8}>
              <View style={styles.actionIconWrap}><DocumentIcon /></View>
              <Text style={styles.actionLabel}>View Documents</Text>
            </TouchableOpacity>
          </View>

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
    paddingBottom: adminSpacing.lg,
  },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start' },
  backBtn: { marginRight: adminSpacing.lg, marginTop: adminSpacing.xs },
  headerTitle: { ...adminType.title, color: adminColors.onBrand },
  headerSub: { ...adminType.rowMeta, color: adminColors.brandTint, marginTop: adminSpacing.xs / 2 },
  
  mainContainer: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: adminSpacing.lg, paddingBottom: adminSpacing.xl },
  
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.lg,
  },
  row: { flexDirection: 'row', marginBottom: adminSpacing.lg },
  col: { flex: 1 },
  label: { ...adminType.rowMeta, color: adminColors.muted, marginBottom: adminSpacing.xs },
  value: { ...adminType.rowTitle, color: adminColors.ink },

  sectionTitle: { ...adminType.sectionHead, color: adminColors.brandDeep, marginBottom: adminSpacing.md, marginTop: adminSpacing.sm },
  
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: adminSpacing.lg },
  kpiCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    width: '48%',
    marginBottom: adminSpacing.md,
  },
  kpiLabel: { ...adminType.caption, color: adminColors.muted, marginBottom: adminSpacing.sm },
  kpiValue: { ...adminType.title, color: adminColors.ink },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: adminSpacing.md, marginBottom: adminSpacing.xl },
  actionCard: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.lg,
    width: '31%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconWrap: { marginBottom: adminSpacing.sm },
  actionLabel: { ...adminType.caption, color: adminColors.brandDeep, textAlign: 'center' },
});
