import React, { useEffect, useRef, useState, type RefObject } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path, Circle as SvgCircle, Line } from 'react-native-svg';
import { MAPBOX_ACCESS_TOKEN } from '@env';
import type { FarmBoundaryMapHandle } from '@tohfa/mobile-ui';
import { colors, spacing, typography } from '../../theme';
import { authPalette as P } from '../../theme';
import { t } from '../../../../i18n/farmer';
import { SEARCH_QUERY_MAX_LENGTH, validateSearchQuery } from './locationInputRules';
import { errorMessage } from '../../utils/validation';

/**
 * The floating map controls of registration Step 3 ("Create account" -> Farm Location): the
 * Search pill and its expanded place-search overlay, the coordinates badge, the zoom stepper and
 * the white action pills -- pulled out so other farm-map screens (Profile -> FMB Sketch) look and
 * behave exactly like Step 3 instead of drifting from it.
 *
 * Every icon path, style value and search timing here is a copy of Step3Location.tsx's own.
 * Step3Location.tsx itself still renders its inline originals: migrating that 2,500-line screen
 * onto this module is a separate change, deliberately not bundled with the FMB Sketch work so
 * registration's behaviour cannot shift as a side effect. When it is migrated, these copies become
 * the only ones.
 *
 * The full-screen icons are not from Step 3 (it has no full-screen mode); they are ZonesScreen's,
 * the one farm map that already had a full-screen toggle.
 */

// ---- Icons (identical paths/strokes to Step3Location.tsx) -----------------------------------------

type IconProps = { size?: number; color: string };

export const SearchIcon = ({ size = 20, color }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <SvgCircle cx="11" cy="11" r="8" />
    <Line x1="21" y1="21" x2="16.65" y2="16.65" />
  </Svg>
);

export const CloseIcon = ({ size = 20, color }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Line x1="18" y1="6" x2="6" y2="18" />
    <Line x1="6" y1="6" x2="18" y2="18" />
  </Svg>
);

export const PinIcon = ({ size = 20, color }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <SvgCircle cx="12" cy="10" r="3" />
  </Svg>
);

export const CrosshairIcon = ({ size = 24, color }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <SvgCircle cx="12" cy="12" r="10" />
    <Line x1="12" y1="2" x2="12" y2="6" />
    <Line x1="12" y1="18" x2="12" y2="22" />
    <Line x1="4" y1="12" x2="2" y2="12" />
    <Line x1="22" y1="12" x2="20" y2="12" />
  </Svg>
);

export const PenIcon = ({ size = 24, color }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 20h9" />
    <Path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </Svg>
);

export const PlusIcon = ({ size = 24, color }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Line x1="12" y1="5" x2="12" y2="19" />
    <Line x1="5" y1="12" x2="19" y2="12" />
  </Svg>
);

export const MinusIcon = ({ size = 24, color }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Line x1="5" y1="12" x2="19" y2="12" />
  </Svg>
);

// Drawn here rather than via <Icon> for the same reason ZonesScreen gives: the bundled Material
// Symbols font is a subset with no `fullscreen` / `fullscreen_exit` glyphs.
export const FullscreenIcon = ({ size = 16, color }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />
  </Svg>
);

export const FullscreenExitIcon = ({ size = 16, color }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9 4v5H4M15 4v5h5M20 15h-5v5M4 15h5v5" />
  </Svg>
);

// ---- Place search (same Mapbox call and timings as Step3Location.tsx) ------------------------------

export interface MapboxFeature {
  id: string;
  text: string;
  place_name: string;
  center: [number, number];
  context?: Array<{
    id: string;
    text: string;
  }>;
}

/** Waits this long after the last keystroke before asking Mapbox, so typing isn't one call per key. */
const SEARCH_DEBOUNCE_MS = 300;
/** One letter matches half of India; Step 3 waits for two. */
const SEARCH_MIN_QUERY_LENGTH = 2;
/** Camera zoom and fly duration on picking a suggestion -- Step 3's values. */
const SEARCH_RESULT_ZOOM = 16;
const SEARCH_FLY_DURATION_MS = 900;

export interface MapPlaceSearch {
  isSearchOpen: boolean;
  searchQuery: string;
  isSearching: boolean;
  suggestions: MapboxFeature[];
  open: () => void;
  close: () => void;
  clearQuery: () => void;
  handleSearchChange: (text: string) => void;
  handleSearchSubmit: () => void;
  handleSelectSuggestion: (item: MapboxFeature) => void;
}

