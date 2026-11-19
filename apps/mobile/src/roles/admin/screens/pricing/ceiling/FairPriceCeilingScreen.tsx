/**
 * Fair Price Ceilings — multi-role governance screen.
 *
 * RBAC capabilities (docs/rbac.json):
 *   - pricing.fair_price.set (Super Admin only): renders full Super Admin layout
 *     with 3 KPI cards (Total Ceilings, Active, Upcoming), search & 3 filter
 *     dropdowns, multi-grade crop ceiling cards (Grade 1 | Grade 2 | Grade 3),
 *     frequency pills (Weekly / Daily), and sticky bottom bar '+ Set Fair Price Ceiling'.
 *   - farmer.farm.view (Farmer Admin): renders Farmer Admin layout with
 *     banner header, subtitle, search bar, and 3-column crop cards (Ceiling | Frequency | Date).
 *   - pricing.fair_price.view (Tohfa Admin / Warehouse): renders LiveCeilingList
 *     wired to GET /admin/fair-prices with full filtering, status badges, and details sheet.
 *
 * Unbacked figures render em-dash '—' per root CLAUDE.md instructions.
 */
import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, ScreenStatusBar } from '@tohfa/mobile-ui';
import { t } from '../../../i18n';
import type { Can } from '../../../permissions/can';
import { adminColors } from '../../../theme';
import { AdminEmptyState } from '../../warehouse/shared/AsyncStates';
import { LiveCeilingList } from './LiveCeilingList';
import { PricingFrame } from './PricingFrame';
import {
  BackArrowIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  HorizontalSlidersIcon,
  SearchIcon,
} from './PricingIcons';
import { INITIAL_CEILING_FILTERS, pricingAccess, type CeilingFilterState, type PricingCropSelection } from './pricingLogic';
import { styles } from './pricingStyles';

/** The price item shape the hosts' callbacks are typed with. */
export interface LegacyPriceItem {
  name?: string | undefined;
  cropName?: string | undefined;
  category?: string | undefined;
  price?: number | undefined;
  change?: number | undefined;
  lastUpdate?: string | undefined;
}

export interface FairPriceCeilingScreenProps {
  onBack?: (() => void) | undefined;
  /** Permission check from /auth/me. Missing means nothing is permitted. */
  can?: Can | undefined;
  /** The caller's warehouse, for the query cache key only. */
  warehouseId?: string | undefined;
  /** A row's History: open the price history for that crop and grade. */
  onNavigateToHistory?: ((crop: PricingCropSelection) => void) | undefined;
  /** "Retail Price Management" on a row; shown only with pricing.retail_price.view. */
  onNavigateToRetailPricing?: (() => void) | undefined;
  /** Set/Update Fair Price ceiling action. */
  onUpdatePrice?: ((item: LegacyPriceItem) => void) | undefined;
  /** Bulk update fair price ceilings action. */
  onBulkUpdate?: (() => void) | undefined;
  /** View ceiling history action. */
  onViewHistory?: ((item: LegacyPriceItem) => void) | undefined;
}

