import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Animated,
  StatusBar,
  Modal,
  Platform,
  Linking,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import {
  customerColors,
  customerFonts,
} from '../theme';
import { CustomerFloatingNav, type CustomerActiveTab, CustomerDeliveryAddressModal } from '../components';
import { ServiceAreaRequestCard, prefillFromAddress } from '../components/ServiceAreaRequestFlow';
import { useAddresses, pickDefaultAddress, formatAddressShort } from '../api/addresses';
import { useCustomerProfile, displayName, formatMobileDisplay, parseHarvestPreferences } from '../api/profile';
import dashboardBannerHarvest from '../assets/images/dashboard_banner_harvest.png';
import homeBanner from '../assets/images/home-banner.png';
import tohfaMarketLogo from '../assets/images/tohfa_market_logo.png';
import { ProductImages, CategoryImages } from '../assets/images/products';

interface HomeScreenProps {
  onNavigate?: (screen: string, params?: Record<string, unknown>) => void;
}

// ── SVG ICONS FOR LOADING BUFFER (EXACT FIGMA SPEC) ─────────────────────────

const DetailedCeleryHerbIcon = () => (
  <Svg width={36} height={36} viewBox="0 0 36 36" fill="none">
    <Path
      d="M18 31V16M18 24C14 20 10 19 8 16M18 21C22 18 26 17 28 14"
      stroke={customerColors.legacy.greenMid}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
    <Path
      d="M18 16C16 13 14 10 15 7C17 5 19 6 18 9C20 6 23 7 22 10C21 13 19 14 18 16Z"
      stroke={customerColors.legacy.greenMid}
      strokeWidth={1.6}
      strokeLinejoin="round"
      fill={customerColors.palette.green.leafTint}
      fillOpacity={0.6}
    />
    <Path
      d="M8 16C6 14 5 11 7 9C9 8 10 10 10 12C11 9 14 10 13 13C12 15 10 16 8 16Z"
      stroke={customerColors.legacy.greenMid}
      strokeWidth={1.5}
      strokeLinejoin="round"
      fill={customerColors.palette.green.leafTint}
      fillOpacity={0.5}
    />
    <Path
      d="M28 14C30 12 31 9 29 7C27 6 26 8 26 10C25 7 22 8 23 11C24 13 26 14 28 14Z"
      stroke={customerColors.legacy.greenMid}
      strokeWidth={1.5}
      strokeLinejoin="round"
      fill={customerColors.palette.green.leafTint}
      fillOpacity={0.5}
    />
  </Svg>
);

const DetailedOrangeWithSliceIcon = () => (
  <Svg width={46} height={46} viewBox="0 0 46 46" fill="none">
    <Circle cx={19} cy={26} r={14} stroke={customerColors.primary} strokeWidth={2.2} />
    <Path
      d="M19 12C20 8 24 6 28 7C28 11 25 14 21 13"
      stroke={customerColors.primary}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={customerColors.palette.green.sprout}
    />
    <Path d="M21 13L25 9.5" stroke={customerColors.primary} strokeWidth={1.4} strokeLinecap="round" />
    <Path
      d="M25 21C33 22 38 27 37 35C30 36 24 31 25 21Z"
      stroke={customerColors.primary}
      strokeWidth={2.2}
      strokeLinejoin="round"
      fill={customerColors.shared.primaryLight}
    />
    <Path
      d="M27 24C31 25 35 29 34 33M28 27L32 30M30 25L33 28"
      stroke={customerColors.primary}
      strokeWidth={1.5}
      strokeLinecap="round"
    />
  </Svg>
);

