/**
 * Request Rejected — the result of POST /admin/returns/{id}/reject (plan
 * phase 10). REJECTED is final (BR-61); Done goes back to the queue.
 */
// Design id: M10-S08
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { ResultHero, ReturnsButton, ReturnsFooter, ReturnsScreen } from './ReturnsParts';
import type { WarehouseScreenBaseProps } from './types';

export interface RequestRejectedScreenProps extends WarehouseScreenBaseProps {
  reference: string;
  onDone: () => void;
}

function RejectedIcon() {
  return (
    <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={adminColors.danger.text} strokeWidth="2" />
      <Path d="M15 9l-6 6M9 9l6 6" stroke={adminColors.danger.text} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function BellOutlineIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={adminColors.info.text} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={adminColors.info.text} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function RequestRejectedScreen({ onBack, reference, onDone }: RequestRejectedScreenProps) {
  return (
    <ReturnsScreen
      title={t('returns.rejected.title')}
      subtitle={reference}
      onBack={onBack}
      footer={
        <ReturnsFooter>
          <ReturnsButton label={t('returns.backToList')} onPress={onDone} />
        </ReturnsFooter>
      }
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ResultHero tone="danger" icon={<RejectedIcon />} title={t('returns.rejected.title')} subtitle={t('returns.rejected.subtitle', { ref: reference })} />
        <View style={styles.infoBox}>
          <BellOutlineIcon />
          <Text style={styles.infoText}>{t('returns.rejected.notice')}</Text>
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
    gap: adminSpacing.sm,
    padding: adminSpacing.md,
    backgroundColor: adminColors.info.bg,
    borderWidth: 1,
    borderColor: adminColors.info.border,
    borderRadius: adminRadius.lg,
  },
  infoText: { ...adminType.body, color: adminColors.info.text, flex: 1 },
});
