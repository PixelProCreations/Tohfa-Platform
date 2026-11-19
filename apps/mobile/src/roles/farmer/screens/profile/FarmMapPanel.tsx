/**
 * One farm's boundary map with registration Step 3's floating controls -- Search pill + overlay,
 * zoom stepper, Locate Me, Draw/Edit Boundary, Undo, Clear, the centroid badge and the editing
 * badge -- and an optional full-screen toggle.
 *
 * Extracted from FMBSketchScreen so its main map and its Edit farm form show the SAME controls
 * (both built from ../registration/mapControls, Step 3's own pieces) instead of two copies that
 * drift apart. Behaviour is unchanged from what FMBSketchScreen rendered inline; the testIDs are
 * `${testIDPrefix}-…`, so FMB Sketch's existing `fmb-sketch-*` ids are preserved.
 *
 * FarmBoundaryMap reads `initialCenter` / `initialPolygon` / `initialZoom` only at mount; the caller
 * changes `mapKey` to point the map at a different farm (or a freshly saved boundary).
 */
import React, { type RefObject } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';
import {
  FarmBoundaryMap,
  Icon,
  type FarmBoundaryMapHandle,
  type FarmBoundaryMapMode,
  type FarmBoundaryMapOverlay,
} from '@tohfa/mobile-ui';
import { colors, typography, spacing, radius } from '../../theme';
import { authPalette as P } from '../../theme';
import { calculatePolygonMetrics } from '../../utils/geo';
import { t } from '../../../../i18n/farmer';
import {
  CrosshairIcon,
  FullscreenExitIcon,
  FullscreenIcon,
  MapPlaceSearchOverlay,
  MinusIcon,
  PenIcon,
  PlusIcon,
  SearchIcon,
  mapControlStyles as mapUi,
  useMapPlaceSearch,
  type MapboxFeature,
} from '../registration/mapControls';
import type { FarmMapTarget } from './farmMapPreview';

/** Step 3's zoom-stepper touch padding: the 36px buttons get a 48px target without growing. */
const ZOOM_HIT_SLOP = { top: 6, bottom: 6, left: 6, right: 6 };

export interface FarmMapPanelProps {
  mapRef: RefObject<FarmBoundaryMapHandle | null>;
  /** Changing it remounts the map (new farm, or a freshly saved boundary). */
  mapKey: string;
  /** Where the map opens -- see `buildFarmMapTarget`. */
  target: FarmMapTarget;
  /** The live ring (closed or open) as last reported by `onPolygonChange`. */
  coords: [number, number][];
  onPolygonChange: (next: [number, number][]) => void;
  mode: FarmBoundaryMapMode;
  onModeChange: (mode: FarmBoundaryMapMode) => void;
  /** e.g. `fmb-sketch` -> `fmb-sketch-farm-boundary-map`, `fmb-sketch-search-open`, ... */
  testIDPrefix: string;
  containerStyle: StyleProp<ViewStyle>;
  /** Omit to hide the full-screen toggle. */
  fullscreen?: { isFullscreen: boolean; onToggle: () => void } | undefined;
  /** A Search pick: lets a form keep the place's village/district, as Step 3 does. */
  onPlaceSelected?: ((item: MapboxFeature) => void) | undefined;
  /**
   * Read-only context shapes drawn under the farm boundary (e.g. FMB Sketch's zones of the selected
   * farm). A live prop: changing it needs no remount. Omit for none.
   */
  readOnlyOverlays?: FarmBoundaryMapOverlay[] | undefined;
}

