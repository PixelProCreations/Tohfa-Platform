import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { AccessibilityInfo, Alert } from 'react-native';
import type { FarmBoundaryMapHandle, FarmBoundaryMapMode } from '@tohfa/mobile-ui';
import { formatErrorMessage } from '../../../../shell/api/client';
import { createPlot, updatePlot, type Plot } from '../../api/farms';
import { t } from '../../../../i18n/farmer';
import { calculatePolygonMetrics } from '../../utils/geo';
import {
  classifyManualPoints,
  makeManualRow,
  type BoundaryOrigin,
  type ManualPointRow,
} from '../registration/manualPoints';
import {
  boundaryPointCount,
  centerOfRing,
  checkZoneAreaBudget,
  committedZoneRing,
  containManualShape,
  manualRowOutsideFarm,
  manualShapeOutsideFarm,
  outerRingOf,
  polygonFromRing,
  resolveZoneAreaAcres,
  ringOutsideFarm,
  sameRing,
  zoneBoundaryPositioning,
  zoneContainmentRing,
  ZONE_AREA_TOLERANCE_ACRES,
  type LngLat,
  type ZoneBoundaryInputs,
} from './zoneMap';

/** What the editor is working on. `null` on the hook means "not editing" (the Zones overview). */
export type ZoneEditTarget = { kind: 'new' } | { kind: 'existing'; plotId: string };

/** What `begin` takes: an existing zone is handed over whole, so its details and ring load at once. */
export type ZoneBeginTarget = { kind: 'new' } | { kind: 'existing'; plot: Plot };

/** A zone's descriptive fields, as edited in ZoneDetailsModal. */
export interface ZoneDetails {
  name: string;
  /** Text, not a number: a half-typed "0." is not a number yet (see `resolveZoneAreaAcres`). */
  areaText: string;
  soil: string;
  exposure: string;
  irrigation: string;
}

/**
 * Why the details popup is open. 'edit' is the editor card's zone-name button: Save only keeps the
 * draft, exactly as the old Add Zone screen's popup did. 'confirm' is the final step after the
 * farmer confirms the shape (check icon / Save Zone): there Save is what actually writes the zone.
 */
export type ZoneDetailsIntent = 'edit' | 'confirm';

// New-zone defaults, unchanged from the form the zone editor used to be.
const DEFAULT_DETAILS: ZoneDetails = {
  name: '',
  areaText: '',
  soil: 'Red soil',
  exposure: 'Full sun',
  irrigation: 'Drip',
};

/** Same delay registration Step 3 uses before mirroring typed points onto the map. */
const MANUAL_SYNC_DEBOUNCE_MS = 300;
const FLY_ZOOM = 17;
const FLY_DURATION_MS = 900;
/** Zoom for flying to a zone when editing starts -- matches ZonesScreen's own zone-focus zoom. */
const BEGIN_FLY_ZOOM = 18;
/**
 * How long the "that point is outside the farm" notice stays up after the map refuses a tap or drag.
 * Long enough to read one short sentence; each further refusal restarts it rather than stacking.
 */
const REJECTION_NOTICE_MS = 2500;
/** Coordinates written back into manual rows from a dragged vertex: ~0.1 m, more than GPS gives. */
const MANUAL_COORD_DECIMALS = 6;
function formatManualCoord(value: number): string {
  return String(Number(value.toFixed(MANUAL_COORD_DECIMALS)));
}

function detailsOf(plot: Plot): ZoneDetails {
  return {
    name: plot.name,
    areaText: plot.areaAcres ? String(plot.areaAcres) : '',
    soil: plot.soilType || DEFAULT_DETAILS.soil,
    exposure: plot.sunExposure || DEFAULT_DETAILS.exposure,
    irrigation: plot.irrigationType || DEFAULT_DETAILS.irrigation,
  };
}

function sameDetails(a: ZoneDetails, b: ZoneDetails): boolean {
  return (
    a.name === b.name &&
    a.areaText === b.areaText &&
    a.soil === b.soil &&
    a.exposure === b.exposure &&
    a.irrigation === b.irrigation
  );
}

