import React from 'react';
import {
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

function CurrencyCheckIcon({ size = 34, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960">
      <Path
        d="M260-361v-40H160v-80h200v-80H200q-17 0-28.5-11.5T160-601v-160q0-17 11.5-28.5T200-801h60v-40h80v40h100v80H240v80h160q17 0 28.5 11.5T440-601v160q0 17-11.5 28.5T400-401h-60v40h-80Zm298 240L388-291l56-56 114 114 226-226 56 56-282 282Z"
        fill={color}
      />
    </Svg>
  );
}

export interface ProduceFairPriceCheckScreenProps {
  listingId?: string | undefined;
  cropName?: string | undefined;
  farmerName?: string | undefined;
  grade?: string | undefined;
  fairPriceRange?: string | undefined;
  onBack: () => void;
  onPreviousStep: () => void;
  onContinue: () => void;
  onGoToStep?: (step: number) => void;
}

export function ProduceFairPriceCheckScreen({
  listingId,
  cropName,
  farmerName,
  grade,
  fairPriceRange,
  onBack,
  onPreviousStep,
  onContinue,
  onGoToStep,
}: ProduceFairPriceCheckScreenProps) {
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
            accessibilityLabel={t('produceFairPriceCheck.backLabel')}
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('produceFairPriceCheck.title')}</Text>
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
        <Text style={styles.sectionTitle}>{t('produceFairPriceCheck.section.steps')}</Text>

        {/* Numbered Stepper Circles 1 to 6 (Step 5 active) */}
        <View style={styles.stepperRow}>
          {[1, 2, 3, 4, 5, 6].map((step, idx) => {
            const isCompletedOrActive = step <= 5;
            const isLineActive = step < 5;
            return (
              <React.Fragment key={step}>
                <TouchableOpacity
                  style={[
                    styles.stepCircle,
                    isCompletedOrActive && styles.stepCircleActive,
                  ]}
                  onPress={() => {
                    if (onGoToStep) onGoToStep(step);
                    else if (step <= 4) onPreviousStep();
                    else if (step > 5) onContinue();
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
          <Text style={styles.stepHeaderTitle}>{t('produceFairPriceCheck.stepHeader')}</Text>
          <View style={styles.notCompletedBadge}>
            <Text style={styles.notCompletedBadgeText}>{t('produceFairPriceCheck.notCompleted')}</Text>
          </View>
        </View>

        {/* Outstanding Card */}
        <View style={styles.outstandingCard}>
          <Text style={styles.outstandingTitle}>{t('produceFairPriceCheck.section.outstanding')}</Text>
          <Text style={styles.outstandingItem}>• Step 1 Quantity Check: Enter the verified quantity.</Text>
          <Text style={styles.outstandingItem}>• Step 2 Quality Verification: Freshness: mark the result.</Text>
          <Text style={styles.outstandingItem}>• Step 3 Grade Check: Select the grade.</Text>
          <Text style={styles.outstandingItem}>• and 2 more</Text>
        </View>

        {/* Grade & Fair Price Reference Summary Card */}
        <View style={styles.priceSummaryCard}>
          <View style={styles.priceCol}>
            <Text style={styles.priceColLabel}>{t('produceFairPriceCheck.label.grade')}</Text>
            <Text style={styles.priceColVal}>{grade ?? ''}</Text>
          </View>

          <View style={styles.priceCol}>
            <Text style={styles.priceColLabel}>{t('produceFairPriceCheck.label.reference')}</Text>
            <Text style={styles.priceColVal}>{fairPriceRange ?? ''}</Text>
          </View>
        </View>

        {/* Center Price Check Waiting Card */}
        <View style={styles.waitingCard}>
          <View style={styles.waitingIconWrap}>
            <CurrencyCheckIcon size={32} color={adminColors.muted} />
          </View>
          <Text style={styles.waitingTitle}>{t('produceFairPriceCheck.waitingTitle')}</Text>
          <Text style={styles.waitingSubtitle}>
            {t('produceFairPriceCheck.waitingSubtitle')}
          </Text>
        </View>

        {/* Action Buttons: Previous Step & Continue */}
        <View style={styles.stepActionRow}>
          <TouchableOpacity
            style={styles.prevStepBtn}
            onPress={onPreviousStep}
            activeOpacity={0.8}
          >
            <Text style={styles.prevStepBtnText}>{t('produceFairPriceCheck.action.prevStep')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.continueStepBtn}
            onPress={onContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.continueStepBtnText}>{t('produceFairPriceCheck.action.continue')}</Text>
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
    paddingHorizontal: 2,
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
  priceSummaryCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    ...adminShadow.sm,
  },
  priceCol: {
    flex: 1,
  },
  priceColLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: adminSpacing.xs,
  },
  priceColVal: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  waitingCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  waitingIconWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.sm,
  },
  waitingTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginBottom: 6,
    textAlign: 'center',
  },
  waitingSubtitle: {
    ...adminType.caption,
    color: adminColors.muted,
    textAlign: 'center',
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
