import React, { useState } from 'react';
import {
  Alert,
  Modal,
TextInput,
  ScrollView,
StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, ScreenStatusBar } from '@tohfa/mobile-ui';
import Svg, {
  ClipPath,
  Defs,
  G,
  Path,
  Rect,
} from 'react-native-svg';
import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import { useLearningArticle, useUpdateLearningArticle } from '../../api/learningHooks';
import { adminErrorKey } from '../../api/errors';
import { t, type TranslationKey } from '../../i18n';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';
import { queryViewState } from '../warehouse/shared/queryViewState';
import { articleDetailView, canManageLearning, dash } from './communityLogic';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowWhiteIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SendArrowIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M22 2L11 13" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M22 2L15 22L11 13L2 9L22 2Z" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Grass & Mulch field banner illustration matching Screenshot 1 right */
function FieldLandscapeBanner() {
  return (
    <Svg width="100%" height={110} viewBox="0 0 340 110" preserveAspectRatio="none">
      <Defs>
        <ClipPath id="bannerClip">
          <Rect width="340" height="110" rx="14" />
        </ClipPath>
      </Defs>
      <G clipPath="url(#bannerClip)">
        {/* Soft sunshine background */}
        <Rect width="340" height="110" fill={adminColors.warning.bg} opacity="0.6" />
        <Rect width="340" height="60" fill={adminColors.success.bg} opacity="0.4" />
        {/* Grass stalks and mulch texture */}
        <Path d="M-10 110 Q 40 40, 90 110 T 190 110 T 290 110 T 360 110" fill={adminColors.success.text} opacity="0.6" />
        <Path d="M20 110 Q 60 20, 80 110" stroke={adminColors.success.text} strokeWidth="2.5" fill="none" />
        <Path d="M45 110 Q 75 10, 110 110" stroke={adminColors.success.text} strokeWidth="3" fill="none" />
        <Path d="M130 110 Q 150 15, 170 110" stroke={adminColors.brandDeep} strokeWidth="2.2" fill="none" opacity="0.7" />
        <Path d="M180 110 Q 210 25, 230 110" stroke={adminColors.success.text} strokeWidth="2.8" fill="none" />
        <Path d="M250 110 Q 280 15, 310 110" stroke={adminColors.success.text} strokeWidth="3" fill="none" />
        <Path d="M290 110 Q 320 30, 345 110" stroke={adminColors.brandDeep} strokeWidth="2" fill="none" opacity="0.7" />
        {/* Straw mulch bits */}
        <Path d="M10 95 L 60 88 M 80 98 L 130 92 M 150 94 L 210 89 M 230 96 L 290 91" stroke={adminColors.warning.text} strokeWidth="2" opacity="0.7" />
      </G>
    </Svg>
  );
}


function PencilWhiteIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Component Props ──────────────────────────────────────────────────────────

export interface ArticleDetailsScreenProps {
  onBack: () => void;
  onOpenChatThread?: (threadId: string) => void;
  onOpenContentDetails?: () => void;
  onEditArticle?: () => void;
  /** GET /admin/learning/articles/{id} (BR-59m); absent means nothing to read. */
  articleId?: string | undefined;
  /** docs/rbac.json codes the signed-in admin holds; absent means no fetch. */
  can?: ((code: string) => boolean) | undefined;
}

/**
 * One article (BR-59m), plus the designed "Recent messages" panel.
 *
 * There is no question-and-answer endpoint in docs/openapi.yaml, so the thread
 * list cannot be loaded and the thread count is the dash. The demo threads
 * that used to fill it have gone; the panel stays and says why it is empty.
 *
 * The status badge shows the only state an article has — isPublished (BR-59l).
 * "Approved" and "Pending Review" are design vocabulary with no field behind
 * them, so they are never asserted here.
 */
