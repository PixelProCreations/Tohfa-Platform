import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

// ─── Design Tokens (#F0562A Brand + Inspect Element Tokens) ─────────────────
const PALETTE = {
  primary:       '#F0562A',
  pageBg:        '#F7F5EE',
  cardBg:        '#FFFFFF',
  textInk:       '#1D2420',
  textSecondary: '#6B7280',
  textMuted:     '#9CA3AF',
  border:        '#E7E2D6',
  divider:       '#F0ECE3',
  headerBtnBg:   'rgba(255, 255, 255, 0.22)',
  brownText:     '#F0562A',
  activeChipBg:  '#FFF0EB',
  activeChipBorder: '#F0562A',
  activeChipText:   '#F0562A',
  chipBg:        '#FFFFFF',
  chipBorder:    '#E5E7EB',
  chipText:      '#4B5563',
  unreadDot:     '#F0562A',
  iconBoxBg:     '#FFF0EB',
  iconColor:     '#F0562A',
};

export interface NotificationItem {
  id: string;
  type: 'goods' | 'wallet' | 'order';
  title: string;
  subtitle: string;
  timestamp: string;
  isUnread: boolean;
}

const INITIAL_ITEMS: NotificationItem[] = [
  {
    id: '1',
    type: 'goods',
    title: 'Goods Received',
    subtitle: 'New goods receiving activity is available.',
    timestamp: 'Today · 10:20 AM',
    isUnread: true,
  },
  {
    id: '2',
    type: 'wallet',
    title: 'Wallet Credited',
    subtitle: 'A customer wallet transaction has been completed.',
    timestamp: 'Today · 09:45 AM',
    isUnread: true,
  },
  {
    id: '3',
    type: 'order',
    title: 'Order Confirmed',
    subtitle: 'Order #ORD-10284 has been confirmed.',
    timestamp: 'Today · 09:20 AM · ✓ Read',
    isUnread: false,
  },
];

// ─── Pure SVG Icons ─────────────────────────────────────────────────────────

function BellHeaderIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SettingsGearIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 15a3 3 0 100-6 3 3 0 000 6z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function GoodsInboxIcon({ size = 20, color = PALETTE.iconColor }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function WalletIcon({ size = 20, color = PALETTE.iconColor }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 10V6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m0-4h18m-18 0v4m15-2h.01"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BagCheckIcon({ size = 20, color = PALETTE.iconColor }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

function BuildingIcon({ size = 13, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2M5 21H3M9 7h1m-1 4h1m-1 4h1m5-8h1m-1 4h1m-1 4h1"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function HomeTabIcon({ active = false }: { active?: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10"
        stroke={active ? PALETTE.primary : '#786F66'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ReceivingTabIcon({ active = false }: { active?: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"
        stroke={active ? PALETTE.primary : '#786F66'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function InventoryTabIcon({ active = false }: { active?: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        stroke={active ? PALETTE.primary : '#786F66'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function MoreTabIcon({ active = false }: { active?: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 6h.01M12 6h.01M20 6h.01M4 12h.01M12 12h.01M20 12h.01M4 18h.01M12 18h.01M20 18h.01"
        stroke={active ? PALETTE.primary : '#786F66'}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Component Props ─────────────────────────────────────────────────────────

export interface SubWarehouseNotificationsScreenProps {
  onBack?: () => void;
  onTabChange?: (tab: 'Home' | 'Receiving' | 'Inventory' | 'More') => void;
  onNavigateToTasks?: () => void;
  onNavigateToAlerts?: () => void;
  onNavigateToSystemMessages?: () => void;
  onNavigateToAction?: (actionLabel: string, item?: any) => void;
}

export function SubWarehouseNotificationsScreen({
  onBack,
  onTabChange,
  onNavigateToTasks,
  onNavigateToAlerts,
  onNavigateToSystemMessages,
  onNavigateToAction,
}: SubWarehouseNotificationsScreenProps): React.JSX.Element {
  const [activeFilter, setActiveFilter] = useState<'All' | 'Unread'>('All');
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_ITEMS);

  const unreadCount = notifications.filter((n) => n.isUnread).length;

  const filtered = notifications.filter((n) => {
    if (activeFilter === 'Unread') return n.isUnread;
    return true;
  });

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })));
  };

  const handleItemPress = (item: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, isUnread: false } : n))
    );

    if (item.type === 'goods' || item.type === 'order') {
      if (onNavigateToTasks) {
        onNavigateToTasks();
      } else if (onNavigateToAction) {
        onNavigateToAction(item.type === 'goods' ? 'Review' : 'Order', item);
      }
    } else if (item.type === 'wallet') {
      if (onNavigateToAlerts) {
        onNavigateToAlerts();
      } else {
        Alert.alert(item.title, item.subtitle);
      }
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Header Banner ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            {onBack && (
              <TouchableOpacity
                style={styles.backBtn}
                onPress={onBack}
                activeOpacity={0.7}
                accessibilityLabel="Back"
              >
                <ArrowBackIcon size={20} />
              </TouchableOpacity>
            )}
            <BellHeaderIcon size={22} color="#FFFFFF" />
            <Text style={styles.headerTitle}>Notifications</Text>
          </View>

          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={onNavigateToSystemMessages ? onNavigateToSystemMessages : () => Alert.alert('Settings', 'Opening system settings...')}
            activeOpacity={0.8}
            accessibilityLabel="System Settings"
          >
            <SettingsGearIcon size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Warehouse active pill */}
        <View style={styles.warehousePill}>
          <BuildingIcon size={13} color="#FFFFFF" />
          <Text style={styles.warehousePillText}>Coonoor Warehouse</Text>
        </View>
      </View>

      {/* ─── Scrollable Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Unread Summary Notice Banner ─── */}
        <View style={styles.unreadNoticeBox}>
          <Text style={styles.unreadNoticeText}>
            You have {unreadCount || 8} unread notifications
          </Text>
          <TouchableOpacity onPress={handleMarkAllRead} activeOpacity={0.7}>
            <Text style={styles.markAllReadText}>Mark all as read</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Filter Chips (All / Unread) ─── */}
        <View style={styles.chipsRow}>
          {(['All', 'Unread'] as const).map((chip) => {
            const isActive = activeFilter === chip;
            return (
              <TouchableOpacity
                key={chip}
                style={[styles.chip, isActive && styles.activeChip]}
                onPress={() => setActiveFilter(chip)}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, isActive && styles.activeChipText]}>
                  {chip}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── Notifications Grouped Card ─── */}
        <View style={styles.notificationsCard}>
          {filtered.map((item, index) => {
            const isLast = index === filtered.length - 1;
            return (
              <View key={item.id}>
                <TouchableOpacity
                  style={styles.notificationRow}
                  onPress={() => handleItemPress(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.iconBox}>
                    {item.type === 'goods' && <GoodsInboxIcon size={20} />}
                    {item.type === 'wallet' && <WalletIcon size={20} />}
                    {item.type === 'order' && <BagCheckIcon size={20} />}
                  </View>

                  <View style={styles.textCol}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                    <Text style={styles.itemTimestamp}>{item.timestamp}</Text>
                  </View>

                  {item.isUnread && <View style={styles.unreadDot} />}
                </TouchableOpacity>

                {!isLast && <View style={styles.itemDivider} />}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* ─── Bottom Navigation Bar ─── */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => onTabChange ? onTabChange('Home') : onBack ? onBack() : undefined}
          activeOpacity={0.75}
        >
          <HomeTabIcon active={false} />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => onTabChange && onTabChange('Receiving')}
          activeOpacity={0.75}
        >
          <ReceivingTabIcon active={false} />
          <Text style={styles.navLabel}>Receiving</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => onTabChange && onTabChange('Inventory')}
          activeOpacity={0.75}
        >
          <InventoryTabIcon active={false} />
          <Text style={styles.navLabel}>Inventory</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => onTabChange ? onTabChange('More') : onBack ? onBack() : undefined}
          activeOpacity={0.75}
        >
          <MoreTabIcon active={true} />
          <Text style={[styles.navLabel, styles.navLabelActive]}>More</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  headerBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    paddingRight: 6,
    paddingVertical: 2,
  },
  headerTitle: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: PALETTE.headerBtnBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warehousePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginTop: 10,
  },
  warehousePillText: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    backgroundColor: PALETTE.pageBg,
  },
  unreadNoticeBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF0EB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 16,
  },
  unreadNoticeText: {
    fontFamily: 'Poppins',
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.brownText,
  },
  markAllReadText: {
    fontFamily: 'Poppins',
    fontSize: 11.5,
    fontWeight: '700',
    color: PALETTE.brownText,
    textDecorationLine: 'underline',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    backgroundColor: PALETTE.chipBg,
    borderWidth: 1,
    borderColor: PALETTE.chipBorder,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  activeChip: {
    backgroundColor: PALETTE.activeChipBg,
    borderColor: PALETTE.activeChipBorder,
  },
  chipText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.chipText,
  },
  activeChipText: {
    color: PALETTE.activeChipText,
    fontWeight: '700',
  },
  notificationsCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: PALETTE.iconBoxBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  textCol: {
    flex: 1,
  },
  itemTitle: {
    fontFamily: 'Poppins',
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  itemSubtitle: {
    fontFamily: 'Poppins',
    fontSize: 11.5,
    color: PALETTE.textSecondary,
    marginTop: 2,
    lineHeight: 16.5,
  },
  itemTimestamp: {
    fontFamily: 'Poppins',
    fontSize: 10.5,
    color: PALETTE.textMuted,
    marginTop: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PALETTE.unreadDot,
    marginTop: 6,
  },
  itemDivider: {
    height: 1,
    backgroundColor: PALETTE.divider,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: '#EAE4DB',
    paddingVertical: 8,
    paddingHorizontal: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    minWidth: 60,
  },
  navLabel: {
    fontFamily: 'Poppins',
    fontSize: 10,
    fontWeight: '500',
    color: '#786F66',
    marginTop: 3,
  },
  navLabelActive: {
    color: PALETTE.primary,
    fontWeight: '700',
  },
});
