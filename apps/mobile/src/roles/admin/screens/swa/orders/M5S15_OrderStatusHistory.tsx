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
import { SWA_TYPOGRAPHY } from '../constants';
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

function InfoCircleBlueIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#2563EB" strokeWidth="2" />
      <Path d="M12 16v-4M12 8h.01" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function TimelineGreenNode() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke="#16A34A" strokeWidth="2.5" />
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
        {/* Top Header - Orange Theme matching Image 5 */}
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

        {/* Subtitle directly below header */}
        <View style={styles.subtitleRow}>
          <Text style={styles.subtitleText}>{orderId}</Text>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Vertical Timeline matching Image 5 */}
          <View style={styles.timelineContainer}>
            {steps.map((step, index) => {
              const isLast = index === steps.length - 1;
              return (
                <View key={step.id} style={styles.stepRow}>
                  {/* Indicator Column with Circle and Vertical Line */}
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

          {/* Blue Info Alert Box matching Image 5 */}
          <View style={styles.infoBox}>
            <InfoCircleBlueIcon />
            <Text style={styles.infoText}>
              For delivery orders, this same timeline shows Dispatched → Out for Delivery → Delivered instead — delivery status is configurable, per the source.
            </Text>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Bottom Navigation matching Image 5 */}
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
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
    width: 2,
    flex: 1,
    backgroundColor: '#CBD5E1',
    marginVertical: 4,
  },
  textCol: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 16,
  },
  stepTitle: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: '#1D2420',
    marginBottom: 2,
  },
  stepTime: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 11.5,
    fontWeight: '500',
    color: '#78716C',
  },
  infoBox: {
    backgroundColor: '#EBF5FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 11.5,
    fontWeight: '600',
    color: '#1E40AF',
    lineHeight: 16,
  },
});
