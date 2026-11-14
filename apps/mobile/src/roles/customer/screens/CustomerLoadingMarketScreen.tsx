import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  StatusBar,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import {
  customerColors,
  customerFonts,
} from '../theme';
import tohfaMarketLogo from '../assets/images/tohfa_market_logo.png';

interface CustomerLoadingMarketScreenProps {
  onNavigate: (screen: 'CustomerMain') => void;
}

// ── SVG ICONS MATCHING FIGMA SPEC (IMAGE 2) ─────────────────────────────────

// Detailed Leafy Greens / Celery / Coriander herb icon
const DetailedCeleryHerbIcon = () => (
  <Svg width={36} height={36} viewBox="0 0 36 36" fill="none">
    {/* Central and side stems */}
    <Path
      d="M18 31V16M18 24C14 20 10 19 8 16M18 21C22 18 26 17 28 14"
      stroke="#4CAF50"
      strokeWidth={1.8}
      strokeLinecap="round"
    />
    {/* Top ruffled leaf cluster */}
    <Path
      d="M18 16C16 13 14 10 15 7C17 5 19 6 18 9C20 6 23 7 22 10C21 13 19 14 18 16Z"
      stroke="#4CAF50"
      strokeWidth={1.6}
      strokeLinejoin="round"
      fill="#C8E6C9"
      fillOpacity={0.6}
    />
    {/* Left leaf cluster */}
    <Path
      d="M8 16C6 14 5 11 7 9C9 8 10 10 10 12C11 9 14 10 13 13C12 15 10 16 8 16Z"
      stroke="#4CAF50"
      strokeWidth={1.5}
      strokeLinejoin="round"
      fill="#C8E6C9"
      fillOpacity={0.5}
    />
    {/* Right leaf cluster */}
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

// Orange Fruit with Leaf + Sliced Citrus Wedge (with pulp segments)
const DetailedOrangeWithSliceIcon = () => (
  <Svg width={46} height={46} viewBox="0 0 46 46" fill="none">
    {/* Orange body */}
    <Circle cx={19} cy={26} r={14} stroke="#2E7D32" strokeWidth={2.2} />
    {/* Leaf at top */}
    <Path
      d="M19 12C20 8 24 6 28 7C28 11 25 14 21 13"
      stroke="#2E7D32"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="#81C784"
    />
    <Path d="M21 13L25 9.5" stroke="#2E7D32" strokeWidth={1.4} strokeLinecap="round" />

    {/* Sliced citrus wedge on right */}
    <Path
      d="M25 21C33 22 38 27 37 35C30 36 24 31 25 21Z"
      stroke="#2E7D32"
      strokeWidth={2.2}
      strokeLinejoin="round"
      fill="#E8F5E9"
    />
    {/* Pulp segment lines inside wedge */}
    <Path
      d="M27 24C31 25 35 29 34 33M28 27L32 30M30 25L33 28"
      stroke="#2E7D32"
      strokeWidth={1.5}
      strokeLinecap="round"
    />
  </Svg>
);

// Smooth Oval Egg Outline
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

export const CustomerLoadingMarketScreen: React.FC<CustomerLoadingMarketScreenProps> = ({ onNavigate }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Gentle pulse on center card
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
      ])
    ).start();

    const timer = setTimeout(() => {
      onNavigate('CustomerMain');
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />

      <Animated.View style={[styles.centeredContainer, { opacity: fadeAnim }]}>
        {/* ── TOP SECTION: TOHFA LOGO + FROM OUR FARMERS TO YOUR HOME ─────── */}
        <View style={styles.topSection}>
          <Image
            source={tohfaMarketLogo}
            style={styles.logoImage}
            resizeMode="contain"
          />

          <View style={styles.titleRow}>
            <View style={styles.decorativeLine} />
            <Text style={styles.editorialTitle}>From Our Farmers to</Text>
            <View style={styles.decorativeLine} />
          </View>
          <Text style={styles.editorialTitleSecond}>Your Home</Text>
        </View>

        {/* ── CENTER LOADING BOX (254 Hug x 129.89 Hug FROM FIGMA) ────────── */}
        <View style={styles.loadingBox}>
          {/* 3 Cards Row */}
          <View style={styles.cardsRow}>
            {/* Left Card: Faded Leafy Herb */}
            <View style={styles.sideCard}>
              <DetailedCeleryHerbIcon />
            </View>

            {/* Center Active Card: Light green background with Orange/Slice */}
            <Animated.View style={[styles.centerActiveCard, { transform: [{ scale: pulseAnim }] }]}>
              <DetailedOrangeWithSliceIcon />
            </Animated.View>

            {/* Right Card: Faded Egg */}
            <View style={styles.sideCard}>
              <DetailedEggIcon />
            </View>
          </View>

          {/* Loading Text */}
          <Text style={styles.loadingText}>Loading your fresh market</Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  centeredContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 44,
    width: '100%',
    paddingHorizontal: 20,
  },
  logoImage: {
    width: 170,
    height: 76,
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  decorativeLine: {
    width: 36,
    height: 2,
    backgroundColor: '#4CAF50',
    marginHorizontal: 12,
    borderRadius: 1,
  },
  editorialTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 24,
    color: customerColors.brand,
    textAlign: 'center',
  },
  editorialTitleSecond: {
    fontFamily: customerFonts.editorial,
    fontSize: 24,
    color: customerColors.brand,
    textAlign: 'center',
    marginTop: 4,
  },

  // ── LOADING BOX (EXACT 254 x 130 HUG FROM FIGMA) ─────────────────────────
  loadingBox: {
    width: 254,
    alignItems: 'center',
    justifyContent: 'center',
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
});
