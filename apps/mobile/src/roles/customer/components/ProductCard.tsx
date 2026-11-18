/**
 * Shared catalog product card + catalog helpers (Home rails, product grid,
 * search results, trending, wishlist). Server-driven only: every value comes
 * from a `Product` (docs/openapi.yaml), money is rendered with formatRupees,
 * and the identity of a card is `${id}:${grade}` (a crop sells per grade).
 *
 * Visuals are the Home card (Figma 142 x 168, title below the card); `grid`
 * stretches to the column width and `compact` is the 3-up wishlist card.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View, type ImageSourcePropType } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useQueryClient } from '@tanstack/react-query';
import { ApiError } from '../../../shell/api/client';
import { t } from '../../../i18n/customer';
import { catalogQueryKeys, type PackUnit, type Product, type SellableGrade } from '../api/catalog';
import { cartQueryKeys, useAddToCart } from '../api/cart';
import { mapProblem } from '../api/problem';
import { clampKg, formatRupees, type Quantity } from '../utils/money';
import { customerFonts } from '../theme';

// ── helpers ──────────────────────────────────────────────────────────────────

/** `{ uri }` of the first product photo, or null (the card then shows an empty image box). */
export function productImageSource(photos: readonly string[] | null | undefined): ImageSourcePropType | null {
  const uri = photos?.find((p) => typeof p === 'string' && p.length > 0);
  return uri ? { uri } : null;
}

const PACK_UNIT_LABEL: Record<PackUnit, string> = {
  KG: 'kg',
  G: 'g',
  PIECE: 'pc',
  BUNCH: 'bunch',
  DOZEN: 'dozen',
  PACK: 'pack',
};

/** `"500 g pack"`-style display text from packSize + packUnit (display only), or null. */
export function packLabel(p: Pick<Product, 'packSize' | 'packUnit'> | null | undefined): string | null {
  if (!p?.packSize || !p.packUnit) return null;
  const size = p.packSize.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
  return t('catalog.pack.label', { size, unit: PACK_UNIT_LABEL[p.packUnit] ?? p.packUnit.toLowerCase() });
}

/** One-decimal rating text, or null when unrated (the badge is hidden). */
export function ratingText(p: Pick<Product, 'ratingAverage'> | null | undefined): string | null {
  const r = p?.ratingAverage;
  return typeof r === 'number' && Number.isFinite(r) ? r.toFixed(1) : null;
}

/** Default quick-add quantity: 1 kg, capped to what is available. */
export function quickAddQty(p: Pick<Product, 'availableQty'>): Quantity {
  return clampKg('1.000', { max: p.availableQty });
}

export const HeartSvg = ({ filled = false, size = 18 }: { filled?: boolean; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      fill={filled ? '#EF4444' : 'none'}
      stroke={filled ? '#EF4444' : '#9CA3AF'}
      strokeWidth={1.5}
    />
  </Svg>
);

// ── add-to-cart with conflict handling ───────────────────────────────────────

export interface CatalogAddInput {
  productId: string;
  grade: SellableGrade;
  qtyKg: Quantity;
}

/**
 * POST /cart/items with the catalog error UX: 409 STOCK_UNAVAILABLE shows the
 * server message and refreshes the cart; 409 INSUFFICIENT_ALLOCATION shows the
 * daily-limit message and disables that SKU's add button until the catalog
 * is refetched; 404 (delisted) refreshes the catalog. `pendingKey` drives the
 * per-button spinner.
 */
export function useCatalogAddToCart() {
  const qc = useQueryClient();
  const { mutateAsync } = useAddToCart();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [blockedKeys, setBlockedKeys] = useState<ReadonlySet<string>>(() => new Set());
  const [notice, setNotice] = useState<string | null>(null);

  const addItem = useCallback(
    async (input: CatalogAddInput): Promise<boolean> => {
      const key = `${input.productId}:${input.grade}`;
      setPendingKey(key);
      try {
        await mutateAsync({ productId: input.productId, grade: input.grade, qtyKg: input.qtyKg });
        return true;
      } catch (err) {
        const problem = mapProblem(err);
        if (problem.silent) return false;
        if (err instanceof ApiError && err.code === 'INSUFFICIENT_ALLOCATION') {
          setBlockedKeys((prev) => new Set(prev).add(key));
          setNotice(t('catalog.add.dailyLimit'));
        } else if (err instanceof ApiError && err.status === 404) {
          setNotice(t('catalog.add.delisted'));
          void qc.invalidateQueries({ queryKey: catalogQueryKeys.all });
        } else {
          setNotice(problem.message);
        }
        if (problem.action === 'refresh_cart') void qc.invalidateQueries({ queryKey: cartQueryKeys.cart });
        return false;
      } finally {
        setPendingKey(null);
      }
    },
    [mutateAsync, qc],
  );

  const clearNotice = useCallback(() => setNotice(null), []);
  return { addItem, pendingKey, blockedKeys, notice, clearNotice };
}

/** Dark pill with a short message; auto-dismisses. [needs design review] */
export function CatalogNotice({ message, onDismiss }: { message: string | null; onDismiss: () => void }) {
  useEffect(() => {
    if (!message) return undefined;
    const id = setTimeout(onDismiss, 3500);
    return () => clearTimeout(id);
  }, [message, onDismiss]);
  if (!message) return null;
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onDismiss} style={styles.notice} accessibilityRole="alert" testID="catalog-notice">
      <Text style={styles.noticeText}>{message}</Text>
    </TouchableOpacity>
  );
}

