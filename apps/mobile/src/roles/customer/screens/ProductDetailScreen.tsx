import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  Share,
  Platform,
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

interface ProductDetailScreenProps {
  productId?: string;
  product?: any;
  onGoBack?: () => void;
  onNavigate?: (screen: string, params?: any) => void;
  onAddToCart?: (product: any, qty: number) => void;
}

export function ProductDetailScreen({
  productId,
  product: initialProduct,
  onGoBack,
  onNavigate,
  onAddToCart,
}: ProductDetailScreenProps) {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [qty, setQty] = useState(1);
  const [isWishlist, setIsWishlist] = useState(false);
  const [activeThumb, setActiveThumb] = useState(0);

  // Fallback product info matching exact screenshot if none passed
  const product = initialProduct || {
    id: productId || 'fr1',
    name: 'Royal gala Applie',
    title: 'Royal gala Applie',
    price: 120,
    originalPrice: 132,
    discount: '30% OFF',
    rating: 4.8,
    reviewsCount: 128,
    questionsCount: 42,
    location: 'Farm Fresh · Nilgiris',
    certified: 'TOHFA Certified',
    image: ProductImages.fruitApple,
  };

  const price = product.price || 120;
  const originalPrice = product.originalPrice || 132;
  const discountText = product.discount || '30% OFF';
  const displayTitle = product.name?.includes('Applie') || product.name?.includes('Apple')
    ? 'Royal gala Applie'
    : (product.name || 'Royal gala Applie');

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${displayTitle} on TOHFA Market - Freshly harvested from Nilgiris!`,
      });
    } catch {
      // Ignored
    }
  };

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product, qty);
    }
    // Navigate to Cart
    onNavigate?.('Cart', { addedProduct: product, qty });
  };

  const handleBuyNow = () => {
    onNavigate?.('Checkout', {
      total: price * qty,
      itemsCount: qty,
      directBuy: true,
      product,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ── TOP HEADER BAR: Back + Product Details + Cart Icon ── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.circleBtn}
          onPress={() => (onGoBack ? onGoBack() : onNavigate?.('Home'))}
          activeOpacity={0.7}
        >
          <Text style={styles.backArrowText}>←</Text>
        </TouchableOpacity>

        <Text style={styles.barTitle}>Product Details</Text>

        <TouchableOpacity
          style={styles.circleBtn}
          onPress={() => onNavigate?.('Cart')}
          activeOpacity={0.7}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M3 3h2l2 12h11l2-8H6"
              stroke="#111827"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M9 20a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM17 20a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
              fill="#111827"
            />
          </Svg>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO IMAGE CARD WITH BADGES & DOTS ── */}
        <View style={styles.heroContainer}>
          <Image
            source={product.image || ProductImages.fruitApple}
            style={styles.heroImage}
            resizeMode="cover"
          />

          {/* Top-left Organic badge */}
          <View style={styles.organicBadge}>
            <Text style={styles.organicIcon}>🍃</Text>
            <Text style={styles.organicText}>Organic</Text>
          </View>

          {/* Top-right Share button (Exact 3-node network icon matching Image 2 left) */}
          <TouchableOpacity
            style={styles.shareBtn}
            onPress={handleShare}
            activeOpacity={0.8}
            accessibilityLabel="Share Product"
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Circle cx="18" cy="5" r="3" stroke="#1F2937" strokeWidth={2} />
              <Circle cx="6" cy="12" r="3" stroke="#1F2937" strokeWidth={2} />
              <Circle cx="18" cy="19" r="3" stroke="#1F2937" strokeWidth={2} />
              <Path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="#1F2937" strokeWidth={2} strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>

          {/* Bottom Dots Indicator */}
          <View style={styles.dotsContainer}>
            <View style={[styles.dot, styles.activeDot]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>

        {/* ── THUMBNAIL GALLERY ROW ── */}
        <View style={styles.thumbnailRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveThumb(0)}
            style={[styles.thumbBox, activeThumb === 0 && styles.thumbBoxActive]}
          >
            <Image
              source={product.image || ProductImages.fruitApple}
              style={styles.thumbImage}
              resizeMode="cover"
            />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveThumb(1)}
            style={[styles.thumbBox, activeThumb === 1 && styles.thumbBoxActive]}
          >
            <Image
              source={product.image || ProductImages.fruitApple}
              style={styles.thumbImage}
              resizeMode="cover"
            />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveThumb(2)}
            style={[styles.thumbBox, activeThumb === 2 && styles.thumbBoxActive]}
          >
            <Image
              source={product.image || ProductImages.fruitApple}
              style={styles.thumbImage}
              resizeMode="cover"
            />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveThumb(3)}
            style={[styles.thumbBox, activeThumb === 3 && styles.thumbBoxActive]}
          >
            <Image
              source={product.image || ProductImages.fruitApple}
              style={styles.thumbImage}
              resizeMode="cover"
            />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveThumb(4)}
            style={[styles.thumbBox, styles.moreThumbBox]}
          >
            <Text style={styles.moreThumbText}>+3</Text>
          </TouchableOpacity>
        </View>

        {/* ── TITLE & PRODUCT METADATA ── */}
        <View style={styles.contentPadding}>
          {/* Title Row with Wishlist Heart */}
          <View style={styles.titleRow}>
            <Text style={styles.productTitle}>{displayTitle}</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsWishlist(!isWishlist)}
              style={styles.heartBtn}
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

          {/* Subtitle Row 1: Farm Fresh & TOHFA Certified */}
          <View style={styles.metaRow}>
            <Text style={styles.metaLocation}>📍 Farm Fresh · Nilgiris</Text>
            <View style={styles.metaDivider} />
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path
                d="M20 6L9 17l-5-5"
                stroke="#16A34A"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={styles.certifiedText}> TOHFA Certified</Text>
          </View>

          {/* Subtitle Row 2: Star rating & Questions */}
          <View style={styles.metaRow}>
            <Text style={styles.starText}>★ 4.8</Text>
            <Text style={styles.reviewsCountText}> (128 reviews)</Text>
            <View style={styles.metaDivider} />
            <Text style={styles.questionsIcon}>💬</Text>
            <Text style={styles.questionsText}> 42 Questions</Text>
          </View>

          {/* Price Row */}
          <View style={styles.priceRow}>
            <Text style={styles.priceMain}>₹{price} / kg</Text>
            <Text style={styles.priceStrikethrough}>₹{originalPrice}</Text>
            <View style={styles.discountPill}>
              <Text style={styles.discountPillText}>{discountText}</Text>
            </View>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setQty(q => q + 1)}
              style={styles.plusBtn}
            >
              <Text style={styles.plusBtnText}>+</Text>
            </TouchableOpacity>
          </View>

          {/* ── 4 GREEN QUALITY BADGES ── */}
          <View style={styles.qualityBadgesRow}>
            <View style={styles.qualityCard}>
              <Text style={styles.qualityIcon}>🍃</Text>
              <Text style={styles.qualityLabel}>100% Organic</Text>
            </View>

            <View style={styles.qualityCard}>
              <Text style={styles.qualityIcon}>🌿</Text>
              <Text style={styles.qualityLabel}>Residue Free</Text>
            </View>

            <View style={styles.qualityCard}>
              <Text style={styles.qualityIcon}>🧪</Text>
              <Text style={styles.qualityLabel}>Chemical Free</Text>
            </View>

            <View style={styles.qualityCard}>
              <Text style={styles.qualityIcon}>🎖</Text>
              <Text style={styles.qualityLabel}>Farm Verified</Text>
            </View>
          </View>

          {/* ── ABOUT THIS PRODUCT ── */}
          <Text style={styles.sectionTitle}>About this product</Text>
          <Text style={styles.aboutText}>
            Fresh, Crispy and naturally sweet Royal gala apples, sourced directly from TOHFA Certified farmers in the Nilgiris.
          </Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.readMoreLink}>Read More...</Text>
          </TouchableOpacity>

          {/* ── PRODUCT INFORMATION TABLE ── */}
          <Text style={styles.sectionTitle}>Product Information</Text>
          <View style={styles.infoTable}>
            <View style={styles.infoTableRow}>
              <Text style={styles.infoKey}>Origin</Text>
              <Text style={styles.infoVal}>Nilgiris, Tamil Nadu</Text>
            </View>
            <View style={styles.infoTableRow}>
              <Text style={styles.infoKey}>Farming Type</Text>
              <Text style={styles.infoVal}>Organic</Text>
            </View>
            <View style={styles.infoTableRow}>
              <Text style={styles.infoKey}>Harvest Season</Text>
              <Text style={styles.infoVal}>Jun - Sep</Text>
            </View>
            <View style={styles.infoTableRow}>
              <Text style={styles.infoKey}>Shelf Life</Text>
              <Text style={styles.infoVal}>5 - 7 Days (Keep refrigerated)</Text>
            </View>
          </View>

          {/* ── RATINGS & REVIEWS SECTION ── */}
          <Text style={styles.sectionTitle}>Ratings & Reviews</Text>
          <View style={styles.ratingCard}>
            <View style={styles.ratingLeftCol}>
              <View style={styles.bigScoreRow}>
                <Text style={styles.bigScoreNum}>4.6</Text>
                <Text style={styles.bigScoreStar}>★</Text>
              </View>
              <Text style={styles.bigReviewsTotal}>(328 Reviews)</Text>
            </View>

            <View style={styles.ratingDivider} />

            <View style={styles.ratingRightCol}>
              {[
                { star: 5, pct: '72%' },
                { star: 4, pct: '16%' },
                { star: 3, pct: '7%' },
                { star: 2, pct: '3%' },
                { star: 1, pct: '2%' },
              ].map(item => (
                <View key={item.star} style={styles.barItemRow}>
                  <Text style={styles.barStarNumber}>{item.star}</Text>
                  <Text style={styles.barStarGlyph}>★</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: item.pct }]} />
                  </View>
                  <Text style={styles.barPercent}>{item.pct}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Filter Chips Horizontal Row */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipsRow}
          >
            {[
              { id: 'all', label: 'All Reviews (328)' },
              { id: 'photos', label: 'With Photos (56)' },
              { id: '5', label: '5 ★ (236)' },
              { id: '4', label: '4 ★ (52)' },
              { id: '3', label: '3 ★ (23)' },
              { id: '2', label: '2 ★ (10)' },
            ].map(chip => (
              <TouchableOpacity
                key={chip.id}
                style={[
                  styles.filterChip,
                  selectedFilter === chip.id && styles.filterChipActive,
                ]}
                onPress={() => setSelectedFilter(chip.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedFilter === chip.id && styles.filterChipTextActive,
                  ]}
                >
                  {chip.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Customer Reviews List */}
          {/* Review 1 */}
          <View style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <View style={[styles.avatarCircle, { backgroundColor: '#D1E7DD' }]}>
                <Text style={[styles.avatarText, { color: '#0F5132' }]}>R</Text>
              </View>
              <View style={styles.reviewerDetails}>
                <Text style={styles.reviewerName}>Ramya S.</Text>
                <View style={styles.verifiedRow}>
                  <Text style={styles.reviewDate}>15 Jul 2026 · </Text>
                  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M20 6L9 17l-5-5"
                      stroke="#16A34A"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                  <Text style={styles.verifiedText}> Verified Buyer</Text>
                </View>
              </View>
              <View style={styles.starBadgePill}>
                <Text style={styles.starBadgePillText}>5 ★</Text>
              </View>
            </View>

            <Text style={styles.reviewComment}>
              Fresh and good quality vegetables. Packaging was also nice. Will order again.
            </Text>

            <View style={styles.reviewPhotos}>
              <Image
                source={ProductImages.vegPotato}
                style={styles.reviewPhotoThumb}
                resizeMode="cover"
              />
              <Image
                source={ProductImages.vegCarrot}
                style={styles.reviewPhotoThumb}
                resizeMode="cover"
              />
              <Image
                source={ProductImages.herbCoriander}
                style={styles.reviewPhotoThumb}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* Review 2 */}
          <View style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <View style={[styles.avatarCircle, { backgroundColor: '#E9D5FF' }]}>
                <Text style={[styles.avatarText, { color: '#6B21A8' }]}>K</Text>
              </View>
              <View style={styles.reviewerDetails}>
                <Text style={styles.reviewerName}>Karthik M.</Text>
                <View style={styles.verifiedRow}>
                  <Text style={styles.reviewDate}>12 Jul 2026 · </Text>
                  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M20 6L9 17l-5-5"
                      stroke="#16A34A"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                  <Text style={styles.verifiedText}> Verified Buyer</Text>
                </View>
              </View>
              <View style={styles.starBadgePill}>
                <Text style={styles.starBadgePillText}>4 ★</Text>
              </View>
            </View>

            <Text style={styles.reviewComment}>
              Good quality and fresh. Delivery was on time.
            </Text>
          </View>

          {/* Review 3 */}
          <View style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <View style={[styles.avatarCircle, { backgroundColor: '#DBEAFE' }]}>
                <Text style={[styles.avatarText, { color: '#1E40AF' }]}>M</Text>
              </View>
              <View style={styles.reviewerDetails}>
                <Text style={styles.reviewerName}>Meena R.</Text>
                <View style={styles.verifiedRow}>
                  <Text style={styles.reviewDate}>12 Jul 2026 · </Text>
                  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M20 6L9 17l-5-5"
                      stroke="#16A34A"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                  <Text style={styles.verifiedText}> Verified Buyer</Text>
                </View>
              </View>
              <View style={styles.starBadgePill}>
                <Text style={styles.starBadgePillText}>5 ★</Text>
              </View>
            </View>

            <Text style={styles.reviewComment}>
              Very fresh produce, especially the carrots. Highly recommended!
            </Text>

            <View style={styles.reviewPhotos}>
              <Image
                source={ProductImages.vegCarrot}
                style={styles.reviewPhotoThumb}
                resizeMode="cover"
              />
              <Image
                source={ProductImages.herbCoriander}
                style={styles.reviewPhotoThumb}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* Extra bottom scroll spacing */}
          <View style={{ height: 110 }} />
        </View>
      </ScrollView>

      {/* ── FIXED STICKY BOTTOM BAR ── */}
      <View style={styles.fixedBottomBar}>
        <TouchableOpacity
          style={styles.addToCartOutlineBtn}
          onPress={handleAddToCart}
          activeOpacity={0.85}
        >
          <Text style={styles.addToCartOutlineText}>Add to Cart</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buyNowSolidBtn}
          onPress={handleBuyNow}
          activeOpacity={0.85}
        >
          <Text style={styles.buyNowSolidText}>Buy Now</Text>
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
