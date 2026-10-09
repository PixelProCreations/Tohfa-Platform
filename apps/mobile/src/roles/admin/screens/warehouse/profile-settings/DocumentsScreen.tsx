// Design id: M15-S05
/**
 * Warehouse Documents for the Main and Sub warehouse admins (FINAL_LIST #88).
 *
 * Was roles/subwarehouse SubWarehouseDocumentsScreen. Absorbs
 * dashboard/MainWarehouseDocumentsScreen (pair_table M15-S05): its "Document
 * Detail" step (name / id / status / expiry card and the "No Edit, Delete,
 * Replace, Approve or Verify here" notice) replaces the Sub list's Alert, for
 * both roles. Its View / Download buttons had no handler; they are shown
 * disabled with a note until a document-file endpoint exists (SPEC_GAPS W4m-3).
 *
 * Gate: none. Read-only for both roles: no upload control (an upload would
 * need upload.signed_url.create and a document endpoint, neither wired here).
 * Sub sees its own warehouse's documents (locked pill); Main sees all four
 * warehouses with the all-warehouses selector and a warehouse line per card.
 * The Sub search bar's filter button (an Alert that did nothing) is dropped;
 * the category chips are the filter.
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import {
  ChipGroup,
  EmptyState,
  InfoCard,
  InfoNote,
  inScope,
  isAllWarehouses,
  KpiRow,
  PermissionNote,
  ScopeHeader,
  SearchBar,
  StatusBadge,
  WalletButton,
  WalletScreen,
  WarehouseTabBar,
} from '../wallet-cashtopup/WalletParts';
import { BlockIcon } from './ProfileParts';
import type { DocumentCategory, WarehouseDocItem, WarehouseScreenBaseProps, WarehouseSelectionProps } from './types';
import { PROFILE_WAREHOUSES, WAREHOUSE_DOCUMENTS } from './warehouseFixtures';
import { warehouseNameOf, warehouseProfileLayout, WarningTriangleIcon } from './WarehouseProfileParts';

type CategoryFilter = 'All' | DocumentCategory;
const CATEGORIES: readonly CategoryFilter[] = ['All', 'Registration', 'Compliance', 'License', 'Other'];

export interface DocumentsScreenProps extends WarehouseScreenBaseProps, WarehouseSelectionProps {
  documents?: readonly WarehouseDocItem[] | undefined;
}

export function DocumentsScreen({
  scope,
  onBack,
  onTabChange,
  warehouseOptions = PROFILE_WAREHOUSES,
  selectedWarehouseId,
  onSelectWarehouse,
  documents = WAREHOUSE_DOCUMENTS,
}: DocumentsScreenProps) {
  const isMain = isAllWarehouses(scope);
  const [localSelection, setLocalSelection] = useState<string | undefined>(undefined);
  const selected = onSelectWarehouse ? selectedWarehouseId : localSelection;
  const select = onSelectWarehouse ?? setLocalSelection;

  const [category, setCategory] = useState<CategoryFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [openDoc, setOpenDoc] = useState<WarehouseDocItem | null>(null);

  const visible = useMemo(() => documents.filter((d) => inScope(scope, d.warehouseId, selected)), [documents, scope, selected]);
  const filtered = visible.filter((doc) => {
    const q = searchQuery.toLowerCase().trim();
    const matchCategory = category === 'All' || doc.category === category;
    const matchQuery =
      !q || doc.name.toLowerCase().includes(q) || doc.code.toLowerCase().includes(q) || doc.category.toLowerCase().includes(q);
    return matchCategory && matchQuery;
  });

  const header = (
    <ScopeHeader scope={scope} warehouseOptions={warehouseOptions} selectedWarehouseId={selected} onSelectWarehouse={select} />
  );
  const footer = onTabChange ? <WarehouseTabBar onTabChange={onTabChange} onBack={onBack} /> : undefined;

  if (openDoc !== null) {
    return (
      <WalletScreen title="Document Detail" onBack={() => setOpenDoc(null)} footer={footer}>
        <ScrollView contentContainerStyle={warehouseProfileLayout.scrollContent} showsVerticalScrollIndicator={false}>
          <InfoCard
            rows={[
              [
                { label: 'Document Name', value: openDoc.name },
                { label: 'Document ID', value: openDoc.code },
              ],
              [
                { label: 'Status', value: openDoc.status },
                { label: 'Expiry', value: openDoc.expiry ?? '—' },
              ],
              [
                { label: 'Category', value: openDoc.category },
                { label: 'Warehouse', value: warehouseNameOf(scope, openDoc.warehouseId, warehouseOptions) },
              ],
            ]}
          />
          <View style={warehouseProfileLayout.gap} />
          <View style={styles.actionRow}>
            <WalletButton label="View" variant="outline" flex disabled onPress={() => undefined} />
            <WalletButton label="Download" variant="outline" flex disabled onPress={() => undefined} />
          </View>
          <PermissionNote>Document files are not available in the app yet.</PermissionNote>
          <View style={warehouseProfileLayout.gap} />
          <InfoNote tone="danger" icon={<BlockIcon size={16} color={adminColors.danger.text} />}>
            No Edit, Delete, Replace, Approve or Verify here.
          </InfoNote>
        </ScrollView>
      </WalletScreen>
    );
  }

  return (
    <WalletScreen title="Warehouse Documents" onBack={onBack} headerExtra={header} footer={footer}>
      <ScrollView
        contentContainerStyle={warehouseProfileLayout.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <KpiRow
          items={[
            { value: String(visible.length), label: 'TOTAL' },
            { value: String(visible.filter((d) => d.status === 'Active').length), label: 'ACTIVE', tone: 'success' },
            { value: String(visible.filter((d) => d.status === 'Expiring Soon').length), label: 'EXPIRING SOON', tone: 'warning' },
          ]}
        />
        <View style={warehouseProfileLayout.gap} />
        <ChipGroup options={CATEGORIES} value={category} onChange={setCategory} />
        <View style={warehouseProfileLayout.gap} />
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Document name, ID, type" />
        <View style={warehouseProfileLayout.gap} />
        {filtered.length === 0 ? (
          <EmptyState title="No Documents Found" subtitle="Try clearing your search query or selecting another category filter." />
        ) : (
          filtered.map((doc) => {
            const expiring = doc.status === 'Expiring Soon';
            return (
              <TouchableOpacity
                key={doc.id}
                style={styles.docCard}
                onPress={() => setOpenDoc(doc)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={doc.name}
              >
                <View style={styles.docText}>
                  <Text style={styles.docTitle}>{doc.name}</Text>
                  <Text style={styles.docMeta}>
                    {doc.code}
                    {isMain ? ` · ${warehouseNameOf(scope, doc.warehouseId, warehouseOptions)}` : ''}
                  </Text>
                  <Text style={styles.docMeta}>{doc.dateNote}</Text>
                </View>
                <View style={styles.badgeRow}>
                  {expiring ? <WarningTriangleIcon /> : null}
                  <StatusBadge label={doc.status} tone={expiring ? 'warning' : 'success'} />
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  actionRow: { flexDirection: 'row', gap: adminSpacing.md },
  docCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: adminSpacing.sm,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
  },
  docText: { flex: 1 },
  docTitle: { ...adminType.rowTitle, color: adminColors.ink },
  docMeta: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.xs },
});
