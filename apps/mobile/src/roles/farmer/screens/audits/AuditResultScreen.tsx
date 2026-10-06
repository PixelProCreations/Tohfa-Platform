import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { ErrorState, Skeleton } from '@tohfa/mobile-ui';
import { t, type TranslationKey } from '../../../../i18n/farmer';
import { authPalette as P, colors, typography } from '../../theme';
import {
  auditConductedBy,
  auditDisplayDate,
  auditScore,
  fullMonthKey,
  getMyAudit,
  getMyAuditReportUrl,
  isAuditNotFound,
  istDateParts,
  pad2,
  scoreFraction,
  shortMonthKey,
  tierLabelKey,
  type AuditReportVariant,
  type FarmerAuditDetail,
} from '../../api/audits';

// ─────────────────────────────────────────────
// Inline SVG Icons
// ─────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = P.twGray800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M5 12L12 19M5 12L12 5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DownloadIcon({ size = 18, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 10l5 5 5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="12" y1="15" x2="12" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ShieldCheckIcon({ size = 16, color = P.sky600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ClockIcon({ size = 14, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 6v6l4 2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckCircleIcon({ size = 18, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M8 12l2.5 2.5L16 9" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function AlertTriangleIcon({ size = 18, color = P.twOrange600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="12" cy="17" r="1" fill={color} />
    </Svg>
  );
}

function CalendarIcon({ size = 14, color = P.twOrange600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 14, color = P.twGray500, isOpen = false }: { size?: number; color?: string; isOpen?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}>
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PdfFileIcon({ size = 22, color = P.twRed600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 2v6h6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="9" y1="13" x2="15" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="9" y1="17" x2="13" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function UserAvatarIcon({ size = 36 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <Circle cx="18" cy="18" r="18" fill={P.slate200} />
      <Circle cx="18" cy="14" r="6" fill={P.slate500} />
      <Path d="M7 32c0-6.075 4.925-11 11-11s11 4.925 11 11" fill={P.slate500} />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Gauge Speedometer Component
//
// Contract scale: 10 categories x 0-10 = total out of 100, plus a tier the
// server resolves from rating_tier_config (BR-04a). The four arc segments are
// decorative quarters; the tier bands themselves are server config the client
// does not know, so the legend states the scale, not thresholds, and the label
// under the number is the server's tier, never derived here.
// ─────────────────────────────────────────────

const GAUGE_CX = 100;
const GAUGE_CY = 95;
const GAUGE_NEEDLE_LENGTH = 68;

function RatingGauge({ score, max, tierLabel }: { score: number; max: number; tierLabel: string | null }) {
  const angle = Math.PI * (1 - scoreFraction(score, max));
  const needleX = GAUGE_CX + GAUGE_NEEDLE_LENGTH * Math.cos(angle);
  const needleY = GAUGE_CY - GAUGE_NEEDLE_LENGTH * Math.sin(angle);
  return (
    <View style={gaugeStyles.container}>
      <Svg width={220} height={120} viewBox="0 0 200 115">
        {/* Arc Segments: Poor, Moderate, Good, Excellent */}
        <Path d="M 25 95 A 75 75 0 0 1 46.97 41.97" stroke={P.brown400} strokeWidth="14" strokeLinecap="round" fill="none" />
        <Path d="M 46.97 41.97 A 75 75 0 0 1 100 20" stroke={P.tanBrown} strokeWidth="14" fill="none" />
        <Path d="M 100 20 A 75 75 0 0 1 153.03 41.97" stroke={P.twBlue600} strokeWidth="14" fill="none" />
        <Path d="M 153.03 41.97 A 75 75 0 0 1 175 95" stroke={P.primary} strokeWidth="14" strokeLinecap="round" fill="none" />

        {/* Gauge Needle at score / max */}
        <Line x1={GAUGE_CX} y1={GAUGE_CY} x2={needleX} y2={needleY} stroke={P.twGray800} strokeWidth="3.5" strokeLinecap="round" />

        {/* Pivot center */}
        <Circle cx={GAUGE_CX} cy={GAUGE_CY} r="7" fill={P.twGray800} />
        <Circle cx={GAUGE_CX} cy={GAUGE_CY} r="3" fill={P.white} />
      </Svg>

      {/* Score and Rating Text in the center below needle */}
      <View style={gaugeStyles.scoreBox}>
        <Text style={gaugeStyles.scoreNumber}>
          {score}
          {t('farmer.profile.rating.outOf', { max })}
        </Text>
        {tierLabel !== null ? <Text style={gaugeStyles.scoreLabel}>{tierLabel}</Text> : null}
      </View>

      {/* Scale Category Labels */}
      <View style={gaugeStyles.scaleLabelsRow}>
        <Text style={gaugeStyles.scaleLabel}>{t('farmer.auditResult.gauge.poor')}</Text>
        <Text style={gaugeStyles.scaleLabel}>{t('farmer.auditResult.gauge.moderate')}</Text>
        <Text style={gaugeStyles.scaleLabel}>{t('farmer.auditResult.gauge.good')}</Text>
        <Text style={gaugeStyles.scaleLabel}>{t('farmer.auditResult.gauge.excellentCaps')}</Text>
      </View>

      {/* Legend subtext */}
      <Text style={gaugeStyles.scaleSubtext}>{t('farmer.auditResult.gauge.scaleLegend100')}</Text>
    </View>
  );
}

const gaugeStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 6,
  },
  scoreBox: {
    alignItems: 'center',
    marginTop: -25,
    marginBottom: 10,
  },
  scoreNumber: {
    fontSize: typography.display,
    fontWeight: '800',
    color: P.primary,
    letterSpacing: 0.5,
  },
  scoreLabel: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.primary,
    marginTop: -2,
  },
  scaleLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
    marginTop: 4,
  },
  scaleLabel: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: P.twGray500,
    letterSpacing: 0.5,
  },
  scaleSubtext: {
    fontSize: typography.caption,
    color: P.twGray400,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 14,
  },
});

