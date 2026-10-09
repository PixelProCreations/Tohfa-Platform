/**
 * Building blocks shared by the wallet & cash top-up screens (design module M8).
 *
 * The eleven Sub screens and twelve Main copies each drew their own orange
 * header, translucent header button, field grid, badge, info box, bottom tab
 * bar and footer button with a local PALETTE and a hard-coded font family.
 * They are drawn once here, on the admin theme.
 *
 * Scope helpers mirror billing-invoices/BillingParts: Main (`scope.warehouseId`
 * undefined) sees every warehouse's rows and gets the all-warehouses selector;
 * Sub sees only its own rows and a locked warehouse pill. The server applies
 * the real filter (cross-scope reads return an empty set, CLAUDE.md 2.1); this
 * only decides what to render.
 */
import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType, ADMIN_BUTTON_HEIGHT, type AdminTone } from '../../../theme';
import { WarehouseSelector } from '../inventory';
import type { WarehouseScope, WarehouseTab } from './types';

const HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };

/** Main Warehouse view: no warehouseId means every warehouse. */
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

/** Whole rupees of a display amount like '₹4,500.00' (mock values only; never used to move money). */
export function rupeesOf(display: string | undefined): number {
  if (!display) return 0;
  const whole = display.split('.')[0] ?? '';
  const digits = whole.replace(/[^0-9]/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

/** '₹2,000' from whole rupees. */
export function formatRupees(rupees: number, withPaise = false): string {
  return `₹${rupees.toLocaleString('en-IN', withPaise ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : {})}`;
}

// ─── Icons ───────────────────────────────────────────────────────────────────

interface IconProps {
  size?: number;
  color?: string;
}

export function BackArrowIcon({ size = 24, color = adminColors.onBrand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ArrowForwardIcon({ size = 18, color = adminColors.onBrand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14M12 5l7 7-7 7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CheckIcon({ size = 18, color = adminColors.onBrand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function SuccessCircleIcon({ size = 36, color = adminColors.success.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2.2" />
      <Path d="M8 12.5l2.5 2.5 5.5-5.5" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function InfoIcon({ size = 18, color = adminColors.info.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 8h.01M12 11v5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function CashIcon({ size = 20, color = adminColors.onBrand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="12" rx="2" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="12" r="2" stroke={color} strokeWidth="2" />
      <Path d="M6 12h.01M18 12h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function StoreIcon({ size = 18, color = adminColors.success.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 22V12h6v10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function LockIcon({ size = 12, color = adminColors.onBrand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function SearchIcon({ size = 18, color = adminColors.muted }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth="2" />
      <Path d="M21 21l-4.35-4.35" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function SlidersIcon({ size = 18, color = adminColors.onBrand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function CalendarIcon({ size = 18, color = adminColors.muted }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function ArrowDownIcon({ size = 18, color = adminColors.muted }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M19 12l-7 7-7-7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ExportIcon({ size = 18, color = adminColors.brandDeep }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3v12m0-12l-4 4m4-4l4 4M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ReceiptIcon({ size = 20, color = adminColors.onBrand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 2v20l3-2 3 2 3-2 3 2 4-2V2l-4 2-3-2-3 2-3-2-3 2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M8 8h8M8 12h8M8 16h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function BellRingIcon({ size = 24, color = adminColors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 2C2.8 3.7 2 5.7 2 8M22 8c0-2.3-.8-4.3-2-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ShieldCheckIcon({ size = 16, color = adminColors.success.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Frame ───────────────────────────────────────────────────────────────────

export interface WalletScreenProps {
  title: string;
  subtitle?: string | undefined;
  onBack: () => void;
  /** Right side of the header row (filter, bell). */
  headerRight?: React.ReactNode;
  /** Extra header content under the title row (warehouse pill / selector). */
  headerExtra?: React.ReactNode;
  /** Sticky bar under the content (actions, bottom tabs). */
  footer?: React.ReactNode;
  children: React.ReactNode;
}

/** Orange header + canvas body + optional sticky footer: the frame of every wallet screen. */
export function WalletScreen({ title, subtitle, onBack, headerRight, headerExtra, footer, children }: WalletScreenProps) {
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

/** Round button on the orange header (filter, bell). */
export function HeaderIconButton({
  onPress,
  accessibilityLabel,
  children,
}: {
  onPress: () => void;
  accessibilityLabel: string;
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
    </TouchableOpacity>
  );
}

/**
 * Header content under the title: the all-warehouses selector for Main (when
 * the screen offers one), the locked warehouse pill for Sub. `label` replaces
 * the pill text (e.g. "Coonoor Warehouse · 25 Sep 2026").
 */
export function ScopeHeader({
  scope,
  label,
  warehouseOptions,
  selectedWarehouseId,
  onSelectWarehouse,
}: {
  scope: WarehouseScope;
  label?: string | undefined;
  warehouseOptions?: readonly WarehouseScope[] | undefined;
  selectedWarehouseId?: string | undefined;
  onSelectWarehouse?: ((warehouseId: string | undefined) => void) | undefined;
}) {
  if (isAllWarehouses(scope)) {
    if (onSelectWarehouse === undefined) {
      return (
        <View style={styles.warehousePill}>
          <Text style={styles.warehousePillText}>{label ?? 'All Warehouses'}</Text>
        </View>
      );
    }
    return (
      <WarehouseSelector
        scope={scope}
        options={warehouseOptions}
        selectedId={selectedWarehouseId}
        onSelect={(id) => onSelectWarehouse(id)}
      />
    );
  }
  return (
    <View style={styles.warehousePill}>
      <LockIcon />
      <Text style={styles.warehousePillText}>{label ?? `${scope.warehouseName ?? scope.warehouseId} · Active`}</Text>
    </View>
  );
}

// ─── Content pieces ──────────────────────────────────────────────────────────

export function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  if (right === undefined) return <Text style={styles.sectionTitle}>{children}</Text>;
  return (
    <View style={styles.sectionRow}>
      <Text style={[styles.sectionTitle, styles.sectionTitleInRow]}>{children}</Text>
      {right}
    </View>
  );
}

/** Small muted note on the right of a section title ("Required", "Config-driven"). */
export function SectionHint({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionHint}>{children}</Text>;
}

export function Card({ children, centered = false }: { children: React.ReactNode; centered?: boolean }) {
  return <View style={[styles.card, centered && styles.cardCentered]}>{children}</View>;
}

export interface InfoField {
  label: string;
  value: string;
}

/** Card of label/value fields; each inner array is one row of one or two columns. */
export function InfoCard({ rows }: { rows: readonly (readonly InfoField[])[] }) {
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

export type AmountRowEmphasis = 'normal' | 'credit' | 'debit' | 'total';

/** Label / amount row inside a card; `divider` draws the rule above it. */
export function AmountRow({
  label,
  value,
  emphasis = 'normal',
  divider = false,
}: {
  label: string;
  value: string;
  emphasis?: AmountRowEmphasis;
  divider?: boolean;
}) {
  return (
    <>
      {divider ? <View style={styles.divider} /> : null}
      <View style={styles.amountRow}>
        <Text style={emphasis === 'total' ? styles.amountLabelTotal : styles.amountLabel}>{label}</Text>
        <Text style={[styles.amountValue, AMOUNT_EMPHASIS[emphasis]]}>{value}</Text>
      </View>
    </>
  );
}

/** Row of KPI tiles (value over an uppercase caption). */
export function KpiRow({ items }: { items: readonly { value: string; label: string; tone?: AdminTone | undefined }[] }) {
  return (
    <View style={styles.kpiRow}>
      {items.map((item) => (
        <View key={item.label} style={styles.kpiCard}>
          <Text style={[styles.kpiValue, item.tone !== undefined && { color: adminColors[item.tone].text }]}>{item.value}</Text>
          <Text style={styles.kpiLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

/** Tinted note (backend rules, safety notes). */
export function InfoNote({
  children,
  tone = 'info',
  icon,
}: {
  children: React.ReactNode;
  tone?: AdminTone;
  icon?: React.ReactNode;
}) {
  const colors = adminColors[tone];
  return (
    <View style={[styles.infoNote, { backgroundColor: colors.bg }]}>
      {icon ?? <InfoIcon color={colors.text} />}
      <Text style={[styles.infoNoteText, { color: colors.text }]}>{children}</Text>
    </View>
  );
}

export function StatusBadge({ label, tone }: { label: string; tone: AdminTone }) {
  const colors = adminColors[tone];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.badgeText, { color: colors.text }]}>{label}</Text>
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
  labelOf,
}: {
  options: readonly T[];
  value: T;
  onChange: (next: T) => void;
  labelOf?: ((option: T) => string) | undefined;
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
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{labelOf ? labelOf(option) : option}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/** White sticky bar holding the screen's actions. */
export function WalletFooter({ children }: { children: React.ReactNode }) {
  return <View style={styles.footer}>{children}</View>;
}

export type WalletButtonVariant = 'primary' | 'outline' | 'neutral';

export function WalletButton({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled = false,
  flex = false,
}: {
  label: string;
  onPress: () => void;
  variant?: WalletButtonVariant | undefined;
  icon?: React.ReactNode;
  disabled?: boolean | undefined;
  /** Share a row with another button. */
  flex?: boolean | undefined;
}) {
  return (
    <TouchableOpacity
      style={[styles.button, BUTTON_STYLE[variant], flex && styles.buttonFlex, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      {icon}
      <Text style={[styles.buttonText, BUTTON_TEXT_STYLE[variant]]}>{label}</Text>
    </TouchableOpacity>
  );
}

/** Muted note under a hidden or disabled action, saying why it is not offered. */
export function PermissionNote({ children }: { children: React.ReactNode }) {
  return <Text style={styles.permissionNote}>{children}</Text>;
}

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string | undefined }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

// ─── Bottom tab bar ──────────────────────────────────────────────────────────

function TabIcon({ tab, active }: { tab: WarehouseTab; active: boolean }) {
  const color = active ? adminColors.brand : adminColors.muted;
  switch (tab) {
    case 'Home':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1V9.5z"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'Receiving':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path d="M6 3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z" stroke={color} strokeWidth="1.8" />
          <Path d="M12 7v7.5M8.5 11.5L12 15l3.5-3.5M8 18h8" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'Inventory':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M5.5 4A2.5 2.5 0 0 0 3 6.5v11A2.5 2.5 0 0 0 5.5 20h13a2.5 2.5 0 0 0 2.5-2.5v-11A2.5 2.5 0 0 0 18.5 4h-13z"
            stroke={color}
            strokeWidth="1.8"
          />
          <Path d="M3 9.5h18M10 13.5h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </Svg>
      );
    default:
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          {[5, 12, 19].flatMap((cy) =>
            [5, 12, 19].map((cx) => <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2" fill={color} />),
          )}
        </Svg>
      );
  }
}

const TABS: readonly WarehouseTab[] = ['Home', 'Receiving', 'Inventory', 'More'];

/**
 * The warehouse shells' bottom navigation (wallet lives under More). Without
 * `onTabChange` the Home tab falls back to `onBack`, as the Sub screens did.
 */
export function WarehouseTabBar({
  onTabChange,
  onBack,
}: {
  onTabChange?: ((tab: WarehouseTab) => void) | undefined;
  onBack?: (() => void) | undefined;
}) {
  return (
    <View style={styles.tabBar}>
      {TABS.map((tab) => {
        const active = tab === 'More';
        return (
          <TouchableOpacity
            key={tab}
            style={styles.tabItem}
            onPress={() => {
              if (onTabChange) onTabChange(tab);
              else if (tab === 'Home') onBack?.();
            }}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <TabIcon tab={tab} active={active} />
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const BACK_BUTTON = 36;
const HEADER_ICON_BUTTON = 36;
const SEARCH_HEIGHT = 46;

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

  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  sectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  sectionTitleInRow: { marginTop: 0, marginBottom: 0 },
  sectionHint: { ...adminType.rowMeta, color: adminColors.muted },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
  },
  cardCentered: { alignItems: 'center', paddingVertical: adminSpacing.lg },
  twoColRow: { flexDirection: 'row', alignItems: 'flex-start' },
  twoColRowSpaced: { marginTop: adminSpacing.md },
  col: { flex: 1 },
  fieldLabel: { ...adminType.rowMeta, color: adminColors.muted },
  fieldValue: { ...adminType.rowTitle, color: adminColors.ink, marginTop: 2 },

  divider: { height: 1, backgroundColor: adminColors.border, marginVertical: adminSpacing.sm },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amountLabel: { ...adminType.body, color: adminColors.ink },
  amountLabelTotal: { ...adminType.rowTitle, color: adminColors.brandDeep },
  amountValue: { ...adminType.rowTitle, color: adminColors.ink },

  kpiRow: { flexDirection: 'row', gap: adminSpacing.sm, marginBottom: adminSpacing.md },
  kpiCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.xs,
    alignItems: 'center',
  },
  kpiValue: { ...adminType.kpiValue, color: adminColors.ink },
  kpiLabel: { ...adminType.caption, color: adminColors.muted, marginTop: adminSpacing.xs, textAlign: 'center' },

  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: adminSpacing.sm,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    marginTop: adminSpacing.md,
  },
  infoNoteText: { ...adminType.rowMeta, flex: 1 },

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
  chipActive: { backgroundColor: adminColors.brand, borderColor: adminColors.brand },
  chipText: { ...adminType.rowMeta, color: adminColors.muted },
  chipTextActive: { ...adminType.caption, color: adminColors.onBrand },

  footer: {
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    gap: adminSpacing.sm,
    ...adminShadow.sm,
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
  buttonFlex: { flex: 1 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { ...adminType.sectionHead },
  permissionNote: { ...adminType.rowMeta, color: adminColors.muted, textAlign: 'center' },

  emptyState: { alignItems: 'center', paddingVertical: adminSpacing.xxl, paddingHorizontal: adminSpacing.lg },
  emptyTitle: { ...adminType.sectionHead, color: adminColors.ink, textAlign: 'center' },
  emptySubtitle: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xs, textAlign: 'center' },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
    paddingHorizontal: adminSpacing.xs,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 2 },
  tabLabel: { ...adminType.caption, color: adminColors.muted, marginTop: adminSpacing.xs },
  tabLabelActive: { color: adminColors.brand },
});

const AMOUNT_EMPHASIS = StyleSheet.create({
  normal: {},
  credit: { color: adminColors.success.text },
  debit: { color: adminColors.danger.text },
  total: { ...adminType.sectionHead, color: adminColors.brandDeep },
});

const BUTTON_STYLE = StyleSheet.create({
  primary: { backgroundColor: adminColors.brand },
  outline: { backgroundColor: adminColors.card, borderWidth: 1.5, borderColor: adminColors.brand },
  neutral: { backgroundColor: adminColors.card, borderWidth: 1.5, borderColor: adminColors.border },
});

const BUTTON_TEXT_STYLE = StyleSheet.create({
  primary: { color: adminColors.onBrand },
  outline: { color: adminColors.brandDeep },
  neutral: { color: adminColors.muted },
});

/** Shared scroll-content padding for wallet screens. */
export const walletLayout = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.xl,
  },
});
