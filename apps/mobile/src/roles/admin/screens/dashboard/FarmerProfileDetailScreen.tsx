import React, { useRef, useState } from 'react';
import {
  Alert,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  PanResponder,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { FarmerActivityScreen } from './FarmerActivityScreen';
import { FarmerProduceScreen } from './FarmerProduceScreen';
import { FarmerRatingsScreen } from './FarmerRatingsScreen';
import { FarmerIssuesScreen } from './FarmerIssuesScreen';
import { FarmerHistoryScreen } from './FarmerHistoryScreen';
import { adminColors } from '../../theme';

// ─── Theme Colors ────────────────────────────────────────────────────────────
const THEME = {
  headerBg: adminColors.brand, // Matches Purchases screen & theme primary (#F0562A)
  white: adminColors.onBrand,
  canvas: adminColors.canvas,
  card: adminColors.card,
  border: adminColors.border,
  ink: adminColors.ink,
  muted: adminColors.muted,
  labelMuted: '#6B7280',
  brandOrange: adminColors.brand,
  titleRustDark: adminColors.brandDeep,
  avatarBg: '#FFF3EC',
  avatarIcon: '#A63D18',
  statusGreenBg: '#EAF7EE',
  statusGreenText: adminColors.success.text,
  noticeBg: '#FAF7F2',
  noticeBorder: adminColors.border,
  divider: '#F3ECE4',
};

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowIcon({ size = 22, color = THEME.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function UserAvatarIcon({ size = 32, color = THEME.avatarIcon }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4.2" stroke={color} strokeWidth="1.8" />
      <Path
        d="M4.5 20.5c0-4.14 3.36-7.5 7.5-7.5s7.5 3.36 7.5 7.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// Folded Map Icon (Image 1)
function FoldedMapIcon({ size = 32, color = '#5F5E5A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 3v15M15 6v15"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Prohibited Circle Slash Icon (Image 3)
function ProhibitedSlashIcon({ size = 18, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Line x1="5.6" y1="5.6" x2="18.4" y2="18.4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export interface FarmerProfileData {
  farmerId: string;
  name: string;
  zone: string;
  farmingMethod: string;
  accountStatus: string;
  certification: string;
  farmCount: number;
  listingCount: number;
  rating: string;
  auditStatus: string;
}

export interface FarmerProfileDetailScreenProps {
  farmer?: FarmerProfileData;
  onBack: () => void;
}

type TabKey = 'Overview' | 'Farm' | 'Documents' | 'Audits' | 'Produce' | 'Ratings' | 'Activity' | 'History' | 'Issues';

export function FarmerProfileDetailScreen({
  farmer = {
    farmerId: 'FR-00124',
    name: 'Ramesh Kumar',
    zone: 'Coonoor',
    farmingMethod: 'Organic',
    accountStatus: 'Active',
    certification: 'Certified',
    farmCount: 1,
    listingCount: 18,
    rating: '4.6 ★',
    auditStatus: 'Upcoming',
  },
  onBack,
}: FarmerProfileDetailScreenProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('Overview');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [showActivityScreen, setShowActivityScreen] = useState<boolean>(false);
  const [showProduceScreen, setShowProduceScreen] = useState<boolean>(false);
  const [showRatingsScreen, setShowRatingsScreen] = useState<boolean>(false);
  const [showIssuesScreen, setShowIssuesScreen] = useState<boolean>(false);
  const [showHistoryScreen, setShowHistoryScreen] = useState<boolean>(false);

  // Tab scrollbar dynamic state
  const tabScrollRef = useRef<ScrollView>(null);
  const [scrollProgress, setScrollProgress] = useState(0); // 0 to 1
  const [trackWidth, setTrackWidth] = useState(240);
  const maxScrollWidthRef = useRef(350);

  const tabs: TabKey[] = [
    'Overview',
    'Farm',
    'Documents',
    'Audits',
    'Produce',
    'Ratings',
    'Activity',
    'History',
    'Issues',
  ];

  // Pan responder to allow touching and dragging the scrollbar thumb directly
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const available = trackWidth - 70;
        if (available > 0) {
          const ratio = Math.max(0, Math.min(1, gestureState.dx / available));
          setScrollProgress(ratio);
          tabScrollRef.current?.scrollTo({
            x: ratio * maxScrollWidthRef.current,
            animated: false,
          });
        }
      },
    })
  ).current;

  const handleTabScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const maxScroll = contentSize.width - layoutMeasurement.width;
    maxScrollWidthRef.current = maxScroll;
    if (maxScroll > 0) {
      const ratio = Math.max(0, Math.min(1, contentOffset.x / maxScroll));
      setScrollProgress(ratio);
    }
  };

  const handleTabPress = (tab: TabKey, index: number) => {
    setActiveTab(tab);
    setSelectedDocId(null);
    if (tab === 'Issues') {
      setShowIssuesScreen(true);
    }
    tabScrollRef.current?.scrollTo({
      x: Math.max(0, index * 70 - 40),
      animated: true,
    });
  };

  const thumbWidth = 75;
  const maxThumbTranslate = Math.max(0, trackWidth - thumbWidth);
  const thumbLeft = scrollProgress * maxThumbTranslate;

  // If navigating to full Farmer Produce flow (Mockup 1)
  if (showProduceScreen) {
    return (
      <FarmerProduceScreen
        farmerName={farmer.name}
        farmerId={farmer.farmerId}
        onBack={() => setShowProduceScreen(false)}
      />
    );
  }

  // If navigating to full Farmer Ratings flow (Mockup 2)
  if (showRatingsScreen) {
    return (
      <FarmerRatingsScreen
        farmerName={farmer.name}
        farmerId={farmer.farmerId}
        onBack={() => setShowRatingsScreen(false)}
      />
    );
  }

  // If navigating to full Farmer Activity flow
  if (showActivityScreen) {
    return (
      <FarmerActivityScreen
        farmerName={farmer.name}
        farmerId={farmer.farmerId}
        onBack={() => setShowActivityScreen(false)}
      />
    );
  }

  // If navigating to full Farmer History flow (Images 2, 3, 4, 5)
  if (showHistoryScreen) {
    return (
      <FarmerHistoryScreen
        farmerName={farmer.name}
        farmerId={farmer.farmerId}
        onBack={() => setShowHistoryScreen(false)}
      />
    );
  }

  // If navigating to full Farmer Issues flow (Mockups 3 & 4)
  if (showIssuesScreen) {
    return (
      <FarmerIssuesScreen
        farmerName={farmer.name}
        farmerId={farmer.farmerId}
        onBack={() => setShowIssuesScreen(false)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

      {/* ─── Header: Farmer Profile ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={24} color={THEME.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Farmer Profile</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Profile Summary Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <UserAvatarIcon size={34} color={THEME.avatarIcon} />
          </View>
          <Text style={styles.farmerNameTitle}>{farmer.name}</Text>
          <Text style={styles.farmerSubMeta}>
            {farmer.farmerId} · {farmer.farmingMethod} Farmer · {farmer.zone}
          </Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>{farmer.accountStatus}</Text>
          </View>
        </View>

        {/* ─── Horizontal Tabs with Dynamic Interactive Scrollbar ─── */}
        <View style={styles.tabsContainer}>
          <ScrollView
            ref={tabScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScrollContent}
            onScroll={handleTabScroll}
            scrollEventThrottle={16}
          >
            {tabs.map((tab, idx) => {
              const active = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tabButton, active && styles.tabButtonActive]}
                  onPress={() => handleTabPress(tab, idx)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.tabText, active ? styles.tabTextActive : styles.tabTextInactive]}>
                    {tab}
                  </Text>
                  {active && <View style={styles.tabActiveUnderline} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Dynamic Scrollbar Slider: Scrollable & Draggable (Exact match to screenshots) */}
          <View
            style={styles.sliderBarWrap}
            onLayout={(e: LayoutChangeEvent) => {
              setTrackWidth(e.nativeEvent.layout.width - 44);
            }}
          >
            <TouchableOpacity
              onPress={() => {
                tabScrollRef.current?.scrollTo({ x: 0, animated: true });
              }}
              activeOpacity={0.7}
              style={styles.sliderArrowTouch}
            >
              <Text style={styles.sliderArrowText}>◀</Text>
            </TouchableOpacity>

            {/* Track */}
            <View
              style={styles.sliderTrack}
              {...panResponder.panHandlers}
            >
              <View
                style={[
                  styles.sliderThumb,
                  {
                    width: thumbWidth,
                    transform: [{ translateX: thumbLeft }],
                  },
                ]}
              />
            </View>

            <TouchableOpacity
              onPress={() => {
                tabScrollRef.current?.scrollToEnd({ animated: true });
              }}
              activeOpacity={0.7}
              style={styles.sliderArrowTouch}
            >
              <Text style={styles.sliderArrowText}>▶</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── TAB 1: OVERVIEW ─── */}
        {activeTab === 'Overview' && (
          <>
            <View style={styles.detailsCard}>
              <View style={styles.rowTwoCol}>
                <View style={styles.colHalf}>
                  <Text style={styles.labelMuted}>Farmer Name</Text>
                  <Text style={styles.valBold}>{farmer.name}</Text>
                </View>
                <View style={styles.colHalf}>
                  <Text style={styles.labelMuted}>Farmer ID</Text>
                  <Text style={styles.valBold}>{farmer.farmerId}</Text>
                </View>
              </View>

              <View style={[styles.rowTwoCol, { marginTop: 18 }]}>
                <View style={styles.colHalf}>
                  <Text style={styles.labelMuted}>Zone</Text>
                  <Text style={styles.valBold}>{farmer.zone}</Text>
                </View>
                <View style={styles.colHalf}>
                  <Text style={styles.labelMuted}>Farming Method</Text>
                  <Text style={styles.valBold}>{farmer.farmingMethod}</Text>
                </View>
              </View>

              <View style={[styles.rowTwoCol, { marginTop: 18 }]}>
                <View style={styles.colHalf}>
                  <Text style={styles.labelMuted}>Account Status</Text>
                  <Text style={styles.valBold}>{farmer.accountStatus}</Text>
                </View>
                <View style={styles.colHalf}>
                  <Text style={styles.labelMuted}>Certification</Text>
                  <Text style={styles.valBold}>{farmer.certification}</Text>
                </View>
              </View>

              <View style={[styles.rowTwoCol, { marginTop: 18 }]}>
                <View style={styles.colHalf}>
                  <Text style={styles.labelMuted}>Farm Count</Text>
                  <Text style={styles.valBold}>{farmer.farmCount}</Text>
                </View>
                <View style={styles.colHalf}>
                  <Text style={styles.labelMuted}>Listing Count</Text>
                  <Text style={styles.valBold}>{farmer.listingCount}</Text>
                </View>
              </View>

              <View style={[styles.rowTwoCol, { marginTop: 18 }]}>
                <View style={styles.colHalf}>
                  <Text style={styles.labelMuted}>Rating</Text>
                  <Text style={styles.valBold}>{farmer.rating}</Text>
                </View>
                <View style={styles.colHalf}>
                  <Text style={styles.labelMuted}>Audit Status</Text>
                  <Text style={styles.valBold}>{farmer.auditStatus}</Text>
                </View>
              </View>
            </View>

          </>
        )}

        {/* ─── TAB 2: FARM (Exact Match to Image 1) ─── */}
        {activeTab === 'Farm' && (
          <>
            <View style={styles.detailsCard}>
              <View style={styles.rowTwoCol}>
                <View style={styles.colHalf}>
                  <Text style={styles.labelMuted}>Farm ID</Text>
                  <Text style={styles.valBold}>FARM-0088</Text>
                </View>
                <View style={styles.colHalf}>
                  <Text style={styles.labelMuted}>Location</Text>
                  <Text style={styles.valBold}>Coonoor</Text>
                </View>
              </View>

              <View style={[styles.rowTwoCol, { marginTop: 16 }]}>
                <View style={styles.colHalf}>
                  <Text style={styles.labelMuted}>Zone</Text>
                  <Text style={styles.valBold}>Coonoor</Text>
                </View>
                <View style={styles.colHalf}>
                  <Text style={styles.labelMuted}>Farming Method</Text>
                  <Text style={styles.valBold}>Organic</Text>
                </View>
              </View>

              <View style={[styles.rowTwoCol, { marginTop: 16 }]}>
                <View style={styles.colHalf}>
                  <Text style={styles.labelMuted}>Farm Area</Text>
                  <Text style={styles.valBold}>4.2 acres</Text>
                </View>
                <View style={styles.colHalf}>
                  <Text style={styles.labelMuted}>Crops</Text>
                  <Text style={styles.valBold}>Tomato, Carrot</Text>
                </View>
              </View>
            </View>

            {/* FMB / Zone Section Heading */}
            <Text style={styles.subSectionTitle}>FMB / Zone</Text>

            {/* FMB Card with Folded Map Icon (Image 1) */}
            <View style={styles.fmbCard}>
              <FoldedMapIcon size={36} color="#4A5568" />
              <Text style={styles.fmbCardText}>
                FMB information is available as a record.
              </Text>
            </View>
          </>
        )}

        {/* ─── TAB 3: DOCUMENTS (Exact Match to Image 2 & Image 3) ─── */}
        {activeTab === 'Documents' && (
          <>
            {/* If NO document detail is open: Show Document Cards (Image 2) */}
            {!selectedDocId ? (
              <View>
                {/* Doc Card 1: Organic Certification */}
                <TouchableOpacity
                  style={styles.docCard}
                  onPress={() => setSelectedDocId('DOC-00125')}
                  activeOpacity={0.75}
                >
                  <Text style={styles.docCardTitle}>Organic Certification</Text>
                  <View style={styles.docMetaRow}>
                    <Text style={styles.docIdText}>DOC-00125</Text>
                    <View style={styles.badgeActive}>
                      <Text style={styles.badgeActiveText}>Active</Text>
                    </View>
                  </View>
                  <View style={styles.cardDivider} />
                  <View style={styles.rowBetween}>
                    <Text style={styles.docDateText}>Issued 12 Jun 2026</Text>
                    <Text style={styles.docDateText}>Expires 12 Jun 2027</Text>
                  </View>
                </TouchableOpacity>

                {/* Doc Card 2: KYC Document */}
                <TouchableOpacity
                  style={styles.docCard}
                  onPress={() => setSelectedDocId('DOC-00089')}
                  activeOpacity={0.75}
                >
                  <Text style={styles.docCardTitle}>KYC Document</Text>
                  <View style={styles.docMetaRow}>
                    <Text style={styles.docIdText}>DOC-00089</Text>
                    <View style={styles.badgeActive}>
                      <Text style={styles.badgeActiveText}>Active</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            ) : (
              /* If document detail is open: Show Document Detail View (Image 3) */
              <View>
                <View style={styles.detailsCard}>
                  <View style={styles.rowTwoCol}>
                    <View style={styles.colHalf}>
                      <Text style={styles.labelMuted}>Document Name</Text>
                      <Text style={styles.valBold}>
                        {selectedDocId === 'DOC-00125' ? 'Organic Certification' : 'KYC Document'}
                      </Text>
                    </View>
                    <View style={styles.colHalf}>
                      <Text style={styles.labelMuted}>Document ID</Text>
                      <Text style={styles.valBold}>{selectedDocId}</Text>
                    </View>
                  </View>

                  <View style={[styles.rowTwoCol, { marginTop: 16 }]}>
                    <View style={styles.colHalf}>
                      <Text style={styles.labelMuted}>Document Type</Text>
                      <Text style={styles.valBold}>
                        {selectedDocId === 'DOC-00125' ? 'Certification' : 'Identity Verification'}
                      </Text>
                    </View>
                    <View style={styles.colHalf}>
                      <Text style={styles.labelMuted}>Status</Text>
                      <Text style={styles.valBold}>Active</Text>
                    </View>
                  </View>

                  <View style={[styles.rowTwoCol, { marginTop: 16 }]}>
                    <View style={styles.colHalf}>
                      <Text style={styles.labelMuted}>Issued Date</Text>
                      <Text style={styles.valBold}>12 Jun 2026</Text>
                    </View>
                    <View style={styles.colHalf}>
                      <Text style={styles.labelMuted}>Expiry Date</Text>
                      <Text style={styles.valBold}>12 Jun 2027</Text>
                    </View>
                  </View>

                  <View style={{ marginTop: 16 }}>
                    <Text style={styles.labelMuted}>Issuing Authority</Text>
                    <Text style={styles.valBold}>TOHFA Certification Board</Text>
                  </View>
                </View>

                {/* Preview Button */}
                <TouchableOpacity
                  style={styles.outlineActionBtn}
                  onPress={() => Alert.alert('Preview Document', `Viewing verified document record for ${selectedDocId}.`)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.outlineActionBtnText}>Preview</Text>
                </TouchableOpacity>


                {/* Back to Documents Button */}
                <TouchableOpacity
                  style={[styles.outlineActionBtn, { marginTop: 14 }]}
                  onPress={() => setSelectedDocId(null)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.outlineActionBtnText}>Back to Documents</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* ─── TAB 4: AUDITS (Exact Match to Image 4) ─── */}
        {activeTab === 'Audits' && (
          <>
            <View style={styles.detailsCard}>
              <View style={styles.rowTwoCol}>
                <View style={styles.colHalf}>
                  <Text style={styles.labelMuted}>Last Audit</Text>
                  <Text style={styles.valBold}>Completed</Text>
                </View>
                <View style={styles.colHalf}>
                  <Text style={styles.labelMuted}>Next Audit</Text>
                  <Text style={styles.valBold}>04 Oct 2026</Text>
                </View>
              </View>

              <View style={{ marginTop: 16 }}>
                <Text style={styles.labelMuted}>Audit Status</Text>
                <Text style={styles.valBold}>Upcoming</Text>
              </View>
            </View>

            {/* View Audit History Outline Button (Navigates to Farmer History) */}
            <TouchableOpacity
              style={styles.outlineActionBtn}
              onPress={() => setShowHistoryScreen(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.outlineActionBtnText}>View Audit History</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ─── TAB 5: PRODUCE ─── */}
        {activeTab === 'Produce' && (
          <>
            <View style={styles.detailsCard}>
              <View style={styles.rowTwoCol}>
                <View style={styles.colHalf}>
                  <Text style={styles.labelMuted}>Total Listings</Text>
                  <Text style={styles.valBold}>18 Listed</Text>
                </View>
                <View style={styles.colHalf}>
                  <Text style={styles.labelMuted}>Pending Review</Text>
                  <Text style={[styles.valBold, { color: '#D97706' }]}>03 Batches</Text>
                </View>
              </View>

              <View style={[styles.rowTwoCol, { marginTop: 16 }]}>
                <View style={styles.colHalf}>
                  <Text style={styles.labelMuted}>Approved</Text>
                  <Text style={styles.valBold}>12 Batches</Text>
                </View>
                <View style={styles.colHalf}>
                  <Text style={styles.labelMuted}>Rejected</Text>
                  <Text style={[styles.valBold, { color: '#DC2626' }]}>03 Batches</Text>
                </View>
              </View>
            </View>

            {/* View All Produce Outline Button (Navigates to Mockup 1) */}
            <TouchableOpacity
              style={styles.outlineActionBtn}
              onPress={() => setShowProduceScreen(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.outlineActionBtnText}>View All Produce</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ─── TAB 6: RATINGS ─── */}
        {activeTab === 'Ratings' && (
          <>
            <View style={styles.detailsCard}>
              <View style={styles.rowTwoCol}>
                <View style={styles.colHalf}>
                  <Text style={styles.labelMuted}>Overall Score</Text>
                  <Text style={styles.valBold}>4.6 ★</Text>
                </View>
                <View style={styles.colHalf}>
                  <Text style={styles.labelMuted}>Quality Consistency</Text>
                  <Text style={styles.valBold}>96% Accept Rate</Text>
                </View>
              </View>

              <View style={[styles.rowTwoCol, { marginTop: 16 }]}>
                <View style={styles.colHalf}>
                  <Text style={styles.labelMuted}>Farm Quality</Text>
                  <Text style={styles.valBold}>4.7 / 5.0</Text>
                </View>
                <View style={styles.colHalf}>
                  <Text style={styles.labelMuted}>Compliance</Text>
                  <Text style={styles.valBold}>4.6 / 5.0</Text>
                </View>
              </View>
            </View>

            {/* View Ratings Outline Button (Navigates to Mockup 2) */}
            <TouchableOpacity
              style={styles.outlineActionBtn}
              onPress={() => setShowRatingsScreen(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.outlineActionBtnText}>View All Ratings</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ─── TAB 7: ACTIVITY ─── */}
        {activeTab === 'Activity' && (
          <>
            <View style={styles.detailsCard}>
              <View style={styles.rowTwoCol}>
                <View style={styles.colHalf}>
                  <Text style={styles.labelMuted}>Recent Activity</Text>
                  <Text style={styles.valBold}>Produce Listing Submitted</Text>
                </View>
                <View style={styles.colHalf}>
                  <Text style={styles.labelMuted}>Last Event Time</Text>
                  <Text style={styles.valBold}>Today, 10:24 AM</Text>
                </View>
              </View>

              <View style={[styles.rowTwoCol, { marginTop: 16 }]}>
                <View style={styles.colHalf}>
                  <Text style={styles.labelMuted}>Total Batches</Text>
                  <Text style={styles.valBold}>18 Listed</Text>
                </View>
                <View style={styles.colHalf}>
                  <Text style={styles.labelMuted}>Last Handover</Text>
                  <Text style={styles.valBold}>HO-2026-0002</Text>
                </View>
              </View>
            </View>

            {/* View Activity Outline Button */}
            <TouchableOpacity
              style={styles.outlineActionBtn}
              onPress={() => setShowActivityScreen(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.outlineActionBtnText}>View Activity</Text>
            </TouchableOpacity>

            {/* View Farmer History Outline Button */}
            <TouchableOpacity
              style={[styles.outlineActionBtn, { marginTop: 12 }]}
              onPress={() => setShowHistoryScreen(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.outlineActionBtnText}>View Farmer History</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ─── TAB 8: HISTORY ─── */}
        {activeTab === 'History' && (
          <>
            <View style={styles.detailsCard}>
              <View style={styles.rowTwoCol}>
                <View style={styles.colHalf}>
                  <Text style={styles.labelMuted}>Latest Event</Text>
                  <Text style={styles.valBold}>Produce listing submitted</Text>
                </View>
                <View style={styles.colHalf}>
                  <Text style={styles.labelMuted}>Recorded Date</Text>
                  <Text style={styles.valBold}>28 Sep 2026</Text>
                </View>
              </View>

              <View style={[styles.rowTwoCol, { marginTop: 18 }]}>
                <View style={styles.colHalf}>
                  <Text style={styles.labelMuted}>Total Events</Text>
                  <Text style={styles.valBold}>5 Records (2026)</Text>
                </View>
                <View style={styles.colHalf}>
                  <Text style={styles.labelMuted}>Reference</Text>
                  <Text style={styles.valBold}>PL-001245</Text>
                </View>
              </View>
            </View>

            {/* View History Outline Button */}
            <TouchableOpacity
              style={styles.outlineActionBtn}
              onPress={() => setShowHistoryScreen(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.outlineActionBtnText}>View History</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ─── TAB 9: ISSUES ─── */}
        {activeTab === 'Issues' && (
          <>
            <TouchableOpacity
              style={styles.detailsCard}
              onPress={() => setShowIssuesScreen(true)}
              activeOpacity={0.85}
            >
              <View style={styles.rowTwoCol}>
                <View style={styles.colHalf}>
                  <Text style={styles.labelMuted}>Open Issues</Text>
                  <Text style={[styles.valBold, { color: '#DC2626' }]}>02 Open</Text>
                </View>
                <View style={styles.colHalf}>
                  <Text style={styles.labelMuted}>In Progress</Text>
                  <Text style={[styles.valBold, { color: '#D97706' }]}>01 Pending</Text>
                </View>
              </View>

              <View style={[styles.rowTwoCol, { marginTop: 16 }]}>
                <View style={styles.colHalf}>
                  <Text style={styles.labelMuted}>Resolved</Text>
                  <Text style={[styles.valBold, { color: '#15803D' }]}>08 Resolved</Text>
                </View>
                <View style={styles.colHalf}>
                  <Text style={styles.labelMuted}>Latest ID</Text>
                  <Text style={styles.valBold}>ISS-00125</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* View All Issues Outline Button (Navigates to Mockups 3 & 4) */}
            <TouchableOpacity
              style={styles.outlineActionBtn}
              onPress={() => setShowIssuesScreen(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.outlineActionBtnText}>View All Issues</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stylesheet Matching All 4 Images Exact UI ───────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.canvas,
  },
  header: {
    backgroundColor: THEME.headerBg,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.white,
    letterSpacing: -0.2,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },

  // Top Profile Card
  profileCard: {
    backgroundColor: THEME.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: THEME.avatarBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  farmerNameTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: THEME.ink,
  },
  farmerSubMeta: {
    fontSize: 12.5,
    color: THEME.muted,
    marginTop: 4,
    textAlign: 'center',
  },
  statusBadge: {
    backgroundColor: THEME.statusGreenBg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginTop: 10,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.statusGreenText,
  },

  // Horizontal Tabs Bar (Matches Images 1, 2, 4)
  tabsContainer: {
    marginBottom: 16,
  },
  tabsScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    gap: 20,
  },
  tabButton: {
    paddingVertical: 8,
    alignItems: 'center',
    position: 'relative',
  },
  tabButtonActive: {},
  tabText: {
    fontSize: 14.5,
  },
  tabTextActive: {
    fontWeight: '800',
    color: THEME.titleRustDark,
  },
  tabTextInactive: {
    fontWeight: '600',
    color: THEME.muted,
  },
  tabActiveUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: THEME.brandOrange,
    borderRadius: 2,
  },

  // Dynamic Scrollbar Slider Track (Matches Images 1, 2, 4)
  sliderBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  sliderArrowTouch: {
    paddingHorizontal: 3,
  },
  sliderArrowText: {
    fontSize: 11,
    color: '#8A8580',
  },
  sliderTrack: {
    flex: 1,
    height: 5,
    backgroundColor: '#E5DFD7',
    borderRadius: 3,
    position: 'relative',
    justifyContent: 'center',
  },
  sliderThumb: {
    height: 5,
    backgroundColor: '#8A8580',
    borderRadius: 3,
  },

  // Details Card
  detailsCard: {
    backgroundColor: THEME.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 20,
    paddingVertical: 22,
    marginBottom: 16,
  },
  subSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.titleRustDark,
    marginTop: 6,
    marginBottom: 10,
  },
  rowTwoCol: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  colHalf: {
    width: '48%',
  },
  labelMuted: {
    fontSize: 12,
    color: THEME.labelMuted,
    marginBottom: 4,
  },
  valBold: {
    fontSize: 14.5,
    fontWeight: '800',
    color: THEME.ink,
  },

  // FMB Card (Image 1)
  fmbCard: {
    backgroundColor: THEME.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fmbCardText: {
    fontSize: 13,
    color: THEME.muted,
    marginTop: 14,
    textAlign: 'center',
  },

  // Document Cards (Image 2)
  docCard: {
    backgroundColor: THEME.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 14,
  },
  docCardTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: THEME.ink,
  },
  docMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  docIdText: {
    fontSize: 13,
    color: THEME.muted,
  },
  badgeActive: {
    backgroundColor: THEME.statusGreenBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 3,
  },
  badgeActiveText: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.statusGreenText,
  },
  cardDivider: {
    height: 1,
    backgroundColor: THEME.divider,
    marginVertical: 12,
  },
  docDateText: {
    fontSize: 12.5,
    color: THEME.muted,
  },

  // Actions (Image 3 & Image 4)
  outlineActionBtn: {
    height: 48,
    backgroundColor: '#FAF7F2',
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineActionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.titleRustDark,
  },

  // Prohibited Notice Box (Image 3)
  prohibitedNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.noticeBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.noticeBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 14,
  },
  prohibitedNoticeText: {
    flex: 1,
    fontSize: 12.5,
    color: '#6B7280',
    lineHeight: 18,
  },

  // Disclaimer Notice Box (Overview)
  noticeBox: {
    backgroundColor: THEME.noticeBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.noticeBorder,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 4,
  },
  noticeText: {
    fontSize: 12.5,
    color: '#6B7280',
    lineHeight: 18,
  },
});
