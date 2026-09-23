import React, { useState } from 'react';
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
} from 'react-native';
import Svg, { Circle, Line, Polygon, Defs, Pattern, Rect } from 'react-native-svg';
import { Icon } from '@tohfa/mobile-ui';
import { useTheme, colors, authPalette as P } from '../../theme';

interface ZonesScreenProps {
  onNavigateBack: () => void;
  onNavigateToAddZone: () => void;
  onSave: () => void;
}

interface FarmOption {
  id: string;
  name: string;
  totalAcres: number;
}

const FARMS_LIST: FarmOption[] = [
  { id: 'farm_1', name: 'Your Farm', totalAcres: 2.50 },
  { id: 'farm_2', name: 'Farm 2 · East Field', totalAcres: 1.80 },
  { id: 'farm_3', name: 'Farm 3 · Riverside Plot', totalAcres: 3.20 },
];

interface ZoneItem {
  id: string;
  letter: string;
  name: string;
  area: number;
  points: number;
  color: string;
  borderColor: string;
  bgColor: string;
  soil: string;
  exposure: string;
  irrigation: string;
  crop?: {
    name: string;
    day: number;
  } | undefined;
}

const INITIAL_ZONES: ZoneItem[] = [
  {
    id: 'zone_a',
    letter: 'A',
    name: 'Zone A · North Plot',
    area: 0.90,
    points: 5,
    color: P.deepGreen,
    borderColor: P.deepGreen,
    bgColor: 'rgba(27, 94, 32, 0.6)',
    soil: 'Loamy',
    exposure: 'Full sun',
    irrigation: 'Drip',
    crop: {
      name: 'Tomato',
      day: 62,
    },
  },
  {
    id: 'zone_b',
    letter: 'B',
    name: 'Zone B · Middle Terrace',
    area: 0.85,
    points: 4,
    color: P.orange900,
    borderColor: P.orange900,
    bgColor: 'rgba(230, 81, 0, 0.6)',
    soil: 'Sandy',
    exposure: 'Partial',
    irrigation: 'Sprinkler',
    crop: {
      name: 'Carrot',
      day: 34,
    },
  },
  {
    id: 'zone_c',
    letter: 'C',
    name: 'Zone C · Lower Bed',
    area: 0.55,
    points: 4,
    color: P.deepPurple600,
    borderColor: P.deepPurple600,
    bgColor: 'rgba(69, 39, 160, 0.6)',
    soil: 'Red soil',
    exposure: 'Full sun',
    irrigation: 'Drip',
  },
];

const SOIL_OPTIONS = ['Loamy', 'Sandy', 'Clay', 'Red soil', 'Black soil'];
const EXPOSURE_OPTIONS = ['Full sun', 'Partial', 'Shade'];
const IRRIGATION_OPTIONS = ['Drip', 'Sprinkler', 'Flood', 'Rainfed'];

