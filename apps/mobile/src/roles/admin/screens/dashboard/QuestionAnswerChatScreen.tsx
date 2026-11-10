import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, {
  Circle,
  Path,
} from 'react-native-svg';

function ThreeDotsVerticalIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="5" r="2" fill={color} />
      <Circle cx="12" cy="12" r="2" fill={color} />
      <Circle cx="12" cy="19" r="2" fill={color} />
    </Svg>
  );
}
import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';

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

function ArchiveBoxIcon({ size = 18, color = '#D97706' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 8v13H3V8M1 3h22v5H1V3zM10 12h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ActivatePlayIcon({ size = 18, color = adminColors.success.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Path d="M10 8l6 4-6 4V8z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Chat Message Model ───────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  sender: string;
  senderType: 'farmer' | 'admin';
  body: string;
  timestamp: string;
  statusText?: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'Ramesh Kumar (Farmer)',
    senderType: 'farmer',
    body: 'Does mulching work for tomato beds too, or only root crops?',
    timestamp: '11 Oct 2026, 09:12',
  },
  {
    id: 'msg-2',
    sender: 'Demo TOHFA Admin',
    senderType: 'admin',
    body: 'Yes, straw mulch works well for tomato too — keep a 2-3 inch layer, away from the stem.',
    timestamp: '11 Oct 2026, 10:05',
    statusText: 'Sent',
  },
  {
    id: 'msg-3',
    sender: 'Selvi (Farmer)',
    senderType: 'farmer',
    body: 'How often should the mulch layer be replaced?',
    timestamp: '12 Oct 2026, 14:40',
  },
];

// ─── Component Props ──────────────────────────────────────────────────────────

export interface QuestionAnswerChatScreenProps {
  onBack: () => void;
  role?: string | undefined;
  articleTitle?: string;
  contentType?: string;
  onNavigateDetails?: () => void;
  onNavigateEdit?: () => void;
}

export function QuestionAnswerChatScreen({
  onBack,
  role,
  articleTitle = 'Mulching for water retention',
  contentType = 'Article',
  onNavigateDetails,
  onNavigateEdit,
}: QuestionAnswerChatScreenProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [communityStatus, setCommunityStatus] = useState<'Active' | 'Blocked' | 'Deactivated' | 'Archived'>('Active');
  const [isChatBlocked, setIsChatBlocked] = useState(false);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: role === 'SUPER_ADMIN' ? 'Super Admin' : 'Demo TOHFA Admin',
      senderType: 'admin',
      body: inputText.trim(),
      timestamp: 'Just now',
      statusText: 'Sent',
    };
    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
  };

  const hasPendingFarmerMessage = messages.length > 0 && messages[messages.length - 1]?.senderType === 'farmer';

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

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
            <Text style={styles.headerSubtitle}>
              {articleTitle} · {contentType}
            </Text>
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
          {/* Chat Messages */}
          {messages.map((item) => {
            const isAdmin = item.senderType === 'admin';
            return (
              <View
                key={item.id}
                style={[
                  styles.messageBubbleWrap,
                  isAdmin ? styles.adminBubbleWrap : styles.farmerBubbleWrap,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    isAdmin ? styles.adminBubble : styles.farmerBubble,
                  ]}
                >
                  <Text style={[styles.senderName, isAdmin ? styles.senderNameAdmin : styles.senderNameFarmer]}>
                    {item.sender}
                  </Text>
                  <Text style={styles.messageBody}>{item.body}</Text>
                  <Text style={styles.messageTimestamp}>
                    {item.timestamp}
                    {item.statusText ? ` · ${item.statusText}` : ''}
                  </Text>
                </View>
              </View>
            );
          })}

          {/* Centered Awaiting indicator matching Screenshot 1 */}
          {hasPendingFarmerMessage && (
            <View style={styles.awaitingWrap}>
              <Text style={styles.awaitingText}>Awaiting your reply</Text>
            </View>
          )}
        </ScrollView>

        {/* ─── Bottom Reply Input Bar (Screenshot 1 left) ─── */}
        <View style={styles.bottomBar}>
          <TextInput
            style={styles.replyInput}
            placeholder="Type your reply..."
            placeholderTextColor={adminColors.placeholder}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity
            style={styles.sendBtn}
            onPress={handleSendMessage}
            activeOpacity={0.8}
            accessibilityLabel="Send reply"
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
            {/* 1. View Details (Present in all variations) */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                onNavigateDetails?.();
              }}
              activeOpacity={0.75}
            >
              <EyeIcon size={18} color={adminColors.ink} />
              <Text style={styles.menuItemText}>View Details</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />

            {/* Variation 1: Active Community */}
            {communityStatus === 'Active' && (
              <>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    onNavigateEdit?.();
                  }}
                  activeOpacity={0.75}
                >
                  <PencilEditMenuIcon size={18} color={adminColors.ink} />
                  <Text style={styles.menuItemText}>Edit Community</Text>
                </TouchableOpacity>
                <View style={styles.menuDivider} />

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    setIsChatBlocked((prev) => !prev);
                    Alert.alert('Chat Status', isChatBlocked ? 'Chat has been unblocked.' : 'Chat has been blocked.');
                  }}
                  activeOpacity={0.75}
                >
                  <BlockChatIcon size={18} color={adminColors.ink} />
                  <Text style={styles.menuItemText}>{isChatBlocked ? 'Unblock Chat' : 'Block Chat'}</Text>
                </TouchableOpacity>
                <View style={styles.menuDivider} />

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    setCommunityStatus('Blocked');
                    Alert.alert('Community Blocked', 'This community has been blocked from public access.');
                  }}
                  activeOpacity={0.75}
                >
                  <BlockCommunityIcon size={18} color={adminColors.danger.text} />
                  <Text style={[styles.menuItemText, { color: adminColors.danger.text }]}>Block Community</Text>
                </TouchableOpacity>
                <View style={styles.menuDivider} />

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    setCommunityStatus('Deactivated');
                    Alert.alert('Community Deactivated', 'This community has been paused and marked inactive.');
                  }}
                  activeOpacity={0.75}
                >
                  <DeactivateCommunityIcon size={18} color={adminColors.danger.text} />
                  <Text style={[styles.menuItemText, { color: adminColors.danger.text }]}>Deactivate Community</Text>
                </TouchableOpacity>
                <View style={styles.menuDivider} />

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    setCommunityStatus('Archived');
                    Alert.alert('Community Archived', 'This community has been archived.');
                  }}
                  activeOpacity={0.75}
                >
                  <ArchiveBoxIcon size={18} color="#D97706" />
                  <Text style={styles.menuItemText}>Archive community</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Variation 2: Blocked Community */}
            {communityStatus === 'Blocked' && (
              <>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    onNavigateEdit?.();
                  }}
                  activeOpacity={0.75}
                >
                  <PencilEditMenuIcon size={18} color={adminColors.ink} />
                  <Text style={styles.menuItemText}>Edit Community</Text>
                </TouchableOpacity>
                <View style={styles.menuDivider} />

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    setCommunityStatus('Active');
                    Alert.alert('Community Activated', 'This community is now active.');
                  }}
                  activeOpacity={0.75}
                >
                  <ActivatePlayIcon size={18} color={adminColors.success.text} />
                  <Text style={[styles.menuItemText, { color: adminColors.success.text }]}>Activate Community</Text>
                </TouchableOpacity>
                <View style={styles.menuDivider} />

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    setCommunityStatus('Archived');
                    Alert.alert('Community Archived', 'This community has been archived.');
                  }}
                  activeOpacity={0.75}
                >
                  <ArchiveBoxIcon size={18} color="#D97706" />
                  <Text style={styles.menuItemText}>Archive community</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Variation 3: Archived or Deactivated Community */}
            {(communityStatus === 'Archived' || communityStatus === 'Deactivated') && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowMenu(false);
                  setCommunityStatus('Active');
                  Alert.alert('Community Activated', 'This community is now active.');
                }}
                activeOpacity={0.75}
              >
                <ActivatePlayIcon size={18} color={adminColors.success.text} />
                <Text style={[styles.menuItemText, { color: adminColors.success.text }]}>Activate Community</Text>
              </TouchableOpacity>
            )}
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
    backgroundColor: 'rgba(0,0,0,0.15)',
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
