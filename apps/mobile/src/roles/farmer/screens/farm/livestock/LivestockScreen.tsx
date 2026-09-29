import React, { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { authPalette as P, colors, typography } from '../../../theme';
import { t } from '../../../../../i18n/farmer';
import { ErrorState, Skeleton } from '@tohfa/mobile-ui';
import {
  listAnimals,
  type AnimalResponse,
  type AnimalSpecies,
} from '../../../api/livestock';

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

function ChevronDownIcon({ size = 16, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PawPrintIcon({ size = 22, color = P.brown400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="7.5" cy="8.5" r="2" fill={color} />
      <Circle cx="16.5" cy="8.5" r="2" fill={color} />
      <Circle cx="12" cy="5.5" r="2" fill={color} />
      <Circle cx="12" cy="14.5" r="4" fill={color} />
      <Circle cx="6.5" cy="13" r="1.5" fill={color} />
      <Circle cx="17.5" cy="13" r="1.5" fill={color} />
    </Svg>
  );
}

function EggPoultryIcon({ size = 20, color = P.brown400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C8 2 5 8 5 14a7 7 0 0 0 14 0c0-6-3-12-7-12z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 7c-2 2-3 5-3 7"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function WarningTriangleIcon({ size = 12, color = P.twRed600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        fill={color}
      />
      <Path d="M12 9v4M12 17h.01" stroke={P.white} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function PlusIcon({ size = 18, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── Types & Data ─────────────────────────────────────────────────────────────

interface AnimalItem {
  id: string;
  name: string;
  code: string;
  type: string;
  breed: string;
  gender: string;
  age: string;
  statusBadge: string;
  statusBadgeType: 'green' | 'orange' | 'born_green' | 'grey';
  hasAlert?: boolean;
  alertText?: string;
  iconType: 'paw' | 'egg';
}

const SPECIES_OPTIONS = ['All species', 'Cattle', 'Buffalo', 'Goat', 'Poultry', 'Sheep'];

/** `SPECIES_OPTIONS` labels map 1:1 (case aside) onto the real `AnimalSpecies` enum. */
function speciesLabelToApi(label: string): AnimalSpecies | undefined {
  switch (label) {
    case 'Cattle':
      return 'CATTLE';
    case 'Buffalo':
      return 'BUFFALO';
    case 'Goat':
      return 'GOAT';
    case 'Poultry':
      return 'POULTRY';
    case 'Sheep':
      return 'SHEEP';
    default:
      return undefined;
  }
}

function speciesLabel(species: AnimalResponse['species']): string {
  switch (species) {
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

function genderLabel(gender: AnimalResponse['gender']): string {
  return gender === 'FEMALE' ? 'Female' : 'Male';
}

/** `YYYY-MM-DD` parsed as LOCAL calendar date (never `new Date(iso)`, which
 *  reads it as UTC midnight and can roll back a day west of Greenwich). */
function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map((part) => parseInt(part, 10));
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

function todayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Short age label ("4 yr", "8 mo") computed client-side from `dateOfBirth` —
 *  the API returns the raw date only, never a pre-formatted age string. */
function computeAgeShort(dateOfBirth: string | null): string {
  if (!dateOfBirth) return t('farmer.livestock.list.ageUnknown');
  const birth = parseIsoDate(dateOfBirth);
  const now = new Date();
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months -= 1;
  if (months < 0) return t('farmer.livestock.list.ageNewborn');
  if (months < 12) return t('farmer.livestock.list.ageMonths', { count: Math.max(months, 0) });
  const years = Math.floor(months / 12);
  return t('farmer.livestock.list.ageYears', { count: years });
}

/** Withdrawal is "active" when today is on or before the withdrawal end date. */
function isWithdrawalActive(withdrawalUntil: string | null): boolean {
  if (!withdrawalUntil) return false;
  return withdrawalUntil >= todayIso();
}

function statusBadgeFor(animal: AnimalResponse): { label: string; type: AnimalItem['statusBadgeType'] } {
  if (animal.organicStatus === 'ORGANIC') {
    if (animal.source === 'BORN_ON_FARM') {
      return { label: t('farmer.livestock.list.statusBornOrganic'), type: 'born_green' };
    }
    return { label: t('farmer.livestock.list.statusFullyOrganic'), type: 'green' };
  }
  if (animal.organicStatus === 'TRANSITIONING') {
    return { label: t('farmer.livestock.list.statusTransitioning'), type: 'orange' };
  }
  return { label: t('farmer.livestock.list.statusConventional'), type: 'grey' };
}

function toAnimalItem(animal: AnimalResponse): AnimalItem {
  const status = statusBadgeFor(animal);
  const withdrawalActive = isWithdrawalActive(animal.withdrawalUntil);
  return {
    id: animal.id,
    name: animal.name ?? animal.tag,
    code: animal.tag,
    type: speciesLabel(animal.species),
    breed: animal.breed ?? '',
    gender: genderLabel(animal.gender),
    age: computeAgeShort(animal.dateOfBirth),
    statusBadge: status.label,
    statusBadgeType: status.type,
    ...(withdrawalActive
      ? { hasAlert: true, alertText: t('farmer.livestock.list.withdrawalAlert') }
      : {}),
    iconType: animal.species === 'POULTRY' ? 'egg' : 'paw',
  };
}

export interface LivestockScreenProps {
  onBack?: () => void;
  onNavigateToAddAnimal?: () => void;
  onNavigateToAnimalDetail?: (animal: AnimalItem) => void;
}

export function LivestockScreen({
  onBack,
  onNavigateToAddAnimal,
  onNavigateToAnimalDetail,
}: LivestockScreenProps): React.JSX.Element {
  const [selectedSpecies, setSelectedSpecies] = useState<string>('All species');
  const [speciesModalVisible, setSpeciesModalVisible] = useState(false);

  const [animals, setAnimals] = useState<AnimalResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown | null>(null);

  const loadAnimals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const species = speciesLabelToApi(selectedSpecies);
      const result = await listAnimals(species ? { species } : {});
      setAnimals(result.items);
    } catch (err: unknown) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [selectedSpecies]);

  useEffect(() => {
    void loadAnimals();
  }, [loadAnimals]);

  const filteredAnimals = animals.map(toAnimalItem);
  const fullyOrganicCount = animals.filter((a) => a.organicStatus === 'ORGANIC').length;
  const alertCount = animals.filter((a) => isWithdrawalActive(a.withdrawalUntil)).length;

  const handleAnimalPress = (animal: AnimalItem) => {
    onNavigateToAnimalDetail?.(animal);
  };

  const handleAddAnimal = () => {
    onNavigateToAddAnimal?.();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={P.white} />
        <View style={[styles.scrollContent, { gap: 12 }]}>
          <Skeleton width="100%" height={48} borderRadius={21} />
          <Skeleton width="100%" height={72} borderRadius={16} />
          <Skeleton width="100%" height={96} borderRadius={18} />
          <Skeleton width="100%" height={96} borderRadius={18} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={P.white} />
        <View style={[styles.scrollContent, { flex: 1, justifyContent: 'center' }]}>
          <ErrorState error={error} onRetry={() => void loadAnimals()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Row */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ArrowBackIcon size={20} color={P.deepGreen} />
            </TouchableOpacity>
            <View style={styles.headerTitles}>
              <Text style={styles.headerTitle}>Livestock</Text>
              <Text style={styles.headerSubtitle}>
                {t('farmer.livestock.list.countSubtitle', { count: animals.length })}
              </Text>
            </View>
          </View>

          {/* 3 Summary Stats Cards */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{animals.length}</Text>
              <Text style={styles.statLabel}>Animals</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: colors.brandGreen }]}>{fullyOrganicCount}</Text>
              <Text style={styles.statLabel}>Fully organic</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: P.twRed600 }]}>{alertCount}</Text>
              <Text style={styles.statLabel}>Health alert</Text>
            </View>
          </View>

          {/* Species Dropdown Filter */}
          <View style={styles.filterSection}>
            <TouchableOpacity
              style={styles.filterPill}
              onPress={() => setSpeciesModalVisible(true)}
              activeOpacity={0.75}
            >
              <Text style={styles.filterPillText}>{selectedSpecies}</Text>
              <ChevronDownIcon size={16} color={P.twGray500} />
            </TouchableOpacity>
          </View>

          {/* Section Header */}
          <Text style={styles.sectionHeader}>ANIMALS</Text>

          {/* Animals List */}
          <View style={styles.animalsList}>
            {filteredAnimals.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.animalCard}
                onPress={() => handleAnimalPress(item)}
                activeOpacity={0.75}
              >
                {/* Left Avatar with Alert Dot */}
                <View style={styles.avatarContainer}>
                  <View style={styles.avatarCircle}>
                    {item.iconType === 'paw' ? (
                      <PawPrintIcon size={22} color={P.twAmber800} />
                    ) : (
                      <EggPoultryIcon size={20} color={P.twAmber800} />
                    )}
                  </View>
                  {item.hasAlert && <View style={styles.alertDot} />}
                </View>

                {/* Middle Info */}
                <View style={styles.cardContent}>
                  <View style={styles.nameCodeRow}>
                    <Text style={styles.animalName}>{item.name}</Text>
                    <Text style={styles.animalCode}>{item.code}</Text>
                  </View>

                  <Text style={styles.animalDetails}>
                    {item.type} · {item.breed} · {item.gender} · {item.age}
                  </Text>

                  {/* Badges Row */}
                  <View style={styles.badgesRow}>
                    <View
                      style={[
                        styles.badge,
                        item.statusBadgeType === 'orange'
                          ? styles.badgeOrange
                          : item.statusBadgeType === 'grey'
                            ? styles.badgeGrey
                            : styles.badgeGreen,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          item.statusBadgeType === 'orange'
                            ? styles.badgeTextOrange
                            : item.statusBadgeType === 'grey'
                              ? styles.badgeTextGrey
                              : styles.badgeTextGreen,
                        ]}
                      >
                        {item.statusBadge}
                      </Text>
                    </View>

                    {item.hasAlert && item.alertText && (
                      <View style={styles.alertBadge}>
                        <WarningTriangleIcon size={11} color={P.twOrange700} />
                        <Text style={styles.alertBadgeText}>{item.alertText}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Right Arrow */}
                <View style={styles.chevronBox}>
                  <ChevronRightIcon size={18} color={P.twGray400} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Floating Action Button */}
        <TouchableOpacity
          style={styles.fab}
          onPress={handleAddAnimal}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Add animal"
        >
          <PlusIcon size={18} color={P.white} />
          <Text style={styles.fabText}>Add animal</Text>
        </TouchableOpacity>
      </View>

      {/* Species Modal */}
      <Modal
        visible={speciesModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSpeciesModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSpeciesModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Species</Text>
            {SPECIES_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={styles.modalOption}
                onPress={() => {
                  setSelectedSpecies(opt);
                  setSpeciesModalVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    selectedSpecies === opt && styles.modalOptionTextActive,
                  ]}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.lightSurfaceAlt,
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 90,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: P.nearBlack,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: typography.body,
    color: P.twGray500,
    marginTop: 2,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: P.white,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: P.twGray100,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  statNumber: {
    fontSize: typography.title,
    fontWeight: '700',
    color: P.nearBlack,
  },
  statLabel: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    marginTop: 4,
    textAlign: 'center',
  },

  filterSection: {
    marginBottom: 18,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: P.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: P.twGray200,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  filterPillText: {
    fontSize: typography.body,
    fontWeight: '500',
    color: P.twGray700,
  },

  sectionHeader: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.twGray500,
    letterSpacing: 0.6,
    marginBottom: 12,
  },

  animalsList: {
    gap: 12,
  },
  animalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.twGray100,
    padding: 15,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: P.twAmber50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: P.twOrange600,
    borderWidth: 1.5,
    borderColor: P.white,
  },
  cardContent: {
    flex: 1,
  },
  nameCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  animalName: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.nearBlack,
  },
  animalCode: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    fontWeight: '500',
  },
  animalDetails: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    marginTop: 2,
    marginBottom: 6,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeGreen: {
    backgroundColor: colors.brandGreenLight,
  },
  badgeOrange: {
    backgroundColor: P.twAmber100,
  },
  badgeGrey: {
    backgroundColor: P.twGray100,
  },
  badgeText: {
    fontSize: typography.caption,
    fontWeight: '600',
  },
  badgeTextGreen: {
    color: colors.brandGreen,
  },
  badgeTextOrange: {
    color: P.twAmber800,
  },
  badgeTextGrey: {
    color: P.twGray600,
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: P.twOrange100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  alertBadgeText: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: P.twOrange700,
  },
  chevronBox: {
    paddingLeft: 6,
  },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brandGreen,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 24,
    shadowColor: P.deepGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
    gap: 6,
  },
  fabText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.white,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: P.white,
    borderRadius: 18,
    padding: 20,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.twGray900,
    marginBottom: 14,
  },
  modalOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  modalOptionText: {
    fontSize: typography.body,
    color: P.twGray700,
  },
  modalOptionTextActive: {
    color: colors.brandGreen,
    fontWeight: '700',
  },
});
