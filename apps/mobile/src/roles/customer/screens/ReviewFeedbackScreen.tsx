import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  Platform,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  customerColors,
  customerFonts,
  customerSpacing,
} from '../theme';
import {
  BackArrowSvg,
  ProduceCrateSvg,
  ShoppingBagSvg,
  ChevronDownSvg,
  StarSvg,
  CheckboxSvg,
} from '../components/ContactSupportIcons';
import { ApiError } from '../../../shell/api/client';
import { isReviewEligible, useOrder, useOrders, type OrderSummary } from '../api/orders';
import { useCreateOrderReview, useOrderReview, type OrderReview, type ReviewTag } from '../api/reviews';
import { mapProblem } from '../api/problem';
import { formatKg } from '../utils/money';
import { formatIstDate } from '../utils/orderFormat';
import { t, type TranslationKey } from '../../../i18n/customer';
import { ReviewSubmittedModal } from '../components/ReviewSubmittedModal';

export interface ReviewFeedbackScreenProps {
  /** Order uuid to review; when absent the first eligible order is preselected. */
  orderId?: string | undefined;
  onBack?: () => void;
  onNavigate?: (screen: string, params?: Record<string, unknown>) => void;
}

/** The existing chips mapped onto the API tag vocabulary (CreateOrderReviewRequest.tags). */
export const REVIEW_TAG_OPTIONS: { tag: ReviewTag; labelKey: TranslationKey }[] = [
  { tag: 'QUALITY', labelKey: 'customer.orders.review.tag.QUALITY' },
  { tag: 'FRESHNESS', labelKey: 'customer.orders.review.tag.FRESHNESS' },
  { tag: 'PACKAGING', labelKey: 'customer.orders.review.tag.PACKAGING' },
  { tag: 'DELIVERY', labelKey: 'customer.orders.review.tag.DELIVERY' },
  { tag: 'VALUE_FOR_MONEY', labelKey: 'customer.orders.review.tag.VALUE_FOR_MONEY' },
  { tag: 'TASTE', labelKey: 'customer.orders.review.tag.TASTE' },
  { tag: 'SERVICE', labelKey: 'customer.orders.review.tag.SERVICE' },
];

const ratingLabel = (r: number) =>
  r >= 4 ? t('customer.orders.review.rating.excellent') : r >= 3 ? t('customer.orders.review.rating.good') : t('customer.orders.review.rating.average');

/**
 * Review & feedback (Figma 46:42514 / 46:42631). One review per ORDER
 * (POST /orders/{id}/review): overall rating, tags, comment and per-line ratings
 * keyed by orderItemId. Only DELIVERED / PICKED_UP orders are offered; an order
 * already reviewed shows the existing review read-only.
 */
