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

// ─── Design Tokens ────────────────────────────────────────────────────────
const PALETTE = {
  primary:       '#F0562A',
  pageBg:        '#FAF7F2',
  cardBg:        '#FFFFFF',
  textDark:      '#1E1612',
  textSecondary: '#7A726C',
  border:        '#EBE5DC',
  amberBg:       '#FAF4EB', // For the lock card
  iconColor:     '#8B5E3C', // For the related action icons
};

// ─── Icons ─────────────────────────────────────────────────────────────────
function ArrowBackIcon({ size = 22, color = '#FFFFFF' }) {
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

function ChevronDownIcon({ size = 11, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LockIcon({ size = 16, color = '#7A726C' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="11" width="14" height="10" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M8 11V7a4 4 0 1 1 8 0v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="12" cy="16" r="1.5" fill={color} />
    </Svg>
  );
}

function BagIcon({ size = 22, color = '#8B5E3C' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 6h18M16 10a4 4 0 0 1-8 0" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InvoiceIcon({ size = 22, color = '#8B5E3C' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PaymentIcon({ size = 22, color = '#8B5E3C' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="12" rx="2" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="12" r="2" stroke={color} strokeWidth="2" />
      <Path d="M6 12h.01M18 12h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function HistoryIcon({ size = 22, color = '#8B5E3C' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 8v4l3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3.05 11a9 9 0 1 1 .5 4m-.5-4v4h4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface SubWarehouseRevenueDetailScreenProps {
  onBack?: () => void;
  revenueId?: string;
  orderId?: string;
  invoiceId?: string;
  customer?: string;
  salesChannel?: string;
  quantity?: string;
  product?: string;
  finalAmount?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  transactionDate?: string;
  warehouse?: string;
  onViewOrder?: (() => void) | undefined;
  onViewInvoice?: (() => void) | undefined;
  onViewTransactionHistory?: (() => void) | undefined;
}

export function SubWarehouseRevenueDetailScreen({
  onBack,
  revenueId = 'REV-000845',
  orderId = 'ORD-10284',
  invoiceId = 'INV-2026-000845',
  customer = 'Ravi Kumar',
  salesChannel = 'Market Sale',
  quantity = '3 KG',
  product = 'Tomato',
  finalAmount = '3,450',
  paymentMethod = 'Wallet',
  paymentStatus = 'Completed',
  transactionDate = '25 Sep, 11:20 AM',
  warehouse = 'Coonoor',
  onViewOrder,
  onViewInvoice,
  onViewTransactionHistory,
}: SubWarehouseRevenueDetailScreenProps) {
  
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />
      
      {/* ─── Header ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.75}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Revenue</Text>
        </View>

        <TouchableOpacity
          style={styles.warehouseSubtitleRow}
          onPress={() => Alert.alert('Period Filter', 'Filtered to: Coonoor Warehouse · Today')}
          activeOpacity={0.8}
        >
          <Text style={styles.warehouseSubtitleText}>Coonoor Warehouse · Today</Text>
          <ChevronDownIcon size={11} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Revenue Detail Section */}
        <Text style={styles.sectionTitle}>Revenue Detail</Text>
        
        <View style={styles.card}>
          {/* Row 1 */}
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Revenue ID</Text>
              <Text style={styles.fieldValue}>{revenueId}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Order ID</Text>
              <Text style={styles.fieldValue}>{orderId}</Text>
            </View>
          </View>

          {/* Row 2 */}
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Invoice ID</Text>
              <Text style={styles.fieldValue}>{invoiceId}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Customer</Text>
              <Text style={styles.fieldValue}>{customer}</Text>
            </View>
          </View>

          {/* Row 3 */}
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Sales Channel</Text>
              <Text style={styles.fieldValue}>{salesChannel}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Quantity</Text>
              <Text style={styles.fieldValue}>{quantity}</Text>
            </View>
          </View>

          {/* Row 4 */}
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Product</Text>
              <Text style={styles.fieldValue}>{product}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Final Amount</Text>
              <Text style={styles.fieldValue}>₹{finalAmount}</Text>
            </View>
          </View>

          {/* Row 5 */}
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Payment Method</Text>
              <Text style={styles.fieldValue}>{paymentMethod}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Payment Status</Text>
              <Text style={styles.fieldValue}>{paymentStatus}</Text>
            </View>
          </View>

          {/* Row 6 */}
          <View style={[styles.gridRow, { marginBottom: 0 }]}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Transaction Date</Text>
              <Text style={styles.fieldValue}>{transactionDate}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Warehouse</Text>
              <Text style={styles.fieldValue}>{warehouse}</Text>
            </View>
          </View>
        </View>

        {/* Lock Banner */}
        <View style={styles.lockBanner}>
          <View style={styles.lockIconWrap}>
            <LockIcon size={16} color="#7A726C" />
          </View>
          <Text style={styles.lockBannerText}>
            No manual revenue editing here — that action is only granted to SWA if TA/SA explicitly configures it.
          </Text>
        </View>

        {/* Related Actions Section */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Related Actions</Text>
        
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7} onPress={onViewOrder ? onViewOrder : () => Alert.alert('View Order')}>
            <BagIcon size={24} color={PALETTE.iconColor} />
            <Text style={styles.actionBtnText}>View Order</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7} onPress={onViewInvoice ? onViewInvoice : () => Alert.alert('View Invoice')}>
            <InvoiceIcon size={24} color={PALETTE.iconColor} />
            <Text style={styles.actionBtnText}>View Invoice</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7} onPress={() => Alert.alert('View Payment')}>
            <PaymentIcon size={24} color={PALETTE.iconColor} />
            <Text style={styles.actionBtnText}>View Payment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7} onPress={onViewTransactionHistory ? onViewTransactionHistory : () => Alert.alert('Transaction History')}>
            <HistoryIcon size={24} color={PALETTE.iconColor} />
            <Text style={styles.actionBtnText}>Transaction History</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PALETTE.primary },
  headerBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerTopRow: { flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 12 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.2 },
  warehouseSubtitleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 },
  warehouseSubtitleText: { fontSize: 13, fontWeight: '500', color: '#FFFFFF', opacity: 0.9 },
  scroll: { flex: 1, backgroundColor: PALETTE.pageBg },
  scrollContent: { padding: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textDark,
    marginBottom: 12,
  },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 16,
  },
  gridRow: { flexDirection: 'row', marginBottom: 16 },
  gridCol: { flex: 1, paddingRight: 8 },
  fieldLabel: { fontSize: 12, fontWeight: '500', color: PALETTE.textSecondary, marginBottom: 4 },
  fieldValue: { fontSize: 14, fontWeight: '700', color: PALETTE.textDark },
  lockBanner: {
    backgroundColor: PALETTE.amberBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  lockIconWrap: { marginRight: 12, marginTop: 2 },
  lockBannerText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    color: PALETTE.textSecondary,
    lineHeight: 18,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionBtn: {
    width: '48%',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.textDark,
  },
});
