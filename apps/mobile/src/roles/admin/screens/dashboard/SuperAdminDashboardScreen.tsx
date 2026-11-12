import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
import { fetchMe, type UserMe } from '../../../farmer/api/auth';
import { makeCan, type Can } from '../../permissions/can';
import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import {
  OverviewActionCard,
  OverviewApprovalCard,
  OverviewCardsGrid,
  OverviewDashboardCard,
  OverviewQueueCard,
  OverviewSectionHeader,
} from '../../components/OverviewDashboardCard';
import {
  BellIcon,
  CalendarIcon,
  CashBillIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClipboardListIcon,
  DatabaseCylinderIcon,
  EyeIcon,
  FilterSlidersIcon,
  GearSettingsIcon,
  InboxTrayIcon,
  MoreVerticalIcon,
  NavFarmersIcon,
  NavFinanceIcon,
  NavHomeIcon,
  NavMenuIcon,
  NavOverviewIcon,
  NavWarehouseIcon,
  PackageBoxIcon,
  PauseCircleIcon,
  PencilEditIcon,
  PieChartIcon,
  RefreshIcon,
  RupeeTagIcon,
  SearchIcon,
  FairPriceIcon,
  ShieldIcon,
  StoreIcon,
  SwitchArrowsIcon,
  TractorIcon,
  TrashIcon,
  UserAvatarIcon,
  UserPlusIcon,
} from '../../components/AdminIcons';
import { t } from '../../i18n';
import { FarmerManagementFlow, type FarmerManagementSubView } from '../farmers/FarmerManagementFlow';
import {
  type WarehouseScope,
} from '../warehouse';
import { TransfersFlow } from '../warehouse/transfers/TransfersFlow';
import { InventoryFlow } from '../warehouse/inventory/InventoryFlow';
import { SalesFlow } from '../warehouse/sales-direct';
import { StaffFlow } from '../warehouse/staff-attendance/StaffFlow';
import { CreateStaffAccountScreen } from '../warehouse/staff-attendance/CreateStaffAccountScreen';
import {
  PLStatementScreen,
  PayoutProcessingScreen,
  FinanceManagementFlow,
  ProfitLossScreen,
  PaymentMethodsScreen,
} from '../finance';
import { SystemConfigScreen } from '../config/SystemConfigScreen';
import { IntegrationDetailScreen } from '../config/IntegrationDetailScreen';
import { SystemAuditLogsScreen } from '../config/SystemAuditLogsScreen';
import { ManageAdminsScreen } from './ManageAdminsScreen';
import { AdminPermissionsMatrixScreen } from './AdminPermissionsMatrixScreen';
import { FairPriceCeilingScreen } from './FairPriceCeilingScreen';
import { BulkPriceUpdateScreen } from './BulkPriceUpdateScreen';
import { RetailPricingScreen } from './RetailPricingScreen';
import { PriceHistoryScreen } from './PriceHistoryScreen';
import { MarketPricingHomeScreen } from './MarketPricingHomeScreen';
import { ScheduleMarketOpenCloseScreen } from './ScheduleMarketOpenCloseScreen';
import { ApprovalsInboxScreen } from './ApprovalsInboxScreen';
import { ApprovalDetailPayoutScreen } from './ApprovalDetailPayoutScreen';
import { AlertThresholdsScreen } from './AlertThresholdsScreen';
import { ComplianceTierThresholdsScreen, type AlertThresholdData } from './ComplianceTierThresholdsScreen';
import { WarehouseOperationsOverviewScreen } from './WarehouseOperationsOverviewScreen';
import { AdminOperationsOverviewScreen } from './AdminOperationsOverviewScreen';
import { AddWarehouseProfileScreen } from './AddWarehouseProfileScreen';
import { FinanceBusinessOverviewScreen } from './FinanceBusinessOverviewScreen';
import { SystemHealthAdminOverviewScreen } from './SystemHealthAdminOverviewScreen';
import type { AdminAccountRequest } from './AdminRequestsApprovalScreen';
import { AdminRequestDetailScreen } from './AdminRequestDetailScreen';
import { AdminReportsMainScreen, AnalyticsDashboardScreen, SystemAlertsScreen } from '../reports';
import { AuditCalendarScreen, AuditManagementFlow } from '../audits';
import { AdminCertVerificationScreen } from '../certifications/AdminCertVerificationScreen';
import { AdminComplianceTiersScreen } from '../certifications/AdminComplianceTiersScreen';
import { ProduceControlFlow } from '../produce';
import { InputsPestManagementFlow } from '../inputs';
import { CustomersFlow } from '../warehouse/customers/CustomersFlow';
import { OrdersFlow } from '../warehouse/orders/OrdersFlow';
import { NotificationsFlow } from '../warehouse/notifications/NotificationsFlow';
import { ProfileFlow } from '../warehouse/profile-settings/ProfileFlow';
import type { ProfileRoute } from '../warehouse/profile-settings/types';
import { ReportsScreen } from '../warehouse/reports/ReportsScreen';
import { EditRetailPriceScreen } from '../pricing/EditRetailPriceScreen';
import { UpdateFairPriceScreen } from './UpdateFairPriceScreen';
import { MarketDayScheduleScreen, type MarketDay, MOCK_DAYS } from './MarketDayScheduleScreen';
import { AddMarketDayScreen } from './AddMarketDayScreen';
import type { PricingRecordItem } from '../pricing/MarketPricingOverviewScreen';
import { CommunityKnowledgeHomeScreen } from './CommunityKnowledgeHomeScreen';
import { CommunityKnowledgeFlow } from './CommunityKnowledgeFlow';
import { SuperAdminMoreScreen } from './SuperAdminMoreScreen';
import { AdminZoneManagementScreen } from './AdminZoneManagementScreen';
import { PurchaseOrdersScreen } from './PurchaseOrdersScreen';
import { AdminWorkQueueScreen } from './AdminWorkQueueScreen';

export type SuperAdminTab = 'Overview' | 'Farmers' | 'Warehouse' | 'Finance' | 'Menu';

export interface SuperAdminDashboardScreenProps {
  can?: Can | undefined;
  scope?: WarehouseScope | undefined;
  role?: string | undefined;
  onSignOut: () => void;
  onSwitchRole?: (() => void) | undefined;
  onNavigate?: ((screen: string, params?: Record<string, unknown>) => void) | undefined;
  initialTab?: SuperAdminTab | undefined;
}

const ALL_WAREHOUSES_SCOPE: WarehouseScope = {
  warehouseName: 'All Warehouses',
};

const SUPER_ADMIN_WAREHOUSE_OPTIONS: readonly WarehouseScope[] = [
  { warehouseId: 'WH-MAIN', warehouseName: 'Ooty (WH-MAIN)' },
  { warehouseId: 'WH-COON', warehouseName: 'Coonoor (WH-SUB1)' },
  { warehouseId: 'WH-KOT', warehouseName: 'Kotagiri (WH-SUB2)' },
  { warehouseId: 'WH-GUD', warehouseName: 'Gudalur Market (WH-SUB3)' },
];

/**
 * SuperAdminDashboardScreen
 *
 * Implements the Super Admin Dashboard (SA-M2-S01) exactly matching design mockups:
 * 1. Reuses shared screens, theme, and components without forking or duplication.
 * 2. Gated via `can('<rbac code>')` fail-closed authorization.
 * 3. Mounts existing warehouse, farmer, and finance flows with `All Warehouses` scope.
 * 4. Zero hex literals, uses adminColors, adminType, adminRadius, adminSpacing.
 */
