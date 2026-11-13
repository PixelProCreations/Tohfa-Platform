import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import {
  customerColors,
  customerFonts,
  customerShadow,
  customerSpacing,
} from '../theme';
import { ArrowRightFigmaIcon } from '../components/ArrowRightFigmaIcon';

interface CustomerProfileHarvestPreferencesScreenProps {
  onNavigate: (screen: 'CustomerPermissions' | 'CustomerMain') => void;
}

// ── SVG ICONS MATCHING FIGMA SPEC ───────────────────────────────────────────

const SaladBowlIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 11c0 4.97 4.03 9 9 9s9-4.03 9-9H3z"
      stroke="#2E7D32"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 4c-1.5 2-2 4-2 6h4c0-2-.5-4-2-6z"
      stroke="#4CAF50"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="#81C784"
    />
    <Path
      d="M7 6c.5 1.5 1.5 3 3 4"
      stroke="#4CAF50"
      strokeWidth={1.8}
      strokeLinecap="round"
    />
  </Svg>
);

const ShieldCheckIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 3L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-3z"
      stroke="#2E7D32"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="#E8F5E9"
    />
    <Path
      d="M9 12l2 2 4-4"
      stroke="#2E7D32"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const VegetarianIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 14v7M10 21h4"
      stroke="#558B2F"
      strokeWidth={2.5}
      strokeLinecap="round"
    />
    <Path
      d="M12 4a4.5 4.5 0 00-4.24 3A4.5 4.5 0 005.5 14h13a4.5 4.5 0 00-2.26-7A4.5 4.5 0 0012 4z"
      fill="#4CAF50"
    />
  </Svg>
);

const NonVegIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 12c0 4-3.5 7-8 7s-7-3-7-7 3.5-7 7-7c3 0 5.5 1.5 6.5 4"
      stroke="#FF7043"
      strokeWidth={2.5}
      strokeLinecap="round"
    />
    <Circle cx={14} cy={12} r={3} fill="#FFA726" />
  </Svg>
);

const EggetarianIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 3C8.5 3 6 8 6 13.5 6 17.5 8.7 21 12 21s6-3.5 6-7.5C18 8 15.5 3 12 3z"
      fill="#E08A38"
    />
  </Svg>
);

const VeganIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 18c0-7 6-12 12-12 0 7-6 12-12 12z"
      fill="#43A047"
    />
    <Path
      d="M6 18c3-3 6-5 9-6"
      stroke="#C8E6C9"
      strokeWidth={1.5}
      strokeLinecap="round"
    />
  </Svg>
);

const GlutenFreeIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M4 20l16-16" stroke="#FBC02D" strokeWidth={2} strokeLinecap="round" />
    <Path
      d="M10 8c1-2 3-2 4-1M13 11c1-2 3-2 4-1M7 11c1-2 3-2 4-1M10 14c1-2 3-2 4-1M7 17c1-2 3-2 4-1"
      stroke="#FBC02D"
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

const KetoIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 3C9 3 7 7 7 12a5 5 0 0010 0c0-5-2-9-5-9z"
      fill="#7CB342"
    />
    <Circle cx={12} cy={13} r={3} fill="#6D4C41" />
  </Svg>
);

const HighProteinIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M8 7a6 6 0 018.5 8.5L14 18l-4-4L8 7z"
      fill="#A1887F"
    />
    <Circle cx={7} cy={17} r={2} fill="#D7CCC8" />
  </Svg>
);

const OrganicIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={13} r={7} fill="#E53935" />
    <Path
      d="M12 3v3M10 5l4 2M14 5l-4 2"
      stroke="#43A047"
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

const PesticideFreeIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M10 3h4M12 3v5l5 9a2 2 0 01-1.7 3H8.7A2 2 0 017 17l5-9V3"
      stroke="#1976D2"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line x1={4} y1={4} x2={20} y2={20} stroke="#D32F2F" strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const NoAdditivesIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={9} stroke="#E53935" strokeWidth={2} />
    <Line x1={5.6} y1={5.6} x2={18.4} y2={18.4} stroke="#E53935" strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const HormoneFreeIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={9} stroke="#E53935" strokeWidth={2} />
    <Line x1={5.6} y1={5.6} x2={18.4} y2={18.4} stroke="#E53935" strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const GreenCheckBadge = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke="#2E7D32" strokeWidth={2} />
    <Path
      d="M8 12.5l2.5 2.5 5.5-5.5"
      stroke="#2E7D32"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const CustomerProfileHarvestPreferencesScreen: React.FC<CustomerProfileHarvestPreferencesScreenProps> = ({
  onNavigate,
}) => {
  const [selectedEatingStyles, setSelectedEatingStyles] = useState<string[]>([]);
  const [selectedMatters, setSelectedMatters] = useState<string[]>([]);

  // 2-column layout matching Figma exactly:
  // Col 1: Vegetarian, Eggetarian, Gluten free, High protein
  // Col 2: Non-vegetarian, Vegan, Keto/low card
  const eatingStylesCol1 = [
    { id: 'veg', label: 'Vegetarian', IconComp: VegetarianIcon },
    { id: 'egg', label: 'Eggetarian', IconComp: EggetarianIcon },
    { id: 'gluten-free', label: 'Gluten free', IconComp: GlutenFreeIcon },
    { id: 'high-protein', label: 'High protein', IconComp: HighProteinIcon },
  ];

  const eatingStylesCol2 = [
    { id: 'non-veg', label: 'Non-vegetarian', IconComp: NonVegIcon },
    { id: 'vegan', label: 'Vegan', IconComp: VeganIcon },
    { id: 'keto', label: 'Keto/low card', IconComp: KetoIcon },
  ];

  // Section 2: What Matters to you?
  // Col 1: Organic, No artificial additives
  // Col 2: Pesticide free, Hormone free
  const mattersCol1 = [
    { id: 'organic', label: 'Organic', IconComp: OrganicIcon },
    { id: 'no-additives', label: 'No artificial additives', IconComp: NoAdditivesIcon },
  ];

  const mattersCol2 = [
    { id: 'pesticide-free', label: 'Pesticide free', IconComp: PesticideFreeIcon },
    { id: 'hormone-free', label: 'Hormone free', IconComp: HormoneFreeIcon },
  ];

  const toggleEatingStyle = (id: string) => {
    setSelectedEatingStyles(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleMatter = (id: string) => {
    setSelectedMatters(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const hasSelections = selectedEatingStyles.length > 0 || selectedMatters.length > 0;

  const handleNext = () => {
    onNavigate('CustomerPermissions');
  };

  const handleSkip = () => {
    onNavigate('CustomerPermissions');
  };

  const renderItem = (
    item: { id: string; label: string; IconComp: React.ComponentType },
    isSelected: boolean,
    onPress: () => void
  ) => {
    const { IconComp } = item;
    return (
      <TouchableOpacity
        key={item.id}
        activeOpacity={0.7}
        onPress={onPress}
        style={styles.itemWrapper}
      >
        <View style={styles.itemContent}>
          <View style={styles.itemIconWrap}>
            <IconComp />
          </View>
          <Text style={[styles.itemLabel, isSelected && styles.itemLabelActive]}>
            {item.label}
          </Text>
          {isSelected ? (
            <GreenCheckBadge />
          ) : (
            <Text style={styles.plusText}>+</Text>
          )}
        </View>
        <View style={[styles.itemUnderline, isSelected && styles.itemUnderlineActive]} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Edge-to-edge pure white, status bar hidden */}
      <StatusBar hidden={true} />

      {/* ── TOP HEADER: 3-SEGMENT PROGRESS (Green / Green / Green) + SKIP ── */}
      <View style={styles.headerRow}>
        <View style={styles.progressSegmentsWrap}>
          <View style={[styles.progressSegment, styles.progressSegmentActive]} />
          <View style={[styles.progressSegment, styles.progressSegmentActive]} />
          <View style={[styles.progressSegment, styles.progressSegmentActive]} />
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleSkip}
          style={styles.skipButton}
          accessibilityRole="button"
          accessibilityLabel="Skip"
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── MAIN HEADLINE & SUBTITLE ────────────────────────────────────── */}
        <View style={styles.titleBlock}>
          <Text style={styles.editorialTitle}>A Fresh Harvest Is Waiting for You!</Text>
          <Text style={styles.subtitle}>
            Help us personalise your experience with the right{'\n'}products and suggestions.
          </Text>
        </View>

        {/* ── SECTION 1: YOUR EATING STYLE ────────────────────────────────── */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconCircle}>
              <SaladBowlIcon />
            </View>
            <View style={styles.sectionHeaderTextWrap}>
              <Text style={styles.sectionTitle}>Your Eating style</Text>
              <Text style={styles.sectionSubtitle}>Choose everything that fits you.</Text>
            </View>
          </View>

          {/* 2 Equal Columns Grid */}
          <View style={styles.twoColumnGrid}>
            <View style={styles.gridColumn}>
              {eatingStylesCol1.map((item) =>
                renderItem(item, selectedEatingStyles.includes(item.id), () =>
                  toggleEatingStyle(item.id)
                )
              )}
            </View>
            <View style={styles.gridColumn}>
              {eatingStylesCol2.map((item) =>
                renderItem(item, selectedEatingStyles.includes(item.id), () =>
                  toggleEatingStyle(item.id)
                )
              )}
            </View>
          </View>
        </View>

        {/* ── SECTION 2: WHAT MATTERS TO YOU? ─────────────────────────────── */}
        <View style={[styles.sectionContainer, { marginTop: 24 }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconCircle}>
              <ShieldCheckIcon />
            </View>
            <View style={styles.sectionHeaderTextWrap}>
              <Text style={styles.sectionTitle}>What Matters to you?</Text>
              <Text style={styles.sectionSubtitle}>Choose what gives you confidence in a product.</Text>
            </View>
          </View>

          {/* 2 Equal Columns Grid */}
          <View style={styles.twoColumnGrid}>
            <View style={styles.gridColumn}>
              {mattersCol1.map((item) =>
                renderItem(item, selectedMatters.includes(item.id), () =>
                  toggleMatter(item.id)
                )
              )}
            </View>
            <View style={styles.gridColumn}>
              {mattersCol2.map((item) =>
                renderItem(item, selectedMatters.includes(item.id), () =>
                  toggleMatter(item.id)
                )
              )}
            </View>
          </View>
        </View>

        {/* ── BOTTOM ACTION BUTTON: GREY WHEN 0 SELECTIONS, SOLID GREEN WHEN CLICKED ── */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleNext}
            style={[
              styles.circularButton,
              hasSelections ? styles.circularButtonActive : styles.circularButtonDisabled,
              hasSelections && customerShadow.raised,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Proceed to permissions"
          >
            <ArrowRightFigmaIcon size={24} color={hasSelections ? '#FFFFFF' : '#9CA3AF'} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: customerSpacing[24],
    paddingTop: Platform.OS === 'android' ? 24 : 16,
    paddingBottom: 16,
  },
  progressSegmentsWrap: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
    maxWidth: 240,
  },
  progressSegment: {
    height: 4,
    flex: 1,
    borderRadius: 2,
  },
  progressSegmentActive: {
    backgroundColor: customerColors.brand,
  },
  skipButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  skipText: {
    fontFamily: customerFonts.semibold,
    fontSize: 15,
    color: customerColors.body,
  },
  scrollContent: {
    paddingHorizontal: customerSpacing[20],
    paddingTop: 16,
    paddingBottom: 48,
  },
  titleBlock: {
    alignItems: 'center',
    marginBottom: 24,
  },
  editorialTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 26,
    lineHeight: 34,
    color: '#1F2937',
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: customerFonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 16,
  },
  sectionContainer: {
    width: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sectionHeaderTextWrap: {
    flex: 1,
  },
  sectionTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 18,
    color: '#1F2937',
  },
  sectionSubtitle: {
    fontFamily: customerFonts.regular,
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  twoColumnGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 16,
  },
  gridColumn: {
    flex: 1,
  },
  itemWrapper: {
    marginBottom: 14,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  itemIconWrap: {
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  itemLabel: {
    fontFamily: customerFonts.regular,
    fontSize: 13,
    color: '#374151',
    flex: 1,
  },
  itemLabelActive: {
    fontFamily: customerFonts.bold,
    color: customerColors.brand,
  },
  plusText: {
    fontFamily: customerFonts.regular,
    fontSize: 18,
    lineHeight: 20,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  itemUnderline: {
    height: 1.5,
    backgroundColor: '#E5E7EB',
    width: '100%',
    marginTop: 4,
  },
  itemUnderlineActive: {
    backgroundColor: customerColors.brand,
    height: 2,
  },
  buttonContainer: {
    marginTop: 36,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  circularButtonActive: {
    backgroundColor: customerColors.brand,
  },
  arrowText: {
    color: '#FFFFFF',
    fontSize: 26,
    lineHeight: 28,
    fontWeight: '700',
  },
});
