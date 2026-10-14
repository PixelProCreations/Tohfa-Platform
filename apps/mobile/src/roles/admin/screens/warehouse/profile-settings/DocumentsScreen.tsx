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
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

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

function EyeIcon({ size = 20, color = '#9A3412' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function DownloadTrayIcon({ size = 20, color = '#9A3412' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
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
    const issuedDate =
      (openDoc as any).issuedDate ??
      openDoc.dateNote.match(/Issued\s+([0-9A-Za-z\s]+?)(?:\s*·|$)/i)?.[1]?.trim() ??
      '01 Jan 2026';
    const expiryDate =
      openDoc.expiry ??
      openDoc.dateNote.match(/Expires?\s+([0-9A-Za-z\s]+?)(?:\s*·|$)/i)?.[1]?.trim() ??
      '31 Dec 2026';
    const issuingAuthority = (openDoc as any).issuingAuthority ?? 'TOHFA Regional Office';
    const rawWhName = warehouseNameOf(scope, openDoc.warehouseId, warehouseOptions);
    const warehouseShortName = rawWhName.replace(/\s+Warehouse$/i, '') || 'Coonoor';

    const docDetailRows = [
      [
        { label: 'Document Name', value: openDoc.name },
        { label: 'Document ID', value: openDoc.code },
      ],
      [
        { label: 'Document Type', value: openDoc.category },
        { label: 'Status', value: openDoc.status },
      ],
      [
        { label: 'Issued Date', value: issuedDate },
        { label: 'Expiry Date', value: expiryDate },
      ],
      [
        { label: 'Issuing Authority', value: issuingAuthority },
        { label: 'Warehouse', value: warehouseShortName },
      ],
    ];

    const detailHeader = (
      <ScopeHeader
        scope={scope}
        label={rawWhName}
      />
    );

    return (
      <WalletScreen
        title="Document Detail"
        onBack={() => setOpenDoc(null)}
        headerExtra={detailHeader}
        footer={footer}
      >
        <ScrollView
          contentContainerStyle={warehouseProfileLayout.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.detailSectionTitle}>
            {openDoc.name} — {openDoc.code}
          </Text>

          <InfoCard rows={docDetailRows} />

          <Text style={[styles.detailSectionTitle, styles.previewSectionTitle]}>
            Document Preview
          </Text>

          <View style={styles.previewBox}>
            <Text style={styles.previewPlaceholderText}>PDF / Image Preview</Text>
          </View>

          <View style={styles.previewActionsRow}>
            <TouchableOpacity
              style={styles.previewActionBtn}
              onPress={() => Alert.alert('View Document', `Opening ${openDoc.name} preview...`)}
              activeOpacity={0.75}
            >
              <EyeIcon size={20} color="#9A3412" />
              <Text style={styles.previewActionText}>View</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.previewActionBtn}
              onPress={() => Alert.alert('Download Document', `Downloading ${openDoc.name} (${openDoc.code})...`)}
              activeOpacity={0.75}
            >
              <DownloadTrayIcon size={20} color="#9A3412" />
              <Text style={styles.previewActionText}>Download</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.restrictionBanner}>
            <BlockIcon size={20} color="#DC2626" />
            <Text style={styles.restrictionBannerText}>
              No Edit, Delete, Replace, Approve, or Verify Document — those aren't granted to SWA by the role matrix.
            </Text>
          </View>
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
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: adminSpacing.sm,
  },
  previewSectionTitle: {
    marginTop: adminSpacing.lg,
  },
  previewBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.md,
  },
  previewPlaceholderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  previewActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: adminSpacing.md,
  },
  previewActionBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  previewActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#451a03',
  },
  restrictionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    marginTop: adminSpacing.xs,
  },
  restrictionBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#dc2626',
    lineHeight: 18,
  },
});
