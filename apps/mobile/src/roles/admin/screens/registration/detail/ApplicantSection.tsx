/**
 * 01 · Applicant. Name, phone and address come from the application (step 1).
 * In the Approved state the design adds Zone, Application ID, status and the
 * approved date: the API sends no zone, no human application code and no
 * decision date today (farmerTypes.ts), so those render as the "not
 * available" dash, never as the design's demo values.
 */
import React from 'react';
import type { ApplicationStatus } from '../../../api/farmerApplications';
import type { ApplicationDetailView } from '../../../api/farmerTypes';
import { t } from '../../../i18n';
import { Card, InfoRow, SectionHeading } from '../applications/ApplicationParts';
import { dayOrDash, notAvailable, orDash, statusLabel } from '../applications/applicationLogic';

function addressText(app: ApplicationDetailView): string {
  const a = app.applicant.address;
  const parts = [a.line1, a.line2 ?? a.text, a.village, a.taluk, a.district, a.pincode].filter(
    (p): p is string => p !== null && p !== '',
  );
  return parts.join(', ');
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
      <SectionHeading label={t('farmerApps.section.applicant')} />
      <Card>
        <InfoRow label={t('farmerApps.field.name')} value={orDash(app.applicant.name)} />
        <InfoRow label={t('farmerApps.field.phone')} value={orDash(app.applicant.mobile)} />
        <InfoRow label={t('farmerApps.field.address')} value={orDash(addressText(app))} />
        {approved ? (
          <>
            {/* No zone name and no human application code in the API response (a spec zoneId would be a bare uuid). */}
            <InfoRow label={t('farmerApps.field.zone')} value={notAvailable()} />
            <InfoRow label={t('farmerApps.field.applicationId')} value={notAvailable()} />
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
