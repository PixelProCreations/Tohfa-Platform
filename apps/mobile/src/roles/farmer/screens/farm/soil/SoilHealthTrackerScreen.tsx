import React, { useState, useEffect, useCallback } from 'react';
import {
  BackHandler,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Skeleton } from '@tohfa/mobile-ui';
import { authPalette as P, typography } from '../../../theme';
import { formatErrorMessage } from '../../../../../shell/api/client';
import { getPlots, type Plot } from '../../../api/farms';
import { getSoilHealthSummary, listSoilTests, type SoilHealthSummary, type SoilTestRecord } from '../../../api/soil';

// ─────────────────────────────────────────────
// Inline Vector Icons (strictly no emojis, no raw hex)
// ─────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = P.twGreen800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LeafSproutIcon({ size = 20, color = P.forestGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22C6 22 4 17 4 12 4 6.5 8.5 2 12 2c3.5 0 8 4.5 8 10 0 5-2 10-8 10z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 22V10M12 14c3-1.5 5-1.5 5-1.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Types & Data
// ─────────────────────────────────────────────

export interface SoilHealthTrackerScreenProps {
  /** The farm whose plots are shown as zone pills, threaded from SoilManagementScreen. */
  farmId: string;
  onBack?: (() => void) | undefined;
}

interface ZoneReading {
  ph: string;
  phDiff: string;
  isPhImproving: boolean;
  oc: string;
  ocDiff: string;
  isOcImproving: boolean;
  tds: string;
  tdsDiff: string;
  isTdsDown: boolean;
  nitrogen: string;
  nitrogenDiff: string;
  phosphorus: string;
  phosphorusDiff: string;
  potassium: string;
  potassiumDiff: string;
  chartBars: { month: string; value: number }[];
  insight: string;
}

const EMPTY_READING: ZoneReading = {
  ph: '—',
  phDiff: 'No test history yet',
  isPhImproving: false,
  oc: '—',
  ocDiff: 'No test history yet',
  isOcImproving: false,
  tds: '—',
  tdsDiff: 'No test history yet',
  isTdsDown: false,
  nitrogen: '—',
  nitrogenDiff: 'No test history yet',
  phosphorus: '—',
  phosphorusDiff: 'No test history yet',
  potassium: '—',
  potassiumDiff: 'No test history yet',
  chartBars: [],
  insight: 'Not enough soil test history yet to show a trend.',
};

function trendArrow(direction: 'improving' | 'declining' | 'flat' | null): string {
  if (direction === 'improving') return '↑';
  if (direction === 'declining') return '↓';
  if (direction === 'flat') return '→';
  return '';
}

/**
 * Bar heights are rendered as a CSS-style `${value}%`, so raw pH/ppm readings
 * (e.g. 6.4) would draw an almost-invisible bar. Min-max normalizes each
 * series into a 25-100 range purely for the bar's visual height -- the actual
 * number shown to the farmer is always the real reading in the "Current
 * readings" card below, never this normalized value.
 */
function normalizeChartPoints(points: { month: string; value: number }[]): { month: string; value: number }[] {
  if (points.length === 0) return [];
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return points.map((p) => ({
    month: p.month,
    value: 25 + ((p.value - min) / range) * 75,
  }));
}

function buildInsight(summary: SoilHealthSummary): string {
  const parts: string[] = [];
  if (summary.ph.trendDirection) parts.push(`pH is ${summary.ph.trendDirection}`);
  if (summary.organicCarbon.trendDirection) parts.push(`organic carbon is ${summary.organicCarbon.trendDirection}`);
  if (summary.tds.trendDirection) parts.push(`TDS is ${summary.tds.trendDirection}`);
  if (parts.length === 0) return EMPTY_READING.insight;
  return `${parts.join(', ')} since the last test.`;
}

