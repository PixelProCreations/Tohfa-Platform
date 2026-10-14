import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Icon } from '@tohfa/mobile-ui';
import { InlineDatePicker, formatDisplay } from './ScheduleNewAuditScreen';

// ─── Palette ──────────────────────────────────────────────────────────────────
const PALETTE = {
  titleRust:   '#8E3314',
  orange:      '#E85226',
  orangeLight: '#FFF0EB',
  pageBg:      '#FAF8F5',
  cardBg:      '#FFFFFF',
  ink:         '#1A1412',
  labelMuted:  '#6D6761',
  border:      '#EBE7E0',
  divider:     '#F3EFE9',
  greenBg:     '#EAF2E1',
  greenText:   '#2A572D',
  btnBorder:   '#E2DDD5',
};

// ─── Types ────────────────────────────────────────────────────────────────────
export interface RescheduleAuditItem {
  id: string;
  farmerName: string;
  farmId: string;
  currentDate: string;
  auditor: string;
  location: string;
  scope?: string;
}

export interface BulkRescheduleAuditsScreenProps {
  onBack: () => void;
  onSuccess?: (count: number) => void;
}

// ─── Common Audits Data (No Internal/External Type Distinction) ────────────────
const DEFAULT_AUDITS: RescheduleAuditItem[] = [
  {
    id: 'aud-1',
    farmerName: 'Vijay Anand',
    farmId: '#TOHFA-F-00234',
    currentDate: 'Sep 14, 2026',
    auditor: 'Ravi K.',
    location: 'Zone A - Coimbatore',
    scope: 'Organic Cotton & Millets Certification',
  },
  {
    id: 'aud-2',
    farmerName: 'Karthik Raja',
    farmId: '#TOHFA-F-00189',
    currentDate: 'Sep 15, 2026',
    auditor: 'Ravi K.',
    location: 'Zone B - Pollachi',
    scope: 'Annual PGS Organic Verification',
  },
  {
    id: 'aud-3',
    farmerName: 'Selvi Murugan',
    farmId: '#TOHFA-F-00312',
    currentDate: 'Sep 16, 2026',
    auditor: 'AgriCert Co.',
    location: 'Zone C - Tiruppur',
    scope: 'Traceability & Soil Quality Audit',
  },
  {
    id: 'aud-4',
    farmerName: 'Gopalakrishnan S.',
    farmId: '#TOHFA-F-00445',
    currentDate: 'Sep 17, 2026',
    auditor: 'Meena P.',
    location: 'Zone A - Coimbatore',
    scope: 'Post-Harvest Standards Inspection',
  },
];

const RESCHEDULE_REASONS = [
  'Heavy Rainfall / Weather',
  'Auditor Unavailable',
  'Crop Harvest Delay',
  'Farmer Request',
];

const DATE_SHIFTS = [
  { label: '+3 Days', days: 3 },
  { label: '+7 Days', days: 7 },
  { label: '+14 Days', days: 14 },
  { label: 'Next Month', days: 30 },
];

// ─── Icons ────────────────────────────────────────────────────────────────────
function BackChevronIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 19l-7-7 7-7"
        stroke="#1A1412"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckmarkBoxIcon({ checked }: { checked: boolean }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      {checked ? (
        <>
          <Path
            d="M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6z"
            fill={PALETTE.orange}
          />
          <Path
            d="M7 12.5l3.5 3.5 6.5-6.5"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : (
        <Path
          d="M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6z"
          stroke="#C4BCB4"
          strokeWidth="2"
        />
      )}
    </Svg>
  );
}

function CalendarIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export function BulkRescheduleAuditsScreen({
  onBack,
  onSuccess,
}: BulkRescheduleAuditsScreenProps) {
  const now = new Date();

  // Audit selection & accordion state
  const [selectedIds, setSelectedIds] = useState<string[]>(['aud-1', 'aud-2']);
  const [expandedIds, setExpandedIds] = useState<string[]>(['aud-1']);

  // Reschedule date parameters
  const [dateMode, setDateMode] = useState<'shift' | 'custom'>('shift');
  const [selectedShift, setSelectedShift] = useState<number>(7);

  // Custom date selection
  const [customDay, setCustomDay] = useState<number>(now.getDate());
  const [customMonth, setCustomMonth] = useState<number>(now.getMonth());
  const [customYear, setCustomYear] = useState<number>(now.getFullYear());
  const [showCustomCal, setShowCustomCal] = useState<boolean>(false);

  // Reason & SMS notification
  const [selectedReason, setSelectedReason] = useState<string>(
    RESCHEDULE_REASONS[0] ?? 'Heavy Rainfall / Weather',
  );
  const [notifySms, setNotifySms] = useState<boolean>(true);

  const allSelected = selectedIds.length === DEFAULT_AUDITS.length;

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(DEFAULT_AUDITS.map((a) => a.id));
    }
  }

  function toggleAudit(id: string) {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  }

  function toggleExpand(id: string) {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  function handleConfirmReschedule() {
    if (selectedIds.length === 0) {
      Alert.alert('No Audits Selected', 'Please choose at least one audit to reschedule.');
      return;
    }

    const dateTargetText =
      dateMode === 'custom'
        ? formatDisplay(customDay, customMonth, customYear)
        : `+${selectedShift} days`;

    Alert.alert(
      'Confirm Bulk Reschedule',
      `Reschedule ${selectedIds.length} audits to ${dateTargetText} due to "${selectedReason}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Reschedule',
          onPress: () => {
            Alert.alert(
              'Batch Reschedule Complete',
              `Successfully updated ${selectedIds.length} audits to ${dateTargetText}. Automated notifications have been dispatched to farmers and auditors.`,
              [
                {
                  text: 'OK',
                  onPress: () => {
                    onSuccess?.(selectedIds.length);
                    onBack();
                  },
                },
              ],
            );
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.pageBg} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          activeOpacity={0.7}
          accessibilityLabel="Go back"
        >
          <BackChevronIcon />
        </TouchableOpacity>

        {/* Titles */}
        <Text style={styles.pageTitle}>Bulk Reschedule Audits</Text>
        <Text style={styles.pageSubtitle}>
          Select scheduled inspections to batch update dates and notify auditors
        </Text>

        {/* Selection Bar */}
        <View style={styles.selectionBar}>
          <TouchableOpacity
            style={styles.selectAllBtn}
            onPress={toggleSelectAll}
            activeOpacity={0.7}
          >
            <CheckmarkBoxIcon checked={allSelected} />
            <Text style={styles.selectAllText}>
              {allSelected ? 'Deselect All' : `Select All (${DEFAULT_AUDITS.length} audits)`}
            </Text>
          </TouchableOpacity>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{selectedIds.length} selected</Text>
          </View>
        </View>

        {/* ─── Audit Cards with Accordion (Common for all audits) ─── */}
        <View style={styles.auditList}>
          {DEFAULT_AUDITS.map((item) => {
            const isChecked = selectedIds.includes(item.id);
            const isExpanded = expandedIds.includes(item.id);

            return (
              <View
                key={item.id}
                style={[styles.auditCard, isChecked && styles.auditCardChecked]}
              >
                {/* Header Row: Checkbox on left, Title + Accordion Toggle on right */}
                <View style={styles.cardHeaderRow}>
                  <TouchableOpacity
                    style={styles.checkboxTouchable}
                    onPress={() => toggleAudit(item.id)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <CheckmarkBoxIcon checked={isChecked} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.headerInfoArea}
                    onPress={() => toggleExpand(item.id)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.farmerName}>{item.farmerName}</Text>
                      <Text style={styles.farmIdSubtitle}>
                        {item.farmId} · {item.location}
                      </Text>
                    </View>

                    {/* Accordion Chevron */}
                    <View
                      style={[
                        styles.accordionChevronWrapper,
                        isExpanded && styles.accordionChevronExpanded,
                      ]}
                    >
                      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                        <Path
                          d="M6 9l6 6 6-6"
                          stroke={isExpanded ? PALETTE.orange : PALETTE.labelMuted}
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Collapsible Accordion Content */}
                {isExpanded && (
                  <View style={styles.accordionBody}>
                    <View style={styles.accordionDivider} />

                    <View style={styles.detailsGrid}>
                      <View style={styles.detailCol}>
                        <Text style={styles.detailLabel}>Current Date</Text>
                        <Text style={styles.detailVal}>{item.currentDate}</Text>
                      </View>
                      <View style={styles.detailCol}>
                        <Text style={styles.detailLabel}>Assigned Auditor</Text>
                        <Text style={styles.detailVal}>{item.auditor}</Text>
                      </View>
                    </View>

                    <View style={[styles.detailsGrid, { marginTop: 10 }]}>
                      <View style={styles.detailCol}>
                        <Text style={styles.detailLabel}>Farm Identifier</Text>
                        <Text style={styles.detailVal}>{item.farmId}</Text>
                      </View>
                      <View style={styles.detailCol}>
                        <Text style={styles.detailLabel}>Zone & Location</Text>
                        <Text style={styles.detailVal}>{item.location}</Text>
                      </View>
                    </View>

                    {item.scope && (
                      <View style={styles.scopeRow}>
                        <Text style={styles.scopeLabel}>Audit Scope:</Text>
                        <View style={styles.scopeBadge}>
                          <Text style={styles.scopeBadgeText}>{item.scope}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* ─── Reschedule Parameters Section ─── */}
        <Text style={styles.sectionHeader}>Reschedule Parameters</Text>
        <View style={styles.configCard}>
          {/* Postpone Schedule By Options including Customized Date */}
          <Text style={styles.fieldLabel}>Postpone Schedule By</Text>
          <View style={styles.shiftsGrid}>
            {DATE_SHIFTS.map((shift) => {
              const active = dateMode === 'shift' && selectedShift === shift.days;
              return (
                <TouchableOpacity
                  key={shift.days}
                  style={[styles.shiftChip, active && styles.shiftChipActive]}
                  onPress={() => {
                    setDateMode('shift');
                    setSelectedShift(shift.days);
                    setShowCustomCal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.shiftChipText, active && styles.shiftChipTextActive]}>
                    {shift.label}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Customized Date Option Chip */}
            <TouchableOpacity
              style={[styles.shiftChip, dateMode === 'custom' && styles.shiftChipActive]}
              onPress={() => {
                setDateMode('custom');
                setShowCustomCal(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.shiftChipText, dateMode === 'custom' && styles.shiftChipTextActive]}>
                Custom Date
              </Text>
            </TouchableOpacity>
          </View>

          {/* Customized Date Selector Row & Inline Picker */}
          {dateMode === 'custom' && (
            <View style={styles.customDateContainer}>
              <Text style={[styles.fieldLabel, { marginBottom: 6 }]}>Customized Date</Text>
              <TouchableOpacity
                style={[styles.customDateTrigger, showCustomCal && styles.customDateTriggerActive]}
                onPress={() => setShowCustomCal((v) => !v)}
                activeOpacity={0.75}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.customDateSub}>Selected Date</Text>
                  <Text style={styles.customDateValue}>
                    {formatDisplay(customDay, customMonth, customYear)}
                  </Text>
                </View>
                <View style={styles.calIconBubble}>
                  <Icon name="calendar_month" size={20} color={PALETTE.orange} />
                </View>
              </TouchableOpacity>

              {showCustomCal && (
                <View style={styles.calWrapper}>
                  <InlineDatePicker
                    day={customDay}
                    month={customMonth}
                    year={customYear}
                    onChange={(d, m, y) => {
                      setCustomDay(d);
                      setCustomMonth(m);
                      setCustomYear(y);
                    }}
                    onClose={() => setShowCustomCal(false)}
                  />
                </View>
              )}
            </View>
          )}

          {/* Reason selector */}
          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Reason for Batch Change</Text>
          <View style={styles.reasonsWrap}>
            {RESCHEDULE_REASONS.map((reason) => {
              const active = selectedReason === reason;
              return (
                <TouchableOpacity
                  key={reason}
                  style={[styles.reasonChip, active && styles.reasonChipActive]}
                  onPress={() => setSelectedReason(reason)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.reasonChipText, active && styles.reasonChipTextActive]}>
                    {reason}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* SMS Notification Toggle */}
          <View style={styles.switchRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.switchLabel}>Notify Farmers & Auditors</Text>
              <Text style={styles.switchSub}>Sends automated SMS with updated inspection slot</Text>
            </View>
            <Switch
              value={notifySms}
              onValueChange={setNotifySms}
              trackColor={{ false: '#DDD8D2', true: PALETTE.orange }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <View style={{ height: 16 }} />

        {/* Submit CTA */}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleConfirmReschedule}
          activeOpacity={0.85}
        >
          <CalendarIcon />
          <Text style={styles.submitBtnText}>
            Confirm Batch Reschedule ({selectedIds.length})
          </Text>
        </TouchableOpacity>

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },

  // Back Button
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: PALETTE.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECE8E1',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 14,
  },

  // Titles
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: PALETTE.titleRust,
    marginTop: 18,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  pageSubtitle: {
    fontSize: 13,
    color: PALETTE.labelMuted,
    marginBottom: 18,
    lineHeight: 18,
  },

  // Selection Bar
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  selectAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectAllText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: PALETTE.ink,
  },
  countBadge: {
    backgroundColor: PALETTE.orangeLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.orange,
  },

  // Audit Cards & Accordion
  auditList: {
    gap: 12,
    marginBottom: 24,
  },
  auditCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  auditCardChecked: {
    borderColor: PALETTE.orange,
    backgroundColor: '#FFFDFB',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxTouchable: {
    marginRight: 12,
    padding: 2,
  },
  headerInfoArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  farmerName: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  farmIdSubtitle: {
    fontSize: 12,
    color: PALETTE.labelMuted,
    marginTop: 2,
  },
  accordionChevronWrapper: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F7F4EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  accordionChevronExpanded: {
    backgroundColor: PALETTE.orangeLight,
    transform: [{ rotate: '180deg' }],
  },

  // Accordion Details Body
  accordionBody: {
    marginTop: 10,
  },
  accordionDivider: {
    height: 1,
    backgroundColor: PALETTE.divider,
    marginBottom: 12,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.labelMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  detailVal: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.ink,
    marginTop: 2,
  },
  scopeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F7F4EE',
    gap: 8,
  },
  scopeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.labelMuted,
  },
  scopeBadge: {
    backgroundColor: '#F3EFE9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  scopeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.ink,
  },

  // Parameters Card
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.titleRust,
    marginBottom: 10,
  },
  configCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.ink,
    marginBottom: 8,
  },
  shiftsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  shiftChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: PALETTE.pageBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    minWidth: '22%',
    flexGrow: 1,
  },
  shiftChipActive: {
    backgroundColor: PALETTE.orange,
    borderColor: PALETTE.orange,
  },
  shiftChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.ink,
  },
  shiftChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Customized Date Section
  customDateContainer: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: PALETTE.divider,
  },
  customDateTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  customDateTriggerActive: {
    borderColor: PALETTE.orange,
    backgroundColor: '#FFFBF9',
  },
  customDateSub: {
    fontSize: 11,
    color: PALETTE.labelMuted,
    fontWeight: '500',
  },
  customDateValue: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.ink,
    marginTop: 2,
  },
  calIconBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: PALETTE.orangeLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calWrapper: {
    marginTop: 10,
  },

  // Reasons Chips
  reasonsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reasonChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: PALETTE.pageBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  reasonChipActive: {
    backgroundColor: PALETTE.orangeLight,
    borderColor: PALETTE.orange,
  },
  reasonChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.ink,
  },
  reasonChipTextActive: {
    color: PALETTE.orange,
    fontWeight: '700',
  },

  // Switch Row
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: PALETTE.divider,
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.ink,
  },
  switchSub: {
    fontSize: 11.5,
    color: PALETTE.labelMuted,
    marginTop: 2,
  },

  // CTA
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: PALETTE.orange,
    borderRadius: 14,
    paddingVertical: 16,
    shadowColor: PALETTE.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
