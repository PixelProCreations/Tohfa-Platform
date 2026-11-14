import React, { useState, useEffect, useRef } from 'react';
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
  Modal,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import {
  customerColors,
  customerFonts,
  customerShadow,
  customerSpacing,
} from '../theme';
import { ArrowRightFigmaIcon } from '../components/ArrowRightFigmaIcon';
import branchLeavesTopLeft from '../assets/images/branch_leaves_top_left.png';

const GreenFloatingLeaf = () => (
  <View style={styles.floatingLeafBottomRight} pointerEvents="none">
    <Svg width={52} height={68} viewBox="0 0 52 68" fill="none">
      <Path
        d="M6 62C12 38 30 12 48 6C52 26 42 52 18 65C12 68 8 66 6 62z"
        fill="#4CAF50"
        opacity={0.85}
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

interface CustomerOtpScreenProps {
  mobile?: string;
  onNavigate: (screen: 'CustomerProfileName' | 'CustomerLogin', params?: { mobile?: string }) => void;
}

export const CustomerOtpScreen: React.FC<CustomerOtpScreenProps> = ({
  mobile = '9090202033',
  onNavigate,
}) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const [timerSeconds, setTimerSeconds] = useState(28);
  const [showVerifiedModal, setShowVerifiedModal] = useState(false);
  const inputRefs = useRef<Array<any>>([]);

  useEffect(() => {
    if (timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timerSeconds]);

  const handlePinChange = (text: string, index: number) => {
    const cleanText = text.replace(/[^0-9]/g, '');
    const newPin = [...pin];
    newPin[index] = cleanText.slice(-1);
    setPin(newPin);

    // Auto advance focus to next input slot
    if (cleanText && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleNext = () => {
    // Show the "Phone number Verified!" dialog matching Figma design
    setShowVerifiedModal(true);
  };

  const handleContinue = () => {
    setShowVerifiedModal(false);
    onNavigate('CustomerProfileName', { mobile });
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />

      {/* Decorative leaf branch top-left */}
      <Image
        source={branchLeavesTopLeft}
        style={styles.branchTopLeft}
        resizeMode="contain"
      />
      {/* Decorative floating leaf bottom-right */}
      <GreenFloatingLeaf />

      <KeyboardAvoidingView
        style={styles.contentWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Main Card (389 x 243 Hug from Figma) */}
        <View style={styles.card}>
          <Text style={styles.title}>Please enter 4-digit PIN Sent to</Text>

          {/* Mobile number with Edit link */}
          <View style={styles.phoneEditRow}>
            <Text style={styles.phoneText}>+91 {mobile}</Text>
            <Text style={styles.bullet}> • </Text>
            <TouchableOpacity onPress={() => onNavigate('CustomerLogin')}>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>

          {/* 4 PIN Underline Input Slots */}
          <View style={styles.pinRow}>
            {[0, 1, 2, 3].map((index) => {
              const isFilled = (pin[index] || '').length > 0;
              return (
                <View key={index} style={styles.pinBox}>
                  <TextInput
                    ref={(ref) => {
                      inputRefs.current[index] = ref;
                    }}
                    style={styles.pinInput}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={pin[index]}
                    onChangeText={text => handlePinChange(text, index)}
                    onKeyPress={e => handleKeyPress(e, index)}
                    textAlign="center"
                    autoFocus={index === 0}
                  />
                  <View
                    style={[
                      styles.pinUnderline,
                      isFilled && styles.pinUnderlineFilled,
                    ]}
                  />
                </View>
              );
            })}
          </View>

          {/* Resend Timer Text */}
          <View style={styles.resendRow}>
            <Text style={styles.resendText}>
              Didn't receive the PIN? Resend in{' '}
              <Text style={styles.timerHighlight}>{timerSeconds}s</Text>
            </Text>
          </View>

          {/* Circular Action Button - Green in Figma */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleNext}
            style={[styles.circularButton, styles.circularButtonActive, customerShadow.raised]}
            accessibilityRole="button"
            accessibilityLabel="Verify PIN"
          >
            <ArrowRightFigmaIcon size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* ── PHONE NUMBER VERIFIED POPUP MODAL (FIGMA PARITY) ────────────────── */}
      <Modal visible={showVerifiedModal} transparent={true} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.verifiedCard}>
            {/* Top Right Close Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleContinue}
              style={styles.modalCloseBtn}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>

            {/* Verified Envelope Graphic */}
            <View style={styles.verifiedGraphicWrap}>
              <View style={styles.envelopeBackdrop}>
                <View style={styles.letterSheet} />
                <View style={styles.envelopeFlap} />
                <View style={styles.checkmarkBadge}>
                  <Text style={styles.checkmarkIcon}>✓</Text>
                </View>
              </View>
            </View>

            {/* Headline & Subtitle */}
            <Text style={styles.verifiedTitle}>Phone number Verified!</Text>
            <Text style={styles.verifiedSubtitle}>
              Your phone number has been successfully verified. You can now enjoy all features of TOHFA Market.
            </Text>

            {/* Continue Full-Width Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleContinue}
              style={styles.continueButton}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    top: 24,
    left: -4,
    width: 80,
    height: 145,
    zIndex: 1,
  },
  floatingLeafBottomRight: {
    position: 'absolute',
    bottom: 40,
    right: 14,
    width: 80,
    height: 110,
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
    fontSize: 27,
    lineHeight: 34,
    color: customerColors.brand,
    textAlign: 'center',
    marginBottom: 8,
  },
  phoneEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
  },
  phoneText: {
    fontFamily: customerFonts.regular,
    fontSize: 15,
    color: customerColors.body,
    letterSpacing: 0.3,
  },
  bullet: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  editText: {
    fontFamily: customerFonts.semibold,
    fontSize: 14,
    color: customerColors.brand,
  },
  pinRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    width: '100%',
    maxWidth: 280,
    marginBottom: 20,
  },
  pinBox: {
    flex: 1,
    alignItems: 'center',
  },
  pinInput: {
    width: '100%',
    fontSize: 24,
    fontFamily: customerFonts.bold,
    color: customerColors.body,
    paddingVertical: 8,
    textAlign: 'center',
  },
  pinUnderline: {
    width: '100%',
    height: 1.5,
    backgroundColor: '#D1D5DB',
  },
  pinUnderlineFilled: {
    backgroundColor: customerColors.brand,
    height: 2,
  },
  resendRow: {
    marginBottom: 32,
    alignItems: 'center',
  },
  resendText: {
    fontFamily: customerFonts.regular,
    fontSize: 13,
    color: '#4B5563',
  },
  timerHighlight: {
    color: customerColors.brand,
    fontFamily: customerFonts.semibold,
  },
  circularButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularButtonActive: {
    backgroundColor: customerColors.brand,
  },
  arrowText: {
    color: '#FFFFFF',
    fontSize: 26,
    lineHeight: 28,
    fontWeight: '700',
  },
  homeIndicator: {
    width: 134,
    height: 5,
    backgroundColor: '#000000',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 8,
  },

  // ── MODAL STYLES (MATCHING FIGMA EXACTLY) ─────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  verifiedCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  },
  modalCloseText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '700',
  },
  verifiedGraphicWrap: {
    width: 90,
    height: 75,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  envelopeBackdrop: {
    width: 80,
    height: 60,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  letterSheet: {
    position: 'absolute',
    top: -12,
    width: 52,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  envelopeFlap: {
    position: 'absolute',
    bottom: 0,
    width: 80,
    height: 38,
    backgroundColor: '#388E3C',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  checkmarkBadge: {
    position: 'absolute',
    top: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 5,
  },
  checkmarkIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 18,
  },
  verifiedTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 22,
    lineHeight: 28,
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  verifiedSubtitle: {
    fontFamily: customerFonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 6,
  },
  continueButton: {
    width: '100%',
    backgroundColor: customerColors.brand,
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontFamily: customerFonts.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
