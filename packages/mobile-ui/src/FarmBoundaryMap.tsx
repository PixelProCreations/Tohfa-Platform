import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { Feature, Point } from 'geojson';
import { MAPBOX_ACCESS_TOKEN } from '@env';
import { useTheme } from './theme';
import { Icon } from './Icon';
import { ringLabelPosition } from './overlayLabel';
import { containmentRingOf, isPointInRing, ringFitsWithin } from './pointInRing';

let Mapbox: any = null;
let Camera: any = null;
let FillLayer: any = null;
let LineLayer: any = null;
let locationManager: any = null;
let MapView: any = null;
let PointAnnotation: any = null;
let requestAndroidLocationPermissions: any = null;
let ShapeSource: any = null;
export type MapboxLocation = any;

let isMapboxAvailable = false;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const rnMapbox = require('@rnmapbox/maps');
  Mapbox = rnMapbox.default || rnMapbox;
  Camera = rnMapbox.Camera;
  FillLayer = rnMapbox.FillLayer;
  LineLayer = rnMapbox.LineLayer;
  locationManager = rnMapbox.locationManager;
  MapView = rnMapbox.MapView;
  PointAnnotation = rnMapbox.PointAnnotation;
  requestAndroidLocationPermissions = rnMapbox.requestAndroidLocationPermissions;
  ShapeSource = rnMapbox.ShapeSource;
  if (Mapbox && typeof Mapbox.setAccessToken === 'function') {
    isMapboxAvailable = true;
  }
} catch {
  isMapboxAvailable = false;
}

const PUBLIC_MAPBOX_TOKEN =
  typeof MAPBOX_ACCESS_TOKEN === 'string' ? MAPBOX_ACCESS_TOKEN : '';

let mapboxConfigured = false;

if (isMapboxAvailable && Mapbox && typeof Mapbox.setAccessToken === 'function') {
  try {
    Mapbox.setAccessToken(PUBLIC_MAPBOX_TOKEN);
    mapboxConfigured = true;
  } catch {
    // Handled in ensureMapboxConfigured
  }
}

/** Idempotent — safe to call from every mount of every map on screen. */
function ensureMapboxConfigured(): void {
  if (mapboxConfigured || !isMapboxAvailable || !Mapbox) return;
  try {
    Mapbox.setAccessToken(PUBLIC_MAPBOX_TOKEN);
    mapboxConfigured = true;
  } catch {
    isMapboxAvailable = false;
  }
}

/** [longitude, latitude] — the GeoJSON coordinate order, not [lat, lng]. */
export type LngLat = [number, number];

export type FarmBoundaryMapMode = 'view' | 'draw' | 'edit';

/**
 * A polygon drawn alongside the map's own (editable) boundary purely for context -- e.g. the
 * parent farm's outline behind a zone being drawn, or every sibling zone of a farm at once. It
 * is never editable, never draggable and never tappable: it has no vertex handles, and map taps
 * keep going to the primary boundary exactly as they do without overlays.
 */
export interface FarmBoundaryMapOverlay {
  /** Stable, unique per overlay -- it becomes part of the Mapbox source/layer ids. */
  id: string;
  /** [[lng, lat], ...], open or closed. Fewer than 3 distinct vertices renders nothing. */
  ring: LngLat[];
  /** Line colour, and fill colour when `filled`. Caller supplies it from its theme tokens. */
  color: string;
  /** Tint the inside of the shape. Default `true`; pass `false` for an outline-only backdrop. */
  filled?: boolean;
  /** Dashed outline, e.g. to read as "the farm's edge" rather than "a zone". Default `false`. */
  dashed?: boolean;
  /** Thicker line and stronger fill, for the one overlay the caller is currently focusing. */
  emphasized?: boolean;
  /**
   * Short text (e.g. a zone's letter badge) drawn in a small circle at the ring's centroid, in
   * `color`, so the map and the caller's own list share one key. Like the shape itself it is pure
   * context: not draggable and wired to no handler. Omitted (the default) draws no label.
   */
  label?: string;
}

/**
 * Which interaction `containWithin` refused: a tap that would have added a vertex, a drag that would
 * have moved one, or a `setPolygon` ring with at least one vertex outside.
 */
export type FarmBoundaryMapRejection = 'tap' | 'drag' | 'polygon';

