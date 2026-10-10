/**
 * Report an Issue: the Help & Support request form, also used for warehouse
 * operational issues.
 *
 * Gate (FINAL_LIST 134): `support.ticket.create_own`. Neither warehouse admin
 * role holds it today (MAIN none, SUB none), so every entry point (Help &
 * Support's CTA, the Operational Issues Report button) is hidden and the
 * screen renders a not-available note if opened directly. Operational-issue
 * reporting needs its own rbac code before shipping (SPEC_GAPS W4v-2); none
 * is invented here.
 *
 * Absorbs Main ReportOperationalIssueScreen (pair M4-S09R): in `operational`
 * mode the form adds the Main fields as optional extras: warehouse (Main
 * picks one; Sub is locked to its own), specific location / rack, issue
 * category and severity. The Main summary / description map onto Subject and
 * Description, so no Main field is lost. `support` mode is the old form.
 */
// Design id: M4-S09R
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import {
  ChipGroup,
  EmptyState,
  isAllWarehouses,
  ScopeHeader,
  SectionTitle,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import {
  DEMO_ATTACHMENTS,
  DEMO_SUBMITTED_ID,
  ISSUE_SEVERITIES,
  OPERATIONAL_ISSUE_CATEGORIES,
  STORAGE_WAREHOUSES,
  SUPPORT_CATEGORIES,
  SUPPORT_REFERENCE_HINT,
  SUPPORT_SPECIFIC_ISSUES,
} from './fixtures';
import { ChevronDownIcon, CloseIcon, PaperclipIcon, PickerModal, SendIcon, STORAGE_CODES } from './StorageParts';
import type { IssueSeverity, ReportIssueMode, WarehouseScreenBaseProps } from './types';

const DEFAULT_SUPPORT_CATEGORY = 'Orders';
const OPERATIONAL_SUPPORT_CATEGORY = 'Warehouse Operations';
const GENERIC_REFERENCE_HINT = 'e.g. REF-2026-001';
const FALLBACK_ISSUE = 'General Inquiry';

function specificIssuesOf(category: string): readonly string[] {
  return SUPPORT_SPECIFIC_ISSUES[category] ?? SUPPORT_SPECIFIC_ISSUES['Other'] ?? [FALLBACK_ISSUE];
}

/** What the form hands to the host (no submit endpoint yet; SPEC_GAPS W4v-2). */
export interface ReportIssueSubmission {
  mode: ReportIssueMode;
  category: string;
  specificIssue: string;
  subject: string;
  description: string;
  referenceId?: string | undefined;
  attachmentName?: string | undefined;
  /** Operational mode only. */
  warehouseId?: string | undefined;
  location?: string | undefined;
  issueCategory?: string | undefined;
  severity?: IssueSeverity | undefined;
}

export interface ReportIssueScreenProps extends WarehouseScreenBaseProps {
  mode?: ReportIssueMode | undefined;
  /** Preselected support category (Help & Support topic). */
  initialCategory?: string | undefined;
  /** Submitted; receives the demo id the request was filed under. */
  onSubmit: (submittedId: string, submission: ReportIssueSubmission) => void;
}

export function ReportIssueScreen({ scope, can, onBack, mode = 'support', initialCategory, onSubmit }: ReportIssueScreenProps) {
  const operational = mode === 'operational';
  const startCategory =
    initialCategory !== undefined && SUPPORT_CATEGORIES.includes(initialCategory)
      ? initialCategory
      : operational
        ? OPERATIONAL_SUPPORT_CATEGORY
        : DEFAULT_SUPPORT_CATEGORY;

  const [category, setCategory] = useState(startCategory);
  const [specificIssue, setSpecificIssue] = useState(specificIssuesOf(startCategory)[0] ?? FALLBACK_ISSUE);
  const [picker, setPicker] = useState<'category' | 'specific' | null>(null);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  // Operational extras (absorbed Main form). Main picks a warehouse; Sub is locked to its own.
  const [warehouseId, setWarehouseId] = useState<string | undefined>(scope.warehouseId ?? STORAGE_WAREHOUSES[0]?.warehouseId);
  const [location, setLocation] = useState('');
  const [issueCategory, setIssueCategory] = useState(OPERATIONAL_ISSUE_CATEGORIES[0] ?? '');
  const [severity, setSeverity] = useState<IssueSeverity>('Medium');

  if (!can(STORAGE_CODES.issueReport)) {
    return (
      <WalletScreen title={operational ? 'Report Operational Issue' : 'Report an Issue'} onBack={onBack}>
        <EmptyState title="Issue reporting not available" subtitle="Your role does not include raising support or issue requests." />
      </WalletScreen>
    );
  }

  const specificIssues = specificIssuesOf(category);
  const subjectFollowsIssue = subject.trim() === '' || subject === specificIssue;

  const selectCategory = (next: string) => {
    setPicker(null);
    setCategory(next);
    const first = specificIssuesOf(next)[0] ?? FALLBACK_ISSUE;
    if (subjectFollowsIssue) setSubject(first);
    setSpecificIssue(first);
  };
  const selectSpecific = (next: string) => {
    setPicker(null);
    if (subjectFollowsIssue) setSubject(next);
    setSpecificIssue(next);
  };

  const attach = () => {
    Alert.alert('Attach File', 'Choose attachment source:', [
      { text: 'Document / Image', onPress: () => setAttachmentName(DEMO_ATTACHMENTS.document) },
      { text: 'Camera Photo', onPress: () => setAttachmentName(DEMO_ATTACHMENTS.photo) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const submit = () => {
    if (description.trim() === '') {
      Alert.alert('Validation Error', 'Please enter a description for your issue.');
      return;
    }
    onSubmit(DEMO_SUBMITTED_ID[mode], {
      mode,
      category,
      specificIssue,
      subject: subject.trim() || specificIssue,
      description: description.trim(),
      referenceId: referenceId.trim() || undefined,
      attachmentName: attachmentName ?? undefined,
      ...(operational
        ? { warehouseId, location: location.trim() || undefined, issueCategory, severity }
        : {}),
    });
  };

  const warehouseOptions = STORAGE_WAREHOUSES.map((w) => w.warehouseId ?? '').filter((id) => id !== '');
  const warehouseLabel = (id: string) => STORAGE_WAREHOUSES.find((w) => w.warehouseId === id)?.warehouseName ?? id;

  return (
    <WalletScreen
      title={operational ? 'Report Operational Issue' : 'Report an Issue'}
      subtitle={operational ? 'Log warehouse equipment, space or facility issues' : undefined}
      onBack={onBack}
      headerExtra={operational ? <ScopeHeader scope={scope} /> : undefined}
      footer={
        <WalletFooter>
          <WalletButton label={operational ? 'Submit Issue' : 'Submit Issue Request'} icon={<SendIcon />} onPress={submit} />
        </WalletFooter>
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {operational ? (
          <>
            {isAllWarehouses(scope) && warehouseId !== undefined ? (
              <>
                <SectionTitle>Warehouse</SectionTitle>
                <ChipGroup options={warehouseOptions} value={warehouseId} onChange={setWarehouseId} labelOf={warehouseLabel} />
              </>
            ) : null}
            <SectionTitle>Specific Location / Rack (optional)</SectionTitle>
            <TextInput
              style={styles.input}
              placeholder="e.g. Cold Storage, Section A, Rack A-03"
              placeholderTextColor={adminColors.placeholder}
              value={location}
              onChangeText={setLocation}
            />
            <SectionTitle>Issue Category</SectionTitle>
            <ChipGroup options={OPERATIONAL_ISSUE_CATEGORIES} value={issueCategory} onChange={setIssueCategory} />
            <SectionTitle>Severity Level</SectionTitle>
            <ChipGroup options={ISSUE_SEVERITIES} value={severity} onChange={setSeverity} />
          </>
        ) : null}

        <SectionTitle>Category</SectionTitle>
        <TouchableOpacity style={styles.dropdown} onPress={() => setPicker('category')} activeOpacity={0.8} accessibilityRole="button">
          <Text style={styles.dropdownText}>{category}</Text>
          <ChevronDownIcon />
        </TouchableOpacity>

        <SectionTitle>{`Specific Issue (${category})`}</SectionTitle>
        <TouchableOpacity
          style={[styles.dropdown, styles.dropdownAccent]}
          onPress={() => setPicker('specific')}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <Text style={styles.dropdownTextAccent}>{specificIssue}</Text>
          <ChevronDownIcon color={adminColors.brand} />
        </TouchableOpacity>

        <SectionTitle>Subject</SectionTitle>
        <TextInput
          style={styles.input}
          placeholder={specificIssue}
          placeholderTextColor={adminColors.placeholder}
          value={subject}
          onChangeText={setSubject}
        />

        <SectionTitle>Description</SectionTitle>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe what happened, error message, or details..."
          placeholderTextColor={adminColors.placeholder}
          multiline
          textAlignVertical="top"
          value={description}
          onChangeText={setDescription}
        />

        <SectionTitle>Reference ID (optional)</SectionTitle>
        <TextInput
          style={styles.input}
          placeholder={SUPPORT_REFERENCE_HINT[category] ?? GENERIC_REFERENCE_HINT}
          placeholderTextColor={adminColors.placeholder}
          value={referenceId}
          onChangeText={setReferenceId}
        />

        <SectionTitle>Attachment</SectionTitle>
        <View style={styles.attachmentRow}>
          <TouchableOpacity style={styles.attachmentBox} onPress={attach} activeOpacity={0.75} accessibilityRole="button" accessibilityLabel="Attach file">
            <PaperclipIcon />
          </TouchableOpacity>
          {attachmentName !== null ? (
            <View style={styles.attachedFile}>
              <Text style={styles.attachedFileText} numberOfLines={1}>
                {attachmentName}
              </Text>
              <TouchableOpacity onPress={() => setAttachmentName(null)} accessibilityRole="button" accessibilityLabel="Remove attachment">
                <CloseIcon size={14} />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <PickerModal
        visible={picker === 'category'}
        title="Select Category"
        options={SUPPORT_CATEGORIES}
        value={category}
        onSelect={selectCategory}
        onClose={() => setPicker(null)}
      />
      <PickerModal
        visible={picker === 'specific'}
        title="Select Specific Issue"
        subtitle={category}
        options={specificIssues}
        value={specificIssue}
        onSelect={selectSpecific}
        onClose={() => setPicker(null)}
      />
    </WalletScreen>
  );
}

const ATTACHMENT_BOX = 56;
const TEXT_AREA_HEIGHT = 110;

const styles = StyleSheet.create({
  input: {
    ...adminType.body,
    color: adminColors.ink,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
  },
  textArea: { minHeight: TEXT_AREA_HEIGHT },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
  },
  dropdownAccent: { borderColor: adminColors.brandSoft.border, backgroundColor: adminColors.brandTint },
  dropdownText: { ...adminType.body, color: adminColors.ink, flex: 1 },
  dropdownTextAccent: { ...adminType.rowTitle, color: adminColors.brandDeep, flex: 1 },
  attachmentRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.md },
  attachmentBox: {
    width: ATTACHMENT_BOX,
    height: ATTACHMENT_BOX,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachedFile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
  },
  attachedFileText: { ...adminType.rowMeta, color: adminColors.brandDeep, flex: 1 },
});
