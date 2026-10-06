import React from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

const PALETTE = {
  primary: '#F0562A',
  headerBg: '#F0562A',
  pageBg: '#F3EFE9',
  cardBg: '#FFFFFF',
  textInk: '#1A1A1A',
  textSecondary: '#5F5E5A',
  border: '#EEDCD3',
  orangeDeep: '#7A2E14',
  noteCardBg: '#FDF3F0',
  noteCardBorder: '#EEDCD3',
  noteText: '#7A2E14',
};

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

function DownloadIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
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

export interface DownloadInvoiceScreenProps {
  invoiceId?: string;
  customerName?: string;
  grandTotal?: string;
  onBack?: () => void;
  onDownloadPdf?: () => void;
}

export function DownloadInvoiceScreen({
  invoiceId = 'INV-2026-001245',
  customerName = 'Arun Kumar',
  grandTotal = '₹1,600',
  onBack,
  onDownloadPdf,
}: DownloadInvoiceScreenProps) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          {onBack && (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
              <ArrowBackIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Download Invoice</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Summary Card */}
        <View style={styles.brandCard}>
          <Text style={styles.brandTitle}>TOHFA</Text>
          <Text style={styles.brandSub}>Invoice · {invoiceId}</Text>

          {/* Inner details row */}
          <View style={styles.innerCard}>
            <View>
              <Text style={styles.fieldLabel}>Customer</Text>
              <Text style={styles.fieldValue}>{customerName}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.fieldLabel}>Grand Total</Text>
              <Text style={styles.fieldValue}>{grandTotal}</Text>
            </View>
          </View>
        </View>

        {/* Note box */}
        <View style={styles.noteCard}>
          <Text style={styles.noteText}>
            Signed download links expire after 5 minutes — no permanent public invoice URL.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Bottom Action */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => (onDownloadPdf ? onDownloadPdf() : Alert.alert('Download', `Downloading PDF for ${invoiceId}...`))}
          activeOpacity={0.8}
        >
          <DownloadIcon size={18} color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>Download PDF</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.headerBg,
  },
  headerBanner: {
    backgroundColor: PALETTE.headerBg,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 12,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    padding: 4,
    marginRight: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  brandCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  brandSub: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    marginBottom: 16,
  },
  innerCard: {
    width: '100%',
    backgroundColor: '#FAF8F5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 11,
    color: PALETTE.textSecondary,
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  noteCard: {
    backgroundColor: PALETTE.noteCardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.noteCardBorder,
    padding: 14,
    marginBottom: 16,
  },
  noteText: {
    fontSize: 11.5,
    color: PALETTE.noteText,
    lineHeight: 16,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
  },
  primaryBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
