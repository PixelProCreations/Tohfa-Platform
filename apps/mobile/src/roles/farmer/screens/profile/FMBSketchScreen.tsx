function ChevronLeft({ size = 20, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 18L9 12L15 6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import DocumentPicker from '../../native/documentPicker';
import {
  Icon,
  Skeleton,
  type FarmBoundaryMapHandle,
  type FarmBoundaryMapMode,
  type FarmBoundaryMapOverlay,
  ScreenStatusBar,
  appAlert,
} from '@tohfa/mobile-ui';
import { colors, useTheme, typography, spacing, radius } from '../../theme';
import { authPalette as P } from '../../theme';
import { calculatePolygonMetrics } from '../../utils/geo';
import { t } from '../../../../i18n/farmer';
import { formatErrorMessage } from '../../../../shell/api/client';
import {
  createFarm,
  deleteFarm,
  getFarms,
  getPlots,
  updateFarm,
  type Farm,
  type Plot,
} from '../../api/farms';
import { buildZoneMapOverlays, outerRingOf } from './zoneMap';
import { buildFarmMapTarget, pickPreviewFarm } from './farmMapPreview';
import { FarmMapPanel } from './FarmMapPanel';
import { EditFarmSheet } from './EditFarmSheet';
import { mergeUpdatedFarm, openVertexCount, sameRing, savedRingOf } from './editFarmForm';

function AddLocationIcon({ size = 18, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 6v6M9 9h6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

interface FMBSketchScreenProps {
  onNavigateBack: () => void;
  /** Called with the id of the farm the boundary/save just applied to. */
  onNavigateToFieldContext: (farmId: string) => void;
  /** "Edit zones" on the selected farm: opens the Zones screen for that farm. */
  onNavigateToZones: (farmId: string) => void;
}

type TabType = 'Draw' | 'Upload';

const ROW_HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

/** No overlays: a stable empty list so the map's overlay prop does not change identity every render. */
const NO_OVERLAYS: FarmBoundaryMapOverlay[] = [];

export function FMBSketchScreen({
  onNavigateBack,
  onNavigateToFieldContext,
  onNavigateToZones,
}: FMBSketchScreenProps) {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('Draw');

  const mapRef = useRef<FarmBoundaryMapHandle>(null);
  const [mode, setMode] = useState<FarmBoundaryMapMode>('view');
  const [coords, setCoords] = useState<[number, number][]>([]);
  const metrics = calculatePolygonMetrics(coords);
  const pointCount = openVertexCount(coords);

  // Full screen hides every piece of chrome around the map (header, tabs, metrics + farm list,
  // footer) so the farmer has the whole display to draw on. It is a layout switch only: the map
  // element stays at the same place in the tree, so it is NOT remounted and an in-progress
  // drawing survives entering and leaving full screen.
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [uploadedDoc, setUploadedDoc] = useState<{
    name: string;
    size: number;
    uri: string;
  } | null>(null);

  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const selectedFarm = farms.find((f) => f.id === selectedFarmId) ?? null;
  // Bumped whenever the selected farm's SAVED boundary changes under the map (Edit farm save), so
  // the map remounts on it even though the farm id -- the other half of the map key -- is the same.
  const [mapRevision, setMapRevision] = useState(0);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // The farm whose Edit farm sheet is open, and the ring that sheet starts from.
  const [editing, setEditing] = useState<{ farm: Farm; coords: [number, number][]; isNew?: boolean } | null>(null);

  const loadFarms = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const list = await getFarms();
      setFarms(list);
      // An empty list is a real, valid state (e.g. an approved-before-this-feature farmer) --
      // it just means there is nothing to auto-select yet.
      // Open on the SAME farm Profile's "Farm & FMB" preview shows (the one with a saved
      // boundary first), not blindly the primary/first farm: that farm may have no boundary while
      // another does, which made this screen open empty right after the preview showed a shape.
      const initial = pickPreviewFarm(list);
      setSelectedFarmId(initial?.id ?? null);
      setCoords(savedRingOf(initial));
    } catch (err) {
      setLoadError(formatErrorMessage(err, t('farmer.fmb.loadError')));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFarms();
  }, [loadFarms]);

  // The selected farm's zones, tagged with the farm they were loaded for. Reading them only when
  // that tag matches the CURRENT selection means a previous farm's zones are never drawn on a newly
  // selected farm's map, not even for the frame before its own load starts.
  const [loadedZones, setLoadedZones] = useState<{ farmId: string; zones: Plot[] } | null>(null);

  // Zones are context on this screen, never its subject: a slow or failed load draws nothing and
  // shows no error -- the boundary, the farm list and Save FMB all work without them (the Zones
  // screen, one tap away via Edit zones, is where a zone load failure is reported and retried).
  useEffect(() => {
    if (!selectedFarmId) return undefined;
    const farmId = selectedFarmId;
    const controller = new AbortController();
    let current = true;
    getPlots(farmId, controller.signal)
      .then((zones) => {
        if (current) setLoadedZones({ farmId, zones });
      })
      .catch(() => {
        // Deliberately silent -- see above. A stale (aborted) request lands here too.
      });
    return () => {
      // A newer selection (or leaving the screen) makes this response stale: ignore it, and abort
      // the request where the client supports it.
      current = false;
      controller.abort();
    };
  }, [selectedFarmId]);

  const selectedFarmZones: Plot[] | null =
    loadedZones !== null && loadedZones.farmId === selectedFarmId ? loadedZones.zones : null;

  // The zones drawn over the selected farm, coloured and lettered exactly as the Zones screen does
  // (buildZoneMapOverlays). No dashed farm outline: on this screen the farm's own boundary is already
  // the map's primary shape. Hidden while that boundary is being drawn or edited, so the only shapes
  // on the map then are the one under the farmer's finger -- zones under a vertex being dragged
  // would read as part of it. They come back as soon as the map returns to view mode.
  const zoneOverlays = useMemo<FarmBoundaryMapOverlay[]>(() => {
    if (!selectedFarmZones || mode !== 'view') return NO_OVERLAYS;
    return buildZoneMapOverlays({
      farmRing: [],
      zones: selectedFarmZones.map((zone) => ({ id: zone.id, ring: outerRingOf(zone.boundary) })),
      focusedZoneId: null,
      excludeZoneId: null,
    });
  }, [mode, selectedFarmZones]);

  // The Zones tile: the zones actually loaded for this farm once they are in, else the farm list's
  // own plotCount (still loading, or the load failed).
  const zoneCount = selectedFarmZones ? selectedFarmZones.length : (selectedFarm?.plotCount ?? 0);

  // In full screen, Android's back button leaves full screen instead of leaving the screen (the
  // header's back arrow is hidden there, and a farmer mid-drawing should not lose the screen to a
  // reflexive back press). App.tsx's own back listener was registered when this screen opened;
  // this one is added later, so React Native consults it first -- the same arrangement as
  // ZonesScreen's editing back handler.
  useEffect(() => {
    if (!isFullscreen) return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setIsFullscreen(false);
      return true;
    });
    return () => subscription.remove();
  }, [isFullscreen]);

  /**
   * Points the shared map + metrics at a different farm's own SAVED (possibly empty) boundary.
   * The map's key includes the farm id, so FarmBoundaryMap remounts and the previous farm's
   * drawing (and draw/edit mode) cannot carry over.
   */
  function switchToFarm(farm: Farm | null) {
    setSelectedFarmId(farm?.id ?? null);
    setCoords(savedRingOf(farm));
    setMode('view');
    setSaveError(null);
  }

  /** True when the map holds a boundary for the selected farm that has not been saved. */
  function hasUnsavedDrawing(): boolean {
    return selectedFarm !== null && !sameRing(coords, savedRingOf(selectedFarm));
  }

  /**
   * Runs `proceed` straight away, or -- when leaving the selected farm would drop an unsaved
   * drawing -- after the farmer confirms discarding it (the same "ask before losing work" Step 3
   * gives on its destructive boundary actions).
   */
  function confirmLeavingDrawing(targetFarmId: string, proceed: () => void) {
    if (targetFarmId === selectedFarmId || !hasUnsavedDrawing()) {
      proceed();
      return;
    }
    appAlert(t('farmer.fmb.discardTitle'), t('farmer.fmb.discardMessage'), [
      { text: t('farmer.common.cancel'), style: 'cancel' },
      { text: t('farmer.fmb.discardConfirm'), style: 'destructive', onPress: proceed },
    ], { tone: 'warning' });
  }

  /** "Your farms" row tap: show that farm on the map, like Step 3's location chips. */
  function handleSelectFarm(farm: Farm) {
    if (farm.id === selectedFarmId) return;
    confirmLeavingDrawing(farm.id, () => switchToFarm(farm));
  }

  /** A farm's own persisted summary, or the live in-progress edit if it's the one on screen. */
  function farmRowSummary(farm: Farm): { areaAcres: number; pointCount: number } {
    if (farm.id === selectedFarmId) {
      return { areaAcres: metrics.areaAcres, pointCount };
    }
    return {
      areaAcres: farm.boundaryAreaAcres ?? 0,
      pointCount: openVertexCount(savedRingOf(farm)),
    };
  }

  /** Edit farm: selects the farm on the main map too, then opens the full edit sheet. */
  function handleEditFarm(farm: Farm) {
    confirmLeavingDrawing(farm.id, () => {
      const isSelected = farm.id === selectedFarmId;
      if (!isSelected) switchToFarm(farm);
      // Same farm: start from the live ring on the main map so an in-progress drawing is not lost.
      setEditing({ farm, coords: isSelected ? coords : savedRingOf(farm) });
    });
  }

  /**
   * Edit zones: opens the Zones screen for the selected farm. Leaving this screen drops an unsaved
   * boundary drawing, so that is confirmed first -- the same ask as switching farms.
   */
  function handleEditZones(farm: Farm) {
    if (!hasUnsavedDrawing()) {
      onNavigateToZones(farm.id);
      return;
    }
    appAlert(t('farmer.fmb.discardTitle'), t('farmer.fmb.discardMessage'), [
      { text: t('farmer.common.cancel'), style: 'cancel' },
      { text: t('farmer.fmb.discardConfirm'), style: 'destructive', onPress: () => onNavigateToZones(farm.id) },
    ], { tone: 'warning' });
  }

  function handleEditSaved(updated: Farm) {
    setFarms((prev) => prev.map((f) => (f.id === updated.id ? mergeUpdatedFarm(f, updated) : f)));
    if (updated.id === selectedFarmId || editing?.farm.id === updated.id) {
      setSelectedFarmId(updated.id);
      setCoords(savedRingOf(updated));
      setMode('view');
      setMapRevision((n) => n + 1);
    }
    setEditing(null);
  }

  /**
   * Edit farm sheet dismissed without saving (X / Cancel / Android back). "Add another farm"
   * creates the farm on the server before this sheet opens -- the sheet needs a real id to PATCH --
   * so abandoning a NEW farm's sheet must delete that placeholder, or an empty "Farm N" lingers in
   * Your farms. The sheet closes at once; the delete runs behind it, and a failure keeps the farm
   * and reports it through the footer error. An existing farm's sheet just closes.
   * (handleEditSaved closes the sheet itself, so a successful save never reaches this.)
   */
  function handleCloseEdit() {
    const closing = editing;
    setEditing(null);
    if (!closing?.isNew) return;
    const farmId = closing.farm.id;
    void (async () => {
      setSaving(true);
      setSaveError(null);
      try {
        await deleteFarm(farmId);
        const remaining = farms.filter((f) => f.id !== farmId);
        setFarms(remaining);
        if (farmId === selectedFarmId) {
          switchToFarm(remaining[0] ?? null);
        }
      } catch (err) {
        setSaveError(formatErrorMessage(err, t('farmer.fmb.deleteError')));
      } finally {
        setSaving(false);
      }
    })();
  }

  function handleDeleteFarm(farmId: string) {
    appAlert(t('farmer.fmb.deleteTitle'), t('farmer.fmb.deleteMessage'), [
      { text: t('farmer.common.cancel'), style: 'cancel' },
      {
        text: t('farmer.fmb.deleteConfirm'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setSaving(true);
            setSaveError(null);
            try {
              await deleteFarm(farmId);
              const remaining = farms.filter((f) => f.id !== farmId);
              setFarms(remaining);
              if (farmId === selectedFarmId) {
                switchToFarm(remaining[0] ?? null);
              }
              if (uploadedDoc && farmId === selectedFarmId) {
                setUploadedDoc(null);
              }
            } catch (err) {
              setSaveError(formatErrorMessage(err, t('farmer.fmb.deleteError')));
            } finally {
              setSaving(false);
            }
          })();
        },
      },
    ], { tone: 'warning' });
  }

  function handleAddFarm() {
    appAlert(t('farmer.fmb.addTitle'), t('farmer.fmb.addMessage'), [
      { text: t('farmer.common.cancel'), style: 'cancel' },
      {
        text: t('farmer.fmb.addConfirm'),
        onPress: () => {
          void (async () => {
            setSaving(true);
            setSaveError(null);
            try {
              const created = await createFarm({
                name: t('farmer.fmb.defaultFarmName', { number: farms.length + 1 }),
              });
              setFarms((prev) => [...prev, created]);
              setUploadedDoc(null);
              setActiveTab('Draw');
              switchToFarm(created);
              // Straight into Edit farm: a real name, its details and its boundary in one place.
              setEditing({ farm: created, coords: [], isNew: true });
            } catch (err) {
              setSaveError(formatErrorMessage(err, t('farmer.fmb.addError')));
            } finally {
              setSaving(false);
            }
          })();
        },
      },
    ]);
  }

  async function handlePickDocument() {
    try {
      const picked = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.pdf, DocumentPicker.types.images],
      });
      if (picked) {
        setUploadedDoc({
          name: picked.name ?? 'FMB_Document.pdf',
          size: picked.size ?? 250000,
          uri: picked.uri,
        });
      }
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        appAlert(t('farmer.fmb.uploadErrorTitle'), t('farmer.fmb.uploadErrorMessage'), undefined, { tone: 'error' });
      }
    }
  }

  function handleRemoveDocument() {
    setUploadedDoc(null);
  }

  function handleToggleFullscreen() {
    setIsFullscreen((prev) => !prev);
  }

  /**
   * Footer "Save FMB": persists the currently-drawn boundary (if any) to the selected farm, then
   * moves on to Field Context for that same farm. A boundary with fewer than 3 points is not a
   * polygon, so it's simply not sent -- the farmer can still proceed without drawing yet.
   */
  async function handleSaveFmb() {
    if (!selectedFarmId) {
      setSaveError(t('farmer.fmb.addFarmFirst'));
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      if (coords.length >= 3) {
        const updated = await updateFarm(selectedFarmId, {
          boundary: { type: 'Polygon', coordinates: [coords] },
          calculatedAreaAcres: metrics.areaAcres,
        });
        setFarms((prev) => prev.map((f) => (f.id === updated.id ? mergeUpdatedFarm(f, updated) : f)));
      }
      onNavigateToFieldContext(selectedFarmId);
    } catch (err) {
      setSaveError(formatErrorMessage(err, t('farmer.fmb.saveError')));
    } finally {
      setSaving(false);
    }
  }

  // Where the map opens for the selected farm: its saved boundary fitted to the panel, else its
  // stored location, else nothing (the panel then says so). See buildFarmMapTarget.
  const mapTarget = buildFarmMapTarget(selectedFarm);

  /** One "Your farms" row -- shared by both tabs; only the subtitle differs. */
  function renderFarmRow(farm: Farm, index: number, subtitle: string) {
    const isSelected = farm.id === selectedFarmId;
    return (
      <TouchableOpacity
        key={farm.id}
        activeOpacity={0.75}
        onPress={() => handleSelectFarm(farm)}
        style={[
          styles.farmCard,
          { borderColor: isSelected ? colors.brandGreen : colors.borderLight },
          isSelected && styles.farmCardSelected,
        ]}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        accessibilityLabel={t('farmer.fmb.selectFarmA11y', { name: farm.name })}
        testID={`fmb-sketch-farm-row-${farm.id}`}
      >
        <View style={styles.farmCardLeft}>
          <View style={[styles.farmIndexCircle, { backgroundColor: colors.brandGreen }]}>
            <Text style={styles.farmIndexText}>{index + 1}</Text>
          </View>
          <View style={styles.farmInfo}>
            <Text style={[styles.farmName, { color: colors.textDark }]}>{farm.name}</Text>
            <View style={styles.farmSubRow}>
              <Icon name="place" size={15} color={colors.brandGreen} />
              <Text style={[styles.farmSub, { color: colors.textSubtle }]}>{subtitle}</Text>
            </View>
            {/* Only on the selected farm: it is the one whose zones the map is showing. */}
            {isSelected ? (
              <TouchableOpacity
                style={[styles.editZonesBtn, { borderColor: colors.brandGreen }]}
                onPress={() => handleEditZones(farm)}
                hitSlop={ROW_HIT_SLOP}
                accessibilityRole="button"
                accessibilityLabel={t('farmer.fmb.editZonesA11y', { name: farm.name })}
                testID={`fmb-sketch-edit-zones-${farm.id}`}
              >
                <Icon name="edit" size={14} color={colors.brandGreen} />
                <Text style={[styles.editZonesText, { color: colors.brandGreen }]}>{t('farmer.fmb.editZones')}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View style={styles.farmActionsRow}>
          <TouchableOpacity
            style={styles.farmActionBtn}
            onPress={() => handleEditFarm(farm)}
            hitSlop={ROW_HIT_SLOP}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.fmb.editFarmA11y')}
            testID={`fmb-sketch-farm-edit-${farm.id}`}
          >
            <Icon name="edit" size={18} color={colors.brandGreen} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.farmActionBtn, styles.farmDeleteBtn]}
            onPress={() => handleDeleteFarm(farm.id)}
            hitSlop={ROW_HIT_SLOP}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.fmb.deleteFarmA11y')}
            testID={`fmb-sketch-farm-delete-${farm.id}`}
          >
            <Icon name="delete" size={18} color={P.red500} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  function areaSummary(farm: Farm, emptyText: string): string {
    const summary = farmRowSummary(farm);
    return summary.areaAcres > 0
      ? t('farmer.fmb.farmSummary', { area: summary.areaAcres.toFixed(2), points: summary.pointCount })
      : emptyText;
  }

  function renderFarmList(subtitleFor: (farm: Farm) => string) {
    return (
      <>
        <Text style={[styles.sectionTitle, { color: colors.textSubtle }]}>{t('farmer.fmb.yourFarms')}</Text>
        {farms.length === 0 && !loadError ? (
          <Text style={[styles.emptyFarmsText, { color: colors.textSubtle }]} testID="fmb-sketch-no-farms">
            {t('farmer.fmb.noFarms')}
          </Text>
        ) : null}
        {farms.map((farm, index) => renderFarmRow(farm, index, subtitleFor(farm)))}
        <TouchableOpacity
          style={[styles.addFarmButton, { borderColor: colors.brandGreen, backgroundColor: P.lightGreen50 }]}
          onPress={handleAddFarm}
          activeOpacity={0.7}
          disabled={saving}
          testID="fmb-sketch-add-farm"
        >
          <AddLocationIcon size={18} color={colors.brandGreen} />
          <Text style={[styles.addFarmButtonText, { color: colors.brandGreen }]}>{t('farmer.fmb.addFarm')}</Text>
        </TouchableOpacity>
      </>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.bgLight }]}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={colors.bgLight} />

      {/* HEADER -- hidden in full screen (the map's own exit-full-screen button replaces it). */}
      {isFullscreen ? null : (
        <View style={styles.header}>
          <TouchableOpacity onPress={onNavigateBack} style={styles.backBtn} accessibilityRole="button">
            <ChevronLeft size={20} color={colors.brandGreen} />
          </TouchableOpacity>
          <View style={styles.headerTitleBox}>
            <Text style={[styles.headerTitle, { color: colors.textDark }]}>{t('farmer.fmb.title')}</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSubtle }]}>{t('farmer.fmb.subtitle')}</Text>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.paddedSection}>
          <Skeleton height={220} width="100%" style={{ marginBottom: 16 }} />
          <Skeleton height={80} width="100%" style={{ marginBottom: 12 }} />
          <Skeleton height={80} width="100%" style={{ marginBottom: 12 }} />
        </View>
      ) : (
        <>
          {loadError && !isFullscreen ? (
            <View style={[styles.paddedSection, styles.loadErrorRow]} testID="fmb-sketch-load-error">
              <Text style={[styles.loadErrorText, styles.loadErrorMessage]}>{loadError}</Text>
              <TouchableOpacity
                onPress={() => void loadFarms()}
                style={[styles.retryBtn, { borderColor: colors.brandGreen }]}
                accessibilityRole="button"
                testID="fmb-sketch-load-retry"
              >
                <Text style={[styles.retryText, { color: colors.brandGreen }]}>{t('farmer.common.retry')}</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* TABS -- hidden in full screen, which only exists on the Draw tab. */}
          {isFullscreen ? null : (
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  activeTab === 'Draw'
                    ? { backgroundColor: colors.brandGreen }
                    : { backgroundColor: P.surfaceMuted },
                ]}
                onPress={() => setActiveTab('Draw')}
              >
                <Icon name="place" size={18} color={activeTab === 'Draw' ? colors.white : colors.textSubtle} />
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'Draw' ? { color: colors.white } : { color: colors.textSubtle },
                  ]}
                >
                  {t('farmer.fmb.tabDraw')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  activeTab === 'Upload'
                    ? { backgroundColor: colors.brandGreen }
                    : { backgroundColor: P.surfaceMuted },
                ]}
                onPress={() => setActiveTab('Upload')}
              >
                <Icon name="description" size={18} color={activeTab === 'Upload' ? colors.white : colors.textSubtle} />
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'Upload' ? { color: colors.white } : { color: colors.textSubtle },
                  ]}
                >
                  {t('farmer.fmb.tabUpload')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Kept mounted (and at the same tree position) in full screen rather than swapped for a
              plain View: swapping would remount FarmBoundaryMap and drop an unfinished drawing.
              Scrolling is off there so a drag on the map can never scroll the page instead. */}
          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={[styles.contentContainer, isFullscreen && styles.contentContainerFullscreen]}
            showsVerticalScrollIndicator={false}
            scrollEnabled={!isFullscreen}
          >
            {activeTab === 'Draw' ? (
              <>
                {/* MAP -- Step 3's controls, shared with the Edit farm sheet (FarmMapPanel). */}
                <FarmMapPanel
                  mapRef={mapRef}
                  mapKey={`${selectedFarmId ?? 'none'}:${mapRevision}`}
                  target={mapTarget}
                  coords={coords}
                  onPolygonChange={setCoords}
                  mode={mode}
                  onModeChange={setMode}
                  testIDPrefix="fmb-sketch"
                  containerStyle={isFullscreen ? styles.fullscreenMapContainer : styles.fullWidthMapContainer}
                  fullscreen={{ isFullscreen, onToggle: handleToggleFullscreen }}
                  readOnlyOverlays={zoneOverlays}
                />

                {/* Padded Content Section Below Map -- hidden in full screen. */}
                {isFullscreen ? null : (
                  <View style={styles.paddedSection}>
                    {/* Metrics Row -- always the selected farm's. */}
                    <View style={styles.metricsRow}>
                      <View style={[styles.metricBox, { borderColor: colors.borderLight }]}>
                        <Text style={[styles.metricVal, { color: colors.textDark }]} testID="fmb-sketch-metric-points">
                          {coords.length > 0 ? pointCount : '—'}
                        </Text>
                        <Text style={[styles.metricLabel, { color: colors.textSubtle }]}>{t('farmer.fmb.metricPoints')}</Text>
                      </View>
                      <View style={[styles.metricBox, { borderColor: colors.borderLight }]}>
                        <Text style={[styles.metricVal, { color: colors.textDark }]} testID="fmb-sketch-metric-area">
                          {metrics.areaAcres > 0 ? metrics.areaAcres.toFixed(2) : '—'}
                          <Text style={styles.metricValUnit}> {t('farmer.fmb.acresUnit')}</Text>
                        </Text>
                        <Text style={[styles.metricLabel, { color: colors.textSubtle }]}>{t('farmer.fmb.metricArea')}</Text>
                      </View>
                      <View style={[styles.metricBox, { borderColor: colors.borderLight }]}>
                        <Text style={[styles.metricVal, { color: colors.textDark }]} testID="fmb-sketch-metric-zones">
                          {zoneCount > 0 ? zoneCount : '—'}
                        </Text>
                        <Text style={[styles.metricLabel, { color: colors.textSubtle }]}>{t('farmer.fmb.metricZones')}</Text>
                      </View>
                    </View>

                    {renderFarmList((farm) => areaSummary(farm, t('farmer.fmb.drawToGetArea')))}
                  </View>
                )}
              </>
            ) : (
              <View style={styles.paddedSection}>
                {/* UPLOAD FMB TAB */}
                <TouchableOpacity
                  style={[
                    styles.uploadCard,
                    {
                      borderColor: uploadedDoc ? colors.brandGreen : colors.borderLight,
                      backgroundColor: uploadedDoc ? colors.brandGreenLight : P.lightGreen50,
                    },
                  ]}
                  onPress={handlePickDocument}
                  activeOpacity={0.7}
                >
                  <View style={styles.uploadCardLeft}>
                    <View
                      style={[
                        styles.uploadDocIcon,
                        { backgroundColor: uploadedDoc ? colors.brandGreen : colors.textSubtle },
                      ]}
                    >
                      <Icon name="description" size={20} color={colors.white} />
                    </View>
                    <View style={styles.uploadDocInfo}>
                      <Text
                        style={[
                          styles.uploadDocName,
                          { color: uploadedDoc ? colors.textDark : colors.textSubtle },
                        ]}
                        numberOfLines={1}
                      >
                        {uploadedDoc ? uploadedDoc.name : t('farmer.fmb.noDocument')}
                      </Text>
                      <Text style={[styles.uploadDocSize, { color: colors.textSubtle }]}>
                        {uploadedDoc
                          ? t('farmer.fmb.documentSize', { size: (uploadedDoc.size / 1024).toFixed(0) })
                          : t('farmer.fmb.uploadHint')}
                      </Text>
                    </View>
                  </View>

                  {uploadedDoc ? (
                    <TouchableOpacity
                      onPress={handleRemoveDocument}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={styles.uploadActionBtn}
                    >
                      <Icon name="close" size={18} color={P.red500} />
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.uploadActionBtn}>
                      <Icon name="file_upload" size={20} color={colors.brandGreen} />
                    </View>
                  )}
                </TouchableOpacity>

                {uploadedDoc ? (
                  <View style={styles.attachedNotice}>
                    <Text style={{ color: colors.brandGreen, fontWeight: '700', fontSize: typography.body }}>
                      <Icon name="check" size={14} color={colors.brandGreen} /> {t('farmer.fmb.documentAttached')}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.infoNoticeBox}>
                  <Text style={styles.infoNoticeText}>
                    <Text style={{ fontWeight: '700' }}>{t('farmer.fmb.uploadInfoTitle')}</Text>{' '}
                    {t('farmer.fmb.uploadInfoBody')}
                  </Text>
                </View>

                {renderFarmList((farm) =>
                  farm.id === selectedFarmId && uploadedDoc
                    ? uploadedDoc.name
                    : areaSummary(farm, t('farmer.fmb.uploadForFarm')),
                )}
              </View>
            )}
          </ScrollView>
        </>
      )}

      {/* FOOTER -- hidden in full screen; the drawn boundary is kept and saved from here after
          leaving full screen. */}
      {isFullscreen ? null : (
        <View style={[styles.footer, { borderTopColor: colors.borderDivider, backgroundColor: colors.bgLight }]}>
          {saveError ? <Text style={styles.saveErrorText}>{saveError}</Text> : null}
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.brandGreen, opacity: saving || loading ? 0.7 : 1 }]}
            onPress={handleSaveFmb}
            disabled={saving || loading}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.saveBtnText}>
                <Icon name="description" size={16} color={colors.white} /> {t('farmer.fmb.save')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* EDIT FARM -- full details + boundary on Step 3's map controls. Mounted only while open. */}
      {editing ? (
        <EditFarmSheet
          farm={editing.farm}
          isNew={editing.isNew === true}
          initialCoords={editing.coords}
          onClose={handleCloseEdit}
          onSaved={handleEditSaved}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.grey300,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitleBox: { flex: 1 },
  headerTitle: { fontSize: typography.title, fontWeight: '700' },
  headerSubtitle: { fontSize: typography.body, marginTop: 2 },

  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  tabText: { fontSize: typography.body, fontWeight: '700' },

  contentScroll: { flex: 1 },
  contentContainer: { paddingBottom: 12 },

  fullWidthMapContainer: {
    width: '100%',
    height: 360,
    position: 'relative',
    marginBottom: 16,
  },
  // Full screen: the scroll content grows to the viewport and the map takes all of it.
  contentContainerFullscreen: { flexGrow: 1, paddingBottom: 0 },
  fullscreenMapContainer: {
    flex: 1,
    width: '100%',
    position: 'relative',
  },
  paddedSection: {
    paddingHorizontal: 20,
  },

  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  metricBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  metricVal: { fontSize: typography.title, fontWeight: '800' },
  metricValUnit: { fontSize: typography.body, fontWeight: '600' },
  metricLabel: { fontSize: typography.caption, marginTop: 2 },

  uploadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  uploadCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  uploadDocIcon: {
    width: 40,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  uploadDocInfo: { flex: 1 },
  uploadDocName: { fontSize: typography.bodyLarge, fontWeight: '700', marginBottom: 4 },
  uploadDocSize: { fontSize: typography.bodySmall },
  uploadActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: P.grey300,
    marginLeft: 10,
  },

  attachedNotice: {
    alignItems: 'center',
    marginBottom: 16,
  },

  infoNoticeBox: {
    backgroundColor: P.coolSurfaceBg,
    borderWidth: 1,
    borderColor: P.blueGrey100,
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  infoNoticeText: { fontSize: typography.body, color: P.blueGrey800, lineHeight: 20 },

  sectionTitle: { fontSize: typography.bodySmall, fontWeight: '700', letterSpacing: 0.5, marginBottom: 12 },

  loadErrorText: {
    color: P.red600,
    fontSize: typography.body,
    fontWeight: '600',
    marginBottom: 12,
  },

  farmCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    backgroundColor: colors.white,
    marginBottom: 12,
  },
  farmCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  farmIndexCircle: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  farmIndexText: { color: colors.white, fontSize: typography.bodyLarge, fontWeight: '700' },
  farmInfo: { flex: 1 },
  farmName: { fontSize: typography.bodyLarge, fontWeight: '700', marginBottom: 2 },
  farmSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  farmSub: { fontSize: typography.bodySmall },
  editZonesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
  },
  editZonesText: { fontSize: typography.bodySmall, fontWeight: '700' },

  farmActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  farmActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: P.lightGreen50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  farmDeleteBtn: {
    backgroundColor: P.red50,
  },

  addFarmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 14,
    height: 52,
    gap: 8,
    marginTop: 4,
    marginBottom: 6,
  },
  addFarmButtonText: {
    fontSize: typography.bodyLarge,
    fontWeight: '600',
  },

  farmCardSelected: {
    borderWidth: 2,
    backgroundColor: P.lightGreen50,
  },
  emptyFarmsText: {
    fontSize: typography.body,
    marginBottom: 12,
  },
  loadErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  loadErrorMessage: { flex: 1, marginBottom: 0 },
  retryBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  retryText: { fontSize: typography.body, fontWeight: '700' },

  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  saveErrorText: {
    color: P.red600,
    fontSize: typography.body,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  saveBtn: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { color: colors.white, fontSize: typography.bodyLarge, fontWeight: '700' },
});