export interface FarmBoundaryMapSetPolygonOptions {
  /**
   * Apply the ring even if it is not inside `containWithin`. For a caller loading a shape that was
   * SAVED before the constraint applied (e.g. a zone whose farm was later redrawn smaller), so the
   * farmer can open it and drag its stray vertices back in -- every later tap/drag is still held to
   * the constraint. Has no effect without `containWithin`.
   */
  skipContainment?: boolean;
}

export interface FarmBoundaryMapHandle {
  /** Enters draw mode. Taps on the map append a new vertex. No-op if `readOnly`. */
  startDrawing: () => void;
  /** Enters edit mode. Existing vertices become drag handles. No-op if `readOnly` or fewer than 3 vertices. */
  startEditing: () => void;
  /** Returns to view mode (stops drawing/editing). */
  finish: () => void;
  /** Removes the most recently added vertex. */
  undo: () => void;
  /** Removes every vertex, back to an empty boundary. */
  clear: () => void;
  /**
   * Replaces the whole boundary with `ring` ([[lng, lat], ...], open or closed) and returns to
   * view mode -- for a caller that builds the outline itself (e.g. registration Step 3's
   * manually-typed points) rather than from taps. Fires `onPolygonChange` exactly like a tap or
   * drag would, synchronously. Does NOT move the camera; pair it with `flyTo` if needed.
   * No-op if `readOnly`.
   *
   * With `containWithin` set, a ring with ANY vertex outside it is refused whole -- nothing changes
   * (not the shape, not the mode, no `onPolygonChange`) and `onRejectedPoint('polygon')` fires --
   * unless `options.skipContainment` is passed. Refusing the whole ring rather than dropping the
   * stray vertices is deliberate: a partial shape would be one the caller never asked for.
   */
  setPolygon: (ring: LngLat[], options?: FarmBoundaryMapSetPolygonOptions) => void;
  /** Re-centers the camera on the device's current GPS position. */
  locateMe: () => Promise<void>;
  /**
   * Geocodes free-text via Mapbox's own Geocoding API and recenters the
   * camera on the first match. Resolves `true` if a match was found.
   */
  search: (query: string) => Promise<boolean>;
  /** Animates the camera to the specified coordinate. */
  flyTo: (center: LngLat, zoomLevel?: number, durationMs?: number) => void;
  /** Steps the camera zoom in by one level, clamped to `MAX_ZOOM`. */
  zoomIn: () => void;
  /** Steps the camera zoom out by one level, clamped to `MIN_ZOOM`. */
  zoomOut: () => void;
}

