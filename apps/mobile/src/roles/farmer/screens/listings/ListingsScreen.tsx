import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform, Image } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ErrorState, Skeleton } from '@tohfa/mobile-ui';
import { t } from '../../../../i18n/farmer';
import { authPalette as P, colors, typography } from '../../theme';
import { formatMoneyAmount } from '../../api/wallet';
import {
  deriveListingsOverview,
  effectivePricePerKg,
  effectiveQuantityKg,
  formatKg,
  listAllMyListings,
  listingStatusTone,
  respondableOffer,
  type Listing,
  type ListingStatusTone,
} from '../../api/listings';
import { listingPhotoSource } from './cropImages';
import { statusLabel, timeLeftLabel } from './listingFormat';

// Simple SVG Icons to match design exactly
const ChevronLeft = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18L9 12L15 6" stroke={colors.brandGreen} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);


const BellAlert = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16ZM16 17H8V11C8 8.52 9.51 6.5 12 6.5C14.49 6.5 16 8.52 16 11V17Z" fill={P.deepOrange800}/>
  </Svg>
);

const ChevronRight = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18L15 12L9 6" stroke={P.deepOrange800} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const StoreIcon = () => (
  <Svg width={120} height={120} viewBox="0 0 24 24" fill="none">
    <Path d="M2 6L4 11V20C4 20.5523 4.44772 21 5 21H19C19.5523 21 20 20.5523 20 20V11L22 6V5C22 4.44772 21.5523 4 21 4H3C2.44772 4 2 4.44772 2 5V6Z" fill={P.weatherCloudWhite} opacity={0.2} />
    <Path d="M22 6L20 11V12C20 12.5523 19.5523 13 19 13C18.4477 13 18 12.5523 18 12V11C18 11.5523 17.5523 12 17 12C16.4477 12 16 11.5523 16 11V12C16 12.5523 15.5523 13 15 13C14.4477 13 14 12.5523 14 12V11L14 6H22Z" fill={P.weatherCloudWhite} opacity={0.3} />
  </Svg>
);

const Plus = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M12 5V19M5 12H19" stroke={P.weatherCloudWhite} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

interface ListingsScreenProps {
  onNavigateToCreateListing?: () => void;
  /** Opened for a listing whose admin counter-offer is still answerable. */
  onNavigateToCounterOffer?: (listing: Listing) => void;
  onNavigateToListingDetail?: (listing: Listing) => void;
  onNavigateToMyListings?: () => void;
  onNavigateBack?: () => void;
}

// ─────────────────────────────────────────────
// Data: the caller's own listings from GET /listings (`listAllMyListings`),
// walked to the end of the cursor so the metric counts are real.
//
// Left out of the approved design because nothing backs them (not faked):
//   - the "MARKET DAY IS OPEN" chip and "Today is a market day" title: there is
//     no market-day schedule (docs/rules.md "Rules NOT enforced in Track 1" #17);
//   - "Earned this month": no endpoint or wallet entry records listing payouts
//     (nothing writes SALE_CREDIT yet), so the figure is a neutral dash.
// ─────────────────────────────────────────────

type LoadState =
  | { kind: 'loading' }
  | { kind: 'error'; error: unknown }
  | { kind: 'ready'; items: Listing[] };

/** Rows the design shows under RECENT LISTINGS; "View all" opens the full list. */
const RECENT_LIMIT = 3;

const BADGE_TONE: Record<ListingStatusTone, { backgroundColor: string; color: string }> = {
  approved: { backgroundColor: colors.brandGreenLight, color: colors.brandGreen },
  counter: { backgroundColor: P.purple50, color: P.purple600 },
  waiting: { backgroundColor: P.orange50, color: P.orange900 },
  rejected: { backgroundColor: P.twRed100, color: P.twRed700 },
  neutral: { backgroundColor: P.twGray100, color: P.twGray600 },
};

