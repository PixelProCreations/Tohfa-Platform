import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  BackHandler,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import {
  FarmBoundaryMap,
  Icon,
  Skeleton,
  type FarmBoundaryMapHandle,
  type FarmBoundaryMapOverlay,
} from '@tohfa/mobile-ui';
import {
  useTheme,
  colors,
  authPalette as P,
  typography,
  weights,
  spacing,
  radius,
  MIN_TOUCH_TARGET,
} from '../../theme';
import { formatErrorMessage } from '../../../../shell/api/client';
import { deletePlot, getFarms, getPlots, updatePlot, type Farm, type Plot } from '../../api/farms';
import { t } from '../../../../i18n/farmer';
import {
  EXPOSURE_OPTIONS,
  FARM_OUTLINE_COLOR,
  IRRIGATION_OPTIONS,
  SOIL_OPTIONS,
  buildZoneMapOverlays,
  centerOfRing,
  editingZoneIndex,
  farmMapCenter,
  isZoneAreaOverAllocated,
  optionLabelKey,
  outerRingOf,
  zoneColorFor,
  zoneLetterFor,
  type LngLat,
  type ZoneOption,
} from './zoneMap';
import { useZoneBoundaryEditor } from './useZoneBoundaryEditor';
import { ICON_TOOLTIP_LONG_PRESS_MS, useIconTooltip } from './useIconTooltip';
import { ZoneBoundaryEditorCard } from './ZoneBoundaryEditorCard';
import { ZoneDetailsModal } from './ZoneDetailsModal';

interface ZonesScreenProps {
  /** The farm to show zones for, threaded from FieldContextScreen via App.tsx's params. */
  farmId: string;
  onNavigateBack: () => void;
  onSave: () => void;
}

/** Zoom used when focusing a single zone -- one step closer than the map's own default of 17. */
const ZONE_FOCUS_ZOOM = 18;
const FARM_FOCUS_ZOOM = 17;
const FLY_DURATION_MS = 800;
/**
 * Share of the screen width one zone card takes in the "ALL ZONES" list. The list is a paging
 * carousel (plain `ScrollView` + `snapToInterval` + `decelerationRate="fast"` -- deliberately no
 * carousel dependency, matching the rest of this app) rather than a free-scrolling strip: each
 * swipe snaps the next card fully into place. Keeping the ratio just under 1, instead of exactly
 * 1 (`pagingEnabled`), leaves a small deliberate sliver of the following card peeking in as a
 * swipe hint, while the dot row below does the actual "which card / how many" job -- unlike the
 * old unsnapped peek, cards never again rest half cut-off at an arbitrary scroll offset.
 */
const ZONE_CARD_WIDTH_RATIO = 0.86;
/** Horizontal gap between zone cards in that carousel -- folded into its snap interval below. */
const ZONE_CARD_GAP = spacing.sm;
/** Glyph size inside the round map icon buttons. */
const MAP_ICON_SIZE = 20;

