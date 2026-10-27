import React, { useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import { type AuditScheduleRecord, INITIAL_SCHEDULE_RECORDS } from './fixtures';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FileTextIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 2v6h6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="16" y1="13" x2="8" y2="13" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="16" y1="17" x2="8" y2="17" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="10" y1="9" x2="8" y2="9" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 16, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SearchIcon({ size = 16, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M20 20l-3.5-3.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function UploadFileIcon({ size = 18, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 2v6h6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 18v-6M9 15l3-3 3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ResizeGripIcon({ size = 12, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Line x1="14" y1="6" x2="6" y2="14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="14" y1="10" x2="10" y2="14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Component Props ──────────────────────────────────────────────────────────

export interface FarmerDocumentsFindingsScreenProps {
  record?: AuditScheduleRecord | undefined;
  onBack: () => void;
  onSubmitSuccess?: () => void;
}

interface EvidenceDoc {
  id: string;
  title: string;
  status: string;
}

export function FarmerDocumentsFindingsScreen({
  record: propRecord,
  onBack,
  onSubmitSuccess,
}: FarmerDocumentsFindingsScreenProps) {
  const record = propRecord ?? INITIAL_SCHEDULE_RECORDS[0]!;

  // Existing documents
  const [existingDocs, setExistingDocs] = useState<EvidenceDoc[]>([
    { id: 'doc-1', title: 'FMB Sketch', status: 'On file' },
    { id: 'doc-2', title: 'PGS Organic Certificate', status: 'On file' },
  ]);

  // Form state
  const [category, setCategory] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const [section, setSection] = useState('');
  const [showSectionPicker, setShowSectionPicker] = useState(false);

  const [observation, setObservation] = useState('');

  const [recommendation, setRecommendation] = useState('');
  const [showRecommendationPicker, setShowRecommendationPicker] = useState(false);

  const [recNotes, setRecNotes] = useState('');
  const [evidenceFileName, setEvidenceFileName] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  // Document preview modal
  const [previewDoc, setPreviewDoc] = useState<string | null>(null);

  const handleUploadFile = () => {
    Alert.alert('Upload Evidence File', 'Select a file to attach as evidence:', [
      { text: 'Soil_Health_Card.pdf', onPress: () => setEvidenceFileName('Soil_Health_Card.pdf') },
      { text: 'Plot_Inspection_Photo.jpg', onPress: () => setEvidenceFileName('Plot_Inspection_Photo.jpg') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleAddEvidence = () => {
    if (!category) {
      Alert.alert('Required Field', 'Please select an Evidence Category.');
      return;
    }
    if (!section) {
      Alert.alert('Required Field', 'Please select a Related Inspection Section.');
      return;
    }
    if (!observation.trim()) {
      Alert.alert('Required Field', 'Please enter your Observation.');
      return;
    }

    const newDocTitle = evidenceFileName || `${category} - ${section}`;
    setExistingDocs((prev) => [
      ...prev,
      { id: `doc-${Date.now()}`, title: newDocTitle, status: 'Uploaded just now' },
    ]);

    Alert.alert('Evidence Added', 'The evidence entry has been recorded successfully.');
    setCategory('');
    setSection('');
    setObservation('');
    setRecommendation('');
    setRecNotes('');
    setEvidenceFileName(null);
    setNotes('');
  };

  const handleSubmitToReview = () => {
    Alert.alert(
      'Submit to Review',
      'Are you sure you want to submit all documents and findings for administrative review?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Submit',
          onPress: () => {
            Alert.alert('Success', 'Findings and evidence submitted for review successfully!');
            onSubmitSuccess ? onSubmitSuccess() : onBack();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Orange Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={24} color={adminColors.onBrand} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Documents & Findings</Text>
            <Text style={styles.headerSubtitleText}>
              {record.id || 'AUD-2026-0042'} · {record.farmerName || 'Ramesh Kumar'}
            </Text>
          </View>
        </View>
      </View>

      {/* ─── Scrollable Body ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: Existing documents & evidence */}
        <Text style={styles.sectionHeader}>Existing documents & evidence</Text>

        {existingDocs.map((doc) => (
          <View key={doc.id} style={styles.docCard}>
            <View style={styles.docLeftRow}>
              <View style={styles.docIconWrap}>
                <FileTextIcon size={20} color={adminColors.brand} />
              </View>
              <View style={styles.docTextWrap}>
                <Text style={styles.docTitle}>{doc.title}</Text>
                <Text style={styles.docStatus}>{doc.status}</Text>
              </View>
            </View>

            <View style={styles.docButtonsRow}>
              <TouchableOpacity
                style={styles.docBtn}
                onPress={() => setPreviewDoc(doc.title)}
                activeOpacity={0.8}
              >
                <Text style={styles.docBtnText}>View</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.docBtn}
                onPress={() => Alert.alert('Download', `Downloading ${doc.title}.pdf`)}
                activeOpacity={0.8}
              >
                <Text style={styles.docBtnText}>Download</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Section 2: Add evidence */}
        <Text style={[styles.sectionHeader, { marginTop: 22 }]}>Add evidence</Text>

        {/* Field: Evidence Category */}
        <Text style={styles.fieldLabel}>
          Evidence Category <Text style={styles.redAsterisk}>*</Text>
        </Text>
        <TouchableOpacity
          style={styles.dropdownInput}
          onPress={() => {
            setShowCategoryPicker((v) => !v);
            setShowSectionPicker(false);
            setShowRecommendationPicker(false);
          }}
          activeOpacity={0.8}
        >
          <Text style={[styles.dropdownValue, !category && { color: adminColors.placeholder }]}>
            {category || 'Select...'}
          </Text>
          <ChevronDownIcon size={16} color={adminColors.ink} />
        </TouchableOpacity>

        {showCategoryPicker && (
          <View style={styles.dropdownMenu}>
            {['Documentation', 'Photo Evidence', 'Test Report', 'Other'].map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.dropdownMenuItem, category === opt && styles.dropdownMenuItemActive]}
                onPress={() => {
                  setCategory(opt);
                  setShowCategoryPicker(false);
                }}
              >
                <Text style={[styles.dropdownMenuText, category === opt && styles.dropdownMenuTextActive]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Field: Related Inspection Section */}
        <Text style={styles.fieldLabel}>
          Related Inspection Section <Text style={styles.redAsterisk}>*</Text>
        </Text>
        <TouchableOpacity
          style={styles.dropdownInput}
          onPress={() => {
            setShowSectionPicker((v) => !v);
            setShowCategoryPicker(false);
            setShowRecommendationPicker(false);
          }}
          activeOpacity={0.8}
        >
          <Text style={[styles.dropdownValue, !section && { color: adminColors.placeholder }]}>
            {section || 'Select...'}
          </Text>
          <SearchIcon size={16} color={adminColors.ink} />
        </TouchableOpacity>

        {showSectionPicker && (
          <View style={styles.dropdownMenu}>
            {[
              'Farm Documentation',
              'Organic Practices',
              'Crop Management',
              'Input Usage',
              'Water Management',
              'Harvesting & Storage',
            ].map((sec) => (
              <TouchableOpacity
                key={sec}
                style={[styles.dropdownMenuItem, section === sec && styles.dropdownMenuItemActive]}
                onPress={() => {
                  setSection(sec);
                  setShowSectionPicker(false);
                }}
              >
                <Text style={[styles.dropdownMenuText, section === sec && styles.dropdownMenuTextActive]}>
                  {sec}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Field: Observation */}
        <Text style={styles.fieldLabel}>
          Observation <Text style={styles.redAsterisk}>*</Text>
        </Text>
        <View style={styles.textareaWrapper}>
          <TextInput
            style={styles.textareaInput}
            multiline
            placeholder=""
            placeholderTextColor={adminColors.placeholder}
            value={observation}
            onChangeText={setObservation}
          />
          <View style={styles.resizeGripPos}>
            <ResizeGripIcon size={12} color={adminColors.muted} />
          </View>
        </View>

        {/* Field: Follow-up Recommendation */}
        <Text style={styles.fieldLabel}>Follow-up Recommendation</Text>
        <TouchableOpacity
          style={styles.dropdownInput}
          onPress={() => {
            setShowRecommendationPicker((v) => !v);
            setShowCategoryPicker(false);
            setShowSectionPicker(false);
          }}
          activeOpacity={0.8}
        >
          <Text style={[styles.dropdownValue, !recommendation && { color: adminColors.placeholder }]}>
            {recommendation || 'Select...'}
          </Text>
          <ChevronDownIcon size={16} color={adminColors.ink} />
        </TouchableOpacity>

        {showRecommendationPicker && (
          <View style={styles.dropdownMenu}>
            {[
              'Re-visit Recommended',
              'Farmer Guidance Needed',
              'No Action Needed',
            ].map((rec) => (
              <TouchableOpacity
                key={rec}
                style={[styles.dropdownMenuItem, recommendation === rec && styles.dropdownMenuItemActive]}
                onPress={() => {
                  setRecommendation(rec);
                  setShowRecommendationPicker(false);
                }}
              >
                <Text style={[styles.dropdownMenuText, recommendation === rec && styles.dropdownMenuTextActive]}>
                  {rec}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Field: Recommendation Notes */}
        <Text style={styles.fieldLabel}>Recommendation Notes (optional)</Text>
        <View style={styles.textareaWrapper}>
          <TextInput
            style={styles.textareaInput}
            multiline
            placeholder=""
            placeholderTextColor={adminColors.placeholder}
            value={recNotes}
            onChangeText={setRecNotes}
          />
          <View style={styles.resizeGripPos}>
            <ResizeGripIcon size={12} color={adminColors.muted} />
          </View>
        </View>

        {/* Field: Evidence File */}
        <Text style={styles.fieldLabel}>Evidence File</Text>
        <TouchableOpacity
          style={styles.dashedUploadBox}
          onPress={handleUploadFile}
          activeOpacity={0.8}
        >
          <UploadFileIcon size={19} color={adminColors.brandDeep} />
          <Text style={styles.uploadBoxText}>
            {evidenceFileName ? evidenceFileName : 'Upload file'}
          </Text>
        </TouchableOpacity>

        {/* Field: Notes */}
        <Text style={styles.fieldLabel}>Notes</Text>
        <View style={styles.textareaWrapper}>
          <TextInput
            style={styles.textareaInput}
            multiline
            placeholder=""
            placeholderTextColor={adminColors.placeholder}
            value={notes}
            onChangeText={setNotes}
          />
          <View style={styles.resizeGripPos}>
            <ResizeGripIcon size={12} color={adminColors.muted} />
          </View>
        </View>

        {/* Action Button: + Add Evidence */}
        <TouchableOpacity
          style={styles.addEvidenceBtn}
          onPress={handleAddEvidence}
          activeOpacity={0.85}
        >
          <Text style={styles.addEvidenceBtnText}>+ Add Evidence</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ─── Fixed Bottom Action Button ─── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.submitReviewBtn}
          onPress={handleSubmitToReview}
          activeOpacity={0.85}
        >
          <Text style={styles.submitReviewBtnText}>Submit to review</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Preview Document Modal ─── */}
      <Modal
        visible={!!previewDoc}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewDoc(null)}
      >
        <TouchableWithoutFeedback onPress={() => setPreviewDoc(null)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.previewCard}>
                <Text style={styles.previewTitle}>{previewDoc}</Text>
                <Text style={styles.previewSub}>
                  Official audit document on file for {record.id || 'AUD-2026-0042'}.
                </Text>

                <View style={styles.simulatedDocBox}>
                  <FileTextIcon size={42} color={adminColors.brand} />
                  <Text style={styles.simulatedDocText}>Verified & Certified Attachment</Text>
                </View>

                <TouchableOpacity
                  style={styles.previewCloseBtn}
                  onPress={() => setPreviewDoc(null)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.previewCloseBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Stylesheet ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingTop: 10,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    padding: 6,
    marginRight: 10,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    ...adminType.title,
    fontSize: 20,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  headerSubtitleText: {
    ...adminType.caption,
    fontSize: 12.5,
    color: adminColors.onBrand,
    opacity: 0.9,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionHeader: {
    ...adminType.sectionHead,
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: 10,
  },
  docCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    ...adminShadow.sm,
  },
  docLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  docIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docTextWrap: {
    flex: 1,
  },
  docTitle: {
    ...adminType.body,
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.ink,
  },
  docStatus: {
    ...adminType.caption,
    fontSize: 11.5,
    color: adminColors.muted,
    marginTop: 2,
  },
  docButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  docBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: adminColors.brandDeep,
    backgroundColor: adminColors.card,
  },
  docBtnText: {
    ...adminType.caption,
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },
  fieldLabel: {
    ...adminType.body,
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.ink,
    marginTop: 14,
    marginBottom: 6,
  },
  redAsterisk: {
    color: adminColors.danger.text,
  },
  dropdownInput: {
    height: 46,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  dropdownValue: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
  },
  dropdownMenu: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginTop: 4,
    overflow: 'hidden',
    ...adminShadow.md,
  },
  dropdownMenuItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.canvas,
  },
  dropdownMenuItemActive: {
    backgroundColor: adminColors.brandTint,
  },
  dropdownMenuText: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
  },
  dropdownMenuTextActive: {
    color: adminColors.brandDeep,
    fontWeight: '700',
  },
  textareaWrapper: {
    position: 'relative',
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    minHeight: 88,
  },
  textareaInput: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 88,
    textAlignVertical: 'top',
  },
  resizeGripPos: {
    position: 'absolute',
    right: 5,
    bottom: 5,
  },
  dashedUploadBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadBoxText: {
    ...adminType.body,
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
  },
  addEvidenceBtn: {
    height: 48,
    borderRadius: adminRadius.lg,
    borderWidth: 1.5,
    borderColor: adminColors.brandDeep,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  addEvidenceBtnText: {
    ...adminType.body,
    fontSize: 14.5,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: adminColors.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    ...adminShadow.md,
  },
  submitReviewBtn: {
    height: 48,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitReviewBtnText: {
    ...adminType.body,
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.lg,
  },
  previewCard: {
    width: '100%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: 20,
    ...adminShadow.lg,
  },
  previewTitle: {
    ...adminType.title,
    fontSize: 17,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: 6,
  },
  previewSub: {
    ...adminType.caption,
    fontSize: 12.5,
    color: adminColors.muted,
    marginBottom: 16,
  },
  simulatedDocBox: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },
  simulatedDocText: {
    ...adminType.body,
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
  },
  previewCloseBtn: {
    height: 44,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCloseBtnText: {
    ...adminType.body,
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
});
