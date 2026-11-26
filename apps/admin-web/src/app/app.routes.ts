import type { Routes } from '@angular/router';
import { authGuard, guestGuard, permissionGuard } from './core/permission.guard';

export interface NavRoute {
  path: string;
  label: string;
  permission: string;
  icon?: string;
  badge?: string;
}

/** Drives both the router and the sidebar. Add a screen here, once. */
export const NAV: readonly NavRoute[] = [
  { path: 'dashboard', label: 'Dashboard', permission: 'auth.principal.view_own', icon: 'dashboard' },
  { path: 'approvals', label: 'Approvals Inbox', permission: 'farmer.application.list_pending', icon: 'inbox' },
  { path: 'farmer-applications', label: 'Farmers Management', permission: 'farmer.application.list_pending', icon: 'agriculture' },
  { path: 'listings', label: 'Produce & Crops', permission: 'listing.queue.view_pending', icon: 'eco' },
  { path: 'audits', label: 'Audit Management', permission: 'inventory.goods_receipt.record', icon: 'fact_check' },
  { path: 'inputs-pest', label: 'Inputs & Pest', permission: 'auth.principal.view_own', icon: 'pest_control' },
  { path: 'pricing', label: 'Market & Pricing', permission: 'pricing.fair_price.view', icon: 'currency_rupee' },
  { path: 'purchases', label: 'Purchases management', permission: 'inventory.goods_receipt.record', icon: 'shopping_cart' },
  { path: 'fulfilment', label: 'Sales management', permission: 'order.list.view_all', icon: 'bar_chart' },
  { path: 'inventory', label: 'Inventory & Warehouse', permission: 'inventory.stock_ledger.view_own', icon: 'warehouse' },
  { path: 'allocations', label: 'Reserve & Allocation', permission: 'allocation.dashboard.view', icon: 'sync_alt' },
  { path: 'customers', label: 'Customers Management', permission: 'auth.principal.view_own', icon: 'groups' },
  { path: 'payouts', label: 'Accounts & Finance', permission: 'payout.dues.view', icon: 'account_balance_wallet' },
  { path: 'workforce', label: 'Workforce & Staff', permission: 'wallet.cash_topup.process', icon: 'badge' },
  { path: 'reports', label: 'Notifications & Reports', permission: 'auth.principal.view_own', icon: 'notifications' },
  { path: 'settings', label: 'Settings & Profile', permission: 'auth.principal.view_own', icon: 'settings' },
];

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: async () =>
      (await import('./features/auth/login.component')).LoginComponent,
  },

  {
    path: '',
    canActivate: [authGuard],
    loadComponent: async () =>
      (await import('./layout/shell.component')).ShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

      {
        path: 'dashboard',
        canActivate: [permissionGuard('auth.principal.view_own')],
        loadComponent: async () =>
          (await import('./features/dashboard/dashboard.component')).DashboardComponent,
      },

      {
        path: 'alert-thresholds',
        canActivate: [permissionGuard('auth.principal.view_own')],
        loadComponent: async () =>
          (await import('./features/alert-thresholds/alert-thresholds.component'))
            .AlertThresholdsComponent,
      },

      {
        path: 'approvals',
        canActivate: [permissionGuard('farmer.application.list_pending')],
        loadComponent: async () =>
          (await import('./features/farmer-applications/farmer-applications-list.component'))
            .FarmerApplicationsListComponent,
      },

      {
        path: 'farmer-applications',
        canActivate: [permissionGuard('farmer.application.list_pending')],
        loadComponent: async () =>
          (await import('./features/farmer-applications/farmer-applications-list.component'))
            .FarmerApplicationsListComponent,
      },

      {
        path: 'farmer-applications/:id',
        canActivate: [permissionGuard('farmer.application.view')],
        loadComponent: async () =>
          (await import('./features/farmer-applications/farmer-application-detail.component'))
            .FarmerApplicationDetailComponent,
      },

      {
        path: 'warehouses',
        canActivate: [permissionGuard('warehouse.all.view')],
        loadComponent: async () =>
          (await import('./features/warehouses/warehouses.component')).WarehousesComponent,
      },

      {
        path: 'pricing',
        canActivate: [permissionGuard('pricing.fair_price.view')],
        loadComponent: async () =>
          (await import('./features/pricing/pricing-shell.component')).PricingShellComponent,
      },

      {
        path: 'listings',
        canActivate: [permissionGuard('listing.queue.view_pending')],
        loadComponent: async () =>
          (await import('./features/listings/listings-queue.component')).ListingsQueueComponent,
      },

      {
        path: 'goods-receipts',
        canActivate: [permissionGuard('inventory.goods_receipt.record')],
        loadComponent: async () =>
          (await import('./features/goods-receipt/goods-receipt-list.component'))
            .GoodsReceiptListComponent,
      },

      {
        path: 'purchases',
        canActivate: [permissionGuard('inventory.goods_receipt.record')],
        loadComponent: async () =>
          (await import('./features/goods-receipt/goods-receipt-list.component'))
            .GoodsReceiptListComponent,
      },

      {
        path: 'farmers/:id/rating',
        canActivate: [permissionGuard('farmer.rating.view')],
        loadComponent: async () =>
          (await import('./features/farm-rating/farm-rating-detail.component'))
            .FarmRatingDetailComponent,
      },

      {
        path: 'inventory',
        canActivate: [permissionGuard('inventory.stock_ledger.view_own')],
        loadComponent: async () =>
          (await import('./features/inventory/inventory-shell.component'))
            .InventoryShellComponent,
      },

      {
        path: 'inventory/batches/:id',
        canActivate: [permissionGuard('inventory.batch.view')],
        loadComponent: async () =>
          (await import('./features/inventory/batch-detail.component'))
            .BatchDetailComponent,
      },

      {
        path: 'allocations',
        canActivate: [permissionGuard('allocation.dashboard.view')],
        loadComponent: async () =>
          (await import('./features/inventory/allocation-dashboard.component'))
            .AllocationDashboardComponent,
      },

      {
        path: 'fulfilment',
        canActivate: [permissionGuard('order.list.view_all')],
        loadComponent: async () =>
          (await import('./features/fulfilment/fulfilment.component'))
            .FulfilmentComponent,
      },

      {
        path: 'payouts',
        canActivate: [permissionGuard('payout.dues.view')],
        loadComponent: async () =>
          (await import('./features/payouts/payouts.component')).PayoutsComponent,
      },

      {
        path: 'workforce',
        canActivate: [permissionGuard('wallet.cash_topup.process')],
        loadComponent: async () =>
          (await import('./features/wallet/cash-topup.component')).CashTopupComponent,
      },

      {
        path: 'wallet/cash-topup',
        canActivate: [permissionGuard('wallet.cash_topup.process')],
        loadComponent: async () =>
          (await import('./features/wallet/cash-topup.component')).CashTopupComponent,
      },

      {
        path: 'inputs-pest',
        canActivate: [permissionGuard('auth.principal.view_own')],
        data: { title: 'Inputs & Pest Management' },
        loadComponent: async () =>
          (await import('./features/placeholder/placeholder.component')).PlaceholderComponent,
      },

      {
        path: 'audits',
        canActivate: [permissionGuard('inventory.goods_receipt.record')],
        data: { title: 'Audit Management' },
        loadComponent: async () =>
          (await import('./features/placeholder/placeholder.component')).PlaceholderComponent,
      },

      {
        path: 'customers',
        canActivate: [permissionGuard('auth.principal.view_own')],
        data: { title: 'Customers Management' },
        loadComponent: async () =>
          (await import('./features/placeholder/placeholder.component')).PlaceholderComponent,
      },

      {
        path: 'reports',
        canActivate: [permissionGuard('auth.principal.view_own')],
        data: { title: 'Notifications & Reports' },
        loadComponent: async () =>
          (await import('./features/placeholder/placeholder.component')).PlaceholderComponent,
      },

      {
        path: 'settings',
        canActivate: [permissionGuard('auth.principal.view_own')],
        data: { title: 'Settings & Profile' },
        loadComponent: async () =>
          (await import('./features/placeholder/placeholder.component')).PlaceholderComponent,
      },

      {
        path: 'work-queue',
        canActivate: [permissionGuard('auth.principal.view_own')],
        loadComponent: async () =>
          (await import('./features/dashboard/dashboard.component')).DashboardComponent,
      },

      {
        path: 'alert-thresholds',
        canActivate: [permissionGuard('auth.principal.view_own')],
        loadComponent: async () =>
          (await import('./features/dashboard/dashboard.component')).DashboardComponent,
      },

      {
        path: 'forbidden',
        loadComponent: async () =>
          (await import('./layout/shell.component')).ForbiddenComponent,
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
