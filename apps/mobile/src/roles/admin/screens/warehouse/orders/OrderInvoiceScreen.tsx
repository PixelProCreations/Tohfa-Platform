/**
 * Order Invoice — the invoice of one customer order, read-only.
 *
 * Design id: M5S18 (M5S18_OrderInvoice).
 *
 * Live data: the flow passes the admin order detail (GET
 * /admin/orders/{orderId}), whose `invoice.id` names the order's invoice. That
 * invoice is shown by the billing area's LiveInvoiceDetail (GET /invoices/{id},
 * download through GET /invoices/{id}/download's signed link), so the order
 * invoice and the billing invoice detail are the same page with the same
 * download. Nothing here is sample data, and there is no Share action: the
 * signed link expires after 5 minutes (see InvoiceDetailScreen).
 *
 * The design's Order No. and Customer are not on the invoice (GET
 * /invoices/{id} has only the order uuid), so the order detail this screen
 * already holds is passed along; the invoice view shows its number and buyer
 * name only when the invoice names this order (invoiceOrderContext). The buyer
 * mobile, masked or not, is never shown there (BR-92).
 *
 * Gates (docs/rbac.json; the server re-checks everything, CLAUDE.md 2.1):
 *   - The page itself: `invoice.view_own` (availability.ts 'orderInvoices';
 *     OrdersFlow refuses the route without it). The server scopes the invoice
 *     to the caller (BR-36): outside it, the detail shows "not found".
 *   - There is deliberately no Generate action here: this screen views an
 *     invoice that already exists, and there is no create-invoice route.
 *
 * An order with no invoice yet shows an empty state; the order detail does not
 * offer the entry for one (orderInvoiceEntry), so only a deep link lands there.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { t } from '../../../i18n';
import { adminColors, adminType, adminSpacing } from '../../../theme';
import { LiveInvoiceDetail } from '../billing-invoices';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import { orderInvoiceEntry } from './mappers';
import type { OrderDetailView, OrderScreenBaseProps, OrdersLiveStateProps } from './types';

export interface OrderInvoiceScreenProps extends OrderScreenBaseProps, OrdersLiveStateProps {
  /** The order (useOrdersData useOrder); undefined while loading or when the route names no known order. */
  order?: OrderDetailView | undefined;
}

const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 };

function BackArrowIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={adminColors.onBrand}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function OrderInvoiceScreen({
  scope,
  can,
  onBack,
  onTabChange,
  order,
  isLoading = false,
  error,
  onRetry,
}: OrderInvoiceScreenProps) {
  const view = queryViewState({ isLoading, error, itemCount: order === undefined ? 0 : 1 });
  const invoiceId = order === undefined ? undefined : orderInvoiceEntry(order, can);

  if (view === 'ready' && invoiceId !== undefined) {
    // The order goes along for the invoice's Order No. and Customer rows (the invoice API carries neither).
    return <LiveInvoiceDetail scope={scope} can={can} invoiceId={invoiceId} order={order} onBack={onBack} onTabChange={onTabChange} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={onBack} hitSlop={HIT_SLOP}>
            <BackArrowIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('orders.invoice.title')}</Text>
        </View>
        {view === 'loading' ? (
          <AdminLoadingState />
        ) : view === 'error' ? (
          <AdminErrorState error={error} onRetry={onRetry} />
        ) : order === undefined ? (
          <AdminEmptyState title={t('orders.empty.notFound')} />
        ) : (
          <AdminEmptyState title={t('orders.invoice.none')} />
        )}
      </View>
    </SafeAreaView>
  );
}

// Fixed component size (no size token exists for it).
const BACK_BUTTON_SIZE = 32;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: adminColors.brand,
  },
  container: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.md,
    gap: adminSpacing.md,
  },
  backButton: {
    width: BACK_BUTTON_SIZE,
    height: BACK_BUTTON_SIZE,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
});
