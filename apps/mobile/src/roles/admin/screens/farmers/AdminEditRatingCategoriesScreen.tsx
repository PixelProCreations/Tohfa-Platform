import React, { useState } from 'react';
import {
  Alert,
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
import type { FarmerListItem } from './AdminAllFarmersScreen';

const P = {
  bg: '#FAF8F5',
  cardBg: '#FFFFFF',
  cardBorder: '#F2ECE4',
  ink: '#1A1412',
  titleBrown: '#662208',
  subtitle: '#827871',
  orange: '#F0562A',
  orangeBg: '#FFECE8',
  textSecondary: '#6B6560',
  inputBorder: '#E0DDD7',
  greenBg: '#E8F5E9',
  greenText: '#2E7D32',
  amberBg: '#FFF3E0',
  amberText: '#B25E00',
  redBg: '#FFEBEE',
  redText: '#D32F2F',
  barTrack: '#EFE7DE',
};

export interface RatingCategoryState {
  id: string;
  name: string;
  sub: string;
  score: number;
  max: number;
}

const INITIAL_CATEGORIES: RatingCategoryState[] = [
  { id: 'soil', name: 'Soil Health', sub: 'Organic matter, soil pH & nutrient index', score: 88, max: 100 },
  { id: 'water', name: 'Water Management', sub: 'Micro-drip irrigation & rainwater harvesting', score: 82, max: 100 },
  { id: 'pest', name: 'Pest & Disease Control', sub: 'Bio-pesticides & trap crop barrier compliance', score: 75, max: 100 },
  { id: 'bio', name: 'Biodiversity', sub: 'Native tree cover & pollinator corridor index', score: 80, max: 100 },
  { id: 'record', name: 'Record Keeping', sub: 'Farm diary digital logs & batch harvest records', score: 76, max: 100 },
  { id: 'compliance', name: 'Compliance History', sub: 'Quarterly audit clearance & organic cert validity', score: 81, max: 100 },
  { id: 'postharvest', name: 'Post-Harvest Handling', sub: 'Grading standard, sanitized crates & transport packing', score: 72, max: 100 },
  { id: 'energy', name: 'Energy & Waste', sub: 'On-farm biomass composting & solar pump adoption', score: 79, max: 100 },
  { id: 'welfare', name: 'Worker Welfare', sub: 'Fair wage record, safety protective gear & clean water', score: 85, max: 100 },
  { id: 'market', name: 'Market Linkage', sub: 'Direct Mandi delivery reliability & zero rejection history', score: 80, max: 100 },
];

interface Props {
  farmer: FarmerListItem;
  onBack: () => void;
  onSave?: (totalScore: number, tier: string, categories: RatingCategoryState[]) => void;
}

export const AdminEditRatingCategoriesScreen: React.FC<Props> = ({
  farmer,
  onBack,
  onSave,
}) => {
  const [categories, setCategories] = useState<RatingCategoryState[]>(INITIAL_CATEGORIES);

  const totalScore = categories.reduce((sum, c) => sum + c.score, 0);

  const getTier = (score: number) => {
    if (score >= 750) return { label: 'Excellent Tier', bg: P.greenBg, text: P.greenText };
    if (score >= 700) return { label: 'Good Tier', bg: P.amberBg, text: P.amberText };
    if (score >= 650) return { label: 'Moderate Tier', bg: '#F5EBE1', text: '#8D4F00' };
    return { label: 'Poor Tier', bg: P.redBg, text: P.redText };
  };

  const tier = getTier(totalScore);

  const updateScore = (id: string, delta: number) => {
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const next = Math.max(0, Math.min(100, c.score + delta));
          return { ...c, score: next };
        }
        return c;
      })
    );
  };

  const setExplicitScore = (id: string, val: string) => {
    const num = parseInt(val, 10);
    const valid = isNaN(num) ? 0 : Math.max(0, Math.min(100, num));
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, score: valid } : c))
    );
  };

  const handleSave = () => {
    if (onSave) {
      onSave(totalScore, tier.label, categories);
    }
    Alert.alert('Scorecard Saved', `Updated rating score for ${farmer.name} to ${totalScore}/1000 (${tier.label}).`);
    onBack();
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={P.bg} />

      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 19L8 12L15 5"
              stroke="#2B2523"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.headerTitle}>Edit All Categories</Text>
          <Text style={styles.headerSub}>{farmer.name} · {farmer.code}</Text>
        </View>

        <TouchableOpacity style={styles.saveHeaderBtn} onPress={handleSave} activeOpacity={0.8}>
          <Text style={styles.saveHeaderBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Total Score Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryLeft}>
            <Text style={styles.summaryLabel}>Total Weighted Score</Text>
            <View style={styles.scoreRow}>
              <Text style={styles.totalScoreNumber}>{totalScore}</Text>
              <Text style={styles.totalScoreDenominator}>/ 1000</Text>
            </View>
            <View style={[styles.tierCapsule, { backgroundColor: tier.bg }]}>
              <Text style={[styles.tierCapsuleText, { color: tier.text }]}>★ {tier.label}</Text>
            </View>
          </View>

          {/* Mini circular progress meter */}
          <View style={styles.gaugeBox}>
            <Svg width={80} height={80} viewBox="0 0 80 80">
              <Circle cx={40} cy={40} r={32} stroke="#EFE7DE" strokeWidth={8} fill="none" />
              <Circle
                cx={40}
                cy={40}
                r={32}
                stroke={P.orange}
                strokeWidth={8}
                strokeDasharray={`${2 * Math.PI * 32 * (totalScore / 1000)} ${2 * Math.PI * 32}`}
                strokeDashoffset={2 * Math.PI * 32 * 0.25}
                strokeLinecap="round"
                fill="none"
              />
            </Svg>
            <Text style={styles.gaugePctText}>{Math.round((totalScore / 1000) * 100)}%</Text>
          </View>
        </View>

        {/* 10 Categories List */}
        <Text style={styles.sectionHeading}>10 Evaluation Categories (Max 100 pts each)</Text>

        {categories.map((cat, idx) => (
          <View key={cat.id} style={styles.categoryCard}>
            <View style={styles.cardTopRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.catName}>
                  {idx + 1}. {cat.name}
                </Text>
                <Text style={styles.catSub}>{cat.sub}</Text>
              </View>

              {/* Score Stepper */}
              <View style={styles.stepperContainer}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => updateScore(cat.id, -5)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.stepBtnText}>−</Text>
                </TouchableOpacity>

                <TextInput
                  style={styles.scoreInput}
                  value={String(cat.score)}
                  onChangeText={(val) => setExplicitScore(cat.id, val)}
                  keyboardType="numeric"
                  maxLength={3}
                />

                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => updateScore(cat.id, 5)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Visual Progress Bar */}
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${cat.score}%`,
                    backgroundColor: cat.score >= 80 ? P.orange : cat.score >= 70 ? P.amberText : P.redText,
                  },
                ]}
              />
            </View>
          </View>
        ))}

        {/* Bottom Save Action Button */}
        <TouchableOpacity style={styles.saveBottomBtn} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveBottomBtnText}>Save All Category Changes</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: P.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EFE7DE',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: P.titleBrown,
  },
  headerSub: {
    fontSize: 12,
    color: P.subtitle,
    marginTop: 2,
  },
  saveHeaderBtn: {
    backgroundColor: P.orange,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
  },
  saveHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  summaryCard: {
    backgroundColor: P.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.cardBorder,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryLeft: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12.5,
    color: P.subtitle,
    fontWeight: '600',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
    marginBottom: 8,
  },
  totalScoreNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: P.ink,
  },
  totalScoreDenominator: {
    fontSize: 15,
    fontWeight: '600',
    color: P.subtitle,
    marginLeft: 4,
  },
  tierCapsule: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  tierCapsuleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  gaugeBox: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugePctText: {
    position: 'absolute',
    fontSize: 14,
    fontWeight: '800',
    color: P.ink,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: P.titleBrown,
    marginBottom: 12,
  },
  categoryCard: {
    backgroundColor: P.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.cardBorder,
    padding: 14,
    marginBottom: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  catName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: P.ink,
  },
  catSub: {
    fontSize: 11.5,
    color: P.subtitle,
    marginTop: 2,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.inputBorder,
    padding: 3,
    marginLeft: 10,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EFE7DE',
  },
  stepBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: P.ink,
    lineHeight: 20,
  },
  scoreInput: {
    width: 44,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
    color: P.ink,
    paddingVertical: 2,
  },
  barTrack: {
    height: 6,
    backgroundColor: P.barTrack,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  saveBottomBtn: {
    backgroundColor: P.orange,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: P.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  saveBottomBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
