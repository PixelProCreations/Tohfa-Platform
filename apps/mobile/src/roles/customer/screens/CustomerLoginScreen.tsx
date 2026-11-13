import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ScreenStatusBar } from '@tohfa/mobile-ui';
import {
  customerColors,
  customerFonts,
  customerShadow,
  customerSpacing,
} from '../theme';
import { ArrowRightFigmaIcon } from '../components/ArrowRightFigmaIcon';
import branchLeavesTopLeft from '../assets/images/branch_leaves_top_left.png';

interface CustomerLoginScreenProps {
  onNavigate: (screen: 'CustomerOtp' | 'RoleSelection' | 'CustomerWelcome', params?: { mobile?: string }) => void;
}

const GreenFloatingLeaf = () => (
  <View style={styles.floatingLeafRight} pointerEvents="none">
    <Svg width={54} height={70} viewBox="0 0 52 68" fill="none">
      <Path
        d="M6 62C12 38 30 12 48 6C52 26 42 52 18 65C12 68 8 66 6 62z"
        fill="#4CAF50"
        opacity={0.9}
      />
      <Path
        d="M6 62C18 46 32 30 48 6"
        stroke="#81C784"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  </View>
);

export const CustomerLoginScreen: React.FC<CustomerLoginScreenProps> = ({ onNavigate }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [agreed, setAgreed] = useState(false);

  const cleanPhone = phoneNumber.replace(/\D/g, '');

  const handleNext = () => {
    const targetPhone = cleanPhone.length === 10 ? cleanPhone : '9090202033';
    onNavigate('CustomerOtp', { mobile: targetPhone });
  };

  return (
    <View style={styles.container}>
      {/* Edge-to-edge transparent status bar, status bar hidden */}
      <ScreenStatusBar translucent={true} backgroundColor="transparent" barStyle="dark-content" />
      <StatusBar hidden={true} translucent={true} backgroundColor="transparent" barStyle="dark-content" />

      {/* Decorative foliage assets from Figma */}
      <Image
        source={branchLeavesTopLeft}
        style={styles.branchTopLeft}
        resizeMode="contain"
      />
      <GreenFloatingLeaf />

      <KeyboardAvoidingView
        style={styles.contentWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Main Card (389 x 241 Hug from Figma) */}
        <View style={styles.card}>
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>Let's get you Stated</Text>

          {/* Underline Phone Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.phoneInput}
              placeholder="Please enter phone number"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              maxLength={10}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              textAlign="center"
              autoFocus={true}
            />
            <View style={styles.underline} />
          </View>

          {/* Terms Agreement Checkbox */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setAgreed(prev => !prev)}
            style={styles.checkboxRow}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: agreed }}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.termsText} numberOfLines={1}>
              I agree to terms and conditions
            </Text>
          </TouchableOpacity>

          {/* Circular Action Button - ALWAYS Green in Figma */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleNext}
            style={[styles.circularButton, styles.circularButtonActive, customerShadow.raised]}
            accessibilityRole="button"
            accessibilityLabel="Continue to PIN Verification"
          >
            <ArrowRightFigmaIcon size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Bottom Home Indicator */}
      <View style={styles.homeIndicator} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  branchTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 88,
    height: 155,
    zIndex: 1,
  },
  floatingLeafRight: {
    position: 'absolute',
    top: '46%',
    right: 0,
    zIndex: 1,
  },
  contentWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: customerSpacing[24],
    zIndex: 2,
  },
  card: {
    width: '100%',
    maxWidth: 389,
    alignItems: 'center',
  },
  title: {
    fontFamily: customerFonts.editorial,
    fontSize: 34,
    lineHeight: 42,
    color: customerColors.brand,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontFamily: customerFonts.regular,
    fontSize: 16,
    lineHeight: 22,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 36,
  },
  inputContainer: {
    width: 280,
    marginBottom: 24,
    alignSelf: 'center',
  },
  phoneInput: {
    fontFamily: customerFonts.regular,
    fontSize: 16,
    color: customerColors.body,
    paddingVertical: 8,
    textAlign: 'center',
    width: '100%',
  },
  underline: {
    height: 1,
    backgroundColor: '#E5E7EB',
    width: '100%',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
    gap: 8,
    alignSelf: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: customerColors.brand,
    borderColor: customerColors.brand,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginTop: -2,
  },
  termsText: {
    fontFamily: customerFonts.regular,
    fontSize: 14,
    color: customerColors.body,
  },
  circularButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularButtonActive: {
    backgroundColor: customerColors.brand,
  },
  circularButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  homeIndicator: {
    width: 134,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#000000',
    opacity: 0.8,
    alignSelf: 'center',
    marginBottom: 8,
  },
});
