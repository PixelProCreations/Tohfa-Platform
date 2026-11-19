/**
 * Audit Inspection (12-section overview), ported from the Super Admin design
 * (origin/Superadmin-main screens/dashboard/AuditInspectionOverviewScreen.tsx).
 *
 * `record.id` is the API audit id. The header, info card and progress read
 * GET /admin/audits/{id} (audit.view). Per-section completion is the host's
 * (the section forms own it); a COMPLETED audit reads as all sections done.
 *
 * Review & Submit is POST /complete (IN_PROGRESS -> COMPLETED) and Save Draft
 * on a SCHEDULED audit is POST /start (SCHEDULED -> IN_PROGRESS); both need
 * audit.conduct. The server enforces every transition again; a refusal (e.g.
 * 422 AUDIT_INCOMPLETE before all 10 categories are scored) is shown, and the
 * host callback runs only after the write succeeded.
 */
import React from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScreenStatusBar } from '@tohfa/mobile-ui';

import type { AuditDetailDto } from '../../api/audits';
import { adminErrorKey } from '../../api/errors';
import { BackArrowIcon, CheckmarkIcon } from '../../components/AdminIcons';
import { t } from '../../i18n';
import type { Can } from '../../permissions/can';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';
import { useAuditDetail, useCompleteAudit, useStartAudit } from '../audits/useAuditsData';
import { AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';
import {
  AUDIT_12_SECTIONS,
  OVERVIEW_CODES,
  completedSectionIds,
  overviewActions,
  overviewInfo,
  overviewProgress,
  sectionSubtitle,
  tr,
} from './auditInspectionOverviewFormat';

export { AUDIT_12_SECTIONS, type AuditInspectionSectionItem } from './auditInspectionOverviewFormat';

/** The design passed its fixture record; only the id is read, and it must be the API audit id. */
export interface AuditInspectionOverviewRecord {
  id: string;
}

export interface AuditInspectionOverviewScreenProps {
  record: AuditInspectionOverviewRecord;
  completedSections: Record<number, boolean>;
  onSelectSection: (sectionId: number) => void;
  onBack: () => void;
  /** Runs after POST /complete succeeded, with the completed audit. */
  onReviewSubmit: (audit?: AuditDetailDto) => void;
  /** Runs after Save Draft (and after POST /start succeeded when the audit was SCHEDULED). */
  onSaveDraft: () => void;
  can?: Can | undefined;
}

const BACK_ICON_SIZE = adminSpacing.xl;
const CHECK_ICON_SIZE = adminSpacing.md;
const NUM_BADGE_SIZE = adminSpacing.xxl - adminSpacing.xs;
const BAR_HEIGHT = adminSpacing.xsSm;
const HAIRLINE_GAP = adminSpacing.xs / 2;
const BOTTOM_SPACER = adminSpacing.largeSection * 3;

export function AuditInspectionOverviewScreen({
  record,
  completedSections,
  onSelectSection,
  onBack,
  onReviewSubmit,
  onSaveDraft,
  can,
}: AuditInspectionOverviewScreenProps) {
  const has = (code: string): boolean => typeof can === 'function' && can(code);
  const canView = has(OVERVIEW_CODES.view);
  const canConduct = has(OVERVIEW_CODES.conduct);

  const detail = useAuditDetail(canView ? record.id : undefined);
  const startAudit = useStartAudit();
  const completeAudit = useCompleteAudit();

  const audit = detail.data;
  const info = overviewInfo(audit);
  const done = completedSectionIds(audit?.status, completedSections);
  const progress = overviewProgress(done);
  const actions = overviewActions({
    status: audit?.status,
    canConduct,
    busy: startAudit.isPending || completeAudit.isPending,
  });

  const showError = (error: unknown) => {
    Alert.alert(tr('admin.audits.inspectionOverview.error.title'), t(adminErrorKey(error)));
  };

  const handleReviewSubmit = () => {
    if (!actions.canSubmit) return;
    completeAudit.mutate(
      { auditId: record.id },
      { onSuccess: (completed) => onReviewSubmit(completed), onError: showError },
    );
  };

  const handleSaveDraft = () => {
    if (!actions.canSaveDraft) return;
    if (!actions.draftStartsAudit) {
      onSaveDraft();
      return;
    }
    startAudit.mutate({ auditId: record.id }, { onSuccess: () => onSaveDraft(), onError: showError });
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Orange Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            testID="auditOverview.back"
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={tr('admin.audits.inspectionOverview.back')}
          >
            <BackArrowIcon size={BACK_ICON_SIZE} color={adminColors.onBrand} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>{tr('admin.audits.inspectionOverview.title')}</Text>
            <Text style={styles.headerSubtitleText} testID="auditOverview.subtitle">
              {tr('admin.audits.inspectionOverview.subtitle', { code: info.auditCode, farmer: info.farmer })}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
        {canView && detail.isLoading ? <AdminLoadingState /> : null}
        {canView && detail.error !== null && audit === undefined ? (
          <AdminErrorState error={detail.error} onRetry={() => void detail.refetch()} />
        ) : null}

        {/* ─── Top Card: Audit Information ─── */}
        <View style={styles.card} testID="auditOverview.info">
          <View style={styles.gridRow}>
            <MetaCell id="auditId" label={tr('admin.audits.inspectionOverview.label.auditId')} value={info.auditCode} />
            <MetaCell id="type" label={tr('admin.audits.inspectionOverview.label.type')} value={info.type} />
          </View>
          <View style={[styles.gridRow, styles.gridRowGap]}>
            <MetaCell id="farmer" label={tr('admin.audits.inspectionOverview.label.farmer')} value={info.farmer} />
            <MetaCell id="farm" label={tr('admin.audits.inspectionOverview.label.farm')} value={info.farm} />
          </View>
          <View style={[styles.gridRow, styles.gridRowGap]}>
            <MetaCell id="date" label={tr('admin.audits.inspectionOverview.label.date')} value={info.date} />
            <MetaCell id="auditor" label={tr('admin.audits.inspectionOverview.label.auditor')} value={info.auditor} />
          </View>
        </View>

        {/* ─── Progress Card ─── */}
        <View style={[styles.card, styles.cardGap]} testID="auditOverview.progress">
          <Text style={styles.progressHeading}>{progress.heading}</Text>
          <Text style={styles.progressSubtext}>{progress.subtext}</Text>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: progress.fillWidth }]} />
          </View>
        </View>

        {/* ─── Section Header ─── */}
        <Text style={styles.sectionHeader}>{tr('admin.audits.inspectionOverview.sectionsHeading')}</Text>

        {/* ─── 12 Inspection Section Cards ─── */}
        <View style={styles.sectionList}>
          {AUDIT_12_SECTIONS.map((sec) => {
            const isDone = done.has(sec.id);
            const title = tr(sec.title);
            return (
              <TouchableOpacity
                key={sec.id}
                testID={`auditOverview.section.${sec.id}`}
                style={styles.sectionRowCard}
                onPress={() => onSelectSection(sec.id)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={tr('admin.audits.inspectionOverview.section.a11y', { id: sec.id, title })}
              >
                <View style={styles.sectionNumBadge}>
                  <Text style={styles.sectionNumText}>{sec.id}</Text>
                </View>

                <View style={styles.sectionTextWrap}>
                  <Text style={styles.sectionTitleText} numberOfLines={1}>
                    {title}
                  </Text>
                  <Text style={styles.sectionSubText} numberOfLines={1}>
                    {sectionSubtitle(sec, isDone)}
                  </Text>
                </View>

                <View style={[styles.statusBadge, isDone ? styles.statusBadgeCompleted : styles.statusBadgeNotStarted]}>
                  {isDone && <CheckmarkIcon size={CHECK_ICON_SIZE} color={adminColors.success.text} />}
                  <Text style={[styles.statusBadgeText, isDone ? styles.statusTextCompleted : styles.statusTextNotStarted]}>
                    {isDone
                      ? tr('admin.audits.inspectionOverview.badge.done')
                      : tr('admin.audits.inspectionOverview.badge.notStarted')}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* ─── Pinned Bottom Action Buttons ─── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          testID="auditOverview.submit"
          style={[styles.submitBtn, !actions.canSubmit && styles.btnDisabled]}
          onPress={handleReviewSubmit}
          disabled={!actions.canSubmit}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityState={{ disabled: !actions.canSubmit }}
        >
          <Text style={styles.submitBtnText}>{tr('admin.audits.inspectionOverview.submit')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="auditOverview.saveDraft"
          style={[styles.draftBtn, !actions.canSaveDraft && styles.btnDisabled]}
          onPress={handleSaveDraft}
          disabled={!actions.canSaveDraft}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityState={{ disabled: !actions.canSaveDraft }}
        >
          <Text style={styles.draftBtnText}>{tr('admin.audits.inspectionOverview.saveDraft')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function MetaCell({ id, label, value }: { id: string; label: string; value: string }) {
  return (
    <View style={styles.col} testID={`auditOverview.meta.${id}`}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValueBold}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingTop: adminSpacing.smMd,
    paddingBottom: adminSpacing.lg,
    paddingHorizontal: adminSpacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    padding: adminSpacing.xsSm,
    marginRight: adminSpacing.smMd,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  headerSubtitleText: {
    ...adminType.body,
    color: adminColors.onBrand,
    opacity: 0.9,
    marginTop: HAIRLINE_GAP,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    ...adminShadow.sm,
  },
  cardGap: {
    marginTop: adminSpacing.mdLg,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridRowGap: {
    marginTop: adminSpacing.mdLg,
  },
  col: {
    flex: 1,
  },
  metaLabel: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: HAIRLINE_GAP,
  },
  metaValueBold: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },
  progressHeading: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  progressSubtext: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: HAIRLINE_GAP,
    marginBottom: adminSpacing.smMd,
  },
  progressBarTrack: {
    height: BAR_HEIGHT,
    backgroundColor: adminColors.border,
    borderRadius: BAR_HEIGHT / 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: adminColors.brand,
    borderRadius: BAR_HEIGHT / 2,
  },
  sectionHeader: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginTop: adminSpacing.lg + HAIRLINE_GAP,
    marginBottom: adminSpacing.smMd,
  },
  sectionList: {
    gap: adminSpacing.smMd,
  },
  sectionRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.md,
    ...adminShadow.sm,
  },
  sectionNumBadge: {
    width: NUM_BADGE_SIZE,
    height: NUM_BADGE_SIZE,
    borderRadius: NUM_BADGE_SIZE / 2,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: adminSpacing.md,
  },
  sectionNumText: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  sectionTextWrap: {
    flex: 1,
    paddingRight: adminSpacing.sm,
  },
  sectionTitleText: {
    ...adminType.rowTitle,
    fontWeight: '700',
    color: adminColors.ink,
  },
  sectionSubText: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: HAIRLINE_GAP,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.full,
  },
  statusBadgeNotStarted: {
    backgroundColor: adminColors.canvas,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  statusBadgeCompleted: {
    backgroundColor: adminColors.success.bg,
    borderWidth: 1,
    borderColor: adminColors.success.border,
  },
  statusBadgeText: {
    ...adminType.caption,
    fontWeight: '700',
  },
  statusTextNotStarted: {
    color: adminColors.ink,
  },
  statusTextCompleted: {
    color: adminColors.success.text,
  },
  bottomSpacer: {
    height: BOTTOM_SPACER,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.smMd,
    paddingBottom: adminSpacing.lg,
    gap: adminSpacing.smMd,
    ...adminShadow.md,
  },
  submitBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.md + 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  draftBtn: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.ink,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftBtnText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
