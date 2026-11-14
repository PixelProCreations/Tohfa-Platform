import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Animated,
  Easing,
  StatusBar,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import {
  customerColors,
  customerFonts,
  customerShadow,
  customerSpacing,
} from '../theme';
import { CustomerDeliveryAddressModal, AddressData } from '../components';
import satelliteMapCoimbatore from '../assets/images/satellite_map_coimbatore.jpg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CustomerAddAddressScreenProps {
  initialSource?: 'current' | 'manual' | undefined;
  onNavigate: (screen: 'CustomerLoadingMarket' | 'CustomerPermissions' | 'CustomerMain') => void;
}

// ── SVG ICONS ───────────────────────────────────────────────────────────────

const BackArrowIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 12H5M12 19l-7-7 7-7"
      stroke="#1F2937"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SearchIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35"
      stroke="#9CA3AF"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CrosshairTargetIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={7} stroke="#2E7D32" strokeWidth={2} />
    <Path
      d="M12 2v3M12 19v3M2 12h3M19 12h3"
      stroke="#2E7D32"
      strokeWidth={2}
      strokeLinecap="round"
    />
    <Circle cx={12} cy={12} r={2.5} fill="#2E7D32" />
  </Svg>
);

const RedMapPin = () => (
  <Svg width={36} height={44} viewBox="0 0 24 30" fill="none">
    <Path
      d="M12 0C5.37 0 0 5.37 0 12c0 9 12 18 12 18s12-9 12-18c0-6.63-5.37-12-12-12z"
      fill="#EF4444"
    />
    <Circle cx={12} cy={11} r={4.5} fill="#FFFFFF" />
  </Svg>
);

const GreenPinIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7z"
      stroke="#2E7D32"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={12} cy={9} r={2.5} fill="#2E7D32" />
  </Svg>
);

