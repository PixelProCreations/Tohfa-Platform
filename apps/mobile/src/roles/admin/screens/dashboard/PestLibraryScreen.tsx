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

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';
import { t } from '../../i18n';

// ─── Icons ───────────────────────────────────────────────────────────────────

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

function SearchIcon({ size = 18, color = adminColors.placeholder }: { size?: number; color?: string }) {
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
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel={t('pestLibrary.backLabel')}
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{t('pestLibrary.title')}</Text>
        </View>
      </View>

      {/* ─── Scroll Container ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Search Bar ─── */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} color={adminColors.placeholder} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('pestLibrary.searchPlaceholder')}
            placeholderTextColor={adminColors.placeholder}
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

        <View style={{ height: adminSpacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },

  // Header
  header: {
    backgroundColor: adminColors.brand,
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
    paddingVertical: adminSpacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
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
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    marginBottom: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    padding: 0,
  },

  // List Container
  listContainer: {
    gap: adminSpacing.md,
  },
  pestCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    ...adminShadow.sm,
  },
  pestName: {
    ...adminType.rowTitle,
    fontStyle: 'italic',
    color: adminColors.ink,
  },
  scientificName: {
    ...adminType.rowMeta,
    fontStyle: 'italic',
    color: adminColors.muted,
    marginTop: 2,
    marginBottom: 10,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  cropBadge: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.xs,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 4,
  },
  cropBadgeText: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.ink,
  },
  severityBadge: {
    borderRadius: adminRadius.xs,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 4,
  },
  severityBadgeText: {
    ...adminType.caption,
    fontWeight: '700',
  },
  badgeMedium: {
    backgroundColor: adminColors.warning.bg,
  },
  badgeTextMedium: {
    color: adminColors.warning.text,
  },
  badgeHigh: {
    backgroundColor: adminColors.danger.bg,
  },
  badgeTextHigh: {
    color: adminColors.danger.text,
  },
  badgeLow: {
    backgroundColor: adminColors.success.bg,
  },
  badgeTextLow: {
    color: adminColors.success.text,
  },
});
