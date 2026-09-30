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
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';

export interface WarehouseNotification {
  id: string;
  type: 'shipment' | 'quality' | 'mismatch' | 'inventory' | 'success';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  tag?: string;
  shipmentCode?: string;
}

interface WarehouseNotificationsScreenProps {
  notifications: WarehouseNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onAddNotification: () => void;
  onClearAll: () => void;
  onBack: () => void;
}

/* ─── SVG Icons ─── */
function BackArrowWhiteIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BellLargeIcon({ color = '#FFFFFF' }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckAllIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L7 17l-5-5" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M22 10l-7.5 7.5-2-2" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TruckIcon({ color = '#0284C7' }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="5.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
      <Circle cx="18.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function ClipboardIcon({ color = '#D97706' }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="4" width="14" height="17" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M9 2h6a1 1 0 0 1 1 1v2H8V3a1 1 0 0 1 1-1z" stroke={color} strokeWidth="2" />
      <Path d="M9 11h6M9 15h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function AlertIcon({ color = '#DC2626' }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3L2 20h20L12 3z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="12" cy="17" r="1" fill={color} />
    </Svg>
  );
}

function BoxIcon({ color = '#7C3AED' }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke={color} strokeWidth="2" />
      <Path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SuccessCheckIcon({ color = '#1E8E5A' }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M8 12l2.5 2.5L16 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}


export function WarehouseNotificationsScreen({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onAddNotification,
  onClearAll,
  onBack,
}: WarehouseNotificationsScreenProps) {
  const [activeFilter, setActiveFilter] = useState<'All' | 'Unread' | 'Shipments' | 'Quality' | 'Alerts'>('All');

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filteredList = notifications.filter(item => {
    if (activeFilter === 'Unread') return !item.isRead;
    if (activeFilter === 'Shipments') return item.type === 'shipment' || item.type === 'success';
    if (activeFilter === 'Quality') return item.type === 'quality';
    if (activeFilter === 'Alerts') return item.type === 'mismatch' || item.type === 'inventory';
    return true;
  });

  const getIconForType = (type: WarehouseNotification['type']) => {
    switch (type) {
      case 'shipment':
        return { icon: <TruckIcon />, bg: '#E0F2FE', tagBg: '#E0F2FE', tagColor: '#0369A1' };
      case 'quality':
        return { icon: <ClipboardIcon />, bg: '#FEF3C7', tagBg: '#FEF3C7', tagColor: '#B45309' };
      case 'mismatch':
        return { icon: <AlertIcon />, bg: '#FEE2E2', tagBg: '#FEE2E2', tagColor: '#DC2626' };
      case 'inventory':
        return { icon: <BoxIcon />, bg: '#EDE9FE', tagBg: '#EDE9FE', tagColor: '#6D28D9' };
      case 'success':
        return { icon: <SuccessCheckIcon />, bg: '#DCFCE7', tagBg: '#DCFCE7', tagColor: '#15803D' };
    }
  };

  return (
    <View style={styles.container}>
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <BackArrowWhiteIcon />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Notifications</Text>
            <Text style={styles.headerSub}>
              Coonoor Warehouse · {unreadCount} new {unreadCount === 1 ? 'alert' : 'alerts'}
            </Text>
          </View>

          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.markAllBtn}
              onPress={onMarkAllAsRead}
              activeOpacity={0.8}
            >
              <CheckAllIcon />
              <Text style={styles.markAllText}>Read All</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ─── Filter Pills ─── */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {(['All', 'Unread', 'Shipments', 'Quality', 'Alerts'] as const).map(tab => {
            const count =
              tab === 'All'
                ? notifications.length
                : tab === 'Unread'
                ? unreadCount
                : tab === 'Shipments'
                ? notifications.filter(n => n.type === 'shipment' || n.type === 'success').length
                : tab === 'Quality'
                ? notifications.filter(n => n.type === 'quality').length
                : notifications.filter(n => n.type === 'mismatch' || n.type === 'inventory').length;

            const isActive = activeFilter === tab;

            return (
              <TouchableOpacity
                key={tab}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setActiveFilter(tab)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                  {tab} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ─── Notifications List ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <BellLargeIcon color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>All Caught Up!</Text>
            <Text style={styles.emptySub}>
              {activeFilter === 'Unread'
                ? 'No unread notifications at the moment.'
                : 'No notifications in this category.'}
            </Text>
          </View>
        ) : (
          filteredList.map(item => {
            const meta = getIconForType(item.type);

            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.notifCard, !item.isRead && styles.notifCardUnread]}
                onPress={() => onMarkAsRead(item.id)}
                activeOpacity={0.85}
              >
                <View style={[styles.notifIconWrap, { backgroundColor: meta.bg }]}>
                  {meta.icon}
                </View>

                <View style={styles.notifContent}>
                  <View style={styles.notifHeaderRow}>
                    <Text style={[styles.notifTitle, !item.isRead && styles.notifTitleBold]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.notifTime}>{item.timestamp}</Text>
                  </View>

                  <Text style={styles.notifDesc} numberOfLines={2}>
                    {item.message}
                  </Text>

                  <View style={styles.notifFooterRow}>
                    {item.tag && (
                      <View style={[styles.notifTag, { backgroundColor: meta.tagBg }]}>
                        <Text style={[styles.notifTagText, { color: meta.tagColor }]}>
                          {item.tag}
                        </Text>
                      </View>
                    )}

                    {!item.isRead && (
                      <View style={styles.unreadIndicatorRow}>
                        <View style={styles.unreadDot} />
                        <Text style={styles.unreadLabel}>Tap to read</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  header: {
    backgroundColor: '#F0562A',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    padding: 6,
    marginRight: 4,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12.5,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.92)',
    marginTop: 2,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 5,
  },
  markAllText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  filterRow: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#EBE5DC',
    paddingVertical: 10,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3EFEA',
  },
  filterPillActive: {
    backgroundColor: '#F0562A',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  notifCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: '#EBE5DC',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  notifCardUnread: {
    borderColor: '#FCD9CE',
    backgroundColor: '#FFFAF7',
  },
  notifIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifContent: {
    flex: 1,
  },
  notifHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#1E1612',
    flex: 1,
    marginRight: 6,
  },
  notifTitleBold: {
    fontWeight: '800',
  },
  notifTime: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  notifDesc: {
    fontSize: 13,
    color: '#524B46',
    lineHeight: 18,
    marginBottom: 8,
  },
  notifFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notifTag: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  notifTagText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  unreadIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#F0562A',
  },
  unreadLabel: {
    fontSize: 11,
    color: '#F0562A',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EBE5DC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E1612',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: '#7A726C',
    textAlign: 'center',
    maxWidth: 240,
  },
});