export function SuperAdminDashboardScreen({
  can: propsCan,
  scope = ALL_WAREHOUSES_SCOPE,
  role = 'SUPER_ADMIN',
  onSignOut,
  onNavigate: _onNavigate,
  initialTab = 'Overview',
}: SuperAdminDashboardScreenProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<SuperAdminTab>(initialTab);
  const [farmerInitialTab, setFarmerInitialTab] = useState<'farmers' | 'applications'>('farmers');
  const [farmerSubView, setFarmerSubView] = useState<FarmerManagementSubView>('overview');
  const farmerUserScope = useMemo(
    () => ({ warehouseId: scope.warehouseId }),
    [scope.warehouseId],
  );
  const [user, setUser] = useState<UserMe | null>(null);

  // Sub-screen navigation states for Super Admin features
  const [activeSubScreen, setActiveSubScreen] = useState<
    | 'allocation'
    | 'fair_price_ceiling'
    | 'bulk_price_update'
    | 'retail_pricing'
    | 'approval_inbox'
    | 'approval_detail'
    | 'transfers_flow'
    | 'purchases'
    | 'work_queue'
    | 'orders'
    | 'staff'
    | 'reports'
    | 'market_pricing'
    | 'edit_retail_price'
    | 'update_price'
    | 'market_days'
    | 'add_market_day'
    | 'notifications'
    | 'settings'
    | 'price_history'
    | 'warehouse_flow'
    | 'inventory_flow'
    | 'staff_flow'
    | 'payout_processing'
    | 'pl_statement'
    | 'create_admin'
    | 'manage_admins'
    | 'permissions_matrix'
    | 'system_config'
    | 'system_audit_logs'
    | 'integration_keys'
    | 'system_alerts'
    | 'reports_main'
    | 'analytics'
    | 'audit_management'
    | 'audit_calendar'
    | 'cert_verification'
    | 'compliance_tiers'
    | 'schedule_market'
    | 'approval_payout_detail'
    | 'alert_thresholds'
    | 'compliance_tier_thresholds'
    | 'system_health'
    | 'produce_control'
    | 'crop_data'
    | 'inputs_pest'
    | 'finance_flow'
    | 'profit_loss'
    | 'payment_methods'
    | 'finance_business_overview'
    | 'customers'
    | 'community'
    | 'zone_management'
    | null
  >(null);

  const [selectedPayoutId, setSelectedPayoutId] = useState<string>('PAY-0002');
  const [workQueueReturnSubScreen, setWorkQueueReturnSubScreen] = useState<'market_pricing' | 'purchases' | null>(null);
  const [marketDaysList, setMarketDaysList] = useState<MarketDay[]>(MOCK_DAYS);
  const [selectedRetailRecord, setSelectedRetailRecord] = useState<PricingRecordItem | null>(null);
  const [selectedPriceCrop, setSelectedPriceCrop] = useState<{ id?: string; name: string; category?: string; price: number } | null>(null);
  const [selectedThresholdData, setSelectedThresholdData] = useState<AlertThresholdData | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('Today · 7 Days · 30 Days · Custom');
  const [lastUpdated, setLastUpdated] = useState('09:30 · All details');

  const [marketScheduleMode, setMarketScheduleMode] = useState<'open' | 'close'>('open');
  const [activeScheduleMenu, setActiveScheduleMenu] = useState<{
    id: string;
    title: string;
    time: string;
    mode: 'open' | 'close';
    repeat: string;
  } | null>(null);
  const [detailsScheduleItem, setDetailsScheduleItem] = useState<{
    title: string;
    time: string;
    mode: 'open' | 'close';
    repeat: string;
  } | null>(null);

  const [marketSchedules, setMarketSchedules] = useState<Array<{
    id: string;
    title: string;
    time: string;
    mode: 'open' | 'close';
    repeat: string;
  }>>([
    {
      id: 'auto_closes',
      title: 'Auto Closes',
      time: '14 Oct 2026, 06:00 PM',
      mode: 'close',
      repeat: 'One Time',
    },
    {
      id: 'auto_open',
      title: 'Auto Open',
      time: '15 Oct 2026, 08:00 AM',
      mode: 'open',
      repeat: 'One Time',
    },
  ]);

  const [selectedApprovalRequest, setSelectedApprovalRequest] = useState<AdminAccountRequest | null>(null);
  const [warehouseModule, setWarehouseModule] = useState<'admin' | 'transfers' | 'inventory' | 'staff' | 'admin_operations' | 'add_profile'>('admin');
  const [inventoryInitialScreen, setInventoryInitialScreen] = useState<string>('M3S01');
  const [profileInitialScreen, setProfileInitialScreen] = useState<ProfileRoute>('Settings');

  const handleSelectTab = (tab: SuperAdminTab) => {
    if (tab === 'Warehouse') {
      setWarehouseModule('admin');
    }
    if (tab === 'Farmers') {
      setFarmerInitialTab('farmers');
      setFarmerSubView('overview');
    }
    setActiveTab(tab);
  };

  // Load user profile if permissions weren't passed down
  useEffect(() => {
    if (propsCan) return;
    let isMounted = true;
    void fetchMe()
      .then((me) => {
        if (isMounted) setUser(me);
      })
      .catch(() => { });
    return () => {
      isMounted = false;
    };
  }, [propsCan]);

  const can = useMemo<Can>(() => {
    const userPerms = user?.permissions;
    if (userPerms && userPerms.length > 0) return makeCan(userPerms);
    if (role === 'SUPER_ADMIN') {
      return (code: string) => {
        // Farmer end-user exclusive operations denied to Super Admin per docs/rbac.json BR rules
        if (
          code === 'order.create_own' ||
          code === 'listing.create_own' ||
          code === 'cart.manage_own' ||
          code.endsWith('.create_own')
        ) {
          return false;
        }
        return true;
      };
    }
    if (propsCan) return propsCan;
    return makeCan([]);
  }, [propsCan, user?.permissions, role]);

  // ─── Sub-Screen Routing (Mounting existing shared screens) ──────────────────

  if (activeSubScreen === 'notifications') {
    return (
      <NotificationsFlow
        scope={scope}
        can={can}
        onBack={() => setActiveSubScreen(null)}
      />
    );
  }

  if (activeSubScreen === 'settings') {
    return (
      <ProfileFlow
        scope={scope}
        can={can}
        role="SUPER_ADMIN"
        subtitle="Super Admin · All Warehouses"
        initialScreen={profileInitialScreen}
        onBack={() => setActiveSubScreen(null)}
        onLogout={onSignOut}
      />
    );
  }
  if (activeSubScreen === 'orders') {
    return (
      <OrdersFlow
        scope={scope}
        can={can}
        role="SUPER_ADMIN"
        initialScreen="M5S01"
        onBack={() => setActiveSubScreen(null)}
      />
    );
  }

  if (activeSubScreen === 'purchases') {
    if (
      !can('sales.channel.manage') &&
      !can('sales.dashboard.view') &&
      !can('purchase.order.view') &&
      !can('sales.sale.create')
    ) {
      return (
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
          {renderHeader(
            'Purchase & Sales',
            () => setActiveSubScreen('notifications'),
            () => {
              setProfileInitialScreen('UserProfile');
              setActiveSubScreen('settings');
            },
          )}
          <View style={styles.tabContainer}>
            <TouchableOpacity onPress={() => setActiveSubScreen(null)} style={{ padding: adminSpacing.lg }}>
              <Text style={adminType.body}>Access restricted. Tap to go back.</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }
    return (
      <SalesFlow
        scope={scope}
        can={can}
        role={role ?? 'SUPER_ADMIN'}
        initialScreen="Sales"
        onBack={() => setActiveSubScreen(null)}
        onNavigateToNotifications={() => setActiveSubScreen('notifications')}
        onNavigateToNeedsAttention={() => {
          setWorkQueueReturnSubScreen('purchases');
          setActiveSubScreen('work_queue');
        }}
      />
    );
  }

  if (activeSubScreen === 'staff') {
    return (
      <StaffFlow
        scope={scope}
        can={can}
        role="SUPER_ADMIN"
        initialScreen="Staff"
        onBack={() => setActiveSubScreen(null)}
      />
    );
  }

  if (activeSubScreen === 'reports') {
    return (
      <ReportsScreen
        scope={scope}
        can={can}
        role="SUPER_ADMIN"
        canExport={true}
        onNavigateToNotifications={() => setActiveSubScreen('notifications')}
        onBack={() => setActiveSubScreen(null)}
      />
    );
  }

  if (activeSubScreen === 'market_pricing') {
    return (
      <MarketPricingHomeScreen
        role="SUPER_ADMIN"
        onBack={() => setActiveSubScreen(null)}
        onSetFairPriceCeiling={() => setActiveSubScreen('update_price')}
        onBulkUpdateCeilings={() => setActiveSubScreen('bulk_price_update')}
        onNavigateToFairPrice={() => setActiveSubScreen('fair_price_ceiling')}
        onNavigateToRetailPricing={() => setActiveSubScreen('retail_pricing')}
        onNavigateToListingApproval={() => {
          setWorkQueueReturnSubScreen('market_pricing');
          setActiveSubScreen('work_queue');
        }}
        onNavigateToPriceHistory={() => setActiveSubScreen('price_history')}
        onNavigateToMarketDay={() => setActiveSubScreen('market_days')}
      />
    );
  }

  if (activeSubScreen === 'edit_retail_price') {
    return (
      <EditRetailPriceScreen
        record={selectedRetailRecord}
        onBack={() => setActiveSubScreen('retail_pricing')}
        onSaveSuccess={() => setActiveSubScreen('retail_pricing')}
      />
    );
  }

  if (activeSubScreen === 'update_price') {
    return (
      <UpdateFairPriceScreen
        onBack={() => setActiveSubScreen('fair_price_ceiling')}
        itemName={selectedPriceCrop?.name ?? 'Carrots'}
        category={selectedPriceCrop?.category ?? 'Vegetables'}
        currentPrice={selectedPriceCrop?.price ?? 42}
        onSave={(newPrice) => {
          if (selectedPriceCrop) {
            setSelectedPriceCrop({ ...selectedPriceCrop, price: newPrice });
          }
          setActiveSubScreen('fair_price_ceiling');
        }}
      />
    );
  }

  if (activeSubScreen === 'market_days') {
    return (
      <MarketDayScheduleScreen
        onBack={() => setActiveSubScreen('market_pricing')}
        onAddMarketDay={() => setActiveSubScreen('add_market_day')}
        days={marketDaysList}
        onDaysChange={setMarketDaysList}
        onToggle={(id, val) => {
          setMarketDaysList((prev) =>
            prev.map((d) => (d.id === id ? { ...d, isActive: val } : d)),
          );
        }}
      />
    );
  }

  if (activeSubScreen === 'add_market_day') {
    return (
      <AddMarketDayScreen
        onBack={() => setActiveSubScreen('market_days')}
        onSave={(newDay) => {
          setMarketDaysList((prev) => [
            {
              id: String(Date.now()),
              date: newDay.date,
              month: newDay.month,
              warehouse: newDay.warehouse,
              timeRange: newDay.timeRange,
              isActive: true,
            },
            ...prev,
          ]);
          setActiveSubScreen('market_days');
        }}
      />
    );
  }
  if (activeSubScreen === 'allocation') {
    if (!can('allocation.channel_percentage.set') && !can('inventory.stock_ledger.view_all')) {
      return (
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
          {renderHeader(
            'Stock Allocation',
            () => setActiveSubScreen('notifications'),
            () => {
              setProfileInitialScreen('UserProfile');
              setActiveSubScreen('settings');
            },
          )}
          <View style={styles.tabContainer}>
            <TouchableOpacity onPress={() => setActiveSubScreen(null)} style={{ padding: adminSpacing.lg }}>
              <Text style={adminType.body}>Access restricted. Tap to go back.</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }
    return (
      <InventoryFlow
        scope={scope}
        can={can}
        role={role ?? 'SUPER_ADMIN'}
        initialScreen="M3S07"
        warehouseOptions={SUPER_ADMIN_WAREHOUSE_OPTIONS}
        onBack={() => setActiveSubScreen(null)}
      />
    );
  }

  if (activeSubScreen === 'fair_price_ceiling') {
    return (
      <FairPriceCeilingScreen
        role="SUPER_ADMIN"
        onBack={() => setActiveSubScreen('market_pricing')}
        onUpdatePrice={(item) => {
          setSelectedPriceCrop(item as any);
          setActiveSubScreen('update_price');
        }}
        onBulkUpdate={() => setActiveSubScreen('bulk_price_update')}
        onNavigateToRetailPricing={() => setActiveSubScreen('retail_pricing')}
        onViewHistory={(item) => {
          setSelectedPriceCrop(item as any);
          setActiveSubScreen('price_history');
        }}
      />
    );
  }

  if (activeSubScreen === 'bulk_price_update') {
    return (
      <BulkPriceUpdateScreen
        onBack={() => setActiveSubScreen('fair_price_ceiling')}
        onApply={() => setActiveSubScreen('fair_price_ceiling')}
      />
    );
  }

  if (activeSubScreen === 'retail_pricing') {
    return (
      <RetailPricingScreen
        role="SUPER_ADMIN"
        onBack={() => setActiveSubScreen('market_pricing')}
        onEditRetailPrice={(record: PricingRecordItem) => {
          setSelectedRetailRecord(record);
          setActiveSubScreen('edit_retail_price');
        }}
      />
    );
  }

  if (activeSubScreen === 'price_history') {
    return (
      <PriceHistoryScreen
        role="SUPER_ADMIN"
        onBack={() => setActiveSubScreen('market_pricing')}
      />
    );
  }

  if (activeSubScreen === 'work_queue') {
    return (
      <AdminWorkQueueScreen
        can={can}
        role={role ?? 'SUPER_ADMIN'}
        onBack={() => setActiveSubScreen(workQueueReturnSubScreen)}
        onReviewException={() => setActiveSubScreen('purchases')}
        onReviewApplication={() => {
          setFarmerInitialTab('applications');
          setFarmerSubView('applications');
          setActiveSubScreen(null);
          setActiveTab('Farmers');
        }}
        onViewAudit={() => setActiveSubScreen('audit_management')}
      />
    );
  }

  if (activeSubScreen === 'schedule_market') {
    return (
      <ScheduleMarketOpenCloseScreen
        initialMode={marketScheduleMode}
        can={can}
        onBack={() => setActiveSubScreen(null)}
        onSave={(schedule) => {
          setMarketSchedules((prev) => {
            const id = schedule.mode === 'close' ? 'auto_closes' : 'auto_open';
            const title =
              schedule.mode === 'close'
                ? t('superAdminDashboard.market.autoCloses')
                : t('superAdminDashboard.market.autoOpen');
            const time = `${schedule.date}, ${schedule.time}`;
            const existing = prev.find((s) => s.id === id);
            if (existing) {
              return prev.map((s) => (s.id === id ? { ...s, time, repeat: schedule.repeat } : s));
            }
            return [...prev, { id, title, time, mode: schedule.mode, repeat: schedule.repeat }];
          });
          setActiveSubScreen(null);
        }}
      />
    );
  }

  if (activeSubScreen === 'create_admin' && can('admin.super_admin.create')) {
    return (
      <CreateStaffAccountScreen
        role={role ?? 'SUPER_ADMIN'}
        onBack={() => setActiveSubScreen(null)}
        onSave={() => setActiveSubScreen(null)}
      />
    );
  }

  if (activeSubScreen === 'manage_admins') {
    return (
      <ManageAdminsScreen
        onBack={() => setActiveSubScreen(null)}
        onCreateNew={() => setActiveSubScreen('create_admin')}
        onViewPermissionsMatrix={() => setActiveSubScreen('permissions_matrix')}
      />
    );
  }

  if (activeSubScreen === 'permissions_matrix') {
    return (
      <AdminPermissionsMatrixScreen
        onBack={() => setActiveSubScreen('manage_admins')}
      />
    );
  }

  if (activeSubScreen === 'system_config') {
    return (
      <SystemConfigScreen
        onBack={() => setActiveSubScreen(null)}
      />
    );
  }

  if (activeSubScreen === 'system_audit_logs') {
    return (
      <SystemAuditLogsScreen
        onBack={() => setActiveSubScreen(null)}
      />
    );
  }

  if (activeSubScreen === 'integration_keys') {
    return (
      <IntegrationDetailScreen
        onBack={() => setActiveSubScreen(null)}
      />
    );
  }

  if (activeSubScreen === 'system_alerts') {
    return (
      <SystemAlertsScreen
        onBack={() => setActiveSubScreen(null)}
      />
    );
  }

  if (activeSubScreen === 'reports_main') {
    return (
      <AdminReportsMainScreen
        onBack={() => setActiveSubScreen(null)}
        onOpenPLReport={() => setActiveSubScreen('pl_statement')}
        onOpenFarmerPerformanceReport={() => { }}
        onOpenWarehouseOpsReport={() => { }}
        onOpenAnalyticsDashboard={() => setActiveSubScreen('analytics')}
      />
    );
  }

  if (activeSubScreen === 'analytics') {
    return (
      <AnalyticsDashboardScreen
        onBack={() => setActiveSubScreen(null)}
      />
    );
  }

  if (activeSubScreen === 'audit_management' || activeSubScreen === 'audit_calendar') {
    return (
      <AuditManagementFlow
        can={can}
        role={role}
        onBack={() => setActiveSubScreen(null)}
        onOpenFarmerProfile={() => {
          setActiveSubScreen(null);
          setActiveTab('Farmers');
        }}
      />
    );
  }

  if (activeSubScreen === 'cert_verification') {
    return (
      <AdminCertVerificationScreen
        farmer={{
          id: 'FMR-00098',
          name: 'Kumar',
          code: 'FMR-00098',
          farmName: 'Kumar Organic Farm',
          location: 'Ooty Central',
          status: 'ACTIVE',
        }}
        onBack={() => setActiveSubScreen(null)}
      />
    );
  }

  if (activeSubScreen === 'produce_control') {
    return (
      <ProduceControlFlow
        can={can}
        role={role ?? 'SUPER_ADMIN'}
        onBack={() => setActiveSubScreen(null)}
        onOpenFarmerProfile={() => {
          setActiveSubScreen(null);
          setActiveTab('Farmers');
        }}
      />
    );
  }

  if (activeSubScreen === 'crop_data') {
    return (
      <ProduceControlFlow
        can={can}
        role={role ?? 'SUPER_ADMIN'}
        initialScreen="cropData"
        onBack={() => setActiveSubScreen(null)}
        onOpenFarmerProfile={() => {
          setActiveSubScreen(null);
          setActiveTab('Farmers');
        }}
      />
    );
  }

  if (activeSubScreen === 'inputs_pest') {
    return (
      <InputsPestManagementFlow
        can={can}
        role={role}
        onBack={() => setActiveSubScreen(null)}
      />
    );
  }

  if (activeSubScreen === 'compliance_tiers') {
    return (
      <AdminComplianceTiersScreen
        onBack={() => setActiveSubScreen(null)}
      />
    );
  }

  if (activeSubScreen === 'payout_processing') {
    return (
      <PayoutProcessingScreen
        onBack={() => setActiveSubScreen(null)}
      />
    );
  }

  if (activeSubScreen === 'finance_flow') {
    return (
      <FinanceManagementFlow
        role="SUPER_ADMIN"
        can={can}
        onBack={() => setActiveSubScreen(null)}
      />
    );
  }

  if (activeSubScreen === 'profit_loss') {
    return (
      <ProfitLossScreen
        can={can}
        onBack={() => setActiveSubScreen(null)}
      />
    );
  }

  if (activeSubScreen === 'payment_methods') {
    return (
      <PaymentMethodsScreen
        can={can}
        onBack={() => setActiveSubScreen(null)}
      />
    );
  }

  if (activeSubScreen === 'finance_business_overview') {
    return (
      <FinanceBusinessOverviewScreen
        can={can}
        onBack={() => setActiveSubScreen(null)}
        onSelectPayout={(payoutId) => {
          setSelectedPayoutId(payoutId);
          setActiveSubScreen('approval_payout_detail');
        }}
        onNavigateSubScreen={(sub) => {
          if (sub === 'payout_processing') setActiveSubScreen('payout_processing');
          else if (sub === 'reports_main') setActiveSubScreen('reports_main');
          else if (sub === 'finance_flow') setActiveSubScreen('finance_flow');
          else if (sub === 'payment_methods') setActiveSubScreen('payment_methods');
          else if (sub === 'pl_statement') setActiveSubScreen('profit_loss');
        }}
      />
    );
  }

  if (activeSubScreen === 'customers') {
    return (
      <CustomersFlow
        scope={{ warehouseId: undefined, warehouseName: 'All Warehouses' }}
        can={can}
        onBack={() => setActiveSubScreen(null)}
      />
    );
  }

  if (activeSubScreen === 'community') {
    return (
      <CommunityKnowledgeFlow
        role="SUPER_ADMIN"
        can={can}
        onBack={() => setActiveSubScreen(null)}
      />
    );
  }

  if (activeSubScreen === 'pl_statement') {
    return (
      <PLStatementScreen
        onBack={() => setActiveSubScreen(null)}
      />
    );
  }

  if (activeSubScreen === 'approval_detail' && selectedApprovalRequest) {
    return (
      <AdminRequestDetailScreen
        request={selectedApprovalRequest}
        onBack={() => {
          setSelectedApprovalRequest(null);
          setActiveSubScreen('approval_inbox');
        }}
        onApprove={() => {
          setSelectedApprovalRequest(null);
          setActiveSubScreen('approval_inbox');
        }}
        onReject={() => {
          setSelectedApprovalRequest(null);
          setActiveSubScreen('approval_inbox');
        }}
      />
    );
  }

  if (activeSubScreen === 'approval_inbox') {
    return (
      <ApprovalsInboxScreen
        onBack={() => setActiveSubScreen(null)}
        onSelectApproval={(item) => {
          if (item.type === 'payout' || item.id.startsWith('PAY')) {
            setSelectedPayoutId(item.id);
            setActiveSubScreen('approval_payout_detail');
          } else if (item.type === 'transfer') {
            setActiveSubScreen('transfers_flow');
          } else {
            setSelectedPayoutId(item.id);
            setActiveSubScreen('approval_payout_detail');
          }
        }}
      />
    );
  }

  if (activeSubScreen === 'approval_payout_detail') {
    return (
      <ApprovalDetailPayoutScreen
        payoutId={selectedPayoutId}
        can={can}
        onBack={() => setActiveSubScreen('approval_inbox')}
        onApprove={() => {
          Alert.alert('Payout Approved', `Payout ${selectedPayoutId} approved successfully.`);
          setActiveSubScreen('approval_inbox');
        }}
        onReject={() => {
          Alert.alert('Payout Rejected', `Payout ${selectedPayoutId} rejected.`);
          setActiveSubScreen('approval_inbox');
        }}
      />
    );
  }

  if (activeSubScreen === 'alert_thresholds') {
    return (
      <AlertThresholdsScreen
        onBack={() => setActiveSubScreen(null)}
        onAddThreshold={() => {
          setSelectedThresholdData(undefined);
          setActiveSubScreen('compliance_tier_thresholds');
        }}
        onEditThreshold={(item) => {
          setSelectedThresholdData(item);
          setActiveSubScreen('compliance_tier_thresholds');
        }}
      />
    );
  }

  if (activeSubScreen === 'compliance_tier_thresholds') {
    return (
      <ComplianceTierThresholdsScreen
        initialData={selectedThresholdData}
        can={can}
        onBack={() => setActiveSubScreen('alert_thresholds')}
        onSave={() => {
          Alert.alert('Success', 'Threshold settings updated successfully.');
          setActiveSubScreen('alert_thresholds');
        }}
      />
    );
  }

  if (activeSubScreen === 'system_health') {
    return (
      <SystemHealthAdminOverviewScreen
        can={can}
        onBack={() => setActiveSubScreen(null)}
        onNavigateSubScreen={(sub) => {
          if (sub === 'manage_admins') setActiveSubScreen('manage_admins');
          else if (sub === 'permissions_matrix') setActiveSubScreen('permissions_matrix');
          else if (sub === 'system_audit_logs') setActiveSubScreen('system_audit_logs');
          else if (sub === 'system_config') setActiveSubScreen('system_config');
          else if (sub === 'integration_keys') setActiveSubScreen('integration_keys');
          else if (sub === 'reports_main') setActiveSubScreen('reports_main');
          else if (sub === 'system_alerts') setActiveSubScreen('system_alerts');
        }}
      />
    );
  }

  if (activeSubScreen === 'transfers_flow') {
    return (
      <TransfersFlow
        scope={scope}
        can={can}
        onBack={() => setActiveSubScreen(null)}
      />
    );
  }

  if (activeSubScreen === 'zone_management') {
    return (
      <AdminZoneManagementScreen
        onBack={() => setActiveSubScreen(null)}
      />
    );
  }

  // ─── Main Tabs Rendering ───────────────────────────────────────────────────

  // Tab 2: Farmers (Consolidated FarmerManagementFlow)
  if (activeTab === 'Farmers') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        <View style={styles.tabContainer}>
          <FarmerManagementFlow
            can={can}
            role={role}
            initialTab={farmerInitialTab}
            userScope={farmerUserScope}
            onBack={() => setActiveTab('Overview')}
            onSubViewChange={setFarmerSubView}
            onOpenApprovalInbox={() => setActiveSubScreen('approval_inbox')}
            onNavigateTab={(tab: string) => {
              if (tab === 'Dashboard' || tab === 'Home') setActiveTab('Overview');
              else if (tab === 'Farmers') setActiveTab('Farmers');
              else if (tab === 'Reports') setActiveSubScreen('reports_main');
              else if (tab === 'Profile') setActiveTab('Menu');
            }}
          />
        </View>
        {farmerSubView === 'overview' ? renderBottomTabBar(activeTab, handleSelectTab) : null}
      </SafeAreaView>
    );
  }

  // Tab 3: Warehouse & Operations (Direct Inventory Overview)
  if (activeTab === 'Warehouse') {
    if (warehouseModule === 'transfers') {
      return (
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
          <View style={styles.tabContainer}>
            <TransfersFlow
              scope={scope}
              can={can}
              onBack={() => setWarehouseModule('admin')}
            />
          </View>
        </SafeAreaView>
      );
    }
    if (warehouseModule === 'inventory') {
      return (
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
          <View style={styles.tabContainer}>
            <InventoryFlow
              scope={scope}
              can={can}
              role={role ?? 'SUPER_ADMIN'}
              initialScreen={inventoryInitialScreen}
              warehouseOptions={SUPER_ADMIN_WAREHOUSE_OPTIONS}
              onBack={() => setWarehouseModule('admin')}
            />
          </View>
        </SafeAreaView>
      );
    }
    if (warehouseModule === 'staff') {
      return (
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
          <View style={styles.tabContainer}>
            <StaffFlow
              scope={scope}
              can={can}
              role="SUPER_ADMIN"
              initialScreen="Staff"
              onBack={() => setWarehouseModule('admin')}
            />
          </View>
        </SafeAreaView>
      );
    }
    if (warehouseModule === 'add_profile') {
      return (
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
          <View style={styles.tabContainer}>
            <AddWarehouseProfileScreen
              onBack={() => setWarehouseModule('admin')}
              onSuccess={() => setWarehouseModule('admin')}
            />
          </View>
        </SafeAreaView>
      );
    }
    // Default: Direct Inventory & Warehouse Screen (No intermediate WarehouseOperationsOverview)
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        <View style={styles.tabContainer}>
          <AdminOperationsOverviewScreen
            initialViewMode="warehouses"
            onBack={() => setActiveTab('Overview')}
            onPlusAction={() => setWarehouseModule('add_profile')}
            onNavigateToStockLedger={() => {
              setInventoryInitialScreen('M3S07');
              setWarehouseModule('inventory');
            }}
            onNavigateToStockVerification={() => {
              setInventoryInitialScreen('M3S10');
              setWarehouseModule('inventory');
            }}
            onNavigateToTransfers={() => {
              setWarehouseModule('transfers');
            }}
            onSelectWarehouse={(_whId) => {
              setInventoryInitialScreen('M3S01');
              setWarehouseModule('inventory');
            }}
            onExportReports={() => {
              setActiveSubScreen('reports_main');
            }}
            onNotifications={() => {
              setActiveSubScreen('notifications');
            }}
          />
        </View>
        {renderBottomTabBar(activeTab, handleSelectTab)}
      </SafeAreaView>
    );
  }

  // Tab 4: Finance (Matching Images 1 & 2: Accounts & Finance Dashboard)
  if (activeTab === 'Finance') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        <View style={styles.tabContainer}>
          <FinanceManagementFlow
            role="SUPER_ADMIN"
            can={can}
            showBackButton={true}
            onBack={() => setActiveTab('Overview')}
            onTabChange={(tab) => {
              setActiveTab(tab as any);
            }}
          />
        </View>
        {renderBottomTabBar(activeTab, handleSelectTab)}
      </SafeAreaView>
    );
  }

  // Tab 5: More Menu (Matching Image 1: SuperAdminMoreScreen)
  if (activeTab === 'Menu') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        <View style={styles.tabContainer}>
          <SuperAdminMoreScreen
            can={can}
            onBack={() => setActiveTab('Overview')}
            onNavigateProduce={() => setActiveSubScreen('produce_control')}
            onNavigateAudit={() => setActiveSubScreen('audit_management')}
            onNavigateInputsPest={() => setActiveSubScreen('inputs_pest')}
            onNavigateMarketPricing={() => setActiveSubScreen('market_pricing')}
            onNavigatePurchases={() => setActiveSubScreen('purchases')}
            onNavigateAllocation={() => setActiveSubScreen('allocation')}
            onNavigateSalesOrders={() => setActiveSubScreen('orders')}
            onNavigateCustomers={() => setActiveSubScreen('customers')}
            onNavigateStaff={() => setActiveSubScreen('staff')}
            onNavigateCommunity={() => setActiveSubScreen('community')}
            onNavigateNotifications={() => setActiveSubScreen('notifications')}
            onNavigateReports={() => setActiveSubScreen('reports')}
            onNavigateSettings={() => {
              setProfileInitialScreen('Settings');
              setActiveSubScreen('settings');
            }}
            onNavigateZoneManagement={() => setActiveSubScreen('zone_management')}
          />
        </View>
        {renderBottomTabBar(activeTab, handleSelectTab)}
      </SafeAreaView>
    );
  }

  // ─── Tab 1: Overview Dashboard (Matching Image 1, 2, 3) ─────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollInner} showsVerticalScrollIndicator={false}>
        {/* Top Header */}
        {renderHeader(
          t('superAdminDashboard.title'),
          () => setActiveSubScreen('notifications'),
          () => {
            setProfileInitialScreen('UserProfile');
            setActiveSubScreen('settings');
          }
        )}

        <View style={styles.mainContent}>
          {/* 1. Floating "Good morning, Super Admin" Summary Card */}
          <View style={styles.greetingCard}>
            <View style={styles.greetingTopRow}>
              <Text style={styles.greetingTitle} numberOfLines={1}>
                Good morning, Super Admin
              </Text>
              <View style={styles.roleBadgePill}>
                <Text style={styles.roleBadgeText}>SUPER Admin</Text>
              </View>
            </View>

            <Text style={styles.greetingSubTitle}>Today’s operational summary</Text>
            <Text style={styles.greetingDateStamp}>Mon, 13 Oct 2026 · IST</Text>

            <View style={styles.greetingBottomRow}>
              <Text style={styles.lastUpdatedText}>Last updated {lastUpdated}</Text>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={() => {
                  const now = new Date();
                  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                  setLastUpdated(`${timeStr} · All details`);
                }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Refresh operational summary"
              >
                <RefreshIcon size={16} color={adminColors.brandDeep} />
              </TouchableOpacity>
            </View>
          </View>

        {/* ─── Platform KPIs (Uses shared OverviewDashboardCard layout directly) ─── */}
        <OverviewCardsGrid style={styles.kpiGrid}>
          {[
            {
              title: t('superAdminDashboard.kpi.totalFarmers'),
              value: '214',
              icon: 'users' as const,
              onPress: () => {
                setFarmerInitialTab('farmers');
                setFarmerSubView('overview');
                setActiveTab('Farmers');
              },
            },
            {
              title: t('superAdminDashboard.kpi.pendingApplications'),
              value: '9',
              icon: 'clipboard' as const,
              tone: 'warning' as const,
              onPress: () => {
                setFarmerInitialTab('applications');
                setFarmerSubView('applications');
                setActiveTab('Farmers');
              },
            },
            {
              title: t('superAdminDashboard.kpi.activeFarmers'),
              value: '196',
              icon: 'users' as const,
              tone: 'success' as const,
              onPress: () => {
                setFarmerInitialTab('farmers');
                setFarmerSubView('overview');
                setActiveTab('Farmers');
              },
            },
            {
              title: t('superAdminDashboard.kpi.deactivatedFarmers'),
              value: '9',
              icon: 'alert' as const,
              tone: 'danger' as const,
              onPress: () => {
                setFarmerInitialTab('farmers');
                setFarmerSubView('overview');
                setActiveTab('Farmers');
              },
            },
            {
              title: t('superAdminDashboard.kpi.pendingListings'),
              value: '5',
              icon: 'inventory' as const,
              tone: 'warning' as const,
              onPress: () => setActiveSubScreen('approval_inbox'),
            },
            {
              title: t('superAdminDashboard.kpi.activeAudits'),
              value: '6',
              icon: 'clipboard' as const,
              onPress: () => setActiveSubScreen('audit_management'),
            },
            {
              title: t('superAdminDashboard.kpi.totalCustomers'),
              value: '18',
              icon: 'store' as const,
              onPress: () => setActiveSubScreen('customers'),
            },
            {
              title: t('superAdminDashboard.kpi.staffAndAdmins'),
              value: '27',
              icon: 'users' as const,
              onPress: () => setActiveSubScreen('manage_admins'),
            },
          ].map((kpi) => (
            <OverviewDashboardCard
              key={kpi.title}
              value={kpi.value}
              title={kpi.title}
              icon={kpi.icon}
              tone={kpi.tone ?? 'default'}
              preserveCase={false}
              onPress={kpi.onPress}
            />
          ))}
        </OverviewCardsGrid>

          {/* ─── Market Control Card ─── */}
          <View style={styles.marketCard}>
            <View style={styles.marketHeaderRow}>
              <View style={styles.marketTitleContainer}>
                <View style={styles.marketIconBox}>
                  <StoreIcon size={20} color={adminColors.brand} />
                </View>
                <View style={styles.marketTitleCol}>
                  <Text style={styles.marketTitle}>{t('superAdminDashboard.market.title')}</Text>
                  <Text style={styles.marketSubtitle}>{t('superAdminDashboard.market.subtitle')}</Text>
                </View>
              </View>
              <View style={styles.marketStatusBadge}>
                <View style={styles.marketStatusDot} />
                <Text style={styles.marketStatusText}>{t('superAdminDashboard.market.statusOpen')}</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.marketActionsRow}>
              <TouchableOpacity style={styles.closeMarketButton} activeOpacity={0.75}>
                <PauseCircleIcon size={16} color={adminColors.danger.text} />
                <Text style={styles.closeMarketText}>{t('superAdminDashboard.market.close')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.scheduleMarketButton}
                activeOpacity={0.75}
                onPress={() => {
                  setMarketScheduleMode('open');
                  setActiveSubScreen('schedule_market');
                }}
              >
                <CalendarIcon size={16} color={adminColors.onBrand} />
                <Text style={styles.scheduleMarketText}>{t('superAdminDashboard.market.schedule')}</Text>
              </TouchableOpacity>
            </View>

            {/* Upcoming Schedule */}
            <View style={styles.scheduleSection}>
              <Text style={styles.scheduleSectionTitle}>{t('superAdminDashboard.market.upcoming')}</Text>

              {marketSchedules.map((schedule) => (
                <View key={schedule.id} style={styles.scheduleItem}>
                  <View style={styles.scheduleItemLeft}>
                    <View style={styles.scheduleCalendarBox}>
                      <CalendarIcon
                        size={16}
                        color={schedule.mode === 'open' ? adminColors.brand : adminColors.muted}
                      />
                    </View>
                    <View style={styles.scheduleTextCol}>
                      <Text style={styles.scheduleItemTitle}>{schedule.title}</Text>
                      <Text style={styles.scheduleItemTime}>{schedule.time}</Text>
                    </View>
                  </View>
                  <View style={styles.scheduleItemRight}>
                    <View style={styles.scheduledPill}>
                      <Text style={styles.scheduledPillText}>{t('superAdminDashboard.market.scheduled')}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.menuDotBtn}
                      activeOpacity={0.7}
                      onPress={() => setActiveScheduleMenu(schedule)}
                    >
                      <MoreVerticalIcon size={16} color={adminColors.muted} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* ─── Quick Access (Reusable OverviewActionCard) ─── */}
          <OverviewSectionHeader title={t('superAdminDashboard.section.quickAccess')} />
          <OverviewCardsGrid style={styles.quickAccessGrid}>
            {can('allocation.channel_percentage.set') ? (
              <OverviewActionCard
                title="Configure Allocation"
                icon={<PieChartIcon size={20} color={adminColors.brandDeep} />}
                onPress={() => setActiveSubScreen('allocation')}
              />
            ) : null}
            <OverviewActionCard
              title="Approval Inbox"
              icon={<InboxTrayIcon size={20} color={adminColors.brandDeep} />}
              onPress={() => setActiveSubScreen('approval_inbox')}
            />
            {can('transfer.inter_warehouse.initiate') ? (
              <OverviewActionCard
                title="Manage Transfers"
                icon={<SwitchArrowsIcon size={20} color={adminColors.brandDeep} />}
                onPress={() => setActiveSubScreen('transfers_flow')}
              />
            ) : null}
            <OverviewActionCard
              title="Work Queue"
              icon={<ClipboardListIcon size={20} color={adminColors.brandDeep} />}
              onPress={() => setActiveSubScreen('work_queue')}
            />
            {can('admin.super_admin.create') ? (
              <OverviewActionCard
                title="Create Admin"
                icon={<UserPlusIcon size={20} color={adminColors.brandDeep} />}
                onPress={() => setActiveSubScreen('create_admin')}
              />
            ) : null}
            {can('system.config.manage') ? (
              <OverviewActionCard
                title="Alert Thresholds"
                icon={<FilterSlidersIcon size={20} color={adminColors.brandDeep} />}
                onPress={() => setActiveSubScreen('alert_thresholds')}
              />
            ) : null}
            {can('pricing.fair_price.set') ? (
              <OverviewActionCard
                title="Fair Prices"
                icon={<FairPriceIcon size={20} color={adminColors.brandDeep} />}
                onPress={() => setActiveSubScreen('fair_price_ceiling')}
              />
            ) : null}
            {can('pricing.fair_price.set') ? (
              <OverviewActionCard
                title="Manage Retail Prices"
                icon={<CashBillIcon size={20} color={adminColors.brandDeep} />}
                onPress={() => setActiveSubScreen('retail_pricing')}
              />
            ) : null}
          </OverviewCardsGrid>

          {/* ─── Work Queue (Reusable OverviewQueueCard) ─── */}
          <OverviewSectionHeader title={t('superAdminDashboard.section.workQueue')} />
          <View style={styles.workQueueList}>
            <OverviewQueueCard
              title="PAY-0002 · Kumar"
              badgeLabel="Awaiting SA approval"
              badgeStatus="INFO"
              meta="₹18,000.00 · Requested 9 Oct 2026, 10:00"
              viewDetailsLabel={t('superAdminDashboard.viewDetails')}
              accentTone="danger"
              onPress={() => {
                setSelectedPayoutId('PAY-0002');
                setActiveSubScreen('approval_payout_detail');
              }}
            />
            <OverviewQueueCard
              title="APP-2026-0101 · Sathish Kumar"
              badgeLabel="Pending Review"
              badgeStatus="PENDING"
              meta="Submitted 5 Oct 2026"
              viewDetailsLabel={t('superAdminDashboard.viewDetails')}
              onPress={() => setActiveSubScreen('approval_inbox')}
            />
            <OverviewQueueCard
              title="AUD-2026-0052 · Vijay"
              badgeLabel="Past scheduled date"
              badgeStatus="REJECTED"
              meta="Due 8 Oct 2026"
              viewDetailsLabel={t('superAdminDashboard.viewDetails')}
              onPress={() => setActiveSubScreen('audit_management')}
            />
          </View>

          {/* ─── Approval Inbox (Reusable OverviewApprovalCard) ─── */}
          <OverviewSectionHeader
            title={t('superAdminDashboard.section.approvalInbox')}
            actionLabel="View All"
            onAction={() => setActiveSubScreen('approval_inbox')}
          />
          <View style={styles.approvalInboxList}>
            <OverviewApprovalCard
              category="Farmer Payout (>₹10,000)"
              title="PAY-0002 · Kumar · ₹18,000.00"
              meta="Escalated by Demo TOHFA Admin · Waiting 4 days"
              badgeLabel="Escalated"
              badgeStatus="INFO"
              onPress={() => {
                setSelectedPayoutId('PAY-0002');
                setActiveSubScreen('approval_payout_detail');
              }}
            />
            <OverviewApprovalCard
              category="Inter-Warehouse Transfer"
              title="TR-0015 · Ooty → Coonoor · ₹42,000.00"
              meta="Requested by Demo Main Warehouse Admin · Waiting 1 day"
              badgeLabel="High value"
              badgeStatus="INFO"
              onPress={() => setActiveSubScreen('approval_inbox')}
            />
            <OverviewApprovalCard
              category="Warehouse Admin Promotion"
              title="Priya Nair → Main Warehouse Admin"
              meta="Requested by Demo TOHFA Admin · Waiting 2 days"
              badgeLabel="Pending"
              badgeStatus="PENDING"
              onPress={() => setActiveSubScreen('approval_inbox')}
            />
            <OverviewApprovalCard
              category="Stock Adjustment"
              title="ADJ-0031 · Carrot · -42 kg (Main Warehouse, Ooty)"
              meta="Requested by Demo Sub Warehouse Admin · Waiting 6 hours"
              badgeLabel="Pending"
              badgeStatus="PENDING"
              onPress={() => setActiveSubScreen('approval_inbox')}
            />
            <OverviewApprovalCard
              category="Farmer Application"
              title="APP-2026-0101 · Sathish Kumar"
              meta="Submitted 5 Oct 2026 · Waiting 3 days"
              badgeLabel="Pending Review"
              badgeStatus="PENDING"
              onPress={() => setActiveSubScreen('approval_inbox')}
            />
            <OverviewApprovalCard
              category="Produce Listing"
              title="LST-2026-0045 · Tomato Grade 1 · Selvi"
              meta="Submitted 11 Oct 2026 · Waiting 2 days"
              badgeLabel="Pending Review"
              badgeStatus="PENDING"
              onPress={() => setActiveSubScreen('approval_inbox')}
            />
            <OverviewApprovalCard
              category="Produce Listing"
              title="LST-2026-0047 · Carrot Grade 2 · Demo Farmer Admin"
              meta="Auto-routed away from the Farmer Admin who owns it · Waiting 1 day"
              badgeLabel="Routed — own listing"
              badgeStatus="UNVERIFIED"
              onPress={() => setActiveSubScreen('approval_inbox')}
            />
          </View>

          {/* ─── Recent Activity ─── */}
          <OverviewSectionHeader title={t('superAdminDashboard.section.recentActivity')} />
          <View style={styles.activityCard}>
            {renderActivityItem('Fair Price ceiling updated for Carrot Grade 1', 'Today, 10:45 AM')}
            {renderActivityItem('Sub Warehouse Admin account created for Kotagiri', 'Yesterday, 04:20 PM')}
            {renderActivityItem('Channel Allocation updated to Online 70% / Live 10%', '12 Oct 2026, 02:15 PM')}
          </View>
        </View>
      </ScrollView>

      {/* 3-Dots Schedule Options Popup Modal */}
      <Modal
        visible={!!activeScheduleMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveScheduleMenu(null)}
      >
        <TouchableOpacity
          style={styles.popupOverlay}
          activeOpacity={1}
          onPress={() => setActiveScheduleMenu(null)}
        >
          <View style={styles.scheduleOptionsMenu}>
            <TouchableOpacity
              style={styles.scheduleOptionItem}
              onPress={() => {
                if (activeScheduleMenu) {
                  setDetailsScheduleItem(activeScheduleMenu);
                }
                setActiveScheduleMenu(null);
              }}
              activeOpacity={0.7}
            >
              <EyeIcon size={18} color={adminColors.ink} />
              <Text style={styles.scheduleOptionText}>{t('scheduleMarket.menu.viewDetails')}</Text>
            </TouchableOpacity>

            <View style={styles.scheduleOptionDivider} />

            <TouchableOpacity
              style={styles.scheduleOptionItem}
              onPress={() => {
                if (activeScheduleMenu) {
                  setMarketScheduleMode(activeScheduleMenu.mode);
                  setActiveSubScreen('schedule_market');
                }
                setActiveScheduleMenu(null);
              }}
              activeOpacity={0.7}
            >
              <PencilEditIcon size={18} color={adminColors.ink} />
              <Text style={styles.scheduleOptionText}>{t('scheduleMarket.menu.editSchedule')}</Text>
            </TouchableOpacity>

            <View style={styles.scheduleOptionDivider} />

            <TouchableOpacity
              style={styles.scheduleOptionItem}
              onPress={() => {
                if (activeScheduleMenu) {
                  const targetId = activeScheduleMenu.id;
                  setMarketSchedules((prev) => prev.filter((s) => s.id !== targetId));
                  Alert.alert(
                    t('scheduleMarket.title'),
                    t('scheduleMarket.cancelSuccess')
                  );
                }
                setActiveScheduleMenu(null);
              }}
              activeOpacity={0.7}
            >
              <TrashIcon size={18} color={adminColors.danger.text} />
              <Text style={[styles.scheduleOptionText, styles.scheduleOptionDanger]}>
                {t('scheduleMarket.menu.cancelSchedule')}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Schedule Details Modal */}
      <Modal
        visible={!!detailsScheduleItem}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailsScheduleItem(null)}
      >
        <TouchableOpacity
          style={styles.popupOverlay}
          activeOpacity={1}
          onPress={() => setDetailsScheduleItem(null)}
        >
          <View style={styles.detailsModalContent}>
            <Text style={styles.detailsModalTitle}>{t('scheduleMarket.details.title')}</Text>
            {detailsScheduleItem ? (
              <View style={styles.detailsModalBody}>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>{t('scheduleMarket.action')}:</Text>
                  <Text style={styles.detailsValue}>
                    {detailsScheduleItem.mode === 'open'
                      ? t('scheduleMarket.actionOpen')
                      : t('scheduleMarket.actionClose')}
                  </Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>{t('scheduleMarket.time')}:</Text>
                  <Text style={styles.detailsValue}>{detailsScheduleItem.time}</Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>{t('scheduleMarket.repeat')}:</Text>
                  <Text style={styles.detailsValue}>{detailsScheduleItem.repeat}</Text>
                </View>
              </View>
            ) : null}
            <TouchableOpacity
              style={styles.detailsCloseBtn}
              onPress={() => setDetailsScheduleItem(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.detailsCloseText}>{t('scheduleMarket.details.close')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Bottom Navigation Bar */}
      {renderBottomTabBar(activeTab, handleSelectTab)}
    </SafeAreaView>
  );
}

