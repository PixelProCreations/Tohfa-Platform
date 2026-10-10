/**
 * Needs Attention: the sales & order resolution queue (payment pending, stock
 * discrepancy, failed sale, invoice review), with a mock resolve action per
 * card. Opened from the Sales hub's Needs Attention card in both shells.
 *
 * Gate (FINAL_LIST 25): Shared. Sub lists only its own warehouse's items
 * (order.list.view_all is SUB own), Main all four warehouses with the
 * warehouse shown per card. 'Approve & Issue Invoice' is enabled only with
 * `invoice.generate`; 'Edit Tax Details' needs `invoice.gst.generate`, which no
 * warehouse role holds, so it is hidden. The payment / stock resolutions have
 * no code (SPEC_GAPS W4z-1) and stay ungated mocks. The server re-checks every
 * action (CLAUDE.md 2.1); there is no queue endpoint yet.
 */
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType, type AdminTone } from '../../../theme';
import {
  ChipGroup,
  EmptyState,
  PermissionNote,
  StatusBadge,
  WalletButton,
  WalletScreen,
  inScope,
  isAllWarehouses,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { warehouseNameOf } from '../wallet-cashtopup/fixtures';
import { NEEDS_ATTENTION_ITEMS } from './fixtures';
import type {
  AttentionAction,
  AttentionCategory,
  AttentionFilter as CategoryFilter,
  AttentionItem,
  WarehouseScreenBaseProps,
} from './types';

const FILTERS: readonly CategoryFilter[] = ['all', 'payment_pending', 'stock_issue', 'failed_sale', 'invoice_issue'];

const FILTER_LABEL: Record<CategoryFilter, string> = {
  all: 'All',
  payment_pending: 'Payment Pending',
  stock_issue: 'Stock Issue',
  failed_sale: 'Failed Sale',
  invoice_issue: 'Invoice Issue',
};

const CATEGORY_TONE: Record<AttentionCategory, AdminTone> = {
  payment_pending: 'warning',
  stock_issue: 'danger',
  failed_sale: 'danger',
  invoice_issue: 'warning',
};

interface IconProps {
  color: string;
}

function MoneyIcon({ color }: IconProps) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="12" rx="2" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
      <Path d="M6 12h.01M18 12h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function StockBoxIcon({ color }: IconProps) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <Path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ExclamationCircleIcon({ color }: IconProps) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 8v4M12 16h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function InvoiceDocumentIcon({ color }: IconProps) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CategoryIcon({ category }: { category: AttentionCategory }) {
  const color = adminColors[CATEGORY_TONE[category]].text;
  switch (category) {
    case 'payment_pending':
      return <MoneyIcon color={color} />;
    case 'stock_issue':
      return <StockBoxIcon color={color} />;
    case 'failed_sale':
      return <ExclamationCircleIcon color={color} />;
    default:
      return <InvoiceDocumentIcon color={color} />;
  }
}

export interface NeedsAttentionScreenProps extends WarehouseScreenBaseProps {
  items?: readonly AttentionItem[] | undefined;
  initialCategory?: CategoryFilter | undefined;
}

