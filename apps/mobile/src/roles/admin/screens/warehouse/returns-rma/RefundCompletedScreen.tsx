/**
 * Refund Completed — the result of the wallet refund (plan phase 10).
 *
 * Shows what the server confirmed: the amount (Money from the response, in
 * integer paise, formatted by formatPaise) and the wallet transaction id, and
 * the return's real status trail (GET /admin/returns/{id}/history). A deep
 * link that carries no refund result shows the trail with no amount rather
 * than an invented one.
 *
 * Gates (docs/rbac.json; the server re-checks, CLAUDE.md 2.1):
 *   - none for the result itself; the "View Return History" link is offered
 *     only with `rma.request.process`.
 */
// Design id: M10-S05C
import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { t } from '../../../i18n';
import { adminColors, adminSpacing, adminType } from '../../../theme';
import { RETURN_CODES } from './mappers';
import { InfoCard, ResultHero, ReturnsButton, ReturnsFooter, ReturnsScreen, ReturnsTimeline, SectionTitle } from './ReturnsParts';
import type { ReturnRefundParams, ReturnTimelineEntry, WarehouseScreenBaseProps } from './types';

export interface RefundCompletedScreenProps extends WarehouseScreenBaseProps {
  reference?: string | undefined;
  /** The refund the server confirmed; undefined on a deep link. */
  refund?: ReturnRefundParams | undefined;
  timeline: readonly ReturnTimelineEntry[];
  onViewReturnHistory?: (() => void) | undefined;
}

function SuccessCheckmarkIcon() {
  return (
    <Svg width={34} height={34} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={adminColors.success.text} strokeWidth="2.2" />
      <Path
        d="M8 12l2.5 2.5 5.5-5.5"
        stroke={adminColors.success.text}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function RefundCompletedScreen({ can, reference, refund, timeline, onBack, onViewReturnHistory }: RefundCompletedScreenProps) {
  const noValue = t('returns.noValue');
  const showHistoryLink = can(RETURN_CODES.view) && onViewReturnHistory !== undefined;

  return (
    <ReturnsScreen
      title={t('returns.refund.completedTitle')}
      subtitle={reference}
      onBack={onBack}
      footer={
        showHistoryLink ? (
          <ReturnsFooter>
            <ReturnsButton label={t('returns.refund.viewHistory')} onPress={() => onViewReturnHistory?.()} />
          </ReturnsFooter>
        ) : null
      }
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ResultHero tone="success" icon={<SuccessCheckmarkIcon />} title={t('returns.refund.completedTitle')} subtitle={reference} />

        <InfoCard
          rows={[
            [{ label: t('returns.refund.amount'), value: refund?.amountLabel ?? noValue }],
            [{ label: t('returns.refund.transaction'), value: refund?.walletTransactionId ?? noValue }],
          ]}
        />

        <SectionTitle>{t('returns.detail.timeline')}</SectionTitle>
        {timeline.length === 0 ? <Text style={styles.muted}>{t('returns.detail.timelineEmpty')}</Text> : <ReturnsTimeline items={timeline} />}
      </ScrollView>
    </ReturnsScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: adminSpacing.lg, paddingBottom: adminSpacing.xxl },
  muted: { ...adminType.rowMeta, color: adminColors.muted },
});