export function ArticleDetailsScreen({
  onBack,
  onOpenChatThread,
  onOpenContentDetails,
  onEditArticle,
  articleId,
  can,
}: ArticleDetailsScreenProps) {
  const [showEditModal, setShowEditModal] = useState(false);

  const allowed = canManageLearning(can);
  const query = useLearningArticle(articleId, { enabled: allowed });
  const view = articleDetailView(query.data);
  const articleQueryState = queryViewState({
    isLoading: query.isPending && allowed && articleId !== undefined,
    error: query.error,
    itemCount: query.data === undefined ? 0 : 1,
  });

  const [titleDraft, setTitleDraft] = useState<string | null>(null);
  const [titleErrorKey, setTitleErrorKey] = useState<TranslationKey | null>(null);
  const update = useUpdateLearningArticle();
  // The stored title until the administrator types; never the dash in an input.
  const articleTitle = titleDraft ?? query.data?.title ?? '';
  const isSaving = update.isPending;
  const saveDisabled = !allowed || articleId === undefined || query.data === undefined || isSaving;

  const closeEditModal = () => {
    setShowEditModal(false);
    setTitleDraft(null);
    setTitleErrorKey(null);
  };

  /**
   * PATCH /admin/learning/articles/{id} (BR-59d). The status chips are not part
   * of it: an article's only state is isPublished, and Publish / Unpublish live
   * on the content detail screen. The success alert is inside onSuccess so a
   * refused or failed save is never reported as done.
   */
  const handleSaveEdit = () => {
    if (saveDisabled || articleId === undefined) return;
    const title = articleTitle.trim();
    if (title === '' || title.length > 200) {
      setTitleErrorKey('community.validation.articleTitle');
      return;
    }
    setTitleErrorKey(null);
    update.mutate(
      { id: articleId, body: { title } },
      {
        onSuccess: () => {
          closeEditModal();
          Alert.alert(t('community.action.saved.title'), t('community.article.updated'));
        },
      },
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Top Terracotta Header (Screenshot 1 right: "Artical details") ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeftRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={onBack}
              activeOpacity={0.7}
              accessibilityLabel="Go back"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <BackArrowWhiteIcon size={20} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Artical details</Text>
          </View>

          <TouchableOpacity
            style={styles.headerEditBtn}
            onPress={() => setShowEditModal(true)}
            activeOpacity={0.8}
            accessibilityLabel="Edit article"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <PencilWhiteIcon size={18} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Banner Card (Screenshot 1 right) ─── */}
        <TouchableOpacity
          style={styles.bannerCard}
          onPress={onOpenContentDetails}
          activeOpacity={0.8}
        >
          <FieldLandscapeBanner />
          <View style={styles.bannerInfo}>
            <View style={styles.bannerTitleRow}>
              <Text style={styles.bannerTitle} testID="community.article.title">{view.title}</Text>
              <View style={styles.badgeGroup}>
                <View style={styles.approvedBadge}>
                  <Text style={styles.approvedBadgeText}>{view.statusText}</Text>
                </View>
                <View style={styles.articleBadge}>
                  <Text style={styles.articleBadgeText}>Article</Text>
                </View>
              </View>
            </View>
            {/* tag · crop (no field) · language · author */}
            <Text style={styles.bannerSubtitle}>{view.subtitle}</Text>
            <Text style={styles.bannerDate}>{view.submittedText}</Text>
          </View>
        </TouchableOpacity>

        {/* ─── Recent Messages Header (Screenshot 1 right) ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Recent messages</Text>
          <Text style={styles.sectionHeadingMeta} testID="community.article.threadCount">
            {t('community.article.threads', { count: dash() })}
          </Text>
        </View>

        {/* ─── Recent Messages Threads List ─── */}
        <View style={styles.threadsList}>
          {!allowed ? (
            <AdminEmptyState title={t('community.denied.title')} subtitle={t('community.denied.subtitle')} />
          ) : articleQueryState === 'loading' ? (
            <AdminLoadingState />
          ) : articleQueryState === 'error' ? (
            <AdminErrorState error={query.error} onRetry={() => void query.refetch()} />
          ) : (
            <AdminEmptyState title={t('community.gap.messages.title')} subtitle={t('community.gap.messages.subtitle')} />
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button matching Screenshot 1 right */}
      <TouchableOpacity
        style={styles.fabBtn}
        onPress={() => onOpenChatThread && onOpenChatThread(articleId ?? '')}
        activeOpacity={0.85}
        accessibilityLabel="Open Q&A Chat"
      >
        <SendArrowIcon size={20} color={adminColors.onBrand} />
      </TouchableOpacity>
      {/* ─── Edit Article Popup Modal (Design M15-S02b) ─── */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={closeEditModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeEditModal}
        >
          <TouchableOpacity
            style={styles.modalCard}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Edit Article</Text>
              <TouchableOpacity
                onPress={closeEditModal}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Article Title *</Text>
            <TextInput
              style={styles.textInput}
              value={articleTitle}
              onChangeText={setTitleDraft}
              placeholder="Article title"
              placeholderTextColor={adminColors.placeholder}
              testID="community.article.editTitle"
            />

            <Text style={styles.inputLabel}>Status</Text>
            <View style={styles.statusChipsRow}>
              {(['Approved', 'Pending Review', 'Draft'] as const).map((st) => {
                // The one status the server knows: not published is a draft.
                const isSelected = st === 'Draft' && query.data?.isPublished === false;
                return (
                  <TouchableOpacity
                    key={st}
                    style={[styles.statusChip, isSelected && styles.statusChipSelected, styles.actionUnavailable]}
                    disabled
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: true, selected: isSelected }}
                    testID={`community.article.status.${st}`}
                  >
                    <Text style={[styles.statusChipText, isSelected && styles.statusChipTextSelected]}>
                      {st}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.modalNote}>{t('community.gap.article.status')}</Text>
            {titleErrorKey !== null ? (
              <Text style={styles.modalError} testID="community.article.editValidation">
                {t(titleErrorKey)}
              </Text>
            ) : null}
            {update.error !== null && update.error !== undefined ? (
              <Text style={styles.modalError} testID="community.article.editError">
                {t(adminErrorKey(update.error))}
              </Text>
            ) : null}

            <View style={styles.modalActions}>
              {onEditArticle && (
                <TouchableOpacity
                  style={styles.editorActionBtn}
                  onPress={() => {
                    setShowEditModal(false);
                    onEditArticle();
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.editorActionBtnText}>Open Full Editor</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.saveActionBtn, saveDisabled && styles.actionUnavailable]}
                onPress={saveDisabled ? undefined : handleSaveEdit}
                disabled={saveDisabled}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ disabled: saveDisabled, busy: isSaving }}
                testID="community.article.editSave"
              >
                <Text style={styles.saveActionBtnText}>
                  {isSaving ? t('community.action.saving') : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Stylesheet (Theme tokens compliant, zero raw hex/rgba) ───────────────────

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
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontSize: 20,
    fontWeight: '800',
  },

  // ─── Scroll Area ───
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: 80,
  },

  // ─── Banner Card ───
  bannerCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  bannerInfo: {
    padding: adminSpacing.md,
  },
  bannerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  bannerTitle: {
    ...adminType.rowTitle,
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.ink,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  approvedBadge: {
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: adminRadius.full,
  },
  approvedBadgeText: {
    color: adminColors.success.text,
    fontSize: 11,
    fontWeight: '700',
  },
  articleBadge: {
    backgroundColor: adminColors.info.bg,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: adminRadius.full,
  },
  articleBadgeText: {
    color: adminColors.info.text,
    fontSize: 11,
    fontWeight: '700',
  },
  bannerSubtitle: {
    ...adminType.caption,
    fontSize: 11.5,
    color: adminColors.muted,
    marginTop: 4,
  },
  bannerDate: {
    ...adminType.caption,
    fontSize: 11.5,
    color: adminColors.muted,
    marginTop: 3,
  },

  // ─── Section Header ───
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  sectionHeading: {
    ...adminType.rowTitle,
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  sectionHeadingMeta: {
    ...adminType.caption,
    fontSize: 12.5,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },

  // ─── Threads List ───
  threadsList: {
    gap: 10,
  },
  threadCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  threadHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  threadSender: {
    ...adminType.rowTitle,
    fontSize: 14,
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
  threadPreview: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
    marginTop: 6,
    lineHeight: 18,
  },
  threadTimestamp: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    marginTop: 6,
  },

  // ─── Floating Action Button ───
  fabBtn: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.md,
  },
  headerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerEditBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: adminOverlay.whitePill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    ...adminShadow.md,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    ...adminType.title,
    fontSize: 18,
    fontWeight: '800',
    color: adminColors.ink,
  },
  modalCloseText: {
    fontSize: 18,
    fontWeight: '700',
    color: adminColors.muted,
  },
  inputLabel: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 6,
    marginTop: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...adminType.body,
    fontSize: 14,
    color: adminColors.ink,
    backgroundColor: adminColors.canvas,
  },
  /** The designed control, kept visible, drawn as unavailable. */
  actionUnavailable: {
    opacity: 0.5,
  },
  modalNote: {
    ...adminType.caption,
    fontSize: 10.5,
    color: adminColors.muted,
    marginTop: 8,
  },
  modalError: {
    ...adminType.caption,
    color: adminColors.danger.text,
    marginTop: 6,
  },
  statusChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    marginBottom: 16,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.canvas,
  },
  statusChipSelected: {
    backgroundColor: adminColors.brandTint,
    borderColor: adminColors.brand,
  },
  statusChipText: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.muted,
  },
  statusChipTextSelected: {
    color: adminColors.brand,
    fontWeight: '700',
  },
  modalActions: {
    gap: 10,
    marginTop: 10,
  },
  editorActionBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: adminColors.canvas,
    borderWidth: 1,
    borderColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editorActionBtnText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.brand,
  },
  saveActionBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveActionBtnText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
});
