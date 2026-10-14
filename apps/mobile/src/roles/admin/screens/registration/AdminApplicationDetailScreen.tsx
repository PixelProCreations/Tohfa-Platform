import {
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
import type { PendingApplicationItem } from './AdminPendingApplicationsScreen';

const calendarIconAsset = require('../../assets/images/calendar.png');
const inboxIconAsset = require('../../assets/images/inbox.png');

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
  infoBannerBg: '#EAF2FD',
  infoBannerText: '#1D5C96',
  uploadedBg: '#E8F5E9',
  uploadedText: '#2E7D32',
  greenBtnBg: '#EAF4E8',
  greenBtnBorder: 'transparent',
  greenBtnText: '#226E38',
  redBtnBg: '#FDECEE',
  redBtnBorder: 'transparent',
  redBtnText: '#D8434F',
  outlineBtnBorder: '#EDE7DF',
  outlineBtnText: '#1A1412',
  stepDoneBg: '#F0562A',
  stepDoneText: '#FFFFFF',
  stepPendingBg: '#F0EBE4',
  stepPendingText: '#78736E',
};

interface Props {
  application: PendingApplicationItem;
  onBack: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onRequestMoreInfo?: () => void;
}

export const AdminApplicationDetailScreen: React.FC<Props> = ({
  application,
  onBack,
  onApprove,
  onReject,
  onRequestMoreInfo,
}) => {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={P.bg} />

      {/* Header back button */}
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
        {/* Profile Card Header */}
        <View style={styles.profileHeaderRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{application.initials}</Text>
          </View>
          <View style={styles.profileHeaderInfo}>
            <Text style={styles.farmerName}>{application.name}</Text>
            <Text style={styles.farmerSub}>
              {application.location} · {application.phone ?? '+91 98XXX XX412'} ·{' '}
              {application.appliedTime}
            </Text>
          </View>
        </View>

        {/* 3-Step Stepper */}
        <View style={styles.stepperContainer}>
          {/* Step 1 */}
          <View style={styles.stepItem}>
            <View style={[styles.stepCircle, styles.stepCircleDone]}>
              <Icon name="check" size={14} color="#FFFFFF" />
            </View>
            <Text style={styles.stepLabel}>Submitted</Text>
          </View>

          {/* Step 2 */}
          <View style={styles.stepItem}>
            <View style={[styles.stepCircle, styles.stepCircleActive]}>
              <Text style={styles.stepCircleActiveText}>2</Text>
            </View>
            <Text style={[styles.stepLabel, styles.stepLabelActive]}>Under Review</Text>
          </View>

          {/* Step 3 */}
          <View style={styles.stepItem}>
            <View style={[styles.stepCircle, styles.stepCirclePending]}>
              <Text style={styles.stepCirclePendingText}>3</Text>
            </View>
            <Text style={styles.stepLabel}>Decision</Text>
          </View>
        </View>

        {/* Applicant Metadata Card */}
        <View style={styles.card}>
          {/* Aadhaar row */}
          <View style={styles.metaRow}>
            <View style={styles.metaLabelRow}>
              <Image source={calendarIconAsset} style={styles.metaImgIcon} resizeMode="contain" />
              <Text style={styles.metaLabel}>Aadhaar</Text>
            </View>
            <Text style={styles.metaValue}>{application.aadhaar ?? 'XXXX XXXX 4821'}</Text>
          </View>
          <View style={styles.cardDivider} />

          {/* Farm size */}
          <View style={styles.metaRow}>
            <View style={styles.metaLabelRow}>
              <Icon name="home" size={16} color={P.textSecondary} style={styles.metaIcon} />
              <Text style={styles.metaLabel}>Farm size</Text>
            </View>
            <Text style={styles.metaValue}>{application.farmSize ?? '3.4 acres'}</Text>
          </View>
          <View style={styles.cardDivider} />

          {/* FMB zones */}
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
              <Text style={styles.metaLabel}>FMB zones</Text>
            </View>
            <Text style={styles.metaValue}>{application.fmbZones ?? '6 zones marked'}</Text>
          </View>
          <View style={styles.cardDivider} />

          {/* Primary crops */}
          <View style={styles.metaRow}>
            <View style={styles.metaLabelRow}>
              <Icon name="eco" size={16} color={P.textSecondary} style={styles.metaIcon} />
              <Text style={styles.metaLabel}>Primary crops</Text>
            </View>
            <Text style={styles.metaValue}>{application.primaryCrops ?? 'Carrots, Cabbage'}</Text>
          </View>
        </View>

        {/* Submitted documents Section */}
        <Text style={styles.sectionHeading}>Submitted documents</Text>

        {/* Document 1 */}
        <View style={styles.docCard}>
          <View style={[styles.docIconBox, { backgroundColor: '#FFECE8' }]}>
            <Icon name="credit_card" size={20} color={P.orange} />
          </View>
          <View style={styles.docInfo}>
            <Text style={styles.docTitle}>ID Proof — Aadhaar Card</Text>
            <Text style={styles.docSub}>{application.appliedTime.replace(/Applied/i, 'Uploaded')}</Text>
          </View>
          <View style={styles.uploadedBadge}>
            <Text style={styles.uploadedBadgeText}>Uploaded</Text>
          </View>
        </View>

        {/* Document 2 */}
        <View style={styles.docCard}>
          <View style={[styles.docIconBox, { backgroundColor: '#FFECE8' }]}>
            <Icon name="home" size={20} color={P.orange} />
          </View>
          <View style={styles.docInfo}>
            <Text style={styles.docTitle}>Farm Ownership Document</Text>
            <Text style={styles.docSub}>{application.appliedTime.replace(/Applied/i, 'Uploaded')}</Text>
          </View>
          <View style={styles.uploadedBadge}>
            <Text style={styles.uploadedBadgeText}>Uploaded</Text>
          </View>
        </View>

        {/* Review Timeline Banner */}
        <View style={styles.timelineBanner}>
          <Icon name="info" size={18} color={P.infoBannerText} style={{ marginRight: 10, marginTop: 1 }} />
          <Text style={styles.timelineBannerText}>
            {application.dayCountText ??
              'Review 3-5 day working days timeline applies — this application is on day 2 of 5.'}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.btn, styles.approveBtn]}
            activeOpacity={0.8}
            onPress={onApprove}
          >
            <Icon name="check_circle" size={18} color={P.greenBtnText} style={{ marginRight: 6 }} />
            <Text style={styles.approveBtnText}>Approve</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.rejectBtn]}
            activeOpacity={0.8}
            onPress={onReject}
          >
            <Icon name="block" size={18} color={P.redBtnText} style={{ marginRight: 6 }} />
            <Text style={styles.rejectBtnText}>Reject</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.requestInfoBtn}
          activeOpacity={0.8}
          onPress={onRequestMoreInfo}
        >
          <Image source={inboxIconAsset} style={styles.btnImgIcon} resizeMode="contain" />
          <Text style={styles.requestInfoBtnText}>Request More Info</Text>
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
    paddingTop: 10,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: P.orangeBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 18,
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
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  farmerSub: {
    fontSize: 12,
    lineHeight: 18,
    color: P.subtitle,
  },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  stepCircleDone: {
    backgroundColor: P.orange,
  },
  stepCircleActive: {
    backgroundColor: P.orange,
  },
  stepCircleActiveText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  stepCirclePending: {
    backgroundColor: P.stepPendingBg,
  },
  stepCirclePendingText: {
    color: P.stepPendingText,
    fontWeight: '600',
    fontSize: 13,
  },
  stepLabel: {
    fontSize: 11,
    color: P.textSecondary,
    fontWeight: '600',
  },
  stepLabelActive: {
    color: P.ink,
    fontWeight: '700',
  },
  card: {
    backgroundColor: P.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.cardBorder,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 22,
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
    paddingVertical: 10,
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
  btnImgIcon: {
    width: 18,
    height: 18,
    marginRight: 8,
  },
  metaLabel: {
    fontSize: 13,
    color: P.textSecondary,
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '700',
    color: P.ink,
  },
  cardDivider: {
    height: 1,
    backgroundColor: P.divider,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: P.titleBrown,
    marginBottom: 12,
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.cardBorder,
    paddingHorizontal: 16,
    paddingVertical: 14,
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
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  docInfo: {
    flex: 1,
  },
  docTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: P.ink,
    marginBottom: 3,
  },
  docSub: {
    fontSize: 12,
    color: P.textSecondary,
  },
  uploadedBadge: {
    backgroundColor: P.uploadedBg,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  uploadedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: P.uploadedText,
  },
  timelineBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: P.infoBannerBg,
    borderRadius: 14,
    padding: 14,
    marginTop: 6,
    marginBottom: 20,
  },
  timelineBannerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: P.infoBannerText,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 16,
    cursor: 'pointer' as any,
  },
  approveBtn: {
    backgroundColor: P.greenBtnBg,
  },
  approveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: P.greenBtnText,
  },
  rejectBtn: {
    backgroundColor: P.redBtnBg,
  },
  rejectBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: P.redBtnText,
  },
  requestInfoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: P.outlineBtnBorder,
    backgroundColor: '#FFFFFF',
    cursor: 'pointer' as any,
  },
  requestInfoBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: P.outlineBtnText,
  },
});
