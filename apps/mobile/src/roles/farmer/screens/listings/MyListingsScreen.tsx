import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { ErrorState, Icon, Skeleton } from '@tohfa/mobile-ui';
import { t } from '../../../../i18n/farmer';
import { authPalette as P, typography } from '../../theme';
import { formatMoneyAmount } from '../../api/wallet';
import {
  effectivePricePerKg,
  effectiveQuantityKg,
  formatKg,
  listAllMyListings,
  listingStatusTone,
  respondableOffer,
  type Listing,
  type ListingStatusTone,
} from '../../api/listings';
import { gradeLabel, shortDateLabel, statusLabel, timeLeftLabel } from './listingFormat';

interface MyListingsScreenProps {
  onNavigateBack: () => void;
  onNavigateToListingDetail?: (listing: Listing) => void;
  /** Opened instead of the detail when the listing has an answerable admin counter-offer. */
  onNavigateToCounterOffer?: (listing: Listing) => void;
}

// ─────────────────────────────────────────────
// Data: every listing the farmer owns, newest first, from GET /listings walked
// to the end of the cursor (`listAllMyListings`).
//
// Left out of the approved design because nothing backs them (not faked):
//   - the green "Paid · ₹7,600 net" strip: listings carry no payout data;
//   - crop variety ("Carrot · Ooty"): a listing only has the crop name.
// The "All statuses" dropdown is shown as designed but has no options menu
// in the design to open, so it does not filter yet.
// ─────────────────────────────────────────────

type LoadState =
  | { kind: 'loading' }
  | { kind: 'error'; error: unknown }
  | { kind: 'ready'; items: Listing[]; complete: boolean };

const BADGE_TONE: Record<ListingStatusTone, { backgroundColor: string; color: string }> = {
  counter: { backgroundColor: P.twPurple100, color: P.twPurple700 },
  waiting: { backgroundColor: P.twOrange100, color: P.twOrange700 },
  approved: { backgroundColor: P.twGreen100, color: P.twGreen700 },
  rejected: { backgroundColor: P.twRed100, color: P.twRed700 },
  neutral: { backgroundColor: P.twGray100, color: P.twGray600 },
};

