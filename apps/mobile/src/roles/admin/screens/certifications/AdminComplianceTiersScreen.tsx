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
import Svg, { Path } from 'react-native-svg';
import { Icon } from '@tohfa/mobile-ui';

const P = {
  bg: '#FAF8F5',
  cardBg: '#FFFFFF',
  cardBorder: '#F2ECE4',
  ink: '#1A1412',
  titleBrown: '#662208',
  subtitle: '#827871',
  textSecondary: '#6B6560',
  tierGreenDot: '#1B5E20',
  tierBlueDot: '#0D47A1',
  tierAmberDot: '#8D4F00',
  tierRedDot: '#D32F2F',
  greenBadgeBg: '#E8F5E9',
  greenBadgeText: '#2E7D32',
  redBadgeBg: '#FFEBEE',
  redBadgeText: '#D32F2F',
};

const TIERS = [
  {
    title: 'Excellent — 750+',
    sub: 'Full compliance, no restrictions',
    count: '612',
    pct: '48%',
    dotColor: P.tierGreenDot,
  },
  {
    title: 'Good — 700-749',
    sub: 'Standard standing',
    count: '401',
    pct: '31%',
    dotColor: P.tierBlueDot,
  },
  {
    title: 'Moderate — 650-700',
    sub: 'Improvement recommended',
    count: '198',
    pct: '15%',
    dotColor: P.tierAmberDot,
  },
  {
    title: 'Poor — Below 650',
    sub: 'Compliance action required',
    count: '73',
    pct: '6%',
    dotColor: P.tierRedDot,
  },
];

interface Props {
  onBack: () => void;
}

export const AdminComplianceTiersScreen: React.FC<Props> = ({ onBack }) => {
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
        {/* Title & Subtitle */}
        <Text style={styles.title}>Compliance Tiers</Text>
        <Text style={styles.subtitle}>1,284 farms classified by audit score</Text>

        {/* 4 Compliance Tier Cards */}
        <View style={styles.tiersList}>
          {TIERS.map((tier, idx) => (
            <View key={idx} style={styles.tierCard}>
              <View style={[styles.tierDotSquare, { backgroundColor: tier.dotColor }]} />
              <View style={styles.tierInfo}>
                <Text style={styles.tierTitle}>{tier.title}</Text>
                <Text style={styles.tierSub}>{tier.sub}</Text>
              </View>
              <View style={styles.tierStats}>
                <Text style={styles.tierCount}>{tier.count}</Text>
                <Text style={styles.tierPct}>{tier.pct}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Section Heading */}
        <Text style={styles.sectionHeading}>Quarterly audit compliance</Text>

        {/* 2 Metric Cards */}
        <View style={styles.metricsRow}>
          {/* Card 1: 94% Audited This Quarter */}
          <View style={styles.metricCard}>
            <View style={[styles.metricIconBox, { backgroundColor: P.greenBadgeBg }]}>
              <Icon name="check" size={18} color={P.greenBadgeText} />
            </View>
            <Text style={styles.metricValue}>94%</Text>
            <Text style={styles.metricLabel}>Audited This Quarter</Text>
          </View>

          {/* Card 2: 7 Overdue Audits */}
          <View style={styles.metricCard}>
            <View style={[styles.metricIconBox, { backgroundColor: P.redBadgeBg }]}>
              <Icon name="shield" size={18} color={P.redBadgeText} />
            </View>
            <Text style={styles.metricValue}>7</Text>
            <Text style={styles.metricLabel}>Overdue Audits</Text>
          </View>
        </View>

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
    paddingTop: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: P.titleBrown,
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13.5,
    lineHeight: 19,
    color: P.subtitle,
    marginBottom: 20,
  },
  tiersList: {
    gap: 12,
    marginBottom: 24,
  },
  tierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.cardBorder,
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  tierDotSquare: {
    width: 18,
    height: 18,
    borderRadius: 5,
    marginRight: 14,
  },
  tierInfo: {
    flex: 1,
  },
  tierTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: P.ink,
    marginBottom: 3,
  },
  tierSub: {
    fontSize: 12,
    color: P.subtitle,
  },
  tierStats: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  tierCount: {
    fontSize: 16,
    fontWeight: '800',
    color: P.ink,
  },
  tierPct: {
    fontSize: 12,
    color: P.subtitle,
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: P.titleBrown,
    marginBottom: 14,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: P.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.cardBorder,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  metricIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800',
    color: P.ink,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: P.subtitle,
    fontWeight: '500',
  },
});
