import React, { useMemo, useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
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

function BellOutlineIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = adminColors.placeholder }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Line x1="16.5" y1="16.5" x2="21" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 16, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="21" x2="4" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="10" x2="4" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="21" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="8" x2="12" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="20" y1="21" x2="20" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="20" y1="12" x2="20" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="1" y1="14" x2="7" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="9" y1="8" x2="15" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="17" y1="16" x2="23" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function RefreshArrowsIcon({ size = 16, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BoxIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ClipboardIcon({ size = 20, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="17" rx="2.5" stroke={color} strokeWidth="1.8" />
      <Path d="M9 2.5h6a1 1 0 011 1V5H8V3.5a1 1 0 011-1z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <Path d="M8.5 13l2.5 2.5 5-5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UsersIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="1.8" />
      <Path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CashIcon({ size = 20, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="12" rx="2" stroke={color} strokeWidth="1.8" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.8" />
      <Path d="M6 12h.01M18 12h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function WarningTriangleIcon({ size = 20, color = adminColors.warning.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="12" cy="17" r="1" fill={color} />
    </Svg>
  );
}

function CloseIcon({ size = 18, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Bottom Tab Icons ────────────────────────────────────────────────────────

function TabHomeIcon({ active }: { active: boolean }) {
  const color = active ? adminColors.brand : adminColors.muted;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
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

function TabWorkQueueIcon({ active }: { active: boolean }) {
  const color = active ? adminColors.brand : adminColors.muted;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 6h13M8 12h13M8 18h13M3 6l1.5 1.5L7 5M3 12l1.5 1.5L7 11M3 18l1.5 1.5L7 17"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TabInventoryIcon({ active }: { active: boolean }) {
  const color = active ? adminColors.brand : adminColors.muted;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
        stroke={color}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"
        stroke={color}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TabFinanceIcon({ active }: { active: boolean }) {
  const color = active ? adminColors.brand : adminColors.muted;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="2" stroke={color} strokeWidth="1.9" />
      <Line x1="2" y1="10" x2="22" y2="10" stroke={color} strokeWidth="1.9" />
    </Svg>
  );
}

function TabMoreIcon({ active }: { active: boolean }) {
  const color = active ? adminColors.brand : adminColors.muted;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="5" cy="12" r="1.8" fill={color} />
      <Circle cx="12" cy="12" r="1.8" fill={color} />
      <Circle cx="19" cy="12" r="1.8" fill={color} />
    </Svg>
  );
}

// ─── Data Types & Fixtures ───────────────────────────────────────────────────

export interface TohfaNotificationItem {
  id: string;
  type: 'inventory' | 'audit' | 'farmers' | 'finance' | 'warning';
  title: string;
  body: string;
  reference: string;
  categoryTime: string;
  unread: boolean;
  actionRequired?: boolean;
}

const INITIAL_TOHFA_NOTIFICATIONS: readonly TohfaNotificationItem[] = [
  {
    id: 'tn-1',
    type: 'warning',
    title: 'Kotagiri stock at 31% — below threshold',
    body: 'Central inventory alert: Kotagiri warehouse produce storage is low. Consider initiating an inter-warehouse transfer.',
    reference: 'WH-KOTA-01 · Kotagiri Node',
    categoryTime: 'Inventory Alert · Today, 09:15',
    unread: true,
    actionRequired: true,
  },
  {
    id: 'tn-2',
    type: 'audit',
    title: '7 farms overdue for quarterly audit',
    body: 'Quarterly compliance window closes in 5 days. Assigned field auditors require scheduling review.',
    reference: 'AUD-Q3-2026 · Nilgiris Region',
    categoryTime: 'Audit Management · Today, 08:30',
    unread: true,
    actionRequired: true,
  },
  {
    id: 'tn-3',
    type: 'farmers',
    title: '4 Farmer registration applications pending',
    body: 'New farmer applications submitted for verification. Aadhaar & land records awaiting document review.',
    reference: 'REG-2026-0044 · Coonoor Zone',
    categoryTime: 'Farmers Management · Yesterday, 17:40',
    unread: true,
    actionRequired: false,
  },
  {
    id: 'tn-4',
    type: 'finance',
    title: 'Payout batch awaiting authorization',
    body: 'Weekly farmer produce payout batch of ₹1,42,500 across 14 farmers prepared for fund release.',
    reference: 'PAY-BATCH-2026-W42 · Bank Transfer',
    categoryTime: 'Finance & Payouts · Yesterday, 14:10',
    unread: false,
    actionRequired: true,
  },
  {
    id: 'tn-5',
    type: 'inventory',
    title: 'Stock intake verified at Central Hub',
    body: 'Batch BATCH-2026-10-09-001 (Hill Garlic) accepted and graded A1. Added to active marketplace inventory.',
    reference: 'GRN-2026-0188 · Central Hub',
    categoryTime: 'Warehouse Operations · 12 Oct 2026, 11:20',
    unread: false,
    actionRequired: false,
  },
  {
    id: 'tn-6',
    type: 'warning',
    title: '12 Organic certifications expiring within 30 days',
    body: 'Annual organic farming certifications up for renewal. Listings will require grace period approval.',
    reference: 'COMP-EXP-2026-10 · All Zones',
    categoryTime: 'Compliance & Audits · 11 Oct 2026, 16:05',
    unread: false,
    actionRequired: false,
  },
];

// ─── Component Props ─────────────────────────────────────────────────────────

export interface TohfaAdminNotificationsScreenProps {
  onBack: () => void;
  onTabChange?: (tab: 'Home' | 'WorkQueue' | 'Inventory' | 'Finance' | 'More') => void;
}

export function TohfaAdminNotificationsScreen({
  onBack,
  onTabChange,
}: TohfaAdminNotificationsScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<readonly TohfaNotificationItem[]>(
    INITIAL_TOHFA_NOTIFICATIONS,
  );
  const [activeFilter, setActiveFilter] = useState<'All' | 'Unread' | 'Inventory' | 'Audits' | 'Farmers' | 'Finance'>('All');
  const [showFilterPills, setShowFilterPills] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<TohfaNotificationItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const unreadCount = useMemo(
    () => notifications.filter((n) => n.unread).length,
    [notifications],
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (activeFilter === 'Unread' && !item.unread) return false;
      if (activeFilter === 'Inventory' && item.type !== 'inventory' && item.type !== 'warning') return false;
      if (activeFilter === 'Audits' && item.type !== 'audit') return false;
      if (activeFilter === 'Farmers' && item.type !== 'farmers') return false;
      if (activeFilter === 'Finance' && item.type !== 'finance') return false;

      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.body.toLowerCase().includes(q) ||
          item.reference.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [notifications, activeFilter, searchQuery]);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    showToast('All notifications marked as read');
  };

  const handleCardPress = (item: TohfaNotificationItem) => {
    if (item.unread) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n)),
      );
    }
    setSelectedNotification(item);
  };

  const renderIcon = (type: TohfaNotificationItem['type']) => {
    switch (type) {
      case 'inventory':
        return <BoxIcon size={20} color={adminColors.brand} />;
      case 'audit':
        return <ClipboardIcon size={20} color={adminColors.brandDeep} />;
      case 'farmers':
        return <UsersIcon size={20} color={adminColors.brand} />;
      case 'finance':
        return <CashIcon size={20} color={adminColors.brandDeep} />;
      case 'warning':
        return <WarningTriangleIcon size={20} color={adminColors.warning.text} />;
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header Banner: Warm Terracotta Orange matching Farmer Admin */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>

          <View style={styles.headerTitleGroup}>
            <BellOutlineIcon size={22} color={adminColors.onBrand} />
            <Text style={styles.headerTitle}>Notifications Center</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {toastMessage !== null && (
          <View style={styles.toastBanner}>
            <Text style={styles.toastBannerText}>{toastMessage}</Text>
          </View>
        )}

        {/* Search Bar */}
        <View style={styles.searchBox}>
          <SearchIcon size={18} color={adminColors.placeholder} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search operational notifications..."
            placeholderTextColor={adminColors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Unread Counter Row */}
        <View style={styles.countRow}>
          <Text style={styles.countText}>
            <Text style={styles.countBold}>{unreadCount} unread</Text> notifications
          </Text>
        </View>

        {/* Filter and Action Buttons */}
        <View style={styles.actionBtnRow}>
          <TouchableOpacity
            style={[styles.actionBtn, showFilterPills && styles.actionBtnActive]}
            onPress={() => setShowFilterPills(!showFilterPills)}
            activeOpacity={0.75}
          >
            <FilterSlidersIcon size={16} color={showFilterPills ? adminColors.brandDeep : adminColors.ink} />
            <Text style={[styles.actionBtnText, showFilterPills && styles.actionBtnTextActive]}>
              Filter
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => showToast('Notifications list refreshed')}
            activeOpacity={0.75}
          >
            <RefreshArrowsIcon size={16} color={adminColors.ink} />
            <Text style={styles.actionBtnText}>Refresh</Text>
          </TouchableOpacity>

          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleMarkAllRead}
              activeOpacity={0.75}
            >
              <Text style={styles.actionBtnText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Horizontal Filter Chips */}
        {showFilterPills && (
          <View style={styles.filterPillsContainer}>
            {(['All', 'Unread', 'Inventory', 'Audits', 'Farmers', 'Finance'] as const).map((chip) => {
              const isActive = activeFilter === chip;
              return (
                <TouchableOpacity
                  key={chip}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={() => setActiveFilter(chip)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                    {chip}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Notifications Cards Container */}
        <View style={styles.cardsContainer}>
          {filteredNotifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No notifications found</Text>
              <Text style={styles.emptySub}>Try clearing your search or filter</Text>
            </View>
          ) : (
            filteredNotifications.map((item) => {
              const isUnread = item.unread;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.notificationCard,
                    isUnread ? styles.notificationCardUnread : styles.notificationCardRead,
                  ]}
                  onPress={() => handleCardPress(item)}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardIconBox}>{renderIcon(item.type)}</View>

                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.title}
                    </Text>

                    <View style={styles.badgesRow}>
                      {item.unread && (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadBadgeText}>Unread</Text>
                        </View>
                      )}
                      {item.actionRequired && (
                        <View style={styles.actionRequiredBadge}>
                          <Text style={styles.actionRequiredBadgeText}>Action required</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <Text style={styles.cardBodyText}>{item.body}</Text>
                  {Boolean(item.reference) && (
                    <Text style={styles.cardRefText}>{item.reference}</Text>
                  )}
                  <Text style={styles.cardMetaText}>{item.categoryTime}</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={{ height: adminSpacing.xxxl }} />
      </ScrollView>

      {/* Modal Detail */}
      <Modal
        visible={selectedNotification !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedNotification(null)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setSelectedNotification(null)}
        >
          <View style={styles.modalCard}>
            {selectedNotification && (
              <>
                <View style={styles.modalHeaderRow}>
                  <View style={styles.modalIconWrap}>{renderIcon(selectedNotification.type)}</View>
                  <Text style={styles.modalTitle} numberOfLines={2}>
                    {selectedNotification.title}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setSelectedNotification(null)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <CloseIcon size={20} color={adminColors.muted} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalMeta}>{selectedNotification.categoryTime}</Text>
                <Text style={styles.modalRef}>{selectedNotification.reference}</Text>

                <View style={styles.modalDivider} />

                <Text style={styles.modalBody}>{selectedNotification.body}</Text>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCloseBtn}
                    onPress={() => setSelectedNotification(null)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.modalCloseBtnText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* TOHFA Admin Bottom Tab Bar (5 tabs matching TOHFA Admin Home) */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onTabChange?.('Home')}
          activeOpacity={0.75}
          accessibilityRole="tab"
          accessibilityLabel="Home"
        >
          <TabHomeIcon active={false} />
          <Text style={styles.tabLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onTabChange?.('WorkQueue')}
          activeOpacity={0.75}
          accessibilityRole="tab"
          accessibilityLabel="Work Queue"
        >
          <TabWorkQueueIcon active={false} />
          <Text style={styles.tabLabel}>Work Queue</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onTabChange?.('Inventory')}
          activeOpacity={0.75}
          accessibilityRole="tab"
          accessibilityLabel="Inventory"
        >
          <TabInventoryIcon active={false} />
          <Text style={styles.tabLabel}>Inventory</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onTabChange?.('Finance')}
          activeOpacity={0.75}
          accessibilityRole="tab"
          accessibilityLabel="Finance"
        >
          <TabFinanceIcon active={false} />
          <Text style={styles.tabLabel}>Finance</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onTabChange?.('More')}
          activeOpacity={0.75}
          accessibilityRole="tab"
          accessibilityLabel="More"
        >
          <TabMoreIcon active={false} />
          <Text style={styles.tabLabel}>More</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Stylesheet ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
  },
  backBtn: {
    padding: adminSpacing.xs,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    flex: 1,
  },
  headerTitle: {
    ...adminType.h3,
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: adminSpacing.lg,
  },
  toastBanner: {
    backgroundColor: adminColors.ink,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.sm,
    paddingHorizontal: adminSpacing.md,
    marginBottom: adminSpacing.md,
    alignItems: 'center',
  },
  toastBannerText: {
    ...adminType.caption,
    color: adminColors.onBrand,
    fontWeight: '600',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    padding: 0,
  },
  clearSearchText: {
    ...adminType.caption,
    color: adminColors.muted,
    paddingHorizontal: adminSpacing.xs,
  },
  countRow: {
    marginBottom: adminSpacing.sm,
  },
  countText: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  countBold: {
    fontWeight: '700',
    color: adminColors.brand,
  },
  actionBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    ...adminShadow.sm,
  },
  actionBtnActive: {
    backgroundColor: adminColors.brandTint,
    borderColor: adminColors.brand,
  },
  actionBtnText: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.ink,
  },
  actionBtnTextActive: {
    color: adminColors.brandDeep,
  },
  filterPillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.xs,
    marginBottom: adminSpacing.md,
  },
  filterChip: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.pill,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  filterChipActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  filterChipText: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.ink,
  },
  filterChipTextActive: {
    color: adminColors.onBrand,
  },
  cardsContainer: {
    gap: adminSpacing.md,
  },
  notificationCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.lg,
    borderWidth: 1,
    ...adminShadow.sm,
  },
  notificationCardUnread: {
    borderColor: adminColors.brand,
    backgroundColor: adminColors.card,
  },
  notificationCardRead: {
    borderColor: adminColors.border,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.xs,
  },
  cardIconBox: {
    width: 32,
    height: 32,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    flex: 1,
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
  },
  unreadBadge: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.pill,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 2,
  },
  unreadBadgeText: {
    ...adminType.micro,
    color: adminColors.brand,
    fontWeight: '700',
  },
  actionRequiredBadge: {
    backgroundColor: adminColors.warning.bg,
    borderRadius: adminRadius.pill,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 2,
  },
  actionRequiredBadgeText: {
    ...adminType.micro,
    color: adminColors.warning.text,
    fontWeight: '700',
  },
  cardBodyText: {
    ...adminType.body,
    color: adminColors.ink,
    marginVertical: adminSpacing.xs,
    lineHeight: 20,
  },
  cardRefText: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.brandDeep,
    marginBottom: 2,
  },
  cardMetaText: {
    ...adminType.micro,
    color: adminColors.muted,
  },
  emptyState: {
    paddingVertical: adminSpacing.xxxl,
    alignItems: 'center',
  },
  emptyTitle: {
    ...adminType.h3,
    color: adminColors.ink,
    marginBottom: adminSpacing.xs,
  },
  emptySub: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: adminOverlay.dark,
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.xl,
  },
  modalCard: {
    width: '100%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.xl,
    ...adminShadow.md,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  modalIconWrap: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    flex: 1,
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },
  modalMeta: {
    ...adminType.micro,
    color: adminColors.muted,
    marginTop: adminSpacing.xs,
  },
  modalRef: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.brandDeep,
    marginTop: 2,
  },
  modalDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: adminSpacing.md,
  },
  modalBody: {
    ...adminType.body,
    color: adminColors.ink,
    lineHeight: 22,
    marginBottom: adminSpacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalCloseBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.xl,
    paddingVertical: adminSpacing.sm,
  },
  modalCloseBtnText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingVertical: adminSpacing.xs,
    paddingBottom: adminSpacing.sm,
    ...adminShadow.sm,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: adminSpacing.xs,
  },
  tabLabel: {
    ...adminType.micro,
    color: adminColors.muted,
    marginTop: 2,
    fontWeight: '500',
  },
});
