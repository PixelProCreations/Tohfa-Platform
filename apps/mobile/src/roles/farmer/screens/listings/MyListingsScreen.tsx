import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  StatusBar,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { authPalette as P, colors } from '../../theme';

// SVG Icons
const BackArrowIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 12H5M5 12L12 19M5 12L12 5"
      stroke={colors.brandGreen}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const FilterIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 6H20M6 12H18M9 18H15"
      stroke={P.slate600}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ChevronDownIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 9L12 15L18 9"
      stroke={P.slate500}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ClockIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={P.twOrange600} strokeWidth="2" />
    <Path d="M12 7V12L15.5 14" stroke={P.twOrange600} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CashIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="6" width="20" height="12" rx="2" stroke={colors.brandGreen} strokeWidth="2" />
    <Circle cx="12" cy="12" r="2.5" stroke={colors.brandGreen} strokeWidth="2" />
    <Path d="M5.5 9.5H5.51M18.5 14.5H18.51" stroke={colors.brandGreen} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const PlusIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M12 5V19M5 12H19" stroke={colors.white} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export type ListingStatus = 'Counter-offer' | 'Waiting' | 'Approved' | 'Rejected' | 'Withdrawn';

export interface MyListingItem {
  id: string;
  listingNumber: string;
  title: string;
  cropName: string;
  cropVariety: string;
  grade: string;
  quantityKg: string;
  askingPricePerKg: string;
  date: string;
  status: ListingStatus;
  statusBadgeBg: string;
  statusBadgeText: string;
  hasLeftPurpleBorder?: boolean;
  alertBanner?: {
    type: 'counter_offer' | 'paid';
    icon: 'clock' | 'cash';
    text: string;
  };
}

const MY_LISTINGS_DATA: MyListingItem[] = [
  {
    id: '1',
    listingNumber: 'L-9821',
    title: 'Carrot · Ooty',
    cropName: 'Carrot',
    cropVariety: 'Ooty',
    grade: 'Grade 1',
    quantityKg: '150',
    askingPricePerKg: '40',
    date: '14 Jul',
    status: 'Counter-offer',
    statusBadgeBg: '#F3E8FF',
    statusBadgeText: '#7C3AED',
    hasLeftPurpleBorder: true,
    alertBanner: {
      type: 'counter_offer',
      icon: 'clock',
      text: 'Your reply needed · 22h 30m left',
    },
  },
  {
    id: '2',
    listingNumber: 'L-9822',
    title: 'French Beans',
    cropName: 'French Beans',
    cropVariety: 'Ooty Gold',
    grade: 'Grade 2',
    quantityKg: '80',
    askingPricePerKg: '55',
    date: '16 Jul',
    status: 'Waiting',
    statusBadgeBg: '#FEF3C7',
    statusBadgeText: '#B45309',
  },
  {
    id: '3',
    listingNumber: 'L-9820',
    title: 'Tomato · Hybrid',
    cropName: 'Tomato',
    cropVariety: 'Hybrid',
    grade: 'Grade 1',
    quantityKg: '200',
    askingPricePerKg: '38',
    date: '09 Jul',
    status: 'Approved',
    statusBadgeBg: '#DCFCE7',
    statusBadgeText: '#15803D',
    alertBanner: {
      type: 'paid',
      icon: 'cash',
      text: 'Paid · ₹6,840 net',
    },
  },
  {
    id: '4',
    listingNumber: 'L-9824',
    title: 'Cabbage',
    cropName: 'Cabbage',
    cropVariety: 'Drumhead',
    grade: 'Grade 2',
    quantityKg: '120',
    askingPricePerKg: '18',
    date: '02 Jul',
    status: 'Rejected',
    statusBadgeBg: '#FEE2E2',
    statusBadgeText: '#B91C1C',
  },
  {
    id: '5',
    listingNumber: 'L-9826',
    title: 'Potato · Kufri',
    cropName: 'Potato',
    cropVariety: 'Kufri',
    grade: 'Grade 1',
    quantityKg: '300',
    askingPricePerKg: '22',
    date: '28 Jun',
    status: 'Withdrawn',
    statusBadgeBg: '#F3F4F6',
    statusBadgeText: '#4B5563',
  },
];

const STATUS_FILTER_OPTIONS: { label: string; value: string }[] = [
  { label: 'All statuses', value: 'All' },
  { label: 'Counter-offer', value: 'Counter-offer' },
  { label: 'Waiting', value: 'Waiting' },
  { label: 'Approved', value: 'Approved' },
  { label: 'Rejected', value: 'Rejected' },
  { label: 'Withdrawn', value: 'Withdrawn' },
];

export interface MyListingsScreenProps {
  onNavigateBack: () => void;
  onNavigateToListingDetail?: (item: any) => void;
  onNavigateToCounterOffer?: (item: any) => void;
  onNavigateToCreateListing?: () => void;
  title?: string;
  subtitle?: string;
}

