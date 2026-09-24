import React, { useEffect, useState } from 'react';
import {
  BackHandler,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Icon } from '@tohfa/mobile-ui';
import Svg, { Path } from 'react-native-svg';
import type { FarmerListItem } from './AdminAllFarmersScreen';

const telephoneIconAsset = require('../../assets/images/telephone.png');
const calendarIconAsset = require('../../assets/images/calendar.png');

const P = {
  bg: '#FAF8F5',
  cardBg: '#FFFFFF',
  cardBorder: '#F2ECE4',
  ink: '#1A1412',
  titleBrown: '#662208',
  subtitle: '#827871',
  orange: '#F0562A',
  orangeBg: '#FFECE8',
  textSecondary: '#6B6560',
  divider: '#F2ECE4',
  tabActiveBg: '#F0562A',
  tabActiveText: '#FFFFFF',
  tabInactiveText: '#4A443F',
  tabContainerBorder: '#F0ECE6',
  lockedBg: '#FFF3E0',
  lockedText: '#B25E00',
  ratingPillBg: '#FFF3E0',
  ratingPillText: '#B25E00',
  disableBtnBg: '#FFECE8',
  disableBtnText: '#D32F2F',
  greenSuccess: '#2E7D32',
};

export type FarmerDetailTabType = 'Overview' | 'Farm' | 'KYC' | 'Ratings';

interface Props {
  farmer: FarmerListItem;
  onBack: () => void;
  onEdit?: () => void;
  onDisable?: () => void;
  onOpenFarmMap?: () => void;
  onOpenKycReview?: () => void;
  onOpenRatingScorecard?: () => void;
  initialTab?: FarmerDetailTabType;
  onTabChange?: (tab: FarmerDetailTabType) => void;
}

