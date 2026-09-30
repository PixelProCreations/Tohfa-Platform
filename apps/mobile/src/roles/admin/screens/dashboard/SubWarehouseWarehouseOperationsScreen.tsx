import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

const PALETTE = {
  primary: '#F0562A',
  pageBg: '#FAF7F2',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#7A726C',
  textMuted: '#9E9690',
  border: '#EBE5DC',
  redText: '#DC2626',
  whiteText: '#FFFFFF',
  redIconBg: '#FEE2E2',
  amberIconBg: '#FEF3C7',
};

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function GridMenuHeaderIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="7" r="2.5" stroke={color} strokeWidth="2" />
      <Path d="M12 11c-2.5 0-4.5 1.5-4.5 3.5V17h9v-2.5c0-2-2-3.5-4.5-3.5z" stroke={color} strokeWidth="2" />
      <Path d="M17.5 8.5c-.8 0-1.5.7-1.5 1.5 0 .3.1.6.3.8l-1.1 1.1c-.2-.1-.4-.2-.7-.2-.8 0-1.5.7-1.5 1.5s.7 1.5 1.5 1.5 1.5-.7 1.5-1.5c0-.2-.1-.5-.2-.7l1.1-1.1c.2.1.5.2.8.2.8 0 1.5-.7 1.5-1.5s-.7-1.5-1.5-1.5z" stroke={color} strokeWidth="1.5" />
      <Circle cx="7.5" cy="11.5" r="1.5" stroke={color} strokeWidth="1.5" />
    </Svg>
  );
}

