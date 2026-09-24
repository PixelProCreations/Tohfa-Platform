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

// ─── Design Tokens ────────────────────────────────────────────────────────────
const PALETTE = {
  titleRust:  '#8E3314', // Terracotta/rust
  orange:     '#E85226', // Vibrant orange
  pageBg:     '#FAF8F5', // Warm light cream
  cardBg:     '#FFFFFF',
  ink:        '#1A1412',
  labelMuted: '#6D6761',
  timeline:   '#E5DFD5', // Vertical connecting line
  greenBg:    '#EAF2E1',
  greenText:  '#2A572D',
};

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AuditHistoryRecord {
  id: string;
  date: string;
  type: string;
  auditor: string;
  title: string;
  violations: string;
}

export interface FarmerAuditHistoryScreenProps {
  farmerName?: string;
  farmId?: string;
  zone?: string;
  records?: AuditHistoryRecord[];
  onBack: () => void;
  onSelectAuditRecord?: (record: AuditHistoryRecord) => void;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const DEFAULT_RECORDS: AuditHistoryRecord[] = [
  {
    id: '1',
    date: 'Sep 14, 2026',
    type: 'Internal',
    auditor: 'Ravi K.',
    title: 'Q3 2026 Audit \u2014 782/1000',
    violations: '0 major violations',
  },
  {
    id: '2',
    date: 'Jun 10, 2026',
    type: 'External',
    auditor: 'AgriCert Co.',
    title: 'Q2 2026 Audit \u2014 754/1000',
    violations: '0 major violations',
  },
  {
    id: '3',
    date: 'Mar 8, 2026',
    type: 'Internal',
    auditor: 'Meena P.',
    title: 'Q1 2026 Audit \u2014 731/1000',
    violations: '0 major violations',
  },
  {
    id: '4',
    date: 'Dec 5, 2025',
    type: 'Internal',
    auditor: 'Ravi K.',
    title: 'Q4 2025 Audit \u2014 705/1000',
    violations: '0 major violations',
  },
];

// ─── Icons ────────────────────────────────────────────────────────────────────
function BackChevronIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 19l-7-7 7-7"
        stroke="#1A1412"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckmarkWhiteIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 13l4 4L19 7"
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TrendingUpIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 6l-9.5 9.5-5-5L1 18"
        stroke={PALETTE.greenText}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M17 6h6v6"
        stroke={PALETTE.greenText}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export function FarmerAuditHistoryScreen({
  farmerName = 'Vijay Anand',
  farmId = '#TOHFA-F-00234',
  records = DEFAULT_RECORDS,
  onBack,
  onSelectAuditRecord,
}: FarmerAuditHistoryScreenProps) {
  const count = records.length;
  const subtitle = `${farmerName} · ${farmId} · ${count} audits on record`;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.pageBg} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation Back Button */}
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          activeOpacity={0.7}
          accessibilityLabel="Go back"
        >
          <BackChevronIcon />
        </TouchableOpacity>

        {/* Title */}
        <Text style={styles.pageTitle}>Audit History</Text>
        <Text style={styles.pageSubtitle}>{subtitle}</Text>

        {/* Timeline List */}
        <View style={styles.timelineContainer}>
          {records.map((item, index) => {
            const isLast = index === records.length - 1;
            const meta = `${item.date} · Auditor: ${item.auditor}`;

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.timelineItem}
                onPress={() => onSelectAuditRecord?.(item)}
                activeOpacity={onSelectAuditRecord ? 0.75 : 1}
              >
                {/* Timeline Column */}
                <View style={styles.timelineCol}>
                  <View style={styles.badge}>
                    <CheckmarkWhiteIcon />
                  </View>
                  {!isLast && <View style={styles.line} />}
                </View>

                {/* Content Column */}
                <View style={[styles.contentCol, !isLast && styles.contentColSpacing]}>
                  <Text style={styles.itemMeta}>{meta}</Text>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemViolations}>{item.violations}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Improvement Trend Banner */}
        <View style={styles.trendBanner}>
          <View style={styles.trendIconWrap}>
            <TrendingUpIcon />
          </View>
          <Text style={styles.trendText}>
            Score has improved every quarter — currently trending toward Excellent tier.
          </Text>
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },

  // Back Button
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: PALETTE.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECE8E1',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 14,
  },
  // Header Titles
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: PALETTE.titleRust,
    marginTop: 18,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  pageSubtitle: {
    fontSize: 13,
    color: PALETTE.labelMuted,
    marginBottom: 28,
    lineHeight: 18,
  },

  // Timeline
  timelineContainer: {
    paddingLeft: 4,
    marginBottom: 24,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  timelineCol: {
    alignItems: 'center',
    width: 28,
    marginRight: 14,
  },
  badge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: PALETTE.orange,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: PALETTE.timeline,
    marginVertical: 4,
  },
  contentCol: {
    flex: 1,
    paddingTop: 2,
  },
  contentColSpacing: {
    paddingBottom: 28,
  },
  itemMeta: {
    fontSize: 12,
    color: PALETTE.labelMuted,
    marginBottom: 3,
  },
  itemTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: PALETTE.ink,
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  itemViolations: {
    fontSize: 12.5,
    color: PALETTE.labelMuted,
  },

  // Trend Banner
  trendBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.greenBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  trendIconWrap: {
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: PALETTE.greenText,
    fontWeight: '500',
  },
});
