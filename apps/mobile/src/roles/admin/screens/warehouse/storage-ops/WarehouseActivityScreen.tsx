/**
 * Warehouse Activity: the warehouse activity log, with a Today / All date
 * preset.
 *
 * Gate (FINAL_LIST 139): no view code (SPEC_GAPS W4v-4); scope-locked. Sub sees
 * its own warehouse behind the locked pill; Main (scope.warehouseId undefined)
 * gets the warehouse selector. Export Operations (CSV, from the absorbed
 * Operations History) shows only with `report.export.file`.
 *
 * Folds and absorbs (owner decision: Today's Operations is no longer a screen
 * of its own):
 *   - Sub Today's Operations (FINAL_LIST 138, M4-S02): the Today preset, its
 *     metrics strip, the filter page (module / status / time of day / sort)
 *     and the active-filter banner. Its hard-coded "Coonoor Warehouse -
 *     Assigned Scope" notice now reads scope.warehouseName.
 *   - Sub Recent Activity: Orders / Cash / QC rows and the stock verification
 *     counts (system / counted / variance).
 *   - Main Warehouse Activity, Activity Timeline and Operations History
 *     (M4-S08): warehouse name and operator on each row, search, the
 *     long-term history (the All preset) and the CSV export.
 *   - Main Today's Operations Monitoring / Overview (M4-S02, M1-S02, "Daily
 *     operational monitoring · All Warehouses"): the six-tile strip (Main adds
 *     Materials and Staff), tiles that open their module, and the monitoring
 *     card (Incoming Goods / Order Fulfilment / Quality Issues) for the Main view.
 *
 * Rows open Activity Detail; modules are opened through `onOpenModule`.
 */
