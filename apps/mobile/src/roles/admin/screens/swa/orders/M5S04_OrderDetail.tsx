import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  StatusBar,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { ORDERS_THEME } from './theme';

interface M5S04Props {
  orderId?: string;
  customerName?: string;
  onNavigate: (screen: string, params?: any) => void;
  onBack: () => void;
}

// ─── SVG Icons ───────────────────────────────────────────────────────────────
function BackArrowWhiteIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MoreDotsWhiteIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 13a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4zM19 13a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4zM5 13a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4z"
        fill="#FFFFFF"
        stroke="#FFFFFF"
        strokeWidth="1.5"
      />
    </Svg>
  );
}

function TimelineCheckDot() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" fill="#16A34A" />
      <Path d="M8 12l3 3 5-5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TimelinePendingDot() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke="#9E9690" strokeWidth="2" fill="#FAF7F2" />
    </Svg>
  );
}

function ChecklistWhiteIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M9 11l3 3L22 4" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export const M5S04_OrderDetail: React.FC<M5S04Props> = ({
  orderId = 'ORD-1024',
  customerName = 'Arun Kumar',
  onNavigate,
  onBack,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const isInv251 = orderId === 'INV-00251' || orderId === 'ORD-00251';
  const isInv238 = orderId === 'INV-00238' || orderId === 'ORD-00238';

  const displayOrderId = orderId;
  const displayDate = isInv251 ? '24 Sep, 10:42 AM' : isInv238 ? '20 Sep, 11:15 AM' : '24 Sep, 10:32 AM';
  const displayCustomer = customerName || (isInv251 || isInv238 ? 'Rajesh Kumar' : 'Arun Kumar');
  const displayStatus = isInv251 || isInv238 ? 'Paid · Completed' : 'Confirmed';

  const orderItemsList = isInv251
    ? [
      { name: 'Tomato', grade: 'Grade 1', qtyDetail: '2 KG × ₹100', price: '₹200' },
    ]
    : isInv238
      ? [
        { name: 'Tomato', grade: 'Grade 1', qtyDetail: '2 KG × ₹100', price: '₹200' },
        { name: 'Carrot', grade: 'Grade 1', qtyDetail: '1 KG × ₹150', price: '₹150' },
        { name: 'Beans', grade: 'Grade 1', qtyDetail: '2 KG × ₹150', price: '₹300' },
      ]
      : [
        { name: 'Tomato', grade: 'Grade 1', qtyDetail: '2 KG × ₹100', price: '₹200' },
        { name: 'Carrot', grade: 'Grade 1', qtyDetail: '3 KG × ₹120', price: '₹360' },
      ];

  const subtotal = isInv251 ? '₹200' : isInv238 ? '₹650' : '₹560';
  const gst = isInv251 || isInv238 ? '₹0' : '₹28';
  const total = isInv251 ? '₹200' : isInv238 ? '₹650' : '₹588';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={ORDERS_THEME.primary} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.7}
              onPress={onBack}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <BackArrowWhiteIcon />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>{displayOrderId}</Text>
              <View style={styles.headerStatusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.headerStatusText}>{displayStatus}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.moreButton}
            activeOpacity={0.7}
            onPress={() => setShowMenu(true)}
          >
            <MoreDotsWhiteIcon />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Section 1: Order Summary */}
          <Text style={styles.sectionHeader}>Order Summary</Text>
          <View style={styles.card}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Order ID</Text>
                <Text style={styles.colValue}>{displayOrderId}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Order Date</Text>
                <Text style={styles.colValue}>{displayDate}</Text>
              </View>
            </View>

            <View style={[styles.twoColRow, { marginTop: 14 }]}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Status</Text>
                <Text style={styles.colValue}>{displayStatus}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Warehouse</Text>
                <Text style={styles.colValue}>Coonoor</Text>
              </View>
            </View>
          </View>

          {/* Section 2: Customer */}
          <Text style={styles.sectionHeader}>Customer</Text>
          <View style={styles.card}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Customer</Text>
                <Text style={styles.colValue}>{displayCustomer}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Phone</Text>
                <Text style={styles.colValue}>+91 98765 43210</Text>
              </View>
            </View>
          </View>

          {/* Section 3: Fulfillment */}
          <Text style={styles.sectionHeader}>Fulfillment</Text>
          <View style={styles.card}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Fulfillment</Text>
                <Text style={styles.colValue}>Warehouse Pickup</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Pickup Warehouse</Text>
                <Text style={styles.colValue}>Coonoor Warehouse</Text>
              </View>
            </View>
          </View>

          {/* Section 4: Order Items */}
          <Text style={styles.sectionHeader}>Order Items ({orderItemsList.length})</Text>
          <View style={styles.card}>
            {orderItemsList.map((item, idx) => (
              <View key={idx}>
                <View style={styles.orderItemHeaderRow}>
                  <Text style={styles.orderItemName}>{item.name}</Text>
                  <Text style={styles.orderItemPrice}>{item.price}</Text>
                </View>
                <Text style={styles.orderItemSub}>{item.grade}</Text>
                <Text style={styles.orderItemSub}>{item.qtyDetail}</Text>
                {idx < orderItemsList.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>

          {/* Section 5: Amount */}
          <Text style={styles.sectionHeader}>Amount</Text>
          <View style={styles.card}>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Subtotal</Text>
              <Text style={styles.amountValue}>{subtotal}</Text>
            </View>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Discount</Text>
              <Text style={styles.amountValue}>₹0</Text>
            </View>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>GST</Text>
              <Text style={styles.amountValue}>{gst}</Text>
            </View>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Delivery Fee</Text>
              <Text style={styles.amountValue}>₹0</Text>
            </View>

            <View style={styles.amountDivider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{total}</Text>
            </View>
          </View>

          {/* Section 6: Payment */}
          <Text style={styles.sectionHeader}>Payment</Text>
          <View style={styles.card}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Payment Status</Text>
                <Text style={styles.colValue}>Paid</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Payment Method</Text>
                <Text style={styles.colValue}>Wallet</Text>
              </View>
            </View>
          </View>

          {/* Section 7: Pickup Information */}
          <Text style={styles.sectionHeader}>Pickup Information</Text>
          <View style={styles.card}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Pickup Status</Text>
                <Text style={styles.colValue}>Pending</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Pickup OTP</Text>
                <Text style={styles.colValue}>Verification required</Text>
              </View>
            </View>
            <View style={[styles.twoColRow, { marginTop: 14 }]}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Order Pickup Type</Text>
                <Text style={styles.colValue}>Direct Pickup</Text>
              </View>
            </View>
          </View>

          {/* Section 8: Notes */}
          <Text style={styles.sectionHeader}>Notes</Text>
          <View style={styles.card}>
            <Text style={styles.notesText}>
              Please pack tomatoes separately if possible.
            </Text>
          </View>

          {/* Section 9: Order Timeline */}
          <View style={styles.timelineHeaderRow}>
            <Text style={styles.sectionHeaderPlain}>Order Timeline</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => onNavigate('M5S15')}
            >
              <Text style={styles.viewTimelineLink}>View full timeline</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.timelineCard}>
            {/* Step 1 */}
            <View style={styles.timelineRow}>
              <View style={styles.timelineIndicatorCol}>
                <TimelineCheckDot />
                <View style={styles.timelineGreenLine} />
              </View>
              <View style={styles.timelineTextCol}>
                <Text style={styles.timelineTitle}>Order Placed</Text>
                <Text style={styles.timelineTime}>10:32 AM</Text>
              </View>
            </View>

            {/* Step 2 */}
            <View style={styles.timelineRow}>
              <View style={styles.timelineIndicatorCol}>
                <TimelineCheckDot />
                <View style={styles.timelineGrayLine} />
              </View>
              <View style={styles.timelineTextCol}>
                <Text style={styles.timelineTitle}>Order Confirmed</Text>
                <Text style={styles.timelineTime}>10:34 AM</Text>
              </View>
            </View>

            {/* Step 3 */}
            <View style={styles.timelineRow}>
              <View style={styles.timelineIndicatorCol}>
                <TimelinePendingDot />
              </View>
              <View style={styles.timelineTextCol}>
                <Text style={styles.timelineTitlePending}>Stock Checked</Text>
                <Text style={styles.timelineTimePending}>—</Text>
              </View>
            </View>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Bottom Full-Width Sticky Buttons */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.primaryCheckBtn}
            activeOpacity={0.8}
            onPress={() => onNavigate('M5S05', { orderId })}
          >
            <ChecklistWhiteIcon />
            <Text style={styles.primaryCheckBtnText}>Check Stock</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryReportBtn}
            activeOpacity={0.8}
            onPress={() => onNavigate('M5S16', { orderId })}
          >
            <Text style={styles.secondaryReportBtnText}>Report Issue</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelOrderBtn}
            activeOpacity={0.8}
            onPress={() => onNavigate('M5S17', { orderId })}
          >
            <Text style={styles.cancelOrderBtnText}>Cancel Order</Text>
          </TouchableOpacity>
        </View>

        {/* More Actions Menu Modal */}
        <Modal
          visible={showMenu}
          transparent
          animationType="fade"
          onRequestClose={() => setShowMenu(false)}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.45)',
              justifyContent: 'flex-end',
            }}
            activeOpacity={1}
            onPress={() => setShowMenu(false)}
          >
            <View
              style={{
                backgroundColor: ORDERS_THEME.cardBg,
                borderTopLeftRadius: ORDERS_THEME.radiusXL,
                borderTopRightRadius: ORDERS_THEME.radiusXL,
                padding: 20,
                paddingBottom: 36,
              }}
            >
              <Text
                style={{
                  fontFamily: 'Poppins',
                  fontSize: 16,
                  fontWeight: '700',
                  color: ORDERS_THEME.textInk,
                  marginBottom: 16,
                }}
              >
                Order Actions
              </Text>

              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setShowMenu(false);
                  onNavigate('M5S18', { orderId });
                }}
              >
                <Text style={styles.modalOptionText}>View Invoice</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setShowMenu(false);
                  onNavigate('M5S15');
                }}
              >
                <Text style={styles.modalOptionText}>Status History</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalOption, { borderBottomWidth: 0 }]}
                onPress={() => {
                  setShowMenu(false);
                  onNavigate('M5S17');
                }}
              >
                <Text style={[styles.modalOptionText, { color: ORDERS_THEME.danger }]}>Cancel Order</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ORDERS_THEME.primary,
  },
  container: {
    flex: 1,
    backgroundColor: ORDERS_THEME.pageBg,
  },
  header: {
    backgroundColor: ORDERS_THEME.primary,
    paddingTop: 14,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },
  headerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#86EFAC',
  },
  headerStatusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
  moreButton: {
    width: 36,
    height: 36,
    borderRadius: ORDERS_THEME.radiusFull,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  sectionHeader: {
    fontSize: 13.5,
    fontWeight: '800',
    color: ORDERS_THEME.textInk,
    fontFamily: 'Poppins',
    marginBottom: 8,
    marginTop: 6,
  },
  sectionHeaderPlain: {
    fontSize: 13.5,
    fontWeight: '800',
    color: ORDERS_THEME.textInk,
    fontFamily: 'Poppins',
  },
  card: {
    backgroundColor: ORDERS_THEME.cardBg,
    borderRadius: ORDERS_THEME.radiusLG,
    borderWidth: 1,
    borderColor: ORDERS_THEME.border,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
  },
  colLabel: {
    fontSize: 11,
    color: ORDERS_THEME.textSecondary,
    fontFamily: 'Poppins',
    fontWeight: '500',
    marginBottom: 2,
  },
  colValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: ORDERS_THEME.textInk,
    fontFamily: 'Poppins',
  },
  orderItemHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: ORDERS_THEME.textInk,
    fontFamily: 'Poppins',
  },
  orderItemPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: ORDERS_THEME.textInk,
    fontFamily: 'Poppins',
  },
  orderItemSub: {
    fontSize: 11.5,
    color: ORDERS_THEME.textSecondary,
    fontFamily: 'Poppins',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: ORDERS_THEME.border,
    marginVertical: 12,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 13,
    color: ORDERS_THEME.textSecondary,
    fontFamily: 'Poppins',
  },
  amountValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: ORDERS_THEME.textInk,
    fontFamily: 'Poppins',
  },
  amountDivider: {
    height: 1,
    backgroundColor: ORDERS_THEME.border,
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: ORDERS_THEME.textInk,
    fontFamily: 'Poppins',
  },
  totalValue: {
    fontSize: 17,
    fontWeight: '800',
    color: ORDERS_THEME.textInk,
    fontFamily: 'Poppins',
  },
  notesText: {
    fontSize: 13,
    color: ORDERS_THEME.textInk,
    fontFamily: 'Poppins',
    lineHeight: 18,
  },
  timelineHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 6,
  },
  viewTimelineLink: {
    fontSize: 12.5,
    fontWeight: '700',
    color: ORDERS_THEME.primary,
    fontFamily: 'Poppins',
  },
  timelineCard: {
    backgroundColor: ORDERS_THEME.cardBg,
    borderRadius: ORDERS_THEME.radiusLG,
    borderWidth: 1,
    borderColor: ORDERS_THEME.border,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 46,
  },
  timelineIndicatorCol: {
    alignItems: 'center',
    width: 20,
    marginRight: 10,
  },
  timelineGreenLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#16A34A',
    marginVertical: 3,
  },
  timelineGrayLine: {
    width: 2,
    flex: 1,
    backgroundColor: ORDERS_THEME.border,
    marginVertical: 3,
  },
  timelineTextCol: {
    flex: 1,
    paddingBottom: 10,
  },
  timelineTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: ORDERS_THEME.textInk,
    fontFamily: 'Poppins',
  },
  timelineTime: {
    fontSize: 11,
    color: ORDERS_THEME.textSecondary,
    fontFamily: 'Poppins',
    marginTop: 2,
  },
  timelineTitlePending: {
    fontSize: 13,
    fontWeight: '700',
    color: ORDERS_THEME.textSecondary,
    fontFamily: 'Poppins',
  },
  timelineTimePending: {
    fontSize: 11,
    color: ORDERS_THEME.textSecondary,
    fontFamily: 'Poppins',
    marginTop: 2,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: ORDERS_THEME.pageBg,
    gap: 10,
  },
  primaryCheckBtn: {
    backgroundColor: ORDERS_THEME.primary,
    borderRadius: ORDERS_THEME.radiusLG,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: ORDERS_THEME.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryCheckBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
    fontFamily: 'Poppins',
  },
  secondaryReportBtn: {
    backgroundColor: ORDERS_THEME.orangeTint,
    borderRadius: ORDERS_THEME.radiusLG,
    borderWidth: 1.5,
    borderColor: ORDERS_THEME.primary,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryReportBtnText: {
    color: ORDERS_THEME.primary,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Poppins',
  },
  cancelOrderBtn: {
    backgroundColor: '#FFF5F5',
    borderRadius: ORDERS_THEME.radiusLG,
    borderWidth: 1.5,
    borderColor: '#DC2626',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelOrderBtnText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Poppins',
  },
  modalOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: ORDERS_THEME.border,
  },
  modalOptionText: {
    fontFamily: 'Poppins',
    fontSize: 14.5,
    fontWeight: '600',
    color: ORDERS_THEME.textInk,
  },
});
