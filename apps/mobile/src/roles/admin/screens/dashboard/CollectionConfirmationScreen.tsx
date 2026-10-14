import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';

// ─── Design Tokens (Directly Bound to Theme File Structure) ───────────────────
const THEME = {
  headerBg: adminColors.brand,
  white: adminColors.onBrand,

  // Canvas & Surfaces
  canvas: adminColors.canvas,
  card: adminColors.card,
  border: adminColors.border,

  // Typography
  titleRustDark: adminColors.brandDeep,
  ink: adminColors.ink,
  muted: adminColors.muted,
  labelMuted: adminColors.muted,

  // Buttons & Actions
  orangeBtn: adminColors.brand,
  disabledBtn: adminColors.brandTint,
};

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowIcon({ size = 22, color = THEME.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckmarkIcon({ size = 12, color = THEME.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 13l4 4L19 7"
        stroke={color}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────

export interface CollectionConfirmationScreenProps {
  orderId?: string;
  farmerName?: string;
  expectedQty?: string;
  receivedQty?: string;
  totalValue?: string;
  collectionDate?: string;
  collectedBy?: string;
  qualityResult?: string;
  onBack: () => void;
  onConfirmCollection: () => void;
}

export function CollectionConfirmationScreen({
  orderId = 'PO-2026-00124',
  farmerName = 'Ramesh Kumar',
  expectedQty = '30 kg',
  receivedQty = '30 kg',
  totalValue = '₹1,350',
  collectionDate = '30 Sep 2026',
  collectedBy = 'Farmer Admin',
  qualityResult = 'Accepted',
  onBack,
  onConfirmCollection,
}: CollectionConfirmationScreenProps) {
  const [isConfirmed, setIsConfirmed] = useState(false);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

      {/* ─── Header: Matching Screenshot 4 Exactly ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={22} color={THEME.white} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Collection Confirmation</Text>
        </View>

        <Text style={styles.headerSubtitle}>Status: Ready for Completion</Text>
      </View>

      {/* ─── Scroll Body ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Section: Purchase Summary */}
        <Text style={styles.sectionHeading}>Purchase Summary</Text>
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>PO ID</Text>
              <Text style={styles.fieldValue}>{orderId}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Farmer</Text>
              <Text style={styles.fieldValue}>{farmerName}</Text>
            </View>
          </View>

          <View style={[styles.twoColRow, { marginTop: 14 }]}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Expected Quantity</Text>
              <Text style={styles.fieldValue}>{expectedQty}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Received Quantity</Text>
              <Text style={styles.fieldValue}>{receivedQty}</Text>
            </View>
          </View>

          <View style={{ marginTop: 14 }}>
            <Text style={styles.fieldLabel}>Total Purchase Value</Text>
            <Text style={styles.fieldValue}>{totalValue}</Text>
          </View>
        </View>

        {/* Section: Collection Details */}
        <Text style={styles.sectionHeading}>Collection Details</Text>
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Collection Date</Text>
              <Text style={styles.fieldValue}>{collectionDate}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Collected By</Text>
              <Text style={styles.fieldValue}>{collectedBy}</Text>
            </View>
          </View>

          <View style={{ marginTop: 14 }}>
            <Text style={styles.fieldLabel}>Quality Result</Text>
            <Text style={styles.fieldValue}>{qualityResult}</Text>
          </View>
        </View>

        {/* Checkbox */}
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setIsConfirmed(!isConfirmed)}
          activeOpacity={0.8}
        >
          <View style={[styles.checkboxBox, isConfirmed && styles.checkboxBoxChecked]}>
            {isConfirmed && <CheckmarkIcon size={12} color={THEME.white} />}
          </View>
          <Text style={styles.checkboxLabel}>
            I confirm that the produce shown above has been received.
          </Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ─── Bottom Action Button ─── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.confirmBtn, styles.confirmBtnActive]}
          onPress={() => {
            setIsConfirmed(true);
            onConfirmCollection();
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.confirmBtnText}>Confirm Collection</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.canvas,
  },

  header: {
    backgroundColor: THEME.headerBg,
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.white,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 6,
    marginLeft: 38,
    fontWeight: '500',
  },

  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },

  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.titleRustDark,
    marginTop: 18,
    marginBottom: 8,
  },

  card: {
    backgroundColor: THEME.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: adminSpacing.lg,
    ...adminShadow.sm,
  },
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  fieldLabel: {
    ...adminType.caption,
    fontSize: 12,
    color: THEME.labelMuted,
    marginBottom: 4,
  },
  fieldValue: {
    ...adminType.rowTitle,
    fontSize: 15,
    color: THEME.ink,
  },

  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
    gap: 12,
    paddingHorizontal: 4,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.8,
    borderColor: THEME.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    backgroundColor: THEME.white,
  },
  checkboxBoxChecked: {
    backgroundColor: THEME.orangeBtn,
    borderColor: THEME.orangeBtn,
  },
  checkboxLabel: {
    flex: 1,
    ...adminType.body,
    fontSize: 13,
    color: THEME.ink,
    lineHeight: 18,
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: THEME.canvas,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
  },
  confirmBtn: {
    borderRadius: adminRadius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnActive: {
    backgroundColor: THEME.orangeBtn,
  },
  confirmBtnDisabled: {
    backgroundColor: THEME.disabledBtn,
  },
  confirmBtnText: {
    ...adminType.rowTitle,
    fontSize: 15,
    color: THEME.white,
  },
});
