import React, { useState } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  Platform,
  StatusBar,
  Share,
  Linking,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import {
  customerColors,
  customerFonts,
  customerShadow,
  customerSpacing,
} from '../theme';
import { tohfaMarketLogo } from '../assets/images';
import { ApiError } from '../../../shell/api/client';
import { gradeLabel, productKey, useCatalogHome } from '../api/catalog';
import {
  isActiveStatus,
  isPickupFulfillment,
  isReturnEligible,
  isReviewEligible,
  isTerminalStatus,
  useOrder,
  useOrderTracking,
  useReorder,
  type OrderTrackingEvent,
  type ReorderResult,
} from '../api/orders';
import { useOrderReview } from '../api/reviews';
import { getInvoiceDownloadUrl, useInvoice } from '../api/invoices';
import { usePickupPoints } from '../api/pickup';
import { formatAddressLine, useAddresses } from '../api/addresses';
import { useToggleWishlist, useWishlistKeys } from '../api/wishlist';
import { mapProblem } from '../api/problem';
import { ProductCard } from '../components/ProductCard';
import { PickupQrCode } from '../components/PickupQrCode';
import { formatKg, formatRupees, sumMoney } from '../utils/money';
import { SLOT_LABELS, activeOrderBadge, formatIstDate, orderStatusLabel } from '../utils/orderFormat';

export interface OrderTrackingScreenProps {
  /** Order uuid (not the order number). */
  orderId?: string | undefined;
  onNavigate?: ((screen: string, params?: Record<string, unknown> | undefined) => void) | undefined;
  onBack?: (() => void) | undefined;
}

