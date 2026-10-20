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
import Svg, { Circle, Path } from 'react-native-svg';
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

function CheckCircleIcon({ size = 20, color = adminColors.success.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Path d="M8.5 12l2.5 2.5 4.5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Component Props ──────────────────────────────────────────────────────────

export interface ReviewProduceListingScreenProps {
  listingId?: string | undefined;
  cropName?: string | undefined;
  grade?: string | undefined;
  onBack: () => void;
  onViewFullListingDetail: () => void;
  onCompleteReview?: (() => void) | undefined;
}

export function ReviewProduceListingScreen({
  listingId,
  cropName,
  grade,
  onBack,
  onViewFullListingDetail,
  onCompleteReview,
}: ReviewProduceListingScreenProps) {
  const checklistItems = [
    t('reviewProduceListing.item.farmerInfo'),
    t('reviewProduceListing.item.produceGrade'),
    t('reviewProduceListing.item.qtyQuality'),
    t('reviewProduceListing.item.pricingCompliance'),
    t('reviewProduceListing.item.certification'),
    t('reviewProduceListing.item.tohfaReq'),
  ];

  const cropGradeText = cropName ? `${cropName}${grade ? ` — ${grade}` : ''}` : grade;
  const subtitle = [listingId, cropGradeText].filter(Boolean).join(' · ');

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
            accessibilityLabel={t('reviewProduceListing.backLabel')}
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{t('reviewProduceListing.title')}</Text>
        </View>

        {subtitle.length > 0 && (
          <Text style={styles.headerSubtitle}>{subtitle}</Text>
        )}
      </View>

      {/* ─── Body ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Badge: Normal */}
        <View style={styles.badgeWrap}>
          <View style={styles.normalBadge}>
            <Text style={styles.normalBadgeText}>{t('reviewProduceListing.badge.normal')}</Text>
          </View>
        </View>

        {/* Section: Review Checklist */}
        <Text style={styles.sectionTitle}>{t('reviewProduceListing.section.checklist')}</Text>

        <View style={styles.card}>
          {checklistItems.map((item, index) => (
            <View
              key={item}
              style={[
                styles.checklistItem,
                index < checklistItems.length - 1 && styles.checklistItemBorder,
              ]}
            >
              <CheckCircleIcon size={20} color={adminColors.success.text} />
              <Text style={styles.checklistText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Button: View Full Listing Detail */}
        <TouchableOpacity
          style={styles.outlineActionBtn}
          onPress={onViewFullListingDetail}
          activeOpacity={0.8}
        >
          <Text style={styles.outlineActionBtnText}>{t('reviewProduceListing.action.viewFullDetail')}</Text>
        </TouchableOpacity>

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
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    ...adminType.caption,
    color: adminColors.onBrand,
    marginLeft: 42,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: 30,
  },
  badgeWrap: {
    flexDirection: 'row',
    marginBottom: adminSpacing.lg,
  },
  normalBadge: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.sm,
  },
  normalBadgeText: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  sectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.md,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: 6,
    marginBottom: adminSpacing.xl,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
    paddingVertical: adminSpacing.lg,
  },
  checklistItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  checklistText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },
  outlineActionBtn: {
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.xl,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineActionBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brand,
  },
  bottomSpacer: {
    height: 40,
  },
});
