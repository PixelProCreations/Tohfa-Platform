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

export interface ProduceFinalEligibilityDecisionScreenProps {
  listingId?: string | undefined;
  cropName?: string | undefined;
  farmerName?: string | undefined;
  farmerId?: string | undefined;
  listedQty?: number | undefined;
  selectedGrade?: string | undefined;
  onBack: () => void;
  onPreviousStep: () => void;
  onApproveSuccess?: () => void;
  onGoToStep?: (step: number) => void;
}

export function ProduceFinalEligibilityDecisionScreen({
  listingId,
  cropName,
  farmerName,
  farmerId,
  listedQty,
  selectedGrade,
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
            accessibilityLabel={t('produceFinalEligibilityDecision.backLabel')}
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('produceFinalEligibilityDecision.title')}</Text>
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
        <Text style={styles.sectionTitle}>{t('produceFinalEligibilityDecision.section.steps')}</Text>

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
          <Text style={styles.stepHeaderTitle}>{t('produceFinalEligibilityDecision.stepHeader')}</Text>
          <View style={styles.notCompletedBadge}>
            <Text style={styles.notCompletedBadgeText}>{t('produceFinalEligibilityDecision.notCompleted')}</Text>
          </View>
        </View>

        {/* Outstanding Card */}
        <View style={styles.outstandingCard}>
          <Text style={styles.outstandingTitle}>{t('produceFinalEligibilityDecision.section.outstanding')}</Text>
          <Text style={styles.outstandingItem}>• Step 1 Quantity Check: Enter the verified quantity.</Text>
          <Text style={styles.outstandingItem}>• Step 2 Quality Verification: Freshness: mark the result.</Text>
          <Text style={styles.outstandingItem}>• Step 3 Grade Check: Select the grade.</Text>
          <Text style={styles.outstandingItem}>• and 2 more</Text>
        </View>

        {/* Verification Summary */}
        <Text style={styles.sectionHeaderTitle}>{t('produceFinalEligibilityDecision.section.summary')}</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryGridRow}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryColLabel}>{t('produceFinalEligibilityDecision.label.farmer')}</Text>
              <Text style={styles.summaryColValue}>
                {[farmerName, farmerId].filter(Boolean).join(' · ')}
              </Text>
            </View>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryColLabel}>{t('produceFinalEligibilityDecision.label.listing')}</Text>
              <Text style={styles.summaryColValue}>
                {[listingId, cropName].filter(Boolean).join(' · ')}
              </Text>
            </View>
          </View>

          <View style={styles.summaryGridRow}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryColLabel}>{t('produceFinalEligibilityDecision.label.listedQty')}</Text>
              <Text style={styles.summaryColValue}>{listedQty ? `${listedQty} KG` : '—'}</Text>
            </View>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryColLabel}>{t('produceFinalEligibilityDecision.label.verifiedQty')}</Text>
              <Text style={styles.summaryColValue}>—</Text>
            </View>
          </View>

          <View style={styles.summaryGridRow}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryColLabel}>{t('produceFinalEligibilityDecision.label.damagedQty')}</Text>
              <Text style={styles.summaryColValue}>—</Text>
            </View>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryColLabel}>{t('produceFinalEligibilityDecision.label.potentialAcceptable')}</Text>
              <Text style={styles.summaryColValue}>—</Text>
            </View>
          </View>

          <View style={styles.summaryGridRow}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryColLabel}>{t('produceFinalEligibilityDecision.label.selectedGrade')}</Text>
              <Text style={styles.summaryColValue}>{selectedGrade ?? '—'}</Text>
            </View>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryColLabel}>{t('produceFinalEligibilityDecision.label.remainingRequired')}</Text>
              <Text style={styles.summaryColValue}>30 KG</Text>
            </View>
          </View>

          <View style={styles.summaryGridRow}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryColLabel}>{t('produceFinalEligibilityDecision.label.proposedPrice')}</Text>
              <Text style={styles.summaryColValue}>—</Text>
            </View>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryColLabel}>{t('produceFinalEligibilityDecision.label.eligibleQty')}</Text>
              <Text style={styles.summaryColValue}>—</Text>
            </View>
          </View>
        </View>

        {/* Eligibility Checklist */}
        <Text style={styles.sectionHeaderTitle}>{t('produceFinalEligibilityDecision.section.checklist')}</Text>
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
          {t('produceFinalEligibilityDecision.checklistFootnote')}
        </Text>

        {/* Decision Section */}
        <Text style={styles.sectionHeaderTitle}>{t('produceFinalEligibilityDecision.section.decision')}</Text>
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            {t('produceFinalEligibilityDecision.warningText')}
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
          <Text style={styles.approveBtnTextDisabled}>{t('produceFinalEligibilityDecision.action.approve')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.rejectBtn}
          onPress={() => {
            Alert.alert('Listing Rejected', `Listing ${listingId ?? ''} marked as rejected.`);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.rejectBtnText}>{t('produceFinalEligibilityDecision.action.reject')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.reviewBtn}
          onPress={() => {
            Alert.alert('Sent for Further Review', `Listing ${listingId ?? ''} flagged for secondary review.`);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.reviewBtnText}>{t('produceFinalEligibilityDecision.action.review')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.prevBtn}
          onPress={onPreviousStep}
          activeOpacity={0.8}
        >
          <Text style={styles.prevBtnText}>{t('produceFinalEligibilityDecision.action.prevStep')}</Text>
        </TouchableOpacity>

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
    color: adminColors.rustDeep,
    marginBottom: adminSpacing.md,
  },
  sectionHeaderTitle: {
    ...adminType.sectionHead,
    color: adminColors.rustDeep,
    marginTop: adminSpacing.lg,
    marginBottom: adminSpacing.sm,
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
    marginBottom: adminSpacing.sm,
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
  summaryCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    gap: 14,
    ...adminShadow.sm,
  },
  summaryGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCol: {
    width: '48%',
  },
  summaryColLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: 3,
  },
  summaryColValue: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  checklistCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: 6,
    ...adminShadow.sm,
  },
  checkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  checkRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    borderStyle: 'dashed',
  },
  checkLabel: {
    ...adminType.body,
    color: adminColors.ink,
  },
  checkLabelBold: {
    fontWeight: '800',
  },
  checkStatus: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  checklistFootnote: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: adminSpacing.sm,
  },
  warningBox: {
    backgroundColor: adminColors.brandTintWarm,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  warningText: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '600',
  },
  approveBtnDisabled: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  approveBtnTextDisabled: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },
  rejectBtn: {
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.danger.text,
    borderRadius: adminRadius.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  rejectBtnText: {
    ...adminType.rowTitle,
    color: adminColors.danger.text,
  },
  reviewBtn: {
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  reviewBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brand,
  },
  prevBtn: {
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prevBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brand,
  },
});