// ── SVG ICONS ─────────────────────────────────────────────────────────────
const BackArrowSvg = ({ color = '#1A2E1A', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 12H5M5 12L12 19M5 12L12 5"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ModalCloseCrossSvg = ({ size = 14, color = '#1F2937' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 6L6 18M6 6l12 12"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ShareNodesSvg = ({ color = '#2E7D32', size = 22 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="18" cy="5" r="3" stroke={color} strokeWidth={2} />
    <Circle cx="6" cy="12" r="3" stroke={color} strokeWidth={2} />
    <Circle cx="18" cy="19" r="3" stroke={color} strokeWidth={2} />
    <Path
      d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

const DownloadTraySvg = ({ color = '#2E7D32', size = 22 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 4v12m0 0l-4-4m4 4l4-4M4 18h16"
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const HeadsetSupportSvg = ({ color = '#2E7D32', size = 22 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 14v-3a8 8 0 0116 0v3M4 14a2 2 0 002 2h1a1 1 0 001-1v-4a1 1 0 00-1-1H6a2 2 0 00-2 2zm16 0a2 2 0 01-2 2h-1a1 1 0 01-1-1v-4a1 1 0 011-1h1a2 2 0 012 2zm-8 4v2m-3 0h6"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const StarReviewSvg = ({ color = '#F59E0B', size = 22 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const PackageBoxSvg = ({ color = '#D97706', size = 22 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2l9 5-9 5-9-5 9-5zm0 10l9-5v10l-9 5-9-5V7l9 5z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M12 12v10" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const CartActionSvg = ({ color = '#2E7D32', size = 22 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 3h2l2 12h11l2-8H6"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="9" cy="20" r="1.5" fill={color} />
    <Circle cx="17" cy="20" r="1.5" fill={color} />
  </Svg>
);

const WhatsAppSvg = () => (
  <View style={[styles.socialIconCircle, { backgroundColor: '#25D366' }]}>
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="#FFFFFF">
      <Path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2zm5.79 14.07c-.24.68-1.39 1.3-1.92 1.38-.49.08-1.12.11-3.62-.92-3.19-1.32-5.24-4.57-5.4-4.78-.16-.21-1.3-1.73-1.3-3.3 0-1.57.82-2.34 1.11-2.66.29-.32.63-.4.84-.4.21 0 .42 0 .61.01.2.01.47-.08.73.55.27.63.92 2.25 1 2.41.08.16.13.35.03.56-.11.21-.16.35-.32.53-.16.19-.34.42-.48.56-.16.16-.33.33-.14.66.19.32.84 1.38 1.8 2.24 1.24 1.1 2.28 1.45 2.61 1.61.32.16.51.13.7-.08.19-.21.82-.95 1.03-1.28.21-.32.42-.27.71-.16.29.11 1.84.87 2.16 1.03.32.16.53.24.61.37.08.14.08.79-.16 1.47z" />
    </Svg>
  </View>
);

const TelegramSvg = () => (
  <View style={[styles.socialIconCircle, { backgroundColor: '#0088CC' }]}>
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="#FFFFFF">
      <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.92 9.06c-.14.65-.53.81-1.07.5l-2.94-2.17-1.42 1.37c-.16.16-.29.29-.59.29l.21-3.01 5.48-4.95c.24-.21-.05-.33-.37-.12l-6.78 4.27-2.92-.91c-.63-.2-.65-.63.13-.94l11.41-4.4c.53-.19.99.13.86.87z" />
    </Svg>
  </View>
);

const MessageSvg = () => (
  <View style={[styles.socialIconCircle, { backgroundColor: '#2E7D32' }]}>
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="#FFFFFF">
      <Path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" />
    </Svg>
  </View>
);

const EmailSvg = () => (
  <View style={[styles.socialIconCircle, { backgroundColor: '#EA4335' }]}>
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="#FFFFFF">
      <Path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
    </Svg>
  </View>
);

const MoreSvg = () => (
  <View style={[styles.socialIconCircle, { backgroundColor: '#E5E7EB' }]}>
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="#4B5563">
      <Circle cx="5" cy="12" r="2" />
      <Circle cx="12" cy="12" r="2" />
      <Circle cx="19" cy="12" r="2" />
    </Svg>
  </View>
);

export interface TimelineStep {
  status: string;
  title: string;
  subtitle: string;
  at: string | null;
  note: string | null;
  state: 'done' | 'active' | 'todo' | 'cancelled';
}

const STEP_COPY: Record<string, [string, string]> = {
  CONFIRMED: ['Order confirmed', 'Your wallet payment was successful and the order is accepted.'],
  PACKED: ['Packed', 'Your items are collected and packed.'],
  DISPATCHED: ['On the way', 'Your order has left the warehouse.'],
  OUT_FOR_DELIVERY: ['Out for delivery', 'Your order is nearly there.'],
  DELIVERED: ['Delivered', 'Your order has been handed over.'],
  READY_FOR_PICKUP: ['Ready for pickup', 'Collect it at the pickup point with your pickup code.'],
  PICKED_UP: ['Order collected', 'Your order has been handed over.'],
  CANCELLED: ['Cancelled', 'This order was cancelled.'],
  RETURNED: ['Returned', 'This order was returned.'],
};

/**
 * Tracking events (oldest first) mapped onto the fixed step list of the
 * fulfilment type. A step is done when it (or any later step) has an event;
 * the next one is active unless the order is terminal. CANCELLED/RETURNED
 * append a terminal row. Missing steps stay pending.
 */
export function buildTimeline(
  fulfillmentType: string | null | undefined,
  status: string | null | undefined,
  events: readonly OrderTrackingEvent[],
): TimelineStep[] {
  const pickup = isPickupFulfillment(fulfillmentType);
  const reached = new Set(events.map((e) => e.status));
  if (status) reached.add(status as OrderTrackingEvent['status']);
  const base = pickup
    ? ['CONFIRMED', 'PACKED', 'READY_FOR_PICKUP', 'PICKED_UP']
    : ['CONFIRMED', 'PACKED', 'DISPATCHED', ...(reached.has('OUT_FOR_DELIVERY') ? ['OUT_FOR_DELIVERY'] : []), 'DELIVERED'];
  let lastDone = -1;
  base.forEach((s, i) => {
    if (reached.has(s as OrderTrackingEvent['status'])) lastDone = i;
  });
  const terminal = isTerminalStatus(status);
  const steps: TimelineStep[] = base.map((s, i) => {
    const ev = [...events].reverse().find((e) => e.status === s);
    const copy = STEP_COPY[s] ?? [s, ''];
    return {
      status: s,
      title: copy[0],
      subtitle: copy[1],
      at: ev?.at ?? null,
      note: ev?.note ?? null,
      state: i <= lastDone ? 'done' : i === lastDone + 1 && !terminal ? 'active' : 'todo',
    };
  });
  if (status === 'CANCELLED' || status === 'RETURNED') {
    const ev = [...events].reverse().find((e) => e.status === status);
    const copy = STEP_COPY[status] ?? [status, ''];
    steps.push({ status, title: copy[0], subtitle: copy[1], at: ev?.at ?? null, note: ev?.note ?? null, state: 'cancelled' });
  }
  return steps;
}

const REORDER_REASON: Record<string, string> = {
  OUT_OF_STOCK: 'Out of stock today',
  DELISTED: 'No longer sold',
  INSUFFICIENT_ALLOCATION: 'Daily limit reached',
};

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' });
}

// ── MAIN SCREEN COMPONENT ──────────────────────────────────────────────────
/**
 * Order details & tracking (Figma 46:40927, share 46:41111, invoice 46:41394 /
 * 46:41607). Server-driven: GET /orders/{id} + GET /orders/{id}/tracking (polled
 * with backoff while active, stopped when terminal; the RN client has no SSE).
 * Actions are gated by status: review/return only after DELIVERED/PICKED_UP,
 * invoice only with an invoiceId, reorder rebuilds the server cart.
 */
export const OrderTrackingScreen: React.FC<OrderTrackingScreenProps> = ({ orderId, onNavigate, onBack }) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showFullInvoiceModal, setShowFullInvoiceModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [reorderResult, setReorderResult] = useState<ReorderResult | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const orderQuery = useOrder(orderId);
  const order = orderQuery.data;
  const trackingQuery = useOrderTracking(orderId, { enabled: !!order });
  const tracking = trackingQuery.data;
  const status = tracking?.status ?? order?.status;
  const pickup = isPickupFulfillment(order?.fulfillmentType);
  const pointsQuery = usePickupPoints();
  const point = pointsQuery.data?.find((p) => p.id === order?.warehouseId);
  const addressesQuery = useAddresses(!!order?.deliveryAddressId);
  const address = addressesQuery.data?.find((a) => a.id === order?.deliveryAddressId);
  const reviewEligible = isReviewEligible(status);
  const reviewQuery = useOrderReview(orderId, { enabled: reviewEligible });
  const invoiceQuery = useInvoice(showInvoiceModal || showFullInvoiceModal ? order?.invoiceId : null);
  const invoice = invoiceQuery.data;
  const reorderM = useReorder();
  const homeQuery = useCatalogHome();
  const wishlistKeys = useWishlistKeys();
  const toggleWishlist = useToggleWishlist();

  const timeline = buildTimeline(order?.fulfillmentType, status, tracking?.events ?? []);
  const deliveryFee = order?.deliveryFee ?? order?.deliveryCharge;
  const firstThumb = order?.thumbnails?.[0];

  const handleSystemShare = async () => {
    if (!order) return;
    try {
      await Share.share({
        message: `TOHFA Market order ${order.orderNumber}\nStatus: ${orderStatusLabel(status)}\nItems: ${order.items.length}\nTotal: ${formatRupees(order.totalAmount)}`,
        title: `Order ${order.orderNumber}`,
      });
    } catch {
      // Share sheet dismissed.
    }
    setShowShareModal(false);
  };

  const handleDownloadInvoice = async () => {
    if (!order?.invoiceId) return;
    setDownloading(true);
    try {
      const url = await getInvoiceDownloadUrl(order.invoiceId);
      await Linking.openURL(url);
    } catch (err) {
      const p = mapProblem(err);
      if (!p.silent) setNotice(err instanceof ApiError && err.status === 404 ? 'Invoice unavailable' : p.message);
    } finally {
      setDownloading(false);
    }
  };

  const handleReorder = async () => {
    if (!order) return;
    setNotice(null);
    try {
      const res = await reorderM.mutateAsync(order.id);
      if (res.unavailable.length > 0 || res.addedCount === 0) {
        setReorderResult(res);
      } else {
        onNavigate?.('Cart');
      }
    } catch (err) {
      const p = mapProblem(err);
      if (!p.silent) setNotice(p.message);
    }
  };

  const header = (
    <View style={styles.headerRow}>
      <View style={styles.headerLeftGroup}>
        <TouchableOpacity activeOpacity={0.7} onPress={onBack || (() => onNavigate?.('OrderHistory'))} style={styles.circleIconButton} accessibilityLabel="Back">
          <BackArrowSvg color={customerColors.heading} size={18} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Order</Text>
      </View>
    </View>
  );

  if (orderQuery.isLoading) {
    return (
      <View style={styles.container}>
        {header}
        <ActivityIndicator testID="order-loading" style={{ marginTop: 48 }} />
      </View>
    );
  }
  if (orderQuery.isError || !order) {
    const notFound = orderQuery.error instanceof ApiError && (orderQuery.error.status === 404 || orderQuery.error.status === 403);
    return (
      <View style={styles.container}>
        {header}
        <View style={styles.summaryList} testID={notFound || !orderId ? 'order-not-found' : 'order-error'}>
          <Text style={styles.sectionHeaderTitle}>{notFound || !orderId ? 'Order not found' : mapProblem(orderQuery.error).message}</Text>
          {!notFound && !!orderId && (
            <TouchableOpacity onPress={() => void orderQuery.refetch()}>
              <Text style={styles.viewQrLink}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  const arriveText = pickup
    ? orderStatusLabel(status)
    : `${formatIstDate(tracking?.estimatedArrival ?? order.deliveryDate)}${order.deliverySlot ? ` · ${SLOT_LABELS[order.deliverySlot]}` : ''}`;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {header}

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── TOP CARD: first item + order total ───────────────────────────── */}
        <View style={[styles.topProductCard, customerShadow.subtle]}>
          <View style={styles.productThumbBox}>
            {firstThumb ? <Image source={{ uri: firstThumb.imageUrl }} style={styles.productHeroImage} resizeMode="contain" /> : null}
          </View>
          <View style={styles.productDetailsCol}>
            <View style={styles.productTitleRow}>
              <Text style={styles.productTitleText} numberOfLines={1}>
                {firstThumb?.productName ?? order.items[0]?.name ?? order.orderNumber}
                {order.items.length > 1 ? ` +${order.items.length - 1} more` : ''}
              </Text>
              <Text style={styles.productPriceText}>{formatRupees(order.totalAmount)}</Text>
            </View>
            <Text style={styles.productTaglineText} numberOfLines={1}>
              {order.items.length} {order.items.length === 1 ? 'item' : 'items'} · {orderStatusLabel(status)}
            </Text>
          </View>
        </View>

        {/* ── DELIVERY STATES ROW ───────────────────────────────────────────── */}
        <View style={styles.deliveryStatesRow}>
          <Text style={styles.deliveryStatesLabel}>{pickup ? 'Pickup states:' : 'Delivery states:'}</Text>
          <View style={styles.deliveryStatesRight}>
            {!pickup && !!(tracking?.estimatedArrival ?? order.deliveryDate) && (
              <Text style={styles.deliveryDateText}>{formatIstDate(tracking?.estimatedArrival ?? order.deliveryDate)}</Text>
            )}
            <View style={styles.arriveTomorrowPill}>
              <Text style={styles.arriveTomorrowPillText} testID="order-status-pill">
                {isActiveStatus(status) ? activeOrderBadge({ status: status ?? '', fulfillmentType: order.fulfillmentType, deliveryDate: order.deliveryDate }) : orderStatusLabel(status)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.dashedDivider} />

        {/* ── ORDER SUMMARY ───────────────────────────────────────────────── */}
        <Text style={styles.sectionHeaderTitle}>Order summary</Text>
        <View style={styles.summaryList}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>{pickup ? 'Status' : 'Arrive states'}</Text>
            <Text style={styles.summaryVal}>{arriveText}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Order ID</Text>
            <Text style={styles.summaryVal} testID="order-number">
              {order.orderNumber}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Order Date</Text>
            <Text style={styles.summaryVal}>{formatDateTime(order.placedAt)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>{pickup ? 'Pickup location' : 'Fulfilment'}</Text>
            <Text style={styles.summaryVal}>{pickup ? (point?.name ?? '') : 'Home Delivery'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Payment method</Text>
            <Text style={styles.summaryVal}>{order.paymentMethodLabel ?? 'Wallet'}</Text>
          </View>
          {pickup && !!order.pickupCode && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Pickup code</Text>
              <View style={styles.pickupCodeRow}>
                <Text style={styles.summaryVal}>{order.pickupCode} | </Text>
                <TouchableOpacity activeOpacity={0.7} onPress={() => setShowQrModal(true)} testID="view-qr">
                  <Text style={styles.viewQrLink}>View QR</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          {(tracking?.otpRequired ?? order.otpRequired) && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Handover</Text>
              <Text style={styles.summaryVal}>Share the OTP sent to you at handover</Text>
            </View>
          )}
          <View style={[styles.summaryRow, { alignItems: 'flex-start' }]}>
            <Text style={styles.summaryKey}>{pickup ? 'Pickup address' : 'Delivery address'}</Text>
            <View style={styles.addressValCol}>
              {pickup ? (
                <>
                  {!!point?.phone && <Text style={styles.addressPhoneText}>Ph: {point.phone},</Text>}
                  <Text style={styles.addressBodyText}>{point?.address ?? point?.name ?? ''}</Text>
                </>
              ) : (
                <>
                  {!!address?.contactPhone && <Text style={styles.addressPhoneText}>Ph: {address.contactPhone},</Text>}
                  <Text style={styles.addressBodyText}>{address ? `${formatAddressLine(address)}, ${address.state}` : ''}</Text>
                </>
              )}
            </View>
          </View>
        </View>

        <View style={styles.dashedDivider} />

        {/* ── ORDER ITEMS ───────────────────────────────────────────────────── */}
        <Text style={styles.sectionHeaderTitle}>Order items</Text>
        <View style={styles.itemsBreakdownList}>
          {order.items.map((it) => (
            <View key={it.id} style={styles.itemPriceRow}>
              <View>
                <Text style={styles.itemTitle}>
                  {it.name} · {gradeLabel(it.grade)}
                </Text>
                <Text style={styles.itemUnitRate}>
                  {formatKg(it.qtyKg)} × {formatRupees(it.unitPrice)} / kg
                </Text>
              </View>
              <Text style={styles.itemAmount}>{formatRupees(it.lineTotal)}</Text>
            </View>
          ))}
          {(
            [
              ['Items total', order.subtotal],
              ['Delivery fee', deliveryFee],
              ['Handling fee', order.handlingFee],
              ['GST', order.gstAmount],
            ] as const
          )
            .filter(([, v]) => v !== undefined && v !== null)
            .map(([k, v]) => (
              <View key={k} style={styles.itemPriceRow}>
                <Text style={styles.itemUnitRate}>{k}</Text>
                <Text style={styles.itemAmount}>{formatRupees(v)}</Text>
              </View>
            ))}
        </View>

        <View style={styles.dashedDivider} />

        <View style={styles.totalPaidRow}>
          <Text style={styles.totalPaidLabel}>Total Paid</Text>
          <Text style={styles.totalPaidAmount} testID="order-total">
            {formatRupees(order.totalAmount)}
          </Text>
        </View>

        {/* ── ORDER PROGRESS TIMELINE (GET /orders/{id}/tracking) ─────────────── */}
        <Text style={[styles.sectionHeaderTitle, { marginTop: 24 }]}>Order progress</Text>
        <View style={styles.timelineStepper} testID="order-timeline">
          {timeline.map((step, i) => {
            const last = i === timeline.length - 1;
            const done = step.state === 'done' || step.state === 'cancelled';
            return (
              <View key={step.status} style={[styles.timelineStep, last && { marginBottom: 0 }]} testID={`step-${step.status}-${step.state}`}>
                <View style={styles.timelineLeftCol}>
                  <Text style={done || step.state === 'active' ? styles.stepNumber : styles.stepNumberMuted}>{i + 1}</Text>
                  {!last && <View style={step.state === 'done' ? styles.timelineLineActive : styles.timelineLineMuted} />}
                </View>
                <View style={styles.timelineRightCol}>
                  <View style={styles.stepTitleRow}>
                    <Text style={done || step.state === 'active' ? styles.stepTitle : styles.stepTitleMuted}>{step.title}</Text>
                    {step.state === 'done' && (
                      <View style={styles.completedPill}>
                        <Text style={styles.completedPillText}>Completed</Text>
                      </View>
                    )}
                    {step.state === 'active' && (
                      <View style={styles.inProgressPill}>
                        <Text style={styles.inProgressPillText}>In progress</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.stepSubtitle}>
                    {step.at ? `${formatDateTime(step.at)} · ` : ''}
                    {step.subtitle}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {!!notice && (
          <Text style={styles.stepSubtitle} testID="order-notice" accessibilityRole="alert">
            {notice}
          </Text>
        )}

        {/* ── ORDER ACTIONS (gated by status) ─────────────────────────────────── */}
        <Text style={[styles.sectionHeaderTitle, { marginTop: 24 }]}>Order Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard} activeOpacity={0.8} onPress={() => onNavigate?.('ContactSupport', { orderId: order.id, orderNumber: order.orderNumber })}>
            <HeadsetSupportSvg color="#2E7D32" size={22} />
            <Text style={styles.actionLabel}>Contact Support</Text>
          </TouchableOpacity>

          {reviewEligible && (
            <TouchableOpacity
              style={styles.actionCard}
              activeOpacity={0.8}
              testID="action-review"
              onPress={() => onNavigate?.('ReviewFeedback', { orderId: order.id })}
            >
              <StarReviewSvg color="#F59E0B" size={22} />
              <Text style={styles.actionLabel}>{reviewQuery.data ? `Your review: ${reviewQuery.data.rating} ★` : 'Write a Review & Feedback'}</Text>
            </TouchableOpacity>
          )}

          {isReturnEligible(status) && (
            <TouchableOpacity style={styles.actionCard} activeOpacity={0.8} testID="action-return" onPress={() => onNavigate?.('ReturnOrder', { orderId: order.id })}>
              <PackageBoxSvg color="#D97706" size={22} />
              <Text style={styles.actionLabel}>Return Order</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.actionCard} activeOpacity={0.8} testID="action-reorder" disabled={reorderM.isPending} onPress={() => void handleReorder()}>
            {reorderM.isPending ? <ActivityIndicator /> : <CartActionSvg color="#2E7D32" size={22} />}
            <Text style={styles.actionLabel}>Buy Again</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} activeOpacity={0.8} onPress={() => setShowShareModal(true)}>
            <ShareNodesSvg color="#2E7D32" size={22} />
            <Text style={styles.actionLabel}>Share Order Details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, !order.invoiceId && { opacity: 0.5 }]}
            activeOpacity={0.8}
            disabled={!order.invoiceId}
            testID="action-invoice"
            onPress={() => setShowInvoiceModal(true)}
          >
            <DownloadTraySvg color="#2E7D32" size={22} />
            <Text style={styles.actionLabel}>{order.invoiceId ? 'Download Invoice' : 'Invoice not ready yet'}</Text>
          </TouchableOpacity>
        </View>

        {/* ── FOR YOU (catalog featured) ─────────────────────────────────────── */}
        {(homeQuery.data?.featured ?? []).length > 0 && (
          <>
            <Text style={[styles.sectionHeaderTitle, { marginTop: 24, fontSize: 22 }]}>For you</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.forYouScrollContent}>
              {(homeQuery.data?.featured ?? []).map((p) => {
                const key = productKey(p);
                return (
                  <ProductCard
                    key={key}
                    product={p}
                    variant="rail"
                    wishlisted={wishlistKeys.has(key)}
                    onPress={() => onNavigate?.('ProductDetail', { productId: p.id, grade: p.grade })}
                    onToggleWishlist={() => toggleWishlist.mutate({ productId: p.id, grade: p.grade, add: !wishlistKeys.has(key), product: p })}
                  />
                );
              })}
            </ScrollView>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ═══ SHARE ORDER DETAILS (46:41111): system share sheet ═══ */}
      <Modal visible={showShareModal} transparent animationType="fade" onRequestClose={() => setShowShareModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCardContainer}>
            <View style={styles.shareModalCard}>
              <TouchableOpacity style={styles.floatingCloseBtn} activeOpacity={0.8} onPress={() => setShowShareModal(false)} accessibilityLabel="Close" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <ModalCloseCrossSvg size={14} color="#1F2937" />
              </TouchableOpacity>
              <View style={styles.largeIconCircle}>
                <ShareNodesSvg color="#2E7D32" size={30} />
              </View>
              <Text style={styles.modalEditorialTitle}>Share Order Details</Text>
              <Text style={styles.modalSubtitle}>Share your information with family or friends.</Text>
              <View style={styles.receiptContainer}>
                <Image source={tohfaMarketLogo} style={styles.receiptLogoImage} resizeMode="contain" />
                <Text style={styles.receiptOrderDetailsHeader}>Order Details</Text>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptKey}>Order ID</Text>
                  <Text style={styles.receiptValBold}>{order.orderNumber}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptKey}>Order Date</Text>
                  <Text style={styles.receiptVal}>{formatDateTime(order.placedAt)}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptKey}>Items</Text>
                  <Text style={styles.receiptVal}>{order.items.length} Items</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptKey}>Total Paid</Text>
                  <Text style={styles.receiptTotalPaid}>{formatRupees(order.totalAmount)}</Text>
                </View>
                {pickup && point && (
                  <View style={styles.receiptPickupBox}>
                    <Text style={{ fontSize: 16 }}>📍</Text>
                    <View>
                      <Text style={styles.receiptPickupSub}>Pickup Location</Text>
                      <Text style={styles.receiptPickupTitle}>{point.name}</Text>
                    </View>
                  </View>
                )}
                <View style={styles.receiptItemsList}>
                  {order.items.map((it) => (
                    <View key={it.id} style={styles.receiptItemRow}>
                      <Text style={styles.receiptItemTitle}>
                        {it.name} ({formatKg(it.qtyKg)})
                      </Text>
                      <Text style={styles.receiptItemPrice}>{formatRupees(it.lineTotal)}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.scallopEdgeContainer}>
                  {[...Array(12)].map((_, i) => (
                    <View key={`scallop-${i}`} style={styles.scallopCircle} />
                  ))}
                </View>
              </View>
              <Text style={styles.shareOptionsHeader}>Share Order Details</Text>
              <View style={styles.socialButtonsRow}>
                {(
                  [
                    ['WhatsApp', WhatsAppSvg],
                    ['Telegram', TelegramSvg],
                    ['Message', MessageSvg],
                    ['Email', EmailSvg],
                    ['More', MoreSvg],
                  ] as const
                ).map(([label, Icon]) => (
                  <TouchableOpacity key={label} activeOpacity={0.7} onPress={() => void handleSystemShare()} style={styles.socialBtnCol}>
                    <Icon />
                    <Text style={styles.socialBtnLabel}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ═══ DOWNLOAD INVOICE (46:41394): GET /invoices/{id} + signed download ═══ */}
      <Modal visible={showInvoiceModal} transparent animationType="fade" onRequestClose={() => setShowInvoiceModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCardContainer}>
            <View style={styles.downloadInvoiceModalCard} testID="invoice-modal">
              <TouchableOpacity style={styles.floatingCloseBtn} activeOpacity={0.8} onPress={() => setShowInvoiceModal(false)} accessibilityLabel="Close" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <ModalCloseCrossSvg size={14} color="#1F2937" />
              </TouchableOpacity>
              <View style={styles.largeIconCircle}>
                <DownloadTraySvg color="#2E7D32" size={30} />
              </View>
              <Text style={styles.modalEditorialTitle}>Download Invoice</Text>
              <Text style={styles.modalSubtitle}>View or download the invoice for your order.</Text>
              <View style={styles.orderIdBannerCard}>
                <View style={styles.orderBagCircle}>
                  <CartActionSvg color="#2E7D32" size={18} />
                </View>
                <View>
                  <Text style={styles.orderIdBannerTitle}>Order ID: {order.orderNumber}</Text>
                  <Text style={styles.orderIdBannerSub}>
                    {formatIstDate(order.placedAt)} - {order.items.length} items
                  </Text>
                </View>
              </View>
              <Text style={styles.invoiceSectionTitle}>Invoice</Text>
              {invoiceQuery.isLoading ? (
                <ActivityIndicator testID="invoice-loading" />
              ) : invoiceQuery.isError ? (
                <Text style={styles.invoiceInfoText} testID="invoice-error">
                  {invoiceQuery.error instanceof ApiError && invoiceQuery.error.status === 404 ? 'Invoice unavailable' : mapProblem(invoiceQuery.error).message}
                </Text>
              ) : invoice ? (
                <TouchableOpacity
                  style={styles.miniInvoicePreview}
                  activeOpacity={0.9}
                  onPress={() => {
                    setShowInvoiceModal(false);
                    setShowFullInvoiceModal(true);
                  }}
                >
                  <View style={styles.miniInvoiceHeader}>
                    <View>
                      <Text style={styles.miniInvoiceBrand}>TOHFA Market</Text>
                      {!!invoice.buyerName && <Text style={styles.miniInvoiceMeta}>{invoice.buyerName}</Text>}
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.miniInvoiceInvNo}>{invoice.gstApplicable ? 'Tax Invoice' : 'Invoice'}</Text>
                      <Text style={styles.miniInvoiceMeta}>Inv No: {invoice.invoiceNumber}</Text>
                      <Text style={styles.miniInvoiceMeta}>Status: {invoice.status}</Text>
                    </View>
                  </View>
                  <View style={styles.miniInvoiceTableHead}>
                    <Text style={[styles.miniInvoiceColHead, { flex: 2 }]}>Product</Text>
                    <Text style={styles.miniInvoiceColHead}>Qty</Text>
                    <Text style={[styles.miniInvoiceColHead, { textAlign: 'right' }]}>Amount</Text>
                  </View>
                  {(invoice.lines ?? []).slice(0, 3).map((l, i) => (
                    <View key={`${l.description}-${i}`} style={styles.miniInvoiceRow}>
                      <Text style={[styles.miniInvoiceCell, { flex: 2 }]} numberOfLines={1}>
                        {l.description}
                      </Text>
                      <Text style={styles.miniInvoiceCell}>{formatKg(l.qty)}</Text>
                      <Text style={[styles.miniInvoiceCell, { textAlign: 'right' }]}>{formatRupees(l.total)}</Text>
                    </View>
                  ))}
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity style={styles.downloadPdfBtn} activeOpacity={0.85} onPress={() => void handleDownloadInvoice()} disabled={downloading} testID="invoice-download">
                {downloading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.downloadPdfBtnText}>Download Invoice (PDF)</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeBtnOutlined}
                activeOpacity={0.85}
                disabled={!invoice}
                onPress={() => {
                  setShowInvoiceModal(false);
                  setShowFullInvoiceModal(true);
                }}
                testID="invoice-view"
              >
                <Text style={styles.closeBtnOutlinedText}>View Invoice</Text>
              </TouchableOpacity>
              {!!notice && <Text style={styles.invoiceInfoText}>{notice}</Text>}
            </View>
          </View>
        </View>
      </Modal>

      {/* ═══ VIEW INVOICE (46:41607): InvoiceDetail; seller GSTIN/legal name not in the API ═══ */}
      <Modal visible={showFullInvoiceModal} transparent animationType="fade" onRequestClose={() => setShowFullInvoiceModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCardContainer}>
            <View style={styles.invoiceModalCard} testID="invoice-full">
              <TouchableOpacity style={styles.floatingCloseBtn} activeOpacity={0.8} onPress={() => setShowFullInvoiceModal(false)} accessibilityLabel="Close" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <ModalCloseCrossSvg size={14} color="#1F2937" />
              </TouchableOpacity>
              <Text style={styles.invoiceModalTitle}>Invoice</Text>
              <ScrollView style={styles.invoiceDocScrollView} contentContainerStyle={styles.invoiceDocScrollContent} showsVerticalScrollIndicator={false}>
                {invoice && (
                  <View style={styles.invoiceDocumentCard}>
                    <View style={styles.invHeaderBox}>
                      <View style={styles.invBrandCol}>
                        <View style={styles.invLogoRow}>
                          <Text style={styles.invBrandTohfa}>TOHFA </Text>
                          <Text style={styles.invBrandMarket}>Market</Text>
                        </View>
                        {!!invoice.placeOfSupply && <Text style={styles.invMetaText}>Place of supply: {invoice.placeOfSupply}</Text>}
                      </View>
                      <View style={styles.invTaxCol}>
                        <Text style={styles.invTaxInvoiceTitle}>{invoice.gstApplicable ? 'TAX INVOICE' : 'INVOICE'}</Text>
                        <Text style={styles.invTaxMeta}>Invoice No.: {invoice.invoiceNumber}</Text>
                        <Text style={styles.invTaxMeta}>Invoice Date: {formatIstDate(invoice.issueDate)}</Text>
                        <Text style={styles.invTaxMeta}>Order ID: {order.orderNumber}</Text>
                        <Text style={styles.invTaxMeta}>Status: {invoice.status}</Text>
                      </View>
                    </View>
                    <View style={styles.invAddressTable}>
                      <View style={styles.invAddressColLeft}>
                        <Text style={styles.invAddressHead}>BILL TO</Text>
                        <Text style={styles.invCustomerBold}>{invoice.buyerName ?? ''}</Text>
                        {!!invoice.buyerGstin && <Text style={styles.invAddressLine}>GSTIN: {invoice.buyerGstin}</Text>}
                      </View>
                      <View style={styles.invAddressColRight}>
                        <Text style={styles.invAddressHead}>{pickup ? 'PICKUP POINT' : 'DELIVERY ADDRESS'}</Text>
                        <Text style={styles.invAddressLine}>{pickup ? (point?.name ?? '') : address ? formatAddressLine(address) : ''}</Text>
                      </View>
                    </View>
                    <Text style={styles.invOrderItemsHeader}>ORDER ITEMS</Text>
                    <View style={styles.invItemsTable}>
                      <View style={styles.invItemsTableHead}>
                        <Text style={[styles.invTh, { width: 18 }]}>#</Text>
                        <Text style={[styles.invTh, { flex: 2 }]}>Product description</Text>
                        <Text style={[styles.invTh, { width: 34, textAlign: 'center' }]}>Qty</Text>
                        <Text style={[styles.invTh, { width: 56, textAlign: 'right' }]}>Unit price</Text>
                        <Text style={[styles.invTh, { width: 60, textAlign: 'right' }]}>Amount</Text>
                      </View>
                      {(invoice.lines ?? []).map((l, i) => (
                        <View key={`${l.description}-${i}`} style={styles.invItemRow}>
                          <Text style={[styles.invTd, { width: 18 }]}>{i + 1}</Text>
                          <Text style={[styles.invTd, { flex: 2 }]}>{l.description}</Text>
                          <Text style={[styles.invTd, { width: 34, textAlign: 'center' }]}>{formatKg(l.qty)}</Text>
                          <Text style={[styles.invTd, { width: 56, textAlign: 'right' }]}>{formatRupees(l.unitPrice)}</Text>
                          <Text style={[styles.invTd, { width: 60, textAlign: 'right' }]}>{formatRupees(l.total)}</Text>
                        </View>
                      ))}
                    </View>
                    <View style={styles.invSubtotalBlock}>
                      {!!invoice.taxableAmount && (
                        <View style={styles.invSubtotalRow}>
                          <Text style={styles.invSubtotalKey}>Taxable amount</Text>
                          <Text style={styles.invSubtotalVal}>{formatRupees(invoice.taxableAmount)}</Text>
                        </View>
                      )}
                      <View style={styles.invSubtotalRow}>
                        <Text style={styles.invSubtotalKey}>Tax</Text>
                        <Text style={styles.invSubtotalVal} testID="invoice-gst">
                          {invoice.gstApplicable ? formatRupees(sumMoney([invoice.cgst ?? '0', invoice.sgst ?? '0', invoice.igst ?? '0'])) : 'GST not applicable'}
                        </Text>
                      </View>
                      <View style={styles.invSubtotalDivider} />
                      <View style={styles.invSubtotalRow}>
                        <Text style={styles.invGrandTotalKey}>Grand total</Text>
                        <Text style={styles.invGrandTotalVal}>{formatRupees(invoice.totalAmount)}</Text>
                      </View>
                    </View>
                    <View style={styles.invPaymentBox}>
                      <Text style={styles.invPaymentHeading}>PAYMENT DETAILS</Text>
                      <View style={styles.invPaymentRow}>
                        <Text style={styles.invPaymentText}>Payment method: {order.paymentMethodLabel ?? 'Wallet'}</Text>
                        <Text style={styles.invPaymentText}>Payment status: {order.paymentStatus ?? ''}</Text>
                      </View>
                    </View>
                    <Text style={styles.invThankYouText}>Thank you for choosing TOHFA Market.</Text>
                  </View>
                )}
              </ScrollView>
              <TouchableOpacity style={styles.downloadPdfBtn} activeOpacity={0.85} onPress={() => void handleDownloadInvoice()} disabled={downloading} testID="invoice-full-download">
                {downloading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.downloadPdfBtnText}>Download Invoice (PDF)</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeBtnOutlined} activeOpacity={0.85} onPress={() => setShowFullInvoiceModal(false)}>
                <Text style={styles.closeBtnOutlinedText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ═══ PICKUP QR (BR-194): QR of pickupQr.payload, never the OTP ═══ */}
      <Modal visible={showQrModal} transparent animationType="fade" onRequestClose={() => setShowQrModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCardContainer}>
            <View style={styles.qrModalCard} testID="qr-modal">
              <TouchableOpacity style={styles.floatingCloseBtn} activeOpacity={0.8} onPress={() => setShowQrModal(false)} accessibilityLabel="Close" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <ModalCloseCrossSvg size={14} color="#1F2937" />
              </TouchableOpacity>
              <Text style={styles.modalEditorialTitle}>Pickup QR Code</Text>
              <Text style={styles.modalSubtitle}>Show this QR code at the counter for pickup</Text>
              <View style={styles.qrImageFrame}>
                <PickupQrCode payload={order.pickupQr?.payload} size={180} />
              </View>
              <View style={styles.pickupCodeBadge}>
                <Text style={styles.pickupCodeText}>{order.pickupCode}</Text>
              </View>
              <Text style={styles.qrOrderSubtitle}>Order: {order.orderNumber}</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* ═══ REORDER RESULT: lines that could not be added [needs design review] ═══ */}
      <Modal visible={!!reorderResult} transparent animationType="fade" onRequestClose={() => setReorderResult(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCardContainer}>
            <View style={styles.qrModalCard} testID="reorder-modal">
              <Text style={styles.modalEditorialTitle}>{reorderResult?.addedCount === 0 ? 'Nothing could be added' : 'Some items are unavailable'}</Text>
              {(reorderResult?.unavailable ?? []).map((u) => (
                <Text key={`${u.productId}:${u.grade}`} style={styles.modalSubtitle}>
                  {u.name} · {gradeLabel(u.grade)} — {REORDER_REASON[u.reason] ?? u.reason}
                </Text>
              ))}
              {(reorderResult?.addedCount ?? 0) > 0 && (
                <TouchableOpacity
                  style={styles.downloadPdfBtn}
                  onPress={() => {
                    setReorderResult(null);
                    onNavigate?.('Cart');
                  }}
                  testID="reorder-go-cart"
                >
                  <Text style={styles.downloadPdfBtnText}>Go to cart</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.closeBtnOutlined} onPress={() => setReorderResult(null)}>
                <Text style={styles.closeBtnOutlinedText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};


// ── STYLESHEET ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: customerSpacing.base,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 12 : 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  circleIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1A2E1A',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 22,
    color: '#1A2E1A',
    fontFamily: customerFonts.editorial,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: customerSpacing.base,
    paddingTop: 10,
  },

  // Top Product Card
  topProductCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  productThumbBox: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productHeroImage: {
    width: 58,
    height: 58,
  },
  productDetailsCol: {
    flex: 1,
    gap: 2,
  },
  productTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2E1A',
    flex: 1,
  },
  productPriceText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2E1A',
  },
  productMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  starRatingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B',
  },
  reviewsCountText: {
    fontSize: 11,
    color: '#6B7280',
  },
  bagWeightText: {
    fontSize: 11,
    color: '#6B7280',
  },
  productTaglineText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },

  // Delivery States Row
  deliveryStatesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  deliveryStatesLabel: {
    fontSize: 18,
    color: '#1A2E1A',
    fontFamily: customerFonts.editorial,
  },
  deliveryStatesRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  deliveryDateText: {
    fontSize: 11,
    color: '#6B7280',
  },
  arriveTomorrowPill: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  arriveTomorrowPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2E7D32',
  },

  dashedDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    borderStyle: 'dashed',
    marginVertical: 14,
  },

  // Order Summary
  sectionHeaderTitle: {
    fontSize: 19,
    color: '#1A2E1A',
    fontFamily: customerFonts.editorial,
    marginBottom: 10,
  },
  summaryList: {
    gap: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryKey: {
    fontSize: 13,
    color: '#6B7280',
  },
  summaryVal: {
    fontSize: 13,
    color: '#1A2E1A',
    fontWeight: '500',
  },
  pickupCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewQrLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
    textDecorationLine: 'underline',
  },
  addressValCol: {
    alignItems: 'flex-end',
    maxWidth: 220,
  },
  addressPhoneText: {
    fontSize: 12,
    color: '#1A2E1A',
    fontWeight: '600',
  },
  addressBodyText: {
    fontSize: 12,
    color: '#4B5563',
    textAlign: 'right',
    lineHeight: 16,
  },

  // Items Breakdown
  itemsBreakdownList: {
    gap: 10,
  },
  itemPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2E1A',
  },
  itemUnitRate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  itemAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2E1A',
  },

  totalPaidRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  totalPaidLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A2E1A',
  },
  totalPaidAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E7D32',
  },

  // Timeline Stepper
  timelineStepper: {
    paddingLeft: 4,
    marginTop: 6,
  },
  timelineStep: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineLeftCol: {
    alignItems: 'center',
    width: 24,
    marginRight: 10,
  },
  stepNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A2E1A',
  },
  stepNumberMuted: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  timelineLineActive: {
    width: 2,
    flex: 1,
    backgroundColor: '#2E7D32',
    marginTop: 4,
  },
  timelineLineMuted: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    marginTop: 4,
  },
  timelineRightCol: {
    flex: 1,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2E1A',
  },
  stepTitleMuted: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  completedPill: {
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  completedPillText: {
    fontSize: 10,
    color: '#2E7D32',
    fontWeight: '600',
  },
  inProgressPill: {
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  inProgressPillText: {
    fontSize: 10,
    color: '#D97706',
    fontWeight: '600',
  },
  stepSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },

  // Order Actions 2-Col Grid
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 6,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 12,
    color: '#1A2E1A',
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },

  // For You Recommendations
  forYouScrollContent: {
    paddingVertical: 8,
    gap: 12,
  },
  forYouCardContainer: {
    width: 130,
    alignItems: 'center',
  },
  forYouCard: {
    width: 130,
    height: 150,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 10,
    justifyContent: 'space-between',
  },
  forYouTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forYouRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  forYouStar: {
    fontSize: 12,
    color: '#F59E0B',
  },
  forYouRatingText: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '600',
  },
  forYouHeartBtn: {
    padding: 2,
  },
  forYouImageCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  forYouImage: {
    width: 60,
    height: 60,
  },
  forYouPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  forYouPriceBold: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A2E1A',
  },
  forYouPriceStrike: {
    fontSize: 11,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  forYouUnitText: {
    fontSize: 11,
    color: '#6B7280',
  },
  forYouProductName: {
    fontSize: 12,
    color: '#1A2E1A',
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
  },

  // ── MODAL COMMON STYLES ──────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCardContainer: {
    width: '100%',
    maxWidth: 380,
    position: 'relative',
  },
  floatingCloseBtn: {
    position: 'absolute',
    top: -14,
    right: -12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 30,
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  largeIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 10,
  },
  modalEditorialTitle: {
    fontSize: 22,
    color: '#1A2E1A',
    fontFamily: customerFonts.editorial,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
  },

  // ── POPUP 1: SHARE ORDER DETAILS STYLES ──────────────────────────────────
  shareModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    position: 'relative',
  },
  receiptContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
  },
  receiptLogoImage: {
    height: 32,
    width: 120,
    alignSelf: 'center',
    marginBottom: 6,
  },
  receiptOrderDetailsHeader: {
    fontSize: 15,
    color: '#1A2E1A',
    fontFamily: customerFonts.editorial,
    textAlign: 'center',
    marginBottom: 8,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 2,
  },
  receiptKey: {
    fontSize: 12,
    color: '#6B7280',
  },
  receiptVal: {
    fontSize: 12,
    color: '#1A2E1A',
  },
  receiptValBold: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A2E1A',
  },
  receiptTotalPaid: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2E7D32',
  },
  receiptPickupBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 8,
    gap: 8,
    marginVertical: 8,
  },
  receiptPickupSub: {
    fontSize: 10,
    color: '#4B5563',
  },
  receiptPickupTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A2E1A',
  },
  receiptItemsList: {
    gap: 6,
    marginTop: 4,
  },
  receiptItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  receiptItemThumb: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  receiptItemTitle: {
    fontSize: 12,
    color: '#1A2E1A',
    flex: 1,
  },
  receiptItemPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A2E1A',
  },
  scallopEdgeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    overflow: 'hidden',
  },
  scallopCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: -8,
  },
  shareOptionsHeader: {
    fontSize: 15,
    color: '#1A2E1A',
    fontFamily: customerFonts.editorial,
    marginTop: 12,
    marginBottom: 8,
  },
  socialButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  socialBtnCol: {
    alignItems: 'center',
    gap: 4,
  },
  socialIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialBtnLabel: {
    fontSize: 10,
    color: '#4B5563',
  },

  // ── POPUP 2A: DOWNLOAD INVOICE STYLES (MATCHING 1ST SCREEN) ─────────────
  downloadInvoiceModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    position: 'relative',
  },
  orderIdBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 10,
    gap: 12,
    marginBottom: 12,
  },
  orderBagCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderIdBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A2E1A',
  },
  orderIdBannerSub: {
    fontSize: 11,
    color: '#6B7280',
  },
  invoiceSectionTitle: {
    fontSize: 16,
    color: '#1A2E1A',
    fontFamily: customerFonts.editorial,
    textAlign: 'center',
    marginBottom: 8,
  },
  miniInvoicePreview: {
    backgroundColor: '#FFFDF9',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  miniInvoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 6,
    marginBottom: 6,
  },
  miniInvoiceBrand: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2E7D32',
  },
  miniInvoiceMeta: {
    fontSize: 8,
    color: '#6B7280',
  },
  miniInvoiceInvNo: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1A2E1A',
  },
  miniInvoiceTableHead: {
    flexDirection: 'row',
    backgroundColor: '#2D6A4F',
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderRadius: 2,
    marginBottom: 4,
  },
  miniInvoiceColHead: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  miniInvoiceRow: {
    flexDirection: 'row',
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  miniInvoiceCell: {
    fontSize: 8,
    color: '#374151',
    flex: 1,
  },

  // ── POPUP 2B: FULL INVOICE VIEW STYLES (MATCHING 2ND SCREEN) ─────────────
  invoiceModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    position: 'relative',
    maxHeight: '92%',
  },
  invoiceModalTitle: {
    fontSize: 24,
    color: '#1A2E1A',
    fontFamily: customerFonts.editorial,
    textAlign: 'center',
    marginBottom: 10,
  },
  invoiceDocScrollView: {
    maxHeight: 380,
    marginBottom: 14,
  },
  invoiceDocScrollContent: {
    paddingBottom: 4,
  },
  invoiceDocumentCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    padding: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  invHeaderBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FDFBF7',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 8,
    borderRadius: 4,
    marginBottom: 10,
  },
  invBrandCol: {
    flex: 1,
    paddingRight: 6,
  },
  invLogoRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 3,
  },
  invBrandTohfa: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1B4332',
  },
  invBrandMarket: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
    fontStyle: 'italic',
  },
  invMetaText: {
    fontSize: 8,
    color: '#4B5563',
    lineHeight: 11,
  },
  invTaxCol: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  invTaxInvoiceTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1A2E1A',
    marginBottom: 2,
  },
  invTaxMeta: {
    fontSize: 8,
    color: '#4B5563',
    lineHeight: 11,
  },
  invAddressTable: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 10,
  },
  invAddressColLeft: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    padding: 6,
  },
  invAddressColRight: {
    flex: 1,
    padding: 6,
  },
  invAddressHead: {
    fontSize: 8,
    fontWeight: '800',
    color: '#1B4332',
    marginBottom: 3,
  },
  invCustomerBold: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#1A2E1A',
    lineHeight: 11,
  },
  invAddressLine: {
    fontSize: 8,
    color: '#4B5563',
    lineHeight: 11,
  },
  invOrderItemsHeader: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1B4332',
    marginBottom: 4,
  },
  invItemsTable: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  invItemsTableHead: {
    flexDirection: 'row',
    backgroundColor: '#1E5128',
    paddingVertical: 4,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  invTh: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  invItemRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
  },
  invTd: {
    fontSize: 8,
    color: '#374151',
  },
  invSubtotalBlock: {
    alignItems: 'flex-end',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  invSubtotalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 20,
    marginVertical: 1,
  },
  invSubtotalKey: {
    fontSize: 8,
    color: '#4B5563',
  },
  invSubtotalVal: {
    fontSize: 8,
    fontWeight: '600',
    color: '#1A2E1A',
    minWidth: 46,
    textAlign: 'right',
  },
  invSubtotalDivider: {
    width: 140,
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 3,
  },
  invGrandTotalKey: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1B4332',
  },
  invGrandTotalVal: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1B4332',
    minWidth: 46,
    textAlign: 'right',
  },
  invPaymentBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 4,
    padding: 6,
    marginBottom: 8,
  },
  invPaymentHeading: {
    fontSize: 8,
    fontWeight: '800',
    color: '#1B4332',
    marginBottom: 2,
  },
  invPaymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 1,
  },
  invPaymentText: {
    fontSize: 7.5,
    color: '#2E7D32',
    fontWeight: '600',
  },
  invDisclaimerText: {
    fontSize: 7,
    color: '#9CA3AF',
    lineHeight: 9.5,
    marginBottom: 6,
  },
  invThankYouText: {
    fontSize: 7.5,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 10,
    marginBottom: 6,
  },
  invFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 4,
  },
  invFooterMeta: {
    fontSize: 7,
    color: '#9CA3AF',
  },
  downloadPdfBtn: {
    backgroundColor: '#2D6A4F',
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  downloadPdfBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  closeBtnOutlined: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#2D6A4F',
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  closeBtnOutlinedText: {
    color: '#2D6A4F',
    fontWeight: '700',
    fontSize: 14,
  },
  invoiceInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  infoIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoIconText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7D32',
  },
  invoiceInfoText: {
    fontSize: 11,
    color: '#4B5563',
    flex: 1,
    lineHeight: 15,
  },

  // ── POPUP 3: PICKUP QR CODE MODAL ────────────────────────────────────────
  qrModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    position: 'relative',
  },
  qrImageFrame: {
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginVertical: 12,
  },
  qrImage: {
    width: 180,
    height: 180,
  },
  pickupCodeBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 4,
  },
  pickupCodeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E7D32',
    letterSpacing: 1,
  },
  qrOrderSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
  },
});
