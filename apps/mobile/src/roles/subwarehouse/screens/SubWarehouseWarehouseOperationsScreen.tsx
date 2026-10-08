import React, { useEffect } from 'react';
import {
  BackHandler,
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

// ─── SVG Icons Matching Reference Design Exactly ────────────────────────────

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

function WorkerGearIcon({ size = 24, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Head */}
      <Circle cx="8" cy="7.5" r="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Torso */}
      <Path
        d="M2 18.5c0-3 2.5-5.5 6-5.5 1.5 0 2.8.5 3.8 1.4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Cog / Gear */}
      <Circle cx="17.5" cy="11.5" r="2.2" stroke={color} strokeWidth="1.8" />
      <Path
        d="M17.5 7.5v1.4M17.5 14.1v1.4M13.5 11.5h1.4M20.1 11.5h1.4M14.7 8.7l1 1M19.3 13.3l1 1M14.7 14.3l1-1M19.3 9.7l1-1"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
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

// Shelf Rack Icon (Used in Storage Locations)
function StorageRackIcon({ color = '#B45309', size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Upright posts */}
      <Path d="M4 3v18M20 3v18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Horizontal shelves */}
      <Path d="M4 6.5h16M4 13.5h16M4 20.5h16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Divider / Bin partitions */}
      <Path d="M10 6.5v7M15 13.5v7" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

// 4-Quadrant Segmented Circular Ring (Used in Current Occupancy / View Capacity)
function SegmentedRingIcon({ color = '#B45309', size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3a9 9 0 0 1 7.79 4.5" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      <Path d="M21 12a9 9 0 0 1-4.5 7.79" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      <Path d="M12 21a9 9 0 0 1-7.79-4.5" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      <Path d="M3 12a9 9 0 0 1 4.5-7.79" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    </Svg>
  );
}

// Clipboard with Checkmark (Used in Material Items / Material Handling)
function ClipboardCheckIcon({ color = '#B45309', size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect x="8" y="2" width="8" height="4" rx="1.2" stroke={color} strokeWidth="2" />
      <Path
        d="M9 13.5l2 2 4.5-4.5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ID Badge with Top Lanyard Clip (Used in Staff Present / Staff Attendance)
function StaffBadgeIdIcon({ color = '#B45309', size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Clip tab at top */}
      <Rect x="10" y="2" width="4" height="2.8" rx="0.8" stroke={color} strokeWidth="1.8" />
      {/* Badge outer rectangle */}
      <Rect x="4" y="5.2" width="16" height="15.8" rx="2.5" stroke={color} strokeWidth="2" />
      {/* Head */}
      <Circle cx="12" cy="11.5" r="2.3" stroke={color} strokeWidth="1.8" />
      {/* Shoulders */}
      <Path
        d="M8.2 18c0-1.8 1.7-3 3.8-3s3.8 1.2 3.8 3"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// Circle with Exclamation Mark (Report Issue)
function ReportIssueCircleIcon({ color = '#B45309', size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 7.5v5M12 16.5h.01" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    </Svg>
  );
}

// Receive Goods Box/Tray with Down Arrow (Teal #0D9488)
function ReceiveGoodsTrayIcon({ color = '#0D9488', size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 4v10M8 10l4 4 4-4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Square Checkbox with Checkmark (Teal #0D9488)
function StockVerificationCheckIcon({ color = '#0D9488', size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="3" stroke={color} strokeWidth="2" />
      <Path
        d="M7.5 12l3.2 3.2 5.8-6.4"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function MaintenanceIcon({ color = '#DC2626' }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LocationIssueIcon({ color = '#DC2626' }: { color?: string }) {
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
  onTabChange?: ((tab: SubWHTab) => void) | undefined;
  onNavigateToStorageLocations?: (() => void) | undefined;
  onNavigateToCapacity?: (() => void) | undefined;
  onNavigateToMaterialHandling?: (() => void) | undefined;
  onNavigateToOperationalIssues?: (() => void) | undefined;
  onNavigateToStaffAttendance?: (() => void) | undefined;
  onNavigateToReceiveGoods?: (() => void) | undefined;
  onNavigateToStockVerification?: (() => void) | undefined;
  onNavigateToTodayOperations?: (() => void) | undefined;
  onNavigateToWarehouseActivity?: (() => void) | undefined;
}

export function SubWarehouseWarehouseOperationsScreen({
  onBack,
  onTabChange,
  onNavigateToStorageLocations,
  onNavigateToCapacity,
  onNavigateToMaterialHandling,
  onNavigateToOperationalIssues,
  onNavigateToStaffAttendance,
  onNavigateToReceiveGoods,
  onNavigateToStockVerification,
  onNavigateToTodayOperations,
  onNavigateToWarehouseActivity,
}: SubWarehouseWarehouseOperationsScreenProps) {
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (onBack) {
        onBack();
        return true;
      }
      return false;
    });
    return () => backHandler.remove();
  }, [onBack]);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerLeftGroup}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack || (() => onTabChange?.('Home'))}
              activeOpacity={0.75}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <ArrowBackIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerTitleRow}>
              <WorkerGearIcon size={24} color="#FFFFFF" />
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
        
        {/* Operations Overview (2x2 Grid) */}
        <Text style={styles.sectionTitle}>Operations Overview</Text>
        <View style={styles.overviewGrid}>
          {/* Card 1: Storage Locations */}
          <TouchableOpacity
            style={styles.overviewCard}
            onPress={onNavigateToStorageLocations}
            activeOpacity={0.75}
          >
            <View style={styles.cardIconWrap}>
              <StorageRackIcon color="#B45309" size={22} />
            </View>
            <Text style={styles.cardVal}>18</Text>
            <Text style={styles.cardLabel}>Storage Locations</Text>
          </TouchableOpacity>

          {/* Card 2: Current Occupancy */}
          <TouchableOpacity
            style={styles.overviewCard}
            onPress={onNavigateToCapacity}
            activeOpacity={0.75}
          >
            <View style={styles.cardIconWrap}>
              <SegmentedRingIcon color="#B45309" size={22} />
            </View>
            <Text style={styles.cardVal}>68%</Text>
            <Text style={styles.cardLabel}>Current Occupancy</Text>
          </TouchableOpacity>

          {/* Card 3: Material Items */}
          <TouchableOpacity
            style={styles.overviewCard}
            onPress={onNavigateToMaterialHandling}
            activeOpacity={0.75}
          >
            <View style={styles.cardIconWrap}>
              <ClipboardCheckIcon color="#B45309" size={22} />
            </View>
            <Text style={styles.cardVal}>42</Text>
            <Text style={styles.cardLabel}>Material Items</Text>
          </TouchableOpacity>

          {/* Card 4: Staff Present */}
          <TouchableOpacity
            style={styles.overviewCard}
            onPress={onNavigateToStaffAttendance}
            activeOpacity={0.75}
          >
            <View style={styles.cardIconWrap}>
              <StaffBadgeIdIcon color="#B45309" size={22} />
            </View>
            <Text style={styles.cardVal}>8 / 10</Text>
            <Text style={styles.cardLabel}>Staff Present</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions (3x2 Grid + Wide Stock Verification Button) */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {/* Row 1, Card 1: Storage Locations */}
          <TouchableOpacity
            style={styles.qaCard}
            onPress={onNavigateToStorageLocations}
            activeOpacity={0.75}
          >
            <View style={styles.qaIcon}>
              <StorageRackIcon color={PALETTE.primary} size={22} />
            </View>
            <Text style={styles.qaLabel}>Storage Locations</Text>
          </TouchableOpacity>

          {/* Row 1, Card 2: Material Handling */}
          <TouchableOpacity
            style={styles.qaCard}
            onPress={onNavigateToMaterialHandling}
            activeOpacity={0.75}
          >
            <View style={styles.qaIcon}>
              <ClipboardCheckIcon color={PALETTE.primary} size={22} />
            </View>
            <Text style={styles.qaLabel}>Material Handling</Text>
          </TouchableOpacity>

          {/* Row 1, Card 3: View Capacity */}
          <TouchableOpacity
            style={styles.qaCard}
            onPress={onNavigateToCapacity}
            activeOpacity={0.75}
          >
            <View style={styles.qaIcon}>
              <SegmentedRingIcon color={PALETTE.primary} size={22} />
            </View>
            <Text style={styles.qaLabel}>View Capacity</Text>
          </TouchableOpacity>

          {/* Row 2, Card 1: Report Issue */}
          <TouchableOpacity
            style={styles.qaCard}
            onPress={onNavigateToOperationalIssues}
            activeOpacity={0.75}
          >
            <View style={styles.qaIcon}>
              <ReportIssueCircleIcon color={PALETTE.primary} size={22} />
            </View>
            <Text style={styles.qaLabel}>Report Issue</Text>
          </TouchableOpacity>

          {/* Row 2, Card 2: Staff Attendance */}
          <TouchableOpacity
            style={styles.qaCard}
            onPress={onNavigateToStaffAttendance}
            activeOpacity={0.75}
          >
            <View style={styles.qaIcon}>
              <StaffBadgeIdIcon color={PALETTE.primary} size={22} />
            </View>
            <Text style={styles.qaLabel}>Staff Attendance</Text>
          </TouchableOpacity>

          {/* Row 2, Card 3: Receive Goods (Teal #0D9488) */}
          <TouchableOpacity
            style={styles.qaCard}
            onPress={() => {
              if (onNavigateToReceiveGoods) {
                onNavigateToReceiveGoods();
              } else {
                onTabChange?.('Receiving');
              }
            }}
            activeOpacity={0.75}
          >
            <View style={styles.qaIcon}>
              <ReceiveGoodsTrayIcon color="#0D9488" size={22} />
            </View>
            <Text style={styles.qaLabel}>Receive Goods</Text>
          </TouchableOpacity>
        </View>

        {/* Full-width Stock Verification Button (Teal #0D9488, no "(Module 3)" text) */}
        <TouchableOpacity
          style={styles.stockVerificationBtn}
          onPress={() => {
            if (onNavigateToStockVerification) {
              onNavigateToStockVerification();
            } else {
              onTabChange?.('Inventory');
            }
          }}
          activeOpacity={0.8}
        >
          <StockVerificationCheckIcon color="#0D9488" size={18} />
          <Text style={styles.stockVerificationText}>Stock Verification</Text>
        </TouchableOpacity>

        {/* Today's Operational Status with View All */}
        <View style={[styles.flexRowBetween, { marginTop: 20, marginBottom: 12 }]}>
          <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: 0 }]}>Today's Operational Status</Text>
          <TouchableOpacity onPress={onNavigateToTodayOperations || onNavigateToWarehouseActivity} activeOpacity={0.7}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
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
            <ReportIssueCircleIcon color="#1E1612" size={18} />
            <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: 0, marginLeft: 6 }]}>Needs Attention</Text>
          </View>
        </View>

        <View style={styles.attentionList}>
          <TouchableOpacity 
            style={[styles.attentionCard, styles.attentionCardRed]} 
            onPress={onNavigateToStorageLocations}
          >
            <View style={[styles.attentionIcon, { backgroundColor: '#FEE2E2' }]}><LocationIssueIcon color="#DC2626" /></View>
            <View style={styles.attentionTextWrap}>
              <Text style={styles.attentionTitle}>Storage Location Issue</Text>
              <Text style={styles.attentionSub}>Rack A-03 requires attention</Text>
            </View>
            <ChevronRight />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.attentionCard, styles.attentionCardAmber]}
            onPress={onNavigateToMaterialHandling}
            activeOpacity={0.75}
          >
            <View style={[styles.attentionIcon, { backgroundColor: '#FEF3C7' }]}><ClipboardCheckIcon color="#D97706" size={20} /></View>
            <View style={styles.attentionTextWrap}>
              <Text style={styles.attentionTitle}>Material Low</Text>
              <Text style={styles.attentionSub}>Packaging boxes</Text>
            </View>
            <ChevronRight />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.attentionCard, styles.attentionCardRed]} 
            onPress={onNavigateToOperationalIssues}
          >
            <View style={[styles.attentionIcon, { backgroundColor: '#FEE2E2' }]}><MaintenanceIcon color="#DC2626" /></View>
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
          <TouchableOpacity onPress={onNavigateToWarehouseActivity}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
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
  headerBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  backButton: {
    padding: 4,
    marginRight: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitleText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  warehouseBadgeRow: {
    marginTop: 2,
  },
  warehouseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
  },
  warehouseBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  headerBellBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: { flex: 1, backgroundColor: PALETTE.pageBg },
  scrollContent: { padding: 16, paddingBottom: 40 },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginTop: 8,
    marginBottom: 12,
  },
  flexRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  flexRow: { flexDirection: 'row', alignItems: 'center' },
  viewAllText: { fontSize: 13, fontWeight: '700', color: PALETTE.primary },

  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    marginBottom: 18,
  },
  overviewCard: {
    width: '48%',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardIconWrap: { marginBottom: 10 },
  cardVal: { fontSize: 24, fontWeight: '800', color: PALETTE.textInk },
  cardLabel: { fontSize: 13, fontWeight: '600', color: PALETTE.textSecondary, marginTop: 4 },

  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginBottom: 12,
  },
  qaCard: {
    width: '31.5%',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  qaIcon: {
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    height: 24,
  },
  qaLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.textInk,
    textAlign: 'center',
    lineHeight: 14,
  },

  stockVerificationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    gap: 8,
    marginBottom: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  stockVerificationText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F766E',
  },

  opStatusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginBottom: 16,
  },
  opStatusCard: {
    width: '48%',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  opStatusVal: { fontSize: 20, fontWeight: '800', color: PALETTE.textInk, marginBottom: 4 },
  opStatusLabel: { fontSize: 10, fontWeight: '700', color: PALETTE.textSecondary, letterSpacing: 0.5 },

  attentionList: { gap: 12, marginBottom: 24 },
  attentionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderLeftWidth: 6,
  },
  attentionCardRed: {
    borderLeftColor: '#DC2626',
    shadowColor: '#DC2626',
    shadowOffset: { width: -3, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 5,
  },
  attentionCardAmber: {
    borderLeftColor: '#D97706',
    shadowColor: '#D97706',
    shadowOffset: { width: -3, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 5,
  },
  attentionIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: PALETTE.pageBg, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  attentionTextWrap: { flex: 1 },
  attentionTitle: { fontSize: 15, fontWeight: '800', color: PALETTE.textInk, marginBottom: 2 },
  attentionSub: { fontSize: 13, color: PALETTE.textSecondary },

  activityList: { gap: 12 },
  activityCard: { backgroundColor: PALETTE.cardBg, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: PALETTE.border },
  activityTitle: { fontSize: 15, fontWeight: '800', color: PALETTE.textInk, marginBottom: 4 },
  activitySub: { fontSize: 13, color: PALETTE.textSecondary },

  bottomNav: {
    flexDirection: 'row',
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
    paddingVertical: 8,
    paddingBottom: 14,
    paddingHorizontal: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: { alignItems: 'center', justifyContent: 'center', paddingVertical: 2, minWidth: 60 },
  navLabel: { fontSize: 11, fontWeight: '600', color: PALETTE.textSecondary, marginTop: 3 },
  navLabelActive: { color: PALETTE.primary, fontWeight: '700' },
});
