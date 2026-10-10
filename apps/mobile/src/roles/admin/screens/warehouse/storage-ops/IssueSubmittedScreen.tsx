/**
 * Request Submitted: confirmation after Report an Issue.
 *
 * Gate (FINAL_LIST 135): inherits `support.ticket.create_own` from Report an
 * Issue (MAIN none, SUB none today; SPEC_GAPS W4v-2); without it the screen
 * renders a not-available note. The button used to say "Back to Settings" on
 * every path; on the operational-issue path it now returns to the issue list.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import {
  BackArrowIcon,
  Card,
  EmptyState,
  SuccessCircleIcon,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { DEMO_SUBMITTED_ID } from './fixtures';
import { STORAGE_CODES } from './StorageParts';
import type { ReportIssueMode, WarehouseScreenBaseProps } from './types';

export interface IssueSubmittedScreenProps extends WarehouseScreenBaseProps {
  mode?: ReportIssueMode | undefined;
  submittedId?: string | undefined;
  /** Leave the confirmation (support: back to settings; operational: the issue list). */
  onDone: () => void;
}

export function IssueSubmittedScreen({ can, onBack, mode = 'support', submittedId, onDone }: IssueSubmittedScreenProps) {
  const operational = mode === 'operational';
  const title = operational ? 'Issue Reported' : 'Request Submitted';

  if (!can(STORAGE_CODES.issueReport)) {
    return (
      <WalletScreen title={title} onBack={onBack}>
        <EmptyState title="Issue reporting not available" subtitle="Your role does not include raising support or issue requests." />
      </WalletScreen>
    );
  }

  const id = submittedId ?? DEMO_SUBMITTED_ID[mode];

  return (
    <WalletScreen
      title={title}
      onBack={onDone}
      footer={
        <WalletFooter>
          <WalletButton
            label={operational ? 'Back to Operational Issues' : 'Back to Settings'}
            icon={<BackArrowIcon size={18} />}
            onPress={onDone}
          />
        </WalletFooter>
      }
    >
      <ScrollView contentContainerStyle={[walletLayout.scrollContent, styles.content]} showsVerticalScrollIndicator={false}>
        <View style={styles.iconCircle}>
          <SuccessCircleIcon />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{operational ? `Issue ID ${id}` : `Support ID ${id}`}</Text>
        <Card centered>
          <Text style={styles.info}>
            {operational
              ? 'The warehouse team will review the issue; track it under Operational Issues.'
              : 'Our support team will review your request.'}
          </Text>
        </Card>
      </ScrollView>
    </WalletScreen>
  );
}

const ICON_CIRCLE = 72;

const styles = StyleSheet.create({
  content: { alignItems: 'stretch', paddingTop: adminSpacing.xxl },
  iconCircle: {
    width: ICON_CIRCLE,
    height: ICON_CIRCLE,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.success.bg,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: adminSpacing.lg,
  },
  title: { ...adminType.title, color: adminColors.ink, textAlign: 'center' },
  subtitle: { ...adminType.body, color: adminColors.muted, textAlign: 'center', marginTop: adminSpacing.xs, marginBottom: adminSpacing.lg },
  info: { ...adminType.body, color: adminColors.ink, textAlign: 'center' },
});
