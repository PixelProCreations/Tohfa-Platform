import React, { useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar, type DateData } from 'react-native-calendars';
import Svg, { Path, Rect, Line } from 'react-native-svg';
import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronDownIcon({ size = 18, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CalendarInputIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="1.9" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="1.9" />
    </Svg>
  );
}

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface AuditReportsTierConfigScreenProps {
  onBack: () => void;
  onGenerateReportSuccess?: () => void;
}

export function AuditReportsTierConfigScreen({
  onBack,
  onGenerateReportSuccess,
}: AuditReportsTierConfigScreenProps) {
  // Field values
  const [reportType, setReportType] = useState('Select...');
  const [auditType, setAuditType] = useState('Select...');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activeCalendarField, setActiveCalendarField] = useState<'dateFrom' | 'dateTo' | null>(null);

  const toYmd = (dateStr: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.trim().split('-');
    if (parts.length === 3) {
      const first = parts[0] ?? '';
      if (first.length === 4) return dateStr.trim();
      const d = parts[0] ?? '01';
      const m = parts[1] ?? '01';
      const y = parts[2] ?? '2026';
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    return dateStr;
  };

  const calendarTheme = {
    backgroundColor: adminColors.card,
    calendarBackground: adminColors.card,
    textSectionTitleColor: adminColors.muted,
    selectedDayBackgroundColor: adminColors.brand,
    selectedDayTextColor: adminColors.onBrand,
    todayTextColor: adminColors.brand,
    dayTextColor: adminColors.ink,
    textDisabledColor: adminColors.placeholder,
    arrowColor: adminColors.brand,
    monthTextColor: adminColors.ink,
    textMonthFontWeight: '700' as const,
    textDayFontWeight: '500' as const,
    textDayHeaderFontWeight: '600' as const,
  };

  const handleDaySelect = (day: DateData) => {
    const [y, m, d] = day.dateString.split('-');
    const formatted = `${d}-${m}-${y}`;
    if (activeCalendarField === 'dateFrom') {
      setDateFrom(formatted);
    } else if (activeCalendarField === 'dateTo') {
      setDateTo(formatted);
    }
    setActiveCalendarField(null);
  };

  const [farmer, setFarmer] = useState('Select...');
  const [farmZone, setFarmZone] = useState('Select...');
  const [auditor, setAuditor] = useState('Select...');
  const [auditStatus, setAuditStatus] = useState('Select...');
  const [redFlagStatus, setRedFlagStatus] = useState('Select...');
  const [exportType, setExportType] = useState('All');
  // Track which dropdown is open matching Images 1, 2, 3, 4, 5
  const [openDropdown, setOpenDropdown] = useState<
    'reportType' | 'auditType' | 'farmer' | 'farmZone' | 'auditor' | 'auditStatus' | 'redFlag' | 'exportType' | null
  >(null);

  const toggleDropdown = (field: 'reportType' | 'auditType' | 'farmer' | 'farmZone' | 'auditor' | 'auditStatus' | 'redFlag' | 'exportType') => {
    setOpenDropdown((prev) => (prev === field ? null : field));
  };

  // Sample options displayed in mockup dropdowns matching Images 1, 2, 3, 4, 5
  const sampleFmrOptions = [
    'FMR-00124 · Ramesh Kumar Farm',
    'FMR-00125 · Selvi village farm',
    'FMR-00124 · Meena Farm House',
  ];

  const reportTypeOptions = [
    'Audit Summary Report',
    'Farmer Audit History',
    'Quarterly Audit Coverage',
    'Finding & Violations Report',
    'Corrective action report',
    'Option 7',
  ];

  const auditTypeOptions = [
    'Audit Summary Report',
    'Internal',
    'External',
    'PGS Organic',
  ];

  const farmerOptions = sampleFmrOptions;
  const farmZoneOptions = sampleFmrOptions;
  const auditorOptions = sampleFmrOptions;
  const auditStatusOptions = sampleFmrOptions;
  const redFlagOptions = sampleFmrOptions;

  const exportTypeOptions = [
    'All',
    'CSV only',
    'PDF only',
    'Excel',
  ];

  const renderDropdownMenu = (
    options: string[],
    onSelect: (val: string) => void
  ) => {
    return (
      <View style={styles.dropdownMenuBox}>
        {/* Top header row matching Images 3, 4, 5 */}
        <TouchableOpacity
          style={styles.dropdownMenuHeaderRow}
          onPress={() => {
            onSelect('Select...');
            setOpenDropdown(null);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.dropdownMenuHeaderText}>Select...</Text>
        </TouchableOpacity>

        {/* Options List */}
        {options.map((opt, index) => (
          <TouchableOpacity
            key={index}
            style={styles.dropdownMenuItemRow}
            onPress={() => {
              onSelect(opt);
              setOpenDropdown(null);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.dropdownMenuItemText}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ── Header Banner Matching Image 2 ── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <BackArrowIcon />
          </TouchableOpacity>

          <Text style={styles.headerTitle} numberOfLines={1}>
            Audit Reports & Tier Configuration
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Section Heading: A · Audit reports Matching Image 2 ── */}
        <Text style={styles.sectionHeading}>A · Audit reports</Text>

        {/* ── Main Form Card Matching Image 2 ── */}
        <View style={styles.formCard}>
          {/* 1. Report type * */}
          <Text style={styles.fieldLabel}>Report type *</Text>
          <TouchableOpacity
            style={[
              styles.dropdownInputTrigger,
              openDropdown === 'reportType' && styles.dropdownInputTriggerActive,
            ]}
            onPress={() => toggleDropdown('reportType')}
            activeOpacity={0.8}
          >
            <Text style={styles.dropdownInputText}>{reportType}</Text>
            <ChevronDownIcon />
          </TouchableOpacity>
          {openDropdown === 'reportType' &&
            renderDropdownMenu(reportTypeOptions, setReportType)}

          {/* 2. Audit type */}
          <Text style={styles.fieldLabel}>Audit type</Text>
          <TouchableOpacity
            style={[
              styles.dropdownInputTrigger,
              openDropdown === 'auditType' && styles.dropdownInputTriggerActive,
            ]}
            onPress={() => toggleDropdown('auditType')}
            activeOpacity={0.8}
          >
            <Text style={styles.dropdownInputText}>{auditType}</Text>
            <ChevronDownIcon />
          </TouchableOpacity>
          {openDropdown === 'auditType' &&
            renderDropdownMenu(auditTypeOptions, setAuditType)}

          {/* 3. Date from */}
          <Text style={styles.fieldLabel}>Date from</Text>
          <TouchableOpacity
            style={styles.dateInputContainer}
            onPress={() => setActiveCalendarField('dateFrom')}
            activeOpacity={0.8}
          >
            <TextInput
              style={styles.dateTextInput}
              placeholder="dd-mm-yyyy"
              placeholderTextColor={adminColors.placeholder}
              value={dateFrom}
              onChangeText={setDateFrom}
            />
            <TouchableOpacity
              onPress={() => setActiveCalendarField('dateFrom')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Open calendar for Date from"
            >
              <CalendarInputIcon />
            </TouchableOpacity>
          </TouchableOpacity>

          {/* 4. Date to */}
          <Text style={styles.fieldLabel}>Date to</Text>
          <TouchableOpacity
            style={styles.dateInputContainer}
            onPress={() => setActiveCalendarField('dateTo')}
            activeOpacity={0.8}
          >
            <TextInput
              style={styles.dateTextInput}
              placeholder="dd-mm-yyyy"
              placeholderTextColor={adminColors.placeholder}
              value={dateTo}
              onChangeText={setDateTo}
            />
            <TouchableOpacity
              onPress={() => setActiveCalendarField('dateTo')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Open calendar for Date to"
            >
              <CalendarInputIcon />
            </TouchableOpacity>
          </TouchableOpacity>

          {/* 5. Farmer */}
          <Text style={styles.fieldLabel}>Farmer</Text>
          <TouchableOpacity
            style={[
              styles.dropdownInputTrigger,
              openDropdown === 'farmer' && styles.dropdownInputTriggerActive,
            ]}
            onPress={() => toggleDropdown('farmer')}
            activeOpacity={0.8}
          >
            <Text style={styles.dropdownInputText}>{farmer}</Text>
            <ChevronDownIcon />
          </TouchableOpacity>
          {openDropdown === 'farmer' &&
            renderDropdownMenu(farmerOptions, setFarmer)}

          {/* 6. Farm / zone */}
          <Text style={styles.fieldLabel}>Farm / zone</Text>
          <TouchableOpacity
            style={[
              styles.dropdownInputTrigger,
              openDropdown === 'farmZone' && styles.dropdownInputTriggerActive,
            ]}
            onPress={() => toggleDropdown('farmZone')}
            activeOpacity={0.8}
          >
            <Text style={styles.dropdownInputText}>{farmZone}</Text>
            <ChevronDownIcon />
          </TouchableOpacity>
          {openDropdown === 'farmZone' &&
            renderDropdownMenu(farmZoneOptions, setFarmZone)}

          {/* 7. Auditor */}
          <Text style={styles.fieldLabel}>Auditor</Text>
          <TouchableOpacity
            style={[
              styles.dropdownInputTrigger,
              openDropdown === 'auditor' && styles.dropdownInputTriggerActive,
            ]}
            onPress={() => toggleDropdown('auditor')}
            activeOpacity={0.8}
          >
            <Text style={styles.dropdownInputText}>{auditor}</Text>
            <ChevronDownIcon />
          </TouchableOpacity>
          {openDropdown === 'auditor' &&
            renderDropdownMenu(auditorOptions, setAuditor)}

          {/* 8. Audit status */}
          <Text style={styles.fieldLabel}>Audit status</Text>
          <TouchableOpacity
            style={[
              styles.dropdownInputTrigger,
              openDropdown === 'auditStatus' && styles.dropdownInputTriggerActive,
            ]}
            onPress={() => toggleDropdown('auditStatus')}
            activeOpacity={0.8}
          >
            <Text style={styles.dropdownInputText}>{auditStatus}</Text>
            <ChevronDownIcon />
          </TouchableOpacity>
          {openDropdown === 'auditStatus' &&
            renderDropdownMenu(auditStatusOptions, setAuditStatus)}

          {/* Helper Caption Matching Image 2 */}
          <Text style={styles.tierHelperCaption}>
            The tier filter appears once tiers are configured.
          </Text>

          {/* 9. Red-flag status */}
          <Text style={styles.fieldLabel}>Red-flag status</Text>
          <TouchableOpacity
            style={[
              styles.dropdownInputTrigger,
              openDropdown === 'redFlag' && styles.dropdownInputTriggerActive,
            ]}
            onPress={() => toggleDropdown('redFlag')}
            activeOpacity={0.8}
          >
            <Text style={styles.dropdownInputText}>{redFlagStatus}</Text>
            <ChevronDownIcon />
          </TouchableOpacity>
          {openDropdown === 'redFlag' &&
            renderDropdownMenu(redFlagOptions, setRedFlagStatus)}

          {/* 10. Export type Matching media_1792339588812.png & media_1792339562056.png */}
          <Text style={styles.fieldLabel}>Export type</Text>
          <TouchableOpacity
            style={[
              styles.dropdownInputTrigger,
              openDropdown === 'exportType' && styles.dropdownInputTriggerActive,
            ]}
            onPress={() => toggleDropdown('exportType')}
            activeOpacity={0.8}
          >
            <Text style={styles.dropdownInputText}>{exportType}</Text>
            <View style={styles.blueSquareChevronBox}>
              <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                <Path d="M6 9l6 6 6-6" stroke={adminColors.onBrand} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </View>
          </TouchableOpacity>
          {openDropdown === 'exportType' &&
            renderDropdownMenu(exportTypeOptions, setExportType)}
        </View>

        {/* ── Submit / Export Action Button Matching media_1792339588812.png ── */}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={() => {
            if (onGenerateReportSuccess) onGenerateReportSuccess();
            else onBack();
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.submitBtnText}>Export Report</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Date Picker Calendar Modal ── */}
      {activeCalendarField ? (
        <Modal
          transparent
          visible
          animationType="fade"
          onRequestClose={() => setActiveCalendarField(null)}
        >
          <View style={styles.calendarOverlay}>
            <TouchableOpacity
              style={styles.calendarBackdrop}
              activeOpacity={1}
              onPress={() => setActiveCalendarField(null)}
            />
            <View style={styles.calendarSheet}>
              <View style={styles.calendarHeader}>
                <Text style={styles.calendarTitle}>
                  {activeCalendarField === 'dateFrom' ? 'Select Date From' : 'Select Date To'}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setActiveCalendarField(null)}
                  style={styles.calendarCloseBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel date picker"
                >
                  <Text style={styles.calendarCloseText}>Cancel</Text>
                </TouchableOpacity>
              </View>

              <Calendar
                current={
                  activeCalendarField === 'dateFrom' && dateFrom
                    ? toYmd(dateFrom)
                    : activeCalendarField === 'dateTo' && dateTo
                    ? toYmd(dateTo)
                    : undefined
                }
                onDayPress={handleDaySelect}
                enableSwipeMonths
                theme={calendarTheme}
                markedDates={
                  activeCalendarField === 'dateFrom' && dateFrom
                    ? {
                        [toYmd(dateFrom)]: {
                          selected: true,
                          selectedColor: adminColors.brand,
                          selectedTextColor: adminColors.onBrand,
                        },
                      }
                    : activeCalendarField === 'dateTo' && dateTo
                    ? {
                        [toYmd(dateTo)]: {
                          selected: true,
                          selectedColor: adminColors.brand,
                          selectedTextColor: adminColors.onBrand,
                        },
                      }
                    : {}
                }
              />
            </View>
          </View>
        </Modal>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  headerTitle: {
    ...adminType.title,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
    color: adminColors.onBrand,
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl * 2,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
  },

  // Form Card (Image 2)
  formCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  fieldLabel: {
    ...adminType.caption,
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.ink,
    marginTop: 10,
    marginBottom: 6,
  },
  dropdownInputTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    paddingHorizontal: adminSpacing.md,
    height: 44,
  },
  dropdownInputTriggerActive: {
    borderColor: adminColors.ink,
    borderWidth: 1.5,
  },
  dropdownInputText: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
  },

  // Dropdown Popover Menu (Images 3, 4, 5)
  dropdownMenuBox: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginTop: 4,
    overflow: 'hidden',
    ...adminShadow.md,
  },
  dropdownMenuHeaderRow: {
    backgroundColor: adminColors.muted,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 10,
  },
  dropdownMenuHeaderText: {
    ...adminType.body,
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.card,
  },
  dropdownMenuItemRow: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  dropdownMenuItemText: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
  },

  // Date Inputs
  dateInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    paddingHorizontal: adminSpacing.md,
    height: 44,
  },
  dateTextInput: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
    flex: 1,
    paddingVertical: 0,
  },

  // Helper Caption
  tierHelperCaption: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    marginTop: 12,
    marginBottom: 4,
  },

  // Submit Button
  submitBtn: {
    height: 48,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    ...adminType.rowTitle,
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.onBrand,
  },

  // Blue Square Chevron Box Matching Image 5
  blueSquareChevronBox: {
    width: 26,
    height: 26,
    borderRadius: 4,
    backgroundColor: adminColors.info.text,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Calendar Modal Styles
  calendarOverlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.md,
  },
  calendarBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  calendarSheet: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    ...adminShadow.lg,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.sm,
    paddingBottom: adminSpacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  calendarTitle: {
    ...adminType.sectionHead,
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  calendarCloseBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  calendarCloseText: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.brand,
    fontWeight: '700',
  },
});
