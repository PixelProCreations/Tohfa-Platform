import React, { useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

// ─── Palette ──────────────────────────────────────────────────────────────────
const PALETTE = {
  titleRust:     '#8E3314', // Exact deep rust/terracotta
  orange:        '#E85226', // Vibrant orange
  pageBg:        '#FAF8F5', // Warm light cream
  cardBg:        '#FFFFFF',
  ink:           '#1A1412',
  labelMuted:    '#6D6761',
  border:        '#EDE8E0',
  chipBorder:    '#E8E2D8',
  dateBadgeBg:   '#FFF2EB', // Soft peach for date box
  warningBg:     '#FFF5E8', // Soft warm amber
  warningText:   '#785426',
  warningIcon:   '#9A6218',
  auditBadgeBg:  '#EBF5FF',
  auditBadgeText:'#1D6FB8',
  btnBorder:     '#E5DDD4',
  sliderTrack:   '#8C857E',
};

// ─── Types ────────────────────────────────────────────────────────────────────
export type FilterChip = 'All' | 'Ooty' | 'Coonoor' | 'Gudalur' | 'Kotagiri';

export type AuditEntry = {
  id: string;
  day: string;
  month: string;
  farmerName: string;
  location: string;
  farmId: string;
  auditorLabel: string;
  type?: string;
  status?: string;
};

// ─── Static Data Matching Design ──────────────────────────────────────────────
const UPCOMING: AuditEntry[] = [
  {
    id: '1',
    day: '14',
    month: 'Sep',
    farmerName: 'Vijay Anand',
    location: 'Ooty',
    farmId: '#TOHFA-F-00234',
    auditorLabel: 'Auditor: Ravi K.',
    status: 'Audit',
  },
  {
    id: '2',
    day: '17',
    month: 'Sep',
    farmerName: 'Ramasamy S.',
    location: 'Coonoor',
    farmId: '#TOHFA-F-00189',
    auditorLabel: 'Auditor: AgriCert Co.',
    status: 'Audit',
  },
  {
    id: '3',
    day: '19',
    month: 'Sep',
    farmerName: 'Kavitha M.',
    location: 'Gudalur',
    farmId: '#TOHFA-F-00302',
    auditorLabel: 'Auditor: Meena P.',
    status: 'Audit',
  },
];

const ALL_CHIPS: FilterChip[] = ['All', 'Ooty', 'Coonoor', 'Gudalur', 'Kotagiri'];

// ─── SVG Icons ────────────────────────────────────────────────────────────────
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

function PlusIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5v14M5 12h14"
        stroke="#1A1412"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function WarningTriangleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        stroke={PALETTE.warningIcon}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CalendarCheckIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"
        stroke="#1A1412"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 16l2 2 4-4"
        stroke="#1A1412"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SliderLeftArrow() {
  return (
    <Svg width={8} height={8} viewBox="0 0 8 8">
      <Path d="M7 1L2 4l5 3z" fill="#78716C" />
    </Svg>
  );
}

function SliderRightArrow() {
  return (
    <Svg width={8} height={8} viewBox="0 0 8 8">
      <Path d="M1 1l5 3-5 3z" fill="#78716C" />
    </Svg>
  );
}

// ─── Common Audit Badge ───────────────────────────────────────────────────────
function AuditBadge({ label = 'Audit' }: { label?: string }) {
  return (
    <View style={styles.auditBadge}>
      <Text style={styles.auditBadgeText}>{label}</Text>
    </View>
  );
}

// ─── Audit Card ───────────────────────────────────────────────────────────────
function AuditCardItem({
  entry,
  onPress,
}: {
  entry: AuditEntry;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.auditCard}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Date Box */}
      <View style={styles.dateBox}>
        <Text style={styles.dateBoxDay}>{entry.day}</Text>
        <Text style={styles.dateBoxMonth}>{entry.month}</Text>
      </View>

      {/* Middle Text Info */}
      <View style={styles.auditInfoCol}>
        <Text style={styles.farmerNameLine} numberOfLines={1}>
          {entry.farmerName} — {entry.location}
        </Text>
        <Text style={styles.auditSubtitleLine} numberOfLines={2}>
          {entry.farmId} · {entry.auditorLabel}
        </Text>
      </View>

      {/* Common Audit Tag */}
      <AuditBadge label={entry.status ?? 'Audit'} />
    </TouchableOpacity>
  );
}

// ─── Screen Props ─────────────────────────────────────────────────────────────
export interface AuditCalendarScreenProps {
  onBack: () => void;
  onAddAudit?: () => void;
  onSelectAudit?: (entry: AuditEntry) => void;
  onBulkReschedule?: () => void;
  onResolveCompliance?: () => void;
}

