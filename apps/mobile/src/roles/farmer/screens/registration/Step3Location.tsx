import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Keyboard,
} from 'react-native';
import Svg, { Path, Circle as SvgCircle, Line } from 'react-native-svg';
import { MAPBOX_ACCESS_TOKEN } from '@env';
import {
  FarmBoundaryMap,
  type FarmBoundaryMapHandle,
  type FarmBoundaryMapMode,
} from '@tohfa/mobile-ui';

const ChevronLeft = ({ size = 24, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="m15 18-6-6 6-6"/>
  </Svg>
);

const Crosshair = ({ size = 24, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <SvgCircle cx="12" cy="12" r="10"/>
    <Line x1="12" y1="2" x2="12" y2="6"/>
    <Line x1="12" y1="18" x2="12" y2="22"/>
    <Line x1="4" y1="12" x2="2" y2="12"/>
    <Line x1="22" y1="12" x2="20" y2="12"/>
  </Svg>
);

const PenIcon = ({ size = 24, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 20h9"/>
    <Path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
  </Svg>
);

const PlusIcon = ({ size = 24, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Line x1="12" y1="5" x2="12" y2="19"/>
    <Line x1="5" y1="12" x2="19" y2="12"/>
  </Svg>
);

const SearchIcon = ({ size = 20, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <SvgCircle cx="11" cy="11" r="8"/>
    <Line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </Svg>
);

const CloseIcon = ({ size = 20, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Line x1="18" y1="6" x2="6" y2="18"/>
    <Line x1="6" y1="6" x2="18" y2="18"/>
  </Svg>
);

const PinIcon = ({ size = 20, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <SvgCircle cx="12" cy="10" r="3"/>
  </Svg>
);

const LeafIcon = ({ size = 24, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2v1c0 5.6-4.5 11.2-11 11.2V20Z"/>
  </Svg>
);

const CheckIcon = ({ size = 24, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 6 9 17l-5-5"/>
  </Svg>
);

const SolidDot = ({ size = 10, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <SvgCircle cx="12" cy="12" r="10"/>
  </Svg>
);

interface MapboxFeature {
  id: string;
  text: string;
  place_name: string;
  center: [number, number];
  context?: Array<{
    id: string;
    text: string;
  }>;
}
import {
  colors,
  useTheme,
  spacing,
  typography,
  weights,
  radius,
  MIN_TOUCH_TARGET,
} from '../../theme';
import { authPalette as P } from '../../theme';
import {
  generateLocationId,
  type FarmLocationData,
  type Step3LocationData,
} from '../../storage/registrationDraft';
import { calculatePolygonMetrics } from '../../utils/geo';
import { validateStep } from './validation';
import { t } from '../../../../i18n/farmer';

/**
 * A TOHFA farmer runs ONE farming operation whose land sits in several physical places. What
 * repeats is therefore a land LOCATION -- a labelled parcel with its own acreage and its own
 * boundary -- and each one is captured here, whole, on this screen.
 *
 * A location is self-contained: it carries its own `label`, `areaAcres` and `fmbPolygon`, so
 * there is nothing to correlate back to step 2 (which now describes the operation, not a list of
 * farms). If a `farmId` match between the two steps ever reappears here, the model has drifted.
 *
 * Total land area is deliberately not held anywhere -- it is the sum of these parcels' `areaAcres`
 * and is derived wherever it is displayed.
 */
function makeBlankLocation(): FarmLocationData {
  return { id: generateLocationId(), label: '', areaAcres: 0 };
}

/** The outer ring of a location's saved boundary, or an empty ring when it has none. */
function ringOf(location: FarmLocationData | undefined): number[][] {
  const ring = location?.fmbPolygon?.coordinates?.[0];
  return Array.isArray(ring) ? ring : [];
}

/**
 * The parcel's own manually-typed latitude/longitude, as strings ready for the two text inputs,
 * or blank when it has none -- including when it has a drawn boundary instead. A boundary's
 * centroid lives in these same two `FarmLocationData` fields (see `commitActiveLocation`), but it
 * is not manual data, exactly the distinction `positioningOf` in Step5Review.tsx and the admin
 * detail component draw: a stored ring always wins. Reopening a drawn parcel must not resurrect a
 * manual-entry panel that was never really in use, or backfill it with the boundary's own centre.
 */
function manualCoordsOf(location: FarmLocationData | undefined): { latitude: string; longitude: string } {
  if (ringOf(location).length > 0) return { latitude: '', longitude: '' };
  if (location?.latitude === undefined || location?.longitude === undefined) {
    return { latitude: '', longitude: '' };
  }
  return { latitude: String(location.latitude), longitude: String(location.longitude) };
}

/** Server-matching bounds -- see `farmLocationItemSchema` in apps/api's farmer-applications
 * schema (`z.number().min(-90).max(90)` / `.min(-180).max(180)`). Validated here too so nothing
 * the UI accepts gets a 400 back from the API. */
function isValidLatitudeText(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed === '') return false;
  const value = Number(trimmed);
  return Number.isFinite(value) && value >= -90 && value <= 90;
}
function isValidLongitudeText(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed === '') return false;
  const value = Number(trimmed);
  return Number.isFinite(value) && value >= -180 && value <= 180;
}

/**
 * How the active parcel is positioned, mirroring `positioningOf` in Step5Review.tsx and the admin
 * detail component -- but read off this screen's in-progress editing state (the boundary being
 * drawn, the coordinates being typed) rather than an already-committed `FarmLocationData`, since
 * the on-screen badge exists so the farmer can see the effect of what they are doing right now.
 */
type ParcelPositioning = 'drawn' | 'manual' | 'none';

/**
 * `validation.ts` keys every per-location error by the parcel's POSITION -- `locations.2.label`,
 * `locations.2.areaAcres`, `locations.2.coordinates`. These two helpers are the only places that
 * knowledge lives, so an error can be routed to the parcel it is actually about instead of being
 * shown against whichever one happens to be on screen. The trailing dot matters: without it
 * `locations.1.` would also claim `locations.10.label`.
 */
function hasErrorsFor(errors: Record<string, string>, index: number): boolean {
  const prefix = `locations.${index}.`;
  return Object.keys(errors).some((key) => key.startsWith(prefix));
}

function firstIndexWithErrors(errors: Record<string, string>, count: number): number {
  for (let i = 0; i < count; i += 1) {
    if (hasErrorsFor(errors, i)) return i;
  }
  return -1;
}

interface Step3Props {
  initialData?: Step3LocationData | undefined;
  onSave: (data: Step3LocationData) => void;
  onBack: () => void;
}

export const Step3Location: React.FC<Step3Props> = ({ initialData, onSave, onBack }) => {
  const theme = useTheme();
  const { colors } = theme;

  const mapRef = useRef<FarmBoundaryMapHandle>(null);
  const [mode, setMode] = useState<FarmBoundaryMapMode>('view');
  const isEditing = mode !== 'view';

  // Every parcel captured so far this session, plus any restored from the draft. The screen walks
  // them one at a time and folds the one on screen back into this array on every transition;
  // `onSave` hands over the whole thing at once.
  const [locations, setLocations] = useState<FarmLocationData[]>(() => {
    const restored = initialData?.locations ?? [];
    // A restored parcel keeps the `id` it was saved with. Regenerating it would detach the entry
    // from the boundary the farmer already drew against it.
    return restored.length > 0 ? restored.map((location) => ({ ...location })) : [makeBlankLocation()];
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const activeLocation = locations[activeIndex];
  const isLastLocation = activeIndex >= locations.length - 1;

  // The active parcel's fields, mirrored out of `locations` while they are being typed into.
  // `areaAcres` is a number on FarmLocationData but a string here, because a half-typed number is
  // not a number: parsing on every keystroke turns "2." into 2 and eats the decimal point the
  // farmer was in the middle of typing. It is parsed once, when the parcel is committed.
  const [label, setLabel] = useState(activeLocation?.label ?? '');
  const [areaAcresText, setAreaAcresText] = useState(
    activeLocation?.areaAcres ? String(activeLocation.areaAcres) : '',
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([]);
  const [selectedVillage, setSelectedVillage] = useState(activeLocation?.village ?? '');
  const [selectedTaluk, setSelectedTaluk] = useState(activeLocation?.taluk ?? '');
  const [selectedDistrict, setSelectedDistrict] = useState(activeLocation?.district ?? '');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [coords, setCoords] = useState<number[][]>(() => ringOf(activeLocation));

  // Manual fallback for this parcel -- see `manualCoordsOf`. Seeded from whatever is already on
  // the (restored or freshly-committed) parcel so reopening it shows what it actually has, and
  // the panel starts open exactly when there is manual data to show.
  const [manualLatText, setManualLatText] = useState(() => manualCoordsOf(activeLocation).latitude);
  const [manualLngText, setManualLngText] = useState(() => manualCoordsOf(activeLocation).longitude);
  const [manualEntryOpen, setManualEntryOpen] = useState(() => {
    const seed = manualCoordsOf(activeLocation);
    return seed.latitude !== '' || seed.longitude !== '';
  });
  // The map has nothing else to show for a manually-typed point (no polygon), so this is the pin
  // FarmBoundaryMap renders for it -- see its `markerCoordinate` prop. Seeded from the same source
  // as `manualLatText`/`manualLngText` above so a restored draft's marker (and, via
  // `mapInitialCenter` below, the camera) is correct on the very first render, not only after the
  // farmer retypes something. Kept as its own [lng, lat] pair rather than derived inline from the
  // text state because it must NOT track every keystroke -- see `scheduleManualMarkerUpdate`.
  const [manualMarkerCoord, setManualMarkerCoord] = useState<[number, number] | null>(() => {
    const seed = manualCoordsOf(activeLocation);
    return isValidLatitudeText(seed.latitude) && isValidLongitudeText(seed.longitude)
      ? [Number(seed.longitude), Number(seed.latitude)]
      : null;
  });
  // Deliberately separate from `debounceTimerRef` (place-search): the manual-coordinates fields
  // stay mounted and editable even while the search overlay is showing (see the JSX below -- the
  // bottom card with the manual panel isn't inside the `isSearchOpen` branch), so a shared timer
  // could have a manual-entry keystroke cancel a pending search fetch or vice versa.
  const manualCoordsDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Belt-and-braces: `goToLocation` and `handlePolygonChange` already cancel this on every path
  // that could otherwise leak a stale fly/mark, but a farmer leaving the step entirely (not just
  // switching parcels) mid-debounce should not leave a dangling timer behind either.
  useEffect(() => {
    return () => {
      if (manualCoordsDebounceTimerRef.current) {
        clearTimeout(manualCoordsDebounceTimerRef.current);
      }
    };
  }, []);

  const hasBoundary = coords.length >= 3;
  const metrics = calculatePolygonMetrics(coords);
  const lat = (metrics.centroid.latitude || 11.4064).toFixed(4);
  const lng = (metrics.centroid.longitude || 76.6932).toFixed(4);

  const isManualLatValid = isValidLatitudeText(manualLatText);
  const isManualLngValid = isValidLongitudeText(manualLngText);
  // A drawn boundary always outranks typed coordinates (see `commitActiveLocation`), so this is
  // only ever true for a parcel with no boundary of its own.
  const hasValidManualCoords = !hasBoundary && isManualLatValid && isManualLngValid;
  const manualLatRangeError =
    manualLatText.trim() !== '' && !isManualLatValid
      ? t('farmer.registration.step3.latitudeRange')
      : null;
  const manualLngRangeError =
    manualLngText.trim() !== '' && !isManualLngValid
      ? t('farmer.registration.step3.longitudeRange')
      : null;
  // Exactly one field filled in is never a usable position -- flagged once, below both inputs,
  // rather than as a third per-field error that would fight with the range messages above.
  const manualBothCoordinatesError =
    manualEntryOpen &&
    (manualLatText.trim() !== '') !== (manualLngText.trim() !== '') &&
    !manualLatRangeError &&
    !manualLngRangeError
      ? t('farmer.registration.step3.bothCoordinates')
      : null;
  const positioning: ParcelPositioning = hasBoundary ? 'drawn' : hasValidManualCoords ? 'manual' : 'none';

  /** The parcel's own name, or a positional stand-in until the farmer types one. */
  const displayName = label.trim() || `Location ${activeIndex + 1}`;

  const labelError = fieldErrors[`locations.${activeIndex}.label`];
  const areaError = fieldErrors[`locations.${activeIndex}.areaAcres`];
  const coordinatesError = fieldErrors[`locations.${activeIndex}.coordinates`];
  const locationsError = fieldErrors['locations'];

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // Real GPS-grounded center: reuse the *active* parcel's already-saved boundary centroid if one
  // exists, otherwise let FarmBoundaryMap fall back to the device's current location (see its own
  // `initialCenter` docs) — never a hardcoded "somewhere in the Nilgiris" ring.
  //
  // These are derived on every render rather than captured in `useState` because they must change
  // when the farmer moves to the next parcel. FarmBoundaryMap itself reads both only in its own
  // mount-time `useState` initialisers, so the `key` on the element below is what actually makes a
  // new parcel start from a clean map; without it the previous parcel's polygon stays on screen.
  const savedRing = ringOf(activeLocation);
  const hasSavedRing = savedRing.length >= 3;
  const savedRingMetrics = hasSavedRing ? calculatePolygonMetrics(savedRing) : null;
  // Same restore path as the boundary centroid above, but for a parcel whose only saved position
  // is a manually-typed point -- `manualCoordsOf` already returns blank when a ring exists, so
  // this and `savedRingMetrics` can never both be non-null for the same parcel.
  const savedManualSeed = manualCoordsOf(activeLocation);
  const hasSavedManualCoords =
    isValidLatitudeText(savedManualSeed.latitude) && isValidLongitudeText(savedManualSeed.longitude);
  const mapInitialCenter: [number, number] | null = savedRingMetrics
    ? [savedRingMetrics.centroid.longitude, savedRingMetrics.centroid.latitude]
    : hasSavedManualCoords
      ? [Number(savedManualSeed.longitude), Number(savedManualSeed.latitude)]
      : null;
  const mapInitialPolygon: [number, number][] | null = hasSavedRing
    ? (savedRing as [number, number][])
    : null;

  const fetchSuggestions = async (query: string, selectFirstOnSuccess = false) => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
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
  };

  const handleSearchChange = (text: string) => {
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
    }, 300);
  };

  const handleSelectSuggestion = (item: MapboxFeature) => {
    Keyboard.dismiss();
    if (Array.isArray(item.center) && item.center.length === 2) {
      const [centerLng, centerLat] = item.center;
      mapRef.current?.flyTo([centerLng, centerLat], 16, 900);
    }
    if (item.text) {
      setSelectedVillage(item.text);
    }
    if (item.context) {
      const dist = item.context.find((c) => c.id.startsWith('district'));
      if (dist) setSelectedDistrict(dist.text);
    }
    setIsSearchOpen(false);
    setSearchQuery('');
    setSuggestions([]);
  };

  const handleSearchSubmit = () => {
    const firstSuggestion = suggestions[0];
    if (firstSuggestion) {
      handleSelectSuggestion(firstSuggestion);
    } else if (searchQuery.trim().length > 0) {
      void fetchSuggestions(searchQuery.trim(), true);
    }
  };

  function handlePolygonChange(next: [number, number][]) {
    setCoords(next);
    if (next.length >= 3) {
      clearFieldError(`locations.${activeIndex}.coordinates`);
      // A completed boundary outranks manual entry for this parcel (see `commitActiveLocation`),
      // so collapse the panel rather than show two positioning methods as if both still applied.
      setManualEntryOpen(false);
      // A manual-marker fly/reveal queued from typing just before the boundary was completed
      // would otherwise land a beat later and yank the camera off the boundary the farmer just
      // finished drawing -- `hasValidManualCoords` (and so the marker prop below) already flips
      // off the instant `coords` does, but the queued `flyTo` itself isn't gated by that.
      if (manualCoordsDebounceTimerRef.current) {
        clearTimeout(manualCoordsDebounceTimerRef.current);
        manualCoordsDebounceTimerRef.current = null;
      }
    }
  }

  function handleLocateMe() {
    void mapRef.current?.locateMe();
  }

  /**
   * Opens or closes the manual-coordinates panel for the active parcel. Opening it commits to the
   * manual path: a drawn boundary and typed coordinates are mutually exclusive positions for one
   * parcel (`commitActiveLocation`, and `positioningOf` in Step5Review.tsx, always trust a stored
   * polygon over lat/lng), so any boundary work in progress or already on the map is cleared here
   * rather than left behind to silently win back over what the farmer is about to type. Closing it
   * (to go back to drawing) leaves whatever was typed in place -- harmless, since a boundary drawn
   * afterwards is what gets saved regardless.
   */
  function handleToggleManualEntry() {
    if (!manualEntryOpen) {
      if (mode !== 'view') {
        mapRef.current?.finish();
      }
      if (coords.length > 0) {
        mapRef.current?.clear();
      }
    }
    setManualEntryOpen((prev) => !prev);
  }

  /**
   * Debounced camera-fly + marker reveal for the manual lat/lng fields, mirroring the
   * place-search debounce (`handleSearchChange` above, same `setTimeout`/`clearTimeout` idiom and
   * delay) so a still-incomplete or mid-edit pair never moves the map -- only a pair that is valid
   * *and* the farmer has paused on gets flown to and marked. Every call restarts the timer, so a
   * fast run of keystrokes collapses into a single fly/mark once typing settles.
   */
  function scheduleManualMarkerUpdate(latText: string, lngText: string) {
    if (manualCoordsDebounceTimerRef.current) {
      clearTimeout(manualCoordsDebounceTimerRef.current);
    }
    if (!isValidLatitudeText(latText) || !isValidLongitudeText(lngText)) {
      return;
    }
    manualCoordsDebounceTimerRef.current = setTimeout(() => {
      const nextMarker: [number, number] = [Number(lngText.trim()), Number(latText.trim())];
      setManualMarkerCoord(nextMarker);
      mapRef.current?.flyTo(nextMarker, 16, 900);
    }, 300);
  }

  function handleManualLatChange(text: string) {
    setManualLatText(text);
    if (isValidLatitudeText(text) && isValidLongitudeText(manualLngText)) {
      clearFieldError(`locations.${activeIndex}.coordinates`);
    }
    scheduleManualMarkerUpdate(text, manualLngText);
  }

  function handleManualLngChange(text: string) {
    setManualLngText(text);
    if (isValidLatitudeText(manualLatText) && isValidLongitudeText(text)) {
      clearFieldError(`locations.${activeIndex}.coordinates`);
    }
    scheduleManualMarkerUpdate(manualLatText, text);
  }

  /** Top pill: (re)draws this parcel's boundary from scratch. */
  function handleDrawBoundary() {
    if (mode === 'draw') {
      mapRef.current?.finish();
      return;
    }
    mapRef.current?.clear();
    mapRef.current?.startDrawing();
  }

  /** Bottom card: adjusts the existing boundary's vertices — only meaningful once one exists. */
  function handleEditBoundary() {
    if (mode === 'edit') {
      mapRef.current?.finish();
      return;
    }
    mapRef.current?.startEditing();
  }

  /**
   * Folds the parcel on screen back into `locations`, and returns the resulting array so the caller
   * can use it in the same tick — `setLocations` will not have landed yet when we immediately hand
   * the array to `onSave` or to `goToLocation`.
   *
   * `areaAcres` stays the farmer-typed figure; the map's measurement is recorded separately as
   * `calculatedAreaAcres`/`calculatedAreaHectares` so the two can be compared during review rather
   * than one silently overwriting the other.
   *
   * With fewer than three vertices there is no boundary, so no position is written at all and
   * `gpsCaptured` is false. Recording the map's fallback centre as this parcel's location would be
   * fabricated GPS data, and it would also defeat `validateCrossStepSubmission`, which gates the
   * final submit on at least one parcel having a real position.
   */
  function commitActiveLocation(): FarmLocationData[] {
    if (!activeLocation) return locations;
    const typedAcres = parseFloat(areaAcresText);
    // Built by assignment rather than by spread so each optional field is written only when it has
    // a real value — `exactOptionalPropertyTypes` is on, and an explicit `undefined` is not the
    // same thing as an absent key.
    const next: FarmLocationData = {
      id: activeLocation.id,
      label: label.trim(),
      areaAcres: isNaN(typedAcres) ? 0 : typedAcres,
      gpsCaptured: hasBoundary,
    };
    if (hasBoundary) {
      next.latitude = metrics.centroid.latitude;
      next.longitude = metrics.centroid.longitude;
      next.calculatedAreaAcres = metrics.areaAcres;
      next.calculatedAreaHectares = metrics.areaHectares;
      next.fmbPolygon = { type: 'Polygon', coordinates: [coords] };
    } else if (hasValidManualCoords) {
      // Manual entry: `gpsCaptured` above is already `false` (from `hasBoundary`), and there is
      // deliberately no `fmbPolygon`, `calculatedAreaAcres` or `calculatedAreaHectares` here -- a
      // single pinned point is not a surveyed outline, and fabricating an area from it would
      // misrepresent evidence quality the same way `positioningOf` (Step5Review.tsx, and the
      // admin detail component) relies on being able to tell drawn and manual parcels apart. The
      // farmer's own "Area (acres)" figure above is the only area this parcel carries.
      next.latitude = Number(manualLatText.trim());
      next.longitude = Number(manualLngText.trim());
    }
    const village = selectedVillage || activeLocation.village || '';
    const taluk = selectedTaluk || activeLocation.taluk || '';
    const district = selectedDistrict || activeLocation.district || '';
    if (village) next.village = village;
    if (taluk) next.taluk = taluk;
    if (district) next.district = district;

    const updated = locations.map((location, index) => (index === activeIndex ? next : location));
    setLocations(updated);
    return updated;
  }

  /**
   * Switches the screen to another parcel. Every piece of per-parcel state has to be reset here,
   * not just `coords`: the map element is remounted by its `key`, but this screen's own copy of the
   * boundary, the draw/edit mode and the place labels picked from search would otherwise carry the
   * previous parcel's answers onto the next one. `list` is passed in rather than read from state
   * for the same reason `commitActiveLocation` returns it.
   */
  function goToLocation(index: number, list: FarmLocationData[]) {
    const target = list[index];
    setActiveIndex(index);
    setLabel(target?.label ?? '');
    setAreaAcresText(target?.areaAcres ? String(target.areaAcres) : '');
    setCoords(ringOf(target));
    setMode('view');
    setSelectedVillage(target?.village ?? '');
    setSelectedTaluk(target?.taluk ?? '');
    setSelectedDistrict(target?.district ?? '');
    setIsSearchOpen(false);
    setSearchQuery('');
    setSuggestions([]);
    // Manual entry is per-parcel state exactly like the boundary above -- without this reset, a
    // parcel with no manual coordinates of its own would show whatever the previous parcel's
    // farmer-typed lat/lng happened to be, with the panel left open to match.
    const manualSeed = manualCoordsOf(target);
    setManualLatText(manualSeed.latitude);
    setManualLngText(manualSeed.longitude);
    setManualEntryOpen(manualSeed.latitude !== '' || manualSeed.longitude !== '');
    // A pending debounced fly/mark from the parcel being left would otherwise fire after this
    // switch and plant the previous parcel's marker (and camera) on the new one -- the exact
    // boundary-bleed bug class this screen has already been fixed for once. Cancel it, then set
    // the new parcel's marker immediately (not debounced) so a restored draft's pin and camera are
    // right away, not only after the farmer retypes something -- `mapInitialCenter` above handles
    // the camera side of that via the map's remount `key`; this is the marker side.
    if (manualCoordsDebounceTimerRef.current) {
      clearTimeout(manualCoordsDebounceTimerRef.current);
      manualCoordsDebounceTimerRef.current = null;
    }
    setManualMarkerCoord(
      isValidLatitudeText(manualSeed.latitude) && isValidLongitudeText(manualSeed.longitude)
        ? [Number(manualSeed.longitude), Number(manualSeed.latitude)]
        : null,
    );
  }

  /** Appends a blank parcel with its own fresh id and opens it. */
  function handleAddLocation() {
    const list = commitActiveLocation();
    const { errors } = validateStep(3, { locations: list });
    // Don't let an unfinished parcel be buried under a new one — the farmer would have to find
    // their way back to it at the end of the step to learn what was missing.
    if (activeLocation && hasErrorsFor(errors, activeIndex)) {
      setFieldErrors(errors);
      return;
    }
    const updated = [...list, makeBlankLocation()];
    setLocations(updated);
    setFieldErrors({});
    goToLocation(updated.length - 1, updated);
  }

  /** Drops the parcel on screen. Validation requires at least one, so the last one cannot go. */
  function handleRemoveLocation() {
    // The control is hidden at length 1; the guard is here too because the state, not the button,
    // is what the rule is about.
    if (locations.length <= 1) return;
    const updated = locations.filter((_, index) => index !== activeIndex);
    setLocations(updated);
    // Every error key is indexed by position (`locations.2.label`), so removing a parcel re-points
    // every later key at the wrong one. Dropping them all is the only honest option.
    setFieldErrors({});
    goToLocation(Math.min(activeIndex, updated.length - 1), updated);
  }

  /** Saves the parcel on screen, then moves to the next one — or leaves the step. */
  function handleNext() {
    const list = commitActiveLocation();
    const { errors } = validateStep(3, { locations: list });

    // The parcel on screen is checked first, so its errors are reported where the farmer is
    // standing rather than after a jump somewhere else.
    if (hasErrorsFor(errors, activeIndex)) {
      setFieldErrors(errors);
      return;
    }
    if (!isLastLocation) {
      setFieldErrors({});
      goToLocation(activeIndex + 1, list);
      return;
    }

    // Leaving the step means every parcel has to hold up, including ones edited earlier and left
    // incomplete. Land on the first one that does not.
    const firstBad = firstIndexWithErrors(errors, list.length);
    if (firstBad !== -1) {
      setFieldErrors(errors);
      goToLocation(firstBad, list);
      return;
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    onSave({ locations: list });
  }

  /** Back steps through the parcels first, and only then out of the step. */
  function handleBackPress() {
    if (activeIndex > 0) {
      const list = commitActiveLocation();
      setFieldErrors({});
      goToLocation(activeIndex - 1, list);
      return;
    }
    onBack();
  }

  /**
   * Skip leaves the whole step, not just the parcel on screen — it sits in the header next to
   * "Step 3 of 5" and has always meant "skip this step".
   *
   * It saves what has been entered *without* validating it, and deletes nothing: a farmer who
   * cannot get a GPS fix here (no signal in the field, permission refused) can come back to it
   * rather than lose the parcels they have already described. Nothing unsafe escapes that way --
   * `validateCrossStepSubmission` blocks the final submit until at least one parcel has its
   * position marked, and Step 5 sends the farmer back here by name. The one visible consequence is
   * that the background step-save may be rejected by the API (which requires a label and a positive
   * acreage on every location); `RegistrationFlowScreen` already surfaces that as a banner saying
   * the data is kept locally, which is exactly what happens.
   */
  function handleSkip() {
    onSave({ locations: commitActiveLocation() });
  }

  // Unreachable in normal use: the screen seeds one blank parcel and `handleRemoveLocation` refuses
  // to drop the last one. Kept as a guard so a corrupted restored draft cannot mount the map with
  // no parcel for the boundary to belong to — and offers the one action that recovers from it.
  if (!activeLocation) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bgLight }]}>
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.white,
              borderBottomColor: colors.borderSoft,
            },
          ]}
        >
          <View style={styles.headerTitleRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.backButtonCircle,
                {
                  borderColor: colors.borderMedium,
                  backgroundColor: colors.white,
                },
              ]}
              onPress={onBack}
            >
              <ChevronLeft size={22} color={colors.brandGreen} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: colors.textDark }]}>Farm Location</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSubtle }]}>Step 3 of 5</Text>
            </View>
          </View>
        </View>

        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateText, { color: colors.textSubtle }]}>
            Add the first piece of land in this farming operation to continue.
          </Text>
        </View>

        <View
          style={[
            styles.footer,
            {
              borderTopColor: colors.borderDivider,
              backgroundColor: colors.white,
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.footerBtn,
              styles.backButton,
              { borderColor: colors.brandGreen, backgroundColor: colors.white },
            ]}
            onPress={onBack}
          >
            <Text style={[styles.footerBtnText, { color: colors.brandGreen }]}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.footerBtn,
              styles.nextButton,
              { backgroundColor: colors.brandGreen },
            ]}
            onPress={handleAddLocation}
          >
            <Text style={[styles.footerBtnText, { color: colors.white }]}>Add Location</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bgLight }]}>

      {/* HEADER OVERRIDE for this specific screen to match the exact design */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.white,
            borderBottomColor: colors.borderSoft,
          },
        ]}
      >
        <View style={styles.headerTitleRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.backButtonCircle,
              {
                borderColor: colors.borderMedium,
                backgroundColor: colors.white,
              },
            ]}
            onPress={handleBackPress}
          >
            <ChevronLeft size={22} color={colors.brandGreen} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.textDark }]}>
              {isEditing ? 'Edit Boundary' : 'Farm Location'}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSubtle }]}>
              Step 3 of 5
              {isEditing && ' · Drag points to adjust'}
            </Text>
          </View>
          <TouchableOpacity onPress={handleSkip}>
            <Text style={[styles.skipText, { color: colors.brandGreen }]}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* 5 Progress Bar Segments — the five registration steps, unchanged. How many parcels the
            farmer is walking through is context *inside* step 3 and is counted below, never here. */}
        <View style={styles.progressRow}>
          {[1, 2, 3, 4, 5].map((s) => {
            const isActive = s <= 3;
            return (
              <View
                key={s}
                style={[
                  styles.progressSegment,
                  { backgroundColor: isActive ? colors.brandGreen : colors.borderMedium },
                ]}
              />
            );
          })}
        </View>

        {/* This parcel's own details. They sit above the map rather than in the floating card so
            the keyboard cannot cover them while they are being typed into. */}
        <View style={styles.locationMetaRow}>
          <Text style={[styles.locationMetaText, { color: colors.textSubtle }]}>
            Location {activeIndex + 1} of {locations.length}
          </Text>
          {locations.length > 1 ? (
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.removeLocationBtn}
              onPress={handleRemoveLocation}
            >
              <Text style={[styles.removeLocationText, { color: colors.requiredRed }]}>Remove</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.fieldsRow}>
          <View style={styles.fieldCol}>
            <Text style={[styles.fieldLabel, { color: colors.textBody }]}>
              Location Name <Text style={{ color: colors.requiredRed }}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.fieldInput,
                {
                  borderColor: colors.borderLight,
                  color: colors.textDark,
                  backgroundColor: colors.white,
                },
                labelError ? styles.inputError : null,
              ]}
              value={label}
              onChangeText={(text) => {
                setLabel(text);
                clearFieldError(`locations.${activeIndex}.label`);
              }}
              placeholder="e.g. Home plot"
              placeholderTextColor={colors.textPlaceholder}
            />
          </View>

          <View style={styles.fieldCol}>
            <Text style={[styles.fieldLabel, { color: colors.textBody }]}>
              Area (acres) <Text style={{ color: colors.requiredRed }}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.fieldInput,
                {
                  borderColor: colors.borderLight,
                  color: colors.textDark,
                  backgroundColor: colors.white,
                },
                areaError ? styles.inputError : null,
              ]}
              value={areaAcresText}
              onChangeText={(text) => {
                setAreaAcresText(text);
                clearFieldError(`locations.${activeIndex}.areaAcres`);
              }}
              keyboardType="decimal-pad"
              placeholder="2.5"
              placeholderTextColor={colors.textPlaceholder}
            />
          </View>
        </View>

        {locationsError ? <Text style={styles.fieldErrorText}>{locationsError}</Text> : null}
        {labelError ? <Text style={styles.fieldErrorText}>{labelError}</Text> : null}
        {areaError ? <Text style={styles.fieldErrorText}>{areaError}</Text> : null}
      </View>

      {/* MAP AREA — real satellite map + polygon boundary editor (see
          packages/mobile-ui/src/FarmBoundaryMap.tsx). Replaces the fake
          ESRI-static-image + react-native-svg hand-drawn canvas this screen
          used to render. */}
      <View style={styles.mapArea}>
        <FarmBoundaryMap
          // Remount per parcel: FarmBoundaryMap reads `initialPolygon` and `initialCenter` only in
          // mount-time state initialisers, so without a changing key the second parcel would open
          // on the first parcel's polygon still drawn on the map.
          key={activeLocation.id}
          ref={mapRef}
          initialCenter={mapInitialCenter}
          initialPolygon={mapInitialPolygon}
          onPolygonChange={handlePolygonChange}
          onModeChange={setMode}
          // Mutually exclusive with a drawn boundary, matching `commitActiveLocation`'s own
          // `hasBoundary` vs `hasValidManualCoords` branching -- `hasValidManualCoords` is already
          // `!hasBoundary && <both fields valid>`, so this alone also makes the marker disappear
          // the instant a boundary is drawn, with no extra condition needed here.
          markerCoordinate={hasValidManualCoords ? manualMarkerCoord : null}
          hideSearchBar={true}
          searchPlaceholder={t('farmer.map.searchPlaceholder')}
          testID="step3-farm-boundary-map"
        />

        {/* Top Floating Controls or Expanded Search Bar */}
        {isSearchOpen ? (
          <View style={styles.searchContainer}>
            <View style={styles.searchBarRow}>
              <View style={styles.searchInputWrapper}>
                <SearchIcon size={18} color={colors.brandGreen} />
                <TextInput
                  style={styles.searchInput}
                  placeholder={t('farmer.map.searchPlaceholder') || 'Search village, pin code, or taluk...'}
                  placeholderTextColor={colors.textPlaceholder}
                  value={searchQuery}
                  onChangeText={handleSearchChange}
                  autoFocus={true}
                  returnKeyType="search"
                  onSubmitEditing={handleSearchSubmit}
                />
                {isSearching && (
                  <ActivityIndicator size="small" color={colors.brandGreen} style={{ marginRight: 6 }} />
                )}
                {searchQuery.length > 0 && !isSearching && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={() => {
                      setSearchQuery('');
                      setSuggestions([]);
                    }}
                  >
                    <CloseIcon size={16} color={colors.textSubtle} />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.searchCancelBtn}
                onPress={() => {
                  Keyboard.dismiss();
                  setIsSearchOpen(false);
                  setSearchQuery('');
                  setSuggestions([]);
                }}
              >
                <Text style={styles.searchCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            {/* Autocomplete Suggestions Dropdown */}
            {suggestions.length > 0 && (
              <View style={styles.suggestionsList}>
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled={true}
                  style={{ maxHeight: 220 }}
                >
                  {suggestions.map((item, idx) => (
                    <TouchableOpacity
                      key={item.id || idx}
                      style={[
                        styles.suggestionItem,
                        idx === suggestions.length - 1 && { borderBottomWidth: 0 },
                      ]}
                      onPress={() => handleSelectSuggestion(item)}
                    >
                      <View style={styles.suggestionPinWrapper}>
                        <PinIcon size={15} color={colors.brandGreen} />
                      </View>
                      <View style={styles.suggestionTextWrapper}>
                        <Text style={styles.suggestionTitle} numberOfLines={1}>
                          {item.text}
                        </Text>
                        <Text style={styles.suggestionSubtitle} numberOfLines={1}>
                          {item.place_name}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.topMapControls} pointerEvents="box-none">
            <View style={styles.coordsBadge} pointerEvents="none">
              <Crosshair size={13} color={colors.brandGreen} />
              <Text style={styles.coordsText}>
                {lat}, {lng}
              </Text>
            </View>

            <View style={styles.rightControls} pointerEvents="box-none">
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.actionPill}
                onPress={() => setIsSearchOpen(true)}
              >
                <SearchIcon size={14} color={colors.brandGreen} />
                <Text style={styles.actionPillText}>Search</Text>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.8} style={styles.actionPill} onPress={handleLocateMe}>
                <Crosshair size={14} color={colors.brandGreen} />
                <Text style={styles.actionPillText}>
                  {t('farmer.map.locateMe')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleDrawBoundary}
                style={[
                  styles.actionPill,
                  mode === 'draw' && { backgroundColor: colors.brandGreen, borderWidth: 0 },
                ]}
              >
                <PenIcon size={14} color={mode === 'draw' ? colors.white : colors.brandGreen} />
                <Text
                  style={[
                    styles.actionPillText,
                    mode === 'draw' && { color: colors.white },
                  ]}
                >
                  {mode === 'draw' ? t('farmer.map.doneDrawing') : t('farmer.map.drawBoundary')}
                </Text>
              </TouchableOpacity>

              {/* Land in several places is the normal case, so adding the next parcel is a
                  first-class control and not buried at the end of the step. */}
              <TouchableOpacity activeOpacity={0.8} style={styles.actionPill} onPress={handleAddLocation}>
                <PlusIcon size={14} color={colors.brandGreen} />
                <Text style={styles.actionPillText}>
                  Add Location
                </Text>
              </TouchableOpacity>

              {isEditing && (
                <View style={styles.editingBadge} pointerEvents="none">
                  <PenIcon size={13} color={P.black} />
                  <Text style={styles.editingText}>
                    {t('farmer.map.editingBadge')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Bottom Card */}
        <View style={styles.bottomCardContainer} pointerEvents="box-none">
          <View style={styles.farmCard}>
            <View style={styles.farmCardHeader}>
              <View style={styles.farmTitleRow}>
                <View style={styles.farmIconWrapper}>
                  {isEditing ? (
                    <PenIcon size={18} color={colors.brandGreen} />
                  ) : (
                    <LeafIcon size={18} color={colors.brandGreen} />
                  )}
                </View>
                {/* The parcel's own name as the farmer typed it above, not a name synthesised from
                    whatever village the map search last landed on. */}
                <Text style={styles.farmName} numberOfLines={1}>
                  {displayName}
                </Text>
              </View>
              {isEditing ? (
                <View style={styles.badgeEditing}>
                  <Text style={styles.badgeEditingText}>
                    <SolidDot size={9} color={P.orange900} />  {t('farmer.registration.step3.editing')}
                  </Text>
                </View>
              ) : positioning === 'drawn' ? (
                <View style={styles.badgeLive}>
                  <Text style={styles.badgeLiveText}>
                    <SolidDot size={9} color={colors.brandGreen} />  {t('farmer.registration.step3.liveGps')}
                  </Text>
                </View>
              ) : positioning === 'manual' ? (
                <View style={styles.badgeManual}>
                  <Text style={styles.badgeManualText}>
                    <SolidDot size={9} color={P.blue700} />  {t('farmer.registration.step3.manualBadge')}
                  </Text>
                </View>
              ) : (
                <View style={styles.badgeNone}>
                  <Text style={styles.badgeNoneText}>
                    <SolidDot size={9} color={P.grey600} />  {t('farmer.registration.step3.notPositioned')}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCol}>
                {/* Measured from this parcel's boundary. The farmer's own figure for it is the
                    "Area (acres)" field above; the total across parcels is the sum of those. */}
                <Text style={styles.statLabel}>MAPPED AREA</Text>
                <Text style={styles.statValue}>
                  {metrics.areaAcres > 0 ? `${metrics.areaAcres.toFixed(2)} ac` : '—'}
                </Text>
                <Text style={styles.statSub}>
                  {metrics.areaHectares > 0 ? `${metrics.areaHectares.toFixed(2)} ha` : ''}
                </Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>FMB PTS</Text>
                <Text style={styles.statValue}>
                  {coords.length > 1 ? coords.length - 1 : coords.length}
                </Text>
                <Text style={styles.statSub}>boundary pts</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>GPS ACCURACY</Text>
                <Text style={[styles.statValue, { color: colors.brandGreen }]}>±8 m</Text>
                <Text style={styles.statSub}>High</Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              style={mode === 'edit' ? styles.doneBtn : styles.editBtn}
              onPress={handleEditBoundary}
              disabled={mode === 'view' && coords.length < 3}
            >
              {mode === 'edit' ? (
                <Text style={styles.doneBtnText}>
                  <CheckIcon size={15} color={colors.white} />  {t('farmer.map.doneEditing')}
                </Text>
              ) : (
                <Text
                  style={[
                    styles.editBtnText,
                    mode === 'view' && coords.length < 3 && { opacity: 0.5 },
                  ]}
                >
                  <PenIcon size={15} color={colors.brandGreen} />  {t('farmer.map.editBoundary')}
                </Text>
              )}
            </TouchableOpacity>

            {/* Fallback for Nilgiris hill terrain, tree cover, older handsets, no GPS lock --
                drawing the boundary above stays the primary path; this is a link beneath it, not
                a second button competing with it. */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.manualToggle}
              onPress={handleToggleManualEntry}
            >
              <Text style={styles.manualToggleText}>
                {manualEntryOpen
                  ? t('farmer.registration.step3.manualEntryHide')
                  : t('farmer.registration.step3.manualEntryToggle')}
              </Text>
            </TouchableOpacity>

            {manualEntryOpen ? (
              <View style={styles.fieldsRow}>
                <View style={styles.fieldCol}>
                  <TextInput
                    style={[
                      styles.fieldInput,
                      {
                        borderColor: colors.borderLight,
                        color: colors.textDark,
                        backgroundColor: colors.white,
                      },
                      manualLatRangeError ? styles.inputError : null,
                    ]}
                    value={manualLatText}
                    onChangeText={handleManualLatChange}
                    keyboardType="numbers-and-punctuation"
                    placeholder={t('farmer.registration.gps.manualLat')}
                    placeholderTextColor={colors.textPlaceholder}
                  />
                  {manualLatRangeError ? (
                    <Text style={styles.fieldErrorText}>{manualLatRangeError}</Text>
                  ) : null}
                </View>
                <View style={styles.fieldCol}>
                  <TextInput
                    style={[
                      styles.fieldInput,
                      {
                        borderColor: colors.borderLight,
                        color: colors.textDark,
                        backgroundColor: colors.white,
                      },
                      manualLngRangeError ? styles.inputError : null,
                    ]}
                    value={manualLngText}
                    onChangeText={handleManualLngChange}
                    keyboardType="numbers-and-punctuation"
                    placeholder={t('farmer.registration.gps.manualLng')}
                    placeholderTextColor={colors.textPlaceholder}
                  />
                  {manualLngRangeError ? (
                    <Text style={styles.fieldErrorText}>{manualLngRangeError}</Text>
                  ) : null}
                </View>
              </View>
            ) : null}
            {manualBothCoordinatesError ? (
              <Text style={styles.fieldErrorText}>{manualBothCoordinatesError}</Text>
            ) : null}

            {coordinatesError ? (
              <Text style={styles.fieldErrorText}>{coordinatesError}</Text>
            ) : null}
          </View>
        </View>
      </View>

      {/* Sticky Bottom Footer */}
      <View
        style={[
          styles.footer,
          {
            borderTopColor: colors.borderDivider,
            backgroundColor: colors.white,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          style={[
            styles.footerBtn,
            styles.backButton,
            { borderColor: colors.brandGreen, backgroundColor: colors.white },
          ]}
          onPress={handleBackPress}
        >
          <Text style={[styles.footerBtnText, { color: colors.brandGreen }]}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={[
            styles.footerBtn,
            styles.nextButton,
            { backgroundColor: colors.brandGreen },
          ]}
          onPress={handleNext}
        >
          <Text style={[styles.footerBtnText, { color: colors.white }]}>
            {isLastLocation ? 'Next' : 'Next Location'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 12,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 14,
  },
  progressSegment: {
    flex: 1,
    height: 5,
    borderRadius: 3,
  },
  locationMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  locationMetaText: {
    fontSize: typography.caption,
    fontWeight: weights.bold,
  },
  removeLocationBtn: {
    paddingVertical: spacing.xs,
    paddingLeft: spacing.md,
  },
  removeLocationText: {
    fontSize: typography.bodySmall,
    fontWeight: weights.semibold,
  },
  fieldsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  fieldCol: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: typography.bodySmall,
    fontWeight: weights.semibold,
    marginBottom: spacing.xs,
  },
  fieldInput: {
    width: '100%',
    height: MIN_TOUCH_TARGET,
    borderWidth: 1.5,
    borderRadius: radius.card,
    paddingHorizontal: spacing.compact,
    fontSize: typography.body,
  },
  inputError: {
    borderColor: colors.requiredRed,
    borderWidth: 1.5,
  },
  fieldErrorText: {
    color: colors.requiredRed,
    fontSize: typography.bodySmall,
    marginTop: spacing.xs,
  },
  mapArea: {
    flex: 1,
    position: 'relative',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.card,
  },
  emptyStateText: {
    fontSize: typography.body,
    textAlign: 'center',
  },
  searchContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
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
    fontSize: 14,
    color: P.nearBlack,
    marginLeft: 8,
    paddingVertical: 0,
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
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
  suggestionsList: {
    marginTop: 8,
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
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
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
    fontSize: 14,
    fontWeight: '700',
    color: P.ink,
    marginBottom: 2,
  },
  suggestionSubtitle: {
    fontSize: 12,
    color: P.muted,
  },
  topMapControls: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  coordsBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    paddingHorizontal: 12,
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
    fontSize: 12,
    fontWeight: '700',
  },
  rightControls: {
    gap: 8,
    alignItems: 'flex-end',
  },
  editingBadge: {
    backgroundColor: P.amber600,
    paddingHorizontal: 12,
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
    fontSize: 12,
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
  actionPillText: {
    color: P.nearBlack,
    fontSize: 12,
    fontWeight: '700',
  },
  bottomCardContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  farmCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    shadowColor: P.black,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  farmCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  farmTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  farmName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: P.nearBlack,
  },
  farmIconWrapper: {
    backgroundColor: colors.brandGreenLight,
    padding: 8,
    borderRadius: 10,
  },
  badgeLive: {
    backgroundColor: colors.brandGreenLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeLiveText: {
    color: colors.brandGreen,
    fontSize: 11,
    fontWeight: '700',
  },
  badgeEditing: {
    backgroundColor: P.orange50,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeEditingText: {
    color: P.orange900,
    fontSize: 11,
    fontWeight: '700',
  },
  badgeManual: {
    backgroundColor: P.blue50,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeManualText: {
    color: P.blue700,
    fontSize: 11,
    fontWeight: '700',
  },
  badgeNone: {
    backgroundColor: P.grey100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeNoneText: {
    color: P.grey600,
    fontSize: 11,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCol: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    color: P.grey600,
    fontWeight: '700',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: P.nearBlack,
  },
  statSub: {
    fontSize: 10,
    color: P.grey600,
    marginTop: 2,
  },
  editBtn: {
    borderWidth: 1.5,
    borderColor: colors.brandGreen,
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBtnText: {
    color: colors.brandGreen,
    fontSize: 15,
    fontWeight: '700',
  },
  manualToggle: {
    marginTop: 12,
    alignSelf: 'center',
  },
  manualToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.brandGreen,
  },
  doneBtn: {
    backgroundColor: colors.brandGreen,
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 12,
  },
  footerBtn: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    borderWidth: 1.5,
  },
  nextButton: {
    borderWidth: 0,
  },
  footerBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
