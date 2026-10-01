import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Keyboard,
  Modal,
  KeyboardAvoidingView,
  Platform,
  PanResponder,
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

// Mirror of ChevronLeft's own path (same viewBox/stroke), for the location-slider's "next" arrow.
const ChevronRight = ({ size = 24, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="m9 18 6-6-6-6"/>
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

const MinusIcon = ({ size = 24, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

const TrashIcon = ({ size = 24, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 6h18"/>
    <Path d="M8 6V4h8v2"/>
    <Path d="M19 6l-1 14H6L5 6"/>
    <Line x1="10" y1="11" x2="10" y2="17"/>
    <Line x1="14" y1="11" x2="14" y2="17"/>
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
import {
  classifyManualPoints,
  isValidLatitudeText,
  isValidLongitudeText,
  makeManualRow,
  manualRowIssue,
  manualSeedOf,
  type BoundaryOrigin,
  type LngLat,
  type ManualPointRow,
  type ManualRowIssue,
  type ParcelPositioning,
} from './manualPoints';
import { t, type TranslationKey } from '../../../../i18n/farmer';

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
 * The saved parcel's own manually-typed position, if it has one and no ring -- used only for the
 * map's mount-time camera centre. A ring always wins (its centroid lives in these same two fields
 * but is not manual data), mirroring the seeding rules in `manualSeedOf` (./manualPoints.ts).
 */
function savedManualPinOf(location: FarmLocationData | undefined): LngLat | null {
  if (ringOf(location).length > 0) return null;
  if (location?.latitude === undefined || location?.longitude === undefined) return null;
  return isValidLatitudeText(String(location.latitude)) && isValidLongitudeText(String(location.longitude))
    ? [location.longitude, location.latitude]
    : null;
}

/** i18n key for one manual point row's own inline problem (see `manualRowIssue`). */
const MANUAL_ROW_ISSUE_KEY: Record<ManualRowIssue, TranslationKey> = {
  incomplete: 'farmer.registration.step3.bothCoordinates',
  latitudeRange: 'farmer.registration.step3.latitudeRange',
  longitudeRange: 'farmer.registration.step3.longitudeRange',
};

/** Coordinates written back into manual rows from a dragged vertex: ~0.1 m, more than GPS gives. */
const MANUAL_COORD_DECIMALS = 6;
function formatManualCoord(value: number): string {
  return String(Number(value.toFixed(MANUAL_COORD_DECIMALS)));
}

/**
 * How far, and how much more horizontal than vertical, a drag on the bottom card must travel
 * before the swipe-between-locations gesture (see `swipeResponder` below) claims it. Both guard
 * against the same failure: a plain tap (near-zero movement either way) or an accidental small
 * wobble must still reach the Edit/Delete Boundary buttons or a manual-entry field underneath,
 * not be swallowed as a page change.
 */
const SWIPE_MIN_DISTANCE = 48; // logical px -- comfortably past a stray touch, short of a full drag
const SWIPE_DIRECTION_RATIO = 1.5; // |dx| must beat |dy| by this much before it reads as horizontal

/**
 * `validation.ts` keys every per-location error by the parcel's POSITION -- `locations.2.label`,
 * `locations.2.areaAcres`, `locations.2.coordinates`. These helpers are the only places that
 * knowledge lives, so an error can be routed to the parcel it is actually about instead of being
 * shown against whichever one happens to be on screen. The trailing dot matters: without it
 * `locations.1.` would also claim `locations.10.label`.
 */
function hasErrorsFor(errors: Record<string, string>, index: number): boolean {
  const prefix = `locations.${index}.`;
  return Object.keys(errors).some((key) => key.startsWith(prefix));
}

/**
 * Whether the parcel at `index` has a problem with one of the two fields that live in the
 * location-details popup (name, area) -- as opposed to only a positioning problem, which is fixed
 * on the map, not in the popup.
 */
function hasDetailsErrorsFor(errors: Record<string, string>, index: number): boolean {
  return Boolean(errors[`locations.${index}.label`] || errors[`locations.${index}.areaAcres`]);
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
  // The parcel on screen as of the latest render, readable from a callback created on an earlier
  // one -- see `confirmDestructive`, whose confirm button must not act on a parcel the farmer has
  // since switched away from.
  const activeLocationIdRef = useRef<string | undefined>(activeLocation?.id);
  activeLocationIdRef.current = activeLocation?.id;

  // The active parcel's fields, mirrored out of `locations` while they are being typed into.
  // `areaAcres` is a number on FarmLocationData but a string here, because a half-typed number is
  // not a number: parsing on every keystroke turns "2." into 2 and eats the decimal point the
  // farmer was in the middle of typing. It is parsed once, when the parcel is committed.
  const [label, setLabel] = useState(activeLocation?.label ?? '');
  const [areaAcresText, setAreaAcresText] = useState(
    activeLocation?.areaAcres ? String(activeLocation.areaAcres) : '',
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // The active parcel's name and area are entered in a popup rather than inline, so they do not
  // take permanent space over the map. The popup edits its own DRAFT copy so that Cancel really
  // discards; only Save writes through to `label`/`areaAcresText` above, which remain the single
  // source of truth that `commitActiveLocation` reads. The drafts are always seeded explicitly by
  // `openDetailsModal` -- never left over from a previous opening -- and `goToLocation` closes the
  // popup, so it can never show one parcel's name while another parcel is active.
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [draftLabel, setDraftLabel] = useState('');
  const [draftAreaAcresText, setDraftAreaAcresText] = useState('');
  const areaInputRef = useRef<TextInput>(null);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([]);
  const [selectedVillage, setSelectedVillage] = useState(activeLocation?.village ?? '');
  const [selectedTaluk, setSelectedTaluk] = useState(activeLocation?.taluk ?? '');
  const [selectedDistrict, setSelectedDistrict] = useState(activeLocation?.district ?? '');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [coords, setCoords] = useState<number[][]>(() => ringOf(activeLocation));

  // Manual fallback for this parcel: a list of typed points -- one point is a pin (today's
  // single-coordinate fallback), three or more are a real outline. Seeded by `manualSeedOf` from
  // whatever is already on the (restored or freshly-committed) parcel, so reopening it shows what
  // it actually has, and the panel starts open exactly when there is manual data to show. The seed
  // is computed once here (row ids are generated per call) and re-derived by `goToLocation`.
  const [initialManualSeed] = useState(() => manualSeedOf(activeLocation));
  const [manualPoints, setManualPoints] = useState<ManualPointRow[]>(initialManualSeed.rows);
  const [manualEntryOpen, setManualEntryOpen] = useState(initialManualSeed.entryOpen);
  // Where the boundary on the map came from -- see `BoundaryOrigin`. A manual boundary's rows are
  // its source of truth, so a drag must be written back into them and reopening the panel must not
  // wipe it; a tap-drawn one has no rows and is replaced (with a confirm) by opening the panel.
  const [boundaryOrigin, setBoundaryOrigin] = useState<BoundaryOrigin>(initialManualSeed.origin);
  // The map has nothing else to show for a single manually-typed point (no polygon), so this is
  // the pin FarmBoundaryMap renders for it -- see its `markerCoordinate` prop. Seeded from the same
  // source as `manualPoints` above so a restored draft's marker (and, via `mapInitialCenter` below,
  // the camera) is correct on the very first render, not only after the farmer retypes something.
  // Kept as its own [lng, lat] pair rather than derived inline from the rows because it must NOT
  // track every keystroke -- see `syncManualToMap`.
  const [manualMarkerCoord, setManualMarkerCoord] = useState<LngLat | null>(
    initialManualSeed.markerCoord,
  );
  // Deliberately separate from `debounceTimerRef` (place-search): the manual-coordinates fields
  // stay mounted and editable even while the search overlay is showing (see the JSX below -- the
  // bottom card with the manual panel isn't inside the `isSearchOpen` branch), so a shared timer
  // could have a manual-entry keystroke cancel a pending search fetch or vice versa.
  const manualCoordsDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  // True only for the duration of a `clear()`/`setPolygon()` call THIS screen makes (see
  // `applyProgrammaticPolygonChange`). FarmBoundaryMap's `emit` calls `onPolygonChange`
  // synchronously, so `handlePolygonChange` runs inside that window and can tell the screen's own
  // change from a real tap or drag. Without it, pushing a typed polygon onto the map would look
  // like the farmer finishing a drawn boundary: the manual panel would collapse and the origin flip
  // to 'map' under the rows that actually produced it.
  const programmaticPolygonChangeRef = useRef(false);
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

  const manualShape = classifyManualPoints(manualPoints);
  // Whether the typed rows, rather than the map, decide this parcel's position. They do while the
  // panel is open (opening it over a tap-drawn boundary clears that boundary first), when there is
  // no boundary at all (a pin typed and then the panel closed -- the old single-point behaviour),
  // and whenever the boundary on the map IS the typed one. A tap-drawn boundary completed while the
  // panel was open collapses the panel and sets the origin to 'map' (`handlePolygonChange`), which
  // is what hands authority back to the map.
  const isManualAuthoritative = manualEntryOpen || !hasBoundary || boundaryOrigin === 'manual';
  // Only a lone point or a real outline is ever committed from the rows; every other shape leaves
  // the parcel un-positioned for `validation.ts` to flag, exactly as a half-typed pair used to.
  const committedManualShape =
    isManualAuthoritative && (manualShape.kind === 'point' || manualShape.kind === 'polygon')
      ? manualShape
      : null;
  // Row-list-level feedback under the rows. Per-row range/half-filled problems are shown on the row
  // itself (`manualRowIssue`), so these two only cover shapes whose every row is individually fine.
  const manualShapeError =
    manualShape.kind === 'tooFew'
      ? t('farmer.registration.step3.manualPointsTooFew')
      : manualShape.kind === 'noArea'
        ? t('farmer.registration.step3.manualPointsNoArea')
        : null;
  /**
   * How the active parcel is positioned, mirroring `positioningOf` in Step5Review.tsx and the admin
   * detail component -- but read off this screen's in-progress editing state (the boundary being
   * drawn, the coordinates being typed) rather than an already-committed `FarmLocationData`, since
   * the on-screen badge exists so the farmer can see the effect of what they are doing right now.
   * A typed outline reads as 'manual' even though it is drawn on the map, matching what
   * `commitActiveLocation` records for it (`gpsCaptured: false`).
   */
  const positioning: ParcelPositioning = committedManualShape
    ? 'manual'
    : hasBoundary
      ? 'drawn'
      : 'none';

  /** The parcel's own name, or a positional stand-in until the farmer types one. */
  const displayName = label.trim() || `Location ${activeIndex + 1}`;

  const labelError = fieldErrors[`locations.${activeIndex}.label`];
  const areaError = fieldErrors[`locations.${activeIndex}.areaAcres`];
  const coordinatesError = fieldErrors[`locations.${activeIndex}.coordinates`];
  const locationsError = fieldErrors['locations'];

  // Small dot shown next to the parcel name in the bottom card's title row, carrying what the old
  // chip strip's per-chip dot used to show for the active chip: a still-unresolved field error
  // outranks the positioning colour, since an error is the more urgent thing for the farmer to
  // notice while stepping through parcels with the prev/next arrows -- the badge on the same row
  // reports positioning only, not this.
  const activeDotColor = hasErrorsFor(fieldErrors, activeIndex)
    ? colors.requiredRed
    : positioning === 'drawn'
      ? colors.brandGreen
      : positioning === 'manual'
        ? P.blue700
        : P.grey600;

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  /**
   * Opens the location-details popup seeded with the given values. The seed is passed in rather
   * than read from `label`/`areaAcresText` because the callers that open it straight after a
   * parcel switch (`handleAddLocation`, `handleNext`) run in the same tick as `goToLocation`,
   * before its `setLabel`/`setAreaAcresText` have landed -- reading state there would seed the
   * popup with the parcel being LEFT.
   */
  function openDetailsModal(seedLabel: string, seedAreaAcresText: string) {
    setDraftLabel(seedLabel);
    setDraftAreaAcresText(seedAreaAcresText);
    setIsDetailsModalOpen(true);
  }

  /** Bottom card's name: reopens the popup for the parcel already on screen, to fix a typo. */
  function handleEditDetails() {
    openDetailsModal(label, areaAcresText);
  }

  /**
   * Writes the drafts through exactly as the old inline inputs' `onChangeText` did -- same setters,
   * same error keys cleared. Deliberately NOT a validation gate: saving a blank name is allowed
   * here and is caught by `validateStep` on Next / Add Location, the same as leaving the old
   * inline field blank was, so there is still exactly one place that decides a parcel is complete.
   */
  function handleSaveDetails() {
    setLabel(draftLabel);
    setAreaAcresText(draftAreaAcresText);
    clearFieldError(`locations.${activeIndex}.label`);
    clearFieldError(`locations.${activeIndex}.areaAcres`);
    setIsDetailsModalOpen(false);
  }

  /** Discards the drafts; `label`/`areaAcresText` keep whatever they held before opening. */
  function handleCancelDetails() {
    setIsDetailsModalOpen(false);
  }

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
  // is a manually-typed point -- `savedManualPinOf` already returns null when a ring exists, so
  // this and `savedRingMetrics` can never both be non-null for the same parcel. A restored manual
  // POLYGON needs nothing extra here: it is just a saved ring, so `mapInitialPolygon` shows it on
  // remount like any other, without a `setPolygon` call.
  const savedManualPin = savedManualPinOf(activeLocation);
  const mapInitialCenter: [number, number] | null = savedRingMetrics
    ? [savedRingMetrics.centroid.longitude, savedRingMetrics.centroid.latitude]
    : savedManualPin;
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

  function cancelManualSync() {
    if (manualCoordsDebounceTimerRef.current) {
      clearTimeout(manualCoordsDebounceTimerRef.current);
      manualCoordsDebounceTimerRef.current = null;
    }
  }

  /**
   * Runs a `clear()`/`setPolygon()` call this screen initiates with `programmaticPolygonChangeRef`
   * raised -- see that ref. `try/finally` so an exception inside the map can never leave the flag
   * stuck on and make every later real tap/drag look programmatic.
   */
  function applyProgrammaticPolygonChange(change: () => void) {
    programmaticPolygonChangeRef.current = true;
    try {
      change();
    } finally {
      programmaticPolygonChangeRef.current = false;
    }
  }

  function handlePolygonChange(next: [number, number][]) {
    setCoords(next);
    if (programmaticPolygonChangeRef.current) {
      // The screen's own change (a typed outline pushed onto the map, or a clear). The rows already
      // describe it, so there is nothing to collapse, re-sync or re-attribute.
      return;
    }
    // Anything past here is a real tap (draw mode) or vertex drag (edit mode). A drag of a TYPED
    // outline keeps its rows in step with the moved vertices -- otherwise the rows, which are that
    // boundary's source of truth, would silently drift from what the farmer sees, and reopening
    // the panel or committing would snap it back. The map is deliberately not re-pushed here:
    // `setPolygon` returns to view mode, which would end the farmer's edit session mid-adjustment.
    if (mode === 'edit' && boundaryOrigin === 'manual' && next.length >= 3) {
      const vertices = next.slice(0, -1); // `onPolygonChange` hands over a closed ring
      setManualPoints((prev) =>
        vertices.map(([vertexLng, vertexLat], index) => ({
          id: prev[index]?.id ?? makeManualRow().id,
          latText: formatManualCoord(vertexLat),
          lngText: formatManualCoord(vertexLng),
        })),
      );
      clearFieldError(`locations.${activeIndex}.coordinates`);
      return;
    }
    // A tap-drawn vertex. Only real taps and drags reach here, and a typed outline can only be
    // replaced by drawing after `resetPositioning` (which already sets 'map'), so this is always
    // a map-drawn boundary.
    setBoundaryOrigin('map');
    if (next.length >= 3) {
      clearFieldError(`locations.${activeIndex}.coordinates`);
      // A completed boundary outranks manual entry for this parcel (see `commitActiveLocation`),
      // so collapse the panel rather than show two positioning methods as if both still applied.
      setManualEntryOpen(false);
      // A manual-marker fly/reveal queued from typing just before the boundary was completed
      // would otherwise land a beat later and yank the camera off the boundary the farmer just
      // finished drawing -- `committedManualShape` (and so the marker prop below) already flips
      // off the instant the panel collapses, but the queued `flyTo` itself isn't gated by that.
      cancelManualSync();
    }
  }

  function handleLocateMe() {
    void mapRef.current?.locateMe();
  }

  /**
   * The screen's one confirm-before-destroying dialog: React Native's own `Alert.alert` with a
   * cancel and a destructive button, the same shape PayrollScreen's `handlePayout` uses --
   * @tohfa/mobile-ui has no shared dialog component to use instead.
   *
   * The confirm callback runs on a later tick than the one that opened the dialog, so it re-checks
   * that the same parcel is still on screen: wiping a boundary is only ever meant for the parcel
   * the farmer was looking at when they asked.
   */
  function confirmDestructive(
    title: string,
    message: string,
    confirmLabel: string,
    onConfirm: () => void,
  ) {
    const parcelIdAtOpen = activeLocation?.id;
    Alert.alert(title, message, [
      { text: t('farmer.common.cancel'), style: 'cancel' },
      {
        text: confirmLabel,
        style: 'destructive',
        onPress: () => {
          if (activeLocationIdRef.current !== parcelIdAtOpen) return;
          onConfirm();
        },
      },
    ]);
  }

  /**
   * Returns the active parcel to "not positioned": no boundary on the map, no typed points, no pin.
   * The single place redraw, delete and replace-with-manual all go through, so none of them can
   * forget a piece -- `coords` is also reset directly, not only via the map's `onPolygonChange`,
   * because the map ref can be momentarily absent (e.g. mid-remount) and the screen's own copy
   * must not keep a boundary the map no longer has.
   *
   * Nothing is written to `locations` here: like every other edit on this screen, it lands the
   * next time the parcel is committed (Next, Add Location, Back, Skip, or a location chip).
   */
  function resetPositioning() {
    cancelManualSync();
    applyProgrammaticPolygonChange(() => mapRef.current?.clear());
    setCoords([]);
    setManualPoints([makeManualRow()]);
    setManualEntryOpen(false);
    setManualMarkerCoord(null);
    setBoundaryOrigin('map');
  }

  /**
   * Opens or closes the manual-coordinates panel for the active parcel. Opening it commits to the
   * manual path: a drawn boundary and typed coordinates are mutually exclusive positions for one
   * parcel (`commitActiveLocation`, and `positioningOf` in Step5Review.tsx, always trust a stored
   * polygon over lat/lng), so a tap-drawn boundary is cleared -- after a confirm, since that is the
   * same silent-data-loss bug class as an unconfirmed redraw -- rather than left behind to silently
   * win back over what the farmer is about to type. Stray 0-2 vertices are not a boundary and are
   * cleared without asking, as they always were. A TYPED outline is just reopened: its rows already
   * are its source of truth, so there is nothing to replace.
   *
   * Closing the panel (to go back to drawing) leaves whatever was typed in place -- harmless, since
   * a boundary drawn afterwards is what gets saved regardless.
   */
  function handleToggleManualEntry() {
    if (manualEntryOpen) {
      setManualEntryOpen(false);
      return;
    }
    if (coords.length >= 3 && boundaryOrigin === 'map') {
      confirmDestructive(
        t('farmer.registration.step3.replaceWithManualConfirmTitle'),
        t('farmer.registration.step3.replaceWithManualConfirmBody'),
        t('farmer.registration.step3.replaceWithManualConfirmAction'),
        () => {
          mapRef.current?.finish();
          resetPositioning();
          setManualEntryOpen(true);
        },
      );
      return;
    }
    if (mode !== 'view') {
      mapRef.current?.finish();
    }
    if (coords.length > 0 && boundaryOrigin === 'map') {
      applyProgrammaticPolygonChange(() => mapRef.current?.clear());
    }
    setManualEntryOpen(true);
  }

  /**
   * Mirrors the typed rows onto the map. A still-incomplete or mid-edit list never moves the map:
   * only a shape that is usable *and* the farmer has paused on gets flown to and shown, using the
   * place-search debounce (`handleSearchChange` above, same `setTimeout`/`clearTimeout` idiom and
   * delay). Every call restarts the timer, so a fast run of keystrokes collapses into one update.
   *
   * The one thing that is NOT debounced is taking a typed outline back off the map the moment the
   * rows stop describing one -- a boundary left showing for 300 ms after the farmer broke it would
   * be on screen, and in `coords`, without anything backing it.
   */
  function syncManualToMap(rows: ManualPointRow[]) {
    cancelManualSync();
    const shape = classifyManualPoints(rows);
    if (shape.kind !== 'polygon' && boundaryOrigin === 'manual' && coords.length > 0) {
      // Typing while the typed outline is being drag-edited: leave edit mode too, rather than
      // strand the map in it with no vertices left to drag.
      if (mode !== 'view') mapRef.current?.finish();
      applyProgrammaticPolygonChange(() => mapRef.current?.clear());
    }
    if (shape.kind === 'point') {
      manualCoordsDebounceTimerRef.current = setTimeout(() => {
        setManualMarkerCoord(shape.point);
        mapRef.current?.flyTo(shape.point, 16, 900);
      }, 300);
    } else if (shape.kind === 'polygon') {
      manualCoordsDebounceTimerRef.current = setTimeout(() => {
        applyProgrammaticPolygonChange(() => mapRef.current?.setPolygon(shape.ring));
        setBoundaryOrigin('manual');
        const { centroid } = calculatePolygonMetrics(shape.ring);
        mapRef.current?.flyTo([centroid.longitude, centroid.latitude], 16, 900);
      }, 300);
    }
  }

  /** Every edit to the rows goes through here, so the error clear and map sync can't be skipped. */
  function updateManualPoints(rows: ManualPointRow[]) {
    setManualPoints(rows);
    const shape = classifyManualPoints(rows);
    if (shape.kind === 'point' || shape.kind === 'polygon') {
      clearFieldError(`locations.${activeIndex}.coordinates`);
    }
    syncManualToMap(rows);
  }

  function handleManualPointChange(rowId: string, field: 'latText' | 'lngText', text: string) {
    updateManualPoints(
      manualPoints.map((row) => (row.id === rowId ? { ...row, [field]: text } : row)),
    );
  }

  /** A new blank row. Blank rows are ignored by `classifyManualPoints`, so no map sync is needed. */
  function handleAddManualPoint() {
    setManualPoints((prev) => [...prev, makeManualRow()]);
  }

  /** Removes one row; the list always keeps at least one (the control is hidden at one row). */
  function handleRemoveManualPoint(rowId: string) {
    if (manualPoints.length <= 1) return;
    updateManualPoints(manualPoints.filter((row) => row.id !== rowId));
  }

  /**
   * Top pill: draws this parcel's boundary. Redrawing over a real boundary (3+ vertices, drawn or
   * typed) used to wipe it instantly, before a single new point was placed -- so that now asks
   * first, and only then starts from a clean slate. 0-2 stray vertices are not a boundary yet, so
   * pressing the pill just resumes drawing onto them, no prompt.
   */
  function handleDrawBoundary() {
    if (mode === 'draw') {
      mapRef.current?.finish();
      return;
    }
    if (coords.length >= 3) {
      confirmDestructive(
        t('farmer.registration.step3.redrawConfirmTitle'),
        t('farmer.registration.step3.redrawConfirmBody'),
        t('farmer.registration.step3.redrawConfirmAction'),
        () => {
          resetPositioning();
          mapRef.current?.startDrawing();
        },
      );
      return;
    }
    mapRef.current?.startDrawing();
  }

  /**
   * Bottom card: deliberately removes this parcel's boundary (drawn or typed), after a confirm.
   * Until now clearing only ever happened as an unannounced side effect of redrawing or opening the
   * manual panel. See `resetPositioning` for why nothing is written to `locations` immediately.
   */
  function handleDeleteBoundary() {
    confirmDestructive(
      t('farmer.registration.step3.deleteBoundaryConfirmTitle'),
      t('farmer.registration.step3.deleteBoundaryConfirmBody'),
      t('farmer.registration.step3.deleteBoundaryConfirmAction'),
      () => {
        mapRef.current?.finish();
        resetPositioning();
      },
    );
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
   *
   * `gpsCaptured` records whether the boundary came off the map, and is also how a typed outline
   * is recognised again later: a saved ring with `gpsCaptured === false` is a manual one (see
   * `manualSeedOf`), so no extra field is needed to reopen it in the rows it was typed into.
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
      gpsCaptured: false,
    };
    if (committedManualShape?.kind === 'polygon') {
      // A typed outline. Read from the rows' own ring rather than `coords`: the map copy is only
      // updated after the 300 ms `syncManualToMap` debounce, and a farmer who types the last corner
      // and taps Next straight away must still save what they typed. It is a real outline, so it
      // carries a real measured area, unlike the single pin below.
      const manualMetrics = calculatePolygonMetrics(committedManualShape.ring);
      next.latitude = manualMetrics.centroid.latitude;
      next.longitude = manualMetrics.centroid.longitude;
      next.calculatedAreaAcres = manualMetrics.areaAcres;
      next.calculatedAreaHectares = manualMetrics.areaHectares;
      next.fmbPolygon = { type: 'Polygon', coordinates: [committedManualShape.ring] };
    } else if (committedManualShape?.kind === 'point') {
      // A single typed point: `gpsCaptured` stays `false`, and there is deliberately no
      // `fmbPolygon`, `calculatedAreaAcres` or `calculatedAreaHectares` here -- a single pinned
      // point is not a surveyed outline, and fabricating an area from it would misrepresent
      // evidence quality the same way `positioningOf` (Step5Review.tsx, and the admin detail
      // component) relies on being able to tell drawn and manual parcels apart. The farmer's own
      // "Area (acres)" figure above is the only area this parcel carries.
      next.latitude = committedManualShape.point[1];
      next.longitude = committedManualShape.point[0];
    } else if (hasBoundary) {
      // Keyed off the origin rather than hard-coded `true`: whenever the boundary on the map is a
      // typed one, `committedManualShape` above already covers it, so this is the tap-drawn case
      // -- but a manual boundary must never be recorded as GPS evidence even if that ever slips.
      next.gpsCaptured = boundaryOrigin === 'map';
      next.latitude = metrics.centroid.latitude;
      next.longitude = metrics.centroid.longitude;
      next.calculatedAreaAcres = metrics.areaAcres;
      next.calculatedAreaHectares = metrics.areaHectares;
      next.fmbPolygon = { type: 'Polygon', coordinates: [coords] };
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
    // The details popup edits drafts of the parcel that was active when it opened; left open across
    // a switch it would show (and on Save write) the previous parcel's name onto this one. Callers
    // that want it open on the new parcel reopen it afterwards with an explicit seed.
    setIsDetailsModalOpen(false);
    // Manual entry is per-parcel state exactly like the boundary above -- without this reset, a
    // parcel with no manual coordinates of its own would show whatever the previous parcel's
    // farmer-typed points happened to be, with the panel left open to match. The origin is reset
    // with them: it is what tells a typed outline (rows are its truth) from a drawn one.
    const manualSeed = manualSeedOf(target);
    setManualPoints(manualSeed.rows);
    setManualEntryOpen(manualSeed.entryOpen);
    setBoundaryOrigin(manualSeed.origin);
    // A pending debounced fly/mark/outline from the parcel being left would otherwise fire after
    // this switch and plant the previous parcel's marker, boundary (and camera) on the new one --
    // the exact boundary-bleed bug class this screen has already been fixed for once. Cancel it,
    // then set the new parcel's marker immediately (not debounced) so a restored draft's pin and
    // camera are right away, not only after the farmer retypes something -- `mapInitialCenter`
    // above handles the camera side of that via the map's remount `key`; this is the marker side.
    cancelManualSync();
    setManualMarkerCoord(manualSeed.markerCoord);
  }

  /**
   * Appends a blank parcel with its own fresh id and opens it, with the details popup already up
   * so the farmer names it straight away.
   */
  function handleAddLocation() {
    const list = commitActiveLocation();
    const { errors } = validateStep(3, { locations: list });
    // Don't let an unfinished parcel be buried under a new one — the farmer would have to find
    // their way back to it at the end of the step to learn what was missing.
    if (activeLocation && hasErrorsFor(errors, activeIndex)) {
      setFieldErrors(errors);
      // The name/area inputs are no longer on screen, so put them in front of the farmer.
      if (hasDetailsErrorsFor(errors, activeIndex)) openDetailsModal(label, areaAcresText);
      return;
    }
    const updated = [...list, makeBlankLocation()];
    setLocations(updated);
    setFieldErrors({});
    goToLocation(updated.length - 1, updated);
    // After `goToLocation`, which closes the popup; the new parcel is blank by construction.
    openDetailsModal('', '');
  }

  /** Saves the parcel on screen, then moves to the next one — or leaves the step. */
  function handleNext() {
    const list = commitActiveLocation();
    const { errors } = validateStep(3, { locations: list });

    // The parcel on screen is checked first, so its errors are reported where the farmer is
    // standing rather than after a jump somewhere else.
    if (hasErrorsFor(errors, activeIndex)) {
      setFieldErrors(errors);
      if (hasDetailsErrorsFor(errors, activeIndex)) openDetailsModal(label, areaAcresText);
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
      // Seeded from `list`, not from state: `goToLocation`'s setters have not landed yet.
      if (hasDetailsErrorsFor(errors, firstBad)) {
        const target = list[firstBad];
        openDetailsModal(target?.label ?? '', target?.areaAcres ? String(target.areaAcres) : '');
      }
      return;
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    onSave({ locations: list });
  }

  /**
   * A location chip: jump straight to that parcel. Commits the one on screen first and switches via
   * `goToLocation`, exactly like Next/Back/Add/Remove, so no per-parcel state (search, manual
   * entry, the details popup) can leak across. No validation gate -- like Back, moving around is
   * always allowed; Next is still what decides the step is complete.
   *
   * Errors already on screen are narrowed rather than kept or cleared wholesale: whatever the
   * commit just fixed drops out, so a chip's red dot means "still wrong", but no parcel gains an
   * error it wasn't already showing -- flagging parcels the farmer hasn't finished yet merely for
   * walking past them is Next's job, not this one's.
   */
  function handleSelectLocation(index: number) {
    if (index === activeIndex) return;
    const list = commitActiveLocation();
    setFieldErrors((prev) => {
      const keys = Object.keys(prev);
      if (keys.length === 0) return prev;
      const { errors } = validateStep(3, { locations: list });
      const stillFailing: Record<string, string> = {};
      for (const key of keys) {
        const message = errors[key];
        if (message) stillFailing[key] = message;
      }
      return stillFailing;
    });
    goToLocation(index, list);
  }

  /**
   * Bottom card: swipe left/right to jump to the next/previous parcel. Dispatches to
   * `handleSelectLocation` -- the same place a chip tap goes -- rather than duplicating its
   * commit-and-narrow-errors logic, so a swipe and a chip tap can never disagree about what
   * "move to that parcel" means. Clamped at the first/last parcel (no wraparound, the same edge
   * the chip strip itself has) and a no-op with a single parcel, the same condition that hides
   * the chip strip and the swipe hint in the JSX below.
   */
  function handleSwipeNavigate(direction: 1 | -1) {
    if (locations.length <= 1) return;
    const target = activeIndex + direction;
    if (target < 0 || target >= locations.length) return;
    handleSelectLocation(target);
  }

  // `swipeResponder` below is built once via `useRef`, so the function IT calls has to be read out
  // of a ref rather than closed over directly -- otherwise every swipe would keep running the very
  // first render's `handleSwipeNavigate`, which closes over that render's `locations`/`activeIndex`
  // and would act on whichever parcel was on screen when the responder was created, not the one the
  // farmer is actually looking at. Same idea as `activeLocationIdRef` near the top of the
  // component, just for a function instead of an id.
  const handleSwipeNavigateRef = useRef(handleSwipeNavigate);
  handleSwipeNavigateRef.current = handleSwipeNavigate;

  // Built once: re-creating a PanResponder every render would reset its internal touch-tracking
  // mid-gesture. `onStartShouldSetPanResponder` is always false, so a touch-down never claims
  // anything by itself; only `onMoveShouldSetPanResponder`, gated on real horizontal movement past
  // `SWIPE_MIN_DISTANCE`/`SWIPE_DIRECTION_RATIO`, ever does. A plain tap on the Edit/Delete
  // Boundary buttons or a manual-entry field -- which never crosses that threshold -- is therefore
  // never intercepted and reaches the control underneath exactly as if this responder did not
  // exist. This is spread onto `farmCard` only while there are 2+ locations (see the JSX below),
  // matching the chip strip's own condition -- with one parcel there is nothing to swipe to.
  const swipeResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_evt, gestureState) => {
        const { dx, dy } = gestureState;
        return (
          Math.abs(dx) > SWIPE_MIN_DISTANCE && Math.abs(dx) > Math.abs(dy) * SWIPE_DIRECTION_RATIO
        );
      },
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderRelease: (_evt, gestureState) => {
        // A negative dx is a finger moving left -- "swipe left" -- which reveals the NEXT parcel;
        // a positive dx moves right, to the PREVIOUS one. Same convention a horizontally-scrolling
        // page uses.
        if (gestureState.dx < 0) {
          handleSwipeNavigateRef.current(1);
        } else if (gestureState.dx > 0) {
          handleSwipeNavigateRef.current(-1);
        }
      },
    }),
  ).current;

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

  // Unreachable in normal use: the screen seeds one blank parcel and there is no action anywhere
  // on this screen that drops the last one. Kept as a guard so a corrupted restored draft cannot
  // mount the map with no parcel for the boundary to belong to — and offers the one action that
  // recovers from it.
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

        {locationsError ? <Text style={styles.fieldErrorText}>{locationsError}</Text> : null}
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
          // Only a lone typed point has a pin, matching `commitActiveLocation`'s own branching on
          // `committedManualShape` -- which stops being a point the instant a tap-drawn boundary
          // takes over (the panel collapses, the origin becomes 'map'), so the marker disappears
          // with no extra condition here. FarmBoundaryMap also suppresses it under any boundary.
          markerCoordinate={committedManualShape?.kind === 'point' ? manualMarkerCoord : null}
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
            <View style={styles.leftMapControls} pointerEvents="box-none">
              <View style={styles.coordsBadge} pointerEvents="none">
                <Crosshair size={13} color={colors.brandGreen} />
                <Text style={styles.coordsText}>
                  {lat}, {lng}
                </Text>
              </View>

              {/* Standard stacked +/- map zoom stepper. Kept in its own column, well away from
                  the Search/Locate Me/Draw Boundary/Add Location pills on the right and from the
                  bottom farm-details card, so it reads as its own control rather than crowding
                  either. Wired to FarmBoundaryMap's zoomIn/zoomOut handle methods. */}
              <View style={styles.zoomControl}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.zoomButton}
                  onPress={() => mapRef.current?.zoomIn()}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  accessibilityRole="button"
                  accessibilityLabel={t('farmer.map.zoomIn')}
                >
                  <PlusIcon size={16} color={colors.brandGreen} />
                </TouchableOpacity>
                <View style={styles.zoomDivider} />
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.zoomButton}
                  onPress={() => mapRef.current?.zoomOut()}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  accessibilityRole="button"
                  accessibilityLabel={t('farmer.map.zoomOut')}
                >
                  <MinusIcon size={16} color={colors.brandGreen} />
                </TouchableOpacity>
              </View>
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
          {/* Swipe left/right on the card itself to move between parcels (see `swipeResponder`),
              additional to the chip strip and the Back/Next footer buttons above and below --
              not a replacement for either. `panHandlers` is only spread on with 2+ locations, the
              same condition the chip strip already uses: with one parcel there is nothing to
              swipe to, and the responder must not sit between a tap and this card's own buttons
              for no reason. */}
          <View
            style={styles.farmCard}
            {...(locations.length > 1 ? swipeResponder.panHandlers : null)}
          >
            <View style={styles.farmCardHeader}>
              {/* Prev/next parcel arrows, moved here from a row that used to sit in the header
                  (removed since -- the header no longer shows per-parcel text or controls at all)
                  after on-device feedback that they read better next to the parcel they actually
                  act on than floating above the map. Same `handleSwipeNavigate` the card's own
                  swipe gesture calls, so this is only a change of WHERE the buttons render, not
                  what they do. Hidden (not just disabled) with a single parcel, matching every
                  other 2+-locations control on this screen. */}
              {locations.length > 1 ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[
                    styles.locationSliderArrowBtn,
                    activeIndex === 0 ? styles.locationSliderArrowBtnDisabled : null,
                  ]}
                  onPress={() => handleSwipeNavigate(-1)}
                  disabled={activeIndex === 0}
                  hitSlop={{ top: spacing.xs, bottom: spacing.xs, left: spacing.xs, right: spacing.xs }}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: activeIndex === 0 }}
                  accessibilityLabel={t('farmer.registration.step3.previousLocation')}
                  testID="step3-location-prev"
                >
                  <ChevronLeft size={18} color={colors.brandGreen} />
                </TouchableOpacity>
              ) : null}
              <View style={styles.farmTitleRow}>
                <View style={styles.farmIconWrapper}>
                  {isEditing ? (
                    <PenIcon size={18} color={colors.brandGreen} />
                  ) : (
                    <LeafIcon size={18} color={colors.brandGreen} />
                  )}
                </View>
                {/* The parcel's own name as the farmer entered it in the details popup, not a name
                    synthesised from whatever village the map search last landed on. Tapping it
                    reopens that popup for THIS parcel, so a typo can be fixed after creation. The
                    farmer's own acreage is shown under it, since it is no longer on screen
                    anywhere else. The dot ahead of the name carries a field-error signal the badge
                    on this same row does not: the badge only ever reports POSITIONING (drawn /
                    manual / none / mid-edit), so a parcel with a bad name or area but a perfectly
                    good boundary would otherwise show no sign of trouble while the farmer is just
                    stepping through parcels with the arrows -- see `activeDotColor` above. */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.farmNameButton}
                  onPress={handleEditDetails}
                  accessibilityRole="button"
                  accessibilityLabel={t('farmer.registration.step3.editLocationDetails')}
                >
                  <View style={styles.farmNameTextCol}>
                    <View style={styles.farmNameRow}>
                      <SolidDot size={7} color={activeDotColor} />
                      <Text style={styles.farmName} numberOfLines={1}>
                        {displayName}
                      </Text>
                    </View>
                    {areaAcresText.trim() !== '' ? (
                      <Text style={styles.farmAreaText} numberOfLines={1}>
                        {t('farmer.registration.step3.acres', { value: areaAcresText.trim() })}
                      </Text>
                    ) : null}
                  </View>
                  <PenIcon size={14} color={colors.brandGreen} />
                </TouchableOpacity>
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
              {locations.length > 1 ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[
                    styles.locationSliderArrowBtn,
                    isLastLocation ? styles.locationSliderArrowBtnDisabled : null,
                  ]}
                  onPress={() => handleSwipeNavigate(1)}
                  disabled={isLastLocation}
                  hitSlop={{ top: spacing.xs, bottom: spacing.xs, left: spacing.xs, right: spacing.xs }}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isLastLocation }}
                  accessibilityLabel={t('farmer.registration.step3.nextLocation')}
                  testID="step3-location-next"
                >
                  <ChevronRight size={18} color={colors.brandGreen} />
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCol}>
                {/* Measured from this parcel's boundary. The farmer's own figure for it is the
                    "Area (acres)" field in the details popup, shown under the parcel name above;
                    the total across parcels is the sum of those. */}
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

            {/* Delete shares the Edit/Done row rather than getting its own, so the card gains no
                height; it only appears when there is a boundary to delete and the map isn't
                mid-edit (Done has to come first -- deleting under a live drag is never the ask). */}
            <View style={styles.boundaryActionsRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.boundaryActionBtn, mode === 'edit' ? styles.doneBtn : styles.editBtn]}
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
              {hasBoundary && mode === 'view' ? (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.boundaryActionBtn, styles.deleteBtn]}
                  onPress={handleDeleteBoundary}
                  accessibilityRole="button"
                  testID="step3-delete-boundary"
                >
                  <Text style={styles.deleteBtnText}>
                    <TrashIcon size={15} color={colors.requiredRed} />  {t('farmer.registration.step3.deleteBoundary')}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>

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
              <View>
                {/* Capped and scrollable so a long outline can't push the card up over the whole
                    map; `nestedScrollEnabled` because this sits inside the screen's own layout on
                    Android, the same as the place-search suggestions list above. */}
                <ScrollView
                  style={styles.manualPointsList}
                  nestedScrollEnabled={true}
                  keyboardShouldPersistTaps="handled"
                >
                  {manualPoints.map((row, index) => {
                    const issue = manualRowIssue(row);
                    const latMissing = row.latText.trim() === '';
                    const lngMissing = row.lngText.trim() === '';
                    const latHasError =
                      issue === 'latitudeRange' || (issue === 'incomplete' && latMissing);
                    const lngHasError =
                      issue === 'longitudeRange' || (issue === 'incomplete' && lngMissing);
                    return (
                      <View key={row.id} style={styles.manualPointBlock}>
                        <View style={styles.manualPointRow}>
                          <Text style={styles.manualPointIndex}>{index + 1}</Text>
                          <View style={styles.fieldCol}>
                            <TextInput
                              style={[
                                styles.fieldInput,
                                {
                                  borderColor: colors.borderLight,
                                  color: colors.textDark,
                                  backgroundColor: colors.white,
                                },
                                latHasError ? styles.inputError : null,
                              ]}
                              value={row.latText}
                              onChangeText={(text) => handleManualPointChange(row.id, 'latText', text)}
                              keyboardType="numbers-and-punctuation"
                              placeholder={t('farmer.registration.gps.manualLat')}
                              placeholderTextColor={colors.textPlaceholder}
                              accessibilityLabel={t('farmer.registration.gps.manualLat')}
                            />
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
                                lngHasError ? styles.inputError : null,
                              ]}
                              value={row.lngText}
                              onChangeText={(text) => handleManualPointChange(row.id, 'lngText', text)}
                              keyboardType="numbers-and-punctuation"
                              placeholder={t('farmer.registration.gps.manualLng')}
                              placeholderTextColor={colors.textPlaceholder}
                              accessibilityLabel={t('farmer.registration.gps.manualLng')}
                            />
                          </View>
                          {manualPoints.length >= 2 ? (
                            <TouchableOpacity
                              activeOpacity={0.7}
                              style={styles.manualPointRemoveBtn}
                              onPress={() => handleRemoveManualPoint(row.id)}
                              accessibilityRole="button"
                              accessibilityLabel={t('farmer.registration.step3.manualRemovePoint', {
                                index: index + 1,
                              })}
                            >
                              <CloseIcon size={16} color={colors.textSubtle} />
                            </TouchableOpacity>
                          ) : null}
                        </View>
                        {issue ? (
                          <Text style={styles.fieldErrorText}>{t(MANUAL_ROW_ISSUE_KEY[issue])}</Text>
                        ) : null}
                      </View>
                    );
                  })}
                </ScrollView>

                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.manualAddPointBtn}
                  onPress={handleAddManualPoint}
                  accessibilityRole="button"
                >
                  <PlusIcon size={14} color={colors.brandGreen} />
                  <Text style={styles.manualAddPointText}>
                    {t('farmer.registration.step3.manualAddPoint')}
                  </Text>
                </TouchableOpacity>

                {manualShapeError ? (
                  <Text style={styles.fieldErrorText}>{manualShapeError}</Text>
                ) : manualShape.kind === 'empty' || manualShape.kind === 'point' ? (
                  <Text style={styles.manualHintText}>
                    {t('farmer.registration.step3.manualPointsHint')}
                  </Text>
                ) : null}
              </View>
            ) : null}

            {coordinatesError ? (
              <Text style={styles.fieldErrorText}>{coordinatesError}</Text>
            ) : null}

            {/* The only affordance for the swipe gesture above -- it has no visual handle of its
                own, so without this line a farmer would have no way to discover it. Same
                2+ locations condition as the gesture itself and the chip strip. */}
            {locations.length > 1 ? (
              <Text style={styles.swipeHintText}>
                {t('farmer.registration.step3.swipeHint')}
              </Text>
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

      {/* Location-details popup: the active parcel's name and area. Same RN `Modal` treatment as
          Step4Documents' picker (transparent, fade, Android back = dismiss); @tohfa/mobile-ui has
          no shared dialog to reuse. The scrim is deliberately NOT tap-to-dismiss: this holds typed
          input, and a stray tap outside the card should not throw it away. */}
      <Modal
        visible={isDetailsModalOpen}
        transparent
        animationType="fade"
        onRequestClose={handleCancelDetails}
      >
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalScrim} pointerEvents="none" />
          <View style={styles.detailsCard}>
            <Text style={[styles.detailsTitle, { color: colors.textDark }]}>
              {t('farmer.registration.step3.locationDetailsTitle')}
            </Text>
            <Text style={[styles.detailsSubtitle, { color: colors.textSubtle }]}>
              {t('farmer.registration.step3.locationDetailsSubtitle', {
                index: activeIndex + 1,
                count: locations.length,
              })}
            </Text>

            <Text style={[styles.fieldLabel, styles.detailsFieldLabel, { color: colors.textBody }]}>
              {t('farmer.registration.step3.locationNameLabel')}{' '}
              <Text style={{ color: colors.requiredRed }}>*</Text>
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
              value={draftLabel}
              onChangeText={setDraftLabel}
              placeholder={t('farmer.registration.step3.locationNamePlaceholder')}
              placeholderTextColor={colors.textPlaceholder}
              autoFocus={true}
              returnKeyType="next"
              onSubmitEditing={() => areaInputRef.current?.focus()}
              testID="step3-location-name-input"
            />
            {labelError ? <Text style={styles.fieldErrorText}>{labelError}</Text> : null}

            <Text style={[styles.fieldLabel, styles.detailsFieldLabel, { color: colors.textBody }]}>
              {t('farmer.registration.step3.areaAcresLabel')}{' '}
              <Text style={{ color: colors.requiredRed }}>*</Text>
            </Text>
            <TextInput
              ref={areaInputRef}
              style={[
                styles.fieldInput,
                {
                  borderColor: colors.borderLight,
                  color: colors.textDark,
                  backgroundColor: colors.white,
                },
                areaError ? styles.inputError : null,
              ]}
              value={draftAreaAcresText}
              onChangeText={setDraftAreaAcresText}
              keyboardType="decimal-pad"
              placeholder={t('farmer.registration.step3.areaAcresPlaceholder')}
              placeholderTextColor={colors.textPlaceholder}
              testID="step3-location-area-input"
            />
            {areaError ? <Text style={styles.fieldErrorText}>{areaError}</Text> : null}

            <View style={styles.detailsActions}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.detailsActionBtn,
                  styles.backButton,
                  { borderColor: colors.brandGreen, backgroundColor: colors.white },
                ]}
                onPress={handleCancelDetails}
                testID="step3-location-details-cancel"
              >
                <Text style={[styles.footerBtnText, { color: colors.brandGreen }]}>
                  {t('farmer.common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.detailsActionBtn,
                  styles.nextButton,
                  { backgroundColor: colors.brandGreen },
                ]}
                onPress={handleSaveDetails}
                testID="step3-location-details-save"
              >
                <Text style={[styles.footerBtnText, { color: colors.white }]}>
                  {t('farmer.common.save')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    fontSize: typography.title,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: typography.bodySmall,
  },
  skipText: {
    fontSize: typography.body,
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
  // Prev/next parcel arrows in the bottom card's `farmCardHeader` row. One touch-target step
  // shorter than MIN_TOUCH_TARGET, same rationale the old chip strip's pills had: the arrow's
  // `hitSlop` (spacing.xs every side) makes up the difference without bloating the row. Disabled
  // at the first/last parcel via `locationSliderArrowBtnDisabled` below rather than hidden, so the
  // row's width doesn't shift when the farmer reaches either end.
  locationSliderArrowBtn: {
    width: MIN_TOUCH_TARGET - spacing.sm,
    height: MIN_TOUCH_TARGET - spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.borderMedium,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationSliderArrowBtnDisabled: {
    opacity: 0.35,
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
    fontSize: typography.body,
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
    fontSize: typography.body,
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
    fontSize: typography.bodySmall,
    fontWeight: '700',
  },
  // Left-anchored column: coords badge on top, zoom stepper below it. Kept separate from
  // `rightControls` (the action-pill column) so the two never compete for the same corner.
  leftMapControls: {
    gap: 8,
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
    marginHorizontal: 8,
    backgroundColor: colors.borderDivider,
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
  actionPillText: {
    color: P.nearBlack,
    fontSize: typography.bodySmall,
    fontWeight: '700',
  },
  bottomCardContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  // The bottom card is kept compact (tighter padding/margins, 44dp buttons) so it covers as little
  // of the map as possible without dropping any of what it shows. Every size here comes from the
  // design tokens; none of it may go below MIN_TOUCH_TARGET where something is tappable.
  farmCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    shadowColor: P.black,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  // `gap` gives the prev/next arrows (only present with 2+ locations) breathing room against
  // `farmTitleRow` and the status badge -- both of those size themselves (`flex: 1` / intrinsic),
  // so without it the arrows would sit flush against the icon and the badge.
  farmCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  farmTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  // The tappable name + pencil that reopens the location-details popup. It takes the row's spare
  // width (what `farmName` itself used to do with `flex: 1`) so the status badge stays right-aligned.
  farmNameButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: MIN_TOUCH_TARGET,
  },
  farmNameTextCol: {
    flexShrink: 1,
  },
  // Wraps the positioning/error dot with the name so the dot sits inline with the text rather than
  // above it -- `farmNameTextCol` also stacks `farmAreaText` underneath, so this can't just be
  // `farmNameButton`'s own row.
  farmNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  farmName: {
    fontSize: typography.bodyLarge,
    fontWeight: '800',
    color: P.nearBlack,
  },
  farmAreaText: {
    fontSize: typography.caption,
    fontWeight: weights.semibold,
    color: P.grey600,
  },
  farmIconWrapper: {
    backgroundColor: colors.brandGreenLight,
    padding: spacing.sm,
    borderRadius: 10,
  },
  badgeLive: {
    backgroundColor: colors.brandGreenLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
  },
  badgeLiveText: {
    color: colors.brandGreen,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  badgeEditing: {
    backgroundColor: P.orange50,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
  },
  badgeEditingText: {
    color: P.orange900,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  badgeManual: {
    backgroundColor: P.blue50,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
  },
  badgeManualText: {
    color: P.blue700,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  badgeNone: {
    backgroundColor: P.grey100,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
  },
  badgeNoneText: {
    color: P.grey600,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  statCol: {
    flex: 1,
  },
  statLabel: {
    fontSize: typography.caption,
    color: P.grey600,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.body,
    fontWeight: '800',
    color: P.nearBlack,
  },
  statSub: {
    fontSize: typography.caption,
    color: P.grey600,
    marginTop: 2,
  },
  editBtn: {
    borderWidth: 1.5,
    borderColor: colors.brandGreen,
    borderRadius: radius.lg,
    height: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBtnText: {
    color: colors.brandGreen,
    fontSize: typography.bodySmall,
    fontWeight: '700',
  },
  // Edit/Done and Delete side by side; with only Edit/Done present it takes the full width, as
  // before Delete existed.
  boundaryActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  boundaryActionBtn: {
    flex: 1,
  },
  // Destructive twin of `editBtn`: same outline treatment, in the shared error red.
  deleteBtn: {
    borderWidth: 1.5,
    borderColor: colors.requiredRed,
    borderRadius: radius.lg,
    height: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnText: {
    color: colors.requiredRed,
    fontSize: typography.bodySmall,
    fontWeight: weights.bold,
  },
  manualToggle: {
    marginTop: spacing.sm,
    alignSelf: 'center',
  },
  manualToggleText: {
    fontSize: typography.bodySmall,
    fontWeight: '600',
    color: colors.brandGreen,
  },
  // Three rows' worth (input height plus the gap between rows) before the list scrolls, so a long
  // typed outline never pushes the card up over the whole map.
  manualPointsList: {
    maxHeight: (MIN_TOUCH_TARGET + spacing.sm) * 3,
    marginTop: spacing.sm,
  },
  manualPointBlock: {
    marginBottom: spacing.sm,
  },
  manualPointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  manualPointIndex: {
    minWidth: spacing.lg,
    textAlign: 'center',
    fontSize: typography.bodySmall,
    fontWeight: weights.bold,
    color: P.grey600,
  },
  manualPointRemoveBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualAddPointBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    minHeight: MIN_TOUCH_TARGET,
  },
  manualAddPointText: {
    fontSize: typography.body,
    fontWeight: weights.semibold,
    color: colors.brandGreen,
  },
  manualHintText: {
    fontSize: typography.bodySmall,
    color: P.grey600,
  },
  // The only affordance for the bottom-card swipe gesture -- styled like `statSub`'s small
  // secondary text, just centred under the card instead of under a stat column.
  swipeHintText: {
    fontSize: typography.caption,
    color: P.grey600,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  doneBtn: {
    backgroundColor: colors.brandGreen,
    borderRadius: radius.lg,
    height: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneBtnText: {
    color: colors.white,
    fontSize: typography.bodySmall,
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
    fontSize: typography.bodyLarge,
    fontWeight: '700',
  },
  // Location-details popup. The card follows `farmCard` (white, rounded, same shadow) so the popup
  // reads as part of this screen rather than a system dialog.
  modalRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalScrim: {
    ...StyleSheet.absoluteFillObject,
    // `black` is the token reserved for scrims; dimmed with opacity rather than an rgba literal.
    backgroundColor: P.black,
    opacity: 0.5,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.xl,
    shadowColor: P.black,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  detailsTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '800',
  },
  detailsSubtitle: {
    fontSize: typography.bodySmall,
    marginTop: spacing.xs,
  },
  detailsFieldLabel: {
    marginTop: spacing.lg,
  },
  detailsActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  detailsActionBtn: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
