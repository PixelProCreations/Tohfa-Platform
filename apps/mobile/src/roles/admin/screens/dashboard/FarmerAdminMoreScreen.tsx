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

function SettingsGearIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.9" />
      <Path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke={color}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
  onNavigateSettingsAndProfile?: () => void;
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
  onNavigateSettingsAndProfile,
  onNavigateNotifications,
  onSwitchRole,
  onItemSelect,
}: FarmerAdminMoreScreenProps) {
  const menuItems = [
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
      id: 'settings_and_profile',
      title: 'Settings and Profile',
      icon: <SettingsGearIcon size={20} />,
      onPress: () => {
        if (onNavigateSettingsAndProfile) {
          onNavigateSettingsAndProfile();
        } else {
          onNavigateProfile();
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
