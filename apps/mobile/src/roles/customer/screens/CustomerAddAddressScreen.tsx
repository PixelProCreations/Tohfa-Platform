/**
 * Find location / map (Figma 46:34561) + "Location added" (46:34607). BR-160/BR-171.
 *
 * Real device location (permission -> GPS fix) with graceful denial to manual
 * entry; serviceability by lat/lng; the pin travels into the address form. The
 * map itself is still the static image (no geocoding backend yet).
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Easing,
  StatusBar,
  Modal,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { MAPBOX_ACCESS_TOKEN } from '@env';
import {
  customerColors,
  customerFonts,
  customerShadow,
  customerSpacing,
} from '../theme';
import { FarmBoundaryMap, type FarmBoundaryMapHandle, ScreenStatusBar } from '@tohfa/mobile-ui';
import { CustomerDeliveryAddressModal, type AddressSaveResult } from '../components/CustomerDeliveryAddressModal';
import { ServiceAreaRequestModal, prefillFromAddress } from '../components/ServiceAreaRequestFlow';
import { formatAddressLine, type CustomerAddress } from '../api/addresses';
import { useServiceability } from '../api/serviceability';
import { locateDevice, openAppSettings, type Coords } from '../utils/deviceLocation';
import { t } from '../../../i18n/customer';

type LocatePhase = 'idle' | 'locating' | 'located' | 'denied' | 'blocked' | 'failed';

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
  const mapRef = useRef<FarmBoundaryMapHandle>(null);
  const [phase, setPhase] = useState<LocatePhase>('idle');
  const [coords, setCoords] = useState<Coords | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ id: string; place_name: string; center: [number, number] }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [savedAddress, setSavedAddress] = useState<CustomerAddress | null>(null);
  const [savedServiceable, setSavedServiceable] = useState<boolean | null>(null);
  const isFetchingLocation = phase === 'locating';
  const mounted = useRef(true);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const cameraDebounceRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );

  // Spinning animation for the "Fetching your location" loader
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isFetchingLocation) return undefined;
    const loop = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1100,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [isFetchingLocation, spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleUseCurrentLocation = useCallback(async () => {
    setPhase('locating');
    const result = await locateDevice(true);
    if (!mounted.current) return;
    if (result.coords) {
      setCoords(result.coords);
      setPhase('located');
      mapRef.current?.flyTo([result.coords.lng, result.coords.lat], 17, 800);
    } else {
      setPhase(result.outcome === 'blocked' ? 'blocked' : result.outcome === 'denied' ? 'denied' : 'failed');
    }
  }, []);

  const handleMapPress = useCallback((point: [number, number]) => {
    const [lng, lat] = point;
    setCoords({ lat, lng });
    mapRef.current?.flyTo([lng, lat], 17, 500);
  }, []);

  const handleCameraChanged = useCallback((center: [number, number]) => {
    if (cameraDebounceRef.current) clearTimeout(cameraDebounceRef.current);
    cameraDebounceRef.current = setTimeout(() => {
      if (!mounted.current) return;
      const [lng, lat] = center;
      setCoords({ lat, lng });
    }, 300);
  }, []);

  const fetchSuggestions = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const token = typeof MAPBOX_ACCESS_TOKEN === 'string' ? MAPBOX_ACCESS_TOKEN : '';
      const url =
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(trimmed)}.json` +
        `?access_token=${encodeURIComponent(token)}&autocomplete=true&limit=5&country=in`;
      const res = await fetch(url);
      if (!res.ok) {
        setSuggestions([]);
        return;
      }
      const data = await res.json();
      const features = (data.features || []).map((f: any) => ({
        id: f.id,
        place_name: f.place_name,
        center: f.center as [number, number],
      }));
      setSuggestions(features);
    } catch {
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!text.trim()) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }
    searchDebounceRef.current = setTimeout(() => {
      void fetchSuggestions(text);
    }, 300);
  };

  const handleSelectSuggestion = (item: { id: string; place_name: string; center: [number, number] }) => {
    setSearchQuery(item.place_name);
    setSuggestions([]);
    const [lng, lat] = item.center;
    setCoords({ lat, lng });
    mapRef.current?.flyTo([lng, lat], 17, 800);
  };

  const handleSearchSubmit = () => {
    if (suggestions.length > 0 && suggestions[0]) {
      handleSelectSuggestion(suggestions[0]);
    } else {
      handleAddAddressDetails();
    }
  };

  useEffect(() => {
    if (initialSource === 'current') void handleUseCurrentLocation();
  }, [initialSource, handleUseCurrentLocation]);

  const serviceability = useServiceability({ lat: coords?.lat, lng: coords?.lng }, coords !== null);

  const handleAddAddressDetails = () => {
    setShowAddressModal(true);
  };

  const handleSaveAddress = (address: CustomerAddress, result: AddressSaveResult) => {
    setShowAddressModal(false);
    setSavedAddress(address);
    setSavedServiceable(result.serviceable);
  };

  const proceed = () => {
    setSavedAddress(null);
    onNavigate('CustomerLoadingMarket');
  };

  const sheetTitle = coords ? t('customer.address.add.sheet.current') : t('customer.address.add.sheet.enter');
  const sheetLine = (() => {
    if (phase === 'denied') return t('customer.address.add.status.denied');
    if (phase === 'blocked') return t('customer.address.add.status.blocked');
    if (phase === 'failed') return t('customer.address.add.status.failed');
    if (!coords) return t('customer.address.add.status.noCoords');
    if (serviceability.isLoading) return t('customer.address.add.status.checking');
    if (serviceability.isError) return t('customer.address.add.status.checkError');
    if (serviceability.data?.serviceable === false) return t('customer.address.add.status.unserved');
    if (serviceability.data?.serviceable) return t('customer.address.add.status.served');
    return '';
  })();

  return (
    <View style={styles.container}>
      <ScreenStatusBar translucent={true} backgroundColor="transparent" barStyle="dark-content" />
      <StatusBar hidden={true} />

      {/* ── TOP HEADER BAR: ← Add Address ──────────────────────────────────── */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onNavigate('CustomerPermissions')}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel={t('customer.address.add.back')}
        >
          <BackArrowIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('customer.address.add.title')}</Text>
      </View>

      {/* ── MAP CONTAINER WITH REAL MAPBOX SATELLITE MAP & CENTER RED PIN ────────────── */}
      <View style={styles.mapContainer}>
        <FarmBoundaryMap
          ref={mapRef}
          initialCenter={coords ? [coords.lng, coords.lat] : [76.9558, 11.0168]}
          readOnly={true}
          hideSearchBar={true}
          onMapPress={handleMapPress}
          onCameraChanged={handleCameraChanged}
          testID="customer-add-address-map"
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
            placeholder={t('customer.address.add.search')}
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={handleSearchChange}
            returnKeyType="search"
            onSubmitEditing={handleSearchSubmit}
            testID="add-address-search"
          />
          {isSearching && (
            <ActivityIndicator size="small" color="#2E7D32" style={{ marginRight: 8 }} />
          )}
        </View>

        {/* Suggestions Dropdown */}
        {suggestions.length > 0 && (
          <View style={[styles.suggestionsDropdown, customerShadow.raised]}>
            {suggestions.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.suggestionRow}
                activeOpacity={0.7}
                onPress={() => handleSelectSuggestion(item)}
              >
                <View style={styles.suggestionIconWrap}>
                  <GreenPinIcon />
                </View>
                <Text style={styles.suggestionText} numberOfLines={2}>
                  {item.place_name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Floating "Use current location" Pill Button */}
        <TouchableOpacity
          testID="use-current-location"
          activeOpacity={0.85}
          onPress={() => void handleUseCurrentLocation()}
          disabled={isFetchingLocation}
          style={[styles.useCurrentLocButton, customerShadow.raised]}
          accessibilityRole="button"
          accessibilityLabel={t('customer.address.add.useCurrent')}
        >
          <CrosshairTargetIcon />
          <Text style={styles.useCurrentLocText}>{t('customer.address.add.useCurrent')}</Text>
        </TouchableOpacity>
      </View>

      {/* ── BOTTOM SHEET CARD (DELIVERING YOUR ORDER TO: Coimbatore) ───────── */}
      <View style={[styles.bottomSheet, customerShadow.raised]}>
        <Text style={styles.deliveringLabel}>{t('customer.address.add.deliveringTo')}</Text>

        <View style={styles.locationDetailRow}>
          <View style={styles.locationPinBadge}>
            <GreenPinIcon />
          </View>
          <View style={styles.addressTextWrap}>
            <Text style={styles.cityName}>{sheetTitle}</Text>
            <Text testID="add-address-status" style={styles.addressLine}>
              {sheetLine}
            </Text>
          </View>
        </View>

        {phase === 'blocked' ? (
          <TouchableOpacity
            testID="open-settings"
            activeOpacity={0.85}
            onPress={openAppSettings}
            style={styles.settingsLink}
            accessibilityRole="button"
          >
            <Text style={styles.settingsLinkText}>{t('customer.address.add.openSettings')}</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          testID="add-address-details"
          activeOpacity={0.85}
          onPress={handleAddAddressDetails}
          style={styles.submitButton}
          accessibilityRole="button"
          accessibilityLabel={t('customer.address.add.details')}
        >
          <Text style={styles.submitButtonText}>{t('customer.address.add.details')}</Text>
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

            <Text style={styles.bufferTitle}>{t('customer.address.add.fetching.title')}</Text>
            <Text style={styles.bufferSubtitle}>{t('customer.address.add.fetching.body')}</Text>
          </View>
        </View>
      </Modal>

      {/* ── ADD ADDRESS FORM POPUP MODAL ──────────────────────────────────── */}
      <CustomerDeliveryAddressModal
        visible={showAddressModal}
        initialStep="addAddress"
        onClose={() => setShowAddressModal(false)}
        onSaveAddress={handleSaveAddress}
        coords={coords}
        initialValues={searchQuery.trim() ? { area: searchQuery.trim() } : undefined}
      />

      {/* ── LOCATION ADDED (Figma 46:34607) ─────────────────────────────────── */}
      <Modal visible={savedAddress !== null && savedServiceable !== false} transparent={true} animationType="fade">
        <View style={styles.bufferBackdrop}>
          <View testID="location-added" style={styles.bufferCard}>
            <View style={styles.addedBadge}>
              <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                <Path d="M20 6L9 17l-5-5" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </View>
            <Text style={styles.bufferTitle}>{t('customer.address.add.added')}</Text>
            <Text style={styles.bufferSubtitle}>{savedAddress ? formatAddressLine(savedAddress) : ''}</Text>
            <TouchableOpacity
              testID="location-added-continue"
              activeOpacity={0.85}
              onPress={proceed}
              style={[styles.submitButton, styles.addedContinue]}
              accessibilityRole="button"
            >
              <Text style={styles.submitButtonText}>{t('customer.common.continue')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── UNSERVED AREA -> REQUEST AREA (Figma 46:34706 / 46:34925 / 46:35103) ── */}
      <ServiceAreaRequestModal
        visible={savedAddress !== null && savedServiceable === false}
        initialStep="unserved"
        prefill={prefillFromAddress(savedAddress ?? undefined)}
        onClose={proceed}
        onContinue={proceed}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  settingsLink: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    marginBottom: 6,
  },
  settingsLinkText: {
    fontFamily: customerFonts.semibold,
    fontSize: 13,
    color: '#2E7D32',
  },
  addedBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  addedContinue: {
    alignSelf: 'stretch',
    marginTop: 16,
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
  suggestionsDropdown: {
    position: 'absolute',
    top: 70,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 6,
    zIndex: 20,
    maxHeight: 220,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  suggestionIconWrap: {
    marginRight: 10,
  },
  suggestionText: {
    flex: 1,
    fontFamily: customerFonts.regular,
    fontSize: 13,
    color: '#1F2937',
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