// Design id: M4-S08
import React, { useMemo, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { adminColors, adminRadius, adminSpacing, adminType, type AdminTone } from '../../../theme';
import {
  CashIcon,
  ChipGroup,
  EmptyState,
  ExportIcon,
  HeaderIconButton,
  InfoNote,
  inScope,
  isAllWarehouses,
  LockIcon,
  ScopeHeader,
  SearchBar,
  SectionTitle,
  ShieldCheckIcon,
  SlidersIcon,
  StatusBadge,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { ACTIVITIES, STORAGE_WAREHOUSES, storageWarehouseName, TODAY_METRICS } from './fixtures';
import {
  AlertCircleIcon,
  BoxIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ClipboardIcon,
  ReceiveIcon,
  STORAGE_CODES,
  WarehouseIcon,
} from './StorageParts';
import type {
  ActivityCategory,
  ActivityItem,
  ActivityModule,
  ActivityPreset,
  ActivityStatus,
  ActivityTimeOfDay,
  WarehouseScreenBaseProps,
} from './types';

const PRESETS: readonly ActivityPreset[] = ['Today', 'All'];
const CATEGORY_CHIPS: readonly ('All' | ActivityCategory)[] = [
  'All',
  'Receiving',
  'Storage',
  'Verification',
  'Material Handling',
  'Issues',
  'Orders',
  'Cash',
  'QC',
];

type ModuleFilter = 'All' | ActivityCategory;
type StatusFilter = 'All' | ActivityStatus;
type TimeFilter = 'All' | ActivityTimeOfDay;
type SortOrder = 'newest' | 'oldest';

interface Filters {
  module: ModuleFilter;
  status: StatusFilter;
  timeOfDay: TimeFilter;
  sort: SortOrder;
}

const DEFAULT_FILTERS: Filters = { module: 'All', status: 'All', timeOfDay: 'All', sort: 'newest' };

const MODULE_LABEL: Record<ModuleFilter, string> = {
  All: 'All Modules',
  Receiving: 'Goods Receiving',
  Storage: 'Storage Activity',
  Verification: 'Stock Verification',
  'Material Handling': 'Material Handling',
  Issues: 'Operational Issues',
  Orders: 'Orders',
  Cash: 'Cash',
  QC: 'Quality Check',
};
const STATUS_LABEL: Record<StatusFilter, string> = { All: 'All Statuses', Completed: 'Completed', Pending: 'Pending', Open: 'Open Issues' };
const TIME_LABEL: Record<TimeFilter, string> = {
  All: 'All Day',
  morning: 'Morning (06:00 - 12:00)',
  afternoon: 'Afternoon (12:00 - 18:00)',
  evening: 'Evening (18:00 - 24:00)',
};
const SORT_LABEL: Record<SortOrder, string> = { newest: 'Newest First', oldest: 'Oldest First' };

export const ACTIVITY_STATUS_TONE: Record<ActivityStatus, AdminTone> = {
  Completed: 'success',
  Pending: 'warning',
  Open: 'danger',
};

/** Icon of an activity category (also used by Activity Detail and the hub). */
export function ActivityCategoryIcon({ category, size = 18 }: { category: ActivityCategory; size?: number }) {
  switch (category) {
    case 'Receiving':
      return <ReceiveIcon size={size} />;
    case 'Storage':
      return <WarehouseIcon size={size} color={adminColors.brand} />;
    case 'Verification':
      return <CheckCircleIcon size={size} color={adminColors.success.text} />;
    case 'Material Handling':
      return <ClipboardIcon size={size} color={adminColors.warning.text} />;
    case 'Issues':
      return <AlertCircleIcon size={size} color={adminColors.danger.text} />;
    case 'Orders':
      return <BoxIcon size={size} color={adminColors.brand} />;
    case 'Cash':
      return <CashIcon size={size} color={adminColors.brand} />;
    default:
      return <ShieldCheckIcon size={size} color={adminColors.info.text} />;
  }
}

function applyFilters(list: readonly ActivityItem[], f: Filters): ActivityItem[] {
  const out = list.filter(
    (a) =>
      (f.module === 'All' || a.category === f.module) &&
      (f.status === 'All' || a.status === f.status) &&
      (f.timeOfDay === 'All' || a.timeOfDay === f.timeOfDay),
  );
  return f.sort === 'oldest' ? out.reverse() : out;
}

function activeFilterCount(f: Filters): number {
  return [f.module !== 'All', f.status !== 'All', f.timeOfDay !== 'All', f.sort !== 'newest'].filter(Boolean).length;
}

export interface WarehouseActivityScreenProps extends WarehouseScreenBaseProps {
  activities?: readonly ActivityItem[] | undefined;
  /** Date preset to open on ('Today' = the old Today's Operations). */
  initialPreset?: ActivityPreset | undefined;
  onSelectActivity: (activityId: string) => void;
  /** Open the module that owns a record (metric tiles, Main monitoring card). */
  onOpenModule?: ((module: ActivityModule) => void) | undefined;
  /** Export Operations (CSV); shown only with report.export.file. */
  onExport?: (() => void) | undefined;
}

export function WarehouseActivityScreen({
  scope,
  can,
  onBack,
  activities = ACTIVITIES,
  initialPreset = 'All',
  onSelectActivity,
  onOpenModule,
  onExport,
}: WarehouseActivityScreenProps) {
  const [preset, setPreset] = useState<ActivityPreset>(initialPreset);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'All' | ActivityCategory>('All');
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [draft, setDraft] = useState<Filters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);

  const allWarehouses = isAllWarehouses(scope);
  const canExport = can(STORAGE_CODES.reportExport);
  const filterCount = activeFilterCount(filters);

  const base = useMemo(
    () =>
      activities.filter(
        (a) => inScope(scope, a.warehouseId, selectedWarehouseId) && (preset === 'All' || a.day === 'Today'),
      ),
    [activities, scope, selectedWarehouseId, preset],
  );
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const byChipAndSearch = base.filter(
      (a) =>
        (category === 'All' || a.category === category) &&
        (q === '' ||
          a.title.toLowerCase().includes(q) ||
          a.subtitle.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q) ||
          a.reference.toLowerCase().includes(q)),
    );
    return applyFilters(byChipAndSearch, filters);
  }, [base, category, query, filters]);
  const draftCount = applyFilters(base, draft).length;

  const metrics = TODAY_METRICS.filter((m) => inScope(scope, m.warehouseId, selectedWarehouseId));
  const sum = (key: 'receiving' | 'storage' | 'verification' | 'materials' | 'issues' | 'staffPresent') =>
    metrics.reduce((total, m) => total + m[key], 0);
  const tiles: { label: string; value: number; module: ActivityModule }[] = [
    { label: 'RECEIVING', value: sum('receiving'), module: 'receiving' },
    { label: 'STORAGE', value: sum('storage'), module: 'storage' },
    { label: 'VERIFICATION', value: sum('verification'), module: 'verification' },
    { label: 'ISSUES', value: sum('issues'), module: 'operational_issue' },
    // Main's overview also counted materials and staff (all warehouses).
    ...(allWarehouses
      ? [
          { label: 'MATERIALS', value: sum('materials'), module: 'material_handling' as const },
          { label: 'STAFF', value: sum('staffPresent'), module: 'staff' as const },
        ]
      : []),
  ];

  const resetAll = () => {
    setFilters(DEFAULT_FILTERS);
    setDraft(DEFAULT_FILTERS);
    setCategory('All');
    setQuery('');
  };
  const exportCsv = () => {
    if (onExport) onExport();
    else Alert.alert('Operations History Exported', 'CSV report has been saved to your downloads folder.');
  };

  const scopeLabel = allWarehouses
    ? selectedWarehouseId !== undefined
      ? storageWarehouseName(selectedWarehouseId)
      : 'All Warehouses'
    : (scope.warehouseName ?? scope.warehouseId ?? '');
  const filterSummary = [
    filters.module !== 'All' ? MODULE_LABEL[filters.module] : null,
    filters.status !== 'All' ? STATUS_LABEL[filters.status] : null,
    filters.timeOfDay !== 'All' ? TIME_LABEL[filters.timeOfDay] : null,
    filters.sort !== 'newest' ? SORT_LABEL[filters.sort] : null,
  ]
    .filter((s): s is string => s !== null)
    .join(' · ');

  return (
    <WalletScreen
      title={preset === 'Today' ? "Today's Operations" : 'Warehouse Activity'}
      subtitle={
        preset === 'Today'
          ? `${base.length} activities today${allWarehouses ? ' · Daily operational monitoring' : ''}`
          : 'Activity History & Log'
      }
      onBack={onBack}
      headerRight={
        <HeaderIconButton
          onPress={() => {
            setDraft(filters);
            setShowFilters(true);
          }}
          accessibilityLabel={filterCount > 0 ? `Filter operations, ${filterCount} active` : 'Filter operations'}
        >
          <SlidersIcon />
        </HeaderIconButton>
      }
      headerExtra={
        <ScopeHeader
          scope={scope}
          warehouseOptions={STORAGE_WAREHOUSES}
          selectedWarehouseId={selectedWarehouseId}
          onSelectWarehouse={setSelectedWarehouseId}
        />
      }
      footer={
        canExport ? (
          <WalletFooter>
            <WalletButton label="Export Operations (CSV)" variant="outline" icon={<ExportIcon />} onPress={exportCsv} />
          </WalletFooter>
        ) : undefined
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <ChipGroup options={PRESETS} value={preset} onChange={setPreset} labelOf={(p) => (p === 'Today' ? 'Today' : 'All History')} />

        {preset === 'Today' ? (
          <View style={styles.tileGrid}>
            {tiles.map((tile) => (
              <TouchableOpacity
                key={tile.label}
                style={styles.tile}
                disabled={onOpenModule === undefined}
                onPress={() => onOpenModule?.(tile.module)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={`${tile.label} ${tile.value}`}
              >
                <Text style={styles.tileValue}>{tile.value}</Text>
                <Text style={styles.tileLabel}>{tile.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {preset === 'Today' && allWarehouses && onOpenModule ? (
          <>
            <SectionTitle>Operational Monitoring</SectionTitle>
            <View style={styles.monitorCard}>
              {(
                [
                  ['Incoming Goods', 'receiving'],
                  ['Order Fulfilment', 'orders'],
                  ['Quality Issues', 'qc'],
                ] as const
              ).map(([label, module], index) => (
                <TouchableOpacity
                  key={label}
                  style={[styles.monitorRow, index > 0 && styles.monitorRowDivider]}
                  onPress={() => onOpenModule(module)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                >
                  <Text style={styles.monitorLabel}>{label}</Text>
                  <Text style={styles.monitorLink}>View All</Text>
                  <ChevronRightIcon size={14} />
                </TouchableOpacity>
              ))}
            </View>
            <InfoNote tone="brandSoft">
              Every operational card has a View All action, and every transaction links to its owning module rather than
              duplicating the record here.
            </InfoNote>
          </>
        ) : null}

        {filterCount > 0 ? (
          <View style={styles.filterBanner}>
            <Text style={styles.filterBannerText}>{`Filters active (${filterCount}): ${filterSummary}`}</Text>
            <TouchableOpacity onPress={resetAll} accessibilityRole="button">
              <Text style={styles.filterReset}>Reset</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.searchWrap}>
          <SearchBar value={query} onChangeText={setQuery} placeholder="Search activity, GRN, rack, product..." />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
          <ChipGroup options={CATEGORY_CHIPS} value={category} onChange={setCategory} />
        </ScrollView>

        {visible.length === 0 ? (
          <EmptyState title="No activities found" subtitle="No logged warehouse activities match your search or filter." />
        ) : (
          visible.map((act) => (
            <TouchableOpacity
              key={act.id}
              style={styles.card}
              onPress={() => onSelectActivity(act.id)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={`${act.title} ${act.subtitle}`}
            >
              <View style={styles.cardTop}>
                <View style={styles.categoryRow}>
                  <View style={styles.iconBox}>
                    <ActivityCategoryIcon category={act.category} />
                  </View>
                  <Text style={styles.categoryText}>{act.category.toUpperCase()}</Text>
                </View>
                <StatusBadge label={act.status} tone={ACTIVITY_STATUS_TONE[act.status]} />
              </View>
              <Text style={styles.cardTitle}>{act.title}</Text>
              <Text style={styles.cardSubtitle}>{act.subtitle}</Text>
              {act.metrics ? (
                <View style={styles.metricRow}>
                  {(
                    [
                      ['SYSTEM', act.metrics.system],
                      ['COUNTED', act.metrics.counted],
                      ['VARIANCE', act.metrics.variance],
                    ] as const
                  ).map(([label, value]) => (
                    <View key={label} style={styles.metricBox}>
                      <Text style={[styles.metricValue, label === 'VARIANCE' && styles.metricVariance]}>{value}</Text>
                      <Text style={styles.metricLabel}>{label}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
              <View style={styles.cardFooter}>
                <Text style={styles.cardMeta}>
                  {allWarehouses ? `${storageWarehouseName(act.warehouseId)} · ` : ''}
                  {act.performedBy} · {act.when}
                </Text>
                <View style={styles.detailLink}>
                  <Text style={styles.detailLinkText}>View Detail</Text>
                  <ChevronRightIcon size={14} />
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Filter page (full screen, as Today's Operations had it): no scrim needed. */}
      <Modal visible={showFilters} animationType="slide" onRequestClose={() => setShowFilters(false)}>
        <WalletScreen
          title="Filter Operations"
          subtitle={preset === 'Today' ? "Today's Operations" : 'Warehouse Activity'}
          onBack={() => setShowFilters(false)}
          footer={
            <WalletFooter>
              <View style={styles.footerRow}>
                <WalletButton label="Reset All" variant="neutral" flex onPress={() => setDraft(DEFAULT_FILTERS)} />
                <WalletButton
                  label={`Apply Filters (${draftCount})`}
                  flex
                  onPress={() => {
                    setFilters(draft);
                    setShowFilters(false);
                  }}
                />
              </View>
            </WalletFooter>
          }
        >
          <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.scopeCard}>
              <View style={styles.scopeIcon}>
                <LockIcon size={14} color={adminColors.brand} />
              </View>
              <View style={styles.scopeText}>
                <Text style={styles.scopeTitle}>{allWarehouses ? `${scopeLabel} — Main Warehouse view` : `${scopeLabel} — Assigned Scope`}</Text>
                <Text style={styles.scopeDesc}>
                  {allWarehouses
                    ? 'Filters apply to operations logged across the warehouses in view.'
                    : 'Filters apply strictly to operations logged within this facility.'}
                </Text>
              </View>
            </View>
            <SectionTitle>Activity Module</SectionTitle>
            <ChipGroup
              options={CATEGORY_CHIPS}
              value={draft.module}
              onChange={(module) => setDraft({ ...draft, module })}
              labelOf={(m) => MODULE_LABEL[m]}
            />
            <SectionTitle>Status</SectionTitle>
            <ChipGroup
              options={['All', 'Completed', 'Pending', 'Open'] as const}
              value={draft.status}
              onChange={(status) => setDraft({ ...draft, status })}
              labelOf={(s) => STATUS_LABEL[s]}
            />
            <SectionTitle>Time of Day</SectionTitle>
            <ChipGroup
              options={['All', 'morning', 'afternoon', 'evening'] as const}
              value={draft.timeOfDay}
              onChange={(timeOfDay) => setDraft({ ...draft, timeOfDay })}
              labelOf={(t) => TIME_LABEL[t]}
            />
            <SectionTitle>Sort Order</SectionTitle>
            <ChipGroup
              options={['newest', 'oldest'] as const}
              value={draft.sort}
              onChange={(sort) => setDraft({ ...draft, sort })}
              labelOf={(s) => SORT_LABEL[s]}
            />
          </ScrollView>
        </WalletScreen>
      </Modal>
    </WalletScreen>
  );
}

const ICON_BOX = 28;

const styles = StyleSheet.create({
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: adminSpacing.sm, marginTop: adminSpacing.md },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
  },
  tileValue: { ...adminType.kpiValue, color: adminColors.ink },
  tileLabel: { ...adminType.caption, color: adminColors.muted, marginTop: adminSpacing.xs },
  monitorCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  monitorRow: { flexDirection: 'row', alignItems: 'center', padding: adminSpacing.md, gap: adminSpacing.xs },
  monitorRowDivider: { borderTopWidth: 1, borderTopColor: adminColors.border },
  monitorLabel: { ...adminType.rowTitle, color: adminColors.ink, flex: 1 },
  monitorLink: { ...adminType.caption, color: adminColors.brand },
  filterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    marginTop: adminSpacing.md,
  },
  filterBannerText: { ...adminType.rowMeta, color: adminColors.brandDeep, flex: 1 },
  filterReset: { ...adminType.caption, color: adminColors.brand },
  searchWrap: { marginTop: adminSpacing.md },
  chipScroll: { paddingBottom: adminSpacing.md },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: adminSpacing.sm },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.xs },
  iconBox: {
    width: ICON_BOX,
    height: ICON_BOX,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryText: { ...adminType.caption, color: adminColors.muted },
  cardTitle: { ...adminType.sectionHead, color: adminColors.ink },
  cardSubtitle: { ...adminType.body, color: adminColors.muted, marginTop: 2 },
  metricRow: { flexDirection: 'row', gap: adminSpacing.sm, marginTop: adminSpacing.md },
  metricBox: {
    flex: 1,
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.sm,
    alignItems: 'center',
  },
  metricValue: { ...adminType.rowTitle, color: adminColors.ink },
  metricVariance: { color: adminColors.danger.text },
  metricLabel: { ...adminType.caption, color: adminColors.muted, marginTop: 2 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingTop: adminSpacing.sm,
    marginTop: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  cardMeta: { ...adminType.rowMeta, color: adminColors.muted, flex: 1 },
  detailLink: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  detailLinkText: { ...adminType.caption, color: adminColors.brand },
  footerRow: { flexDirection: 'row', gap: adminSpacing.sm },
  scopeCard: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  scopeIcon: {
    width: ICON_BOX,
    height: ICON_BOX,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scopeText: { flex: 1 },
  scopeTitle: { ...adminType.rowTitle, color: adminColors.brandDeep },
  scopeDesc: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },
});