export const ReviewFeedbackScreen: React.FC<ReviewFeedbackScreenProps> = ({ orderId: initialOrderId, onBack, onNavigate }) => {
  const insets = useSafeAreaInsets();
  const ordersQuery = useOrders();
  const eligibleOrders: OrderSummary[] = (ordersQuery.data?.pages.flatMap((p) => p.items) ?? []).filter((o) => isReviewEligible(o.status));
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(initialOrderId ?? null);
  const effectiveOrderId = selectedOrderId ?? eligibleOrders[0]?.id ?? null;
  const orderQuery = useOrder(effectiveOrderId);
  const order = orderQuery.data;
  const existingQuery = useOrderReview(effectiveOrderId);
  const existing = existingQuery.data ?? null;
  const createReview = useCreateOrderReview();

  const [showOrderPicker, setShowOrderPicker] = useState<boolean>(false);
  const [itemRatings, setItemRatings] = useState<Record<string, number>>({});
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [overallRating, setOverallRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<ReviewTag[]>([]);
  const [submitted, setSubmitted] = useState<OrderReview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);

  React.useEffect(() => {
    setItemRatings({});
    setOverallRating(0);
    setSelectedTags([]);
    setReviewText('');
    setError(null);
    setCommentError(null);
  }, [effectiveOrderId]);

  const headerTopPadding = insets.top > 0
    ? insets.top + 8
    : (Platform.OS === 'android' ? (StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 44) : 16);

  const readOnly = !!existing;
  const shownOverall = existing?.rating ?? overallRating;
  const ratingFor = (orderItemId: string) => existing?.items.find((i) => i.orderItemId === orderItemId)?.rating ?? itemRatings[orderItemId] ?? 0;
  const tagChecked = (tag: ReviewTag) => (existing ? existing.tags.includes(tag) : selectedTags.includes(tag));

  const toggleTag = (tag: ReviewTag) => {
    if (readOnly) return;
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleSubmit = async () => {
    if (!order || readOnly) return;
    if (overallRating < 1) {
      setError(t('customer.orders.review.overallRequired'));
      return;
    }
    setError(null);
    setCommentError(null);
    try {
      const review = await createReview.mutateAsync({
        orderId: order.id,
        input: {
          rating: overallRating,
          tags: selectedTags,
          comment: reviewText,
          items: Object.entries(itemRatings).map(([orderItemId, rating]) => ({ orderItemId, rating })),
        },
      });
      setSubmitted(review);
    } catch (err) {
      const p = mapProblem(err);
      if (p.silent) return;
      const code = err instanceof ApiError ? (err.code as string) : '';
      if (code === 'CONFLICT') {
        setError(t('customer.orders.review.alreadyReviewed'));
        void existingQuery.refetch();
        return;
      }
      if (code === 'INVALID_STATE_TRANSITION') {
        setError(t('customer.orders.review.notEligible'));
        return;
      }
      const fe = p.fieldErrors ?? {};
      const c = fe['body.comment'] ?? fe['comment'];
      if (c) setCommentError(c);
      setError(p.message);
    }
  };

  const thumbFor = (name: string) => order?.thumbnails?.find((t) => t.productName === name)?.imageUrl;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={[styles.headerRow, { paddingTop: headerTopPadding }]}>
        <View style={styles.headerLeftGroup}>
          <TouchableOpacity style={styles.circleIconButton} onPress={onBack} activeOpacity={0.7} accessibilityLabel={t('customer.orders.review.back')}>
            <BackArrowSvg color={customerColors.heading} size={18} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('customer.orders.review.title')}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.bannerCard}>
          <View style={styles.bannerTextColumn}>
            <Text style={styles.bannerTitle}>{readOnly ? t('customer.orders.review.yourReview') : t('customer.orders.review.shareExperience')}</Text>
            <Text style={styles.bannerSubtitle}>{t('customer.orders.review.bannerSubtitle')}</Text>
          </View>
          <View style={styles.bannerIllustration}>
            <ProduceCrateSvg size={68} />
          </View>
        </View>

        <TouchableOpacity style={styles.orderCard} activeOpacity={0.7} onPress={() => setShowOrderPicker(true)} accessibilityLabel={t('customer.orders.review.selectOrderA11y')} testID="review-order-card">
          <View style={styles.orderIconBadge}>
            <ShoppingBagSvg color={customerColors.primary} size={20} />
          </View>
          <View style={styles.orderTextColumn}>
            <Text style={styles.orderNumber}>{order?.orderNumber ?? (ordersQuery.isLoading || orderQuery.isLoading ? t('customer.orders.review.loading') : t('customer.orders.review.noOrders'))}</Text>
            {order && <Text style={styles.orderSubtitle}>{t('customer.orders.review.itemsLine', { date: formatIstDate(order.placedAt), count: order.items.length })}</Text>}
          </View>
          <ChevronDownSvg color={customerColors.neutral.neutral700} size={20} />
        </TouchableOpacity>

        {(orderQuery.isLoading || existingQuery.isLoading) && <ActivityIndicator testID="review-loading" />}

        <Text style={styles.sectionTitle}>{t('customer.orders.review.reviewItems')}</Text>
        <View style={styles.reviewItemsContainer}>
          {(order?.items ?? []).map((item) => {
            const isActive = activeItemId === item.id;
            const rating = ratingFor(item.id);
            const thumb = thumbFor(item.name);
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.reviewItemCard, isActive && styles.reviewItemCardActive]}
                activeOpacity={0.8}
                onPress={() => setActiveItemId(item.id)}
                accessibilityLabel={t('customer.orders.review.reviewA11y', { name: item.name })}
              >
                {thumb ? <Image source={{ uri: thumb }} style={styles.reviewThumb} resizeMode="contain" /> : <View style={styles.reviewThumb} />}
                <View style={styles.reviewInfoCol}>
                  <Text style={styles.reviewItemName}>
                    {item.name} <Text style={styles.reviewItemWeight}>({formatKg(item.qtyKg)})</Text>
                  </Text>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity
                        key={star}
                        disabled={readOnly}
                        hitSlop={{ top: 6, bottom: 6, left: 3, right: 3 }}
                        onPress={() => {
                          setActiveItemId(item.id);
                          setItemRatings((prev) => ({ ...prev, [item.id]: star }));
                        }}
                        accessibilityLabel={t('customer.orders.review.rateItemA11y', { name: item.name, star })}
                        testID={`item-star-${item.id}-${star}`}
                      >
                        <StarSvg filled={star <= rating} size={15} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                {rating > 0 ? (
                  <View style={styles.excellentBadge}>
                    <Text style={styles.excellentBadgeText}>{ratingLabel(rating)}</Text>
                  </View>
                ) : (
                  <Text style={styles.tapToRateText}>{t('customer.orders.review.tapToRate')}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>{t('customer.orders.review.overall')}</Text>
        <View style={styles.overallRatingRow}>
          <View style={styles.overallStars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                disabled={readOnly}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                onPress={() => setOverallRating(star)}
                accessibilityLabel={t('customer.orders.review.rateOverallA11y', { star })}
                testID={`overall-star-${star}`}
              >
                <StarSvg filled={star <= shownOverall} size={30} />
              </TouchableOpacity>
            ))}
          </View>
          <View style={[styles.scoreBadge, shownOverall > 0 ? styles.scoreBadgePositive : styles.scoreBadgeZero]}>
            <Text style={[styles.scoreText, shownOverall > 0 ? styles.scoreTextPositive : styles.scoreTextZero]}>{`${shownOverall}.0`}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t('customer.orders.review.yourReviewHeading')}</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder={t('customer.orders.review.placeholder')}
            placeholderTextColor={customerColors.neutral.neutral500}
            multiline
            maxLength={1000}
            editable={!readOnly}
            value={existing ? (existing.comment ?? '') : reviewText}
            onChangeText={setReviewText}
            testID="review-comment"
          />
          <Text style={styles.charCounter}>{`${(existing?.comment ?? reviewText).length}/1000`}</Text>
        </View>
        {!!commentError && (
          <Text style={styles.charCounter} testID="review-comment-error">
            {commentError}
          </Text>
        )}

        <Text style={styles.sectionTitle}>{t('customer.orders.review.whatLiked')}</Text>
        <View style={styles.aspectsGrid}>
          {REVIEW_TAG_OPTIONS.map(({ tag, labelKey }) => {
            const isChecked = tagChecked(tag);
            const label = t(labelKey);
            return (
              <TouchableOpacity
                key={tag}
                style={[styles.aspectCard, isChecked && styles.aspectCardChecked]}
                activeOpacity={0.8}
                onPress={() => toggleTag(tag)}
                accessibilityLabel={label}
                testID={`tag-${tag}`}
              >
                <CheckboxSvg checked={isChecked} size={18} />
                <Text style={[styles.aspectLabel, isChecked && styles.aspectLabelChecked]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {!!error && (
          <Text style={styles.charCounter} accessibilityRole="alert" testID="review-error">
            {error}
          </Text>
        )}

        {!readOnly && (
          <TouchableOpacity
            style={[styles.submitButton, (!order || createReview.isPending) && { opacity: 0.6 }]}
            activeOpacity={0.85}
            disabled={!order || createReview.isPending}
            onPress={() => void handleSubmit()}
            accessibilityLabel={t('customer.orders.review.submit')}
            testID="review-submit"
          >
            {createReview.isPending ? <ActivityIndicator color={customerColors.white} /> : <Text style={styles.submitButtonText}>{t('customer.orders.review.submit')}</Text>}
          </TouchableOpacity>
        )}
      </ScrollView>

      <Modal visible={showOrderPicker} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowOrderPicker(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('customer.orders.review.selectOrderTitle')}</Text>
            {eligibleOrders.length === 0 && <Text style={styles.orderSubtitle}>{t('customer.orders.review.pickerEmpty')}</Text>}
            {eligibleOrders.map((ord) => (
              <TouchableOpacity
                key={ord.id}
                style={[styles.modalOrderItem, effectiveOrderId === ord.id && styles.modalOrderItemActive]}
                onPress={() => {
                  setSelectedOrderId(ord.id);
                  setShowOrderPicker(false);
                }}
              >
                <Text style={styles.orderNumber}>{ord.orderNumber}</Text>
                <Text style={styles.orderSubtitle}>{t('customer.orders.review.itemsLine', { date: formatIstDate(ord.placedAt), count: ord.itemCount ?? 0 })}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <ReviewSubmittedModal
        visible={!!submitted}
        orderNumber={order?.orderNumber ?? ''}
        productName={order?.items[0]?.name ?? ''}
        products={(order?.items ?? []).map((it) => ({
          id: it.id,
          name: it.name,
          weight: `(${formatKg(it.qtyKg)})`,
          imageUri: thumbFor(it.name),
          reviewed: true,
          rating: submitted?.items.find((i) => i.orderItemId === it.id)?.rating ?? submitted?.rating ?? 0,
        }))}
        onClose={() => setSubmitted(null)}
        onReviewAnother={() => {
          setSubmitted(null);
          onNavigate?.('OrderHistory');
        }}
        onContinueShopping={() => {
          setSubmitted(null);
          onNavigate?.('Home');
        }}
      />
    </View>
  );
};

// ── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: customerColors.white,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: customerSpacing.base,
    paddingTop: 12,
    paddingBottom: 48,
  },

  /* Header */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: customerSpacing.base,
    paddingBottom: 10,
    backgroundColor: customerColors.white,
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
    borderColor: customerColors.heading,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: customerFonts.editorial,
    color: customerColors.heading,
  },

  /* Banner Card */
  bannerCard: {
    backgroundColor: customerColors.palette.green.paleMint,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  bannerTextColumn: {
    flex: 1,
    paddingRight: 12,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: customerColors.heading,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: customerColors.neutral.neutral700,
    marginTop: 4,
    lineHeight: 18,
  },
  bannerIllustration: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Select Order */
  orderCard: {
    borderWidth: 1.2,
    borderColor: customerColors.neutral.neutral300,
    borderRadius: 14,
    backgroundColor: customerColors.white,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  orderIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: customerColors.selected,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orderTextColumn: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: customerColors.neutral.neutral950,
  },
  orderSubtitle: {
    fontSize: 12.5,
    color: customerColors.neutral.neutral600,
    marginTop: 2,
  },

  /* Section Title */
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: customerColors.neutral.neutral950,
    marginBottom: 10,
    marginTop: 6,
  },

  /* Review your items */
  reviewItemsContainer: {
    gap: 10,
    marginBottom: 22,
  },
  reviewItemCard: {
    borderWidth: 1.2,
    borderColor: customerColors.neutral.neutral300,
    borderRadius: 12,
    backgroundColor: customerColors.white,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewItemCardActive: {
    borderColor: customerColors.primary,
    backgroundColor: customerColors.palette.green.paleMint,
  },
  reviewThumb: {
    width: 38,
    height: 38,
    marginRight: 12,
  },
  reviewInfoCol: {
    flex: 1,
    gap: 4,
  },
  reviewItemName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: customerColors.neutral.neutral950,
  },
  reviewItemWeight: {
    fontWeight: '400',
    color: customerColors.neutral.neutral800,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  excellentBadge: {
    backgroundColor: customerColors.shared.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  excellentBadgeText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: customerColors.primary,
  },
  tapToRateText: {
    fontSize: 11.5,
    color: customerColors.neutral.neutral600,
  },

  /* Overall Rating */
  overallRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 22,
  },
  overallStars: {
    flexDirection: 'row',
    gap: 6,
  },
  scoreBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  scoreBadgeZero: {
    backgroundColor: customerColors.palette.red.blush,
  },
  scoreBadgePositive: {
    backgroundColor: customerColors.shared.primaryLight,
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '700',
  },
  scoreTextZero: {
    color: customerColors.legacy.red,
  },
  scoreTextPositive: {
    color: customerColors.primary,
  },

  /* Your Review */
  inputContainer: {
    borderBottomWidth: 1,
    borderBottomColor: customerColors.neutral.neutral300,
    paddingBottom: 8,
    marginBottom: 22,
  },
  textInput: {
    fontSize: 14,
    color: customerColors.neutral.neutral950,
    minHeight: 46,
    textAlignVertical: 'top',
    padding: 0,
  },
  charCounter: {
    fontSize: 12,
    color: customerColors.neutral.neutral500,
    textAlign: 'right',
    marginTop: 4,
  },

  /* What did you like? */
  aspectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 26,
  },
  aspectCard: {
    width: '48.2%',
    borderWidth: 1.2,
    borderColor: customerColors.neutral.neutral300,
    borderRadius: 12,
    backgroundColor: customerColors.white,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aspectCardChecked: {
    borderColor: customerColors.primary,
    backgroundColor: customerColors.palette.green.paleMint,
  },
  aspectLabel: {
    fontSize: 12.5,
    color: customerColors.neutral.neutral700,
    fontWeight: '500',
    flexShrink: 1,
  },
  aspectLabelChecked: {
    color: customerColors.primary,
    fontWeight: '700',
  },

  /* Submit Button */
  submitButton: {
    backgroundColor: customerColors.primary,
    borderRadius: 28,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: customerColors.white,
    fontSize: 16,
    fontWeight: '700',
  },

  /* Order Picker Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: customerColors.overlay.scrim50,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: customerColors.white,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: customerColors.heading,
    marginBottom: 16,
  },
  modalOrderItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: customerColors.neutral.neutral100,
  },
  modalOrderItemActive: {
    backgroundColor: customerColors.palette.green.paleMint,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
});

