import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

// ─── Design Tokens ──────────────────────────────────────────────────────────
const PALETTE = {
  primary: '#F0562A',
  pageBg: '#F7F5EE',
  textInk: '#1D2420',
  textSecondary: '#6B7280',
  textBrown: '#9E6947',
  border: '#E7E2D6',
  white: '#FFFFFF',
  unreadDot: '#F0562A',
  readDot: '#D1D5DB',
  activeChipBg: '#F0562A',
  activeChipText: '#FFFFFF',
  inactiveChipBg: '#FFFFFF',
  inactiveChipText: '#6B7280',
  inactiveChipBorder: '#E5E7EB',
};

// ─── Interfaces ─────────────────────────────────────────────────────────────
export interface NotificationItem {
  id: string;
  type: 'quality' | 'order' | 'inventory' | 'wallet' | 'returns' | 'system';
  title: string;
  subtitle: string;
  timestamp: string;
  isUnread: boolean;
  actionLabel?: string;
}

export interface SubWarehouseNotificationsScreenProps {
  onBack?: () => void;
  onTabChange?: (tab: 'Home' | 'Receiving' | 'Inventory' | 'More') => void;
  onNavigateToTasks?: () => void;
  onNavigateToAlerts?: () => void;
  onNavigateToSystemMessages?: () => void;
  onSelectNotification?: (item: NotificationItem) => void;
  onNavigateToAction?: (actionLabel: string, item?: NotificationItem) => void;
}

// ─── Data ───────────────────────────────────────────────────────────────────
const INITIAL_ITEMS: NotificationItem[] = [
  {
    id: '1',
    type: 'quality',
    title: 'QC Required',
    subtitle: 'Tomato batch GR-1024 is waiting for quality inspection.',
    timestamp: '10 minutes ago',
    isUnread: true,
    actionLabel: 'Review',
  },
  {
    id: '2',
    type: 'order',
    title: 'New Order',
    subtitle: 'Order #ORD-10245 requires packing.',
    timestamp: '5 minutes ago',
    isUnread: true,
    actionLabel: 'View Order',
  },
  {
    id: '3',
    type: 'inventory',
    title: 'Low Stock Alert',
    subtitle: 'Carrot Grade 1 has reached the configured threshold.',
    timestamp: '32 minutes ago',
    isUnread: true,
    actionLabel: 'View Stock',
  },
  {
    id: '4',
    type: 'wallet',
    title: 'Cash Top-Up Completed',
    subtitle: '₹2,000 credited to customer wallet.',
    timestamp: 'Today · 11:42 AM',
    isUnread: false,
    actionLabel: 'View Wallet',
  },
  {
    id: '5',
    type: 'returns',
    title: 'New Return Request',
    subtitle: 'Customer reported damaged item on ORD-20260921-006.',
    timestamp: 'Yesterday, 2:30 PM',
    isUnread: false,
    actionLabel: 'View Return',
  },
  {
    id: '6',
    type: 'system',
    title: 'System Message',
    subtitle: 'Warehouse capacity report available for review by MWA.',
    timestamp: '2 days ago',
    isUnread: false,
  },
];

