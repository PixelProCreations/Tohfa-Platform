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
import { FAQ_ITEMS } from '../profile-settings/fixtures';
import {
  DEMO_SUBMITTED_ID,
  SUPPORT_CATEGORIES,
  SUPPORT_REFERENCE_HINT,
  SUPPORT_SPECIFIC_ISSUES,
} from './fixtures';
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
  initialCategory,
  onSubmit,
}: ReportIssueScreenProps) {
  const [category, setCategory] = useState<string>(initialCategory ?? 'Warehouse Operations');
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);

  const [issueType, setIssueType] = useState<string | undefined>(undefined);
  const [issueTypePickerOpen, setIssueTypePickerOpen] = useState(false);

  const [referenceId, setReferenceId] = useState('');
  const [location, setLocation] = useState<string | undefined>(undefined);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);

  const [description, setDescription] = useState('');
  const [hasPhoto, setHasPhoto] = useState(false);
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  const isSupport = mode === 'support' || initialCategory !== undefined;
  const categoriesList = isSupport ? SUPPORT_CATEGORIES : ISSUE_TYPES;
  const specificIssuesList = isSupport
    ? SUPPORT_SPECIFIC_ISSUES[category] ?? ['General Issue', 'Other Issue']
    : ISSUE_TYPES;

  const relatedFaqs = FAQ_ITEMS.filter((faq) => faq.category === category);

  const submit = () => {
    const defaultSubject = isSupport ? (issueType ?? `${category} Support Request`) : (issueType ?? 'Operational Issue');
    const demoId = isSupport ? (DEMO_SUBMITTED_ID.support ?? 'SUP-00246') : (DEMO_SUBMITTED_ID.operational ?? 'ISS-0029');

    onSubmit(demoId, {
      mode,
      category,
      specificIssue: issueType ?? defaultSubject,
      subject: defaultSubject,
      description: description.trim() || `${category} support request`,
      location: referenceId.trim() || location,
      referenceId: referenceId.trim() || undefined,
      issueCategory: issueType ?? category,
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
      title={isSupport ? 'Report an Issue' : 'Report Issue'}
      onBack={onBack}
      footer={
        <WalletFooter>
          <WalletButton label="Submit Issue" icon={<SendIcon />} onPress={submit} />
        </WalletFooter>
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Topic / Category Selector */}
        <Text style={styles.labelTitle}>
          Topic / Category <Text style={styles.requiredText}>Required</Text>
        </Text>
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => {
            setCategoryPickerOpen((prev) => !prev);
            setIssueTypePickerOpen(false);
            setLocationPickerOpen(false);
          }}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <Text style={styles.dropdownText}>{category}</Text>
          <ChevronDownIcon />
        </TouchableOpacity>

        {categoryPickerOpen ? (
          <View style={styles.dropdownList}>
            {categoriesList.map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.dropdownOption, item === category && styles.dropdownOptionActive]}
                onPress={() => {
                  setCategory(item);
                  setIssueType(undefined);
                  setCategoryPickerOpen(false);
                  setExpandedFaqId(null);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.dropdownOptionText, item === category && styles.dropdownOptionTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {/* RELATED Q&A FOR THE CHOSEN TOPIC */}
        {relatedFaqs.length > 0 ? (
          <View style={styles.faqSection}>
            <View style={styles.faqHeaderRow}>
              <Text style={styles.faqHeaderTitle}>RELATED Q&A FOR {category.toUpperCase()}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{relatedFaqs.length} FAQs</Text>
              </View>
            </View>
            <Text style={styles.faqHeaderSub}>Check if these frequent questions solve your issue:</Text>

            <View style={styles.faqList}>
              {relatedFaqs.map((faq) => {
                const expanded = expandedFaqId === faq.id;
                return (
                  <View key={faq.id} style={[styles.faqCard, expanded && styles.faqCardExpanded]}>
                    <TouchableOpacity
                      style={styles.faqRow}
                      onPress={() => setExpandedFaqId(expanded ? null : faq.id)}
                      activeOpacity={0.75}
                      accessibilityRole="button"
                    >
                      <Text style={[styles.faqQuestion, expanded && styles.faqQuestionActive]}>{faq.question}</Text>
                      <ChevronDownIcon size={16} color={expanded ? adminColors.brand : adminColors.muted} />
                    </TouchableOpacity>
                    {expanded ? (
                      <View style={styles.faqAnswerBox}>
                        <Text style={styles.faqAnswer}>{faq.answer}</Text>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* Specific Issue Type */}
        <Text style={[styles.labelTitle, { marginTop: adminSpacing.md }]}>
          {isSupport ? 'Specific Issue' : 'Issue Type'} <Text style={styles.requiredText}>Required</Text>
        </Text>
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => {
            setIssueTypePickerOpen((prev) => !prev);
            setCategoryPickerOpen(false);
            setLocationPickerOpen(false);
          }}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <Text style={[styles.dropdownText, !issueType && styles.placeholder]}>
            {issueType ?? 'Select specific issue'}
          </Text>
          <ChevronDownIcon />
        </TouchableOpacity>

        {issueTypePickerOpen ? (
          <View style={styles.dropdownList}>
            {specificIssuesList.map((item) => (
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

        {/* Reference / Location */}
        <Text style={styles.labelTitle}>
          {isSupport ? 'Reference ID / Tag' : 'Location'}{' '}
          <Text style={styles.optionalText}>Optional</Text>
        </Text>
        {isSupport ? (
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              placeholder={SUPPORT_REFERENCE_HINT[category] ?? 'e.g. Reference #'}
              placeholderTextColor={adminColors.placeholder}
              value={referenceId}
              onChangeText={setReferenceId}
            />
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => {
                setLocationPickerOpen((prev) => !prev);
                setCategoryPickerOpen(false);
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
          </>
        )}

        <Text style={styles.labelTitle}>
          Description <Text style={styles.requiredText}>Required</Text>
        </Text>
        <View style={styles.textAreaBox}>
          <TextInput
            style={styles.textArea}
            placeholder="Enter issue details..."
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
  dropdownOptionActive: {
    backgroundColor: adminColors.brandTint,
  },
  dropdownOptionTextActive: {
    color: adminColors.brand,
    fontWeight: '700',
  },
  faqSection: {
    marginBottom: adminSpacing.lg,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
  },
  faqHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  faqHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.ink,
    letterSpacing: 0.5,
  },
  faqHeaderSub: {
    fontSize: 12,
    color: adminColors.muted,
    marginBottom: adminSpacing.sm,
  },
  badge: {
    backgroundColor: adminColors.brandTint,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: adminRadius.full,
  },
  badgeText: {
    fontSize: 11,
    color: adminColors.brand,
    fontWeight: '700',
  },
  faqList: {
    gap: adminSpacing.xs,
  },
  faqCard: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    overflow: 'hidden',
  },
  faqCardExpanded: {
    borderColor: adminColors.brandSoft.border,
    backgroundColor: '#FFFFFF',
  },
  faqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: adminSpacing.sm,
    gap: adminSpacing.xs,
  },
  faqQuestion: {
    fontSize: 13,
    fontWeight: '600',
    color: adminColors.ink,
    flex: 1,
  },
  faqQuestionActive: {
    color: adminColors.brand,
  },
  faqAnswerBox: {
    paddingHorizontal: adminSpacing.sm,
    paddingBottom: adminSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingTop: adminSpacing.xs,
  },
  faqAnswer: {
    fontSize: 12,
    lineHeight: 18,
    color: adminColors.muted,
  },
  inputBox: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.lg,
    height: 52,
    marginBottom: adminSpacing.lg,
    justifyContent: 'center',
  },
  input: {
    fontSize: 15,
    color: adminColors.ink,
  },
});
