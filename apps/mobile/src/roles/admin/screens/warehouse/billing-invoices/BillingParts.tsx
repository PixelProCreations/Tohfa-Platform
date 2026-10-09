/**
 * Building blocks shared by the billing & invoice screens (design module M9).
 *
 * The twelve Sub screens and six Main copies each drew their own orange
 * header, translucent header button, status badge, info box and footer button
 * with a local PALETTE. They are drawn once here, on the admin theme.
 *
 * Scope helpers mirror returns-rma/ReturnsParts: Main (`scope.warehouseId`
 * undefined, rbac grant `all`) sees every warehouse's rows and gets the
 * all-warehouses selector; Sub (grant `own`) sees only its own rows and a
 * locked warehouse pill. The server applies the real filter (cross-scope reads
 * return an empty set, CLAUDE.md 2.1); this only decides what to render.
 */
import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType, ADMIN_BUTTON_HEIGHT } from '../../../theme';
import { WarehouseSelector } from '../inventory';
import type { InvoiceStatus, WarehouseScope } from './types';

const HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };

/** Main Warehouse view: no warehouseId means every warehouse (rbac grant `all`). */
export function isAllWarehouses(scope: WarehouseScope): boolean {
  return scope.warehouseId === undefined;
}

/**
 * True when a row owned by `warehouseId` is visible: Main sees every row (or
 * the one warehouse picked in its selector), Sub only its own. Rows without a
 * warehouse stay visible; the server applies the real filter.
 */
export function inScope(scope: WarehouseScope, warehouseId: string | undefined, selectedId?: string | undefined): boolean {
  if (warehouseId === undefined) return true;
  if (scope.warehouseId !== undefined) return warehouseId === scope.warehouseId;
  return selectedId === undefined || warehouseId === selectedId;
}

