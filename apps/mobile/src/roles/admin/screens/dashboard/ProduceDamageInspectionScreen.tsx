import React, { useState } from 'react';
import {
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

function CornerGripIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
      <Line x1="11" y1="3" x2="3" y2="11" stroke={adminColors.muted} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="11" y1="7" x2="7" y2="11" stroke={adminColors.muted} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export interface ProduceDamageInspectionScreenProps {
  listingId?: string | undefined;
  cropName?: string | undefined;
  farmerName?: string | undefined;
  verifiedQty?: number | undefined;
  onBack: () => void;
  onPreviousStep: () => void;
  onContinue: () => void;
  onGoToStep?: (step: number) => void;
}

export function ProduceDamageInspectionScreen({
  listingId,
  cropName,
  farmerName,
  verifiedQty = 0,
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
            accessibilityLabel={t('produceDamageInspection.backLabel')}
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('produceDamageInspection.title')}</Text>
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
        <Text style={styles.sectionTitle}>{t('produceDamageInspection.section.steps')}</Text>

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
          <Text style={styles.stepHeaderTitle}>{t('produceDamageInspection.stepHeader')}</Text>
          <View style={styles.notCompletedBadge}>
            <Text style={styles.notCompletedBadgeText}>{t('produceDamageInspection.notCompleted')}</Text>
          </View>
        </View>

        {/* Outstanding Card */}
        <View style={styles.outstandingCard}>
          <Text style={styles.outstandingTitle}>{t('produceDamageInspection.section.outstanding')}</Text>
          <Text style={styles.outstandingItem}>• Step 1 Quantity Check: Enter the verified quantity.</Text>
          <Text style={styles.outstandingItem}>• Step 2 Quality Verification: Freshness: mark the result.</Text>
          <Text style={styles.outstandingItem}>• Step 3 Grade Check: Select the grade.</Text>
          <Text style={styles.outstandingItem}>• and 2 more</Text>
        </View>

        {/* Damaged produce detected? */}
        <Text style={styles.inputLabelBold}>
          {t('produceDamageInspection.label.damageDetected')} <Text style={{ color: adminColors.danger.text }}>*</Text>
        </Text>
        <View style={styles.decisionRow}>
          <TouchableOpacity
            style={[
              styles.decisionBtn,
              hasDamage === 'Yes' && styles.decisionBtnYesActive,
            ]}
            onPress={() => setHasDamage('Yes')}
            activeOpacity={0.8}
            accessibilityLabel={`${t('produceDamageInspection.label.damageDetected')}: ${t('produceDamageInspection.yes')}`}
          >
            <Text
              style={[
                styles.decisionBtnText,
                hasDamage === 'Yes' && styles.decisionBtnTextYesActive,
              ]}
            >
              {t('produceDamageInspection.yes')}
            </Text>
          </TouchableOpacity>

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
            accessibilityLabel={`${t('produceDamageInspection.label.damageDetected')}: ${t('produceDamageInspection.no')}`}
          >
            <Text
              style={[
                styles.decisionBtnText,
                hasDamage === 'No' && styles.decisionBtnTextNoActive,
              ]}
            >
              {t('produceDamageInspection.no')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* If Damaged Yes, input for damaged quantity */}
        {hasDamage === 'Yes' && (
          <View style={{ marginBottom: adminSpacing.md }}>
            <Text style={styles.inputLabelBold}>
              {t('produceDamageInspection.label.damagedQty')} <Text style={{ color: adminColors.danger.text }}>*</Text>
            </Text>
            <TextInput
              style={styles.damagedInput}
              keyboardType="numeric"
              placeholder="e.g. 5"
              placeholderTextColor={adminColors.placeholder}
              value={damagedQty}
              onChangeText={setDamagedQty}
            />
          </View>
        )}

        {/* Inspection remarks */}
        <Text style={[styles.inputLabelBold, { marginTop: adminSpacing.sm }]}>
          {t('produceDamageInspection.label.remarks')}
        </Text>
        <View style={styles.notesWrap}>
          <TextInput
            style={styles.notesInput}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholder=""
            placeholderTextColor={adminColors.placeholder}
            value={inspectionRemarks}
            onChangeText={setInspectionRemarks}
          />
          <View style={styles.gripCorner}>
            <CornerGripIcon />
          </View>
        </View>

        {/* Quantity summary card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{t('produceDamageInspection.section.summary')}</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('produceDamageInspection.label.verifiedQty')}</Text>
            <Text style={styles.summaryVal}>{verifiedQty ? `${verifiedQty} KG` : '—'}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('produceDamageInspection.label.damagedQty')}</Text>
            <Text style={styles.summaryVal}>{hasDamage === 'Yes' && damagedNum > 0 ? `${damagedNum} KG` : '—'}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('produceDamageInspection.label.damagePct')}</Text>
            <Text style={styles.summaryVal}>{damagePct}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('produceDamageInspection.label.potentialAcceptable')}</Text>
            <Text style={styles.summaryVal}>{acceptableQty}</Text>
          </View>

          <Text style={styles.summaryFootnote}>
            {t('produceDamageInspection.summaryFootnote')}
          </Text>
        </View>

        {/* Action Buttons: Previous Step & Continue */}
        <View style={styles.stepActionRow}>
          <TouchableOpacity
            style={styles.prevStepBtn}
            onPress={onPreviousStep}
            activeOpacity={0.8}
          >
            <Text style={styles.prevStepBtnText}>{t('produceDamageInspection.action.prevStep')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.continueStepBtn}
            onPress={onContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.continueStepBtnText}>{t('produceDamageInspection.action.continue')}</Text>
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
    marginBottom: adminSpacing.lg,
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
  inputLabelBold: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginBottom: adminSpacing.sm,
  },
  decisionRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    marginBottom: adminSpacing.lg,
  },
  decisionBtn: {
    flex: 1,
    height: 48,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decisionBtnYesActive: {
    borderColor: adminColors.danger.text,
    backgroundColor: adminColors.danger.bg,
    borderWidth: 1.5,
  },
  decisionBtnNoActive: {
    borderColor: adminColors.success.text,
    backgroundColor: adminColors.success.bg,
    borderWidth: 1.5,
  },
  decisionBtnText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  decisionBtnTextYesActive: {
    color: adminColors.danger.text,
    fontWeight: '800',
  },
  decisionBtnTextNoActive: {
    color: adminColors.success.text,
    fontWeight: '800',
  },
  damagedInput: {
    height: 46,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    ...adminType.body,
    color: adminColors.ink,
  },
  notesWrap: {
    position: 'relative',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.lg,
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
  summaryCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  summaryTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    borderStyle: 'dashed',
  },
  summaryLabel: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
  summaryVal: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  summaryFootnote: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: adminSpacing.md,
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
