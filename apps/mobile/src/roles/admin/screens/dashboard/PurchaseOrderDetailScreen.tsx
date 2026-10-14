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
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../theme';

// ─── Design Tokens (Directly Bound to Theme File Structure) ───────────────────
const THEME = {
  headerBg: adminColors.brand,
  white: adminColors.onBrand,

  // Surfaces
  canvas: adminColors.canvas,
  card: adminColors.card,
  border: adminColors.border,
  borderLight: '#F3ECE4',

  // Typography
  titleRustDark: adminColors.brandDeep,
  sectionTitle: adminColors.brandDeep,
  ink: adminColors.ink,
  muted: adminColors.muted,
  labelMuted: '#78716C',

  // Accent & Timeline
  brandOrange: adminColors.brand,
  peachIconBg: adminColors.warning.bg,
  peachCardBg: adminColors.brandTint,
  peachBorder: adminColors.border,
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

function TargetPlusIcon({ size = 16, color = THEME.titleRustDark }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Line x1="12" y1="8" x2="12" y2="16" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="8" y1="12" x2="16" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function CheckCircleIcon({ size = 16, color = THEME.titleRustDark }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Path d="M8.5 12l2.5 2.5 4.5-5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReceiptIcon({ size = 16, color = THEME.titleRustDark }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 2v18l2.5-1.5L9 20l2.5-1.5L14 20l2.5-1.5L19 20l2.5-1.5V2H4z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="8" y1="6" x2="16" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="8" y1="10" x2="16" y2="10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function HourglassIcon({ size = 16, color = THEME.titleRustDark }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 22h14M5 2h14M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Component Props ──────────────────────────────────────────────────────────

export interface PurchaseOrderDetailScreenProps {
  orderId?: string;
  onBack: () => void;
  onViewOriginalListing?: () => void;
  onProcessHandover?: () => void;
}

export function PurchaseOrderDetailScreen({
  orderId = 'PO-2026-00124',
  onBack,
  onViewOriginalListing,
  onProcessHandover,
}: PurchaseOrderDetailScreenProps) {
  const [negotiationType, setNegotiationType] = useState<'Counter Offer' | 'Direct Approval'>('Counter Offer');

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

      {/* ─── Header: Purchase Order (Image 3) ─── */}
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

          <Text style={styles.headerTitle}>Purchase Order</Text>
        </View>

        <Text style={styles.headerSubtitle}>{orderId} · Awaiting Handover</Text>
      </View>

      {/* ─── Scroll Body ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 1. Purchase Summary ─── */}
        <Text style={styles.sectionTitle}>Purchase Summary</Text>
        <View style={styles.card}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Purchase Order ID</Text>
              <Text style={styles.fieldValue}>{orderId}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Listing ID</Text>
              <Text style={styles.fieldValue}>LST-00452</Text>
            </View>
          </View>

          <View style={[styles.gridRow, { marginTop: 14 }]}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Farmer</Text>
              <Text style={styles.fieldValue}>Ramesh Kumar</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Produce</Text>
              <Text style={styles.fieldValue}>Carrot, Grade 1</Text>
            </View>
          </View>

          <View style={[styles.gridRow, { marginTop: 14 }]}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Quantity</Text>
              <Text style={styles.fieldValue}>30 kg</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Agreed Price</Text>
              <Text style={styles.fieldValue}>₹45/kg</Text>
            </View>
          </View>

          <View style={{ marginTop: 14 }}>
            <Text style={styles.fieldLabel}>Total Purchase Amount</Text>
            <Text style={styles.fieldValue}>₹1,350</Text>
          </View>
        </View>

        {/* ─── 2. Farmer Information (WITHOUT View Farmer Button as Requested) ─── */}
        <Text style={styles.sectionTitle}>Farmer Information</Text>
        <View style={styles.card}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Farmer ID</Text>
              <Text style={styles.fieldValue}>FR-00241</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Farm/Location</Text>
              <Text style={styles.fieldValue}>Coonoor</Text>
            </View>
          </View>
        </View>

        {/* ─── 3. Produce Information ─── */}
        <Text style={styles.sectionTitle}>Produce Information</Text>
        <View style={styles.card}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Listed Quantity</Text>
              <Text style={styles.fieldValue}>50 kg</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Agreed Quantity</Text>
              <Text style={styles.fieldValue}>30 kg</Text>
            </View>
          </View>

          <View style={[styles.gridRow, { marginTop: 14 }]}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Listed Price</Text>
              <Text style={styles.fieldValue}>₹50/kg</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Agreed Price</Text>
              <Text style={styles.fieldValue}>₹45/kg</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.outlineActionBtn}
          onPress={onViewOriginalListing}
          activeOpacity={0.8}
        >
          <Text style={styles.outlineActionBtnText}>View Original Listing</Text>
        </TouchableOpacity>

        {/* ─── 4. Negotiation Summary (Image 4) ─── */}
        <Text style={styles.sectionTitle}>Negotiation Summary</Text>
        <View style={styles.chipsRow}>
          <TouchableOpacity
            style={[
              styles.chip,
              negotiationType === 'Counter Offer' ? styles.chipActive : styles.chipInactive,
            ]}
            onPress={() => setNegotiationType('Counter Offer')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.chipText,
                negotiationType === 'Counter Offer' ? styles.chipTextActive : styles.chipTextInactive,
              ]}
            >
              Counter Offer
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.chip,
              negotiationType === 'Direct Approval' ? styles.chipActive : styles.chipInactive,
            ]}
            onPress={() => setNegotiationType('Direct Approval')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.chipText,
                negotiationType === 'Direct Approval' ? styles.chipTextActive : styles.chipTextInactive,
              ]}
            >
              Direct Approval
            </Text>
          </TouchableOpacity>
        </View>

        {negotiationType === 'Direct Approval' ? (
          <View style={[styles.card, styles.finalTermsCard]}>
            <Text style={styles.termHeading}>DIRECT APPROVAL — NO COUNTER OFFER</Text>
            <Text style={styles.finalTermBody}>Quantity: 50 kg · Price: ₹100/kg · Total: ₹5,000</Text>
          </View>
        ) : (
          <>
            {/* Card 1: Original Farmer Request */}
            <View style={styles.card}>
              <Text style={styles.termHeading}>ORIGINAL FARMER REQUEST</Text>
              <Text style={styles.termBody}>Quantity: 50 kg · Price: ₹50/kg</Text>
            </View>

            {/* Card 2: TOHFA Counter Offer */}
            <View style={styles.card}>
              <Text style={styles.termHeading}>TOHFA COUNTER OFFER</Text>
              <Text style={styles.termBody}>Quantity: 30 kg · Price: ₹45/kg</Text>
            </View>

            {/* Card 3: Final Agreed Terms */}
            <View style={[styles.card, styles.finalTermsCard]}>
              <Text style={styles.termHeading}>FINAL AGREED TERMS</Text>
              <Text style={styles.finalTermBody}>Quantity: 30 kg · Price: ₹45/kg · Total: ₹1,350</Text>
            </View>
          </>
        )}

        {/* ─── 5. Purchase Timeline (Image 4) ─── */}
        <Text style={styles.sectionTitle}>Purchase Timeline</Text>
        <View style={styles.timelineList}>
          {/* Step 1 */}
          <View style={styles.timelineItem}>
            <View style={styles.timelineIconBadge}>
              <TargetPlusIcon size={16} color={THEME.titleRustDark} />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Listing Created</Text>
              <Text style={styles.timelineTime}>28 Sep · Farmer</Text>
            </View>
          </View>

          {/* Step 2 */}
          <View style={styles.timelineItem}>
            <View style={styles.timelineIconBadge}>
              <CheckCircleIcon size={16} color={THEME.titleRustDark} />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Listing Approved</Text>
              <Text style={styles.timelineTime}>29 Sep · Farmer Admin</Text>
            </View>
          </View>

          {/* Step 3 */}
          <View style={styles.timelineItem}>
            <View style={styles.timelineIconBadge}>
              <ReceiptIcon size={16} color={THEME.titleRustDark} />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Purchase Order Created</Text>
              <Text style={styles.timelineTime}>29 Sep · System</Text>
            </View>
          </View>

          {/* Step 4 */}
          <View style={styles.timelineItem}>
            <View style={styles.timelineIconBadge}>
              <CheckCircleIcon size={16} color={THEME.titleRustDark} />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Terms Confirmed</Text>
              <Text style={styles.timelineTime}>29 Sep · Farmer Admin</Text>
            </View>
          </View>

          {/* Step 5 */}
          <View style={styles.timelineItem}>
            <View style={styles.timelineIconBadge}>
              <HourglassIcon size={16} color={THEME.titleRustDark} />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Awaiting Handover</Text>
              <Text style={styles.timelineTime}>30 Sep · Current</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ─── Sticky Bottom Action: Process Handover ─── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.processHandoverBtn}
          onPress={onProcessHandover}
          activeOpacity={0.85}
        >
          <Text style={styles.processHandoverBtnText}>Process Handover</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Stylesheet ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.canvas,
  },

  // ─── Header ───
  header: {
    backgroundColor: THEME.headerBg,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.white,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 42,
  },

  // ─── Scroll Area ───
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
  },

  // ─── Section Title ───
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.sectionTitle,
    letterSpacing: -0.2,
    marginTop: 6,
    marginBottom: 10,
  },

  // ─── Card ───
  card: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 16,
    marginBottom: 12,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridCol: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    color: THEME.muted,
    marginBottom: 3,
  },
  fieldValue: {
    fontSize: 14.5,
    fontWeight: '800',
    color: THEME.ink,
    letterSpacing: -0.2,
  },

  // ─── Outline Action Button ───
  outlineActionBtn: {
    backgroundColor: THEME.white,
    borderWidth: 1.5,
    borderColor: THEME.brandOrange,
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  outlineActionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.brandOrange,
  },

  // ─── Chips Row ───
  chipsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  chip: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  chipActive: {
    backgroundColor: THEME.brandOrange,
  },
  chipInactive: {
    backgroundColor: THEME.white,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  chipText: {
    fontSize: 13,
  },
  chipTextActive: {
    color: THEME.white,
    fontWeight: '800',
  },
  chipTextInactive: {
    color: THEME.ink,
    fontWeight: '700',
  },

  // ─── Terms ───
  termHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  termBody: {
    fontSize: 13.5,
    fontWeight: '600',
    color: THEME.ink,
  },
  finalTermsCard: {
    backgroundColor: THEME.peachCardBg,
    borderColor: THEME.peachBorder,
    borderWidth: 1.5,
  },
  finalTermBody: {
    fontSize: 14,
    fontWeight: '900',
    color: THEME.ink,
  },

  // ─── Timeline ───
  timelineList: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 16,
    gap: 16,
    marginBottom: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timelineIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.peachIconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: THEME.ink,
    letterSpacing: -0.2,
  },
  timelineTime: {
    fontSize: 11.5,
    color: THEME.muted,
    marginTop: 1,
  },

  // ─── Sticky Bottom Bar ───
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: THEME.canvas,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: THEME.borderLight,
  },
  processHandoverBtn: {
    backgroundColor: THEME.brandOrange,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processHandoverBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.white,
    letterSpacing: -0.2,
  },
});
