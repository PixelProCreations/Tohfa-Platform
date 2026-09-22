import React, { useRef, useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import DocumentPicker from 'react-native-document-picker';
import {
  FarmBoundaryMap,
  Icon,
  type FarmBoundaryMapHandle,
  type FarmBoundaryMapMode,
} from '@tohfa/mobile-ui';
import { colors, useTheme } from '../../theme';
import { authPalette as P } from '../../theme';
import { calculatePolygonMetrics } from '../../utils/geo';
import { t } from '../../../../i18n/farmer';

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
  onNavigateToFieldContext: () => void;
}

type TabType = 'Draw' | 'Upload';

export function FMBSketchScreen({ onNavigateBack, onNavigateToFieldContext }: FMBSketchScreenProps) {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('Draw');

  const mapRef = useRef<FarmBoundaryMapHandle>(null);
  const [mode, setMode] = useState<FarmBoundaryMapMode>('view');
  const [coords, setCoords] = useState<[number, number][]>([]);
  const metrics = calculatePolygonMetrics(coords);
  const pointCount = coords.length > 1 ? coords.length - 1 : coords.length;

  const [uploadedDoc, setUploadedDoc] = useState<{
    name: string;
    size: number;
    uri: string;
  } | null>(null);

  const [farms, setFarms] = useState<Array<{ id: string; name: string }>>([
    { id: '1', name: 'Your Farm' },
  ]);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState<{ id: string; name: string } | null>(null);
  const [tempName, setTempName] = useState('');

  function handleEditFarm(farm: { id: string; name: string }) {
    setSelectedFarm(farm);
    setTempName(farm.name);
    setIsEditModalVisible(true);
  }

  function handleSaveFarmName() {
    if (!tempName.trim()) return;
    setFarms((prev) =>
      prev.map((f) => (f.id === selectedFarm?.id ? { ...f, name: tempName.trim() } : f)),
    );
    setIsEditModalVisible(false);
  }

  function handleStartEditBoundary() {
    setIsEditModalVisible(false);
    setActiveTab('Draw');
    if (coords.length >= 3) {
      mapRef.current?.startEditing();
    } else {
      mapRef.current?.startDrawing();
    }
  }

  function handleDeleteFarm(farmId: string) {
    Alert.alert(
      'Delete Farm',
      'Are you sure you want to delete this farm?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (farms.length === 1) {
              handleClear();
              setUploadedDoc(null);
            } else {
              setFarms((prev) => prev.filter((f) => f.id !== farmId));
              handleClear();
            }
          },
        },
      ],
    );
  }

  function handleAddFarm() {
    const nextIndex = farms.length + 1;
    const newFarm = { id: String(Date.now()), name: `Farm ${nextIndex}` };
    setFarms((prev) => [...prev, newFarm]);
    handleClear();
    setUploadedDoc(null);
    setActiveTab('Draw');
    mapRef.current?.startDrawing();
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
        Alert.alert('Upload Error', 'Could not access file. Please check device permissions.');
      }
    }
  }

  function handleRemoveDocument() {
    setUploadedDoc(null);
  }

  function handlePolygonChange(next: [number, number][]) {
    setCoords(next);
  }

  function handleLocateMe() {
    void mapRef.current?.locateMe();
  }

  /** Teal FAB: the one draw/edit toggle this screen has (see Screen 17's FAB stack). */
  function handleToggleDraw() {
    if (mode !== 'view') {
      mapRef.current?.finish();
      return;
    }
    if (coords.length >= 3) {
      mapRef.current?.startEditing();
    } else {
      mapRef.current?.startDrawing();
    }
  }

  function handleUndo() {
    mapRef.current?.undo();
  }

  function handleClear() {
    mapRef.current?.clear();
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.bgLight }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bgLight} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.backBtn}>
          <Icon name="arrow_back" size={24} color={colors.brandGreen} />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={[styles.headerTitle, { color: colors.textDark }]}>FMB Sketch</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSubtle }]}>Farm map boundary</Text>
        </View>
      </View>

      {/* TABS */}
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
            Draw on Map
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
            Upload FMB
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'Draw' ? (
          <>
            {/* MAP CONTAINER — Horizontally edge-to-edge (100% full width) */}
            <View style={styles.fullWidthMapContainer}>
              <FarmBoundaryMap
                initialCenter={null}
                initialPolygon={null}
                onPolygonChange={handlePolygonChange}
                onModeChange={setMode}
                searchPlaceholder={t('farmer.map.searchPlaceholder')}
                ref={mapRef}
                testID="fmb-sketch-farm-boundary-map"
              />

              {/* Floating Action Buttons */}
              <View style={styles.floatingActions} pointerEvents="box-none">
                <TouchableOpacity
                  style={styles.fabWhite}
                  onPress={handleLocateMe}
                  accessibilityLabel={t('farmer.map.locateMe')}
                >
                  <Icon name="gps_fixed" size={20} color={colors.brandGreen} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.fabTeal}
                  onPress={handleToggleDraw}
                  accessibilityLabel={
                    mode !== 'view'
                      ? t('farmer.map.doneDrawing')
                      : coords.length >= 3
                        ? t('farmer.map.editBoundary')
                        : t('farmer.map.drawBoundary')
                  }
                >
                  <Icon name={mode !== 'view' ? 'check' : 'edit'} size={20} color={colors.white} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.fabWhite}
                  onPress={handleUndo}
                  accessibilityLabel={t('farmer.map.undo')}
                >
                  <Icon name="undo" size={20} color={colors.brandGreen} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.fabWhite}
                  onPress={handleClear}
                  accessibilityLabel={t('farmer.map.clear')}
                >
                  <Icon name="delete" size={20} color={P.red500} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Padded Content Section Below Map */}
            <View style={styles.paddedSection}>
              {/* Metrics Row */}
              <View style={styles.metricsRow}>
                <View style={[styles.metricBox, { borderColor: colors.borderLight }]}>
                  <Text style={[styles.metricVal, { color: colors.textDark }]}>
                    {coords.length > 0 ? pointCount : '—'}
                  </Text>
                  <Text style={[styles.metricLabel, { color: colors.textSubtle }]}>Points</Text>
                </View>
                <View style={[styles.metricBox, { borderColor: colors.borderLight }]}>
                  <Text style={[styles.metricVal, { color: colors.textDark }]}>
                    {metrics.areaAcres > 0 ? metrics.areaAcres.toFixed(2) : '—'}
                    <Text style={styles.metricValUnit}> ac</Text>
                  </Text>
                  <Text style={[styles.metricLabel, { color: colors.textSubtle }]}>Area</Text>
                </View>
                <View style={[styles.metricBox, { borderColor: colors.borderLight }]}>
                  <Text style={[styles.metricVal, { color: colors.textDark }]}>—</Text>
                  <Text style={[styles.metricLabel, { color: colors.textSubtle }]}>Zones</Text>
                </View>
              </View>

              {/* YOUR FARMS LIST */}
              <Text style={[styles.sectionTitle, { color: colors.textSubtle }]}>YOUR FARMS</Text>

              {farms.map((farm, index) => (
                <View key={farm.id} style={[styles.farmCard, { borderColor: colors.borderLight }]}>
                  <View style={styles.farmCardLeft}>
                    <View style={[styles.farmIndexCircle, { backgroundColor: colors.brandGreen }]}>
                      <Text style={styles.farmIndexText}>{index + 1}</Text>
                    </View>
                    <View style={styles.farmInfo}>
                      <Text style={[styles.farmName, { color: colors.textDark }]}>{farm.name}</Text>
                      <View style={styles.farmSubRow}>
                        <Icon name="place" size={15} color={colors.brandGreen} />
                        <Text style={[styles.farmSub, { color: colors.textSubtle }]}>
                          {metrics.areaAcres > 0
                            ? `${metrics.areaAcres.toFixed(2)} ac · ${pointCount} pts`
                            : 'Draw boundary to get area'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.farmActionsRow}>
                    <TouchableOpacity
                      style={styles.farmActionBtn}
                      onPress={() => handleEditFarm(farm)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel="Edit farm"
                    >
                      <Icon name="edit" size={18} color={colors.brandGreen} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.farmActionBtn, styles.farmDeleteBtn]}
                      onPress={() => handleDeleteFarm(farm.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel="Delete farm"
                    >
                      <Icon name="delete" size={18} color={P.red500} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {/* ADD ANOTHER FARM BUTTON */}
              <TouchableOpacity
                style={[
                  styles.addFarmButton,
                  {
                    borderColor: colors.brandGreen,
                    backgroundColor: P.lightGreen50,
                  },
                ]}
                onPress={() => {
                  Alert.alert(
                    'Add Another Farm',
                    'Would you like to start marking the boundary for a new farm?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Add Farm',
                        onPress: handleAddFarm,
                      },
                    ],
                  );
                }}
                activeOpacity={0.7}
              >
                <AddLocationIcon size={18} color={colors.brandGreen} />
                <Text style={[styles.addFarmButtonText, { color: colors.brandGreen }]}>
                  Add another farm
                </Text>
              </TouchableOpacity>
            </View>
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
                    {uploadedDoc ? uploadedDoc.name : 'No document uploaded yet'}
                  </Text>
                  <Text style={[styles.uploadDocSize, { color: colors.textSubtle }]}>
                    {uploadedDoc
                      ? `${(uploadedDoc.size / 1024).toFixed(0)} KB · Tap to replace`
                      : 'Tap here to upload your FMB document (PDF or Image)'}
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
                <Text style={{ color: colors.brandGreen, fontWeight: '700', fontSize: 14 }}>
                  <Icon name="check" size={14} color={colors.brandGreen} /> Document attached
                </Text>
              </View>
            ) : null}

            <View style={styles.infoNoticeBox}>
              <Text style={styles.infoNoticeText}>
                <Text style={{ fontWeight: '700' }}>Don't have an FMB document?</Text> Upload is optional — you can draw the boundary directly on the map. A TOHFA field officer will verify during the audit visit. Useful if you already have survey papers from the VAO or Revenue Department.
              </Text>
            </View>

            {/* YOUR FARMS LIST */}
            <Text style={[styles.sectionTitle, { color: colors.textSubtle }]}>YOUR FARMS</Text>

            {farms.map((farm, index) => (
              <View key={farm.id} style={[styles.farmCard, { borderColor: colors.borderLight }]}>
                <View style={styles.farmCardLeft}>
                  <View style={[styles.farmIndexCircle, { backgroundColor: colors.brandGreen }]}>
                    <Text style={styles.farmIndexText}>{index + 1}</Text>
                  </View>
                  <View style={styles.farmInfo}>
                    <Text style={[styles.farmName, { color: colors.textDark }]}>{farm.name}</Text>
                    <View style={styles.farmSubRow}>
                      <Icon name="place" size={15} color={colors.brandGreen} />
                      <Text style={[styles.farmSub, { color: colors.textSubtle }]}>
                        {uploadedDoc ? uploadedDoc.name : 'Upload FMB document'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.farmActionsRow}>
                  <TouchableOpacity
                    style={styles.farmActionBtn}
                    onPress={() => handleEditFarm(farm)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Edit farm"
                  >
                    <Icon name="edit" size={18} color={colors.brandGreen} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.farmActionBtn, styles.farmDeleteBtn]}
                    onPress={() => handleDeleteFarm(farm.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Delete farm"
                  >
                    <Icon name="delete" size={18} color={P.red500} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* ADD ANOTHER FARM BUTTON */}
            <TouchableOpacity
              style={[
                styles.addFarmButton,
                {
                  borderColor: colors.brandGreen,
                  backgroundColor: P.lightGreen50,
                },
              ]}
              onPress={() => {
                Alert.alert(
                  'Add Another Farm',
                  'Would you like to start marking the boundary for a new farm?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Add Farm',
                      onPress: handleAddFarm,
                    },
                  ],
                );
              }}
              activeOpacity={0.7}
            >
              <AddLocationIcon size={18} color={colors.brandGreen} />
              <Text style={[styles.addFarmButtonText, { color: colors.brandGreen }]}>
                Add another farm
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* FOOTER */}
      <View style={[styles.footer, { borderTopColor: colors.borderDivider, backgroundColor: colors.bgLight }]}>
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.brandGreen }]} onPress={onNavigateToFieldContext}>
          <Text style={styles.saveBtnText}>
            <Icon name="description" size={16} color={colors.white} /> Save FMB
          </Text>
        </TouchableOpacity>
      </View>

      {/* ================= MODAL: EDIT FARM ================= */}
      <Modal
        visible={isEditModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Farm</Text>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                <Icon name="close" size={20} color={P.twGray500} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Farm Name</Text>
              <TextInput
                style={styles.textInput}
                value={tempName}
                onChangeText={setTempName}
                placeholder="Farm Name"
                placeholderTextColor={P.twGray400}
              />

              <TouchableOpacity
                style={styles.editBoundaryOptionBtn}
                onPress={handleStartEditBoundary}
                activeOpacity={0.7}
              >
                <Icon name="edit" size={16} color={colors.brandGreen} />
                <Text style={styles.editBoundaryOptionText}>Edit Boundary on Map</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsEditModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, { backgroundColor: colors.brandGreen }]}
                onPress={handleSaveFarmName}
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
  tabText: { fontSize: 14, fontWeight: '700' },

  contentScroll: { flex: 1 },
  contentContainer: { paddingBottom: 12 },

  fullWidthMapContainer: {
    width: '100%',
    height: 360,
    position: 'relative',
    marginBottom: 16,
  },
  paddedSection: {
    paddingHorizontal: 20,
  },

  floatingActions: {
    position: 'absolute',
    right: 14,
    top: 68,
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
    backgroundColor: P.tealAccent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
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
  metricVal: { fontSize: 20, fontWeight: '800' },
  metricValUnit: { fontSize: 13, fontWeight: '600' },
  metricLabel: { fontSize: 11, marginTop: 2 },

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
  uploadDocName: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  uploadDocSize: { fontSize: 12 },
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
  infoNoticeText: { fontSize: 13, color: P.blueGrey800, lineHeight: 20 },

  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 12 },

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
  farmIndexText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  farmInfo: { flex: 1 },
  farmName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  farmSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  farmSub: { fontSize: 12 },

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
    fontSize: 15,
    fontWeight: '600',
  },

  /* EDIT FARM MODAL STYLES */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
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
  modalBody: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.textDark,
    backgroundColor: colors.bgLight,
    marginBottom: 14,
  },
  editBoundaryOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: P.lightGreen50,
    borderRadius: 8,
  },
  editBoundaryOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.brandGreen,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  saveBtn: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
