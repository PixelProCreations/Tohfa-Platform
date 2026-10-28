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
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import { type AuditScheduleRecord, INITIAL_SCHEDULE_RECORDS } from './fixtures';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

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

function TimelineDotIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="12" r="4" fill={color} />
    </Svg>
  );
}

function ClipboardIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="17" rx="3" stroke={color} strokeWidth="1.8" />
      <Path d="M9 2h6v3H9z" stroke={color} strokeWidth="1.6" />
      <Line x1="8" y1="11" x2="16" y2="11" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="8" y1="15" x2="13" y2="15" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function CheckboxPendingIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="16" rx="3" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

// ─── Component Props ──────────────────────────────────────────────────────────

export interface FarmerInspectionFindingsScreenProps {
  record?: AuditScheduleRecord | undefined;
  onBack: () => void;
  onNavigateSupportAudit: () => void;
}

export function FarmerInspectionFindingsScreen({
  record: propRecord,
  onBack,
  onNavigateSupportAudit,
}: FarmerInspectionFindingsScreenProps) {
  const record = propRecord ?? INITIAL_SCHEDULE_RECORDS[0]!;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Orange Header ─── */}
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
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Inspection / Findings</Text>
            <Text style={styles.headerSubtitleText}>
              {record.id || 'AUD-2026-0042'} · {record.farmerName || 'Ramesh Kumar'}
            </Text>
          </View>
        </View>
      </View>

      {/* ─── Scrollable Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: Audit Information */}
        <Text style={styles.sectionHeader}>Audit Information</Text>
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.metaLabel}>Audit ID</Text>
              <Text style={styles.metaValueBold}>{record.id || 'AUD-2026-0042'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.metaLabel}>Farm</Text>
              <Text style={styles.metaValueBold}>{record.farm || 'Ooty Farm 01'}</Text>
            </View>
          </View>

          <View style={[styles.twoColRow, { marginTop: 14 }]}>
            <View style={styles.col}>
              <Text style={styles.metaLabel}>Audit Type</Text>
              <Text style={styles.metaValueBold}>{record.type || 'Internal'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.metaLabel}>Date</Text>
              <Text style={styles.metaValueBold}>{record.date || '15 Oct 2026'}</Text>
            </View>
          </View>
        </View>

        {/* Section 2: Checklist Results */}
        <Text style={styles.sectionHeader}>Checklist Results</Text>
        <View style={styles.card}>
          <View style={styles.checklistRow}>
            <Text style={styles.checklistName}>Farm Documentation</Text>
            <View style={styles.completedBadge}>
              <Text style={styles.completedBadgeText}>Completed</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.checklistRow}>
            <Text style={styles.checklistName}>Organic Practices</Text>
            <View style={styles.completedBadge}>
              <Text style={styles.completedBadgeText}>Completed</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.checklistRow}>
            <Text style={styles.checklistName}>Crop Management</Text>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>Pending</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.checklistRow}>
            <Text style={styles.checklistName}>Input Usage</Text>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>Pending</Text>
            </View>
          </View>
        </View>

        {/* Section 3: Inspection Summary */}
        <Text style={styles.sectionHeader}>Inspection Summary</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>MAJOR FINDINGS</Text>
            <Text style={styles.summaryValInk}>0</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>MINOR FINDINGS</Text>
            <Text style={styles.summaryValOrange}>1</Text>
          </View>
        </View>

        {/* Section 4: Findings */}
        <Text style={styles.sectionHeader}>Findings</Text>
        <View style={styles.findingCard}>
          <Text style={styles.findingTitle}>Pest management issue</Text>
          <View style={styles.findingBadgesWrap}>
            <View style={styles.minorBadge}>
              <Text style={styles.minorBadgeText}>Minor</Text>
            </View>
            <View style={styles.openBadge}>
              <Text style={styles.openBadgeText}>Open</Text>
            </View>
          </View>
        </View>

        {/* Section 5: Violations */}
        <Text style={styles.sectionHeader}>Violations</Text>
        <View style={styles.noticeCard}>
          <Text style={styles.noticeText}>
            No violations currently recorded — only shown when a finding actually breaches a
            major-violation threshold.
          </Text>
        </View>

        {/* Section 6: Audit Timeline */}
        <Text style={styles.sectionHeader}>Audit Timeline</Text>
        <View style={styles.card}>
          <View style={styles.timelineItem}>
            <TimelineDotIcon size={18} color={adminColors.brand} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Audit Started</Text>
              <Text style={styles.timelineDate}>15 Oct 2026, 9:40 AM</Text>
            </View>
          </View>

          <View style={styles.timelineItem}>
            <ClipboardIcon size={18} color={adminColors.brand} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Inspection</Text>
              <Text style={styles.timelineDate}>15 Oct 2026, 10:15 AM</Text>
            </View>
          </View>

          <View style={[styles.timelineItem, { marginBottom: 0 }]}>
            <CheckboxPendingIcon size={18} color={adminColors.muted} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Findings Recorded</Text>
              <Text style={styles.timelineDate}>Pending</Text>
            </View>
          </View>
        </View>

        {/* Section 7: Supporting Evidence */}
        <Text style={styles.sectionHeader}>Supporting Evidence</Text>
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.metaLabel}>Photos</Text>
              <Text style={styles.metaValueBold}>2 attached</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.metaLabel}>Documents</Text>
              <Text style={styles.metaValueBold}>1 attached</Text>
            </View>
          </View>

          <View style={{ marginTop: 14 }}>
            <Text style={styles.metaLabel}>Notes</Text>
            <Text style={[styles.metaValueBold, { marginTop: 4, lineHeight: 20 }]}>
              Minor pest sighting noted on plot 2, farmer advised on organic treatment.
            </Text>
          </View>
        </View>

        <View style={styles.noticeCard}>
          <Text style={styles.noticeText}>
            Evidence shown here is read-only for this build — Add Evidence appears only if the
            backend explicitly grants upload permission.
          </Text>
        </View>

        {/* Section 8: Audit Rating */}
        <Text style={styles.sectionHeader}>Audit Rating</Text>
        <View style={styles.ratingCard}>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreNumber}>82</Text>
            <Text style={styles.scoreTotal}> / 100</Text>
          </View>
          <Text style={styles.scoreCaption}>AUDIT SCORE — VIEW ONLY</Text>
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* ─── Fixed Bottom Action Button ─── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.supportAuditBtn}
          onPress={onNavigateSupportAudit}
          activeOpacity={0.85}
        >
          <Text style={styles.supportAuditBtnText}>Support Audit</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Stylesheet ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingTop: 10,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    padding: 6,
    marginRight: 10,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    ...adminType.title,
    fontSize: 20,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  headerSubtitleText: {
    ...adminType.caption,
    fontSize: 12.5,
    color: adminColors.onBrand,
    opacity: 0.9,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionHeader: {
    ...adminType.sectionHead,
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginTop: 18,
    marginBottom: 8,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    ...adminShadow.sm,
  },
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
  },
  metaLabel: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
    marginBottom: 4,
  },
  metaValueBold: {
    ...adminType.body,
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.ink,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
  },
  checklistName: {
    ...adminType.body,
    fontSize: 13.5,
    fontWeight: '700',
    color: adminColors.ink,
  },
  completedBadge: {
    backgroundColor: '#EAF3DE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedBadgeText: {
    ...adminType.caption,
    fontSize: 11.5,
    fontWeight: '700',
    color: '#173404',
  },
  pendingBadge: {
    backgroundColor: '#FEF3E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingBadgeText: {
    ...adminType.caption,
    fontSize: 11.5,
    fontWeight: '700',
    color: '#854F0B',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3EFE9',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 14,
    ...adminShadow.sm,
  },
  summaryLabel: {
    ...adminType.caption,
    fontSize: 11,
    fontWeight: '800',
    color: adminColors.muted,
    letterSpacing: 0.5,
  },
  summaryValInk: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '800',
    color: adminColors.ink,
    marginTop: 6,
  },
  summaryValOrange: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '800',
    color: adminColors.brand,
    marginTop: 6,
  },
  findingCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...adminShadow.sm,
  },
  findingTitle: {
    ...adminType.body,
    fontSize: 13.5,
    fontWeight: '700',
    color: adminColors.ink,
  },
  findingBadgesWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  minorBadge: {
    backgroundColor: '#FEF3E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  minorBadgeText: {
    ...adminType.caption,
    fontSize: 11.5,
    fontWeight: '700',
    color: '#854F0B',
  },
  openBadge: {
    backgroundColor: '#F3EFE9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  openBadgeText: {
    ...adminType.caption,
    fontSize: 11.5,
    fontWeight: '700',
    color: '#4A5568',
  },
  noticeCard: {
    backgroundColor: '#FBF9F6',
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 14,
    marginTop: 10,
  },
  noticeText: {
    ...adminType.caption,
    fontSize: 12,
    color: '#5C5852',
    lineHeight: 18,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    ...adminType.body,
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.ink,
  },
  timelineDate: {
    ...adminType.caption,
    fontSize: 11.5,
    color: adminColors.muted,
    marginTop: 2,
  },
  ratingCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 24,
    alignItems: 'center',
    ...adminShadow.sm,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreNumber: {
    fontSize: 34,
    lineHeight: 42,
    fontWeight: '800',
    color: adminColors.brand,
  },
  scoreTotal: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '700',
    color: '#2C3E50',
  },
  scoreCaption: {
    ...adminType.caption,
    fontSize: 11,
    fontWeight: '700',
    color: adminColors.muted,
    letterSpacing: 0.8,
    marginTop: 8,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: adminColors.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    ...adminShadow.md,
  },
  supportAuditBtn: {
    height: 48,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportAuditBtnText: {
    ...adminType.body,
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
});