/** Whole rupees of a display amount like '₹2,450' (mock rows only; used to filter/sort, never to compute money). */
export function rupeesOf(amount: string): number {
  const digits = amount.replace(/[^0-9]/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

// ─── Icons ───────────────────────────────────────────────────────────────────

export function BackArrowIcon({ color = adminColors.onBrand }: { color?: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function DownloadIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SearchIcon({ color = adminColors.muted }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 21l-4.35-4.35M18 10.5a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function FilterSlidersIcon({ color = adminColors.onBrand }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"
        stroke={color}
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

export function InfoIcon({ color = adminColors.info.text }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 16v-4M12 8h.01"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Frame ───────────────────────────────────────────────────────────────────

export interface BillingScreenProps {
  title: string;
  subtitle?: string | undefined;
  onBack: () => void;
  /** Right side of the header row (bell, filter, download, reset). */
  headerRight?: React.ReactNode;
  /** Extra header content under the title row (warehouse pill / selector, segment). */
  headerExtra?: React.ReactNode;
  /** Sticky bar under the content (actions, bottom tabs). */
  footer?: React.ReactNode;
  children: React.ReactNode;
}

/** Orange header + canvas body + optional sticky footer: the frame of every billing screen. */
export function BillingScreen({ title, subtitle, onBack, headerRight, headerExtra, footer, children }: BillingScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.8}
            hitSlop={HIT_SLOP}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <BackArrowIcon />
          </TouchableOpacity>
          <View style={styles.headerTextGroup}>
            <Text style={styles.headerTitle}>{title}</Text>
            {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
          </View>
          {headerRight}
        </View>
        {headerExtra}
      </View>
      <View style={styles.body}>{children}</View>
      {footer}
    </SafeAreaView>
  );
}

/** Round button on the orange header (bell, filter, download). */
export function HeaderIconButton({
  onPress,
  accessibilityLabel,
  badge = false,
  children,
}: {
  onPress: () => void;
  accessibilityLabel: string;
  /** Small dot (e.g. "filters applied"). */
  badge?: boolean;
  children: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      style={styles.headerIconButton}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {children}
      {badge ? <View style={styles.headerIconBadge} /> : null}
    </TouchableOpacity>
  );
}

/**
 * Header content under the title: the all-warehouses selector for Main, the
 * locked warehouse pill for Sub.
 */
export function ScopeHeader({
  scope,
  warehouseOptions,
  selectedWarehouseId,
  onSelectWarehouse,
}: {
  scope: WarehouseScope;
  warehouseOptions?: readonly WarehouseScope[] | undefined;
  selectedWarehouseId?: string | undefined;
  onSelectWarehouse?: ((warehouseId: string | undefined) => void) | undefined;
}) {
  if (isAllWarehouses(scope)) {
    return (
      <WarehouseSelector
        scope={scope}
        options={warehouseOptions}
        selectedId={selectedWarehouseId}
        onSelect={(id) => onSelectWarehouse?.(id)}
      />
    );
  }
  return (
    <View style={styles.warehousePill}>
      <LockIcon />
      <Text style={styles.warehousePillText}>{scope.warehouseName ?? scope.warehouseId} · Active</Text>
    </View>
  );
}

// ─── Content pieces ──────────────────────────────────────────────────────────

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export interface InfoField {
  label: string;
  value: string;
}

/** Card of label/value fields; each inner array is one row of one or two columns. */
export function InfoCard({ rows }: { rows: InfoField[][] }) {
  return (
    <View style={styles.card}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={[styles.twoColRow, rowIndex > 0 && styles.twoColRowSpaced]}>
          {row.map((field) => (
            <View key={field.label} style={styles.col}>
              <Text style={styles.fieldLabel}>{field.label}</Text>
              <Text style={styles.fieldValue}>{field.value}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

/** Blue info note (backend rules, privacy notes). */
export function InfoNote({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <View style={styles.infoNote}>
      {icon ?? <InfoIcon />}
      <Text style={styles.infoNoteText}>{children}</Text>
    </View>
  );
}

const STATUS_TONE: Record<InvoiceStatus | 'Completed' | 'Invoice Exists', 'success' | 'warning' | 'danger'> = {
  Generated: 'success',
  Completed: 'success',
  Pending: 'warning',
  Cancelled: 'danger',
  'Invoice Exists': 'danger',
};

export function StatusBadge({ status }: { status: InvoiceStatus | 'Completed' | 'Invoice Exists' }) {
  const tone = adminColors[STATUS_TONE[status]];
  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }]}>
      <Text style={[styles.badgeText, { color: tone.text }]}>{status}</Text>
    </View>
  );
}

export function SearchBar({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
}) {
  return (
    <View style={styles.searchBar}>
      <SearchIcon />
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        placeholderTextColor={adminColors.placeholder}
        value={value}
        onChangeText={onChangeText}
        returnKeyType="search"
      />
    </View>
  );
}

/** Row of selectable chips. */
export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((option) => {
        const active = option === value;
        return (
          <TouchableOpacity
            key={option}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onChange(option)}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{option}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/** White sticky bar holding the screen's actions. */
export function BillingFooter({ children }: { children: React.ReactNode }) {
  return <View style={styles.footer}>{children}</View>;
}

export type BillingButtonVariant = 'primary' | 'outline' | 'tint' | 'neutral';

export function BillingButton({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled = false,
  compact = false,
  flex = false,
}: {
  label: string;
  onPress: () => void;
  variant?: BillingButtonVariant | undefined;
  icon?: React.ReactNode;
  disabled?: boolean | undefined;
  /** Small in-card button instead of the 48px full-width one. */
  compact?: boolean | undefined;
  /** Share a row with another button. */
  flex?: boolean | undefined;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        compact && styles.buttonCompact,
        BUTTON_STYLE[variant],
        flex && styles.buttonFlex,
        disabled && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      {icon}
      <Text style={[styles.buttonText, compact && styles.buttonTextCompact, BUTTON_TEXT_STYLE[variant]]}>{label}</Text>
    </TouchableOpacity>
  );
}

/** Muted note under a hidden or disabled action, saying why it is not offered. */
export function PermissionNote({ children }: { children: React.ReactNode }) {
  return <Text style={styles.permissionNote}>{children}</Text>;
}

/** The PDF's dark confirmation toast. */
export function BillingToast({ message }: { message: string }) {
  return (
    <View style={styles.toast}>
      <Text style={styles.toastText}>{message}</Text>
    </View>
  );
}

const BACK_BUTTON = 36;
const HEADER_ICON_BUTTON = 36;
const HEADER_BADGE = 8;
const SEARCH_HEIGHT = 46;
const COMPACT_BUTTON_HEIGHT = 36;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: adminColors.brand },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.lg,
  },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.md },
  backButton: { width: BACK_BUTTON, height: BACK_BUTTON, alignItems: 'center', justifyContent: 'center' },
  headerTextGroup: { flex: 1 },
  headerTitle: { ...adminType.title, color: adminColors.onBrand },
  headerSubtitle: { ...adminType.rowMeta, color: adminColors.onBrand, marginTop: 2 },
  // Was 22% translucent white over the orange header; nearest solid token is brandDeep.
  headerIconButton: {
    width: HEADER_ICON_BUTTON,
    height: HEADER_ICON_BUTTON,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brandDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconBadge: {
    position: 'absolute',
    top: adminSpacing.xs,
    right: adminSpacing.xs,
    width: HEADER_BADGE,
    height: HEADER_BADGE,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.onBrand,
  },
  // Was 22% translucent white; nearest solid token is brandDeep (as the inventory selector chips).
  warehousePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: adminColors.brandDeep,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.full,
    marginTop: adminSpacing.sm,
    gap: adminSpacing.xs,
  },
  warehousePillText: { ...adminType.caption, color: adminColors.onBrand },
  body: { flex: 1, backgroundColor: adminColors.canvas },

  sectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
  },
  twoColRow: { flexDirection: 'row', alignItems: 'flex-start' },
  twoColRowSpaced: { marginTop: adminSpacing.md },
  col: { flex: 1 },
  fieldLabel: { ...adminType.rowMeta, color: adminColors.muted },
  fieldValue: { ...adminType.rowTitle, color: adminColors.ink, marginTop: 2 },

  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: adminSpacing.sm,
    backgroundColor: adminColors.info.bg,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    marginTop: adminSpacing.md,
  },
  infoNoteText: { ...adminType.rowMeta, flex: 1, color: adminColors.info.text },

  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 2,
    borderRadius: adminRadius.full,
  },
  badgeText: { ...adminType.caption },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    height: SEARCH_HEIGHT,
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  searchInput: { ...adminType.body, flex: 1, color: adminColors.ink, paddingVertical: 0 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: adminSpacing.sm },
  chip: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
  },
  chipActive: { backgroundColor: adminColors.brandTint, borderColor: adminColors.brand },
  chipText: { ...adminType.rowMeta, color: adminColors.muted },
  chipTextActive: { ...adminType.caption, color: adminColors.brand },

  footer: {
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: ADMIN_BUTTON_HEIGHT,
    borderRadius: adminRadius.md,
    gap: adminSpacing.sm,
    paddingHorizontal: adminSpacing.md,
  },
  buttonCompact: { height: COMPACT_BUTTON_HEIGHT, borderRadius: adminRadius.xs },
  buttonFlex: { flex: 1 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { ...adminType.sectionHead },
  buttonTextCompact: { ...adminType.rowTitle },
  permissionNote: { ...adminType.rowMeta, color: adminColors.muted, textAlign: 'center' },

  toast: {
    backgroundColor: adminColors.toast.bg,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    alignItems: 'center',
    ...adminShadow.md,
  },
  toastText: { ...adminType.rowTitle, color: adminColors.toast.text },
});

const BUTTON_STYLE = StyleSheet.create({
  primary: { backgroundColor: adminColors.brand },
  outline: { backgroundColor: adminColors.card, borderWidth: 1.5, borderColor: adminColors.brand },
  tint: { backgroundColor: adminColors.brandTint },
  neutral: { backgroundColor: adminColors.card, borderWidth: 1.5, borderColor: adminColors.border },
});

const BUTTON_TEXT_STYLE = StyleSheet.create({
  primary: { color: adminColors.onBrand },
  outline: { color: adminColors.brand },
  tint: { color: adminColors.brand },
  neutral: { color: adminColors.muted },
});
