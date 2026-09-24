import React, { useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import type { AuditEntry } from './AuditInspectionScreen';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const PALETTE = {
  titleRust:  '#8E3314', // Rich terracotta/rust from the design
  orange:     '#E85226', // Vibrant CTA orange
  orangeLight:'#FFF0EB',
  pageBg:     '#FAF8F5', // Warm light cream
  cardBg:     '#FFFFFF',
  ink:        '#1A1412',
  labelMuted: '#6D6761',
  border:     '#EBE7E0',
  divider:    '#F3EFE9',
  greenBg:    '#EAF2E1',
  greenText:  '#2A572D',
  btnBorder:  '#E2DDD5',
};

export type AuditReportData = {
  entry: AuditEntry;
  totalScore: number;
  maxScore: number;
  majorViolations: number;
  status?: string;
  date?: string;
  notes?: string;
};

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

function CheckCircleGreenIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9.5" stroke={PALETTE.greenText} strokeWidth="1.8" />
      <Path
        d="M8 12.2l2.6 2.6 5.4-5.4"
        stroke={PALETTE.greenText}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckCircleModalIcon() {
  return (
    <Svg width={44} height={44} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" fill={PALETTE.greenBg} stroke={PALETTE.greenText} strokeWidth="1.5" />
      <Path
        d="M8 12.5l2.8 2.8 5.6-5.6"
        stroke={PALETTE.greenText}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function WarningOrangeIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        stroke={PALETTE.orange}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DocumentPdfIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function HistoryClockIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke="#1A1412" strokeWidth="1.8" />
      <Path
        d="M12 7v5l3 3"
        stroke="#1A1412"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Table Row Component ──────────────────────────────────────────────────────
function TableRow({
  label,
  value,
  isBold = false,
  isLast = false,
}: {
  label: string;
  value: string;
  isBold?: boolean;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text
        style={[styles.rowValue, isBold && styles.rowValueBold]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

// ─── Default Sample Data ──────────────────────────────────────────────────────
const DEFAULT_REPORT: AuditReportData = {
  entry: {
    id: '1',
    day: '14',
    month: 'Sep',
    farmerName: 'Vijay Anand',
    location: 'Ooty',
    farmId: '#TOHFA-F-00234',
    auditorLabel: 'Auditor: Ravi K.',
  },
  totalScore: 782,
  maxScore: 1000,
  majorViolations: 0,
  status: 'COMPLIANT',
  date: 'Sep 14, 2026',
};

// ─── Screen Props ─────────────────────────────────────────────────────────────
export interface AuditReportScreenProps {
  report?: AuditReportData | undefined;
  onBack: () => void;
  onViewHistory?: () => void;
  onNavigateToPdfPreview?: () => void;
  onNavigateToAuditHistory?: () => void;
}

export function AuditReportScreen({
  report = DEFAULT_REPORT,
  onBack,
  onViewHistory,
  onNavigateToPdfPreview,
  onNavigateToAuditHistory,
}: AuditReportScreenProps) {
  const [downloadModalVisible, setDownloadModalVisible] = useState(false);

  const activeReport = report ?? DEFAULT_REPORT;
  const { entry, totalScore, maxScore, majorViolations } = activeReport;
  const noViolation = majorViolations === 0;

  // Clean auditor string (e.g. "Auditor: Ravi K." -> "Ravi K.")
  const auditorName = entry.auditorLabel.replace(/Auditor:\s*/i, '');
  const dateStr = `${entry.month} ${entry.day}, ${entry.year ?? '2026'}`;
  const scoreStr = `${totalScore} / ${maxScore} shown categories`;
  const violationStr = majorViolations === 0 ? '0 — None' : `${majorViolations} found`;

  function handleGeneratePdf() {
    setDownloadModalVisible(true);
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.pageBg} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Back Button (Matching Squircle Standard) */}
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          activeOpacity={0.7}
          accessibilityLabel="Go back"
        >
          <BackChevronIcon />
        </TouchableOpacity>

        {/* Header Titles */}
        <Text style={styles.pageTitle}>Audit Report</Text>
        <Text style={styles.pageSubtitle}>Preview before generating the final PDF</Text>

        {/* Audit Details Card */}
        <View style={styles.infoCard}>
          <TableRow
            label="Farmer"
            value={`${entry.farmerName} \u2014 ${entry.farmId}`}
            isBold
          />
          <TableRow
            label="Location"
            value={entry.location ?? 'Ooty'}
          />
          <TableRow
            label="Auditor"
            value={auditorName}
          />
          <TableRow
            label="Date"
            value={dateStr}
          />
          <TableRow
            label="Total score"
            value={scoreStr}
            isBold
          />
          <TableRow
            label="Major violations"
            value={violationStr}
            isBold
            isLast
          />
        </View>

        {/* Status Callout Banner */}
        <View style={[styles.statusBanner, noViolation ? styles.statusGreen : styles.statusOrange]}>
          <View style={styles.statusIconWrap}>
            {noViolation ? <CheckCircleGreenIcon /> : <WarningOrangeIcon />}
          </View>
          <Text style={[styles.statusText, { color: noViolation ? PALETTE.greenText : PALETTE.orange }]}>
            {noViolation
              ? 'No major violations recorded \u2014 this audit will not trigger a compliance alert.'
              : `${majorViolations} major violation(s) recorded \u2014 compliance alert will be triggered.`}
          </Text>
        </View>

        <View style={{ height: 12 }} />

        {/* CTA 1: Generate Report PDF */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleGeneratePdf}
          activeOpacity={0.85}
        >
          <DocumentPdfIcon />
          <Text style={styles.primaryBtnText}>Generate Report PDF</Text>
        </TouchableOpacity>

        {/* CTA 2: View Farmer Audit History */}
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => (onNavigateToAuditHistory ?? onViewHistory)?.()}
          activeOpacity={0.75}
        >
          <HistoryClockIcon />
          <Text style={styles.secondaryBtnText}>View Farmer Audit History</Text>
        </TouchableOpacity>

        <View style={{ height: 48 }} />
      </ScrollView>

      {/* ─── Report Downloaded Success Pop-up Modal ─── */}
      <Modal
        visible={downloadModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDownloadModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <CheckCircleModalIcon />
            </View>

            <Text style={styles.modalTitle}>Report Downloaded!</Text>
            <Text style={styles.modalMessage}>
              Audit_Report_{entry.farmId.replace('#', '')}_2026.pdf has been downloaded successfully to your device.
            </Text>

            <View style={styles.modalButtonRow}>
              {onNavigateToPdfPreview && (
                <TouchableOpacity
                  style={styles.modalSecondaryBtn}
                  onPress={() => {
                    setDownloadModalVisible(false);
                    onNavigateToPdfPreview();
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalSecondaryBtnText}>Preview PDF</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={() => setDownloadModalVisible(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.modalPrimaryBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  pageSubtitle: {
    fontSize: 13,
    color: PALETTE.labelMuted,
    marginBottom: 20,
    lineHeight: 18,
  },

  // Info Card
  infoCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.divider,
  },
  rowLabel: {
    fontSize: 13,
    color: PALETTE.labelMuted,
    fontWeight: '400',
  },
  rowValue: {
    fontSize: 13,
    color: PALETTE.ink,
    fontWeight: '600',
    textAlign: 'right',
    flexShrink: 1,
    marginLeft: 12,
  },
  rowValueBold: {
    fontWeight: '700',
  },

  // Status Banner
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 14,
  },
  statusGreen: {
    backgroundColor: PALETTE.greenBg,
  },
  statusOrange: {
    backgroundColor: '#FFF0EB',
  },
  statusIconWrap: {
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '500',
  },

  // Primary Button
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: PALETTE.orange,
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 12,
    shadowColor: PALETTE.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  // Secondary Button
  secondaryBtn: {
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
  secondaryBtnText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: PALETTE.ink,
  },

  // Download Modal Popup
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 20, 18, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  modalIconWrap: {
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.ink,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 13.5,
    color: PALETTE.labelMuted,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  modalButtonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  modalSecondaryBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#F7F4EE',
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSecondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.ink,
  },
  modalPrimaryBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: PALETTE.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
