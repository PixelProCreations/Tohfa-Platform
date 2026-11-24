/**
 * 01 · Personal details (step 1), in the 2026-11-19 design's field order:
 * full name, date of birth, gender, mobile number, the Aadhaar with its
 * helper line, and the address.
 *
 * Two things the design asserts that the API does not:
 *   - the Aadhaar itself. Only the last four digits are ever sent (BR-33b),
 *     by design, so the row shows the masked form and nothing else.
 *   - the green "OTP Verified" badge beside the mobile number. No field on
 *     the application says whether the number was verified, so the badge is
 *     drawn and reads as the dash rather than claiming a verification.
 *
 * In the Approved state the design adds Zone, Application ID, status and the
 * approved date: the API sends no zone name and no human application code,
 * so those render as the dash, never as the design's demo values.
 */
import React from 'react';
import { Text, View } from 'react-native';
import type { ApplicationStatus } from '../../../api/farmerApplications';
import type { ApplicationDetailView } from '../../../api/farmerTypes';
import { t } from '../../../i18n';
import { Card, InfoRow, StepHeader } from '../applications/ApplicationParts';
import { dayOrDash, dobLabel, maskAadhaar, notAvailable, orDash, statusLabel } from '../applications/applicationLogic';
import { detailStyles } from './detailStyles';
import { stepState, APPLICATION_STEP_COUNT } from './reviewFacts';

function addressText(app: ApplicationDetailView): string {
  const a = app.applicant.address;
  const parts = [a.line1, a.line2 ?? a.text, a.village, a.taluk, a.district, a.pincode].filter(
    (p): p is string => p !== null && p !== '',
  );
  return parts.join(', ');
}

/** The design's badge beside the mobile number; nothing reports a verification, so it shows the dash. */
function OtpBadge() {
  return (
    <View
      style={detailStyles.badgeUnknown}
      testID="farmerApps.otpBadge"
      accessibilityHint={t('farmerApps.applicant.otpUnknown')}
    >
      <Text style={detailStyles.badgeUnknownText}>{notAvailable()}</Text>
    </View>
  );
}

export interface ApplicantSectionProps {
  app: ApplicationDetailView;
  /** The status to show (APPROVED as soon as this screen's approval succeeded). */
  status: ApplicationStatus;
  /** decidedAt from the approval answer or the application, when the server sends one. */
  decidedAt: string | null;
}

export function ApplicantSection({ app, status, decidedAt }: ApplicantSectionProps) {
  const approved = status === 'APPROVED';
  return (
    <>
      <StepHeader
        label={t('farmerApps.section.applicant')}
        step={1}
        total={APPLICATION_STEP_COUNT}
        state={stepState(app, 1)}
      />
      <Card>
        <InfoRow label={t('farmerApps.field.name')} value={orDash(app.applicant.name)} />
        <InfoRow label={t('farmerApps.field.dob')} value={dobLabel(app.applicant.dob)} />
        <InfoRow label={t('farmerApps.field.gender')} value={orDash(app.applicant.gender)} />
        <InfoRow label={t('farmerApps.field.phone')} value={orDash(app.applicant.mobile)} valueSuffix={<OtpBadge />} />
        {/* BR-33b: the full number is never in the API response, by design. */}
        <InfoRow
          label={t('farmerApps.field.aadhaar')}
          hint={t('farmerApps.field.aadhaarHint')}
          value={maskAadhaar(app.applicant.aadhaarLast4)}
        />
        <InfoRow label={t('farmerApps.field.address')} value={orDash(addressText(app))} />
        {approved ? (
          <>
            {/* No zone name in the API response (a spec zoneId would be a bare uuid). */}
            <InfoRow label={t('farmerApps.field.zone')} value={notAvailable()} />
            <InfoRow label={t('farmerApps.field.applicationId')} value={orDash(app.applicationCode)} />
            <InfoRow label={t('farmerApps.field.applicationStatus')} value={statusLabel(status)} />
            <InfoRow label={t('farmerApps.field.submitted')} value={dayOrDash(app.submittedAt)} />
            <InfoRow label={t('farmerApps.field.approved')} value={dayOrDash(decidedAt)} last />
          </>
        ) : (
          <InfoRow label={t('farmerApps.field.submitted')} value={dayOrDash(app.submittedAt)} last />
        )}
      </Card>
    </>
  );
}
