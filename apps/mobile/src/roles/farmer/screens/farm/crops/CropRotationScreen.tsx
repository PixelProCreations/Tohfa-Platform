import React, { useCallback, useEffect, useState } from 'react';
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
import Svg, { Path } from 'react-native-svg';
import { ErrorState, Skeleton } from '@tohfa/mobile-ui';
import { t } from '../../../../../i18n/farmer';
import { authPalette as P, typography } from '../../../theme';
import { listDiaryPlots, type DiaryPlot } from '../../../api/farmDiary';
import { getPlotRotationHistory } from '../../../api/crops';

// ─────────────────────────────────────────────
// Inline Vector Icons
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

function LeafEmptyIcon({ size = 32, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 21 3c-1.5 4-2 5.5-3.1 11.2A7 7 0 0 1 11 20z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Types & real-data mapping
// ─────────────────────────────────────────────

interface RotationStep {
  stepNum: number;
  label: string;
  crop: string;
  badgeBg: string;
  textColor: string;
}

interface ZoneRotation {
  zoneId: string;
  zoneName: string;
  steps: RotationStep[];
}

const STEP_BADGE_COLORS = [P.forestGreen, P.twOrange500, P.twGray300];

/**
 * The real endpoint is a most-recent-first planting HISTORY for one plot
 * (past and current crops), not a forward rotation PLAN — there is no
 * backend concept of a recommended "next"/"then" crop. So this maps history
 * onto "Current / Previous / Before that" instead of the mock's "Now / Next
 * / Then", which would otherwise imply a prediction this API doesn't make.
 */
function toZoneRotation(plot: DiaryPlot, history: { cropName: string; status: string }[]): ZoneRotation | null {
  if (history.length === 0) return null;
  const labels = [
    t('farmer.crops.rotation.stepCurrent'),
    t('farmer.crops.rotation.stepPrevious'),
    t('farmer.crops.rotation.stepBefore'),
  ];
  return {
    zoneId: plot.id,
    zoneName: plot.name,
    steps: history.slice(0, 3).map((h, idx) => ({
      stepNum: idx + 1,
      label: labels[idx] ?? labels[labels.length - 1]!,
      crop: h.cropName,
      badgeBg: STEP_BADGE_COLORS[idx] ?? P.twGray300,
      textColor: P.white,
    })),
  };
}

export interface CropRotationScreenProps {
  onBack?: (() => void) | undefined;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export function CropRotationScreen({ onBack }: CropRotationScreenProps): React.JSX.Element {
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

  const [zones, setZones] = useState<ZoneRotation[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const plots = await listDiaryPlots();
      const perPlot = await Promise.all(
        plots.map(async (plot) => ({ plot, result: await getPlotRotationHistory(plot.id) })),
      );
      const built = perPlot
        .map(({ plot, result }) => toZoneRotation(plot, result.history))
        .filter((z): z is ZoneRotation => z !== null);
      setZones(built);
    } catch (err: unknown) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
            <Text style={styles.headerTitle}>Crop Rotation & Cover Cropping</Text>
            <Text style={styles.headerSubtitle}>Planting history by field</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Skeleton width="100%" height={140} borderRadius={16} />
          <Skeleton width="100%" height={140} borderRadius={16} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <ErrorState error={error} onRetry={load} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Zone Rotation Cards ── */}
          {(zones ?? []).map((item) => (
            <View key={item.zoneId} style={styles.zoneCard}>
              <Text style={styles.zoneName}>{item.zoneName}</Text>

              <View style={styles.stepsRow}>
                {item.steps.map((step) => (
                  <View key={step.stepNum} style={styles.stepColumn}>
                    <View style={[styles.stepBadge, { backgroundColor: step.badgeBg }]}>
                      <Text style={[styles.stepNumber, { color: step.textColor }]}>
                        {step.stepNum}
                      </Text>
                    </View>
                    <Text style={styles.stepLabel}>{step.label}</Text>
                    <Text style={styles.stepCrop}>{step.crop}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}

          {(zones ?? []).length === 0 && (
            <View style={styles.emptyState}>
              <LeafEmptyIcon size={32} color={P.twGray400} />
              <Text style={styles.emptyStateText}>{t('farmer.crops.rotation.emptyTitle')}</Text>
            </View>
          )}
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
  loadingContainer: {
    padding: 16,
    gap: 14,
  },
  errorContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: P.twGray50,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 14,
  },
  zoneCard: {
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  zoneName: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.twGray900,
    marginBottom: 16,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  stepColumn: {
    alignItems: 'center',
    flex: 1,
  },
  stepBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepNumber: {
    fontSize: typography.body,
    fontWeight: '800',
  },
  stepLabel: {
    fontSize: typography.caption,
    fontWeight: '500',
    color: P.twGray500,
    marginBottom: 4,
  },
  stepCrop: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.twGray900,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 10,
  },
  emptyStateText: {
    fontSize: typography.body,
    color: P.twGray500,
  },
});
