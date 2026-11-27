import type { CanDeactivateFn, Routes } from '@angular/router';
import { authGuard, guestGuard, permissionGuard } from './core/permission.guard';

/**
 * Asks before leaving an edit screen with unsaved changes. Typed structurally so the lazily loaded
 * component is not pulled into the main bundle.
 */
const unsavedChangesGuard: CanDeactivateFn<{ canLeave(): boolean }> = (component) =>
  component?.canLeave() ?? true;

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
  { path: 'approvals', label: 'Approvals Inbox', permission: 'farmer.application.list_pending', icon: 'inbox', badge: '7' },
  { path: 'farmers', label: 'Farmers Management', permission: 'farmer.application.list_pending', icon: 'groups' },
  { path: 'listings', label: 'Produce & Crop', permission: 'listing.queue.view_pending', icon: 'agriculture' },
  { path: 'audits', label: 'Audit Management', permission: 'audit.view', icon: 'fact_check' },
  { path: 'inputs-pest', label: 'Inputs & Pest Management', permission: 'auth.principal.view_own', icon: 'pest_control' },
  { path: 'pricing', label: 'Market & Pricing', permission: 'pricing.fair_price.view', icon: 'currency_rupee' },
  { path: 'purchases', label: 'Purchase & Sales Management', permission: 'inventory.goods_receipt.record', icon: 'shopping_cart' },
  { path: 'inventory', label: 'Inventory & Warehouse', permission: 'inventory.stock_ledger.view_own', icon: 'warehouse' },
  { path: 'allocations', label: 'Reserve & Allocation', permission: 'allocation.dashboard.view', icon: 'sync_alt' },
  { path: 'customers', label: 'Customers Management', permission: 'auth.principal.view_own', icon: 'groups' },
  { path: 'payouts', label: 'Accounts & Finance', permission: 'payout.dues.view', icon: 'account_balance_wallet' },
  { path: 'workforce', label: 'Workforce & Staff', permission: 'wallet.cash_topup.process', icon: 'badge' },
  { path: 'community', label: 'Community & Knowledge Management', permission: 'auth.principal.view_own', icon: 'menu_book' },
  { path: 'reports', label: 'Notifications & Reports', permission: 'auth.principal.view_own', icon: 'notifications' },
  { path: 'settings', label: 'Settings', permission: 'auth.principal.view_own', icon: 'settings' },
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
          (await import('./features/approvals/approvals-inbox.component'))
            .ApprovalsInboxComponent,
      },

      {
        path: 'approvals/:id',
        canActivate: [permissionGuard('farmer.application.list_pending')],
        loadComponent: async () =>
          (await import('./features/approvals/approval-payout-detail.component'))
            .ApprovalPayoutDetailComponent,
      },

      {
        // Farmer Directory (SA-M3-S01). Guarded by the list endpoint's own permission; every
        // role holding the nav item's farmer.application.list_pending also holds this one.
        path: 'farmers',
        canActivate: [permissionGuard('farmer.profile.view_all')],
        loadComponent: async () =>
          (await import('./features/farmers/farmer-directory.component')).FarmerDirectoryComponent,
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
        path: 'produce-crops',
        canActivate: [permissionGuard('listing.queue.view_pending')],
        loadComponent: async () =>
          (await import('./features/listings/listings-queue.component')).ListingsQueueComponent,
      },

      {
        path: 'produce-crop',
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
        // Verification & Compliance list (UI only, placeholder data). Declared before `farmers/:id`.
        path: 'farmers/verification-compliance',
        canActivate: [permissionGuard('farmer.profile.view_all')],
        loadComponent: async () =>
          (await import('./features/farmer-compliance/farmer-compliance.component')).FarmerComplianceComponent,
      },

      {
        // Farmer Ratings list (UI only, placeholder data). Declared before `farmers/:id`.
        path: 'farmers/ratings',
        canActivate: [permissionGuard('farmer.rating.view')],
        loadComponent: async () =>
          (await import('./features/farmer-ratings-list/farmer-ratings-list.component')).FarmerRatingsListComponent,
      },

      {
        // Farm Records list (UI only, placeholder data). Declared before `farmers/:id` so
        // "farm-records" is never read as an id; guarded like the Farmer Directory it is reached from.
        path: 'farmers/farm-records',
        canActivate: [permissionGuard('farmer.profile.view_all')],
        loadComponent: async () =>
          (await import('./features/farm-records/farm-records-list.component')).FarmRecordsListComponent,
      },

      {
        // Add Farm Records (UI only — nothing is stored). Each tab's form confirms unsaved changes on
        // its own Cancel / Back; the forms are separate components, so the shell has no canLeave().
        path: 'farmers/farm-records/new',
        canActivate: [permissionGuard('farmer.profile.view_all')],
        loadComponent: async () =>
          (await import('./features/farm-records/farm-records-add.component')).FarmRecordsAddComponent,
      },

      {
        // Add Farmer Profile (SA-M3-S02d). Declared before `farmers/:id` so "new" is never read as
        // an id. Guarded by POST /admin/farmers's own permission (rbac.json has no separate create
        // code); the leave guard asks before discarding the draft.
        path: 'farmers/new',
        canActivate: [permissionGuard('farmer.profile.edit')],
        canDeactivate: [unsavedChangesGuard],
        loadComponent: async () =>
          (await import('./features/farmers/farmer-add.component')).FarmerAddComponent,
      },

      {
        path: 'farmers/:id/rating',
        canActivate: [permissionGuard('farmer.rating.view')],
        loadComponent: async () =>
          (await import('./features/farm-rating/farm-rating-detail.component'))
            .FarmRatingDetailComponent,
      },

      {
        // Edit Farmer Profile (SA-M3-S02a). Guarded by PATCH /admin/farmers/{id}'s own permission;
        // the leave guard asks before discarding unsaved edits.
        path: 'farmers/:id/edit',
        canActivate: [permissionGuard('farmer.profile.edit')],
        canDeactivate: [unsavedChangesGuard],
        loadComponent: async () =>
          (await import('./features/farmers/farmer-edit.component')).FarmerEditComponent,
      },

      {
        // Farmer Details. Declared after `farmers/:id/rating` so the more specific path is
        // tried first; guarded by GET /admin/farmers/{id}'s own permission.
        path: 'farmers/:id',
        canActivate: [permissionGuard('farmer.profile.view_all')],
        loadComponent: async () =>
          (await import('./features/farmers/farmer-detail.component')).FarmerDetailComponent,
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
          (await import('./features/inputs-pest/inputs-pest.component')).InputsPestComponent,
      },

      {
        path: 'audits',
        canActivate: [permissionGuard('audit.view')],
        loadComponent: async () =>
          (await import('./features/audits/audit-dashboard.component')).AuditDashboardComponent,
      },
      {
        path: 'audits/schedule',
        canActivate: [permissionGuard('audit.view')],
        loadComponent: async () =>
          (await import('./features/audits/audit-schedule-list.component')).AuditScheduleListComponent,
      },
      // The literal audit paths below must stay before 'audits/:id' (and 'audits/reports/history'
      // before 'audits/reports/:id') so they are not captured as ids.
      {
        path: 'audits/history',
        canActivate: [permissionGuard('audit.view')],
        loadComponent: async () =>
          (await import('./features/audits/audit-history.component')).AuditHistoryComponent,
      },
      {
        path: 'audits/reports',
        canActivate: [permissionGuard('audit.view')],
        loadComponent: async () =>
          (await import('./features/audits/audit-reports-config.component')).AuditReportsConfigComponent,
      },
      {
        path: 'audits/reports/history',
        canActivate: [permissionGuard('audit.view')],
        loadComponent: async () =>
          (await import('./features/audits/audit-report-history.component')).AuditReportHistoryComponent,
      },
      {
        path: 'audits/reports/:id',
        canActivate: [permissionGuard('audit.view')],
        loadComponent: async () =>
          (await import('./features/audits/audit-report-details.component')).AuditReportDetailsComponent,
      },
      {
        path: 'audits/:id',
        canActivate: [permissionGuard('audit.view')],
        loadComponent: async () =>
          (await import('./features/audits/audit-detail.component')).AuditDetailComponent,
      },
      {
        path: 'audits/:id/findings',
        canActivate: [permissionGuard('audit.view')],
        loadComponent: async () =>
          (await import('./features/audits/audit-findings.component')).AuditFindingsComponent,
      },
      {
        path: 'audits/:id/inspection',
        canActivate: [permissionGuard('audit.view')],
        loadComponent: async () =>
          (await import('./features/audits/audit-inspection.component')).AuditInspectionComponent,
      },
      {
        path: 'audits/:id/inspection/step/1',
        canActivate: [permissionGuard('audit.view')],
        loadComponent: async () =>
          (await import('./features/audits/audit-step-1-contact.component')).AuditStep1ContactComponent,
      },
      {
        path: 'audits/:id/inspection/step/2',
        canActivate: [permissionGuard('audit.view')],
        loadComponent: async () =>
          (await import('./features/audits/audit-step-2-fmb-land.component')).AuditStep2FmbLandComponent,
      },
      {
        path: 'audits/:id/inspection/step/3',
        canActivate: [permissionGuard('audit.view')],
        loadComponent: async () =>
          (await import('./features/audits/audit-step-3-farm-details.component')).AuditStep3FarmDetailsComponent,
      },
      {
        path: 'audits/:id/inspection/step/4',
        canActivate: [permissionGuard('audit.view')],
        loadComponent: async () =>
          (await import('./features/audits/audit-step-4-certification.component')).AuditStep4CertificationComponent,
      },
      {
        path: 'audits/:id/inspection/step/5',
        canActivate: [permissionGuard('audit.view')],
        loadComponent: async () =>
          (await import('./features/audits/audit-step-5-soil.component')).AuditStep5SoilComponent,
      },
      {
        path: 'audits/:id/inspection/step/6',
        canActivate: [permissionGuard('audit.view')],
        loadComponent: async () =>
          (await import('./features/audits/audit-step-6-water.component')).AuditStep6WaterComponent,
      },
      {
        path: 'audits/:id/inspection/step/7',
        canActivate: [permissionGuard('audit.view')],
        loadComponent: async () =>
          (await import('./features/audits/audit-step-7-practices.component')).AuditStep7PracticesComponent,
      },
      {
        path: 'audits/:id/inspection/step/8',
        canActivate: [permissionGuard('audit.view')],
        loadComponent: async () =>
          (await import('./features/audits/audit-step-8-documents.component')).AuditStep8DocumentsComponent,
      },
      {
        path: 'audits/:id/inspection/step/9',
        canActivate: [permissionGuard('audit.view')],
        loadComponent: async () =>
          (await import('./features/audits/audit-step-9-assessment.component')).AuditStep9AssessmentComponent,
      },
      {
        path: 'audits/:id/inspection/step/10',
        canActivate: [permissionGuard('audit.view')],
        loadComponent: async () =>
          (await import('./features/audits/audit-step-10-schedule.component')).AuditStep10ScheduleComponent,
      },
      {
        path: 'audits/:id/inspection/step/11',
        canActivate: [permissionGuard('audit.view')],
        loadComponent: async () =>
          (await import('./features/audits/audit-step-11-external.component')).AuditStep11ExternalComponent,
      },
      {
        path: 'audits/:id/inspection/step/12',
        canActivate: [permissionGuard('audit.view')],
        loadComponent: async () =>
          (await import('./features/audits/audit-step-12-rating.component')).AuditStep12RatingComponent,
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
