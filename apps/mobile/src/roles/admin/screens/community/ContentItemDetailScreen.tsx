import React from 'react';
import {
  Alert,
ScrollView,
StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, ScreenStatusBar } from '@tohfa/mobile-ui';
import Svg, { Path } from 'react-native-svg';
import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import { t } from '../../i18n';
import { adminErrorKey } from '../../api/errors';
import { useUpdateLearningArticle, useUpdateLearningTraining, useUpdateLearningVideo } from '../../api/learningHooks';
import { useAdminQaQuestions } from '../../api/qaHooks';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';
import {
  canManageLearning,
  contentDetailView,
  editRouteOf,
  publishAction,
  type ContentDto,
  type ContentKind,
  type MetaRow,
} from './communityLogic';
import { useContentItem } from './useContentItem';
import { useReviewActions } from './useReviewActions';
import { contentTypeOf } from './reviewLogic';
import { questionRow } from './qaLogic';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowWhiteIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PencilEditIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Metadata card ────────────────────────────────────────────────────────────

/** The designed dotted card. Every row is drawn, dash included. */
function MetaCard({ rows }: { rows: readonly MetaRow[] }) {
  return (
    <View style={styles.metaCard}>
      {rows.map((row, index) => (
        <React.Fragment key={row.labelKey}>
          {index > 0 ? <View style={styles.dottedDivider} /> : null}
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>{t(row.labelKey)}</Text>
            <Text style={styles.metaValueBold} numberOfLines={1}>
              {row.value}
            </Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

// ─── Component Props ──────────────────────────────────────────────────────────

export interface ContentItemDetailScreenProps {
  onBack: () => void;
  role?: string | undefined;
  /** Opens a Q&A thread; the id is the question to show, absent when there is none to open. */
  onNavigateChat?: (questionId?: string) => void;
  onNavigateMessages?: () => void;
  /** Receives the opened item (undefined if it has not loaded) so the edit form updates it. */
  onNavigateEditContent?: (content: ContentDto | undefined) => void;
  /** Which of the four Learning Hub resources was opened, and its id. */
  contentKind?: ContentKind | undefined;
  contentId?: string | undefined;
  /** docs/rbac.json codes the signed-in admin holds; absent means no fetch. */
  can?: ((code: string) => boolean) | undefined;
}

/**
 * One content item (BR-59m), read from whichever of the four resources the
 * library row came from.
 *
 * The designed metadata rows that no Learning Hub field answers stay and carry
 * the dash: there is no publishedAt (isPublished is a flag, not a date), no
 * expiry, no visibility setting, and no upload pipeline to report "Processing"
 * for — a video is a URL. `duration` is free text and is shown exactly as
 * stored. "Featured" is real, but only for a video.
 *
 * The Replies panel is the Q&A questions asked about this item (BR-59u,
 * GET /admin/qa/questions?contentType&contentId); a row opens its thread.
 *
 * The footer: Publish is the real PATCH (BR-59d/BR-59l) and reads its own label
 * from the item's `isPublished`, so a published item offers Unpublish. The
 * review button (BR-59t) is a separate axis: it submits the item for review or,
 * for a reviewer, records the decision, and never reads or moves `isPublished`.
 * Publishing is not blocked by review state, and a published item can be
 * pending review at the same time. For an administrator with no designed slot
 * for it (the non-Super-Admin footer), the button appears only when there is
 * something to send.
 */
export function ContentItemDetailScreen({
  onBack,
  role,
  onNavigateChat,
  onNavigateMessages,
  onNavigateEditContent,
  contentKind,
  contentId,
  can,
}: ContentItemDetailScreenProps) {
  const allowed = canManageLearning(can);
  const content = useContentItem(contentKind, contentId, allowed);
  // Edit needs an opened item whose kind has an edit form; otherwise it would
  // open a blank form and Save there would create a duplicate.
  const editDisabled = !allowed || contentId === undefined || editRouteOf(contentKind) === null;
  const view = contentDetailView(content.content);

  // One PATCH hook per resource that has an `isPublished` to move. All three
  // are created every render (hooks cannot be conditional); only the one
  // matching the opened item is ever fired. A group has no published state, so
  // it has no hook here — publishAction disables the button for it.
  const updateArticle = useUpdateLearningArticle();
  const updateVideo = useUpdateLearningVideo();
  const updateTraining = useUpdateLearningTraining();
  const publish = publishAction(content.content);
  const isPublishing = updateArticle.isPending || updateVideo.isPending || updateTraining.isPending;
  const publishError = updateArticle.error ?? updateVideo.error ?? updateTraining.error;
  const publishDisabled = publish.disabled || isPublishing || !allowed;
  const review = useReviewActions(content.content, can);
  // The questions asked about this item; the QA list needs the learning permission.
  const replies = useAdminQaQuestions(
    contentKind === undefined || contentId === undefined ? {} : { contentType: contentTypeOf(contentKind), contentId },
    { enabled: allowed && contentKind !== undefined && contentId !== undefined },
  );
  const replyRows = replies.items.map(questionRow);
  const firstQuestionId = replyRows[0]?.id;

  const handlePublish = () => {
    const item = content.content;
    const next = publish.nextIsPublished;
    if (item === undefined || next === null || publishDisabled) return;
    const vars = { id: item.dto.id, body: { isPublished: next } };
    // Only a settled mutation reports anything: the alert is in onSuccess, and
    // a failure renders publishError instead.
    const onSuccess = () => {
      Alert.alert(
        t('community.publish.success.title'),
        t(next ? 'community.publish.published' : 'community.publish.unpublished'),
      );
    };
    if (item.kind === 'video') updateVideo.mutate(vars, { onSuccess });
    else if (item.kind === 'training') updateTraining.mutate(vars, { onSuccess });
    else if (item.kind === 'article') updateArticle.mutate(vars, { onSuccess });
  };

  const footerNoteKey = publish.noteKey;

  const handleOpenChat = (questionId?: string) => {
    if (onNavigateChat) onNavigateChat(questionId);
    else if (onNavigateMessages) onNavigateMessages();
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Top Terracotta Header (Screenshot 1) ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <BackArrowWhiteIcon size={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1} testID="community.contentItem.title">
            {view.title}
          </Text>
          {/* Edit Pencil Icon Button: redirects directly to Create Content with resumed details (No popup!) */}
          <TouchableOpacity
            style={[styles.headerEditBtn, editDisabled && styles.actionUnavailable]}
            onPress={editDisabled ? undefined : () => onNavigateEditContent?.(content.content)}
            disabled={editDisabled}
            activeOpacity={0.8}
            accessibilityLabel="Edit content details"
            accessibilityRole="button"
            accessibilityState={{ disabled: editDisabled }}
            testID="community.contentItem.edit"
          >
            <PencilEditIcon size={18} color={adminColors.onBrand} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Metadata Card (Matching Screenshot 1 top visible rows) ─── */}
        <MetaCard rows={view.shortMetaRows} />

        {/* ─── Description Section (Screenshot 1) ─── */}
        <Text style={styles.sectionHeading}>Description</Text>
        <Text style={styles.descriptionText}>{view.description}</Text>

        {/* ─── Article body: the full content, which only an article has ─── */}
        {view.body !== null ? (
          <>
            <Text style={styles.sectionHeading}>{t('community.section.body')}</Text>
            <Text style={styles.descriptionText} testID="community.contentItem.body">
              {view.body}
            </Text>
          </>
        ) : null}

        {/* ─── Video Section (Screenshot 1): drawn only for a video ─── */}
        {view.videoRows !== null ? (
          <>
            <Text style={styles.sectionHeading}>{t('community.section.video')}</Text>
            <MetaCard rows={view.videoRows} />
          </>
        ) : null}

        {/* ─── Replies Section (Screenshot 1) ─── */}
        <Text style={styles.sectionHeading}>Replies</Text>
        <View style={styles.repliesList}>
          {!allowed ? (
            <AdminEmptyState title={t('community.denied.title')} subtitle={t('community.denied.subtitle')} />
          ) : content.isLoading || (replyRows.length === 0 && replies.isLoading) ? (
            <AdminLoadingState />
          ) : content.error !== null && content.error !== undefined ? (
            <AdminErrorState error={content.error} onRetry={content.refetch} />
          ) : replyRows.length === 0 && replies.error !== null && replies.error !== undefined ? (
            <AdminErrorState error={replies.error} onRetry={replies.refresh} />
          ) : replyRows.length === 0 ? (
            <AdminEmptyState title={t('community.empty.replies')} />
          ) : (
            replyRows.map((row) => (
              <TouchableOpacity
                key={row.id}
                style={styles.replyCard}
                onPress={() => handleOpenChat(row.id)}
                activeOpacity={0.7}
                testID={`community.contentItem.reply.${row.id}`}
              >
                <View style={styles.replyHeaderRow}>
                  <Text style={styles.replySender}>{row.sender}</Text>
                  {row.replied ? (
                    <View style={styles.repliedBadge}>
                      <Text style={styles.repliedBadgeText}>{t('community.replies.replied')}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.replyPreview} numberOfLines={2}>
                  {row.title}
                </Text>
                <Text style={styles.replyTimestamp}>{row.timestamp}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* ─── Docked Bottom Actions (Super Admin Image 3: Approval + Publish + Cancel) ─── */}
      {role === 'SUPER_ADMIN' ? (
        <View style={styles.dockedFooterTriple}>
          {footerNoteKey !== null ? <Text style={styles.footerNote}>{t(footerNoteKey)}</Text> : null}
          {review.error !== null && review.error !== undefined ? (
            <Text style={styles.footerError} testID="community.contentItem.reviewError">
              {t(adminErrorKey(review.error))}
            </Text>
          ) : null}
          {publishError !== null && publishError !== undefined ? (
            <Text style={styles.footerError} testID="community.contentItem.publishError">
              {t(adminErrorKey(publishError))}
            </Text>
          ) : null}

          <View style={styles.footerActionsRow}>
            <TouchableOpacity
              style={[styles.approvalSolidBtn, review.disabled && styles.actionUnavailable]}
              onPress={review.disabled ? undefined : review.onPress}
              disabled={review.disabled}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ disabled: review.disabled, busy: review.isPending }}
              testID="community.contentItem.approval"
            >
              <Text style={styles.approvalSolidBtnText}>{review.isPending ? t('community.action.saving') : t(review.action.labelKey)}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.publishOutlineBtn, publishDisabled && styles.actionUnavailable]}
              onPress={handlePublish}
              disabled={publishDisabled}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ disabled: publishDisabled, busy: isPublishing }}
              testID="community.contentItem.publish"
            >
              <Text style={styles.publishOutlineBtnText}>
                {isPublishing ? t('community.action.saving') : t(publish.labelKey)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelOutlineBtn}
              onPress={onBack}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelOutlineBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.dockedFooter}>
          <TouchableOpacity
            style={[styles.primarySolidBtn, firstQuestionId === undefined && onNavigateMessages === undefined && styles.actionUnavailable]}
            onPress={
              firstQuestionId === undefined && onNavigateMessages === undefined ? undefined : () => handleOpenChat(firstQuestionId)
            }
            disabled={firstQuestionId === undefined && onNavigateMessages === undefined}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ disabled: firstQuestionId === undefined && onNavigateMessages === undefined }}
            testID="community.contentItem.viewChat"
          >
            <Text style={styles.primarySolidBtnText}>View chat</Text>
          </TouchableOpacity>
          {review.action.kind !== 'none' ? (
            <TouchableOpacity
              style={[styles.publishOutlineBtn, review.disabled && styles.actionUnavailable]}
              onPress={review.disabled ? undefined : review.onPress}
              disabled={review.disabled}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ disabled: review.disabled, busy: review.isPending }}
              testID="community.contentItem.approval"
            >
              <Text style={styles.publishOutlineBtnText}>{review.isPending ? t('community.action.saving') : t(review.action.labelKey)}</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onBack}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Stylesheet ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },

  // ─── Header ───
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    flex: 1,
    color: adminColors.onBrand,
    fontSize: 18,
    fontWeight: '800',
  },
  headerEditBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: adminColors.brandDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── Scroll Area ───
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: 90,
  },

  // ─── Meta Card ───
  metaCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
  },
  metaLabel: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
  },
  metaValueBold: {
    ...adminType.body,
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.ink,
  },
  dottedDivider: {
    height: 1,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderStyle: 'dashed',
    marginVertical: 1,
  },

  // ─── Section Headings ───
  sectionHeading: {
    ...adminType.title,
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginTop: 12,
    marginBottom: 8,
  },
  descriptionText: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
    lineHeight: 19,
    marginBottom: 6,
  },

  // ─── Replies List ───
  repliesList: {
    gap: 10,
    marginBottom: 16,
  },
  replyCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  replyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  replySender: {
    ...adminType.body,
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.ink,
  },
  unreadBadge: {
    backgroundColor: adminColors.warning.bg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: adminRadius.full,
  },
  unreadBadgeText: {
    color: adminColors.warning.text,
    fontSize: 11,
    fontWeight: '700',
  },
  repliedBadge: {
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: adminRadius.full,
  },
  repliedBadgeText: {
    color: adminColors.success.text,
    fontSize: 11,
    fontWeight: '700',
  },
  replyPreview: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
    marginTop: 6,
    lineHeight: 18,
  },
  replyTimestamp: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    marginTop: 6,
  },

  // ─── Docked Footer (Screenshot 1: View chat + Cancel) ───
  dockedFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: adminColors.canvas,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    flexDirection: 'row',
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 12,
    gap: 10,
  },
  primarySolidBtn: {
    flex: 2,
    height: 46,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primarySolidBtnText: {
    color: adminColors.onBrand,
    fontSize: 14,
    fontWeight: '800',
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: adminColors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  dockedFooterTriple: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 12,
    // A column so the notes and the server's failure sit above the designed
    // row of buttons, which keeps its own layout unchanged.
    flexDirection: 'column',
    gap: 6,
    ...adminShadow.md,
  },
  footerActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  footerNote: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  footerError: {
    ...adminType.caption,
    color: adminColors.danger.text,
    fontWeight: '700',
  },
  /** The designed button, kept visible, drawn as unavailable. */
  actionUnavailable: {
    opacity: 0.5,
  },
  approvalSolidBtn: {
    flex: 1.2,
    height: 46,
    borderRadius: adminRadius.lg,
    backgroundColor: adminColors.success.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approvalSolidBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  publishOutlineBtn: {
    flex: 1.2,
    height: 46,
    borderRadius: adminRadius.lg,
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishOutlineBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brand,
    fontWeight: '700',
  },
  cancelOutlineBtn: {
    flex: 1,
    height: 46,
    borderRadius: adminRadius.lg,
    backgroundColor: adminColors.card,
    borderWidth: 1.2,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelOutlineBtnText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontWeight: '600',
  },
});
