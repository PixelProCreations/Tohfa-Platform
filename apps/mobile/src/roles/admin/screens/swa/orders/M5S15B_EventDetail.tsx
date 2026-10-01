import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { SWA_TYPOGRAPHY } from '../constants';

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
          {/* Event Detail Card matching Image 1 */}
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
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingHorizontal: 20,
    paddingVertical: 18,
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
    marginBottom: 4,
  },
  fieldValue: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: '#1D2420',
  },
});
