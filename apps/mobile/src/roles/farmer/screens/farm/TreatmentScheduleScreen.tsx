import React, { useState } from 'react';
import {
  Alert,
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
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { authPalette as P, colors } from '../../theme';

// ── Icons ────────────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = P.deepGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CloseIcon({ size = 20, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CalendarScheduleIcon({ size = 22, color = P.twAmber800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M12 14v4M10 16h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CheckCircleIcon({ size = 22, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M8.5 12.5l2.5 2.5 5-5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 16, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronLeftIcon({ size = 18, color = P.deepGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightIcon({ size = 18, color = P.deepGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CalendarMiniIcon({ size = 18, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function InfoCircleIcon({ size = 15, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Line x1="12" y1="8" x2="12" y2="8.01" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      <Line x1="12" y1="11" x2="12" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CheckIcon({ size = 18, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 13l4 4L19 7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface TreatmentReminder {
  id: string;
  title: string;
  targetPest?: string | undefined;
  dueDate: string;
  repeat: string;
  status: 'Upcoming' | 'Completed';
  completedDate?: string | undefined;
  notes?: string | undefined;
  linkedDetection?: string | undefined;
}

export interface TreatmentScheduleScreenProps {
  onBack?: () => void;
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
] as const;

function formatDisplayDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = MONTHS_SHORT[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

const INITIAL_REMINDERS: TreatmentReminder[] = [
  {
    id: 'rem-1',
    title: 'Neem Oil Spray – Aphids',
    targetPest: 'Aphids',
    dueDate: '21 Sep 2026',
    repeat: 'Repeats weekly',
    status: 'Upcoming',
    linkedDetection: 'Aphids — Carrot, Zone 1',
  },
  {
    id: 'rem-2',
    title: 'Fungicide Spray – Powdery Mildew',
    targetPest: 'Powdery Mildew',
    dueDate: '24 Sep 2026',
    repeat: 'One-time',
    status: 'Upcoming',
    linkedDetection: 'Powdery Mildew — Beetroot, Zone 2',
  },
  {
    id: 'rem-3',
    title: 'Neem Oil Spray – Aphids',
    targetPest: 'Aphids',
    dueDate: '16 Jul 2026',
    repeat: 'One-time',
    status: 'Completed',
    completedDate: '16 Jul 2026',
    linkedDetection: 'Aphids — Carrot, Zone 1',
  },
];

const LINKED_DETECTION_OPTIONS = [
  'None (General reminder)',
  'Aphids — Carrot, Zone 1',
  'Powdery Mildew — Beetroot, Zone 2',
  'Caterpillar — Cabbage, Zone 3',
];

const REPEAT_OPTIONS = ['One-time', 'Daily', 'Weekly', 'Bi-weekly', 'Monthly'];

export function TreatmentScheduleScreen({ onBack }: TreatmentScheduleScreenProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'Upcoming' | 'Completed'>('Upcoming');
  const [reminders, setReminders] = useState<TreatmentReminder[]>(INITIAL_REMINDERS);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [linkedDetection, setLinkedDetection] = useState('Aphids — Carrot, Zone 1');
  const [isDetectionPickerOpen, setIsDetectionPickerOpen] = useState(false);
  const [treatmentName, setTreatmentName] = useState('');
  const [scheduledDate, setScheduledDate] = useState('21 Sep 2026');
  const [repeatOption, setRepeatOption] = useState('Weekly');
  const [isRepeatPickerOpen, setIsRepeatPickerOpen] = useState(false);
  const [notes, setNotes] = useState('');

  // Dynamic Calendar State
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calDate, setCalDate] = useState<Date>(new Date(2026, 8, 21));
  const [calYear, setCalYear] = useState<number>(2026);
  const [calMonth, setCalMonth] = useState<number>(8);
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);

  const filteredReminders = reminders.filter((r) => r.status === activeTab);

  const handleSaveReminder = () => {
    if (!treatmentName.trim()) {
      Alert.alert('Required Field', 'Please enter a treatment name.');
      return;
    }

    const newReminder: TreatmentReminder = {
      id: `rem-${Date.now()}`,
      title: `${treatmentName.trim()}${linkedDetection.startsWith('None') ? '' : ` – ${linkedDetection.split('—')[0]?.trim() || ''}`}`,
      dueDate: scheduledDate,
      repeat: repeatOption === 'One-time' ? 'One-time' : `Repeats ${repeatOption.toLowerCase()}`,
      status: 'Upcoming',
      linkedDetection: linkedDetection.startsWith('None') ? undefined : linkedDetection,
      notes: notes.trim() || undefined,
    };

    setReminders([newReminder, ...reminders]);
    setIsAddModalOpen(false);
    setTreatmentName('');
    setNotes('');
    setActiveTab('Upcoming');
    Alert.alert('Reminder Added', `Scheduled ${newReminder.title} for ${scheduledDate}.`);
  };

  const handleToggleReminderStatus = (reminder: TreatmentReminder) => {
    const nextStatus: 'Upcoming' | 'Completed' = reminder.status === 'Upcoming' ? 'Completed' : 'Upcoming';
    const updated: TreatmentReminder = {
      ...reminder,
      status: nextStatus,
      completedDate: nextStatus === 'Completed' ? formatDisplayDate(new Date(2026, 8, 21)) : undefined,
    };

    setReminders(reminders.map((r) => (r.id === updated.id ? updated : r)));
    Alert.alert(
      nextStatus === 'Completed' ? 'Treatment Completed' : 'Moved to Upcoming',
      `"${reminder.title}" marked as ${nextStatus.toLowerCase()}.`,
    );
  };

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  const handleApplyDate = () => {
    setScheduledDate(formatDisplayDate(calDate));
    setIsCalendarOpen(false);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top Header ── */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ArrowBackIcon size={20} color={P.deepGreen} />
          </TouchableOpacity>

          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle}>Treatment Schedule</Text>
            <Text style={styles.headerSubtitle}>Next due 21 Sep 2026</Text>
          </View>
        </View>

        {/* ── Filter Tabs ── */}
        <View style={styles.tabRow}>
          {(['Upcoming', 'Completed'] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabPill, isActive && styles.tabPillActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabPillText, isActive && styles.tabPillTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Reminders List ── */}
        <View style={styles.remindersList}>
          {filteredReminders.length > 0 ? (
            filteredReminders.map((item) => {
              const isCompleted = item.status === 'Completed';

              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.reminderCard}
                  activeOpacity={0.85}
                  onPress={() => handleToggleReminderStatus(item)}
                >
                  <View
                    style={[
                      styles.iconBox,
                      isCompleted ? styles.iconBoxCompleted : styles.iconBoxUpcoming,
                    ]}
                  >
                    {isCompleted ? (
                      <CheckCircleIcon size={22} color={colors.brandGreen} />
                    ) : (
                      <CalendarScheduleIcon size={22} color={P.deepGreen} />
                    )}
                  </View>

                  <View style={styles.reminderContent}>
                    <Text style={styles.reminderTitle}>{item.title}</Text>
                    <Text style={styles.reminderSub}>
                      {isCompleted
                        ? `Completed ${item.completedDate || item.dueDate}`
                        : `Due ${item.dueDate} · ${item.repeat}`}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No {activeTab.toLowerCase()} treatment reminders</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── Floating Add Reminder CTA ── */}
      <View style={styles.floatingContainer}>
        <TouchableOpacity
          style={styles.floatingBtn}
          activeOpacity={0.85}
          onPress={() => setIsAddModalOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Add Reminder"
        >
          <Text style={styles.floatingBtnPlus}>+</Text>
          <Text style={styles.floatingBtnText}>Add Reminder</Text>
        </TouchableOpacity>
      </View>

      {/* ── Add Treatment Reminder Modal ── */}
      <Modal
        visible={isAddModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsAddModalOpen(false)}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setIsAddModalOpen(false)}
            >
              <CloseIcon size={20} color={P.twGray700} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Treatment Reminder</Text>
          </View>

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Field 1: Linked Detection */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Linked Detection</Text>
              <TouchableOpacity
                style={styles.dropdownInput}
                activeOpacity={0.8}
                onPress={() => setIsDetectionPickerOpen(true)}
              >
                <Text style={styles.dropdownValue}>{linkedDetection}</Text>
                <ChevronDownIcon size={16} color={P.twGray500} />
              </TouchableOpacity>
              <View style={styles.helperRow}>
                <InfoCircleIcon size={14} color={P.twGray400} />
                <Text style={styles.helperText}>
                  Optional — leave as None for a general reminder not tied to a detection.
                </Text>
              </View>
            </View>

            {/* Field 2: Treatment Name * */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                Treatment Name <Text style={styles.asterisk}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                value={treatmentName}
                onChangeText={setTreatmentName}
                placeholder="e.g. Neem Oil Spray"
                placeholderTextColor={P.twGray400}
              />
            </View>

            {/* Field 3: Scheduled Date * */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                Scheduled Date <Text style={styles.asterisk}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dropdownInput}
                activeOpacity={0.8}
                onPress={() => setIsCalendarOpen(true)}
              >
                <Text style={styles.dropdownValue}>{scheduledDate}</Text>
                <CalendarMiniIcon size={18} color={P.twGray500} />
              </TouchableOpacity>
            </View>

            {/* Field 4: Repeat */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Repeat</Text>
              <TouchableOpacity
                style={styles.dropdownInput}
                activeOpacity={0.8}
                onPress={() => setIsRepeatPickerOpen(true)}
              >
                <Text style={styles.dropdownValue}>{repeatOption}</Text>
                <ChevronDownIcon size={16} color={P.twGray500} />
              </TouchableOpacity>
            </View>

            {/* Field 5: Notes */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Notes</Text>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="Optional notes"
                placeholderTextColor={P.twGray400}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          {/* Modal Bottom Actions */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setIsAddModalOpen(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalSaveBtn}
              activeOpacity={0.85}
              onPress={handleSaveReminder}
            >
              <CheckIcon size={18} color={P.white} />
              <Text style={styles.modalSaveText}>Save Reminder</Text>
            </TouchableOpacity>
          </View>

          {/* ── In-Modal Linked Detection Selector Overlay ── */}
          {isDetectionPickerOpen && (
            <View style={styles.inModalOverlay}>
              <TouchableOpacity
                style={StyleSheet.absoluteFill}
                activeOpacity={1}
                onPress={() => setIsDetectionPickerOpen(false)}
              />
              <View style={styles.pickerCard}>
                <View style={styles.pickerHeader}>
                  <Text style={styles.pickerTitle}>Select Linked Detection</Text>
                  <TouchableOpacity onPress={() => setIsDetectionPickerOpen(false)}>
                    <CloseIcon size={18} color={P.twGray500} />
                  </TouchableOpacity>
                </View>
                {LINKED_DETECTION_OPTIONS.map((opt) => {
                  const isSelected = linkedDetection === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.pickerOption, isSelected && styles.pickerOptionSelected]}
                      onPress={() => {
                        setLinkedDetection(opt);
                        setIsDetectionPickerOpen(false);
                      }}
                    >
                      <Text style={[styles.pickerOptionText, isSelected && styles.pickerOptionTextSelected]}>
                        {opt}
                      </Text>
                      {isSelected && <CheckIcon size={18} color={P.twGreen700} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── In-Modal Repeat Selector Overlay ── */}
          {isRepeatPickerOpen && (
            <View style={styles.inModalOverlay}>
              <TouchableOpacity
                style={StyleSheet.absoluteFill}
                activeOpacity={1}
                onPress={() => setIsRepeatPickerOpen(false)}
              />
              <View style={styles.pickerCard}>
                <View style={styles.pickerHeader}>
                  <Text style={styles.pickerTitle}>Repeat Interval</Text>
                  <TouchableOpacity onPress={() => setIsRepeatPickerOpen(false)}>
                    <CloseIcon size={18} color={P.twGray500} />
                  </TouchableOpacity>
                </View>
                {REPEAT_OPTIONS.map((opt) => {
                  const isSelected = repeatOption === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.pickerOption, isSelected && styles.pickerOptionSelected]}
                      onPress={() => {
                        setRepeatOption(opt);
                        setIsRepeatPickerOpen(false);
                      }}
                    >
                      <Text style={[styles.pickerOptionText, isSelected && styles.pickerOptionTextSelected]}>
                        {opt}
                      </Text>
                      {isSelected && <CheckIcon size={18} color={P.twGreen700} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── In-Modal Dynamic Calendar Overlay ── */}
          {isCalendarOpen && (
            <View style={styles.inModalOverlay}>
              <TouchableOpacity
                style={StyleSheet.absoluteFill}
                activeOpacity={1}
                onPress={() => setIsCalendarOpen(false)}
              />
              <View style={styles.calModalCard}>
                <View style={styles.calHeader}>
                  <Text style={styles.calFieldBadge}>Scheduled Date</Text>
                  <Text style={styles.calSelectedDateTitle}>
                    {calDate.getDate()} {MONTHS_FULL[calDate.getMonth()]} {calDate.getFullYear()}
                  </Text>
                </View>

                {/* Navigation Row */}
                <View style={styles.calMonthNav}>
                  <TouchableOpacity style={styles.calNavBtn} onPress={handlePrevMonth}>
                    <ChevronLeftIcon size={18} color={P.deepGreen} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.calMonthYearBtn}
                    onPress={() => setIsYearPickerOpen(!isYearPickerOpen)}
                  >
                    <Text style={styles.calMonthYearLabel}>
                      {MONTHS_FULL[calMonth]} {calYear}
                    </Text>
                    <ChevronDownIcon size={14} color={P.deepGreen} />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.calNavBtn} onPress={handleNextMonth}>
                    <ChevronRightIcon size={18} color={P.deepGreen} />
                  </TouchableOpacity>
                </View>

                {/* Year Selector or Days Grid */}
                {isYearPickerOpen ? (
                  <View style={styles.yearGridContainer}>
                    <ScrollView style={styles.yearScrollView} showsVerticalScrollIndicator={false}>
                      <View style={styles.yearGrid}>
                        {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => {
                          const isSel = calYear === y;
                          return (
                            <TouchableOpacity
                              key={`yr-${y}`}
                              style={[styles.yearChip, isSel && styles.yearChipActive]}
                              onPress={() => {
                                setCalYear(y);
                                setCalDate(new Date(y, calMonth, Math.min(calDate.getDate(), new Date(y, calMonth + 1, 0).getDate())));
                                setIsYearPickerOpen(false);
                              }}
                            >
                              <Text style={[styles.yearChipText, isSel && styles.yearChipTextActive]}>
                                {y}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </ScrollView>
                  </View>
                ) : (
                  <>
                    <View style={styles.calWeekdaysRow}>
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((wd) => (
                        <Text key={wd} style={styles.calWeekdayText}>
                          {wd}
                        </Text>
                      ))}
                    </View>

                    <View style={styles.calDaysGrid}>
                      {Array.from({ length: new Date(calYear, calMonth, 1).getDay() }).map((_, i) => (
                        <View key={`empty-${i}`} style={styles.calDayCellEmpty} />
                      ))}

                      {Array.from({ length: new Date(calYear, calMonth + 1, 0).getDate() }).map((_, i) => {
                        const day = i + 1;
                        const isSelected =
                          calDate.getFullYear() === calYear &&
                          calDate.getMonth() === calMonth &&
                          calDate.getDate() === day;
                        const isToday =
                          new Date().getFullYear() === calYear &&
                          new Date().getMonth() === calMonth &&
                          new Date().getDate() === day;

                        return (
                          <TouchableOpacity
                            key={`day-${day}`}
                            style={styles.calDayCell}
                            onPress={() => setCalDate(new Date(calYear, calMonth, day))}
                          >
                            <View
                              style={[
                                styles.calDayInner,
                                isSelected && styles.calDayInnerSelected,
                                !isSelected && isToday && styles.calDayInnerToday,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.calDayText,
                                  isSelected && styles.calDayTextSelected,
                                  !isSelected && isToday && styles.calDayTextToday,
                                ]}
                              >
                                {day}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </>
                )}

                {/* Actions */}
                <View style={styles.calFooterActions}>
                  <TouchableOpacity style={styles.calCancelBtn} onPress={() => setIsCalendarOpen(false)}>
                    <Text style={styles.calCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.calApplyBtn} onPress={handleApplyDate}>
                    <Text style={styles.calApplyBtnText}>Apply Date</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: P.lightSurfaceAlt,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 90,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitleCol: {
    marginLeft: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: P.deepGreen,
  },
  headerSubtitle: {
    fontSize: 12,
    color: P.twGray500,
    marginTop: 2,
  },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  tabPill: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
  },
  tabPillActive: {
    backgroundColor: P.deepGreen,
    borderColor: P.deepGreen,
  },
  tabPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: P.twGray700,
  },
  tabPillTextActive: {
    color: P.white,
    fontWeight: '700',
  },

  // Reminders List
  remindersList: {
    gap: 12,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: P.twGray100,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconBoxUpcoming: {
    backgroundColor: P.twGreen50,
  },
  iconBoxCompleted: {
    backgroundColor: P.twGreen100,
  },
  reminderContent: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: P.nearBlack,
    marginBottom: 4,
  },
  reminderSub: {
    fontSize: 12,
    color: P.twGray500,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: P.twGray400,
  },

  // Floating CTA
  floatingContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  floatingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.deepGreen,
    height: 46,
    paddingHorizontal: 22,
    borderRadius: 23,
    shadowColor: P.deepGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    gap: 8,
  },
  floatingBtnPlus: {
    fontSize: 20,
    fontWeight: '700',
    color: P.white,
    lineHeight: 22,
  },
  floatingBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: P.white,
  },

  // In-Modal Overlay
  inModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 30,
  },

  // Modal
  modalSafeArea: {
    flex: 1,
    backgroundColor: P.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: P.deepGreen,
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16,
  },
  formGroup: {
    gap: 6,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: P.twGray700,
  },
  asterisk: {
    color: P.red600,
  },
  dropdownInput: {
    height: 48,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownValue: {
    fontSize: 14,
    fontWeight: '500',
    color: P.nearBlack,
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 2,
  },
  helperText: {
    flex: 1,
    fontSize: 11.5,
    color: P.twGray500,
    lineHeight: 16,
  },
  textInput: {
    height: 48,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: P.nearBlack,
  },
  notesInput: {
    minHeight: 70,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: P.nearBlack,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: P.twGray100,
    gap: 12,
    backgroundColor: P.white,
  },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.twGray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: P.twGray700,
  },
  modalSaveBtn: {
    flex: 1.5,
    height: 48,
    borderRadius: 12,
    backgroundColor: P.deepGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modalSaveText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: P.white,
  },

  // Selection Popups
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  pickerCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: P.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 8,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: P.nearBlack,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 6,
  },
  pickerOptionSelected: {
    backgroundColor: P.twGreen50,
  },
  pickerOptionText: {
    fontSize: 14.5,
    color: P.twGray700,
    fontWeight: '500',
  },
  pickerOptionTextSelected: {
    fontWeight: '700',
    color: P.deepGreen,
  },

  // Calendar
  calModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: P.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  calHeader: {
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
    paddingBottom: 12,
    marginBottom: 14,
  },
  calFieldBadge: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: P.deepGreen,
    marginBottom: 4,
  },
  calSelectedDateTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: P.nearBlack,
  },
  calMonthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  calNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: P.twGray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calMonthYearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: P.twGray100,
  },
  calMonthYearLabel: {
    fontSize: 14.5,
    fontWeight: '700',
    color: P.deepGreen,
  },
  yearGridContainer: {
    height: 180,
  },
  yearScrollView: {
    flex: 1,
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 4,
  },
  yearChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: P.twGray100,
    borderWidth: 1,
    borderColor: P.twGray200,
    minWidth: 64,
    alignItems: 'center',
  },
  yearChipActive: {
    backgroundColor: P.deepGreen,
    borderColor: P.deepGreen,
  },
  yearChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: P.twGray800,
  },
  yearChipTextActive: {
    color: P.white,
    fontWeight: '700',
  },
  calWeekdaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calWeekdayText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: P.twGray400,
  },
  calDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calDayCell: {
    width: '14.28%',
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDayCellEmpty: {
    width: '14.28%',
    height: 38,
  },
  calDayInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDayInnerSelected: {
    backgroundColor: P.deepGreen,
  },
  calDayInnerToday: {
    borderWidth: 1.5,
    borderColor: P.deepGreen,
  },
  calDayText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: P.twGray800,
  },
  calDayTextSelected: {
    fontWeight: '700',
    color: P.white,
  },
  calDayTextToday: {
    color: P.deepGreen,
    fontWeight: '700',
  },
  calFooterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: P.twGray100,
  },
  calCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.twGray300,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.white,
  },
  calCancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: P.twGray700,
  },
  calApplyBtn: {
    flex: 1.4,
    height: 44,
    borderRadius: 12,
    backgroundColor: P.deepGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calApplyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: P.white,
  },
});
