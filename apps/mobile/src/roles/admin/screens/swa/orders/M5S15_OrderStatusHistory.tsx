import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { ORDERS_THEME } from './theme';
import { SWABottomNav } from '../components/SWABottomNav';

interface M5S15Props {
  orderId?: string;
  onNavigate: (screen: string, params?: any) => void;
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

function TimelineGreenNode() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9.5" stroke="#16A34A" strokeWidth="2" fill="#FFFFFF" />
      <Circle cx="12" cy="12" r="4.5" fill="#16A34A" />
    </Svg>
  );
}

export const M5S15_OrderStatusHistory: React.FC<M5S15Props> = ({
  orderId = 'ORD-1024',
  onNavigate,
  onBack,
}) => {
  const steps = [
    { id: '1', title: 'Order Placed ✓', time: '24 Sep · 10:32 AM' },
    { id: '2', title: 'Order Confirmed ✓', time: '10:34 AM' },
    { id: '3', title: 'Stock Checked ✓', time: '10:40 AM' },
    { id: '4', title: 'Packed ✓', time: '11:15 AM' },
    { id: '5', title: 'Ready for Pickup ✓', time: '11:20 AM' },
    { id: '6', title: 'Customer Arrived ✓', time: '12:18 PM' },
    { id: '7', title: 'OTP Verified ✓', time: '12:19 PM' },
    { id: '8', title: 'Picked Up ✓', time: '12:20 PM' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={onBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <BackArrowWhiteIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Status History</Text>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Order Ref Label on Canvas */}
          <Text style={styles.orderRefLabel}>{orderId}</Text>

          {/* Vertical Timeline */}
          <View style={styles.timelineContainer}>
            {steps.map((step, index) => {
              const isLast = index === steps.length - 1;
              return (
                <View key={step.id} style={styles.stepRow}>
                  {/* Indicator Column */}
                  <View style={styles.indicatorCol}>
                    <TimelineGreenNode />
                    {!isLast && <View style={styles.verticalGreenLine} />}
                  </View>

                  {/* Text Column - Clicking opens Event Detail */}
                  <TouchableOpacity
                    style={styles.textCol}
                    activeOpacity={0.7}
                    onPress={() =>
                      onNavigate &&
                      onNavigate('M5S15B', {
                        orderId,
                        eventName: step.title.replace(' ✓', ''),
                        eventTime: step.time,
                        eventDate: '24 Sep 2026',
                        performedBy: 'Warehouse Admin',
                      })
                    }
                  >
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <Text style={styles.stepTime}>{step.time}</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Bottom Navigation */}
        <SWABottomNav
          activeTab="More"
          onTabChange={(tab) => {
            if (tab === 'Home') onBack();
          }}
        />
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 12,
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontFamily: 'Poppins',
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  orderRefLabel: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '600',
    color: ORDERS_THEME.textSecondary,
    marginBottom: 16,
    paddingLeft: 4,
  },
  timelineContainer: {
    marginBottom: 20,
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 52,
  },
  indicatorCol: {
    width: 28,
    alignItems: 'center',
  },
  verticalGreenLine: {
    width: 1.5,
    flex: 1,
    backgroundColor: '#D6D3D1',
    marginVertical: 4,
  },
  textCol: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 16,
  },
  stepTitle: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '700',
    color: ORDERS_THEME.textInk,
    marginBottom: 2,
  },
  stepTime: {
    fontFamily: 'Poppins',
    fontSize: 11.5,
    fontWeight: '500',
    color: ORDERS_THEME.textSecondary,
  },
});
