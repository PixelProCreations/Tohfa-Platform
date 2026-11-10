/**
 * Reject Application (POST /admin/farmer-applications/{id}/reject,
 * farmer.application.reject, Idempotency-Key).
 *
 * Look: team design (tofhafarmfin-rbac) — back card, title, applicant card,
 * radio list of reasons, feedback box, Confirm Rejection. Against the design:
 *   - The radio list is the spec's reasonCode set (docs/openapi.yaml), in the
 *     design's order; the feedback box is the required `reason`, 5-500
 *     characters, checked before anything is sent. The client always sends
 *     both (the server would otherwise default them).
 *   - "Application rejected" appears only after the server agreed (the design
 *     announced it before any reason was entered); the Idempotency-Key is then
 *     released and the host's onConfirmReject runs.
 *   - The applicant card comes from the API by id, never from the host's item
 *     (which may be a demo row) or the design's fixture phone.
 *   - "An SMS notification will be sent" is not claimed: the server publishes
 *     an event, and what reaches the applicant is not this screen's to promise.
 *
 * Access fails closed: approve AND reject are needed (applicationLogic.ts);
 * without them nothing is loaded and nothing can be sent.
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Icon, SafeAreaView, ScreenStatusBar } from '@tohfa/mobile-ui';
import type { ApplicationRejectReasonCode, FarmerApplicationDto } from '../../api/farmerApplications';
import { useApplication, useRejectApplication } from '../../api/farmerHooks';
import { t } from '../../i18n';
import type { Can } from '../../permissions/can';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType, ADMIN_BUTTON_HEIGHT } from '../../theme';
import { AdminEmptyState } from '../warehouse/shared/AsyncStates';
import { BackButtonCard, partStyles } from './applications/ApplicationParts';
import {
  applicationAccess,
  applicationErrorKey,
  notAvailable,
  orDash,
  REJECT_REASON_MAX,
  rejectReasonLabel,
  rejectReasonMessage,
  validateRejectReason,
  type PendingApplicationItem,
  type RejectReasonProblem,
} from './applications/applicationLogic';

export interface AdminApplicationRejectScreenProps {
  applicationId?: string | undefined;
  /** Legacy host item (roles/farmer/App.tsx); only its `id` is read, when applicationId is not given. */
  application?: PendingApplicationItem | undefined;
  /** Permission check from /auth/me. Missing = deny everything. */
  can?: Can | undefined;
  /** The caller's warehouse, for the query cache key only (BR-30). */
  warehouseId?: string | undefined;
  onBack: () => void;
  /** After the server rejected: the reason's label and the text that was sent. */
  onConfirmReject?: ((reason: string, details: string, result: FarmerApplicationDto) => void) | undefined;
}

/** The design's order of reasons, as spec reason codes. */
const REASON_ORDER: readonly ApplicationRejectReasonCode[] = [
  'LAND_NOT_VERIFIED',
  'DOCUMENTS_INVALID',
  'OUTSIDE_SERVICE_AREA',
  'DUPLICATE_APPLICANT',
  'OTHER',
];

