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
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { authPalette as P, colors } from '../../theme';

// ── Icons ────────────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = P.deepGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function InfoCircleIcon({ size = 15, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Line x1="12" y1="8" x2="12" y2="8.01" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      <Line x1="12" y1="11" x2="12" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export interface WeatherRiskAnalyticsScreenProps {
  onBack?: () => void;
}

export function WeatherRiskAnalyticsScreen({ onBack }: WeatherRiskAnalyticsScreenProps): React.JSX.Element {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ArrowBackIcon size={20} color={P.deepGreen} />
          </TouchableOpacity>

          <View style={styles.headerTitleCol}>
            <Text style={styles.headerCodeBadge}>FR-F07-E</Text>
            <Text style={styles.headerTitle}>Weather Risk & Analytics</Text>
            <Text style={styles.headerSubtitle}>Seasonal risk trends & treatments</Text>
          </View>
        </View>

        {/* ── Card 1: Weather Risk Note ── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>WEATHER RISK NOTE</Text>
          <Text style={styles.riskNoteBody}>
            High humidity recorded this week — increased fungal risk for leafy crops. This is a reference note maintained by TOHFA Admin, not an automated alert.
          </Text>
        </View>

        {/* ── Card 2: Detections by Season (This Year) ── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>DETECTIONS BY SEASON (THIS YEAR)</Text>

          <View style={styles.seasonRow}>
            <Text style={styles.seasonName}>Monsoon</Text>
            <Text style={styles.seasonCount}>6</Text>
          </View>

          <View style={styles.seasonRow}>
            <Text style={styles.seasonName}>Summer</Text>
            <Text style={styles.seasonCount}>4</Text>
          </View>

          <View style={[styles.seasonRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.seasonName}>Winter</Text>
            <Text style={styles.seasonCount}>1</Text>
          </View>
        </View>

        {/* ── Card 3: Most Affected Crops ── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>MOST AFFECTED CROPS</Text>
          <View style={styles.cropsPillsRow}>
            <View style={styles.cropPill}>
              <Text style={styles.cropPillText}>Carrot (5)</Text>
            </View>
            <View style={styles.cropPill}>
              <Text style={styles.cropPillText}>Beetroot (3)</Text>
            </View>
            <View style={styles.cropPill}>
              <Text style={styles.cropPillText}>Cabbage (3)</Text>
            </View>
          </View>
        </View>

        {/* ── Card 4: Treatment Effectiveness (Farmer-Logged) ── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>TREATMENT EFFECTIVENESS (FARMER-LOGGED)</Text>

          {/* Item 1 */}
          <View style={styles.treatmentItem}>
            <Text style={styles.treatmentName}>Neem Oil Spray</Text>
            <Text style={styles.treatmentSub}>Used 6 times · noted effective in 5</Text>
          </View>

          <View style={styles.divider} />

          {/* Item 2 */}
          <View style={styles.treatmentItem}>
            <Text style={styles.treatmentName}>Ladybird Release</Text>
            <Text style={styles.treatmentSub}>Used 2 times · noted effective in 2</Text>
          </View>

          {/* Disclaimer Note */}
          <View style={styles.disclaimerRow}>
            <InfoCircleIcon size={14} color={P.twGray400} />
            <Text style={styles.disclaimerText}>
              Effectiveness is farmer-noted at resolution time, not measured automatically.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: P.lightSurfaceAlt,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitleCol: {
    marginLeft: 14,
  },
  headerCodeBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: P.twGray400,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: P.deepGreen,
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: P.twGray500,
    marginTop: 2,
  },

  // Cards
  card: {
    backgroundColor: P.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: P.twGray100,
    marginBottom: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: P.twGray400,
    marginBottom: 12,
  },
  riskNoteBody: {
    fontSize: 13.5,
    color: P.twGray700,
    lineHeight: 20,
  },

  // Season Breakdown
  seasonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  seasonName: {
    fontSize: 14,
    color: P.twGray700,
    fontWeight: '600',
  },
  seasonCount: {
    fontSize: 14,
    fontWeight: '800',
    color: P.deepGreen,
    backgroundColor: P.twGray100,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 8,
  },

  // Crops Pills
  cropsPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cropPill: {
    backgroundColor: P.twGreen50,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  cropPillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: P.twGreen800,
  },

  // Treatments
  treatmentItem: {
    paddingVertical: 4,
  },
  treatmentName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: P.nearBlack,
    marginBottom: 3,
  },
  treatmentSub: {
    fontSize: 12,
    color: P.twGray500,
  },
  divider: {
    height: 1,
    backgroundColor: P.twGray100,
    marginVertical: 10,
  },
  disclaimerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 14,
    paddingTop: 10,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11.5,
    color: P.twGray400,
    lineHeight: 16,
  },
});
