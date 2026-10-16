/**
 * Icons and layout pieces for ReportsScreen (design module M12), so the screen
 * holds the views only. Colours, spacing and type come from the admin theme;
 * every string arrives already translated from the caller.
 */
import React from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { t } from '../../../i18n';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';

// ─── Icons ──────────────────────────────────────────────────────────────────

export function ArrowBackIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ReportDocHeaderIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function BellHeaderIcon() {
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

export function LockBadgeIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" stroke={adminColors.onBrand} strokeWidth="2.2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={adminColors.onBrand} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

export function SearchIcon({ size = 16, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth="2" />
      <Path d="M21 21l-4.35-4.35" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function ChevronRightIcon({ size = 16, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Layout ─────────────────────────────────────────────────────────────────

/** One option of a chip row. */
export interface ChipOption<V extends string> {
  value: V;
  label: string;
}

export function ChipRow<V extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly ChipOption<V>[];
  value: V;
  onChange: (value: V) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow} style={styles.chipBar}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onChange(opt.value)}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

export function KpiGrid({ children }: { children: React.ReactNode }) {
  return <View style={styles.kpiGrid}>{children}</View>;
}

export function KpiTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
    </View>
  );
}

export function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionHeaderTitle}>{children}</Text>;
}

/** A row of a breakdown list: title, right-hand value, optional meta line. */
export function DataRow({ title, value, meta }: { title: string; value: string; meta?: string | undefined }) {
  return (
    <View style={styles.dataRowCard}>
      <View style={styles.rowBetween}>
        <Text style={styles.rowTitleText}>{title}</Text>
        <Text style={styles.rowAmountText}>{value}</Text>
      </View>
      {meta !== undefined ? <Text style={styles.rowMetaText}>{meta}</Text> : null}
    </View>
  );
}

export function RowStack({ children }: { children: React.ReactNode }) {
  return <View style={styles.cardStack}>{children}</View>;
}

/**
 * The frame of one report view: brand header with back, then the shared
 * loading / error / empty state, or the report body when it has data.
 */
export function ReportView({
  title,
  subtitle,
  onBack,
  toolbar,
  isLoading,
  error,
  onRetry,
  hasData,
  emptyTitle,
  emptySubtitle,
  children,
}: {
  title: string;
  subtitle: string;
  onBack: () => void;
  toolbar?: React.ReactNode;
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  hasData: boolean;
  emptyTitle: string;
  emptySubtitle: string;
  children: React.ReactNode;
}) {
  const state = queryViewState({ isLoading, error, itemCount: hasData ? 1 : 0 });
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={t('reports.a11y.back')}
          >
            <ArrowBackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitleText}>{title}</Text>
        </View>
        <Text style={styles.headerSubtitleText}>{subtitle}</Text>
      </View>
      {toolbar}
      {state === 'loading' ? (
        <AdminLoadingState />
      ) : state === 'error' ? (
        <AdminErrorState error={error} onRetry={onRetry} />
      ) : state === 'empty' ? (
        <AdminEmptyState title={emptyTitle} subtitle={emptySubtitle} />
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {children}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

export const reportStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminColors.canvas },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.lg,
  },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeftGroup: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.sm },
  backButton: { padding: adminSpacing.xs, marginRight: adminSpacing.xs },
  headerTitleText: { ...adminType.title, color: adminColors.onBrand },
  headerSubtitleText: { ...adminType.caption, color: adminColors.brandTint, marginTop: adminSpacing.xs },
  headerBellBtn: { padding: adminSpacing.sm },
  scroll: { flex: 1 },
  scrollContent: { padding: adminSpacing.lg, paddingBottom: adminSpacing.xxl },
});

const styles = StyleSheet.create({
  ...reportStyles,
  chipBar: {
    flexGrow: 0,
    backgroundColor: adminColors.card,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  chipRow: {
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.sm,
    gap: adminSpacing.sm,
  },
  chip: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.canvas,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  chipActive: { backgroundColor: adminColors.brandTint, borderColor: adminColors.brand },
  chipText: { ...adminType.caption, color: adminColors.muted },
  chipTextActive: { color: adminColors.brandDeep },
  sectionHeaderTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginTop: adminSpacing.lg,
    marginBottom: adminSpacing.sm,
  },
  cardStack: { gap: adminSpacing.sm },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: adminSpacing.sm, marginBottom: adminSpacing.md },
  kpiCard: {
    flexGrow: 1,
    flexBasis: '45%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  kpiLabel: { ...adminType.caption, color: adminColors.muted, marginBottom: adminSpacing.xs },
  kpiValue: { ...adminType.kpiValue, color: adminColors.ink },
  dataRowCard: {
    backgroundColor: adminColors.card,
    padding: adminSpacing.md,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: adminSpacing.sm },
  rowTitleText: { ...adminType.rowTitle, color: adminColors.ink, flexShrink: 1 },
  rowAmountText: { ...adminType.rowTitle, color: adminColors.brandDeep },
  rowMetaText: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xs },
});
