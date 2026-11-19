import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ErrorState, Icon, Skeleton } from '@tohfa/mobile-ui';
import type { deriveFarmRatingView } from '../../../api/farmer';
import type { FarmerAuditSummary } from '../../../api/audits';
import type { SoilTestRecord } from '../../../api/soil';
import { LOCALES, setLocale, t, type Locale } from '../../../../../i18n/farmer';
import { colors, authPalette as P } from '../../../theme';
import type { WidgetState } from '../../dashboard/dashboardWidgets';
import { AuditHistoryRow } from './AuditHistoryRow';
import { ModalFullWidthButton, ProfileModalShell } from './ProfileModalShell';
import { RatingBarItem } from './RatingBarItem';
import { SoilSummaryBody } from './SoilSummaryBody';
import { styles } from './profileStyles';

/* The read-only / summary modals of the Profile screen: documents, bank, settings, audits,
 * farm rating and soil test. Each is a thin wrapper around ProfileModalShell. */

interface DocumentRowProps {
  icon: string;
  iconColor: string;
  title: string;
  statusIcon: string;
  statusIconColor: string;
  statusLabel: string;
  /** Needs-action variant: alert card colours and an orange status line. */
  alert?: boolean;
  action: React.ReactNode;
}

function DocumentRow({
  icon,
  iconColor,
  title,
  statusIcon,
  statusIconColor,
  statusLabel,
  alert = false,
  action,
}: DocumentRowProps): React.JSX.Element {
  return (
    <View style={alert ? [styles.docItemCard, styles.docCardAlert] : styles.docItemCard}>
      <Icon name={icon} size={24} color={iconColor} />
      <View style={styles.flex1}>
        <Text style={styles.docTitle}>{title}</Text>
        <View style={[styles.iconTextRow, styles.docInfoRow]}>
          <Icon name={statusIcon} size={11} color={statusIconColor} />
          <Text
            style={
              alert
                ? [styles.docStatusGreen, styles.docStatusWarn]
                : [styles.docStatusGreen, styles.docStatusNoMargin]
            }
          >
            {statusLabel}
          </Text>
        </View>
      </View>
      {action}
    </View>
  );
}

/* MOCK: farmer documents (docType/fileUrl) are only reachable via GET /v1/admin/farmer-applications/:id, permission farmer.application.view, which docs/rbac.json grants FARMER: none. There is no farmer-facing "my documents" GET. */
export function DocumentsModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}): React.JSX.Element {
  return (
    <ProfileModalShell
      visible={visible}
      title={t('farmer.profile.menu.documents')}
      onClose={onClose}
      footer={<ModalFullWidthButton label={t('farmer.common.done')} onPress={onClose} />}
    >
      <DocumentRow
        icon="badge"
        iconColor={P.slate600}
        title={t('farmer.profile.documents.aadhaar')}
        statusIcon="check_circle"
        statusIconColor={colors.brandGreen}
        statusLabel={t('farmer.certifications.status.VERIFIED')}
        action={<Text style={styles.docActionText}>{t('farmer.common.view')}</Text>}
      />
      <DocumentRow
        icon="description"
        iconColor={P.slate600}
        title={t('farmer.profile.documents.patta')}
        statusIcon="check_circle"
        statusIconColor={colors.brandGreen}
        statusLabel={t('farmer.certifications.status.VERIFIED')}
        action={<Text style={styles.docActionText}>{t('farmer.common.view')}</Text>}
      />
      <DocumentRow
        icon="military_tech"
        iconColor={P.blue700}
        title={t('farmer.profile.documents.pgsCert')}
        statusIcon="check_circle"
        statusIconColor={colors.brandGreen}
        statusLabel={t('farmer.profile.stats.certValid')}
        action={<Text style={styles.docActionText}>{t('farmer.common.download')}</Text>}
      />
      <DocumentRow
        alert
        icon="water_drop"
        iconColor={P.lightBlue700}
        title={t('farmer.profile.documents.soilCard')}
        statusIcon="warning"
        statusIconColor={P.orange900}
        statusLabel={t('farmer.profile.documents.actionNeeded')}
        action={
          <TouchableOpacity style={styles.docUploadBtn}>
            <Text style={styles.docUploadBtnText}>{t('farmer.common.upload')}</Text>
          </TouchableOpacity>
        }
      />
    </ProfileModalShell>
  );
}