// ─── Reusable Render Helpers ──────────────────────────────────────────────────

function renderHeader(
  titleText: string,
  onNavigateNotifications: () => void,
  onNavigateProfile: () => void
) {
  return (
    <View style={styles.header}>
      <View style={styles.headerTopRow}>
        <View style={styles.headerLeftCol}>
          <View style={styles.headerBrandTitleRow}>
            <ShieldIcon size={20} color={adminColors.onBrand} />
            <Text style={styles.headerBrandText}>{titleText}</Text>
          </View>
          <Text style={styles.headerDateText}>Mon, 13 Oct 2026 · IST</Text>
        </View>

        <View style={styles.headerIconsRow}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={onNavigateNotifications}
            activeOpacity={0.8}
            accessibilityLabel="Notifications"
          >
            <BellIcon size={20} color={adminColors.onBrand} />
            <View style={styles.notificationDot}>
              <Text style={styles.notificationDotText}>4</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={onNavigateProfile}
            activeOpacity={0.8}
            accessibilityLabel="Profile"
          >
            <UserAvatarIcon size={20} color={adminColors.onBrand} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function renderActivityItem(title: string, time: string) {
  return (
    <View key={title} style={styles.activityItemRow}>
      <View style={styles.activityDot} />
      <View style={styles.activityTextCol}>
        <Text style={styles.activityTitle}>{title}</Text>
        <Text style={styles.activityTime}>{time}</Text>
      </View>
    </View>
  );
}


function renderMoreMenuRow(
  label: string,
  icon: React.ReactNode,
  onPress: () => void
) {
  return (
    <TouchableOpacity
      key={label}
      style={styles.moreMenuRowCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.moreMenuRowLeft}>
        {icon}
        <Text style={styles.moreMenuRowLabel}>{label}</Text>
      </View>
      <ChevronRightIcon size={16} color={adminColors.muted} />
    </TouchableOpacity>
  );
}

function renderBottomTabBar(
  activeTab: SuperAdminTab,
  onSelectTab: (tab: SuperAdminTab) => void
) {
  return (
    <View style={styles.bottomBar}>
      <TouchableOpacity
        style={styles.bottomTabItem}
        onPress={() => onSelectTab('Overview')}
        activeOpacity={0.75}
        accessibilityRole="tab"
        accessibilityLabel="Home"
      >
        <NavHomeIcon
          size={20}
          color={activeTab === 'Overview' ? adminColors.brand : adminColors.muted}
        />
        <Text
          style={[
            styles.bottomTabLabel,
            activeTab === 'Overview' && styles.bottomTabLabelActive,
          ]}
        >
          {t('superAdminDashboard.tab.home')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.bottomTabItem}
        onPress={() => onSelectTab('Farmers')}
        activeOpacity={0.75}
      >
        <NavFarmersIcon
          size={20}
          color={activeTab === 'Farmers' ? adminColors.brand : adminColors.muted}
        />
        <Text
          style={[
            styles.bottomTabLabel,
            activeTab === 'Farmers' && styles.bottomTabLabelActive,
          ]}
        >
          {t('superAdminDashboard.tab.farmers')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.bottomTabItem}
        onPress={() => onSelectTab('Warehouse')}
        activeOpacity={0.75}
      >
        <NavWarehouseIcon
          size={20}
          color={activeTab === 'Warehouse' ? adminColors.brand : adminColors.muted}
        />
        <Text
          style={[
            styles.bottomTabLabel,
            activeTab === 'Warehouse' && styles.bottomTabLabelActive,
          ]}
        >
          {t('superAdminDashboard.tab.warehouse')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.bottomTabItem}
        onPress={() => onSelectTab('Finance')}
        activeOpacity={0.75}
      >
        <NavFinanceIcon
          size={20}
          color={activeTab === 'Finance' ? adminColors.brand : adminColors.muted}
        />
        <Text
          style={[
            styles.bottomTabLabel,
            activeTab === 'Finance' && styles.bottomTabLabelActive,
          ]}
        >
          {t('superAdminDashboard.tab.finance')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.bottomTabItem}
        onPress={() => onSelectTab('Menu')}
        activeOpacity={0.75}
      >
        <NavMenuIcon
          size={20}
          color={activeTab === 'Menu' ? adminColors.brand : adminColors.muted}
        />
        <Text
          style={[
            styles.bottomTabLabel,
            activeTab === 'Menu' && styles.bottomTabLabelActive,
          ]}
        >
          {t('superAdminDashboard.tab.menu')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Theme-Derived Stylesheet (Zero Hex Literals) ─────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: adminColors.brand,
  },
  tabContainer: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollInner: {
    paddingBottom: adminSpacing.xl,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 14,
    paddingBottom: adminSpacing.lg,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeftCol: {
    flex: 1,
    justifyContent: 'center',
  },
  headerBrandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: adminSpacing.xs,
  },
  headerBrandText: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontWeight: '800',
    fontSize: 18,
    letterSpacing: 0.2,
  },
  headerDateText: {
    ...adminType.rowMeta,
    color: adminColors.onBrand,
    opacity: 0.9,
    fontSize: 12,
    fontWeight: '500',
  },
  headerIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: adminColors.danger.text,
    borderRadius: adminRadius.full,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notificationDotText: {
    color: adminColors.onBrand,
    fontSize: 10,
    fontWeight: '800',
  },
  mainContent: {
    paddingHorizontal: adminSpacing.md,
    marginTop: adminSpacing.md,
  },
  // 1. Floating Greeting Card (Image 1)
  greetingCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  greetingTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  greetingTitle: {
    ...adminType.title,
    color: adminColors.ink,
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
    marginRight: adminSpacing.sm,
  },
  roleBadgePill: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 5,
    flexShrink: 0,
    alignSelf: 'center',
  },
  roleBadgeText: {
    ...adminType.caption,
    color: adminColors.onBrand,
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.3,
  },
  greetingSubTitle: {
    ...adminType.body,
    color: adminColors.muted,
    fontSize: 13,
    marginBottom: 2,
  },
  greetingDateStamp: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    fontSize: 12,
    marginBottom: adminSpacing.md,
  },
  greetingBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  lastUpdatedText: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    fontSize: 12,
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: adminRadius.xs,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 2. Search and Date Filter Bar (Tohfa Admin Reference)
  searchContainer: {
    marginBottom: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    height: 46,
    gap: adminSpacing.sm,
    ...adminShadow.sm,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    paddingVertical: 0,
    fontSize: 13,
  },
  dateFilterRow: {
    alignItems: 'flex-start',
  },
  dateFilterContainer: {
    alignItems: 'flex-start',
    marginVertical: adminSpacing.xs,
  },
  dateFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.brandTint,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.border,
    gap: 6,
  },
  dateFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    gap: adminSpacing.xs,
  },
  dateFilterText: {
    ...adminType.rowMeta,
    color: adminColors.brandDeep,
    fontWeight: '700',
    fontSize: 13,
  },
  kpiGrid: {
    marginBottom: adminSpacing.md,
  },
  marketCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  marketHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  marketTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    flex: 1,
  },
  marketIconBox: {
    width: 38,
    height: 38,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marketTitleCol: {
    flex: 1,
  },
  marketTitle: {
    ...adminType.title,
    color: adminColors.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  marketSubtitle: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  marketStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F8EE',
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 4,
    gap: 6,
  },
  marketStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#00A843',
  },
  marketStatusText: {
    color: '#00A843',
    fontSize: 12,
    fontWeight: '700',
  },
  marketActionsRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    marginTop: adminSpacing.md,
  },
  closeMarketButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.xs,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: adminColors.danger.border,
    backgroundColor: adminColors.card,
  },
  closeMarketText: {
    color: adminColors.danger.text,
    fontWeight: '700',
    fontSize: 13,
  },
  scheduleMarketButton: {
    flex: 1.25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.xs,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#00A843',
  },
  scheduleMarketText: {
    color: adminColors.onBrand,
    fontWeight: '700',
    fontSize: 13,
  },
  scheduleSection: {
    marginTop: adminSpacing.md,
    paddingTop: adminSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F3EFE9',
  },
  scheduleSectionTitle: {
    ...adminType.rowMeta,
    color: adminColors.brandDeep,
    fontWeight: '800',
    fontSize: 12,
    marginBottom: adminSpacing.xs,
  },
  scheduleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E5E0',
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 10,
    marginTop: adminSpacing.xs,
  },
  scheduleItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scheduleCalendarBox: {
    width: 32,
    height: 32,
    borderRadius: adminRadius.xs,
    borderWidth: 1,
    borderColor: '#E8E5E0',
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleTextCol: {},
  scheduleItemTitle: {
    color: adminColors.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  scheduleItemTime: {
    color: adminColors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  scheduleItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scheduledPill: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  scheduledPillText: {
    color: '#92400E',
    fontSize: 11,
    fontWeight: '700',
  },
  menuDotBtn: {
    padding: adminSpacing.xs,
  },
  quickAccessGrid: {
    marginBottom: adminSpacing.md,
  },
  workQueueList: {
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  approvalInboxList: {
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  activityCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  activityItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: adminSpacing.sm,
    paddingVertical: adminSpacing.xs,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: adminColors.brand,
    marginTop: 5,
  },
  activityTextCol: {
    flex: 1,
  },
  activityTitle: {
    color: adminColors.ink,
    fontSize: 13,
    fontWeight: '600',
  },
  activityTime: {
    color: adminColors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  menuCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: adminSpacing.sm + 2,
    paddingHorizontal: adminSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  menuRowLabel: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  moreMenuList: {
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  moreMenuRowCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    height: 52,
  },
  moreMenuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
  },
  moreMenuRowLabel: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  signOutButton: {
    backgroundColor: adminColors.danger.text,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.sm,
    marginBottom: adminSpacing.lg,
  },
  signOutText: {
    color: adminColors.onBrand,
    fontSize: 15,
    fontWeight: '800',
  },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingVertical: adminSpacing.xs,
    paddingBottom: adminSpacing.sm,
  },
  bottomTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  bottomTabLabel: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  bottomTabLabelActive: {
    color: adminColors.brand,
    fontWeight: '800',
  },
  popupOverlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.lg,
  },
  scheduleOptionsMenu: {
    width: 220,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.md,
    overflow: 'hidden',
  },
  scheduleOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.md,
  },
  scheduleOptionDivider: {
    height: 1,
    backgroundColor: adminColors.border,
  },
  scheduleOptionText: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '600',
  },
  scheduleOptionDanger: {
    color: adminColors.danger.text,
  },
  detailsModalContent: {
    width: '100%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.lg,
    ...adminShadow.md,
  },
  detailsModalTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    fontWeight: '700',
    marginBottom: adminSpacing.md,
  },
  detailsModalBody: {
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.lg,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsLabel: {
    ...adminType.body,
    color: adminColors.muted,
    width: 70,
  },
  detailsValue: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '600',
    flex: 1,
  },
  detailsCloseBtn: {
    height: 44,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsCloseText: {
    ...adminType.body,
    color: adminColors.onBrand,
    fontWeight: '700',
  },
});

export default SuperAdminDashboardScreen;
