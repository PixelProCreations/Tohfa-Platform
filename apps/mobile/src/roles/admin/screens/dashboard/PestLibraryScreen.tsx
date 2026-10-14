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
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { adminColors, adminRadius, adminSpacing } from '../../theme';

// ─── Design Tokens ───────────────────────────────────────────────────────────
const THEME = {
  headerBg: adminColors.brand,
  white: adminColors.onBrand,

  // Canvas & Surfaces
  canvas: adminColors.canvas,
  card: adminColors.card,
  border: adminColors.border,

  // Typography
  titleRustDark: adminColors.brandDeep,
  ink: adminColors.ink,
  muted: adminColors.muted,

  // Severity Badges
  mediumBadgeBg: '#FEF3C7',
  mediumBadgeText: '#B45309',
  highBadgeBg: '#FEE2E2',
  highBadgeText: '#DC2626',
  lowBadgeBg: '#DCFCE7',
  lowBadgeText: '#15803D',
  neutralBadgeBg: '#F3F4F6',
  neutralBadgeText: '#4B5563',
};

// ─── Icons ───────────────────────────────────────────────────────────────────

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

function SearchIcon({ size = 18, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Line x1="16.5" y1="16.5" x2="21" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Data Types ──────────────────────────────────────────────────────────────

export interface PestItem {
  id: string;
  name: string;
  scientificName: string;
  crop: string;
  severity: 'Low' | 'Medium' | 'High';
  symptoms?: string;
  treatment?: string;
}

export const SAMPLE_PESTS: PestItem[] = [
  {
    id: 'PEST-001',
    name: 'Aphid',
    scientificName: 'Aphidoidea',
    crop: 'Carrot',
    severity: 'Medium',
    symptoms: 'Curled leaves, sticky honeydew secretion',
    treatment: 'Neem oil spray, introducing ladybird beetles',
  },
  {
    id: 'PEST-002',
    name: 'Cabbage Worm',
    scientificName: 'Pieris rapae',
    crop: 'Cabbage',
    severity: 'High',
    symptoms: 'Large ragged holes in leaves, dark green droppings',
    treatment: 'Bacillus thuringiensis (Bt) spray, hand picking',
  },
  {
    id: 'PEST-003',
    name: 'Tomato Hornworm',
    scientificName: 'Manduca quinquemaculata',
    crop: 'Tomato',
    severity: 'High',
    symptoms: 'Defoliation of upper foliage, chewed fruit',
    treatment: 'Trichogramma wasps, organic pyrethrin',
  },
];

// ─── Component Props ──────────────────────────────────────────────────────────

export interface PestLibraryScreenProps {
  onBack: () => void;
  onSelectPest?: (pest: PestItem) => void;
}

export function PestLibraryScreen({
  onBack,
  onSelectPest,
}: PestLibraryScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPests = SAMPLE_PESTS.filter((pest) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      pest.name.toLowerCase().includes(q) ||
      pest.scientificName.toLowerCase().includes(q) ||
      pest.crop.toLowerCase().includes(q) ||
      (pest.symptoms && pest.symptoms.toLowerCase().includes(q)) ||
      (pest.treatment && pest.treatment.toLowerCase().includes(q))
    );
  });

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

      {/* ─── Header: Matching Screenshot 5 ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={22} color={THEME.white} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Pest & Pesticide Library</Text>
        </View>
      </View>

      {/* ─── Scroll Container ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Search Bar (Screenshot 5) ─── */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Pest name, scientific name, crop, symptom, treatment"
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* ─── Pest Cards List ─── */}
        <View style={styles.listContainer}>
          {filteredPests.map((pest) => {
            const isMedium = pest.severity === 'Medium';
            const isHigh = pest.severity === 'High';
            return (
              <TouchableOpacity
                key={pest.id}
                style={styles.pestCard}
                onPress={() => onSelectPest?.(pest)}
                activeOpacity={0.85}
              >
                <Text style={styles.pestName}>{pest.name}</Text>
                <Text style={styles.scientificName}>{pest.scientificName}</Text>

                <View style={styles.badgesRow}>
                  {/* Crop Badge */}
                  <View style={styles.cropBadge}>
                    <Text style={styles.cropBadgeText}>{pest.crop}</Text>
                  </View>

                  {/* Severity Badge */}
                  <View
                    style={[
                      styles.severityBadge,
                      isMedium && styles.badgeMedium,
                      isHigh && styles.badgeHigh,
                      !isMedium && !isHigh && styles.badgeLow,
                    ]}
                  >
                    <Text
                      style={[
                        styles.severityBadgeText,
                        isMedium && styles.badgeTextMedium,
                        isHigh && styles.badgeTextHigh,
                        !isMedium && !isHigh && styles.badgeTextLow,
                      ]}
                    >
                      {pest.severity}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stylesheet ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.canvas,
  },

  // Header
  header: {
    backgroundColor: THEME.headerBg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.lg,
    paddingHorizontal: adminSpacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    paddingRight: 6,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.white,
    letterSpacing: -0.3,
    marginLeft: 6,
  },

  // Scroll Container
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl,
  },

  // Search Bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.card,
    borderRadius: adminRadius.md, // 12px
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: adminSpacing.md,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: THEME.ink,
    padding: 0,
  },

  // List Container
  listContainer: {
    gap: adminSpacing.md,
  },
  pestCard: {
    backgroundColor: THEME.card,
    borderRadius: adminRadius.xl, // 16px
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  pestName: {
    fontSize: 16,
    fontWeight: '800',
    fontStyle: 'italic',
    color: THEME.ink,
  },
  scientificName: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#6B7280',
    marginTop: 2,
    marginBottom: 10,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cropBadge: {
    backgroundColor: THEME.neutralBadgeBg,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cropBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.neutralBadgeText,
  },
  severityBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  severityBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeMedium: {
    backgroundColor: THEME.mediumBadgeBg,
  },
  badgeTextMedium: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.mediumBadgeText,
  },
  badgeHigh: {
    backgroundColor: THEME.highBadgeBg,
  },
  badgeTextHigh: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.highBadgeText,
  },
  badgeLow: {
    backgroundColor: THEME.lowBadgeBg,
  },
  badgeTextLow: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.lowBadgeText,
  },
});