interface ZoneBoundaryEditorOptions {
  /** The farm the zone belongs to. */
  farmId: string;
  /**
   * That farm's own boundary ring -- the dashed "Farm boundary" overlay. While a zone is edited every
   * corner of it must stay inside this ring. Empty (the farm has no boundary yet) means no constraint.
   */
  farmRing: LngLat[];
  /**
   * Every zone already on this farm (the Zones overview's own list), used only to total up every
   * OTHER zone's area before saving this one -- see `checkZoneAreaBudget`. Not used for geometry.
   */
  zones: Plot[];
  /**
   * The farm's own known total area in acres (measured boundary preferred, else the farmer's typed
   * figure, else 0 when neither exists) -- the ceiling a zone's area may not push the farm's zones
   * past. Mirrors `ZonesScreen`'s own `farmTotalAcres` so both sides of this check agree.
   */
  farmTotalAcres: number;
  /**
   * Called after a zone was created/updated and the editor has already been ended, with that zone's
   * id -- so the caller can bring the zone just saved back into view (its card carries the way back
   * into editing its boundary), rather than leave the farmer looking at some other zone.
   */
  onSaved: (plotId: string) => void;
}

/**
 * Every piece of state and every handler behind drawing, editing and saving ONE zone's boundary and
 * details on a FarmBoundaryMap the caller owns (ZonesScreen's one fullscreen map).
 *
 * This is the old Add Zone screen's editor moved out of that screen unchanged in behaviour -- the
 * draw / edit / delete / manual-coordinates interaction is registration Step 3's
 * (Step3Location.tsx), reused rather than reinvented: confirm before erasing a real boundary, a
 * deliberate "Delete boundary" action, and typed corner points as the fallback when drawing on the
 * map is not practical. A boundary is optional -- a zone saved without one simply has no shape on
 * the Zones map, exactly like every zone created before boundaries existed.
 *
 * It is a hook rather than a component because the map, its floating icon row, the bottom card,
 * the footer and the details popup all live in different places in ZonesScreen's layout but have
 * to act on one shared state; the presentational pieces (ZoneBoundaryEditorCard, ZoneDetailsModal)
 * just render what this returns.
 *
 * The map is shared with the Zones overview, so instead of mounting with an `initialPolygon`, the
 * editor puts a zone's ring onto the live map in `begin` and takes it off again in `end`.
 */
