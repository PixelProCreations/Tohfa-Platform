import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type AlertButton,
} from 'react-native';
import {
  createIdempotencyKeyCache,
  findMyListing,
  isStaleListingError,
  lineTotal,
  listingErrorMessageKey,
  priceChange,
  respondableOffer,
  respondToCounterOffer,
  formatKg,
  type CounterOffer,
  type Listing,
} from '../../api/listings';
import { formatMoneyAmount } from '../../api/wallet';
import { ErrorState, Icon, Skeleton } from '@tohfa/mobile-ui';
import { t } from '../../../../i18n/farmer';
import { authPalette as P, colors, typography } from '../../theme';
import { gradeLabel, kgLabel, moneyOrDash, pricePerKgLabel, timeLeftLabel, tk } from './listingFormat';

export interface CounterOfferScreenProps {
  /** The listing as the list that opened this screen just loaded it. */
  listing?: Listing | null | undefined;
  /**
   * When only an id is known (a notification deep link), the listing is
   * resolved from the farmer's own listings -- there is no GET /listings/{id}.
   */
  listingId?: string | undefined;
  /**
   * Opens a counter-price entry step. The approved design has no screen for
   * entering a counter price/quantity, so App passes nothing yet and the
   * "Counter back" button stays disabled until one is designed.
   */
  onCounter?: ((listing: Listing, offer: CounterOffer) => void) | undefined;
  /** After a response is recorded (or the offer turned out stale): back to a re-fetched list. */
  onSuccess?: (() => void) | undefined;
  onCancel?: (() => void) | undefined;
}

// ─────────────────────────────────────────────
// Data: the listing's active counter-offer (Listing.activeCounterOffer from
// GET /listings). Accept / "Withdraw" (= decline the counter: the only
// farmer action the API allows on a COUNTER_OFFERED listing, which goes back
// to the admin queue) call the counter-offer endpoints with an
// Idempotency-Key. BR-10 (the response window) is the server's: the timer
// reads `expiresAt`, and a late response is surfaced as the server's
// COUNTER_OFFER_EXPIRED.
//
// Left out of the approved design because nothing backs them (not faked):
//   - "within 24h / or it lapses": the window length is system_config
//     (`counter_offer_window_hours`) with no farmer-readable endpoint, and the
//     offer has no createdAt to derive it from;
//   - the "Inspection photo" card: the CounterOffer schema has no photo.
// ─────────────────────────────────────────────

type LoadState =
  | { kind: 'loading' }
  | { kind: 'error'; error: unknown }
  | { kind: 'notFound' }
  | { kind: 'ready'; listing: Listing };

/** How often the countdown re-renders; display cadence only, not a business window. */
const COUNTDOWN_TICK_MS = 30 * 1000;

