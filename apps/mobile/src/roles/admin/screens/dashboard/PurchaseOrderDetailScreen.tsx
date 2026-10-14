import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
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

function TargetPlusIcon({ size = 16, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Line x1="12" y1="8" x2="12" y2="16" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="8" y1="12" x2="16" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function CheckCircleIcon({ size = 16, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Path d="M8.5 12l2.5 2.5 4.5-5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReceiptIcon({ size = 16, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 2v18l2.5-1.5L9 20l2.5-1.5L14 20l2.5-1.5L19 20l2.5-1.5V2H4z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="8" y1="6" x2="16" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="8" y1="10" x2="16" y2="10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function HourglassIcon({ size = 16, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 22h14M5 2h14M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Component Props ──────────────────────────────────────────────────────────

export interface PurchaseOrderDetailScreenProps {
  orderId?: string | undefined;
  onBack: () => void;
  onViewOriginalListing?: (() => void) | undefined;
  onProcessHandover?: (() => void) | undefined;
}

export function PurchaseOrderDetailScreen({
  orderId,
  onBack,
  onViewOriginalListing,
  onProcessHandover,
}: PurchaseOrderDetailScreenProps) {
  const [negotiationType, setNegotiationType] = useState<'Counter Offer' | 'Direct Approval'>('Counter Offer');

  const subtitleText = orderId
    ? `${orderId} · ${t('purchaseOrderDetail.subtitle')}`
    : t('purchaseOrderDetail.subtitle');

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
            accessibilityLabel={t('purchaseOrderDetail.backLabel')}
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{t('purchaseOrderDetail.title')}</Text>
        </View>

        <Text style={styles.headerSubtitle}>{subtitleText}</Text>
      </View>

      {/* ─── Scroll Body ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Purchase Summary */}
        <Text style={styles.sectionTitle}>{t('purchaseOrderDetail.section.summary')}</Text>
        <View style={styles.card}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>{t('purchaseOrderDetail.label.orderId')}</Text>
              <Text style={styles.fieldValue}>{orderId ?? '—'}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>{t('purchaseOrderDetail.label.listingId')}</Text>
              <Text style={styles.fieldValue}>LST-00452</Text>
            </View>
          </View>

          <View style={[styles.gridRow, styles.fieldRowSpacing]}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>{t('purchaseOrderDetail.label.farmer')}</Text>
              <Text style={styles.fieldValue}>Ramesh Kumar</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>{t('purchaseOrderDetail.label.produce')}</Text>
              <Text style={styles.fieldValue}>Carrot, Grade 1</Text>
            </View>
          </View>

          <View style={[styles.gridRow, styles.fieldRowSpacing]}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>{t('purchaseOrderDetail.label.quantity')}</Text>
              <Text style={styles.fieldValue}>30 kg</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>{t('purchaseOrderDetail.label.agreedPrice')}</Text>
              <Text style={styles.fieldValue}>₹45/kg</Text>
            </View>
          </View>

          <View style={styles.fieldRowSpacing}>
            <Text style={styles.fieldLabel}>{t('purchaseOrderDetail.label.totalAmount')}</Text>
            <Text style={styles.fieldValue}>₹1,350</Text>
          </View>
        </View>

        {/* 2. Farmer Information */}
        <Text style={styles.sectionTitle}>{t('purchaseOrderDetail.section.farmerInfo')}</Text>
        <View style={styles.card}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Farmer ID</Text>
              <Text style={styles.fieldValue}>FR-00241</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Farm/Location</Text>
              <Text style={styles.fieldValue}>Coonoor, Nilgiris</Text>
            </View>
          </View>

          <View style={[styles.gridRow, styles.fieldRowSpacing]}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Contact</Text>
              <Text style={styles.fieldValue}>+91 98XXX XX045</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Verification</Text>
              <Text style={styles.fieldValue}>Verified</Text>
            </View>
          </View>
        </View>

        {/* 3. Negotiated Terms */}
        <Text style={styles.sectionTitle}>{t('purchaseOrderDetail.section.terms')}</Text>

        <View style={styles.chipToggleRow}>
          <TouchableOpacity
            style={[styles.chip, negotiationType === 'Counter Offer' ? styles.chipActive : styles.chipInactive]}
            onPress={() => setNegotiationType('Counter Offer')}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, negotiationType === 'Counter Offer' ? styles.chipTextActive : styles.chipTextInactive]}>
              Counter Offer
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, negotiationType === 'Direct Approval' ? styles.chipActive : styles.chipInactive]}
            onPress={() => setNegotiationType('Direct Approval')}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, negotiationType === 'Direct Approval' ? styles.chipTextActive : styles.chipTextInactive]}>
              Direct Approval
            </Text>
          </TouchableOpacity>
        </View>

        {negotiationType === 'Counter Offer' ? (
          <>
            <View style={styles.card}>
              <Text style={styles.termHeading}>ORIGINAL LISTING TERMS</Text>
              <Text style={styles.termBody}>₹50/kg · 50 kg listed · Total: ₹2,500</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.termHeading}>COUNTER-OFFER ROUND 1 (BY TOHFA)</Text>
              <Text style={styles.termBody}>₹45/kg · 30 kg required · Reason: Market alignment</Text>
            </View>

            <View style={[styles.card, styles.finalTermsCard]}>
              <Text style={styles.termHeading}>FINAL AGREED TERMS</Text>
              <Text style={styles.finalTermBody}>₹45/kg · 30 kg · ₹1,350 Total</Text>
            </View>
          </>
        ) : (
          <View style={[styles.card, styles.finalTermsCard]}>
            <Text style={styles.termHeading}>DIRECT PURCHASE TERMS</Text>
            <Text style={styles.finalTermBody}>₹50/kg · 50 kg · ₹2,500 Total</Text>
          </View>
        )}

        {/* 4. Order Timeline */}
        <Text style={styles.sectionTitle}>{t('purchaseOrderDetail.section.timeline')}</Text>
        <View style={styles.timelineList}>
          <View style={styles.timelineItem}>
            <View style={styles.timelineIconBadge}>
              <TargetPlusIcon size={16} color={adminColors.brandDeep} />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Counter-Offer Accepted by Farmer</Text>
              <Text style={styles.timelineTime}>29 Sep 2026, 14:30</Text>
            </View>
          </View>

          <View style={styles.timelineItem}>
            <View style={styles.timelineIconBadge}>
              <CheckCircleIcon size={16} color={adminColors.brandDeep} />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Counter-Offer Sent by TOHFA</Text>
              <Text style={styles.timelineTime}>29 Sep 2026, 11:15</Text>
            </View>
          </View>

          <View style={styles.timelineItem}>
            <View style={styles.timelineIconBadge}>
              <ReceiptIcon size={16} color={adminColors.brandDeep} />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Original Listing Submitted</Text>
              <Text style={styles.timelineTime}>28 Sep 2026, 09:00</Text>
            </View>
          </View>

          <View style={styles.timelineItem}>
            <View style={styles.timelineIconBadge}>
              <HourglassIcon size={16} color={adminColors.brandDeep} />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Handover Scheduled</Text>
              <Text style={styles.timelineTime}>30 Sep 2026, 10:00 AM · Coonoor Point</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* ─── Sticky Bottom Bar ─── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.processHandoverBtn}
          onPress={() => onProcessHandover?.()}
          activeOpacity={0.8}
        >
          <Text style={styles.processHandoverBtnText}>{t('purchaseOrderDetail.action.processHandover')}</Text>
        </TouchableOpacity>
      </View>
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
    paddingTop: adminSpacing.md,
    paddingBottom: 90,
  },
  sectionTitle: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridCol: {
    width: '48%',
  },
  fieldLabel: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  fieldValue: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
    marginTop: adminSpacing.xs,
  },
  fieldRowSpacing: {
    marginTop: adminSpacing.md,
  },
  chipToggleRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  chip: {
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.sm,
    borderRadius: adminRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: adminColors.brand,
  },
  chipInactive: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  chipText: {
    ...adminType.body,
  },
  chipTextActive: {
    color: adminColors.onBrand,
    fontWeight: '800',
  },
  chipTextInactive: {
    color: adminColors.ink,
    fontWeight: '700',
  },
  termHeading: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.muted,
    letterSpacing: 0.5,
    marginBottom: adminSpacing.xs,
  },
  termBody: {
    ...adminType.body,
    fontWeight: '600',
    color: adminColors.ink,
  },
  finalTermsCard: {
    backgroundColor: adminColors.brandTint,
    borderColor: adminColors.border,
    borderWidth: 1.5,
  },
  finalTermBody: {
    ...adminType.rowTitle,
    fontWeight: '900',
    color: adminColors.ink,
  },
  timelineList: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    gap: adminSpacing.lg,
    marginBottom: adminSpacing.lg,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
  },
  timelineIconBadge: {
    width: 32,
    height: 32,
    borderRadius: adminRadius.xl,
    backgroundColor: adminColors.warning.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.ink,
  },
  timelineTime: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 1,
  },
  bottomSpacer: {
    height: 20,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: adminColors.canvas,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.xxl,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  processHandoverBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.xl,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processHandoverBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
  },
});