export function MyListingsScreen({
  onNavigateBack,
  onNavigateToListingDetail,
  onNavigateToCounterOffer,
  onNavigateToCreateListing,
  title = 'My Listings',
  subtitle,
}: MyListingsScreenProps): React.JSX.Element {
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [filterModalVisible, setFilterModalVisible] = useState<boolean>(false);

  const filteredListings = MY_LISTINGS_DATA.filter((item) => {
    if (selectedFilter === 'All') return true;
    return item.status === selectedFilter;
  });

  const selectedFilterLabel =
    STATUS_FILTER_OPTIONS.find((opt) => opt.value === selectedFilter)?.label || 'All statuses';

  const handleCardPress = (item: MyListingItem) => {
    if (item.status === 'Counter-offer' && onNavigateToCounterOffer) {
      onNavigateToCounterOffer({
        id: item.id,
        listingNumber: item.listingNumber,
        cropName: `${item.cropName} - ${item.cropVariety} - ${item.grade}`,
        quantityKg: item.quantityKg,
        askingPricePerKg: item.askingPricePerKg,
        ceilingPricePerKg: '45',
        status: 'COUNTER_OFFER',
        grade: item.grade,
      });
    } else if (onNavigateToListingDetail) {
      onNavigateToListingDetail({
        id: item.id,
        listingNumber: item.listingNumber,
        cropName: `${item.cropName} - ${item.cropVariety}`,
        quantityKg: item.quantityKg,
        askingPricePerKg: item.askingPricePerKg,
        ceilingPricePerKg: item.askingPricePerKg,
        status: item.status,
        grade: item.grade,
      });
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onNavigateBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <BackArrowIcon />
          </TouchableOpacity>
          <View style={styles.headerTextCol}>
            <Text style={styles.headerTitle}>{title}</Text>
            <Text style={styles.headerSub}>
              {subtitle || `${MY_LISTINGS_DATA.length} listings · all time`}
            </Text>
          </View>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.mainContainer}>
        {/* Status Dropdown Filter Selector */}
        <TouchableOpacity
          style={styles.filterDropdown}
          activeOpacity={0.8}
          onPress={() => setFilterModalVisible(true)}
        >
          <View style={styles.filterLeft}>
            <FilterIcon />
            <Text style={styles.filterText}>{selectedFilterLabel}</Text>
          </View>
          <ChevronDownIcon />
        </TouchableOpacity>

        {/* Listings Scroll List */}
        <ScrollView
          style={styles.scrollList}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredListings.map((item) => {
            const isCounterOffer = item.status === 'Counter-offer';

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.card,
                  isCounterOffer && styles.cardCounterOfferBorder,
                ]}
                activeOpacity={0.85}
                onPress={() => handleCardPress(item)}
              >
                {/* Top Row: Title + Status Badge */}
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cropTitle}>{item.title}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: item.statusBadgeBg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        { color: item.statusBadgeText },
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>

                {/* Subtitle Row: Grade · Weight · Price · Date */}
                <Text style={styles.cropSubtitle}>
                  {item.grade} · {item.quantityKg} kg · ₹{item.askingPricePerKg}/kg · {item.date}
                </Text>

                {/* Banner Box (Counter Offer Alert / Paid Info) */}
                {item.alertBanner?.type === 'counter_offer' && (
                  <View style={styles.alertBanner}>
                    <ClockIcon />
                    <Text style={styles.alertBannerText}>
                      {item.alertBanner.text}
                    </Text>
                  </View>
                )}

                {item.alertBanner?.type === 'paid' && (
                  <View style={styles.paidBanner}>
                    <CashIcon />
                    <Text style={styles.paidBannerText}>
                      {item.alertBanner.text}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          {/* Bottom spacing for floating button */}
          <View style={{ height: 90 }} />
        </ScrollView>
      </View>

      {/* Floating Create Listing Button (Bottom Right) */}
      <View style={styles.floatingButtonContainer} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.createListingBtn}
          activeOpacity={0.85}
          onPress={onNavigateToCreateListing}
        >
          <PlusIcon />
          <Text style={styles.createListingBtnText}>Create listing</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Selection Modal */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setFilterModalVisible(false)}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalHeaderTitle}>Filter by Status</Text>
            {STATUS_FILTER_OPTIONS.map((opt) => {
              const isSelected = selectedFilter === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.modalOption,
                    isSelected && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedFilter(opt.value);
                    setFilterModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      isSelected && styles.modalOptionTextSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {isSelected && (
                    <View style={styles.selectedDot} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAFBF9',
  },
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2EE',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  headerTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '400',
  },
  mainContainer: {
    flex: 1,
  },
  filterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  scrollList: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardCounterOfferBorder: {
    borderLeftWidth: 4,
    borderLeftColor: '#7C3AED',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cropTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cropSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '400',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
    gap: 8,
  },
  alertBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9A3412',
    flex: 1,
  },
  paidBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
    gap: 8,
  },
  paidBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
    flex: 1,
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    zIndex: 99,
  },
  createListingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E7E34',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  createListingBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  modalOptionSelected: {
    backgroundColor: '#F0FDF4',
  },
  modalOptionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  modalOptionTextSelected: {
    color: '#166534',
    fontWeight: '700',
  },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#166534',
  },
});
