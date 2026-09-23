import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TextInput,
} from 'react-native';
import Svg, { Circle, Line, Polygon, Defs, Pattern, Rect } from 'react-native-svg';
import { Icon } from '@tohfa/mobile-ui';
import { authPalette as P, useTheme, colors } from '../../theme';

interface AddZoneScreenProps {
  onNavigateBack: () => void;
  onSave: () => void;
}

const COLOR_PALETTE = [
  { id: 'green', color: P.deepGreen },
  { id: 'orange', color: P.orange900 },
  { id: 'purple', color: P.deepPurple400 },
  { id: 'red', color: P.red600 },
  { id: 'brown', color: P.brown400 },
  { id: 'blue', color: P.blue700 },
];

const SOIL_OPTIONS = ['Red soil', 'Loamy', 'Sandy', 'Clay', 'Black soil', 'Alluvial'];
const EXPOSURE_OPTIONS = ['Full sun', 'Partial', 'Shade'];
const IRRIGATION_OPTIONS = ['Drip', 'Sprinkler', 'Flood', 'Rainfed', 'Furrow'];

export function AddZoneScreen({ onNavigateBack, onSave }: AddZoneScreenProps) {
  const { colors } = useTheme();

  const [zoneName, setZoneName] = useState('Lower Bed');
  const [selectedColor, setSelectedColor] = useState<string>(P.deepPurple400);

  const [soilType, setSoilType] = useState('Red soil');
  const [isSoilOpen, setIsSoilOpen] = useState(false);

  const [sunExposure, setSunExposure] = useState('Full sun');
  const [isExposureOpen, setIsExposureOpen] = useState(false);

  const [irrigationMethod, setIrrigationMethod] = useState('Drip');
  const [isIrrigationOpen, setIsIrrigationOpen] = useState(false);

  const toggleSoil = () => {
    setIsSoilOpen(!isSoilOpen);
    setIsExposureOpen(false);
    setIsIrrigationOpen(false);
  };

  const toggleExposure = () => {
    setIsExposureOpen(!isExposureOpen);
    setIsSoilOpen(false);
    setIsIrrigationOpen(false);
  };

  const toggleIrrigation = () => {
    setIsIrrigationOpen(!isIrrigationOpen);
    setIsSoilOpen(false);
    setIsExposureOpen(false);
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.bgLight }]}>
      <StatusBar barStyle="light-content" backgroundColor={P.oliveGreen} />

      {/* TOP MAP AREA */}
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

            {/* Farm Boundary (Dashed Yellow) */}
            <Polygon
              points="70,140 340,110 360,260 330,340 80,350 60,250"
              fill="none"
              stroke={P.yellow500}
              strokeWidth="4"
              strokeDasharray="10,8"
            />

            {/* New Zone Drawing (Dashed with Selected Color) */}
            <Polygon
              points="80,180 300,160 310,280 90,300"
              fill="rgba(69, 39, 160, 0.4)"
              stroke={selectedColor}
              strokeWidth="3"
              strokeDasharray="8,6"
            />
            {/* Corner Markers */}
            <Circle cx="80" cy="180" r="10" fill={colors.white} stroke={selectedColor} strokeWidth="4" />
            <Circle cx="300" cy="160" r="10" fill={colors.white} stroke={selectedColor} strokeWidth="4" />
          </Svg>
        </View>

        {/* Floating Drawing Notice */}
        <View style={styles.drawingNotice}>
          <Icon name="place" size={16} color={colors.white} style={styles.drawingNoticeIcon} />
          <Text style={styles.drawingNoticeText}>Drawing new zone — tap on map to add corners</Text>
        </View>
      </View>

      {/* BOTTOM SHEET FORM */}
      <View style={styles.bottomSheet}>
        <View style={styles.dragHandle} />

        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.sheetHeader}>
            <Icon name="place" size={24} color={colors.brandGreen} style={styles.sheetHeaderIcon} />
            <View>
              <Text style={[styles.sheetTitle, { color: colors.textDark }]}>Name this zone</Text>
              <Text style={[styles.sheetSub, { color: colors.textSubtle }]}>Zone has 4 corners · 0.55 acres</Text>
            </View>
          </View>

          {/* Zone Name Input */}
          <Text style={[styles.inputLabel, { color: colors.textDark }]}>
            # Zone Name <Text style={{ color: P.red500 }}>*</Text>
          </Text>
          <View style={[styles.inputBox, { borderColor: colors.borderLight }]}>
            <TextInput
              style={[styles.inputField, { color: colors.textDark }]}
              value={zoneName}
              onChangeText={setZoneName}
              placeholder="Zone Name"
              placeholderTextColor={P.twGray400}
            />
          </View>

          {/* Zone Color Picker */}
          <View style={styles.inputLabelRow}>
            <Icon name="palette" size={14} color={colors.textDark} />
            <Text style={[styles.inputLabel, { color: colors.textDark, marginBottom: 0 }]}>
              {' '}Zone Color <Text style={{ color: P.red500 }}>*</Text>
            </Text>
          </View>
          <View style={styles.colorPickerRow}>
            {COLOR_PALETTE.map((item) => {
              const isSelected = selectedColor === item.color;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.colorCircleWrapper,
                    isSelected && { borderColor: item.color, borderWidth: 2.5 },
                  ]}
                  onPress={() => setSelectedColor(item.color)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.colorCircle, { backgroundColor: item.color }]}>
                    {isSelected && <Icon name="check" size={16} color={colors.white} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Dropdowns Row 1: Soil Type & Sun Exposure */}
          <View style={styles.dropdownRow}>
            {/* Soil Type */}
            <View style={styles.dropdownCol}>
              <View style={styles.inputLabelRow}>
                <Icon name="eco" size={14} color={colors.textDark} />
                <Text style={[styles.inputLabel, { color: colors.textDark, marginBottom: 0 }]}> Soil Type</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.dropdownBox,
                  { borderColor: isSoilOpen ? colors.brandGreen : colors.borderLight },
                ]}
                onPress={toggleSoil}
                activeOpacity={0.7}
              >
                <Text style={[styles.dropdownText, { color: colors.textDark }]}>{soilType}</Text>
                <Icon name={isSoilOpen ? 'expand_more' : 'expand_more'} size={16} color={colors.textSubtle} />
              </TouchableOpacity>

              {isSoilOpen && (
                <View style={[styles.dropdownDropdownList, { borderColor: colors.borderLight }]}>
                  {SOIL_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        styles.dropdownOptionItem,
                        soilType === opt && { backgroundColor: P.lightGreen50 },
                      ]}
                      onPress={() => {
                        setSoilType(opt);
                        setIsSoilOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownOptionText,
                          soilType === opt && { color: colors.brandGreen, fontWeight: '700' },
                        ]}
                      >
                        {opt}
                      </Text>
                      {soilType === opt && <Icon name="check" size={14} color={colors.brandGreen} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Sun Exposure */}
            <View style={styles.dropdownCol}>
              <View style={styles.inputLabelRow}>
                <Icon name="wb_sunny" size={14} color={colors.textDark} />
                <Text style={[styles.inputLabel, { color: colors.textDark, marginBottom: 0 }]}> Sun Exposure</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.dropdownBox,
                  { borderColor: isExposureOpen ? colors.brandGreen : colors.borderLight },
                ]}
                onPress={toggleExposure}
                activeOpacity={0.7}
              >
                <Text style={[styles.dropdownText, { color: colors.textDark }]}>{sunExposure}</Text>
                <Icon name={isExposureOpen ? 'expand_more' : 'expand_more'} size={16} color={colors.textSubtle} />
              </TouchableOpacity>

              {isExposureOpen && (
                <View style={[styles.dropdownDropdownList, { borderColor: colors.borderLight }]}>
                  {EXPOSURE_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        styles.dropdownOptionItem,
                        sunExposure === opt && { backgroundColor: P.lightGreen50 },
                      ]}
                      onPress={() => {
                        setSunExposure(opt);
                        setIsExposureOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownOptionText,
                          sunExposure === opt && { color: colors.brandGreen, fontWeight: '700' },
                        ]}
                      >
                        {opt}
                      </Text>
                      {sunExposure === opt && <Icon name="check" size={14} color={colors.brandGreen} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Dropdown Row 2: Irrigation Method */}
          <View style={{ marginBottom: 24 }}>
            <View style={styles.inputLabelRow}>
              <Icon name="water_drop" size={14} color={colors.textDark} />
              <Text style={[styles.inputLabel, { color: colors.textDark, marginBottom: 0 }]}> Irrigation Method</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.dropdownBox,
                { borderColor: isIrrigationOpen ? colors.brandGreen : colors.borderLight },
              ]}
              onPress={toggleIrrigation}
              activeOpacity={0.7}
            >
              <Text style={[styles.dropdownText, { color: colors.textDark }]}>{irrigationMethod}</Text>
              <Icon name={isIrrigationOpen ? 'expand_more' : 'expand_more'} size={16} color={colors.textSubtle} />
            </TouchableOpacity>

            {isIrrigationOpen && (
              <View style={[styles.dropdownDropdownList, { borderColor: colors.borderLight }]}>
                {IRRIGATION_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.dropdownOptionItem,
                      irrigationMethod === opt && { backgroundColor: P.lightGreen50 },
                    ]}
                    onPress={() => {
                      setIrrigationMethod(opt);
                      setIsIrrigationOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        irrigationMethod === opt && { color: colors.brandGreen, fontWeight: '700' },
                      ]}
                    >
                      {opt}
                    </Text>
                    {irrigationMethod === opt && <Icon name="check" size={14} color={colors.brandGreen} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* FOOTER */}
        <View style={[styles.footer, { borderTopColor: colors.borderDivider, backgroundColor: colors.bgLight }]}>
          <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.borderLight }]} onPress={onNavigateBack}>
            <Text style={[styles.cancelBtnText, { color: colors.textDark }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.saveBtn, styles.saveBtnRow, { backgroundColor: colors.brandGreen }]} onPress={onSave}>
            <Icon name="check" size={16} color={colors.white} style={styles.saveBtnIcon} />
            <Text style={styles.saveBtnText}>Save Zone</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  drawingNotice: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.teal800,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  drawingNoticeIcon: { marginRight: 8 },
  drawingNoticeText: { color: P.white, fontSize: 13, fontWeight: '700' },

  bottomSheet: {
    flex: 1.25,
    backgroundColor: P.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 16,
    overflow: 'hidden',
    marginTop: -24,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: P.grey300,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },

  contentScroll: { flex: 1 },
  contentContainer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 },

  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sheetHeaderIcon: { marginRight: 12 },
  sheetTitle: { fontSize: 18, fontWeight: '700', marginBottom: 2 },
  sheetSub: { fontSize: 12 },

  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputBox: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    justifyContent: 'center',
    marginBottom: 20,
  },
  inputField: { fontSize: 16, padding: 0 },

  colorPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  colorCircleWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  dropdownRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 16,
  },
  dropdownCol: { flex: 1 },
  dropdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    backgroundColor: colors.white,
  },
  dropdownText: { fontSize: 14, fontWeight: '500' },

  dropdownDropdownList: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 6,
    paddingVertical: 4,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  dropdownOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  dropdownOptionText: {
    fontSize: 13,
    color: colors.textDark,
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
  saveBtnText: { color: P.white, fontSize: 16, fontWeight: '700' },
});
