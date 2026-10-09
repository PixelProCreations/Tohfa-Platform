import React, { useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

// ─── Design Tokens ─────────────────────────────────────────────────────────
const PALETTE = {
  primary:       '#F0562A',
  primaryDark:   '#D4451B',
  primaryLight:  '#FFF0EB',
  pageBg:        '#FAF7F2',
  cardBg:        '#FFFFFF',
  textDark:      '#1E1612',
  textSecondary: '#7A726C',
  peachBg:       '#FDF0EB',
  border:        '#EBE5DC',
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// ─── SVG Icons ─────────────────────────────────────────────────────────────
function ArrowBackIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CalendarIcon({ size = 20, color = PALETTE.textSecondary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SparklesIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3l2 5.5L19.5 10l-5.5 1.5L12 17l-2-5.5L4.5 10l5.5-1.5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PdfIcon({ size = 18, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ExcelIcon({ size = 18, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 2v6h6M8 13h8M8 17h8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronLeftIcon({ size = 18, color = '#1E1612' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightIcon({ size = 18, color = '#1E1612' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CloseIcon({ size = 18, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Interfaces ────────────────────────────────────────────────────────────
export interface SubWarehouseFinanceReportGeneratorScreenProps {
  reportTitle: string;
  warehouseName?: string;
  onBack: () => void;
}

// ─── Main Component ────────────────────────────────────────────────────────
export function SubWarehouseFinanceReportGeneratorScreen({
  reportTitle,
  warehouseName = 'Coonoor Warehouse',
  onBack,
}: SubWarehouseFinanceReportGeneratorScreenProps) {
  const [isGenerated, setIsGenerated] = useState(false);
  const [dateText, setDateText] = useState('25 Aug 2026 – 25 Sep 2026');

  // Calendar State
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calYear, setCalYear] = useState(2026);
  const [calMonth, setCalMonth] = useState(8); // September (0-indexed)
  const [tempSelectedDay, setTempSelectedDay] = useState(25);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfWeek = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(calYear - 1);
    } else {
      setCalMonth(calMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(calYear + 1);
    } else {
      setCalMonth(calMonth + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    setTempSelectedDay(day);
  };

  const handleApplyDate = () => {
    const formatted = `${tempSelectedDay} ${MONTH_SHORT[calMonth]} ${calYear}`;
    setDateText(`01 ${MONTH_SHORT[calMonth]} ${calYear} – ${formatted}`);
    setShowCalendarModal(false);
  };

  const handleQuickPreset = (day: number, month: number, year: number) => {
    setCalYear(year);
    setCalMonth(month);
    setTempSelectedDay(day);
    const formatted = `${day} ${MONTH_SHORT[month]} ${year}`;
    setDateText(`01 ${MONTH_SHORT[month]} ${year} – ${formatted}`);
    setShowCalendarModal(false);
  };

  const handleGenerate = () => {
    setIsGenerated(true);
  };

  const handleExportPDF = () => {
    Alert.alert('Export PDF', 'Report has been exported to PDF successfully.');
  };

  const handleExportExcel = () => {
    Alert.alert('Export Excel', 'Report has been exported to Excel successfully.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowBackIcon size={24} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{reportTitle}</Text>
          <Text style={styles.headerSubtitle}>{warehouseName}</Text>
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Configuration Section */}
        <Text style={styles.sectionTitle}>Date Range</Text>
        <TouchableOpacity style={styles.datePickerCard} onPress={() => setShowCalendarModal(true)}>
          <Text style={styles.dateText}>{dateText}</Text>
          <CalendarIcon size={20} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.generateButton} onPress={handleGenerate}>
          <SparklesIcon size={20} color="#FFFFFF" />
          <Text style={styles.generateButtonText}>Generate Report</Text>
        </TouchableOpacity>

        {isGenerated && (
          <View style={styles.generatedSection}>
            {/* Report Preview */}
            <Text style={styles.sectionTitle}>Report Preview</Text>
            <View style={styles.previewCard}>
              <Text style={styles.previewCardTitle}>
                Finance Report — {warehouseName} ({reportTitle})
              </Text>
              
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Period</Text>
                  <Text style={styles.statValue}>{dateText}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Revenue</Text>
                  <Text style={styles.statValue}>₹5,84,200</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Expenses</Text>
                  <Text style={styles.statValue}>₹1,42,800</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Net Movement</Text>
                  <Text style={styles.statValue}>₹4,41,400</Text>
                </View>
              </View>
            </View>

            {/* Breakdown */}
            <Text style={styles.sectionTitle}>Breakdown</Text>
            <View style={styles.breakdownCard}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Market Sales</Text>
                <Text style={styles.breakdownAmount}>₹2,40,000</Text>
              </View>
              <View style={[styles.breakdownRow, styles.rowBorder]}>
                <Text style={styles.breakdownLabel}>Online Orders</Text>
                <Text style={styles.breakdownAmount}>₹2,80,000</Text>
              </View>
              <View style={[styles.breakdownRow, styles.rowBorder]}>
                <Text style={styles.breakdownLabel}>Other Revenue</Text>
                <Text style={styles.breakdownAmount}>₹64,200</Text>
              </View>
              <View style={[styles.breakdownRow, styles.rowBorder]}>
                <Text style={styles.breakdownLabel}>Transport</Text>
                <Text style={styles.breakdownAmount}>₹48,000</Text>
              </View>
              <View style={[styles.breakdownRow, styles.rowBorder]}>
                <Text style={styles.breakdownLabel}>Other Expenses</Text>
                <Text style={styles.breakdownAmount}>₹41,000</Text>
              </View>
            </View>

            {/* Export */}
            <Text style={styles.sectionTitle}>Export</Text>
            <View style={styles.exportRow}>
              <TouchableOpacity style={styles.exportButton} onPress={handleExportPDF}>
                <PdfIcon size={18} />
                <Text style={styles.exportButtonText}>Export PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exportButton} onPress={handleExportExcel}>
                <ExcelIcon size={18} />
                <Text style={styles.exportButtonText}>Export Excel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Calendar Modal Overlay */}
      {showCalendarModal && (
        <Modal transparent animationType="fade" visible={showCalendarModal} onRequestClose={() => setShowCalendarModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.calendarCard}>
              {/* Header */}
              <View style={styles.calHeaderRow}>
                <View>
                  <Text style={styles.calHeaderTitle}>Select Date Range</Text>
                  <Text style={styles.calHeaderSub}>
                    {tempSelectedDay} {MONTH_NAMES[calMonth]} {calYear}
                  </Text>
                </View>
                <TouchableOpacity style={styles.calCloseBtn} onPress={() => setShowCalendarModal(false)}>
                  <CloseIcon size={18} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Quick Presets */}
              <View style={styles.presetRow}>
                <TouchableOpacity
                  style={[styles.presetPill, tempSelectedDay === 25 && calMonth === 8 && calYear === 2026 && styles.presetPillActive]}
                  onPress={() => handleQuickPreset(25, 8, 2026)}
                >
                  <Text style={[styles.presetPillText, tempSelectedDay === 25 && calMonth === 8 && calYear === 2026 && styles.presetPillTextActive]}>
                    Last 30 Days
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.presetPill, tempSelectedDay === 24 && calMonth === 8 && calYear === 2026 && styles.presetPillActive]}
                  onPress={() => handleQuickPreset(24, 8, 2026)}
                >
                  <Text style={[styles.presetPillText, tempSelectedDay === 24 && calMonth === 8 && calYear === 2026 && styles.presetPillTextActive]}>
                    This Month
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Month Navigator */}
              <View style={styles.monthNavRow}>
                <TouchableOpacity style={styles.navArrowBtn} onPress={handlePrevMonth}>
                  <ChevronLeftIcon size={20} color="#1E1612" />
                </TouchableOpacity>
                <Text style={styles.monthNavTitle}>
                  {MONTH_NAMES[calMonth]} {calYear}
                </Text>
                <TouchableOpacity style={styles.navArrowBtn} onPress={handleNextMonth}>
                  <ChevronRightIcon size={20} color="#1E1612" />
                </TouchableOpacity>
              </View>

              {/* Weekdays */}
              <View style={styles.weekdaysRow}>
                {WEEKDAYS.map((wd, i) => (
                  <View key={i} style={styles.weekdayCol}>
                    <Text style={styles.weekdayText}>{wd}</Text>
                  </View>
                ))}
              </View>

              {/* Days Grid */}
              <View style={styles.daysGrid}>
                {Array.from({ length: getFirstDayOfWeek(calYear, calMonth) }).map((_, i) => (
                  <View key={`empty-${i}`} style={styles.dayCellEmpty} />
                ))}
                {Array.from({ length: getDaysInMonth(calYear, calMonth) }).map((_, i) => {
                  const dayNum = i + 1;
                  const isSelected = tempSelectedDay === dayNum;
                  const isToday = dayNum === 25 && calMonth === 8 && calYear === 2026;

                  return (
                    <TouchableOpacity
                      key={`day-${dayNum}`}
                      style={[styles.dayCell, isSelected && styles.dayCellSelected, isToday && !isSelected && styles.dayCellToday]}
                      onPress={() => handleSelectDay(dayNum)}
                    >
                      <Text style={[styles.dayCellText, isSelected && styles.dayCellTextSelected, isToday && !isSelected && styles.dayCellTextToday]}>
                        {dayNum}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Actions */}
              <View style={styles.calActionRow}>
                <TouchableOpacity style={styles.calCancelBtn} onPress={() => setShowCalendarModal(false)}>
                  <Text style={styles.calCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.calApplyBtn} onPress={handleApplyDate}>
                  <Text style={styles.calApplyText}>Apply Range</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PALETTE.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: PALETTE.primary,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  container: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.textDark,
    marginTop: 8,
    marginBottom: 12,
  },
  datePickerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  dateText: {
    fontSize: 15,
    color: PALETTE.textDark,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.primary,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 24,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  generatedSection: {
    marginTop: 8,
  },
  previewCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 24,
  },
  previewCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.textDark,
    lineHeight: 22,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statBox: {
    width: '50%',
    marginBottom: 16,
  },
  statLabel: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.textDark,
  },
  breakdownCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 24,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F4EFE9',
  },
  breakdownLabel: {
    fontSize: 14,
    color: PALETTE.textDark,
    fontWeight: '500',
  },
  breakdownAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textDark,
  },
  exportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: PALETTE.primary,
    borderRadius: 12,
    paddingVertical: 14,
    marginHorizontal: 6,
  },
  exportButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.primary,
    marginLeft: 8,
  },

  // Calendar Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 360,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EBE5DC',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 8,
  },
  calHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F4EFE9',
  },
  calHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E1612',
  },
  calHeaderSub: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.primary,
    marginTop: 2,
  },
  calCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F4EFE9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 12,
  },
  presetPill: {
    flex: 1,
    backgroundColor: '#FAF7F2',
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EBE5DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetPillActive: {
    backgroundColor: PALETTE.peachBg,
    borderColor: PALETTE.primary,
  },
  presetPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7A726C',
  },
  presetPillTextActive: {
    color: PALETTE.primaryDark,
    fontWeight: '800',
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    marginBottom: 8,
  },
  navArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FAF7F2',
    borderWidth: 1,
    borderColor: '#EBE5DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#1E1612',
  },
  weekdaysRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    marginBottom: 4,
  },
  weekdayCol: {
    width: '14.28%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  dayCellEmpty: {
    width: '14.28%',
    height: 38,
  },
  dayCell: {
    width: '14.28%',
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
  },
  dayCellSelected: {
    backgroundColor: PALETTE.primary,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: PALETTE.primary,
  },
  dayCellText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E1612',
  },
  dayCellTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dayCellTextToday: {
    color: PALETTE.primary,
    fontWeight: '800',
  },
  calActionRow: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F4EFE9',
    paddingTop: 12,
  },
  calCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EBE5DC',
    backgroundColor: '#FAF7F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7A726C',
  },
  calApplyBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: PALETTE.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calApplyText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
