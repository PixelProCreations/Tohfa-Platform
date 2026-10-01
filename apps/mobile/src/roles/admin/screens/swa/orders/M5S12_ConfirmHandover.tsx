import React, { useState } from 'react';
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

interface M5S12Props {
  orderId?: string;
  initialCompleted?: boolean;
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

function DocumentWhiteIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export const M5S12_ConfirmHandover: React.FC<M5S12Props> = ({
  orderId = 'ORD-1024',
  initialCompleted = false,
  onNavigate,
  onBack,
}) => {
  const [completed, setCompleted] = useState(initialCompleted);

  // ─── STATE 2: Pickup Completed Screen (Image 5) ───────────────────────────
  if (completed) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.7}
              onPress={() => setCompleted(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <BackArrowWhiteIcon />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Pickup Completed</Text>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Centered Hero Checkmark matching Image 5 */}
            <View style={styles.heroContainer}>
              <View style={styles.successCircleBadge}>
                <BigGreenCheckSuccessIcon />
              </View>
              <Text style={styles.heroTitle}>Pickup Completed</Text>
            </View>

            {/* Card 1: Order & Completed At */}
            <View style={styles.card}>
              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Order</Text>
                  <Text style={styles.fieldValue}>{orderId}</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Completed</Text>
                  <Text style={styles.fieldValue}>24 Sep · 12:20 PM</Text>
                </View>
              </View>
            </View>

            {/* Section: Final Information */}
            <Text style={styles.sectionTitle}>Final Information</Text>
            <View style={styles.card}>
              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Customer</Text>
                  <Text style={styles.fieldValue}>Arun Kumar</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Items</Text>
                  <Text style={styles.fieldValue}>4</Text>
                </View>
              </View>

              <View style={[styles.twoColRow, { marginTop: 14 }]}>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Payment</Text>
                  <Text style={styles.fieldValue}>Paid</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Warehouse</Text>
                  <Text style={styles.fieldValue}>Coonoor</Text>
                </View>
              </View>
            </View>

            <View style={{ height: 24 }} />
          </ScrollView>

          {/* Bottom Stacked Action Buttons matching Image 5 */}
          <View style={styles.bottomBarStacked}>
            <TouchableOpacity
              style={styles.viewOrderBtn}
              activeOpacity={0.8}
              onPress={() => onNavigate('M5S04', { orderId })}
            >
              <DocumentWhiteIcon />
              <Text style={styles.viewOrderBtnText}>View Order</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.viewInvoiceBtn}
              activeOpacity={0.8}
              onPress={() => onNavigate('M5S18', { orderId })}
            >
              <Text style={styles.viewInvoiceBtnText}>View Invoice</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── STATE 1: Confirm Handover Screen (Image 4) ───────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header matching Image 4 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={onBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <BackArrowWhiteIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Confirm Handover</Text>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Summary Card matching Image 4 */}
          <View style={[styles.card, { marginTop: 16 }]}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Order</Text>
                <Text style={styles.fieldValue}>{orderId}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Customer</Text>
                <Text style={styles.fieldValue}>Arun Kumar</Text>
              </View>
            </View>

            <View style={[styles.twoColRow, { marginTop: 14 }]}>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Items</Text>
                <Text style={styles.fieldValue}>4</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>OTP</Text>
                <Text style={styles.fieldValue}>Verified ✓</Text>
              </View>
            </View>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* Bottom Fixed Action Button matching Image 4 */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.completeBtn}
            activeOpacity={0.8}
            onPress={() => setCompleted(true)}
          >
            <CheckmarkWhiteIcon />
            <Text style={styles.completeBtnText}>Complete Pickup</Text>
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
    paddingTop: 12,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
  },
  fieldLabel: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 11.5,
    fontWeight: '500',
    color: '#78716C',
    marginBottom: 4,
  },
  fieldValue: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: '#1D2420',
  },
  sectionTitle: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: '#1D2420',
    marginTop: 20,
    marginBottom: 10,
  },
  bottomBar: {
    backgroundColor: '#FAF8F5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EFECE6',
  },
  completeBtn: {
    backgroundColor: '#E85226',
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  completeBtnText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ─── Pickup Completed Styles (Image 5) ────────────────────────────────────
  heroContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
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
  bottomBarStacked: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#EFECE6',
  },
  viewOrderBtn: {
    backgroundColor: '#E85226',
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  viewOrderBtnText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  viewInvoiceBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E85226',
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewInvoiceBtnText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 14.5,
    fontWeight: '700',
    color: '#9A3412',
  },
});
