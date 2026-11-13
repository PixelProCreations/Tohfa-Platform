import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  TextInput,
  Platform,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { customerColors, customerFonts, customerShadow } from '../theme';

export type CustomerActiveTab = 'home' | 'search' | 'cart' | 'profile';

interface CustomerFloatingNavProps {
  activeTab: CustomerActiveTab;
  onTabChange: (tab: CustomerActiveTab) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSearchSubmit?: () => void;
  cartBadgeCount?: number;
}

// ── SVG ICONS ───────────────────────────────────────────────────────────────

const HomeSvg = ({ color = '#FFFFFF', size = 22 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6h-4v6H4a1 1 0 01-1-1v-9.5z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SearchSvg = ({ color = '#FFFFFF', size = 22 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={11} cy={11} r={7} stroke={color} strokeWidth={2} />
    <Path d="M21 21l-4.35-4.35" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const CartSvg = ({ color = '#FFFFFF', size = 22 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={10} cy={20} r={1.5} fill={color} />
    <Circle cx={18} cy={20} r={1.5} fill={color} />
  </Svg>
);

const ProfileSvg = ({ color = '#FFFFFF', size = 22 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={2} />
    <Circle cx={12} cy={9} r={3.5} stroke={color} strokeWidth={1.8} />
    <Path d="M6.5 18.5a6.5 6.5 0 0111 0" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const CloseSvg = ({ color = '#FFFFFF', size = 20 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 6L6 18M6 6l12 12"
      stroke={color}
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Dynamic Floating Navigation matching Figma 60 Hug x 246 spec (Image 3 & 4).
 * Expands vertically into a clean stack of circular buttons (Profile, Cart, Search, Close),
 * and supports expanding the horizontal search bar when Search is active.
 */
export const CustomerFloatingNav: React.FC<CustomerFloatingNavProps> = ({
  activeTab,
  onTabChange,
  searchQuery = '',
  onSearchChange,
  onSearchSubmit,
  cartBadgeCount = 0,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);

  const toggleMenu = () => {
    if (isSearchActive) {
      setIsSearchActive(false);
      onTabChange('home');
      setIsOpen(false);
      return;
    }
    setIsOpen(prev => !prev);
  };

  const handleSelectTab = (tab: CustomerActiveTab) => {
    if (tab === 'search') {
      setIsSearchActive(true);
      setIsOpen(false);
      onTabChange('search');
    } else {
      setIsSearchActive(false);
      setIsOpen(false);
      onTabChange(tab);
    }
  };

  const renderActiveFabIcon = () => {
    if (isOpen || isSearchActive) {
      return <CloseSvg color="#FFFFFF" size={22} />;
    }
    switch (activeTab) {
      case 'home':
        return <HomeSvg color="#FFFFFF" size={24} />;
      case 'search':
        return <SearchSvg color="#FFFFFF" size={22} />;
      case 'cart':
        return <CartSvg color="#FFFFFF" size={22} />;
      case 'profile':
        return <ProfileSvg color="#FFFFFF" size={24} />;
      default:
        return <HomeSvg color="#FFFFFF" size={24} />;
    }
  };

  return (
    <View style={styles.floatingNavContainer} pointerEvents="box-none">
      {/* ── EXPANDED SEARCH BAR ROW (WHEN SEARCH IS ACTIVE - IMAGE 4) ───────── */}
      {isSearchActive && (
        <View style={styles.searchBarRow}>
          <View style={[styles.searchPill, customerShadow.raised]}>
            <SearchSvg color="#9CA3AF" size={18} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for fresh vegetables..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={onSearchChange}
              onSubmitEditing={onSearchSubmit}
              autoFocus={true}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => onSearchChange?.('')} style={styles.clearBtn}>
                <CloseSvg color="#9CA3AF" size={14} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* ── VERTICAL STACK OF CIRCULAR BUTTONS (WHEN OPEN - 60 Hug x 246 FIGMA) ─ */}
      {isOpen && (
        <View style={styles.verticalStack}>
          {/* 1. Profile Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleSelectTab('profile')}
            style={[
              styles.circleButton,
              activeTab === 'profile' && styles.circleButtonActive,
              customerShadow.raised,
            ]}
            accessibilityLabel="Profile"
          >
            <ProfileSvg
              color={activeTab === 'profile' ? '#FFFFFF' : '#1F2937'}
              size={22}
            />
          </TouchableOpacity>

          {/* 2. Cart Button with optional Badge */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleSelectTab('cart')}
            style={[
              styles.circleButton,
              activeTab === 'cart' && styles.circleButtonActive,
              customerShadow.raised,
            ]}
            accessibilityLabel="Shopping Cart"
          >
            <CartSvg
              color={activeTab === 'cart' ? '#FFFFFF' : '#1F2937'}
              size={20}
            />
            {cartBadgeCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartBadgeCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* 3. Search Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleSelectTab('search')}
            style={[
              styles.circleButton,
              activeTab === 'search' && styles.circleButtonActive,
              customerShadow.raised,
            ]}
            accessibilityLabel="Search"
          >
            <SearchSvg
              color={activeTab === 'search' ? '#FFFFFF' : '#1F2937'}
              size={20}
            />
          </TouchableOpacity>

          {/* 4. Home Button (when away from home) */}
          {activeTab !== 'home' && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleSelectTab('home')}
              style={[
                styles.circleButton,
                styles.circleButtonActive,
                customerShadow.raised,
              ]}
              accessibilityLabel="Home"
            >
              <HomeSvg color="#FFFFFF" size={22} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── MAIN FLOATING GREEN ACTION BUTTON (FAB) ─────────────────────────── */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={toggleMenu}
        style={[styles.mainFabButton, customerShadow.raised]}
        accessibilityRole="button"
        accessibilityLabel={isOpen ? 'Close menu' : 'Open navigation menu'}
      >
        {renderActiveFabIcon()}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingNavContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'android' ? 24 : 32,
    right: 20,
    alignItems: 'flex-end',
    zIndex: 9999,
  },
  mainFabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: customerColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  verticalStack: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  circleButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    elevation: 4,
  },
  circleButtonActive: {
    backgroundColor: customerColors.brand,
    borderColor: customerColors.brand,
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: customerFonts.bold,
  },

  // ── SEARCH BAR PILL ROW (IMAGE 4) ─────────────────────────────────────────
  searchBarRow: {
    position: 'absolute',
    bottom: 0,
    right: 68,
    left: -280,
    height: 56,
    justifyContent: 'center',
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    height: 52,
    borderRadius: 26,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: customerColors.brand,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontFamily: customerFonts.regular,
    fontSize: 14,
    color: '#1F2937',
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 6,
  },
});