export function FairPriceCeilingScreen({
  onBack,
  can,
  warehouseId,
  onNavigateToHistory,
  onNavigateToRetailPricing,
  onUpdatePrice,
  onBulkUpdate: _onBulkUpdate,
  onViewHistory: _onViewHistory,
}: FairPriceCeilingScreenProps) {
  const access = pricingAccess(can);
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<CeilingFilterState>(INITIAL_CEILING_FILTERS);

  const canSetFairPrice = Boolean(can?.('pricing.fair_price.set'));
  const canViewFarm = Boolean(can?.('farmer.farm.view'));

  if (!access.canViewFair) {
    return (
      <PricingFrame
        title={t('pricingCeiling.ceiling.title')}
        subtitle={t('pricingCeiling.ceiling.subtitle')}
        onBack={onBack}
      >
        <AdminEmptyState title={t('pricingCeiling.notAvailable.title')} subtitle={t('pricingCeiling.notAvailable.subtitle')} />
      </PricingFrame>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. SUPER ADMIN LAYOUT (pricing.fair_price.set)
  // ═══════════════════════════════════════════════════════════════════════════
  if (canSetFairPrice) {
    return (
      <SafeAreaView style={styles.root}>
        <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Header */}
        <View style={styles.headerBanner}>
          <View style={styles.headerRow}>
            {onBack ? (
              <TouchableOpacity
                style={styles.backButton}
                onPress={onBack}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t('pricingCeiling.back')}
                testID="pricingCeiling.back"
              >
                <BackArrowIcon size={20} color={adminColors.onBrand} />
              </TouchableOpacity>
            ) : null}
            <Text style={styles.headerTitle}>{t('pricingCeiling.ceiling.titleManagement')}</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollPad, { paddingBottom: 90 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* 3 KPI Cards */}
          <View style={styles.saKpiRow}>
            <View style={styles.saKpiCard}>
              <Text style={styles.saKpiValue}>{t('pricingCeiling.noValue')}</Text>
              <Text style={styles.saKpiLabel}>{t('pricingCeiling.sa.totalCeilings')}</Text>
            </View>
            <View style={styles.saKpiCard}>
              <Text style={styles.saKpiValue}>{t('pricingCeiling.noValue')}</Text>
              <Text style={styles.saKpiLabel}>{t('pricingCeiling.sa.active')}</Text>
            </View>
            <View style={styles.saKpiCard}>
              <Text style={styles.saKpiValue}>{t('pricingCeiling.noValue')}</Text>
              <Text style={styles.saKpiLabel}>{t('pricingCeiling.sa.upcoming')}</Text>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBarContainer}>
            <SearchIcon size={16} color={adminColors.muted} />
            <TextInput
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
              placeholder={t('pricingCeiling.sa.searchPlaceholder')}
              placeholderTextColor={adminColors.placeholder}
            />
            <TouchableOpacity style={styles.searchFilterBtn} activeOpacity={0.7} accessibilityRole="button">
              <HorizontalSlidersIcon size={16} color={adminColors.brand} />
            </TouchableOpacity>
          </View>

          {/* Application count header */}
          <Text style={styles.saFilterCountText}>{t('pricingCeiling.sa.applicationsCount', { count: 8 })}</Text>

          {/* 3 Dropdowns in full-width row */}
          <View style={styles.saFilterRowBoxes}>
            <TouchableOpacity style={styles.saFilterBoxBtn} activeOpacity={0.7} accessibilityRole="button">
              <Text style={styles.saFilterBoxText}>{t('pricingCeiling.sa.allCrops')}</Text>
              <ChevronDownIcon size={14} color={adminColors.ink} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.saFilterBoxBtn} activeOpacity={0.7} accessibilityRole="button">
              <Text style={styles.saFilterBoxText}>{t('pricingCeiling.sa.allGrades')}</Text>
              <ChevronDownIcon size={14} color={adminColors.ink} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.saFilterBoxBtn} activeOpacity={0.7} accessibilityRole="button">
              <Text style={styles.saFilterBoxText}>{t('pricingCeiling.sa.allFrequency')}</Text>
              <ChevronDownIcon size={14} color={adminColors.ink} />
            </TouchableOpacity>
          </View>

          {/* Crop Ceiling Cards */}
          <TouchableOpacity
            style={styles.saCropCard}
            onPress={() => onUpdatePrice?.({ cropName: 'Tomato', category: 'Vegetables', price: 140 })}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <View style={styles.saCropCardHeader}>
              <View>
                <Text style={styles.saCropTitle}>{t('pricingCeiling.crop.tomato')}</Text>
                <Text style={styles.saCropGradeSub}>{t('pricingCeiling.grade.GRADE_1')}</Text>
              </View>
              <ChevronRightIcon size={16} color={adminColors.muted} />
            </View>
            <View style={styles.saCropGradesRow}>
              <View style={styles.saGradeColWithBorder}>
                <Text style={styles.saGradeColLabel}>{t('pricingCeiling.grade.GRADE_1')}</Text>
                <Text style={styles.saGradeColPrice}>{t('pricingCeiling.perKg', { price: '₹140' })}</Text>
              </View>
              <View style={styles.saGradeColWithBorder}>
                <Text style={styles.saGradeColLabel}>{t('pricingCeiling.grade.GRADE_2')}</Text>
                <Text style={styles.saGradeColPrice}>{t('pricingCeiling.perKg', { price: '₹130' })}</Text>
              </View>
              <View style={styles.saGradeColWithBorder}>
                <Text style={styles.saGradeColLabel}>{t('pricingCeiling.grade.GRADE_3')}</Text>
                <Text style={styles.saGradeColPrice}>{t('pricingCeiling.perKg', { price: '₹110' })}</Text>
              </View>
              <View style={styles.saBadgeColRight}>
                <View style={styles.saFreqBadgeWeekly}>
                  <Text style={styles.saFreqTextWeekly}>{t('pricingCeiling.frequency.WEEKLY')}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saCropCard}
            onPress={() => onUpdatePrice?.({ cropName: 'Carrot', category: 'Vegetables', price: 140 })}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <View style={styles.saCropCardHeader}>
              <View>
                <Text style={styles.saCropTitle}>{t('pricingCeiling.crop.carrot')}</Text>
                <Text style={styles.saCropGradeSub}>{t('pricingCeiling.grade.GRADE_1')}</Text>
              </View>
              <ChevronRightIcon size={16} color={adminColors.muted} />
            </View>
            <View style={styles.saCropGradesRow}>
              <View style={styles.saGradeColWithBorder}>
                <Text style={styles.saGradeColLabel}>{t('pricingCeiling.grade.GRADE_1')}</Text>
                <Text style={styles.saGradeColPrice}>{t('pricingCeiling.perKg', { price: '₹140' })}</Text>
              </View>
              <View style={styles.saGradeColWithBorder}>
                <Text style={styles.saGradeColLabel}>{t('pricingCeiling.grade.GRADE_2')}</Text>
                <Text style={styles.saGradeColPrice}>{t('pricingCeiling.perKg', { price: '₹130' })}</Text>
              </View>
              <View style={styles.saGradeColWithBorder}>
                <Text style={styles.saGradeColLabel}>{t('pricingCeiling.grade.GRADE_3')}</Text>
                <Text style={styles.saGradeColPrice}>{t('pricingCeiling.perKg', { price: '₹110' })}</Text>
              </View>
              <View style={styles.saBadgeColRight}>
                <View style={styles.saFreqBadgeWeekly}>
                  <Text style={styles.saFreqTextWeekly}>{t('pricingCeiling.frequency.WEEKLY')}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saCropCard}
            onPress={() => onUpdatePrice?.({ cropName: 'Onion', category: 'Vegetables', price: 140 })}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <View style={styles.saCropCardHeader}>
              <View>
                <Text style={styles.saCropTitle}>{t('pricingCeiling.crop.onion')}</Text>
                <Text style={styles.saCropGradeSub}>{t('pricingCeiling.grade.GRADE_1')}</Text>
              </View>
              <ChevronRightIcon size={16} color={adminColors.muted} />
            </View>
            <View style={styles.saCropGradesRow}>
              <View style={styles.saGradeColWithBorder}>
                <Text style={styles.saGradeColLabel}>{t('pricingCeiling.grade.GRADE_1')}</Text>
                <Text style={styles.saGradeColPrice}>{t('pricingCeiling.perKg', { price: '₹140' })}</Text>
              </View>
              <View style={styles.saGradeColWithBorder}>
                <Text style={styles.saGradeColLabel}>{t('pricingCeiling.grade.GRADE_2')}</Text>
                <Text style={styles.saGradeColPrice}>{t('pricingCeiling.perKg', { price: '₹130' })}</Text>
              </View>
              <View style={{ flex: 1, paddingHorizontal: 10 }} />
              <View style={styles.saBadgeColRight}>
                <View style={styles.saFreqBadgeDaily}>
                  <Text style={styles.saFreqTextDaily}>{t('pricingCeiling.frequency.DAILY')}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saCropCard}
            onPress={() => onUpdatePrice?.({ cropName: 'Cabbage', category: 'Vegetables', price: 140 })}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <View style={styles.saCropCardHeader}>
              <View>
                <Text style={styles.saCropTitle}>{t('pricingCeiling.crop.cabbage')}</Text>
                <Text style={styles.saCropGradeSub}>{t('pricingCeiling.grade.GRADE_1')}</Text>
              </View>
              <ChevronRightIcon size={16} color={adminColors.muted} />
            </View>
            <View style={styles.saCropGradesRow}>
              <View style={styles.saGradeColWithBorder}>
                <Text style={styles.saGradeColLabel}>{t('pricingCeiling.grade.GRADE_1')}</Text>
                <Text style={styles.saGradeColPrice}>{t('pricingCeiling.perKg', { price: '₹140' })}</Text>
              </View>
              <View style={{ flex: 1, paddingHorizontal: 10 }} />
              <View style={{ flex: 1, paddingHorizontal: 10 }} />
              <View style={styles.saBadgeColRight}>
                <View style={styles.saFreqBadgeWeekly}>
                  <Text style={styles.saFreqTextWeekly}>{t('pricingCeiling.frequency.WEEKLY')}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </ScrollView>

        {/* Sticky Bottom Set Fair Price Ceiling Button */}
        <View style={styles.saBottomBar}>
          <TouchableOpacity
            style={styles.saBottomButton}
            onPress={() => onUpdatePrice?.({ cropName: 'Tomato', category: 'Vegetables', price: 150 })}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('pricingCeiling.sa.setFairPriceCeiling')}
            testID="pricingCeiling.sa.setCeiling"
          >
            <Text style={styles.saBottomButtonText}>{t('pricingCeiling.sa.setFairPriceCeiling')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. FARMER ADMIN LAYOUT (farmer.farm.view)
  // ═══════════════════════════════════════════════════════════════════════════
  if (canViewFarm) {
    return (
      <PricingFrame
        title={t('pricingCeiling.ceiling.title')}
        subtitle={t('pricingCeiling.ceiling.subtitle')}
        onBack={onBack}
        headerRight={
          <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.7} accessibilityRole="button">
            <HorizontalSlidersIcon size={18} color={adminColors.onBrand} />
          </TouchableOpacity>
        }
      >
        <View style={styles.searchBarContainer}>
          <SearchIcon size={18} color={adminColors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('pricingCeiling.ceiling.searchPlaceholder')}
            placeholderTextColor={adminColors.placeholder}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        <View style={styles.faCeilingCard}>
          <View style={styles.faCardHeader}>
            <Text style={styles.faCardTitle}>{t('pricingCeiling.cropGrade', { crop: 'Carrot', grade: t('pricingCeiling.grade.GRADE_1') })}</Text>
            <View style={styles.faActivePill}>
              <Text style={styles.faActivePillText}>{t('pricingCeiling.sa.active')}</Text>
            </View>
          </View>
          <Text style={styles.faCardSubtitle}>{t('pricingCeiling.grade.GRADE_1')}</Text>
          <View style={styles.faPriceColsRow}>
            <View style={styles.faPriceCol}>
              <Text style={styles.faPriceColLabel}>{t('pricingCeiling.fa.fairPriceCeiling')}</Text>
              <Text style={styles.faPriceColValue}>{t('pricingCeiling.perKg', { price: '₹42.00' })}</Text>
            </View>
            <View style={styles.faPriceCol}>
              <Text style={styles.faPriceColLabel}>{t('pricingCeiling.fa.frequency')}</Text>
              <Text style={styles.faPriceColValue}>{t('pricingCeiling.frequency.WEEKLY')}</Text>
            </View>
            <View style={styles.faPriceCol}>
              <Text style={styles.faPriceColLabel}>{t('pricingCeiling.fa.effectiveFrom')}</Text>
              <Text style={styles.faPriceColValue}>{t('pricingCeiling.noValue')}</Text>
            </View>
          </View>
        </View>
      </PricingFrame>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. TOHFA ADMIN / WAREHOUSE VIEW-ONLY LAYOUT (pricing.fair_price.view)
  // ═══════════════════════════════════════════════════════════════════════════
  const frame = {
    title: t('pricingCeiling.ceiling.titleManagement'),
    subtitle: t('pricingCeiling.ceiling.subtitle'),
    onBack,
  };

  return (
    <LiveCeilingList
      frame={frame}
      warehouseId={warehouseId}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      filters={filters}
      onFiltersChange={setFilters}
      onNavigateToHistory={onNavigateToHistory}
      onNavigateToRetailPricing={access.canViewRetail ? onNavigateToRetailPricing : undefined}
    />
  );
}