export interface FarmBoundaryMapProps {
  /** [lng, lat] to center on first render, or `null` to use the device's GPS location. */
  initialCenter?: LngLat | null;
  /** GeoJSON ring — [[lng, lat], ...] — or `null`/empty to start a fresh boundary. */
  initialPolygon?: LngLat[] | null;
  /** Called with the current ring every time a vertex is added, dragged, undone, or cleared. */
  onPolygonChange: (coordinates: LngLat[]) => void;
  /** Renders the boundary and satellite map with no draw/edit interaction and no search bar. */
  readOnly?: boolean;
  /** Explicitly hides the place-name search bar even in interactive mode. */
  hideSearchBar?: boolean;
  /** Placeholder text for the built-in place-name search bar. Caller supplies this via `t()`. */
  searchPlaceholder: string;
  /** Fires whenever draw/edit/view mode changes, so the caller's own buttons can reflect it. */
  onModeChange?: (mode: FarmBoundaryMapMode) => void;
  /**
   * A single non-draggable pin, for a coordinate that has no boundary of its own — e.g. a
   * manually-typed lat/lng fallback (registration Step 3) when the farmer can't GPS-lock or draw
   * a parcel. A manually-typed point has no polygon to render, so this is the only way to show
   * the farmer that something is actually marked on the map.
   *
   * Ignored whenever there is a boundary shape (>= 3 vertices) — a drawn parcel already has its
   * own fill/line visual, so the two are mutually exclusive rather than layered. `null`/`undefined`
   * (the default) renders nothing, matching every existing caller that doesn't pass this prop.
   */
  markerCoordinate?: LngLat | null;
  /**
   * Read-only context polygons rendered underneath the primary boundary -- see
   * `FarmBoundaryMapOverlay`. `undefined`/empty (the default) renders nothing extra, so every
   * existing caller that doesn't pass this prop behaves exactly as before.
   */
  readOnlyOverlays?: FarmBoundaryMapOverlay[];
  /**
   * Colour of the primary (editable) boundary's fill, outline and vertex handles. Defaults to the
   * theme's primary colour, which is what every existing caller gets.
   */
  boundaryColor?: string;
  /**
   * A ring ([[lng, lat], ...], open or closed) the primary boundary must stay inside -- e.g. the
   * parent farm's outline while a zone of it is drawn. When set, a tap outside it adds no vertex, a
   * vertex dragged outside it snaps back to where it was, and `setPolygon` refuses a ring with any
   * vertex outside it; each refusal fires `onRejectedPoint`. A point exactly on the ring's edge counts
   * as inside (see `isPointInRing` in ./pointInRing.ts). Only VERTICES are tested -- an edge between
   * two inside vertices may still cut across a concave notch of the ring.
   *
   * `undefined`/`null` (the default), or a ring too degenerate to contain anything (fewer than 3
   * distinct vertices, or collinear), means NO constraint: behaviour is exactly what every caller that
   * does not pass this prop has always had.
   */
  containWithin?: LngLat[] | null;
  /**
   * Fires each time `containWithin` refuses a tap, drag or `setPolygon` ring -- so the caller can tell
   * the farmer why nothing happened. This component shows no message of its own. Never fires without
   * `containWithin`.
   */
  onRejectedPoint?: (attempt: FarmBoundaryMapRejection) => void;
  /**
   * `false` turns off the map's own camera gestures (pan, pinch-zoom, rotate, pitch) -- for a small
   * preview embedded in a vertically scrolling page, where a map that grabs the drag would fight the
   * page's own scroll. The camera still honours `initialCenter`/`flyTo`; only the farmer's fingers
   * stop moving it. `true` (the default) passes nothing to the native `MapView`, so every caller that
   * does not set this prop keeps Mapbox's own gesture defaults exactly as before.
   */
  gesturesEnabled?: boolean;
  /**
   * The camera's zoom level at mount, read only once (same mount-time-only contract as
   * `initialCenter`/`initialPolygon`). Defaults to `DEFAULT_ZOOM` (17), tuned for a full-screen
   * boundary editor -- a small embedded preview (e.g. a profile card a few hundred px tall)
   * showing a whole farm needs a lower zoom so the shape isn't cropped by the container, without
   * changing the zoom every other caller already relies on.
   */
  initialZoom?: number;
  testID?: string;
}

// Nilgiris — used only as a last-resort camera center when the caller passes
// no `initialCenter` AND device GPS is unavailable/denied. Not a business
// threshold, just a sane default so the map never renders centered on
// [0, 0] (Null Island).
const FALLBACK_CENTER: LngLat = [76.6932, 11.4064];
const DEFAULT_ZOOM = 17;
// Mapbox GL's own range is 0-22, but there is no reason for a farm-boundary-drawing screen to
// zoom out past "see the whole village" or in past "see a single vertex with room to spare" --
// 2 and 20 are picked as those two sane ends, not arbitrary. Applied to the `<Camera>` below so
// they bound pinch-zoom too, not just the +/- buttons.
const MIN_ZOOM = 2;
const MAX_ZOOM = 20;
const ZOOM_STEP = 1;

/** `@rnmapbox/maps` MapView props applied when `gesturesEnabled` is `false`. */
const DISABLED_CAMERA_GESTURES = {
  scrollEnabled: false,
  zoomEnabled: false,
  rotateEnabled: false,
  pitchEnabled: false,
} as const;

function ringsEqual(a: LngLat, b: LngLat): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

/** GeoJSON polygons must close (first point === last point); vertex state below is kept open. */
function closeRing(points: LngLat[]): LngLat[] {
  if (points.length < 3) return points;
  const first = points[0]!;
  const last = points[points.length - 1]!;
  return ringsEqual(first, last) ? points : [...points, first];
}

function openRing(points: LngLat[]): LngLat[] {
  if (points.length < 2) return points;
  const first = points[0]!;
  const last = points[points.length - 1]!;
  return ringsEqual(first, last) ? points.slice(0, -1) : points;
}