export function useZoneBoundaryEditor(
  mapRef: RefObject<FarmBoundaryMapHandle>,
  { farmId, farmRing, zones, farmTotalAcres, onSaved }: ZoneBoundaryEditorOptions,
) {
  const [target, setTarget] = useState<ZoneEditTarget | null>(null);
  // `null` when the farm has no usable boundary -- then nothing below constrains the zone at all.
  const containment = useMemo(() => zoneContainmentRing(farmRing), [farmRing]);

  // ---- Zone details (edited in the details popup) --------------------------------------------
  const [details, setDetails] = useState<ZoneDetails>(DEFAULT_DETAILS);
  // The popup edits its own DRAFT copy so Cancel really discards -- same pattern as Step 3's
  // location-details popup.
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsIntent, setDetailsIntent] = useState<ZoneDetailsIntent>('edit');
  const [draft, setDraft] = useState<ZoneDetails>(DEFAULT_DETAILS);

  // What the zone looked like when editing began, so Cancel only asks before discarding a real
  // change (see `isDirty`).
  const [baselineRing, setBaselineRing] = useState<LngLat[]>([]);
  const [baselineDetails, setBaselineDetails] = useState<ZoneDetails>(DEFAULT_DETAILS);

  // ---- Map / boundary ------------------------------------------------------------------------
  const [mode, setMode] = useState<FarmBoundaryMapMode>('view');
  /** The zone boundary as the map last reported it (closed ring once it has 3+ vertices). */
  const [coords, setCoords] = useState<LngLat[]>([]);
  // Where the boundary came from -- see `BoundaryOrigin` (../registration/manualPoints.ts). A
  // manual boundary's rows are its source of truth, so a vertex drag is written back into them.
  const [boundaryOrigin, setBoundaryOrigin] = useState<BoundaryOrigin>('map');
  const [manualPoints, setManualPoints] = useState<ManualPointRow[]>(() => [makeManualRow()]);
  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const manualSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Raised only while THIS editor calls `clear()`/`setPolygon()` -- FarmBoundaryMap fires
  // `onPolygonChange` synchronously inside them, and the editor's own change must not be mistaken
  // for the farmer finishing a drawn boundary. Same mechanism, same reason, as Step 3.
  const programmaticChangeRef = useRef(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // The brief "outside the farm" notice shown when the map refuses a tap or drag (see
  // `handleRejectedPoint`). Inline and self-clearing on purpose, not an Alert: a farmer working near
  // the edge may hit the line several times in a row, and a modal per tap would be in the way.
  const [rejectionNoticeVisible, setRejectionNoticeVisible] = useState(false);
  const rejectionNoticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // A farmer leaving mid-debounce must not leave a timer behind that pokes an unmounted map.
  useEffect(() => {
    return () => {
      if (manualSyncTimerRef.current) clearTimeout(manualSyncTimerRef.current);
      if (rejectionNoticeTimerRef.current) clearTimeout(rejectionNoticeTimerRef.current);
    };
  }, []);

  // ---- Derived boundary state ----------------------------------------------------------------
  const isEditingMap = mode !== 'view';
  const hasBoundary = coords.length >= 3;
  // Typed corners outside the farm turn the shape `invalid` (see `containManualShape`), so such an
  // outline is never mirrored onto the map, never committed, and blocks save like any mistyped row.
  const classifiedManualShape = classifyManualPoints(manualPoints);
  const manualOutsideFarm = manualShapeOutsideFarm(classifiedManualShape, containment);
  const manualShape = containManualShape(classifiedManualShape, containment);
  const boundaryInputs: ZoneBoundaryInputs = { coords, manualEntryOpen, boundaryOrigin, manualShape };
  const committedRing = committedZoneRing(boundaryInputs);
  // Only a ring loaded as saved can still be outside -- new taps/drags are refused by the map.
  const boundaryOutsideFarm = ringOutsideFarm(committedRing, containment);
  const metrics = calculatePolygonMetrics(committedRing);
  const pointCount = boundaryPointCount(coords);
  const positioning = zoneBoundaryPositioning(boundaryInputs);
  const manualShapeError = manualOutsideFarm
    ? t('farmer.zones.add.manualOutsideFarm')
    : manualShape.kind === 'tooFew' || manualShape.kind === 'point'
      ? t('farmer.zones.add.manualPointsTooFew')
      : manualShape.kind === 'noArea'
        ? t('farmer.registration.step3.manualPointsNoArea')
        : null;
  // Half-typed corners are not silently dropped or saved as something the farmer did not type.
  const manualIncomplete = manualEntryOpen && manualShape.kind !== 'polygon' && manualShape.kind !== 'empty';
  /** Why the shape cannot be saved yet, or null when it can. Shared by confirm and save. */
  const shapeBlockingError = manualIncomplete
    ? manualOutsideFarm
      ? t('farmer.zones.add.manualOutsideFarm')
      : t('farmer.zones.add.manualIncomplete')
    : boundaryOutsideFarm
      ? t('farmer.zones.add.boundaryOutsideFarm')
      : null;
  // 1-2 stray drawn vertices are not a committed ring, but they are still the farmer's work.
  const isDirty =
    target !== null &&
    (!sameRing(committedRing, baselineRing) ||
      (!hasBoundary && coords.length > 0) ||
      (manualEntryOpen && manualShape.kind !== 'empty') ||
      !sameDetails(details, baselineDetails));

  // ---- Boundary interaction (mirrors Step3Location.tsx) --------------------------------------
  function cancelManualSync() {
    if (manualSyncTimerRef.current) {
      clearTimeout(manualSyncTimerRef.current);
      manualSyncTimerRef.current = null;
    }
  }

  /** `try/finally` so an exception inside the map can never leave the flag stuck on. */
  function applyProgrammaticPolygonChange(change: () => void) {
    programmaticChangeRef.current = true;
    try {
      change();
    } finally {
      programmaticChangeRef.current = false;
    }
  }

  function handlePolygonChange(next: LngLat[]) {
    setCoords(next);
    if (programmaticChangeRef.current) return;
    // A drag of a TYPED outline keeps its rows in step with the moved vertices; otherwise the
    // rows (that boundary's source of truth) would silently drift from what the farmer sees.
    if (mode === 'edit' && boundaryOrigin === 'manual' && next.length >= 3) {
      const vertices = next.slice(0, -1); // `onPolygonChange` hands over a closed ring
      setManualPoints((prev) =>
        vertices.map(([vertexLng, vertexLat], index) => ({
          id: prev[index]?.id ?? makeManualRow().id,
          latText: formatManualCoord(vertexLat),
          lngText: formatManualCoord(vertexLng),
        })),
      );
      return;
    }
    // A real tap-drawn vertex.
    setBoundaryOrigin('map');
    if (next.length >= 3) {
      // A completed drawn boundary outranks typed points, so collapse the panel rather than show
      // two positioning methods as if both still applied, and drop any queued typed-shape sync.
      setManualEntryOpen(false);
      cancelManualSync();
    }
  }

  function confirmDestructive(title: string, message: string, confirmLabel: string, onConfirm: () => void) {
    Alert.alert(title, message, [
      { text: t('farmer.common.cancel'), style: 'cancel' },
      { text: confirmLabel, style: 'destructive', onPress: onConfirm },
    ]);
  }

  /** Back to "no boundary": nothing on the map, no typed points. */
  function resetBoundary() {
    cancelManualSync();
    applyProgrammaticPolygonChange(() => mapRef.current?.clear());
    setCoords([]);
    setManualPoints([makeManualRow()]);
    setManualEntryOpen(false);
    setBoundaryOrigin('map');
  }

  /** Draw toggle. Redrawing over a real boundary asks first; 0-2 stray vertices just resume. */
  function handleDrawBoundary() {
    if (mode === 'draw') {
      mapRef.current?.finish();
      return;
    }
    if (coords.length >= 3) {
      confirmDestructive(
        t('farmer.zones.add.redrawConfirmTitle'),
        t('farmer.zones.add.redrawConfirmBody'),
        t('farmer.zones.add.redrawConfirmAction'),
        () => {
          resetBoundary();
          mapRef.current?.startDrawing();
        },
      );
      return;
    }
    if (manualEntryOpen) setManualEntryOpen(false);
    mapRef.current?.startDrawing();
  }

  function handleEditBoundary() {
    if (mode === 'edit') {
      mapRef.current?.finish();
      return;
    }
    mapRef.current?.startEditing();
  }

  function handleDeleteBoundary() {
    confirmDestructive(
      t('farmer.zones.add.deleteBoundaryConfirmTitle'),
      t('farmer.zones.add.deleteBoundaryConfirmBody'),
      t('farmer.zones.add.deleteBoundaryConfirmAction'),
      () => {
        mapRef.current?.finish();
        resetBoundary();
      },
    );
  }

  /**
   * Opens or closes the typed-points panel. Opening it over a TAP-DRAWN boundary replaces that
   * boundary -- after a confirm, as in Step 3 -- because a drawn and a typed outline are mutually
   * exclusive shapes for one zone. A typed outline is just reopened: its rows already describe it.
   */
  function handleToggleManualEntry() {
    if (manualEntryOpen) {
      setManualEntryOpen(false);
      return;
    }
    if (coords.length >= 3 && boundaryOrigin === 'map') {
      confirmDestructive(
        t('farmer.zones.add.replaceWithManualConfirmTitle'),
        t('farmer.zones.add.replaceWithManualConfirmBody'),
        t('farmer.zones.add.replaceWithManualConfirmAction'),
        () => {
          mapRef.current?.finish();
          resetBoundary();
          setManualEntryOpen(true);
        },
      );
      return;
    }
    if (mode !== 'view') mapRef.current?.finish();
    if (coords.length > 0 && boundaryOrigin === 'map') {
      applyProgrammaticPolygonChange(() => mapRef.current?.clear());
    }
    setManualEntryOpen(true);
  }

  /**
   * Mirrors the typed rows onto the map once the farmer pauses (debounced). Taking a typed outline
   * back OFF the map the moment the rows stop describing one is not debounced -- a boundary left
   * showing with nothing backing it would be saved.
   */
  function syncManualToMap(rows: ManualPointRow[]) {
    cancelManualSync();
    // Contained first, so an outline with a corner outside the farm is handled exactly like an
    // unfinished one: taken off the map, never pushed onto it. The map would refuse that
    // `setPolygon` anyway; checking here means the farmer gets the specific inline row error
    // instead of a shape that silently never appears.
    const shape = containManualShape(classifyManualPoints(rows), containment);
    if (shape.kind !== 'polygon' && boundaryOrigin === 'manual' && coords.length > 0) {
      if (mode !== 'view') mapRef.current?.finish();
      applyProgrammaticPolygonChange(() => mapRef.current?.clear());
    }
    if (shape.kind === 'polygon') {
      manualSyncTimerRef.current = setTimeout(() => {
        applyProgrammaticPolygonChange(() => mapRef.current?.setPolygon(shape.ring));
        setBoundaryOrigin('manual');
        const center = centerOfRing(shape.ring);
        if (center) mapRef.current?.flyTo(center, FLY_ZOOM, FLY_DURATION_MS);
      }, MANUAL_SYNC_DEBOUNCE_MS);
    } else if (shape.kind === 'point') {
      // Not a zone yet, but fly there so the farmer can see where their first corner landed.
      manualSyncTimerRef.current = setTimeout(() => {
        mapRef.current?.flyTo(shape.point, FLY_ZOOM, FLY_DURATION_MS);
      }, MANUAL_SYNC_DEBOUNCE_MS);
    }
  }

  function updateManualPoints(rows: ManualPointRow[]) {
    setManualPoints(rows);
    syncManualToMap(rows);
  }

  function handleManualPointChange(rowId: string, field: 'latText' | 'lngText', text: string) {
    updateManualPoints(manualPoints.map((row) => (row.id === rowId ? { ...row, [field]: text } : row)));
  }

  function handleAddManualPoint() {
    setManualPoints((prev) => [...prev, makeManualRow()]);
  }

  function handleRemoveManualPoint(rowId: string) {
    if (manualPoints.length <= 1) return;
    updateManualPoints(manualPoints.filter((row) => row.id !== rowId));
  }

  // ---- Farm-boundary refusals ----------------------------------------------------------------
  function hideRejectionNotice() {
    if (rejectionNoticeTimerRef.current) {
      clearTimeout(rejectionNoticeTimerRef.current);
      rejectionNoticeTimerRef.current = null;
    }
    setRejectionNoticeVisible(false);
  }

  /**
   * FarmBoundaryMap's `onRejectedPoint`: a tap or drag landed outside the farm and was not applied.
   * Shows the brief inline notice and restarts its timer, so repeated taps keep one notice up rather
   * than stacking anything. Screen-reader users hear it once per appearance, not once per tap.
   * Stable (no deps beyond refs and setters) so the map's own handlers are not rebuilt every render.
   */
  const handleRejectedPoint = useCallback(() => {
    if (!rejectionNoticeTimerRef.current) {
      AccessibilityInfo.announceForAccessibility(t('farmer.zones.add.pointOutsideFarm'));
    }
    if (rejectionNoticeTimerRef.current) clearTimeout(rejectionNoticeTimerRef.current);
    setRejectionNoticeVisible(true);
    rejectionNoticeTimerRef.current = setTimeout(() => {
      rejectionNoticeTimerRef.current = null;
      setRejectionNoticeVisible(false);
    }, REJECTION_NOTICE_MS);
  }, []);

  /** Whether one typed row is a complete point outside the farm -- for its inline row error. */
  function isManualRowOutsideFarm(row: ManualPointRow): boolean {
    return manualRowOutsideFarm(row, containment);
  }

  // ---- Lifecycle: begin / end ----------------------------------------------------------------
  /** Every editor field back to its "nothing being edited" value. Does not touch the map. */
  function resetEditorState() {
    cancelManualSync();
    setCoords([]);
    setManualPoints([makeManualRow()]);
    setManualEntryOpen(false);
    setBoundaryOrigin('map');
    setDetails(DEFAULT_DETAILS);
    setDraft(DEFAULT_DETAILS);
    setIsDetailsOpen(false);
    setDetailsIntent('edit');
    setBaselineRing([]);
    setBaselineDetails(DEFAULT_DETAILS);
    setErrorMsg(null);
    hideRejectionNotice();
  }

  /**
   * Starts editing a new zone, or an existing one: loads its details (or the new-zone defaults) and
   * puts its saved ring onto the live map as the editable boundary. Programmatic, so the ring
   * arriving through `onPolygonChange` is not mistaken for the farmer drawing it.
   */
  function begin(next: ZoneBeginTarget) {
    if (mode !== 'view') mapRef.current?.finish();
    resetEditorState();
    const loaded = next.kind === 'existing' ? detailsOf(next.plot) : DEFAULT_DETAILS;
    const ring = next.kind === 'existing' ? outerRingOf(next.plot.boundary) : [];
    setDetails(loaded);
    setBaselineDetails(loaded);
    setBaselineRing(ring);
    setCoords(ring);
    applyProgrammaticPolygonChange(() => {
      // `skipContainment`: a zone saved before the farm-boundary rule (or before the farm was
      // redrawn smaller) must still open, so the farmer can drag its stray corners back in. Every
      // later tap/drag is held to the farm, and `boundaryOutsideFarm` blocks saving it as it is.
      if (ring.length >= 3) mapRef.current?.setPolygon(ring, { skipContainment: true });
      else mapRef.current?.clear();
    });
    const center = centerOfRing(ring);
    if (center) mapRef.current?.flyTo(center, BEGIN_FLY_ZOOM, FLY_DURATION_MS);
    setTarget(next.kind === 'existing' ? { kind: 'existing', plotId: next.plot.id } : { kind: 'new' });
  }

  /** Stops editing: leaves any draw/edit mode, takes the boundary off the map, resets everything. */
  function end() {
    if (mode !== 'view') mapRef.current?.finish();
    applyProgrammaticPolygonChange(() => mapRef.current?.clear());
    resetEditorState();
    setTarget(null);
  }

  /** Cancel editing: asks before throwing away a real change, otherwise just ends. */
  function requestCancel() {
    if (!isDirty) {
      end();
      return;
    }
    confirmDestructive(
      t('farmer.zones.discardConfirmTitle'),
      t('farmer.zones.discardConfirmBody'),
      t('farmer.zones.discardConfirmAction'),
      end,
    );
  }

  // ---- Details popup -------------------------------------------------------------------------
  function openDetails(intent: ZoneDetailsIntent = 'edit') {
    setDraft(details);
    setDetailsIntent(intent);
    setIsDetailsOpen(true);
  }

  function closeDetails() {
    setIsDetailsOpen(false);
  }

  function updateDraft(patch: Partial<ZoneDetails>) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  /**
   * The check icon / Save Zone: finishes any draw or edit gesture so the shape is final, refuses a
   * half-typed manual outline (as saving always has), then asks for the zone's details. Returns
   * whether the popup opened, so the caller can reveal the editor card when it did not.
   */
  function confirmShape(): boolean {
    if (!target) return false;
    if (mode !== 'view') mapRef.current?.finish();
    if (shapeBlockingError) {
      setErrorMsg(shapeBlockingError);
      return false;
    }
    setErrorMsg(null);
    openDetails('confirm');
    return true;
  }

  /** The popup's Save: keeps the draft, and on the confirm step also writes the zone. */
  function submitDetails() {
    const next = draft;
    setDetails(next);
    if (detailsIntent === 'confirm') {
      void persist(next);
      return;
    }
    setErrorMsg(null);
    setIsDetailsOpen(false);
  }

  // ---- Save ----------------------------------------------------------------------------------
  // Takes the details explicitly rather than reading `details`: it runs in the same tick as the
  // popup's Save commits them, before that state update has landed.
  async function persist(next: ZoneDetails) {
    if (!target) return;
    if (!farmId) {
      setErrorMsg(t('farmer.zones.add.noFarm'));
      return;
    }
    const trimmedName = next.name.trim();
    if (!trimmedName) {
      setErrorMsg(t('farmer.zones.add.nameRequired'));
      return;
    }
    if (shapeBlockingError) {
      setErrorMsg(shapeBlockingError);
      return;
    }
    const area = resolveZoneAreaAcres(next.areaText, metrics.areaAcres);
    if (!area.ok) {
      setErrorMsg(t('farmer.zones.add.areaInvalid'));
      return;
    }
    const zoneAcres = area.areaAcres ?? 0;
    // The budget is only re-checked when this save would actually grow this zone's area beyond
    // what is already saved for it (0 for a new zone). An edit that leaves the area the same, or
    // shrinks it, must still go through even on a farm whose zones already add up to more than its
    // own size (see ZonesScreen's read-only over-allocation warning) -- otherwise a farmer could
    // never again touch a pre-existing over-allocated zone's name, soil type or boundary without
    // first untangling every zone's size, which is exactly what that warning is meant NOT to force.
    const previousAreaAcres =
      target.kind === 'existing' ? (zones.find((z) => z.id === target.plotId)?.areaAcres ?? 0) : 0;
    if (zoneAcres > previousAreaAcres + ZONE_AREA_TOLERANCE_ACRES) {
      const otherZonesAcres = zones
        .filter((z) => !(target.kind === 'existing' && z.id === target.plotId))
        .reduce((acc, z) => acc + (z.areaAcres ?? 0), 0);
      const budget = checkZoneAreaBudget({ farmTotalAcres, otherZonesAcres, zoneAcres });
      if (!budget.ok) {
        setErrorMsg(
          t('farmer.zones.add.areaExceedsFarm', {
            zoneAcres: budget.zoneAcres.toFixed(2),
            wouldBeAcres: budget.wouldBeAcres.toFixed(2),
            farmAcres: budget.farmTotalAcres.toFixed(2),
          }),
        );
        return;
      }
    }
    const boundary = polygonFromRing(committedRing);

    setSubmitting(true);
    setErrorMsg(null);
    try {
      let savedId: string;
      if (target.kind === 'existing') {
        await updatePlot(farmId, target.plotId, {
          name: trimmedName,
          ...(area.areaAcres !== undefined ? { areaAcres: area.areaAcres } : {}),
          // Always sent on an edit: a polygon (re)draws the zone, `null` clears a boundary the
          // farmer deliberately deleted here (UpdatePlotInput).
          boundary,
          soilType: next.soil,
          sunExposure: next.exposure,
          irrigationType: next.irrigation,
        });
        savedId = target.plotId;
      } else {
        const created = await createPlot(farmId, {
          name: trimmedName,
          ...(area.areaAcres !== undefined ? { areaAcres: area.areaAcres } : {}),
          ...(boundary ? { boundary } : {}),
          soilType: next.soil,
          sunExposure: next.exposure,
          irrigationType: next.irrigation,
        });
        savedId = created.id;
      }
      end();
      onSaved(savedId);
    } catch (err) {
      setErrorMsg(
        formatErrorMessage(
          err,
          t(target.kind === 'existing' ? 'farmer.zones.saveZoneError' : 'farmer.zones.add.createError'),
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return {
    // lifecycle
    target,
    begin,
    end,
    requestCancel,
    isDirty,
    // map wiring
    mode,
    onModeChange: setMode,
    handlePolygonChange,
    isEditingMap,
    // Only while a zone is being edited: the overview has nothing to hold in.
    containWithin: target !== null ? containment : null,
    handleRejectedPoint,
    rejectionNoticeVisible,
    // boundary state
    coords,
    hasBoundary,
    committedRing,
    metrics,
    pointCount,
    positioning,
    manualShape,
    manualShapeError,
    manualEntryOpen,
    manualPoints,
    isManualRowOutsideFarm,
    boundaryOutsideFarm,
    // boundary actions
    handleDrawBoundary,
    handleEditBoundary,
    handleDeleteBoundary,
    handleToggleManualEntry,
    handleManualPointChange,
    handleAddManualPoint,
    handleRemoveManualPoint,
    // details
    details,
    draft,
    updateDraft,
    isDetailsOpen,
    detailsIntent,
    openDetails,
    closeDetails,
    submitDetails,
    confirmShape,
    // status
    submitting,
    errorMsg,
  };
}

export type ZoneBoundaryEditor = ReturnType<typeof useZoneBoundaryEditor>;
