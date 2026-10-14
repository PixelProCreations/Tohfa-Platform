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
import { Icon } from '@tohfa/mobile-ui';
import type { FarmerListItem } from './AdminAllFarmersScreen';

const P = {
  bg: '#FAF8F5',
  cardBg: '#FFFFFF',
  cardBorder: '#F2ECE4',
  ink: '#1A1412',
  titleBrown: '#662208',
  subtitle: '#827871',
  orange: '#F0562A',
  amberDark: '#9C5808',
  progressBarBg: '#EFE7DE',
  barOrange: '#F0562A',
  barAmber: '#8C5E24',
  tipCardBorder: '#E0AA3E',
  tipBg: '#FFFFFF',
};

const CATEGORIES = [
  { name: 'Soil Health', score: 88, max: 100, color: P.barOrange },
  { name: 'Water\nManagement', score: 82, max: 100, color: P.barOrange },
  { name: 'Pest & Disease', score: 75, max: 100, color: P.barAmber },
  { name: 'Biodiversity', score: 80, max: 100, color: P.barOrange },
  { name: 'Record Keeping', score: 76, max: 100, color: P.barOrange },
  { name: 'Compliance\nHistory', score: 81, max: 100, color: P.barOrange },
];

interface Props {
  farmer: FarmerListItem;
  onBack: () => void;
  onOpenComplianceTiers: () => void;
  onEditCategories?: () => void;
}

export const AdminRatingScorecardScreen: React.FC<Props> = ({
  farmer,
  onBack,
  onOpenComplianceTiers,
  onEditCategories,
}) => {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={P.bg} />

      {/* Header with Back button */}
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
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Score Ring Gauge (Clickable) */}
        <TouchableOpacity
          style={styles.gaugeContainer}
          activeOpacity={0.8}
          onPress={onOpenComplianceTiers}
          accessibilityRole="button"
          accessibilityLabel="View compliance tiers"
        >
          <View style={styles.ringWrapper}>
            <Svg width={150} height={150} viewBox="0 0 150 150">
              {/* Background Track Circle */}
              <Circle
                cx={75}
                cy={75}
                r={60}
                stroke={P.progressBarBg}
                strokeWidth={14}
                fill="none"
              />
              {/* Active Orange Arc ~78% */}
              <Circle
                cx={75}
                cy={75}
                r={60}
                stroke={P.orange}
                strokeWidth={14}
                strokeDasharray={`${2 * Math.PI * 60 * 0.782} ${2 * Math.PI * 60 * 0.218}`}
                strokeDashoffset={2 * Math.PI * 60 * 0.25}
                strokeLinecap="round"
                fill="none"
              />
            </Svg>

            <View style={styles.scoreTextWrapper}>
              <Text style={styles.scoreNumber}>{farmer.rating ?? 782}</Text>
              <Text style={styles.scoreDenominator}>/ 1000</Text>
            </View>
          </View>

          {/* Tier Capsule */}
          <View style={styles.tierCapsule}>
            <Text style={styles.tierCapsuleText}>
              {farmer.ratingTier ?? 'Excellent Tier'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Farmer Code & Categories Subtitle */}
        <Text style={styles.metaSubtitle}>
          {farmer.name} · {farmer.code} · 10 categories × 100 pts
        </Text>

        {/* 6 Category Progress Bars */}
        <View style={styles.categoriesList}>
          {CATEGORIES.map((cat, index) => (
            <View key={index} style={styles.categoryRow}>
              <Text style={styles.categoryName}>{cat.name}</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${cat.score}%`,
                      backgroundColor: cat.color,
                    },
                  ]}
                />
              </View>
              <Text style={styles.categoryScore}>{cat.score}/100</Text>
            </View>
          ))}
        </View>

        {/* Improvement suggestions */}
        <Text style={styles.suggestionsHeading}>Improvement suggestions</Text>

        <View style={styles.tipCard}>
          <View style={styles.tipIconColumn}>
            <Icon name="lightbulb" size={20} color={P.amberDark} />
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>
              Pest & Disease Control is your lowest category
            </Text>
            <Text style={styles.tipDescription}>
              Consider more frequent pest log entries to improve tracking consistency.
            </Text>
          </View>
        </View>

        {/* Edit All Categories Button */}
        <TouchableOpacity
          style={styles.editBtn}
          activeOpacity={0.85}
          onPress={onEditCategories}
        >
          <Icon name="edit" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.editBtnText}>Edit All Categories</Text>
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
    cursor: 'pointer' as any,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 12,
    cursor: 'pointer' as any,
  },
  ringWrapper: {
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  scoreTextWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: P.ink,
    letterSpacing: -0.5,
  },
  scoreDenominator: {
    fontSize: 12,
    fontWeight: '600',
    color: P.subtitle,
    marginTop: 2,
  },
  tierCapsule: {
    backgroundColor: P.orange,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginTop: 12,
  },
  tierCapsuleText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  metaSubtitle: {
    fontSize: 13,
    color: P.subtitle,
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 20,
  },
  categoriesList: {
    gap: 16,
    marginBottom: 24,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryName: {
    width: 105,
    fontSize: 13,
    fontWeight: '600',
    color: P.ink,
    lineHeight: 16,
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: P.progressBarBg,
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  categoryScore: {
    width: 50,
    fontSize: 12.5,
    fontWeight: '700',
    color: P.subtitle,
    textAlign: 'right',
  },
  suggestionsHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: P.titleBrown,
    marginBottom: 12,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: P.tipBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0ECE4',
    borderLeftWidth: 4,
    borderLeftColor: P.tipCardBorder,
    padding: 14,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  tipIconColumn: {
    marginRight: 10,
    marginTop: 1,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: P.ink,
    marginBottom: 4,
    lineHeight: 18,
  },
  tipDescription: {
    fontSize: 12.5,
    lineHeight: 17,
    color: P.subtitle,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.orange,
    borderRadius: 16,
    height: 52,
    shadowColor: P.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
    cursor: 'pointer' as any,
  },
  editBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
