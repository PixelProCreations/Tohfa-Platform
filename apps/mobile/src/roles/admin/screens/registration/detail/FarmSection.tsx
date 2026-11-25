/**
 * 03 · Farm Location & Boundaries (step 3 of 5), drawn as the design draws it:
 * one card holding the satellite map (GPS pill top-left, zone tags
 * bottom-left), the summary row (farm name, GPS line, total-area badge), the
 * ZONES / FMB BOUNDARY / FMB STATUS strip and the zone list.
 *
 * The map is the applicant's real step-3 boundary (`fmbRing`, from the
 * stored `fmbPolygon`):
 *   - on a build with map tiles (isFarmMapAvailable) it is the shared
 *     FarmBoundaryMap from @tohfa/mobile-ui, read-only, gestures off;
 *   - otherwise the design's own dark panel, with the real ring(s) projected
 *     into it in the design's dashed amber;
 *   - with no ring at all, the panel says so — nothing is drawn that the
 *     applicant did not draw.
 *
 * What the design shows and the API cannot: GPS accuracy (dash), a crop per
 * zone (crops are farm-wide, so a single-location farm shows them and a
 * multi-location one dashes), and a zone status (dash).
 *
 * FMB STATUS is the design's tap-to-toggle; verifying an FMB has no endpoint
 * yet, so it is drawn disabled for the wiring worker (testID farmerApps.fmbVerify).
 */
import React, { useState } from 'react';
import { Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Polygon, Rect } from 'react-native-svg';
import { FarmBoundaryMap, isFarmMapAvailable } from '@tohfa/mobile-ui';
import { REJECT_REASON_MAX, REJECT_REASON_MIN } from '../../../api/farmerApplications';
import { useReviewApplicationFmb } from '../../../api/farmerHooks';
import type { ApplicationDetailView, ApplicationLocationView } from '../../../api/farmerTypes';
import { t } from '../../../i18n';
import { adminColors } from '../../../theme';
import { ADMIN_NO_VALUE } from '../../../utils/noValue';
import { MapPinIcon, StepHeader } from '../applications/ApplicationParts';
import { applicationErrorKey, gpsLabel, orDash, rejectReasonMessage, validateRejectReason } from '../applications/applicationLogic';
import { BOX, SP } from '../designMetrics';
import { detailStyles } from './detailStyles';
import {
  APPLICATION_STEP_COUNT,
  fmbAreaAcres,
  fmbRings,
  projectRings,
  ringCenter,
  ringPointCount,
  type Ring,
} from './reviewFacts';

/** The design's drawing box (viewBox 0 0 320 150) and its inset. */
const VIEW_W = BOX.map * 2 + SP.s20;
const VIEW_H = BOX.map;
/** design: the boundary sits roughly 20pt inside the panel. */
const VIEW_PAD = SP.s20;
/** A whole small farm in a 150pt-tall preview (the shared map defaults to 17, tuned for full screen). */
const PREVIEW_ZOOM = 15;

function locationName(location: ApplicationLocationView, index: number): string {
  return location.label ?? t('farmerApps.farm.locationN', { n: index + 1 });
}

function acresShort(value: number | null): string {
  return value === null ? ADMIN_NO_VALUE : t('farmerApps.location.areaBadge', { acres: value.toFixed(2) });
}

/** Crops are recorded for the whole farm: they belong to a location only when there is exactly one. */
function locationCrop(app: ApplicationDetailView): string {
  return app.locations.length === 1 ? orDash(app.farming.primaryCrops.join(', ')) : ADMIN_NO_VALUE;
}

/** The design's dark panel with the real ring(s) drawn in its dashed amber. */
function ProjectedBoundary({ rings }: { rings: Ring[] }) {
  const projected = projectRings(rings, VIEW_W, VIEW_H, VIEW_PAD);
  const amber = adminColors.platform.warning;
  return (
    <Svg width="100%" height={VIEW_H} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} testID="farmerApps.boundaryShape">
      <Rect width={VIEW_W} height={VIEW_H} fill={adminColors.success.text} />
      {projected.map((ring, i) => (
        <React.Fragment key={`ring-${i}`}>
          <Polygon
            points={ring.map(([x, y]) => `${x},${y}`).join(' ')}
            fill={amber}
            fillOpacity="0.28"
            stroke={amber}
            strokeWidth="2.5"
            strokeDasharray="4 2"
          />
          {ring.slice(0, ringPointCount(ring)).map(([x, y], j) => (
            <Circle key={`v-${i}-${j}`} cx={x} cy={y} r="4.5" fill={adminColors.onBrand} stroke={amber} strokeWidth="2" />
          ))}
        </React.Fragment>
      ))}
    </Svg>
  );
}

