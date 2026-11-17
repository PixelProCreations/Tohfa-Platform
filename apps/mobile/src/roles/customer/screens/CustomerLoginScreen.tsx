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
import { ScreenStatusBar } from '@tohfa/mobile-ui';
import {
  customerColors,
  customerFonts,
  customerSpacing,
} from '../theme';
import { ArrowRightFigmaIcon } from '../components/ArrowRightFigmaIcon';
import {
  customerLoginBranchTopLeft,
  customerLoginRightLeaves,
} from '../assets/images';

interface CustomerLoginScreenProps {
  onNavigate: (
    screen: 'CustomerOtp' | 'RoleSelection' | 'CustomerWelcome',
    params?: { mobile?: string }
  ) => void;
}

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
      {/* Edge-to-edge transparent status bar matching Figma spec */}
      <ScreenStatusBar translucent={true} backgroundColor="transparent" barStyle="dark-content" />
      <StatusBar hidden={false} barStyle="dark-content" />

      {/* Decorative top-left branch foliage from Figma */}
      <Image
        source={customerLoginBranchTopLeft}
        style={styles.branchTopLeft}
        resizeMode="contain"
        pointerEvents="none"
      />

      <KeyboardAvoidingView
        style={styles.contentWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Main Card (Horizontally & vertically centered) */}
        <View style={styles.card}>
          {/* Right floating leaves positioned beside Welcome Back header */}
          <Image
            source={customerLoginRightLeaves}
            style={styles.floatingLeafRight}
            resizeMode="contain"
            pointerEvents="none"
          />

          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>Let's get you Stated</Text>

          {/* Underline Phone Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.phoneInput}
              placeholder="Please enter phone number"
              placeholderTextColor="#A0A7B1"
              keyboardType="phone-pad"
              maxLength={10}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              textAlign="center"
              autoFocus={false}
            />
            <View style={styles.underline} />
          </View>

          {/* Terms Agreement Checkbox with green border matching Figma */}
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

          {/* Circular Action Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleNext}
            style={styles.circularButton}
            accessibilityRole="button"
            accessibilityLabel="Continue to PIN Verification"
          >
            <ArrowRightFigmaIcon size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEFDFB',
    position: 'relative',
  },
  branchTopLeft: {
    position: 'absolute',
    top: 60,
    left: 0,
    width: 68,
    height: 98,
    zIndex: 1,
  },
  floatingLeafRight: {
    position: 'absolute',
    top: -6,
    right: 0,
    width: 44,
    height: 55,
    zIndex: 1,
  },
  contentWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: customerSpacing[20],
    zIndex: 2,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    position: 'relative',
  },
  title: {
    fontFamily: customerFonts.editorial,
    fontSize: 22,
    lineHeight: 28,
    color: customerColors.brand,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontFamily: customerFonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  inputContainer: {
    width: '100%',
    maxWidth: 290,
    marginBottom: 20,
    alignSelf: 'center',
  },
  phoneInput: {
    fontFamily: customerFonts.regular,
    fontSize: 15,
    color: customerColors.body,
    paddingVertical: 8,
    textAlign: 'center',
    width: '100%',
  },
  underline: {
    height: 1,
    backgroundColor: '#EBEBEB',
    width: '100%',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    gap: 8,
    alignSelf: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: customerColors.brand,
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
    fontSize: 11,
    fontWeight: '700',
    marginTop: -1,
  },
  termsText: {
    fontFamily: customerFonts.regular,
    fontSize: 13,
    color: '#1F2937',
  },
  circularButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: customerColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
});
