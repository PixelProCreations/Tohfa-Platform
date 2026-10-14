import React from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const PALETTE = {
  titleRust:  '#8E3314',
  orange:     '#E85226',
  pageBg:     '#FAF8F5',
  cardBg:     '#FFFFFF',
  ink:        '#1A1412',
  labelMuted: '#6D6761',
  border:     '#EBE7E0',
  divider:    '#F3EFE9',
  greenBg:    '#EAF2E1',
  greenText:  '#2A572D',
  btnBorder:  '#E2DDD5',
};

export interface AuditDetailRecordScreenProps {
  farmerName?: string;
  farmId?: string;
  quarterTitle?: string;
  date?: string;
  auditor?: string;
  type?: string;
  score?: string;
  record?: any;
  onBack: () => void;
}

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

function CheckmarkIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" fill={PALETTE.greenBg} />
      <Path
        d="M8 12.5l2.5 2.5 5.5-5.5"
        stroke={PALETTE.greenText}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PhotoMockIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="3" stroke="#8E3314" strokeWidth="1.8" />
      <Circle cx="8.5" cy="8.5" r="1.5" fill="#8E3314" />
      <Path
        d="M21 15l-5-5L5 21"
        stroke="#8E3314"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const CRITERIA_BREAKDOWN = [
  { name: 'Soil Nutrition & Organic Matter', score: 8, max: 10, note: 'Optimal humus layer, pH 6.8' },
  { name: 'Water Preservation & Irrigation', score: 7, max: 10, note: 'Micro-drip lines in 95% working order' },
  { name: 'Pest & Biocontrol Practices', score: 8, max: 10, note: 'Zero synthetic residues detected' },
  { name: 'Crop Biodiversity & Cover', score: 7, max: 10, note: 'Legume border crops maintained' },
  { name: 'Field Record Book Keeping', score: 8, max: 10, note: 'Digital harvest dates accurately synced' },
  { name: 'Prior Year Compliance History', score: 8, max: 10, note: 'No pending corrective notices' },
];

