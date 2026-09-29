import React, { useEffect, useState } from 'react';
import {
  Alert,
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
import { fetchMe, type UserMe } from '../../../farmer/api/auth';
import { AdminProfileScreen } from './AdminProfileScreen';
import { SubWarehouseProfileScreen } from './SubWarehouseProfileScreen';
import { SubWarehouseOverviewScreen } from './SubWarehouseOverviewScreen';
import { SubWarehouseRecentActivityScreen } from './SubWarehouseRecentActivityScreen';
import { SubWarehouseNotificationsScreen } from './SubWarehouseNotificationsScreen';
import { SubWarehouseReviewReceivingScreen } from './SubWarehouseReviewReceivingScreen';
import { SubWarehouseTodayOverviewScreen } from './SubWarehouseTodayOverviewScreen';
import { SubWarehouseSalesScreen } from './SubWarehouseSalesScreen';
import { SubWarehouseWalletOperationsScreen } from './SubWarehouseWalletOperationsScreen';
import { SubWarehouseMoreScreen } from './SubWarehouseMoreScreen';

// ─── Design Tokens (Primary Brand Color: #F0562A) ────────────────────────────
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
  divider:       '#F4EFE9',
  greenBadge:    '#DCFCE7',
  greenText:     '#15803D',
  greenDot:      '#10B981',
  amberBadge:    '#FEF3C7',
  amberText:     '#B45309',
  amberIconBg:   '#FEF3C7',
  redBadge:      '#FEE2E2',
  redText:       '#DC2626',
  redIconBg:     '#FEE2E2',
  tealBadge:     '#E0F2FE',
  tealText:      '#0284C7',
  tabInactive:   '#827A74',
  tabBorder:     '#EAE4DB',
};

type SubWHTab = 'Home' | 'Receiving' | 'Inventory' | 'More';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function WarehouseHeaderIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 21h18M3 10h18M5 10v11M9 10v11M15 10v11M19 10v11M12 3l9 7H3l9-7z"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BellIcon() {
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

