import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { fetchMe, logout, type UserMe } from '../../../farmer/api/auth';
import { colors } from '../../../farmer/theme';

// ─── Design Tokens (Matching Screen 11 Mockup) ────────────────────────────────
const PALETTE = {
  titleRust:     '#7E2E11',
  orange:        '#E85226',
  pageBg:        '#FAF8F5',
  cardBg:        '#FFFFFF',
  ink:           '#1A1412',
  labelMuted:    '#7D7571',
  border:        '#EDE8E0',
  peachBadge:    '#FDEEE9',
  peachText:     '#943818',
  peachIconBg:   '#FDEEE9',
  blueIconBg:    '#EBF3FA',
  blueText:      '#2563EB',
  greenBadge:    '#EAF5EA',
  greenText:     '#0D8253',
  tabInactive:   '#7D7571',
  tabBorder:     '#EDE8E0',
  alertBorder:   '#F0ECE4',
};

type FarmerAdminTab = 'Dashboard' | 'Listings' | 'Community' | 'Profile';

// ─── SVG Icons Matching Screen 11 ─────────────────────────────────────────────
function SproutIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 20h10M12 20v-8M12 12a5 5 0 015-5h2v2a5 5 0 01-5 5h-2zM12 12a5 5 0 00-5-5H5v2a5 5 0 005 5h2z"
        stroke={PALETTE.peachText}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PersonAvatarIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"
        stroke={PALETTE.orange}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function HexagonReviewIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
        stroke={PALETTE.orange}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CalendarScheduleIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="3" stroke={PALETTE.blueText} strokeWidth="2" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={PALETTE.blueText} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function LeafIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 20A7 7 0 019.8 6.1C15.5 5 17 4.5 21 2c-.5 4-1 5.5-2.1 11.2A7 7 0 0111 20z"
        stroke={PALETTE.orange}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M2 21c0-4 3.5-7.5 7.5-7.5" stroke={PALETTE.orange} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function BlockIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={PALETTE.labelMuted} strokeWidth="2" />
      <Path d="M4.93 4.93l14.14 14.14" stroke={PALETTE.labelMuted} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ScaleDisputeIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3v18M6 8l6-5 6 5M6 8l-3 7h6L6 8zM18 8l-3 7h6l-3-7z"
        stroke={PALETTE.titleRust}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronRight() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke="#9A928D" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DashboardTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.orange : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <Rect x="14" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <Rect x="3" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <Rect x="14" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function ListingsTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.orange : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CommunityTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.orange : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ProfileTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.orange : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface FarmerAdminDashboardScreenProps {
  onSignOut: () => void;
  onNavigate?: (screen: string) => void;
}

