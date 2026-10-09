/**
 * Building blocks shared by the warehouse customer screens (design module M7).
 *
 * The nine Sub survivors and the five absorbed Main twins each carried their
 * own orange header, KPI tile row, search box, filter chips, two-column field
 * card and green-ring timeline. They are drawn once here, on the admin theme.
 *
 * The old headers put their icon buttons on a translucent white circle
 * (22% white); the theme has no translucent token, so they use
 * the nearest solid one, `brandDeep`, as the inventory WarehouseSelector does.
 */
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { adminColors, adminRadius, adminSpacing, adminType, ADMIN_BUTTON_HEIGHT, type AdminTone } from '../../../theme';
import { DEFAULT_CUSTOMER } from './fixtures';
import type { CustomerRecord, CustomerRef, WarehouseScope } from './types';

const HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };

/** Main Warehouse view: no warehouseId means every warehouse. */
export function isAllWarehouses(scope: WarehouseScope): boolean {
  return scope.warehouseId === undefined;
}

/**
 * True when a row owned by `warehouseId` is visible in `scope`: Main sees every
 * row, Sub only its own. Rows without a warehouse stay visible; the server
 * applies the real own-warehouse filter (customer.list.view SUB grant `own`).
 */
export function inScope(scope: WarehouseScope, warehouseId: string | undefined): boolean {
  return scope.warehouseId === undefined || warehouseId === undefined || warehouseId === scope.warehouseId;
}

/**
 * The customer in focus with the default filled in for every field the caller
 * did not pass (deep links carry only a name/id). Explicit `undefined`s are
 * ignored so they cannot blank a field.
 */
export function resolveCustomer(ref?: CustomerRef): CustomerRecord {
  const known = Object.fromEntries(Object.entries(ref ?? {}).filter(([, value]) => value !== undefined));
  return { ...DEFAULT_CUSTOMER, ...known };
}

// ─── Icons ──────────────────────────────────────────────────────────────────

