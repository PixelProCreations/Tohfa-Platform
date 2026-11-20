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
import { t, type TranslationKey } from '../../../i18n/customer';

export interface TrackSupportRequestScreenProps {
  ticketId?: string | undefined;
  onBack?: (() => void) | undefined;
  onNavigate?: ((screen: string, params?: Record<string, unknown> | undefined) => void) | undefined;
}

/** Full catalogue keys so a missing translation is a type error, not a raw key on screen. */
const STEP_COPY: Record<TimelineStepKey, { title: TranslationKey; done: TranslationKey; pending: TranslationKey | null }> = {
  received: { title: 'customer.track.step.received.title', done: 'customer.track.step.received.done', pending: null },
  review: { title: 'customer.track.step.review.title', done: 'customer.track.step.review.done', pending: 'customer.track.step.review.pending' },
  resolution: {
    title: 'customer.track.step.resolution.title',
    done: 'customer.track.step.resolution.done',
    pending: 'customer.track.step.resolution.pending',
  },
  cancelled: { title: 'customer.track.step.cancelled.title', done: 'customer.track.step.cancelled.done', pending: null },
};

/** Resolve a STEP_COPY entry to text at render time. */
const stepText = (key: TranslationKey): string => t(key);

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
            ? t('customer.track.cancelConflict')
            : e.message,
        );
      }
    }
  };

  const handleCancelRequest = () => {
    Alert.alert(
      t('customer.track.cancelConfirmTitle'),
      t('customer.track.cancelConfirmBody'),
      [
        { text: t('customer.track.keepRequest'), style: 'cancel' },
        { text: t('customer.track.cancelRequest'), style: 'destructive', onPress: () => void doCancel() },
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
          err instanceof ApiError && err.status === 409 ? t('customer.track.replyConflict') : e.message,
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
            accessibilityLabel={t('customer.track.back')}
          >
            <BackArrowSvg color={customerColors.heading} size={18} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('customer.track.title')}</Text>
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
          <ActivityIndicator accessibilityLabel={t('customer.track.loading')} style={{ marginTop: 40 }} />
        ) : notFound ? (
          <Text style={[styles.summaryValue, { textAlign: 'center', marginTop: 40 }]}>{t('customer.track.notFound')}</Text>
        ) : ticket === undefined ? (
          <View style={{ alignItems: 'center', marginTop: 40, gap: 8 }} accessibilityRole="alert">
            <Text style={styles.summaryValue}>{query.isError ? mapProblem(query.error).message : t('customer.track.noneSelected')}</Text>
            <TouchableOpacity onPress={() => void query.refetch()} accessibilityLabel={t('customer.track.retryA11y')}>
              <Text style={{ color: customerColors.brand, fontWeight: '700' }}>{t('customer.track.retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* ── SUPPORT ID CARD ─────────────────────────────────────────────── */}
            <View style={styles.supportIdCard}>
              <View style={styles.supportIdLeft}>
                <TicketSvg color={customerColors.primary} size={24} />
                <View style={styles.supportIdTextCol}>
                  <Text style={styles.supportIdLabel}>{t('customer.track.supportId')}</Text>
                  <Text style={styles.supportIdValue}>{ticket.ticketNumber}</Text>
                </View>
              </View>
            </View>

            {/* ── REQUEST SUMMARY ─────────────────────────────────────────────── */}
            <Text style={styles.sectionTitle}>{t('customer.track.summary')}</Text>
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('customer.track.orderId')}</Text>
                <Text style={styles.summaryValue}>{ticket.orderNumber ?? t('customer.track.na')}</Text>
              </View>
              {product !== null ? (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{t('customer.track.product')}</Text>
                  <Text style={styles.summaryValue}>{product}</Text>
                </View>
              ) : null}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('customer.track.issueType')}</Text>
                <Text style={styles.summaryValue}>{issueLabelFromSubject(ticket.subject, ticket.orderNumber)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('customer.track.submittedOn')}</Text>
                <Text style={styles.summaryValue}>{formatSupportDateTime(ticket.createdAt)}</Text>
              </View>
            </View>

            {/* ── REQUEST STATUS ──────────────────────────────────────────────── */}
            <Text style={styles.sectionTitle}>{t('customer.track.status')}</Text>
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
                      <Text style={styles.stepTitle}>{stepText(copy.title)}</Text>
                      {step.at !== null ? (
                        <Text style={styles.stepTimestamp}>{formatSupportDateTime(step.at)}</Text>
                      ) : step.state === 'pending' ? (
                        <Text style={styles.stepPending}>{t('customer.track.pending')}</Text>
                      ) : null}
                      <Text style={step.state === 'pending' ? styles.stepDescriptionMuted : styles.stepDescription}>
                        {stepText(step.state === 'pending' || step.state === 'current' ? copy.pending ?? copy.done : copy.done)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* ── REQUEST UPDATES ─────────────────────────────────────────────── */}
            <Text style={styles.sectionTitle}>{t('customer.track.updates')}</Text>
            <View style={styles.updatesTimeline}>
              <View style={styles.updatesGuideLine} />
              {messages.length === 0 ? (
                <Text style={styles.updateMessage}>{t('customer.track.noUpdates')}</Text>
              ) : (
                messages.map((m) => (
                  <View key={m.id} style={styles.updateRow}>
                    <View style={styles.updateDot} />
                    <View style={[styles.updateCard, m.sender === 'SUPPORT' ? styles.updateCardActive : styles.updateCardNeutral]}>
                      <View style={styles.updateCardHeader}>
                        <View style={styles.updateHeaderLeft}>
                          <HeadsetSvg color={m.sender === 'SUPPORT' ? customerColors.primary : customerColors.neutral.neutral700} size={18} />
                          <Text style={styles.updateTeamTitle}>{m.sender === 'SUPPORT' ? t('customer.track.supportTeam') : t('customer.track.you')}</Text>
                        </View>
                        <Text style={styles.updateTimestamp}>{formatSupportDateTime(m.createdAt)}</Text>
                      </View>
                      <Text style={styles.updateMessage}>{m.redacted ? t('customer.track.redacted') : m.message}</Text>
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
                    borderColor: customerColors.neutral.neutral300,
                    borderRadius: 12,
                    padding: 12,
                    minHeight: 70,
                    textAlignVertical: 'top',
                  }}
                  placeholder={t('customer.track.replyPlaceholder')}
                  placeholderTextColor={customerColors.neutral.neutral500}
                  value={replyText}
                  onChangeText={setReplyText}
                  maxLength={MESSAGE_MAX}
                  multiline
                  accessibilityLabel={t('customer.track.replyA11y')}
                />
                <TouchableOpacity
                  style={[styles.cancelButton, { marginTop: 10, borderColor: customerColors.brand, backgroundColor: replyText.trim() === '' ? customerColors.neutral.neutral100 : customerColors.primary }]}
                  activeOpacity={0.8}
                  disabled={replyText.trim() === '' || reply.isPending}
                  onPress={() => void doReply()}
                  accessibilityLabel={t('customer.track.sendReply')}
                >
                  {reply.isPending ? (
                    <ActivityIndicator color={customerColors.white} />
                  ) : (
                    <Text style={[styles.cancelButtonText, { color: replyText.trim() === '' ? customerColors.neutral.neutral500 : customerColors.white }]}>{t('customer.track.sendReply')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : null}

            {actionError !== null ? (
              <Text style={{ color: customerColors.shared.error, fontSize: 12, marginBottom: 10 }} accessibilityRole="alert">
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
                accessibilityLabel={t('customer.track.cancelRequest')}
              >
                {cancel.isPending ? <ActivityIndicator /> : <Text style={styles.cancelButtonText}>{t('customer.track.cancelRequest')}</Text>}
              </TouchableOpacity>
            ) : ticket.status === 'CANCELLED' ? (
              <View style={[styles.cancelButton, styles.cancelButtonDisabled]}>
                <Text style={styles.cancelButtonText}>{t('customer.track.requestCancelled')}</Text>
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
    backgroundColor: customerColors.white,
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
    backgroundColor: customerColors.white,
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
    borderColor: customerColors.heading,
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
    backgroundColor: customerColors.palette.green.successWash,
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
    color: customerColors.neutral.neutral700,
  },
  supportIdValue: {
    fontSize: 15,
    fontWeight: '700',
    color: customerColors.neutral.neutral950,
  },

  /* Section Title */
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: customerColors.heading,
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
    color: customerColors.neutral.neutral600,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: customerColors.neutral.neutral950,
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
    backgroundColor: customerColors.primary,
  },
  connectorGray: {
    backgroundColor: customerColors.neutral.neutral300,
  },
  stepContent: {
    flex: 1,
    paddingBottom: 20,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: customerColors.neutral.neutral950,
  },
  stepTimestamp: {
    fontSize: 12,
    color: customerColors.neutral.neutral600,
    marginTop: 2,
  },
  stepPending: {
    fontSize: 12,
    color: customerColors.neutral.neutral600,
    marginTop: 2,
  },
  stepDescription: {
    fontSize: 12.5,
    color: customerColors.neutral.neutral700,
    lineHeight: 18,
    marginTop: 4,
  },
  stepDescriptionMuted: {
    fontSize: 12.5,
    color: customerColors.neutral.neutral600,
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
    backgroundColor: customerColors.palette.green.pastel,
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
    backgroundColor: customerColors.primary,
    zIndex: 1,
  },
  updateCard: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  updateCardActive: {
    backgroundColor: customerColors.palette.green.successWash,
  },
  updateCardNeutral: {
    backgroundColor: customerColors.white,
    borderWidth: 1,
    borderColor: customerColors.neutral.neutral300,
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
    color: customerColors.neutral.neutral950,
  },
  updateTimestamp: {
    fontSize: 11,
    color: customerColors.neutral.neutral600,
  },
  updateMessage: {
    fontSize: 12.5,
    color: customerColors.neutral.neutral800,
    lineHeight: 18,
  },

  /* Cancel Button */
  cancelButton: {
    borderWidth: 1.5,
    borderColor: customerColors.primary,
    borderRadius: 28,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: customerColors.white,
  },
  cancelButtonDisabled: {
    borderColor: customerColors.neutral.neutral500,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: customerColors.primary,
  },
});

