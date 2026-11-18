import React, { useState } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError } from '../../../shell/api/client';
import {
  customerColors,
  customerFonts,
  customerSpacing,
} from '../theme';
import {
  BackArrowSvg,
  TicketSvg,
  CheckCircleSvg,
  ActiveStepSvg,
  DashedCircleSvg,
  HeadsetSvg,
} from '../components/ContactSupportIcons';
import {
  MESSAGE_MAX,
  canCancel,
  canReply,
  deriveTimeline,
  formatSupportDateTime,
  issueLabelFromSubject,
  productFromDescription,
  sortMessagesNewestFirst,
  useCancelSupportTicket,
  useReplySupportTicket,
  useSupportTicket,
  type TimelineStepKey,
} from '../api/support';
import { mapProblem } from '../api/problem';

export interface TrackSupportRequestScreenProps {
  ticketId?: string | undefined;
  onBack?: (() => void) | undefined;
  onNavigate?: ((screen: string, params?: Record<string, unknown> | undefined) => void) | undefined;
}

const STEP_COPY: Record<TimelineStepKey, { title: string; done: string; pending: string }> = {
  received: { title: 'Request received', done: 'Your request has been successfully submitted.', pending: '' },
  review: {
    title: 'Under review',
    done: 'Our support team is looking into your request.',
    pending: 'Our support team will check the details and contact you within 24 hours.',
  },
  resolution: {
    title: 'Resolution',
    done: 'Your request has been resolved.',
    pending: "We'll help you with a solution (replacement, refund or other support).",
  },
  cancelled: { title: 'Request cancelled', done: 'You cancelled this request.', pending: '' },
};

