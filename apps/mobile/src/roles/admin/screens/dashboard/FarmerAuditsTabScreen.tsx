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
import { adminColors, adminRadius, adminSpacing } from '../../theme';

// ─── Theme Colors ────────────────────────────────────────────────────────────
const THEME = {
  headerBg: adminColors.brand, // #F0562A Terracotta primary
  white: adminColors.onBrand,

  // Canvas & Surfaces
  canvas: adminColors.canvas, // #F3EFE9 Soft cream
  card: adminColors.card, // #FFFFFF Card surface
  border: adminColors.border, // #EEDCD3 Border stroke
  borderLight: '#F3ECE4',

  // Typography
  titleRustDark: adminColors.brandDeep, // #7A2E14
  sectionTitle: adminColors.brandDeep, // #7A2E14
  ink: adminColors.ink, // #1A1A1A
  muted: adminColors.muted, // #5F5E5A
  labelMuted: '#78716C',

  // Accent Colors — Unified Admin Theme Orange (#F0562A)
  brandOrange: adminColors.brand,
  brandOrangeActive: adminColors.brand,
  orangeBadgeText: adminColors.brand,
  orangeBadgeBg: adminColors.brandTint, // #FDF3F0
  blueText: '#0369A1',
  blueBg: '#E0F2FE',
  greenText: '#15803D',
  greenBg: '#DCFCE7',
};

// ─── SVG Icons ───────────────────────────────────────────────────────────────

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

