import React, { useState, useMemo } from 'react';
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
import { SubWarehouseNotificationDetailScreen } from './SubWarehouseNotificationDetailScreen';
import { SubWarehouseReviewReceivingScreen } from './SubWarehouseReviewReceivingScreen';

// ─── Design Tokens (#F0562A Unified Subwarehouse Palette) ────────────────────
const PALETTE = {
  primary: '#F0562A',
  primaryDark: '#D4451B',
  primaryLight: '#FFF0EB',
  primarySoft: '#FEF1EC',
  primaryBorder: '#FCD9CE',

  pageBg: '#FAF7F2',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#7A726C',
  textMuted: '#9E9690',
  border: '#EBE5DC',
  divider: '#F0EBE3',

  // Status & Notification Dots
  unreadDot: '#F0562A',
  readDot: '#D6CEC7',

  tabInactive: '#827A74',
  tabBorder: '#EAE4DB',
};

// ─── SVG Icons ───────────────────────────────────────────────────────────────

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

// ─── Notification Data Model ─────────────────────────────────────────────────

export interface SubWHNotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  category: 'Orders' | 'Inventory' | 'Receiving' | 'Financial';
  isUnread: boolean;
  actionLabel?: string;
  actionRoute?: string;
}

const INITIAL_NOTIFICATIONS: SubWHNotificationItem[] = [
  {
    id: '1',
    title: 'QC Required',
    description: 'Tomato batch GR-1024 is waiting for quality inspection.',
    timestamp: '10 minutes ago',
    category: 'Receiving',
    isUnread: true,
    actionLabel: 'Review →',
  },
  {
    id: '2',
    title: 'New Order',
    description: 'Order #ORD-10245 requires packing.',
    timestamp: '5 minutes ago',
    category: 'Orders',
    isUnread: true,
    actionLabel: 'View Order →',
  },
  {
    id: '3',
    title: 'Low Stock Alert',
    description: 'Carrot Grade 1 has reached the configured threshold.',
    timestamp: '32 minutes ago',
    category: 'Inventory',
    isUnread: true,
    actionLabel: 'View Stock →',
  },
  {
    id: '4',
    title: 'Cash Top-Up Completed',
    description: '₹2,000 credited to customer wallet.',
    timestamp: 'Today · 11:42 AM',
    category: 'Financial',
    isUnread: false,
  },
  {
    id: '5',
    title: 'New Return Request',
    description: 'Customer reported damaged item on ORD-20260921-006.',
    timestamp: 'Yesterday, 2:30 PM',
    category: 'Orders',
    isUnread: false,
  },
  {
    id: '6',
    title: 'System Message',
    description: 'Warehouse capacity report available for review by MWA.',
    timestamp: '2 days ago',
    category: 'Inventory',
    isUnread: false,
  },
];

type CategoryFilter = 'All' | 'Orders' | 'Inventory' | 'Receiving' | 'Financial';

export interface SubWarehouseNotificationsScreenProps {
  onBack: () => void;
  onTabChange?: ((tab: 'Home' | 'Receiving' | 'Inventory' | 'More') => void) | undefined;
  onNavigateToAction?: ((actionLabel: string, item: SubWHNotificationItem) => void) | undefined;
}

