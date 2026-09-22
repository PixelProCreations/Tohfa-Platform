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
import Svg, { Path, Circle } from 'react-native-svg';
import { Icon } from '@tohfa/mobile-ui';
import { useTheme, colors, authPalette as P } from '../../theme';

interface FieldContextScreenProps {
  onNavigateBack: () => void;
  onNavigateToZones: () => void;
}

const AVAILABLE_WATER_SOURCES = [
  'Borewell',
  'Rainwater harvesting',
  'Open well',
  'Canal / River',
  'Pond / Lake',
  'Drip irrigation supply',
  'Municipal / Panchayat water',
  'Farm pond',
];

interface BoundaryOption {
  id: string;
  title: string;
  subtitle: string;
  iconType: 'crop_free' | 'arrow_downward' | 'forest' | 'arrow_upward' | 'fire' | 'paw' | 'warning';
  iconColor?: string;
  isWarning?: boolean;
}

const BOUNDARY_OPTIONS: BoundaryOption[] = [
  {
    id: 'stand_alone',
    title: 'Stand alone',
    subtitle: 'Farm is isolated with no adjacent farming activity',
    iconType: 'crop_free',
  },
  {
    id: 'lower_hill',
    title: 'Lower part of hill',
    subtitle: 'Located at the base or foothill area',
    iconType: 'arrow_downward',
  },
  {
    id: 'forest_boundaries',
    title: 'Forest boundaries',
    subtitle: 'Adjacent to forest land or reserve area',
    iconType: 'forest',
  },
  {
    id: 'upper_hill',
    title: 'Upper hill',
    subtitle: 'Located at higher elevation of hill',
    iconType: 'arrow_upward',
  },
  {
    id: 'forest_fire',
    title: 'Forest fire zone',
    subtitle: 'Falls within known forest fire vulnerability area',
    iconType: 'fire',
    iconColor: P.twAmber800,
  },
  {
    id: 'wildlife_zone',
    title: 'Wildlife zone',
    subtitle: 'Wildlife corridor or protected area proximity',
    iconType: 'paw',
    iconColor: P.twAmber800,
  },
  {
    id: 'chemical_sprayed',
    title: 'Sharing with chemical sprayed farm',
    subtitle: 'Adjacent farm uses chemical inputs',
    iconType: 'warning',
    iconColor: P.twAmber800,
    isWarning: true,
  },
];