// ─── Main Screen Component ────────────────────────────────────────────────────
export function AuditCalendarScreen({
  onBack,
  onAddAudit,
  onSelectAudit,
  onBulkReschedule,
  onResolveCompliance,
}: AuditCalendarScreenProps) {
  const [activeChip, setActiveChip] = useState<FilterChip>('All');

  const filtered = UPCOMING.filter((e) => {
    if (activeChip === 'All') return true;
    return e.location.toLowerCase().includes(activeChip.toLowerCase());
  });

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.pageBg} />

      {/* ─── Top Nav Bar ─── */}
      <View style={styles.navBar}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.navSquareBtn}
          activeOpacity={0.7}
          accessibilityLabel="Go back"
        >
          <BackChevronIcon />
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          onPress={onAddAudit}
          style={styles.navSquareBtn}
          activeOpacity={0.7}
          accessibilityLabel="Add audit"
        >
          <PlusIcon />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Header Titles ─── */}
        <Text style={styles.pageTitle}>Audit Calendar</Text>
        <Text style={styles.pageSubtitle}>
          6 audits scheduled this quarter · 4 audits/year, quarterly
        </Text>

        {/* ─── Filter Chips Row ─── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
          style={styles.chipsScroll}
        >
          {ALL_CHIPS.map((chip) => {
            const active = chip === activeChip;
            return (
              <Pressable
                key={chip}
                style={[
                  styles.filterPill,
                  active ? styles.filterPillActive : styles.filterPillInactive,
                ]}
                onPress={() => setActiveChip(chip)}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    active ? styles.filterPillTextActive : styles.filterPillTextInactive,
                  ]}
                >
                  {chip}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ─── Scroll Track Indicator Bar ─── */}
        <View style={styles.sliderBarRow}>
          <SliderLeftArrow />
          <View style={styles.sliderTrackLine} />
          <SliderRightArrow />
        </View>

        {/* ─── Upcoming Header ─── */}
        <Text style={styles.sectionTitle}>Upcoming</Text>

        {/* ─── Audit Cards Stack ─── */}
        <View style={styles.cardStack}>
          {filtered.map((entry) => (
            <AuditCardItem
              key={entry.id}
              entry={entry}
              onPress={() => onSelectAudit?.(entry)}
            />
          ))}
        </View>

        {/* ─── Overdue Warning Banner ─── */}
        <TouchableOpacity
          style={styles.warningBanner}
          onPress={onResolveCompliance}
          activeOpacity={0.75}
        >
          <View style={styles.warningIconWrap}>
            <WarningTriangleIcon />
          </View>
          <Text style={styles.warningText}>
            7 farms are overdue for this quarter’s audit — window closes in 5 days.
          </Text>
        </TouchableOpacity>

        {/* ─── Bulk Reschedule Audits Button ─── */}
        <TouchableOpacity
          style={styles.bulkBtn}
          onPress={onBulkReschedule}
          activeOpacity={0.75}
        >
          <CalendarCheckIcon />
          <Text style={styles.bulkBtnText}>Bulk Reschedule Audits</Text>
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
    paddingBottom: 24,
  },

  // Top Nav Bar
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    backgroundColor: PALETTE.pageBg,
  },
  navSquareBtn: {
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
  },

  // Header Titles
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
    marginBottom: 16,
    lineHeight: 18,
  },

  // Filter Chips
  chipsScroll: {
    marginBottom: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16,
  },
  filterPill: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: PALETTE.orange,
    borderColor: PALETTE.orange,
  },
  filterPillInactive: {
    backgroundColor: PALETTE.cardBg,
    borderColor: PALETTE.chipBorder,
  },
  filterPillText: {
    fontSize: 13,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterPillTextInactive: {
    color: '#524C46',
    fontWeight: '500',
  },

  // Scroll Slider Track Indicator
  sliderBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
    paddingHorizontal: 2,
  },
  sliderTrackLine: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: PALETTE.sliderTrack,
  },

  // Section Title
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.titleRust,
    marginBottom: 12,
  },

  // Cards Stack
  cardStack: {
    gap: 12,
    marginBottom: 16,
  },

  // Audit Card
  auditCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },

  // Date Box
  dateBox: {
    width: 50,
    height: 52,
    borderRadius: 12,
    backgroundColor: PALETTE.dateBadgeBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dateBoxDay: {
    fontSize: 17,
    fontWeight: '700',
    color: PALETTE.titleRust,
    lineHeight: 20,
  },
  dateBoxMonth: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.orange,
    lineHeight: 14,
  },

  // Info Column
  auditInfoCol: {
    flex: 1,
    paddingRight: 8,
  },
  farmerNameLine: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.ink,
    marginBottom: 3,
  },
  auditSubtitleLine: {
    fontSize: 12,
    color: PALETTE.labelMuted,
    lineHeight: 16,
  },

  // Common Audit Badge
  auditBadge: {
    backgroundColor: PALETTE.auditBadgeBg,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    alignSelf: 'center',
  },
  auditBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: PALETTE.auditBadgeText,
  },

  // Warning Banner
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.warningBg,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 14,
  },
  warningIconWrap: {
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    color: PALETTE.warningText,
    fontWeight: '500',
  },

  // Bulk Reschedule Button
  bulkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 1.2,
    borderColor: PALETTE.btnBorder,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  bulkBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.ink,
  },
});
