import React, { useCallback, useEffect, useState } from 'react';
import {
  BackHandler,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Line, Path, Rect } from 'react-native-svg';
import { ErrorState, Skeleton } from '@tohfa/mobile-ui';
import { authPalette as P, typography } from '../../../theme';
import type { CropItem } from './ProduceCalendarScreen';
import {
  getNpkContribution,
  listCropInputs,
  type CropInputResponse,
  type CropInputType,
  type CropInputUnit,
  type CropNpkContributionResponse,
} from '../../../api/crops';

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

function AlertTriangleIcon({ size = 20, color = P.twOrange600 }: { size?: number; color?: string }) {
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
      <Line x1="12" y1="17" x2="12.01" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function RecycleLeafIcon({ size = 18, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 12l2 2 4-4"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FlaskBeakerIcon({ size = 18, color = P.twBlue600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 3h6M10 3v5l-6 10a2 2 0 0 0 1.7 3h12.6a2 2 0 0 0 1.7-3l-6-10V3"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="7" y1="15" x2="17" y2="15" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </Svg>
  );
}

function SproutIcon({ size = 18, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="16" rx="3" stroke={color} strokeWidth="1.8" />
      <Path
        d="M12 16v-5M12 11c0-2 1.5-3.5 3.5-3.5 0 2-1.5 3.5-3.5 3.5zM12 13c0-1.8-1.2-3-3-3 0 1.8 1.2 3 3 3z"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Types & Crop Targets
// ─────────────────────────────────────────────

interface NutrientMetric {
  name: string;
  chemical: string;
  percent: number;
  actualKg: number;
  targetKg: number;
  statusColor: string;
}

interface CropNutrientTarget {
  n: number;
  p: number;
  k: number;
}

const CROP_TARGETS: Record<string, CropNutrientTarget> = {
  carrot: { n: 40, p: 30, k: 50 },
  tomato: { n: 65, p: 45, k: 70 },
  cabbage: { n: 55, p: 35, k: 60 },
};

const DEFAULT_TARGET: CropNutrientTarget = { n: 40, p: 30, k: 50 };

interface CumulativeIntakeItem {
  label: string;
  amount: string;
}

interface ContributingApplication {
  id: string;
  title: string;
  timestamp: string;
  amount: string;
  type: 'recycle' | 'flask' | 'sprout';
  tags: string[];
}

function formatAppliedDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const day = parseInt(parts[2] ?? '1', 10);
    const monthIdx = parseInt(parts[1] ?? '1', 10) - 1;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[monthIdx] ?? '';
    return `${day} ${month}`;
  }
  return dateStr;
}

function formatQuantityUnit(qty: number, unit: CropInputUnit): string {
  const unitMap: Record<CropInputUnit, string> = {
    KG: 'kg',
    LITRE: 'L',
    GRAM: 'g',
    ML: 'ml',
    BAG: 'bags',
    TONNE: 't',
    OTHER: '',
  };
  const unitLabel = unitMap[unit] ?? unit.toLowerCase();
  return unitLabel ? `${qty} ${unitLabel}` : `${qty}`;
}

function getInputIconType(inputType: CropInputType): 'recycle' | 'flask' | 'sprout' {
  switch (inputType) {
    case 'FERTILIZER':
      return 'flask';
    case 'BIO_INPUT':
      return 'sprout';
    case 'MANURE':
    case 'PESTICIDE':
    case 'OTHER':
    default:
      return 'recycle';
  }
}

const DEFAULT_CARROT_THUMB =
  'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&auto=format&fit=crop&q=85';

export interface CropNPKContributionScreenProps {
  crop?: CropItem | null;
  onBack?: () => void;
}

export function CropNPKContributionScreen({
  crop,
  onBack,
}: CropNPKContributionScreenProps): React.JSX.Element {
  const [npkData, setNpkData] = useState<CropNpkContributionResponse | null>(null);
  const [inputs, setInputs] = useState<CropInputResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Listen for hardware back on Android
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

  const loadData = useCallback(async () => {
    if (!crop?.id) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const [npk, inputsRes] = await Promise.all([
        getNpkContribution(crop.id),
        listCropInputs(crop.id, { limit: 100 }),
      ]);
      setNpkData(npk);
      setInputs(inputsRes.items);
    } catch (err: unknown) {
      setError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [crop?.id]);

  useEffect(() => {
    setLoading(true);
    void loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadData();
  }, [loadData]);

  const cropName = crop?.name ?? 'Carrot';
  const variety = crop?.variety ?? 'Nantes';
  const zone = crop?.zoneShort || crop?.zone || 'Zone 1';
  const subtitle = `${cropName} — ${variety} · ${zone}`;
  const daysText =
    crop?.daysOld !== null && crop?.daysOld !== undefined ? `${crop.daysOld} days old` : '0 days old';
  const headerDetails = `${crop?.zone ?? 'Zone 1 — Upper Field'} · ${crop?.area ?? '0.4 ha'} · ${daysText}`;
  const thumbnailUri = crop?.imageUri ?? DEFAULT_CARROT_THUMB;
  const areaLabel = crop?.area?.toUpperCase() ?? '0.4 HA';

  const cropKey = crop?.name ? crop.name.toLowerCase() : 'carrot';
  const target = CROP_TARGETS[cropKey] ?? DEFAULT_TARGET;

  const actualN = npkData?.totalNitrogenKg ?? 0;
  const actualP = npkData?.totalPhosphorusKg ?? 0;
  const actualK = npkData?.totalPotassiumKg ?? 0;

  const pctN = target.n > 0 ? Math.min(100, Math.round((actualN / target.n) * 100)) : 0;
  const pctP = target.p > 0 ? Math.min(100, Math.round((actualP / target.p) * 100)) : 0;
  const pctK = target.k > 0 ? Math.min(100, Math.round((actualK / target.k) * 100)) : 0;

  const nutrientRequirements: NutrientMetric[] = [
    {
      name: 'Nitrogen',
      chemical: 'N',
      percent: pctN,
      actualKg: actualN,
      targetKg: target.n,
      statusColor: pctN < 50 ? P.twRed600 : pctN < 80 ? P.orange600 : P.twGreen700,
    },
    {
      name: 'Phosphorus',
      chemical: 'P₂O₅',
      percent: pctP,
      actualKg: actualP,
      targetKg: target.p,
      statusColor: pctP < 50 ? P.twRed600 : pctP < 80 ? P.orange600 : P.twGreen700,
    },
    {
      name: 'Potassium',
      chemical: 'K₂O',
      percent: pctK,
      actualKg: actualK,
      targetKg: target.k,
      statusColor: pctK < 50 ? P.twRed600 : pctK < 80 ? P.orange600 : P.twGreen700,
    },
  ];

  const lowNutrients = nutrientRequirements.filter((item) => item.percent < 50);

  const cumulativeIntake: CumulativeIntakeItem[] = [
    { label: 'Nitrogen (N)', amount: `${actualN} kg` },
    { label: 'Phosphorus (P₂O₅)', amount: `${actualP} kg` },
    { label: 'Potassium (K₂O)', amount: `${actualK} kg` },
  ];

  const contributingApplications: ContributingApplication[] = inputs.map((input) => {
    const tags: string[] = [];
    if (input.nitrogenPct !== null && input.nitrogenPct > 0) tags.push('N');
    if (input.phosphorusPct !== null && input.phosphorusPct > 0) tags.push('P₂O₅');
    if (input.potassiumPct !== null && input.potassiumPct > 0) tags.push('K₂O');

    return {
      id: input.id,
      title: input.inputName,
      timestamp: formatAppliedDate(input.appliedOn),
      amount: formatQuantityUnit(input.quantity, input.unit),
      type: getInputIconType(input.inputType),
      tags,
    };
  });

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBack}
        activeOpacity={0.7}
        hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <ArrowBackIcon size={20} color={P.twGray800} />
      </TouchableOpacity>

      <View style={styles.headerTitleCol}>
        <Text style={styles.headerTitle}>NPK Contribution</Text>
        <Text style={styles.headerSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );

  if (loading && !refreshing && crop?.id) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={P.paleStoneBg} />
        <View style={styles.container}>
          {renderHeader()}
          <View style={styles.loadingContainer}>
            <Skeleton width="100%" height={80} borderRadius={18} />
            <View style={styles.skeletonSpacer} />
            <Skeleton width="100%" height={74} borderRadius={16} />
            <View style={styles.skeletonSpacer} />
            <Skeleton width="100%" height={180} borderRadius={20} />
            <View style={styles.skeletonSpacer} />
            <Skeleton width="100%" height={140} borderRadius={16} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error && crop?.id) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={P.paleStoneBg} />
        <View style={styles.container}>
          {renderHeader()}
          <View style={styles.errorContainer}>
            <ErrorState error={error} onRetry={() => void loadData()} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.paleStoneBg} />

      <View style={styles.container}>
        {/* ── Header ── */}
        {renderHeader()}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[P.brandGreen]}
              tintColor={P.brandGreen}
            />
          }
        >
          {/* ── Top Crop Info Card ── */}
          <View style={styles.cropSummaryCard}>
            <Image source={{ uri: thumbnailUri }} style={styles.cropThumb} />
            <View style={styles.cropInfoCol}>
              <Text style={styles.cropInfoTitle}>{cropName} — {variety}</Text>
              <Text style={styles.cropInfoSubtitle}>{headerDetails}</Text>
            </View>
          </View>

          {/* ── Alert Banner: running low nutrients ── */}
          {lowNutrients.length > 0 ? (
            <View style={styles.alertCard}>
              <View style={styles.alertIconCol}>
                <AlertTriangleIcon size={22} color={P.twOrange600} />
              </View>
              <View style={styles.alertTextCol}>
                <Text style={styles.alertTitle}>
                  {lowNutrients.length} of {nutrientRequirements.length} nutrients running low
                </Text>
                <Text style={styles.alertDescription}>
                  {lowNutrients.map((n) => n.name).join(' and ')}{' '}
                  {lowNutrients.length === 1 ? 'is' : 'are'} below 50% of requirement. Schedule a
                  fertigation before the next growth stage.
                </Text>
              </View>
            </View>
          ) : null}

          {/* ── Section: REQUIREMENT MET ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>REQUIREMENT MET</Text>
          </View>

          <View style={styles.nutrientsCard}>
            {nutrientRequirements.map((item, index) => {
              const isLast = index === nutrientRequirements.length - 1;
              return (
                <View
                  key={item.chemical}
                  style={[styles.nutrientRow, !isLast && styles.nutrientRowBottomMargin]}
                >
                  {/* Top line: Name + % */}
                  <View style={styles.nutrientTitleRow}>
                    <Text style={styles.nutrientNameText}>
                      {item.name} ({item.chemical})
                    </Text>
                    <Text style={[styles.nutrientPercentText, { color: item.statusColor }]}>
                      {item.percent}%
                    </Text>
                  </View>

                  {/* Progress track */}
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${item.percent}%`,
                          backgroundColor: item.statusColor,
                        },
                      ]}
                    />
                  </View>

                  {/* Subtitle: 16 of 40 kg/ha */}
                  <Text style={styles.nutrientRatioText}>
                    {item.actualKg} of {item.targetKg} kg/ha
                  </Text>
                </View>
              );
            })}
          </View>

          {/* ── Section: CUMULATIVE INTAKE ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>CUMULATIVE INTAKE · {areaLabel}</Text>
          </View>

          <View style={styles.cumulativeCard}>
            {cumulativeIntake.map((item, index) => {
              const isLast = index === cumulativeIntake.length - 1;
              return (
                <View key={item.label}>
                  <View style={styles.cumulativeRow}>
                    <Text style={styles.cumulativeLabel}>{item.label}</Text>
                    <Text style={styles.cumulativeAmount}>{item.amount}</Text>
                  </View>
                  {!isLast && <View style={styles.cumulativeDivider} />}
                </View>
              );
            })}
          </View>

          {/* ── Section: CONTRIBUTING APPLICATIONS ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>CONTRIBUTING APPLICATIONS</Text>
          </View>

          <View style={styles.applicationsList}>
            {contributingApplications.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No contributing applications recorded yet.</Text>
              </View>
            ) : (
              contributingApplications.map((app) => (
                <View key={app.id} style={styles.appCard}>
                  {/* Icon Badge */}
                  <View
                    style={[
                      styles.appIconBadge,
                      app.type === 'flask'
                        ? { backgroundColor: P.twBlue50 }
                        : { backgroundColor: P.twGreen100 },
                    ]}
                  >
                    {app.type === 'recycle' ? (
                      <RecycleLeafIcon size={18} color={P.twGreen700} />
                    ) : app.type === 'flask' ? (
                      <FlaskBeakerIcon size={18} color={P.twBlue600} />
                    ) : (
                      <SproutIcon size={18} color={P.twGreen700} />
                    )}
                  </View>

                  {/* Info Column */}
                  <View style={styles.appInfoCol}>
                    <Text style={styles.appTitle}>{app.title}</Text>
                    <Text style={styles.appSubtitle}>
                      {app.timestamp} · {app.amount}
                    </Text>

                    {/* Nutrient Pills */}
                    {app.tags.length > 0 ? (
                      <View style={styles.pillTagRow}>
                        {app.tags.map((tag) => (
                          <View key={tag} style={styles.pillTag}>
                            <Text style={styles.pillTagText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Stylesheet (strictly no raw hex literals)
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.paleStoneBg,
  },
  container: {
    flex: 1,
    backgroundColor: P.paleStoneBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: P.paleStoneBg,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.title,
    fontWeight: '800',
    color: P.ink,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: typography.bodySmall,
    fontWeight: '500',
    color: P.twGray500,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  cropSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: 12,
    marginBottom: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  cropThumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: P.twGray100,
  },
  cropInfoCol: {
    flex: 1,
    marginLeft: 12,
  },
  cropInfoTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.ink,
  },
  cropInfoSubtitle: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    marginTop: 3,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: P.twOrange50,
    borderLeftWidth: 4,
    borderLeftColor: P.twOrange600,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  alertIconCol: {
    marginRight: 10,
    marginTop: 2,
  },
  alertTextCol: {
    flex: 1,
  },
  alertTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.twAmber900,
    marginBottom: 4,
  },
  alertDescription: {
    fontSize: typography.bodySmall,
    color: P.twOrange700,
    lineHeight: 18,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionHeaderText: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.twGray500,
    letterSpacing: 0.8,
  },
  nutrientsCard: {
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: 16,
    marginBottom: 20,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  nutrientRow: {
    width: '100%',
  },
  nutrientRowBottomMargin: {
    marginBottom: 16,
  },
  nutrientTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  nutrientNameText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.ink,
  },
  nutrientPercentText: {
    fontSize: typography.body,
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: P.twGray100,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  nutrientRatioText: {
    fontSize: typography.bodySmall,
    color: P.twGray400,
  },
  cumulativeCard: {
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 20,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  cumulativeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  cumulativeLabel: {
    fontSize: typography.body,
    color: P.twGray500,
    fontWeight: '500',
  },
  cumulativeAmount: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.ink,
  },
  cumulativeDivider: {
    height: 1,
    backgroundColor: P.twGray100,
  },
  applicationsList: {
    gap: 10,
  },
  appCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  appIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  appInfoCol: {
    flex: 1,
    marginLeft: 12,
  },
  appTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.ink,
  },
  appSubtitle: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    marginTop: 2,
    marginBottom: 8,
  },
  pillTagRow: {
    flexDirection: 'row',
    gap: 6,
  },
  pillTag: {
    backgroundColor: P.twGray100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pillTagText: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: P.twGray700,
  },
  bottomSpacer: {
    height: 20,
  },
  emptyCard: {
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: typography.body,
    color: P.twGray500,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 16,
  },
  skeletonSpacer: {
    height: 14,
  },
  errorContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
