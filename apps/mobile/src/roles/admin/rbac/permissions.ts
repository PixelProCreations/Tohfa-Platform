/**
 * The docs/rbac.json permission codes admin screens gate UI on.
 *
 * Narrowing `can()` to this union makes a typo or an invented code a compile
 * error, and tests/permissions.test.ts fails if any entry here is missing from
 * docs/rbac.json. To gate on a new code: add it to rbac.json first (if it is
 * truly new, that is a spec change), then here.
 *
 * Gating is presentation only — the server re-checks every call (root
 * CLAUDE.md §2.1).
 */
import { createCan, type Can } from '../../../shell/rbac/can';

export const ADMIN_PERMISSION_CODES = [
  'auth.principal.view_own',
  'auth.profile.edit_own',
  'warehouse.own.view',
  'warehouse.profile.edit',
  'invoice.view_own',
  'invoice.generate',
  'customer.wallet.view',
  'wallet.cash_topup.process',
  'wallet.cash_topup.fiscal_tag',
  'wallet.manual_credit_debit',
  'rma.request.process',
  'inventory.quality_check.perform',
  'rma.refund.approve',
  'rma.refund.wallet_process',
  'rma.refund.bank_process',
  'auth.password.change_own',
  'auth.session.terminate_other',
  'notification.own.admin_preferences',
  'help.article.view',
  'inventory.batch.view',
  'warehouse.all.view',
] as const;

export type AdminPermissionCode = (typeof ADMIN_PERMISSION_CODES)[number];
export type AdminCan = Can<AdminPermissionCode>;

export function createAdminCan(permissions: readonly string[] | undefined): AdminCan {
  return createCan<AdminPermissionCode>(permissions);
}
