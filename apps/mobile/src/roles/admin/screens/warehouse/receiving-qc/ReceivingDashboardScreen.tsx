/**
 * Goods Receiving dashboard (the Receiving tab hub), shared by the Main and
 * Sub warehouse admins.
 *
 * Designed to match the exact design reference with matching font size, font weight,
 * and font colors:
 * - Header: Receiving Dashboard with All Warehouses dropdown and refresh action
 * - 6 KPI cards (Expected Today, Arrived, In Progress, Completed, Discrepancies, Avg Turnaround)
 * - Shipment Arrived button (kept from start receiving button, with name changed to shipment arrived)
 * - Receiving Activity pipeline card (clean 3-line layout)
 * - Pending Receiving Queue with 6 status rows
 * - Quick Actions 2x2 grid (Damage / Mismatch Report, Goods Receipt Summary, Transfer Receiving, Receiving History)
 * - View Incoming Shipments action button
 * - Bottom tab bar (Home, Receiving, Inventory, More)
 */
import React, { useState } from 'react';
import {
  Modal,
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

import { WALLET_WAREHOUSES, warehouseNameOf } from '../wallet-cashtopup/fixtures';
import { WarehouseTabBar } from '../wallet-cashtopup/WalletParts';
import {
  INCOMING_SHIPMENTS,
  QUALITY_ISSUES,
  RECEIVING_RECORDS,
  inReceivingScope,
  isMainScope,
} from './fixtures';
import {
  PermissionNote,
  RECEIVING_CODES,
  canViewReceiving,
} from './ReceivingParts';
import type {
  HistoryFilter,
  IncomingShipment,
  QualityIssue,
  ReceivingRecord,
  ShipmentFilterTab,
  WarehouseScreenBaseProps,
} from './types';

const THEME_ACCENT = '#F0562A';
const TITLE_BROWN = '#7A2E14';
const TEXT_DARK = '#111827';
const TEXT_MUTED = '#4B5563';

// ─── Custom Icons Matching the Reference Image ─────────────────────────────

function InboxArrowDownIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="3" stroke={color} strokeWidth="2.2" />
      <Path d="M12 7v7M9 11.5l3 3 3-3" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 14h4.5a1.5 1.5 0 0 1 1.5 1.5v0a1.5 1.5 0 0 0 1.5 1.5h3a1.5 1.5 0 0 0 1.5-1.5v0a1.5 1.5 0 0 1 1.5-1.5H21" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function RefreshIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function WarehouseBuildingIcon({ size = 15, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 21h18M3 10h18M5 10v11M9 10v11M15 10v11M19 10v11M12 3l9 7H3l9-7z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronDownSmallIcon({ size = 13, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CrateInventoryWhiteIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth="2.2" />
      <Path d="M3 10h18M10 4v6M14 4v6" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function AlertCircleQuickIcon({ size = 24, color = THEME_ACCENT }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2.2" />
      <Path d="M12 7.5v6M12 16.5h.01" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    </Svg>
  );
}

function ReceiptQuickIcon({ size = 24, color = THEME_ACCENT }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1 2-1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M8 7h8M8 11h8M8 15h5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function TransferArrowsQuickIcon({ size = 24, color = THEME_ACCENT }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17 5l4 4-4 4M21 9H7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 19l-4-4 4-4M3 15h14" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function HistoryClockQuickIcon({ size = 24, color = THEME_ACCENT }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 3v5h5M12 7v5l3.5 2" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function GoodsDeliveryTruckIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="5.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2.2" />
      <Circle cx="18.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2.2" />
    </Svg>
  );
}

function NotificationBellHeaderIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LockSmallIcon({ size = 12, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="11" width="16" height="11" rx="2" stroke={color} strokeWidth="2.2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function CalendarOverviewIcon({ size = 20, color = '#8A4E15' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="3" stroke={color} strokeWidth="2" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function DotsCircleOverviewIcon({ size = 20, color = '#8A4E15' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Circle cx="8" cy="12" r="1.3" fill={color} />
      <Circle cx="12" cy="12" r="1.3" fill={color} />
      <Circle cx="16" cy="12" r="1.3" fill={color} />
    </Svg>
  );
}

