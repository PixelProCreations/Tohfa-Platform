import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// ─── Design Tokens (#F0562A Subwarehouse Brand Palette) ───────────────────────
const PALETTE = {
  primary:       '#F0562A',
  primaryDark:   '#D4451B',
  primarySoft:   '#FEF1EC',
  primaryBorder: '#FCD9CE',
  pageBg:        '#FAF7F2',
  cardBg:        '#FFFFFF',
  textInk:       '#1E1612',
  textSecondary: '#7A726C',
  textMuted:     '#9E9690',
  border:        '#EBE5DC',
  divider:       '#F0ECE6',
  trackBg:       '#EAE4DB',

  // Status & Notice
  operationalDot: '#10B981',
  noticeBg:       '#FFF6ED',
  noticeBorder:   '#FCD9CE',
  noticeText:     '#8A4A1B',
  noticeIcon:     '#C25E1A',

  tabInactive:    '#827A74',
  tabBorder:      '#EAE4DB',
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────

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

function MapPinIcon({ size = 16, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21c4-4 7-7.582 7-11a7 7 0 1 0-14 0c0 3.418 3 7 7 11z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function InventoryActionIcon({ size = 20, color = '#8A4A1B' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3m18 0v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8m18 0H3m7 4h4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ReceivingActionIcon({ size = 20, color = '#8A4A1B' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M12 3v12m0 0l4-4m-4 4l-4-4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function OrdersActionIcon({ size = 20, color = '#8A4A1B' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 5h6m-6 9h6m-6 4h4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function OperationsActionIcon({ size = 20, color = '#8A4A1B' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" />
      <Path
        d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function LockNoticeIcon({ size = 18, color = PALETTE.noticeIcon }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" stroke={color} strokeWidth="2.2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Bottom Tab Icons ─────────────────────────────────────────────────────────

function HomeTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 21V12h6v9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReceivingTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M12 3v12m0 0l4-4m-4 4l-4-4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function InventoryTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3m18 0v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8m18 0H3m7 4h4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function MoreTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="5" cy="5" r="1.5" fill={color} />
      <Circle cx="12" cy="5" r="1.5" fill={color} />
      <Circle cx="19" cy="5" r="1.5" fill={color} />
      <Circle cx="5" cy="12" r="1.5" fill={color} />
      <Circle cx="12" cy="12" r="1.5" fill={color} />
      <Circle cx="19" cy="12" r="1.5" fill={color} />
      <Circle cx="5" cy="19" r="1.5" fill={color} />
      <Circle cx="12" cy="19" r="1.5" fill={color} />
      <Circle cx="19" cy="19" r="1.5" fill={color} />
    </Svg>
  );
}

// ─── Component Props ──────────────────────────────────────────────────────────

export interface SubWarehouseOverviewScreenProps {
  warehouseName?: string;
  warehouseId?: string;
  onBack?: () => void;
  onTabChange?: (tab: 'Home' | 'Receiving' | 'Inventory' | 'More') => void;
  onNavigateToInventory?: () => void;
  onNavigateToReceiving?: () => void;
  onNavigateToOrders?: () => void;
  onNavigateToOperations?: () => void;
}

export function SubWarehouseOverviewScreen({
  warehouseName = 'Coonoor Warehouse',
  warehouseId = 'COO-WH-001',
  onBack,
  onTabChange,
  onNavigateToInventory,
  onNavigateToReceiving,
  onNavigateToOrders,
  onNavigateToOperations,
}: SubWarehouseOverviewScreenProps) {
  const [activeTab, setActiveTab] = useState<'Home' | 'Receiving' | 'Inventory' | 'More'>('Home');
  const [showMapModal, setShowMapModal] = useState(false);

  const handleTabPress = (tab: 'Home' | 'Receiving' | 'Inventory' | 'More') => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const handleOpenMap = () => {
    setShowMapModal(true);
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Top Brand Header ─── */}
        <View style={styles.headerBanner}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => {
                if (onBack) onBack();
              }}
              activeOpacity={0.8}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel="Go back"
            >
              <ArrowBackIcon size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerTitlesContainer}>
              <Text style={styles.headerMainTitle}>Warehouse Overview</Text>
              <Text style={styles.headerSubtitle}>{warehouseName} · ▪ Operational</Text>
            </View>
          </View>
        </View>

        {/* ─── Main Content ─── */}
        <View style={styles.mainContainer}>
          {/* 1. Warehouse Identity */}
          <Text style={styles.sectionHeading}>Warehouse Identity</Text>
          <View style={styles.card}>
            <View style={styles.gridRow}>
              <View style={styles.gridCol}>
                <Text style={styles.fieldLabel}>Warehouse Name</Text>
                <Text style={styles.fieldValue}>{warehouseName}</Text>
              </View>
              <View style={styles.gridCol}>
                <Text style={styles.fieldLabel}>Warehouse ID</Text>
                <Text style={styles.fieldValue}>{warehouseId}</Text>
              </View>
            </View>

            <View style={{ height: 16 }} />

            <View style={styles.gridRow}>
              <View style={styles.gridCol}>
                <Text style={styles.fieldLabel}>Warehouse Type</Text>
                <Text style={styles.fieldValue}>Sub Warehouse</Text>
              </View>
              <View style={styles.gridCol}>
                <Text style={styles.fieldLabel}>Status</Text>
                <Text style={styles.fieldValue}>Operational</Text>
              </View>
            </View>
          </View>

          {/* 2. Current Snapshot */}
          <Text style={styles.sectionHeading}>Current Snapshot</Text>
          <View style={styles.snapshotGrid}>
            <View style={styles.snapshotRow}>
              <View style={styles.snapshotCard}>
                <Text style={styles.snapshotValue}>1,240 KG</Text>
                <Text style={styles.snapshotLabel}>TOTAL STOCK</Text>
              </View>
              <View style={styles.snapshotCard}>
                <Text style={styles.snapshotValue}>8</Text>
                <Text style={styles.snapshotLabel}>TODAY'S RECEIPTS</Text>
              </View>
            </View>

            <View style={styles.snapshotRow}>
              <View style={styles.snapshotCard}>
                <Text style={styles.snapshotValue}>24</Text>
                <Text style={styles.snapshotLabel}>TODAY'S ORDERS</Text>
              </View>
              <View style={styles.snapshotCard}>
                <Text style={styles.snapshotValue}>7</Text>
                <Text style={styles.snapshotLabel}>PENDING FULFILLMENT</Text>
              </View>
            </View>
          </View>

          {/* 3. Location */}
          <Text style={styles.sectionHeading}>Location</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Address</Text>
            <Text style={[styles.fieldValue, { marginTop: 4, marginBottom: 12 }]}>
              Coonoor, Nilgiris, Tamil Nadu
            </Text>

            <TouchableOpacity
              style={styles.viewOnMapBtn}
              onPress={handleOpenMap}
              activeOpacity={0.75}
            >
              <MapPinIcon size={16} color={PALETTE.primary} />
              <Text style={styles.viewOnMapText}>View on Map</Text>
            </TouchableOpacity>
          </View>

          {/* 4. Warehouse Contact */}
          <Text style={styles.sectionHeading}>Warehouse Contact</Text>
          <View style={styles.card}>
            <View style={styles.gridRow}>
              <View style={styles.gridCol}>
                <Text style={styles.fieldLabel}>Warehouse Contact</Text>
                <Text style={styles.fieldValue}>+91 XXXXX XXXXX</Text>
              </View>
              <View style={styles.gridCol}>
                <Text style={styles.fieldLabel}>Warehouse Email</Text>
                <Text style={styles.fieldValue} numberOfLines={1} ellipsizeMode="tail">
                  warehouse@tohfa...
                </Text>
              </View>
            </View>
          </View>

          {/* 5. Operating Information */}
          <Text style={styles.sectionHeading}>Operating Information</Text>
          <View style={styles.card}>
            <View style={styles.operatingRow}>
              <Text style={styles.operatingDay}>Monday – Saturday</Text>
              <Text style={styles.operatingTime}>08:00 AM – 06:00 PM</Text>
            </View>
            <View style={styles.dividerLine} />
            <View style={styles.operatingRow}>
              <Text style={styles.operatingDay}>Sunday</Text>
              <Text style={styles.operatingTime}>Closed</Text>
            </View>
          </View>

          {/* 6. Storage Summary */}
          <Text style={styles.sectionHeading}>Storage Summary</Text>
          <View style={styles.card}>
            <View style={styles.gridRow}>
              <View style={styles.gridCol}>
                <Text style={styles.fieldLabel}>Storage Locations</Text>
                <Text style={styles.storageNumber}>24</Text>
              </View>
              <View style={styles.gridCol}>
                <Text style={styles.fieldLabel}>Occupied</Text>
                <Text style={styles.storageNumber}>18</Text>
              </View>
            </View>

            {/* Storage Progress Bar */}
            <View style={styles.storageBarTrack}>
              <View style={[styles.storageBarFill, { width: '75%' }]} />
            </View>

            <View style={styles.storageMetaRow}>
              <Text style={styles.storageMetaText}>18 Occupied</Text>
              <Text style={styles.storageMetaText}>6 Available</Text>
            </View>
          </View>

          {/* 7. Quick Actions */}
          <Text style={styles.sectionHeading}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <View style={styles.quickActionsRow}>
              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => {
                  if (onNavigateToInventory) onNavigateToInventory();
                  else handleTabPress('Inventory');
                }}
                activeOpacity={0.8}
              >
                <InventoryActionIcon size={20} color="#8A4A1B" />
                <Text style={styles.quickActionText}>View Inventory</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => {
                  if (onNavigateToReceiving) onNavigateToReceiving();
                  else handleTabPress('Receiving');
                }}
                activeOpacity={0.8}
              >
                <ReceivingActionIcon size={20} color="#8A4A1B" />
                <Text style={styles.quickActionText}>View Receiving</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.quickActionsRow}>
              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => {
                  if (onNavigateToOrders) onNavigateToOrders();
                  else Alert.alert('Orders', 'Opening Coonoor Warehouse orders list');
                }}
                activeOpacity={0.8}
              >
                <OrdersActionIcon size={20} color="#8A4A1B" />
                <Text style={styles.quickActionText}>View Orders</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => {
                  if (onNavigateToOperations) onNavigateToOperations();
                  else handleTabPress('More');
                }}
                activeOpacity={0.8}
              >
                <OperationsActionIcon size={20} color="#8A4A1B" />
                <Text style={styles.quickActionText}>View Operations</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ─── Bottom Navigation Bar ─── */}
      <View style={styles.bottomTabBar}>
        <Pressable
          style={styles.tabItem}
          onPress={() => handleTabPress('Home')}
          accessibilityRole="tab"
        >
          <HomeTabIcon active={activeTab === 'Home'} />
          <Text style={[styles.tabLabel, activeTab === 'Home' && styles.tabLabelActive]}>Home</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => handleTabPress('Receiving')}
          accessibilityRole="tab"
        >
          <ReceivingTabIcon active={activeTab === 'Receiving'} />
          <Text style={[styles.tabLabel, activeTab === 'Receiving' && styles.tabLabelActive]}>Receiving</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => handleTabPress('Inventory')}
          accessibilityRole="tab"
        >
          <InventoryTabIcon active={activeTab === 'Inventory'} />
          <Text style={[styles.tabLabel, activeTab === 'Inventory' && styles.tabLabelActive]}>Inventory</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => handleTabPress('More')}
          accessibilityRole="tab"
        >
          <MoreTabIcon active={activeTab === 'More'} />
          <Text style={[styles.tabLabel, activeTab === 'More' && styles.tabLabelActive]}>More</Text>
        </Pressable>
      </View>

      {/* ─── Map Modal ─── */}
      <Modal
        visible={showMapModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMapModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowMapModal(false)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Warehouse Location</Text>
            <Text style={styles.modalLocationName}>Coonoor Warehouse (WH-COO-001)</Text>
            <Text style={styles.modalAddress}>Bedford Circle, Coonoor, The Nilgiris, Tamil Nadu 643101</Text>
            
            <View style={styles.mapGraphicPlaceholder}>
              <MapPinIcon size={32} color={PALETTE.primary} />
              <Text style={styles.mapCoordsText}>11.3530° N, 76.7959° E</Text>
            </View>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowMapModal(false)}
            >
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Stylesheet ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.primary,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  headerBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitlesContainer: {
    flex: 1,
  },
  headerMainTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
    fontWeight: '500',
  },
  mainContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginTop: 18,
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  gridCol: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    fontWeight: '500',
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginTop: 3,
  },
  snapshotGrid: {
    gap: 10,
  },
  snapshotRow: {
    flexDirection: 'row',
    gap: 10,
  },
  snapshotCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  snapshotValue: {
    fontSize: 22,
    fontWeight: '800',
    color: PALETTE.textInk,
    letterSpacing: -0.4,
  },
  snapshotLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: PALETTE.textSecondary,
    marginTop: 4,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  viewOnMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  viewOnMapText: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.primary,
  },
  operatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  operatingDay: {
    fontSize: 14,
    color: PALETTE.textInk,
    fontWeight: '500',
  },
  operatingTime: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  dividerLine: {
    height: 1,
    backgroundColor: PALETTE.divider,
    marginVertical: 12,
  },
  storageNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginTop: 2,
  },
  storageBarTrack: {
    height: 8,
    backgroundColor: PALETTE.trackBg,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 14,
    marginBottom: 8,
  },
  storageBarFill: {
    height: '100%',
    backgroundColor: PALETTE.primary,
    borderRadius: 4,
  },
  storageMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storageMetaText: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    fontWeight: '500',
  },
  quickActionsGrid: {
    gap: 10,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  noticeCard: {
    backgroundColor: PALETTE.noticeBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.noticeBorder,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 18,
    marginBottom: 8,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: PALETTE.noticeText,
    fontWeight: '500',
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.tabBorder,
    paddingVertical: 8,
    paddingBottom: 12,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.tabInactive,
    marginTop: 3,
  },
  tabLabelActive: {
    color: PALETTE.primary,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginBottom: 6,
  },
  modalLocationName: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.primary,
    marginBottom: 4,
  },
  modalAddress: {
    fontSize: 13,
    color: PALETTE.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  mapGraphicPlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: PALETTE.pageBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  mapCoordsText: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    marginTop: 6,
    fontWeight: '600',
  },
  modalCloseBtn: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
