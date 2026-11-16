import React, { useState } from 'react';
import {
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
  Alert,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import {
  customerColors,
  customerFonts,
  customerShadow,
  customerSpacing,
} from '../theme';
import { ProductImages } from '../assets/images/products';
import {
  tohfaMarketLogo,
  divQrCode,
  pickupQrCode,
} from '../assets/images';

export interface OrderTrackingScreenProps {
  orderId?: string | undefined;
  order?: {
    id?: string | undefined;
    title?: string | undefined;
    orderNumber?: string | undefined;
    date?: string | undefined;
    badge?: string | undefined;
    image?: any;
    actionText?: string | undefined;
  } | undefined;
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

const HeartOutlineSvg = ({ size = 18 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
      stroke="#9CA3AF"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ── SOCIAL SVG ICONS FOR SHARE MODAL ───────────────────────────────────────
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

// ── MAIN SCREEN COMPONENT ──────────────────────────────────────────────────
export const OrderTrackingScreen: React.FC<OrderTrackingScreenProps> = ({
  orderId,
  order,
  onNavigate,
  onBack,
}) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showFullInvoiceModal, setShowFullInvoiceModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Dynamic values with sensible defaults matching design
  const displayOrderNumber = order?.orderNumber || orderId || 'ORD-20260712-0028';
  const displayProductName = order?.title || 'Fresh apples';
  const displayProductImage = order?.image || ProductImages.fruitApple;

  // Handle system share
  const handleSystemShare = async (platformName?: string) => {
    try {
      const shareMessage = `TOHFA Market Order Details:
Order ID: ${displayOrderNumber}
Items: Fresh apples, Fuji, Green Curly Lettuce (3 items)
Total: ₹465.00
Pickup Location: Ooty Market
Status: Arrive Tomorrow (06/11/2026)`;

      await Share.share({
        message: shareMessage,
        title: `Order Details - ${displayOrderNumber}`,
      });
      setShowShareModal(false);
    } catch {
      Alert.alert('Shared', `Order details shared via ${platformName || 'App'}`);
      setShowShareModal(false);
    }
  };

  // Handle PDF download
  const handleDownloadInvoice = () => {
    Alert.alert(
      'Invoice Downloaded',
      `Invoice for ${displayOrderNumber} has been saved to your Downloads folder as PDF.`,
      [{ text: 'OK', onPress: () => setShowInvoiceModal(false) }]
    );
  };

  // For You Recommendations
  const forYouItems = [
    { id: 'fy-1', name: 'Watermelon', price: 60, orig: 86, rating: 4.6, image: ProductImages.fruitWatermelon },
    { id: 'fy-2', name: 'Green Curly Lettuce', price: 60, orig: 86, rating: 4.6, image: ProductImages.foryouLettuce },
    { id: 'fy-3', name: 'Strawberry', price: 60, orig: 86, rating: 4.8, image: ProductImages.foryouStrawberries },
    { id: 'fy-4', name: 'Apple', price: 60, orig: 86, rating: 4.6, image: ProductImages.fruitApple },
    { id: 'fy-5', name: 'Orange', price: 60, orig: 86, rating: 4.6, image: ProductImages.catFruit },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeftGroup}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onBack || (() => onNavigate?.('OrderHistory'))}
            style={styles.circleIconButton}
            accessibilityLabel="Back"
          >
            <BackArrowSvg color={customerColors.heading} size={18} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Order</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── TOP PRODUCT CARD ────────────────────────────────────────────────── */}
        <View style={[styles.topProductCard, customerShadow.subtle]}>
          <View style={styles.productThumbBox}>
            <Image
              source={displayProductImage}
              style={styles.productHeroImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.productDetailsCol}>
            <View style={styles.productTitleRow}>
              <Text style={styles.productTitleText} numberOfLines={1}>
                {displayProductName}
              </Text>
              <Text style={styles.productPriceText}>₹312.00</Text>
            </View>

            <View style={styles.productMetaRow}>
              <Text style={styles.starRatingText}>★ 4.8 </Text>
              <Text style={styles.reviewsCountText}>(128 reviews)</Text>
              <Text style={styles.bagWeightText}>  1 kg bag · approx. 6 apples</Text>
            </View>

            <Text style={styles.productTaglineText} numberOfLines={1}>
              Orchard-fresh crunch, picked for your everyday.
            </Text>
          </View>
        </View>

        {/* ── DELIVERY STATES ROW ─────────────────────────────────────────────── */}
        <View style={styles.deliveryStatesRow}>
          <Text style={styles.deliveryStatesLabel}>Delivery states:</Text>
          <View style={styles.deliveryStatesRight}>
            <Text style={styles.deliveryDateText}>06/11/2026</Text>
            <View style={styles.arriveTomorrowPill}>
              <Text style={styles.arriveTomorrowPillText}>Arrive Tomorrow</Text>
            </View>
          </View>
        </View>

        <View style={styles.dashedDivider} />

        {/* ── ORDER SUMMARY ───────────────────────────────────────────────────── */}
        <Text style={styles.sectionHeaderTitle}>Order summary</Text>

        <View style={styles.summaryList}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Arrive states</Text>
            <Text style={styles.summaryVal}>06/11/2026 - Tomorrow</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Order ID</Text>
            <Text style={styles.summaryVal}>{displayOrderNumber}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Order Date</Text>
            <Text style={styles.summaryVal}>12 Jul 2026, 6:15 PM</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Pickup location</Text>
            <Text style={styles.summaryVal}>Home Delivery</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Payment method</Text>
            <Text style={styles.summaryVal}>Gpay</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Pickup code</Text>
            <View style={styles.pickupCodeRow}>
              <Text style={styles.summaryVal}>PICKUP-0039 | </Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => setShowQrModal(true)}>
                <Text style={styles.viewQrLink}>View QR</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.summaryRow, { alignItems: 'flex-start' }]}>
            <Text style={styles.summaryKey}>Pickup or Delivery address</Text>
            <View style={styles.addressValCol}>
              <Text style={styles.addressPhoneText}>Ph: 99944 99944,</Text>
              <Text style={styles.addressBodyText}>
                The main Ooty Municipal Market is located on Commercial Road / Upper Bazar Road, Ooty, Tamil Nadu 643001.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.dashedDivider} />

        {/* ── ORDER ITEMS BREAKDOWN ───────────────────────────────────────────── */}
        <Text style={styles.sectionHeaderTitle}>Order progress</Text>

        <View style={styles.itemsBreakdownList}>
          <View style={styles.itemPriceRow}>
            <View>
              <Text style={styles.itemTitle}>Royal Gala</Text>
              <Text style={styles.itemUnitRate}>1 kg × Rs. 160 / kg</Text>
            </View>
            <Text style={styles.itemAmount}>Rs. 160.00</Text>
          </View>

          <View style={styles.itemPriceRow}>
            <View>
              <Text style={styles.itemTitle}>Fuji</Text>
              <Text style={styles.itemUnitRate}>1 kg × Rs. 152 / kg</Text>
            </View>
            <Text style={styles.itemAmount}>Rs. 152.00</Text>
          </View>

          <View style={styles.itemPriceRow}>
            <View>
              <Text style={styles.itemTitle}>Green Curly Lettuce</Text>
              <Text style={styles.itemUnitRate}>1 kg × Rs. 132 / kg</Text>
            </View>
            <Text style={styles.itemAmount}>Rs. 132.00</Text>
          </View>
        </View>

        <View style={styles.dashedDivider} />

        {/* ── TOTAL PAID ──────────────────────────────────────────────────────── */}
        <View style={styles.totalPaidRow}>
          <Text style={styles.totalPaidLabel}>Total Paid</Text>
          <Text style={styles.totalPaidAmount}>Rs. 465.00</Text>
        </View>

        {/* ── ORDER PROGRESS STEPPER TIMELINE ─────────────────────────────────── */}
        <Text style={[styles.sectionHeaderTitle, { marginTop: 24 }]}>Order progress</Text>

        <View style={styles.timelineStepper}>
          {/* Step 1 */}
          <View style={styles.timelineStep}>
            <View style={styles.timelineLeftCol}>
              <Text style={styles.stepNumber}>1</Text>
              <View style={styles.timelineLineActive} />
            </View>
            <View style={styles.timelineRightCol}>
              <View style={styles.stepTitleRow}>
                <Text style={styles.stepTitle}>Order progress</Text>
                <View style={styles.completedPill}>
                  <Text style={styles.completedPillText}>Completed</Text>
                </View>
              </View>
              <Text style={styles.stepSubtitle}>Your payment was successful.</Text>
            </View>
          </View>

          {/* Step 2 */}
          <View style={styles.timelineStep}>
            <View style={styles.timelineLeftCol}>
              <Text style={styles.stepNumber}>2</Text>
              <View style={styles.timelineLineActive} />
            </View>
            <View style={styles.timelineRightCol}>
              <View style={styles.stepTitleRow}>
                <Text style={styles.stepTitle}>Order confirmed</Text>
                <View style={styles.completedPill}>
                  <Text style={styles.completedPillText}>Completed</Text>
                </View>
              </View>
              <Text style={styles.stepSubtitle}>Your order has been accepted.</Text>
            </View>
          </View>

          {/* Step 3 */}
          <View style={styles.timelineStep}>
            <View style={styles.timelineLeftCol}>
              <Text style={styles.stepNumber}>3</Text>
              <View style={styles.timelineLineMuted} />
            </View>
            <View style={styles.timelineRightCol}>
              <View style={styles.stepTitleRow}>
                <Text style={styles.stepTitle}>Preparing your order</Text>
                <View style={styles.inProgressPill}>
                  <Text style={styles.inProgressPillText}>In progress</Text>
                </View>
              </View>
              <Text style={styles.stepSubtitle}>Your items are being collected and packed.</Text>
            </View>
          </View>

          {/* Step 4 */}
          <View style={styles.timelineStep}>
            <View style={styles.timelineLeftCol}>
              <Text style={styles.stepNumberMuted}>4</Text>
              <View style={styles.timelineLineMuted} />
            </View>
            <View style={styles.timelineRightCol}>
              <Text style={styles.stepTitleMuted}>Ready for pickup</Text>
              <Text style={styles.stepSubtitle}>We'll notify you when your order is ready.</Text>
            </View>
          </View>

          {/* Step 5 */}
          <View style={[styles.timelineStep, { marginBottom: 0 }]}>
            <View style={styles.timelineLeftCol}>
              <Text style={styles.stepNumberMuted}>5</Text>
            </View>
            <View style={styles.timelineRightCol}>
              <Text style={styles.stepTitleMuted}>Order collected</Text>
              <Text style={styles.stepSubtitle}>Your order has been handed over.</Text>
            </View>
          </View>
        </View>

        {/* ── ORDER ACTIONS (6 TILES) ─────────────────────────────────────────── */}
        <Text style={[styles.sectionHeaderTitle, { marginTop: 24 }]}>Order Actions</Text>

        <View style={styles.actionsGrid}>
          {/* Action 1: Contact Support */}
          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.8}
            onPress={() => onNavigate?.('ContactSupport')}
          >
            <HeadsetSupportSvg color="#2E7D32" size={22} />
            <Text style={styles.actionLabel}>Contact Support</Text>
          </TouchableOpacity>

          {/* Action 2: Write a Review & Feedback */}
          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.8}
            onPress={() => onNavigate?.('ReviewFeedback')}
          >
            <StarReviewSvg color="#F59E0B" size={22} />
            <Text style={styles.actionLabel}>Write a Review & Feedback</Text>
          </TouchableOpacity>

          {/* Action 3: Return Order */}
          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.8}
            onPress={() => onNavigate?.('ReturnOrder')}
          >
            <PackageBoxSvg color="#D97706" size={22} />
            <Text style={styles.actionLabel}>Return Order</Text>
          </TouchableOpacity>

          {/* Action 4: Buy Again (REDIRECTS TO HOME) */}
          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.8}
            onPress={() => onNavigate?.('Home')}
          >
            <CartActionSvg color="#2E7D32" size={22} />
            <Text style={styles.actionLabel}>Buy Again</Text>
          </TouchableOpacity>

          {/* Action 5: Share Order Details (OPENS 4TH IMAGE POPUP) */}
          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.8}
            onPress={() => setShowShareModal(true)}
          >
            <ShareNodesSvg color="#2E7D32" size={22} />
            <Text style={styles.actionLabel}>Share Order Detalis</Text>
          </TouchableOpacity>

          {/* Action 6: Download Invoice (OPENS 5TH IMAGE POPUP) */}
          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.8}
            onPress={() => setShowInvoiceModal(true)}
          >
            <DownloadTraySvg color="#2E7D32" size={22} />
            <Text style={styles.actionLabel}>Download Invoice</Text>
          </TouchableOpacity>
        </View>

        {/* ── FOR YOU SECTION ─────────────────────────────────────────────────── */}
        <Text style={[styles.sectionHeaderTitle, { marginTop: 24, fontSize: 22 }]}>For you</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.forYouScrollContent}
        >
          {forYouItems.map((item) => (
            <View key={item.id} style={styles.forYouCardContainer}>
              <View style={[styles.forYouCard, customerShadow.subtle]}>
                <View style={styles.forYouTopRow}>
                  <View style={styles.forYouRatingBadge}>
                    <Text style={styles.forYouStar}>★ </Text>
                    <Text style={styles.forYouRatingText}>{item.rating.toFixed(1)}</Text>
                  </View>
                  <TouchableOpacity activeOpacity={0.7} style={styles.forYouHeartBtn}>
                    <HeartOutlineSvg size={16} />
                  </TouchableOpacity>
                </View>

                <View style={styles.forYouImageCenter}>
                  <Image source={item.image} style={styles.forYouImage} resizeMode="contain" />
                </View>

                <View style={styles.forYouPriceRow}>
                  <Text style={styles.forYouPriceBold}>₹ {item.price}</Text>
                  <Text style={styles.forYouPriceStrike}>₹ {item.orig}</Text>
                  <Text style={styles.forYouUnitText}>kg</Text>
                </View>
              </View>

              <Text style={styles.forYouProductName} numberOfLines={1}>
                {item.name}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ══════════════════════════════════════════════════════════════════════════
          POPUP 1: SHARE ORDER DETAILS MODAL (MATCHING EXACT 4TH IMAGE)
         ══════════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showShareModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCardContainer}>
            <View style={styles.shareModalCard}>
              {/* Corner Circular Close Button - Exact Position */}
              <TouchableOpacity
                style={styles.floatingCloseBtn}
                activeOpacity={0.8}
                onPress={() => setShowShareModal(false)}
                accessibilityLabel="Close"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <ModalCloseCrossSvg size={14} color="#1F2937" />
              </TouchableOpacity>

              {/* Big Green Share Circle */}
              <View style={styles.largeIconCircle}>
                <ShareNodesSvg color="#2E7D32" size={30} />
              </View>

              {/* Title & Subtitle */}
              <Text style={styles.modalEditorialTitle}>Share Order Details</Text>
              <Text style={styles.modalSubtitle}>Share your information with family or friends.</Text>

              {/* Receipt Ticket Box */}
              <View style={styles.receiptContainer}>
                {/* Logo & Header */}
                <Image
                  source={tohfaMarketLogo}
                  style={styles.receiptLogoImage}
                  resizeMode="contain"
                />
                <Text style={styles.receiptOrderDetailsHeader}>Order Details</Text>

                {/* Receipt Key-Value Rows */}
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptKey}>Order ID</Text>
                  <Text style={styles.receiptValBold}>{displayOrderNumber}</Text>
                </View>

                <View style={styles.receiptRow}>
                  <Text style={styles.receiptKey}>Order Date</Text>
                  <Text style={styles.receiptVal}>15 Nov 2026, 9:41 AM</Text>
                </View>

                <View style={styles.receiptRow}>
                  <Text style={styles.receiptKey}>Items</Text>
                  <Text style={styles.receiptVal}>3 Items</Text>
                </View>

                <View style={styles.receiptRow}>
                  <Text style={styles.receiptKey}>Total Paid</Text>
                  <Text style={styles.receiptTotalPaid}>₹465.00</Text>
                </View>

                {/* Pickup Location Highlight Box */}
                <View style={styles.receiptPickupBox}>
                  <Text style={{ fontSize: 16 }}>📍</Text>
                  <View>
                    <Text style={styles.receiptPickupSub}>Pickup Location</Text>
                    <Text style={styles.receiptPickupTitle}>Ooty Market</Text>
                  </View>
                </View>

                {/* Ordered Items List */}
                <View style={styles.receiptItemsList}>
                  <View style={styles.receiptItemRow}>
                    <Image source={ProductImages.fruitApple} style={styles.receiptItemThumb} resizeMode="contain" />
                    <Text style={styles.receiptItemTitle}>Fresh apples (1 kg)</Text>
                    <Text style={styles.receiptItemPrice}>₹160.00</Text>
                  </View>

                  <View style={styles.receiptItemRow}>
                    <Image source={ProductImages.fruitApple} style={styles.receiptItemThumb} resizeMode="contain" />
                    <Text style={styles.receiptItemTitle}>Fuji (1 kg)</Text>
                    <Text style={styles.receiptItemPrice}>₹152.00</Text>
                  </View>

                  <View style={styles.receiptItemRow}>
                    <Image source={ProductImages.foryouLettuce} style={styles.receiptItemThumb} resizeMode="contain" />
                    <Text style={styles.receiptItemTitle}>Green Curly Lettuce (1 kg)</Text>
                    <Text style={styles.receiptItemPrice}>₹132.00</Text>
                  </View>
                </View>

                {/* Scalloped / Perforated Bottom Edge */}
                <View style={styles.scallopEdgeContainer}>
                  {[...Array(12)].map((_, i) => (
                    <View key={`scallop-${i}`} style={styles.scallopCircle} />
                  ))}
                </View>
              </View>

              {/* Share Order Details Header & Social Row */}
              <Text style={styles.shareOptionsHeader}>Share Order Details</Text>
              <View style={styles.socialButtonsRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleSystemShare('WhatsApp')}
                  style={styles.socialBtnCol}
                >
                  <WhatsAppSvg />
                  <Text style={styles.socialBtnLabel}>WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleSystemShare('Telegram')}
                  style={styles.socialBtnCol}
                >
                  <TelegramSvg />
                  <Text style={styles.socialBtnLabel}>Telegram</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleSystemShare('Message')}
                  style={styles.socialBtnCol}
                >
                  <MessageSvg />
                  <Text style={styles.socialBtnLabel}>Message</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleSystemShare('Email')}
                  style={styles.socialBtnCol}
                >
                  <EmailSvg />
                  <Text style={styles.socialBtnLabel}>Email</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleSystemShare('Other')}
                  style={styles.socialBtnCol}
                >
                  <MoreSvg />
                  <Text style={styles.socialBtnLabel}>More</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════════
          POPUP 2A: DOWNLOAD INVOICE MODAL (1ST SCREEN FROM USER)
         ══════════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showInvoiceModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInvoiceModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCardContainer}>
            <View style={styles.downloadInvoiceModalCard}>
              {/* Corner Circular Close Button - Exact Position */}
              <TouchableOpacity
                style={styles.floatingCloseBtn}
                activeOpacity={0.8}
                onPress={() => setShowInvoiceModal(false)}
                accessibilityLabel="Close"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <ModalCloseCrossSvg size={14} color="#1F2937" />
              </TouchableOpacity>

              {/* Big Green Download Tray Circle */}
              <View style={styles.largeIconCircle}>
                <DownloadTraySvg color="#2E7D32" size={30} />
              </View>

              {/* Title & Subtitle */}
              <Text style={styles.modalEditorialTitle}>Download Invoice</Text>
              <Text style={styles.modalSubtitle}>View or download the invoice for your order.</Text>

              {/* Order ID Banner Card */}
              <View style={styles.orderIdBannerCard}>
                <View style={styles.orderBagCircle}>
                  <CartActionSvg color="#2E7D32" size={18} />
                </View>
                <View>
                  <Text style={styles.orderIdBannerTitle}>Order ID: {displayOrderNumber}</Text>
                  <Text style={styles.orderIdBannerSub}>15 Nov 2026 - 3 items</Text>
                </View>
              </View>

              {/* Invoice Label */}
              <Text style={styles.invoiceSectionTitle}>Invoice</Text>

              {/* Stylized Miniature Invoice Document Preview */}
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
                    <Text style={styles.miniInvoiceMeta}>Nilgiris Horticulture Traders Association</Text>
                    <Text style={styles.miniInvoiceMeta}>GSTIN: 33AAAAA0000A1Z5</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.miniInvoiceInvNo}>Tax Invoice</Text>
                    <Text style={styles.miniInvoiceMeta}>Inv No: TOH-2026-071855</Text>
                    <Text style={styles.miniInvoiceMeta}>Status: PAID</Text>
                  </View>
                </View>

                {/* Mini Invoice Table Header */}
                <View style={styles.miniInvoiceTableHead}>
                  <Text style={[styles.miniInvoiceColHead, { flex: 2 }]}>Product</Text>
                  <Text style={styles.miniInvoiceColHead}>Qty</Text>
                  <Text style={styles.miniInvoiceColHead}>Price</Text>
                  <Text style={[styles.miniInvoiceColHead, { textAlign: 'right' }]}>Amount</Text>
                </View>

                {/* Mini Item Rows */}
                <View style={styles.miniInvoiceRow}>
                  <Text style={[styles.miniInvoiceCell, { flex: 2 }]} numberOfLines={1}>Royal Gala Apple</Text>
                  <Text style={styles.miniInvoiceCell}>1 kg</Text>
                  <Text style={styles.miniInvoiceCell}>₹160</Text>
                  <Text style={[styles.miniInvoiceCell, { textAlign: 'right' }]}>₹160.00</Text>
                </View>
                <View style={styles.miniInvoiceRow}>
                  <Text style={[styles.miniInvoiceCell, { flex: 2 }]} numberOfLines={1}>Fuji Apple</Text>
                  <Text style={styles.miniInvoiceCell}>1 kg</Text>
                  <Text style={styles.miniInvoiceCell}>₹152</Text>
                  <Text style={[styles.miniInvoiceCell, { textAlign: 'right' }]}>₹152.00</Text>
                </View>
                <View style={styles.miniInvoiceRow}>
                  <Text style={[styles.miniInvoiceCell, { flex: 2 }]} numberOfLines={1}>Green Curly Lettuce</Text>
                  <Text style={styles.miniInvoiceCell}>1 kg</Text>
                  <Text style={styles.miniInvoiceCell}>₹132</Text>
                  <Text style={[styles.miniInvoiceCell, { textAlign: 'right' }]}>₹132.00</Text>
                </View>
              </TouchableOpacity>

              {/* Action Button 1: Download Invoice (PDF) */}
              <TouchableOpacity
                style={styles.downloadPdfBtn}
                activeOpacity={0.85}
                onPress={handleDownloadInvoice}
              >
                <Text style={styles.downloadPdfBtnText}>Download Invoice (PDF)</Text>
              </TouchableOpacity>

              {/* Action Button 2: View Invoice (OPENS 2ND SCREEN POPUP) */}
              <TouchableOpacity
                style={styles.closeBtnOutlined}
                activeOpacity={0.85}
                onPress={() => {
                  setShowInvoiceModal(false);
                  setShowFullInvoiceModal(true);
                }}
              >
                <Text style={styles.closeBtnOutlinedText}>View Invoice</Text>
              </TouchableOpacity>

              {/* Light Green Info Notice Box */}
              <View style={styles.invoiceInfoBox}>
                <View style={styles.infoIconCircle}>
                  <Text style={styles.infoIconText}>i</Text>
                </View>
                <Text style={styles.invoiceInfoText}>
                  The invoice includes item details, total amount, taxes (if applicable)and payment information.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════════
          POPUP 2B: FULL INVOICE VIEW MODAL (2ND SCREEN FROM USER)
         ══════════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showFullInvoiceModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFullInvoiceModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCardContainer}>
            <View style={styles.invoiceModalCard}>
              {/* Corner Circular Close Button - Exact Position */}
              <TouchableOpacity
                style={styles.floatingCloseBtn}
                activeOpacity={0.8}
                onPress={() => setShowFullInvoiceModal(false)}
                accessibilityLabel="Close"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <ModalCloseCrossSvg size={14} color="#1F2937" />
              </TouchableOpacity>

              {/* Title: "Invoice" in editorial script font */}
              <Text style={styles.invoiceModalTitle}>Invoice</Text>

              {/* Exact Invoice Document Card (Scrollable for clear reading) */}
              <ScrollView
                style={styles.invoiceDocScrollView}
                contentContainerStyle={styles.invoiceDocScrollContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.invoiceDocumentCard}>
                  {/* Top Header Box (Cream background #FDFBF7) */}
                  <View style={styles.invHeaderBox}>
                    <View style={styles.invBrandCol}>
                      <View style={styles.invLogoRow}>
                        <Text style={styles.invBrandTohfa}>TOHFA </Text>
                        <Text style={styles.invBrandMarket}>Market</Text>
                      </View>
                      <Text style={styles.invMetaText}>Nilgiris Horticulture Organic Farmers Association</Text>
                      <Text style={styles.invMetaText}>Sample address: Ooty, The Nilgiris, Tamil Nadu - 643001</Text>
                      <Text style={styles.invMetaText}>support@tohfa.example | +91 98765 43210</Text>
                      <Text style={styles.invMetaText}>GSTIN: 33XXXXXXXXX1Z5 (sample placeholder)</Text>
                    </View>

                    <View style={styles.invTaxCol}>
                      <Text style={styles.invTaxInvoiceTitle}>TAX INVOICE</Text>
                      <Text style={styles.invTaxMeta}>Invoice No.: TFM/2026-27/0001</Text>
                      <Text style={styles.invTaxMeta}>Invoice Date: 12 Nov 2026</Text>
                      <Text style={styles.invTaxMeta}>Order ID: ORD-20261112-0001</Text>
                      <Text style={styles.invTaxMeta}>Payment Status: Paid</Text>
                    </View>
                  </View>

                  {/* Two-Column Bill To & Delivery Address Table */}
                  <View style={styles.invAddressTable}>
                    <View style={styles.invAddressColLeft}>
                      <Text style={styles.invAddressHead}>BILL TO</Text>
                      <Text style={styles.invCustomerBold}>Arun Kumar</Text>
                      <Text style={styles.invAddressLine}>Mobile: +91 98765 43210</Text>
                      <Text style={styles.invAddressLine}>arunkumar@example.com</Text>
                    </View>
                    <View style={styles.invAddressColRight}>
                      <Text style={styles.invAddressHead}>DELIVERY ADDRESS</Text>
                      <Text style={styles.invAddressLine}>No. 12, Tea Garden Road</Text>
                      <Text style={styles.invAddressLine}>Ooty, The Nilgiris, Tamil Nadu - 643001</Text>
                      <Text style={styles.invAddressLine}>India</Text>
                    </View>
                  </View>

                  {/* ORDER ITEMS Section */}
                  <Text style={styles.invOrderItemsHeader}>ORDER ITEMS</Text>
                  <View style={styles.invItemsTable}>
                    {/* Green Table Header */}
                    <View style={styles.invItemsTableHead}>
                      <Text style={[styles.invTh, { width: 18 }]}>#</Text>
                      <Text style={[styles.invTh, { flex: 2 }]}>Product description</Text>
                      <Text style={[styles.invTh, { width: 34, textAlign: 'center' }]}>Qty</Text>
                      <Text style={[styles.invTh, { width: 56, textAlign: 'right' }]}>Unit price</Text>
                      <Text style={[styles.invTh, { width: 60, textAlign: 'right' }]}>Amount</Text>
                    </View>

                    {/* Item 1 */}
                    <View style={styles.invItemRow}>
                      <Text style={[styles.invTd, { width: 18 }]}>1</Text>
                      <Text style={[styles.invTd, { flex: 2 }]}>Royal Gala Apple</Text>
                      <Text style={[styles.invTd, { width: 34, textAlign: 'center' }]}>1 kg</Text>
                      <Text style={[styles.invTd, { width: 56, textAlign: 'right' }]}>₹160.00</Text>
                      <Text style={[styles.invTd, { width: 60, textAlign: 'right' }]}>₹160.00</Text>
                    </View>

                    {/* Item 2 */}
                    <View style={[styles.invItemRow, { backgroundColor: '#FCFBF8' }]}>
                      <Text style={[styles.invTd, { width: 18 }]}>2</Text>
                      <Text style={[styles.invTd, { flex: 2 }]}>Fuji Apple</Text>
                      <Text style={[styles.invTd, { width: 34, textAlign: 'center' }]}>1 kg</Text>
                      <Text style={[styles.invTd, { width: 56, textAlign: 'right' }]}>₹152.00</Text>
                      <Text style={[styles.invTd, { width: 60, textAlign: 'right' }]}>₹152.00</Text>
                    </View>

                    {/* Item 3 */}
                    <View style={styles.invItemRow}>
                      <Text style={[styles.invTd, { width: 18 }]}>3</Text>
                      <Text style={[styles.invTd, { flex: 2 }]}>Green Curly Lettuce</Text>
                      <Text style={[styles.invTd, { width: 34, textAlign: 'center' }]}>1 kg</Text>
                      <Text style={[styles.invTd, { width: 56, textAlign: 'right' }]}>₹132.00</Text>
                      <Text style={[styles.invTd, { width: 60, textAlign: 'right' }]}>₹132.00</Text>
                    </View>
                  </View>

                  {/* Subtotals & Fees */}
                  <View style={styles.invSubtotalBlock}>
                    <View style={styles.invSubtotalRow}>
                      <Text style={styles.invSubtotalKey}>Items subtotal</Text>
                      <Text style={styles.invSubtotalVal}>₹444.00</Text>
                    </View>
                    <View style={styles.invSubtotalRow}>
                      <Text style={styles.invSubtotalKey}>Delivery fee</Text>
                      <Text style={styles.invSubtotalVal}>₹9.00</Text>
                    </View>
                    <View style={styles.invSubtotalRow}>
                      <Text style={styles.invSubtotalKey}>Handling fee</Text>
                      <Text style={styles.invSubtotalVal}>₹12.00</Text>
                    </View>
                    <View style={styles.invSubtotalRow}>
                      <Text style={styles.invSubtotalKey}>Tax (illustrative sample)</Text>
                      <Text style={styles.invSubtotalVal}>₹0.00</Text>
                    </View>

                    <View style={styles.invSubtotalDivider} />

                    <View style={styles.invSubtotalRow}>
                      <Text style={styles.invGrandTotalKey}>Grand total</Text>
                      <Text style={styles.invGrandTotalVal}>₹465.00</Text>
                    </View>
                  </View>

                  {/* Payment Details Box */}
                  <View style={styles.invPaymentBox}>
                    <Text style={styles.invPaymentHeading}>PAYMENT DETAILS</Text>
                    <View style={styles.invPaymentRow}>
                      <Text style={styles.invPaymentText}>Payment method: TOHFA Wallet</Text>
                      <Text style={styles.invPaymentText}>Payment reference: WALLET-TXN-000184</Text>
                    </View>
                    <View style={styles.invPaymentRow}>
                      <Text style={styles.invPaymentText}>Payment status: PAID</Text>
                      <Text style={styles.invPaymentText}>Paid on: 12 Nov 2026, 09:15 AM</Text>
                    </View>
                  </View>

                  {/* Disclaimers & Thank you */}
                  <Text style={styles.invDisclaimerText}>
                    Sample only: This invoice is for UI/UX design and prototype purposes. Business address, GSTIN, customer details, invoice number and tax treatment are illustrative placeholders. Replace with verified business and tax information before production use.
                  </Text>
                  <Text style={styles.invThankYouText}>
                    Thank you for choosing TOHFA Market.{'\n'}Fresh from Nilgiri farms to your home.
                  </Text>
                  <View style={styles.invFooterRow}>
                    <Text style={styles.invFooterMeta}>TOHFA Market • Sample Invoice</Text>
                    <Text style={styles.invFooterMeta}>Page 1</Text>
                  </View>
                </View>
              </ScrollView>

              {/* Action Button 1: Download Invoice (PDF) */}
              <TouchableOpacity
                style={styles.downloadPdfBtn}
                activeOpacity={0.85}
                onPress={handleDownloadInvoice}
              >
                <Text style={styles.downloadPdfBtnText}>Download Invoice (PDF)</Text>
              </TouchableOpacity>

              {/* Action Button 2: Close (Outlined) */}
              <TouchableOpacity
                style={styles.closeBtnOutlined}
                activeOpacity={0.85}
                onPress={() => setShowFullInvoiceModal(false)}
              >
                <Text style={styles.closeBtnOutlinedText}>Close</Text>
              </TouchableOpacity>

              {/* Light Green Info Notice Box */}
              <View style={styles.invoiceInfoBox}>
                <View style={styles.infoIconCircle}>
                  <Text style={styles.infoIconText}>i</Text>
                </View>
                <Text style={styles.invoiceInfoText}>
                  The invoice includes item details, total amount, taxes (if applicable)and payment information.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════════
          POPUP 3: PICKUP QR CODE MODAL (WHEN CLICKING "View QR")
         ══════════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showQrModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQrModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCardContainer}>
            <View style={styles.qrModalCard}>
              <TouchableOpacity
                style={styles.floatingCloseBtn}
                activeOpacity={0.8}
                onPress={() => setShowQrModal(false)}
                accessibilityLabel="Close"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <ModalCloseCrossSvg size={14} color="#1F2937" />
              </TouchableOpacity>

              <Text style={styles.modalEditorialTitle}>Pickup QR Code</Text>
              <Text style={styles.modalSubtitle}>Show this QR code at the counter for pickup</Text>

              <View style={styles.qrImageFrame}>
                <Image
                  source={divQrCode || pickupQrCode}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.pickupCodeBadge}>
                <Text style={styles.pickupCodeText}>PICKUP-0039</Text>
              </View>
              <Text style={styles.qrOrderSubtitle}>Order: {displayOrderNumber}</Text>
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