/**
 * Key and native id of a vertex handle. `revision` only moves past 0 when `containWithin` refuses a
 * drag: a new id remounts the handle so it is redrawn at its accepted position (see
 * `handleVertexDragEnd`). At revision 0 -- always, for a caller without `containWithin` -- this is the
 * plain `vertex-N` every handle has always had.
 */
function vertexAnnotationId(index: number, revision: number): string {
  return revision === 0 ? `vertex-${index}` : `vertex-${index}-r${revision}`;
}

/**
 * Real, GPS-grounded satellite map + polygon boundary editor for Farmer
 * Mobile's Farm Location step (registration Step 3) and FMB Sketch screen,
 * and for the Zones screen (which also uses `readOnlyOverlays` to show a
 * farm's outline and its zones as labelled context, draws/redraws one
 * zone at a time inline as the primary boundary, and passes `containWithin`
 * so that zone's vertices stay inside the farm). Replaces the fake
 * hand-drawn `react-native-svg` canvases that used to stand in for all of them.
 *
 * Deliberately lives in @tohfa/mobile-ui rather than under
 * `roles/farmer/components/` — apps/mobile/CLAUDE.md forbids a role-local
 * `components/` directory (enforced by
 * src/tests/cross_role_import_guard.test.ts) precisely so shared UI comes
 * from this package. Farm-boundary mapping is farmer-authored today, but the
 * component itself is generic map+polygon UI with no farmer-only data or
 * logic baked in (no farmerId, no farm name) — it only ever sees the
 * coordinates it's given.
 */
