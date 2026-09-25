import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Svg, { Circle, Line, Polygon, Defs, Pattern, Rect } from 'react-native-svg';
import { Icon, Skeleton } from '@tohfa/mobile-ui';
import { useTheme, colors, authPalette as P } from '../../theme';
import { formatErrorMessage } from '../../../../shell/api/client';
import { deletePlot, getFarms, getPlots, updatePlot, type Farm, type Plot } from '../../api/farms';

interface ZonesScreenProps {
  /** The farm to show zones for, threaded from FieldContextScreen via App.tsx's params. */
  farmId: string;
  onNavigateBack: () => void;
  /** Called with the farm currently selected on screen (the farmer may have switched it below). */
  onNavigateToAddZone: (farmId: string) => void;
  onSave: () => void;
}

/**
 * Purely cosmetic per-position styling for the schematic map + zone cards. `Plot` has no real
 * boundary/colour of its own (the backend has no zone-geometry field yet -- see AddZoneScreen's
 * docblock), so this is a repeating scheme keyed by list position, not real per-zone data.
 */
const ZONE_VISUALS = [
  { letter: 'A', color: P.deepGreen, bgColor: 'rgba(27, 94, 32, 0.6)' },
  { letter: 'B', color: P.orange900, bgColor: 'rgba(230, 81, 0, 0.6)' },
  { letter: 'C', color: P.deepPurple600, bgColor: 'rgba(69, 39, 160, 0.6)' },
];
function visualFor(index: number) {
  return ZONE_VISUALS[index % ZONE_VISUALS.length]!;
}

const SOIL_OPTIONS = ['Loamy', 'Sandy', 'Clay', 'Red soil', 'Black soil'];
const EXPOSURE_OPTIONS = ['Full sun', 'Partial', 'Shade'];
const IRRIGATION_OPTIONS = ['Drip', 'Sprinkler', 'Flood', 'Rainfed'];

/** A zone's local-only "current crop" label -- see the docblock above `localCrops` below. */
interface LocalCrop {
  name: string;
  day: string;
}

