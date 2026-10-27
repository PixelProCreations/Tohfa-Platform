import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
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
  Path,
} from 'react-native-svg';
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
  articleTitle?: string;
  contentType?: string;
}

export function QuestionAnswerChatScreen({
  onBack,
  articleTitle = 'Mulching for water retention',
  contentType = 'Article',
}: QuestionAnswerChatScreenProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'Demo TOHFA Admin',
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
