import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

interface M5S03Props {
  onNavigate: (screen: string, params?: any) => void;
  onBack: () => void;
}

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowWhiteIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SearchIconGrey() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke="#7A726C" strokeWidth="2" />
      <Path d="M16 16l4.5 4.5" stroke="#7A726C" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function FlagIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7" stroke="#1D2420" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TruckIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M1 3h14v13H1zM15 8h4l3 3v5h-7V8z" stroke="#1D2420" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="5.5" cy="18.5" r="2.5" stroke="#1D2420" strokeWidth="1.8" />
      <Circle cx="18.5" cy="18.5" r="2.5" stroke="#1D2420" strokeWidth="1.8" />
    </Svg>
  );
}

function StoreChannelIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l1-6h16l1 6M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M4 12v9h16v-9" stroke="#1D2420" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CalendarDateIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="3" stroke="#1D2420" strokeWidth="1.8" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke="#1D2420" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function PaymentCashIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="2" stroke="#1D2420" strokeWidth="1.8" />
      <Circle cx="12" cy="12" r="3" stroke="#1D2420" strokeWidth="1.8" />
      <Path d="M6 12h.01M18 12h.01" stroke="#1D2420" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function LockNoticeIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z" stroke="#9A3412" strokeWidth="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#9A3412" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function InfoCircleBlueIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#1C5B96" strokeWidth="1.8" />
      <Path d="M12 16v-4M12 8h.01" stroke="#1C5B96" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function FilterFunnelWhiteIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export const M5S03_SearchFilters: React.FC<M5S03Props> = ({ onNavigate, onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedFulfillment, setSelectedFulfillment] = useState('Pickup');
  const [selectedChannel, setSelectedChannel] = useState('Online');
  const [selectedDate, setSelectedDate] = useState('Today');
  const [selectedPayment, setSelectedPayment] = useState('All');

  const statusOptions = ['All', 'Confirmed', 'Packed', 'Ready for Pickup', 'Picked Up', 'Completed'];
  const fulfillmentOptions = ['Pickup', 'Delivery'];
  const channelOptions = ['Online', 'Live Market', 'HORECA', 'B2B'];
  const dateOptions = ['Today', 'Yesterday', 'Last 7 Days', 'Custom'];
  const paymentOptions = ['All', 'Paid', 'Pending', 'Failed'];

  const handleClearAll = () => {
    setSearchQuery('');
    setSelectedStatus('All');
    setSelectedFulfillment('Pickup');
    setSelectedChannel('Online');
    setSelectedDate('Today');
    setSelectedPayment('All');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header matching Left Reference */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.7}
              onPress={onBack}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <BackArrowWhiteIcon />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Order Filters</Text>
          </View>

          <TouchableOpacity activeOpacity={0.7} onPress={handleClearAll}>
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Search Input Box */}
          <View style={styles.searchBox}>
            <SearchIconGrey />
            <TextInput
              style={styles.searchInput}
              placeholder="Order ID, customer or phone"
              placeholderTextColor="#7A726C"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Section 1: Status */}
          <View style={styles.sectionHeaderRow}>
            <FlagIcon />
            <Text style={styles.sectionTitle}>Status</Text>
          </View>
          <View style={styles.pillsWrap}>
            {statusOptions.map((opt) => {
              const isSelected = selectedStatus === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.pillBtn, isSelected && styles.pillBtnSelected]}
                  activeOpacity={0.75}
                  onPress={() => setSelectedStatus(opt)}
                >
                  <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Section 2: Fulfillment */}
          <View style={styles.sectionHeaderRow}>
            <TruckIcon />
            <Text style={styles.sectionTitle}>Fulfillment</Text>
          </View>
          <View style={styles.pillsWrap}>
            {fulfillmentOptions.map((opt) => {
              const isSelected = selectedFulfillment === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.pillBtn, isSelected && styles.pillBtnSelected]}
                  activeOpacity={0.75}
                  onPress={() => setSelectedFulfillment(opt)}
                >
                  <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Section 3: Channel */}
          <View style={styles.sectionHeaderRow}>
            <StoreChannelIcon />
            <Text style={styles.sectionTitle}>Channel</Text>
          </View>
          <View style={styles.pillsWrap}>
            {channelOptions.map((opt) => {
              const isSelected = selectedChannel === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.pillBtn, isSelected && styles.pillBtnSelected]}
                  activeOpacity={0.75}
                  onPress={() => setSelectedChannel(opt)}
                >
                  <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Section 4: Date */}
          <View style={styles.sectionHeaderRow}>
            <CalendarDateIcon />
            <Text style={styles.sectionTitle}>Date</Text>
          </View>
          <View style={styles.pillsWrap}>
            {dateOptions.map((opt) => {
              const isSelected = selectedDate === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.pillBtn, isSelected && styles.pillBtnSelected]}
                  activeOpacity={0.75}
                  onPress={() => setSelectedDate(opt)}
                >
                  <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Section 5: Payment */}
          <View style={styles.sectionHeaderRow}>
            <PaymentCashIcon />
            <Text style={styles.sectionTitle}>Payment</Text>
          </View>
          <View style={styles.pillsWrap}>
            {paymentOptions.map((opt) => {
              const isSelected = selectedPayment === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.pillBtn, isSelected && styles.pillBtnSelected]}
                  activeOpacity={0.75}
                  onPress={() => setSelectedPayment(opt)}
                >
                  <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Notice Box 1: Warehouse Scoped */}
          <View style={styles.warehouseNoticeBox}>
            <LockNoticeIcon />
            <Text style={styles.warehouseNoticeText}>
              No warehouse selector — results always scoped to Coonoor Warehouse.
            </Text>
          </View>

          {/* Notice Box 2: Direct Customer Purchase */}
          <View style={styles.directPurchaseNoticeBox}>
            <InfoCircleBlueIcon />
            <Text style={styles.directPurchaseNoticeText}>
              Direct Customer Purchase has its own workflow in Module 6 and isn't filtered here.
            </Text>
          </View>

          <View style={{ height: 28 }} />
        </ScrollView>

        {/* Fixed Apply Filters Button at Bottom */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.applyBtn}
            activeOpacity={0.8}
            onPress={() => onNavigate('M5S02', { status: selectedStatus })}
          >
            <FilterFunnelWhiteIcon />
            <Text style={styles.applyBtnText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  container: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  header: {
    backgroundColor: '#E85226',
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },
  clearAllText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
    textDecorationLine: 'underline',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  searchBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EAE6DF',
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1D2420',
    fontFamily: 'Poppins',
    paddingVertical: 0,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  pillBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  pillBtnSelected: {
    backgroundColor: '#FFF7ED',
    borderColor: '#E85226',
    borderWidth: 1.5,
  },
  pillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  pillTextSelected: {
    color: '#E85226',
    fontWeight: '700',
  },
  warehouseNoticeBox: {
    backgroundColor: '#FFF7ED',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#FDBA74',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
    marginTop: 6,
  },
  warehouseNoticeText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#9A3412',
    fontFamily: 'Poppins',
    lineHeight: 17,
  },
  directPurchaseNoticeBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#BFDBFE',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  directPurchaseNoticeText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
    fontFamily: 'Poppins',
    lineHeight: 17,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: '#F4F1EA',
  },
  applyBtn: {
    backgroundColor: '#E85226',
    borderRadius: 14,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#E85226',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
    fontFamily: 'Poppins',
  },
});