export function MyListingsScreen({
  onNavigateBack,
  onNavigateToListingDetail,
  onNavigateToCounterOffer,
}: MyListingsScreenProps): React.JSX.Element {
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const controllerRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setState({ kind: 'loading' });
    try {
      const { items, complete } = await listAllMyListings(undefined, controller.signal);
      if (controller.signal.aborted) return;
      setNowMs(Date.now());
      setState({ kind: 'ready', items, complete });
    } catch (error) {
      if (controller.signal.aborted) return;
      setState({ kind: 'error', error });
    }
  }, []);

  useEffect(() => {
    void load();
    return () => controllerRef.current?.abort();
  }, [load]);

  const cardToneStyle = {
    counter: styles.cardCarrot,
    waiting: styles.cardFrenchBeans,
    approved: styles.cardTomato,
    rejected: styles.cardCabbage,
    neutral: styles.cardPotato,
  };

  const openListing = (listing: Listing) => {
    if (respondableOffer(listing, nowMs) !== null && onNavigateToCounterOffer) {
      onNavigateToCounterOffer(listing);
    } else {
      onNavigateToListingDetail?.(listing);
    }
  };

  const subtitle =
    state.kind !== 'ready'
      ? null
      : !state.complete
        ? t('farmer.listings.mine.subtitleIncomplete', { count: state.items.length })
        : state.items.length === 1
          ? t('farmer.listings.mine.subtitleOne')
          : t('farmer.listings.mine.subtitleMany', { count: state.items.length });

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onNavigateBack}
          accessibilityRole="button"
          accessibilityLabel={t('farmer.common.back')}
        >
          <Icon name="arrow_back" size={20} color={P.twGray800} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>{t('farmer.listings.mine.title')}</Text>
          {subtitle !== null ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.filterDropdown} disabled accessibilityState={{ disabled: true }}>
          <Text style={[styles.filterText, { marginLeft: 0 }]}>{t('farmer.listings.mine.filterAll')}</Text>
          <Icon name="expand_more" size={18} color={P.twGray600} style={styles.filterCaret} />
        </TouchableOpacity>

        {state.kind === 'loading' ? (
          <>
            <Skeleton width="100%" height={84} borderRadius={16} />
            <Skeleton width="100%" height={84} borderRadius={16} />
            <Skeleton width="100%" height={84} borderRadius={16} />
          </>
        ) : state.kind === 'error' ? (
          <ErrorState
            error={state.error}
            message={t('farmer.listings.market.loadError')}
            retryTitle={t('farmer.common.retry')}
            offlineMessage={t('farmer.common.offline')}
            onRetry={() => void load()}
          />
        ) : state.items.length === 0 ? (
          <Text style={styles.emptyText}>{t('farmer.listings.mine.empty')}</Text>
        ) : (
          state.items.map((item) => {
            const tone = listingStatusTone(item.status);
            const badge = BADGE_TONE[tone];
            const offer = respondableOffer(item, nowMs);
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.card, cardToneStyle[tone]]}
                onPress={() => openListing(item)}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cropTitle}>{item.cropName}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: badge.backgroundColor }]}>
                    <Text style={[styles.statusText, { color: badge.color }]}>{statusLabel(item.status)}</Text>
                  </View>
                </View>
                <Text style={styles.cropSub}>
                  {t('farmer.listings.mine.cardSub', {
                    grade: gradeLabel(item.grade),
                    qty: formatKg(effectiveQuantityKg(item)),
                    price: formatMoneyAmount(effectivePricePerKg(item)),
                    date: shortDateLabel(item.createdAt),
                  })}
                </Text>
                {offer !== null ? (
                  <View style={[styles.alertStrip, { backgroundColor: P.twOrange100 }]}>
                    <Icon name="schedule" size={14} color={P.twOrange700} />
                    <Text style={[styles.alertText, { color: P.twOrange700 }]}>
                      {t('farmer.listings.mine.replyNeeded', { time: timeLeftLabel(offer.expiresAt, nowMs) })}
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: P.grey50 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: P.white,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.twGray200,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTextContainer: {
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: P.slate900,
  },
  headerSubtitle: {
    fontSize: typography.body,
    color: P.slate500,
    marginTop: 2,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  filterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignSelf: 'stretch',
    shadowColor: P.nearBlackDark1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterText: {
    fontSize: typography.bodyLarge,
    color: P.twGray800,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  filterCaret: {
    marginLeft: 'auto',
  },
  card: {
    backgroundColor: P.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: P.twGray100,
    shadowColor: P.nearBlackDark1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardCarrot: {
    borderColor: P.twPurple200,
    borderLeftWidth: 4,
    borderLeftColor: P.twPurple600,
  },
  cardFrenchBeans: {
    borderColor: P.twOrange100,
    borderLeftWidth: 4,
    borderLeftColor: P.twOrange500,
  },
  cardTomato: {
    borderColor: P.twGreen100,
    borderLeftWidth: 4,
    borderLeftColor: P.twGreen500,
  },
  cardCabbage: {
    borderColor: P.twRed100,
    borderLeftWidth: 4,
    borderLeftColor: P.twRed500,
  },
  cardPotato: {
    borderColor: P.twGray100,
    borderLeftWidth: 4,
    borderLeftColor: P.twGray400,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cropTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.slate900,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
  },
  cropSub: {
    fontSize: typography.body,
    color: P.slate500,
  },
  alertStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  alertText: {
    fontSize: typography.body,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: typography.body,
    color: P.slate500,
    textAlign: 'center',
    paddingVertical: 16,
  },
});
