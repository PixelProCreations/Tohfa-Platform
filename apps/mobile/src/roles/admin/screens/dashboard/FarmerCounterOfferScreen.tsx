import React, { useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';

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

function ClockOutlineIcon({ size = 14, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 7v5l3 3" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function InfoCircleOutlineIcon({ size = 16, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Line x1="12" y1="11" x2="12" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="12" cy="8" r="1" fill={color} />
    </Svg>
  );
}

function CheckmarkCircleGreenIcon({ size = 26, color = adminColors.success.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill={adminColors.success.bg} />
      <Path d="M8 12.5l2.8 2.8 5.5-5.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TagOutlineIcon({ size = 16, color = adminColors.warning.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="7" cy="7" r="1.5" fill={color} />
    </Svg>
  );
}



// ─── Component Props ──────────────────────────────────────────────────────────

export interface FarmerCounterOfferScreenProps {
  cropName?: string;
  grade?: string;
  receivedKg?: number;
  initialTab?: 'fairPrice' | 'counterOffer' | 'history';
  isTohfaAdminApproved?: boolean;
  onBack: () => void;
  onAcceptOffer?: () => void;
  onRejectOffer?: () => void;
  onSubmitCounter?: (newPrice: number) => void;
  onViewListingDetails?: () => void;
  onBackToListing?: () => void;
}

export function FarmerCounterOfferScreen({
  cropName = 'Tomato',
  grade = 'Grade 1',
  receivedKg = 145,
  initialTab = 'fairPrice',
  isTohfaAdminApproved = true,
  onBack,
  onAcceptOffer,
  onRejectOffer,
  onSubmitCounter,
  onViewListingDetails,
  onBackToListing,
}: FarmerCounterOfferScreenProps) {
  const [activeTab, setActiveTab] = useState<'fairPrice' | 'counterOffer' | 'history'>(initialTab);
  const [isApproved, setIsApproved] = useState<boolean>(isTohfaAdminApproved);

  React.useEffect(() => {
    setIsApproved(isTohfaAdminApproved);
  }, [isTohfaAdminApproved]);

  // Counter offer state (Screenshot 2 Right)
  const [proposedPrice, setProposedPrice] = useState('33.00');
  const [proposedKg, setProposedKg] = useState(String(receivedKg));
  const [selectedPreset, setSelectedPreset] = useState<'32' | '33' | '34' | '35'>('33');
  const [counterRemarks, setCounterRemarks] = useState(
    'Price adjusted based on current market rate and quality inspection.'
  );

  // Confirm Accept Modal state (Screenshot 3)
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmRemarks, setConfirmRemarks] = useState(
    "Accepted as per farmer's counter offer. Quality verified and within fair price range."
  );

  // Derived calculations
  const parsedPrice = parseFloat(proposedPrice) || 33.0;
  const parsedKg = parseFloat(proposedKg) || receivedKg;
  const calculatedTotal = (parsedPrice * parsedKg).toFixed(2);

  // Handler for permission restricted button
  const handlePermissionRestrictedPress = () => {
    Alert.alert(
      'Permission Restricted',
      'This counter offer requires Tohfa Admin approval first before counter offer actions can be initiated. Would you like to simulate Tohfa Admin approval now?',
      [
        { text: 'Keep Pending', style: 'cancel' },
        {
          text: 'Simulate Approval',
          style: 'default',
          onPress: () => {
            setIsApproved(true);
            Alert.alert('Approved by Tohfa Admin', 'Counter offer actions are now unlocked.');
          },
        },
      ]
    );
  };

  const handleMakeOffer = () => {
    if (!isApproved) {
      handlePermissionRestrictedPress();
      return;
    }
    Alert.alert(
      'Send Counter Offer',
      `Submit admin counter offer of Rs. ${parsedPrice.toFixed(2)}/KG for ${parsedKg} KG to farmer?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Offer',
          style: 'default',
          onPress: () => {
            if (onSubmitCounter) onSubmitCounter(parsedPrice);
            setActiveTab('history');
          },
        },
      ]
    );
  };

  const handleReject = () => {
    if (!isApproved) {
      handlePermissionRestrictedPress();
      return;
    }
    Alert.alert('Reject Offer', "Are you sure you want to reject the farmer's counter offer?", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: () => {
          if (onRejectOffer) onRejectOffer();
          onBack();
        },
      },
    ]);
  };

  const handleConfirmAcceptSubmit = () => {
    setShowConfirmModal(false);
    if (onAcceptOffer) onAcceptOffer();
    Alert.alert('Offer Accepted', "Farmer's counter offer accepted successfully.", [
      {
        text: 'Back to listing',
        onPress: () => {
          if (onBackToListing) {
            onBackToListing();
          } else if (onViewListingDetails) {
            onViewListingDetails();
          } else {
            setActiveTab('history');
          }
        },
      },
      {
        text: 'View History',
        onPress: () => setActiveTab('history'),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Orange Terracotta Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Counter Offer</Text>
        </View>

        <Text style={styles.headerSubtitle}>
          {`${cropName} · ${grade} · Received ${receivedKg} KG`}
        </Text>

        {/* Expiry & Round Banner Pill */}
        <View style={styles.expiryPill}>
          <ClockOutlineIcon size={14} color={adminColors.onBrand} />
          <Text style={styles.expiryPillText}>Expires in 18h 42m · Round 2 of 3</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Top Overview Card (Rendered only on Fair Price tab per design) ─── */}
        {activeTab === 'fairPrice' && (
          <View style={styles.overviewCard}>
            <View style={styles.overviewTopRow}>
              {/* Produce Image Thumbnail Placeholder matching design */}
              <View style={styles.overviewThumbnail} />

              <View style={styles.overviewInfoCol}>
                <View style={styles.cropTitleRow}>
                  <Text style={styles.cropTitleText}>{`${cropName} (Local)`}</Text>
                  <View style={styles.gradeBadge}>
                    <Text style={styles.gradeBadgeText}>{grade}</Text>
                  </View>
                </View>

                <Text style={styles.farmerDetailLine}>Farmer: Ramesh Kumar</Text>
                <Text style={styles.farmerDetailLine}>Farmer ID: FR-00124</Text>
                <Text style={styles.farmerDetailLine}>Farm / Zone: Ooty - Zone A</Text>
              </View>
            </View>

            <View style={styles.overviewDivider} />

            {/* 4 Metrics Grid */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricCol}>
                <Text style={styles.metricLabel}>Expected Qty</Text>
                <Text style={styles.metricValue}>150 KG</Text>
              </View>
              <View style={styles.metricCol}>
                <Text style={styles.metricLabel}>Received Qty</Text>
                <Text style={styles.metricValue}>{`${receivedKg} KG`}</Text>
              </View>
              <View style={styles.metricCol}>
                <Text style={styles.metricLabel}>Quality Grade</Text>
                <Text style={styles.metricValue}>{grade}</Text>
              </View>
              <View style={styles.metricCol}>
                <Text style={styles.metricLabel}>Batch No.</Text>
                <Text style={styles.metricValue}>GR-2025-001</Text>
              </View>
            </View>
          </View>
        )}

        {/* ─── Segmented Tabs (Fair Price | Counter Offer | History) ─── */}
        <View style={styles.tabsContainer}>
          <View style={styles.tabsTrack}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'fairPrice' && styles.tabButtonActive]}
              onPress={() => setActiveTab('fairPrice')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabButtonText, activeTab === 'fairPrice' && styles.tabButtonTextActive]}>
                Fair Price
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'counterOffer' && styles.tabButtonActive]}
              onPress={() => {
                if (!isApproved) {
                  handlePermissionRestrictedPress();
                } else {
                  setActiveTab('counterOffer');
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabButtonText, activeTab === 'counterOffer' && styles.tabButtonTextActive]}>
                Counter Offer
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
              onPress={() => setActiveTab('history')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabButtonText, activeTab === 'history' && styles.tabButtonTextActive]}>
                History
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 1: FAIR PRICE (Exact Screenshot 1 & 2 Visuals)
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'fairPrice' && (
          <View>
            <View style={styles.detailsCard}>
              {/* Card Header Row */}
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardHeaderLeft}>
                  <InfoCircleOutlineIcon size={16} color={adminColors.brandDeep} />
                  <Text style={styles.cardHeaderTitle}>Fair Price Details</Text>
                </View>
                <View style={styles.refBadge}>
                  <Text style={styles.refBadgeText}>Reference only</Text>
                </View>
              </View>

              {/* 2x2 Metadata Grid */}
              <View style={styles.metaGrid}>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Crop</Text>
                  <Text style={styles.metaValue}>{`${cropName} (Local)`}</Text>
                </View>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Grade</Text>
                  <Text style={styles.metaValue}>{grade}</Text>
                </View>
              </View>

              <View style={[styles.metaGrid, { marginTop: 12 }]}>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Market / Zone</Text>
                  <Text style={styles.metaValue}>Ooty</Text>
                </View>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Unit</Text>
                  <Text style={styles.metaValue}>Rs./KG</Text>
                </View>
              </View>

              {/* Mint Green Fair Price Ceiling Banner */}
              <View style={styles.ceilingBanner}>
                <Text style={styles.ceilingTitle}>Fair Price Ceiling (Max Allowed)</Text>
                <Text style={styles.ceilingPrice}>Rs. 36.00 / KG</Text>
                <Text style={styles.ceilingEffective}>Effective from 1 Sep 2026</Text>
              </View>

              {/* Comparison Table */}
              <View style={styles.comparisonTable}>
                <View style={styles.comparisonRow}>
                  <Text style={styles.comparisonLabel}>Original Agreed Price</Text>
                  <Text style={styles.comparisonValue}>Rs. 32.00 / KG</Text>
                </View>

                <View style={styles.comparisonDivider} />

                <View style={styles.comparisonRow}>
                  <Text style={styles.comparisonLabel}>Farmer Counter Offer</Text>
                  <Text style={[styles.comparisonValue, { color: adminColors.success.text }]}>Rs. 34.00 / KG</Text>
                </View>

                <View style={styles.comparisonDivider} />

                <View style={styles.comparisonRow}>
                  <Text style={styles.comparisonLabel}>Difference</Text>
                  <Text style={[styles.comparisonValue, { color: adminColors.brand }]}>
                    +Rs. 2.00 / KG (+6.25%)
                  </Text>
                </View>

                <View style={styles.comparisonDivider} />

                <View style={styles.comparisonRow}>
                  <Text style={styles.comparisonLabel}>Gap from Ceiling</Text>
                  <Text style={[styles.comparisonValue, { color: adminColors.success.text }]}>
                    Rs. 2.00 / KG below
                  </Text>
                </View>
              </View>
            </View>

            {/* Supporting Evidence Section (Outside Card Matching Design) */}
            <Text style={styles.evidenceLabel}>Supporting Evidence</Text>
            <View style={styles.evidenceGrid}>
              <View style={styles.evidenceThumb} />
              <View style={styles.evidenceThumb} />
              <View style={styles.evidenceThumb} />
            </View>
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 2: COUNTER OFFER REVIEW & DECISION (Exact Screenshot 3 Visuals)
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'counterOffer' && (
          <View>
            {/* Current Offer from Farmer Card */}
            <View style={styles.detailsCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardSectionHead}>Current Offer from Farmer</Text>
                <View style={styles.pendingReviewBadge}>
                  <Text style={styles.pendingReviewBadgeText}>Pending Review</Text>
                </View>
              </View>

              <View style={styles.proposalRow}>
                <Text style={styles.proposalLabel}>Offered Price</Text>
                <Text style={[styles.proposalValue, { color: adminColors.success.text }]}>Rs. 34.00 / KG</Text>
              </View>
              <View style={styles.proposalRow}>
                <Text style={styles.proposalLabel}>Quantity</Text>
                <Text style={styles.proposalValue}>{`${receivedKg} KG`}</Text>
              </View>
              <View style={styles.proposalRow}>
                <Text style={styles.proposalLabel}>Total Amount</Text>
                <Text style={styles.proposalValue}>Rs. 4,930.00</Text>
              </View>

              <View style={styles.divider} />

              <Text style={styles.metaLabel}>Farmer's Reason</Text>
              <Text style={styles.farmerReasonText}>
                "Market price is high and good quality produce."
              </Text>
            </View>

            {/* Your Counter Offer (Optional) Card */}
            <View style={[styles.detailsCard, { marginTop: 14 }]}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardSectionHead}>Your Counter Offer (Optional)</Text>
                <InfoCircleOutlineIcon size={16} color={adminColors.muted} />
              </View>

              <Text style={[styles.metaLabel, { marginTop: 12 }]}>Proposed Price (Rs. / KG)</Text>
              <View style={styles.inputWithSuffixRow}>
                <TextInput
                  style={styles.priceInputInner}
                  keyboardType="decimal-pad"
                  value={proposedPrice}
                  onChangeText={setProposedPrice}
                  placeholder="33.00"
                  placeholderTextColor={adminColors.placeholder}
                />
                <Text style={styles.inputSuffix}>/ KG</Text>
              </View>

              {/* 4 Preset Price Chips */}
              <View style={styles.presetChipsRow}>
                <TouchableOpacity
                  style={[styles.presetChip, selectedPreset === '32' && styles.presetChipActive]}
                  onPress={() => {
                    setSelectedPreset('32');
                    setProposedPrice('32.00');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.presetChipPrice}>Rs.32.00</Text>
                  <Text style={styles.presetChipSubtitle}>Original Price</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.presetChip, selectedPreset === '33' && styles.presetChipActive]}
                  onPress={() => {
                    setSelectedPreset('33');
                    setProposedPrice('33.00');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.presetChipPrice, selectedPreset === '33' && styles.presetChipPriceActive]}>
                    Rs.33.00
                  </Text>
                  <Text style={[styles.presetChipSubtitle, selectedPreset === '33' && styles.presetChipSubActive]}>
                    Your Offer
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.presetChip, selectedPreset === '34' && styles.presetChipActive]}
                  onPress={() => {
                    setSelectedPreset('34');
                    setProposedPrice('34.00');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.presetChipPrice}>Rs.34.00</Text>
                  <Text style={styles.presetChipSubtitle}>Farmer Offer</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.presetChip, selectedPreset === '35' && styles.presetChipActive]}
                  onPress={() => {
                    setSelectedPreset('35');
                    setProposedPrice('35.00');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.presetChipPrice}>Rs.35.00</Text>
                  <Text style={styles.presetChipSubtitle}>Ceiling -1</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.metaLabel, { marginTop: 14 }]}>Quantity</Text>
              <View style={styles.inputWithSuffixRow}>
                <TextInput
                  style={styles.priceInputInner}
                  keyboardType="number-pad"
                  value={proposedKg}
                  onChangeText={setProposedKg}
                  placeholder="145"
                  placeholderTextColor={adminColors.placeholder}
                />
                <Text style={styles.inputSuffix}>KG</Text>
              </View>

              <View style={styles.proposalRow}>
                <Text style={styles.proposalLabel}>Total Amount</Text>
                <Text style={styles.proposalValue}>{`Rs. ${calculatedTotal}`}</Text>
              </View>
              <Text style={styles.calculatedHelper}>
                Calculated based on proposed price and quantity
              </Text>

              <Text style={[styles.metaLabel, { marginTop: 14 }]}>Your Remarks (Required)</Text>
              <TextInput
                style={styles.notesInput}
                multiline
                numberOfLines={3}
                maxLength={500}
                value={counterRemarks}
                onChangeText={setCounterRemarks}
                placeholder="Enter remarks..."
                placeholderTextColor={adminColors.placeholder}
              />
              <Text style={styles.charCounter}>{`${counterRemarks.length}/500`}</Text>
            </View>
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 3: NEGOTIATION HISTORY (Screenshot 4)
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'history' && (
          <View>
            <Text style={styles.historySectionTitle}>Negotiation History</Text>

            <View style={styles.timelineContainer}>
              {/* Timeline Step 1: Offer #3 (Pending) */}
              <View style={styles.timelineRow}>
                <View style={styles.timelineLeftCol}>
                  <View style={[styles.timelineNode, { borderColor: adminColors.warning.text }]} />
                  <View style={styles.timelineConnectingLine} />
                </View>

                <View style={styles.timelineCard}>
                  <View style={styles.timelineCardHeader}>
                    <Text style={styles.timelineOfferNum}>Offer #3</Text>
                    <View style={styles.timelinePendingBadge}>
                      <Text style={styles.timelinePendingBadgeText}>Pending</Text>
                    </View>
                  </View>
                  <Text style={styles.timelineDateText}>12 Oct 2026, 10:30 AM</Text>
                  <Text style={styles.timelineDetailText}>
                    Farmer offered:{' '}
                    <Text style={{ fontWeight: '800', color: adminColors.ink }}>Rs. 34.00 / KG</Text>
                  </Text>
                  <Text style={styles.timelineDetailText}>
                    Quantity:{' '}
                    <Text style={{ fontWeight: '800', color: adminColors.ink }}>145 KG</Text>
                  </Text>
                  <Text style={styles.timelineDetailText}>
                    Reason: Market price is high and good quality produce
                  </Text>
                </View>
              </View>

              {/* Timeline Step 2: Offer #2 (Countered) */}
              <View style={styles.timelineRow}>
                <View style={styles.timelineLeftCol}>
                  <View style={[styles.timelineNode, { borderColor: adminColors.info.text }]} />
                  <View style={styles.timelineConnectingLine} />
                </View>

                <View style={styles.timelineCard}>
                  <View style={styles.timelineCardHeader}>
                    <Text style={styles.timelineOfferNum}>Offer #2</Text>
                    <View style={styles.timelineCounteredBadge}>
                      <Text style={styles.timelineCounteredBadgeText}>Countered</Text>
                    </View>
                  </View>
                  <Text style={styles.timelineDateText}>11 Oct 2026, 02:15 PM</Text>
                  <Text style={styles.timelineDetailText}>
                    Warehouse offered:{' '}
                    <Text style={{ fontWeight: '800', color: adminColors.ink }}>Rs. 33.00 / KG</Text>
                  </Text>
                  <Text style={styles.timelineDetailText}>
                    Quantity:{' '}
                    <Text style={{ fontWeight: '800', color: adminColors.ink }}>145 KG</Text>
                  </Text>
                  <Text style={styles.timelineDetailText}>
                    Remarks: Adjusted based on current market rate.
                  </Text>
                </View>
              </View>

              {/* Timeline Step 3: Offer #1 (Initial) */}
              <View style={styles.timelineRow}>
                <View style={styles.timelineLeftCol}>
                  <View style={[styles.timelineNode, { borderColor: adminColors.success.text }]} />
                </View>

                <View style={styles.timelineCard}>
                  <View style={styles.timelineCardHeader}>
                    <Text style={styles.timelineOfferNum}>Offer #1</Text>
                    <View style={styles.timelineInitialBadge}>
                      <Text style={styles.timelineInitialBadgeText}>Initial</Text>
                    </View>
                  </View>
                  <Text style={styles.timelineDateText}>10 Oct 2026, 09:20 AM</Text>
                  <Text style={styles.timelineDetailText}>
                    Original agreed price:{' '}
                    <Text style={{ fontWeight: '800', color: adminColors.ink }}>Rs. 32.00 / KG</Text>
                  </Text>
                  <Text style={styles.timelineDetailText}>
                    Quantity:{' '}
                    <Text style={{ fontWeight: '800', color: adminColors.ink }}>145 KG</Text>
                  </Text>
                  <Text style={styles.timelineDetailText}>
                    Remarks: Initial agreement during listing.
                  </Text>
                </View>
              </View>
            </View>

            {/* Blue Info Notice Card */}
            <View style={styles.historyInfoNotice}>
              <InfoCircleOutlineIcon size={16} color={adminColors.info.text} />
              <Text style={styles.historyInfoNoticeText}>
                All negotiations are recorded for transparency. Previous offers cannot be edited or deleted.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ─── Docked Bottom Button for Tab 1 (Fair Price: Continue vs Permission Restricted) ─── */}
      {activeTab === 'fairPrice' && (
        <View style={styles.dockedFooter}>
          {isApproved ? (
            <TouchableOpacity
              style={styles.continueBtn}
              onPress={() => setActiveTab('counterOffer')}
              activeOpacity={0.85}
            >
              <Text style={styles.continueBtnText}>Continue to Counter Offer →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.continueBtn}
              onPress={handlePermissionRestrictedPress}
              activeOpacity={0.85}
            >
              <Text style={styles.continueBtnText}>Permission Restricted</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ─── Docked Bottom Actions for Tab 2 (Counter Offer: Reject | Make Offer | Accept) ─── */}
      {activeTab === 'counterOffer' && (
        <View style={styles.dockedFooter}>
          <View style={styles.counterActionRow}>
            <TouchableOpacity
              style={styles.rejectOutlineBtn}
              onPress={handleReject}
              activeOpacity={0.75}
            >
              <Text style={styles.rejectOutlineBtnText}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.makeOfferOutlineBtn}
              onPress={handleMakeOffer}
              activeOpacity={0.75}
            >
              <Text style={styles.makeOfferOutlineBtnText}>Make Offer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.acceptSolidBtn}
              onPress={() => setShowConfirmModal(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.acceptSolidBtnText}>Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ─── Docked Bottom Button for Tab 3 (History: Back to listing - Right Design) ─── */}
      {activeTab === 'history' && (
        <View style={styles.dockedFooter}>
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={() => {
              if (onAcceptOffer) {
                onAcceptOffer();
              }
              if (onBackToListing) {
                onBackToListing();
              } else if (onViewListingDetails) {
                onViewListingDetails();
              } else {
                onBack();
              }
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.continueBtnText}>Back to listing</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          CONFIRM COUNTER OFFER MODAL (Screenshot 3)
         ══════════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showConfirmModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <SafeAreaView style={styles.modalRoot}>
          <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

          {/* Modal Header */}
          <View style={styles.header}>
            <View style={styles.headerTopRow}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => setShowConfirmModal(false)}
                activeOpacity={0.7}
              >
                <BackArrowIcon size={22} color={adminColors.onBrand} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Confirm Counter Offer</Text>
            </View>
            <Text style={styles.headerSubtitle}>
              {`${cropName} · ${grade} · Received ${receivedKg} KG`}
            </Text>
            <View style={styles.expiryPill}>
              <ClockOutlineIcon size={14} color={adminColors.onBrand} />
              <Text style={styles.expiryPillText}>Expires in 18h 42m · Round 2 of 3</Text>
            </View>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.detailsCard}>
              <View style={styles.confirmHeaderRow}>
                <CheckmarkCircleGreenIcon size={24} />
                <Text style={styles.confirmHeaderTitle}>Accept Farmer Offer?</Text>
              </View>
              <Text style={styles.confirmSubtext}>
                You are about to accept the farmer's counter offer.
              </Text>

              <View style={styles.confirmTable}>
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>Crop</Text>
                  <Text style={styles.confirmValue}>{`${cropName} (Local)`}</Text>
                </View>
                <View style={styles.confirmDivider} />
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>Grade</Text>
                  <Text style={styles.confirmValue}>{grade}</Text>
                </View>
                <View style={styles.confirmDivider} />
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>Farmer</Text>
                  <Text style={styles.confirmValue}>Ramesh Kumar (FR-00124)</Text>
                </View>
                <View style={styles.confirmDivider} />
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>Quantity</Text>
                  <Text style={styles.confirmValue}>{`${receivedKg} KG`}</Text>
                </View>
                <View style={styles.confirmDivider} />
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>Agreed Price</Text>
                  <Text style={styles.confirmValue}>Rs. 34.00 / KG</Text>
                </View>
                <View style={styles.confirmDivider} />
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>Total Amount</Text>
                  <Text style={styles.confirmValue}>Rs. 4,930.00</Text>
                </View>
              </View>
            </View>

            {/* Ceiling notice banner outside card matching screenshot */}
            <View style={styles.ceilingNoticeBanner}>
              <TagOutlineIcon size={16} color={adminColors.warning.text} />
              <Text style={styles.ceilingNoticeText}>
                This price is within the fair price ceiling (Rs. 36.00 / KG).
              </Text>
            </View>

            {/* Remarks Section Outside Card Matching Screenshot */}
            <Text style={[styles.metaLabel, { marginTop: 18, marginBottom: 8 }]}>Add Remarks (Optional)</Text>
            <View style={styles.confirmRemarksContainer}>
              <TextInput
                style={styles.confirmRemarksInput}
                multiline
                numberOfLines={3}
                maxLength={500}
                value={confirmRemarks}
                onChangeText={setConfirmRemarks}
                placeholder="Add remarks..."
                placeholderTextColor={adminColors.placeholder}
              />
            </View>
            <Text style={styles.charCounter}>{`${confirmRemarks.length}/500`}</Text>
          </ScrollView>

          {/* Modal Docked Footer */}
          <View style={styles.modalDockedFooter}>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setShowConfirmModal(false)}
              activeOpacity={0.75}
            >
              <Text style={styles.modalCancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalConfirmBtn}
              onPress={handleConfirmAcceptSubmit}
              activeOpacity={0.85}
            >
              <Text style={styles.modalConfirmBtnText}>Confirm & Accept</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles Strictly Derived From Admin Theme ───────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  modalRoot: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 110,
  },

  // ─── Header ───
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    marginLeft: -4,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
    flex: 1,
  },
  headerSubtitle: {
    ...adminType.body,
    color: adminColors.onBrand,
    fontSize: 12.5,
    marginTop: 4,
    fontWeight: '600',
  },
  expiryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: adminColors.headerIcon.bg,
    borderRadius: adminRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 4.5,
    marginTop: 10,
    gap: 6,
  },
  expiryPillText: {
    ...adminType.caption,
    color: adminColors.onBrand,
    fontSize: 11,
    fontWeight: '700',
  },
  adminStatusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: adminRadius.full,
  },
  adminStatusChipPending: {
    backgroundColor: adminColors.warning.bg,
  },
  adminStatusChipApproved: {
    backgroundColor: adminColors.success.bg,
  },
  adminStatusChipText: {
    color: adminColors.onBrand,
    fontSize: 11,
    fontWeight: '700',
  },

  // ─── Overview Card (Top) ───
  overviewCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: 14,
    marginBottom: 12,
    ...adminShadow.sm,
  },
  overviewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overviewThumbnail: {
    width: 62,
    height: 62,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  overviewThumbnailText: {
    fontSize: 28,
  },
  overviewInfoCol: {
    flex: 1,
  },
  cropTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cropTitleText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  gradeBadge: {
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: adminRadius.full,
  },
  gradeBadgeText: {
    color: adminColors.success.text,
    fontSize: 11,
    fontWeight: '800',
  },
  farmerDetailLine: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    fontSize: 11.5,
    marginTop: 1.5,
  },
  overviewDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricCol: {
    flex: 1,
  },
  metricLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 3,
  },
  metricValue: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 12.5,
    fontWeight: '800',
  },

  // ─── Segmented Tabs ───
  tabsContainer: {
    marginBottom: 14,
  },
  tabsTrack: {
    flexDirection: 'row',
    backgroundColor: adminColors.border,
    borderRadius: adminRadius.md,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: adminRadius.md - 2,
  },
  tabButtonActive: {
    backgroundColor: adminColors.brand,
    ...adminShadow.sm,
  },
  tabButtonText: {
    ...adminType.body,
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },
  tabButtonTextActive: {
    color: adminColors.onBrand,
  },

  // ─── Details Card ───
  detailsCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: 16,
    ...adminShadow.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardHeaderTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontSize: 14.5,
    fontWeight: '800',
  },
  cardSectionHead: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  refBadge: {
    backgroundColor: adminColors.brandTint,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: adminRadius.full,
  },
  refBadgeText: {
    color: adminColors.brandDeep,
    fontSize: 10.5,
    fontWeight: '700',
  },
  pendingReviewBadge: {
    backgroundColor: adminColors.warning.bg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: adminRadius.full,
  },
  pendingReviewBadgeText: {
    color: adminColors.warning.text,
    fontSize: 10.5,
    fontWeight: '700',
  },

  // ─── Meta Grid ───
  metaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 10.5,
    fontWeight: '600',
  },
  metaValue: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },

  // ─── Ceiling Banner (Mint Green) ───
  ceilingBanner: {
    backgroundColor: adminColors.success.bg,
    borderWidth: 1,
    borderColor: adminColors.success.border,
    borderRadius: adminRadius.md,
    padding: 14,
    marginTop: 16,
  },
  ceilingTitle: {
    ...adminType.caption,
    color: adminColors.success.text,
    fontSize: 11,
    fontWeight: '700',
  },
  ceilingPrice: {
    color: adminColors.success.text,
    fontSize: 22,
    fontWeight: '900',
    marginVertical: 3,
  },
  ceilingEffective: {
    ...adminType.caption,
    color: adminColors.success.text,
    fontSize: 10,
    fontWeight: '600',
  },

  // ─── Comparison Table ───
  comparisonTable: {
    marginTop: 14,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  comparisonLabel: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 12.5,
    fontWeight: '500',
  },
  comparisonValue: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 12.5,
    fontWeight: '800',
  },
  comparisonDivider: {
    height: 1,
    backgroundColor: adminColors.border,
  },

  // ─── Evidence Thumbnails ───
  evidenceLabel: {
    ...adminType.caption,
    color: adminColors.ink,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 18,
    marginBottom: 10,
  },
  evidenceGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  evidenceThumb: {
    width: 64,
    height: 64,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.border,
  },

  // ─── Counter Offer Tab ───
  proposalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  proposalLabel: {
    ...adminType.body,
    color: adminColors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  proposalValue: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 12.5,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: 10,
  },
  farmerReasonText: {
    ...adminType.body,
    fontStyle: 'italic',
    color: adminColors.ink,
    fontSize: 12,
    marginTop: 3,
  },

  inputWithSuffixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    paddingHorizontal: 12,
    height: 44,
    marginTop: 6,
  },
  priceInputInner: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.ink,
  },
  inputSuffix: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 12,
    fontWeight: '700',
  },

  presetChipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  presetChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
    backgroundColor: adminColors.card,
  },
  presetChipActive: {
    borderColor: adminColors.success.border,
    backgroundColor: adminColors.success.bg,
  },
  presetChipPrice: {
    fontSize: 11,
    fontWeight: '800',
    color: adminColors.ink,
  },
  presetChipPriceActive: {
    color: adminColors.success.text,
  },
  presetChipSubtitle: {
    fontSize: 8.5,
    color: adminColors.muted,
    marginTop: 1,
    fontWeight: '600',
  },
  presetChipSubActive: {
    color: adminColors.success.text,
  },

  calculatedHelper: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 10,
    marginTop: 2,
    marginBottom: 6,
  },
  notesInput: {
    borderWidth: 1.5,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12.5,
    color: adminColors.ink,
    backgroundColor: adminColors.card,
    marginTop: 6,
    minHeight: 64,
    textAlignVertical: 'top',
  },

  counterActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rejectOutlineBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: adminColors.danger.border,
    borderRadius: adminRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
  },
  rejectOutlineBtnText: {
    color: adminColors.danger.text,
    fontSize: 13,
    fontWeight: '800',
  },
  makeOfferOutlineBtn: {
    flex: 1.2,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
  },
  makeOfferOutlineBtnText: {
    color: adminColors.brand,
    fontSize: 13,
    fontWeight: '800',
  },
  acceptSolidBtn: {
    flex: 1.2,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptSolidBtnText: {
    color: adminColors.onBrand,
    fontSize: 13,
    fontWeight: '800',
  },

  // ─── Negotiation History Tab (Screenshot 4) ───
  historySectionTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
  },
  timelineContainer: {
    paddingLeft: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  timelineLeftCol: {
    width: 24,
    alignItems: 'center',
    marginRight: 10,
  },
  timelineNode: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2.5,
    backgroundColor: adminColors.card,
    marginTop: 6,
  },
  timelineConnectingLine: {
    flex: 1,
    width: 2,
    backgroundColor: adminColors.border,
    marginTop: 4,
  },
  timelineCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    padding: 12,
    ...adminShadow.sm,
  },
  timelineCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  timelineOfferNum: {
    ...adminType.rowTitle,
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.ink,
  },
  timelinePendingBadge: {
    backgroundColor: adminColors.warning.bg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: adminRadius.full,
  },
  timelinePendingBadgeText: {
    color: adminColors.warning.text,
    fontSize: 10,
    fontWeight: '800',
  },
  timelineCounteredBadge: {
    backgroundColor: adminColors.info.bg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: adminRadius.full,
  },
  timelineCounteredBadgeText: {
    color: adminColors.info.text,
    fontSize: 10,
    fontWeight: '800',
  },
  timelineInitialBadge: {
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: adminRadius.full,
  },
  timelineInitialBadgeText: {
    color: adminColors.success.text,
    fontSize: 10,
    fontWeight: '800',
  },
  timelineDateText: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 10.5,
    marginBottom: 6,
  },
  timelineDetailText: {
    ...adminType.body,
    fontSize: 11.5,
    color: adminColors.muted,
    lineHeight: 17,
  },
  historyInfoNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.info.bg,
    borderRadius: adminRadius.md,
    padding: 12,
    marginTop: 10,
    marginBottom: 16,
    gap: 8,
  },
  historyInfoNoticeText: {
    ...adminType.caption,
    color: adminColors.info.text,
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  backToListingBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.md,
  },
  backToListingBtnText: {
    color: adminColors.onBrand,
    fontSize: 13.5,
    fontWeight: '800',
  },

  // ─── Docked Footer Buttons (Screenshot 1: Permission Restricted) ───
  dockedFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: adminColors.canvas,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 10,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  continueBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.md,
  },
  continueBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
    fontSize: 13.5,
    fontWeight: '800',
  },
  restrictedBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...adminShadow.md,
  },
  restrictedBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
    fontSize: 13.5,
    fontWeight: '800',
  },

  // ─── Confirm Modal Styles (Screenshot 3) ───
  confirmHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  confirmHeaderTitle: {
    ...adminType.rowTitle,
    color: adminColors.success.text,
    fontSize: 17,
    fontWeight: '800',
  },
  confirmSubtext: {
    ...adminType.body,
    color: adminColors.muted,
    fontSize: 12.5,
    marginTop: 4,
    marginBottom: 10,
  },
  confirmTable: {
    marginTop: 6,
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  confirmDivider: {
    height: 1,
    backgroundColor: adminColors.border,
  },
  confirmLabel: {
    ...adminType.body,
    color: adminColors.muted,
    fontSize: 13,
    fontWeight: '500',
  },
  confirmValue: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  ceilingNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.warning.bg,
    borderRadius: adminRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 14,
    gap: 10,
  },
  ceilingNoticeText: {
    ...adminType.caption,
    color: adminColors.warning.text,
    fontSize: 11.5,
    fontWeight: '700',
    flex: 1,
  },
  confirmRemarksContainer: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    padding: 12,
    ...adminShadow.sm,
  },
  confirmRemarksInput: {
    fontSize: 12.5,
    color: adminColors.ink,
    minHeight: 64,
    textAlignVertical: 'top',
  },
  charCounter: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 10.5,
    textAlign: 'right',
    marginTop: 4,
  },
  modalDockedFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 26,
    backgroundColor: adminColors.canvas,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  modalCancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: adminColors.danger.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
  },
  modalCancelBtnText: {
    color: adminColors.danger.text,
    fontSize: 14,
    fontWeight: '800',
  },
  modalConfirmBtn: {
    flex: 1.2,
    backgroundColor: adminColors.brand,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.md,
  },
  modalConfirmBtnText: {
    color: adminColors.onBrand,
    fontSize: 14,
    fontWeight: '800',
  },
});