export function ZonesScreen({ onNavigateBack, onNavigateToAddZone, onSave }: ZonesScreenProps) {
  const { colors } = useTheme();

  // Farm Selector state
  const [selectedFarm, setSelectedFarm] = useState<FarmOption>(FARMS_LIST[0]!);
  const [isFarmDropdownOpen, setIsFarmDropdownOpen] = useState(false);

  // Zones state
  const [zones, setZones] = useState<ZoneItem[]>(INITIAL_ZONES);

  // Edit Zone Modal state
  const [editingZone, setEditingZone] = useState<ZoneItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editSoil, setEditSoil] = useState('');
  const [editExposure, setEditExposure] = useState('');
  const [editIrrigation, setEditIrrigation] = useState('');
  const [editCropName, setEditCropName] = useState('');
  const [editCropDay, setEditCropDay] = useState('');
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  // Dynamic calculations
  const totalMarkedAcres = zones.reduce((acc, z) => acc + z.area, 0);
  const unmarkedAcres = Math.max(0, selectedFarm.totalAcres - totalMarkedAcres);

  const handleOpenEdit = (zone: ZoneItem) => {
    setEditingZone(zone);
    setEditName(zone.name);
    setEditSoil(zone.soil);
    setEditExposure(zone.exposure);
    setEditIrrigation(zone.irrigation);
    setEditCropName(zone.crop?.name || '');
    setEditCropDay(zone.crop?.day ? String(zone.crop.day) : '');
    setIsEditModalVisible(true);
  };

  const handleSaveEdit = () => {
    if (!editingZone) return;

    setZones(
      zones.map((z) => {
        if (z.id !== editingZone.id) return z;
        return {
          ...z,
          name: editName.trim() || z.name,
          soil: editSoil,
          exposure: editExposure,
          irrigation: editIrrigation,
          crop: editCropName.trim()
            ? {
                name: editCropName.trim(),
                day: parseInt(editCropDay, 10) || 1,
              }
            : undefined,
        };
      }),
    );
    setIsEditModalVisible(false);
    setEditingZone(null);
  };

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
            setZones(zones.filter((z) => z.id !== zoneId));
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
              {selectedFarm.name}
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
            {FARMS_LIST.map((farm) => {
              const isSelected = farm.id === selectedFarm.id;
              return (
                <TouchableOpacity
                  key={farm.id}
                  style={[
                    styles.farmDropdownItem,
                    isSelected && { backgroundColor: P.lightGreen50 },
                  ]}
                  onPress={() => {
                    setSelectedFarm(farm);
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
                        Total area: {farm.totalAcres.toFixed(2)} ac
                      </Text>
                    </View>
                  </View>
                  {isSelected && <Icon name="check" size={16} color={colors.brandGreen} />}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* INFO NOTICE */}
        <View style={styles.infoNoticeBox}>
          <Icon name="lightbulb" size={18} color={P.black} style={styles.infoNoticeIcon} />
          <Text style={styles.infoNoticeText}>
            Zones let you plant different crops in different parts of the farm. Each zone gets its own produce calendar, fertigation schedule, and pest tracking.
          </Text>
        </View>

        {/* MAP VIEW */}
        <View style={styles.mapContainer}>
          <View style={[styles.mapBackground, { backgroundColor: P.oliveGreen }]}>
            {/* Simulated map texture */}
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

              {/* Zone A (Green) */}
              {zones.some((z) => z.id === 'zone_a') && (
                <>
                  <Polygon
                    points="70,40 240,30 245,100 65,100"
                    fill="rgba(27, 94, 32, 0.6)"
                    stroke="rgba(27, 94, 32, 0.8)"
                    strokeWidth="2"
                  />
                  <Circle cx="155" cy="65" r="12" fill={P.deepGreen} stroke={colors.white} strokeWidth="2" />
                  <Text style={{ position: 'absolute', top: 56, left: 150, color: colors.white, fontWeight: '800', fontSize: 12 }}>A</Text>
                </>
              )}

              {/* Zone B (Orange) */}
              {zones.some((z) => z.id === 'zone_b') && (
                <>
                  <Polygon
                    points="65,100 245,100 255,180 75,180"
                    fill="rgba(230, 81, 0, 0.6)"
                    stroke="rgba(230, 81, 0, 0.8)"
                    strokeWidth="2"
                  />
                  <Circle cx="160" cy="140" r="12" fill={P.orange900} stroke={colors.white} strokeWidth="2" />
                  <Text style={{ position: 'absolute', top: 131, left: 155, color: colors.white, fontWeight: '800', fontSize: 12 }}>B</Text>
                </>
              )}

              {/* Zone C (Purple) */}
              {zones.some((z) => z.id === 'zone_c') && (
                <>
                  <Polygon
                    points="75,180 255,180 230,240 80,250"
                    fill="rgba(69, 39, 160, 0.6)"
                    stroke="rgba(69, 39, 160, 0.8)"
                    strokeWidth="2"
                  />
                  <Circle cx="155" cy="215" r="12" fill={P.deepPurple800} stroke={colors.white} strokeWidth="2" />
                  <Text style={{ position: 'absolute', top: 206, left: 150, color: colors.white, fontWeight: '800', fontSize: 12 }}>C</Text>
                </>
              )}
            </Svg>
          </View>

          {/* Farm boundary tag */}
          <View style={styles.boundaryTag}>
            <Text style={{ color: P.yellow500, fontWeight: '800', marginRight: 4 }}>- -</Text>
            <Text style={{ color: colors.white, fontSize: 12, fontWeight: '700' }}>Farm boundary</Text>
          </View>

          {/* Floating Action Buttons */}
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
          <TouchableOpacity onPress={onNavigateToAddZone}>
            <Text style={[styles.addZoneBtnText, { color: colors.brandGreen }]}>+ Add Zone</Text>
          </TouchableOpacity>
        </View>

        {/* DYNAMIC ZONES LIST */}
        {zones.map((zone) => (
          <View
            key={zone.id}
            style={[
              styles.zoneCard,
              {
                borderColor: zone.borderColor,
              },
            ]}
          >
            <View style={styles.zoneCardTop}>
              <View style={[styles.zoneIcon, { backgroundColor: zone.color }]}>
                <Text style={styles.zoneIconText}>{zone.letter}</Text>
              </View>
              <View style={styles.zoneTitleCol}>
                <Text style={[styles.zoneTitle, { color: colors.textDark }]}>{zone.name}</Text>
                <View style={styles.zoneSubRow}>
                  <Icon name="crop_free" size={12} color={colors.textSubtle} style={styles.zoneSubIcon} />
                  <Text style={[styles.zoneSub, { color: colors.textSubtle }]}>
                    {zone.area.toFixed(2)} ac · {zone.points} pts
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
                <Text style={styles.detailValue}>{zone.soil}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>EXPOSURE</Text>
                <Text style={styles.detailValue}>{zone.exposure}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>IRRIGATION</Text>
                <Text style={styles.detailValue}>{zone.irrigation}</Text>
              </View>
            </View>

            {zone.crop ? (
              <View style={[styles.cropPill, { backgroundColor: colors.brandGreenLight }]}>
                <View style={styles.cropPillRow}>
                  <Icon name="eco" size={12} color={colors.brandGreen} style={styles.cropPillIcon} />
                  <Text style={[styles.cropPillText, { color: colors.brandGreen }]}>
                    Currently: {zone.crop.name} · Day {zone.crop.day}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        ))}
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

              {/* CROP DETAILS */}
              <Text style={styles.inputLabel}>Current Crop (Optional)</Text>
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
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsEditModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, { backgroundColor: colors.brandGreen }]}
                onPress={handleSaveEdit}
              >
                <Text style={styles.modalSaveBtnText}>Save</Text>
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
