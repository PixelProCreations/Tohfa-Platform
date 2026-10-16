import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import {
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import type { ReportIssueMode, WarehouseScreenBaseProps } from './types';

function EyeIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function GreenCheckCircleIcon({ size = 56, color = adminColors.success.text }: { size?: number; color?: string }) {
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
  showViewIssueButton?: boolean | undefined;
}

export function IssueSubmittedScreen({
  onBack,
  mode = 'operational',
  submittedId = 'ISS-0029',
  onDone,
  showViewIssueButton,
}: IssueSubmittedScreenProps) {
  const isSupport = mode === 'support';
  const showButton = showViewIssueButton ?? !isSupport;
  const handleBack = onBack ?? onDone;

  return (
    <WalletScreen
      title="Issue Submitted"
      onBack={handleBack}
      footer={
        showButton ? (
          <WalletFooter>
            <WalletButton
              label="View Issue"
              icon={<EyeIcon />}
              onPress={onDone}
            />
          </WalletFooter>
        ) : undefined
      }
    >
      <ScrollView contentContainerStyle={[walletLayout.scrollContent, styles.content]} showsVerticalScrollIndicator={false}>
        <View style={styles.iconWrap}>
          <GreenCheckCircleIcon size={56} />
        </View>
        <Text style={styles.title}>Issue Submitted</Text>

        <View style={styles.card}>
          <View style={styles.column}>
            <Text style={styles.label}>Issue ID</Text>
            <Text style={styles.value}>{submittedId}</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>Status</Text>
            <Text style={styles.value}>Open</Text>
          </View>
        </View>
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingTop: 48,
  },
  iconWrap: {
    marginBottom: adminSpacing.lg,
  },
  title: {
    ...adminType.title,
    color: adminColors.ink,
    textAlign: 'center',
    marginBottom: adminSpacing.xl,
  },
  card: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 18,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  column: {
    flex: 1,
  },
  label: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: 6,
  },
  value: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
});
