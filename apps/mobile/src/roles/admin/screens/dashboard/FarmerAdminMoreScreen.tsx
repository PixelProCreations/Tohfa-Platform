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
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { adminColors } from '../../theme';

// ─── Theme Colors ────────────────────────────────────────────────────────────
const THEME = {
  headerBg: adminColors.brand,
  white: adminColors.onBrand,
  canvas: adminColors.canvas,
  card: adminColors.card,
  border: adminColors.border,
  ink: adminColors.ink,
  iconColor: adminColors.brand,
  chevronColor: adminColors.muted,
};

// ─── SVG Icons Matching Exact Design Mockup ──────────────────────────────────

function BackArrowIcon({ size = 22, color = THEME.white }: { size?: number; color?: string }) {
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

function ChevronRightIcon({ size = 18, color = THEME.chevronColor }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// 1. Receipt Icon (Purchases) — Google Material Symbols receipt_long with curled bottom
function ReceiptIcon({ size = 20, color = THEME.iconColor }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={color}>
      <Path d="M240-80q-50 0-85-35t-35-85v-120h120v-560l60 60 60-60 60 60 60-60 60 60 60-60 60 60 60-60 60 60 60-60v680q0 50-35 85t-85 35H240Zm480-80q17 0 28.5-11.5T760-200v-560H320v440h360v120q0 17 11.5 28.5T720-160ZM360-600v-80h240v80H360Zm0 120v-80h240v80H360Zm320-120q-17 0-28.5-11.5T640-640q0-17 11.5-28.5T680-680q17 0 28.5 11.5T720-640q0 17-11.5 28.5T680-600Zm0 120q-17 0-28.5-11.5T640-520q0-17 11.5-28.5T680-560q17 0 28.5 11.5T720-520q0 17-11.5 28.5T680-480ZM240-160h360v-80H200v40q0 17 11.5 28.5T240-160Zm-40 0v-80 80Z" />
    </Svg>
  );
}

// 2. Leaf Icon (Inputs & Pest Management)
function LeafIcon({ size = 20, color = THEME.iconColor }: { size?: number; color?: string }) {
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

// 3. Store Icon (Market & Pricing)
function StoreIcon({ size = 20, color = THEME.iconColor }: { size?: number; color?: string }) {
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

// 4. Star Icon (Ratings)
function StarIcon({ size = 20, color = THEME.iconColor }: { size?: number; color?: string }) {
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

// 5. Gavel Icon (Disputes) — Clean wooden mallet & strike block
function GavelIcon({ size = 20, color = THEME.iconColor }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M13.5 4.5l6 6-2 2-6-6 2-2z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14.5 9.5l-8.5 8.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M3 21h6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// 6. Community Icon (Community) — Solid filled figures matching design
function CommunityIcon({ size = 20, color = THEME.iconColor }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="8.5" cy="8.5" r="2.8" fill={color} />
      <Path d="M3 18c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5" fill={color} />
      <Circle cx="15.5" cy="9.5" r="2.4" fill={color} />
      <Path d="M13 18c.4-2.2 2-3.8 4-3.8 2.3 0 4.2 1.7 4.5 3.8" fill={color} />
    </Svg>
  );
}

// 7. Profile Icon (Profile) — Outer avatar circle with user silhouette inside
function ProfileIcon({ size = 20, color = THEME.iconColor }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Circle cx="12" cy="9.5" r="2.8" stroke={color} strokeWidth="1.8" />
      <Path
        d="M7 17.5a5 5 0 0110 0"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// 8. Bell Icon (Notifications)
function BellIcon({ size = 20, color = THEME.iconColor }: { size?: number; color?: string }) {
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

// 9. Switch Arrows Icon (Switch Role) — Top points right, bottom points left
function SwitchArrowsIcon({ size = 20, color = THEME.iconColor }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Top arrow pointing RIGHT */}
      <Path
        d="M4 7h16M16 3l4 4-4 4"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bottom arrow pointing LEFT */}
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
  onNavigateProfile: () => void;
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
  onNavigateProfile,
  onNavigateNotifications,
  onSwitchRole,
  onItemSelect,
}: FarmerAdminMoreScreenProps) {
  const menuItems = [
    {
      id: 'purchases',
      title: 'Purchases',
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
      title: 'Inputs & Pest Management',
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
      title: 'Market & Pricing',
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
      title: 'Ratings',
      icon: <StarIcon size={20} />,
      onPress: () => onItemSelect?.('Ratings'),
    },
    {
      id: 'disputes',
      title: 'Disputes',
      icon: <GavelIcon size={20} />,
      onPress: () => onItemSelect?.('Disputes'),
    },
    {
      id: 'community',
      title: 'Community',
      icon: <CommunityIcon size={20} />,
      onPress: () => onItemSelect?.('Community'),
    },
    {
      id: 'profile',
      title: 'Profile', // Replaced Settings with Profile with avatar circle!
      icon: <ProfileIcon size={20} />,
      onPress: onNavigateProfile,
    },
    {
      id: 'notifications',
      title: 'Notifications',
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
      <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

      {/* ─── Header: Exactly Matching Screenshot 5 ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={24} color={THEME.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>More</Text>
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

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stylesheet Matching Screenshot 5 Exact UI ───────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.canvas,
  },
  header: {
    backgroundColor: THEME.headerBg,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.white,
    letterSpacing: -0.2,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconBox: {
    width: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: THEME.ink,
  },
});
