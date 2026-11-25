/**
 * Reject Application (POST /admin/farmer-applications/{id}/reject,
 * farmer.application.reject, Idempotency-Key).
 *
 * Look: the design of record (origin/Superadmin-main AdminApplicationRejectScreen),
 * through the shared decision-screen styles (applications/DecisionScreenParts.tsx):
 * back card, title, applicant card, radio list of reasons, feedback box,
 * Confirm Rejection. Against the design:
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
 *   - Under the feedback box, the 5-500 character rule's message and counter.
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
import { adminColors } from '../../theme';
import { AdminEmptyState } from '../warehouse/shared/AsyncStates';
import { BackButtonCard } from './applications/ApplicationParts';
import {
  applicationAccess,
  applicationErrorKey,
  REJECT_REASON_MAX,
  rejectReasonLabel,
  rejectReasonMessage,
  validateRejectReason,
  type PendingApplicationItem,
  type RejectReasonProblem,
} from './applications/applicationLogic';
import { ApplicantCard, applicantSummary, decisionStyles } from './applications/DecisionScreenParts';
import { BOX, FS, LH, RAD, SP } from './designMetrics';

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

  const summary = applicantSummary(live.application);
  const name = summary.name;

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
    <SafeAreaView style={decisionStyles.root}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={adminColors.canvas} />
      <View style={decisionStyles.header}>
        <BackButtonCard onPress={onBack} />
      </View>

      <ScrollView style={decisionStyles.container} contentContainerStyle={decisionStyles.contentContainer} showsVerticalScrollIndicator={false}>
        <Text style={decisionStyles.title} accessibilityRole="header">
          {t('farmerApps.reject.title')}
        </Text>

        {!allowed ? (
          <AdminEmptyState title={t('farmerApps.reject.denied')} />
        ) : rejected ? (
          <View style={decisionStyles.card}>
            <Text style={styles.doneTitle}>{t('farmerApps.reject.doneTitle')}</Text>
            <Text style={decisionStyles.subtitle}>{t('farmerApps.reject.doneBody', { name })}</Text>
            <TouchableOpacity style={styles.secondaryBtn} onPress={onBack} accessibilityRole="button" testID="farmerApps.rejectDoneBack">
              <Text style={styles.secondaryBtnText}>{t('farmerApps.reject.doneBack')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={decisionStyles.subtitle}>{t('farmerApps.reject.subtitle', { name })}</Text>

            <ApplicantCard summary={summary} />

            <Text style={decisionStyles.fieldLabel}>{t('farmerApps.reject.reasonLabel')}</Text>
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
                    <View style={[styles.radioCircle, selected ? styles.radioCircleSelected : null]}>
                      {selected ? <View style={styles.radioInner} /> : null}
                    </View>
                    <Text style={[styles.reasonText, selected ? styles.reasonTextSelected : null]}>{rejectReasonLabel(code)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={decisionStyles.fieldLabel}>{t('farmerApps.reject.detailsLabel')}</Text>
            <TextInput
              style={[decisionStyles.notesInput, styles.detailsInput, problem !== null ? decisionStyles.notesInputError : null]}
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
            {/* Not in the design: the spec's 5-500 character rule, checked before anything is sent. */}
            <View style={styles.inputMetaRow}>
              <Text style={styles.problemText}>{problem === null ? '' : rejectReasonMessage(problem)}</Text>
              <Text style={styles.counter}>{t('farmerApps.reject.counter', { count: details.trim().length, max: REJECT_REASON_MAX })}</Text>
            </View>

            {hasServerError ? (
              <View style={decisionStyles.errorBox} accessibilityLiveRegion="polite">
                <Text style={decisionStyles.errorText}>{t(applicationErrorKey(reject.error))}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[decisionStyles.primaryBtn, reject.isPending ? decisionStyles.busy : null]}
              activeOpacity={0.85}
              onPress={submit}
              disabled={reject.isPending}
              accessibilityRole="button"
              accessibilityState={{ disabled: reject.isPending, busy: reject.isPending }}
              testID="farmerApps.rejectConfirm"
            >
              <Icon name="cancel" size={SP.s20} color={adminColors.onBrand} style={decisionStyles.primaryBtnIcon} />
              <Text style={decisionStyles.primaryBtnText}>{reject.isPending ? t('farmerApps.reject.rejecting') : t('farmerApps.reject.confirm')}</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={decisionStyles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  reasonsList: { gap: SP.s10, marginBottom: SP.s20 },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: RAD.r14,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    paddingHorizontal: SP.s14,
    paddingVertical: SP.s12,
  },
  reasonOptionSelected: { borderColor: adminColors.brand, backgroundColor: adminColors.brandTint },
  radioCircle: {
    width: SP.s20,
    height: SP.s20,
    borderRadius: SP.s10,
    borderWidth: 2,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SP.s12,
  },
  radioCircleSelected: { borderColor: adminColors.brand },
  radioInner: { width: SP.s10, height: SP.s10, borderRadius: SP.s10 / 2, backgroundColor: adminColors.brand },
  reasonText: { flex: 1, fontSize: FS.s13_5, fontWeight: '600', color: adminColors.ink, lineHeight: LH.l18 },
  reasonTextSelected: { color: adminColors.brand, fontWeight: '700' },
  /** The design's 24pt gap below the box is kept, with the character counter inside it. */
  detailsInput: { marginBottom: SP.s4 },
  inputMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SP.s8,
    marginBottom: SP.s20,
  },
  problemText: { fontSize: FS.s10_5, color: adminColors.danger.text, flex: 1 },
  counter: { fontSize: FS.s10_5, color: adminColors.muted },
  doneTitle: { fontSize: FS.s13_5, fontWeight: '800', color: adminColors.danger.text, marginBottom: SP.s4 },
  secondaryBtn: {
    height: BOX.button,
    borderRadius: RAD.r12,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { fontSize: FS.s14, fontWeight: '700', color: adminColors.ink },
});
