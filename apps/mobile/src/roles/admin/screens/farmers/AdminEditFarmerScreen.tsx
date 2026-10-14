import React, { useState } from 'react';
import {
  Alert,
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
import { Icon } from '@tohfa/mobile-ui';
import type { FarmerListItem } from './AdminAllFarmersScreen';
import type { FarmerDetailTabType } from './AdminFarmerDetailScreen';

const P = {
  bg: '#FAF8F5',
  cardBg: '#FFFFFF',
  cardBorder: '#F2ECE4',
  ink: '#1A1412',
  titleBrown: '#662208',
  subtitle: '#827871',
  orange: '#F0562A',
  orangeBg: '#FFECE8',
  textSecondary: '#6B6560',
  inputBorder: '#E0DDD7',
  inputBg: '#FFFFFF',
  greenBg: '#E8F5E9',
  greenText: '#2E7D32',
  redBg: '#FFEBEE',
  redText: '#D32F2F',
  amberBg: '#FFF3E0',
  amberText: '#B25E00',
  tabActiveBg: '#F0562A',
  tabActiveText: '#FFFFFF',
  tabInactiveText: '#4A443F',
  tabContainerBorder: '#F0ECE6',
};

interface Props {
  farmer: FarmerListItem;
  initialTab?: FarmerDetailTabType;
  onBack: () => void;
  onSave?: (updatedFarmer: FarmerListItem, activeTab: FarmerDetailTabType) => void;
  onNavigateToEditCategories?: () => void;
}

export const AdminEditFarmerScreen: React.FC<Props> = ({
  farmer,
  initialTab = 'Overview',
  onBack,
  onSave,
  onNavigateToEditCategories,
}) => {
  const activeTab = initialTab;

  // Overview fields
  const [name, setName] = useState(farmer.name);
  const [code, setCode] = useState(farmer.code);
  const [farmName, setFarmName] = useState(farmer.farmName ?? 'Wild Eden Organic Farms');
  const [location, setLocation] = useState(farmer.location);
  const [mobile, setMobile] = useState(farmer.mobile ?? '+91 98XXX XX891');
  const [aadhaar, setAadhaar] = useState(farmer.aadhaar ?? 'XXXX XXXX 3390');
  const [status, setStatus] = useState<'ACTIVE' | 'DISABLED'>(farmer.status);

  // Farm fields
  const [farmSize, setFarmSize] = useState(farmer.farmSize ?? '2.8 acres');
  const [fmbZones, setFmbZones] = useState(farmer.fmbZones ?? '4 zones marked');
  const [primaryCrops, setPrimaryCrops] = useState(farmer.primaryCrops ?? 'Potato, Garlic, Nilgiris Carrots');
  const [soilType, setSoilType] = useState(farmer.soilType ?? 'Red Humus Loam (High Organic Matter)');
  const [irrigation, setIrrigation] = useState(farmer.irrigation ?? 'Micro-Drip & Rainwater Harvesting Pit');

  // KYC fields
  const [aadhaarStatus, setAadhaarStatus] = useState<'Verified' | 'Pending' | 'Uploaded'>(farmer.aadhaarStatus ?? 'Verified');
  const [pattaStatus, setPattaStatus] = useState<'Verified' | 'Pending' | 'Uploaded'>(farmer.pattaStatus ?? 'Verified');
  const [passbookStatus, setPassbookStatus] = useState<'Verified' | 'Pending' | 'Uploaded'>(farmer.passbookStatus ?? 'Verified');
  const [certStatus, setCertStatus] = useState<'Verified' | 'Pending' | 'Expired'>(farmer.certStatus ?? 'Verified');
  const [kycNotes, setKycNotes] = useState(farmer.kycNotes ?? 'Identity and patta verified against Tamil Nadu Revenue Land Records.');

  // Ratings fields
  const [ratingScore, setRatingScore] = useState(String(farmer.rating ?? 718));
  const [ratingTier, setRatingTier] = useState(farmer.ratingTier ?? 'Good');

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'Farm':
        return 'Edit Farm Details';
      case 'KYC':
        return 'Edit KYC Documents';
      case 'Ratings':
        return 'Edit Ratings';
      case 'Overview':
      default:
        return 'Edit Overview';
    }
  };

  const handleSave = () => {
    const updated: FarmerListItem = {
      ...farmer,
      name,
      code,
      farmName,
      location,
      mobile,
      aadhaar,
      status,
      farmSize,
      fmbZones,
      primaryCrops,
      soilType,
      irrigation,
      aadhaarStatus,
      pattaStatus,
      passbookStatus,
      certStatus,
      kycNotes,
      rating: parseInt(ratingScore, 10) || farmer.rating,
      ratingTier,
    };
    if (onSave) {
      onSave(updated, activeTab);
    } else {
      onBack();
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={P.bg} />

      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 19L8 12L15 5"
              stroke="#2B2523"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>

        <TouchableOpacity style={styles.saveHeaderBtn} onPress={handleSave} activeOpacity={0.8}>
          <Text style={styles.saveHeaderBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* OVERVIEW TAB */}
        {activeTab === 'Overview' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Farmer Identity & Profile</Text>

            <Text style={styles.fieldLabel}>Farmer Full Name</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Ramasamy S."
            />

            <Text style={styles.fieldLabel}>Farmer Code / ID</Text>
            <TextInput
              style={styles.textInput}
              value={code}
              onChangeText={setCode}
              placeholder="#TOHFA-F-00189"
            />

            <Text style={styles.fieldLabel}>Estate / Farm Name</Text>
            <TextInput
              style={styles.textInput}
              value={farmName}
              onChangeText={setFarmName}
              placeholder="Wild Eden Organic Farms"
            />

            <Text style={styles.fieldLabel}>Hill District Location</Text>
            <TextInput
              style={styles.textInput}
              value={location}
              onChangeText={setLocation}
              placeholder="Ooty / Kotagiri / Coonoor"
            />

            <Text style={styles.fieldLabel}>Contact Mobile Number</Text>
            <TextInput
              style={styles.textInput}
              value={mobile}
              onChangeText={setMobile}
              keyboardType="phone-pad"
            />

            <Text style={styles.fieldLabel}>Aadhaar Card Reference</Text>
            <TextInput
              style={styles.textInput}
              value={aadhaar}
              onChangeText={setAadhaar}
            />

            <Text style={styles.fieldLabel}>Account Status</Text>
            <View style={styles.statusToggleRow}>
              <TouchableOpacity
                style={[styles.statusToggleBtn, status === 'ACTIVE' && styles.statusToggleActiveGreen]}
                onPress={() => setStatus('ACTIVE')}
              >
                <Text style={[styles.statusToggleText, status === 'ACTIVE' && styles.statusToggleTextActive]}>
                  ✓ Active Account
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusToggleBtn, status === 'DISABLED' && styles.statusToggleActiveRed]}
                onPress={() => setStatus('DISABLED')}
              >
                <Text style={[styles.statusToggleText, status === 'DISABLED' && styles.statusToggleTextActive]}>
                  ✕ Disabled / Suspended
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* FARM TAB */}
        {activeTab === 'Farm' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Agricultural Land & Crops</Text>

            <Text style={styles.fieldLabel}>Total Farm Size (Acres / Cents)</Text>
            <TextInput
              style={styles.textInput}
              value={farmSize}
              onChangeText={setFarmSize}
              placeholder="2.8 acres"
            />

            <Text style={styles.fieldLabel}>FMB Survey Zones Count</Text>
            <TextInput
              style={styles.textInput}
              value={fmbZones}
              onChangeText={setFmbZones}
              placeholder="4 zones marked"
            />

            <Text style={styles.fieldLabel}>Primary Hill Crops</Text>
            <TextInput
              style={styles.textInput}
              value={primaryCrops}
              onChangeText={setPrimaryCrops}
              placeholder="Potato, Garlic, Hill Carrots"
            />

            <Text style={styles.fieldLabel}>Soil Health Classification</Text>
            <TextInput
              style={styles.textInput}
              value={soilType}
              onChangeText={setSoilType}
              placeholder="Red Humus Loam"
            />

            <Text style={styles.fieldLabel}>Irrigation Infrastructure</Text>
            <TextInput
              style={styles.textInput}
              value={irrigation}
              onChangeText={setIrrigation}
              placeholder="Micro-Drip & Rainwater Harvesting"
            />
          </View>
        )}

        {/* KYC TAB */}
        {activeTab === 'KYC' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>KYC & Document Verification</Text>

            <Text style={styles.fieldLabel}>Aadhaar Card Status</Text>
            <View style={styles.pillRow}>
              {(['Verified', 'Uploaded', 'Pending'] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.pillOption, aadhaarStatus === s && styles.pillOptionActive]}
                  onPress={() => setAadhaarStatus(s)}
                >
                  <Text style={[styles.pillOptionText, aadhaarStatus === s && styles.pillOptionTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Land Ownership Patta / Chitta</Text>
            <View style={styles.pillRow}>
              {(['Verified', 'Uploaded', 'Pending'] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.pillOption, pattaStatus === s && styles.pillOptionActive]}
                  onPress={() => setPattaStatus(s)}
                >
                  <Text style={[styles.pillOptionText, pattaStatus === s && styles.pillOptionTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Bank Account Passbook / Cancelled Cheque</Text>
            <View style={styles.pillRow}>
              {(['Verified', 'Uploaded', 'Pending'] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.pillOption, passbookStatus === s && styles.pillOptionActive]}
                  onPress={() => setPassbookStatus(s)}
                >
                  <Text style={[styles.pillOptionText, passbookStatus === s && styles.pillOptionTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>PGS / Organic Certification</Text>
            <View style={styles.pillRow}>
              {(['Verified', 'Pending', 'Expired'] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.pillOption, certStatus === s && styles.pillOptionActive]}
                  onPress={() => setCertStatus(s)}
                >
                  <Text style={[styles.pillOptionText, certStatus === s && styles.pillOptionTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>KYC Officer Verification Notes</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={kycNotes}
              onChangeText={setKycNotes}
              multiline
              numberOfLines={3}
            />
          </View>
        )}

        {/* RATINGS TAB */}
        {activeTab === 'Ratings' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Compliance & Rating Standing</Text>

            <Text style={styles.fieldLabel}>Total Compliance Score (out of 1000)</Text>
            <TextInput
              style={styles.textInput}
              value={ratingScore}
              onChangeText={(val) => {
                setRatingScore(val);
                const n = parseInt(val, 10);
                if (n >= 750) setRatingTier('Excellent');
                else if (n >= 700) setRatingTier('Good');
                else if (n >= 650) setRatingTier('Moderate');
                else setRatingTier('Poor');
              }}
              keyboardType="numeric"
            />

            <Text style={styles.fieldLabel}>Compliance Tier</Text>
            <View style={styles.pillRow}>
              {(['Excellent', 'Good', 'Moderate', 'Poor'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.pillOption, ratingTier === t && styles.pillOptionActive]}
                  onPress={() => setRatingTier(t)}
                >
                  <Text style={[styles.pillOptionText, ratingTier === t && styles.pillOptionTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {onNavigateToEditCategories ? (
              <TouchableOpacity
                style={styles.editCategoriesCardBtn}
                onPress={onNavigateToEditCategories}
                activeOpacity={0.85}
              >
                <Icon name="edit" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.editCategoriesCardBtnText}>Edit All 10 Category Scores</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        {/* Bottom Save Action Button */}
        <TouchableOpacity style={styles.saveBottomBtn} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveBottomBtnText}>
            Save {activeTab === 'KYC' ? 'KYC Documents' : activeTab === 'Farm' ? 'Farm Details' : activeTab === 'Ratings' ? 'Rating Details' : 'Overview Details'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: P.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EFE7DE',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: P.titleBrown,
  },
  saveHeaderBtn: {
    backgroundColor: P.orange,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
  },
  saveHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: P.tabContainerBorder,
    marginBottom: 14,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: P.tabActiveBg,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: P.tabInactiveText,
  },
  tabTextActive: {
    color: P.tabActiveText,
    fontWeight: '700',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  sectionCard: {
    backgroundColor: P.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.cardBorder,
    padding: 18,
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: P.titleBrown,
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: P.subtitle,
    marginTop: 12,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: P.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14.5,
    color: P.ink,
  },
  textArea: {
    minHeight: 76,
    textAlignVertical: 'top',
  },
  statusToggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  statusToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.inputBorder,
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
  },
  statusToggleActiveGreen: {
    backgroundColor: P.greenBg,
    borderColor: P.greenText,
  },
  statusToggleActiveRed: {
    backgroundColor: P.redBg,
    borderColor: P.redText,
  },
  statusToggleText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: P.subtitle,
  },
  statusToggleTextActive: {
    fontWeight: '700',
    color: P.ink,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  pillOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: P.inputBorder,
    backgroundColor: '#FAF8F5',
  },
  pillOptionActive: {
    backgroundColor: P.orangeBg,
    borderColor: P.orange,
  },
  pillOptionText: {
    fontSize: 12.5,
    color: P.subtitle,
    fontWeight: '600',
  },
  pillOptionTextActive: {
    color: P.orange,
    fontWeight: '700',
  },
  editCategoriesCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.orange,
    borderRadius: 12,
    paddingVertical: 13,
    marginTop: 18,
  },
  editCategoriesCardBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  saveBottomBtn: {
    backgroundColor: P.orange,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  saveBottomBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