export const CustomerAddAddressScreen: React.FC<CustomerAddAddressScreenProps> = ({
  initialSource = 'current',
  onNavigate,
}) => {
  const [isFetchingLocation, setIsFetchingLocation] = useState(initialSource === 'current');
  const [searchQuery, setSearchQuery] = useState('');

  // Spinning animation for the "Fetching your location" loader
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isFetchingLocation) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1100,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      const timer = setTimeout(() => {
        setIsFetchingLocation(false);
      }, 1400);

      return () => clearTimeout(timer);
    }
  }, [isFetchingLocation]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const [showAddressModal, setShowAddressModal] = useState(false);

  const handleUseCurrentLocation = () => {
    setIsFetchingLocation(true);
  };

  const handleAddAddressDetails = () => {
    setShowAddressModal(true);
  };

  const handleSaveAddress = (_address: AddressData) => {
    setShowAddressModal(false);
    onNavigate('CustomerLoadingMarket');
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />

      {/* ── TOP HEADER BAR: ← Add Address ──────────────────────────────────── */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onNavigate('CustomerPermissions')}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <BackArrowIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Address</Text>
      </View>

      {/* ── MAP CONTAINER WITH SATELLITE IMAGE & CENTER RED PIN ────────────── */}
      <View style={styles.mapContainer}>
        <Image
          source={satelliteMapCoimbatore}
          style={styles.mapImage}
          resizeMode="cover"
        />

        {/* Center Red Location Pin with subtle shadow */}
        <View style={styles.centerPinWrap} pointerEvents="none">
          <RedMapPin />
          <View style={styles.pinShadow} />
        </View>

        {/* Floating Search Bar (Enter location manually) */}
        <View style={styles.searchBarWrap}>
          <SearchIcon />
          <TextInput
            style={styles.searchInput}
            placeholder="Enter location manually"
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Floating "Use current location" Pill Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleUseCurrentLocation}
          style={[styles.useCurrentLocButton, customerShadow.raised]}
          accessibilityRole="button"
          accessibilityLabel="Use current location"
        >
          <CrosshairTargetIcon />
          <Text style={styles.useCurrentLocText}>Use current location</Text>
        </TouchableOpacity>
      </View>

      {/* ── BOTTOM SHEET CARD (DELIVERING YOUR ORDER TO: Coimbatore) ───────── */}
      <View style={[styles.bottomSheet, customerShadow.raised]}>
        <Text style={styles.deliveringLabel}>DELIVERING YOUR ORDER TO</Text>

        <View style={styles.locationDetailRow}>
          <View style={styles.locationPinBadge}>
            <GreenPinIcon />
          </View>
          <View style={styles.addressTextWrap}>
            <Text style={styles.cityName}>Coimbatore</Text>
            <Text style={styles.addressLine}>
              110, Rajeshwari Nager, Coimbatore, Tamil Nadu
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleAddAddressDetails}
          style={styles.submitButton}
          accessibilityRole="button"
          accessibilityLabel="Add address details"
        >
          <Text style={styles.submitButtonText}>Add address details</Text>
        </TouchableOpacity>
      </View>

      {/* ── FETCHING YOUR LOCATION BUFFER MODAL (EXACT FIGMA PARITY) ───────── */}
      <Modal visible={isFetchingLocation} transparent={true} animationType="fade">
        <View style={styles.bufferBackdrop}>
          <View style={styles.bufferCard}>
            {/* Dotted green circle loader */}
            <View style={styles.spinnerContainer}>
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Svg width={46} height={46} viewBox="0 0 50 50">
                  <Circle
                    cx="25"
                    cy="25"
                    r="20"
                    stroke="#E5E7EB"
                    strokeWidth="3.5"
                    fill="none"
                  />
                  <Circle
                    cx="25"
                    cy="25"
                    r="20"
                    stroke="#2E7D32"
                    strokeWidth="3.5"
                    strokeDasharray="30 80"
                    strokeLinecap="round"
                    fill="none"
                  />
                </Svg>
              </Animated.View>
            </View>

            <Text style={styles.bufferTitle}>Fetching your location</Text>
            <Text style={styles.bufferSubtitle}>
              Looking for your exact address on the map to make sure your order reaches the right place
            </Text>
          </View>
        </View>
      </Modal>

      {/* ── ADD ADDRESS FORM POPUP MODAL ──────────────────────────────────── */}
      <CustomerDeliveryAddressModal
        visible={showAddressModal}
        initialStep="addAddress"
        onClose={() => setShowAddressModal(false)}
        onSaveAddress={handleSaveAddress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: customerSpacing[20],
    paddingTop: Platform.OS === 'android' ? 24 : 16,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    zIndex: 10,
  },
  backButton: {
    padding: 6,
    marginRight: 12,
  },
  headerTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 22,
    color: '#1F2937',
    fontWeight: '700',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#E5E7EB',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  centerPinWrap: {
    position: 'absolute',
    top: '46%',
    left: '50%',
    marginLeft: -18,
    marginTop: -38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinShadow: {
    width: 14,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(0,0,0,0.3)',
    marginTop: -2,
  },
  searchBarWrap: {
    position: 'absolute',
    top: 16,
    left: 20,
    right: 20,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 5,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontFamily: customerFonts.regular,
    fontSize: 14,
    color: '#1F2937',
  },
  useCurrentLocButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 5,
  },
  useCurrentLocText: {
    fontFamily: customerFonts.semibold,
    fontSize: 13,
    color: '#15803D',
    marginLeft: 8,
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  deliveringLabel: {
    fontFamily: customerFonts.bold,
    fontSize: 11,
    color: '#6B7280',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  locationDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  locationPinBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addressTextWrap: {
    flex: 1,
  },
  cityName: {
    fontFamily: customerFonts.editorial,
    fontSize: 19,
    color: '#1F2937',
    fontWeight: '700',
    marginBottom: 3,
  },
  addressLine: {
    fontFamily: customerFonts.regular,
    fontSize: 12.5,
    lineHeight: 18,
    color: '#6B7280',
  },
  submitButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: customerColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontFamily: customerFonts.bold,
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // Buffer modal
  bufferBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  bufferCard: {
    width: 300,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  spinnerContainer: {
    marginBottom: 16,
  },
  bufferTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 21,
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  bufferSubtitle: {
    fontFamily: customerFonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: '#6B7280',
    textAlign: 'center',
  },
});

