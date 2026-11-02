// Design id: M13-04
/**
 * System Messages: the announcements visible to the signed-in admin
 * (GET /system-messages, BR-65), newest first, with pull-to-refresh and
 * load-more. Tapping a message opens its detail sheet, where "Mark as read" is
 * a real POST /system-messages/{id}/read.
 *
 * Controlled: NotificationsFlow fetches and does the write; this screen only
 * draws them. The sheet looks the open message up in `messages` by id, so the
 * read state it shows is the refetched one, not a stale copy.
 *
 * Only what the API carries is shown: title, body, the IST start day and the
 * time window (startsAt / endsAt) and the viewer's read state. The design's
 * "Message Type" and "Message ID" are not drawn: a SystemMessage has no type
 * or category and no human message number, only a uuid (BR-82 keeps admin
 * categories as stored preferences only, so none is inferred either).
 */
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Modal, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { adminErrorKey } from '../../../api/errors';
import { t } from '../../../i18n';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import { InfoCard, StatusBadge, WalletButton, WalletScreen } from '../wallet-cashtopup/WalletParts';
import { CategoryBadge } from './NotificationParts';
import type { SystemMessageRow, WarehouseScreenBaseProps } from './types';

export interface SystemMessagesScreenProps extends WarehouseScreenBaseProps {
  messages: readonly SystemMessageRow[];
  /** Marks one message read; absent = the viewer may not (the control is not drawn). */
  onMarkRead?: ((id: string) => void) | undefined;
  /** The id whose mark-read request is in flight (its button is disabled). */
  markingId?: string | undefined;
  /** The last mark-read failure and the id it was for; shown only in that message's sheet. */
  markError?: unknown;
  markErrorId?: string | undefined;
  /** First load in flight (nothing to show yet). */
  isLoading?: boolean | undefined;
  error?: unknown;
  onRetry?: (() => void) | undefined;
  onRefresh?: (() => void) | undefined;
  isRefreshing?: boolean | undefined;
  onLoadMore?: (() => void) | undefined;
  hasMore?: boolean | undefined;
}

export function SystemMessagesScreen({
  onBack,
  messages,
  onMarkRead,
  markingId,
  markError,
  markErrorId,
  isLoading = false,
  error,
  onRetry,
  onRefresh,
  isRefreshing = false,
  onLoadMore,
  hasMore = false,
}: SystemMessagesScreenProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const view = queryViewState({ isLoading, error, itemCount: messages.length });
  const open = openId === null ? undefined : messages.find((m) => m.id === openId);

  const renderItem = ({ item }: { item: SystemMessageRow }) => (
    <TouchableOpacity style={styles.card} onPress={() => setOpenId(item.id)} activeOpacity={0.75} accessibilityRole="button">
      <CategoryBadge category="system" />
      <View style={styles.cardText}>
        <View style={styles.titleRow}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          {item.isRead ? null : (
            <View style={styles.unreadDot} accessibilityLabel={t('systemMessages.status.unread')} />
          )}
        </View>
        <Text style={styles.cardBody} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.cardDate}>{item.date}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <WalletScreen title={t('systemMessages.title')} onBack={onBack}>
      {view === 'loading' ? (
        <AdminLoadingState />
      ) : view === 'error' ? (
        <AdminErrorState error={error} onRetry={onRetry} />
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          onEndReached={hasMore ? onLoadMore : undefined}
          onEndReachedThreshold={0.5}
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[adminColors.brand]} tintColor={adminColors.brand} />
            ) : undefined
          }
          ListEmptyComponent={<AdminEmptyState title={t('systemMessages.empty.title')} subtitle={t('systemMessages.empty.subtitle')} />}
          ListFooterComponent={hasMore ? <ActivityIndicator style={styles.footerSpinner} color={adminColors.brand} /> : null}
        />
      )}

      <MessageSheet
        message={open}
        onClose={() => setOpenId(null)}
        onMarkRead={onMarkRead}
        marking={open !== undefined && markingId === open.id}
        markError={open !== undefined && markErrorId === open.id ? markError : undefined}
      />
    </WalletScreen>
  );
}

/** The detail sheet of one message, with its mark-read control. */
function MessageSheet({
  message,
  onClose,
  onMarkRead,
  marking,
  markError,
}: {
  message: SystemMessageRow | undefined;
  onClose: () => void;
  onMarkRead?: ((id: string) => void) | undefined;
  marking: boolean;
  markError: unknown;
}) {
  const showMark = message !== undefined && !message.isRead && onMarkRead !== undefined;
  const failed = markError !== null && markError !== undefined;
  return (
    <Modal visible={message !== undefined} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.sheetBackdrop}>
        {message === undefined ? null : (
          <View style={styles.sheet}>
            <View style={styles.sheetHead}>
              <CategoryBadge category="system" />
              <Text style={styles.sheetTitle}>{message.title}</Text>
            </View>
            <Text style={styles.sheetBody}>{message.message}</Text>
            <InfoCard
              rows={[
                [
                  { label: t('systemMessages.field.date'), value: message.date },
                  { label: t('systemMessages.field.time'), value: message.window },
                ],
              ]}
            />
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>{t('systemMessages.field.status')}</Text>
              <StatusBadge
                label={message.isRead ? t('systemMessages.status.read') : t('systemMessages.status.unread')}
                tone={message.isRead ? 'success' : 'brandSoft'}
              />
            </View>
            {showMark && failed ? <Text style={styles.errorText}>{t(adminErrorKey(markError))}</Text> : null}
            <View style={styles.sheetActions}>
              {showMark ? (
                <WalletButton
                  label={marking ? t('systemMessages.marking') : t('systemMessages.markRead')}
                  onPress={() => onMarkRead?.(message.id)}
                  disabled={marking}
                />
              ) : null}
              <WalletButton label={t('systemMessages.close')} variant="neutral" onPress={onClose} />
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

// The unread marker: a dot, sized like the notification list's.
const UNREAD_DOT = 8;

const styles = StyleSheet.create({
  listContent: { padding: adminSpacing.lg, gap: adminSpacing.md, flexGrow: 1 },
  card: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
  },
  cardText: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.sm },
  cardTitle: { ...adminType.rowTitle, color: adminColors.ink, flexShrink: 1 },
  unreadDot: { width: UNREAD_DOT, height: UNREAD_DOT, borderRadius: adminRadius.full, backgroundColor: adminColors.brand },
  cardBody: { ...adminType.body, color: adminColors.muted, marginTop: adminSpacing.xs },
  cardDate: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xs },
  footerSpinner: { paddingVertical: adminSpacing.lg },

  // No translucent scrim token exists, so (as ConfirmDialog) a solid canvas
  // backdrop with the sheet raised by adminShadow.lg.
  sheetBackdrop: { flex: 1, backgroundColor: adminColors.canvas, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: adminRadius.xl,
    borderTopRightRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    gap: adminSpacing.md,
    ...adminShadow.lg,
  },
  sheetHead: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.md },
  sheetTitle: { ...adminType.sectionHead, color: adminColors.ink, flex: 1 },
  sheetBody: { ...adminType.body, color: adminColors.ink },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusLabel: { ...adminType.rowMeta, color: adminColors.muted },
  errorText: { ...adminType.rowMeta, color: adminColors.danger.text },
  sheetActions: { gap: adminSpacing.sm },
});
