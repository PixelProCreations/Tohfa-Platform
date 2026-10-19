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
    : `PO-2026-00124 · ${t('purchaseOrderDetail.subtitle')}`;

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
              <Text style={styles.fieldValue}>{orderId ?? 'PO-2026-00124'}</Text>
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
              <Text style={styles.fieldValue}>Coonoor</Text>
            </View>
          </View>
        </View>

        {/* 3. Produce Information */}
        <Text style={styles.sectionTitle}>Produce Information</Text>
        <View style={styles.card}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Listed Quantity</Text>
              <Text style={styles.fieldValue}>50 kg</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Agreed Quantity</Text>
              <Text style={styles.fieldValue}>30 kg</Text>
            </View>
          </View>

          <View style={[styles.gridRow, styles.fieldRowSpacing]}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Listed Price</Text>
              <Text style={styles.fieldValue}>₹50/kg</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Agreed Price</Text>
              <Text style={styles.fieldValue}>₹45/kg</Text>
            </View>
          </View>
        </View>

        {/* View Original Listing Button */}
        <TouchableOpacity
          style={styles.outlineActionBtn}
          onPress={onViewOriginalListing}
          activeOpacity={0.8}
        >
          <Text style={styles.outlineActionBtnText}>View Original Listing</Text>
        </TouchableOpacity>

        {/* 4. Negotiation Summary */}
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
              <Text style={styles.termHeading}>ORIGINAL FARMER REQUEST</Text>
              <Text style={styles.termBody}>Quantity: 50 kg · Price: ₹50/kg</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.termHeading}>TOHFA COUNTER OFFER</Text>
              <Text style={styles.termBody}>Quantity: 30 kg · Price: ₹45/kg</Text>
            </View>

            <View style={[styles.card, styles.finalTermsCard]}>
              <Text style={styles.termHeading}>FINAL AGREED TERMS</Text>
              <Text style={styles.finalTermBody}>Quantity: 30 kg · Price: ₹45/kg · Total: ₹1,350</Text>
            </View>
          </>
        ) : (
          <View style={[styles.card, styles.finalTermsCard]}>
            <Text style={styles.termHeading}>DIRECT APPROVAL — NO COUNTER OFFER</Text>
            <Text style={styles.finalTermBody}>Quantity: 50 kg · Price: ₹100/kg · Total: ₹5,000</Text>
          </View>
        )}

        {/* 5. Purchase Timeline */}
        <Text style={styles.sectionTitle}>{t('purchaseOrderDetail.section.timeline')}</Text>
        <View style={styles.timelineContainer}>
          {[
            {
              title: 'Listing Created',
              time: '28 Sep · Farmer',
              icon: <TargetPlusIcon size={16} color={adminColors.brandDeep} />,
            },
            {
              title: 'Listing Approved',
              time: '29 Sep · Farmer Admin',
              icon: <CheckCircleIcon size={16} color={adminColors.brandDeep} />,
            },
            {
              title: 'Purchase Order Created',
              time: '29 Sep · System',
              icon: <ReceiptIcon size={16} color={adminColors.brandDeep} />,
            },
            {
              title: 'Terms Confirmed',
              time: '29 Sep · Farmer Admin',
              icon: <CheckCircleIcon size={16} color={adminColors.brandDeep} />,
            },
            {
              title: 'Awaiting Handover',
              time: '30 Sep · Current',
              icon: <HourglassIcon size={16} color={adminColors.brandDeep} />,
            },
          ].map((item, index, arr) => (
            <View key={item.title} style={styles.timelineRow}>
              {/* Badge + connecting line */}
              <View style={styles.timelineIndicatorCol}>
                <View style={styles.timelineIconBadge}>
                  {item.icon}
                </View>
                {index < arr.length - 1 && <View style={styles.timelineLine} />}
              </View>

              {/* Text content */}
              <View style={styles.timelineTextCol}>
                <Text style={styles.timelineTitle}>{item.title}</Text>
                <Text style={styles.timelineTime}>{item.time}</Text>
              </View>
            </View>
          ))}
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
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.2,
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
    fontSize: 16,
    fontWeight: '700',
    color: adminColors.brandDeep,
    marginTop: adminSpacing.lg,
    marginBottom: adminSpacing.sm,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: adminRadius.full,
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
    fontSize: 13,
  },
  chipTextActive: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  chipTextInactive: {
    color: adminColors.ink,
    fontWeight: '600',
  },
  termHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: adminColors.brandDeep,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  termBody: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
  },
  finalTermsCard: {
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
  },
  finalTermBody: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
  },
  timelineContainer: {
    paddingLeft: adminSpacing.xs,
    paddingTop: adminSpacing.xs,
    marginBottom: adminSpacing.xl,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
    minHeight: 52,
  },
  timelineIndicatorCol: {
    alignItems: 'center',
    width: 32,
    position: 'relative',
  },
  timelineIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timelineLine: {
    position: 'absolute',
    top: 32,
    bottom: -6,
    width: 2,
    backgroundColor: adminColors.border,
    zIndex: 1,
  },
  timelineTextCol: {
    flex: 1,
    paddingLeft: adminSpacing.md,
    paddingTop: 4,
    paddingBottom: adminSpacing.md,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
  },
  timelineTime: {
    fontSize: 12,
    fontWeight: '500',
    color: adminColors.muted,
    marginTop: 2,
  },
  outlineActionBtn: {
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.xl,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.sm,
    marginBottom: adminSpacing.lg,
    backgroundColor: adminColors.card,
  },
  outlineActionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },
  bottomSpacer: {
    height: 40,
  },
});
