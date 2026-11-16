/**
 * "Audit Detail" with the audit timeline (design: currentView 'audit_detail').
 * Scheduled = createdAt (detail only), Inspection = startedAt, Completed = completedAt.
 */
import React from 'react';
import { SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { adminColors } from '../../../theme';
import { ADMIN_NO_VALUE } from '../../../utils/noValue';
import { formatAdminDay, formatAdminTime } from '../../../utils/datetime';
import { AdminErrorState, AdminLoadingState } from '../../warehouse/shared/AsyncStates';
import { ds, type DashScheduleKey } from './i18n';
import { TimelineCalendarIcon, TimelineCompletedIcon, TimelineInspectionIcon } from './icons';
import { MetaGrid, ScreenHeader, parts, type SelectedAudit } from './detailParts';
import { auditCode, orDash, scoreText } from './scheduleFormat';
import { detailStyles as styles } from './detailStyles';
import { sharedStyles } from './sharedStyles';

/** "15 Jul 2026, 10:30 AM" in IST, or the dash. */
export function timelineWhen(iso: string | null | undefined): string {
  if (iso === null || iso === undefined) return ADMIN_NO_VALUE;
  const day = formatAdminDay(iso);
  if (day === '') return ADMIN_NO_VALUE;
  return ds('admin.audits.dashSchedule.timeline.when', { day, time: formatAdminTime(iso) });
}

export interface AuditTimelineViewProps {
  selected: SelectedAudit;
  onBack: () => void;
  onOpenHistoryFilter: () => void;
  onViewReport: () => void;
}

export function AuditTimelineView({ selected, onBack, onOpenHistoryFilter, onViewReport }: AuditTimelineViewProps) {
  const a = selected.audit;
  const entries: { key: DashScheduleKey; when: string; icon: React.ReactNode }[] = [
    {
      key: 'admin.audits.dashSchedule.timeline.scheduled',
      when: timelineWhen(selected.detail?.createdAt),
      icon: <TimelineCalendarIcon size={18} color={adminColors.brand} />,
    },
    {
      key: 'admin.audits.dashSchedule.timeline.inspection',
      when: timelineWhen(a?.startedAt),
      icon: <TimelineInspectionIcon size={18} color={adminColors.brand} />,
    },
    {
      key: 'admin.audits.dashSchedule.timeline.completed',
      when: timelineWhen(a?.completedAt),
      icon: <TimelineCompletedIcon size={18} color={adminColors.brand} />,
    },
  ];

  return (
    <SafeAreaView style={sharedStyles.rootOrange}>
      <StatusBar barStyle="light-content" />
      <ScreenHeader title={ds('admin.audits.dashSchedule.header.auditDetail')} onBack={onBack} onFilter={onOpenHistoryFilter} />

      <ScrollView style={sharedStyles.scroll} contentContainerStyle={styles.detailScrollPad} showsVerticalScrollIndicator={false}>
        {a === undefined && selected.isLoading ? <AdminLoadingState /> : null}
        {a === undefined && selected.error ? <AdminErrorState error={selected.error} onRetry={selected.refresh} /> : null}

        <View style={styles.auditSummaryCard}>
          <MetaGrid
            valueStyle={styles.auditSummaryValBold}
            rows={[
              [
                { label: ds('admin.audits.dashSchedule.field.auditId'), value: a === undefined ? ADMIN_NO_VALUE : auditCode(a.id) },
                { label: ds('admin.audits.dashSchedule.field.farmer'), value: orDash(a?.farmerName) },
              ],
              [
                { label: ds('admin.audits.dashSchedule.field.date'), value: orDash(a && formatAdminDay(a.scheduledFor)) },
                { label: ds('admin.audits.dashSchedule.field.score'), value: a === undefined ? ADMIN_NO_VALUE : scoreText(a) },
              ],
            ]}
          />
        </View>

        <Text style={styles.timelineSectionTitle}>{ds('admin.audits.dashSchedule.timeline.title')}</Text>
        <View style={styles.timelineListContainer}>
          {entries.map((e) => (
            <View key={e.key} style={styles.timelineItemRow}>
              <View style={styles.timelineIconTile}>{e.icon}</View>
              <View style={styles.timelineTextWrap}>
                <Text style={styles.timelineTitleText}>{ds(e.key)}</Text>
                <Text style={styles.timelineSubText}>{e.when}</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.viewReportBtn} onPress={onViewReport} activeOpacity={0.85}>
          <Text style={styles.viewReportBtnText}>{ds('admin.audits.dashSchedule.detail.viewReport')}</Text>
        </TouchableOpacity>

        <View style={parts.spacerMd} />
      </ScrollView>
    </SafeAreaView>
  );
}