/* Custom SVG Icons */
function ForestIcon({ size = 22, color = '#15803d' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6.5 4L2 11H4.5L1.5 17H7.5V20H9.5V17H11.5L8.5 11H11L6.5 4Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 7L12 13H14L11.5 18H17V20H19V18H22.5L20 13H22L16 7Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FireIcon({ size = 22, color = '#D97706' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C10.5 4.5 11 6.5 9 8.5C7.5 10 6 11.5 6 14.5C6 18.09 8.91 21 12.5 21C16.09 21 19 18.09 19 14.5C19 10.5 15.5 8 15 5C14.5 7.5 13 8.5 12 9.5C10.5 11 10.5 13 12 14.5C13 13.5 13.5 12.5 13.5 11.5C15 13 15 15.5 13.5 17C12 18.5 9.5 17.5 9.5 15C9.5 13 11 11.5 12 10.5V2Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PawIcon({ size = 22, color = '#B45309' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Circle cx="5" cy="9.5" r="2" />
      <Circle cx="9.5" cy="5.5" r="2" />
      <Circle cx="14.5" cy="5.5" r="2" />
      <Circle cx="19" cy="9.5" r="2" />
      <Path d="M12 11.5C8.8 11.5 7 14 7 16.5C7 19 9.2 21 12 21C14.8 21 17 19 17 16.5C17 14 15.2 11.5 12 11.5Z" />
    </Svg>
  );
}

export function FieldContextScreen({ onNavigateBack, onNavigateToZones }: FieldContextScreenProps) {
  const { colors } = useTheme();

  const [waterSources, setWaterSources] = useState<string[]>([
    'Borewell',
    'Rainwater harvesting',
  ]);
  const [isWaterDropdownOpen, setIsWaterDropdownOpen] = useState(false);

  const [selectedBoundaries, setSelectedBoundaries] = useState<string[]>([
    'stand_alone',
    'forest_boundaries',
    'chemical_sprayed',
  ]);

  const [farmNotes, setFarmNotes] = useState(
    'South-facing slope with natural drainage toward the eastern stream. Windbreak of silver oak along the northern edge.',
  );

  const toggleBoundary = (id: string) => {
    if (selectedBoundaries.includes(id)) {
      setSelectedBoundaries(selectedBoundaries.filter((item) => item !== id));
    } else {
      setSelectedBoundaries([...selectedBoundaries, id]);
    }
  };

  const handleSelectWaterSource = (source: string) => {
    if (!waterSources.includes(source)) {
      setWaterSources([...waterSources, source]);
    }
    setIsWaterDropdownOpen(false);
  };

  const handleRemoveWaterSource = (source: string) => {
    setWaterSources(waterSources.filter((s) => s !== source));
  };

  const renderOptionIcon = (option: BoundaryOption, isSelected: boolean) => {
    const iconColor = isSelected
      ? option.isWarning
        ? P.twAmber800
        : colors.brandGreen
      : option.iconColor || colors.textSubtle;

    switch (option.iconType) {
      case 'crop_free':
        return <Icon name="crop_free" size={20} color={iconColor} style={styles.cardOptionIcon} />;
      case 'arrow_downward':
        return <Icon name="arrow_downward" size={20} color={iconColor} style={styles.cardOptionIcon} />;
      case 'forest':
        return (
          <View style={styles.cardOptionIcon}>
            <ForestIcon size={20} color={iconColor} />
          </View>
        );
      case 'arrow_upward':
        return <Icon name="arrow_upward" size={20} color={iconColor} style={styles.cardOptionIcon} />;
      case 'fire':
        return (
          <View style={styles.cardOptionIcon}>
            <FireIcon size={20} color={iconColor} />
          </View>
        );
      case 'paw':
        return (
          <View style={styles.cardOptionIcon}>
            <PawIcon size={20} color={iconColor} />
          </View>
        );
      case 'warning':
        return <Icon name="warning" size={20} color={iconColor} style={styles.cardOptionIcon} />;
      default:
        return null;
    }
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
          <Text style={[styles.headerTitle, { color: colors.textDark }]}>Field Context</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSubtle }]}>Land boundary & water source</Text>
        </View>
      </View>

      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* INFO NOTICE */}
        <View style={styles.infoNoticeBox}>
          <Icon name="info" size={18} color={P.black} style={styles.infoNoticeIcon} />
          <Text style={styles.infoNoticeText}>
            This context helps TOHFA auditors assess organic-certification compliance. Water source and land boundaries determine buffer and audit requirements.
          </Text>
        </View>

        {/* WATER SOURCE SECTION */}
        <Text style={[styles.sectionTitle, { color: colors.textSubtle }]}>WATER SOURCE</Text>

        {/* DROPDOWN TRIGGER */}
        <TouchableOpacity
          style={[
            styles.dropdownBtn,
            {
              borderColor: isWaterDropdownOpen ? colors.brandGreen : colors.borderLight,
              backgroundColor: colors.white,
            },
          ]}
          onPress={() => setIsWaterDropdownOpen(!isWaterDropdownOpen)}
          activeOpacity={0.7}
        >
          <Text style={[styles.dropdownBtnText, { color: colors.textSubtle }]}>+ Add a water source</Text>
          <Icon
            name={isWaterDropdownOpen ? 'expand_more' : 'expand_more'}
            size={18}
            color={colors.textSubtle}
          />
        </TouchableOpacity>

        {/* DROPDOWN MENU */}
        {isWaterDropdownOpen && (
          <View style={[styles.dropdownMenu, { borderColor: colors.borderLight }]}>
            {AVAILABLE_WATER_SOURCES.map((source) => {
              const isSelected = waterSources.includes(source);
              return (
                <TouchableOpacity
                  key={source}
                  style={[
                    styles.dropdownMenuItem,
                    isSelected && { backgroundColor: P.lightGreen50 },
                  ]}
                  onPress={() => handleSelectWaterSource(source)}
                >
                  <View style={styles.dropdownMenuItemLeft}>
                    <Icon
                      name="water_drop"
                      size={16}
                      color={isSelected ? colors.brandGreen : colors.textSubtle}
                    />
                    <Text
                      style={[
                        styles.dropdownMenuItemText,
                        {
                          color: isSelected ? colors.brandGreen : colors.textDark,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {source}
                    </Text>
                  </View>
                  {isSelected ? (
                    <Icon name="check" size={16} color={colors.brandGreen} />
                  ) : (
                    <Icon name="add" size={16} color={colors.textSubtle} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ACTIVE PILLS */}
        <View style={styles.pillsRow}>
          {waterSources.map((source) => (
            <View
              key={source}
              style={[
                styles.pill,
                {
                  borderColor: colors.brandGreen,
                  backgroundColor: colors.brandGreenLight,
                },
              ]}
            >
              <View style={styles.pillTextRow}>
                <Icon name="water_drop" size={14} color={colors.brandGreen} style={styles.pillIcon} />
                <Text style={[styles.pillText, { color: colors.brandGreen }]}>{source}</Text>
              </View>
              <TouchableOpacity
                style={styles.pillClose}
                onPress={() => handleRemoveWaterSource(source)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon name="close" size={14} color={colors.brandGreen} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* WATER TDS */}
        <View style={styles.tdsHeaderRow}>
          <View style={styles.tdsLabelRow}>
            <Icon name="science" size={14} color={P.blueGrey700} style={styles.tdsLabelIcon} />
            <Text style={styles.tdsLabel}>Water TDS</Text>
          </View>
          <View style={styles.tdsLockedBadge}>
            <View style={styles.tdsLockedBadgeRow}>
              <Icon name="lock" size={11} color={P.brown400} style={styles.tdsLockedBadgeIcon} />
              <Text style={styles.tdsLockedBadgeText}>From soil test</Text>
            </View>
          </View>
        </View>

        <View style={styles.tdsInputRow}>
          <View style={[styles.tdsInputContainer, { backgroundColor: P.grey100 }]}>
            <TextInput
              style={[styles.tdsInput, { color: colors.textSubtle }]}
              value="312"
              editable={false}
            />
          </View>
          <View style={[styles.tdsUnitContainer, { backgroundColor: P.grey100 }]}>
            <Text style={[styles.tdsUnit, { color: colors.textDark }]}>ppm</Text>
          </View>
        </View>

        {/* LAND BOUNDARIES SECTION */}
        <Text style={[styles.sectionTitle, { color: colors.textSubtle, marginTop: 24 }]}>LAND BOUNDARIES</Text>

        {BOUNDARY_OPTIONS.map((option) => {
          const isSelected = selectedBoundaries.includes(option.id);

          return (
            <React.Fragment key={option.id}>
              <TouchableOpacity
                style={[
                  styles.cardOption,
                  isSelected &&
                    (option.isWarning
                      ? styles.cardOptionWarningActive
                      : styles.cardOptionActive),
                  isSelected && {
                    borderColor: option.isWarning ? P.amber600 : colors.brandGreen,
                    backgroundColor: option.isWarning ? P.amber50 : P.lightGreen50,
                  },
                ]}
                onPress={() => toggleBoundary(option.id)}
                activeOpacity={0.7}
              >
                <View style={styles.cardOptionLeft}>
                  {renderOptionIcon(option, isSelected)}
                  <View style={styles.cardOptionTextCol}>
                    <Text style={[styles.cardOptionTitle, { color: colors.textDark }]}>
                      {option.title}
                    </Text>
                    <Text style={[styles.cardOptionSub, { color: colors.textSubtle }]}>
                      {option.subtitle}
                    </Text>
                  </View>
                </View>

                {isSelected ? (
                  <View
                    style={[
                      styles.cardOptionCheck,
                      {
                        backgroundColor: option.isWarning ? P.amber600 : colors.brandGreen,
                      },
                    ]}
                  >
                    <Icon name="check" size={14} color={colors.white} />
                  </View>
                ) : (
                  <View style={[styles.cardOptionCircle, { borderColor: colors.borderLight }]} />
                )}
              </TouchableOpacity>

              {/* BUFFER ZONE WARNING BOX */}
              {option.id === 'chemical_sprayed' && isSelected && (
                <View style={styles.bufferWarningBox}>
                  <View style={styles.bufferWarningHeader}>
                    <Icon name="error" size={18} color={P.red600} style={styles.bufferWarningIcon} />
                    <Text style={styles.bufferWarningTitle}>
                      Buffer zone documentation required
                    </Text>
                  </View>
                  <Text style={styles.bufferWarningText}>
                    A minimum 30 ft buffer must be documented and uploaded in the Audit section, or organic certification renewal may fail.
                  </Text>
                </View>
              )}
            </React.Fragment>
          );
        })}

        {/* FARM LAYOUT NOTES SECTION */}
        <Text style={[styles.sectionTitle, { color: colors.textSubtle, marginTop: 24 }]}>
          FARM LAYOUT NOTES
        </Text>

        <View style={styles.notesLabelRow}>
          <Icon name="description" size={16} color={P.blueGrey700} style={styles.notesLabelIcon} />
          <Text style={styles.notesLabel}>Additional Context</Text>
        </View>

        <View style={[styles.notesInputContainer, { borderColor: colors.borderLight }]}>
          <TextInput
            style={[styles.notesInput, { color: colors.textDark }]}
            multiline
            numberOfLines={4}
            maxLength={500}
            value={farmNotes}
            onChangeText={setFarmNotes}
            placeholder="Add any specific context about your farm terrain, slopes, windbreaks, or surrounding area..."
            placeholderTextColor={P.twGray400}
            textAlignVertical="top"
          />
          <Text style={[styles.charCountText, { color: colors.textSubtle }]}>
            {farmNotes.length} / 500
          </Text>
        </View>

      </ScrollView>

      {/* FOOTER */}
      <View style={[styles.footer, { borderTopColor: colors.borderDivider, backgroundColor: colors.bgLight }]}>
        <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.borderLight }]} onPress={onNavigateBack}>
          <Text style={[styles.cancelBtnText, { color: colors.textDark }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.brandGreen }]} onPress={onNavigateToZones}>
          <View style={styles.saveBtnRow}>
            <Icon name="check" size={16} color={colors.white} style={styles.saveBtnIcon} />
            <Text style={styles.saveBtnText}>Save</Text>
          </View>
        </TouchableOpacity>
      </View>
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

  contentScroll: { flex: 1 },
  contentContainer: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },

  infoNoticeBox: {
    flexDirection: 'row',
    backgroundColor: P.coolTintBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoNoticeIcon: { marginRight: 12, marginTop: 2 },
  infoNoticeText: { flex: 1, fontSize: 13, color: P.darkSlateText, lineHeight: 20 },

  sectionTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5, marginBottom: 12 },

  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
  },
  dropdownBtnText: { fontSize: 15, fontWeight: '500' },

  dropdownMenu: {
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
  dropdownMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownMenuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dropdownMenuItemText: {
    fontSize: 14,
  },

  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  pillTextRow: { flexDirection: 'row', alignItems: 'center', marginRight: 8 },
  pillIcon: { marginRight: 4 },
  pillText: { fontSize: 14, fontWeight: '700' },
  pillClose: { paddingHorizontal: 4 },

  tdsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tdsLabelRow: { flexDirection: 'row', alignItems: 'center', marginRight: 12 },
  tdsLabelIcon: { marginRight: 4 },
  tdsLabel: { fontSize: 14, fontWeight: '700', color: P.blueGrey700 },
  tdsLockedBadge: {
    backgroundColor: P.blushBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tdsLockedBadgeRow: { flexDirection: 'row', alignItems: 'center' },
  tdsLockedBadgeIcon: { marginRight: 4 },
  tdsLockedBadgeText: { fontSize: 11, fontWeight: '700', color: P.brown400 },

  tdsInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  tdsInputContainer: {
    flex: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    justifyContent: 'center',
  },
  tdsInput: { fontSize: 16, fontWeight: '600', padding: 0 },
  tdsUnitContainer: {
    flex: 1,
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tdsUnit: { fontSize: 15, fontWeight: '700' },

  cardOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    backgroundColor: colors.white,
  },
  cardOptionActive: {
    borderWidth: 1.5,
  },
  cardOptionWarningActive: {
    borderWidth: 1.5,
  },
  cardOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardOptionIcon: {
    marginRight: 14,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardOptionTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  cardOptionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },
  cardOptionSub: {
    fontSize: 12,
    lineHeight: 17,
  },
  cardOptionCheck: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardOptionCircle: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
  },

  /* BUFFER WARNING BOX */
  bufferWarningBox: {
    backgroundColor: P.red50,
    borderWidth: 1,
    borderColor: P.twRed200,
    borderRadius: 12,
    padding: 16,
    marginTop: -2,
    marginBottom: 12,
  },
  bufferWarningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  bufferWarningIcon: {
    marginRight: 8,
  },
  bufferWarningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: P.red700,
    flex: 1,
  },
  bufferWarningText: {
    fontSize: 12,
    color: P.red700,
    lineHeight: 18,
  },

  /* FARM LAYOUT NOTES */
  notesLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  notesLabelIcon: {
    marginRight: 6,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: P.blueGrey700,
  },
  notesInputContainer: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  notesInput: {
    fontSize: 14,
    lineHeight: 20,
    minHeight: 80,
    padding: 0,
  },
  charCountText: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 8,
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
