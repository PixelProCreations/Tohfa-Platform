/**
 * Product detail (Figma 46:37752). Server-driven: GET /catalog/products/{id}
 * (top level = lowest sellable grade, `variants` = every grade, BR-202) and
 * GET /catalog/products/{id}/reviews. Farm-anonymous (BR-16): the only place
 * shown is the generic `originRegion`. Quantities are kg (0.5 kg steps, capped
 * by the selected grade's availableKg); "Buy now" adds to the server cart first
 * because checkout always converts the cart.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Share,
  Platform,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { ApiError } from '../../../shell/api/client';
import { t, type TranslationKey } from '../../../i18n/customer';
import { gradeLabel, useProductDetail, useProductReviews, type ProductVariant, type SellableGrade } from '../api/catalog';
import { useAddToCart } from '../api/cart';
import { useToggleWishlist, useWishlistKeys } from '../api/wishlist';
import { mapProblem } from '../api/problem';
import { canStepDown, canStepUp, clampKg, formatKg, formatRupees, multiplyMoney, qtyToGrams, stepKg } from '../utils/money';
import { packLabel } from '../components/ProductCard';
import {
  customerFonts,
} from '../theme';

interface ProductDetailScreenProps {
  productId: string;
  /** Grade the user tapped; defaults to the lowest sellable grade. */
  grade?: SellableGrade | undefined;
  onGoBack?: () => void;
  onNavigate?: (screen: string, params?: Record<string, unknown>) => void;
}

const STEP = { step: '0.5', min: '0.5' };
const FARMING_KEY: Record<string, TranslationKey> = {
  ORGANIC: 'customer.product.detail.farming.organic',
  NATURAL: 'customer.product.detail.farming.natural',
  CONVENTIONAL: 'customer.product.detail.farming.conventional',
};
const CERT_KEY: Record<string, TranslationKey> = {
  PGS: 'customer.product.detail.cert.pgs',
  NPOP: 'customer.product.detail.cert.npop',
  OTHER: 'customer.product.detail.cert.other',
};

function formatReviewDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
}

