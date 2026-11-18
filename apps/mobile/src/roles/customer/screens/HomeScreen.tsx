import React, { useState, useEffect, useRef } from 'react';
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
import { NotificationBell } from '../components/NotificationBell';
import { CustomerFloatingNav, type CustomerActiveTab, CustomerDeliveryAddressModal } from '../components';
import { ServiceAreaRequestCard, prefillFromAddress } from '../components/ServiceAreaRequestFlow';
import { useAddresses, pickDefaultAddress, formatAddressShort } from '../api/addresses';
import dashboardBannerHarvest from '../assets/images/dashboard_banner_harvest.png';
import bannerFarmFreshVegetables from '../assets/images/banner_farm_fresh_vegetables.png';
import tohfaMarketLogo from '../assets/images/tohfa_market_logo.png';
import { ProductImages } from '../assets/images/products';

interface HomeScreenProps {
  onNavigate?: (screen: string, params?: Record<string, unknown>) => void;
}

// ── SVG ICONS FOR LOADING BUFFER (EXACT FIGMA SPEC) ─────────────────────────

const DetailedCeleryHerbIcon = () => (
  <Svg width={36} height={36} viewBox="0 0 36 36" fill="none">
    <Path
      d="M18 31V16M18 24C14 20 10 19 8 16M18 21C22 18 26 17 28 14"
      stroke="#4CAF50"
      strokeWidth={1.8}
      strokeLinecap="round"
    />
    <Path
      d="M18 16C16 13 14 10 15 7C17 5 19 6 18 9C20 6 23 7 22 10C21 13 19 14 18 16Z"
      stroke="#4CAF50"
      strokeWidth={1.6}
      strokeLinejoin="round"
      fill="#C8E6C9"
      fillOpacity={0.6}
    />
    <Path
      d="M8 16C6 14 5 11 7 9C9 8 10 10 10 12C11 9 14 10 13 13C12 15 10 16 8 16Z"
      stroke="#4CAF50"
      strokeWidth={1.5}
      strokeLinejoin="round"
      fill="#C8E6C9"
      fillOpacity={0.5}
    />
    <Path
      d="M28 14C30 12 31 9 29 7C27 6 26 8 26 10C25 7 22 8 23 11C24 13 26 14 28 14Z"
      stroke="#4CAF50"
      strokeWidth={1.5}
      strokeLinejoin="round"
      fill="#C8E6C9"
      fillOpacity={0.5}
    />
  </Svg>
);

const DetailedOrangeWithSliceIcon = () => (
  <Svg width={46} height={46} viewBox="0 0 46 46" fill="none">
    <Circle cx={19} cy={26} r={14} stroke="#2E7D32" strokeWidth={2.2} />
    <Path
      d="M19 12C20 8 24 6 28 7C28 11 25 14 21 13"
      stroke="#2E7D32"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="#81C784"
    />
    <Path d="M21 13L25 9.5" stroke="#2E7D32" strokeWidth={1.4} strokeLinecap="round" />
    <Path
      d="M25 21C33 22 38 27 37 35C30 36 24 31 25 21Z"
      stroke="#2E7D32"
      strokeWidth={2.2}
      strokeLinejoin="round"
      fill="#E8F5E9"
    />
    <Path
      d="M27 24C31 25 35 29 34 33M28 27L32 30M30 25L33 28"
      stroke="#2E7D32"
      strokeWidth={1.5}
      strokeLinecap="round"
    />
  </Svg>
);

