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

export interface AdminFlowProps {
  onExit: () => void;
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
];
