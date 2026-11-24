import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
ScrollView,
StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, ScreenStatusBar } from '@tohfa/mobile-ui';
import Svg, {
  Circle,
  Path,
} from 'react-native-svg';
import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import { t, type TranslationKey } from '../../i18n';
import { adminErrorKey } from '../../api/errors';
import { useArchiveCommunity } from '../../api/communitiesHooks';
import { useAdminQaQuestion, useModerateAdminQaQuestion, usePostAdminQaAnswer } from '../../api/qaHooks';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';
import { canManageLearning } from './communityLogic';
import { buildAnswerBody, canModerate, canSendAnswer, qaThreadView, threadSubtitle } from './qaLogic';

function ThreeDotsVerticalIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="5" r="2" fill={color} />
      <Circle cx="12" cy="12" r="2" fill={color} />
      <Circle cx="12" cy="19" r="2" fill={color} />
    </Svg>
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

function SendArrowIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M22 2L11 13" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M22 2L15 22L11 13L2 9L22 2Z" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}


function EyeIcon({ size = 18, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function PencilEditMenuIcon({ size = 18, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BlockChatIcon({ size = 18, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Path d="M5.6 5.6l12.8 12.8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function BlockCommunityIcon({ size = 18, color = adminColors.danger.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Path d="M15 9l-6 6M9 9l6 6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function DeactivateCommunityIcon({ size = 18, color = adminColors.danger.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Path d="M10 9v6M14 9v6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ArchiveBoxIcon({ size = 18, color = adminColors.warning.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 8v13H3V8M1 3h22v5H1V3zM10 12h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Component Props ──────────────────────────────────────────────────────────

export interface QuestionAnswerChatScreenProps {
  onBack: () => void;
  role?: string | undefined;
  /** The question whose thread is shown; absent means no conversation is open. */
  questionId?: string | undefined;
  /** The thread's community, so the menu can open or edit it. */
  onNavigateDetails?: ((communityId?: string) => void) | undefined;
  onNavigateEdit?: ((communityId?: string) => void) | undefined;
  /** docs/rbac.json codes the signed-in admin holds; absent means no fetch. */
  can?: ((code: string) => boolean) | undefined;
}

/**
 * One Q&A thread (BR-59u): the question, then every answer, read from
 * GET /admin/qa/questions/{id} and replied to with POST .../answers.
 *
 * Anyone with `farmer.learning.qa_participate` answers — farmers and
 * administrators alike — so a bubble's side follows the author's role, not the
 * viewer. There is no edit or delete control on any message: editing is the
 * author's own act on the server and a moderator delete has no designed
 * control, so none is drawn that would fire a request.
 *
 * The thread menu: View Details and Edit Community open the question's own
 * community (disabled when the question has none). Block Chat moderates THIS
 * question (PATCH .../moderate, isBlocked) and flips to Unblock Chat once it is
 * blocked; Archive Community archives the question's community. Both ask first.
 * Block Community and Deactivate Community have no endpoint and stay drawn,
 * disabled. Nothing reports success before its request settled.
 */
export function QuestionAnswerChatScreen({
  onBack,
  questionId,
  onNavigateDetails,
  onNavigateEdit,
  can,
}: QuestionAnswerChatScreenProps) {
  const [inputText, setInputText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [inputErrorKey, setInputErrorKey] = useState<TranslationKey | null>(null);

  const allowed = canManageLearning(can);
  const thread = useAdminQaQuestion(questionId, { enabled: allowed });
  const post = usePostAdminQaAnswer();
  const moderate = useModerateAdminQaQuestion();
  const archive = useArchiveCommunity();

  const dto = thread.data;
  const messages = dto === undefined ? [] : qaThreadView(dto);
  const communityId = dto?.communityId ?? undefined;
  const mayModerate = canModerate(can);
  const sendDisabled = !canSendAnswer(can) || dto === undefined || inputText.trim() === '' || post.isPending;
  const blockDisabled = !mayModerate || dto === undefined || moderate.isPending;
  const archiveDisabled = !mayModerate || communityId === undefined || archive.isPending;
  const actionError = post.error ?? moderate.error ?? archive.error;

  const handleSend = () => {
    if (sendDisabled || dto === undefined) return;
    const built = buildAnswerBody(inputText);
    if (!built.ok) {
      setInputErrorKey(built.errorKey);
      return;
    }
    setInputErrorKey(null);
    // The box is cleared only once the reply is stored; a failure keeps what was typed.
    post.mutate({ questionId: dto.id, content: built.body.content }, { onSuccess: () => setInputText('') });
  };

  const handleBlock = () => {
    if (blockDisabled || dto === undefined) return;
    setShowMenu(false);
    const next = !dto.isBlocked;
    const prefix = next ? 'community.chat.block' : 'community.chat.unblock';
    Alert.alert(t(`${prefix}.confirm.title` as TranslationKey), t(`${prefix}.confirm.message` as TranslationKey), [
      { text: t('community.action.cancel'), style: 'cancel' },
      {
        text: t(`${prefix}.confirm.action` as TranslationKey),
        style: next ? 'destructive' : 'default',
        onPress: () => moderate.mutate({ id: dto.id, body: { isBlocked: next } }),
      },
    ]);
  };

  const handleArchive = () => {
    if (archiveDisabled || communityId === undefined) return;
    setShowMenu(false);
    Alert.alert(t('community.archive.confirm.title'), t('community.archive.confirm.message'), [
      { text: t('community.action.cancel'), style: 'cancel' },
      {
        text: t('community.archive.confirm.action'),
        style: 'destructive',
        onPress: () =>
          archive.mutate(communityId, {
            onSuccess: () => {
              Alert.alert(t('community.publish.success.title'), t('community.community.archived'));
            },
          }),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Top Terracotta Header (Screenshot 1 left) ─── */}
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
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Question & Answer</Text>
            <Text style={styles.headerSubtitle}>{threadSubtitle(dto)}</Text>
          </View>
          <TouchableOpacity
            style={styles.threeDotsBtn}
            onPress={() => setShowMenu(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Community actions"
          >
            <ThreeDotsVerticalIcon size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.contentWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {!allowed ? (
            <AdminEmptyState title={t('community.denied.title')} subtitle={t('community.denied.subtitle')} />
          ) : questionId === undefined ? (
            <AdminEmptyState title={t('community.chat.noThread')} />
          ) : dto === undefined && thread.error !== null && thread.error !== undefined ? (
            <AdminErrorState error={thread.error} onRetry={() => void thread.refetch()} />
          ) : dto === undefined ? (
            <AdminLoadingState />
          ) : (
            <>
              {messages.map((message) => (
                <View
                  key={message.id}
                  style={[styles.messageBubbleWrap, message.side === 'admin' ? styles.adminBubbleWrap : styles.farmerBubbleWrap]}
                  testID={`community.chat.message.${message.id}`}
                >
                  <View style={[styles.messageBubble, message.side === 'admin' ? styles.adminBubble : styles.farmerBubble]}>
                    <Text style={[styles.senderName, message.side === 'admin' ? styles.senderNameAdmin : styles.senderNameFarmer]}>
                      {message.author}
                    </Text>
                    {message.title !== null ? <Text style={styles.senderName}>{message.title}</Text> : null}
                    <Text style={styles.messageBody}>{message.content}</Text>
                    {message.blockedNote !== null ? <Text style={styles.messageTimestamp}>{message.blockedNote}</Text> : null}
                    <Text style={styles.messageTimestamp}>{message.timestamp}</Text>
                  </View>
                </View>
              ))}
              {dto.answers.length === 0 ? (
                <View style={styles.awaitingWrap}>
                  <Text style={styles.awaitingText}>{t('community.chat.noAnswers')}</Text>
                </View>
              ) : null}
            </>
          )}
        </ScrollView>

        {/* ─── Bottom Reply Input Bar (Screenshot 1 left) ─── */}
        {inputErrorKey !== null ? <Text style={styles.chatError}>{t(inputErrorKey)}</Text> : null}
        {actionError !== null && actionError !== undefined ? (
          <Text style={styles.chatError} testID="community.chat.error">
            {t(adminErrorKey(actionError))}
          </Text>
        ) : null}
        <View style={styles.bottomBar}>
          <TextInput
            style={styles.replyInput}
            placeholder="Type your reply..."
            placeholderTextColor={adminColors.placeholder}
            value={inputText}
            onChangeText={setInputText}
            multiline
            testID="community.chat.input"
          />
          <TouchableOpacity
            style={[styles.sendBtn, sendDisabled && styles.actionUnavailable]}
            onPress={sendDisabled ? undefined : handleSend}
            disabled={sendDisabled}
            activeOpacity={0.8}
            accessibilityLabel="Send reply"
            accessibilityRole="button"
            accessibilityState={{ disabled: sendDisabled, busy: post.isPending }}
            testID="community.chat.send"
          >
            <SendArrowIcon size={18} color={adminColors.onBrand} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      {/* ─── Community Action Menu Modal (Screenshot Variations) ─── */}
      <Modal visible={showMenu} transparent animationType="fade">
        <TouchableOpacity
          style={styles.menuBackdrop}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuDropdown}>
            {/* 1. View Details (Present in all variations): the question's own community. */}
            <TouchableOpacity
              style={[styles.menuItem, communityId === undefined && styles.actionUnavailable]}
              onPress={
                communityId === undefined
                  ? undefined
                  : () => {
                      setShowMenu(false);
                      onNavigateDetails?.(communityId);
                    }
              }
              disabled={communityId === undefined}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityState={{ disabled: communityId === undefined }}
              testID="community.chat.menu.details"
            >
              <EyeIcon size={18} color={adminColors.ink} />
              <Text style={styles.menuItemText}>View Details</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={[styles.menuItem, communityId === undefined && styles.actionUnavailable]}
              onPress={
                communityId === undefined
                  ? undefined
                  : () => {
                      setShowMenu(false);
                      onNavigateEdit?.(communityId);
                    }
              }
              disabled={communityId === undefined}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityState={{ disabled: communityId === undefined }}
              testID="community.chat.menu.edit"
            >
              <PencilEditMenuIcon size={18} color={adminColors.ink} />
              <Text style={styles.menuItemText}>Edit Community</Text>
            </TouchableOpacity>

            {/* Block Chat moderates this question; Archive archives its community.
                Block Community and Deactivate have no endpoint: disabled, with one note. */}
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={[styles.menuItem, blockDisabled && styles.actionUnavailable]}
              onPress={blockDisabled ? undefined : handleBlock}
              disabled={blockDisabled}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityState={{ disabled: blockDisabled }}
              testID="community.chat.menu.blockChat"
            >
              <BlockChatIcon size={18} color={adminColors.ink} />
              <Text style={styles.menuItemText}>{t(dto?.isBlocked === true ? 'community.chat.unblock' : 'community.chat.block')}</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={[styles.menuItem, styles.actionUnavailable]}
              disabled
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityState={{ disabled: true }}
              testID="community.chat.menu.blockCommunity"
            >
              <BlockCommunityIcon size={18} color={adminColors.danger.text} />
              <Text style={[styles.menuItemText, { color: adminColors.danger.text }]}>Block Community</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={[styles.menuItem, styles.actionUnavailable]}
              disabled
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityState={{ disabled: true }}
              testID="community.chat.menu.deactivate"
            >
              <DeactivateCommunityIcon size={18} color={adminColors.danger.text} />
              <Text style={[styles.menuItemText, { color: adminColors.danger.text }]}>Deactivate Community</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={[styles.menuItem, archiveDisabled && styles.actionUnavailable]}
              onPress={archiveDisabled ? undefined : handleArchive}
              disabled={archiveDisabled}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityState={{ disabled: archiveDisabled }}
              testID="community.chat.menu.archive"
            >
              <ArchiveBoxIcon size={18} color={adminColors.warning.text} />
              <Text style={styles.menuItemText}>Archive community</Text>
            </TouchableOpacity>
            <Text style={styles.menuNote}>{t('community.gap.chat.actions')}</Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Stylesheet (Theme tokens compliant, zero raw hex/rgba) ───────────────────

const styles = StyleSheet.create({
  threeDotsBtn: {
    width: 32,
    height: 32,
    borderRadius: adminRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
  },
  menuDropdown: {
    position: 'absolute',
    top: 56,
    right: 16,
    width: 200,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 4,
    ...adminShadow.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: adminColors.ink,
  },
  /** The designed control, kept visible, drawn as unavailable. */
  actionUnavailable: {
    opacity: 0.5,
  },
  menuNote: {
    ...adminType.caption,
    fontSize: 10.5,
    color: adminColors.muted,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chatError: {
    ...adminType.caption,
    color: adminColors.danger.text,
    fontWeight: '700',
    paddingHorizontal: adminSpacing.lg,
    paddingBottom: 6,
  },
  bottomNote: {
    ...adminType.caption,
    fontSize: 10.5,
    color: adminColors.muted,
    paddingHorizontal: adminSpacing.lg,
    paddingBottom: 6,
  },
  menuDivider: {
    height: 1,
    backgroundColor: adminColors.canvas,
    marginHorizontal: 10,
  },

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
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontSize: 19,
    fontWeight: '800',
  },
  headerSubtitle: {
    ...adminType.caption,
    color: adminColors.onBrand,
    opacity: 0.9,
    fontSize: 12,
    marginTop: 2,
  },

  // ─── Messages Scroll Area ───
  contentWrap: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: 20,
    gap: 14,
  },
  messageBubbleWrap: {
    flexDirection: 'row',
  },
  farmerBubbleWrap: {
    justifyContent: 'flex-start',
  },
  adminBubbleWrap: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '85%',
    borderRadius: adminRadius.xl,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...adminShadow.sm,
  },
  farmerBubble: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  adminBubble: {
    backgroundColor: adminColors.brandSoft.bg,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  senderName: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  senderNameFarmer: {
    color: adminColors.brandDeep,
  },
  senderNameAdmin: {
    color: adminColors.brandDeep,
  },
  messageBody: {
    ...adminType.body,
    fontSize: 13.5,
    color: adminColors.ink,
    lineHeight: 18,
  },
  messageTimestamp: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    marginTop: 6,
  },
  awaitingWrap: {
    alignItems: 'center',
    marginVertical: 14,
  },
  awaitingText: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
    fontStyle: 'italic',
  },

  // ─── Bottom Bar ───
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 10,
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    gap: 10,
  },
  replyInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 90,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 13.5,
    color: adminColors.ink,
    backgroundColor: adminColors.canvas,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
