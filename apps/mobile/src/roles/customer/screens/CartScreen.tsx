import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  StatusBar,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useQueryClient } from '@tanstack/react-query';
import {
  customerColors,
  customerFonts,
  customerSpacing,
  customerShadow,
} from '../theme';
import { t } from '../../../i18n/customer';
import { gradeLabel } from '../api/catalog';
import {
  cartLineKey,
  cartQueryKeys,
  cartToPutItems,
  reReserveCart,
  useCart,
  useReplaceCart,
  withLineQty,
  type Cart,
  type CartLine,
} from '../api/cart';
import { istDate, useDeliverySlots, useOrderQuote, type CheckoutInput, type DeliverySlot } from '../api/orders';
import { defaultPickupPoint, usePickupPoints, type PickupPoint } from '../api/pickup';
import { formatAddressLine, pickDefaultAddress, useAddresses } from '../api/addresses';
import { mapProblem } from '../api/problem';
import { checkoutDraftStore, useCheckoutDraftState } from '../state/checkoutDraft';
import { CustomerDeliveryAddressModal } from '../components';
import { canStepDown, canStepUp, formatKg, formatRupees, stepKg } from '../utils/money';

// ── SVG ICONS ───────────────────────────────────────────────────────────────

const BackArrowSvg = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 12H5M5 12L12 19M5 12L12 5"
      stroke={customerColors.neutral.neutral900}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const LocationPinSvg = ({ color = customerColors.palette.blue.sky }: { color?: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 21C16 16.5 19 12.2 19 8.5C19 4.9 15.9 2 12 2C8.1 2 5 4.9 5 8.5C5 12.2 8 16.5 12 21Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={12} cy={8.5} r={2.5} stroke={color} strokeWidth={2} />
  </Svg>
);

const ChevronDownSvg = ({ color = customerColors.palette.blue.sky }: { color?: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 9l6 6 6-6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const TrashSvg = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
      stroke={customerColors.legacy.red}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M10 11v6M14 11v6" stroke={customerColors.legacy.red} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const EditMemoSvg = () => (
  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
    <Path
      d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
      stroke={customerColors.neutral.neutral900}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
      stroke={customerColors.neutral.neutral900}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CartFloatingSvg = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path
      d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"
      stroke={customerColors.white}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={10} cy={20} r={1.5} fill={customerColors.white} />
    <Circle cx={18} cy={20} r={1.5} fill={customerColors.white} />
  </Svg>
);

// ── TYPES ───────────────────────────────────────────────────────────────────

export type DeliveryState = 'home' | 'pickup' | 'customize';

export interface CartScreenProps {
  onNavigate?: (screen: string, params?: Record<string, unknown>) => void;
  onGoBack?: () => void;
  onBack?: () => void;
}

const STEP = { step: '0.5', min: '0.5' };
const PUT_DEBOUNCE_MS = 400;
const SLOT_LABEL: Record<DeliverySlot, string> = {
  MORNING_8_12: '8 AM - 12 PM',
  AFTERNOON_12_4: '12 PM - 4 PM',
  EVENING_4_8: '4 PM - 8 PM',
};

/** `hh:mm:ss` until `iso`, or null when passed / absent. */
export function lockCountdown(iso: string | null | undefined, now: number): string | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - now;
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const s = Math.floor(ms / 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

/**
 * My cart (Figma 46:36486 empty, 46:38225, 46:38489 / 46:38618 / 46:38746 delivery modes).
 * Server cart only: quantity taps are debounced into ONE `PUT /cart` with every
 * line (optimistic, rolled back on 409); the 24 h reservation (BR-22) counts
 * down from `lockExpiresAt`; fees come from `POST /orders/quote`. The chosen
 * mode/warehouse/address/slot is handed to Checkout via state/checkoutDraft.
 */
export const CartScreen: React.FC<CartScreenProps> = ({ onNavigate, onGoBack, onBack }) => {
  const cartQuery = useCart();
  const replaceCartM = useReplaceCart();
  const qc = useQueryClient();
  const addressesQuery = useAddresses();
  const pickupQuery = usePickupPoints();
  const draftState = useCheckoutDraftState();

  // Local, not-yet-sent quantity edits (flushed as one PUT after PUT_DEBOUNCE_MS).
  const [pendingCart, setPendingCart] = useState<Cart | null>(null);
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [banner, setBanner] = useState<string | null>(draftState.notice);
  const [now, setNow] = useState(() => Date.now());

  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [deliveryState, setDeliveryState] = useState<DeliveryState>(draftState.homeDeliveryDisabled ? 'pickup' : 'home');
  const [marketDropdownVisible, setMarketDropdownVisible] = useState(false);
  const [customPointId, setCustomPointId] = useState<string | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [dayOffset, setDayOffset] = useState<0 | 1>(0);
  const [slot, setSlot] = useState<DeliverySlot | null>(null);

  const serverCart = cartQuery.data;
  const cart = pendingCart ?? serverCart;
  const items: CartLine[] = cart?.items ?? [];
  const addresses = addressesQuery.data;
  const address = addresses?.find((a) => a.id === selectedAddressId) ?? pickDefaultAddress(addresses);
  const points = pickupQuery.data;
  const nearest = defaultPickupPoint(points, address?.nearestPickupPointId ?? serverCart?.warehouseId ?? null);
  const customPoint = points?.find((p) => p.id === customPointId) ?? nearest;
  const pickupPoint = deliveryState === 'customize' ? customPoint : nearest;
  const warehouseId =
    deliveryState === 'home' ? (serverCart?.warehouseId ?? nearest?.id ?? null) : (pickupPoint?.id ?? null);
  const deliveryDate = istDate(dayOffset);
  const slotsQuery = useDeliverySlots(deliveryState === 'home' ? warehouseId : null, deliveryDate);

  // Show a one-shot notice handed back by Checkout (e.g. 409 STOCK_UNAVAILABLE).
  useEffect(() => {
    if (draftState.notice) {
      setBanner(draftState.notice);
      checkoutDraftStore.setNotice(null);
    }
  }, [draftState.notice]);

  // BR-22 countdown tick.
  useEffect(() => {
    if (!serverCart?.lockExpiresAt) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [serverCart?.lockExpiresAt]);

  useEffect(
    () => () => {
      if (pendingTimer.current) clearTimeout(pendingTimer.current);
    },
    [],
  );

  const draftInput: Partial<CheckoutInput> | null =
    warehouseId && items.length > 0
      ? deliveryState === 'home'
        ? {
            fulfillmentType: 'HOME_DELIVERY',
            warehouseId,
            deliveryAddressId: address?.id ?? null,
            deliveryDate,
            ...(slot ? { deliverySlot: slot } : {}),
            paymentMethod: 'WALLET',
          }
        : { fulfillmentType: 'WAREHOUSE_PICKUP', warehouseId, paymentMethod: 'WALLET' }
      : null;
  // Quote only once the server cart sits at that warehouse and no edit is pending.
  const quoteQuery = useOrderQuote(pendingCart === null && serverCart?.warehouseId === warehouseId ? draftInput : null);
  const quote = quoteQuery.data;

  const countdown = lockCountdown(serverCart?.lockExpiresAt, now);
  const lockExpired = !!serverCart?.lockExpiresAt && countdown === null;
  const hasUnavailable = items.some((l) => l.availability === 'UNAVAILABLE');
  const missingDelivery = deliveryState === 'home' && (!address || !slot);
  const checkoutDisabled =
    items.length === 0 ||
    hasUnavailable ||
    missingDelivery ||
    !warehouseId ||
    (serverCart?.status !== 'ACTIVE' && serverCart?.status !== 'LOCKED');

  const showProblem = (err: unknown) => {
    const p = mapProblem(err);
    if (p.silent) return;
    setBanner(p.message);
    if (p.action === 'refresh_cart') void qc.invalidateQueries({ queryKey: cartQueryKeys.cart });
  };

  const sendCart = (next: Cart) => {
    replaceCartM.mutate(
      { warehouseId: serverCart?.warehouseId ?? warehouseId, items: cartToPutItems(next), optimistic: next },
      {
        onSettled: () => setPendingCart(null),
        onError: showProblem,
      },
    );
  };

  // ── STEPPER HANDLERS (debounced single PUT) ──────────────────────────────
  const changeQty = (line: CartLine, dir: 1 | -1) => {
    if (!cart) return;
    const key = cartLineKey(line);
    const currentLine = cart.items.find((l) => cartLineKey(l) === key) ?? line;
    if (dir === -1 && !canStepDown(currentLine.qtyKg, STEP)) {
      handleRemoveItem(currentLine);
      return;
    }
    const nextQty = stepKg(currentLine.qtyKg, dir, { ...STEP, max: currentLine.availableKg });
    const next = withLineQty(cart, key, nextQty);
    setPendingCart(next);
    setBanner(null);
    if (pendingTimer.current) clearTimeout(pendingTimer.current);
    pendingTimer.current = setTimeout(() => {
      pendingTimer.current = null;
      sendCart(next);
    }, PUT_DEBOUNCE_MS);
  };

  const handleRemoveItem = (line: CartLine) => {
    if (!cart) return;
    if (pendingTimer.current) clearTimeout(pendingTimer.current);
    const next = withLineQty(cart, cartLineKey(line), '0.000');
    setPendingCart(next);
    sendCart(next);
  };

  const handleReReserve = async () => {
    if (!serverCart) return;
    try {
      const fresh = await reReserveCart(serverCart, warehouseId);
      qc.setQueryData(cartQueryKeys.cart, fresh);
      setBanner(null);
    } catch (err) {
      showProblem(err);
    }
  };

  // ── PAY & CHECKOUT HANDLER ────────────────────────────────────────────────
  const handleCheckout = async () => {
    if (checkoutDisabled || !serverCart || !warehouseId) {
      if (hasUnavailable) Alert.alert(t('customer.cart.screen.oos.title'), t('customer.cart.screen.oos.body'));
      return;
    }
    try {
      // Stock is per warehouse: move the reservation before checking out (BR-22).
      if (serverCart.warehouseId !== warehouseId || lockExpired) {
        const moved = await replaceCartM.mutateAsync({ warehouseId, items: cartToPutItems(serverCart) });
        qc.setQueryData(cartQueryKeys.cart, moved);
      }
    } catch (err) {
      showProblem(err);
      return;
    }
    checkoutDraftStore.setDraft(
      deliveryState === 'home'
        ? { fulfillmentType: 'HOME_DELIVERY', warehouseId, deliveryAddressId: address?.id ?? null, deliveryDate, deliverySlot: slot ?? undefined }
        : { fulfillmentType: 'WAREHOUSE_PICKUP', warehouseId },
    );
    onNavigate?.('Checkout');
  };

  const pointInfo = (p: PickupPoint | null | undefined) =>
    p ? (
      <View style={styles.deliveryContentTextCol}>
        {!!p.phone && <Text style={styles.pickupPhoneHeader}>{t('customer.cart.screen.market.phone', { phone: p.phone })}</Text>}
        <Text style={styles.pickupMarketDesc}>{p.address ?? p.name}</Text>
        <Text style={styles.pickupMarketDesc}>
          {p.isOpenNow ? t('customer.cart.screen.market.openNow') : t('customer.cart.screen.market.closedNow')}
          {typeof p.distanceKm === 'number' ? ` · ${p.distanceKm.toFixed(1)} km` : ''}
        </Text>
      </View>
    ) : (
      <View style={styles.deliveryContentTextCol}>
        <Text style={styles.pickupMarketDesc}>{pickupQuery.isLoading ? t('customer.cart.screen.market.loading') : t('customer.cart.screen.market.none')}</Text>
      </View>
    );

  if (cartQuery.isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator testID="cart-loading" style={{ marginTop: 64 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ── TOP HEADER (Back Button + Editorial Title) ──────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => (onGoBack ? onGoBack() : (onBack ? onBack() : onNavigate?.('Home')))}
          style={styles.backButton}
          accessibilityLabel={t('customer.cart.screen.back')}
        >
          <BackArrowSvg />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('customer.cart.screen.title')}</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {cartQuery.isError && (
          <View style={styles.emptyCartWrap} testID="cart-error">
            <Text style={styles.emptyCartText}>{mapProblem(cartQuery.error).message}</Text>
            <TouchableOpacity onPress={() => void cartQuery.refetch()}>
              <Text style={styles.readPolicyLink}>{t('customer.cart.screen.retry')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {!!banner && (
          <TouchableOpacity onPress={() => setBanner(null)} style={styles.savingsPill} testID="cart-banner" accessibilityRole="alert">
            <Text style={styles.savingsText}>{banner}</Text>
          </TouchableOpacity>
        )}

        {/* ── BR-22 reservation countdown [needs design review] ── */}
        {items.length > 0 && countdown !== null && (
          <View style={styles.savingsPill} testID="cart-lock-countdown">
            <Text style={styles.savingsText}>{t('customer.cart.screen.reserved', { time: countdown })}</Text>
          </View>
        )}
        {items.length > 0 && lockExpired && (
          <TouchableOpacity style={styles.savingsPill} onPress={() => void handleReReserve()} testID="cart-lock-expired">
            <Text style={styles.savingsText}>{t('customer.cart.screen.expired')}</Text>
          </TouchableOpacity>
        )}

        {/* ── TOP BANNER (Add delivery details / Saved Address) ─────────────── */}
        {deliveryState === 'home' && (
          <TouchableOpacity activeOpacity={0.8} onPress={() => setAddressModalVisible(true)} style={styles.deliveryBanner}>
            <View style={styles.deliveryBannerLeft}>
              <LocationPinSvg color={customerColors.palette.blue.sky} />
              <Text style={styles.deliveryBannerText} numberOfLines={1}>
                {address ? formatAddressLine(address) : t('customer.cart.screen.addDetails')}
              </Text>
            </View>
            <ChevronDownSvg color={customerColors.palette.blue.sky} />
          </TouchableOpacity>
        )}

        {/* ── 1. REVIEW ITEMS SECTION ───────────────────────────────────────── */}
        <View style={styles.reviewItemsContainer}>
          <View style={styles.reviewItemsHeader}>
            <Text style={styles.reviewItemsTitle}>{t('customer.cart.screen.review')}</Text>
            <Text style={styles.reviewItemsCount}>
              {t(items.length === 1 ? 'customer.cart.screen.itemOne' : 'customer.cart.screen.itemMany', { count: items.length })}
            </Text>
          </View>

          <View style={styles.itemsList}>
            {items.map((item, index) => {
              const unavailable = item.availability === 'UNAVAILABLE';
              return (
                <View key={cartLineKey(item)} testID={`cart-line-${cartLineKey(item)}`} style={[styles.itemRow, index < items.length - 1 && styles.itemRowDivider]}>
                  <View style={styles.itemImage} />
                  <View style={styles.itemInfo}>
                    <View style={styles.itemNameBadgeRow}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      {unavailable && (
                        <View style={styles.noStockBadge}>
                          <Text style={styles.noStockText}>{t('customer.cart.screen.noStock')}</Text>
                        </View>
                      )}
                      {item.availability === 'LOW_STOCK' && (
                        <View style={styles.noStockBadge}>
                          <Text style={styles.noStockText}>{t('customer.cart.screen.onlyLeft', { qty: formatKg(item.availableKg) })}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.itemSubtitle}>
                      {gradeLabel(item.grade)} · {t('customer.cart.screen.pricePerKg', { price: formatRupees(item.unitPrice) })}
                    </Text>
                  </View>

                  <View style={styles.itemRightCol}>
                    <View style={styles.itemPriceRow}>
                      <Text style={styles.itemCurrentPrice}>{formatRupees(item.lineTotal)}</Text>
                    </View>
                    {unavailable ? (
                      <TouchableOpacity activeOpacity={0.7} onPress={() => handleRemoveItem(item)} style={styles.removeOutlineBtn} testID={`cart-remove-${cartLineKey(item)}`}>
                        <TrashSvg />
                        <Text style={styles.removeOutlineBtnText}>{t('customer.cart.screen.remove')}</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.itemActionRow}>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => handleRemoveItem(item)}
                          style={styles.deleteIconButton}
                          testID={`cart-remove-${cartLineKey(item)}`}
                          accessibilityLabel={t('customer.cart.screen.remove')}
                        >
                          <TrashSvg />
                        </TouchableOpacity>
                        <View style={styles.stepperContainer}>
                          <TouchableOpacity activeOpacity={0.7} onPress={() => changeQty(item, -1)} style={styles.stepperAction} testID={`cart-dec-${cartLineKey(item)}`} accessibilityLabel={t('customer.cart.screen.decrease')}>
                            <Text style={styles.stepperSign}>−</Text>
                          </TouchableOpacity>
                          <Text style={styles.stepperQty}>{formatKg(item.qtyKg)}</Text>
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => changeQty(item, 1)}
                            disabled={!canStepUp(item.qtyKg, { ...STEP, max: item.availableKg })}
                            style={styles.stepperAction}
                            testID={`cart-inc-${cartLineKey(item)}`}
                            accessibilityLabel={t('customer.cart.screen.increase')}
                          >
                            <Text style={styles.stepperSign}>+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}

            {items.length === 0 && !cartQuery.isError && (
              <View style={styles.emptyCartWrap} testID="cart-empty">
                <Text style={styles.emptyCartText}>{t('customer.cart.screen.empty')}</Text>
                <TouchableOpacity onPress={() => onNavigate?.('Home')}>
                  <Text style={styles.readPolicyLink}>{t('customer.cart.screen.startShopping')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* ── 2. YOUR BILL SECTION (subtotal from the cart, fees from the quote) ── */}
        {items.length > 0 && (
          <View style={styles.billContainer}>
            <View style={styles.billHeader}>
              <Text style={styles.billHeaderTitle}>{t('customer.cart.screen.bill.title')}</Text>
            </View>
            <View style={styles.billBody}>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>{t('customer.cart.screen.bill.items')}</Text>
                <View style={styles.billPriceCol}>
                  <Text style={styles.billValue} testID="cart-subtotal">
                    {formatRupees(cart?.subtotal)}
                  </Text>
                </View>
              </View>
              {quote && (
                <>
                  <View style={styles.billRow}>
                    <Text style={[styles.billLabel, styles.underlinedLabel]}>{t('customer.cart.screen.bill.delivery')}</Text>
                    <View style={styles.billPriceCol}>
                      <Text style={styles.billValue}>{formatRupees(quote.deliveryFee)}</Text>
                    </View>
                  </View>
                  <View style={styles.billRow}>
                    <Text style={[styles.billLabel, styles.underlinedLabel]}>{t('customer.cart.screen.bill.handling')}</Text>
                    <View style={styles.billPriceCol}>
                      <Text style={styles.billValue}>{formatRupees(quote.handlingFee)}</Text>
                    </View>
                  </View>
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>{t('customer.cart.screen.bill.gst')}</Text>
                    <View style={styles.billPriceCol}>
                      <Text style={styles.billValue}>{formatRupees(quote.gstAmount)}</Text>
                    </View>
                  </View>
                </>
              )}
              <View style={styles.dottedDivider} />
              <View style={styles.billRow}>
                <Text style={styles.grandTotalLabel}>{t('customer.cart.screen.bill.grand')}</Text>
                <Text style={styles.grandTotalValue} testID="cart-grand-total">
                  {formatRupees(quote?.totalAmount ?? cart?.subtotal)}
                </Text>
              </View>
              {!quote && <Text style={styles.policyText}>{t('customer.cart.screen.bill.note')}</Text>}
            </View>
          </View>
        )}

        {/* ── 3. CHOOSE A DELIVERY STATES SECTION ─────────────────────────────── */}
        {items.length > 0 && (
          <View style={styles.deliveryStatesCard}>
            <View style={styles.deliveryStatesHeader}>
              <Text style={styles.deliveryStatesTitle}>{t('customer.cart.screen.mode.title')}</Text>
              {nearest && (
                <View style={styles.nearMarketHeaderRight}>
                  <Text style={styles.nearMarketHeaderLabel}>{t('customer.cart.screen.mode.yourNear')}</Text>
                  <Text style={styles.nearMarketHeaderGreen} numberOfLines={1}>{nearest.name}</Text>
                </View>
              )}
            </View>

            <View style={styles.deliveryStatesBody}>
              <View style={styles.deliveryRadiosRow}>
                {(
                  [
                    ['home', 'mode.home'],
                    ['pickup', 'mode.pickup'],
                    ['customize', 'mode.customize'],
                  ] as const
                )
                  .filter(([mode]) => !(mode === 'home' && draftState.homeDeliveryDisabled))
                  .map(([mode, label]) => (
                    <TouchableOpacity key={mode} activeOpacity={0.8} onPress={() => setDeliveryState(mode)} style={styles.radioOption} testID={`mode-${mode}`}>
                      <View style={[styles.radioCircle, deliveryState === mode && styles.radioCircleSelected]}>
                        {deliveryState === mode && <View style={styles.radioInnerDot} />}
                      </View>
                      <Text style={[styles.radioLabel, deliveryState === mode && styles.radioLabelSelected]} numberOfLines={1}>{t(`customer.cart.screen.${label}`)}</Text>
                    </TouchableOpacity>
                  ))}
              </View>

              {deliveryState === 'home' && (
                <>
                  <View style={styles.deliveryContentBox}>
                    <View style={styles.deliveryContentTextCol}>
                      {address ? (
                        <>
                          {!!address.contactPhone && <Text style={styles.deliveryPhoneText}>{address.contactPhone},</Text>}
                          <Text style={styles.deliveryAddressText}>{formatAddressLine(address)},</Text>
                          <Text style={styles.deliveryAddressText}>{address.state}.</Text>
                        </>
                      ) : (
                        <Text style={styles.deliveryAddressText}>{t('customer.cart.screen.address.add')}</Text>
                      )}
                    </View>
                    <TouchableOpacity activeOpacity={0.7} onPress={() => setAddressModalVisible(true)} style={styles.editOutlineBtn}>
                      <EditMemoSvg />
                      <Text style={styles.editOutlineBtnText}>{address ? t('customer.cart.screen.address.editBtn') : t('customer.cart.screen.address.addBtn')}</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Delivery date + slot (GET /delivery-slots). [needs design review: no Figma] */}
                  <View style={[styles.addressTypeRow, { marginTop: customerSpacing[12] }]}>
                    {([0, 1] as const).map((d) => (
                      <TouchableOpacity
                        key={d}
                        testID={`day-${d}`}
                        onPress={() => {
                          setDayOffset(d);
                          setSlot(null);
                        }}
                        style={[styles.inlineDropdownItem, dayOffset === d && styles.radioCircleSelected]}
                      >
                        <Text style={styles.inlineDropdownItemName}>{d === 0 ? t('customer.cart.screen.day.today') : t('customer.cart.screen.day.tomorrow')}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.inlineDropdownMenu} testID="slot-picker">
                    {slotsQuery.isLoading && <ActivityIndicator />}
                    {(slotsQuery.data ?? []).map((s) => {
                      const full = !s.bookable;
                      return (
                        <TouchableOpacity
                          key={s.slot}
                          testID={`slot-${s.slot}`}
                          disabled={full}
                          onPress={() => setSlot(s.slot)}
                          style={[styles.inlineDropdownItem, slot === s.slot && styles.radioCircleSelected, full && { opacity: 0.5 }]}
                        >
                          <Text style={styles.inlineDropdownItemName}>{s.label || SLOT_LABEL[s.slot]}</Text>
                          <View style={styles.openNowBadge}>
                            <Text style={styles.openNowBadgeText}>{full ? t('customer.cart.screen.slot.full') : s.available !== null ? t('customer.cart.screen.slot.left', { count: s.available }) : t('customer.cart.screen.slot.open')}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                    {slotsQuery.isError && <Text style={styles.pickupMarketDesc}>{mapProblem(slotsQuery.error).message}</Text>}
                  </View>
                </>
              )}

              {deliveryState === 'pickup' && (
                <View style={styles.deliveryContentBox} testID="pickup-nearest">
                  {pointInfo(nearest)}
                  {nearest && (
                    <View style={styles.yourNearSolidBadge}>
                      <Text style={styles.yourNearSolidBadgeText}>{nearest.name}</Text>
                    </View>
                  )}
                </View>
              )}

              {deliveryState === 'customize' && (
                <View style={styles.customizeContainer}>
                  <TouchableOpacity activeOpacity={0.85} onPress={() => setMarketDropdownVisible((prev) => !prev)} style={styles.customizeMarketDropdown} testID="market-dropdown">
                    <View style={styles.customizeDropdownLeft}>
                      <Text style={styles.customizeMarketNameText}>{customPoint?.name ?? t('customer.cart.screen.market.choose')}</Text>
                      {customPoint?.isNearest && (
                        <View style={styles.yourNearLightBadge}>
                          <Text style={styles.yourNearLightBadgeText}>{t('customer.cart.screen.market.yourNear')}</Text>
                        </View>
                      )}
                    </View>
                    <ChevronDownSvg color={customerColors.body} />
                  </TouchableOpacity>

                  {marketDropdownVisible && (
                    <View style={styles.inlineDropdownMenu}>
                      {(points ?? []).map((p) => (
                        <TouchableOpacity
                          key={p.id}
                          testID={`market-${p.id}`}
                          activeOpacity={0.7}
                          onPress={() => {
                            setCustomPointId(p.id);
                            setMarketDropdownVisible(false);
                          }}
                          style={styles.inlineDropdownItem}
                        >
                          <Text style={styles.inlineDropdownItemName}>{p.name}</Text>
                          <View style={styles.openNowBadge}>
                            <Text style={styles.openNowBadgeText}>{p.isOpenNow ? t('customer.cart.screen.market.openNow') : t('customer.cart.screen.market.closed')}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {!marketDropdownVisible && <View style={[styles.deliveryContentBox, { marginTop: customerSpacing[12] }]}>{pointInfo(customPoint)}</View>}
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── 4. RETURN / REFUND POLICY ─────────────────────────────────────── */}
        <View style={styles.policyContainer}>
          <Text style={styles.policyTitle}>{t('customer.cart.screen.policy.title')}</Text>
          <Text style={styles.policyText}>{t('customer.cart.screen.policy.tagline')}</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              Alert.alert(
                t('customer.cart.screen.policy.alertTitle'),
                t('customer.cart.screen.policy.alertBody'),
              )
            }
          >
            <Text style={styles.readPolicyLink}>{t('customer.cart.screen.policy.read')}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ── 5. STICKY BOTTOM CHECKOUT BAR ──────────────────────────────────── */}
      {items.length > 0 && (
        <View style={styles.bottomBar}>
          <View style={styles.bottomPillContainer}>
            <Text style={styles.bottomPriceText}>{formatRupees(quote?.totalAmount ?? cart?.subtotal)}</Text>

            {deliveryState === 'home' && !address ? (
              <TouchableOpacity activeOpacity={0.85} onPress={() => setAddressModalVisible(true)} style={styles.addAddressBtn} testID="cart-add-address">
                <Text style={styles.addAddressBtnText}>{t('customer.cart.screen.addAddress')}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                activeOpacity={checkoutDisabled ? 1 : 0.85}
                onPress={() => void handleCheckout()}
                disabled={checkoutDisabled || replaceCartM.isPending}
                style={[styles.payCheckoutBtn, checkoutDisabled && styles.payCheckoutBtnDisabled]}
                testID="cart-checkout"
              >
                <Text style={[styles.payCheckoutBtnText, checkoutDisabled && styles.payCheckoutBtnTextDisabled]}>
                  {missingDelivery ? t('customer.cart.screen.pickSlot') : t('customer.cart.screen.payCheckout')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.floatingCartCircle}>
            <CartFloatingSvg />
          </View>
        </View>
      )}

      {/* ── ADD ADDRESS (shared address flow, POST /customers/me/addresses) ── */}
      <CustomerDeliveryAddressModal
        visible={addressModalVisible}
        initialStep="addAddress"
        onClose={() => setAddressModalVisible(false)}
        onSaveAddress={(saved) => {
          setSelectedAddressId(saved.id);
          setAddressModalVisible(false);
        }}
        onUseCurrentLocation={() => {
          setAddressModalVisible(false);
          onNavigate?.('CustomerAddAddress', { addressSource: 'current' });
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: customerColors.palette.warm.offWhite,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 16 : 14,
    paddingBottom: 12,
    backgroundColor: customerColors.white,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: customerColors.neutral.neutral300,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  headerTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 22,
    color: customerColors.neutral.neutral900,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  // ── DELIVERY DETAILS TOP BANNER ───────────────────────────────────────────
  deliveryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: customerColors.palette.blue.skyWash,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: customerColors.palette.blue.skyTint,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  deliveryBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  deliveryBannerText: {
    fontSize: 12,
    color: customerColors.palette.blue.skyDeep,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },

  // ── 1. REVIEW ITEMS SECTION ───────────────────────────────────────────────
  reviewItemsContainer: {
    backgroundColor: customerColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: customerColors.neutral.neutral300,
    overflow: 'hidden',
    marginBottom: 16,
  },
  reviewItemsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: customerColors.shared.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  reviewItemsTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 15,
    color: customerColors.neutral.neutral900,
  },
  reviewItemsCount: {
    fontSize: 12,
    color: customerColors.neutral.neutral700,
    fontWeight: '500',
  },
  itemsList: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  itemRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: customerColors.neutral.neutral100,
  },
  itemImage: {
    width: 44,
    height: 44,
    marginRight: 10,
  },
  itemInfo: {
    flex: 1,
    marginRight: 8,
  },
  itemNameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 2,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: customerColors.neutral.neutral900,
  },
  itemSubtitle: {
    fontSize: 11,
    color: customerColors.neutral.neutral500,
  },
  noStockBadge: {
    backgroundColor: customerColors.palette.red.blush,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  noStockText: {
    fontSize: 10,
    fontWeight: '600',
    color: customerColors.legacy.red,
  },
  itemRightCol: {
    alignItems: 'flex-end',
  },
  itemPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemOldPrice: {
    fontSize: 11,
    color: customerColors.neutral.neutral500,
    textDecorationLine: 'line-through',
    marginRight: 4,
  },
  itemCurrentPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: customerColors.neutral.neutral900,
  },
  itemActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteIconButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: customerColors.shared.errorLight,
    borderWidth: 1,
    borderColor: customerColors.palette.red.blush,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: customerColors.neutral.neutral300,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: customerColors.white,
  },
  removeOutlineBtnText: {
    fontSize: 11,
    fontWeight: '500',
    color: customerColors.neutral.neutral800,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: customerColors.neutral.neutral300,
    borderRadius: 14,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  stepperAction: {
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperSign: {
    fontSize: 14,
    color: customerColors.neutral.neutral700,
    fontWeight: '600',
  },
  stepperQty: {
    fontSize: 12,
    fontWeight: '600',
    color: customerColors.neutral.neutral900,
    paddingHorizontal: 6,
  },
  emptyCartWrap: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyCartText: {
    fontSize: 14,
    color: customerColors.neutral.neutral500,
  },

  // ── 2. YOUR BILL SECTION ──────────────────────────────────────────────────
  billContainer: {
    backgroundColor: customerColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: customerColors.neutral.neutral300,
    overflow: 'hidden',
    marginBottom: 16,
  },
  billHeader: {
    backgroundColor: customerColors.palette.amber.peachWash,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  billHeaderTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 15,
    color: customerColors.neutral.neutral900,
  },
  billBody: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  billLabel: {
    fontSize: 13,
    color: customerColors.neutral.neutral600,
  },
  underlinedLabel: {
    textDecorationLine: 'underline',
  },
  billPriceCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  billOldPrice: {
    fontSize: 12,
    color: customerColors.neutral.neutral500,
    textDecorationLine: 'line-through',
    marginRight: 6,
  },
  billValue: {
    fontSize: 13,
    fontWeight: '600',
    color: customerColors.neutral.neutral900,
  },
  dottedDivider: {
    borderBottomWidth: 1,
    borderBottomColor: customerColors.neutral.neutral300,
    borderStyle: 'dashed',
    marginVertical: 6,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: customerColors.neutral.neutral900,
  },
  grandTotalValue: {
    fontSize: 15,
    fontWeight: '800',
    color: customerColors.primary,
  },
  savingsPill: {
    backgroundColor: customerColors.shared.primaryLight,
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '600',
    color: customerColors.primary,
  },

  // ── 3. CHOOSE A DELIVERY STATES SECTION (IMAGES 3, 4, 5) ───────────────────
  deliveryStatesCard: {
    backgroundColor: customerColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: customerColors.neutral.neutral300,
    overflow: 'hidden',
    marginBottom: 16,
  },
  deliveryStatesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: customerColors.palette.amber.peachWash,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  deliveryStatesTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 15,
    color: customerColors.neutral.neutral900,
    flexShrink: 0,
  },
  nearMarketHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    justifyContent: 'flex-end',
    gap: 2,
  },
  nearMarketHeaderLabel: {
    fontSize: 11,
    color: customerColors.neutral.neutral600,
    flexShrink: 0,
  },
  nearMarketHeaderGreen: {
    fontSize: 11,
    fontWeight: '700',
    color: customerColors.shared.success,
    flexShrink: 1,
  },
  deliveryStatesBody: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  deliveryRadiosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 4,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  radioCircle: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    borderWidth: 1.5,
    borderColor: customerColors.neutral.neutral500,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  radioCircleSelected: {
    borderColor: customerColors.brand,
  },
  radioInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: customerColors.brand,
  },
  radioLabel: {
    fontSize: 12.5,
    color: customerColors.muted,
    fontFamily: customerFonts.regular,
  },
  radioLabelSelected: {
    color: customerColors.body,
    fontFamily: customerFonts.regular,
    fontWeight: '600',
  },
  deliveryContentBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: customerColors.neutral.neutral50,
    borderRadius: 8,
    padding: 12,
  },
  deliveryContentTextCol: {
    flex: 1,
    marginRight: 10,
  },
  deliveryPersonName: {
    fontSize: 12,
    fontWeight: '600',
    color: customerColors.neutral.neutral900,
    lineHeight: 18,
  },
  deliveryPhoneText: {
    fontSize: 12,
    color: customerColors.neutral.neutral700,
    lineHeight: 18,
  },
  deliveryAddressText: {
    fontSize: 12,
    color: customerColors.neutral.neutral700,
    lineHeight: 18,
  },
  editOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: customerColors.neutral.neutral300,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: customerColors.white,
  },
  editOutlineBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: customerColors.neutral.neutral900,
  },
  pickupPhoneHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: customerColors.neutral.neutral900,
    marginBottom: 4,
  },
  pickupMarketDesc: {
    fontSize: 12,
    color: customerColors.neutral.neutral700,
    lineHeight: 18,
  },
  yourNearSolidBadge: {
    backgroundColor: customerColors.palette.green.basil,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  yourNearSolidBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: customerColors.white,
  },
  customizeContainer: {
    marginTop: 4,
    position: 'relative',
    zIndex: 10,
  },
  customizeMarketDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: customerColors.neutral.neutral400,
    borderRadius: 10,
    paddingHorizontal: customerSpacing[16],
    paddingVertical: 12,
    backgroundColor: customerColors.surface,
  },
  customizeDropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customizeMarketNameText: {
    fontSize: 15,
    fontFamily: customerFonts.regular,
    color: customerColors.body,
  },
  yourNearLightBadge: {
    backgroundColor: customerColors.surfaceSelected,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  yourNearLightBadgeText: {
    fontSize: 11,
    fontFamily: customerFonts.regular,
    color: customerColors.brand,
  },
  inlineDropdownMenu: {
    borderWidth: 1,
    borderColor: customerColors.neutral.neutral300,
    borderRadius: 12,
    backgroundColor: customerColors.surface,
    marginTop: 6,
    overflow: 'hidden',
    ...customerShadow.subtle,
  },
  inlineDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: customerColors.neutral.neutral100,
  },
  inlineDropdownItemName: {
    fontSize: 15,
    color: customerColors.neutral.neutral950,
    fontFamily: customerFonts.regular,
  },
  openNowBadge: {
    backgroundColor: customerColors.surfaceSelected,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  openNowBadgeText: {
    fontSize: 11,
    fontFamily: customerFonts.regular,
    color: customerColors.brand,
  },

  // ── 4. RETURN / REFUND POLICY ─────────────────────────────────────────────
  policyContainer: {
    paddingHorizontal: 4,
    marginBottom: 20,
  },
  policyTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 15,
    color: customerColors.neutral.neutral900,
    marginBottom: 4,
  },
  policyText: {
    fontSize: 12,
    color: customerColors.neutral.neutral600,
    lineHeight: 18,
    marginBottom: 6,
  },
  readPolicyLink: {
    fontSize: 12,
    fontWeight: '600',
    color: customerColors.primary,
  },

  // ── 5. STICKY BOTTOM CHECKOUT BAR ─────────────────────────────────────────
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'android' ? 16 : 24,
    paddingTop: 12,
    backgroundColor: customerColors.overlay.white95,
    borderTopWidth: 1,
    borderTopColor: customerColors.neutral.neutral100,
  },
  bottomPillContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: customerColors.white,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: customerColors.neutral.neutral300,
    paddingLeft: 16,
    paddingRight: 4,
    paddingVertical: 4,
    marginRight: 12,
    shadowColor: customerColors.neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bottomPriceText: {
    fontSize: 16,
    fontWeight: '800',
    color: customerColors.neutral.neutral900,
  },
  addAddressBtn: {
    backgroundColor: customerColors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
  },
  addAddressBtnText: {
    color: customerColors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  payCheckoutBtn: {
    backgroundColor: customerColors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
  },
  payCheckoutBtnDisabled: {
    backgroundColor: customerColors.neutral.neutral400,
  },
  payCheckoutBtnText: {
    color: customerColors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  payCheckoutBtnTextDisabled: {
    color: customerColors.white,
  },
  floatingCartCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: customerColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: customerColors.neutral.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },

  // ── MODAL: SCREEN 2 - ADD ADDRESS ─────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: customerColors.overlay.scrim45,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  addressModalCard: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: customerColors.white,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 20,
    position: 'relative',
    shadowColor: customerColors.neutral.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: -12,
    right: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: customerColors.white,
    borderWidth: 1,
    borderColor: customerColors.neutral.neutral300,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 4,
  },
  addressModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressModalTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 18,
    color: customerColors.neutral.neutral900,
  },
  resetText: {
    fontSize: 13,
    fontWeight: '600',
    color: customerColors.primary,
  },
  addressModalScroll: {
    paddingBottom: 10,
  },
  formSectionHeader: {
    fontFamily: customerFonts.editorial,
    fontSize: 14,
    color: customerColors.neutral.neutral900,
    marginBottom: 6,
  },
  formInputLine: {
    borderBottomWidth: 1,
    borderBottomColor: customerColors.neutral.neutral300,
    fontSize: 13,
    color: customerColors.neutral.neutral900,
    paddingVertical: 6,
    marginBottom: 8,
  },
  formRow: {
    flexDirection: 'row',
  },
  marketSelectorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: customerColors.neutral.neutral300,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  marketSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  marketSelectorText: {
    fontSize: 13,
    fontWeight: '600',
    color: customerColors.neutral.neutral900,
  },
  addressTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 12,
  },
  addressTypeRadio: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircleSmall: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: customerColors.neutral.neutral500,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  radioCircleSmallSelected: {
    borderColor: customerColors.primary,
  },
  radioSmallInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: customerColors.primary,
  },
  addressTypeRadioText: {
    fontSize: 13,
    color: customerColors.neutral.neutral700,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: customerColors.neutral.neutral500,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxBoxChecked: {
    backgroundColor: customerColors.primary,
    borderColor: customerColors.primary,
  },
  checkboxCheckmark: {
    color: customerColors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: 12,
    color: customerColors.neutral.neutral700,
  },
  saveAddressBtn: {
    backgroundColor: customerColors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveAddressBtnText: {
    color: customerColors.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