function FlaskOverviewIcon({ size = 20, color = '#8A4E15' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 3h6M10 3v5l-4.5 7.5A2 2 0 0 0 7.2 19h9.6a2 2 0 0 0 1.7-3.5L14 8V3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M7.5 15h9" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

function BranchingArrowsOverviewIcon({ size = 20, color = '#8A4E15' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckCircleOverviewIcon({ size = 20, color = '#8A4E15' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M8.5 12l2.5 2.5 5-5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function AlertCircleOverviewIcon({ size = 20, color = '#8A4E15' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 7.5v5M12 15.5h.01" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    </Svg>
  );
}

function WarningTriangleSubIcon({ size = 20, color = '#D97706' }: { size?: number; color?: string }) {
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

function DamagePhotoIcon({ size = 20, color = '#EF4444' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="3" stroke={color} strokeWidth="2" />
      <Circle cx="8.5" cy="8.5" r="1.5" fill={color} />
      <Path d="M21 15l-5-5L5 21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightIcon({ size = 16, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Component Props ─────────────────────────────────────────────────────────

export interface ReceivingDashboardScreenProps extends WarehouseScreenBaseProps {
  shipments?: IncomingShipment[] | undefined;
  records?: ReceivingRecord[] | undefined;
  issues?: QualityIssue[] | undefined;
  unreadNotifications?: number | undefined;
  onOpenNotifications?: (() => void) | undefined;
  onOpenShipments: (tab: ShipmentFilterTab) => void;
  onOpenHistory: (filter: HistoryFilter) => void;
  onOpenQualityIssues: () => void;
  onSelectIssue: (issue: QualityIssue) => void;
  onSelectRecord: (receiptId: string) => void;
  /** Start Receiving / Shipment Arrived (needs inventory.goods_receipt.record). */
  onStartReceiving: () => void;
  /** Main: inter-warehouse arrivals (the transfers flow). */
  onOpenTransferReceiving?: (() => void) | undefined;
  /** Goods Receipt Summary quick action navigation */
  onOpenGoodsReceiptSummary?: (() => void) | undefined;
}

export function ReceivingDashboardScreen({
  scope,
  can,
  onBack,
  onTabChange,
  shipments = INCOMING_SHIPMENTS,
  records = RECEIVING_RECORDS,
  issues = QUALITY_ISSUES,
  unreadNotifications = 0,
  onOpenNotifications,
  onOpenShipments,
  onOpenHistory,
  onOpenQualityIssues,
  onSelectIssue,
  onSelectRecord,
  onStartReceiving,
  onOpenTransferReceiving,
  onOpenGoodsReceiptSummary,
}: ReceivingDashboardScreenProps) {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);
  const [warehouseModalVisible, setWarehouseModalVisible] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const mainView = isMainScope(scope);
  const canView = canViewReceiving(can);
  const canRecord = can(RECEIVING_CODES.receiptRecord);

  // 6 KPI cards matching the reference image layout, font size, and font color
  const kpis = [
    {
      label: 'EXPECTED TODAY',
      value: 24,
      sub: 'shipments',
      onPress: () => onOpenShipments('Expected'),
    },
    {
      label: 'ARRIVED',
      value: 19,
      sub: 'shipments',
      onPress: () => onOpenShipments('Receiving'),
    },
    {
      label: 'IN PROGRESS',
      value: 5,
      sub: 'receiving',
      onPress: () => onOpenShipments('Receiving'),
    },
    {
      label: 'COMPLETED',
      value: 14,
      sub: 'today',
      onPress: () => onOpenHistory('Accepted'),
    },
    {
      label: 'DISCREPANCIES',
      value: 2,
      sub: 'flagged',
      onPress: onOpenQualityIssues,
    },
    {
      label: 'AVG TURNAROUND',
      value: 38,
      sub: 'minutes',
      onPress: () => onOpenHistory('All'),
    },
  ];

  // Pipeline text from reference image
  const PIPELINE_TEXT = mainView
    ? 'Shipment Created → Arrived → Receiving Started → Quantity Checked → Quality Checked → Decision → Batch Assigned → Storage Assigned → Receipt Completed'
    : 'Shipment Created → Arrived → Receiving Started → Quantity Checked → Quality Checked → Decision → Storage Assigned → Receipt Completed';

  // Rows in Pending Receiving Queue matching reference image
  const queueRows = [
    { label: 'Arrived', value: 19 },
    { label: 'In Progress', value: 6 },
    { label: 'QC Pending', value: 5 },
    { label: 'Decision Pending', value: 3 },
    ...(mainView ? [{ label: 'Batch Pending', value: 2 }] : []),
    { label: 'Storage Pending', value: 1 },
  ];

  // 4 Quick Action cards matching reference image
  const quickActions = [
    {
      title: 'Damage / Mismatch Report',
      icon: <AlertCircleQuickIcon />,
      onPress: onOpenQualityIssues,
    },
    {
      title: 'Goods Receipt Summary',
      icon: <ReceiptQuickIcon />,
      onPress: () => {
        if (onOpenGoodsReceiptSummary) onOpenGoodsReceiptSummary();
        else onOpenHistory('Accepted');
      },
    },
    {
      title: 'Transfer Receiving',
      icon: <TransferArrowsQuickIcon />,
      onPress: () => {
        if (onOpenTransferReceiving) onOpenTransferReceiving();
      },
    },
    {
      title: 'Receiving History',
      icon: <HistoryClockQuickIcon />,
      onPress: () => onOpenHistory('All'),
    },
  ];

  const currentWarehouseLabel = selectedWarehouseId
    ? warehouseNameOf(selectedWarehouseId)
    : 'All Warehouses';

  if (!canView) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={THEME_ACCENT} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Receiving Dashboard</Text>
        </View>
        <View style={styles.permissionWrapper}>
          <PermissionNote message="You do not have permission to view goods receiving." />
        </View>
        {onTabChange ? <WarehouseTabBar activeTab="Receiving" onTabChange={onTabChange} onBack={onBack} /> : null}
      </SafeAreaView>
    );
  }

  // ─── SubWarehouse View (matches reference image) ───────────────────────────
  if (!mainView) {
    const warehouseDisplayName = scope.warehouseName || 'Coonoor Warehouse';

    const inScopeShipments = shipments.filter((s) => inReceivingScope(scope, s.warehouseId));
    const inScopeRecords = records.filter((r) => inReceivingScope(scope, r.warehouseId));
    const inScopeIssues = issues.filter((i) => inReceivingScope(scope, i.warehouseId));

    const subExpectedToday = inScopeShipments.filter((s) => s.status === 'Expected').length;
    const subAwaitingReceiving = inScopeShipments.filter((s) => s.status === 'Arrived' || s.status === 'Receiving').length;
    const subAwaitingQc = inScopeShipments.filter((s) => s.status === 'Awaiting QC').length;
    const subPartiallyAccepted = inScopeRecords.filter((r) => r.result === 'Partially Accepted').length;
    const subCompletedToday = inScopeRecords.filter((r) => r.result === 'Accepted' || r.result === 'Partially Accepted').length;
    const subIssues = inScopeIssues.length;

    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={THEME_ACCENT} />

        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerTitleGroup}>
              <GoodsDeliveryTruckIcon size={24} color="#FFFFFF" />
              <Text style={styles.headerTitle}>Goods Receiving</Text>
            </View>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={onOpenNotifications}
              activeOpacity={0.8}
              accessibilityLabel="Notifications"
              accessibilityRole="button"
            >
              <NotificationBellHeaderIcon size={20} color="#FFFFFF" />
              {unreadNotifications > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Locked Warehouse Pill */}
          <View style={styles.lockedWarehousePill}>
            <LockSmallIcon size={12} color="#FFFFFF" />
            <Text style={styles.lockedWarehousePillText}>{warehouseDisplayName}</Text>
          </View>
        </View>

        {/* Main Content */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Today's Receiving Overview */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.subSectionTitle}>Today's Receiving Overview</Text>
            <TouchableOpacity onPress={() => onOpenShipments('All')} activeOpacity={0.7} accessibilityRole="button">
              <Text style={styles.viewLink}>View Details</Text>
            </TouchableOpacity>
          </View>

          {/* 6 KPI Cards Grid */}
          <View style={styles.subKpiGrid}>
            {/* Card 1: Expected Today */}
            <TouchableOpacity style={styles.subKpiCard} onPress={() => onOpenShipments('Expected')} activeOpacity={0.7} accessibilityRole="button">
              <CalendarOverviewIcon size={20} color="#8A4E15" />
              <Text style={styles.subKpiValue}>{String(subExpectedToday).padStart(2, '0')}</Text>
              <Text style={styles.subKpiLabel}>Expected Today</Text>
            </TouchableOpacity>

            {/* Card 2: Awaiting Receiving */}
            <TouchableOpacity style={styles.subKpiCard} onPress={() => onOpenShipments('Arrived')} activeOpacity={0.7} accessibilityRole="button">
              <DotsCircleOverviewIcon size={20} color="#8A4E15" />
              <Text style={styles.subKpiValue}>{String(subAwaitingReceiving).padStart(2, '0')}</Text>
              <Text style={styles.subKpiLabel}>Awaiting Receiving</Text>
            </TouchableOpacity>

            {/* Card 3: Awaiting QC (Value in RED) */}
            <TouchableOpacity style={styles.subKpiCard} onPress={() => onOpenShipments('QC Pending')} activeOpacity={0.7} accessibilityRole="button">
              <FlaskOverviewIcon size={20} color="#8A4E15" />
              <Text style={[styles.subKpiValue, { color: '#E24B4A' }]}>{String(subAwaitingQc).padStart(2, '0')}</Text>
              <Text style={styles.subKpiLabel}>Awaiting QC</Text>
            </TouchableOpacity>

            {/* Card 4: Partially Accepted */}
            <TouchableOpacity style={styles.subKpiCard} onPress={() => onOpenHistory('Partial')} activeOpacity={0.7} accessibilityRole="button">
              <BranchingArrowsOverviewIcon size={20} color="#8A4E15" />
              <Text style={styles.subKpiValue}>{String(subPartiallyAccepted).padStart(2, '0')}</Text>
              <Text style={styles.subKpiLabel}>Partially Accepted</Text>
            </TouchableOpacity>

            {/* Card 5: Completed Today */}
            <TouchableOpacity style={styles.subKpiCard} onPress={() => onOpenHistory('Accepted')} activeOpacity={0.7} accessibilityRole="button">
              <CheckCircleOverviewIcon size={20} color="#8A4E15" />
              <Text style={styles.subKpiValue}>{String(subCompletedToday).padStart(2, '0')}</Text>
              <Text style={styles.subKpiLabel}>Completed Today</Text>
            </TouchableOpacity>

            {/* Card 6: Issues (Value in RED) */}
            <TouchableOpacity style={styles.subKpiCard} onPress={onOpenQualityIssues} activeOpacity={0.7} accessibilityRole="button">
              <AlertCircleOverviewIcon size={20} color="#8A4E15" />
              <Text style={[styles.subKpiValue, { color: '#E24B4A' }]}>{String(subIssues).padStart(2, '0')}</Text>
              <Text style={styles.subKpiLabel}>Issues</Text>
            </TouchableOpacity>
          </View>

          {/* Shipment Arrived Button (kept as requested) */}
          {canRecord ? (
            <TouchableOpacity
              style={styles.shipmentArrivedButton}
              onPress={onStartReceiving}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <CrateInventoryWhiteIcon size={20} color="#FFFFFF" />
              <Text style={styles.shipmentArrivedButtonText}>Shipment Arrived</Text>
            </TouchableOpacity>
          ) : null}

          {/* 2. Needs Attention */}
          <View style={styles.sectionHeaderRowLeft}>
            <WarningTriangleSubIcon size={19} color="#D97706" />
            <Text style={[styles.subSectionTitle, { marginLeft: 8 }]}>Needs Attention</Text>
          </View>

          <View style={styles.attentionCardList}>
            {/* Card 1: QC Pending */}
            {canRecord ? (
              <TouchableOpacity
                style={styles.attentionCard}
                onPress={onStartReceiving}
                activeOpacity={0.7}
                accessibilityRole="button"
              >
                <View style={[styles.attentionIconCircle, { backgroundColor: '#FEF3C7' }]}>
                  <FlaskOverviewIcon size={20} color="#D97706" />
                </View>
                <View style={styles.attentionTextWrap}>
                  <Text style={styles.attentionTitle}>QC Pending</Text>
                  <Text style={styles.attentionSub}>Tomato — GR-1024</Text>
                </View>
                <ChevronRightIcon size={18} color="#9CA3AF" />
              </TouchableOpacity>
            ) : null}

            {/* Card 2: Quantity Mismatch */}
            <TouchableOpacity
              style={styles.attentionCard}
              onPress={() => {
                const issue = issues.find((i) => i.shipmentCode === 'GR-1021') ?? issues[1] ?? issues[0];
                if (issue) onSelectIssue(issue);
                else onOpenQualityIssues();
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <View style={[styles.attentionIconCircle, { backgroundColor: '#FEE2E2' }]}>
                <AlertCircleOverviewIcon size={20} color="#EF4444" />
              </View>
              <View style={styles.attentionTextWrap}>
                <Text style={styles.attentionTitle}>Quantity Mismatch</Text>
                <Text style={styles.attentionSub}>Carrot — GR-1021</Text>
              </View>
              <ChevronRightIcon size={18} color="#9CA3AF" />
            </TouchableOpacity>

            {/* Card 3: Damage Report */}
            <TouchableOpacity
              style={styles.attentionCard}
              onPress={() => {
                const issue = issues.find((i) => i.shipmentCode === 'GR-1020') ?? issues[2] ?? issues[0];
                if (issue) onSelectIssue(issue);
                else onOpenQualityIssues();
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <View style={[styles.attentionIconCircle, { backgroundColor: '#FEE2E2' }]}>
                <DamagePhotoIcon size={20} color="#EF4444" />
              </View>
              <View style={styles.attentionTextWrap}>
                <Text style={styles.attentionTitle}>Damage Report</Text>
                <Text style={styles.attentionSub}>Beans — GR-1020</Text>
              </View>
              <ChevronRightIcon size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* 3. Incoming Shipments */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.subSectionTitle}>Incoming Shipments</Text>
            <TouchableOpacity onPress={() => onOpenShipments('All')} activeOpacity={0.7} accessibilityRole="button">
              <Text style={styles.viewLink}>View all</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.incomingShipmentsList}>
            {/* Shipment 1: GR-1024 */}
            {canRecord ? (
              <TouchableOpacity
                style={styles.incomingShipmentCard}
                onPress={onStartReceiving}
                activeOpacity={0.7}
                accessibilityRole="button"
              >
                <View style={styles.shipmentCardHeader}>
                  <Text style={styles.shipmentCode}>GR-1024</Text>
                  <View style={[styles.statusBadge, { backgroundColor: '#FEF3C7' }]}>
                    <Text style={[styles.statusBadgeText, { color: '#B45309' }]}>Awaiting QC</Text>
                  </View>
                </View>
                <Text style={styles.shipmentProduct}>Tomato · Grade 1</Text>
                <Text style={styles.shipmentWeight}>150 KG</Text>
              </TouchableOpacity>
            ) : null}

            {/* Shipment 2: GR-1023 */}
            <TouchableOpacity
              style={styles.incomingShipmentCard}
              onPress={() => onSelectRecord('GR-1023')}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <View style={styles.shipmentCardHeader}>
                <Text style={styles.shipmentCode}>GR-1023</Text>
                <View style={[styles.statusBadge, { backgroundColor: '#DCFCE7' }]}>
                  <Text style={[styles.statusBadgeText, { color: '#16A34A' }]}>Completed</Text>
                </View>
              </View>
              <Text style={styles.shipmentProduct}>Carrot · Grade 1</Text>
              <Text style={styles.shipmentWeight}>80 KG</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 28 }} />
        </ScrollView>

        {/* Footer Navigation Bar */}
        {onTabChange ? (
          <WarehouseTabBar activeTab="Receiving" onTabChange={onTabChange} onBack={onBack} />
        ) : null}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={THEME_ACCENT} />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleGroup}>
            <InboxArrowDownIcon size={22} color="#FFFFFF" />
            <Text style={styles.headerTitle}>Receiving Dashboard</Text>
          </View>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => setRefreshKey((k) => k + 1)}
            activeOpacity={0.8}
            accessibilityLabel="Refresh"
            accessibilityRole="button"
          >
            <RefreshIcon size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Warehouse Selector Pill */}
        <TouchableOpacity
          style={styles.warehousePill}
          onPress={() => setWarehouseModalVisible(true)}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <WarehouseBuildingIcon size={15} color="#FFFFFF" />
          <Text style={styles.warehousePillText}>{currentWarehouseLabel}</Text>
          <ChevronDownSmallIcon size={13} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView
        key={refreshKey}
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 6 KPI Cards Grid */}
        <View style={styles.kpiGrid}>
          {kpis.map((kpi) => (
            <View
              key={kpi.label}
              style={styles.kpiCard}
            >
              <Text style={styles.kpiLabel}>{kpi.label}</Text>
              <Text style={styles.kpiValue}>{kpi.value}</Text>
              <Text style={styles.kpiSub}>{kpi.sub}</Text>
            </View>
          ))}
        </View>

        {/* Shipment Arrived Button (kept as requested) */}
        {canRecord ? (
          <TouchableOpacity
            style={styles.shipmentArrivedButton}
            onPress={onStartReceiving}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <CrateInventoryWhiteIcon size={20} color="#FFFFFF" />
            <Text style={styles.shipmentArrivedButtonText}>Shipment Arrived</Text>
          </TouchableOpacity>
        ) : null}

        {/* Receiving Activity Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Receiving Activity</Text>
          <TouchableOpacity onPress={() => onOpenHistory('All')} activeOpacity={0.7} accessibilityRole="button">
            <Text style={styles.viewLink}>View →</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.card}>
          <Text style={styles.pipelineText}>{PIPELINE_TEXT}</Text>
        </View>

        {/* Pending Receiving Queue Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Pending Receiving Queue</Text>
          <TouchableOpacity onPress={() => onOpenShipments('All')} activeOpacity={0.7} accessibilityRole="button">
            <Text style={styles.viewLink}>View →</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.cardList}>
          {queueRows.map((row, idx) => (
            <View
              key={row.label}
              style={[styles.queueRow, idx < queueRows.length - 1 && styles.queueRowBorder]}
            >
              <Text style={styles.queueLabel}>{row.label}</Text>
              <Text style={styles.queueValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions Section */}
        <View style={styles.sectionHeaderRowSingle}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>
        <View style={styles.quickGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.title}
              style={styles.quickCard}
              onPress={action.onPress}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              {action.icon}
              <Text style={styles.quickTitle}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* View Incoming Shipments Action Button */}
        <TouchableOpacity
          style={styles.incomingShipmentsButton}
          onPress={() => onOpenShipments('All')}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <GoodsDeliveryTruckIcon size={22} color="#FFFFFF" />
          <Text style={styles.incomingShipmentsButtonText}>View Incoming Shipments</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Warehouse Selection Modal */}
      <Modal
        visible={warehouseModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setWarehouseModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setWarehouseModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Warehouse</Text>
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    selectedWarehouseId === undefined && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedWarehouseId(undefined);
                    setWarehouseModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      selectedWarehouseId === undefined && styles.modalOptionTextSelected,
                    ]}
                  >
                    All Warehouses
                  </Text>
                </TouchableOpacity>
                {WALLET_WAREHOUSES.filter((w) => w.warehouseId !== undefined).map((w) => {
                  const isSelected = selectedWarehouseId === w.warehouseId;
                  return (
                    <TouchableOpacity
                      key={w.warehouseId}
                      style={[styles.modalOption, isSelected && styles.modalOptionSelected]}
                      onPress={() => {
                        setSelectedWarehouseId(w.warehouseId);
                        setWarehouseModalVisible(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.modalOptionText,
                          isSelected && styles.modalOptionTextSelected,
                        ]}
                      >
                        {w.warehouseName ?? w.warehouseId}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Footer Navigation Bar */}
      {onTabChange ? (
        <WarehouseTabBar activeTab="Receiving" onTabChange={onTabChange} onBack={onBack} />
      ) : null}
    </SafeAreaView>
  );
}

// ─── Styles matching the Reference Images precisely ─────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME_ACCENT,
  },
  header: {
    backgroundColor: THEME_ACCENT,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  refreshButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warehousePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.38)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
  },
  warehousePillText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Main Canvas
  scrollArea: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
  },

  // KPI Grid (2 columns x 3 rows)
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFEAE2',
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  kpiLabel: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    fontWeight: '700',
    color: TEXT_MUTED,
    letterSpacing: 0.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  kpiValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 2,
  },
  kpiSub: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    fontWeight: '500',
    color: TEXT_MUTED,
  },

  // Shipment Arrived Button
  shipmentArrivedButton: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: THEME_ACCENT,
    borderRadius: 14,
    marginTop: 2,
    marginBottom: 12,
  },
  shipmentArrivedButtonText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 10,
  },
  sectionHeaderRowSingle: {
    marginTop: 18,
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 17,
    fontWeight: '700',
    color: TITLE_BROWN,
  },
  viewLink: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: THEME_ACCENT,
  },

  // Receiving Activity Card (clean 3-line layout)
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFEAE2',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pipelineText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 19,
    color: TEXT_MUTED,
  },

  // Pending Receiving Queue Card
  cardList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFEAE2',
    paddingHorizontal: 16,
  },
  queueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10.5,
  },
  queueRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0ECE4',
  },
  queueLabel: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  queueValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_DARK,
  },

  // Quick Actions Grid (2x2)
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  quickCard: {
    width: '48.5%',
    height: 98,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFEAE2',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  quickTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_DARK,
    textAlign: 'center',
    lineHeight: 17,
  },

  // View Incoming Shipments Action Button
  incomingShipmentsButton: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: THEME_ACCENT,
    borderRadius: 14,
    marginTop: 18,
    marginBottom: 8,
  },
  incomingShipmentsButtonText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Permission Note Fallback
  permissionWrapper: {
    flex: 1,
    backgroundColor: '#FAF7F2',
    padding: 16,
    justifyContent: 'center',
  },

  // Warehouse Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 14,
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  modalOptionSelected: {
    backgroundColor: '#FDF2E9',
  },
  modalOptionText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  modalOptionTextSelected: {
    fontFamily: 'Poppins-Bold',
    fontWeight: '700',
    color: THEME_ACCENT,
  },

  // SubWarehouse Specific Styles
  notificationButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#E24B4A',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  lockedWarehousePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 10,
    gap: 6,
  },
  lockedWarehousePillText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subSectionTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    fontWeight: '800',
    color: '#18181B',
  },
  sectionHeaderRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 10,
  },
  subKpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 4,
    marginBottom: 12,
  },
  subKpiCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ECE7E1',
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 100,
    justifyContent: 'space-between',
  },
  subKpiValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    fontWeight: '800',
    color: '#18181B',
    marginTop: 8,
    marginBottom: 2,
  },
  subKpiLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  attentionCardList: {
    gap: 10,
    marginBottom: 14,
  },
  attentionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ECE7E1',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  attentionIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attentionTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  attentionTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#18181B',
  },
  attentionSub: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 2,
  },
  incomingShipmentsList: {
    gap: 10,
    marginBottom: 12,
  },
  incomingShipmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ECE7E1',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  shipmentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  shipmentCode: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    fontWeight: '800',
    color: '#8A4E15',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    fontWeight: '700',
  },
  shipmentProduct: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#18181B',
    marginBottom: 2,
  },
  shipmentWeight: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
});
