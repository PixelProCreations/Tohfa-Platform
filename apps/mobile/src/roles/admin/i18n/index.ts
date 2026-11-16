/**
 * The admin's i18n entry point: the admin's own strings plus the shared
 * `error.<ErrorCode>` bucket, on the shared engine in src/i18n/runtime.ts
 * (the same one src/i18n/farmer.ts uses). That engine gives `{{param}}`
 * interpolation and a ta -> en fallback, so a key with no Tamil string still
 * renders in English instead of as its key.
 *
 * Why the catalogue stays here and not in src/i18n/: runtime.ts keeps each
 * role's strings in its own JSON so one role's import graph never pulls in
 * another role's catalogue. Admin screens import this file, never
 * src/i18n/farmer.ts or customer.ts.
 *
 * Admin screens show admin-facing errors through `admin.error.*` keys (see
 * ../api/errors.ts), worded for warehouse staff; the shared `error.*` bucket is
 * merged in only so a shared message key also resolves here.
 */
import errorsEn from '../../../i18n/errors.en.json';
import errorsTa from '../../../i18n/errors.ta.json';
import { createI18n, LOCALES, type Locale } from '../../../i18n/runtime';
import adminEn from './en.json';
import adminTa from './ta.json';
// Farmers Management catalogues: one file per screen group so parallel work never edits the same JSON.
import farmerAppsEn from './farmerApps.en.json';
import farmerAppsTa from './farmerApps.ta.json';
import farmerDetailEn from './farmerDetail.en.json';
import farmerDetailTa from './farmerDetail.ta.json';
import farmersEntryEn from './farmersEntry.en.json';
import farmersEntryTa from './farmersEntry.ta.json';
import farmersListEn from './farmersList.en.json';
import farmersListTa from './farmersList.ta.json';
// Settings & Notifications catalogues.
import settingsEn from './settings.en.json';
import settingsTa from './settings.ta.json';
// Market & Pricing catalogues: one file per screen group so parallel work never edits the same JSON.
import pricingCeilingEn from './pricingCeiling.en.json';
import pricingCeilingTa from './pricingCeiling.ta.json';
import pricingEntryEn from './pricingEntry.en.json';
import pricingEntryTa from './pricingEntry.ta.json';
import pricingRetailEn from './pricingRetail.en.json';
import pricingRetailTa from './pricingRetail.ta.json';
// Shared admin "More" menu catalogue.
import moreMenuEn from './moreMenu.en.json';
import moreMenuTa from './moreMenu.ta.json';
// Inventory & Warehouse overview (M10-S01) catalogue.
import warehouseOverviewEn from './warehouseOverview.en.json';
import warehouseOverviewTa from './warehouseOverview.ta.json';
// Tohfa Admin Home tab catalogue.
import tohfaHomeEn from './tohfaHome.en.json';
import tohfaHomeTa from './tohfaHome.ta.json';
// Tohfa Admin Accounts & Finance hub catalogue.
import financeHubEn from './financeHub.en.json';
import financeHubTa from './financeHub.ta.json';
// Tohfa Admin shell (bottom tab bar) catalogue.
import tohfaShellEn from './tohfaShell.en.json';
import tohfaShellTa from './tohfaShell.ta.json';
// Tohfa Admin Work Queue tab catalogue.
import workQueueEn from './workQueue.en.json';
import workQueueTa from './workQueue.ta.json';
// Purchase Orders catalogue.
import purchaseOrdersEn from './purchaseOrders.en.json';
import purchaseOrdersTa from './purchaseOrders.ta.json';
// Listing approval (Tohfa "Produce list") catalogue.
import listingsAdminEn from './listingsAdmin.en.json';
import listingsAdminTa from './listingsAdmin.ta.json';
// Notifications Center catalogue.
import notificationsCenterEn from './notificationsCenter.en.json';
import notificationsCenterTa from './notificationsCenter.ta.json';
// Super Admin screens (origin/Superadmin-main port): one file per screen group.
import saShellEn from './saShell.en.json';
import saApprovalsEn from './saApprovals.en.json';
import saThresholdsEn from './saThresholds.en.json';
import saSystemSettingsEn from './saSystemSettings.en.json';
// Audits screens (origin/Superadmin-main port): one file per screen group.
import auditsManagementEn from './auditsManagement.en.json';
import auditsScheduleEn from './auditsSchedule.en.json';
import auditsDashboardScheduleEn from './auditsDashboardSchedule.en.json';
import auditsInspectionOverviewEn from './auditsInspectionOverview.en.json';

export const en = {
  ...errorsEn,
  ...adminEn,
  ...settingsEn,
  ...farmersListEn,
  ...farmerDetailEn,
  ...farmerAppsEn,
  ...farmersEntryEn,
  ...pricingCeilingEn,
  ...pricingRetailEn,
  ...pricingEntryEn,
  ...moreMenuEn,
  ...warehouseOverviewEn,
  ...tohfaHomeEn,
  ...financeHubEn,
  ...tohfaShellEn,
  ...workQueueEn,
  ...purchaseOrdersEn,
  ...listingsAdminEn,
  ...notificationsCenterEn,
  ...saShellEn,
  ...saApprovalsEn,
  ...saThresholdsEn,
  ...saSystemSettingsEn,
  ...auditsManagementEn,
  ...auditsScheduleEn,
  ...auditsDashboardScheduleEn,
  ...auditsInspectionOverviewEn,
};
const ta: Record<string, string> = {
  ...errorsTa,
  ...adminTa,
  ...settingsTa,
  ...farmersListTa,
  ...farmerDetailTa,
  ...farmerAppsTa,
  ...farmersEntryTa,
  ...pricingCeilingTa,
  ...pricingRetailTa,
  ...pricingEntryTa,
  ...moreMenuTa,
  ...warehouseOverviewTa,
  ...tohfaHomeTa,
  ...financeHubTa,
  ...tohfaShellTa,
  ...workQueueTa,
  ...purchaseOrdersTa,
  ...listingsAdminTa,
  ...notificationsCenterTa,
};

export type TranslationKey = keyof typeof en;

export { LOCALES };
export type { Locale };

const instance = createI18n<TranslationKey>({ en, ta });

export const setLocale = instance.setLocale;
export const getLocale = instance.getLocale;
export const t = instance.t;
export const missingKeys = instance.missingKeys;

/** True when `key` has an English string, for keys built at runtime (error codes). */
export function hasKey(key: string): key is TranslationKey {
  return Object.prototype.hasOwnProperty.call(en, key);
}
