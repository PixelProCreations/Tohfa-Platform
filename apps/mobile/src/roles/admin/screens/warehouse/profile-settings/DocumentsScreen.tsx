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
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
  LockIcon,
  PermissionNote,
  ScopeHeader,
  SearchBar,
  SearchIcon,
  SlidersIcon,
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

function EyeIcon({ size = 20, color = adminColors.brandDeep }: { size?: number; color?: string }) {
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

function DownloadTrayIcon({ size = 20, color = adminColors.brandDeep }: { size?: number; color?: string }) {
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
  const footer = undefined;

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
              <EyeIcon size={20} color={adminColors.brandDeep} />
              <Text style={styles.previewActionText}>View</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.previewActionBtn}
              onPress={() => Alert.alert('Download Document', `Downloading ${openDoc.name} (${openDoc.code})...`)}
              activeOpacity={0.75}
            >
              <DownloadTrayIcon size={20} color={adminColors.brandDeep} />
              <Text style={styles.previewActionText}>Download</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.restrictionBanner}>
            <BlockIcon size={20} color={adminColors.danger.text} />
            <Text style={styles.restrictionBannerText}>
              No Edit, Delete, Replace, Approve, or Verify Document — those aren't granted to SWA by the role matrix.
            </Text>
          </View>
        </ScrollView>
      </WalletScreen>
    );
  }

  return (
    <WalletScreen title="Warehouse Documents" onBack={onBack} headerExtra={isMain ? header : undefined} footer={footer}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!isMain ? (
          <View style={styles.scopeRow}>
            <LockIcon size={14} color={adminColors.ink} />
            <Text style={styles.scopeText}>{warehouseNameOf(scope, selected, warehouseOptions)}</Text>
          </View>
        ) : null}

        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>TOTAL</Text>
            <Text style={styles.kpiValueTotal}>{visible.length}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>ACTIVE</Text>
            <Text style={styles.kpiValueActive}>{visible.filter((d) => d.status === 'Active').length}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>EXPIRING SOON</Text>
            <Text style={styles.kpiValueExpiring}>{visible.filter((d) => d.status === 'Expiring Soon').length}</Text>
          </View>
        </View>

        <View style={styles.chipsContainer}>
          {CATEGORIES.map((cat) => {
            const isSelected = category === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => setCategory(cat)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.searchBar}>
          <SearchIcon size={18} color={adminColors.muted} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Document name, ID, type"
            placeholderTextColor={adminColors.placeholder}
          />
          <SlidersIcon size={18} color={adminColors.muted} />
        </View>

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
                <View style={styles.docCardHeader}>
                  <Text style={styles.docTitle}>{doc.name}</Text>
                  <View style={[styles.badge, expiring ? styles.badgeExpiring : styles.badgeActive]}>
                    {expiring ? (
                      <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" style={{ marginRight: 4 }}>
                        <Path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke={adminColors.warning.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                    ) : null}
                    <Text style={[styles.badgeText, expiring ? styles.badgeTextExpiring : styles.badgeTextActive]}>
                      {doc.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.docCode}>
                  {doc.code}
                  {isMain ? ` · ${warehouseNameOf(scope, doc.warehouseId, warehouseOptions)}` : ''}
                </Text>
                <Text style={styles.docDateNote}>{doc.dateNote}</Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: adminSpacing.lg,
    paddingBottom: adminSpacing.xxl,
  },
  scopeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
    marginBottom: adminSpacing.lg,
  },
  scopeText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.lg,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.md,
  },
  kpiLabel: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.muted,
    letterSpacing: 0.3,
  },
  kpiValueTotal: {
    ...adminType.kpiValue,
    color: adminColors.ink,
    marginTop: adminSpacing.xs,
  },
  kpiValueActive: {
    ...adminType.kpiValue,
    color: adminColors.success.text,
    marginTop: adminSpacing.xs,
  },
  kpiValueExpiring: {
    ...adminType.kpiValue,
    color: adminColors.warning.text,
    marginTop: adminSpacing.xs,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.lg,
  },
  chip: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.sm,
  },
  chipSelected: {
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    backgroundColor: adminColors.brandTint,
  },
  chipText: {
    ...adminType.rowMeta,
    fontWeight: '600',
    color: adminColors.ink,
  },
  chipTextSelected: {
    color: adminColors.brandDeep,
    fontWeight: '700',
  },
  searchBar: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.md,
    marginBottom: adminSpacing.lg,
  },
  searchInput: {
    flex: 1,
    marginLeft: adminSpacing.sm,
    ...adminType.body,
    color: adminColors.ink,
  },
  docCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
  },
  docCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  docTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    flex: 1,
    marginRight: adminSpacing.sm,
  },
  badge: {
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeActive: {
    backgroundColor: adminColors.success.bg,
  },
  badgeExpiring: {
    backgroundColor: adminColors.warning.bg,
  },
  badgeText: {
    ...adminType.caption,
    fontWeight: '700',
  },
  badgeTextActive: {
    color: adminColors.success.text,
  },
  badgeTextExpiring: {
    color: adminColors.warning.text,
  },
  docCode: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: adminSpacing.xs,
  },
  docDateNote: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: adminSpacing.sm,
  },
  detailSectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: adminSpacing.sm,
  },
  previewSectionTitle: {
    marginTop: adminSpacing.lg,
  },
  previewBox: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.md,
  },
  previewPlaceholderText: {
    ...adminType.body,
    fontWeight: '600',
    color: adminColors.muted,
  },
  previewActionsRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  previewActionBtn: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.xs,
  },
  previewActionText: {
    ...adminType.rowMeta,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },
  restrictionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.danger.bg,
    borderWidth: 1,
    borderColor: adminColors.danger.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    gap: adminSpacing.sm,
    marginTop: adminSpacing.xs,
  },
  restrictionBannerText: {
    flex: 1,
    ...adminType.rowMeta,
    fontWeight: '600',
    color: adminColors.danger.text,
    lineHeight: 18,
  },
});
