import React, { useState } from 'react';
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Icon } from '@tohfa/mobile-ui';
import type { FarmerListItem } from '../farmers/AdminAllFarmersScreen';

const awardIconAsset = require('../../assets/images/award.png');
const calendarIconAsset = require('../../assets/images/calendar.png');

const P = {
  bg: '#FAF8F5',
  cardBg: '#FFFFFF',
  cardBorder: '#F2ECE4',
  ink: '#1A1412',
  titleBrown: '#662208',
  subtitle: '#827871',
  textSecondary: '#6B6560',
  verifiedBg: '#E8F5E9',
  verifiedText: '#2E7D32',
  pendingBg: '#FFF3E0',
  pendingText: '#B25E00',
  blockedBg: '#FCEBEA',
  blockedText: '#C62828',
  blockedIcon: '#D32F2F',
  actionGreenBg: '#E8F5E9',
  actionGreenText: '#2E7D32',
  actionRedBg: '#FCEBEA',
  actionRedText: '#D32F2F',
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
              <Image source={awardIconAsset} style={styles.certImgIcon} resizeMode="contain" />
              <Text style={styles.certTitle}>PGS Organic</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.certRow}>
            <View style={styles.certLabelRow}>
              <Image source={calendarIconAsset} style={styles.certImgIcon} resizeMode="contain" />
              <Text style={styles.certSubLabel}>Valid until</Text>
            </View>
            <Text style={styles.certDateText}>Dec 2026</Text>
          </View>
        </View>

        {/* Card 2: NPOP */}
        <View style={styles.certCard}>
          <View style={styles.certRow}>
            <View style={styles.certLabelRow}>
              <Image source={awardIconAsset} style={styles.certImgIcon} resizeMode="contain" />
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
              <Image source={calendarIconAsset} style={styles.certImgIcon} resizeMode="contain" />
              <Text style={styles.certSubLabel}>Submitted</Text>
            </View>
            <Text style={styles.certDateText}>2 weeks ago</Text>
          </View>
        </View>

        {/* Blocked Notification Banner */}
        <View style={styles.blockedBanner}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" style={styles.blockedIcon}>
            <Path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.42 0 8 3.58 8 8 0 1.85-.63 3.55-1.69 4.9z"
              fill={P.blockedIcon}
            />
          </Svg>
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
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
            <Path
              d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
              fill={P.actionGreenText}
            />
          </Svg>
          <Text style={styles.markVerifiedText}>Mark as Verified</Text>
        </TouchableOpacity>

        {/* Button: Mark as Unverified */}
        <TouchableOpacity
          style={styles.markUnverifiedBtn}
          activeOpacity={0.8}
          onPress={handleMarkUnverified}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
            <Path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.42 0 8 3.58 8 8 0 1.85-.63 3.55-1.69 4.9z"
              fill={P.actionRedText}
            />
          </Svg>
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
    cursor: 'pointer' as any,
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
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.cardBorder,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  certRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  certLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  certIcon: {
    marginRight: 10,
  },
  certImgIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  certTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: P.ink,
  },
  certSubLabel: {
    fontSize: 13.5,
    color: P.subtitle,
  },
  certDateText: {
    fontSize: 14,
    fontWeight: '700',
    color: P.ink,
  },
  cardDivider: {
    height: 1,
    backgroundColor: P.cardBorder,
  },
  verifiedBadge: {
    backgroundColor: P.verifiedBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '700',
    color: P.verifiedText,
  },
  pendingBadge: {
    backgroundColor: P.pendingBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '700',
    color: P.pendingText,
  },
  blockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.blockedBg,
    borderRadius: 16,
    padding: 14,
    marginTop: 4,
    marginBottom: 22,
  },
  blockedIcon: {
    marginRight: 10,
  },
  blockedText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#8A1F1F',
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
    cursor: 'pointer' as any,
  },
  markVerifiedText: {
    color: P.actionGreenText,
    fontSize: 15,
    fontWeight: '800',
  },
  markUnverifiedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.actionRedBg,
    borderRadius: 16,
    height: 52,
    cursor: 'pointer' as any,
  },
  markUnverifiedText: {
    color: P.actionRedText,
    fontSize: 15,
    fontWeight: '800',
  },
});
