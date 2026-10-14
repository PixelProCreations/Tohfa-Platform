import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { adminColors } from '../../theme';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const THEME = {
  headerBg: adminColors.brand, // Matches Purchases screen & theme primary (#F0562A)
  white: adminColors.onBrand,

  // Canvas & Surfaces
  canvas: adminColors.canvas,
  card: adminColors.card,
  border: adminColors.border,
  borderLight: '#F3ECE4',

  // Typography
  titleRustDark: adminColors.brandDeep,
  sectionTitle: '#5C240E',
  ink: adminColors.ink,
  muted: adminColors.muted,
  labelMuted: '#78716C',

  // Buttons & Accents
  brandOrange: adminColors.brand,
  greenText: adminColors.success.text,
  peachBg: '#FFF7ED',
  peachIconBg: '#FFEDD5',
  peachBorder: '#FED7AA',
};

// ─── Exact SVG Icons ──────────────────────────────────────────────────────────

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

function ProhibitedIcon({ size = 18, color = '#78716C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth="1.8" />
      <Line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function ArrowRightIcon({ size = 18, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12h14M12 5l7 7-7 7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Timeline Icon 1: Upload tray with arrow */
function UploadTrayIcon({ size = 16, color = THEME.titleRustDark }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M12 15V3M7 8l5-5 5 5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Timeline Icon 2: Speech bubble / ellipsis */
function EllipsisBubbleIcon({ size = 16, color = THEME.titleRustDark }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Circle cx="8" cy="12" r="1.2" fill={color} />
      <Circle cx="12" cy="12" r="1.2" fill={color} />
      <Circle cx="16" cy="12" r="1.2" fill={color} />
    </Svg>
  );
}

/** Timeline Icon 3: ID badge / user card */
function IdBadgeIcon({ size = 16, color = THEME.titleRustDark }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth="1.8" />
      <Path d="M8 18c0-2 1.8-3 4-3s4 1 4 3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Component Props ──────────────────────────────────────────────────────────

export interface ProduceListingDetailsScreenProps {
  listingId?: string;
  cropName?: string;
  farmerName?: string;
  onBack: () => void;
  onViewFarmer?: (farmerId: string) => void;
  onViewFullHistory?: () => void;
  onReviewListing?: () => void;
  onNavigateToVerification?: () => void;
}

export function ProduceListingDetailsScreen({
  listingId = 'PL-001245',
  cropName = 'Tomato',
  farmerName = 'Ramesh Kumar',
  onBack,
  onViewFarmer,
  onViewFullHistory,
  onReviewListing,
  onNavigateToVerification,
}: ProduceListingDetailsScreenProps) {
  const [selectedFarmerType, setSelectedFarmerType] = useState<'Other Farmer' | 'Own Listing'>('Other Farmer');
  const [modalMessage, setModalMessage] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

      {/* ─── Header: Produce Listing Details (Image 1) ─── */}
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

          <Text style={styles.headerTitle}>Produce Listing Details</Text>
        </View>

        <Text style={styles.headerSubtitle}>{listingId} · Pending Review</Text>
      </View>

      {/* ─── Scrollable Body ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Top Filter Chips: Other Farmer / Own Listing ─── */}
        <View style={styles.chipsRow}>
          <TouchableOpacity
            style={[
              styles.chip,
              selectedFarmerType === 'Other Farmer' ? styles.chipActive : styles.chipInactive,
            ]}
            onPress={() => setSelectedFarmerType('Other Farmer')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.chipText,
                selectedFarmerType === 'Other Farmer'
                  ? styles.chipTextActive
                  : styles.chipTextInactive,
              ]}
            >
              Other Farmer
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.chip,
              selectedFarmerType === 'Own Listing' ? styles.chipActive : styles.chipInactive,
            ]}
            onPress={() => setSelectedFarmerType('Own Listing')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.chipText,
                selectedFarmerType === 'Own Listing'
                  ? styles.chipTextActive
                  : styles.chipTextInactive,
              ]}
            >
              Own Listing
            </Text>
          </TouchableOpacity>
        </View>

        {/* ─── 1. Farmer Information ─── */}
        <Text style={styles.sectionTitle}>Farmer Information</Text>
        <View style={styles.card}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Farmer</Text>
              <Text style={styles.fieldValue}>
                {selectedFarmerType === 'Own Listing' ? 'Suresh Chakravarthi (You)' : farmerName}
              </Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Farmer ID</Text>
              <Text style={styles.fieldValue}>
                {selectedFarmerType === 'Own Listing' ? 'FR-00241' : 'FR-00192'}
              </Text>
            </View>
          </View>

          <View style={[styles.gridRow, { marginTop: 14 }]}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Zone</Text>
              <Text style={styles.fieldValue}>
                {selectedFarmerType === 'Own Listing' ? 'Coonoor' : 'Ooty'}
              </Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Farming Method</Text>
              <Text style={styles.fieldValue}>Organic</Text>
            </View>
          </View>
        </View>

        {/* ─── 2. Listing Overview ─── */}
        <Text style={styles.sectionTitle}>Listing Overview</Text>
        <View style={styles.card}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Crop</Text>
              <Text style={styles.fieldValue}>{cropName}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Grade</Text>
              <Text style={styles.fieldValue}>Grade 1</Text>
            </View>
          </View>

          <View style={[styles.gridRow, { marginTop: 14 }]}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Listing ID</Text>
              <Text style={styles.fieldValue}>{listingId}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Status</Text>
              <Text style={styles.fieldValue}>Pending Review</Text>
            </View>
          </View>

          <View style={{ marginTop: 14 }}>
            <Text style={styles.fieldLabel}>Submitted</Text>
            <Text style={styles.fieldValue}>29 Sep 2026 · 10:24 AM</Text>
          </View>
        </View>

        {/* ─── 3. Produce Information ─── */}
        <Text style={styles.sectionTitle}>Produce Information</Text>
        <View style={styles.card}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Quantity</Text>
              <Text style={styles.fieldValue}>50 KG</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Harvest Date</Text>
              <Text style={styles.fieldValue}>28 Sep 2026</Text>
            </View>
          </View>

          <View style={{ marginTop: 14 }}>
            <Text style={styles.fieldLabel}>Quality Information</Text>
            <Text style={styles.fieldValue}>Grade 1, no visible defects</Text>
          </View>
        </View>

        {/* ─── 4. Pricing (Image 2) ─── */}
        <Text style={styles.sectionTitle}>Pricing</Text>
        <View style={styles.card}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Farmer Listed Price</Text>
              <Text style={styles.fieldValue}>₹100/KG</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Fair Price Reference</Text>
              <Text style={styles.fieldValue}>₹95–₹105/KG</Text>
            </View>
          </View>

          <View style={{ marginTop: 14 }}>
            <Text style={styles.fieldLabel}>Price Compliance</Text>
            <Text style={[styles.fieldValue, { color: THEME.greenText }]}>
              Within configured rule
            </Text>
          </View>
        </View>

        {/* ─── 5. Quantity Requirement (Image 2) ─── */}
        <Text style={styles.sectionTitle}>Quantity Requirement</Text>
        <View style={styles.card}>
          <View style={styles.flowRow}>
            <View style={styles.flowCol}>
              <Text style={styles.flowLabel}>AVAILABLE</Text>
              <Text style={styles.flowValue}>50 KG</Text>
            </View>

            <ArrowRightIcon size={18} color="#9CA3AF" />

            <View style={styles.flowCol}>
              <Text style={styles.flowLabel}>TOHFA REQUIRED</Text>
              <Text style={styles.flowValue}>30 KG</Text>
            </View>

            <ArrowRightIcon size={18} color="#9CA3AF" />

            <View style={styles.flowCol}>
              <Text style={styles.flowLabel}>REQUIRED PURCHASE</Text>
              <Text style={styles.flowValue}>30 KG</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.outlineActionBtn}
          onPress={() => onNavigateToVerification?.()}
          activeOpacity={0.8}
        >
          <Text style={styles.outlineActionBtnText}>Purchase Required Quantity</Text>
        </TouchableOpacity>

        {/* ─── 6. Certification (Image 2) ─── */}
        <Text style={styles.sectionTitle}>Certification</Text>
        <View style={styles.card}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Certification</Text>
              <Text style={styles.fieldValue}>PGS Organic</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Status</Text>
              <Text style={styles.fieldValue}>Active</Text>
            </View>
          </View>
        </View>

        {/* ─── 7. Activity / History (Image 2 & 3) ─── */}
        <Text style={styles.sectionTitle}>Activity / History</Text>
        <View style={styles.timelineList}>
          {/* Event 1: Listing Submitted */}
          <View style={styles.timelineItem}>
            <View style={styles.timelineIconBadge}>
              <UploadTrayIcon size={16} color={THEME.titleRustDark} />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Listing Submitted</Text>
              <Text style={styles.timelineTime}>29 Sep</Text>
            </View>
          </View>

          {/* Event 2: Moved to Pending Review */}
          <View style={styles.timelineItem}>
            <View style={styles.timelineIconBadge}>
              <EllipsisBubbleIcon size={16} color={THEME.titleRustDark} />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Moved to Pending Review</Text>
              <Text style={styles.timelineTime}>29 Sep</Text>
            </View>
          </View>

          {/* Event 3: Assigned for FA Review */}
          <View style={styles.timelineItem}>
            <View style={styles.timelineIconBadge}>
              <IdBadgeIcon size={16} color={THEME.titleRustDark} />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Assigned for FA Review</Text>
              <Text style={styles.timelineTime}>29 Sep</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.outlineActionBtn}
          onPress={onViewFullHistory}
          activeOpacity={0.8}
        >
          <Text style={styles.outlineActionBtnText}>View Full History</Text>
        </TouchableOpacity>

        {/* Own Listing Notice Banner (Image 3) */}
        {selectedFarmerType === 'Own Listing' && (
          <View style={styles.ownListingNoticeCard}>
            <ProhibitedIcon size={20} color="#DC2626" />
            <View style={{ flex: 1 }}>
              <Text style={styles.ownListingNoticeTitle}>Your Own Listing</Text>
              <Text style={styles.ownListingNoticeText}>
                This listing belongs to you as a farmer. You cannot review, approve, or purchase your own produce listing — an independent Farmer Admin or SA must perform this verification.
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ─── Sticky Bottom Action Bar: Review Listing (Image 1, 2, 3) ─── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.reviewListingBtn,
            selectedFarmerType === 'Own Listing' && styles.reviewListingBtnDisabled,
          ]}
          onPress={() => {
            if (selectedFarmerType === 'Own Listing') {
              setModalMessage(
                'This listing belongs to you as a farmer. You cannot review or approve your own produce listing — an independent FA or SA must perform this verification.'
              );
              return;
            }
            onReviewListing?.();
          }}
          activeOpacity={selectedFarmerType === 'Own Listing' ? 0.9 : 0.85}
        >
          <Text
            style={[
              styles.reviewListingBtnText,
              selectedFarmerType === 'Own Listing' && styles.reviewListingBtnTextDisabled,
            ]}
          >
            Review Listing
          </Text>
        </TouchableOpacity>
      </View>

      {/* ─── Notice / Info Modal ─── */}
      <Modal
        visible={!!modalMessage}
        transparent
        animationType="fade"
        onRequestClose={() => setModalMessage(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalMessage(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalText}>{modalMessage}</Text>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setModalMessage(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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

  // ─── Top Segmented Chips ───
  chipsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
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

  // ─── Section Typography ───
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.sectionTitle,
    letterSpacing: -0.2,
    marginTop: 6,
    marginBottom: 10,
  },

  // ─── Information Card ───
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

  // ─── Outline Action Button (View Farmer, Purchase, Certificate, etc.) ───
  outlineActionBtn: {
    backgroundColor: THEME.white,
    borderWidth: 1.5,
    borderColor: THEME.brandOrange,
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  outlineActionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.brandOrange,
  },

  // ─── Notice Box (SA only) ───
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 18,
  },
  noticeText: {
    flex: 1,
    fontSize: 11.5,
    color: '#78716C',
    lineHeight: 16,
  },

  // ─── Quantity Requirement Flow Row ───
  flowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flowCol: {
    alignItems: 'center',
  },
  flowLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  flowValue: {
    fontSize: 16,
    fontWeight: '900',
    color: THEME.ink,
    letterSpacing: -0.3,
  },

  // ─── Activity / History Timeline ───
  timelineList: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 16,
    gap: 16,
    marginBottom: 12,
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
  reviewListingBtn: {
    backgroundColor: THEME.brandOrange,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewListingBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.white,
    letterSpacing: -0.2,
  },
  reviewListingBtnDisabled: {
    backgroundColor: '#E5E7EB',
    borderColor: '#D1D5DB',
  },
  reviewListingBtnTextDisabled: {
    color: '#9CA3AF',
  },

  // ─── Own Listing Warning Card (Image 3) ───
  ownListingNoticeCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginTop: 14,
  },
  ownListingNoticeTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#B91C1C',
    marginBottom: 4,
  },
  ownListingNoticeText: {
    fontSize: 12,
    color: '#7F1D1D',
    lineHeight: 17,
  },

  // ─── Modal ───
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: THEME.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 20,
    width: '100%',
    alignItems: 'center',
  },
  modalText: {
    fontSize: 14,
    color: THEME.ink,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  modalCloseBtn: {
    backgroundColor: THEME.brandOrange,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  modalCloseText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: THEME.white,
  },
});
