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
 * Absorbs Main CustomerDetailScreen (pair M7-S03: "MWA view-only w/ Primary
 * Warehouse field"): for the Main view the header carries "name · id", the
 * Basic Information card shows the Primary Warehouse, and the view-only note
 * is shown.
 */
// Design id: M7-S03
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import {
  cardStyles,
  ChipRow,
  CustomersScreen,
  InfoGrid,
  isAllWarehouses,
  LinkButton,
  NoteBox,
  resolveCustomer,
  SectionHeading,
  StatTiles,
  StatusBadge,
  type InfoField,
} from './CustomersParts';
import { DEFAULT_CUSTOMER } from './fixtures';
import type { CustomerRef, WarehouseScreenBaseProps } from './types';

export interface CustomerDetailsScreenProps extends WarehouseScreenBaseProps {
  customer?: CustomerRef | undefined;
  onNavigateToOrders?: (() => void) | undefined;
  onNavigateToPurchases?: (() => void) | undefined;
  onNavigateToWallet?: (() => void) | undefined;
  onNavigateToIssues?: (() => void) | undefined;
  onNavigateToSupport?: (() => void) | undefined;
  /** Rendered only with can('invoice.generate'). */
  onNavigateToNewSale?: (() => void) | undefined;
  /** Rendered only with can('wallet.cash_topup.process'). */
  onNavigateToCashTopUp?: (() => void) | undefined;
}

type DetailTab = 'Overview' | 'Orders' | 'Purchases' | 'Wallet' | 'Issues' | 'Support';
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

/** One "recent" card inside a tab, with its link to the full list. */
function RecentCard({
  code,
  badge,
  lines,
  onPress,
  linkLabel,
}: {
  code?: string | undefined;
  badge?: React.ReactNode;
  lines: readonly string[];
  onPress?: (() => void) | undefined;
  linkLabel: string;
}) {
  return (
    <>
      <TouchableOpacity style={cardStyles.card} onPress={onPress} activeOpacity={0.8} accessibilityRole="button">
        {code ? (
          <View style={cardStyles.rowBetween}>
            <Text style={cardStyles.code}>{code}</Text>
            {badge}
          </View>
        ) : null}
        {lines.map((line) => (
          <Text key={line} style={cardStyles.meta}>
            {line}
          </Text>
        ))}
      </TouchableOpacity>
      <LinkButton label={linkLabel} onPress={onPress} />
    </>
  );
}

export function CustomerDetailsScreen({
  scope,
  can,
  onBack,
  customer,
  onNavigateToOrders,
  onNavigateToPurchases,
  onNavigateToWallet,
  onNavigateToIssues,
  onNavigateToSupport,
  onNavigateToNewSale,
  onNavigateToCashTopUp,
}: CustomerDetailsScreenProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>('Overview');
  const allWarehouses = isAllWarehouses(scope);

  const c = resolveCustomer(customer);
  const code = customer?.code ?? customer?.id ?? DEFAULT_CUSTOMER.code;
  const purchases = c.totalPurchases ?? '₹0';
  const wallet = c.walletBalance ?? '₹0';
  const openIssues = c.openIssues ?? 0;
  const initials = c.name
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const canNewSale = can('invoice.generate');
  const canCashTopUp = can('wallet.cash_topup.process');

  const basicRows: InfoField[][] = [
    [
      { label: 'Customer Name', value: c.name },
      { label: 'Customer ID', value: code },
    ],
    [
      { label: 'Mobile', value: c.phone },
      { label: 'Email', value: c.email ?? '-' },
    ],
    [
      { label: 'Account Status', value: c.status },
      { label: 'Registration Date', value: c.regDate ?? '-' },
    ],
  ];
  // Main twin: Primary Warehouse field.
  if (allWarehouses) basicRows.push([{ label: 'Primary Warehouse', value: c.warehouseName ?? '-' }]);

  return (
    <CustomersScreen
      title="Customer Details"
      subtitle={allWarehouses ? `${c.name} · ${code}` : undefined}
      onBack={onBack}
    >
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.heroName}>{c.name}</Text>
        <Text style={cardStyles.meta}>
          {code} · {c.phone}
        </Text>
        {c.email ? <Text style={cardStyles.meta}>{c.email}</Text> : null}
        <View style={styles.heroBadge}>
          <StatusBadge label={c.status} tone={c.status === 'Active' ? 'success' : 'danger'} />
        </View>
      </View>

      <StatTiles
        columns={2}
        items={[
          { label: 'Orders', value: c.ordersCount, onPress: onNavigateToOrders ?? (() => setActiveTab('Orders')) },
          { label: 'Purchases', value: purchases, onPress: onNavigateToPurchases ?? (() => setActiveTab('Purchases')) },
          { label: 'Wallet', value: wallet, onPress: onNavigateToWallet ?? (() => setActiveTab('Wallet')) },
          { label: 'Issues', value: openIssues, onPress: onNavigateToIssues ?? (() => setActiveTab('Issues')) },
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
                { label: 'Total Orders', value: c.ordersCount },
                { label: 'Completed', value: c.completedOrders ?? 0 },
              ],
              [
                { label: 'Cancelled', value: c.cancelledOrders ?? 0 },
                { label: 'Total Purchase Value', value: purchases },
              ],
              [
                { label: 'Last Purchase', value: c.lastPurchase },
                { label: 'Open Issues', value: openIssues },
              ],
            ]}
          />

          <SectionHeading>Quick Actions</SectionHeading>
          <View style={styles.actionsRow}>
            {canNewSale ? <QuickAction label="New Sale" icon={<CartIcon />} onPress={onNavigateToNewSale} /> : null}
            {canCashTopUp ? <QuickAction label="Cash Top-Up" icon={<CashIcon />} onPress={onNavigateToCashTopUp} /> : null}
            <QuickAction label="View Issues" icon={<AlertIcon />} onPress={onNavigateToIssues} />
          </View>

          {allWarehouses ? (
            <NoteBox text="Customer profiles are view-only here: no edit, disable or delete." />
          ) : null}
        </>
      ) : null}

      {activeTab === 'Orders' ? (
        <>
          <SectionHeading>Recent Orders</SectionHeading>
          <RecentCard
            code="ORD-00251"
            badge={<StatusBadge label="Ready for Pickup" tone="success" />}
            lines={['3 Items', '₹850']}
            onPress={onNavigateToOrders}
            linkLabel="View All Orders →"
          />
        </>
      ) : null}

      {activeTab === 'Purchases' ? (
        <>
          <SectionHeading>Recent Purchases</SectionHeading>
          <RecentCard
            code="INV-00251"
            badge={<StatusBadge label="Paid" tone="success" />}
            lines={['Tomato Grade 1 · 2 KG', '₹200']}
            onPress={onNavigateToPurchases}
            linkLabel="View Purchase History →"
          />
        </>
      ) : null}

      {activeTab === 'Wallet' ? (
        <>
          <SectionHeading>Wallet</SectionHeading>
          <RecentCard lines={['Available Balance', wallet]} onPress={onNavigateToWallet} linkLabel="View Wallet Summary →" />
        </>
      ) : null}

      {activeTab === 'Issues' ? (
        <>
          <SectionHeading>Recent Issues</SectionHeading>
          <RecentCard
            code="ISSUE-00231"
            badge={<StatusBadge label="In Review" tone="warning" />}
            lines={['Quality · Tomato Grade 1', '24 Sep 2026']}
            onPress={onNavigateToIssues}
            linkLabel="View All Issues →"
          />
        </>
      ) : null}

      {activeTab === 'Support' ? (
        <>
          <SectionHeading>Recent Support</SectionHeading>
          <RecentCard
            code="TKT-00104"
            badge={<StatusBadge label="Open" tone="info" />}
            lines={['Order Assistance & Support', '24 Sep 2026']}
            onPress={onNavigateToSupport}
            linkLabel="View All Support Tickets →"
          />
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
