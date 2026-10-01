import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

interface M5S01Props {
  onNavigate: (screen: string, params?: any) => void;
  onBack: () => void;
  onTabChange?: (tab: string) => void;
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

function DocumentHeaderIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BellNotificationIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LockSmallWhiteIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Path d="M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z" stroke="#FFFFFF" strokeWidth="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// Status Grid Icons
function NewBadgeIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="4" width="20" height="16" rx="4" stroke="#8B4513" strokeWidth="1.8" />
      <Path d="M6 15V9l4 6V9M14 15V9h4M14 12h3M14 15h4" stroke="#8B4513" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckCircleTickIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke="#1D2420" strokeWidth="1.8" />
      <Path d="M8 12l2.5 2.5 5.5-5.5" stroke="#1D2420" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PackageBoxIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="7" width="18" height="14" rx="2" stroke="#1D2420" strokeWidth="1.8" />
      <Path d="M3 11h18M10 7v4" stroke="#1D2420" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReadyPickupIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="7" r="3" stroke="#1D2420" strokeWidth="1.8" />
      <Path d="M5 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2" stroke="#1D2420" strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M16 11l2 2 4-4" stroke="#1D2420" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DeliveryTruckIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M1 3h14v13H1zM15 8h4l3 3v5h-7V8z" stroke="#1D2420" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="5.5" cy="18.5" r="2.5" stroke="#1D2420" strokeWidth="1.8" />
      <Circle cx="18.5" cy="18.5" r="2.5" stroke="#1D2420" strokeWidth="1.8" />
    </Svg>
  );
}

function ErrorExclamationRedIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke="#E24B4A" strokeWidth="1.8" />
      <Path d="M12 7v6M12 16h.01" stroke="#E24B4A" strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

// Needs Attention Icons
function WarningAttentionTriangleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        stroke="#D97706"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 9v4M12 17h.01" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ChecklistOrangeIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="3" stroke="#C2410C" strokeWidth="1.8" />
      <Path d="M7 9h2M7 13h2M7 17h2M12 9h5M12 13h5M12 17h5" stroke="#C2410C" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function PersonOrangeIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="7" r="3" stroke="#C2410C" strokeWidth="1.8" />
      <Path d="M5 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2" stroke="#C2410C" strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M16 12l2 2 4-4" stroke="#C2410C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightGreyIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke="#7A726C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Quick Action Icons
function ViewOrdersReceiptIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2z" stroke="#E85226" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8 8h8M8 12h8M8 16h5" stroke="#E85226" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Bottom Nav Icons
function HomeNavIcon({ active }: { active: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={active ? '#E85226' : '#7A726C'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 22V12h6v10" stroke={active ? '#E85226' : '#7A726C'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReceivingNavIcon({ active }: { active: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="2" stroke={active ? '#E85226' : '#7A726C'} strokeWidth="1.8" />
      <Path d="M12 8v8M8 12l4 4 4-4" stroke={active ? '#E85226' : '#7A726C'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InventoryNavIcon({ active }: { active: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="2" stroke={active ? '#E85226' : '#7A726C'} strokeWidth="1.8" />
      <Path d="M3 9h18M9 21V9" stroke={active ? '#E85226' : '#7A726C'} strokeWidth="1.8" />
    </Svg>
  );
}

function MoreNavIcon({ active }: { active: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="5" cy="5" r="2" fill={active ? '#E85226' : '#7A726C'} />
      <Circle cx="12" cy="5" r="2" fill={active ? '#E85226' : '#7A726C'} />
      <Circle cx="19" cy="5" r="2" fill={active ? '#E85226' : '#7A726C'} />
      <Circle cx="5" cy="12" r="2" fill={active ? '#E85226' : '#7A726C'} />
      <Circle cx="12" cy="12" r="2" fill={active ? '#E85226' : '#7A726C'} />
      <Circle cx="19" cy="12" r="2" fill={active ? '#E85226' : '#7A726C'} />
      <Circle cx="5" cy="19" r="2" fill={active ? '#E85226' : '#7A726C'} />
      <Circle cx="12" cy="19" r="2" fill={active ? '#E85226' : '#7A726C'} />
      <Circle cx="19" cy="19" r="2" fill={active ? '#E85226' : '#7A726C'} />
    </Svg>
  );
}

export const M5S01_OrdersDashboard: React.FC<M5S01Props> = ({ onNavigate, onBack, onTabChange }) => {
  const [activeFilterPill, setActiveFilterPill] = useState('All');

  const filterPills = ['All', 'New', 'Confirmed', 'Packing', 'Ready', 'Delivery'];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header matching Left Reference */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.titleWrap}>
              {onBack && (
                <TouchableOpacity
                  style={styles.backButton}
                  activeOpacity={0.7}
                  onPress={onBack}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessibilityLabel="Back to Dashboard"
                >
                  <BackArrowWhiteIcon />
                </TouchableOpacity>
              )}
              <DocumentHeaderIcon />
              <Text style={styles.headerTitle}>Orders</Text>
            </View>
            <TouchableOpacity style={styles.bellBtn} activeOpacity={0.7}>
              <BellNotificationIcon />
            </TouchableOpacity>
          </View>

          {/* Assigned Warehouse Pill */}
          <View style={styles.warehousePill}>
            <LockSmallWhiteIcon />
            <Text style={styles.warehousePillText}>Coonoor Warehouse · Assigned Warehouse</Text>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Order Status Section */}
          <Text style={styles.sectionHeader}>Order Status</Text>
          <View style={styles.statusGrid}>
            {/* Card 1: New Orders */}
            <TouchableOpacity
              style={styles.statusCard}
              activeOpacity={0.7}
              onPress={() => onNavigate('M5S02', { status: 'New' })}
            >
              <View style={styles.statusCardTop}>
                <NewBadgeIcon />
              </View>
              <Text style={styles.statusNumber}>12</Text>
              <Text style={styles.statusLabel}>New Orders</Text>
            </TouchableOpacity>

            {/* Card 2: Confirmed */}
            <TouchableOpacity
              style={styles.statusCard}
              activeOpacity={0.7}
              onPress={() => onNavigate('M5S02', { status: 'Confirmed' })}
            >
              <View style={styles.statusCardTop}>
                <CheckCircleTickIcon />
              </View>
              <Text style={styles.statusNumber}>8</Text>
              <Text style={styles.statusLabel}>Confirmed</Text>
            </TouchableOpacity>

            {/* Card 3: Packing */}
            <TouchableOpacity
              style={styles.statusCard}
              activeOpacity={0.7}
              onPress={() => onNavigate('M5S02', { status: 'Packing' })}
            >
              <View style={styles.statusCardTop}>
                <PackageBoxIcon />
              </View>
              <Text style={styles.statusNumber}>5</Text>
              <Text style={styles.statusLabel}>Packing</Text>
            </TouchableOpacity>

            {/* Card 4: Ready for Pickup */}
            <TouchableOpacity
              style={styles.statusCard}
              activeOpacity={0.7}
              onPress={() => onNavigate('M5S09')}
            >
              <View style={styles.statusCardTop}>
                <ReadyPickupIcon />
              </View>
              <Text style={styles.statusNumber}>7</Text>
              <Text style={styles.statusLabel}>Ready for Pickup</Text>
            </TouchableOpacity>

            {/* Card 5: Delivery */}
            <TouchableOpacity
              style={styles.statusCard}
              activeOpacity={0.7}
              onPress={() => onNavigate('M5S13', { orderId: 'ORD-1021' })}
            >
              <View style={styles.statusCardTop}>
                <DeliveryTruckIcon />
              </View>
              <Text style={styles.statusNumber}>3</Text>
              <Text style={styles.statusLabel}>Delivery</Text>
            </TouchableOpacity>

            {/* Card 6: Order Issues (RED) */}
            <TouchableOpacity
              style={styles.statusCard}
              activeOpacity={0.7}
              onPress={() => onNavigate('M5S16')}
            >
              <View style={styles.statusCardTop}>
                <ErrorExclamationRedIcon />
              </View>
              <Text style={[styles.statusNumber, { color: '#E24B4A' }]}>2</Text>
              <Text style={styles.statusLabel}>Order Issues</Text>
            </TouchableOpacity>
          </View>

          {/* Status Filter Pills Row */}
          <View style={styles.pillsRow}>
            {filterPills.map((pill) => {
              const isActive = activeFilterPill === pill;
              return (
                <TouchableOpacity
                  key={pill}
                  style={[styles.pillBtn, isActive && styles.pillBtnActive]}
                  activeOpacity={0.75}
                  onPress={() => setActiveFilterPill(pill)}
                >
                  <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                    {pill}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Needs Attention Section */}
          <View style={styles.attentionHeaderRow}>
            <WarningAttentionTriangleIcon />
            <Text style={styles.attentionSectionTitle}>Needs Attention</Text>
          </View>

          {/* Attention Card 1 */}
          <TouchableOpacity
            style={[styles.attentionCard, styles.orangeLeftBorder]}
            activeOpacity={0.7}
            onPress={() => onNavigate('M5S05')}
          >
            <ChecklistOrangeIcon />
            <View style={styles.attentionContent}>
              <Text style={styles.attentionTitle}>Order #ORD-1024</Text>
              <Text style={styles.attentionDesc}>Stock verification required</Text>
            </View>
            <ChevronRightGreyIcon />
          </TouchableOpacity>

          {/* Attention Card 2 */}
          <TouchableOpacity
            style={[styles.attentionCard, styles.orangeLeftBorder]}
            activeOpacity={0.7}
            onPress={() => onNavigate('M5S09')}
          >
            <PersonOrangeIcon />
            <View style={styles.attentionContent}>
              <Text style={styles.attentionTitle}>Order #ORD-1020</Text>
              <Text style={styles.attentionDesc}>Ready for pickup</Text>
            </View>
            <ChevronRightGreyIcon />
          </TouchableOpacity>

          {/* Attention Card 3 (Orange) */}
          <TouchableOpacity
            style={[styles.attentionCard, styles.orangeLeftBorder]}
            activeOpacity={0.7}
            onPress={() => onNavigate('M5S13', { orderId: 'ORD-1021' })}
          >
            <DeliveryTruckIcon />
            <View style={styles.attentionContent}>
              <Text style={styles.attentionTitle}>Order #ORD-1021</Text>
              <Text style={styles.attentionDesc}>Prepare for delivery</Text>
            </View>
            <ChevronRightGreyIcon />
          </TouchableOpacity>

          {/* Attention Card 4 (Red) */}
          <TouchableOpacity
            style={[styles.attentionCard, styles.redLeftBorder]}
            activeOpacity={0.7}
            onPress={() => onNavigate('M5S16')}
          >
            <ErrorExclamationRedIcon />
            <View style={styles.attentionContent}>
              <Text style={styles.attentionTitle}>Order #ORD-1018</Text>
              <Text style={styles.attentionDesc}>Quantity issue</Text>
            </View>
            <ChevronRightGreyIcon />
          </TouchableOpacity>

          {/* Today's Summary Section */}
          <Text style={styles.sectionHeader}>Today's Summary</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>24</Text>
              <Text style={styles.summaryLabel}>TODAY'S ORDERS</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>16</Text>
              <Text style={styles.summaryLabel}>COMPLETED</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>8</Text>
              <Text style={styles.summaryLabel}>PENDING</Text>
            </View>
          </View>

          {/* Quick Actions Section */}
          <Text style={styles.sectionHeader}>Quick Actions</Text>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={styles.quickActionCard}
              activeOpacity={0.7}
              onPress={() => onNavigate('M5S02')}
            >
              <View style={styles.quickActionIconWrap}>
                <ViewOrdersReceiptIcon />
              </View>
              <Text style={styles.quickActionText}>View Orders</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              activeOpacity={0.7}
              onPress={() => onNavigate('M5S09')}
            >
              <View style={styles.quickActionIconWrap}>
                <PersonOrangeIcon />
              </View>
              <Text style={styles.quickActionText}>Ready for Pickup</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              activeOpacity={0.7}
              onPress={() => onNavigate('M5S16')}
            >
              <View style={styles.quickActionIconWrap}>
                <ErrorExclamationRedIcon />
              </View>
              <Text style={styles.quickActionText}>Order Issues</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 28 }} />
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} activeOpacity={0.7} onPress={onBack}>
            <HomeNavIcon active={false} />
            <Text style={styles.navLabel}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            activeOpacity={0.7}
            onPress={() => onTabChange && onTabChange('Receiving')}
          >
            <ReceivingNavIcon active={false} />
            <Text style={styles.navLabel}>Receiving</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            activeOpacity={0.7}
            onPress={() => onTabChange && onTabChange('Inventory')}
          >
            <InventoryNavIcon active={false} />
            <Text style={styles.navLabel}>Inventory</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            activeOpacity={0.7}
          >
            <MoreNavIcon active={true} />
            <Text style={[styles.navLabel, { color: '#E85226', fontWeight: '700' }]}>More</Text>
          </TouchableOpacity>
        </View>
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
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    marginRight: 4,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warehousePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  warehousePillText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
    fontFamily: 'Poppins',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1D2420',
    fontFamily: 'Poppins',
    marginBottom: 10,
    marginTop: 4,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  statusCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    padding: 14,
    marginBottom: 10,
  },
  statusCardTop: {
    marginBottom: 6,
  },
  statusNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  statusLabel: {
    fontSize: 11.5,
    color: '#7A726C',
    fontFamily: 'Poppins',
    fontWeight: '500',
    marginTop: 1,
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
  },
  pillBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  pillBtnActive: {
    backgroundColor: '#E85226',
    borderColor: '#E85226',
  },
  pillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  attentionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  attentionSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  attentionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  orangeLeftBorder: {
    borderLeftWidth: 4.5,
    borderLeftColor: '#C2410C',
  },
  redLeftBorder: {
    borderLeftWidth: 4.5,
    borderLeftColor: '#E24B4A',
  },
  attentionContent: {
    flex: 1,
  },
  attentionTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  attentionDesc: {
    fontSize: 11.5,
    color: '#7A726C',
    fontFamily: 'Poppins',
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  summaryLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#7A726C',
    fontFamily: 'Poppins',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionIconWrap: {
    marginBottom: 6,
  },
  quickActionText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1D2420',
    fontFamily: 'Poppins',
    textAlign: 'center',
  },
  bottomNav: {
    height: 62,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EAE6DF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 4,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#7A726C',
    fontFamily: 'Poppins',
    marginTop: 2,
  },
});
