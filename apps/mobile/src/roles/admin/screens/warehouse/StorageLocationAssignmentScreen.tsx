import React, { useState } from 'react';
import {
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

const PALETTE = {
  primary:            '#F0562A', // Brand Orange
  headerBg:           '#F0562A',
  headerText:         '#FFFFFF',

  orangeDeep:         '#7A2E14',
  noticeBgOrange:     '#FDF1EB', // Brand Peach/Orange Tint matching screenshot
  noticeBorderOrange: '#F6D2C4',
  pageBg:             '#F3EFE9', // Canvas soft cream

  textInk:            '#1A1A1A',
  textSecondary:      '#5F5E5A',
  textMuted:          '#8C8983',
  border:             '#EEDCD3',
  borderSubtle:       '#F2ECE5',
  cardBg:             '#FFFFFF',
  greenSuccess:       '#16A34A',
  greenBg:            '#DCFCE7',
};

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckmarkIcon({ size = 12, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface StorageLocationAssignmentScreenProps {
  batchId?: string;
  warehouseName?: string;
  productName?: string;
  quantity?: string;
  onBack?: () => void;
  onSelectStorageLocation?: (locationName: string) => void;
}

export function StorageLocationAssignmentScreen({
  batchId = 'BAT-00512',
  warehouseName = 'Coonoor',
  productName = 'Tomato · Grade 2',
  quantity = '445 KG',
  onBack,
  onSelectStorageLocation,
}: StorageLocationAssignmentScreenProps) {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [isPickerModalVisible, setIsPickerModalVisible] = useState(false);

  const LOCATIONS = [
    {
      id: 'loc_1',
      title: 'Zone A-1 · Cold Storage',
      sub: 'Rack 02 · Shelf 3 · Temp: 4°C · Capacity: 1,200 KG free',
      zone: 'Cold Storage (Recommended)',
    },
    {
      id: 'loc_2',
      title: 'Zone B-2 · Ambient Rack 04',
      sub: 'Rack 04 · Shelf 1 · Temp: Ambient · Capacity: 800 KG free',
      zone: 'Dry/Ambient Storage',
    },
    {
      id: 'loc_3',
      title: 'Zone C-1 · Dispatch Staging',
      sub: 'Buffer Bay 01 · Quick Transit · Capacity: 450 KG free',
      zone: 'Staging Bay',
    },
  ];

  const handleSelectLocation = (locTitle: string) => {
    setSelectedLocation(locTitle);
    setIsPickerModalVisible(false);
  };

  const handleConfirmAssignment = () => {
    const loc = selectedLocation || 'Zone A-1 · Cold Storage';
    onSelectStorageLocation?.(loc);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* ─── Top Header Banner (Exact match to Left Screen in Image) ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {onBack && (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
              <ArrowBackIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Storage Location Assignment</Text>
        </View>
        <Text style={styles.headerSubtitle}>Batch {batchId}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Batch Summary Card (Exact match to Left Screen in Image) ─── */}
        <View style={styles.infoCard}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Warehouse</Text>
              <Text style={styles.gridValue}>{warehouseName}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Batch</Text>
              <Text style={styles.gridValue}>{batchId}</Text>
            </View>
          </View>

          <View style={[styles.gridRow, { marginBottom: 0 }]}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Product</Text>
              <Text style={styles.gridValue}>{productName}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Quantity</Text>
              <Text style={styles.gridValue}>{quantity}</Text>
            </View>
          </View>
        </View>

        {/* ─── Location Hierarchy Notice Box (Exact match to Left Screen) ─── */}
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>
            Location hierarchy (Warehouse → Storage Area → Section → Rack → Shelf) reflects this warehouse's actual configuration — not hard-coded if the backend uses a different structure.
          </Text>
        </View>

        {/* ─── Selected Location Display (if chosen) ─── */}
        {selectedLocation ? (
          <View style={styles.selectedLocCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.selectedLocLabel}>ASSIGNED STORAGE LOCATION</Text>
              <Text style={styles.selectedLocTitle}>{selectedLocation}</Text>
              <Text style={styles.selectedLocSub}>Rack 02 · Shelf 3 · Temp: 4°C</Text>
            </View>
            <TouchableOpacity
              style={styles.changeLocBtn}
              onPress={() => setIsPickerModalVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.changeLocBtnText}>Change</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* ─── Select Storage Location Outline Button (Exact match to Left Screen) ─── */}
        <TouchableOpacity
          style={styles.outlineSelectBtn}
          onPress={() => setIsPickerModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.outlineSelectBtnText}>
            {selectedLocation ? 'Change Storage Location' : 'Select Storage Location'}
          </Text>
        </TouchableOpacity>

        {/* ─── Confirm Assignment Button ─── */}
        {selectedLocation && (
          <TouchableOpacity
            style={styles.primaryActionBtn}
            onPress={handleConfirmAssignment}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryActionBtnText}>
              Confirm Location Assignment & Complete Receiving →
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ─── Location Picker Modal ─── */}
      <Modal
        visible={isPickerModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsPickerModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Destination Rack & Shelf</Text>
              <Text style={styles.modalSub}>{warehouseName} · {productName}</Text>
            </View>

            <View style={styles.locList}>
              {LOCATIONS.map((loc) => {
                const isSelected = selectedLocation === loc.title;
                return (
                  <TouchableOpacity
                    key={loc.id}
                    style={[
                      styles.locItemCard,
                      isSelected && styles.locItemCardSelected,
                    ]}
                    onPress={() => handleSelectLocation(loc.title)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                      {isSelected && <CheckmarkIcon size={11} color="#FFFFFF" />}
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.locZoneBadge}>{loc.zone}</Text>
                      <Text style={[styles.locItemTitle, isSelected && { color: PALETTE.orangeDeep }]}>
                        {loc.title}
                      </Text>
                      <Text style={styles.locItemSub}>{loc.sub}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setIsPickerModalVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PALETTE.headerBg,
  },
  header: {
    backgroundColor: PALETTE.headerBg,
    paddingTop: Platform.OS === 'ios' ? 8 : 10,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    padding: 4,
    marginRight: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.92)',
    fontWeight: '500',
    marginTop: 3,
    marginLeft: 36,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  infoCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  gridCol: {
    flex: 1,
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.textSecondary,
    marginBottom: 3,
  },
  gridValue: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  noticeBox: {
    backgroundColor: PALETTE.noticeBgOrange,
    borderWidth: 1,
    borderColor: PALETTE.noticeBorderOrange,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  noticeText: {
    fontSize: 11.5,
    color: '#9C3D18',
    lineHeight: 17,
    fontWeight: '500',
  },
  outlineSelectBtn: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: PALETTE.primary,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  outlineSelectBtnText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.primary,
  },
  selectedLocCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: PALETTE.primary,
    padding: 14,
    marginBottom: 14,
  },
  selectedLocLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: PALETTE.primary,
  },
  selectedLocTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginTop: 2,
  },
  selectedLocSub: {
    fontSize: 11.5,
    color: PALETTE.textSecondary,
    marginTop: 1,
  },
  changeLocBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: PALETTE.noticeBgOrange,
  },
  changeLocBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.primary,
  },
  primaryActionBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PALETTE.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryActionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  modalHeader: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  modalSub: {
    fontSize: 12.5,
    color: PALETTE.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  locList: {
    gap: 10,
    marginBottom: 16,
  },
  locItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 12,
  },
  locItemCardSelected: {
    borderColor: PALETTE.primary,
    backgroundColor: '#FFF8F6',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#C7BDB5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: PALETTE.primary,
    backgroundColor: PALETTE.primary,
  },
  locZoneBadge: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: PALETTE.primary,
    marginBottom: 2,
  },
  locItemTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  locItemSub: {
    fontSize: 11,
    color: PALETTE.textSecondary,
    marginTop: 2,
  },
  modalCloseBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3EFE9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.textSecondary,
  },
});
