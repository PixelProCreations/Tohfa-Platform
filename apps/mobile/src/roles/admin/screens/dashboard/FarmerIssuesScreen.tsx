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
import { adminColors, adminRadius, adminSpacing, adminType } from '../../theme';
import { t } from '../../i18n';

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
  farmerName = '',
  farmerId = '',
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

  // ─── IF AN ISSUE IS SELECTED: SHOW ISSUE DETAIL ───
  if (selectedIssue) {
    return (
      <SafeAreaView style={styles.detailRoot}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Header: ← Issue Detail */}
        <View style={styles.detailHeader}>
          <TouchableOpacity
            style={styles.detailBackBtn}
            onPress={() => setSelectedIssue(null)}
            activeOpacity={0.7}
            accessibilityLabel="Back to Issues"
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.detailHeaderTitle}>{t('farmerIssues.detail.title')}</Text>
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
          {/* Issue Detail Card */}
          <View style={styles.issueDetailCard}>
            {/* Row 1: Issue ID & Category */}
            <View style={styles.detailRow}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>{t('farmerIssues.detail.issueId')}</Text>
                <Text style={styles.detailValBold}>{selectedIssue.id}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>{t('farmerIssues.detail.category')}</Text>
                <Text style={styles.detailValBold}>{selectedIssue.category}</Text>
              </View>
            </View>

            {/* Row 2: Farmer & Status */}
            <View style={[styles.detailRow, styles.rowSpacing]}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>{t('farmerIssues.detail.farmer')}</Text>
                <Text style={styles.detailValBold}>
                  {selectedIssue.farmerName || farmerName}
                </Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>{t('farmerIssues.detail.status')}</Text>
                <Text style={styles.detailValBold}>{selectedIssue.status}</Text>
              </View>
            </View>

            {/* Row 3: Related Record */}
            <View style={styles.rowSpacing}>
              <Text style={styles.detailLabel}>{t('farmerIssues.detail.relatedRecord')}</Text>
              <Text style={styles.detailValBold}>
                {selectedIssue.relatedRecord || 'Tomato — Grade 1 listing'}
              </Text>
            </View>

            {/* Row 4: Description */}
            <View style={styles.rowSpacing}>
              <Text style={styles.detailLabel}>{t('farmerIssues.detail.description')}</Text>
              <Text style={styles.detailDescText}>
                {selectedIssue.description || 'Farmer reported a discrepancy in listed quantity.'}
              </Text>
            </View>

            {/* Row 5: Created */}
            <View style={styles.rowSpacing}>
              <Text style={styles.detailLabel}>{t('farmerIssues.detail.created')}</Text>
              <Text style={styles.detailValBold}>
                {selectedIssue.created || '28 Sep 2026'}
              </Text>
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── MAIN ISSUES LIST ───
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header: ← Farmer Issues */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={24} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('farmerIssues.title')}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* 3 KPI Cards Row: OPEN, IN PROGRESS, RESOLVED */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>{t('farmerIssues.kpi.open')}</Text>
            <Text style={styles.kpiValueRed}>02</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>{t('farmerIssues.kpi.inProgress')}</Text>
            <Text style={styles.kpiValueAmber}>01</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>{t('farmerIssues.kpi.resolved')}</Text>
            <Text style={styles.kpiValueGreen}>08</Text>
          </View>
        </View>

        {/* Issue Card Matching Mockup */}
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

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.2,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xxl,
  },

  // 3 KPI Cards
  kpiRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.lg,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
  },
  kpiLabel: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.muted,
    letterSpacing: 0.3,
    marginBottom: adminSpacing.xs,
  },
  kpiValueRed: {
    ...adminType.rowTitle,
    color: adminColors.danger.text,
  },
  kpiValueAmber: {
    ...adminType.rowTitle,
    color: adminColors.warning.text,
  },
  kpiValueGreen: {
    ...adminType.rowTitle,
    color: adminColors.success.text,
  },

  // Issue Card
  issueItemCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  issueTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  issueDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: adminSpacing.md,
  },
  issueFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  issueIdText: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  issueStatusText: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.warning.text,
  },

  // Detail View
  detailRoot: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  detailHeader: {
    backgroundColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
    gap: adminSpacing.md,
  },
  headerTitleWrap: {
    flex: 1,
  },
  detailBackBtn: {
    padding: adminSpacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailHeaderTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.2,
  },
  detailHeaderSub: {
    ...adminType.body,
    fontWeight: '500',
    color: adminColors.brandTint,
    marginTop: 2,
  },
  detailScrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xxl,
  },
  issueDetailCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.xl,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowSpacing: {
    marginTop: adminSpacing.lg,
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    ...adminType.caption,
    fontWeight: '500',
    color: adminColors.muted,
    marginBottom: adminSpacing.xs,
  },
  detailValBold: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  detailDescText: {
    ...adminType.body,
    fontWeight: '500',
    color: adminColors.ink,
    lineHeight: 20,
  },
  bottomSpacer: {
    height: adminSpacing.xxl,
  },
});
