import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Polygon, Rect } from 'react-native-svg';

import { t } from '../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../theme';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronRightIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReceiptIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={color}>
      <Path d="M240-80q-50 0-85-35t-35-85v-120h120v-560l60 60 60-60 60 60 60-60 60 60 60-60 60 60 60-60 60 60 60-60v680q0 50-35 85t-85 35H240Zm480-80q17 0 28.5-11.5T760-200v-560H320v440h360v120q0 17 11.5 28.5T720-160ZM360-600v-80h240v80H360Zm0 120v-80h240v80H360Zm320-120q-17 0-28.5-11.5T640-640q0-17 11.5-28.5T680-680q17 0 28.5 11.5T720-640q0 17-11.5 28.5T680-600Zm0 120q-17 0-28.5-11.5T640-520q0-17 11.5-28.5T680-560q17 0 28.5 11.5T720-520q0 17-11.5 28.5T680-480ZM240-160h360v-80H200v40q0 17 11.5 28.5T240-160Zm-40 0v-80 80Z" />
    </Svg>
  );
}

function LeafIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 4c-9.5 0-16 6.5-16 16 9.5 0 16-6.5 16-16z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M4 20c4-4 8-8 10-10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function StoreIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9l2-5h14l2 5M3 9a3 3 0 006 0 3 3 0 006 0 3 3 0 006 0M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M9 21v-7h6v7"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function StarIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.5l2.9 6.2 6.8.9-5 4.8 1.3 6.8-6-3.3-6 3.3 1.3-6.8-5-4.8 6.8-.9L12 2.5z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function GavelIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Sound block base at bottom left */}
      <Rect x="3.5" y="19.2" width="8.8" height="2.2" rx="0.4" fill={color} />
      {/* Upper slanted mallet block */}
      <Polygon points="3.0,8.0 9.8,1.2 11.8,3.2 5.0,10.0" fill={color} />
      {/* Lower slanted mallet block (parallel) */}
      <Polygon points="5.8,10.8 12.6,4.0 14.6,6.0 7.8,12.8" fill={color} />
      {/* Mallet handle pointing down-right */}
      <Polygon points="10.4,10.2 12.0,8.6 19.8,16.4 18.2,18.0" fill={color} />
    </Svg>
  );
}

function FarmersManagementIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="1.9" />
      <Path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CommunityIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="1.8" />
      <Path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.85" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function ProfileIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.8" />
      <Path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function BellIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function HeadsetSupportIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 18v-6a9 9 0 0118 0v6"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3v5zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3v5z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SwitchArrowsIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 7h16M16 3l4 4-4 4"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20 17H4M8 13l-4 4 4 4"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface FarmerAdminMoreScreenProps {
  onBack: () => void;
  onNavigatePurchases?: () => void;
  onNavigateInputsPest?: () => void;
  onNavigateMarketPricing?: () => void;
  onNavigateProduceListings?: () => void;
  onNavigateFarmerRatings?: () => void;
  onNavigateDisputes?: () => void;
  onNavigateProfile: () => void;
  onNavigateFarmerSupport?: () => void;
  onNavigateNotifications: () => void;
  onSwitchRole: () => void;
  onItemSelect?: (itemTitle: string) => void;
}

export function FarmerAdminMoreScreen({
  onBack,
  onNavigatePurchases,
  onNavigateInputsPest,
  onNavigateMarketPricing,
  onNavigateProduceListings,
  onNavigateFarmerRatings,
  onNavigateDisputes,
  onNavigateProfile,
  onNavigateFarmerSupport,
  onNavigateNotifications,
  onSwitchRole,
  onItemSelect,
}: FarmerAdminMoreScreenProps) {
  const menuItems = [
    {
      id: 'purchases',
      title: t('farmerAdminMore.menu.purchases'),
      icon: <ReceiptIcon size={20} />,
      onPress: () => {
        if (onNavigatePurchases) {
          onNavigatePurchases();
        } else if (onNavigateProduceListings) {
          onNavigateProduceListings();
        }
      },
    },
    {
      id: 'inputs',
      title: t('farmerAdminMore.menu.inputsPests'),
      icon: <LeafIcon size={20} />,
      onPress: () => {
        if (onNavigateInputsPest) {
          onNavigateInputsPest();
        } else {
          onItemSelect?.('Inputs & Pest Management');
        }
      },
    },
    {
      id: 'market',
      title: t('farmerAdminMore.menu.marketPricing'),
      icon: <StoreIcon size={20} />,
      onPress: () => {
        if (onNavigateMarketPricing) {
          onNavigateMarketPricing();
        } else {
          onItemSelect?.('Market & Pricing');
        }
      },
    },
    {
      id: 'ratings',
      title: t('farmerAdminMore.menu.ratings'),
      icon: <StarIcon size={20} />,
      onPress: () => {
        if (onNavigateFarmerRatings) {
          onNavigateFarmerRatings();
        } else {
          onItemSelect?.('Ratings');
        }
      },
    },
    {
      id: 'disputes',
      title: 'Disputes',
      icon: <GavelIcon size={20} />,
      onPress: () => {
        if (onNavigateDisputes) {
          onNavigateDisputes();
        } else {
          onItemSelect?.('Disputes');
        }
      },
    },
    {
      id: 'community',
      title: 'Community',
      icon: <CommunityIcon size={20} />,
      onPress: () => onItemSelect?.('Community'),
    },
    {
      id: 'profile',
      title: 'Profile',
      icon: <ProfileIcon size={20} />,
      onPress: onNavigateProfile,
    },
    {
      id: 'farmer_support',
      title: 'Farmer Support',
      icon: <HeadsetSupportIcon size={20} />,
      onPress: () => {
        if (onNavigateFarmerSupport) {
          onNavigateFarmerSupport();
        } else {
          onItemSelect?.('Farmer Support');
        }
      },
    },
    {
      id: 'notifications',
      title: t('farmerAdminNotifications.title'),
      icon: <BellIcon size={20} />,
      onPress: onNavigateNotifications,
    },
    {
      id: 'switch_role',
      title: 'Switch Role',
      icon: <SwitchArrowsIcon size={20} />,
      onPress: onSwitchRole,
    },
  ];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={24} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('farmerAdminMore.title')}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuCard}
            onPress={item.onPress}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={item.title}
          >
            <View style={styles.leftCol}>
              <View style={styles.iconBox}>{item.icon}</View>
              <Text style={styles.menuTitle}>{item.title}</Text>
            </View>
            <ChevronRightIcon size={18} />
          </TouchableOpacity>
        ))}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stylesheet ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.2,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xxl,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
  },
  iconBox: {
    width: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  bottomSpacer: {
    height: adminSpacing.xxl,
  },
});
