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
import { EmptyState } from '@tohfa/mobile-ui';
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
      <View style={styles.center}>
        <ActivityIndicator testID="loading-indicator" />
      </View>
    );
  }

  if (isError || !data) {
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
          </View>

          {/* Active Close Badge positioned exactly over the active tab's top-right corner badge */}
          {selectedBannerFilter && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setSelectedBannerFilter(null)}
              style={[
                styles.activeCloseBadge,
                {
                  left:
                    selectedBannerFilter === 'latest_harvest'
                      ? '41.2%'
                      : selectedBannerFilter === 'fresh_drops'
                      ? '67.6%'
                      : '91.0%',
                  top: '61.4%',
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('customer.account.filter.clear')}
            >
              <Svg width={12} height={12} viewBox="0 0 14 14" fill="none">
                <Path d="M3 3L11 11M11 3L3 11" stroke="#15803D" strokeWidth={2.4} strokeLinecap="round" />
              </Svg>
            </TouchableOpacity>
          )}

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
              <EmptyState
                variant="compact"
                iconName="eco"
                title={t('customer.home.empty')}
                action={{ label: t('customer.home.refresh'), onPress: () => void homeQuery.refetch() }}
                testID="home-empty"
              />
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
    backgroundColor: colors.white,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    padding: 16,
  },
  bannerImage: {
    width: 300,
    height: 150,
    borderRadius: 8,
    marginRight: 8,
    marginTop: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  card: {
    padding: 16,
    width: '48%',
  },
});
