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
import { Skeleton } from '@tohfa/mobile-ui';
import { authPalette as P, typography } from '../../../theme';
import { formatErrorMessage } from '../../../../../shell/api/client';
import { getPlots } from '../../../api/farms';
import { listSoilMoisture, createSoilMoisture } from '../../../api/soil';

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

// ─────────────────────────────────────────────
// Types & Initial Data
// ─────────────────────────────────────────────

export type MoistureLevel = 'Dry' | 'Moist' | 'Wet';

interface ZoneMoisture {
  id: string;
  name: string;
  lastUpdated: string;
  currentLevel: MoistureLevel | null;
  /** Per-zone save error, shown inline -- there is no shared error slot on this card. */
  error: string | null;
}

function toLastUpdated(observedAt: string | null): string {
  if (!observedAt) return 'No observations yet';
  const then = new Date(observedAt).getTime();
  if (Number.isNaN(then)) return 'Last updated';
  const days = Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Last updated today';
  if (days === 1) return 'Last updated 1 day ago';
  return `Last updated ${days} days ago`;
}

export interface SoilMoistureTrackingScreenProps {
  /** The farm whose plots are shown as zone cards, threaded from SoilManagementScreen. */
  farmId: string;
  onBack?: (() => void) | undefined;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export function SoilMoistureTrackingScreen({
  farmId,
  onBack,
}: SoilMoistureTrackingScreenProps): React.JSX.Element {
  const [zones, setZones] = useState<ZoneMoisture[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

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

  const loadZones = useCallback(async () => {
    if (!farmId) {
      setLoading(false);
      setLoadError('No farm selected. Go back and choose a farm first.');
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const plots = await getPlots(farmId);
      const withMoisture = await Promise.all(
        plots.map(async (plot): Promise<ZoneMoisture> => {
          const observations = await listSoilMoisture(farmId, plot.id);
          const latest = [...observations].sort((a, b) => (a.observedAt < b.observedAt ? 1 : -1))[0];
          return {
            id: plot.id,
            name: plot.name,
            lastUpdated: toLastUpdated(latest?.observedAt ?? null),
            currentLevel: (latest?.level as MoistureLevel | undefined) ?? null,
            error: null,
          };
        }),
      );
      setZones(withMoisture);
    } catch (err) {
      setLoadError(formatErrorMessage(err, 'Could not load soil moisture data.'));
    } finally {
      setLoading(false);
    }
  }, [farmId]);

  useEffect(() => {
    void loadZones();
  }, [loadZones]);

  const handleSelectLevel = (zoneId: string, level: MoistureLevel) => {
    const previous = zones.find((z) => z.id === zoneId);
    if (!previous) return;
    // Optimistic update first (same idiom as SoilTypeClassificationScreen's
    // handleSelectSoilType), reverted below if the background save fails.
    setZones((prev) =>
      prev.map((z) =>
        z.id === zoneId
          ? { ...z, currentLevel: level, lastUpdated: 'Last updated just now', error: null }
          : z,
      ),
    );
    void (async () => {
      try {
        await createSoilMoisture(farmId, zoneId, { level });
      } catch (err) {
        setZones((prev) =>
          prev.map((z) =>
            z.id === zoneId
              ? {
                  ...previous,
                  error: formatErrorMessage(err, 'Could not save this observation.'),
                }
              : z,
          ),
        );
      }
    })();
  };

  const getOptionStyles = (level: MoistureLevel, isSelected: boolean) => {
    if (!isSelected) {
      return {
        btnStyle: styles.optionBtnInactive,
        textStyle: styles.optionTextInactive,
      };
    }

    switch (level) {
      case 'Dry':
        return {
          btnStyle: styles.optionBtnDryActive,
          textStyle: styles.optionTextDryActive,
        };
      case 'Moist':
        return {
          btnStyle: styles.optionBtnMoistActive,
          textStyle: styles.optionTextMoistActive,
        };
      case 'Wet':
        return {
          btnStyle: styles.optionBtnWetActive,
          textStyle: styles.optionTextWetActive,
        };
    }
  };

  const MOISTURE_OPTIONS: MoistureLevel[] = ['Dry', 'Moist', 'Wet'];

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
            <Text style={styles.headerTitle}>Soil Moisture Tracking</Text>
            <Text style={styles.headerSubtitle}>Manual visual observations per zone</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.scrollContent}>
          <Skeleton height={140} width="100%" style={{ marginBottom: 14 }} />
          <Skeleton height={140} width="100%" />
        </View>
      ) : loadError ? (
        <View style={styles.scrollContent}>
          <Text style={styles.loadErrorText}>{loadError}</Text>
        </View>
      ) : (
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {zones.length === 0 ? (
          <Text style={styles.emptyText}>No zones yet. Add a zone before logging moisture.</Text>
        ) : (
        zones.map((zone) => (
          <View key={zone.id} style={styles.zoneCard}>
            <Text style={styles.zoneName}>{zone.name}</Text>
            <Text style={styles.lastUpdatedText}>{zone.lastUpdated}</Text>
            {zone.error ? <Text style={styles.loadErrorText}>{zone.error}</Text> : null}

            <View style={styles.optionsRow}>
              {MOISTURE_OPTIONS.map((opt) => {
                const isSelected = zone.currentLevel === opt;
                const { btnStyle, textStyle } = getOptionStyles(opt, isSelected);

                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.optionBtnBase, btnStyle]}
                    onPress={() => handleSelectLevel(zone.id, opt)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`${zone.name} moisture ${opt}`}
                  >
                    <Text style={[styles.optionTextBase, textStyle]}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))
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
  loadErrorText: {
    color: P.red600,
    fontSize: typography.bodySmall,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: typography.body,
    color: P.twGray500,
    textAlign: 'center',
    paddingVertical: 24,
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
    paddingTop: 16,
    paddingBottom: 32,
    gap: 14,
  },
  zoneCard: {
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: 16,
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
  },
  lastUpdatedText: {
    fontSize: typography.bodySmall,
    fontWeight: '400',
    color: P.twGray400,
    marginTop: 2,
    marginBottom: 14,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  optionBtnBase: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  optionTextBase: {
    fontSize: typography.body,
    fontWeight: '700',
  },
  // Inactive
  optionBtnInactive: {
    backgroundColor: P.white,
    borderColor: P.twGray200,
  },
  optionTextInactive: {
    color: P.twGray500,
  },
  // Dry Active
  optionBtnDryActive: {
    backgroundColor: P.orange50,
    borderColor: P.twAmber800,
  },
  optionTextDryActive: {
    color: P.twAmber800,
  },
  // Moist Active
  optionBtnMoistActive: {
    backgroundColor: P.twGreen50,
    borderColor: P.forestGreen,
  },
  optionTextMoistActive: {
    color: P.forestGreen,
  },
  // Wet Active
  optionBtnWetActive: {
    backgroundColor: P.twBlue50,
    borderColor: P.twBlue700,
  },
  optionTextWetActive: {
    color: P.twBlue700,
  },
});
