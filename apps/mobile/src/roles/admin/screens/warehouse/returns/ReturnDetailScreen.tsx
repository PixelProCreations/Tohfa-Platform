/**
 * Return detail — `GET /admin/returns/{id}` (rma.request.process).
 *
 * Actions follow BR-61 via mappers.ts `returnActions` (status + rbac grant):
 * PENDING -> inspect / reject; INSPECTED -> approve / reject; APPROVED ->
 * refund to wallet; anything else -> none. The server re-checks every
 * transition (409 INVALID_STATE_TRANSITION); on that error the detail is
 * refetched so the screen shows where the return actually is.
 *
 * Approve has no body, so it runs here behind an inline confirmation instead
 * of a separate screen. There is no bank-refund action (rma.refund.bank_process
 * is none for MW/SW).
 *
 * BR-30: another warehouse's return answers 404, rendered as not-found.
 */
import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Badge, Button } from '@tohfa/mobile-ui';
import { useAdminMutation, useAdminQuery } from '../../../api/hooks';
import { approveReturn, getReturn } from '../../../api/returns';
import { t } from '../../../i18n';
import { formatGramsAsKg, type Grams } from '../../../money/quantity';
import { useAdminSession } from '../../../session/AdminSession';
import { adminTheme } from '../../../theme';
import { isWarehouseFeatureVisible } from '../availability';
import { AsyncStates } from '../shared/AsyncStates';
import { InfoRow, InfoSection, MenuRow } from '../shared/InfoSection';
import { queryViewState } from '../shared/queryViewState';
import { ScreenHeader } from '../shared/ScreenHeader';
import {
  returnActions,
  returnDetailKey,
  returnTransitionInvalidationKeys,
  returnWriteErrorKey,
  toReturnDetail,
  type ReturnDetail,
  type ReturnItem,
} from './mappers';

const { colors, spacing, typography, weights } = adminTheme;

function kg(grams: Grams | null): string {
  return grams === null ? t('admin.returns.detail.notInspected') : t('admin.returns.detail.kg', { qty: formatGramsAsKg(grams) });
}

