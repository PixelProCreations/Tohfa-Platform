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
import { ORDERS_THEME } from './theme';

interface M5S01Props {
  onNavigate: (screen: string, params?: any) => void;
  onBack?: () => void;
  onTabChange?: (tab: string) => void;
}

// ─── SVG Icons Matching Screenshot (Left Phone) & PDF Design System ─────────

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

function ReceiptHeaderIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      {/* Receipt body with serrated top */}
      <Path
        d="M5 6.5l1.75-2 1.75 2 1.75-2 1.75 2 1.75-2 1.75 2 1.75-2 1.75 2v10H5V6.5z"
        stroke="#FFFFFF"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 2-Column Grid / Table in upper half */}
      <Rect x="7.5" y="8" width="9" height="4.5" rx="0.5" stroke="#FFFFFF" strokeWidth="1.2" />
      <Path d="M12 8v4.5" stroke="#FFFFFF" strokeWidth="1.2" />
      {/* Lower invoice line */}
      <Path d="M7.5 14.5h9" stroke="#FFFFFF" strokeWidth="1.3" strokeLinecap="round" />
      {/* Curled paper roll at bottom */}
      <Path
        d="M18.5 16.5H5c-1.6 0-2.6 1-2.6 2.2 0 1.3 1 2.3 2.6 2.3h13.2c1 0 1.8-.7 1.8-1.7 0-1.2-.9-2.1-1.8-2.1"
        stroke="#FFFFFF"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Inner curl arc on the left */}
      <Path
        d="M4.8 16.6c-.8.4-1.3 1-1.3 1.8 0 .8.5 1.5 1.3 1.8"
        stroke="#FFFFFF"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
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

// ─── Status Grid Icons ───────────────────────────────────────────────────────

function NewBadgeIcon() {
  return (
    <View style={styles.newBadgeChip}>
      <Text style={styles.newBadgeText}>NEW</Text>
    </View>
  );
}

function CheckCircleTickIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9.5" stroke="#1A1A1A" strokeWidth="1.8" />
      <Path d="M7.5 12l3 3 6-6" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PackageBoxIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="2.5" y="5.5" width="19" height="14" rx="2" stroke="#1A1A1A" strokeWidth="1.8" />
      <Path d="M2.5 10h19M9.5 5.5v4.5" stroke="#1A1A1A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReadyPickupIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="7" r="3" stroke="#1A1A1A" strokeWidth="1.8" />
      <Path d="M3 19v-1.5a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4V19" stroke="#1A1A1A" strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M15 11.5l2 2 4.5-4.5" stroke="#1A1A1A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DeliveryTruckIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M2 4h12v11H2zM14 8.5h4.5l2.5 3.5v3h-7V8.5z" stroke="#1A1A1A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="6" cy="18" r="2.2" stroke="#1A1A1A" strokeWidth="1.8" />
      <Circle cx="17" cy="18" r="2.2" stroke="#1A1A1A" strokeWidth="1.8" />
    </Svg>
  );
}

function ErrorExclamationRedIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9.5" stroke="#E24B4A" strokeWidth="1.8" />
      <Path d="M12 7v5.5M12 15.5h.01" stroke="#E24B4A" strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Needs Attention Icons ──────────────────────────────────────────────────

function WarningAttentionTriangleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        stroke="#854F0B"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 9v4M12 17h.01" stroke="#854F0B" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function AttentionChecklistIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="3.5" stroke="#F0562A" strokeWidth="1.8" />
      <Path d="M7 8.5h2M7 12.5h2M7 16.5h2M12 8.5h5M12 12.5h5M12 16.5h5" stroke="#F0562A" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function AttentionPersonIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="7" r="3" stroke="#F0562A" strokeWidth="1.8" />
      <Path d="M3 19v-1.5a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4V19" stroke="#F0562A" strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M15 11.5l2 2 4-4" stroke="#F0562A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightGreyIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke="#5F5E5A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ViewOrdersReceiptIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2z" stroke="#F0562A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8 8h8M8 12h8M8 16h5" stroke="#F0562A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Bottom Navigation Icons ────────────────────────────────────────────────

