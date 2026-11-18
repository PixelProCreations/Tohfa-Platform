import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  StatusBar,
  BackHandler,
} from 'react-native';
import { customerFonts } from '../theme/index';

import customerSplashClean from '../assets/images/customer_splash_clean.png';
import customerWelcomeSlide1Full from '../assets/images/customer_welcome_slide1_full.png';
import onboardingSlide1CleanExact from '../assets/images/onboarding_slide1_clean_exact.png';
import onboardingSlide2CleanExact from '../assets/images/onboarding_slide2_clean_exact.png';

interface CustomerWelcomeScreenProps {
  onNavigate: (screen: 'RoleSelection' | 'Login' | 'CustomerLogin') => void;
}

export const CustomerWelcomeScreen: React.FC<CustomerWelcomeScreenProps> = ({ onNavigate }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSplash, setIsSplash] = useState(true);

  // Animation values
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const contentFade = useRef(new Animated.Value(0)).current;

  // Auto transition from Left Splash Screen to Right Onboarding Screen after 1.2s
  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        setIsSplash(false);
        Animated.timing(contentFade, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }).start();
      });
    }, 1200);

    return () => clearTimeout(timer);
  }, [splashOpacity, contentFade]);

  // Hardware back button navigation across slides
  useEffect(() => {
    const onBackPress = () => {
      if (currentSlide > 0) {
        setCurrentSlide(prev => prev - 1);
        return true;
      }
      onNavigate('RoleSelection');
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [currentSlide, onNavigate]);

  const handleNext = () => {
    if (currentSlide < 2) {
      setCurrentSlide(prev => prev + 1);
    } else {
      // Completed full customer onboarding flow: navigate to customer login screen
      onNavigate('CustomerLogin');
    }
  };

  return (
    <View style={styles.container}>
      {/* Hide status bar symbols across customer onboarding flow */}
      <StatusBar hidden={true} />

      {/* ── SCREEN 1: CUSTOMER SPLASH ────────────────────────────────────────── */}
      {isSplash && (
        <Animated.View style={[styles.splashContainer, { opacity: splashOpacity }]}>
          <Image
            source={customerSplashClean}
            style={styles.splashImageFull}
            resizeMode="cover"
          />
        </Animated.View>
      )}

      {/* ── ONBOARDING CAROUSEL (EXACT PREVIOUS FIGMA PARITY) ────────────────── */}
      {!isSplash && (
        <Animated.View style={[styles.onboardingContainer, { opacity: contentFade }]}>
          {/* ── SLIDE 0: SCREEN 2 · WELCOME SCREEN ─────────────────────────── */}
          {currentSlide === 0 && (
            <View style={styles.slideFullWhite}>
              <Image
                source={customerWelcomeSlide1Full}
                style={styles.slide0ExactImage}
                resizeMode="cover"
              />
              {/* Pagination dots (pointerEvents="box-none" so it never blocks button) */}
              <View style={styles.slide0DotsRow} pointerEvents="box-none">
                <TouchableOpacity
                  style={styles.slide0DotHit}
                  onPress={() => setCurrentSlide(0)}
                  accessibilityLabel="Slide 1"
                />
                <TouchableOpacity
                  style={styles.slide0DotHit}
                  onPress={() => setCurrentSlide(1)}
                  accessibilityLabel="Slide 2"
                />
                <TouchableOpacity
                  style={styles.slide0DotHit}
                  onPress={() => setCurrentSlide(2)}
                  accessibilityLabel="Slide 3"
                />
              </View>
              {/* Full bottom-right touch target over Figma Next button */}
              <TouchableOpacity
                activeOpacity={0.6}
                onPress={handleNext}
                style={styles.slide0NextButton}
                hitSlop={{ top: 40, bottom: 40, left: 40, right: 40 }}
                accessibilityRole="button"
                accessibilityLabel="Next Step"
              />
            </View>
          )}

          {/* ── SLIDE 1: SCREEN 3 · ONBOARDING 1 (SAFE, ORGANIC AND TRUSTED) ── */}
          {currentSlide === 1 && (
            <View style={styles.slideFullIvory}>
              <Image
                source={onboardingSlide1CleanExact}
                style={styles.slide0ExactImage}
                resizeMode="cover"
              />
              {/* Pagination dots (pointerEvents="box-none") */}
              <View style={styles.slide0DotsRow} pointerEvents="box-none">
                <TouchableOpacity
                  style={styles.slide0DotHit}
                  onPress={() => setCurrentSlide(0)}
                  accessibilityLabel="Slide 1"
                />
                <TouchableOpacity
                  style={styles.slide0DotHit}
                  onPress={() => setCurrentSlide(1)}
                  accessibilityLabel="Slide 2"
                />
                <TouchableOpacity
                  style={styles.slide0DotHit}
                  onPress={() => setCurrentSlide(2)}
                  accessibilityLabel="Slide 3"
                />
              </View>
              {/* Full bottom-right touch target over Figma Next button */}
              <TouchableOpacity
                activeOpacity={0.6}
                onPress={handleNext}
                style={styles.slide0NextButton}
                hitSlop={{ top: 40, bottom: 40, left: 40, right: 40 }}
                accessibilityRole="button"
                accessibilityLabel="Next Step"
              />
            </View>
          )}

          {/* ── SLIDE 2: SCREEN 4 · ONBOARDING 2 (ORDER, WE SOURCE, WE DELIVER) ─ */}
          {currentSlide === 2 && (
            <View style={styles.slideFullIvory}>
              <Image
                source={onboardingSlide2CleanExact}
                style={styles.slide0ExactImage}
                resizeMode="cover"
              />
              {/* Pagination dots */}
              <View style={styles.slide2DotsRow} pointerEvents="box-none">
                <TouchableOpacity
                  style={styles.slide0DotHit}
                  onPress={() => setCurrentSlide(0)}
                  accessibilityLabel="Slide 1"
                />
                <TouchableOpacity
                  style={styles.slide0DotHit}
                  onPress={() => setCurrentSlide(1)}
                  accessibilityLabel="Slide 2"
                />
                <TouchableOpacity
                  style={styles.slide0DotHit}
                  onPress={() => setCurrentSlide(2)}
                  accessibilityLabel="Slide 3"
                />
              </View>
              {/* Native, crisp 'Get Started →' button */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleNext}
                style={styles.slide2GetStartedButton}
                accessibilityRole="button"
                accessibilityLabel="Get Started"
              >
                <Text style={styles.slide2GetStartedText}>Get Started →</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // ── SPLASH SCREEN STYLES ──────────────────────────────────────────────────
  splashContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  splashImageFull: {
    width: '100%',
    height: '100%',
  },

  // ── ONBOARDING SCREEN STYLES ──────────────────────────────────────────────
  onboardingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
  },
  slideFullWhite: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  slideFullIvory: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: '#F4F5F0',
    position: 'relative',
  },
  slide0ExactImage: {
    width: '100%',
    height: '100%',
  },
  slide0NextButton: {
    position: 'absolute',
    right: 0,
    bottom: 24,
    width: 150,
    height: 180,
    zIndex: 999,
  },
  slide0DotsRow: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    zIndex: 50,
  },
  slide0DotHit: {
    width: 36,
    height: 36,
  },
  slide2GetStartedButton: {
    position: 'absolute',
    bottom: 42,
    left: 24,
    right: 24,
    height: 52,
    backgroundColor: '#2E7D32',
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    zIndex: 999,
  },
  slide2GetStartedText: {
    color: '#FFFFFF',
    fontFamily: customerFonts.semibold,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  slide2DotsRow: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 128,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    zIndex: 50,
  },
});