/**
 * Step 3's search-overlay state machine. Picking a suggestion flies `mapRef`'s camera there and
 * closes the overlay; `onSelect` lets a screen keep extra details from the feature (Step 3 keeps
 * the village and district) -- FMB Sketch needs none.
 */
export function useMapPlaceSearch(
  mapRef: RefObject<FarmBoundaryMapHandle | null>,
  onSelect?: (item: MapboxFeature) => void,
): MapPlaceSearch {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([]);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // A farmer leaving the screen mid-debounce must not leave a fetch queued behind them.
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  function reset() {
    setIsSearchOpen(false);
    setSearchQuery('');
    setSuggestions([]);
  }

  function handleSelectSuggestion(item: MapboxFeature) {
    Keyboard.dismiss();
    if (Array.isArray(item.center) && item.center.length === 2) {
      const [centerLng, centerLat] = item.center;
      mapRef.current?.flyTo([centerLng, centerLat], SEARCH_RESULT_ZOOM, SEARCH_FLY_DURATION_MS);
    }
    onSelect?.(item);
    reset();
  }

  async function fetchSuggestions(query: string, selectFirstOnSuccess = false) {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < SEARCH_MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const url =
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(trimmed)}.json` +
        `?access_token=${encodeURIComponent(MAPBOX_ACCESS_TOKEN)}&autocomplete=true&limit=5&country=in`;
      const res = await fetch(url);
      if (!res.ok) {
        setSuggestions([]);
        return;
      }
      const data = await res.json();
      const features: MapboxFeature[] = data.features || [];
      setSuggestions(features);
      const firstFeature = features[0];
      if (selectFirstOnSuccess && firstFeature) {
        handleSelectSuggestion(firstFeature);
      }
    } catch {
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }

  function handleSearchChange(text: string) {
    setSearchQuery(text);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (!text.trim()) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }
    debounceTimerRef.current = setTimeout(() => {
      void fetchSuggestions(text);
    }, SEARCH_DEBOUNCE_MS);
  }

  function handleSearchSubmit() {
    const firstSuggestion = suggestions[0];
    if (firstSuggestion) {
      handleSelectSuggestion(firstSuggestion);
    } else if (searchQuery.trim().length > 0) {
      void fetchSuggestions(searchQuery.trim(), true);
    }
  }

  return {
    isSearchOpen,
    searchQuery,
    isSearching,
    suggestions,
    open: () => setIsSearchOpen(true),
    close: () => {
      Keyboard.dismiss();
      reset();
    },
    clearQuery: () => {
      setSearchQuery('');
      setSuggestions([]);
    },
    handleSearchChange,
    handleSearchSubmit,
    handleSelectSuggestion,
  };
}

/** Step 3's expanded search bar (input + Cancel) and its suggestions dropdown, over the map. */
export function MapPlaceSearchOverlay({ search }: { search: MapPlaceSearch }) {
  // The error shows once the box is left or search is pressed; submitting an invalid query is blocked.
  const [touched, setTouched] = useState(false);
  const queryError = validateSearchQuery(search.searchQuery);
  const shownError = touched ? errorMessage(queryError, t) : undefined;
  const handleSubmit = () => {
    setTouched(true);
    if (queryError === null) search.handleSearchSubmit();
  };
  return (
    <View style={mapControlStyles.searchContainer}>
      <View style={mapControlStyles.searchBarRow}>
        <View style={mapControlStyles.searchInputWrapper}>
          <SearchIcon size={18} color={colors.brandGreen} />
          <TextInput
            style={mapControlStyles.searchInput}
            placeholder={t('farmer.map.searchPlaceholder')}
            placeholderTextColor={colors.textPlaceholder}
            value={search.searchQuery}
            onChangeText={search.handleSearchChange}
            maxLength={SEARCH_QUERY_MAX_LENGTH}
            autoFocus={true}
            returnKeyType="search"
            onBlur={() => setTouched(true)}
            onSubmitEditing={handleSubmit}
            testID="map-search-input"
          />
          {search.isSearching && (
            <ActivityIndicator size="small" color={colors.brandGreen} style={mapControlStyles.searchSpinner} />
          )}
          {search.searchQuery.length > 0 && !search.isSearching && (
            <TouchableOpacity
              activeOpacity={0.7}
              hitSlop={{ top: spacing.sm, bottom: spacing.sm, left: spacing.sm, right: spacing.sm }}
              onPress={search.clearQuery}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.common.close')}
            >
              <CloseIcon size={16} color={colors.textSubtle} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          style={mapControlStyles.searchCancelBtn}
          onPress={search.close}
          accessibilityRole="button"
          testID="map-search-cancel"
        >
          <Text style={mapControlStyles.searchCancelText}>{t('farmer.common.cancel')}</Text>
        </TouchableOpacity>
      </View>

      {shownError ? <Text style={mapControlStyles.searchErrorText}>{shownError}</Text> : null}

      {search.suggestions.length > 0 && (
        <View style={mapControlStyles.suggestionsList}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
            style={mapControlStyles.suggestionsScroll}
          >
            {search.suggestions.map((item, idx) => (
              <TouchableOpacity
                key={item.id || idx}
                style={[
                  mapControlStyles.suggestionItem,
                  idx === search.suggestions.length - 1 && mapControlStyles.suggestionItemLast,
                ]}
                onPress={() => search.handleSelectSuggestion(item)}
              >
                <View style={mapControlStyles.suggestionPinWrapper}>
                  <PinIcon size={15} color={colors.brandGreen} />
                </View>
                <View style={mapControlStyles.suggestionTextWrapper}>
                  <Text style={mapControlStyles.suggestionTitle} numberOfLines={1}>
                    {item.text}
                  </Text>
                  <Text style={mapControlStyles.suggestionSubtitle} numberOfLines={1}>
                    {item.place_name}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// ---- Styles (values copied from Step3Location.tsx's StyleSheet; tokens where one matches) ---------
// The literal sizes and rgba scrims below have no design token of the same value; they are Step 3's
// own, kept literal so the two screens stay pixel-identical.

export const mapControlStyles = StyleSheet.create({
  searchContainer: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 50,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 21,
    paddingHorizontal: 14,
    height: 42,
    shadowColor: P.black,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  searchInput: {
    flex: 1,
    fontSize: typography.body,
    color: P.nearBlack,
    marginLeft: spacing.sm,
    paddingVertical: 0,
  },
  searchSpinner: {
    marginRight: 6,
  },
  searchCancelBtn: {
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: P.black,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  searchCancelText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.white,
  },
  searchErrorText: {
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.white,
    color: colors.requiredRed,
    fontSize: typography.bodySmall,
  },
  suggestionsList: {
    marginTop: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: 16,
    shadowColor: P.black,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    overflow: 'hidden',
  },
  suggestionsScroll: {
    maxHeight: 220,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  suggestionItemLast: {
    borderBottomWidth: 0,
  },
  suggestionPinWrapper: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  suggestionTextWrapper: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.ink,
    marginBottom: 2,
  },
  suggestionSubtitle: {
    fontSize: typography.bodySmall,
    color: P.muted,
  },
  topMapControls: {
    position: 'absolute',
    top: spacing.lg,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    zIndex: 10,
  },
  coordsBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    paddingHorizontal: spacing.md,
    borderRadius: 18,
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: P.black,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  coordsText: {
    color: colors.white,
    fontSize: typography.bodySmall,
    fontWeight: '700',
  },
  // Left-anchored column: coords badge on top, zoom stepper below it. Kept separate from
  // `rightControls` (the action-pill column) so the two never compete for the same corner.
  leftMapControls: {
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  zoomControl: {
    backgroundColor: colors.white,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: P.black,
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  zoomButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomDivider: {
    height: 1,
    marginHorizontal: spacing.sm,
    backgroundColor: colors.borderDivider,
  },
  rightControls: {
    gap: spacing.sm,
    alignItems: 'flex-end',
  },
  editingBadge: {
    backgroundColor: P.amber600,
    paddingHorizontal: spacing.md,
    borderRadius: 18,
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: P.black,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  editingText: {
    color: P.black,
    fontSize: typography.bodySmall,
    fontWeight: '700',
  },
  actionPill: {
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    borderRadius: 18,
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: P.black,
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  actionPillActive: {
    backgroundColor: colors.brandGreen,
    borderWidth: 0,
  },
  actionPillText: {
    color: P.nearBlack,
    fontSize: typography.bodySmall,
    fontWeight: '700',
  },
  actionPillTextActive: {
    color: colors.white,
  },
});
