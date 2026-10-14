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
import type { AuditReportData } from './AuditReportScreen';

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
  gold:       '#B45309',
  goldBg:     '#FEF3C7',
};

export interface AuditPdfPreviewScreenProps {
  report?: AuditReportData;
  farmerName?: string;
  farmId?: string;
  score?: number;
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

function DownloadIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ShareIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="18" cy="5" r="3" stroke="#1A1412" strokeWidth="2" />
      <Circle cx="6" cy="12" r="3" stroke="#1A1412" strokeWidth="2" />
      <Circle cx="18" cy="19" r="3" stroke="#1A1412" strokeWidth="2" />
      <Path
        d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"
        stroke="#1A1412"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function CertificateBadgeIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="10" r="7" stroke={PALETTE.gold} strokeWidth="1.8" />
      <Path
        d="M9 10l2 2 4-4"
        stroke={PALETTE.gold}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8.5 16.5L7 22l5-2 5 2-1.5-5.5"
        stroke={PALETTE.gold}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function QrCodeMock() {
  return (
    <Svg width={48} height={48} viewBox="0 0 48 48" fill="none">
      <Rect x="2" y="2" width="16" height="16" rx="2" stroke="#1A1412" strokeWidth="2" />
      <Rect x="6" y="6" width="8" height="8" fill="#1A1412" />
      <Rect x="30" y="2" width="16" height="16" rx="2" stroke="#1A1412" strokeWidth="2" />
      <Rect x="34" y="6" width="8" height="8" fill="#1A1412" />
      <Rect x="2" y="30" width="16" height="16" rx="2" stroke="#1A1412" strokeWidth="2" />
      <Rect x="6" y="34" width="8" height="8" fill="#1A1412" />
      <Rect x="26" y="26" width="6" height="6" fill="#1A1412" />
      <Rect x="38" y="26" width="6" height="6" fill="#1A1412" />
      <Rect x="26" y="38" width="6" height="6" fill="#1A1412" />
      <Rect x="38" y="38" width="6" height="6" fill="#1A1412" />
    </Svg>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export function AuditPdfPreviewScreen({
  report,
  farmerName: propFarmerName,
  farmId: propFarmId,
  score: propScore,
  onBack,
}: AuditPdfPreviewScreenProps) {
  const farmerName = propFarmerName ?? report?.entry?.farmerName ?? 'Vijay Anand';
  const farmId = propFarmId ?? report?.entry?.farmId ?? '#TOHFA-F-00234';
  const auditType = report?.entry?.type ?? 'Internal';
  const auditor = report?.entry?.auditorLabel?.replace(/Auditor:\s*/i, '') ?? 'Ravi K.';
  const score = propScore ?? report?.totalScore ?? 44;
  const maxScore = report?.maxScore ?? 60;
  const violations = report?.majorViolations ?? 0;

  function handleDownload() {
    Alert.alert(
      'Report Downloaded Successfully',
      `Audit_Certificate_${farmId.replace('#', '')}_Q3_2026.pdf has been downloaded to your device documents folder.`,
      [{ text: 'OK' }],
    );
  }

  function handleShare() {
    Alert.alert(
      'Share Report',
      `Sharing audit certificate for ${farmerName} (${farmId}) via WhatsApp / Email.`,
      [{ text: 'Send' }],
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.pageBg} />

      {/* Nav */}
      <View style={styles.navBar}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.navBackBtn}
          activeOpacity={0.7}
          accessibilityLabel="Go back"
        >
          <BackChevronIcon />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Certificate Preview</Text>
        <TouchableOpacity
          onPress={handleShare}
          style={styles.navBackBtn}
          activeOpacity={0.7}
        >
          <ShareIcon />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Official Audit Certificate</Text>
        <Text style={styles.pageSubtitle}>
          Generated document ready for compliance distribution & export
        </Text>

        {/* Certificate Paper Canvas */}
        <View style={styles.certSheet}>
          {/* Decorative Corner Seals */}
          <View style={styles.certHeader}>
            <View style={styles.certBadgeWrap}>
              <CertificateBadgeIcon />
            </View>
            <View style={{ flex: 1, paddingLeft: 10 }}>
              <Text style={styles.certOrg}>TOHFA STANDARDS CO-OP</Text>
              <Text style={styles.certSubTitle}>National Organic & Good Agricultural Practices</Text>
              <Text style={styles.certNumber}>ID: CERT-2026-IN-0892</Text>
            </View>
          </View>

          <View style={styles.certDivider} />

          {/* Recipient */}
          <Text style={styles.certCertifiesText}>THIS IS TO CERTIFY THAT</Text>
          <Text style={styles.certFarmerName}>{farmerName}</Text>
          <Text style={styles.certFarmDetails}>Farm ID: {farmId} · Zone A, Coimbatore Region</Text>

          <Text style={styles.certDesc}>
            has successfully completed the comprehensive on-site quarterly farm evaluation covering
            soil nutrition, water preservation, biosecurity, and natural harvesting standards.
          </Text>

          {/* Scores Matrix */}
          <View style={styles.certMetricsBox}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Audit Type</Text>
              <Text style={styles.metricVal}>{auditType} Quarterly</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Total Score</Text>
              <Text style={styles.metricVal}>{score} / {maxScore}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Violations</Text>
              <Text style={[styles.metricVal, { color: violations === 0 ? PALETTE.greenText : PALETTE.orange }]}>
                {violations === 0 ? '0 None' : `${violations} Found`}
              </Text>
            </View>
          </View>

          {/* Quality Grade Banner */}
          <View style={styles.gradeBanner}>
            <Text style={styles.gradeBannerText}>
              GRADE A EXCELLENT COMPLIANCE TIER
            </Text>
          </View>

          {/* Signatures & QR */}
          <View style={styles.certFooter}>
            <View style={styles.signatureBlock}>
              <Text style={styles.signatureName}>{auditor}</Text>
              <View style={styles.sigLine} />
              <Text style={styles.signatureTitle}>Lead Agricultural Auditor</Text>
            </View>

            <View style={styles.qrBlock}>
              <QrCodeMock />
              <Text style={styles.qrText}>Scan to verify</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 16 }} />

        {/* CTA 1: Download PDF */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleDownload}
          activeOpacity={0.85}
        >
          <DownloadIcon />
          <Text style={styles.primaryBtnText}>Download PDF Certificate</Text>
        </TouchableOpacity>

        {/* CTA 2: Share via WhatsApp */}
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={handleShare}
          activeOpacity={0.75}
        >
          <ShareIcon />
          <Text style={styles.secondaryBtnText}>Share with Farmer</Text>
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

  // Nav
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    backgroundColor: PALETTE.pageBg,
  },
  navTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.titleRust,
  },
  navBackBtn: {
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

  // Certificate Sheet
  certSheet: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E8E1D5',
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 16,
  },
  certHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  certBadgeWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PALETTE.goldBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  certOrg: {
    fontSize: 12.5,
    fontWeight: '800',
    color: PALETTE.ink,
    letterSpacing: 0.5,
  },
  certSubTitle: {
    fontSize: 10.5,
    color: PALETTE.labelMuted,
    marginTop: 1,
  },
  certNumber: {
    fontSize: 10,
    color: PALETTE.gold,
    fontWeight: '700',
    marginTop: 2,
  },
  certDivider: {
    height: 1,
    backgroundColor: PALETTE.divider,
    marginVertical: 16,
  },

  certCertifiesText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: PALETTE.labelMuted,
    letterSpacing: 1,
    textAlign: 'center',
  },
  certFarmerName: {
    fontSize: 20,
    fontWeight: '800',
    color: PALETTE.titleRust,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 2,
  },
  certFarmDetails: {
    fontSize: 12,
    color: PALETTE.labelMuted,
    textAlign: 'center',
    marginBottom: 12,
  },
  certDesc: {
    fontSize: 12,
    lineHeight: 18,
    color: PALETTE.labelMuted,
    textAlign: 'center',
    marginBottom: 16,
  },

  certMetricsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: PALETTE.pageBg,
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: PALETTE.labelMuted,
    marginBottom: 2,
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: PALETTE.border,
  },

  gradeBanner: {
    backgroundColor: PALETTE.greenBg,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  gradeBannerText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: PALETTE.greenText,
    letterSpacing: 0.5,
  },

  certFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  signatureBlock: {
    flex: 1,
    paddingRight: 16,
  },
  signatureName: {
    fontSize: 13,
    fontWeight: '700',
    fontStyle: 'italic',
    color: PALETTE.ink,
    marginBottom: 4,
  },
  sigLine: {
    height: 1,
    backgroundColor: PALETTE.ink,
    marginBottom: 4,
    width: '90%',
  },
  signatureTitle: {
    fontSize: 10.5,
    color: PALETTE.labelMuted,
  },
  qrBlock: {
    alignItems: 'center',
  },
  qrText: {
    fontSize: 9,
    color: PALETTE.labelMuted,
    marginTop: 4,
  },

  // CTA
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
  },
  secondaryBtnText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: PALETTE.ink,
  },
});
