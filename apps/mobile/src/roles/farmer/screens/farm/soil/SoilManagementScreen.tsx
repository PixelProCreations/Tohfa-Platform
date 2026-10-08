import React, { useState, useEffect } from 'react';
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
import Svg, { Circle, Line, Path, Rect, Polygon } from 'react-native-svg';
import { authPalette as P, typography } from '../../../theme';
import { getFarms, getPlots } from '../../../api/farms';
import { listSoilTests, type SoilTestRecord } from '../../../api/soil';

// ─────────────────────────────────────────────
// Inline Vector Icons (strictly no emojis, no raw hex)
// ─────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = P.twGray800 }: { size?: number; color?: string }) {
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

function ChevronRightIcon({ size = 18, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18l6-6-6-6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FlaskIcon({ size = 20, color = P.twAmber800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 3h6M10 3v5l-5.5 9.5A2 2 0 006.2 21h11.6a2 2 0 001.7-3.5L14 8V3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7.5 15h9"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ClockIcon({ size = 20, color = P.twAmber800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path
        d="M12 7v5l3.5 2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function MicroscopeIcon({ size = 22, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 18h12M10 21h4M9 3h3v8H9zM12 6h2M17 11a5 5 0 01-5 5H9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="9" cy="14" r="1.5" fill={color} />
    </Svg>
  );
}

function PulseGraphIcon({ size = 22, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="3" stroke={color} strokeWidth="1.8" />
      <Path
        d="M6 12h2.5l2-4 3 8 2.5-5 1.5 1H18"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ShapesIcon({ size = 22, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polygon points="12,3 7,11 17,11" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <Rect x="4" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.8" />
      <Circle cx="17.5" cy="17.5" r="3.5" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function SproutShootIcon({ size = 22, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21v-8M12 13c-2.5-3-6-2.5-7-2 0 4 3 6 7 2zM12 11c2.5-3 6-2.5 7-2 0 4-3 6-7 2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7 21h10"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function RotateCycleIcon({ size = 22, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 12a9 9 0 00-15-6.7L3 8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M3 3v5h5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 12a9 9 0 0015 6.7l3-2.7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M21 21v-5h-5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function WaterDropletIcon({ size = 22, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function MountainSlopeIcon({ size = 22, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polygon points="12,5 4,19 20,19" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <Line x1="7.5" y1="13" x2="16.5" y2="13" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function PdfDocIcon({ size = 22, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="3" width="13" height="18" rx="2" stroke={color} strokeWidth="1.8" />
      <Path d="M17 7h3v14H8" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="7" y1="8" x2="14" y2="8" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Line x1="7" y1="12" x2="14" y2="12" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Line x1="7" y1="16" x2="11" y2="16" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

function PlusIcon({ size = 18, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5v14M5 12h14"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────

export interface SoilManagementScreenProps {
  onBack?: (() => void) | undefined;
  /**
   * Every onNavigateToX below is handed the farmer's farmId so the child screen
   * never has to guess it. This screen is the hub of the soil diary and is the
   * one place in the nav graph that resolves a real farmId (via `getFarms()` on
   * mount) for the whole subtree below it -- see the docblock on the `farmId`
   * state below for why.
   *
   * They are required on purpose. This screen used to fall back to an in-place
   * modal full of sample zones/amendments/readings when a callback was missing,
   * which showed a farmer invented data as if it were theirs. Making omission a
   * type error is what keeps that fallback from ever being needed again.
   */
  onNavigateToSoilTestRecords: (farmId: string) => void;
  onNavigateToSoilHealthTracker: (farmId: string) => void;
  onNavigateToSoilTypeClassification: (farmId: string) => void;
  onNavigateToAmendments: (farmId: string) => void;
  onNavigateToCropRotation: (farmId: string) => void;
  onNavigateToMoistureTracking: (farmId: string) => void;
  onNavigateToErosionConservation: (farmId: string) => void;
  onNavigateToExportReports: (farmId: string) => void;
  onNavigateToNewSoilTest: (farmId: string) => void;
}

type SoilModuleId =
  | 'records'
  | 'health_tracker'
  | 'classification'
  | 'amendments'
  | 'rotation'
  | 'moisture'
  | 'erosion'
  | 'export';

interface SoilModuleItem {
  id: SoilModuleId;
  title: string;
  subtitle: string;
  IconComponent: React.ComponentType<{ size?: number; color?: string }>;
}

const SOIL_MODULES: SoilModuleItem[] = [
  {
    id: 'records',
    title: 'Soil Test Records',
    subtitle: 'Upload results, set reminders, view history',
    IconComponent: MicroscopeIcon,
  },
  {
    id: 'health_tracker',
    title: 'Soil Health Tracker',
    subtitle: 'Track pH, organic carbon & TDS over time per zone',
    IconComponent: PulseGraphIcon,
  },
  {
    id: 'classification',
    title: 'Soil Type Classification',
    subtitle: 'Record your soil type per zone (8 categories)',
    IconComponent: ShapesIcon,
  },
  {
    id: 'amendments',
    title: 'Soil Amendments Log',
    subtitle: 'Log FYM, compost & amendments — with recommendations',
    IconComponent: SproutShootIcon,
  },
  {
    id: 'rotation',
    title: 'Crop Rotation & Cover Cropping',
    subtitle: 'Plan rotation cycles and cover crop windows',
    IconComponent: RotateCycleIcon,
  },
  {
    id: 'moisture',
    title: 'Soil Moisture Tracking',
    subtitle: 'Manual visual moisture observations per zone',
    IconComponent: WaterDropletIcon,
  },
  {
    id: 'erosion',
    title: 'Erosion & Conservation Notes',
    subtitle: 'Log erosion risk and conservation practices',
    IconComponent: MountainSlopeIcon,
  },
  {
    id: 'export',
    title: 'Export Soil Reports',
    subtitle: 'Download a full soil report as PDF',
    IconComponent: PdfDocIcon,
  },
];

/**
 * Shown on a stat card when there is no real test to report. Same convention
 * as SoilHealthTrackerScreen's EMPTY_READING -- never a plausible sample value.
 */
const EMPTY_VALUE = '—';

function formatSinceLastTest(dateStr: string): string {
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return EMPTY_VALUE;
  const days = Math.max(0, Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24)));
  if (days < 1) return 'today';
  if (days < 14) return `${days} d`;
  if (days < 60) return `${Math.floor(days / 7)} wks`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mos`;
  return `${Math.floor(days / 365)} yrs`;
}

// ─────────────────────────────────────────────
// Component Implementation
// ─────────────────────────────────────────────

export function SoilManagementScreen({
  onBack,
  onNavigateToSoilTestRecords,
  onNavigateToSoilHealthTracker,
  onNavigateToSoilTypeClassification,
  onNavigateToAmendments,
  onNavigateToCropRotation,
  onNavigateToMoistureTracking,
  onNavigateToErosionConservation,
  onNavigateToExportReports,
  onNavigateToNewSoilTest,
}: SoilManagementScreenProps): React.JSX.Element {
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

  const [farmId, setFarmId] = useState('');
  const [latestTest, setLatestTest] = useState<SoilTestRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const farms = await getFarms();
        const primaryFarmId = farms[0]?.id ?? '';
        if (cancelled) return;
        setFarmId(primaryFarmId);

        if (!primaryFarmId) {
          setLoading(false);
          return;
        }

        const farmPlots = await getPlots(primaryFarmId);
        if (cancelled) return;

        if (farmPlots.length > 0) {
          // Fetch tests across all plots to find the most recent test
          const perPlotTests = await Promise.all(
            farmPlots.map((plot) => listSoilTests(primaryFarmId, plot.id).catch(() => [])),
          );
          const allTests = perPlotTests.flat().sort((a, b) => (a.testDate < b.testDate ? 1 : -1));
          if (!cancelled && allTests.length > 0) {
            setLatestTest(allTests[0] ?? null);
          }
        }
      } catch {
        // No real test could be loaded; the stat cards show EMPTY_VALUE.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const moduleNavigation: Record<SoilModuleId, (farmId: string) => void> = {
    records: onNavigateToSoilTestRecords,
    health_tracker: onNavigateToSoilHealthTracker,
    classification: onNavigateToSoilTypeClassification,
    amendments: onNavigateToAmendments,
    rotation: onNavigateToCropRotation,
    moisture: onNavigateToMoistureTracking,
    erosion: onNavigateToErosionConservation,
    export: onNavigateToExportReports,
  };

  const handleModulePress = (id: SoilModuleId) => {
    moduleNavigation[id](farmId);
  };

  const handleUploadNewTest = () => {
    onNavigateToNewSoilTest(farmId);
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
            <Text style={styles.headerTitle}>Soil Management</Text>
            <Text style={styles.headerSubtitle}>Tests, health tracking & conservation</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top Stat Cards ── */}
        <View style={styles.statsRow}>
          {/* Card 1: Latest Soil pH */}
          <View style={styles.statCard}>
            <View style={styles.statIconBadge}>
              <FlaskIcon size={20} color={P.twAmber800} />
            </View>
            <Text style={styles.statValue}>
              {latestTest?.ph != null ? latestTest.ph.toFixed(1) : (loading ? '...' : EMPTY_VALUE)}
            </Text>
            <Text style={styles.statLabel}>Latest Soil pH</Text>
          </View>

          {/* Card 2: Since Last Test */}
          <View style={styles.statCard}>
            <View style={styles.statIconBadge}>
              <ClockIcon size={20} color={P.twAmber800} />
            </View>
            <Text style={styles.statValue}>
              {latestTest?.testDate ? formatSinceLastTest(latestTest.testDate) : (loading ? '...' : EMPTY_VALUE)}
            </Text>
            <Text style={styles.statLabel}>Since Last Test</Text>
          </View>
        </View>

        {/* ── 8 Soil Module Navigation Cards ── */}
        <View style={styles.modulesList}>
          {SOIL_MODULES.map((item) => {
            const Icon = item.IconComponent;
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.moduleCard}
                onPress={() => handleModulePress(item.id)}
                activeOpacity={0.78}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}. ${item.subtitle}`}
              >
                <View style={styles.moduleIconBadge}>
                  <Icon size={22} color={P.twGreen700} />
                </View>

                <View style={styles.moduleTextGroup}>
                  <Text style={styles.moduleTitle}>{item.title}</Text>
                  <Text style={styles.moduleSubtitle}>{item.subtitle}</Text>
                </View>

                <ChevronRightIcon size={18} color={P.twGray400} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Action Button at bottom of list ── */}
        <TouchableOpacity
          style={styles.uploadBtn}
          onPress={handleUploadNewTest}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel="Upload New Soil Test"
        >
          <PlusIcon size={18} color={P.white} />
          <Text style={styles.uploadBtnText}>Upload New Soil Test</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Stylesheet (strictly no raw hex literals)
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
    color: P.twGreen700,
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
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  statIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: P.twAmber100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: typography.title,
    fontWeight: '800',
    color: P.twGray900,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: typography.bodySmall,
    fontWeight: '500',
    color: P.twGray500,
    marginTop: 2,
  },
  modulesList: {
    gap: 10,
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  moduleIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: P.twGreen50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  moduleTextGroup: {
    flex: 1,
    marginRight: 8,
  },
  moduleTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.twGray900,
    letterSpacing: -0.2,
  },
  moduleSubtitle: {
    fontSize: typography.bodySmall,
    fontWeight: '400',
    color: P.twGray500,
    marginTop: 3,
    lineHeight: 16,
  },
  bottomSpacer: {
    height: 16,
  },
  uploadBtn: {
    backgroundColor: P.forestGreen,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.forestGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
    gap: 8,
    marginTop: 18,
  },
  uploadBtnText: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.white,
  },
});