export function ListingsScreen({
  onNavigateToCreateListing,
  onNavigateToCounterOffer,
  onNavigateToListingDetail,
  onNavigateToMyListings,
  onNavigateBack,
}: ListingsScreenProps): React.JSX.Element {
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  // One controller per load (initial or retry), aborted on unmount, so no
  // response ever lands in state after the screen is gone.
  const controllerRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setState({ kind: 'loading' });
    try {
      const { items } = await listAllMyListings(undefined, controller.signal);
      if (controller.signal.aborted) return;
      setNowMs(Date.now());
      setState({ kind: 'ready', items });
    } catch (error) {
      if (controller.signal.aborted) return;
      setState({ kind: 'error', error });
    }
  }, []);

  useEffect(() => {
    void load();
    return () => controllerRef.current?.abort();
  }, [load]);

  const overview = useMemo(
    () => (state.kind === 'ready' ? deriveListingsOverview(state.items, nowMs, RECENT_LIMIT) : null),
    [state, nowMs],
  );
  const urgent = overview?.needsReply[0] ?? null;
  const urgentOffer = urgent?.activeCounterOffer ?? null;

  const openListing = (listing: Listing) => {
    if (respondableOffer(listing, nowMs) !== null && onNavigateToCounterOffer) {
      onNavigateToCounterOffer(listing);
    } else {
      onNavigateToListingDetail?.(listing);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onNavigateBack}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.common.back')}
          >
            <ChevronLeft />
          </TouchableOpacity>
          <View style={styles.headerTextCol}>
            <Text style={styles.headerTitle}>{t('farmer.listings.market.title')}</Text>
            <Text style={styles.headerSub}>{t('farmer.listings.market.subtitle')}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Market Day Hero (chip + title removed: no market-day schedule exists) */}
        <View style={styles.heroCard}>
          <View style={{position:'absolute', right: -20, bottom: -10}}>
             <StoreIcon />
          </View>
          <Text style={styles.heroSub}>{t('farmer.listings.market.heroBody')}</Text>
        </View>

        {state.kind === 'loading' ? (
          <View>
            <Skeleton width="100%" height={88} borderRadius={16} />
            <View style={styles.skeletonGap} />
            <Skeleton width="100%" height={80} borderRadius={16} />
            <View style={styles.skeletonGap} />
            <Skeleton width="100%" height={80} borderRadius={16} />
          </View>
        ) : state.kind === 'error' ? (
          <ErrorState
            error={state.error}
            message={t('farmer.listings.market.loadError')}
            retryTitle={t('farmer.common.retry')}
            offlineMessage={t('farmer.common.offline')}
            onRetry={() => void load()}
          />
        ) : overview !== null ? (
          <>
            {/* Metrics */}
            <View style={styles.metricsContainer}>
              <View style={styles.metricCard}>
                <Text style={styles.metricValueBlack}>{overview.activeCount}</Text>
                <Text style={styles.metricLabel}>{t('farmer.listings.market.metric.active')}</Text>
              </View>
              <View style={[styles.metricCard, { flex: 1.2 }]}>
                <Text style={styles.metricValueGreen}>{t('farmer.listings.common.dash')}</Text>
                <Text style={styles.metricLabel}>{t('farmer.listings.market.metric.earned')}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValueRed}>{overview.needsReply.length}</Text>
                <Text style={styles.metricLabel}>{t('farmer.listings.market.metric.needReply')}</Text>
              </View>
            </View>

            {/* Alert Banner: the answerable counter-offer that expires soonest */}
            {urgent !== null && urgentOffer !== null ? (
              <TouchableOpacity
                style={styles.alertBanner}
                onPress={() => openListing(urgent)}
                accessibilityRole="button"
                accessibilityLabel={t('farmer.listings.button.reviewOffer')}
              >
                <View style={styles.alertIconBox}>
                  <BellAlert />
                </View>
                <View style={styles.alertTextCol}>
                  <Text style={styles.alertTitle}>
                    {overview.needsReply.length === 1
                      ? t('farmer.listings.market.alert.titleOne')
                      : t('farmer.listings.market.alert.titleMany', { count: overview.needsReply.length })}
                  </Text>
                  <Text style={styles.alertSub}>
                    {t('farmer.listings.market.alert.body', {
                      crop: urgent.cropName,
                      time: timeLeftLabel(urgentOffer.expiresAt, nowMs),
                    })}
                  </Text>
                </View>
                <View style={styles.alertChevron}>
                  <ChevronRight />
                </View>
              </TouchableOpacity>
            ) : null}

            {/* Recent Listings */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('farmer.listings.market.recentTitle')}</Text>
              <TouchableOpacity onPress={onNavigateToMyListings} accessibilityRole="button">
                <Text style={styles.viewAllBtn}>{t('farmer.listings.market.viewAll')}</Text>
              </TouchableOpacity>
            </View>

            {/* List items */}
            {overview.isEmpty ? (
              <Text style={styles.emptyText}>{t('farmer.listings.market.empty')}</Text>
            ) : (
              overview.recent.map((item) => {
                const tone = BADGE_TONE[listingStatusTone(item.status)];
                const photo = listingPhotoSource(item);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.listItem}
                    onPress={() => openListing(item)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                  >
                    <View style={[styles.listIconBox, { backgroundColor: colors.brandGreenLight }]}>
                      {photo !== null ? <Image source={photo} style={styles.realCropImg} /> : null}
                    </View>
                    <View style={styles.listTextCol}>
                      <Text style={styles.listTitle}>{item.cropName}</Text>
                      <Text style={styles.listSub}>
                        {t('farmer.listings.market.itemSub', {
                          qty: formatKg(effectiveQuantityKg(item)),
                          price: formatMoneyAmount(effectivePricePerKg(item)),
                        })}
                      </Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: tone.backgroundColor }]}>
                      <Text style={[styles.badgeText, { color: tone.color }]}>{statusLabel(item.status)}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </>
        ) : null}

        <View style={{height: 100}} />
      </ScrollView>

      {/* Floating Action Button */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fab}
          onPress={onNavigateToCreateListing}
          accessibilityRole="button"
          accessibilityLabel={t('farmer.listings.market.createListing')}
        >
          <Plus />
          <Text style={styles.fabText}>{t('farmer.listings.market.createListing')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: P.grey50,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: P.weatherCloudWhite,
    borderBottomWidth: 1,
    borderBottomColor: P.surfaceMuted,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: P.grey300,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.title,
    fontWeight: '800',
    color: P.teal900,
  },
  headerSub: {
    fontSize: typography.body,
    color: P.blueGrey400,
    marginTop: 2,
  },
  scrollContent: {
    padding: 20,
  },

  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.red50,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: P.deepOrange800,
    marginBottom: 20,
  },
  alertIconBox: {
    marginRight: 12,
  },
  alertTextCol: {
    flex: 1,
  },
  alertTitle: {
    fontSize: typography.body,
    fontWeight: '800',
    color: P.brown700,
    marginBottom: 4,
  },
  alertSub: {
    fontSize: typography.body,
    color: P.deepOrange800,
  },
  alertChevron: {
    marginLeft: 8,
  },
  heroCard: {
    backgroundColor: colors.brandGreen,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    overflow: 'hidden',
  },
  heroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  heroChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: P.weatherCloudWhite,
    marginRight: 6,
  },
  heroChipText: {
    color: P.weatherCloudWhite,
    fontSize: typography.caption,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: P.weatherCloudWhite,
    fontSize: typography.title,
    fontWeight: '800',
    marginBottom: 8,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: typography.body,
    lineHeight: 20,
    paddingRight: 40,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: P.weatherCloudWhite,
    borderRadius: 16,
    padding: 16,
    shadowColor: P.nearBlackDark1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  metricValueBlack: {
    fontSize: typography.title,
    fontWeight: '800',
    color: P.grey900,
    marginBottom: 4,
  },
  metricValueGreen: {
    fontSize: typography.title,
    fontWeight: '800',
    color: colors.brandGreen,
    marginBottom: 4,
  },
  metricValueRed: {
    fontSize: typography.title,
    fontWeight: '800',
    color: P.deepOrange800,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: typography.bodySmall,
    color: P.grey500,
    fontWeight: '500',
    lineHeight: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: typography.body,
    fontWeight: '800',
    color: P.grey500,
    letterSpacing: 0.5,
  },
  viewAllBtn: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.brandGreen,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.weatherCloudWhite,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: P.nearBlackDark1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  listIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  realCropImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  listTextCol: {
    flex: 1,
  },
  listTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '800',
    color: P.grey900,
    marginBottom: 4,
  },
  listSub: {
    fontSize: typography.body,
    color: P.grey500,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    ...Platform.select({
      ios: {
        shadowColor: colors.brandGreen,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brandGreen,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
  },
  fabText: {
    color: P.weatherCloudWhite,
    fontSize: typography.bodyLarge,
    fontWeight: '800',
    marginLeft: 8,
  },
  skeletonGap: {
    height: 12,
  },
  emptyText: {
    fontSize: typography.body,
    color: P.grey500,
    textAlign: 'center',
    paddingVertical: 16,
  },
});
