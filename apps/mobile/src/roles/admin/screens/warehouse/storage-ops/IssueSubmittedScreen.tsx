/**
 * Issue Submitted / Request Submitted confirmation.
 *
 * Operational mode: shown after POST /warehouses/{id}/issues succeeded;
 * `submittedId` is the server's issue number and "View Issue" opens the
 * created issue (`onViewIssue`). A new issue always starts OPEN (BR-103), so
 * the status shown is the server's rule, not a guess.
 *
 * Support mode (Help & Support, ProfileFlow): unchanged behaviour, no View
 * Issue button unless the host asks for it.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { WalletButton, WalletFooter, WalletScreen, walletLayout } from '../wallet-cashtopup/WalletParts';
import { issueStatusLabel } from './mappers';
import type { ReportIssueMode, WarehouseScreenBaseProps } from './types';

function SuccessIcon({ size = 56, color = adminColors.success.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2.4" />
      <Path d="M7.8 12.2l2.8 2.8 5.6-5.6" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface IssueSubmittedScreenProps extends WarehouseScreenBaseProps {
  mode?: ReportIssueMode | undefined;
  submittedId?: string | undefined;
  onDone: () => void;
  /** Operational mode: open the created issue. Defaults to onDone. */
  onViewIssue?: (() => void) | undefined;
  showViewIssueButton?: boolean | undefined;
}

export function IssueSubmittedScreen({
  onBack,
  mode = 'operational',
  submittedId,
  onDone,
  onViewIssue,
  showViewIssueButton,
}: IssueSubmittedScreenProps) {
  const isSupport = mode === 'support';
  const showButton = showViewIssueButton ?? !isSupport;
  const handleBack = onBack ?? onDone;

  return (
    <WalletScreen
      title={t('storageOps.submitted.title')}
      onBack={handleBack}
      footer={
        showButton ? (
          <WalletFooter>
            <WalletButton label={t('storageOps.submitted.view')} onPress={onViewIssue ?? onDone} />
            {onViewIssue !== undefined ? (
              <>
                <View style={styles.gap} />
                <WalletButton label={t('storageOps.submitted.done')} variant="neutral" onPress={onDone} />
              </>
            ) : null}
          </WalletFooter>
        ) : undefined
      }
    >
      <ScrollView contentContainerStyle={[walletLayout.scrollContent, styles.content]} showsVerticalScrollIndicator={false}>
        <View style={styles.iconWrap}>
          <SuccessIcon />
        </View>
        <Text style={styles.title}>{t('storageOps.submitted.title')}</Text>

        <View style={styles.card}>
          <View style={styles.column}>
            <Text style={styles.label}>{t('storageOps.submitted.id')}</Text>
            <Text style={styles.value}>{submittedId ?? t('storageOps.notAvailable')}</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>{t('storageOps.submitted.status')}</Text>
            <Text style={styles.value}>{issueStatusLabel('OPEN')}</Text>
          </View>
        </View>
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  content: { alignItems: 'center', paddingTop: adminSpacing.xxl },
  iconWrap: { marginBottom: adminSpacing.lg },
  gap: { height: adminSpacing.sm },
  title: { ...adminType.title, color: adminColors.ink, textAlign: 'center', marginBottom: adminSpacing.xl },
  card: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    justifyContent: 'space-between',
  },
  column: { flex: 1 },
  label: { ...adminType.rowMeta, color: adminColors.muted, marginBottom: adminSpacing.xs },
  value: { ...adminType.sectionHead, color: adminColors.ink },
});