/** Lucide calendar-days icon */
function CalendarHeaderIcon({ size = 22, color = THEME.white }: { size?: number; color?: string }) {
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
function BellIcon({ size = 19, color = THEME.white }: { size?: number; color?: string }) {
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
 * 1. Audit Calendar Icon (Image 2 Top-Left):
 * Calendar outline with 2 top hanging loops, dividing line, and 2x3 grid of date dots
 */
function ActionCalendarIcon({ size = 26, color = THEME.brandOrange }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="17" rx="3" stroke={color} strokeWidth="1.8" />
      <Line x1="8" y1="2" x2="8" y2="5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="16" y1="2" x2="16" y2="5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="3" y1="9" x2="21" y2="9" stroke={color} strokeWidth="1.8" />
      {/* 2x3 Grid of calendar date dots matching Image 2 */}
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
 * 2. Field Visits Icon (Image 2 Top-Right):
 * Calendar outline with 2 top hanging loops, dividing line, and 2 horizontal text bars inside
 */
function FieldVisitChecklistIcon({ size = 26, color = THEME.brandOrange }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="17" rx="3" stroke={color} strokeWidth="1.8" />
      <Line x1="8" y1="2" x2="8" y2="5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="16" y1="2" x2="16" y2="5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="3" y1="9" x2="21" y2="9" stroke={color} strokeWidth="1.8" />
      {/* Two horizontal event/note lines matching exact screenshot */}
      <Line x1="7.5" y1="13.5" x2="16.5" y2="13.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="7.5" y1="17" x2="13" y2="17" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

/**
 * 3. Audit History Icon (Image 2 Bottom-Left):
 * Counter-clockwise circular arrow with clock hands at 12 and ~2:15
 */
function HistoryClockIcon({ size = 26, color = THEME.brandOrange }: { size?: number; color?: string }) {
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
 * 4. Reports Icon (Image 2 Bottom-Right):
 * Document sheet with folded top-right corner, and 3 vertical bullet dots on the left
 */
function DocumentReportIcon({ size = 26, color = THEME.brandOrange }: { size?: number; color?: string }) {
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
      {/* 3 vertical bullet dots aligned on left matching exact screenshot */}
      <Circle cx="8" cy="11.5" r="1.1" fill={color} />
      <Circle cx="8" cy="15" r="1.1" fill={color} />
      <Circle cx="8" cy="18.5" r="1.1" fill={color} />
    </Svg>
  );
}

function CloseIcon({ size = 20, color = THEME.ink }: { size?: number; color?: string }) {
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

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

      {/* ─── Terracotta Header (Screenshot 1) ─── */}
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
                <BackArrowIcon size={22} color={THEME.white} />
              </TouchableOpacity>
            )}
            <CalendarHeaderIcon size={22} color={THEME.white} />
            <Text style={styles.headerTitle}>Audits</Text>
          </View>

          <TouchableOpacity
            style={styles.notificationBtn}
            onPress={onOpenNotifications}
            activeOpacity={0.8}
            accessibilityLabel="Notifications"
          >
            <BellIcon size={19} color={THEME.white} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.headerSubtitle, { paddingLeft: onBack ? 34 : 0 }]}>
          Audit Dashboard / Calendar
        </Text>
      </View>

      {/* ─── Scrollable Body ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 2x2 Static KPI Cards Grid (Screenshot 1) ─── */}
        <View style={styles.kpiGrid}>
          {/* Tile 1: Upcoming Audits */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>UPCOMING AUDITS</Text>
            <Text style={styles.kpiValue}>8</Text>
          </View>

          {/* Tile 2: Field Visits */}
          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => onNavigateSchedule('field_visit')}
            activeOpacity={0.8}
          >
            <Text style={styles.kpiLabel}>FIELD VISITS</Text>
            <Text style={styles.kpiValue}>3</Text>
          </TouchableOpacity>

          {/* Tile 3: Pending Audit Support */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>PENDING AUDIT SUPPORT</Text>
            <Text style={[styles.kpiValue, styles.kpiValueOrange]}>4</Text>
          </View>

          {/* Tile 4: Completed Audits */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>COMPLETED AUDITS</Text>
            <Text style={[styles.kpiValue, styles.kpiValueGreen]}>24</Text>
          </View>
        </View>

        {/* ─── Section: Audit Calendar (Screenshot 1) ─── */}
        <Text style={styles.sectionHeader}>Audit Calendar</Text>

        {/* Segmented View Toggle Buttons: Month | Week | List */}
        <View style={styles.segmentedToggleRow}>
          {(['Month', 'Week', 'List'] as const).map((view) => {
            const isActive = calendarView === view;
            return (
              <TouchableOpacity
                key={view}
                style={[
                  styles.toggleBtn,
                  isActive ? styles.toggleBtnActive : styles.toggleBtnInactive,
                ]}
                onPress={() => setCalendarView(view)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.toggleBtnText,
                    isActive ? styles.toggleBtnTextActive : styles.toggleBtnTextInactive,
                  ]}
                >
                  {view}
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
          {(['All Types', 'Internal', 'External', 'Field Visit'] as const).map((filter) => {
            const isActive = typeFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterPill,
                  isActive ? styles.filterPillActive : styles.filterPillInactive,
                ]}
                onPress={() => setTypeFilter(filter)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isActive ? styles.filterPillTextActive : styles.filterPillTextInactive,
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ─── Audit Item Cards (Screenshot 1) ─── */}
        <View style={styles.auditsList}>
          {displayedAudits.map((audit) => {
            const isOrange = audit.badge === 'Scheduled';
            return (
              <TouchableOpacity
                key={audit.id}
                style={styles.auditCard}
                onPress={() =>
                  onNavigateSchedule(
                    audit.type === 'Field Visit' || audit.id === 'AUD-2026-0042'
                      ? 'field_visit'
                      : 'all',
                    audit.id
                  )
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
                      {audit.badge}
                    </Text>
                  </View>
                </View>

                <Text style={styles.auditSubtitle}>{audit.subtitle}</Text>
                <Text style={styles.auditDate}>{audit.date}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── Section: Quick Actions (Screenshot 2) ─── */}
        <Text style={[styles.sectionHeader, { marginTop: 24 }]}>Quick Actions</Text>

        <View style={styles.quickActionsGrid}>
          {/* Card 1: Audit Calendar */}
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => onNavigateSchedule('calendar')}
            activeOpacity={0.8}
          >
            <ActionCalendarIcon size={26} color={THEME.brandOrangeActive} />
            <Text style={styles.quickActionLabel}>Audit Calendar</Text>
          </TouchableOpacity>

          {/* Card 2: Field Visits */}
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => onNavigateSchedule('field_visit')}
            activeOpacity={0.8}
          >
            <FieldVisitChecklistIcon size={26} color={THEME.brandOrangeActive} />
            <Text style={styles.quickActionLabel}>Field Visits</Text>
          </TouchableOpacity>

          {/* Card 3: Audit History */}
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => onNavigateSchedule('history')}
            activeOpacity={0.8}
          >
            <HistoryClockIcon size={26} color={THEME.brandOrangeActive} />
            <Text style={styles.quickActionLabel}>Audit History</Text>
          </TouchableOpacity>

          {/* Card 4: Reports */}
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => onNavigateSchedule('report')}
            activeOpacity={0.8}
          >
            <DocumentReportIcon size={26} color={THEME.brandOrangeActive} />
            <Text style={styles.quickActionLabel}>Reports</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
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
                  <Text style={styles.modalTitle}>Audit & Compliance Reports</Text>
                  <TouchableOpacity
                    onPress={() => setShowReportsModal(false)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <CloseIcon size={20} color={THEME.ink} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalBodyText}>
                  Generate or export official field verification logs and smallholder adherence summaries.
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
                  <Text style={styles.modalCloseBtnText}>Done</Text>
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
    backgroundColor: THEME.canvas,
  },
  header: {
    backgroundColor: THEME.headerBg,
    paddingTop: 10,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    padding: 4,
    marginRight: 2,
  },
  headerTitle: {
    color: THEME.white,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  notificationBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },

  // 2x2 Static KPI Grid
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: THEME.card,
    borderRadius: adminRadius.xl, // 16px as per admin token scale
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  kpiLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: THEME.labelMuted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  kpiValue: {
    fontSize: 26,
    fontWeight: '800',
    color: THEME.ink,
    letterSpacing: -0.5,
  },
  kpiValueOrange: {
    color: THEME.brandOrange,
  },
  kpiValueGreen: {
    color: THEME.greenText,
  },

  // Section Headers
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.sectionTitle,
    marginTop: 20,
    marginBottom: 10,
  },

  // Segmented View Toggle
  segmentedToggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  toggleBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnActive: {
    backgroundColor: THEME.brandOrangeActive,
  },
  toggleBtnInactive: {
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  toggleBtnTextActive: {
    color: THEME.white,
  },
  toggleBtnTextInactive: {
    color: THEME.muted,
  },

  // Horizontal Filter Pills
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 6,
    marginBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: THEME.brandOrangeActive,
  },
  filterPillInactive: {
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  filterPillText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  filterPillTextActive: {
    color: THEME.white,
  },
  filterPillTextInactive: {
    color: THEME.ink,
  },

  // Audits List & Cards
  auditsList: {
    gap: 12,
  },
  auditCard: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  auditCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  auditTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.ink,
    letterSpacing: -0.2,
  },
  auditBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeOrange: {
    backgroundColor: THEME.orangeBadgeBg,
  },
  badgeBlue: {
    backgroundColor: THEME.blueBg,
  },
  auditBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextOrange: {
    color: THEME.orangeBadgeText,
  },
  badgeTextBlue: {
    color: THEME.blueText,
  },
  auditSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    color: THEME.muted,
    marginBottom: 4,
  },
  auditDate: {
    fontSize: 12,
    fontWeight: '500',
    color: THEME.muted,
  },

  // Quick Actions Grid (Screenshot 2)
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: THEME.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.ink,
    textAlign: 'center',
  },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: THEME.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.titleRustDark,
  },
  modalBodyText: {
    fontSize: 13,
    color: THEME.muted,
    lineHeight: 18,
    marginBottom: 16,
  },
  reportList: {
    gap: 10,
    marginBottom: 20,
  },
  reportRow: {
    backgroundColor: THEME.canvas,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  reportName: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.ink,
    marginBottom: 2,
  },
  reportStatus: {
    fontSize: 11,
    color: THEME.muted,
  },
  modalCloseBtn: {
    backgroundColor: THEME.brandOrangeActive,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: {
    color: THEME.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
