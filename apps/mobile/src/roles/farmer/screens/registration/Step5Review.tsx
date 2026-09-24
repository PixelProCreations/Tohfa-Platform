import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme, authPalette as P } from '../../theme';
import { Icon } from '@tohfa/mobile-ui';
import { validateCrossStepSubmission } from './validation';
import { useRegistrationDraftStore } from '../../storage/registrationDraft';
import type { FarmLocationData, RegistrationDraft } from '../../storage/registrationDraft';
import { saveFarmerApplicationStep, submitFarmerApplication } from '../../api/registration';
import { formatErrorMessage } from '../../../../shell/api/client';

/**
 * Shown for any field the farmer has not filled in yet. This screen used to substitute
 * plausible-looking demo values instead ('Great Earth Organic', '11.4064, 76.6932', ...), which on
 * a review-before-submit screen is worse than a blank: it invites the farmer to confirm an
 * application containing farm details and GPS coordinates they never entered. Same wording the
 * DOCUMENTS section below already uses, since this file carries literal strings rather than `t()`.
 */
const NOT_PROVIDED = 'Not provided';

/**
 * Acreage is summed across parcels here, so a raw `${n} acres` would happily render
 * `2.5000000000000004 acres`. Round for display only -- nothing is stored back from this screen.
 */
function formatAcres(areaAcres: number): string {
  return `${Number(areaAcres.toFixed(2))} acres`;
}

/**
 * Zero is a real answer -- a farmer in their first season has zero completed years -- so presence
 * is tested against `undefined`, not falsiness. `!experienceYears` would print "Not provided" over
 * a deliberate 0, which is the same confusion that let this field go uncollected entirely.
 */
function formatYears(experienceYears: number | undefined): string {
  if (experienceYears === undefined) return NOT_PROVIDED;
  return experienceYears === 1 ? '1 year' : `${experienceYears} years`;
}

/**
 * Float hygiene, NOT a business tolerance. Parcel acreages are decimals that get summed, so
 * 1.1 + 1.4 lands on 2.5000000000000004 and would report a phantom difference against a stated
 * 2.5. There is no "acceptable variance" in acreage: any real gap between the farmer's stated
 * holding and the land they have marked is shown exactly as it is, and never blocks submission.
 */
const AREA_COMPARISON_EPSILON_ACRES = 0.01;

function formatGps(location: FarmLocationData): string {
  if (location.latitude === undefined || location.longitude === undefined) return NOT_PROVIDED;
  return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
}

function formatFmb(location: FarmLocationData): string {
  const ring = location.fmbPolygon?.coordinates?.[0];
  if (!ring || ring.length === 0) return NOT_PROVIDED;
  // Only the map-derived area belongs on this row. Falling back to the farmer-stated `areaAcres`
  // (shown on its own row above) would present a typed-in number as if the boundary measured it.
  const { calculatedAreaAcres } = location;
  return calculatedAreaAcres === undefined
    ? `${ring.length} pts`
    : `${ring.length} pts · ${calculatedAreaAcres.toFixed(2)} ac`;
}

/**
 * How a parcel came to have a position. Drawing the boundary and typing coordinates are NOT
 * equal evidence: a drawn parcel carries an FMB polygon and an area measured off that polygon,
 * while a manually positioned one is a single pinned point whose only area figure is the acreage
 * the farmer stated. FARM_VERIFICATION turns on exactly that difference, so the farmer is shown
 * it here, before certifying, in the same words the reviewer will see.
 */
type ParcelPositioning = 'drawn' | 'manual' | 'none';

const POSITIONING_LABEL: Record<ParcelPositioning, string> = {
  drawn: 'Boundary drawn on map',
  manual: 'Manual coordinates',
  none: NOT_PROVIDED,
};

/**
 * The boundary decides, and `gpsCaptured` is only consulted for parcels that have none.
 *
 * `gpsCaptured` is the flag the API carries for this -- `docs/openapi.yaml` defines it as "false
 * when the farmer fell back to manual lat/lng entry" -- but it is a flag *about* the data, and
 * this screen's job is to describe the payload that is about to be submitted. If a parcel holds a
 * polygon, that polygon is what reaches the reviewer, so reading such a parcel as "manual" because
 * a stale `gpsCaptured: false` survived a re-draw would understate evidence the application
 * actually contains. Hence: a boundary present means drawn, a flip back from manual to drawn needs
 * no flag to be believed, and the two only ever disagree if Step 3 leaves them inconsistent.
 *
 * With no boundary there is nothing to measure, and coordinates can only have been typed in --
 * `gpsCaptured` is then the corroborating reading rather than the discriminator, since nothing
 * else in this flow produces a coordinate pair without a polygon.
 */
