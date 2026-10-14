import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { adminColors } from '../../theme';

// ─── Theme Colors ────────────────────────────────────────────────────────────
const THEME = {
  headerBg: adminColors.brand, // Matches Purchases screen & theme primary (#F0562A)
  white: adminColors.onBrand,
  canvas: adminColors.canvas,
  card: adminColors.card,
  border: adminColors.border,
  ink: adminColors.ink,
  muted: adminColors.muted,
  labelMuted: '#78716C',
  brandOrange: adminColors.brand,
  titleRustDark: adminColors.brandDeep,
  redText: adminColors.danger.text,
  amberText: adminColors.warning.text,
  greenText: adminColors.success.text,
  divider: '#F3ECE4',
};

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

export interface IssueItem {
  id: string;
  category: string;
  title: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  farmerName?: string;
  relatedRecord?: string;
  relatedRecordId?: string;
  description?: string;
  created?: string;
}

export interface FarmerIssuesScreenProps {
  farmerName?: string;
  farmerId?: string;
  onBack: () => void;
}

export function FarmerIssuesScreen({
  farmerName = 'Ramesh Kumar',
  farmerId = 'FR-00124',
  onBack,
}: FarmerIssuesScreenProps) {
  const [selectedIssue, setSelectedIssue] = useState<IssueItem | null>(null);

  const issues: IssueItem[] = [
    {
      id: 'ISS-00125',
      category: 'Produce Listing Issue',
      title: 'Produce Listing Issue',
      status: 'Open',
      farmerName: farmerName || 'Ramesh Kumar',
      relatedRecord: 'Tomato — Grade 1 listing',
      relatedRecordId: 'PL-001245',
      description: 'Farmer reported a discrepancy in listed quantity.',
      created: '28 Sep 2026',
    },
    {
      id: 'ISS-00118',
      category: 'Certification Verification',
      title: 'Certification Verification Query',
      status: 'In Progress',
      farmerName: farmerName || 'Ramesh Kumar',
      relatedRecord: 'PGS Organic Certificate',
      relatedRecordId: 'DOC-00125',
      description: 'Discrepancy in renewal date verification on uploaded certificate.',
      created: '15 Sep 2026',
    },
  ];

  // ─── IF AN ISSUE IS SELECTED: SHOW ISSUE DETAIL (Image 1) ───
  if (selectedIssue) {
    return (
      <SafeAreaView style={styles.detailRoot}>
        <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

        {/* ─── Header: ← Issue Detail (Image 1) ─── */}
        <View style={styles.detailHeader}>
          <TouchableOpacity
            style={styles.detailBackBtn}
            onPress={() => setSelectedIssue(null)}
            activeOpacity={0.7}
            accessibilityLabel="Back to Issues"
          >
            <BackArrowIcon size={22} color={THEME.white} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.detailHeaderTitle}>Issue Detail</Text>
            <Text style={styles.detailHeaderSub}>
              {selectedIssue.farmerName || farmerName} · {farmerId}
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.detailScrollPad}
          showsVerticalScrollIndicator={false}
        >
          {/* Issue Detail Card (Image 1) */}
          <View style={styles.issueDetailCard}>
            {/* Row 1: Issue ID & Category */}
            <View style={styles.detailRow}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Issue ID</Text>
                <Text style={styles.detailValBold}>{selectedIssue.id}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Category</Text>
                <Text style={styles.detailValBold}>{selectedIssue.category}</Text>
              </View>
            </View>

            {/* Row 2: Farmer & Status */}
            <View style={[styles.detailRow, { marginTop: 16 }]}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Farmer</Text>
                <Text style={styles.detailValBold}>
                  {selectedIssue.farmerName || farmerName}
                </Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Status</Text>
                <Text style={styles.detailValBold}>{selectedIssue.status}</Text>
              </View>
            </View>

            {/* Row 3: Related Record */}
            <View style={{ marginTop: 16 }}>
              <Text style={styles.detailLabel}>Related Record</Text>
              <Text style={styles.detailValBold}>
                {selectedIssue.relatedRecord || 'Tomato — Grade 1 listing'}
              </Text>
            </View>

            {/* Row 4: Description */}
            <View style={{ marginTop: 16 }}>
              <Text style={styles.detailLabel}>Description</Text>
              <Text style={styles.detailDescText}>
                {selectedIssue.description || 'Farmer reported a discrepancy in listed quantity.'}
              </Text>
            </View>

            {/* Row 5: Created */}
            <View style={{ marginTop: 16 }}>
              <Text style={styles.detailLabel}>Created</Text>
              <Text style={styles.detailValBold}>
                {selectedIssue.created || '28 Sep 2026'}
              </Text>
            </View>
          </View>

          {/* User requested: "remove this two buttons" -> Buttons removed! */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── MAIN ISSUES LIST (Mockup 3) ───
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

      {/* Header: ← Farmer Issues (Mockup 3) */}
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
          <Text style={styles.headerTitle}>Farmer Issues</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* 3 KPI Cards Row: OPEN, IN PROGRESS, RESOLVED (Mockup 3) */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>OPEN</Text>
            <Text style={styles.kpiValueRed}>02</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>IN PROGRESS</Text>
            <Text style={styles.kpiValueAmber}>01</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>RESOLVED</Text>
            <Text style={styles.kpiValueGreen}>08</Text>
          </View>
        </View>

        {/* Issue Card Matching Mockup 3 */}
        {issues.map((iss) => (
          <TouchableOpacity
            key={iss.id}
            style={styles.issueItemCard}
            onPress={() => setSelectedIssue(iss)}
            activeOpacity={0.8}
          >
            <Text style={styles.issueTitle}>{iss.title}</Text>
            <View style={styles.issueDivider} />
            <View style={styles.issueFooterRow}>
              <Text style={styles.issueIdText}>{iss.id}</Text>
              <Text style={styles.issueStatusText}>{iss.status}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

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

  // 3 KPI Cards
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: THEME.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  kpiLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: THEME.labelMuted,
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  kpiValueRed: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.redText,
  },
  kpiValueAmber: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.amberText,
  },
  kpiValueGreen: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.greenText,
  },

  // Issue Card
  issueItemCard: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  issueTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.ink,
  },
  issueDivider: {
    height: 1,
    backgroundColor: THEME.divider,
    marginVertical: 12,
  },
  issueFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  issueIdText: {
    fontSize: 12.5,
    color: THEME.labelMuted,
  },
  issueStatusText: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.amberText,
  },

  // ─── Detail View (Image 1) ───
  detailRoot: {
    flex: 1,
    backgroundColor: THEME.canvas,
  },
  detailHeader: {
    backgroundColor: THEME.headerBg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    gap: 12,
  },
  detailBackBtn: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.white,
    letterSpacing: -0.2,
  },
  detailHeaderSub: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  detailScrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  issueDetailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: THEME.labelMuted,
    marginBottom: 4,
  },
  detailValBold: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  detailDescText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    lineHeight: 20,
  },
  outlineActionBtn: {
    height: 48,
    backgroundColor: '#FAF7F2',
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineActionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.titleRustDark,
  },
});
