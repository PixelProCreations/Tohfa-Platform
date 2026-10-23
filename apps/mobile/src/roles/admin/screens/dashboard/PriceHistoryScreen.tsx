import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';

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

function HorizontalSlidersIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="6" x2="20" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="18" x2="20" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="8" cy="6" r="2.2" fill={color} />
      <Circle cx="16" cy="12" r="2.2" fill={color} />
      <Circle cx="10" cy="18" r="2.2" fill={color} />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Line x1="16.5" y1="16.5" x2="21" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 18, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LockIcon({ size = 16, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="11" width="16" height="11" rx="2" stroke={color} strokeWidth="1.8" />
      <Path d="M7 11V7a5 5 0 0110 0v4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Data Interfaces ─────────────────────────────────────────────────────────

export interface PriceHistoryItem {
  id: string; // e.g. 'PH-0034'
  product: string;
  grade: string;
  priceType: string;
  previousValue: string;
  newValue: string;
  changeReason: string;
  changedBy: string;
  recorded: string;
  effectiveDate: string;
  status: 'Valid' | 'Failed' | 'Applied';
  validation: string;
  auditRef: string;
  attemptNote?: string;
}

export interface CounterOfferItem {
  id: string; // e.g. 'CO-0001'
  listing: string; // e.g. 'LST-2004'
  product: string;
  grade: string;
  quantity: string;
  originalPrice: string;
  counterPrice: string;
  offerRound: string; // 'Offer 2 of 3'
  offeredDate: string;
  deadline: string;
  farmerName: string;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Expired';
  recordedResponse: string;
  decisionRecorded: string;
}

// ─── Fixtures Matching Design Mockups ───────────────────────────────────────

export const PRICE_HISTORY_FIXTURES: PriceHistoryItem[] = [
  {
    id: 'PH-0034',
    product: 'Potato',
    grade: 'Grade 1',
    priceType: 'Retail Price',
    previousValue: '₹29.00/kg',
    newValue: '₹32.00/kg',
    changeReason: 'Regular review (demo)',
    changedBy: 'Demo TOHFA Admin',
    recorded: '21 Sep 2026, 10:00',
    effectiveDate: '21 Sep 2026',
    status: 'Valid',
    validation: 'Within the ceiling of ₹35.00/kg in force on the effective date.',
    auditRef: 'AUD-134',
  },
  {
    id: 'PH-0035',
    product: 'Tomato',
    grade: 'Grade 1',
    priceType: 'Retail Price',
    previousValue: '₹52.00',
    newValue: '₹55.00',
    changeReason: 'Seasonal adjustment',
    changedBy: 'Priya Nair',
    recorded: '10 Oct 2026, 09:30',
    effectiveDate: '10 Oct 2026',
    status: 'Valid',
    validation: 'Within ceiling ₹60.00/kg.',
    auditRef: 'AUD-00231',
  },
  {
    id: 'PH-0036',
    product: 'Carrot',
    grade: 'Grade 1',
    priceType: 'Retail Price',
    previousValue: '₹70.00',
    newValue: '₹74.00',
    changeReason: 'Price increase attempt',
    changedBy: 'Priya Nair',
    recorded: '9 Oct 2026, 14:15',
    effectiveDate: '9 Oct 2026',
    status: 'Failed',
    validation: 'Rejected, above ceiling ₹70.00/kg.',
    auditRef: 'AUD-00228',
    attemptNote: '₹70.00 → ₹74.00 attempted · rejected, above ceiling ₹70.00',
  },
  {
    id: 'PH-0037',
    product: 'Beans',
    grade: 'Grade 1',
    priceType: 'Retail Price',
    previousValue: '₹72.00/kg',
    newValue: '₹75.00/kg',
    changeReason: 'Quarterly review',
    changedBy: 'Suresh Admin',
    recorded: '5 Oct 2026, 11:00',
    effectiveDate: '5 Oct 2026',
    status: 'Valid',
    validation: 'Within ceiling ₹80.00/kg.',
    auditRef: 'AUD-00215',
  },
  {
    id: 'PH-0038',
    product: 'Cabbage',
    grade: 'Grade 2',
    priceType: 'Retail Price',
    previousValue: '₹22.00/kg',
    newValue: '₹24.00/kg',
    changeReason: 'Cost increase',
    changedBy: 'Admin',
    recorded: '29 Sep 2026, 10:00',
    effectiveDate: '29 Sep 2026',
    status: 'Valid',
    validation: 'Within ceiling ₹25.00/kg.',
    auditRef: 'AUD-00198',
  },
];

export const COUNTER_OFFER_FIXTURES: CounterOfferItem[] = [
  {
    id: 'CO-0001',
    listing: 'LST-2004',
    product: 'Tomato',
    grade: 'Grade 1',
    quantity: '120 kg',
    originalPrice: '₹32.00',
    counterPrice: '₹34.00',
    offerRound: 'Offer 2 of 3',
    offeredDate: '14 Oct 2026, 09:00',
    deadline: '14 Oct 2026, 18:00',
    farmerName: 'Ramesh Kumar',
    status: 'Pending',
    recordedResponse: 'None yet',
    decisionRecorded: '—',
  },
  {
    id: 'CO-0002',
    listing: 'LST-2011',
    product: 'Carrot',
    grade: 'Grade 1',
    quantity: '50 kg',
    originalPrice: '₹68.00',
    counterPrice: '₹69.00',
    offerRound: 'Offer 1 of 3',
    offeredDate: '12 Oct 2026, 11:00',
    deadline: '13 Oct 2026, 11:00',
    farmerName: 'Selvi',
    status: 'Accepted',
    recordedResponse: 'Accepted by Farmer',
    decisionRecorded: '13 Oct 2026, 08:30',
  },
  {
    id: 'CO-0003',
    listing: 'LST-2015',
    product: 'Cabbage',
    grade: 'Grade 2',
    quantity: '80 kg',
    originalPrice: '₹20.00',
    counterPrice: '₹23.00',
    offerRound: 'Offer 3 of 3',
    offeredDate: '10 Oct 2026, 10:00',
    deadline: '11 Oct 2026, 10:00',
    farmerName: 'Kumar Swamy',
    status: 'Rejected',
    recordedResponse: 'Declined final offer',
    decisionRecorded: '11 Oct 2026, 09:15',
  },
  {
    id: 'CO-0004',
    listing: 'LST-2020',
    product: 'Potato',
    grade: 'Grade 1',
    quantity: '100 kg',
    originalPrice: '₹28.00',
    counterPrice: '₹31.00',
    offerRound: 'Offer 1 of 3',
    offeredDate: '8 Oct 2026, 14:00',
    deadline: '9 Oct 2026, 14:00',
    farmerName: 'Murugan',
    status: 'Expired',
    recordedResponse: 'No response in 24h',
    decisionRecorded: '9 Oct 2026, 14:01',
  },
];

// Backward-compatible aliases
export type PriceHistoryRecord = PriceHistoryItem;
export const SAMPLE_PRICE_HISTORY = PRICE_HISTORY_FIXTURES;

// ─── Component Props ──────────────────────────────────────────────────────────

export interface PriceHistoryScreenProps {
  onBack: () => void;
  itemName?: string | undefined;
  category?: string | undefined;
  currentPrice?: number | undefined;
}

export function PriceHistoryScreen({ onBack }: PriceHistoryScreenProps) {
  // Navigation / Tab state
  const [activeTab, setActiveTab] = useState<'history' | 'counter_offers'>('history');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Selected details modal state
  const [selectedHistory, setSelectedHistory] = useState<PriceHistoryItem | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<CounterOfferItem | null>(null);

  // Filter popup modal state
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Filter states for History
  const [appliedHistStatus, setAppliedHistStatus] = useState<'All' | 'Valid' | 'Failed'>('All');
  const [draftHistStatus, setDraftHistStatus] = useState<'All' | 'Valid' | 'Failed'>('All');
  const [histStatusDropdownOpen, setHistStatusDropdownOpen] = useState(false);

  // Filter states for Counter-offers
  const [appliedOfferStatus, setAppliedOfferStatus] = useState<
    'All' | 'Pending' | 'Accepted' | 'Rejected' | 'Expired'
  >('All');
  const [draftOfferStatus, setDraftOfferStatus] = useState<
    'All' | 'Pending' | 'Accepted' | 'Rejected' | 'Expired'
  >('All');
  const [offerStatusDropdownOpen, setOfferStatusDropdownOpen] = useState(false);

  const openFilterModal = () => {
    setDraftHistStatus(appliedHistStatus);
    setDraftOfferStatus(appliedOfferStatus);
    setHistStatusDropdownOpen(false);
    setOfferStatusDropdownOpen(false);
    setFilterModalVisible(true);
  };

  const handleApplyFilter = () => {
    setAppliedHistStatus(draftHistStatus);
    setAppliedOfferStatus(draftOfferStatus);
    setFilterModalVisible(false);
  };

  const handleResetFilter = () => {
    if (activeTab === 'history') {
      setDraftHistStatus('All');
      setAppliedHistStatus('All');
    } else {
      setDraftOfferStatus('All');
      setAppliedOfferStatus('All');
    }
    setFilterModalVisible(false);
  };

  // Filtered History Records
  const filteredHistory = useMemo(() => {
    return PRICE_HISTORY_FIXTURES.filter((rec) => {
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matches =
          rec.product.toLowerCase().includes(q) ||
          rec.grade.toLowerCase().includes(q) ||
          rec.id.toLowerCase().includes(q) ||
          rec.changedBy.toLowerCase().includes(q) ||
          rec.auditRef.toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (appliedHistStatus !== 'All' && rec.status !== appliedHistStatus) {
        return false;
      }

      return true;
    });
  }, [searchQuery, appliedHistStatus]);

  // Filtered Counter-Offers
  const filteredOffers = useMemo(() => {
    return COUNTER_OFFER_FIXTURES.filter((off) => {
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matches =
          off.listing.toLowerCase().includes(q) ||
          off.product.toLowerCase().includes(q) ||
          off.farmerName.toLowerCase().includes(q) ||
          off.id.toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (appliedOfferStatus !== 'All' && off.status !== appliedOfferStatus) {
        return false;
      }

      return true;
    });
  }, [searchQuery, appliedOfferStatus]);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ── Orange Gradient Header Matching Image 1 ── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Price History & Counter-Offers
            </Text>
            <Text style={styles.headerSubtitle}>Traceable price changes</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Segmented Control Switch Matching Image 1 */}
        <View style={styles.segmentedContainer}>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeTab === 'history' && styles.segmentBtnActive,
            ]}
            onPress={() => setActiveTab('history')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentBtnText,
                activeTab === 'history' && styles.segmentBtnTextActive,
              ]}
            >
              History
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeTab === 'counter_offers' && styles.segmentBtnActive,
            ]}
            onPress={() => setActiveTab('counter_offers')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentBtnText,
                activeTab === 'counter_offers' && styles.segmentBtnTextActive,
              ]}
            >
              Counter-Offers
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar with Filter Sliders Icon */}
        <View style={styles.searchBarContainer}>
          <SearchIcon size={18} color={adminColors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder={
              activeTab === 'history'
                ? 'Search common or scientific name'
                : 'Search by offer, listing or product'
            }
            placeholderTextColor={adminColors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={styles.searchFilterBtn}
            onPress={openFilterModal}
            activeOpacity={0.7}
            accessibilityLabel="Open filters"
          >
            <HorizontalSlidersIcon size={18} color={adminColors.brand} />
          </TouchableOpacity>
        </View>

        {/* Dynamic Counter Subtitle */}
        <Text style={styles.recordCountText}>
          {activeTab === 'history'
            ? `${filteredHistory.length} history records${
                appliedHistStatus !== 'All' ? ` · ${appliedHistStatus}` : ''
              }`
            : `${filteredOffers.length} counter-offers${
                appliedOfferStatus !== 'All' ? ` · ${appliedOfferStatus}` : ''
              }`}
        </Text>

        {/* ── History Records List (Image 1 Left) ── */}
        {activeTab === 'history' &&
          filteredHistory.map((item) => {
            const isValid = item.status === 'Valid';

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.itemCard}
                onPress={() => setSelectedHistory(item)}
                activeOpacity={0.85}
              >
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle}>
                    {item.product} · {item.grade} · {item.priceType}
                  </Text>
                  <View
                    style={[
                      styles.badgePill,
                      isValid ? styles.badgeValid : styles.badgeFailed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        isValid ? styles.badgeValidText : styles.badgeFailedText,
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>

                {item.attemptNote ? (
                  <Text style={styles.cardSubtitle1}>{item.attemptNote}</Text>
                ) : (
                  <Text style={styles.cardSubtitle1}>
                    {item.previousValue} → {item.newValue} · effective {item.effectiveDate}
                  </Text>
                )}

                <Text style={styles.cardSubtitle2}>
                  {item.changedBy}
                  {item.changeReason ? ` · "${item.changeReason}"` : ''} · {item.auditRef}
                </Text>
              </TouchableOpacity>
            );
          })}

        {/* ── Counter-Offers List (Image 1 Right) ── */}
        {activeTab === 'counter_offers' &&
          filteredOffers.map((offer) => {
            const isPending = offer.status === 'Pending';
            const isAccepted = offer.status === 'Accepted';

            return (
              <TouchableOpacity
                key={offer.id}
                style={styles.itemCard}
                onPress={() => setSelectedOffer(offer)}
                activeOpacity={0.85}
              >
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle}>
                    {offer.listing} · {offer.product}
                  </Text>
                  <View
                    style={[
                      styles.badgePill,
                      isPending && styles.badgePending,
                      isAccepted && styles.badgeAccepted,
                      offer.status === 'Rejected' && styles.badgeRejected,
                      offer.status === 'Expired' && styles.badgeExpired,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        isPending && styles.badgePendingText,
                        isAccepted && styles.badgeAcceptedText,
                        offer.status === 'Rejected' && styles.badgeRejectedText,
                        offer.status === 'Expired' && styles.badgeExpiredText,
                      ]}
                    >
                      {offer.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.cardSubtitle1}>
                  Original {offer.originalPrice} → Counter {offer.counterPrice} · {offer.offerRound}
                </Text>
                <Text style={styles.cardSubtitle2}>
                  {offer.deadline ? `Deadline ${offer.deadline} · ` : ''}
                  {offer.farmerName}
                </Text>
              </TouchableOpacity>
            );
          })}

        <View style={{ height: 48 }} />
      </ScrollView>

      {/* ─── Price Change Details Bottom Sheet Modal (Image 2 Middle) ─── */}
      <Modal
        visible={selectedHistory !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedHistory(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedHistory(null)}
        >
          <Pressable style={styles.sheetContainer} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>
              Price change {selectedHistory?.id || 'PH-0034'}
            </Text>

            {/* Spec Card with Dotted Dividers */}
            <View style={styles.detailCard}>
              <View style={styles.specRow}>
                <Text style={styles.specKey}>Product and grade</Text>
                <Text style={styles.specValBold}>
                  {selectedHistory?.product} · {selectedHistory?.grade}
                </Text>
              </View>
              <View style={styles.dottedDivider} />

              <View style={styles.specRow}>
                <Text style={styles.specKey}>Price type</Text>
                <Text style={styles.specValBold}>{selectedHistory?.priceType}</Text>
              </View>
              <View style={styles.dottedDivider} />

              <View style={styles.specRow}>
                <Text style={styles.specKey}>Previous value</Text>
                <Text style={styles.specValBold}>{selectedHistory?.previousValue}</Text>
              </View>
              <View style={styles.dottedDivider} />

              <View style={styles.specRow}>
                <Text style={styles.specKey}>New value</Text>
                <Text style={styles.specValBold}>{selectedHistory?.newValue}</Text>
              </View>
              <View style={styles.dottedDivider} />

              <View style={styles.specRow}>
                <Text style={styles.specKey}>Change reason</Text>
                <Text style={styles.specValBold}>{selectedHistory?.changeReason}</Text>
              </View>
              <View style={styles.dottedDivider} />

              <View style={styles.specRow}>
                <Text style={styles.specKey}>Changed by</Text>
                <Text style={styles.specValBold}>{selectedHistory?.changedBy}</Text>
              </View>
              <View style={styles.dottedDivider} />

              <View style={styles.specRow}>
                <Text style={styles.specKey}>Recorded</Text>
                <Text style={styles.specValBold}>{selectedHistory?.recorded}</Text>
              </View>
              <View style={styles.dottedDivider} />

              <View style={styles.specRow}>
                <Text style={styles.specKey}>Effective date</Text>
                <Text style={styles.specValBold}>{selectedHistory?.effectiveDate}</Text>
              </View>
              <View style={styles.dottedDivider} />

              <View style={styles.specRow}>
                <Text style={styles.specKey}>Status</Text>
                <Text style={styles.specValBold}>{selectedHistory?.status}</Text>
              </View>
              <View style={styles.dottedDivider} />

              <View style={styles.specRow}>
                <Text style={styles.specKey}>Validation</Text>
                <Text
                  style={[
                    styles.specValBold,
                    { flex: 1, textAlign: 'right', marginLeft: 16 },
                  ]}
                  numberOfLines={2}
                >
                  {selectedHistory?.validation}
                </Text>
              </View>
              <View style={styles.dottedDivider} />

              <View style={styles.specRow}>
                <Text style={styles.specKey}>Audit-log reference</Text>
                <Text style={styles.specValBold}>{selectedHistory?.auditRef}</Text>
              </View>
            </View>

            {/* Lock Pill Notice */}
            <View style={styles.lockNoticePill}>
              <LockIcon size={15} color={adminColors.brandDeep} />
              <Text style={styles.lockNoticeText}>
                This record cannot be edited or deleted.
              </Text>
            </View>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.sheetCloseBtn}
              onPress={() => setSelectedHistory(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.sheetCloseText}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ─── Counter-Offer Details Bottom Sheet Modal (Image 2 Right) ─── */}
      <Modal
        visible={selectedOffer !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedOffer(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedOffer(null)}
        >
          <Pressable style={styles.sheetContainer} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>
              Counter-offer {selectedOffer?.id || 'CO-0001'}
            </Text>

            {/* Spec Card with Dotted Dividers */}
            <View style={styles.detailCard}>
              <View style={styles.specRow}>
                <Text style={styles.specKey}>Listing</Text>
                <Text style={styles.specValBold}>{selectedOffer?.listing}</Text>
              </View>
              <View style={styles.dottedDivider} />

              <View style={styles.specRow}>
                <Text style={styles.specKey}>Product and grade</Text>
                <Text style={styles.specValBold}>
                  {selectedOffer?.product} · {selectedOffer?.grade}
                </Text>
              </View>
              <View style={styles.dottedDivider} />

              <View style={styles.specRow}>
                <Text style={styles.specKey}>Quantity</Text>
                <Text style={styles.specValBold}>{selectedOffer?.quantity}</Text>
              </View>
              <View style={styles.dottedDivider} />

              <View style={styles.specRow}>
                <Text style={styles.specKey}>Original listing price</Text>
                <Text style={styles.specValBold}>{selectedOffer?.originalPrice}/kg</Text>
              </View>
              <View style={styles.dottedDivider} />

              <View style={styles.specRow}>
                <Text style={styles.specKey}>Counter-offer price</Text>
                <Text style={styles.specValBold}>{selectedOffer?.counterPrice}/kg</Text>
              </View>
              <View style={styles.dottedDivider} />

              <View style={styles.specRow}>
                <Text style={styles.specKey}>Counter-offer</Text>
                <Text style={styles.specValBold}>{selectedOffer?.offerRound}</Text>
              </View>
              <View style={styles.dottedDivider} />

              <View style={styles.specRow}>
                <Text style={styles.specKey}>Offered</Text>
                <Text style={styles.specValBold}>{selectedOffer?.offeredDate}</Text>
              </View>
              <View style={styles.dottedDivider} />

              <View style={styles.specRow}>
                <Text style={styles.specKey}>Response deadline</Text>
                <Text style={styles.specValBold}>{selectedOffer?.deadline}</Text>
              </View>
              <View style={styles.dottedDivider} />

              <View style={styles.specRow}>
                <Text style={styles.specKey}>Current status</Text>
                <Text style={styles.specValBold}>{selectedOffer?.status}</Text>
              </View>
              <View style={styles.dottedDivider} />

              <View style={styles.specRow}>
                <Text style={styles.specKey}>Recorded response</Text>
                <Text style={styles.specValBold}>{selectedOffer?.recordedResponse}</Text>
              </View>
              <View style={styles.dottedDivider} />

              <View style={styles.specRow}>
                <Text style={styles.specKey}>Decision recorded</Text>
                <Text style={styles.specValBold}>{selectedOffer?.decisionRecorded}</Text>
              </View>
            </View>

            {/* Lock Pill Notice */}
            <View style={styles.lockNoticePill}>
              <LockIcon size={15} color={adminColors.brandDeep} />
              <Text style={styles.lockNoticeText}>
                This record cannot be edited or deleted.
              </Text>
            </View>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.sheetCloseBtn}
              onPress={() => setSelectedOffer(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.sheetCloseText}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ─── Filters Bottom Sheet Modal ─── */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setFilterModalVisible(false)}
        >
          <Pressable style={styles.filterSheetContainer} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.filterSheetHeading}>Filters</Text>

            {activeTab === 'history' ? (
              <>
                <Text style={styles.filterFieldLabel}>Status</Text>
                <TouchableOpacity
                  style={styles.dropdownBox}
                  onPress={() => setHistStatusDropdownOpen(!histStatusDropdownOpen)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownSelectedText}>{draftHistStatus}</Text>
                  <ChevronDownIcon size={18} color={adminColors.ink} />
                </TouchableOpacity>

                {histStatusDropdownOpen && (
                  <View style={styles.dropdownMenu}>
                    {(['All', 'Valid', 'Failed'] as const).map((opt) => {
                      const isSelected = draftHistStatus === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[styles.dropdownOption, isSelected && styles.dropdownOptionSelected]}
                          onPress={() => {
                            setDraftHistStatus(opt);
                            setHistStatusDropdownOpen(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.dropdownOptionText,
                              isSelected && styles.dropdownOptionTextSelected,
                            ]}
                          >
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </>
            ) : (
              <>
                <Text style={styles.filterFieldLabel}>Status</Text>
                <TouchableOpacity
                  style={styles.dropdownBox}
                  onPress={() => setOfferStatusDropdownOpen(!offerStatusDropdownOpen)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownSelectedText}>{draftOfferStatus}</Text>
                  <ChevronDownIcon size={18} color={adminColors.ink} />
                </TouchableOpacity>

                {offerStatusDropdownOpen && (
                  <View style={styles.dropdownMenu}>
                    {(['All', 'Pending', 'Accepted', 'Rejected', 'Expired'] as const).map((opt) => {
                      const isSelected = draftOfferStatus === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[styles.dropdownOption, isSelected && styles.dropdownOptionSelected]}
                          onPress={() => {
                            setDraftOfferStatus(opt);
                            setOfferStatusDropdownOpen(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.dropdownOptionText,
                              isSelected && styles.dropdownOptionTextSelected,
                            ]}
                          >
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </>
            )}

            {/* Filter Action Buttons */}
            <View style={styles.filterActionsRow}>
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={handleApplyFilter}
                activeOpacity={0.8}
              >
                <Text style={styles.applyBtnText}>Apply</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resetBtn}
                onPress={handleResetFilter}
                activeOpacity={0.8}
              >
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles strictly conforming to adminTheme ────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.md,
    paddingHorizontal: adminSpacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: adminSpacing.xs,
    marginRight: adminSpacing.sm,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '800',
  },
  headerSubtitle: {
    ...adminType.caption,
    color: adminColors.onBrand,
    opacity: 0.9,
    fontSize: 12,
    marginTop: 2,
  },

  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
  },

  noticeCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  noticeText: {
    ...adminType.body,
    fontSize: 12.5,
    lineHeight: 18,
    color: adminColors.muted,
  },

  // Segmented Switch
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: adminRadius.md,
  },
  segmentBtnActive: {
    backgroundColor: adminColors.brand,
  },
  segmentBtnText: {
    ...adminType.rowTitle,
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
  },
  segmentBtnTextActive: {
    color: adminColors.onBrand,
  },

  // Search Bar
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  searchInput: {
    flex: 1,
    marginHorizontal: adminSpacing.sm,
    ...adminType.body,
    fontSize: 13.5,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  searchFilterBtn: {
    padding: 4,
  },

  recordCountText: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
    marginBottom: adminSpacing.sm,
  },

  // Cards
  itemCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    ...adminType.rowTitle,
    fontSize: 14.5,
    fontWeight: '800',
    color: adminColors.ink,
    flex: 1,
    marginRight: 8,
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: adminRadius.full,
  },
  badgeText: {
    ...adminType.caption,
    fontSize: 11,
    fontWeight: '700',
  },
  badgeValid: {
    backgroundColor: adminColors.success.bg,
  },
  badgeValidText: {
    color: adminColors.success.text,
  },
  badgeFailed: {
    backgroundColor: adminColors.danger.bg,
  },
  badgeFailedText: {
    color: adminColors.danger.text,
  },
  badgePending: {
    backgroundColor: adminColors.warning.bg,
  },
  badgePendingText: {
    color: adminColors.warning.text,
  },
  badgeAccepted: {
    backgroundColor: adminColors.success.bg,
  },
  badgeAcceptedText: {
    color: adminColors.success.text,
  },
  badgeRejected: {
    backgroundColor: adminColors.danger.bg,
  },
  badgeRejectedText: {
    color: adminColors.danger.text,
  },
  badgeExpired: {
    backgroundColor: adminColors.border,
  },
  badgeExpiredText: {
    color: adminColors.muted,
  },

  cardSubtitle1: {
    ...adminType.body,
    fontSize: 12,
    color: adminColors.muted,
    marginTop: 2,
  },
  cardSubtitle2: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    marginTop: 2,
  },

  // Bottom Sheet Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: adminSpacing.lg,
    maxHeight: '90%',
  },
  sheetTitle: {
    ...adminType.title,
    fontSize: 19,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: adminSpacing.md,
  },
  detailCard: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.lg,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  specKey: {
    ...adminType.body,
    fontSize: 12.5,
    color: adminColors.muted,
  },
  specValBold: {
    ...adminType.body,
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.ink,
  },
  dottedDivider: {
    height: 1,
    borderWidth: 0.5,
    borderColor: adminColors.border,
    borderStyle: 'dashed',
    marginVertical: 2,
  },
  lockNoticePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.md,
    paddingVertical: 9,
    paddingHorizontal: adminSpacing.md,
    gap: 8,
    marginBottom: adminSpacing.md,
  },
  lockNoticeText: {
    ...adminType.caption,
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },
  sheetCloseBtn: {
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  sheetCloseText: {
    ...adminType.rowTitle,
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
  },

  // Filter Sheet Modal
  filterSheetContainer: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
  },
  filterSheetHeading: {
    ...adminType.title,
    fontSize: 18,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: adminSpacing.md,
  },
  filterFieldLabel: {
    ...adminType.rowTitle,
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
    marginTop: 10,
    marginBottom: 6,
  },
  dropdownBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 12,
  },
  dropdownSelectedText: {
    ...adminType.body,
    fontSize: 13.5,
    color: adminColors.ink,
  },
  dropdownMenu: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    marginTop: 4,
    overflow: 'hidden',
    ...adminShadow.sm,
  },
  dropdownOption: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 11,
    backgroundColor: adminColors.card,
  },
  dropdownOptionSelected: {
    backgroundColor: adminColors.muted,
  },
  dropdownOptionText: {
    ...adminType.body,
    fontSize: 13.5,
    color: adminColors.ink,
  },
  dropdownOptionTextSelected: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  filterActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 22,
    gap: adminSpacing.md,
  },
  applyBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.full,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: adminColors.card,
  },
  applyBtnText: {
    ...adminType.rowTitle,
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },
  resetBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.full,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: adminColors.card,
  },
  resetBtnText: {
    ...adminType.rowTitle,
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
  },
});
