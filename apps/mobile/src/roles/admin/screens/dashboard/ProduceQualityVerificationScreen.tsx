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
import { adminColors, adminRadius, adminSpacing, adminType } from '../../theme';
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

// ─── Step 2 Quality Checks Config ───────────────────────────────────────────

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
  listingId?: string | undefined;
  cropName?: string | undefined;
  farmerName?: string | undefined;
  onBack: () => void;
  onPreviousStep: () => void;
  onContinue?: (() => void) | undefined;
  onGoToStep?: ((step: number) => void) | undefined;
}

export function ProduceQualityVerificationScreen({
  listingId,
  cropName,
  farmerName,
  onBack,
  onPreviousStep,
  onContinue,
  onGoToStep,
}: ProduceQualityVerificationScreenProps) {
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
        t('produceQualityVerification.alert.completedTitle'),
        t('produceQualityVerification.alert.completedMsg'),
      );
    }
  };

  const headerSub = [listingId, cropName, farmerName].filter(Boolean).join(' · ');

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
            accessibilityLabel={t('produceQualityVerification.backLabel')}
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('produceQualityVerification.title')}</Text>
        </View>
        {headerSub.length > 0 && (
          <Text style={styles.headerSubtitle}>{headerSub}</Text>
        )}
      </View>

      {/* ─── Scroll Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>{t('produceQualityVerification.section.steps')}</Text>

        {/* Stepper circles 1 to 6 */}
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
          <Text style={styles.stepHeaderTitle}>{t('produceQualityVerification.stepHeader')}</Text>
          <View style={styles.notCompletedBadge}>
            <Text style={styles.notCompletedBadgeText}>{t('produceQualityVerification.notCompleted')}</Text>
          </View>
        </View>

        {/* Outstanding Card */}
        <View style={styles.outstandingCard}>
          <Text style={styles.outstandingTitle}>{t('produceQualityVerification.section.outstanding')}</Text>
          <Text style={styles.outstandingItem}>• Step 1 Quantity Check: Enter the verified quantity.</Text>
          <Text style={styles.outstandingItem}>• Step 2 Quality Verification: Freshness: mark the result.</Text>
          <Text style={styles.outstandingItem}>• Step 3 Grade Check: Select the grade.</Text>
          <Text style={styles.outstandingItem}>• and 2 more</Text>
        </View>

        {/* Standard Notice Caption */}
        <Text style={styles.stepCaptionText}>
          {t('produceQualityVerification.caption')}
        </Text>

        {/* Quality Check Cards */}
        {QUALITY_CHECKS_CONFIG.map((check) => {
          const result = qualityCheckResults[check.id];
          const isPass = result === 'pass';
          const isFail = result === 'fail';

          return (
            <View key={check.id} style={styles.qualityCard}>
              <Text style={styles.qualityTitle}>
                {check.title} <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <Text style={styles.qualityStandard}>{check.standard}</Text>

              <View style={styles.qualityBtnRow}>
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

        {/* Inspection notes */}
        <Text style={styles.inputLabelBold}>{t('produceQualityVerification.label.notes')}</Text>
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
        <Text style={[styles.inputLabelBold, styles.notesLabelTop]}>{t('produceQualityVerification.label.photos')}</Text>
        <TouchableOpacity
          style={styles.uploadBox}
          onPress={() => {
            setInspectionPhoto('quality_inspection_photo_01.jpg');
            Alert.alert(
              t('produceQualityVerification.alert.photoTitle'),
              t('produceQualityVerification.alert.photoMsg'),
            );
          }}
          activeOpacity={0.7}
        >
          <UploadDocumentIcon size={20} color={adminColors.brandDeep} />
          <Text style={styles.uploadText}>
            {inspectionPhoto ?? t('produceQualityVerification.uploadText')}
          </Text>
        </TouchableOpacity>

        {/* Action Buttons Row */}
        <View style={styles.stepActionRow}>
          <TouchableOpacity
            style={styles.prevStepBtn}
            onPress={onPreviousStep}
            activeOpacity={0.8}
          >
            <Text style={styles.prevStepBtnText}>{t('produceQualityVerification.action.prevStep')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.continueStepBtn}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.continueStepBtnText}>{t('produceQualityVerification.action.continue')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stylesheet ──────────────────────────────────────────────────────────────

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
    ...adminType.sectionHead,
    color: adminColors.onBrand,
  },
  headerSubtitle: {
    ...adminType.caption,
    color: adminColors.onBrand,
    marginTop: adminSpacing.xs,
    paddingLeft: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xxl,
  },
  sectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: adminSpacing.md,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.xl,
    paddingHorizontal: adminSpacing.xs,
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
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.xs,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.xs,
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
    gap: adminSpacing.xs,
  },
  outstandingTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginBottom: adminSpacing.xs,
  },
  outstandingItem: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  stepCaptionText: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: adminSpacing.xs,
    marginBottom: adminSpacing.md,
  },
  qualityCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
  },
  qualityTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  requiredAsterisk: {
    color: adminColors.danger.text,
  },
  qualityStandard: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: adminSpacing.xs,
    marginBottom: adminSpacing.md,
  },
  qualityBtnRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    alignItems: 'center',
  },
  qualityBtn: {
    flex: 1,
    borderRadius: adminRadius.sm,
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    borderWidth: 1.5,
  },
  qualityBtnDefault: {
    backgroundColor: adminColors.card,
    borderColor: adminColors.border,
  },
  qualityBtnPassActive: {
    backgroundColor: adminColors.success.bg,
    borderColor: adminColors.success.text,
  },
  qualityBtnFailActive: {
    backgroundColor: adminColors.danger.bg,
    borderColor: adminColors.danger.text,
  },
  qualityBtnText: {
    ...adminType.caption,
    textAlign: 'center',
  },
  qualityBtnTextDefault: {
    color: adminColors.ink,
    fontWeight: '700',
  },
  qualityBtnTextPass: {
    color: adminColors.success.text,
    fontWeight: '800',
  },
  qualityBtnTextFail: {
    color: adminColors.danger.text,
    fontWeight: '800',
  },
  inputLabelBold: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginBottom: adminSpacing.xs,
  },
  notesLabelTop: {
    marginTop: adminSpacing.lg,
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
    paddingBottom: adminSpacing.xxl,
    ...adminType.body,
    color: adminColors.ink,
  },
  gripCorner: {
    position: 'absolute',
    right: adminSpacing.sm,
    bottom: adminSpacing.sm,
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
    gap: adminSpacing.sm,
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
  bottomSpacer: {
    height: 40,
  },
});
