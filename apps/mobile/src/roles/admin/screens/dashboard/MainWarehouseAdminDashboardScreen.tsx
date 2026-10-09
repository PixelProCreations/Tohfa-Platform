import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { fetchMe, logout, type UserMe } from '../../../farmer/api/auth';
import { AdminProfileScreen } from './AdminProfileScreen';
import { MainWarehouseMoreScreen } from './MainWarehouseMoreScreen';
import { makeCan } from '../../permissions/can';
import type { WarehouseScope } from '../warehouse/finance-expenses';
import { MainWarehouseCustomerOrdersScreen } from './MainWarehouseCustomerOrdersScreen';
import {
  WarehouseOverviewScreen,
  StockLedgerScreen,
  VerifyStockScreen,
  StockAdjustmentApprovalScreen,
  LowStockAlertsScreen,
  WarehouseSettingsScreen,
  WarehousePerformanceScreen,
  ManageWarehousesScreen,
  InterWarehouseTransferScreen,
  InitiateNewTransferScreen,
  NewDirectSaleScreen,
  SelectProductsScreen,
  SaleSummaryScreen,
  SelectCustomerScreen,
  PaymentScreen,
  SaleConfirmationScreen,
  SaleDetailsScreen,
  MarketDaySalesScreen,
  HorecaSalesScreen,
  B2bSalesScreen,
  SalesHistoryScreen,
  type ProductItem,
  type DirectSaleCustomerItem,
  type PaymentMethodType,
  type SaleRecordItem,
  TransferDetailScreen,
  TodaysOperationsOverviewScreen,
  TodaysOperationsMonitoringScreen,
  StockAndTransferOverviewScreen,
  AlertsAndActionCenterScreen,
  QuickActionsOverviewScreen,
  ReceivingDashboardScreen,
  IncomingShipmentsScreen,
  ReceivingSearchFiltersScreen,
  WarehouseCityDetailScreen,
  IncomingGoodsOperationsScreen,
  OrderFulfilmentOperationsScreen,
  QualityIssuesOperationsScreen,
  ActivityTimelineOperationsScreen,
  ShipmentDetailScreen,
  StartReceivingScreen,
  QuantityVerificationScreen,
  QualityCheckScreen,
  GradeProductVerificationScreen,
  DamageMismatchReportScreen,
  AcceptanceDecisionScreen,
  PartialAcceptanceScreen,
  GoodsReceiptSummaryScreen,
  BatchAssignmentScreen,
  StorageLocationAssignmentScreen,
  ReceivingHistoryScreen,
  ReceivingHistoryDetailScreen,
  TransferReceivingScreen,
  TransferReceivingInspectionScreen,
  WarehouseOperationsHubScreen,
  StorageLocationsScreen,
  LocationDetailScreen,
  MaterialHandlingScreen,
  MaterialDetailScreen,
  WarehouseCapacityScreen,
  WarehouseActivityScreen,
  OperationalIssuesScreen,
  StaffAndAttendanceScreen,
  OperationsHistoryScreen,
  ReportOperationalIssueScreen,
  WarehouseNotificationsScreen,
  type WarehouseNotification,
  type StockBatchItem,
  type VerifyStockAdjustmentData,
  type InterWarehouseTransferItem,
  INITIAL_TRANSFERS,
} from '../warehouse';
import {
  CustomerListScreen,
  CustomerSearchScreen,
  CustomerDetailScreen,
  PurchaseHistoryScreen,
  WalletSummaryScreen,
  CustomerIssuesScreen,
  SupportHistoryScreen,
} from '../customers';
import {
  BillingInvoicesHubScreen,
  InvoiceListScreen,
  InvoiceDetailScreen,
  GenerateInvoiceScreen,
  GSTInvoiceScreen,
  DownloadInvoiceScreen,
  InvoiceHistoryScreen,
} from '../billing';

export type ReceivingSubView =
  | 'dashboard'
  | 'incoming_shipments'
  | 'search_filters'
  | 'shipment_detail'
  | 'start_receiving'
  | 'quantity_verification'
  | 'quality_check'
  | 'grade_product_verification'
  | 'damage_mismatch_report'
  | 'acceptance_decision'
  | 'partial_acceptance'
  | 'goods_receipt_summary'
  | 'batch_assignment'
  | 'storage_location_assignment'
  | 'receiving_history'
  | 'receiving_history_detail'
  | 'transfer_receiving'
  | 'transfer_receiving_inspection';

// ─── Design Tokens (Exact match to TOHFA Admin App Design System v1.0 PDF) ───
const PALETTE = {
  // Brand Palette (Page 1)
  primary: '#F0562A', // Orange - Primary actions, active states, icons
  headerBg: '#F0562A', // Brand Terracotta Orange
  headerBgDark: '#D9481E',
  headerPillBg: 'rgba(255, 255, 255, 0.22)',
  headerText: '#FFFFFF',

  orangeDeep: '#7A2E14', // Orange Deep - Section headings, emphasis text
  primarySoft: '#FDF3F0', // Orange Tint - Icon chips, role badges, active pills
  pageBg: '#F3EFE9', // Background - App canvas soft cream

  // Neutrals (Page 1)
  textInk: '#1A1A1A', // Ink - Primary text
  textSecondary: '#5F5E5A', // Muted - Secondary text
  textMuted: '#5F5E5A', // Muted text
  border: '#EEDCD3', // Border - Card and input borders
  borderLight: '#F8F3ED',
  cardBg: '#FFFFFF', // Card - Card surfaces
  primaryBorder: '#EEDCD3',

  // Semantic Colors (Page 2)
  amber: '#854F0B', // Warning (#854F0B)
  amberBg: '#FEF3E2', // Warning BG (#FEF3E2)
  green: '#173404', // Success (#173404)
  greenBg: '#EAF3DE', // Success BG (#EAF3DE)
  greenText: '#1E8E5A',

  red: '#E24B4A', // Danger (#E24B4A)
  redBg: '#FCEBEB', // Danger BG (#FCEBEB)
  redBorder: '#FCA5A5',

  tabInactive: '#5F5E5A',
  tabActive: '#F0562A',
  tabBorder: '#EEDCD3',
};

export type MainWHTab = 'Home' | 'Receiving' | 'Inventory' | 'More';

type WarehouseSubView =
  | 'overview'
  | 'warehouse_operations'
  | 'warehouse_overview'
  | 'warehouse_city_detail'
  | 'dashboard_operations'
  | 'todays_operations'
  | 'todays_operations_overview'
  | 'warehouse_performance'
  | 'manage_warehouses'
  | 'storage_locations'
  | 'location_detail'
  | 'material_handling'
  | 'material_detail'
  | 'warehouse_capacity'
  | 'warehouse_activity'
  | 'operational_issues'
  | 'report_operational_issue'
  | 'staff_attendance'
  | 'operations_history'
  | 'incoming_goods_ops'
  | 'order_fulfilment_ops'
  | 'quality_issues_ops'
  | 'activity_timeline_ops'
  | 'stock_and_transfer'
  | 'alerts_action_center'
  | 'quick_actions_overview'
  | 'stock_ledger'
  | 'verify_stock'
  | 'stock_adjustment_approval'
  | 'low_stock_alerts'
  | 'inter_warehouse_transfer'
  | 'initiate_new_transfer'
  | 'transfer_detail'
  | 'warehouse_settings'
  | 'sales'
  | 'direct_sale_new'
  | 'direct_sale_select_products'
  | 'direct_sale_summary'
  | 'direct_sale_select_customer'
  | 'direct_sale_payment'
  | 'direct_sale_confirmation'
  | 'sale_details'
  | 'sales_market_day'
  | 'sales_horeca'
  | 'sales_b2b'
  | 'sales_history'
  | 'customer_orders'
  | 'warehouse_notifications'
  | 'profile'
  // Module 7: Customers
  | 'customers_list'
  | 'customer_search'
  | 'customer_detail'
  | 'customer_orders'
  | 'purchase_history'
  | 'wallet_summary'
  | 'customer_issues'
  | 'support_history'
  // Module 9: Billing & Invoices
  | 'billing_invoices'
  | 'invoice_list'
  | 'invoice_detail'
  | 'generate_invoice'
  | 'gst_invoice'
  | 'download_invoice'
  | 'invoice_history';

// ─── SVG Icons (Matching D01 Screenshots) ───────────────────────────────────

