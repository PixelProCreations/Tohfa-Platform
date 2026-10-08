import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ORDERS_THEME } from './theme';

interface M5S15BProps {
  orderId?: string;
  eventName?: string;
  eventTime?: string;
  eventDate?: string;
  performedBy?: string;
  onNavigate?: (screen: string, params?: any) => void;
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

export const M5S15B_EventDetail: React.FC<M5S15BProps> = ({
  orderId = 'ORD-1024',
  eventName = 'OTP Verified',
  eventTime = '12:19 PM',
  eventDate = '24 Sep 2026',
  performedBy = 'Warehouse Admin',
  onBack,
}) => {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#F0562A" />
      <SafeAreaView style={styles.topSafeArea} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header matching Image 1 */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.7}
              onPress={onBack}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <BackArrowWhiteIcon />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Event Detail</Text>
          </View>

          <View style={styles.content}>
            {/* Event Detail Card */}
            <View style={styles.card}>
              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Event</Text>
                  <Text style={styles.fieldValue}>{eventName}</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Date</Text>
                  <Text style={styles.fieldValue}>{eventDate}</Text>
                </View>
              </View>

              <View style={[styles.twoColRow, { marginTop: 16 }]}>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Time</Text>
                  <Text style={styles.fieldValue}>{eventTime}</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Performed By</Text>
                  <Text style={styles.fieldValue}>{performedBy}</Text>
                </View>
              </View>

              <View style={[styles.singleRow, { marginTop: 16 }]}>
                <Text style={styles.fieldLabel}>Reference</Text>
                <Text style={styles.fieldValue}>{orderId}</Text>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  topSafeArea: {
    flex: 0,
    backgroundColor: '#F0562A',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  container: {
    flex: 1,
    backgroundColor: ORDERS_THEME.pageBg,
  },
  header: {
    backgroundColor: '#F0562A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
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
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    backgroundColor: ORDERS_THEME.cardBg,
    borderRadius: ORDERS_THEME.radiusLG,
    borderWidth: 1,
    borderColor: ORDERS_THEME.border,
    paddingHorizontal: 20,
    paddingVertical: 18,
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
  singleRow: {},
  fieldLabel: {
    fontFamily: 'Poppins',
    fontSize: 11.5,
    fontWeight: '500',
    color: ORDERS_THEME.textSecondary,
    marginBottom: 4,
  },
  fieldValue: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '700',
    color: ORDERS_THEME.textInk,
  },
});
