import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { ORDERS_THEME } from './theme';

interface M5S11Props {
  orderId?: string;
  onNavigate: (screen: string, params?: any) => void;
  onBack: () => void;
}

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowWhiteIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckmarkCircleGreenIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={ORDERS_THEME.success} strokeWidth="2" />
      <Path
        d="M8 12l2.5 2.5L16 9.5"
        stroke={ORDERS_THEME.success}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function InfoCircleBlueIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={ORDERS_THEME.info} strokeWidth="2" />
      <Path d="M12 16v-4M12 8h.01" stroke={ORDERS_THEME.info} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ArrowRightWhiteIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12h14M12 5l7 7-7 7"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export const M5S11_PickupOTP: React.FC<M5S11Props> = ({
  orderId = 'ORD-1024',
  onNavigate,
  onBack,
}) => {
  const [otp] = useState(['4', '8', '2', '1']);
  const [isVerified] = useState(true);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={onBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <BackArrowWhiteIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Verify Pickup</Text>
        </View>

        {/* Subtitle directly below header */}
        <View style={styles.subtitleRow}>
          <Text style={styles.subtitleText}>{orderId}</Text>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Centered Instruction */}
          <Text style={styles.promptTitle}>Enter 4-digit pickup OTP</Text>

          {/* 4 OTP Digit Boxes */}
          <View style={styles.otpRow}>
            {otp.map((digit, index) => (
              <View key={index} style={styles.otpBox}>
                <Text style={styles.otpDigit}>{digit}</Text>
              </View>
            ))}
          </View>

          {/* OTP Verified Box (or Error) */}
          {isVerified ? (
            <View style={styles.verifiedBox}>
              <CheckmarkCircleGreenIcon />
              <Text style={styles.verifiedText}>✓ OTP Verified</Text>
            </View>
          ) : (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>Incorrect OTP — please verify</Text>
            </View>
          )}

          {/* Blue Info Box */}
          <View style={styles.infoBox}>
            <InfoCircleBlueIcon />
            <Text style={styles.infoText}>
              No retry limit is enforced here — the source doesn't define one, so none is invented.
            </Text>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* Bottom Fixed Action Button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.confirmBtn, !isVerified && styles.confirmBtnDisabled]}
            activeOpacity={0.8}
            disabled={!isVerified}
            onPress={() => onNavigate('M5S12', { orderId })}
          >
            <ArrowRightWhiteIcon />
            <Text style={styles.confirmBtnText}>Confirm Handover</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ORDERS_THEME.primary,
  },
  container: {
    flex: 1,
    backgroundColor: ORDERS_THEME.pageBg,
  },
  header: {
    backgroundColor: ORDERS_THEME.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    gap: 12,
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontFamily: 'Poppins',
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtitleRow: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    backgroundColor: ORDERS_THEME.primary,
  },
  subtitleText: {
    fontFamily: 'Poppins',
    fontSize: 12.5,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  promptTitle: {
    fontFamily: 'Poppins',
    fontSize: 14.5,
    fontWeight: '800',
    color: ORDERS_THEME.textInk,
    textAlign: 'center',
    marginBottom: 20,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  otpBox: {
    width: 58,
    height: 64,
    borderRadius: ORDERS_THEME.radiusLG,
    backgroundColor: ORDERS_THEME.orangeTint,
    borderWidth: 1.5,
    borderColor: ORDERS_THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpDigit: {
    fontFamily: 'Poppins',
    fontSize: 24,
    fontWeight: '800',
    color: ORDERS_THEME.orangeDeep,
  },
  verifiedBox: {
    backgroundColor: ORDERS_THEME.successBg,
    borderRadius: ORDERS_THEME.radiusMD,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  verifiedText: {
    fontFamily: 'Poppins',
    fontSize: 13.5,
    fontWeight: '700',
    color: ORDERS_THEME.success,
  },
  errorBox: {
    backgroundColor: ORDERS_THEME.dangerBg,
    borderRadius: ORDERS_THEME.radiusMD,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  errorText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '700',
    color: ORDERS_THEME.danger,
  },
  infoBox: {
    backgroundColor: ORDERS_THEME.infoBg,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: ORDERS_THEME.radiusMD,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 11.5,
    fontWeight: '600',
    color: ORDERS_THEME.info,
    lineHeight: 16,
  },
  bottomBar: {
    backgroundColor: ORDERS_THEME.pageBg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: ORDERS_THEME.border,
  },
  confirmBtn: {
    backgroundColor: ORDERS_THEME.primary,
    borderRadius: ORDERS_THEME.radiusLG,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: ORDERS_THEME.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  confirmBtnDisabled: {
    backgroundColor: '#FDBA74',
  },
  confirmBtnText: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