/* MOCK: farmer_bank_accounts (db/migrations/0007) has no route, service or repo anywhere in apps/api, no path in docs/openapi.yaml, and FARMER holds "none" on payout.dues.view / payout.farmer.initiate / payout.approve_above_10k in docs/rbac.json. */
export function BankModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}): React.JSX.Element {
  return (
    <ProfileModalShell
      visible={visible}
      title={t('farmer.profile.bank.title')}
      onClose={onClose}
      scroll={false}
      footer={<ModalFullWidthButton label={t('farmer.common.close')} onPress={onClose} />}
    >
      <View style={styles.bankCardPreview}>
        <Text style={styles.bankName}>State Bank of India</Text>
        <Text style={styles.bankBranch}>Ooty Main Branch</Text>
        <Text style={styles.bankAccountNum}>•••• •••• •••• 5821</Text>
        <View style={styles.bankFooterRow}>
          <Text style={styles.bankIfsc}>
            {t('farmer.profile.bank.ifsc', { code: 'SBIN0000843' })}
          </Text>
          <Text style={styles.bankHolder}>Kumar</Text>
        </View>
      </View>

      <View style={[styles.detailRow, styles.detailRowGapMd]}>
        <Text style={styles.detailLabel}>{t('farmer.profile.bank.upi')}</Text>
        <Text style={styles.detailValue}>kumar.farmer@sbi</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{t('farmer.profile.bank.schedule')}</Text>
        <Text style={[styles.detailValue, styles.greenValue]}>
          {t('farmer.profile.bank.scheduleValue')}
        </Text>
      </View>
      <View style={[styles.detailRow, styles.noBottomBorder]}>
        <Text style={styles.detailLabel}>{t('farmer.profile.bank.lastPayout')}</Text>
        <Text style={styles.detailValue}>
          {t('farmer.profile.bank.lastPayoutValue', { amount: '₹18,400', date: '02 Sep 2026' })}
        </Text>
      </View>
    </ProfileModalShell>
  );
}