function toReading(summary: SoilHealthSummary | null, tests: SoilTestRecord[] = []): ZoneReading {
  const ph = summary?.ph;
  const organicCarbon = summary?.organicCarbon;
  const tds = summary?.tds;

  const sortedTests = [...tests].sort(
    (a, b) => new Date(b.testDate || b.createdAt).getTime() - new Date(a.testDate || a.createdAt).getTime(),
  );
  const latest = sortedTests[0];
  const previous = sortedTests[1];

  const calcDiff = (currVal: number | null | undefined, prevVal: number | null | undefined, unit = 'kg/ha') => {
    if (currVal == null) return 'No test history yet';
    if (prevVal == null) return 'No prior test to compare';
    const diff = Number((currVal - prevVal).toFixed(2));
    const arrow = diff > 0 ? '↑' : diff < 0 ? '↓' : '→';
    return `${arrow} ${diff >= 0 ? '+' : ''}${diff} ${unit} vs last test`;
  };

  const nVal = latest?.nitrogenKgPerHa;
  const prevN = previous?.nitrogenKgPerHa;
  const pVal = latest?.phosphorusKgPerHa;
  const prevP = previous?.phosphorusKgPerHa;
  const kVal = latest?.potassiumKgPerHa;
  const prevK = previous?.potassiumKgPerHa;

  return {
    ph: ph?.currentValue !== null && ph?.currentValue !== undefined ? `${ph.currentValue}` : latest?.ph != null ? `${latest.ph}` : '—',
    phDiff:
      ph?.deltaValue !== null && ph?.deltaValue !== undefined
        ? `${trendArrow(ph.trendDirection)} ${ph.deltaValue >= 0 ? '+' : ''}${ph.deltaValue} vs last test`
        : 'No prior test to compare',
    isPhImproving: ph?.trendDirection === 'improving',
    oc: organicCarbon?.currentValue !== null && organicCarbon?.currentValue !== undefined ? `${organicCarbon.currentValue}%` : latest?.organicCarbonPct != null ? `${latest.organicCarbonPct}%` : '—',
    ocDiff:
      organicCarbon?.deltaValue !== null && organicCarbon?.deltaValue !== undefined
        ? `${trendArrow(organicCarbon.trendDirection)} ${organicCarbon.deltaValue >= 0 ? '+' : ''}${organicCarbon.deltaValue}% vs last test`
        : 'No prior test to compare',
    isOcImproving: organicCarbon?.trendDirection === 'improving',
    tds: tds?.currentValue !== null && tds?.currentValue !== undefined ? `${tds.currentValue}` : latest?.tdsPpm != null ? `${latest.tdsPpm}` : '—',
    tdsDiff:
      tds?.deltaValue !== null && tds?.deltaValue !== undefined
        ? `${trendArrow(tds.trendDirection)} ${tds.deltaValue >= 0 ? '+' : ''}${tds.deltaValue} ppm vs last test`
        : 'No prior test to compare',
    isTdsDown: tds?.trendDirection === 'improving',
    nitrogen: nVal != null ? `${nVal}` : '—',
    nitrogenDiff: calcDiff(nVal, prevN, 'kg/ha'),
    phosphorus: pVal != null ? `${pVal}` : '—',
    phosphorusDiff: calcDiff(pVal, prevP, 'kg/ha'),
    potassium: kVal != null ? `${kVal}` : '—',
    potassiumDiff: calcDiff(kVal, prevK, 'kg/ha'),
    chartBars: normalizeChartPoints(ph?.chartPoints || []),
    insight: summary ? buildInsight(summary) : EMPTY_READING.insight,
  };
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export function SoilHealthTrackerScreen({ farmId, onBack }: SoilHealthTrackerScreenProps): React.JSX.Element {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [selectedPlotId, setSelectedPlotId] = useState<string>('');
  const [plotsLoading, setPlotsLoading] = useState(true);
  const [plotsError, setPlotsError] = useState<string | null>(null);

  const [reading, setReading] = useState<ZoneReading>(EMPTY_READING);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Android hardware back handler
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (onBack) {
        onBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [onBack]);

  const loadPlots = useCallback(async () => {
    if (!farmId) {
      setPlotsLoading(false);
      setPlotsError('No farm selected. Go back and choose a farm first.');
      return;
    }
    setPlotsLoading(true);
    setPlotsError(null);
    try {
      const list = await getPlots(farmId);
      setPlots(list);
      setSelectedPlotId((prev) => (list.some((p) => p.id === prev) ? prev : (list[0]?.id ?? '')));
    } catch (err) {
      setPlotsError(formatErrorMessage(err, 'Could not load this farm’s zones.'));
    } finally {
      setPlotsLoading(false);
    }
  }, [farmId]);

  useEffect(() => {
    void loadPlots();
  }, [loadPlots]);

  const loadSummary = useCallback(async () => {
    if (!farmId || !selectedPlotId) {
      setReading(EMPTY_READING);
      return;
    }
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const [summary, testRecords] = await Promise.all([
        getSoilHealthSummary(farmId, selectedPlotId).catch(() => null),
        listSoilTests(farmId, selectedPlotId).catch(() => []),
      ]);
      setReading(toReading(summary, testRecords));
    } catch (err) {
      setSummaryError(formatErrorMessage(err, 'Could not load soil health data for this zone.'));
      setReading(EMPTY_READING);
    } finally {
      setSummaryLoading(false);
    }
  }, [farmId, selectedPlotId]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const currentData = reading;
  const selectedZoneName = plots.find((p) => p.id === selectedPlotId)?.name ?? '';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* ── Top Header ── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowBackIcon size={20} color={P.twGreen800} />
          </TouchableOpacity>

          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTag}>FR-F06</Text>
            <Text style={styles.headerTitle}>Soil Health Tracker</Text>
            <Text style={styles.headerSubtitle}>pH, OC, TDS & NPK over time</Text>
          </View>
        </View>
      </View>

      {plotsLoading ? (
        <View style={styles.scrollContent}>
          <Skeleton height={40} width="100%" style={{ marginBottom: 16 }} />
          <Skeleton height={160} width="100%" />
        </View>
      ) : plotsError ? (
        <View style={styles.scrollContent}>
          <Text style={styles.loadErrorText}>{plotsError}</Text>
        </View>
      ) : (
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Zone Filter Horizontal Pills ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.zonesRow}
        >
          {plots.map((plot) => {
            const isSelected = selectedPlotId === plot.id;
            return (
              <TouchableOpacity
                key={plot.id}
                style={[
                  styles.zoneChip,
                  isSelected ? styles.zoneChipActive : styles.zoneChipInactive,
                ]}
                onPress={() => setSelectedPlotId(plot.id)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={plot.name}
              >
                <Text
                  style={[
                    styles.zoneChipText,
                    isSelected ? styles.zoneChipTextActive : styles.zoneChipTextInactive,
                  ]}
                >
                  {plot.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {summaryError ? <Text style={styles.loadErrorText}>{summaryError}</Text> : null}

        {/* ── Bar Chart Card: Soil pH ── */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View style={styles.greenDot} />
            <Text style={styles.chartTitle}>Soil pH</Text>
          </View>

          <View style={styles.barsContainer}>
            {currentData.chartBars.map((bar) => (
              <View key={bar.month} style={styles.barCol}>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { height: `${bar.value}%` }]} />
                </View>
                <Text style={styles.barMonth}>{bar.month}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Current Readings Card ── */}
        <View style={styles.readingsCard}>
          <Text style={styles.readingsTitle}>Current readings — {selectedZoneName}</Text>

          {/* Row 1: Soil pH */}
          <View style={styles.readingRow}>
            <View style={styles.readingLabelCol}>
              <View style={styles.readingDotTitle}>
                <View style={styles.greenDot} />
                <Text style={styles.readingParamName}>Soil pH</Text>
              </View>
            </View>
            <View style={styles.readingValueCol}>
              <Text style={styles.readingNumber}>{currentData.ph}</Text>
              <Text style={styles.trendUpText}>{currentData.phDiff}</Text>
            </View>
          </View>

          {/* Row 2: Organic Carbon */}
          <View style={styles.readingRow}>
            <View style={styles.readingLabelCol}>
              <View style={styles.readingDotTitle}>
                <View style={styles.amberDot} />
                <Text style={styles.readingParamName}>Organic Carbon</Text>
              </View>
            </View>
            <View style={styles.readingValueCol}>
              <Text style={styles.readingNumber}>{currentData.oc}</Text>
              <Text style={styles.trendUpText}>{currentData.ocDiff}</Text>
            </View>
          </View>

          {/* Row 3: TDS (ppm) */}
          <View style={styles.readingRow}>
            <View style={styles.readingLabelCol}>
              <View style={styles.readingDotTitle}>
                <View style={styles.blueDot} />
                <Text style={styles.readingParamName}>TDS (ppm)</Text>
              </View>
            </View>
            <View style={styles.readingValueCol}>
              <Text style={styles.readingNumber}>{currentData.tds}</Text>
              <Text style={styles.trendDownText}>{currentData.tdsDiff}</Text>
            </View>
          </View>

          {/* Row 4: Available Nitrogen (N) */}
          <View style={styles.readingRow}>
            <View style={styles.readingLabelCol}>
              <View style={styles.readingDotTitle}>
                <View style={styles.purpleDot} />
                <Text style={styles.readingParamName}>Available Nitrogen (N)</Text>
              </View>
            </View>
            <View style={styles.readingValueCol}>
              <Text style={styles.readingNumber}>{currentData.nitrogen}</Text>
              <Text style={styles.trendUpText}>{currentData.nitrogenDiff}</Text>
            </View>
          </View>

          {/* Row 5: Available Phosphorus (P) */}
          <View style={styles.readingRow}>
            <View style={styles.readingLabelCol}>
              <View style={styles.readingDotTitle}>
                <View style={styles.tealDot} />
                <Text style={styles.readingParamName}>Available Phosphorus (P)</Text>
              </View>
            </View>
            <View style={styles.readingValueCol}>
              <Text style={styles.readingNumber}>{currentData.phosphorus}</Text>
              <Text style={styles.trendUpText}>{currentData.phosphorusDiff}</Text>
            </View>
          </View>

          {/* Row 6: Available Potassium (K) */}
          <View style={[styles.readingRow, styles.lastReadingRow]}>
            <View style={styles.readingLabelCol}>
              <View style={styles.readingDotTitle}>
                <View style={styles.orangeDot} />
                <Text style={styles.readingParamName}>Available Potassium (K)</Text>
              </View>
            </View>
            <View style={styles.readingValueCol}>
              <Text style={styles.readingNumber}>{currentData.potassium}</Text>
              <Text style={styles.trendUpText}>{currentData.potassiumDiff}</Text>
            </View>
          </View>
        </View>

        {/* ── Insight Banner ── */}
        <View style={styles.insightBanner}>
          <View style={styles.insightIconCircle}>
            <LeafSproutIcon size={18} color={P.forestGreen} />
          </View>
          <Text style={styles.insightText}>{currentData.insight}</Text>
        </View>
      </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Stylesheet
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.white,
  },
  loadErrorText: {
    color: P.red600,
    fontSize: typography.body,
    fontWeight: '600',
    marginBottom: 12,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 6 : 4,
    paddingBottom: 12,
    backgroundColor: P.white,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray200,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerTag: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: P.twGray500,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: typography.title,
    fontWeight: '800',
    color: P.twGray900,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: typography.bodySmall,
    fontWeight: '500',
    color: P.twGray500,
    marginTop: 2,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: P.twGray50,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 32,
  },
  zonesRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 14,
  },
  zoneChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
  },
  zoneChipActive: {
    backgroundColor: P.forestGreen,
  },
  zoneChipInactive: {
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
  },
  zoneChipText: {
    fontSize: typography.body,
  },
  zoneChipTextActive: {
    color: P.white,
    fontWeight: '700',
  },
  zoneChipTextInactive: {
    color: P.twGray700,
    fontWeight: '600',
  },
  chartCard: {
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
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.twGray900,
    marginLeft: 8,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: P.forestGreen,
  },
  amberDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: P.amber600,
  },
  blueDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: P.twBlue600,
  },
  purpleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: P.deepPurple600,
  },
  tealDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: P.teal400,
  },
  orangeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: P.twOrange500,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
    paddingTop: 10,
    paddingHorizontal: 8,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
  },
  barTrack: {
    width: 28,
    height: 72,
    backgroundColor: P.twGray100,
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: P.forestGreen,
    borderRadius: 6,
  },
  barMonth: {
    fontSize: typography.caption,
    fontWeight: '500',
    color: P.twGray500,
    marginTop: 6,
  },
  readingsCard: {
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
  readingsTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.twGray900,
    marginBottom: 12,
  },
  readingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  lastReadingRow: {
    borderBottomWidth: 0,
    paddingBottom: 2,
  },
  readingLabelCol: {
    flex: 1,
  },
  readingDotTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readingParamName: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray800,
    marginLeft: 8,
  },
  readingValueCol: {
    alignItems: 'flex-end',
  },
  readingNumber: {
    fontSize: typography.bodyLarge,
    fontWeight: '800',
    color: P.twGray900,
  },
  trendUpText: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: P.forestGreen,
    marginTop: 2,
  },
  trendDownText: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: P.red700,
    marginTop: 2,
  },
  insightBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.mintTintBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: P.twGreen100,
    gap: 12,
  },
  insightIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightText: {
    flex: 1,
    fontSize: typography.bodySmall,
    fontWeight: '500',
    color: P.forestGreen,
    lineHeight: 18,
  },
});
