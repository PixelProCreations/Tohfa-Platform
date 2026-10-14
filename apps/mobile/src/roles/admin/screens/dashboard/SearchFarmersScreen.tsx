import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
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

function SearchIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M20 20l-4-4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export interface SearchFarmersScreenProps {
  onBack: () => void;
  onApplyFilters?: ((filters: {
    zone: string;
    method: string;
    certification: string;
    rating: string;
    status: string;
    keyword: string;
  }) => void) | undefined;
}

export function SearchFarmersScreen({ onBack, onApplyFilters }: SearchFarmersScreenProps) {
  const [keyword, setKeyword] = useState('');
  const [selectedZone, setSelectedZone] = useState('All');
  const [selectedMethod, setSelectedMethod] = useState('All');
  const [selectedCertification, setSelectedCertification] = useState('All');
  const [selectedRating, setSelectedRating] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const zoneOptions = ['All', 'Ooty', 'Coonoor', 'Kotagiri', 'Gudalur'];
  const methodOptions = ['All', 'Organic'];
  const certificationOptions = ['All', 'Certified'];
  const ratingOptions = ['All', '4+'];
  const statusOptions = ['All', 'Active'];

  const handleApply = () => {
    onApplyFilters?.({
      zone: selectedZone,
      method: selectedMethod,
      certification: selectedCertification,
      rating: selectedRating,
      status: selectedStatus,
      keyword,
    });
    onBack();
  };

  const handleClear = () => {
    setKeyword('');
    setSelectedZone('All');
    setSelectedMethod('All');
    setSelectedCertification('All');
    setSelectedRating('All');
    setSelectedStatus('All');
  };

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
            accessibilityLabel={t('searchFarmers.backLabel')}
          >
            <BackArrowIcon size={24} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('searchFarmers.title')}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Input Box */}
        <View style={styles.searchBox}>
          <SearchIcon size={18} color={adminColors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('searchFarmers.searchPlaceholder')}
            placeholderTextColor={adminColors.muted}
            value={keyword}
            onChangeText={setKeyword}
          />
        </View>

        {/* Section Heading: Filters */}
        <Text style={styles.filtersHeading}>{t('searchFarmers.section.filters')}</Text>

        {/* Group 1: Zone */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterGroupLabel}>{t('searchFarmers.filter.zone')}</Text>
          <View style={styles.chipsRow}>
            {zoneOptions.map((zone) => {
              const active = selectedZone === zone;
              return (
                <TouchableOpacity
                  key={zone}
                  style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
                  onPress={() => setSelectedZone(zone)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
                    {zone}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Group 2: Farming Method */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterGroupLabel}>{t('searchFarmers.filter.method')}</Text>
          <View style={styles.chipsRow}>
            {methodOptions.map((method) => {
              const active = selectedMethod === method;
              return (
                <TouchableOpacity
                  key={method}
                  style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
                  onPress={() => setSelectedMethod(method)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
                    {method}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Group 3: Certification */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterGroupLabel}>{t('searchFarmers.filter.certification')}</Text>
          <View style={styles.chipsRow}>
            {certificationOptions.map((cert) => {
              const active = selectedCertification === cert;
              return (
                <TouchableOpacity
                  key={cert}
                  style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
                  onPress={() => setSelectedCertification(cert)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
                    {cert}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Group 4: Rating */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterGroupLabel}>{t('searchFarmers.filter.rating')}</Text>
          <View style={styles.chipsRow}>
            {ratingOptions.map((rating) => {
              const active = selectedRating === rating;
              return (
                <TouchableOpacity
                  key={rating}
                  style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
                  onPress={() => setSelectedRating(rating)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
                    {rating}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Group 5: Account Status */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterGroupLabel}>{t('searchFarmers.filter.status')}</Text>
          <View style={styles.chipsRow}>
            {statusOptions.map((status) => {
              const active = selectedStatus === status;
              return (
                <TouchableOpacity
                  key={status}
                  style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
                  onPress={() => setSelectedStatus(status)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
                    {status}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Action Buttons: Apply & Clear */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={handleClear}
            activeOpacity={0.8}
          >
            <Text style={styles.clearBtnText}>{t('searchFarmers.action.clear')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.applyBtn}
            onPress={handleApply}
            activeOpacity={0.8}
          >
            <Text style={styles.applyBtnText}>{t('searchFarmers.action.apply')}</Text>
          </TouchableOpacity>
        </View>
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
    ...adminType.sectionHead,
    color: adminColors.onBrand,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xxl,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    height: 48,
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.xl,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  filtersHeading: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.md,
  },
  filterGroup: {
    marginBottom: adminSpacing.lg,
  },
  filterGroupLabel: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: adminSpacing.sm,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.sm,
  },
  chip: {
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.sm + 1,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  chipInactive: {
    backgroundColor: adminColors.card,
    borderColor: adminColors.border,
  },
  chipText: {
    ...adminType.caption,
    fontWeight: '700',
  },
  chipTextActive: {
    color: adminColors.onBrand,
  },
  chipTextInactive: {
    color: adminColors.ink,
  },
  actionRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    marginTop: adminSpacing.xl,
  },
  clearBtn: {
    flex: 1,
    height: 48,
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },
  applyBtn: {
    flex: 1,
    height: 48,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
  },
});