const DetailedEggIcon = () => (
  <Svg width={36} height={36} viewBox="0 0 36 36" fill="none">
    <Path
      d="M18 5C13 5 9 12 9 20C9 26 13 31 18 31C23 31 27 26 27 20C27 12 23 5 18 5Z"
      stroke={customerColors.legacy.greenMid}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const TopBarAvatarSvg = ({ color = customerColors.white, size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={1.8} />
    <Path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const TopBarWalletSvg = ({ color = customerColors.white, size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"
      stroke={color}
      strokeWidth={1.8}
    />
    <Path d="M16 3H4a2 2 0 00-2 2v2h18V5a2 2 0 00-2-2z" stroke={color} strokeWidth={1.8} />
    <Circle cx={16.5} cy={13.5} r={1.5} fill={color} />
  </Svg>
);

const TopBarHeartSvg = ({ color = customerColors.white, size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      stroke={color}
      strokeWidth={1.8}
      fill="none"
    />
  </Svg>
);

interface CategoryCircleItem {
  id: string;
  label: string;
  image?: any;
  emoji?: string;
}

const CATEGORY_CIRCLES: CategoryCircleItem[] = [
  { id: 'c1', label: 'Vegetables', image: CategoryImages.vegetables, emoji: '🥦' },
  { id: 'c2', label: 'Fruit', image: CategoryImages.fruit, emoji: '🍎' },
  { id: 'c3', label: 'Dairy', image: CategoryImages.dairy, emoji: '🥛' },
  { id: 'c4', label: 'Grains', image: CategoryImages.grains, emoji: '🌾' },
  { id: 'c5', label: 'Dry Fruits', image: CategoryImages.dryFruits, emoji: '🥜' },
  { id: 'c7', label: 'Breads', image: CategoryImages.breads, emoji: '🍞' },
  { id: 'c8', label: 'Fresh Juices', image: CategoryImages.freshJuices, emoji: '🧃' },
  { id: 'c9', label: 'Everyday Kitchen', image: CategoryImages.everydayKitchen, emoji: '🥣' },
  { id: 'c10', label: 'Rare & Exotic', image: CategoryImages.rareExotic, emoji: '🌽' },
  { id: 'c11', label: 'Flour', image: CategoryImages.flour, emoji: '🥡' },
  { id: 'c12', label: 'Sweet Nature', image: CategoryImages.sweetNature, emoji: '🍯' },
  { id: 'c13', label: 'Herbs & Greens', image: CategoryImages.herbsGreens, emoji: '🌿' },
  { id: 'c14', label: 'Spices', image: CategoryImages.spices, emoji: '🧂' },
  { id: 'c15', label: 'Soaked', image: CategoryImages.soaked, emoji: '🥄' },
  { id: 'c16', label: 'Tea & Coffee', image: CategoryImages.teaCoffee, emoji: '☕' },
  { id: 'c17', label: 'Spreads', image: CategoryImages.spreads, emoji: '🥣' },
  { id: 'c18', label: 'Flowers', image: CategoryImages.flowers, emoji: '🌸' },
];

export function resolveCategoryImage(cat: {
  id?: string;
  name: string;
  slug?: string | null;
  imageUrl?: string | null;
}): { source: any; emoji: string } {
  if (cat.imageUrl) {
    return { source: { uri: cat.imageUrl }, emoji: '🥗' };
  }
  const slugClean = (cat.slug || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const nameClean = (cat.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  const circleMatch = CATEGORY_CIRCLES.find((c) => {
    const cLabelClean = c.label.toLowerCase().replace(/[^a-z0-9]/g, '');
    return (
      (cat.id && c.id === cat.id) ||
      cLabelClean === nameClean ||
      cLabelClean === slugClean ||
      (nameClean.length > 2 && (nameClean.includes(cLabelClean) || cLabelClean.includes(nameClean))) ||
      (slugClean.length > 2 && (slugClean.includes(cLabelClean) || cLabelClean.includes(slugClean)))
    );
  });
  if (circleMatch?.image) {
    return { source: circleMatch.image, emoji: circleMatch.emoji ?? '🥗' };
  }

  const categoryKey = Object.keys(CategoryImages).find((k) => {
    const kClean = k.toLowerCase().replace(/[^a-z0-9]/g, '');
    return (
      kClean === slugClean ||
      kClean === nameClean ||
      (nameClean.length > 2 && (nameClean.includes(kClean) || kClean.includes(nameClean))) ||
      (slugClean.length > 2 && (slugClean.includes(kClean) || kClean.includes(slugClean)))
    );
  }) as keyof typeof CategoryImages | undefined;

  if (categoryKey && CategoryImages[categoryKey]) {
    return { source: CategoryImages[categoryKey], emoji: circleMatch?.emoji ?? '🥗' };
  }

  return { source: null, emoji: circleMatch?.emoji ?? '🥗' };
}

import {
  ProductDetailsModal,
  RatingsReviewsModal,
  CartToast,
  ModalCloseCrossSvg,
} from './ProductModals';
import { useCatalogHome, productKey, type Category, type Product } from '../api/catalog';
import { cartLineCount, useCart } from '../api/cart';
import { useToggleWishlist, useWishlistKeys } from '../api/wishlist';
import { useWalletBalance } from '../api/wallet';
import { ProductCard } from '../components/ProductCard';
import { t } from '../../../i18n/customer';

/** Banner deeplink: `/categories/{id}`, `/products/{id}`, an http(s) URL, or null. */
export function resolveHomeDeeplink(deeplink: string | null | undefined): { screen: string; params?: Record<string, unknown> } | { url: string } | null {
  if (!deeplink) return null;
  const cat = /^\/categories\/([^/?#]+)/.exec(deeplink);
  if (cat) return { screen: 'ProductGrid', params: { categoryId: cat[1] } };
  const prod = /^\/products\/([^/?#]+)/.exec(deeplink);
  if (prod) return { screen: 'ProductDetail', params: { productId: prod[1] } };
  if (/^https?:\/\//.test(deeplink)) return { url: deeplink };
  return null;
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const [activeTab, setActiveTab] = useState<CustomerActiveTab>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  // Delivery address chip + unserved card: default address from the API (BR-160/BR-171).
  const addressesQuery = useAddresses();
  const defaultAddress = pickDefaultAddress(addressesQuery.data);
  const currentDeliveryAddress = defaultAddress ? formatAddressShort(defaultAddress) : t('customer.home.addAddress');
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveryModalStep, setDeliveryModalStep] = useState<'delivery' | 'addAddress'>('delivery');

  // Dynamic user profile for greeting, avatar, and profile modal (BR-190/BR-160).
  const profileQuery = useCustomerProfile();
  const profile = profileQuery.data;
  const resolvedName = displayName(profile);
  const firstName = resolvedName ? resolvedName.split(/\s+/)[0]! : 'Customer';
  const displayPhone = formatMobileDisplay(profile?.mobile);
  const avatarLetter = (resolvedName ? resolvedName.charAt(0) : (profile?.fullName ? profile.fullName.charAt(0) : 'C')).toUpperCase();

  const preferencesList = React.useMemo(() => {
    if (!profile?.harvestPreferences || profile.harvestPreferences.length === 0) {
      return [
        t('customer.home.profile.vegetarian'),
        t('customer.home.profile.highProtein'),
        t('customer.home.profile.pesticideFree'),
      ];
    }
    const { eatingStyles, matters, other } = parseHarvestPreferences(profile.harvestPreferences);
    const all = [...eatingStyles, ...matters, ...other];
    return all.map((slug) =>
      slug
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
    );
  }, [profile?.harvestPreferences]);

  // Server data: catalog home (rails, categories, banners), cart bar, wishlist hearts, wallet.
  const homeQuery = useCatalogHome();
  const cartQuery = useCart();
  const wishlistKeys = useWishlistKeys();
  const toggleWishlist = useToggleWishlist();
  const wallet = useWalletBalance();
  const cart = cartQuery.data;
  const cartCount = cartLineCount(cart);
  const isLoadingBuffer = homeQuery.isLoading;
  const home = homeQuery.data;
  const featured = home?.featured ?? [];
  const sections = (home?.sections ?? []).filter((s) => s.items.length > 0);
  const homeCategories: Category[] = home?.categories ?? [];
  const heroBanners = home?.heroBanners ?? [];
  const catalogEmpty = !!home && featured.length === 0 && sections.length === 0;

  const scrollY = useRef(new Animated.Value(0)).current;

  // The address list query is invalidated by the create mutation; the unserved card follows it.
  const handleSaveAddress = () => {
    setShowDeliveryModal(false);
  };
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [selectedProductForReviews, setSelectedProductForReviews] = useState<Product | null>(null);
  const [selectedBannerFilter, setSelectedBannerFilter] = useState<'latest_harvest' | 'fresh_drops' | 'recent_orders' | null>('latest_harvest');

  const handleToggleBannerFilter = (filter: 'latest_harvest' | 'fresh_drops' | 'recent_orders') => {
    setSelectedBannerFilter((prev) => (prev === filter ? null : filter));
  };

  const allHomeProducts = useMemo(() => {
    const list: Product[] = [...featured];
    for (const sec of sections) {
      for (const item of sec.items) {
        if (!list.some((p) => p.id === item.id && p.grade === item.grade)) {
          list.push(item);
        }
      }
    }
    return list;
  }, [featured, sections]);

  const filteredBannerProducts = useMemo(() => {
    if (!selectedBannerFilter) return [];
    if (selectedBannerFilter === 'latest_harvest') {
      return allHomeProducts.slice(0, 10);
    }
    if (selectedBannerFilter === 'fresh_drops') {
      const categoryNames = new Map(homeCategories.map((c) => [c.id, c.name]));
      const fresh = allHomeProducts.filter((p) => {
        const cat = (categoryNames.get(p.categoryId) ?? '').toLowerCase();
        return cat.includes('veg') || cat.includes('fruit') || cat.includes('fresh');
      });
      return fresh.length > 0 ? fresh : allHomeProducts.slice(0, 10);
    }
    return allHomeProducts.slice(-10).reverse();
  }, [selectedBannerFilter, allHomeProducts, homeCategories]);

  const cartThumbnails = useMemo(() => {
    if (!cart?.items || cart.items.length === 0) return [];
    return cart.items.slice(0, 2).map((item) => {
      const matched = allHomeProducts.find((p) => p.id === item.productId);
      if (matched?.photos?.[0]) {
        return { uri: matched.photos[0] };
      }
      const name = (item.name || '').toLowerCase();
      if (name.includes('strawberr')) return ProductImages.foryouStrawberries;
      if (name.includes('watermel')) return ProductImages.foryouWatermelon;
      if (name.includes('apple')) return ProductImages.fruitApple;
      if (name.includes('banana')) return ProductImages.fruitBanana;
      if (name.includes('carrot')) return ProductImages.vegCarrot;
      if (name.includes('potato')) return ProductImages.vegPotato;
      if (name.includes('tomato')) return ProductImages.exoticCherryTomato;
      return null;
    });
  }, [cart?.items, allHomeProducts]);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const handleTabChange = (tab: CustomerActiveTab) => {
    setActiveTab(tab);
    if (tab === 'cart') {
      onNavigate?.('Cart');
    } else if (tab === 'profile') {
      onNavigate?.('CustomerAccount');
    } else if (tab === 'search') {
      onNavigate?.('Search');
    }
  };

  const openBanner = (deeplink: string | null) => {
    const target = resolveHomeDeeplink(deeplink);
    if (!target) return;
    if ('url' in target) {
      void Linking.openURL(target.url);
    } else {
      onNavigate?.(target.screen, target.params);
    }
  };

  // Shared server-driven product card (components/ProductCard.tsx); key = `${id}:${grade}`.
  const renderProductCard = (item: Product) => {
    const key = productKey(item);
    const isFav = wishlistKeys.has(key);
    return (
      <ProductCard
        key={key}
        product={item}
        variant="rail"
        wishlisted={isFav}
        onPress={() => setSelectedProductForModal(item)}
        onPressRating={() => setSelectedProductForReviews(item)}
        onToggleWishlist={() => toggleWishlist.mutate({ productId: item.id, grade: item.grade, add: !isFav, product: item })}
      />
    );
  };

  // Coming Soon Card at the end of each section's horizontal carousel
  const renderComingSoonCard = (keyPrefix: string) => (
    <View key={`${keyPrefix}-coming-soon`} style={styles.productCardContainer}>
      <View style={[styles.productCard, styles.comingSoonCard]}>
        <Image
          source={ProductImages.cardComingSoon}
          style={styles.comingSoonImage}
          resizeMode="contain"
        />
      </View>
      <View style={{ height: 20 }} />
    </View>
  );

  // Reusable Section Header matching Figma: centered editorial title, corner floating deco badge
  const renderSectionHeader = (
    title: string,
    badgeImage?: any,
    floatPosition: 'left' | 'right' = 'right'
  ) => (
    <View style={styles.sectionHeaderWrap}>
      {badgeImage && floatPosition === 'left' && (
        <View style={[styles.floatingDecoBadge, styles.floatLeft]}>
          <Image
            source={badgeImage}
            style={styles.floatingDecoImage}
            resizeMode="contain"
          />
        </View>
      )}
      <Text style={styles.sectionEditorialTitle}>{title}</Text>
      {badgeImage && floatPosition === 'right' && (
        <View style={[styles.floatingDecoBadge, styles.floatRight]}>
          <Image
            source={badgeImage}
            style={styles.floatingDecoImage}
            resizeMode="contain"
          />
        </View>
      )}
    </View>
  );

  const stickyHeaderOpacity = scrollY.interpolate({
    inputRange: [30, 80],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── STICKY COMPACT TOP NAVBAR (SHOWN ONLY WHEN SCROLLED DOWN - EXACT FIGMA SCREEN 25) ── */}
      <Animated.View
        style={[
          styles.stickyHeaderContainer,
          { opacity: stickyHeaderOpacity },
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.stickyHeaderTopRow}>
          {/* User profile avatar and location */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onNavigate?.('CustomerAccount')}
            style={styles.stickyProfileBtn}
            accessibilityLabel={t('customer.home.a11y.openProfile')}
          >
            <View style={styles.stickyAvatarCircle}>
              <TopBarAvatarSvg color={customerColors.white} size={18} />
            </View>
            <View style={styles.stickyProfileTexts}>
              <Text style={styles.stickyUserName}>{t('customer.home.greeting', { name: firstName })}</Text>
              <Text style={styles.stickyUserLocation} numberOfLines={1}>{currentDeliveryAddress}</Text>
            </View>
          </TouchableOpacity>

          {/* Right action circular buttons: Wallet & Wishlist */}
          <View style={styles.stickyRightActions}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowWalletModal(true)}
              style={styles.stickyCircleBtn}
              accessibilityLabel={t('customer.home.a11y.wallet')}
            >
              <TopBarWalletSvg color={customerColors.white} size={18} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onNavigate?.('Wishlist')}
              style={styles.stickyCircleBtn}
              accessibilityLabel={t('customer.home.a11y.wishlist')}
            >
              <TopBarHeartSvg color={customerColors.white} size={18} />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* ── 1. TOP HEADER BANNER (390 x 290 HUG - EXACT FIGMA IMAGE 1) ─────── */}
        <View style={styles.bannerContainer}>
          <Image
            source={dashboardBannerHarvest}
            style={styles.bannerImage}
            resizeMode="cover"
          />

          <View style={styles.bannerOverlay} pointerEvents="box-none">
            <View style={styles.bannerTopRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onNavigate?.('CustomerAccount')}
                style={styles.bannerProfileBtn}
                accessibilityLabel={t('customer.home.a11y.openProfile')}
              >
                <View style={styles.stickyAvatarCircle}>
                  <TopBarAvatarSvg color={customerColors.white} size={18} />
                </View>
                <View style={styles.stickyProfileTexts}>
                  <Text style={styles.stickyUserName}>{t('customer.home.greeting', { name: firstName })}</Text>
                  <Text style={styles.stickyUserLocation} numberOfLines={1}>{currentDeliveryAddress}</Text>
                </View>
              </TouchableOpacity>
              <View style={styles.topRightActions}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => onNavigate?.('CustomerWallet')}
                  style={styles.circleTouchTarget}
                  accessibilityLabel={t('customer.home.a11y.wallet')}
                />
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => onNavigate?.('Wishlist')}
                  style={styles.circleTouchTarget}
                  accessibilityLabel={t('customer.home.a11y.wishlist')}
                />
              </View>
            </View>

            {/* 3 Circular Category Filter Touch Targets */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleToggleBannerFilter('latest_harvest')}
              style={styles.circleTouch1}
              accessibilityRole="button"
              accessibilityLabel={t('customer.home.a11y.latestHarvest')}
            />
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleToggleBannerFilter('fresh_drops')}
              style={styles.circleTouch2}
              accessibilityRole="button"
              accessibilityLabel={t('customer.home.a11y.freshDrops')}
            />
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleToggleBannerFilter('recent_orders')}
              style={styles.circleTouch3}
              accessibilityRole="button"
              accessibilityLabel={t('customer.home.a11y.recentOrders')}
            />

            {/* Active Close Badge positioned exactly over the corner badge */}
            {selectedBannerFilter && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSelectedBannerFilter(null)}
                style={[
                  styles.activeCloseBadge,
                  {
                    left:
                      selectedBannerFilter === 'latest_harvest'
                        ? '44.0%'
                        : selectedBannerFilter === 'fresh_drops'
                        ? '68.8%'
                        : '91.4%',
                    top: '69.0%',
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={t('customer.account.filter.clear')}
              >
                <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
                  <Path d="M4.5 4.5L13.5 13.5M13.5 4.5L4.5 13.5" stroke={customerColors.neutral.neutral900} strokeWidth={2} strokeLinecap="round" />
                </Svg>
              </TouchableOpacity>
            )}
          </View>

          {/* Active filter notch pointing into banner from content below */}
          {selectedBannerFilter && (
            <View
              style={[
                styles.bannerNotchWrap,
                {
                  left:
                    selectedBannerFilter === 'latest_harvest'
                      ? '36.28%'
                      : selectedBannerFilter === 'fresh_drops'
                      ? '64.23%'
                      : '81.79%',
                },
              ]}
              pointerEvents="none"
            >
              <Svg width={24} height={12} viewBox="0 0 24 12">
                <Path d="M0 12 L12 0 L24 12 Z" fill={customerColors.palette.warm.stone} />
              </Svg>
            </View>
          )}
        </View>

        {/* ── 2. LOADING BUFFER WHEN OPENING (FIGMA IMAGE 2: 254 x 130 HUG) ─── */}
        {isLoadingBuffer && (
          <Animated.View style={styles.loadingBufferBox} testID="home-loading">
            <View style={styles.cardsRow}>
              <View style={styles.sideCard}>
                <DetailedCeleryHerbIcon />
              </View>
              <Animated.View style={[styles.centerActiveCard, { transform: [{ scale: pulseAnim }] }]}>
                <DetailedOrangeWithSliceIcon />
              </Animated.View>
              <View style={styles.sideCard}>
                <DetailedEggIcon />
              </View>
            </View>
            <Text style={styles.loadingText}>{t('customer.home.loadingMarket')}</Text>
          </Animated.View>
        )}

        {/* ── 3. FULL SCROLLABLE DASHBOARD SECTIONS (FIGMA EXACT FLOW) ──────── */}
        {!isLoadingBuffer && (
          <View style={styles.catalogSectionsWrap}>
            {/* ── SEARCH BAR (FIGMA EXACT HOME SEARCH) ────────────────────── */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => onNavigate?.('Search')}
              style={styles.homeSearchBar}
              accessibilityRole="button"
              accessibilityLabel={t('customer.account.help.searchPlaceholder') || 'Search...'}
            >
              <Text style={styles.homeSearchPlaceholder}>
                {t('customer.account.help.searchPlaceholder') || 'Search...'}
              </Text>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
                  stroke={customerColors.neutral.neutral600}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>

            {/* ── FILTERED BANNER RAIL (SHOWN WHEN ACTIVE) ────────────────── */}
            {selectedBannerFilter && (
              <View style={[styles.sectionWrap, styles.forYouSectionWrap]}>
                {renderSectionHeader(
                  selectedBannerFilter === 'latest_harvest'
                    ? t('catalog.grid.latestHarvest') || 'Latest Harvest'
                    : selectedBannerFilter === 'fresh_drops'
                    ? t('customer.home.a11y.freshDrops') || 'Fresh Drops'
                    : t('customer.home.a11y.recentOrders') || 'Recent Orders'
                )}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.cardsHorizontalScroll}
                >
                  {filteredBannerProducts.map(renderProductCard)}
                </ScrollView>
              </View>
            )}
            {/* ── SECTION 2: WE'RE NOT IN YOUR AREA YET CARD (FIGMA EXACT) ───── */}
            {/* Shown only when the default address pincode is unserved (components/ServiceAreaRequestFlow.tsx). */}
            <ServiceAreaRequestCard
              pincode={defaultAddress?.pincode}
              prefill={prefillFromAddress(defaultAddress)}
            />

            {/* ── SECTION 3: FRESH FINDS FOR YOU (CATEGORY CIRCLES, GET /catalog/home categories) ── */}
            {homeCategories.length > 0 && (
              <View style={styles.sectionWrap}>
                <Text style={styles.sectionEditorialTitle}>{t('customer.home.freshFinds')}</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryCirclesRow}
                >
                  {homeCategories.map((cat) => {
                    const resolved = resolveCategoryImage(cat);
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        testID={`home-category-${cat.id}`}
                        activeOpacity={0.75}
                        onPress={() => onNavigate?.('ProductGrid', { categoryId: cat.id, title: cat.name })}
                        style={styles.categoryCircleItem}
                      >
                        <View style={styles.categoryCircleOuter}>
                          {resolved.source ? (
                            <Image
                              source={resolved.source}
                              style={styles.categoryCircleImg}
                              resizeMode="cover"
                            />
                          ) : (
                            <Text style={styles.categoryCircleEmoji}>{resolved.emoji}</Text>
                          )}
                        </View>
                        <Text style={styles.categoryCircleLabel}>{cat.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* ── SECTION 4: PROMO BANNER (FARM FRESH VEGETABLES - FIGMA SPEC) ─── */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => onNavigate?.('Search', { query: 'Vegetables' })}
              style={styles.promoBannerWrap}
              accessibilityLabel={t('customer.catalog.home.shopVegetables')}
              testID="home-promo-banner-farm-fresh"
            >
              <Image
                source={homeBanner}
                style={styles.promoBannerImage}
                resizeMode="cover"
              />
            </TouchableOpacity>

            {/* Dynamic server heroBanners (if any valid active remote banners are configured) */}
            {heroBanners.filter((b) => b.imageUrl && !b.imageUrl.includes('cdn.tohfa.in')).length > 0 && (
              <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
                {heroBanners
                  .filter((b) => b.imageUrl && !b.imageUrl.includes('cdn.tohfa.in'))
                  .map((b) => (
                    <TouchableOpacity
                      key={b.id}
                      activeOpacity={0.9}
                      style={styles.promoBannerWrap}
                      onPress={() => openBanner(b.deeplink)}
                      disabled={!b.deeplink}
                      accessibilityLabel={b.title ?? t('customer.home.a11y.banner')}
                      testID={`home-banner-${b.id}`}
                    >
                      <Image source={{ uri: b.imageUrl }} style={styles.promoBannerImage} resizeMode="cover" />
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            )}

            {homeQuery.isError && (
              <View style={styles.sectionWrap} testID="home-error">
                <Text style={styles.sectionEditorialTitle}>{t('customer.home.loadError')}</Text>
                <TouchableOpacity activeOpacity={0.85} onPress={() => void homeQuery.refetch()} style={styles.profileActionBtn}>
                  <Text style={styles.profileActionText}>{t('customer.common.retry')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {catalogEmpty && (
              <View style={styles.sectionWrap} testID="home-empty">
                <Text style={styles.sectionEditorialTitle}>{t('customer.home.empty')}</Text>
                <TouchableOpacity activeOpacity={0.85} onPress={() => void homeQuery.refetch()} style={styles.profileActionBtn}>
                  <Text style={styles.profileActionText}>{t('customer.home.refresh')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── SECTION 5: "FOR YOU" CAROUSEL (featured) ───────────────────── */}
            {featured.length > 0 && (
              <View style={[styles.sectionWrap, styles.forYouSectionWrap]}>
                {renderSectionHeader(t('customer.home.forYou'))}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.cardsHorizontalScroll}
                >
                  {featured.map(renderProductCard)}
                  {renderComingSoonCard('foryou')}
                </ScrollView>
              </View>
            )}

            {/* ── ADMIN-CURATED RAILS (sections, BR-152) ─────────────────────── */}
            {sections.map((section) => (
              <View key={section.id} style={styles.sectionWrap} testID={`home-section-${section.id}`}>
                {renderSectionHeader(section.title)}
                {!!section.subtitle && <Text style={styles.footerSubtitle}>{section.subtitle}</Text>}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.cardsHorizontalScroll}
                >
                  {section.items.map(renderProductCard)}
                  {renderComingSoonCard(section.id)}
                </ScrollView>
              </View>
            ))}

            {/* ── 24. FOOTER BRANDING CARD (EXACT FIGMA SPEC: IMAGE 5) ──────── */}
            <View style={styles.footerBrandingCard}>
              <View style={styles.footerLogoRow}>
                <Image
                  source={tohfaMarketLogo}
                  style={styles.footerLogoImage}
                  resizeMode="contain"
                />
                <View style={styles.footerGoldenLine} />
              </View>
              <Text style={styles.footerSubtitle}>
                {t('customer.home.footer')}
              </Text>
            </View>
          </View>
        )}
      </Animated.ScrollView>

      {/* ── FLOATING DYNAMIC NAVIGATION (EXACT FIGMA SPEC: 60 Hug x 246) ───── */}
      <CustomerFloatingNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        cartBadgeCount={cartCount}
      />

      {/* ── PROFILE MODAL ──────────────────────────────────────────────────── */}
      <Modal visible={showProfileModal} transparent={true} animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.profileCard}>
            <TouchableOpacity
              style={styles.floatingModalCloseBtn}
              activeOpacity={0.8}
              onPress={() => setShowProfileModal(false)}
              accessibilityLabel={t('customer.common.close')}
            >
              <ModalCloseCrossSvg size={13} color={customerColors.neutral.neutral900} />
            </TouchableOpacity>
            <View style={styles.profileHeader}>
              <View style={styles.profileAvatarLarge}>
                <Text style={styles.profileAvatarText}>{avatarLetter}</Text>
              </View>
              <View style={styles.profileHeaderText}>
                <Text style={styles.profileName}>{resolvedName || t('customer.catalog.home.customerFallback')}</Text>
                {displayPhone ? <Text style={styles.profilePhone}>{displayPhone}</Text> : null}
                <Text style={styles.profileAddress}>{currentDeliveryAddress}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowProfileModal(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.profileDivider} />

            <View style={styles.profileSection}>
              <Text style={styles.profileSectionTitle}>{t('customer.home.profile.preferences')}</Text>
              <View style={styles.prefBadgesRow}>
                {preferencesList.map((pref, idx) => (
                  <View key={`${pref}-${idx}`} style={styles.prefBadge}>
                    <Text style={styles.prefBadgeText}>{pref}</Text>
                  </View>
                ))}
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                setShowProfileModal(false);
                onNavigate?.('Cart');
              }}
              style={styles.profileActionBtn}
            >
              <Text style={styles.profileActionText}>{t('customer.home.profile.viewCart', { count: cartCount })}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                setShowProfileModal(false);
                onNavigate?.('SignOut');
              }}
              style={[styles.profileActionBtn, styles.profileSignOutBtn]}
            >
              <Text style={[styles.profileActionText, { color: customerColors.legacy.red }]}>{t('customer.auth.logout')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── WALLET MODAL ───────────────────────────────────────────────────── */}
      <Modal visible={showWalletModal} transparent={true} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.walletCard}>
            <TouchableOpacity
              style={styles.floatingModalCloseBtn}
              activeOpacity={0.8}
              onPress={() => setShowWalletModal(false)}
              accessibilityLabel={t('customer.common.close')}
            >
              <ModalCloseCrossSvg size={13} color={customerColors.neutral.neutral900} />
            </TouchableOpacity>
            <Text style={styles.walletTitle}>{t('customer.home.wallet.title')}</Text>
            <Text style={styles.walletBalance}>{wallet.isLoading ? '…' : wallet.label}</Text>
            <Text style={styles.walletSubtitle}>{t('customer.home.wallet.subtitle')}</Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setShowWalletModal(false)}
              style={styles.walletDoneBtn}
            >
              <Text style={styles.walletDoneText}>{t('customer.common.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── ADD-TO-CART POPUP (grades as varieties, POST /cart/items) ─────── */}
      <ProductDetailsModal
        visible={!!selectedProductForModal}
        product={selectedProductForModal}
        onClose={() => setSelectedProductForModal(null)}
        onOpenProduct={(productId, grade) => {
          setSelectedProductForModal(null);
          onNavigate?.('ProductDetail', { productId, grade });
        }}
      />

      {/* ── RATINGS & REVIEWS MODAL (GET /catalog/products/{id}/reviews) ───── */}
      <RatingsReviewsModal
        visible={!!selectedProductForReviews}
        productId={selectedProductForReviews?.id ?? null}
        grade={selectedProductForReviews?.grade}
        onClose={() => setSelectedProductForReviews(null)}
        onWriteReview={() => {
          setSelectedProductForReviews(null);
          onNavigate?.('OrderHistory');
        }}
      />

      {/* ── CART BAR (server cart: line count + subtotal; hidden when empty or search active) ── */}
      <CartToast
        visible={cartCount > 0 && activeTab !== 'search'}
        itemCount={cartCount}
        totalPrice={cart?.subtotal ?? '0.00'}
        thumbnails={cartThumbnails}
        hasFab={true}
        onViewCart={() => {
          onNavigate?.('Cart');
        }}
      />

      {/* ── DELIVERY ADDRESS FLOW (WHERE SHOULD WE DELIVER & ADD ADDRESS POPUP) ── */}
      <CustomerDeliveryAddressModal
        visible={showDeliveryModal}
        initialStep={deliveryModalStep}
        onClose={() => setShowDeliveryModal(false)}
        onSaveAddress={handleSaveAddress}
        onUseCurrentLocation={() => {
          setShowDeliveryModal(false);
          onNavigate?.('CustomerAddAddress', { addressSource: 'current' });
        }}
        onSelectManualLocation={() => {
          setDeliveryModalStep('addAddress');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: customerColors.palette.warm.stone,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },

  // ── STICKY COMPACT TOP NAVBAR (EXACT FIGMA SPEC: SCREEN 25) ─────────────
  stickyHeaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'android' ? 96 : 94,
    backgroundColor: customerColors.palette.green.blackGreen,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    zIndex: 90,
    elevation: 8,
    shadowColor: customerColors.neutral.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    paddingTop: Platform.OS === 'android' ? 24 : 34,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  stickyHeaderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
  },
  stickyProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stickyAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: customerColors.overlay.white10,
  },
  stickyProfileTexts: {
    justifyContent: 'center',
  },
  stickyUserName: {
    fontFamily: customerFonts.bold,
    fontSize: 15,
    color: customerColors.white,
    letterSpacing: 0.2,
  },
  stickyUserLocation: {
    fontFamily: customerFonts.regular,
    fontSize: 11,
    color: customerColors.palette.green.moss,
    marginTop: 1,
  },
  stickyRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stickyCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    backgroundColor: customerColors.overlay.white10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── 1. TOP BANNER (390 x 290 HUG - FIGMA IMAGE 1) ─────────────────────────
  bannerContainer: {
    width: '100%',
    aspectRatio: 780 / 580,
    position: 'relative',
    backgroundColor: customerColors.palette.green.midnight,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 4 : 8,
    paddingHorizontal: 16,
  },
  bannerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 54,
  },
  bannerProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: 220,
  },
  topRightActions: {
    flexDirection: 'row',
    gap: 12,
  },
  circleTouchTarget: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  circleTouch1: {
    position: 'absolute',
    left: '20.8%',
    top: '46.0%',
    width: '25.0%',
    height: '38.0%',
    zIndex: 15,
  },
  circleTouch2: {
    position: 'absolute',
    left: '46.4%',
    top: '46.0%',
    width: '25.0%',
    height: '38.0%',
    zIndex: 15,
  },
  circleTouch3: {
    position: 'absolute',
    left: '70.8%',
    top: '46.0%',
    width: '25.0%',
    height: '38.0%',
    zIndex: 15,
  },
  activeCloseBadge: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: customerColors.white,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -19 }, { translateY: -19 }],
    elevation: 6,
    shadowColor: customerColors.neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    zIndex: 30,
  },
  bannerNotchWrap: {
    position: 'absolute',
    bottom: 0,
    width: 24,
    height: 12,
    transform: [{ translateX: -12 }],
    zIndex: 25,
  },
  homeSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: customerColors.white,
    borderWidth: 1,
    borderColor: customerColors.neutral.neutral300,
    borderRadius: 24,
    height: 48,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
    paddingHorizontal: 18,
    shadowColor: customerColors.neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  homeSearchPlaceholder: {
    fontFamily: customerFonts.regular,
    fontSize: 15,
    color: customerColors.neutral.neutral500,
  },

  // ── 2. LOADING BUFFER (254 x 130 HUG - FIGMA IMAGE 2) ────────────────────
  loadingBufferBox: {
    width: 254,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 64,
    marginBottom: 40,
  },
  cardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginBottom: 18,
  },
  sideCard: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: customerColors.overlay.mintVeil45,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.35,
  },
  centerActiveCard: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: customerColors.shared.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: customerColors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  loadingText: {
    fontFamily: customerFonts.regular,
    fontSize: 16,
    color: customerColors.neutral.neutral900,
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  // ── 3. FULL CATALOG SECTIONS ──────────────────────────────────────────────
  catalogSectionsWrap: {
    paddingTop: 16,
  },

  // Section 3: "Fresh Finds for You" Category Circles
  sectionWrap: {
    marginBottom: 24,
  },
  forYouSectionWrap: {
    backgroundColor: customerColors.palette.amber.ivory,
    paddingVertical: 14,
    marginBottom: 24,
  },
  sectionHeaderWrap: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    minHeight: 44,
  },
  sectionEditorialTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 22,
    color: customerColors.neutral.neutral900,
    textAlign: 'center',
  },
  floatingDecoBadge: {
    position: 'absolute',
    top: -20,
    zIndex: 2,
  },
  floatLeft: {
    left: 4,
  },
  floatRight: {
    right: 4,
  },
  floatingDecoImage: {
    width: 82,
    height: 86,
  },
  categoryCirclesRow: {
    paddingHorizontal: 16,
    gap: 16,
  },
  categoryCircleItem: {
    alignItems: 'center',
    width: 72,
  },
  categoryCircleOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: customerColors.white,
    borderWidth: 1,
    borderColor: customerColors.neutral.neutral300,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    elevation: 2,
    shadowColor: customerColors.neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  categoryCircleImg: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  categoryCircleEmoji: {
    fontSize: 32,
  },
  categoryCircleLabel: {
    fontFamily: customerFonts.regular,
    fontSize: 12,
    color: customerColors.neutral.neutral800,
    textAlign: 'center',
  },

  // Section 4: Promo Banner (Farm Fresh Vegetables)
  promoBannerWrap: {
    alignSelf: 'center',
    width: '92%',
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    aspectRatio: 1024 / 572,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoBannerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },

  // ── PRODUCT CARDS CAROUSEL (390 x 210 HUG - FIGMA IMAGES 4 & 5) ───────────
  cardsHorizontalScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  productCardContainer: {
    width: 142,
    alignItems: 'center',
  },
  productCard: {
    width: 142,
    height: 168,
    backgroundColor: customerColors.white,
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: customerColors.neutral.neutral100,
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: customerColors.neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  // Green shaded background for ordered products (Exact Image 4)
  productCardOrdered: {
    backgroundColor: customerColors.palette.green.celadon,
    borderColor: customerColors.palette.green.jade,
  },
  comingTomorrowBadge: {
    position: 'absolute',
    zIndex: 10,
    backgroundColor: customerColors.legacy.greenDark,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: customerColors.neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  comingTomorrowText: {
    color: customerColors.white,
    fontSize: 10.5,
    fontWeight: '700',
    fontFamily: customerFonts.bold,
  },
  cardComingTomorrow: {
    backgroundColor: customerColors.palette.green.sage,
    borderColor: customerColors.palette.green.sageDeep,
  },
  cardUnsalable: {
    backgroundColor: customerColors.neutral.neutral400,
    borderColor: customerColors.palette.slate.line,
  },
  badgeComingTomorrow: {
    position: 'absolute',
    backgroundColor: customerColors.legacy.greenPine,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'center',
    zIndex: 5,
  },
  badgeComingTomorrowText: {
    color: customerColors.white,
    fontSize: 10,
    fontFamily: customerFonts.regular,
  },
  badgeUnsalable: {
    position: 'absolute',
    backgroundColor: 'rgba(75, 85, 99, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'center',
    zIndex: 5,
  },
  badgeUnsalableText: {
    color: customerColors.white,
    fontSize: 10,
    fontFamily: customerFonts.regular,
  },
  comingSoonCard: {
    backgroundColor: customerColors.neutral.neutral50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comingSoonImage: {
    width: 114,
    height: 128,
  },
  cardHeaderRow: {
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
    color: customerColors.legacy.amber,
  },
  ratingText: {
    fontFamily: customerFonts.bold,
    fontSize: 11,
    color: customerColors.neutral.neutral900,
  },
  heartButton: {
    padding: 2,
  },
  cardImageCenter: {
    height: 82,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productCardImage: {
    width: 104,
    height: 80,
  },
  productEmoji: {
    fontSize: 48,
  },
  cardPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-start',
  },
  priceBold: {
    fontFamily: customerFonts.bold,
    fontSize: 13,
    color: customerColors.neutral.neutral950,
    marginRight: 6,
  },
  priceStrikethrough: {
    fontFamily: customerFonts.regular,
    fontSize: 11,
    color: customerColors.neutral.neutral500,
    textDecorationLine: 'line-through',
    marginRight: 'auto',
  },
  unitText: {
    fontFamily: customerFonts.regular,
    fontSize: 11,
    color: customerColors.neutral.neutral600,
  },
  cardProductName: {
    fontFamily: customerFonts.regular,
    fontSize: 12,
    color: customerColors.neutral.neutral800,
    marginTop: 6,
    textAlign: 'center',
    width: 140,
  },

  // ── 24. FOOTER BRANDING CARD (EXACT 350 x 246 HUG FROM FIGMA) ─────────────
  footerBrandingCard: {
    width: '92%',
    maxWidth: 350,
    alignSelf: 'center',
    backgroundColor: customerColors.white,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: customerColors.palette.slate.cloud,
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginTop: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: customerColors.neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  footerLogoRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  footerLogoImage: {
    width: 125,
    height: 48,
  },
  footerGoldenLine: {
    flex: 1,
    height: 3.5,
    backgroundColor: customerColors.palette.amber.honey,
    marginLeft: 16,
    marginBottom: 8,
    borderRadius: 2,
  },
  footerSubtitle: {
    fontFamily: customerFonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: customerColors.neutral.neutral700,
    textAlign: 'left',
  },

  // ── MODAL STYLES ──────────────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: customerColors.overlay.scrim45,
    justifyContent: 'flex-end',
  },
  profileCard: {
    backgroundColor: customerColors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    position: 'relative',
    overflow: 'visible',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatarLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: customerColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  profileAvatarText: {
    color: customerColors.white,
    fontSize: 22,
    fontWeight: '700',
  },
  profileHeaderText: {
    flex: 1,
  },
  profileName: {
    fontFamily: customerFonts.editorial,
    fontSize: 22,
    color: customerColors.neutral.neutral900,
  },
  profilePhone: {
    fontFamily: customerFonts.regular,
    fontSize: 13,
    color: customerColors.neutral.neutral600,
    marginTop: 2,
  },
  profileAddress: {
    fontFamily: customerFonts.regular,
    fontSize: 12,
    color: customerColors.neutral.neutral500,
    marginTop: 1,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 18,
    color: customerColors.neutral.neutral600,
  },
  profileDivider: {
    height: 1,
    backgroundColor: customerColors.neutral.neutral100,
    marginVertical: 18,
  },
  profileSection: {
    marginBottom: 20,
  },
  profileSectionTitle: {
    fontFamily: customerFonts.bold,
    fontSize: 14,
    color: customerColors.neutral.neutral900,
    marginBottom: 8,
  },
  prefBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  prefBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: customerColors.neutral.neutral100,
  },
  prefBadgeText: {
    fontSize: 12,
    color: customerColors.neutral.neutral800,
    fontFamily: customerFonts.regular,
  },
  profileActionBtn: {
    backgroundColor: customerColors.shared.primaryLight,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  profileActionText: {
    fontFamily: customerFonts.bold,
    fontSize: 14,
    color: customerColors.brand,
  },
  profileSignOutBtn: {
    backgroundColor: customerColors.palette.red.blush,
  },
  floatingModalCloseBtn: {
    position: 'absolute',
    top: -14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: customerColors.white,
    borderWidth: 1,
    borderColor: customerColors.neutral.neutral300,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    elevation: 4,
    shadowColor: customerColors.neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  walletCard: {
    backgroundColor: customerColors.white,
    borderRadius: 20,
    marginHorizontal: 32,
    marginBottom: 200,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  walletTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 22,
    color: customerColors.neutral.neutral900,
    marginBottom: 6,
  },
  walletBalance: {
    fontFamily: customerFonts.bold,
    fontSize: 32,
    color: customerColors.brand,
    marginVertical: 12,
  },
  walletSubtitle: {
    fontFamily: customerFonts.regular,
    fontSize: 12,
    color: customerColors.neutral.neutral600,
    textAlign: 'center',
    marginBottom: 20,
  },
  walletDoneBtn: {
    backgroundColor: customerColors.brand,
    paddingHorizontal: 36,
    paddingVertical: 10,
    borderRadius: 20,
  },
  walletDoneText: {
    color: customerColors.white,
    fontFamily: customerFonts.bold,
    fontSize: 14,
  },
});
