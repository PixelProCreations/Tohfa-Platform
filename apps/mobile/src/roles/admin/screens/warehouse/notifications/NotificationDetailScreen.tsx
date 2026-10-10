// Design id: M1-S06
/**
 * Notification Detail — one notification, read-only.
 *
 * Was SubWarehouseNotificationDetailScreen (title + message card, reference
 * card, 'View Receiving' / 'View Wallet Report' button, warehouse pill) and
 * absorbs MainWarehouseNotificationDetailScreen (centered icon card, Reference
 * + Date fields, four types goods / wallet / order / stock). Both derived the
 * content from a three- or four-value `type`; it now comes from the
 * NotificationItem itself, so every category has a detail.
 *
 * Gates (FINAL_LIST #61): no client gate on the screen itself:
 * notification.own.view is `all` for every role in docs/rbac.json, so the
 * check only denied the screen while /auth/me had not loaded; the server
 * enforces the code and own-data. The action
 * button renders only when the target screen's own code passes (e.g.
 * wallet.cash_topup.process for the wallet report, canOpenTarget). The Main
 * header's settings icon had no handler and was not ported.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { adminColors, adminSpacing, adminType } from '../../../theme';
import { scopeLabel } from '../finance-expenses/FinanceParts';
import {
  Card,
  EmptyState,
  InfoCard,
  ScopeHeader,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { CategoryBadge, TARGET_DETAIL_LABEL, canOpenTarget } from './NotificationParts';
import type { NotificationItem, NotificationTarget, WarehouseScreenBaseProps } from './types';

export interface NotificationDetailScreenProps extends WarehouseScreenBaseProps {
  /** The notification to show; absent (a bare deep link) shows an empty state. */
  notification?: NotificationItem | undefined;
  /** Opens the notification's target (outside this module). */
  onOpenTarget?: ((target: NotificationTarget, item: NotificationItem) => void) | undefined;
}

export function NotificationDetailScreen({ scope, can, onBack, notification, onOpenTarget }: NotificationDetailScreenProps) {
  const target = notification?.target;
  const showAction = notification !== undefined && target !== undefined && onOpenTarget !== undefined && canOpenTarget(can, target);

  return (
    <WalletScreen
      title="Notification Detail"
      onBack={onBack}
      headerExtra={<ScopeHeader scope={scope} label={scopeLabel(scope)} />}
      footer={
        showAction && notification !== undefined && target !== undefined ? (
          <WalletFooter>
            <WalletButton label={TARGET_DETAIL_LABEL[target]} onPress={() => onOpenTarget?.(target, notification)} />
          </WalletFooter>
        ) : undefined
      }
    >
      <ScrollView contentContainerStyle={[walletLayout.scrollContent, styles.content]} showsVerticalScrollIndicator={false}>
        {notification === undefined ? (
          <EmptyState title="Notification not found" subtitle="It may have been cleared." />
        ) : (
          <>
            <Card centered>
              <CategoryBadge category={notification.category} />
              <Text style={styles.title}>{notification.title}</Text>
              <Text style={styles.message}>{notification.message}</Text>
              <Text style={styles.time}>{notification.timestamp}</Text>
            </Card>
            <InfoCard
              rows={[
                [
                  { label: 'Reference', value: notification.reference ?? '—' },
                  { label: 'Date', value: notification.date ?? notification.timestamp },
                ],
              ]}
            />
          </>
        )}
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  content: { gap: adminSpacing.md, paddingTop: adminSpacing.lg },
  title: { ...adminType.sectionHead, color: adminColors.ink, textAlign: 'center', marginTop: adminSpacing.md },
  message: { ...adminType.body, color: adminColors.muted, textAlign: 'center', marginTop: adminSpacing.sm },
  time: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.sm },
});
