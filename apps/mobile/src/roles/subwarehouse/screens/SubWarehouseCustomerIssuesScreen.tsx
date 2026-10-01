import React, { useState } from 'react';
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

// ─── Design Tokens (#F0562A Existing Orange Palette) ─────────────────────────
const PALETTE = {
  primary:       '#F0562A',
  pageBg:        '#F7F5EE',
  cardBg:        '#FFFFFF',
  textInk:       '#1D2420',
  textSecondary: '#7A726C',
  textBody:      '#374151',
  border:        '#F0ECE3',
  amberBadge:    '#FFF0EB',
  amberText:     '#F0562A',
  qualityBg:     '#FFF0EB',
  qualityText:   '#F0562A',
};

// ─── Pure SVG Icons (No Rect or Circle to avoid Hermes runtime errors) ───────

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
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

const CATEGORY_TABS = ['All', 'Quality', 'Quantity', 'Missing', 'Wrong', 'Damaged', 'Late'];

export interface CustomerIssueRecord {
  id: string;
  issueNo: string;
  category: string;
  orderNo: string;
  dateText: string;
  status: 'In Review' | 'Open' | 'Resolved';
}

const SAMPLE_ISSUES: CustomerIssueRecord[] = [
  {
    id: 'iss1',
    issueNo: 'ISSUE-00231',
    category: 'Quality',
    orderNo: 'ORD-00251',
    dateText: '24 Sep 2026',
    status: 'In Review',
  },
];

export interface SubWarehouseCustomerIssuesScreenProps {
  customerName?: string;
  onBack: () => void;
}

export function SubWarehouseCustomerIssuesScreen({
  customerName = 'Rajesh Kumar',
  onBack,
}: SubWarehouseCustomerIssuesScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredIssues = SAMPLE_ISSUES.filter((item) => {
    if (selectedCategory === 'All') return true;
    return item.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Header Banner ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle}>Customer Issues</Text>
            <Text style={styles.headerSubtitle}>{customerName}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 3 Summary Cards in a row ─── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>2</Text>
            <Text style={styles.statLabel}>OPEN</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>1</Text>
            <Text style={styles.statLabel}>IN REVIEW</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>8</Text>
            <Text style={styles.statLabel}>RESOLVED</Text>
          </View>
        </View>

        {/* ─── Category Filter Pills ─── */}
        <View style={styles.categoriesWrap}>
          {CATEGORY_TABS.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.catPill,
                  isSelected ? styles.catPillSelected : styles.catPillUnselected,
                ]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.catPillText,
                    isSelected ? styles.catPillTextSelected : styles.catPillTextUnselected,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── Issue Cards List ─── */}
        {filteredIssues.map((issue) => {
          return (
            <View key={issue.id} style={styles.issueCard}>
              <View style={styles.cardTopRow}>
                <Text style={styles.issueNo}>{issue.issueNo}</Text>
                <View style={styles.reviewBadge}>
                  <Text style={styles.reviewText}>{issue.status}</Text>
                </View>
              </View>

              <View style={styles.tagOrderRow}>
                <View style={styles.qualityTag}>
                  <Text style={styles.qualityText}>{issue.category}</Text>
                </View>
                <Text style={styles.orderRefText}>· Order {issue.orderNo}</Text>
              </View>

              <Text style={styles.dateText}>{issue.dateText}</Text>
            </View>
          );
        })}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  headerBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    paddingRight: 12,
    paddingVertical: 4,
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '400',
    color: '#FFFFFF',
    opacity: 0.95,
    marginTop: 1,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: PALETTE.pageBg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.textInk,
    letterSpacing: -0.2,
  },
  statLabel: {
    fontFamily: 'Poppins',
    fontSize: 9.5,
    fontWeight: '700',
    color: PALETTE.textSecondary,
    marginTop: 2,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  categoriesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  catPill: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    marginBottom: 4,
  },
  catPillSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: PALETTE.primary,
  },
  catPillUnselected: {
    backgroundColor: '#FFFFFF',
    borderColor: PALETTE.border,
  },
  catPillText: {
    fontFamily: 'Poppins',
    fontSize: 12,
  },
  catPillTextSelected: {
    fontWeight: '700',
    color: PALETTE.primary,
  },
  catPillTextUnselected: {
    fontWeight: '400',
    color: PALETTE.textSecondary,
  },
  issueCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderLeftWidth: 4,
    borderLeftColor: PALETTE.primary,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  issueNo: {
    fontFamily: 'Poppins',
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  reviewBadge: {
    backgroundColor: PALETTE.amberBadge,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  reviewText: {
    fontFamily: 'Poppins',
    fontSize: 10.5,
    fontWeight: '700',
    color: PALETTE.amberText,
  },
  tagOrderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    marginBottom: 4,
  },
  qualityTag: {
    backgroundColor: PALETTE.qualityBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  qualityText: {
    fontFamily: 'Poppins',
    fontSize: 10.5,
    fontWeight: '700',
    color: PALETTE.qualityText,
  },
  orderRefText: {
    fontFamily: 'Poppins',
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  dateText: {
    fontFamily: 'Poppins',
    fontSize: 10.5,
    fontWeight: '400',
    color: PALETTE.textSecondary,
    marginTop: 2,
  },
});