// ─────────────────────────────────────────────
// Main AuditResultScreen
//
// Data: GET /farmers/me/audits/{id} (api/audits.ts). Another farmer's id, or
// an unknown one, is a 404 from the server (BR-36a) and renders the
// not-found state. Scores and findings only exist for a COMPLETED audit;
// otherwise the screen shows the schedule and a plain "results later" note.
//
// Report PDFs: `getMyAuditReportUrl` resolves the authenticated report
// endpoint to a short-lived signed URL and Linking opens it (see that
// function for why the endpoint itself cannot be handed to Linking).
//
// Removed from the approved design because the contract has no field or
// endpoint for them: "time on farm", the outcome headline banner for a
// completed audit, the named lead auditor/person, the Photos attachment, the
// "Reviewed"/"Published" timeline steps (no publish gate exists), the report
// file size, and "Dispute a finding" with its modal.
// ─────────────────────────────────────────────

interface AuditResultScreenProps {
  onBack?: () => void;
  auditId?: string | undefined;
}

type LoadState =
  | { kind: 'loading' }
  | { kind: 'notFound' }
  | { kind: 'error'; error: unknown }
  | { kind: 'ready'; audit: FarmerAuditDetail };

function k(key: string): TranslationKey {
  return key as TranslationKey;
}

function formatHeadingDate(iso: string): string {
  const p = istDateParts(iso);
  if (p === null) return '';
  return t('farmer.auditResult.dateHeading', { day: p.day, month: t(k(fullMonthKey(p.monthIndex))), year: p.year });
}

function formatDueDate(isoDate: string): string {
  // `dueDate` is a calendar date (YYYY-MM-DD) with no time zone; read it as-is.
  const [y, m, d] = isoDate.split('-').map((part) => Number(part));
  if (!y || !m || !d) return isoDate;
  return t('farmer.auditResult.dateHeading', { day: pad2(d), month: t(k(shortMonthKey(m - 1))), year: y });
}

