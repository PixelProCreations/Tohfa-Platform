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
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';
import { t } from '../../i18n';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
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

function UploadDocumentIcon({ size = 20, color = adminColors.brandDeep }: { size?: number; color?: string }) {
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
      <Line x1="11" y1="3" x2="3" y2="11" stroke={adminColors.muted} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="11" y1="7" x2="7" y2="11" stroke={adminColors.muted} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export interface ProduceGradeCheckScreenProps {
  listingId?: string | undefined;
  cropName?: string | undefined;
  farmerName?: string | undefined;
  selectedGrade?: 'Grade 1' | 'Grade 2' | 'Rejected' | undefined;
  onBack: () => void;
  onPreviousStep: () => void;
  onContinue: (grade: 'Grade 1' | 'Grade 2' | 'Rejected') => void;
  onGoToStep?: (step: number) => void;
}

export function ProduceGradeCheckScreen({
  listingId,
  cropName,
  farmerName,
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

  const subtitle = [listingId, cropName, farmerName].filter(Boolean).join(' · ');

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel={t('produceGradeCheck.backLabel')}
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('produceGradeCheck.title')}</Text>
        </View>
        {subtitle ? (
          <Text style={styles.headerSubtitle}>{subtitle}</Text>
        ) : null}
      </View>

      {/* ─── Scroll Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Verification steps header */}
        <Text style={styles.sectionTitle}>{t('produceGradeCheck.section.steps')}</Text>

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
          <Text style={styles.stepHeaderTitle}>{t('produceGradeCheck.stepHeader')}</Text>
          <View style={styles.notCompletedBadge}>
            <Text style={styles.notCompletedBadgeText}>{t('produceGradeCheck.notCompleted')}</Text>
          </View>
        </View>

        {/* APPLICABLE GRADING STANDARD Card */}
        <View style={styles.standardCard}>
          <Text style={styles.standardLabel}>{t('produceGradeCheck.label.standard')}</Text>
          <Text style={styles.standardText}>
            {t('produceGradeCheck.standardText')}
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
            <Text style={styles.gradeTitle}>{t('produceGradeCheck.grade1Title')}</Text>
            <Text style={styles.gradeDesc}>
              {t('produceGradeCheck.grade1Desc')}
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
            <Text style={styles.gradeTitle}>{t('produceGradeCheck.grade2Title')}</Text>
            <Text style={styles.gradeDesc}>
              {t('produceGradeCheck.grade2Desc')}
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
            <Text style={styles.gradeTitle}>{t('produceGradeCheck.rejectedTitle')}</Text>
            <Text style={styles.gradeDesc}>{t('produceGradeCheck.rejectedDesc')}</Text>
          </View>
        </TouchableOpacity>

        {/* Grade remarks input */}
        <Text style={styles.inputLabelBold}>{t('produceGradeCheck.label.remarks')}</Text>
        <View style={styles.notesWrap}>
          <TextInput
            style={styles.notesInput}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholder=""
            placeholderTextColor={adminColors.placeholder}
            value={gradeRemarks}
            onChangeText={setGradeRemarks}
          />
          <View style={styles.gripCorner}>
            <CornerGripIcon />
          </View>
        </View>

        {/* Supporting photographs (optional) upload */}
        <Text style={[styles.inputLabelBold, { marginTop: adminSpacing.lg }]}>
          {t('produceGradeCheck.label.photos')}
        </Text>
        <TouchableOpacity
          style={styles.uploadBox}
          onPress={() => {
            setUploadedPhoto('grade_inspection_01.jpg');
            Alert.alert('Photo Attached', 'grade_inspection_01.jpg attached successfully.');
          }}
          activeOpacity={0.7}
        >
          <UploadDocumentIcon size={20} color={adminColors.brandDeep} />
          <Text style={styles.uploadText}>
            {uploadedPhoto ?? t('produceGradeCheck.uploadText')}
          </Text>
        </TouchableOpacity>

        {/* Action Buttons: Previous Step & Continue */}
        <View style={styles.stepActionRow}>
          <TouchableOpacity
            style={styles.prevStepBtn}
            onPress={onPreviousStep}
            activeOpacity={0.8}
          >
            <Text style={styles.prevStepBtnText}>{t('produceGradeCheck.action.prevStep')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.continueStepBtn}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.continueStepBtnText}>{t('produceGradeCheck.action.continue')}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: adminSpacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    ...adminType.rowMeta,
    color: adminColors.onBrand,
    opacity: 0.9,
    marginTop: adminSpacing.xs,
    paddingLeft: 42,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
  },
  sectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.md,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.lg,
    paddingHorizontal: 4,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.full,
    borderWidth: 2,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    borderColor: adminColors.brand,
    borderWidth: 2,
  },
  stepCircleText: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.muted,
  },
  stepCircleTextActive: {
    color: adminColors.brand,
    fontWeight: '800',
  },
  stepperLine: {
    flex: 1,
    height: 2,
    backgroundColor: adminColors.border,
    marginHorizontal: 0,
  },
  stepperLineActive: {
    backgroundColor: adminColors.brand,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.md,
  },
  stepHeaderTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  notCompletedBadge: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.xs,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  notCompletedBadgeText: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.muted,
  },
  outstandingCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
    gap: 4,
    ...adminShadow.sm,
  },
  outstandingTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginBottom: 4,
  },
  outstandingItem: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
  standardCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  standardLabel: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.muted,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  standardText: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.ink,
  },
  gradeCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    ...adminShadow.sm,
  },
  gradeCardSelected: {
    borderColor: adminColors.brand,
    borderWidth: 1.5,
  },
  swatchCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: adminColors.brandTint,
  },
  gradeTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginBottom: 2,
  },
  gradeDesc: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  footnoteCaption: {
    ...adminType.caption,
    color: adminColors.muted,
    marginVertical: adminSpacing.md,
  },
  inputLabelBold: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginBottom: 6,
  },
  notesWrap: {
    position: 'relative',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  notesInput: {
    minHeight: 90,
    padding: adminSpacing.md,
    paddingBottom: 22,
    ...adminType.body,
    color: adminColors.ink,
  },
  gripCorner: {
    position: 'absolute',
    right: 8,
    bottom: 8,
  },
  uploadBox: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.lg,
    paddingHorizontal: adminSpacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: adminSpacing.sm,
  },
  uploadText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },
  stepActionRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    alignItems: 'center',
    marginTop: adminSpacing.lg,
    marginBottom: adminSpacing.sm,
  },
  prevStepBtn: {
    flex: 1,
    height: 48,
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prevStepBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brand,
  },
  continueStepBtn: {
    flex: 1,
    height: 48,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueStepBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
  },
});