function BellHeaderIcon() {
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LockBadgeIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" stroke="#FFFFFF" strokeWidth="2.2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function ChevronRight() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function StorageIcon({ color = '#B45309' }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M4 4h16v16H4V4zM4 12h16M12 4v16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CircularProgressIcon({ color = '#B45309' }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ClipboardIcon({ color = '#B45309' }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Rect x="8" y="2" width="8" height="4" rx="1" stroke={color} strokeWidth="2" />
      <Path d="M9 14l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WarningCircleIcon({ color = '#B45309' }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 8v4M12 16h.01" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function StaffBadgeIcon({ color = '#B45309' }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="10" r="2.5" stroke={color} strokeWidth="2" />
      <Path d="M7 17v-1.5c0-1.5 2-2.5 5-2.5s5 1 5 2.5V17" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function CalendarIcon({ color = '#B45309' }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke={color} strokeWidth="2" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DownloadBoxIcon({ color = '#0D9488' }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChecklistIcon({ color = '#0D9488' }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M9 11l3 3L22 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ErrorIcon({ color = '#DC2626' }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 8v4M12 16h.01" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MaintenanceIcon({ color = '#DC2626' }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LocationIssueIcon({ color = '#DC2626' }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M4 4h16v16H4V4z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 12h16M12 4v16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function HomeTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.textSecondary;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 22V12h6v10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReceivingTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.textSecondary;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InventoryTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.textSecondary;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <Path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MoreTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.textSecondary;
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

export type SubWHTab = 'Home' | 'Receiving' | 'Inventory' | 'More';

export interface SubWarehouseWarehouseOperationsScreenProps {
  onBack: () => void;
  onTabChange?: (tab: SubWHTab) => void;
  onNavigateToStorageLocations?: () => void;
  onNavigateToCapacity?: () => void;
  onNavigateToMaterialHandling?: () => void;
  onNavigateToOperationalIssues?: () => void;
}

export function SubWarehouseWarehouseOperationsScreen({
  onBack,
  onTabChange,
  onNavigateToStorageLocations,
  onNavigateToCapacity,
  onNavigateToMaterialHandling,
  onNavigateToOperationalIssues,
}: SubWarehouseWarehouseOperationsScreenProps) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerLeftGroup}>
            <View style={styles.headerTitleRow}>
              <GridMenuHeaderIcon size={24} color="#FFFFFF" />
              <Text style={styles.headerTitleText}>Warehouse Operations</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.headerBellBtn} activeOpacity={0.8}>
            <BellHeaderIcon />
          </TouchableOpacity>
        </View>
        <View style={styles.warehouseBadgeRow}>
          <View style={styles.warehouseBadge}>
            <LockBadgeIcon />
            <Text style={styles.warehouseBadgeText}>Coonoor Warehouse · Operational</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        
        {/* Operations Overview */}
        <Text style={styles.sectionTitle}>Operations Overview</Text>
        <View style={styles.overviewGrid}>
          <View style={styles.overviewCard}>
            <View style={styles.cardIconWrap}><StorageIcon /></View>
            <Text style={styles.cardVal}>18</Text>
            <Text style={styles.cardLabel}>Storage Locations</Text>
          </View>
          <View style={styles.overviewCard}>
            <View style={styles.cardIconWrap}><CircularProgressIcon /></View>
            <Text style={styles.cardVal}>68%</Text>
            <Text style={styles.cardLabel}>Current Occupancy</Text>
          </View>
          <View style={styles.overviewCard}>
            <View style={styles.cardIconWrap}><ClipboardIcon /></View>
            <Text style={styles.cardVal}>42</Text>
            <Text style={styles.cardLabel}>Material Items</Text>
          </View>
          <View style={styles.overviewCard}>
            <View style={styles.cardIconWrap}><WarningCircleIcon /></View>
            <Text style={[styles.cardVal, { color: PALETTE.redText }]}>3</Text>
            <Text style={styles.cardLabel}>Pending Issues</Text>
          </View>
          <View style={styles.overviewCard}>
            <View style={styles.cardIconWrap}><StaffBadgeIcon /></View>
            <Text style={styles.cardVal}>8 / 10</Text>
            <Text style={styles.cardLabel}>Staff Present</Text>
          </View>
          <View style={styles.overviewCard}>
            <View style={styles.cardIconWrap}><CalendarIcon /></View>
            <Text style={styles.cardVal}>24</Text>
            <Text style={styles.cardLabel}>Today's Activities</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.qaCard} onPress={onNavigateToStorageLocations}>
            <View style={styles.qaIcon}><StorageIcon color={PALETTE.primary} /></View>
            <Text style={styles.qaLabel}>Storage Locations</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.qaCard} onPress={onNavigateToMaterialHandling}>
            <View style={styles.qaIcon}><ClipboardIcon color={PALETTE.primary} /></View>
            <Text style={styles.qaLabel}>Material Handling</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.qaCard} onPress={onNavigateToCapacity}>
            <View style={styles.qaIcon}><CircularProgressIcon color={PALETTE.primary} /></View>
            <Text style={styles.qaLabel}>View Capacity</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.qaCard} onPress={onNavigateToOperationalIssues}>
            <View style={styles.qaIcon}><ErrorIcon color={PALETTE.primary} /></View>
            <Text style={styles.qaLabel}>Report Issue</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.qaCard}>
            <View style={styles.qaIcon}><StaffBadgeIcon color={PALETTE.primary} /></View>
            <Text style={styles.qaLabel}>Staff Attendance</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.qaCard}>
            <View style={styles.qaIcon}><DownloadBoxIcon color={PALETTE.primary} /></View>
            <Text style={styles.qaLabel}>Receive Goods</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.largeBtn}>
          <ChecklistIcon color="#0D9488" />
          <Text style={styles.largeBtnText}>Stock Verification (Module 3)</Text>
        </TouchableOpacity>

        {/* Today's Operational Status */}
        <Text style={styles.sectionTitle}>Today's Operational Status</Text>
        <View style={styles.opStatusGrid}>
          <View style={styles.opStatusCard}>
            <Text style={styles.opStatusVal}>3</Text>
            <Text style={styles.opStatusLabel}>RECEIVING · SHIPMENTS</Text>
          </View>
          <View style={styles.opStatusCard}>
            <Text style={styles.opStatusVal}>5</Text>
            <Text style={styles.opStatusLabel}>STORAGE · MOVEMENTS</Text>
          </View>
          <View style={styles.opStatusCard}>
            <Text style={styles.opStatusVal}>2</Text>
            <Text style={styles.opStatusLabel}>VERIFICATION · PENDING</Text>
          </View>
          <View style={styles.opStatusCard}>
            <Text style={styles.opStatusVal}>3</Text>
            <Text style={styles.opStatusLabel}>ISSUES · OPEN</Text>
          </View>
        </View>

        {/* Needs Attention */}
        <View style={styles.flexRowBetween}>
          <View style={styles.flexRow}>
            <WarningCircleIcon color="#1E1612" />
            <Text style={[styles.sectionTitle, { marginTop: 0, marginLeft: 6 }]}>Needs Attention</Text>
          </View>
        </View>

        <View style={styles.attentionList}>
          <TouchableOpacity style={[styles.attentionCard, { borderLeftColor: '#DC2626' }]}>
            <View style={styles.attentionIcon}><LocationIssueIcon color="#DC2626" /></View>
            <View style={styles.attentionTextWrap}>
              <Text style={styles.attentionTitle}>Storage Location Issue</Text>
              <Text style={styles.attentionSub}>Rack A-03 requires attention</Text>
            </View>
            <ChevronRight />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.attentionCard, { borderLeftColor: '#D97706' }]}>
            <View style={styles.attentionIcon}><ClipboardIcon color="#D97706" /></View>
            <View style={styles.attentionTextWrap}>
              <Text style={styles.attentionTitle}>Material Low</Text>
              <Text style={styles.attentionSub}>Packaging boxes</Text>
            </View>
            <ChevronRight />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.attentionCard, { borderLeftColor: '#DC2626' }]} onPress={onNavigateToOperationalIssues}>
            <View style={styles.attentionIcon}><MaintenanceIcon color="#DC2626" /></View>
            <View style={styles.attentionTextWrap}>
              <Text style={styles.attentionTitle}>Operational Issue</Text>
              <Text style={styles.attentionSub}>Cold storage maintenance</Text>
            </View>
            <ChevronRight />
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View style={styles.flexRowBetween}>
          <Text style={[styles.sectionTitle, { marginTop: 0 }]}>Recent Activity</Text>
          <Text style={styles.viewAllText}>View All</Text>
        </View>

        <View style={styles.activityList}>
          <View style={styles.activityCard}>
            <Text style={styles.activityTitle}>Goods Received</Text>
            <Text style={styles.activitySub}>GRN-00291 · 10:42 AM</Text>
          </View>
          <View style={styles.activityCard}>
            <Text style={styles.activityTitle}>Storage location updated</Text>
            <Text style={styles.activitySub}>Rack 02 · Cold Storage · 09:50 AM</Text>
          </View>
        </View>

      </ScrollView>

      {/* Bottom Nav */}
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
        <TouchableOpacity style={styles.navItem} activeOpacity={1}>
          <MoreTabIcon active={true} />
          <Text style={[styles.navLabel, styles.navLabelActive]}>More</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PALETTE.primary },
  headerBanner: { backgroundColor: PALETTE.primary, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  headerLeftGroup: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitleText: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  warehouseBadgeRow: { marginTop: 2 },
  warehouseBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, alignSelf: 'flex-start', gap: 6 },
  warehouseBadgeText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  headerBellBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },

  scroll: { flex: 1, backgroundColor: PALETTE.pageBg },
  scrollContent: { padding: 16, paddingBottom: 40 },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: PALETTE.textInk, marginTop: 8, marginBottom: 12 },
  flexRowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 12 },
  flexRow: { flexDirection: 'row', alignItems: 'center' },
  viewAllText: { fontSize: 13, fontWeight: '700', color: PALETTE.primary },

  overviewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  overviewCard: { width: '48%', backgroundColor: PALETTE.cardBg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: PALETTE.border },
  cardIconWrap: { marginBottom: 8 },
  cardVal: { fontSize: 24, fontWeight: '800', color: PALETTE.textInk },
  cardLabel: { fontSize: 13, fontWeight: '600', color: PALETTE.textSecondary, marginTop: 4 },

  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  qaCard: { width: '31%', backgroundColor: PALETTE.cardBg, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 4, alignItems: 'center', borderWidth: 1, borderColor: PALETTE.border },
  qaIcon: { marginBottom: 8 },
  qaLabel: { fontSize: 11, fontWeight: '700', color: PALETTE.textInk, textAlign: 'center' },

  largeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: PALETTE.cardBg, borderRadius: 12, paddingVertical: 16, borderWidth: 1, borderColor: PALETTE.border, gap: 10, marginBottom: 24 },
  largeBtnText: { fontSize: 14, fontWeight: '800', color: '#0F766E' },

  opStatusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  opStatusCard: { width: '48%', backgroundColor: PALETTE.cardBg, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: PALETTE.border },
  opStatusVal: { fontSize: 20, fontWeight: '800', color: PALETTE.textInk, marginBottom: 4 },
  opStatusLabel: { fontSize: 10, fontWeight: '700', color: PALETTE.textSecondary, letterSpacing: 0.5 },

  attentionList: { gap: 12, marginBottom: 24 },
  attentionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: PALETTE.cardBg, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: PALETTE.border, borderLeftWidth: 4 },
  attentionIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: PALETTE.pageBg, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  attentionTextWrap: { flex: 1 },
  attentionTitle: { fontSize: 15, fontWeight: '800', color: PALETTE.textInk, marginBottom: 2 },
  attentionSub: { fontSize: 13, color: PALETTE.textSecondary },

  activityList: { gap: 12 },
  activityCard: { backgroundColor: PALETTE.cardBg, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: PALETTE.border },
  activityTitle: { fontSize: 15, fontWeight: '800', color: PALETTE.textInk, marginBottom: 4 },
  activitySub: { fontSize: 13, color: PALETTE.textSecondary },

  bottomNav: { flexDirection: 'row', backgroundColor: PALETTE.cardBg, borderTopWidth: 1, borderTopColor: PALETTE.border, paddingVertical: 8, paddingBottom: 14, paddingHorizontal: 16, justifyContent: 'space-around', alignItems: 'center' },
  navItem: { alignItems: 'center', justifyContent: 'center', paddingVertical: 2, minWidth: 60 },
  navLabel: { fontSize: 11, fontWeight: '600', color: PALETTE.textSecondary, marginTop: 3 },
  navLabelActive: { color: PALETTE.primary, fontWeight: '700' },
});
