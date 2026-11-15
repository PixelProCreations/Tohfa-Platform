import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { ProductImages } from '../assets/images/products';
import {
  customerColors,
  customerFonts,
  customerSpacing,
  customerRadius,
  customerShadow,
  customerPrimitives,
  customerType,
} from '../theme';

export interface VarietyItem {
  id: string;
  name: string;
  weight: string;
  subtitle: string;
  price: number;
  image?: any;
}

export interface ProductModalData {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  unit: string;
  rating: number;
  ratingCount?: number;
  image?: any;
  description?: string;
  packageInfo?: string;
  varieties?: VarietyItem[];
}

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

export const APPLE_VARIETIES: VarietyItem[] = [
  {
    id: 'var_royal_gala',
    name: 'Royal Gala',
    weight: '1 kg',
    subtitle: 'Sweet & mellow',
    price: 160.0,
    image: ProductImages.fruitApple,
  },
  {
    id: 'var_fuji',
    name: 'Fuji',
    weight: '1 kg',
    subtitle: 'Extra sweet & juicy',
    price: 152.0,
    image: ProductImages.fruitApple,
  },
  {
    id: 'var_granny_smith',
    name: 'Granny Smith',
    weight: '1 kg',
    subtitle: 'Tart & crisp',
    price: 158.0,
    image: ProductImages.fruitApple,
  },
  {
    id: 'var_pink_lady',
    name: 'Pink Lady',
    weight: '1 kg',
    subtitle: 'Sweet with a little tang',
    price: 120.0,
    image: ProductImages.fruitApple,
  },
];

interface ProductDetailsModalProps {
  visible: boolean;
  product: ProductModalData | null;
  onClose: () => void;
  onSelectVarietyProduct?: (variety: VarietyItem, parent: ProductModalData) => void;
  onAddToCart?: (product: ProductModalData, quantity: number, varietiesTotal?: number) => void;
}

