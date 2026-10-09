/**
 * Inspect Returned Product — record what actually came back, then confirm.
 *
 * Two steps in one screen: the inspection form and the "Inspection Saved"
 * confirmation. The confirmation used to exist twice more for the Main view
 * (MainWarehouseInspectionSavedScreen, then W3b's ReturnResultScreen variant
 * 'INSPECTION_SAVED'); it is this screen's 'saved' step now.
 *
 * Gates (docs/rbac.json; the server re-checks, CLAUDE.md 2.1):
 *   - "Save Inspection" and "Continue Review" are disabled unless
 *     `rma.request.process` (FINAL_LIST row 94).
 *
 * Absorbs MainWarehouseInspectProductScreen (pair M10-S03): its received
 * quantity, Good/Damaged/Spoiled condition, notes and returned/accepted/damaged
 * result tiles are all covered by the form below ("Good" = "Acceptable").
 */
// Design id: M10-S03
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { INSPECTION_RESULT_OPTIONS } from './fixtures';
import {
  InfoCard,
  IssueTag,
  PermissionNote,
  ReturnsButton,
  ReturnsFooter,
  ReturnsScreen,
  SectionTitle,
} from './ReturnsParts';
import type { InspectionCondition, InspectionResultData, InspectStep, RmaScreenBaseProps } from './types';

export interface InspectProductScreenProps extends RmaScreenBaseProps {
  /** Which step to open on; the host passes `params.step` here. */
  initialStep?: InspectStep | undefined;
  onContinueToReview: (inspection: InspectionResultData) => void;
}

const CONDITIONS: readonly InspectionCondition[] = ['Acceptable', 'Damaged', 'Spoiled'];

// Mock prefill the old Sub screen shipped with, until inspections are wired.
const DEFAULT_ACTUAL_QTY = '1.8';
const DEFAULT_RESULT = 'Damage Confirmed';
const DEFAULT_NOTES = '2 KG received. Approximately 0.5 KG visibly damaged.';
const DEFAULT_RETURNED_QTY = '2 KG';
const DEFAULT_ACCEPTED_QTY = '0.0 KG';

function ImageIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="2" stroke={adminColors.brand} strokeWidth="1.8" />
      <Circle cx="8.5" cy="8.5" r="1.5" fill={adminColors.brand} />
      <Path d="M21 15l-5-5L5 21" stroke={adminColors.brand} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CameraIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
        stroke={adminColors.muted}
        strokeWidth="1.8"
      />
      <Circle cx="12" cy="13" r="4" stroke={adminColors.muted} strokeWidth="1.8" />
    </Svg>
  );
}

function SaveDiskIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
        stroke={adminColors.onBrand}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M17 21v-8H7v8M7 3v5h8" stroke={adminColors.onBrand} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ArrowForwardIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14M12 5l7 7-7 7" stroke={adminColors.onBrand} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronDownIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={adminColors.ink} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BigCheckCircleIcon() {
  return (
    <Svg width={38} height={38} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={adminColors.success.text} strokeWidth="2" />
      <Path
        d="M8 12l2.5 2.5 5.5-5.5"
        stroke={adminColors.success.text}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function InspectProductScreen({
  can,
  rma,
  onBack,
  initialStep = 'form',
  onContinueToReview,
}: InspectProductScreenProps) {
  const canProcess = can('rma.request.process');
  const [step, setStep] = useState<InspectStep>(initialStep);
  const [actualQty, setActualQty] = useState(DEFAULT_ACTUAL_QTY);
  const [condition, setCondition] = useState<InspectionCondition>('Damaged');
  const [result, setResult] = useState(DEFAULT_RESULT);
  const [notes, setNotes] = useState(DEFAULT_NOTES);
  const [showResultOptions, setShowResultOptions] = useState(false);

  const permissionNote = canProcess ? null : (
    <PermissionNote>Saving an inspection needs the RMA processing permission.</PermissionNote>
  );

  if (step === 'saved') {
    return (
      <ReturnsScreen
        title="Inspect Returned Product"
        subtitle={rma.rmaId}
        onBack={() => setStep('form')}
        footer={
          <ReturnsFooter>
            <ReturnsButton
              label="Continue Review"
              icon={<ArrowForwardIcon />}
              disabled={!canProcess}
              onPress={() => onContinueToReview({ rma, receivedQty: `${actualQty} KG`, condition, result, notes })}
            />
            {permissionNote}
          </ReturnsFooter>
        }
      >
        <View style={styles.savedContainer}>
          <View style={styles.successIconCircle}>
            <BigCheckCircleIcon />
          </View>
          <Text style={styles.savedTitle}>Inspection Saved</Text>
          <Text style={styles.savedSubtitle}>RMA is ready for review.</Text>
        </View>
      </ReturnsScreen>
    );
  }

  return (
    <ReturnsScreen
      title="Inspect Returned Product"
      subtitle={rma.rmaId}
      onBack={onBack}
      footer={
        <ReturnsFooter>
          <ReturnsButton
            label="Save Inspection"
            icon={<SaveDiskIcon />}
            disabled={!canProcess}
            onPress={() => setStep('saved')}
          />
          {permissionNote}
        </ReturnsFooter>
      }
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <SectionTitle>RMA Summary</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: 'Customer', value: rma.customerName },
              { label: 'Order', value: rma.orderId },
            ],
            [
              { label: 'Product', value: `${rma.productName} – ${rma.grade}` },
              { label: 'Requested Return', value: rma.requestedQuantity },
            ],
            [{ label: 'Issue', value: rma.issueCategory }],
          ]}
        />

        <SectionTitle>Inspection Quantity</SectionTitle>
        <InfoCard rows={[[{ label: 'Expected Return Quantity', value: rma.requestedQuantity }]]} />

        <Text style={styles.subHeader}>Actual Received Quantity</Text>
        <View style={styles.inputWithSuffix}>
          <TextInput
            style={styles.qtyInput}
            value={actualQty}
            onChangeText={setActualQty}
            keyboardType="decimal-pad"
            placeholder="0.0"
            placeholderTextColor={adminColors.placeholder}
            editable={canProcess}
          />
          <Text style={styles.suffixText}>KG</Text>
        </View>

        <SectionTitle>Product Condition</SectionTitle>
        <View style={styles.conditionRow}>
          {CONDITIONS.map((cond) => {
            const isSelected = condition === cond;
            return (
              <TouchableOpacity
                key={cond}
                style={[styles.condBtn, isSelected && styles.condBtnActive]}
                onPress={() => setCondition(cond)}
                activeOpacity={0.75}
                disabled={!canProcess}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected, disabled: !canProcess }}
              >
                <Text style={[styles.condBtnText, isSelected && styles.condBtnTextActive]}>{cond}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <SectionTitle>Issue Verification</SectionTitle>
        <InfoCard rows={[[{ label: 'Customer Reported', value: <IssueTag label={rma.issueCategory} /> }]]} />

        <SectionTitle>Inspection Result</SectionTitle>
        <TouchableOpacity
          style={styles.dropdownBtn}
          onPress={() => setShowResultOptions((prev) => !prev)}
          activeOpacity={0.8}
          disabled={!canProcess}
        >
          <Text style={styles.dropdownSelectedText}>{result || 'Select result'}</Text>
          <ChevronDownIcon />
        </TouchableOpacity>
        {showResultOptions ? (
          <View style={styles.dropdownMenu}>
            {INSPECTION_RESULT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={styles.dropdownItem}
                onPress={() => {
                  setResult(opt);
                  setShowResultOptions(false);
                }}
              >
                <Text style={[styles.dropdownItemText, result === opt && styles.dropdownItemTextActive]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <SectionTitle>Inspection Notes</SectionTitle>
        <View style={styles.notesBox}>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            placeholder="Enter inspection notes..."
            placeholderTextColor={adminColors.placeholder}
            editable={canProcess}
          />
        </View>

        <SectionTitle>Inspection Photos</SectionTitle>
        <View style={styles.photosRow}>
          <View style={styles.photoBox}>
            <ImageIcon />
          </View>
          <View style={styles.photoBox}>
            <ImageIcon />
          </View>
          {canProcess ? (
            <TouchableOpacity
              style={styles.addPhotoBox}
              onPress={() => Alert.alert('Add Photo', 'Take picture or choose from gallery')}
              activeOpacity={0.7}
              accessibilityLabel="Add inspection photo"
            >
              <CameraIcon />
            </TouchableOpacity>
          ) : null}
        </View>

        <SectionTitle>Returned Product Condition</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: 'Returned Quantity', value: DEFAULT_RETURNED_QTY },
              { label: 'Accepted Condition', value: DEFAULT_ACCEPTED_QTY },
            ],
            [{ label: 'Damaged Quantity', value: `${actualQty} KG` }],
          ]}
        />
      </ScrollView>
    </ReturnsScreen>
  );
}

// Fixed sizes (icon circle, photo tile, notes box): not spacing.
const SUCCESS_CIRCLE = 72;
const PHOTO_SIZE = 68;
const NOTES_MIN_HEIGHT = 64;

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: adminSpacing.lg, paddingTop: adminSpacing.sm, paddingBottom: adminSpacing.xl },
  subHeader: { ...adminType.sectionHead, color: adminColors.ink, marginTop: adminSpacing.md, marginBottom: adminSpacing.xs },
  inputWithSuffix: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
  },
  qtyInput: { ...adminType.kpiValue, flex: 1, color: adminColors.ink, padding: 0 },
  suffixText: { ...adminType.sectionHead, color: adminColors.ink },
  conditionRow: { flexDirection: 'row', gap: adminSpacing.sm },
  condBtn: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  condBtnActive: { backgroundColor: adminColors.brandTint, borderColor: adminColors.brand },
  condBtnText: { ...adminType.body, color: adminColors.ink },
  condBtnTextActive: { ...adminType.sectionHead, color: adminColors.brandDeep },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
  },
  dropdownSelectedText: { ...adminType.sectionHead, color: adminColors.ink },
  dropdownMenu: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginTop: adminSpacing.xs,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  dropdownItemText: { ...adminType.body, color: adminColors.ink },
  dropdownItemTextActive: { ...adminType.sectionHead, color: adminColors.brand },
  notesBox: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
  },
  notesInput: {
    ...adminType.body,
    color: adminColors.ink,
    minHeight: NOTES_MIN_HEIGHT,
    textAlignVertical: 'top',
    padding: 0,
  },
  photosRow: { flexDirection: 'row', gap: adminSpacing.md },
  photoBox: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brandTint,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoBox: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedContainer: { flex: 1, paddingHorizontal: adminSpacing.lg, paddingTop: adminSpacing.xxl, alignItems: 'center' },
  successIconCircle: {
    width: SUCCESS_CIRCLE,
    height: SUCCESS_CIRCLE,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.success.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.lg,
  },
  savedTitle: { ...adminType.title, color: adminColors.ink, textAlign: 'center', marginBottom: adminSpacing.xs },
  savedSubtitle: { ...adminType.body, color: adminColors.muted, textAlign: 'center' },
});
