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
  adminSpacing,
  adminType,
} from '../../theme';
import { t } from '../../i18n';
import { adminErrorKey } from '../../api/errors';
import { useUpdateLearningArticle, useUpdateLearningTraining, useUpdateLearningVideo } from '../../api/learningHooks';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';
import {
  canManageLearning,
  contentDetailView,
  editRouteOf,
  dash,
  joinMeta,
  publishAction,
  type ContentDto,
  type ContentKind,
  type MetaRow,
} from './communityLogic';
import { useContentItem } from './useContentItem';
import { useReviewActions } from './useReviewActions';

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

// ─── Component Props ──────────────────────────────────────────────────────────

export interface ContentPendingReviewScreenProps {
  onBack: () => void;
  /** Receives the opened item (undefined if it has not loaded) so the edit form updates it. */
  onNavigateEditContent?: (content: ContentDto | undefined) => void;
  onPublishSuccess?: () => void;
  /** Which of the four Learning Hub resources was opened, and its id. */
  contentKind?: ContentKind | undefined;
  contentId?: string | undefined;
  /** docs/rbac.json codes the signed-in admin holds; absent means no fetch. */
  can?: ((code: string) => boolean) | undefined;
}

/**
 * The long metadata card for one content item (BR-59m).
 *
 * Nine of its designed rows name a concept docs/openapi.yaml's Learning Hub
 * does not have — related crops, farming types, season, reviewer (the API sends
 * a reviewer id, no name), expert verification, a published-on date, an expiry,
 * a visibility setting and a version counter. Every one of them is kept and
 * carries the dash. The status row is the PUBLISHED axis (isPublished, BR-59l)
 * and the review row beside it is the review axis (BR-59t): the two are
 * independent, so an item can be published and pending review at once.
 *
 * Version history has no resource, so the panel says so rather than claiming a
 * "Version 1: Created" the server never reported. The created date beside it is
 * real (createdAt); the actor is a dash, because no learning row records who
 * created it.
 *
 * The footer, same contract as ContentItemDetailScreen: Publish is the real
 * PATCH (BR-59d/BR-59l) and reads its own label from the item's `isPublished`,
 * so a published item offers Unpublish, whatever the review status. The screen's
 * namesake Pending button is the review control (BR-59t): for a reviewer it
 * opens the approve / reject choice, for anyone else it submits an unsubmitted
 * item or just states the status. It never reads or moves `isPublished`.
 */
