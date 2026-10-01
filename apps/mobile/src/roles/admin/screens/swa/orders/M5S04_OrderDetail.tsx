import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

interface M5S04Props {
  orderId?: string;
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
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="5" r="2" fill="#FFFFFF" />
      <Circle cx="12" cy="12" r="2" fill="#FFFFFF" />
      <Circle cx="12" cy="19" r="2" fill="#FFFFFF" />
    </Svg>
  );
}

function ChecklistWhiteIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 3h6v4H9z" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 14l2 2 4-4" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TimelineCheckDot() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#1E8E5A" strokeWidth="2.5" fill="#FFFFFF" />
      <Circle cx="12" cy="12" r="5" fill="#1E8E5A" />
    </Svg>
  );
}

function TimelinePendingDot() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke="#CBD5E1" strokeWidth="2" fill="#FFFFFF" />
    </Svg>
  );
}

export const M5S04_OrderDetail: React.FC<M5S04Props> = ({ orderId = 'ORD-1024', onNavigate, onBack }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header matching Left Reference exactly */}
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
              <Text style={styles.headerTitle}>{orderId}</Text>
              <View style={styles.headerStatusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.headerStatusText}>Confirmed</Text>
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
                <Text style={styles.colValue}>ORD-1024</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Order Date</Text>
                <Text style={styles.colValue}>24 Sep, 10:32 AM</Text>
              </View>
            </View>

            <View style={[styles.twoColRow, { marginTop: 14 }]}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Status</Text>
                <Text style={styles.colValue}>Confirmed</Text>
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
                <Text style={styles.colValue}>Arun Kumar</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Phone</Text>
                <Text style={styles.colValue}>+91 XXXXX XXXXX</Text>
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
          <Text style={styles.sectionHeader}>Order Items</Text>
          <View style={styles.card}>
            {/* Item 1 */}
            <View style={styles.orderItemHeaderRow}>
              <Text style={styles.orderItemName}>Tomato</Text>
              <Text style={styles.orderItemPrice}>₹200</Text>
            </View>
            <Text style={styles.orderItemSub}>Grade 1</Text>
            <Text style={styles.orderItemSub}>2 KG × ₹100</Text>

            <View style={styles.divider} />

            {/* Item 2 */}
            <View style={styles.orderItemHeaderRow}>
              <Text style={styles.orderItemName}>Carrot</Text>
              <Text style={styles.orderItemPrice}>₹360</Text>
            </View>
            <Text style={styles.orderItemSub}>Grade 1</Text>
            <Text style={styles.orderItemSub}>3 KG × ₹120</Text>
          </View>

          {/* Section 5: Amount */}
          <Text style={styles.sectionHeader}>Amount</Text>
          <View style={styles.card}>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Subtotal</Text>
              <Text style={styles.amountValue}>₹560</Text>
            </View>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Discount</Text>
              <Text style={styles.amountValue}>₹0</Text>
            </View>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>GST</Text>
              <Text style={styles.amountValue}>₹28</Text>
            </View>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Delivery Fee</Text>
              <Text style={styles.amountValue}>₹0</Text>
            </View>

            <View style={styles.amountDivider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹588</Text>
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

        {/* Bottom Full-Width Sticky Buttons matching Image 2 & 3 */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.primaryCheckBtn}
            activeOpacity={0.8}
            onPress={() => onNavigate('M5S05')}
          >
            <ChecklistWhiteIcon />
            <Text style={styles.primaryCheckBtnText}>Check Stock</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryReportBtn}
            activeOpacity={0.8}
            onPress={() => onNavigate('M5S16')}
          >
            <Text style={styles.secondaryReportBtnText}>Report Issue</Text>
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
                backgroundColor: '#FFFFFF',
                borderTopLeftRadius: 18,
                borderTopRightRadius: 18,
                padding: 20,
                paddingBottom: 36,
              }}
            >
              <Text
                style={{
                  fontFamily: 'Poppins',
                  fontSize: 16,
                  fontWeight: '700',
                  color: '#1D2420',
                  marginBottom: 16,
                }}
              >
                Order Actions
              </Text>

              <TouchableOpacity
                style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1ECE4' }}
                onPress={() => {
                  setShowMenu(false);
                  onNavigate('M5S18', { orderId });
                }}
              >
                <Text style={{ fontFamily: 'Poppins', fontSize: 14, fontWeight: '600', color: '#1D2420' }}>
                  📄 View Invoice
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1ECE4' }}
                onPress={() => {
                  setShowMenu(false);
                  onNavigate('M5S07', { orderId });
                }}
              >
                <Text style={{ fontFamily: 'Poppins', fontSize: 14, fontWeight: '600', color: '#1D2420' }}>
                  📦 Pack Order
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1ECE4' }}
                onPress={() => {
                  setShowMenu(false);
                  onNavigate('M5S13', { orderId });
                }}
              >
                <Text style={{ fontFamily: 'Poppins', fontSize: 14, fontWeight: '600', color: '#1D2420' }}>
                  🚚 Prepare Delivery / Dispatch
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ paddingVertical: 14 }}
                onPress={() => {
                  setShowMenu(false);
                  onNavigate('M5S17', { orderId });
                }}
              >
                <Text style={{ fontFamily: 'Poppins', fontSize: 14, fontWeight: '600', color: '#DC2626' }}>
                  ❌ Cancel Order
                </Text>
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
    backgroundColor: '#F4F1EA',
  },
  container: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  header: {
    backgroundColor: '#E85226',
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },
  headerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  headerStatusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'Poppins',
    fontWeight: '600',
  },
  moreButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    fontWeight: '700',
    color: '#1D2420',
    fontFamily: 'Poppins',
    marginBottom: 8,
    marginTop: 6,
  },
  sectionHeaderPlain: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    padding: 16,
    marginBottom: 12,
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
    color: '#7A726C',
    fontFamily: 'Poppins',
    fontWeight: '500',
    marginBottom: 2,
  },
  colValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1D2420',
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
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  orderItemPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  orderItemSub: {
    fontSize: 11.5,
    color: '#7A726C',
    fontFamily: 'Poppins',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F4F1EA',
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
    color: '#7A726C',
    fontFamily: 'Poppins',
  },
  amountValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  amountDivider: {
    height: 1.5,
    backgroundColor: '#1D2420',
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
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  totalValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  notesText: {
    fontSize: 13,
    color: '#1D2420',
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
    color: '#8B4513',
    fontFamily: 'Poppins',
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    padding: 16,
    marginBottom: 16,
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
    backgroundColor: '#1E8E5A',
    marginVertical: 3,
  },
  timelineGrayLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#CBD5E1',
    marginVertical: 3,
  },
  timelineTextCol: {
    flex: 1,
    paddingBottom: 10,
  },
  timelineTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  timelineTime: {
    fontSize: 11,
    color: '#7A726C',
    fontFamily: 'Poppins',
    marginTop: 2,
  },
  timelineTitlePending: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7A726C',
    fontFamily: 'Poppins',
  },
  timelineTimePending: {
    fontSize: 11,
    color: '#A19A94',
    fontFamily: 'Poppins',
    marginTop: 2,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: '#F4F1EA',
    gap: 10,
  },
  primaryCheckBtn: {
    backgroundColor: '#E85226',
    borderRadius: 14,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#E85226',
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
    backgroundColor: '#FFF7ED',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E85226',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryReportBtnText: {
    color: '#8B4513',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Poppins',
  },
});
