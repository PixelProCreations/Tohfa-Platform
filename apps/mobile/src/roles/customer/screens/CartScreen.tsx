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
import { EmptyState } from '@tohfa/mobile-ui';
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
    const lockExpiresAt = cart?.lockExpiresAt;
    if (!lockExpiresAt) {
      setTimeLeft('');
      return;
    }
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const expiresAt = new Date(lockExpiresAt).getTime();
      const diff = expiresAt - now;
      if (diff <= 0) {
        setTimeLeft('Expired');
        clearInterval(timer);
      } else {
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [cart?.lockExpiresAt]);

  if (isLoading) return <ActivityIndicator style={styles.centered} />;
  if (error) return (
    <View style={styles.centered}>
      <Text style={styles.errorText}>Error loading cart. The lock might be expired.</Text>
      <TouchableOpacity onPress={() => refetch()} style={styles.button}>
        <Text style={styles.buttonText}>Refresh Cart</Text>
      </TouchableOpacity>
    </View>
  );

  if (!cart || cart.items.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Your cart is empty.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Cart</Text>
        {timeLeft ? <Text style={styles.timerText}>Reserved for: {timeLeft}</Text> : null}
      </View>
      <FlatList
        data={cart.items}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <Text style={styles.itemName}>{item.name} ({item.qtyKg} kg)</Text>
            <Text style={styles.itemPrice}>₹{item.lineTotal}</Text>
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
              <EmptyState
                variant="compact"
                iconName="shopping_cart"
                title={t('customer.cart.screen.empty')}
                action={{ label: t('customer.cart.screen.startShopping'), onPress: () => onNavigate?.('Home') }}
                testID="cart-empty"
              />
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
  container: { flex: 1, backgroundColor: colors.white },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: neutral('neutral300'), flexDirection: 'row', justifyContent: 'space-between' },
  headerText: { fontSize: 24, fontWeight: 'bold' },
  timerText: { fontSize: 14, color: colors.secondary, alignSelf: 'center' },
  itemRow: { padding: 16, borderBottomWidth: 1, borderBottomColor: neutral('neutral300'), flexDirection: 'row', justifyContent: 'space-between' },
  itemName: { fontSize: 16 },
  itemPrice: { fontSize: 16, fontWeight: 'bold' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: neutral('neutral300') },
  totalText: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  checkoutBtn: { backgroundColor: colors.success, padding: 16, borderRadius: 8, alignItems: 'center' },
  checkoutBtnText: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
  errorText: { color: colors.danger, marginBottom: 16 },
  emptyText: { fontSize: 18, color: neutral('neutral500') },
  button: { backgroundColor: colors.primary, padding: 12, borderRadius: 8 },
  buttonText: { color: colors.white, fontSize: 16 },
});
