import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

// ─── Design Tokens (#F0562A Brand + Inspect Element Tokens) ─────────────────
const PALETTE = {
  primary:       '#F0562A',
  pageBg:        '#F7F5EE',
  cardBg:        '#FFFFFF',
  textInk:       '#1D2420',
  textSecondary: '#6B7280',
  border:        '#E7E2D6',
  buttonPrimary: '#F0562A',
  buttonSecondaryBorder: '#F0562A',
  buttonSecondaryText: '#F0562A',
  blueBoxBg:     '#EFF6FF',
  blueBoxBorder: '#BFDBFE',
  blueBoxText:   '#1E40AF',
  divider:       '#F0ECE3',
};

// ─── Pure SVG Icons ─────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ServerDocIcon({ size = 18, color = '#2563EB' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 6a2 2 0 012-2h12a2 2 0 012 2v3a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm0 9a2 2 0 012-2h12a2 2 0 012 2v3a2 2 0 01-2 2H6a2 2 0 01-2-2v-3zM8 7.5h.01M8 16.5h.01"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ClockExpireIcon({ size = 18, color = '#2563EB' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DownloadIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Component Props ─────────────────────────────────────────────────────────

export interface SubWarehouseInvoicePreviewScreenProps {
  invoiceId?: string;
  onBack?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  onSimulateExpired?: () => void;
}

export function SubWarehouseInvoicePreviewScreen({
  invoiceId = 'INV-2026-001245',
  onBack,
  onDownload,
  onShare,
  onSimulateExpired,
}: SubWarehouseInvoicePreviewScreenProps): React.JSX.Element {
  const [showToast, setShowToast] = useState(false);

  const handleDownload = () => {
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
    if (onDownload) {
      onDownload();
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Header Banner ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Back"
          >
            <ArrowBackIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Invoice Preview</Text>
        </View>
      </View>

      {/* ─── Scrollable Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Main Preview Card ─── */}
        <View style={styles.previewCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Customer</Text>
            <Text style={styles.detailValue}>Ravi Kumar</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tomato · 5 KG</Text>
            <Text style={styles.detailValue}>₹500</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Carrot · 3 KG</Text>
            <Text style={styles.detailValue}>₹240</Text>
          </View>

          {/* Centered Large Total */}
          <Text style={styles.grandTotal}>₹740</Text>
        </View>
      </ScrollView>

      {/* ─── Sticky Bottom Action Bar ─── */}
      <View style={styles.bottomBar}>
        {showToast && (
          <View style={styles.toastContainer}>
            <Text style={styles.toastText}>✓ Invoice downloaded</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.primaryDownloadBtn}
          onPress={handleDownload}
          activeOpacity={0.8}
        >
          <View style={styles.btnRow}>
            <DownloadIcon size={18} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>Download PDF</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryShareBtn}
          onPress={onShare ? onShare : () => Alert.alert('Share', 'Sharing PDF...')}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryBtnText}>Share</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  headerBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    paddingRight: 14,
    paddingVertical: 4,
  },
  headerTitle: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: PALETTE.pageBg,
  },
  previewCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 16,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontFamily: 'Poppins',
    fontSize: 12.5,
    color: PALETTE.textSecondary,
  },
  detailValue: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.textInk,
  },
  grandTotal: {
    fontFamily: 'Poppins',
    fontSize: 28,
    fontWeight: '800',
    color: PALETTE.textInk,
    textAlign: 'center',
    marginTop: 18,
    marginBottom: 10,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: PALETTE.blueBoxBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.blueBoxBorder,
    padding: 13,
    marginBottom: 12,
    gap: 10,
    alignItems: 'flex-start',
  },
  infoIconWrap: {
    marginTop: 1,
  },
  infoText: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '500',
    color: PALETTE.blueBoxText,
    lineHeight: 16.5,
  },
  simulateBtn: {
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.buttonPrimary,
    borderRadius: 10,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  simulateBtnText: {
    fontFamily: 'Poppins',
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.buttonSecondaryText,
  },
  bottomBar: {
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.divider,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    gap: 10,
  },
  toastContainer: {
    backgroundColor: '#1E293B', // Dark slate for toast
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    position: 'absolute',
    top: -40,
    zIndex: 10,
    alignSelf: 'center',
  },
  toastText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  primaryDownloadBtn: {
    backgroundColor: PALETTE.buttonPrimary,
    borderRadius: 10,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryBtnText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryShareBtn: {
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.buttonSecondaryBorder,
    borderRadius: 10,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.buttonSecondaryText,
  },
});
