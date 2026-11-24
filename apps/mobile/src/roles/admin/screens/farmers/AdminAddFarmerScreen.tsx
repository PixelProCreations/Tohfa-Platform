/**
 * Add Farmer Screen: Admin creates a new verified farmer directly (BR-108).
 * Posts to POST /v1/admin/farmers via useCreateFarmer().
 */
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, ScreenStatusBar } from '@tohfa/mobile-ui';
import { useCreateFarmer } from '../../api/farmerHooks';
import type { AdminFarmerDetailDto } from '../../api/farmers';
import { BackArrowWhiteIcon } from '../../components/AdminIcons';
import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';

export interface AdminAddFarmerScreenProps {
  onBack: () => void;
  onCreated?: (farmer: AdminFarmerDetailDto) => void;
}

const CANONICAL_ZONES = [
  { id: '20000000-0000-4000-8000-000000000001', code: 'ZONE-COON', name: 'Coonoor' },
  { id: '20000000-0000-4000-8000-000000000002', code: 'ZONE-OOTY', name: 'Ooty' },
  { id: '20000000-0000-4000-8000-000000000003', code: 'ZONE-KOTA', name: 'Kotagiri' },
];

export function AdminAddFarmerScreen({ onBack, onCreated }: AdminAddFarmerScreenProps) {
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('+91');
  const [selectedZoneId, setSelectedZoneId] = useState(CANONICAL_ZONES[0]!.id);
  const [village, setVillage] = useState('');
  const [taluk, setTaluk] = useState('Coonoor');
  const [experienceYears, setExperienceYears] = useState('5');
  const [addressLine1, setAddressLine1] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const create = useCreateFarmer();

  const handleSubmit = () => {
    setErrorMessage(null);
    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMessage('Full name is required (min 2 characters).');
      return;
    }
    const cleanMobile = mobile.trim();
    if (!/^\+91[6-9]\d{9}$/.test(cleanMobile)) {
      setErrorMessage('Valid 10-digit Indian mobile number required (+91XXXXXXXXXX).');
      return;
    }
    if (!village.trim()) {
      setErrorMessage('Village name is required.');
      return;
    }

    create.run(
      {
        fullName: fullName.trim(),
        mobile: cleanMobile,
        zoneId: selectedZoneId,
        village: village.trim(),
        taluk: taluk.trim() || undefined,
        district: 'The Nilgiris',
        farmingExperienceYears: parseInt(experienceYears, 10) || undefined,
        addressLine1: addressLine1.trim() || undefined,
      },
      (result) => {
        Alert.alert('Success', `Farmer ${result.fullName} (${result.tohfaFarmerId}) created successfully.`);
        onCreated?.(result);
      },
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <BackArrowWhiteIcon size={20} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Add New Farmer
        </Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Personal &amp; Contact Details</Text>

            <Text style={styles.fieldLabel}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Subramaniam Pillai"
              placeholderTextColor={adminColors.placeholder}
              value={fullName}
              onChangeText={setFullName}
            />

            <Text style={styles.fieldLabel}>Mobile Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="+9198XXXXXXXX"
              placeholderTextColor={adminColors.placeholder}
              keyboardType="phone-pad"
              value={mobile}
              onChangeText={setMobile}
            />

            <Text style={styles.fieldLabel}>Zone *</Text>
            <View style={styles.zoneRow}>
              {CANONICAL_ZONES.map((zone) => {
                const isSelected = zone.id === selectedZoneId;
                return (
                  <TouchableOpacity
                    key={zone.id}
                    style={[styles.zoneChip, isSelected && styles.zoneChipActive]}
                    onPress={() => setSelectedZoneId(zone.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.zoneChipText, isSelected && styles.zoneChipTextActive]}>
                      {zone.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>Village *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Ketti Valley"
              placeholderTextColor={adminColors.placeholder}
              value={village}
              onChangeText={setVillage}
            />

            <Text style={styles.fieldLabel}>Taluk</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Coonoor"
              placeholderTextColor={adminColors.placeholder}
              value={taluk}
              onChangeText={setTaluk}
            />

            <Text style={styles.fieldLabel}>Farming Experience (Years)</Text>
            <TextInput
              style={styles.input}
              placeholder="5"
              placeholderTextColor={adminColors.placeholder}
              keyboardType="number-pad"
              value={experienceYears}
              onChangeText={setExperienceYears}
            />

            <Text style={styles.fieldLabel}>Address Line</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Street or locality"
              placeholderTextColor={adminColors.placeholder}
              multiline
              numberOfLines={2}
              value={addressLine1}
              onChangeText={setAddressLine1}
            />

            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
            {create.error ? <Text style={styles.errorText}>Failed to create farmer account. Please try again.</Text> : null}

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={create.isPending}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <Text style={styles.submitButtonText}>
                  {create.isPending ? 'Creating Farmer...' : 'Create Farmer Account'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onBack}
                disabled={create.isPending}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: adminColors.brand,
  },
  flex: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: adminSpacing.md,
    backgroundColor: adminColors.brand,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  headerRightSpacer: {
    width: 36,
  },
  scrollContent: {
    padding: adminSpacing.md,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    padding: adminSpacing.lg,
    ...adminShadow.sm,
  },
  sectionTitle: {
    ...adminType.sectionHead,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: adminSpacing.md,
  },
  fieldLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    fontWeight: '600',
    marginTop: adminSpacing.sm,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.sm,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 10,
    fontSize: 14,
    color: adminColors.ink,
    backgroundColor: adminColors.canvas,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  zoneRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.xs,
  },
  zoneChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    backgroundColor: adminColors.canvas,
  },
  zoneChipActive: {
    borderColor: adminColors.brand,
    backgroundColor: adminColors.brandTint,
  },
  zoneChipText: {
    ...adminType.caption,
    color: adminColors.muted,
    fontWeight: '600',
  },
  zoneChipTextActive: {
    color: adminColors.brand,
    fontWeight: '700',
  },
  errorText: {
    ...adminType.caption,
    color: adminColors.danger.text,
    marginTop: adminSpacing.md,
  },
  buttonRow: {
    marginTop: adminSpacing.xl,
    gap: adminSpacing.sm,
  },
  submitButton: {
    backgroundColor: adminColors.brand,
    paddingVertical: 14,
    borderRadius: adminRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    ...adminType.body,
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...adminType.body,
    color: adminColors.muted,
  },
});
