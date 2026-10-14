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
import { adminColors } from '../../theme';

// ─── Theme Colors ────────────────────────────────────────────────────────────
const THEME = {
  headerBg: adminColors.brand, // Matches Purchases screen & theme primary (#F0562A)
  white: adminColors.onBrand,
  canvas: adminColors.canvas,
  card: adminColors.card,
  border: adminColors.border,
  titleRustDark: adminColors.brandDeep,
  ink: adminColors.ink,
  muted: adminColors.muted,
  brandOrange: adminColors.brand,
  btnBg: '#FAF7F2',
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

function SearchIcon({ size = 18, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M20 20l-4-4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export interface SearchFarmersScreenProps {
  onBack: () => void;
  onApplyFilters?: (filters: {
    zone: string;
    method: string;
    certification: string;
    rating: string;
    status: string;
    keyword: string;
  }) => void;
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
      <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

      {/* ─── Header Matching Screenshot 2 ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={24} color={THEME.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Search Farmers</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Input Box */}
        <View style={styles.searchBox}>
          <SearchIcon size={18} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Farmer ID / Name / Zone"
            placeholderTextColor="#9CA3AF"
            value={keyword}
            onChangeText={setKeyword}
          />
        </View>

        {/* Section Heading: Filters */}
        <Text style={styles.filtersHeading}>Filters</Text>

        {/* Group 1: Zone */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterGroupLabel}>Zone</Text>
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
          <Text style={styles.filterGroupLabel}>Farming Method</Text>
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
          <Text style={styles.filterGroupLabel}>Certification</Text>
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
          <Text style={styles.filterGroupLabel}>Rating</Text>
          <View style={styles.chipsRow}>
            {ratingOptions.map((rate) => {
              const active = selectedRating === rate;
              return (
                <TouchableOpacity
                  key={rate}
                  style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
                  onPress={() => setSelectedRating(rate)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
                    {rate}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Group 5: Status */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterGroupLabel}>Status</Text>
          <View style={styles.chipsRow}>
            {statusOptions.map((st) => {
              const active = selectedStatus === st;
              return (
                <TouchableOpacity
                  key={st}
                  style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
                  onPress={() => setSelectedStatus(st)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
                    {st}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Action Buttons Row: Apply & Clear */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleApply}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnText}>Apply</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleClear}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnText}>Clear</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stylesheet Matching Screenshot 2 Exact UI ───────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.canvas,
  },
  header: {
    backgroundColor: THEME.headerBg,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.white,
    letterSpacing: -0.2,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: THEME.ink,
    paddingVertical: 0,
  },
  filtersHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.titleRustDark,
    marginBottom: 14,
  },
  filterGroup: {
    marginBottom: 16,
  },
  filterGroupLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: THEME.ink,
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: THEME.brandOrange,
    borderColor: THEME.brandOrange,
  },
  chipInactive: {
    backgroundColor: THEME.card,
    borderColor: THEME.border,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  chipTextActive: {
    color: THEME.white,
  },
  chipTextInactive: {
    color: THEME.ink,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    backgroundColor: THEME.btnBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.ink,
  },
});
