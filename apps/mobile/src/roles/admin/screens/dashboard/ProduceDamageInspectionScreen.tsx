import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';
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
  orangeBorder: adminColors.brand,

  // Badges
  notCompletedBg: '#F3F4F6',
  notCompletedText: '#4B5563',
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

function CornerGripIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
      <Line x1="11" y1="3" x2="3" y2="11" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="11" y1="7" x2="7" y2="11" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export interface ProduceDamageInspectionScreenProps {
  listingId?: string;
  cropName?: string;
  farmerName?: string;
  verifiedQty?: number;
  onBack: () => void;
  onPreviousStep: () => void;
  onContinue: () => void;
  onGoToStep?: (step: number) => void;
}

export function ProduceDamageInspectionScreen({
  listingId = 'PL-001245',
  cropName = 'Tomato',
  farmerName = 'Ramesh Kumar',
  verifiedQty = 50,
  onBack,
  onPreviousStep,
  onContinue,
  onGoToStep,
}: ProduceDamageInspectionScreenProps) {
  const [hasDamage, setHasDamage] = useState<'Yes' | 'No' | null>(null);
  const [damagedQty, setDamagedQty] = useState('');
  const [inspectionRemarks, setInspectionRemarks] = useState('');

  const damagedNum = parseFloat(damagedQty) || 0;
  const damagePct = verifiedQty > 0 && damagedNum > 0 ? ((damagedNum / verifiedQty) * 100).toFixed(1) + '%' : '—';
  const acceptableQty = hasDamage === 'Yes' && damagedNum > 0 ? `${verifiedQty - damagedNum} KG` : hasDamage === 'No' ? `${verifiedQty} KG` : '—';

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

        {/* Numbered Stepper Circles 1 to 6 (Step 4 active) */}
        <View style={styles.stepperRow}>
          {[1, 2, 3, 4, 5, 6].map((step, idx) => {
            const isCompletedOrActive = step <= 4;
            const isLineActive = step < 4;
            return (
              <React.Fragment key={step}>
                <TouchableOpacity
                  style={[
                    styles.stepCircle,
                    isCompletedOrActive && styles.stepCircleActive,
                  ]}
                  onPress={() => {
                    if (onGoToStep) onGoToStep(step);
                    else if (step <= 3) onPreviousStep();
                    else if (step > 4) onContinue();
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
          <Text style={styles.stepHeaderTitle}>Step 4 of 6 · Damage Inspection</Text>
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

        {/* Damaged produce detected? (Red for Yes, Green for No) */}
        <Text style={styles.inputLabelBold}>
          Damaged produce detected <Text style={{ color: '#EF4444' }}>*</Text>
        </Text>
        <View style={styles.decisionRow}>
          {/* Yes -> Red border & soft red bg */}
          <TouchableOpacity
            style={[
              styles.decisionBtn,
              hasDamage === 'Yes' && styles.decisionBtnYesActive,
            ]}
            onPress={() => setHasDamage('Yes')}
            activeOpacity={0.8}
            accessibilityLabel="Damaged produce detected: Yes"
          >
            <Text
              style={[
                styles.decisionBtnText,
                hasDamage === 'Yes' && styles.decisionBtnTextYesActive,
              ]}
            >
              Yes
            </Text>
          </TouchableOpacity>

          {/* No -> Green border & soft green bg (as in mockup) */}
          <TouchableOpacity
            style={[
              styles.decisionBtn,
              hasDamage === 'No' && styles.decisionBtnNoActive,
            ]}
            onPress={() => {
              setHasDamage('No');
              setDamagedQty('0');
            }}
            activeOpacity={0.8}
            accessibilityLabel="Damaged produce detected: No"
          >
            <Text
              style={[
                styles.decisionBtnText,
                hasDamage === 'No' && styles.decisionBtnTextNoActive,
              ]}
            >
              No
            </Text>
          </TouchableOpacity>
        </View>

        {/* If Damaged Yes, input for damaged quantity */}
        {hasDamage === 'Yes' && (
          <View style={{ marginBottom: 14 }}>
            <Text style={styles.inputLabelBold}>
              Damaged quantity (KG) <Text style={{ color: '#EF4444' }}>*</Text>
            </Text>
            <TextInput
              style={styles.damagedInput}
              keyboardType="numeric"
              placeholder="e.g. 5"
              value={damagedQty}
              onChangeText={setDamagedQty}
            />
          </View>
        )}

        {/* Inspection remarks */}
        <Text style={[styles.inputLabelBold, { marginTop: 10 }]}>Inspection remarks</Text>
        <View style={styles.notesWrap}>
          <TextInput
            style={styles.notesInput}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholder=""
            value={inspectionRemarks}
            onChangeText={setInspectionRemarks}
          />
          <View style={styles.gripCorner}>
            <CornerGripIcon />
          </View>
        </View>

        {/* Quantity summary card (Exact from Screenshot 3) */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Quantity summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Verified quantity</Text>
            <Text style={styles.summaryVal}>{verifiedQty ? `${verifiedQty} KG` : '—'}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Damaged quantity</Text>
            <Text style={styles.summaryVal}>{hasDamage === 'Yes' && damagedNum > 0 ? `${damagedNum} KG` : '—'}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Damage percentage</Text>
            <Text style={styles.summaryVal}>{damagePct}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Potential acceptable (preliminary)</Text>
            <Text style={styles.summaryVal}>{acceptableQty}</Text>
          </View>

          <Text style={styles.summaryFootnote}>
            Preliminary only: verified minus damaged. It is not a purchase approval; the purchase quantity also follows the grade result and TOHFA&apos;s remaining requirement.
          </Text>
        </View>

        {/* Action Buttons: Previous Step & Continue */}
        <View style={styles.stepActionRow}>
          <TouchableOpacity
            style={styles.prevStepBtn}
            onPress={onPreviousStep}
            activeOpacity={0.8}
          >
            <Text style={styles.prevStepBtnText}>Previous Step</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.continueStepBtn}
            onPress={onContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.continueStepBtnText}>Continue</Text>
          </TouchableOpacity>
        </View>

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
    color: THEME.ink,
    marginBottom: 14,
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
    marginBottom: 16,
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
  inputLabelBold: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.ink,
    marginBottom: 8,
  },
  decisionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  decisionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: THEME.white,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  decisionBtnYesActive: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
  },
  decisionBtnNoActive: {
    borderColor: '#15803D',
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
  },
  decisionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.ink,
  },
  decisionBtnTextYesActive: {
    color: '#DC2626',
    fontWeight: '800',
  },
  decisionBtnTextNoActive: {
    color: '#15803D',
    fontWeight: '800',
  },
  damagedInput: {
    height: 46,
    backgroundColor: THEME.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    fontSize: 14,
    color: THEME.ink,
  },
  notesWrap: {
    position: 'relative',
    backgroundColor: THEME.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  notesInput: {
    minHeight: 90,
    padding: 12,
    paddingBottom: 22,
    fontSize: 13,
    color: THEME.ink,
  },
  gripCorner: {
    position: 'absolute',
    right: 8,
    bottom: 8,
  },
  summaryCard: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.ink,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3ECE4',
    borderStyle: 'dashed',
  },
  summaryLabel: {
    fontSize: 12.5,
    color: THEME.muted,
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.ink,
  },
  summaryFootnote: {
    fontSize: 11,
    color: THEME.muted,
    lineHeight: 15,
    marginTop: 12,
  },
  stepActionRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 10,
  },
  prevStepBtn: {
    flex: 1,
    height: 48,
    backgroundColor: THEME.white,
    borderWidth: 1.5,
    borderColor: THEME.orangeBtn,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prevStepBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.orangeBtn,
  },
  continueStepBtn: {
    flex: 1,
    height: 48,
    backgroundColor: THEME.orangeBtn,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueStepBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.white,
  },
});
