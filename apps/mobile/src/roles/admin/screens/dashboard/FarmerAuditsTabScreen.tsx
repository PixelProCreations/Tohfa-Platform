import React, { useState } from 'react';
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
import { OverviewDashboardCard, OverviewCardsGrid } from '../../components/OverviewDashboardCard';

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

function CalendarHeaderIcon({ size = 24, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M8 2v4M16 2v4" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2.2" />
      <Path d="M3 10h18" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Circle cx="8" cy="14" r="1.1" fill={color} />
      <Circle cx="12" cy="14" r="1.1" fill={color} />
      <Circle cx="16" cy="14" r="1.1" fill={color} />
      <Circle cx="8" cy="18" r="1.1" fill={color} />
      <Circle cx="12" cy="18" r="1.1" fill={color} />
      <Circle cx="16" cy="18" r="1.1" fill={color} />
    </Svg>
  );
}

function BellIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronLeftIcon({ size = 18, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="m15 18-6-6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightIcon({ size = 18, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="m9 18 6-6-6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

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

// ─── Component Props ──────────────────────────────────────────────────────────

export interface FarmerAuditsTabScreenProps {
  onNavigateSchedule: (
    preFilter?: 'all' | 'field_visit' | 'calendar' | 'history' | 'report' | 'calendar_view',
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
  const [selectedDay, setSelectedDay] = useState<number>(8);
  const [showReportsModal, setShowReportsModal] = useState(false);

  // October 2026:
  // Starts on Thursday (index 3), 31 days total.
  // Leading empty cells: 3 (Mon, Tue, Wed)
  // Trailing empty cells: 1 (Sun)
  const calendarCells: (number | null)[] = [
    null, null, null,
    1, 2, 3, 4,
    5, 6, 7, 8, 9, 10, 11,
    12, 13, 14, 15, 16, 17, 18,
    19, 20, 21, 22, 23, 24, 25,
    26, 27, 28, 29, 30, 31,
    null,
  ];

  const renderDots = (day: number, isSelected: boolean) => {
    if (isSelected) {
      return <View style={styles.whiteDot} />;
    }
    if (day === 3) {
      return <View style={styles.greenDot} />;
    }
    if (day === 15) {
      return (
        <View style={styles.multiDotRow}>
          <View style={styles.orangeDotSmall} />
          <View style={styles.orangeDotSmall} />
          <View style={styles.orangeDotSmall} />
        </View>
      );
    }
    if (day === 20) {
      return <View style={styles.orangeDot} />;
    }
    if (day === 22) {
      return <View style={styles.grayDot} />;
    }
    return <View style={styles.emptyDot} />;
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Orange / Terracotta Header (Image 2) ─── */}
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
            <CalendarHeaderIcon size={24} color={adminColors.onBrand} />
            <Text style={styles.headerTitle}>{t('farmerAuditsTab.title') || 'Audits'}</Text>
          </View>

          <TouchableOpacity
            style={styles.notificationBtn}
            onPress={onOpenNotifications}
            activeOpacity={0.8}
            accessibilityLabel="Notifications"
          >
            <BellIcon size={20} color={adminColors.onBrand} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Scrollable Body ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 4 Summary KPI Cards (Static Display Only, matching Overview reference design) ─── */}
        <OverviewCardsGrid style={{ marginBottom: adminSpacing.md }}>
          <OverviewDashboardCard
            value="8"
            title="Upcoming Audits"
            subtitle="Scheduled audits"
            icon="orders"
            disabled
          />
          <OverviewDashboardCard
            value="3"
            title="Today Audit"
            subtitle="Due today"
            icon="pickup"
            disabled
          />
          <OverviewDashboardCard
            value="2"
            title="Pending Audit"
            subtitle="Needs action"
            icon="alert"
            tone="warning"
            disabled
          />
          <OverviewDashboardCard
            value="24"
            title="Completed Audits"
            subtitle="Audited & verified"
            icon="box"
            tone="success"
            disabled
          />
        </OverviewCardsGrid>

        {/* ─── Audit Calendar Header Row (Image 2) ─── */}
        <View style={styles.calendarSectionHeader}>
          <Text style={styles.calendarSectionTitle}>Audit Calendar</Text>
        </View>

        {/* ─── Month Navigation Row (Image 2) ─── */}
        <View style={styles.monthNavRow}>
          <TouchableOpacity
            style={styles.navCircleBtn}
            activeOpacity={0.7}
          >
            <ChevronLeftIcon size={18} color={adminColors.ink} />
          </TouchableOpacity>

          <Text style={styles.monthTitle}>October 2026</Text>

          <TouchableOpacity
            style={styles.navCircleBtn}
            activeOpacity={0.7}
          >
            <ChevronRightIcon size={18} color={adminColors.ink} />
          </TouchableOpacity>
        </View>

        {/* ─── Weekdays Row ─── */}
        <View style={styles.weekdaysRow}>
          {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => (
            <View key={day} style={styles.weekdayCell}>
              <Text style={styles.weekdayText}>{day}</Text>
            </View>
          ))}
        </View>

        {/* ─── Days Grid (Image 2) ─── */}
        <View style={styles.daysGrid}>
          {calendarCells.map((day, idx) => {
            if (day === null) {
              return <View key={`empty-${idx}`} style={styles.dayCellWrap} />;
            }
            const isSelected = day === selectedDay;
            return (
              <View key={`day-${day}`} style={styles.dayCellWrap}>
                <TouchableOpacity
                  style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                  onPress={() => setSelectedDay(day)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                    {day}
                  </Text>
                  <View style={styles.dotContainer}>{renderDots(day, isSelected)}</View>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* ─── Selected Date Section with View Link ─── */}
        <View style={styles.selectedDateRow}>
          <View style={styles.selectedDateInfoWrap}>
            <Text style={styles.selectedDateTitle}>{selectedDay} October 2026</Text>
            <Text style={styles.selectedDateSubtitle}>
              {selectedDay === 8 ? '1 Audit on this date' : 'Audits scheduled on this date'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => onNavigateSchedule('calendar')}
            activeOpacity={0.7}
          >
            <Text style={styles.calendarSectionLink}>View →</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Audit Cards (Static Display Only) ─── */}
        <View style={styles.auditCard}>
          <View style={styles.auditCardTopRow}>
            <Text style={styles.auditTitle}>Quarterly Farm Audit</Text>
            <View style={styles.badgeScheduled}>
              <Text style={styles.badgeScheduledText}>Scheduled</Text>
            </View>
          </View>
          <Text style={styles.auditSubtitle}>Ramesh Kumar · Internal</Text>
          <Text style={styles.auditDate}>15 Oct 2026</Text>
        </View>

        <View style={styles.auditCard}>
          <View style={styles.auditCardTopRow}>
            <Text style={styles.auditTitle}>External Compliance Audit</Text>
            <View style={styles.badgeScheduled}>
              <Text style={styles.badgeScheduledText}>Scheduled</Text>
            </View>
          </View>
          <Text style={styles.auditSubtitle}>Kumar · Ooty</Text>
          <Text style={styles.auditDate}>20 Oct 2026</Text>
        </View>

        {/* ─── Quick Actions Section (Image 3) ─── */}
        <Text style={styles.quickActionsHeading}>Quick Actions</Text>
        <View style={styles.quickActionsContainer}>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={styles.quickActionHalfCard}
              onPress={() => onNavigateSchedule('calendar_view')}
              activeOpacity={0.8}
            >
              <ActionCalendarIcon size={26} color={adminColors.brand} />
              <Text style={styles.quickActionLabel}>Audit Calendar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionHalfCard}
              onPress={() => onNavigateSchedule('history')}
              activeOpacity={0.8}
            >
              <HistoryClockIcon size={26} color={adminColors.brand} />
              <Text style={styles.quickActionLabel}>Audit History</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.quickActionFullCard}
            onPress={() => onNavigateSchedule('report', 'AUD-2026-0042')}
            activeOpacity={0.8}
          >
            <DocumentReportIcon size={26} color={adminColors.brand} />
            <Text style={styles.quickActionLabel}>Reports</Text>
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
    paddingBottom: adminSpacing.md + 2,
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
    paddingRight: adminSpacing.xs,
    paddingVertical: adminSpacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: adminColors.onBrand,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  notificationBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: adminOverlay.whitePill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },

  // ─── 2x2 KPI Cards ───
  kpiContainer: {
    gap: adminSpacing.md,
    marginBottom: adminSpacing.xl,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    ...adminShadow.sm,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: adminColors.muted,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  kpiValueBlack: {
    fontSize: 26,
    fontWeight: '800',
    color: adminColors.ink,
    letterSpacing: -0.5,
  },
  kpiValueOrange: {
    fontSize: 26,
    fontWeight: '800',
    color: adminColors.brand,
    letterSpacing: -0.5,
  },
  kpiValueGreen: {
    fontSize: 26,
    fontWeight: '800',
    color: adminColors.success.text,
    letterSpacing: -0.5,
  },

  // ─── Section Header ───
  calendarSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.lg,
  },
  calendarSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  calendarSectionLink: {
    fontSize: 15,
    fontWeight: '700',
    color: adminColors.brand,
  },

  // ─── Month Navigation ───
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.lg,
    paddingHorizontal: 2,
  },
  navCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  monthTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: adminColors.ink,
  },

  // ─── Weekdays ───
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.sm,
  },
  weekdayCell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 11,
    fontWeight: '700',
    color: adminColors.muted,
  },

  // ─── Days Grid ───
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: adminSpacing.xl,
  },
  dayCellWrap: {
    width: `${100 / 7}%`,
    padding: 3,
    alignItems: 'center',
  },
  dayCell: {
    width: '100%',
    height: 48,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  dayCellSelected: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  dayText: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.ink,
  },
  dayTextSelected: {
    color: adminColors.onBrand,
  },
  dotContainer: {
    height: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  emptyDot: {
    height: 4,
  },
  whiteDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: adminColors.onBrand,
  },
  greenDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: adminColors.success.text,
  },
  orangeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: adminColors.warning.text,
  },
  orangeDotSmall: {
    width: 3.5,
    height: 3.5,
    borderRadius: 1.75,
    backgroundColor: adminColors.warning.text,
  },
  grayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: adminColors.muted,
  },
  multiDotRow: {
    flexDirection: 'row',
    gap: 2,
    alignItems: 'center',
  },

  // ─── Selected Date Section ───
  selectedDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.md,
  },
  selectedDateInfoWrap: {
    flex: 1,
    paddingRight: adminSpacing.sm,
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: adminColors.ink,
  },
  selectedDateSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: adminColors.muted,
    marginTop: 2,
  },

  // ─── Audit Cards ───
  auditCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  auditCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  auditTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.ink,
    letterSpacing: -0.2,
  },
  badgeScheduled: {
    backgroundColor: adminColors.info.bg,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: adminRadius.sm,
  },
  badgeScheduledText: {
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.info.text,
  },
  auditSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: adminColors.muted,
    marginBottom: 4,
  },
  auditDate: {
    fontSize: 13,
    fontWeight: '500',
    color: adminColors.muted,
  },

  // ─── Quick Actions (Image 3) ───
  quickActionsHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginTop: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  quickActionsContainer: {
    gap: adminSpacing.md,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
  },
  quickActionHalfCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...adminShadow.sm,
  },
  quickActionFullCard: {
    width: '100%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...adminShadow.sm,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.ink,
    textAlign: 'center',
  },

  // ─── Modal Styles ───
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
    height: 30,
  },
});

