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
  borderDashed: '#D1D5DB',

  // Typography
  titleRustDark: adminColors.brandDeep,
  ink: adminColors.ink, // Dark ink
  muted: adminColors.muted, // Secondary gray

  // Buttons & Actions
  orangeBtn: adminColors.brand,

  // Badges
  notCompletedBg: '#F3F4F6',
  notCompletedText: '#4B5563',

  // Quality check states (Exact requested green & red)
  greenBorder: '#15803D',
  greenBg: '#F0FDF4',
  greenText: '#15803D',
  redBorder: '#DC2626',
  redBg: '#FEF2F2',
  redText: '#DC2626',
  btnDefaultBorder: '#E5E7EB',
  btnDefaultBg: '#FFFFFF',
  btnDefaultText: '#1F2937',
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

function UploadDocumentIcon({ size = 20, color = THEME.titleRustDark }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 2v6h6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 18v-6M9 15l3-3 3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

// ─── Step 2 Quality Checks Config (Exact from Mockups S03B) ───────────────────
export interface QualityCheckConfig {
  id: string;
  title: string;
  standard: string;
  leftLabel: string;
  rightLabel: string;
}

export const QUALITY_CHECKS_CONFIG: QualityCheckConfig[] = [
  {
    id: 'freshness',
    title: 'Freshness',
    standard: 'Standard: Fresh, no wilting',
    leftLabel: 'Meets Standard',
    rightLabel: 'Does Not Meet Standard',
  },
  {
    id: 'colour',
    title: 'Colour',
    standard: 'Standard: Uniform ripe colour',
    leftLabel: 'Meets Standard',
    rightLabel: 'Does Not Meet Standard',
  },
  {
    id: 'size_appearance',
    title: 'Size and Appearance',
    standard: 'Standard: Even size, no blemishes',
    leftLabel: 'Meets Standard',
    rightLabel: 'Does Not Meet Standard',
  },
  {
    id: 'maturity',
    title: 'Maturity',
    standard: 'Standard: Correct maturity for the grade',
    leftLabel: 'Meets Standard',
    rightLabel: 'Does Not Meet Standard',
  },
  {
    id: 'cleanliness',
    title: 'Cleanliness',
    standard: 'Standard: Free of soil and residue',
    leftLabel: 'Meets Standard',
    rightLabel: 'Does Not Meet Standard',
  },
  {
    id: 'foreign_matter',
    title: 'Foreign Matter',
    standard: 'Standard: Within allowed limit',
    leftLabel: 'Within Allowed Limit',
    rightLabel: 'Exceeds Allowed Limit',
  },
  {
    id: 'firmness',
    title: 'Firmness',
    standard: 'Standard: Firm to the touch',
    leftLabel: 'Meets Standard',
    rightLabel: 'Does Not Meet Standard',
  },
];

export interface ProduceQualityVerificationScreenProps {
  listingId?: string;
  cropName?: string;
  farmerName?: string;
  onBack: () => void;
  onPreviousStep: () => void;
  onContinue?: () => void;
  onGoToStep?: (step: number) => void;
}

export function ProduceQualityVerificationScreen({
  listingId = 'PL-001245',
  cropName = 'Tomato',
  farmerName = 'Ramesh Kumar',
  onBack,
  onPreviousStep,
  onContinue,
  onGoToStep,
}: ProduceQualityVerificationScreenProps) {
  // Step 2 Quality Check States (Initial selection matches S03B: freshness=fail, colour=pass)
  const [qualityCheckResults, setQualityCheckResults] = useState<Record<string, 'pass' | 'fail' | null>>({
    freshness: 'fail',
    colour: 'pass',
    size_appearance: null,
    maturity: null,
    cleanliness: null,
    foreign_matter: null,
    firmness: null,
  });

  const [inspectionNotes, setInspectionNotes] = useState('');
  const [inspectionPhoto, setInspectionPhoto] = useState<string | null>(null);

  const handleToggleCheck = (checkId: string, result: 'pass' | 'fail') => {
    setQualityCheckResults((prev) => ({
      ...prev,
      [checkId]: result,
    }));
  };

  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    } else {
      Alert.alert(
        'Step 2 Completed',
        'Quality verification checks recorded successfully. Proceeding to Step 3 Grade Check.',
      );
    }
  };

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

        {/* Numbered Stepper Circles 1 to 6 (Step 2 active) */}
        <View style={styles.stepperRow}>
          {[1, 2, 3, 4, 5, 6].map((step, idx) => {
            const isCompletedOrActive = step <= 2;
            const isLineActive = step < 2;
            return (
              <React.Fragment key={step}>
                <TouchableOpacity
                  style={[
                    styles.stepCircle,
                    isCompletedOrActive && styles.stepCircleActive,
                  ]}
                  onPress={() => {
                    if (onGoToStep) onGoToStep(step);
                    else if (step === 1) onPreviousStep();
                    else if (step > 2 && onContinue) onContinue();
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
          <Text style={styles.stepHeaderTitle}>Step 2 of 6 · Quality Verification</Text>
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

        {/* Standard Notice Caption */}
        <Text style={styles.stepCaptionText}>
          Only the checks configured for Tomato are shown, with the configured standard beside each.
        </Text>

        {/* The 7 Quality Check Cards (Left = Green, Right = Red) */}
        {QUALITY_CHECKS_CONFIG.map((check) => {
          const result = qualityCheckResults[check.id];
          const isPass = result === 'pass';
          const isFail = result === 'fail';

          return (
            <View key={check.id} style={styles.qualityCard}>
              <Text style={styles.qualityTitle}>
                {check.title} <Text style={{ color: '#EF4444' }}>*</Text>
              </Text>
              <Text style={styles.qualityStandard}>{check.standard}</Text>

              <View style={styles.qualityBtnRow}>
                {/* Left Button -> Meets Standard (Green active when clicked) */}
                <TouchableOpacity
                  style={[
                    styles.qualityBtn,
                    isPass ? styles.qualityBtnPassActive : styles.qualityBtnDefault,
                  ]}
                  onPress={() => handleToggleCheck(check.id, 'pass')}
                  activeOpacity={0.7}
                  accessibilityLabel={`${check.title} ${check.leftLabel}`}
                >
                  <Text
                    style={[
                      styles.qualityBtnText,
                      isPass ? styles.qualityBtnTextPass : styles.qualityBtnTextDefault,
                    ]}
                  >
                    {check.leftLabel}
                  </Text>
                </TouchableOpacity>

                {/* Right Button -> Does Not Meet Standard (Red active when clicked) */}
                <TouchableOpacity
                  style={[
                    styles.qualityBtn,
                    isFail ? styles.qualityBtnFailActive : styles.qualityBtnDefault,
                  ]}
                  onPress={() => handleToggleCheck(check.id, 'fail')}
                  activeOpacity={0.7}
                  accessibilityLabel={`${check.title} ${check.rightLabel}`}
                >
                  <Text
                    style={[
                      styles.qualityBtnText,
                      isFail ? styles.qualityBtnTextFail : styles.qualityBtnTextDefault,
                    ]}
                  >
                    {check.rightLabel}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* Inspection notes Textarea with corner grip */}
        <Text style={styles.inputLabelBold}>Inspection notes</Text>
        <View style={styles.notesWrap}>
          <TextInput
            style={styles.notesInput}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholder=""
            value={inspectionNotes}
            onChangeText={setInspectionNotes}
          />
          <View style={styles.gripCorner}>
            <CornerGripIcon />
          </View>
        </View>

        {/* Inspection photographs upload box */}
        <Text style={[styles.inputLabelBold, { marginTop: 16 }]}>Inspection photographs</Text>
        <TouchableOpacity
          style={styles.uploadBox}
          onPress={() => {
            setInspectionPhoto('quality_inspection_photo_01.jpg');
            Alert.alert('Photograph Attached', 'quality_inspection_photo_01.jpg attached.');
          }}
          activeOpacity={0.7}
        >
          <UploadDocumentIcon size={20} color={THEME.titleRustDark} />
          <Text style={styles.uploadText}>
            {inspectionPhoto ?? 'Upload file'}
          </Text>
        </TouchableOpacity>

        {/* Action Buttons Row: Previous Step (Outline) & Continue (Solid Orange) */}
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
            onPress={handleContinue}
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

  // ─── Scroll Body ───
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },

  // ─── Section Title ───
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.ink,
    marginBottom: 14,
  },

  // ─── Stepper Row ───
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

  // ─── Step Header Row ───
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

  // ─── Outstanding Card ───
  outstandingCard: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 16,
    marginBottom: 12,
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

  // ─── Step Notice Caption ───
  stepCaptionText: {
    fontSize: 12,
    color: THEME.muted,
    lineHeight: 17,
    marginTop: 2,
    marginBottom: 14,
  },

  // ─── Quality Card ───
  qualityCard: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 16,
    marginBottom: 12,
  },
  qualityTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.ink,
  },
  qualityStandard: {
    fontSize: 12,
    color: THEME.muted,
    marginTop: 3,
    marginBottom: 14,
  },
  qualityBtnRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  qualityBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    borderWidth: 1.5,
  },
  qualityBtnDefault: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  qualityBtnPassActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#15803D',
  },
  qualityBtnFailActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
  },
  qualityBtnText: {
    fontSize: 12.5,
    textAlign: 'center',
  },
  qualityBtnTextDefault: {
    color: THEME.ink,
    fontWeight: '700',
  },
  qualityBtnTextPass: {
    color: '#15803D',
    fontWeight: '800',
  },
  qualityBtnTextFail: {
    color: '#DC2626',
    fontWeight: '800',
  },

  // ─── Inspection Notes & Photographs ───
  inputLabelBold: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.ink,
    marginBottom: 6,
  },
  notesWrap: {
    position: 'relative',
    backgroundColor: THEME.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  uploadBox: {
    backgroundColor: THEME.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: THEME.borderDashed,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  uploadText: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.titleRustDark,
  },

  // ─── Step Action Buttons ───
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
