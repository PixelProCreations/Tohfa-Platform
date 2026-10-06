import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import {
  deriveFarmRatingView,
  evalMarketBlock,
  getMyFarmerProfile,
  getMyFarmRating,
  getSystemConfig,
  listAllMyCertifications,
  type Certification,
  type FarmerProfile,
  type FarmRating,
} from '../../api/farmer';
import { getFarmWeather, type FarmWeather } from '../../api/weather';
import { getMyListings, type Listing } from '../../api/listings';
import { listNotifications } from '../../api/notifications';
import { listMyAudits, shortMonthKey, type FarmerAuditSummary } from '../../api/audits';
import { listAllActiveFarmCrops, type ActiveFarmCropsResult } from '../../api/crops';
import { ErrorState, Icon, Skeleton } from '@tohfa/mobile-ui';
import { t, type TranslationKey } from '../../../../i18n/farmer';

import { authPalette as P, colors, typography } from '../../theme';
import farmerAvatar from '../../assets/farmer-kumar.jpg';
import { getGreetingKey } from '../../utils/greeting';
import { cropPhotoFor } from '../listings/cropImages';
import type { CropItem } from '../farm/crops/ProduceCalendarScreen';
import { toActiveCropData } from './ActiveCropsScreen';
import {
  auditCountdown,
  cropCardView,
  DASHBOARD_CROP_PREVIEW_LIMIT,
  selectCropPreview,
  selectNextAudit,
  soonestPendingCounterOffers,
  summarizeCertifications,
  UPCOMING_AUDIT_STATUSES,
  type AuditCountdown,
  type CertSummary,
  type CropCardView,
  type WidgetState,
} from './dashboardWidgets';

/** Audits fetched for the mini-card: one page, soonest first (BR-03a allows one per quarter). */
const UPCOMING_AUDITS_PAGE_SIZE = 100; // LimitParam maximum in docs/openapi.yaml

function auditMiniValue(countdown: AuditCountdown): string {
  switch (countdown.kind) {
    case 'none':
      return t('farmer.dashboard.header.auditNone');
    case 'inProgress':
      return t('farmer.audits.status.inProgress');
    case 'today':
      return t('farmer.dashboard.header.auditToday');
    case 'tomorrow':
      return t('farmer.dashboard.header.auditTomorrow');
    case 'inDays':
      return t('farmer.dashboard.header.auditDue', { days: countdown.days });
    case 'past':
      return t('farmer.dashboard.header.auditDate', {
        day: countdown.day,
        month: t(shortMonthKey(countdown.monthIndex) as TranslationKey),
      });
    case 'unknown':
      return '—';
  }
}

function certMiniValue(summary: CertSummary): string {
  switch (summary.kind) {
    case 'none':
      return t('farmer.dashboard.header.certNone');
    case 'valid':
      return t('farmer.dashboard.header.certValid');
    case 'expiring':
      return t('farmer.dashboard.header.certExpiring');
    case 'pending':
      return t('farmer.dashboard.header.certPending');
    case 'expired':
      return t('farmer.dashboard.header.certExpired');
    case 'rejected':
      return t('farmer.certifications.status.REJECTED');
  }
}

function certGridSubtitle(summary: CertSummary): string {
  switch (summary.kind) {
    case 'none':
      return t('farmer.dashboard.menu.profileSubtitleNone');
    case 'valid':
    case 'expiring':
      if (summary.days === 0) return t('farmer.dashboard.menu.certificationsRenewalToday');
      if (summary.days === 1) return t('farmer.dashboard.menu.certificationsRenewalTomorrow');
      return t('farmer.dashboard.menu.profileSubtitle', { days: summary.days });
    case 'pending':
      return t('farmer.certifications.status.UNVERIFIED');
    case 'expired':
      return t('farmer.dashboard.menu.certificationsExpired');
    case 'rejected':
      return t('farmer.certifications.status.REJECTED');
  }
}

function cropCountSubtitle(total: number, totalIsExact: boolean): string {
  if (total === 0) return t('farmer.dashboard.menu.cropCountNone');
  if (!totalIsExact) return t('farmer.dashboard.menu.cropCountPartial', { count: total });
  if (total === 1) return t('farmer.dashboard.menu.cropCountOne');
  return t('farmer.dashboard.menu.cropCount', { count: total });
}

/** Same wording ActiveCropsScreen uses for a crop's harvest status. */
function cropHarvestText(view: CropCardView): string {
  if (view.daysToHarvest === null) {
    return t(
      view.status === 'PLANNED'
        ? 'farmer.crops.activeCrops.statusPlanned'
        : 'farmer.crops.activeCrops.statusGrowingNoDate',
    );
  }
  if (view.daysToHarvest < 0) {
    return t('farmer.crops.activeCrops.statusOverdue', { days: Math.abs(view.daysToHarvest) });
  }
  return t('farmer.crops.activeCrops.statusHarvestIn', { days: view.daysToHarvest });
}

// Splits a trailing "(...)" suffix off a display name, e.g. seed/demo accounts
// labeled "Suresh Gowda (Expiring Soon)" for QA identification -- a real
// farmer's name never has one, so this renders as a single Text with no
// suffix in that case.
function splitNameSuffix(fullName: string): { base: string; suffix: string | null } {
  const match = fullName.match(/^(.*\S)\s+(\([^)]*\))\s*$/);
  return match ? { base: match[1]!, suffix: match[2]! } : { base: fullName, suffix: null };
}