export function SettingsModal({
  visible,
  selectedLocale,
  onSelectLocale,
  onClose,
}: {
  visible: boolean;
  selectedLocale: Locale;
  onSelectLocale: (code: Locale) => void;
  onClose: () => void;
}): React.JSX.Element {
  return (
    <ProfileModalShell
      visible={visible}
      title={t('farmer.profile.menu.settings')}
      onClose={onClose}
      scroll={false}
      footer={<ModalFullWidthButton label={t('farmer.common.done')} onPress={onClose} />}
    >
      <Text style={styles.inputLabel}>{t('farmer.profile.settings.language')}</Text>
      <View style={styles.chipsRow}>
        {LOCALES.map((code) => (
          <TouchableOpacity
            key={code}
            style={[styles.choiceChip, selectedLocale === code && styles.choiceChipActive]}
            onPress={() => {
              onSelectLocale(code);
              setLocale(code);
            }}
          >
            <Text
              style={[
                styles.choiceChipText,
                selectedLocale === code && styles.choiceChipTextActive,
              ]}
            >
              {code === 'ta'
                ? t('farmer.profile.settings.langTa')
                : t('farmer.profile.settings.langEn')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.detailRow, styles.detailRowGapLg]}>
        <Text style={styles.detailLabel}>{t('farmer.profile.settings.smsAlerts')}</Text>
        <View style={styles.iconTextRow}>
          <Text style={[styles.detailValue, styles.greenValue]}>{t('farmer.common.enabled')}</Text>
          <Icon name="check_circle" size={13} color={colors.brandGreen} />
        </View>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{t('farmer.profile.settings.geofence')}</Text>
        <View style={styles.iconTextRow}>
          <Text style={[styles.detailValue, styles.greenValue]}>{t('farmer.common.enabled')}</Text>
          <Icon name="check_circle" size={13} color={colors.brandGreen} />
        </View>
      </View>
      <View style={[styles.detailRow, styles.noBottomBorder]}>
        <Text style={styles.detailLabel}>{t('farmer.profile.settings.appVersion')}</Text>
        <Text style={styles.detailValue}>v0.1.0 (Production)</Text>
      </View>
    </ProfileModalShell>
  );
}

export function AuditsModal({
  visible,
  auditsState,
  pastAudits,
  onRetry,
  onViewDetails,
  onClose,
}: {
  visible: boolean;
  auditsState: WidgetState<FarmerAuditSummary[]>;
  pastAudits: FarmerAuditSummary[];
  onRetry: () => void;
  onViewDetails: () => void;
  onClose: () => void;
}): React.JSX.Element {
  return (
    <ProfileModalShell
      visible={visible}
      title={t('farmer.profile.audits.modalTitle')}
      onClose={onClose}
      footer={
        <ModalFullWidthButton
          label={t('farmer.profile.audits.viewDetails')}
          onPress={onViewDetails}
        />
      }
    >
      {auditsState.kind === 'loading' ? (
        <Skeleton height={56} style={styles.skeletonGapSm} />
      ) : auditsState.kind === 'error' ? (
        <ErrorState
          error={auditsState.error}
          message={t('farmer.audits.loadError')}
          retryTitle={t('farmer.common.retry')}
          offlineMessage={t('farmer.common.offline')}
          onRetry={onRetry}
        />
      ) : pastAudits.length === 0 ? (
        <Text style={styles.certNoticeText}>{t('farmer.profile.audits.noPastYet')}</Text>
      ) : (
        pastAudits.map((audit, idx, arr) => (
          <AuditHistoryRow key={audit.id} audit={audit} isLast={idx === arr.length - 1} />
        ))
      )}
    </ProfileModalShell>
  );
}

export function RatingModal({
  visible,
  ratingView,
  onClose,
}: {
  visible: boolean;
  ratingView: ReturnType<typeof deriveFarmRatingView>;
  onClose: () => void;
}): React.JSX.Element {
  return (
    <ProfileModalShell
      visible={visible}
      title={t('farmer.profile.rating.modalTitle')}
      onClose={onClose}
      footer={<ModalFullWidthButton label={t('farmer.common.close')} onPress={onClose} />}
    >
      <Text style={styles.ratingIntro}>{t('farmer.profile.rating.intro')}</Text>

      {!ratingView.isRated ? (
        <Text style={styles.certNoticeText}>{t('farmer.profile.rating.notRatedBody')}</Text>
      ) : null}

      {ratingView.modules.map((mod) => (
        <RatingBarItem key={mod.categoryCode} mod={mod} />
      ))}
    </ProfileModalShell>
  );
}

export function SoilModal({
  visible,
  soilLoading,
  latestSoilTest,
  onClose,
}: {
  visible: boolean;
  soilLoading: boolean;
  latestSoilTest: SoilTestRecord | null;
  onClose: () => void;
}): React.JSX.Element {
  return (
    <ProfileModalShell
      visible={visible}
      title={t('farmer.profile.soil.modalTitle')}
      onClose={onClose}
      footer={<ModalFullWidthButton label={t('farmer.common.close')} onPress={onClose} />}
    >
      {/* Real latest test -- the fabricated Sample ID / Testing Lab row is gone: SoilTestRecord
          has no such field anywhere in the API (apps/api/src/modules/soil), so it was invented. */}
      {soilLoading ? <Skeleton height={140} /> : <SoilSummaryBody test={latestSoilTest} />}
    </ProfileModalShell>
  );
}
