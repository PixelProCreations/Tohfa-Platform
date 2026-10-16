import React, { useState, useMemo } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { adminColors, adminOverlay, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';
import { t } from '../../i18n';

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

/** Lucide calendar-days icon */
function CalendarHeaderIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M8 2v4M16 2v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="8" cy="14" r="1.1" fill={color} />
      <Circle cx="12" cy="14" r="1.1" fill={color} />
      <Circle cx="16" cy="14" r="1.1" fill={color} />
      <Circle cx="8" cy="18" r="1.1" fill={color} />
      <Circle cx="12" cy="18" r="1.1" fill={color} />
      <Circle cx="16" cy="18" r="1.1" fill={color} />
    </Svg>
  );
}

/** Translucent circular bell button icon */
function BellIcon({ size = 19, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * 1. Audit Calendar Icon:
 * Calendar outline with 2 top hanging loops, dividing line, and 2x3 grid of date dots
 */
function ActionCalendarIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="17" rx="3" stroke={color} strokeWidth="1.8" />
      <Line x1="8" y1="2" x2="8" y2="5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="16" y1="2" x2="16" y2="5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="3" y1="9" x2="21" y2="9" stroke={color} strokeWidth="1.8" />
      <Circle cx="7.5" cy="12.5" r="1.1" fill={color} />
      <Circle cx="12" cy="12.5" r="1.1" fill={color} />
      <Circle cx="16.5" cy="12.5" r="1.1" fill={color} />
      <Circle cx="7.5" cy="16.5" r="1.1" fill={color} />
      <Circle cx="12" cy="16.5" r="1.1" fill={color} />
      <Circle cx="16.5" cy="16.5" r="1.1" fill={color} />
    </Svg>
  );
}

/**
 * 2. Field Visits Icon:
 * Calendar outline with 2 top hanging loops, dividing line, and 2 horizontal text bars inside
 */
function FieldVisitChecklistIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="17" rx="3" stroke={color} strokeWidth="1.8" />
      <Line x1="8" y1="2" x2="8" y2="5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="16" y1="2" x2="16" y2="5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="3" y1="9" x2="21" y2="9" stroke={color} strokeWidth="1.8" />
      <Line x1="7.5" y1="13.5" x2="16.5" y2="13.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="7.5" y1="17" x2="13" y2="17" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

/**
 * 3. Audit History Icon:
 * Counter-clockwise circular arrow with clock hands at 12 and ~2:15
 */
function HistoryClockIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M3 3v5h5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 7.5v4.5l3.5 2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/**
 * 4. Reports Icon:
 * Document sheet with folded top-right corner, and 3 vertical bullet dots on the left
 */
function DocumentReportIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 2v6h6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="8" cy="11.5" r="1.1" fill={color} />
      <Circle cx="8" cy="15" r="1.1" fill={color} />
      <Circle cx="8" cy="18.5" r="1.1" fill={color} />
    </Svg>
  );
}