function HeaderSearchIcon({ size = 19, color = colors.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2.2" />
      <Path d="M20 20L16.2 16.2" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function HeaderBellIcon({ size = 19, color = colors.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13.73 21a2 2 0 0 1-3.46 0"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

interface DashboardScreenProps {
  onNavigateToListings?: () => void;
  onNavigateToCreateListing?: () => void;
  onNavigateToWallet?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToCertifications?: () => void;
  onNavigateToNotifications?: () => void;
  onNavigateToFarmManagement?: () => void;
  onNavigateToCropManagement?: () => void;
  onNavigateToWeather?: () => void;
  onNavigateToActiveCrops?: () => void;
  onNavigateToFarmDiary?: () => void;
  onNavigateToMyListings?: () => void;
  onNavigateToAttendance?: () => void;
  onNavigateToTohfaCalendar?: () => void;
  onNavigateToLearningHub?: () => void;
  onNavigateToProduceCalendar?: () => void;
  /** Same payload ActiveCropsScreen hands CropDetailScreen, which re-fetches the crop by its real id. */
  onNavigateToCropDetail?: (crop: CropItem) => void;
  onNavigateToCounterOffer?: (listing?: Listing) => void;
  onNavigateToInventory?: () => void;
  onNavigateToAudits?: () => void;
}

export function DashboardScreen({
  onNavigateToListings,
  onNavigateToCreateListing,
  onNavigateToWallet: _onNavigateToWallet,
  onNavigateToProfile,
  onNavigateToCertifications,
  onNavigateToNotifications,
  onNavigateToCounterOffer,
  onNavigateToFarmManagement,
  onNavigateToCropManagement,
  onNavigateToWeather,
  onNavigateToActiveCrops,
  onNavigateToFarmDiary,
  onNavigateToMyListings,
  onNavigateToAttendance,
  onNavigateToTohfaCalendar,
  onNavigateToLearningHub,
  onNavigateToProduceCalendar,
  onNavigateToCropDetail,
  onNavigateToInventory,
  onNavigateToAudits,
}: DashboardScreenProps): React.JSX.Element {
  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [farmRating, setFarmRating] = useState<FarmRating | null>(null);
  // Listings the server has already marked COUNTER_OFFERED. The list response
  // carries the listing's `activeCounterOffer` inline, so the dashboard alert
  // needs no second round-trip -- same call ListingsScreen makes.
  const [counterOfferListings, setCounterOfferListings] = useState<Listing[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState<number>(0);
  const [warningThreshold, setWarningThreshold] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const searchItems = useMemo(() => [
    {
      id: 'produce-calendar',
      title: 'Produce Calendar',
      subtitle: '3 crops actively growing · Harvest schedules & due actions',
      category: 'Feature',
      icon: 'calendar-today',
      iconBg: P.twEmerald100,
      iconColor: P.twGreen800,
      keywords: ['produce calendar', 'calendar', 'produce', 'harvest', 'crops', 'carrot', 'tomato', 'cabbage', 'vegetables'],
      action: () => {
        setShowSearch(false);
        if (onNavigateToProduceCalendar) {
          onNavigateToProduceCalendar();
        } else {
          onNavigateToFarmManagement?.();
        }
      },
    },
    {
      id: 'crops',
      title: 'Crop Management',
      subtitle: 'Manage active crops, fields, and zones',
      category: 'Feature',
      icon: 'eco',
      iconBg: P.paleMintBg,
      iconColor: colors.brandGreen,
      keywords: ['crops', 'crop management', 'plants', 'farming', 'zones', 'vegetables', 'yield'],
      action: () => {
        setShowSearch(false);
        onNavigateToFarmManagement?.();
      },
    },
    {
      id: 'crop-tomato',
      title: 'Tomato (Zone A)',
      subtitle: '62 days old · Harvest in 8 days',
      category: 'Crop',
      icon: 'agriculture',
      iconBg: P.palePeachBg,
      iconColor: P.deepOrange600,
      keywords: ['tomato', 'tomatoes', 'zone a', 'harvest', 'active crop', 'vegetables'],
      action: () => {
        setShowSearch(false);
        (onNavigateToActiveCrops ?? onNavigateToFarmManagement)?.();
      },
    },
    {
      id: 'crop-carrot',
      title: 'Carrot (Zone B)',
      subtitle: '34 days old · Harvest in 41 days',
      category: 'Crop',
      icon: 'agriculture',
      iconBg: P.paleCreamBg,
      iconColor: P.orange700,
      keywords: ['carrot', 'carrots', 'zone b', 'harvest', 'active crop', 'vegetables'],
      action: () => {
        setShowSearch(false);
        (onNavigateToActiveCrops ?? onNavigateToFarmManagement)?.();
      },
    },
    {
      id: 'certifications',
      title: 'Certifications',
      subtitle: 'Organic certification, standards, and renewal status',
      category: 'Feature',
      icon: 'shield',
      iconBg: P.paleLavenderBg,
      iconColor: P.green700,
      keywords: ['cert', 'certifications', 'organic', 'certificate', 'compliance', 'standards', 'renewal', 'valid'],
      action: () => {
        setShowSearch(false);
        onNavigateToCertifications?.();
      },
    },
    {
      id: 'weather',
      title: 'Weather & Forecast',
      subtitle: 'Ooty, Nilgiris · 7-day rain, humidity, temperature',
      category: 'Feature',
      icon: 'wb_sunny',
      iconBg: P.amber50,
      iconColor: P.orange500,
      keywords: ['weather', 'forecast', 'rain', 'humidity', 'climate', 'sun', 'temperature', 'ooty', 'nilgiris'],
      action: () => {
        setShowSearch(false);
        onNavigateToWeather?.();
      },
    },
    {
      id: 'listings',
      title: 'Market & Produce Listings',
      subtitle: 'Browse your listings, buyer bids, and pending counter-offers',
      category: 'Feature',
      icon: 'shopping_cart',
      iconBg: P.palePeachBg,
      iconColor: P.deepOrange600,
      keywords: ['market', 'listings', 'produce', 'counter-offer', 'sell', 'orders', 'buyers', 'price', 'rates'],
      action: () => {
        setShowSearch(false);
        onNavigateToListings?.();
      },
    },
    {
      id: 'create-listing',
      title: 'List Produce for Sale',
      subtitle: 'Post harvested tomatoes, carrots, or vegetables to buyers',
      category: 'Action',
      icon: 'assignment',
      iconBg: P.green100,
      iconColor: colors.brandGreen,
      keywords: ['create listing', 'list produce', 'sell', 'add produce', 'post produce', 'offer'],
      action: () => {
        setShowSearch(false);
        onNavigateToCreateListing?.();
      },
    },
    {
      id: 'farm-diary',
      title: 'Log Farm Diary',
      subtitle: 'Record daily irrigation, fertilization, pesticide, or harvest activities',
      category: 'Action',
      icon: 'edit_note',
      iconBg: P.paleMintBg,
      iconColor: colors.brandGreen,
      keywords: ['diary', 'log diary', 'farm diary', 'entry', 'irrigation', 'fertilizer', 'spray', 'activities', 'notes'],
      action: () => {
        setShowSearch(false);
        onNavigateToFarmManagement?.();
      },
    },
    {
      id: 'notifications',
      title: 'Notifications & Alerts',
      subtitle: 'Counter-offers, certificate alerts, and market updates',
      category: 'Feature',
      icon: 'notifications',
      iconBg: P.palePinkBg,
      iconColor: P.red600,
      keywords: ['notifications', 'alerts', 'messages', 'counter offer', 'updates', 'bell'],
      action: () => {
        setShowSearch(false);
        onNavigateToNotifications?.();
      },
    },
    {
      id: 'profile',
      title: 'Profile & Farm Details',
      subtitle: 'Personal info, Aadhaar, bank details, and farm land',
      category: 'Feature',
      icon: 'person',
      iconBg: P.paleLavenderBg,
      iconColor: P.violetAccent,
      keywords: ['profile', 'account', 'kumar', 'personal details', 'farmer id', 'aadhaar', 'settings', 'phone', 'address'],
      action: () => {
        setShowSearch(false);
        onNavigateToProfile?.();
      },
    },
    {
      id: 'wallet',
      title: 'Wallet & Payouts',
      subtitle: 'Payment balance, past payouts, and bank settlement',
      category: 'Feature',
      icon: 'account_balance_wallet',
      iconBg: P.paleSkyBg,
      iconColor: P.blue700,
      keywords: ['wallet', 'payouts', 'money', 'earnings', 'bank', 'balance', 'rupees', 'settlement'],
      action: () => {
        setShowSearch(false);
        (_onNavigateToWallet ?? onNavigateToProfile)?.();
      },
    },
    {
      id: 'audits',
      title: 'Farm Audits & Inspections',
      subtitle: 'Upcoming inspection in 12 days · Rating 82/100',
      category: 'Feature',
      icon: 'calendar_today',
      iconBg: P.paleCreamBg,
      iconColor: P.amber600,
      keywords: ['audit', 'audits', 'inspection', 'rating', 'score', 'inspector', 'compliance'],
      action: () => {
        setShowSearch(false);
        onNavigateToProfile?.();
      },
    },
    {
      id: 'inventory',
      title: 'Inventory & Equipment',
      subtitle: 'Tractor service due · Seeds, tools, and supplies',
      category: 'Feature',
      icon: 'inventory_2',
      iconBg: P.paleSkyBg,
      iconColor: P.blue700,
      keywords: ['inventory', 'tractor', 'equipment', 'tools', 'machinery', 'service', 'supplies', 'seeds', 'farm inventory'],
      action: () => {
        setShowSearch(false);
        (onNavigateToInventory ?? onNavigateToFarmManagement)?.();
      },
    },
    {
      id: 'calendar',
      title: 'TOHFA Calendar',
      subtitle: 'Market day tomorrow · Harvest schedules & reminders',
      category: 'Feature',
      icon: 'calendar_month',
      iconBg: P.paleCreamBg,
      iconColor: P.amber600,
      keywords: ['calendar', 'events', 'market day', 'schedule', 'reminders', 'dates'],
      action: () => {
        setShowSearch(false);
        onNavigateToFarmManagement?.();
      },
    },
    {
      id: 'learning',
      title: 'Learning Hub',
      subtitle: '4 new farming tutorials & organic farming guides',
      category: 'Feature',
      icon: 'menu_book',
      iconBg: P.palePinkBg,
      iconColor: P.red600,
      keywords: ['learning', 'tutorials', 'hub', 'guides', 'articles', 'education', 'training', 'organic'],
      action: () => {
        setShowSearch(false);
        onNavigateToProfile?.();
      },
    },
    {
      id: 'counter-offer',
      title: 'Counter-Offer: Tomatoes',
      subtitle: 'Admin offered ₹42/kg · Respond within 24 hours',
      category: 'Action',
      icon: 'warning',
      iconBg: P.palePeachBg,
      iconColor: P.orange900,
      keywords: ['counter-offer', 'offer', 'tomatoes', 'admin', 'review offer', 'deal', 'bid', '42'],
      action: () => {
        setShowSearch(false);
        onNavigateToListings?.();
      },
    },
  ], [onNavigateToFarmManagement, onNavigateToCertifications, onNavigateToWeather, onNavigateToListings, onNavigateToCreateListing, onNavigateToNotifications, onNavigateToProfile, _onNavigateToWallet]);

  const filteredSearchItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return searchItems;
    return searchItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.toLowerCase().includes(q))
    );
  }, [searchItems, searchQuery]);

  const popularSearches = ['Tomato', 'Certifications', 'Weather', 'Listings', 'Log Diary', 'Audits'];

  // Weather has its own, silent load path: a failed or slow weather call
  // must never block or error out the rest of the dashboard, so it is
  // tracked independently and simply falls back to placeholders (see the
  // `weatherCard` values below) rather than joining the Promise.all above.
  const [weather, setWeather] = useState<FarmWeather | null>(null);

  const loadWeather = useCallback(async () => {
    try {
      const res = await getFarmWeather();
      setWeather(res);
    } catch {
      setWeather(null);
    }
  }, []);

  // The audit card, certification card and Active Crops each load on their
  // own (same reason as weather above): a failing or slow call degrades only
  // its widget, never the dashboard. Pull-to-refresh bumps `widgetReloadKey`
  // to re-run them; the AbortController drops a superseded or unmounted load.
  const [widgetReloadKey, setWidgetReloadKey] = useState<number>(0);
  const [auditState, setAuditState] = useState<WidgetState<FarmerAuditSummary | null>>({ kind: 'loading' });
  const [certState, setCertState] = useState<WidgetState<Certification[]>>({ kind: 'loading' });
  const [cropsState, setCropsState] = useState<WidgetState<ActiveFarmCropsResult>>({ kind: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    listMyAudits(
      { status: [...UPCOMING_AUDIT_STATUSES], sort: 'scheduledFor', limit: UPCOMING_AUDITS_PAGE_SIZE },
      controller.signal,
    )
      .then((res) => {
        if (!controller.signal.aborted) setAuditState({ kind: 'ready', data: selectNextAudit(res.items) });
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setAuditState({ kind: 'error', error: err });
      });
    return () => controller.abort();
  }, [widgetReloadKey]);

  useEffect(() => {
    const controller = new AbortController();
    listAllMyCertifications(controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) setCertState({ kind: 'ready', data: items });
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setCertState({ kind: 'error', error: err });
      });
    return () => controller.abort();
  }, [widgetReloadKey]);

  useEffect(() => {
    const controller = new AbortController();
    listAllActiveFarmCrops(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setCropsState({ kind: 'ready', data: result });
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setCropsState({ kind: 'error', error: err });
      });
    return () => controller.abort();
  }, [widgetReloadKey]);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [profileRes, configRes, counterOfferRes, ratingRes, notifRes] = await Promise.allSettled([
        getMyFarmerProfile(),
        getSystemConfig(),
        getMyListings('COUNTER_OFFERED'),
        getMyFarmRating(),
        listNotifications({ limit: 1 }),
      ]);

      if (profileRes.status === 'fulfilled' && profileRes.value) {
        setProfile(profileRes.value);
      } else {
        setProfile({
          id: 'farmer-default',
          tohfaFarmerId: 'TOHFA-F-2026-0001',
          fullName: 'Kumar',
          mobile: '9876543210',
          aadhaarLast4: '4321',
          kycStatus: 'VERIFIED',
          subscriptionTier: 'PAID',
          isMarketBlocked: false,
        });
      }

      if (configRes.status === 'fulfilled' && configRes.value) {
        setWarningThreshold(configRes.value.certExpiryWarningDays);
      }

      if (counterOfferRes.status === 'fulfilled' && counterOfferRes.value?.items) {
        setCounterOfferListings(counterOfferRes.value.items);
      } else {
        setCounterOfferListings([]);
      }

      if (ratingRes.status === 'fulfilled') {
        setFarmRating(ratingRes.value);
      }

      if (notifRes.status === 'fulfilled' && notifRes.value && typeof notifRes.value.unreadCount === 'number') {
        setUnreadNotificationCount(notifRes.value.unreadCount);
      }
    } catch {
      setProfile((prev) => prev ?? {
        id: 'farmer-default',
        tohfaFarmerId: 'TOHFA-F-2026-0001',
        fullName: 'Kumar',
        mobile: '9876543210',
        aadhaarLast4: '4321',
        kycStatus: 'VERIFIED',
        subscriptionTier: 'PAID',
        isMarketBlocked: false,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    void loadWeather();
  }, [loadWeather]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadData();
    void loadWeather();
    setWidgetReloadKey((key) => key + 1);
  }, [loadData, loadWeather]);

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.skeletonContainer}>
          <Skeleton height={28} width="60%" style={styles.skeletonItem} />
          <Skeleton height={18} width="35%" style={styles.skeletonItem} />
          <Skeleton height={140} width="100%" style={styles.skeletonCard} />
          <Skeleton height={180} width="100%" style={styles.skeletonCard} />
        </View>
      </SafeAreaView>
    );
  }

  if (error && !profile) {
    return (
      <SafeAreaView style={styles.screen}>
        <ErrorState
          error={error}
          onRetry={() => {
            setLoading(true);
            void loadData();
          }}
        />
      </SafeAreaView>
    );
  }

  const ratingView = deriveFarmRatingView(farmRating);
  const now = new Date();

  // Certification: real list or nothing -- never demo certificates. The card
  // and the market-access banner both derive from summarizeCertifications (the
  // banner via evalMarketBlock). While the list loads or after it fails
  // (`certs` undefined), the block check falls back to the server's own
  // `profile.isMarketBlocked`.
  const certs = certState.kind === 'ready' ? certState.data : undefined;
  const certSummary = certs !== undefined ? summarizeCertifications(certs, warningThreshold) : null;
  const marketBlockState = evalMarketBlock(profile ?? {}, certs);

  const auditValue = auditState.kind === 'ready' ? auditMiniValue(auditCountdown(auditState.data, now)) : '—';

  const cropPreview =
    cropsState.kind === 'ready' ? selectCropPreview(cropsState.data, DASHBOARD_CROP_PREVIEW_LIMIT) : null;

  // BR-10/BR-11: only an offer the server still reports as PENDING is
  // actionable; the soonest-expiring one is surfaced. Expiries go through
  // parseServerTime (Postgres text timestamps are NaN to `new Date` on Hermes).
  const pendingCounterOffers = soonestPendingCounterOffers(counterOfferListings);
  const urgentCounterOffer = pendingCounterOffers[0] ?? null;

  // Neutral placeholders while the independent weather load is in flight or
  // failed -- this card must never block or error out the rest of the
  // dashboard (see `loadWeather` above).
  const isRainyCondition =
    weather?.current.condition === 'LIGHT_RAIN' ||
    weather?.current.condition === 'RAIN' ||
    weather?.current.condition === 'THUNDERSTORM';
  const weatherIconName = isRainyCondition ? 'rainy' : 'wb_sunny';
  const weatherIconColor = isRainyCondition ? P.blue700 : P.orange500;
  const weatherTemperature = weather
    ? t('farmer.dashboard.weather.temperature', { value: Math.round(weather.current.temperatureC) })
    : '—';
  const weatherCondition = weather
    ? t(`farmer.weather.condition.${weather.current.condition}` as TranslationKey)
    : '—';
  const weatherHumidity = weather
    ? t('farmer.dashboard.weather.humidityValue', { value: Math.round(weather.current.humidityPct) })
    : '—';
  const weatherWind = weather ? String(Math.round(weather.current.windKph)) : '—';
  const weatherRain = weather
    ? t('farmer.dashboard.weather.rainValue', { value: Math.round(weather.current.precipitationChancePct) })
    : '—';

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Header Section (Green Background) */}
        <View style={styles.headerBackground}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.profileRow}
              onPress={onNavigateToProfile}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.profile.title')}
            >
              <View style={styles.profileImageContainer}>
                <Image
                  source={farmerAvatar}
                  style={styles.profileAvatar}
                  resizeMode="cover"
                />
              </View>
              <View>
                <Text style={styles.greetingText}>{t(getGreetingKey())}</Text>
                {(() => {
                  const { base, suffix } = splitNameSuffix(profile?.fullName ?? 'Kumar');
                  return (
                    <Text style={styles.nameText}>
                      {base}
                      {suffix ? <Text style={styles.nameSuffixText}> {suffix}</Text> : null}
                    </Text>
                  );
                })()}
              </View>
            </TouchableOpacity>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerIconButton}
                onPress={() => setShowSearch(true)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={t('farmer.dashboard.header.search')}
              >
                <HeaderSearchIcon size={19} color={colors.white} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerIconButton}
                onPress={onNavigateToNotifications}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={t('farmer.dashboard.header.notifications')}
              >
                <HeaderBellIcon size={19} color={colors.white} />
                {unreadNotificationCount > 0 && <View style={styles.notificationDot} />}
              </TouchableOpacity>
            </View>
          </View>

          {/* Header Mini Cards */}
          <View style={styles.headerCardsRow}>
            <TouchableOpacity
              style={styles.headerMiniCard}
              onPress={onNavigateToCertifications}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.dashboard.header.certLabel')}
            >
              {/* Real data: GET /v1/farmers/me/certifications, summarized by summarizeCertifications(). */}
              <View style={styles.miniCardTitleRow}>
                <Icon name="shield" size={12} color={P.green200} />
                <Text style={styles.miniCardTitle}> {t('farmer.dashboard.header.certLabel')}</Text>
              </View>
              <Text style={styles.miniCardValue}>{certSummary ? certMiniValue(certSummary) : '—'}</Text>
            </TouchableOpacity>
            {/* Real data: GET /v1/farmers/me/audits?status=SCHEDULED,IN_PROGRESS -- the next audit's IST countdown. */}
            <TouchableOpacity
              style={styles.headerMiniCard}
              onPress={onNavigateToAudits}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.dashboard.header.auditLabel')}
            >
              <View style={styles.miniCardTitleRow}>
                <Icon name="calendar_today" size={12} color={P.green200} />
                <Text style={styles.miniCardTitle}> {t('farmer.dashboard.header.auditLabel')}</Text>
              </View>
              <Text style={styles.miniCardValue}>{auditValue}</Text>
            </TouchableOpacity>
            {/* Real data: GET /v1/farmers/me/rating (BR-06) via getMyFarmRating(). */}
            <View style={styles.headerMiniCard}>
              <View style={styles.miniCardTitleRow}>
                <Icon name="star" size={12} color={P.green200} />
                <Text style={styles.miniCardTitle}> {t('farmer.dashboard.header.ratingLabel')}</Text>
              </View>
              <Text style={styles.miniCardValue}>
                {ratingView.isRated
                  ? t('farmer.dashboard.header.ratingValue', { score: ratingView.overallRating as number })
                  : t('farmer.profile.rating.notRatedShort')}
              </Text>
            </View>
          </View>
        </View>

        {/* Main Content Area */}
        <View style={styles.mainContent}>
          {/* Weather Card */}
          <TouchableOpacity style={styles.weatherCard} activeOpacity={0.9} onPress={onNavigateToWeather}>
            <View style={styles.weatherTop}>
              <View style={styles.weatherIconContainer}>
                <Icon name={weatherIconName} size={32} color={weatherIconColor} />
              </View>
              <View style={styles.weatherInfo}>
                <View style={styles.locationRow}>
                  <Icon name="place" size={12} color={P.grey600} />
                  <Text style={styles.locationText}>{t('farmer.dashboard.weather.location')}</Text>
                </View>
                <View style={styles.tempRow}>
                  <Text style={styles.temperature}>{weatherTemperature}</Text>
                  <Text style={styles.condition}>{weatherCondition}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.forecastButton} onPress={onNavigateToWeather}>
                <Text style={styles.forecastText}>7-day {'>'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.weatherBottom}>
              <View style={styles.weatherStat}>
                <Icon name="water_drop" size={14} color={P.lightBlue700} />
                <Text style={styles.weatherStatValue}> {weatherHumidity} </Text>
                <Text style={styles.weatherStatLabel}>{t('farmer.dashboard.weather.humidity')}</Text>
              </View>
              <View style={styles.weatherStat}>
                <Icon name="air" size={14} color={P.blueGrey400} />
                <Text style={styles.weatherStatValue}> {weatherWind} </Text>
                <Text style={styles.weatherStatLabel}>km/h</Text>
              </View>
              <View style={styles.weatherStat}>
                <Icon name="rainy" size={14} color={P.blue700} />
                <Text style={styles.weatherStatValue}> {weatherRain} </Text>
                <Text style={styles.weatherStatLabel}>{t('farmer.dashboard.weather.rain')}</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* BR-01/BR-02: certificate banner. The blocked state comes from
              evalMarketBlock, which shares summarizeCertifications with the
              Cert mini-card: a farmer with any verified, unexpired certificate
              is never shown as blocked by other expired/pending ones. */}
          {marketBlockState.isBlocked && marketBlockState.titleKey && marketBlockState.messageKey ? (
            <View style={[styles.alertCard, { backgroundColor: P.palePinkBg }]}>
              <Icon name="block" size={24} color={colors.danger} />
              <View style={styles.alertContent}>
                <Text style={[styles.alertTitle, { color: colors.danger }]}>
                  {t(marketBlockState.titleKey as TranslationKey)}
                </Text>
                <Text style={styles.alertMessage}>
                  {t(marketBlockState.messageKey as TranslationKey)}
                </Text>
                {marketBlockState.reason === 'CERT_EXPIRED' ? (
                  <TouchableOpacity onPress={onNavigateToCertifications}>
                    <Text style={styles.alertAction}>{t('farmer.dashboard.banner.renewAction')} {'>'}</Text>
                  </TouchableOpacity>
                ) : marketBlockState.reason === 'CERT_MISSING' ? (
                  // BR-02: no certificate, or only rejected ones -- the way
                  // back is adding one (Certifications screen -> Add).
                  <TouchableOpacity onPress={onNavigateToCertifications}>
                    <Text style={styles.alertAction}>{t('farmer.dashboard.banner.addCertAction')} {'>'}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          ) : certSummary?.kind === 'expiring' ? (
            <View style={styles.alertCard}>
              <Icon name="warning" size={24} color={P.orange900} />
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>{t('farmer.dashboard.banner.certExpiringTitle')}</Text>
                <Text style={styles.alertMessage}>
                  {t('farmer.certifications.daysLeft', { days: certSummary.days })}
                </Text>
                <TouchableOpacity onPress={onNavigateToCertifications}>
                  <Text style={styles.alertAction}>{t('farmer.dashboard.banner.renewAction')} {'>'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {/* Alert Card */}
          <TouchableOpacity
            style={styles.alertCard}
            activeOpacity={0.85}
            onPress={() => onNavigateToCounterOffer?.(urgentCounterOffer ?? undefined)}
          >
            <Icon name="warning" size={24} color={P.orange900} />
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Counter-offer received</Text>
              <Text style={styles.alertMessage}>
                {urgentCounterOffer
                  ? `Admin offered ₹${urgentCounterOffer.activeCounterOffer?.pricePerKg ?? '42'}/kg for your ${urgentCounterOffer.cropName}. Respond within 24 hours.`
                  : 'Admin offered ₹42/kg for your produce. Respond within 24 hours.'}
              </Text>
              <View style={{ marginTop: 4 }}>
                <Text style={styles.alertAction}>Review offer {'>'}</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Grid Menu */}
          <View style={styles.gridContainer}>
            <TouchableOpacity
              style={styles.gridCard}
              onPress={onNavigateToCropManagement || onNavigateToFarmManagement}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.dashboard.menu.cropManagement')}
            >
              <View style={[styles.gridIconCircle, { backgroundColor: P.paleMintBg }]}>
                <Icon name="eco" size={20} color={colors.brandGreen} />
              </View>
              <Text style={styles.gridTitle}>{t('farmer.dashboard.menu.cropManagement')}</Text>
              {/* Real active-crop count (same load as Active Crops below). The design's
                  "· diary due" suffix is dropped: no endpoint reports a due diary entry. */}
              <Text style={styles.gridSubtitle}>
                {cropPreview ? cropCountSubtitle(cropPreview.total, cropPreview.totalIsExact) : '—'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridCard} onPress={onNavigateToCertifications}>
              <View style={[styles.gridIconCircle, { backgroundColor: P.paleLavenderBg }]}>
                <Icon name="verified" size={20} color={P.violetAccent} />
              </View>
              <Text style={styles.gridTitle}>{t('farmer.dashboard.menu.certifications')}</Text>
              <Text style={styles.gridSubtitle}>{certSummary ? certGridSubtitle(certSummary) : '—'}</Text>
            </TouchableOpacity>
            {/* Badge and subtitle count come from the same real pending-counter-offer
                list as the alert card above. */}
            <TouchableOpacity style={styles.gridCard} onPress={onNavigateToListings}>
              <View style={[styles.gridIconCircle, { backgroundColor: P.palePeachBg }]}>
                <Icon name="shopping_cart" size={20} color={P.deepOrange600} />
              </View>
              {pendingCounterOffers.length > 0 ? (
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>{pendingCounterOffers.length}</Text>
                </View>
              ) : null}
              <Text style={styles.gridTitle}>{t('farmer.dashboard.menu.marketing')}</Text>
              <Text style={styles.gridSubtitle}>
                {pendingCounterOffers.length > 0
                  ? t('farmer.dashboard.menu.marketingSubtitle', {
                      count: pendingCounterOffers.length,
                    })
                  : t('farmer.dashboard.menu.marketingSubtitleNone')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.gridCard}
              onPress={onNavigateToInventory}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Inventory"
            >
              <View style={[styles.gridIconCircle, { backgroundColor: P.paleSkyBg }]}>
                <Icon name="inventory_2" size={20} color={P.blue700} />
              </View>
              <Text style={styles.gridTitle}>Inventory</Text>
              <Text style={styles.gridSubtitle}>Tractor service due</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridCard} onPress={onNavigateToTohfaCalendar}>
              <View style={[styles.gridIconCircle, { backgroundColor: P.paleCreamBg }]}>
                <Icon name="calendar_month" size={20} color={P.amber600} />
              </View>
              <Text style={styles.gridTitle}>TOHFA Calendar</Text>
              <Text style={styles.gridSubtitle}>Market day tomorrow</Text>
            </TouchableOpacity>

            {/* Learning Hub: static design copy -- no learning-content endpoint exists, so the "4" badge and "4 new tutorials" are not real counts. */}
            <TouchableOpacity
              style={styles.gridCard}
              onPress={onNavigateToLearningHub}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Learning Hub"
            >
              <View style={[styles.gridIconCircle, { backgroundColor: P.palePinkBg }]}>
                <Icon name="menu_book" size={20} color={P.red600} />
              </View>
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>4</Text>
              </View>
              <Text style={styles.gridTitle}>Learning Hub</Text>
              <Text style={styles.gridSubtitle}>4 new tutorials</Text>
            </TouchableOpacity>
          </View>

          {/* Active Crops: real GROWING/PLANNED crops across every plot (listAllActiveFarmCrops); the first few here, the rest via "View all". */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('farmer.dashboard.crops.title')}</Text>
            <TouchableOpacity onPress={onNavigateToActiveCrops ?? onNavigateToProduceCalendar} activeOpacity={0.75}>
              <Text style={styles.viewAllText}>{t('farmer.dashboard.crops.viewAll')} {'>'}</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.cropsScroll}
            contentContainerStyle={styles.cropsScrollContent}
          >
            {cropsState.kind === 'loading' ? (
              Array.from({ length: DASHBOARD_CROP_PREVIEW_LIMIT }, (_, i) => (
                <Skeleton key={i} width={172} height={190} borderRadius={18} style={styles.cropSkeleton} />
              ))
            ) : cropsState.kind === 'error' ? (
              <Text style={styles.cropsStatusText}>{t('farmer.dashboard.crops.loadError')}</Text>
            ) : cropPreview !== null && cropPreview.shown.length > 0 ? (
              cropPreview.shown.map((entry) => {
                const view = cropCardView(entry, now);
                const accent = view.status === 'GROWING' ? colors.brandGreen : P.blue700;
                // Stock picture of the crop type; a crop without one keeps the tinted box empty.
                const photo = cropPhotoFor(entry.crop.cropIconKey, entry.crop.cropName);
                return (
                  <TouchableOpacity
                    key={view.id}
                    style={styles.cropCard}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={view.name}
                    onPress={() =>
                      onNavigateToCropDetail
                        ? onNavigateToCropDetail(toActiveCropData(entry.crop, entry.plot))
                        : (onNavigateToActiveCrops ?? onNavigateToProduceCalendar)?.()
                    }
                  >
                    {photo !== null ? (
                      <Image source={photo} style={styles.cropImagePlaceholder} resizeMode="cover" />
                    ) : (
                      <View style={styles.cropImagePlaceholder} />
                    )}
                    <View style={styles.cropInfo}>
                      <Text style={styles.cropName}>{view.name}</Text>
                      <Text style={styles.cropDetail}>
                        {view.daysOld === null
                          ? view.plotName
                          : t('farmer.dashboard.crops.plotLine', { plot: view.plotName, days: view.daysOld })}
                      </Text>
                      <Text style={[styles.cropHarvest, { color: accent }]}>{cropHarvestText(view)}</Text>
                      <View style={styles.progressBarBg}>
                        <View
                          style={[styles.progressBarFill, { width: `${view.progressPercent ?? 0}%`, backgroundColor: accent }]}
                        />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <Text style={styles.cropsStatusText}>{t('farmer.crops.activeCrops.emptyTitle')}</Text>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.actionButton} onPress={onNavigateToFarmDiary}>
              <Icon name="edit_note" size={22} color={colors.brandGreen} style={styles.actionButtonIcon} />
              <Text style={styles.actionButtonText}>Farm Diary</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={onNavigateToMyListings}>
              <Icon name="assignment" size={22} color={colors.brandGreen} style={styles.actionButtonIcon} />
              <Text style={styles.actionButtonText}>My Listings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={onNavigateToAttendance}>
              <Icon name="groups" size={22} color={colors.brandGreen} style={styles.actionButtonIcon} />
              <Text style={styles.actionButtonText}>Attendance</Text>
            </TouchableOpacity>
          </View>

          {/* Tip of the Day: static design copy -- no tips/content endpoint exists in apps/api or docs/openapi.yaml. */}
          <View style={styles.tipCard}>
            <View style={styles.tipBadge}>
              <Text style={styles.tipBadgeText}>TIP OF THE DAY</Text>
            </View>
            <Text style={styles.tipTitle}>Mulch before the dry spell</Text>
            <Text style={styles.tipText}>Apply a 5cm layer of straw mulch around tomato beds this week to retain soil moisture as temperatures rise.</Text>
          </View>
        </View>
      </ScrollView>

      {/* Search Modal */}
      <Modal
        visible={showSearch}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowSearch(false)}
      >
        <SafeAreaView style={styles.searchModalScreen}>
          {/* Search Header */}
          <View style={styles.searchHeader}>
            <View style={styles.searchInputContainer}>
              <Icon name="search" size={20} color={P.twGray400} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={t('farmer.dashboard.header.search') + ' crops, tasks, tools...'}
                placeholderTextColor={P.twGray400}
                autoFocus={true}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel="Clear search"
                >
                  <Icon name="close" size={18} color={P.twGray500} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={styles.searchCancelBtn}
              onPress={() => {
                setShowSearch(false);
                setSearchQuery('');
              }}
              accessibilityRole="button"
              accessibilityLabel="Cancel search"
            >
              <Text style={styles.searchCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Suggestions when query is empty */}
          {searchQuery.trim().length === 0 && (
            <View style={styles.searchSuggestionsRow}>
              <Text style={styles.searchSuggestionsLabel}>Popular:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.searchPillsContainer}>
                {popularSearches.map((term) => (
                  <TouchableOpacity
                    key={term}
                    style={styles.searchPill}
                    onPress={() => setSearchQuery(term)}
                  >
                    <Text style={styles.searchPillText}>{term}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Search Results List */}
          <FlatList
            data={filteredSearchItems}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.searchResultsList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.searchResultItem}
                onPress={item.action}
                activeOpacity={0.7}
              >
                <View style={[styles.searchResultIconCircle, { backgroundColor: item.iconBg }]}>
                  <Icon name={item.icon} size={22} color={item.iconColor} />
                </View>
                <View style={styles.searchResultContent}>
                  <View style={styles.searchResultTitleRow}>
                    <Text style={styles.searchResultTitle}>{item.title}</Text>
                    <View style={styles.searchCategoryBadge}>
                      <Text style={styles.searchCategoryText}>{item.category}</Text>
                    </View>
                  </View>
                  <Text style={styles.searchResultSubtitle}>{item.subtitle}</Text>
                </View>
                <Icon name="chevron_right" size={20} color={P.twGray400} />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.searchEmptyContainer}>
                <View style={styles.searchEmptyIconCircle}>
                  <Icon name="search_off" size={36} color={P.twGray400} />
                </View>
                <Text style={styles.searchEmptyTitle}>No matching results</Text>
                <Text style={styles.searchEmptySub}>
                  We could not find anything matching "{searchQuery}". Try searching for crops, weather, or certifications.
                </Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: P.lightSurfaceAlt },
  scrollContent: { paddingBottom: 20 },
  skeletonContainer: { padding: 20, gap: 12 },
  skeletonItem: { borderRadius: 8 },
  skeletonCard: { borderRadius: 16, marginTop: 8 },

  headerBackground: {
    backgroundColor: P.deepGreen,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.white,
    overflow: 'hidden',
    backgroundColor: P.green200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatar: {
    width: '100%',
    height: '100%',
  },
  profileImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: P.green200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageText: {
    fontSize: typography.title,
    fontWeight: 'bold',
    color: P.deepGreen,
  },
  greetingText: {
    color: P.green200,
    fontSize: typography.body,
  },
  nameText: {
    color: colors.white,
    fontSize: typography.title,
    fontWeight: 'bold',
  },
  nameSuffixText: {
    color: colors.white,
    fontSize: typography.bodySmall,
    fontWeight: '400',
    opacity: 0.75,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: P.redAccent200,
    borderWidth: 1.5,
    borderColor: P.deepGreen,
  },
  headerCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  headerMiniCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 10,
    borderRadius: 12,
  },
  miniCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  miniCardTitle: {
    color: P.green200,
    fontSize: typography.bodySmall,
  },
  miniCardValue: {
    color: 'white',
    fontSize: typography.body,
    fontWeight: 'bold',
  },

  mainContent: {
    paddingHorizontal: 20,
    marginTop: -20,
    gap: 20,
  },

  weatherCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  weatherTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  weatherIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: P.orange50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  weatherInfo: {
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  locationText: {
    color: P.grey600,
    fontSize: typography.body,
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  temperature: {
    fontSize: typography.headline,
    fontWeight: 'bold',
    color: P.grey900,
  },
  condition: {
    fontSize: typography.bodyLarge,
    color: P.grey600,
  },
  forecastButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: P.lightGreen50,
    borderRadius: 12,
  },
  forecastText: {
    color: colors.brandGreen,
    fontSize: typography.bodySmall,
    fontWeight: 'bold',
  },
  weatherBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: P.grey100,
  },
  weatherStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  weatherStatValue: {
    fontSize: typography.body,
    fontWeight: 'bold',
    color: P.grey900,
  },
  weatherStatLabel: {
    fontSize: typography.body,
    color: P.grey600,
  },

  alertCard: {
    backgroundColor: P.orange50,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: P.orange100,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: 'bold',
    color: P.orange900,
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: typography.body,
    color: P.orange900,
    marginBottom: 8,
    lineHeight: 18,
  },
  alertAction: {
    fontSize: typography.body,
    fontWeight: 'bold',
    color: P.deepOrange800,
  },

  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  gridCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    position: 'relative',
  },
  gridIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: P.redAccent200,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: typography.caption,
    fontWeight: 'bold',
  },
  gridTitle: {
    fontSize: typography.body,
    fontWeight: 'bold',
    color: P.grey900,
    marginBottom: 4,
  },
  gridSubtitle: {
    fontSize: typography.bodySmall,
    color: P.grey600,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: typography.title,
    fontWeight: 'bold',
    color: P.grey900,
  },
  viewAllText: {
    fontSize: typography.body,
    color: colors.brandGreen,
    fontWeight: 'bold',
  },
  cropsScroll: {
    marginHorizontal: -20,
  },
  cropsScrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  cropCard: {
    width: 172,
    backgroundColor: P.white,
    borderRadius: 18,
    marginRight: 14,
    borderWidth: 1,
    borderColor: P.twGray100,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  cropImagePlaceholder: {
    height: 104,
    width: '100%',
    backgroundColor: P.twGray100,
  },
  cropSkeleton: {
    marginRight: 14,
  },
  cropsStatusText: {
    fontSize: typography.body,
    color: P.twGray500,
    paddingVertical: 12,
  },
  cropInfo: {
    padding: 13,
  },
  cropName: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.twGray900,
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  cropDetail: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    marginBottom: 10,
  },
  cropHarvest: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    marginBottom: 6,
  },
  progressBarBg: {
    height: 5,
    backgroundColor: P.twGray100,
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 5,
    borderRadius: 3,
  },

  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  actionButtonIcon: {
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: typography.bodySmall,
    fontWeight: 'bold',
    color: P.grey900,
  },

  tipCard: {
    backgroundColor: colors.brandGreenLight,
    borderRadius: 16,
    padding: 20,
    marginBottom: 0,
  },
  tipBadge: {
    backgroundColor: colors.brandGreen,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  tipBadgeText: {
    color: 'white',
    fontSize: typography.caption,
    fontWeight: 'bold',
  },
  tipTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: 'bold',
    color: P.deepGreen,
    marginBottom: 8,
  },
  tipText: {
    fontSize: typography.body,
    color: colors.brandGreen,
    lineHeight: 20,
  },

  /* Search Modal Styles */
  searchModalScreen: {
    flex: 1,
    backgroundColor: P.lightSurfaceAlt,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray200,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.twGray100,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: P.twGray900,
    fontSize: typography.bodyLarge,
    paddingVertical: 0,
  },
  searchCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  searchCancelText: {
    color: colors.brandGreen,
    fontSize: typography.bodyLarge,
    fontWeight: '600',
  },
  searchSuggestionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  searchSuggestionsLabel: {
    fontSize: typography.body,
    color: P.twGray500,
    fontWeight: '600',
    marginRight: 8,
  },
  searchPillsContainer: {
    gap: 8,
    paddingRight: 16,
  },
  searchPill: {
    backgroundColor: P.twGreen50,
    borderWidth: 1,
    borderColor: P.twGreen100,
    borderRadius: 16,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  searchPillText: {
    color: colors.brandGreen,
    fontSize: typography.body,
    fontWeight: '600',
  },
  searchResultsList: {
    padding: 16,
    gap: 10,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: P.twGray200,
    gap: 12,
  },
  searchResultIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  searchResultTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.twGray900,
  },
  searchCategoryBadge: {
    backgroundColor: P.twGray100,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  searchCategoryText: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: P.twGray600,
  },
  searchResultSubtitle: {
    fontSize: typography.body,
    color: P.twGray500,
  },
  searchEmptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  searchEmptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: P.twGray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchEmptyTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.twGray800,
    marginBottom: 8,
  },
  searchEmptySub: {
    fontSize: typography.body,
    color: P.twGray500,
    textAlign: 'center',
    lineHeight: 20,
  },
});
