import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
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
  OverviewCardsGrid,
  OverviewDashboardCard,
  OverviewSectionHeader,
} from '../../components/OverviewDashboardCard';
import { OverviewActionCard } from '../../components/OverviewSuperAdminCards';
import {
  BellIcon,
  CalendarIcon,
  CashBillIcon,
  EyeIcon,
  FairPriceIcon,
  FilterSlidersIcon,
  InboxTrayIcon,
  MoreVerticalIcon,
  NavFarmersIcon,
  NavFinanceIcon,
  NavHomeIcon,
  NavMenuIcon,
  NavWarehouseIcon,
  PauseCircleIcon,
  PencilEditIcon,
  PieChartIcon,
  RefreshIcon,
  ShieldIcon,
  StoreIcon,
  SwitchArrowsIcon,
  TrashIcon,
  UserAvatarIcon,
  UserPlusIcon,
  ClipboardListIcon,
} from '../../components/AdminIcons';
import { t } from '../../i18n';
import { useAdminQuery } from '../../api/hooks';
import { adminKeys } from '../../api/queryKeys';
import { getFarmerSummary } from '../../api/farmers';
import { listCustomers } from '../../api/customers';
import { listNotifications } from '../../api/notifications';
import { useListingQueue } from '../../api/listingsHooks';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { exactCount } from './audit-schedule/scheduleFormat';
import { tohfaDateStamp } from '../tohfa-home/tohfaHomeLogic';
import {
  greetingNameText,
  lastUpdatedText,
  saHomeKpiValues,
  unreadBadgeText,
  type MeStatus,
  type SaHomeKpiValues,
} from './superAdminHomeFigures';
import type { WarehouseScope } from '../warehouse';
import { SuperAdminMoreScreen } from './SuperAdminMoreScreen';
import { FarmersFlow } from '../farmers/FarmersFlow';
import { canOpenFarmers } from '../farmers/flow/farmersFlowNav';
import { FarmerManagementFlow, type FarmerManagementSubView } from '../farmers/FarmerManagementFlow';
import { InventoryFlow } from '../warehouse/inventory/InventoryFlow';
import {
  FinanceManagementFlow,
  PLStatementScreen,
  PayoutProcessingScreen,
  ProfitLossScreen,
  PaymentMethodsScreen,
} from '../finance';
import { FinanceBusinessOverviewScreen } from './FinanceBusinessOverviewScreen';
import { NotificationsFlow } from '../warehouse/notifications/NotificationsFlow';
import { PricingFlow } from '../pricing/PricingFlow';
import { ProduceControlFlow } from '../produce';
import { PurchaseOrdersFlow } from '../purchase-orders/PurchaseOrdersFlow';
import { CustomersManagementFlow } from '../customers-management';
import { OrdersFlow } from '../warehouse/orders/OrdersFlow';
import { StaffFlow } from '../warehouse/staff-attendance/StaffFlow';
import { AuditManagementFlow } from '../audits/AuditManagementFlow';
import { InputsPestManagementFlow } from '../inputs';
import { CommunityKnowledgeFlow } from '../community';
import { AdminZoneManagementScreen } from '../zones';
import { AdminProfileScreen } from './AdminProfileScreen';
import { CreateAdminAccountScreen, type AdminAccountData } from './CreateAdminAccountScreen';
import { ManageAdminsScreen } from './ManageAdminsScreen';
import { AdminDetailProfileScreen } from './AdminDetailProfileScreen';
import { AdminPermissionsMatrixScreen } from './AdminPermissionsMatrixScreen';
import { AdminActivityLogsScreen } from './AdminActivityLogsScreen';
import { AdminRequestsApprovalScreen } from './AdminRequestsApprovalScreen';
import {
  SystemConfigScreen,
  EditChannelAllocationScreen,
  IntegrationDetailScreen,
  CompanyDetailsScreen,
  SystemAuditLogsScreen,
} from '../config';
import { ApprovalsInboxScreen } from './ApprovalsInboxScreen';
import { ApprovalDetailPayoutScreen } from './ApprovalDetailPayoutScreen';
import { AdminWorkQueueScreen } from './AdminWorkQueueScreen';
import { AlertThresholdsScreen } from './AlertThresholdsScreen';
import { ComplianceTierThresholdsScreen, type AlertThresholdData } from './ComplianceTierThresholdsScreen';
import { BulkPriceUpdateScreen } from './BulkPriceUpdateScreen';
import { FairPriceCeilingScreen } from './FairPriceCeilingScreen';
import { RetailPricingScreen } from './RetailPricingScreen';
import { ScheduleMarketOpenCloseScreen } from './ScheduleMarketOpenCloseScreen';
import { TransfersFlow } from '../warehouse/transfers/TransfersFlow';
import {
  AdminReportsMainScreen,
  AnalyticsDashboardScreen,
  FarmerPerformanceReportScreen,
  WarehouseOpsReportScreen,
  ReportBuilderScreen,
  SystemAlertsScreen,
  AnnouncementsScreen,
  AllRecentReportsScreen,
} from '../reports';
import { ReportsScreen } from '../warehouse/reports/ReportsScreen';
import { ProfileFlow } from '../warehouse/profile-settings/ProfileFlow';
import type { ProfileRoute } from '../warehouse/profile-settings/types';
import { AdminOperationsOverviewScreen } from './AdminOperationsOverviewScreen';
import { AddWarehouseProfileScreen } from './AddWarehouseProfileScreen';

