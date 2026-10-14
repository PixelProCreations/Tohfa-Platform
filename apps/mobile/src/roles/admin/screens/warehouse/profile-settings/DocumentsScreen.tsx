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
    <WalletScreen title="Warehouse Documents" onBack={onBack} headerExtra={isMain ? header : undefined} footer={footer}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!isMain ? (
          <View style={styles.scopeRow}>
            <LockIcon size={14} color="#374151" />
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
          <SearchIcon size={18} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Document name, ID, type"
            placeholderTextColor="#6B7280"
          />
          <SlidersIcon size={18} color="#4B5563" />
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
                        <Path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
    paddingBottom: 32,
  },
  scopeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  scopeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
    letterSpacing: 0.3,
  },
  kpiValueTotal: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginTop: 6,
  },
  kpiValueActive: {
    fontSize: 22,
    fontWeight: '800',
    color: '#15803D',
    marginTop: 6,
  },
  kpiValueExpiring: {
    fontSize: 22,
    fontWeight: '800',
    color: '#D97706',
    marginTop: 6,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chipSelected: {
    borderWidth: 1.5,
    borderColor: '#C2410C',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  chipTextSelected: {
    color: '#9A3412',
    fontWeight: '700',
  },
  searchBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#111827',
  },
  docCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 12,
  },
  docCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  docTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeActive: {
    backgroundColor: '#DCFCE7',
  },
  badgeExpiring: {
    backgroundColor: '#FEF3C7',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  badgeTextActive: {
    color: '#166534',
  },
  badgeTextExpiring: {
    color: '#B45309',
  },
  docCode: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 4,
  },
  docDateNote: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 8,
  },
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
