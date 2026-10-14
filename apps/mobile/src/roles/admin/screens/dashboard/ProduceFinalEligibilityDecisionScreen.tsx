import React from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { adminColors } from '../../theme';

// ─── Theme Colors ────────────────────────────────────────────────────────────
const THEME = {
  headerBg: adminColors.brand, // Matches Purchases screen & theme primary (#F0562A)
  white: adminColors.onBrand,

  // Canvas & Surfaces
  canvas: adminColors.canvas, // #F3EFE9 — App canvas soft cream
  card: adminColors.card, // #FFFFFF — Card surface
  border: adminColors.border, // #EEDCD3 — Border stroke
  borderLight: '#F3ECE4',

  // Typography
  titleRustDark: adminColors.brandDeep,
  ink: adminColors.ink, // Dark ink
  muted: adminColors.muted, // Secondary gray

  // Buttons & Actions
  orangeBtn: adminColors.brand,
  disabledBtnBg: '#F4CCA4', // Peach disabled background for Approve & Handover
  disabledBtnText: '#FFFFFF',
  rejectRed: '#DC2626',

  // Badges & Notices
  notCompletedBg: '#F3F4F6',
  notCompletedText: '#4B5563',
  warningBg: '#F2EDE4',
  warningText: '#1F2937',
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

export interface ProduceFinalEligibilityDecisionScreenProps {
  listingId?: string;
  cropName?: string;
  farmerName?: string;
  farmerId?: string;
  listedQty?: number;
  selectedGrade?: string;
  onBack: () => void;
  onPreviousStep: () => void;
  onApproveSuccess?: () => void;
  onGoToStep?: (step: number) => void;
}

export function ProduceFinalEligibilityDecisionScreen({
  listingId = 'PL-001245',
  cropName = 'Tomato',
  farmerName = 'Ramesh Kumar',
  farmerId = 'FR-00241',
  listedQty = 50,
  selectedGrade = 'Grade 1',
  onBack,
  onPreviousStep,
  onApproveSuccess,
  onGoToStep,
}: ProduceFinalEligibilityDecisionScreenProps) {
  const checklistItems = [
    { label: 'Quantity verification', status: 'Pending' },
    { label: 'Quality verification', status: 'Pending' },
    { label: 'Grade verification', status: 'Pending' },
    { label: 'Damage inspection', status: 'Pending' },
    { label: 'Fair-price verification', status: 'Pending' },
    { label: 'Purchase requirement check', status: 'Pending' },
    { label: 'Required evidence and remarks', status: 'Pending' },
    { label: 'Listing eligibility', status: 'Pending' },
  ];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

      {/* ─── Header ─── */}
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
          <Text style={styles.headerTitle}>Produce Verification & Approval</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {listingId} · {cropName} · {farmerName}
        </Text>
      </View>

      {/* ─── Scroll Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Verification steps header */}
        <Text style={styles.sectionTitle}>Verification steps</Text>

        {/* Numbered Stepper Circles 1 to 6 (Step 6 active - all highlighted) */}
        <View style={styles.stepperRow}>
          {[1, 2, 3, 4, 5, 6].map((step, idx) => {
            const isCompletedOrActive = step <= 6;
            const isLineActive = step < 6;
            return (
              <React.Fragment key={step}>
                <TouchableOpacity
                  style={[
                    styles.stepCircle,
                    isCompletedOrActive && styles.stepCircleActive,
                  ]}
                  onPress={() => {
                    if (onGoToStep) onGoToStep(step);
                    else if (step < 6) onPreviousStep();
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.stepCircleText,
                      isCompletedOrActive && styles.stepCircleTextActive,
                    ]}
                  >
                    {step}
                  </Text>
                </TouchableOpacity>
                {idx < 5 && (
                  <View
                    style={[
                      styles.stepperLine,
                      isLineActive && styles.stepperLineActive,
                    ]}
                  />
                )}
              </React.Fragment>
            );
          })}
        </View>

        {/* Step Header & Status Badge */}
        <View style={styles.stepHeaderRow}>
          <Text style={styles.stepHeaderTitle}>Step 6 of 6 · Final Eligibility & Decision</Text>
          <View style={styles.notCompletedBadge}>
            <Text style={styles.notCompletedBadgeText}>Not completed</Text>
          </View>
        </View>

        {/* Outstanding Card */}
        <View style={styles.outstandingCard}>
          <Text style={styles.outstandingTitle}>Outstanding</Text>
          <Text style={styles.outstandingItem}>• Step 1 Quantity Check: Enter the verified quantity.</Text>
          <Text style={styles.outstandingItem}>• Step 2 Quality Verification: Freshness: mark the result.</Text>
          <Text style={styles.outstandingItem}>• Step 3 Grade Check: Select the grade.</Text>
          <Text style={styles.outstandingItem}>• and 2 more</Text>
        </View>

        {/* Verification Summary (Screenshot 1) */}
        <Text style={styles.sectionHeaderTitle}>Verification summary</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryGridRow}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryColLabel}>Farmer</Text>
              <Text style={styles.summaryColValue}>{farmerName} · {farmerId}</Text>
            </View>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryColLabel}>Listing</Text>
              <Text style={styles.summaryColValue}>{listingId} · {cropName}</Text>
            </View>
          </View>

          <View style={styles.summaryGridRow}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryColLabel}>Listed quantity</Text>
              <Text style={styles.summaryColValue}>{listedQty} KG</Text>
            </View>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryColLabel}>Verified quantity</Text>
              <Text style={styles.summaryColValue}>—</Text>
            </View>
          </View>

          <View style={styles.summaryGridRow}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryColLabel}>Damaged quantity</Text>
              <Text style={styles.summaryColValue}>—</Text>
            </View>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryColLabel}>Potential acceptable</Text>
              <Text style={styles.summaryColValue}>—</Text>
            </View>
          </View>

          <View style={styles.summaryGridRow}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryColLabel}>Selected grade</Text>
              <Text style={styles.summaryColValue}>{selectedGrade}</Text>
            </View>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryColLabel}>Remaining required</Text>
              <Text style={styles.summaryColValue}>30 KG</Text>
            </View>
          </View>

          <View style={styles.summaryGridRow}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryColLabel}>Proposed purchase price</Text>
              <Text style={styles.summaryColValue}>—</Text>
            </View>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryColLabel}>Eligible purchase quantity</Text>
              <Text style={styles.summaryColValue}>—</Text>
            </View>
          </View>
        </View>

        {/* Eligibility Checklist (Screenshot 2) */}
        <Text style={styles.sectionHeaderTitle}>Eligibility checklist</Text>
        <View style={styles.checklistCard}>
          {checklistItems.map((item, idx) => (
            <View
              key={item.label}
              style={[
                styles.checkRow,
                idx < checklistItems.length - 1 && styles.checkRowBorder,
              ]}
            >
              <Text style={[styles.checkLabel, idx === checklistItems.length - 1 && styles.checkLabelBold]}>
                {item.label}
              </Text>
              <Text style={styles.checkStatus}>{item.status}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.checklistFootnote}>
          Evidence attached: none. Remarks are kept with each step.
        </Text>

        {/* Decision Section (Screenshot 2) */}
        <Text style={styles.sectionHeaderTitle}>Decision</Text>
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            Some checks are not complete. Approve stays unavailable; you can still reject or send the listing for further review.
          </Text>
        </View>

        {/* Action Buttons Stack */}
        <TouchableOpacity
          style={styles.approveBtnDisabled}
          onPress={() => {
            if (onApproveSuccess) {
              onApproveSuccess();
            } else {
              Alert.alert('Eligibility Decision', 'Approving listing and creating Handover batch.');
            }
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.approveBtnTextDisabled}>Approve & Handover</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.rejectBtn}
          onPress={() => {
            Alert.alert('Listing Rejected', `Listing ${listingId} marked as rejected.`);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.rejectBtnText}>Reject</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.reviewBtn}
          onPress={() => {
            Alert.alert('Sent for Further Review', `Listing ${listingId} flagged for secondary review.`);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.reviewBtnText}>Send for Further Review</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.prevBtn}
          onPress={onPreviousStep}
          activeOpacity={0.8}
        >
          <Text style={styles.prevBtnText}>Previous Step</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.canvas,
  },
  header: {
    backgroundColor: THEME.headerBg,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.white,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.88)',
    marginTop: 4,
    paddingLeft: 42,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.titleRustDark,
    marginBottom: 14,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.titleRustDark,
    marginTop: 18,
    marginBottom: 10,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#E2DDD6',
    backgroundColor: THEME.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    borderColor: THEME.orangeBtn,
    borderWidth: 2,
  },
  stepCircleText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#6B7280',
  },
  stepCircleTextActive: {
    color: THEME.orangeBtn,
    fontWeight: '800',
  },
  stepperLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E2DDD6',
    marginHorizontal: 0,
  },
  stepperLineActive: {
    backgroundColor: THEME.orangeBtn,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  stepHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.ink,
  },
  notCompletedBadge: {
    backgroundColor: THEME.notCompletedBg,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  notCompletedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.notCompletedText,
  },
  outstandingCard: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 16,
    marginBottom: 8,
    gap: 4,
  },
  outstandingTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.ink,
    marginBottom: 4,
  },
  outstandingItem: {
    fontSize: 12,
    color: THEME.muted,
    lineHeight: 18,
  },
  summaryCard: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 16,
    gap: 14,
  },
  summaryGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCol: {
    width: '48%',
  },
  summaryColLabel: {
    fontSize: 11.5,
    color: THEME.muted,
    marginBottom: 3,
  },
  summaryColValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: THEME.ink,
  },
  checklistCard: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  checkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  checkRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3ECE4',
    borderStyle: 'dashed',
  },
  checkLabel: {
    fontSize: 12.5,
    color: THEME.ink,
  },
  checkLabelBold: {
    fontWeight: '800',
  },
  checkStatus: {
    fontSize: 12.5,
    fontWeight: '800',
    color: THEME.ink,
  },
  checklistFootnote: {
    fontSize: 11,
    color: THEME.muted,
    marginTop: 8,
    lineHeight: 15,
  },
  warningBox: {
    backgroundColor: THEME.warningBg,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  warningText: {
    fontSize: 12,
    color: THEME.warningText,
    fontWeight: '600',
    lineHeight: 17,
  },
  approveBtnDisabled: {
    backgroundColor: THEME.disabledBtnBg,
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  approveBtnTextDisabled: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.disabledBtnText,
  },
  rejectBtn: {
    backgroundColor: THEME.white,
    borderWidth: 1.5,
    borderColor: THEME.rejectRed,
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  rejectBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.rejectRed,
  },
  reviewBtn: {
    backgroundColor: THEME.white,
    borderWidth: 1.5,
    borderColor: THEME.orangeBtn,
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  reviewBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.orangeBtn,
  },
  prevBtn: {
    backgroundColor: THEME.white,
    borderWidth: 1.5,
    borderColor: THEME.orangeBtn,
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prevBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.orangeBtn,
  },
});
