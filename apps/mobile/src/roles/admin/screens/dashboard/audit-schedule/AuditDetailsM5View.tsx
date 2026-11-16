/**
 * "Audit <code>" quick detail of a SCHEDULED / IN_PROGRESS audit (design:
 * currentView 'audit_details_m5'), with the Checklist.pdf document popup.
 */
import React, { useState } from 'react';
import { Modal, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import type { Can } from '../../../permissions/can';
import { adminColors, adminSpacing } from '../../../theme';
import { ADMIN_NO_VALUE } from '../../../utils/noValue';
import { formatAdminDay } from '../../../utils/datetime';
import { AdminErrorState, AdminLoadingState } from '../../warehouse/shared/AsyncStates';
import { ds, type DashScheduleKey } from './i18n';
import { ChevronRightIcon, CloseIcon, PdfDocIcon } from './icons';
import { MetaGrid, ScreenHeader, parts, type SelectedAudit } from './detailParts';
import { auditCode, auditorOf, badgeKeyOf, orDash, typeKeyOf } from './scheduleFormat';
import { detailStyles as styles } from './detailStyles';
import { sharedStyles } from './sharedStyles';

const CHECKLIST: DashScheduleKey[] = [
  'admin.audits.dashSchedule.checklist.farmDocumentation',
  'admin.audits.dashSchedule.checklist.organicPractices',
  'admin.audits.dashSchedule.checklist.cropManagement',
  'admin.audits.dashSchedule.checklist.inputUsage',
];
const PREVIEW_LINE_WIDTHS = ['90%', '100%', '75%', '85%', '60%'] as const;
const HIT_SLOP = { top: adminSpacing.smMd, bottom: adminSpacing.smMd, left: adminSpacing.smMd, right: adminSpacing.smMd };

export interface AuditDetailsM5ViewProps {
  selected: SelectedAudit;
  can: Can;
  onBack: () => void;
  onNavigateFarmerProfile?: ((farmerId: string) => void) | undefined;
}

export function AuditDetailsM5View({ selected, can, onBack, onNavigateFarmerProfile }: AuditDetailsM5ViewProps) {
  const [showDoc, setShowDoc] = useState(false);
  const a = selected.audit;
  const code = a === undefined ? ADMIN_NO_VALUE : auditCode(a.id);
  const status = a === undefined ? ADMIN_NO_VALUE : ds(`admin.audits.dashSchedule.badge.${badgeKeyOf(a.status)}`);
  const v = styles.detailMetaValue;

  return (
    <SafeAreaView style={sharedStyles.rootOrange}>
      <StatusBar barStyle="light-content" />
      <ScreenHeader
        title={ds('admin.audits.dashSchedule.header.auditTitle', { code })}
        subtitle={ds('admin.audits.dashSchedule.header.status', { status })}
        onBack={onBack}
      />

      <ScrollView style={sharedStyles.scroll} contentContainerStyle={styles.detailScrollPad} showsVerticalScrollIndicator={false}>
        {a === undefined && selected.isLoading ? <AdminLoadingState /> : null}
        {a === undefined && selected.error ? <AdminErrorState error={selected.error} onRetry={selected.refresh} /> : null}

        <Text style={styles.detailSectionTitle}>{ds('admin.audits.dashSchedule.detail.farmerInformation')}</Text>
        <View style={styles.detailCard}>
          <MetaGrid
            valueStyle={v}
            rows={[
              [
                { label: ds('admin.audits.dashSchedule.field.farmer'), value: orDash(a?.farmerName) },
                { label: ds('admin.audits.dashSchedule.field.farmerId'), value: orDash(a?.tohfaFarmerId) },
              ],
              [{ label: ds('admin.audits.dashSchedule.field.zone'), value: orDash(a?.zoneName) }],
            ]}
          />
          <TouchableOpacity
            style={[styles.outlineOrangeBtn, (a === undefined || onNavigateFarmerProfile === undefined) && parts.disabled]}
            disabled={a === undefined || onNavigateFarmerProfile === undefined}
            onPress={() => {
              if (a !== undefined) onNavigateFarmerProfile?.(a.farmerId);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.outlineOrangeBtnText}>{ds('admin.audits.dashSchedule.detail.viewFarmerProfile')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.detailSectionTitle}>{ds('admin.audits.dashSchedule.detail.auditInformation')}</Text>
        <View style={styles.detailCard}>
          <MetaGrid
            valueStyle={v}
            rows={[
              [
                { label: ds('admin.audits.dashSchedule.field.auditId'), value: code },
                {
                  label: ds('admin.audits.dashSchedule.field.type'),
                  value: a === undefined ? ADMIN_NO_VALUE : ds(`admin.audits.dashSchedule.type.${typeKeyOf(a.auditType)}`),
                },
              ],
              [
                { label: ds('admin.audits.dashSchedule.field.scheduledDate'), value: orDash(a && formatAdminDay(a.scheduledFor)) },
                { label: ds('admin.audits.dashSchedule.field.status'), value: status },
              ],
              [{ label: ds('admin.audits.dashSchedule.field.auditor'), value: a === undefined ? ADMIN_NO_VALUE : auditorOf(a) }],
            ]}
          />
        </View>

        <Text style={styles.detailSectionTitle}>{ds('admin.audits.dashSchedule.detail.farm')}</Text>
        <View style={styles.detailCard}>
          <MetaGrid
            valueStyle={v}
            rows={[
              [
                { label: ds('admin.audits.dashSchedule.field.farmName'), value: orDash(a?.farmName) },
                { label: ds('admin.audits.dashSchedule.field.farmingMethod'), value: ADMIN_NO_VALUE },
              ],
            ]}
          />
        </View>

        <Text style={styles.detailSectionTitle}>{ds('admin.audits.dashSchedule.detail.documents')}</Text>
        <TouchableOpacity style={styles.documentRowCard} onPress={() => setShowDoc(true)} activeOpacity={0.8}>
          <PdfDocIcon size={20} color={adminColors.brand} />
          <Text style={styles.documentRowTitle}>{ds('admin.audits.dashSchedule.detail.checklistFile')}</Text>
          <ChevronRightIcon size={18} color={adminColors.muted} />
        </TouchableOpacity>

        <Text style={styles.detailSectionTitle}>{ds('admin.audits.dashSchedule.detail.auditChecklist')}</Text>
        <View style={styles.checklistCard}>
          {CHECKLIST.map((key, i) => (
            <React.Fragment key={key}>
              {i > 0 ? <View style={styles.checklistDivider} /> : null}
              <View style={styles.checklistRow}>
                <Text style={styles.checklistLabel}>{ds(key)}</Text>
                <View style={styles.checklistPendingRow}>
                  <View style={styles.pendingCircleOutline} />
                  <Text style={styles.checklistPendingText}>{ADMIN_NO_VALUE}</Text>
                </View>
              </View>
            </React.Fragment>
          ))}
        </View>

        {!can('audit.schedule') ? (
          <View style={styles.permissionNoticeCard}>
            <Text style={styles.permissionNoticeText}>{ds('admin.audits.dashSchedule.detail.permissionNotice')}</Text>
          </View>
        ) : null}

        <View style={parts.spacerLg} />
      </ScrollView>

      <Modal visible={showDoc} transparent animationType="fade" onRequestClose={() => setShowDoc(false)}>
        <View style={styles.docModalOverlay}>
          <View style={styles.docModalCard}>
            <View style={styles.docModalHeader}>
              <View style={styles.docModalHeaderLeft}>
                <PdfDocIcon size={22} color={adminColors.brand} />
                <Text style={styles.docModalHeaderTitle}>{ds('admin.audits.dashSchedule.detail.checklistFile')}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowDoc(false)}
                hitSlop={HIT_SLOP}
                activeOpacity={0.7}
                accessibilityLabel={ds('admin.audits.dashSchedule.a11y.close')}
              >
                <CloseIcon size={20} color={adminColors.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.docModalMetaRow}>
              <View style={styles.detCol}>
                <Text style={styles.detLabel}>{ds('admin.audits.dashSchedule.doc.type')}</Text>
                <Text style={styles.detValue}>{ds('admin.audits.dashSchedule.doc.pdf')}</Text>
              </View>
              <View style={styles.detCol}>
                <Text style={styles.detLabel}>{ds('admin.audits.dashSchedule.doc.audit')}</Text>
                <Text style={styles.detValue}>{code}</Text>
              </View>
            </View>

            <View style={styles.docModalPreviewBox}>
              <View style={parts.previewHead}>
                <PdfDocIcon size={48} color={adminColors.muted} />
                <Text style={styles.docModalPreviewTitle}>{ds('admin.audits.dashSchedule.doc.previewTitle')}</Text>
                <Text style={styles.docModalPreviewSubtitle}>{ds('admin.audits.dashSchedule.doc.previewSubtitle', { code })}</Text>
              </View>
              <View style={parts.previewLines}>
                {PREVIEW_LINE_WIDTHS.map((width, i) => (
                  <View key={i} style={[parts.previewLine, { width }]} />
                ))}
              </View>
            </View>

            <View style={styles.docModalBtnRow}>
              <TouchableOpacity style={[styles.docModalDownloadBtn, parts.disabled]} disabled activeOpacity={0.8}>
                <Text style={styles.docModalDownloadBtnText}>{ds('admin.audits.dashSchedule.doc.download')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.docModalCloseBtn} onPress={() => setShowDoc(false)} activeOpacity={0.8}>
                <Text style={styles.docModalCloseBtnText}>{ds('admin.audits.dashSchedule.doc.close')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