export function AuditResultScreen({ onBack, auditId }: AuditResultScreenProps): React.JSX.Element {
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [openFindingIds, setOpenFindingIds] = useState<Record<string, boolean>>({});
  const [isOpeningReport, setIsOpeningReport] = useState(false);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (auditId === undefined) {
        setState({ kind: 'notFound' });
        return;
      }
      setState({ kind: 'loading' });
      try {
        const audit = await getMyAudit(auditId, signal);
        if (signal?.aborted) return;
        // First finding starts expanded, as in the approved design.
        const first = audit.findings[0];
        setOpenFindingIds(first ? { [first.id]: true } : {});
        setState({ kind: 'ready', audit });
      } catch (error) {
        if (signal?.aborted) return;
        setState(isAuditNotFound(error) ? { kind: 'notFound' } : { kind: 'error', error });
      }
    },
    [auditId],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const audit = state.kind === 'ready' ? state.audit : null;
  const isCompleted = audit?.status === 'COMPLETED';

  const handleOpenReport = async (variant: AuditReportVariant) => {
    if (audit === null || isOpeningReport) return;
    if (variant === 'generated' && !isCompleted) {
      Alert.alert(t('farmer.auditResult.download.title'), t('farmer.auditResult.download.notReady'), [{ text: t('farmer.common.ok') }]);
      return;
    }
    setIsOpeningReport(true);
    try {
      const url = await getMyAuditReportUrl(audit.id, variant);
      await Linking.openURL(url);
    } catch {
      Alert.alert(t('farmer.auditResult.download.errorTitle'), t('farmer.auditResult.download.errorBody'), [{ text: t('farmer.common.ok') }]);
    } finally {
      setIsOpeningReport(false);
    }
  };

  const toggleFinding = (id: string) => setOpenFindingIds((prev) => ({ ...prev, [id]: !prev[id] }));

  const header = (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={onBack}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={t('farmer.common.back')}
      >
        <ArrowBackIcon size={20} color={P.twGray800} />
      </TouchableOpacity>

      <View style={styles.headerTextCol}>
        <Text style={styles.headerTitle}>{t('farmer.auditResult.title')}</Text>
        {audit !== null ? (
          <Text style={styles.headerSubtitle}>
            {audit.auditType === 'EXTERNAL' ? t('farmer.audits.upcoming.titleExternal') : t('farmer.audits.upcoming.titleInternal')}
          </Text>
        ) : null}
      </View>

      {isCompleted ? (
        <TouchableOpacity
          style={styles.downloadBtn}
          onPress={() => void handleOpenReport('generated')}
          activeOpacity={0.7}
          disabled={isOpeningReport}
          accessibilityRole="button"
          accessibilityLabel={t('farmer.auditResult.download.title')}
        >
          <DownloadIcon size={18} color={P.twGreen700} />
        </TouchableOpacity>
      ) : null}
    </View>
  );

  if (state.kind === 'loading') {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar barStyle="dark-content" backgroundColor={P.white} />
        {header}
        <View style={styles.scrollContent}>
          <Skeleton width="100%" height={90} borderRadius={16} />
          <View style={styles.skeletonGap} />
          <Skeleton width="100%" height={220} borderRadius={16} />
          <View style={styles.skeletonGap} />
          <Skeleton width="100%" height={80} borderRadius={16} />
        </View>
      </SafeAreaView>
    );
  }

  if (state.kind === 'notFound') {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar barStyle="dark-content" backgroundColor={P.white} />
        {header}
        <View style={styles.centerFill}>
          <Text style={styles.emptyTitle}>{t('farmer.auditResult.notFound.title')}</Text>
          <Text style={styles.emptyBody}>{t('farmer.auditResult.notFound.body')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (state.kind === 'error' || audit === null) {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar barStyle="dark-content" backgroundColor={P.white} />
        {header}
        <View style={styles.centerFill}>
          <ErrorState
            error={state.kind === 'error' ? state.error : undefined}
            message={t('farmer.auditResult.loadError')}
            retryTitle={t('farmer.common.retry')}
            offlineMessage={t('farmer.common.offline')}
            onRetry={() => void load()}
          />
        </View>
      </SafeAreaView>
    );
  }

  const score = auditScore(audit);
  const tierKey = tierLabelKey(audit.tier);
  const conductedBy = auditConductedBy(audit);
  const isCancelled = audit.status === 'CANCELLED';
  const showGeneratedReport = isCompleted;
  const showAttachments = showGeneratedReport || audit.hasAgencyReport;

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* ── Top Header ── */}
      {header}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Meta Block: Pill + Date + Auditor ── */}
        <View style={styles.metaContainer}>
          <View style={styles.externalBadgePill}>
            <ShieldCheckIcon size={15} color={P.sky600} />
            <Text style={styles.externalBadgeText}>
              {audit.auditType === 'EXTERNAL' ? t('farmer.auditResult.externalAudit') : t('farmer.auditResult.internalAudit')}
            </Text>
          </View>

          <Text style={styles.auditDateHeading}>{formatHeadingDate(auditDisplayDate(audit))}</Text>
          {conductedBy !== null ? <Text style={styles.auditorSubtitle}>{conductedBy}</Text> : null}
          <Text style={styles.auditorSubtitle}>
            {t('farmer.audits.quarterLabel', { quarter: audit.quarter, fiscalYear: audit.fiscalYear })}
          </Text>
        </View>

        {/* ── Status Banner: only when there are no results to show ── */}
        {!isCompleted ? (
          <View style={styles.compliantBanner}>
            <ClockIcon size={18} color={P.twGreen700} />
            <Text style={styles.compliantBannerText}>
              {isCancelled
                ? audit.cancelledReason
                  ? t('farmer.auditResult.cancelledWithReason', { reason: audit.cancelledReason })
                  : t('farmer.auditResult.cancelledBanner')
                : t('farmer.auditResult.pendingResults')}
            </Text>
          </View>
        ) : null}

        {score !== null ? (
          <>
            {/* ── Card: ADMIN RATING ── */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t('farmer.auditResult.adminRating')}</Text>
              <RatingGauge score={score.score} max={score.max} tierLabel={tierKey !== null ? t(k(tierKey)) : null} />
            </View>

            {/* ── 2 Metric Boxes (Major / Minor findings) ── */}
            <View style={styles.findingsRow}>
              <View style={styles.majorBox}>
                <Text style={styles.majorNumber}>{audit.findingCounts.major}</Text>
                <Text style={styles.majorLabel}>{t('farmer.auditResult.majorFindings')}</Text>
              </View>

              <View style={styles.minorBox}>
                <Text style={styles.minorNumber}>{audit.findingCounts.minor}</Text>
                <Text style={styles.minorLabel}>{t('farmer.auditResult.minorFindings')}</Text>
              </View>
            </View>
          </>
        ) : null}

        {/* ── Section: CORRECTIVE ACTIONS (findings) ── */}
        {isCompleted && audit.findings.length > 0 ? (
          <>
            <Text style={styles.sectionHeader}>
              {t('farmer.auditResult.section.correctiveActions', { count: audit.findings.length })}
            </Text>
            {audit.findings.map((finding) => {
              const isOpen = openFindingIds[finding.id] === true;
              const isResolved = finding.resolvedAt !== null;
              return (
                <TouchableOpacity
                  key={finding.id}
                  style={styles.correctiveCard}
                  activeOpacity={0.9}
                  onPress={() => toggleFinding(finding.id)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isOpen }}
                >
                  <View style={styles.correctiveTopRow}>
                    {isResolved ? (
                      <CheckCircleIcon size={18} color={P.twGreen700} />
                    ) : (
                      <AlertTriangleIcon size={18} color={finding.severity === 'MAJOR' ? P.twRed600 : P.twOrange600} />
                    )}
                    <Text style={styles.correctiveTitle}>{finding.description}</Text>
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingBadgeText}>
                        {isResolved ? t('farmer.auditResult.corrective.resolved') : t('farmer.auditResult.corrective.pending')}
                      </Text>
                    </View>
                    <ChevronDownIcon size={14} color={P.twGray500} isOpen={isOpen} />
                  </View>

                  {isOpen && (finding.correctiveAction !== null || finding.dueDate !== null) ? (
                    <View style={styles.correctiveDetails}>
                      {finding.correctiveAction !== null ? (
                        <Text style={styles.correctiveDesc}>{finding.correctiveAction}</Text>
                      ) : null}
                      {finding.dueDate !== null ? (
                        <View style={styles.dueDateRow}>
                          <CalendarIcon size={14} color={P.twOrange600} />
                          <Text style={styles.dueDateText}>
                            {t('farmer.auditResult.corrective.due', { date: formatDueDate(finding.dueDate) })}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </>
        ) : null}

        {/* ── Section: AUDITOR REMARKS ── */}
        {isCompleted && audit.summary !== null && audit.summary.trim() !== '' ? (
          <>
            <Text style={styles.sectionHeader}>{t('farmer.auditResult.section.auditorRemarks')}</Text>
            <View style={styles.card}>
              <View style={styles.auditorRow}>
                <UserAvatarIcon size={38} />
                <View style={styles.auditorNameCol}>
                  {conductedBy !== null ? <Text style={styles.auditorName}>{conductedBy}</Text> : null}
                  <Text style={styles.auditorRole}>
                    {audit.auditType === 'EXTERNAL'
                      ? t('farmer.auditResult.auditorRole.external')
                      : t('farmer.auditResult.auditorRole.internal')}
                  </Text>
                </View>
              </View>
              <Text style={styles.auditorQuote}>{audit.summary}</Text>
            </View>
          </>
        ) : null}

        {/* ── Section: ATTACHMENTS ── */}
        {showAttachments ? (
          <>
            <Text style={styles.sectionHeader}>{t('farmer.auditResult.section.attachments')}</Text>
            <View style={styles.attachmentsRow}>
              {showGeneratedReport ? (
                <TouchableOpacity
                  style={styles.attachmentCard}
                  activeOpacity={0.7}
                  disabled={isOpeningReport}
                  onPress={() => void handleOpenReport('generated')}
                  accessibilityRole="button"
                >
                  <PdfFileIcon size={22} color={P.twRed600} />
                  <View style={styles.attachmentTextCol}>
                    <Text style={styles.attachmentName}>{t('farmer.auditResult.attachment.auditReport')}</Text>
                    <Text style={styles.attachmentMeta}>{t('farmer.auditResult.attachment.pdf')}</Text>
                  </View>
                </TouchableOpacity>
              ) : null}

              {audit.hasAgencyReport ? (
                <TouchableOpacity
                  style={styles.attachmentCard}
                  activeOpacity={0.7}
                  disabled={isOpeningReport}
                  onPress={() => void handleOpenReport('agency')}
                  accessibilityRole="button"
                >
                  <PdfFileIcon size={22} color={P.twRed600} />
                  <View style={styles.attachmentTextCol}>
                    <Text style={styles.attachmentName}>{t('farmer.auditResult.attachment.agencyReport')}</Text>
                    <Text style={styles.attachmentMeta}>{t('farmer.auditResult.attachment.pdf')}</Text>
                  </View>
                </TouchableOpacity>
              ) : null}
            </View>
          </>
        ) : null}

        {/* ── Section: AUDIT TIMELINE (not shown for a cancelled audit) ── */}
        {!isCancelled ? (
          <>
            <Text style={styles.sectionHeader}>{t('farmer.auditResult.section.timeline')}</Text>
            <View style={styles.timelineRow}>
              {[
                { key: 'scheduled', label: t('farmer.auditResult.timeline.scheduled'), done: true },
                { key: 'started', label: t('farmer.auditResult.timeline.started'), done: audit.startedAt !== null },
                { key: 'completed', label: t('farmer.auditResult.timeline.completed'), done: isCompleted },
              ].map((step, index) => (
                <React.Fragment key={step.key}>
                  {index > 0 ? (
                    <View style={[styles.timelineConnectorLine, !step.done && styles.timelineConnectorPending]} />
                  ) : null}
                  <View style={styles.timelineStep}>
                    <View style={[styles.timelineCheckCircle, !step.done && styles.timelinePendingCircle]}>
                      {step.done ? <Text style={styles.timelineCheckMark}>✓</Text> : null}
                    </View>
                    <Text style={styles.timelineStepLabel}>{step.label}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: P.lightSurfaceAlt,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: P.white,
    borderBottomWidth: 1,
    borderBottomColor: P.surfaceMuted,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: P.mintTintBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: P.twGray900,
  },
  headerSubtitle: {
    fontSize: typography.body,
    color: P.twGray500,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },

  /* Meta Container */
  metaContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  externalBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: P.sky100,
    borderWidth: 1,
    borderColor: P.twSky200,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 10,
  },
  externalBadgeText: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.twSky700,
  },
  auditDateHeading: {
    fontSize: typography.title,
    fontWeight: '800',
    color: P.twGray900,
  },
  auditorSubtitle: {
    fontSize: typography.body,
    color: P.twGray600,
    marginTop: 4,
  },

  /* Compliant Banner */
  compliantBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.brandGreenLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  compliantBannerText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.twGreen800,
  },

  /* Card */
  card: {
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: 16,
    marginBottom: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  cardTitle: {
    fontSize: typography.caption,
    fontWeight: '800',
    color: P.twGray500,
    letterSpacing: 0.8,
    textAlign: 'center',
    marginBottom: 6,
  },

  /* Findings row */
  findingsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  majorBox: {
    flex: 1,
    backgroundColor: P.twGreen50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: P.twGreen100,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  majorNumber: {
    fontSize: typography.headline,
    fontWeight: '800',
    color: P.twGreen800,
  },
  majorLabel: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.twGreen800,
  },
  minorBox: {
    flex: 1,
    backgroundColor: P.twOrange50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: P.twOrange200,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  minorNumber: {
    fontSize: typography.headline,
    fontWeight: '800',
    color: P.twOrange600,
  },
  minorLabel: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.twOrange700,
  },

  /* Section Header */
  sectionHeader: {
    fontSize: typography.bodySmall,
    fontWeight: '800',
    color: P.twGray500,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 10,
    marginBottom: 10,
  },

  /* Corrective Actions Card */
  correctiveCard: {
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: P.twOrange500,
    padding: 16,
    marginBottom: 16,
  },
  correctiveTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  correctiveTitle: {
    flex: 1,
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.twGray900,
  },
  pendingBadge: {
    backgroundColor: P.twOrange100,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pendingBadgeText: {
    fontSize: typography.caption,
    fontWeight: '800',
    color: P.twOrange600,
  },
  correctiveDetails: {
    marginTop: 10,
  },
  correctiveDesc: {
    fontSize: typography.body,
    color: P.twGray600,
    lineHeight: 19,
  },
  dueDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: P.twOrange50,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  dueDateText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.twOrange600,
  },

  /* Auditor Remarks */
  auditorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  auditorNameCol: {
    flex: 1,
  },
  auditorName: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.twGray900,
  },
  auditorRole: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    marginTop: 1,
  },
  auditorQuote: {
    fontStyle: 'italic',
    fontSize: typography.body,
    color: P.twGray700,
    lineHeight: 20,
    marginTop: 12,
  },

  /* Attachments */
  attachmentsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  attachmentCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: P.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: 12,
  },
  attachmentTextCol: {
    flex: 1,
  },
  attachmentName: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.twGray900,
  },
  attachmentMeta: {
    fontSize: typography.caption,
    color: P.twGray500,
    marginTop: 1,
  },

  /* Timeline */
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    paddingVertical: 18,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  timelineStep: {
    alignItems: 'center',
    gap: 6,
  },
  timelineCheckCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: P.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineCheckMark: {
    color: P.white,
    fontSize: typography.body,
    fontWeight: '800',
  },
  timelineStepLabel: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: P.twGray700,
  },
  timelineConnectorLine: {
    flex: 1,
    height: 2.5,
    backgroundColor: P.primary,
    marginHorizontal: 4,
    marginBottom: 18,
  },

  timelinePendingCircle: {
    backgroundColor: P.twGray200,
  },
  timelineConnectorPending: {
    backgroundColor: P.twGray200,
  },

  /* Loading / error / not-found states */
  skeletonGap: {
    height: 12,
  },
  centerFill: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: P.twGray900,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: typography.body,
    color: P.twGray500,
    textAlign: 'center',
    marginTop: 8,
  },
});
