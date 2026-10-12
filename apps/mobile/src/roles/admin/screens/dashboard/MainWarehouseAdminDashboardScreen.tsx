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
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { adminColors } from '../../theme';
import { fetchMe, hasSessionCredentials, type UserMe } from '../../../farmer/api/auth';
import {
  HOME_CODES,
  HomeFlow,
  MoreScreen,
  type AttentionFilter,
  type HomeTarget,
} from '../warehouse/dashboard-home-more';
import { EmptyState } from '../warehouse/wallet-cashtopup/WalletParts';
import { PROFILE_WAREHOUSES, ProfileFlow } from '../warehouse/profile-settings';
import { CustomersFlow, type CustomersRouteParams } from '../warehouse/customers';
import { BillingFlow } from '../warehouse/billing-invoices';
import { WalletFlow, walletParamsForCustomer } from '../warehouse/wallet-cashtopup';
import { FinanceFlow } from '../warehouse/finance-expenses';
import { ReportsScreen } from '../warehouse/reports';
import { makeCan } from '../../permissions/can';
import { useWarehousePermissions } from '../../permissions/useWarehousePermissions';
import type { WarehouseScope } from '../warehouse/finance-expenses';
import { OrdersFlow } from '../warehouse/orders';
import { InventoryFlow } from '../warehouse/inventory';
import { ReturnsFlow } from '../warehouse/returns-rma';
import { SalesFlow, type SalesRoute, type SalesRouteParams } from '../warehouse/sales-direct';
import { StaffFlow, type StaffRouteParams } from '../warehouse/staff-attendance';
import { StorageFlow, type ActivityModule, type StorageRouteParams } from '../warehouse/storage-ops';
import { TransfersFlow, type TransferRoute } from '../warehouse/transfers';
import { WarehouseAdminFlow, type WarehouseAdminRoute } from '../warehouse/warehouse-admin';
import { ReceivingFlow, receivingRouteFor } from '../warehouse/receiving-qc';
import {
  MAIN_NOTIFICATIONS,
  NotificationsFlow,
  type NotificationItem,
  type NotificationsRoute,
} from '../warehouse/notifications';

/**
 * Receiving tab entry keys. Every key except the transfer ones opens the
 * shared ReceivingFlow on the matching route (receivingRouteFor, W4); the
 * flow owns the stack from there.
 */
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
  goldProgress: '#B8860B',
  greenProgress: '#0D684D',
  trackBg: '#EBE5DC',
  divider: '#F2ECE5',
  goldBg: '#FEF9E7',
  greenPillBg: '#E6F7F2',
  brandBrown: '#5C3D2E',
  subTextMuted: '#8C827A',
};

export type MainWHTab = 'Home' | 'Receiving' | 'Inventory' | 'More';

type WarehouseSubView =
  | 'overview'
  | 'warehouse_operations'
  | 'warehouse_overview'
  | 'warehouse_comparison'
  | 'warehouse_city_detail'
  | 'dashboard_operations'
  | 'todays_operations'
  | 'todays_operations_overview'
  | 'warehouse_performance'
  | 'manage_warehouses'
  | 'manage_swas'
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
  | 'consolidated_stock'
  | 'low_stock_surplus'
  | 'transfer_tracking'
  | 'alerts_action_center'
  | 'alert_detail'
  | 'quick_actions_overview'
  // Sales hub "Needs Attention" card (shared HomeFlow NeedsAttention, W4 dashboard part 2)
  | 'needs_attention'
  | 'stock_ledger'
  | 'verify_stock'
  | 'stock_adjustment_approval'
  | 'low_stock_alerts'
  | 'inter_warehouse_transfer'
  | 'initiate_new_transfer'
  | 'warehouse_settings'
  | 'sales'
  | 'direct_sale_new'
  | 'customer_orders'
  | 'warehouse_notifications'
  | 'profile'
  // Module 7: Customers (the shared CustomersFlow owns its own sub-screens, W4)
  | 'customers_list'
  // Module 9: Billing & Invoices (the shared BillingFlow owns its own sub-screens, W4)
  | 'billing_invoices'
  | 'warehouse_stock'
  | 'consolidated_stock'
  | 'consolidated_stock_detail'
  | 'pending_actions'
  | 'stock_allocation';

// ─── SVG Icons (Matching D01 Screenshots) ───────────────────────────────────

function BackArrowIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
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

function SlidersIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 6h16M4 12h16M4 18h16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M8 4v4M16 10v4M10 16v4" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