// ── card ─────────────────────────────────────────────────────────────────────

export type ProductCardVariant = 'rail' | 'grid' | 'compact';

export interface ProductCardProps {
  /** null = no longer sellable (wishlist): greyed, no price. */
  product: Product | null;
  /** Display name (falls back to product.name). */
  name?: string;
  variant?: ProductCardVariant;
  /** Column width for `grid` / `compact`. */
  width?: number;
  wishlisted?: boolean;
  onPress?: (() => void) | undefined;
  onToggleWishlist?: (() => void) | undefined;
  onPressRating?: (() => void) | undefined;
  /** Shows a "+" add button in the price row. */
  onAdd?: (() => void) | undefined;
  adding?: boolean;
  addDisabled?: boolean;
}

export function ProductCard({
  product,
  name,
  variant = 'rail',
  width,
  wishlisted = false,
  onPress,
  onToggleWishlist,
  onPressRating,
  onAdd,
  adding = false,
  addDisabled = false,
}: ProductCardProps) {
  const displayName = name ?? product?.name ?? '';
  const unavailable = product === null;
  const comingTomorrow = product?.comingTomorrow === true;
  const greyed = unavailable || product?.isComingSoon === true || product?.isUnsalable === true;
  const rating = ratingText(product);
  const image = productImageSource(product?.photos);
  const compact = variant === 'compact';
  const containerWidth = variant === 'rail' ? 142 : width;

  return (
    <View style={[styles.container, containerWidth !== undefined && { width: containerWidth }]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        disabled={!onPress}
        accessibilityLabel={displayName}
        style={[
          styles.card,
          compact && styles.cardCompact,
          comingTomorrow && styles.cardComingTomorrow,
          greyed && styles.cardUnsalable,
        ]}
      >
        <View style={styles.headerRow}>
          {rating !== null ? (
            <TouchableOpacity activeOpacity={0.7} onPress={onPressRating} disabled={!onPressRating} style={styles.ratingBadge} accessibilityLabel={t('catalog.card.ratingA11y', { rating })}>
              <Text style={[styles.starIcon, compact && styles.smallText]}>★ </Text>
              <Text style={[styles.ratingText, compact && styles.smallText]}>{rating}</Text>
            </TouchableOpacity>
          ) : (
            <View />
          )}
          {onToggleWishlist && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onToggleWishlist}
              style={styles.heartButton}
              accessibilityLabel={wishlisted ? t('catalog.card.unfavorite', { name: displayName }) : t('catalog.card.favorite', { name: displayName })}
            >
              <HeartSvg filled={wishlisted} size={compact ? 16 : 18} />
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.imageCenter, compact && styles.imageCenterCompact]}>
          {image ? (
            <Image source={image} style={[compact ? styles.imageCompact : styles.image, greyed && styles.imageGreyed]} resizeMode="contain" />
          ) : (
            <View style={[compact ? styles.imageCompact : styles.image, styles.imagePlaceholder]} />
          )}
          {comingTomorrow && (
            <View style={styles.comingTomorrowBadge}>
              <Text style={styles.comingTomorrowText}>{t('catalog.card.comingTomorrow')}</Text>
            </View>
          )}
        </View>

        {product ? (
          <View style={styles.priceRow}>
            <Text style={[styles.priceBold, compact && styles.priceBoldCompact]}>{formatRupees(product.pricePerKg)}</Text>
            {product.compareAtPrice ? (
              <Text style={[styles.priceStrike, compact && styles.smallText]}>{formatRupees(product.compareAtPrice)}</Text>
            ) : (
              <View style={styles.spacer} />
            )}
            <Text style={[styles.unitText, compact && styles.smallText]}>{t('catalog.card.perKg')}</Text>
            {onAdd && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onAdd}
                disabled={adding || addDisabled || greyed}
                style={[styles.addBtn, (addDisabled || greyed) && styles.addBtnDisabled]}
                accessibilityLabel={t('catalog.card.addA11y', { name: displayName })}
                accessibilityState={{ disabled: adding || addDisabled || greyed, busy: adding }}
              >
                {adding ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.addBtnText}>+</Text>}
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <Text style={styles.unavailableText}>{t('catalog.card.unavailable')}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity activeOpacity={0.85} onPress={onPress} disabled={!onPress}>
        <Text style={[styles.name, compact && styles.nameCompact]} numberOfLines={1}>
          {displayName}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  card: {
    width: '100%',
    height: 168,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardCompact: {
    height: 146,
    borderRadius: 16,
    padding: 8,
  },
  cardComingTomorrow: {
    backgroundColor: '#A8C4A7',
    borderColor: '#97B896',
  },
  cardUnsalable: {
    backgroundColor: '#D1D5DB',
    borderColor: '#CBD5E1',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  starIcon: {
    fontSize: 11,
    color: '#F59E0B',
  },
  ratingText: {
    fontFamily: customerFonts.bold,
    fontSize: 11,
    color: '#1F2937',
  },
  smallText: {
    fontSize: 9,
  },
  heartButton: {
    padding: 2,
  },
  imageCenter: {
    height: 82,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageCenterCompact: {
    height: 64,
  },
  image: {
    width: 104,
    height: 80,
  },
  imageCompact: {
    width: '90%',
    height: 60,
  },
  imageGreyed: {
    opacity: 0.6,
  },
  imagePlaceholder: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  comingTomorrowBadge: {
    position: 'absolute',
    zIndex: 10,
    backgroundColor: '#1E7E34',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  comingTomorrowText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontFamily: customerFonts.bold,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  priceBold: {
    fontFamily: customerFonts.bold,
    fontSize: 13,
    color: '#111827',
    marginRight: 6,
  },
  priceBoldCompact: {
    fontSize: 11,
    marginRight: 2,
  },
  priceStrike: {
    fontFamily: customerFonts.regular,
    fontSize: 11,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginRight: 'auto',
  },
  spacer: {
    marginRight: 'auto',
  },
  unitText: {
    fontFamily: customerFonts.regular,
    fontSize: 11,
    color: '#6B7280',
  },
  addBtn: {
    marginLeft: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  addBtnText: {
    color: '#FFFFFF',
    fontFamily: customerFonts.bold,
    fontSize: 16,
    lineHeight: 18,
  },
  unavailableText: {
    fontFamily: customerFonts.regular,
    fontSize: 10,
    color: '#4B5563',
  },
  name: {
    fontFamily: customerFonts.regular,
    fontSize: 12,
    color: '#374151',
    marginTop: 6,
    textAlign: 'center',
    width: '100%',
  },
  nameCompact: {
    fontSize: 11,
  },
  notice: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 96,
    backgroundColor: '#111827',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    zIndex: 50,
    elevation: 8,
  },
  noticeText: {
    color: '#FFFFFF',
    fontFamily: customerFonts.regular,
    fontSize: 13,
    textAlign: 'center',
  },
});