export const AdminFarmerDetailScreen: React.FC<Props> = ({
  farmer,
  onBack,
  onEdit,
  onDisable,
  onOpenFarmMap,
  onOpenKycReview,
  onOpenRatingScorecard,
  initialTab = 'Overview',
  onTabChange,
}) => {
  const [activeTab, setActiveTab] = useState<FarmerDetailTabType>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleTabChange = (tab: FarmerDetailTabType) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  const handleBack = () => {
    if (activeTab !== 'Overview') {
      handleTabChange('Overview');
    } else {
      onBack();
    }
  };

  useEffect(() => {
    const onHardwareBack = () => {
      if (activeTab !== 'Overview') {
        handleTabChange('Overview');
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => sub.remove();
  }, [activeTab]);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={P.bg} />

      {/* Header bar with Back button and Edit (pencil) button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={handleBack}
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

        <TouchableOpacity
          style={styles.headerBtn}
          onPress={onEdit}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Edit"
        >
          <Icon name="edit" size={18} color={P.ink} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header Block */}
        <View style={styles.profileHeaderRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{farmer.initials}</Text>
          </View>

          <View style={styles.profileHeaderInfo}>
            <Text style={styles.farmerName}>{farmer.name}</Text>
            <Text style={styles.farmerSub}>
              {farmer.code} · {farmer.farmName ?? 'Wild Eden Organic Farms'}
            </Text>

            {/* Rating pill */}
            <View style={styles.ratingCapsule}>
              <Text style={styles.ratingCapsuleText}>
                ★ {farmer.rating ?? '782'} · {farmer.ratingTier ?? 'Excellent'}
              </Text>
            </View>
          </View>
        </View>

        {/* Tab Segment (Overview, Farm, KYC, Ratings) */}
        <View style={styles.tabContainer}>
          {(['Overview', 'Farm', 'KYC', 'Ratings'] as FarmerDetailTabType[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => handleTabChange(tab)}
                activeOpacity={0.8}
              >
                <Text
                  style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {activeTab === 'Overview' && (
          <>
            {/* Content Card (Overview) */}
            <View style={styles.card}>
              {/* Mobile */}
              <View style={styles.metaRow}>
                <View style={styles.metaLabelRow}>
                  <Image source={telephoneIconAsset} style={styles.metaImgIcon} resizeMode="contain" />
                  <Text style={styles.metaLabel}>Mobile</Text>
                </View>
                <View style={styles.metaRightRow}>
                  <Text style={styles.metaValue}>{farmer.mobile ?? '+91 98765 43210'}</Text>
                  <View style={styles.lockedPill}>
                    <Text style={styles.lockIcon}>🔒</Text>
                    <Text style={styles.lockedText}>Locked</Text>
                  </View>
                </View>
              </View>
              <View style={styles.cardDivider} />

              {/* Aadhaar */}
              <View style={styles.metaRow}>
                <View style={styles.metaLabelRow}>
                  <Image source={calendarIconAsset} style={styles.metaImgIcon} resizeMode="contain" />
                  <Text style={styles.metaLabel}>Aadhaar</Text>
                </View>
                <View style={styles.metaRightRow}>
                  <Text style={styles.metaValue}>{farmer.aadhaar ?? 'XXXX XXXX 7654'}</Text>
                  <View style={styles.lockedPill}>
                    <Text style={styles.lockIcon}>🔒</Text>
                    <Text style={styles.lockedText}>Locked</Text>
                  </View>
                </View>
              </View>
              <View style={styles.cardDivider} />

              {/* Location */}
              <View style={styles.metaRow}>
                <View style={styles.metaLabelRow}>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" style={styles.metaIcon}>
                    <Path
                      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                      stroke={P.textSecondary}
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"
                      stroke={P.textSecondary}
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                  <Text style={styles.metaLabel}>Location</Text>
                </View>
                <Text style={styles.metaValue}>{farmer.location}</Text>
              </View>
              <View style={styles.cardDivider} />

              {/* Member since */}
              <View style={styles.metaRow}>
                <View style={styles.metaLabelRow}>
                  <Image source={calendarIconAsset} style={styles.metaImgIcon} resizeMode="contain" />
                  <Text style={styles.metaLabel}>Member since</Text>
                </View>
                <Text style={styles.metaValue}>{farmer.memberSince ?? 'Mar 2025'}</Text>
              </View>
              <View style={styles.cardDivider} />

              {/* Subscription */}
              <View style={styles.metaRow}>
                <View style={styles.metaLabelRow}>
                  <Icon name="credit_card" size={16} color={P.textSecondary} style={styles.metaIcon} />
                  <Text style={styles.metaLabel}>Subscription</Text>
                </View>
                <Text style={[styles.metaValue, { color: P.greenSuccess }]}>
                  {farmer.subscription ?? 'Active · Paid'}
                </Text>
              </View>
            </View>

            {/* Danger button: Disable Farmer Account */}
            <TouchableOpacity
              style={styles.disableBtn}
              activeOpacity={0.8}
              onPress={onDisable}
            >
              <Icon name="block" size={18} color={P.disableBtnText} style={{ marginRight: 8 }} />
              <Text style={styles.disableBtnText}>Disable Farmer Account</Text>
            </TouchableOpacity>
          </>
        )}

        {activeTab === 'Farm' && (
          <View style={styles.tabContentContainer}>
            <View style={styles.dashedCard}>
              <Text style={styles.dashedCardText}>
                Farm FMB, zones, and field context are shown on the dedicated Farm FMB & Zone Map screen.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.primaryActionButton}
              activeOpacity={0.85}
              onPress={onOpenFarmMap}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
                <Path
                  d="M9 20.5V6.5L3 4V18L9 20.5ZM9 20.5L15 18V4L9 6.5M9 20.5V6.5M15 18L21 20.5V6.5L15 4V18Z"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={styles.primaryActionButtonText}>Open Farm Map</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'KYC' && (
          <View style={styles.tabContentContainer}>
            <View style={styles.dashedCard}>
              <Text style={styles.dashedCardText}>
                Document review happens on the dedicated KYC Document Review screen.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.primaryActionButton}
              activeOpacity={0.85}
              onPress={onOpenKycReview}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
                <Path
                  d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM7 10H9V12H7V10ZM7 7H9V9H7V7ZM7 13H9V15H7V13ZM11 7H17V9H11V7ZM11 10H17V12H11V10ZM11 13H17V15H11V13Z"
                  fill="#FFFFFF"
                />
              </Svg>
              <Text style={styles.primaryActionButtonText}>Open KYC Review</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'Ratings' && (
          <View style={styles.tabContentContainer}>
            <View style={styles.dashedCard}>
              <Text style={styles.dashedCardText}>
                Full 10-category scorecard is on the dedicated Farm Rating Scorecard screen.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.primaryActionButton}
              activeOpacity={0.85}
              onPress={onOpenRatingScorecard}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
                <Path
                  d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={styles.primaryActionButtonText}>Open Rating Scorecard</Text>
            </TouchableOpacity>
          </View>
        )}

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
  },
  headerBtn: {
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
    paddingTop: 10,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: P.orangeBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: P.titleBrown,
  },
  profileHeaderInfo: {
    flex: 1,
  },
  farmerName: {
    fontSize: 20,
    fontWeight: '800',
    color: P.titleBrown,
    marginBottom: 3,
  },
  farmerSub: {
    fontSize: 12,
    color: P.subtitle,
    marginBottom: 8,
  },
  ratingCapsule: {
    alignSelf: 'flex-start',
    backgroundColor: P.ratingPillBg,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  ratingCapsuleText: {
    fontSize: 12,
    fontWeight: '700',
    color: P.ratingPillText,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.tabContainerBorder,
    padding: 4,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    cursor: 'pointer' as any,
  },
  tabButtonActive: {
    backgroundColor: P.tabActiveBg,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: P.tabInactiveText,
  },
  tabButtonTextActive: {
    color: P.tabActiveText,
    fontWeight: '700',
  },
  card: {
    backgroundColor: P.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.cardBorder,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  metaLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    marginRight: 10,
  },
  metaImgIcon: {
    width: 16,
    height: 16,
    marginRight: 10,
  },
  metaLabel: {
    fontSize: 13,
    color: P.textSecondary,
    fontWeight: '500',
  },
  metaRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '700',
    color: P.ink,
  },
  lockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.lockedBg,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  lockIcon: {
    fontSize: 10,
    marginRight: 3,
  },
  lockedText: {
    fontSize: 10,
    fontWeight: '700',
    color: P.lockedText,
  },
  cardDivider: {
    height: 1,
    backgroundColor: P.divider,
  },
  disableBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 16,
    backgroundColor: P.disableBtnBg,
    cursor: 'pointer' as any,
  },
  disableBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: P.disableBtnText,
  },
  tabContentContainer: {
    marginBottom: 20,
  },
  dashedCard: {
    borderWidth: 1.5,
    borderColor: '#E8DFD5',
    borderStyle: 'dashed',
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#FAF8F5',
    marginBottom: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashedCardText: {
    fontSize: 13.5,
    lineHeight: 20,
    color: P.subtitle,
    textAlign: 'center',
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.orange,
    borderRadius: 16,
    height: 52,
    shadowColor: P.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
    cursor: 'pointer' as any,
  },
  primaryActionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
