/**
 * Tohfa Admin shell: the design's bottom tabs (origin/tofhafarmfin-rbac) and
 * the full-screen flows they open. This file is only the host: it fetches
 * /auth/me once, builds `adminCan` from the user's own permissions, and mounts
 *   Home       -> TohfaHomeScreen
 *   Work Queue -> WorkQueueScreen (screens/work-queue)
 *   Inventory  -> WarehouseOverviewScreen
 *   Finance    -> FinanceManagementFlow (screens/finance) — hub + sub-screen routing
 *   More       -> AdminMoreMenuScreen
 * Navigation state lives in tohfa-shell/tohfaShellRoutes.ts.
 *
 * Every flow gets the real `adminCan` (empty, so deny-all, until /auth/me
 * arrives) and, being opened by an all-warehouses admin, an all-warehouses
 * scope, or the warehouse picked on the overview. Gating is per screen and
 * server-side; nothing here checks a role name.
 *
 * Home callbacks wired: notifications, profile/settings, farmers (list +
 * pending), pricing, inventory tab, finance tab, transfers, cash top-up,
 * receiving, staff (list + create), invoices, listing approval, work-queue tab,
 * operations overview tab.
 * More menu's Audit row opens the Audit Management flow (screens/audits).
 * Not wired yet (no built destination): produce calendar,
 * purchase orders, support, payouts / dues, channel order,
 * sales-finance overview, search filter, home refresh.
 */
