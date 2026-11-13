import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ModalSafeArea, SafeAreaView } from '@tohfa/mobile-ui';
import Svg, { Path, Circle } from 'react-native-svg';
import { t, type TranslationKey } from '../../../../i18n/farmer';
import { authPalette as P, colors, radius, spacing, typography } from '../../theme';
import { formatCommunityKg, type CommunityPlantingQuery } from '../../api/community';
import { useCommunityPlanting } from './useCommunityPlanting';

// ── SVG Icons ────────────────────────────────────────────────────────────────

const ChevronLeft = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18L9 12L15 6" stroke={colors.brandGreen} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CommunityIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Circle cx="9" cy="7" r="3" stroke={colors.brandGreen} strokeWidth="2" />
    <Circle cx="17" cy="7" r="2.5" stroke={colors.brandGreen} strokeWidth="1.8" />
    <Path d="M3 20C3 16.6863 5.68629 14 9 14C12.3137 14 15 16.6863 15 20" stroke={colors.brandGreen} strokeWidth="2" strokeLinecap="round" />
    <Path d="M15 14.5C16.3807 14.5 17.7 15.3 18.5 16.5" stroke={colors.brandGreen} strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

const ChevronDown = ({ size = 14, color = P.twGray600 }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M6 9L12 15L18 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const HeartIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke={P.twOrange700} strokeWidth="2" fill={P.twOrange100} />
  </Svg>
);

const SeedlingIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M12 22V12" stroke={colors.brandGreen} strokeWidth="2" strokeLinecap="round" />
    <Path d="M7 12C7 9.23858 9.23858 7 12 7C14.7614 7 17 9.23858 17 12" stroke={colors.brandGreen} strokeWidth="2" strokeLinecap="round" />
    <Path d="M4 8C4 5 7 2 12 2C17 2 20 5 20 8" stroke={colors.brandGreen} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

// ── Crop image URLs (same ones used across the app) ─────────────────────────

const CROP_IMAGES: Record<string, string> = {
  Potato: 'https://images.unsplash.com/photo-1518977676601-b53f82ber630?w=100&q=80',
  Carrot: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=100&q=80',
  Cabbage: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=100&q=80',
  Tomato: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=100&q=80',
  'French Beans': 'https://images.unsplash.com/photo-1567375698348-5d9d5ae10c3a?w=100&q=80',
  Beetroot: 'https://images.unsplash.com/photo-1593105544559-ecb03bf76f82?w=100&q=80',
  Cauliflower: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=100&q=80',
  Wheat: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=100&q=80',
};

// ── Data ─────────────────────────────────────────────────────────────────────

// Still static: there is no wishlist table or endpoint (docs/rules.md BR-136
// "Not built"), so this list is deliberately not fabricated from another source.
//
// The rows below are design placeholders, not real demand. Showing them would
// tell farmers that customers want quantities nobody measured, so the section
// is hidden until a wishlist data source exists (rules.md open contradiction
// 34). Turn this on only together with replacing WISHLIST_DATA by real data.
const SHOW_STATIC_WISHLIST_DEMAND = false as boolean;

const WISHLIST_DATA = [
  { rank: 1, name: 'Carrot',       customers: 62, quantity: '8,400 kg' },
  { rank: 2, name: 'Tomato',       customers: 54, quantity: '7,200 kg' },
  { rank: 3, name: 'Cabbage',      customers: 28, quantity: '4,100 kg' },
  { rank: 4, name: 'Beetroot',     customers: 41, quantity: '3,600 kg' },
  { rank: 5, name: 'French Beans', customers: 33, quantity: '2,900 kg' },
];

// Rank number colors (earthy warm tones)
const RANK_COLORS = [colors.brandGreen, P.green700, P.green600, P.greenDeep7, P.greenDeep6];

// Gradient-like greens for each crop bar, by rank; rows past the end reuse the last.
const BAR_COLORS = [colors.brandGreen, P.green700, P.green600, P.green500, P.leafGreen, P.green300, P.green200];

