/**
 * Returns Filters — full-screen filter sheet for the returns (RMA) queue.
 *
 * Status chips wire to the API's `status` query param through the flow's
 * applied-filters state; Reason Category and Refund Method are client-side
 * filters. The warehouse selector is shown for Main Warehouse (all warehouses)
 * and hidden for a Sub Warehouse (locked to a single warehouse).
 *
 * Design id: M10-S01F
 */
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, ScreenStatusBar } from '@tohfa/mobile-ui';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { t } from '../../../i18n';
import {
  adminColors,
  adminRadius,
  adminSpacing,
  adminType,
  ADMIN_BUTTON_HEIGHT,
} from '../../../theme';

// ─── Icons (inline, no external SVG assets) ──────────────────────────────────

function BackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M20 20l-4-4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function FlagIcon({ size = 17, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1v19"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CalendarIcon({ size = 17, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3"
        y="4"
        width="18"
        height="18"
        rx="2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 2v4M8 2v4M3 10h18"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function AlertCircleIcon({ size = 17, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle
        cx="12"
        cy="12"
        r="9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 8v4M12 16h.01"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CreditCardIcon({ size = 17, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="2"
        y="5"
        width="20"
        height="14"
        rx="2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M2 10h20M6 15h4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BuildingWarehouseIcon({ size = 18, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 22V12h6v10"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FunnelIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LockIcon({ size = 18, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="5"
        y="11"
        width="14"
        height="10"
        rx="2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M8 11V7a4 4 0 0 1 8 0v4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="16" r="1.2" fill={color} />
    </Svg>
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

/** Filter status options (UI labels; map to ReturnStatus via filterStatusToApiStatus in the flow). */
export type RmaFilterStatus = 'All' | 'Pending' | 'Under Review' | 'Approved' | 'Refund Pending';
/** Date range shortcut. */
export type RmaFilterDate = 'Today' | 'Last 7 Days' | 'Last 30 Days' | 'Custom';
/** Return reason category (client-side filter only). */
export type RmaFilterReason = 'All' | 'Damaged Product' | 'Quality Issue' | 'Missing Item' | 'Wrong Item';
/** Refund method (client-side filter only). */
export type RmaFilterRefundMethod = 'All' | 'Wallet' | 'Bank';

export interface RmaFilterValues {
  searchQuery: string;
  status: RmaFilterStatus;
  date: RmaFilterDate;
  reason: RmaFilterReason;
  refundMethod: RmaFilterRefundMethod;
  /** Undefined = "all warehouses"; only relevant when showWarehouseSelector is true. */
  warehouseId?: string | undefined;
}

export interface ReturnsFiltersScreenProps {
  initialFilters: RmaFilterValues;
  /** Name of the warehouse this user is locked to (shown in the locked pill). */
  warehouseName?: string | undefined;
  /** True for the Main Warehouse view where the user can pick a warehouse. */
  showWarehouseSelector?: boolean | undefined;
  warehouses?: readonly { id: string; name: string }[] | undefined;
  onBack: () => void;
  onApply: (filters: RmaFilterValues) => void;
}

// ─── Option lists ─────────────────────────────────────────────────────────────

const STATUS_OPTIONS: readonly RmaFilterStatus[] = ['All', 'Pending', 'Under Review', 'Approved', 'Refund Pending'];
const DATE_OPTIONS: readonly RmaFilterDate[] = ['Today', 'Last 7 Days', 'Last 30 Days', 'Custom'];
const REASON_OPTIONS: readonly RmaFilterReason[] = ['All', 'Damaged Product', 'Quality Issue', 'Missing Item', 'Wrong Item'];
const REFUND_OPTIONS: readonly RmaFilterRefundMethod[] = ['All', 'Wallet', 'Bank'];

function statusLabel(v: RmaFilterStatus): string {
  switch (v) {
    case 'All': return t('returns.filters.status.all');
    case 'Pending': return t('returns.filters.status.pending');
    case 'Under Review': return t('returns.filters.status.underReview');
    case 'Approved': return t('returns.filters.status.approved');
    case 'Refund Pending': return t('returns.filters.status.refundPending');
  }
}

function dateLabel(v: RmaFilterDate): string {
  switch (v) {
    case 'Today': return t('returns.filters.date.today');
    case 'Last 7 Days': return t('returns.filters.date.last7');
    case 'Last 30 Days': return t('returns.filters.date.last30');
    case 'Custom': return t('returns.filters.date.custom');
  }
}

function reasonLabel(v: RmaFilterReason): string {
  switch (v) {
    case 'All': return t('returns.filters.reason.all');
    case 'Damaged Product': return t('returns.filters.reason.damaged');
    case 'Quality Issue': return t('returns.filters.reason.quality');
    case 'Missing Item': return t('returns.filters.reason.missing');
    case 'Wrong Item': return t('returns.filters.reason.wrong');
  }
}

function refundLabel(v: RmaFilterRefundMethod): string {
  switch (v) {
    case 'All': return t('returns.filters.refund.all');
    case 'Wallet': return t('returns.filters.refund.wallet');
    case 'Bank': return t('returns.filters.refund.bank');
  }
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export function ReturnsFiltersScreen({
  initialFilters,
  warehouseName,
  showWarehouseSelector = false,
  warehouses = [],
  onBack,
  onApply,
}: ReturnsFiltersScreenProps) {
  const [searchQuery, setSearchQuery] = useState(initialFilters.searchQuery);
  const [status, setStatus] = useState<RmaFilterStatus>(initialFilters.status);
  const [date, setDate] = useState<RmaFilterDate>(initialFilters.date);
  const [reason, setReason] = useState<RmaFilterReason>(initialFilters.reason);
  const [refundMethod, setRefundMethod] = useState<RmaFilterRefundMethod>(initialFilters.refundMethod);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(
    initialFilters.warehouseId,
  );

  const clearAll = () => {
    setSearchQuery('');
    setStatus('All');
    setDate('Today');
    setReason('All');
    setRefundMethod('All');
    setSelectedWarehouseId(undefined);
  };

  const handleApply = () => {
    onApply({ searchQuery, status, date, reason, refundMethod, warehouseId: selectedWarehouseId });
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.8}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel={t('returns.back')}
        >
          <BackArrowIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('returns.filters.title')}</Text>
        <TouchableOpacity
          onPress={clearAll}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('returns.filters.clearAll')}
        >
          <Text style={styles.clearAllText}>{t('returns.filters.clearAll')}</Text>
        </TouchableOpacity>
      </View>

      {/* Body */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search */}
        <View style={styles.searchBar}>
          <SearchIcon />
          <TextInput
            style={styles.searchInput}
            placeholder={t('returns.filters.search')}
            placeholderTextColor={adminColors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
        </View>

        {/* Status */}
        <View style={styles.sectionHeadRow}>
          <FlagIcon />
          <Text style={styles.sectionTitle}>{t('returns.filters.status')}</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScrollRow}
        >
          {STATUS_OPTIONS.map((item) => {
            const active = item === status;
            return (
              <TouchableOpacity
                key={item}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setStatus(item)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {statusLabel(item)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Date */}
        <View style={styles.sectionHeadRow}>
          <CalendarIcon />
          <Text style={styles.sectionTitle}>{t('returns.filters.date')}</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScrollRow}
        >
          {DATE_OPTIONS.map((item) => {
            const active = item === date;
            return (
              <TouchableOpacity
                key={item}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setDate(item)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {dateLabel(item)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Return Reason */}
        <View style={styles.sectionHeadRow}>
          <AlertCircleIcon />
          <Text style={styles.sectionTitle}>{t('returns.filters.reason')}</Text>
        </View>
        <View style={styles.chipWrap}>
          {REASON_OPTIONS.map((item) => {
            const active = item === reason;
            return (
              <TouchableOpacity
                key={item}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setReason(item)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {reasonLabel(item)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Refund Method */}
        <View style={styles.sectionHeadRow}>
          <CreditCardIcon />
          <Text style={styles.sectionTitle}>{t('returns.filters.refundMethod')}</Text>
        </View>
        <View style={styles.chipWrap}>
          {REFUND_OPTIONS.map((item) => {
            const active = item === refundMethod;
            return (
              <TouchableOpacity
                key={item}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setRefundMethod(item)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {refundLabel(item)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Warehouse selector (Main Warehouse view only) */}
        {showWarehouseSelector && warehouses.length > 0 ? (
          <>
            <View style={styles.sectionHeadRow}>
              <BuildingWarehouseIcon />
              <Text style={styles.sectionTitle}>{t('returns.filters.warehouse')}</Text>
            </View>
            <View style={styles.chipWrap}>
              {warehouses.map((w) => {
                const isAll = w.id === 'ALL';
                const active = isAll ? selectedWarehouseId === undefined : selectedWarehouseId === w.id;
                return (
                  <TouchableOpacity
                    key={w.id}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setSelectedWarehouseId(isAll ? undefined : w.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{w.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        ) : null}

        {/* Locked warehouse pill (Sub Warehouse view) */}
        {!showWarehouseSelector && warehouseName !== undefined ? (
          <View style={styles.lockedNote}>
            <LockIcon />
            <Text style={styles.lockedNoteText}>
              {t('returns.filters.lockedTo', { name: warehouseName })}
            </Text>
          </View>
        ) : null}

        <View style={{ height: adminSpacing.lg }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.applyButton}
          onPress={handleApply}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t('returns.filters.apply')}
        >
          <FunnelIcon />
          <Text style={styles.applyButtonText}>{t('returns.filters.apply')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  clearAllText: {
    ...adminType.rowMeta,
    fontWeight: '700',
    color: adminColors.onBrand,
    textDecorationLine: 'underline',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    height: 48,
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.xs,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  sectionHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    marginTop: adminSpacing.lg,
    marginBottom: adminSpacing.md,
  },
  sectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  horizontalScrollRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    paddingRight: adminSpacing.lg,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.sm,
  },
  chip: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: adminColors.brandTint,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
  },
  chipText: {
    ...adminType.rowMeta,
    fontWeight: '700',
    color: adminColors.muted,
  },
  chipTextActive: {
    color: adminColors.brand,
  },
  lockedNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    backgroundColor: adminColors.brandSoft.bg,
    borderWidth: 1,
    borderColor: adminColors.brandSoft.border,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    marginTop: adminSpacing.xl,
  },
  lockedNoteText: {
    flex: 1,
    ...adminType.rowMeta,
    fontWeight: '600',
    color: adminColors.brandSoft.text,
    lineHeight: 18,
  },
  footer: {
    backgroundColor: adminColors.card,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  applyButton: {
    backgroundColor: adminColors.brand,
    height: ADMIN_BUTTON_HEIGHT,
    borderRadius: adminRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.sm,
  },
  applyButtonText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
  },
});
