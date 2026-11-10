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
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import { PencilEditIcon } from '../../components/AdminIcons';
import type { Can } from '../../permissions/can';

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

function DocumentFileIcon({ size = 20, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="1.9" strokeLinejoin="round" />
      <Path d="M14 2v6h6" stroke={color} strokeWidth="1.9" strokeLinejoin="round" />
      <Line x1="8" y1="13" x2="16" y2="13" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <Line x1="8" y1="17" x2="13" y2="17" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    </Svg>
  );
}

function LockHistoryIcon({ size = 16, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="11" width="14" height="10" rx="2" stroke={color} strokeWidth="1.9" />
      <Path d="M8 11V7a4 4 0 0 1 8 0v4" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    </Svg>
  );
}

function CloseIcon({ size = 20, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ArrowLeftTriangleIcon({ size = 10, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 10 10" fill="none">
      <Path d="M7 1.5L2.5 5L7 8.5V1.5Z" fill={color} />
    </Svg>
  );
}

function ArrowRightTriangleIcon({ size = 10, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 10 10" fill="none">
      <Path d="M3 1.5L7.5 5L3 8.5V1.5Z" fill={color} />
    </Svg>
  );
}

function VerifiedSealIcon({ size = 24, color = adminColors.success.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth="2" />
      <Path d="M8 12l2.5 2.5 5.5-5.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export const SUB_TABS = [
  'Overview',
  'Farmer',
  'Farm & Land',
  'Certifications',
  'Previous Audits',
  'Documents',
  'Activity',
] as const;

export type AuditDetailSubTab = typeof SUB_TABS[number];

export interface InspectionCategoryItem {
  id: number;
  name: string;
  maxScore: number;
  score: string;
  remarks: string;
  evidence: string;
}

export const INSPECTION_CATEGORIES: InspectionCategoryItem[] = [
  { id: 1, name: '1. Certification', maxScore: 10, score: 'Not scored', remarks: '—', evidence: 'none attached' },
  { id: 2, name: '2. Soil & Land', maxScore: 10, score: 'Not scored', remarks: '—', evidence: 'none attached' },
  { id: 3, name: '3. Farming Practices', maxScore: 10, score: 'Not scored', remarks: '—', evidence: 'none attached' },
  { id: 4, name: '4. Environmental', maxScore: 10, score: 'Not scored', remarks: '—', evidence: 'none attached' },
  { id: 5, name: '5. Produce Quality', maxScore: 10, score: 'Not scored', remarks: '—', evidence: 'none attached' },
  { id: 6, name: '6. Traceability', maxScore: 10, score: 'Not scored', remarks: '—', evidence: 'none attached' },
  { id: 7, name: '7. Social & Labor', maxScore: 10, score: 'Not scored', remarks: '—', evidence: 'none attached' },
  { id: 8, name: '8. Financial', maxScore: 10, score: 'Not scored', remarks: '—', evidence: 'none attached' },
  { id: 9, name: '9. Market Relations', maxScore: 10, score: 'Not scored', remarks: '—', evidence: 'none attached' },
  { id: 10, name: '10. Innovation', maxScore: 10, score: 'Not scored', remarks: '—', evidence: 'none attached' },
];

export interface CertDocInfo {
  title: string;
  docId: string;
  category: string;
  certType?: string;
  status: string;
  validFrom: string;
  validUntil: string;
  issuingBody: string;
  farmPlot: string;
  fileSize: string;
}

export interface AuditDetailsFarmerRecordsScreenProps {
  auditId?: string | undefined;
  can?: Can | undefined;
  role?: string | undefined;
  onBack: () => void;
  onEditSchedule?: (() => void) | undefined;
  onReschedule?: (() => void) | undefined;
  onCancelSchedule?: (() => void) | undefined;
  onOpenFarmerProfile?: ((farmerId?: string) => void) | undefined;
}

export function AuditDetailsFarmerRecordsScreen({
  auditId = 'AUD-2026-0034',
  can,
  role,
  onBack,
  onEditSchedule,
  onReschedule,
  onCancelSchedule,
  onOpenFarmerProfile,
}: AuditDetailsFarmerRecordsScreenProps) {
  // Top level segmented tabs
  const [topTab, setTopTab] = useState<'details' | 'inspection'>('details');

  // Red-flag state matching Image 3, 4, 5
  const [showRedFlagModal, setShowRedFlagModal] = useState(false);
  const [redFlagMinor, setRedFlagMinor] = useState(false);
  const [redFlagMajor, setRedFlagMajor] = useState(false);
  const [redFlagReason, setRedFlagReason] = useState('');
  const [isFlagged, setIsFlagged] = useState(false);
  const [flagReason, setFlagReason] = useState('Water ph not good');

  // Certification Document Popup State
  const [selectedDoc, setSelectedDoc] = useState<CertDocInfo | null>(null);

  const openCertModal = (docTitle: string) => {
    if (docTitle.includes('FMB')) {
      setSelectedDoc({
        title: 'FMB Sketch',
        docId: 'FMB-2026-00124',
        category: 'Land & Plot Survey Document',
        status: 'Verified & On file',
        validFrom: '10 Jan 2024',
        validUntil: 'Perpetual / Active',
        issuingBody: 'Nilgiris District Land Revenue & Survey Office',
        farmPlot: 'Plot PLT-00124-1 · Coonoor',
        fileSize: 'fmb-sketch-1.pdf (2.4 MB)',
      });
    } else if (docTitle.includes('External')) {
      setSelectedDoc({
        title: 'External Audit Document',
        docId: 'EXT-AUD-2026-088',
        category: 'Third-Party Verification Report',
        status: 'Completed & Certified',
        validFrom: '24 Jul 2026',
        validUntil: '24 Jul 2027',
        issuingBody: 'AgriCert Co. Independent Audit Bureau',
        farmPlot: 'All Coonoor plots · Zone A',
        fileSize: 'external-audit-report-jul2026.pdf (4.1 MB)',
      });
    } else {
      setSelectedDoc({
        title: 'PGS Organic Certificate',
        docId: 'CERT-2026-300',
        category: 'Organic Farm Certification',
        certType: 'PGS-India Green/Organic',
        status: 'Expired (Renewal in queue)',
        validFrom: '24 Sep 2025',
        validUntil: '24 Sep 2026',
        issuingBody: 'PGS-India Regional Council / Organic Certification Agency',
        farmPlot: 'Demo plot, Coonoor · Zone A',
        fileSize: 'pgs-organic-cert-2026.pdf (1.8 MB)',
      });
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ── Header Banner Matching Image 1 ── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.headerBackBtn} onPress={onBack} activeOpacity={0.7} accessibilityRole="button">
            <BackArrowIcon />
          </TouchableOpacity>

          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {topTab === 'inspection' ? 'Audit Inspection & Findings' : 'Audit Details & Farmer Records'}
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {topTab === 'inspection' ? 'Meena · Scheduled' : 'Selvi · Coonoor, Zone A · Scheduled'}
            </Text>
          </View>

          {onEditSchedule && (
            <TouchableOpacity
              style={styles.headerEditBtn}
              onPress={onEditSchedule}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Edit schedule"
            >
              <PencilEditIcon size={20} color={adminColors.onBrand} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top Summary Card Matching Image 2 ── */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeaderRow}>
            <Text style={styles.summaryAuditId}>{auditId}</Text>
            <View style={styles.statusBadgeScheduled}>
              <Text style={styles.statusBadgeScheduledText}>Scheduled</Text>
            </View>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Audit type</Text>
            <Text style={styles.tableValue}>Internal</Text>
          </View>
          <View style={styles.tableDivider} />

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Scheduled</Text>
            <Text style={styles.tableValue}>28 Oct 2026, 10:00</Text>
          </View>
          <View style={styles.tableDivider} />

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Farmer</Text>
            <Text style={styles.tableValue}>Meena · FMR-00177</Text>
          </View>
          <View style={styles.tableDivider} />

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Farm / zone</Text>
            <Text style={styles.tableValue}>PLT-00177-1 · Coonoor</Text>
          </View>
          <View style={styles.tableDivider} />

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Assigned auditor</Text>
            <Text style={styles.tableValue}>Priya Nair</Text>
          </View>
          <View style={styles.tableDivider} />

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Supporting participants</Text>
            <Text style={styles.tableValue}>None</Text>
          </View>
          <View style={styles.tableDivider} />

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Audit purpose</Text>
            <Text style={styles.tableValue}>Quarterly audit</Text>
          </View>
          <View style={styles.tableDivider} />

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Last updated</Text>
            <Text style={styles.tableValue}>8 Oct 2026, 09:00 · Demo TOHFA Admin</Text>
          </View>
        </View>

        {/* ── Top Segmented Toggle: Details vs Inspection ── */}
        <View style={styles.segmentedToggleContainer}>
          <TouchableOpacity
            style={[styles.segmentBtn, topTab === 'details' && styles.segmentBtnActive]}
            onPress={() => setTopTab('details')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, topTab === 'details' && styles.segmentTextActive]}>
              Details & Farmer Records
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, topTab === 'inspection' && styles.segmentBtnActive]}
            onPress={() => setTopTab('inspection')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, topTab === 'inspection' && styles.segmentTextActive]}>
              Inspection & Findings
            </Text>
          </TouchableOpacity>
        </View>

        {topTab === 'details' ? (
          <>
            {/* ── SECTION 1: Overview (Image 1) ── */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>Overview</Text>

              <View style={styles.cardContainer}>
                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Schedule</Text>
                  <Text style={styles.tableValue}>16 Oct 2026, 10:00 · 120 min</Text>
                </View>
                <View style={styles.tableDivider} />

                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Audit type</Text>
                  <Text style={styles.tableValue}>Internal</Text>
                </View>
                <View style={styles.tableDivider} />

                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Status</Text>
                  <Text style={styles.tableValue}>Cancelled</Text>
                </View>
                <View style={styles.tableDivider} />

                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Purpose</Text>
                  <Text style={styles.tableValue}>Quarterly audit</Text>
                </View>
                <View style={styles.tableDivider} />

                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Quarter</Text>
                  <Text style={styles.tableValue}>Q4 2026</Text>
                </View>
                <View style={styles.tableDivider} />

                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Lead auditor</Text>
                  <Text style={styles.tableValue}>Priya Nair</Text>
                </View>
                <View style={styles.tableDivider} />

                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>External organization</Text>
                  <Text style={styles.tableValue}>—</Text>
                </View>
                <View style={styles.tableDivider} />

                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Notes</Text>
                  <Text style={styles.tableValue}>—</Text>
                </View>
              </View>
            </View>

            {/* ── SECTION 2: Farmer (Image 1) ── */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>Farmer</Text>

              <View style={styles.cardContainer}>
                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Name</Text>
                  <Text style={styles.tableValue}>Ramesh Kumar</Text>
                </View>
                <View style={styles.tableDivider} />

                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Farmer ID</Text>
                  <Text style={styles.tableValue}>FMR-00124</Text>
                </View>
                <View style={styles.tableDivider} />

                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Farming type</Text>
                  <Text style={styles.tableValue}>Natural</Text>
                </View>
                <View style={styles.tableDivider} />

                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Zone</Text>
                  <Text style={styles.tableValue}>Coonoor</Text>
                </View>
                <View style={styles.tableDivider} />

                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Registered</Text>
                  <Text style={styles.tableValue}>10 Jan 2026</Text>
                </View>
                <View style={styles.tableDivider} />

                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Contact</Text>
                  <Text style={styles.tableValue}>+91 90000 20000</Text>
                </View>

                <View style={styles.linksRow}>
                  <TouchableOpacity onPress={() => onOpenFarmerProfile?.('FMR-00124')} activeOpacity={0.7}>
                    <Text style={styles.boldBrownLink}>Open farmer profile</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => openCertModal('External Audit')} activeOpacity={0.7}>
                    <Text style={styles.boldBrownLink}>External audit records</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.sectionCaption}>Read from Farmers Management; nothing is copied here.</Text>
            </View>

            {/* ── SECTION 3: Farm & Land (Image 2) ── */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>Farm & Land</Text>

              <View style={styles.cardContainer}>
                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Farm location</Text>
                  <Text style={styles.tableValue}>Demo plot, Coonoor</Text>
                </View>
                <View style={styles.tableDivider} />

                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>FMB sketch</Text>
                  <Text style={styles.tableValue}>fmb-sketch-1.pdf</Text>
                </View>
                <View style={styles.tableDivider} />

                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Plot PLT-00124-1</Text>
                  <Text style={styles.tableValue}>1 acre</Text>
                </View>
                <View style={styles.tableDivider} />

                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Plot PLT-00124-2</Text>
                  <Text style={styles.tableValue}>0.5 acre</Text>
                </View>
              </View>
              <Text style={styles.sectionCaption}>Land information is shown as recorded in Farmers Management.</Text>
            </View>

            {/* ── SECTION 4: Certifications (Image 2) ── */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>Certifications</Text>

              <View style={styles.cardContainer}>
                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Certification type</Text>
                  <Text style={styles.tableValue}>PGS Organic</Text>
                </View>
                <View style={styles.tableDivider} />

                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Status</Text>
                  <Text style={styles.tableValue}>Expired</Text>
                </View>
                <View style={styles.tableDivider} />

                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Certified date</Text>
                  <Text style={styles.tableValue}>24 Sep 2025</Text>
                </View>
                <View style={styles.tableDivider} />

                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Renewal / expiry date</Text>
                  <Text style={styles.tableValue}>24 Sep 2026</Text>
                </View>
                <View style={styles.tableDivider} />

                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Document reference</Text>
                  <Text style={styles.tableValue}>CERT-2026-300</Text>
                </View>
                <View style={styles.tableDivider} />

                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Verification status</Text>
                  <Text style={styles.tableValue}>Verified</Text>
                </View>

                <TouchableOpacity
                  style={styles.singleLinkContainer}
                  onPress={() => openCertModal('PGS Organic Certificate')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.boldBrownLink}>Open certification record</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.sectionCaption}>An external audit report is kept separately and does not change this certification.</Text>

              {/* Document 1: FMB Sketch with View Button */}
              <View style={styles.documentCard}>
                <View style={styles.docLeftCol}>
                  <DocumentFileIcon />
                  <View style={styles.docTextGroup}>
                    <Text style={styles.docTitle}>FMB Sketch</Text>
                    <Text style={styles.docSub}>On file</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.viewDocBtn}
                  onPress={() => openCertModal('FMB Sketch')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewDocBtnText}>View</Text>
                </TouchableOpacity>
              </View>

              {/* Document 2: PGS Organic Certificate with View Button */}
              <View style={styles.documentCard}>
                <View style={styles.docLeftCol}>
                  <DocumentFileIcon />
                  <View style={styles.docTextGroup}>
                    <Text style={styles.docTitle}>PGS Organic Certificate</Text>
                    <Text style={styles.docSub}>On file</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.viewDocBtn}
                  onPress={() => openCertModal('PGS Organic Certificate')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewDocBtnText}>View</Text>
                </TouchableOpacity>
              </View>

              {/* External Audit Document Section */}
              <Text style={styles.subSectionHeading}>External Audit Document</Text>
              <View style={styles.documentCard}>
                <View style={styles.docLeftCol}>
                  <DocumentFileIcon />
                  <View style={styles.docTextGroup}>
                    <Text style={styles.docTitle}>External Audit</Text>
                    <Text style={styles.docSub}>On file</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.viewDocBtn}
                  onPress={() => openCertModal('External Audit')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewDocBtnText}>View</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── SECTION 5: Previous Audits (Image 2) ── */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>Previous Audits</Text>
              <View style={styles.previousAuditsList}>
                <View style={styles.prevAuditCard}>
                  <Text style={styles.prevAuditTitle}>AUD-2026-0003 · External</Text>
                  <Text style={styles.prevAuditMeta}>24 Jul 2026 · 1 major, 1 minor</Text>
                  <Text style={styles.prevAuditStatus}>Audit completed as scheduled.</Text>
                </View>

                <View style={styles.prevAuditCard}>
                  <View style={styles.prevAuditTopRow}>
                    <Text style={styles.prevAuditTitle}>AUD-2026-0002 · Internal</Text>
                    <Text style={styles.prevAuditScore}>87/100</Text>
                  </View>
                  <Text style={styles.prevAuditMeta}>21 Apr 2026 · 1 major, 1 minor</Text>
                  <Text style={styles.prevAuditStatus}>Audit completed as scheduled.</Text>
                </View>

                <View style={styles.prevAuditCard}>
                  <Text style={styles.prevAuditTitle}>AUD-2026-0001 · External</Text>
                  <Text style={styles.prevAuditMeta}>18 Jan 2026 · 1 major, 1 minor</Text>
                  <Text style={styles.prevAuditStatus}>Audit completed as scheduled.</Text>
                </View>
              </View>
            </View>

            {/* ── SECTION 6: Documents (Image 3) ── */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>Documents</Text>
              <View style={styles.cardContainer}>
                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Farmer record</Text>
                  <Text style={styles.tableValue}>Identity proof</Text>
                </View>
                <View style={styles.tableDivider} />

                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Farmer record</Text>
                  <Text style={styles.tableValue}>Land ownership proof</Text>
                </View>
                <View style={styles.tableDivider} />

                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Farmer record</Text>
                  <Text style={styles.tableValue}>Soil report</Text>
                </View>
              </View>
              <Text style={styles.sectionCaption}>Farmer records are read from Farmers Management. Audit evidence is attached during the inspection.</Text>
            </View>

            {/* ── SECTION 7: Category Scores (Image 3) ── */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>Category Scores</Text>
              <View style={styles.cardContainer}>
                {[
                  { name: 'Certification & Compliance', score: '8/10' },
                  { name: 'Soil & Land Management', score: '7/10' },
                  { name: 'Farming Practices', score: '8/10' },
                  { name: 'Environmental Sustainability', score: '7/10' },
                  { name: 'Produce Quality & Yield', score: '8/10' },
                  { name: 'Traceability & Transparency', score: '9/10' },
                  { name: 'Social & Labor Practices', score: '7/10' },
                  { name: 'Financial & Operational', score: '8/10' },
                  { name: 'Market & Buyer Relations', score: '8/10' },
                  { name: 'Innovation & Improvement', score: '8/10' },
                ].map((item, idx, arr) => (
                  <React.Fragment key={item.name}>
                    <View style={styles.tableRow}>
                      <Text style={styles.tableLabel}>{item.name}</Text>
                      <Text style={styles.tableValue}>{item.score}</Text>
                    </View>
                    {idx < arr.length - 1 && <View style={styles.tableDivider} />}
                  </React.Fragment>
                ))}
              </View>
            </View>

            {/* ── SECTION 8: Corrective actions (Image 3) ── */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>Corrective actions</Text>
              <View style={styles.cardContainer}>
                <View style={styles.correctiveActionTopRow}>
                  <Text style={styles.correctiveActionCode}>CA-2026-0001</Text>
                  <View style={styles.closedBadge}>
                    <Text style={styles.closedBadgeText}>Closed</Text>
                  </View>
                </View>
                <Text style={styles.correctiveActionMeta}>
                  Audit AUD-2026-0001 · Finding FND-2026-0002
                </Text>
                <Text style={styles.correctiveActionMeta}>
                  Correct: produce quality
                </Text>
                <Text style={styles.correctiveActionMeta}>
                  Responsible Ramesh Kumar · Due 17 Feb 2026
                </Text>
                <Text style={styles.correctiveActionMeta}>
                  Completion evidence completion-1.jpg
                </Text>
                <Text style={styles.correctiveActionMeta}>
                  Review outcome Accepted · Closed 14 Feb 2026
                </Text>
              </View>
            </View>

            {/* ── SECTION 9: Red flag (Image 3) ── */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>Red flag</Text>
              <View style={styles.cardContainer}>
                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Status</Text>
                  <Text style={styles.tableValue}>{isFlagged ? 'Red-flagged' : 'Not flagged'}</Text>
                </View>
                <View style={styles.tableDivider} />

                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Reason</Text>
                  <Text style={styles.tableValue}>{isFlagged ? flagReason : '—'}</Text>
                </View>
                <View style={styles.tableDivider} />

                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Action taken by</Text>
                  <Text style={styles.tableValue}>TOHFA Admin</Text>
                </View>
                <View style={styles.tableDivider} />

                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Timestamp</Text>
                  <Text style={styles.tableValue}>14 Oct 2026, 10:00</Text>
                </View>
                <View style={styles.tableDivider} />

                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Minor Findings</Text>
                  <Text style={styles.tableValue}>1</Text>
                </View>
                <View style={styles.tableDivider} />

                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Major findings</Text>
                  <Text style={styles.tableValue}>0</Text>
                </View>

                {/* Log history cards */}
                <View style={styles.redFlagHistoryCard}>
                  <Text style={styles.redFlagHistoryMeta}>14 Oct 2026, 10:00 · TOHFA Admin</Text>
                  <Text style={styles.redFlagHistoryTitle}>Red-flagged: Water ph not good</Text>
                  <View style={styles.redFlagActionBtnRow}>
                    <TouchableOpacity
                      style={styles.flagEditBtn}
                      onPress={() => setShowRedFlagModal(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.flagEditBtnText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.flagClearBtn}
                      onPress={() => setIsFlagged(false)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.flagClearBtnText}>Clear flag</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.redFlagHistoryCard}>
                  <Text style={styles.redFlagHistoryMeta}>14 Oct 2026, 10:00 · TOHFA Admin</Text>
                  <Text style={styles.redFlagHistoryTitle}>Red-flagged:</Text>
                  <View style={styles.redFlagActionBtnRow}>
                    <TouchableOpacity
                      style={styles.flagEditBtn}
                      onPress={() => setShowRedFlagModal(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.flagEditBtnText}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.redFlagDashedBtn}
                onPress={() => setShowRedFlagModal(true)}
                activeOpacity={0.75}
              >
                <Text style={styles.redFlagDashedBtnText}>Red-flag Audit</Text>
              </TouchableOpacity>
            </View>

            {/* ── SECTION 10: Activity (Image 4) ── */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>Activity</Text>
              <View style={styles.activityList}>
                <View style={styles.activityCard}>
                  <Text style={styles.activityMeta}>14 Oct 2026, 10:00 · Demo TOHFA Admin</Text>
                  <Text style={styles.activityState}>Cancelled</Text>
                  <Text style={styles.activityNote}>hihhvih</Text>
                </View>

                <View style={styles.activityCard}>
                  <Text style={styles.activityMeta}>26 Sep 2026, 09:00 · Demo TOHFA Admin</Text>
                  <Text style={styles.activityState}>Scheduled</Text>
                  <Text style={styles.activityNote}>Audit scheduled for 16 Oct 2026</Text>
                </View>

                <View style={styles.historyNoticeCard}>
                  <LockHistoryIcon />
                  <Text style={styles.historyNoticeText}>The history is append-only.</Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          /* ── INSPECTION & FINDINGS TAB CONTENT (Images 1 - 4) ── */
          <View style={styles.inspectionContainer}>
            {/* 1. Audit Information Card Matching Image 1 */}
            <View style={styles.cardContainer}>
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Audit</Text>
                <Text style={styles.tableValue}>{auditId}</Text>
              </View>
              <View style={styles.tableDivider} />

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Farmer and farm</Text>
                <Text style={styles.tableValue}>Meena · PLT-00177-1</Text>
              </View>
              <View style={styles.tableDivider} />

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Audit type</Text>
                <Text style={styles.tableValue}>Internal</Text>
              </View>
              <View style={styles.tableDivider} />

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Audit date</Text>
                <Text style={styles.tableValue}>28 Oct 2026</Text>
              </View>
              <View style={styles.tableDivider} />

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Lead auditor</Text>
                <Text style={styles.tableValue}>Priya Nair</Text>
              </View>
              <View style={styles.tableDivider} />

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Status</Text>
                <Text style={styles.tableValue}>Scheduled</Text>
              </View>
            </View>

            {/* 2. Categories Section (10 x 10 points) Matching Images 1, 2, 3 */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>Categories (10 × 10 points)</Text>
              <Text style={styles.sectionCaption}>
                Checklist questions come from the approved checklist, which was not supplied, so none are shown or invented. Scores are whole numbers from 0 to 10 (to confirm).
              </Text>

              <View style={styles.categoriesList}>
                {INSPECTION_CATEGORIES.map((cat) => (
                  <View key={cat.id} style={styles.categoryCard}>
                    <View style={styles.categoryCardTopRow}>
                      <Text style={styles.categoryCardTitle}>{cat.name}</Text>
                      <Text style={styles.categoryMaxPoints}>max {cat.maxScore}</Text>
                    </View>
                    <View style={styles.categoryDashedDivider} />

                    <View style={styles.tableRow}>
                      <Text style={styles.tableLabel}>Score</Text>
                      <Text style={styles.tableValue}>{cat.score}</Text>
                    </View>
                    <View style={styles.categoryDashedDivider} />

                    <View style={styles.tableRow}>
                      <Text style={styles.tableLabel}>Remarks</Text>
                      <Text style={styles.tableValue}>{cat.remarks}</Text>
                    </View>
                    <View style={styles.categoryDashedDivider} />

                    <Text style={styles.categoryEvidenceText}>Evidence: {cat.evidence}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 3. Findings and Violations Section Matching Image 4 */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>Findings and violations</Text>
              <Text style={styles.sectionCaption}>No finding is logged.</Text>

              <View style={styles.metricTilesRow}>
                <View style={styles.metricTile}>
                  <Text style={styles.metricTileTitle}>Major findings</Text>
                  <Text style={styles.metricTileValue}>0</Text>
                </View>

                <View style={styles.metricTile}>
                  <Text style={styles.metricTileTitle}>Minor findings</Text>
                  <Text style={styles.metricTileValue}>0</Text>
                </View>
              </View>
            </View>

            {/* 4. Audit Summary Section Matching Image 4 */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>Audit summary</Text>

              <View style={styles.cardContainer}>
                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Total score</Text>
                  <Text style={styles.tableValue}>0 / 100</Text>
                </View>
                <View style={styles.tableDivider} />

                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Categories scored</Text>
                  <Text style={styles.tableValue}>0 of 10</Text>
                </View>
                <View style={styles.tableDivider} />

                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Major findings</Text>
                  <Text style={styles.tableValue}>0</Text>
                </View>
                <View style={styles.tableDivider} />

                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Minor findings</Text>
                  <Text style={styles.tableValue}>0</Text>
                </View>
                <View style={styles.tableDivider} />

                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Evidence count</Text>
                  <Text style={styles.tableValue}>0</Text>
                </View>
                <View style={styles.tableDivider} />

                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Compliance tier</Text>
                  <Text style={styles.tableValue}>After finalizing</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Bottom Action Buttons Matching Images ── */}
      {topTab === 'details' && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.editScheduleBtn}
            onPress={onEditSchedule}
            activeOpacity={0.8}
          >
            <Text style={styles.editScheduleBtnText}>Edit schedule</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.rescheduleBtn}
            onPress={onReschedule}
            activeOpacity={0.8}
          >
            <Text style={styles.rescheduleBtnText}>Reschedule</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onCancelSchedule}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          CERTIFICATION DOCUMENT PREVIEW POPUP MODAL WITH CLOSE BUTTON
         ════════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={selectedDoc !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedDoc(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setSelectedDoc(null)}
          />

          <View style={styles.modalSheet}>
            {/* Modal Header with Close Button */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <VerifiedSealIcon />
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {selectedDoc?.title}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setSelectedDoc(null)}
                activeOpacity={0.7}
                style={styles.modalCloseIconBtn}
                accessibilityRole="button"
                accessibilityLabel="Close popup"
              >
                <CloseIcon />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContentScroll} showsVerticalScrollIndicator={false}>
              {/* Document Overview Box */}
              <View style={styles.docOverviewBox}>
                <View style={styles.docBadgeRow}>
                  <Text style={styles.docRefCode}>{selectedDoc?.docId}</Text>
                  <View style={styles.docVerifiedPill}>
                    <Text style={styles.docVerifiedPillText}>{selectedDoc?.status}</Text>
                  </View>
                </View>

                <View style={styles.modalTableRow}>
                  <Text style={styles.modalTableLabel}>Category</Text>
                  <Text style={styles.modalTableValue}>{selectedDoc?.category}</Text>
                </View>
                <View style={styles.modalTableDivider} />

                {selectedDoc?.certType ? (
                  <>
                    <View style={styles.modalTableRow}>
                      <Text style={styles.modalTableLabel}>Standard</Text>
                      <Text style={styles.modalTableValue}>{selectedDoc?.certType}</Text>
                    </View>
                    <View style={styles.modalTableDivider} />
                  </>
                ) : null}

                <View style={styles.modalTableRow}>
                  <Text style={styles.modalTableLabel}>Valid From</Text>
                  <Text style={styles.modalTableValue}>{selectedDoc?.validFrom}</Text>
                </View>
                <View style={styles.modalTableDivider} />

                <View style={styles.modalTableRow}>
                  <Text style={styles.modalTableLabel}>Valid Until</Text>
                  <Text style={styles.modalTableValue}>{selectedDoc?.validUntil}</Text>
                </View>
                <View style={styles.modalTableDivider} />

                <View style={styles.modalTableRow}>
                  <Text style={styles.modalTableLabel}>Issuing Body</Text>
                  <Text style={styles.modalTableValue}>{selectedDoc?.issuingBody}</Text>
                </View>
                <View style={styles.modalTableDivider} />

                <View style={styles.modalTableRow}>
                  <Text style={styles.modalTableLabel}>Farm / Plot</Text>
                  <Text style={styles.modalTableValue}>{selectedDoc?.farmPlot}</Text>
                </View>
              </View>

              {/* Verified Digital Certificate Seal Card */}
              <View style={styles.digitalSealCard}>
                <DocumentFileIcon size={24} color={adminColors.brand} />
                <View style={styles.digitalSealTextCol}>
                  <Text style={styles.digitalSealTitle}>Attached File Record</Text>
                  <Text style={styles.digitalSealSub}>{selectedDoc?.fileSize}</Text>
                  <Text style={styles.digitalSealStatus}>Official copy stored in TOHFA Secure Vault</Text>
                </View>
              </View>
            </ScrollView>

            {/* Bottom Modal Close Button */}
            <TouchableOpacity
              style={styles.modalBottomCloseBtn}
              onPress={() => setSelectedDoc(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalBottomCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ════════════════════════════════════════════════════════════════════════
          M3-S03a · RED-FLAG POPUP MODAL (Matching Image 5)
         ════════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showRedFlagModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRedFlagModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowRedFlagModal(false)}
          />

          <View style={styles.redFlagSheet}>
            <Text style={styles.redFlagSheetTitle}>Red-flag this audit?</Text>

            {/* Audit info box */}
            <View style={styles.redFlagAuditBox}>
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Audit</Text>
                <Text style={styles.redFlagBoldVal}>{auditId}</Text>
              </View>
              <View style={styles.tableDivider} />

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Farm</Text>
                <Text style={styles.redFlagBoldVal}>Ramesh Kumar Farm</Text>
              </View>
              <View style={styles.tableDivider} />

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Minor Findings</Text>
                <Text style={styles.redFlagBoldVal}>1</Text>
              </View>
              <View style={styles.tableDivider} />

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Major Findings</Text>
                <Text style={styles.redFlagBoldVal}>0</Text>
              </View>
            </View>

            {/* Checkboxes */}
            <View style={styles.checkboxRow}>
              <TouchableOpacity
                style={styles.checkboxItem}
                onPress={() => setRedFlagMinor(!redFlagMinor)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkboxBox, redFlagMinor && styles.checkboxBoxChecked]}>
                  {redFlagMinor && <Text style={styles.checkboxCheckmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Minor Findings</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxItem}
                onPress={() => setRedFlagMajor(!redFlagMajor)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkboxBox, redFlagMajor && styles.checkboxBoxChecked]}>
                  {redFlagMajor && <Text style={styles.checkboxCheckmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Major Findings</Text>
              </TouchableOpacity>
            </View>

            {/* Reason input */}
            <Text style={styles.inputLabelRequired}>Reason *</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Enter reason for red-flagging this audit..."
              placeholderTextColor={adminColors.muted}
              multiline
              numberOfLines={4}
              value={redFlagReason}
              onChangeText={setRedFlagReason}
            />

            {/* Action buttons */}
            <View style={styles.redFlagModalBtnRow}>
              <TouchableOpacity
                style={styles.submitRedFlagBtn}
                onPress={() => {
                  setIsFlagged(true);
                  if (redFlagReason.trim()) setFlagReason(redFlagReason.trim());
                  setShowRedFlagModal(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.submitRedFlagBtnText}>Red-flag Audit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelRedFlagBtn}
                onPress={() => setShowRedFlagModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelRedFlagBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    ...adminType.title,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  headerSubtitle: {
    ...adminType.caption,
    fontSize: 12,
    lineHeight: 15,
    color: adminColors.onBrand,
    opacity: 0.9,
    marginTop: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl * 2,
  },

  // Summary Card (Image 2)
  summaryCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
    marginBottom: adminSpacing.md,
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryAuditId: {
    ...adminType.rowTitle,
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.ink,
  },
  statusBadgeScheduled: {
    backgroundColor: adminColors.info.bg,
    borderRadius: adminRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadgeScheduledText: {
    ...adminType.caption,
    fontSize: 11,
    fontWeight: '700',
    color: adminColors.info.text,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  tableLabel: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
  },
  tableValue: {
    ...adminType.body,
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.ink,
  },
  tableDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    opacity: 0.5,
  },

  // Segmented Toggle
  segmentedToggleContainer: {
    flexDirection: 'row',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 3,
    marginBottom: adminSpacing.md,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: adminRadius.md,
  },
  segmentBtnActive: {
    backgroundColor: adminColors.brand,
  },
  segmentText: {
    ...adminType.caption,
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.ink,
  },
  segmentTextActive: {
    color: adminColors.onBrand,
  },

  // Sub Navigation Pills
  subPillsScrollContainer: {
    marginBottom: adminSpacing.md,
  },
  subPillsRow: {
    flexDirection: 'row',
    columnGap: 8,
  },
  subPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
  },
  subPillActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  subPillText: {
    ...adminType.caption,
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.ink,
  },
  subPillTextActive: {
    color: adminColors.onBrand,
  },

  // Slider Controls Matching Screenshot
  sliderControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 2,
  },
  sliderArrowBtn: {
    width: 22,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderTrack: {
    flex: 1,
    height: 6,
    backgroundColor: adminColors.border,
    borderRadius: adminRadius.full,
    marginHorizontal: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  sliderThumb: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: adminColors.muted,
    borderRadius: adminRadius.full,
  },

  // Section Blocks
  sectionBlock: {
    marginBottom: adminSpacing.lg,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.xs,
  },
  subSectionHeading: {
    ...adminType.sectionHead,
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.xs,
  },
  cardContainer: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  sectionCaption: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    marginTop: 4,
  },
  linksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  singleLinkContainer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  boldBrownLink: {
    ...adminType.caption,
    fontSize: 12.5,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },

  // Document Cards with View Button
  documentCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    ...adminShadow.sm,
  },
  docLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
    flex: 1,
  },
  docTextGroup: {
    flex: 1,
  },
  docTitle: {
    ...adminType.rowTitle,
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.ink,
  },
  docSub: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
  },
  viewDocBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.brandDeep,
    backgroundColor: adminColors.card,
  },
  viewDocBtnText: {
    ...adminType.caption,
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },

  // Previous Audits Cards
  previousAuditsList: {
    rowGap: 8,
  },
  prevAuditCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  prevAuditTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prevAuditTitle: {
    ...adminType.rowTitle,
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.ink,
  },
  prevAuditScore: {
    ...adminType.rowTitle,
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.ink,
  },
  prevAuditMeta: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    marginTop: 2,
  },
  prevAuditStatus: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    marginTop: 2,
  },

  // Activity Cards
  activityList: {
    rowGap: 8,
  },
  activityCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  activityMeta: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
  },
  activityState: {
    ...adminType.rowTitle,
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.ink,
    marginTop: 3,
  },
  activityNote: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
  },
  historyNoticeCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: adminColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },
  historyNoticeText: {
    ...adminType.caption,
    fontSize: 11.5,
    color: adminColors.muted,
  },

  // Inspection & Findings Styles (Images 1 - 4)
  inspectionContainer: {
    rowGap: adminSpacing.md,
  },
  categoriesList: {
    rowGap: 10,
    marginTop: 8,
  },
  categoryCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  categoryCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 6,
  },
  categoryCardTitle: {
    ...adminType.rowTitle,
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.ink,
  },
  categoryMaxPoints: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
  },
  categoryDashedDivider: {
    height: 1,
    borderWidth: 0.8,
    borderColor: adminColors.border,
    borderStyle: 'dashed',
    marginVertical: 4,
  },
  categoryEvidenceText: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    paddingTop: 4,
  },
  metricTilesRow: {
    flexDirection: 'row',
    columnGap: 10,
    marginTop: 8,
  },
  metricTile: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  metricTileTitle: {
    ...adminType.caption,
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 6,
  },
  metricTileValue: {
    ...adminType.title,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '800',
    color: adminColors.ink,
  },

  // Bottom Sticky Buttons (Images 2-5)
  bottomBar: {
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 10,
    flexDirection: 'row',
    columnGap: 8,
  },
  editScheduleBtn: {
    flex: 1.2,
    height: 44,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editScheduleBtnText: {
    ...adminType.rowTitle,
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  rescheduleBtn: {
    flex: 1.1,
    height: 44,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rescheduleBtnText: {
    ...adminType.rowTitle,
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },
  cancelBtn: {
    flex: 0.9,
    height: 44,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.danger.text,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    ...adminType.rowTitle,
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.danger.text,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: adminOverlay.scrim,
  },
  modalBackdrop: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: adminRadius.xl,
    borderTopRightRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.md,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
    flex: 1,
  },
  modalTitle: {
    ...adminType.sectionHead,
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.ink,
    flex: 1,
  },
  modalCloseIconBtn: {
    padding: 4,
  },
  modalContentScroll: {
    marginBottom: adminSpacing.md,
  },
  docOverviewBox: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  docBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  docRefCode: {
    ...adminType.rowTitle,
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.ink,
  },
  docVerifiedPill: {
    backgroundColor: adminColors.success.bg,
    borderRadius: adminRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  docVerifiedPillText: {
    ...adminType.caption,
    fontSize: 10.5,
    fontWeight: '700',
    color: adminColors.success.text,
  },
  modalTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  modalTableLabel: {
    ...adminType.caption,
    fontSize: 11.5,
    color: adminColors.muted,
  },
  modalTableValue: {
    ...adminType.body,
    fontSize: 11.5,
    fontWeight: '700',
    color: adminColors.ink,
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  modalTableDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    opacity: 0.5,
  },
  digitalSealCard: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 12,
  },
  digitalSealTextCol: {
    flex: 1,
  },
  digitalSealTitle: {
    ...adminType.rowTitle,
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  digitalSealSub: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.ink,
    marginTop: 1,
  },
  digitalSealStatus: {
    ...adminType.caption,
    fontSize: 10.5,
    color: adminColors.muted,
    marginTop: 2,
  },
  modalBottomCloseBtn: {
    height: 44,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.xs,
  },
  modalBottomCloseBtnText: {
    ...adminType.rowTitle,
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  headerEditBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  correctiveActionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  correctiveActionCode: {
    ...adminType.rowTitle,
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.ink,
  },
  closedBadge: {
    backgroundColor: adminColors.success.bg,
    borderRadius: adminRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  closedBadgeText: {
    ...adminType.caption,
    fontSize: 11,
    fontWeight: '700',
    color: adminColors.success.text,
  },
  correctiveActionMeta: {
    ...adminType.caption,
    fontSize: 11.5,
    color: adminColors.muted,
    marginTop: 2,
  },
  redFlagHistoryCard: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.sm,
    marginTop: 8,
  },
  redFlagHistoryMeta: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
  },
  redFlagHistoryTitle: {
    ...adminType.body,
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.ink,
    marginTop: 2,
  },
  redFlagActionBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
    marginTop: 6,
  },
  flagEditBtn: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.sm,
  },
  flagEditBtnText: {
    ...adminType.caption,
    fontSize: 11.5,
    fontWeight: '700',
    color: adminColors.ink,
  },
  flagClearBtn: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: adminColors.brandDeep,
    borderRadius: adminRadius.sm,
  },
  flagClearBtnText: {
    ...adminType.caption,
    fontSize: 11.5,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  redFlagDashedBtn: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: adminColors.danger.text,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.sm,
  },
  redFlagDashedBtnText: {
    ...adminType.rowTitle,
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.danger.text,
  },
  redFlagSheet: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: adminRadius.xl,
    borderTopRightRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
  },
  redFlagSheetTitle: {
    ...adminType.sectionHead,
    fontSize: 16.5,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: adminSpacing.md,
  },
  redFlagAuditBox: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  redFlagBoldVal: {
    ...adminType.body,
    fontSize: 12.5,
    fontWeight: '800',
    color: adminColors.ink,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 24,
    marginBottom: adminSpacing.md,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
  },
  checkboxBoxChecked: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  checkboxCheckmark: {
    color: adminColors.onBrand,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 14,
  },
  checkboxLabel: {
    ...adminType.body,
    fontSize: 12.5,
    color: adminColors.ink,
  },
  inputLabelRequired: {
    ...adminType.caption,
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 6,
  },
  reasonInput: {
    height: 80,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.canvas,
    padding: adminSpacing.sm,
    color: adminColors.ink,
    textAlignVertical: 'top',
    fontSize: 12.5,
    marginBottom: adminSpacing.md,
  },
  redFlagModalBtnRow: {
    flexDirection: 'row',
    columnGap: 10,
  },
  submitRedFlagBtn: {
    flex: 1,
    height: 44,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitRedFlagBtnText: {
    ...adminType.rowTitle,
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
  },
  cancelRedFlagBtn: {
    flex: 1,
    height: 44,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelRedFlagBtnText: {
    ...adminType.rowTitle,
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.muted,
  },
});
