import React, { useEffect } from 'react';
import {
  BackHandler,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { authPalette as P } from '../../theme';

function ArrowLeftIcon({ size = 20, color = P.twGray900 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function HourglassIcon({ size = 28, color = P.twAmber800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 2v4a6 6 0 003.5 5.4A6 6 0 006 17v5h12v-5a6 6 0 00-3.5-5.6A6 6 0 0018 6V2H6z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 18h6M10 7h4"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function InfoCircleIcon({ size = 18, color = P.twBlue600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.8" />
      <Line x1="12" y1="16" x2="12" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="12" cy="8" r="1" fill={color} />
    </Svg>
  );
}

function CheckIcon({ size = 18, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface CashTopUpScreenProps {
  amount?: string;
  referenceCode?: string;
  generatedOn?: string;
  validFor?: string;
  onBack?: () => void;
  onDone?: () => void;
}

export function CashTopUpScreen({
  amount = '2,000',
  referenceCode = 'CASH-TU-7734',
  generatedOn = '17 Sep 2026, 09:25 AM',
  validFor = '7 days',
  onBack,
  onDone,
}: CashTopUpScreenProps): React.JSX.Element {
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (onBack) {
        onBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [onBack]);

  const handleDone = () => {
    if (onDone) {
      onDone();
    } else if (onBack) {
      onBack();
    }
  };

  const formattedAmount = amount.startsWith('₹') ? amount : `₹${amount}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ArrowLeftIcon size={20} color={P.twGray900} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cash Top-Up</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Icon Badge */}
        <View style={styles.iconCircle}>
          <HourglassIcon size={30} color={P.twAmber800} />
        </View>

        {/* Amount */}
        <Text style={styles.amountText}>{formattedAmount}</Text>
        <Text style={styles.statusSubtitle}>Pending · Cash at Warehouse</Text>

        {/* Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Reference Code</Text>
            <Text style={styles.detailCodeValue}>{referenceCode}</Text>
          </View>
          <View style={styles.rowDivider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Generated On</Text>
            <Text style={styles.detailValue}>{generatedOn}</Text>
          </View>
          <View style={styles.rowDivider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Valid For</Text>
            <Text style={styles.detailValue}>{validFor}</Text>
          </View>
        </View>

        {/* Warehouse Guidance Info Box */}
        <View style={styles.infoBanner}>
          <View style={styles.infoIconBox}>
            <InfoCircleIcon size={18} color={P.twBlue600} />
          </View>
          <Text style={styles.infoBannerText}>
            Show this reference code and pay {formattedAmount} in cash at any TOHFA warehouse. Your wallet updates once warehouse staff manually confirm the payment — this can take a little time, it isn't instant.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Done Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={handleDone}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel="Done"
        >
          <CheckIcon size={18} color={P.white} />
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.white,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 8 : 6,
    paddingBottom: 14,
    backgroundColor: P.white,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: P.twGray900,
    letterSpacing: -0.3,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: P.white,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 32,
    alignItems: 'center',
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: P.amber50,
    borderWidth: 1,
    borderColor: P.twAmber200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  amountText: {
    fontSize: 30,
    fontWeight: '800',
    color: P.twGray900,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: P.twGray500,
    marginBottom: 26,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: P.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: P.twGray200,
    paddingHorizontal: 16,
    paddingVertical: 2,
    marginBottom: 18,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  rowDivider: {
    height: 1,
    backgroundColor: P.twGray100,
  },
  detailLabel: {
    fontSize: 13.5,
    fontWeight: '500',
    color: P.twGray600,
  },
  detailValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: P.twGray900,
  },
  detailCodeValue: {
    fontSize: 14,
    fontWeight: '800',
    color: P.twGray900,
    letterSpacing: 0.5,
  },
  infoBanner: {
    width: '100%',
    backgroundColor: P.twBlue50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.sky100,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIconBox: {
    marginRight: 10,
    marginTop: 2,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    color: P.twBlue800,
    fontWeight: '400',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'android' ? 16 : 12,
    borderTopWidth: 1,
    borderTopColor: P.twGray100,
    backgroundColor: P.white,
  },
  doneBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: P.forestGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: P.forestGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: P.white,
  },
});