function HomeNavIcon({ active }: { active: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={active ? '#F0562A' : '#5F5E5A'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 22V12h6v10" stroke={active ? '#F0562A' : '#5F5E5A'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReceivingNavIcon({ active }: { active: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="2" stroke={active ? '#F0562A' : '#5F5E5A'} strokeWidth="1.8" />
      <Path d="M12 8v8M8 12l4 4 4-4" stroke={active ? '#F0562A' : '#5F5E5A'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InventoryNavIcon({ active }: { active: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="2" stroke={active ? '#F0562A' : '#5F5E5A'} strokeWidth="1.8" />
      <Path d="M3 9h18M9 21V9" stroke={active ? '#F0562A' : '#5F5E5A'} strokeWidth="1.8" />
    </Svg>
  );
}

function MoreNavIcon({ active }: { active: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="5" cy="5" r="2" fill={active ? '#F0562A' : '#5F5E5A'} />
      <Circle cx="12" cy="5" r="2" fill={active ? '#F0562A' : '#5F5E5A'} />
      <Circle cx="19" cy="5" r="2" fill={active ? '#F0562A' : '#5F5E5A'} />
      <Circle cx="5" cy="12" r="2" fill={active ? '#F0562A' : '#5F5E5A'} />
      <Circle cx="12" cy="12" r="2" fill={active ? '#F0562A' : '#5F5E5A'} />
      <Circle cx="19" cy="12" r="2" fill={active ? '#F0562A' : '#5F5E5A'} />
      <Circle cx="5" cy="19" r="2" fill={active ? '#F0562A' : '#5F5E5A'} />
      <Circle cx="12" cy="19" r="2" fill={active ? '#F0562A' : '#5F5E5A'} />
      <Circle cx="19" cy="19" r="2" fill={active ? '#F0562A' : '#5F5E5A'} />
    </Svg>
  );
}

export const M5S01_OrdersDashboard: React.FC<M5S01Props> = ({ onNavigate, onBack, onTabChange }) => {
  const [activeFilterPill, setActiveFilterPill] = useState('All');

  const filterPills = ['All', 'Confirmed', 'Packing', 'Ready', 'Completed', 'Issues'];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header Matching Left Reference Design (Document Icon + Orders, No back arrow on root) */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.titleWrap}>
              <TouchableOpacity
                style={styles.backButton}
                activeOpacity={0.7}
                onPress={() => (onBack ? onBack() : onNavigate('AdminHome'))}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <BackArrowWhiteIcon />
              </TouchableOpacity>
              <ReceiptHeaderIcon />
              <Text style={styles.headerTitle}>Orders</Text>
            </View>
            <TouchableOpacity style={styles.bellBtn} activeOpacity={0.75}>
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
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>Order Status</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => onNavigate('M5S02')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statusGrid}>
            {/* Card 1: New Orders */}
            <TouchableOpacity
              style={styles.statusCard}
              activeOpacity={0.75}
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
              activeOpacity={0.75}
              onPress={() => onNavigate('M5S02', { status: 'Confirmed' })}
            >
              <View style={styles.statusCardTop}>
                <CheckCircleTickIcon />
              </View>
              <Text style={styles.statusNumber}>8</Text>
              <Text style={styles.statusLabel}>Confirmed</Text>
            </TouchableOpacity>

            {/* Card 3: Packing -> Directly navigates to Packing Module (M5S07) */}
            <TouchableOpacity
              style={styles.statusCard}
              activeOpacity={0.75}
              onPress={() => onNavigate('M5S07', { orderId: 'ORD-1022' })}
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
              activeOpacity={0.75}
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
              activeOpacity={0.75}
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
              activeOpacity={0.75}
              onPress={() => onNavigate('M5S16', { orderId: 'ORD-1018' })}
            >
              <View style={styles.statusCardTop}>
                <ErrorExclamationRedIcon />
              </View>
              <Text style={[styles.statusNumber, { color: ORDERS_THEME.danger }]}>2</Text>
              <Text style={styles.statusLabel}>Order Issues</Text>
            </TouchableOpacity>
          </View>

          {/* Status Filter Pills Row */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsScrollContent}
            style={styles.pillsScrollView}
          >
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
          </ScrollView>

          {/* Needs Attention Section */}
          <View style={styles.attentionHeaderRow}>
            <WarningAttentionTriangleIcon />
            <Text style={styles.attentionSectionTitle}>Needs Attention</Text>
          </View>

          {/* Attention Card 1 */}
          <TouchableOpacity
            style={[styles.attentionCard, styles.orangeLeftBorder]}
            activeOpacity={0.75}
            onPress={() => onNavigate('M5S05')}
          >
            <AttentionChecklistIcon />
            <View style={styles.attentionContent}>
              <Text style={styles.attentionTitle}>Order #ORD-1024</Text>
              <Text style={styles.attentionDesc}>Stock verification required</Text>
            </View>
            <ChevronRightGreyIcon />
          </TouchableOpacity>

          {/* Attention Card 2 */}
          <TouchableOpacity
            style={[styles.attentionCard, styles.orangeLeftBorder]}
            activeOpacity={0.75}
            onPress={() => onNavigate('M5S09')}
          >
            <AttentionPersonIcon />
            <View style={styles.attentionContent}>
              <Text style={styles.attentionTitle}>Order #ORD-1020</Text>
              <Text style={styles.attentionDesc}>Ready for pickup</Text>
            </View>
            <ChevronRightGreyIcon />
          </TouchableOpacity>

          {/* Attention Card 3 */}
          <TouchableOpacity
            style={[styles.attentionCard, styles.orangeLeftBorder]}
            activeOpacity={0.75}
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
            activeOpacity={0.75}
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
              activeOpacity={0.75}
              onPress={() => onNavigate('M5S02')}
            >
              <View style={styles.quickActionIconWrap}>
                <ViewOrdersReceiptIcon />
              </View>
              <Text style={styles.quickActionText}>View Orders</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              activeOpacity={0.75}
              onPress={() => onNavigate('M5S09')}
            >
              <View style={styles.quickActionIconWrap}>
                <AttentionPersonIcon />
              </View>
              <Text style={styles.quickActionText}>Ready for Pickup</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              activeOpacity={0.75}
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
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 2,
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
    borderRadius: ORDERS_THEME.radiusFull,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warehousePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: ORDERS_THEME.radiusFull,
    paddingHorizontal: 12,
    paddingVertical: 4.5,
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
    fontWeight: '800',
    color: ORDERS_THEME.textInk,
    fontFamily: 'Poppins',
    marginBottom: 10,
    marginTop: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 4,
  },
  viewAllText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: ORDERS_THEME.primary,
    fontFamily: 'Poppins',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  statusCard: {
    width: '48.5%',
    backgroundColor: ORDERS_THEME.cardBg,
    borderRadius: ORDERS_THEME.radiusLG,
    borderWidth: 1,
    borderColor: ORDERS_THEME.border,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  statusCardTop: {
    height: 22,
    justifyContent: 'center',
    marginBottom: 6,
  },
  newBadgeChip: {
    borderWidth: 1.3,
    borderColor: '#7A2E14',
    borderRadius: 3.5,
    paddingHorizontal: 4,
    paddingVertical: 1,
    height: 15,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newBadgeText: {
    fontFamily: 'Poppins',
    fontSize: 8.5,
    fontWeight: '800',
    color: '#7A2E14',
    letterSpacing: 0.6,
    includeFontPadding: false,
    lineHeight: 11,
    textAlign: 'center',
  },
  statusNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: ORDERS_THEME.textInk,
    fontFamily: 'Poppins',
  },
  statusLabel: {
    fontSize: 12,
    color: ORDERS_THEME.textSecondary,
    fontFamily: 'Poppins',
    fontWeight: '500',
    marginTop: 1,
  },
  pillsScrollView: {
    marginBottom: 18,
    marginHorizontal: -16,
  },
  pillsScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  pillBtn: {
    backgroundColor: ORDERS_THEME.cardBg,
    borderRadius: ORDERS_THEME.radiusFull,
    borderWidth: 1,
    borderColor: ORDERS_THEME.border,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  pillBtnActive: {
    backgroundColor: ORDERS_THEME.primary,
    borderColor: ORDERS_THEME.primary,
  },
  pillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: ORDERS_THEME.textInk,
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
    fontWeight: '800',
    color: ORDERS_THEME.textInk,
    fontFamily: 'Poppins',
  },
  attentionCard: {
    backgroundColor: ORDERS_THEME.cardBg,
    borderRadius: ORDERS_THEME.radiusLG,
    borderWidth: 1,
    borderColor: ORDERS_THEME.border,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  orangeLeftBorder: {
    borderLeftWidth: 4.5,
    borderLeftColor: ORDERS_THEME.primary,
  },
  redLeftBorder: {
    borderLeftWidth: 4.5,
    borderLeftColor: ORDERS_THEME.danger,
  },
  attentionContent: {
    flex: 1,
  },
  attentionTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: ORDERS_THEME.textInk,
    fontFamily: 'Poppins',
  },
  attentionDesc: {
    fontSize: 11.5,
    color: ORDERS_THEME.textSecondary,
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
    backgroundColor: ORDERS_THEME.cardBg,
    borderRadius: ORDERS_THEME.radiusLG,
    borderWidth: 1,
    borderColor: ORDERS_THEME.border,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: ORDERS_THEME.textInk,
    fontFamily: 'Poppins',
  },
  summaryLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: ORDERS_THEME.textSecondary,
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
    backgroundColor: ORDERS_THEME.cardBg,
    borderRadius: ORDERS_THEME.radiusLG,
    borderWidth: 1,
    borderColor: ORDERS_THEME.border,
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
    color: ORDERS_THEME.textInk,
    fontFamily: 'Poppins',
    textAlign: 'center',
  },
  bottomNav: {
    height: 62,
    backgroundColor: ORDERS_THEME.cardBg,
    borderTopWidth: 1,
    borderTopColor: ORDERS_THEME.border,
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
    color: ORDERS_THEME.textSecondary,
    fontFamily: 'Poppins',
    marginTop: 2,
  },
});