export function ProductDetailsModal({
  visible,
  product,
  onClose,
  onSelectVarietyProduct,
  onAddToCart,
}: ProductDetailsModalProps) {
  const [quantity, setQuantity] = useState(0);
  const [selectedVarieties, setSelectedVarieties] = useState<{ [id: string]: number }>({});

  React.useEffect(() => {
    if (visible) {
      setQuantity(0);
      setSelectedVarieties({});
    }
  }, [visible, product]);

  if (!product) return null;

  const hasVarieties =
    (product.varieties && product.varieties.length > 0) ||
    product.name.toLowerCase().includes('apple');

  const varietiesList = product.varieties || (hasVarieties ? APPLE_VARIETIES : []);

  const totalVarietiesPrice = Object.entries(selectedVarieties).reduce((acc, [id, qty]) => {
    const item = varietiesList.find(v => v.id === id);
    return acc + (item ? item.price * qty : 0);
  }, 0);

  const totalSimplePrice = (quantity * (product.price || 165)).toFixed(2);
  const totalPriceDisplay = hasVarieties
    ? totalVarietiesPrice.toFixed(2)
    : totalSimplePrice;

  const totalItemsCount = hasVarieties
    ? Object.values(selectedVarieties).reduce((sum, q) => sum + q, 0)
    : quantity;

  const ratingCount = product.ratingCount || 128;
  const packageInfo = product.packageInfo || '1 kg bag · approx. 6 apples';
  const desc =
    product.description || 'Orchard-fresh crunch, picked for your everyday.';

  const toggleVarietySelect = (id: string) => {
    setSelectedVarieties(prev => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = 1;
      }
      return next;
    });
  };

  const updateVarietyQty = (id: string, delta: number) => {
    setSelectedVarieties(prev => {
      const current = prev[id] || 0;
      const nextQty = Math.max(0, current + delta);
      const copy = { ...prev };
      if (nextQty === 0) {
        delete copy[id];
      } else {
        copy[id] = nextQty;
      }
      return copy;
    });
  };

  const handleAdd = () => {
    if (hasVarieties) {
      if (totalItemsCount > 0) {
        onAddToCart?.(product, totalItemsCount, totalVarietiesPrice);
      }
    } else {
      const finalQty = quantity === 0 ? 1 : quantity;
      onAddToCart?.(product, finalQty, finalQty * (product.price || 165));
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            {/* Exact Floating Circular Close Button matching Figma Image 1 left */}
            <TouchableOpacity
              style={styles.floatingCloseBtn}
              activeOpacity={0.8}
              onPress={onClose}
              accessibilityLabel="Close"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ModalCloseCrossSvg size={14} color="#1F2937" />
            </TouchableOpacity>
            {/* Header: Product Image, Title, Rating, Price */}
            <View style={styles.headerRow}>
              <TouchableOpacity
                style={styles.imageBox}
                activeOpacity={0.7}
                onPress={() => {
                  const firstVar = varietiesList[0] || {
                    id: product.id,
                    name: product.name,
                    weight: '1 kg',
                    subtitle: '',
                    price: product.price || 165,
                    image: product.image,
                  };
                  onSelectVarietyProduct?.(firstVar, product);
                }}
              >
                {product.image && (
                  <Image source={product.image} style={styles.productImg} resizeMode="contain" />
                )}
              </TouchableOpacity>

              <View style={styles.titleCol}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    const firstVar = varietiesList[0] || {
                      id: product.id,
                      name: product.name,
                      weight: '1 kg',
                      subtitle: '',
                      price: product.price || 165,
                      image: product.image,
                    };
                    onSelectVarietyProduct?.(firstVar, product);
                  }}
                >
                  <Text style={styles.titleText}>
                    {product.name.toLowerCase() === 'apple' ? 'Fresh apples' : product.name}
                  </Text>
                </TouchableOpacity>
                <View style={styles.ratingRow}>
                  <Text style={styles.star}>★</Text>
                  <Text style={styles.ratingScore}>{product.rating?.toFixed(1) || '4.8'}</Text>
                  <Text style={styles.ratingCount}>({ratingCount} reviews)</Text>
                </View>
              </View>

              <View style={styles.priceCol}>
                <Text style={styles.priceText}>
                  ₹{hasVarieties ? (totalVarietiesPrice > 0 ? totalVarietiesPrice.toFixed(2) : '0.00') : (product.price || 165).toFixed(2)}
                </Text>
                <Text style={styles.packageText}>{packageInfo}</Text>
              </View>
            </View>

            {/* ── VARIETY SECTION (Screen 3) vs NON-VARIETY SECTION (Screen 1 & 2) ── */}
            {hasVarieties ? (
              <>
                <Text style={styles.descText}>{desc}</Text>
                <View style={styles.varietySection}>
                  <View style={styles.varietyHeaderRow}>
                    <Text style={styles.varietyHeaderTitle}>Pick a variety</Text>
                    <Text style={styles.varietyHeaderSub}>Price per 1 kg bag</Text>
                  </View>

                  <ScrollView style={styles.varietyList} showsVerticalScrollIndicator={true}>
                    {varietiesList.map(v => {
                      const isSelected = !!selectedVarieties[v.id];
                      return (
                        <View
                          key={v.id}
                          style={[
                            styles.varietyCard,
                            isSelected && styles.varietyCardSelected,
                          ]}
                        >
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => onSelectVarietyProduct?.(v, product)}
                            style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingVertical: 2 }}
                            accessibilityLabel={`View details for ${v.name}`}
                          >
                            <Image source={v.image || product.image} style={styles.varietyThumb} resizeMode="contain" />
                            <View style={styles.varietyInfo}>
                              <Text style={styles.varietyName}>
                                {v.name} ({v.weight})
                              </Text>
                              <Text style={styles.varietySubtitle}>{v.subtitle}</Text>
                            </View>
                            <Text style={styles.varietyPrice}>₹{v.price.toFixed(2)}</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            activeOpacity={0.75}
                            onPress={() => toggleVarietySelect(v.id)}
                            style={[
                              styles.checkbox,
                              isSelected && styles.checkboxSelected,
                            ]}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            accessibilityLabel={`Select ${v.name}`}
                          >
                            {isSelected && <Text style={styles.checkmark}>✔</Text>}
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </ScrollView>

                  {/* Selected variety steppers */}
                  {Object.keys(selectedVarieties).length > 0 && (
                    <View style={styles.steppersList}>
                      {Object.entries(selectedVarieties).map(([id, qty]) => {
                        const item = varietiesList.find(v => v.id === id);
                        if (!item) return null;
                        return (
                          <View key={id} style={styles.stepperItemRow}>
                            <TouchableOpacity
                              activeOpacity={0.7}
                              onPress={() => onSelectVarietyProduct?.(item, product)}
                              style={styles.stepperItemLabel}
                            >
                              <Text style={styles.stepperTitle}>
                                {item.name} · {item.subtitle}
                              </Text>
                              <Text style={styles.stepperSub}>{item.weight} bag</Text>
                            </TouchableOpacity>
                            <View style={styles.stepperContainer}>
                              <TouchableOpacity
                                style={styles.stepBtn}
                                onPress={() => updateVarietyQty(id, -1)}
                                activeOpacity={0.7}
                              >
                                <Text style={styles.stepBtnText}>−</Text>
                              </TouchableOpacity>
                              <Text style={styles.stepQty}>{qty}</Text>
                              <TouchableOpacity
                                style={styles.stepBtn}
                                onPress={() => updateVarietyQty(id, 1)}
                                activeOpacity={0.7}
                              >
                                <Text style={styles.stepBtnText}>+</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              </>
            ) : (
              /* Non-variety stepper row: Description on Left, (+) or Stepper on Right (Screen 1 & 2) */
              <View style={styles.descAndStepperRow}>
                <Text style={styles.descTextCompact}>{desc}</Text>
                <View style={styles.simpleStepperCol}>
                  {quantity === 0 ? (
                    <TouchableOpacity
                      style={styles.plusButton}
                      activeOpacity={0.8}
                      onPress={() => setQuantity(1)}
                    >
                      <Text style={styles.plusText}>+</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.stepperContainer}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => setQuantity(q => Math.max(0, q - 1))}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.stepBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.stepQty}>{quantity}</Text>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => setQuantity(q => q + 1)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.stepBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            )}

            <View style={styles.divider} />

            {/* Add to Cart CTA */}
            <TouchableOpacity style={styles.addCartBtn} activeOpacity={0.85} onPress={handleAdd}>
              <View style={styles.cartBtnContent}>
                <View style={styles.cartIconWrapper}>
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M3 3h2l2 12h11l2-8H6"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M9 20a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM17 20a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
                      fill="#FFFFFF"
                    />
                  </Svg>
                </View>
                <Text style={styles.addCartText}>Add to cart</Text>
              </View>
              <Text style={styles.totalPriceText}>₹{totalPriceDisplay}</Text>
            </TouchableOpacity>

            {/* Guarantee footer */}
            <View style={styles.guaranteeRow}>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                  stroke="#52796F"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M9 12l2 2 4-4"
                  stroke="#52796F"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={styles.guaranteeText}>Freshness guaranteed, or your money back.</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FULL PRODUCT DETAILS POPUP (Screen 3 & Screen 4 - scrollable full page modal)
// ─────────────────────────────────────────────────────────────────────────────
interface FullProductDetailsModalProps {
  visible: boolean;
  product: VarietyItem | null;
  parentProduct: ProductModalData | null;
  onClose: () => void;
  onAddToCart?: (item: VarietyItem, qty: number) => void;
  onBuyNow?: (item: VarietyItem, qty: number) => void;
  onOpenCart?: () => void;
}

export function FullProductDetailsModal({
  visible,
  product,
  parentProduct,
  onClose,
  onAddToCart,
  onBuyNow,
  onOpenCart,
}: FullProductDetailsModalProps) {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [qty, setQty] = useState(1);

  if (!product) return null;

  const price = product.price || 120;
  const originalPrice = 132;
  const displayTitle = 'Royal gala Applie';

  return (
    <Modal visible={visible} transparent={false} animationType="slide" onRequestClose={onClose}>
      <View style={styles.fullModalContainer}>
        {/* Header Bar: Back + Title + Cart Icon */}
        <View style={styles.fullTopBar}>
          <TouchableOpacity style={styles.backCircleBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.backArrowText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.fullBarTitle}>Product Details</Text>
          <TouchableOpacity
            style={styles.cartCircleBtn}
            activeOpacity={0.7}
            onPress={() => {
              onClose();
              onOpenCart?.();
            }}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path
                d="M3 3h2l2 12h11l2-8H6"
                stroke="#333333"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M9 20a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM17 20a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
                fill="#333333"
              />
            </Svg>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.fullScroll} showsVerticalScrollIndicator={false}>
          {/* Main Hero Photo Card */}
          <View style={styles.heroCard}>
            <Image
              source={product.image || parentProduct?.image || ProductImages.fruitApple}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <View style={styles.heroOrganicBadge}>
              <Text style={styles.heroOrganicText}>🍃 Organic</Text>
            </View>
            <TouchableOpacity style={styles.shareBtn} activeOpacity={0.8}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Circle cx="18" cy="5" r="3" stroke="#1F2937" strokeWidth="2" />
                <Circle cx="6" cy="12" r="3" stroke="#1F2937" strokeWidth="2" />
                <Circle cx="18" cy="19" r="3" stroke="#1F2937" strokeWidth="2" />
                <Path
                  d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"
                  stroke="#1F2937"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </Svg>
            </TouchableOpacity>
          </View>

          {/* Small Thumbnails Row */}
          <View style={styles.thumbRow}>
            <Image source={ProductImages.fruitApple} style={styles.smallThumb} resizeMode="cover" />
            <Image source={ProductImages.fruitApple} style={styles.smallThumb} resizeMode="cover" />
            <Image source={ProductImages.fruitApple} style={styles.smallThumb} resizeMode="cover" />
            <Image source={ProductImages.fruitApple} style={styles.smallThumb} resizeMode="cover" />
            <View style={styles.moreThumb}>
              <Text style={styles.moreThumbText}>+3</Text>
            </View>
          </View>

          {/* Title & Metadata */}
          <View style={styles.fullContentPadding}>
            <View style={styles.titleHeartRow}>
              <Text style={styles.fullProductTitle}>
                {displayTitle}
              </Text>
              <TouchableOpacity style={styles.heartCircleSmall}>
                <Text style={{ fontSize: 16 }}>♡</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.farmMetaRow}>
              <Text style={styles.farmMetaText}>📍 Farm Fresh · Nilgiris  |  </Text>
              <Text style={styles.certifiedBadge}>✔ TOHFA Certified</Text>
            </View>

            <View style={styles.starQuestionsRow}>
              <Text style={styles.starYellow}>★ 4.8</Text>
              <Text style={styles.reviewsMuted}> (128 reviews)  |  💬 42 Questions</Text>
            </View>

            {/* Price Row */}
            <View style={styles.fullPriceRow}>
              <Text style={styles.fullPriceLarge}>₹{price} / kg</Text>
              <Text style={styles.fullPriceStrikethrough}>₹{originalPrice}</Text>
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>30% OFF</Text>
              </View>
              <View style={{ flex: 1 }} />
              <TouchableOpacity style={styles.fullPlusBtn} onPress={() => setQty(q => q + 1)}>
                <Text style={styles.fullPlusText}>+</Text>
              </TouchableOpacity>
            </View>

            {/* Quality Badges */}
            <View style={styles.qualityBadgesRow}>
              <View style={styles.qualityBadge}>
                <Text style={styles.qualityIcon}>🍃</Text>
                <Text style={styles.qualityLabel}>100% Organic</Text>
              </View>
              <View style={styles.qualityBadge}>
                <Text style={styles.qualityIcon}>🌿</Text>
                <Text style={styles.qualityLabel}>Residue Free</Text>
              </View>
              <View style={styles.qualityBadge}>
                <Text style={styles.qualityIcon}>🧪</Text>
                <Text style={styles.qualityLabel}>Chemical Free</Text>
              </View>
              <View style={styles.qualityBadge}>
                <Text style={styles.qualityIcon}>🎖</Text>
                <Text style={styles.qualityLabel}>Farm Verified</Text>
              </View>
            </View>

            {/* About this product */}
            <Text style={styles.sectionHeading}>About this product</Text>
            <Text style={styles.aboutParagraph}>
              Fresh, Crispy and naturally sweet Royal gala apples, sourced directly from TOHFA Certified farmers in the Nilgiris.
            </Text>
            <TouchableOpacity>
              <Text style={styles.readMoreText}>Read More...</Text>
            </TouchableOpacity>

            {/* Product Information Table */}
            <Text style={styles.sectionHeading}>Product Information</Text>
            <View style={styles.infoTable}>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Origin</Text>
                <Text style={styles.infoVal}>Nilgiris, Tamil Nadu</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Farming Type</Text>
                <Text style={styles.infoVal}>Organic</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Harvest Season</Text>
                <Text style={styles.infoVal}>Jun - Sep</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Shelf Life</Text>
                <Text style={styles.infoVal}>5 - 7 Days (Keep refrigerated)</Text>
              </View>
            </View>

            {/* Screen 4 Content: Ratings & Reviews block inside full detail */}
            <Text style={styles.sectionHeading}>Ratings & Reviews</Text>
            <View style={styles.detailReviewsSummary}>
              <View style={styles.scoreCol}>
                <View style={styles.bigRatingRow}>
                  <Text style={styles.bigRatingNum}>4.6</Text>
                  <Text style={styles.bigStar}>★</Text>
                </View>
                <Text style={styles.reviewsTotal}>(328 Reviews)</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.barsCol}>
                {[
                  { star: 5, pct: '72%' },
                  { star: 4, pct: '16%' },
                  { star: 3, pct: '7%' },
                  { star: 2, pct: '3%' },
                  { star: 1, pct: '2%' },
                ].map(item => (
                  <View key={item.star} style={styles.barRow}>
                    <Text style={styles.barStarNum}>{item.star}</Text>
                    <Text style={styles.barStarIcon}>★</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: item.pct }]} />
                    </View>
                    <Text style={styles.barPct}>{item.pct}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Filter Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsRow}>
              {[
                { id: 'all', label: 'All Reviews (328)' },
                { id: 'photos', label: 'With Photos (56)' },
                { id: '5', label: '5 ★ (236)' },
                { id: '4', label: '4 ★ (52)' },
                { id: '3', label: '3 ★ (23)' },
                { id: '2', label: '2 ★ (10)' },
              ].map(f => (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.filterPill, selectedFilter === f.id && styles.filterPillActive]}
                  onPress={() => setSelectedFilter(f.id)}
                >
                  <Text style={[styles.filterPillText, selectedFilter === f.id && styles.filterPillTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Reviews in Detail Screen */}
            <View style={styles.reviewItem}>
              <View style={styles.reviewHeader}>
                <View style={[styles.avatarCircle, { backgroundColor: '#D1E7DD' }]}>
                  <Text style={[styles.avatarText, { color: '#0F5132' }]}>R</Text>
                </View>
                <View style={styles.reviewerMeta}>
                  <Text style={styles.reviewerName}>Ramya S.</Text>
                  <View style={styles.verifiedRow}>
                    <Text style={styles.reviewDate}>15 Jul 2026 · </Text>
                    <Text style={styles.verifiedBadge}>✔ Verified Buyer</Text>
                  </View>
                </View>
                <View style={styles.starBadgeSmall}>
                  <Text style={styles.starBadgeText}>5 ★</Text>
                </View>
              </View>
              <Text style={styles.reviewBody}>
                Fresh and good quality vegetables. Packaging was also nice. Will order again.
              </Text>
              <View style={styles.reviewPhotosRow}>
                <Image source={ProductImages.vegPotato} style={styles.reviewThumb} resizeMode="cover" />
                <Image source={ProductImages.vegCarrot} style={styles.reviewThumb} resizeMode="cover" />
                <Image source={ProductImages.herbCoriander} style={styles.reviewThumb} resizeMode="cover" />
              </View>
            </View>

            <View style={{ height: 100 }} />
          </View>
        </ScrollView>

        {/* Bottom CTA Floating Footer */}
        <View style={styles.fullBottomActions}>
          <TouchableOpacity
            style={styles.fullAddToCartBtn}
            onPress={() => {
              onAddToCart?.(product, qty);
              onClose();
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.fullAddToCartText}>Add to Cart</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.fullBuyNowBtn}
            onPress={() => {
              onClose();
              if (onBuyNow) {
                onBuyNow(product, qty);
              } else {
                onAddToCart?.(product, qty);
              }
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.fullBuyNowText}>Buy Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOAST COMPONENT (Screen 5 - floating black pill: "2 items in your cart  ₹312.00")
// ─────────────────────────────────────────────────────────────────────────────
interface CartToastProps {
  visible: boolean;
  itemCount: number;
  totalPrice: number;
  thumbImage?: any;
  onViewCart?: () => void;
}

export function CartToast({ visible, itemCount, totalPrice, thumbImage, onViewCart }: CartToastProps) {
  if (!visible) return null;

  return (
    <View style={styles.toastContainer}>
      <TouchableOpacity style={styles.toastCard} activeOpacity={0.9} onPress={onViewCart}>
        <View style={styles.toastThumbWrapper}>
          <Image
            source={thumbImage || ProductImages.fruitApple}
            style={styles.toastThumb}
            resizeMode="contain"
          />
        </View>
        <View style={styles.toastTextCol}>
          <Text style={styles.toastTitle}>
            {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
          </Text>
          <Text style={styles.toastSub}>View cart</Text>
        </View>
        <Text style={styles.toastPrice}>₹{totalPrice.toFixed(2)}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RATINGS & REVIEWS MODAL
// ─────────────────────────────────────────────────────────────────────────────
interface RatingsReviewsModalProps {
  visible: boolean;
  product: ProductModalData | null;
  onClose: () => void;
  onWriteReview?: () => void;
}

export function RatingsReviewsModal({ visible, product, onClose, onWriteReview }: RatingsReviewsModalProps) {
  const [selectedFilter, setSelectedFilter] = useState('all');

  if (!product) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.cardContainerReviews}>
          <View style={styles.reviewsCard}>
            {/* Exact Floating Circular Close Button matching Figma Image 1 left */}
            <TouchableOpacity
              style={styles.floatingCloseBtn}
              activeOpacity={0.8}
              onPress={onClose}
              accessibilityLabel="Close"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ModalCloseCrossSvg size={14} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.reviewsHeading}>Ratings & Reviews</Text>

            <View style={styles.ratingSummaryRow}>
              <View style={styles.scoreCol}>
                <View style={styles.bigRatingRow}>
                  <Text style={styles.bigRatingNum}>{product.rating?.toFixed(1) || '4.6'}</Text>
                  <Text style={styles.bigStar}>★</Text>
                </View>
                <Text style={styles.reviewsTotal}>(328 Reviews)</Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.barsCol}>
                {[
                  { star: 5, pct: '72%' },
                  { star: 4, pct: '16%' },
                  { star: 3, pct: '7%' },
                  { star: 2, pct: '3%' },
                  { star: 1, pct: '2%' },
                ].map(item => (
                  <View key={item.star} style={styles.barRow}>
                    <Text style={styles.barStarNum}>{item.star}</Text>
                    <Text style={styles.barStarIcon}>★</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: item.pct }]} />
                    </View>
                    <Text style={styles.barPct}>{item.pct}</Text>
                  </View>
                ))}
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsRow}>
              {[
                { id: 'all', label: 'All Reviews (328)' },
                { id: 'photos', label: 'With Photos (56)' },
                { id: '5', label: '5 ★ (236)' },
                { id: '4', label: '4 ★ (52)' },
                { id: '3', label: '3 ★ (23)' },
              ].map(f => (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.filterPill, selectedFilter === f.id && styles.filterPillActive]}
                  onPress={() => setSelectedFilter(f.id)}
                >
                  <Text style={[styles.filterPillText, selectedFilter === f.id && styles.filterPillTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ScrollView style={styles.reviewsList} showsVerticalScrollIndicator={true}>
              <View style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <View style={[styles.avatarCircle, { backgroundColor: '#D1E7DD' }]}>
                    <Text style={[styles.avatarText, { color: '#0F5132' }]}>R</Text>
                  </View>
                  <View style={styles.reviewerMeta}>
                    <Text style={styles.reviewerName}>Ramya S.</Text>
                    <View style={styles.verifiedRow}>
                      <Text style={styles.reviewDate}>15 Jul 2026 · </Text>
                      <Text style={styles.verifiedBadge}>✔ Verified Buyer</Text>
                    </View>
                  </View>
                  <View style={styles.starBadgeSmall}>
                    <Text style={styles.starBadgeText}>5 ★</Text>
                  </View>
                </View>
                <Text style={styles.reviewBody}>
                  Fresh and good quality vegetables. Packaging was also nice. Will order again.
                </Text>
                <View style={styles.reviewPhotosRow}>
                  <Image source={ProductImages.vegPotato} style={styles.reviewThumb} resizeMode="cover" />
                  <Image source={ProductImages.vegCarrot} style={styles.reviewThumb} resizeMode="cover" />
                  <Image source={ProductImages.herbCoriander} style={styles.reviewThumb} resizeMode="cover" />
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.writeReviewBtn}
              activeOpacity={0.85}
              onPress={() => {
                onClose();
                onWriteReview?.();
              }}
            >
              <EditPenSvg size={16} color="#FFFFFF" />
              <Text style={styles.writeReviewText}>  Write a review</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
