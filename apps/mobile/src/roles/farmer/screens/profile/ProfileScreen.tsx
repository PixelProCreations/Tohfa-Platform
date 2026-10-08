import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { ErrorState, FarmBoundaryMap, Icon, Skeleton } from '@tohfa/mobile-ui';
import { logout } from '../../api/auth';
import {
  deriveFarmRatingView,
  evalCertificateWarning,
  getCachedCertifications,
  getMyCertifications,
  getMyFarmerProfile,
  getMyFarmRating,
  getSystemConfig,
  maskAadhaar,
  maskMobile,
  updateMyFarmerProfile,
  type Certification,
  type FarmRating,
} from '../../api/farmer';
import { certificationDisplayName } from '../certifications/certificationForm';
import { getFarms, getPlots, updateFarm, type Farm } from '../../api/farms';
import { listSoilTests, type SoilTestRecord } from '../../api/soil';
import { LOCALES, setLocale, t, type Locale, type TranslationKey } from '../../../../i18n/farmer';
import { colors, authPalette as P, spacing, typography } from '../../theme';
import { calculatePolygonMetrics } from '../../utils/geo';
import farmerAvatar from '../../assets/farmer-kumar.jpg';

/** The Farm & FMB preview map is `readOnly`, so it never emits a change; the prop is required. */
const noopPolygonChange = (): void => {};

interface ProfileScreenProps {
  onNavigateToHome?: () => void;
  onNavigateToCertifications?: () => void;
  onNavigateToMarket?: () => void;
  onNavigateToFMBSketch?: () => void;
  onNavigateToPersonalDetails?: () => void;
  onNavigateToAudits?: () => void;
  onNavigateToFarmRatings?: () => void;
  onNavigateToSoilTest?: () => void;
  onNavigateToSettings?: (() => void) | undefined;
  onNavigateToAboutSupport?: (() => void) | undefined;
  onNavigateToBankPayment?: () => void;
  onSignOut?: () => void;
}

