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
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { Skeleton } from '@tohfa/mobile-ui';
import { authPalette as P, typography } from '../../../theme';
import { formatErrorMessage } from '../../../../../shell/api/client';
import { getFarms } from '../../../api/farms';
import {
  getPestAnalyticsSummary,
  listWeatherRiskNotes,
  type PestAnalyticsSummary,
  type WeatherRiskNote,
} from '../../../api/pest';

// ── Icons ────────────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = P.deepGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function InfoCircleIcon({ size = 15, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Line x1="12" y1="8" x2="12" y2="8.01" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      <Line x1="12" y1="11" x2="12" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export interface WeatherRiskAnalyticsScreenProps {
  /**
   * Threaded down from PestManagementScreen when reached via the hub; resolved
   * locally (first farm, via `getFarms()`) when this screen is opened directly --
   * same fallback PestManagementScreen and PestLibraryScreen use, since nothing in
   * App.tsx passes a farmId to the standalone `WeatherRiskAnalytics` route today.
   */
  farmId?: string | undefined;
  onBack?: () => void;
}

export function WeatherRiskAnalyticsScreen({
  farmId,
  onBack,
}: WeatherRiskAnalyticsScreenProps): React.JSX.Element {
  const [notes, setNotes] = useState<WeatherRiskNote[]>([]);
  const [summary, setSummary] = useState<PestAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        let fid = farmId;
        if (!fid) {
          const farms = await getFarms();
          fid = farms[0]?.id;
        }
        const [noteItems, summaryResult] = await Promise.all([
          listWeatherRiskNotes(),
          fid ? getPestAnalyticsSummary(fid) : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setNotes(noteItems);
        setSummary(summaryResult);
      } catch (err) {
        if (!cancelled) setLoadError(formatErrorMessage(err, 'Could not load weather risk & analytics.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [farmId]);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ArrowBackIcon size={20} color={P.deepGreen} />
          </TouchableOpacity>

          <View style={styles.headerTitleCol}>
            <Text style={styles.headerCodeBadge}>FR-F07-E</Text>
            <Text style={styles.headerTitle}>Weather Risk & Analytics</Text>
            <Text style={styles.headerSubtitle}>Seasonal risk trends & treatments</Text>
          </View>
        </View>

        {loading ? (
          <>
            <Skeleton height={90} width="100%" style={{ marginBottom: 14 }} />
            <Skeleton height={120} width="100%" style={{ marginBottom: 14 }} />
            <Skeleton height={90} width="100%" />
          </>
        ) : loadError ? (
          <View style={styles.card}>
            <Text style={styles.loadErrorText}>{loadError}</Text>
          </View>
        ) : (
          <>
            {/* ── Card 1: Weather Risk Notes ── */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>WEATHER RISK NOTE{notes.length === 1 ? '' : 'S'}</Text>
              {notes.length > 0 ? (
                notes.map((note) => (
                  <View key={note.id} style={styles.riskNoteItem}>
                    <Text style={styles.riskNoteRegion}>{note.region}</Text>
                    <Text style={styles.riskNoteBody}>{note.note}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.riskNoteBody}>No weather risk notes for your region right now.</Text>
              )}
              <View style={styles.disclaimerRow}>
                <InfoCircleIcon size={14} color={P.twGray400} />
                <Text style={styles.disclaimerText}>
                  Reference notes maintained by TOHFA Admin, not automated alerts.
                </Text>
              </View>
            </View>

            {/* ── Card 2: Detections by Season ── */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>DETECTIONS BY SEASON</Text>
              {summary && summary.detectionsBySeason.length > 0 ? (
                summary.detectionsBySeason.map((row, idx) => (
                  <View
                    key={row.season}
                    style={[
                      styles.seasonRow,
                      idx === summary.detectionsBySeason.length - 1 && { borderBottomWidth: 0 },
                    ]}
                  >
                    <Text style={styles.seasonName}>{row.season}</Text>
                    <Text style={styles.seasonCount}>{row.count}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyCardText}>No detections logged yet.</Text>
              )}
            </View>

            {/* ── Card 3: Most Affected Crops ── */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>MOST AFFECTED CROPS</Text>
              {summary && summary.mostAffectedCrops.length > 0 ? (
                <View style={styles.cropsPillsRow}>
                  {summary.mostAffectedCrops.map((row) => (
                    <View key={row.crop} style={styles.cropPill}>
                      <Text style={styles.cropPillText}>
                        {row.crop} ({row.count})
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyCardText}>No detections logged yet.</Text>
              )}
            </View>

            {/* ── Card 4: Treatment Effectiveness (Farmer-Logged) ── */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>TREATMENT EFFECTIVENESS (FARMER-LOGGED)</Text>

              {summary && summary.treatmentEffectiveness.length > 0 ? (
                summary.treatmentEffectiveness.map((row, idx) => (
                  <React.Fragment key={row.treatment}>
                    <View style={styles.treatmentItem}>
                      <Text style={styles.treatmentName}>{row.treatment}</Text>
                      <Text style={styles.treatmentSub}>
                        Used {row.timesUsed} {row.timesUsed === 1 ? 'time' : 'times'} · noted effective in{' '}
                        {row.timesEffective}
                      </Text>
                    </View>
                    {idx < summary.treatmentEffectiveness.length - 1 && <View style={styles.divider} />}
                  </React.Fragment>
                ))
              ) : (
                <Text style={styles.emptyCardText}>No resolved detections logged yet.</Text>
              )}

              {/* Disclaimer Note */}
              <View style={styles.disclaimerRow}>
                <InfoCircleIcon size={14} color={P.twGray400} />
                <Text style={styles.disclaimerText}>
                  Effectiveness is farmer-noted at resolution time, not measured automatically.
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: P.lightSurfaceAlt,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitleCol: {
    marginLeft: 14,
  },
  headerCodeBadge: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: P.twGray400,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: typography.title,
    fontWeight: '800',
    color: P.deepGreen,
  },
  headerSubtitle: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    marginTop: 2,
  },

  loadErrorText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twRed600,
  },

  // Cards
  card: {
    backgroundColor: P.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: P.twGray100,
    marginBottom: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardLabel: {
    fontSize: typography.caption,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: P.twGray400,
    marginBottom: 12,
  },
  emptyCardText: {
    fontSize: typography.body,
    color: P.twGray500,
    fontStyle: 'italic',
  },
  riskNoteItem: {
    marginBottom: 10,
  },
  riskNoteRegion: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.twGray500,
    marginBottom: 2,
  },
  riskNoteBody: {
    fontSize: typography.body,
    color: P.twGray700,
    lineHeight: 20,
  },

  // Season Breakdown
  seasonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  seasonName: {
    fontSize: typography.body,
    color: P.twGray700,
    fontWeight: '600',
  },
  seasonCount: {
    fontSize: typography.body,
    fontWeight: '800',
    color: P.deepGreen,
    backgroundColor: P.twGray100,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 8,
  },

  // Crops Pills
  cropsPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cropPill: {
    backgroundColor: P.twGreen50,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  cropPillText: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.twGreen800,
  },

  // Treatments
  treatmentItem: {
    paddingVertical: 4,
  },
  treatmentName: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.nearBlack,
    marginBottom: 3,
  },
  treatmentSub: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
  },
  divider: {
    height: 1,
    backgroundColor: P.twGray100,
    marginVertical: 10,
  },
  disclaimerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 14,
    paddingTop: 10,
  },
  disclaimerText: {
    flex: 1,
    fontSize: typography.bodySmall,
    color: P.twGray400,
    lineHeight: 16,
  },
});