// The server sends months as integers 1-12; labels come from the i18n catalogue.
const MONTH_KEYS: readonly TranslationKey[] = [
  'farmer.weather.month.jan',
  'farmer.weather.month.feb',
  'farmer.weather.month.mar',
  'farmer.weather.month.apr',
  'farmer.weather.month.may',
  'farmer.weather.month.jun',
  'farmer.weather.month.jul',
  'farmer.weather.month.aug',
  'farmer.weather.month.sep',
  'farmer.weather.month.oct',
  'farmer.weather.month.nov',
  'farmer.weather.month.dec',
];

function monthLabel(month: number): string {
  const key = MONTH_KEYS[month - 1];
  return key === undefined ? String(month) : t(key);
}

/** Bar width as a percentage of the largest row, rounded to one decimal. */
function barPercent(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.round((value / max) * 1000) / 10;
}

type Metric = 'Farmers' | 'Quantity';
type FilterKind = 'crop' | 'month' | 'region';

interface FilterOption {
  /** testID suffix and React key; 'all' clears the filter. */
  id: string;
  label: string;
  selected: boolean;
  apply: (query: CommunityPlantingQuery) => CommunityPlantingQuery;
}

interface BarRow {
  id: string;
  testKey: string;
  label: string;
  farmers: number;
  quantityKg: number;
  color: string;
}

interface TohfaCalendarScreenProps {
  onNavigateBack: () => void;
  onNavigateToCropInsight?: () => void;
}