export function BackArrowIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={adminColors.onBrand}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SearchIcon({ color = adminColors.muted }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M20 20l-4-4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function FilterIcon({ color = adminColors.onBrand }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M4 6h10M18 6h2M14 4v4M4 12h3M11 12h9M7 10v4M4 18h11M19 18h1M15 16v4" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

export function BellIcon() {
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
        stroke={adminColors.onBrand}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function UsersIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
        stroke={adminColors.onBrand}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Frame ──────────────────────────────────────────────────────────────────

export interface CustomersScreenProps {
  title: string;
  subtitle?: string | undefined;
  onBack: () => void;
  /** Icon left of the title (the list's group icon). */
  titleIcon?: React.ReactNode;
  /** Right side of the header row (bell, filter, reset). */
  headerRight?: React.ReactNode;
  /** Extra header content under the title row (warehouse selector). */
  headerExtra?: React.ReactNode;
  /** Sticky bar under the content (actions). */
  footer?: React.ReactNode;
  children: React.ReactNode;
}

/** Orange header + scrolling canvas body + optional sticky footer: the frame of every customer screen. */
export function CustomersScreen({
  title,
  subtitle,
  onBack,
  titleIcon,
  headerRight,
  headerExtra,
  footer,
  children,
}: CustomersScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      <View style={styles.header}>
        <View style={styles.headerRow}>
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
          {titleIcon}
          <View style={styles.headerTextGroup}>
            <Text style={styles.headerTitle}>{title}</Text>
            {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
          </View>
          {headerRight}
        </View>
        {headerExtra}
      </View>
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
      {footer}
    </SafeAreaView>
  );
}

/** Round icon button on the orange header. */
export function HeaderIconButton({
  onPress,
  label,
  showDot = false,
  children,
}: {
  onPress?: (() => void) | undefined;
  label: string;
  showDot?: boolean;
  children: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      style={styles.headerIconButton}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {children}
      {showDot ? <View style={styles.headerIconDot} /> : null}
    </TouchableOpacity>
  );
}

/** Text button on the orange header (Reset). */
export function HeaderTextButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.headerTextButton} onPress={onPress} activeOpacity={0.7} accessibilityRole="button">
      <Text style={styles.headerTextButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Content blocks ─────────────────────────────────────────────────────────

export interface StatTileItem {
  label: string;
  value: string | number;
  onPress?: (() => void) | undefined;
}

/** Row (or 2-column grid with `columns={2}`) of KPI tiles. */
export function StatTiles({ items, columns }: { items: readonly StatTileItem[]; columns?: 2 | undefined }) {
  return (
    <View style={[styles.statsRow, columns === 2 && styles.statsGrid]}>
      {items.map((item) => {
        const content = (
          <>
            <Text style={styles.statValue} numberOfLines={1}>
              {item.value}
            </Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </>
        );
        const tileStyle = [styles.statTile, columns === 2 && styles.statTileHalf];
        return item.onPress ? (
          <TouchableOpacity key={item.label} style={tileStyle} onPress={item.onPress} activeOpacity={0.8} accessibilityRole="button">
            {content}
          </TouchableOpacity>
        ) : (
          <View key={item.label} style={tileStyle}>
            {content}
          </View>
        );
      })}
    </View>
  );
}

/** Search box with a magnifier. */
export function SearchField({
  value,
  onChangeText,
  placeholder,
  onFocus,
  right,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  onFocus?: (() => void) | undefined;
  right?: React.ReactNode;
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
        onFocus={onFocus}
        autoCorrect={false}
        clearButtonMode="while-editing"
      />
      {right}
    </View>
  );
}

/** Selectable pills. `scroll` lays them out on one horizontally scrolling line. */
export function ChipRow<T extends string>({
  options,
  selected,
  onSelect,
  scroll = false,
}: {
  options: readonly T[];
  selected: T;
  onSelect: (value: T) => void;
  scroll?: boolean;
}) {
  const chips = options.map((opt) => {
    const active = opt === selected;
    return (
      <TouchableOpacity
        key={opt}
        style={[styles.chip, active && styles.chipActive]}
        onPress={() => onSelect(opt)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
      >
        <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
      </TouchableOpacity>
    );
  });
  return scroll ? (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipLine}>
      {chips}
    </ScrollView>
  ) : (
    <View style={styles.chipWrap}>{chips}</View>
  );
}

/** Status pill in a theme tone. */
export function StatusBadge({ label, tone }: { label: string; tone: AdminTone }) {
  return (
    <View style={[styles.badge, { backgroundColor: adminColors[tone].bg }]}>
      <Text style={[styles.badgeText, { color: adminColors[tone].text }]}>{label}</Text>
    </View>
  );
}

/** Section heading above a card. */
export function SectionHeading({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionHeading}>{children}</Text>
      {right}
    </View>
  );
}

export interface InfoField {
  label: string;
  value: string | number;
}

/** A card of label/value fields; each inner array is one row of one or two columns. */
export function InfoGrid({ rows }: { rows: readonly (readonly InfoField[])[] }) {
  return (
    <View style={styles.card}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={[styles.infoRow, rowIndex > 0 && styles.infoRowGap]}>
          {row.map((field) => (
            <View key={field.label} style={styles.infoCol}>
              <Text style={styles.infoLabel}>{field.label}</Text>
              <Text style={styles.infoValue}>{field.value}</Text>
            </View>
          ))}
          {row.length === 1 ? <View style={styles.infoCol} /> : null}
        </View>
      ))}
    </View>
  );
}

export interface TimelineStep {
  title: string;
  completed: boolean;
}

/** Vertical stepper: success ring for done steps, muted ring for pending. */
export function Timeline({ steps }: { steps: readonly TimelineStep[] }) {
  return (
    <View style={styles.card}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const nextDone = steps[index + 1]?.completed === true;
        return (
          <View key={step.title} style={styles.timelineRow}>
            <View style={styles.timelineNodeCol}>
              <View style={[styles.timelineRing, !step.completed && styles.timelineRingPending]}>
                {step.completed ? <View style={styles.timelineDot} /> : null}
              </View>
              {!isLast ? <View style={[styles.timelineLine, step.completed && nextDone && styles.timelineLineDone]} /> : null}
            </View>
            <Text style={styles.timelineTitle}>{step.title}</Text>
          </View>
        );
      })}
    </View>
  );
}

/** Tinted note box (view-only notices, warehouse lock notice). */
export function NoteBox({ text, icon }: { text: string; icon?: React.ReactNode }) {
  return (
    <View style={styles.note}>
      {icon}
      <Text style={styles.noteText}>{text}</Text>
    </View>
  );
}

