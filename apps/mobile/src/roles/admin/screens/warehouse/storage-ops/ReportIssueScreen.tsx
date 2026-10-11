import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { adminColors, adminRadius, adminSpacing } from '../../../theme';
import {
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { ChevronDownIcon, SendIcon } from './StorageParts';
import type { IssueSeverity, ReportIssueMode, WarehouseScreenBaseProps } from './types';

function CameraIcon({ size = 22, color = '#64748B' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function InfoCircleIcon({ size = 18, color = '#0284C7' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Path d="M12 8h.01M12 11v5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

const ISSUE_TYPES = [
  'Equipment Breakdown',
  'Facility Damage',
  'Temperature Alert',
  'Cleanliness / Safety',
  'Crate / Pallet Shortage',
  'Other Issue',
];

const LOCATIONS = [
  'Cold Storage · Section A',
  'Cold Storage · Section B',
  'Dry Storage · Section C',
  'Loading Dock / Staging Area',
  'Sorting Line',
];

export interface ReportIssueSubmission {
  mode: ReportIssueMode;
  category: string;
  specificIssue: string;
  subject: string;
  description: string;
  referenceId?: string | undefined;
  attachmentName?: string | undefined;
  warehouseId?: string | undefined;
  location?: string | undefined;
  issueCategory?: string | undefined;
  severity?: IssueSeverity | undefined;
}

export interface ReportIssueScreenProps extends WarehouseScreenBaseProps {
  mode?: ReportIssueMode | undefined;
  initialCategory?: string | undefined;
  onSubmit: (submittedId: string, submission: ReportIssueSubmission) => void;
}

export function ReportIssueScreen({
  onBack,
  mode = 'operational',
  onSubmit,
}: ReportIssueScreenProps) {
  const [issueType, setIssueType] = useState<string | undefined>(undefined);
  const [issueTypePickerOpen, setIssueTypePickerOpen] = useState(false);

  const [location, setLocation] = useState<string | undefined>(undefined);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);

  const [description, setDescription] = useState('');
  const [hasPhoto, setHasPhoto] = useState(false);

  const submit = () => {
    onSubmit('ISS-0029', {
      mode,
      category: issueType ?? 'Warehouse Operations',
      specificIssue: issueType ?? 'Operational Issue',
      subject: issueType ?? 'Operational Issue',
      description: description.trim() || 'Cold storage maintenance required',
      location,
      issueCategory: issueType,
    });
  };

  const attachPhoto = () => {
    Alert.alert('Attach Photo', 'Choose photo source:', [
      { text: 'Take Photo', onPress: () => setHasPhoto(true) },
      { text: 'Choose from Library', onPress: () => setHasPhoto(true) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <WalletScreen
      title="Report Issue"
      onBack={onBack}
      footer={
        <WalletFooter>
          <WalletButton label="Submit Issue" icon={<SendIcon />} onPress={submit} />
        </WalletFooter>
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.labelTitle}>
          Issue Type <Text style={styles.requiredText}>Required</Text>
        </Text>
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => {
            setIssueTypePickerOpen((prev) => !prev);
            setLocationPickerOpen(false);
          }}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <Text style={[styles.dropdownText, !issueType && styles.placeholder]}>
            {issueType ?? 'Select'}
          </Text>
          <ChevronDownIcon />
        </TouchableOpacity>

        {issueTypePickerOpen ? (
          <View style={styles.dropdownList}>
            {ISSUE_TYPES.map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.dropdownOption}
                onPress={() => {
                  setIssueType(item);
                  setIssueTypePickerOpen(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.dropdownOptionText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <Text style={styles.labelTitle}>
          Location <Text style={styles.requiredText}>Required</Text>
        </Text>
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => {
            setLocationPickerOpen((prev) => !prev);
            setIssueTypePickerOpen(false);
          }}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <Text style={[styles.dropdownText, !location && styles.placeholder]}>
            {location ?? 'Select'}
          </Text>
          <ChevronDownIcon />
        </TouchableOpacity>

        {locationPickerOpen ? (
          <View style={styles.dropdownList}>
            {LOCATIONS.map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.dropdownOption}
                onPress={() => {
                  setLocation(item);
                  setLocationPickerOpen(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.dropdownOptionText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <Text style={styles.labelTitle}>
          Description <Text style={styles.requiredText}>Required</Text>
        </Text>
        <View style={styles.textAreaBox}>
          <TextInput
            style={styles.textArea}
            placeholder="Enter description"
            placeholderTextColor={adminColors.placeholder}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <Text style={styles.labelTitle}>
          Photo <Text style={styles.optionalText}>Optional</Text>
        </Text>
        <TouchableOpacity
          style={[styles.photoButton, hasPhoto && styles.photoButtonActive]}
          onPress={attachPhoto}
          activeOpacity={0.75}
          accessibilityRole="button"
        >
          <CameraIcon size={22} color={hasPhoto ? adminColors.brand : '#64748B'} />
          <Text style={[styles.photoButtonText, hasPhoto && styles.photoButtonTextActive]}>
            {hasPhoto ? 'Photo Added' : 'Add Photo'}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.labelTitle, { marginTop: adminSpacing.lg }]}>Priority</Text>
        <View style={styles.infoCard}>
          <InfoCircleIcon size={18} color="#0284C7" />
          <Text style={styles.infoCardText}>
            Priority levels are backend-defined — this app doesn't invent a High/Medium/Low scale unless the API provides one.
          </Text>
        </View>
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  labelTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  requiredText: {
    fontSize: 13,
    fontWeight: '400',
    color: adminColors.muted,
  },
  optionalText: {
    fontSize: 13,
    fontWeight: '400',
    color: adminColors.muted,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.lg,
    height: 52,
    marginBottom: adminSpacing.lg,
  },
  dropdownText: {
    fontSize: 15,
    color: adminColors.ink,
  },
  placeholder: {
    color: adminColors.placeholder,
  },
  dropdownList: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    marginTop: -adminSpacing.md,
    marginBottom: adminSpacing.lg,
    overflow: 'hidden',
  },
  dropdownOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  dropdownOptionText: {
    fontSize: 15,
    color: '#1E293B',
  },
  textAreaBox: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    height: 120,
    marginBottom: adminSpacing.lg,
  },
  textArea: {
    flex: 1,
    fontSize: 15,
    color: adminColors.ink,
  },
  photoButton: {
    width: 80,
    height: 72,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    gap: 4,
  },
  photoButtonActive: {
    borderColor: adminColors.brand,
    backgroundColor: adminColors.brandTint,
  },
  photoButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  photoButtonTextActive: {
    color: adminColors.brand,
  },
  infoCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#93C5FD',
    borderRadius: 12,
    padding: 14,
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  infoCardText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#0369A1',
    fontWeight: '500',
  },
});
