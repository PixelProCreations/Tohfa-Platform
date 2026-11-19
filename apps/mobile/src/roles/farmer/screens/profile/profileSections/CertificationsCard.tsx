import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ErrorState, Icon, Skeleton } from '@tohfa/mobile-ui';
import type { Certification } from '../../../api/farmer';
import { t } from '../../../../../i18n/farmer';
import { colors, authPalette as P } from '../../../theme';
import { certificationDisplayName } from '../../certifications/certificationForm';
import { CARD_ACTION_HIT_SLOP, CERT_TONE, type CertDisplayStatus } from './profileHelpers';
import { styles } from './profileStyles';

interface CertificationsCardProps {
  certsLoading: boolean;
  certsError: { error: unknown } | null;
  certSummary: { cert: Certification; status: CertDisplayStatus }[];
  worstCert: { cert: Certification; status: CertDisplayStatus } | null;
  onManage: () => void;
  onRetry: () => void;
}

export function CertificationsCard({
  certsLoading,
  certsError,
  certSummary,
  worstCert,
  onManage,
  onRetry,
}: CertificationsCardProps): React.JSX.Element {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.cardHeaderRow}>
        <View style={[styles.cardIconBox, styles.iconBoxBlue]}>
          <Icon name="military_tech" size={18} color={P.blue700} />
        </View>
        <View style={styles.cardHeaderTitleBox}>
          <Text style={styles.cardTitle}>{t('farmer.dashboard.search.certifications.title')}</Text>
          <Text style={styles.cardSubtitle}>{t('farmer.profile.cert.subtitle')}</Text>
        </View>
        <TouchableOpacity onPress={onManage} hitSlop={CARD_ACTION_HIT_SLOP}>
          <Text style={styles.cardActionLink}>{t('farmer.common.manage')}</Text>
        </TouchableOpacity>
      </View>

      {/* Real certification summary -- GET /v1/farmers/me/certifications via
              getMyCertifications(), with expiry derived by the shared
              evalCertificateWarning helper (BR-01/BR-02). */}
      {certsLoading ? (
        <View style={styles.certCardsRow}>
          <Skeleton height={112} width="48%" style={styles.certSkeleton} />
          <Skeleton height={112} width="48%" style={styles.certSkeleton} />
        </View>
      ) : certsError ? (
        <ErrorState
          error={certsError.error}
          message={t('farmer.certifications.loadError')}
          retryTitle={t('farmer.common.retry')}
          offlineMessage={t('farmer.common.offline')}
          onRetry={onRetry}
        />
      ) : certSummary.length === 0 ? (
        <Text style={styles.certNoticeText}>{t('farmer.certifications.empty')}</Text>
      ) : (
        <View style={styles.certCardsRow}>
          {certSummary.slice(0, 2).map(({ cert, status }) => {
            const tone = CERT_TONE[status];
            return (
              <TouchableOpacity
                key={cert.id}
                style={[styles.certSubCard, { backgroundColor: tone.bg, borderColor: tone.border }]}
                onPress={onManage}
                activeOpacity={0.8}
              >
                <View style={styles.certCardTop}>
                  <Icon
                    name={cert.certType === 'PGS' ? 'eco' : 'storefront'}
                    size={22}
                    color={tone.fg}
                  />
                  {status === 'active' ? (
                    <View style={styles.greenCheckmarkCircle}>
                      <Icon name="check" size={11} color={colors.white} />
                    </View>
                  ) : (
                    <View style={styles.orangeExclamationCircle}>
                      <Text style={styles.orangeExclamationText}>!</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.certTitle}>{certificationDisplayName(cert, t)}</Text>
                <Text style={[styles.certStatusText, { color: tone.fg }]}>{t(tone.labelKey)}</Text>
                <Text style={styles.certRenewText}>
                  {status === 'expired'
                    ? t('farmer.certifications.overdueBy', {
                        days: Math.abs(cert.daysToExpiry),
                      })
                    : t('farmer.profile.cert.renewsIn', { days: cert.daysToExpiry })}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Shown only when a real certificate is actually expiring or expired. */}
      {worstCert ? (
        <View style={styles.warningNoticeBox}>
          <Icon name="warning" size={16} color={P.amberDeep} />
          <Text style={styles.warningNoticeText}>
            {worstCert.status === 'expired'
              ? t('farmer.profile.cert.expiredNotice', {
                  type: certificationDisplayName(worstCert.cert, t),
                })
              : t('farmer.profile.cert.expiringNotice', {
                  type: certificationDisplayName(worstCert.cert, t),
                })}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
