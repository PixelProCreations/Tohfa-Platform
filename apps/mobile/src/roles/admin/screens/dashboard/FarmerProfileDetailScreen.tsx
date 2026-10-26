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
import { FarmerProduceScreen } from './FarmerProduceScreen';
import { FarmerRatingsScreen } from './FarmerRatingsScreen';
import { FarmerHistoryScreen } from './FarmerHistoryScreen';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';
import { t } from '../../i18n';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
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

function UserAvatarIcon({ size = 32, color = adminColors.brandDeep }: { size?: number; color?: string }) {
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

function FoldedMapIcon({ size = 32, color = adminColors.muted }: { size?: number; color?: string }) {
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
  farmer?: FarmerProfileData | undefined;
  onBack: () => void;
  onNavigateAuditHistory?: (() => void) | undefined;
}

type TabKey = 'Overview' | 'Farm' | 'Documents' | 'Audits' | 'Produce' | 'Ratings' | 'History';

const DEFAULT_FARMER_DATA: FarmerProfileData = {
  farmerId: 'FR-00241',
  name: 'Ramesh Kumar',
  zone: 'Coonoor',
  farmingMethod: 'Organic',
  accountStatus: 'Active',
  certification: 'Certified',
  farmCount: 1,
  listingCount: 18,
  rating: '4.6 ★',
  auditStatus: 'Upcoming',
};

const FARM_RATING_CATEGORIES = [
  { name: 'Certification & Compliance', score: '8/10' },
  { name: 'Soil & Land Management', score: '7/10' },
  { name: 'Farming Practices', score: '8/10' },
  { name: 'Environmental Sustainability', score: '7/10' },
  { name: 'Produce Quality & Yield', score: '8/10' },
  { name: 'Traceability & Transparency', score: '9/10' },
  { name: 'Social & Labor Practices', score: '7/10' },
  { name: 'Financial & Operational', score: '8/10' },
  { name: 'Market & Buyer Relations', score: '8/10' },
  { name: 'Innovation & Improvement', score: '8/10' },
];

export function FarmerProfileDetailScreen({
  farmer,
  onBack,
  onNavigateAuditHistory,
}: FarmerProfileDetailScreenProps) {
  const activeFarmer: FarmerProfileData = {
    ...DEFAULT_FARMER_DATA,
    ...farmer,
    name: farmer?.name || DEFAULT_FARMER_DATA.name,
    farmerId: farmer?.farmerId || DEFAULT_FARMER_DATA.farmerId,
    zone: farmer?.zone || DEFAULT_FARMER_DATA.zone,
    farmingMethod: farmer?.farmingMethod || DEFAULT_FARMER_DATA.farmingMethod,
    accountStatus: farmer?.accountStatus || DEFAULT_FARMER_DATA.accountStatus,
  };
  const [activeTab, setActiveTab] = useState<TabKey>('Overview');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [showProduceScreen, setShowProduceScreen] = useState<boolean>(false);
  const [showRatingsScreen, setShowRatingsScreen] = useState<boolean>(false);
  const [showHistoryScreen, setShowHistoryScreen] = useState<boolean>(false);

  // Tab scrollbar dynamic state
  const tabScrollRef = useRef<ScrollView>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [trackWidth, setTrackWidth] = useState(240);
  const maxScrollWidthRef = useRef(350);

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'Overview', label: t('farmerProfileDetail.tab.overview') },
    { key: 'Farm', label: t('farmerProfileDetail.tab.farm') },
    { key: 'Documents', label: t('farmerProfileDetail.tab.documents') },
    { key: 'Audits', label: t('farmerProfileDetail.tab.audits') },
    { key: 'Produce', label: t('farmerProfileDetail.tab.produce') },
    { key: 'Ratings', label: t('farmerProfileDetail.tab.ratings') },
    { key: 'History', label: t('farmerProfileDetail.tab.history') },
  ];

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
    tabScrollRef.current?.scrollTo({
      x: Math.max(0, index * 70 - 40),
      animated: true,
    });
  };

  const thumbWidth = 75;
  const maxThumbTranslate = Math.max(0, trackWidth - thumbWidth);
  const thumbLeft = scrollProgress * maxThumbTranslate;

  if (showProduceScreen) {
    return (
      <FarmerProduceScreen
        farmerName={activeFarmer.name}
        farmerId={activeFarmer.farmerId}
        onBack={() => setShowProduceScreen(false)}
      />
    );
  }

  if (showRatingsScreen) {
    return (
      <FarmerRatingsScreen
        farmerName={activeFarmer.name}
        farmerId={activeFarmer.farmerId}
        initialView="farmer_rating"
        onBack={() => setShowRatingsScreen(false)}
      />
    );
  }

  if (showHistoryScreen) {
    return (
      <FarmerHistoryScreen
        farmerName={activeFarmer.name}
        farmerId={activeFarmer.farmerId}
        onBack={() => setShowHistoryScreen(false)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header: Farmer Profile ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={24} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('farmerProfileDetail.title')}</Text>
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
            <UserAvatarIcon size={34} color={adminColors.brandDeep} />
          </View>
          <Text style={styles.farmerNameTitle}>{activeFarmer.name}</Text>
          <Text style={styles.farmerSubMeta}>
            {activeFarmer.farmerId} · {activeFarmer.farmingMethod} · {activeFarmer.zone}
          </Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>{activeFarmer.accountStatus}</Text>
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
            {tabs.map(({ key, label }, idx) => {
              const active = activeTab === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.tabButton, active && styles.tabButtonActive]}
                  onPress={() => handleTabPress(key, idx)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.tabText, active ? styles.tabTextActive : styles.tabTextInactive]}>
                    {label}
                  </Text>
                  {active && <View style={styles.tabActiveUnderline} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Dynamic Scrollbar Slider */}
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
          <View style={styles.detailsCard}>
            <View style={styles.rowTwoCol}>
              <View style={styles.colHalf}>
                <Text style={styles.labelMuted}>Farmer Name</Text>
                <Text style={styles.valBold}>{activeFarmer.name}</Text>
              </View>
              <View style={styles.colHalf}>
                <Text style={styles.labelMuted}>Farmer ID</Text>
                <Text style={styles.valBold}>{activeFarmer.farmerId}</Text>
              </View>
            </View>

            <View style={[styles.rowTwoCol, styles.rowSpacing]}>
              <View style={styles.colHalf}>
                <Text style={styles.labelMuted}>Zone</Text>
                <Text style={styles.valBold}>{activeFarmer.zone}</Text>
              </View>
              <View style={styles.colHalf}>
                <Text style={styles.labelMuted}>Farming Method</Text>
                <Text style={styles.valBold}>{activeFarmer.farmingMethod}</Text>
              </View>
            </View>

            <View style={[styles.rowTwoCol, styles.rowSpacing]}>
              <View style={styles.colHalf}>
                <Text style={styles.labelMuted}>Account Status</Text>
                <Text style={styles.valBold}>{activeFarmer.accountStatus}</Text>
              </View>
              <View style={styles.colHalf}>
                <Text style={styles.labelMuted}>Certification</Text>
                <Text style={styles.valBold}>{activeFarmer.certification}</Text>
              </View>
            </View>

            <View style={[styles.rowTwoCol, styles.rowSpacing]}>
              <View style={styles.colHalf}>
                <Text style={styles.labelMuted}>Farm Count</Text>
                <Text style={styles.valBold}>{activeFarmer.farmCount}</Text>
              </View>
              <View style={styles.colHalf}>
                <Text style={styles.labelMuted}>Listing Count</Text>
                <Text style={styles.valBold}>{activeFarmer.listingCount}</Text>
              </View>
            </View>

            <View style={[styles.rowTwoCol, styles.rowSpacing]}>
              <View style={styles.colHalf}>
                <Text style={styles.labelMuted}>Rating</Text>
                <Text style={styles.valBold}>{activeFarmer.rating}</Text>
              </View>
              <View style={styles.colHalf}>
                <Text style={styles.labelMuted}>Audit Status</Text>
                <Text style={styles.valBold}>{activeFarmer.auditStatus}</Text>
              </View>
            </View>
          </View>
        )}

        {/* ─── TAB 2: FARM ─── */}
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

              <View style={[styles.rowTwoCol, styles.rowSpacing]}>
                <View style={styles.colHalf}>
                  <Text style={styles.labelMuted}>Zone</Text>
                  <Text style={styles.valBold}>Coonoor</Text>
                </View>
                <View style={styles.colHalf}>
                  <Text style={styles.labelMuted}>Farming Method</Text>
                  <Text style={styles.valBold}>Organic</Text>
                </View>
              </View>

              <View style={[styles.rowTwoCol, styles.rowSpacing]}>
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

            <Text style={styles.subSectionTitle}>{t('farmerProfileDetail.fmbTitle')}</Text>

            <View style={styles.fmbCard}>
              <FoldedMapIcon size={36} color={adminColors.muted} />
              <Text style={styles.fmbCardText}>
                {t('farmerProfileDetail.fmbNotice')}
              </Text>
            </View>
          </>
        )}

        {/* ─── TAB 3: DOCUMENTS ─── */}
        {activeTab === 'Documents' && (
          <>
            {!selectedDocId ? (
              <View>
                <TouchableOpacity
                  style={styles.docCard}
                  onPress={() => setSelectedDocId('DOC-00125')}
                  activeOpacity={0.75}
                >
                  <Text style={styles.docCardTitle}>Organic Certification</Text>
                  <View style={styles.docMetaRow}>
                    <Text style={styles.docIdText}>DOC-00125</Text>
                    <View style={styles.badgeActive}>
                      <Text style={styles.badgeActiveText}>{t('farmerProfileDetail.badge.active')}</Text>
                    </View>
                  </View>
                  <View style={styles.cardDivider} />
                  <View style={styles.rowBetween}>
                    <Text style={styles.docDateText}>Issued 12 Jun 2026</Text>
                    <Text style={styles.docDateText}>Expires 12 Jun 2027</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.docCard}
                  onPress={() => setSelectedDocId('DOC-00089')}
                  activeOpacity={0.75}
                >
                  <Text style={styles.docCardTitle}>KYC Document</Text>
                  <View style={styles.docMetaRow}>
                    <Text style={styles.docIdText}>DOC-00089</Text>
                    <View style={styles.badgeActive}>
                      <Text style={styles.badgeActiveText}>{t('farmerProfileDetail.badge.active')}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            ) : (
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

                  <View style={[styles.rowTwoCol, styles.rowSpacing]}>
                    <View style={styles.colHalf}>
                      <Text style={styles.labelMuted}>Document Type</Text>
                      <Text style={styles.valBold}>
                        {selectedDocId === 'DOC-00125' ? 'Certification' : 'Identity Verification'}
                      </Text>
                    </View>
                    <View style={styles.colHalf}>
                      <Text style={styles.labelMuted}>Status</Text>
                      <Text style={styles.valBold}>{t('farmerProfileDetail.badge.active')}</Text>
                    </View>
                  </View>

                  <View style={[styles.rowTwoCol, styles.rowSpacing]}>
                    <View style={styles.colHalf}>
                      <Text style={styles.labelMuted}>Issued Date</Text>
                      <Text style={styles.valBold}>12 Jun 2026</Text>
                    </View>
                    <View style={styles.colHalf}>
                      <Text style={styles.labelMuted}>Expiry Date</Text>
                      <Text style={styles.valBold}>12 Jun 2027</Text>
                    </View>
                  </View>

                  <View style={styles.rowSpacing}>
                    <Text style={styles.labelMuted}>Issuing Authority</Text>
                    <Text style={styles.valBold}>TOHFA Certification Board</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.outlineActionBtn}
                  onPress={() => Alert.alert('Preview Document', `Viewing verified document record for ${selectedDocId}.`)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.outlineActionBtnText}>Preview</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.outlineActionBtn, styles.rowSpacing]}
                  onPress={() => setSelectedDocId(null)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.outlineActionBtnText}>Back to Documents</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* ─── TAB 4: AUDITS ─── */}
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

              <View style={styles.rowSpacing}>
                <Text style={styles.labelMuted}>Audit Status</Text>
                <Text style={styles.valBold}>Upcoming</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.outlineActionBtn}
              onPress={() => {
                if (onNavigateAuditHistory) {
                  onNavigateAuditHistory();
                } else {
                  setShowHistoryScreen(true);
                }
              }}
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
                  <Text style={[styles.valBold, styles.valPending]}>03 Batches</Text>
                </View>
              </View>

              <View style={[styles.rowTwoCol, styles.rowSpacing]}>
                <View style={styles.colHalf}>
                  <Text style={styles.labelMuted}>Approved</Text>
                  <Text style={styles.valBold}>12 Batches</Text>
                </View>
                <View style={styles.colHalf}>
                  <Text style={styles.labelMuted}>Rejected</Text>
                  <Text style={[styles.valBold, styles.valRejected]}>03 Batches</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.outlineActionBtn}
              onPress={() => setShowProduceScreen(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.outlineActionBtnText}>View All Produce</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ─── TAB 6: RATINGS (Screenshots 3 & 4) ─── */}
        {activeTab === 'Ratings' && (
          <>
            {/* Overall Rating Card (78/100) */}
            <View style={styles.farmRatingHeroCard}>
              <Text style={styles.farmRatingHeroScore}>78 / 100</Text>
              <Text style={styles.farmRatingHeroLabel}>OVERALL RATING</Text>
              <Text style={styles.farmRatingHeroDate}>Last rated 15 Oct 2026</Text>
            </View>

            {/* Category Scores */}
            <Text style={styles.farmRatingSectionTitle}>Category Scores</Text>
            <View style={styles.detailsCard}>
              {FARM_RATING_CATEGORIES.map((cat, idx) => (
                <View
                  key={cat.name}
                  style={[
                    styles.farmRatingCategoryRow,
                    idx === FARM_RATING_CATEGORIES.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <Text style={styles.farmRatingCategoryName}>{cat.name}</Text>
                  <Text style={styles.farmRatingCategoryScore}>{cat.score}</Text>
                </View>
              ))}
            </View>

            {/* Farm Information */}
            <Text style={styles.farmRatingSectionTitle}>Farm Information</Text>
            <View style={styles.detailsCard}>
              <View style={styles.rowTwoCol}>
                <View style={styles.colHalf}>
                  <Text style={styles.labelMuted}>Farm</Text>
                  <Text style={styles.valBold}>Ooty Farm 01</Text>
                </View>
                <View style={styles.colHalf}>
                  <Text style={styles.labelMuted}>Zone</Text>
                  <Text style={styles.valBold}>Ooty</Text>
                </View>
              </View>
              <View style={[styles.rowTwoCol, styles.rowSpacing]}>
                <View style={styles.colHalf}>
                  <Text style={styles.labelMuted}>Farmer Since</Text>
                  <Text style={styles.valBold}>2023</Text>
                </View>
                <View style={styles.colHalf}>
                  <Text style={styles.labelMuted}>Last Audit</Text>
                  <Text style={styles.valBold}>15 Oct 2026</Text>
                </View>
              </View>
            </View>

            {/* Rating History */}
            <Text style={styles.farmRatingSectionTitle}>Rating History</Text>
            <View style={styles.farmRatingHistoryCard}>
              <Text style={styles.labelMuted}>12 Sep 2026</Text>
              <Text style={styles.valBold}>Rating: 4.6 · Zone: Coonoor</Text>
            </View>
            <View style={styles.farmRatingHistoryCard}>
              <Text style={styles.labelMuted}>01 Aug 2026</Text>
              <Text style={styles.valBold}>Rating: 4.4 · Zone: Coonoor</Text>
            </View>

            <TouchableOpacity
              style={[styles.outlineActionBtn, { marginTop: adminSpacing.sm }]}
              onPress={() => setShowRatingsScreen(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.outlineActionBtnText}>View Full Farm Rating</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ─── TAB 7: HISTORY ─── */}
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

              <View style={[styles.rowTwoCol, styles.rowSpacing]}>
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

            <TouchableOpacity
              style={styles.outlineActionBtn}
              onPress={() => setShowHistoryScreen(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.outlineActionBtnText}>View History</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stylesheet ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.2,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xxl,
  },

  // Profile Card
  profileCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.xl,
    paddingHorizontal: adminSpacing.lg,
    alignItems: 'center',
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.md,
  },
  farmerNameTitle: {
    ...adminType.title,
    color: adminColors.ink,
  },
  farmerSubMeta: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 4,
    textAlign: 'center',
  },
  statusBadge: {
    backgroundColor: adminColors.success.bg,
    borderRadius: adminRadius.sm,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 4,
    marginTop: adminSpacing.sm,
  },
  statusBadgeText: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.success.text,
  },

  // Horizontal Tabs Bar
  tabsContainer: {
    marginBottom: adminSpacing.lg,
  },
  tabsScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    gap: adminSpacing.xl,
  },
  tabButton: {
    paddingVertical: adminSpacing.sm,
    alignItems: 'center',
    position: 'relative',
  },
  tabButtonActive: {},
  tabText: {
    ...adminType.body,
  },
  tabTextActive: {
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  tabTextInactive: {
    fontWeight: '600',
    color: adminColors.muted,
  },
  tabActiveUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: adminColors.brand,
    borderRadius: 2,
  },

  // Dynamic Scrollbar Slider Track
  sliderBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: adminSpacing.sm,
    gap: adminSpacing.sm,
  },
  sliderArrowTouch: {
    paddingHorizontal: 3,
  },
  sliderArrowText: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  sliderTrack: {
    flex: 1,
    height: 5,
    backgroundColor: adminColors.border,
    borderRadius: adminRadius.xs,
    position: 'relative',
    justifyContent: 'center',
  },
  sliderThumb: {
    height: 5,
    backgroundColor: adminColors.muted,
    borderRadius: adminRadius.xs,
  },

  // Details Card
  detailsCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.xl,
    paddingVertical: adminSpacing.xl,
    marginBottom: adminSpacing.lg,
  },
  subSectionTitle: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
    marginTop: 6,
    marginBottom: adminSpacing.sm,
  },
  rowTwoCol: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowSpacing: {
    marginTop: adminSpacing.lg,
  },
  rowSpacingSm: {
    marginTop: adminSpacing.md,
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
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: adminSpacing.xs,
  },
  valBold: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  valPending: {
    color: adminColors.warning.text,
  },
  valRejected: {
    color: adminColors.danger.text,
  },
  valResolved: {
    color: adminColors.success.text,
  },

  // FMB Card
  fmbCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 28,
    paddingHorizontal: adminSpacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fmbCardText: {
    ...adminType.body,
    color: adminColors.muted,
    marginTop: 14,
    textAlign: 'center',
  },

  // Document Cards
  docCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.lg,
    marginBottom: adminSpacing.md,
  },
  docCardTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  docMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  docIdText: {
    ...adminType.body,
    color: adminColors.muted,
  },
  badgeActive: {
    backgroundColor: adminColors.success.bg,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 3,
  },
  badgeActiveText: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.success.text,
  },
  cardDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: adminSpacing.md,
  },
  docDateText: {
    ...adminType.caption,
    color: adminColors.muted,
  },

  // Actions
  outlineActionBtn: {
    height: 48,
    backgroundColor: adminColors.canvas,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineActionBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },
  bottomSpacer: {
    height: adminSpacing.xxl,
  },

  // Farm Rating styles (Screenshots 3 & 4)
  farmRatingHeroCard: {
    backgroundColor: adminColors.brandDeep,
    borderRadius: adminRadius.xl,
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.md,
  },
  farmRatingHeroScore: {
    ...adminType.kpiValue,
    fontSize: 36,
    lineHeight: 42,
    color: adminColors.onBrand,
    letterSpacing: -0.5,
  },
  farmRatingHeroLabel: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.onBrand,
    letterSpacing: 0.8,
    marginTop: 4,
  },
  farmRatingHeroDate: {
    ...adminType.caption,
    fontWeight: '500',
    color: adminColors.onBrand,
    opacity: 0.95,
    marginTop: 4,
  },
  farmRatingSectionTitle: {
    ...adminType.rowTitle,
    fontWeight: '800',
    color: adminColors.brandDeep,
    fontSize: 15,
    marginTop: 18,
    marginBottom: 8,
  },
  farmRatingCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  farmRatingCategoryName: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },
  farmRatingCategoryScore: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.ink,
  },
  farmRatingHistoryCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 14,
    marginBottom: 8,
  },
});
