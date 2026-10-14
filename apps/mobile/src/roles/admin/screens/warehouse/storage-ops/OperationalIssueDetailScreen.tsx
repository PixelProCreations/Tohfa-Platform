/**
 * Operational Issue Detail: one issue's information, location, description,
 * evidence, reporter and resolution.
 *
 * Gate (FINAL_LIST 132): none; read-only. A resolve / update action would need
 * a new rbac code (SPEC_GAPS W4v-1), so none is offered. Scope-locked: an
 * issue outside the viewer's warehouse renders "not found" (no existence leak).
 * The warehouse label comes from the issue's warehouse id, not a fixed name.
 */
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { adminColors, adminRadius, adminSpacing } from '../../../theme';
import {
  EmptyState,
  InfoCard,
  inScope,
  ScopeHeader,
  SectionTitle,
  StatusBadge,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { OPERATIONAL_ISSUES, storageWarehouseName } from './fixtures';
import { ISSUE_STATUS_TONE } from './OperationalIssuesScreen';
import { ImageIcon } from './StorageParts';
import type { OperationalIssue, WarehouseScreenBaseProps } from './types';

export interface OperationalIssueDetailScreenProps extends WarehouseScreenBaseProps {
  issueId?: string | undefined;
  issues?: readonly OperationalIssue[] | undefined;
}

export function OperationalIssueDetailScreen({ scope, onBack, issueId, issues = OPERATIONAL_ISSUES }: OperationalIssueDetailScreenProps) {
  const issue = issues.find((i) => i.id === issueId && inScope(scope, i.warehouseId));

  if (issue === undefined) {
    return (
      <WalletScreen title="Issue Detail" onBack={onBack} headerExtra={<ScopeHeader scope={scope} />}>
        <EmptyState title="Issue not found" subtitle="This issue is not available in your warehouse." />
      </WalletScreen>
    );
  }

  return (
    <WalletScreen
      title="Issue Detail"
      subtitle={issue.id}
      onBack={onBack}
      headerExtra={<ScopeHeader scope={scope} label={storageWarehouseName(issue.warehouseId)} />}
      footer={
        <WalletFooter>
          <WalletButton label="Back to Issues" onPress={onBack} />
        </WalletFooter>
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <SectionTitle right={<StatusBadge label={issue.status} tone={ISSUE_STATUS_TONE[issue.status]} />}>Issue Information</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: 'Issue ID', value: issue.id },
              { label: 'Issue Type', value: issue.type },
            ],
            [
              { label: 'Status', value: issue.status },
              { label: 'Reported Date', value: issue.reportedDate },
            ],
            ...(issue.severity !== undefined ? [[{ label: 'Severity', value: issue.severity }]] : []),
          ]}
        />

        <SectionTitle>Location</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: 'Warehouse', value: storageWarehouseName(issue.warehouseId) },
              { label: 'Location', value: issue.location },
            ],
          ]}
        />

        <SectionTitle>Description</SectionTitle>
        <InfoCard rows={[[{ label: issue.title, value: issue.description }]]} />

        {issue.evidenceCount > 0 ? (
          <>
            <SectionTitle>Evidence</SectionTitle>
            <View style={styles.evidenceRow}>
              {Array.from({ length: issue.evidenceCount }, (_, i) => (
                <View key={i} style={styles.evidenceBox} accessibilityLabel={`Evidence photo ${i + 1}`}>
                  <ImageIcon />
                </View>
              ))}
            </View>
          </>
        ) : null}

        <SectionTitle>Reporter</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: 'Reported By', value: issue.reportedBy },
              { label: 'Date / Time', value: issue.reportedAt },
            ],
          ]}
        />

        <SectionTitle>Resolution</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: 'Resolved By', value: issue.resolvedBy ?? '—' },
              { label: 'Resolved At', value: issue.resolvedAt ?? '—' },
            ],
          ]}
        />
      </ScrollView>
    </WalletScreen>
  );
}

const EVIDENCE_BOX = 84;

const styles = StyleSheet.create({
  evidenceRow: { flexDirection: 'row', gap: adminSpacing.md },
  evidenceBox: {
    width: EVIDENCE_BOX,
    height: EVIDENCE_BOX,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.warning.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
