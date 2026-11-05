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

import {
  adminColors,
  adminRadius,
  adminShadow,
  adminType,
} from '../../theme';
import type { AuditScheduleRecord } from './fixtures';

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

function CheckmarkIcon({ size = 14, color = adminColors.success.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 13l4 4L19 7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface AuditInspectionSectionItem {
  id: number;
  title: string;
  subtitle: string;
}

export const AUDIT_12_SECTIONS: AuditInspectionSectionItem[] = [
  { id: 1, title: 'Farmer Contact Verification', subtitle: '1 required field left' },
  { id: 2, title: 'FMB & Land Verification', subtitle: '1 required field left' },
  { id: 3, title: 'Farm Details Verification', subtitle: '1 required field left' },
  { id: 4, title: 'Certification Verification', subtitle: '2 required fields left' },
  { id: 5, title: 'Soil Testing & Soil Report', subtitle: '1 required field left' },
  { id: 6, title: 'Water Source & Water pH Testing', subtitle: '1 required field left' },
  { id: 7, title: 'Farm Practices Checklist', subtitle: '4 required fields left' },
  { id: 8, title: 'Documents & Findings', subtitle: 'Not started' },
  { id: 9, title: 'Farm Hygiene & Storage', subtitle: 'Not started' },
  { id: 10, title: 'Farmer Admin Assessment', subtitle: '1 required field left' },
  { id: 11, title: 'Add External Audit', subtitle: 'Not started' },
  { id: 12, title: 'Farmer Rating', subtitle: 'Rate the farmer based on the audit inspection.' },
];

export interface AuditInspectionOverviewScreenProps {
  record: AuditScheduleRecord;
  completedSections: Record<number, boolean>;
  onSelectSection: (sectionId: number) => void;
  onBack: () => void;
  onReviewSubmit: () => void;
  onSaveDraft: () => void;
}

export function AuditInspectionOverviewScreen({
  record,
  completedSections,
  onSelectSection,
  onBack,
  onReviewSubmit,
  onSaveDraft,
}: AuditInspectionOverviewScreenProps) {
  const totalSections = AUDIT_12_SECTIONS.length;
  const completedCount = AUDIT_12_SECTIONS.filter((s) => completedSections[s.id]).length;
  const progressRatio = totalSections > 0 ? completedCount / totalSections : 0;
  const missingFields = Math.max(0, 12 - completedCount * 2);

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
            <Text style={styles.headerTitle}>Audit Inspection</Text>
            <Text style={styles.headerSubtitleText}>
              {record.id || 'AUD-2026-0042'} · {record.farmerName || 'Ramesh Kumar'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Top Card: Audit Information ─── */}
        <View style={styles.card}>
          <View style={styles.gridRow}>
            <View style={styles.col}>
              <Text style={styles.metaLabel}>Audit ID</Text>
              <Text style={styles.metaValueBold}>{record.id || 'AUD-2026-0042'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.metaLabel}>Type</Text>
              <Text style={styles.metaValueBold}>{record.type ? (record.type + ' Audit') : 'Internal Audit'}</Text>
            </View>
          </View>

          <View style={[styles.gridRow, { marginTop: 14 }]}>
            <View style={styles.col}>
              <Text style={styles.metaLabel}>Farmer</Text>
              <Text style={styles.metaValueBold}>{record.farmerName || 'Ramesh Kumar'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.metaLabel}>Farm</Text>
              <Text style={styles.metaValueBold}>{record.farm || 'Ramesh Organic Farm'}</Text>
            </View>
          </View>

          <View style={[styles.gridRow, { marginTop: 14 }]}>
            <View style={styles.col}>
              <Text style={styles.metaLabel}>Date</Text>
              <Text style={styles.metaValueBold}>{record.date || '15 Oct 2026'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.metaLabel}>Auditor</Text>
              <Text style={styles.metaValueBold}>{record.auditor || 'Suresh Kumar'}</Text>
            </View>
          </View>
        </View>

        {/* ─── Progress Card ─── */}
        <View style={[styles.card, { marginTop: 14 }]}>
          <Text style={styles.progressHeading}>
            {`${completedCount} of ${totalSections} sections complete`}
          </Text>
          <Text style={styles.progressSubtext}>
            {completedCount === totalSections
              ? 'All required fields are completed and verified'
              : `${missingFields} required fields are still missing`}
          </Text>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${Math.max(4, Math.round(progressRatio * 100))}%` }]} />
          </View>
        </View>

        {/* ─── Section Header ─── */}
        <Text style={styles.sectionHeader}>Inspection sections</Text>

        {/* ─── 11 / 12 Inspection Section Cards ─── */}
        <View style={{ gap: 10 }}>
          {AUDIT_12_SECTIONS.map((sec) => {
            const isDone = Boolean(completedSections[sec.id]);
            return (
              <TouchableOpacity
                key={sec.id}
                style={styles.sectionRowCard}
                onPress={() => onSelectSection(sec.id)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={`Section ${sec.id}: ${sec.title}`}
              >
                <View style={styles.sectionNumBadge}>
                  <Text style={styles.sectionNumText}>{sec.id}</Text>
                </View>

                <View style={styles.sectionTextWrap}>
                  <Text style={styles.sectionTitleText} numberOfLines={1}>
                    {sec.title}
                  </Text>
                  <Text style={styles.sectionSubText} numberOfLines={1}>
                    {isDone ? 'Completed and verified' : sec.subtitle}
                  </Text>
                </View>

                <View style={[styles.statusBadge, isDone ? styles.statusBadgeCompleted : styles.statusBadgeNotStarted]}>
                  {isDone && <CheckmarkIcon size={12} color={adminColors.success.text} />}
                  <Text style={[styles.statusBadgeText, isDone ? styles.statusTextCompleted : styles.statusTextNotStarted]}>
                    {isDone ? 'Completed' : 'Not Started'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ─── Pinned Bottom Action Buttons ─── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={onReviewSubmit}
          activeOpacity={0.85}
        >
          <Text style={styles.submitBtnText}>Review & Submit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.draftBtn}
          onPress={onSaveDraft}
          activeOpacity={0.8}
        >
          <Text style={styles.draftBtnText}>Save Draft</Text>
        </TouchableOpacity>
      </View>
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
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    ...adminShadow.sm,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
  },
  metaLabel: {
    ...adminType.caption,
    fontSize: 11.5,
    color: adminColors.muted,
    marginBottom: 3,
  },
  metaValueBold: {
    ...adminType.body,
    fontSize: 13.5,
    fontWeight: '700',
    color: adminColors.ink,
  },
  progressHeading: {
    ...adminType.sectionHead,
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.ink,
  },
  progressSubtext: {
    ...adminType.caption,
    fontSize: 11.5,
    color: adminColors.muted,
    marginTop: 3,
    marginBottom: 10,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: adminColors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: adminColors.brand,
    borderRadius: 3,
  },
  sectionHeader: {
    ...adminType.sectionHead,
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginTop: 18,
    marginBottom: 10,
  },
  sectionRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 12,
    paddingHorizontal: 12,
    ...adminShadow.sm,
  },
  sectionNumBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionNumText: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  sectionTextWrap: {
    flex: 1,
    paddingRight: 8,
  },
  sectionTitleText: {
    ...adminType.rowTitle,
    fontSize: 13.5,
    fontWeight: '700',
    color: adminColors.ink,
  },
  sectionSubText: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: adminRadius.full,
  },
  statusBadgeNotStarted: {
    backgroundColor: adminColors.canvas,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  statusBadgeCompleted: {
    backgroundColor: adminColors.success.bg,
    borderWidth: 1,
    borderColor: adminColors.success.border,
  },
  statusBadgeText: {
    ...adminType.caption,
    fontSize: 10.5,
    fontWeight: '700',
  },
  statusTextNotStarted: {
    color: adminColors.ink,
  },
  statusTextCompleted: {
    color: adminColors.success.text,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    gap: 10,
    ...adminShadow.md,
  },
  submitBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.onBrand,
    fontSize: 14.5,
  },
  draftBtn: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.ink,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftBtnText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
    fontSize: 14,
  },
});