function Grid4SquaresIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  // Lucide LayoutDashboard (exact match to design top-left greeting icon)
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="9" rx="1.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="14" y="3" width="7" height="5" rx="1.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="14" y="12" width="7" height="9" rx="1.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="3" y="16" width="7" height="5" rx="1.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BellOutlineIcon({ size = 20, color = '#1E1612' }: { size?: number; color?: string }) {
  // Lucide Bell (exact match to notification bell)
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10.3 21a1.94 1.94 0 0 0 3.4 0"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BuildingWarehouseIcon({ size = 16, color = '#FFFFFF' }: { size?: number; color?: string }) {
  // Lucide Building2 (exact match to warehouse filter building icon)
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 6h4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 10h4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 14h4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 18h4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronDownWhiteIcon({ size = 14, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="m6 9 6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightGrayIcon({ size = 16, color = '#9E9690' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InfoCircleIcon({ size = 16, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 8h.01M12 12v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function WarningTriangleIcon({ size = 20, color = '#EF4444' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="12" cy="17" r="1" fill={color} />
    </Svg>
  );
}

function TruckIcon({ size = 20, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="1" y="3" width="15" height="13" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M16 8h4l3 3v5h-7V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="5.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
      <Circle cx="18.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function InboxReceiveIcon({ size = 20, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 13h4l2 3h4l2-3h4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 7v5M9 9.5l3 3 3-3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TransferArrowsIcon({ size = 26, color = PALETTE.primary }: { size?: number; color?: string }) {
  // Heroicons arrows-right-left (exact match to design)
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7.5 7.5h13.5m0 0L16.5 3m4.5 4.5L16.5 12M16.5 16.5H3m0 0L7.5 12m-4.5 4.5L7.5 21"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ReviewReceivingIcon({ size = 26, color = PALETTE.primary }: { size?: number; color?: string }) {
  // Checklist card with 3 bars & checkmark (exact match to design)
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="2.5" stroke={color} strokeWidth="2" />
      <Path d="M7 8h4M7 12h4M7 16h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M14 12.5l2 2 3.5-4" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BuildingOfficeIcon({ size = 26, color = PALETTE.primary }: { size?: number; color?: string }) {
  // Heroicons building-office-2 stepped building with 11 windows and door (exact match to design)
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2.5 21h19M4.5 21V9a1 1 0 0 1 1-1h2.5V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v9h3a1 1 0 0 1 1 1v7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M10.5 21v-4h3v4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {/* Windows Left Wing */}
      <Path d="M6.5 11h1M6.5 14h1M6.5 17h1" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Windows Center Tower */}
      <Path d="M10.5 6.5h1M13 6.5h1M10.5 9.5h1M13 9.5h1M10.5 12.5h1M13 12.5h1" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Windows Right Wing */}
      <Path d="M16.5 15.5h1M16.5 18h1" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ManageSwasBadgeIcon({ size = 26, color = PALETTE.primary }: { size?: number; color?: string }) {
  // Heroicons identification badge with top clip, avatar & text lines (exact match to design)
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Clip at top */}
      <Rect x="10.5" y="1.5" width="3" height="4.5" rx="1" stroke={color} strokeWidth="1.8" />
      <Line x1="12" y1="1.5" x2="12" y2="4" stroke={color} strokeWidth="1.8" />
      {/* Badge outer border */}
      <Rect x="3" y="6" width="18" height="15" rx="2.5" stroke={color} strokeWidth="2" />
      {/* Avatar on left */}
      <Circle cx="8" cy="11.5" r="2" stroke={color} strokeWidth="1.8" />
      <Path d="M5.5 17c0-1.6 1.1-2.5 2.5-2.5s2.5.9 2.5 2.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      {/* Lines on right */}
      <Line x1="13.5" y1="11" x2="18.5" y2="11" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="13.5" y1="15" x2="17" y2="15" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ProhibitedSlashIcon({ size = 18, color = '#7A726C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Line x1="5.6" y1="5.6" x2="18.4" y2="18.4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function StockVerificationIcon({ size = 26, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="3" width="16" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8 7h8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M8 17h5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function HorizontalTransferIcon({ size = 26, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 7h12m0 0l-3.5-3.5M20 7l-3.5 3.5M16 17H4m0 0l3.5 3.5M4 17l3.5-3.5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ShoppingCartIcon({ size = 24, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="21" r="1" stroke={color} strokeWidth="2" />
      <Circle cx="20" cy="21" r="1" stroke={color} strokeWidth="2" />
      <Path
        d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SalesHistoryClockIcon({ size = 24, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 7v5l3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ArrowLeftWhiteIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DocCheckIcon({ size = 26, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="3" width="16" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M9 8h6M9 12h6M9 16h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Bottom Navigation Tab Icons ─────────────────────────────────────────────

function HomeTabNavIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.tabActive : PALETTE.tabInactive;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 10.5L12 3l9 7.5V20a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 20v-9.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 21v-7h6v7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReceivingTabNavIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.tabActive : PALETTE.tabInactive;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 13h4l2 3h4l2-3h4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 7v5M9 9.5l3 3 3-3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InventoryTabNavIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.tabActive : PALETTE.tabInactive;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="5" rx="1.5" stroke={color} strokeWidth="2" />
      <Path d="M5 9v10a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5V9" stroke={color} strokeWidth="2" />
      <Path d="M10 13h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function MoreTabNavIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.tabActive : PALETTE.tabInactive;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
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

/** The Main Warehouse admin sees every warehouse: no warehouseId (see finance-expenses/types.ts). */
const MAIN_WAREHOUSE_SCOPE: WarehouseScope = {};

export interface MainWarehouseAdminDashboardScreenProps {
  onSignOut: () => void;
  onNavigate?: (screen: string) => void;
}

export function MainWarehouseAdminDashboardScreen({
  onSignOut,
  onNavigate,
}: MainWarehouseAdminDashboardScreenProps) {
  const [activeTab, setActiveTab] = useState<MainWHTab>('Home');
  const [receivingSubView, setReceivingSubView] = useState<ReceivingSubView>('dashboard');
  const [selectedShipmentId, setSelectedShipmentId] = useState('SHP-000124');
  const [selectedGrnId, setSelectedGrnId] = useState('GRN-000842');
  const [whSubView, setWhSubView] = useState<WarehouseSubView>('overview');
  const [whHistory, setWhHistory] = useState<WarehouseSubView[]>([]);
  const [selectedWHFilter, setSelectedWHFilter] = useState('All Warehouses');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedWHName, setSelectedWHName] = useState('Ooty Warehouse');
  const [selectedBatch, setSelectedBatch] = useState<StockBatchItem | null>(null);
  const [adjustmentRecord, setAdjustmentRecord] = useState<VerifyStockAdjustmentData | null>(null);
  const [transferList, setTransferList] = useState<InterWarehouseTransferItem[]>(INITIAL_TRANSFERS);
  const [cartProducts, setCartProducts] = useState<ProductItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<DirectSaleCustomerItem | null>({
    id: 'c1',
    name: 'Arun Kumar',
    customerId: 'CUS-00251',
    phone: '+91 98765 43210',
  });
  const [confirmedPaymentMethod, setConfirmedPaymentMethod] = useState<PaymentMethodType>('Cash');
  const [selectedTransfer, setSelectedTransfer] = useState<InterWarehouseTransferItem>(INITIAL_TRANSFERS[0]!);
  const [selectedLocationId, setSelectedLocationId] = useState('LOC-COO-A02-S03');
  const [selectedMaterialId, setSelectedMaterialId] = useState('MAT-0021');
  const [user, setUser] = useState<UserMe | null>(null);
  // Permissions come from GET /v1/auth/me (fetchMe below). Until it resolves,
  // or if it fails, makeCan fails closed and gated controls stay hidden.
  const can = useMemo(() => makeCan(user?.permissions), [user]);
  const [whNotifications, setWhNotifications] = useState<WarehouseNotification[]>([
    { id: '1', type: 'shipment', title: 'New Shipment Arrived', message: 'Truck KA-04-1234 arrived at Bay 2 with 500 crates', timestamp: '10m ago', isRead: false, shipmentCode: 'SHP-2026-098' },
    { id: '2', type: 'quality', title: 'Quality Alert', message: 'Batch B-104 tomato inspection flagged 8% damage', timestamp: '45m ago', isRead: false },
    { id: '3', type: 'inventory', title: 'Low Stock Threshold', message: 'Rack B-04 Carrot stock below safety reorder level', timestamp: '2h ago', isRead: true },
  ]);

  const WAREHOUSE_OPTIONS = ['All Warehouses', 'Ooty', 'Coonoor', 'Kotagiri', 'Gudalur'];

  const navigateWh = (view: WarehouseSubView) => {
    setWhHistory((prev) => [...prev, whSubView]);
    setWhSubView(view);
  };

  const goBackWh = () => {
    if (whHistory.length > 0) {
      setWhHistory((prev) => {
        const next = [...prev];
        const last = next.pop();
        if (last) setWhSubView(last);
        return next;
      });
    } else {
      setActiveTab('Home');
      setWhSubView('overview');
    }
  };

  useEffect(() => {
    fetchMe()
      .then((me) => setUser(me))
      .catch(() => { });
  }, []);

  const displayName = 'Suresh';

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      <View style={{ flex: 1 }}>
        {/* ─── Main Dashboard View (Module 1 - Main Dashboard) ─── */}
        {activeTab === 'Home' && whSubView === 'overview' && (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollPad}
            showsVerticalScrollIndicator={false}
          >
            {/* Top Orange Header Section */}
            <View style={styles.headerBanner}>
              {/* Top Greeting Row */}
              <View style={styles.headerTopRow}>
                <View style={styles.headerTitleWrap}>
                  <Grid4SquaresIcon size={20} color="#FFFFFF" />
                  <Text style={styles.headerGreetingText}>Good morning, {displayName}</Text>
                </View>

                {/* Notification Bell Button */}
                <TouchableOpacity
                  style={styles.notificationBellBtn}
                  onPress={() => {
                    navigateWh('warehouse_notifications');
                  }}
                  activeOpacity={0.8}
                >
                  <BellOutlineIcon size={20} color="#1E1612" />
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>6</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Subtitle */}
              <Text style={styles.headerSubtitle}>Main Warehouse Admin · Today</Text>

              {/* Warehouse Dropdown Filter Pill */}
              <TouchableOpacity
                style={styles.whFilterPill}
                onPress={() => setShowFilterModal(true)}
                activeOpacity={0.8}
              >
                <BuildingWarehouseIcon size={16} color="#FFFFFF" />
                <Text style={styles.whFilterPillText}>{selectedWHFilter}</Text>
                <ChevronDownWhiteIcon size={13} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Content Container */}
            <View style={styles.contentBody}>
              {/* ─── 1. Today's Overview (KPI Grid) ─── */}
              <Text style={styles.sectionHeading}>Today's Overview</Text>
              <View style={styles.kpiGrid}>
                {/* Total Stock */}
                <TouchableOpacity
                  style={styles.kpiCard}
                  onPress={() => {
                    navigateWh('stock_and_transfer');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.kpiLabel}>TOTAL STOCK</Text>
                  <Text style={styles.kpiValue}>12,840</Text>
                  <Text style={styles.kpiSub}>KG</Text>
                  <Text style={styles.kpiLink}>View details →</Text>
                </TouchableOpacity>

                {/* Incoming Goods */}
                <TouchableOpacity
                  style={styles.kpiCard}
                  onPress={() => {
                    setActiveTab('Receiving');
                    setReceivingSubView('dashboard');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.kpiLabel}>INCOMING GOODS</Text>
                  <Text style={styles.kpiValue}>1,240</Text>
                  <Text style={styles.kpiSub}>KG today</Text>
                  <Text style={styles.kpiLink}>View details →</Text>
                </TouchableOpacity>

                {/* Pending Transfers */}
                <TouchableOpacity
                  style={styles.kpiCard}
                  onPress={() => navigateWh('inter_warehouse_transfer')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.kpiLabel}>PENDING TRANSFERS</Text>
                  <Text style={styles.kpiValue}>5</Text>
                  <Text style={styles.kpiSub}>transfers</Text>
                  <Text style={styles.kpiLink}>View details →</Text>
                </TouchableOpacity>

                {/* Today's Orders */}
                <TouchableOpacity
                  style={styles.kpiCard}
                  onPress={() => navigateWh('customer_orders')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.kpiLabel}>TODAY'S ORDERS</Text>
                  <Text style={styles.kpiValue}>312</Text>
                  <Text style={styles.kpiSub}>orders</Text>
                  <Text style={styles.kpiLink}>View details →</Text>
                </TouchableOpacity>

                {/* Sales */}
                <TouchableOpacity
                  style={styles.kpiCard}
                  onPress={() => navigateWh('billing_invoices')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.kpiLabel}>SALES</Text>
                  <Text style={styles.kpiValue}>₹1,45,100</Text>
                  <Text style={styles.kpiSub}>today</Text>
                  <Text style={styles.kpiLink}>View details →</Text>
                </TouchableOpacity>

                {/* Open Issues */}
                <TouchableOpacity
                  style={styles.kpiCard}
                  onPress={() => navigateWh('operational_issues')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.kpiLabel}>OPEN ISSUES</Text>
                  <Text style={styles.kpiValue}>7</Text>
                  <Text style={styles.kpiSub}>issues</Text>
                  <Text style={styles.kpiLink}>View details →</Text>
                </TouchableOpacity>
              </View>

              {/* KPI Info Notice Banner */}
              <View style={styles.kpiInfoBanner}>
                <InfoCircleIcon size={16} color={PALETTE.primary} />
                <Text style={styles.kpiInfoText}>
                  Every KPI shows its own unit — KG, order counts, and currency are never added together into one blended figure.
                </Text>
              </View>

              {/* ─── 2. Warehouse Overview ─── */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>Warehouse Overview</Text>
                <TouchableOpacity
                  onPress={() => {
                    navigateWh('warehouse_overview');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewAllLink}>View All →</Text>
                </TouchableOpacity>
              </View>

              {/* Ooty Progress Card */}
              <TouchableOpacity
                style={styles.whProgressCard}
                onPress={() => {
                  setSelectedWHName('Ooty Warehouse');
                  navigateWh('warehouse_city_detail');
                }}
                activeOpacity={0.8}
              >
                <View style={styles.whProgressTopRow}>
                  <Text style={styles.whProgressTitle}>Ooty</Text>
                  <ChevronRightGrayIcon size={16} />
                </View>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: '75%', backgroundColor: PALETTE.primary }]} />
                </View>
              </TouchableOpacity>

              {/* Coonoor Progress Card */}
              <TouchableOpacity
                style={styles.whProgressCard}
                onPress={() => {
                  setSelectedWHName('Coonoor Warehouse');
                  navigateWh('warehouse_city_detail');
                }}
                activeOpacity={0.8}
              >
                <View style={styles.whProgressTopRow}>
                  <Text style={styles.whProgressTitle}>Coonoor</Text>
                  <ChevronRightGrayIcon size={16} />
                </View>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: '58%', backgroundColor: '#0D684D' }]} />
                </View>
              </TouchableOpacity>

              {/* ─── 3. Today's Operations ─── */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>Today's Operations</Text>
                <TouchableOpacity
                  onPress={() => navigateWh('dashboard_operations')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewAllLink}>View All →</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.operationsCard}
                onPress={() => navigateWh('dashboard_operations')}
                activeOpacity={0.8}
              >
                <Text style={styles.operationsText}>Receiving · Orders · Quality · Dispatch</Text>
              </TouchableOpacity>

              {/* ─── 3B. Warehouse Operations Hub (Direct Entry Point) ─── */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>Warehouse Operations Hub</Text>
                <TouchableOpacity
                  onPress={() => navigateWh('warehouse_operations')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewAllLink}>Open Hub →</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.whHubPromoCard}
                onPress={() => navigateWh('warehouse_operations')}
                activeOpacity={0.85}
              >
                <View style={styles.whHubPromoHeader}>
                  <View style={styles.whHubPromoIconCircle}>
                    <BuildingWarehouseIcon size={22} color="#FFFFFF" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.whHubPromoTitle}>Warehouse Operations Hub</Text>
                    <Text style={styles.whHubPromoSub}>
                      Locations · Material Handling · Capacity · Attendance · Issues
                    </Text>
                  </View>
                  <ChevronRightGrayIcon size={18} color={PALETTE.primary} />
                </View>
                <View style={styles.whHubPillsRow}>
                  <View style={styles.whHubMiniPill}>
                    <Text style={styles.whHubMiniPillText}>4 Warehouses</Text>
                  </View>
                  <View style={styles.whHubMiniPill}>
                    <Text style={styles.whHubMiniPillText}>64% Capacity</Text>
                  </View>
                  <View style={styles.whHubMiniPill}>
                    <Text style={styles.whHubMiniPillText}>42 Materials</Text>
                  </View>
                  <View style={[styles.whHubMiniPill, { backgroundColor: '#FCEBEB' }]}>
                    <Text style={[styles.whHubMiniPillText, { color: '#E24B4A' }]}>9 Issues</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* ─── 4. Alerts & Pending Actions ─── */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>Alerts & Pending Actions</Text>
                <TouchableOpacity
                  onPress={() => navigateWh('alerts_action_center')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewAllLink}>View All →</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.alertCard}
                onPress={() => navigateWh('alerts_action_center')}
                activeOpacity={0.8}
              >
                <View style={styles.alertAccentBar} />
                <View style={styles.alertContentRow}>
                  <WarningTriangleIcon size={24} color={PALETTE.primary} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.alertTitle}>Coonoor stock below target</Text>
                    <Text style={styles.alertSub}>Warehouse exceptions, escalations and transfer issues</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* ─── 5. Recent Activity ─── */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>Recent Activity</Text>
                <TouchableOpacity
                  onPress={() => navigateWh('warehouse_activity')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewAllLink}>View All →</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.recentActivityCard}>
                {/* Activity 1 */}
                <TouchableOpacity
                  style={styles.activityItemRow}
                  onPress={() => navigateWh('inter_warehouse_transfer')}
                  activeOpacity={0.7}
                >
                  <View style={styles.activityIconBox}>
                    <TruckIcon size={18} color={PALETTE.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.activityTitle}>Transfer TRF-00284 in transit</Text>
                    <Text style={styles.activitySub}>Coonoor → Ooty</Text>
                  </View>
                  <Text style={styles.activityTime}>10:20 AM</Text>
                </TouchableOpacity>

                <View style={styles.activityDivider} />

                {/* Activity 2 */}
                <TouchableOpacity
                  style={styles.activityItemRow}
                  onPress={() => {
                    setSelectedWHName('Kotagiri Warehouse');
                    navigateWh('warehouse_city_detail');
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.activityIconBox}>
                    <InboxReceiveIcon size={18} color={PALETTE.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.activityTitle}>Goods received</Text>
                    <Text style={styles.activitySub}>Kotagiri warehouse</Text>
                  </View>
                  <Text style={styles.activityTime}>09:45 AM</Text>
                </TouchableOpacity>
              </View>

              {/* ─── 6. Quick Actions ─── */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>Quick Actions</Text>
                <TouchableOpacity
                  onPress={() => navigateWh('quick_actions_overview')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewAllLink}>View All →</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.quickActionsGrid}>
                {/* 1. Transfer Stock */}
                <TouchableOpacity
                  style={styles.quickActionCard}
                  onPress={() => navigateWh('inter_warehouse_transfer')}
                  activeOpacity={0.8}
                >
                  <TransferArrowsIcon size={26} color={PALETTE.primary} />
                  <Text style={styles.quickActionLabel}>Transfer Stock</Text>
                </TouchableOpacity>

                {/* 2. Review Receiving */}
                <TouchableOpacity
                  style={styles.quickActionCard}
                  onPress={() => {
                    setActiveTab('Receiving');
                    setReceivingSubView('dashboard');
                  }}
                  activeOpacity={0.8}
                >
                  <ReviewReceivingIcon size={26} color={PALETTE.primary} />
                  <Text style={styles.quickActionLabel}>Review Receiving</Text>
                </TouchableOpacity>

                {/* 3. View Warehouses */}
                <TouchableOpacity
                  style={styles.quickActionCard}
                  onPress={() => {
                    navigateWh('warehouse_overview');
                  }}
                  activeOpacity={0.8}
                >
                  <BuildingOfficeIcon size={26} color={PALETTE.primary} />
                  <Text style={styles.quickActionLabel}>View Warehouses</Text>
                </TouchableOpacity>

                {/* 4. Manage SWAs */}
                <TouchableOpacity
                  style={styles.quickActionCard}
                  onPress={() => {
                    navigateWh('staff_attendance');
                  }}
                  activeOpacity={0.8}
                >
                  <ManageSwasBadgeIcon size={26} color={PALETTE.primary} />
                  <Text style={styles.quickActionLabel}>Manage SWAs</Text>
                </TouchableOpacity>
              </View>

              {/* Disclaimer Notice */}
              <View style={styles.disclaimerBox}>
                <ProhibitedSlashIcon size={16} color={PALETTE.textSecondary} />
                <Text style={styles.disclaimerText}>
                  Conceptual layout with mock data only — no live operational figures are implied, and no control here does anything but navigate.
                </Text>
              </View>

              <View style={{ height: 16 }} />
            </View>
          </ScrollView>
        )}


        {/* ─── Receiving Tab ─── */}
        {activeTab === 'Receiving' && (
          receivingSubView === 'dashboard' ? (
            <ReceivingDashboardScreen
              warehouseName={selectedWHFilter}
              onBack={() => {
                setActiveTab('Home');
                setWhSubView('overview');
              }}
              onOpenWarehouseSelector={() => setShowFilterModal(true)}
              onRefresh={() => { }}
              onViewIncomingShipments={() => setReceivingSubView('incoming_shipments')}
              onViewTransferReceiving={() => setReceivingSubView('transfer_receiving')}
              onViewDetails={() => setReceivingSubView('incoming_shipments')}
              onViewActivity={() => setReceivingSubView('receiving_history')}
              onViewPendingQueue={() => setReceivingSubView('incoming_shipments')}
            />
          ) : receivingSubView === 'incoming_shipments' ? (
            <IncomingShipmentsScreen
              onBack={() => setReceivingSubView('dashboard')}
              onOpenFilters={() => setReceivingSubView('search_filters')}
              onSelectShipment={(id) => {
                setSelectedShipmentId(id);
                setReceivingSubView('shipment_detail');
              }}
            />
          ) : receivingSubView === 'search_filters' ? (
            <ReceivingSearchFiltersScreen
              onBack={() => setReceivingSubView('incoming_shipments')}
              onApplyFilters={(filters) => {
                if (filters.warehouse && filters.warehouse !== 'All') {
                  setSelectedWHFilter(filters.warehouse);
                }
                setReceivingSubView('incoming_shipments');
              }}
            />
          ) : receivingSubView === 'shipment_detail' ? (
            <ShipmentDetailScreen
              shipmentId={selectedShipmentId}
              onBack={() => setReceivingSubView('incoming_shipments')}
              onStartReceiving={() => setReceivingSubView('start_receiving')}
              onViewProductDetail={() => setReceivingSubView('quantity_verification')}
              onViewTimeline={() => setReceivingSubView('goods_receipt_summary')}
            />
          ) : receivingSubView === 'start_receiving' ? (
            <StartReceivingScreen
              shipmentId={selectedShipmentId}
              onBack={() => setReceivingSubView('shipment_detail')}
              onConfirmStartReceiving={() => setReceivingSubView('quantity_verification')}
            />
          ) : receivingSubView === 'quantity_verification' ? (
            <QuantityVerificationScreen
              shipmentId={selectedShipmentId}
              onBack={() => setReceivingSubView('start_receiving')}
              onContinueToQualityCheck={() => setReceivingSubView('quality_check')}
            />
          ) : receivingSubView === 'quality_check' ? (
            <QualityCheckScreen
              shipmentId={selectedShipmentId}
              onBack={() => setReceivingSubView('quantity_verification')}
              onViewQualitySummary={() => setReceivingSubView('damage_mismatch_report')}
              onContinueToGradeVerification={() => setReceivingSubView('grade_product_verification')}
            />
          ) : receivingSubView === 'grade_product_verification' ? (
            <GradeProductVerificationScreen
              shipmentId={selectedShipmentId}
              onBack={() => setReceivingSubView('quality_check')}
              onContinueToMismatchReport={() => setReceivingSubView('damage_mismatch_report')}
              onNavigateProductMismatch={() => setReceivingSubView('damage_mismatch_report')}
              onNavigateGradeMismatch={() => setReceivingSubView('damage_mismatch_report')}
              onNavigateProductSummary={() => setReceivingSubView('damage_mismatch_report')}
              onNavigateGradeSummary={() => setReceivingSubView('damage_mismatch_report')}
            />
          ) : receivingSubView === 'damage_mismatch_report' ? (
            <DamageMismatchReportScreen
              shipmentId={selectedShipmentId}
              onBack={() => setReceivingSubView('grade_product_verification')}
              onViewMismatchSummary={() => setReceivingSubView('acceptance_decision')}
              onContinueToAcceptanceDecision={() => setReceivingSubView('acceptance_decision')}
            />
          ) : receivingSubView === 'acceptance_decision' ? (
            <AcceptanceDecisionScreen
              shipmentId={selectedShipmentId}
              onBack={() => setReceivingSubView('damage_mismatch_report')}
              onSelectOutcome={(outcome) => {
                if (outcome === 'Partial Accept') {
                  setReceivingSubView('partial_acceptance');
                } else {
                  setReceivingSubView('goods_receipt_summary');
                }
              }}
            />
          ) : receivingSubView === 'partial_acceptance' ? (
            <PartialAcceptanceScreen
              shipmentId={selectedShipmentId}
              onBack={() => setReceivingSubView('acceptance_decision')}
              onContinueToSummary={() => setReceivingSubView('goods_receipt_summary')}
            />
          ) : receivingSubView === 'goods_receipt_summary' ? (
            <GoodsReceiptSummaryScreen
              shipmentId={selectedShipmentId}
              onBack={() => setReceivingSubView('acceptance_decision')}
              onAssignBatch={() => setReceivingSubView('batch_assignment')}
              onViewPreview={() => setReceivingSubView('batch_assignment')}
              onViewDetail={() => setReceivingSubView('storage_location_assignment')}
              onViewActivity={() => setReceivingSubView('receiving_history')}
            />
          ) : receivingSubView === 'batch_assignment' ? (
            <BatchAssignmentScreen
              onBack={() => setReceivingSubView('goods_receipt_summary')}
              onReviewBatch={() => setReceivingSubView('storage_location_assignment')}
            />
          ) : receivingSubView === 'storage_location_assignment' ? (
            <StorageLocationAssignmentScreen
              onBack={() => setReceivingSubView('batch_assignment')}
              onSelectStorageLocation={() => setReceivingSubView('receiving_history')}
            />
          ) : receivingSubView === 'receiving_history' ? (
            <ReceivingHistoryScreen
              onBack={() => setReceivingSubView('dashboard')}
              onSelectRecord={(grnId) => {
                setSelectedGrnId(grnId);
                setReceivingSubView('receiving_history_detail');
              }}
            />
          ) : receivingSubView === 'receiving_history_detail' ? (
            <ReceivingHistoryDetailScreen
              receiptId={selectedGrnId}
              shipmentId={selectedShipmentId}
              warehouseName={selectedWHName.replace(' Warehouse', '')}
              result={selectedGrnId === 'GRN-000831' ? 'Rejected' : selectedGrnId === 'GRN-000839' ? 'Accepted' : 'Partially Accepted'}
              receivedBy="Suresh"
              date="25 Sep 2026"
              productName={selectedGrnId === 'GRN-000839' ? 'Potato · Grade 1' : selectedGrnId === 'GRN-000831' ? 'Carrot · Grade 3' : 'Tomato · Grade 2'}
              receivedQty={selectedGrnId === 'GRN-000831' ? '0 KG' : selectedGrnId === 'GRN-000839' ? '300 KG' : '445 KG'}
              expectedQty={selectedGrnId === 'GRN-000831' ? '150 KG' : selectedGrnId === 'GRN-000839' ? '300 KG' : '480 KG'}
              onBack={() => setReceivingSubView('receiving_history')}
              onNavigateTimeline={() => {
                setActiveTab('Home');
                navigateWh('activity_timeline_ops');
              }}
              onNavigateDiscrepancy={() => setReceivingSubView('damage_mismatch_report')}
              onNavigateBatch={() => setReceivingSubView('batch_assignment')}
              onNavigateShipment={() => setReceivingSubView('shipment_detail')}
            />
          ) : receivingSubView === 'transfer_receiving' ? (
            <TransferReceivingScreen
              onBack={() => setReceivingSubView('dashboard')}
              onStartTransferInspection={() => setReceivingSubView('transfer_receiving_inspection')}
            />
          ) : receivingSubView === 'transfer_receiving_inspection' ? (
            <TransferReceivingInspectionScreen
              onBack={() => setReceivingSubView('transfer_receiving')}
              onCompleteTransfer={() => setReceivingSubView('receiving_history')}
            />
          ) : null
        )}

        {/* ─── Inventory Tab (Image 1 Mockup · #F0562A) ─── */}
        {activeTab === 'Inventory' && whSubView === 'overview' && (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollPad}
            showsVerticalScrollIndicator={false}
          >
            {/* Header Banner */}
            <View style={styles.headerBanner}>
              {/* Header Title Row */}
              <View style={styles.headerTopRow}>
                <View style={styles.headerTitleWrap}>
                  <Grid4SquaresIcon size={20} color="#FFFFFF" />
                  <Text style={styles.headerGreetingText}>Inventory & Stock</Text>
                </View>
              </View>

              {/* Warehouse Dropdown Filter Pill */}
              <TouchableOpacity
                style={styles.whFilterPill}
                onPress={() => setShowFilterModal(true)}
                activeOpacity={0.8}
              >
                <BuildingWarehouseIcon size={15} color="#FFFFFF" />
                <Text style={styles.whFilterPillText}>{selectedWHFilter}</Text>
                <ChevronDownWhiteIcon size={13} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Content Container */}
            <View style={styles.contentBody}>
              {/* 1. KPI 2x2 Grid */}
              <View style={styles.kpiGrid}>
                {/* Total Stock */}
                <TouchableOpacity
                  style={styles.kpiCard}
                  onPress={() => {
                    setSelectedWHName('Ooty Warehouse');
                    navigateWh('stock_ledger');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.kpiLabel}>TOTAL STOCK</Text>
                  <Text style={styles.kpiValue}>12,840 KG</Text>
                  <Text style={styles.kpiSub}>KG</Text>
                </TouchableOpacity>

                {/* Incoming Today */}
                <TouchableOpacity
                  style={styles.kpiCard}
                  onPress={() => {
                    setSelectedWHName('Ooty Warehouse');
                    navigateWh('stock_ledger');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.kpiLabel}>INCOMING TODAY</Text>
                  <Text style={styles.kpiValue}>1,240 KG</Text>
                  <Text style={styles.kpiSub}>KG</Text>
                </TouchableOpacity>

                {/* Allocated */}
                <TouchableOpacity
                  style={styles.kpiCard}
                  onPress={() => {
                    setSelectedWHName('Ooty Warehouse');
                    navigateWh('stock_ledger');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.kpiLabel}>ALLOCATED</Text>
                  <Text style={styles.kpiValue}>240 KG</Text>
                  <Text style={styles.kpiSub}>KG</Text>
                </TouchableOpacity>

                {/* Low Stock SKUs */}
                <TouchableOpacity
                  style={styles.kpiCard}
                  onPress={() => navigateWh('low_stock_alerts')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.kpiLabel}>LOW STOCK SKUS</Text>
                  <Text style={styles.kpiValue}>5</Text>
                  <Text style={styles.kpiSub}>SKUs</Text>
                </TouchableOpacity>
              </View>

              {/* 2. Warehouse Summary */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>Warehouse Summary</Text>
                <TouchableOpacity
                  onPress={() => navigateWh('stock_ledger')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewAllLink}>View →</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.summaryListCard}>
                <TouchableOpacity
                  style={styles.summaryItemRow}
                  onPress={() => {
                    setSelectedWHName('Ooty Warehouse');
                    navigateWh('stock_ledger');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.summaryItemName}>Ooty</Text>
                  <Text style={styles.summaryItemValue}>3,420 KG</Text>
                </TouchableOpacity>

                <View style={styles.summaryDivider} />

                <TouchableOpacity
                  style={styles.summaryItemRow}
                  onPress={() => {
                    setSelectedWHName('Coonoor Warehouse');
                    navigateWh('stock_ledger');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.summaryItemName}>Coonoor</Text>
                  <Text style={styles.summaryItemValue}>3,180 KG</Text>
                </TouchableOpacity>
              </View>

              {/* 3. Inventory Activity */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>Inventory Activity</Text>
                <TouchableOpacity
                  onPress={() => navigateWh('stock_ledger')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewAllLink}>View →</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.summaryListCard}
                onPress={() => navigateWh('stock_ledger')}
                activeOpacity={0.8}
              >
                <Text style={styles.inventoryActivityText}>
                  Receipt → Batch Created → Allocation → Reservation → Sale / Transfer / Adjustment
                </Text>
              </TouchableOpacity>

              {/* 4. Pending Actions */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>Pending Actions</Text>
                <TouchableOpacity
                  onPress={() => navigateWh('low_stock_alerts')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewAllLink}>View →</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.summaryListCard}>
                <TouchableOpacity
                  style={styles.summaryItemRow}
                  onPress={() => navigateWh('low_stock_alerts')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.summaryItemName}>Low Stock Alerts</Text>
                  <Text style={[styles.summaryItemValue, { color: PALETTE.primary }]}>5</Text>
                </TouchableOpacity>

                <View style={styles.summaryDivider} />

                <TouchableOpacity
                  style={styles.summaryItemRow}
                  onPress={() => navigateWh('stock_adjustment_approval')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.summaryItemName}>Adjustments Awaiting Approval</Text>
                  <Text style={styles.summaryItemValue}>2</Text>
                </TouchableOpacity>
              </View>

              {/* 5. Quick Actions (Stock Verification & Inter-Warehouse Transfer) */}
              <View style={styles.quickActionsDualRow}>
                <TouchableOpacity
                  style={styles.quickActionDualCard}
                  onPress={() => navigateWh('verify_stock')}
                  activeOpacity={0.8}
                >
                  <StockVerificationIcon size={26} color={PALETTE.primary} />
                  <Text style={styles.quickActionDualLabel}>Stock Verification</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickActionDualCard}
                  onPress={() => navigateWh('inter_warehouse_transfer')}
                  activeOpacity={0.8}
                >
                  <HorizontalTransferIcon size={26} color={PALETTE.primary} />
                  <Text style={styles.quickActionDualLabel}>Inter-Warehouse Transfer</Text>
                </TouchableOpacity>
              </View>

              <View style={{ height: 20 }} />
            </View>
          </ScrollView>
        )}

        {/* ─── More Tab ─── */}
        {activeTab === 'More' && whSubView === 'overview' && (
          <MainWarehouseMoreScreen
            scope={MAIN_WAREHOUSE_SCOPE}
            can={can}
            onBack={() => setActiveTab('Home')}
            onNavigateToDashboard={() => {
              setActiveTab('Home');
              setWhSubView('overview');
              setWhHistory([]);
            }}
            onLogout={onSignOut}
            onTabChange={(tab) => {
              setActiveTab(tab as any);
              setWhSubView('overview');
              setWhHistory([]);
            }}
            onNavigateToOrders={() => navigateWh('customer_orders')}
            onNavigateToSales={() => navigateWh('sales')}
            onNavigateToCustomers={() => navigateWh('customers_list')}
            onNavigateToBilling={() => navigateWh('billing_invoices')}
            onNavigateToWarehouseOperations={() => navigateWh('warehouse_operations')}
            onNavigateToProfile={() => navigateWh('profile')}
            onNavigateToNotifications={() => navigateWh('warehouse_notifications')}
            onNavigateToSettings={() => navigateWh('warehouse_settings')}
          />
        )}

        {/* ─── Sub Views for Interactive Navigation (shared across all tabs) ─── */}
        {whSubView !== 'overview' && (
          whSubView === 'profile' ? (
            <AdminProfileScreen
              role="MAIN_WH_ADMIN"
              onSignOut={onSignOut}
              onBack={goBackWh}
              onNavigateWarehouseOperations={() => navigateWh('warehouse_operations')}
              onNavigateCustomers={() => navigateWh('customers_list')}
              onNavigateBillingInvoices={() => navigateWh('billing_invoices')}
            />
          ) : (whSubView === 'dashboard_operations' || whSubView === 'todays_operations') ? (
              <TodaysOperationsMonitoringScreen
                onBack={goBackWh}
                onNavigateIncoming={() => navigateWh('incoming_goods_ops')}
                onNavigateFulfilment={() => navigateWh('order_fulfilment_ops')}
                onNavigateQuality={() => navigateWh('quality_issues_ops')}
                onNavigateTimeline={() => navigateWh('activity_timeline_ops')}
              />
            ) : whSubView === 'todays_operations_overview' ? (
              <TodaysOperationsOverviewScreen
                onBack={goBackWh}
                onNavigateIncoming={() => {
                  setActiveTab('Receiving');
                  setReceivingSubView('dashboard');
                }}
                onNavigateStorage={() => navigateWh('storage_locations')}
                onNavigateVerification={() => navigateWh('verify_stock')}
                onNavigateMaterials={() => navigateWh('material_handling')}
                onNavigateIssues={() => navigateWh('operational_issues')}
                onNavigateStaff={() => navigateWh('staff_attendance')}
                onNavigateActivity={() => navigateWh('warehouse_activity')}
                onNavigateTimeline={() => navigateWh('activity_timeline_ops')}
              />
            ) : whSubView === 'warehouse_operations' ? (
              <WarehouseOperationsHubScreen
                showBack={true}
                onBack={goBackWh}
                selectedWarehouse={selectedWHFilter}
                onOpenWarehouseFilter={() => setShowFilterModal(true)}
                onOpenNotifications={() => navigateWh('warehouse_notifications')}
                onNavigateWarehouseOverview={() => navigateWh('warehouse_overview')}
                onNavigateTodaysOperations={() => navigateWh('todays_operations_overview')}
                onNavigateNeedsAttention={() => navigateWh('operational_issues')}
                onNavigateStorageLocations={() => navigateWh('storage_locations')}
                onNavigateMaterialHandling={() => navigateWh('material_handling')}
                onNavigateWarehouseCapacity={() => navigateWh('warehouse_capacity')}
                onNavigateOperationalIssues={() => navigateWh('operational_issues')}
                onNavigateStaffAttendance={() => navigateWh('staff_attendance')}
                onNavigateOperationsHistory={() => navigateWh('operations_history')}
                onSelectWarehouseDetail={(whName) => {
                  setSelectedWHName(whName);
                  navigateWh('warehouse_city_detail');
                }}
              />
            ) : whSubView === 'warehouse_overview' ? (
              <WarehouseOverviewScreen
                onBack={goBackWh}
                onSelectWarehouse={(whName) => {
                  setSelectedWHName(whName);
                  navigateWh('warehouse_city_detail');
                }}
                onViewLowStock={() => {
                  navigateWh('alerts_action_center');
                }}
                onOpenSettings={() => {
                  navigateWh('warehouse_settings');
                }}
                onNavigateComparison={() => navigateWh('stock_and_transfer')}
                onNavigatePerformance={() => navigateWh('warehouse_performance')}
                onNavigateCapacitySummary={() => navigateWh('warehouse_capacity')}
                onNavigateManageWarehouses={() => navigateWh('manage_warehouses')}
              />
            ) : whSubView === 'warehouse_city_detail' ? (
              <WarehouseCityDetailScreen
                cityName={selectedWHName}
                onBack={goBackWh}
              />
            ) : whSubView === 'warehouse_notifications' ? (
              <WarehouseNotificationsScreen
                notifications={whNotifications}
                onMarkAsRead={(id) => setWhNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))}
                onMarkAllAsRead={() => setWhNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))}
                onClearAll={() => setWhNotifications([])}
                onAddNotification={() => { }}
                onBack={goBackWh}
              />
            ) : whSubView === 'storage_locations' ? (
              <StorageLocationsScreen
                onBack={() => navigateWh('warehouse_operations')}
                onSelectLocation={(locId) => {
                  setSelectedLocationId(locId);
                  navigateWh('location_detail');
                }}
                onBrowseHierarchy={() => { }}
              />
            ) : whSubView === 'location_detail' ? (
              <LocationDetailScreen
                locationId={selectedLocationId}
                onBack={() => navigateWh('storage_locations')}
                onViewProductDetail={() => { }}
              />
            ) : whSubView === 'material_handling' ? (
              <MaterialHandlingScreen
                onBack={() => navigateWh('warehouse_operations')}
                onSelectMaterial={(matId) => {
                  setSelectedMaterialId(matId);
                  navigateWh('material_detail');
                }}
                onReceiveMaterial={() => {
                  setSelectedMaterialId('MAT-0021');
                  navigateWh('material_detail');
                }}
                onIssueMaterial={() => {
                  setSelectedMaterialId('MAT-0021');
                  navigateWh('material_detail');
                }}
                onViewHistory={() => {
                  navigateWh('warehouse_activity');
                }}
              />
            ) : whSubView === 'material_detail' ? (
              <MaterialDetailScreen
                materialId={selectedMaterialId}
                onBack={goBackWh}
                onReceive={() => {
                  Alert.alert('Receive Material', 'Record new incoming stock for packaging boxes.', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Confirm Receive', onPress: () => Alert.alert('Success', '100 units added to MAT-0021 inventory.') },
                  ]);
                }}
                onIssue={() => {
                  Alert.alert('Issue Material', 'Dispatch packaging boxes to packing line.', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Confirm Issue', onPress: () => Alert.alert('Success', '20 units issued from MAT-0021.') },
                  ]);
                }}
              />
            ) : whSubView === 'warehouse_capacity' ? (
              <WarehouseCapacityScreen
                onBack={() => navigateWh('warehouse_operations')}
                onViewHistory={() => {
                  navigateWh('warehouse_activity');
                }}
              />
            ) : whSubView === 'warehouse_activity' ? (
              <WarehouseActivityScreen
                onBack={goBackWh}
                onViewTimeline={() => { }}
                onNavigateOperationsHistory={() => navigateWh('operations_history')}
                onSelectActivity={(act) => {
                  if (act.includes('Storage')) {
                    navigateWh('location_detail');
                  } else {
                    navigateWh('material_detail');
                  }
                }}
              />
            ) : whSubView === 'operational_issues' ? (
              <OperationalIssuesScreen
                onBack={() => navigateWh('warehouse_operations')}
                onCreateIssue={() => {
                  navigateWh('report_operational_issue');
                }}
                onSelectIssue={() => { }}
              />
            ) : whSubView === 'report_operational_issue' ? (
              <ReportOperationalIssueScreen
                onBack={() => navigateWh('operational_issues')}
                onSubmitIssue={() => {
                  navigateWh('operational_issues');
                }}
              />
            ) : whSubView === 'staff_attendance' ? (
              <StaffAndAttendanceScreen
                onBack={goBackWh}
              />
            ) : whSubView === 'operations_history' ? (
              <OperationsHistoryScreen
                onBack={goBackWh}
                onExport={() => {
                  Alert.alert('Export Successful', 'Operational history log has been exported to CSV.');
                }}
                onSelectVerification={() => navigateWh('verify_stock')}
                onSelectMaterial={() => {
                  setSelectedMaterialId('MAT-0021');
                  navigateWh('material_detail');
                }}
              />
            ) : whSubView === 'stock_and_transfer' ? (
              <StockAndTransferOverviewScreen
                onBack={goBackWh}
                onInitiateTransfer={() => navigateWh('initiate_new_transfer')}
                onViewConsolidatedStock={() => navigateWh('warehouse_overview')}
                onViewLowStock={() => navigateWh('alerts_action_center')}
                onViewTransfers={() => navigateWh('inter_warehouse_transfer')}
              />
            ) : whSubView === 'alerts_action_center' ? (
              <AlertsAndActionCenterScreen
                onBack={goBackWh}
                onSelectAlert={() => navigateWh('low_stock_alerts')}
              />
            ) : whSubView === 'quick_actions_overview' ? (
              <QuickActionsOverviewScreen
                onBack={goBackWh}
                onTransferStock={() => navigateWh('inter_warehouse_transfer')}
                onReviewReceiving={() => {
                  setActiveTab('Receiving');
                  setReceivingSubView('dashboard');
                }}
                onWarehouseOverview={() => navigateWh('warehouse_overview')}
                onViewInventory={() => {
                  setActiveTab('Inventory');
                  setWhSubView('overview');
                }}
                onCreateSwa={() => {
                  if (onNavigate) onNavigate('SubWarehouseStaff');
                  else navigateWh('warehouse_settings');
                }}
                onViewReports={() => navigateWh('dashboard_operations')}
                onWarehouseTargets={() => navigateWh('warehouse_settings')}
                onReviewEscalations={() => navigateWh('alerts_action_center')}
              />
            ) : whSubView === 'stock_ledger' ? (
              <StockLedgerScreen
                warehouseName={selectedWHName}
                onBack={goBackWh}
                onVerifyBatch={(batch) => {
                  if (batch) setSelectedBatch(batch);
                  navigateWh('verify_stock');
                }}
              />
            ) : whSubView === 'verify_stock' ? (
              <VerifyStockScreen
                produceName={selectedBatch?.name ?? 'Carrots'}
                batchId={selectedBatch?.batchId ?? 'BT-4471'}
                zone={selectedBatch?.zone ?? 'Zone A-2'}
                systemCount={selectedBatch?.quantityKg ?? 240}
                initialPhysicalCount={selectedBatch?.name === 'Carrots' ? 225 : (selectedBatch?.quantityKg ? selectedBatch.quantityKg - 5 : 225)}
                onBack={goBackWh}
                onSubmitApproval={(data) => {
                  setAdjustmentRecord(data);
                  navigateWh('stock_adjustment_approval');
                }}
              />
            ) : whSubView === 'stock_adjustment_approval' ? (
              <StockAdjustmentApprovalScreen
                produceName={adjustmentRecord?.produceName ?? selectedBatch?.name ?? 'Carrots'}
                batchId={adjustmentRecord?.batchId ?? selectedBatch?.batchId ?? 'BT-4471'}
                zone={adjustmentRecord?.zone ?? selectedBatch?.zone ?? 'Zone A-2'}
                systemCount={adjustmentRecord?.systemCount ?? selectedBatch?.quantityKg ?? 240}
                physicalCount={adjustmentRecord?.physicalCount ?? 225}
                varianceKg={adjustmentRecord?.varianceKg ?? -15}
                variancePct={adjustmentRecord?.variancePct ?? -6.25}
                reason={adjustmentRecord?.reason ?? 'Spoilage during storage.'}
                onBack={goBackWh}
                onReturnToLedger={() => {
                  setWhSubView('stock_ledger');
                  setWhHistory(['overview']);
                }}
              />
            ) : whSubView === 'low_stock_alerts' ? (
              <LowStockAlertsScreen
                onBack={goBackWh}
                onInitiateTransfer={() => {
                  navigateWh('inter_warehouse_transfer');
                }}
                onAdjustThresholds={() => {
                  navigateWh('warehouse_settings');
                }}
              />
            ) : whSubView === 'inter_warehouse_transfer' ? (
              <InterWarehouseTransferScreen
                transfers={transferList}
                onBack={goBackWh}
                onNewTransfer={() => navigateWh('initiate_new_transfer')}
                onSelectTransfer={(item) => {
                  setSelectedTransfer(item);
                  navigateWh('transfer_detail');
                }}
              />
            ) : whSubView === 'transfer_detail' ? (
              <TransferDetailScreen
                transfer={selectedTransfer}
                onBack={goBackWh}
                onBackToTransfers={() => navigateWh('inter_warehouse_transfer')}
                onTrackReceiving={() => {
                  setActiveTab('Receiving');
                  setReceivingSubView('transfer_receiving');
                }}
              />
            ) : whSubView === 'initiate_new_transfer' ? (
              <InitiateNewTransferScreen
                onBack={goBackWh}
                onSubmitTransfer={(newTransfer) => {
                  setTransferList((prev) => [newTransfer, ...prev]);
                  goBackWh();
                }}
              />
            ) : whSubView === 'warehouse_settings' ? (
              <WarehouseSettingsScreen
                warehouseName={selectedWHName}
                onBack={goBackWh}
              />
            ) : whSubView === 'warehouse_performance' ? (
              <WarehousePerformanceScreen
                onBack={goBackWh}
                onSelectWarehouse={(whName) => {
                  setSelectedWHName(whName);
                  navigateWh('warehouse_city_detail');
                }}
                onViewOperationsHistory={() => navigateWh('operations_history')}
                onViewStaffAttendance={() => navigateWh('staff_attendance')}
              />
            ) : whSubView === 'manage_warehouses' ? (
              <ManageWarehousesScreen
                onBack={goBackWh}
                onConfigureSettings={(whName) => {
                  setSelectedWHName(whName);
                  navigateWh('warehouse_settings');
                }}
                onSelectWarehouse={(whName) => {
                  setSelectedWHName(whName);
                  navigateWh('warehouse_city_detail');
                }}
                onNavigateCapacity={() => navigateWh('warehouse_capacity')}
              />
            ) : whSubView === 'incoming_goods_ops' ? (
              <IncomingGoodsOperationsScreen
                onBack={goBackWh}
                onSelectShipment={(shipmentId) => {
                  setSelectedShipmentId(shipmentId);
                  setActiveTab('Receiving');
                  setReceivingSubView('shipment_detail');
                }}
                onNavigateReceiving={() => {
                  setActiveTab('Receiving');
                  setReceivingSubView('dashboard');
                }}
              />
            ) : whSubView === 'order_fulfilment_ops' ? (
              <OrderFulfilmentOperationsScreen
                onBack={goBackWh}
                onNavigateOrders={() => navigateWh('customers_list')}
              />
            ) : whSubView === 'quality_issues_ops' ? (
              <QualityIssuesOperationsScreen
                onBack={goBackWh}
                onNavigateIssues={() => navigateWh('operational_issues')}
              />
            ) : whSubView === 'activity_timeline_ops' ? (
              <ActivityTimelineOperationsScreen
                onBack={goBackWh}
                onSelectActivity={(actId) => {
                  if (actId.startsWith('GR-')) {
                    setSelectedShipmentId(actId);
                    setActiveTab('Receiving');
                    setReceivingSubView('shipment_detail');
                  } else {
                    navigateWh('operations_history');
                  }
                }}
                onViewAllHistory={() => navigateWh('operations_history')}
              />
            ) : whSubView === 'customers_list' ? (
              <CustomerListScreen
                onBack={goBackWh}
                onSelectCustomer={() => navigateWh('customer_detail')}
                onSearchPress={() => navigateWh('customer_search')}
                onFilterPress={() => navigateWh('customer_search')}
              />
            ) : whSubView === 'customer_search' ? (
              <CustomerSearchScreen
                onBack={goBackWh}
                onSelectCustomer={() => navigateWh('customer_detail')}
              />
            ) : whSubView === 'customer_detail' ? (
              <CustomerDetailScreen
                onBack={goBackWh}
                onNavigateOrders={() => navigateWh('customer_orders')}
                onNavigatePurchases={() => navigateWh('purchase_history')}
                onNavigateWallet={() => navigateWh('wallet_summary')}
                onNavigateIssues={() => navigateWh('customer_issues')}
                onNavigateSupport={() => navigateWh('support_history')}
              />
            ) : whSubView === 'customer_orders' ? (
              <MainWarehouseCustomerOrdersScreen
                onBack={goBackWh}
                onTabChange={(tab) => {
                  if (tab === 'Home') {
                    setActiveTab('Home');
                    setWhSubView('overview');
                    setWhHistory([]);
                  } else {
                    setActiveTab(tab as any);
                    setWhSubView('overview');
                    setWhHistory([]);
                  }
                }}
              />
            ) : whSubView === 'purchase_history' ? (
              <PurchaseHistoryScreen
                onBack={goBackWh}
              />
            ) : whSubView === 'wallet_summary' ? (
              <WalletSummaryScreen
                onBack={goBackWh}
              />
            ) : whSubView === 'customer_issues' ? (
              <CustomerIssuesScreen
                onBack={goBackWh}
              />
            ) : whSubView === 'support_history' ? (
              <SupportHistoryScreen
                onBack={goBackWh}
              />
            ) : whSubView === 'billing_invoices' ? (
              <BillingInvoicesHubScreen
                onBack={goBackWh}
                onNavigateToGenerate={() => navigateWh('generate_invoice')}
                onNavigateToViewInvoices={() => navigateWh('invoice_list')}
                onNavigateToHistory={() => navigateWh('invoice_history')}
                onNavigateToGst={() => navigateWh('gst_invoice')}
                onNavigateToDetail={() => navigateWh('invoice_detail')}
                onHomePress={() => {
                  setActiveTab('Home');
                  setWhSubView('overview');
                  setWhHistory([]);
                }}
                onMorePress={() => {
                  setActiveTab('More');
                  setWhSubView('overview');
                  setWhHistory([]);
                }}
              />
            ) : whSubView === 'invoice_list' ? (
              <InvoiceListScreen
                onBack={goBackWh}
                onSelectInvoice={() => navigateWh('invoice_detail')}
              />
            ) : whSubView === 'invoice_detail' ? (
              <InvoiceDetailScreen
                onBack={goBackWh}
                onNavigateToDownload={() => navigateWh('download_invoice')}
              />
            ) : whSubView === 'generate_invoice' ? (
              <GenerateInvoiceScreen
                onBack={goBackWh}
                onSelectOrder={() => navigateWh('invoice_detail')}
              />
            ) : whSubView === 'gst_invoice' ? (
              <GSTInvoiceScreen
                onBack={goBackWh}
                onViewExisting={() => navigateWh('invoice_detail')}
                onPreviewAuthorized={() => navigateWh('invoice_detail')}
              />
            ) : whSubView === 'download_invoice' ? (
              <DownloadInvoiceScreen
                onBack={goBackWh}
              />
            ) : whSubView === 'invoice_history' ? (
              <InvoiceHistoryScreen
                onBack={goBackWh}
                onSelectInvoice={() => navigateWh('invoice_detail')}
              />
            ) : whSubView === 'sales' ? (
              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollPad}
                showsVerticalScrollIndicator={false}
              >
                {/* Header Banner */}
                <View style={styles.headerBanner}>
                  <View style={styles.headerTopRow}>
                    <TouchableOpacity
                      style={styles.headerBackBtn}
                      onPress={goBackWh}
                      activeOpacity={0.8}
                    >
                      <ArrowLeftWhiteIcon size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View style={[styles.headerTitleWrap, { marginLeft: 8 }]}>
                      <Grid4SquaresIcon size={20} color="#FFFFFF" />
                      <Text style={styles.headerGreetingText}>Sales</Text>
                    </View>
                  </View>
                </View>

                {/* Content Body */}
                <View style={styles.contentBody}>
                  {/* 1. KPI 2x2 Grid */}
                  <View style={styles.kpiGrid}>
                    {/* Today's Sales */}
                    <TouchableOpacity
                      style={styles.kpiCard}
                      onPress={() => navigateWh('sales_history')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.kpiLabel}>TODAY'S SALES</Text>
                      <Text style={styles.kpiValue}>₹24,850</Text>
                    </TouchableOpacity>

                    {/* Market Sales */}
                    <TouchableOpacity
                      style={styles.kpiCard}
                      onPress={() => navigateWh('sales_market_day')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.kpiLabel}>MARKET SALES</Text>
                      <Text style={styles.kpiValue}>₹7,200</Text>
                    </TouchableOpacity>

                    {/* HORECA */}
                    <TouchableOpacity
                      style={styles.kpiCard}
                      onPress={() => navigateWh('sales_horeca')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.kpiLabel}>HORECA</Text>
                      <Text style={styles.kpiValue}>₹4,800</Text>
                    </TouchableOpacity>

                    {/* B2B */}
                    <TouchableOpacity
                      style={styles.kpiCard}
                      onPress={() => navigateWh('sales_b2b')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.kpiLabel}>B2B</Text>
                      <Text style={styles.kpiValue}>₹4,400</Text>
                    </TouchableOpacity>
                  </View>

                  {/* 2. Warehouse Sales Summary */}
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionHeading}>Warehouse Sales Summary</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedWHName('Coonoor Warehouse');
                        navigateWh('stock_ledger');
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.viewAllLink}>View →</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.summaryListCard}>
                    <View style={styles.summaryItemRow}>
                      <Text style={styles.summaryItemName}>Coonoor</Text>
                      <View style={styles.greenBadgePill}>
                        <Text style={styles.greenBadgeText}>₹8,450</Text>
                      </View>
                    </View>
                  </View>

                  {/* 3. Needs Attention */}
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionHeading}>Needs Attention</Text>
                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert('Stock Updated', '2 sales in cart require review before payment.');
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.viewAllLink}>View →</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    style={styles.needsAttentionAlertCard}
                    onPress={() => {
                      Alert.alert('Stock Updated', '2 sales in cart require review before payment.');
                    }}
                    activeOpacity={0.85}
                  >
                    <View style={styles.needsAttentionIconWrap}>
                      <WarningTriangleIcon size={22} color={PALETTE.primary} />
                    </View>
                    <View style={styles.needsAttentionTextWrap}>
                      <Text style={styles.needsAttentionTitle}>Stock Updated — 2 sales in cart</Text>
                      <Text style={styles.needsAttentionSub}>Requires review before payment</Text>
                    </View>
                  </TouchableOpacity>

                  {/* 4. Quick Actions */}
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionHeading}>Quick Actions</Text>
                  </View>
                  <View style={styles.quickActionsDualRow}>
                    <TouchableOpacity
                      style={styles.quickActionDualCard}
                      onPress={() => navigateWh('direct_sale_new')}
                      activeOpacity={0.8}
                    >
                      <ShoppingCartIcon size={26} color={PALETTE.primary} />
                      <Text style={styles.quickActionDualLabel}>New Direct Sale</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.quickActionDualCard}
                      onPress={() => navigateWh('sales_history')}
                      activeOpacity={0.8}
                    >
                      <SalesHistoryClockIcon size={26} color={PALETTE.primary} />
                      <Text style={styles.quickActionDualLabel}>Sales History</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={{ height: 24 }} />
                </View>
              </ScrollView>
            ) : whSubView === 'direct_sale_new' ? (
              <NewDirectSaleScreen
                warehouseName={selectedWHName.replace(' Warehouse', '')}
                onBack={goBackWh}
                onSelectProducts={() => navigateWh('direct_sale_select_products')}
                cartItems={cartProducts}
              />
            ) : whSubView === 'direct_sale_select_products' ? (
              <SelectProductsScreen
                onBack={goBackWh}
                onReviewCart={(selected) => {
                  setCartProducts(selected);
                  navigateWh('direct_sale_summary');
                }}
              />
            ) : whSubView === 'direct_sale_summary' ? (
              <SaleSummaryScreen
                onBack={goBackWh}
                saleItems={cartProducts.length > 0 ? cartProducts : undefined}
                onContinueToCustomer={() => navigateWh('direct_sale_select_customer')}
              />
            ) : whSubView === 'direct_sale_select_customer' ? (
              <SelectCustomerScreen
                onBack={goBackWh}
                onSelectCustomer={(cust) => {
                  setSelectedCustomer(cust);
                  navigateWh('direct_sale_payment');
                }}
              />
            ) : whSubView === 'direct_sale_payment' ? (
              <PaymentScreen
                amount={
                  cartProducts.length > 0
                    ? cartProducts.reduce((acc, p) => acc + p.pricePerKg * p.quantitySelected, 0)
                    : 320
                }
                onBack={goBackWh}
                onConfirmPayment={(method) => {
                  setConfirmedPaymentMethod(method);
                  navigateWh('direct_sale_confirmation');
                }}
              />
            ) : whSubView === 'direct_sale_confirmation' ? (
              <SaleConfirmationScreen
                saleId="SALE-00251"
                warehouseName={selectedWHName.replace(' Warehouse', '') || 'Coonoor'}
                customerName={selectedCustomer?.name ?? 'Arun Kumar'}
                amount={
                  cartProducts.length > 0
                    ? cartProducts.reduce((acc, p) => acc + p.pricePerKg * p.quantitySelected, 0)
                    : 320
                }
                onBack={goBackWh}
                onViewInvoice={() => navigateWh('sale_details')}
                onNewSale={() => {
                  setCartProducts([]);
                  setWhSubView('direct_sale_new');
                  setWhHistory(['sales']);
                }}
              />
            ) : whSubView === 'sale_details' ? (
              <SaleDetailsScreen onBack={goBackWh} />
            ) : whSubView === 'sales_market_day' ? (
              <MarketDaySalesScreen
                onBack={goBackWh}
                onSelectSummary={() => navigateWh('sale_details')}
              />
            ) : whSubView === 'sales_horeca' ? (
              <HorecaSalesScreen onBack={goBackWh} />
            ) : whSubView === 'sales_b2b' ? (
              <B2bSalesScreen onBack={goBackWh} />
            ) : whSubView === 'sales_history' ? (
              <SalesHistoryScreen
                onBack={goBackWh}
                onSelectRecord={() => navigateWh('sale_details')}
              />
            ) : null
          )}
      </View>

      {/* ─── Bottom Navigation Tab Bar (Home, Receiving, Inventory, More) ─── */}
      {((activeTab === 'Receiving' &&
        receivingSubView !== 'search_filters' &&
        receivingSubView !== 'shipment_detail' &&
        receivingSubView !== 'start_receiving' &&
        receivingSubView !== 'quantity_verification' &&
        receivingSubView !== 'quality_check' &&
        receivingSubView !== 'grade_product_verification' &&
        receivingSubView !== 'damage_mismatch_report' &&
        receivingSubView !== 'acceptance_decision' &&
        receivingSubView !== 'partial_acceptance' &&
        receivingSubView !== 'goods_receipt_summary' &&
        receivingSubView !== 'batch_assignment' &&
        receivingSubView !== 'storage_location_assignment' &&
        receivingSubView !== 'transfer_receiving' &&
        receivingSubView !== 'transfer_receiving_inspection') ||
        (activeTab === 'Home' &&
          (whSubView === 'overview' ||
            whSubView === 'warehouse_operations' ||
            whSubView === 'warehouse_overview' ||
            whSubView === 'warehouse_city_detail' ||
            whSubView === 'dashboard_operations' ||
            whSubView === 'todays_operations' ||
            whSubView === 'todays_operations_overview' ||
            whSubView === 'storage_locations' ||
            whSubView === 'material_handling' ||
            whSubView === 'warehouse_capacity' ||
            whSubView === 'warehouse_activity' ||
            whSubView === 'operational_issues' ||
            whSubView === 'report_operational_issue' ||
            whSubView === 'staff_attendance' ||
            whSubView === 'operations_history' ||
            whSubView === 'incoming_goods_ops' ||
            whSubView === 'order_fulfilment_ops' ||
            whSubView === 'quality_issues_ops' ||
            whSubView === 'activity_timeline_ops' ||
            whSubView === 'warehouse_performance' ||
            whSubView === 'manage_warehouses' ||
            whSubView === 'warehouse_settings' ||
            whSubView === 'alerts_action_center' ||
            whSubView === 'quick_actions_overview')) ||
        (activeTab === 'More' && whSubView !== 'overview') ||
        (activeTab === 'Inventory')) && (
          <View style={styles.bottomTabBar}>
            {/* Home */}
            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => {
                setActiveTab('Home');
                setWhSubView('overview');
                setWhHistory([]);
              }}
              accessibilityRole="tab"
              activeOpacity={0.7}
            >
              <HomeTabNavIcon active={activeTab === 'Home'} />
              <Text style={[styles.tabLabel, activeTab === 'Home' && styles.tabLabelActive]}>Home</Text>
            </TouchableOpacity>

            {/* Receiving */}
            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => {
                setActiveTab('Receiving');
                setReceivingSubView('dashboard');
                setWhSubView('overview');
                setWhHistory([]);
              }}
              accessibilityRole="tab"
              activeOpacity={0.7}
            >
              <ReceivingTabNavIcon active={activeTab === 'Receiving'} />
              <Text style={[styles.tabLabel, activeTab === 'Receiving' && styles.tabLabelActive]}>Receiving</Text>
            </TouchableOpacity>

            {/* Inventory */}
            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => {
                setActiveTab('Inventory');
                setWhSubView('overview');
                setWhHistory([]);
              }}
              accessibilityRole="tab"
              activeOpacity={0.7}
            >
              <InventoryTabNavIcon active={activeTab === 'Inventory'} />
              <Text style={[styles.tabLabel, activeTab === 'Inventory' && styles.tabLabelActive]}>Inventory</Text>
            </TouchableOpacity>

            {/* More */}
            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => {
                setActiveTab('More');
                setWhSubView('overview');
                setWhHistory([]);
              }}
              accessibilityRole="tab"
              activeOpacity={0.7}
            >
              <MoreTabNavIcon active={false} />
              <Text style={styles.tabLabel}>More</Text>
            </TouchableOpacity>
          </View>
        )}

      {/* ─── Warehouse Filter Dropdown Modal ─── */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowFilterModal(false)}>
          <View style={styles.filterModalCard}>
            <Text style={styles.filterModalTitle}>Select Warehouse Scope</Text>
            {WAREHOUSE_OPTIONS.map((wh) => {
              const isSelected = selectedWHFilter === wh;
              return (
                <TouchableOpacity
                  key={wh}
                  style={[styles.filterOptionRow, isSelected && styles.filterOptionRowActive]}
                  onPress={() => {
                    setSelectedWHFilter(wh);
                    if (wh !== 'All Warehouses') {
                      setSelectedWHName(`${wh} Warehouse`);
                    }
                    setShowFilterModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterOptionText, isSelected && styles.filterOptionTextActive]}>
                    {wh}
                  </Text>
                  {isSelected && <Text style={styles.filterCheckmark}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.headerBg,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollPad: {
    paddingBottom: 24,
  },

  // ─── Header Banner ───
  headerBanner: {
    backgroundColor: PALETTE.headerBg,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 10,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  headerGreetingText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  notificationBellBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#DC2626',
    width: 17,
    height: 17,
    borderRadius: 8.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '900',
  },
  headerSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.88)',
    marginTop: 4,
  },
  whFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: PALETTE.headerPillBg,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5.5,
    borderRadius: 100, // Full 100px from Design System PDF
    marginTop: 10,
  },
  whFilterPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ─── Content Body ───
  contentBody: {
    backgroundColor: PALETTE.pageBg,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  sectionHeading: {
    fontSize: 13.5,
    fontWeight: '800',
    color: PALETTE.orangeDeep,
    letterSpacing: -0.2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 10,
  },
  viewAllLink: {
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.primary,
  },

  // ─── KPI Grid (Today's Overview) ───
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginTop: 10,
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14, // LG 14px from Design System PDF
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  kpiLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: PALETTE.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textAlign: 'left',
  },
  kpiValue: {
    fontSize: 19, // Design System PDF Page 2: KPI VALUE 19px / 800
    fontWeight: '800', // Bold in all dashboards
    color: PALETTE.textInk,
    marginTop: 4,
    lineHeight: 24,
    letterSpacing: -0.3,
    textAlign: 'left',
  },
  kpiSub: {
    fontSize: 11,
    fontWeight: '500',
    color: PALETTE.textSecondary,
    marginTop: 2,
    textAlign: 'left',
  },
  kpiLink: {
    fontSize: 11.5,
    fontWeight: '700',
    color: PALETTE.primary,
    marginTop: 8,
    textAlign: 'left',
  },
  kpiInfoBanner: {
    backgroundColor: PALETTE.primarySoft,
    borderWidth: 1,
    borderColor: PALETTE.primaryBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 14,
  },
  kpiInfoText: {
    flex: 1,
    fontSize: 12,
    color: PALETTE.orangeDeep,
    lineHeight: 17,
    fontWeight: '500',
  },

  // ─── Warehouse Progress Cards ───
  whProgressCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14, // LG 14px from Design System PDF
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  whProgressTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  whProgressTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  progressBarTrack: {
    height: 7,
    backgroundColor: '#EBE5DC',
    borderRadius: 3.5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3.5,
  },

  // ─── Operations Card ───
  operationsCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14, // LG 14px from Design System PDF
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  operationsText: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.textInk,
  },

  // ─── Warehouse Operations Hub Card ───
  whHubPromoCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  whHubPromoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  whHubPromoIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: PALETTE.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whHubPromoTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  whHubPromoSub: {
    fontSize: 11.5,
    fontWeight: '500',
    color: PALETTE.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  whHubPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F2ECE5',
  },
  whHubMiniPill: {
    backgroundColor: PALETTE.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 100,
  },
  whHubMiniPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.orangeDeep,
  },

  // ─── Alert Card ───
  alertCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14, // LG 14px from Design System PDF
    borderWidth: 1,
    borderColor: PALETTE.border,
    overflow: 'hidden',
    position: 'relative',
  },
  alertAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: PALETTE.primary,
  },
  alertContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingLeft: 16,
    paddingRight: 14,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  alertSub: {
    fontSize: 12,
    fontWeight: '400',
    color: PALETTE.textSecondary,
    marginTop: 3,
    lineHeight: 16,
  },

  // ─── Recent Activity ───
  recentActivityCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14, // LG 14px from Design System PDF
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  activityItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  activityIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8, // XS 8px from Design System PDF
    backgroundColor: PALETTE.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  activitySub: {
    fontSize: 11.5,
    color: PALETTE.textSecondary,
    marginTop: 2,
  },
  activityTime: {
    fontSize: 11,
    color: PALETTE.textMuted,
    fontWeight: '500',
  },
  activityDivider: {
    height: 1,
    backgroundColor: PALETTE.border,
  },

  // ─── Quick Actions ───
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  quickActionCard: {
    width: '48.5%',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14, // LG 14px from Design System PDF
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  quickActionLabel: {
    fontSize: 12.5,
    fontWeight: '800',
    color: PALETTE.textInk,
    textAlign: 'center',
  },

  // ─── Disclaimer ───
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 20,
    backgroundColor: PALETTE.primarySoft,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 14, // LG 14px from Design System PDF
    padding: 14,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: PALETTE.textSecondary,
    lineHeight: 18,
    fontWeight: '500',
  },

  // ─── Bottom Tab Bar ───
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: PALETTE.tabBorder,
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 24,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    minWidth: 64,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.tabInactive,
    marginTop: 3,
  },
  tabLabelActive: {
    color: PALETTE.tabActive,
    fontWeight: '800',
  },

  // ─── Inventory & Stock View Specific Styles ───
  summaryListCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 2,
  },
  summaryItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  summaryItemName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  summaryItemValue: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: PALETTE.border,
    marginVertical: 12,
  },
  inventoryActivityText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#4B433E',
    lineHeight: 18,
  },
  quickActionsDualRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  quickActionDualCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionDualLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginTop: 8,
    textAlign: 'center',
  },

  // ─── Filter Modal ───
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  filterModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  filterModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 14,
  },
  filterOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  filterOptionRowActive: {
    backgroundColor: PALETTE.primarySoft,
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  filterOptionTextActive: {
    color: PALETTE.primary,
    fontWeight: '800',
  },
  filterCheckmark: {
    fontSize: 15,
    fontWeight: '900',
    color: PALETTE.primary,
  },

  // ─── Sales View Specific Styles ───
  greenBadgePill: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  greenBadgeText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0D6B4F',
  },
  needsAttentionAlertCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FDBA74',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  needsAttentionIconWrap: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  needsAttentionTextWrap: {
    flex: 1,
  },
  needsAttentionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  needsAttentionSub: {
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.textSecondary,
    marginTop: 2,
  },
  headerBackBtn: {
    padding: 4,
    marginRight: 4,
  },
});