export function AuditDetailRecordScreen({
  farmerName = 'Vijay Anand',
  farmId = '#TOHFA-F-00234',
  quarterTitle = 'Q2 2026 Audit — 754/1000',
  date = 'Jun 10, 2026',
  auditor = 'AgriCert Co.',
  type = 'External',
  score = '754 / 1000',
  record,
  onBack,
}: AuditDetailRecordScreenProps) {
  const displayQuarter = record?.title ?? quarterTitle;
  const displayDate = record?.date ?? date;
  const displayAuditor = record?.auditor ?? auditor;
  const displayType = record?.type ?? type;

  function handleExport() {
    Alert.alert(
      'Archive Downloaded Successfully',
      `Full inspection log and photographic evidence for ${displayQuarter} has been downloaded to your device documents folder.`,
      [{ text: 'OK' }],
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
        {/* Nav Back Button */}
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          activeOpacity={0.7}
          accessibilityLabel="Go back"
        >
          <BackChevronIcon />
        </TouchableOpacity>

        <Text style={styles.pageTitle}>Audit Inspection Record</Text>
        <Text style={styles.pageSubtitle}>
          Archived evaluation · {displayQuarter}
        </Text>

        {/* Overview Card */}
        <View style={styles.overviewCard}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.farmerName}>{farmerName}</Text>
              <Text style={styles.farmId}>Farm {farmId} · Zone A</Text>
            </View>
            <View style={styles.badgePass}>
              <CheckmarkIcon />
              <Text style={styles.badgePassText}>Verified</Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.metaGrid}>
            <View style={styles.metaCell}>
              <Text style={styles.metaKey}>Evaluation Date</Text>
              <Text style={styles.metaVal}>{date}</Text>
            </View>
            <View style={styles.metaCell}>
              <Text style={styles.metaKey}>Audit Category</Text>
              <Text style={styles.metaVal}>{type} Certified</Text>
            </View>
            <View style={styles.metaCell}>
              <Text style={styles.metaKey}>Inspector Name</Text>
              <Text style={styles.metaVal}>{auditor}</Text>
            </View>
            <View style={styles.metaCell}>
              <Text style={styles.metaKey}>Overall Result</Text>
              <Text style={[styles.metaVal, { color: PALETTE.greenText }]}>{score}</Text>
            </View>
          </View>
        </View>

        {/* Category Breakdown */}
        <Text style={styles.sectionTitle}>Category Score Breakdown</Text>
        <View style={styles.criteriaCard}>
          {CRITERIA_BREAKDOWN.map((item, idx) => {
            const pct = (item.score / item.max) * 100;
            const isLast = idx === CRITERIA_BREAKDOWN.length - 1;

            return (
              <View key={item.name} style={[styles.criterionItem, !isLast && styles.criterionBorder]}>
                <View style={styles.criterionHeader}>
                  <Text style={styles.criterionName}>{item.name}</Text>
                  <Text style={styles.criterionScore}>{item.score} / {item.max}</Text>
                </View>

                {/* Progress bar */}
                <View style={styles.progressTrack}>
                  <View style={[styles.progressBar, { width: `${pct}%` }]} />
                </View>

                <Text style={styles.criterionNote}>Remark: {item.note}</Text>
              </View>
            );
          })}
        </View>

        {/* Photographic Evidence Section */}
        <Text style={styles.sectionTitle}>Inspector Field Attachments</Text>
        <View style={styles.photosRow}>
          <View style={styles.photoCard}>
            <View style={styles.photoPlaceholder}>
              <PhotoMockIcon />
            </View>
            <Text style={styles.photoCaption}>Plot A - Soil Profile</Text>
            <Text style={styles.photoDate}>Captured {date}</Text>
          </View>
          <View style={styles.photoCard}>
            <View style={styles.photoPlaceholder}>
              <PhotoMockIcon />
            </View>
            <Text style={styles.photoCaption}>Drip Line Pressure Check</Text>
            <Text style={styles.photoDate}>Captured {date}</Text>
          </View>
        </View>

        <View style={{ height: 16 }} />

        {/* Action Button */}
        <TouchableOpacity
          style={styles.exportBtn}
          onPress={handleExport}
          activeOpacity={0.85}
        >
          <Text style={styles.exportBtnText}>Export Complete Historical Log</Text>
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
    marginBottom: 20,
    lineHeight: 18,
  },

  // Overview Card
  overviewCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 22,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  farmerName: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  farmId: {
    fontSize: 12.5,
    color: PALETTE.labelMuted,
    marginTop: 2,
  },
  badgePass: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: PALETTE.greenBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  badgePassText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.greenText,
  },
  cardDivider: {
    height: 1,
    backgroundColor: PALETTE.divider,
    marginVertical: 14,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 12,
  },
  metaCell: {
    width: '50%',
  },
  metaKey: {
    fontSize: 11.5,
    color: PALETTE.labelMuted,
    marginBottom: 2,
  },
  metaVal: {
    fontSize: 13.5,
    fontWeight: '600',
    color: PALETTE.ink,
  },

  // Criteria Section
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.titleRust,
    marginBottom: 12,
  },
  criteriaCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    marginBottom: 22,
  },
  criterionItem: {
    paddingVertical: 14,
  },
  criterionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.divider,
  },
  criterionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  criterionName: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.ink,
    flex: 1,
  },
  criterionScore: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.orange,
    marginLeft: 8,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: PALETTE.divider,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBar: {
    height: '100%',
    backgroundColor: PALETTE.orange,
    borderRadius: 3,
  },
  criterionNote: {
    fontSize: 11.5,
    color: PALETTE.labelMuted,
    fontStyle: 'italic',
  },

  // Photos
  photosRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  photoCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  photoPlaceholder: {
    height: 80,
    backgroundColor: '#FAF0EB',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  photoCaption: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.ink,
  },
  photoDate: {
    fontSize: 10.5,
    color: PALETTE.labelMuted,
    marginTop: 2,
  },

  // CTA
  exportBtn: {
    backgroundColor: PALETTE.orange,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PALETTE.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  exportBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
