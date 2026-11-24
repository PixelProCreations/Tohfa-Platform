/**
 * 05 · Application tracking & lifecycle, from the 2026-11-19 design.
 *
 * The design let the reviewer pick a "tracking status" from a dropdown and
 * then re-drew the whole tracker from that local choice. Nothing moves an
 * application between statuses except /approve, /reject and /request-info, so
 * here the tracker only reports what the server says: the stages come from the
 * application's own status, and the dropdown is drawn but disabled.
 *
 * Each stage's line is its state (complete / in progress / pending) rather
 * than the design's "Field audit report submitted" wording: no audit report,
 * visit date or verifier is in the application response, so claiming one would
 * be inventing it. The documents stage is the one exception — its line is the
 * real review stage (documents requested / under review), which the server's
 * `infoRequest` does tell us.
 */
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import type { ApplicationStatus } from '../../../api/farmerApplications';
import type { ApplicationDetailView } from '../../../api/farmerTypes';
import { t, type TranslationKey } from '../../../i18n';
import { Card, InfoRow, StepHeader } from '../applications/ApplicationParts';
import { dayOrDash, notAvailable, orDash, statusLabel } from '../applications/applicationLogic';
import { detailStyles } from './detailStyles';
import { APPLICATION_STEP_COUNT, stepState } from './reviewFacts';
import {
  decisionLineKey,
  documentReviewStage,
  lifecycleStages,
  type LifecycleStageKey,
  type LifecycleStageState,
} from './documentReview';

const STAGE_TITLE: Record<LifecycleStageKey, TranslationKey> = {
  submitted: 'farmerApps.tracking.stage.submitted',
  docsReview: 'farmerApps.tracking.stage.docsReview',
  farmVerification: 'farmerApps.tracking.stage.farmVerification',
  audit: 'farmerApps.tracking.stage.audit',
  decision: 'farmerApps.tracking.stage.decision',
};

const STAGE_STATE: Record<LifecycleStageState, TranslationKey> = {
  done: 'farmerApps.tracking.stageState.done',
  current: 'farmerApps.tracking.stageState.current',
  pending: 'farmerApps.tracking.stageState.pending',
};

const DOC_STAGE_LINE: Record<ReturnType<typeof documentReviewStage>, TranslationKey | null> = {
  requested: 'farmerApps.doc.reviewStage.requested',
  allVerified: 'farmerApps.doc.reviewStage.allVerified',
  underReview: 'farmerApps.doc.reviewStage.underReview',
  unknown: null,
};

export interface TrackingSectionProps {
  app: ApplicationDetailView;
  /** The status to report (APPROVED as soon as this screen's approval succeeded). */
  status: ApplicationStatus;
}

export function TrackingSection({ app, status }: TrackingSectionProps) {
  const stages = lifecycleStages(app, status);

  function stageLine(key: LifecycleStageKey, state: LifecycleStageState): string {
    if (key === 'decision') return t(decisionLineKey(status));
    if (key === 'docsReview') {
      const line = DOC_STAGE_LINE[documentReviewStage(app)];
      if (line !== null) return t(line);
    }
    if (key === 'submitted') return dayOrDash(app.submittedAt);
    return t(STAGE_STATE[state]);
  }

  return (
    <>
      <StepHeader
        label={t('farmerApps.section.tracking')}
        step={5}
        total={APPLICATION_STEP_COUNT}
        state={stepState(app, 5)}
      />
      <Card>
        {/* The server sends no human application code today; a bare uuid is not one. */}
        <InfoRow label={t('farmerApps.tracking.applicationId')} value={orDash(app.applicationCode)} />
        <InfoRow label={t('farmerApps.tracking.submittedOn')} value={dayOrDash(app.submittedAt)} />
        <InfoRow label={t('farmerApps.tracking.currentStatus')} value={statusLabel(status)} />
        {/* The design's "farmer confirmed the terms" line: the API sends no declaration. */}
        <InfoRow label={t('farmerApps.tracking.declaration')} value={notAvailable()} last />
      </Card>

      {/* DESIGN-ONLY: no endpoint yet (nothing moves an application between tracking statuses). */}
      <TouchableOpacity
        style={[detailStyles.dropdownTrigger, detailStyles.unavailable]}
        disabled
        accessibilityRole="button"
        accessibilityState={{ disabled: true }}
        accessibilityHint={t('farmerApps.tracking.updateUnavailable')}
        testID="farmerApps.updateTracking"
      >
        <Text style={detailStyles.dropdownLabel}>{t('farmerApps.tracking.updateStatus')}</Text>
        <Text style={detailStyles.dropdownValue}>{statusLabel(status)}</Text>
      </TouchableOpacity>
      <Text style={detailStyles.caption}>{t('farmerApps.tracking.updateUnavailable')}</Text>

      <Text style={detailStyles.fieldLabel}>{t('farmerApps.tracking.progress')}</Text>
      <View style={detailStyles.tracker}>
        {stages.map(({ key, state }, index) => (
          <View key={key} style={detailStyles.stageItem}>
            <View style={detailStyles.stageIndicator}>
              <View
                style={[
                  detailStyles.stageDot,
                  state === 'done' ? detailStyles.stageDotDone : state === 'current' ? detailStyles.stageDotCurrent : null,
                ]}
              />
              {/* Decoration only: the design's rule joining one stage to the next. */}
              {index === stages.length - 1 ? null : <View style={detailStyles.stageConnector} />}
            </View>
            <View style={detailStyles.stageBody}>
              <Text style={detailStyles.stageTitle}>{t(STAGE_TITLE[key])}</Text>
              <Text style={detailStyles.stageSub}>{stageLine(key, state)}</Text>
            </View>
          </View>
        ))}
      </View>
    </>
  );
}