function ProfileHeaderIcon() {
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
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

function ClipboardClockIcon({ color = PALETTE.primary }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Rect x="8" y="2" width="8" height="4" rx="1" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="14" r="4" stroke={color} strokeWidth="1.8" />
      <Path d="M12 12.5v1.5l1 1" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function PersonCheckIcon({ color = PALETTE.primary }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" />
      <Path d="M16 11l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DeliveryTruckIcon({ color = PALETTE.primary }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="1" y="4" width="14" height="12" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M15 8h4l3 3v5h-7V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="5.5" cy="19" r="2.5" stroke={color} strokeWidth="2" />
      <Circle cx="18.5" cy="19" r="2.5" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function BoxIcon({ color = PALETTE.primary }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <Path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BanknotesIcon({ color = PALETTE.primary }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="12" rx="2" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
      <Path d="M6 12h.01M18 12h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function WalletIcon({ color = PALETTE.primary }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 14h.01M4 7V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReceiveGoodsActionIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke={PALETTE.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 10l5 5 5-5M12 15V3" stroke={PALETTE.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CashRegisterActionIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M4 7h16M7 3h10v4H7zM3 11h18v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9zM7 15h2M11 15h2M15 15h2M7 18h10" stroke={PALETTE.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ViewOrdersActionIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={PALETTE.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={PALETTE.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CashTopUpActionIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="12" rx="2" stroke={PALETTE.primary} strokeWidth="2" />
      <Path d="M12 9v6M9 12h6" stroke={PALETTE.primary} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function StockVerifyActionIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M9 11l3 3L22 4" stroke={PALETTE.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke={PALETTE.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ActivityHistoryActionIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M1 4v6h6M3.51 15a9 9 0 1 0 2.13-9.36L1 10" stroke={PALETTE.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 7v5l3 3" stroke={PALETTE.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WarningTriangleIcon({ color = '#D97706', size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function InfoCircleIcon({ color = '#2563EB', size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 16v-4M12 8h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function FlaskIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M10 2v7.31L4.69 19.34A2 2 0 0 0 6.44 22h11.12a2 2 0 0 0 1.75-2.66L14 9.31V2M8.5 2h7M7 16h10" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ExclamationCircleIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#DC2626" strokeWidth="2" />
      <Path d="M12 8v4M12 16h.01" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function BrokenCrateIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="2" stroke="#DC2626" strokeWidth="2" />
      <Path d="M8 8l3 4-2 4 5-3 2 5" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ClockIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#D97706" strokeWidth="2" />
      <Path d="M12 6v6l4 2" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRight() {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke="#9E9690" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function HomeTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 22V12h6v10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReceivingTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 10l5 5 5-5M12 15V3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InventoryTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <Path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

export interface SubWarehouseAdminDashboardScreenProps {
  onSignOut: () => void;
  onNavigate?: (screen: string) => void;
  onBack?: () => void;
}

export function SubWarehouseAdminDashboardScreen({
  onSignOut,
  onNavigate,
  onBack,
}: SubWarehouseAdminDashboardScreenProps) {
  const [activeTab, setActiveTab] = useState<SubWHTab>('Home');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showTodayOverview, setShowTodayOverview] = useState(false);
  const [showSalesScreen, setShowSalesScreen] = useState(false);
  const [showWarehouseOverview, setShowWarehouseOverview] = useState(false);
  const [showRecentActivity, setShowRecentActivity] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showReviewReceiving, setShowReviewReceiving] = useState(false);
  const [user, setUser] = useState<UserMe | null>(null);

  useEffect(() => {
    fetchMe()
      .then((me) => setUser(me))
      .catch(() => {});
  }, []);

  const userName = user?.fullName?.split(' ')[0] ?? 'Suresh';

  if (showNotifications) {
    return (
      <SubWarehouseNotificationsScreen
        onBack={() => setShowNotifications(false)}
        onTabChange={(tab) => {
          setShowNotifications(false);
          setActiveTab(tab);
        }}
        onNavigateToAction={(actionLabel) => {
          setShowNotifications(false);
          if (actionLabel.includes('Review')) {
            if (onNavigate) onNavigate('SubWarehouseReviewReceiving');
            else setShowReviewReceiving(true);
          } else if (actionLabel.includes('Stock')) {
            setActiveTab('Inventory');
          } else if (actionLabel.includes('Order')) {
            setActiveTab('Home');
          }
        }}
      />
    );
  }

  if (showTodayOverview) {
    return (
      <SubWarehouseTodayOverviewScreen
        onBack={() => setShowTodayOverview(false)}
        onTabChange={(tab) => {
          setShowTodayOverview(false);
          setActiveTab(tab);
        }}
        onNavigateToSection={(section) => {
          setShowTodayOverview(false);
          if (section === 'Receiving') setActiveTab('Receiving');
          else if (section === 'Inventory') setActiveTab('Inventory');
        }}
      />
    );
  }

  if (showWarehouseOverview) {
    return (
      <SubWarehouseOverviewScreen
        warehouseName="Coonoor Warehouse"
        warehouseId="COO-WH-001"
        onBack={() => setShowWarehouseOverview(false)}
        onTabChange={(tab) => {
          setShowWarehouseOverview(false);
          setActiveTab(tab);
        }}
        onNavigateToInventory={() => {
          setShowWarehouseOverview(false);
          setActiveTab('Inventory');
        }}
        onNavigateToReceiving={() => {
          setShowWarehouseOverview(false);
          setActiveTab('Receiving');
        }}
        onNavigateToOrders={() => {
          setShowWarehouseOverview(false);
          setShowSalesScreen(true);
        }}
        onNavigateToOperations={() => {
          setShowWarehouseOverview(false);
          setActiveTab('More');
        }}
      />
    );
  }

  if (showRecentActivity) {
    return (
      <SubWarehouseRecentActivityScreen
        onBack={() => setShowRecentActivity(false)}
        onTabChange={(tab) => {
          setShowRecentActivity(false);
          setActiveTab(tab);
        }}
      />
    );
  }

  if (showReviewReceiving) {
    return (
      <SubWarehouseReviewReceivingScreen
        onBack={() => setShowReviewReceiving(false)}
        onSuccess={() => {
          setShowReviewReceiving(false);
          setActiveTab('Receiving');
        }}
        shipmentData={{
          reference: 'GR-1024',
          source: 'Main Warehouse (Ooty Hub)',
          product: 'Tomato (Grade 1)',
          expectedQuantity: '150 KG',
        }}
      />
    );
  }

  if (showProfile) {
    return (
      <SubWarehouseProfileScreen
        onBack={() => setShowProfile(false)}
        onTabChange={(tab) => {
          setShowProfile(false);
          setActiveTab(tab);
        }}
        onNavigateToInventory={() => {
          setShowProfile(false);
          setActiveTab('Inventory');
        }}
        onNavigateToStorageInfo={() => {
          setShowProfile(false);
          if (onNavigate) onNavigate('SubWarehouseStorageInfo');
        }}
        onNavigateToOperatingInfo={() => {
          setShowProfile(false);
          if (onNavigate) onNavigate('SubWarehouseOperatingInfo');
        }}
        onNavigateToContact={() => {
          setShowProfile(false);
          if (onNavigate) onNavigate('SubWarehouseContact');
        }}
        onNavigateToDocuments={() => {
          setShowProfile(false);
          if (onNavigate) onNavigate('SubWarehouseDocuments');
        }}
      />
    );
  }

  if (showSalesScreen) {
    return (
      <SubWarehouseSalesScreen
        onBack={() => setShowSalesScreen(false)}
        onTabChange={(tab) => {
          setShowSalesScreen(false);
          setActiveTab(tab);
        }}
        onNavigateToNotifications={() => {
          setShowSalesScreen(false);
          if (onNavigate) {
            onNavigate('SubWarehouseNotifications');
          } else {
            setShowNotifications(true);
          }
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      <View style={{ flex: 1 }}>
        {activeTab === 'Home' && (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
            decelerationRate={0.985}
            scrollEventThrottle={16}
            overScrollMode="never"
            bounces={true}
            nestedScrollEnabled={true}
          >
            {/* ─── Top Brand Header Banner (#F0562A) ─── */}
            <View style={styles.headerBanner}>
              <View style={styles.headerTopRow}>
                {onBack && (
                  <TouchableOpacity
                    style={styles.backBtn}
                    onPress={onBack}
                    activeOpacity={0.8}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <ArrowBackIcon size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.headerGreeting}>Good Morning, {userName}</Text>
                  <TouchableOpacity
                    style={styles.warehouseNameRow}
                    onPress={() => {
                      if (onNavigate) {
                        onNavigate('SubWarehouseOverview');
                      } else {
                        setShowWarehouseOverview(true);
                      }
                    }}
                    activeOpacity={0.75}
                  >
                    <WarehouseHeaderIcon />
                    <Text style={styles.warehouseNameText}>Coonoor Warehouse</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.headerActions}>
                  <TouchableOpacity
                    style={styles.headerIconBtn}
                    onPress={() => {
                      if (onNavigate) {
                        onNavigate('SubWarehouseNotifications');
                      } else {
                        setShowNotifications(true);
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <BellIcon />
                    <View style={styles.notifBadge}>
                      <Text style={styles.notifBadgeText}>3</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.headerIconBtn}
                    onPress={() => {
                      if (onNavigate) {
                        onNavigate('SubWarehouseProfile');
                      } else {
                        setShowProfile(true);
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <ProfileHeaderIcon />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.headerDate}>Thursday, 24 September 2026</Text>

              <View style={styles.assignedWarehousePill}>
                <LockBadgeIcon />
                <Text style={styles.assignedWarehouseText}>Assigned Warehouse · Cannot switch</Text>
              </View>
            </View>

            {/* ─── Main Content Container ─── */}
            <View style={styles.mainContainer}>
              {/* 1. Operational Status Card */}
              <TouchableOpacity
                style={styles.statusCard}
                onPress={() => {
                  if (onNavigate) {
                    onNavigate('SubWarehouseOverview');
                  } else {
                    setShowWarehouseOverview(true);
                  }
                }}
                activeOpacity={0.8}
              >
                <View style={styles.statusCardLeft}>
                  <Text style={styles.statusWarehouseTitle}>Coonoor Warehouse</Text>
                  <View style={styles.operationalRow}>
                    <View style={styles.greenDot} />
                    <Text style={styles.operationalText}>Operational</Text>
                  </View>
                </View>

                <View style={styles.statusCardRight}>
                  <Text style={styles.receivingLabel}>Today's receiving</Text>
                  <Text style={styles.receivingValue}>3 shipments</Text>
                  <Text style={styles.syncText}>Last sync: 2 min ago</Text>
                </View>
              </TouchableOpacity>

              {/* 2. Today's Overview Grid */}
              <View style={styles.sectionHeaderBetween}>
                <Text style={[styles.sectionHeading, { marginTop: 0, marginBottom: 0 }]}>Today's Overview</Text>
                <TouchableOpacity
                  onPress={() => {
                    if (onNavigate) {
                      onNavigate('SubWarehouseTodayOverview');
                    } else {
                      setShowTodayOverview(true);
                    }
                  }}
                  activeOpacity={0.75}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 }}
                >
                  <Text style={styles.viewAllText}>See all</Text>
                  <ChevronRight />
                </TouchableOpacity>
              </View>
              <View style={styles.overviewGrid}>
                {/* 1. Pending Orders */}
                <TouchableOpacity
                  style={styles.overviewCard}
                  onPress={() => Alert.alert('Pending Orders', '12 Total Pending Orders. 8 require action.')}
                  activeOpacity={0.75}
                >
                  <View style={styles.overviewIconWrap}>
                    <ClipboardClockIcon />
                  </View>
                  <Text style={styles.overviewNumber}>12</Text>
                  <Text style={styles.overviewTitle}>Pending Orders</Text>
                  <Text style={styles.overviewSub}>8 need action</Text>
                </TouchableOpacity>

                {/* 2. Ready for Pickup */}
                <TouchableOpacity
                  style={styles.overviewCard}
                  onPress={() => Alert.alert('Ready for Pickup', '8 Orders packed and ready for handover.')}
                  activeOpacity={0.75}
                >
                  <View style={styles.overviewIconWrap}>
                    <PersonCheckIcon />
                  </View>
                  <Text style={styles.overviewNumber}>08</Text>
                  <Text style={styles.overviewTitle}>Ready for Pickup</Text>
                  <Text style={styles.overviewSub}>3 customers expected</Text>
                </TouchableOpacity>

                {/* 3. Today's Receiving */}
                <TouchableOpacity
                  style={styles.overviewCard}
                  onPress={() => setActiveTab('Receiving')}
                  activeOpacity={0.75}
                >
                  <View style={styles.overviewIconWrap}>
                    <DeliveryTruckIcon />
                  </View>
                  <Text style={styles.overviewNumber}>03</Text>
                  <Text style={styles.overviewTitle}>Today's Receiving</Text>
                  <Text style={styles.overviewSub}>1 awaiting QC</Text>
                </TouchableOpacity>

                {/* 4. Low Stock Items */}
                <TouchableOpacity
                  style={styles.overviewCard}
                  onPress={() => Alert.alert('Low Stock Alert', '5 produce batches below threshold.')}
                  activeOpacity={0.75}
                >
                  <View style={styles.overviewIconWrap}>
                    <BoxIcon color={PALETTE.primary} />
                  </View>
                  <Text style={[styles.overviewNumber, { color: PALETTE.primary }]}>05</Text>
                  <Text style={styles.overviewTitle}>Low Stock Items</Text>
                  <Text style={[styles.overviewSub, { color: PALETTE.primary }]}>Needs attention</Text>
                </TouchableOpacity>

                {/* 5. Today's Sales */}
                <TouchableOpacity
                  style={styles.overviewCard}
                  onPress={() => {
                    if (onNavigate) {
                      onNavigate('SubWarehouseSales');
                    } else {
                      setShowSalesScreen(true);
                    }
                  }}
                  activeOpacity={0.75}
                >
                  <View style={styles.overviewIconWrap}>
                    <BanknotesIcon />
                  </View>
                  <Text style={styles.overviewNumber}>₹24,850</Text>
                  <Text style={styles.overviewTitle}>Today's Sales</Text>
                  <Text style={styles.overviewSub}>42 transactions</Text>
                </TouchableOpacity>

                {/* 6. Cash Top-Ups */}
                <TouchableOpacity
                  style={styles.overviewCard}
                  onPress={() => {
                    if (onNavigate) {
                      onNavigate('SubWarehouseWalletOperations');
                    } else {
                      setActiveTab('More');
                    }
                  }}
                  activeOpacity={0.75}
                >
                  <View style={styles.overviewIconWrap}>
                    <WalletIcon />
                  </View>
                  <Text style={styles.overviewNumber}>₹18,500</Text>
                  <Text style={styles.overviewTitle}>Cash Top-Ups</Text>
                  <Text style={styles.overviewSub}>12 transactions</Text>
                </TouchableOpacity>
              </View>

              {/* 3. Quick Actions */}
              <Text style={styles.sectionHeading}>Quick Actions</Text>
              <View style={styles.quickActionsGrid}>
                <TouchableOpacity
                  style={styles.quickActionBtn}
                  onPress={() => setActiveTab('Receiving')}
                  activeOpacity={0.75}
                >
                  <ReceiveGoodsActionIcon />
                  <Text style={styles.quickActionLabel}>Receive Goods</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickActionBtn}
                  onPress={() => {
                    if (onNavigate) {
                      onNavigate('SubWarehouseSales');
                    } else {
                      setShowSalesScreen(true);
                    }
                  }}
                  activeOpacity={0.75}
                >
                  <CashRegisterActionIcon />
                  <Text style={styles.quickActionLabel}>Sales</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickActionBtn}
                  onPress={() => Alert.alert('View Orders', 'Opening pending order fulfillment queue...')}
                  activeOpacity={0.75}
                >
                  <ViewOrdersActionIcon />
                  <Text style={styles.quickActionLabel}>View Orders</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickActionBtn}
                  onPress={() => Alert.alert('Cash Top-Up', 'Enter Farmer Mobile or Scan QR to accept physical cash.')}
                  activeOpacity={0.75}
                >
                  <CashTopUpActionIcon />
                  <Text style={styles.quickActionLabel}>Cash Top-Up</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickActionBtn}
                  onPress={() => Alert.alert('Stock Verify', 'Initiate daily physical crate counting audit.')}
                  activeOpacity={0.75}
                >
                  <StockVerifyActionIcon />
                  <Text style={styles.quickActionLabel}>Stock Verify</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickActionBtn}
                  onPress={() => {
                    if (onNavigate) {
                      onNavigate('SubWarehouseRecentActivity');
                    } else {
                      setShowRecentActivity(true);
                    }
                  }}
                  activeOpacity={0.75}
                >
                  <ActivityHistoryActionIcon />
                  <Text style={styles.quickActionLabel}>Activity</Text>
                </TouchableOpacity>
              </View>

              {/* 4. Needs Attention */}
              <View style={styles.sectionHeaderRow}>
                <WarningTriangleIcon color="#D97706" size={17} />
                <Text style={[styles.sectionHeading, { marginTop: 0, marginBottom: 0 }]}>Needs Attention</Text>
              </View>

              <View style={styles.alertList}>
                <TouchableOpacity
                  style={styles.alertCard}
                  onPress={() => {
                    if (onNavigate) {
                      onNavigate('SubWarehouseReviewReceiving');
                    } else {
                      setShowReviewReceiving(true);
                    }
                  }}
                  activeOpacity={0.75}
                >
                  <View style={[styles.alertIconCircle, { backgroundColor: PALETTE.amberIconBg }]}>
                    <FlaskIcon />
                  </View>
                  <View style={styles.alertCardTextWrap}>
                    <Text style={styles.alertCardTitle}>QC Pending</Text>
                    <Text style={styles.alertCardSub}>
                      Tomato — Batch GR-1024 · Received 95 KG, awaiting quality check
                    </Text>
                  </View>
                  <ChevronRight />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.alertCard}
                  onPress={() => Alert.alert('Quantity Mismatch', 'Shipment GR-00124: Expected 100 KG, received 95 KG.')}
                  activeOpacity={0.75}
                >
                  <View style={[styles.alertIconCircle, { backgroundColor: PALETTE.redIconBg }]}>
                    <ExclamationCircleIcon />
                  </View>
                  <View style={styles.alertCardTextWrap}>
                    <Text style={styles.alertCardTitle}>Quantity Mismatch</Text>
                    <Text style={styles.alertCardSub}>Expected 100 KG, received 95 KG</Text>
                  </View>
                  <ChevronRight />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.alertCard}
                  onPress={() => Alert.alert('Damage Report', '2 crates reported damaged on today\'s receiving.')}
                  activeOpacity={0.75}
                >
                  <View style={[styles.alertIconCircle, { backgroundColor: PALETTE.redIconBg }]}>
                    <BrokenCrateIcon />
                  </View>
                  <View style={styles.alertCardTextWrap}>
                    <Text style={styles.alertCardTitle}>Damage Report</Text>
                    <Text style={styles.alertCardSub}>2 crates reported damaged on today's receiving</Text>
                  </View>
                  <ChevronRight />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.alertCard}
                  onPress={() => Alert.alert('Pickup Pending', '3 customers are waiting for order pickup.')}
                  activeOpacity={0.75}
                >
                  <View style={[styles.alertIconCircle, { backgroundColor: PALETTE.amberIconBg }]}>
                    <ClockIcon />
                  </View>
                  <View style={styles.alertCardTextWrap}>
                    <Text style={styles.alertCardTitle}>Pickup Pending</Text>
                    <Text style={styles.alertCardSub}>3 customers are waiting for order pickup</Text>
                  </View>
                  <ChevronRight />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.alertCard}
                  onPress={() => Alert.alert('Low Stock Alert', 'Carrot — Grade 1 · Available 12 KG.')}
                  activeOpacity={0.75}
                >
                  <View style={[styles.alertIconCircle, { backgroundColor: PALETTE.amberIconBg }]}>
                    <BoxIcon color="#D97706" />
                  </View>
                  <View style={styles.alertCardTextWrap}>
                    <Text style={styles.alertCardTitle}>Low Stock</Text>
                    <Text style={styles.alertCardSub}>Carrot — Grade 1 · Available 12 KG</Text>
                  </View>
                  <ChevronRight />
                </TouchableOpacity>
              </View>

              {/* 5. Today's Receiving */}
              <View style={styles.sectionHeaderBetween}>
                <Text style={styles.sectionHeading}>Today's Receiving</Text>
                <Text style={styles.sectionHeaderSub}>3 Shipments</Text>
              </View>

              <View style={styles.cardStack}>
                <View style={styles.orderReceivingCard}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.itemCodeBold}>GR-00124</Text>
                    <View style={styles.awaitingQcBadge}>
                      <Text style={styles.awaitingQcText}>Awaiting QC</Text>
                    </View>
                  </View>
                  <Text style={styles.routeText}>Main Warehouse → Coonoor</Text>
                  <Text style={styles.produceTitle}>Tomato · Grade 1</Text>
                  <View style={styles.rowBetween}>
                    <Text style={styles.detailText}>Expected: 150 KG</Text>
                    <Text style={styles.timeText}>09:40 AM</Text>
                  </View>
                </View>

                <View style={styles.orderReceivingCard}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.itemCodeBold}>GR-00123</Text>
                    <View style={styles.qcCompletedBadge}>
                      <Text style={styles.qcCompletedText}>✓ QC Completed</Text>
                    </View>
                  </View>
                  <Text style={styles.routeText}>Main Warehouse → Coonoor</Text>
                  <Text style={styles.produceTitle}>Carrot · Grade 1</Text>
                  <Text style={styles.detailText}>Received: 80 KG</Text>
                </View>

                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => setActiveTab('Receiving')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.linkButtonText}>View All Receiving →</Text>
                </TouchableOpacity>
              </View>

              {/* 6. Today's Orders */}
              <View style={styles.sectionHeaderBetween}>
                <Text style={styles.sectionHeading}>Today's Orders</Text>
                <Text style={styles.sectionHeaderSub}>12 Orders</Text>
              </View>

              <View style={styles.cardStack}>
                <View style={styles.orderReceivingCard}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.itemCodeBold}>#ORD-10245</Text>
                    <View style={styles.readyPickupBadge}>
                      <Text style={styles.readyPickupText}>Ready for Pickup</Text>
                    </View>
                  </View>
                  <Text style={styles.produceTitle}>Rahul Kumar · 3 Items</Text>
                  <Text style={styles.detailText}>₹850 · Pickup Today · 4:00 PM</Text>
                </View>

                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => Alert.alert('All Orders', 'Displaying 12 customer and B2B orders.')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.linkButtonText}>View All Orders →</Text>
                </TouchableOpacity>
              </View>

              {/* 7. Order Status Summary */}
              <Text style={styles.sectionHeading}>Order Status Summary</Text>
              <View style={styles.statusSummaryGrid}>
                <View style={styles.statusSummaryTile}>
                  <Text style={styles.statusSummaryNum}>04</Text>
                  <Text style={styles.statusSummaryLabel}>NEW</Text>
                </View>
                <View style={styles.statusSummaryTile}>
                  <Text style={styles.statusSummaryNum}>03</Text>
                  <Text style={styles.statusSummaryLabel}>PACKING</Text>
                </View>
                <View style={styles.statusSummaryTile}>
                  <Text style={styles.statusSummaryNum}>08</Text>
                  <Text style={styles.statusSummaryLabel}>READY</Text>
                </View>
                <View style={styles.statusSummaryTile}>
                  <Text style={styles.statusSummaryNum}>27</Text>
                  <Text style={styles.statusSummaryLabel}>COMPLETED</Text>
                </View>
              </View>

              {/* 8. Inventory Snapshot */}
              <Text style={styles.sectionHeading}>Inventory Snapshot</Text>
              <View style={styles.infoTableCard}>
                <View style={styles.infoTableRow}>
                  <Text style={styles.infoTableLabel}>Available Stock</Text>
                  <Text style={styles.infoTableValue}>1,245 KG</Text>
                </View>
                <View style={styles.infoTableRow}>
                  <Text style={styles.infoTableLabel}>Reserved</Text>
                  <Text style={styles.infoTableValue}>320 KG</Text>
                </View>
                <View style={styles.infoTableRow}>
                  <Text style={styles.infoTableLabel}>Allocated</Text>
                  <Text style={styles.infoTableValue}>580 KG</Text>
                </View>
                <View style={[styles.infoTableRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.infoTableLabel}>Low Stock</Text>
                  <Text style={[styles.infoTableValue, { color: PALETTE.primary }]}>05</Text>
                </View>
                <TouchableOpacity
                  style={styles.tableLinkButton}
                  onPress={() => setActiveTab('Inventory')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.linkButtonText}>View Inventory →</Text>
                </TouchableOpacity>
              </View>

              {/* 9. Stock Allocation */}
              <Text style={styles.sectionHeading}>Stock Allocation</Text>
              <View style={styles.infoTableCard}>
                <View style={styles.infoTableRow}>
                  <Text style={styles.infoTableLabel}>ONLINE</Text>
                  <Text style={styles.infoTableValue}>420 KG</Text>
                </View>
                <View style={styles.infoTableRow}>
                  <Text style={styles.infoTableLabel}>LIVE MARKET</Text>
                  <Text style={styles.infoTableValue}>120 KG</Text>
                </View>
                <View style={styles.infoTableRow}>
                  <Text style={styles.infoTableLabel}>RESERVE</Text>
                  <Text style={styles.infoTableValue}>80 KG</Text>
                </View>
                <View style={[styles.infoTableRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.infoTableLabel}>BUFFER</Text>
                  <Text style={styles.infoTableValue}>60 KG</Text>
                </View>
                <TouchableOpacity
                  style={styles.tableLinkButton}
                  onPress={() => Alert.alert('Stock Allocation Detail', 'Online: 420 KG\nLive Market: 120 KG\nReserve: 80 KG\nBuffer: 60 KG')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.linkButtonText}>View Allocation Detail →</Text>
                </TouchableOpacity>
              </View>

              {/* 10. Today's Sales Summary */}
              <Text style={styles.sectionHeading}>Today's Sales Summary</Text>
              <View style={styles.infoTableCard}>
                <View style={styles.salesHeaderRow}>
                  <Text style={styles.salesTotalAmount}>₹24,850</Text>
                  <Text style={styles.salesTxnCount}>42 transactions</Text>
                </View>
                <View style={styles.infoTableRow}>
                  <Text style={styles.infoTableLabel}>Online</Text>
                  <Text style={styles.infoTableValue}>₹12,400</Text>
                </View>
                <View style={styles.infoTableRow}>
                  <Text style={styles.infoTableLabel}>Market</Text>
                  <Text style={styles.infoTableValue}>₹7,250</Text>
                </View>
                <View style={styles.infoTableRow}>
                  <Text style={styles.infoTableLabel}>HORECA</Text>
                  <Text style={styles.infoTableValue}>₹3,200</Text>
                </View>
                <View style={[styles.infoTableRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.infoTableLabel}>B2B</Text>
                  <Text style={styles.infoTableValue}>₹2,000</Text>
                </View>
                <TouchableOpacity
                  style={styles.tableLinkButton}
                  onPress={() => Alert.alert('Sales Report', 'Sales collections verified and synced to ledger.')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.linkButtonText}>View Sales Report →</Text>
                </TouchableOpacity>
              </View>

              {/* 11. Cash Operations */}
              <Text style={styles.sectionHeading}>Cash Operations</Text>
              <View style={styles.infoTableCard}>
                <View style={styles.salesHeaderRow}>
                  <Text style={styles.salesTotalAmount}>₹18,500</Text>
                  <Text style={styles.salesTxnCount}>12 transactions</Text>
                </View>
                <View style={[styles.infoTableRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.infoTableLabel}>Last transaction</Text>
                  <Text style={styles.infoTableValue}>₹1,500 · 11:42 AM</Text>
                </View>
                <TouchableOpacity
                  style={styles.tableLinkButton}
                  onPress={() => Alert.alert('Cash History', '12 Cash Top-up transactions logged today.')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.linkButtonText}>View History →</Text>
                </TouchableOpacity>
              </View>

              {/* 12. Recent Activity (Matching Screenshot) */}
              <View style={styles.sectionHeaderBetween}>
                <Text style={styles.sectionHeading}>Recent Activity</Text>
                <TouchableOpacity
                  onPress={() => {
                    if (onNavigate) {
                      onNavigate('SubWarehouseRecentActivity');
                    } else {
                      setShowRecentActivity(true);
                    }
                  }}
                >
                  <Text style={styles.viewAllText}>View all</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.activityCardContainer}
                onPress={() => {
                  if (onNavigate) {
                    onNavigate('SubWarehouseRecentActivity');
                  } else {
                    setShowRecentActivity(true);
                  }
                }}
                activeOpacity={0.85}
              >
                {/* Activity 1 */}
                <View style={styles.activityItemRow}>
                  <View style={styles.activityIconBox}>
                    <ReceiveGoodsActionIcon />
                  </View>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.activityItemTitle}>Goods Received</Text>
                    <Text style={styles.activityItemSub}>GR-00124 · 150 KG Tomato</Text>
                    <Text style={styles.activityTimeText}>10:42 AM</Text>
                  </View>
                </View>

                <View style={styles.cardDivider} />

                {/* Activity 2 */}
                <View style={styles.activityItemRow}>
                  <View style={styles.activityIconBox}>
                    <ClipboardClockIcon />
                  </View>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.activityItemTitle}>Order Packed</Text>
                    <Text style={styles.activityItemSub}>ORD-10242</Text>
                    <Text style={styles.activityTimeText}>10:20 AM</Text>
                  </View>
                </View>

                <View style={styles.cardDivider} />

                {/* Activity 3 */}
                <View style={styles.activityItemRow}>
                  <View style={styles.activityIconBox}>
                    <BanknotesIcon />
                  </View>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.activityItemTitle}>Cash Top-Up</Text>
                    <Text style={styles.activityItemSub}>₹2,000 · Customer CUS-1042</Text>
                    <Text style={styles.activityTimeText}>09:55 AM</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* 13. Warehouse Alerts (Matching Screenshot) */}
              <Text style={styles.sectionHeading}>Warehouse Alerts</Text>
              <View style={styles.alertsContainerCard}>
                <View style={styles.alertBulletRow}>
                  <WarningTriangleIcon color="#D97706" size={16} />
                  <Text style={styles.alertBulletText}>2 QC checks pending</Text>
                </View>
                <View style={styles.alertBulletRow}>
                  <WarningTriangleIcon color="#D97706" size={16} />
                  <Text style={styles.alertBulletText}>5 low-stock products</Text>
                </View>
                <View style={styles.alertBulletRow}>
                  <InfoCircleIcon color="#2563EB" size={16} />
                  <Text style={styles.alertBulletText}>3 pickups scheduled today</Text>
                </View>
              </View>

              <View style={{ height: 28 }} />
            </View>
          </ScrollView>
        )}

        {/* ─── Receiving Tab ─── */}
        {activeTab === 'Receiving' && (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.tabContentPad}
            showsVerticalScrollIndicator={true}
            decelerationRate={0.985}
            scrollEventThrottle={16}
          >
            <View style={styles.tabHeaderBox}>
              <Text style={styles.tabMainHeading}>Coonoor Inward Receiving</Text>
              <Text style={styles.tabSubHeading}>3 Active Shipments & Inward Lots</Text>
            </View>

            <View style={styles.cardStack}>
              <View style={styles.orderReceivingCard}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.itemCodeBold}>GR-00124</Text>
                  <View style={styles.awaitingQcBadge}>
                    <Text style={styles.awaitingQcText}>Awaiting QC</Text>
                  </View>
                </View>
                <Text style={styles.routeText}>Main Warehouse → Coonoor</Text>
                <Text style={styles.produceTitle}>Tomato · Grade 1</Text>
                <View style={styles.rowBetween}>
                  <Text style={styles.detailText}>Expected: 150 KG (Received: 95 KG)</Text>
                  <Text style={styles.timeText}>09:40 AM</Text>
                </View>
                <TouchableOpacity
                  style={[styles.primaryActionBtn, { marginTop: 12 }]}
                  onPress={() => Alert.alert('Start QC Inspection', 'Verify produce quality, scale calibration, and sign off.')}
                >
                  <Text style={styles.primaryActionBtnText}>Perform Quality Check</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.orderReceivingCard}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.itemCodeBold}>GR-00123</Text>
                  <View style={styles.qcCompletedBadge}>
                    <Text style={styles.qcCompletedText}>✓ QC Completed</Text>
                  </View>
                </View>
                <Text style={styles.routeText}>Main Warehouse → Coonoor</Text>
                <Text style={styles.produceTitle}>Carrot · Grade 1</Text>
                <Text style={styles.detailText}>Received: 80 KG (Placed in Bay B-04)</Text>
              </View>

              <View style={styles.orderReceivingCard}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.itemCodeBold}>GR-00122</Text>
                  <View style={styles.qcCompletedBadge}>
                    <Text style={styles.qcCompletedText}>✓ QC Completed</Text>
                  </View>
                </View>
                <Text style={styles.routeText}>Main Warehouse → Coonoor</Text>
                <Text style={styles.produceTitle}>Nilgiris Potato · Grade 1</Text>
                <Text style={styles.detailText}>Received: 200 KG (Bay A-02)</Text>
              </View>
            </View>
          </ScrollView>
        )}

        {/* ─── Inventory Tab ─── */}
        {activeTab === 'Inventory' && (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.tabContentPad}
            showsVerticalScrollIndicator={true}
            decelerationRate={0.985}
            scrollEventThrottle={16}
          >
            <View style={styles.tabHeaderBox}>
              <Text style={styles.tabMainHeading}>Coonoor Inventory</Text>
              <Text style={styles.tabSubHeading}>1,245 KG Available Stock across 14 Produce Lines</Text>
            </View>

            <View style={styles.infoTableCard}>
              <View style={styles.infoTableRow}>
                <Text style={styles.infoTableLabel}>Tomato - Grade 1</Text>
                <Text style={styles.infoTableValue}>450 KG</Text>
              </View>
              <View style={styles.infoTableRow}>
                <Text style={styles.infoTableLabel}>Carrot - Grade 1</Text>
                <Text style={[styles.infoTableValue, { color: PALETTE.primary }]}>12 KG (Low)</Text>
              </View>
              <View style={styles.infoTableRow}>
                <Text style={styles.infoTableLabel}>Nilgiris Potato</Text>
                <Text style={styles.infoTableValue}>380 KG</Text>
              </View>
              <View style={styles.infoTableRow}>
                <Text style={styles.infoTableLabel}>Cabbage</Text>
                <Text style={styles.infoTableValue}>220 KG</Text>
              </View>
              <View style={[styles.infoTableRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.infoTableLabel}>Table Beetroot</Text>
                <Text style={[styles.infoTableValue, { color: PALETTE.primary }]}>18 KG (Low)</Text>
              </View>
            </View>
          </ScrollView>
        )}

        {/* ─── More Modules Directory Tab (Modules 5 to 16) ─── */}
        {activeTab === 'More' && (
          <SubWarehouseMoreScreen
            onBack={() => setActiveTab('Home')}
            onTabChange={(tab) => {
              if (tab === 'More') return;
              setActiveTab(tab);
            }}
            onNavigateToNotifications={() => {
              if (onNavigate) onNavigate('SubWarehouseNotifications');
              else setShowNotifications(true);
            }}
            onNavigateToProfile={() => {
              if (onNavigate) onNavigate('SubWarehouseProfile');
              else setShowProfile(true);
            }}
            onNavigateToWallet={() => {
              if (onNavigate) onNavigate('SubWarehouseWalletOperations');
            }}
            onNavigateToOrders={() => {
              if (onNavigate) onNavigate('SubWarehouseSales');
              else setShowSalesScreen(true);
            }}
            onNavigateToSales={() => {
              if (onNavigate) onNavigate('SubWarehouseSales');
              else setShowSalesScreen(true);
            }}
            onNavigateToReports={() => {
              if (onNavigate) onNavigate('SubWarehouseTodayOverview');
              else setShowTodayOverview(true);
            }}
            onNavigateToReturns={() => {
              if (onNavigate) onNavigate('SubWarehouseReviewReceiving');
              else setShowReviewReceiving(true);
            }}
            onLogout={onSignOut}
          />
        )}
      </View>

      {/* ─── Bottom Navigation Bar (Rendered for Home, Receiving, Inventory) ─── */}
      {activeTab !== 'More' && (
        <View style={styles.bottomTabBar}>
          <Pressable
            style={styles.tabItem}
            onPress={() => setActiveTab('Home')}
            accessibilityRole="tab"
          >
            <HomeTabIcon active={activeTab === 'Home'} />
            <Text style={[styles.tabLabel, activeTab === 'Home' && styles.tabLabelActive]}>Home</Text>
          </Pressable>

          <Pressable
            style={styles.tabItem}
            onPress={() => setActiveTab('Receiving')}
            accessibilityRole="tab"
          >
            <ReceivingTabIcon active={activeTab === 'Receiving'} />
            <Text style={[styles.tabLabel, activeTab === 'Receiving' && styles.tabLabelActive]}>Receiving</Text>
          </Pressable>

          <Pressable
            style={styles.tabItem}
            onPress={() => setActiveTab('Inventory')}
            accessibilityRole="tab"
          >
            <InventoryTabIcon active={activeTab === 'Inventory'} />
            <Text style={[styles.tabLabel, activeTab === 'Inventory' && styles.tabLabelActive]}>Inventory</Text>
          </Pressable>

          <Pressable
            style={styles.tabItem}
            onPress={() => setActiveTab('More')}
            accessibilityRole="tab"
          >
            <MoreTabIcon active={false} />
            <Text style={styles.tabLabel}>More</Text>
          </Pressable>
        </View>
      )}
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
    paddingBottom: 20,
  },
  mainContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  tabContentPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  tabHeaderBox: {
    marginBottom: 14,
  },
  tabMainHeading: {
    fontSize: 19,
    fontWeight: '800',
    color: PALETTE.textInk,
    letterSpacing: -0.3,
  },
  tabSubHeading: {
    fontSize: 12.5,
    color: PALETTE.textSecondary,
    marginTop: 3,
  },

  // ─── Header Banner ─────────────────────────────────────────────────────────
  headerBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 18,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  backBtn: {
    padding: 6,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerGreeting: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFF2EE',
    marginBottom: 3,
  },
  warehouseNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  warehouseNameText: {
    fontSize: 21,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: '#DC2626',
    borderRadius: 8,
    minWidth: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: PALETTE.primary,
  },
  notifBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerDate: {
    fontSize: 12,
    color: '#FFE2D9',
    marginTop: 5,
    marginBottom: 8,
  },
  assignedWarehousePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    paddingHorizontal: 11,
    paddingVertical: 4.5,
  },
  assignedWarehouseText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // ─── Status Card ───────────────────────────────────────────────────────────
  statusCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  statusCardLeft: {
    flex: 1,
  },
  statusWarehouseTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 4,
  },
  operationalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greenDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: PALETTE.greenDot,
  },
  operationalText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.greenText,
  },
  statusCardRight: {
    alignItems: 'flex-end',
  },
  receivingLabel: {
    fontSize: 11,
    color: PALETTE.textSecondary,
  },
  receivingValue: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginTop: 1,
  },
  syncText: {
    fontSize: 10,
    color: PALETTE.textMuted,
    marginTop: 2,
  },

  // ─── Section Headings ──────────────────────────────────────────────────────
  sectionHeading: {
    fontSize: 15.5,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginTop: 6,
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    marginBottom: 10,
  },
  sectionHeaderBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 10,
  },
  sectionHeaderSub: {
    fontSize: 11.5,
    fontWeight: '600',
    color: PALETTE.textSecondary,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.primary,
  },

  // ─── Today's Overview Grid ─────────────────────────────────────────────────
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginBottom: 14,
  },
  overviewCard: {
    width: '48.5%',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  overviewIconWrap: {
    width: 24,
    height: 24,
    marginBottom: 6,
    justifyContent: 'center',
  },
  overviewNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: PALETTE.textInk,
    letterSpacing: -0.4,
  },
  overviewTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginTop: 3,
  },
  overviewSub: {
    fontSize: 10.5,
    color: PALETTE.textSecondary,
    marginTop: 2,
  },

  // ─── Quick Actions ─────────────────────────────────────────────────────────
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 9,
    marginBottom: 14,
  },
  quickActionBtn: {
    width: '31.6%',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
    gap: 6,
  },
  quickActionLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: PALETTE.textInk,
    textAlign: 'center',
  },

  // ─── Alert Cards (Needs Attention) ─────────────────────────────────────────
  alertList: {
    gap: 8,
    marginBottom: 14,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    padding: 11,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  alertIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  alertCardTextWrap: {
    flex: 1,
    paddingRight: 6,
  },
  alertCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  alertCardSub: {
    fontSize: 11,
    color: PALETTE.textSecondary,
    marginTop: 2,
    lineHeight: 14.5,
  },

  // ─── Stack & Order / Receiving Cards ───────────────────────────────────────
  cardStack: {
    gap: 8,
    marginBottom: 14,
  },
  orderReceivingCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    padding: 13,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  itemCodeBold: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  awaitingQcBadge: {
    backgroundColor: PALETTE.amberBadge,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
  },
  awaitingQcText: {
    fontSize: 10,
    fontWeight: '700',
    color: PALETTE.amberText,
  },
  qcCompletedBadge: {
    backgroundColor: PALETTE.greenBadge,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
  },
  qcCompletedText: {
    fontSize: 10,
    fontWeight: '700',
    color: PALETTE.greenText,
  },
  readyPickupBadge: {
    backgroundColor: '#E6FFFA',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
  },
  readyPickupText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0D9488',
  },
  routeText: {
    fontSize: 11,
    color: PALETTE.textSecondary,
    marginBottom: 3,
  },
  produceTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginBottom: 2,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 11,
    color: PALETTE.textSecondary,
  },
  timeText: {
    fontSize: 11,
    color: PALETTE.textSecondary,
  },
  linkButton: {
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.primary,
  },

  // ─── Status Summary Row ────────────────────────────────────────────────────
  statusSummaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 7,
  },
  statusSummaryTile: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  statusSummaryNum: {
    fontSize: 17,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  statusSummaryLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: PALETTE.textSecondary,
    marginTop: 2,
  },

  // ─── Info Table Card ───────────────────────────────────────────────────────
  infoTableCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 14,
  },
  infoTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8.5,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.divider,
  },
  infoTableLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.textInk,
  },
  infoTableValue: {
    fontSize: 12.5,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  tableLinkButton: {
    marginTop: 6,
    paddingTop: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  salesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.divider,
  },
  salesTotalAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: PALETTE.textInk,
    letterSpacing: -0.4,
  },
  salesTxnCount: {
    fontSize: 11.5,
    color: PALETTE.textSecondary,
    fontWeight: '500',
  },

  // ─── Recent Activity (Matching Screenshot) ─────────────────────────────────
  activityCardContainer: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 14,
  },
  activityItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  activityIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: PALETTE.primarySoft,
    borderWidth: 1,
    borderColor: PALETTE.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  activityItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  activityItemSub: {
    fontSize: 11,
    color: PALETTE.textSecondary,
    marginTop: 2,
  },
  activityTimeText: {
    fontSize: 10.5,
    color: PALETTE.textMuted,
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: PALETTE.divider,
  },

  // ─── Warehouse Alerts Card (Matching Screenshot) ───────────────────────────
  alertsContainerCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 14,
    gap: 10,
  },
  alertBulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertBulletText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: PALETTE.textInk,
  },

  // ─── Primary Action Button (in tabs) ───────────────────────────────────────
  primaryActionBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ─── Bottom Tab Bar ────────────────────────────────────────────────────────
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.tabBorder,
    paddingVertical: 7,
    paddingHorizontal: 12,
    justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    color: PALETTE.tabInactive,
    marginTop: 2.5,
  },
  tabLabelActive: {
    color: PALETTE.primary,
    fontWeight: '800',
  },
});