const MinusIcon = ({ size = 16, color }: { size?: number; color: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
    <Line x1="5" y1="12" x2="19" y2="12" />
  </Svg>
);

const CrosshairIcon = ({ size = 14, color }: { size?: number; color: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round">
    <Circle cx="12" cy="12" r="10" />
    <Line x1="12" y1="2" x2="12" y2="6" />
    <Line x1="12" y1="18" x2="12" y2="22" />
    <Line x1="4" y1="12" x2="2" y2="12" />
    <Line x1="22" y1="12" x2="20" y2="12" />
  </Svg>
);

// Drawn here rather than via <Icon>: the bundled Material Symbols font is a subset
// (packages/mobile-ui/src/iconCodepoints.ts) with no `fullscreen` / `fullscreen_exit` glyphs, and
// adding them means regenerating that font asset -- out of proportion for two simple shapes.
const FullscreenIcon = ({ size = MAP_ICON_SIZE, color }: { size?: number; color: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />
  </Svg>
);

const FullscreenExitIcon = ({ size = MAP_ICON_SIZE, color }: { size?: number; color: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9 4v5H4M15 4v5h5M20 15h-5v5M4 15h5v5" />
  </Svg>
);

/** A stored option value as the farmer should read it -- see `optionLabelKey`. */
function optionText(options: readonly ZoneOption[], value: string | null | undefined): string {
  const key = optionLabelKey(options, value);
  if (key) return t(key);
  return value || '—';
}

/** A zone's local-only "current crop" label -- see the docblock above `localCrops` below. */
interface LocalCrop {
  name: string;
  day: string;
}

/**
 * A farm's zones on one fullscreen satellite map, and the place zones are drawn and redrawn.
 *
 * Overview: the farm's outline (dashed) and every zone (coloured + lettered by list position, the
 * same key as the swipeable zone cards) are read-only overlays. Editing ("+ Add Zone", or a card's
 * redraw button): the SAME map switches to drawing that one zone as its editable boundary, with
 * the farm and every other zone left on screen as context -- so the farmer always draws against
 * what is already there. All editing state lives in useZoneBoundaryEditor.
 */
export function ZonesScreen({ farmId, onNavigateBack, onSave }: ZonesScreenProps) {
  const { colors } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const zoneCardWidth = Math.round(windowWidth * ZONE_CARD_WIDTH_RATIO);
  // The distance one swipe travels: the card plus the gap after it (`zoneList`'s own `gap`),
  // so `snapToInterval` lands on each card's left edge in turn.
  const zoneSnapInterval = zoneCardWidth + ZONE_CARD_GAP;
  const mapRef = useRef<FarmBoundaryMapHandle>(null);

  const [farms, setFarms] = useState<Farm[]>([]);
  const [farmsLoading, setFarmsLoading] = useState(true);
  const [farmsError, setFarmsError] = useState<string | null>(null);

  const [selectedFarmId, setSelectedFarmId] = useState<string>(farmId);
  const [isFarmDropdownOpen, setIsFarmDropdownOpen] = useState(false);
  const selectedFarm = farms.find((f) => f.id === selectedFarmId) ?? null;

  const [zones, setZones] = useState<Plot[]>([]);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [zonesError, setZonesError] = useState<string | null>(null);
  // Whichever `getPlots` call was issued last. A slow response for a farm the farmer has already
  // switched away from must not land its zones on the new farm's map.
  const zonesRequestRef = useRef(0);
  // Whether the card already has zones on screen, from a previous successful load for the
  // CURRENTLY selected farm. A ref, not state: it is written after every load without needing
  // `loadZones` to be recreated (and so re-run) each time. Gates whether a reload blanks the card
  // with the full skeleton -- true only for a genuine first load (or a freshly selected farm with
  // nothing cached yet, see `handleSelectFarm`), never for a refresh of an already-populated list,
  // e.g. the reload `onSaved` triggers right after a save -- that one must leave the just-saved
  // zone visible the whole time the refetch is in flight, not blank the card and bring it back.
  const hasZonesRef = useRef(false);

  /** The zone the farmer tapped in the list: highlighted on the map and flown to. */
  const [focusedZoneId, setFocusedZoneId] = useState<string | null>(null);
  /**
   * The zone carousel. It unmounts while a zone is edited (the editor card takes its place) and
   * remounts scrolled back to the start, so it is scrolled back to the focused zone's card whenever
   * its content is laid out -- otherwise the dots (derived from `focusedZoneId`) and the card on
   * screen disagree, and the card the farmer sees is not the zone they just saved.
   */
  const zoneListRef = useRef<ScrollView>(null);

  /** Hides header, bottom card and footer so the whole screen is map; the map tools stay. */
  const [isFullscreen, setIsFullscreen] = useState(false);

  /** Which icon-only map tool is showing its press-and-hold label -- see `renderMapIconButton`. */
  const { visibleKey: visibleTooltipKey, tooltip } = useIconTooltip();

  /**
   * There is no crop-tracking backend anywhere in this app yet (dashboard/farm-management/crop
   * screens are all still mock -- see root CLAUDE.md's task notes), and `Plot` has no crop
   * field. The "Current Crop" input on a zone stays local-only and cosmetic by design: it is
   * never sent to the API, and it resets whenever this screen remounts. Keyed by plot id.
   */
  const [localCrops, setLocalCrops] = useState<Record<string, LocalCrop>>({});

  // Edit Zone Modal state (details-only edit from a card's pencil; boundary editing is inline).
  const [editingZone, setEditingZone] = useState<Plot | null>(null);
  const [editName, setEditName] = useState('');
  const [editSoil, setEditSoil] = useState('');
  const [editExposure, setEditExposure] = useState('');
  const [editIrrigation, setEditIrrigation] = useState('');
  const [editCropName, setEditCropName] = useState('');
  const [editCropDay, setEditCropDay] = useState('');
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadFarms = useCallback(async () => {
    setFarmsLoading(true);
    setFarmsError(null);
    try {
      const list = await getFarms();
      setFarms(list);
      // The threaded farmId should always be valid by the time this screen is reached, but fall
      // back to the first farm rather than strand the picker on a farm that no longer exists.
      setSelectedFarmId((prev) => (list.some((f) => f.id === prev) ? prev : (list[0]?.id ?? prev)));
    } catch (err) {
      setFarmsError(formatErrorMessage(err, t('farmer.zones.loadFarmsError')));
    } finally {
      setFarmsLoading(false);
    }
  }, []);

  const loadZones = useCallback(async () => {
    const requestId = zonesRequestRef.current + 1;
    zonesRequestRef.current = requestId;
    if (!selectedFarmId) {
      setZones([]);
      setZonesLoading(false);
      hasZonesRef.current = false;
      return;
    }
    // Only a genuine initial load (nothing to show yet) blanks the card with the full skeleton --
    // a refresh of an already-populated list keeps the existing zones on screen, fully visible and
    // interactive, for the whole time this refetch is in flight.
    if (!hasZonesRef.current) setZonesLoading(true);
    setZonesError(null);
    try {
      const list = await getPlots(selectedFarmId);
      if (zonesRequestRef.current !== requestId) return;
      setZones(list);
      hasZonesRef.current = list.length > 0;
    } catch (err) {
      if (zonesRequestRef.current !== requestId) return;
      setZonesError(formatErrorMessage(err, t('farmer.zones.loadZonesError')));
    } finally {
      if (zonesRequestRef.current === requestId) setZonesLoading(false);
    }
  }, [selectedFarmId]);

  useEffect(() => {
    void loadFarms();
  }, [loadFarms]);

  useEffect(() => {
    void loadZones();
  }, [loadZones]);

  // The farm's own outline: the dashed backdrop on the map, and the ring a zone under edit must stay
  // inside (empty when the farm has no boundary yet -- then zones are not constrained at all).
  const farmRing = useMemo(() => outerRingOf(selectedFarm?.boundary), [selectedFarm]);

  // Dynamic calculations. The map-measured boundary area is preferred over the farmer's typed
  // figure when both exist, matching how FMBSketchScreen treats the same two fields. Computed
  // ahead of the editor hook below: it needs this same ceiling to validate a zone's area before
  // save (see useZoneBoundaryEditor's `farmTotalAcres` option).
  const farmTotalAcres = selectedFarm?.boundaryAreaAcres ?? selectedFarm?.areaAcres ?? 0;
  const totalMarkedAcres = zones.reduce((acc, z) => acc + (z.areaAcres ?? 0), 0);
  const unmarkedAcres = Math.max(0, farmTotalAcres - totalMarkedAcres);
  // Read-only: existing zones already summing past the farm's own size (e.g. saved before this
  // check existed), never a reason to block the screen -- see the stats-row warning below.
  const isOverAllocated = isZoneAreaOverAllocated(farmTotalAcres, totalMarkedAcres);

  // ---- Inline zone editor ---------------------------------------------------------------------
  // `editing` is the editor's own target (null | new | existing plotId), not a second copy of it,
  // so the screen's mode and the editor's state can never disagree.
  const editor = useZoneBoundaryEditor(mapRef, {
    farmId: selectedFarmId,
    farmRing,
    zones,
    farmTotalAcres,
    // Focus the zone just saved, so the carousel (see `zoneListRef`) and the map both land on it --
    // its card is where the way back into editing its boundary lives. Without this, saving a new
    // zone left the carousel on the first card, and the zone just drawn was nowhere on screen.
    onSaved: (plotId) => {
      setFocusedZoneId(plotId);
      void loadZones();
    },
  });
  const editing = editor.target;
  const isEditing = editing !== null;

  // While a zone is being edited, Android's back button cancels the edit (asking first if
  // anything changed) instead of leaving the screen. App.tsx's own back listener was registered
  // when this screen opened; this one is added later, so React Native consults it first. The ref
  // keeps the listener pointed at the latest `requestCancel` without re-registering every render.
  const requestCancelRef = useRef(editor.requestCancel);
  useEffect(() => {
    requestCancelRef.current = editor.requestCancel;
  });
  useEffect(() => {
    if (!isEditing) return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      requestCancelRef.current();
      return true;
    });
    return () => subscription.remove();
  }, [isEditing]);

  // ---- Map data -------------------------------------------------------------------------------
  // The farm's own outline is the backdrop (dashed, unfilled); every zone that has a drawn
  // boundary is layered over it as a read-only overlay, coloured and lettered by its list position
  // (see `zoneColorFor` / `zoneLetterFor`) so the map and the zone cards below share one key.
  // While editing, the zone under edit leaves the overlays and becomes the map's editable boundary.
  // (`farmRing` itself is declared above the editor hook, which needs it too.)
  const mapCenter = useMemo(() => farmMapCenter(selectedFarm), [selectedFarm]);
  const zoneRings = useMemo(
    () => new Map<string, LngLat[]>(zones.map((zone) => [zone.id, outerRingOf(zone.boundary)])),
    [zones],
  );
  const mapOverlays = useMemo<FarmBoundaryMapOverlay[]>(
    () =>
      buildZoneMapOverlays({
        farmRing,
        zones: zones.map((zone) => ({ id: zone.id, ring: zoneRings.get(zone.id) ?? [] })),
        // No emphasis while editing: the zone being drawn is the one thing to stand out.
        focusedZoneId: isEditing ? null : focusedZoneId,
        excludeZoneId: editing?.kind === 'existing' ? editing.plotId : null,
      }),
    [editing, farmRing, focusedZoneId, isEditing, zoneRings, zones],
  );
  // The zone under edit is drawn in the colour it has (or, when new, will have) on this screen.
  const editingColor = zoneColorFor(
    editingZoneIndex(
      zones.map((zone) => zone.id),
      editing ?? { kind: 'new' },
    ),
  );

  function handleSelectFarm(nextFarmId: string) {
    setIsFarmDropdownOpen(false);
    if (nextFarmId === selectedFarmId) return;
    // Cleared right away rather than left for `loadZones`: the map remounts on the new farm (its
    // `key`), and the previous farm's zones must not be drawn on it even for one frame.
    setZones([]);
    // This farm's zones are not loaded yet, so its first `loadZones` call must show the skeleton
    // rather than treat the previous farm's (just-cleared) list as something already on screen.
    hasZonesRef.current = false;
    setFocusedZoneId(null);
    setSelectedFarmId(nextFarmId);
  }

  /** A zone card was tapped: highlight it, and fly to it when it has a shape to fly to. */
  function handleFocusZone(zone: Plot) {
    setFocusedZoneId(zone.id);
    const center = centerOfRing(zoneRings.get(zone.id) ?? []);
    if (center) mapRef.current?.flyTo(center, ZONE_FOCUS_ZOOM, FLY_DURATION_MS);
  }

  /**
   * The zone carousel finished snapping to a new page: focus that zone exactly the way tapping
   * its card does (`handleFocusZone`), so a swipe and a tap are one highlight/fly-to path rather
   * than two. `contentOffset.x / zoneSnapInterval`, rounded, is the standard RN pattern for
   * recovering a page index from a snapping `ScrollView` that has no `onPageChanged` of its own.
   */
  function handleZoneListScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (zones.length === 0) return;
    const rawIndex = Math.round(event.nativeEvent.contentOffset.x / zoneSnapInterval);
    const index = Math.max(0, Math.min(zones.length - 1, rawIndex));
    const zone = zones[index];
    if (zone && zone.id !== focusedZoneId) handleFocusZone(zone);
  }

  // Which dot is lit. Derived from `focusedZoneId` -- the same state both the tap handler and the
  // swipe handler above write -- rather than tracked separately, so the dots can never drift out
  // of sync with which zone is actually highlighted on the map. Defaults to the first dot before
  // anything has been focused yet (mount), without itself triggering a focus/fly-to.
  const activeZoneIndex = Math.max(
    0,
    zones.findIndex((zone) => zone.id === focusedZoneId),
  );

  function handleShowWholeFarm() {
    setFocusedZoneId(null);
    if (mapCenter) mapRef.current?.flyTo(mapCenter, FARM_FOCUS_ZOOM, FLY_DURATION_MS);
  }

  function handleAddZone() {
    setIsFarmDropdownOpen(false);
    setFocusedZoneId(null);
    editor.begin({ kind: 'new' });
  }

  function handleRedrawZone(zone: Plot) {
    setIsFarmDropdownOpen(false);
    setFocusedZoneId(zone.id);
    editor.begin({ kind: 'existing', plot: zone });
  }

  /** Check icon / Save Zone: when the shape cannot be confirmed yet, show the card that says why. */
  function handleConfirmShape() {
    if (!editor.confirmShape()) setIsFullscreen(false);
  }

  function handleToggleFullscreen() {
    setIsFarmDropdownOpen(false);
    setIsFullscreen((prev) => !prev);
  }

  function handleHeaderBack() {
    if (isEditing) editor.requestCancel();
    else onNavigateBack();
  }

  const handleOpenEdit = (zone: Plot) => {
    setEditingZone(zone);
    setEditName(zone.name);
    setEditSoil(zone.soilType ?? '');
    setEditExposure(zone.sunExposure ?? '');
    setEditIrrigation(zone.irrigationType ?? '');
    const localCrop = localCrops[zone.id];
    setEditCropName(localCrop?.name ?? '');
    setEditCropDay(localCrop?.day ?? '');
    setModalError(null);
    setIsEditModalVisible(true);
  };

  /**
   * The details popup's "edit boundary on map": leaves the popup (any unsaved detail changes in it
   * are dropped, as its Cancel would) and opens the same inline boundary editor as the card's
   * boundary icon, which loads the zone's saved details itself.
   */
  function handleEditBoundaryFromModal() {
    if (!editingZone) return;
    const zone = editingZone;
    setIsEditModalVisible(false);
    setEditingZone(null);
    handleRedrawZone(zone);
  }

  async function handleSaveEdit() {
    if (!editingZone || !selectedFarmId) return;
    setModalSaving(true);
    setModalError(null);
    try {
      // `boundary` is deliberately omitted: this modal edits the zone's details only, and an
      // omitted boundary leaves the drawn one untouched (UpdatePlotInput). Redrawing is done
      // inline on the map via the card's redraw button.
      const updated = await updatePlot(selectedFarmId, editingZone.id, {
        name: editName.trim() || editingZone.name,
        soilType: editSoil,
        sunExposure: editExposure,
        irrigationType: editIrrigation,
      });
      setZones((prev) => prev.map((z) => (z.id === updated.id ? updated : z)));
      // Crop is local-only -- see the `localCrops` docblock above. Written after the real save
      // succeeds, never sent to the server.
      setLocalCrops((prev) => {
        const next = { ...prev };
        if (editCropName.trim()) {
          next[editingZone.id] = { name: editCropName.trim(), day: editCropDay };
        } else {
          delete next[editingZone.id];
        }
        return next;
      });
      setIsEditModalVisible(false);
      setEditingZone(null);
    } catch (err) {
      setModalError(formatErrorMessage(err, t('farmer.zones.saveZoneError')));
    } finally {
      setModalSaving(false);
    }
  }

  const handleDeleteZone = (zoneId: string) => {
    const target = zones.find((z) => z.id === zoneId);
    Alert.alert(
      t('farmer.zones.deleteConfirmTitle'),
      t('farmer.zones.deleteConfirmBody', { name: target?.name || t('farmer.zones.thisZone') }),
      [
        { text: t('farmer.common.cancel'), style: 'cancel' },
        {
          text: t('farmer.zones.deleteConfirmAction'),
          style: 'destructive',
          onPress: () => {
            void (async () => {
              if (!selectedFarmId) return;
              setZonesError(null);
              try {
                await deletePlot(selectedFarmId, zoneId);
                setZones((prev) => prev.filter((z) => z.id !== zoneId));
                setFocusedZoneId((prev) => (prev === zoneId ? null : prev));
                setLocalCrops((prev) => {
                  const next = { ...prev };
                  delete next[zoneId];
                  return next;
                });
              } catch (err) {
                setZonesError(formatErrorMessage(err, t('farmer.zones.deleteZoneError')));
              }
            })();
          },
        },
      ],
    );
  };

  function renderZoneCard(zone: Plot, index: number) {
    const zoneColor = zoneColorFor(index);
    const crop = localCrops[zone.id];
    const isFocused = zone.id === focusedZoneId;
    const hasShape = (zoneRings.get(zone.id) ?? []).length > 0;
    return (
      <TouchableOpacity
        key={zone.id}
        activeOpacity={0.85}
        onPress={() => handleFocusZone(zone)}
        style={[
          styles.zoneCard,
          { width: zoneCardWidth, borderColor: zoneColor },
          isFocused && styles.zoneCardFocused,
        ]}
        accessibilityRole="button"
        accessibilityState={{ selected: isFocused }}
        accessibilityLabel={t('farmer.zones.focusZoneA11y', { name: zone.name })}
        testID={`zones-card-${zone.id}`}
      >
        <View style={styles.zoneCardTop}>
          <View style={[styles.zoneIcon, { backgroundColor: zoneColor }]}>
            <Text style={styles.zoneIconText}>{zoneLetterFor(index)}</Text>
          </View>
          <View style={styles.zoneTitleCol}>
            <Text style={[styles.zoneTitle, { color: colors.textDark }]} numberOfLines={1}>
              {zone.name}
            </Text>
            <Text style={[styles.zoneSub, { color: colors.textSubtle }]} numberOfLines={1}>
              {t('farmer.zones.acres', { value: (zone.areaAcres ?? 0).toFixed(2) })}
              {hasShape ? '' : ` · ${t('farmer.zones.noBoundary')}`}
            </Text>
          </View>
        </View>

        <View style={styles.zoneCardDetails}>
          <View style={styles.detailCol}>
            <Text style={styles.detailLabel}>{t('farmer.zones.detail.soil')}</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {optionText(SOIL_OPTIONS, zone.soilType)}
            </Text>
          </View>
          <View style={styles.detailCol}>
            <Text style={styles.detailLabel}>{t('farmer.zones.detail.exposure')}</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {optionText(EXPOSURE_OPTIONS, zone.sunExposure)}
            </Text>
          </View>
          <View style={styles.detailCol}>
            <Text style={styles.detailLabel}>{t('farmer.zones.detail.irrigation')}</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {optionText(IRRIGATION_OPTIONS, zone.irrigationType)}
            </Text>
          </View>
        </View>

        {crop ? (
          <View style={[styles.cropPill, { backgroundColor: colors.brandGreenLight }]}>
            <Icon name="eco" size={12} color={colors.brandGreen} style={styles.cropPillIcon} />
            <Text style={[styles.cropPillText, { color: colors.brandGreen }]} numberOfLines={1}>
              {crop.day
                ? t('farmer.zones.cropPillWithDay', { name: crop.name, day: crop.day })
                : t('farmer.zones.cropPill', { name: crop.name })}
            </Text>
          </View>
        ) : null}

        <View style={styles.zoneActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleRedrawZone(zone)}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.zones.editBoundaryA11y')}
            testID={`zones-card-${zone.id}-edit-boundary`}
          >
            <Icon name="crop_free" size={18} color={colors.brandGreen} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleOpenEdit(zone)}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.zones.editZoneA11y')}
          >
            <Icon name="edit" size={18} color={colors.brandGreen} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionDeleteBtn]}
            onPress={() => handleDeleteZone(zone.id)}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.zones.deleteZoneA11y')}
          >
            <Icon name="delete" size={18} color={P.red500} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  function renderOptionChips(
    options: readonly ZoneOption[],
    value: string,
    onChange: (next: string) => void,
  ) {
    return (
      <View style={styles.chipsRow}>
        {options.map((option) => {
          const isSelected = value === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.chipBtn,
                isSelected && { backgroundColor: P.lightGreen50, borderColor: colors.brandGreen },
              ]}
              onPress={() => onChange(option.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={[
                  styles.chipText,
                  isSelected && { color: colors.brandGreen, fontWeight: weights.bold },
                ]}
              >
                {t(option.labelKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  /**
   * One round map tool. `filled` is the solid-green look (the locate button always; the draw
   * toggle while drawing). Disabled tools stay visible but greyed, so the row keeps one shape
   * between overview and editing and the farmer learns where each tool lives.
   *
   * Press-and-hold shows `label` -- the very string screen readers already get -- as a small
   * bubble beside the icon (see `useIconTooltip`); a plain tap acts exactly as before. A long-press
   * suppresses the tap's `onPress` (React Native's own Touchable behaviour), so holding a button to
   * read it never also triggers it.
   *
   * Disabled tools are deliberately NOT given a `disabled` prop: that would swallow the long-press
   * too, and a greyed button is exactly the one a farmer most wants explained. Instead the tap is
   * ignored here, the press feedback is turned off, and `accessibilityState` still reports
   * disabled -- so for a tap the behaviour is the same as before.
   *
   * This MUST be a `Pressable`, not a `TouchableOpacity`. In RN 0.74 TouchableOpacity falls back to
   * `accessibilityState.disabled` when `disabled` is unset, and disables its whole Pressability --
   * long-press included -- so every greyed tool silently showed no label (reproduced on device:
   * Undo / Confirm in overview). Passing `disabled={false}` instead would make TouchableOpacity
   * overwrite the reported accessibility state with "enabled". Pressable keeps the two apart: its
   * `disabled` prop drives the touch, `accessibilityState` only what the screen reader hears.
   *
   * `tooltipPlacement`: 'left' for the vertical view-tools column (a bubble above/below would land
   * on the neighbouring button), 'above' for the bottom row, so the bubble always opens toward open
   * map rather than off-screen, under the card, or over another tool.
   */
  function renderMapIconButton(options: {
    label: string;
    onPress: () => void;
    disabled?: boolean;
    filled?: boolean;
    selected?: boolean;
    testID: string;
    tooltipPlacement: 'above' | 'left';
    renderIcon: (color: string) => React.ReactNode;
  }) {
    const disabled = options.disabled === true;
    const iconColor = disabled ? colors.textSubtle : options.filled ? colors.white : colors.brandGreen;
    const isTooltipVisible = visibleTooltipKey === options.testID;
    return (
      <View style={styles.mapIconBtnWrap}>
        <Pressable
          style={({ pressed }) => [
            styles.mapIconBtn,
            options.filled && !disabled && { backgroundColor: colors.brandGreen },
            disabled && styles.mapIconBtnDisabled,
            pressed && !disabled && styles.mapIconBtnPressed,
          ]}
          onPress={() => {
            tooltip.hide();
            if (!disabled) options.onPress();
          }}
          onLongPress={() => tooltip.show(options.testID)}
          onPressOut={() => tooltip.release(options.testID)}
          onHoverIn={() => tooltip.show(options.testID)}
          onHoverOut={() => tooltip.release(options.testID)}
          delayLongPress={ICON_TOOLTIP_LONG_PRESS_MS}
          accessibilityRole="button"
          accessibilityLabel={options.label}
          accessibilityState={{ disabled, ...(options.selected !== undefined ? { selected: options.selected } : {}) }}
          testID={options.testID}
        >
          {options.renderIcon(iconColor)}
        </Pressable>
        {/* A sibling of the button, not its child: inside it, the bubble would inherit the
            pressed/disabled opacity. Right-anchored and growing leftward, because every map tool
            sits on the right edge -- a centred bubble would run off the screen. Hidden from screen
            readers, which already hear the same text as the button's label. */}
        {isTooltipVisible ? (
          <View
            style={[
              styles.mapTooltipWrap,
              options.tooltipPlacement === 'above' ? styles.mapTooltipAbove : styles.mapTooltipLeft,
            ]}
            pointerEvents="none"
            accessibilityElementsHidden={true}
            importantForAccessibility="no-hide-descendants"
            testID={`${options.testID}-tooltip`}
          >
            <View style={styles.mapTooltip}>
              <Text style={styles.mapTooltipText}>{options.label}</Text>
            </View>
          </View>
        ) : null}
      </View>
    );
  }

  const isDrawing = editor.mode === 'draw';
  const canUndo = isEditing && isDrawing && editor.coords.length > 0;

  // Every icon-only map tool lives on the RIGHT edge, in two clusters split by what they act on:
  //  - view tools (whole farm, locate, fullscreen) move the camera or the layout, never the shape.
  //    They sit top-right as a vertical column under the Add Zone pill / editing badge (stacked so
  //    the cluster stays one button wide on the right edge, clear of the legend), and stay visible in
  //    every mode -- including fullscreen, where the fullscreen toggle is the only way back out.
  //    Fullscreen takes the corner, where farmers expect a fullscreen control on any map or video.
  //  - shape tools (draw, undo, confirm) sit bottom-right, directly above the card -- next to the
  //    zone editor they work with, under the thumb. Greyed in overview (nothing is being drawn).
  // They were previously spread across the top-right AND both bottom corners, which read as
  // unrelated controls; the left edge is now only the legend and the zoom buttons.
  const viewToolsRow = (
    <View style={styles.mapIconColumn} pointerEvents="box-none">
      {/* Kept while editing too: it only moves the camera, and drawing against the whole farm is
          often exactly the view the farmer wants. */}
      {mapCenter
        ? renderMapIconButton({
            label: t('farmer.zones.wholeFarm'),
            onPress: handleShowWholeFarm,
            testID: 'zones-whole-farm',
            tooltipPlacement: 'left',
            renderIcon: (color) => <Icon name="terrain" size={MAP_ICON_SIZE} color={color} />,
          })
        : null}
      {renderMapIconButton({
        label: t('farmer.map.locateMe'),
        onPress: () => void mapRef.current?.locateMe(),
        filled: true,
        testID: 'zones-locate',
        tooltipPlacement: 'left',
        renderIcon: (color) => <CrosshairIcon size={MAP_ICON_SIZE} color={color} />,
      })}
      {renderMapIconButton({
        label: isFullscreen ? t('farmer.zones.fullscreenExitA11y') : t('farmer.zones.fullscreenEnterA11y'),
        onPress: handleToggleFullscreen,
        selected: isFullscreen,
        testID: 'zones-fullscreen',
        tooltipPlacement: 'left',
        renderIcon: (color) =>
          isFullscreen ? <FullscreenExitIcon color={color} /> : <FullscreenIcon color={color} />,
      })}
    </View>
  );

  const shapeToolsRow = (
    <View style={styles.mapIconRow} pointerEvents="box-none">
      <View style={styles.mapIconGroup} pointerEvents="box-none">
        {isEditing
          ? renderMapIconButton({
              label: isDrawing ? t('farmer.map.doneDrawing') : t('farmer.zones.add.drawZone'),
              onPress: editor.handleDrawBoundary,
              filled: isDrawing,
              selected: isDrawing,
              testID: 'add-zone-draw',
              tooltipPlacement: 'above',
              renderIcon: (color) => <Icon name="edit" size={MAP_ICON_SIZE} color={color} />,
            })
          : null}
        {renderMapIconButton({
          label: t('farmer.map.undo'),
          onPress: () => mapRef.current?.undo(),
          disabled: !canUndo,
          testID: 'zones-undo',
          tooltipPlacement: 'above',
          renderIcon: (color) => <Icon name="undo" size={MAP_ICON_SIZE} color={color} />,
        })}
        {renderMapIconButton({
          label: t('farmer.zones.confirmShapeA11y'),
          onPress: handleConfirmShape,
          disabled: !isEditing || editor.submitting,
          testID: 'zones-confirm-shape',
          tooltipPlacement: 'above',
          renderIcon: (color) => <Icon name="check" size={MAP_ICON_SIZE} color={color} />,
        })}
      </View>
    </View>
  );

  const headerTitle = !isEditing
    ? t('farmer.zones.title')
    : editing.kind === 'existing'
      ? t('farmer.zones.add.titleEdit')
      : t('farmer.zones.add.titleNew');
  const headerSubtitle = !isEditing
    ? t('farmer.zones.subtitle')
    : editor.isEditingMap
      ? t('farmer.zones.add.subtitleEditing')
      : selectedFarm
        ? t('farmer.zones.add.subtitleFarm', { farm: selectedFarm.name })
        : '';

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.bgLight }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* HEADER + FARM PICKER -- the only chrome above the map. Hidden in fullscreen. */}
      {isFullscreen ? null : (
        <View style={[styles.header, { backgroundColor: colors.white, borderBottomColor: colors.borderSoft }]}>
          <View style={styles.headerTitleRow}>
            <TouchableOpacity
              onPress={handleHeaderBack}
              style={[styles.backBtn, { borderColor: colors.borderMedium }]}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.common.back')}
            >
              <Icon name="arrow_back" size={22} color={colors.brandGreen} />
            </TouchableOpacity>
            <View style={styles.headerTitleBox}>
              <Text style={[styles.headerTitle, { color: colors.textDark }]}>{headerTitle}</Text>
              {headerSubtitle ? (
                <Text style={[styles.headerSubtitle, { color: colors.textSubtle }]} numberOfLines={1}>
                  {headerSubtitle}
                </Text>
              ) : null}
            </View>
          </View>

          {farmsError ? <Text style={styles.errorText}>{farmsError}</Text> : null}

          {farmsLoading ? (
            <Skeleton height={MIN_TOUCH_TARGET + spacing.sm} width="100%" style={styles.farmSelectorSkeleton} />
          ) : farms.length > 0 ? (
            <TouchableOpacity
              style={[
                styles.farmSelector,
                { borderColor: isFarmDropdownOpen ? colors.brandGreen : colors.borderLight },
                // Switching farms mid-edit would remount the map under the zone being drawn.
                isEditing && styles.farmSelectorDisabled,
              ]}
              onPress={() => setIsFarmDropdownOpen(!isFarmDropdownOpen)}
              disabled={isEditing}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ expanded: isFarmDropdownOpen, disabled: isEditing }}
              testID="zones-farm-selector"
            >
              <View style={[styles.farmIconBox, { backgroundColor: colors.brandGreenLight }]}>
                <Icon name="place" size={16} color={colors.brandGreen} />
              </View>
              <View style={styles.farmSelectorText}>
                <Text style={[styles.farmSelectorCaption, { color: colors.textSubtle }]}>
                  {t('farmer.zones.markingFor')}
                </Text>
                <Text style={[styles.farmSelectorName, { color: colors.textDark }]} numberOfLines={1}>
                  {selectedFarm?.name ?? t('farmer.zones.selectFarm')}
                </Text>
              </View>
              <Icon name="expand_more" size={18} color={colors.textSubtle} />
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {/* MAP AREA -- the real satellite map fills everything between the header and the footer;
          controls and the zone list float over it, the same layout as registration Step 3. */}
      <View style={styles.mapArea}>
        {farmsLoading ? (
          <View style={styles.centerFill}>
            <ActivityIndicator size="large" color={colors.brandGreen} />
          </View>
        ) : selectedFarm ? (
          <FarmBoundaryMap
            // Remount per farm: FarmBoundaryMap reads `initialCenter` only in a mount-time state
            // initialiser, so without a changing key switching farms would leave the camera over
            // the previous farm. The overlays themselves are a live prop and need no remount.
            key={selectedFarm.id}
            ref={mapRef}
            // Interactive even in overview, because `begin` puts a zone on this same map with
            // `setPolygon` (a no-op when readOnly). Safe: with no primary boundary and the map in
            // 'view' mode, FarmBoundaryMap ignores every tap (`handleMapPress` acts only in 'draw'),
            // and `hideSearchBar` keeps its search box off -- so overview behaves as read-only.
            readOnly={false}
            hideSearchBar={true}
            initialCenter={mapCenter}
            initialPolygon={null}
            onPolygonChange={editor.handlePolygonChange}
            onModeChange={editor.onModeChange}
            readOnlyOverlays={mapOverlays}
            boundaryColor={editingColor}
            // A zone's corners must stay inside the farm: the same ring as the dashed overlay,
            // and only while a zone is being edited and the farm has a real boundary (else null).
            containWithin={editor.containWithin}
            onRejectedPoint={editor.handleRejectedPoint}
            searchPlaceholder={t('farmer.map.searchPlaceholder')}
            testID="zones-map"
          />
        ) : (
          <View style={styles.centerFill}>
            <Text style={[styles.emptyText, { color: colors.textSubtle }]}>
              {farmsError ? '' : t('farmer.zones.noFarms')}
            </Text>
          </View>
        )}

        {selectedFarm ? (
          <View style={styles.topMapControls} pointerEvents="box-none">
            <View style={styles.leftMapControls} pointerEvents="box-none">
              {farmRing.length > 0 ? (
                <View style={styles.legendChip} pointerEvents="none">
                  <View style={[styles.legendDash, { borderColor: FARM_OUTLINE_COLOR }]} />
                  <Text style={styles.legendText}>{t('farmer.zones.farmBoundaryLegend')}</Text>
                </View>
              ) : null}
              <View style={styles.zoomControl}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.zoomButton}
                  onPress={() => mapRef.current?.zoomIn()}
                  accessibilityRole="button"
                  accessibilityLabel={t('farmer.map.zoomIn')}
                >
                  <Icon name="add" size={18} color={colors.brandGreen} />
                </TouchableOpacity>
                <View style={styles.zoomDivider} />
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.zoomButton}
                  onPress={() => mapRef.current?.zoomOut()}
                  accessibilityRole="button"
                  accessibilityLabel={t('farmer.map.zoomOut')}
                >
                  <MinusIcon color={colors.brandGreen} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.rightControls} pointerEvents="box-none">
              {/* The primary call to action stays a labelled pill, not an icon. */}
              {!isEditing ? (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.actionPill, { backgroundColor: colors.brandGreen }]}
                  onPress={handleAddZone}
                  accessibilityRole="button"
                  testID="zones-add-zone"
                >
                  <Icon name="add" size={14} color={colors.white} />
                  <Text style={[styles.actionPillText, { color: colors.white }]}>{t('farmer.zones.addZone')}</Text>
                </TouchableOpacity>
              ) : null}
              {/* While editing the pill is gone and the badge takes its slot, so the view-tools row
                  below sits at the same height as in overview whenever the badge is up. */}
              {isEditing && editor.isEditingMap ? (
                <View style={styles.editingBadge} pointerEvents="none">
                  <Text style={styles.editingText}>{t('farmer.map.editingBadge')}</Text>
                </View>
              ) : null}
              {viewToolsRow}
            </View>
          </View>
        ) : null}

        {/* FARM DROPDOWN -- inside the map area (not the header) so the whole menu sits within its
            parent's bounds; Android does not deliver touches to a child drawn outside them. */}
        {isFarmDropdownOpen && !isEditing && !isFullscreen ? (
          <View style={[styles.farmDropdownMenu, { borderColor: colors.borderLight }]}>
            <ScrollView style={styles.farmDropdownScroll} nestedScrollEnabled={true}>
              {farms.map((farm) => {
                const isSelected = farm.id === selectedFarmId;
                const farmAcres = farm.boundaryAreaAcres ?? farm.areaAcres ?? 0;
                return (
                  <TouchableOpacity
                    key={farm.id}
                    style={[styles.farmDropdownItem, isSelected && { backgroundColor: P.lightGreen50 }]}
                    onPress={() => handleSelectFarm(farm.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <View style={styles.farmDropdownItemLeft}>
                      <Icon name="place" size={16} color={isSelected ? colors.brandGreen : colors.textSubtle} />
                      <View style={styles.farmDropdownItemTextCol}>
                        <Text
                          style={[
                            styles.farmDropdownItemText,
                            {
                              color: isSelected ? colors.brandGreen : colors.textDark,
                              fontWeight: isSelected ? weights.bold : weights.medium,
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {farm.name}
                        </Text>
                        <Text style={[styles.farmDropdownItemSub, { color: colors.textSubtle }]}>
                          {t('farmer.zones.farmTotalArea', { value: farmAcres.toFixed(2) })}
                        </Text>
                      </View>
                    </View>
                    {isSelected ? <Icon name="check" size={16} color={colors.brandGreen} /> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {/* BOTTOM -- the shape-tools row sits directly above the card in one column, so it rides on
            top of the card at whatever height the card is, with no measuring. In fullscreen only
            that row is left. Overview card: metrics plus a horizontally swipeable list of this
            farm's zones (tapping one highlights it on the map and flies to it). Editing card: the
            zone editor (ZoneBoundaryEditorCard). */}
        {selectedFarm ? (
          <View style={styles.bottomContainer} pointerEvents="box-none">
            {/* Brief "outside the farm" notice after the map refuses a tap or drag. Absolutely
                positioned just above the icon row so it never shifts the row (or the card) under
                a farmer's thumb mid-tap, stays visible in fullscreen, and takes no touches. It
                clears itself (see useZoneBoundaryEditor's `handleRejectedPoint`). */}
            {isEditing && editor.rejectionNoticeVisible ? (
              <View style={styles.rejectionNoticeWrap} pointerEvents="none">
                <View
                  style={styles.rejectionNotice}
                  accessibilityRole="alert"
                  accessibilityLiveRegion="polite"
                  testID="zones-point-outside-farm"
                >
                  <Icon name="info" size={16} color={colors.requiredRed} />
                  <Text style={styles.rejectionNoticeText}>{t('farmer.zones.add.pointOutsideFarm')}</Text>
                </View>
              </View>
            ) : null}
            {shapeToolsRow}
            {isFullscreen ? null : isEditing ? (
              <ZoneBoundaryEditorCard editor={editor} zoneColor={editingColor} />
            ) : (
              <View style={styles.bottomCard}>
                <View style={styles.metricsRow}>
                  <View style={[styles.metricCol, styles.metricColDivider]}>
                    <Text style={[styles.metricVal, { color: colors.textDark }]}>{zones.length}</Text>
                    <Text style={styles.metricLabel}>{t('farmer.zones.metric.totalZones')}</Text>
                  </View>
                  <View style={[styles.metricCol, styles.metricColDivider]}>
                    <Text
                      style={[styles.metricVal, { color: isOverAllocated ? colors.requiredRed : colors.brandGreen }]}
                      testID="zones-metric-marked"
                    >
                      {totalMarkedAcres.toFixed(2)}
                    </Text>
                    <Text style={styles.metricLabel}>{t('farmer.zones.metric.marked')}</Text>
                  </View>
                  <View style={styles.metricCol}>
                    <Text style={[styles.metricVal, { color: colors.textSubtle }]}>{unmarkedAcres.toFixed(2)}</Text>
                    <Text style={styles.metricLabel}>{t('farmer.zones.metric.unmarked')}</Text>
                  </View>
                </View>

                {/* Read-only: zones already summing past the farm's own size (e.g. saved before
                    this check existed). Never blocks the screen -- the farmer can still view, edit
                    and delete zones normally; this only flags that the totals don't add up. */}
                {isOverAllocated ? (
                  <View style={styles.noticeRow}>
                    <Icon name="info" size={14} color={colors.requiredRed} style={styles.noticeIcon} />
                    <Text
                      style={[styles.noticeText, { color: colors.requiredRed, fontWeight: weights.semibold }]}
                      testID="zones-overallocated-warning"
                    >
                      {t('farmer.zones.overAllocatedWarning')}
                    </Text>
                  </View>
                ) : null}

                {farmRing.length === 0 ? (
                  <View style={styles.noticeRow}>
                    <Icon name="info" size={14} color={colors.textSubtle} style={styles.noticeIcon} />
                    <Text style={[styles.noticeText, { color: colors.textSubtle }]}>
                      {t('farmer.zones.noFarmBoundary')}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.listHeaderRow}>
                  <Icon name="folder" size={14} color={colors.brandGreen} style={styles.listHeaderIcon} />
                  <Text style={[styles.listHeaderTitle, { color: colors.brandGreen }]}>
                    {t('farmer.zones.allZones')}
                  </Text>
                </View>

                {zonesError ? <Text style={styles.errorText}>{zonesError}</Text> : null}

                {zonesLoading ? (
                  <Skeleton height={MIN_TOUCH_TARGET * 3} width="100%" />
                ) : zones.length === 0 ? (
                  <Text style={[styles.emptyText, { color: colors.textSubtle }]}>{t('farmer.zones.empty')}</Text>
                ) : (
                  <>
                    {/* Paging carousel: see the ZONE_CARD_WIDTH_RATIO docblock above for why
                        `snapToInterval` + `decelerationRate` rather than `pagingEnabled` or a
                        carousel dependency. `onMomentumScrollEnd` (not `onScroll`) fires once the
                        snap has actually settled, which is when the map should follow. */}
                    <ScrollView
                      ref={zoneListRef}
                      onContentSizeChange={() =>
                        zoneListRef.current?.scrollTo({ x: activeZoneIndex * zoneSnapInterval, animated: false })
                      }
                      horizontal={true}
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.zoneList}
                      snapToInterval={zoneSnapInterval}
                      decelerationRate="fast"
                      snapToAlignment="start"
                      onMomentumScrollEnd={handleZoneListScrollEnd}
                      testID="zones-card-list"
                    >
                      {zones.map((zone, index) => renderZoneCard(zone, index))}
                    </ScrollView>
                    {zones.length > 1 ? (
                      <View
                        style={styles.zoneDotsRow}
                        accessibilityElementsHidden={true}
                        importantForAccessibility="no-hide-descendants"
                        testID="zones-page-dots"
                      >
                        {zones.map((zone, index) => (
                          <View
                            key={zone.id}
                            style={[
                              styles.zoneDot,
                              {
                                backgroundColor:
                                  index === activeZoneIndex ? colors.brandGreen : colors.borderMedium,
                              },
                              index === activeZoneIndex && styles.zoneDotActive,
                            ]}
                            testID={`zones-page-dot-${index}`}
                          />
                        ))}
                      </View>
                    ) : null}
                  </>
                )}
              </View>
            )}
          </View>
        ) : null}
      </View>

      {/* FOOTER -- hidden in fullscreen. Overview: leave / done. Editing: cancel or save this zone. */}
      {isFullscreen ? null : (
        <View style={[styles.footer, { borderTopColor: colors.borderDivider, backgroundColor: colors.white }]}>
          {isEditing ? (
            <>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.borderLight }]}
                onPress={editor.requestCancel}
                disabled={editor.submitting}
                testID="zones-cancel-editing"
              >
                <Text style={[styles.cancelBtnText, { color: colors.textDark }]}>{t('farmer.common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.brandGreen, opacity: editor.submitting ? 0.7 : 1 }]}
                onPress={handleConfirmShape}
                disabled={editor.submitting}
                testID="add-zone-save"
              >
                {editor.submitting ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <Icon name="check" size={16} color={colors.white} style={styles.saveBtnIcon} />
                    <Text style={styles.saveBtnText}>{t('farmer.zones.add.saveZone')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.borderLight }]} onPress={onNavigateBack}>
                <Text style={[styles.cancelBtnText, { color: colors.textDark }]}>{t('farmer.common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.brandGreen }]} onPress={onSave}>
                <Icon name="save" size={16} color={colors.white} style={styles.saveBtnIcon} />
                <Text style={styles.saveBtnText}>{t('farmer.zones.saveZones')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* ZONE DETAILS POPUP for the inline editor (name, area, soil / exposure / irrigation). */}
      <ZoneDetailsModal editor={editor} />

      {/* ================= EDIT ZONE MODAL (details only, from a card's pencil) ================= */}
      <Modal
        visible={isEditModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalScrim} pointerEvents="none" />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {t('farmer.zones.edit.title', { name: editingZone?.name || t('farmer.zones.thisZone') })}
              </Text>
              <TouchableOpacity
                onPress={() => setIsEditModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel={t('farmer.common.close')}
              >
                <Icon name="close" size={20} color={P.twGray500} />
              </TouchableOpacity>
            </View>

            {/* The pencil is what a farmer reaches for to "edit a zone", but this popup only edits
                details -- so it also carries a labelled way into the zone's boundary on the map,
                instead of leaving that solely to the card's unlabelled boundary icon. */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.modalBoundaryBtn, { borderColor: colors.brandGreen }]}
              onPress={handleEditBoundaryFromModal}
              disabled={modalSaving}
              accessibilityRole="button"
              testID="zones-edit-modal-boundary"
            >
              <Icon name="crop_free" size={16} color={colors.brandGreen} />
              <Text style={[styles.modalBoundaryBtnText, { color: colors.brandGreen }]}>
                {editingZone && (zoneRings.get(editingZone.id) ?? []).length > 0
                  ? t('farmer.zones.edit.editBoundaryOnMap')
                  : t('farmer.zones.edit.drawBoundaryOnMap')}
              </Text>
            </TouchableOpacity>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>{t('farmer.zones.field.name')}</Text>
              <TextInput
                style={styles.textInput}
                value={editName}
                onChangeText={setEditName}
                placeholder={t('farmer.zones.field.name')}
                placeholderTextColor={P.twGray400}
              />

              <Text style={styles.inputLabel}>{t('farmer.zones.field.soil')}</Text>
              {renderOptionChips(SOIL_OPTIONS, editSoil, setEditSoil)}

              <Text style={styles.inputLabel}>{t('farmer.zones.field.exposure')}</Text>
              {renderOptionChips(EXPOSURE_OPTIONS, editExposure, setEditExposure)}

              <Text style={styles.inputLabel}>{t('farmer.zones.field.irrigation')}</Text>
              {renderOptionChips(IRRIGATION_OPTIONS, editIrrigation, setEditIrrigation)}

              {/* CROP DETAILS — local-only, see the `localCrops` docblock above. */}
              <Text style={styles.inputLabel}>{t('farmer.zones.edit.cropLabel')}</Text>
              <Text style={styles.cropNotSavedNote}>{t('farmer.zones.edit.cropNotSaved')}</Text>
              <View style={styles.cropInputsRow}>
                <TextInput
                  style={[styles.textInput, styles.cropNameInput]}
                  value={editCropName}
                  onChangeText={setEditCropName}
                  placeholder={t('farmer.zones.edit.cropNamePlaceholder')}
                  placeholderTextColor={P.twGray400}
                />
                <TextInput
                  style={[styles.textInput, styles.cropDayInput]}
                  value={editCropDay}
                  onChangeText={setEditCropDay}
                  placeholder={t('farmer.zones.edit.cropDayPlaceholder')}
                  keyboardType="numeric"
                  placeholderTextColor={P.twGray400}
                />
              </View>

              {modalError ? <Text style={styles.modalErrorText}>{modalError}</Text> : null}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsEditModalVisible(false)}>
                <Text style={styles.modalCancelBtnText}>{t('farmer.common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, { backgroundColor: colors.brandGreen, opacity: modalSaving ? 0.7 : 1 }]}
                onPress={() => void handleSaveEdit()}
                disabled={modalSaving}
              >
                {modalSaving ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.modalSaveBtnText}>{t('farmer.common.save')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  backBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: radius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBox: { flex: 1 },
  headerTitle: { fontSize: typography.title, fontWeight: '800' },
  headerSubtitle: { fontSize: typography.bodySmall },

  errorText: {
    color: colors.requiredRed,
    fontSize: typography.bodySmall,
    fontWeight: weights.semibold,
    marginTop: spacing.sm,
  },
  emptyText: {
    fontSize: typography.body,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },

  farmSelectorSkeleton: { marginTop: spacing.md },
  farmSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
    backgroundColor: colors.white,
    minHeight: MIN_TOUCH_TARGET,
  },
  farmSelectorDisabled: { opacity: 0.5 },
  farmIconBox: {
    width: spacing.xxl,
    height: spacing.xxl,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  farmSelectorText: { flex: 1 },
  farmSelectorCaption: { fontSize: typography.caption, fontWeight: '800' },
  farmSelectorName: { fontSize: typography.bodyLarge, fontWeight: weights.bold },

  mapArea: {
    flex: 1,
    position: 'relative',
  },
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },

  farmDropdownMenu: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderRadius: radius.card,
    paddingVertical: spacing.xs,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 30,
  },
  farmDropdownScroll: { maxHeight: (MIN_TOUCH_TARGET + spacing.lg) * 5 },
  farmDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: MIN_TOUCH_TARGET,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  farmDropdownItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  farmDropdownItemTextCol: { flex: 1 },
  farmDropdownItemText: { fontSize: typography.body },
  farmDropdownItemSub: { fontSize: typography.caption },

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
  leftMapControls: {
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  rightControls: {
    gap: spacing.sm,
    alignItems: 'flex-end',
  },
  legendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    height: spacing.xxl + spacing.xs,
    borderRadius: radius.pill,
    shadowColor: P.black,
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  legendDash: {
    width: spacing.lg,
    borderTopWidth: 3,
    borderStyle: 'dashed',
  },
  legendText: {
    color: P.nearBlack,
    fontSize: typography.bodySmall,
    fontWeight: weights.bold,
  },
  zoomControl: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    overflow: 'hidden',
    shadowColor: P.black,
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  zoomButton: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomDivider: {
    height: 1,
    marginHorizontal: spacing.sm,
    backgroundColor: colors.borderDivider,
  },
  actionPill: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    height: spacing.xxl + spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    shadowColor: P.black,
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  actionPillText: {
    color: P.nearBlack,
    fontSize: typography.bodySmall,
    fontWeight: weights.bold,
  },
  editingBadge: {
    backgroundColor: P.amber600,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    height: spacing.xxl + spacing.xs,
    justifyContent: 'center',
  },
  editingText: { color: P.black, fontSize: typography.bodySmall, fontWeight: weights.bold },

  mapIconRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  mapIconGroup: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  // The view tools only: stacked, one button wide. The shape tools keep the row above.
  mapIconColumn: {
    flexDirection: 'column',
    gap: spacing.sm,
  },
  // The positioning context for one tool's tooltip bubble.
  mapIconBtnWrap: { position: 'relative' },
  // A fixed-width, right-anchored box the bubble shrinks into: an absolutely positioned bubble
  // with no width would otherwise be measured against its 48dp parent and wrap one word per line.
  mapTooltipWrap: {
    position: 'absolute',
    width: MIN_TOUCH_TARGET * 5,
    alignItems: 'flex-end',
    zIndex: 20,
    elevation: 6,
  },
  // Bottom row: over the button, right edges aligned.
  mapTooltipAbove: { right: 0, bottom: '100%', marginBottom: spacing.xs },
  // Vertical column: beside the button, vertically centred on it. Above/below would put the bubble
  // on the neighbouring tool in the stack; to the left there is only open map.
  mapTooltipLeft: { right: '100%', top: 0, bottom: 0, marginRight: spacing.sm, justifyContent: 'center' },
  // Same floating-chip language as `legendChip` / `rejectionNotice`: white, pill, soft shadow.
  mapTooltip: {
    maxWidth: '100%',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    shadowColor: P.black,
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  mapTooltipText: {
    color: P.nearBlack,
    fontSize: typography.bodySmall,
    fontWeight: weights.semibold,
  },
  mapIconBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.black,
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  mapIconBtnDisabled: { opacity: 0.6 },
  // Pressable has no activeOpacity; this is the TouchableOpacity feedback the tools had before.
  mapIconBtnPressed: { opacity: 0.8 },

  bottomContainer: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 10,
  },
  rejectionNoticeWrap: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  rejectionNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    maxWidth: '100%',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.requiredRed,
    shadowColor: P.black,
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  rejectionNoticeText: {
    flexShrink: 1,
    color: P.nearBlack,
    fontSize: typography.bodySmall,
    fontWeight: weights.semibold,
  },
  bottomCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    shadowColor: P.black,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  metricsRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricColDivider: {
    borderRightWidth: 1,
    borderRightColor: colors.borderLight,
  },
  metricVal: { fontSize: typography.bodyLarge, fontWeight: '800' },
  metricLabel: { fontSize: typography.caption, fontWeight: weights.semibold, color: P.blueGrey400, marginTop: 2 },

  noticeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  noticeIcon: { marginRight: spacing.xs, marginTop: 1 },
  noticeText: { flex: 1, fontSize: typography.caption },

  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  listHeaderIcon: { marginRight: spacing.xs },
  listHeaderTitle: { fontSize: typography.bodySmall, fontWeight: '800', letterSpacing: 0.5 },

  zoneList: { gap: spacing.sm, paddingRight: spacing.xs },
  zoneDotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  zoneDot: {
    width: spacing.xs,
    height: spacing.xs,
    borderRadius: radius.full,
  },
  // The active page's dot stretches into a short pill rather than just changing colour, so the
  // current position reads at a glance without relying on colour alone.
  zoneDotActive: {
    width: spacing.lg,
  },
  zoneCard: {
    borderWidth: 1.5,
    borderRadius: radius.card,
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  zoneCardFocused: {
    borderWidth: 3,
  },
  zoneCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  zoneIcon: {
    width: spacing.xxl,
    height: spacing.xxl,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  zoneIconText: { color: colors.white, fontSize: typography.body, fontWeight: '800' },
  zoneTitleCol: { flex: 1 },
  zoneTitle: { fontSize: typography.body, fontWeight: weights.bold },
  zoneSub: { fontSize: typography.bodySmall },
  zoneCardDetails: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: P.surfaceMuted,
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  detailCol: { flex: 1 },
  detailLabel: { fontSize: typography.caption, fontWeight: '800', color: P.grey500, marginBottom: 2 },
  detailValue: { fontSize: typography.bodySmall, fontWeight: weights.semibold, color: P.grey800 },
  cropPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
  },
  cropPillIcon: { marginRight: spacing.xs },
  cropPillText: { fontSize: typography.caption, fontWeight: weights.bold, flexShrink: 1 },
  zoneActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: radius.full,
    backgroundColor: P.lightGreen50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionDeleteBtn: {
    backgroundColor: P.red50,
  },

  /* MODAL STYLES */
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.input,
  },
  modalScrim: {
    ...StyleSheet.absoluteFillObject,
    // `black` is the token reserved for scrims; dimmed with opacity rather than an rgba literal.
    backgroundColor: P.black,
    opacity: 0.5,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.input,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  modalTitle: {
    flex: 1,
    fontSize: typography.title,
    fontWeight: weights.bold,
    color: colors.textDark,
  },
  modalBoundaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: MIN_TOUCH_TARGET,
    borderWidth: 1.5,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
  modalBoundaryBtnText: { fontSize: typography.body, fontWeight: weights.bold },
  modalScroll: { maxHeight: (MIN_TOUCH_TARGET + spacing.lg) * 7 },
  inputLabel: {
    fontSize: typography.body,
    fontWeight: weights.semibold,
    color: colors.textDark,
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
  },
  cropNotSavedNote: {
    fontSize: typography.caption,
    fontWeight: weights.semibold,
    color: P.blueGrey400,
    marginBottom: spacing.sm,
  },
  cropInputsRow: { flexDirection: 'row', gap: spacing.sm },
  cropNameInput: { flex: 2 },
  cropDayInput: { flex: 1 },
  textInput: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    minHeight: MIN_TOUCH_TARGET,
    fontSize: typography.body,
    color: colors.textDark,
    backgroundColor: colors.bgLight,
    marginBottom: spacing.sm,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  chipBtn: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bgLight,
  },
  chipText: {
    fontSize: typography.body,
    color: colors.textDark,
  },
  modalErrorText: {
    color: colors.requiredRed,
    fontSize: typography.bodySmall,
    fontWeight: weights.semibold,
    marginTop: spacing.xs,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  modalCancelBtn: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.bgLight,
  },
  modalCancelBtnText: {
    fontSize: typography.body,
    fontWeight: weights.semibold,
    color: colors.textSubtle,
  },
  modalSaveBtn: {
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.input,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveBtnText: {
    fontSize: typography.body,
    fontWeight: weights.bold,
    color: colors.white,
  },

  footer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.input,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    gap: spacing.md,
  },
  cancelBtn: {
    flex: 1,
    height: MIN_TOUCH_TARGET + spacing.sm,
    borderRadius: radius.card,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: { fontSize: typography.bodyLarge, fontWeight: weights.bold },
  saveBtn: {
    flex: 1.5,
    flexDirection: 'row',
    height: MIN_TOUCH_TARGET + spacing.sm,
    borderRadius: radius.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnIcon: { marginRight: spacing.xs },
  saveBtnText: { color: colors.white, fontSize: typography.bodyLarge, fontWeight: weights.bold },
});