export function ReturnDetailScreen(props: {
  returnId: string;
  onBack: () => void;
  onInspect: (detail: ReturnDetail) => void;
  onReject: (detail: ReturnDetail) => void;
  onRefund: (detail: ReturnDetail) => void;
  onHistory: (returnId: string) => void;
}): React.JSX.Element {
  const { scope, can } = useAdminSession();
  const query = useAdminQuery(returnDetailKey(scope.warehouseId, props.returnId), async (signal) =>
    toReturnDetail(await getReturn(props.returnId, signal)),
  );
  const [confirmingApprove, setConfirmingApprove] = useState(false);
  const approve = useAdminMutation((id: string) => approveReturn(id), {
    invalidate: returnTransitionInvalidationKeys(scope.warehouseId),
    onSuccess: () => setConfirmingApprove(false),
  });

  const state = queryViewState(query, () => false);
  const detail = query.data;
  const actions = detail === undefined ? null : returnActions(detail.statusCode, can);
  const anyAction = actions !== null && (actions.inspect || actions.approve || actions.reject || actions.refundWallet);

  const runApprove = (): void => {
    if (detail === undefined || approve.isPending) return;
    approve.mutate(detail.id, {
      // A stale status means someone else moved it on: show the real one.
      onError: () => void query.refetch(),
    });
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <ScreenHeader
        title={t('admin.returns.detail.title')}
        subtitle={scope.warehouseName}
        onBack={approve.isPending ? undefined : props.onBack}
      />
      <AsyncStates state={state} error={query.error} onRetry={() => void query.refetch()}>
        {detail === undefined || actions === null ? null : (
          <ScrollView
            contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
            refreshControl={
              <RefreshControl
                refreshing={query.isRefetching}
                onRefresh={() => void query.refetch()}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          >
            <InfoSection title={t('admin.returns.detail.summary')}>
              <View style={styles.badgeRow}>
                <Badge label={t(detail.status.labelKey)} variant={detail.status.tone} />
              </View>
              <InfoRow label={t('admin.returns.detail.order')} value={detail.orderId} />
              <InfoRow label={t('admin.returns.detail.customer')} value={detail.customerId} />
              <InfoRow label={t('admin.returns.detail.reason')} value={detail.reason} />
              {detail.note === null ? null : <InfoRow label={t('admin.returns.detail.note')} value={detail.note} />}
              <InfoRow label={t('admin.returns.detail.created')} value={detail.createdAtLabel} />
              {detail.updatedAtLabel === null ? null : (
                <InfoRow label={t('admin.returns.detail.updated')} value={detail.updatedAtLabel} />
              )}
            </InfoSection>

            <InfoSection title={t('admin.returns.detail.items')}>
              {detail.items.map((item, index) => (
                <ItemBlock key={item.id} item={item} index={index} />
              ))}
            </InfoSection>

            {isWarehouseFeatureVisible('returnsHistory', can) ? (
              <InfoSection>
                <MenuRow
                  icon="history"
                  label={t('admin.returns.detail.history')}
                  onPress={() => props.onHistory(detail.id)}
                />
              </InfoSection>
            ) : null}

            {approve.isError ? (
              <Text accessibilityLiveRegion="polite" style={{ color: colors.error, fontSize: typography.bodySmall }}>
                {t(returnWriteErrorKey(approve.error))}
              </Text>
            ) : null}

            {actions.inspect ? (
              <Button title={t('admin.returns.actions.inspect')} onPress={() => props.onInspect(detail)} />
            ) : null}

            {actions.approve && !confirmingApprove ? (
              <Button title={t('admin.returns.actions.approve')} onPress={() => setConfirmingApprove(true)} />
            ) : null}
            {actions.approve && confirmingApprove ? (
              <InfoSection title={t('admin.returns.approve.confirmTitle')}>
                <Text style={{ color: colors.onSurfaceVariant, fontSize: typography.bodySmall }}>
                  {t('admin.returns.approve.confirmBody')}
                </Text>
                <Button
                  title={t('admin.returns.approve.confirm')}
                  loading={approve.isPending}
                  disabled={approve.isPending}
                  onPress={runApprove}
                />
                <Button
                  variant="outline"
                  title={t('admin.common.cancel')}
                  disabled={approve.isPending}
                  onPress={() => setConfirmingApprove(false)}
                />
              </InfoSection>
            ) : null}

            {actions.refundWallet ? (
              <Button title={t('admin.returns.actions.refundWallet')} onPress={() => props.onRefund(detail)} />
            ) : null}

            {actions.reject ? (
              <Button
                variant="danger"
                title={t('admin.returns.actions.reject')}
                disabled={approve.isPending}
                onPress={() => props.onReject(detail)}
              />
            ) : null}

            {anyAction ? null : (
              <Text style={{ color: colors.onSurfaceVariant, fontSize: typography.bodySmall }}>
                {t('admin.returns.detail.noActions')}
              </Text>
            )}
          </ScrollView>
        )}
      </AsyncStates>
    </View>
  );
}

function ItemBlock(props: { item: ReturnItem; index: number }): React.JSX.Element {
  const { item } = props;
  return (
    <View style={{ gap: spacing.xs, paddingVertical: spacing.xs }}>
      <Text style={{ color: colors.onSurface, fontSize: typography.body, fontWeight: weights.semibold }}>
        {t('admin.returns.detail.itemTitle', { n: props.index + 1 })}
      </Text>
      <InfoRow label={t('admin.returns.detail.requested')} value={kg(item.requestedGrams)} />
      <InfoRow label={t('admin.returns.detail.accepted')} value={kg(item.acceptedGrams)} />
      <InfoRow label={t('admin.returns.detail.damaged')} value={kg(item.damagedGrams)} />
      <InfoRow
        label={t('admin.returns.detail.condition')}
        value={item.conditionKey === null ? t('admin.returns.detail.notInspected') : t(item.conditionKey)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  badgeRow: { flexDirection: 'row' },
});
