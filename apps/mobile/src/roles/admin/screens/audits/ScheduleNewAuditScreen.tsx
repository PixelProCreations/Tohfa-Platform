import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Icon, ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import { adminErrorKey } from '../../api/errors';
import { useFarmerList } from '../../api/farmerHooks';
import { t } from '../../i18n';
import { makeCan, type Can } from '../../permissions/can';
import { adminColors, adminType } from '../../theme';
import type { AuditType } from '../../api/audits';
import { buildQuickScheduleBody, isStartTimePicked } from './auditActions';
import { useCreateAudit } from './useAuditsData';

// ─── Palette ──────────────────────────────────────────────────────────────────
const A = {
  orange:      '#E85226',
  orangeLight: '#FFF4EE',
  brandRust:   '#7E2E11',
  pageBg:      '#FAF8F5',
  cardBg:      '#FFFFFF',
  ink:         '#1A1412',
  body:        '#6B6560',
  muted:       '#8C827A',
  border:      '#EDE8E0',
  divider:     '#F3EFEA',
};

const CARD_SHADOW = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 3,
  elevation: 1,
};

/** docs/rbac.json codes this screen checks. */
export const SCHEDULE_NEW_AUDIT_CODES = {
  schedule: 'audit.schedule',
  /** GET /admin/farmers, behind the farmer search. */
  farmers: 'farmer.profile.view_all',
} as const;

const FAIL_CLOSED: Can = makeCan([]);
const AUDIT_TYPES: readonly AuditType[] = ['INTERNAL', 'EXTERNAL'];

// ─── Date helpers ─────────────────────────────────────────────────────────────
export const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

export function daysInMonth(month: number, year: number) {
  return new Date(year, month + 1, 0).getDate();
}

export function formatDisplay(day: number, month: number, year: number) {
  return `${MONTHS[month]} ${day}, ${year}`;
}

