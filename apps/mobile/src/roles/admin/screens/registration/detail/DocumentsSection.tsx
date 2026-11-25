/**
 * 04 · KYC & Farm Documents (step 4 of 5), wired to
 * POST /admin/farmer-applications/{id}/documents/{documentKey}/review (BR-215).
 */
import React, { useState } from 'react';
import { Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { REJECT_REASON_MAX, REJECT_REASON_MIN } from '../../../api/farmerApplications';
import { useReviewApplicationDocument } from '../../../api/farmerHooks';
import type { ApplicationDetailView, ApplicationDocumentView } from '../../../api/farmerTypes';
import { t, type TranslationKey } from '../../../i18n';
import { adminColors } from '../../../theme';
import { ADMIN_NO_VALUE } from '../../../utils/noValue';
import { CheckCircleIcon, DocumentPdfIcon, StepHeader } from '../applications/ApplicationParts';
import { applicationErrorKey, documentTypeLabel, orDash, rejectReasonMessage, validateRejectReason } from '../applications/applicationLogic';
import { SP } from '../designMetrics';
import { detailStyles } from './detailStyles';
import { documentCards, type DocumentCardView } from './documentReview';
import { APPLICATION_STEP_COUNT } from './reviewFacts';

const CARD_TITLE: Record<string, TranslationKey> = {
  ID_PROOF: 'farmerApps.doc.card.ID_PROOF',
  FARM_DOC: 'farmerApps.doc.card.FARM_DOC',
  CERTIFICATE: 'farmerApps.doc.card.CERTIFICATE',
};

function cardTitle(key: string): string {
  const titleKey = CARD_TITLE[key];
  return titleKey === undefined ? documentTypeLabel(key) : t(titleKey);
}

function fileNames(documents: readonly ApplicationDocumentView[]): string {
  return orDash(
    documents
      .map((d) => d.fileName)
      .filter((n): n is string => n !== null)
      .join(', '),
  );
}

/** "FILE.PDF" -> "PDF"; the dash when the name carries no extension. */
function fileFormat(fileName: string | null): string {
  const match = fileName === null ? null : /\.([A-Za-z0-9]{1,6})$/.exec(fileName);
  return match === null || match[1] === undefined ? ADMIN_NO_VALUE : match[1].toUpperCase();
}

function DocumentCard({
  card,
  canVerify,
  isReviewable,
  isPending,
  onPreview,
  onVerify,
  onReject,
}: {
  card: DocumentCardView;
  canVerify: boolean;
  isReviewable: boolean;
  isPending: boolean;
  onPreview: () => void;
  onVerify: (documentKey: string) => void;
  onReject: (doc: ApplicationDocumentView, title: string) => void;
}) {
  const primary = card.documents[0];
  const supplied = card.documents.length > 0;
  const isCertificate = card.key === 'CERTIFICATE';
  const reviewStatus = primary?.review?.status;
  const verified = reviewStatus === 'VERIFIED';
  const rejected = reviewStatus === 'REJECTED';
  const green = verified || (isCertificate && supplied && !rejected);
  const badgeLabel = !supplied
    ? t('farmerApps.doc.badge.notProvided')
    : verified
      ? t('farmerApps.doc.badge.verified')
      : rejected
        ? t('farmerApps.doc.badge.rejected')
        : reviewStatus === 'PENDING'
          ? t('farmerApps.doc.badge.pending')
          : isCertificate
            ? t('farmerApps.doc.badge.provided')
            : ADMIN_NO_VALUE;
  const badgeStyle = green
    ? detailStyles.badgeVerified
    : rejected
      ? detailStyles.badgeRejected
      : detailStyles.badgePending;
  const badgeTextStyle = green
    ? detailStyles.badgeVerifiedText
    : rejected
      ? detailStyles.badgeRejectedText
      : detailStyles.badgePendingText;
  const fileLine = supplied
    ? t('farmerApps.doc.fileLine', { name: fileNames(card.documents), size: ADMIN_NO_VALUE })
    : t('farmerApps.doc.notSupplied');
  const documentKey = primary?.documentKey ?? null;
  const canAct = canVerify && isReviewable && supplied && documentKey !== null && !isPending;
  const canMarkVerified = canAct && !verified;

  return (
    <View style={detailStyles.docActionCard} testID={`farmerApps.docCard.${card.key}`}>
      <View style={detailStyles.docHeaderRow}>
        <View style={detailStyles.docIconTitleRow}>
          <CheckCircleIcon
            size={SP.s20}
            color={green ? adminColors.success.text : rejected ? adminColors.danger.text : adminColors.warning.text}
          />
          <View style={detailStyles.docTitleBox}>
            <Text style={detailStyles.docTitle}>{cardTitle(card.key)}</Text>
            <Text style={detailStyles.docSub}>{fileLine}</Text>
            {rejected && primary?.review?.reason ? (
              <Text style={detailStyles.docRejectReasonText}>{primary.review.reason}</Text>
            ) : null}
          </View>
        </View>
        <View style={badgeStyle}>
          <Text style={badgeTextStyle}>{badgeLabel}</Text>
        </View>
      </View>

      <View style={detailStyles.docButtonsRow}>
        <TouchableOpacity
          style={[detailStyles.previewBtn, supplied ? null : detailStyles.actionUnavailable]}
          onPress={supplied ? onPreview : undefined}
          disabled={!supplied}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityState={{ disabled: !supplied }}
          testID="farmerApps.preview"
        >
          <Text style={detailStyles.previewBtnText}>
            {isCertificate ? t('farmerApps.doc.previewCertificate') : t('farmerApps.doc.preview')}
          </Text>
        </TouchableOpacity>
        {isCertificate && !supplied ? null : (
          <>
            <TouchableOpacity
              style={[detailStyles.markVerifiedBtn, canMarkVerified ? null : detailStyles.actionUnavailable]}
              onPress={canMarkVerified && documentKey !== null ? () => onVerify(documentKey) : undefined}
              disabled={!canMarkVerified}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canMarkVerified }}
              accessibilityHint={!canVerify ? t('farmerApps.doc.permissionDenied') : undefined}
              testID={`farmerApps.markVerified.${card.key}`}
            >
              <Text style={detailStyles.markVerifiedBtnText}>
                {verified ? t('farmerApps.doc.badge.verified') : t('farmerApps.doc.markVerified')}
              </Text>
            </TouchableOpacity>
            {supplied ? (
              <TouchableOpacity
                style={[detailStyles.docRejectBtn, canAct ? null : detailStyles.actionUnavailable]}
                onPress={canAct && primary !== undefined ? () => onReject(primary, cardTitle(card.key)) : undefined}
                disabled={!canAct}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ disabled: !canAct }}
                accessibilityHint={!canVerify ? t('farmerApps.doc.permissionDenied') : undefined}
                testID={`farmerApps.rejectDoc.${card.key}`}
              >
                <Text style={detailStyles.docRejectBtnText}>{t('farmerApps.doc.rejectDoc')}</Text>
              </TouchableOpacity>
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}

export interface DocumentsSectionProps {
  app: ApplicationDetailView;
  applicationId?: string | undefined;
  canVerifyDocument?: boolean | undefined;
}

export function DocumentsSection({
  app,
  applicationId,
  canVerifyDocument = false,
}: DocumentsSectionProps) {
  const [preview, setPreview] = useState<DocumentCardView | null>(null);
  const [rejectTarget, setRejectTarget] = useState<{ doc: ApplicationDocumentView; title: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectProblem, setRejectProblem] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const reviewDoc = useReviewApplicationDocument(canVerifyDocument ? (applicationId ?? app.id) : undefined);
  const isReviewable = !app.isDraft && (app.status === 'DOCS_REVIEW' || app.status === 'FARM_VERIFICATION');

  const handleVerify = (documentKey: string) => {
    if (!canVerifyDocument || !isReviewable || reviewDoc.isPending) return;
    setFeedback(null);
    reviewDoc.run({ documentKey, decision: 'VERIFIED' }, () => {
      reviewDoc.finish();
      setFeedback(t('farmerApps.doc.verifiedSuccess'));
      setPreview(null);
    });
  };

  const openReject = (doc: ApplicationDocumentView, title: string) => {
    if (!canVerifyDocument || !isReviewable) return;
    setFeedback(null);
    setRejectReason('');
    setRejectProblem(null);
    setRejectTarget({ doc, title });
  };

  const confirmReject = () => {
    const documentKey = rejectTarget?.doc.documentKey;
    if (!canVerifyDocument || !isReviewable || !documentKey || reviewDoc.isPending) return;
    const problem = validateRejectReason(rejectReason);
    if (problem !== null) {
      setRejectProblem(rejectReasonMessage(problem));
      return;
    }
    setRejectProblem(null);
    reviewDoc.run({ documentKey, decision: 'REJECTED', reason: rejectReason.trim() }, () => {
      reviewDoc.finish();
      setRejectTarget(null);
      setRejectReason('');
      setFeedback(t('farmerApps.doc.rejectedSuccess'));
      setPreview(null);
    });
  };

  const previewDoc = preview?.documents[0] ?? null;
  const previewKey = previewDoc?.documentKey ?? null;
  const canVerifyPreview = Boolean(
    canVerifyDocument && isReviewable && previewKey && previewDoc?.review?.status !== 'VERIFIED' && !reviewDoc.isPending,
  );

  return (
    <>
      <StepHeader
        label={t('farmerApps.section.documents')}
        step={4}
        total={APPLICATION_STEP_COUNT}
      />

      {documentCards(app).map((card) => (
        <DocumentCard
          key={card.key}
          card={card}
          canVerify={canVerifyDocument}
          isReviewable={isReviewable}
          isPending={reviewDoc.isPending}
          onPreview={() => setPreview(card)}
          onVerify={handleVerify}
          onReject={openReject}
        />
      ))}

      {feedback !== null ? <Text style={detailStyles.inlineSuccessText}>{feedback}</Text> : null}
      {reviewDoc.error !== null && reviewDoc.error !== undefined ? (
        <Text style={detailStyles.inlineErrorText}>{t(applicationErrorKey(reviewDoc.error))}</Text>
      ) : null}

      {preview === null ? null : (
        <Modal visible transparent animationType="fade" onRequestClose={() => setPreview(null)}>
          <View style={detailStyles.modalBackdrop}>
            <View style={detailStyles.bottomSheet}>
              <Text style={detailStyles.bottomSheetTitle}>
                {cardTitle(preview.key)}
              </Text>

              <View style={detailStyles.docPreviewFileBox}>
                <DocumentPdfIcon color={adminColors.muted} />
                <Text style={detailStyles.docPreviewFileName}>
                  {previewDoc?.fileName ?? t('farmerApps.doc.noFile')}
                </Text>
                <Text style={detailStyles.docPreviewFileSub}>
                  {t('farmerApps.doc.fileMeta', {
                    size: ADMIN_NO_VALUE,
                    format: fileFormat(previewDoc?.fileName ?? null),
                  })}
                </Text>
              </View>

              <View style={detailStyles.modalButtonsRow}>
                <TouchableOpacity
                  style={[detailStyles.modalMarkVerifiedBtn, canVerifyPreview ? null : detailStyles.actionUnavailable]}
                  onPress={canVerifyPreview && previewKey !== null ? () => handleVerify(previewKey) : undefined}
                  disabled={!canVerifyPreview}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !canVerifyPreview }}
                  testID={`farmerApps.markVerified.preview.${preview.key}`}
                >
                  <Text style={detailStyles.modalMarkVerifiedBtnText}>{t('farmerApps.doc.markVerified')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={detailStyles.modalCloseBtn}
                  onPress={() => setPreview(null)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  testID="farmerApps.previewClose"
                >
                  <Text style={detailStyles.modalCloseBtnText}>{t('farmerApps.doc.close')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {rejectTarget === null ? null : (
        <Modal visible transparent animationType="fade" onRequestClose={() => setRejectTarget(null)}>
          <View style={detailStyles.modalBackdrop}>
            <View style={detailStyles.bottomSheet}>
              <Text style={detailStyles.bottomSheetTitle}>
                {t('farmerApps.doc.rejectTitle', { title: rejectTarget.title })}
              </Text>
              <TextInput
                style={detailStyles.notesInput}
                placeholder={t('farmerApps.doc.rejectPlaceholder')}
                placeholderTextColor={adminColors.muted}
                multiline
                maxLength={REJECT_REASON_MAX}
                value={rejectReason}
                onChangeText={(text) => {
                  setRejectReason(text);
                  if (rejectProblem !== null && text.trim().length >= REJECT_REASON_MIN) setRejectProblem(null);
                }}
                testID="farmerApps.docRejectReasonInput"
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
                  style={[detailStyles.modalMarkVerifiedBtn, reviewDoc.isPending ? detailStyles.actionUnavailable : null]}
                  onPress={confirmReject}
                  disabled={reviewDoc.isPending}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  testID="farmerApps.docRejectConfirm"
                >
                  <Text style={detailStyles.modalMarkVerifiedBtnText}>{t('farmerApps.doc.rejectConfirm')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}