export const AdminApplicationRejectScreen: React.FC<AdminApplicationRejectScreenProps> = ({
  applicationId,
  application,
  can,
  warehouseId,
  onBack,
  onConfirmReject,
}) => {
  const access = applicationAccess(can);
  const allowed = access.canView && access.canDecide;
  const id = applicationId ?? application?.id;
  const live = useApplication(warehouseId, allowed ? id : undefined);
  const reject = useRejectApplication(allowed ? id : undefined);

  const [reasonCode, setReasonCode] = useState<ApplicationRejectReasonCode>('LAND_NOT_VERIFIED');
  const [details, setDetails] = useState('');
  const [problem, setProblem] = useState<RejectReasonProblem | null>(null);
  const [rejected, setRejected] = useState(false);

  const app = live.application;
  const name = orDash(app?.applicant.name);
  const place = app?.applicant.address.village ?? app?.applicant.address.district ?? null;
  const applicantSub = [place, app?.applicant.mobile ?? null].filter((p): p is string => p !== null && p !== '').join(' · ');
  const initials = app === undefined ? notAvailable() : name.split(/\s+/).map((w) => w.charAt(0)).join('').slice(0, 2).toUpperCase();

  const submit = () => {
    if (!allowed || reject.isPending || rejected) return;
    const found = validateRejectReason(details);
    setProblem(found);
    if (found !== null) return;
    const reason = details.trim();
    reject.run({ reasonCode, reason }, (result) => {
      setRejected(true);
      // The decision is done: the next one gets a fresh Idempotency-Key.
      reject.finish();
      onConfirmReject?.(rejectReasonLabel(reasonCode), reason, result);
    });
  };

  const hasServerError = reject.error !== null && reject.error !== undefined;

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={adminColors.canvas} />
      <View style={styles.header}>
        <BackButtonCard onPress={onBack} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title} accessibilityRole="header">
          {t('farmerApps.reject.title')}
        </Text>

        {!allowed ? (
          <AdminEmptyState title={t('farmerApps.reject.denied')} />
        ) : rejected ? (
          <View style={styles.card}>
            <Text style={styles.doneTitle}>{t('farmerApps.reject.doneTitle')}</Text>
            <Text style={styles.subtitle}>{t('farmerApps.reject.doneBody', { name })}</Text>
            <TouchableOpacity style={styles.secondaryBtn} onPress={onBack} accessibilityRole="button" testID="farmerApps.rejectDoneBack">
              <Text style={styles.secondaryBtnText}>{t('farmerApps.reject.doneBack')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.subtitle}>{t('farmerApps.reject.subtitle', { name })}</Text>

            <View style={styles.card}>
              <View style={styles.applicantRow}>
                <View style={partStyles.avatar}>
                  <Text style={partStyles.avatarText}>{initials}</Text>
                </View>
                <View style={styles.applicantInfo}>
                  <Text style={styles.applicantName}>{name}</Text>
                  {applicantSub === '' ? null : <Text style={styles.applicantSub}>{applicantSub}</Text>}
                </View>
              </View>
            </View>

            <Text style={styles.fieldLabel}>{t('farmerApps.reject.reasonLabel')}</Text>
            <View style={styles.reasonsList}>
              {REASON_ORDER.map((code) => {
                const selected = code === reasonCode;
                return (
                  <TouchableOpacity
                    key={code}
                    style={[styles.reasonOption, selected ? styles.reasonOptionSelected : null]}
                    onPress={() => setReasonCode(code)}
                    activeOpacity={0.8}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    testID={`farmerApps.rejectReasonCode.${code}`}
                  >
                    <View style={[styles.radio, selected ? styles.radioSelected : null]}>{selected ? <View style={styles.radioInner} /> : null}</View>
                    <Text style={[styles.reasonText, selected ? styles.reasonTextSelected : null]}>{rejectReasonLabel(code)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>{t('farmerApps.reject.detailsLabel')}</Text>
            <TextInput
              style={[styles.detailsInput, problem !== null ? styles.detailsInputError : null]}
              placeholder={t('farmerApps.reject.detailsPlaceholder')}
              placeholderTextColor={adminColors.placeholder}
              multiline
              numberOfLines={3}
              value={details}
              onChangeText={(text) => {
                setDetails(text);
                if (problem !== null) setProblem(validateRejectReason(text));
              }}
              testID="farmerApps.rejectReason"
            />
            <View style={styles.inputMetaRow}>
              <Text style={styles.problemText}>{problem === null ? '' : rejectReasonMessage(problem)}</Text>
              <Text style={styles.counter}>{t('farmerApps.reject.counter', { count: details.trim().length, max: REJECT_REASON_MAX })}</Text>
            </View>

            {hasServerError ? (
              <View style={[partStyles.errorBox, styles.errorSpacing]} accessibilityLiveRegion="polite">
                <Text style={partStyles.errorText}>{t(applicationErrorKey(reject.error))}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.rejectBtn, reject.isPending ? styles.busy : null]}
              activeOpacity={0.85}
              onPress={submit}
              disabled={reject.isPending}
              accessibilityRole="button"
              accessibilityState={{ disabled: reject.isPending, busy: reject.isPending }}
              testID="farmerApps.rejectConfirm"
            >
              <Icon name="cancel" size={adminSpacing.input} color={adminColors.onBrand} style={styles.rejectIcon} />
              <Text style={styles.rejectBtnText}>{reject.isPending ? t('farmerApps.reject.rejecting') : t('farmerApps.reject.confirm')}</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminColors.canvas },
  header: { paddingHorizontal: adminSpacing.input, paddingTop: adminSpacing.md, paddingBottom: adminSpacing.xsSm },
  container: { flex: 1 },
  content: { paddingHorizontal: adminSpacing.input, paddingTop: adminSpacing.md },
  title: { ...adminType.title, color: adminColors.brandDeep, marginBottom: adminSpacing.xs },
  subtitle: { ...adminType.body, color: adminColors.muted, marginBottom: adminSpacing.input },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.input,
    ...adminShadow.sm,
  },
  applicantRow: { flexDirection: 'row', alignItems: 'center' },
  applicantInfo: { flex: 1 },
  applicantName: { ...adminType.rowTitle, color: adminColors.ink, marginBottom: adminSpacing.xs },
  applicantSub: { ...adminType.rowMeta, color: adminColors.muted },
  fieldLabel: { ...adminType.rowTitle, color: adminColors.ink, marginBottom: adminSpacing.sm },
  reasonsList: { gap: adminSpacing.smMd, marginBottom: adminSpacing.input },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.mdLg,
    paddingVertical: adminSpacing.md,
  },
  reasonOptionSelected: { borderColor: adminColors.brand, backgroundColor: adminColors.brandTint },
  radio: {
    width: adminSpacing.input,
    height: adminSpacing.input,
    borderRadius: adminRadius.full,
    borderWidth: 2,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: adminSpacing.md,
  },
  radioSelected: { borderColor: adminColors.brand },
  radioInner: { width: adminSpacing.smMd, height: adminSpacing.smMd, borderRadius: adminRadius.full, backgroundColor: adminColors.brand },
  reasonText: { ...adminType.body, flex: 1, color: adminColors.ink },
  reasonTextSelected: { ...adminType.rowTitle, color: adminColors.brand },
  detailsInput: {
    ...adminType.body,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.mdLg,
    color: adminColors.ink,
    textAlignVertical: 'top',
    minHeight: adminSpacing.pageMargin,
  },
  detailsInputError: { borderColor: adminColors.danger.text },
  inputMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: adminSpacing.sm,
    marginTop: adminSpacing.xs,
    marginBottom: adminSpacing.xl,
  },
  problemText: { ...adminType.rowMeta, color: adminColors.danger.text, flex: 1 },
  counter: { ...adminType.rowMeta, color: adminColors.muted },
  errorSpacing: { marginBottom: adminSpacing.lg },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.lg,
    height: ADMIN_BUTTON_HEIGHT,
    ...adminShadow.md,
  },
  busy: { opacity: 0.6 },
  rejectIcon: { marginRight: adminSpacing.sm },
  rejectBtnText: { ...adminType.rowTitle, color: adminColors.onBrand },
  doneTitle: { ...adminType.sectionHead, color: adminColors.danger.text, marginBottom: adminSpacing.xs },
  secondaryBtn: {
    height: ADMIN_BUTTON_HEIGHT,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { ...adminType.rowTitle, color: adminColors.ink },
  bottomSpacer: { height: adminSpacing.largeSection },
});