export function ContentPendingReviewScreen({
  onBack,
  onNavigateEditContent,
  onPublishSuccess,
  contentKind,
  contentId,
  can,
}: ContentPendingReviewScreenProps) {
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

  const handlePublish = () => {
    const item = content.content;
    const next = publish.nextIsPublished;
    if (item === undefined || next === null || publishDisabled) return;
    const vars = { id: item.dto.id, body: { isPublished: next } };
    // Only a settled mutation reports anything: the alert and the parent's
    // callback are in onSuccess, and a failure renders publishError instead.
    const onSuccess = () => {
      Alert.alert(
        t('community.publish.success.title'),
        t(next ? 'community.publish.published' : 'community.publish.unpublished'),
      );
      if (onPublishSuccess) onPublishSuccess();
    };
    if (item.kind === 'video') updateVideo.mutate(vars, { onSuccess });
    else if (item.kind === 'training') updateTraining.mutate(vars, { onSuccess });
    else if (item.kind === 'article') updateArticle.mutate(vars, { onSuccess });
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Top Terracotta Header (Screenshot 3) ─── */}
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
          <Text style={styles.headerTitle} numberOfLines={1} testID="community.pendingReview.title">
            {view.title}
          </Text>
          {/* Edit Pencil Icon Button: redirects directly to Create Content with resumed details, no popup! */}
          <TouchableOpacity
            style={[styles.headerEditBtn, editDisabled && styles.actionUnavailable]}
            onPress={editDisabled ? undefined : () => onNavigateEditContent?.(content.content)}
            disabled={editDisabled}
            activeOpacity={0.8}
            accessibilityLabel="Edit content details"
            accessibilityRole="button"
            accessibilityState={{ disabled: editDisabled }}
            testID="community.pendingReview.edit"
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
        {/* ─── 15-Row Dotted Metadata Card (Matching Screenshot 3 Exactly) ─── */}
        <MetaCard rows={view.metaRows} />

        {/* ─── Description Section (Screenshot 3) ─── */}
        <Text style={styles.sectionHeading}>Description</Text>
        <Text style={styles.descriptionText}>{view.description}</Text>

        {/* ─── Video Section (Screenshot 3): only a video has one ─── */}
        {view.videoRows !== null ? (
          <>
            <Text style={styles.sectionHeading}>{t('community.section.video')}</Text>
            <MetaCard rows={view.videoRows} />
          </>
        ) : null}

        {/* ─── Version History Section (Screenshot 3) ─── */}
        <Text style={styles.sectionHeading}>Version history</Text>
        {/* createdAt is real; the actor beside it is not recorded anywhere. */}
        <Text style={styles.versionDate} testID="community.pendingReview.created">
          {joinMeta([view.createdText, dash()])}
        </Text>
        {!allowed ? (
          <AdminEmptyState title={t('community.denied.title')} subtitle={t('community.denied.subtitle')} />
        ) : content.isLoading ? (
          <AdminLoadingState />
        ) : content.error !== null && content.error !== undefined ? (
          <AdminErrorState error={content.error} onRetry={content.refetch} />
        ) : (
          <AdminEmptyState title={t('community.gap.versions.title')} />
        )}
      </ScrollView>

      {/* ─── Docked Bottom Actions (Screenshot 3: Pending + Publish + Cancel) ─── */}
      <View style={styles.dockedFooter}>
        {publish.noteKey !== null ? <Text style={styles.footerNote}>{t(publish.noteKey)}</Text> : null}
        {review.error !== null && review.error !== undefined ? (
          <Text style={styles.footerError} testID="community.pendingReview.reviewError">
            {t(adminErrorKey(review.error))}
          </Text>
        ) : null}
        {publishError !== null && publishError !== undefined ? (
          <Text style={styles.footerError} testID="community.pendingReview.publishError">
            {t(adminErrorKey(publishError))}
          </Text>
        ) : null}

        <View style={styles.footerActionsRow}>
          <TouchableOpacity
            style={[styles.pendingSolidBtn, review.disabled && styles.actionUnavailable]}
            onPress={review.disabled ? undefined : review.onPress}
            disabled={review.disabled}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ disabled: review.disabled, busy: review.isPending }}
            testID="community.pendingReview.pending"
          >
            <Text style={styles.pendingSolidBtnText}>{review.isPending ? t('community.action.saving') : t(review.action.labelKey)}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryOutlineBtn, publishDisabled && styles.actionUnavailable]}
            onPress={handlePublish}
            disabled={publishDisabled}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ disabled: publishDisabled, busy: isPublishing }}
            testID="community.pendingReview.publish"
          >
            <Text style={styles.primaryOutlineBtnText}>
              {isPublishing ? t('community.action.saving') : t(publish.labelKey)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onBack}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
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

  // ─── Version History ───
  versionDate: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
    marginBottom: 2,
  },
  versionTitle: {
    ...adminType.body,
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.ink,
  },

  // ─── Docked Footer (Screenshot 3) ───
  dockedFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: adminColors.canvas,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 12,
    // A column so the notes and the server's failure sit above the designed
    // row of buttons, which keeps its own layout unchanged.
    flexDirection: 'column',
    gap: 6,
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
  pendingSolidBtn: {
    flex: 1,
    height: 46,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingSolidBtnText: {
    color: adminColors.onBrand,
    fontSize: 14,
    fontWeight: '700',
  },
  primaryOutlineBtn: {
    flex: 1,
    height: 46,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryOutlineBtnText: {
    color: adminColors.brand,
    fontSize: 14,
    fontWeight: '700',
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
});
