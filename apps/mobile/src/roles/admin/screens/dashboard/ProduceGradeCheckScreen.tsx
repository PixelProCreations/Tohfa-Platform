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
  orangeBorder: adminColors.brand,

  // Badges
  notCompletedBg: '#F3F4F6',
  notCompletedText: '#4B5563',

  // Swatch indicator
  swatchBeige: '#E8D3B9',
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

export interface ProduceGradeCheckScreenProps {
  listingId?: string;
  cropName?: string;
  farmerName?: string;
  selectedGrade?: 'Grade 1' | 'Grade 2' | 'Rejected';
  onBack: () => void;
  onPreviousStep: () => void;
  onContinue: (grade: 'Grade 1' | 'Grade 2' | 'Rejected') => void;
  onGoToStep?: (step: number) => void;
}

export function ProduceGradeCheckScreen({
  listingId = 'PL-001245',
  cropName = 'Tomato',
  farmerName = 'Ramesh Kumar',
  selectedGrade: initialGrade = 'Grade 1',
  onBack,
  onPreviousStep,
  onContinue,
  onGoToStep,
}: ProduceGradeCheckScreenProps) {
  const [selectedGrade, setSelectedGrade] = useState<'Grade 1' | 'Grade 2' | 'Rejected'>(initialGrade);
  const [gradeRemarks, setGradeRemarks] = useState('');
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);

  const handleContinue = () => {
    onContinue(selectedGrade);
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

        {/* Numbered Stepper Circles 1 to 6 (Step 3 active) */}
        <View style={styles.stepperRow}>
          {[1, 2, 3, 4, 5, 6].map((step, idx) => {
            const isCompletedOrActive = step <= 3;
            const isLineActive = step < 3;
            return (
              <React.Fragment key={step}>
                <TouchableOpacity
                  style={[
                    styles.stepCircle,
                    isCompletedOrActive && styles.stepCircleActive,
                  ]}
                  onPress={() => {
                    if (onGoToStep) onGoToStep(step);
                    else if (step < 3) onPreviousStep();
                    else if (step > 3) handleContinue();
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
          <Text style={styles.stepHeaderTitle}>Step 3 of 6 · Grade Check</Text>
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

        {/* APPLICABLE GRADING STANDARD Card (Screenshot 1) */}
        <View style={styles.standardCard}>
          <Text style={styles.standardLabel}>APPLICABLE GRADING STANDARD</Text>
          <Text style={styles.standardText}>
            Tomato grades as configured by TOHFA. The farmer declared Grade 1.
          </Text>
        </View>

        {/* Grade Options */}
        {/* Option 1: Grade 1 */}
        <TouchableOpacity
          style={[
            styles.gradeCard,
            selectedGrade === 'Grade 1' && styles.gradeCardSelected,
          ]}
          onPress={() => setSelectedGrade('Grade 1')}
          activeOpacity={0.85}
        >
          <View style={styles.swatchCircle} />
          <View style={{ flex: 1 }}>
            <Text style={styles.gradeTitle}>Grade 1</Text>
            <Text style={styles.gradeDesc}>
              Uniform size and colour, no visible defects · reference Rs. 95-105/KG
            </Text>
          </View>
        </TouchableOpacity>

        {/* Option 2: Grade 2 */}
        <TouchableOpacity
          style={[
            styles.gradeCard,
            selectedGrade === 'Grade 2' && styles.gradeCardSelected,
          ]}
          onPress={() => setSelectedGrade('Grade 2')}
          activeOpacity={0.85}
        >
          <View style={styles.swatchCircle} />
          <View style={{ flex: 1 }}>
            <Text style={styles.gradeTitle}>Grade 2</Text>
            <Text style={styles.gradeDesc}>
              Minor size or colour variation, minor surface marks · reference Rs. 80-90/KG
            </Text>
          </View>
        </TouchableOpacity>

        {/* Option 3: Rejected */}
        <TouchableOpacity
          style={[
            styles.gradeCard,
            selectedGrade === 'Rejected' && styles.gradeCardSelected,
          ]}
          onPress={() => setSelectedGrade('Rejected')}
          activeOpacity={0.85}
        >
          <View style={styles.swatchCircle} />
          <View style={{ flex: 1 }}>
            <Text style={styles.gradeTitle}>Rejected</Text>
            <Text style={styles.gradeDesc}>Does not meet Grade 2</Text>
          </View>
        </TouchableOpacity>

        {/* Footnote Caption */}
        <Text style={styles.footnoteCaption}>
          No grade recommendation is configured, so none is suggested. The grade is chosen by you against the criteria above.
        </Text>

        {/* Grade remarks input */}
        <Text style={styles.inputLabelBold}>Grade remarks</Text>
        <View style={styles.notesWrap}>
          <TextInput
            style={styles.notesInput}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholder=""
            value={gradeRemarks}
            onChangeText={setGradeRemarks}
          />
          <View style={styles.gripCorner}>
            <CornerGripIcon />
          </View>
        </View>

        {/* Supporting photographs (optional) upload */}
        <Text style={[styles.inputLabelBold, { marginTop: 16 }]}>Supporting photographs (optional)</Text>
        <TouchableOpacity
          style={styles.uploadBox}
          onPress={() => {
            setUploadedPhoto('grade_inspection_01.jpg');
            Alert.alert('Photo Attached', 'grade_inspection_01.jpg attached successfully.');
          }}
          activeOpacity={0.7}
        >
          <UploadDocumentIcon size={20} color={THEME.titleRustDark} />
          <Text style={styles.uploadText}>
            {uploadedPhoto ?? 'Upload file'}
          </Text>
        </TouchableOpacity>

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
  standardCard: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 16,
    marginBottom: 12,
  },
  standardLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  standardText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: THEME.ink,
    lineHeight: 19,
  },
  gradeCard: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  gradeCardSelected: {
    borderColor: THEME.orangeBorder,
    borderWidth: 1.5,
  },
  swatchCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.swatchBeige,
  },
  gradeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.ink,
    marginBottom: 2,
  },
  gradeDesc: {
    fontSize: 12,
    color: THEME.muted,
    lineHeight: 16,
  },
  footnoteCaption: {
    fontSize: 11.5,
    color: THEME.muted,
    lineHeight: 16,
    marginVertical: 12,
  },
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
