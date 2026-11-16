/**
 * "Farmer Audit Report" (design: currentView 'audit_report'). Download PDF
 * asks GET /admin/audits/{id}/report for a signed URL (audit.report.generate);
 * the server only renders it once the audit is COMPLETED.
 */
import React from 'react';
import { Alert, Linking, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { adminErrorKey } from '../../../api/errors';
import { t } from '../../../i18n';
import type { Can } from '../../../permissions/can';
import { adminColors } from '../../../theme';
import { ADMIN_NO_VALUE } from '../../../utils/noValue';
import { formatAdminDay } from '../../../utils/datetime';
import { AdminErrorState, AdminLoadingState } from '../../warehouse/shared/AsyncStates';
import { useAuditReport } from '../../audits/useAuditsData';
import { ds } from './i18n';
import { DownloadIcon } from './icons';
import { MetaGrid, ScreenHeader, parts, type SelectedAudit } from './detailParts';
import { auditCode, auditorOf, badgeKeyOf, orDash, scoreParts, typeKeyOf } from './scheduleFormat';
import { detailStyles as styles } from './detailStyles';
import { sharedStyles } from './sharedStyles';

export interface AuditReportViewProps {
  selected: SelectedAudit;
  can: Can;
  /** Inference and the View Farmer / View Audit History pair are not part of the support-only (field visit) layout. */
  fieldVisitMode: boolean;
  onBack: () => void;
  onViewHistory: () => void;
  onNavigateFarmerProfile?: ((farmerId: string) => void) | undefined;
}

/** Whether Download PDF is live: the permission, a COMPLETED audit, and no request in flight. */
export function canDownloadReport(can: Can, status: string | undefined, pending: boolean): boolean {
  return can('audit.report.generate') && status === 'COMPLETED' && !pending;
}

export function AuditReportView(props: AuditReportViewProps) {
  const { selected, can } = props;
  const a = selected.audit;
  const report = useAuditReport(a?.id);
  const score = a === undefined ? { value: ADMIN_NO_VALUE, total: '100' } : scoreParts(a);
  const downloadEnabled = canDownloadReport(can, a?.status, report.isPending);
  const farmerEnabled = a !== undefined && props.onNavigateFarmerProfile !== undefined;
  const v = styles.reportMetaValBold;

  const download = () => {
    report
      .mutateAsync('generated')
      .then((url) => Linking.openURL(url))
      .catch((err: unknown) => Alert.alert(ds('admin.audits.dashSchedule.report.downloadFailed'), t(adminErrorKey(err))));
  };

  return (
    <SafeAreaView style={sharedStyles.rootOrange}>
      <StatusBar barStyle="light-content" />
      <ScreenHeader
        title={ds('admin.audits.dashSchedule.header.farmerAuditReport')}
        subtitle={a === undefined ? ADMIN_NO_VALUE : auditCode(a.id)}
        onBack={props.onBack}
      />

      <ScrollView style={sharedStyles.scroll} contentContainerStyle={styles.reportScrollPad} showsVerticalScrollIndicator={false}>
        {a === undefined && selected.isLoading ? <AdminLoadingState /> : null}
        {a === undefined && selected.error ? <AdminErrorState error={selected.error} onRetry={selected.refresh} /> : null}

        <Text style={styles.reportSectionTitle}>{ds('admin.audits.dashSchedule.report.farmerDetails')}</Text>
        <View style={styles.reportCard}>
          <MetaGrid
            gap="md"
            valueStyle={v}
            rows={[
              [
                { label: ds('admin.audits.dashSchedule.field.farmer'), value: orDash(a?.farmerName) },
                { label: ds('admin.audits.dashSchedule.field.farmField'), value: orDash(a?.farmName) },
              ],
              [{ label: ds('admin.audits.dashSchedule.field.farmingType'), value: ADMIN_NO_VALUE }],
            ]}
          />
        </View>

        <Text style={styles.reportSectionTitle}>{ds('admin.audits.dashSchedule.report.auditDetails')}</Text>
        <View style={styles.reportCard}>
          <MetaGrid
            gap="md"
            valueStyle={v}
            rows={[
              [
                {
                  label: ds('admin.audits.dashSchedule.field.auditType'),
                  value: a === undefined ? ADMIN_NO_VALUE : ds(`admin.audits.dashSchedule.type.${typeKeyOf(a.auditType)}`),
                },
                {
                  label: ds('admin.audits.dashSchedule.field.auditDate'),
                  value: orDash(a && formatAdminDay(a.completedAt ?? a.scheduledFor)),
                },
              ],
              [
                { label: ds('admin.audits.dashSchedule.field.auditor'), value: a === undefined ? ADMIN_NO_VALUE : auditorOf(a) },
                {
                  label: ds('admin.audits.dashSchedule.field.status'),
                  value: a === undefined ? ADMIN_NO_VALUE : ds(`admin.audits.dashSchedule.badge.${badgeKeyOf(a.status)}`),
                },
              ],
            ]}
          />
        </View>

        <Text style={styles.reportSectionTitle}>{ds('admin.audits.dashSchedule.report.findingsSummary')}</Text>
        <View style={styles.findingsSummaryRow}>
          <View style={styles.findingsSummaryCard}>
            <Text style={styles.findingsSummaryLabel}>{ds('admin.audits.dashSchedule.report.major')}</Text>
            <Text style={styles.findingsSummaryValDark}>{a === undefined ? ADMIN_NO_VALUE : String(a.findingCounts.major)}</Text>
          </View>
          <View style={styles.findingsSummaryCard}>
            <Text style={styles.findingsSummaryLabel}>{ds('admin.audits.dashSchedule.report.minor')}</Text>
            <Text style={styles.findingsSummaryValAmber}>{a === undefined ? ADMIN_NO_VALUE : String(a.findingCounts.minor)}</Text>
          </View>
          <View style={styles.findingsSummaryCard}>
            <Text style={styles.findingsSummaryLabel}>{ds('admin.audits.dashSchedule.report.redFlags')}</Text>
            <Text style={styles.findingsSummaryValDark}>{a === undefined ? ADMIN_NO_VALUE : a.redFlagged ? '1' : '0'}</Text>
          </View>
        </View>

        <Text style={styles.reportSectionTitle}>{ds('admin.audits.dashSchedule.report.auditScore')}</Text>
        <View style={styles.auditScoreCard}>
          <View style={styles.auditScoreNumberRow}>
            <Text style={styles.auditScoreBigNum}>{score.value}</Text>
            <Text style={styles.auditScoreTotalText}>{ds('admin.audits.dashSchedule.report.scoreTotal', { total: score.total })}</Text>
          </View>
          <Text style={styles.auditScoreCaption}>{ds('admin.audits.dashSchedule.report.scoreCaption')}</Text>
        </View>

        <Text style={styles.reportSectionTitle}>{ds('admin.audits.dashSchedule.report.remarks')}</Text>
        <View style={styles.reportCard}>
          <Text style={styles.reportTextContent}>{orDash(selected.detail?.summary)}</Text>
        </View>

        {!props.fieldVisitMode ? (
          <>
            <Text style={styles.reportSectionTitle}>{ds('admin.audits.dashSchedule.report.inference')}</Text>
            <View style={styles.reportCard}>
              <Text style={styles.reportTextContent}>{ADMIN_NO_VALUE}</Text>
            </View>

            <View style={parts.actionsRow}>
              <TouchableOpacity
                style={[styles.viewAuditHistoryOutlineBtn, parts.flex, !farmerEnabled && parts.disabled]}
                disabled={!farmerEnabled}
                onPress={() => {
                  if (a !== undefined) props.onNavigateFarmerProfile?.(a.farmerId);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.viewAuditHistoryOutlineBtnText}>{ds('admin.audits.dashSchedule.report.viewFarmer')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.viewAuditHistoryOutlineBtn, parts.flex]} onPress={props.onViewHistory} activeOpacity={0.85}>
                <Text style={styles.viewAuditHistoryOutlineBtnText}>{ds('admin.audits.dashSchedule.detail.viewAuditHistory')}</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}

        <View style={parts.spacerXl} />
      </ScrollView>

      <View style={styles.reportBottomStickyBar}>
        <TouchableOpacity
          style={[styles.downloadPdfBtn, !downloadEnabled && parts.disabled]}
          disabled={!downloadEnabled}
          onPress={download}
          activeOpacity={0.85}
        >
          <DownloadIcon size={18} color={adminColors.onBrand} />
          <Text style={styles.downloadPdfBtnText}>{ds('admin.audits.dashSchedule.report.downloadPdf')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
