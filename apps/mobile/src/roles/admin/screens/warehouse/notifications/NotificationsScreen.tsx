import React, { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { canOpenTarget } from './NotificationParts';
import { NOTIFICATION_WAREHOUSES } from './fixtures';
import type {
  NotificationItem,
  NotificationTarget,
  WarehouseScope,
  WarehouseScreenBaseProps,
} from './types';
import { isAllWarehouses } from '../wallet-cashtopup/WalletParts';
import { warehouseNameOf } from '../wallet-cashtopup/fixtures';
import { WarehouseSelector } from '../inventory';

// ─── SVG Icons Matching Reference Screenshot ────────────────────────────────

function BuildingWarehouseIcon({ size = 16, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 6h4M10 10h4M10 14h4M10 18h4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 14, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="m6 9 6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SettingsGearIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
      <Path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BellHeaderIcon({ size = 21, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
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

function CheckmarkIcon({ size = 18, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Themed Card Icons (Screenshot Warm Palette) ─────────────────────────────

function PackageBoxIcon({ size = 22, color = '#8B5E3C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="m3.3 7 8.7 5 8.7-5M12 22V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CardWalletIcon({ size = 22, color = '#8B5E3C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="3" stroke={color} strokeWidth="2" />
      <Path d="M2 10h20M16 14h2.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function OrderBagIcon({ size = 22, color = '#8B5E3C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 6h18M16 10a4 4 0 0 1-8 0" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function StockAlertIcon({ size = 22, color = '#8B5E3C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" stroke={color} strokeWidth="2" />
      <Path d="M12 9v4M12 16h.01" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function QualityCheckIcon({ size = 22, color = '#8B5E3C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="4" width="14" height="17" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M9 2h6a1 1 0 0 1 1 1v2H8V3a1 1 0 0 1 1-1Z" stroke={color} strokeWidth="2" />
      <Path d="m9 12 2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TruckTransferIcon({ size = 22, color = '#8B5E3C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="5.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
      <Circle cx="18.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function ReturnBoxIcon({ size = 22, color = '#8B5E3C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 14 4 9l5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DocumentDefaultIcon({ size = 22, color = '#8B5E3C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function NotificationCardIcon({ item }: { item: NotificationItem }) {
  const cat = item.category;
  const target = item.target;
  if (target === 'Wallet' || cat === 'wallet') {
    return <CardWalletIcon size={22} />;
  }
  if (target === 'Orders' || cat === 'order') {
    return <OrderBagIcon size={22} />;
  }
  if (target === 'Stock' || cat === 'inventory') {
    return <StockAlertIcon size={22} />;
  }
  if (target === 'ReviewReceiving' || cat === 'quality' || cat === 'mismatch') {
    return <QualityCheckIcon size={22} />;
  }
  if (target === 'Returns' || cat === 'returns') {
    return <ReturnBoxIcon size={22} />;
  }
  if (cat === 'shipment') {
    return <TruckTransferIcon size={22} />;
  }
  if (cat === 'received' || target === 'Receiving') {
    return <PackageBoxIcon size={22} />;
  }
  return <DocumentDefaultIcon size={22} />;
}

// ─── Component Props ─────────────────────────────────────────────────────────

export interface NotificationsScreenProps extends WarehouseScreenBaseProps {
  notifications: readonly NotificationItem[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll?: (() => void) | undefined;
  onSelectNotification: (item: NotificationItem) => void;
  onOpenTarget?: ((target: NotificationTarget, item: NotificationItem) => void) | undefined;
  onOpenAlerts?: (() => void) | undefined;
  onOpenSettings?: (() => void) | undefined;
  initialFilter?: string | undefined;
  onOpenProfile?: (() => void) | undefined;
  warehouseOptions?: readonly WarehouseScope[] | undefined;
}

export function NotificationsScreen({
  scope,
  can,
  onBack,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onSelectNotification,
  onOpenTarget,
  onOpenSettings,
  warehouseOptions = NOTIFICATION_WAREHOUSES,
}: NotificationsScreenProps) {
  const allWarehouses = isAllWarehouses(scope);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);

  // Filter items by warehouse
  const visible = useMemo(() => {
    let list = notifications;
    if (scope.warehouseId !== undefined) {
      list = list.filter((n) => n.warehouseId === scope.warehouseId || !n.warehouseId);
    } else if (selectedWarehouseId) {
      list = list.filter((n) => n.warehouseId === selectedWarehouseId);
    }
    return list;
  }, [notifications, scope.warehouseId, selectedWarehouseId]);

  // Warehouse pill display label
  const warehousePillLabel = useMemo(() => {
    if (scope.warehouseId !== undefined) {
      return scope.warehouseName ?? warehouseNameOf(scope.warehouseId) ?? 'My Warehouse';
    }
    if (!selectedWarehouseId) return 'All Warehouses';
    const found = warehouseOptions.find((w) => w.warehouseId === selectedWarehouseId);
    return found?.warehouseName ?? warehouseNameOf(selectedWarehouseId);
  }, [scope, selectedWarehouseId, warehouseOptions]);

  const handlePressItem = (item: NotificationItem) => {
    if (!item.isRead) onMarkAsRead(item.id);
    if (item.target !== undefined && onOpenTarget !== undefined && canOpenTarget(can, item.target)) {
      onOpenTarget(item.target, item);
    } else {
      onSelectNotification(item);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#F0562A" />

      {/* Header Matching Reference Screenshot */}
      <View style={styles.header}>
        <SafeAreaView style={styles.headerSafeArea}>
          {/* Top Row: Back button, Bell Icon, Title, Settings Gear Button */}
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeftGroup}>
              {onBack !== undefined && (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={onBack}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Back"
                >
                  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M19 12H5M12 19l-7-7 7-7"
                      stroke="#FFFFFF"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </TouchableOpacity>
              )}
              <BellHeaderIcon size={21} color="#FFFFFF" />
              <Text style={styles.headerTitle}>Notifications</Text>
            </View>

            <TouchableOpacity
              style={styles.gearButton}
              onPress={onOpenSettings ?? onMarkAllAsRead}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Notification settings"
            >
              <SettingsGearIcon size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Warehouse Selector */}
          {allWarehouses ? (
            <WarehouseSelector
              scope={scope}
              options={warehouseOptions}
              selectedId={selectedWarehouseId}
              onSelect={setSelectedWarehouseId}
            />
          ) : (
            <View style={styles.warehousePill}>
              <BuildingWarehouseIcon size={16} color="#FFFFFF" />
              <Text style={styles.warehousePillText}>{warehousePillLabel}</Text>
            </View>
          )}
        </SafeAreaView>
      </View>

      {/* Notifications List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {visible.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptySubtitle}>
              {selectedWarehouseId ? 'No notifications for this warehouse.' : 'All caught up!'}
            </Text>
          </View>
        ) : (
          visible.map((item) => {
            const whName =
              item.warehouseName ?? (item.warehouseId ? warehouseNameOf(item.warehouseId) : 'Main Warehouse');
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.notificationCard}
                onPress={() => handlePressItem(item)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}, ${item.message}, ${item.timestamp}, ${whName}`}
              >
                {/* Left Themed Icon Chip */}
                <View style={styles.iconChip}>
                  <NotificationCardIcon item={item} />
                </View>

                {/* Right Content Column */}
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardMessage} numberOfLines={2}>
                    {item.message}
                  </Text>
                  <Text style={styles.cardFooter}>
                    {item.timestamp} · {whName}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F4EE',
  },
  header: {
    backgroundColor: '#F0562A',
    paddingBottom: 14,
  },
  headerSafeArea: {
    backgroundColor: '#F0562A',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 8 : 4,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    paddingRight: 10,
    paddingVertical: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  gearButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warehousePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginTop: 10,
    gap: 7,
  },
  warehousePillText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  list: {
    flex: 1,
    backgroundColor: '#F7F4EE',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 36,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECE6DC',
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  iconChip: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#FDF2E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    marginTop: 2,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 3,
  },
  cardMessage: {
    fontSize: 13.5,
    fontWeight: '400',
    color: '#5F5E5A',
    lineHeight: 18,
    marginBottom: 5,
  },
  cardFooter: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8C827A',
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#7E7A75',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxHeight: '70%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0ECE4',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  modalCloseText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8C827A',
    paddingHorizontal: 4,
  },
  modalList: {
    maxHeight: 280,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginVertical: 2,
  },
  modalItemSelected: {
    backgroundColor: '#FDF2E9',
  },
  modalItemText: {
    fontSize: 14.5,
    fontWeight: '500',
    color: '#2B2724',
  },
  modalItemTextSelected: {
    fontWeight: '700',
    color: '#F0562A',
  },
});