export function NeedsAttentionScreen({
  scope,
  can,
  onBack,
  items: initialItems = NEEDS_ATTENTION_ITEMS,
  initialCategory = 'all',
}: NeedsAttentionScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>(initialCategory);
  const [items, setItems] = useState<readonly AttentionItem[]>(initialItems);

  const allWarehouses = isAllWarehouses(scope);
  const inView = items.filter((item) => inScope(scope, item.warehouseId));
  const open = inView.filter((item) => !item.resolved);
  const countOf = (filter: CategoryFilter) => open.filter((i) => filter === 'all' || i.category === filter).length;
  const filteredItems = inView.filter((item) => selectedCategory === 'all' || item.category === selectedCategory);

  /** Visible actions of a card: hidden without the code when the action says so. */
  const actionsOf = (item: AttentionItem): AttentionAction[] =>
    [item.secondaryAction, item.primaryAction].filter(
      (a): a is AttentionAction => a !== undefined && !(a.hideWithoutCode === true && a.code !== undefined && !can(a.code)),
    );

  const resolve = (item: AttentionItem, action: AttentionAction) => {
    Alert.alert(action.label, `Execute "${action.label}" for ${item.id} (${item.customer})?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        style: 'default',
        onPress: () => {
          setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, resolved: true } : i)));
          Alert.alert('Action Completed', `Issue for ${item.id} has been resolved successfully.`);
        },
      },
    ]);
  };

  const scopeLabel = allWarehouses ? 'All Warehouses' : (scope.warehouseName ?? scope.warehouseId ?? '');

  return (
    <WalletScreen
      title="Needs Attention"
      subtitle={`${scopeLabel} · Sales & Order Resolution Queue`}
      onBack={onBack}
      headerRight={
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{open.length} Active</Text>
        </View>
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.filters}>
          <ChipGroup
            options={FILTERS}
            value={selectedCategory}
            onChange={setSelectedCategory}
            labelOf={(f) => `${FILTER_LABEL[f]} (${countOf(f)})`}
          />
        </View>

        {filteredItems.length === 0 ? (
          <EmptyState title="All Issues Resolved!" subtitle="There are no pending alerts in this category right now." />
        ) : (
          filteredItems.map((item) => {
            const tone = CATEGORY_TONE[item.category];
            const actions = actionsOf(item);
            const blocked = actions.filter((a) => a.code !== undefined && !can(a.code));
            return (
              <View
                key={item.id}
                style={[
                  styles.card,
                  { borderLeftColor: item.resolved ? adminColors.success.border : adminColors[tone].border },
                  item.resolved && styles.cardResolved,
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View style={[styles.iconCircle, { backgroundColor: adminColors[tone].bg }]}>
                      <CategoryIcon category={item.category} />
                    </View>
                    <View style={styles.flex}>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <Text style={styles.cardMeta}>
                        {item.id} · {item.channel}
                        {allWarehouses ? ` · ${warehouseNameOf(item.warehouseId)}` : ''}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cardHeaderRight}>
                    <Text style={styles.cardAmount}>{item.amount}</Text>
                    {item.resolved ? <StatusBadge label="Resolved" tone="success" /> : <Text style={styles.cardMeta}>{item.time}</Text>}
                  </View>
                </View>

                <Text style={styles.customerText}>Customer: {item.customer}</Text>
                <View style={styles.noteBox}>
                  <Text style={styles.noteText}>{item.note}</Text>
                </View>

                {!item.resolved && actions.length > 0 ? (
                  <View style={styles.cardActions}>
                    {actions.map((action) => (
                      <WalletButton
                        key={action.label}
                        label={action.label}
                        variant={action === item.primaryAction ? 'primary' : 'outline'}
                        disabled={action.code !== undefined && !can(action.code)}
                        flex
                        onPress={() => resolve(item, action)}
                      />
                    ))}
                  </View>
                ) : null}
                {!item.resolved && blocked.length > 0 ? (
                  <PermissionNote>{blocked.map((a) => `${a.label} needs ${a.code ?? ''}.`).join(' ')}</PermissionNote>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>
    </WalletScreen>
  );
}

const ICON_CIRCLE = 40;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerBadge: {
    backgroundColor: adminColors.brandTint,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.full,
  },
  headerBadgeText: { ...adminType.caption, color: adminColors.brandDeep },
  filters: { marginTop: adminSpacing.sm, marginBottom: adminSpacing.md },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderLeftWidth: 4,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
    gap: adminSpacing.sm,
    ...adminShadow.sm,
  },
  cardResolved: { opacity: 0.75 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: adminSpacing.sm },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.sm, flex: 1 },
  cardHeaderRight: { alignItems: 'flex-end', gap: adminSpacing.xs },
  iconCircle: {
    width: ICON_CIRCLE,
    height: ICON_CIRCLE,
    borderRadius: adminRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { ...adminType.sectionHead, color: adminColors.ink },
  cardMeta: { ...adminType.rowMeta, color: adminColors.muted },
  cardAmount: { ...adminType.kpiValue, color: adminColors.ink },
  customerText: { ...adminType.body, color: adminColors.ink },
  noteBox: { backgroundColor: adminColors.canvas, borderRadius: adminRadius.md, padding: adminSpacing.sm },
  noteText: { ...adminType.body, color: adminColors.muted },
  cardActions: { flexDirection: 'row', gap: adminSpacing.sm },
});
