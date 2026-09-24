import React from 'react';
import {
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

const P = {
  bg: '#FAF8F5',
  cardBg: '#FFFFFF',
  cardBorder: '#F2ECE4',
  ink: '#1A1412',
  titleBrown: '#662208',
  subtitle: '#827871',
  orange: '#F0562A',
  textSecondary: '#6B6560',
  verifiedBg: '#E8F5E9',
  verifiedText: '#2E7D32',
  pendingBg: '#FFF3E0',
  pendingText: '#B25E00',
  warningBannerBg: '#FFF8E1',
  warningBannerText: '#8D6E63',
  warningIcon: '#B25E00',
};

interface Props {
  farmer: FarmerListItem;
  onBack: () => void;
  onGoToCertificationVerification: () => void;
}

export const AdminKycReviewScreen: React.FC<Props> = ({
  farmer,
  onBack,
  onGoToCertificationVerification,
}) => {
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
        <Text style={styles.title}>KYC Document Review</Text>
        <Text style={styles.subtitle}>
          {farmer.name} · {farmer.code}
        </Text>

        {/* Document 1: Aadhaar Card */}
        <View style={styles.docCard}>
          <View style={styles.docIconBox}>
            <Icon name="credit_card" size={20} color={P.orange} />
          </View>
          <View style={styles.docInfo}>
            <Text style={styles.docTitle}>Aadhaar Card</Text>
            <Text style={styles.docSub}>Verified 4 months ago</Text>
          </View>
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        </View>

        {/* Document 2: Farm Ownership Document */}
        <View style={styles.docCard}>
          <View style={styles.docIconBox}>
            <Icon name="home" size={20} color={P.orange} />
          </View>
          <View style={styles.docInfo}>
            <Text style={styles.docTitle}>Farm Ownership Document</Text>
            <Text style={styles.docSub}>Verified 4 months ago</Text>
          </View>
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        </View>

        {/* Document 3: PGS Organic Certificate */}
        <View style={styles.docCard}>
          <View style={styles.docIconBox}>
            <Icon name="military_tech" size={20} color={P.orange} />
          </View>
          <View style={styles.docInfo}>
            <Text style={styles.docTitle}>PGS Organic Certificate</Text>
            <Text style={styles.docSub}>Uploaded 2 weeks ago</Text>
          </View>
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingText}>Pending</Text>
          </View>
        </View>

        {/* Warning Callout */}
        <View style={styles.warningBanner}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" style={styles.warningIcon}>
            <Path
              d="M12 2L1 21h22L12 2zm0 3.8L20.2 19H3.8L12 5.8zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"
              fill={P.warningIcon}
            />
          </Svg>
          <Text style={styles.warningText}>
            Certification document is pending manual verification — go to Certification Verification to complete this.
          </Text>
        </View>

        {/* Primary Action Button: Go to Certification Verification */}
        <TouchableOpacity
          style={styles.primaryBtn}
          activeOpacity={0.85}
          onPress={onGoToCertificationVerification}
        >
          <Icon name="military_tech" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.primaryBtnText}>Go to Certification Verification</Text>
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
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.cardBorder,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  docIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFECE8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  docInfo: {
    flex: 1,
  },
  docTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: P.ink,
    marginBottom: 3,
  },
  docSub: {
    fontSize: 12,
    color: P.subtitle,
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
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: P.warningBannerBg,
    borderRadius: 16,
    padding: 14,
    marginTop: 6,
    marginBottom: 20,
  },
  warningIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: '#6D4C41',
  },
  primaryBtn: {
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
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
