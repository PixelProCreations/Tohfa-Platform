import React, { useState } from 'react';
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
import Svg, { Path } from 'react-native-svg';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const PALETTE = {
  titleRust:     '#8E3314',
  orange:        '#E85226',
  pageBg:        '#FAF8F5',
  cardBg:        '#FFFFFF',
  ink:           '#1A1412',
  labelMuted:    '#6D6761',
  border:        '#EDE8E0',
  green:         '#16A34A',
  greenBg:       '#EAF5EA',
};

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

function DownloadIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

interface B2BInvoice {
  id: string;
  clientName: string;
  invoiceNo: string;
  gstin: string;
  date: string;
  taxableAmount: number;
  gstAmount: number;
}

const INVOICES: B2BInvoice[] = [
  {
    id: 'inv-1',
    clientName: 'Taj Savoy Hotel · Ooty',
    invoiceNo: 'TF-HRC-26-0081',
    gstin: '33AABCT1234D1Z2',
    date: '24 Aug 2026',
    taxableAmount: 142000,
    gstAmount: 7100,
  },
  {
    id: 'inv-2',
    clientName: 'Sterling Nilgiris Resort',
    invoiceNo: 'TF-HRC-26-0094',
    gstin: '33AABCS5678E1Z5',
    date: '02 Sep 2026',
    taxableAmount: 128500,
    gstAmount: 6425,
  },
  {
    id: 'inv-3',
    clientName: 'Nilgiri Organic Supermart',
    invoiceNo: 'TF-B2B-26-0105',
    gstin: '33AACCD9988F1Z9',
    date: '14 Sep 2026',
    taxableAmount: 97540,
    gstAmount: 4877,
  },
];

export interface GSTFilingReportDetailScreenProps {
  onBack: () => void;
}

export function GSTFilingReportDetailScreen({
  onBack,
}: GSTFilingReportDetailScreenProps) {
  const [downloading, setDownloading] = useState(false);

  function handleDownloadJson() {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      Alert.alert(
        'GSTR-1 JSON Generated',
        'Official government format GST JSON export (Q2 2026) ready for upload to gst.gov.in portal.',
        [{ text: 'OK' }]
      );
    }, 800);
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.pageBg} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button First */}
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <BackChevronIcon />
        </TouchableOpacity>

        {/* Heading Next */}
        <Text style={styles.screenTitle}>GST Filing Report</Text>
        <Text style={styles.screenSub}>Quarter 2 (Jul - Sep 2026) · Form GSTR-1</Text>

        {/* Overview Stats Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Total Taxable Sales</Text>
              <Text style={styles.summaryVal}>₹3,68,040</Text>
            </View>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Total Output GST (5%)</Text>
              <Text style={[styles.summaryVal, { color: PALETTE.green }]}>₹18,402</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.taxSplitRow}>
            <Text style={styles.splitText}>CGST: ₹9,201</Text>
            <Text style={styles.splitText}>·</Text>
            <Text style={styles.splitText}>SGST: ₹9,201</Text>
            <Text style={styles.splitText}>·</Text>
            <Text style={styles.splitText}>IGST: ₹0</Text>
          </View>
        </View>

        {/* Invoices List */}
        <Text style={styles.sectionTitle}>B2B & Horeca Invoices (3)</Text>
        <View style={styles.invoiceStack}>
          {INVOICES.map((inv) => (
            <View key={inv.id} style={styles.invoiceCard}>
              <View style={styles.invTopRow}>
                <Text style={styles.clientName}>{inv.clientName}</Text>
                <Text style={styles.invAmount}>
                  ₹{(inv.taxableAmount + inv.gstAmount).toLocaleString('en-IN')}
                </Text>
              </View>

              <Text style={styles.invMeta}>
                {inv.invoiceNo} · GSTIN: {inv.gstin}
              </Text>
              <Text style={styles.invDate}>Date: {inv.date}</Text>

              <View style={styles.taxRow}>
                <Text style={styles.taxDetail}>
                  Taxable: ₹{inv.taxableAmount.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.taxDetail}>
                  GST (5%): ₹{inv.gstAmount.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={styles.downloadBtn}
          onPress={handleDownloadJson}
          activeOpacity={0.8}
          disabled={downloading}
        >
          <DownloadIcon />
          <Text style={styles.downloadBtnText}>
            {downloading ? 'Preparing JSON...' : 'Export GST Portal JSON (GSTR-1)'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: PALETTE.titleRust,
    letterSpacing: -0.3,
  },
  screenSub: {
    fontSize: 13,
    fontWeight: '400',
    color: PALETTE.labelMuted,
    marginTop: 4,
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 18,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCol: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: PALETTE.labelMuted,
    marginBottom: 4,
  },
  summaryVal: {
    fontSize: 18,
    fontWeight: '800',
    color: PALETTE.ink,
  },
  divider: {
    height: 1,
    backgroundColor: PALETTE.border,
    marginVertical: 14,
  },
  taxSplitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  splitText: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.labelMuted,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.titleRust,
    marginBottom: 12,
  },
  invoiceStack: {
    gap: 12,
    marginBottom: 24,
  },
  invoiceCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
  },
  invTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  clientName: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  invAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.ink,
  },
  invMeta: {
    fontSize: 12,
    color: PALETTE.labelMuted,
    marginBottom: 2,
  },
  invDate: {
    fontSize: 11.5,
    color: PALETTE.labelMuted,
    marginBottom: 8,
  },
  taxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: PALETTE.pageBg,
    padding: 8,
    borderRadius: 8,
  },
  taxDetail: {
    fontSize: 11.5,
    color: PALETTE.ink,
    fontWeight: '600',
  },
  downloadBtn: {
    backgroundColor: PALETTE.orange,
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: PALETTE.orange,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 3,
  },
  downloadBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
