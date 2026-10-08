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
import { ORDERS_THEME } from './theme';

interface M5S08Props {
  orderId?: string;
  initialPacked?: boolean;
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

function QuestionCircleOrangeIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={ORDERS_THEME.warning} strokeWidth="2" />
      <Path
        d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"
        stroke={ORDERS_THEME.warning}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function GreenCheckboxIcon() {
  return (
    <View style={styles.greenCheckbox}>
      <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
        <Path
          d="M20 6L9 17l-5-5"
          stroke="#FFFFFF"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
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
      <Circle cx="12" cy="12" r="10" stroke={ORDERS_THEME.success} strokeWidth="2" />
      <Path
        d="M8 12l2.5 2.5L16 9.5"
        stroke={ORDERS_THEME.success}
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

export const M5S08_ConfirmPacking: React.FC<M5S08Props> = ({
  orderId = 'ORD-1024',
  initialPacked = false,
  onNavigate,
  onBack,
}) => {
  const [isPacked, setIsPacked] = useState(initialPacked);

  // ─── STATE 2: Order Packed Screen ──────────────────────────────────────────
  if (isPacked) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.7}
              onPress={() => setIsPacked(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <BackArrowWhiteIcon />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Order Packed</Text>
          </View>

          <View style={styles.contentPacked}>
            {/* Centered Hero Checkmark */}
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

          {/* Bottom Stacked Buttons */}
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
  }

  // ─── STATE 1: Confirm Packing Screen ───────────────────────────────────────
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
          <Text style={styles.headerTitle}>Confirm Packing</Text>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Amber/Peach Alert Box */}
          <View style={styles.confirmPromptBox}>
            <QuestionCircleOrangeIcon />
            <Text style={styles.confirmPromptText}>Confirm Packing?</Text>
          </View>

          {/* Order Details Card */}
          <View style={styles.orderDetailsCard}>
            <View style={styles.twoColRow}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Order</Text>
                <Text style={styles.detailValue}>{orderId}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Items</Text>
                <Text style={styles.detailValue}>4 / 4</Text>
              </View>
            </View>

            <View style={[styles.twoColRow, { marginTop: 14 }]}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Total Quantity</Text>
                <Text style={styles.detailValue}>8 KG</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Customer</Text>
                <Text style={styles.detailValue}>Arun Kumar</Text>
              </View>
            </View>
          </View>

          {/* Checklist Section */}
          <Text style={styles.checklistSectionTitle}>Checklist</Text>
          <View style={styles.checklistRowCard}>
            <GreenCheckboxIcon />
            <Text style={styles.checklistRowText}>All items checked</Text>
          </View>

          <View style={styles.checklistRowCard}>
            <GreenCheckboxIcon />
            <Text style={styles.checklistRowText}>Quantities verified</Text>
          </View>

          <View style={styles.checklistRowCard}>
            <GreenCheckboxIcon />
            <Text style={styles.checklistRowText}>Packing completed</Text>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* Bottom Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.confirmBtn}
            activeOpacity={0.8}
            onPress={() => setIsPacked(true)}
          >
            <CheckmarkWhiteIcon />
            <Text style={styles.confirmBtnText}>Yes, Confirm Packing</Text>
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
    paddingHorizontal: 16,
  },
  contentContainer: {
    paddingTop: 14,
    paddingBottom: 20,
  },
  confirmPromptBox: {
    backgroundColor: ORDERS_THEME.warningBg,
    borderRadius: ORDERS_THEME.radiusMD,
    borderWidth: 1,
    borderColor: ORDERS_THEME.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  confirmPromptText: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '700',
    color: ORDERS_THEME.warning,
  },
  orderDetailsCard: {
    backgroundColor: ORDERS_THEME.cardBg,
    borderRadius: ORDERS_THEME.radiusLG,
    borderWidth: 1,
    borderColor: ORDERS_THEME.border,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    fontFamily: 'Poppins',
    fontSize: 11.5,
    fontWeight: '500',
    color: ORDERS_THEME.textSecondary,
    marginBottom: 3,
  },
  detailValue: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '700',
    color: ORDERS_THEME.textInk,
  },
  checklistSectionTitle: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '800',
    color: ORDERS_THEME.textInk,
    marginTop: 6,
    marginBottom: 10,
  },
  checklistRowCard: {
    backgroundColor: ORDERS_THEME.cardBg,
    borderRadius: ORDERS_THEME.radiusLG,
    borderWidth: 1,
    borderColor: ORDERS_THEME.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  greenCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    backgroundColor: ORDERS_THEME.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checklistRowText: {
    fontFamily: 'Poppins',
    fontSize: 13.5,
    fontWeight: '700',
    color: ORDERS_THEME.textInk,
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
  confirmBtnText: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Packed Screen Styles
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
    backgroundColor: ORDERS_THEME.successBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontFamily: 'Poppins',
    fontSize: 20,
    fontWeight: '800',
    color: ORDERS_THEME.textInk,
  },
  packedSummaryCard: {
    backgroundColor: ORDERS_THEME.cardBg,
    borderRadius: ORDERS_THEME.radiusLG,
    borderWidth: 1,
    borderColor: ORDERS_THEME.border,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  packedSummaryCol: {
    flex: 1,
  },
  summaryLabel: {
    fontFamily: 'Poppins',
    fontSize: 11.5,
    fontWeight: '500',
    color: ORDERS_THEME.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '700',
    color: ORDERS_THEME.textInk,
  },
  bottomBarPacked: {
    backgroundColor: ORDERS_THEME.pageBg,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: ORDERS_THEME.border,
  },
  pickupBtn: {
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
  pickupBtnText: {
    fontFamily: 'Poppins',
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dispatchBtn: {
    backgroundColor: ORDERS_THEME.orangeTint,
    borderWidth: 1.5,
    borderColor: ORDERS_THEME.primary,
    borderRadius: ORDERS_THEME.radiusLG,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dispatchBtnText: {
    fontFamily: 'Poppins',
    fontSize: 14.5,
    fontWeight: '700',
    color: ORDERS_THEME.primary,
  },
});