function CloseIcon({ size = 20, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Data Types & Initial Items ──────────────────────────────────────────────

export type CalendarViewMode = 'Month' | 'Week' | 'List';
export type AuditTypeFilter = 'All Types' | 'Internal' | 'External' | 'Field Visit';

export interface AuditItem {
  id: string;
  title: string;
  badge: 'Scheduled' | 'Upcoming';
  subtitle: string;
  date: string;
  type: 'Internal' | 'External' | 'Field Visit';
}

const INITIAL_AUDITS: AuditItem[] = [
  {
    id: 'AUD-2026-0042',
    title: 'Quarterly Farm Audit',
    badge: 'Scheduled',
    subtitle: 'Ramesh Kumar · Internal',
    date: '15 Oct 2026',
    type: 'Internal',
  },
  {
    id: 'FV-2026-0018',
    title: 'Field Visit',
    badge: 'Upcoming',
    subtitle: 'Selvi · Coonoor',
    date: '08 Oct 2026',
    type: 'Field Visit',
  },
  {
    id: 'AUD-2026-0039',
    title: 'External Compliance Audit',
    badge: 'Scheduled',
    subtitle: 'Kumar · Ooty',
    date: '20 Oct 2026',
    type: 'External',
  },
];

// ─── Component Props ──────────────────────────────────────────────────────────

export interface FarmerAuditsTabScreenProps {
  onNavigateSchedule: (
    preFilter?: 'all' | 'field_visit' | 'calendar' | 'history' | 'report',
    auditId?: string
  ) => void;
  onOpenNotifications?: () => void;
  onBack?: () => void;
}

export function FarmerAuditsTabScreen({
  onNavigateSchedule,
  onOpenNotifications,
  onBack,
}: FarmerAuditsTabScreenProps) {
  const [calendarView, setCalendarView] = useState<CalendarViewMode>('Month');
  const [typeFilter, setTypeFilter] = useState<AuditTypeFilter>('All Types');
  const [showReportsModal, setShowReportsModal] = useState(false);

  // Filtered audit items based on selected pill
  const displayedAudits = useMemo(() => {
    if (typeFilter === 'All Types') return INITIAL_AUDITS;
    return INITIAL_AUDITS.filter((item) => item.type === typeFilter);
  }, [typeFilter]);

  const viewModes: { key: CalendarViewMode; label: string }[] = [
    { key: 'Month', label: t('farmerAuditsTab.toggle.month') },
    { key: 'Week', label: t('farmerAuditsTab.toggle.week') },
    { key: 'List', label: t('farmerAuditsTab.toggle.list') },
  ];

  const filterOptions: { key: AuditTypeFilter; label: string }[] = [
    { key: 'All Types', label: t('farmerAuditsTab.filter.all') },
    { key: 'Internal', label: t('farmerAuditsTab.filter.internal') },
    { key: 'External', label: t('farmerAuditsTab.filter.external') },
    { key: 'Field Visit', label: t('farmerAuditsTab.filter.fieldVisit') },
  ];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Terracotta Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleWrap}>
            {onBack && (
              <TouchableOpacity
                style={styles.backBtn}
                onPress={onBack}
                activeOpacity={0.7}
                accessibilityLabel="Go back"
              >
                <BackArrowIcon size={22} color={adminColors.onBrand} />
              </TouchableOpacity>
            )}
            <CalendarHeaderIcon size={22} color={adminColors.onBrand} />
            <Text style={styles.headerTitle}>{t('farmerAuditsTab.title')}</Text>
          </View>

          <TouchableOpacity
            style={styles.notificationBtn}
            onPress={onOpenNotifications}
            activeOpacity={0.8}
            accessibilityLabel="Notifications"
          >
            <BellIcon size={19} color={adminColors.onBrand} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.headerSubtitle, { paddingLeft: onBack ? adminSpacing.xl : 0 }]}>
          {t('farmerAuditsTab.subtitle')}
        </Text>
      </View>

      {/* ─── Scrollable Body ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 2x2 Static KPI Cards Grid ─── */}
        <View style={styles.kpiGrid}>
          {/* Tile 1: Upcoming Audits */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>{t('farmerAuditsTab.kpi.upcoming')}</Text>
            <Text style={styles.kpiValue}>8</Text>
          </View>

          {/* Tile 2: Field Visits */}
          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => onNavigateSchedule('field_visit')}
            activeOpacity={0.8}
          >
            <Text style={styles.kpiLabel}>{t('farmerAuditsTab.kpi.fieldVisits')}</Text>
            <Text style={styles.kpiValue}>3</Text>
          </TouchableOpacity>

          {/* Tile 3: Pending Audit Support */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>{t('farmerAuditsTab.kpi.pendingSupport')}</Text>
            <Text style={[styles.kpiValue, styles.kpiValueOrange]}>4</Text>
          </View>

          {/* Tile 4: Completed Audits */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>{t('farmerAuditsTab.kpi.completedAudits')}</Text>
            <Text style={[styles.kpiValue, styles.kpiValueGreen]}>24</Text>
          </View>
        </View>

        {/* ─── Section: Audit Calendar ─── */}
        <TouchableOpacity
          onPress={() => onNavigateSchedule('field_visit')}
          activeOpacity={0.8}
        >
          <Text style={styles.sectionHeader}>{t('farmerAuditsTab.section.calendar')}</Text>
        </TouchableOpacity>

        {/* Segmented View Toggle Buttons: Month | Week | List */}
        <View style={styles.segmentedToggleRow}>
          {viewModes.map(({ key, label }) => {
            const isActive = calendarView === key;
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.toggleBtn,
                  isActive ? styles.toggleBtnActive : styles.toggleBtnInactive,
                ]}
                onPress={() => {
                  setCalendarView(key);
                  if (key === 'List') {
                    onNavigateSchedule('field_visit');
                  }
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.toggleBtnText,
                    isActive ? styles.toggleBtnTextActive : styles.toggleBtnTextInactive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Horizontal Filter Pills: All Types | Internal | External | Field Visit */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsRow}
        >
          {filterOptions.map(({ key, label }) => {
            const isActive = typeFilter === key;
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.filterPill,
                  isActive ? styles.filterPillActive : styles.filterPillInactive,
                ]}
                onPress={() => setTypeFilter(key)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isActive ? styles.filterPillTextActive : styles.filterPillTextInactive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ─── Audit Item Cards ─── */}
        <View style={styles.auditsList}>
          {displayedAudits.map((audit) => {
            const isOrange = audit.badge === 'Scheduled';
            return (
              <TouchableOpacity
                key={audit.id}
                style={styles.auditCard}
                onPress={() =>
                  onNavigateSchedule('field_visit', audit.id)
                }
                activeOpacity={0.85}
              >
                <View style={styles.auditCardTopRow}>
                  <Text style={styles.auditTitle}>{audit.title}</Text>
                  <View
                    style={[
                      styles.auditBadge,
                      isOrange ? styles.badgeOrange : styles.badgeBlue,
                    ]}
                  >
                    <Text
                      style={[
                        styles.auditBadgeText,
                        isOrange ? styles.badgeTextOrange : styles.badgeTextBlue,
                      ]}
                    >
                      {audit.badge === 'Scheduled'
                        ? t('farmerAuditsTab.badge.scheduled')
                        : t('farmerAuditsTab.badge.upcoming')}
                    </Text>
                  </View>
                </View>

                <Text style={styles.auditSubtitle}>{audit.subtitle}</Text>
                <Text style={styles.auditDate}>{audit.date}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── Section: Quick Actions ─── */}
        <Text style={[styles.sectionHeader, styles.quickActionsHeading]}>
          {t('farmerAuditsTab.section.quickActions')}
        </Text>

        <View style={styles.quickActionsGrid}>
          {/* Card 1: Audit Calendar */}
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => onNavigateSchedule('calendar')}
            activeOpacity={0.8}
          >
            <ActionCalendarIcon size={26} color={adminColors.brand} />
            <Text style={styles.quickActionLabel}>{t('farmerAuditsTab.action.calendar')}</Text>
          </TouchableOpacity>

          {/* Card 2: Field Visits */}
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => onNavigateSchedule('field_visit')}
            activeOpacity={0.8}
          >
            <FieldVisitChecklistIcon size={26} color={adminColors.brand} />
            <Text style={styles.quickActionLabel}>{t('farmerAuditsTab.action.fieldVisits')}</Text>
          </TouchableOpacity>

          {/* Card 3: Audit History */}
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => onNavigateSchedule('history')}
            activeOpacity={0.8}
          >
            <HistoryClockIcon size={26} color={adminColors.brand} />
            <Text style={styles.quickActionLabel}>{t('farmerAuditsTab.action.auditHistory')}</Text>
          </TouchableOpacity>

          {/* Card 4: Reports */}
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => onNavigateSchedule('report')}
            activeOpacity={0.8}
          >
            <DocumentReportIcon size={26} color={adminColors.brand} />
            <Text style={styles.quickActionLabel}>{t('farmerAuditsTab.action.reports')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* ─── Reports Modal ─── */}
      <Modal
        visible={showReportsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReportsModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowReportsModal(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.modalCard}>
                <View style={styles.modalHeaderRow}>
                  <Text style={styles.modalTitle}>{t('farmerAuditsTab.modal.reportsTitle')}</Text>
                  <TouchableOpacity
                    onPress={() => setShowReportsModal(false)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <CloseIcon size={20} color={adminColors.ink} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalBodyText}>
                  {t('farmerAuditsTab.modal.reportsDesc')}
                </Text>

                <View style={styles.reportList}>
                  <View style={styles.reportRow}>
                    <Text style={styles.reportName}>Q3 Nilgiris Audit Summary (PDF)</Text>
                    <Text style={styles.reportStatus}>Ready · 2.4 MB</Text>
                  </View>
                  <View style={styles.reportRow}>
                    <Text style={styles.reportName}>Selvi FR-00242 Bio-Input Log</Text>
                    <Text style={styles.reportStatus}>Verified · 1.1 MB</Text>
                  </View>
                  <View style={styles.reportRow}>
                    <Text style={styles.reportName}>Organic Compliance Certificate Batch</Text>
                    <Text style={styles.reportStatus}>Generated 12 Oct</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setShowReportsModal(false)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.modalCloseBtnText}>{t('farmerAuditsTab.modal.done')}</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
    paddingHorizontal: adminSpacing.lg,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  backBtn: {
    padding: adminSpacing.xs,
    marginRight: 2,
  },
  headerTitle: {
    color: adminColors.onBrand,
    ...adminType.title,
    letterSpacing: -0.3,
  },
  notificationBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: adminOverlay.whitePill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSubtitle: {
    color: adminColors.brandTint,
    ...adminType.caption,
    fontWeight: '600',
    marginTop: adminSpacing.xs,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
  },

  // 2x2 Static KPI Grid
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.md,
    marginBottom: adminSpacing.lg,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    ...adminShadow.sm,
  },
  kpiLabel: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.muted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: adminSpacing.xs,
  },
  kpiValue: {
    ...adminType.kpiValue,
    color: adminColors.ink,
    letterSpacing: -0.5,
  },
  kpiValueOrange: {
    color: adminColors.brand,
  },
  kpiValueGreen: {
    color: adminColors.success.text,
  },

  // Section Headers
  sectionHeader: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginTop: adminSpacing.xl,
    marginBottom: adminSpacing.sm,
  },
  quickActionsHeading: {
    marginTop: adminSpacing.xl,
  },

  // Segmented View Toggle
  segmentedToggleRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.sm,
  },
  toggleBtn: {
    flex: 1,
    height: 40,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnActive: {
    backgroundColor: adminColors.brand,
  },
  toggleBtnInactive: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  toggleBtnText: {
    ...adminType.body,
    fontWeight: '700',
  },
  toggleBtnTextActive: {
    color: adminColors.onBrand,
  },
  toggleBtnTextInactive: {
    color: adminColors.muted,
  },

  // Horizontal Filter Pills
  filterPillsRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    paddingBottom: adminSpacing.xs,
    marginBottom: adminSpacing.md,
  },
  filterPill: {
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.sm,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: adminColors.brand,
  },
  filterPillInactive: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  filterPillText: {
    ...adminType.caption,
    fontWeight: '700',
  },
  filterPillTextActive: {
    color: adminColors.onBrand,
  },
  filterPillTextInactive: {
    color: adminColors.ink,
  },

  // Audits List & Cards
  auditsList: {
    gap: adminSpacing.md,
  },
  auditCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
  },
  auditCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.xs,
  },
  auditTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    letterSpacing: -0.2,
  },
  auditBadge: {
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 3,
    borderRadius: adminRadius.sm,
  },
  badgeOrange: {
    backgroundColor: adminColors.brandTint,
  },
  badgeBlue: {
    backgroundColor: adminColors.info.bg,
  },
  auditBadgeText: {
    ...adminType.caption,
    fontWeight: '700',
  },
  badgeTextOrange: {
    color: adminColors.brand,
  },
  badgeTextBlue: {
    color: adminColors.info.text,
  },
  auditSubtitle: {
    ...adminType.rowMeta,
    fontWeight: '500',
    color: adminColors.muted,
    marginBottom: adminSpacing.xs,
  },
  auditDate: {
    ...adminType.rowMeta,
    fontWeight: '500',
    color: adminColors.muted,
  },

  // Quick Actions Grid
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.md,
  },
  quickActionCard: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.xl,
    paddingHorizontal: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.sm,
  },
  quickActionLabel: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
    textAlign: 'center',
  },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.xl,
  },
  modalCard: {
    width: '100%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.sm,
  },
  modalTitle: {
    ...adminType.title,
    color: adminColors.brandDeep,
  },
  modalBodyText: {
    ...adminType.body,
    color: adminColors.muted,
    lineHeight: 18,
    marginBottom: adminSpacing.lg,
  },
  reportList: {
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.xl,
  },
  reportRow: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  reportName: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 2,
  },
  reportStatus: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  modalCloseBtn: {
    backgroundColor: adminColors.brand,
    height: 44,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: {
    color: adminColors.onBrand,
    ...adminType.rowTitle,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: adminSpacing.xxl,
  },
});
