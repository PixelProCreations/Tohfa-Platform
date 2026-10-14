import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Polyline, Circle } from 'react-native-svg';
import { Icon } from '@tohfa/mobile-ui';
import { t } from '../../../../i18n/farmer';
import { authPalette as P, colors, typography } from '../../theme';
import { getFarms, getPlots } from '../../api/farms';
import {
  listSoilTests,
  getSoilHealthSummary,
  type SoilTestRecord,
  type SoilHealthSummary,
  type SoilHealthMetric,
} from '../../api/soil';

export interface SoilTestScreenProps {
  farmId?: string | undefined;
  onNavigateBack: () => void;
  onNavigateToNewSoilTest?: () => void;
}

/**
 * Shown wherever a reading is missing. Same convention as
 * SoilHealthTrackerScreen's EMPTY_READING: an honest dash, never a plausible
 * sample number -- a farmer acting on a made-up pH is worse off than one who
 * sees that no test has been recorded.
 */
const EMPTY_VALUE = '—';
const DATE_FORMAT: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
const MS_PER_DAY = 1000 * 60 * 60 * 24;
/** How many of the most recent tests feed the fallback trend line. */
const TREND_TEST_COUNT = 5;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', DATE_FORMAT);
}

function formatValue(value: number | null | undefined): string {
  return value != null ? String(value) : EMPTY_VALUE;
}

/**
 * A trend series built only from real data: the server's chart points when it
 * has at least two, otherwise the farmer's own recorded tests (oldest first).
 * Fewer than two real points means there is no trend to draw -- return [] and
 * let the card show its empty state rather than padding with sample values.
 */
function buildTrendSeries(
  metric: SoilHealthMetric | undefined,
  testValuesNewestFirst: (number | null | undefined)[],
): number[] {
  if (metric && metric.chartPoints.length >= 2) {
    return metric.chartPoints.map((p) => p.value);
  }
  const real = testValuesNewestFirst
    .slice(0, TREND_TEST_COUNT)
    .filter((v): v is number => v != null)
    .reverse();
  return real.length >= 2 ? real : [];
}

/** Trend wording only when the server actually reported a direction. */
function trendLabel(direction: SoilHealthMetric['trendDirection'] | undefined): string {
  if (direction === 'declining') return t('farmer.profile.soil.trendDeclining');
  if (direction === 'improving') return t('farmer.profile.soil.trendImproving');
  if (direction === 'flat') return t('farmer.profile.soil.trendFlat');
  return '';
}

function nextDueText(nextDueDate: string): string | null {
  const due = new Date(nextDueDate).getTime();
  if (Number.isNaN(due)) return null;
  const days = Math.ceil((due - Date.now()) / MS_PER_DAY);
  const date = formatDate(nextDueDate);
  return days >= 0
    ? t('farmer.profile.soil.nextDueAway', { date, days })
    : t('farmer.profile.soil.nextDueOverdue', { date, days: Math.abs(days) });
}