const DetailedEggIcon = () => (
  <Svg width={36} height={36} viewBox="0 0 36 36" fill="none">
    <Path
      d="M18 5C13 5 9 12 9 20C9 26 13 31 18 31C23 31 27 26 27 20C27 12 23 5 18 5Z"
      stroke="#4CAF50"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const TopBarAvatarSvg = ({ color = '#FFFFFF', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={1.8} />
    <Path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const TopBarWalletSvg = ({ color = '#FFFFFF', size = 18 }: { color?: string; size?: number }) => (
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

const TopBarHeartSvg = ({ color = '#FFFFFF', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      stroke={color}
      strokeWidth={1.8}
      fill="none"
    />
  </Svg>
);


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
  const currentDeliveryAddress = defaultAddress ? formatAddressShort(defaultAddress) : 'Add a delivery address';
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveryModalStep, setDeliveryModalStep] = useState<'delivery' | 'addAddress'>('delivery');

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
            accessibilityLabel="Open Profile"
          >
            <View style={styles.stickyAvatarCircle}>
              <TopBarAvatarSvg color="#FFFFFF" size={18} />
            </View>
            <View style={styles.stickyProfileTexts}>
              <Text style={styles.stickyUserName}>Hi, Meena</Text>
              <Text style={styles.stickyUserLocation} numberOfLines={1}>{currentDeliveryAddress}</Text>
            </View>
          </TouchableOpacity>

          {/* Right action circular buttons: Wallet & Wishlist */}
          <View style={styles.stickyRightActions}>
            <NotificationBell
              onPress={() => onNavigate?.('CustomerNotifications')}
              color="#FFFFFF"
              size={18}
              style={styles.stickyCircleBtn}
              testID="home-notification-bell-sticky"
            />
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowWalletModal(true)}
              style={styles.stickyCircleBtn}
              accessibilityLabel="Wallet"
            >
              <TopBarWalletSvg color="#FFFFFF" size={18} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onNavigate?.('Wishlist')}
              style={styles.stickyCircleBtn}
              accessibilityLabel="Wishlist"
            >
              <TopBarHeartSvg color="#FFFFFF" size={18} />
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
                activeOpacity={0.7}
                onPress={() => onNavigate?.('CustomerAccount')}
                style={styles.profileTouchTarget}
                accessibilityLabel="Open Profile"
              />
              <View style={styles.topRightActions}>
                <NotificationBell
                  onPress={() => onNavigate?.('CustomerNotifications')}
                  color="#FFFFFF"
                  size={20}
                  style={styles.circleTouchTarget}
                  testID="home-notification-bell"
                />
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => onNavigate?.('CustomerWallet')}
                  style={styles.circleTouchTarget}
                  accessibilityLabel="Wallet"
                />
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => onNavigate?.('Wishlist')}
                  style={styles.circleTouchTarget}
                  accessibilityLabel="Wishlist"
                />
              </View>
            </View>

            <View style={styles.categoriesTouchRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onNavigate?.('ProductGrid', { sort: 'just_arrived', title: 'Just arrived' })}
                style={styles.categoryCircleHit}
                accessibilityLabel="Just Arrived"
              />
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onNavigate?.('Search', { query: 'Pesticide Free' })}
                style={styles.categoryCircleHit}
                accessibilityLabel="Pesticide Free"
              />
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onNavigate?.('Search', { query: 'Seasonal Favs' })}
                style={styles.categoryCircleHit}
                accessibilityLabel="Seasonal Favs"
              />
            </View>
          </View>
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
            <Text style={styles.loadingText}>Loading your fresh market</Text>
          </Animated.View>
        )}

        {/* ── 3. FULL SCROLLABLE DASHBOARD SECTIONS (FIGMA EXACT FLOW) ──────── */}
        {!isLoadingBuffer && (
          <View style={styles.catalogSectionsWrap}>
            {/* ── SECTION 2: WE'RE NOT IN YOUR AREA YET CARD (FIGMA EXACT) ───── */}
            {/* Shown only when the default address pincode is unserved (components/ServiceAreaRequestFlow.tsx). */}
            <ServiceAreaRequestCard
              pincode={defaultAddress?.pincode}
              prefill={prefillFromAddress(defaultAddress)}
            />

            {/* ── SECTION 3: FRESH FINDS FOR YOU (CATEGORY CIRCLES, GET /catalog/home categories) ── */}
            {homeCategories.length > 0 && (
              <View style={styles.sectionWrap}>
                <Text style={styles.sectionEditorialTitle}>Fresh Finds for You</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryCirclesRow}
                >
                  {homeCategories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      testID={`home-category-${cat.id}`}
                      activeOpacity={0.75}
                      onPress={() => onNavigate?.('ProductGrid', { categoryId: cat.id, title: cat.name })}
                      style={styles.categoryCircleItem}
                    >
                      <View style={styles.categoryCircleOuter}>
                        {cat.imageUrl ? (
                          <Image
                            source={{ uri: cat.imageUrl }}
                            style={styles.categoryCircleImg}
                            resizeMode="cover"
                          />
                        ) : null}
                      </View>
                      <Text style={styles.categoryCircleLabel}>{cat.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* ── SECTION 4: PROMO BANNERS (heroBanners, BR-152; static art when none is live) ── */}
            {heroBanners.length > 0 ? (
              <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
                {heroBanners.map((b) => (
                  <TouchableOpacity
                    key={b.id}
                    activeOpacity={0.9}
                    style={styles.promoBannerWrap}
                    onPress={() => openBanner(b.deeplink)}
                    disabled={!b.deeplink}
                    accessibilityLabel={b.title ?? 'Banner'}
                    testID={`home-banner-${b.id}`}
                  >
                    <Image source={{ uri: b.imageUrl }} style={styles.promoBannerImage} resizeMode="cover" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.promoBannerWrap}>
                <Image
                  source={bannerFarmFreshVegetables}
                  style={styles.promoBannerImage}
                  resizeMode="cover"
                />
              </View>
            )}

            {homeQuery.isError && (
              <View style={styles.sectionWrap} testID="home-error">
                <Text style={styles.sectionEditorialTitle}>Couldn't load the market</Text>
                <TouchableOpacity activeOpacity={0.85} onPress={() => void homeQuery.refetch()} style={styles.profileActionBtn}>
                  <Text style={styles.profileActionText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}

            {catalogEmpty && (
              <View style={styles.sectionWrap} testID="home-empty">
                <Text style={styles.sectionEditorialTitle}>No produce available right now</Text>
                <TouchableOpacity activeOpacity={0.85} onPress={() => void homeQuery.refetch()} style={styles.profileActionBtn}>
                  <Text style={styles.profileActionText}>Refresh</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── SECTION 5: "FOR YOU" CAROUSEL (featured) ───────────────────── */}
            {featured.length > 0 && (
              <View style={[styles.sectionWrap, styles.forYouSectionWrap]}>
                {renderSectionHeader('For you')}
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
                Freshly sourced from local farmers, thoughtfully delivered to your home.
              </Text>
            </View>
          </View>
        )}

        {/* Extra bottom padding to ensure floating nav doesn't overlap content */}
        <View style={{ height: 120 }} />
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
              accessibilityLabel="Close"
            >
              <ModalCloseCrossSvg size={13} color="#1F2937" />
            </TouchableOpacity>
            <View style={styles.profileHeader}>
              <View style={styles.profileAvatarLarge}>
                <Text style={styles.profileAvatarText}>M</Text>
              </View>
              <View style={styles.profileHeaderText}>
                <Text style={styles.profileName}>Meena</Text>
                <Text style={styles.profilePhone}>+91 9090202033</Text>
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
              <Text style={styles.profileSectionTitle}>Preferences</Text>
              <View style={styles.prefBadgesRow}>
                <View style={styles.prefBadge}><Text style={styles.prefBadgeText}>🌱 Vegetarian</Text></View>
                <View style={styles.prefBadge}><Text style={styles.prefBadgeText}>💪 High protein</Text></View>
                <View style={styles.prefBadge}><Text style={styles.prefBadgeText}>🛡️ Pesticide-free</Text></View>
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
              <Text style={styles.profileActionText}>View My Cart ({cartCount} items)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                setShowProfileModal(false);
                onNavigate?.('SignOut');
              }}
              style={[styles.profileActionBtn, styles.profileSignOutBtn]}
            >
              <Text style={[styles.profileActionText, { color: '#EF4444' }]}>Sign Out</Text>
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
              accessibilityLabel="Close"
            >
              <ModalCloseCrossSvg size={13} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.walletTitle}>TOHFA Fresh Wallet</Text>
            <Text style={styles.walletBalance}>{wallet.isLoading ? '…' : wallet.label}</Text>
            <Text style={styles.walletSubtitle}>Available balance for 1-click organic checkout</Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setShowWalletModal(false)}
              style={styles.walletDoneBtn}
            >
              <Text style={styles.walletDoneText}>Close</Text>
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

      {/* ── CART BAR (server cart: line count + subtotal; hidden when empty) ── */}
      <CartToast
        visible={cartCount > 0}
        itemCount={cartCount}
        totalPrice={cart?.subtotal ?? '0.00'}
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
    backgroundColor: '#FAFAF9',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 110,
  },

  // ── STICKY COMPACT TOP NAVBAR (EXACT FIGMA SPEC: SCREEN 25) ─────────────
  stickyHeaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'android' ? 96 : 94,
    backgroundColor: '#131B14',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    zIndex: 90,
    elevation: 8,
    shadowColor: '#000000',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  stickyProfileTexts: {
    justifyContent: 'center',
  },
  stickyUserName: {
    fontFamily: customerFonts.bold,
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  stickyUserLocation: {
    fontFamily: customerFonts.regular,
    fontSize: 11,
    color: '#A3B899',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── 1. TOP BANNER (390 x 290 HUG - FIGMA IMAGE 1) ─────────────────────────
  bannerContainer: {
    width: '100%',
    height: 290,
    position: 'relative',
    backgroundColor: '#0F172A',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 8 : 8,
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  bannerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 54,
  },
  profileTouchTarget: {
    width: 170,
    height: 50,
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
  categoriesTouchRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    height: 94,
    paddingHorizontal: 8,
  },
  categoryCircleHit: {
    width: 90,
    height: 90,
    borderRadius: 45,
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
    backgroundColor: 'rgba(232, 245, 233, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.35,
  },
  centerActiveCard: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  loadingText: {
    fontFamily: customerFonts.regular,
    fontSize: 16,
    color: '#1F2937',
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
    backgroundColor: '#FFFBF2',
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
    color: '#1F2937',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    elevation: 2,
    shadowColor: '#000000',
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
    color: '#374151',
    textAlign: 'center',
  },

  // Section 4: Promo Banner (Farm Fresh Vegetables)
  promoBannerWrap: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
  },
  promoBannerImage: {
    width: '100%',
    aspectRatio: 350 / 170,
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
  // Green shaded background for ordered products (Exact Image 4)
  productCardOrdered: {
    backgroundColor: '#A8D5BA',
    borderColor: '#7CB992',
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  comingTomorrowText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
    fontFamily: customerFonts.bold,
  },
  cardComingTomorrow: {
    backgroundColor: '#A8C4A7',
    borderColor: '#97B896',
  },
  cardUnsalable: {
    backgroundColor: '#D1D5DB',
    borderColor: '#CBD5E1',
  },
  badgeComingTomorrow: {
    position: 'absolute',
    backgroundColor: '#2D6A4F',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'center',
    zIndex: 5,
  },
  badgeComingTomorrowText: {
    color: '#FFFFFF',
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
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: customerFonts.regular,
  },
  comingSoonCard: {
    backgroundColor: '#F9FAFB',
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
    color: '#F59E0B',
  },
  ratingText: {
    fontFamily: customerFonts.bold,
    fontSize: 11,
    color: '#1F2937',
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
    color: '#111827',
    marginRight: 6,
  },
  priceStrikethrough: {
    fontFamily: customerFonts.regular,
    fontSize: 11,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginRight: 'auto',
  },
  unitText: {
    fontFamily: customerFonts.regular,
    fontSize: 11,
    color: '#6B7280',
  },
  cardProductName: {
    fontFamily: customerFonts.regular,
    fontSize: 12,
    color: '#374151',
    marginTop: 6,
    textAlign: 'center',
    width: 140,
  },

  // ── 24. FOOTER BRANDING CARD (EXACT 350 x 246 HUG FROM FIGMA) ─────────────
  footerBrandingCard: {
    width: '92%',
    maxWidth: 350,
    height: 246,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 24,
    marginTop: 20,
    marginBottom: 20,
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  footerLogoRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  footerLogoImage: {
    width: 125,
    height: 48,
  },
  footerGoldenLine: {
    flex: 1,
    height: 3.5,
    backgroundColor: '#E5A93C',
    marginLeft: 16,
    marginBottom: 8,
    borderRadius: 2,
  },
  footerSubtitle: {
    fontFamily: customerFonts.regular,
    fontSize: 15,
    lineHeight: 23,
    color: '#4B5563',
    textAlign: 'left',
  },

  // ── MODAL STYLES ──────────────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
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
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  profileHeaderText: {
    flex: 1,
  },
  profileName: {
    fontFamily: customerFonts.editorial,
    fontSize: 22,
    color: '#1F2937',
  },
  profilePhone: {
    fontFamily: customerFonts.regular,
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  profileAddress: {
    fontFamily: customerFonts.regular,
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 1,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 18,
    color: '#6B7280',
  },
  profileDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 18,
  },
  profileSection: {
    marginBottom: 20,
  },
  profileSectionTitle: {
    fontFamily: customerFonts.bold,
    fontSize: 14,
    color: '#1F2937',
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
    backgroundColor: '#F3F4F6',
  },
  prefBadgeText: {
    fontSize: 12,
    color: '#374151',
    fontFamily: customerFonts.regular,
  },
  profileActionBtn: {
    backgroundColor: '#E8F5E9',
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
    backgroundColor: '#FEE2E2',
  },
  floatingModalCloseBtn: {
    position: 'absolute',
    top: -14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  walletCard: {
    backgroundColor: '#FFFFFF',
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
    color: '#1F2937',
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
    color: '#6B7280',
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
    color: '#FFFFFF',
    fontFamily: customerFonts.bold,
    fontSize: 14,
  },
});
