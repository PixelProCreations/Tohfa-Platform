/**
 * 05 · Application Tracking & Lifecycle (step 5 of 5), drawn as the design
 * draws it: Application ID, Submitted On, the Update Tracking Status picker,
 * the farmer's declaration line, and the Application Progression Tracker.
 *
 * Audit is not part of this flow (owner decision 2026-11-25): the tracker has
 * no "Audit Completed" stage and the picker offers no audit option (see
 * TRACKING_STATUS_OPTIONS).
 *
 * The picker is drawn but disabled: moving an application between stages is
 * the endpoint being built now (testID farmerApps.updateTracking; its sheet is
 * already here, listing the non-audit options, for when it is wired). The
 * tracker only reports the server's status (documentReview.lifecycleStages).
 *
 * The declaration line is green only when the application records the
 * farmer's declaration; it never does yet, so the box is drawn neutral with
 * the dash.
 */
import React, { useState } from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import type { ApplicationStatus } from '../../../api/farmerApplications';
import { useAdvanceApplication } from '../../../api/farmerHooks';
import type { ApplicationDetailView } from '../../../api/farmerTypes';
import { t, type TranslationKey } from '../../../i18n';
import { adminColors } from '../../../theme';
import { ADMIN_NO_VALUE } from '../../../utils/noValue';
import {
  Card,
  CheckCircleIcon,
  ChevronDownIcon,
  InfoRow,
  StepHeader,
} from '../applications/ApplicationParts';
import { applicationErrorKey, dayOrDash, orDash } from '../applications/applicationLogic';
import { SP } from '../designMetrics';
import { detailStyles } from './detailStyles';
import {
  gateBlockerSummary,
  lifecycleStages,
  TRACKING_STATUS_OPTIONS,
  trackingOptionFor,
  type LifecycleDot,
  type LifecycleStageKey,
} from './documentReview';
import { APPLICATION_STEP_COUNT } from './reviewFacts';

const STAGE_TITLE: Record<LifecycleStageKey, TranslationKey> = {
  submitted: 'farmerApps.tracking.stage.submitted',
  docsReview: 'farmerApps.tracking.stage.docsReview',
  farmVerification: 'farmerApps.tracking.stage.farmVerification',
  decision: 'farmerApps.tracking.stage.decision',
};

const DOT_STYLE: Record<LifecycleDot, object> = {
  done: detailStyles.stageDotActive,
  inProgress: detailStyles.stageDotInProgress,
  warning: detailStyles.stageDotWarning,
  pending: detailStyles.stageDotPending,
};

/** The design ticks a finished or sent-back stage and numbers the rest. */
function dotText(dot: LifecycleDot, n: number): string {
  return dot === 'done' || dot === 'warning' ? t('farmerApps.tracking.tick') : String(n);
}

export interface TrackingSectionProps {
  app: ApplicationDetailView;
  /** The status to report (APPROVED as soon as this screen's approval succeeded). */
  status: ApplicationStatus;
  applicationId?: string | undefined;
  canAdvance?: boolean | undefined;
}

