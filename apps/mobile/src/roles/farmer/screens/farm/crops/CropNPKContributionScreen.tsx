import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { EmptyState, ErrorState, SafeAreaView, ScreenStatusBar } from '@tohfa/mobile-ui';
import Svg, { Line, Path, Rect } from 'react-native-svg';
import { t } from '../../../../../i18n/farmer';
import { authPalette as P, spacing, typography } from '../../../theme';
import type { CropItem } from './ProduceCalendarScreen';
import {
  getNpkContribution,
  listCropInputs,
  type CropInputResponse,
  type CropInputType,
  type CropInputUnit,
  type CropNpkContributionResponse,
} from '../../../api/crops';
import { formatAppliedDate } from './inputApplications';

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
// Types & formatting
// ─────────────────────────────────────────────

/** Shown wherever the crop has no value; never replaced by a sample one. */
const NO_VALUE = '—';

/** The inputs list endpoint's page size; every page is followed. */
const INPUTS_PAGE_LIMIT = 100;

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

/** A kg total from the API, at most 2 decimals, without trailing zeros. */
function formatKg(kg: number): string {
  return t('farmer.npkContribution.amountKg', { amount: String(Math.round(kg * 100) / 100) });
}

function formatQuantity(quantity: number, unit: CropInputUnit): string {
  const unitKey = {
    KG: 'farmer.npkContribution.unit.kg',
    LITRE: 'farmer.npkContribution.unit.litre',
    GRAM: 'farmer.npkContribution.unit.gram',
    ML: 'farmer.npkContribution.unit.ml',
    BAG: 'farmer.npkContribution.unit.bag',
    TONNE: 'farmer.npkContribution.unit.tonne',
    OTHER: null,
  } as const satisfies Record<CropInputUnit, string | null>;
  const key = unitKey[unit];
  return key === null ? String(quantity) : `${quantity} ${t(key)}`;
}

/** Which of this screen's three badge icons an input type is drawn with. */
function iconTypeFor(inputType: CropInputType): ContributingApplication['type'] {
  if (inputType === 'FERTILIZER') return 'flask';
  if (inputType === 'BIO_INPUT') return 'sprout';
  return 'recycle';
}

function toContributingApplication(input: CropInputResponse): ContributingApplication {
  const tags: string[] = [];
  if ((input.nitrogenPct ?? 0) > 0) tags.push('N');
  if ((input.phosphorusPct ?? 0) > 0) tags.push('P₂O₅');
  if ((input.potassiumPct ?? 0) > 0) tags.push('K₂O');
  return {
    id: input.id,
    title: input.inputName,
    timestamp: formatAppliedDate(input.appliedOn.slice(0, 10)),
    amount: formatQuantity(input.quantity, input.unit),
    type: iconTypeFor(input.inputType),
    tags,
  };
}

/** Every input applied to one crop; the endpoint is cursor-paginated. */
async function listAllCropInputs(farmCropId: string): Promise<CropInputResponse[]> {
  const items: CropInputResponse[] = [];
  let cursor: string | undefined;
  for (;;) {
    const page = await listCropInputs(farmCropId, {
      limit: INPUTS_PAGE_LIMIT,
      ...(cursor !== undefined ? { cursor } : {}),
    });
    items.push(...page.items);
    if (!page.page.hasMore || page.page.nextCursor === null) return items;
    cursor = page.page.nextCursor;
  }
}

const DEFAULT_CARROT_THUMB =
  'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&auto=format&fit=crop&q=85';

export interface CropNPKContributionScreenProps {
  crop?: CropItem | null;
  onBack?: () => void;
}

type LoadState = 'idle' | 'loading' | 'error' | 'ready';

