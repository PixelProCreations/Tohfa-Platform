import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { t, type TranslationKey } from '../../../../i18n/farmer';
import { ErrorState, Skeleton } from '@tohfa/mobile-ui';
import { authPalette as P, colors, typography } from '../../theme';
import {
  AUDIT_STATUS_LABEL_KEY,
  auditConductedBy,
  auditDisplayDate,
  auditScore,
  deriveAuditsOverview,
  istDateParts,
  listAllMyAudits,
  pad2,
  QUARTERS_PER_FISCAL_YEAR,
  shortMonthKey,
  tierLabelKey,
  type FarmerAuditSummary,
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

function ShieldCheckIcon({ size = 18, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UsersGroupIcon({ size = 18, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" />
      <Path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CalendarIcon({ size = 16, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function BuildingIcon({ size = 16, color = colors.brandGreenLight }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="2" width="16" height="20" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M9 22v-4h6v4" stroke={color} strokeWidth="2" />
      <Line x1="8" y1="6" x2="8.01" y2="6" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="12" y1="6" x2="12.01" y2="6" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="16" y1="6" x2="16.01" y2="6" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="8" y1="10" x2="8.01" y2="10" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="12" y1="10" x2="12.01" y2="10" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="16" y1="10" x2="16.01" y2="10" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="8" y1="14" x2="8.01" y2="14" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="12" y1="14" x2="12.01" y2="14" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="16" y1="14" x2="16.01" y2="14" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

function LocationPinIcon({ size = 16, color = colors.brandGreenLight }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function StarIcon({ size = 11, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronRightIcon({ size = 18, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Data
//
// Real data from GET /farmers/me/audits (api/audits.ts). The whole history is
// fetched once and split per tab client-side by `deriveAuditsOverview`, so the
// stat cards ("done this year", latest tier) span both audit types.
//
// Removed from the approved design because the contract has no field or
// endpoint for them (left out rather than faked): the prep checklist modal,
// "Remind me" (no notification job), the outcome headline per past audit
// (e.g. "Compliant with minor observation" -- the row now shows its
// quarter / fiscal year), and the inline report modal fallback (the row always
// navigates to AuditResultScreen).
// ─────────────────────────────────────────────

type AuditTab = 'external' | 'internal';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'error'; error: unknown }
  | { kind: 'ready'; items: FarmerAuditSummary[] };

interface AuditsScreenProps {
  onBack?: () => void;
  onNavigateToResult?: (auditId: string) => void;
}

function k(key: string): TranslationKey {
  return key as TranslationKey;
}

function formatUpcomingDateTime(iso: string): string {
  const p = istDateParts(iso);
  if (p === null) return '';
  return t('farmer.audits.upcoming.dateTime', {
    day: pad2(p.day),
    month: t(k(shortMonthKey(p.monthIndex))),
    year: p.year,
    time: `${pad2(p.hour)}:${pad2(p.minute)}`,
  });
}

function AuditRow({ item, onPress }: { item: FarmerAuditSummary; onPress: () => void }): React.JSX.Element {
  const p = istDateParts(auditDisplayDate(item));
  const conductedBy = auditConductedBy(item);
  const score = auditScore(item);
  const tierKey = tierLabelKey(item.tier);
  return (
    <TouchableOpacity style={styles.pastAuditCard} activeOpacity={0.7} onPress={onPress} accessibilityRole="button">
      {/* Date Box */}
      <View style={styles.dateBox}>
        <Text style={styles.dateBoxDay}>{p === null ? '' : pad2(p.day)}</Text>
        <Text style={styles.dateBoxMonth}>
          {p === null ? '' : t('farmer.audits.dateBoxMonth', { month: t(k(shortMonthKey(p.monthIndex))), year: String(p.year).slice(-2) })}
        </Text>
      </View>

      {/* Info Column */}
      <View style={styles.pastAuditInfoCol}>
        <Text style={styles.pastAuditTitle}>
          {t('farmer.audits.quarterLabel', { quarter: item.quarter, fiscalYear: item.fiscalYear })}
        </Text>
        {conductedBy !== null ? <Text style={styles.pastAuditAuditor}>{conductedBy}</Text> : null}

        {/* Pills Row: counts and tier only for a COMPLETED audit; otherwise its status. */}
        <View style={styles.pillsRow}>
          {score !== null ? (
            <>
              <View style={styles.pillGray}>
                <Text style={styles.pillGrayText}>{t('farmer.audits.pill.major', { count: item.findingCounts.major })}</Text>
              </View>

              <View style={item.findingCounts.minor > 0 ? styles.pillOrange : styles.pillGray}>
                <Text style={item.findingCounts.minor > 0 ? styles.pillOrangeText : styles.pillGrayText}>
                  {t('farmer.audits.pill.minor', { count: item.findingCounts.minor })}
                </Text>
              </View>

              {tierKey !== null ? (
                <View style={item.tier === 'EXCELLENT' ? styles.pillGreen : styles.pillBlue}>
                  <Text style={styles.pillWhiteText}>
                    {t('farmer.audits.pill.tierScore', { tier: t(k(tierKey)), score: score.score, max: score.max })}
                  </Text>
                </View>
              ) : null}
            </>
          ) : (
            <View style={styles.pillGray}>
              <Text style={styles.pillGrayText}>{t(k(AUDIT_STATUS_LABEL_KEY[item.status]))}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Chevron Arrow */}
      <View style={styles.chevronWrapper}>
        <ChevronRightIcon size={18} color={P.twGray400} />
      </View>
    </TouchableOpacity>
  );
}

export function AuditsScreen({ onBack, onNavigateToResult }: AuditsScreenProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<AuditTab>('external');
  const [state, setState] = useState<LoadState>({ kind: 'loading' });

  const load = useCallback(async (signal?: AbortSignal) => {
    setState({ kind: 'loading' });
    try {
      const items = await listAllMyAudits(signal);
      if (signal?.aborted) return;
      setState({ kind: 'ready', items });
    } catch (error) {
      if (signal?.aborted) return;
      setState({ kind: 'error', error });
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const overview = useMemo(
    () => (state.kind === 'ready' ? deriveAuditsOverview(state.items) : null),
    [state],
  );

  const group = overview === null ? null : activeTab === 'external' ? overview.EXTERNAL : overview.INTERNAL;
  const next = group?.next ?? null;
  const latestTierKey = overview === null ? null : tierLabelKey(overview.latestTier);
  const openResult = (id: string) => onNavigateToResult?.(id);

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
        <Text style={styles.headerTitle}>{t('farmer.profile.audits.title')}</Text>
        <Text style={styles.headerSubtitle}>{t('farmer.audits.headerSubtitle')}</Text>
      </View>
    </View>
  );

  if (state.kind === 'loading') {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar barStyle="dark-content" backgroundColor={P.white} />
        {header}
        <View style={styles.scrollContent}>
          <Skeleton width="100%" height={52} borderRadius={14} />
          <View style={styles.skeletonGap} />
          <Skeleton width="100%" height={80} borderRadius={16} />
          <View style={styles.skeletonGap} />
          <Skeleton width="100%" height={180} borderRadius={20} />
        </View>
      </SafeAreaView>
    );
  }

  if (state.kind === 'error') {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar barStyle="dark-content" backgroundColor={P.white} />
        {header}
        <View style={styles.centerFill}>
          <ErrorState
            error={state.error}
            message={t('farmer.audits.loadError')}
            retryTitle={t('farmer.common.retry')}
            offlineMessage={t('farmer.common.offline')}
            onRetry={() => void load()}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (overview === null || overview.isEmpty) {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar barStyle="dark-content" backgroundColor={P.white} />
        {header}
        <View style={styles.centerFill}>
          <Text style={styles.emptyTitle}>{t('farmer.audits.empty.title')}</Text>
          <Text style={styles.emptyBody}>{t('farmer.audits.empty.body')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const nextConductedBy = next === null ? null : auditConductedBy(next);
  const nextTagKey: TranslationKey =
    next?.status === 'IN_PROGRESS'
      ? activeTab === 'external'
        ? 'farmer.audits.upcoming.tagInProgressExternal'
        : 'farmer.audits.upcoming.tagInProgressInternal'
      : activeTab === 'external'
        ? 'farmer.audits.upcoming.tagExternal'
        : 'farmer.audits.upcoming.tagInternal';

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* ── Top Header ── */}
      {header}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Segmented Control (External / Internal) ── */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'external' ? styles.tabBtnActive : styles.tabBtnInactive]}
            onPress={() => setActiveTab('external')}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'external' }}
          >
            <ShieldCheckIcon size={18} color={activeTab === 'external' ? P.white : P.twGray600} />
            <Text style={[styles.tabBtnText, activeTab === 'external' ? styles.tabBtnTextActive : styles.tabBtnTextInactive]}>
              {t('farmer.profile.audits.external')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'internal' ? styles.tabBtnActive : styles.tabBtnInactive]}
            onPress={() => setActiveTab('internal')}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'internal' }}
          >
            <UsersGroupIcon size={18} color={activeTab === 'internal' ? P.white : P.twGray600} />
            <Text style={[styles.tabBtnText, activeTab === 'internal' ? styles.tabBtnTextActive : styles.tabBtnTextInactive]}>
              {t('farmer.profile.audits.internal')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── 3 Summary Metric Cards ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statMainValue}>{t('farmer.audits.stat.perYear', { count: QUARTERS_PER_FISCAL_YEAR })}</Text>
            <Text style={styles.statSubLabel}>{t('farmer.audits.stat.perQuarter')}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statMainValue}>
              {t('farmer.audits.stat.doneRatio', { done: overview.doneThisYear, total: QUARTERS_PER_FISCAL_YEAR })}
            </Text>
            <Text style={styles.statSubLabel}>{t('farmer.audits.stat.doneThisYear')}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.ratingBadgePill}>
              <StarIcon size={11} color={P.white} />
              <Text style={styles.ratingBadgeText}>
                {latestTierKey !== null ? t(k(latestTierKey)) : t('farmer.profile.rating.notRatedShort')}
              </Text>
            </View>
            <Text style={styles.statSubLabel}>{t('farmer.audits.stat.latestRating')}</Text>
          </View>
        </View>

        {/* ── Upcoming Audit Hero Card (Green): date and type only, never scores ── */}
        {next !== null ? (
          <View style={styles.upcomingCard}>
            {/* Header Tag */}
            <View style={styles.upcomingTagRow}>
              <CalendarIcon size={14} color={P.green100} />
              <Text style={styles.upcomingTagText}>{t(nextTagKey)}</Text>
            </View>

            {/* Title */}
            <Text style={styles.upcomingTitle}>
              {activeTab === 'external' ? t('farmer.audits.upcoming.titleExternal') : t('farmer.audits.upcoming.titleInternal')}
            </Text>

            {/* Details list */}
            <View style={styles.upcomingDetailsList}>
              <View style={styles.upcomingDetailRow}>
                <CalendarIcon size={16} color={P.white} />
                <Text style={styles.upcomingDetailTextBold}>{formatUpcomingDateTime(next.scheduledFor)}</Text>
              </View>

              {nextConductedBy !== null ? (
                <View style={styles.upcomingDetailRow}>
                  <BuildingIcon size={16} color={colors.brandGreenLight} />
                  <Text style={styles.upcomingDetailText}>{nextConductedBy}</Text>
                </View>
              ) : null}

              {next.farmName !== null ? (
                <View style={styles.upcomingDetailRow}>
                  <LocationPinIcon size={16} color={colors.brandGreenLight} />
                  <Text style={styles.upcomingDetailText}>{next.farmName}</Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* ── Further upcoming audits (rare: more than one quarter already scheduled) ── */}
        {group !== null && group.laterUpcoming.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>{t('farmer.audits.section.upcoming')}</Text>
            <View style={styles.pastAuditsContainer}>
              {group.laterUpcoming.map((item) => (
                <AuditRow key={item.id} item={item} onPress={() => openResult(item.id)} />
              ))}
            </View>
          </>
        ) : null}

        {/* ── Section Title ── */}
        <Text style={styles.sectionTitle}>
          {activeTab === 'external' ? t('farmer.audits.section.pastExternal') : t('farmer.audits.section.pastInternal')}
        </Text>

        {/* ── Past Audits List ── */}
        <View style={styles.pastAuditsContainer}>
          {group === null || group.past.length === 0 ? (
            <Text style={styles.emptyInline}>
              {activeTab === 'external' ? t('farmer.audits.emptyPastExternal') : t('farmer.audits.emptyPastInternal')}
            </Text>
          ) : (
            group.past.map((item) => <AuditRow key={item.id} item={item} onPress={() => openResult(item.id)} />)
          )}
        </View>
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

  /* Tab Bar (Segmented control) */
  tabBar: {
    flexDirection: 'row',
    backgroundColor: P.white,
    borderRadius: 14,
    padding: 4,
    gap: 6,
    borderWidth: 1,
    borderColor: P.twGray200,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    gap: 8,
  },
  tabBtnActive: {
    backgroundColor: P.primary,
  },
  tabBtnInactive: {
    backgroundColor: P.twGray100,
  },
  tabBtnText: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: P.white,
  },
  tabBtnTextInactive: {
    color: P.twGray600,
  },

  /* 3 Metric Summary Cards */
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  statMainValue: {
    fontSize: typography.title,
    fontWeight: '800',
    color: P.twGray900,
  },
  statSubLabel: {
    fontSize: typography.caption,
    fontWeight: '500',
    color: P.twGray500,
    textAlign: 'center',
  },
  ratingBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: P.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  ratingBadgeText: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: P.white,
  },

  /* Hero Upcoming Card (Green) */
  upcomingCard: {
    marginTop: 16,
    backgroundColor: P.forestGreen,
    borderRadius: 20,
    padding: 18,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  upcomingTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  upcomingTagText: {
    fontSize: typography.caption,
    fontWeight: '800',
    color: P.green100,
    letterSpacing: 0.6,
  },
  upcomingTitle: {
    fontSize: typography.title,
    fontWeight: '800',
    color: P.white,
    marginTop: 8,
    marginBottom: 12,
  },
  upcomingDetailsList: {
    gap: 8,
  },
  upcomingDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  upcomingDetailTextBold: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.white,
  },
  upcomingDetailText: {
    fontSize: typography.body,
    fontWeight: '500',
    color: colors.brandGreenLight,
  },

  /* Section Title */
  sectionTitle: {
    fontSize: typography.bodySmall,
    fontWeight: '800',
    color: P.twGray500,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 12,
  },

  /* Past Audits List */
  pastAuditsContainer: {
    gap: 12,
  },
  pastAuditCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: 14,
    gap: 12,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  dateBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.brandGreenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBoxDay: {
    fontSize: typography.title,
    fontWeight: '800',
    color: P.deepGreen,
    lineHeight: 20,
  },
  dateBoxMonth: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: P.primary,
    marginTop: 2,
  },
  pastAuditInfoCol: {
    flex: 1,
    gap: 3,
  },
  pastAuditTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.twGray900,
  },
  pastAuditAuditor: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  pillGray: {
    backgroundColor: P.twGray100,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pillGrayText: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: P.twGray700,
  },
  pillOrange: {
    backgroundColor: P.twOrange100,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pillOrangeText: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: P.twOrange600,
  },
  pillGreen: {
    backgroundColor: P.primary,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pillBlue: {
    backgroundColor: P.blue700,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pillWhiteText: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: P.white,
  },
  chevronWrapper: {
    paddingLeft: 4,
  },

  /* Loading / error / empty states */
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
  emptyInline: {
    fontSize: typography.body,
    color: P.twGray500,
  },
});
