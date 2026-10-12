/**
 * Returns & Issues — the RMA hub: status KPIs, issue-category filter and the
 * list of open return requests.
 *
 * Scope (FINAL_LIST row 103): the All-warehouses selector is rendered only for
 * the Main view (scope.warehouseId undefined, rbac rma.* grant `all`). A Sub
 * admin is locked to scope.warehouseName (the old default was a hard-coded
 * 'Coonoor Warehouse') and only sees RMAs of its own warehouse.
 *
 * Absorbs MainWarehouseReturnsIssuesScreen (pair M10-S01): its "All
 * Warehouses" dropdown is the scope-conditional selector below; its single
 * hard-coded list card and KPI row are covered by the Sub list and tiles.
 *
 * Gates: none (rma.request.process is all/all; the list itself is the scope).
 */
// Design id: M10-S01
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { SWABottomNav } from '../../swa/components';
import { WarehouseSelector } from '../inventory';
import { INITIAL_RMA_ITEMS, RMA_CATEGORY_COUNTS, RMA_STATUS_COUNTS } from './fixtures';
import { inScope, isAllWarehouses, ReturnsScreen } from './ReturnsParts';
import type { RmaRecord, WarehouseScope, WarehouseScreenBaseProps } from './types';

export interface ReturnsIssuesScreenProps extends WarehouseScreenBaseProps {
  onSelectRma: (rma: RmaRecord) => void;
  onNavigateToHistory?: (() => void) | undefined;
  onNavigateToNotifications?: (() => void) | undefined;
  /** Warehouses for the Main all-warehouses selector (ignored for a Sub scope). */
  warehouseOptions?: readonly WarehouseScope[] | undefined;
  /** RMAs to list; defaults to the mock set until the RMA API is wired. */
  items?: readonly RmaRecord[] | undefined;
}

function BellIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke={adminColors.onBrand}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13.73 21a2 2 0 0 1-3.46 0"
        stroke={adminColors.onBrand}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LockIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke={adminColors.onBrand} strokeWidth="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={adminColors.onBrand} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function HistoryClockIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={adminColors.brand} strokeWidth="2" />
      <Path d="M12 7v5l3 3" stroke={adminColors.brand} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckCircleIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Path d="M8 12l2.5 2.5 5.5-5.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PendingDotsIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Circle cx="8" cy="12" r="1.2" fill={color} />
      <Circle cx="12" cy="12" r="1.2" fill={color} />
      <Circle cx="16" cy="12" r="1.2" fill={color} />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = '#9E9690' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="m21 21-4.35-4.35" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 18, color = '#9E9690' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

interface MetricTile {
  key: string;
  label: string;
  value: number;
  icon: 'check' | 'pending';
  alert?: boolean;
}

const METRICS: MetricTile[] = [
  { key: 'new', label: 'New Requests', value: RMA_STATUS_COUNTS.newRequests, icon: 'check' },
  { key: 'review', label: 'Under Review', value: RMA_STATUS_COUNTS.underReview, icon: 'pending' },
  { key: 'approved', label: 'Approved', value: RMA_STATUS_COUNTS.approved, icon: 'check' },
  { key: 'pending', label: 'Pending Resolution', value: RMA_STATUS_COUNTS.pendingResolution, icon: 'pending', alert: true },
];

