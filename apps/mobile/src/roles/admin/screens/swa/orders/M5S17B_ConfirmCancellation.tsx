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
import { SWA_TYPOGRAPHY } from '../constants';

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
        stroke="#C2410C"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 9v4M12 17h.01" stroke="#C2410C" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function InfoCircleRedIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#DC2626" strokeWidth="2" />
      <Path d="M12 16v-4M12 8h.01" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
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

        {/* Bottom Stacked Buttons matching Image 4 Right */}
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
    backgroundColor: '#FAF8F5',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  header: {
    backgroundColor: '#E85226',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
  },
  backButton: {
    marginRight: 14,
    padding: 2,
  },
  headerTitle: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 18,
    fontWeight: '700',
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
    backgroundColor: '#FEF9EE',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  confirmPromptText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 14.5,
    fontWeight: '700',
    color: '#9A3412',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 16,
  },
  fieldLabel: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 11.5,
    fontWeight: '500',
    color: '#78716C',
    marginBottom: 4,
  },
  fieldValueBold: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    color: '#1D2420',
  },
  redAlertBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  redAlertText: {
    flex: 1,
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 11.5,
    fontWeight: '600',
    color: '#B91C1C',
    lineHeight: 16,
  },
  bottomBarStacked: {
    backgroundColor: '#FAF8F5',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#EFECE6',
  },
  confirmCancelBtn: {
    backgroundColor: '#E85226',
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  confirmCancelBtnText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  keepOrderBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keepOrderBtnText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
});
