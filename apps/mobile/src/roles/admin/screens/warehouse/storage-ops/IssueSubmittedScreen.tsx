import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { adminColors, adminSpacing } from '../../../theme';
import {
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import type { ReportIssueMode, WarehouseScreenBaseProps } from './types';

function EyeIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
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

function GreenCheckCircleIcon({ size = 56, color = '#0D8A68' }: { size?: number; color?: string }) {
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
}

export function IssueSubmittedScreen({
  submittedId = 'ISS-0029',
  onDone,
}: IssueSubmittedScreenProps) {
  return (
    <WalletScreen
      title="Issue Submitted"
      footer={
        <WalletFooter>
          <WalletButton
            label="View Issue"
            icon={<EyeIcon />}
            onPress={onDone}
          />
        </WalletFooter>
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
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 28,
  },
  card: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 18,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  column: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 6,
  },
  value: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
});
