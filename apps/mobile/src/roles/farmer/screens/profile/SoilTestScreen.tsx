import React, { useEffect, useState } from 'react';
import {
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
} from '../../api/soil';

export interface SoilTestScreenProps {
  farmId?: string | undefined;
  onNavigateBack: () => void;
  onNavigateToNewSoilTest?: () => void;
}

export function SoilTestScreen({ farmId, onNavigateBack, onNavigateToNewSoilTest }: SoilTestScreenProps): React.JSX.Element {
  const [tests, setTests] = useState<SoilTestRecord[]>([]);
  const [healthSummary, setHealthSummary] = useState<SoilHealthSummary | null>(null);
  const [loading, setLoading] = useState(true);

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
        // Fallback gracefully
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
        <Text style={[styles.trendSubtitle, { color: subtitleColor }]}>{subtitle}</Text>
      </View>
    );
  };

  const phChartData =
    healthSummary?.ph.chartPoints && healthSummary.ph.chartPoints.length >= 2
      ? healthSummary.ph.chartPoints.map((p) => p.value)
      : tests.length >= 2
        ? tests.slice(0, 5).reverse().map((t) => t.ph)
        : [6.4, 6.1, latestTest?.ph ?? 5.8];

  const ocChartData =
    healthSummary?.organicCarbon.chartPoints && healthSummary.organicCarbon.chartPoints.length >= 2
      ? healthSummary.organicCarbon.chartPoints.map((p) => p.value)
      : tests.length >= 2
        ? tests.slice(0, 5).reverse().map((t) => t.organicCarbonPct)
        : [0.55, 0.59, latestTest?.organicCarbonPct ?? 0.62];

  const isPhAcidic = latestTest ? latestTest.ph < 6.0 : true;

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
        {/* Next Test Card */}
        <View style={styles.dateCard}>
          <Icon name="calendar_today" size={24} color={P.deepGreen} style={styles.dateIcon} />
          <View style={styles.dateInfo}>
            <Text style={styles.dateTitle}>
              {t('farmer.profile.soil.testedOn', { date: latestTest?.testDate ? new Date(latestTest.testDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '12 Jun 2026' })}
            </Text>
            <Text style={styles.dateSubtitle}>
              {t('farmer.profile.soil.nextDueAway', {
                date: latestTest?.nextDueDate ? new Date(latestTest.nextDueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '11 Jun 2027',
                days: 330,
              })}
            </Text>
          </View>
        </View>

        {/* Alert Box */}
        {isPhAcidic && (
          <View style={styles.alertBox}>
            <Text style={styles.alertIcon}>❗</Text>
            <View style={styles.alertInfo}>
              <Text style={styles.alertTitle}>
                {t('farmer.profile.soil.alertTitle', { value: latestTest?.ph != null ? String(latestTest.ph) : '5.8' })}
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
                {latestTest?.organicCarbonPct != null ? latestTest.organicCarbonPct : '0.62'}
                <Text style={styles.resultUnit}>%</Text>
              </Text>
              <View style={[styles.badge, { backgroundColor: P.blue50 }]}>
                <Text style={[styles.badgeText, { color: P.blue800 }]}>
                  {latestTest?.organicCarbonLabel || t('farmer.profile.soil.badgeMedium')}
                </Text>
              </View>
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
                {latestTest?.ph != null ? latestTest.ph : '5.8'}
              </Text>
              <View style={[styles.badge, { backgroundColor: isPhAcidic ? P.red50 : colors.brandGreenLight }]}>
                <Text style={[styles.badgeText, { color: isPhAcidic ? P.red800 : P.primary }]}>
                  {latestTest?.phLabel || t('farmer.profile.soil.acidic')}
                </Text>
              </View>
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
                {latestTest?.ecDsPerM != null ? latestTest.ecDsPerM : '0.7'}
                <Text style={styles.resultUnit}>dS/m</Text>
              </Text>
              <View style={[styles.badge, { backgroundColor: colors.brandGreenLight }]}>
                <Text style={[styles.badgeText, { color: P.primary }]}>
                  {latestTest?.ecLabel || t('farmer.profile.soil.good')}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.divider} />

          {/* Result Item: Nitrogen (N) */}
          <View style={styles.resultItem}>
            <View style={styles.resultInfo}>
              <Text style={styles.resultName}>Available Nitrogen (N)</Text>
              <Text style={styles.resultIdeal}>Ideal 280–560 kg/ha</Text>
            </View>
            <View style={styles.resultValueBox}>
              <Text style={styles.resultValue}>
                {latestTest?.nitrogenKgPerHa != null ? latestTest.nitrogenKgPerHa : '280'}
                <Text style={styles.resultUnit}>kg/ha</Text>
              </Text>
              <View style={[styles.badge, { backgroundColor: colors.brandGreenLight }]}>
                <Text style={[styles.badgeText, { color: P.primary }]}>
                  {latestTest?.nitrogenLabel || t('farmer.profile.soil.good')}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.divider} />

          {/* Result Item: Phosphorus (P) */}
          <View style={styles.resultItem}>
            <View style={styles.resultInfo}>
              <Text style={styles.resultName}>Available Phosphorus (P)</Text>
              <Text style={styles.resultIdeal}>Ideal 10–25 kg/ha</Text>
            </View>
            <View style={styles.resultValueBox}>
              <Text style={styles.resultValue}>
                {latestTest?.phosphorusKgPerHa != null ? latestTest.phosphorusKgPerHa : '24'}
                <Text style={styles.resultUnit}>kg/ha</Text>
              </Text>
              <View style={[styles.badge, { backgroundColor: colors.brandGreenLight }]}>
                <Text style={[styles.badgeText, { color: P.primary }]}>
                  {latestTest?.phosphorusLabel || t('farmer.profile.soil.good')}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.divider} />

          {/* Result Item: Potassium (K) */}
          <View style={styles.resultItem}>
            <View style={styles.resultInfo}>
              <Text style={styles.resultName}>Available Potassium (K)</Text>
              <Text style={styles.resultIdeal}>Ideal 110–280 kg/ha</Text>
            </View>
            <View style={styles.resultValueBox}>
              <Text style={styles.resultValue}>
                {latestTest?.potassiumKgPerHa != null ? latestTest.potassiumKgPerHa : '195'}
                <Text style={styles.resultUnit}>kg/ha</Text>
              </Text>
              <View style={[styles.badge, { backgroundColor: colors.brandGreenLight }]}>
                <Text style={[styles.badgeText, { color: P.primary }]}>
                  {latestTest?.potassiumLabel || t('farmer.profile.soil.good')}
                </Text>
              </View>
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
                {latestTest?.tdsPpm != null ? latestTest.tdsPpm : '312'}
                <Text style={styles.resultUnit}>ppm</Text>
              </Text>
              <View style={[styles.badge, { backgroundColor: colors.brandGreenLight }]}>
                <Text style={[styles.badgeText, { color: P.primary }]}>
                  {latestTest?.tdsLabel || t('farmer.profile.soil.good')}
                </Text>
              </View>
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
              <View style={[styles.badge, { backgroundColor: colors.brandGreenLight, marginLeft: 0 }]}>
                <Text style={[styles.badgeText, { color: P.primary }]}>
                  {latestTest?.limeStatus || t('farmer.profile.soil.badgeHarmless')}
                </Text>
              </View>
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
            healthSummary?.ph.trendDirection === 'declining'
              ? t('farmer.profile.soil.trendDeclining')
              : t('farmer.profile.soil.trendImproving'),
            P.red800,
          )}
          {renderTrendChart(
            ocChartData,
            P.primary,
            healthSummary?.organicCarbon.trendDirection === 'declining',
            t('farmer.profile.soil.organicCarbon'),
            healthSummary?.organicCarbon.trendDirection === 'improving'
              ? t('farmer.profile.soil.trendImproving')
              : t('farmer.profile.soil.trendDeclining'),
            P.midGrey,
          )}
        </View>

        <View style={styles.documentCard}>
          <View style={styles.docIconBox}>
            <Icon name="description" size={20} color={P.red800} />
          </View>
          <View style={styles.docInfo}>
            <Text style={styles.docName}>
              {latestTest?.labReportUploadId ? `soil_report_${latestTest.id.slice(0, 8)}.pdf` : 'soil_report_jun2026.pdf'}
            </Text>
            <Text style={styles.docMeta}>{t('farmer.profile.soil.documentMeta', { size: '820 KB' })}</Text>
          </View>
          <TouchableOpacity style={styles.docAction}>
            <Icon name="visibility" size={16} color={P.slate600} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionHeading}>{t('farmer.profile.soil.sectionHistory')}</Text>

        <View style={styles.historyList}>
          {tests.length > 0 ? (
            tests.map((test, index) => (
              <View key={test.id} style={styles.historyCard}>
                <View style={styles.historyInfo}>
                  <View style={styles.historyHeaderRow}>
                    <Text style={styles.historyDate}>
                      {new Date(test.testDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </Text>
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
                      ph: String(test.ph),
                      oc: String(test.organicCarbonPct),
                      ec: String(test.ecDsPerM),
                    })}
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </View>
            ))
          ) : (
            <>
              {/* Fallback Sample History */}
              <View style={styles.historyCard}>
                <View style={styles.historyInfo}>
                  <View style={styles.historyHeaderRow}>
                    <Text style={styles.historyDate}>12 Jun 2026</Text>
                    <View style={[styles.badge, { backgroundColor: colors.brandGreenLight, paddingVertical: 2, paddingHorizontal: 6 }]}>
                      <Text style={[styles.badgeText, { color: P.primary, fontSize: typography.caption }]}>{t('farmer.profile.soil.badgeLatest')}</Text>
                    </View>
                  </View>
                  <Text style={styles.historySummary}>
                    {t('farmer.profile.soil.historySummary', { ph: '5.8', oc: '0.62', ec: '0.7' })}
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </View>

              <View style={styles.historyCard}>
                <View style={styles.historyInfo}>
                  <View style={styles.historyHeaderRow}>
                    <Text style={styles.historyDate}>05 Jun 2025</Text>
                  </View>
                  <Text style={styles.historySummary}>
                    {t('farmer.profile.soil.historySummary', { ph: '6.1', oc: '0.59', ec: '0.6' })}
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </View>

              <View style={styles.historyCard}>
                <View style={styles.historyInfo}>
                  <View style={styles.historyHeaderRow}>
                    <Text style={styles.historyDate}>20 May 2024</Text>
                  </View>
                  <Text style={styles.historySummary}>
                    {t('farmer.profile.soil.historySummary', { ph: '6.4', oc: '0.55', ec: '0.6' })}
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </View>
            </>
          )}
        </View>
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
  docAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: P.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docActionIcon: { fontSize: typography.bodyLarge },

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
