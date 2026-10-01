import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { SWA_TYPOGRAPHY } from '../constants';

interface M5S10Props {
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

function InfoCircleBlueIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#2563EB" strokeWidth="2" />
      <Path d="M12 16v-4M12 8h.01" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function NumericKeypadIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="4" width="20" height="16" rx="3" stroke="#FFFFFF" strokeWidth="2" />
      <Path d="M6 9h1M6 12h1M6 15h1M11 9h2M11 12h2M11 15h2M17 9h1M17 12h1M17 15h1" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export const M5S10_PickupVerification: React.FC<M5S10Props> = ({
  orderId = 'ORD-1024',
  onNavigate,
  onBack,
}) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header - Orange Theme matching Image 2 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={onBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <BackArrowWhiteIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pickup Verification</Text>
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
          {/* Section 1: Customer */}
          <Text style={styles.sectionTitle}>Customer</Text>
          <View style={styles.card}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Customer</Text>
                <Text style={styles.fieldValue}>Arun Kumar</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Phone</Text>
                <Text style={styles.fieldValue}>+91 XXXXX XXXXX</Text>
              </View>
            </View>
          </View>

          {/* Section 2: Order Summary */}
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.card}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Items</Text>
                <Text style={styles.fieldValue}>4 Items</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Total</Text>
                <Text style={styles.fieldValue}>₹850</Text>
              </View>
            </View>

            <View style={[styles.singleRow, { marginTop: 14 }]}>
              <Text style={styles.fieldLabel}>Pickup Warehouse</Text>
              <Text style={styles.fieldValue}>Coonoor</Text>
            </View>
          </View>

          {/* Section 3: Customer Verification */}
          <Text style={styles.sectionTitle}>Customer Verification</Text>

          {/* Blue Info Alert Box */}
          <View style={styles.infoBox}>
            <InfoCircleBlueIcon />
            <Text style={styles.infoText}>
              Ask the customer to confirm the Order ID and their name before continuing to OTP.
            </Text>
          </View>

          {/* Verification Details Card */}
          <View style={[styles.card, { marginTop: 12 }]}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Order ID</Text>
                <Text style={styles.fieldValue}>{orderId}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Customer Name</Text>
                <Text style={styles.fieldValue}>Arun Kumar</Text>
              </View>
            </View>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* Bottom Fixed Action Button matching Image 2 */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.continueBtn}
            activeOpacity={0.8}
            onPress={() => onNavigate('M5S11', { orderId })}
          >
            <NumericKeypadIcon />
            <Text style={styles.continueBtnText}>Continue to OTP</Text>
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
  subtitleRow: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: '#FAF8F5',
  },
  subtitleText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#8C7A6B',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: '#1D2420',
    marginTop: 16,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 16,
  },
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
  },
  singleRow: {},
  fieldLabel: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 11.5,
    fontWeight: '500',
    color: '#78716C',
    marginBottom: 3,
  },
  fieldValue: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: '#1D2420',
  },
  infoBox: {
    backgroundColor: '#EBF5FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 11.5,
    fontWeight: '600',
    color: '#1E40AF',
    lineHeight: 16,
  },
  bottomBar: {
    backgroundColor: '#FAF8F5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EFECE6',
  },
  continueBtn: {
    backgroundColor: '#E85226',
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueBtnText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