export function CounterOfferScreen({
  listing: initialListing,
  listingId,
  onCounter,
  onSuccess,
  onCancel,
}: CounterOfferScreenProps): React.JSX.Element {
  const [state, setState] = useState<LoadState>(
    initialListing ? { kind: 'ready', listing: initialListing } : { kind: 'loading' },
  );
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [submitting, setSubmitting] = useState<'accept' | 'reject' | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef<boolean>(true);
  const inFlightRef = useRef<boolean>(false);
  const idempotencyRef = useRef(createIdempotencyKeyCache());

  const load = useCallback(async () => {
    if (initialListing) {
      setState({ kind: 'ready', listing: initialListing });
      return;
    }
    if (!listingId) {
      setState({ kind: 'notFound' });
      return;
    }
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setState({ kind: 'loading' });
    try {
      const found = await findMyListing(listingId, controller.signal);
      if (controller.signal.aborted) return;
      setNowMs(Date.now());
      setState(found ? { kind: 'ready', listing: found } : { kind: 'notFound' });
    } catch (error) {
      if (controller.signal.aborted) return;
      setState({ kind: 'error', error });
    }
  }, [initialListing, listingId]);

  useEffect(() => {
    mountedRef.current = true;
    void load();
    return () => {
      mountedRef.current = false;
      controllerRef.current?.abort();
    };
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), COUNTDOWN_TICK_MS);
    return () => clearInterval(id);
  }, []);

  const listing = state.kind === 'ready' ? state.listing : null;
  // Only an ADMIN offer is shown here; the farmer's own counter is waiting on the admin.
  const offer = listing?.activeCounterOffer?.offeredBy === 'ADMIN' ? listing.activeCounterOffer : null;
  const canRespond = listing !== null && respondableOffer(listing, nowMs) !== null;
  const busy = submitting !== null;

  const respond = async (kind: 'accept' | 'reject') => {
    // A ref, not the `submitting` state: two taps inside one render would both
    // read the same stale state and fire two requests.
    if (inFlightRef.current || listing === null || offer === null) return;
    inFlightRef.current = true;
    setSubmitting(kind);
    try {
      // No client-side expiry check here: if the window closed since the last
      // countdown tick, the server's COUNTER_OFFER_EXPIRED (BR-10) is shown.
      await respondToCounterOffer(
        listing.id,
        offer.id,
        kind === 'accept' ? { kind: 'accept' } : { kind: 'reject' },
        idempotencyRef.current.keyFor(`${kind}:${offer.id}`),
      );
      inFlightRef.current = false;
      if (!mountedRef.current) return;
      setSubmitting(null);
      Alert.alert(
        kind === 'accept' ? t('farmer.listings.offer.acceptedTitle') : t('farmer.listings.offer.declinedTitle'),
        kind === 'accept' ? t('farmer.listings.offer.acceptedBody') : t('farmer.listings.offer.declinedBody'),
        [{ text: t('farmer.common.ok'), onPress: () => onSuccess?.() }],
        { cancelable: false },
      );
    } catch (error) {
      inFlightRef.current = false;
      if (!mountedRef.current) return;
      setSubmitting(null);
      // A stale offer (expired, already answered, listing moved on) cannot be
      // retried from here; OK returns to the list, which re-fetches.
      const okButton: AlertButton = isStaleListingError(error)
        ? { text: t('farmer.common.ok'), onPress: () => onSuccess?.() }
        : { text: t('farmer.common.ok') };
      Alert.alert(
        t('farmer.listings.offer.actionErrorTitle'),
        t(tk(listingErrorMessageKey(error, 'farmer.listings.error.generic'))),
        [okButton],
      );
    }
  };

  const confirmAccept = () => {
    if (offer === null) return;
    Alert.alert(
      t('farmer.listings.offer.acceptConfirmTitle'),
      t('farmer.listings.offer.acceptConfirmBody', {
        qty: formatKg(offer.quantityKg),
        price: formatMoneyAmount(offer.pricePerKg),
      }),
      [
        { text: t('farmer.common.cancel'), style: 'cancel' },
        { text: t('farmer.listings.offer.confirm'), onPress: () => void respond('accept') },
      ],
    );
  };

  const confirmReject = () => {
    Alert.alert(t('farmer.listings.offer.rejectConfirmTitle'), t('farmer.listings.offer.rejectConfirmBody'), [
      { text: t('farmer.common.cancel'), style: 'cancel' },
      { text: t('farmer.listings.offer.confirm'), style: 'destructive', onPress: () => void respond('reject') },
    ]);
  };

  const header = (
    <View style={styles.header}>
      <Pressable
        style={styles.backButton}
        onPress={onCancel}
        accessibilityRole="button"
        accessibilityLabel={t('farmer.common.back')}
      >
        <Icon name="arrow_back" size={20} color={colors.brandGreen} />
      </Pressable>
      <View style={styles.headerTextContainer}>
        <Text style={styles.headerTitle}>{t('farmer.listings.offer.title')}</Text>
        {listing !== null ? (
          <Text style={styles.headerSubtitle}>
            {t('farmer.listings.offer.subtitle', { crop: listing.cropName, grade: gradeLabel(listing.grade) })}
          </Text>
        ) : null}
      </View>
    </View>
  );

  if (listing === null || offer === null) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {header}
          {state.kind === 'loading' ? (
            <View style={styles.scrollContent}>
              <Skeleton width="100%" height={72} borderRadius={12} />
              <View style={styles.skeletonGap} />
              <Skeleton width="100%" height={160} borderRadius={12} />
            </View>
          ) : state.kind === 'error' ? (
            <View style={styles.centerFill}>
              <ErrorState
                error={state.error}
                message={t('farmer.listings.offer.loadError')}
                retryTitle={t('farmer.common.retry')}
                offlineMessage={t('farmer.common.offline')}
                onRetry={() => void load()}
              />
            </View>
          ) : (
            <View style={styles.centerFill}>
              <Text style={styles.emptyText}>{t('farmer.listings.offer.notOpen')}</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const askTotal = lineTotal(listing.askingPricePerKg, listing.quantityKg);
  const offerTotal = lineTotal(offer.pricePerKg, offer.quantityKg);
  const change = priceChange(listing.askingPricePerKg, offer.pricePerKg);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {/* Header */}
        {header}

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Timer Banner */}
          <View style={styles.timerBanner}>
            <View style={styles.timerLeft}>
              <Icon name="schedule" size={28} color={P.coralMid2} />
              <View style={styles.timerTextContainer}>
                <Text style={styles.timerTopLabel}>{t('farmer.listings.offer.timerLabel')}</Text>
                {canRespond ? (
                  <Text style={styles.timerMainValue}>
                    {timeLeftLabel(offer.expiresAt, nowMs)}{' '}
                    <Text style={styles.timerLeftLabel}>{t('farmer.listings.offer.timerLeft')}</Text>
                  </Text>
                ) : (
                  <Text style={styles.timerMainValue}>{t('farmer.listings.offer.expired')}</Text>
                )}
              </View>
            </View>
          </View>

          <Text style={styles.sectionHeader}>{t('farmer.listings.offer.compareTitle')}</Text>

          {/* Cards */}
          <View style={styles.cardsRow}>
            {/* Ask Card */}
            <View style={styles.askCard}>
              <Text style={styles.cardHeaderAsk}>{t('farmer.listings.offer.yourAsk')}</Text>
              <View style={styles.cardField}>
                <Text style={styles.cardFieldLabel}>{t('farmer.listings.detail.quantity')}</Text>
                <Text style={styles.cardFieldValue}>{kgLabel(listing.quantityKg)}</Text>
              </View>
              <View style={styles.cardField}>
                <Text style={styles.cardFieldLabel}>{t('farmer.listings.offer.price')}</Text>
                <Text style={styles.cardFieldValue}>{pricePerKgLabel(listing.askingPricePerKg)}</Text>
              </View>
              <View style={styles.dashedDivider} />
              <View style={styles.cardField}>
                <Text style={styles.cardFieldLabel}>{t('farmer.listings.offer.total')}</Text>
                <Text style={styles.cardFieldValue}>{moneyOrDash(askTotal)}</Text>
              </View>
            </View>

            {/* Counter Card */}
            <View style={styles.counterCard}>
              <Text style={styles.cardHeaderCounter}>{t('farmer.listings.offer.adminCounter')}</Text>
              <View style={styles.cardField}>
                <Text style={[styles.cardFieldLabel, styles.counterColor]}>{t('farmer.listings.detail.quantity')}</Text>
                <Text style={[styles.cardFieldValue, styles.counterColor]}>{kgLabel(offer.quantityKg)}</Text>
              </View>
              <View style={styles.cardField}>
                <Text style={[styles.cardFieldLabel, styles.counterColor]}>{t('farmer.listings.offer.price')}</Text>
                <Text style={[styles.cardFieldValue, styles.counterColor]}>
                  {pricePerKgLabel(offer.pricePerKg)}
                  {change !== null && change.percent > 0 ? (
                    <Text style={styles.discountText}>
                      {' '}
                      {change.direction === 'down'
                        ? t('farmer.listings.offer.priceDown', { percent: change.percent })
                        : t('farmer.listings.offer.priceUp', { percent: change.percent })}
                    </Text>
                  ) : null}
                </Text>
              </View>
              <View style={[styles.dashedDivider, styles.dashedDividerCounter]} />
              <View style={styles.cardField}>
                <Text style={[styles.cardFieldLabel, styles.counterColor]}>{t('farmer.listings.offer.total')}</Text>
                <Text style={[styles.cardFieldValue, styles.counterColor]}>{moneyOrDash(offerTotal)}</Text>
              </View>
            </View>
          </View>

          {/* Admin Reason */}
          {offer.message ? (
            <View style={styles.reasonCard}>
              <View style={styles.reasonHeaderRow}>
                <Icon name="info" size={18} color={P.grey600} />
                <Text style={styles.reasonHeader}>{t('farmer.listings.offer.reasonTitle')}</Text>
              </View>
              <Text style={styles.reasonText}>{offer.message}</Text>
            </View>
          ) : null}

        </ScrollView>

        {/* Bottom Bar */}
        <View style={styles.bottomBar}>
          <Pressable
            style={[styles.actionBtn, styles.btnAccept, !canRespond || busy ? styles.btnDisabled : null]}
            onPress={confirmAccept}
            disabled={!canRespond || busy}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.listings.offer.accept')}
            accessibilityState={{ disabled: !canRespond || busy, busy: submitting === 'accept' }}
          >
            <View style={styles.btnAcceptIconContainer}>
              <Icon name="check" size={14} color={colors.brandGreen} />
            </View>
            <Text style={styles.btnAcceptText}>{t('farmer.listings.offer.accept')}</Text>
          </Pressable>
          <Pressable
            style={[
              styles.actionBtn,
              styles.btnCounter,
              !canRespond || busy || !onCounter ? styles.btnDisabled : null,
            ]}
            onPress={() => onCounter?.(listing, offer)}
            disabled={!canRespond || busy || !onCounter}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.listings.offer.counterBack')}
            accessibilityState={{ disabled: !canRespond || busy || !onCounter }}
            {...(onCounter ? {} : { accessibilityHint: t('farmer.listings.offer.counterBackUnavailable') })}
          >
            <Icon name="swap_horiz" size={18} color={P.deepPurple500} />
            <Text style={styles.btnCounterText}>{t('farmer.listings.offer.counterBack')}</Text>
          </Pressable>
          <Pressable
            style={[styles.actionBtn, styles.btnWithdraw, !canRespond || busy ? styles.btnDisabled : null]}
            onPress={confirmReject}
            disabled={!canRespond || busy}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.listings.offer.withdraw')}
            accessibilityState={{ disabled: !canRespond || busy, busy: submitting === 'reject' }}
          >
            <Icon name="close" size={18} color={P.greyDeep1} />
            <Text style={styles.btnWithdrawText}>{t('farmer.listings.offer.withdraw')}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.tanTint9,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: P.greyTint1,
    backgroundColor: P.weatherCloudWhite,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.greenTint5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: P.nearBlackDark3,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: typography.body,
    color: P.grey500,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  timerBanner: {
    flexDirection: 'row',
    backgroundColor: P.tanTint8,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  timerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerTextContainer: {
    marginLeft: 12,
  },
  timerTopLabel: {
    fontSize: typography.caption,
    fontWeight: '800',
    color: P.coralMid2,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  timerMainValue: {
    fontSize: typography.title,
    fontWeight: '800',
    color: P.rustDeep1,
  },
  timerLeftLabel: {
    fontSize: typography.body,
    fontWeight: '500',
    color: P.rustDeep1,
  },
  timerRight: {
    alignItems: 'flex-end',
  },
  timerRightText: {
    fontSize: typography.caption,
    color: P.coralMid4,
    fontWeight: '500',
  },
  sectionHeader: {
    fontSize: typography.bodySmall,
    fontWeight: '800',
    color: P.grey500,
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  askCard: {
    flex: 1,
    backgroundColor: P.weatherCloudWhite,
    borderWidth: 1,
    borderColor: P.borderLight,
    borderRadius: 12,
    padding: 16,
    marginRight: 8,
  },
  counterCard: {
    flex: 1,
    backgroundColor: P.violetTint1,
    borderWidth: 1.5,
    borderColor: P.violetLight1,
    borderRadius: 12,
    padding: 16,
    marginLeft: 8,
  },
  cardHeaderAsk: {
    fontSize: typography.caption,
    fontWeight: '800',
    color: P.grey500,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  cardHeaderCounter: {
    fontSize: typography.caption,
    fontWeight: '800',
    color: P.violetMid1,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  cardField: {
    marginBottom: 10,
  },
  cardFieldLabel: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: P.grey500,
    marginBottom: 2,
  },
  cardFieldValue: {
    fontSize: typography.bodyLarge,
    fontWeight: '800',
    color: P.grey900,
  },
  counterColor: {
    color: P.violetDeep1,
  },
  discountText: {
    fontSize: typography.bodySmall,
    fontWeight: '800',
    color: P.coralMid3,
  },
  dashedDivider: {
    height: 1,
    borderWidth: 1,
    borderColor: P.borderLight,
    borderStyle: 'dashed',
    marginVertical: 8,
    borderRadius: 1,
  },
  dashedDividerCounter: {
    borderColor: P.violetTint3,
  },
  reasonCard: {
    backgroundColor: P.weatherCloudWhite,
    borderWidth: 1,
    borderColor: P.borderLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  reasonHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reasonHeader: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.grey800,
    marginLeft: 8,
  },
  reasonText: {
    fontSize: typography.body,
    color: P.greyDeep1,
    lineHeight: 20,
  },
  boldText: {
    fontWeight: '700',
    color: P.grey800,
  },
  photoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.weatherCloudWhite,
    borderWidth: 1,
    borderColor: P.borderLight,
    borderRadius: 12,
    padding: 12,
  },
  photoIconBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: P.grey100,
    borderWidth: 1.5,
    borderColor: P.grey300,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  photoTextContainer: {
    flex: 1,
  },
  photoTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.grey900,
    marginBottom: 2,
  },
  photoSubtitle: {
    fontSize: typography.bodySmall,
    color: P.grey500,
  },
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: P.weatherCloudWhite,
    borderTopWidth: 1,
    borderTopColor: P.greyTint1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
    marginHorizontal: 4,
  },
  btnAccept: {
    backgroundColor: colors.brandGreen,
  },
  btnAcceptIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: P.weatherCloudWhite,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  btnAcceptText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.weatherCloudWhite,
  },
  btnCounter: {
    backgroundColor: P.weatherCloudWhite,
    borderWidth: 1,
    borderColor: P.violetMid1,
  },
  btnCounterText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.violetMid1,
    marginTop: 2,
  },
  btnWithdraw: {
    backgroundColor: P.weatherCloudWhite,
    borderWidth: 1,
    borderColor: P.grey300,
  },
  btnWithdrawText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.greyDeep1,
    marginTop: 2,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  skeletonGap: {
    height: 12,
  },
  centerFill: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: typography.body,
    color: P.grey500,
    textAlign: 'center',
  },
});