const SUPER_ADMIN_WAREHOUSE_OPTIONS: readonly WarehouseScope[] = [
  { warehouseId: 'WH-MAIN', warehouseName: 'Ooty (WH-MAIN)' },
  { warehouseId: 'WH-COON', warehouseName: 'Coonoor (WH-SUB1)' },
  { warehouseId: 'WH-KOT', warehouseName: 'Kotagiri (WH-SUB2)' },
  { warehouseId: 'WH-GUD', warehouseName: 'Gudalur Market (WH-SUB3)' },
];

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

export function SuperAdminDashboardScreen({
  can: propsCan,
  scope: propsScope,
  onSignOut,
  onSwitchRole,
  onNavigate,
  initialTab = 'Overview',
}: SuperAdminDashboardScreenProps) {
  const [activeTab, setActiveTab] = useState<SuperAdminTab>(initialTab);
  const [profileInitialScreen, setProfileInitialScreen] = useState<ProfileRoute>('Settings');
  const [user, setUser] = useState<UserMe | null>(null);
  const [meStatus, setMeStatus] = useState<MeStatus>('loading');
  const [selectedPayoutId, setSelectedPayoutId] = useState<string | undefined>(undefined);
  const [activeScheduleMenu, setActiveScheduleMenu] = useState<{
    id: string;
    title: string;
    time: string;
    repeat: string;
    mode: 'open' | 'close';
  } | null>(null);
  const [detailsScheduleItem, setDetailsScheduleItem] = useState<{
    id: string;
    title: string;
    time: string;
    repeat: string;
    mode: 'open' | 'close';
  } | null>(null);

  // Market schedules: docs/openapi.yaml has no market open/close schedule
  // endpoint (see ScheduleMarketOpenCloseScreen), so there is nothing to list.
  // The design's two rows were fixtures and are not shown.
  const marketSchedules: ReadonlyArray<{
    id: string;
    title: string;
    time: string;
    repeat: string;
    mode: 'open' | 'close';
  }> = [];

  // Sub-screen navigation states
  const [activeSubScreen, setActiveSubScreen] = useState<
    | 'allocation'
    | 'fair_price_ceiling'
    | 'retail_pricing'
    | 'approval_inbox'
    | 'approval_payout_detail'
    | 'transfers_flow'
    | 'work_queue'
    | 'orders'
    | 'customers'
    | 'staff'
    | 'manage_admins'
    | 'create_admin'
    | 'admin_detail'
    | 'admin_permissions'
    | 'admin_activity'
    | 'admin_requests'
    | 'alert_thresholds'
    | 'schedule_market'
    | 'audit_management'
    | 'produce_control'
    | 'inputs_pest'
    | 'purchase_orders'
    | 'pricing_flow'
    | 'community'
    | 'zone_management'
    | 'reports'
    | 'reports_main'
    | 'notifications'
    | 'settings'
    | 'config_main'
    | 'config_channel'
    | 'config_integration'
    | 'config_company'
    | 'config_audit_logs'
    | 'payout_processing'
    | 'finance_flow'
    | 'profit_loss'
    | 'payment_methods'
    | 'finance_business_overview'
    | 'bulk_price_update'
    | 'compliance_tier_thresholds'
    | null
  >(null);

  const [selectedAdminToEdit, setSelectedAdminToEdit] = useState<AdminAccountData | null>(null);
  const [selectedAdminProfile, setSelectedAdminProfile] = useState<AdminAccountData | null>(null);
  const [selectedThresholdData, setSelectedThresholdData] = useState<AlertThresholdData | undefined>(undefined);
  const [activeReportsSub, setActiveReportsSub] = useState<
    | 'analytics'
    | 'pl'
    | 'farmerPerformance'
    | 'warehouseOps'
    | 'builder'
    | 'alerts'
    | 'announcements'
    | 'allRecent'
    | 'operational'
    | null
  >(null);
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<string>('razorpay');
  const [farmerInitialTab, setFarmerInitialTab] = useState<'farmers' | 'applications'>('farmers');
  const [farmerSubView, setFarmerSubView] = useState<FarmerManagementSubView>('overview');
  const farmerUserScope = useMemo(
    () => ({ warehouseId: undefined }),
    [],
  );

  const [warehouseModule, setWarehouseModule] = useState<
    'admin' | 'transfers' | 'inventory' | 'staff' | 'add_profile'
  >('admin');
  const [inventoryInitialScreen, setInventoryInitialScreen] = useState<string>('M3S01');
  const [inventoryScope, setInventoryScope] = useState<WarehouseScope>({
    warehouseId: undefined,
    warehouseName: 'All Warehouses',
  });
  const [financeSubScreen, setFinanceSubScreen] = useState<string>('overview');

  const handleSelectTab = (tab: SuperAdminTab) => {
    if (tab === 'Farmers') {
      setFarmerInitialTab('farmers');
      setFarmerSubView('overview');
    }
    if (tab === 'Warehouse') {
      setWarehouseModule('admin');
    }
    setActiveTab(tab);
  };

  useEffect(() => {
    fetchMe()
      .then((me) => {
        setUser(me);
        setMeStatus('ready');
      })
      .catch(() => setMeStatus('error'));
  }, []);

  const adminCan = useMemo(() => makeCan(user?.permissions), [user]);
  const activeCan = propsCan ?? adminCan;
  // Home figures: gated on the same `can` the rest of the shell uses, so a
  // code the admin lacks never fires a request the server would refuse.
  const home = useSuperAdminHomeData(activeCan);

  const allWarehouses = useMemo<WarehouseScope>(
    () => ({ warehouseId: undefined, warehouseName: t('profile.scope.allWarehouses') }),
    [],
  );

  // ─── Active Sub-Screens Rendering ───────────────────────────────────────────

  if (activeSubScreen === 'notifications') {
    return (
      <NotificationsFlow
        scope={{}}
        can={activeCan}
        onBack={() => setActiveSubScreen(null)}
      />
    );
  }

  if (activeSubScreen === 'pricing_flow') {
    return <PricingFlow can={activeCan} onBack={() => setActiveSubScreen(null)} />;
  }

  if (activeSubScreen === 'community') {
    return <CommunityKnowledgeFlow can={activeCan} onBack={() => setActiveSubScreen(null)} />;
  }

  if (activeSubScreen === 'zone_management') {
    return <AdminZoneManagementScreen onBack={() => setActiveSubScreen(null)} />;
  }

  if (activeSubScreen === 'produce_control') {
    return <ProduceControlFlow can={activeCan} onBack={() => setActiveSubScreen(null)} />;
  }

  if (activeSubScreen === 'inputs_pest') {
    return <InputsPestManagementFlow can={activeCan} onBack={() => setActiveSubScreen(null)} />;
  }

  if (activeSubScreen === 'purchase_orders') {
    return <PurchaseOrdersFlow can={activeCan} initialView="dual" onBack={() => setActiveSubScreen(null)} />;
  }

  if (activeSubScreen === 'audit_management') {
    return <AuditManagementFlow can={activeCan} onBack={() => setActiveSubScreen(null)} />;
  }

  if (activeSubScreen === 'customers') {
    return <CustomersManagementFlow can={activeCan} onBack={() => setActiveSubScreen(null)} />;
  }

  if (activeSubScreen === 'orders') {
    return <OrdersFlow scope={allWarehouses} can={activeCan} onBack={() => setActiveSubScreen(null)} />;
  }

  if (activeSubScreen === 'allocation') {
    return <InventoryFlow scope={allWarehouses} can={activeCan} initialScreen="M3S07" onBack={() => setActiveSubScreen(null)} />;
  }

  if (activeSubScreen === 'transfers_flow') {
    return <TransfersFlow scope={allWarehouses} can={activeCan} onBack={() => setActiveSubScreen(null)} />;
  }

  if (activeSubScreen === 'staff') {
    return <StaffFlow scope={allWarehouses} can={activeCan} initialScreen="Staff" onBack={() => setActiveSubScreen(null)} />;
  }

  if (activeSubScreen === 'reports') {
    return (
      <View style={{ flex: 1 }}>
        <ReportsScreen
          scope={allWarehouses}
          can={adminCan}
          canExport={true}
          onNavigateToNotifications={() => setActiveSubScreen('notifications')}
          onBack={() => setActiveSubScreen(null)}
        />
        <View style={{ display: 'none' }}>
          <AdminReportsMainScreen
            onBack={() => setActiveSubScreen(null)}
            onOpenPLReport={() => {}}
            onOpenFarmerPerformanceReport={() => {}}
            onOpenWarehouseOpsReport={() => {}}
            onOpenAnalyticsDashboard={() => {}}
          />
        </View>
      </View>
    );
  }

  if (activeSubScreen === 'reports_main') {
    if (activeReportsSub === 'analytics') {
      return <AnalyticsDashboardScreen onBack={() => setActiveReportsSub(null)} />;
    }
    if (activeReportsSub === 'pl') {
      return <PLStatementScreen onBack={() => setActiveReportsSub(null)} />;
    }
    if (activeReportsSub === 'farmerPerformance') {
      return <FarmerPerformanceReportScreen onBack={() => setActiveReportsSub(null)} />;
    }
    if (activeReportsSub === 'warehouseOps') {
      return <WarehouseOpsReportScreen onBack={() => setActiveReportsSub(null)} />;
    }
    if (activeReportsSub === 'allRecent') {
      return (
        <AllRecentReportsScreen
          onBack={() => setActiveReportsSub(null)}
          onOpenPLReport={() => setActiveReportsSub('pl')}
          onOpenFarmerPerformanceReport={() => setActiveReportsSub('farmerPerformance')}
          onOpenWarehouseOpsReport={() => setActiveReportsSub('warehouseOps')}
        />
      );
    }
    if (activeReportsSub === 'builder') {
      return (
        <ReportBuilderScreen
          onBack={() => setActiveReportsSub(null)}
          onGenerate={(type) => {
            if (type === 'pl') setActiveReportsSub('pl');
            else if (type === 'farmer') setActiveReportsSub('farmerPerformance');
            else if (type === 'warehouse') setActiveReportsSub('warehouseOps');
          }}
        />
      );
    }
    if (activeReportsSub === 'alerts') {
      return <SystemAlertsScreen onBack={() => setActiveReportsSub(null)} />;
    }
    if (activeReportsSub === 'announcements') {
      return <AnnouncementsScreen onBack={() => setActiveReportsSub(null)} />;
    }
    if (activeReportsSub === 'operational') {
      return (
        <ReportsScreen
          scope={allWarehouses}
          can={adminCan}
          canExport={true}
          onNavigateToNotifications={() => setActiveSubScreen('notifications')}
          onBack={() => setActiveReportsSub(null)}
        />
      );
    }

    return (
      <AdminReportsMainScreen
        onBack={() => {
          setActiveReportsSub(null);
          setActiveSubScreen(null);
        }}
        onOpenPLReport={() => setActiveReportsSub('pl')}
        onOpenFarmerPerformanceReport={() => setActiveReportsSub('farmerPerformance')}
        onOpenWarehouseOpsReport={() => setActiveReportsSub('warehouseOps')}
        onOpenAnalyticsDashboard={() => setActiveReportsSub('analytics')}
        onOpenOperationalReports={() => setActiveSubScreen('reports')}
        onOpenReportBuilder={() => setActiveReportsSub('builder')}
        onOpenAllRecentReports={() => setActiveReportsSub('allRecent')}
        onOpenSystemAlerts={() => setActiveReportsSub('alerts')}
        onOpenAnnouncements={() => setActiveReportsSub('announcements')}
      />
    );
  }

  if (activeSubScreen === 'settings') {
    return (
      <ProfileFlow
        scope={allWarehouses}
        can={adminCan}
        role="SUPER_ADMIN"
        subtitle="Super Admin · All Warehouses"
        initialScreen={profileInitialScreen}
        onBack={() => setActiveSubScreen(null)}
        onLogout={onSignOut}
        onSwitchRole={onSwitchRole}
      />
    );
  }

  if (activeSubScreen === 'create_admin') {
    return (
      <CreateAdminAccountScreen
        initialData={selectedAdminToEdit ?? undefined}
        can={adminCan}
        onBack={() => {
          setSelectedAdminToEdit(null);
          setActiveSubScreen(null);
        }}
        onViewDirectory={() => {
          setSelectedAdminToEdit(null);
          setActiveSubScreen('manage_admins');
        }}
        onSuccess={() => {
          setSelectedAdminToEdit(null);
          setActiveSubScreen(null);
        }}
      />
    );
  }

  if (activeSubScreen === 'manage_admins') {
    return (
      <ManageAdminsScreen
        onBack={() => setActiveSubScreen(null)}
        onCreateNew={() => {
          setSelectedAdminToEdit(null);
          setActiveSubScreen('create_admin');
        }}
        onEditAdmin={(adm) => {
          setSelectedAdminToEdit(adm);
          setActiveSubScreen('create_admin');
        }}
        onViewAdminDetail={(adm) => {
          setSelectedAdminProfile(adm);
          setActiveSubScreen('admin_detail');
        }}
        onViewPermissionsMatrix={() => setActiveSubScreen('admin_permissions')}
        onViewActivityLogs={() => setActiveSubScreen('admin_activity')}
        onViewRequests={() => setActiveSubScreen('admin_requests')}
      />
    );
  }

  if (activeSubScreen === 'admin_detail' && selectedAdminProfile) {
    return (
      <AdminDetailProfileScreen
        admin={selectedAdminProfile}
        onBack={() => setActiveSubScreen('manage_admins')}
        onEdit={(adm) => {
          setSelectedAdminToEdit(adm);
          setActiveSubScreen('create_admin');
        }}
        onViewPermissionsMatrix={() => setActiveSubScreen('admin_permissions')}
        onViewActivityLogs={() => setActiveSubScreen('admin_activity')}
      />
    );
  }

  if (activeSubScreen === 'admin_permissions') {
    return <AdminPermissionsMatrixScreen onBack={() => setActiveSubScreen('manage_admins')} />;
  }

  if (activeSubScreen === 'admin_activity') {
    return <AdminActivityLogsScreen onBack={() => setActiveSubScreen('manage_admins')} />;
  }

  if (activeSubScreen === 'admin_requests') {
    return <AdminRequestsApprovalScreen onBack={() => setActiveSubScreen(null)} onRequestHandled={() => {}} />;
  }

  if (activeSubScreen === 'approval_inbox') {
    return (
      <ApprovalsInboxScreen
        can={adminCan}
        onBack={() => setActiveSubScreen(null)}
        onSelectApproval={(item) => {
          if (item.type === 'payout') {
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
        payoutId={selectedPayoutId ?? undefined}
        can={adminCan}
        onBack={() => setActiveSubScreen('approval_inbox')}
        onApprove={() => setActiveSubScreen('approval_inbox')}
      />
    );
  }

  if (activeSubScreen === 'work_queue') {
    return (
      <AdminWorkQueueScreen
        can={adminCan}
        role="SUPER_ADMIN"
        onBack={() => setActiveSubScreen(null)}
        onReviewException={() => setActiveSubScreen('purchase_orders')}
        onReviewApplication={() => {
          setFarmerInitialTab('applications');
          setFarmerSubView('applications');
          setActiveTab('Farmers');
          setActiveSubScreen(null);
        }}
        onViewAudit={() => {
          setActiveSubScreen('audit_management');
        }}
      />
    );
  }

  if (activeSubScreen === 'alert_thresholds') {
    return (
      <AlertThresholdsScreen
        can={adminCan}
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
        can={adminCan}
        onBack={() => setActiveSubScreen('alert_thresholds')}
        onSave={() => setActiveSubScreen('alert_thresholds')}
      />
    );
  }

  if (activeSubScreen === 'fair_price_ceiling') {
    return (
      <FairPriceCeilingScreen
        can={adminCan}
        onBack={() => setActiveSubScreen(null)}
        onNavigateToRetailPricing={() => setActiveSubScreen('retail_pricing')}
        onNavigateToHistory={() => setActiveSubScreen('pricing_flow')}
        onBulkUpdate={() => setActiveSubScreen('bulk_price_update')}
      />
    );
  }

  if (activeSubScreen === 'bulk_price_update') {
    return (
      <BulkPriceUpdateScreen
        can={adminCan}
        onBack={() => setActiveSubScreen('fair_price_ceiling')}
        onApplied={() => setActiveSubScreen('fair_price_ceiling')}
      />
    );
  }

  if (activeSubScreen === 'retail_pricing') {
    return (
      <RetailPricingScreen
        can={adminCan}
        onBack={() => setActiveSubScreen(null)}
      />
    );
  }

  if (activeSubScreen === 'schedule_market') {
    return (
      <ScheduleMarketOpenCloseScreen
        can={adminCan}
        initialMode="open"
        onBack={() => setActiveSubScreen(null)}
        onSave={(_item) => setActiveSubScreen(null)}
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
        can={adminCan}
        onBack={() => setActiveSubScreen(null)}
      />
    );
  }

  if (activeSubScreen === 'profit_loss') {
    return (
      <ProfitLossScreen
        can={adminCan}
        onBack={() => setActiveSubScreen(null)}
      />
    );
  }

  if (activeSubScreen === 'payment_methods') {
    return (
      <PaymentMethodsScreen
        can={adminCan}
        onBack={() => setActiveSubScreen(null)}
      />
    );
  }

  if (activeSubScreen === 'finance_business_overview') {
    return (
      <FinanceBusinessOverviewScreen
        can={adminCan}
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

  // ─── Main Tabs Rendering ───────────────────────────────────────────────────

  // Tab 2: Farmers (Consolidated FarmerManagementFlow)
  if (activeTab === 'Farmers' && canOpenFarmers(adminCan)) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        <View style={styles.tabContainer}>
          <FarmerManagementFlow
            can={adminCan}
            role="SUPER_ADMIN"
            initialTab={farmerInitialTab}
            userScope={farmerUserScope}
            onBack={() => setActiveTab('Overview')}
            onSubViewChange={setFarmerSubView}
            onOpenApprovalInbox={() => setActiveSubScreen('approval_inbox')}
            onNavigateTab={(tab: string) => {
              if (tab === 'Dashboard' || tab === 'Home') setActiveTab('Overview');
              else if (tab === 'Farmers') {
                setFarmerInitialTab('farmers');
                setFarmerSubView('overview');
                setActiveTab('Farmers');
              }
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
          <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
          <View style={styles.tabContainer}>
            <TransfersFlow
              scope={allWarehouses}
              can={activeCan}
              onBack={() => setWarehouseModule('admin')}
            />
          </View>
        </SafeAreaView>
      );
    }
    if (warehouseModule === 'inventory') {
      return (
        <SafeAreaView style={styles.container}>
          <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
          <View style={styles.tabContainer}>
            <InventoryFlow
              scope={inventoryScope}
              can={activeCan}
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
          <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
          <View style={styles.tabContainer}>
            <StaffFlow
              scope={allWarehouses}
              can={activeCan}
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
          <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
          <View style={styles.tabContainer}>
            <AddWarehouseProfileScreen
              onBack={() => setWarehouseModule('admin')}
              onSuccess={() => setWarehouseModule('admin')}
            />
          </View>
        </SafeAreaView>
      );
    }
    // Default: Direct Inventory & Warehouse Screen (AdminOperationsOverviewScreen)
    return (
      <SafeAreaView style={styles.container}>
        <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        <View style={styles.tabContainer}>
          <AdminOperationsOverviewScreen
            initialViewMode="warehouses"
            can={activeCan}
            onBack={() => setActiveTab('Overview')}
            onPlusAction={() => setWarehouseModule('add_profile')}
            onNavigateToStockLedger={(whId) => {
              setInventoryScope(whId ? { warehouseId: whId } : allWarehouses);
              setInventoryInitialScreen('M3S07');
              setWarehouseModule('inventory');
            }}
            onNavigateToStockVerification={(whId) => {
              setInventoryScope(whId ? { warehouseId: whId } : allWarehouses);
              setInventoryInitialScreen('M3S10');
              setWarehouseModule('inventory');
            }}
            onNavigateToTransfers={() => {
              setWarehouseModule('transfers');
            }}
            onSelectWarehouse={(whId) => {
              setInventoryScope(whId ? { warehouseId: whId } : allWarehouses);
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
        {warehouseModule === 'admin' ? renderBottomTabBar(activeTab, handleSelectTab) : null}
      </SafeAreaView>
    );
  }

  // Tab 4: Finance (Accounts & Finance Dashboard)
  if (activeTab === 'Finance') {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        <View style={styles.tabContainer}>
          <FinanceManagementFlow
            role="SUPER_ADMIN"
            can={adminCan}
            showBackButton={true}
            onBack={() => setActiveTab('Overview')}
            onTabChange={(tab) => {
              setActiveTab(tab as any);
            }}
            onSubScreenChange={setFinanceSubScreen}
          />
        </View>
        {financeSubScreen === 'overview' ? renderBottomTabBar(activeTab, handleSelectTab) : null}
      </SafeAreaView>
    );
  }

  // Tab 5: More Menu
  if (activeTab === 'Menu') {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        <View style={styles.tabContainer}>
          <SuperAdminMoreScreen
            can={adminCan}
            onBack={() => setActiveTab('Overview')}
            onNavigateProduce={() => setActiveSubScreen('produce_control')}
            onNavigateAudit={() => setActiveSubScreen('audit_management')}
            {...(onNavigate ? { onNavigateInputsPest: () => setActiveSubScreen('inputs_pest') } : {})}
            onNavigateMarketPricing={() => setActiveSubScreen('pricing_flow')}
            onNavigatePurchases={() => setActiveSubScreen('purchase_orders')}
            onNavigateAllocation={() => setActiveSubScreen('allocation')}
            onNavigateSalesOrders={() => setActiveSubScreen('orders')}
            onNavigateCustomers={() => setActiveSubScreen('customers')}
            onNavigateStaff={() => setActiveSubScreen('staff')}
            {...(onNavigate ? { onNavigateCommunity: () => setActiveSubScreen('community') } : {})}
            {...(onNavigate ? { onNavigateZoneManagement: () => setActiveSubScreen('zone_management') } : {})}
            onNavigateNotifications={() => setActiveSubScreen('notifications')}
            onNavigateReports={() => setActiveSubScreen('reports')}
            onNavigateSettings={() => {
              setProfileInitialScreen('Settings');
              setActiveSubScreen('settings');
            }}
            onLogout={onSignOut}
          />
        </View>
        {renderBottomTabBar(activeTab, handleSelectTab)}
      </SafeAreaView>
    );
  }

  // ─── Tab 1: Overview Dashboard ─────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollInner} showsVerticalScrollIndicator={false}>
        {/* Top Header */}
        {renderHeader(
          t('superAdminDashboard.title'),
          tohfaDateStamp(new Date()),
          home.unreadBadge,
          () => setActiveSubScreen('notifications'),
          () => {
            setProfileInitialScreen('UserProfile');
            setActiveSubScreen('settings');
          },
        )}

        <View style={styles.mainContent}>
          {/* 1. Floating Operational Summary Card */}
          <View style={styles.greetingCard}>
            <View style={styles.greetingTopRow}>
              <Text style={styles.greetingTitle} numberOfLines={1}>
                {t('homeDashboards.sa.greeting', { name: greetingNameText(user?.fullName, meStatus) })}
              </Text>
              <View style={styles.roleBadgePill}>
                <Text style={styles.roleBadgeText}>SUPER Admin</Text>
              </View>
            </View>

            <Text style={styles.greetingSubTitle}>Today’s operational summary</Text>
            <Text style={styles.greetingDateStamp}>{tohfaDateStamp(new Date())}</Text>

            <View style={styles.greetingBottomRow}>
              <Text style={styles.lastUpdatedText}>{home.lastUpdated}</Text>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={home.refresh}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t('homeDashboards.sa.refresh')}
              >
                <RefreshIcon size={16} color={adminColors.brandDeep} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ─── Platform KPIs (8 Cards) ─── */}
          <OverviewCardsGrid style={styles.kpiGrid}>
            {[
              {
                title: t('superAdminDashboard.kpi.totalFarmers'),
                value: home.kpis.totalFarmers,
                icon: <NavFarmersIcon size={20} color={adminColors.brand} />,
                onPress: () => {
                  setFarmerInitialTab('farmers');
                  setFarmerSubView('overview');
                  setActiveTab('Farmers');
                },
              },
              {
                title: t('superAdminDashboard.kpi.pendingApplications'),
                value: home.kpis.pendingApplications,
                icon: <ClipboardListIcon size={20} color={adminColors.warning.text} />,
                tone: 'warning' as const,
                onPress: () => {
                  setFarmerInitialTab('applications');
                  setFarmerSubView('applications');
                  setActiveTab('Farmers');
                },
              },
              {
                title: t('superAdminDashboard.kpi.activeFarmers'),
                value: home.kpis.activeFarmers,
                icon: <NavFarmersIcon size={20} color={adminColors.success.text} />,
                tone: 'success' as const,
                onPress: () => {
                  setFarmerInitialTab('farmers');
                  setFarmerSubView('overview');
                  setActiveTab('Farmers');
                },
              },
              {
                title: t('superAdminDashboard.kpi.deactivatedFarmers'),
                value: home.kpis.deactivatedFarmers,
                icon: <TrashIcon size={20} color={adminColors.danger.text} />,
                tone: 'danger' as const,
                onPress: () => {
                  setFarmerInitialTab('farmers');
                  setFarmerSubView('overview');
                  setActiveTab('Farmers');
                },
              },
              {
                title: t('superAdminDashboard.kpi.pendingListings'),
                value: home.kpis.pendingListings,
                icon: <NavWarehouseIcon size={20} color={adminColors.warning.text} />,
                tone: 'warning' as const,
                onPress: () => setActiveSubScreen('approval_inbox'),
              },
              {
                title: t('superAdminDashboard.kpi.activeAudits'),
                value: home.kpis.activeAudits,
                icon: <ClipboardListIcon size={20} color={adminColors.brand} />,
                onPress: () => setActiveSubScreen('audit_management'),
              },
              {
                title: t('superAdminDashboard.kpi.totalCustomers'),
                value: home.kpis.totalCustomers,
                icon: <StoreIcon size={20} color={adminColors.brand} />,
                onPress: () => setActiveSubScreen('customers'),
              },
              {
                title: t('superAdminDashboard.kpi.staffAndAdmins'),
                value: home.kpis.staffAndAdmins,
                icon: <UserAvatarIcon size={20} color={adminColors.brand} />,
                onPress: () => setActiveSubScreen('manage_admins'),
              },
            ].map((kpi) => (
              <OverviewDashboardCard
                key={kpi.title}
                value={kpi.value}
                title={kpi.title}
                icon={kpi.icon}
                tone={kpi.tone ?? 'default'}
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
                {/* No endpoint reports whether the market is open: the dash, never "open". */}
                <View style={styles.marketStatusDot} />
                <Text style={styles.marketStatusText}>{ADMIN_NO_VALUE}</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.marketActionsRow}>
              {/* No endpoint opens or closes the market: drawn as designed, disabled. */}
              <TouchableOpacity
                style={[styles.closeMarketButton, styles.actionUnavailable]}
                activeOpacity={0.75}
                disabled
                accessibilityRole="button"
                accessibilityState={{ disabled: true }}
              >
                <PauseCircleIcon size={16} color={adminColors.danger.text} />
                <Text style={styles.closeMarketText}>{t('superAdminDashboard.market.close')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.scheduleMarketButton}
                activeOpacity={0.75}
                onPress={() => setActiveSubScreen('schedule_market')}
              >
                <CalendarIcon size={16} color={adminColors.onBrand} />
                <Text style={styles.scheduleMarketText}>{t('superAdminDashboard.market.schedule')}</Text>
              </TouchableOpacity>
            </View>

            {/* Upcoming Schedule */}
            <View style={styles.scheduleSection}>
              <Text style={styles.scheduleSectionTitle}>{t('superAdminDashboard.market.upcoming')}</Text>
              {marketSchedules.length === 0 ? (
                <Text style={styles.scheduleItemTime}>{t('homeDashboards.sa.market.noSource')}</Text>
              ) : null}

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

          {/* ─── Quick Access Grid ─── */}
          <OverviewSectionHeader title={t('superAdminDashboard.section.quickAccess')} />
          <OverviewCardsGrid style={styles.quickAccessGrid}>
            <OverviewActionCard
              title="Configure Allocation"
              icon={<PieChartIcon size={20} color={adminColors.brandDeep} />}
              onPress={() => setActiveSubScreen('allocation')}
            />
            <OverviewActionCard
              title="Approval Inbox"
              icon={<InboxTrayIcon size={20} color={adminColors.brandDeep} />}
              onPress={() => setActiveSubScreen('approval_inbox')}
            />
            <OverviewActionCard
              title="Manage Transfers"
              icon={<SwitchArrowsIcon size={20} color={adminColors.brandDeep} />}
              onPress={() => setActiveSubScreen('transfers_flow')}
            />
            <OverviewActionCard
              title="Work Queue"
              icon={<ClipboardListIcon size={20} color={adminColors.brandDeep} />}
              onPress={() => setActiveSubScreen('work_queue')}
            />
            <OverviewActionCard
              title="Create Admin"
              icon={<UserPlusIcon size={20} color={adminColors.brandDeep} />}
              onPress={() => setActiveSubScreen('create_admin')}
            />
            <OverviewActionCard
              title="Alert Thresholds"
              icon={<FilterSlidersIcon size={20} color={adminColors.brandDeep} />}
              onPress={() => setActiveSubScreen('alert_thresholds')}
            />
            <OverviewActionCard
              title="Fair Prices"
              icon={<FairPriceIcon size={20} color={adminColors.brandDeep} />}
              onPress={() => setActiveSubScreen('fair_price_ceiling')}
            />
            <OverviewActionCard
              title="Manage Retail Prices"
              icon={<CashBillIcon size={20} color={adminColors.brandDeep} />}
              onPress={() => setActiveSubScreen('retail_pricing')}
            />
          </OverviewCardsGrid>

          {/* ─── Work Queue ─── */}
          <OverviewSectionHeader title={t('superAdminDashboard.section.workQueue')} />
          {/* The design's three rows were fixtures (a payout, an application and
              an audit). The live queue is the Work Queue screen; this preview
              has no read of its own yet, so it says so. */}
          <View style={styles.activityCard}>
            <Text style={styles.activityTime}>{t('homeDashboards.sa.workQueue.notLoaded')}</Text>
          </View>

          {/* ─── Approval Inbox ─── */}
          <OverviewSectionHeader
            title={t('superAdminDashboard.section.approvalInbox')}
            actionLabel="View All"
            onAction={() => setActiveSubScreen('approval_inbox')}
          />
          {/* The design's rows were fixtures; the live list is the Approval Inbox. */}
          <View style={styles.activityCard}>
            <Text style={styles.activityTime}>{t('homeDashboards.sa.approvalInbox.notLoaded')}</Text>
          </View>

          {/* ─── Recent Activity ─── */}
          <OverviewSectionHeader title={t('superAdminDashboard.section.recentActivity')} />
          <View style={styles.activityCard}>
            {/* The design's three rows were fixtures; no activity feed is read here yet. */}
            <Text style={styles.activityTime}>{t('homeDashboards.sa.activity.notLoaded')}</Text>
          </View>
        </View>
      </ScrollView>

      {/* 3-Dots Schedule Options Popup Modal */}
      {activeScheduleMenu ? (
        <View style={[StyleSheet.absoluteFill, styles.popupOverlay]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setActiveScheduleMenu(null)}
          />
          <View style={styles.scheduleOptionsMenu}>
            <TouchableOpacity
              style={styles.scheduleOptionItem}
              onPress={() => {
                if (activeScheduleMenu) setDetailsScheduleItem(activeScheduleMenu);
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
                if (activeScheduleMenu) setActiveSubScreen('schedule_market');
                setActiveScheduleMenu(null);
              }}
              activeOpacity={0.7}
            >
              <PencilEditIcon size={18} color={adminColors.ink} />
              <Text style={styles.scheduleOptionText}>{t('scheduleMarket.menu.editSchedule')}</Text>
            </TouchableOpacity>

            <View style={styles.scheduleOptionDivider} />

            {/* No endpoint cancels a schedule: disabled, never a local "cancelled". */}
            <TouchableOpacity
              style={[styles.scheduleOptionItem, styles.actionUnavailable]}
              disabled
              accessibilityState={{ disabled: true }}
              activeOpacity={0.7}
            >
              <TrashIcon size={18} color={adminColors.danger.text} />
              <Text style={[styles.scheduleOptionText, styles.scheduleOptionDanger]}>
                {t('scheduleMarket.menu.cancelSchedule')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {/* Schedule Details Modal */}
      {detailsScheduleItem ? (
        <View style={[StyleSheet.absoluteFill, styles.popupOverlay]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setDetailsScheduleItem(null)}
          />
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
        </View>
      ) : null}

      {/* Bottom Navigation Bar */}
      {renderBottomTabBar(activeTab, handleSelectTab)}
    </SafeAreaView>
  );
}

// ─── Home figures ─────────────────────────────────────────────────────────────

interface SuperAdminHomeData {
  kpis: SaHomeKpiValues;
  lastUpdated: string;
  unreadBadge: string | null;
  refresh: () => void;
}

/**
 * The Home tab's reads (sources and codes: superAdminHomeFigures.ts). Each is
 * enabled only when `can` grants its route's x-permission, so a role without
 * it fires nothing and its card shows the dash. A read that has not succeeded
 * (loading, failed, refused) contributes nothing: never a stale or default value.
 */
function useSuperAdminHomeData(can: Can): SuperAdminHomeData {
  const summaryAllowed = can('farmer.profile.view_all');
  const customersAllowed = can('customer.list.view');
  const listingsAllowed = can('listing.queue.view_pending');
  const unreadAllowed = can('notification.own.view');

  // Same key as farmerHooks.useFarmerSummary(undefined), so the cache is shared.
  const summary = useAdminQuery(['admin', 'farmers', 'summary', 'all'], (signal) => getFarmerSummary(signal), {
    enabled: summaryAllowed,
  });
  // limit 1: only `summary.total` (the whole visible set) is read, never the page.
  const customers = useAdminQuery(['admin', 'customers', 'homeTotal'], (signal) => listCustomers({ limit: 1 }, signal), {
    enabled: customersAllowed,
  });
  const listings = useListingQueue(undefined, { enabled: listingsAllowed });
  // Same key as notifications' useUnreadNotificationCount, so the bell and the list agree.
  const unread = useAdminQuery(
    adminKeys.scoped('notifications', undefined, { count: 'unread' }),
    (signal) => listNotifications({ limit: 1, unreadOnly: true }, signal),
    { enabled: unreadAllowed },
  );

  const summaryOk = summaryAllowed && summary.status === 'success';
  const customersOk = customersAllowed && customers.status === 'success';
  const kpis = saHomeKpiValues({
    farmerSummary: summaryOk ? summary.data : undefined,
    customerTotal: customersOk ? customers.data.summary.total : undefined,
    pendingListings: listingsAllowed ? exactCount(listings) : null,
  });
  const updatedAt = [summaryOk ? summary.dataUpdatedAt : 0, customersOk ? customers.dataUpdatedAt : 0];

  return {
    kpis,
    lastUpdated: lastUpdatedText(updatedAt),
    unreadBadge: unreadAllowed && unread.status === 'success' ? unreadBadgeText(unread.data.unreadCount) : null,
    // refetch() ignores `enabled`, so only the permitted reads are refetched.
    refresh: () => {
      if (summaryAllowed) void summary.refetch();
      if (customersAllowed) void customers.refetch();
      if (listingsAllowed) listings.refresh();
      if (unreadAllowed) void unread.refetch();
    },
  };
}

// ─── Reusable Render Helpers ──────────────────────────────────────────────────

function renderHeader(
  titleText: string,
  dateStamp: string,
  unreadBadge: string | null,
  onNavigateNotifications: () => void,
  onNavigateProfile: () => void,
) {
  return (
    <View style={styles.header}>
      <View style={styles.headerTopRow}>
        <View style={styles.headerLeftCol}>
          <View style={styles.headerBrandTitleRow}>
            <ShieldIcon size={20} color={adminColors.onBrand} />
            <Text style={styles.headerBrandText}>{titleText}</Text>
          </View>
          <Text style={styles.headerDateText}>{dateStamp}</Text>
        </View>

        <View style={styles.headerIconsRow}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={onNavigateNotifications}
            activeOpacity={0.8}
            accessibilityLabel="Notifications"
          >
            <BellIcon size={20} color={adminColors.onBrand} />
            {/* The server's unread total; no badge when nothing is unread or it is unknown. */}
            {unreadBadge !== null ? (
              <View style={styles.notificationDot}>
                <Text style={styles.notificationDotText}>{unreadBadge}</Text>
              </View>
            ) : null}
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

function renderBottomTabBar(
  activeTab: SuperAdminTab,
  onSelectTab: (tab: SuperAdminTab) => void,
) {
  return (
    <View style={styles.bottomBar}>
      <TouchableOpacity
        testID="saShell.tab.Overview"
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
        testID="saShell.tab.Farmers"
        style={styles.bottomTabItem}
        onPress={() => onSelectTab('Farmers')}
        activeOpacity={0.75}
        accessibilityRole="tab"
        accessibilityLabel="Farmers"
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
        testID="saShell.tab.Warehouse"
        style={styles.bottomTabItem}
        onPress={() => onSelectTab('Warehouse')}
        activeOpacity={0.75}
        accessibilityRole="tab"
        accessibilityLabel="Warehouse"
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
        testID="saShell.tab.Finance"
        style={styles.bottomTabItem}
        onPress={() => onSelectTab('Finance')}
        activeOpacity={0.75}
        accessibilityRole="tab"
        accessibilityLabel="Finance"
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
        testID="saShell.tab.Menu"
        style={styles.bottomTabItem}
        onPress={() => onSelectTab('Menu')}
        activeOpacity={0.75}
        accessibilityRole="tab"
        accessibilityLabel="Menu"
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

// ─── Theme-Derived Stylesheet ─────────────────────────────────────────────────

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
  /** The designed control, kept visible, drawn as unavailable (screens/community pattern). */
  actionUnavailable: {
    opacity: 0.5,
  },
  activityTime: {
    color: adminColors.muted,
    fontSize: 11,
    marginTop: 2,
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
