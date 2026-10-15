/**
 * Operational Issue Detail, live from GET /warehouses/{id}/issues/{issueId}
 * (warehouse.issue.view; BR-103): the issue, its status history fields and
 * its comment thread.
 *
 * With `warehouse.issue.manage` (Main all, Sub own) the screen offers the
 * status moves BR-103 rule 3 allows from the current status (start, back to
 * open, resolve, reopen, close) as PATCH .../issues/{issueId}; resolving needs
 * a resolution note. A comment is POST .../comments, refused on a CLOSED
 * issue. The server decides every move again (409 INVALID_STATE_TRANSITION).
 *
 * Not shown, because the API does not carry them: a location, evidence
 * photos (there is no attachment endpoint) and people's names (only user
 * uuids, which mean nothing to staff). An issue of another warehouse is 404.
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { adminErrorKey } from '../../../api/errors';
import type { IssueStatusCode } from '../../../api/warehouseIssues';
import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import {
  InfoCard,
  SectionTitle,
  StatusBadge,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import {
  buildComment,
  buildStatusChange,
  canCommentOn,
  ISSUE_LIMITS,
  ISSUE_NEXT_STATUSES,
  issueActionLabel,
  toIssueCommentRow,
  toIssueRow,
} from './mappers';
import { STORAGE_CODES } from './StorageParts';
import type { StorageWarehouse } from './StorageWarehouse';
import { useAddIssueComment, useIssue, useUpdateIssue } from './useStorageData';
import type { WarehouseScreenBaseProps } from './types';

export interface OperationalIssueDetailScreenProps extends WarehouseScreenBaseProps {
  warehouse: StorageWarehouse;
  issueId?: string | undefined;
}

export function OperationalIssueDetailScreen({ can, onBack, warehouse, issueId }: OperationalIssueDetailScreenProps) {
  const issue = useIssue(warehouse.warehouseId, issueId);
  const update = useUpdateIssue(warehouse.warehouseId, issueId);
  const comment = useAddIssueComment(warehouse.warehouseId, issueId);
  const [resolving, setResolving] = useState(false);
  const [note, setNote] = useState('');
  const [commentText, setCommentText] = useState('');
  const [formError, setFormError] = useState<string | undefined>(undefined);
  const canManage = can(STORAGE_CODES.issueManage);

  const detail = issue.detail;
  const now = new Date();
  const row = detail === undefined ? undefined : toIssueRow(detail, now);

  const changeStatus = (to: IssueStatusCode) => {
    if (to === 'RESOLVED' && !resolving) {
      setResolving(true);
      setFormError(undefined);
      return;
    }
    const built = buildStatusChange(to, note);
    if (!built.ok) {
      setFormError(t(built.error));
      return;
    }
    setFormError(undefined);
    update.mutate(built.body, {
      onSuccess: () => {
        setResolving(false);
        setNote('');
      },
      onError: (err) => setFormError(t(adminErrorKey(err))),
    });
  };

  const sendComment = () => {
    const built = buildComment(commentText);
    if (!built.ok) {
      setFormError(t(built.error));
      return;
    }
    setFormError(undefined);
    comment.mutate(built.body, {
      onSuccess: () => setCommentText(''),
      onError: (err) => setFormError(t(adminErrorKey(err))),
    });
  };

  const busy = update.isPending || comment.isPending;
  const nextStatuses = row === undefined ? [] : ISSUE_NEXT_STATUSES[row.status];

  return (
    <WalletScreen
      title={t('storageOps.issue.title')}
      subtitle={row?.issueNumber}
      onBack={onBack}
      headerExtra={warehouse.header}
      footer={
        <WalletFooter>
          <WalletButton label={t('storageOps.issue.back')} variant="neutral" onPress={onBack} />
        </WalletFooter>
      }
    >
      {warehouse.placeholder ??
        (row === undefined || detail === undefined ? (
          issue.isLoading ? (
            <AdminLoadingState />
          ) : (
            <AdminErrorState error={issue.error} onRetry={issue.refresh} />
          )
        ) : (
          <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <SectionTitle right={<StatusBadge label={row.statusLabel} tone={row.statusTone} />}>{row.title}</SectionTitle>
            <InfoCard
              rows={[
                [
                  { label: t('storageOps.issue.field.number'), value: row.issueNumber },
                  { label: t('storageOps.issue.field.category'), value: row.categoryLabel },
                ],
                [
                  { label: t('storageOps.issue.field.severity'), value: row.severityLabel },
                  { label: t('storageOps.issue.field.reported'), value: row.reportedAt },
                ],
                [
                  { label: t('storageOps.issue.field.warehouse'), value: warehouse.warehouseName ?? t('storageOps.notAvailable') },
                  {
                    label: t('storageOps.issue.field.assigned'),
                    value: t(row.isAssigned ? 'storageOps.issue.assigned.yes' : 'storageOps.issue.assigned.no'),
                  },
                ],
              ]}
            />

            <SectionTitle>{t('storageOps.issue.section.description')}</SectionTitle>
            <InfoCard rows={[[{ label: row.title, value: row.description ?? t('storageOps.issue.noDescription') }]]} />

            {row.resolvedAt !== undefined || row.resolutionNote !== undefined || row.closedAt !== undefined ? (
              <>
                <SectionTitle>{t('storageOps.issue.section.resolution')}</SectionTitle>
                <InfoCard
                  rows={[
                    [
                      { label: t('storageOps.issue.field.resolvedAt'), value: row.resolvedAt ?? t('storageOps.notAvailable') },
                      { label: t('storageOps.issue.field.closedAt'), value: row.closedAt ?? t('storageOps.notAvailable') },
                    ],
                    [{ label: t('storageOps.issue.field.resolutionNote'), value: row.resolutionNote ?? t('storageOps.notAvailable') }],
                  ]}
                />
              </>
            ) : null}

            {canManage && nextStatuses.length > 0 ? (
              <>
                <SectionTitle>{t('storageOps.issue.section.actions')}</SectionTitle>
                {resolving ? (
                  <TextInput
                    style={styles.input}
                    placeholder={t('storageOps.issue.notePlaceholder')}
                    placeholderTextColor={adminColors.placeholder}
                    value={note}
                    onChangeText={setNote}
                    maxLength={ISSUE_LIMITS.resolutionNote}
                    multiline
                    textAlignVertical="top"
                  />
                ) : null}
                <View style={styles.actions}>
                  {nextStatuses.map((to) => (
                    <WalletButton
                      key={to}
                      label={issueActionLabel(row.status, to)}
                      variant={to === 'RESOLVED' ? 'primary' : 'outline'}
                      disabled={busy}
                      onPress={() => changeStatus(to)}
                    />
                  ))}
                </View>
              </>
            ) : null}

            {formError !== undefined ? <Text style={styles.error}>{formError}</Text> : null}

            <SectionTitle>{t('storageOps.issue.section.comments')}</SectionTitle>
            {detail.comments.length === 0 ? (
              <Text style={styles.muted}>{t('storageOps.issue.noComments')}</Text>
            ) : (
              detail.comments.map((c) => {
                const crow = toIssueCommentRow(c, now);
                return (
                  <View key={crow.id} style={styles.comment}>
                    <Text style={styles.commentBody}>{crow.body}</Text>
                    <Text style={styles.muted}>{crow.at}</Text>
                  </View>
                );
              })
            )}
            {canManage && canCommentOn(row.status) ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholder={t('storageOps.issue.commentPlaceholder')}
                  placeholderTextColor={adminColors.placeholder}
                  value={commentText}
                  onChangeText={setCommentText}
                  maxLength={ISSUE_LIMITS.comment}
                  multiline
                  textAlignVertical="top"
                />
                <WalletButton label={t('storageOps.issue.addComment')} variant="outline" disabled={busy} onPress={sendComment} />
              </>
            ) : null}
          </ScrollView>
        ))}
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  actions: { gap: adminSpacing.sm },
  input: {
    ...adminType.body,
    color: adminColors.ink,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    minHeight: adminSpacing.xxl * 2,
    marginBottom: adminSpacing.md,
  },
  error: { ...adminType.rowMeta, color: adminColors.danger.text, marginTop: adminSpacing.sm },
  muted: { ...adminType.rowMeta, color: adminColors.muted },
  comment: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.sm,
    gap: adminSpacing.xs,
  },
  commentBody: { ...adminType.body, color: adminColors.ink },
});
