/**
 * 03 · KYC documents: one card per document the applicant uploaded (step 4),
 * with the design's Preview sheet.
 *
 * Not from the API, so not shown as data: the per-document Verified/Pending
 * badge (no verification status exists for application documents) and the
 * design's "2 more documents ... proposed list, to confirm" caption. "Mark
 * verified" is drawn as designed but disabled: there is no endpoint (or
 * permission code) for verifying an application document yet.
 * The design's dimmed demo plot card behind the sheet is not ported.
 */
import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { ApplicationDetailView, ApplicationDocumentView } from '../../../api/farmerTypes';
import { t } from '../../../i18n';
import { adminColors, adminOverlay, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import { SectionHeading } from '../applications/ApplicationParts';
import { dayOrDash, documentTypeLabel, maskAadhaar } from '../applications/applicationLogic';
import { detailStyles } from './detailStyles';

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

function documentSubline(doc: ApplicationDocumentView, app: ApplicationDetailView): string {
  const submitted = t('farmerApps.doc.submitted', { date: dayOrDash(app.submittedAt) });
  // BR-33b: the identity proof shows the Aadhaar's last 4 digits only.
  const what =
    doc.docType === 'ID_PROOF' && app.applicant.aadhaarLast4 !== null
      ? t('farmerApps.doc.aadhaar', { masked: maskAadhaar(app.applicant.aadhaarLast4) })
      : (doc.docSubType ?? doc.fileName);
  return what === null ? submitted : `${what} · ${submitted}`;
}

export interface DocumentsSectionProps {
  app: ApplicationDetailView;
  /** The pending review shows the Preview / Mark verified buttons; a decided one does not. */
  reviewing: boolean;
}

export function DocumentsSection({ app, reviewing }: DocumentsSectionProps) {
  const [preview, setPreview] = useState<ApplicationDocumentView | null>(null);
  const { documents } = app;

  return (
    <>
      <SectionHeading label={t('farmerApps.section.documents')} />
      {documents.length === 0 ? (
        <View style={detailStyles.docCard}>
          <Text style={detailStyles.docSub}>{t('farmerApps.doc.none')}</Text>
        </View>
      ) : (
        <View style={detailStyles.docList}>
          {documents.map((doc, index) => (
            <View key={`${doc.docType ?? 'doc'}-${index}`} style={detailStyles.docCard}>
              <View style={detailStyles.docHeaderRow}>
                <Text style={detailStyles.docTitle}>{documentTypeLabel(doc.docType)}</Text>
              </View>
              <Text style={detailStyles.docSub}>{documentSubline(doc, app)}</Text>
              {reviewing ? (
                <View style={detailStyles.docButtonsRow}>
                  <TouchableOpacity
                    style={detailStyles.outlineBtn}
                    onPress={() => setPreview(doc)}
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
      )}
      {reviewing && documents.length > 0 ? <Text style={detailStyles.caption}>{t('farmerApps.doc.verifyUnavailable')}</Text> : null}

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
  sheetTitle: { ...adminType.sectionHead, color: adminColors.ink },
  fileBox: {
    backgroundColor: adminColors.canvas,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.xl,
    paddingVertical: adminSpacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.xsSm,
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