function SignOutIcon({ size = 18, color = P.red600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

interface PersonalDetailsData {
  fullName: string;
  dob: string;
  mobile: string;
  aadhaar: string;
  yearsInOrganic: string;
  farmingType: string;
  farmName: string;
  location: string;
}

interface FarmDetailsData {
  acres: string;
  zones: string;
  farms: string;
  fmbPts: string;
  waterSource: string;
  tags: string[];
}

/**
 * Mirrors `displayStatus` in CertificationsScreen deliberately: both screens must
 * agree on what "expiring" means, and both derive it from the server-computed
 * `daysToExpiry` plus the `certExpiryWarningDays` threshold from system config --
 * never a hardcoded window (root CLAUDE.md §2.7).
 */
type CertDisplayStatus = 'active' | 'expiring' | 'expired';

function certDisplayStatus(cert: Certification, warningThreshold: number): CertDisplayStatus {
  const warning = evalCertificateWarning(cert.daysToExpiry, warningThreshold);
  if (warning.isExpired) return 'expired';
  if (warning.isWarning) return 'expiring';
  return 'active';
}

const CERT_TONE: Record<
  CertDisplayStatus,
  { bg: string; border: string; fg: string; labelKey: TranslationKey }
> = {
  active: {
    bg: P.certCardBg,
    border: P.sageTintBg,
    fg: colors.brandGreen,
    labelKey: 'farmer.profile.stats.certValid',
  },
  expiring: {
    bg: P.warnCardBg,
    border: P.warnCardBorder,
    fg: P.orange900,
    labelKey: 'farmer.profile.cert.expiring',
  },
  expired: {
    bg: P.red50,
    border: P.orange400,
    fg: P.red800,
    labelKey: 'farmer.certifications.expired',
  },
};

function certTypeKey(certType: Certification['certType']): TranslationKey {
  if (certType === 'PGS') return 'farmer.profile.cert.pgs';
  if (certType === 'NPOP') return 'farmer.profile.cert.npop';
  return 'farmer.certifications.add.type.OTHER';
}

/** The 3 fixed farming-type codes this screen's chip picker offers. */
const FARMING_TYPE_CODES = ['ORGANIC', 'NATURAL', 'BIODYNAMIC'] as const;
type FarmingTypeCode = (typeof FARMING_TYPE_CODES)[number];

function isFarmingTypeCode(value: string): value is FarmingTypeCode {
  return (FARMING_TYPE_CODES as readonly string[]).includes(value);
}

/** Translated label for a farming-type code. An empty/unrecognised value (nothing picked
 * yet -- this field has no backing API read, see `fetchProfile` below) renders as blank
 * rather than a raw code or a missing-key fallback string. */
function farmingTypeLabel(code: string): string {
  return isFarmingTypeCode(code) ? t(`farmer.profile.farmingType.${code}` as TranslationKey) : '';
}

/** Translated label for a farm's `landBoundaryContext` tag code, falling back to the raw
 * code (humanised) for anything outside the 7 known values -- see `loadFarms` below. */
function farmTagLabel(code: string): string {
  switch (code) {
    case 'stand_alone':
      return t('farmer.profile.farm.tag.standAlone');
    case 'lower_hill':
      return t('farmer.profile.farm.tag.lowerHill');
    case 'forest_boundaries':
      return t('farmer.profile.farm.tag.forest');
    case 'upper_hill':
      return t('farmer.profile.farm.tag.upperHill');
    case 'forest_fire':
      return t('farmer.profile.farm.tag.forestFire');
    case 'wildlife_zone':
      return t('farmer.profile.farm.tag.wildlife');
    case 'chemical_sprayed':
      return t('farmer.profile.farm.tag.chemicalSprayed');
    default:
      return code.replace(/_/g, ' ');
  }
}

export function ProfileScreen({
  onNavigateToHome,
  onNavigateToCertifications,
  onNavigateToFMBSketch,
  onNavigateToPersonalDetails,
  onNavigateToAudits,
  onNavigateToFarmRatings,
  onNavigateToSoilTest,
  onNavigateToSettings,
  onNavigateToAboutSupport,
  onNavigateToBankPayment,
  onSignOut,
}: ProfileScreenProps): React.JSX.Element {
  // --- Profile State ---
  const [personalDetails, setPersonalDetails] = useState<PersonalDetailsData>({
    fullName: '',
    dob: '',
    mobile: '',
    aadhaar: '',
    yearsInOrganic: '',
    farmingType: '',
    farmName: '',
    location: '',
  });

  const [farmDetails, setFarmDetails] = useState<FarmDetailsData>({
    acres: '—',
    zones: '—',
    farms: '—',
    fmbPts: '—',
    waterSource: '—',
    tags: [],
  });

  const [farmsList, setFarmsList] = useState<Farm[]>([]);
  const [farmsLoading, setFarmsLoading] = useState<boolean>(true);

  // Real TOHFA farmer id from GET /v1/farmers/me; empty until first fetch.
  const [farmerId, setFarmerId] = useState<string>('');

  // Real certifications: GET /v1/farmers/me/certifications + the expiry-warning
  // threshold from system config. Loaded independently of the profile fetch so a
  // failure on one does not blank the other (same shape as WalletScreen).
  // Starts from the last REAL server answer (empty on first open / after sign-out);
  // the request below always runs and replaces it. A failure is its own state and
  // never touches the rest of the screen.
  const [certs, setCerts] = useState<Certification[]>(() => getCachedCertifications());
  const [certWarningDays, setCertWarningDays] = useState<number>(30);
  const [certsLoading, setCertsLoading] = useState<boolean>(() => getCachedCertifications().length === 0);
  const [certsError, setCertsError] = useState<{ error: unknown } | null>(null);

  // Real farm rating: GET /v1/farmers/me/rating (BR-06), loaded independently
  // of the profile/certs fetches (same shape as those) so a failure here
  // doesn't blank the rest of the screen.
  const [farmRating, setFarmRating] = useState<FarmRating | null>(null);
  const [ratingLoading, setRatingLoading] = useState<boolean>(true);
  const [latestSoilTest, setLatestSoilTest] = useState<SoilTestRecord | null>(null);

  // --- Modal States ---
  const [isEditPersonalModalVisible, setIsEditPersonalModalVisible] = useState(false);
  const [isEditFarmModalVisible, setIsEditFarmModalVisible] = useState(false);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [isDocumentsModalVisible, setIsDocumentsModalVisible] = useState(false);
  const [isBankModalVisible, setIsBankModalVisible] = useState(false);
  const [isAuditsModalVisible, setIsAuditsModalVisible] = useState(false);
  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);
  const [isSoilModalVisible, setIsSoilModalVisible] = useState(false);

  // Form edit temporary states
  const [tempFullName, setTempFullName] = useState(personalDetails.fullName);
  const [tempDob, setTempDob] = useState(personalDetails.dob);
  const [tempYearsInOrganic, setTempYearsInOrganic] = useState('14');
  const [tempFarmingType, setTempFarmingType] = useState(personalDetails.farmingType);
  const [tempFarmName, setTempFarmName] = useState(personalDetails.farmName);
  const [tempLocation, setTempLocation] = useState(personalDetails.location);

  const [tempAcres, setTempAcres] = useState(farmDetails.acres);
  const [tempZones, setTempZones] = useState(farmDetails.zones);
  const [tempWaterSource, setTempWaterSource] = useState(farmDetails.waterSource);

  const [selectedLocale, setSelectedLocale] = useState<Locale>('en');
  const [saving, setSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const loadFarms = useCallback(async () => {
    setFarmsLoading(true);
    try {
      const list = await getFarms();
      setFarmsList(list);
      if (list.length > 0) {
        const primary = list.find((f) => f.isPrimary) ?? list[0]!;

        // Calculate total acres across all farms
        const totalAcres = list.reduce((acc, f) => {
          const a = f.areaAcres ?? f.boundaryAreaAcres ?? 0;
          return acc + a;
        }, 0);

        // Calculate total zones across all farms
        const totalZones = list.reduce((acc, f) => acc + (f.plotCount ?? 0), 0);

        // Count FMB points on primary farm
        const primaryRing = primary.boundary?.coordinates?.[0];
        const fmbPointCount =
          Array.isArray(primaryRing) && primaryRing.length > 0
            ? primaryRing.length > 1 &&
              primaryRing[0] &&
              primaryRing[primaryRing.length - 1] &&
              primaryRing[0][0] === primaryRing[primaryRing.length - 1]![0] &&
              primaryRing[0][1] === primaryRing[primaryRing.length - 1]![1]
              ? primaryRing.length - 1
              : primaryRing.length
            : 0;

        // Extract unique water sources
        const waterSources = Array.from(
          new Set(list.flatMap((f) => f.waterSources || []).filter(Boolean))
        );

        // Context tags: keep the raw codes in state and translate at render time
        // (farmTagLabel) rather than baking an English label in here -- a label
        // computed once at load time would stay frozen in its original language
        // across a later locale switch, since nothing re-runs this load on its own.
        const rawTags = primary.landBoundaryContext || [];

        setFarmDetails({
          acres: totalAcres > 0 ? `${Number(totalAcres.toFixed(2))}` : primary.areaAcres ? `${primary.areaAcres}` : '—',
          zones: `${totalZones}`,
          farms: `${list.length}`,
          fmbPts: fmbPointCount > 0 ? `${fmbPointCount}` : '—',
          waterSource: waterSources.length > 0 ? waterSources.join(', ') : '—',
          tags: rawTags,
        });

        if (primary.name) {
          setPersonalDetails((prev) => ({
            ...prev,
            farmName: prev.farmName || primary.name,
            location:
              prev.location ||
              (primary.village ? `${primary.village}, ${primary.district}` : primary.district),
          }));
        }
      }
    } catch {
      // Fallback gracefully
    } finally {
      setFarmsLoading(false);
    }
  }, []);

  // Attempt to load from API in background, maintaining rich defaults if mock
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await getMyFarmerProfile();
        if (res) {
          if (res.tohfaFarmerId) {
            setFarmerId(res.tohfaFarmerId);
          }
          setPersonalDetails((prev) => ({
            ...prev,
            fullName: res.fullName || prev.fullName,
            mobile: res.mobile ? maskMobile(res.mobile) : prev.mobile,
            aadhaar: res.aadhaarLast4 ? maskAadhaar(res.aadhaarLast4) : prev.aadhaar,
            // `FarmerProfile.dob` was already part of the API response but was never read into
            // this screen's state, so Date of Birth always showed blank regardless of what the
            // backend actually had.
            dob: res.dob
              ? new Date(res.dob).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
              : prev.dob,
            // Stored as the bare number -- the "X years" phrasing is applied at render time
            // (farmer.profile.yearsValue) so it re-renders in whichever locale is live.
            yearsInOrganic: res.farmingExperienceYears
              ? String(res.farmingExperienceYears)
              : prev.yearsInOrganic,
            location: res.address || prev.location,
          }));
          if (res.preferredLocale) {
            setSelectedLocale(res.preferredLocale as Locale);
          }
        }
      } catch {
        // Fallback gracefully to default rich data
      }
    }

    async function fetchSoilTest() {
      try {
        const farms = await getFarms();
        if (farms[0]?.id) {
          const plots = await getPlots(farms[0].id);
          if (plots.length > 0) {
            const perPlot = await Promise.all(
              plots.map((p) => listSoilTests(farms[0]!.id, p.id).catch(() => [])),
            );
            const allTests = perPlot.flat().sort((a, b) => (a.testDate < b.testDate ? 1 : -1));
            if (allTests[0]) {
              setLatestSoilTest(allTests[0]);
            }
          }
        }
      } catch {
        // Fallback gracefully
      }
    }

    void fetchProfile();
    void loadFarms();
    void fetchSoilTest();
  }, [loadFarms]);

  const loadCerts = useCallback(async (signal?: AbortSignal) => {
    setCertsError(null);
    try {
      const [certsRes, configRes] = await Promise.all([
        getMyCertifications(undefined, 100, signal),
        getSystemConfig(),
      ]);
      if (signal?.aborted) return;
      setCerts(certsRes.items);
      setCertWarningDays(configRes.certExpiryWarningDays);
    } catch (error) {
      if (signal?.aborted) return;
      setCertsError({ error });
    } finally {
      if (!signal?.aborted) setCertsLoading(false);
    }
  }, []);

  // Retry outlives the mount effect's controller; unmounting aborts whichever is in flight.
  const certsController = useRef<AbortController | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    certsController.current = controller;
    void loadCerts(controller.signal);
    return () => controller.abort();
  }, [loadCerts]);

  const retryCerts = useCallback(() => {
    certsController.current?.abort();
    const controller = new AbortController();
    certsController.current = controller;
    setCertsLoading(true);
    void loadCerts(controller.signal);
  }, [loadCerts]);

  const loadRating = useCallback(async () => {
    try {
      const res = await getMyFarmRating();
      setFarmRating(res);
    } catch {
      // Leave farmRating null -- deriveFarmRatingView(null) already renders
      // the same "not yet rated" empty state, so no separate error UI is
      // needed for this summary card.
    } finally {
      setRatingLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRating();
  }, [loadRating]);

  const ratingView = deriveFarmRatingView(farmRating);

  const certSummary = certs.map((cert) => ({
    cert,
    status: certDisplayStatus(cert, certWarningDays),
  }));
  const worstCert =
    certSummary.find((c) => c.status === 'expired') ??
    certSummary.find((c) => c.status === 'expiring') ??
    null;
  const certStatTone = worstCert ? CERT_TONE[worstCert.status] : CERT_TONE.active;
  // While loading, or when the list could not be loaded, say nothing rather than
  // claim "no certificate" for a list we never saw.
  const certStatLabel = certsLoading || (certsError !== null && certs.length === 0)
    ? '—'
    : certSummary.length === 0
      ? t('farmer.dashboard.header.certNone')
      : t(certStatTone.labelKey);

  const handleShareProfile = async () => {
    try {
      await Share.share({
        message: `TOHFA Farmer Profile: ${personalDetails.fullName} (${farmerId})\n${personalDetails.farmName}, ${personalDetails.location}\nPGS Certified Organic Producer.`,
      });
    } catch {
      // Ignored
    }
  };

  const openPersonalEdit = () => {
    setTempFullName(personalDetails.fullName);
    setTempDob(personalDetails.dob);
    setTempYearsInOrganic(personalDetails.yearsInOrganic);
    setTempFarmingType(personalDetails.farmingType);
    setTempFarmName(personalDetails.farmName);
    setTempLocation(personalDetails.location);
    setIsEditPersonalModalVisible(true);
  };

  const handleSavePersonalDetails = async () => {
    setSaving(true);
    try {
      const expNumber = parseInt(tempYearsInOrganic, 10) || 0;
      await updateMyFarmerProfile({
        fullName: tempFullName.trim(),
        farmingExperienceYears: expNumber,
        address: tempLocation.trim(),
      }).catch(() => {
        // Backend unavailable — local update only
      });

      setPersonalDetails({
        ...personalDetails,
        fullName: tempFullName.trim(),
        dob: tempDob.trim(),
        yearsInOrganic: expNumber > 0 ? String(expNumber) : '',
        farmingType: tempFarmingType,
        farmName: tempFarmName.trim(),
        location: tempLocation.trim(),
      });

      setIsEditPersonalModalVisible(false);
      setSaveSuccessMsg(t('farmer.profile.personal.saved'));
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const primaryFarm = farmsList.find((f) => f.isPrimary) ?? farmsList[0] ?? null;
  const primaryRing = (primaryFarm?.boundary?.coordinates?.[0] as [number, number][] | undefined) ?? [];
  const hasBoundary = Array.isArray(primaryRing) && primaryRing.length >= 3;

  // Camera center + boundary for the Farm & FMB preview map, derived exactly as FMBSketchScreen's
  // `mapInitialCenter`/`mapInitialPolygon` are: the saved ring's OWN centroid first (the stored
  // centroidLat/Lng can drift from a boundary redrawn later), then the stored centroid, then nothing.
  const previewRingMetrics = hasBoundary ? calculatePolygonMetrics(primaryRing) : null;
  const previewCenter: [number, number] | null = previewRingMetrics
    ? [previewRingMetrics.centroid.longitude, previewRingMetrics.centroid.latitude]
    : primaryFarm?.centroidLng != null && primaryFarm?.centroidLat != null
      ? [primaryFarm.centroidLng, primaryFarm.centroidLat]
      : null;
  const previewPolygon: [number, number][] | null = hasBoundary ? primaryRing : null;

  // GPS badge text -- unchanged from the static-image preview this map replaced: the stored
  // centroid, falling back to the boundary's bounding-box midpoint.
  let gpsStatusLabel = t('farmer.profile.farm.gpsPending');
  if (hasBoundary) {
    const lngs = primaryRing.map((pt) => pt[0]);
    const lats = primaryRing.map((pt) => pt[1]);
    const cLat = primaryFarm?.centroidLat ?? (Math.min(...lats) + Math.max(...lats)) / 2;
    const cLng = primaryFarm?.centroidLng ?? (Math.min(...lngs) + Math.max(...lngs)) / 2;
    gpsStatusLabel = `${cLat.toFixed(4)}° N, ${cLng.toFixed(4)}° E`;
  } else if (primaryFarm?.centroidLat && primaryFarm?.centroidLng) {
    gpsStatusLabel = `${primaryFarm.centroidLat.toFixed(4)}° N, ${primaryFarm.centroidLng.toFixed(4)}° E`;
  }

  const openFarmEdit = () => {
    if (onNavigateToFMBSketch) {
      onNavigateToFMBSketch();
    } else {
      setTempAcres(farmDetails.acres === '—' ? '' : farmDetails.acres);
      setTempZones(farmDetails.zones === '—' ? '' : farmDetails.zones);
      setTempWaterSource(farmDetails.waterSource === '—' ? '' : farmDetails.waterSource);
      setIsEditFarmModalVisible(true);
    }
  };

  const handleSaveFarmDetails = async () => {
    setSaving(true);
    try {
      const acresNum = parseFloat(tempAcres);
      const waterList = tempWaterSource
        ? tempWaterSource
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;

      if (primaryFarm?.id) {
        await updateFarm(primaryFarm.id, {
          areaAcres: isNaN(acresNum) ? undefined : acresNum,
          waterSources: waterList,
        }).catch(() => {});
      }

      setFarmDetails((prev) => ({
        ...prev,
        acres: tempAcres.trim() || prev.acres,
        zones: tempZones.trim() || prev.zones,
        waterSource: tempWaterSource.trim() || prev.waterSource,
      }));
      setIsEditFarmModalVisible(false);
      setSaveSuccessMsg(t('farmer.profile.farm.saved'));
      setTimeout(() => setSaveSuccessMsg(null), 3000);
      void loadFarms();
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={P.deepGreen} />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ================= HEADER SECTION ================= */}
        <View style={styles.headerBanner}>
          {/* Top Bar Navigation */}
          <View style={styles.headerNavRow}>
            <TouchableOpacity
              style={styles.navCircleButton}
              onPress={onNavigateToHome}
              accessibilityLabel={t('farmer.profile.a11y.back')}
              activeOpacity={0.7}
            >
              <Icon name="arrow_back" size={26} color={colors.white} style={styles.navBackIcon} />
            </TouchableOpacity>

            <Text style={styles.navTitle}>{t('farmer.profile.title')}</Text>

            <View style={styles.navRightActions}>
              <TouchableOpacity
                style={styles.navCircleButton}
                onPress={handleShareProfile}
                accessibilityLabel={t('farmer.profile.a11y.share')}
                activeOpacity={0.7}
              >
                <Icon name="share" size={16} color={colors.white} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navCircleButton}
                onPress={() => {
                  if (onNavigateToSettings) {
                    onNavigateToSettings();
                  } else {
                    setIsSettingsModalVisible(true);
                  }
                }}
                accessibilityLabel={t('farmer.profile.menu.settings')}
                activeOpacity={0.7}
              >
                <Icon name="settings" size={16} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Farmer Avatar & Basic Info */}
          <View style={styles.profileHero}>
            <View style={styles.avatarContainer}>
              <Image
                source={farmerAvatar}
                style={styles.avatarImage}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.avatarEditBadge}
                onPress={() => (onNavigateToPersonalDetails ? onNavigateToPersonalDetails() : openPersonalEdit())}
                activeOpacity={0.8}
                accessibilityLabel={t('farmer.profile.a11y.editPhoto')}
              >
                <Icon name="edit" size={14} color={colors.brandGreen} />
              </TouchableOpacity>
            </View>

            <Text style={styles.farmerName}>{personalDetails.fullName}</Text>

            <View style={styles.idBadgePill}>
              <Text style={styles.idBadgeText}>{farmerId}</Text>
            </View>

            <Text style={styles.farmNameText}>{personalDetails.farmName}</Text>
            <View style={styles.iconTextRow}>
              <Icon name="place" size={12} color={P.green100} />
              <Text style={styles.locationText}>{personalDetails.location}</Text>
            </View>
          </View>

          {/* 4 Quick Stat Cards Overlapping Header */}
          <View style={styles.quickStatsRow}>
            <TouchableOpacity
              style={styles.quickStatCard}
              onPress={() => onNavigateToCertifications?.()}
              activeOpacity={0.8}
            >
              <Icon name="shield" size={18} color={certStatTone.fg} style={styles.statEmoji} />
              <Text style={[styles.statValue, { color: certStatTone.fg }]}>{certStatLabel}</Text>
              <Text style={styles.statLabel}>{t('farmer.profile.stats.cert')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickStatCard}
              onPress={() => (onNavigateToFarmRatings ? onNavigateToFarmRatings() : setIsRatingModalVisible(true))}
              activeOpacity={0.8}
            >
              <Icon name="star" size={18} color={P.deepGreen} style={styles.statEmoji} />
              <Text style={[styles.statValue, { color: P.deepGreen }]}>
                {ratingLoading
                  ? '—'
                  : ratingView.isRated
                    ? String(ratingView.overallRating)
                    : t('farmer.profile.rating.notRatedShort')}
              </Text>
              <Text style={styles.statLabel}>{t('farmer.profile.stats.rating')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickStatCard}
              onPress={() => setIsAuditsModalVisible(true)}
              activeOpacity={0.8}
            >
              <Icon name="calendar_today" size={18} color={P.orange900} style={styles.statEmoji} />
              <Text style={[styles.statValue, { color: P.orange900 }]}>{t('farmer.profile.daysShort', { days: 12 })}</Text>
              <Text style={styles.statLabel}>{t('farmer.profile.stats.audit')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickStatCard}
              onPress={openFarmEdit}
              activeOpacity={0.8}
            >
              <Icon name="eco" size={18} color={P.deepGreen} style={styles.statEmoji} />
              <Text style={[styles.statValue, { color: P.deepGreen }]}>{farmDetails.acres}</Text>
              <Text style={styles.statLabel}>{t('farmer.profile.stats.acres')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Success Toast */}
        {saveSuccessMsg ? (
          <View style={[styles.toastSuccess, styles.toastSuccessRow]}>
            <Icon name="check_circle" size={14} color={P.deepGreen} />
            <Text style={styles.toastSuccessText}>{saveSuccessMsg}</Text>
          </View>
        ) : null}

        {/* ================= CARD 1: PERSONAL DETAILS ================= */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconBox, { backgroundColor: P.violetTint }]}>
              <Icon name="person" size={18} color={P.violetAccent} />
            </View>
            <View style={styles.cardHeaderTitleBox}>
              <Text style={styles.cardTitle}>{t('farmer.profile.personal.title')}</Text>
              <Text style={styles.cardSubtitle}>{t('farmer.profile.personal.subtitle')}</Text>
            </View>
            <TouchableOpacity onPress={() => (onNavigateToPersonalDetails ? onNavigateToPersonalDetails() : openPersonalEdit())} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.cardActionLink}>{t('farmer.common.edit')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('farmer.profile.fullName')}</Text>
            <Text style={styles.detailValue}>{personalDetails.fullName}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('farmer.profile.dob')}</Text>
            <Text style={styles.detailValue}>{personalDetails.dob}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('farmer.profile.mobile')}</Text>
            <Text style={styles.detailValue}>{personalDetails.mobile}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('farmer.profile.aadhaar')}</Text>
            <Text style={styles.detailValue}>{personalDetails.aadhaar}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('farmer.profile.yearsInOrganic')}</Text>
            <Text style={styles.detailValue}>
              {personalDetails.yearsInOrganic ? t('farmer.profile.yearsValue', { years: personalDetails.yearsInOrganic }) : ''}
            </Text>
          </View>

          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.detailLabel}>{t('farmer.profile.farmingType')}</Text>
            <View style={styles.iconTextRow}>
              <Icon name="eco" size={13} color={colors.brandGreen} />
              <Text style={[styles.detailValue, { color: colors.brandGreen }]}>
                {farmingTypeLabel(personalDetails.farmingType)}
              </Text>
            </View>
          </View>
        </View>

        {/* ================= CARD 2: FARM & FMB ================= */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconBox, { backgroundColor: colors.brandGreenLight }]}>
              <Icon name="shield" size={18} color={colors.brandGreen} />
            </View>
            <View style={styles.cardHeaderTitleBox}>
              <Text style={styles.cardTitle}>{t('farmer.profile.farm.title')}</Text>
              <Text style={styles.cardSubtitle}>{t('farmer.profile.farm.subtitle')}</Text>
            </View>
            <TouchableOpacity onPress={openFarmEdit} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.cardActionLink}>{t('farmer.common.edit')}</Text>
            </TouchableOpacity>
          </View>

          {/* FMB Map Preview — the same Mapbox FarmBoundaryMap as FMB Sketch, read-only. The whole
              preview is one tap target into FMB Sketch. The map's own gestures are off and its
              wrapper is `pointerEvents="none"`, so a swipe that starts on it scrolls this page
              and a tap lands on the TouchableOpacity rather than inside the native map. */}
          <TouchableOpacity
            style={styles.fmbMapContainer}
            onPress={openFarmEdit}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.profile.farm.a11y.openMap')}
            testID="profile-fmb-map-preview"
          >
            {farmsLoading ? (
              <Skeleton borderRadius={0} style={styles.fmbMapSkeleton} />
            ) : previewCenter ? (
              <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                <FarmBoundaryMap
                  // FarmBoundaryMap reads initialCenter/initialPolygon only at mount, so remount
                  // whenever the farm or its saved boundary changes (e.g. after an FMB Sketch save).
                  key={`${primaryFarm?.id ?? 'none'}:${primaryFarm?.boundaryVersion ?? 0}:${primaryFarm?.updatedAt ?? ''}`}
                  initialCenter={previewCenter}
                  initialPolygon={previewPolygon}
                  // A farm with only a stored centroid has no shape to draw; pin the point instead.
                  markerCoordinate={previewPolygon ? null : previewCenter}
                  onPolygonChange={noopPolygonChange}
                  readOnly
                  gesturesEnabled={false}
                  // Two levels below FarmBoundaryMap's own default (17, tuned for a full-screen
                  // editor) -- this card is only ~135px tall, and at 17 a farm of a few acres runs
                  // off the top/bottom edge instead of showing the whole shape with some margin.
                  initialZoom={15}
                  searchPlaceholder={t('farmer.map.searchPlaceholder')}
                  testID="profile-fmb-map"
                />
              </View>
            ) : (
              <View style={styles.fmbMapEmpty}>
                <Icon name="place" size={22} color={P.slate400} />
                <Text style={styles.fmbMapEmptyText}>{t('farmer.profile.farm.mapEmpty')}</Text>
              </View>
            )}

            {/* GPS Tag */}
            {!farmsLoading ? (
              <View style={styles.gpsCoordinatesBadge} pointerEvents="none">
                <Text style={styles.gpsCoordinatesText}>{gpsStatusLabel}</Text>
              </View>
            ) : null}
          </TouchableOpacity>

          {/* 4 Metrics Strip */}
          <View style={styles.fmbMetricsStrip}>
            <View style={styles.fmbMetricItem}>
              <Text style={styles.fmbMetricValue}>{farmsLoading ? '—' : farmDetails.acres}</Text>
              <Text style={styles.fmbMetricLabel}>{t('farmer.profile.stats.acres')}</Text>
            </View>
            <View style={styles.fmbMetricDivider} />
            <View style={styles.fmbMetricItem}>
              <Text style={styles.fmbMetricValue}>{farmsLoading ? '—' : farmDetails.zones}</Text>
              <Text style={styles.fmbMetricLabel}>{t('farmer.profile.farm.metric.zones')}</Text>
            </View>
            <View style={styles.fmbMetricDivider} />
            <View style={styles.fmbMetricItem}>
              <Text style={styles.fmbMetricValue}>{farmsLoading ? '—' : farmDetails.farms}</Text>
              <Text style={styles.fmbMetricLabel}>{t('farmer.profile.farm.metric.farms')}</Text>
            </View>
            <View style={styles.fmbMetricDivider} />
            <View style={styles.fmbMetricItem}>
              <Text style={styles.fmbMetricValue}>{farmsLoading ? '—' : farmDetails.fmbPts}</Text>
              <Text style={styles.fmbMetricLabel}>{t('farmer.profile.farm.metric.fmbPts')}</Text>
            </View>
          </View>

          {/* Water Source Row */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('farmer.profile.farm.waterSource')}</Text>
            <Text style={styles.detailValue}>{farmsLoading ? '—' : farmDetails.waterSource}</Text>
          </View>

          {/* Land Context Pills — only shown once tags are available */}
          {farmDetails.tags.length > 0 && (
            <View style={styles.tagPillContainer}>
              {farmDetails.tags.map((tag, i) => (
                <View key={i} style={[styles.tagPill, styles.iconTextRow, { backgroundColor: colors.brandGreenLight }]}>
                  <Icon name="park" size={11} color={colors.brandGreen} />
                  <Text style={[styles.tagPillText, { color: colors.brandGreen }]}>{farmTagLabel(tag)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ================= CARD 3: CERTIFICATIONS ================= */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconBox, { backgroundColor: P.blue50 }]}>
              <Icon name="military_tech" size={18} color={P.blue700} />
            </View>
            <View style={styles.cardHeaderTitleBox}>
              <Text style={styles.cardTitle}>{t('farmer.dashboard.search.certifications.title')}</Text>
              <Text style={styles.cardSubtitle}>{t('farmer.profile.cert.subtitle')}</Text>
            </View>
            <TouchableOpacity
              onPress={() => onNavigateToCertifications?.()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.cardActionLink}>{t('farmer.common.manage')}</Text>
            </TouchableOpacity>
          </View>

          {/* Real certification summary -- GET /v1/farmers/me/certifications via
              getMyCertifications(), with expiry derived by the shared
              evalCertificateWarning helper (BR-01/BR-02). */}
          {certsLoading ? (
            <View style={styles.certCardsRow}>
              <Skeleton height={112} width="48%" style={styles.certSkeleton} />
              <Skeleton height={112} width="48%" style={styles.certSkeleton} />
            </View>
          ) : certsError ? (
            <ErrorState
              error={certsError.error}
              message={t('farmer.certifications.loadError')}
              retryTitle={t('farmer.common.retry')}
              offlineMessage={t('farmer.common.offline')}
              onRetry={retryCerts}
            />
          ) : certSummary.length === 0 ? (
            <Text style={styles.certNoticeText}>{t('farmer.certifications.empty')}</Text>
          ) : (
            <View style={styles.certCardsRow}>
              {certSummary.slice(0, 2).map(({ cert, status }) => {
                const tone = CERT_TONE[status];
                return (
                  <TouchableOpacity
                    key={cert.id}
                    style={[
                      styles.certSubCard,
                      { backgroundColor: tone.bg, borderColor: tone.border },
                    ]}
                    onPress={() => onNavigateToCertifications?.()}
                    activeOpacity={0.8}
                  >
                    <View style={styles.certCardTop}>
                      <Icon
                        name={cert.certType === 'PGS' ? 'eco' : 'storefront'}
                        size={22}
                        color={tone.fg}
                      />
                      {status === 'active' ? (
                        <View style={styles.greenCheckmarkCircle}>
                          <Icon name="check" size={11} color={colors.white} />
                        </View>
                      ) : (
                        <View style={styles.orangeExclamationCircle}>
                          <Text style={styles.orangeExclamationText}>!</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.certTitle}>{certificationDisplayName(cert, t)}</Text>
                    <Text style={[styles.certStatusText, { color: tone.fg }]}>
                      {t(tone.labelKey)}
                    </Text>
                    <Text style={styles.certRenewText}>
                      {status === 'expired'
                        ? t('farmer.certifications.overdueBy', {
                            days: Math.abs(cert.daysToExpiry),
                          })
                        : t('farmer.profile.cert.renewsIn', { days: cert.daysToExpiry })}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Shown only when a real certificate is actually expiring or expired. */}
          {worstCert ? (
            <View style={styles.warningNoticeBox}>
              <Icon name="warning" size={16} color={P.amberDeep} />
              <Text style={styles.warningNoticeText}>
                {worstCert.status === 'expired'
                  ? t('farmer.profile.cert.expiredNotice', { type: certificationDisplayName(worstCert.cert, t) })
                  : t('farmer.profile.cert.expiringNotice', { type: certificationDisplayName(worstCert.cert, t) })}
              </Text>
            </View>
          ) : null}
        </View>

        {/* MOCK: no audits resource exists in apps/api or docs/openapi.yaml. */}
        {/* ================= CARD 4: AUDITS ================= */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconBox, { backgroundColor: P.lightBlue50 }]}>
              <Icon name="assignment" size={18} color={P.lightBlue700} />
            </View>
            <View style={styles.cardHeaderTitleBox}>
              <Text style={styles.cardTitle}>{t('farmer.profile.audits.title')}</Text>
              <Text style={styles.cardSubtitle}>{t('farmer.profile.audits.subtitle')}</Text>
            </View>
            <TouchableOpacity onPress={() => setIsAuditsModalVisible(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.cardActionLink}>{t('farmer.common.viewAll')}</Text>
            </TouchableOpacity>
          </View>

          {/* Next Audit Banner */}
          <View style={styles.nextAuditBanner}>
            <View style={styles.auditProgressSquare}>
              <Text style={styles.auditProgressFraction}>{t('farmer.profile.audits.scoreOutOf', { score: 3, max: 4 })}</Text>
              <Text style={styles.auditProgressDone}>{t('farmer.profile.audits.done')}</Text>
            </View>
            <View style={styles.nextAuditDetails}>
              <Text style={styles.nextAuditSubLabel}>{t('farmer.profile.audits.nextAudit')}</Text>
              <Text style={styles.nextAuditDateText}>May 26, 2026 · {t('farmer.profile.audits.external')}</Text>
            </View>
            <View style={styles.auditDueRedPill}>
              <Text style={styles.auditDueRedText}>{t('farmer.profile.daysShort', { days: 12 })}</Text>
            </View>
          </View>

          {/* Past Audits List */}
          <View style={styles.auditList}>
            <View style={styles.auditItemRow}>
              <View style={[styles.statusDot, { backgroundColor: colors.brandGreen }]} />
              <View style={styles.auditItemInfo}>
                <Text style={styles.auditItemDate}>Apr 20, 2026 · {t('farmer.profile.audits.external')}</Text>
                <Text style={styles.auditItemSubtext}>
                  {t('farmer.profile.audits.findings', { major: 0, minor: 1, outcome: t('farmer.profile.audits.passed') })}
                </Text>
              </View>
              <Text style={[styles.auditScore, { color: colors.brandGreen }]}>{t('farmer.profile.audits.scoreOutOf', { score: 88, max: 100 })}</Text>
            </View>

            <View style={styles.auditItemRow}>
              <View style={[styles.statusDot, { backgroundColor: P.orange800 }]} />
              <View style={styles.auditItemInfo}>
                <Text style={styles.auditItemDate}>Jan 18, 2026 · {t('farmer.profile.audits.internal')}</Text>
                <Text style={styles.auditItemSubtext}>
                  {t('farmer.profile.audits.findings', { major: 0, minor: 3, outcome: t('farmer.profile.audits.passedWithIssues') })}
                </Text>
              </View>
              <Text style={[styles.auditScore, { color: P.orange800 }]}>{t('farmer.profile.audits.scoreOutOf', { score: 74, max: 100 })}</Text>
            </View>

            <View style={[styles.auditItemRow, { borderBottomWidth: 0 }]}>
              <View style={[styles.statusDot, { backgroundColor: colors.brandGreen }]} />
              <View style={styles.auditItemInfo}>
                <Text style={styles.auditItemDate}>Oct 12, 2025 · {t('farmer.profile.audits.external')}</Text>
                <Text style={styles.auditItemSubtext}>
                  {t('farmer.profile.audits.findings', { major: 0, minor: 0, outcome: t('farmer.profile.audits.passed') })}
                </Text>
              </View>
              <Text style={[styles.auditScore, { color: colors.brandGreen }]}>{t('farmer.profile.audits.scoreOutOf', { score: 91, max: 100 })}</Text>
            </View>
          </View>
        </View>

        {/* ================= CARD 5: FARM RATING ================= */}
        {/* Real data: GET /v1/farmers/me/rating (BR-06) via getMyFarmRating(),
            shaped for display by the shared deriveFarmRatingView(). Shows the
            first 5 of the 10 canonical categories inline; "Details" opens the
            full FarmRatingsScreen breakdown, matching this card's existing
            space constraints. */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconBox, { backgroundColor: colors.brandGreenLight }]}>
              <Icon name="star" size={18} color={colors.brandGreen} />
            </View>
            <View style={styles.cardHeaderTitleBox}>
              <Text style={styles.cardTitle}>{t('farmer.profile.rating.title')}</Text>
              <Text style={styles.cardSubtitle}>{t('farmer.profile.rating.subtitle')}</Text>
            </View>
            <TouchableOpacity onPress={() => (onNavigateToFarmRatings ? onNavigateToFarmRatings() : setIsRatingModalVisible(true))} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.cardActionLink}>{t('farmer.common.details')}</Text>
            </TouchableOpacity>
          </View>

          {/* Rating Circle and Status */}
          <View style={styles.ratingHeroRow}>
            <View style={styles.ratingGaugeContainer}>
              <Svg width="86" height="86" viewBox="0 0 100 100">
                <Circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke={ratingView.isRated ? colors.brandGreenLight : P.slate200}
                  strokeWidth="8"
                  fill="none"
                />
                <Circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke={ratingView.isRated ? colors.brandGreen : P.slate300}
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={2 * Math.PI * 40}
                  strokeDashoffset={
                    2 * Math.PI * 40 * (1 - (ratingView.isRated ? (ratingView.overallRating as number) / 100 : 0))
                  }
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </Svg>
              <View style={styles.ratingGaugeCenterText}>
                <Text style={styles.ratingGaugeScore}>{ratingView.isRated ? ratingView.overallRating : '—'}</Text>
                <Text style={styles.ratingGaugeMax}>/100</Text>
              </View>
            </View>

            <View style={styles.ratingStatusDetails}>
              <Text style={styles.ratingStatusTitle}>
                {ratingLoading
                  ? '—'
                  : ratingView.isRated && ratingView.tierLabelKey
                    ? t(ratingView.tierLabelKey as TranslationKey)
                    : t('farmer.profile.rating.notRatedTitle')}
              </Text>
            </View>
          </View>

          {/* Rating Category Progress Bars -- first 5 of the 10 canonical
              categories, each with its own "not yet rated" state when the
              server hasn't scored it yet. */}
          <View style={styles.ratingBarsList}>
            {ratingView.modules.slice(0, 5).map((mod) => {
              const barColor =
                mod.score === null
                  ? P.slate300
                  : mod.score >= 8
                    ? colors.brandGreen
                    : mod.score >= 6
                      ? P.green700
                      : mod.score >= 4
                        ? P.orange700
                        : P.red600;
              return (
                <View key={mod.categoryCode} style={styles.barItem}>
                  <View style={styles.barHeader}>
                    <Text style={styles.barTitle}>{t(mod.nameKey as TranslationKey)}</Text>
                    <Text style={[styles.barScore, { color: barColor }]}>
                      {mod.isRated
                        ? t('farmer.profile.rating.score', { score: mod.score ?? 0 })
                        : t('farmer.profile.rating.notRatedShort')}
                    </Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${(mod.score ?? 0) * 10}%`, backgroundColor: barColor },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* ================= CARD 6: SOIL TEST ================= */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconBox, { backgroundColor: P.amber50 }]}>
              <Icon name="science" size={18} color={P.yellow900} />
            </View>
            <View style={styles.cardHeaderTitleBox}>
              <Text style={styles.cardTitle}>{t('farmer.profile.soil.title')}</Text>
              <Text style={styles.cardSubtitle}>{t('farmer.profile.soil.subtitle')}</Text>
            </View>
            <TouchableOpacity onPress={() => (onNavigateToSoilTest ? onNavigateToSoilTest() : setIsSoilModalVisible(true))} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.cardActionLink}>{t('farmer.common.history')}</Text>
            </TouchableOpacity>
          </View>

          {/* Test Dates Strip */}
          <View style={styles.soilDateStrip}>
            <View>
              <Text style={styles.soilDateLabel}>{t('farmer.profile.soil.lastTested')}</Text>
              <Text style={styles.soilDateValue}>
                {latestSoilTest?.testDate
                  ? new Date(latestSoilTest.testDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                  : '08 Jan 2026'}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.soilDateLabel}>{t('farmer.profile.soil.nextDue')}</Text>
              <Text style={styles.soilDateValue}>
                {latestSoilTest?.nextDueDate
                  ? new Date(latestSoilTest.nextDueDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
                  : 'Jan 2027'}
              </Text>
            </View>
          </View>

          {/* 4 Soil Metric Tiles (2x2) */}
          <View style={styles.soilGridContainer}>
            <View style={styles.soilGridTile}>
              <Text style={styles.soilTileLabel}>{t('farmer.profile.soil.organicCarbon')}</Text>
              <Text style={styles.soilTileValue}>
                {latestSoilTest?.organicCarbonPct != null ? `${latestSoilTest.organicCarbonPct}%` : '0.68%'}
              </Text>
              <View style={[styles.soilBadge, { backgroundColor: colors.brandGreenLight }]}>
                <Text style={[styles.soilBadgeText, { color: colors.brandGreen }]}>
                  {latestSoilTest?.organicCarbonLabel || t('farmer.profile.soil.good')}
                </Text>
              </View>
            </View>

            <View style={styles.soilGridTile}>
              <Text style={styles.soilTileLabel}>{t('farmer.profile.soil.ph')}</Text>
              <Text style={styles.soilTileValue}>
                {latestSoilTest?.ph != null ? String(latestSoilTest.ph) : '5.6'}
              </Text>
              <View style={[styles.soilBadge, { backgroundColor: (latestSoilTest?.ph ?? 5.6) < 6.0 ? P.red50 : colors.brandGreenLight }]}>
                <Text style={[styles.soilBadgeText, { color: (latestSoilTest?.ph ?? 5.6) < 6.0 ? P.red800 : colors.brandGreen }]}>
                  {latestSoilTest?.phLabel || t('farmer.profile.soil.acidic')}
                </Text>
              </View>
            </View>

            <View style={styles.soilGridTile}>
              <Text style={styles.soilTileLabel}>{t('farmer.profile.soil.ec')}</Text>
              <Text style={styles.soilTileValue}>
                {latestSoilTest?.ecDsPerM != null ? String(latestSoilTest.ecDsPerM) : '0.42'}
              </Text>
              <View style={[styles.soilBadge, { backgroundColor: colors.brandGreenLight }]}>
                <Text style={[styles.soilBadgeText, { color: colors.brandGreen }]}>
                  {latestSoilTest?.ecLabel || t('farmer.profile.soil.good')}
                </Text>
              </View>
            </View>

            <View style={styles.soilGridTile}>
              <Text style={styles.soilTileLabel}>{t('farmer.profile.soil.tds')}</Text>
              <Text style={styles.soilTileValue}>
                {latestSoilTest?.tdsPpm != null ? String(latestSoilTest.tdsPpm) : '610'}
              </Text>
              <View style={[styles.soilBadge, { backgroundColor: P.orange50 }]}>
                <Text style={[styles.soilBadgeText, { color: P.orange900 }]}>
                  {latestSoilTest?.tdsLabel || t('farmer.profile.soil.high')}
                </Text>
              </View>
            </View>
          </View>

          {/* Soil Advisory Recommendation */}
          <View style={styles.soilAdvisoryBox}>
            <Icon name="warning" size={16} color={P.red800} />
            <Text style={styles.soilAdvisoryText}>
              {(latestSoilTest?.ph ?? 5.6) < 6.0
                ? t('farmer.profile.soil.advisory')
                : (latestSoilTest?.ph ?? 5.6) > 7.5
                  ? t('farmer.profile.soil.advisoryAlkaline')
                  : t('farmer.profile.soil.advisoryOptimal')}
            </Text>
          </View>
        </View>

        {/* ================= CARD 7: MENU / ACTION LIST ================= */}
        <View style={[styles.cardContainer, { paddingVertical: 6 }]}>
          <TouchableOpacity
            style={styles.menuItemRow}
            onPress={() => {
              if (onNavigateToBankPayment) {
                onNavigateToBankPayment();
              } else {
                setIsBankModalVisible(true);
              }
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconBox, { backgroundColor: colors.brandGreenLight }]}>
              <Icon name="credit_card" size={18} color={colors.brandGreen} />
            </View>
            <View style={styles.menuTitleBox}>
              <Text style={styles.menuTitle}>{t('farmer.profile.menu.bank')}</Text>
              <Text style={styles.menuSubtitle}>{t('farmer.profile.menu.bankSubtitle')}</Text>
            </View>
            <Icon name="chevron_right" size={18} color={P.slate400} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItemRow}
            onPress={() => {
              if (onNavigateToAboutSupport) {
                onNavigateToAboutSupport();
              } else {
                Alert.alert(
                  t('farmer.profile.help.title'),
                  t('farmer.profile.help.body'),
                  [{ text: t('farmer.common.ok') }]
                );
              }
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconBox, { backgroundColor: P.twOrange50 }]}>
              <Icon name="help" size={18} color={P.twOrange600} />
            </View>
            <View style={styles.menuTitleBox}>
              <Text style={styles.menuTitle}>{t('farmer.profile.menu.help')}</Text>
              <Text style={styles.menuSubtitle}>{t('farmer.profile.menu.helpSubtitle')}</Text>
            </View>
            <Icon name="chevron_right" size={18} color={P.slate400} />
          </TouchableOpacity>
        </View>

        {/* Standalone Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => {
            Alert.alert(t('farmer.profile.logout.button'), t('farmer.profile.settings.signOutConfirmMessage'), [
              { text: t('farmer.common.cancel'), style: 'cancel' },
              {
                text: t('farmer.profile.logout.button'),
                style: 'destructive',
                onPress: () => {
                  void (async () => {
                    await logout();
                    onSignOut?.();
                  })();
                },
              },
            ]);
          }}
          activeOpacity={0.8}
        >
          <SignOutIcon size={18} color={P.red600} />
          <Text style={styles.logoutButtonText}>{t('farmer.profile.logout.button')}</Text>
        </TouchableOpacity>

        {/* Footer Info */}
        <View style={styles.footerVersionBox}>
          <Text style={styles.footerVersionText}>{t('farmer.profile.footer.version')}</Text>
          <Text style={styles.footerMemberText}>{t('farmer.profile.footer.memberSince', { date: 'March 2024' })}</Text>
        </View>
      </ScrollView>

      {/* ================= MODAL: EDIT PERSONAL DETAILS ================= */}
      <Modal
        visible={isEditPersonalModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditPersonalModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('farmer.profile.personal.editTitle')}</Text>
              <TouchableOpacity onPress={() => setIsEditPersonalModalVisible(false)}>
                <Icon name="close" size={18} color={P.slate400} style={styles.modalCloseText} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
              <Text style={styles.inputLabel}>{t('farmer.profile.fullName')}</Text>
              <TextInput
                style={styles.textInput}
                value={tempFullName}
                onChangeText={setTempFullName}
                placeholder={t('farmer.profile.fullName')}
              />

              <Text style={styles.inputLabel}>{t('farmer.profile.dob')}</Text>
              <TextInput
                style={styles.textInput}
                value={tempDob}
                onChangeText={setTempDob}
                placeholder={t('farmer.profile.dobPlaceholder')}
              />

              <Text style={styles.inputLabel}>{t('farmer.profile.yearsInOrganicLabel')}</Text>
              <TextInput
                style={styles.textInput}
                value={tempYearsInOrganic}
                onChangeText={setTempYearsInOrganic}
                keyboardType="numeric"
                placeholder={t('farmer.profile.yearsPlaceholder')}
              />

              <Text style={styles.inputLabel}>{t('farmer.profile.farmingType')}</Text>
              <View style={styles.chipsRow}>
                {FARMING_TYPE_CODES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.choiceChip,
                      tempFarmingType === type && styles.choiceChipActive,
                    ]}
                    onPress={() => setTempFarmingType(type)}
                  >
                    <Text
                      style={[
                        styles.choiceChipText,
                        tempFarmingType === type && styles.choiceChipTextActive,
                      ]}
                    >
                      {farmingTypeLabel(type)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>{t('farmer.profile.farmName')}</Text>
              <TextInput
                style={styles.textInput}
                value={tempFarmName}
                onChangeText={setTempFarmName}
                placeholder={t('farmer.profile.farmName')}
              />

              <Text style={styles.inputLabel}>{t('farmer.profile.farmLocation')}</Text>
              <TextInput
                style={styles.textInput}
                value={tempLocation}
                onChangeText={setTempLocation}
                placeholder={t('farmer.profile.farmLocationPlaceholder')}
              />

              <View style={styles.lockedSection}>
                <View style={[styles.iconTextRow, { marginBottom: 4 }]}>
                  <Icon name="lock" size={12} color={P.slate800} />
                  <Text style={[styles.lockedSectionTitle, { marginBottom: 0 }]}>{t('farmer.profile.kycLockedTitle')}</Text>
                </View>
                <Text style={styles.lockedSectionSubtitle}>
                  {t('farmer.profile.kycLockedNote', { mobile: personalDetails.mobile, aadhaar: personalDetails.aadhaar })}
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsEditPersonalModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>{t('farmer.common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSavePersonalDetails}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>
                  {saving ? t('farmer.farmDiary.newEntry.step3.saving') : t('farmer.profile.save')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL: EDIT FARM & FMB ================= */}
      <Modal
        visible={isEditFarmModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditFarmModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('farmer.profile.farm.editTitle')}</Text>
              <TouchableOpacity onPress={() => setIsEditFarmModalVisible(false)}>
                <Icon name="close" size={18} color={P.slate400} style={styles.modalCloseText} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
              <Text style={styles.inputLabel}>{t('farmer.profile.farm.acresLabel')}</Text>
              <TextInput
                style={styles.textInput}
                value={tempAcres}
                onChangeText={setTempAcres}
                keyboardType="decimal-pad"
                placeholder={t('farmer.profile.farm.acresPlaceholder')}
              />

              <Text style={styles.inputLabel}>{t('farmer.profile.farm.zonesLabel')}</Text>
              <TextInput
                style={styles.textInput}
                value={tempZones}
                onChangeText={setTempZones}
                keyboardType="numeric"
                placeholder={t('farmer.profile.farm.zonesPlaceholder')}
              />

              <Text style={styles.inputLabel}>{t('farmer.profile.farm.waterSource')}</Text>
              <TextInput
                style={styles.textInput}
                value={tempWaterSource}
                onChangeText={setTempWaterSource}
                placeholder={t('farmer.profile.farm.waterSourcePlaceholder')}
              />

              <View style={styles.lockedSection}>
                <View style={[styles.iconTextRow, { marginBottom: 4 }]}>
                  <Icon name="place" size={12} color={P.slate800} />
                  <Text style={[styles.lockedSectionTitle, { marginBottom: 0 }]}>{t('farmer.profile.farm.fmbTitle')}</Text>
                </View>
                <Text style={styles.lockedSectionSubtitle}>
                  {hasBoundary
                    ? t('farmer.profile.farm.fmbNote', { points: farmDetails.fmbPts, coordinates: gpsStatusLabel })
                    : t('farmer.profile.farm.fmbPendingNote')}
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsEditFarmModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>{t('farmer.common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveFarmDetails}>
                <Text style={styles.saveBtnText}>{t('farmer.common.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MOCK: farmer documents (docType/fileUrl) are only reachable via GET /v1/admin/farmer-applications/:id, permission farmer.application.view, which docs/rbac.json grants FARMER: none. There is no farmer-facing "my documents" GET. */}
      {/* ================= MODAL: MY DOCUMENTS ================= */}
      <Modal
        visible={isDocumentsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsDocumentsModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('farmer.profile.menu.documents')}</Text>
              <TouchableOpacity onPress={() => setIsDocumentsModalVisible(false)}>
                <Icon name="close" size={18} color={P.slate400} style={styles.modalCloseText} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
              <View style={styles.docItemCard}>
                <Icon name="badge" size={24} color={P.slate600} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.docTitle}>{t('farmer.profile.documents.aadhaar')}</Text>
                  <View style={[styles.iconTextRow, { marginTop: 2 }]}>
                    <Icon name="check_circle" size={11} color={colors.brandGreen} />
                    <Text style={[styles.docStatusGreen, { marginTop: 0 }]}>{t('farmer.certifications.status.VERIFIED')}</Text>
                  </View>
                </View>
                <Text style={styles.docActionText}>{t('farmer.common.view')}</Text>
              </View>

              <View style={styles.docItemCard}>
                <Icon name="description" size={24} color={P.slate600} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.docTitle}>{t('farmer.profile.documents.patta')}</Text>
                  <View style={[styles.iconTextRow, { marginTop: 2 }]}>
                    <Icon name="check_circle" size={11} color={colors.brandGreen} />
                    <Text style={[styles.docStatusGreen, { marginTop: 0 }]}>{t('farmer.certifications.status.VERIFIED')}</Text>
                  </View>
                </View>
                <Text style={styles.docActionText}>{t('farmer.common.view')}</Text>
              </View>

              <View style={styles.docItemCard}>
                <Icon name="military_tech" size={24} color={P.blue700} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.docTitle}>{t('farmer.profile.documents.pgsCert')}</Text>
                  <View style={[styles.iconTextRow, { marginTop: 2 }]}>
                    <Icon name="check_circle" size={11} color={colors.brandGreen} />
                    <Text style={[styles.docStatusGreen, { marginTop: 0 }]}>{t('farmer.profile.stats.certValid')}</Text>
                  </View>
                </View>
                <Text style={styles.docActionText}>{t('farmer.common.download')}</Text>
              </View>

              <View style={[styles.docItemCard, { borderColor: P.orange400, backgroundColor: P.alertBgCream }]}>
                <Icon name="water_drop" size={24} color={P.lightBlue700} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.docTitle}>{t('farmer.profile.documents.soilCard')}</Text>
                  <View style={[styles.iconTextRow, { marginTop: 2 }]}>
                    <Icon name="warning" size={11} color={P.orange900} />
                    <Text style={[styles.docStatusGreen, { color: P.orange900, marginTop: 0 }]}>{t('farmer.profile.documents.actionNeeded')}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.docUploadBtn}>
                  <Text style={styles.docUploadBtnText}>{t('farmer.common.upload')}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.saveBtn, { width: '100%' }]}
                onPress={() => setIsDocumentsModalVisible(false)}
              >
                <Text style={styles.saveBtnText}>{t('farmer.common.done')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MOCK: farmer_bank_accounts (db/migrations/0007) has no route, service or repo anywhere in apps/api, no path in docs/openapi.yaml, and FARMER holds "none" on payout.dues.view / payout.farmer.initiate / payout.approve_above_10k in docs/rbac.json. */}
      {/* ================= MODAL: BANK & PAYMENTS ================= */}
      <Modal
        visible={isBankModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsBankModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('farmer.profile.bank.title')}</Text>
              <TouchableOpacity onPress={() => setIsBankModalVisible(false)}>
                <Icon name="close" size={18} color={P.slate400} style={styles.modalCloseText} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.bankCardPreview}>
                <Text style={styles.bankName}>State Bank of India</Text>
                <Text style={styles.bankBranch}>Ooty Main Branch</Text>
                <Text style={styles.bankAccountNum}>•••• •••• •••• 5821</Text>
                <View style={styles.bankFooterRow}>
                  <Text style={styles.bankIfsc}>{t('farmer.profile.bank.ifsc', { code: 'SBIN0000843' })}</Text>
                  <Text style={styles.bankHolder}>Kumar</Text>
                </View>
              </View>

              <View style={[styles.detailRow, { marginTop: 16 }]}>
                <Text style={styles.detailLabel}>{t('farmer.profile.bank.upi')}</Text>
                <Text style={styles.detailValue}>kumar.farmer@sbi</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t('farmer.profile.bank.schedule')}</Text>
                <Text style={[styles.detailValue, { color: colors.brandGreen }]}>{t('farmer.profile.bank.scheduleValue')}</Text>
              </View>
              <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.detailLabel}>{t('farmer.profile.bank.lastPayout')}</Text>
                <Text style={styles.detailValue}>
                  {t('farmer.profile.bank.lastPayoutValue', { amount: '₹18,400', date: '02 Sep 2026' })}
                </Text>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.saveBtn, { width: '100%' }]}
                onPress={() => setIsBankModalVisible(false)}
              >
                <Text style={styles.saveBtnText}>{t('farmer.common.close')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL: SETTINGS ================= */}
      <Modal
        visible={isSettingsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsSettingsModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('farmer.profile.menu.settings')}</Text>
              <TouchableOpacity onPress={() => setIsSettingsModalVisible(false)}>
                <Icon name="close" size={18} color={P.slate400} style={styles.modalCloseText} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>{t('farmer.profile.settings.language')}</Text>
              <View style={styles.chipsRow}>
                {LOCALES.map((code) => (
                  <TouchableOpacity
                    key={code}
                    style={[
                      styles.choiceChip,
                      selectedLocale === code && styles.choiceChipActive,
                    ]}
                    onPress={() => {
                      setSelectedLocale(code);
                      setLocale(code);
                    }}
                  >
                    <Text
                      style={[
                        styles.choiceChipText,
                        selectedLocale === code && styles.choiceChipTextActive,
                      ]}
                    >
                      {code === 'ta' ? t('farmer.profile.settings.langTa') : t('farmer.profile.settings.langEn')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={[styles.detailRow, { marginTop: 20 }]}>
                <Text style={styles.detailLabel}>{t('farmer.profile.settings.smsAlerts')}</Text>
                <View style={styles.iconTextRow}>
                  <Text style={[styles.detailValue, { color: colors.brandGreen }]}>{t('farmer.common.enabled')}</Text>
                  <Icon name="check_circle" size={13} color={colors.brandGreen} />
                </View>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t('farmer.profile.settings.geofence')}</Text>
                <View style={styles.iconTextRow}>
                  <Text style={[styles.detailValue, { color: colors.brandGreen }]}>{t('farmer.common.enabled')}</Text>
                  <Icon name="check_circle" size={13} color={colors.brandGreen} />
                </View>
              </View>
              <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.detailLabel}>{t('farmer.profile.settings.appVersion')}</Text>
                <Text style={styles.detailValue}>v0.1.0 (Production)</Text>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.saveBtn, { width: '100%' }]}
                onPress={() => setIsSettingsModalVisible(false)}
              >
                <Text style={styles.saveBtnText}>{t('farmer.common.done')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL: AUDITS ================= */}
      <Modal
        visible={isAuditsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAuditsModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('farmer.profile.audits.modalTitle')}</Text>
              <TouchableOpacity onPress={() => setIsAuditsModalVisible(false)}>
                <Icon name="close" size={18} color={P.slate400} style={styles.modalCloseText} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
              <View style={styles.auditItemRow}>
                <View style={[styles.statusDot, { backgroundColor: colors.brandGreen }]} />
                <View style={styles.auditItemInfo}>
                  <Text style={styles.auditItemDate}>Apr 20, 2026 · {t('farmer.profile.audits.externalCertification')}</Text>
                  <Text style={styles.auditItemSubtext}>
                    {t('farmer.profile.audits.auditor', { name: 'Dr. S. Ramanathan' })} · {t('farmer.profile.audits.majorMinorCount', { major: 0, minor: 1 })}
                  </Text>
                </View>
                <Text style={[styles.auditScore, { color: colors.brandGreen }]}>{t('farmer.profile.audits.scoreOutOf', { score: 88, max: 100 })}</Text>
              </View>

              <View style={styles.auditItemRow}>
                <View style={[styles.statusDot, { backgroundColor: P.orange800 }]} />
                <View style={styles.auditItemInfo}>
                  <Text style={styles.auditItemDate}>Jan 18, 2026 · {t('farmer.profile.audits.internalPeer')}</Text>
                  <Text style={styles.auditItemSubtext}>
                    {t('farmer.profile.audits.auditor', { name: 'Nilgiris Organic Local Group' })}
                  </Text>
                </View>
                <Text style={[styles.auditScore, { color: P.orange800 }]}>{t('farmer.profile.audits.scoreOutOf', { score: 74, max: 100 })}</Text>
              </View>

              <View style={styles.auditItemRow}>
                <View style={[styles.statusDot, { backgroundColor: colors.brandGreen }]} />
                <View style={styles.auditItemInfo}>
                  <Text style={styles.auditItemDate}>Oct 12, 2025 · {t('farmer.profile.audits.annualNpop')}</Text>
                  <Text style={styles.auditItemSubtext}>
                    Indocert Inspection Agency · {t('farmer.profile.audits.findingsCount', { count: 0 })}
                  </Text>
                </View>
                <Text style={[styles.auditScore, { color: colors.brandGreen }]}>{t('farmer.profile.audits.scoreOutOf', { score: 91, max: 100 })}</Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.saveBtn, { width: '100%' }]}
                onPress={() => {
                  setIsAuditsModalVisible(false);
                  onNavigateToAudits?.();
                }}
              >
                <Text style={styles.saveBtnText}>{t('farmer.profile.audits.viewDetails')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL: FARM RATING ================= */}
      <Modal
        visible={isRatingModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsRatingModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('farmer.profile.rating.modalTitle')}</Text>
              <TouchableOpacity onPress={() => setIsRatingModalVisible(false)}>
                <Icon name="close" size={18} color={P.slate400} style={styles.modalCloseText} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
              <Text style={{ fontSize: typography.body, color: P.slate500, marginBottom: 14 }}>
                {t('farmer.profile.rating.intro')}
              </Text>

              {!ratingView.isRated ? (
                <Text style={styles.certNoticeText}>{t('farmer.profile.rating.notRatedBody')}</Text>
              ) : null}

              {ratingView.modules.map((mod) => {
                const barColor =
                  mod.score === null
                    ? P.slate300
                    : mod.score >= 8
                      ? colors.brandGreen
                      : mod.score >= 6
                        ? P.green700
                        : mod.score >= 4
                          ? P.orange700
                          : P.red600;
                return (
                  <View key={mod.categoryCode} style={styles.barItem}>
                    <View style={styles.barHeader}>
                      <Text style={styles.barTitle}>{t(mod.nameKey as TranslationKey)}</Text>
                      <Text style={[styles.barScore, { color: barColor }]}>
                        {mod.isRated
                          ? t('farmer.profile.rating.score', { score: mod.score ?? 0 })
                          : t('farmer.profile.rating.notRatedShort')}
                      </Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          { width: `${(mod.score ?? 0) * 10}%`, backgroundColor: barColor },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.saveBtn, { width: '100%' }]}
                onPress={() => setIsRatingModalVisible(false)}
              >
                <Text style={styles.saveBtnText}>{t('farmer.common.close')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL: SOIL TEST ================= */}
      <Modal
        visible={isSoilModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsSoilModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('farmer.profile.soil.modalTitle')}</Text>
              <TouchableOpacity onPress={() => setIsSoilModalVisible(false)}>
                <Icon name="close" size={18} color={P.slate400} style={styles.modalCloseText} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
              <View style={styles.soilDateStrip}>
                <View>
                  <Text style={styles.soilDateLabel}>{t('farmer.profile.soil.sampleId')}</Text>
                  <Text style={styles.soilDateValue}>SHC-2026-0814</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.soilDateLabel}>{t('farmer.profile.soil.lab')}</Text>
                  <Text style={styles.soilDateValue}>TNAU Ooty Research Lab</Text>
                </View>
              </View>

              <View style={styles.soilGridContainer}>
                <View style={styles.soilGridTile}>
                  <Text style={styles.soilTileLabel}>{t('farmer.profile.soil.organicCarbon')}</Text>
                  <Text style={styles.soilTileValue}>0.68%</Text>
                  <Text style={{ fontSize: typography.caption, color: colors.brandGreen, marginTop: 4 }}>{t('farmer.profile.soil.note.organicCarbon')}</Text>
                </View>

                <View style={styles.soilGridTile}>
                  <Text style={styles.soilTileLabel}>{t('farmer.profile.soil.ph')}</Text>
                  <Text style={styles.soilTileValue}>5.6</Text>
                  <Text style={{ fontSize: typography.caption, color: P.red800, marginTop: 4 }}>{t('farmer.profile.soil.note.ph')}</Text>
                </View>

                <View style={styles.soilGridTile}>
                  <Text style={styles.soilTileLabel}>{t('farmer.profile.soil.ec')}</Text>
                  <Text style={styles.soilTileValue}>0.42</Text>
                  <Text style={{ fontSize: typography.caption, color: colors.brandGreen, marginTop: 4 }}>{t('farmer.profile.soil.note.ec')}</Text>
                </View>

                <View style={styles.soilGridTile}>
                  <Text style={styles.soilTileLabel}>{t('farmer.profile.soil.tds')}</Text>
                  <Text style={styles.soilTileValue}>610 ppm</Text>
                  <Text style={{ fontSize: typography.caption, color: P.orange900, marginTop: 4 }}>{t('farmer.profile.soil.note.tds')}</Text>
                </View>
              </View>

              <View style={styles.soilAdvisoryBox}>
                <Icon name="lightbulb" size={16} color={P.red800} />
                <Text style={styles.soilAdvisoryText}>
                  {t('farmer.profile.soil.recommendation')}
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.saveBtn, { width: '100%' }]}
                onPress={() => setIsSoilModalVisible(false)}
              >
                <Text style={styles.saveBtnText}>{t('farmer.common.close')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: P.paleSurface,
  },
  scrollContainer: {
    paddingBottom: 12,
  },

  // --- HEADER SECTION ---
  headerBanner: {
    backgroundColor: P.deepGreen,
    paddingTop: 12,
    paddingBottom: 28,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  navCircleButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBackIcon: {
    marginTop: -2,
  },
  navTitle: {
    color: colors.white,
    fontSize: typography.title,
    fontWeight: '700',
  },
  navRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  profileHero: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginTop: 4,
    marginBottom: 8,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: colors.white,
    backgroundColor: P.slate200,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: colors.white,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  farmerName: {
    color: colors.white,
    fontSize: typography.title,
    fontWeight: '700',
    marginBottom: 6,
  },
  idBadgePill: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 14,
    marginBottom: 8,
  },
  idBadgeText: {
    color: P.greenPaleBg,
    fontSize: typography.caption,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  farmNameText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: '500',
    marginBottom: 3,
  },
  locationText: {
    color: P.green100,
    fontSize: typography.bodySmall,
    fontWeight: '400',
  },

  // Shared row layout for an Icon placed immediately before/after a text label.
  iconTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  // --- QUICK STATS ROW ---
  quickStatsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 20,
    gap: 8,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statEmoji: {
    marginBottom: 2,
  },
  statValue: {
    fontSize: typography.body,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: P.slate400,
    letterSpacing: 0.5,
  },

  toastSuccess: {
    backgroundColor: colors.brandGreenLight,
    borderWidth: 1,
    borderColor: P.green200,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
  },
  toastSuccessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  toastSuccessText: {
    color: P.deepGreen,
    fontSize: typography.body,
    fontWeight: '600',
    textAlign: 'center',
  },

  // --- CARDS ---
  cardContainer: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    padding: 16,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: P.slate100,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardHeaderTitleBox: {
    flex: 1,
  },
  cardTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.slate800,
  },
  cardSubtitle: {
    fontSize: typography.bodySmall,
    color: P.slate500,
    marginTop: 1,
  },
  cardActionLink: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.brandGreen,
  },

  // Details row
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: P.slate100,
  },
  detailLabel: {
    fontSize: typography.body,
    color: P.slate500,
  },
  detailValue: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.slate800,
    textAlign: 'right',
  },

  // --- FMB MAP PREVIEW ---
  fmbMapContainer: {
    height: 135,
    backgroundColor: P.certCardBg,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginVertical: 10,
    borderWidth: 1,
    borderColor: P.slate200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fmbMapSkeleton: {
    ...StyleSheet.absoluteFillObject,
    height: '100%',
  },
  fmbMapEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  fmbMapEmptyText: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: P.slate500,
    textAlign: 'center',
  },
  gpsCoordinatesBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  gpsCoordinatesText: {
    color: colors.white,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  fmbMetricsStrip: {
    flexDirection: 'row',
    backgroundColor: P.certCardBgAlt,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'space-around',
    marginVertical: 8,
  },
  fmbMetricItem: {
    alignItems: 'center',
    flex: 1,
  },
  fmbMetricValue: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.slate800,
  },
  fmbMetricLabel: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: P.slate400,
    marginTop: 2,
  },
  fmbMetricDivider: {
    width: 1,
    height: 18,
    backgroundColor: P.slate200,
  },
  tagPillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  tagPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  tagPillText: {
    fontSize: typography.caption,
    fontWeight: '600',
  },

  // --- CERTIFICATIONS ---
  certCardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 6,
  },
  certSubCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  certCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  greenCheckmarkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.brandGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greenCheckmarkText: {
    color: colors.white,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  orangeExclamationCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: P.orange900,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orangeExclamationText: {
    color: colors.white,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  certTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.slate800,
  },
  certStatusText: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    marginTop: 2,
  },
  certRenewText: {
    fontSize: typography.caption,
    color: P.slate400,
    marginTop: 2,
  },
  certSkeleton: {
    borderRadius: 14,
  },
  certNoticeText: {
    fontSize: typography.body,
    color: P.slate500,
    lineHeight: 19,
  },
  warningNoticeBox: {
    backgroundColor: P.amber50,
    borderColor: P.amber200,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  warningNoticeText: {
    fontSize: typography.caption,
    color: P.amberDeep,
    flex: 1,
    lineHeight: 16,
  },

  // --- AUDITS ---
  nextAuditBanner: {
    backgroundColor: P.paleBlueBg,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  auditProgressSquare: {
    backgroundColor: colors.white,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
    marginRight: 10,
  },
  auditProgressFraction: {
    fontSize: typography.body,
    fontWeight: '800',
    color: P.sky600,
  },
  auditProgressDone: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: P.slate500,
  },
  nextAuditDetails: {
    flex: 1,
  },
  nextAuditSubLabel: {
    fontSize: typography.caption,
    color: P.slate500,
  },
  nextAuditDateText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.slate800,
    marginTop: 1,
  },
  auditDueRedPill: {
    backgroundColor: P.deepOrange600,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  auditDueRedText: {
    color: colors.white,
    fontSize: typography.caption,
    fontWeight: '800',
  },
  auditList: {
    marginTop: 4,
  },
  auditItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: P.slate100,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  auditItemInfo: {
    flex: 1,
  },
  auditItemDate: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.slate800,
  },
  auditItemSubtext: {
    fontSize: typography.caption,
    color: P.slate400,
    marginTop: 2,
  },
  auditScore: {
    fontSize: typography.body,
    fontWeight: '700',
  },

  // --- FARM RATING ---
  ratingHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  ratingGaugeContainer: {
    width: 86,
    height: 86,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  ratingGaugeCenterText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingGaugeScore: {
    fontSize: typography.title,
    fontWeight: '800',
    color: P.slate800,
  },
  ratingGaugeMax: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: P.slate400,
  },
  ratingStatusDetails: {
    flex: 1,
  },
  ratingStatusTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: P.deepGreen,
  },
  ratingDeltaPill: {
    backgroundColor: colors.brandGreenLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  ratingDeltaText: {
    color: colors.brandGreen,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  ratingBarsList: {
    marginTop: 6,
    gap: 10,
  },
  barItem: {
    marginBottom: 4,
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  barTitle: {
    fontSize: typography.bodySmall,
    fontWeight: '500',
    color: P.slate600,
  },
  barScore: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
  },
  barTrack: {
    height: 6,
    backgroundColor: P.slate100,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },

  // --- SOIL TEST ---
  soilDateStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: P.paleAmberBg2,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  soilDateLabel: {
    fontSize: typography.caption,
    color: P.twAmber900,
  },
  soilDateValue: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.twAmber900,
    marginTop: 1,
  },
  soilGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  soilGridTile: {
    width: '48%',
    backgroundColor: P.certCardBgAlt,
    borderRadius: 10,
    padding: 10,
  },
  soilTileLabel: {
    fontSize: typography.caption,
    color: P.slate500,
    marginBottom: 2,
  },
  soilTileValue: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.slate800,
    marginBottom: 4,
  },
  soilBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  soilBadgeText: {
    fontSize: typography.caption,
    fontWeight: '700',
  },
  soilAdvisoryBox: {
    backgroundColor: P.red50,
    borderColor: P.red100,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  soilAdvisoryText: {
    fontSize: typography.caption,
    color: P.red800,
    flex: 1,
    lineHeight: 16,
  },

  // --- MENU / ACTION LIST ---
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuTitleBox: {
    flex: 1,
  },
  menuTitle: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.slate800,
  },
  menuSubtitle: {
    fontSize: typography.caption,
    color: P.slate400,
    marginTop: 1,
  },
  menuRedBadge: {
    backgroundColor: P.twRed500,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  menuRedBadgeText: {
    color: colors.white,
    fontSize: typography.caption,
    fontWeight: '800',
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: P.slate100,
    marginLeft: 54,
  },

  // --- STANDALONE LOGOUT & FOOTER ---
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: P.twRed100,
    borderRadius: 16,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  logoutButtonText: {
    color: P.twRed500,
    fontSize: typography.bodyLarge,
    fontWeight: '700',
  },
  footerVersionBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    marginBottom: 4,
  },
  footerVersionText: {
    fontSize: typography.bodySmall,
    color: P.twGray400,
    marginBottom: 4,
    fontWeight: '500',
  },
  footerMemberText: {
    fontSize: typography.bodySmall,
    color: P.twGray400,
    fontWeight: '500',
  },

  // --- MODALS ---
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: P.slate100,
  },
  modalTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: P.slate800,
  },
  modalCloseText: {
    padding: 4,
  },
  modalBody: {
    marginVertical: 14,
  },
  inputLabel: {
    fontSize: typography.bodySmall,
    fontWeight: '600',
    color: P.slate600,
    marginBottom: 6,
    marginTop: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: P.slate300,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: typography.body,
    color: P.slate800,
    backgroundColor: P.slate50,
    marginBottom: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  choiceChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.slate300,
    backgroundColor: colors.white,
  },
  choiceChipActive: {
    backgroundColor: P.deepGreen,
    borderColor: P.deepGreen,
  },
  choiceChipText: {
    fontSize: typography.body,
    color: P.slate600,
    fontWeight: '500',
  },
  choiceChipTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  lockedSection: {
    backgroundColor: P.slate50,
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: P.slate200,
  },
  lockedSectionTitle: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.slate800,
    marginBottom: 4,
  },
  lockedSectionSubtitle: {
    fontSize: typography.caption,
    color: P.slate500,
    lineHeight: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: P.slate100,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: P.slate300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.slate500,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: P.deepGreen,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.white,
  },

  // Document modal items
  docItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.slate200,
    backgroundColor: colors.white,
    marginBottom: 10,
    gap: 12,
  },
  docTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.slate800,
  },
  docStatusGreen: {
    fontSize: typography.caption,
    color: colors.brandGreen,
    fontWeight: '600',
    marginTop: 2,
  },
  docActionText: {
    fontSize: typography.bodySmall,
    fontWeight: '600',
    color: P.sky600,
  },
  docUploadBtn: {
    backgroundColor: P.orange900,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  docUploadBtnText: {
    color: colors.white,
    fontSize: typography.caption,
    fontWeight: '700',
  },

  // Bank preview card
  bankCardPreview: {
    backgroundColor: P.successDark,
    borderRadius: 14,
    padding: 16,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  bankName: {
    color: colors.white,
    fontSize: typography.bodyLarge,
    fontWeight: '700',
  },
  bankBranch: {
    color: P.green100,
    fontSize: typography.caption,
    marginTop: 2,
  },
  bankAccountNum: {
    color: colors.white,
    fontSize: typography.title,
    fontWeight: '700',
    letterSpacing: 2,
    marginVertical: 16,
  },
  bankFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bankIfsc: {
    color: P.green100,
    fontSize: typography.caption,
  },
  bankHolder: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: '700',
  },
});
