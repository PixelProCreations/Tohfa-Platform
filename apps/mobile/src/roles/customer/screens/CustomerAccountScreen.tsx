import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ImageBackground,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import {
  customerColors,
  customerFonts,
  customerRadius,
  customerShadow,
  customerSpacing,
} from '../theme';
import {
  tohfaMarketLogo,
  profileAdsBanner,
  profileOrdersIcon,
  profileWalletIcon,
  profileWishlistIcon,
} from '../assets/images';

export interface CustomerAccountScreenProps {
  userName?: string;
  userPhone?: string;
  userEmail?: string;
  walletBalance?: string;
  activeOrdersCount?: string;
  wishlistCount?: string;
  isNewUser?: boolean;
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
  userName = 'Suresh',
  userPhone = '+91 99944 99944',
  userEmail = 'suresh1234567890@gmail.com',
  walletBalance = '₹ 1,250',
  activeOrdersCount = 'No active Orders',
  wishlistCount = '3 items',
  isNewUser = false,
  onNavigate,
  onBack,
  onSignOut,
  onViewProfile,
}) => {
  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── TOP BANNER SECTION WITH SCENIC BACKGROUND ────────────────────────── */}
        <ImageBackground
          source={profileAdsBanner}
          style={styles.bannerWrapper}
          imageStyle={styles.bannerImageStyle}
          resizeMode="cover"
        >
          {/* Back Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onBack || (() => onNavigate?.('Home'))}
            style={styles.backButton}
            accessibilityLabel="Back"
          >
            <BackArrowSvg color="#1A2E1A" size={18} />
          </TouchableOpacity>

          {/* Profile Info */}
          <View style={styles.profileInfoContainer}>
            <Text style={styles.userNameText}>{userName}</Text>
            <Text style={styles.userPhoneText}>{userPhone}</Text>
            <Text style={styles.userEmailText}>{userEmail}</Text>

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
              accessibilityLabel="View profile"
            >
              <Text style={styles.viewProfileText}>View profile</Text>
              <ChevronRightSvg color="#1A2E1A" size={13} />
            </TouchableOpacity>
          </View>
        </ImageBackground>

        {/* ── 3 SUMMARY CARDS ROW (Orders, Wallet, Wishlist) ───────────────────── */}
        <View style={styles.cardsRow}>
          {/* 1. Orders Card */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onNavigate?.('OrderHistory')}
            style={styles.summaryCard}
            accessibilityLabel="Orders"
          >
            <Image
              source={profileOrdersIcon}
              style={styles.summaryCardIcon}
              resizeMode="contain"
            />
            <Text style={styles.summaryCardSubtitle} numberOfLines={1}>
              {activeOrdersCount}
            </Text>
            <Text style={styles.summaryCardTitle}>Orders</Text>
          </TouchableOpacity>

          {/* 2. Wallet Card */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onNavigate?.('Topup')}
            style={styles.summaryCard}
            accessibilityLabel="Wallet"
          >
            <Image
              source={profileWalletIcon}
              style={styles.summaryCardIcon}
              resizeMode="contain"
            />
            <Text style={[styles.summaryCardSubtitle, styles.walletBalanceSubtitle]} numberOfLines={1}>
              {walletBalance}
            </Text>
            <Text style={styles.summaryCardTitle}>Wallet</Text>
          </TouchableOpacity>

          {/* 3. Wishlist Card */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onNavigate?.('Categories')}
            style={styles.summaryCard}
            accessibilityLabel="Wishlist"
          >
            <Image
              source={profileWishlistIcon}
              style={styles.summaryCardIcon}
              resizeMode="contain"
            />
            <Text style={styles.summaryCardSubtitle} numberOfLines={1}>
              {wishlistCount}
            </Text>
            <Text style={styles.summaryCardTitle}>Wishlist</Text>
          </TouchableOpacity>
        </View>

        {/* ── MENU LIST SECTION (6 Rows) ───────────────────────────────────────── */}
        <View style={styles.menuContainer}>
          {/* Row 1: My Orders */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onNavigate?.('OrderHistory')}
            style={styles.menuItem}
            accessibilityLabel="My Orders"
          >
            <View style={styles.menuIconBox}>
              <PackageSvg color={customerColors.heading} size={20} />
            </View>
            <View style={styles.menuTextColumn}>
              <Text style={styles.menuItemTitle}>My Orders</Text>
              <Text style={styles.menuItemSubtitle}>Track, Manage and view your order history</Text>
            </View>
            <ChevronRightSvg color="#9CA3AF" size={16} />
          </TouchableOpacity>
          <View style={styles.divider} />

          {/* Row 2: My Wallet */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onNavigate?.('Topup')}
            style={styles.menuItem}
            accessibilityLabel="My Wallet"
          >
            <View style={styles.menuIconBox}>
              <WalletSvg color={customerColors.heading} size={20} />
            </View>
            <View style={styles.menuTextColumn}>
              <Text style={styles.menuItemTitle}>My Wallet</Text>
              <Text style={styles.menuItemSubtitle}>Add money, view balance and transaction history</Text>
            </View>
            <View style={styles.walletPill}>
              <Text style={styles.walletPillText}>Rs: {walletBalance}</Text>
            </View>
            <ChevronRightSvg color="#9CA3AF" size={16} />
          </TouchableOpacity>
          <View style={styles.divider} />

          {/* Row 3: Account settings */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {}}
            style={styles.menuItem}
            accessibilityLabel="Account settings"
          >
            <View style={styles.menuIconBox}>
              <SettingsSvg color={customerColors.heading} size={20} />
            </View>
            <View style={styles.menuTextColumn}>
              <Text style={styles.menuItemTitle}>Account settings</Text>
              <Text style={styles.menuItemSubtitle}>Manage language, untis and settings</Text>
            </View>
            <ChevronRightSvg color="#9CA3AF" size={16} />
          </TouchableOpacity>
          <View style={styles.divider} />

          {/* Row 4: Contact Support */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {}}
            style={styles.menuItem}
            accessibilityLabel="Contact Support"
          >
            <View style={styles.menuIconBox}>
              <HeadsetSvg color={customerColors.heading} size={20} />
            </View>
            <View style={styles.menuTextColumn}>
              <Text style={styles.menuItemTitle}>Contact Support</Text>
              <Text style={styles.menuItemSubtitle}>Get help for Orders, payments and other issues</Text>
            </View>
            <ChevronRightSvg color="#9CA3AF" size={16} />
          </TouchableOpacity>
          <View style={styles.divider} />

          {/* Row 5: Help & FAQs */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {}}
            style={styles.menuItem}
            accessibilityLabel="Help & FAQs"
          >
            <View style={styles.menuIconBox}>
              <HelpSvg color={customerColors.heading} size={20} />
            </View>
            <View style={styles.menuTextColumn}>
              <Text style={styles.menuItemTitle}>Help & FAQs</Text>
              <Text style={styles.menuItemSubtitle}>Find answers to common questions</Text>
            </View>
            <ChevronRightSvg color="#9CA3AF" size={16} />
          </TouchableOpacity>
          <View style={styles.divider} />

          {/* Row 6: Logout */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onSignOut}
            style={styles.menuItem}
            accessibilityLabel="Logout"
          >
            <View style={[styles.menuIconBox, styles.logoutIconBox]}>
              <LogoutSvg color={customerColors.error} size={20} />
            </View>
            <View style={styles.menuTextColumn}>
              <Text style={[styles.menuItemTitle, styles.logoutText]}>Logout</Text>
              <Text style={styles.menuItemSubtitle}>Come back soon. We'll miss you.</Text>
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
            © 2026 TOHFA Market. All rights reserved. App Version 1.0.0
          </Text>
        </View>

        {/* Bottom spacing for floating button */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* ── FLOATING ACTIVE PROFILE BUTTON (EXACT FIGMA SPEC) ────────────────── */}
      <View style={styles.floatingButtonWrap} pointerEvents="box-none">
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.floatingProfileButton, customerShadow.raised]}
          accessibilityLabel="Active Profile"
        >
          <ProfileBadgeSvg color="#FFFFFF" size={26} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: customerColors.canvas,
  },
  container: {
    flex: 1,
    backgroundColor: customerColors.canvas,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // ── BANNER STYLES ──────────────────────────────────────────────────────────
  bannerWrapper: {
    width: '100%',
    height: 230,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    paddingTop: Platform.OS === 'android' ? 36 : 14,
    paddingHorizontal: customerSpacing.base,
    paddingBottom: customerSpacing.base,
    justifyContent: 'space-between',
    backgroundColor: '#EDF5EB',
  },
  bannerImageStyle: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1A2E1A',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  profileInfoContainer: {
    maxWidth: '65%',
    marginTop: customerSpacing.xs,
  },
  userNameText: {
    fontSize: 26,
    color: '#1A2E1A',
    fontFamily: customerFonts.editorial,
  },
  userPhoneText: {
    fontSize: 13,
    color: '#1A2E1A',
    fontFamily: customerFonts.regular,
    marginTop: 4,
  },
  userEmailText: {
    fontSize: 13,
    color: '#1A2E1A',
    fontFamily: customerFonts.regular,
    marginTop: 2,
  },
  viewProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  viewProfileText: {
    fontSize: 11,
    color: '#1A2E1A',
    fontFamily: customerFonts.regular,
  },

  // ── 3 SUMMARY CARDS ROW ────────────────────────────────────────────────────
  cardsRow: {
    flexDirection: 'row',
    paddingHorizontal: customerSpacing.base,
    marginTop: customerSpacing.base,
    gap: customerSpacing.sm,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: customerColors.selected, // #E9F7E9 soft green
    borderRadius: customerRadius.sm, // 12
    paddingVertical: 14,
    paddingHorizontal: customerSpacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCardIcon: {
    width: 30,
    height: 30,
    marginBottom: 6,
  },
  summaryCardSubtitle: {
    fontSize: 10,
    fontWeight: '500',
    color: customerColors.muted,
    fontFamily: customerFonts.regular,
    textAlign: 'center',
  },
  walletBalanceSubtitle: {
    color: customerColors.brand,
    fontWeight: '700',
  },
  summaryCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: customerColors.heading,
    fontFamily: customerFonts.bold,
    marginTop: 2,
    textAlign: 'center',
  },

  // ── MENU LIST SECTION ──────────────────────────────────────────────────────
  menuContainer: {
    marginTop: customerSpacing.md,
    paddingHorizontal: customerSpacing.base,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoutIconBox: {
    backgroundColor: customerColors.status.danger.bg, // #FEE4E2
  },
  menuTextColumn: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: customerColors.body,
    fontFamily: customerFonts.semibold,
  },
  logoutText: {
    color: customerColors.error,
  },
  menuItemSubtitle: {
    fontSize: 11,
    fontWeight: '400',
    color: customerColors.muted,
    fontFamily: customerFonts.regular,
    marginTop: 2,
  },
  walletPill: {
    backgroundColor: customerColors.selected,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: customerRadius.pill,
    marginRight: 8,
  },
  walletPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: customerColors.brand,
    fontFamily: customerFonts.semibold,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: customerColors.divider,
    marginLeft: 50,
  },

  // ── FOOTER BRANDING ────────────────────────────────────────────────────────
  footerContainer: {
    marginTop: customerSpacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: customerSpacing.base,
  },
  footerLogo: {
    width: 90,
    height: 36,
  },
  footerCopyright: {
    fontSize: 10,
    color: customerColors.muted,
    fontFamily: customerFonts.regular,
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
    backgroundColor: customerColors.brand,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
