import React, { useState } from 'react';
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

interface M5S14Props {
  orderId?: string;
  initialStep?: 'details' | 'confirm' | 'dispatched';
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

function QuestionCircleOrangeIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#C2410C" strokeWidth="2" />
      <Path
        d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"
        stroke="#C2410C"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function DeliveryTruckWhiteIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="1" y="3" width="14" height="13" rx="1" stroke="#FFFFFF" strokeWidth="2" />
      <Path d="M15 8h4l3 3v5h-7V8z" stroke="#FFFFFF" strokeWidth="2" strokeLinejoin="round" />
      <Circle cx="5.5" cy="18.5" r="2.5" stroke="#FFFFFF" strokeWidth="2" />
      <Circle cx="18.5" cy="18.5" r="2.5" stroke="#FFFFFF" strokeWidth="2" />
    </Svg>
  );
}

function DeliveryTruckGreenIcon() {
  return (
    <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
      <Rect x="1" y="3" width="14" height="13" rx="1" stroke="#10B981" strokeWidth="2" />
      <Path d="M15 8h4l3 3v5h-7V8z" stroke="#10B981" strokeWidth="2" strokeLinejoin="round" />
      <Circle cx="5.5" cy="18.5" r="2.5" stroke="#10B981" strokeWidth="2" />
      <Circle cx="18.5" cy="18.5" r="2.5" stroke="#10B981" strokeWidth="2" />
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

function HistoryClockWhiteIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke="#FFFFFF" strokeWidth="2" />
      <Path d="M12 7v5l3 3" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 16, color = '#1E1612' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export const M5S14_Dispatch: React.FC<M5S14Props> = ({
  orderId = 'ORD-1021',
  initialStep = 'details',
  onNavigate,
  onBack,
}) => {
  const [step, setStep] = useState<'details' | 'confirm' | 'dispatched'>(initialStep);

  // ─── STATE 3: Order Dispatched (Image 4) ──────────────────────────────────
  if (step === 'dispatched') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.7}
              onPress={() => setStep('confirm')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <BackArrowWhiteIcon />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Order Dispatched</Text>
          </View>

          <View style={styles.contentPacked}>
            {/* Centered Green Delivery Truck Hero matching Image 4 */}
            <View style={styles.heroContainer}>
              <View style={styles.successCircleBadge}>
                <DeliveryTruckGreenIcon />
              </View>
              <Text style={styles.heroTitle}>Order Dispatched</Text>
            </View>

            {/* Summary Card */}
            <View style={styles.card}>
              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Order</Text>
                  <Text style={styles.fieldValue}>{orderId}</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Status</Text>
                  <Text style={styles.fieldValue}>Dispatched</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Bottom Fixed Action Button matching Image 4 */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.primaryBtn}
              activeOpacity={0.8}
              onPress={() => onNavigate('M5S15', { orderId })}
            >
              <HistoryClockWhiteIcon />
              <Text style={styles.primaryBtnText}>View Status History</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── STATE 2: Confirm Dispatch (Image 3) ──────────────────────────────────
  if (step === 'confirm') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header matching Image 3 */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.7}
              onPress={() => setStep('details')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <BackArrowWhiteIcon />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Confirm Dispatch</Text>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Top Amber Alert Banner matching Image 3 */}
            <View style={styles.confirmPromptBox}>
              <QuestionCircleOrangeIcon />
              <Text style={styles.confirmPromptText}>Confirm Dispatch?</Text>
            </View>

            {/* Summary Card */}
            <View style={styles.card}>
              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Order</Text>
                  <Text style={styles.fieldValue}>{orderId}</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Destination</Text>
                  <Text style={styles.fieldValue}>Ooty Road, Coonoor</Text>
                </View>
              </View>

              <View style={[styles.singleRow, { marginTop: 14 }]}>
                <Text style={styles.fieldLabel}>Delivery Slot</Text>
                <Text style={styles.fieldValue}>AFTERNOON_12_4</Text>
              </View>
            </View>

            <View style={{ height: 24 }} />
          </ScrollView>

          {/* Bottom Fixed Action Button matching Image 3 */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.primaryBtn}
              activeOpacity={0.8}
              onPress={() => setStep('dispatched')}
            >
              <CheckmarkWhiteIcon />
              <Text style={styles.primaryBtnText}>Confirm Dispatch</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── STATE 1: Dispatch Details (Image 2) ──────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header matching Image 2 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={onBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <BackArrowWhiteIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dispatch</Text>
        </View>

        {/* Subtitle directly below header */}
        <View style={styles.subtitleRow}>
          <Text style={styles.subtitleText}>{orderId} · Ready for Dispatch</Text>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Section 1: Order Summary */}
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.card}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Customer</Text>
                <Text style={styles.fieldValue}>Divya R.</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Items</Text>
                <Text style={styles.fieldValue}>4</Text>
              </View>
            </View>

            <View style={[styles.singleRow, { marginTop: 14 }]}>
              <Text style={styles.fieldLabel}>Delivery Address</Text>
              <Text style={styles.fieldValue}>Ooty Road, Coonoor</Text>
            </View>

            <View style={[styles.singleRow, { marginTop: 14 }]}>
              <Text style={styles.fieldLabel}>Delivery Slot</Text>
              <Text style={styles.fieldValue}>AFTERNOON_12_4</Text>
            </View>
          </View>

          {/* Section 2: Delivery Partner */}
          <Text style={styles.sectionTitle}>Delivery Partner</Text>

          {/* Assignment Card */}
          <View style={[styles.card, { marginTop: 8 }]}>
            <Text style={styles.fieldLabel}>Assignment</Text>
            <TouchableOpacity style={styles.dropdownBtn} activeOpacity={0.8}>
              <Text style={styles.dropdownValueText}>Select delivery person</Text>
              <ChevronDownIcon size={16} color="#1E1612" />
            </TouchableOpacity>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* Bottom Fixed Action Button matching Image 2 */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.8}
            onPress={() => setStep('confirm')}
          >
            <DeliveryTruckWhiteIcon />
            <Text style={styles.primaryBtnText}>Confirm Dispatch</Text>
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
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 6,
  },
  dropdownValueText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1D2420',
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
    marginTop: 8,
    marginBottom: 16,
  },
  confirmPromptText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 14.5,
    fontWeight: '700',
    color: '#9A3412',
  },
  bottomBar: {
    backgroundColor: '#FAF8F5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EFECE6',
  },
  primaryBtn: {
    backgroundColor: '#E85226',
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Dispatched screen
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
});