export function FarmerAdminDashboardScreen({
  onSignOut,
  onNavigate,
}: FarmerAdminDashboardScreenProps) {
  const [activeTab, setActiveTab] = useState<FarmerAdminTab>('Dashboard');
  const [user, setUser] = useState<UserMe | null>(null);

  useEffect(() => {
    fetchMe()
      .then((me) => setUser(me))
      .catch(() => {});
  }, []);

  const displayName = user?.fullName ?? 'Selvam Murugan';

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.pageBg} />

      <View style={{ flex: 1 }}>
        {activeTab === 'Dashboard' && (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollPad}
            showsVerticalScrollIndicator={false}
          >
            {/* Header Greeting (Matching Screen 11) */}
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.greetSmall}>Vanakkam,</Text>
                <Text style={styles.greetName}>{displayName}</Text>
                <View style={styles.rolePill}>
                  <SproutIcon />
                  <Text style={styles.rolePillText}>Farmer Admin · Elected</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.avatarBtn}
                onPress={() => setActiveTab('Profile')}
                activeOpacity={0.8}
              >
                <PersonAvatarIcon />
              </TouchableOpacity>
            </View>

            {/* Section 1: Community queue */}
            <Text style={styles.sectionTitle}>Community queue</Text>
            <View style={styles.queueGrid}>
              <TouchableOpacity
                style={styles.queueCard}
                onPress={() => setActiveTab('Listings')}
                activeOpacity={0.75}
              >
                <View style={styles.queueIconBox}>
                  <HexagonReviewIcon />
                </View>
                <Text style={styles.queueNumber}>11</Text>
                <Text style={styles.queueLabel}>Listings to Review</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.queueCard}
                onPress={() => Alert.alert('Field Visits', '3 Field verification audits are currently scheduled for Kotagiri and Coonoor.')}
                activeOpacity={0.75}
              >
                <View style={styles.queueIconBox}>
                  <CalendarScheduleIcon />
                </View>
                <Text style={styles.queueNumber}>3</Text>
                <Text style={styles.queueLabel}>Field Visits Scheduled</Text>
              </TouchableOpacity>
            </View>

            {/* Section 2: Listings awaiting your approval */}
            <Text style={styles.sectionTitle}>Listings awaiting your approval</Text>
            <View style={styles.cardStack}>
              {/* Item 1 */}
              <TouchableOpacity
                style={styles.listingApprovalCard}
                onPress={() => Alert.alert('Review Batch', 'Carrots – Grade 1 (80kg) submitted by Farmer #TOHFA-F-00312. Fair price benchmark validated.')}
                activeOpacity={0.75}
              >
                <View style={styles.leafIconCircle}>
                  <LeafIcon />
                </View>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.listingCardTitle}>Carrots – Grade 1, 80kg</Text>
                  <Text style={styles.listingCardSub}>Submitted by Farmer #TOHFA-F-00312</Text>
                </View>
                <ChevronRight />
              </TouchableOpacity>

              {/* Item 2 */}
              <View style={styles.listingApprovalCardDisabled}>
                <View style={styles.blockIconCircle}>
                  <BlockIcon />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listingCardTitle}>Beetroot – your own listing</Text>
                  <Text style={styles.listingCardSub}>Auto-routed to TOHFA Admin — conflict of interest</Text>
                </View>
              </View>
            </View>

            {/* Section 3: Dispute mediation */}
            <Text style={styles.sectionTitle}>Dispute mediation</Text>
            <View style={styles.disputeCard}>
              <View style={styles.disputeHeader}>
                <ScaleDisputeIcon />
                <Text style={styles.disputeTitle}>1 active dispute — pricing disagreement</Text>
              </View>
              <Text style={styles.disputeBody}>
                Between Farmer #TOHFA-F-00289 and Coonoor warehouse quality check.
              </Text>
              <TouchableOpacity
                onPress={() => Alert.alert('Dispute Mediation Desk', 'Opening dispute room between Farmer #TOHFA-F-00289 and WH-COON.')}
                activeOpacity={0.7}
              >
                <Text style={styles.disputeLink}>Mediate now →</Text>
              </TouchableOpacity>
            </View>

            {/* Section 4: Quick actions */}
            <Text style={styles.sectionTitle}>Quick actions</Text>
            <View style={styles.quickRow}>
              <TouchableOpacity
                style={styles.quickBtn}
                onPress={() => Alert.alert('Schedule Visit', 'Schedule a new field visit or farm survey inspection.')}
                activeOpacity={0.75}
              >
                <CalendarScheduleIcon />
                <Text style={styles.quickBtnLabel}>Schedule Visit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickBtn}
                onPress={() => setActiveTab('Community')}
                activeOpacity={0.75}
              >
                <CommunityTabIcon active={false} />
                <Text style={styles.quickBtnLabel}>Community</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickBtn}
                onPress={() => Alert.alert('Farmer Ratings', 'View smallholder ratings & organic adherence scorecards.')}
                activeOpacity={0.75}
              >
                <ListingsTabIcon active={false} />
                <Text style={styles.quickBtnLabel}>Ratings</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 28 }} />
          </ScrollView>
        )}

        {/* Listings Queue Tab */}
        {activeTab === 'Listings' && (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Farmer Community Listings (11)</Text>
            <Text style={styles.subHint}>Review batches submitted by farmers in your local taluk</Text>
            
            <View style={[styles.cardStack, { marginTop: 14 }]}>
              <TouchableOpacity
                style={styles.listingApprovalCard}
                onPress={() => Alert.alert('Approve Listing', 'Carrots – Grade 1 (80kg) approved for Coonoor hub receipt.')}
                activeOpacity={0.75}
              >
                <View style={styles.leafIconCircle}><LeafIcon /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listingCardTitle}>Carrots – Grade 1, 80kg</Text>
                  <Text style={styles.listingCardSub}>Farmer #TOHFA-F-00312 • Asking ₹38/kg</Text>
                </View>
                <ChevronRight />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.listingApprovalCard}
                onPress={() => Alert.alert('Approve Listing', 'Nilgiris Special CTC Tea (200kg) approved.')}
                activeOpacity={0.75}
              >
                <View style={styles.leafIconCircle}><LeafIcon /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listingCardTitle}>Nilgiris CTC Tea – 200kg</Text>
                  <Text style={styles.listingCardSub}>Farmer #TOHFA-F-00194 • Asking ₹242/kg</Text>
                </View>
                <ChevronRight />
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* Community Tab */}
        {activeTab === 'Community' && (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Farmer Community Desk</Text>
            <Text style={styles.subHint}>Nilgiris Smallholder Association • 1,284 Registered</Text>
            <View style={[styles.disputeCard, { marginTop: 14 }]}>
              <Text style={styles.disputeTitle}>Community Announcement</Text>
              <Text style={styles.disputeBody}>
                Next cooperative fair pricing committee meeting is scheduled for Saturday 10:00 AM at Ooty Central Hub.
              </Text>
            </View>
          </ScrollView>
        )}

        {/* Profile Tab */}
        {activeTab === 'Profile' && (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
            <View style={styles.profileBox}>
              <View style={styles.bigAvatar}><PersonAvatarIcon /></View>
              <Text style={styles.profName}>{displayName}</Text>
              <Text style={styles.profRole}>Farmer Admin · Elected Smallholder Representative</Text>
              <Text style={styles.profEmail}>{user?.email ?? 'farmeradmin@tohfa.test'}</Text>
            </View>

            <TouchableOpacity
              style={styles.signOutBtn}
              onPress={async () => {
                await logout();
                onSignOut();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.signOutText}>Sign Out of Farmer Admin</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      {/* ─── Bottom Navigation Tab Bar (Matching Screen 11) ─── */}
      <View style={styles.tabBar}>
        <Pressable
          style={styles.tabItem}
          onPress={() => setActiveTab('Dashboard')}
          accessibilityRole="tab"
        >
          <DashboardTabIcon active={activeTab === 'Dashboard'} />
          <Text style={[styles.tabLabel, activeTab === 'Dashboard' && styles.tabLabelActive]}>Dashboard</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => setActiveTab('Listings')}
          accessibilityRole="tab"
        >
          <ListingsTabIcon active={activeTab === 'Listings'} />
          <Text style={[styles.tabLabel, activeTab === 'Listings' && styles.tabLabelActive]}>Listings</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => setActiveTab('Community')}
          accessibilityRole="tab"
        >
          <CommunityTabIcon active={activeTab === 'Community'} />
          <Text style={[styles.tabLabel, activeTab === 'Community' && styles.tabLabelActive]}>Community</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => setActiveTab('Profile')}
          accessibilityRole="tab"
        >
          <ProfileTabIcon active={activeTab === 'Profile'} />
          <Text style={[styles.tabLabel, activeTab === 'Profile' && styles.tabLabelActive]}>Profile</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  greetSmall: {
    fontSize: 13,
    color: PALETTE.labelMuted,
    marginBottom: 2,
  },
  greetName: {
    fontSize: 22,
    fontWeight: '800',
    color: PALETTE.ink,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: PALETTE.peachBadge,
    borderRadius: 14,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
  },
  rolePillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: PALETTE.peachText,
  },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PALETTE.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.titleRust,
    marginTop: 18,
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  subHint: {
    fontSize: 12,
    color: PALETTE.labelMuted,
    marginTop: -6,
    marginBottom: 8,
  },
  queueGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  queueCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  queueIconBox: {
    marginBottom: 10,
  },
  queueNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: PALETTE.ink,
    letterSpacing: -0.5,
  },
  queueLabel: {
    fontSize: 11.5,
    color: PALETTE.labelMuted,
    fontWeight: '500',
    marginTop: 2,
  },
  cardStack: {
    gap: 10,
  },
  listingApprovalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  listingApprovalCardDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF7F2',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFEAE1',
    opacity: 0.85,
  },
  leafIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: PALETTE.peachIconBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  blockIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EDE8E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  listingCardTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  listingCardSub: {
    fontSize: 11.5,
    color: PALETTE.labelMuted,
    marginTop: 2,
    lineHeight: 15,
  },
  disputeCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  disputeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  disputeTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: PALETTE.ink,
    flex: 1,
  },
  disputeBody: {
    fontSize: 12,
    color: PALETTE.labelMuted,
    lineHeight: 17,
    marginBottom: 8,
  },
  disputeLink: {
    fontSize: 12.5,
    fontWeight: '800',
    color: PALETTE.orange,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
    gap: 6,
  },
  quickBtnLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: PALETTE.ink,
  },
  profileBox: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 16,
  },
  bigAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: PALETTE.peachIconBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  profName: {
    fontSize: 17,
    fontWeight: '800',
    color: PALETTE.ink,
  },
  profRole: {
    fontSize: 12,
    color: PALETTE.labelMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  profEmail: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.titleRust,
    marginTop: 3,
  },
  signOutBtn: {
    backgroundColor: '#FDEEE9',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F8D8CE',
  },
  signOutText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#943818',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.tabBorder,
    paddingVertical: 9,
    paddingHorizontal: 12,
    justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: PALETTE.tabInactive,
    marginTop: 3,
  },
  tabLabelActive: {
    color: PALETTE.orange,
    fontWeight: '800',
  },
});
