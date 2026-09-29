import React, { useState, useEffect, useCallback } from 'react';
import {
  Alert,
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
import Svg, { Circle, Line, Path, Rect, Polygon } from 'react-native-svg';
import { Skeleton } from '@tohfa/mobile-ui';
import { authPalette as P, typography } from '../../../theme';
import { formatErrorMessage } from '../../../../../shell/api/client';
import { getPlots, updatePlot, type Plot } from '../../../api/farms';

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

// 8 Soil Category Icons:
function SandyIcon({ size = 24, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="8" cy="8" r="1.5" fill={color} />
      <Circle cx="16" cy="8" r="1.5" fill={color} />
      <Circle cx="12" cy="12" r="1.5" fill={color} />
      <Circle cx="8" cy="16" r="1.5" fill={color} />
      <Circle cx="16" cy="16" r="1.5" fill={color} />
      <Circle cx="12" cy="6" r="1.2" fill={color} />
      <Circle cx="12" cy="18" r="1.2" fill={color} />
    </Svg>
  );
}

function ClayIcon({ size = 24, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 8c4-2 8 2 12 0s4-2 4-2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M4 12c4-2 8 2 12 0s4-2 4-2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M4 16c4-2 8 2 12 0s4-2 4-2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function LoamyIcon({ size = 24, color = P.forestGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21A9 9 0 013 12C3 7 7 3 12 3c5 0 9 4 9 9a9 9 0 01-9 9z"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path
        d="M12 7c-2 2-3 4-3 5.5a3 3 0 006 0C15 11 14 9 12 7z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SiltyIcon({ size = 24, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="7" r="1.8" fill={color} />
      <Circle cx="7" cy="12" r="1.8" fill={color} />
      <Circle cx="17" cy="12" r="1.8" fill={color} />
      <Circle cx="12" cy="17" r="1.8" fill={color} />
      <Circle cx="12" cy="12" r="2.2" fill={color} />
    </Svg>
  );
}

function PeatyIcon({ size = 24, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20v-7M12 13c-2-2.5-5-2-6-1.5 0 3 2.5 4.5 6 1.5zM12 11c2-2.5 5-2 6-1.5 0 3-2.5 4.5-6 1.5z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChalkyIcon({ size = 24, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polygon points="12,6 5,18 19,18" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <Line x1="9" y1="13" x2="15" y2="13" stroke={color} strokeWidth="1.6" />
    </Svg>
  );
}

function SalineIcon({ size = 24, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 11c3-2 6 2 9 0s6-2 7 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M4 15c3-2 6 2 9 0s6-2 7 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function LateriteIcon({ size = 24, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polygon points="12,4 3,19 21,19" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <Polygon points="12,9 7,19 17,19" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Types & Categories Data
// ─────────────────────────────────────────────

interface SoilCategory {
  id: string;
  name: string;
  IconComponent: React.ComponentType<{ size?: number; color?: string }>;
}

const SOIL_CATEGORIES: SoilCategory[] = [
  { id: 'sandy', name: 'Sandy', IconComponent: SandyIcon },
  { id: 'clay', name: 'Clay', IconComponent: ClayIcon },
  { id: 'loamy', name: 'Loamy', IconComponent: LoamyIcon },
  { id: 'silty', name: 'Silty', IconComponent: SiltyIcon },
  { id: 'peaty', name: 'Peaty', IconComponent: PeatyIcon },
  { id: 'chalky', name: 'Chalky', IconComponent: ChalkyIcon },
  { id: 'saline', name: 'Saline', IconComponent: SalineIcon },
  { id: 'laterite', name: 'Laterite', IconComponent: LateriteIcon },
];

export interface SoilTypeClassificationScreenProps {
  /** The farm whose plots are shown as zone cards, threaded from SoilManagementScreen. */
  farmId: string;
  onBack?: (() => void) | undefined;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export function SoilTypeClassificationScreen({
  farmId,
  onBack,
}: SoilTypeClassificationScreenProps): React.JSX.Element {
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

  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Keyed by real plotId (was 3 hardcoded zone1/zone2/zone3 variables) -- there
  // is no fixed zone count on the backend, so this now covers however many
  // plots the farm actually has.
  const [soilTypeByPlot, setSoilTypeByPlot] = useState<Record<string, string | null>>({});
  const [activeEditingPlotId, setActiveEditingPlotId] = useState<string>('');
  const [savingPlotId, setSavingPlotId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadPlots = useCallback(async () => {
    if (!farmId) {
      setLoading(false);
      setLoadError('No farm selected. Go back and choose a farm first.');
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const list = await getPlots(farmId);
      setPlots(list);
      const byPlot: Record<string, string | null> = {};
      for (const plot of list) byPlot[plot.id] = plot.soilType;
      setSoilTypeByPlot(byPlot);
      setActiveEditingPlotId((prev) => (list.some((p) => p.id === prev) ? prev : (list[0]?.id ?? '')));
    } catch (err) {
      setLoadError(formatErrorMessage(err, 'Could not load this farm’s zones.'));
    } finally {
      setLoading(false);
    }
  }, [farmId]);

  useEffect(() => {
    void loadPlots();
  }, [loadPlots]);

  const handleSelectSoilType = async (_typeId: string, typeName: string) => {
    if (!farmId || !activeEditingPlotId) return;
    const plotId = activeEditingPlotId;
    const previous = soilTypeByPlot[plotId] ?? null;
    // Optimistic update, matching this codebase's other tap-to-set controls
    // (SoilMoistureTrackingScreen's handleSelectLevel) -- reverted on failure.
    setSoilTypeByPlot((prev) => ({ ...prev, [plotId]: typeName }));
    setSavingPlotId(plotId);
    setSaveError(null);
    try {
      await updatePlot(farmId, plotId, { soilType: typeName });
    } catch (err) {
      setSoilTypeByPlot((prev) => ({ ...prev, [plotId]: previous }));
      setSaveError(formatErrorMessage(err, 'Could not save this zone’s soil type.'));
    } finally {
      setSavingPlotId(null);
    }
  };

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
            <Text style={styles.headerTitle}>Soil Type Classification</Text>
            <Text style={styles.headerSubtitle}>Record your soil type per zone</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.scrollContent}>
          <Skeleton height={220} width="100%" style={{ marginBottom: 14 }} />
          <Skeleton height={70} width="100%" />
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
        {saveError ? <Text style={styles.loadErrorText}>{saveError}</Text> : null}

        {plots.length === 0 ? (
          <Text style={styles.notRecordedText}>No zones yet. Add a zone before recording a soil type.</Text>
        ) : (
        plots.map((plot, index) => {
          const currentType = soilTypeByPlot[plot.id] ?? null;
          const isFirst = index === 0;
          return (
            <View key={plot.id} style={isFirst ? styles.zoneCard : styles.zoneCardCompact}>
              <View style={styles.zoneHeader}>
                <View>
                  <Text style={styles.zoneTitle}>{plot.name}</Text>
                  <Text style={currentType ? styles.currentTypeText : styles.notRecordedText}>
                    {currentType ? `Currently: ${currentType}` : 'Not yet recorded'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setActiveEditingPlotId(plot.id);
                    if (!isFirst) {
                      Alert.alert(plot.name, `Select soil type from the categories list above to update ${plot.name}.`);
                    }
                  }}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.changeLinkText}>{currentType ? 'Change' : 'Set Type'}</Text>
                </TouchableOpacity>
              </View>

              {/* 8 Categories Grid -- shared: it always applies to whichever
                  plot is currently `activeEditingPlotId`, not necessarily the
                  first plot it's visually nested under (same behaviour the
                  original 3-zone mock had). */}
              {isFirst && (
                <View style={styles.gridContainer}>
                  {SOIL_CATEGORIES.map((cat) => {
                    const isSelected = (soilTypeByPlot[activeEditingPlotId] ?? null) === cat.name;
                    const Icon = cat.IconComponent;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.categoryTile,
                          isSelected ? styles.categoryTileSelected : styles.categoryTileUnselected,
                        ]}
                        onPress={() => void handleSelectSoilType(cat.id, cat.name)}
                        activeOpacity={0.8}
                        disabled={savingPlotId !== null}
                        accessibilityRole="button"
                        accessibilityLabel={`${cat.name} soil type`}
                      >
                        <Icon size={24} color={isSelected ? P.forestGreen : P.twGray700} />
                        <Text
                          style={[
                            styles.categoryName,
                            isSelected ? styles.categoryNameSelected : styles.categoryNameUnselected,
                          ]}
                        >
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })
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
    paddingTop: 16,
    paddingBottom: 32,
  },
  zoneCard: {
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
  zoneCardCompact: {
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: 16,
    marginBottom: 12,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  zoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  zoneTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.twGray900,
  },
  currentTypeText: {
    fontSize: typography.bodySmall,
    fontWeight: '600',
    color: P.forestGreen,
    marginTop: 2,
  },
  notRecordedText: {
    fontSize: typography.bodySmall,
    fontWeight: '500',
    color: P.twGray500,
    marginTop: 2,
  },
  changeLinkText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.forestGreen,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  categoryTile: {
    width: '48%',
    height: 72,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  categoryTileUnselected: {
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
  },
  categoryTileSelected: {
    backgroundColor: P.mintTintBg,
    borderWidth: 1.6,
    borderColor: P.forestGreen,
  },
  categoryName: {
    fontSize: typography.body,
    marginTop: 4,
  },
  categoryNameUnselected: {
    fontWeight: '600',
    color: P.twGray700,
  },
  categoryNameSelected: {
    fontWeight: '700',
    color: P.forestGreen,
  },
});