// ─── Icons ──────────────────────────────────────────────────────────────────
function ArrowBackIcon({ size = 22, color = '#FFFFFF' }) {
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

// ─── Component ──────────────────────────────────────────────────────────────
export function SubWarehouseNotificationsScreen({
  onBack,
  onTabChange,
  onNavigateToTasks,
  onNavigateToAlerts,
  onNavigateToSystemMessages,
  onSelectNotification,
  onNavigateToAction,
}: SubWarehouseNotificationsScreenProps) {
  const [items, setItems] = useState<NotificationItem[]>(INITIAL_ITEMS);
  const [activeFilter, setActiveFilter] = useState('All');

  const filters = ['All', 'Orders', 'Inventory', 'Receiving', 'Finance'];

  const handleMarkAllRead = () => {
    setItems((prev) => prev.map((item) => ({ ...item, isUnread: false })));
  };

  const handleItemPress = (item: NotificationItem) => {
    // Mark as read
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isUnread: false } : i))
    );
    if (onSelectNotification) {
      onSelectNotification(item);
    } else if (onNavigateToAction) {
      if (item.actionLabel) {
        onNavigateToAction(item.actionLabel, item);
      } else if (item.type === 'quality') {
        onNavigateToAction('Review', item);
      } else if (item.type === 'order') {
        onNavigateToAction('View Order', item);
      } else if (item.type === 'inventory') {
        onNavigateToAction('View Stock', item);
      } else if (item.type === 'wallet') {
        onNavigateToAction('Cash Top-Up', item);
      } else if (item.type === 'returns') {
        onNavigateToAction('Return Request', item);
      } else if (item.type === 'system') {
        onNavigateToAction('System Message', item);
      }
    }
  };

  const handleAction = (item: NotificationItem) => {
    if (onNavigateToAction && item.actionLabel) {
      onNavigateToAction(item.actionLabel, item);
    }
  };

  // Basic client-side filtering simulation
  const filtered = items.filter((item) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Orders' && item.type === 'order') return true;
    if (activeFilter === 'Inventory' && item.type === 'inventory') return true;
    if (activeFilter === 'Receiving' && item.type === 'quality') return true;
    if (activeFilter === 'Finance' && item.type === 'wallet') return true;
    return false;
  });

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
            <ArrowBackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        <TouchableOpacity onPress={handleMarkAllRead} activeOpacity={0.7}>
          <Text style={styles.markAllRead}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Row */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filters.map((f) => {
            const isActive = activeFilter === f;
            return (
              <TouchableOpacity
                key={f}
                style={[styles.filterChip, isActive ? styles.chipActive : styles.chipInactive]}
                onPress={() => setActiveFilter(f)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, isActive ? styles.chipTextActive : styles.chipTextInactive]}>
                  {f}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Notifications List */}
      <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
        {filtered.map((item, index) => {
          const isLast = index === filtered.length - 1;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.notificationItem, !isLast && styles.itemBorder]}
              onPress={() => handleItemPress(item)}
              activeOpacity={0.7}
            >
              <View style={styles.itemLeft}>
                <View style={[styles.dot, { backgroundColor: item.isUnread ? PALETTE.unreadDot : PALETTE.readDot }]} />
              </View>
              <View style={styles.itemBody}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                <View style={styles.itemFooter}>
                  <Text style={styles.itemTimestamp}>{item.timestamp}</Text>
                </View>
                {item.actionLabel && (
                  <TouchableOpacity onPress={() => handleAction(item)} style={styles.actionBtn}>
                    <Text style={styles.actionText}>{item.actionLabel} →</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  header: {
    backgroundColor: PALETTE.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: 12,
    paddingVertical: 4,
  },
  headerTitle: {
    fontFamily: 'Poppins',
    fontSize: 20,
    fontWeight: '700',
    color: PALETTE.white,
  },
  markAllRead: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.white,
    textDecorationLine: 'underline',
  },
  filterContainer: {
    backgroundColor: PALETTE.white,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.border,
  },
  filterScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: PALETTE.activeChipBg,
    borderColor: PALETTE.activeChipBg,
  },
  chipInactive: {
    backgroundColor: PALETTE.inactiveChipBg,
    borderColor: PALETTE.inactiveChipBorder,
  },
  chipText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextActive: {
    color: PALETTE.activeChipText,
  },
  chipTextInactive: {
    color: PALETTE.inactiveChipText,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    paddingVertical: 16,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.border,
  },
  itemLeft: {
    width: 24,
    alignItems: 'flex-start',
    paddingTop: 4,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  itemBody: {
    flex: 1,
  },
  itemTitle: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '700',
    color: '#002B36',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontFamily: 'Poppins',
    fontSize: 13.5,
    fontWeight: '400',
    color: '#334155',
    lineHeight: 20,
    marginBottom: 6,
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemTimestamp: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '400',
    color: '#64748B',
  },
  actionBtn: {
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  actionText: {
    fontFamily: 'Poppins',
    fontSize: 13.5,
    fontWeight: '700',
    color: '#9E6947',
  },
});
