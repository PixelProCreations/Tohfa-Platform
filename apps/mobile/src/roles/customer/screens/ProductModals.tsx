/**
 * Catalog popups: add-to-cart (grades as "varieties"), cart bar, ratings & reviews.
 * Server-driven (Product / ProductDetail.variants / ProductReviews); money via
 * formatRupees, quantities in kg.
 */
import React, { useState } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { t } from '../../../i18n/customer';
import { gradeLabel, useProductDetail, useProductReviews, type Product, type ProductDetail, type SellableGrade } from '../api/catalog';
import { useAddToCart, type Cart } from '../api/cart';
import { mapProblem } from '../api/problem';
import { canStepDown, canStepUp, clampKg, formatKg, formatRupees, multiplyMoney, qtyToGrams, stepKg, sumMoney } from '../utils/money';
import {
  customerColors,
  customerFonts,
} from '../theme';

export const ModalCloseCrossSvg = ({ size = 14, color = '#1F2937' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 6L6 18M6 6l12 12"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const EditPenSvg = ({ size = 16, color = '#FFFFFF' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);


// ─────────────────────────────────────────────────────────────────────────────
// ADD-TO-CART POPUP (Figma 46:37143 / 46:37346 / 46:37549). Server-driven:
// the tapped catalog row plus GET /catalog/products/{id} `variants` (one per
// sellable grade, BR-202). "Pick a variety" lists the grades; quantities are kg.
// ─────────────────────────────────────────────────────────────────────────────
interface ProductDetailsModalProps {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  /** Open the full product page for one grade. */
  onOpenProduct?: (productId: string, grade: SellableGrade) => void;
  /** Called after every selected line was added (the cart cache is already updated). */
  onAdded?: (cart: Cart) => void;
}

interface VariantRow {
  grade: SellableGrade;
  pricePerKg: string;
  compareAtPrice: string | null;
  availableKg: string;
  unavailable: boolean;
}

function variantRows(product: Product, detail: ProductDetail | undefined): VariantRow[] {
  const variants = detail?.variants ?? [];
  if (variants.length === 0) {
    return [
      {
        grade: product.grade,
        pricePerKg: product.pricePerKg,
        compareAtPrice: product.compareAtPrice ?? null,
        availableKg: product.availableQty,
        unavailable: product.isComingSoon || product.isUnsalable,
      },
    ];
  }
  return variants.map((v) => ({
    grade: v.grade,
    pricePerKg: v.pricePerKg,
    compareAtPrice: v.compareAtPrice,
    availableKg: v.availableKg,
    unavailable: v.flags.isComingSoon || v.flags.isUnsalable || (qtyToGrams(v.availableKg) ?? 0) <= 0,
  }));
}

const STEP = { step: '0.5', min: '0.5' };

export function ProductDetailsModal({ visible, product, onClose, onOpenProduct, onAdded }: ProductDetailsModalProps) {
  const detailQuery = useProductDetail(visible && product ? product.id : null);
  const addToCart = useAddToCart();
  const [selected, setSelected] = useState<Partial<Record<SellableGrade, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  React.useEffect(() => {
    if (visible && product) {
      setSelected({ [product.grade]: clampKg('1.000', { ...STEP, max: product.availableQty }) });
      setError(null);
    }
  }, [visible, product]);

  if (!product) return null;

  const rows = variantRows(product, detailQuery.data);
  const hasVarieties = rows.length > 1;
  const image = product.photos?.[0] ? { uri: product.photos[0] } : null;
  const rating = typeof product.ratingAverage === 'number' ? product.ratingAverage.toFixed(1) : null;
  const pack = product.packSize && product.packUnit ? `${product.packSize} ${product.packUnit.toLowerCase()}` : null;
  const desc = product.tasteNotes ?? product.originRegion ?? '';

  const lines = rows.filter((r) => selected[r.grade] !== undefined);
  const total = sumMoney(lines.map((r) => multiplyMoney(r.pricePerKg, selected[r.grade] ?? '0')));

  const toggle = (row: VariantRow) => {
    if (row.unavailable) return;
    setSelected((prev) => {
      const next = { ...prev };
      if (next[row.grade] !== undefined) delete next[row.grade];
      else next[row.grade] = clampKg('1.000', { ...STEP, max: row.availableKg });
      return next;
    });
  };

  const step = (row: VariantRow, dir: 1 | -1) => {
    setSelected((prev) => {
      const current = prev[row.grade] ?? '0.000';
      const next = { ...prev };
      if (dir === -1 && !canStepDown(current, STEP)) delete next[row.grade];
      else next[row.grade] = stepKg(current, dir, { ...STEP, max: row.availableKg });
      return next;
    });
  };

  const handleAdd = async () => {
    if (lines.length === 0 || busy) return;
    setBusy(true);
    setError(null);
    try {
      let cart: Cart | null = null;
      for (const r of lines) {
        cart = await addToCart.mutateAsync({ productId: product.id, grade: r.grade, qtyKg: selected[r.grade] ?? '0.500' });
      }
      if (cart) onAdded?.(cart);
      onClose();
    } catch (err) {
      const p = mapProblem(err);
      if (!p.silent) setError(p.message);
    } finally {
      setBusy(false);
    }
  };

  const renderStepper = (row: VariantRow) => {
    const qty = selected[row.grade];
    if (qty === undefined) {
      return (
        <TouchableOpacity style={styles.plusButton} activeOpacity={0.8} onPress={() => toggle(row)} disabled={row.unavailable} accessibilityLabel={t('customer.product.modal.addGrade', { grade: gradeLabel(row.grade) })}>
          <Text style={styles.plusText}>+</Text>
        </TouchableOpacity>
      );
    }
    return (
      <View style={styles.stepperContainer}>
        <TouchableOpacity style={styles.stepBtn} onPress={() => step(row, -1)} activeOpacity={0.7} accessibilityLabel={t('customer.cart.screen.decrease')}>
          <Text style={styles.stepBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.stepQty}>{formatKg(qty)}</Text>
        <TouchableOpacity
          style={styles.stepBtn}
          onPress={() => step(row, 1)}
          disabled={!canStepUp(qty, { ...STEP, max: row.availableKg })}
          activeOpacity={0.7}
          accessibilityLabel={t('customer.cart.screen.increase')}
        >
          <Text style={styles.stepBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.floatingCloseBtn}
              activeOpacity={0.8}
              onPress={onClose}
              accessibilityLabel={t('customer.common.close')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ModalCloseCrossSvg size={14} color="#1F2937" />
            </TouchableOpacity>
            <View style={styles.headerRow}>
              <TouchableOpacity style={styles.imageBox} activeOpacity={0.7} onPress={() => onOpenProduct?.(product.id, product.grade)}>
                {image && <Image source={image} style={styles.productImg} resizeMode="contain" />}
              </TouchableOpacity>
              <View style={styles.titleCol}>
                <TouchableOpacity activeOpacity={0.7} onPress={() => onOpenProduct?.(product.id, product.grade)}>
                  <Text style={styles.titleText}>{product.name}</Text>
                </TouchableOpacity>
                {rating !== null && (
                  <View style={styles.ratingRow}>
                    <Text style={styles.star}>★</Text>
                    <Text style={styles.ratingScore}>{rating}</Text>
                    <Text style={styles.ratingCount}>({product.ratingCount ?? 0} reviews)</Text>
                  </View>
                )}
              </View>
              <View style={styles.priceCol}>
                <Text style={styles.priceText}>{formatRupees(hasVarieties ? total : product.pricePerKg)}</Text>
                <Text style={styles.packageText}>{pack ?? t('customer.product.modal.perKg')}</Text>
              </View>
            </View>

            {hasVarieties ? (
              <>
                {!!desc && <Text style={styles.descText}>{desc}</Text>}
                <View style={styles.varietySection}>
                  <View style={styles.varietyHeaderRow}>
                    <Text style={styles.varietyHeaderTitle}>{t('customer.product.modal.pickGrade')}</Text>
                    <Text style={styles.varietyHeaderSub}>{t('customer.product.modal.pricePerKg')}</Text>
                  </View>
                  <ScrollView style={styles.varietyList} showsVerticalScrollIndicator>
                    {rows.map((v) => {
                      const isSelected = selected[v.grade] !== undefined;
                      return (
                        <View key={`${product.id}:${v.grade}`} testID={`variant-${v.grade}`} style={[styles.varietyCard, isSelected && styles.varietyCardSelected]}>
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => onOpenProduct?.(product.id, v.grade)}
                            style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingVertical: 2 }}
                            accessibilityLabel={t('customer.product.modal.viewDetailsFor', { name: product.name, grade: gradeLabel(v.grade) })}
                          >
                            {image && <Image source={image} style={styles.varietyThumb} resizeMode="contain" />}
                            <View style={styles.varietyInfo}>
                              <Text style={styles.varietyName}>
                                {product.name} · {gradeLabel(v.grade)}
                              </Text>
                              <Text style={styles.varietySubtitle}>{v.unavailable ? t('customer.product.detail.unavailable') : t('customer.product.modal.kgAvailable', { qty: formatKg(v.availableKg) })}</Text>
                            </View>
                            <Text style={styles.varietyPrice}>{formatRupees(v.pricePerKg)}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            activeOpacity={0.75}
                            onPress={() => toggle(v)}
                            disabled={v.unavailable}
                            style={[styles.checkbox, isSelected && styles.checkboxSelected]}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            accessibilityLabel={t('customer.product.modal.select', { grade: gradeLabel(v.grade) })}
                          >
                            {isSelected && <Text style={styles.checkmark}>✔</Text>}
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </ScrollView>
                  {lines.length > 0 && (
                    <View style={styles.steppersList}>
                      {lines.map((r) => (
                        <View key={r.grade} style={styles.stepperItemRow}>
                          <View style={styles.stepperItemLabel}>
                            <Text style={styles.stepperTitle}>
                              {product.name} · {gradeLabel(r.grade)}
                            </Text>
                            <Text style={styles.stepperSub}>{formatRupees(multiplyMoney(r.pricePerKg, selected[r.grade] ?? '0'))}</Text>
                          </View>
                          {renderStepper(r)}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </>
            ) : (
              <View style={styles.descAndStepperRow}>
                <Text style={styles.descTextCompact}>{desc}</Text>
                <View style={styles.simpleStepperCol}>{rows[0] ? renderStepper(rows[0]) : null}</View>
              </View>
            )}

            {error && (
              <Text style={styles.modalError} accessibilityRole="alert" testID="add-error">
                {error}
              </Text>
            )}

            <View style={styles.divider} />

            <TouchableOpacity
              style={[styles.addCartBtn, (lines.length === 0 || busy) && { opacity: 0.6 }]}
              activeOpacity={0.85}
              onPress={() => void handleAdd()}
              disabled={lines.length === 0 || busy}
              testID="modal-add-to-cart"
            >
              <View style={styles.cartBtnContent}>
                <View style={styles.cartIconWrapper}>
                  {busy ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                      <Path d="M3 3h2l2 12h11l2-8H6" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M9 20a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM17 20a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" fill="#FFFFFF" />
                    </Svg>
                  )}
                </View>
                <Text style={styles.addCartText}>{t('customer.product.modal.addToCart')}</Text>
              </View>
              <Text style={styles.totalPriceText}>{formatRupees(total)}</Text>
            </TouchableOpacity>

            <View style={styles.guaranteeRow}>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#52796F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M9 12l2 2 4-4" stroke="#52796F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <Text style={styles.guaranteeText}>{t('customer.product.modal.guarantee')}</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CART BAR (Figma 46:38013): server cart count + subtotal.
// ─────────────────────────────────────────────────────────────────────────────
interface CartToastProps {
  visible: boolean;
  itemCount: number;
  /** Cart subtotal (Money string). */
  totalPrice: string;
  thumbUri?: string | null;
  onViewCart?: () => void;
}

export function CartToast({ visible, itemCount, totalPrice, thumbUri, onViewCart }: CartToastProps) {
  if (!visible) return null;
  return (
    <View style={styles.toastContainer}>
      <TouchableOpacity style={styles.toastCard} activeOpacity={0.9} onPress={onViewCart} testID="cart-bar">
        <View style={styles.toastThumbWrapper}>
          {thumbUri ? <Image source={{ uri: thumbUri }} style={styles.toastThumb} resizeMode="contain" /> : null}
        </View>
        <View style={styles.toastTextCol}>
          <Text style={styles.toastTitle}>
            {t(itemCount === 1 ? 'customer.checkout.screen.cartItem' : 'customer.checkout.screen.cartItems', { count: itemCount })}
          </Text>
          <Text style={styles.toastSub}>{t('customer.checkout.screen.viewCart')}</Text>
        </View>
        <Text style={styles.toastPrice}>{formatRupees(totalPrice)}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RATINGS & REVIEWS MODAL (Figma 46:36594): GET /catalog/products/{id}/reviews.
// Reviews are anonymised (BR-16): no reviewer name/avatar is returned, every
// review comes from a placed order ("Verified purchase").
// ─────────────────────────────────────────────────────────────────────────────
interface RatingsReviewsModalProps {
  visible: boolean;
  productId: string | null;
  grade?: SellableGrade | undefined;
  onClose: () => void;
  onWriteReview?: () => void;
}

function formatReviewDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
}

export function RatingsReviewsModal({ visible, productId, grade, onClose, onWriteReview }: RatingsReviewsModalProps) {
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const reviews = useProductReviews(visible ? productId : null, grade);
  if (!productId) return null;

  const summary = reviews.data?.pages[0]?.summary;
  const all = reviews.data?.pages.flatMap((p) => p.items) ?? [];
  const items = starFilter === null ? all : all.filter((r) => r.rating === starFilter);
  const count = summary?.ratingCount ?? 0;
  const pct = (star: number) => {
    const n = summary?.distribution[String(star) as '1'] ?? 0;
    return count > 0 ? `${Math.round((n * 100) / count)}%` : '0%';
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.cardContainerReviews}>
          <View style={styles.reviewsCard}>
            <TouchableOpacity
              style={styles.floatingCloseBtn}
              activeOpacity={0.8}
              onPress={onClose}
              accessibilityLabel={t('customer.common.close')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ModalCloseCrossSvg size={14} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.reviewsHeading}>{t('customer.product.detail.ratings')}</Text>

            {reviews.isLoading ? (
              <ActivityIndicator testID="reviews-loading" style={{ marginVertical: 24 }} />
            ) : reviews.isError ? (
              <TouchableOpacity onPress={() => void reviews.refetch()} testID="reviews-retry">
                <Text style={styles.reviewBody}>{t('customer.product.detail.reviewsError')}</Text>
              </TouchableOpacity>
            ) : (
              <>
                <View style={styles.ratingSummaryRow}>
                  <View style={styles.scoreCol}>
                    <View style={styles.bigRatingRow}>
                      <Text style={styles.bigRatingNum}>{summary?.averageRating ?? '–'}</Text>
                      <Text style={styles.bigStar}>★</Text>
                    </View>
                    <Text style={styles.reviewsTotal}>{count > 0 ? t('customer.product.detail.reviewsTotal', { count }) : t('customer.product.detail.noRatings')}</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.barsCol}>
                    {[5, 4, 3, 2, 1].map((star) => (
                      <View key={star} style={styles.barRow}>
                        <Text style={styles.barStarNum}>{star}</Text>
                        <Text style={styles.barStarIcon}>★</Text>
                        <View style={styles.barTrack}>
                          <View style={[styles.barFill, { width: pct(star) as `${number}%` }]} />
                        </View>
                        <Text style={styles.barPct}>{pct(star)}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsRow}>
                  {[null, 5, 4, 3, 2, 1].map((f) => (
                    <TouchableOpacity
                      key={f ?? 'all'}
                      style={[styles.filterPill, starFilter === f && styles.filterPillActive]}
                      onPress={() => setStarFilter(f)}
                    >
                      <Text style={[styles.filterPillText, starFilter === f && styles.filterPillTextActive]}>
                        {f === null ? t('customer.product.detail.allReviews', { count }) : `${f} ★ (${summary?.distribution[String(f) as '1'] ?? 0})`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <ScrollView
                  style={styles.reviewsList}
                  showsVerticalScrollIndicator
                  onScrollEndDrag={() => {
                    if (reviews.hasNextPage && !reviews.isFetchingNextPage) void reviews.fetchNextPage();
                  }}
                >
                  {items.length === 0 ? (
                    <Text style={styles.reviewBody} testID="reviews-empty">
                      {t('customer.product.modal.reviewsEmpty')}
                    </Text>
                  ) : (
                    items.map((r) => (
                      <View key={r.id} style={styles.reviewItem}>
                        <View style={styles.reviewHeader}>
                          <View style={styles.reviewerMeta}>
                            <View style={styles.verifiedRow}>
                              <Text style={styles.reviewDate}>{formatReviewDate(r.createdAt)} · </Text>
                              <Text style={styles.verifiedBadge}>{t('customer.product.modal.verified')}</Text>
                            </View>
                          </View>
                          <View style={styles.starBadgeSmall}>
                            <Text style={styles.starBadgeText}>{r.rating} ★</Text>
                          </View>
                        </View>
                        {!!r.comment && <Text style={styles.reviewBody}>{r.comment}</Text>}
                      </View>
                    ))
                  )}
                  {reviews.hasNextPage && (
                    <TouchableOpacity onPress={() => void reviews.fetchNextPage()} testID="reviews-more">
                      <Text style={styles.filterPillText}>{reviews.isFetchingNextPage ? t('customer.common.loading') : t('customer.product.modal.showMore')}</Text>
                    </TouchableOpacity>
                  )}
                </ScrollView>
              </>
            )}

            {onWriteReview && (
              <TouchableOpacity
                style={styles.writeReviewBtn}
                activeOpacity={0.85}
                onPress={() => {
                  onClose();
                  onWriteReview();
                }}
              >
                <EditPenSvg size={16} color="#FFFFFF" />
                <Text style={styles.writeReviewText}>{t('customer.product.modal.write')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}



const styles = StyleSheet.create({
  modalError: {
    marginTop: 8,
    fontSize: 12,
    color: '#B91C1C',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 380,
  },
  cardContainerReviews: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '85%',
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
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    position: 'relative',
    overflow: 'visible',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  imageBox: {
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: '#F7F7F7',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  productImg: {
    width: '100%',
    height: '100%',
  },
  titleCol: {
    flex: 1,
    marginLeft: 12,
  },
  titleText: {
    fontFamily: customerFonts.editorial,
    fontSize: 18,
    color: '#222222',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  star: {
    fontSize: 12,
    color: '#F4B400',
    marginRight: 4,
  },
  ratingScore: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333333',
    marginRight: 4,
  },
  ratingCount: {
    fontSize: 11,
    color: '#888888',
  },
  priceCol: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#222222',
  },
  packageText: {
    fontSize: 10,
    color: '#777777',
    marginTop: 2,
    textAlign: 'right',
  },
  descText: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 16,
    marginTop: 10,
    marginBottom: 12,
  },
  varietySection: {
    marginTop: 4,
  },
  varietyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  varietyHeaderTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 15,
    color: '#222222',
  },
  varietyHeaderSub: {
    fontSize: 11,
    color: '#777777',
  },
  varietyList: {
    maxHeight: 220,
  },
  varietyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  varietyCardSelected: {
    borderColor: '#2D7A47',
    backgroundColor: '#EAF5EE',
  },
  varietyThumb: {
    width: 38,
    height: 38,
    marginRight: 10,
  },
  varietyInfo: {
    flex: 1,
  },
  varietyName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#222222',
  },
  varietySubtitle: {
    fontSize: 11,
    color: '#777777',
    marginTop: 2,
  },
  varietyPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#222222',
    marginRight: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#CCCCCC',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxSelected: {
    borderColor: '#2D7A47',
    backgroundColor: '#2D7A47',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  steppersList: {
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 8,
  },
  stepperItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stepperItemLabel: {
    flex: 1,
  },
  stepperTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#222222',
  },
  stepperSub: {
    fontSize: 11,
    color: '#777777',
  },
  descAndStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 12,
  },
  descTextCompact: {
    flex: 1,
    fontSize: 12,
    color: customerColors.muted,
    lineHeight: 17,
    paddingRight: 10,
    fontFamily: customerFonts.regular,
  },
  simpleStepperCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  simpleStepperRow: {
    alignItems: 'flex-end',
    marginVertical: 6,
  },
  plusButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  plusText: {
    fontSize: 18,
    color: '#333333',
    lineHeight: 20,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#FFFFFF',
  },
  stepBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  stepBtnText: {
    fontSize: 16,
    color: '#333333',
  },
  stepQty: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#222222',
    paddingHorizontal: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 12,
  },
  addCartBtn: {
    backgroundColor: '#2D7A47',
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  cartBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartIconWrapper: {
    marginRight: 8,
  },
  addCartText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  totalPriceText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  guaranteeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  guaranteeText: {
    fontSize: 11,
    color: '#666666',
    marginLeft: 6,
  },

  // ── FULL PRODUCT DETAILS MODAL (Screen 3 & 4) ──────────────────────────────
  fullModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  fullTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 16 : 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrowText: {
    fontSize: 18,
    color: '#333333',
  },
  fullBarTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 18,
    color: '#111827',
  },
  cartCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScroll: {
    flex: 1,
  },
  heroCard: {
    margin: 16,
    borderRadius: 20,
    overflow: 'hidden',
    height: 220,
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOrganicBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  heroOrganicText: {
    color: '#15803D',
    fontSize: 11,
    fontWeight: 'bold',
  },
  shareBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  thumbRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  smallThumb: {
    width: 60,
    height: 50,
    borderRadius: 8,
  },
  moreThumb: {
    width: 60,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreThumbText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#4B5563',
  },
  fullContentPadding: {
    paddingHorizontal: 16,
  },
  titleHeartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fullProductTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 22,
    color: '#111827',
  },
  heartCircleSmall: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  farmMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  farmMetaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  certifiedBadge: {
    fontSize: 12,
    color: '#2D7A47',
    fontWeight: 'bold',
  },
  starQuestionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  starYellow: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: 'bold',
  },
  reviewsMuted: {
    fontSize: 12,
    color: '#6B7280',
  },
  fullPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  fullPriceLarge: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  fullPriceStrikethrough: {
    fontSize: 14,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  discountBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  discountText: {
    color: '#15803D',
    fontSize: 11,
    fontWeight: 'bold',
  },
  fullPlusBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullPlusText: {
    fontSize: 18,
    color: '#333333',
  },
  qualityBadgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 14,
    marginTop: 16,
  },
  qualityBadge: {
    alignItems: 'center',
    flex: 1,
  },
  qualityIcon: {
    fontSize: 18,
  },
  qualityLabel: {
    fontSize: 10,
    color: '#166534',
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  sectionHeading: {
    fontFamily: customerFonts.editorial,
    fontSize: 18,
    color: '#111827',
    marginTop: 20,
    marginBottom: 8,
  },
  aboutParagraph: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
  readMoreText: {
    fontSize: 13,
    color: '#2D7A47',
    fontWeight: 'bold',
    marginTop: 4,
  },
  infoTable: {
    backgroundColor: '#FFFFFF',
    marginTop: 6,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoKey: {
    fontSize: 13,
    color: '#6B7280',
  },
  infoVal: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '500',
  },
  detailReviewsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 14,
  },
  fullBottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
  },
  fullAddToCartBtn: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#2D7A47',
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  fullAddToCartText: {
    color: '#2D7A47',
    fontWeight: 'bold',
    fontSize: 15,
  },
  fullBuyNowBtn: {
    flex: 1,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#2D7A47',
  },
  fullBuyNowText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },

  // ── TOAST STYLES (Screen 5) ───────────────────────────────────────────────
  toastContainer: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 9999,
  },
  toastCard: {
    width: '100%',
    backgroundColor: '#2B2E33',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  toastThumbWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  toastThumb: {
    width: 28,
    height: 28,
  },
  toastTextCol: {
    flex: 1,
  },
  toastTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  toastSub: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 1,
  },
  toastPrice: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },

  // Reviews modal
  reviewsCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    position: 'relative',
    overflow: 'visible',
    elevation: 5,
  },
  reviewsHeading: {
    fontFamily: customerFonts.editorial,
    fontSize: 20,
    color: '#222222',
    marginBottom: 16,
  },
  ratingSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreCol: {
    alignItems: 'center',
    paddingRight: 16,
  },
  bigRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bigRatingNum: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#222222',
  },
  bigStar: {
    fontSize: 22,
    color: '#F4B400',
    marginLeft: 6,
  },
  reviewsTotal: {
    fontSize: 11,
    color: '#777777',
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 60,
    backgroundColor: '#E5E7EB',
    marginRight: 16,
  },
  barsCol: {
    flex: 1,
    gap: 4,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barStarNum: {
    fontSize: 10,
    color: '#555555',
    width: 8,
  },
  barStarIcon: {
    fontSize: 10,
    color: '#F4B400',
    marginHorizontal: 3,
  },
  barTrack: {
    flex: 1,
    height: 5,
    backgroundColor: '#EAEAEA',
    borderRadius: 3,
    overflow: 'hidden',
    marginHorizontal: 6,
  },
  barFill: {
    height: '100%',
    backgroundColor: '#2D7A47',
    borderRadius: 3,
  },
  barPct: {
    fontSize: 10,
    color: '#555555',
    width: 24,
    textAlign: 'right',
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  filterPillActive: {
    borderColor: '#2D7A47',
    backgroundColor: '#EAF5EE',
  },
  filterPillText: {
    fontSize: 11,
    color: '#666666',
  },
  filterPillTextActive: {
    color: '#2D7A47',
    fontWeight: '600',
  },
  reviewsList: {
    maxHeight: 250,
  },
  reviewItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingVertical: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  reviewerMeta: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#222222',
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  reviewDate: {
    fontSize: 11,
    color: '#888888',
  },
  verifiedBadge: {
    fontSize: 11,
    color: '#2D7A47',
    fontWeight: '500',
  },
  starBadgeSmall: {
    backgroundColor: '#EAF5EE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  starBadgeText: {
    fontSize: 11,
    color: '#2D7A47',
    fontWeight: 'bold',
  },
  reviewBody: {
    fontSize: 12,
    color: '#444444',
    lineHeight: 16,
    marginTop: 4,
  },
  reviewPhotosRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  reviewThumb: {
    width: 44,
    height: 44,
    borderRadius: 6,
  },
  writeReviewBtn: {
    backgroundColor: '#2D7A47',
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 14,
  },
  writeReviewText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