function positioningOf(location: FarmLocationData): ParcelPositioning {
  const ring = location.fmbPolygon?.coordinates?.[0];
  if (ring && ring.length > 0) return 'drawn';
  if (location.latitude !== undefined && location.longitude !== undefined) return 'manual';
  return 'none';
}

interface Step5Props {
  draft: RegistrationDraft;
  onSubmitSuccess: (applicationId: string) => void;
  onBack: () => void;
  onEditStep?: ((step: number) => void) | undefined;
}

export const Step5Review: React.FC<Step5Props> = ({ draft, onSubmitSuccess, onBack, onEditStep }) => {
  const theme = useTheme();
  const { colors } = theme;

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Must default to false: an unticked checkbox is not consent, and a farmer who
  // never touches this box must not have the app record explicit agreement on
  // their behalf.
  const [termsAccepted, setTermsAccepted] = useState(false);
  const resetDraft = useRegistrationDraftStore((s) => s.reset);

  async function handleSubmit() {
    if (!termsAccepted) {
      setErrorMsg('You must accept the terms and conditions to submit.');
      return;
    }
    
    // 1. Cross-step validation pass
    const crossCheck = validateCrossStepSubmission(draft);
    if (!crossCheck.valid) {
      setErrorMsg(crossCheck.errors.join(' '));
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      // Safety net: Steps 1-4 already save in the background as the farmer moves through the
      // stepper (RegistrationFlowScreen's updateStepAndAdvance), but a save can silently fail
      // (a network blip) without blocking progress -- by design, so registration keeps working
      // offline. Nothing later ever retries that ONE step's failed save on its own; a farmer who
      // never manually revisits that screen would reach here with data that exists only in the
      // local draft. This is the last point before the point of no return, so re-send every
      // step's current local data one more time. Each call just overwrites that step's own
      // JSONB column with the same data, so re-sending unchanged data is harmless -- and unlike
      // every earlier background save, a failure HERE must stop submission (falls through to
      // the outer catch below), because submitting now would otherwise commit an application the
      // server never fully received.
      const stepsToResave: [number, unknown][] = [
        [1, draft.step1],
        [2, draft.step2],
        [3, draft.step3],
        [4, draft.step4],
      ];
      for (const [step, payload] of stepsToResave) {
        if (payload === undefined) continue;
        await saveFarmerApplicationStep(draft.applicationId, step, payload);
      }

      // Persist the review-step confirmation itself, the same
      // saveFarmerApplicationStep mechanism every earlier step in this flow uses
      // (see RegistrationFlowScreen's updateStepAndAdvance). Step5ReviewData /
      // step5ReviewSchema already exist server-side for exactly this shape, but
      // nothing ever called it. Step 5 is the terminal review step, so this does
      // not advance currentStep -- it only records that the farmer ticked the box.
      // Best-effort, like every other step's background save: a failure here must
      // never block the actual submission below.
      try {
        await saveFarmerApplicationStep(draft.applicationId, 5, { confirmed: termsAccepted });
      } catch (err) {
        console.warn('saveFarmerApplicationStep 5 failed:', err);
      }

      // Unlike the step-5-confirmation save above, a failure HERE must be real: this is the
      // actual submission the farmer is certifying. It used to be swallowed by its own
      // try/catch ("if offline or mock draft ID, still proceed gracefully"), which reset the
      // draft and told the farmer they were done even when the server never received the
      // submission -- indistinguishable from a real success. By the time a farmer reaches
      // Step 5, `draft.applicationId` is already a real server-assigned id (Step 1 blocks
      // advancing to Step 2 until `createFarmerApplication` succeeds -- see
      // RegistrationFlowScreen's `updateStepAndAdvance`), so there is no legitimate
      // placeholder-id case left to special-case here; any failure is a real one and must
      // reach the farmer, not be logged and hidden.
      const idempotencyKey = `sub-${draft.applicationId}-${Date.now()}`;
      const res = await submitFarmerApplication(draft.applicationId, idempotencyKey);
      resetDraft();
      onSubmitSuccess(res.id);
    } catch (err) {
      setErrorMsg(
        formatErrorMessage(err, 'Failed to submit application. Please check your connection and retry.'),
      );
    } finally {
      setSubmitting(false);
    }
  }

  const Section = ({
    title,
    stepNum,
    data,
  }: {
    title: string;
    stepNum?: number | undefined;
    data: { label: string; value: string; highlight?: boolean }[];
  }) => (
    <View style={[styles.section, { backgroundColor: P.creamTint8, borderColor: P.creamTint7 }]}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.brandGreen }]}>{title}</Text>
        {stepNum && onEditStep ? (
          <TouchableOpacity onPress={() => onEditStep(stepNum)}>
            <Text style={[styles.editLink, { color: colors.brandGreen }]}>Edit</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={styles.sectionRows}>
        {data.map((row, i) => (
          <View key={i} style={styles.dataRow}>
            <Text style={[styles.dataLabel, { color: colors.textSubtle }]}>{row.label}</Text>
            <Text style={[styles.dataValue, { color: row.highlight ? colors.brandGreen : colors.textDark }]}>{row.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bgLight }]}>
      
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: colors.white, borderBottomColor: colors.borderSoft }]}>
        <View style={styles.headerTitleRow}>
          <TouchableOpacity activeOpacity={0.7} style={[styles.backButtonCircle, { borderColor: colors.borderMedium, backgroundColor: colors.white }]} onPress={onBack}>
            <Text style={[styles.backButtonArrow, { color: colors.brandGreen }]}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.textDark }]}>Review & Submit</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSubtle }]}>Step 5 of 5</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressRow}>
          {[1, 2, 3, 4, 5].map((s) => (
            <View key={s} style={[styles.progressSegment, { backgroundColor: colors.brandGreen }]} />
          ))}
        </View>
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {errorMsg ? (
          <View style={[styles.errorBanner, { backgroundColor: P.amber50, borderColor: P.amber200 }]}>
            <Icon name="warning" size={16} color={P.twAmber900} />
            <Text style={[styles.errorBannerText, { color: P.twAmber900 }]}>{errorMsg}</Text>
            <TouchableOpacity onPress={() => setErrorMsg(null)}>
              <Icon name="close" size={16} color={P.twAmber900} />
            </TouchableOpacity>
          </View>
        ) : null}

        {/*
          Same reasoning as NOT_PROVIDED above, applied to the identity rows: these three used to
          fall back to 'Suresh Kumar' / '+91 98765 43210' / '3782 4591 0023'. A farmer who skipped
          a field would tick "I confirm all information is accurate" over a stranger's name and a
          made-up Aadhaar number.
        */}
        <Section
          title="PERSONAL"
          stepNum={1}
          data={[
            { label: 'Name', value: draft.step1?.fullName?.trim() || NOT_PROVIDED },
            { label: 'Mobile', value: draft.step1?.mobile?.trim() || NOT_PROVIDED },
            {
              label: 'Aadhaar',
              // Always masked. Step 1 keeps the full `aadhaarNumber` in the local draft until
              // submission, so the no-`aadhaarLast4` branch derives the last four from it rather
              // than printing all twelve digits on a screen the farmer may hold up to a field
              // officer.
              value: (() => {
                const last4 =
                  draft.step1?.aadhaarLast4?.trim() ||
                  draft.step1?.aadhaarNumber?.replace(/\s+/g, '').slice(-4);
                return last4 ? `•••• •••• ${last4}` : NOT_PROVIDED;
              })(),
            },
          ]}
        />

        {/*
          One FARM card, because a farmer runs one farming operation. It leads with that
          operation's own name -- `step2.farmName`, asked once -- which is NOT a parcel name: the
          LOCATION cards below carry each parcel's `label` ("Home plot", "River plot"). 'Great
          Earth Organic' was this screen's old hard-coded farm-name placeholder; now that the
          field is really collected, the farmer's own value is shown, or NOT_PROVIDED, never that
          string. Each of the farmer's two stated figures is shown next to its ground counterpart
          on purpose: "Total area (stated)" and "Number of farms (stated)" are the farmer's OWN
          numbers from Step 2, typically read off their land records (patta/chitta), while "Area
          marked" (the sum of the Step 3 parcels' acreage) and "Locations marked" (how many parcels
          they actually drew) come from the ground. Paper and ground are allowed to disagree -- that gap is the signal
          FARM_VERIFICATION exists to catch (land not yet marked, stale records, or an inflated
          claim), and derived figures would always agree with themselves and so tell a verifier
          nothing. This being the confirm-before-submit screen, each difference is surfaced so the
          farmer sees it before certifying -- but it is informational only: never reconciled, never
          an error, and never a block on submission, because a farmer mid-registration legitimately
          has parcels still unmarked. See `Step2FarmData`'s docblock.
        */}
        {(() => {
          const locations = draft.step3?.locations ?? [];
          const markedAreaAcres = locations.reduce(
            (sum: number, location: FarmLocationData) => sum + (location.areaAcres || 0),
            0,
          );
          const statedAreaAcres = draft.step2?.totalAreaAcres;
          const hasStatedArea = statedAreaAcres !== undefined && statedAreaAcres > 0;
          const statedFarmCount = draft.step2?.numberOfFarms;
          const hasStatedFarmCount = statedFarmCount !== undefined && statedFarmCount > 0;

          const rows: { label: string; value: string; highlight?: boolean }[] = [
            { label: 'Farm name', value: draft.step2?.farmName?.trim() || NOT_PROVIDED },
            { label: 'Type', value: draft.step2?.typeOfFarming?.trim() || NOT_PROVIDED },
            { label: 'Experience', value: formatYears(draft.step2?.experienceYears) },
            {
              label: 'Total area (stated)',
              value: hasStatedArea ? formatAcres(statedAreaAcres) : NOT_PROVIDED,
            },
            {
              label: 'Number of farms (stated)',
              value: hasStatedFarmCount ? String(statedFarmCount) : NOT_PROVIDED,
            },
            {
              label: 'Area marked',
              value: markedAreaAcres > 0 ? formatAcres(markedAreaAcres) : NOT_PROVIDED,
            },
            {
              label: 'Locations marked',
              value: locations.length > 0 ? String(locations.length) : NOT_PROVIDED,
            },
          ];

          // Both difference rows appear only once there is something to compare: with no parcels
          // marked yet, the rows above already say so, and a difference equal to the whole claim
          // would read as a fault rather than as work still to do. Direction is readable from the
          // pair of rows each one follows, so these stay bare magnitudes and keep the neutral value
          // colour.
          if (hasStatedArea && markedAreaAcres > 0) {
            const areaDifference = Math.abs(statedAreaAcres - markedAreaAcres);
            if (areaDifference > AREA_COMPARISON_EPSILON_ACRES) {
              rows.push({ label: 'Area difference', value: formatAcres(areaDifference) });
            }
          }

          // No epsilon here, and deliberately none: parcel counts are integers, so there is no
          // floating-point noise to absorb and "off by one plot" is a real difference, not rounding.
          if (hasStatedFarmCount && locations.length > 0 && statedFarmCount !== locations.length) {
            rows.push({
              label: 'Farm count difference',
              value: String(Math.abs(statedFarmCount - locations.length)),
            });
          }

          return <Section title="FARM" stepNum={2} data={rows} />;
        })()}

        {/*
          One card per land location. Each parcel carries its own boundary, so this is a plain walk
          of the list -- there is nothing to correlate back to Step 2 any more.

          The parcels in one application may be positioned differently from each other: a farmer who
          cannot get a lock or draw an accurate boundary on one plot -- ordinary under tree cover or
          on an older handset -- may still have drawn the one next to it. So the rows are built per
          parcel, and the "FMB marked" row is emitted only where a boundary exists. Rendering it as
          a blank or a '0 pts' on a manually positioned parcel would read as a failed survey rather
          than as the deliberate fallback it is.
        */}
        {(() => {
          const locations = draft.step3?.locations ?? [];

          // Nothing located yet (farmer jumped here from an interrupted draft): keep one empty card
          // so the Edit link back to step 3 stays reachable.
          if (locations.length === 0) {
            return (
              <Section
                title="LOCATION"
                stepNum={3}
                data={[
                  { label: 'Location name', value: NOT_PROVIDED },
                  { label: 'Area', value: NOT_PROVIDED },
                  { label: 'Positioning', value: POSITIONING_LABEL.none },
                  { label: 'Coordinates', value: NOT_PROVIDED },
                ]}
              />
            );
          }

          return locations.map((location: FarmLocationData, index: number) => {
            const positioning = positioningOf(location);
            const rows: { label: string; value: string; highlight?: boolean }[] = [
              { label: 'Location name', value: location.label?.trim() || NOT_PROVIDED },
              {
                label: 'Area',
                value: location.areaAcres > 0 ? formatAcres(location.areaAcres) : NOT_PROVIDED,
              },
              { label: 'Positioning', value: POSITIONING_LABEL[positioning] },
              { label: 'Coordinates', value: formatGps(location) },
            ];

            // Only a drawn parcel has a polygon and an area measured from it. A manual one has
            // neither, and inventing either figure is the whole thing this screen must not do.
            if (positioning === 'drawn') {
              rows.push({ label: 'FMB marked', value: formatFmb(location) });
            }

            return (
              <Section
                key={location.id || index}
                title={`LOCATION${locations.length > 1 ? ` ${index + 1}` : ''}`}
                stepNum={3}
                data={rows}
              />
            );
          });
        })()}

        <Section
          title="DOCUMENTS"
          stepNum={4}
          data={(() => {
            const docs = draft.step4?.documents ?? [];
            const idDoc = docs.find((d) => d.docType === 'ID_PROOF' && d.fileUrl && d.fileUrl !== 'placeholder-not-yet-wired');
            const farmDoc = docs.find((d) => d.docType === 'FARM_DOC' && d.fileUrl && d.fileUrl !== 'placeholder-not-yet-wired');
            const certDoc = docs.find((d) => d.docType === 'CERTIFICATE' && d.fileUrl);
            return [
              {
                label: 'ID proof',
                value: idDoc ? `✓ ${idDoc.fileName ?? 'Uploaded'}` : 'Not uploaded',
                highlight: !!idDoc,
              },
              {
                label: 'Farm docs',
                value: farmDoc ? `✓ ${farmDoc.fileName ?? 'Uploaded'}` : 'Not uploaded',
                highlight: !!farmDoc,
              },
              {
                label: 'Certification',
                value: certDoc ? `✓ ${certDoc.fileName ?? 'Uploaded'}` : 'Not provided',
                highlight: !!certDoc,
              },
            ];
          })()}

        />

        {/* Terms Confirmation Box */}
        <TouchableOpacity 
          activeOpacity={0.9} 
          style={[styles.termsBox, { backgroundColor: colors.brandGreenLight, borderColor: colors.brandGreen }]}
          onPress={() => setTermsAccepted(!termsAccepted)}
        >
          <View style={[styles.checkbox, { backgroundColor: termsAccepted ? colors.brandGreen : colors.white, borderColor: colors.brandGreen }]}>
            {termsAccepted && <Icon name="check" size={14} color={colors.white} />}
          </View>
          <Text style={[styles.termsText, { color: colors.textDark }]}>
            I confirm all information is accurate and agree to TOHFA's <Text style={{ textDecorationLine: 'underline', color: colors.brandGreen }}>Terms</Text> and <Text style={{ textDecorationLine: 'underline', color: colors.brandGreen }}>Privacy Policy</Text>
          </Text>
        </TouchableOpacity>

      </ScrollView>

      {/* FOOTER */}
      <View style={[styles.footer, { borderTopColor: colors.borderDivider, backgroundColor: colors.white }]}>
        <TouchableOpacity activeOpacity={0.85} style={[styles.footerBtn, styles.backButton, { borderColor: colors.brandGreen, backgroundColor: colors.white }]} onPress={onBack}>
          <Text style={[styles.footerBtnText, { color: colors.brandGreen }]}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.85} style={[styles.footerBtn, styles.nextButton, { backgroundColor: colors.brandGreen, opacity: submitting ? 0.7 : 1 }]} onPress={handleSubmit} disabled={submitting}>
          <Text style={[styles.footerBtnText, { color: colors.white }]}>{submitting ? 'Submitting...' : 'Submit'}</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 14, borderWidth: 0, borderBottomWidth: 1 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  backButtonCircle: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  backButtonArrow: { fontSize: 22, fontWeight: '700', marginTop: -2 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerSubtitle: { fontSize: 12 },
  progressRow: { flexDirection: 'row', gap: 6, marginTop: 14 },
  progressSegment: { flex: 1, height: 5, borderRadius: 3 },
  scrollArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  section: { borderWidth: 1.5, borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  editLink: { fontSize: 12, fontWeight: '700' },
  sectionRows: { gap: 8 },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dataLabel: { fontSize: 14 },
  dataValue: { fontSize: 14, fontWeight: '700' },
  termsBox: { flexDirection: 'row', borderWidth: 1.5, borderRadius: 12, padding: 16, marginBottom: 16, alignItems: 'flex-start', gap: 12 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  termsText: { flex: 1, fontSize: 13, lineHeight: 18 },
  footer: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24, borderTopWidth: 1, flexDirection: 'row', gap: 12 },
  footerBtn: { flex: 1, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  backButton: { borderWidth: 1.5 },
  nextButton: { borderWidth: 0 },
  footerBtnText: { fontSize: 16, fontWeight: '700', textAlign: 'center' }
});
