import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { SWA_TYPOGRAPHY } from '../constants';

interface M5S18Props {
  orderId?: string;
  onNavigate?: (screen: string, params?: any) => void;
  onBack: () => void;
}

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowWhiteIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DownloadWhiteIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function InfoCircleBlueIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#2563EB" strokeWidth="2" />
      <Path d="M12 16v-4M12 8h.01" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export const M5S18_OrderInvoice: React.FC<M5S18Props> = ({
  orderId = 'ORD-1024',
  onBack,
}) => {
  const handleDownload = () => {
    Alert.alert('Invoice Downloaded', 'Invoice INV-2026-001024 downloaded successfully.');
  };

  const handleShare = () => {
    Alert.alert('Share Invoice', 'Invoice link ready to share.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header - SWA Orange */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={onBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <BackArrowWhiteIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Invoice</Text>
        </View>

        {/* Subtitle directly below header */}
        <View style={styles.subtitleRow}>
          <Text style={styles.subtitleText}>INV-2026-001024</Text>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Brand Block Card */}
          <View style={styles.brandCard}>
            <View style={styles.brandHeader}>
              <Text style={styles.brandTitle}>TOHFA</Text>
              <Text style={styles.brandSub}>
                Nilgiris Horticulture Organic Farmers Association
              </Text>
              <Text style={styles.invoiceCode}>INV-2026-001024</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Order Number</Text>
                <Text style={styles.fieldValue}>{orderId}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Date</Text>
                <Text style={styles.fieldValue}>24 Sep 2026</Text>
              </View>
            </View>

            <View style={[styles.twoColRow, { marginTop: 14 }]}>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Customer</Text>
                <Text style={styles.fieldValue}>Arun Kumar</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Sales Channel</Text>
                <Text style={styles.fieldValue}>Online</Text>
              </View>
            </View>
          </View>

          {/* Section: Items */}
          <Text style={styles.sectionTitle}>Items</Text>
          <View style={styles.itemsCard}>
            {/* Item 1 */}
            <View style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>Tomato</Text>
                <Text style={styles.itemGrade}>Grade 1</Text>
                <Text style={styles.itemPricing}>2 KG × ₹100</Text>
              </View>
              <Text style={styles.itemTotal}>₹200</Text>
            </View>

            <View style={styles.itemDivider} />

            {/* Item 2 */}
            <View style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>Carrot</Text>
                <Text style={styles.itemGrade}>Grade 1</Text>
                <Text style={styles.itemPricing}>3 KG × ₹120</Text>
              </View>
              <Text style={styles.itemTotal}>₹360</Text>
            </View>
          </View>

          {/* Section: Totals */}
          <Text style={styles.sectionTitle}>Totals</Text>
          <View style={styles.totalsCard}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>₹560</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Discount</Text>
              <Text style={styles.totalsValue}>₹0</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>GST</Text>
              <Text style={styles.totalsValue}>₹28</Text>
            </View>

            <View style={styles.totalsDivider} />

            <View style={styles.totalFinalRow}>
              <Text style={styles.totalFinalLabel}>Total</Text>
              <Text style={styles.totalFinalValue}>₹588</Text>
            </View>
          </View>

          {/* Section: Payment Status Card */}
          <View style={styles.paymentStatusCard}>
            <Text style={styles.paymentStatusLabel}>Payment Status</Text>
            <Text style={styles.paymentStatusValue}>Paid</Text>
          </View>

          {/* Blue GST Info Box */}
          <View style={styles.gstInfoBox}>
            <View style={{ marginTop: 1 }}>
              <InfoCircleBlueIcon />
            </View>
            <Text style={styles.gstInfoText}>
              GST invoice generation for B2B/HORECA is a separate permission from ordinary invoice generation — not assumed here unless granted.
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.downloadBtn}
              activeOpacity={0.8}
              onPress={handleDownload}
            >
              <DownloadWhiteIcon />
              <Text style={styles.downloadBtnText}>Download Invoice</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareBtn}
              activeOpacity={0.8}
              onPress={handleShare}
            >
              <Text style={styles.shareBtnText}>Share</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  header: {
    backgroundColor: '#E85226',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
  },
  backButton: {
    marginRight: 14,
    padding: 2,
  },
  headerTitle: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitleRow: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: '#FAF8F5',
  },
  subtitleText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#8C7A6B',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  brandCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 16,
    marginBottom: 16,
  },
  brandHeader: {
    alignItems: 'center',
    paddingBottom: 4,
  },
  brandTitle: {
    fontFamily: 'Poppins',
    fontSize: 22,
    fontWeight: '800',
    color: '#8B4513',
    letterSpacing: 0.8,
    marginBottom: 4,
    textAlign: 'center',
  },
  brandSub: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 11,
    fontWeight: '500',
    color: '#78716C',
    marginBottom: 6,
    textAlign: 'center',
  },
  invoiceCode: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 14,
    fontWeight: '800',
    color: '#1D2420',
  },
  divider: {
    height: 1.5,
    backgroundColor: '#E87D4D',
    marginVertical: 14,
    opacity: 0.5,
  },
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
  },
  fieldLabel: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 11.5,
    fontWeight: '500',
    color: '#78716C',
    marginBottom: 4,
  },
  fieldValue: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: '#1D2420',
  },
  sectionTitle: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: '#1D2420',
    marginBottom: 8,
  },
  itemsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  itemInfo: {},
  itemName: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: '#1D2420',
  },
  itemGrade: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 11.5,
    fontWeight: '500',
    color: '#78716C',
    marginTop: 2,
  },
  itemPricing: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 11.5,
    fontWeight: '500',
    color: '#78716C',
    marginTop: 2,
  },
  itemTotal: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    color: '#1D2420',
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#F1ECE4',
    marginVertical: 10,
  },
  totalsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 16,
    marginBottom: 16,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  totalsLabel: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  totalsValue: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1D2420',
  },
  totalsDivider: {
    height: 1.5,
    backgroundColor: '#1D2420',
    marginVertical: 12,
  },
  totalFinalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalFinalLabel: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 18,
    fontWeight: '800',
    color: '#1D2420',
  },
  totalFinalValue: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 18,
    fontWeight: '800',
    color: '#1D2420',
  },
  paymentStatusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 16,
  },
  paymentStatusLabel: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: '#78716C',
    marginBottom: 4,
  },
  paymentStatusValue: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 16,
    fontWeight: '800',
    color: '#1D2420',
  },
  gstInfoBox: {
    backgroundColor: '#EBF5FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 20,
  },
  gstInfoText: {
    flex: 1,
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 11.5,
    fontWeight: '600',
    color: '#1E40AF',
    lineHeight: 17,
  },
  actionsContainer: {
    marginBottom: 30,
  },
  downloadBtn: {
    backgroundColor: '#E85226',
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  downloadBtnText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  shareBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E85226',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtnText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 14.5,
    fontWeight: '700',
    color: '#9A3412',
  },
});
