// Design id: M11-S06
/**
 * Expense Categories: the category list, READ-ONLY. Serves both warehouse
 * roles (it was SubWarehouseExpenseCategoriesScreen and absorbs
 * MainWarehouseExpenseCategoriesScreen).
 *
 * No docs/rbac.json code covers category management (add / edit / activate /
 * deactivate; SPEC_GAPS, FINAL_LIST #34), so this screen offers none of those
 * controls: the old header "+" (Sub: a "Restricted Action" alert; Main: a
 * button that did nothing) is gone rather than shown and then blocked. The
 * list itself is ungated (category names are reference data used by the
 * expense form).
 *
 * Main-only content ported: the note that Expense Entry and Finance Reports
 * use exactly this list (shown for the Main all-warehouses scope).
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { adminColors, adminSpacing, adminType } from '../../../theme';
import {
  Card,
  ChipGroup,
  EmptyState,
  InfoNote,
  isAllWarehouses,
  SearchBar,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { EXPENSE_CATEGORIES } from './fixtures';
import type { ExpenseCategoryItem, WarehouseScreenBaseProps } from './types';

const STATUS_FILTERS = ['All', 'Active', 'Inactive'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

export interface ExpenseCategoriesScreenProps extends WarehouseScreenBaseProps {
  categories?: readonly ExpenseCategoryItem[] | undefined;
}

export function ExpenseCategoriesScreen({ scope, onBack, categories = EXPENSE_CATEGORIES }: ExpenseCategoriesScreenProps) {
  const [filter, setFilter] = useState<StatusFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const query = searchQuery.trim().toLowerCase();
  const visible = categories.filter(
    (cat) => (filter === 'All' || cat.status === filter) && (!query || cat.name.toLowerCase().includes(query)),
  );

  return (
    <WalletScreen title="Expense Categories" onBack={onBack}>
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Search categories..." />
        <View style={styles.filters}>
          <ChipGroup options={STATUS_FILTERS} value={filter} onChange={setFilter} />
        </View>

        {visible.length === 0 ? (
          <EmptyState title="No categories found" subtitle="Try a different search or status." />
        ) : (
          <Card>
            {visible.map((item, index) => (
              <View key={item.id} style={[styles.row, index > 0 && styles.rowDivided]}>
                <View style={styles.textCol}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={item.status === 'Active' ? styles.statusActive : styles.statusInactive}>
                    • {item.status}
                  </Text>
                </View>
                <Text style={styles.used}>Used: {item.usedCount}</Text>
              </View>
            ))}
          </Card>
        )}

        {isAllWarehouses(scope) ? (
          <InfoNote tone="brandSoft">
            Expense Entry (S04) and Finance Reports (S10) both use exactly this category list; nothing is maintained
            separately.
          </InfoNote>
        ) : null}
        <InfoNote tone="warning">
          Adding, editing, activating or deactivating categories is configured by Top Admin / System Admin; no
          permission for it is granted here.
        </InfoNote>
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  filters: { marginBottom: adminSpacing.md },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: adminSpacing.sm },
  rowDivided: { borderTopWidth: 1, borderTopColor: adminColors.border },
  textCol: { flex: 1, gap: 2 },
  name: { ...adminType.rowTitle, color: adminColors.ink },
  statusActive: { ...adminType.rowMeta, color: adminColors.success.text },
  statusInactive: { ...adminType.rowMeta, color: adminColors.muted },
  used: { ...adminType.rowMeta, color: adminColors.muted },
});