export function ReturnsIssuesScreen({
  scope,
  onBack,
  onTabChange,
  onSelectRma,
  onNavigateToHistory,
  onNavigateToNotifications,
  warehouseOptions,
  items = INITIAL_RMA_ITEMS,
}: ReturnsIssuesScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  // Main only: which warehouse the selector shows (undefined = all). Rows are
  // mock and carry no warehouse yet, so this narrows nothing until wired.
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);
  const allWarehouses = isAllWarehouses(scope);

  const visibleItems = items.filter((item) => {
    const matchesScope = allWarehouses
      ? selectedWarehouseId === undefined || item.warehouseId === undefined || item.warehouseId === selectedWarehouseId
      : inScope(scope, item.warehouseId);
    const matchesCategory = !selectedCategory || item.issueCategory.toUpperCase() === selectedCategory;
    return matchesScope && matchesCategory;
  });

  const headerExtra = allWarehouses ? (
    <WarehouseSelector
      scope={scope}
      options={warehouseOptions}
      selectedId={selectedWarehouseId}
      onSelect={setSelectedWarehouseId}
    />
  ) : (
    <View style={styles.warehousePill}>
      <LockIcon />
      <Text style={styles.warehousePillText}>{scope.warehouseName ?? scope.warehouseId} · Active</Text>
    </View>
  );

  const [searchQuery, setSearchQuery] = useState('');

  if (allWarehouses) {
    const mainItems = visibleItems.filter((item) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.rmaId.toLowerCase().includes(q) ||
        item.orderId.toLowerCase().includes(q) ||
        item.customerName.toLowerCase().includes(q) ||
        item.productName.toLowerCase().includes(q)
      );
    });

    return (
      <ReturnsScreen
        title="RETURNS & ISSUES"
        onBack={onBack}
        headerRight={
          onNavigateToNotifications ? (
            <TouchableOpacity
              style={styles.mainBellBtn}
              onPress={onNavigateToNotifications}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
            >
              <BellIcon />
            </TouchableOpacity>
          ) : null
        }
        headerExtra={
          <WarehouseSelector
            scope={scope}
            options={warehouseOptions}
            selectedId={selectedWarehouseId}
            onSelect={setSelectedWarehouseId}
          />
        }
        footer={null}
      >
        <ScrollView contentContainerStyle={styles.mainScrollContent} showsVerticalScrollIndicator={false}>
          {/* Main Warehouse 4 KPI Cards (2x2 Grid) */}
          <View style={styles.mainKpiRow}>
            <View style={styles.mainKpiBox}>
              <Text style={styles.mainKpiLabel}>PENDING</Text>
              <Text style={styles.mainKpiValue}>05</Text>
            </View>
            <View style={styles.mainKpiBox}>
              <Text style={styles.mainKpiLabel}>UNDER REVIEW</Text>
              <Text style={styles.mainKpiValue}>03</Text>
            </View>
          </View>
          <View style={styles.mainKpiRow}>
            <View style={styles.mainKpiBox}>
              <Text style={styles.mainKpiLabel}>APPROVED</Text>
              <Text style={styles.mainKpiValue}>12</Text>
            </View>
            <View style={styles.mainKpiBox}>
              <Text style={styles.mainKpiLabel}>REFUND PENDING</Text>
              <Text style={styles.mainKpiValue}>02</Text>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.mainSearchBar}>
            <SearchIcon />
            <TextInput
              style={styles.mainSearchInput}
              placeholder="Search RMA, order or customer"
              placeholderTextColor="#9E9690"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <FilterSlidersIcon />
          </View>

          {/* RMA Cards */}
          {mainItems.map((item) => {
            const isApproved = item.status === 'Approved';
            const badgeBg = isApproved ? '#DEF7EC' : '#FEF3C7';
            const badgeText = isApproved ? '#03543F' : '#D97706';
            const displayPrice = item.lineTotal || (item.productName === 'Tomato' ? '₹450' : '₹120');
            const displayProduct = item.productName === 'Tomato' ? 'Organic Tomato · 1.8 KG' : `${item.productName} · ${item.requestedQuantity}`;
            const displayMeta = item.productName === 'Tomato' ? 'Damaged Product · 25 Sep, 10:40 AM' : `${item.issueCategory} · ${item.timestampText}`;

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.mainListCard}
                onPress={() => onSelectRma(item)}
                activeOpacity={0.8}
              >
                <View style={styles.mainCardHeader}>
                  <Text style={styles.mainRmaId}>{item.rmaId}</Text>
                  <View style={[styles.mainBadge, { backgroundColor: badgeBg }]}>
                    <Text style={[styles.mainBadgeText, { color: badgeText }]}>{item.status === 'New' ? 'Under Review' : item.status}</Text>
                  </View>
                </View>
                <Text style={styles.mainCustomerLine}>{item.customerName} · {item.orderId}</Text>

                <View style={styles.mainDivider} />

                <View style={styles.mainProductRow}>
                  <Text style={styles.mainProductName}>{displayProduct}</Text>
                  <Text style={styles.mainProductPrice}>{displayPrice}</Text>
                </View>
                <View style={styles.mainProductRow}>
                  <Text style={styles.mainProductMeta}>{displayMeta}</Text>
                  <Text style={styles.mainViewLink}>View →</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {mainItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No RMA records found</Text>
            </View>
          ) : null}

          <View style={{ height: 24 }} />
        </ScrollView>
      </ReturnsScreen>
    );
  }

  return (
    <ReturnsScreen
      title="Returns & Issues"
      onBack={onBack}
      headerRight={
        onNavigateToNotifications ? (
          <TouchableOpacity
            style={styles.bellButton}
            onPress={onNavigateToNotifications}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <BellIcon />
          </TouchableOpacity>
        ) : null
      }
      headerExtra={headerExtra}
      footer={<SWABottomNav activeTab="More" onTabChange={onTabChange} />}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.metricsGrid}>
          {METRICS.map((metric) => {
            const iconColor = metric.alert ? adminColors.danger.text : adminColors.brandDeep;
            return (
              <View key={metric.key} style={styles.metricCard}>
                <View style={styles.metricIconWrap}>
                  {metric.icon === 'check' ? <CheckCircleIcon color={iconColor} /> : <PendingDotsIcon color={iconColor} />}
                </View>
                <Text style={[styles.metricValue, metric.alert && styles.metricValueAlert]}>{metric.value}</Text>
                <Text style={styles.metricLabel}>{metric.label}</Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Issue Category Summary</Text>
        <View style={styles.categoryGrid}>
          {RMA_CATEGORY_COUNTS.map((cat) => {
            const isSelected = selectedCategory === cat.label;
            return (
              <TouchableOpacity
                key={cat.label}
                style={[styles.categoryBox, isSelected && styles.categoryBoxSelected]}
                onPress={() => setSelectedCategory(isSelected ? null : cat.label)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <Text style={[styles.categoryCount, isSelected && styles.categoryTextSelected]}>{cat.count}</Text>
                <Text style={[styles.categoryLabel, isSelected && styles.categoryTextSelected]}>{cat.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.listSectionHeader}>
          <Text style={styles.sectionTitleNoMargin}>Return Requests</Text>
          {onNavigateToHistory ? (
            <TouchableOpacity style={styles.historyInlineLink} onPress={onNavigateToHistory} activeOpacity={0.7}>
              <HistoryClockIcon />
              <Text style={styles.historyInlineText}>View History →</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.listContainer}>
          {visibleItems.map((item) => {
            const isApproved = item.status === 'Approved';
            const isDamaged = item.issueCategory === 'Damaged';
            return (
              <TouchableOpacity key={item.id} style={styles.rmaCard} onPress={() => onSelectRma(item)} activeOpacity={0.8}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.rmaIdText}>{item.rmaId}</Text>
                  <View style={[styles.statusBadge, isApproved && styles.statusBadgeApproved]}>
                    <Text style={[styles.statusBadgeText, isApproved && styles.statusBadgeTextApproved]}>
                      {item.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.customerNameText}>{item.customerName}</Text>
                <Text style={styles.orderIdText}>{item.orderId}</Text>
                <View style={styles.tagQuantityRow}>
                  <View style={[styles.issueTag, !isDamaged && styles.issueTagOther]}>
                    <Text style={[styles.issueTagText, !isDamaged && styles.issueTagTextOther]}>{item.issueCategory}</Text>
                  </View>
                  <Text style={styles.quantityText}>{item.requestedQuantity}</Text>
                </View>
                <Text style={styles.timestampText}>{item.timestampText}</Text>
              </TouchableOpacity>
            );
          })}

          {visibleItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No RMA records found</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </ReturnsScreen>
  );
}

// Bell bubble diameter: an icon size, not spacing.
const BELL_SIZE = 38;

const styles = StyleSheet.create({
  bellButton: {
    width: BELL_SIZE,
    height: BELL_SIZE,
    borderRadius: adminRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warehousePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.full,
    marginTop: adminSpacing.sm,
    gap: adminSpacing.xs,
  },
  warehousePillText: { ...adminType.caption, color: adminColors.onBrand },
  scrollContent: { paddingHorizontal: adminSpacing.lg, paddingTop: adminSpacing.lg, paddingBottom: adminSpacing.xxl },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: adminSpacing.sm, marginBottom: adminSpacing.lg },
  metricCard: {
    width: '48.5%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
  },
  metricIconWrap: { marginBottom: adminSpacing.xs },
  metricValue: { ...adminType.kpiValue, color: adminColors.ink },
  metricValueAlert: { color: adminColors.danger.text },
  metricLabel: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },

  sectionTitle: { ...adminType.sectionHead, color: adminColors.ink, marginBottom: adminSpacing.md },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: adminSpacing.sm, marginBottom: adminSpacing.lg },
  categoryBox: {
    width: '31.5%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBoxSelected: { borderColor: adminColors.brand, backgroundColor: adminColors.brandTint },
  categoryCount: { ...adminType.kpiValue, color: adminColors.ink },
  categoryLabel: { ...adminType.caption, color: adminColors.muted, marginTop: 2 },
  categoryTextSelected: { color: adminColors.brand },

  listSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.sm,
    marginTop: adminSpacing.xs,
  },
  sectionTitleNoMargin: { ...adminType.sectionHead, color: adminColors.ink },
  historyInlineLink: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.xs },
  historyInlineText: { ...adminType.sectionHead, color: adminColors.brand },

  listContainer: { gap: adminSpacing.md },
  rmaCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.xs,
  },
  rmaIdText: { ...adminType.sectionHead, color: adminColors.brandDeep },
  statusBadge: {
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 2,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.warning.bg,
  },
  statusBadgeApproved: { backgroundColor: adminColors.success.bg },
  statusBadgeText: { ...adminType.caption, color: adminColors.warning.text },
  statusBadgeTextApproved: { color: adminColors.success.text },
  customerNameText: { ...adminType.rowTitle, color: adminColors.ink, marginBottom: 2 },
  orderIdText: { ...adminType.rowMeta, color: adminColors.muted, marginBottom: adminSpacing.sm },
  tagQuantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.xs,
  },
  issueTag: {
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 2,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brandSoft.bg,
  },
  issueTagOther: { backgroundColor: adminColors.warning.bg },
  issueTagText: { ...adminType.caption, color: adminColors.brandSoft.text },
  issueTagTextOther: { color: adminColors.warning.text },
  quantityText: { ...adminType.sectionHead, color: adminColors.ink },
  timestampText: { ...adminType.rowMeta, color: adminColors.muted },
  emptyState: { padding: adminSpacing.xxl, alignItems: 'center' },
  emptyText: { ...adminType.body, color: adminColors.muted },

  // Main Warehouse Dashboard Styles
  mainScrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  mainBellBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainKpiRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  mainKpiBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8DED5',
  },
  mainKpiLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#6B6560',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  mainKpiValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E1612',
  },
  mainSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8DED5',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    marginTop: 6,
  },
  mainSearchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
    marginHorizontal: 10,
    color: '#1E1612',
  },
  mainListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8DED5',
    padding: 16,
    marginBottom: 12,
  },
  mainCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mainRmaId: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E1612',
  },
  mainBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  mainBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  mainCustomerLine: {
    fontSize: 12,
    color: '#6B6560',
    marginTop: 4,
    fontWeight: '500',
  },
  mainDivider: {
    height: 1,
    backgroundColor: '#F0E7DD',
    marginVertical: 12,
  },
  mainProductRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  mainProductName: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#1E1612',
  },
  mainProductPrice: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#8A5A30',
  },
  mainProductMeta: {
    fontSize: 11.5,
    color: '#6B6560',
    fontWeight: '500',
  },
  mainViewLink: {
    fontSize: 11.5,
    color: '#8A5A30',
    fontWeight: '800',
  },
});
