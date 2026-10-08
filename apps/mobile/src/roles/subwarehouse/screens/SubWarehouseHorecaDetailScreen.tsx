import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { HorecaOrderItem } from './SubWarehouseHorecaSalesScreen';
import { SubWarehouseInvoiceDetailScreen } from './SubWarehouseInvoiceDetailScreen';
import { M5S15_OrderStatusHistory } from '../../admin/screens/swa/orders/M5S15_OrderStatusHistory';

// ─── Theme Colors ─────────────────────────────────────────────────────────────
const PALETTE = {
  primary: '#F0562A',
  pageBg: '#F4F0EB',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textMuted: '#7C756E',
  border: '#EBE5DC',
  divider: '#EBE5DC',
  btnPrimaryBg: '#F0562A',
  btnPrimaryText: '#FFFFFF',
  btnSecondaryBorder: '#F0562A',
  btnSecondaryText: '#F0562A',
  btnSecondaryBg: '#FFF7F4',
};

// ─── Icons ────────────────────────────────────────────────────────────────────
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

function InvoiceDocIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FlagStatusIcon({ size = 18, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
export interface SubWarehouseHorecaDetailScreenProps {
  order?: HorecaOrderItem | null | undefined;
  onBack: () => void;
  onViewInvoice?: () => void;
  onViewStatus?: () => void;
}

export function SubWarehouseHorecaDetailScreen({
  order,
  onBack,
  onViewInvoice,
  onViewStatus,
}: SubWarehouseHorecaDetailScreenProps): React.JSX.Element {
  const [currentSubView, setCurrentSubView] = useState<'detail' | 'invoice' | 'status'>('detail');

  // Fallback data if opened without order props
  const displayOrder: HorecaOrderItem = order || {
    id: 'HORECA-0021',
    businessName: 'Green Valley Restaurant',
    customerCode: 'CUS-H0021',
    status: 'Confirmed',
    itemCountText: '12 Items',
    dateText: '24 Sep 2026',
    amount: 8500,
    items: [
      {
        name: 'Tomato',
        grade: 'Grade 1',
        batch: 'BTH-00231',
        qtyText: '20 KG',
        pricePerUnit: 80,
        lineTotal: 4000,
      },
      {
        name: 'Carrot',
        grade: 'Grade 1',
        batch: 'BTH-00189',
        qtyText: '15 KG',
        pricePerUnit: 100,
        lineTotal: 2500,
      },
      {
        name: 'Beans',
        grade: 'Grade 1',
        batch: 'BTH-00145',
        qtyText: '10 KG',
        pricePerUnit: 150,
        lineTotal: 1500,
      },
    ],
  };

  const handleInvoicePress = () => {
    if (onViewInvoice) {
      onViewInvoice();
    } else {
      setCurrentSubView('invoice');
    }
  };

  const handleStatusPress = () => {
    if (onViewStatus) {
      onViewStatus();
    } else {
      setCurrentSubView('status');
    }
  };

  if (currentSubView === 'invoice') {
    return (
      <SubWarehouseInvoiceDetailScreen
        invoiceId={`INV-${displayOrder.id.replace('HORECA-', '')}`}
        onBack={() => setCurrentSubView('detail')}
      />
    );
  }

  if (currentSubView === 'status') {
    return (
      <M5S15_OrderStatusHistory
        orderId={displayOrder.id}
        onNavigate={(_screen) => {}}
        onBack={() => setCurrentSubView('detail')}
      />
    );
  }

  const subtotal = displayOrder.amount ? displayOrder.amount - 500 : 8000;
  const gst = 500;
  const total = displayOrder.amount || 8500;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.8}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowBackIcon size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>HORECA Detail</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 1. Business ─── */}
        <Text style={styles.sectionHeading}>Business</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Business</Text>
              <Text style={styles.fieldValue}>{displayOrder.businessName}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Contact</Text>
              <Text style={styles.fieldValue}>XXXX</Text>
            </View>
          </View>
          <View style={[styles.row, { marginTop: 16 }]}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Phone</Text>
              <Text style={styles.fieldValue}>XXXX</Text>
            </View>
          </View>
        </View>

        {/* ─── 2. Order ─── */}
        <Text style={styles.sectionHeading}>Order</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Order ID</Text>
              <Text style={styles.fieldValue}>{displayOrder.id}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Warehouse</Text>
              <Text style={styles.fieldValue}>Coonoor</Text>
            </View>
          </View>
          <View style={[styles.row, { marginTop: 16 }]}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Order Date</Text>
              <Text style={styles.fieldValue}>24 Sep 2026</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Status</Text>
              <Text style={styles.fieldValue}>{displayOrder.status || 'Confirmed'}</Text>
            </View>
          </View>
        </View>

        {/* ─── 3. Items ─── */}
        <Text style={styles.sectionHeading}>Items</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Tomato</Text>
              <Text style={styles.fieldValue}>20 KG</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Carrot</Text>
              <Text style={styles.fieldValue}>15 KG</Text>
            </View>
          </View>
          <View style={[styles.row, { marginTop: 16 }]}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Beans</Text>
              <Text style={styles.fieldValue}>10 KG</Text>
            </View>
          </View>
        </View>

        {/* ─── 4. Total ─── */}
        <Text style={styles.sectionHeading}>Total</Text>
        <View style={styles.card}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₹{subtotal.toLocaleString('en-IN')}</Text>
          </View>
          <View style={[styles.summaryRow, { marginTop: 10 }]}>
            <Text style={styles.summaryLabel}>GST</Text>
            <Text style={styles.summaryValue}>₹{gst.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{total.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {/* ─── Action Buttons ─── */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleInvoicePress}
          activeOpacity={0.85}
        >
          <InvoiceDocIcon size={18} color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>View Invoice</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={handleStatusPress}
          activeOpacity={0.8}
        >
          <FlagStatusIcon size={18} color={PALETTE.primary} />
          <Text style={styles.secondaryBtnText}>View Status</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PALETTE.primary,
  },
  header: {
    backgroundColor: PALETTE.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  content: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 8,
    marginTop: 4,
  },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.textMuted,
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: PALETTE.textMuted,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  divider: {
    height: 1,
    backgroundColor: PALETTE.divider,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  totalValue: {
    fontSize: 17,
    fontWeight: '900',
    color: PALETTE.textInk,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.primary,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 12,
    gap: 8,
    shadowColor: PALETTE.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF7F4',
    borderWidth: 1.5,
    borderColor: PALETTE.primary,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 12,
    gap: 8,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.primary,
  },
});