/** Full-width filled orange button. */
export function PrimaryButton({ label, onPress, icon }: { label: string; onPress: () => void; icon?: React.ReactNode }) {
  return (
    <TouchableOpacity style={styles.primaryButton} onPress={onPress} activeOpacity={0.85} accessibilityRole="button">
      {icon}
      <Text style={styles.primaryButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

/** "View All →" style text link. */
export function LinkButton({ label, onPress }: { label: string; onPress?: (() => void) | undefined }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} accessibilityRole="button" style={styles.linkButton}>
      <Text style={styles.linkText}>{label}</Text>
    </TouchableOpacity>
  );
}

/** Empty list message. */
export function EmptyState({ title, subtitle }: { title: string; subtitle?: string | undefined }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

/** Shared card surface for list rows. */
export const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { ...adminType.rowTitle, color: adminColors.ink, flexShrink: 1 },
  code: { ...adminType.sectionHead, color: adminColors.brandDeep },
  meta: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xs },
  body: { ...adminType.body, color: adminColors.ink },
  amount: { ...adminType.sectionHead, color: adminColors.ink },
  divider: { height: 1, backgroundColor: adminColors.border, marginVertical: adminSpacing.sm },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: adminColors.brand },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.lg,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.sm },
  backButton: { paddingVertical: adminSpacing.xs, paddingRight: adminSpacing.xs },
  headerTextGroup: { flex: 1 },
  headerTitle: { ...adminType.title, color: adminColors.onBrand },
  headerSubtitle: { ...adminType.rowMeta, color: adminColors.onBrand, marginTop: 2 },
  headerIconButton: {
    width: 38,
    height: 38,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brandDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconDot: {
    position: 'absolute',
    top: adminSpacing.sm,
    right: adminSpacing.sm,
    width: adminSpacing.sm,
    height: adminSpacing.sm,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.card,
  },
  headerTextButton: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.xs,
    backgroundColor: adminColors.brandDeep,
  },
  headerTextButtonText: { ...adminType.caption, color: adminColors.onBrand },
  body: { flex: 1, backgroundColor: adminColors.canvas },
  bodyContent: { padding: adminSpacing.lg, paddingBottom: adminSpacing.xxl },
  statsRow: { flexDirection: 'row', gap: adminSpacing.sm, marginBottom: adminSpacing.md },
  statsGrid: { flexWrap: 'wrap' },
  statTile: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.sm,
    alignItems: 'center',
  },
  statTileHalf: { flexBasis: '45%' },
  statValue: { ...adminType.kpiValue, color: adminColors.ink },
  statLabel: { ...adminType.caption, color: adminColors.muted, marginTop: 2, textAlign: 'center' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  searchInput: { ...adminType.body, flex: 1, color: adminColors.ink, paddingVertical: 0 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: adminSpacing.sm, marginBottom: adminSpacing.md },
  chipLine: { gap: adminSpacing.sm, paddingBottom: adminSpacing.md },
  chip: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  chipActive: { backgroundColor: adminColors.brandTint, borderColor: adminColors.brand },
  chipText: { ...adminType.body, color: adminColors.muted },
  chipTextActive: { ...adminType.rowTitle, color: adminColors.brandDeep },
  badge: { paddingHorizontal: adminSpacing.sm, paddingVertical: 2, borderRadius: adminRadius.full },
  badgeText: { ...adminType.caption },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: adminSpacing.sm,
    marginBottom: adminSpacing.sm,
  },
  sectionHeading: { ...adminType.sectionHead, color: adminColors.brandDeep },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
  },
  infoRow: { flexDirection: 'row', gap: adminSpacing.md },
  infoRowGap: { marginTop: adminSpacing.md },
  infoCol: { flex: 1 },
  infoLabel: { ...adminType.rowMeta, color: adminColors.muted },
  infoValue: { ...adminType.rowTitle, color: adminColors.ink, marginTop: 2 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: adminSpacing.md },
  timelineNodeCol: { alignItems: 'center', width: 20 },
  timelineRing: {
    width: 20,
    height: 20,
    borderRadius: adminRadius.full,
    borderWidth: 2,
    borderColor: adminColors.success.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineRingPending: { borderColor: adminColors.border },
  timelineDot: { width: adminSpacing.sm, height: adminSpacing.sm, borderRadius: adminRadius.full, backgroundColor: adminColors.success.text },
  timelineLine: { width: 2, height: adminSpacing.xl, backgroundColor: adminColors.border },
  timelineLineDone: { backgroundColor: adminColors.success.text },
  timelineTitle: { ...adminType.rowTitle, color: adminColors.ink, paddingTop: 2 },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  noteText: { ...adminType.rowMeta, color: adminColors.brandDeep, flex: 1 },
  primaryButton: {
    height: ADMIN_BUTTON_HEIGHT,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.sm,
    marginTop: adminSpacing.md,
  },
  primaryButtonText: { ...adminType.rowTitle, color: adminColors.onBrand },
  linkButton: { paddingVertical: adminSpacing.xs },
  linkText: { ...adminType.rowTitle, color: adminColors.brand },
  empty: { alignItems: 'center', padding: adminSpacing.xxl },
  emptyTitle: { ...adminType.rowTitle, color: adminColors.ink },
  emptySubtitle: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xs, textAlign: 'center' },
});
