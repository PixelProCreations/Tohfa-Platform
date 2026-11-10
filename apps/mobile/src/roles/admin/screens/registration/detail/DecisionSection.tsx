/**
 * 05 · Decision.
 *
 * Pending: the design's red "Approval is blocked: identity proof unverified,
 * FMB sketch missing" / green "All requirements met" banner was cosmetic (it
 * never blocked anything, and the server enforces only BR-69, at least one
 * land location). It is replaced by a neutral "waiting for a decision" note;
 * a real gate needs a new BR and a server check (owner decision #3).
 *
 * Review notes, Save Progress, the requirement statuses and the review history
 * have no API (no notes or history endpoint, no per-document verification).
 * They are drawn as designed but visibly unavailable, and every value is the
 * "not available" dash.
 *
 * Rejected: shown only for an application the server reports as REJECTED.
 */
import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { ApplicationDetailView } from '../../../api/farmerTypes';
import { t } from '../../../i18n';
import { adminColors } from '../../../theme';
import { Card, InfoRow, SectionHeading } from '../applications/ApplicationParts';
import { notAvailable, orDash } from '../applications/applicationLogic';
import { detailStyles } from './detailStyles';

export type DecisionState = 'pending' | 'approved' | 'rejected';

function SaveProgressButton() {
  // DESIGN-ONLY: no endpoint yet (review notes cannot be stored).
  return (
    <TouchableOpacity
      style={[detailStyles.saveProgressBtn, detailStyles.unavailable]}
      disabled
      accessibilityRole="button"
      accessibilityState={{ disabled: true }}
      accessibilityHint={t('farmerApps.decision.reviewNotesUnavailable')}
      testID="farmerApps.saveProgress"
    >
      <Text style={detailStyles.saveProgressText}>{t('farmerApps.decision.saveProgress')}</Text>
    </TouchableOpacity>
  );
}

const REQUIREMENTS = [
  'farmerApps.decision.req.identity',
  'farmerApps.decision.req.land',
  'farmerApps.decision.req.bank',
  'farmerApps.decision.req.farm',
] as const;

export function DecisionSection({ app, state }: { app: ApplicationDetailView; state: DecisionState }) {
  return (
    <>
      <SectionHeading label={t('farmerApps.section.decision')} />
      {state === 'rejected' ? (
        <Card>
          <Text style={detailStyles.rejectedTitle}>{t('farmerApps.decision.rejectedTitle')}</Text>
          <InfoRow label={t('farmerApps.decision.rejectedReason')} value={orDash(app.rejectionReason)} last />
        </Card>
      ) : state === 'approved' ? (
        <View style={detailStyles.section}>
          <View style={detailStyles.reqCard}>
            <Text style={detailStyles.reqTitle}>{t('farmerApps.decision.requirementsTitle')}</Text>
            {REQUIREMENTS.map((key, index) => (
              <InfoRow key={key} label={t(key)} value={notAvailable()} last={index === REQUIREMENTS.length - 1} />
            ))}
          </View>
          <Text style={detailStyles.fieldLabel}>{t('farmerApps.decision.reviewNotes')}</Text>
          <View style={detailStyles.notesBox}>
            <Text style={detailStyles.notesText}>{notAvailable()}</Text>
          </View>
          <SaveProgressButton />
          <Text style={detailStyles.caption}>{t('farmerApps.decision.reviewNotesUnavailable')}</Text>
          <Text style={detailStyles.fieldLabel}>{t('farmerApps.decision.reviewHistory')}</Text>
          <Text style={detailStyles.historyEmpty}>{t('farmerApps.decision.noHistory')}</Text>
        </View>
      ) : (
        <View style={detailStyles.section}>
          <View style={detailStyles.infoBox}>
            <Text style={detailStyles.infoText}>{t('farmerApps.decision.awaiting')}</Text>
          </View>
          <Text style={detailStyles.fieldLabel}>{t('farmerApps.decision.reviewNotes')}</Text>
          {/* DESIGN-ONLY: no endpoint yet; read-only so nothing typed here looks saved. */}
          <TextInput
            style={[detailStyles.notesInput, detailStyles.unavailable]}
            editable={false}
            multiline
            placeholder={t('farmerApps.decision.reviewNotesUnavailable')}
            placeholderTextColor={adminColors.placeholder}
            testID="farmerApps.reviewNotes"
          />
          <SaveProgressButton />
          <Text style={detailStyles.caption}>{t('farmerApps.decision.reviewNotesUnavailable')}</Text>
        </View>
      )}
    </>
  );
}