import React, { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { BackHandler, View } from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import { fetchMe, getPrimaryAdminRole, type UserMe } from '../../../farmer/api/auth';
import { makeCan } from '../../permissions/can';
import { t } from '../../i18n';
import { adminColors } from '../../theme';
import { FarmersFlow, type FarmersFlowEntry } from '../farmers/FarmersFlow';
import { canOpenFarmers } from '../farmers/flow/farmersFlowNav';
import { PricingFlow } from '../pricing/PricingFlow';
import { TohfaHomeScreen } from '../tohfa-home/TohfaHomeScreen';
import { WarehouseOverviewScreen } from '../operations';
// FinanceManagementFlow is the Finance tab: hub + all sub-screen routing.
// (FinanceHubScreen from finance-hub/ is used inside it for the overview.)
import { FinanceManagementFlow } from '../finance';
import { AdminMoreMenuScreen } from '../more/AdminMoreMenuScreen';
import { TohfaAdminSettingsScreen } from '../settings/TohfaAdminSettingsScreen';
import { NotificationsFlow } from '../warehouse/notifications/NotificationsFlow';
import { InventoryFlow } from '../warehouse/inventory/InventoryFlow';
import { ReceivingFlow } from '../warehouse/receiving-qc/ReceivingFlow';
import { TransfersFlow } from '../warehouse/transfers/TransfersFlow';
import { SalesFlow } from '../warehouse/sales-direct/SalesFlow';
import { FinanceFlow } from '../warehouse/finance-expenses/FinanceFlow';
import { WalletFlow } from '../warehouse/wallet-cashtopup/WalletFlow';
import { ReturnsFlow } from '../warehouse/returns-rma/ReturnsFlow';
import { CustomersFlow } from '../warehouse/customers/CustomersFlow';
import { CustomersManagementFlow } from '../customers-management';
import { StaffFlow } from '../warehouse/staff-attendance/StaffFlow';
import { BillingFlow } from '../warehouse/billing-invoices/BillingFlow';
import { OrdersFlow } from '../warehouse/orders/OrdersFlow';
import { ListingsFlow } from '../listings/ListingsFlow';
import { PurchaseOrdersFlow } from '../purchase-orders/PurchaseOrdersFlow';
import { ProduceControlFlow } from '../produce';
import { AuditManagementFlow } from '../audits/AuditManagementFlow';
import { WorkQueueScreen } from '../work-queue/WorkQueueScreen';
import type { WarehouseScope } from '../warehouse/finance-expenses/types';
import { TohfaTabBar } from '../tohfa-shell/TohfaTabBar';
import { TohfaReportsFlow } from '../tohfa-shell/TohfaReportsFlow';
import { tohfaShellStyles as styles } from '../tohfa-shell/tohfaShellStyles';
import {
  initialTohfaShellState,
  tohfaShellBack,
  tohfaShellReducer,
  tohfaSwitchRoleTarget,
  type LegacyTohfaAdminTab,
  type TohfaShellTab,
  type TohfaSubFlow,
} from '../tohfa-shell/tohfaShellRoutes';

/**
 * Accepted `initialTab` values: the new tabs plus the old five-tab values,
 * which callers (App.tsx's TohfaAdminDashboard route) still pass. Mapping in
 * initialTohfaShellState: Dashboard -> Home; Farmers -> More + Farmers flow;
 * Reports -> More + reports; Profile -> More + Settings hub; Sales -> Finance +
 * sales-direct Sales flow.
 */
export type TohfaAdminTab = TohfaShellTab | LegacyTohfaAdminTab;

export interface TohfaAdminDashboardScreenProps {
  onSignOut?: () => void;
  onNavigate?: (screen: string) => void;
  /** Offered in More only when /auth/me shows more than one role. */
  onSwitchRole?: (role: string) => void;
  /** Tab to open on mount (the All Farmers screen's Profile tab opens 'Profile'). */
  initialTab?: TohfaAdminTab | undefined;
}

export function TohfaAdminDashboardScreen({
  onSignOut,
  onNavigate,
  onSwitchRole,
  initialTab,
}: TohfaAdminDashboardScreenProps) {
  const [route, dispatch] = useReducer(tohfaShellReducer, initialTab, initialTohfaShellState);
  const [user, setUser] = useState<UserMe | null>(null);

  useEffect(() => {
    fetchMe()
      .then((me) => setUser(me))
      .catch(() => {});
  }, []);

  // The signed-in admin's /auth/me permissions; empty (deny) until they arrive.
  const adminCan = useMemo(() => makeCan(user?.permissions), [user]);

  const allWarehouses = useMemo<WarehouseScope>(
    () => ({ warehouseId: undefined, warehouseName: t('profile.scope.allWarehouses') }),
    [],
  );

  // Sign-out is the host's; the fallback is the old shell's.
  const signOut = useCallback(() => {
    if (onSignOut) onSignOut();
    else onNavigate?.('Welcome');
  }, [onSignOut, onNavigate]);

  const open = useCallback((flow: TohfaSubFlow) => dispatch({ type: 'open', flow }), []);
  const closeFlow = useCallback(() => dispatch({ type: 'closeFlow' }), []);
  const selectTab = useCallback((tab: TohfaShellTab) => dispatch({ type: 'selectTab', tab }), []);
  const goHome = useCallback(() => selectTab('Home'), [selectTab]);

  // The Farmers flow needs farmer.profile.view_all at its entry (same gate as the mount below).
  const openFarmers = (entry: FarmersFlowEntry) => {
    if (!canOpenFarmers(adminCan)) return;
    open({ kind: 'farmers', entry });
  };

  // "Switch role" needs a second role on /auth/me AND a host that can switch.
  const switchTarget = user
    ? tohfaSwitchRoleTarget(
        user.roles.map((r) => r.code),
        getPrimaryAdminRole(user.roles),
      )
    : undefined;
  const canSwitchRole = onSwitchRole !== undefined && switchTarget !== undefined;

  // Android back: sub-flow -> its tab; other tab -> Home; Home -> not handled
  // (falls through to App.tsx as before). A flow that keeps its own stack
  // re-registers on each render (useFlowBack), so it sits above this listener
  // and pops its own screens first, falling through here only at its root.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (tohfaShellBack(route) === null) return false;
      dispatch({ type: 'back' });
      return true;
    });
    return () => sub.remove();
  }, [route]);

  const renderFlow = (flow: TohfaSubFlow): React.ReactNode => {
    switch (flow.kind) {
      case 'farmers':
        return canOpenFarmers(adminCan) ? (
          <FarmersFlow key={flow.entry} can={adminCan} entry={flow.entry} onBack={closeFlow} />
        ) : null;
      case 'pricing':
        return <PricingFlow can={adminCan} onBack={closeFlow} />;
      case 'notifications':
        return <NotificationsFlow scope={allWarehouses} can={adminCan} onBack={closeFlow} />;
      case 'settings':
        return <TohfaAdminSettingsScreen can={adminCan} onBack={closeFlow} onSignOut={signOut} />;
      case 'transfers':
        return <TransfersFlow scope={allWarehouses} can={adminCan} onBack={closeFlow} />;
      case 'wallet':
        return <WalletFlow scope={allWarehouses} can={adminCan} onBack={closeFlow} />;
      case 'receiving':
        return (
          <ReceivingFlow scope={allWarehouses} can={adminCan} receiverName={user?.fullName} onBack={closeFlow} />
        );
      case 'inventory': {
        // The overview hands over a warehouse id (no name); none means the whole network.
        const scope: WarehouseScope = flow.warehouseId === undefined ? allWarehouses : { warehouseId: flow.warehouseId };
        return (
          <InventoryFlow
            key={`${flow.screen}:${flow.warehouseId ?? ''}`}
            scope={scope}
            can={adminCan}
            initialScreen={flow.screen}
            onBack={closeFlow}
            onInitiateTransfer={() => open({ kind: 'transfers' })}
          />
        );
      }
      case 'sales':
        return <SalesFlow scope={allWarehouses} can={adminCan} onBack={closeFlow} />;
      case 'finance':
        return (
          <FinanceFlow key={flow.screen} scope={allWarehouses} can={adminCan} initialScreen={flow.screen} onBack={closeFlow} />
        );
      case 'returns':
        return <ReturnsFlow scope={allWarehouses} can={adminCan} onBack={closeFlow} />;
      case 'customers':
        return <CustomersFlow scope={allWarehouses} can={adminCan} onBack={closeFlow} />;
      case 'customersManagement':
        return <CustomersManagementFlow can={adminCan} onBack={closeFlow} />;
      case 'reports':
        return <TohfaReportsFlow onBack={closeFlow} />;
      case 'staff':
        return <StaffFlow key={flow.screen} scope={allWarehouses} can={adminCan} initialScreen={flow.screen} onBack={closeFlow} />;
      case 'billing':
        return <BillingFlow scope={allWarehouses} can={adminCan} onBack={closeFlow} />;
      case 'orders':
        return <OrdersFlow scope={allWarehouses} can={adminCan} onBack={closeFlow} />;
      case 'listings':
        // warehouseId undefined: Tohfa Admin sees all warehouses. Approve is
        // drawn disabled without a destination warehouse (agent decision noted;
        // owner to decide the approve destination for all-warehouses admins).
        return <ListingsFlow can={adminCan} onBack={closeFlow} />;
      case 'purchaseOrders':
        return <PurchaseOrdersFlow can={adminCan} onBack={closeFlow} />;
      case 'produce':
        return <ProduceControlFlow can={adminCan} onBack={closeFlow} />;
      case 'audits':
        return <AuditManagementFlow can={adminCan} onBack={closeFlow} />;
      default:
        return null;
    }
  };

  const renderTab = (tab: TohfaShellTab): React.ReactNode => {
    switch (tab) {
      case 'WorkQueue':
        return (
          <WorkQueueScreen
            can={adminCan}
            onBack={goHome}
            onOpenOrders={() => open({ kind: 'orders' })}
            onOpenReceiving={() => open({ kind: 'receiving' })}
            onOpenReturns={() => open({ kind: 'returns' })}
          />
        );
      case 'Inventory':
        return (
          <WarehouseOverviewScreen
            can={adminCan}
            onBack={goHome}
            onOpenStockLedger={(warehouseId) => open({ kind: 'inventory', screen: 'M3S02', warehouseId })}
            onOpenStockVerification={(warehouseId) => open({ kind: 'inventory', screen: 'M3S10', warehouseId })}
            onOpenTransfers={() => open({ kind: 'transfers' })}
            onOpenWarehouse={(warehouseId) => open({ kind: 'inventory', screen: 'M3S02', warehouseId })}
            onOpenNotifications={() => open({ kind: 'notifications' })}
          />
        );
      case 'Finance':
        // FinanceManagementFlow handles all sub-screen navigation internally.
        // The shell-level sub-flows (kind: 'finance', 'sales', 'wallet', etc.)
        // remain for external entry points (e.g. initialTohfaShellState('Sales')).
        return <FinanceManagementFlow can={adminCan} onBack={goHome} />;
      case 'More':
        return (
          <AdminMoreMenuScreen
            can={adminCan}
            onBack={goHome}
            canSwitchRole={canSwitchRole}
            onLogout={signOut}
            handlers={{
              farmers: () => openFarmers('list'),
              purchase_sales: () => open({ kind: 'purchaseOrders' }),
              produce: () => open({ kind: 'produce' }),
              audit: () => open({ kind: 'audits' }),
              pricing: () => open({ kind: 'pricing' }),
              customers: () => open({ kind: 'customersManagement' }),
              allocation: () => open({ kind: 'inventory', screen: 'M3S07' }),
              sales_orders: () => open({ kind: 'orders' }),
              staff: () => open({ kind: 'staff', screen: 'Staff' }),
              reports: () => open({ kind: 'reports' }),
              notifications: () => open({ kind: 'notifications' }),
              settings: () => open({ kind: 'settings' }),
              ...(canSwitchRole && switchTarget !== undefined
                ? { switch_role: () => onSwitchRole?.(switchTarget) }
                : {}),
            }}
          />
        );
      default:
        return (
          <TohfaHomeScreen
            can={adminCan}
            user={user}
            onOpenNotifications={() => open({ kind: 'notifications' })}
            onOpenProfile={() => open({ kind: 'settings' })}
            onOpenPendingApplications={() => openFarmers('pendingApplications')}
            onOpenFarmers={() => openFarmers('list')}
            onOpenPricing={() => open({ kind: 'pricing' })}
            onOpenInventory={() => selectTab('Inventory')}
            onOpenFinance={() => selectTab('Finance')}
            onOpenTransfers={() => open({ kind: 'transfers' })}
            onOpenCashTopUp={() => open({ kind: 'wallet' })}
            onOpenReceiving={() => open({ kind: 'receiving' })}
            onOpenStaff={() => open({ kind: 'staff', screen: 'Staff' })}
            onCreateStaff={() => open({ kind: 'staff', screen: 'EditStaffProfile' })}
            onOpenInvoices={() => open({ kind: 'billing' })}
            onOpenListingApproval={() => open({ kind: 'listings' })}
            onOpenPurchaseOrders={() => open({ kind: 'purchaseOrders' })}
            onOpenWorkQueue={() => selectTab('WorkQueue')}
            onOpenOperationsOverview={() => selectTab('Inventory')}
          />
        );
    }
  };

  // A flow that cannot render yet (Farmers before /auth/me grants view_all)
  // leaves its tab on screen with the bar, never a blank page.
  const flowNode = route.flow === null ? null : renderFlow(route.flow);

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={adminColors.canvas} />
      {flowNode !== null ? (
        <View style={styles.body}>{flowNode}</View>
      ) : (
        <>
          <View style={styles.body}>{renderTab(route.tab)}</View>
          <TohfaTabBar activeTab={route.tab} onSelect={selectTab} />
        </>
      )}
    </SafeAreaView>
  );
}
