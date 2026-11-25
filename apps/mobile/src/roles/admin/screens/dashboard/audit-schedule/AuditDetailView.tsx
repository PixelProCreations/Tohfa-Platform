/** "Audit <code>" full detail (design: currentView 'detail'). */
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import { adminColors } from '../../../theme';
import { ADMIN_NO_VALUE } from '../../../utils/noValue';
import { formatAdminDay } from '../../../utils/datetime';
import { AdminErrorState, AdminLoadingState } from '../../warehouse/shared/AsyncStates';
import { ds, type DashScheduleKey } from './i18n';
import { CertCheckIcon } from './icons';
import { MetaGrid, ScreenHeader, parts, type SelectedAudit } from './detailParts';
import { auditCode, auditorOf, badgeKeyOf, orDash, scoreText, typeKeyOf } from './scheduleFormat';
import { detailStyles as styles } from './detailStyles';
import { sharedStyles } from './sharedStyles';
import { usePreviousAudit } from './useScheduleData';

const CERTS: DashScheduleKey[] = ['admin.audits.dashSchedule.cert.pgsOrganic', 'admin.audits.dashSchedule.cert.npop'];

export interface AuditDetailViewProps {
  selected: SelectedAudit;
  onBack: () => void;
  onViewHistory: () => void;
  onOpenInspection?: ((auditId: string) => void) | undefined;
}

export function AuditDetailView({ selected, onBack, onViewHistory, onOpenInspection }: AuditDetailViewProps) {
  const a = selected.audit;
  const previous = usePreviousAudit(a);
  const code = a === undefined ? ADMIN_NO_VALUE : auditCode(a.id);
  const statusLower = a === undefined ? ADMIN_NO_VALUE : ds(`admin.audits.dashSchedule.badge.${badgeKeyOf(a.status)}`).toLowerCase();
  const v = styles.auditSummaryValBold;
  const inspectionEnabled = a !== undefined && onOpenInspection !== undefined;

  return (
    <SafeAreaView style={sharedStyles.rootOrange}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      <ScreenHeader
        title={ds('admin.audits.dashSchedule.header.auditTitle', { code })}
        subtitle={ds('admin.audits.dashSchedule.header.status', { status: statusLower })}
        onBack={onBack}
      />

      <ScrollView
        style={sharedStyles.scroll}
        contentContainerStyle={[styles.detailScrollPad, parts.detailPadExtra]}
        showsVerticalScrollIndicator={false}
      >
        {a === undefined && selected.isLoading ? <AdminLoadingState /> : null}
        {a === undefined && selected.error ? <AdminErrorState error={selected.error} onRetry={selected.refresh} /> : null}

        <Text style={styles.detailSectionTitle}>{ds('admin.audits.dashSchedule.detail.auditInformation')}</Text>
        <View style={styles.detailCard}>
          <MetaGrid
            valueStyle={v}
            rows={[
              [
                { label: ds('admin.audits.dashSchedule.field.auditId'), value: code },
                {
                  label: ds('admin.audits.dashSchedule.field.auditType'),
                  value: a === undefined ? ADMIN_NO_VALUE : ds(`admin.audits.dashSchedule.type.${typeKeyOf(a.auditType)}`),
                },
              ],
              [
                { label: ds('admin.audits.dashSchedule.field.scheduledDate'), value: orDash(a && formatAdminDay(a.scheduledFor)) },
                { label: ds('admin.audits.dashSchedule.field.farmField'), value: orDash(a?.farmName) },
              ],
              [{ label: ds('admin.audits.dashSchedule.field.auditor'), value: a === undefined ? ADMIN_NO_VALUE : auditorOf(a) }],
            ]}
          />
        </View>

        <Text style={styles.detailSectionTitle}>{ds('admin.audits.dashSchedule.detail.farmerInformation')}</Text>
        <View style={styles.detailCard}>
          <MetaGrid
            valueStyle={v}
            rows={[
              [
                { label: ds('admin.audits.dashSchedule.field.farmerName'), value: orDash(a?.farmerName) },
                { label: ds('admin.audits.dashSchedule.field.farmerId'), value: orDash(a?.tohfaFarmerId) },
              ],
              [
                { label: ds('admin.audits.dashSchedule.field.farmingType'), value: ADMIN_NO_VALUE },
                { label: ds('admin.audits.dashSchedule.field.yearsOrganic'), value: ADMIN_NO_VALUE },
              ],
            ]}
          />
        </View>

        <Text style={styles.detailSectionTitle}>{ds('admin.audits.dashSchedule.detail.certification')}</Text>
        <View style={parts.stack}>
          {CERTS.map((key) => (
            <View key={key} style={styles.detailCard}>
              <View style={parts.certHeader}>
                <CertCheckIcon size={20} color={adminColors.success.text} />
                <Text style={parts.certTitle}>{ds(key)}</Text>
              </View>
              <MetaGrid
                valueStyle={v}
                rows={[
                  [
                    { label: ds('admin.audits.dashSchedule.field.status'), value: ADMIN_NO_VALUE, valueStyle: parts.successValue },
                    { label: ds('admin.audits.dashSchedule.field.renewalDate'), value: ADMIN_NO_VALUE },
                  ],
                ]}
              />
            </View>
          ))}
        </View>

        <Text style={styles.detailSectionTitle}>{ds('admin.audits.dashSchedule.detail.previousAuditSummary')}</Text>
        <View style={styles.detailCard}>
          <MetaGrid
            valueStyle={v}
            rows={[
              [
                {
                  label: ds('admin.audits.dashSchedule.field.previousDate'),
                  value: orDash(previous && formatAdminDay(previous.completedAt ?? previous.scheduledFor)),
                },
                {
                  label: ds('admin.audits.dashSchedule.field.previousScore'),
                  value: previous === undefined ? ADMIN_NO_VALUE : scoreText(previous),
                },
              ],
            ]}
          />
        </View>

        <TouchableOpacity style={styles.outlineOrangeBtn} onPress={onViewHistory} activeOpacity={0.8}>
          <Text style={styles.outlineOrangeBtnText}>{ds('admin.audits.dashSchedule.detail.viewAuditHistory')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.outlineOrangeBtn, parts.outlineGap, !inspectionEnabled && parts.disabled]}
          disabled={!inspectionEnabled}
          onPress={() => {
            if (a !== undefined) onOpenInspection?.(a.id);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.outlineOrangeBtnText}>{ds('admin.audits.dashSchedule.detail.inspectionFindings')}</Text>
        </TouchableOpacity>

        <View style={parts.spacerSm} />
      </ScrollView>
    </SafeAreaView>
  );
}