export function ZonesScreen({ farmId, onNavigateBack, onNavigateToAddZone, onSave }: ZonesScreenProps) {
  const { colors } = useTheme();

  const [farms, setFarms] = useState<Farm[]>([]);
  const [farmsLoading, setFarmsLoading] = useState(true);
  const [farmsError, setFarmsError] = useState<string | null>(null);

  const [selectedFarmId, setSelectedFarmId] = useState<string>(farmId);
  const [isFarmDropdownOpen, setIsFarmDropdownOpen] = useState(false);
  const selectedFarm = farms.find((f) => f.id === selectedFarmId) ?? null;

  const [zones, setZones] = useState<Plot[]>([]);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [zonesError, setZonesError] = useState<string | null>(null);

  /**
   * There is no crop-tracking backend anywhere in this app yet (dashboard/farm-management/crop
   * screens are all still mock -- see root CLAUDE.md's task notes), and `Plot` has no crop
   * field. The "Current Crop" input on a zone stays local-only and cosmetic by design: it is
   * never sent to the API, and it resets whenever this screen remounts. Keyed by plot id.
   */
  const [localCrops, setLocalCrops] = useState<Record<string, LocalCrop>>({});

  // Edit Zone Modal state
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
      setFarmsError(formatErrorMessage(err, 'Could not load your farms.'));
    } finally {
      setFarmsLoading(false);
    }
  }, []);

  const loadZones = useCallback(async () => {
    if (!selectedFarmId) {
      setZones([]);
      setZonesLoading(false);
      return;
    }
    setZonesLoading(true);
    setZonesError(null);
    try {
      const list = await getPlots(selectedFarmId);
      setZones(list);
    } catch (err) {
      setZonesError(formatErrorMessage(err, 'Could not load zones.'));
    } finally {
      setZonesLoading(false);
    }
  }, [selectedFarmId]);

  useEffect(() => {
    void loadFarms();
  }, [loadFarms]);

  useEffect(() => {
    void loadZones();
  }, [loadZones]);

  // Dynamic calculations. The map-measured boundary area is preferred over the farmer's typed
  // figure when both exist, matching how FMBSketchScreen treats the same two fields.
  const farmTotalAcres = selectedFarm?.boundaryAreaAcres ?? selectedFarm?.areaAcres ?? 0;
  const totalMarkedAcres = zones.reduce((acc, z) => acc + (z.areaAcres ?? 0), 0);
  const unmarkedAcres = Math.max(0, farmTotalAcres - totalMarkedAcres);

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

  async function handleSaveEdit() {
    if (!editingZone || !selectedFarmId) return;
    setModalSaving(true);
    setModalError(null);
    try {
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
      setModalError(formatErrorMessage(err, 'Could not save this zone.'));
    } finally {
      setModalSaving(false);
    }
  }

  const handleDeleteZone = (zoneId: string) => {
    const target = zones.find((z) => z.id === zoneId);
    Alert.alert(
      'Delete Zone',
      `Are you sure you want to delete ${target?.name || 'this zone'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              if (!selectedFarmId) return;
              setZonesError(null);
              try {
                await deletePlot(selectedFarmId, zoneId);
                setZones((prev) => prev.filter((z) => z.id !== zoneId));
                setLocalCrops((prev) => {
                  const next = { ...prev };
                  delete next[zoneId];
                  return next;
                });
              } catch (err) {
                setZonesError(formatErrorMessage(err, 'Could not delete this zone.'));
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.bgLight }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bgLight} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.backBtn}>
          <Icon name="arrow_back" size={24} color={colors.brandGreen} />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={[styles.headerTitle, { color: colors.textDark }]}>Zones</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSubtle }]}>Divide your farm into zones</Text>
        </View>
        <TouchableOpacity style={styles.helpBtn}>
          <Text style={styles.helpIcon}>?</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {farmsError ? <Text style={styles.errorText}>{farmsError}</Text> : null}

        {farmsLoading ? (
          <Skeleton height={64} width="100%" style={{ marginBottom: 16 }} />
        ) : (
          <>
            {/* FARM SELECTOR TRIGGER */}
            <TouchableOpacity
              style={[
                styles.farmSelector,
                {
                  borderColor: isFarmDropdownOpen ? colors.brandGreen : colors.borderLight,
                },
              ]}
              onPress={() => setIsFarmDropdownOpen(!isFarmDropdownOpen)}
              activeOpacity={0.7}
            >
              <View style={[styles.farmIconBox, { backgroundColor: colors.brandGreenLight }]}>
                <Icon name="place" size={16} color={colors.brandGreen} />
              </View>
              <View style={styles.farmSelectorText}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: colors.textSubtle, marginBottom: 2 }}>
                  MARKING ZONES FOR
                </Text>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textDark }}>
                  {selectedFarm?.name ?? 'Select a farm'}
                </Text>
              </View>
              <Icon
                name={isFarmDropdownOpen ? 'expand_more' : 'expand_more'}
                size={18}
                color={colors.textSubtle}
              />
            </TouchableOpacity>

            {/* FARM DROPDOWN LIST */}
            {isFarmDropdownOpen && (
              <View style={[styles.farmDropdownMenu, { borderColor: colors.borderLight }]}>
                {farms.map((farm) => {
                  const isSelected = farm.id === selectedFarmId;
                  const farmAcres = farm.boundaryAreaAcres ?? farm.areaAcres ?? 0;
                  return (
                    <TouchableOpacity
                      key={farm.id}
                      style={[
                        styles.farmDropdownItem,
                        isSelected && { backgroundColor: P.lightGreen50 },
                      ]}
                      onPress={() => {
                        setSelectedFarmId(farm.id);
                        setIsFarmDropdownOpen(false);
                      }}
                    >
                      <View style={styles.farmDropdownItemLeft}>
                        <Icon
                          name="place"
                          size={16}
                          color={isSelected ? colors.brandGreen : colors.textSubtle}
                        />
                        <View>
                          <Text
                            style={[
                              styles.farmDropdownItemText,
                              {
                                color: isSelected ? colors.brandGreen : colors.textDark,
                                fontWeight: isSelected ? '700' : '500',
                              },
                            ]}
                          >
                            {farm.name}
                          </Text>
                          <Text style={{ fontSize: 11, color: colors.textSubtle }}>
                            Total area: {farmAcres.toFixed(2)} ac
                          </Text>
                        </View>
                      </View>
                      {isSelected && <Icon name="check" size={16} color={colors.brandGreen} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </>
        )}

        {/* INFO NOTICE */}
        <View style={styles.infoNoticeBox}>
          <Icon name="lightbulb" size={18} color={P.black} style={styles.infoNoticeIcon} />
          <Text style={styles.infoNoticeText}>
            Zones let you plant different crops in different parts of the farm. Each zone gets its own produce calendar, fertigation schedule, and pest tracking.
          </Text>
        </View>

        {/* MAP VIEW — decorative only: `Plot` has no boundary/geometry field on the backend yet,
            so there is no real per-zone shape to draw here. Colours below are keyed by list
            position (see `visualFor`), not by any real zone id. */}
        <View style={styles.mapContainer}>
          <View style={[styles.mapBackground, { backgroundColor: P.oliveGreen }]}>
            <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
              <Defs>
                <Pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <Rect width="40" height="40" fill="none" />
                  <Circle cx="20" cy="20" r="1" fill="rgba(0,0,0,0.1)" />
                  <Line x1="0" y1="0" x2="40" y2="40" stroke="rgba(0,0,0,0.05)" strokeWidth="1" />
                </Pattern>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#grid)" />

              {/* Farm Boundary (Dashed) */}
              <Polygon
                points="70,40 240,30 260,160 230,240 80,250 60,150"
                fill="none"
                stroke={P.yellow500}
                strokeWidth="3"
                strokeDasharray="8,6"
              />

              {zones[0] && (
                <>
                  <Polygon
                    points="70,40 240,30 245,100 65,100"
                    fill="rgba(27, 94, 32, 0.6)"
                    stroke="rgba(27, 94, 32, 0.8)"
                    strokeWidth="2"
                  />
                  <Circle cx="155" cy="65" r="12" fill={P.deepGreen} stroke={colors.white} strokeWidth="2" />
                </>
              )}

              {zones[1] && (
                <>
                  <Polygon
                    points="65,100 245,100 255,180 75,180"
                    fill="rgba(230, 81, 0, 0.6)"
                    stroke="rgba(230, 81, 0, 0.8)"
                    strokeWidth="2"
                  />
                  <Circle cx="160" cy="140" r="12" fill={P.orange900} stroke={colors.white} strokeWidth="2" />
                </>
              )}

              {zones[2] && (
                <>
                  <Polygon
                    points="75,180 255,180 230,240 80,250"
                    fill="rgba(69, 39, 160, 0.6)"
                    stroke="rgba(69, 39, 160, 0.8)"
                    strokeWidth="2"
                  />
                  <Circle cx="155" cy="215" r="12" fill={P.deepPurple800} stroke={colors.white} strokeWidth="2" />
                </>
              )}
            </Svg>
          </View>

          {/* Farm boundary tag */}
          <View style={styles.boundaryTag}>
            <Text style={{ color: P.yellow500, fontWeight: '800', marginRight: 4 }}>- -</Text>
            <Text style={{ color: colors.white, fontSize: 12, fontWeight: '700' }}>Farm boundary</Text>
          </View>

          {/* Floating Action Buttons — decorative, matching the pre-existing mock (no zone
              geometry to draw/edit yet). */}
          <View style={styles.floatingActions}>
            <TouchableOpacity style={styles.fabWhite}>
              <Icon name="crop_free" size={18} color={colors.brandGreen} style={styles.fabIcon} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.fabTeal}>
              <Icon name="place" size={18} color={colors.white} style={styles.fabIcon} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.fabWhite, { opacity: 0.6 }]}>
              <Icon name="undo" size={18} color={colors.textSubtle} style={styles.fabIcon} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.fabWhite, { opacity: 0.6 }]}>
              <Icon name="check" size={18} color={colors.textSubtle} style={styles.fabIcon} />
            </TouchableOpacity>
          </View>
        </View>

        {/* METRICS ROW */}
        <View style={[styles.metricsRow, { borderColor: colors.borderLight }]}>
          <View style={[styles.metricCol, { borderRightWidth: 1, borderRightColor: colors.borderLight }]}>
            <Text style={[styles.metricVal, { color: colors.textDark }]}>{zones.length}</Text>
            <Text style={styles.metricLabel}>Total Zones</Text>
          </View>
          <View style={[styles.metricCol, { borderRightWidth: 1, borderRightColor: colors.borderLight }]}>
            <Text style={[styles.metricVal, { color: colors.brandGreen }]}>{totalMarkedAcres.toFixed(2)}</Text>
            <Text style={styles.metricLabel}>Marked ac</Text>
          </View>
          <View style={styles.metricCol}>
            <Text style={[styles.metricVal, { color: colors.textSubtle }]}>{unmarkedAcres.toFixed(2)}</Text>
            <Text style={styles.metricLabel}>Unmarked ac</Text>
          </View>
        </View>

        {/* ALL ZONES LIST HEADER */}
        <View style={styles.listHeaderRow}>
          <View style={styles.listHeaderTitleRow}>
            <Icon name="folder" size={14} color={colors.brandGreen} style={styles.listHeaderIcon} />
            <Text style={[styles.listHeaderTitle, { color: colors.brandGreen }]}>ALL ZONES</Text>
          </View>
          <TouchableOpacity
            onPress={() => onNavigateToAddZone(selectedFarmId)}
            disabled={!selectedFarmId}
          >
            <Text style={[styles.addZoneBtnText, { color: colors.brandGreen, opacity: selectedFarmId ? 1 : 0.5 }]}>
              + Add Zone
            </Text>
          </TouchableOpacity>
        </View>

        {zonesError ? <Text style={styles.errorText}>{zonesError}</Text> : null}

        {zonesLoading ? (
          <>
            <Skeleton height={140} width="100%" style={{ marginBottom: 12 }} />
            <Skeleton height={140} width="100%" style={{ marginBottom: 12 }} />
          </>
        ) : zones.length === 0 ? (
          <Text style={styles.emptyText}>No zones yet. Tap "+ Add Zone" to mark out your first one.</Text>
        ) : (
          zones.map((zone, index) => {
            const visual = visualFor(index);
            const crop = localCrops[zone.id];
            return (
              <View
                key={zone.id}
                style={[styles.zoneCard, { borderColor: visual.color }]}
              >
                <View style={styles.zoneCardTop}>
                  <View style={[styles.zoneIcon, { backgroundColor: visual.color }]}>
                    <Text style={styles.zoneIconText}>{visual.letter}</Text>
                  </View>
                  <View style={styles.zoneTitleCol}>
                    <Text style={[styles.zoneTitle, { color: colors.textDark }]}>{zone.name}</Text>
                    <View style={styles.zoneSubRow}>
                      <Icon name="crop_free" size={12} color={colors.textSubtle} style={styles.zoneSubIcon} />
                      <Text style={[styles.zoneSub, { color: colors.textSubtle }]}>
                        {(zone.areaAcres ?? 0).toFixed(2)} ac
                      </Text>
                    </View>
                  </View>
                  <View style={styles.zoneActions}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleOpenEdit(zone)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      accessibilityLabel="Edit Zone"
                    >
                      <Icon name="edit" size={16} color={colors.brandGreen} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.actionDeleteBtn]}
                      onPress={() => handleDeleteZone(zone.id)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      accessibilityLabel="Delete Zone"
                    >
                      <Icon name="delete" size={16} color={P.red500} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.zoneCardDetails}>
                  <View style={styles.detailCol}>
                    <Text style={styles.detailLabel}>SOIL</Text>
                    <Text style={styles.detailValue}>{zone.soilType || '—'}</Text>
                  </View>
                  <View style={styles.detailCol}>
                    <Text style={styles.detailLabel}>EXPOSURE</Text>
                    <Text style={styles.detailValue}>{zone.sunExposure || '—'}</Text>
                  </View>
                  <View style={styles.detailCol}>
                    <Text style={styles.detailLabel}>IRRIGATION</Text>
                    <Text style={styles.detailValue}>{zone.irrigationType || '—'}</Text>
                  </View>
                </View>

                {crop ? (
                  <View style={[styles.cropPill, { backgroundColor: colors.brandGreenLight }]}>
                    <View style={styles.cropPillRow}>
                      <Icon name="eco" size={12} color={colors.brandGreen} style={styles.cropPillIcon} />
                      <Text style={[styles.cropPillText, { color: colors.brandGreen }]}>
                        Currently: {crop.name}
                        {crop.day ? ` · Day ${crop.day}` : ''} · not saved yet
                      </Text>
                    </View>
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* FOOTER */}
      <View style={[styles.footer, { borderTopColor: colors.borderDivider, backgroundColor: colors.bgLight }]}>
        <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.borderLight }]} onPress={onNavigateBack}>
          <Text style={[styles.cancelBtnText, { color: colors.textDark }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.brandGreen }]} onPress={onSave}>
          <View style={styles.saveBtnRow}>
            <Icon name="save" size={16} color={colors.white} style={styles.saveBtnIcon} />
            <Text style={styles.saveBtnText}>Save Zones</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ================= EDIT ZONE MODAL ================= */}
      <Modal
        visible={isEditModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit {editingZone?.name || 'Zone'}</Text>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                <Icon name="close" size={20} color={P.twGray500} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {/* ZONE NAME */}
              <Text style={styles.inputLabel}>Zone Name</Text>
              <TextInput
                style={styles.textInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Zone Name"
                placeholderTextColor={P.twGray400}
              />

              {/* SOIL TYPE */}
              <Text style={styles.inputLabel}>Soil Type</Text>
              <View style={styles.chipsRow}>
                {SOIL_OPTIONS.map((soil) => (
                  <TouchableOpacity
                    key={soil}
                    style={[
                      styles.chipBtn,
                      editSoil === soil && {
                        backgroundColor: P.lightGreen50,
                        borderColor: colors.brandGreen,
                      },
                    ]}
                    onPress={() => setEditSoil(soil)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        editSoil === soil && { color: colors.brandGreen, fontWeight: '700' },
                      ]}
                    >
                      {soil}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* EXPOSURE */}
              <Text style={styles.inputLabel}>Sun Exposure</Text>
              <View style={styles.chipsRow}>
                {EXPOSURE_OPTIONS.map((exp) => (
                  <TouchableOpacity
                    key={exp}
                    style={[
                      styles.chipBtn,
                      editExposure === exp && {
                        backgroundColor: P.lightGreen50,
                        borderColor: colors.brandGreen,
                      },
                    ]}
                    onPress={() => setEditExposure(exp)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        editExposure === exp && { color: colors.brandGreen, fontWeight: '700' },
                      ]}
                    >
                      {exp}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* IRRIGATION */}
              <Text style={styles.inputLabel}>Irrigation</Text>
              <View style={styles.chipsRow}>
                {IRRIGATION_OPTIONS.map((irr) => (
                  <TouchableOpacity
                    key={irr}
                    style={[
                      styles.chipBtn,
                      editIrrigation === irr && {
                        backgroundColor: P.lightGreen50,
                        borderColor: colors.brandGreen,
                      },
                    ]}
                    onPress={() => setEditIrrigation(irr)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        editIrrigation === irr && { color: colors.brandGreen, fontWeight: '700' },
                      ]}
                    >
                      {irr}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* CROP DETAILS — local-only, see the `localCrops` docblock above. */}
              <Text style={styles.inputLabel}>Current Crop (Optional)</Text>
              <Text style={styles.cropNotSavedNote}>
                Not saved yet — crop tracking isn't wired up on this app yet.
              </Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextInput
                  style={[styles.textInput, { flex: 2 }]}
                  value={editCropName}
                  onChangeText={setEditCropName}
                  placeholder="Crop Name (e.g. Tomato)"
                  placeholderTextColor={P.twGray400}
                />
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  value={editCropDay}
                  onChangeText={setEditCropDay}
                  placeholder="Day"
                  keyboardType="numeric"
                  placeholderTextColor={P.twGray400}
                />
              </View>

              {modalError ? <Text style={styles.modalErrorText}>{modalError}</Text> : null}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsEditModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, { backgroundColor: colors.brandGreen, opacity: modalSaving ? 0.7 : 1 }]}
                onPress={() => void handleSaveEdit()}
                disabled={modalSaving}
              >
                {modalSaving ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.modalSaveBtnText}>Save</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: P.surfaceMuted,
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
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSubtitle: { fontSize: 13, marginTop: 2 },
  helpBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.grey300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpIcon: { fontSize: 16, color: P.blueGrey600, fontWeight: '700' },

  contentScroll: { flex: 1 },
  contentContainer: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },

  errorText: {
    color: P.red600,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 13,
    color: P.blueGrey600,
    textAlign: 'center',
    paddingVertical: 24,
  },

  farmSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    backgroundColor: colors.white,
  },
  farmIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  farmSelectorText: { flex: 1 },

  farmDropdownMenu: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 6,
    marginBottom: 16,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  farmDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  farmDropdownItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  farmDropdownItemText: {
    fontSize: 14,
  },

  infoNoticeBox: {
    flexDirection: 'row',
    backgroundColor: P.coolTintBg,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  infoNoticeIcon: { marginRight: 12, marginTop: 2 },
  infoNoticeText: { flex: 1, fontSize: 13, color: P.darkSlateText, lineHeight: 20 },

  mapContainer: {
    width: '100%',
    height: 320,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
  },
  mapBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  boundaryTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(27, 46, 17, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  floatingActions: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  fabWhite: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  fabTeal: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: P.deepGreen,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  fabIcon: { fontWeight: '700' },

  metricsRow: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 24,
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricVal: { fontSize: 20, fontWeight: '800' },
  metricLabel: { fontSize: 11, fontWeight: '600', color: P.blueGrey400, marginTop: 4 },

  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  listHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listHeaderIcon: { marginRight: 4 },
  listHeaderTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  addZoneBtnText: { fontSize: 14, fontWeight: '700' },

  zoneCard: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 16,
    backgroundColor: colors.white,
    marginBottom: 12,
  },
  zoneCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  zoneIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  zoneIconText: { color: colors.white, fontSize: 16, fontWeight: '800' },
  zoneTitleCol: { flex: 1 },
  zoneTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  zoneSubRow: { flexDirection: 'row', alignItems: 'center' },
  zoneSubIcon: { marginRight: 4 },
  zoneSub: { fontSize: 12 },
  zoneActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: P.lightGreen50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionDeleteBtn: {
    backgroundColor: P.red50,
  },

  zoneCardDetails: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: P.surfaceMuted,
    paddingTop: 12,
    marginBottom: 12,
  },
  detailCol: { flex: 1 },
  detailLabel: { fontSize: 10, fontWeight: '800', color: P.grey500, marginBottom: 4 },
  detailValue: { fontSize: 13, fontWeight: '600', color: P.grey800 },

  cropPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  cropPillRow: { flexDirection: 'row', alignItems: 'center' },
  cropPillIcon: { marginRight: 4 },
  cropPillText: { fontSize: 12, fontWeight: '700' },

  /* MODAL STYLES */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
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
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 6,
    marginTop: 6,
  },
  cropNotSavedNote: {
    fontSize: 11,
    fontWeight: '600',
    color: P.blueGrey400,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textDark,
    backgroundColor: colors.bgLight,
    marginBottom: 10,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  chipBtn: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.bgLight,
  },
  chipText: {
    fontSize: 13,
    color: colors.textDark,
  },
  modalErrorText: {
    color: P.red600,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.bgLight,
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSubtle,
  },
  modalSaveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
  },
  modalSaveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },

  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: { fontSize: 16, fontWeight: '700' },
  saveBtn: {
    flex: 1.5,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnRow: { flexDirection: 'row', alignItems: 'center' },
  saveBtnIcon: { marginRight: 6 },
  saveBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
