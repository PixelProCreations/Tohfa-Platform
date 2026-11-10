/**
 * 02 · Farm & land, one group of rows per land location (step 3): location,
 * land area and whether an FMB boundary was drawn. The design's FMB
 * "Missing/Provided" was a tap-to-toggle switch; here it is read-only and
 * comes from the location's stored boundary. Zero locations is shown as such,
 * but it does not block anything on this screen: BR-69 is enforced by the
 * server, whose refusal the action bar shows.
 */
import React from 'react';
import type { ApplicationDetailView, ApplicationLocationView } from '../../../api/farmerTypes';
import { t } from '../../../i18n';
import { Card, InfoRow, SectionHeading } from '../applications/ApplicationParts';
import { acresLabel } from '../applications/applicationLogic';

function locationText(location: ApplicationLocationView, index: number): string {
  const name = location.label ?? t('farmerApps.farm.locationN', { n: index + 1 });
  const place = location.village ?? location.taluk ?? location.district;
  return place === null ? name : `${name}, ${place}`;
}

export function FarmSection({ app }: { app: ApplicationDetailView }) {
  const { locations } = app;
  return (
    <>
      <SectionHeading label={t('farmerApps.section.farm')} />
      <Card>
        {locations.length === 0 ? (
          <InfoRow label={t('farmerApps.field.location')} value={t('farmerApps.farm.noLocations')} valueTone="danger" last />
        ) : (
          locations.map((location, index) => {
            const last = index === locations.length - 1;
            return (
              <React.Fragment key={location.id ?? String(index)}>
                <InfoRow label={t('farmerApps.field.location')} value={locationText(location, index)} />
                <InfoRow label={t('farmerApps.field.landArea')} value={acresLabel(location.areaAcres ?? location.calculatedAreaAcres)} />
                <InfoRow
                  label={t('farmerApps.field.fmbSketch')}
                  value={location.hasBoundary ? t('farmerApps.fmb.provided') : t('farmerApps.fmb.missing')}
                  valueTone={location.hasBoundary ? 'success' : 'danger'}
                  last={last}
                />
              </React.Fragment>
            );
          })
        )}
      </Card>
    </>
  );
}
