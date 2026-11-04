import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { ErrorState, Skeleton, ScreenStatusBar } from '@tohfa/mobile-ui';
import { authPalette as P, colors, typography } from '../../../theme';
import { t } from '../../../../../i18n/farmer';
import {
  getAnimal,
  listProductionLogs,
  type AnimalGender,
  type AnimalResponse,
  type AnimalSource,
  type AnimalSpecies,
  type OrganicStatus,
  type ProductionLogResponse,
} from '../../../api/livestock';
import { type AnimalFormData } from './RegisterAnimalScreen';
import { MilkDropletIcon, ProhibitedCircleIcon } from './animalDetailIcons';
import { AnimalBreedingSection } from './AnimalBreedingSection';
import { AnimalFeedSection } from './AnimalFeedSection';
import { AnimalHealthSection } from './AnimalHealthSection';
import { AnimalHousingSection } from './AnimalHousingSection';
import { formatRegisterFormDate } from './animalRecordView';

// ── SVG Icons ────────────────────────────────────────────────────────────────

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

function PencilEditIcon({ size = 18, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function HeaderTagIcon({ size = 18, color = P.twGray600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="7" cy="7" r="1.5" fill={color} />
    </Svg>
  );
}

function PawPrintIcon({ size = 26, color = P.twAmber800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="14.5" r="4.5" fill={color} />
      <Circle cx="6.5" cy="10" r="2.2" fill={color} />
      <Circle cx="17.5" cy="10" r="2.2" fill={color} />
      <Circle cx="9.5" cy="6" r="2" fill={color} />
      <Circle cx="14.5" cy="6" r="2" fill={color} />
    </Svg>
  );
}

// ── Tab Bar Icons ────────────────────────────────────────────────────────────

function TabHealthIcon({ size = 16, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="5" width="7" height="15" rx="1.5" stroke={color} strokeWidth="2" />
      <Line x1="7.5" y1="2" x2="7.5" y2="5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Rect x="13" y="8" width="7" height="12" rx="1.5" stroke={color} strokeWidth="2" />
      <Line x1="16.5" y1="5" x2="16.5" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function TabFeedIcon({ size = 16, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TabBreedingIcon({ size = 16, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TabProductionIcon({ size = 16, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 6l-9.5 9.5-5-5L1 18"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M17 6h6v6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TabHousingIcon({ size = 16, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 22V12h6v10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── Enum display / API mapping ──────────────────────────────────────────────
// Explicit switches (not `.toUpperCase() as X`) so a future enum addition on
// either side fails to compile instead of silently mismatching.

function speciesLabel(v: AnimalSpecies): string {
  switch (v) {
    case 'CATTLE':
      return 'Cattle';
    case 'BUFFALO':
      return 'Buffalo';
    case 'GOAT':
      return 'Goat';
    case 'POULTRY':
      return 'Poultry';
    case 'SHEEP':
      return 'Sheep';
  }
}

function genderLabel(v: AnimalGender): 'Female' | 'Male' {
  return v === 'MALE' ? 'Male' : 'Female';
}

function sourceToFormValue(v: AnimalSource): 'born_on_farm' | 'purchased' {
  return v === 'PURCHASED' ? 'purchased' : 'born_on_farm';
}

function organicStatusToFormValue(v: OrganicStatus): 'Organic' | 'Transitioning' | 'Conventional' {
  switch (v) {
    case 'ORGANIC':
      return 'Organic';
    case 'TRANSITIONING':
      return 'Transitioning';
    case 'CONVENTIONAL':
      return 'Conventional';
  }
}

function statusBadgeLabelFor(animal: AnimalResponse): string {
  if (animal.organicStatus === 'ORGANIC') {
    return animal.source === 'BORN_ON_FARM'
      ? t('farmer.livestock.list.statusBornOrganic')
      : t('farmer.livestock.list.statusFullyOrganic');
  }
  if (animal.organicStatus === 'TRANSITIONING') {
    return t('farmer.livestock.list.statusTransitioning');
  }
  return t('farmer.livestock.list.statusConventional');
}

/** `YYYY-MM-DD` parsed as a LOCAL calendar date, never `new Date(iso)`. */
function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map((part) => parseInt(part, 10));
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function isWithdrawalActive(withdrawalUntil: string | null): boolean {
  return withdrawalUntil !== null && withdrawalUntil >= todayIso();
}

/** Short age label ("4 yr", "8 mo") computed client-side from `dateOfBirth`. */
function computeAgeShort(dateOfBirth: string | null): string {
  if (!dateOfBirth) return t('farmer.livestock.list.ageUnknown');
  const birth = parseIsoDate(dateOfBirth);
  const now = new Date();
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months -= 1;
  if (months < 0) return t('farmer.livestock.list.ageNewborn');
  if (months < 12) return t('farmer.livestock.list.ageMonths', { count: Math.max(months, 0) });
  return t('farmer.livestock.list.ageYears', { count: Math.floor(months / 12) });
}

function formatShortDate(iso: string): string {
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const d = parseIsoDate(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface AnimalDetailProps {
  animalId?: string;
  animalName?: string;
  animalCode?: string;
  species?: string;
  breed?: string;
  gender?: string;
  age?: string;
  statusBadge?: string;
  onBack?: () => void;
  onNavigateToEdit?: (animalData: any) => void;
  onNavigateToSale?: () => void;
  onNavigateToRegisterOffspring?: () => void;
}

type TabKey = 'Health' | 'Feed' | 'Breeding' | 'Production' | 'Housing';

export function AnimalDetailScreen({
  animalId = 'a1',
  animalName = 'Lakshmi',
  animalCode = 'C-014',
  species = 'Cattle',
  breed = 'Jersey cross',
  gender = 'Female',
  age = '4 yr',
  statusBadge = 'Fully Organic',
  onBack,
  onNavigateToEdit,
  onNavigateToSale,
  onNavigateToRegisterOffspring,
}: AnimalDetailProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TabKey>('Health');

  const [animal, setAnimal] = useState<AnimalResponse | null>(null);
  const [productionLogs, setProductionLogs] = useState<ProductionLogResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<unknown | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [fetchedAnimal, logsResult] = await Promise.all([
        getAnimal(animalId),
        listProductionLogs({ animalId, productType: 'MILK' }),
      ]);
      setAnimal(fetchedAnimal);
      setProductionLogs(logsResult.items);
    } catch (err: unknown) {
      setLoadError(err);
    } finally {
      setLoading(false);
    }
  }, [animalId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Real, authoritative values once loaded; the route-param props above only
  // cover the brief window before the GET resolves.
  const displayName = animal?.name ?? animal?.tag ?? animalName;
  const displayCode = animal?.tag ?? animalCode;
  const displaySpecies = animal ? speciesLabel(animal.species) : species;
  const displayBreed = animal?.breed ?? breed;
  const displayGender = animal ? genderLabel(animal.gender) : gender;
  const displayAge = animal ? computeAgeShort(animal.dateOfBirth) : age;
  const displayStatusBadge = animal ? statusBadgeLabelFor(animal) : statusBadge;
  const withdrawalActive = animal ? isWithdrawalActive(animal.withdrawalUntil) : false;
  const todayLogs = productionLogs.filter((log) => log.loggedOn === todayIso());
  const todayYieldLiters = todayLogs.reduce((sum, log) => sum + log.quantity, 0);
  const todaySessionCount = todayLogs.reduce((sum, log) => sum + (log.sessions ?? 1), 0);

  const handleEdit = () => {
    if (!animal) return;
    if (onNavigateToEdit) {
      const formData: AnimalFormData = {
        id: animal.id,
        tag: animal.tag,
        name: animal.name ?? undefined,
        species: speciesLabel(animal.species),
        breed: animal.breed ?? '',
        gender: genderLabel(animal.gender),
        dob: animal.dateOfBirth ? formatShortDate(animal.dateOfBirth) : '',
        source: sourceToFormValue(animal.source),
        purchaseDate: animal.purchasedOn ? formatShortDate(animal.purchasedOn) : undefined,
        sourceFarm: animal.sourceFarm ?? undefined,
        organicStatus: organicStatusToFormValue(animal.organicStatus),
      };
      onNavigateToEdit(formData);
    } else {
      Alert.alert('Edit Animal', `Editing profile for ${displayName} (${displayCode})`);
    }
  };

  const handleMoreOptions = () => {
    if (onNavigateToSale) {
      onNavigateToSale();
    } else {
      Alert.alert('Animal Options', `Options for ${displayName} (${displayCode})`, [
        { text: 'Edit Profile', onPress: handleEdit },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  // The calving record supplies the newborn's date of birth and sex; the rest is the dam's.
  const handleRegisterOffspring = (calvingIso: string, offspringGender: AnimalGender | null) => {
    if (onNavigateToRegisterOffspring) {
      onNavigateToRegisterOffspring();
    } else if (onNavigateToEdit) {
      onNavigateToEdit({
        species: displaySpecies,
        breed: `${displayBreed} offspring`,
        gender: offspringGender === null ? 'Female' : genderLabel(offspringGender),
        dob: formatRegisterFormDate(calvingIso),
        source: 'born_on_farm',
        organicStatus: 'Organic',
      });
    } else {
      Alert.alert('Register Offspring', 'Opening registration form for newborn calf.');
    }
  };

  // Compute slider thumb offset
  const getSliderThumbStyle = () => {
    switch (activeTab) {
      case 'Health':
        return { alignSelf: 'flex-start' as const };
      case 'Feed':
        return { alignSelf: 'center' as const, transform: [{ translateX: -20 }] };
      case 'Breeding':
        return { alignSelf: 'center' as const };
      case 'Production':
        return { alignSelf: 'center' as const, transform: [{ translateX: 20 }] };
      case 'Housing':
        return { alignSelf: 'flex-end' as const };
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenStatusBar barStyle="dark-content" backgroundColor={P.white} />
        <View style={{ padding: 20, gap: 12 }}>
          <Skeleton width="100%" height={58} borderRadius={16} />
          <Skeleton width="100%" height={40} borderRadius={20} />
          <Skeleton width="100%" height={140} borderRadius={16} />
        </View>
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenStatusBar barStyle="dark-content" backgroundColor={P.white} />
        <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
          <ErrorState error={loadError} onRetry={() => void load()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={P.white} />
      <View style={styles.container}>
        {/* ── Top Header Bar ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.circleHeaderBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ArrowBackIcon size={20} color={P.deepGreen} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{displayName}</Text>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.circleHeaderBtn}
              onPress={handleEdit}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Edit animal"
            >
              <PencilEditIcon size={18} color={colors.brandGreen} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.circleHeaderBtn}
              onPress={onNavigateToSale || handleMoreOptions}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Sale / Transfer / Cull"
            >
              <HeaderTagIcon size={18} color={P.twGray600} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Animal Profile Header Card ── */}
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarCircle}>
                <PawPrintIcon size={26} color={P.twAmber800} />
              </View>
              {withdrawalActive && <View style={styles.alertBadgeDot} />}
            </View>

            <View style={styles.profileInfoCol}>
              <Text style={styles.profileCode}>{displayCode}</Text>
              <Text style={styles.profileSubtitle}>
                {displaySpecies} · {displayBreed} · {displayGender} · {displayAge}
              </Text>
            </View>

            <View style={styles.statusBadgePill}>
              <Text style={styles.statusBadgeText}>{displayStatusBadge}</Text>
            </View>
          </View>

          {/* ── Horizontal Navigation Tabs ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabScrollContent}
            style={styles.tabScrollView}
          >
            {/* Health Tab */}
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'Health' && styles.tabButtonActive]}
              onPress={() => setActiveTab('Health')}
              testID="animalDetail.tab.Health"
              activeOpacity={0.8}
            >
              <TabHealthIcon size={16} color={activeTab === 'Health' ? P.white : P.twGray700} />
              <Text style={[styles.tabButtonText, activeTab === 'Health' && styles.tabButtonTextActive]}>
                Health
              </Text>
            </TouchableOpacity>

            {/* Feed Tab */}
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'Feed' && styles.tabButtonActive]}
              onPress={() => setActiveTab('Feed')}
              testID="animalDetail.tab.Feed"
              activeOpacity={0.8}
            >
              <TabFeedIcon size={16} color={activeTab === 'Feed' ? P.white : P.twGray700} />
              <Text style={[styles.tabButtonText, activeTab === 'Feed' && styles.tabButtonTextActive]}>
                Feed
              </Text>
            </TouchableOpacity>

            {/* Breeding Tab */}
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'Breeding' && styles.tabButtonActive]}
              onPress={() => setActiveTab('Breeding')}
              testID="animalDetail.tab.Breeding"
              activeOpacity={0.8}
            >
              <TabBreedingIcon size={16} color={activeTab === 'Breeding' ? P.white : P.twGray700} />
              <Text
                style={[styles.tabButtonText, activeTab === 'Breeding' && styles.tabButtonTextActive]}
              >
                Breeding
              </Text>
            </TouchableOpacity>

            {/* Production Tab */}
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'Production' && styles.tabButtonActive]}
              onPress={() => setActiveTab('Production')}
              testID="animalDetail.tab.Production"
              activeOpacity={0.8}
            >
              <TabProductionIcon
                size={16}
                color={activeTab === 'Production' ? P.white : P.twGray700}
              />
              <Text
                style={[styles.tabButtonText, activeTab === 'Production' && styles.tabButtonTextActive]}
              >
                Production
              </Text>
            </TouchableOpacity>

            {/* Housing Tab */}
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'Housing' && styles.tabButtonActive]}
              onPress={() => setActiveTab('Housing')}
              testID="animalDetail.tab.Housing"
              activeOpacity={0.8}
            >
              <TabHousingIcon size={16} color={activeTab === 'Housing' ? P.white : P.twGray700} />
              <Text
                style={[styles.tabButtonText, activeTab === 'Housing' && styles.tabButtonTextActive]}
              >
                Housing
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Carousel / Tab position scroll indicator */}
          <View style={styles.scrollIndicatorRow}>
            <View style={styles.arrowTriangleLeft} />
            <View style={styles.sliderTrack}>
              <View style={[styles.sliderThumb, getSliderThumbStyle()]} />
            </View>
            <View style={styles.arrowTriangleRight} />
          </View>

          {/* TAB 1: HEALTH — Dev's design, filled from the health-records API (AnimalHealthSection). */}
          {activeTab === 'Health' && animal && (
            <AnimalHealthSection animal={animal} withdrawalActive={withdrawalActive} styles={styles} />
          )}

          {/* TAB 2: FEED — Dev's design, filled from feed-plans / feed-logs (AnimalFeedSection). */}
          {activeTab === 'Feed' && <AnimalFeedSection animalId={animalId} styles={styles} />}

          {/* TAB 3: BREEDING — Dev's design, filled from breeding-records (AnimalBreedingSection). */}
          {activeTab === 'Breeding' && (
            <AnimalBreedingSection
              animalId={animalId}
              styles={styles}
              onRegisterOffspring={animal ? handleRegisterOffspring : undefined}
            />
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* TAB 4: PRODUCTION                                                  */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'Production' && (
            <View style={styles.tabContentContainer}>
              {/* Milk Yield Summary Card — real, from today's production logs */}
              <View style={styles.whiteCardContainer}>
                <View style={styles.yieldSummaryHeader}>
                  <Text style={styles.yieldSummaryLabel}>Milk yield · today</Text>
                  <View style={styles.gradeBadgePill}>
                    <Text style={styles.gradeBadgeText}>
                      {todaySessionCount} {todaySessionCount === 1 ? 'session' : 'sessions'}
                    </Text>
                  </View>
                </View>

                <View style={styles.yieldNumberRow}>
                  <Text style={styles.yieldBigNumber}>{todayYieldLiters.toFixed(1)}</Text>
                  <Text style={styles.yieldUnitText}>L</Text>
                </View>

                {/* Sparkline Chart — decorative; no per-day series in the schema */}
                <View style={styles.sparklineContainer}>
                  <Svg width="100%" height={36} viewBox="0 0 260 36">
                    <Path
                      d="M 10 24 Q 45 18, 80 20 T 140 13 T 200 11 T 250 15"
                      fill="none"
                      stroke={colors.brandGreen}
                      strokeWidth="2.4"
                      strokeLinecap="round"
                    />
                  </Svg>
                </View>

                <Text style={styles.last7DaysText}>Last 7 days</Text>
              </View>

              {/* Withdrawal Warning Alert */}
              {withdrawalActive && animal?.withdrawalUntil && (
                <View style={styles.productionAlertCard}>
                  <ProhibitedCircleIcon size={17} color={P.twOrange700} />
                  <Text style={styles.productionAlertText}>
                    Under withdrawal — not for sale until {formatShortDate(animal.withdrawalUntil)}.
                  </Text>
                </View>
              )}

              {/* Section: DAILY YIELD LOG — real, from listProductionLogs */}
              <Text style={styles.sectionHeaderTitle}>DAILY YIELD LOG</Text>
              {productionLogs.length === 0 ? (
                <View style={styles.whiteCardContainer}>
                  <Text style={styles.itemSubtitle}>No milk yield logged yet.</Text>
                </View>
              ) : (
                <View style={styles.whiteCardContainer}>
                  {productionLogs.map((log, idx) => (
                    <React.Fragment key={log.id}>
                      <View style={styles.itemRow}>
                        <View style={styles.blueIconSquare}>
                          <MilkDropletIcon size={17} color={P.twBlue600} />
                        </View>
                        <View style={styles.itemMainCol}>
                          <Text style={styles.itemTitle}>
                            {formatShortDate(log.loggedOn)}
                            {log.sessions ? ` · ${log.sessions} sessions` : ''}
                          </Text>
                          {log.notes ? <Text style={styles.itemSubtitle}>{log.notes}</Text> : null}
                        </View>
                        <Text style={styles.itemAmountBold}>{log.quantity} L</Text>
                      </View>
                      {idx < productionLogs.length - 1 && <View style={styles.dividerLine} />}
                    </React.Fragment>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* TAB 5: HOUSING — Dev's design, filled from housing-records / hygiene-logs (AnimalHousingSection). */}
          {activeTab === 'Housing' && (
            <AnimalHousingSection animalId={animalId} speciesName={displaySpecies.toLowerCase()} styles={styles} />
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

export type AnimalDetailStyles = typeof styles;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.white,
  },
  container: {
    flex: 1,
    backgroundColor: P.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
    backgroundColor: P.white,
  },
  circleHeaderBtn: {
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
  headerTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: P.nearBlack,
    letterSpacing: -0.2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },

  // Profile Header Card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatarCircle: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: P.paleCreamBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBadgeDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: P.twOrange600,
    borderWidth: 2,
    borderColor: P.white,
  },
  profileInfoCol: {
    flex: 1,
  },
  profileCode: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.twGray700,
    marginBottom: 2,
  },
  profileSubtitle: {
    fontSize: typography.body,
    color: P.twGray500,
  },
  statusBadgePill: {
    backgroundColor: colors.brandGreenLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: colors.brandGreen,
  },

  // Horizontal Tabs
  tabScrollView: {
    marginBottom: 10,
  },
  tabScrollContent: {
    gap: 8,
    paddingVertical: 2,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: P.twGray100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  tabButtonActive: {
    backgroundColor: colors.brandGreen,
  },
  tabButtonText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray700,
  },
  tabButtonTextActive: {
    color: P.white,
  },

  // Scroll Indicator Bar
  scrollIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  arrowTriangleLeft: {
    width: 0,
    height: 0,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderRightWidth: 6,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: P.twGray400,
  },
  arrowTriangleRight: {
    width: 0,
    height: 0,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderLeftWidth: 6,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: P.twGray400,
  },
  sliderTrack: {
    width: 140,
    height: 6,
    borderRadius: 3,
    backgroundColor: P.twGray200,
    overflow: 'hidden',
  },
  sliderThumb: {
    width: 80,
    height: 6,
    borderRadius: 3,
    backgroundColor: P.twGray500,
  },

  // Generic Containers
  tabContentContainer: {
    gap: 12,
  },
  sectionHeaderTitle: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.twGray500,
    letterSpacing: 0.8,
    marginTop: 8,
  },
  whiteCardContainer: {
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  greenIconSquare: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.brandGreenLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tanIconSquare: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: P.paleCreamBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  blueIconSquare: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: P.blue50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemMainCol: {
    flex: 1,
  },
  itemTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.nearBlack,
  },
  itemSubtitle: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    marginTop: 2,
  },
  itemAmountBold: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.nearBlack,
  },
  dueDateBadge: {
    backgroundColor: P.twGray100,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  dueDateBadgeText: {
    fontSize: typography.bodySmall,
    fontWeight: '600',
    color: P.twGray600,
  },
  dividerLine: {
    height: 1,
    backgroundColor: P.twGray100,
    marginVertical: 8,
  },

  // ── Health Styles ──
  organicNoticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: P.sageTintBg,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: P.sageBorder,
  },
  organicNoticeIconCol: {
    marginTop: 1,
  },
  organicNoticeText: {
    flex: 1,
    fontSize: typography.bodySmall,
    lineHeight: 18,
    color: P.twGray700,
    fontWeight: '500',
  },
  withdrawalAlertCard: {
    flexDirection: 'row',
    backgroundColor: P.twOrange50,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: P.twOrange200,
  },
  withdrawalLeftAccentBar: {
    width: 4,
    backgroundColor: P.twOrange600,
  },
  withdrawalCardInner: {
    flex: 1,
    padding: 14,
    gap: 4,
  },
  withdrawalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  withdrawalTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.twOrange700,
  },
  withdrawalBody: {
    fontSize: typography.bodySmall,
    color: P.twGray600,
    lineHeight: 18,
    paddingLeft: 27,
  },
  boldText: {
    fontWeight: '700',
    color: P.nearBlack,
  },
  checkupCardContent: {
    paddingVertical: 4,
    gap: 6,
  },
  checkupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkupTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkupTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.nearBlack,
  },
  checkupDoctor: {
    fontSize: typography.bodySmall,
    color: P.twGray400,
  },
  checkupDescription: {
    fontSize: typography.bodySmall,
    color: P.twGray600,
    lineHeight: 18,
    marginTop: 2,
  },

  // ── Feed Styles ──
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  tableLabel: {
    fontSize: typography.body,
    color: P.twGray500,
  },
  tableValueBold: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.nearBlack,
  },
  waterSourceValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footnoteCaption: {
    fontSize: typography.bodySmall,
    color: P.twGray400,
    lineHeight: 16,
    paddingHorizontal: 4,
    marginTop: -2,
  },

  // ── Breeding Styles ──
  cycleTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  pregnantBadgePill: {
    backgroundColor: colors.brandGreenLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  pregnantBadgeText: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: colors.brandGreen,
  },
  cycleCountText: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    fontWeight: '500',
  },
  cycleGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cycleGridCol: {
    flex: 1,
    gap: 2,
  },
  cycleGridLabel: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
  },
  cycleGridValBold: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.nearBlack,
    marginTop: 2,
  },
  cycleGridSubtext: {
    fontSize: typography.bodySmall,
    color: P.twGray400,
  },
  cycleGridCountdown: {
    fontSize: typography.bodySmall,
    color: colors.brandGreen,
    fontWeight: '600',
  },
  calvingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  calvingTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.nearBlack,
  },
  calvingDescription: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    marginBottom: 14,
  },
  registerOffspringBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: colors.brandGreen,
    borderRadius: 12,
    paddingVertical: 11,
    backgroundColor: P.white,
  },
  registerOffspringBtnText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.brandGreen,
  },

  // ── Production Styles ──
  yieldSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  yieldSummaryLabel: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
  },
  gradeBadgePill: {
    backgroundColor: colors.brandGreenLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  gradeBadgeText: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: colors.brandGreen,
  },
  yieldNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 8,
  },
  yieldBigNumber: {
    fontSize: typography.headline,
    fontWeight: '700',
    color: P.nearBlack,
  },
  yieldUnitText: {
    fontSize: typography.bodyLarge,
    fontWeight: '600',
    color: P.twGray500,
  },
  sparklineContainer: {
    height: 36,
    marginVertical: 4,
  },
  last7DaysText: {
    fontSize: typography.bodySmall,
    color: P.twGray400,
    marginTop: 4,
  },
  productionAlertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: P.twOrange50,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: P.twOrange200,
  },
  productionAlertText: {
    fontSize: typography.bodySmall,
    fontWeight: '600',
    color: P.twOrange700,
  },

  // ── Housing Styles ──
  housingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  housingHeaderTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.nearBlack,
  },
  housingBoxesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  housingMetricBox: {
    flex: 1,
    backgroundColor: P.twGray50,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: P.twGray100,
  },
  metricValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  metricValNumber: {
    fontSize: typography.title,
    fontWeight: '700',
    color: P.nearBlack,
  },
  metricValUnit: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    fontWeight: '500',
  },
  metricValLabel: {
    fontSize: typography.bodySmall,
    color: P.twGray400,
    marginTop: 4,
  },
  welfareNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: P.sageTintBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: P.sageBorder,
  },
  welfareNoticeCol: {
    flex: 1,
    gap: 2,
  },
  welfareNoticeTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.brandGreen,
  },
  welfareNoticeSubtitle: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
  },
});