export function FarmMapPanel({
  mapRef,
  mapKey,
  target,
  coords,
  onPolygonChange,
  mode,
  onModeChange,
  testIDPrefix,
  containerStyle,
  fullscreen,
  onPlaceSelected,
  readOnlyOverlays,
}: FarmMapPanelProps) {
  const search = useMapPlaceSearch(mapRef, onPlaceSelected);
  const hasShape = coords.length >= 3;
  const metrics = calculatePolygonMetrics(coords);

  /** The one draw/edit toggle: draw when there is no shape yet, otherwise edit its vertices. */
  function handleToggleDraw() {
    if (mode !== 'view') {
      mapRef.current?.finish();
      return;
    }
    if (hasShape) mapRef.current?.startEditing();
    else mapRef.current?.startDrawing();
  }

  // Honest empty state: this farm has no boundary and no stored location, so the camera is only
  // wherever the device GPS (or the map's default) put it -- say so rather than imply it is the farm.
  const showNoLocation = target.kind === 'none' && !hasShape && mode === 'view' && !search.isSearchOpen;

  return (
    <View style={containerStyle}>
      <FarmBoundaryMap
        key={mapKey}
        initialCenter={target.center}
        initialPolygon={hasShape ? coords : null}
        initialZoom={target.zoom}
        onPolygonChange={onPolygonChange}
        onModeChange={onModeChange}
        {...(readOnlyOverlays ? { readOnlyOverlays } : {})}
        // The map's own built-in search bar is off: the Step 3 Search pill and overlay replace it.
        hideSearchBar={true}
        searchPlaceholder={t('farmer.map.searchPlaceholder')}
        ref={mapRef}
        testID={`${testIDPrefix}-farm-boundary-map`}
      />

      {search.isSearchOpen ? (
        <MapPlaceSearchOverlay search={search} />
      ) : (
        <View style={mapUi.topMapControls} pointerEvents="box-none">
          <View style={mapUi.leftMapControls} pointerEvents="box-none">
            {/* Only once there IS a boundary: a placeholder coordinate would read as a real
                position on the farmer's own farm. */}
            {hasShape ? (
              <View style={mapUi.coordsBadge} pointerEvents="none">
                <CrosshairIcon size={13} color={colors.brandGreen} />
                <Text style={mapUi.coordsText}>
                  {metrics.centroid.latitude.toFixed(4)}, {metrics.centroid.longitude.toFixed(4)}
                </Text>
              </View>
            ) : null}

            <View style={mapUi.zoomControl}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={mapUi.zoomButton}
                onPress={() => mapRef.current?.zoomIn()}
                hitSlop={ZOOM_HIT_SLOP}
                accessibilityRole="button"
                accessibilityLabel={t('farmer.map.zoomIn')}
              >
                <PlusIcon size={16} color={colors.brandGreen} />
              </TouchableOpacity>
              <View style={mapUi.zoomDivider} />
              <TouchableOpacity
                activeOpacity={0.7}
                style={mapUi.zoomButton}
                onPress={() => mapRef.current?.zoomOut()}
                hitSlop={ZOOM_HIT_SLOP}
                accessibilityRole="button"
                accessibilityLabel={t('farmer.map.zoomOut')}
              >
                <MinusIcon size={16} color={colors.brandGreen} />
              </TouchableOpacity>
            </View>

            {fullscreen ? (
              <View style={mapUi.zoomControl}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={mapUi.zoomButton}
                  onPress={fullscreen.onToggle}
                  hitSlop={ZOOM_HIT_SLOP}
                  accessibilityRole="button"
                  accessibilityState={{ selected: fullscreen.isFullscreen }}
                  accessibilityLabel={
                    fullscreen.isFullscreen
                      ? t('farmer.map.fullscreenExitA11y')
                      : t('farmer.map.fullscreenEnterA11y')
                  }
                  testID={`${testIDPrefix}-fullscreen-toggle`}
                >
                  {fullscreen.isFullscreen ? (
                    <FullscreenExitIcon size={16} color={colors.brandGreen} />
                  ) : (
                    <FullscreenIcon size={16} color={colors.brandGreen} />
                  )}
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          <View style={mapUi.rightControls} pointerEvents="box-none">
            <TouchableOpacity
              activeOpacity={0.8}
              style={mapUi.actionPill}
              onPress={search.open}
              accessibilityRole="button"
              testID={`${testIDPrefix}-search-open`}
            >
              <SearchIcon size={14} color={colors.brandGreen} />
              <Text style={mapUi.actionPillText}>{t('farmer.map.search')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={mapUi.actionPill}
              onPress={() => void mapRef.current?.locateMe()}
              accessibilityRole="button"
              testID={`${testIDPrefix}-locate-me`}
            >
              <CrosshairIcon size={14} color={colors.brandGreen} />
              <Text style={mapUi.actionPillText}>{t('farmer.map.locateMe')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleToggleDraw}
              style={[mapUi.actionPill, mode !== 'view' && mapUi.actionPillActive]}
              accessibilityRole="button"
              testID={`${testIDPrefix}-draw-toggle`}
            >
              <PenIcon size={14} color={mode !== 'view' ? colors.white : colors.brandGreen} />
              <Text style={[mapUi.actionPillText, mode !== 'view' && mapUi.actionPillTextActive]}>
                {mode === 'draw'
                  ? t('farmer.map.doneDrawing')
                  : mode === 'edit'
                    ? t('farmer.map.doneEditing')
                    : hasShape
                      ? t('farmer.map.editBoundary')
                      : t('farmer.map.drawBoundary')}
              </Text>
            </TouchableOpacity>

            {/* Undo / Clear have no Step 3 counterpart on the map (Step 3 deletes from its bottom
                card); kept as pills in the same style. */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={mapUi.actionPill}
              onPress={() => mapRef.current?.undo()}
              accessibilityRole="button"
              testID={`${testIDPrefix}-undo`}
            >
              <Icon name="undo" size={14} color={colors.brandGreen} />
              <Text style={mapUi.actionPillText}>{t('farmer.map.undo')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={mapUi.actionPill}
              onPress={() => mapRef.current?.clear()}
              accessibilityRole="button"
              testID={`${testIDPrefix}-clear`}
            >
              <Icon name="delete" size={14} color={P.red500} />
              <Text style={mapUi.actionPillText}>{t('farmer.map.clear')}</Text>
            </TouchableOpacity>

            {mode !== 'view' ? (
              <View style={mapUi.editingBadge} pointerEvents="none">
                <PenIcon size={13} color={P.black} />
                <Text style={mapUi.editingText}>{t('farmer.map.editingBadge')}</Text>
              </View>
            ) : null}
          </View>
        </View>
      )}

      {showNoLocation ? (
        <View style={panelStyles.noLocation} pointerEvents="none" testID={`${testIDPrefix}-no-location`}>
          <Icon name="info" size={16} color={colors.textDark} />
          <Text style={panelStyles.noLocationText}>{t('farmer.fmb.noLocation')}</Text>
        </View>
      ) : null}
    </View>
  );
}

const panelStyles = StyleSheet.create({
  noLocation: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: P.amber50,
    borderWidth: 1,
    borderColor: P.amber200,
  },
  noLocationText: {
    flex: 1,
    color: colors.textDark,
    fontSize: typography.bodySmall,
    fontWeight: '600',
  },
});