export function SubWarehouseNotificationsScreen({
  onBack,
  onTabChange,
  onNavigateToAction,
}: SubWarehouseNotificationsScreenProps) {
  const [notifications, setNotifications] = useState<SubWHNotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');
  const [selectedDetailItem, setSelectedDetailItem] = useState<SubWHNotificationItem | null>(null);
  const [showReviewReceiving, setShowReviewReceiving] = useState(false);

  const categories: CategoryFilter[] = ['All', 'Orders', 'Inventory', 'Receiving', 'Financial'];

  const filteredNotifications = useMemo(() => {
    if (selectedCategory === 'All') return notifications;
    return notifications.filter((n) => n.category === selectedCategory);
  }, [notifications, selectedCategory]);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, isUnread: false })));
    Alert.alert('Notifications', 'All notifications marked as read.');
  };

  const handleItemPress = (item: SubWHNotificationItem) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, isUnread: false } : n))
    );
    if (onNavigateToAction) {
      onNavigateToAction(item.actionLabel ?? 'Detail', item);
    } else {
      setSelectedDetailItem(item);
    }
  };

  if (showReviewReceiving) {
    return (
      <SubWarehouseReviewReceivingScreen
        onBack={() => setShowReviewReceiving(false)}
        onSuccess={() => {
          setShowReviewReceiving(false);
          setSelectedDetailItem(null);
          if (onTabChange) {
            onTabChange('Receiving');
          }
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

  if (selectedDetailItem) {
    return (
      <SubWarehouseNotificationDetailScreen
        onBack={() => setSelectedDetailItem(null)}
        notificationData={{
          title: selectedDetailItem.title === 'QC Required' ? 'Quality Check Required' : selectedDetailItem.title,
          actionRequired: 'Action Required',
          time: selectedDetailItem.timestamp.includes('ago') ? '10:32 AM · Today' : selectedDetailItem.timestamp,
          message:
            selectedDetailItem.title === 'QC Required'
              ? 'A new incoming shipment has arrived at Coonoor Warehouse and requires quantity verification and quality check.'
              : selectedDetailItem.description,
          reference: 'GR-1024',
          source: 'Main Warehouse',
          product: 'Tomato',
          expectedQuantity: '150 KG',
          receivedTime: '10:32 AM',
          readTime: '10:35 AM',
        }}
        onReviewReceiving={() => {
          setShowReviewReceiving(true);
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        decelerationRate={0.985}
        bounces={true}
      >
        {/* ─── Top Brand Header (#F0562A) ─── */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={onBack}
                activeOpacity={0.75}
              >
                <ArrowBackIcon size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitleText}>Notifications</Text>
            </View>

            <TouchableOpacity
              onPress={handleMarkAllRead}
              activeOpacity={0.75}
              style={styles.markAllReadBtn}
            >
              <Text style={styles.markAllReadText}>Mark all read</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Main Content Container ─── */}
        <View style={styles.mainContainer}>
          {/* Category Filter Chips Horizontal Scroll */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
            style={styles.filterScroll}
          >
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.filterChip,
                    isActive && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isActive && styles.filterChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Notifications List Card Container */}
          <View style={styles.listContainer}>
            {filteredNotifications.map((item, index) => {
              const isLast = index === filteredNotifications.length - 1;

              return (
                <View key={item.id}>
                  <TouchableOpacity
                    style={styles.notificationRow}
                    onPress={() => handleItemPress(item)}
                    activeOpacity={0.7}
                  >
                    {/* Status Dot */}
                    <View style={styles.dotCol}>
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor: item.isUnread
                              ? PALETTE.unreadDot
                              : PALETTE.readDot,
                          },
                        ]}
                      />
                    </View>

                    {/* Content Column */}
                    <View style={styles.contentCol}>
                      <Text style={styles.notifTitle}>{item.title}</Text>
                      <Text style={styles.notifDescription}>{item.description}</Text>
                      <Text style={styles.notifTimestamp}>{item.timestamp}</Text>

                      {/* Action Link Button */}
                      {item.actionLabel && (
                        <TouchableOpacity
                          style={styles.actionLinkRow}
                          onPress={() => handleItemPress(item)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.actionLinkText}>{item.actionLabel}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableOpacity>

                  {!isLast && <View style={styles.divider} />}
                </View>
              );
            })}

            {filteredNotifications.length === 0 && (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateTitle}>No Notifications</Text>
                <Text style={styles.emptyStateDesc}>
                  You're all caught up with {selectedCategory.toLowerCase()} alerts!
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* ─── Bottom Navigation Bar ─── */}
      <View style={styles.bottomTabBar}>
        <Pressable
          style={styles.tabItem}
          onPress={() => {
            if (onTabChange) onTabChange('Home');
            else onBack();
          }}
          accessibilityRole="tab"
        >
          <HomeTabIcon active={true} />
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>Home</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => {
            if (onTabChange) onTabChange('Receiving');
          }}
          accessibilityRole="tab"
        >
          <ReceivingTabIcon active={false} />
          <Text style={styles.tabLabel}>Receiving</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => {
            if (onTabChange) onTabChange('Inventory');
          }}
          accessibilityRole="tab"
        >
          <InventoryTabIcon active={false} />
          <Text style={styles.tabLabel}>Inventory</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => {
            if (onTabChange) onTabChange('More');
          }}
          accessibilityRole="tab"
        >
          <MoreTabIcon active={false} />
          <Text style={styles.tabLabel}>More</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ─── Stylesheet ─────────────────────────────────────────────────────────────
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

  // ─── Header Banner ─────────────────────────────────────────────────────────
  headerBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 6,
    marginRight: 6,
    marginLeft: -4,
  },
  headerTitleText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  markAllReadBtn: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  markAllReadText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  // ─── Main Container ────────────────────────────────────────────────────────
  mainContainer: {
    paddingTop: 14,
  },

  // ─── Filter Chips Scroll ───────────────────────────────────────────────────
  filterScroll: {
    marginBottom: 14,
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1.2,
    borderColor: PALETTE.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: PALETTE.primary,
    borderColor: PALETTE.primary,
  },
  filterChipText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // ─── Notification List ─────────────────────────────────────────────────────
  listContainer: {
    paddingHorizontal: 16,
  },
  notificationRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    backgroundColor: 'transparent',
  },
  dotCol: {
    width: 22,
    paddingTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  contentCol: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 4,
  },
  notifDescription: {
    fontSize: 13,
    color: PALETTE.textSecondary,
    lineHeight: 18,
    marginBottom: 5,
    fontWeight: '500',
  },
  notifTimestamp: {
    fontSize: 11.5,
    color: PALETTE.textMuted,
    fontWeight: '500',
  },
  actionLinkRow: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  actionLinkText: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.primary,
  },
  divider: {
    height: 1,
    backgroundColor: PALETTE.divider,
    marginLeft: 22,
  },

  // ─── Empty State ───────────────────────────────────────────────────────────
  emptyStateContainer: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginTop: 10,
  },
  emptyStateTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 6,
  },
  emptyStateDesc: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },

  // ─── Bottom Navigation Bar ─────────────────────────────────────────────────
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.tabBorder,
    paddingVertical: 8,
    paddingBottom: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.tabInactive,
  },
  tabLabelActive: {
    color: PALETTE.primary,
    fontWeight: '700',
  },
});
