import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { Icon } from '@tohfa/mobile-ui';
import type { FarmerListItem } from '../farmers/AdminAllFarmersScreen';

// Custom SVG Rosette Ribbon matching exact design reference
function RosetteRibbonIcon({
  size = 22,
  color = '#4B5563',
  style,
}: {
  size?: number;
  color?: string;
  style?: any;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Circle
        cx="12"
        cy="8.5"
        r="5.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8.2 13.2L6.8 20.2L12 16.8L17.2 20.2L15.8 13.2"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Custom SVG Calendar Icon matching exact design reference
function CalendarOutlineIcon({
  size = 20,
  color = '#4B5563',
  style,
}: {
  size?: number;
  color?: string;
  style?: any;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Rect
        x="3"
        y="4"
        width="18"
        height="17"
        rx="3"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M16 2V6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M8 2V6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M3 10H21" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

const P = {
  bg: '#FAF8F5',
  cardBg: '#FFFFFF',
  cardBorder: '#EFE8DE',
  divider: '#F3EFE9',

  // Exact typography colors from reference image
  titleBrown: '#662208',
  subtitle: '#827871',
  itemTitle: '#374151',
  itemSubLabel: '#4B5563',
  itemValue: '#111827',
  iconColor: '#4B5563',

  // Badges
  verifiedBg: '#EAF7EE',
  verifiedText: '#166534',
  pendingBg: '#FEF3E2',
  pendingText: '#92400E',

  // Blocked banner & action buttons
  blockedBg: '#FDF2F0',
  blockedBorder: '#FADBD8',
  blockedText: '#991B1B',
  blockedIcon: '#DC2626',
  actionGreenBg: '#EAF7EE',
  actionGreenText: '#166534',
  actionRedBg: '#FDF2F0',
  actionRedText: '#DC2626',
};

interface Props {
  farmer: FarmerListItem;
  onBack: () => void;
  onVerified?: () => void;
  onUnverified?: () => void;
}

export const AdminCertVerificationScreen: React.FC<Props> = ({
  farmer,
  onBack,
  onVerified,
  onUnverified,
}) => {
  const [npopStatus, setNpopStatus] = useState<'Pending' | 'Verified' | 'Unverified'>('Pending');

  const handleMarkVerified = () => {
    setNpopStatus('Verified');
    Alert.alert('Success', 'Certification marked as Verified');
    if (onVerified) onVerified();
  };

  const handleMarkUnverified = () => {
    setNpopStatus('Unverified');
    Alert.alert('Updated', 'Certification marked as Unverified');
    if (onUnverified) onUnverified();
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={P.bg} />

      {/* Header with Back button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 19L8 12L15 5"
              stroke="#2B2523"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Title & Subtitle */}
        <Text style={styles.title}>Certification Verification</Text>
        <Text style={styles.subtitle}>
          {farmer.name} · {farmer.code}
        </Text>

        {/* Card 1: PGS Organic */}
        <View style={styles.certCard}>
          <View style={styles.certRow}>
            <View style={styles.certLabelRow}>
              <RosetteRibbonIcon size={22} color={P.iconColor} style={styles.certIcon} />
              <Text style={styles.certTitle}>PGS Organic</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.certRow}>
            <View style={styles.certLabelRow}>
              <CalendarOutlineIcon size={20} color={P.iconColor} style={styles.certIcon} />
              <Text style={styles.certSubLabel}>Valid until</Text>
            </View>
            <Text style={styles.certDateText}>Dec 2026</Text>
          </View>
        </View>

        {/* Card 2: NPOP */}
        <View style={styles.certCard}>
          <View style={styles.certRow}>
            <View style={styles.certLabelRow}>
              <RosetteRibbonIcon size={22} color={P.iconColor} style={styles.certIcon} />
              <Text style={styles.certTitle}>NPOP</Text>
            </View>
            <View
              style={[
                styles.pendingBadge,
                npopStatus === 'Verified' && styles.verifiedBadge,
                npopStatus === 'Unverified' && { backgroundColor: P.blockedBg },
              ]}
            >
              <Text
                style={[
                  styles.pendingText,
                  npopStatus === 'Verified' && styles.verifiedText,
                  npopStatus === 'Unverified' && { color: P.blockedText },
                ]}
              >
                {npopStatus}
              </Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.certRow}>
            <View style={styles.certLabelRow}>
              <CalendarOutlineIcon size={20} color={P.iconColor} style={styles.certIcon} />
              <Text style={styles.certSubLabel}>Submitted</Text>
            </View>
            <Text style={styles.certDateText}>2 weeks ago</Text>
          </View>
        </View>

        {/* Blocked Notification Banner */}
        <View style={styles.blockedBanner}>
          <Icon name="block" size={20} color={P.blockedIcon} style={styles.blockedIcon} />
          <Text style={styles.blockedText}>
            New listings are blocked while NPOP verification is pending.
          </Text>
        </View>

        {/* Button: Mark as Verified */}
        <TouchableOpacity
          style={styles.markVerifiedBtn}
          activeOpacity={0.8}
          onPress={handleMarkVerified}
        >
          <Icon name="check_circle" size={19} color={P.actionGreenText} style={{ marginRight: 8 }} />
          <Text style={styles.markVerifiedText}>Mark as Verified</Text>
        </TouchableOpacity>

        {/* Button: Mark as Unverified */}
        <TouchableOpacity
          style={styles.markUnverifiedBtn}
          activeOpacity={0.8}
          onPress={handleMarkUnverified}
        >
          <Icon name="block" size={19} color={P.actionRedText} style={{ marginRight: 8 }} />
          <Text style={styles.markUnverifiedText}>Mark as Unverified</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: P.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EFE7DE',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: P.titleBrown,
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13.5,
    lineHeight: 19,
    color: P.subtitle,
    marginBottom: 20,
  },
  certCard: {
    backgroundColor: P.cardBg,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: P.cardBorder,
    paddingHorizontal: 18,
    paddingVertical: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  certRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  certLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  certIcon: {
    marginRight: 12,
  },
  certTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: P.itemTitle,
    letterSpacing: -0.1,
  },
  certSubLabel: {
    fontSize: 15.5,
    fontWeight: '500',
    color: P.itemSubLabel,
    letterSpacing: -0.1,
  },
  certDateText: {
    fontSize: 16.5,
    fontWeight: '700',
    color: P.itemValue,
    letterSpacing: -0.2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: P.divider,
  },
  verifiedBadge: {
    backgroundColor: P.verifiedBg,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5.5,
  },
  verifiedText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: P.verifiedText,
  },
  pendingBadge: {
    backgroundColor: P.pendingBg,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5.5,
  },
  pendingText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: P.pendingText,
  },
  blockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.blockedBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.blockedBorder,
    padding: 14,
    marginTop: 4,
    marginBottom: 20,
  },
  blockedIcon: {
    marginRight: 10,
  },
  blockedText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: P.blockedText,
    fontWeight: '500',
  },
  markVerifiedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.actionGreenBg,
    borderRadius: 16,
    height: 52,
    marginBottom: 12,
  },
  markVerifiedText: {
    color: P.actionGreenText,
    fontSize: 15.5,
    fontWeight: '700',
  },
  markUnverifiedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.actionRedBg,
    borderRadius: 16,
    height: 52,
    marginBottom: 20,
  },
  markUnverifiedText: {
    color: P.actionRedText,
    fontSize: 15.5,
    fontWeight: '700',
  },
});

export default AdminCertVerificationScreen;
