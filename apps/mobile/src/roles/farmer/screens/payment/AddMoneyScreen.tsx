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
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
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

function ExternalLinkIcon({ size = 16, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function QrCodeIcon({ size = 18, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <Rect x="5.5" y="5.5" width="2" height="2" fill={color} />
      <Rect x="14" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <Rect x="16.5" y="5.5" width="2" height="2" fill={color} />
      <Rect x="3" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <Rect x="5.5" y="16.5" width="2" height="2" fill={color} />
      <Rect x="14" y="14" width="3" height="3" fill={color} />
      <Rect x="18" y="14" width="3" height="3" fill={color} />
      <Rect x="14" y="18" width="3" height="3" fill={color} />
      <Rect x="18" y="18" width="3" height="3" fill={color} />
    </Svg>
  );
}

function InfoCircleIcon({ size = 16, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.8" />
      <Line x1="12" y1="16" x2="12" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="12" cy="8" r="1" fill={color} />
    </Svg>
  );
}

export interface AddMoneyScreenProps {
  currentBalance?: string;
  onClose?: () => void;
  onSuccess?: () => void;
  onNavigateToCashTopUp?: (data: { amount: string; referenceCode: string }) => void;
}

export function AddMoneyScreen({
  currentBalance = '₹4,250',
  onClose,
  onSuccess,
  onNavigateToCashTopUp,
}: AddMoneyScreenProps): React.JSX.Element {
  const [amount, setAmount] = useState('2,000');
  const [method, setMethod] = useState<'Razorpay' | 'Cash'>('Cash');

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

  const handleAction = () => {
    if (method === 'Cash') {
      if (onNavigateToCashTopUp) {
        onNavigateToCashTopUp({
          amount: amount || '2,000',
          referenceCode: 'CASH-TU-7734',
        });
      } else {
        Alert.alert(
          'Reference Code Generated',
          `Reference Code CASH-TU-7734 generated for ₹${amount}. Please deposit cash at any TOHFA warehouse.`,
          [
            {
              text: 'OK',
              onPress: () => {
                if (onSuccess) onSuccess();
                else if (onClose) onClose();
              },
            },
          ]
        );
      }
    } else {
      Alert.alert(
        'Razorpay Checkout',
        `Simulating secure payment of ₹${amount} via Razorpay (UPI / Cards / NetBanking). Amount will be credited to wallet immediately upon success.`,
        [
          {
            text: 'Complete Payment',
            onPress: () => {
              if (onSuccess) onSuccess();
              else if (onClose) onClose();
            },
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* Header */}
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
            <Text style={styles.headerTitle}>Add Money</Text>
            <Text style={styles.headerSubtitle}>Current balance: {currentBalance}</Text>
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
            <View style={styles.helperRow}>
              <InfoCircleIcon size={14} color={P.twGray500} />
              <Text style={styles.fieldHelper}>
                Entered manually — no preset or suggested amounts.
              </Text>
            </View>
          </View>

          {/* Add Money Via Toggle */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              Add Money Via <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View style={styles.methodToggleRow}>
              <TouchableOpacity
                style={[
                  styles.methodBtn,
                  method === 'Razorpay' ? styles.methodBtnActive : styles.methodBtnInactive,
                ]}
                onPress={() => setMethod('Razorpay')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.methodBtnText,
                    method === 'Razorpay'
                      ? styles.methodBtnTextActive
                      : styles.methodBtnTextInactive,
                  ]}
                >
                  Razorpay
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.methodBtn,
                  method === 'Cash' ? styles.methodBtnActive : styles.methodBtnInactive,
                ]}
                onPress={() => setMethod('Cash')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.methodBtnText,
                    method === 'Cash' ? styles.methodBtnTextActive : styles.methodBtnTextInactive,
                  ]}
                >
                  Cash at Warehouse
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.helperRow}>
              <View style={styles.helperIconBox}>
                <InfoCircleIcon size={14} color={P.twGray500} />
              </View>
              <Text style={styles.fieldHelperNote}>
                {method === 'Cash'
                  ? "You'll get a reference code to show at any TOHFA warehouse. Your wallet updates once staff manually confirm the cash payment — not instant."
                  : "You'll be redirected to Razorpay to complete your payment securely via UPI, Cards, or NetBanking."}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
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
          style={styles.payBtn}
          onPress={handleAction}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel={method === 'Cash' ? 'Generate Reference Code' : 'Pay via Razorpay'}
        >
          {method === 'Cash' ? (
            <QrCodeIcon size={18} color={P.white} />
          ) : (
            <ExternalLinkIcon size={16} color={P.white} />
          )}
          <Text style={styles.payBtnText}>
            {method === 'Cash' ? 'Generate Reference Code' : 'Pay via Razorpay'}
          </Text>
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
    paddingTop: Platform.OS === 'android' ? 8 : 6,
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
    fontSize: 18,
    fontWeight: '800',
    color: P.twGray900,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
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
    paddingTop: 22,
    paddingBottom: 32,
  },
  formContainer: {
    gap: 22,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: P.twGray900,
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
    paddingHorizontal: 16,
    height: 52,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: P.twGray900,
    marginRight: 12,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: P.twGray900,
    padding: 0,
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 2,
    gap: 6,
  },
  helperIconBox: {
    marginTop: 2,
  },
  fieldHelper: {
    fontSize: 12,
    color: P.twGray500,
    lineHeight: 16,
  },
  fieldHelperNote: {
    flex: 1,
    fontSize: 12,
    color: P.twGray500,
    lineHeight: 17,
  },
  methodToggleRow: {
    flexDirection: 'row',
    backgroundColor: P.mintTintBg,
    borderRadius: 10,
    padding: 4,
    gap: 4,
  },
  methodBtn: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  methodBtnActive: {
    backgroundColor: P.forestGreen,
  },
  methodBtnInactive: {
    backgroundColor: 'transparent',
  },
  methodBtnText: {
    fontSize: 13,
  },
  methodBtnTextActive: {
    color: P.white,
    fontWeight: '700',
  },
  methodBtnTextInactive: {
    color: P.twGray800,
    fontWeight: '600',
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
    borderRadius: 10,
    borderWidth: 1,
    borderColor: P.twGray300,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: P.twGray900,
  },
  payBtn: {
    flex: 2,
    height: 48,
    borderRadius: 10,
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
  payBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: P.white,
  },
});
