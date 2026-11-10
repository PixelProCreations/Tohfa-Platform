/**
 * 04 · Farming: farming type and crops from step 2. The Approved state's
 * "Declaration" row has no API source, so it shows the "not available" dash.
 */
import React from 'react';
import type { ApplicationDetailView } from '../../../api/farmerTypes';
import { t } from '../../../i18n';
import { Card, InfoRow, SectionHeading } from '../applications/ApplicationParts';
import { notAvailable, orDash } from '../applications/applicationLogic';

export function FarmingSection({ app, approved }: { app: ApplicationDetailView; approved: boolean }) {
  return (
    <>
      <SectionHeading label={t('farmerApps.section.farming')} />
      <Card>
        <InfoRow label={t('farmerApps.field.farmingType')} value={orDash(app.farming.typeOfFarming)} />
        <InfoRow label={t('farmerApps.field.crops')} value={orDash(app.farming.primaryCrops.join(', '))} last={!approved} />
        {approved ? <InfoRow label={t('farmerApps.field.declaration')} value={notAvailable()} last /> : null}
      </Card>
    </>
  );
}
