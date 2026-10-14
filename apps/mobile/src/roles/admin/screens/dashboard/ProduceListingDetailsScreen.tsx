import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { adminColors, adminOverlay, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';
import { t } from '../../i18n';

// ─── Exact SVG Icons ──────────────────────────────────────────────────────────

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

function ProhibitedIcon({ size = 18, color = adminColors.danger.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth="1.8" />
      <Line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function ArrowRightIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12h14M12 5l7 7-7 7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Timeline Icon 1: Upload tray with arrow */
function UploadTrayIcon({ size = 16, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M12 15V3M7 8l5-5 5 5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Timeline Icon 2: Speech bubble / ellipsis */
function EllipsisBubbleIcon({ size = 16, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Circle cx="8" cy="12" r="1.2" fill={color} />
      <Circle cx="12" cy="12" r="1.2" fill={color} />
      <Circle cx="16" cy="12" r="1.2" fill={color} />
    </Svg>
  );
}

/** Timeline Icon 3: ID badge / user card */
function IdBadgeIcon({ size = 16, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth="1.8" />
      <Path d="M8 18c0-2 1.8-3 4-3s4 1 4 3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Component Props ──────────────────────────────────────────────────────────

export interface ProduceListingDetailsScreenProps {
  listingId?: string | undefined;
  cropName?: string | undefined;
  farmerName?: string | undefined;
  onBack: () => void;
  onViewFarmer?: (farmerId: string) => void;
  onViewFullHistory?: () => void;
  onReviewListing?: () => void;
  onNavigateToVerification?: () => void;
}

export function ProduceListingDetailsScreen({
  listingId,
  cropName,
  farmerName,
  onBack,
  onViewFarmer,
  onViewFullHistory,
  onReviewListing,
  onNavigateToVerification,
}: ProduceListingDetailsScreenProps) {
  const [selectedFarmerType, setSelectedFarmerType] = useState<'Other Farmer' | 'Own Listing'>('Other Farmer');
  const [modalMessage, setModalMessage] = useState<string | null>(null);

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
            accessibilityLabel={t('produceListingDetails.backLabel')}
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{t('produceListingDetails.title')}</Text>
        </View>

        <Text style={styles.headerSubtitle}>{listingId} · {t('produceListingDetails.subtitle')}</Text>
      </View>

      {/* ─── Scrollable Body ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Top Filter Chips: Other Farmer / Own Listing ─── */}
        <View style={styles.chipsRow}>
          <TouchableOpacity
            style={[
              styles.chip,
              selectedFarmerType === 'Other Farmer' ? styles.chipActive : styles.chipInactive,
            ]}
            onPress={() => setSelectedFarmerType('Other Farmer')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.chipText,
                selectedFarmerType === 'Other Farmer'
                  ? styles.chipTextActive
                  : styles.chipTextInactive,
              ]}
            >
              {t('produceListingDetails.chip.otherFarmer')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.chip,
              selectedFarmerType === 'Own Listing' ? styles.chipActive : styles.chipInactive,
            ]}
            onPress={() => setSelectedFarmerType('Own Listing')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.chipText,
                selectedFarmerType === 'Own Listing'
                  ? styles.chipTextActive
                  : styles.chipTextInactive,
              ]}
            >
              {t('produceListingDetails.chip.ownListing')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ─── 1. Farmer Information ─── */}
        <Text style={styles.sectionTitle}>{t('produceListingDetails.section.farmerInfo')}</Text>
        <View style={styles.card}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Farmer</Text>
              <Text style={styles.fieldValue}>
                {selectedFarmerType === 'Own Listing' ? 'Suresh Chakravarthi (You)' : farmerName}
              </Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Farmer ID</Text>
              <Text style={styles.fieldValue}>
                {selectedFarmerType === 'Own Listing' ? 'FR-00241' : 'FR-00192'}
              </Text>
            </View>
          </View>

          <View style={[styles.gridRow, { marginTop: adminSpacing.md }]}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Zone</Text>
              <Text style={styles.fieldValue}>
                {selectedFarmerType === 'Own Listing' ? 'Coonoor' : 'Ooty'}
              </Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Farming Method</Text>
              <Text style={styles.fieldValue}>Organic</Text>
            </View>
          </View>
        </View>

        {/* ─── 2. Listing Overview ─── */}
        <Text style={styles.sectionTitle}>{t('produceListingDetails.section.listingOverview')}</Text>
        <View style={styles.card}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Crop</Text>
              <Text style={styles.fieldValue}>{cropName ?? ''}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Grade</Text>
              <Text style={styles.fieldValue}>Grade 1</Text>
            </View>
          </View>

          <View style={[styles.gridRow, { marginTop: adminSpacing.md }]}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Listing ID</Text>
              <Text style={styles.fieldValue}>{listingId ?? ''}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Status</Text>
              <Text style={styles.fieldValue}>Pending Review</Text>
            </View>
          </View>

          <View style={{ marginTop: adminSpacing.md }}>
            <Text style={styles.fieldLabel}>Submitted</Text>
            <Text style={styles.fieldValue}>29 Sep 2026 · 10:24 AM</Text>
          </View>
        </View>

        {/* ─── 3. Produce Information ─── */}
        <Text style={styles.sectionTitle}>{t('produceListingDetails.section.produceInfo')}</Text>
        <View style={styles.card}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Quantity</Text>
              <Text style={styles.fieldValue}>50 KG</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Harvest Date</Text>
              <Text style={styles.fieldValue}>28 Sep 2026</Text>
            </View>
          </View>

          <View style={{ marginTop: adminSpacing.md }}>
            <Text style={styles.fieldLabel}>Quality Information</Text>
            <Text style={styles.fieldValue}>Grade 1, no visible defects</Text>
          </View>
        </View>

        {/* ─── 4. Pricing ─── */}
        <Text style={styles.sectionTitle}>{t('produceListingDetails.section.pricing')}</Text>
        <View style={styles.card}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Farmer Listed Price</Text>
              <Text style={styles.fieldValue}>₹100/KG</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Fair Price Reference</Text>
              <Text style={styles.fieldValue}>₹95–₹105/KG</Text>
            </View>
          </View>

          <View style={{ marginTop: adminSpacing.md }}>
            <Text style={styles.fieldLabel}>Price Compliance</Text>
            <Text style={[styles.fieldValue, { color: adminColors.success.text }]}>
              Within configured rule
            </Text>
          </View>
        </View>

        {/* ─── 5. Quantity Requirement ─── */}
        <Text style={styles.sectionTitle}>{t('produceListingDetails.section.qtyRequirement')}</Text>
        <View style={styles.card}>
          <View style={styles.flowRow}>
            <View style={styles.flowCol}>
              <Text style={styles.flowLabel}>AVAILABLE</Text>
              <Text style={styles.flowValue}>50 KG</Text>
            </View>

            <ArrowRightIcon size={18} color={adminColors.muted} />

            <View style={styles.flowCol}>
              <Text style={styles.flowLabel}>TOHFA REQUIRED</Text>
              <Text style={styles.flowValue}>30 KG</Text>
            </View>

            <ArrowRightIcon size={18} color={adminColors.muted} />

            <View style={styles.flowCol}>
              <Text style={styles.flowLabel}>REQUIRED PURCHASE</Text>
              <Text style={styles.flowValue}>30 KG</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.outlineActionBtn}
          onPress={() => onNavigateToVerification?.()}
          activeOpacity={0.8}
        >
          <Text style={styles.outlineActionBtnText}>{t('produceListingDetails.action.purchase')}</Text>
        </TouchableOpacity>

        {/* ─── 6. Certification ─── */}
        <Text style={styles.sectionTitle}>{t('produceListingDetails.section.certification')}</Text>
        <View style={styles.card}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Certification</Text>
              <Text style={styles.fieldValue}>PGS Organic</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Status</Text>
              <Text style={styles.fieldValue}>Active</Text>
            </View>
          </View>
        </View>

        {/* ─── 7. Activity / History ─── */}
        <Text style={styles.sectionTitle}>{t('produceListingDetails.section.history')}</Text>
        <View style={styles.timelineList}>
          {/* Event 1: Listing Submitted */}
          <View style={styles.timelineItem}>
            <View style={styles.timelineIconBadge}>
              <UploadTrayIcon size={16} color={adminColors.brandDeep} />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Listing Submitted</Text>
              <Text style={styles.timelineTime}>29 Sep</Text>
            </View>
          </View>

          {/* Event 2: Moved to Pending Review */}
          <View style={styles.timelineItem}>
            <View style={styles.timelineIconBadge}>
              <EllipsisBubbleIcon size={16} color={adminColors.brandDeep} />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Moved to Pending Review</Text>
              <Text style={styles.timelineTime}>29 Sep</Text>
            </View>
          </View>

          {/* Event 3: Assigned for FA Review */}
          <View style={styles.timelineItem}>
            <View style={styles.timelineIconBadge}>
              <IdBadgeIcon size={16} color={adminColors.brandDeep} />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Assigned for FA Review</Text>
              <Text style={styles.timelineTime}>29 Sep</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.outlineActionBtn}
          onPress={onViewFullHistory}
          activeOpacity={0.8}
        >
          <Text style={styles.outlineActionBtnText}>{t('produceListingDetails.action.fullHistory')}</Text>
        </TouchableOpacity>

        {/* Own Listing Notice Banner */}
        {selectedFarmerType === 'Own Listing' && (
          <View style={styles.ownListingNoticeCard}>
            <ProhibitedIcon size={20} color={adminColors.danger.text} />
            <View style={{ flex: 1 }}>
              <Text style={styles.ownListingNoticeTitle}>{t('produceListingDetails.ownListingTitle')}</Text>
              <Text style={styles.ownListingNoticeText}>
                {t('produceListingDetails.ownListingNotice')}
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ─── Sticky Bottom Action Bar: Review Listing ─── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.reviewListingBtn,
            selectedFarmerType === 'Own Listing' && styles.reviewListingBtnDisabled,
          ]}
          onPress={() => {
            if (selectedFarmerType === 'Own Listing') {
              setModalMessage(
                t('produceListingDetails.ownListingNotice')
              );
              return;
            }
            onReviewListing?.();
          }}
          activeOpacity={selectedFarmerType === 'Own Listing' ? 0.9 : 0.85}
        >
          <Text
            style={[
              styles.reviewListingBtnText,
              selectedFarmerType === 'Own Listing' && styles.reviewListingBtnTextDisabled,
            ]}
          >
            {t('produceListingDetails.action.review')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ─── Notice / Info Modal ─── */}
      <Modal
        visible={!!modalMessage}
        transparent
        animationType="fade"
        onRequestClose={() => setModalMessage(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalMessage(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalText}>{modalMessage}</Text>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setModalMessage(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCloseText}>{t('produceListingDetails.done')}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },

  // ─── Header ───
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: adminSpacing.xs,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    ...adminType.rowMeta,
    color: adminColors.onBrand,
    opacity: 0.9,
    marginLeft: 42,
  },

  // ─── Scroll Area ───
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
  },

  // ─── Top Segmented Chips ───
  chipsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  chip: {
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: 9,
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
    ...adminType.caption,
  },
  chipTextActive: {
    color: adminColors.onBrand,
    fontWeight: '800',
  },
  chipTextInactive: {
    color: adminColors.ink,
    fontWeight: '700',
  },

  // ─── Section Typography ───
  sectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.rustDeep,
    letterSpacing: -0.2,
    marginTop: 6,
    marginBottom: 10,
  },

  // ─── Information Card ───
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridCol: {
    flex: 1,
  },
  fieldLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: 3,
  },
  fieldValue: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    letterSpacing: -0.2,
  },

  // ─── Outline Action Button ───
  outlineActionBtn: {
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.xl,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.lg,
  },
  outlineActionBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brand,
  },

  // ─── Quantity Requirement Flow Row ───
  flowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flowCol: {
    alignItems: 'center',
  },
  flowLabel: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.muted,
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  flowValue: {
    ...adminType.kpiValue,
    color: adminColors.ink,
    letterSpacing: -0.3,
  },

  // ─── Activity / History Timeline ───
  timelineList: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    gap: 16,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timelineIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    letterSpacing: -0.2,
  },
  timelineTime: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 1,
  },

  // ─── Sticky Bottom Bar ───
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: adminColors.canvas,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 10,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  reviewListingBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.xl,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewListingBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
    letterSpacing: -0.2,
  },
  reviewListingBtnDisabled: {
    backgroundColor: adminColors.brandTint,
  },
  reviewListingBtnTextDisabled: {
    color: adminColors.brandDeep,
  },

  // ─── Own Listing Warning Card ───
  ownListingNoticeCard: {
    backgroundColor: adminColors.danger.bg,
    borderWidth: 1,
    borderColor: adminColors.danger.border,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginTop: adminSpacing.md,
  },
  ownListingNoticeTitle: {
    ...adminType.rowTitle,
    color: adminColors.danger.text,
    marginBottom: 4,
  },
  ownListingNoticeText: {
    ...adminType.caption,
    color: adminColors.danger.text,
  },

  // ─── Modal ───
  modalOverlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    ...adminShadow.md,
  },
  modalText: {
    ...adminType.body,
    color: adminColors.ink,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalCloseBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  modalCloseText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
  },
});
