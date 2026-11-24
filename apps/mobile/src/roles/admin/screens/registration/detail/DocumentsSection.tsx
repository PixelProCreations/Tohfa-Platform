/**
 * 03 · KYC documents, in the 2026-11-19 design's card layout: a review-stage
 * line ("Documents Under Review" / "Documents Requested" / "All documents
 * verified"), then one card per document category, then the preview sheet.
 *
 * Everything on a card comes from the application:
 *   - the categories are `documentCategories(app)`, derived from the real
 *     `documents` array, never from the design's three fixed cards;
 *   - a category the applicant did not supply keeps its card and shows the
 *     "not available" dash with the reason, so the gap is visible;
 *   - the verification badge renders the dash, because the API reports no
 *     verification for an application's documents at all.
 *
 * Drawn as designed but disabled, each with its own note: "Mark verified"
 * (no verify endpoint or permission code exists for an application document —
 * the farmers module's is for a farmer, who does not exist until approval).
 * The design's dimmed demo plot card behind the sheet is not ported.
 */
import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { ApplicationDetailView, ApplicationDocumentView } from '../../../api/farmerTypes';
import { t, type TranslationKey } from '../../../i18n';
import { adminColors, adminOverlay, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import { StepHeader } from '../applications/ApplicationParts';
import { dayOrDash, documentTypeLabel, maskAadhaar, notAvailable, orDash } from '../applications/applicationLogic';
import { detailStyles } from './detailStyles';
import {
  documentCategories,
  documentReviewStage,
  documentVerificationState,
  type DocumentCategoryView,
} from './documentReview';
import { APPLICATION_STEP_COUNT, stepState } from './reviewFacts';

function DocumentIcon() {
  return (
    <Svg width={adminSpacing.largeSection} height={adminSpacing.largeSection} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z"
        stroke={adminColors.muted}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={adminColors.muted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MarkVerifiedButton({ style, textStyle }: { style: object; textStyle: object }) {
  // DESIGN-ONLY: no endpoint yet (application documents have no verify route or permission code).
  return (
    <TouchableOpacity
      style={[style, detailStyles.unavailable]}
      disabled
      accessibilityRole="button"
      accessibilityState={{ disabled: true }}
      accessibilityHint={t('farmerApps.doc.verifyUnavailable')}
      testID="farmerApps.markVerified"
    >
      <Text style={textStyle}>{t('farmerApps.doc.markVerified')}</Text>
    </TouchableOpacity>
  );
}

/**
 * The design's green Verified / amber Pending pill. Today it can only be the
 * dash: nothing in the application says a document was checked.
 */
function VerificationBadge({ app }: { app: ApplicationDetailView }) {
  const state = documentVerificationState(app);
  const style = state === 'verified' ? detailStyles.badgeVerified : state === 'pending' ? detailStyles.badgePending : detailStyles.badgeUnknown;
  const textStyle =
    state === 'verified' ? detailStyles.badgeVerifiedText : state === 'pending' ? detailStyles.badgePendingText : detailStyles.badgeUnknownText;
  const label =
    state === 'verified' ? t('farmerApps.doc.badge.verified') : state === 'pending' ? t('farmerApps.doc.badge.pending') : notAvailable();
  return (
    <View style={style} accessibilityHint={state === 'unknown' ? t('farmerApps.doc.verifyUnavailable') : undefined}>
      <Text style={textStyle}>{label}</Text>
    </View>
  );
}

/** The category title: the API's docType label, or the two derived categories' own names. */
function categoryLabel(category: DocumentCategoryView): string {
  if (category.key === 'FMB_SKETCH') return t('farmerApps.doc.category.FMB_SKETCH');
  if (category.key === 'BANK_DETAILS') return t('farmerApps.doc.category.BANK_DETAILS');
  return documentTypeLabel(category.key);
}

function documentSubline(document: ApplicationDocumentView, app: ApplicationDetailView): string {
  const submitted = t('farmerApps.doc.submitted', { date: dayOrDash(app.submittedAt) });
  // BR-33b: the identity proof shows the Aadhaar's last 4 digits only.
  const what =
    document.docType === 'ID_PROOF' && app.applicant.aadhaarLast4 !== null
      ? t('farmerApps.doc.aadhaar', { masked: maskAadhaar(app.applicant.aadhaarLast4) })
      : (document.docSubType ?? document.fileName);
  return what === null ? submitted : `${what} · ${submitted}`;
}

const REVIEW_STAGE_KEY: Record<ReturnType<typeof documentReviewStage>, TranslationKey | null> = {
  requested: 'farmerApps.doc.reviewStage.requested',
  allVerified: 'farmerApps.doc.reviewStage.allVerified',
  underReview: 'farmerApps.doc.reviewStage.underReview',
  unknown: null,
};

export interface DocumentsSectionProps {
  app: ApplicationDetailView;
  /** The pending review shows the Preview / Mark verified buttons; a decided one does not. */
  reviewing: boolean;
}

export function DocumentsSection({ app, reviewing }: DocumentsSectionProps) {
  const [preview, setPreview] = useState<ApplicationDocumentView | null>(null);
  const categories = documentCategories(app);
  const stageKey = REVIEW_STAGE_KEY[documentReviewStage(app)];

  return (
    <>
      <StepHeader
        label={t('farmerApps.section.documents')}
        step={4}
        total={APPLICATION_STEP_COUNT}
        state={stepState(app, 4)}
      />

      <View style={detailStyles.stageLine}>
        <Text style={detailStyles.stageLineLabel}>{t('farmerApps.doc.reviewStage.label')}</Text>
        <Text style={detailStyles.stageLineValue}>{stageKey === null ? notAvailable() : t(stageKey)}</Text>
      </View>
      {app.infoRequest === null || app.infoRequest.trim() === '' ? null : (
        <View style={detailStyles.infoBox}>
          <Text style={detailStyles.infoText}>{app.infoRequest}</Text>
        </View>
      )}

      <View style={detailStyles.docList}>
        {categories.map((category) => (
          <View key={category.key} style={detailStyles.docCard}>
            <View style={detailStyles.docHeaderRow}>
              <Text style={detailStyles.docTitle}>{categoryLabel(category)}</Text>
              {category.state === 'supplied' ? <VerificationBadge app={app} /> : null}
            </View>

            {category.state === 'supplied' ? (
              category.documents.map((document, index) => (
                <React.Fragment key={`${document.fileName ?? 'file'}-${index}`}>
                  <Text style={detailStyles.docSub}>{documentSubline(document, app)}</Text>
                  {/* The design prints a file name and a size; the name is real, the size is not reported at all. */}
                  <Text style={detailStyles.docSub}>
                    {`${t('farmerApps.doc.fileLabel')}: ${orDash(document.fileName)} · ${t('farmerApps.doc.sizeLabel')}: ${notAvailable()}`}
                  </Text>
                </React.Fragment>
              ))
            ) : (
              <Text style={detailStyles.docSub}>
                {`${notAvailable()} · ${t(category.emptyReasonKey ?? 'farmerApps.doc.notSupplied')}`}
              </Text>
            )}

            {reviewing && category.state === 'supplied' && category.documents.length > 0 ? (
              <View style={detailStyles.docButtonsRow}>
                <TouchableOpacity
                  style={detailStyles.outlineBtn}
                  onPress={() => setPreview(category.documents[0] ?? null)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  testID="farmerApps.preview"
                >
                  <Text style={detailStyles.outlineBtnText}>{t('farmerApps.doc.preview')}</Text>
                </TouchableOpacity>
                <MarkVerifiedButton style={detailStyles.filledBtn} textStyle={detailStyles.filledBtnText} />
              </View>
            ) : null}
          </View>
        ))}
      </View>

      {app.documents.length === 0 ? <Text style={detailStyles.caption}>{t('farmerApps.doc.none')}</Text> : null}
      {reviewing ? <Text style={detailStyles.caption}>{t('farmerApps.doc.verifyUnavailable')}</Text> : null}
      <Text style={detailStyles.caption}>{t('farmerApps.doc.sizeUnavailable')}</Text>

      <Modal visible={preview !== null} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{t('farmerApps.doc.previewTitle')}</Text>
            <View style={styles.fileBox}>
              <DocumentIcon />
              <Text style={styles.fileName}>{preview === null ? '' : documentTypeLabel(preview.docType)}</Text>
              <Text style={styles.fileSub}>{preview?.fileName ?? t('farmerApps.doc.noFile')}</Text>
            </View>
            <View style={styles.buttonsRow}>
              <MarkVerifiedButton style={detailStyles.filledBtn} textStyle={detailStyles.filledBtnText} />
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setPreview(null)}
                activeOpacity={0.8}
                accessibilityRole="button"
                testID="farmerApps.previewClose"
              >
                <Text style={styles.closeText}>{t('farmerApps.doc.close')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: adminOverlay.scrim, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: adminRadius.xl,
    borderTopRightRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.xl,
    paddingTop: adminSpacing.xl,
    paddingBottom: adminSpacing.xxxl,
    gap: adminSpacing.lg,
    ...adminShadow.lg,
  },
  sheetTitle: { ...adminType.sectionHead, color: adminColors.ink, textAlign: 'center' },
  fileBox: {
    backgroundColor: adminColors.warehouse.warmCanvas,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.sm,
  },
  fileName: { ...adminType.rowTitle, color: adminColors.ink },
  fileSub: { ...adminType.rowMeta, color: adminColors.muted },
  buttonsRow: { flexDirection: 'row', gap: adminSpacing.md },
  closeBtn: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { ...adminType.rowTitle, color: adminColors.ink },
});