export const FarmBoundaryMap = forwardRef<FarmBoundaryMapHandle, FarmBoundaryMapProps>(
  function FarmBoundaryMap(
    {
      initialCenter = null,
      initialPolygon = null,
      onPolygonChange,
      readOnly = false,
      hideSearchBar = false,
      searchPlaceholder,
      onModeChange,
      markerCoordinate = null,
      readOnlyOverlays,
      boundaryColor: boundaryColorProp,
      containWithin = null,
      onRejectedPoint,
      gesturesEnabled = true,
      initialZoom = DEFAULT_ZOOM,
      testID,
    },
    ref,
  ) {
    ensureMapboxConfigured();
    const theme = useTheme();
    const boundaryColor = boundaryColorProp ?? theme.colors.primary;
    const cameraRef = useRef<any>(null);

    const [vertices, setVertices] = useState<LngLat[]>(() =>
      initialPolygon && initialPolygon.length >= 3 ? openRing(initialPolygon) : [],
    );
    const [mode, setModeState] = useState<FarmBoundaryMapMode>('view');
    const [initialCameraCenter] = useState<LngLat>(initialCenter ?? FALLBACK_CENTER);
    // Mount-time-only, same contract as `initialCameraCenter` above -- a caller changing
    // `initialZoom` on an already-mounted map does nothing, matching every other `initial*` prop.
    const [initialCameraZoom] = useState<number>(initialZoom);
    const [query, setQuery] = useState('');
    const [searching, setSearching] = useState(false);
    // Mirrors whatever zoom the camera is actually at, so `zoomIn`/`zoomOut` step from the real
    // current level rather than a stale one -- kept in sync below wherever this component itself
    // sets a `zoomLevel` via `setCamera` (the mount-time GPS fix, `locateMe`, `flyTo`). The initial
    // value matches the `<Camera>` element's own `defaultSettings.zoomLevel` below, which is
    // `initialCameraZoom` (== `initialZoom`, or `DEFAULT_ZOOM` when the caller doesn't pass one)
    // regardless of whether `initialCenter` was supplied. Only ever read via the functional
    // `setZoom(current => ...)` form below, never directly, so the value itself is intentionally
    // not destructured.
    const [, setZoom] = useState<number>(initialCameraZoom);

    // `null` = no constraint (the default, and also what a degenerate `containWithin` reduces to).
    const containment = useMemo(() => containmentRingOf(containWithin), [containWithin]);
    // Bumped only when a drag is refused, to remount the vertex handles -- see `vertexAnnotationId`.
    // Never changes without `containWithin`, so for every other caller the ids stay `vertex-N`.
    const [vertexRevision, setVertexRevision] = useState(0);

    const setMode = useCallback(
      (next: FarmBoundaryMapMode) => {
        setModeState(next);
        onModeChange?.(next);
      },
      [onModeChange],
    );

    const emit = useCallback(
      (next: LngLat[]) => {
        setVertices(next);
        onPolygonChange(next.length >= 3 ? closeRing(next) : next);
      },
      [onPolygonChange],
    );

    // No `initialCenter` supplied -> best-effort device GPS fix on mount.
    // Falls back to FALLBACK_CENTER (already the initial camera position)
    // on permission denial or an unavailable location, silently — this is a
    // convenience recenter, not a required capability.
    useEffect(() => {
      if (initialCenter) return;
      let cancelled = false;
      (async () => {
        try {
          if (Platform.OS === 'android') {
            const granted = await requestAndroidLocationPermissions();
            if (!granted || cancelled) return;
          }
          locationManager.start();
          const location = await locationManager.getLastKnownLocation();
          if (!cancelled && location?.coords) {
            setZoom(DEFAULT_ZOOM);
            cameraRef.current?.setCamera({
              centerCoordinate: [location.coords.longitude, location.coords.latitude],
              zoomLevel: DEFAULT_ZOOM,
              animationDuration: 0,
            });
          }
        } catch {
          // Best-effort only — map stays centered on FALLBACK_CENTER.
        }
      })();
      return () => {
        cancelled = true;
      };
      // Only ever runs once per mount — `initialCenter` is treated as the
      // value at mount time, matching the "or null to use device GPS" prop contract.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleMapPress = useCallback(
      (feature: Feature) => {
        if (readOnly || mode !== 'draw') return;
        if (feature.geometry.type !== 'Point') return;
        const [lng, lat] = (feature.geometry as Point).coordinates as LngLat;
        if (containment && !isPointInRing([lng, lat], containment)) {
          onRejectedPoint?.('tap');
          return;
        }
        emit([...vertices, [lng, lat]]);
      },
      [containment, emit, mode, onRejectedPoint, readOnly, vertices],
    );

    const handleVertexDragEnd = useCallback(
      (index: number, feature: Feature) => {
        if (feature.geometry.type !== 'Point') return;
        const [lng, lat] = (feature.geometry as Point).coordinates as LngLat;
        if (containment && !isPointInRing([lng, lat], containment)) {
          // The native annotation has already moved to the drop point, and simply not emitting
          // would leave it there: its `coordinate` prop is unchanged, so React sends nothing to
          // native. Remounting the handles (new ids) redraws every one at its last ACCEPTED position.
          setVertexRevision((current) => current + 1);
          onRejectedPoint?.('drag');
          return;
        }
        const next = vertices.slice();
        next[index] = [lng, lat];
        emit(next);
      },
      [containment, emit, onRejectedPoint, vertices],
    );

    const undo = useCallback(() => {
      emit(vertices.slice(0, -1));
    }, [emit, vertices]);

    const clear = useCallback(() => {
      emit([]);
    }, [emit]);

    // Vertex state is kept open (see `closeRing`/`openRing` above), so a caller-supplied closed
    // ring is opened before it is stored; `emit` closes it again for `onPolygonChange`. Each pair
    // is copied so later mutation of the caller's array can never reach into this map's state.
    const setPolygon = useCallback(
      (ring: LngLat[], options?: FarmBoundaryMapSetPolygonOptions) => {
        if (readOnly) return;
        const next = openRing(ring.map(([lng, lat]) => [lng, lat] as LngLat));
        // Refused whole, before anything changes -- see the handle's `setPolygon` docs.
        if (containment && options?.skipContainment !== true && !ringFitsWithin(next, containment)) {
          onRejectedPoint?.('polygon');
          return;
        }
        setMode('view');
        emit(next);
      },
      [containment, emit, onRejectedPoint, readOnly, setMode],
    );

    const locateMe = useCallback(async () => {
      try {
        if (Platform.OS === 'android') {
          const granted = await requestAndroidLocationPermissions();
          if (!granted) return;
        }
        locationManager.start();
        const location: MapboxLocation | null = await locationManager.getLastKnownLocation();
        if (location?.coords) {
          setZoom(DEFAULT_ZOOM);
          cameraRef.current?.setCamera({
            centerCoordinate: [location.coords.longitude, location.coords.latitude],
            zoomLevel: DEFAULT_ZOOM,
            animationDuration: 600,
          });
        }
      } catch {
        // Best-effort — leave the camera where it was.
      }
    }, []);

    const runSearch = useCallback(
      async (rawQuery: string): Promise<boolean> => {
        const trimmed = rawQuery.trim();
        if (!trimmed) return false;
        setSearching(true);
        try {
          const url =
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(trimmed)}.json` +
            `?access_token=${encodeURIComponent(PUBLIC_MAPBOX_TOKEN)}&limit=1`;
          const response = await fetch(url);
          if (!response.ok) return false;
          const body = (await response.json()) as { features?: Array<{ center?: number[] }> };
          const center = body.features?.[0]?.center;
          if (Array.isArray(center) && center.length === 2) {
            const [lng, lat] = center as LngLat;
            cameraRef.current?.flyTo([lng, lat], 800);
            return true;
          }
          return false;
        } catch {
          return false;
        } finally {
          setSearching(false);
        }
      },
      [],
    );

    useImperativeHandle(
      ref,
      () => ({
        startDrawing: () => {
          if (readOnly) return;
          setMode('draw');
        },
        startEditing: () => {
          if (readOnly || vertices.length < 3) return;
          setMode('edit');
        },
        finish: () => setMode('view'),
        undo,
        clear,
        setPolygon,
        locateMe,
        search: runSearch,
        flyTo: (center: LngLat, zoomLevel = 17, durationMs = 1000) => {
          setZoom(zoomLevel);
          cameraRef.current?.setCamera({
            centerCoordinate: center,
            zoomLevel,
            animationDuration: durationMs,
          });
        },
        zoomIn: () => {
          setZoom((current) => {
            const next = Math.min(MAX_ZOOM, current + ZOOM_STEP);
            cameraRef.current?.setCamera({ zoomLevel: next, animationDuration: 250 });
            return next;
          });
        },
        zoomOut: () => {
          setZoom((current) => {
            const next = Math.max(MIN_ZOOM, current - ZOOM_STEP);
            cameraRef.current?.setCamera({ zoomLevel: next, animationDuration: 250 });
            return next;
          });
        },
      }),
      [clear, locateMe, readOnly, runSearch, setMode, setPolygon, undo, vertices.length],
    );

    const boundaryShape = useMemo(() => {
      if (vertices.length < 3) return null;
      return {
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'Polygon' as const,
          coordinates: [closeRing(vertices)],
        },
      };
    }, [vertices]);

    // Exactly 2 placed vertices: not enough for a closed polygon (`boundaryShape` above requires
    // >= 3), but a farmer who just placed their 2nd point should see a connecting line immediately
    // rather than nothing until a 3rd tap suddenly reveals a filled shape. Deliberately an OPEN
    // `LineString` of just the 2 points -- not `closeRing`'d into a 2-point "ring", which is
    // degenerate/meaningless (a ring needs >= 3 points to enclose anything). Mutually exclusive
    // with `boundaryShape` by vertex count alone (2 vs. >= 3 are disjoint), so the two can never
    // both be non-null for the same `vertices` state.
    const draftBoundaryLine = useMemo(() => {
      if (vertices.length !== 2) return null;
      return {
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'LineString' as const,
          coordinates: vertices,
        },
      };
    }, [vertices]);

    // Read-only context polygons (see `readOnlyOverlays`). Each is closed here exactly like the
    // primary boundary, and anything with fewer than 3 distinct vertices is dropped rather than
    // handed to Mapbox as a degenerate polygon. Empty by default, so a caller that passes nothing
    // renders nothing extra.
    const overlayShapes = useMemo(() => {
      if (!readOnlyOverlays || readOnlyOverlays.length === 0) return [];
      return readOnlyOverlays
        .map((overlay) => ({ overlay, open: openRing(overlay.ring) }))
        .filter(({ open }) => open.length >= 3)
        .map(({ overlay, open }) => ({
          overlay,
          shape: {
            type: 'Feature' as const,
            properties: {},
            geometry: { type: 'Polygon' as const, coordinates: [closeRing(open)] },
          },
        }));
    }, [readOnlyOverlays]);

    // Label badges for overlays that asked for one (`FarmBoundaryMapOverlay.label`). Built from
    // `overlayShapes`, so a ring too degenerate to draw never gets a floating label either.
    const overlayLabels = useMemo(
      () =>
        overlayShapes.flatMap(({ overlay, shape }) => {
          if (!overlay.label) return [];
          const position = ringLabelPosition(shape.geometry.coordinates[0]!);
          return position ? [{ overlay, label: overlay.label, position }] : [];
        }),
      [overlayShapes],
    );

    if (!isMapboxAvailable) {
      return (
        <View style={[styles.container, styles.fallbackContainer]} testID={testID}>
          <View style={styles.fallbackBox}>
            <Text style={styles.fallbackTitle}>Interactive Farm Map</Text>
            <Text style={styles.fallbackText}>
              Satellite boundary marking requires Mapbox native SDK linking in the current build.
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.container} testID={testID}>
        <MapView
          style={styles.map}
          styleURL={Mapbox.StyleURL.SatelliteStreet}
          onPress={handleMapPress}
          scaleBarEnabled={false}
          // Spread only when disabling, so the default leaves the native MapView's props untouched.
          {...(gesturesEnabled ? {} : DISABLED_CAMERA_GESTURES)}
          testID={testID ? `${testID}.map` : undefined}
        >
          <Camera
            ref={cameraRef}
            defaultSettings={{ centerCoordinate: initialCameraCenter, zoomLevel: initialCameraZoom }}
            minZoomLevel={MIN_ZOOM}
            maxZoomLevel={MAX_ZOOM}
          />

          {/* Read-only context overlays -- see `readOnlyOverlays`. Rendered BEFORE the primary
              boundary so, on mount, the editable shape is layered on top of them. Their ids are
              namespaced with `overlay-` so they can never collide with the primary boundary's
              fixed `farmBoundary*` ids. No PointAnnotations, no press handling: they are context,
              not something the farmer can grab. */}
          {overlayShapes.map(({ overlay, shape }) => (
            <ShapeSource key={overlay.id} id={`overlay-${overlay.id}-source`} shape={shape}>
              {overlay.filled === false ? null : (
                <FillLayer
                  id={`overlay-${overlay.id}-fill`}
                  style={{
                    fillColor: overlay.color,
                    fillOpacity: overlay.emphasized ? 0.4 : 0.22,
                  }}
                />
              )}
              <LineLayer
                id={`overlay-${overlay.id}-line`}
                style={{
                  lineColor: overlay.color,
                  lineWidth: overlay.emphasized ? 4 : 2,
                  lineJoin: 'round',
                  lineCap: 'round',
                  ...(overlay.dashed ? { lineDasharray: [2, 1.5] } : {}),
                }}
              />
            </ShapeSource>
          ))}

          {boundaryShape ? (
            <ShapeSource id="farmBoundarySource" shape={boundaryShape}>
              <FillLayer
                id="farmBoundaryFill"
                style={{ fillColor: boundaryColor, fillOpacity: 0.18 }}
              />
              <LineLayer
                id="farmBoundaryLine"
                style={{
                  lineColor: boundaryColor,
                  lineWidth: 3,
                  lineJoin: 'round',
                  lineCap: 'round',
                }}
              />
            </ShapeSource>
          ) : null}

          {/* 2-point draft line -- see `draftBoundaryLine` above. Distinct source/layer ids from
              the closed-polygon case above so the two never collide; they also never render
              simultaneously since they key off disjoint vertex counts (2 vs. >= 3). */}
          {draftBoundaryLine ? (
            <ShapeSource id="farmBoundaryDraftLineSource" shape={draftBoundaryLine}>
              <LineLayer
                id="farmBoundaryDraftLine"
                style={{
                  lineColor: boundaryColor,
                  lineWidth: 3,
                  lineJoin: 'round',
                  lineCap: 'round',
                }}
              />
            </ShapeSource>
          ) : null}

          {/* Vertex markers while actively drawing (draw mode -- so a farmer sees a dot land the
              instant they tap, even before a shape exists) and as draggable handles once a
              boundary is being adjusted (edit mode). `draggable` is gated to edit mode only -- a
              point shouldn't move mid-draw, before the shape is finished. `onDragEnd` is left
              wired unconditionally: with `draggable={false}` in draw mode, Mapbox never starts a
              drag gesture on the annotation, so the handler simply can't fire then -- no separate
              mode guard needed inside it. */}
          {mode === 'draw' || mode === 'edit'
            ? vertices.map((vertex, index) => (
                <PointAnnotation
                  key={vertexAnnotationId(index, vertexRevision)}
                  id={vertexAnnotationId(index, vertexRevision)}
                  coordinate={vertex}
                  draggable={mode === 'edit'}
                  onDragEnd={(payload: Feature<Point>) => handleVertexDragEnd(index, payload)}
                >
                  <View
                    style={[
                      styles.vertexHandle,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: boundaryColor,
                      },
                    ]}
                  />
                </PointAnnotation>
              ))
            : null}

          {/* Plain marker for a coordinate with no boundary of its own — see `markerCoordinate`
              prop docs above. Never draggable/`onDragEnd`: unlike the vertex handles above, this
              is not an editable boundary point, so it's styled distinctly (solid accent fill vs.
              the vertex handle's hollow primary-bordered surface fill) to avoid looking like one.
              Suppressed whenever a boundary shape exists, so the two are never shown at once. */}
          {!boundaryShape && markerCoordinate ? (
            <PointAnnotation id="manualMarker" coordinate={markerCoordinate}>
              <View
                style={[
                  styles.markerDot,
                  {
                    backgroundColor: theme.colors.accent,
                    borderColor: theme.colors.white,
                  },
                ]}
              />
            </PointAnnotation>
          ) : null}

          {/* Overlay label badges -- see `FarmBoundaryMapOverlay.label`. The same PointAnnotation
              mechanism as the vertex handles and `manualMarker` above, but never draggable and with
              no handlers: a label marks a context shape, it is not something to grab. Ids are
              namespaced `overlayLabel-` so they cannot collide with `vertex-N` / `manualMarker`.
              The React key also carries colour and text because Android snapshots an annotation's
              children into a bitmap once, so a changed badge must be a new annotation to repaint.
              Guarded on `PointAnnotation` itself: it is resolved from an optional native require
              at the top of this file, and an overlay label is never worth a crash. */}
          {PointAnnotation
            ? overlayLabels.map(({ overlay, label, position }) => (
                <PointAnnotation
                  key={`overlayLabel-${overlay.id}-${overlay.color}-${label}`}
                  id={`overlayLabel-${overlay.id}`}
                  coordinate={position}
                  draggable={false}
                >
                  <View
                    style={[
                      styles.overlayLabel,
                      {
                        minWidth: theme.spacing.xl,
                        height: theme.spacing.xl,
                        borderRadius: theme.radius.pill,
                        paddingHorizontal: theme.spacing.xs,
                        backgroundColor: theme.colors.white,
                        borderColor: overlay.color,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: overlay.color,
                        fontSize: theme.typography.caption,
                        fontWeight: theme.weights.bold,
                      }}
                      numberOfLines={1}
                    >
                      {label}
                    </Text>
                  </View>
                </PointAnnotation>
              ))
            : null}
        </MapView>

        {/* Place-name geocoding search bar */}
        {!readOnly && !hideSearchBar ? (
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radius.md,
                paddingHorizontal: theme.spacing.sm,
              },
            ]}
          >
            <View style={styles.searchIconBox}>
              <Icon name="search" size={18} color={theme.colors.onSurfaceVariant ?? '#64748B'} />
            </View>
            <TextInput
              style={[
                styles.searchInput,
                {
                  color: theme.colors.onSurface,
                  fontSize: theme.typography.bodySmall,
                },
              ]}
              placeholder={searchPlaceholder}
              placeholderTextColor={theme.colors.onSurfaceVariant ?? theme.colors.textMuted ?? theme.colors.onSurface}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => {
                void runSearch(query);
              }}
              returnKeyType="search"
              accessibilityLabel={searchPlaceholder}
              testID={testID ? `${testID}.search` : undefined}
            />
            {searching ? <ActivityIndicator size="small" color={theme.colors.primary} /> : null}
          </View>
        ) : null}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  vertexHandle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
  },
  // Smaller and solid-filled, vs. the larger hollow-ringed `vertexHandle` above — deliberately
  // reads as "a marked point" rather than "a draggable boundary vertex".
  markerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  // Sizing comes from theme tokens inline above; only the stroke and centring live here, matching
  // how `vertexHandle` / `markerDot` keep their border widths as literals.
  overlayLabel: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    zIndex: 5,
  },
  searchIconBox: {
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
  },
  fallbackContainer: {
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  fallbackBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  fallbackTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  fallbackText: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