function ConsolidatedLayersIcon({ size = 26, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2L2 7l10 5 10-5-10-5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M2 17l10 5 10-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M2 12l10 5 10-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LowStockZigzagIcon({ size = 26, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 8l6 6 4-4 7 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M15 17h5v-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function AllocationPieIcon({ size = 26, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20z" stroke={color} strokeWidth="2" />
      <Path d="M12 2v20" stroke={color} strokeWidth="2" />
      <Path d="M12 12h10" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function DistributionBarChartIcon({ size = 26, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 20V10" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M18 20V4" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M6 20V16" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

function AvailabilityBoxIcon({ size = 26, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 8.5h16v11a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19.5v-11z" stroke={color} strokeWidth="2" />
      <Path d="M2.5 4.5A1.5 1.5 0 0 1 4 3h16a1.5 1.5 0 0 1 1.5 1.5V7a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 7V4.5z" stroke={color} strokeWidth="2" />
      <Path d="M10 12h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ComparisonScaleIcon({ size = 26, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3v18M5 21h14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 7h16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M4 7l-2 5a3 3 0 0 0 6 0L6 7" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M18 7l-2 5a3 3 0 0 0 6 0L20 7" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ProductDetailFruitIcon({ size = 26, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="14" r="7.5" stroke={color} strokeWidth="2" />
      <Path d="M12 6.5C12 4.5 13.5 3 15 3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M10 6c1-1 3-1 4 0" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

function ActionBatchesIcon({ size = 26, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M3 10h18" stroke={color} strokeWidth="2" />
      <Path d="M8 4v16" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function ActionLedgerIcon({ size = 26, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 20V5.5L7.5 3.5 10 5.5l2-2 2 2 2-2 3 2V20H5z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M8 9h8M8 13h8M8 16.5h5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function MovementUpIcon({ size = 20, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 19V5M5 12l7-7 7 7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

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

function ProfileHeaderIcon({ size = 19, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth="1.9" />
      <Circle cx="12" cy="9.5" r="3" stroke={color} strokeWidth="1.9" />
      <Path
        d="M6.8 17.8c1.3-2.1 3.2-2.6 5.2-2.6s3.9.5 5.2 2.6"
        stroke={color}
        strokeWidth="1.9"
        strokeLinecap="round"
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

function StockBoxIcon({ size = 26, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="5" rx="1.5" stroke={color} strokeWidth="2" />
      <Path d="M5 9v10a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5V9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 13h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ArrowLeftWhiteIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ScaleBalanceIcon({ size = 24, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 21h10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 3v18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TrendingUpLineIcon({ size = 24, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="m22 7-8.5 8.5-5-5L2 17" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 7h6v6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CapacityCircularIcon({ size = 24, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 12a9 9 0 1 1-6.219-8.56" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function GearCogIcon({ size = 24, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
      <Path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke={color}
        strokeWidth="2"
      />
    </Svg>
  );
}

const OVERVIEW_WAREHOUSES = [
  {
    id: 'wh-ooty',
    name: 'Ooty',
    capacityLabel: '82% capacity',
    capacityColor: PALETTE.goldProgress,
    capacityBg: PALETTE.goldBg,
    progressWidth: '82%' as const,
    progressColor: PALETTE.goldProgress,
    stock: '3,420 KG',
    receipts: '420 KG',
    issues: '2',
    comparisonStat: '3,420 KG · 82%',
  },
  {
    id: 'wh-coonoor',
    name: 'Coonoor',
    capacityLabel: '68% capacity',
    capacityColor: PALETTE.greenProgress,
    capacityBg: PALETTE.greenPillBg,
    progressWidth: '68%' as const,
    progressColor: PALETTE.greenProgress,
    stock: '3,180 KG',
    receipts: '380 KG',
    issues: '3',
    comparisonStat: '3,180 KG · 68%',
  },
  {
    id: 'wh-kotagiri',
    name: 'Kotagiri',
    capacityLabel: '74% capacity',
    capacityColor: PALETTE.goldProgress,
    capacityBg: PALETTE.goldBg,
    progressWidth: '74%' as const,
    progressColor: PALETTE.goldProgress,
    stock: '2,940 KG',
    receipts: '310 KG',
    issues: '1',
    comparisonStat: '2,940 KG · 74%',
  },
  {
    id: 'wh-gudalur',
    name: 'Gudalur Market',
    capacityLabel: '61% capacity',
    capacityColor: PALETTE.greenProgress,
    capacityBg: PALETTE.greenPillBg,
    progressWidth: '61%' as const,
    progressColor: PALETTE.greenProgress,
    stock: '3,300 KG',
    receipts: '360 KG',
    issues: '1',
    comparisonStat: '3,300 KG · 61%',
  },
] as const;

function AlertEscalationIcon({ size = 20, color = PALETTE.red }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function AlertClockIcon({ size = 20, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 7v5l3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

interface WarehouseAlertItem {
  id: string;
  title: string;
  category: string;
  warehouse: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  time: string;
  subtitle: string;
  description: string;
  status: 'unread' | 'resolved';
  relatedRoute: WarehouseSubView;
}

const DEFAULT_ALERTS: WarehouseAlertItem[] = [
  {
    id: 'ALT-00812',
    title: 'Coonoor stock below target',
    category: 'Low Stock',
    warehouse: 'Coonoor',
    priority: 'Medium',
    time: 'Today, 08:30 AM',
    subtitle: 'Low stock alert · Today 08:30 AM',
    description: 'Beans Grade 1 stock has fallen below the configured target for Coonoor.',
    status: 'unread',
    relatedRoute: 'low_stock_alerts',
  },
  {
    id: 'ALT-00811',
    title: 'SWA issue escalated — Ooty',
    category: 'Operational',
    warehouse: 'Ooty',
    priority: 'Critical',
    time: 'Today, 07:15 AM',
    subtitle: 'Warehouse-level issue · Today 07:15 AM',
    description: 'Cold storage unit #2 temperature variance reported by SWA in Ooty.',
    status: 'unread',
    relatedRoute: 'operational_issues',
  },
  {
    id: 'ALT-00810',
    title: 'Follow-up: Transfer TRF-00284 variance',
    category: 'Transfer',
    warehouse: 'Kotagiri',
    priority: 'High',
    time: 'Today, 06:45 AM',
    subtitle: 'Assigned action · Due today',
    description: 'Variance of 40 KG noted on transfer from Coonoor to Kotagiri awaiting reconciliation.',
    status: 'unread',
    relatedRoute: 'inter_warehouse_transfer',
  },
];

function TransferArrowsWhiteIcon({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 8h15M15 4l4 4-4 4M20 16H5M9 12l-4 4 4 4" stroke={PALETTE.headerText} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = PALETTE.subTextMuted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Line x1="16.5" y1="16.5" x2="21" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

const CONSOLIDATED_PRODUCTS = [
  {
    product: 'Carrot Grade 1',
    rows: [
      { wh: 'Ooty', kg: '850 KG' },
      { wh: 'Coonoor', kg: '620 KG' },
      { wh: 'Kotagiri', kg: '490 KG' },
      { wh: 'Gudalur Market', kg: '710 KG' },
    ],
    total: '2,670 KG',
  },
  {
    product: 'Beans Grade 1',
    rows: [
      { wh: 'Ooty', kg: '900 KG' },
      { wh: 'Coonoor', kg: '750 KG' },
      { wh: 'Kotagiri', kg: '680 KG' },
      { wh: 'Gudalur Market', kg: '810 KG' },
    ],
    total: '3,140 KG',
  },
];

const LOW_STOCK_ITEMS = [
  {
    product: 'Beans Grade 1',
    warehouse: 'Ooty',
    current: '90 KG',
    target: '300 KG',
  },
  {
    product: 'Carrot Grade 1',
    warehouse: 'Coonoor',
    current: '120 KG',
    target: '250 KG',
  },
];

const TRACKING_TRANSFERS = [
  {
    id: 'TRF-00284',
    route: 'Coonoor → Ooty',
    status: 'In Transit',
    details: '200 KG · Carrot Grade 1',
  },
  {
    id: 'TRF-00279',
    route: 'Kotagiri → Gudalur',
    status: 'Received',
    details: '150 KG · Cabbage Grade 1',
  },
];

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
/** External customer routes the Main shell draws inside CustomersFlow (New Sale leaves for the direct-sale flow). */
const MAIN_CUSTOMER_INLINE_ROUTES = ['CustomerWallet', 'CashTopUp', 'OrderDetail', 'RmaDetail'] as const;
const MAIN_WAREHOUSE_SCOPE: WarehouseScope = {};
/** StaffFlow entry params for the attendance overview (stable, so the flow does not restart). */
const ATTENDANCE_ALL_PARAMS: StaffRouteParams = { attendanceFilter: 'All' };
/** StorageFlow entry params for Main's Report Operational Issue sub-view (stable). */
const REPORT_OPERATIONAL_PARAMS: StorageRouteParams = { reportMode: 'operational' };
/** StorageFlow entry params for the activity log presets (stable). */
const ACTIVITY_TODAY_PARAMS: StorageRouteParams = { activityPreset: 'Today' };
const ACTIVITY_ALL_PARAMS: StorageRouteParams = { activityPreset: 'All' };

/**
 * Main sales sub-views -> shared SalesFlow entries (W4). The Main shell used to
 * render its own slices from DirectSaleScreens.tsx (deleted); it now opens the
 * same flow as the Sub shell with MAIN_WAREHOUSE_SCOPE (all four warehouses,
 * owner decision). Market Day / HORECA / B2B / History are reached from the
 * Sales hub inside the flow, so only the two entries the shell produces remain.
 */
const MAIN_SALES_ENTRY: Partial<Record<WarehouseSubView, { screen: SalesRoute; params?: SalesRouteParams }>> = {
  sales: { screen: 'Sales' },
  direct_sale_new: { screen: 'NewSale' },
};

/** Seeded warehouse id for a display name like 'Ooty Warehouse' or 'Ooty' (the overview still passes names). */
function warehouseIdForName(name: string): string | undefined {
  const key = name.replace(/ Warehouse$/, '').toLowerCase();
  return PROFILE_WAREHOUSES.find((w) => (w.warehouseName ?? '').toLowerCase().startsWith(key))?.warehouseId;
}

/**
 * Old transfer sub-views -> shared TransfersFlow entry routes (W4). The detail
 * is only ever opened from the list, which now lives inside the flow.
 */
const TRANSFER_ENTRY: Partial<Record<WarehouseSubView, TransferRoute>> = {
  inter_warehouse_transfer: 'Transfers',
  initiate_new_transfer: 'InitiateNewTransfer',
};

/**
 * Old warehouse-admin sub-views -> WarehouseAdminFlow entry routes (W4).
 * ManageWarehousesScreen was absorbed into Warehouse Overview, so
 * 'manage_warehouses' opens the overview; 'manage_swas' is the Create SWA
 * quick action (it used to open the Sub roster key 'SubWarehouseStaff').
 */
const WAREHOUSE_ADMIN_ENTRY: Partial<Record<WarehouseSubView, WarehouseAdminRoute>> = {
  warehouse_city_detail: 'WarehouseCityDetail',
  manage_swas: 'ManageSubWarehouseAdmins',
};

/** Old Main inventory sub-views -> shared InventoryFlow route keys (design ids). */
const INVENTORY_ENTRY = {
  warehouse_stock: 'M3S02',
  stock_ledger: 'M3S06',
  stock_allocation: 'M3S07',
  verify_stock: 'M3S10',
  stock_adjustment_approval: 'M3S17',
  low_stock_alerts: 'M3S09',
} as const;

/**
 * Main-only screens opened from the shared More menu. The old
 * MainWarehouseMoreScreen rendered these itself as local fallbacks; the shared
 * MoreScreen is role-neutral, so this shell supplies them via onNavigateTo*.
 */
type MainMoreSubScreen = 'wallet' | 'returns' | 'finance' | 'reports' | 'staff' | 'admin' | 'settings';

export interface MainWarehouseAdminDashboardScreenProps {
  onSignOut: () => void;
  /** Kept for hosts (App.tsx passes it); the shell no longer leaves to an App key (Create SWA is in-shell, W4). */
  onNavigate?: (screen: string) => void;
}

export function MainWarehouseAdminDashboardScreen({ onSignOut }: MainWarehouseAdminDashboardScreenProps) {
  const [activeTab, setActiveTab] = useState<MainWHTab>('Home');
  const [receivingSubView, setReceivingSubView] = useState<ReceivingSubView>('dashboard');
  const [whSubView, setWhSubView] = useState<WarehouseSubView>('overview');
  const [moreSubScreen, setMoreSubScreen] = useState<MainMoreSubScreen | null>(null);
  const [whHistory, setWhHistory] = useState<WarehouseSubView[]>([]);
  const [selectedWHFilter, setSelectedWHFilter] = useState('All Warehouses');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedWHName, setSelectedWHName] = useState('Ooty Warehouse');
  const [selectedLocationId, setSelectedLocationId] = useState('CS-C01');
  // Only the old Warehouse Activity / Operations History rows set this (now inside
  // StorageFlow, W4 storage-ops part B); the 'material_detail' sub-view keeps its default.
  const [selectedMaterialId] = useState('MAT-0021');
  /** Filter the Sales hub's Needs Attention card opened the queue on. */
  const [attentionCategory, setAttentionCategory] = useState<AttentionFilter>('all');
  const [alertsList, setAlertsList] = useState<WarehouseAlertItem[]>(DEFAULT_ALERTS);
  const [selectedAlert, setSelectedAlert] = useState<WarehouseAlertItem>(DEFAULT_ALERTS[0]!);
  const [alertStatusFilter, setAlertStatusFilter] = useState<'All' | 'Unread' | 'Resolved'>('All');
  const [alertPriorityFilter, setAlertPriorityFilter] = useState<'All Priority' | 'Critical'>('All Priority');
  const [alertWhFilter, setAlertWhFilter] = useState('All Warehouses');
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [user, setUser] = useState<UserMe | null>(null);
  // Permissions come from GET /v1/auth/me, retried until it answers: the demo
  // sign-in opens this shell without waiting for its token, so a one-shot fetch
  // could leave every gate closed for the session. Until a list arrives makeCan
  // fails closed; in __DEV__ only, after the retries, the MAIN_WH_ADMIN grants
  // from docs/rbac.json stand in (../../permissions/warehousePermissions.ts).
  // The server still authorises every call (CLAUDE.md 2.1).
  const { permissions } = useWarehousePermissions({
    enabled: true,
    adminRole: 'MAIN_WH_ADMIN',
    isDev: __DEV__,
    loadPermissions: async () => {
      const me = await fetchMe();
      setUser(me);
      return me.permissions ?? [];
    },
    hasCredentials: hasSessionCredentials,
  });
  const can = useMemo(() => makeCan(permissions), [permissions]);
  const canAllView = can(HOME_CODES.allView);
  const [whNotifications, setWhNotifications] = useState<readonly NotificationItem[]>(MAIN_NOTIFICATIONS);
  const unreadNotifCount = whNotifications.filter((n) => !n.isRead).length;

  // Filter options from the seeded warehouses (not a written-in list): 'Ooty', ..., 'Gudalur Market'.
  const WAREHOUSE_OPTIONS = [
    'All Warehouses',
    ...PROFILE_WAREHOUSES.map((w) => (w.warehouseName ?? '').replace(/ Warehouse$/, '')),
  ];

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

  const handleMoreTabChange = (tab: MainWHTab) => {
    setActiveTab(tab);
    setWhSubView('overview');
    setWhHistory([]);
    setMoreSubScreen(null);
  };

  // The old MainWarehouseMoreScreen kept its sub-screen in local state, so it
  // reset whenever the More tab unmounted. Keep that: leaving the tab closes it.
  useEffect(() => {
    if (activeTab !== 'More') setMoreSubScreen(null);
  }, [activeTab]);

  const displayName = 'Suresh';

  /** Leave the sub-views for a tab (notification targets that live on a tab). */
  const openTab = (tab: MainWHTab, more?: MainMoreSubScreen) => {
    setActiveTab(tab);
    setWhSubView('overview');
    setWhHistory([]);
    if (tab === 'Receiving') setReceivingSubView('dashboard');
    if (more !== undefined) setMoreSubScreen(more);
  };

  // Shared notifications flow (W4): the bell opens the list, Home's alerts /
  // escalations open the approval / exception alerts. MAIN_WAREHOUSE_SCOPE =
  // all four warehouses; targets are opened only when their code passes.
  /** Modules outside storage-ops that own an activity record or a Today tile (StorageFlow onOpenModule). */
  const openMainModule = (module: ActivityModule) => {
    if (module === 'receiving') openTab('Receiving');
    else if (module === 'storage') navigateWh('storage_locations');
    else if (module === 'verification') navigateWh('verify_stock');
    else if (module === 'orders') navigateWh('order_fulfilment_ops');
    else if (module === 'qc') navigateWh('quality_issues_ops');
    else if (module === 'staff') navigateWh('staff_attendance');
    else if (module === 'cash') openTab('More', 'wallet');
  };
  /**
   * HomeFlow targets -> this shell's sub-views / tabs. Create SWA opens Manage
   * Sub Warehouse Admins (W4 warehouse-admin); the Quick Actions screen only
   * draws it with admin.sub_wh_admin.create (it used to be drawn inert).
   */
  const openHomeTarget = (target: HomeTarget) => {
    if (target === 'TransferList') navigateWh('inter_warehouse_transfer');
    else if (target === 'InitiateTransfer') navigateWh('initiate_new_transfer');
    else if (target === 'ReceivingDashboard') openTab('Receiving');
    else if (target === 'WarehouseOverview') navigateWh('warehouse_overview');
    else if (target === 'Inventory') openTab('Inventory');
    else if (target === 'LowStock' || target === 'Escalations') navigateWh('alerts_action_center');
    else if (target === 'CreateSwa') navigateWh('manage_swas');
    else if (target === 'Reports') navigateWh('dashboard_operations');
    else if (target === 'WarehouseTargets') navigateWh('warehouse_settings');
    else if (target === 'Orders' || target === 'OrderDetail' || target === 'Operations') {
      // Intentional no-op: only the single-warehouse Snapshot and the task queue
      // emit these, and this shell opens HomeFlow on Quick Actions / Stock &
      // Transfer only (neither navigates to them). Wire them here if that changes.
    }
  };
  /** Warehouse activity sub-views (shared storage-ops, W4 part B), all warehouses. */
  const renderActivityFlow = (params: StorageRouteParams) => (
    <StorageFlow
      scope={MAIN_WAREHOUSE_SCOPE}
      can={can}
      initialScreen="Activity"
      initialParams={params}
      onBack={goBackWh}
      onOpenModule={openMainModule}
      onExportActivity={() => Alert.alert('Export Successful', 'Operational history log has been exported to CSV.')}
    />
  );

  const renderNotificationsFlow = (initialScreen: NotificationsRoute) => (
    <NotificationsFlow
      scope={MAIN_WAREHOUSE_SCOPE}
      can={can}
      initialScreen={initialScreen}
      notifications={whNotifications}
      onMarkAsRead={(id) => setWhNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))}
      onMarkAllAsRead={() => setWhNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))}
      onClearAll={() => setWhNotifications([])}
      onBack={goBackWh}
      onOpenTarget={(target) => {
        if (target === 'ReviewReceiving' || target === 'Receiving') openTab('Receiving');
        else if (target === 'Stock') navigateWh('low_stock_alerts');
        else if (target === 'Orders') navigateWh('customer_orders');
        else if (target === 'Wallet') openTab('More', 'wallet');
        else openTab('More', 'returns');
      }}
      onOpenAlertRecord={(alert) => {
        if (alert.record === 'LowStock') navigateWh('low_stock_alerts');
        else if (alert.record === 'Transfer') navigateWh('inter_warehouse_transfer');
        else if (alert.record === 'GoodsReceipt') openTab('Receiving');
        else if (alert.record === 'ExpenseRecord') openTab('More', 'finance');
      }}
    />
  );

  const renderConsolidatedStockScreen = () => (
    <View style={styles.consolidatedContainer}>
      <SafeAreaView style={styles.consolidatedHeaderSafeArea}>
        <View style={styles.consolidatedHeader}>
          <View style={styles.consolidatedHeaderLeft}>
            <TouchableOpacity
              style={styles.consolidatedBackBtn}
              onPress={goBackWh}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel="Back"
            >
              <BackArrowIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <View>
              <Text style={styles.consolidatedHeaderTitle}>Consolidated Stock</Text>
              <Text style={styles.consolidatedHeaderSubtitle}>Same product across all four warehouses</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.consolidatedFilterBtn} activeOpacity={0.7}>
            <SlidersIcon size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.consolidatedBody}
        contentContainerStyle={styles.consolidatedBodyContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.consolidatedTableCard}>
          {/* Table Header */}
          <View style={styles.consolidatedTableHeader}>
            <Text style={[styles.consolidatedColHeader, { flex: 1.4 }]}>PRODUCT</Text>
            <Text style={[styles.consolidatedColHeader, { flex: 1, textAlign: 'center' }]}>OOTY/COO</Text>
            <Text style={[styles.consolidatedColHeader, { flex: 1, textAlign: 'center' }]}>KOT/GUD</Text>
            <Text style={[styles.consolidatedColHeader, { flex: 1, textAlign: 'right' }]}>TOTAL</Text>
          </View>

          {/* Table Data Row */}
          <TouchableOpacity
            style={styles.consolidatedTableRow}
            onPress={() => navigateWh('consolidated_stock_detail')}
            activeOpacity={0.7}
          >
            <Text style={[styles.consolidatedProductName, { flex: 1.4 }]}>Tomato G1</Text>
            <Text style={[styles.consolidatedCellText, { flex: 1, textAlign: 'center' }]}>120/80</Text>
            <Text style={[styles.consolidatedCellText, { flex: 1, textAlign: 'center' }]}>50/40</Text>
            <Text style={[styles.consolidatedTotalText, { flex: 1, textAlign: 'right' }]}>290 KG</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  const renderConsolidatedStockDetailScreen = () => (
    <View style={styles.consolidatedContainer}>
      <SafeAreaView style={styles.consolidatedHeaderSafeArea}>
        <View style={styles.consolidatedHeader}>
          <View style={styles.consolidatedHeaderLeft}>
            <TouchableOpacity
              style={styles.consolidatedBackBtn}
              onPress={goBackWh}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel="Back"
            >
              <BackArrowIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <View>
              <Text style={styles.consolidatedHeaderTitle}>Consolidated Detail</Text>
              <Text style={styles.consolidatedHeaderSubtitle}>Same product across all four warehouses</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.consolidatedFilterBtn} activeOpacity={0.7}>
            <SlidersIcon size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.consolidatedBody}
        contentContainerStyle={styles.consolidatedBodyContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.consolidatedDetailSectionTitle}>
          Consolidated Stock Detail — Tomato Grade 1
        </Text>

        {/* 2 columns x 3 rows grid of white cards */}
        <View style={styles.consolidatedGrid}>
          {/* Row 1 */}
          <View style={styles.consolidatedGridRow}>
            <TouchableOpacity style={styles.consolidatedActionCard} activeOpacity={0.7}>
              <DistributionBarChartIcon size={26} color="#F0562A" />
              <Text style={styles.consolidatedActionCardLabel}>Distribution</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.consolidatedActionCard} activeOpacity={0.7}>
              <AvailabilityBoxIcon size={26} color="#F0562A" />
              <Text style={styles.consolidatedActionCardLabel}>Availability</Text>
            </TouchableOpacity>
          </View>

          {/* Row 2 */}
          <View style={styles.consolidatedGridRow}>
            <TouchableOpacity style={styles.consolidatedActionCard} activeOpacity={0.7}>
              <ComparisonScaleIcon size={26} color="#F0562A" />
              <Text style={styles.consolidatedActionCardLabel}>Comparison</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.consolidatedActionCard} activeOpacity={0.7}>
              <ProductDetailFruitIcon size={26} color="#F0562A" />
              <Text style={styles.consolidatedActionCardLabel}>Product Detail</Text>
            </TouchableOpacity>
          </View>

          {/* Row 3 */}
          <View style={styles.consolidatedGridRow}>
            <TouchableOpacity
              style={styles.consolidatedActionCard}
              onPress={() => navigateWh('stock_ledger')}
              activeOpacity={0.7}
            >
              <ActionBatchesIcon size={26} color="#F0562A" />
              <Text style={styles.consolidatedActionCardLabel}>View Batches</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.consolidatedActionCard}
              onPress={() => navigateWh('stock_ledger')}
              activeOpacity={0.7}
            >
              <ActionLedgerIcon size={26} color="#F0562A" />
              <Text style={styles.consolidatedActionCardLabel}>View Ledger</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  const renderPendingActionsScreen = () => (
    <View style={styles.consolidatedContainer}>
      <SafeAreaView style={styles.consolidatedHeaderSafeArea}>
        <View style={styles.consolidatedHeader}>
          <View style={styles.consolidatedHeaderLeft}>
            <TouchableOpacity
              style={styles.consolidatedBackBtn}
              onPress={goBackWh}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel="Back"
            >
              <BackArrowIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.consolidatedHeaderTitle}>Pending Actions</Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.consolidatedBody}
        contentContainerStyle={styles.consolidatedBodyContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pendingActionsSectionTitle}>Pending Actions</Text>
        <View style={styles.pendingActionsCard}>
          <TouchableOpacity
            style={styles.pendingActionsRow}
            onPress={() => navigateWh('low_stock_alerts')}
            activeOpacity={0.7}
          >
            <Text style={styles.pendingActionsRowLabel}>Low Stock Alerts</Text>
            <Text style={styles.pendingActionsRowValRed}>5</Text>
          </TouchableOpacity>
          <View style={styles.pendingActionsDivider} />
          <TouchableOpacity
            style={styles.pendingActionsRow}
            onPress={() => navigateWh('stock_adjustment_approval')}
            activeOpacity={0.7}
          >
            <Text style={styles.pendingActionsRowLabel}>Adjustments Awaiting Approval</Text>
            <Text style={styles.pendingActionsRowVal}>2</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      <View style={{ flex: 1 }}>
        {/* ─── Main Dashboard View (Module 1 - Main Dashboard) ─── */}
        {/* FINAL_LIST 20: the multi-warehouse Home needs warehouse.all.view (MAIN all, SUB none);
            without it (or until /auth/me resolves: makeCan fails closed) a note renders instead. */}
        {activeTab === 'Home' && whSubView === 'overview' && !canAllView && (
          <View style={styles.scroll}>
            <EmptyState
              title="Multi-warehouse view not available"
              subtitle="The Main Warehouse dashboard needs warehouse.all.view."
            />
          </View>
        )}
        {activeTab === 'Home' && whSubView === 'overview' && canAllView && (
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

                {/* Header Actions: Notification Bell + Profile Button */}
                <View style={styles.headerActions}>
                  <TouchableOpacity
                    style={styles.headerIconBtn}
                    onPress={() => {
                      navigateWh('warehouse_notifications');
                    }}
                    activeOpacity={0.8}
                  >
                    <BellOutlineIcon size={19} color="#FFFFFF" />
                    {unreadNotifCount > 0 && (
                      <View style={styles.notificationBadge}>
                        <Text style={styles.notificationBadgeText}>{unreadNotifCount > 9 ? '9+' : unreadNotifCount}</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.headerIconBtn}
                    onPress={() => {
                      navigateWh('profile');
                    }}
                    activeOpacity={0.8}
                  >
                    <ProfileHeaderIcon size={19} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
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
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiLabel}>TOTAL STOCK</Text>
                  <Text style={styles.kpiValue}>12,840</Text>
                  <Text style={styles.kpiSub}>KG</Text>
                </View>

                {/* Incoming Goods */}
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiLabel}>INCOMING GOODS</Text>
                  <Text style={styles.kpiValue}>1,240</Text>
                  <Text style={styles.kpiSub}>KG today</Text>
                </View>

                {/* Pending Transfers */}
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiLabel}>PENDING TRANSFERS</Text>
                  <Text style={styles.kpiValue}>5</Text>
                  <Text style={styles.kpiSub}>transfers</Text>
                </View>

                {/* Today's Orders */}
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiLabel}>TODAY'S ORDERS</Text>
                  <Text style={styles.kpiValue}>312</Text>
                  <Text style={styles.kpiSub}>orders</Text>
                </View>

                {/* Sales */}
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiLabel}>SALES</Text>
                  <Text style={styles.kpiValue}>₹1,45,100</Text>
                  <Text style={styles.kpiSub}>today</Text>
                </View>

                {/* Open Issues */}
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiLabel}>OPEN ISSUES</Text>
                  <Text style={styles.kpiValue}>7</Text>
                  <Text style={styles.kpiSub}>issues</Text>
                </View>
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
              <View style={styles.whProgressCard}>
                <View style={styles.whProgressTopRow}>
                  <Text style={styles.whProgressTitle}>Ooty</Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: '75%', backgroundColor: PALETTE.goldProgress }]} />
                </View>
              </View>

              {/* Coonoor Progress Card */}
              <View style={styles.whProgressCard}>
                <View style={styles.whProgressTopRow}>
                  <Text style={styles.whProgressTitle}>Coonoor</Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: '58%', backgroundColor: PALETTE.greenProgress }]} />
                </View>
              </View>

              {/* ─── 3. Today's Operations ─── */}
              <Text style={styles.sectionHeading}>Today's Operations</Text>
              <View style={styles.operationsCard}>
                {/* Incoming Goods */}
                <TouchableOpacity
                  style={styles.operationsSection}
                  onPress={() => {
                    setActiveTab('Receiving');
                    setReceivingSubView('dashboard');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewAllLink}>View All →</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.operationsCard}>
                <Text style={styles.operationsText}>Receiving · Orders · Quality · Dispatch</Text>
              </View>

              <View style={styles.operationsDivider} />

              {/* Quality Issues */}
              <TouchableOpacity
                style={styles.operationsSection}
                onPress={() => navigateWh('operational_issues')}
                activeOpacity={0.7}
              >
                <Text style={styles.viewAllLink}>Open Hub →</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.whHubPromoCard}>
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
            </View>

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
            <View style={styles.alertCard}>
              <View style={styles.alertAccentBar} />
              <View style={styles.alertContentRow}>
                <WarningTriangleIcon size={24} color={PALETTE.red} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.alertTitle}>Coonoor stock below target</Text>
                  <Text style={styles.alertSub}>Warehouse exceptions, escalations and transfer issues</Text>
                </View>
              </View>
            </View>

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
              <View style={styles.activityItemRow}>
                <View style={styles.activityIconBox}>
                  <TruckIcon size={18} color={PALETTE.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.activityTitle}>Transfer TRF-00284 in transit</Text>
                  <Text style={styles.activitySub}>Coonoor → Ooty</Text>
                </View>
                <Text style={styles.activityTime}>10:20 AM</Text>
              </View>

              <View style={styles.activityDivider} />

              {/* Activity 2 */}
              <View style={styles.activityItemRow}>
                <View style={styles.activityIconBox}>
                  <InboxReceiveIcon size={18} color={PALETTE.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.activityTitle}>Goods received</Text>
                  <Text style={styles.activitySub}>Kotagiri warehouse</Text>
                </View>
                <Text style={styles.activityTime}>09:45 AM</Text>
              </View>
            </View>

            {/* ─── 6. Quick Actions ─── */}
            <Text style={styles.sectionHeading}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              {/* 1. Stock Overview */}
              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => {
                  navigateWh('stock_and_transfer');
                }}
                activeOpacity={0.8}
              >
                <StockBoxIcon size={26} color={PALETTE.primary} />
                <Text style={styles.quickActionLabel}>Stock Overview</Text>
              </TouchableOpacity>

              {/* 2. Manage Warehouses */}
              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => {
                  navigateWh('manage_warehouses');
                }}
                activeOpacity={0.8}
              >
                <BuildingWarehouseIcon size={26} color={PALETTE.primary} />
                <Text style={styles.quickActionLabel}>Manage Warehouses</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 16 }} />
          </View>
          </ScrollView>
        )}


      {/* ─── Receiving Tab ─── */}
      {activeTab === 'Receiving' && (
        receivingSubView === 'transfer_receiving' || receivingSubView === 'transfer_receiving_inspection' ? (
          // Shared transfers flow (W4): arrivals for all warehouses; the
          // inspection step opens inside the flow for the tapped transfer
          // (Start Inspection / Complete need transfer.inter_warehouse.receive).
          <TransfersFlow
            scope={MAIN_WAREHOUSE_SCOPE}
            can={can}
            initialScreen="TransferReceiving"
            onBack={() => setReceivingSubView('dashboard')}
          />
        ) : (
          // Shared receiving flow (W4): dashboard, incoming shipments, search &
          // filters, shipment detail, the wizard, storage assignment, receiving
          // history (+ detail) and quality issues, all warehouses. Every old
          // sub-view key opens the matching route; the flow owns the stack.
          <ReceivingFlow
            key={receivingSubView}
            scope={MAIN_WAREHOUSE_SCOPE}
            can={can}
            initialScreen={receivingRouteFor(receivingSubView).screen}
            initialParams={receivingRouteFor(receivingSubView).params}
            receiverName={user?.fullName}
            finishTo="History"
            onBack={() => {
              if (receivingSubView !== 'dashboard') {
                setReceivingSubView('dashboard');
              } else {
                setActiveTab('Home');
                setWhSubView('overview');
              }
            }}
            onTabChange={handleMoreTabChange}
            onOpenTransferReceiving={() => setReceivingSubView('transfer_receiving')}
            onOpenOperationalIssues={() => {
              setActiveTab('Home');
              navigateWh('operational_issues');
            }}
            onOpenTimeline={() => {
              setActiveTab('Home');
              navigateWh('activity_timeline_ops');
            }}
          />
        )
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
            {/* 1. 8 Stat Cards (2 columns x 4 rows) */}
            <View style={styles.invStatsGrid}>
              {/* Row 1 Left: TOTAL STOCK */}
              <View style={styles.invStatCard}>
                <Text style={styles.invStatLabel}>TOTAL STOCK</Text>
                <Text style={styles.invStatValue}>12,840 KG</Text>
                <Text style={styles.invStatSub}>KG</Text>
              </View>

              {/* Row 1 Right: AVAILABLE STOCK */}
              <View style={styles.invStatCard}>
                <Text style={styles.invStatLabel}>AVAILABLE STOCK</Text>
                <Text style={styles.invStatValue}>9,240 KG</Text>
                <Text style={styles.invStatSub}>KG</Text>
              </View>

              {/* Row 2 Left: ALLOCATED */}
              <View style={styles.invStatCard}>
                <Text style={styles.invStatLabel}>ALLOCATED</Text>
                <Text style={styles.invStatValue}>2,100 KG</Text>
                <Text style={styles.invStatSub}>KG</Text>
              </View>

              {/* Row 2 Right: RESERVED */}
              <View style={styles.invStatCard}>
                <Text style={styles.invStatLabel}>RESERVED</Text>
                <Text style={styles.invStatValue}>1,500 KG</Text>
                <Text style={styles.invStatSub}>KG</Text>
              </View>

              {/* Row 3 Left: LOW STOCK */}
              <View style={styles.invStatCard}>
                <Text style={styles.invStatLabel}>LOW STOCK</Text>
                <Text style={styles.invStatValue}>14</Text>
                <Text style={styles.invStatSub}>products</Text>
              </View>

              {/* Row 3 Right: PENDING VERIFICATION */}
              <View style={styles.invStatCard}>
                <Text style={styles.invStatLabel}>PENDING VERIFICATION</Text>
                <Text style={styles.invStatValue}>6</Text>
                <Text style={styles.invStatSub}>items</Text>
              </View>

              {/* Row 4 Left: VARIANCE DETECTED */}
              <View style={styles.invStatCard}>
                <Text style={styles.invStatLabel}>VARIANCE DETECTED</Text>
                <Text style={styles.invStatValue}>2</Text>
                <Text style={styles.invStatSub}>items</Text>
              </View>

              {/* Row 4 Right: PENDING ADJUSTMENTS */}
              <View style={styles.invStatCard}>
                <Text style={styles.invStatLabel}>PENDING ADJUSTMENTS</Text>
                <Text style={styles.invStatValue}>3</Text>
                <Text style={styles.invStatSub}>requests</Text>
              </View>
            </View>


            {/* 3. Warehouse Overview */}
            <Text style={styles.invSectionTitle}>Warehouse Overview</Text>
            <View style={styles.invCardList}>
              <View style={styles.invRowItem}>
                <Text style={styles.invRowName}>Ooty</Text>
                <Text style={styles.invRowVal}>3,420 KG</Text>
              </View>
              <View style={styles.invRowDivider} />
              <View style={styles.invRowItem}>
                <Text style={styles.invRowName}>Coonoor</Text>
                <Text style={styles.invRowVal}>3,180 KG</Text>
              </View>
              <View style={styles.invRowDivider} />
              <View style={styles.invRowItem}>
                <Text style={styles.invRowName}>Kotagiri</Text>
                <Text style={styles.invRowVal}>2,940 KG</Text>
              </View>
              <View style={styles.invRowDivider} />
              <View style={styles.invRowItem}>
                <Text style={styles.invRowName}>Gudalur Market</Text>
                <Text style={styles.invRowVal}>3,300 KG</Text>
              </View>
            </View>

            {/* 4. Inventory Health (Image 2) */}
            <Text style={[styles.invSectionTitle, { marginTop: 16 }]}>Inventory Health</Text>
            <View style={styles.invHealthCard}>
              <View style={styles.invHealthRow}>
                <View style={styles.invHealthCol}>
                  <Text style={styles.invHealthLabel}>Normal</Text>
                  <Text style={[styles.invHealthVal, { color: '#16A34A' }]}>62 products</Text>
                </View>
                <View style={styles.invHealthCol}>
                  <Text style={styles.invHealthLabel}>Low</Text>
                  <Text style={[styles.invHealthVal, { color: '#D97706' }]}>14 products</Text>
                </View>
              </View>
              <View style={[styles.invHealthRow, { marginTop: 14 }]}>
                <View style={styles.invHealthCol}>
                  <Text style={styles.invHealthLabel}>Critical</Text>
                  <Text style={[styles.invHealthVal, { color: '#EF4444' }]}>3 products</Text>
                </View>
                <View style={styles.invHealthCol}>
                  <Text style={styles.invHealthLabel}>Verification Pending</Text>
                  <Text style={[styles.invHealthVal, { color: '#18181B' }]}>6</Text>
                </View>
              </View>
            </View>

            {/* 5. Recent Stock Movements (Image 2) */}
            <View style={styles.invSectionHeaderRow}>
              <Text style={styles.invSectionTitle}>Recent Stock Movements</Text>
              <TouchableOpacity onPress={() => navigateWh('stock_ledger')} activeOpacity={0.7}>
                <Text style={styles.invViewAllLink}>View →</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.invMovementCard}>
              <View style={styles.invMovementIconCircle}>
                <MovementUpIcon size={20} color="#F0562A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.invMovementTitle}>MV-000928 · RECEIPT</Text>
                <Text style={styles.invMovementSubtitle}>Ooty · Tomato · BT-000128</Text>
              </View>
              <Text style={styles.invMovementAmount}>+100 KG</Text>
            </View>

            {/* 6. Pending Actions (Image 2) */}
            <View style={styles.invSectionHeaderRow}>
              <Text style={styles.invSectionTitle}>Pending Actions</Text>
              <TouchableOpacity
                onPress={() => navigateWh('pending_actions')}
                activeOpacity={0.7}
                hitSlop={{ top: 16, bottom: 16, left: 24, right: 24 }}
                accessibilityLabel="View Pending Actions"
              >
                <Text style={styles.invViewAllLink}>View →</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.invCardList}>
              <View style={styles.invRowItem}>
                <Text style={styles.invRowName}>Verification</Text>
                <Text style={styles.invRowVal}>6</Text>
              </View>
              <View style={styles.invRowDivider} />
              <View style={styles.invRowItem}>
                <Text style={styles.invRowName}>Adjustment</Text>
                <Text style={styles.invRowVal}>3</Text>
              </View>
              <View style={styles.invRowDivider} />
              <View style={styles.invRowItem}>
                <Text style={styles.invRowName}>Transfer Receiving</Text>
                <Text style={styles.invRowVal}>2</Text>
              </View>
              <View style={styles.invRowDivider} />
              <View style={styles.invRowItem}>
                <Text style={styles.invRowName}>Stock Exception</Text>
                <Text style={styles.invRowVal}>1</Text>
              </View>
            </View>

            {/* 7. Quick Actions (Image 2 & Image 3) */}
            <Text style={[styles.invSectionTitle, { marginTop: 16 }]}>Quick Actions</Text>
            <View style={styles.invQuickActionsGrid}>
              {/* Row 1 */}
              <View style={styles.invQuickActionsRow}>
                <TouchableOpacity
                  style={styles.invQuickActionCard}
                  onPress={() => navigateWh('consolidated_stock')}
                  activeOpacity={0.7}
                >
                  <ConsolidatedLayersIcon size={28} color="#F0562A" />
                  <Text style={styles.invQuickActionLabel}>Consolidated Stock</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.invQuickActionCard}
                  onPress={() => navigateWh('warehouse_stock')}
                  activeOpacity={0.7}
                >
                  <BuildingWarehouseIcon size={28} color="#F0562A" />
                  <Text style={styles.invQuickActionLabel}>Warehouse Stock</Text>
                </TouchableOpacity>
              </View>

              {/* Row 2 */}
              <View style={styles.invQuickActionsRow}>
                <TouchableOpacity
                  style={styles.invQuickActionCard}
                  onPress={() => navigateWh('verify_stock')}
                  activeOpacity={0.7}
                >
                  <StockVerificationIcon size={28} color="#F0562A" />
                  <Text style={styles.invQuickActionLabel}>Stock Verification</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.invQuickActionCard}
                  onPress={() => navigateWh('stock_allocation')}
                  activeOpacity={0.7}
                >
                  <AllocationPieIcon size={28} color="#F0562A" />
                  <Text style={styles.invQuickActionLabel}>Allocation</Text>
                </TouchableOpacity>
              </View>

              {/* Row 3 */}
              <View style={styles.invQuickActionsRow}>
                <TouchableOpacity
                  style={styles.invQuickActionCard}
                  onPress={() => navigateWh('low_stock_alerts')}
                  activeOpacity={0.7}
                >
                  <LowStockZigzagIcon size={28} color="#F0562A" />
                  <Text style={styles.invQuickActionLabel}>Low Stock</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.invQuickActionCard}
                  onPress={() => navigateWh('inter_warehouse_transfer')}
                  activeOpacity={0.7}
                >
                  <HorizontalTransferIcon size={28} color="#F0562A" />
                  <Text style={styles.invQuickActionLabel}>Create Transfer</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ height: 24 }} />
          </View>
        </ScrollView>
      )}

      {/* ─── More Tab ─── */}
      {activeTab === 'More' && whSubView === 'overview' && moreSubScreen !== null && (
        moreSubScreen === 'wallet' ? (
          <WalletFlow
            scope={MAIN_WAREHOUSE_SCOPE}
            can={can}
            onBack={() => setMoreSubScreen(null)}
            onTabChange={handleMoreTabChange}
            onNavigateToNotifications={() => {
              setMoreSubScreen(null);
              navigateWh('warehouse_notifications');
            }}
          />
        ) : moreSubScreen === 'finance' ? (
          // Shared finance flow (W4); MAIN_WAREHOUSE_SCOPE shows all four warehouses.
          <FinanceFlow
            scope={MAIN_WAREHOUSE_SCOPE}
            can={can}
            onBack={() => setMoreSubScreen(null)}
            onTabChange={handleMoreTabChange}
            onNavigateToNotifications={() => {
              setMoreSubScreen(null);
              navigateWh('warehouse_notifications');
            }}
            onOpenWallet={() => setMoreSubScreen('wallet')}
            onNavigateToCustomerOrders={() => {
              setMoreSubScreen(null);
              navigateWh('customer_orders');
            }}
            onNavigateToInvoiceList={() => {
              setMoreSubScreen(null);
              navigateWh('billing_invoices');
            }}
          />
        ) : moreSubScreen === 'reports' ? (
          // Shared reports hub (W4); MAIN_WAREHOUSE_SCOPE shows the All-warehouses selector.
          // MAIN holds report.export.file as `view` only, so Generate/Download stay off.
          <ReportsScreen
            scope={MAIN_WAREHOUSE_SCOPE}
            can={can}
            canExport={false}
            onBack={() => setMoreSubScreen(null)}
            onNavigateToNotifications={() => {
              setMoreSubScreen(null);
              navigateWh('warehouse_notifications');
            }}
          />
        ) : moreSubScreen === 'returns' ? (
          // Shared RMA flow (W4); MAIN_WAREHOUSE_SCOPE shows the all-warehouses selector.
          <ReturnsFlow
            scope={MAIN_WAREHOUSE_SCOPE}
            can={can}
            onBack={() => setMoreSubScreen(null)}
            onTabChange={handleMoreTabChange}
          />
        ) : moreSubScreen === 'staff' ? (
          // Shared staff & attendance flow (W4, M14) replaces the nested
          // MainWarehouseStaff* / MainWarehouseAttendance screens. The roster needs
          // warehouse.staff.list_view (MAIN all); MAIN_WAREHOUSE_SCOPE shows the selector.
          <StaffFlow
            scope={MAIN_WAREHOUSE_SCOPE}
            can={can}
            initialScreen="Staff"
            onBack={() => setMoreSubScreen(null)}
            onTabChange={handleMoreTabChange}
          />
        ) : moreSubScreen === 'settings' ? (
          // Shared account hub (W4): Profile, Notification Settings, Security,
          // Change Password, Session & Security, Help & Support, About, Logout.
          <ProfileFlow
            scope={MAIN_WAREHOUSE_SCOPE}
            can={can}
            initialScreen="Settings"
            onBack={() => setMoreSubScreen(null)}
            onLogout={onSignOut}
            onTabChange={handleMoreTabChange}
          />
        ) : (
          // The old Warehouse Management hub (MainWarehouseAdminScreen) was absorbed into the
          // shared Warehouse Overview (W4 warehouse-admin); its Add Warehouse action was dropped (BR-23).
          <WarehouseAdminFlow
            scope={MAIN_WAREHOUSE_SCOPE}
            can={can}
            initialScreen="WarehouseOverview"
            onBack={() => setMoreSubScreen(null)}
            onNavigateComparison={() => {
              setMoreSubScreen(null);
              navigateWh('stock_and_transfer');
            }}
          />
        )
      )}
      {activeTab === 'More' && whSubView === 'overview' && moreSubScreen === null && (
        <MoreScreen
          scope={MAIN_WAREHOUSE_SCOPE}
          can={can}
          onBack={() => setActiveTab('Home')}
          onNavigateToDashboard={() => {
            setActiveTab('Home');
            setWhSubView('overview');
            setWhHistory([]);
          }}
          onLogout={onSignOut}
          onTabChange={handleMoreTabChange}
          // The admin hub lists every warehouse (FINAL_LIST: warehouse.all.view).
          onProfileCardPress={can('warehouse.all.view') ? () => setMoreSubScreen('admin') : undefined}
          onNavigateToWallet={() => setMoreSubScreen('wallet')}
          onNavigateToReturns={() => setMoreSubScreen('returns')}
          onNavigateToFinance={() => setMoreSubScreen('finance')}
          onNavigateToReports={() => setMoreSubScreen('reports')}
          onNavigateToStaff={() => setMoreSubScreen('staff')}
          onNavigateToOrders={() => navigateWh('customer_orders')}
          onNavigateToSales={() => navigateWh('sales')}
          onNavigateToCustomers={() => navigateWh('customers_list')}
          onNavigateToBilling={() => navigateWh('billing_invoices')}
          onNavigateToWarehouseOperations={() => navigateWh('warehouse_operations')}
          onNavigateToProfile={() => navigateWh('profile')}
          onNavigateToNotifications={() => navigateWh('warehouse_notifications')}
          // The More row is the account hub ("Manage account and application settings",
          // FINAL_LIST #84); warehouse settings stay reachable from Warehouse Overview.
          onNavigateToSettings={() => setMoreSubScreen('settings')}
        />
      )}

      {/* ─── Sub Views for Interactive Navigation (shared across all tabs) ─── */}
      {whSubView !== 'overview' && (
        whSubView === 'profile' ? (
          // The admin's own profile is the shared UserProfileScreen (W4, absorbs
          // MainWarehouseProfileScreen); Main sees the all-warehouses account.
          <ProfileFlow
            scope={MAIN_WAREHOUSE_SCOPE}
            can={can}
            initialScreen="UserProfile"
            onBack={goBackWh}
            onLogout={onSignOut}
            onTabChange={handleMoreTabChange}
          />
        ) : whSubView === 'dashboard_operations' ||
          whSubView === 'todays_operations' ||
          whSubView === 'todays_operations_overview' ? (
          // Today's Operations (Monitoring + Overview, M4-S02 / M1-S02) folded into the
          // shared Warehouse Activity as its Today preset: the six-tile strip and the
          // monitoring card show for the all-warehouses scope.
          renderActivityFlow(ACTIVITY_TODAY_PARAMS)
        ) : whSubView === 'warehouse_operations' ? (
          // Shared storage-ops hub (W4, M4-S01): all warehouses with the shared
          // selector (replaces the shell's filter modal here); per-warehouse cards,
          // Open Issues / Operations History tiles need warehouse.all.view. Materials,
          // capacity, issues and activity open inside the flow.
          <StorageFlow
            scope={MAIN_WAREHOUSE_SCOPE}
            can={can}
            initialScreen="Operations"
            onBack={goBackWh}
            onOpenModule={openMainModule}
            onExportActivity={() => Alert.alert('Export Successful', 'Operational history log has been exported to CSV.')}
            onOpenNotifications={() => navigateWh('warehouse_notifications')}
            onOpenWarehouseOverview={() => navigateWh('warehouse_overview')}
            onSelectWarehouse={(whName) => {
              setSelectedWHName(whName);
              navigateWh('warehouse_city_detail');
            }}
            onManageCapacity={() => navigateWh('warehouse_settings')}
          />
        ) : whSubView === 'warehouse_overview' ? (
          renderWarehouseOverviewScreen()
        ) : whSubView === 'warehouse_comparison' ? (
          renderWarehouseComparisonScreen()
        ) : whSubView === 'manage_warehouses' ? (
          renderManageWarehousesScreen()
        ) : WAREHOUSE_ADMIN_ENTRY[whSubView] !== undefined ? (
          // Main warehouse-admin flow (W4): City Detail -> Settings / Capacity / Documents;
          // Manage SWAs. Guarded on warehouse.all.view / admin.sub_wh_admin.create.
          <WarehouseAdminFlow
            scope={MAIN_WAREHOUSE_SCOPE}
            can={can}
            initialScreen={WAREHOUSE_ADMIN_ENTRY[whSubView]}
            initialParams={whSubView === 'warehouse_city_detail' ? { warehouseId: warehouseIdForName(selectedWHName) } : undefined}
            onBack={goBackWh}
            onNavigateComparison={() => navigateWh('warehouse_comparison')}
            onViewOperationsHistory={() => navigateWh('operations_history')}
            onViewStaffAttendance={() => navigateWh('staff_attendance')}
          />
        ) : whSubView === 'warehouse_notifications' ? (
          renderNotificationsFlow('Notifications')
        ) : whSubView === 'storage_locations' ? (
          // StorageLocationsScreen was absorbed into the shared StorageInfoScreen
          // (W4 part B): Main sees all four warehouses plus the storage hierarchy.
          <ProfileFlow
            scope={MAIN_WAREHOUSE_SCOPE}
            can={can}
            initialScreen="StorageInfo"
            onBack={() => navigateWh('warehouse_operations')}
            onSelectStorageLocation={(locId) => {
              setSelectedLocationId(locId);
              navigateWh('location_detail');
            }}
          />
        ) : whSubView === 'location_detail' ? (
          // Shared storage-ops location detail (W4, M4-S04); Main's Location Information
          // card and occupancy bar were ported. View Stock needs inventory.batch.view.
          <StorageFlow
            scope={MAIN_WAREHOUSE_SCOPE}
            can={can}
            initialScreen="StorageLocationDetail"
            initialParams={{ locationId: selectedLocationId }}
            onBack={() => navigateWh('storage_locations')}
            onViewStock={() => {
              setActiveTab('Inventory');
              setWhSubView('overview');
            }}
          />
        ) : whSubView === 'material_handling' ? (
          // Shared storage-ops flow (W4, M4 part A): Main's Receive / Issue / History
          // actions were ported into the shared screens (inventory.material_handling.manage).
          <StorageFlow
            scope={MAIN_WAREHOUSE_SCOPE}
            can={can}
            initialScreen="MaterialHandling"
            onBack={() => navigateWh('warehouse_operations')}
            onViewActivity={() => navigateWh('warehouse_activity')}
          />
        ) : whSubView === 'material_detail' ? (
          <StorageFlow
            scope={MAIN_WAREHOUSE_SCOPE}
            can={can}
            initialScreen="MaterialDetail"
            initialParams={{ materialId: selectedMaterialId }}
            onBack={goBackWh}
            onViewActivity={() => navigateWh('warehouse_activity')}
          />
        ) : whSubView === 'warehouse_capacity' ? (
          renderWarehouseCapacityScreen()
        ) : whSubView === 'warehouse_activity' || whSubView === 'operations_history' || whSubView === 'activity_timeline_ops' ? (
          // Warehouse Activity, Operations History and Activity Timeline (M4-S08) are the
          // shared activity log (All preset): search, warehouse selector, rows with
          // warehouse + operator, detail, and CSV export with report.export.file.
          renderActivityFlow(ACTIVITY_ALL_PARAMS)
        ) : whSubView === 'operational_issues' || whSubView === 'report_operational_issue' ? (
          // Shared storage-ops issues (W4, M4-S09 / M4-S09R): Main sees every
          // warehouse's issues with the selector and opens their detail. The
          // report form (operational mode, with Main's warehouse / rack /
          // severity fields) needs support.ticket.create_own, which MAIN does
          // not hold today, so the Report button is replaced by a note.
          <StorageFlow
            scope={MAIN_WAREHOUSE_SCOPE}
            can={can}
            initialScreen={whSubView === 'report_operational_issue' ? 'ReportIssue' : 'OperationalIssues'}
            initialParams={whSubView === 'report_operational_issue' ? REPORT_OPERATIONAL_PARAMS : undefined}
            onBack={() => navigateWh('warehouse_operations')}
          />
        ) : whSubView === 'staff_attendance' ? (
          // The dropped Staff & Attendance hub was Main's only attendance entry
          // (Manage SWAs card, operations hub); it opens the shared Attendance
          // overview now (W4, M14). Attendance has no rbac code (ungated).
          <StaffFlow
            scope={MAIN_WAREHOUSE_SCOPE}
            can={can}
            initialScreen="Attendance"
            initialParams={ATTENDANCE_ALL_PARAMS}
            onBack={goBackWh}
          />
        ) : whSubView === 'needs_attention' ? (
          // Sales hub Needs Attention (W4s-4): the shared queue, all four warehouses.
          <HomeFlow
            scope={MAIN_WAREHOUSE_SCOPE}
            can={can}
            initialScreen="NeedsAttention"
            initialParams={{ category: attentionCategory }}
            onBack={goBackWh}
          />
        ) : whSubView === 'stock_and_transfer' ? (
          renderStockAndTransferScreen()
        ) : whSubView === 'consolidated_stock' ? (
          renderConsolidatedStockScreen()
        ) : whSubView === 'low_stock_surplus' ? (
          renderLowStockSurplusScreen()
        ) : whSubView === 'transfer_tracking' ? (
          renderTransferTrackingScreen()
        ) : whSubView === 'quick_actions_overview' ? (
          <HomeFlow
            scope={MAIN_WAREHOUSE_SCOPE}
            can={can}
            initialScreen="QuickActions"
            onBack={goBackWh}
            onOpenTarget={openHomeTarget}
          />
        ) : whSubView === 'alerts_action_center' ? (
          renderNotificationsFlow('ApprovalAlerts')
        ) : whSubView === 'warehouse_stock' ||
          whSubView === 'stock_ledger' ||
          whSubView === 'stock_allocation' ||
          whSubView === 'verify_stock' ||
          whSubView === 'stock_adjustment_approval' ||
          whSubView === 'low_stock_alerts' ? (
          // The four Main-only inventory screens were folded into the shared
          // inventory area (W4); each old sub-view opens the flow on its survivor.
          <InventoryFlow
            scope={MAIN_WAREHOUSE_SCOPE}
            can={can}
            initialScreen={INVENTORY_ENTRY[whSubView]}
            initialParams={whSubView === 'stock_ledger' ? { warehouseName: selectedWHName } : null}
            onBack={goBackWh}
            onInitiateTransfer={() => navigateWh('inter_warehouse_transfer')}
            warehouseOptions={PROFILE_WAREHOUSES}
            onTabChange={(tab) => {
              setActiveTab(tab);
              setWhSubView('overview');
              setWhHistory([]);
            }}
          />
        ) : TRANSFER_ENTRY[whSubView] !== undefined ? (
          // Shared transfers flow (W4): list -> detail -> receiving -> inspection,
          // list -> initiate. The flow owns the (mock) transfer list; Initiate
          // and Cancel need transfer.inter_warehouse.initiate (MAIN all).
          <TransfersFlow
            scope={MAIN_WAREHOUSE_SCOPE}
            can={can}
            initialScreen={TRANSFER_ENTRY[whSubView]}
            onBack={goBackWh}
          />
        ) : whSubView === 'warehouse_settings' ? (
          // Shared profile-settings WarehouseSettingsScreen (W4 part B), route-guarded
          // on warehouse.capacity.set; opens on the warehouse the overview showed.
          <ProfileFlow
            scope={MAIN_WAREHOUSE_SCOPE}
            can={can}
            initialScreen="WarehouseSettings"
            initialWarehouseId={warehouseIdForName(selectedWHName)}
            onBack={goBackWh}
          />
        ) : whSubView === 'warehouse_performance' ? (
          renderWarehousePerformanceScreen()
        ) : whSubView === 'incoming_goods_ops' ? (
          // Incoming Goods was the receiving summary again: it is the shared
          // receiving dashboard now (W4), opened from the operations hub.
          <ReceivingFlow
            scope={MAIN_WAREHOUSE_SCOPE}
            can={can}
            initialScreen="Dashboard"
            receiverName={user?.fullName}
            finishTo="History"
            onBack={goBackWh}
            onOpenTransferReceiving={() => {
              setActiveTab('Receiving');
              setReceivingSubView('transfer_receiving');
            }}
            onOpenOperationalIssues={() => navigateWh('operational_issues')}
            onOpenTimeline={() => navigateWh('activity_timeline_ops')}
          />
        ) : whSubView === 'order_fulfilment_ops' ? (
          <OrdersFlow
            scope={MAIN_WAREHOUSE_SCOPE}
            can={can}
            onBack={goBackWh}
            onViewIssue={() => navigateWh('operational_issues')}
            onTabChange={(tab) => {
              setActiveTab(tab);
              setWhSubView('overview');
              setWhHistory([]);
            }}
          />
        ) : whSubView === 'quality_issues_ops' ? (
          // Shared receiving Quality Issues (W4, read-only list); issues open the
          // wizard step / shipment inside the flow, damage reports Operational Issues.
          <ReceivingFlow
            scope={MAIN_WAREHOUSE_SCOPE}
            can={can}
            initialScreen="QualityIssues"
            receiverName={user?.fullName}
            finishTo="History"
            onBack={goBackWh}
            onOpenOperationalIssues={() => navigateWh('operational_issues')}
            onOpenTimeline={() => navigateWh('activity_timeline_ops')}
          />
        ) : whSubView === 'customers_list' ? (
          // Shared customer flow (W4); MAIN_WAREHOUSE_SCOPE lists every warehouse's
          // customers with the all-warehouses selector. Wallet, cash top-up (the
          // wallet operations hub), order detail and RMA open inside the flow;
          // New Sale goes to the Main direct-sale flow.
          <CustomersFlow
            scope={MAIN_WAREHOUSE_SCOPE}
            can={can}
            onBack={goBackWh}
            onTabChange={(tab) => {
              setActiveTab(tab);
              setWhSubView('overview');
              setWhHistory([]);
            }}
            onNavigateToNotifications={() => navigateWh('warehouse_notifications')}
            inlineExternalRoutes={MAIN_CUSTOMER_INLINE_ROUTES}
            onOpenExternal={(target) => {
              if (target === 'NewSale') navigateWh('direct_sale_new');
            }}
            renderExternalScreen={(target, p: CustomersRouteParams, nav) => {
              if (target === 'CustomerWallet' || target === 'CashTopUp') {
                // The shared wallet flow opened on this customer's wallet or
                // cash top-up (prefilled; resolves SPEC_GAPS W4h-7 for top-ups).
                return (
                  <WalletFlow
                    scope={MAIN_WAREHOUSE_SCOPE}
                    can={can}
                    initialScreen={target}
                    initialParams={walletParamsForCustomer(p.customer)}
                    onBack={nav.back}
                  />
                );
              }
              if (target === 'OrderDetail') {
                return (
                  <OrdersFlow
                    scope={MAIN_WAREHOUSE_SCOPE}
                    can={can}
                    initialScreen="M5S04"
                    initialParams={{ orderId: p.order?.orderNo ?? p.orderNo, customerName: p.customer?.name }}
                    onBack={nav.back}
                    onViewIssue={() => navigateWh('operational_issues')}
                  />
                );
              }
              if (target === 'RmaDetail') {
                return (
                  <ReturnsFlow scope={MAIN_WAREHOUSE_SCOPE} can={can} initialScreen="ReturnsIssues" onBack={nav.back} />
                );
              }
              return null;
            }}
          />
        ) : whSubView === 'customer_orders' ? (
          <OrdersFlow
            scope={MAIN_WAREHOUSE_SCOPE}
            can={can}
            onBack={goBackWh}
            onViewIssue={() => navigateWh('operational_issues')}
            onTabChange={(tab) => {
              setActiveTab(tab);
              setWhSubView('overview');
              setWhHistory([]);
            }}
          />
        ) : whSubView === 'billing_invoices' ? (
          // Shared billing flow (W4); MAIN_WAREHOUSE_SCOPE shows the all-warehouses selector.
          <BillingFlow
            scope={MAIN_WAREHOUSE_SCOPE}
            can={can}
            onBack={goBackWh}
            onTabChange={(tab) => {
              setActiveTab(tab);
              setWhSubView('overview');
              setWhHistory([]);
            }}
          />
        ) : MAIN_SALES_ENTRY[whSubView] !== undefined ? (
          // Shared direct sales flow (warehouse/sales-direct), all warehouses.
          <SalesFlow
            scope={MAIN_WAREHOUSE_SCOPE}
            can={can}
            initialScreen={MAIN_SALES_ENTRY[whSubView]?.screen}
            initialParams={MAIN_SALES_ENTRY[whSubView]?.params}
            onBack={goBackWh}
            onTabChange={(tab) => {
              setActiveTab(tab);
              setWhSubView('overview');
              setWhHistory([]);
            }}
            onNavigateToNotifications={() => navigateWh('warehouse_notifications')}
            onNavigateToNeedsAttention={(category) => {
              setAttentionCategory(category ?? 'all');
              navigateWh('needs_attention');
            }}
          />
        ) : whSubView === 'consolidated_stock' ? (
          renderConsolidatedStockScreen()
        ) : whSubView === 'consolidated_stock_detail' ? (
          renderConsolidatedStockDetailScreen()
        ) : whSubView === 'pending_actions' ? (
          renderPendingActionsScreen()
        ) : null
      )}
    </View>

      {/* ─── Bottom Navigation Tab Bar (Home, Receiving, Inventory, More) ─── */ }
  {/* Receiving draws its own tab bar (ReceivingFlow dashboard); transfers have none. */ }
  {
    ((activeTab === 'Home' &&
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
        whSubView === 'alert_detail' ||
        whSubView === 'stock_and_transfer' ||
        whSubView === 'consolidated_stock' ||
        whSubView === 'low_stock_surplus' ||
        whSubView === 'transfer_tracking' ||
        whSubView === 'quick_actions_overview')) ||
      (activeTab === 'More' && whSubView !== 'overview') ||
      (activeTab === 'Inventory' && whSubView === 'overview')) && (
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
          <ReceivingTabNavIcon active={false} />
          <Text style={styles.tabLabel}>Receiving</Text>
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
    )
  }

  {/* ─── Warehouse Filter Dropdown Modal ─── */ }
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
    </SafeAreaView >
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
  notificationBellBtn: {
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
    top: 2,
    right: 2,
    backgroundColor: '#DC2626',
    borderRadius: 8,
    minWidth: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#EA580C',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
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
    backgroundColor: PALETTE.trackBg,
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
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 6,
  },
  operationsSection: {
    paddingVertical: 12,
  },
  operationsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 6,
  },
  operationsMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  operationsMetricText: {
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.textSecondary,
  },
  operationsMetricBold: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  operationsMetricRed: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.red,
  },
  operationsDivider: {
    height: 1,
    backgroundColor: PALETTE.divider,
  },
  operationsTimelineSub: {
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.textSecondary,
    lineHeight: 16,
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

  // ─── Inventory Tab (Images 1, 2, 3) ───
  invStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginTop: 10,
  },
  invStatCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  invStatLabel: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '700',
    color: '#71717A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  invStatValue: {
    fontFamily: 'Poppins',
    fontSize: 20,
    fontWeight: '800',
    color: '#18181B',
    marginTop: 4,
    marginBottom: 2,
  },
  invStatSub: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '600',
    color: '#71717A',
  },
  invNoticeBox: {
    backgroundColor: '#FDF4EC',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    marginBottom: 16,
  },
  invNoticeText: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '600',
    color: '#7C2D12',
    lineHeight: 18,
  },
  invSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 10,
  },
  invSectionTitle: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '800',
    color: '#8A4E15',
  },
  invViewAllLink: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '700',
    color: '#F0562A',
  },
  invCardList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  invRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  invRowName: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '700',
    color: '#18181B',
  },
  invRowVal: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '800',
    color: '#18181B',
  },
  invRowDivider: {
    height: 1,
    backgroundColor: '#F0ECE4',
  },
  invHealthCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    padding: 16,
  },
  invHealthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  invHealthCol: {
    flex: 1,
  },
  invHealthLabel: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '700',
    color: '#5C6B62',
  },
  invHealthVal: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 3,
  },
  invMovementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  invMovementIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FDE8E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  invMovementTitle: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '800',
    color: '#18181B',
  },
  invMovementSubtitle: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '500',
    color: '#71717A',
    marginTop: 2,
  },
  invMovementAmount: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '800',
    color: '#15803D',
  },
  invQuickActionsGrid: {
    gap: 10,
    marginTop: 10,
    marginBottom: 20,
  },
  invQuickActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  invQuickActionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    paddingVertical: 20,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  invQuickActionLabel: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '800',
    color: '#18181B',
    marginTop: 10,
    textAlign: 'center',
  },

  // ─── Consolidated Stock Screens (Images 4 & 5) ───
  consolidatedContainer: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  consolidatedHeaderSafeArea: {
    backgroundColor: '#F0562A',
  },
  consolidatedHeader: {
    backgroundColor: '#F0562A',
    paddingTop: Platform.OS === 'android' ? 14 : 10,
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  consolidatedHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  consolidatedBackBtn: {
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  consolidatedHeaderTitle: {
    fontFamily: 'Poppins',
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  consolidatedHeaderSubtitle: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  consolidatedFilterBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  consolidatedBody: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  consolidatedBodyContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  consolidatedTableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    overflow: 'hidden',
  },
  consolidatedTableHeader: {
    backgroundColor: '#F5F2EB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  consolidatedColHeader: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '700',
    color: '#71717A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  consolidatedTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  consolidatedProductName: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '800',
    color: '#18181B',
  },
  consolidatedCellText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '700',
    color: '#18181B',
  },
  consolidatedTotalText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '800',
    color: '#18181B',
  },
  consolidatedDetailSectionTitle: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '800',
    color: '#18181B',
    marginBottom: 14,
  },
  consolidatedGrid: {
    gap: 12,
  },
  consolidatedGridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  consolidatedActionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    paddingVertical: 22,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  consolidatedActionCardLabel: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '700',
    color: '#18181B',
    marginTop: 10,
    textAlign: 'center',
  },
  pendingActionsSectionTitle: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '700',
    color: '#52290D',
    marginTop: 4,
    marginBottom: 12,
  },
  pendingActionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    overflow: 'hidden',
  },
  pendingActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pendingActionsRowLabel: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  pendingActionsRowValRed: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
  pendingActionsRowVal: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  pendingActionsDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
  },
});