export function ProductDetailScreen({ productId, grade: initialGrade, onGoBack, onNavigate }: ProductDetailScreenProps) {
  const detail = useProductDetail(productId);
  const product = detail.data;
  const [grade, setGrade] = useState<SellableGrade | undefined>(initialGrade);
  const [qty, setQty] = useState('1.000');
  const [activeThumb, setActiveThumb] = useState(0);
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<'add' | 'buy' | null>(null);
  const addToCart = useAddToCart();
  const wishlistKeys = useWishlistKeys();
  const toggleWishlist = useToggleWishlist();

  const variants: ProductVariant[] = useMemo(() => {
    if (!product) return [];
    if (product.variants && product.variants.length > 0) return product.variants;
    return [
      {
        grade: product.grade,
        pricePerKg: product.pricePerKg,
        availableKg: product.availableQty,
        compareAtPrice: product.compareAtPrice,
        discountPercent: product.discountPercent,
        flags: { isComingSoon: product.isComingSoon, comingTomorrow: product.comingTomorrow, isUnsalable: product.isUnsalable },
      },
    ];
  }, [product]);
  const variant = variants.find((v) => v.grade === grade) ?? variants[0];
  const selectedGrade = variant?.grade;
  const available = variant ? (qtyToGrams(variant.availableKg) ?? 0) > 0 && !variant.flags.isUnsalable && !variant.flags.isComingSoon : false;

  // Reset/clamp the quantity when the grade (and so the stock cap) changes.
  useEffect(() => {
    if (variant) setQty((q) => clampKg(q, { ...STEP, max: variant.availableKg }));
  }, [variant]);

  const reviews = useProductReviews(product ? productId : null, selectedGrade);
  const summary = reviews.data?.pages[0]?.summary;
  const reviewItems = (reviews.data?.pages.flatMap((p) => p.items) ?? []).filter((r) => starFilter === null || r.rating === starFilter);
  const ratingCount = summary?.ratingCount ?? product?.ratingCount ?? 0;
  const pct = (star: number) => {
    const n = summary?.distribution[String(star) as '1'] ?? 0;
    return ratingCount > 0 ? `${Math.round((n * 100) / ratingCount)}%` : '0%';
  };

  const wishKey = product && selectedGrade ? `${product.id}:${selectedGrade}` : '';
  const isWishlist = wishlistKeys.has(wishKey);
  const photos = product?.photos ?? [];
  const heroUri = photos[activeThumb] ?? photos[0];

  const handleShare = async () => {
    if (!product) return;
    try {
      await Share.share({
        message: product.originRegion
          ? t('customer.product.detail.shareMsgOrigin', { name: product.name, origin: product.originRegion })
          : t('customer.product.detail.shareMsg', { name: product.name }),
      });
    } catch {
      // The user dismissed the share sheet.
    }
  };

  const addCurrent = async (): Promise<boolean> => {
    if (!product || !selectedGrade) return false;
    try {
      await addToCart.mutateAsync({ productId: product.id, grade: selectedGrade, qtyKg: qty });
      return true;
    } catch (err) {
      const p = mapProblem(err);
      if (!p.silent) setMessage(p.message);
      if (err instanceof ApiError && err.status === 404) void detail.refetch();
      return false;
    }
  };

  const handleAddToCart = async () => {
    setBusy('add');
    setMessage(null);
    if (await addCurrent()) setMessage(t('customer.product.detail.added'));
    setBusy(null);
  };

  const handleBuyNow = async () => {
    setBusy('buy');
    setMessage(null);
    const ok = await addCurrent();
    setBusy(null);
    if (ok) onNavigate?.('Checkout');
  };

  const topBar = (
    <View style={styles.topBar}>
      <TouchableOpacity
        style={styles.circleBtn}
        onPress={() => (onGoBack ? onGoBack() : onNavigate?.('Home'))}
        activeOpacity={0.7}
        accessibilityLabel={t('customer.common.back')}
      >
        <Text style={styles.backArrowText}>←</Text>
      </TouchableOpacity>
      <Text style={styles.barTitle}>{t('customer.product.detail.title')}</Text>
      <TouchableOpacity style={styles.circleBtn} onPress={() => onNavigate?.('Cart')} activeOpacity={0.7} accessibilityLabel={t('customer.product.detail.cart')}>
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path d="M3 3h2l2 12h11l2-8H6" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M9 20a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM17 20a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" fill="#111827" />
        </Svg>
      </TouchableOpacity>
    </View>
  );

  if (detail.isLoading) {
    return (
      <View style={styles.container}>
        {topBar}
        <ActivityIndicator testID="loading-indicator" style={{ marginTop: 48 }} />
      </View>
    );
  }

  if (detail.isError || !product || !variant) {
    const notFound = detail.error instanceof ApiError && detail.error.status === 404;
    return (
      <View style={styles.container}>
        {topBar}
        <View style={styles.contentPadding} testID={notFound ? 'product-not-found' : 'product-error'}>
          <Text style={styles.sectionTitle}>{notFound ? t('customer.product.detail.gone') : t('customer.product.detail.loadError')}</Text>
          {!notFound && (
            <TouchableOpacity onPress={() => void detail.refetch()} style={styles.addToCartOutlineBtn}>
              <Text style={styles.addToCartOutlineText}>{t('customer.common.retry')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  const pack = packLabel(product);
  const infoRows: [string, string][] = [];
  if (product.originRegion) infoRows.push([t('customer.product.detail.info.origin'), product.originRegion]);
  const farmingKey = product.farmingType ? FARMING_KEY[product.farmingType] : undefined;
  if (product.farmingType) infoRows.push([t('customer.product.detail.info.farming'), farmingKey ? t(farmingKey) : product.farmingType]);
  if (product.harvestSeason) infoRows.push([t('customer.product.detail.info.season'), product.harvestSeason]);
  if (product.shelfLifeDays) infoRows.push([t('customer.product.detail.info.shelf'), t('customer.product.detail.info.shelfDays', { days: product.shelfLifeDays })]);
  if (pack) infoRows.push([t('customer.product.detail.info.pack'), pack]);
  infoRows.push([t('customer.product.detail.info.available'), formatKg(variant.availableKg)]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {topBar}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroContainer}>
          {heroUri ? <Image source={{ uri: heroUri }} style={styles.heroImage} resizeMode="cover" /> : <View style={styles.heroImage} />}

          {product.farmingType === 'ORGANIC' && (
            <View style={styles.organicBadge}>
              <Text style={styles.organicIcon}>🍃</Text>
              <Text style={styles.organicText}>{t('customer.product.detail.organic')}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.shareBtn} onPress={() => void handleShare()} activeOpacity={0.8} accessibilityLabel={t('customer.product.detail.share')}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Circle cx="18" cy="5" r="3" stroke="#1F2937" strokeWidth={2} />
              <Circle cx="6" cy="12" r="3" stroke="#1F2937" strokeWidth={2} />
              <Circle cx="18" cy="19" r="3" stroke="#1F2937" strokeWidth={2} />
              <Path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="#1F2937" strokeWidth={2} strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>

          {photos.length > 1 && (
            <View style={styles.dotsContainer}>
              {photos.slice(0, 5).map((uri, i) => (
                <View key={uri} style={[styles.dot, i === activeThumb && styles.activeDot]} />
              ))}
            </View>
          )}
        </View>

        {photos.length > 1 && (
          <View style={styles.thumbnailRow}>
            {photos.slice(0, 4).map((uri, i) => (
              <TouchableOpacity key={uri} activeOpacity={0.8} onPress={() => setActiveThumb(i)} style={[styles.thumbBox, activeThumb === i && styles.thumbBoxActive]}>
                <Image source={{ uri }} style={styles.thumbImage} resizeMode="cover" />
              </TouchableOpacity>
            ))}
            {photos.length > 4 && (
              <View style={[styles.thumbBox, styles.moreThumbBox]}>
                <Text style={styles.moreThumbText}>+{photos.length - 4}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.contentPadding}>
          <View style={styles.titleRow}>
            <Text style={styles.productTitle}>{product.name}</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => selectedGrade && toggleWishlist.mutate({ productId: product.id, grade: selectedGrade, add: !isWishlist, product })}
              style={styles.heartBtn}
              accessibilityLabel={isWishlist ? t('customer.product.detail.wishRemove') : t('customer.product.detail.wishAdd')}
              testID="detail-wishlist"
            >
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  fill={isWishlist ? '#EF4444' : 'none'}
                  stroke={isWishlist ? '#EF4444' : '#6B7280'}
                  strokeWidth="1.8"
                />
              </Svg>
            </TouchableOpacity>
          </View>

          {(product.originRegion || (product.certificationBadges ?? []).length > 0) && (
            <View style={styles.metaRow}>
              {!!product.originRegion && <Text style={styles.metaLocation}>📍 {product.originRegion}</Text>}
              {(product.certificationBadges ?? []).length > 0 && (
                <>
                  {!!product.originRegion && <View style={styles.metaDivider} />}
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                    <Path d="M20 6L9 17l-5-5" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                  <Text style={styles.certifiedText}> {(product.certificationBadges ?? []).map((c) => CERT_KEY[c] ? t(CERT_KEY[c]) : c).join(' · ')}</Text>
                </>
              )}
            </View>
          )}

          {typeof product.ratingAverage === 'number' && (
            <View style={styles.metaRow}>
              <Text style={styles.starText}>★ {product.ratingAverage.toFixed(1)}</Text>
              <Text style={styles.reviewsCountText}> {t('customer.product.detail.reviewsCount', { count: product.ratingCount ?? 0 })}</Text>
            </View>
          )}

          {/* Grade selector (BR-202): one chip per sellable grade. [needs design review] */}
          {variants.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsRow}>
              {variants.map((v) => (
                <TouchableOpacity
                  key={v.grade}
                  testID={`grade-${v.grade}`}
                  style={[styles.filterChip, v.grade === selectedGrade && styles.filterChipActive]}
                  onPress={() => setGrade(v.grade)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterChipText, v.grade === selectedGrade && styles.filterChipTextActive]}>
                    {gradeLabel(v.grade)} · {formatRupees(v.pricePerKg)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <View style={styles.priceRow}>
            <Text style={styles.priceMain} testID="detail-price">
              {t('customer.product.detail.perKg', { price: formatRupees(variant.pricePerKg) })}
            </Text>
            {!!variant.compareAtPrice && <Text style={styles.priceStrikethrough}>{formatRupees(variant.compareAtPrice)}</Text>}
            {variant.discountPercent != null && (
              <View style={styles.discountPill}>
                <Text style={styles.discountPillText}>{t('customer.product.detail.off', { percent: variant.discountPercent })}</Text>
              </View>
            )}
            <View style={{ flex: 1 }} />
            {available ? (
              <View style={styles.qualityBadgesRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setQty((q) => stepKg(q, -1, { ...STEP, max: variant.availableKg }))}
                  disabled={!canStepDown(qty, STEP)}
                  style={styles.plusBtn}
                  accessibilityLabel={t('customer.product.detail.qtyDec')}
                >
                  <Text style={styles.plusBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.starText} testID="detail-qty">
                  {formatKg(qty)}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setQty((q) => stepKg(q, 1, { ...STEP, max: variant.availableKg }))}
                  disabled={!canStepUp(qty, { ...STEP, max: variant.availableKg })}
                  style={styles.plusBtn}
                  accessibilityLabel={t('customer.product.detail.qtyInc')}
                >
                  <Text style={styles.plusBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.reviewsCountText}>{t('customer.product.detail.unavailable')}</Text>
            )}
          </View>
          {available && <Text style={styles.reviewsCountText}>{t('customer.product.detail.total', { amount: formatRupees(multiplyMoney(variant.pricePerKg, qty)) })}</Text>}

          {!!product.tasteNotes && (
            <>
              <Text style={styles.sectionTitle}>{t('customer.product.detail.about')}</Text>
              <Text style={styles.aboutText}>{product.tasteNotes}</Text>
            </>
          )}

          <Text style={styles.sectionTitle}>{t('customer.product.detail.information')}</Text>
          <View style={styles.infoTable}>
            {infoRows.map(([k, v]) => (
              <View key={k} style={styles.infoTableRow}>
                <Text style={styles.infoKey}>{k}</Text>
                <Text style={styles.infoVal}>{v}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>{t('customer.product.detail.ratings')}</Text>
          {reviews.isLoading ? (
            <ActivityIndicator testID="reviews-loading" />
          ) : reviews.isError ? (
            <TouchableOpacity onPress={() => void reviews.refetch()}>
              <Text style={styles.reviewComment}>{t('customer.product.detail.reviewsError')}</Text>
            </TouchableOpacity>
          ) : (
            <>
              <View style={styles.ratingCard}>
                <View style={styles.ratingLeftCol}>
                  <View style={styles.bigScoreRow}>
                    <Text style={styles.bigScoreNum}>{summary?.averageRating ?? '–'}</Text>
                    <Text style={styles.bigScoreStar}>★</Text>
                  </View>
                  <Text style={styles.bigReviewsTotal}>{ratingCount > 0 ? t('customer.product.detail.reviewsTotal', { count: ratingCount }) : t('customer.product.detail.noRatings')}</Text>
                </View>
                <View style={styles.ratingDivider} />
                <View style={styles.ratingRightCol}>
                  {[5, 4, 3, 2, 1].map((star) => (
                    <View key={star} style={styles.barItemRow}>
                      <Text style={styles.barStarNumber}>{star}</Text>
                      <Text style={styles.barStarGlyph}>★</Text>
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { width: pct(star) as `${number}%` }]} />
                      </View>
                      <Text style={styles.barPercent}>{pct(star)}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {ratingCount > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsRow}>
                  {[null, 5, 4, 3, 2, 1].map((f) => (
                    <TouchableOpacity
                      key={f ?? 'all'}
                      style={[styles.filterChip, starFilter === f && styles.filterChipActive]}
                      onPress={() => setStarFilter(f)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.filterChipText, starFilter === f && styles.filterChipTextActive]}>
                        {f === null ? t('customer.product.detail.allReviews', { count: ratingCount }) : `${f} ★ (${summary?.distribution[String(f) as '1'] ?? 0})`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {reviewItems.map((r) => (
                <View key={r.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewerDetails}>
                      <View style={styles.verifiedRow}>
                        <Text style={styles.reviewDate}>{formatReviewDate(r.createdAt)} · </Text>
                        <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                          <Path d="M20 6L9 17l-5-5" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </Svg>
                        <Text style={styles.verifiedText}>{t('customer.product.detail.verified')}</Text>
                      </View>
                    </View>
                    <View style={styles.starBadgePill}>
                      <Text style={styles.starBadgePillText}>{r.rating} ★</Text>
                    </View>
                  </View>
                  {!!r.comment && <Text style={styles.reviewComment}>{r.comment}</Text>}
                </View>
              ))}
              {reviews.hasNextPage && (
                <TouchableOpacity onPress={() => void reviews.fetchNextPage()} testID="reviews-more">
                  <Text style={styles.readMoreLink}>{reviews.isFetchingNextPage ? t('customer.common.loading') : t('customer.product.detail.showMore')}</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {!!message && (
            <Text style={styles.reviewComment} accessibilityRole="alert" testID="detail-message">
              {message}
            </Text>
          )}

          <View style={{ height: 110 }} />
        </View>
      </ScrollView>

      <View style={styles.fixedBottomBar}>
        <TouchableOpacity
          style={[styles.addToCartOutlineBtn, !available && { opacity: 0.5 }]}
          onPress={() => void handleAddToCart()}
          disabled={!available || busy !== null}
          activeOpacity={0.85}
          testID="detail-add"
        >
          {busy === 'add' ? <ActivityIndicator /> : <Text style={styles.addToCartOutlineText}>{t('customer.product.detail.addToCart')}</Text>}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.buyNowSolidBtn, !available && { opacity: 0.5 }]}
          onPress={() => void handleBuyNow()}
          disabled={!available || busy !== null}
          activeOpacity={0.85}
          testID="detail-buy"
        >
          {busy === 'buy' ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buyNowSolidText}>{t('customer.product.detail.buyNow')}</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 16 : 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  backArrowText: {
    fontSize: 20,
    color: '#111827',
  },
  barTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 20,
    color: '#111827',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  heroContainer: {
    position: 'relative',
    marginHorizontal: 16,
    marginTop: 14,
    height: 240,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#F9FAFB',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  organicBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  organicIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  organicText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '600',
  },
  shareBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  activeDot: {
    width: 18,
    backgroundColor: '#16A34A',
  },
  thumbnailRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 10,
  },
  thumbBox: {
    flex: 1,
    height: 60,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    backgroundColor: '#F9FAFB',
  },
  thumbBoxActive: {
    borderColor: '#16A34A',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  moreThumbBox: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    borderColor: '#D1D5DB',
  },
  moreThumbText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4B5563',
  },
  contentPadding: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 22,
    color: '#111827',
    flex: 1,
  },
  heartBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  metaLocation: {
    fontSize: 13,
    color: '#6B7280',
  },
  metaDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 8,
  },
  certifiedText: {
    fontSize: 13,
    color: '#16A34A',
    fontWeight: '600',
  },
  starText: {
    fontSize: 13,
    color: '#F59E0B',
    fontWeight: 'bold',
  },
  reviewsCountText: {
    fontSize: 13,
    color: '#6B7280',
  },
  questionsIcon: {
    fontSize: 13,
  },
  questionsText: {
    fontSize: 13,
    color: '#6B7280',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  priceMain: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  priceStrikethrough: {
    fontSize: 15,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginLeft: 10,
  },
  discountPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 10,
  },
  discountPillText: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: 'bold',
  },
  plusBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusBtnText: {
    fontSize: 20,
    color: '#374151',
    lineHeight: 22,
  },
  qualityBadgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginTop: 18,
    gap: 6,
  },
  qualityCard: {
    flex: 1,
    alignItems: 'center',
  },
  qualityIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  qualityLabel: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 18,
    color: '#111827',
    marginTop: 22,
    marginBottom: 8,
  },
  aboutText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  readMoreLink: {
    fontSize: 14,
    color: '#16A34A',
    fontWeight: '600',
    marginTop: 4,
  },
  infoTable: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 4,
  },
  infoTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoKey: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoVal: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  ratingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginTop: 8,
  },
  ratingLeftCol: {
    alignItems: 'center',
    paddingRight: 16,
  },
  bigScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bigScoreNum: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
  },
  bigScoreStar: {
    fontSize: 26,
    color: '#F59E0B',
    marginLeft: 4,
  },
  bigReviewsTotal: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  ratingDivider: {
    width: 1,
    height: 70,
    backgroundColor: '#E5E7EB',
    marginRight: 16,
  },
  ratingRightCol: {
    flex: 1,
  },
  barItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  barStarNumber: {
    fontSize: 11,
    color: '#4B5563',
    width: 10,
  },
  barStarGlyph: {
    fontSize: 10,
    color: '#F59E0B',
    marginRight: 6,
  },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 8,
  },
  barFill: {
    height: '100%',
    backgroundColor: '#16A34A',
    borderRadius: 3,
  },
  barPercent: {
    fontSize: 11,
    color: '#6B7280',
    width: 28,
    textAlign: 'right',
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  filterChipActive: {
    borderColor: '#16A34A',
    backgroundColor: '#E8F5E9',
  },
  filterChipText: {
    fontSize: 12,
    color: '#4B5563',
  },
  filterChipTextActive: {
    color: '#166534',
    fontWeight: '600',
  },
  reviewCard: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  reviewerDetails: {
    flex: 1,
    marginLeft: 10,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  verifiedText: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '500',
  },
  starBadgePill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  starBadgePillText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#166534',
  },
  reviewComment: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
    marginTop: 8,
  },
  reviewPhotos: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  reviewPhotoThumb: {
    width: 54,
    height: 54,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  fixedBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  addToCartOutlineBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  addToCartOutlineText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#16A34A',
  },
  buyNowSolidBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyNowSolidText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
