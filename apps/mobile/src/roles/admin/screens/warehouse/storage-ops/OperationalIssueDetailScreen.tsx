import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAdminQuery } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import { getWarehouseIssue } from '../../../api/warehouseIssues';
import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import {
  AdminEmptyState,
  AdminErrorState,
  AdminLoadingState,
} from '../shared/AsyncStates';
import { useWarehouseOptions } from '../shared/useWarehouseOptions';
import {
  InfoCard,
  ScopeHeader,
  SectionTitle,
  StatusBadge,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { ISSUE_STATUS_TONE } from './OperationalIssuesScreen';
import { STORAGE_CODES } from './StorageParts';
import type { WarehouseScreenBaseProps } from './types';

export interface OperationalIssueDetailScreenProps extends WarehouseScreenBaseProps {
  issueId?: string | undefined;
  warehouseId?: string | undefined;
}

export function OperationalIssueDetailScreen({
  scope,
  can,
  onBack,
  issueId,
  warehouseId,
}: OperationalIssueDetailScreenProps) {
  const { options } = useWarehouseOptions();
  const effectiveWarehouseId = warehouseId ?? scope.warehouseId ?? options[0]?.warehouseId;
  const canView = can(STORAGE_CODES.issueView);

  const issueQuery = useAdminQuery(
    adminKeys.detail('warehouseIssues', issueId ?? 'none'),
    (signal) => getWarehouseIssue(effectiveWarehouseId as string, issueId as string, signal),
    { enabled: !!effectiveWarehouseId && !!issueId && canView },
  );

  const issue = issueQuery.data;
  const warehouseName =
    options.find((o) => o.warehouseId === issue?.warehouseId)?.warehouseName ??
    scope.warehouseName ??
    '';

  if (!canView) {
    return (
      <WalletScreen title={t('storageOps.issues.detailTitle')} onBack={onBack}>
        <AdminEmptyState
          title={t('storageOps.issues.notAvailable.title')}
          subtitle={t('storageOps.issues.notAvailable.subtitle')}
        />
      </WalletScreen>
    );
  }

  if (!issueId || !effectiveWarehouseId) {
    return (
      <WalletScreen title={t('storageOps.issues.detailTitle')} onBack={onBack}>
        <AdminEmptyState
          title={t('storageOps.issues.empty')}
          subtitle={t('storageOps.issues.emptyHint')}
        />
      </WalletScreen>
    );
  }

  return (
    <WalletScreen
      title={t('storageOps.issues.detailTitle')}
      subtitle={issue?.issueNumber}
      onBack={onBack}
      headerExtra={warehouseName ? <ScopeHeader scope={scope} label={warehouseName} /> : undefined}
      footer={
        <WalletFooter>
          <WalletButton label={t('storageOps.issues.back')} onPress={onBack} />
        </WalletFooter>
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        {issueQuery.isLoading ? (
          <AdminLoadingState />
        ) : issueQuery.error ? (
          <AdminErrorState error={issueQuery.error} onRetry={() => issueQuery.refetch()} />
        ) : issue ? (
          <>
            <SectionTitle
              right={
                <StatusBadge
                  label={t(`storageOps.issues.status.${issue.status}`)}
                  tone={ISSUE_STATUS_TONE[issue.status] ?? 'default'}
                />
              }
            >
              {issue.issueNumber}
            </SectionTitle>

            <InfoCard
              rows={[
                [
                  { label: 'Category', value: t(`storageOps.issues.category.${issue.category}`) },
                  { label: 'Severity', value: t(`storageOps.issues.severity.${issue.severity}`) },
                ],
                [
                  { label: t('storageOps.issues.reportedOn'), value: issue.createdAt.slice(0, 10) },
                  { label: t('storageOps.issues.reportedBy'), value: issue.reportedBy.slice(0, 8) },
                ],
              ]}
            />

            <SectionTitle>{issue.title}</SectionTitle>
            <View style={styles.card}>
              <Text style={styles.descriptionText}>
                {issue.description || '—'}
              </Text>
            </View>

            {issue.resolutionNote ? (
              <>
                <SectionTitle>{t('storageOps.issues.resolution')}</SectionTitle>
                <View style={styles.card}>
                  <Text style={styles.resolutionText}>{issue.resolutionNote}</Text>
                  {issue.resolvedAt ? (
                    <Text style={styles.resolutionMeta}>
                      Resolved on: {issue.resolvedAt.slice(0, 10)}
                    </Text>
                  ) : null}
                </View>
              </>
            ) : null}

            {issue.comments && issue.comments.length > 0 ? (
              <>
                <SectionTitle>{t('storageOps.issues.comments')}</SectionTitle>
                <View style={styles.commentsList}>
                  {issue.comments.map((comment) => (
                    <View key={comment.id} style={styles.commentItem}>
                      <Text style={styles.commentBody}>{comment.body}</Text>
                      <Text style={styles.commentMeta}>
                        {comment.createdAt.slice(0, 10)} · {comment.authorId.slice(0, 8)}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            ) : null}
          </>
        ) : (
          <AdminEmptyState title={t('storageOps.issues.empty')} />
        )}
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  descriptionText: {
    ...adminType.body,
    color: adminColors.ink,
    lineHeight: 20,
  },
  resolutionText: {
    ...adminType.body,
    color: adminColors.ink,
    lineHeight: 20,
    marginBottom: adminSpacing.xs,
  },
  resolutionMeta: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  commentsList: {
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  commentItem: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
  },
  commentBody: {
    ...adminType.body,
    color: adminColors.ink,
    marginBottom: adminSpacing.xs,
  },
  commentMeta: {
    ...adminType.caption,
    color: adminColors.muted,
  },
});