export function CropNPKContributionScreen({
  crop,
  onBack,
}: CropNPKContributionScreenProps): React.JSX.Element {
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

  const cropId = crop?.id;

  // Real data (BR-56f): the crop's cumulative N/P/K totals and the inputs
  // that make them up.
  const [loadState, setLoadState] = useState<LoadState>(cropId ? 'loading' : 'idle');
  const [npk, setNpk] = useState<CropNpkContributionResponse | null>(null);
  const [inputs, setInputs] = useState<CropInputResponse[]>([]);

  const load = useCallback(async () => {
    if (!cropId) {
      setLoadState('idle');
      return;
    }
    setLoadState('loading');
    try {
      const [npkRes, inputsRes] = await Promise.all([
        getNpkContribution(cropId),
        listAllCropInputs(cropId),
      ]);
      setNpk(npkRes);
      setInputs(inputsRes);
      setLoadState('ready');
    } catch {
      setLoadState('error');
    }
  }, [cropId]);

  useEffect(() => {
    void load();
  }, [load]);

  const cropName = crop?.name ?? NO_VALUE;
  const variety = crop?.variety ?? NO_VALUE;
  const zone = crop?.zoneShort || crop?.zone || NO_VALUE;
  const subtitle = `${cropName} — ${variety} · ${zone}`;
  const daysOldText =
    crop?.daysOld !== null && crop?.daysOld !== undefined
      ? t('farmer.npkContribution.daysOld', { days: crop.daysOld })
      : NO_VALUE;
  const headerDetails = `${crop?.zone || NO_VALUE} · ${crop?.area || NO_VALUE} · ${daysOldText}`;
  const thumbnailUri = crop?.imageUri ?? DEFAULT_CARROT_THUMB;
  const areaLabel = crop?.area ? crop.area.toUpperCase() : '';

  // Only the three nutrients the API totals; no requirement target exists
  // (see docs/rules.md Open contradictions), so no percentage is derived.
  const cumulativeIntake: CumulativeIntakeItem[] = npk
    ? [
        { label: t('farmer.npkContribution.nitrogen'), amount: formatKg(npk.totalNitrogenKg) },
        { label: t('farmer.npkContribution.phosphorus'), amount: formatKg(npk.totalPhosphorusKg) },
        { label: t('farmer.npkContribution.potassium'), amount: formatKg(npk.totalPotassiumKg) },
      ]
    : [];
  const contributingApplications = inputs.map(toContributingApplication);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={P.paleStoneBg} />

      <View style={styles.container}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.npkContribution.goBack')}
          >
            <ArrowBackIcon size={20} color={P.twGray800} />
          </TouchableOpacity>

          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle}>{t('farmer.npkContribution.title')}</Text>
            <Text style={styles.headerSubtitle}>{subtitle}</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loadState === 'idle' ? (
            <EmptyState title={t('farmer.npkContribution.noCrop')} />
          ) : loadState === 'loading' ? (
            <View style={styles.stateContainer}>
              <ActivityIndicator
                color={P.brandGreen}
                accessibilityLabel={t('farmer.npkContribution.loading')}
              />
            </View>
          ) : loadState === 'error' ? (
            <ErrorState
              title={t('farmer.npkContribution.loadErrorTitle')}
              message={t('farmer.npkContribution.loadErrorMessage')}
              retryTitle={t('farmer.npkContribution.retry')}
              onRetry={() => void load()}
            />
          ) : (
            <>
          {/* ── Top Crop Info Card ── */}
          <View style={styles.cropSummaryCard}>
            <Image source={{ uri: thumbnailUri }} style={styles.cropThumb} />
            <View style={styles.cropInfoCol}>
              <Text style={styles.cropInfoTitle}>{cropName} — {variety}</Text>
              <Text style={styles.cropInfoSubtitle}>{headerDetails}</Text>
            </View>
          </View>

          {/* ── Section: REQUIREMENT MET ── */}
          {/* No owner-supplied nutrient targets or status bands exist, so this
              section is neutral: no percentage, target, colour band or
              "running low" alert is computed (CLAUDE.md 2.7). */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{t('farmer.npkContribution.requirementMet')}</Text>
          </View>

          <View style={styles.nutrientsCard}>
            <Text style={styles.nutrientRatioText}>{t('farmer.npkContribution.targetsUnavailable')}</Text>
          </View>

          {/* ── Section: CUMULATIVE INTAKE ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>
              {areaLabel
                ? t('farmer.npkContribution.cumulativeIntake', { area: areaLabel })
                : t('farmer.npkContribution.cumulativeIntakeNoArea')}
            </Text>
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
            <Text style={styles.sectionHeaderText}>{t('farmer.npkContribution.contributing')}</Text>
          </View>

          {contributingApplications.length === 0 ? (
            <EmptyState title={t('farmer.npkContribution.empty')} />
          ) : null}

          <View style={styles.applicationsList}>
            {contributingApplications.map((app) => (
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
                  <View style={styles.pillTagRow}>
                    {app.tags.map((tag) => (
                      <View key={tag} style={styles.pillTag}>
                        <Text style={styles.pillTagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            ))}
          </View>
            </>
          )}

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
  // Loading state (new; theme tokens only).
  stateContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
