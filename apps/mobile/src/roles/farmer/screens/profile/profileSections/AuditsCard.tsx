import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ErrorState, Icon, Skeleton } from '@tohfa/mobile-ui';
import { QUARTERS_PER_FISCAL_YEAR, type FarmerAuditSummary } from '../../../api/audits';
import { t } from '../../../../../i18n/farmer';
import { authPalette as P } from '../../../theme';
import { auditCountdown, type WidgetState } from '../../dashboard/dashboardWidgets';
import { AuditHistoryRow } from './AuditHistoryRow';
import {
  auditPillValue,
  auditTypeKey,
  CARD_ACTION_HIT_SLOP,
  formatShortDate,
} from './profileHelpers';
import { styles } from './profileStyles';

interface AuditsCardProps {
  auditsState: WidgetState<FarmerAuditSummary[]>;
  auditItems: FarmerAuditSummary[];
  nextAudit: FarmerAuditSummary | null;
  pastAudits: FarmerAuditSummary[];
  auditsDoneThisYear: number;
  onViewAll: () => void;
  onRetry: () => void;
}

export function AuditsCard({
  auditsState,
  auditItems,
  nextAudit,
  pastAudits,
  auditsDoneThisYear,
  onViewAll,
  onRetry,
}: AuditsCardProps): React.JSX.Element {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.cardHeaderRow}>
        <View style={[styles.cardIconBox, styles.iconBoxLightBlue]}>
          <Icon name="assignment" size={18} color={P.lightBlue700} />
        </View>
        <View style={styles.cardHeaderTitleBox}>
          <Text style={styles.cardTitle}>{t('farmer.profile.audits.title')}</Text>
          <Text style={styles.cardSubtitle}>{t('farmer.profile.audits.subtitle')}</Text>
        </View>
        <TouchableOpacity onPress={onViewAll} hitSlop={CARD_ACTION_HIT_SLOP}>
          <Text style={styles.cardActionLink}>{t('farmer.common.viewAll')}</Text>
        </TouchableOpacity>
      </View>

      {auditsState.kind === 'loading' ? (
        <View>
          <Skeleton height={64} style={styles.skeletonGapLg} />
          <Skeleton height={44} style={styles.skeletonGapSm} />
          <Skeleton height={44} />
        </View>
      ) : auditsState.kind === 'error' ? (
        <ErrorState
          error={auditsState.error}
          message={t('farmer.audits.loadError')}
          retryTitle={t('farmer.common.retry')}
          offlineMessage={t('farmer.common.offline')}
          onRetry={onRetry}
        />
      ) : auditItems.length === 0 ? (
        <Text style={styles.certNoticeText}>{t('farmer.audits.empty.title')}</Text>
      ) : (
        <>
          {/* Next Audit Banner */}
          <View style={styles.nextAuditBanner}>
            <View style={styles.auditProgressSquare}>
              <Text style={styles.auditProgressFraction}>
                {t('farmer.profile.audits.scoreOutOf', {
                  score: auditsDoneThisYear,
                  max: QUARTERS_PER_FISCAL_YEAR,
                })}
              </Text>
              <Text style={styles.auditProgressDone}>{t('farmer.profile.audits.done')}</Text>
            </View>
            <View style={styles.nextAuditDetails}>
              <Text style={styles.nextAuditSubLabel}>{t('farmer.profile.audits.nextAudit')}</Text>
              <Text style={styles.nextAuditDateText}>
                {nextAudit
                  ? `${formatShortDate(nextAudit.scheduledFor)} · ${t(auditTypeKey(nextAudit.auditType))}`
                  : t('farmer.dashboard.header.auditNone')}
              </Text>
            </View>
            <View style={styles.auditDueRedPill}>
              <Text style={styles.auditDueRedText}>
                {auditPillValue(auditCountdown(nextAudit, new Date()))}
              </Text>
            </View>
          </View>

          {/* Past Audits List -- real COMPLETED audits only, most recent first. */}
          <View style={styles.auditList}>
            {pastAudits.length === 0 ? (
              <Text style={styles.certNoticeText}>{t('farmer.profile.audits.noPastYet')}</Text>
            ) : (
              pastAudits
                .slice(0, 3)
                .map((audit, idx, arr) => (
                  <AuditHistoryRow key={audit.id} audit={audit} isLast={idx === arr.length - 1} />
                ))
            )}
          </View>
        </>
      )}
    </View>
  );
}
