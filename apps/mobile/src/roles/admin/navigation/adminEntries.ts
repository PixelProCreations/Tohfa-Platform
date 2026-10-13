/**
 * The admin home's entries — the ONE list later phases append to.
 *
 * Each entry names the availability feature that gates it (endpoint exists +
 * permission held, screens/warehouse/availability.ts) and the flow component
 * it opens. To add a module: append one object here; AdminHome needs no
 * change.
 */
import type React from 'react';
import type { TranslationKey } from '../i18n';
import type { WarehouseFeatureId } from '../screens/warehouse/availability';
import { BillingFlow } from '../screens/warehouse/billing-invoices/BillingFlow';
import { ProfileFlow } from '../screens/warehouse/profile/ProfileFlow';
import { WarehouseInfoFlow } from '../screens/warehouse/warehouse-info/WarehouseInfoFlow';
import type { AdminSignOut } from '../session/signOut';

export interface AdminFlowProps {
  onExit: () => void;
  /** Host-backed sign-out (TohfaAdminApp); flows that end the session use it. */
  signOut: AdminSignOut;
}

export interface AdminEntry {
  id: string;
  feature: WarehouseFeatureId;
  titleKey: TranslationKey;
  hintKey: TranslationKey;
  /** Material Symbols name for @tohfa/mobile-ui's Icon. */
  icon: string;
  Flow: React.ComponentType<AdminFlowProps>;
}

export const ADMIN_ENTRIES: readonly AdminEntry[] = [
  {
    id: 'invoices',
    feature: 'invoices',
    titleKey: 'admin.invoices.entry',
    hintKey: 'admin.invoices.entryHint',
    icon: 'receipt_long',
    Flow: BillingFlow,
  },
  {
    id: 'warehouseInfo',
    feature: 'warehouseProfile',
    titleKey: 'admin.warehouseInfo.entry',
    hintKey: 'admin.warehouseInfo.entryHint',
    icon: 'storefront',
    Flow: WarehouseInfoFlow,
  },
  {
    id: 'profile',
    feature: 'profileView',
    titleKey: 'admin.profile.entry',
    hintKey: 'admin.profile.entryHint',
    icon: 'person',
    Flow: ProfileFlow,
  },
];
