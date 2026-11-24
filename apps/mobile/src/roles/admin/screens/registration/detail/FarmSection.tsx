/**
 * 03 · Farm location & boundaries (step 3), in the 2026-11-19 design's
 * layout: the map card, a summary row, and one card per land location with
 * its label, area, place, FMB state and GPS coordinates.
 *
 * What the design shows and the API cannot:
 *   - the satellite imagery and the drawn plot shape. `fmbPolygon` is accepted
 *     when the application is written but is not on the read view, so the map
 *     card is drawn with its label and dashes the picture. No shape is
 *     invented and no map library is pulled in for a placeholder.
 *   - GPS accuracy, which the design prints as a metre figure and a quality
 *     word. Nothing reports it; the row dashes.
 *   - a crop per zone. `primaryCrops` is farm-wide, not per parcel, so the
 *     whole farm's crops are shown once in the summary and each parcel's own
 *     crop row dashes with the reason.
 *
 * The design's FMB "Missing/Provided" was a tap-to-toggle; here it is
 * read-only and comes from the location's stored boundary. Zero locations is
 * shown as such but blocks nothing: BR-69 is the server's, and the action bar
 * shows its refusal.
 */
import React from 'react';
import { Text, View } from 'react-native';
import type { ApplicationDetailView, ApplicationLocationView } from '../../../api/farmerTypes';
import { t } from '../../../i18n';
import { Card, InfoRow, StepHeader } from '../applications/ApplicationParts';
import { acresLabel, gpsLabel, notAvailable, orDash } from '../applications/applicationLogic';
import { detailStyles } from './detailStyles';
import { APPLICATION_STEP_COUNT, locationSummary, stepState } from './reviewFacts';

function locationName(location: ApplicationLocationView, index: number): string {
  return location.label ?? t('farmerApps.farm.locationN', { n: index + 1 });
}

/** The design's satellite preview: drawn, labelled, and dashed where the picture would be. */
function BoundaryMapCard() {
  return (
    <View style={detailStyles.mapCard} testID="farmerApps.boundaryMap">
      <View style={detailStyles.mapHeader}>
        <Text style={detailStyles.mapTitle}>{t('farmerApps.location.mapTitle')}</Text>
      </View>
      {/* The design's dark satellite panel. No imagery exists, so it holds the dash. */}
      <View style={detailStyles.mapBody}>
        <Text style={detailStyles.mapDash}>{notAvailable()}</Text>
      </View>
      <View style={detailStyles.mapFooter}>
        <Text style={detailStyles.caption}>{t('farmerApps.location.mapUnavailable')}</Text>
      </View>
    </View>
  );
}

function SummaryCard({ app }: { app: ApplicationDetailView }) {
  const summary = locationSummary(app);
  return (
    <Card>
      <InfoRow label={t('farmerApps.location.zonesLabel')} value={String(summary.locationCount)} />
      <InfoRow label={t('farmerApps.location.fmbAreaLabel')} value={acresLabel(summary.fmbAcres)} />
      <InfoRow
        label={t('farmerApps.location.fmbStatusLabel')}
        value={t('farmerApps.location.fmbCount', { drawn: summary.boundaryCount, total: summary.locationCount })}
        valueTone={summary.locationCount > 0 && summary.boundaryCount === summary.locationCount ? 'success' : 'warning'}
      />
      {/* The design put a crop beside each zone; the application records crops for the whole farm. */}
      <InfoRow label={t('farmerApps.field.farmCrops')} value={orDash(app.farming.primaryCrops.join(', '))} last />
    </Card>
  );
}

function LocationCard({ location, index }: { location: ApplicationLocationView; index: number }) {
  return (
    <View style={detailStyles.docCard} testID="farmerApps.locationCard">
      <View style={detailStyles.docHeaderRow}>
        <Text style={detailStyles.docTitle}>{locationName(location, index)}</Text>
      </View>
      <InfoRow label={t('farmerApps.field.landArea')} value={acresLabel(location.areaAcres)} />
      <InfoRow label={t('farmerApps.field.fmbArea')} value={acresLabel(location.calculatedAreaAcres)} />
      <InfoRow label={t('farmerApps.field.village')} value={orDash(location.village)} />
      <InfoRow label={t('farmerApps.field.taluk')} value={orDash(location.taluk)} />
      <InfoRow label={t('farmerApps.field.district')} value={orDash(location.district)} />
      <InfoRow
        label={t('farmerApps.field.fmbSketch')}
        value={location.hasBoundary ? t('farmerApps.fmb.provided') : t('farmerApps.fmb.missing')}
        valueTone={location.hasBoundary ? 'success' : 'danger'}
      />
      <InfoRow label={t('farmerApps.field.gps')} value={gpsLabel(location.gps)} />
      {/* Nothing in the application reports the fix quality the design prints beside the coordinates. */}
      <InfoRow label={t('farmerApps.field.gpsAccuracy')} value={notAvailable()} />
      {/* No per-parcel crop field exists; the farm-wide list is in the summary above. */}
      <InfoRow label={t('farmerApps.field.parcelCrops')} value={notAvailable()} last />
    </View>
  );
}

export function FarmSection({ app }: { app: ApplicationDetailView }) {
  const { locations } = app;
  return (
    <>
      <StepHeader
        label={t('farmerApps.section.farm')}
        step={3}
        total={APPLICATION_STEP_COUNT}
        state={stepState(app, 3)}
      />
      <BoundaryMapCard />
      <SummaryCard app={app} />
      <Text style={detailStyles.caption}>{t('farmerApps.location.cropsNotPerParcel')}</Text>

      {locations.length === 0 ? (
        <Card>
          <InfoRow label={t('farmerApps.field.location')} value={t('farmerApps.farm.noLocations')} valueTone="danger" last />
        </Card>
      ) : (
        <View style={detailStyles.docList}>
          {locations.map((location, index) => (
            <LocationCard key={location.id ?? String(index)} location={location} index={index} />
          ))}
        </View>
      )}
    </>
  );
}
