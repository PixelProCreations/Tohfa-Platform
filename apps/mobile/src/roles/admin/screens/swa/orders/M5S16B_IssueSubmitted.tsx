import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { SWA_TYPOGRAPHY } from '../constants';

interface M5S16BProps {
  orderId?: string;
  issueId?: string;
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

function BigGreenCheckSuccessIcon() {
  return (
    <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#10B981" strokeWidth="2" />
      <Path
        d="M8 12l2.5 2.5L16 9.5"
        stroke="#10B981"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export const M5S16B_IssueSubmitted: React.FC<M5S16BProps> = ({
  issueId = 'ISS-0028',
  onNavigate,
  onBack,
}) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header matching Image 4 Left */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={onBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <BackArrowWhiteIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Issue Submitted</Text>
        </View>

        <View style={styles.contentPacked}>
          {/* Centered Green Circle Badge */}
          <View style={styles.heroContainer}>
            <View style={styles.successCircleBadge}>
              <BigGreenCheckSuccessIcon />
            </View>
            <Text style={styles.heroTitle}>Issue Submitted</Text>
          </View>

          {/* Summary Card */}
          <View style={styles.card}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Issue ID</Text>
                <Text style={styles.fieldValue}>{issueId}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Status</Text>
                <Text style={styles.fieldValue}>Open</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Fixed Action Button: Clean "Continue" navigating to Orders */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.submitBtn}
            activeOpacity={0.8}
            onPress={() => onNavigate('M5S01')}
          >
            <Text style={styles.submitBtnText}>Continue</Text>
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
  contentPacked: {
    flex: 1,
    paddingTop: 36,
    paddingHorizontal: 16,
  },
  heroContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  successCircleBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#E8F8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 19,
    fontWeight: '700',
    color: '#1D2420',
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
  bottomBar: {
    backgroundColor: '#FAF8F5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EFECE6',
  },
  submitBtn: {
    backgroundColor: '#E85226',
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