function SatelliteMapPreview({ app }: { app: ApplicationDetailView }) {
  const rings = fmbRings(app);
  const first = rings[0];
  const gps = app.locations.find((l) => l.gps !== null)?.gps ?? null;
  return (
    <View style={detailStyles.satelliteContainer} testID="farmerApps.boundaryMap">
      {first === undefined ? (
        <View style={detailStyles.mapEmpty}>
          <Text style={detailStyles.mapEmptyText}>{t('farmerApps.location.noBoundary')}</Text>
        </View>
      ) : isFarmMapAvailable() ? (
        <FarmBoundaryMap
          readOnly
          hideSearchBar
          gesturesEnabled={false}
          initialCenter={ringCenter(first)}
          initialPolygon={first}
          initialZoom={PREVIEW_ZOOM}
          readOnlyOverlays={rings.slice(1).map((ring, i) => ({ id: `fmb-${i + 1}`, ring, color: adminColors.brand }))}
          testID="farmerApps.boundaryMapTiles"
        />
      ) : (
        <ProjectedBoundary rings={rings} />
      )}

      {app.locations.length === 0 ? null : (
        <View style={detailStyles.zoneTagOverlay}>
          {app.locations.map((location, index) => (
            <View key={location.id ?? String(index)} style={detailStyles.zoneBadge}>
              <Text style={detailStyles.zoneBadgeText}>{locationName(location, index)}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={detailStyles.gpsCoordPill}>
        <MapPinIcon size={SP.s12 + SP.s1} color={adminColors.onBrand} />
        <Text style={detailStyles.gpsCoordText}>{gpsLabel(gps)}</Text>
      </View>
    </View>
  );
}

export interface FarmSectionProps {
  app: ApplicationDetailView;
  applicationId?: string | undefined;
  canVerifyFmb?: boolean | undefined;
}

export function FarmSection({ app, applicationId, canVerifyFmb = false }: FarmSectionProps) {
  const { locations } = app;
  const rings = fmbRings(app);
  const fmbAcres = fmbAreaAcres(app);
  const points = rings.reduce((sum, ring) => sum + ringPointCount(ring), 0);
  const allDrawn = locations.length > 0 && locations.every((l) => l.hasBoundary);
  const allVerified = locations.length > 0 && locations.every((l) => l.fmbReview?.status === 'VERIFIED');
  const anyRejected = locations.some((l) => l.fmbReview?.status === 'REJECTED');
  const gps = locations.find((l) => l.gps !== null)?.gps ?? null;
  const isReviewable = !app.isDraft && (app.status === 'DOCS_REVIEW' || app.status === 'FARM_VERIFICATION');

  const reviewFmb = useReviewApplicationFmb(canVerifyFmb ? (applicationId ?? app.id) : undefined);
  const [rejectTarget, setRejectTarget] = useState<{ locationId: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectProblem, setRejectProblem] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const verifyLocation = (locationId: string) => {
    if (!canVerifyFmb || !isReviewable || reviewFmb.isPending) return;
    setFeedback(null);
    reviewFmb.run({ locationId, decision: 'VERIFIED' }, () => {
      reviewFmb.finish();
      setFeedback(t('farmerApps.fmb.verifiedSuccess'));
    });
  };

  const openReject = (locationId: string, name: string) => {
    if (!canVerifyFmb || !isReviewable) return;
    setFeedback(null);
    setRejectReason('');
    setRejectProblem(null);
    setRejectTarget({ locationId, name });
  };

  const confirmReject = () => {
    if (!rejectTarget || !canVerifyFmb || !isReviewable || reviewFmb.isPending) return;
    const problem = validateRejectReason(rejectReason);
    if (problem !== null) {
      setRejectProblem(rejectReasonMessage(problem));
      return;
    }
    setRejectProblem(null);
    reviewFmb.run({ locationId: rejectTarget.locationId, decision: 'REJECTED', reason: rejectReason.trim() }, () => {
      reviewFmb.finish();
      setRejectTarget(null);
      setRejectReason('');
      setFeedback(t('farmerApps.fmb.rejectedSuccess'));
    });
  };

  const firstPendingLocation = locations.find((l) => l.id !== null && l.fmbReview?.status !== 'VERIFIED');
  const canSummaryVerify = Boolean(canVerifyFmb && isReviewable && firstPendingLocation?.id && !reviewFmb.isPending);

  const fmbStatusText = allVerified
    ? t('farmerApps.fmb.verified')
    : anyRejected
      ? t('farmerApps.fmb.rejected')
      : allDrawn
        ? t('farmerApps.fmb.provided')
        : t('farmerApps.fmb.pending');

  return (
    <>
      <StepHeader label={t('farmerApps.section.farm')} step={3} total={APPLICATION_STEP_COUNT} />
      <View style={detailStyles.cardNoPadding}>
        <SatelliteMapPreview app={app} />

        <View style={detailStyles.mapSummaryCard}>
          <View style={detailStyles.mapSummaryRow}>
            <View style={detailStyles.mapSummaryTitleBox}>
              <Text style={detailStyles.mapSummaryTitle}>{orDash(app.farming.farmName)}</Text>
              {/* Nothing in the application reports the GPS fix quality the design prints. */}
              <Text style={detailStyles.mapSummarySub}>
                {t('farmerApps.location.gpsLine', { gps: gpsLabel(gps), accuracy: ADMIN_NO_VALUE })}
              </Text>
            </View>
            <View style={detailStyles.totalAreaBadge}>
              <Text style={detailStyles.totalAreaBadgeText}>{acresShort(fmbAcres)}</Text>
            </View>
          </View>

          <View style={detailStyles.zonesInfoRow}>
            <View style={detailStyles.zoneStatBox}>
              <Text style={detailStyles.zoneStatLabel}>{t('farmerApps.location.zonesStat')}</Text>
              <Text style={detailStyles.zoneStatValue}>{String(locations.length)}</Text>
            </View>
            <View style={detailStyles.zoneStatBox}>
              <Text style={detailStyles.zoneStatLabel}>{t('farmerApps.location.fmbBoundaryStat')}</Text>
              <Text style={detailStyles.zoneStatValue}>
                {fmbAcres === null || points === 0
                  ? ADMIN_NO_VALUE
                  : t('farmerApps.location.boundaryValue', { acres: fmbAcres.toFixed(2), points })}
              </Text>
            </View>
            <View style={detailStyles.zoneStatBox}>
              <Text style={detailStyles.zoneStatLabel}>{t('farmerApps.location.fmbStatusStat')}</Text>
              <TouchableOpacity
                style={canSummaryVerify ? null : detailStyles.actionUnavailable}
                onPress={canSummaryVerify && firstPendingLocation?.id ? () => verifyLocation(firstPendingLocation.id!) : undefined}
                disabled={!canSummaryVerify}
                accessibilityRole="button"
                accessibilityState={{ disabled: !canSummaryVerify }}
                accessibilityHint={!canVerifyFmb ? t('farmerApps.fmb.permissionDenied') : undefined}
                testID="farmerApps.fmbVerify"
              >
                <Text
                  style={[
                    detailStyles.zoneStatValue,
                    allVerified || allDrawn
                      ? detailStyles.fmbStatusProvided
                      : anyRejected
                        ? detailStyles.fmbStatusRejected
                        : detailStyles.fmbStatusPending,
                  ]}
                >
                  {fmbStatusText}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={detailStyles.zonesListContainer}>
            {locations.length === 0 ? (
              <View style={[detailStyles.zoneListItem, detailStyles.rowLast]}>
                <Text style={detailStyles.zoneCropText}>{t('farmerApps.farm.noLocations')}</Text>
              </View>
            ) : (
              locations.map((location, index) => {
                const locId = location.id;
                const locName = locationName(location, index);
                const locReview = location.fmbReview?.status;
                const locVerified = locReview === 'VERIFIED';
                const locRejected = locReview === 'REJECTED';
                const locStatusLabel = locVerified
                  ? t('farmerApps.fmb.verified')
                  : locRejected
                    ? t('farmerApps.fmb.rejected')
                    : locReview === 'PENDING'
                      ? t('farmerApps.fmb.pending')
                      : ADMIN_NO_VALUE;
                const canVerifyLoc = Boolean(canVerifyFmb && isReviewable && locId && !locVerified && !reviewFmb.isPending);
                const canRejectLoc = Boolean(canVerifyFmb && isReviewable && locId && !reviewFmb.isPending);
                return (
                  <View
                    key={locId ?? String(index)}
                    style={[detailStyles.zoneListItem, index === locations.length - 1 ? detailStyles.rowLast : null]}
                    testID="farmerApps.locationRow"
                  >
                    <View style={detailStyles.locationRowWrap}>
                      <Text style={detailStyles.zoneNameText} numberOfLines={1}>
                        {locName}
                      </Text>
                      <Text style={detailStyles.zoneCropText}>
                        {t('farmerApps.location.zoneCrop', {
                          crop: locationCrop(app),
                          area: acresShort(location.calculatedAreaAcres ?? location.areaAcres),
                        })}
                      </Text>
                      {locRejected && location.fmbReview?.reason ? (
                        <Text style={detailStyles.docRejectReasonText}>{location.fmbReview.reason}</Text>
                      ) : null}
                      {locId !== null ? (
                        <View style={detailStyles.locationActionsRow}>
                          <TouchableOpacity
                            style={[detailStyles.locationActionBtn, canVerifyLoc ? null : detailStyles.actionUnavailable]}
                            onPress={canVerifyLoc ? () => verifyLocation(locId) : undefined}
                            disabled={!canVerifyLoc}
                            activeOpacity={0.8}
                            accessibilityRole="button"
                            accessibilityState={{ disabled: !canVerifyLoc }}
                            testID={`farmerApps.fmbVerify.${locId}`}
                          >
                            <Text style={detailStyles.locationActionBtnText}>
                              {locVerified ? t('farmerApps.fmb.verified') : t('farmerApps.fmb.verify')}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[detailStyles.locationRejectBtn, canRejectLoc ? null : detailStyles.actionUnavailable]}
                            onPress={canRejectLoc ? () => openReject(locId, locName) : undefined}
                            disabled={!canRejectLoc}
                            activeOpacity={0.8}
                            accessibilityRole="button"
                            accessibilityState={{ disabled: !canRejectLoc }}
                            testID={`farmerApps.fmbReject.${locId}`}
                          >
                            <Text style={detailStyles.locationRejectBtnText}>{t('farmerApps.fmb.reject')}</Text>
                          </TouchableOpacity>
                        </View>
                      ) : null}
                    </View>
                    <Text
                      style={[
                        detailStyles.zoneStatusText,
                        locRejected ? detailStyles.fmbStatusRejected : null,
                      ]}
                    >
                      {locStatusLabel}
                    </Text>
                  </View>
                );
              })
            )}
          </View>

          {feedback !== null ? <Text style={detailStyles.inlineSuccessText}>{feedback}</Text> : null}
          {reviewFmb.error !== null && reviewFmb.error !== undefined ? (
            <Text style={detailStyles.inlineErrorText}>{t(applicationErrorKey(reviewFmb.error))}</Text>
          ) : null}
        </View>
      </View>

      {rejectTarget === null ? null : (
        <Modal visible transparent animationType="fade" onRequestClose={() => setRejectTarget(null)}>
          <View style={detailStyles.modalBackdrop}>
            <View style={detailStyles.bottomSheet}>
              <Text style={detailStyles.bottomSheetTitle}>
                {t('farmerApps.fmb.rejectTitle', { name: rejectTarget.name })}
              </Text>
              <TextInput
                style={detailStyles.notesInput}
                placeholder={t('farmerApps.fmb.rejectPlaceholder')}
                placeholderTextColor={adminColors.muted}
                multiline
                maxLength={REJECT_REASON_MAX}
                value={rejectReason}
                onChangeText={(text) => {
                  setRejectReason(text);
                  if (rejectProblem !== null && text.trim().length >= REJECT_REASON_MIN) setRejectProblem(null);
                }}
                testID="farmerApps.fmbRejectReasonInput"
              />
              {rejectProblem !== null ? <Text style={detailStyles.inlineErrorText}>{rejectProblem}</Text> : null}
              <View style={detailStyles.modalButtonsRow}>
                <TouchableOpacity
                  style={detailStyles.modalCloseBtn}
                  onPress={() => setRejectTarget(null)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                >
                  <Text style={detailStyles.modalCloseBtnText}>{t('farmerApps.doc.close')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[detailStyles.modalMarkVerifiedBtn, reviewFmb.isPending ? detailStyles.actionUnavailable : null]}
                  onPress={confirmReject}
                  disabled={reviewFmb.isPending}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  testID="farmerApps.fmbRejectConfirm"
                >
                  <Text style={detailStyles.modalMarkVerifiedBtnText}>{t('farmerApps.fmb.rejectConfirm')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}
