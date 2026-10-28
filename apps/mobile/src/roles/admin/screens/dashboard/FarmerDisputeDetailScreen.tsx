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
import { type DisputeItem, INITIAL_DISPUTES } from './fixtures';

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

function DocumentFileIcon({ size = 20, color = adminColors.brandDeep }: { size?: number; color?: string }) {
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

function PhotoAttachmentIcon({ size = 20, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="3" stroke={color} strokeWidth="1.8" />
      <Circle cx="8.5" cy="8.5" r="1.5" stroke={color} strokeWidth="1.8" />
      <Path
        d="M21 15l-5-5L5 21"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

function ResizeGripIcon({ size = 12, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Line x1="14" y1="6" x2="6" y2="14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="14" y1="10" x2="10" y2="14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
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

// ─── Component Props ──────────────────────────────────────────────────────────

export interface FarmerDisputeDetailScreenProps {
  dispute?: DisputeItem | undefined;
  onBack: () => void;
  onNavigateOrder?: (orderId: string) => void;
  onResolveDispute?: (disputeId: string, note?: string) => void;
  onViewTimeline?: ((dispute?: DisputeItem) => void) | undefined;
  onNavigateResolve?: ((dispute?: DisputeItem) => void) | undefined;
}

export function FarmerDisputeDetailScreen({
  dispute: propDispute,
  onBack,
  onNavigateOrder,
  onResolveDispute,
  onViewTimeline,
  onNavigateResolve,
}: FarmerDisputeDetailScreenProps) {
  const dispute = propDispute ?? INITIAL_DISPUTES[0]!;

  const [currentDispute, setCurrentDispute] = useState<DisputeItem>(dispute);

  // Modals for Actions matching Image 5
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [showRequestInfoModal, setShowRequestInfoModal] = useState(false);
  const [showResolveConfirmModal, setShowResolveConfirmModal] = useState(false);
  const [viewingAttachment, setViewingAttachment] = useState<string | null>(null);

  // Add Mediation Note State (Image 5 Left: M10-S02a)
  const [noteText, setNoteText] = useState('');
  const [noteVisibility, setNoteVisibility] = useState<'Internal only' | 'Shared with all parties'>('Internal only');
  const [showVisibilityPicker, setShowVisibilityPicker] = useState(false);

  // Request Information State (Image 5 Right: M10-S02b)
  const [requestRecipient, setRequestRecipient] = useState<string>('');
  const [showRecipientPicker, setShowRecipientPicker] = useState(false);
  const [requestText, setRequestText] = useState('');
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [requestInfoStep, setRequestInfoStep] = useState<'form' | 'review'>('form');

  const [resolutionSummary, setResolutionSummary] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveNote = () => {
    if (!noteText.trim()) {
      Alert.alert('Required', 'Please enter a note before saving.');
      return;
    }
    const newNote = {
      id: `note-${Date.now()}`,
      text: noteText.trim(),
      author: 'Suresh Kumar',
      date: '09 Oct 2026, 10:30',
      isInternal: noteVisibility === 'Internal only',
    };
    setCurrentDispute((prev) => ({
      ...prev,
      adminNotes: [newNote, ...(prev.adminNotes ?? [])],
    }));
    setNoteText('');
    setShowAddNoteModal(false);
    triggerToast('Mediation note saved successfully.');
  };

  const handleReviewRequest = () => {
    if (!requestRecipient) {
      Alert.alert('Required', 'Please select a recipient.');
      return;
    }
    if (!requestText.trim()) {
      Alert.alert('Required', 'Please specify the information requested.');
      return;
    }
    setShowRecipientPicker(false);
    setRequestInfoStep('review');
  };

  const handleSendRequest = () => {
    const isFarmer = requestRecipient.toLowerCase().includes('farmer');
    const newStatus = isFarmer ? 'Awaiting Farmer' : 'Awaiting TOHFA';

    setCurrentDispute((prev) => ({
      ...prev,
      status: newStatus,
      lastActivityDate: '09 Oct 2026',
      detailedTimeline: [
        {
          id: `tle-${Date.now()}`,
          type: 'status',
          title: 'Information requested',
          description: `Requested information from ${requestRecipient}: "${requestText.trim()}"`,
          author: 'Suresh Kumar',
          timestamp: '09 Oct 2026, 11:00',
        },
        ...(prev.detailedTimeline ?? []),
      ],
    }));

    setShowRequestInfoModal(false);
    setRequestInfoStep('form');
    triggerToast(`Information request sent to ${requestRecipient}.`);
    setRequestText('');
    setAttachmentName(null);
  };

  const handleCloseRequestModal = () => {
    setShowRequestInfoModal(false);
    setRequestInfoStep('form');
    setShowRecipientPicker(false);
  };

  const handleUploadAttachment = () => {
    Alert.alert('Upload Attachment', 'Select a document or photo to attach to this request.', [
      { text: 'Sample Invoice.pdf', onPress: () => setAttachmentName('Sample Invoice.pdf') },
      { text: 'Inspection Photo.jpg', onPress: () => setAttachmentName('Inspection Photo.jpg') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleConfirmResolution = () => {
    const note = resolutionSummary.trim() || 'Settlement reached and approved by mediator.';
    setCurrentDispute((prev) => ({
      ...prev,
      status: 'Resolved',
      lastActivityDate: '15 Oct 2026',
      resolutionNote: note,
    }));
    setShowResolveConfirmModal(false);
    onResolveDispute?.(currentDispute.id, note);
    triggerToast(`Dispute ${currentDispute.id} marked as Resolved.`);
  };

  const evidenceItems = currentDispute.evidence ?? [];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Terracotta Header (Image 3) ─── */}
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
            <Text style={styles.headerTitle}>Dispute Detail</Text>
            <Text style={styles.headerSubtitleText}>
              {currentDispute.id} · {currentDispute.status}
            </Text>
          </View>
        </View>
      </View>

      {/* ─── Scrollable Body (Images 3 & 4) ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Dispute Overview (Image 3) */}
        <Text style={styles.sectionHeader}>Dispute Overview</Text>
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Dispute ID</Text>
              <Text style={styles.fieldValueBold}>{currentDispute.id}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Dispute Type</Text>
              <Text style={styles.fieldValueBold}>{currentDispute.disputeType || ''}</Text>
            </View>
          </View>

          <View style={styles.fullWidthField}>
            <Text style={styles.fieldLabel}>Subject</Text>
            <Text style={styles.fieldValueBold}>{currentDispute.title}</Text>
          </View>

          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Category</Text>
              <Text style={styles.fieldValueBold}>{currentDispute.category}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Status</Text>
              <Text style={styles.fieldValueBold}>{currentDispute.status}</Text>
            </View>
          </View>

          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Created</Text>
              <Text style={styles.fieldValueBold}>{currentDispute.createdDate}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Last Updated</Text>
              <Text style={styles.fieldValueBold}>{currentDispute.lastActivityDate}</Text>
            </View>
          </View>

          <View style={styles.fullWidthFieldLast}>
            <Text style={styles.fieldLabel}>Assigned Admin</Text>
            <Text style={styles.fieldValueBold}>{currentDispute.assignedAdmin || 'Suresh Kumar'}</Text>
          </View>
        </View>

        {/* 2. Farmer (Image 3) */}
        <Text style={styles.sectionHeader}>Farmer</Text>
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Name</Text>
              <Text style={styles.fieldValueBold}>{currentDispute.raisedBy}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Farmer ID</Text>
              <Text style={styles.fieldValueBold}>{currentDispute.farmerId || 'FMR-00124'}</Text>
            </View>
          </View>

          <View style={styles.twoColRowLast}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Farm</Text>
              <Text style={styles.fieldValueBold}>
                {currentDispute.farmName || 'Ramesh Organic Farm'}
              </Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Zone</Text>
              <Text style={styles.fieldValueBold}>{currentDispute.zone || 'Coonoor'}</Text>
            </View>
          </View>
        </View>

        {/* 3. TOHFA (Image 3) */}
        <Text style={styles.sectionHeader}>TOHFA</Text>
        <View style={styles.card}>
          <View style={styles.twoColRowLast}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Department</Text>
              <Text style={styles.fieldValueBold}>
                {currentDispute.tohfaDepartment || 'Procurement Team'}
              </Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Representative</Text>
              <Text style={styles.fieldValueBold}>
                {currentDispute.tohfaRepresentative || 'Anitha R'}
              </Text>
            </View>
          </View>
        </View>

        {/* Masked Notice Box (Image 3) */}
        <View style={styles.maskedNoticeCard}>
          <Text style={styles.maskedNoticeText}>
            Contact details are masked and shown only where you are authorized.
          </Text>
        </View>

        {/* 4. Dispute Description (Images 3 & 4) */}
        <Text style={styles.sectionHeader}>Dispute Description</Text>
        <View style={styles.card}>
          <Text style={styles.descriptionBodyText}>
            {currentDispute.description || 'Not provided'}
          </Text>
        </View>

        {/* Incident Date & Outcome Card (Image 4) */}
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Incident Date</Text>
              <Text style={styles.fieldValueBold}>{currentDispute.incidentDate || 'Not provided'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Linked Record</Text>
              {currentDispute.linkedRecord ? (
                <TouchableOpacity
                  onPress={() => {
                    const raw = currentDispute.linkedRecord || 'PO-2026-00124';
                    const orderId = raw.replace(/^Purchase Order\s+/i, '').trim();
                    onNavigateOrder?.(orderId);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.linkedRecordUnderlineText}>
                    {currentDispute.linkedRecord}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.fieldValueBold}>Not provided</Text>
              )}
            </View>
          </View>

          <View style={styles.fullWidthFieldLast}>
            <Text style={styles.fieldLabel}>Expected Outcome</Text>
            <Text style={styles.fieldValueRegular}>
              {currentDispute.expectedOutcome || 'Not provided'}
            </Text>
          </View>
        </View>

        {/* 5. Evidence & Attachments (Image 4) */}
        <Text style={styles.sectionHeader}>Evidence & Attachments</Text>
        {evidenceItems.length > 0 ? (
          <View style={styles.evidenceList}>
            {evidenceItems.map((ev) => (
              <View key={ev.id} style={styles.attachmentCard}>
                <View style={styles.attachmentIconBox}>
                  {ev.type === 'Document' ? (
                    <DocumentFileIcon size={20} color={adminColors.brandDeep} />
                  ) : (
                    <PhotoAttachmentIcon size={20} color={adminColors.brandDeep} />
                  )}
                </View>
                <View style={styles.attachmentInfo}>
                  <Text style={styles.attachmentTitle}>{ev.title}</Text>
                  <Text style={styles.attachmentMeta}>{ev.meta}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setViewingAttachment(ev.title)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewLinkText}>View</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.emptyEvidenceText}>No evidence has been attached.</Text>
          </View>
        )}

        {/* 6. Admin Notes (Image 4) */}
        <Text style={styles.sectionHeader}>Admin Notes</Text>
        <View style={styles.card}>
          <Text style={styles.adminNoteBody}>
            {currentDispute.adminNotes?.[0]?.text ??
              'Spoke to the farmer. The accepted price matches the purchase order; the difference needs a TOHFA explanation.'}
          </Text>
          <View style={styles.noteChipsRow}>
            <View style={styles.neutralChip}>
              <Text style={styles.neutralChipText}>
                {currentDispute.adminNotes?.[0]?.author ?? 'Suresh Kumar'}
              </Text>
            </View>
            <View style={styles.neutralChip}>
              <Text style={styles.neutralChipText}>
                {currentDispute.adminNotes?.[0]?.date ?? '09 Oct 2026, 10:30'}
              </Text>
            </View>
            <View style={styles.internalBlueChip}>
              <Text style={styles.internalBlueChipText}>Internal only</Text>
            </View>
          </View>
        </View>

        {/* 7. Actions (Image 4) */}
        <Text style={styles.sectionHeader}>Actions</Text>
        <View style={styles.actionsTopRow}>
          <TouchableOpacity
            style={styles.outlineActionBtn}
            onPress={() => {
              if (onViewTimeline) {
                onViewTimeline(currentDispute);
              } else {
                Alert.alert('Timeline', `Opening timeline for dispute ${currentDispute.id}`);
              }
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.outlineActionBtnText}>View Timeline</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.outlineActionBtn}
            onPress={() => setShowAddNoteModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.outlineActionBtnText}>Add Note</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.fullOutlineActionBtn}
          onPress={() => {
            setRequestInfoStep('form');
            setShowRequestInfoModal(true);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.outlineActionBtnText}>Request Information</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.resolvePrimaryBtn,
            currentDispute.status === 'Resolved' && styles.resolveBtnDisabled,
          ]}
          onPress={() => {
            if (currentDispute.status !== 'Resolved') {
              if (onNavigateResolve) {
                onNavigateResolve(currentDispute);
              } else {
                setShowResolveConfirmModal(true);
              }
            }
          }}
          activeOpacity={0.85}
          disabled={currentDispute.status === 'Resolved'}
        >
          <Text style={styles.resolvePrimaryBtnText}>
            {currentDispute.status === 'Resolved' ? 'Dispute Resolved' : 'Resolve Dispute'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ─── POPUP 1: Add Mediation Note Popup (Image 5 Left: M10-S02a) ─── */}
      <Modal
        visible={showAddNoteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddNoteModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowAddNoteModal(false)}>
          <View style={styles.bottomSheetOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.bottomSheetCard}>
                <Text style={styles.bottomSheetTitle}>Add Mediation Note</Text>

                <Text style={styles.sheetLabel}>
                  Note <Text style={styles.redAsterisk}>*</Text>
                </Text>
                <View style={styles.textareaWrapper}>
                  <TextInput
                    style={styles.sheetTextarea}
                    placeholder="Record a mediation note"
                    placeholderTextColor={adminColors.placeholder}
                    multiline
                    value={noteText}
                    onChangeText={setNoteText}
                  />
                  <View style={styles.resizeGripPos}>
                    <ResizeGripIcon size={12} color={adminColors.muted} />
                  </View>
                </View>

                <Text style={styles.sheetLabel}>Visibility</Text>
                <TouchableOpacity
                  style={styles.sheetDropdown}
                  onPress={() => setShowVisibilityPicker((v) => !v)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.sheetDropdownText}>{noteVisibility}</Text>
                  <ChevronDownIcon size={16} color={adminColors.ink} />
                </TouchableOpacity>

                {showVisibilityPicker && (
                  <View style={styles.dropdownMenu}>
                    {(['Internal only', 'Shared with all parties'] as const).map((opt) => (
                      <TouchableOpacity
                        key={opt}
                        style={[
                          styles.dropdownItem,
                          noteVisibility === opt && styles.dropdownItemActive,
                        ]}
                        onPress={() => {
                          setNoteVisibility(opt);
                          setShowVisibilityPicker(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            noteVisibility === opt && styles.dropdownItemTextActive,
                          ]}
                        >
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <Text style={styles.sheetHelpText}>
                  Internal notes are visible only to admins. Shared notes are marked as shared on the record.
                </Text>

                <View style={styles.sheetButtonsRow}>
                  <TouchableOpacity
                    style={styles.sheetButton}
                    onPress={handleSaveNote}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.sheetButtonText}>Save Note</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.sheetButton}
                    onPress={() => setShowAddNoteModal(false)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.sheetButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ─── POPUP 2: Request Information & Review Request Popup ─── */}
      <Modal
        visible={showRequestInfoModal}
        transparent
        animationType="slide"
        onRequestClose={handleCloseRequestModal}
      >
        <TouchableWithoutFeedback onPress={handleCloseRequestModal}>
          <View style={styles.bottomSheetOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.bottomSheetCard}>
                {requestInfoStep === 'form' ? (
                  <>
                    <Text style={styles.bottomSheetTitle}>Request Information</Text>

                    <Text style={styles.sheetLabel}>
                      Recipient <Text style={styles.redAsterisk}>*</Text>
                    </Text>
                    <TouchableOpacity
                      style={styles.sheetDropdown}
                      onPress={() => setShowRecipientPicker((v) => !v)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.sheetDropdownText,
                          !requestRecipient && { color: adminColors.placeholder },
                        ]}
                      >
                        {requestRecipient || 'Select a recipient'}
                      </Text>
                      <ChevronDownIcon size={16} color={adminColors.ink} />
                    </TouchableOpacity>

                    {showRecipientPicker && (
                      <View style={styles.dropdownMenu}>
                        {[
                          'TOHFA (no department assigned) (TOHFA)',
                          `${currentDispute.raisedBy || 'Ramesh Kumar'} (Farmer)`,
                          'Procurement Team (TOHFA)',
                          'Collection Team (TOHFA)',
                          'Quality Control Team (TOHFA)',
                        ].map((rec) => (
                          <TouchableOpacity
                            key={rec}
                            style={[
                              styles.dropdownItem,
                              requestRecipient === rec && styles.dropdownItemActive,
                            ]}
                            onPress={() => {
                              setRequestRecipient(rec);
                              setShowRecipientPicker(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.dropdownItemText,
                                requestRecipient === rec && styles.dropdownItemTextActive,
                              ]}
                            >
                              {rec}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    <Text style={styles.sheetLabel}>
                      Information requested <Text style={styles.redAsterisk}>*</Text>
                    </Text>
                    <View style={styles.textareaWrapper}>
                      <TextInput
                        style={styles.sheetTextarea}
                        placeholder=""
                        placeholderTextColor={adminColors.placeholder}
                        multiline
                        value={requestText}
                        onChangeText={setRequestText}
                      />
                      <View style={styles.resizeGripPos}>
                        <ResizeGripIcon size={12} color={adminColors.muted} />
                      </View>
                    </View>

                    <Text style={styles.sheetLabel}>Supporting attachment (optional)</Text>
                    <TouchableOpacity
                      style={styles.dashedUploadBox}
                      onPress={handleUploadAttachment}
                      activeOpacity={0.75}
                    >
                      <UploadFileIcon size={18} color={adminColors.brandDeep} />
                      <Text style={styles.uploadBoxText}>
                        {attachmentName ? attachmentName : 'Upload file'}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.sheetButtonsRow}>
                      <TouchableOpacity
                        style={styles.sheetButton}
                        onPress={handleReviewRequest}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.sheetButtonText}>Review Request</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.sheetButton}
                        onPress={handleCloseRequestModal}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.sheetButtonText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={styles.bottomSheetTitle}>Review Request</Text>

                    <View style={styles.reviewCard}>
                      <Text style={styles.reviewLabel}>Recipient</Text>
                      <Text style={styles.reviewRecipientValue}>{requestRecipient}</Text>

                      <Text style={styles.reviewInfoLabel}>Information requested</Text>
                      <Text style={styles.reviewTextValue}>{requestText}</Text>

                      {attachmentName ? (
                        <>
                          <Text style={styles.reviewAttachmentLabel}>Supporting attachment</Text>
                          <Text style={styles.reviewAttachmentValue}>{attachmentName}</Text>
                        </>
                      ) : null}
                    </View>

                    <Text style={styles.reviewNoticeText}>
                      Sent through the existing notification system. The dispute moves to{' '}
                      <Text style={styles.reviewNoticeAwaiting}>Awaiting</Text>{' '}
                      <Text style={styles.reviewNoticeRule}>
                        {requestRecipient.toLowerCase().includes('farmer')
                          ? 'Farmer (proposed rule)'
                          : 'TOHFA (proposed rule)'}
                      </Text>
                      .
                    </Text>

                    <View style={styles.reviewButtonsRow}>
                      <TouchableOpacity
                        style={styles.reviewBtn}
                        onPress={handleSendRequest}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.reviewBtnText}>Send Request</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.reviewBtn}
                        onPress={() => setRequestInfoStep('form')}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.reviewBtnText}>Back to Edit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.reviewBtn}
                        onPress={handleCloseRequestModal}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.reviewBtnText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ─── Resolve Dispute Confirmation Modal (Fallback) ─── */}
      <Modal
        visible={showResolveConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowResolveConfirmModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowResolveConfirmModal(false)}>
          <View style={styles.centerModalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.centerModalCard}>
                <Text style={styles.modalTitle}>Resolve Dispute</Text>
                <Text style={styles.modalSubtitle}>
                  Confirming mutual resolution for dispute {currentDispute.id}:
                </Text>

                <TextInput
                  style={styles.resolveTextInput}
                  placeholder="Enter settlement summary / agreed outcome..."
                  placeholderTextColor={adminColors.placeholder}
                  multiline
                  numberOfLines={3}
                  value={resolutionSummary}
                  onChangeText={setResolutionSummary}
                />

                <View style={styles.sheetButtonsRow}>
                  <TouchableOpacity
                    style={styles.sheetButton}
                    onPress={handleConfirmResolution}
                  >
                    <Text style={[styles.sheetButtonText, { color: adminColors.brandDeep }]}>
                      Confirm Resolution
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.sheetButton}
                    onPress={() => setShowResolveConfirmModal(false)}
                  >
                    <Text style={styles.sheetButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ─── Attachment Viewer Modal ─── */}
      <Modal
        visible={viewingAttachment !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setViewingAttachment(null)}
      >
        <TouchableWithoutFeedback onPress={() => setViewingAttachment(null)}>
          <View style={styles.centerModalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.centerModalCard}>
                <Text style={styles.modalTitle}>{viewingAttachment}</Text>
                <View style={styles.attachmentPreviewBox}>
                  <DocumentFileIcon size={44} color={adminColors.brandDeep} />
                  <Text style={styles.attachmentPreviewText}>
                    Verified Document Preview: {viewingAttachment}
                  </Text>
                  <Text style={styles.attachmentPreviewSub}>
                    Attached by {currentDispute.raisedBy} for dispute evidence.
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.sheetButton}
                  onPress={() => setViewingAttachment(null)}
                >
                  <Text style={styles.sheetButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ─── Feedback Toast ─── */}
      {toastMessage && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Stylesheet ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -adminSpacing.xs,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.2,
  },
  headerSubtitleText: {
    ...adminType.caption,
    fontSize: 12,
    fontWeight: '600',
    color: adminColors.onBrand,
    opacity: 0.95,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl,
  },
  sectionHeader: {
    ...adminType.rowTitle,
    fontSize: 14.5,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginTop: 16,
    marginBottom: 8,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    marginBottom: 8,
  },
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  twoColRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  col: {
    flex: 1,
  },
  fullWidthField: {
    marginBottom: 12,
  },
  fullWidthFieldLast: {
    marginBottom: 0,
  },
  fieldLabel: {
    ...adminType.caption,
    fontSize: 11.5,
    fontWeight: '600',
    color: adminColors.muted,
    marginBottom: 3,
  },
  fieldValueBold: {
    ...adminType.body,
    fontSize: 13.5,
    fontWeight: '700',
    color: adminColors.ink,
  },
  fieldValueRegular: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
    lineHeight: 18,
  },
  maskedNoticeCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 12,
    marginBottom: 8,
  },
  maskedNoticeText: {
    ...adminType.caption,
    fontSize: 11.5,
    fontWeight: '600',
    color: adminColors.muted,
  },
  descriptionBodyText: {
    ...adminType.body,
    fontSize: 13.5,
    color: adminColors.ink,
    lineHeight: 20,
  },
  linkedRecordUnderlineText: {
    ...adminType.body,
    fontSize: 13.5,
    fontWeight: '700',
    color: adminColors.brandDeep,
    textDecorationLine: 'underline',
  },
  evidenceList: {
    gap: 8,
    marginBottom: 8,
  },
  attachmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 14,
  },
  attachmentIconBox: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: adminSpacing.md,
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentTitle: {
    ...adminType.body,
    fontSize: 13.5,
    fontWeight: '700',
    color: adminColors.ink,
  },
  attachmentMeta: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    marginTop: 2,
  },
  viewLinkText: {
    ...adminType.caption,
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.brandDeep,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  emptyEvidenceText: {
    ...adminType.caption,
    fontSize: 12.5,
    color: adminColors.muted,
    fontStyle: 'italic',
  },
  adminNoteBody: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
    lineHeight: 19,
    marginBottom: 10,
  },
  noteChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  neutralChip: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  neutralChipText: {
    ...adminType.caption,
    fontSize: 11,
    fontWeight: '700',
    color: adminColors.ink,
  },
  internalBlueChip: {
    backgroundColor: adminColors.info.bg,
    borderRadius: adminRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  internalBlueChipText: {
    ...adminType.caption,
    fontSize: 11,
    fontWeight: '700',
    color: adminColors.info.text,
  },
  actionsTopRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  outlineActionBtn: {
    flex: 1,
    height: 46,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1.5,
    borderColor: adminColors.brandDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullOutlineActionBtn: {
    height: 46,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1.5,
    borderColor: adminColors.brandDeep,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  outlineActionBtnText: {
    ...adminType.body,
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  resolvePrimaryBtn: {
    height: 48,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  resolveBtnDisabled: {
    opacity: 0.6,
  },
  resolvePrimaryBtnText: {
    ...adminType.body,
    fontSize: 14.5,
    fontWeight: '800',
    color: adminColors.onBrand,
  },

  // Bottom Sheet Modal (Image 5)
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'flex-end',
  },
  bottomSheetCard: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 32,
    ...adminShadow.lg,
  },
  bottomSheetTitle: {
    ...adminType.title,
    fontSize: 18,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: 16,
  },
  sheetLabel: {
    ...adminType.body,
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.ink,
    marginTop: 12,
    marginBottom: 6,
  },
  redAsterisk: {
    color: adminColors.danger.text,
  },
  textareaWrapper: {
    position: 'relative',
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    minHeight: 88,
  },
  sheetTextarea: {
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
  sheetDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: 14,
    height: 46,
  },
  sheetDropdownText: {
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
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.canvas,
  },
  dropdownItemActive: {
    backgroundColor: adminColors.brandTint,
  },
  dropdownItemText: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
  },
  dropdownItemTextActive: {
    color: adminColors.brandDeep,
    fontWeight: '700',
  },
  sheetHelpText: {
    ...adminType.caption,
    fontSize: 11.5,
    color: adminColors.muted,
    lineHeight: 16,
    marginTop: 8,
  },
  dashedUploadBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderStyle: 'dashed',
    borderRadius: adminRadius.md,
    paddingVertical: 14,
    backgroundColor: adminColors.card,
  },
  uploadBoxText: {
    ...adminType.body,
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
  },
  sheetButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  sheetButton: {
    flex: 1,
    height: 44,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetButtonText: {
    ...adminType.body,
    fontSize: 13.5,
    fontWeight: '700',
    color: adminColors.ink,
  },

  // Review Request Step (Screen 2 within the same modal)
  reviewCard: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.lg,
    padding: 16,
    marginBottom: 16,
  },
  reviewLabel: {
    ...adminType.body,
    fontSize: 12.5,
    fontWeight: '600',
    color: adminColors.muted,
    marginBottom: 4,
  },
  reviewRecipientValue: {
    ...adminType.body,
    fontSize: 15.5,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: 16,
  },
  reviewInfoLabel: {
    ...adminType.body,
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0D7A74',
    marginBottom: 4,
  },
  reviewTextValue: {
    ...adminType.body,
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.ink,
    lineHeight: 21,
  },
  reviewAttachmentLabel: {
    ...adminType.body,
    fontSize: 12.5,
    fontWeight: '600',
    color: adminColors.muted,
    marginTop: 14,
    marginBottom: 4,
  },
  reviewAttachmentValue: {
    ...adminType.body,
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
  },
  reviewNoticeText: {
    ...adminType.body,
    fontSize: 12,
    color: adminColors.muted,
    lineHeight: 18,
    marginBottom: 20,
  },
  reviewNoticeAwaiting: {
    color: adminColors.brand,
    fontWeight: '700',
  },
  reviewNoticeRule: {
    color: adminColors.info.text,
    fontWeight: '700',
  },
  reviewButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  reviewBtn: {
    flex: 1,
    height: 44,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  reviewBtnText: {
    ...adminType.body,
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
    textAlign: 'center',
  },

  // Center Modal Fallback
  centerModalOverlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.lg,
  },
  centerModalCard: {
    width: '100%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    ...adminShadow.lg,
  },
  modalTitle: {
    ...adminType.rowTitle,
    fontSize: 16,
    color: adminColors.ink,
    fontWeight: '800',
    marginBottom: 6,
  },
  modalSubtitle: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.muted,
    marginBottom: 10,
  },
  resolveTextInput: {
    backgroundColor: adminColors.canvas,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    padding: 10,
    minHeight: 70,
    textAlignVertical: 'top',
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
    marginBottom: 10,
  },
  attachmentPreviewBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  attachmentPreviewText: {
    ...adminType.body,
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
    marginTop: 10,
    textAlign: 'center',
  },
  attachmentPreviewSub: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
    marginTop: 4,
    textAlign: 'center',
  },

  // Toast
  toastContainer: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: adminColors.ink,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: adminRadius.full,
    ...adminShadow.md,
  },
  toastText: {
    ...adminType.caption,
    fontSize: 12,
    fontWeight: '600',
    color: adminColors.card,
  },
});
