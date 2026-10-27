import React, { useState } from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import type { FarmerListItem } from './AdminAllFarmersScreen';

function BackArrowWhiteIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CalendarIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="1.8" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LockIcon({ size = 14, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="11" width="16" height="11" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UploadIcon({ size = 16, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

interface Props {
  farmer: FarmerListItem;
  initialTab?: any;
  onBack: () => void;
  onSave?: (updatedFarmer: FarmerListItem, activeTab?: any) => void;
  onNavigateToEditCategories?: () => void;
}

export const AdminEditFarmerScreen: React.FC<Props> = ({
  farmer,
  onBack,
  onSave,
}) => {
  // Personal information
  const [fullName, setFullName] = useState(farmer.name || 'Ramesh Kumar');
  const [mobileNumber, setMobileNumber] = useState('98765 00124');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('12 Apr 1982');
  const [gender, setGender] = useState('Male');

  // Address
  const [addressLine1, setAddressLine1] = useState('12 Hill Road');
  const [addressLine2, setAddressLine2] = useState('');
  const [village, setVillage] = useState('Coonoor');
  const [pinCode, setPinCode] = useState('643101');
  const [district, setDistrict] = useState('Nilgiris');

  // Zone & farm assignment
  const [zone, setZone] = useState('Coonoor');
  const [warehouse, setWarehouse] = useState('Sub Warehouse, Coonoor');
  const [farmingType, setFarmingType] = useState<'Organic' | 'Natural' | 'Conventional'>('Organic');

  // Farm details
  const [farmName, setFarmName] = useState(farmer.farmName || 'Ramesh Kumar Farm');
  const [totalArea, setTotalArea] = useState('4.25');

  // Plots
  const [plots, setPlots] = useState([
    {
      id: 'plt_1',
      title: 'Plot 1 · Zone A',
      meta: '2.25 acres · Rectangular · Tomato',
    },
    {
      id: 'plt_2',
      title: 'Plot 2 · Zone B',
      meta: '1.5 acres · Even · Carrot',
    },
  ]);

  const handleSave = () => {
    const updated: FarmerListItem = {
      ...farmer,
      name: fullName,
      farmName,
      location: `${village}, ${zone}`,
      mobile: `+91 ${mobileNumber}`,
    };
    if (onSave) {
      onSave(updated);
    }
    Alert.alert('Success', 'Farmer profile changes saved successfully.', [
      { text: 'OK', onPress: onBack },
    ]);
  };

  const handleDeletePlot = (plotId: string) => {
    Alert.alert('Delete Plot', 'Are you sure you want to remove this plot?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => setPlots((prev) => prev.filter((p) => p.id !== plotId)),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header: Edit Farmer Profile ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <BackArrowWhiteIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Farmer Profile</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── SECTION 1: Personal information ─── */}
        <Text style={styles.sectionHeading}>Personal information</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>
            Full name <Text style={styles.reqStar}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter full name"
            placeholderTextColor={adminColors.placeholder}
          />

          <Text style={styles.fieldLabel}>
            Mobile number <Text style={styles.reqStar}>*</Text>
          </Text>
          <View style={styles.phoneInputRow}>
            <View style={styles.phonePrefixBox}>
              <Text style={styles.phonePrefixText}>+91</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              value={mobileNumber}
              onChangeText={setMobileNumber}
              keyboardType="phone-pad"
              placeholder="98765 00000"
              placeholderTextColor={adminColors.placeholder}
            />
          </View>

          <Text style={styles.fieldLabel}>Email (optional)</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Not provided"
            placeholderTextColor={adminColors.placeholder}
            keyboardType="email-address"
          />

          <Text style={styles.fieldLabel}>Date of birth</Text>
          <View style={styles.pickerInputRow}>
            <Text style={styles.pickerInputText}>{dob}</Text>
            <CalendarIcon />
          </View>

          <Text style={styles.fieldLabel}>Gender</Text>
          <View style={styles.pickerInputRow}>
            <Text style={styles.pickerInputText}>{gender}</Text>
            <ChevronDownIcon />
          </View>
        </View>

        {/* ─── SECTION 2: Identity (locked) ─── */}
        <Text style={styles.sectionHeading}>Identity (locked)</Text>
        <View style={styles.lockedIdentityCard}>
          <View style={styles.lockedRow}>
            <Text style={styles.lockedLabel}>Farmer ID</Text>
            <View style={styles.lockedValueRow}>
              <Text style={styles.lockedValueText}>{farmer.code || 'FMR-00124'}</Text>
              <LockIcon />
            </View>
          </View>

          <View style={styles.lockedDivider} />

          <View style={styles.lockedRow}>
            <Text style={styles.lockedLabel}>Identity (Aadhaar)</Text>
            <View style={styles.lockedValueRow}>
              <Text style={styles.lockedValueText}>125378300124</Text>
              <LockIcon />
            </View>
          </View>
        </View>

        {/* ─── SECTION 3: Address ─── */}
        <Text style={styles.sectionHeading}>Address</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>
            Address line 1 <Text style={styles.reqStar}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={addressLine1}
            onChangeText={setAddressLine1}
            placeholder="Address line 1"
            placeholderTextColor={adminColors.placeholder}
          />

          <Text style={styles.fieldLabel}>Address line 2</Text>
          <TextInput
            style={styles.input}
            value={addressLine2}
            onChangeText={setAddressLine2}
            placeholder="Optional"
            placeholderTextColor={adminColors.placeholder}
          />

          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Village / Town</Text>
              <TextInput
                style={styles.input}
                value={village}
                onChangeText={setVillage}
                placeholder="Village / Town"
                placeholderTextColor={adminColors.placeholder}
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>PIN code</Text>
              <TextInput
                style={styles.input}
                value={pinCode}
                onChangeText={setPinCode}
                keyboardType="numeric"
                placeholder="643101"
                placeholderTextColor={adminColors.placeholder}
              />
            </View>
          </View>

          <Text style={styles.fieldLabel}>District</Text>
          <View style={styles.pickerInputRow}>
            <Text style={styles.pickerInputText}>{district}</Text>
            <ChevronDownIcon />
          </View>
        </View>

        {/* ─── SECTION 4: Zone & farm assignment ─── */}
        <Text style={styles.sectionHeading}>Zone & farm assignment</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>
            Zone <Text style={styles.reqStar}>*</Text>
          </Text>
          <View style={[styles.pickerInputRow, styles.zonePickerActive]}>
            <Text style={[styles.pickerInputText, { fontWeight: '700', color: adminColors.ink }]}>
              {zone}
            </Text>
            <ChevronDownIcon color={adminColors.brand} />
          </View>
          <Text style={styles.zoneHelperNote}>
            Changing the zone updates the farmer's reporting warehouse and audit coverage.
          </Text>

          <Text style={styles.fieldLabel}>Assigned warehouse</Text>
          <View style={styles.pickerInputRow}>
            <Text style={styles.pickerInputText}>{warehouse}</Text>
            <ChevronDownIcon />
          </View>

          <Text style={styles.fieldLabel}>Farming type</Text>
          <View style={styles.farmingTypeRow}>
            {(['Organic', 'Natural', 'Conventional'] as const).map((type) => {
              const isSelected = farmingType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.farmingTypePill, isSelected && styles.farmingTypePillSelected]}
                  onPress={() => setFarmingType(type)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.farmingTypePillText,
                      isSelected && styles.farmingTypePillTextSelected,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ─── SECTION 5: Farm details ─── */}
        <Text style={styles.sectionHeading}>Farm details</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Farm name</Text>
          <TextInput
            style={styles.input}
            value={farmName}
            onChangeText={setFarmName}
            placeholder="Farm name"
            placeholderTextColor={adminColors.placeholder}
          />

          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Total area</Text>
              <View style={styles.unitInputRow}>
                <TextInput
                  style={styles.unitInputField}
                  value={totalArea}
                  onChangeText={setTotalArea}
                  keyboardType="numeric"
                />
                <View style={styles.unitSuffixBox}>
                  <Text style={styles.unitSuffixText}>acres</Text>
                </View>
              </View>
            </View>

            <View style={[styles.col, { flex: 1.2 }]}>
              <Text style={styles.fieldLabel}>Plots recorded</Text>
              <View style={styles.readOnlyInputBox}>
                <Text style={styles.readOnlyInputText} numberOfLines={1}>
                  Edited in Farm & Land
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ─── SECTION 6: Farm FMB & zones on map ─── */}
        <Text style={styles.sectionHeading}>Farm FMB & zones on map</Text>
        <View style={styles.card}>
          {/* Map Preview Grid */}
          <View style={styles.mapContainer}>
            <Svg width="100%" height="150" viewBox="0 0 320 150">
              {/* Subtle background grid pattern */}
              <Rect width="320" height="150" fill="#F4EFE6" />
              {/* Plot 1: Green polygon */}
              <Rect
                x="80"
                y="30"
                width="110"
                height="55"
                rx="4"
                fill="rgba(34, 197, 94, 0.22)"
                stroke="#15803D"
                strokeWidth="2.5"
              />
              {/* Plot 2: Blue polygon */}
              <Rect
                x="160"
                y="65"
                width="80"
                height="45"
                rx="4"
                fill="rgba(59, 130, 246, 0.22)"
                stroke="#1E3A8A"
                strokeWidth="2.5"
              />
            </Svg>
            <View style={styles.mapTagPill}>
              <Text style={styles.mapTagPillText}>FMB map (demo)</Text>
            </View>
          </View>

          {/* Plots List */}
          <View style={styles.plotsListContainer}>
            {plots.map((plot, idx) => (
              <View key={plot.id}>
                {idx > 0 && <View style={styles.plotDivider} />}
                <View style={styles.plotItemRow}>
                  <View style={styles.plotInfoCol}>
                    <Text style={styles.plotTitleText}>{plot.title}</Text>
                    <Text style={styles.plotMetaText}>{plot.meta}</Text>
                  </View>
                  <View style={styles.plotActionsRow}>
                    <TouchableOpacity
                      onPress={() => Alert.alert('View Plot', `Viewing ${plot.title}`)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.plotActionText}>View</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => Alert.alert('Edit Plot', `Editing ${plot.title}`)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.plotActionText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeletePlot(plot.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.plotActionText, { color: '#D32F2F' }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addDashedBtn}
              onPress={() => Alert.alert('Add Plot', 'Open plot zone creation')}
              activeOpacity={0.8}
            >
              <Text style={styles.addDashedBtnText}>+ Add plot / zone</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── SECTION 7: Documents ─── */}
        <Text style={styles.sectionHeading}>Documents</Text>

        {/* Document 1: Identity proof (Aadhaar) */}
        <View style={styles.docCard}>
          <View style={styles.docHeaderRow}>
            <Text style={styles.docTitle}>Identity proof (Aadhaar)</Text>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedBadgeText}>Verified</Text>
            </View>
          </View>
          <Text style={styles.docSubtitle}>aadhaar_scan.pdf · Uploaded 2 Nov 2025</Text>
          <View style={styles.docButtonsRow}>
            <TouchableOpacity
              style={styles.docOutlineBtn}
              onPress={() => Alert.alert('Preview', 'Opening Aadhaar document preview')}
              activeOpacity={0.8}
            >
              <Text style={styles.docOutlineBtnText}>Preview</Text>
            </TouchableOpacity>
            <View style={[styles.docOutlineBtn, styles.docDisabledBtn]}>
              <Text style={styles.docDisabledBtnText}>Replace (locked)</Text>
            </View>
          </View>
        </View>

        {/* Document 2: Land ownership proof */}
        <View style={styles.docCard}>
          <View style={styles.docHeaderRow}>
            <Text style={styles.docTitle}>Land ownership proof</Text>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedBadgeText}>Verified</Text>
            </View>
          </View>
          <Text style={styles.docSubtitle}>land_ownership.pdf · Uploaded 2 Nov 2025</Text>
          <View style={styles.docButtonsRow}>
            <TouchableOpacity
              style={styles.docOutlineBtn}
              onPress={() => Alert.alert('Preview', 'Opening Land Ownership preview')}
              activeOpacity={0.8}
            >
              <Text style={styles.docOutlineBtnText}>Preview</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.docOutlineBtn, { borderColor: adminColors.brand }]}
              onPress={() => Alert.alert('Replace Document', 'Upload replacement land ownership proof')}
              activeOpacity={0.8}
            >
              <Text style={[styles.docOutlineBtnText, { color: adminColors.brand }]}>
                Replace Document
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Document 3: Farm certification (Needs correction) */}
        <View style={[styles.docCard, styles.docCardCorrection]}>
          <View style={styles.docHeaderRow}>
            <Text style={styles.docTitle}>Farm certification</Text>
            <View style={styles.needsCorrectionBadge}>
              <Text style={styles.needsCorrectionBadgeText}>Needs correction</Text>
            </View>
          </View>
          <Text style={styles.docSubtitle}>cert_copy.pdf · The certificate copy is not legible.</Text>
          <View style={styles.docButtonsRow}>
            <TouchableOpacity
              style={styles.docOutlineBtn}
              onPress={() => Alert.alert('Preview', 'Opening Farm Certification preview')}
              activeOpacity={0.8}
            >
              <Text style={styles.docOutlineBtnText}>Preview</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.docSolidBrandBtn}
              onPress={() => Alert.alert('Replace Document', 'Upload new farm certification document')}
              activeOpacity={0.8}
            >
              <Text style={styles.docSolidBrandBtnText}>Replace Document</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Add Another Document Button */}
        <TouchableOpacity
          style={styles.addDashedBtn}
          onPress={() => Alert.alert('Add Document', 'Upload additional document')}
          activeOpacity={0.8}
        >
          <View style={styles.addDocRow}>
            <UploadIcon />
            <Text style={[styles.addDashedBtnText, { marginLeft: 8 }]}>Add another document</Text>
          </View>
        </TouchableOpacity>

        {/* Disclaimer Note */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            Farmer ID and identity (Aadhaar) are locked and cannot be edited. A verified document is
            replaced, not edited in place; the previous version stays in history.
          </Text>
        </View>

        <View style={{ height: adminSpacing.xxxl + 80 }} />
      </ScrollView>

      {/* ─── Sticky Bottom Action Bar ─── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onBack} activeOpacity={0.8}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
          <Text style={styles.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ─── Stylesheet ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 6,
    paddingBottom: adminSpacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  backButton: {
    padding: 4,
    marginRight: 4,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontSize: 18,
    fontWeight: '800',
  },
  scroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xxxl + 60,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginTop: adminSpacing.lg,
    marginBottom: adminSpacing.sm,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.ink,
    marginTop: adminSpacing.sm,
    marginBottom: 6,
  },
  reqStar: {
    color: '#D32F2F',
    fontWeight: '800',
  },
  input: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 10,
    fontSize: 13,
    color: adminColors.ink,
  },
  phoneInputRow: {
    flexDirection: 'row',
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    overflow: 'hidden',
    backgroundColor: adminColors.card,
  },
  phonePrefixBox: {
    backgroundColor: '#F5EFEB',
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: adminColors.border,
  },
  phonePrefixText: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 10,
    fontSize: 13,
    color: adminColors.ink,
  },
  pickerInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 10,
  },
  pickerInputText: {
    fontSize: 13,
    color: adminColors.ink,
  },
  lockedIdentityCard: {
    backgroundColor: '#F7F3EE',
    borderWidth: 1,
    borderColor: '#DFCFC4',
    borderStyle: 'dashed',
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
  },
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  lockedLabel: {
    fontSize: 12.5,
    color: adminColors.muted,
  },
  lockedValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lockedValueText: {
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.ink,
  },
  lockedDivider: {
    height: 1,
    backgroundColor: '#EBE2D8',
    marginVertical: 4,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
  },
  col: {
    flex: 1,
  },
  zonePickerActive: {
    backgroundColor: '#FAF5EE',
    borderColor: adminColors.brand,
    borderWidth: 1.5,
  },
  zoneHelperNote: {
    fontSize: 11,
    color: adminColors.brand,
    marginTop: 6,
    lineHeight: 15,
  },
  farmingTypeRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    marginTop: 4,
  },
  farmingTypePill: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  farmingTypePillSelected: {
    backgroundColor: '#FDEEE3',
    borderColor: adminColors.brand,
    borderWidth: 1.5,
  },
  farmingTypePillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.ink,
  },
  farmingTypePillTextSelected: {
    color: adminColors.brandDeep,
    fontWeight: '800',
  },
  unitInputRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    overflow: 'hidden',
  },
  unitInputField: {
    flex: 1,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 10,
    fontSize: 13,
    color: adminColors.ink,
    backgroundColor: adminColors.card,
  },
  unitSuffixBox: {
    backgroundColor: '#F5EFEB',
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: adminColors.border,
  },
  unitSuffixText: {
    fontSize: 12,
    color: adminColors.muted,
  },
  readOnlyInputBox: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 11,
  },
  readOnlyInputText: {
    fontSize: 12.5,
    color: adminColors.muted,
  },
  mapContainer: {
    borderRadius: adminRadius.lg,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: adminSpacing.md,
  },
  mapTagPill: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  mapTagPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: adminColors.ink,
  },
  plotsListContainer: {
    gap: adminSpacing.sm,
  },
  plotItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  plotInfoCol: {
    flex: 1,
  },
  plotTitleText: {
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: 2,
  },
  plotMetaText: {
    fontSize: 11.5,
    color: adminColors.muted,
  },
  plotActionsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  plotActionText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  plotDivider: {
    height: 1,
    backgroundColor: '#F5F0EA',
    marginVertical: 4,
  },
  addDashedBtn: {
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderStyle: 'dashed',
    borderRadius: adminRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  addDashedBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.brand,
  },
  addDocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
    marginBottom: adminSpacing.sm,
  },
  docCardCorrection: {
    borderColor: '#EF4444',
    borderWidth: 1.2,
  },
  docHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  docTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.ink,
  },
  docSubtitle: {
    fontSize: 11.5,
    color: adminColors.muted,
    marginBottom: adminSpacing.md,
  },
  docButtonsRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
  },
  docOutlineBtn: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderWidth: 1.2,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docOutlineBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  docDisabledBtn: {
    backgroundColor: '#FAFAF9',
  },
  docDisabledBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: adminColors.muted,
  },
  docSolidBrandBtn: {
    flex: 1,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docSolidBrandBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  verifiedBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: adminRadius.full,
  },
  verifiedBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#2E7D32',
  },
  needsCorrectionBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: adminRadius.full,
  },
  needsCorrectionBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#B45309',
  },
  disclaimerBox: {
    backgroundColor: '#F5EFEB',
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    marginTop: adminSpacing.md,
  },
  disclaimerText: {
    fontSize: 11.5,
    color: adminColors.muted,
    lineHeight: 17,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: Platform.OS === 'ios' ? adminSpacing.xl : adminSpacing.md,
    flexDirection: 'row',
    gap: adminSpacing.md,
    ...adminShadow.lg,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderWidth: 1.2,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
});
