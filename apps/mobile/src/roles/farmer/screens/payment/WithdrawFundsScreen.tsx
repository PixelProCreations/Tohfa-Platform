import React, { useState, useEffect } from 'react';
import {
  Alert,
  BackHandler,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { authPalette as P } from '../../theme';

function CloseIcon({ size = 20, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6l12 12"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckmarkIcon({ size = 16, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 12l5 5L20 6"
        stroke={color}
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function InfoCircleIcon({ size = 16, color = P.twBlue700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.8" />
      <Line x1="12" y1="16" x2="12" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="12" cy="8" r="1" fill={color} />
    </Svg>
  );
}

export interface WithdrawFundsScreenProps {
  availableBalance?: string;
  onClose?: () => void;
  onRequestSuccess?: () => void;
}

export function WithdrawFundsScreen({
  availableBalance = '₹4,250',
  onClose,
  onRequestSuccess,
}: WithdrawFundsScreenProps): React.JSX.Element {
  const [amount, setAmount] = useState('4,250');
  const [method, setMethod] = useState<'Bank' | 'UPI'>('UPI');

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (onClose) {
        onClose();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [onClose]);

  const handleRequest = () => {
    Alert.alert(
      'Withdrawal Requested',
      `Your request to withdraw ₹${amount} via ${method} has been submitted. Funds will be credited after admin verification.`,
      [
        {
          text: 'OK',
          onPress: () => {
            if (onRequestSuccess) onRequestSuccess();
            else if (onClose) onClose();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* Header with Close Button */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <CloseIcon size={20} color={P.twGray800} />
          </TouchableOpacity>

          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTitle}>Withdraw Funds</Text>
            <Text style={styles.headerSubtitle}>Available: {availableBalance}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formContainer}>
          {/* Amount Field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              Amount <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View style={styles.amountInputRow}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={P.twGray400}
              />
            </View>
            <Text style={styles.fieldHelper}>
              Entered manually — no auto-fill to full balance.
            </Text>
          </View>

          {/* Payout Method Selector */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              Payout Method <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View style={styles.methodToggleRow}>
              <TouchableOpacity
                style={[styles.methodBtn, method === 'Bank' && styles.methodBtnActive]}
                onPress={() => setMethod('Bank')}
                activeOpacity={0.8}
              >
                <Text style={[styles.methodBtnText, method === 'Bank' && styles.methodBtnTextActive]}>
                  Bank
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.methodBtn, method === 'UPI' && styles.methodBtnActive]}
                onPress={() => setMethod('UPI')}
                activeOpacity={0.8}
              >
                <Text style={[styles.methodBtnText, method === 'UPI' && styles.methodBtnTextActive]}>
                  UPI
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sending To Preview */}
          <View style={styles.destinationCard}>
            <Text style={styles.destLabel}>Sending to</Text>
            <Text style={styles.destValue}>
              {method === 'UPI' ? 'murugan.r@okhdfcbank' : 'HDFC Bank • • • • 4821'}
            </Text>
          </View>

          {/* Policy Notice */}
          <View style={styles.policyBanner}>
            <View style={styles.policyIconCol}>
              <InfoCircleIcon size={16} color={P.twBlue700} />
            </View>
            <Text style={styles.policyText}>
              Payouts above ₹10,000 require additional TOHFA approval and may take longer to process.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={onClose}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleRequest}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel="Request Withdrawal"
        >
          <CheckmarkIcon size={16} color={P.white} />
          <Text style={styles.actionBtnText}>Request Withdrawal</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.white,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 6 : 4,
    paddingBottom: 14,
    backgroundColor: P.white,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: P.twGray900,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    color: P.twGray500,
    marginTop: 2,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: P.white,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  formContainer: {
    gap: 18,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: P.twGray700,
  },
  requiredStar: {
    color: P.twRed600,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: P.twGray300,
    borderRadius: 12,
    backgroundColor: P.white,
    paddingHorizontal: 14,
    height: 48,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: P.twGray700,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: P.twGray900,
    padding: 0,
  },
  fieldHelper: {
    fontSize: 12,
    color: P.twGray500,
    marginTop: 3,
  },
  methodToggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  methodBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: P.twGray300,
    backgroundColor: P.twGray50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodBtnActive: {
    backgroundColor: P.forestGreen,
    borderColor: P.forestGreen,
  },
  methodBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: P.twGray700,
  },
  methodBtnTextActive: {
    color: P.white,
    fontWeight: '700',
  },
  destinationCard: {
    backgroundColor: P.twGray50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: 14,
  },
  destLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: P.twGray500,
    marginBottom: 4,
  },
  destValue: {
    fontSize: 14.5,
    fontWeight: '700',
    color: P.twGray900,
  },
  policyBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: P.twBlue50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.twSky200,
    padding: 12,
  },
  policyIconCol: {
    marginRight: 8,
    marginTop: 2,
  },
  policyText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: P.twBlue800,
    fontWeight: '500',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'android' ? 16 : 12,
    borderTopWidth: 1,
    borderTopColor: P.twGray100,
    backgroundColor: P.white,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.twGray300,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: P.twGray700,
  },
  actionBtn: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    backgroundColor: P.forestGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: P.forestGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: P.white,
  },
});