// ─── User-Friendly Inline Calendar with Easy Year Selection ───────────────────
export function InlineDatePicker({
  day,
  month,
  year,
  onChange,
  onClose,
}: {
  day: number;
  month: number;
  year: number;
  onChange: (d: number, m: number, y: number) => void;
  onClose?: () => void;
}) {
  const [viewMode, setViewMode] = useState<'days' | 'yearSelect'>('days');
  const today = new Date();
  const total = daysInMonth(month, year);
  const firstDow = new Date(year, month, 1).getDay();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const isToday = (d: number) =>
    d === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  function prevYear() {
    const newDays = daysInMonth(month, year - 1);
    onChange(Math.min(day, newDays), month, year - 1);
  }
  function nextYear() {
    const newDays = daysInMonth(month, year + 1);
    onChange(Math.min(day, newDays), month, year + 1);
  }
  function prevMonth() {
    if (month === 0) {
      const newDays = daysInMonth(11, year - 1);
      onChange(Math.min(day, newDays), 11, year - 1);
    } else {
      const newDays = daysInMonth(month - 1, year);
      onChange(Math.min(day, newDays), month - 1, year);
    }
  }
  function nextMonth() {
    if (month === 11) {
      const newDays = daysInMonth(0, year + 1);
      onChange(Math.min(day, newDays), 0, year + 1);
    } else {
      const newDays = daysInMonth(month + 1, year);
      onChange(Math.min(day, newDays), month + 1, year);
    }
  }

  return (
    <View style={cal.wrapper}>
      {/* Navigation Header with Fast Year Stepper & Month Switcher */}
      <View style={cal.header}>
        <View style={cal.navGroup}>
          <TouchableOpacity onPress={prevYear} style={cal.fastNavBtn} activeOpacity={0.7}>
            <Text style={cal.fastNavArrow}>«</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={prevMonth} style={cal.navBtn} activeOpacity={0.7}>
            <Text style={cal.navArrow}>‹</Text>
          </TouchableOpacity>
        </View>

        {/* Tapping Month & Year opens quick Year/Month jump mode */}
        <TouchableOpacity
          onPress={() => setViewMode((v) => (v === 'days' ? 'yearSelect' : 'days'))}
          style={cal.monthYearBtn}
          activeOpacity={0.7}
        >
          <Text style={cal.monthLabel}>
            {MONTHS[month]} {year}
          </Text>
          <Text style={cal.pickerChevron}>{viewMode === 'yearSelect' ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        <View style={cal.navGroup}>
          <TouchableOpacity onPress={nextMonth} style={cal.navBtn} activeOpacity={0.7}>
            <Text style={cal.navArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={nextYear} style={cal.fastNavBtn} activeOpacity={0.7}>
            <Text style={cal.fastNavArrow}>»</Text>
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === 'yearSelect' ? (
        /* Quick Year & Month Selector Grid */
        <View style={cal.quickPickerContainer}>
          <Text style={cal.quickPickerTitle}>Select Year</Text>
          <View style={cal.yearsRow}>
            {YEARS.map((y) => {
              const isSelYear = y === year;
              return (
                <TouchableOpacity
                  key={y}
                  style={[cal.yearChip, isSelYear && cal.yearChipActive]}
                  onPress={() => {
                    onChange(Math.min(day, daysInMonth(month, y)), month, y);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={[cal.yearChipText, isSelYear && cal.yearChipTextActive]}>
                    {y}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[cal.quickPickerTitle, { marginTop: 12 }]}>Select Month</Text>
          <View style={cal.monthsGrid}>
            {MONTHS.map((mName, mIdx) => {
              const isSelMonth = mIdx === month;
              return (
                <TouchableOpacity
                  key={mName}
                  style={[cal.monthChip, isSelMonth && cal.monthChipActive]}
                  onPress={() => {
                    onChange(Math.min(day, daysInMonth(mIdx, year)), mIdx, year);
                    setViewMode('days');
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={[cal.monthChipText, isSelMonth && cal.monthChipTextActive]}>
                    {mName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : (
        /* Standard Month Day Grid */
        <>
          <View style={cal.dowRow}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((lbl) => (
              <Text key={lbl} style={cal.dowLabel}>
                {lbl}
              </Text>
            ))}
          </View>

          {weeks.map((week, wi) => (
            <View key={wi} style={cal.week}>
              {week.map((d, di) => {
                const selected = d === day;
                const todayCell = d !== null && isToday(d);
                return (
                  <TouchableOpacity
                    key={di}
                    style={[
                      cal.dayCell,
                      selected && cal.dayCellSelected,
                      !selected && todayCell && cal.dayCellToday,
                    ]}
                    onPress={() => {
                      if (d !== null) {
                        onChange(d, month, year);
                      }
                    }}
                    activeOpacity={d !== null ? 0.7 : 1}
                    disabled={d === null}
                  >
                    <Text
                      style={[
                        cal.dayText,
                        selected && cal.dayTextSelected,
                        !selected && todayCell && cal.dayTextToday,
                      ]}
                    >
                      {d !== null ? String(d) : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </>
      )}

      {/* Quick Done / Confirm Bar */}
      <View style={cal.footerRow}>
        <Text style={cal.selectedDateCaption}>
          Selected: {formatDisplay(day, month, year)}
        </Text>
        {onClose && (
          <TouchableOpacity style={cal.doneBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={cal.doneBtnText}>Confirm</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const cal = StyleSheet.create({
  wrapper: {
    backgroundColor: A.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: A.border,
    overflow: 'hidden',
    marginBottom: 20,
    marginTop: 6,
    ...CARD_SHADOW,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: A.divider,
    backgroundColor: '#FAF8F5',
  },
  navGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: A.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fastNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: A.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrow: {
    fontSize: 20,
    color: A.brandRust,
    fontWeight: '700',
    lineHeight: 22,
  },
  fastNavArrow: {
    fontSize: 16,
    color: A.orange,
    fontWeight: '800',
    lineHeight: 18,
  },
  monthYearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: A.border,
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: A.brandRust,
  },
  pickerChevron: {
    fontSize: 9,
    color: A.orange,
  },
  dowRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 6,
  },
  dowLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: A.muted,
    textTransform: 'uppercase',
  },
  week: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  dayCell: {
    flex: 1,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  dayCellSelected: {
    backgroundColor: A.orange,
  },
  dayCellToday: {
    backgroundColor: A.orangeLight,
  },
  dayText: {
    fontSize: 13,
    color: A.ink,
    fontWeight: '500',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dayTextToday: {
    color: A.orange,
    fontWeight: '800',
  },
  quickPickerContainer: {
    padding: 14,
  },
  quickPickerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: A.body,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  yearsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  yearChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F5F2EC',
    borderWidth: 1,
    borderColor: A.border,
  },
  yearChipActive: {
    backgroundColor: A.orange,
    borderColor: A.orange,
  },
  yearChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: A.ink,
  },
  yearChipTextActive: {
    color: '#FFFFFF',
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  monthChip: {
    width: '23%',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F5F2EC',
    borderWidth: 1,
    borderColor: A.border,
    alignItems: 'center',
  },
  monthChipActive: {
    backgroundColor: A.orange,
    borderColor: A.orange,
  },
  monthChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: A.ink,
  },
  monthChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: A.divider,
    backgroundColor: '#FAF8F5',
  },
  selectedDateCaption: {
    fontSize: 12,
    fontWeight: '600',
    color: A.body,
  },
  doneBtn: {
    backgroundColor: A.orange,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  doneBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

// ─── Screen Component ─────────────────────────────────────────────────────────

export interface ScheduleNewAuditScreenProps {
  onBack: () => void;
  onScheduled?: () => void;
  onSuccess?: () => void;
  /** The signed-in admin's permission check; without it every action is refused (fail closed). */
  can?: Can | undefined;
}

export function ScheduleNewAuditScreen({
  onBack,
  onScheduled,
  onSuccess,
  can = FAIL_CLOSED,
}: ScheduleNewAuditScreenProps) {
  const now = new Date();
  const canSchedule = can(SCHEDULE_NEW_AUDIT_CODES.schedule);
  const canSearchFarmers = can(SCHEDULE_NEW_AUDIT_CODES.farmers);

  const [farmerQuery,     setFarmerQuery]     = useState('');
  const [farmer,          setFarmer]          = useState<{ id: string; label: string } | null>(null);
  const [showCal,         setShowCal]         = useState(false);
  const [selDay,          setSelDay]          = useState(now.getDate());
  const [selMonth,        setSelMonth]        = useState(now.getMonth());
  const [selYear,         setSelYear]         = useState(now.getFullYear());
  const [startTime,       setStartTime]       = useState('');
  const [typeOpen,        setTypeOpen]        = useState(false);
  const [auditType,       setAuditType]       = useState<AuditType>('INTERNAL');
  const [agency,          setAgency]          = useState('');
  const [formError,       setFormError]       = useState<string | null>(null);

  const createAudit = useCreateAudit();
  const isPending = createAudit.isPending;
  // No time is substituted: until the admin has typed a usable start time the submit stays off.
  const timePicked = isStartTimePicked(startTime);
  // The directory is only searched while the admin is typing a name and no farmer is chosen.
  const searchText = farmer === null ? farmerQuery.trim() : '';
  const farmers = useFarmerList(undefined, searchText === '' || !canSearchFarmers ? { q: undefined } : { q: searchText });
  const showResults = canSearchFarmers && farmer === null && searchText !== '';

  function handleDateTap() {
    setShowCal((v) => !v);
    setTypeOpen(false);
  }

  function handleTypeTap() {
    setTypeOpen((o) => !o);
    setShowCal(false);
  }

  // Success is only ever reported from the server's 2xx (onSuccess of the mutation), never before it.
  function handleSchedule() {
    if (isPending || !canSchedule || !timePicked) return;
    const result = buildQuickScheduleBody({
      farmerId: farmer?.id ?? null,
      auditType,
      externalAgencyName: agency,
      day: selDay,
      month0: selMonth,
      year: selYear,
      startTime,
    });
    if (!result.ok) {
      setFormError(t(result.errorKey));
      return;
    }
    setFormError(null);
    createAudit.mutate(result.body, {
      onSuccess: () => {
        if (onSuccess) {
          onSuccess();
        } else if (onScheduled) {
          onScheduled();
          onBack();
        } else {
          onBack();
        }
      },
      onError: (err) => setFormError(t(adminErrorKey(err))),
    });
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={A.pageBg} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Back Button First (Matching Figma Image 2) ─── */}
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Icon name="arrow_back" size={20} color={A.ink} />
        </TouchableOpacity>

        {/* ─── Title & Subtitle Next ─── */}
        <Text style={styles.pageTitle}>Schedule New Audit</Text>
        <Text style={styles.pageSubtitle}>
          Assign a scheduled audit to a farmer
        </Text>

        {/* ─── Farmer Search Field ─── */}
        <Text style={styles.fieldLabel}>Farmer</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            placeholder="Search and select a farmer"
            placeholderTextColor={A.muted}
            value={farmer === null ? farmerQuery : farmer.label}
            onChangeText={(text) => {
              setFarmer(null);
              setFarmerQuery(text);
              setFormError(null);
            }}
            editable={canSearchFarmers}
            returnKeyType="search"
          />
          <Icon name="search" size={20} color={A.muted} />
        </View>
        {!canSearchFarmers ? <Text style={styles.noteText}>{t('admin.auditActions.schedule.farmerNoAccess')}</Text> : null}
        {showResults ? (
          <View style={styles.dropdownList}>
            {farmers.items.length === 0 ? (
              <Text style={styles.noteText}>
                {farmers.isLoading ? t('admin.auditActions.schedule.farmerSearching') : t('admin.auditActions.schedule.farmerNone')}
              </Text>
            ) : (
              farmers.items.slice(0, 8).map((f, i, arr) => {
                const label = t('admin.auditActions.schedule.farmerOption', { name: f.name, code: f.farmerCode });
                return (
                  <TouchableOpacity
                    key={f.id}
                    style={[styles.dropdownItem, i === arr.length - 1 && { borderBottomWidth: 0 }]}
                    onPress={() => {
                      setFarmer({ id: f.id, label });
                      setFormError(null);
                    }}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.dropdownItemText}>{label}</Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        ) : null}

        {/* ─── Scheduled Date (Date on left, Calendar Icon on right) ─── */}
        <Text style={styles.fieldLabel}>Scheduled date</Text>
        <TouchableOpacity
          style={[styles.inputRow, showCal && styles.inputRowOpen]}
          onPress={handleDateTap}
          activeOpacity={0.75}
        >
          <Text style={[styles.inputText, { flex: 1 }]}>
            {formatDisplay(selDay, selMonth, selYear)}
          </Text>
          <Icon name="calendar_month" size={20} color={A.body} />
        </TouchableOpacity>

        {showCal && (
          <InlineDatePicker
            day={selDay}
            month={selMonth}
            year={selYear}
            onChange={(d, m, y) => {
              setSelDay(d);
              setSelMonth(m);
              setSelYear(y);
            }}
            onClose={() => setShowCal(false)}
          />
        )}

        {/* ─── Start time (IST; typed like the Schedule Audit form's start time, no default) ─── */}
        <Text style={styles.fieldLabel}>{t('admin.auditActions.schedule.timeLabel')}</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            placeholder={t('admin.auditActions.schedule.timePlaceholder')}
            placeholderTextColor={A.muted}
            value={startTime}
            onChangeText={(text) => {
              setStartTime(text);
              setFormError(null);
            }}
            autoCapitalize="characters"
            maxLength={12}
          />
          <Icon name="schedule" size={20} color={A.body} />
        </View>

        {/* ─── Audit type (the API schedules an INTERNAL or EXTERNAL audit; auditors are not picked here) ─── */}
        <Text style={styles.fieldLabel}>{t('admin.auditActions.schedule.typeLabel')}</Text>
        <TouchableOpacity
          style={[styles.inputRow, typeOpen && styles.inputRowOpen]}
          onPress={handleTypeTap}
          activeOpacity={0.75}
        >
          <Text style={[styles.inputText, { flex: 1 }]}>{t(`admin.auditActions.schedule.type.${auditType}`)}</Text>
          <View style={{ transform: [{ rotate: typeOpen ? '180deg' : '0deg' }] }}>
            <Icon name="expand_more" size={22} color={A.body} />
          </View>
        </TouchableOpacity>

        {typeOpen && (
          <View style={styles.dropdownList}>
            {AUDIT_TYPES.map((type, i) => {
              const active = auditType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.dropdownItem,
                    active && styles.dropdownItemActive,
                    i === AUDIT_TYPES.length - 1 && { borderBottomWidth: 0 },
                  ]}
                  onPress={() => {
                    setAuditType(type);
                    setTypeOpen(false);
                    setFormError(null);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.dropdownItemText, active && styles.dropdownItemTextActive]}>
                    {t(`admin.auditActions.schedule.type.${type}`)}
                  </Text>
                  {active && <Icon name="check" size={16} color={A.orange} />}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {auditType === 'EXTERNAL' ? (
          <>
            <Text style={styles.fieldLabel}>{t('admin.auditActions.schedule.agencyLabel')}</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                placeholder={t('admin.auditActions.schedule.agencyPlaceholder')}
                placeholderTextColor={A.muted}
                value={agency}
                onChangeText={(text) => {
                  setAgency(text);
                  setFormError(null);
                }}
                maxLength={200}
              />
            </View>
          </>
        ) : null}

        {!canSchedule ? <Text style={styles.errorText}>{t('admin.auditActions.schedule.noPermission')}</Text> : null}
        {formError !== null ? <Text style={styles.errorText}>{formError}</Text> : null}

        <View style={{ height: 16 }} />

        {/* ─── Primary CTA Button: Schedule Audit ─── */}
        <TouchableOpacity
          style={[styles.ctaBtn, (!canSchedule || isPending || !timePicked) && styles.ctaBtnDisabled]}
          onPress={handleSchedule}
          disabled={!canSchedule || isPending || !timePicked}
          activeOpacity={0.85}
        >
          <Icon name="calendar_month" size={18} color="#FFFFFF" />
          <Text style={styles.ctaBtnLabel}>{isPending ? t('admin.auditActions.schedule.submitting') : 'Schedule Audit'}</Text>
        </TouchableOpacity>

        <View style={{ height: 36 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: A.pageBg,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
  },

  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: A.cardBg,
    borderWidth: 1,
    borderColor: A.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...CARD_SHADOW,
  },

  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: A.brandRust,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 13,
    color: A.body,
    marginBottom: 22,
    lineHeight: 18,
  },

  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: A.ink,
    marginBottom: 8,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: A.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: A.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 20,
    ...CARD_SHADOW,
  },
  inputRowOpen: {
    borderColor: A.orange,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: A.ink,
    padding: 0,
    margin: 0,
  },
  inputText: {
    fontSize: 14,
    color: A.ink,
    fontWeight: '500',
  },

  typeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  typeCard: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    backgroundColor: A.cardBg,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: A.border,
    paddingVertical: 16,
    ...CARD_SHADOW,
  },
  typeCardActive: {
    borderColor: A.orange,
    backgroundColor: A.orangeLight,
  },
  typeCardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: A.muted,
  },
  typeCardLabelActive: {
    color: A.orange,
    fontWeight: '700',
  },

  dropdownList: {
    backgroundColor: A.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: A.border,
    marginTop: -10,
    marginBottom: 20,
    overflow: 'hidden',
    ...CARD_SHADOW,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: A.divider,
  },
  dropdownItemActive: {
    backgroundColor: A.orangeLight,
  },
  dropdownItemText: {
    flex: 1,
    fontSize: 14,
    color: A.body,
  },
  dropdownItemTextActive: {
    color: A.orange,
    fontWeight: '700',
  },

  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: A.orange,
    borderRadius: 14,
    paddingVertical: 16,
    shadowColor: A.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  ctaBtnDisabled: {
    opacity: 0.5,
  },
  noteText: {
    ...adminType.body,
    color: A.muted,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: {
    ...adminType.body,
    color: adminColors.danger.text,
    marginBottom: 12,
  },
  ctaBtnLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
