import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { ORDERS_THEME } from './theme';

interface M5S17BProps {
  orderId?: string;
  onNavigate: (screen: string, params?: any) => void;
  onBack: () => void;
}

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

function WarningTriangleOrangeIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        stroke={ORDERS_THEME.warning}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 9v4M12 17h.01" stroke={ORDERS_THEME.warning} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function InfoCircleRedIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={ORDERS_THEME.danger} strokeWidth="2" />
      <Path d="M12 16v-4M12 8h.01" stroke={ORDERS_THEME.danger} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CheckmarkWhiteIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export const M5S17B_ConfirmCancellation: React.FC<M5S17BProps> = ({
  orderId = 'ORD-1024',
  onNavigate,
  onBack,
}) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={onBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <BackArrowWhiteIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Confirm Cancellation</Text>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Amber Alert Banner */}
          <View style={styles.confirmPromptBox}>
            <WarningTriangleOrangeIcon />
            <Text style={styles.confirmPromptText}>Cancel this order?</Text>
          </View>

          {/* Order Card */}
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Order</Text>
            <Text style={styles.fieldValueBold}>{orderId}</Text>
          </View>

          {/* Red Notice Box */}
          <View style={[styles.redAlertBox, { marginTop: 14 }]}>
            <InfoCircleRedIcon />
            <Text style={styles.redAlertText}>
              This action cannot be undone. No refund logic is created here unless the payment/refund service supports it.
            </Text>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* Bottom Stacked Buttons */}
        <View style={styles.bottomBarStacked}>
          <TouchableOpacity
            style={styles.confirmCancelBtn}
            activeOpacity={0.8}
            onPress={() => onNavigate('M5S17C', { orderId })}
          >
            <CheckmarkWhiteIcon />
            <Text style={styles.confirmCancelBtnText}>Cancel Order</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.keepOrderBtn}
            activeOpacity={0.8}
            onPress={onBack}
          >
            <Text style={styles.keepOrderBtnText}>Keep Order</Text>
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
    paddingBottom: 16,
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
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  confirmPromptBox: {
    backgroundColor: ORDERS_THEME.warningBg,
    borderWidth: 1,
    borderColor: ORDERS_THEME.border,
    borderRadius: ORDERS_THEME.radiusMD,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  confirmPromptText: {
    fontFamily: 'Poppins',
    fontSize: 14.5,
    fontWeight: '700',
    color: ORDERS_THEME.warning,
  },
  card: {
    backgroundColor: ORDERS_THEME.cardBg,
    borderRadius: ORDERS_THEME.radiusLG,
    borderWidth: 1,
    borderColor: ORDERS_THEME.border,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  fieldLabel: {
    fontFamily: 'Poppins',
    fontSize: 11.5,
    fontWeight: '500',
    color: ORDERS_THEME.textSecondary,
    marginBottom: 4,
  },
  fieldValueBold: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '800',
    color: ORDERS_THEME.textInk,
  },
  redAlertBox: {
    backgroundColor: ORDERS_THEME.dangerBg,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: ORDERS_THEME.radiusMD,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  redAlertText: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 11.5,
    fontWeight: '600',
    color: ORDERS_THEME.danger,
    lineHeight: 16,
  },
  bottomBarStacked: {
    backgroundColor: ORDERS_THEME.pageBg,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: ORDERS_THEME.border,
  },
  confirmCancelBtn: {
    backgroundColor: ORDERS_THEME.primary,
    borderRadius: ORDERS_THEME.radiusLG,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
    shadowColor: ORDERS_THEME.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  confirmCancelBtnText: {
    fontFamily: 'Poppins',
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  keepOrderBtn: {
    backgroundColor: ORDERS_THEME.cardBg,
    borderWidth: 1,
    borderColor: ORDERS_THEME.border,
    borderRadius: ORDERS_THEME.radiusLG,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keepOrderBtnText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '700',
    color: ORDERS_THEME.textInk,
  },
});
