/**
 * Request Rejected — result screen after a return request was rejected.
 *
 * Gates: none needed; it is reachable only after the gated Reject action
 * (`rma.request.process`, FINAL_LIST row 99).
 *
 * Absorbs MainWarehouseRequestRejectedScreen (pair M10-S04X): same content
 * (its shorter notification text is covered by the Sub wording).
 */
// Design id: M10-S04X
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { ResultHero, ReturnsButton, ReturnsFooter, ReturnsScreen } from './ReturnsParts';
import type { RmaScreenBaseProps } from './types';

export interface RequestRejectedScreenProps extends RmaScreenBaseProps {
  onDone: () => void;
}

function CloseCircleIcon() {
  return (
    <Svg width={44} height={44} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={adminColors.danger.text} strokeWidth="2.2" />
      <Path d="M15 9l-6 6M9 9l6 6" stroke={adminColors.danger.text} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BellOutlineIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke={adminColors.info.text}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={adminColors.info.text} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckmarkIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={adminColors.onBrand} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function RequestRejectedScreen({ rma, onDone }: RequestRejectedScreenProps) {
  return (
    <ReturnsScreen
      title="Request Rejected"
      subtitle={rma.rmaId}
      onBack={onDone}
      footer={
        <ReturnsFooter>
          <ReturnsButton label="Done" icon={<CheckmarkIcon />} onPress={onDone} />
        </ReturnsFooter>
      }
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ResultHero tone="danger" icon={<CloseCircleIcon />} title="Return Request Rejected" subtitle={rma.rmaId} />
        <View style={styles.infoBox}>
          <BellOutlineIcon />
          <Text style={styles.infoText}>
            Customer notification will follow the configured notification workflow — shown as sent only once the
            backend confirms it.
          </Text>
        </View>
      </ScrollView>
    </ReturnsScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: adminSpacing.lg, paddingBottom: adminSpacing.xl },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: adminColors.info.bg,
    borderWidth: 1,
    borderColor: adminColors.info.border,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  infoText: { ...adminType.body, color: adminColors.info.text, flex: 1 },
});