export function TohfaCalendarScreen({ onNavigateBack, onNavigateToCropInsight }: TohfaCalendarScreenProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<Metric>('Farmers');
  const [openFilter, setOpenFilter] = useState<FilterKind | null>(null);
  const community = useCommunityPlanting();
  const { query, summary, filterOptions } = community;

  // ── Filter chips ──
  const selectedCropName =
    query.crop === null
      ? null
      : filterOptions?.crops.find((c) => c.cropMasterId === query.crop)?.cropName ??
        summary?.byCrop.find((c) => c.cropMasterId === query.crop)?.cropName ??
        null;
  const cropChipLabel = selectedCropName ?? t('farmer.tohfaCalendar.filter.allCrops');
  // Unset chips keep the design's labels ("All crops", "Month", "Region").
  const monthChipLabel = query.month === null ? t('farmer.tohfaCalendar.filter.monthChip') : monthLabel(query.month);
  const regionChipLabel = query.region ?? t('farmer.tohfaCalendar.filter.regionChip');

  const optionsFor = (kind: FilterKind): FilterOption[] => {
    if (kind === 'crop') {
      return [
        { id: 'all', label: t('farmer.tohfaCalendar.filter.allCrops'), selected: query.crop === null, apply: (q) => ({ ...q, crop: null }) },
        ...(filterOptions?.crops ?? []).map((c) => ({
          id: c.cropMasterId,
          label: c.cropName,
          selected: query.crop === c.cropMasterId,
          apply: (q: CommunityPlantingQuery) => ({ ...q, crop: c.cropMasterId }),
        })),
      ];
    }
    if (kind === 'month') {
      return [
        { id: 'all', label: t('farmer.tohfaCalendar.filter.allMonths'), selected: query.month === null, apply: (q) => ({ ...q, month: null }) },
        ...(filterOptions?.months ?? []).map((m) => ({
          id: String(m),
          label: monthLabel(m),
          selected: query.month === m,
          apply: (q: CommunityPlantingQuery) => ({ ...q, month: m }),
        })),
      ];
    }
    return [
      { id: 'all', label: t('farmer.tohfaCalendar.filter.allRegions'), selected: query.region === null, apply: (q) => ({ ...q, region: null }) },
      ...(filterOptions?.regions ?? []).map((r) => ({
        id: r,
        label: r,
        selected: query.region === r,
        apply: (q: CommunityPlantingQuery) => ({ ...q, region: r }),
      })),
    ];
  };

  const filterTitle: Record<FilterKind, TranslationKey> = {
    crop: 'farmer.tohfaCalendar.filter.cropTitle',
    month: 'farmer.tohfaCalendar.filter.monthTitle',
    region: 'farmer.tohfaCalendar.filter.regionTitle',
  };

  const chooseOption = (option: FilterOption) => {
    setOpenFilter(null);
    community.setQuery(option.apply(query));
  };

  // ── Bars: byCrop as released, plus the unnamed `other` group when present ──
  const rows: BarRow[] = (summary?.byCrop ?? []).map((crop, idx) => ({
    id: crop.cropMasterId,
    testKey: crop.cropMasterId,
    label: crop.cropName,
    farmers: crop.farmers,
    quantityKg: crop.quantityKg,
    color: BAR_COLORS[Math.min(idx, BAR_COLORS.length - 1)] ?? colors.brandGreen,
  }));
  if (summary?.other) {
    rows.push({
      id: 'other',
      testKey: 'other',
      label: t('farmer.tohfaCalendar.byCrop.otherCrops'),
      farmers: summary.other.farmers,
      quantityKg: summary.other.quantityKg,
      color: P.twGray400,
    });
  }
  const maxFarmers = Math.max(0, ...rows.map((r) => r.farmers));
  const maxQuantity = Math.max(0, ...rows.map((r) => r.quantityKg));

  const renderSummary = (): React.JSX.Element => {
    if (community.state === 'loading') {
      return (
        <View style={styles.stateCard}>
          <ActivityIndicator testID="tohfaCalendar.loading" color={colors.brandGreen} />
          <Text style={styles.stateText}>{t('farmer.common.loading')}</Text>
        </View>
      );
    }
    if (community.state === 'unavailable') {
      // Switched off server-side pending an owner decision (403 / 503); Retry cannot help.
      return (
        <View testID="tohfaCalendar.unavailable" style={styles.stateCard}>
          <Text style={styles.stateText}>{t('farmer.tohfaCalendar.unavailable')}</Text>
        </View>
      );
    }
    if (community.state === 'error' || summary === null) {
      return (
        <View style={styles.stateCard}>
          <Text style={styles.stateText}>{t('farmer.tohfaCalendar.loadError')}</Text>
          <TouchableOpacity testID="tohfaCalendar.retry" style={styles.retryButton} onPress={community.retry} activeOpacity={0.7}>
            <Text style={styles.retryButtonText}>{t('farmer.common.retry')}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <>
        {/* Stat Cards */}
        <View style={styles.statRow}>
          <View style={styles.statCard}>
            {/* null = withheld by the server (BR-136i), not zero. */}
            <Text testID="tohfaCalendar.stat.farmers" style={styles.statValue}>
              {summary.totals.farmers === null ? t('farmer.tohfaCalendar.stats.withheld') : String(summary.totals.farmers)}
            </Text>
            <Text style={styles.statLabel}>{t('farmer.tohfaCalendar.stats.farmers')}</Text>
          </View>
          <View style={[styles.statCard, styles.statCardHighlight]}>
            <Text testID="tohfaCalendar.stat.totalKg" style={styles.statValueHighlight}>
              {formatCommunityKg(summary.totals.totalPlantedKg)}
              <Text style={styles.statUnit}>{t('farmer.tohfaCalendar.stats.kgUnit')}</Text>
            </Text>
            <Text style={styles.statLabelHighlight}>{t('farmer.tohfaCalendar.stats.totalPlanted')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text testID="tohfaCalendar.stat.crops" style={styles.statValue}>{String(summary.totals.crops)}</Text>
            <Text style={styles.statLabel}>{t('farmer.tohfaCalendar.stats.crops')}</Text>
          </View>
        </View>

        {/* BY CROP Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>{t('farmer.tohfaCalendar.byCrop.title')}</Text>
          <View style={styles.tabPills}>
            <TouchableOpacity
              testID="tohfaCalendar.metric.farmers"
              style={[styles.tabPill, activeTab === 'Farmers' && styles.tabPillActive]}
              onPress={() => setActiveTab('Farmers')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabPillText, activeTab === 'Farmers' && styles.tabPillTextActive]}>
                {t('farmer.tohfaCalendar.byCrop.metricFarmers')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="tohfaCalendar.metric.quantity"
              style={[styles.tabPill, activeTab === 'Quantity' && styles.tabPillActive]}
              onPress={() => setActiveTab('Quantity')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabPillText, activeTab === 'Quantity' && styles.tabPillTextActive]}>
                {t('farmer.tohfaCalendar.byCrop.metricQuantity')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Crop Bars Card */}
        <View style={styles.cropBarsCard}>
          {rows.length === 0 ? (
            <Text style={styles.stateText}>{t('farmer.tohfaCalendar.empty', { count: summary.minGroupSize })}</Text>
          ) : (
            rows.map((row, idx) => {
              const isFarmers = activeTab === 'Farmers';
              const percent = isFarmers ? barPercent(row.farmers, maxFarmers) : barPercent(row.quantityKg, maxQuantity);
              const valueText = isFarmers
                ? String(row.farmers)
                : t('farmer.tohfaCalendar.byCrop.quantityValue', { qty: formatCommunityKg(row.quantityKg) });
              return (
                <View
                  key={row.id}
                  testID={`tohfaCalendar.row.${row.testKey}`}
                  style={[styles.cropBarRow, idx < rows.length - 1 && styles.cropBarBorder]}
                >
                  <View style={styles.cropBarTop}>
                    <Text style={styles.cropBarName}>{row.label}</Text>
                    <Text testID={`tohfaCalendar.value.${row.testKey}`} style={styles.cropBarValue}>{valueText}</Text>
                  </View>
                  <View style={styles.cropBarTrack}>
                    <View
                      testID={`tohfaCalendar.bar.${row.testKey}`}
                      style={[styles.cropBarFill, { width: `${percent}%`, backgroundColor: row.color }]}
                    />
                  </View>
                </View>
              );
            })
          )}
        </View>
      </>
    );
  };

  const sheetOptions = openFilter === null ? [] : optionsFor(openFilter);
  const filtersUnavailable = community.state === 'unavailable' || community.filtersState === 'unavailable';

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onNavigateBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('farmer.common.back')}
        >
          <ChevronLeft />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>{t('farmer.tohfaCalendar.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('farmer.tohfaCalendar.subtitle')}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={community.refreshing}
            onRefresh={community.refresh}
            colors={[colors.brandGreen]}
            tintColor={colors.brandGreen}
          />
        }
      >
        {/* Community View Info Banner */}
        <View style={styles.infoBanner}>
          <View style={styles.infoBannerIcon}>
            <CommunityIcon />
          </View>
          <Text style={styles.infoBannerText}>
            <Text style={styles.infoBannerBold}>{t('farmer.tohfaCalendar.banner.bold')}</Text>
            {' '}
            {t('farmer.tohfaCalendar.banner.body')}
          </Text>
        </View>

        {/* Filter Chips Row — hidden while the view is switched off (403/503):
            there is nothing to filter, and the sheet would only report a
            "could not load" error that Retry cannot fix. */}
        {filtersUnavailable ? null : (
          <View style={styles.filterRow}>
            <TouchableOpacity testID="tohfaCalendar.filter.crop" style={styles.filterChip} activeOpacity={0.7} onPress={() => setOpenFilter('crop')}>
              <Text style={styles.filterChipText} numberOfLines={1}>{cropChipLabel}</Text>
              <ChevronDown size={12} color={P.twGray600} />
            </TouchableOpacity>
            <TouchableOpacity testID="tohfaCalendar.filter.month" style={styles.filterChip} activeOpacity={0.7} onPress={() => setOpenFilter('month')}>
              <Text style={styles.filterChipText} numberOfLines={1}>{monthChipLabel}</Text>
              <ChevronDown size={12} color={P.twGray600} />
            </TouchableOpacity>
            <TouchableOpacity testID="tohfaCalendar.filter.region" style={styles.filterChip} activeOpacity={0.7} onPress={() => setOpenFilter('region')}>
              <Text style={styles.filterChipText} numberOfLines={1}>{regionChipLabel}</Text>
              <ChevronDown size={12} color={P.twGray600} />
            </TouchableOpacity>
          </View>
        )}

        {renderSummary()}

        {/* Customer Wishlist Demand — static placeholders, hidden: see SHOW_STATIC_WISHLIST_DEMAND */}
        {SHOW_STATIC_WISHLIST_DEMAND && (
          <>
            <View style={styles.wishlistHeader}>
              <HeartIcon />
              <Text style={styles.wishlistTitle}>{t('farmer.tohfaCalendar.wishlist.title')}</Text>
            </View>

            <View style={styles.wishlistCard}>
              {WISHLIST_DATA.map((item, idx) => (
                <View key={item.rank} style={[styles.wishlistRow, idx < WISHLIST_DATA.length - 1 && styles.wishlistRowBorder]}>
                  <Text style={[styles.wishlistRank, { color: RANK_COLORS[idx] || colors.brandGreen }]}>{item.rank}</Text>
                  <View style={styles.wishlistCropWrap}>
                    <Image
                      source={{ uri: CROP_IMAGES[item.name] }}
                      style={styles.wishlistCropImage}
                      resizeMode="cover"
                    />
                    <Text style={styles.wishlistCropName}>{item.name}</Text>
                  </View>
                  <Text style={styles.wishlistCustomers}>{t('farmer.tohfaCalendar.wishlist.customers', { count: item.customers })}</Text>
                  <Text style={styles.wishlistQty}>{item.quantity}</Text>
                </View>
              ))}
              <Text style={styles.wishlistFootnote}>{t('farmer.tohfaCalendar.wishlist.footnote')}</Text>
            </View>
          </>
        )}

        {/* Bottom spacer for sticky button */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Sticky Bottom Button */}
      <View style={styles.stickyBottom}>
        <TouchableOpacity style={styles.ctaButton} activeOpacity={0.8} onPress={onNavigateToCropInsight}>
          <SeedlingIcon />
          <Text style={styles.ctaButtonText}>{t('farmer.tohfaCalendar.cta')}</Text>
        </TouchableOpacity>
      </View>

      {/* Filter picker sheet (same Modal + backdrop pattern as AddPlantingScreen's date sheet) */}
      {openFilter !== null && !filtersUnavailable ? (
        <Modal
          transparent
          visible
          animationType="fade"
          statusBarTranslucent
          navigationBarTranslucent
          onRequestClose={() => setOpenFilter(null)}
        >
          <ModalSafeArea edges={['bottom']} style={styles.sheetOverlay}>
            <View style={[StyleSheet.absoluteFill, styles.sheetScrim]} pointerEvents="none" />
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setOpenFilter(null)} />
            <View style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>{t(filterTitle[openFilter])}</Text>
                <TouchableOpacity onPress={() => setOpenFilter(null)}>
                  <Text style={styles.sheetCancelText}>{t('farmer.common.cancel')}</Text>
                </TouchableOpacity>
              </View>
              {community.filtersState === 'error' ? (
                <Text style={styles.stateText}>{t('farmer.tohfaCalendar.filter.loadError')}</Text>
              ) : null}
              {community.filtersState === 'loading' ? <ActivityIndicator color={colors.brandGreen} /> : null}
              <ScrollView style={styles.sheetList}>
                {sheetOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    testID={`tohfaCalendar.option.${option.id}`}
                    style={[styles.sheetOption, option.selected && styles.sheetOptionSelected]}
                    onPress={() => chooseOption(option)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.sheetOptionText, option.selected && styles.sheetOptionTextSelected]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </ModalSafeArea>
        </Modal>
      ) : null}
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: P.creamTint1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: P.weatherCloudWhite,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: P.paleMintBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.textDark,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: typography.body,
    fontWeight: '400',
    color: colors.textSubtle,
    marginTop: 1,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },

  // Info Banner
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: P.lightGreen,
    borderRadius: 12,
    padding: 14,
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: P.greenPaleBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  infoBannerText: {
    flex: 1,
    fontSize: typography.body,
    lineHeight: 19,
    color: P.greenDeep5,
  },
  infoBannerBold: {
    fontWeight: '700',
    color: colors.textDark,
  },

  // Filters
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.weatherCloudWhite,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 6,
  },
  filterChipText: {
    fontSize: typography.body,
    fontWeight: '500',
    color: P.twGray700,
  },

  // Stat Cards
  statRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: P.weatherCloudWhite,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  statCardHighlight: {
    backgroundColor: P.paleMintBg,
    borderColor: P.green100,
  },
  statValue: {
    fontSize: typography.headline,
    fontWeight: '700',
    color: colors.textDark,
  },
  statValueHighlight: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.brandGreen,
  },
  statUnit: {
    fontSize: typography.body,
    fontWeight: '500',
  },
  statLabel: {
    fontSize: typography.caption,
    fontWeight: '500',
    color: colors.textSubtle,
    marginTop: 2,
  },
  statLabelHighlight: {
    fontSize: typography.caption,
    fontWeight: '500',
    color: P.green700,
    marginTop: 2,
  },

  // Section Header
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: typography.bodySmall,
    fontWeight: '600',
    color: colors.textSubtle,
    letterSpacing: 1,
  },
  tabPills: {
    flexDirection: 'row',
    backgroundColor: P.twGray100,
    borderRadius: 20,
    padding: 2,
  },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
  },
  tabPillActive: {
    backgroundColor: colors.brandGreen,
  },
  tabPillText: {
    fontSize: typography.bodySmall,
    fontWeight: '600',
    color: P.twGray500,
  },
  tabPillTextActive: {
    color: P.weatherCloudWhite,
  },

  // Crop Bars Card
  cropBarsCard: {
    backgroundColor: P.weatherCloudWhite,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    marginBottom: 24,
  },
  cropBarRow: {
    paddingVertical: 12,
  },
  cropBarBorder: {
    borderBottomWidth: 1,
    borderBottomColor: P.nearWhiteTint1,
  },
  cropBarTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cropBarImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    backgroundColor: P.surfaceMuted,
  },
  cropBarName: {
    flex: 1,
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.textDark,
  },
  cropBarValue: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray700,
    marginLeft: 8,
  },
  cropBarTrack: {
    height: 6,
    backgroundColor: colors.borderSoft,
    borderRadius: 3,
    overflow: 'hidden',
  },
  cropBarFill: {
    height: 6,
    borderRadius: 3,
  },

  // Wishlist Section
  wishlistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  wishlistTitle: {
    fontSize: typography.bodySmall,
    fontWeight: '600',
    color: colors.textSubtle,
    letterSpacing: 1,
  },

  // Wishlist Card
  wishlistCard: {
    backgroundColor: P.weatherCloudWhite,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  wishlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  wishlistRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: P.nearWhiteTint1,
  },
  wishlistRank: {
    width: 22,
    fontSize: typography.bodyLarge,
    fontWeight: '700',
  },
  wishlistCropWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wishlistCropImage: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: P.surfaceMuted,
  },
  wishlistCropName: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.textDark,
  },
  wishlistCustomers: {
    fontSize: typography.bodySmall,
    fontWeight: '400',
    color: P.twGray400,
    marginRight: 8,
  },
  wishlistQty: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.textDark,
    minWidth: 62,
    textAlign: 'right',
  },
  wishlistFootnote: {
    fontSize: typography.caption,
    fontWeight: '400',
    color: P.legal,
    marginTop: 12,
    fontStyle: 'italic',
  },

  // Sticky Bottom
  stickyBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: P.creamTint1,
  },
  ctaButton: {
    backgroundColor: colors.brandGreen,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: colors.brandGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaButtonText: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.weatherCloudWhite,
    letterSpacing: 0.3,
  },

  // Spacer so the last card clears the sticky CTA (was an inline 80).
  bottomSpacer: {
    height: spacing.modalGap + spacing.lg,
  },

  // Loading / error / empty
  stateCard: {
    backgroundColor: P.weatherCloudWhite,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    marginBottom: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  stateText: {
    fontSize: typography.body,
    color: colors.textSubtle,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.brandGreen,
    borderRadius: radius.button,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryButtonText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.weatherCloudWhite,
  },

  // Filter picker sheet
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  // Positioned by StyleSheet.absoluteFill at the call site.
  sheetScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: P.black,
    opacity: 0.4,
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    backgroundColor: P.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: '70%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sheetTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: colors.textDark,
  },
  sheetCancelText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray500,
  },
  sheetList: {
    flexGrow: 0,
  },
  sheetOption: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  sheetOptionSelected: {
    backgroundColor: P.paleMintBg,
  },
  sheetOptionText: {
    fontSize: typography.body,
    color: colors.textDark,
  },
  sheetOptionTextSelected: {
    fontWeight: '700',
    color: colors.brandGreen,
  },
});
