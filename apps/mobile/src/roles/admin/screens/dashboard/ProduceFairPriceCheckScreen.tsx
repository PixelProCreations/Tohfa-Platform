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

function CurrencyCheckIcon({ size = 34, color = '#4B5563' }: { size?: number; color?: string }) {
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
  listingId?: string;
  cropName?: string;
  farmerName?: string;
  grade?: string;
  fairPriceRange?: string;
  onBack: () => void;
  onPreviousStep: () => void;
  onContinue: () => void;
  onGoToStep?: (step: number) => void;
}

export function ProduceFairPriceCheckScreen({
  listingId = 'PL-001245',
  cropName = 'Tomato',
  farmerName = 'Ramesh Kumar',
  grade = 'Grade 1',
  fairPriceRange = 'Rs. 95-105/KG',
  onBack,
  onPreviousStep,
  onContinue,
  onGoToStep,
}: ProduceFairPriceCheckScreenProps) {
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
          <Text style={styles.stepHeaderTitle}>Step 5 of 6 · Fair Price Check</Text>
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

        {/* Grade & Fair Price Reference Summary Card (Screenshot 4) */}
        <View style={styles.priceSummaryCard}>
          <View style={styles.priceCol}>
            <Text style={styles.priceColLabel}>Grade</Text>
            <Text style={styles.priceColVal}>{grade}</Text>
          </View>

          <View style={styles.priceCol}>
            <Text style={styles.priceColLabel}>Fair price reference</Text>
            <Text style={styles.priceColVal}>{fairPriceRange}</Text>
          </View>
        </View>

        {/* Center Price Check Waiting Card (Exact from Screenshot 4) */}
        <View style={styles.waitingCard}>
          <View style={styles.waitingIconWrap}>
            <CurrencyCheckIcon size={32} color="#4B5563" />
          </View>
          <Text style={styles.waitingTitle}>Price check waiting</Text>
          <Text style={styles.waitingSubtitle}>
            Select a grade first; the price reference depends on the grade.
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
    color: THEME.titleRustDark,
    marginBottom: 14,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 2,
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
  priceSummaryCard: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceCol: {
    flex: 1,
  },
  priceColLabel: {
    fontSize: 11.5,
    color: THEME.muted,
    marginBottom: 4,
  },
  priceColVal: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.ink,
  },
  waitingCard: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  waitingIconWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  waitingTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.ink,
    marginBottom: 6,
    textAlign: 'center',
  },
  waitingSubtitle: {
    fontSize: 12,
    color: THEME.muted,
    textAlign: 'center',
    lineHeight: 17,
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
    color: THEME.titleRustDark,
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
