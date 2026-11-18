import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { customerFonts } from '../theme';
import {
  tohfaMarketLogo,
  profileAdsBanner,
  profileOrdersIcon,
  profileWalletIcon,
  profileWishlistIcon,
} from '../assets/images';
import { displayName, formatMobileDisplay, useCustomerProfile } from '../api/profile';
import { mapProblem } from '../api/problem';
import { logout } from '../api/auth';
import { useWalletBalance } from '../api/wallet';
import { useWishlist } from '../api/wishlist';
import { isActiveStatus, useOrders } from '../api/orders';
import { t } from '../../../i18n/customer';

export interface CustomerAccountScreenProps {
  /** Overrides for the profile fields; by default they come from GET /customers/me. */
  userName?: string;
  userPhone?: string;
  userEmail?: string;
  walletBalance?: string;
  activeOrdersCount?: string;
  wishlistCount?: string;
  isNewUser?: boolean;
  showReturnsAndReviews?: boolean;
  onNavigate?: (screen: string, params?: Record<string, unknown>) => void;
  onBack?: () => void;
  onSignOut?: () => void;
  onViewProfile?: () => void;
}

// ── SVG ICONS ─────────────────────────────────────────────────────────────────

const BackArrowSvg = ({ color = '#1A2E1A', size = 20 }: { color?: string; size?: number }) => (
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

const ChevronRightSvg = ({ color = '#9CA3AF', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 18L15 12L9 6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const PackageSvg = ({ color = '#1A2E1A', size = 20 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M16.5 9.4L7.55 4.24M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M3.29 7L12 12.01L20.71 7M12 22.08V12"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const WalletSvg = ({ color = '#1A2E1A', size = 20 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M16 3H4a2 2 0 00-2 2v2h18V5a2 2 0 00-2-2z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={16} cy={14} r={1.5} fill={color} />
  </Svg>
);

const SettingsSvg = ({ color = '#1A2E1A', size = 20 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={1.8} />
    <Path
      d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const HeadsetSvg = ({ color = '#1A2E1A', size = 20 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 18v-6a9 9 0 0118 0v6"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3v5zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3v5z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const StarSvg = ({ color = '#1A2E1A', size = 20 }: { color?: string; size?: number }) => (
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

const ReturnsSvg = ({ color = '#1A2E1A', size = 20 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 8l8-4 8 4v8l-8 4-8-4V8z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M15 13l-3 3-3-3"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 9v7"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
  </Svg>
);

const HelpSvg = ({ color = '#1A2E1A', size = 20 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={1.8} />
    <Path
      d="M12 16v.01M12 13a2 2 0 001.99-2.02A2 2 0 0012 9a2 2 0 00-1.95 2.05"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const LogoutSvg = ({ color = '#DC2626', size = 20 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M16 17l5-5-5-5M21 12H9"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CloseCircleSvg = ({ size = 24 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} fill="#F3F4F6" />
    <Path d="M15 9l-6 6M9 9l6 6" stroke="#4B5563" strokeWidth={1.6} strokeLinecap="round" />
  </Svg>
);

const LogOutDoorIllustrationSvg = ({ size = 76 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 80 80" fill="none">
    <Circle cx={40} cy={40} r={34} fill="#E9F7E9" />
    <Path
      d="M24 45c-4-1-7-5-6-9 4 0 7 3 7 7l-1 2z"
      fill="#22C55E"
    />
    <Path
      d="M26 38c-3-3-3-8 1-9 1 4 0 7-1 9z"
      fill="#4ADE80"
    />
    <Rect x={30} y={20} width={24} height={40} rx={3} stroke="#15803D" strokeWidth={2.5} fill="#FFFFFF" />
    <Path
      d="M30 20l15 6v28l-15 6V20z"
      fill="#22C55E"
      stroke="#16A34A"
      strokeWidth={1.5}
    />
    <Circle cx={41} cy={40} r={1.6} fill="#FFFFFF" />
    <Path
      d="M60 22l4-2M63 27l4 1M60 32l3 2"
      stroke="#16A34A"
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

const ProfileBadgeSvg = ({ color = '#FFFFFF', size = 28 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={2} />
    <Circle cx={12} cy={9} r={3.5} stroke={color} strokeWidth={1.8} />
    <Path d="M6.5 18.5a6.5 6.5 0 0111 0" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

/**
 * Screen 73 · My Account
 * Exact implementation of the customer account screen matching Figma & theme tokens.
 */
export const CustomerAccountScreen: React.FC<CustomerAccountScreenProps> = ({
  userName: userNameProp,
  userPhone: userPhoneProp,
  userEmail: userEmailProp,
  walletBalance: walletBalanceProp,
  activeOrdersCount: activeOrdersCountProp,
  wishlistCount: wishlistCountProp,
  isNewUser: isNewUserProp,
  showReturnsAndReviews = false,
  onNavigate,
  onBack,
  onSignOut,
  onViewProfile,
}) => {
  const insets = useSafeAreaInsets();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const profileQuery = useCustomerProfile();
  // Commerce summary tiles: server wallet balance, wishlist size, active orders (flow B).
  const wallet = useWalletBalance();
  const wishlistQuery = useWishlist();
  const ordersQuery = useOrders();
  const walletBalance = walletBalanceProp ?? wallet.label;
  const wishlistTotal = wishlistQuery.data?.items.length;
  const wishlistCount = wishlistCountProp ?? (wishlistTotal === undefined ? '—' : t(wishlistTotal === 1 ? 'customer.account.home.itemOne' : 'customer.account.home.itemOther', { count: wishlistTotal }));
  const activeOrders = (ordersQuery.data?.pages.flatMap((p) => p.items) ?? []).filter((o) => isActiveStatus(o.status)).length;
  const activeOrdersCount = activeOrdersCountProp ?? (activeOrders === 0 ? t('customer.account.home.noActiveOrders') : t(activeOrders === 1 ? 'customer.account.home.activeOrderOne' : 'customer.account.home.activeOrderOther', { count: activeOrders }));
  const profile = profileQuery.data;
  const userName = userNameProp ?? displayName(profile);
  const userPhone = userPhoneProp ?? formatMobileDisplay(profile?.mobile);
  const userEmail = userEmailProp ?? profile?.email ?? null;
  // BR-190: a profile that still misses required fields opens Profile in "empty" mode.
  const isNewUser = isNewUserProp ?? (profile ? !profile.profileComplete : false);
  const profileLoading = !profile && profileQuery.isPending && userPhoneProp === undefined;
  const profileError = !profile && profileQuery.isError ? mapProblem(profileQuery.error) : null;

  const handleConfirmLogout = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await logout();
    } finally {
      setSigningOut(false);
      setShowLogoutModal(false);
      onSignOut?.();
    }
  };
  const bannerTopPadding = insets.top > 0
    ? insets.top + 8
    : (Platform.OS === 'android' ? (StatusBar.currentHeight ? StatusBar.currentHeight + 8 : 36) : 16);
  const bannerHeight = Math.round(225 + (insets.top > 0 ? insets.top : (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0)));

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── TOP BANNER SECTION WITH SCENIC BACKGROUND ────────────────────────── */}
        <View style={[styles.bannerWrapper, { height: bannerHeight, paddingTop: bannerTopPadding }]}>
          <Image
            source={profileAdsBanner}
            style={styles.bannerBackgroundImage}
            resizeMode="cover"
          />
          {/* Back Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onBack || (() => onNavigate?.('Home'))}
            style={styles.backButton}
            accessibilityLabel={t('customer.account.home.back')}
          >
            <BackArrowSvg color="#1A1A1A" size={18} />
          </TouchableOpacity>

          {/* Profile Info */}
          <View style={styles.profileInfoContainer}>
            {profileLoading ? (
              <View testID="account-profile-skeleton" accessibilityLabel={t('customer.account.home.loadingProfile')}>
                <View style={[styles.skeletonLine, { width: 140, height: 22 }]} />
                <View style={[styles.skeletonLine, { width: 120 }]} />
                <View style={[styles.skeletonLine, { width: 180 }]} />
              </View>
            ) : profileError && !profileError.silent ? (
              <View testID="account-profile-error">
                <Text style={styles.userPhoneText} accessibilityRole="alert">
                  {profileError.message}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => void profileQuery.refetch()}
                  accessibilityRole="button"
                  accessibilityLabel={t('customer.account.home.retryA11y')}
                >
                  <Text style={styles.viewProfileText}>{t('customer.account.home.retry')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {userName ? <Text style={styles.userNameText}>{userName}</Text> : null}
                {userPhone ? <Text style={styles.userPhoneText}>{userPhone}</Text> : null}
                {userEmail ? <Text style={styles.userEmailText}>{userEmail}</Text> : null}
              </>
            )}

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={
                onViewProfile ||
                (() =>
                  onNavigate?.('CustomerProfile', {
                    mode: isNewUser ? 'empty' : 'view',
                  }))
              }
              style={styles.viewProfileRow}
              accessibilityLabel={t('customer.account.home.viewProfile')}
            >
              <Text style={styles.viewProfileText}>{t('customer.account.home.viewProfile')}</Text>
              <ChevronRightSvg color="#4B5563" size={13} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 3 SUMMARY CARDS ROW (Orders, Wallet, Wishlist) ───────────────────── */}
        <View style={styles.cardsRow}>
          {/* 1. Orders Card */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onNavigate?.('OrderHistory')}
            style={styles.summaryCard}
            accessibilityLabel={t('customer.account.home.orders')}
          >
            <Image
              source={profileOrdersIcon}
              style={styles.summaryCardIcon}
              resizeMode="contain"
            />
            <Text style={styles.summaryCardSubtitle} numberOfLines={1}>
              {activeOrdersCount}
            </Text>
            <Text style={styles.summaryCardTitle}>{t('customer.account.home.orders')}</Text>
          </TouchableOpacity>

          {/* 2. Wallet Card */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onNavigate?.('CustomerWallet')}
            style={styles.summaryCard}
            accessibilityLabel={t('customer.account.home.wallet')}
          >
            <Image
              source={profileWalletIcon}
              style={styles.summaryCardIcon}
              resizeMode="contain"
            />
            <Text style={[styles.summaryCardSubtitle, styles.walletBalanceSubtitle]} numberOfLines={1}>
              {walletBalance}
            </Text>
            <Text style={styles.summaryCardTitle}>{t('customer.account.home.wallet')}</Text>
          </TouchableOpacity>

          {/* 3. Wishlist Card */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onNavigate?.('Wishlist')}
            style={styles.summaryCard}
            accessibilityLabel={t('customer.account.home.wishlist')}
          >
            <Image
              source={profileWishlistIcon}
              style={styles.summaryCardIcon}
              resizeMode="contain"
            />
            <Text style={styles.summaryCardSubtitle} numberOfLines={1}>
              {wishlistCount}
            </Text>
            <Text style={styles.summaryCardTitle}>{t('customer.account.home.wishlist')}</Text>
          </TouchableOpacity>
        </View>

        {/* ── MENU LIST SECTION (6 Rows matching Image 2) ───────────────────────── */}
        <View style={styles.menuContainer}>
          {/* Row 1: My Orders */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onNavigate?.('OrderHistory')}
            style={styles.menuItem}
            accessibilityLabel={t('customer.account.home.myOrders')}
          >
            <View style={styles.menuIconBox}>
              <PackageSvg color="#1A1A1A" size={20} />
            </View>
            <View style={styles.menuTextColumn}>
              <Text style={styles.menuItemTitle}>{t('customer.account.home.myOrders')}</Text>
              <Text style={styles.menuItemSubtitle}>{t('customer.account.home.myOrdersSub')}</Text>
            </View>
            <ChevronRightSvg color="#9CA3AF" size={16} />
          </TouchableOpacity>
          <View style={styles.divider} />

          {/* Row 2: My Wallet */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onNavigate?.('CustomerWallet')}
            style={styles.menuItem}
            accessibilityLabel={t('customer.account.home.myWallet')}
          >
            <View style={styles.menuIconBox}>
              <WalletSvg color="#1A1A1A" size={20} />
            </View>
            <View style={styles.menuTextColumn}>
              <Text style={styles.menuItemTitle}>{t('customer.account.home.myWallet')}</Text>
              <Text style={styles.menuItemSubtitle}>{t('customer.account.home.myWalletSub')}</Text>
            </View>
            <View style={styles.walletPill}>
              <Text style={styles.walletPillText}>{walletBalance}</Text>
            </View>
            <ChevronRightSvg color="#9CA3AF" size={16} />
          </TouchableOpacity>
          <View style={styles.divider} />

          {/* Row 3: Account settings */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onNavigate?.('CustomerAccountSettings')}
            style={styles.menuItem}
            accessibilityLabel={t('customer.account.home.settings')}
          >
            <View style={styles.menuIconBox}>
              <SettingsSvg color="#1A1A1A" size={20} />
            </View>
            <View style={styles.menuTextColumn}>
              <Text style={styles.menuItemTitle}>{t('customer.account.home.settings')}</Text>
              <Text style={styles.menuItemSubtitle}>{t('customer.account.home.settingsSub')}</Text>
            </View>
            <ChevronRightSvg color="#9CA3AF" size={16} />
          </TouchableOpacity>
          <View style={styles.divider} />

          {/* Row 4: Contact Support */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onNavigate?.('ContactSupport')}
            style={styles.menuItem}
            accessibilityLabel={t('customer.account.home.contactSupport')}
          >
            <View style={styles.menuIconBox}>
              <HeadsetSvg color="#1A1A1A" size={20} />
            </View>
            <View style={styles.menuTextColumn}>
              <Text style={styles.menuItemTitle}>{t('customer.account.home.contactSupport')}</Text>
              <Text style={styles.menuItemSubtitle}>{t('customer.account.home.contactSupportSub')}</Text>
            </View>
            <ChevronRightSvg color="#9CA3AF" size={16} />
          </TouchableOpacity>
          <View style={styles.divider} />

          {/* Row 4a: Notifications */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onNavigate?.('CustomerNotifications')}
            style={styles.menuItem}
            accessibilityLabel={t('customer.account.home.notifications')}
          >
            <View style={styles.menuIconBox}>
              <HeadsetSvg color="#1A1A1A" size={20} />
            </View>
            <View style={styles.menuTextColumn}>
              <Text style={styles.menuItemTitle}>{t('customer.account.home.notifications')}</Text>
              <Text style={styles.menuItemSubtitle}>{t('customer.account.home.notificationsSub')}</Text>
            </View>
            <ChevronRightSvg color="#9CA3AF" size={16} />
          </TouchableOpacity>
          <View style={styles.divider} />

          {/* Row 4b: My support requests */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onNavigate?.('CustomerSupport')}
            style={styles.menuItem}
            accessibilityLabel={t('customer.account.home.myRequests')}
          >
            <View style={styles.menuIconBox}>
              <HeadsetSvg color="#1A1A1A" size={20} />
            </View>
            <View style={styles.menuTextColumn}>
              <Text style={styles.menuItemTitle}>{t('customer.account.home.myRequests')}</Text>
              <Text style={styles.menuItemSubtitle}>{t('customer.account.home.myRequestsSub')}</Text>
            </View>
            <ChevronRightSvg color="#9CA3AF" size={16} />
          </TouchableOpacity>
          <View style={styles.divider} />

          {/* Optional Rows: Returns & Review & Feedback (if showReturnsAndReviews is true) */}
          {showReturnsAndReviews && (
            <>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => onNavigate?.('ReturnOrder')}
                style={styles.menuItem}
                accessibilityLabel={t('customer.account.home.returns')}
              >
                <View style={styles.menuIconBox}>
                  <ReturnsSvg color="#1A1A1A" size={20} />
                </View>
                <View style={styles.menuTextColumn}>
                  <Text style={styles.menuItemTitle}>{t('customer.account.home.returns')}</Text>
                  <Text style={styles.menuItemSubtitle}>{t('customer.account.home.returnsSub')}</Text>
                </View>
                <ChevronRightSvg color="#9CA3AF" size={16} />
              </TouchableOpacity>
              <View style={styles.divider} />

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => onNavigate?.('ReviewFeedback')}
                style={styles.menuItem}
                accessibilityLabel={t('customer.account.home.review')}
              >
                <View style={styles.menuIconBox}>
                  <StarSvg color="#1A1A1A" size={20} />
                </View>
                <View style={styles.menuTextColumn}>
                  <Text style={styles.menuItemTitle}>{t('customer.account.home.review')}</Text>
                  <Text style={styles.menuItemSubtitle}>{t('customer.account.home.reviewSub')}</Text>
                </View>
                <ChevronRightSvg color="#9CA3AF" size={16} />
              </TouchableOpacity>
              <View style={styles.divider} />
            </>
          )}

          {/* Row 5: Help & FAQs */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onNavigate?.('CustomerHelp')}
            style={styles.menuItem}
            accessibilityLabel={t('customer.account.home.help')}
          >
            <View style={styles.menuIconBox}>
              <HelpSvg color="#1A1A1A" size={20} />
            </View>
            <View style={styles.menuTextColumn}>
              <Text style={styles.menuItemTitle}>{t('customer.account.home.help')}</Text>
              <Text style={styles.menuItemSubtitle}>{t('customer.account.home.helpSub')}</Text>
            </View>
            <ChevronRightSvg color="#9CA3AF" size={16} />
          </TouchableOpacity>
          <View style={styles.divider} />

          {/* Row 6: Logout */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowLogoutModal(true)}
            style={styles.menuItem}
            accessibilityLabel={t('customer.account.home.logout')}
          >
            <View style={[styles.menuIconBox, styles.logoutIconBox]}>
              <LogoutSvg color="#DC2626" size={20} />
            </View>
            <View style={styles.menuTextColumn}>
              <Text style={[styles.menuItemTitle, styles.logoutText]}>{t('customer.account.home.logout')}</Text>
              <Text style={styles.menuItemSubtitle}>{t('customer.account.home.logoutSub')}</Text>
            </View>
            <ChevronRightSvg color="#9CA3AF" size={16} />
          </TouchableOpacity>
        </View>

        {/* ── FOOTER BRANDING ──────────────────────────────────────────────────── */}
        <View style={styles.footerContainer}>
          <Image
            source={tohfaMarketLogo}
            style={styles.footerLogo}
            resizeMode="contain"
          />
          <Text style={styles.footerCopyright}>
            {t('customer.account.home.copyright')}
          </Text>
        </View>

        {/* Bottom spacing for floating button */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* ── FLOATING PROFILE BUTTON (EXACT FIGMA SPEC) ──────────────────────── */}
      <View style={styles.floatingButtonWrap} pointerEvents="box-none">
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onViewProfile || (() => onNavigate?.('CustomerProfile'))}
          style={styles.floatingProfileButton}
          accessibilityLabel={t('customer.account.home.profileShortcut')}
        >
          <ProfileBadgeSvg color="#FFFFFF" size={26} />
        </TouchableOpacity>
      </View>

      {/* ── LOGOUT CONFIRMATION MODAL (EXACT FIGMA SPEC) ────────────────────── */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.logoutModalCard}>
            {/* Top Right Close Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowLogoutModal(false)}
              style={styles.modalCloseButton}
              accessibilityLabel={t('customer.account.home.closeModal')}
            >
              <CloseCircleSvg size={24} />
            </TouchableOpacity>

            {/* Illustration */}
            <View style={styles.logoutIllustrationWrap}>
              <LogOutDoorIllustrationSvg size={76} />
            </View>

            {/* Title */}
            <Text style={styles.logoutModalTitle}>{t('customer.account.home.logoutTitle')}</Text>

            {/* Subtitle */}
            <Text style={styles.logoutModalSubtitle}>
              {t('customer.account.home.logoutBody')}
            </Text>

            {/* Action Buttons */}
            <View style={styles.logoutButtonsRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowLogoutModal(false)}
                style={styles.cancelModalButton}
                accessibilityLabel={t('customer.account.home.cancel')}
              >
                <Text style={styles.cancelModalButtonText}>{t('customer.account.home.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => void handleConfirmLogout()}
                disabled={signingOut}
                style={styles.confirmLogoutButton}
                accessibilityLabel={t('customer.account.home.logoutConfirmA11y')}
                accessibilityState={{ disabled: signingOut, busy: signingOut }}
              >
                {signingOut ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmLogoutButtonText}>{t('customer.account.home.logoutConfirm')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 24,
  },

  // ── BANNER STYLES ──────────────────────────────────────────────────────────
  bannerWrapper: {
    width: '100%',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingBottom: 16,
    justifyContent: 'space-between',
    backgroundColor: '#EBF8E7',
    position: 'relative',
  },
  bannerBackgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  // ── HEADER & PROFILE STYLES ───────────────────────────────────────────────
  profileInfoContainer: {
    maxWidth: '65%',
    marginBottom: 4,
  },
  skeletonLine: {
    height: 14,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.6)',
    marginBottom: 8,
  },
  userNameText: {
    fontFamily: customerFonts.bold,
    fontWeight: '700',
    fontSize: 24,
    color: '#111827',
    letterSpacing: -0.2,
    lineHeight: 30,
  },
  userPhoneText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 4,
  },
  userEmailText: {
    fontSize: 12.5,
    fontWeight: '400',
    color: '#4B5563',
    marginTop: 2,
  },
  viewProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  viewProfileText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },

  // ── 3 SUMMARY CARDS ROW ────────────────────────────────────────────────────
  cardsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#EDF7ED',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCardIcon: {
    width: 30,
    height: 30,
    marginBottom: 6,
  },
  summaryCardSubtitle: {
    fontSize: 10.5,
    fontWeight: '500',
    color: '#4B5563',
    textAlign: 'center',
  },
  walletBalanceSubtitle: {
    color: '#15803D',
    fontWeight: '700',
    fontSize: 12,
  },
  summaryCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 3,
    textAlign: 'center',
  },

  // ── MENU LIST SECTION ──────────────────────────────────────────────────────
  menuContainer: {
    marginTop: 14,
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  logoutIconBox: {
    backgroundColor: '#FEE2E2',
  },
  menuTextColumn: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  logoutText: {
    color: '#DC2626',
  },
  menuItemSubtitle: {
    fontSize: 11.5,
    fontWeight: '400',
    color: '#5F5E5A',
    marginTop: 2,
  },
  walletPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 12,
    marginRight: 8,
  },
  walletPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#15803D',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 54,
  },

  // ── FOOTER BRANDING ────────────────────────────────────────────────────────
  footerContainer: {
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  footerLogo: {
    width: 100,
    height: 40,
  },
  footerCopyright: {
    fontSize: 10.5,
    fontWeight: '400',
    color: '#6B7280',
    marginTop: 6,
    textAlign: 'center',
  },

  // ── FLOATING BUTTON ────────────────────────────────────────────────────────
  floatingButtonWrap: {
    position: 'absolute',
    bottom: 24,
    right: 20,
  },
  floatingProfileButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1E6B35',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
  },

  // ── LOGOUT MODAL STYLES ────────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  logoutModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingTop: 24,
    paddingBottom: 22,
    paddingHorizontal: 20,
    alignItems: 'center',
    position: 'relative',
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  logoutIllustrationWrap: {
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  logoutModalSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#5F5E5A',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 22,
    paddingHorizontal: 10,
  },
  logoutButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  cancelModalButton: {
    flex: 1,
    height: 42,
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#1E6B35',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelModalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E6B35',
  },
  confirmLogoutButton: {
    flex: 1,
    height: 42,
    borderRadius: 24,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmLogoutButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
