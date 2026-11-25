/**
 * Pieces the four detail-side views share: the orange title header, the
 * two-column label/value grid, and the selected-audit loader.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, type TextStyle } from 'react-native';
import type { AuditDetailDto, AuditSummaryDto } from '../../../api/audits';
import { adminColors, adminSpacing, adminType } from '../../../theme';
import { useAuditDetail } from '../../audits/useAuditsData';
import { ds } from './i18n';
import { BackArrowIcon, FilterSlidersIcon } from './icons';
import { detailStyles as styles } from './detailStyles';
import { sharedStyles } from './sharedStyles';

export interface SelectedAudit {
  /** The detail once loaded, else the list row the user tapped; undefined while neither exists. */
  audit: AuditSummaryDto | AuditDetailDto | undefined;
  detail: AuditDetailDto | undefined;
  isLoading: boolean;
  error: unknown;
  refresh: () => void;
}

export function useSelectedAudit(auditId: string | undefined, summary: AuditSummaryDto | undefined): SelectedAudit {
  const query = useAuditDetail(auditId);
  return {
    audit: query.data ?? summary,
    detail: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refresh: () => {
      void query.refetch();
    },
  };
}

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  onFilter,
}: {
  title: string;
  subtitle?: string | undefined;
  onBack: () => void;
  onFilter?: (() => void) | undefined;
}) {
  return (
    <View style={styles.screenHeader}>
      <TouchableOpacity
        style={sharedStyles.headerBackBtn}
        onPress={onBack}
        activeOpacity={0.7}
        accessibilityLabel={ds('admin.audits.dashSchedule.a11y.back')}
      >
        <BackArrowIcon size={22} color={adminColors.onBrand} />
      </TouchableOpacity>
      <View style={parts.flex}>
        <Text style={styles.screenHeaderTitle}>{title}</Text>
        {subtitle !== undefined ? <Text style={styles.screenHeaderSub}>{subtitle}</Text> : null}
      </View>
      {onFilter !== undefined ? (
        <TouchableOpacity
          style={sharedStyles.headerFilterCircleBtn}
          onPress={onFilter}
          activeOpacity={0.8}
          accessibilityLabel={ds('admin.audits.dashSchedule.a11y.filters')}
        >
          <FilterSlidersIcon size={19} color={adminColors.onBrand} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export interface MetaCell {
  label: string;
  value: string;
  valueStyle?: TextStyle | undefined;
}

/** Rows of two label/value columns; a row with one cell keeps the design's half width. */
export function MetaGrid({ rows, valueStyle, gap = 'mdLg' }: { rows: MetaCell[][]; valueStyle: TextStyle; gap?: 'mdLg' | 'md' }) {
  return (
    <>
      {rows.map((row, i) => (
        <View key={i} style={[styles.detailGridRow, i > 0 && (gap === 'md' ? parts.rowGapMd : parts.rowGap)]}>
          {row.map((cell) => (
            <View key={cell.label} style={styles.detailGridCol}>
              <Text style={styles.detailMetaLabel}>{cell.label}</Text>
              <Text style={[valueStyle, cell.valueStyle]}>{cell.value}</Text>
            </View>
          ))}
        </View>
      ))}
    </>
  );
}

export const parts = StyleSheet.create({
  flex: { flex: 1 },
  rowGap: { marginTop: adminSpacing.mdLg },
  rowGapMd: { marginTop: adminSpacing.md },
  stack: { gap: adminSpacing.md },
  certHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: adminSpacing.md },
  certTitle: { ...adminType.rowTitle, color: adminColors.ink, marginLeft: adminSpacing.sm, fontWeight: '700' },
  successValue: { color: adminColors.success.text },
  outlineGap: { marginTop: adminSpacing.md },
  actionsRow: { flexDirection: 'row', gap: adminSpacing.md, marginTop: adminSpacing.mdLg },
  spacerSm: { height: adminSpacing.xl },
  spacerMd: { height: 28 },
  spacerLg: { height: adminSpacing.largeSection },
  spacerXl: { height: 90 },
  detailPadExtra: { paddingBottom: 120 },
  previewHead: { alignItems: 'center', marginVertical: adminSpacing.mdLg, opacity: 0.4 },
  previewLines: { gap: adminSpacing.sm, opacity: 0.15 },
  previewLine: { height: 8, backgroundColor: adminColors.ink, borderRadius: 4 },
  disabled: { opacity: 0.5 },
});
