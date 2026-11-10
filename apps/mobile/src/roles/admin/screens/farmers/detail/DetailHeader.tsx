/**
 * The farmer detail's orange header banner, the profile summary card and the
 * scrolling 9-tab bar with its slider (team design), on live data.
 *
 * Badges are API values only: account status (Disabled is never shown as
 * Pending), KYC status, the certification summary, Dev's rating capsule
 * (0-100 score + server tier label) and the registration date. The design's
 * farming-type pill has no API source and is not drawn.
 */
import React, { useRef, useState } from 'react';
import {
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  type ScrollViewInstance,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { FarmerDetailView } from '../../../api/farmerTypes';
import { t } from '../../../i18n';
import { adminSpacing } from '../../../theme';
import { BackArrowIcon, PencilIcon } from './icons';
import {
  accountBadge,
  certificationBadge,
  detailTabLabel,
  FARMER_DETAIL_TABS,
  kycBadge,
  ratingTierCapsule,
  sinceLabel,
  type FarmerDetailTab,
} from './model';
import { BadgePill, Pill } from './parts';
import { detailStyles as s } from './styles';

export function HeaderBanner({
  title,
  subtitle,
  onBack,
  onEdit,
}: {
  title: string;
  subtitle?: string | undefined;
  onBack: () => void;
  /** Present only when the caller may edit (access.canEdit). */
  onEdit?: (() => void) | undefined;
}) {
  return (
    <View style={s.headerBanner}>
      <View style={s.headerRow}>
        <TouchableOpacity
          style={s.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('farmerDetail.a11y.back')}
        >
          <BackArrowIcon />
        </TouchableOpacity>
        <View style={s.headerTitleCol}>
          <Text style={s.headerTitle} accessibilityRole="header">
            {title}
          </Text>
          {subtitle !== undefined ? <Text style={s.headerSubtitle}>{subtitle}</Text> : null}
        </View>
        {onEdit !== undefined ? (
          <TouchableOpacity
            style={s.headerEditButton}
            onPress={onEdit}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('farmerDetail.a11y.edit')}
          >
            <PencilIcon />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

export function ProfileSummaryCard({
  farmer,
  onOpenKycReview,
  onOpenRatingScorecard,
}: {
  farmer: FarmerDetailView;
  onOpenKycReview?: (() => void) | undefined;
  onOpenRatingScorecard?: (() => void) | undefined;
}) {
  const status = accountBadge(farmer.status);
  const kyc = kycBadge(farmer.kycStatus);
  const cert = certificationBadge(farmer.certification);
  return (
    <View style={s.profileCard}>
      <View style={s.profileTopRow}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{farmer.initials}</Text>
        </View>
        <View style={s.profileCol}>
          <View style={s.nameRow}>
            <Text style={s.farmerName}>{farmer.name}</Text>
            <BadgePill badge={status} />
          </View>
          <Text style={s.idPhone}>{t('farmerDetail.header.idPhone', { code: farmer.farmerCode, mobile: farmer.mobile })}</Text>
        </View>
      </View>

      <View style={s.badgesRow}>
        <TouchableOpacity onPress={onOpenKycReview} disabled={onOpenKycReview === undefined} activeOpacity={0.7}>
          <BadgePill badge={kyc} />
        </TouchableOpacity>
        {cert !== null ? <BadgePill badge={cert} /> : null}
        {farmer.isMarketBlocked ? <Pill label={t('farmerDetail.badge.marketBlocked')} tone="danger" /> : null}
        {/* Dev's rating capsule with tier, kept in the design's star pill. */}
        <TouchableOpacity onPress={onOpenRatingScorecard} disabled={onOpenRatingScorecard === undefined} activeOpacity={0.7}>
          <Pill label={ratingTierCapsule(farmer)} tone="brandSoft" />
        </TouchableOpacity>
        <Pill label={sinceLabel(farmer)} tone="neutral" />
      </View>
    </View>
  );
}

const THUMB_WIDTH = adminSpacing.modalGap + adminSpacing.xsSm;
/** The two arrows plus their gaps, subtracted from the slider row to get the track. */
const SLIDER_CHROME = adminSpacing.xxxl + adminSpacing.xs / 2;
/** Roughly one tab's width, to bring the pressed tab into view. */
const TAB_STEP = adminSpacing.pageMargin + adminSpacing.xs;

export function DetailTabBar({
  active,
  onSelect,
}: {
  active: FarmerDetailTab;
  onSelect: (tab: FarmerDetailTab) => void;
}) {
  const scrollRef = useRef<ScrollViewInstance>(null);
  const [progress, setProgress] = useState(0);
  const [trackWidth, setTrackWidth] = useState(0);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const max = contentSize.width - layoutMeasurement.width;
    if (max > 0) setProgress(Math.max(0, Math.min(1, contentOffset.x / max)));
  };

  const thumbLeft = progress * Math.max(0, trackWidth - THUMB_WIDTH);

  return (
    <View style={s.tabSection}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.tabsScrollContent}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {FARMER_DETAIL_TABS.map((tab, index) => {
          const isActive = tab === active;
          return (
            <TouchableOpacity
              key={tab}
              style={[s.tabButton, isActive && s.tabButtonActive]}
              onPress={() => {
                onSelect(tab);
                scrollRef.current?.scrollTo({ x: Math.max(0, index * TAB_STEP - adminSpacing.largeSection), animated: true });
              }}
              activeOpacity={0.8}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[s.tabButtonText, isActive && s.tabButtonTextActive]}>{detailTabLabel(tab)}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={s.sliderBarWrap} onLayout={(e: LayoutChangeEvent) => setTrackWidth(e.nativeEvent.layout.width - SLIDER_CHROME)}>
        <TouchableOpacity onPress={() => scrollRef.current?.scrollTo({ x: 0, animated: true })} activeOpacity={0.7} style={s.sliderArrowTouch}>
          <Text style={s.sliderArrowText}>{t('farmerDetail.tab.scrollStart')}</Text>
        </TouchableOpacity>
        <View style={s.sliderTrack}>
          <View style={[s.sliderThumb, { width: THUMB_WIDTH, transform: [{ translateX: thumbLeft }] }]} />
        </View>
        <TouchableOpacity onPress={() => scrollRef.current?.scrollToEnd({ animated: true })} activeOpacity={0.7} style={s.sliderArrowTouch}>
          <Text style={s.sliderArrowText}>{t('farmerDetail.tab.scrollEnd')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