export function SoilTestScreen({ farmId, onNavigateBack, onNavigateToNewSoilTest }: SoilTestScreenProps): React.JSX.Element {
  const [tests, setTests] = useState<SoilTestRecord[]>([]);
  const [healthSummary, setHealthSummary] = useState<SoilHealthSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        let activeFarmId = farmId;
        if (!activeFarmId) {
          const farms = await getFarms();
          activeFarmId = farms[0]?.id;
        }
        if (!activeFarmId) {
          setLoading(false);
          return;
        }

        const plots = await getPlots(activeFarmId);
        if (cancelled) return;

        if (plots.length > 0) {
          const perPlot = await Promise.all(
            plots.map((p) => listSoilTests(activeFarmId!, p.id).catch(() => [])),
          );
          const all = perPlot.flat().sort((a, b) => (a.testDate < b.testDate ? 1 : -1));
          if (!cancelled) setTests(all);

          const firstPlot = plots[0];
          if (firstPlot) {
            const sum = await getSoilHealthSummary(activeFarmId, firstPlot.id).catch(() => null);
            if (!cancelled && sum) setHealthSummary(sum);
          }
        }
      } catch {
        // Surface the failure instead of rendering it as "no tests recorded".
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [farmId]);

  const latestTest = tests[0] ?? null;

  const renderTrendChart = (
    data: number[],
    color: string,
    isDeclining: boolean,
    title: string,
    subtitle: string,
    subtitleColor: string,
  ) => {
    if (data.length < 2) {
      return (
        <View style={styles.trendCard}>
          <View style={styles.trendHeader}>
            <Text style={styles.trendTitle}>{title}</Text>
          </View>
          <Text style={styles.trendEmpty}>{t('farmer.profile.soil.trendNotEnoughData')}</Text>
        </View>
      );
    }

    // Simple line chart using SVG
    const width = 120;
    const height = 40;
    const padding = 5;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data.map((val, index) => {
      const x = padding + (index / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      return { x, y };
    });

    const pointsStr = points.map((p) => `${p.x},${p.y}`).join(' ');

    return (
      <View style={styles.trendCard}>
        <View style={styles.trendHeader}>
          <Text style={styles.trendTitle}>{title}</Text>
          <Icon
            name="trending_up"
            size={16}
            color={color}
            style={isDeclining ? styles.trendIconDeclining : undefined}
          />
        </View>
        <Svg width={width} height={height} style={styles.trendChart}>
          <Polyline points={pointsStr} fill="none" stroke={color} strokeWidth="2" />
          {points.map((p, i) => (
            <Circle key={i} cx={p.x} cy={p.y} r="3" fill={color} />
          ))}
        </Svg>
        {subtitle ? (
          <Text style={[styles.trendSubtitle, { color: subtitleColor }]}>{subtitle}</Text>
        ) : null}
      </View>
    );
  };

  const phChartData = buildTrendSeries(healthSummary?.ph, tests.map((test) => test.ph));
  const ocChartData = buildTrendSeries(
    healthSummary?.organicCarbon,
    tests.map((test) => test.organicCarbonPct),
  );

  // Only a real recorded pH can raise the acidity alert.
  const isPhAcidic = latestTest?.ph != null && latestTest.ph < 6.0;
  const nextDue = latestTest?.nextDueDate ? nextDueText(latestTest.nextDueDate) : null;

  /** A classification badge, rendered only when the server supplied a label. */
  const renderBadge = (label: string | null | undefined, backgroundColor: string, color: string) =>
    label ? (
      <View style={[styles.badge, { backgroundColor }]}>
        <Text style={[styles.badgeText, { color }]}>{label}</Text>
      </View>
    ) : null;

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.navCircleButton} onPress={onNavigateBack}>
          <Text style={styles.navBackIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>{t('farmer.profile.soil.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('farmer.profile.soil.headerSubtitle')}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator style={styles.loader} color={P.primary} />
        ) : loadError ? (
          <Text style={styles.emptyText}>{t('farmer.profile.soil.loadError')}</Text>
        ) : (
          <>
            {/* Next Test Card */}
            <View style={styles.dateCard}>
              <Icon name="calendar_today" size={24} color={P.deepGreen} style={styles.dateIcon} />
              <View style={styles.dateInfo}>
                {latestTest ? (
                  <>
                    <Text style={styles.dateTitle}>
                      {t('farmer.profile.soil.testedOn', { date: formatDate(latestTest.testDate) })}
                    </Text>
                    {nextDue ? <Text style={styles.dateSubtitle}>{nextDue}</Text> : null}
                  </>
                ) : (
                  <>
                    <Text style={styles.dateTitle}>{t('farmer.profile.soil.noTestYet')}</Text>
                    <Text style={styles.dateSubtitle}>{t('farmer.profile.soil.noTestYetHint')}</Text>
                  </>
                )}
              </View>
            </View>

            {/* Alert Box -- only when a real reading is acidic */}
            {isPhAcidic && latestTest && (
              <View style={styles.alertBox}>
                <Text style={styles.alertIcon}>❗</Text>
                <View style={styles.alertInfo}>
                  <Text style={styles.alertTitle}>
                    {t('farmer.profile.soil.alertTitle', { value: String(latestTest.ph) })}
                  </Text>
                  <Text style={styles.alertDesc}>{t('farmer.profile.soil.alertDesc')}</Text>
                </View>
              </View>
            )}

            <Text style={styles.sectionHeading}>{t('farmer.profile.soil.sectionLatestResults')}</Text>

            {/* Results List */}
            <View style={styles.resultsCard}>
              {/* Result Item 1: Organic Carbon */}
              <View style={styles.resultItem}>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>{t('farmer.profile.soil.organicCarbon')}</Text>
                  <Text style={styles.resultIdeal}>{t('farmer.profile.soil.idealOrganicCarbon')}</Text>
                </View>
                <View style={styles.resultValueBox}>
                  <Text style={styles.resultValue}>
                    {formatValue(latestTest?.organicCarbonPct)}
                    {latestTest?.organicCarbonPct != null ? <Text style={styles.resultUnit}>%</Text> : null}
                  </Text>
                  {renderBadge(latestTest?.organicCarbonLabel, P.blue50, P.blue800)}
                </View>
              </View>
              <View style={styles.divider} />

              {/* Result Item 2: pH */}
              <View style={styles.resultItem}>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>{t('farmer.profile.soil.phShort')}</Text>
                  <Text style={styles.resultIdeal}>{t('farmer.profile.soil.idealPh')}</Text>
                </View>
                <View style={styles.resultValueBox}>
                  <Text style={[styles.resultValue, { color: isPhAcidic ? P.red800 : P.slate800 }]}>
                    {formatValue(latestTest?.ph)}
                  </Text>
                  {renderBadge(
                    latestTest?.phLabel,
                    isPhAcidic ? P.red50 : colors.brandGreenLight,
                    isPhAcidic ? P.red800 : P.primary,
                  )}
                </View>
              </View>
              <View style={styles.divider} />

              {/* Result Item 3: EC */}
              <View style={styles.resultItem}>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>{t('farmer.profile.soil.ecShort')}</Text>
                  <Text style={styles.resultIdeal}>{t('farmer.profile.soil.idealEc')}</Text>
                </View>
                <View style={styles.resultValueBox}>
                  <Text style={styles.resultValue}>
                    {formatValue(latestTest?.ecDsPerM)}
                    {latestTest?.ecDsPerM != null ? <Text style={styles.resultUnit}>dS/m</Text> : null}
                  </Text>
                  {renderBadge(latestTest?.ecLabel, colors.brandGreenLight, P.primary)}
                </View>
              </View>
              <View style={styles.divider} />

              {/* Result Item: Nitrogen (N) */}
              <View style={styles.resultItem}>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>{t('farmer.profile.soil.nitrogen')}</Text>
                  <Text style={styles.resultIdeal}>{t('farmer.profile.soil.idealNitrogen')}</Text>
                </View>
                <View style={styles.resultValueBox}>
                  <Text style={styles.resultValue}>
                    {formatValue(latestTest?.nitrogenKgPerHa)}
                    {latestTest?.nitrogenKgPerHa != null ? <Text style={styles.resultUnit}>kg/ha</Text> : null}
                  </Text>
                  {renderBadge(latestTest?.nitrogenLabel, colors.brandGreenLight, P.primary)}
                </View>
              </View>
              <View style={styles.divider} />

              {/* Result Item: Phosphorus (P) */}
              <View style={styles.resultItem}>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>{t('farmer.profile.soil.phosphorus')}</Text>
                  <Text style={styles.resultIdeal}>{t('farmer.profile.soil.idealPhosphorus')}</Text>
                </View>
                <View style={styles.resultValueBox}>
                  <Text style={styles.resultValue}>
                    {formatValue(latestTest?.phosphorusKgPerHa)}
                    {latestTest?.phosphorusKgPerHa != null ? <Text style={styles.resultUnit}>kg/ha</Text> : null}
                  </Text>
                  {renderBadge(latestTest?.phosphorusLabel, colors.brandGreenLight, P.primary)}
                </View>
              </View>
              <View style={styles.divider} />

              {/* Result Item: Potassium (K) */}
              <View style={styles.resultItem}>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>{t('farmer.profile.soil.potassium')}</Text>
                  <Text style={styles.resultIdeal}>{t('farmer.profile.soil.idealPotassium')}</Text>
                </View>
                <View style={styles.resultValueBox}>
                  <Text style={styles.resultValue}>
                    {formatValue(latestTest?.potassiumKgPerHa)}
                    {latestTest?.potassiumKgPerHa != null ? <Text style={styles.resultUnit}>kg/ha</Text> : null}
                  </Text>
                  {renderBadge(latestTest?.potassiumLabel, colors.brandGreenLight, P.primary)}
                </View>
              </View>
              <View style={styles.divider} />

              {/* Result Item 4: TDS */}
              <View style={styles.resultItem}>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>{t('farmer.profile.soil.tdsShort')}</Text>
                  <Text style={styles.resultIdeal}>{t('farmer.profile.soil.idealTds')}</Text>
                </View>
                <View style={styles.resultValueBox}>
                  <Text style={styles.resultValue}>
                    {formatValue(latestTest?.tdsPpm)}
                    {latestTest?.tdsPpm != null ? <Text style={styles.resultUnit}>ppm</Text> : null}
                  </Text>
                  {renderBadge(latestTest?.tdsLabel, colors.brandGreenLight, P.primary)}
                </View>
              </View>
              <View style={styles.divider} />

              {/* Result Item 5: Lime Status */}
              <View style={[styles.resultItem, { paddingBottom: 0 }]}>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>{t('farmer.profile.soil.limeStatus')}</Text>
                  <Text style={styles.resultIdeal}>{t('farmer.profile.soil.calcareousness')}</Text>
                </View>
                <View style={styles.resultValueBox}>
                  {latestTest?.limeStatus ? (
                    <View style={[styles.badge, { backgroundColor: colors.brandGreenLight, marginLeft: 0 }]}>
                      <Text style={[styles.badgeText, { color: P.primary }]}>{latestTest.limeStatus}</Text>
                    </View>
                  ) : (
                    <Text style={styles.resultValue}>{EMPTY_VALUE}</Text>
                  )}
                </View>
              </View>
            </View>

            <Text style={styles.sectionHeading}>{t('farmer.profile.soil.sectionTrend')}</Text>

            <View style={styles.trendRow}>
              {renderTrendChart(
                phChartData,
                P.red800,
                healthSummary?.ph.trendDirection === 'declining' || isPhAcidic,
                t('farmer.profile.soil.phShort'),
                trendLabel(healthSummary?.ph.trendDirection),
                P.red800,
              )}
              {renderTrendChart(
                ocChartData,
                P.primary,
                healthSummary?.organicCarbon.trendDirection === 'declining',
                t('farmer.profile.soil.organicCarbon'),
                trendLabel(healthSummary?.organicCarbon.trendDirection),
                P.midGrey,
              )}
            </View>

            {/*
              Only a real attached report is shown. There is no client call that turns
              an upload id into a viewable URL yet (only /uploads/sign for writing), so
              this is a status line with no open action and no invented file name/size.
            */}
            {latestTest?.labReportUploadId ? (
              <View style={styles.documentCard}>
                <View style={styles.docIconBox}>
                  <Icon name="description" size={20} color={P.red800} />
                </View>
                <View style={styles.docInfo}>
                  <Text style={styles.docName}>{t('farmer.profile.soil.labReportAttached')}</Text>
                  <Text style={styles.docMeta}>{formatDate(latestTest.testDate)}</Text>
                </View>
              </View>
            ) : null}

            <Text style={styles.sectionHeading}>{t('farmer.profile.soil.sectionHistory')}</Text>

            <View style={styles.historyList}>
              {tests.length > 0 ? (
                tests.map((test, index) => (
                  <View key={test.id} style={styles.historyCard}>
                    <View style={styles.historyInfo}>
                      <View style={styles.historyHeaderRow}>
                        <Text style={styles.historyDate}>{formatDate(test.testDate)}</Text>
                        {index === 0 && (
                          <View style={[styles.badge, { backgroundColor: colors.brandGreenLight, paddingVertical: 2, paddingHorizontal: 6 }]}>
                            <Text style={[styles.badgeText, { color: P.primary, fontSize: typography.caption }]}>
                              {t('farmer.profile.soil.badgeLatest')}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.historySummary}>
                        {t('farmer.profile.soil.historySummary', {
                          ph: formatValue(test.ph),
                          oc: formatValue(test.organicCarbonPct),
                          ec: formatValue(test.ecDsPerM),
                        })}
                      </Text>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>{t('farmer.profile.soil.noHistory')}</Text>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Sticky Bottom Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => onNavigateToNewSoilTest?.()}>
          <Icon name="upload" size={18} color={P.white} style={styles.primaryButtonIcon} />
          <Text style={styles.primaryButtonText}>{t('farmer.profile.soil.uploadNewReport')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: P.slate50 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: P.white,
    borderBottomWidth: 1,
    borderBottomColor: P.slate100,
  },
  navCircleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.slate200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBackIcon: { color: P.primary, fontSize: typography.headline, lineHeight: 28, marginRight: 2 },
  headerTitleBox: { flex: 1, marginLeft: 16 },
  headerTitle: { color: P.deepGreen, fontSize: typography.title, fontWeight: 'bold' },
  headerSubtitle: { color: P.slate500, fontSize: typography.body, marginTop: 2 },

  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Space for bottom button
  },

  dateCard: {
    flexDirection: 'row',
    backgroundColor: P.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  dateIcon: { fontSize: typography.headline, marginRight: 16 },
  dateInfo: { flex: 1 },
  dateTitle: { fontSize: typography.bodyLarge, fontWeight: 'bold', color: P.slate800, marginBottom: 4 },
  dateSubtitle: { fontSize: typography.body, color: P.slate500 },

  alertBox: {
    flexDirection: 'row',
    backgroundColor: P.red50,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: P.red100,
  },
  alertIcon: { fontSize: typography.title, color: P.red800, marginRight: 12, fontWeight: 'bold' },
  alertInfo: { flex: 1 },
  alertTitle: { fontSize: typography.bodyLarge, fontWeight: 'bold', color: P.red800, marginBottom: 6 },
  alertDesc: { fontSize: typography.body, color: P.red800, lineHeight: 20 },

  sectionHeading: {
    fontSize: typography.bodySmall,
    fontWeight: 'bold',
    color: P.placeholderGrey,
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
  },

  resultsCard: {
    backgroundColor: P.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  resultInfo: { flex: 1 },
  resultName: { fontSize: typography.bodyLarge, fontWeight: '600', color: P.slate800, marginBottom: 4 },
  resultIdeal: { fontSize: typography.bodySmall, color: P.slate400 },
  resultValueBox: { flexDirection: 'row', alignItems: 'center' },
  resultValue: { fontSize: typography.title, fontWeight: 'bold', color: P.slate800 },
  resultUnit: { fontSize: typography.bodySmall, fontWeight: '600', color: P.slate500 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  badgeText: { fontSize: typography.caption, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: P.slate100 },

  trendRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  trendCard: {
    flex: 1,
    backgroundColor: P.white,
    borderRadius: 16,
    padding: 12,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  trendHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trendTitle: { fontSize: typography.body, fontWeight: '600', color: P.slate800 },
  trendIcon: { fontSize: typography.bodyLarge },
  trendIconDeclining: { transform: [{ scaleY: -1 }] },
  trendChart: { marginVertical: 12 },
  trendSubtitle: { fontSize: typography.caption },
  trendEmpty: { fontSize: typography.caption, color: P.slate500, marginTop: 12 },

  loader: { marginTop: 32 },
  emptyText: { fontSize: typography.body, color: P.slate500, textAlign: 'center', paddingVertical: 16 },

  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  docIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: P.red50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  docIcon: { fontSize: typography.title },
  docInfo: { flex: 1 },
  docName: { fontSize: typography.body, fontWeight: '600', color: P.slate800, marginBottom: 2 },
  docMeta: { fontSize: typography.bodySmall, color: P.slate500 },

  historyList: { gap: 12 },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  historyInfo: { flex: 1 },
  historyHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  historyDate: { fontSize: typography.bodyLarge, fontWeight: 'bold', color: P.slate800, marginRight: 8 },
  historySummary: { fontSize: typography.body, color: P.slate500 },
  chevron: { fontSize: typography.title, color: P.slate400 },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: P.white,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: P.slate100,
  },
  primaryButton: {
    backgroundColor: P.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryButtonIcon: { fontSize: typography.title, marginRight: 8, color: P.white },
  primaryButtonText: { color: P.white, fontSize: typography.bodyLarge, fontWeight: 'bold' },
});
