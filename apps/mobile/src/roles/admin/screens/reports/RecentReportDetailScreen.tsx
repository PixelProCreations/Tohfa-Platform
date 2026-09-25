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
import Svg, { Circle, Line, Path } from 'react-native-svg';
import type { RecentDocItem } from './AdminReportsMainScreen';

const P = {
  bg: '#FAF8F5',
  cardBg: '#FFFFFF',
  cardBorder: '#F2ECE4',
  ink: '#1A1412',
  titleBrown: '#662208',
  subtitle: '#827871',
  orange: '#F0562A',
  orangeBg: '#FFECE8',
  textSecondary: '#6B6560',
  greenSuccess: '#16A34A',
  greenBg: '#EDFDF2',
  border: '#F0ECE6',
};

function BackChevronIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 19L8 12L15 5"
        stroke="#2B2523"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DownloadIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7 10l5 5 5-5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="12" y1="15" x2="12" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export interface RecentReportDetailScreenProps {
  doc: RecentDocItem;
  onBack: () => void;
  onOpenLiveModule: () => void;
}

export function RecentReportDetailScreen({
  doc,
  onBack,
  onOpenLiveModule,
}: RecentReportDetailScreenProps) {
  const handleDownload = () => {
    Alert.alert(
      'Document Downloaded',
      `"${doc.title}" (${doc.fileSize}) has been exported successfully and saved to your device.`
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={P.bg} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Row with Back Button */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Back to reports"
          >
            <BackChevronIcon />
          </TouchableOpacity>
          <View style={styles.topBarRight}>
            <View style={styles.verifiedTag}>
              <Text style={styles.verifiedTagText}>✓ SA/TA Verified</Text>
            </View>
          </View>
        </View>

        {/* Heading */}
        <View style={styles.headerBlock}>
          <Text style={styles.pageTitle}>Recent Report Details</Text>
          <Text style={styles.pageSubtitle}>Official platform archival record & executive audit</Text>
        </View>

        {/* Main Document Details Card */}
        <View style={styles.mainDocCard}>
          <View style={styles.tagRow}>
            <View style={[styles.categoryBadge, { borderColor: doc.badgeColor + '30', backgroundColor: doc.badgeColor + '10' }]}>
              <Text style={[styles.categoryBadgeText, { color: doc.badgeColor }]}>{doc.categoryBadge}</Text>
            </View>
            <View style={styles.formatPill}>
              <Text style={styles.formatPillText}>{doc.fileFormat} · {doc.fileSize}</Text>
            </View>
          </View>

          <Text style={styles.docTitle}>{doc.title}</Text>
          <Text style={styles.docDate}>{doc.dateStr}</Text>

          <View style={styles.divider} />

          {/* Executive Summary Highlights */}
          <Text style={styles.sectionHeading}>Executive Summary Highlights</Text>
          <View style={styles.metricsGrid}>
            {doc.summaryMetrics.map((m, i) => (
              <View key={i} style={styles.metricItem}>
                <Text style={styles.metricLabel}>{m.label}</Text>
                <Text style={styles.metricVal}>{m.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Audit & Compliance Specifications Card */}
        <View style={styles.specsCard}>
          <Text style={styles.specsTitle}>Audit & Verification Specifications</Text>

          <View style={styles.specRow}>
            <Text style={styles.specKey}>Document Serial</Text>
            <Text style={styles.specVal}>TOHFA-REP-{doc.id.toUpperCase()}-2026</Text>
          </View>

          <View style={styles.specRow}>
            <Text style={styles.specKey}>Compliance Status</Text>
            <Text style={[styles.specVal, { color: P.greenSuccess, fontWeight: '700' }]}>
              100% Passed (Statutory & GST)
            </Text>
          </View>

          <View style={styles.specRow}>
            <Text style={styles.specKey}>Cryptographic Seal</Text>
            <Text style={styles.specVal}>SHA-256 Verified Signature</Text>
          </View>

          <View style={styles.specRow}>
            <Text style={styles.specKey}>Archival Storage</Text>
            <Text style={styles.specVal}>Encrypted Cold Tier-4 Cloud</Text>
          </View>

          <View style={[styles.specRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.specKey}>Authorized Sign-off</Text>
            <Text style={styles.specVal}>Tohfa Internal Audit Committee</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.downloadPrimaryBtn}
            onPress={handleDownload}
            activeOpacity={0.85}
          >
            <DownloadIcon size={20} color="#FFFFFF" />
            <Text style={styles.downloadPrimaryBtnText}>
              Download {doc.fileFormat.includes('Excel') ? 'Spreadsheet' : 'Document'} ({doc.fileSize})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.openLiveBtn}
            onPress={onOpenLiveModule}
            activeOpacity={0.8}
          >
            <Text style={styles.openLiveBtnText}>View Live Interactive Module →</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: P.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: P.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#EFE7DE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedTag: {
    backgroundColor: '#EDFDF2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C6F6D5',
  },
  verifiedTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: P.greenSuccess,
  },
  headerBlock: {
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: P.titleBrown,
    letterSpacing: -0.6,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 13,
    color: P.subtitle,
    lineHeight: 18,
  },
  mainDocCard: {
    backgroundColor: P.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.cardBorder,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  formatPill: {
    backgroundColor: '#FAF5EE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  formatPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: P.subtitle,
  },
  docTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: P.ink,
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  docDate: {
    fontSize: 12.5,
    color: P.subtitle,
    lineHeight: 17,
  },
  divider: {
    height: 1,
    backgroundColor: '#F5F0E8',
    marginVertical: 18,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: P.titleBrown,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metricItem: {
    flex: 1,
    backgroundColor: '#FAF8F4',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F0ECE4',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10.5,
    color: P.subtitle,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  metricVal: {
    fontSize: 15,
    fontWeight: '800',
    color: P.ink,
  },
  specsCard: {
    backgroundColor: P.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.cardBorder,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  specsTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: P.ink,
    marginBottom: 12,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FAF7F2',
  },
  specKey: {
    fontSize: 12.5,
    color: P.subtitle,
    fontWeight: '500',
  },
  specVal: {
    fontSize: 12.5,
    color: P.ink,
    fontWeight: '600',
  },
  actionsContainer: {
    gap: 12,
  },
  downloadPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.orange,
    borderRadius: 16,
    paddingVertical: 15,
    gap: 8,
    shadowColor: P.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  downloadPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },
  openLiveBtn: {
    backgroundColor: '#FAF5EE',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFE7DE',
  },
  openLiveBtnText: {
    color: P.titleBrown,
    fontSize: 13.5,
    fontWeight: '700',
  },
});

export default RecentReportDetailScreen;
