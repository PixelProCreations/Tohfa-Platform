/**
 * 01 · Personal Details (step 1 of 5), drawn as the design draws it: full
 * name, date of birth, gender, mobile number with its "OTP Verified" mini
 * badge, the Aadhaar with its helper line, and the address.
 *
 * Two things the design asserts that the API does not:
 *   - the Aadhaar itself. Only the last four digits are ever sent (BR-33b),
 *     by design, so the row shows the masked form and nothing else.
 *   - "OTP Verified". No field on the application says whether the number was
 *     verified, so the badge keeps its shape and carries the dash.
 */
import React from 'react';
import { Text, View } from 'react-native';
import type { ApplicationDetailView } from '../../../api/farmerTypes';
import { t } from '../../../i18n';
import { ADMIN_NO_VALUE } from '../../../utils/noValue';
import { Card, InfoRow, StepHeader } from '../applications/ApplicationParts';
import { dobLabel, maskAadhaar, orDash } from '../applications/applicationLogic';
import { detailStyles } from './detailStyles';
import { APPLICATION_STEP_COUNT } from './reviewFacts';

function addressText(app: ApplicationDetailView): string {
  const a = app.applicant.address;
  const parts = [a.line1, a.line2 ?? a.text, a.village, a.taluk, a.district, a.pincode].filter(
    (p): p is string => p !== null && p !== '',
  );
  return parts.join(', ');
}

/** The design's green mini badge beside the mobile number; nothing reports a verification, so it carries the dash. */
function OtpBadge() {
  return (
    <View
      style={[detailStyles.badgeVerifiedMini, detailStyles.badgeUnknownMini]}
      testID="farmerApps.otpBadge"
      accessibilityHint={t('farmerApps.applicant.otpUnknown')}
    >
      <Text style={[detailStyles.badgeVerifiedMiniText, detailStyles.badgeUnknownMiniText]}>{ADMIN_NO_VALUE}</Text>
    </View>
  );
}

export function ApplicantSection({ app }: { app: ApplicationDetailView }) {
  return (
    <>
      <StepHeader label={t('farmerApps.section.applicant')} step={1} total={APPLICATION_STEP_COUNT} />
      <Card>
        <InfoRow label={t('farmerApps.field.name')} value={orDash(app.applicant.name)} bold />
        <InfoRow label={t('farmerApps.field.dob')} value={dobLabel(app.applicant.dob)} />
        <InfoRow label={t('farmerApps.field.gender')} value={orDash(app.applicant.gender)} />
        <InfoRow label={t('farmerApps.field.phone')} value={orDash(app.applicant.mobile)} bold valueSuffix={<OtpBadge />} />
        {/* BR-33b: the full number is never in the API response, by design. */}
        <InfoRow
          label={t('farmerApps.field.aadhaar')}
          hint={t('farmerApps.field.aadhaarHint')}
          value={maskAadhaar(app.applicant.aadhaarLast4)}
          bold
        />
        <InfoRow label={t('farmerApps.field.address')} value={orDash(addressText(app))} wide last />
      </Card>
    </>
  );
}
