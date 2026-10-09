/**
 * Return Result — success confirmation after an RMA step completes.
 *
 * Replaces the MainWarehouseInspectionSavedScreen /
 * MainWarehouseReturnApprovedScreen twins; the difference (title, message,
 * header subtitle, CTA) is the `variant` prop plus VARIANT_COPY.
 *
 * Gates (docs/rbac.json; the server re-checks everything, CLAUDE.md 2.1):
 *   - INSPECTION_SAVED "Continue Review" leads to approving/rejecting the
 *     request: `rma.request.process`.
 *   - RETURN_APPROVED "Refund Status": `rma.refund.approve` (FINAL_LIST row 100).
 *   When the CTA is hidden the header back arrow (`onBack`) is the way out.
 */
import React from 'react';
import { View, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

import { adminColors, adminType, adminRadius, adminSpacing, ADMIN_BUTTON_HEIGHT } from '../../../theme';
import type { WarehouseScreenBaseProps } from '../finance-expenses';
import type { ReturnResultVariant } from './types';

function ArrowBackIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 12H4M10 18l-6-6 6-6"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SuccessCheckIcon({ size = 32, color = adminColors.success.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M8 12.5l3 3 5-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

interface VariantCopy {
  title: string;
  /** Message under the title; `null` shows the RMA id instead. */
  message: string | null;
  /** Show the RMA id under the header title. */
  showRmaInHeader: boolean;
  cta: string;
  /** docs/rbac.json code that unlocks the CTA. */
  ctaPermission: string;
}

const VARIANT_COPY: Record<ReturnResultVariant, VariantCopy> = {
  INSPECTION_SAVED: {
    title: 'Inspection Saved',
    message: 'The returned product inspection has been recorded.',
    showRmaInHeader: false,
    cta: 'Continue Review',
    ctaPermission: 'rma.request.process',
  },
  RETURN_APPROVED: {
    title: 'Return Approved',
    message: null,
    showRmaInHeader: true,
    cta: 'Refund Status',
    ctaPermission: 'rma.refund.approve',
  },
};

/** Mock RMA id both twins hard-coded; callers pass the real one once RMAs are wired. */
const SAMPLE_RMA_ID = 'RMA-2026-00125';

export interface ReturnResultScreenProps extends WarehouseScreenBaseProps {
  variant: ReturnResultVariant;
  /** The variant's CTA: continue the review, or open the refund status. */
  onPrimary: () => void;
  rmaId?: string | undefined;
}

const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 };

export function ReturnResultScreen({ variant, can, onBack, onPrimary, rmaId = SAMPLE_RMA_ID }: ReturnResultScreenProps) {
  const copy = VARIANT_COPY[variant];
  const showCta = can(copy.ctaPermission);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      <View style={styles.header}>
        <View style={[styles.headerTop, copy.showRmaInHeader && styles.headerTopWithSub]}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={HIT_SLOP}>
            <ArrowBackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{copy.title}</Text>
        </View>
        {copy.showRmaInHeader ? <Text style={styles.headerSubtitle}>{rmaId}</Text> : null}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.successHeader}>
          <View style={styles.iconCircle}>
            <SuccessCheckIcon />
          </View>
          <Text style={styles.successTitle}>{copy.title}</Text>
          <Text style={styles.successMessage}>{copy.message ?? rmaId}</Text>
        </View>
      </ScrollView>

      {showCta ? (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.primaryBtn} onPress={onPrimary} activeOpacity={0.8}>
            <Text style={styles.primaryBtnText}>{copy.cta}</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

// Icon circle diameter: an icon size, not spacing (no size token exists for it).
const ICON_CIRCLE = 64;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminColors.canvas },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.lg,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  headerTopWithSub: { marginBottom: adminSpacing.xs },
  backBtn: { marginRight: adminSpacing.md },
  headerTitle: { ...adminType.title, color: adminColors.onBrand },
  // Indented under the title: back icon (20) + its margin (12).
  headerSubtitle: { ...adminType.rowMeta, color: adminColors.onBrand, marginLeft: adminSpacing.xxl },
  scroll: { flex: 1 },
  scrollContent: { padding: adminSpacing.lg, paddingBottom: adminSpacing.xl },
  successHeader: { alignItems: 'center', marginTop: adminSpacing.xxxl, marginBottom: adminSpacing.xxl },
  iconCircle: {
    width: ICON_CIRCLE,
    height: ICON_CIRCLE,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.success.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.lg,
  },
  successTitle: { ...adminType.title, color: adminColors.ink, marginBottom: adminSpacing.sm },
  successMessage: { ...adminType.body, color: adminColors.muted, textAlign: 'center' },
  footer: {
    backgroundColor: adminColors.card,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  primaryBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    height: ADMIN_BUTTON_HEIGHT,
    marginBottom: adminSpacing.md,
  },
  primaryBtnText: { ...adminType.sectionHead, color: adminColors.onBrand },
});