export const TrackSupportRequestScreen: React.FC<TrackSupportRequestScreenProps> = ({
  ticketId,
  onBack,
}) => {
  const insets = useSafeAreaInsets();
  const query = useSupportTicket(ticketId);
  const cancel = useCancelSupportTicket(ticketId ?? '');
  const reply = useReplySupportTicket(ticketId ?? '');
  const [replyText, setReplyText] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const headerTopPadding = insets.top > 0
    ? insets.top + 8
    : (Platform.OS === 'android' ? (StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 44) : 16);

  const ticket = query.data;

  const doCancel = async () => {
    setActionError(null);
    try {
      await cancel.mutateAsync();
    } catch (err) {
      const e = mapProblem(err);
      if (!e.silent) {
        setActionError(
          err instanceof ApiError && err.status === 409
            ? 'This request can no longer be cancelled because it is already being handled.'
            : e.message,
        );
      }
    }
  };

  const handleCancelRequest = () => {
    Alert.alert(
      'Cancel Support Request',
      'Are you sure you want to cancel this support request?',
      [
        { text: 'Keep Request', style: 'cancel' },
        { text: 'Cancel Request', style: 'destructive', onPress: () => void doCancel() },
      ],
    );
  };

  const doReply = async () => {
    const text = replyText.trim();
    if (text === '' || reply.isPending) return;
    setActionError(null);
    try {
      await reply.mutateAsync(text);
      setReplyText('');
    } catch (err) {
      const e = mapProblem(err);
      if (!e.silent) {
        setActionError(
          err instanceof ApiError && err.status === 409 ? 'This request is closed, so it cannot take new messages.' : e.message,
        );
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await query.refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const notFound = query.isError && query.error instanceof ApiError && query.error.status === 404;
  const steps = ticket ? deriveTimeline(ticket) : [];
  const messages = ticket ? sortMessagesNewestFirst(ticket.messages) : [];
  const product = ticket ? productFromDescription(ticket.description) : null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <View style={[styles.headerRow, { paddingTop: headerTopPadding }]}>
        <View style={styles.headerLeftGroup}>
          <TouchableOpacity
            style={styles.circleIconButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackArrowSvg color={customerColors.heading} size={18} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Track request</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
      >
        {query.isLoading ? (
          <ActivityIndicator accessibilityLabel="Loading request" style={{ marginTop: 40 }} />
        ) : notFound ? (
          <Text style={[styles.summaryValue, { textAlign: 'center', marginTop: 40 }]}>Request not found</Text>
        ) : ticket === undefined ? (
          <View style={{ alignItems: 'center', marginTop: 40, gap: 8 }} accessibilityRole="alert">
            <Text style={styles.summaryValue}>{query.isError ? mapProblem(query.error).message : 'No request selected'}</Text>
            <TouchableOpacity onPress={() => void query.refetch()} accessibilityLabel="Retry request">
              <Text style={{ color: customerColors.brand, fontWeight: '700' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* ── SUPPORT ID CARD ─────────────────────────────────────────────── */}
            <View style={styles.supportIdCard}>
              <View style={styles.supportIdLeft}>
                <TicketSvg color="#2E7D32" size={24} />
                <View style={styles.supportIdTextCol}>
                  <Text style={styles.supportIdLabel}>Support ID</Text>
                  <Text style={styles.supportIdValue}>{ticket.ticketNumber}</Text>
                </View>
              </View>
            </View>

            {/* ── REQUEST SUMMARY ─────────────────────────────────────────────── */}
            <Text style={styles.sectionTitle}>Request Summary</Text>
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Order ID</Text>
                <Text style={styles.summaryValue}>{ticket.orderNumber ?? 'N/A'}</Text>
              </View>
              {product !== null ? (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Product</Text>
                  <Text style={styles.summaryValue}>{product}</Text>
                </View>
              ) : null}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Issue type</Text>
                <Text style={styles.summaryValue}>{issueLabelFromSubject(ticket.subject, ticket.orderNumber)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Submitted on</Text>
                <Text style={styles.summaryValue}>{formatSupportDateTime(ticket.createdAt)}</Text>
              </View>
            </View>

            {/* ── REQUEST STATUS ──────────────────────────────────────────────── */}
            <Text style={styles.sectionTitle}>Request Status</Text>
            <View style={styles.statusTimeline}>
              {steps.map((step, i) => {
                const last = i === steps.length - 1;
                const copy = STEP_COPY[step.key];
                return (
                  <View key={step.key} style={last ? styles.timelineItemLast : styles.timelineItem}>
                    <View style={styles.indicatorCol}>
                      {step.state === 'done' ? <CheckCircleSvg /> : step.state === 'current' ? <ActiveStepSvg /> : <DashedCircleSvg />}
                      {!last ? (
                        <View
                          style={[styles.timelineConnector, step.state === 'done' ? styles.connectorGreen : styles.connectorGray]}
                        />
                      ) : null}
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>{copy.title}</Text>
                      {step.at !== null ? (
                        <Text style={styles.stepTimestamp}>{formatSupportDateTime(step.at)}</Text>
                      ) : step.state === 'pending' ? (
                        <Text style={styles.stepPending}>Pending</Text>
                      ) : null}
                      <Text style={step.state === 'pending' ? styles.stepDescriptionMuted : styles.stepDescription}>
                        {step.state === 'pending' || step.state === 'current' ? copy.pending || copy.done : copy.done}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* ── REQUEST UPDATES ─────────────────────────────────────────────── */}
            <Text style={styles.sectionTitle}>Request Updates</Text>
            <View style={styles.updatesTimeline}>
              <View style={styles.updatesGuideLine} />
              {messages.length === 0 ? (
                <Text style={styles.updateMessage}>No updates yet.</Text>
              ) : (
                messages.map((m) => (
                  <View key={m.id} style={styles.updateRow}>
                    <View style={styles.updateDot} />
                    <View style={[styles.updateCard, m.sender === 'SUPPORT' ? styles.updateCardActive : styles.updateCardNeutral]}>
                      <View style={styles.updateCardHeader}>
                        <View style={styles.updateHeaderLeft}>
                          <HeadsetSvg color={m.sender === 'SUPPORT' ? '#2E7D32' : '#4B5563'} size={18} />
                          <Text style={styles.updateTeamTitle}>{m.sender === 'SUPPORT' ? 'Support Team' : 'You'}</Text>
                        </View>
                        <Text style={styles.updateTimestamp}>{formatSupportDateTime(m.createdAt)}</Text>
                      </View>
                      <Text style={styles.updateMessage}>{m.redacted ? '[details removed]' : m.message}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* ── REPLY COMPOSER ──────────────────────────────────────────────── */}
            {canReply(ticket.status) ? (
              <View style={{ marginBottom: 16 }}>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    borderRadius: 12,
                    padding: 12,
                    minHeight: 70,
                    textAlignVertical: 'top',
                  }}
                  placeholder="Write a reply"
                  placeholderTextColor="#9CA3AF"
                  value={replyText}
                  onChangeText={setReplyText}
                  maxLength={MESSAGE_MAX}
                  multiline
                  accessibilityLabel="Reply"
                />
                <TouchableOpacity
                  style={[styles.cancelButton, { marginTop: 10, borderColor: customerColors.brand, backgroundColor: replyText.trim() === '' ? '#F3F4F6' : '#2E7D32' }]}
                  activeOpacity={0.8}
                  disabled={replyText.trim() === '' || reply.isPending}
                  onPress={() => void doReply()}
                  accessibilityLabel="Send reply"
                >
                  {reply.isPending ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.cancelButtonText, { color: replyText.trim() === '' ? '#9CA3AF' : '#FFFFFF' }]}>Send reply</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : null}

            {actionError !== null ? (
              <Text style={{ color: '#DC2626', fontSize: 12, marginBottom: 10 }} accessibilityRole="alert">
                {actionError}
              </Text>
            ) : null}

            {/* ── CANCEL REQUEST BUTTON (OPEN tickets only) ───────────────────── */}
            {canCancel(ticket.status) ? (
              <TouchableOpacity
                style={styles.cancelButton}
                activeOpacity={0.8}
                onPress={handleCancelRequest}
                disabled={cancel.isPending}
                accessibilityLabel="Cancel Request"
              >
                {cancel.isPending ? <ActivityIndicator /> : <Text style={styles.cancelButtonText}>Cancel Request</Text>}
              </TouchableOpacity>
            ) : ticket.status === 'CANCELLED' ? (
              <View style={[styles.cancelButton, styles.cancelButtonDisabled]}>
                <Text style={styles.cancelButtonText}>Request Cancelled</Text>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
};

// ── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: customerSpacing.base,
    paddingTop: 12,
    paddingBottom: 48,
  },

  /* Header */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: customerSpacing.base,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  circleIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1A2E1A',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: customerFonts.editorial,
    color: customerColors.heading,
  },

  /* Support ID Card */
  supportIdCard: {
    backgroundColor: '#EAF6E9',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
  },
  supportIdLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  supportIdTextCol: {
    gap: 2,
  },
  supportIdLabel: {
    fontSize: 12,
    color: '#4B5563',
  },
  supportIdValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },

  /* Section Title */
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2E1A',
    marginBottom: 12,
    marginTop: 6,
  },

  /* Request Summary */
  summaryContainer: {
    gap: 10,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },

  /* Request Status Timeline */
  statusTimeline: {
    marginBottom: 24,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineItemLast: {
    flexDirection: 'row',
    gap: 12,
  },
  indicatorCol: {
    alignItems: 'center',
    width: 22,
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    minHeight: 46,
    marginVertical: 4,
  },
  connectorGreen: {
    backgroundColor: '#2E7D32',
  },
  connectorGray: {
    backgroundColor: '#E5E7EB',
  },
  stepContent: {
    flex: 1,
    paddingBottom: 20,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  stepTimestamp: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  stepPending: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  stepDescription: {
    fontSize: 12.5,
    color: '#4B5563',
    lineHeight: 18,
    marginTop: 4,
  },
  stepDescriptionMuted: {
    fontSize: 12.5,
    color: '#6B7280',
    lineHeight: 18,
    marginTop: 4,
  },

  /* Request Updates */
  updatesTimeline: {
    position: 'relative',
    marginBottom: 28,
    gap: 12,
  },
  updatesGuideLine: {
    position: 'absolute',
    left: 4.5,
    top: 22,
    bottom: 22,
    width: 2,
    backgroundColor: '#A7D7A9',
  },
  updateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  updateDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#2E7D32',
    zIndex: 1,
  },
  updateCard: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  updateCardActive: {
    backgroundColor: '#EAF6E9',
  },
  updateCardNeutral: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  updateCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  updateHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  updateTeamTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#111827',
  },
  updateTimestamp: {
    fontSize: 11,
    color: '#6B7280',
  },
  updateMessage: {
    fontSize: 12.5,
    color: '#374151',
    lineHeight: 18,
  },

  /* Cancel Button */
  cancelButton: {
    borderWidth: 1.5,
    borderColor: '#2E7D32',
    borderRadius: 28,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelButtonDisabled: {
    borderColor: '#9CA3AF',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E7D32',
  },
});

