import React, { useState, useEffect } from 'react';
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
import Svg, { Path, Circle, Rect } from 'react-native-svg';

// ─── DESIGN TOKENS ─────────────────────────────────────────────────────────
const PALETTE = {
  primary: '#F0562A',
  pageBg: '#F7F5EE',
  cardBg: '#FFFFFF',
  textInk: '#1D2420',
  textSecondary: '#7A726C',
  border: '#E8E4D9',
  greenDot: '#1E8E5A',
  orangePill: '#F0562A',
  grayDot: '#E8E4D9',
  infoBg: '#EAF2FB',
  infoBorder: '#C1D8F0',
  infoText: '#23527C',
};

// ─── ICONS ──────────────────────────────────────────────────────────────────
function ArrowBackIcon({ size = 24, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ArrowRightIcon({ size = 20, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14M12 5l7 7-7 7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckCircleIcon({ size = 20, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M8 12l3 3 5-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LockIcon({ size = 18, color = PALETTE.infoText }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="11" width="14" height="10" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M8 11V7a4 4 0 0 1 8 0v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="12" cy="16" r="1" fill={color} />
    </Svg>
  );
}

function InfoIcon({ size = 18, color = PALETTE.infoText }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 16v-4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="12" cy="8" r="1" fill={color} />
    </Svg>
  );
}

// ─── PROPS & TYPES ──────────────────────────────────────────────────────────
export interface TransactionRecord {
  id: string;
  orderNumber: string;
  customerName: string;
  amount: string;
  saleType: string;
  status: string;
  date: string;
}

export interface SubWarehouseInvoiceWizardScreenProps {
  transaction: TransactionRecord;
  onBack: () => void;
  onSuccess: () => void;
}

// ─── COMPONENT ──────────────────────────────────────────────────────────────
export function SubWarehouseInvoiceWizardScreen({
  transaction,
  onBack,
  onSuccess,
}: SubWarehouseInvoiceWizardScreenProps) {
  const [step, setStep] = useState(0);

  const STEP_TITLES = [
    'Transaction Summary',
    'Invoice Items',
    'Customer Details',
    'Review Invoice',
  ];

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      onBack();
    }
  };

  const handleContinue = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleGenerateInvoice = () => {
    // In a real app, make API call here
    onSuccess();
  };

  const handleSimulateFailure = () => {
    Alert.alert('Generation Failed', 'Failed to generate invoice. Please try again.');
  };

  const renderProgress = () => {
    return (
      <View style={styles.progressRow}>
        {[0, 1, 2, 3].map((idx) => {
          if (idx < step) {
            return <View key={idx} style={styles.dotGreen} />;
          }
          if (idx === step) {
            return <View key={idx} style={styles.pillOrange} />;
          }
          return <View key={idx} style={styles.dotGray} />;
        })}
      </View>
    );
  };

  const renderStep0 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.sectionTitle}>Transaction Summary</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Order</Text>
            <Text style={styles.value}>{transaction.orderNumber || transaction.id}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Customer</Text>
            <Text style={styles.value}>{transaction.customerName}</Text>
          </View>
        </View>
        <View style={styles.spacer} />
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Sales Channel</Text>
            <Text style={styles.value}>{transaction.saleType}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Warehouse</Text>
            <Text style={styles.value}>Coonoor Warehouse</Text>
          </View>
        </View>
        <View style={styles.spacer} />
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Payment Status</Text>
            <Text style={styles.value}>Paid</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.sectionTitle}>Invoice Items</Text>
      <View style={styles.card}>
        <View style={styles.itemRow}>
          <View>
            <Text style={styles.itemTitle}>Tomato</Text>
            <Text style={styles.itemDesc}>Grade 1 · 5 KG × ₹100</Text>
          </View>
          <Text style={styles.itemPrice}>₹500</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.itemRow}>
          <View>
            <Text style={styles.itemTitle}>Carrot</Text>
            <Text style={styles.itemDesc}>Grade 1 · 3 KG × ₹80</Text>
          </View>
          <Text style={styles.itemPrice}>₹240</Text>
        </View>
      </View>

      <View style={styles.infoBox}>
        <LockIcon />
        <Text style={styles.infoText}>
          Items reflect the source transaction exactly — SWA cannot manually change quantity or unit price from this screen.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Billing Summary</Text>
      <View style={styles.card}>
        <View style={styles.billingRow}>
          <Text style={styles.billingLabel}>Subtotal</Text>
          <Text style={styles.billingValue}>₹740</Text>
        </View>
        <View style={styles.spacerSmall} />
        <View style={styles.billingRow}>
          <Text style={styles.billingLabel}>Discount</Text>
          <Text style={styles.billingValue}>₹0</Text>
        </View>
        <View style={styles.spacerSmall} />
        <View style={styles.billingRow}>
          <Text style={styles.billingLabel}>GST</Text>
          <Text style={styles.billingValue}>Where applicable</Text>
        </View>
        <View style={styles.dividerDark} />
        <View style={styles.billingRow}>
          <Text style={styles.billingTotalLabel}>Total</Text>
          <Text style={styles.billingTotalValue}>₹740</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Invoice Type</Text>
      <View style={styles.card}>
        <Text style={styles.invoiceTypeLabel}>Retail Sale</Text>
        <Text style={styles.invoiceTypeDesc}>Derived from source transaction — not editable</Text>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.sectionTitle}>Customer Details</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Customer</Text>
            <Text style={styles.value}>{transaction.customerName}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Customer ID</Text>
            <Text style={styles.value}>CUS-001245</Text>
          </View>
        </View>
        <View style={styles.spacer} />
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Contact</Text>
            <Text style={styles.value}>+91 XXXXX XXXXX</Text>
          </View>
        </View>
      </View>

      <View style={styles.infoBox}>
        <InfoIcon />
        <Text style={styles.infoText}>
          GST/business fields (GSTIN, billing address) appear here only for B2B/HORECA source transactions that actually provide them.
        </Text>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.sectionTitle}>Review Invoice</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Invoice Type</Text>
            <Text style={styles.value}>Retail Sale</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Customer</Text>
            <Text style={styles.value}>{transaction.customerName}</Text>
          </View>
        </View>
        <View style={styles.spacer} />
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Items</Text>
            <Text style={styles.value}>2</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Subtotal</Text>
            <Text style={styles.value}>₹740</Text>
          </View>
        </View>
        <View style={styles.spacer} />
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>GST</Text>
            <Text style={styles.value}>₹0</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Total</Text>
            <Text style={styles.value}>₹740</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.outlineBtn} onPress={handleSimulateFailure}>
        <Text style={styles.outlineBtnText}>Simulate generation failure (demo)</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
          <ArrowBackIcon size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{STEP_TITLES[step]}</Text>
      </View>

      {/* CONTENT */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {renderProgress()}

        {step === 0 && renderStep0()}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </ScrollView>

      {/* FOOTER */}
      <View style={styles.footer}>
        {step < 3 ? (
          <TouchableOpacity style={styles.primaryBtn} onPress={handleContinue} activeOpacity={0.88}>
            <Text style={styles.primaryBtnText}>Continue</Text>
            <ArrowRightIcon size={20} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.primaryBtn} onPress={handleGenerateInvoice} activeOpacity={0.88}>
            <CheckCircleIcon size={20} color="#FFFFFF" />
            <Text style={[styles.primaryBtnText, { marginLeft: 8 }]}>Generate Invoice</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  backBtn: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  dotGreen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PALETTE.greenDot,
    marginRight: 6,
  },
  dotGray: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PALETTE.grayDot,
    marginRight: 6,
  },
  pillOrange: {
    width: 24,
    height: 8,
    borderRadius: 4,
    backgroundColor: PALETTE.orangePill,
    marginRight: 6,
  },
  stepContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginBottom: 12,
  },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
  },
  label: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: PALETTE.textSecondary,
    marginBottom: 4,
  },
  value: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.textInk,
  },
  spacer: {
    height: 16,
  },
  spacerSmall: {
    height: 8,
  },
  divider: {
    height: 1,
    backgroundColor: PALETTE.border,
    marginVertical: 12,
  },
  dividerDark: {
    height: 1,
    backgroundColor: '#D1D5DB',
    marginVertical: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitle: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  itemDesc: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: PALETTE.textSecondary,
    marginTop: 4,
  },
  itemPrice: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: PALETTE.infoBg,
    borderWidth: 1,
    borderColor: PALETTE.infoBorder,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  infoText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: PALETTE.infoText,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  billingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billingLabel: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: PALETTE.textSecondary,
  },
  billingValue: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.textInk,
  },
  billingTotalLabel: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  billingTotalValue: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  invoiceTypeLabel: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.textInk,
  },
  invoiceTypeDesc: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: PALETTE.textSecondary,
    marginTop: 4,
  },
  outlineBtn: {
    borderWidth: 1,
    borderColor: PALETTE.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  outlineBtnText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.primary,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
  },
  primaryBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 8,
    flexDirection: 'row',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: 8,
  },
});