export function TrackingSection({ app, status, applicationId, canAdvance = false }: TrackingSectionProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [movedSuccess, setMovedSuccess] = useState(false);
  const advance = useAdvanceApplication(canAdvance ? (applicationId ?? app.id) : undefined);

  const stages = lifecycleStages(app, status);
  const current = trackingOptionFor(status);
  const declared = app.declaration !== null && app.declaration !== undefined;
  const docsGate = app.reviewGates?.farmVerification;
  const blockerReason = status === 'DOCS_REVIEW' ? gateBlockerSummary(docsGate) : null;
  const isDocsReview = status === 'DOCS_REVIEW';
  const gateMet = docsGate === undefined || docsGate === null || docsGate.met;
  const canMoveToFarm = Boolean(canAdvance && isDocsReview && gateMet && !advance.isPending);

  const handleMoveToFarmVerification = () => {
    if (!canMoveToFarm) return;
    setMovedSuccess(false);
    advance.run({ toStatus: 'FARM_VERIFICATION' }, () => {
      advance.finish();
      setMovedSuccess(true);
      setSheetOpen(false);
    });
  };

  function stageLine(key: LifecycleStageKey, lineKey: TranslationKey | null): string {
    if (key === 'submitted')
      return t('farmerApps.tracking.line.submitted', { date: dayOrDash(app.submittedAt) });
    return lineKey === null ? ADMIN_NO_VALUE : t(lineKey);
  }

  return (
    <>
      <StepHeader
        label={t('farmerApps.section.tracking')}
        step={5}
        total={APPLICATION_STEP_COUNT}
      />
      <Card>
        <InfoRow
          label={t('farmerApps.tracking.applicationId')}
          value={orDash(app.applicationCode)}
          bold
        />
        <InfoRow label={t('farmerApps.tracking.submittedOn')} value={dayOrDash(app.submittedAt)} />

        <View style={detailStyles.statusDropdownSection}>
          <Text style={detailStyles.label}>{t('farmerApps.tracking.updateStatus')}</Text>
          <TouchableOpacity
            style={[detailStyles.dropdownTrigger, canAdvance && isDocsReview ? null : detailStyles.actionUnavailable]}
            onPress={canAdvance && isDocsReview ? () => setSheetOpen(true) : undefined}
            disabled={!(canAdvance && isDocsReview)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ disabled: !(canAdvance && isDocsReview) }}
            accessibilityHint={!canAdvance ? t('farmerApps.tracking.moveDenied') : undefined}
            testID="farmerApps.updateTracking"
          >
            <Text style={detailStyles.dropdownTriggerText}>
              {current === null ? ADMIN_NO_VALUE : t(current)}
            </Text>
            <ChevronDownIcon size={SP.s16} color={adminColors.ink} />
          </TouchableOpacity>

          {isDocsReview ? (
            <TouchableOpacity
              style={[detailStyles.advanceBtn, canMoveToFarm ? null : detailStyles.actionUnavailable]}
              onPress={canMoveToFarm ? handleMoveToFarmVerification : undefined}
              disabled={!canMoveToFarm}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canMoveToFarm, busy: advance.isPending }}
              accessibilityHint={!canAdvance ? t('farmerApps.tracking.moveDenied') : blockerReason ?? undefined}
              testID="farmerApps.advanceToFarmVerification"
            >
              <Text style={detailStyles.advanceBtnText}>
                {advance.isPending ? t('farmerApps.tracking.moving') : t('farmerApps.tracking.moveToFarmVerification')}
              </Text>
            </TouchableOpacity>
          ) : null}

          {blockerReason !== null ? (
            <Text style={detailStyles.gateWarningText} testID="farmerApps.advanceGateReason">
              {blockerReason}
            </Text>
          ) : null}
          {movedSuccess ? <Text style={detailStyles.inlineSuccessText}>{t('farmerApps.tracking.movedSuccess')}</Text> : null}
          {advance.error !== null && advance.error !== undefined ? (
            <Text style={detailStyles.inlineErrorText}>{t(applicationErrorKey(advance.error))}</Text>
          ) : null}
        </View>

        <View
          style={[detailStyles.termsAgreementBox, declared ? null : detailStyles.termsUnknownBox]}
          testID="farmerApps.declaration"
        >
          <CheckCircleIcon
            size={SP.s16}
            color={declared ? adminColors.success.text : adminColors.muted}
          />
          <Text
            style={[
              detailStyles.termsAgreementText,
              declared ? null : detailStyles.termsUnknownText,
            ]}
          >
            {declared
              ? t('farmerApps.tracking.declarationAgreed')
              : t('farmerApps.tracking.declarationUnknown', { value: ADMIN_NO_VALUE })}
          </Text>
        </View>

        <Text style={[detailStyles.fieldLabel, detailStyles.trackerLabel]}>
          {t('farmerApps.tracking.progress')}
        </Text>
        <View style={detailStyles.lifecycleTracker}>
          {stages.map(({ key, number, dot, lineKey }, index) => (
            <View key={key} style={detailStyles.stageItem} testID={`farmerApps.stage.${key}`}>
              <View style={detailStyles.stageIndicatorCol}>
                <View style={DOT_STYLE[dot]}>
                  <Text style={detailStyles.stageDotText}>{dotText(dot, number)}</Text>
                </View>
                {index === stages.length - 1 ? null : <View style={detailStyles.stageLine} />}
              </View>
              <View style={detailStyles.stageContent}>
                <Text style={detailStyles.stageTitle}>{t(STAGE_TITLE[key])}</Text>
                <Text style={detailStyles.stageSub}>{stageLine(key, lineKey)}</Text>
              </View>
            </View>
          ))}
        </View>
      </Card>

      {/* The design's status picker. Unreachable while the trigger above is disabled. */}
      {!sheetOpen ? null : (
        <Modal visible transparent animationType="fade" onRequestClose={() => setSheetOpen(false)}>
          <TouchableOpacity
            style={detailStyles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setSheetOpen(false)}
          >
            <View style={detailStyles.bottomSheet}>
              <Text style={detailStyles.bottomSheetTitle}>
                {t('farmerApps.tracking.updateStatus')}
              </Text>
              <View style={detailStyles.statusOptionsList}>
                {TRACKING_STATUS_OPTIONS.map((option) => {
                  const selected = option.labelKey === current;
                  const selectable = option.status === 'FARM_VERIFICATION' && canMoveToFarm;
                  return (
                    <TouchableOpacity
                      key={option.status}
                      style={[
                        detailStyles.statusOptionItem,
                        selected ? detailStyles.statusOptionItemSelected : null,
                        selectable || selected ? null : detailStyles.actionUnavailable,
                      ]}
                      onPress={selectable ? handleMoveToFarmVerification : undefined}
                      disabled={!selectable}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: !selectable }}
                      testID={`farmerApps.trackingOption.${option.status}`}
                    >
                      <Text
                        style={[
                          detailStyles.statusOptionText,
                          selected ? detailStyles.statusOptionTextSelected : null,
                        ]}
                      >
                        {t(option.labelKey)}
                      </Text>
                      {selected ? (
                        <CheckCircleIcon size={SP.s16} color={adminColors.brand} />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </>
  );
}
