/**
 * Customer Details: read-only profile hub (overview + recent orders,
 * purchases, wallet, issues, support).
 *
 * Gates (FINAL_LIST row 10): the profile is read-only for customer.list.view.
 * The Cash Top-Up quick action renders only with can('wallet.cash_topup.process')
 * and New Sale only with can('invoice.generate'). There is no edit / credit
 * limit / suspend control anywhere: Customer Actions was dropped
 * (customer.profile.edit is none/none for both warehouse roles, SPEC_GAPS W4h-1).
 *
 * Live (plan phase 6): the profile is GET /admin/customers/{id}, by the
 * customer uuid. The mobile is the masked one exactly as sent; the e-mail,
 * the full mobile and any call / e-mail action appear only when the server
 * sent them unmasked (contactActions, BR-92). Orders, lifetime value and
 * wallet balance are the server's figures (lifetime value is confined to the
 * caller's warehouse for `own`, BR-91g). Each tab's recent card is the first
 * row of that list, drawn by the flow (`renderTabPreview`), so a tab fetches
 * only when opened.
 *
 * Hidden, because the API has no such figure: the Issues count tile, the
 * Completed / Cancelled order counts, Open Issues and the Main Primary
 * Warehouse field (the profile carries only a preferred warehouse id).
 */
// Design id: M7-S03
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import {
  cardStyles,
  ChipRow,
  CustomersScreen,
  InfoGrid,
  RecentCard,
  SectionHeading,
  StatTiles,
  StatusBadge,
  type InfoField,
} from './CustomersParts';
import { contactActions, mobileLabel } from './mappers';
import type { CustomerProfileView, CustomerRef, CustomersLiveStateProps, WarehouseScreenBaseProps } from './types';

/** A tab whose recent card is the first row of its own list. */
export type CustomerPreviewTab = 'Orders' | 'Purchases' | 'Issues' | 'Support';

export interface CustomerDetailsScreenProps extends WarehouseScreenBaseProps, CustomersLiveStateProps {
  /** What the caller already knows (the list row): the header while the profile loads. */
  customer?: CustomerRef | undefined;
  /** The profile, once loaded. */
  profile?: CustomerProfileView | undefined;
  /** The route carried no customer uuid: nothing can be looked up. */
  notFound?: boolean | undefined;
  /** Draws a tab's recent card (the flow fetches it when the tab opens). */
  renderTabPreview?: ((tab: CustomerPreviewTab) => React.ReactNode) | undefined;
  onNavigateToOrders?: (() => void) | undefined;
  onNavigateToPurchases?: (() => void) | undefined;
  onNavigateToWallet?: (() => void) | undefined;
  onNavigateToIssues?: (() => void) | undefined;
  /** Rendered only with can('invoice.generate'). */
  onNavigateToNewSale?: (() => void) | undefined;
  /** Rendered only with can('wallet.cash_topup.process'). */
  onNavigateToCashTopUp?: (() => void) | undefined;
}

type DetailTab = 'Overview' | CustomerPreviewTab | 'Wallet';
const DETAIL_TABS: readonly DetailTab[] = ['Overview', 'Orders', 'Purchases', 'Wallet', 'Issues', 'Support'];

function CartIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L21 7H6M10 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM18 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM13 9v4M11 11h4"
        stroke={adminColors.brand}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CashIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 6h18v12H3zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 9v.01M18 15v.01"
        stroke={adminColors.brand}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function AlertIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 8v5M12 16h.01"
        stroke={adminColors.brand}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function QuickAction({ label, icon, onPress }: { label: string; icon: React.ReactNode; onPress?: (() => void) | undefined }) {
  return (
    <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.75} accessibilityRole="button">
      {icon}
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function initialsOf(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

export function CustomerDetailsScreen({
  can,
  onBack,
  customer,
  profile,
  notFound = false,
  renderTabPreview,
  isLoading = false,
  error,
  onRetry,
  onRefresh,
  isRefreshing = false,
  onNavigateToOrders,
  onNavigateToPurchases,
  onNavigateToWallet,
  onNavigateToIssues,
  onNavigateToNewSale,
  onNavigateToCashTopUp,
}: CustomerDetailsScreenProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>('Overview');
  const title = 'Customer Details';

  if (notFound || profile === undefined) {
    const view = notFound ? 'empty' : queryViewState({ isLoading, error, itemCount: 0 });
    return (
      <CustomersScreen title={title} subtitle={customer?.name} onBack={onBack} onRefresh={notFound ? undefined : onRefresh} isRefreshing={isRefreshing}>
        {view === 'loading' ? (
          <AdminLoadingState />
        ) : view === 'error' ? (
          <AdminErrorState error={error} onRetry={onRetry} />
        ) : (
          <AdminEmptyState title={t('customers.empty.notFound')} />
        )}
      </CustomersScreen>
    );
  }

  const c = profile;
  const contact = contactActions(c);
  const canNewSale = can('invoice.generate');
  const canCashTopUp = can('wallet.cash_topup.process');
  const noValue = t('customers.noValue');
  const ordersCount = c.totalOrders ?? noValue;

  const basicRows: InfoField[][] = [
    [
      { label: 'Customer Name', value: c.name },
      { label: 'Customer ID', value: c.code },
    ],
    // The e-mail exists only for an unmasked actor (BR-92).
    contact.email
      ? [
          { label: 'Mobile', value: mobileLabel(c) },
          { label: 'Email', value: c.contact.email ?? noValue },
        ]
      : [{ label: 'Mobile', value: mobileLabel(c) }],
    [
      { label: 'Account Status', value: c.statusLabel },
      { label: 'Registration Date', value: c.registeredLabel },
    ],
    c.businessName === null
      ? [{ label: t('customers.detail.type'), value: c.customerTypeLabel }]
      : [
          { label: t('customers.detail.type'), value: c.customerTypeLabel },
          { label: t('customers.detail.businessName'), value: c.businessName },
        ],
  ];

  const preview = (tab: CustomerPreviewTab) => renderTabPreview?.(tab) ?? null;

  return (
    <CustomersScreen title={title} onBack={onBack} onRefresh={onRefresh} isRefreshing={isRefreshing}>
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initialsOf(c.name)}</Text>
        </View>
        <Text style={styles.heroName}>{c.name}</Text>
        <Text style={cardStyles.meta}>
          {c.code} · {mobileLabel(c)}
        </Text>
        {contact.email && c.contact.email !== null ? <Text style={cardStyles.meta}>{c.contact.email}</Text> : null}
        <View style={styles.heroBadge}>
          <StatusBadge label={c.statusLabel} tone={c.tone} />
        </View>
      </View>

      <StatTiles
        columns={2}
        items={[
          { label: 'Orders', value: ordersCount, onPress: onNavigateToOrders ?? (() => setActiveTab('Orders')) },
          { label: 'Purchases', value: c.lifetimeValueLabel, onPress: onNavigateToPurchases ?? (() => setActiveTab('Purchases')) },
          { label: 'Wallet', value: c.walletBalanceLabel, onPress: onNavigateToWallet ?? (() => setActiveTab('Wallet')) },
        ]}
      />

      <ChipRow options={DETAIL_TABS} selected={activeTab} onSelect={setActiveTab} scroll />

      {activeTab === 'Overview' ? (
        <>
          <SectionHeading>Basic Information</SectionHeading>
          <InfoGrid rows={basicRows} />

          <SectionHeading>Activity Summary</SectionHeading>
          <InfoGrid
            rows={[
              [
                { label: 'Total Orders', value: ordersCount },
                { label: 'Total Purchase Value', value: c.lifetimeValueLabel },
              ],
              [
                { label: t('customers.detail.lastOrder'), value: c.lastOrderLabel },
                { label: t('customers.list.lastActivity'), value: c.lastActivityLabel },
              ],
            ]}
          />

          <SectionHeading>Quick Actions</SectionHeading>
          <View style={styles.actionsRow}>
            {canNewSale ? <QuickAction label="New Sale" icon={<CartIcon />} onPress={onNavigateToNewSale} /> : null}
            {canCashTopUp ? <QuickAction label="Cash Top-Up" icon={<CashIcon />} onPress={onNavigateToCashTopUp} /> : null}
            <QuickAction label="View Issues" icon={<AlertIcon />} onPress={onNavigateToIssues} />
          </View>
        </>
      ) : null}

      {activeTab === 'Orders' ? (
        <>
          <SectionHeading>Recent Orders</SectionHeading>
          {preview('Orders')}
        </>
      ) : null}

      {activeTab === 'Purchases' ? (
        <>
          <SectionHeading>Recent Purchases</SectionHeading>
          {preview('Purchases')}
        </>
      ) : null}

      {activeTab === 'Wallet' ? (
        <>
          <SectionHeading>Wallet</SectionHeading>
          <RecentCard lines={['Available Balance', c.walletBalanceLabel]} onPress={onNavigateToWallet} linkLabel="View Wallet Summary →" />
        </>
      ) : null}

      {activeTab === 'Issues' ? (
        <>
          <SectionHeading>Recent Issues</SectionHeading>
          {preview('Issues')}
        </>
      ) : null}

      {activeTab === 'Support' ? (
        <>
          <SectionHeading>Recent Support</SectionHeading>
          {preview('Support')}
        </>
      ) : null}
    </CustomersScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    alignItems: 'center',
    marginBottom: adminSpacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.sm,
  },
  avatarText: { ...adminType.title, color: adminColors.brandDeep },
  heroName: { ...adminType.title, color: adminColors.ink },
  heroBadge: { marginTop: adminSpacing.sm },
  actionsRow: { flexDirection: 'row', gap: adminSpacing.sm, marginBottom: adminSpacing.md },
  actionCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    gap: adminSpacing.xs,
  },
  actionLabel: { ...adminType.rowTitle, color: adminColors.ink },
});
