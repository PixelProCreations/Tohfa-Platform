import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { SWA_TYPOGRAPHY } from '../constants';

interface M5S08BProps {
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

function BigGreenCheckSuccessIcon() {
  return (
    <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#10B981" strokeWidth="2" />
      <Path
        d="M8 12l2.5 2.5L16 9.5"
        stroke="#10B981"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PersonCheckWhiteIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="8.5" cy="7" r="4" stroke="#FFFFFF" strokeWidth="2" />
      <Path
        d="M17 11l2 2 4-4"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export const M5S08B_OrderPacked: React.FC<M5S08BProps> = ({
  orderId = 'ORD-1024',
  onNavigate,
  onBack,
}) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header matching Image 3 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={onBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <BackArrowWhiteIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Packed</Text>
        </View>

        <View style={styles.contentPacked}>
          {/* Centered Hero Checkmark matching Image 3 */}
          <View style={styles.heroContainer}>
            <View style={styles.successCircleBadge}>
              <BigGreenCheckSuccessIcon />
            </View>
            <Text style={styles.heroTitle}>Order Packed</Text>
          </View>

          {/* Summary Card */}
          <View style={styles.packedSummaryCard}>
            <View style={styles.packedSummaryCol}>
              <Text style={styles.summaryLabel}>Order</Text>
              <Text style={styles.summaryValue}>{orderId}</Text>
            </View>
            <View style={styles.packedSummaryCol}>
              <Text style={styles.summaryLabel}>Packed at</Text>
              <Text style={styles.summaryValue}>11:15 AM</Text>
            </View>
          </View>
        </View>

        {/* Bottom Stacked Buttons matching Image 3 */}
        <View style={styles.bottomBarPacked}>
          <TouchableOpacity
            style={styles.pickupBtn}
            activeOpacity={0.8}
            onPress={() => onNavigate('M5S09', { orderId })}
          >
            <PersonCheckWhiteIcon />
            <Text style={styles.pickupBtnText}>Mark Ready for Pickup</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dispatchBtn}
            activeOpacity={0.8}
            onPress={() => onNavigate('M5S13', { orderId })}
          >
            <Text style={styles.dispatchBtnText}>Prepare for Dispatch (Delivery)</Text>
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
  contentPacked: {
    flex: 1,
    paddingTop: 36,
    paddingHorizontal: 16,
  },
  heroContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  successCircleBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#E8F8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 19,
    fontWeight: '700',
    color: '#1D2420',
  },
  packedSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  packedSummaryCol: {
    flex: 1,
  },
  summaryLabel: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 11.5,
    fontWeight: '500',
    color: '#78716C',
    marginBottom: 4,
  },
  summaryValue: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: '#1D2420',
  },
  bottomBarPacked: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#EFECE6',
  },
  pickupBtn: {
    backgroundColor: '#E85226',
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  pickupBtnText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dispatchBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E85226',
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dispatchBtnText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 14.5,
    fontWeight: '700',
    color: '#E85226',
  },
});
