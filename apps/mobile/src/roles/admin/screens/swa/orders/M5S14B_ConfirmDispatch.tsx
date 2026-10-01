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

interface M5S14BProps {
  orderId?: string;
  onNavigate: (screen: string, params?: any) => void;
  onBack: () => void;
}

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

function QuestionCircleOrangeIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#C2410C" strokeWidth="2" />
      <Path
        d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"
        stroke="#C2410C"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function CheckmarkWhiteIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export const M5S14B_ConfirmDispatch: React.FC<M5S14BProps> = ({
  orderId = 'ORD-1021',
  onNavigate,
  onBack,
}) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header matching Image 3 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={onBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <BackArrowWhiteIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Confirm Dispatch</Text>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Amber Alert Banner matching Image 3 */}
          <View style={styles.confirmPromptBox}>
            <QuestionCircleOrangeIcon />
            <Text style={styles.confirmPromptText}>Confirm Dispatch?</Text>
          </View>

          {/* Summary Card */}
          <View style={styles.card}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Order</Text>
                <Text style={styles.fieldValue}>{orderId}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Destination</Text>
                <Text style={styles.fieldValue}>Ooty Road, Coonoor</Text>
              </View>
            </View>

            <View style={[styles.singleRow, { marginTop: 14 }]}>
              <Text style={styles.fieldLabel}>Delivery Slot</Text>
              <Text style={styles.fieldValue}>AFTERNOON_12_4</Text>
            </View>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* Bottom Fixed Action Button matching Image 3 */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.8}
            onPress={() => onNavigate('M5S14C', { orderId })}
          >
            <CheckmarkWhiteIcon />
            <Text style={styles.primaryBtnText}>Confirm Dispatch</Text>
          </TouchableOpacity>
        </View>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 16,
  },
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
  },
  singleRow: {},
  fieldLabel: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 11.5,
    fontWeight: '500',
    color: '#78716C',
    marginBottom: 3,
  },
  fieldValue: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: '#1D2420',
  },
  confirmPromptBox: {
    backgroundColor: '#FEF9EE',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  confirmPromptText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 14.5,
    fontWeight: '700',
    color: '#9A3412',
  },
  bottomBar: {
    backgroundColor: '#FAF8F5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EFECE6',
  },
  primaryBtn: {
    backgroundColor: '#E85226',
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
