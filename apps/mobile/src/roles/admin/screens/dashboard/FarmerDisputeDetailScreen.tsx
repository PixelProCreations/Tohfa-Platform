import React, { useState } from 'react';
import {
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

function DocumentFileIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
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

function PhotoAttachmentIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
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

function SlashedProhibitionIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Line x1="5.7" y1="5.7" x2="18.3" y2="18.3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 18, color = adminColors.ink }: { size?: number; color?: string }) {
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

function ClockMilestoneIcon({ size = 16, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 7v5l3 3" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function PencilNoteIcon({ size = 16, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function MailQuestionIcon({ size = 16, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Path d="M22 6l-10 7L2 6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function ShieldLockIcon({ size = 15, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Circle cx="12" cy="11" r="2" fill={color} />
      <Line x1="12" y1="13" x2="12" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function BuildingIcon({ size = 16, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="2" width="16" height="20" rx="2" stroke={color} strokeWidth="1.8" />
      <Path d="M9 22v-4h6v4M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function MapPinIcon({ size = 14, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function ExternalArrowIcon({ size = 15, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14M12 5l7 7-7 7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Status Badge Styling Helper ────────────────────────────────────────────

function getStatusBadgeTheme(status: string) {
  switch (status) {
    case 'Under Review':
      return {
        bg: adminColors.info.bg,
        text: adminColors.info.text,
        border: adminColors.info.border,
      };
    case 'Resolved':
      return {
        bg: adminColors.success.bg,
        text: adminColors.success.text,
        border: adminColors.success.border,
      };
    case 'Escalated':
      return {
        bg: adminColors.danger.bg,
        text: adminColors.danger.text,
        border: adminColors.danger.border,
      };
    case 'Awaiting TOHFA':
    case 'Open':
      return {
        bg: adminColors.warning.bg,
        text: adminColors.warning.text,
        border: adminColors.warning.border,
      };
    default:
      return {
        bg: adminColors.canvas,
        text: adminColors.muted,
        border: adminColors.border,
      };
  }
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
  const [activeInlineAction, setActiveInlineAction] = useState<'add_note' | 'request_info' | 'timeline' | null>(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [viewingAttachment, setViewingAttachment] = useState<string | null>(null);

  const [noteText, setNoteText] = useState('');
  const [noteVisibility, setNoteVisibility] = useState<'Internal only' | 'All Parties'>('Internal only');
  const [showVisibilityPicker, setShowVisibilityPicker] = useState(false);

  const [requestRecipient, setRequestRecipient] = useState<string>('Ramesh Kumar (Farmer)');
  const [showRecipientPicker, setShowRecipientPicker] = useState(false);
  const [requestText, setRequestText] = useState('');
  const [requestReason, setRequestReason] = useState('');

  const [resolutionText, setResolutionText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveNote = () => {
    if (!noteText.trim()) return;
    const newNote = {
      id: `note-${Date.now()}`,
      text: noteText.trim(),
      author: 'Suresh Kumar',
      date: '15 Oct 2026, 15:45',
      isInternal: noteVisibility === 'Internal only',
    };
    setCurrentDispute((prev) => ({
      ...prev,
      adminNotes: [...(prev.adminNotes ?? []), newNote],
    }));
    setNoteText('');
    setActiveInlineAction(null);
    triggerToast('Admin note saved successfully.');
  };

  const handleSendRequest = () => {
    if (!requestText.trim()) return;
    setActiveInlineAction(null);
    setRequestText('');
    setRequestReason('');
    triggerToast(`Information request sent to ${requestRecipient}.`);
  };

  const handleConfirmResolution = () => {
    const note = resolutionText.trim() || 'Settlement reached and approved by mediator.';
    setCurrentDispute((prev) => ({
      ...prev,
      status: 'Resolved',
      lastActivityDate: '15 Oct 2026',
      resolutionNote: note,
    }));
    setShowResolveModal(false);
    onResolveDispute?.(currentDispute.id, note);
    triggerToast(`Dispute ${currentDispute.id} marked as Resolved.`);
  };

  const statusTheme = getStatusBadgeTheme(currentDispute.status);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Terracotta Header ─── */}
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
            <View style={styles.headerSubRow}>
              <Text style={styles.headerSubtitleText}>{currentDispute.id}</Text>
              <View style={styles.headerDot} />
              <View style={styles.headerStatusBadge}>
                <Text style={styles.headerStatusBadgeText}>{currentDispute.status}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* ─── Scrollable Body ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Dispute Overview */}
        <Text style={styles.sectionHeader}>Dispute Overview</Text>
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.fieldLabel}>Dispute ID</Text>
              <Text style={styles.fieldValueId}>{currentDispute.id}</Text>
            </View>
            <View
              style={[
                styles.statusPill,
                { backgroundColor: statusTheme.bg, borderColor: statusTheme.border },
              ]}
            >
              <View style={[styles.statusIndicatorDot, { backgroundColor: statusTheme.text }]} />
              <Text style={[styles.statusPillText, { color: statusTheme.text }]}>
                {currentDispute.status}
              </Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.fullWidthField}>
            <Text style={styles.fieldLabel}>Subject</Text>
            <Text style={styles.fieldValueSubject}>{currentDispute.title}</Text>
          </View>

          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Category</Text>
              <Text style={styles.fieldValue}>{currentDispute.category}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Dispute Type</Text>
              <Text style={styles.fieldValue}>{currentDispute.disputeType || 'Standard'}</Text>
            </View>
          </View>

          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Created</Text>
              <Text style={styles.fieldValue}>{currentDispute.createdDate}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Last Updated</Text>
              <Text style={styles.fieldValue}>{currentDispute.lastActivityDate}</Text>
            </View>
          </View>

          <View style={styles.fullWidthFieldLast}>
            <Text style={styles.fieldLabel}>Assigned Admin</Text>
            <Text style={styles.fieldValue}>{currentDispute.assignedAdmin || 'Suresh Kumar'}</Text>
          </View>
        </View>

        {/* 2. Farmer */}
        <Text style={styles.sectionHeader}>Farmer</Text>
        <View style={styles.card}>
          <View style={styles.farmerTopRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>
                {currentDispute.raisedBy
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.farmerNameText}>{currentDispute.raisedBy}</Text>
              <Text style={styles.farmerIdText}>
                ID: {currentDispute.farmerId || 'FMR-00124'} · Verified
              </Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.twoColRowLast}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Farm</Text>
              <Text style={styles.fieldValue}>
                {currentDispute.farmName || `${currentDispute.raisedBy.split(' ')[0]} Organic Farm`}
              </Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Zone</Text>
              <View style={styles.zoneRow}>
                <MapPinIcon size={14} color={adminColors.muted} />
                <Text style={styles.fieldValue}>{currentDispute.zone || 'Coonoor'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 3. TOHFA */}
        <Text style={styles.sectionHeader}>TOHFA</Text>
        <View style={styles.card}>
          <View style={styles.twoColRowLast}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Department</Text>
              <View style={styles.deptRow}>
                <BuildingIcon size={16} color={adminColors.brand} />
                <Text style={styles.fieldValue}>
                  {currentDispute.tohfaDepartment || currentDispute.otherParty || 'Procurement Team'}
                </Text>
              </View>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Representative</Text>
              <Text style={styles.fieldValue}>{currentDispute.tohfaRepresentative || 'Anitha R'}</Text>
            </View>
          </View>

          <View style={styles.maskedInfoNotice}>
            <ShieldLockIcon size={16} color={adminColors.muted} />
            <Text style={styles.maskedInfoText}>
              Contact details are masked and shown only where you are authorized.
            </Text>
          </View>
        </View>

        {/* 4. Dispute Description */}
        <Text style={styles.sectionHeader}>Dispute Description</Text>
        <View style={styles.card}>
          <View style={styles.complaintBox}>
            <Text style={styles.descriptionBody}>{currentDispute.description}</Text>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Incident Date</Text>
              <Text style={styles.fieldValue}>{currentDispute.incidentDate || '06 Oct 2026'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Linked Record</Text>
              <TouchableOpacity
                style={styles.linkedRecordCard}
                onPress={() => {
                  const raw = currentDispute.linkedRecord || 'PO-2026-00124';
                  const orderId = raw.replace(/^Purchase Order\s+/i, '').trim();
                  onNavigateOrder?.(orderId);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.linkedRecordValue} numberOfLines={1}>
                  {currentDispute.linkedRecord || 'PO-2026-00124'}
                </Text>
                <ExternalArrowIcon size={14} color={adminColors.brandDeep} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.fullWidthFieldLast}>
            <Text style={styles.fieldLabel}>Expected Outcome</Text>
            <Text style={styles.expectedOutcomeText}>
              {currentDispute.expectedOutcome ||
                'A clear explanation of the difference, and a correction if it was a mistake.'}
            </Text>
          </View>
        </View>

        {/* 5. Evidence & Attachments */}
        <Text style={styles.sectionHeader}>Evidence & Attachments</Text>
        <View style={styles.evidenceList}>
          {(
            currentDispute.evidence ?? [
              {
                id: 'ev-1',
                type: 'Document' as const,
                title: 'Payment statement',
                meta: 'Document · 08 Oct 2026 · by Ramesh Kumar',
              },
              {
                id: 'ev-2',
                type: 'Image' as const,
                title: 'Carrot batch photo',
                meta: 'Image · 08 Oct 2026 · by Ramesh Kumar',
              },
            ]
          ).map((ev) => (
            <View key={ev.id} style={styles.attachmentCard}>
              <View style={styles.attachmentIconBox}>
                {ev.type === 'Document' ? (
                  <DocumentFileIcon size={22} color={adminColors.brand} />
                ) : (
                  <PhotoAttachmentIcon size={22} color={adminColors.brand} />
                )}
              </View>
              <View style={styles.attachmentInfo}>
                <Text style={styles.attachmentTitle}>{ev.title}</Text>
                <Text style={styles.attachmentMeta}>{ev.meta}</Text>
              </View>
              <TouchableOpacity
                style={styles.viewLinkBtn}
                onPress={() => setViewingAttachment(ev.title)}
                activeOpacity={0.7}
              >
                <Text style={styles.viewLinkText}>View</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* 6. Admin Notes */}
        <Text style={styles.sectionHeader}>Admin Notes</Text>
        <View style={styles.noteCardAccent}>
          <Text style={styles.descriptionBody}>
            {currentDispute.adminNotes?.[0]?.text ??
              'Spoke to the farmer. The accepted price matches the purchase order; the difference needs a TOHFA explanation.'}
          </Text>
          <View style={styles.noteChipsRow}>
            <View style={styles.noteNeutralChip}>
              <Text style={styles.noteNeutralChipText}>
                {currentDispute.adminNotes?.[0]?.author ?? 'Suresh Kumar'}
              </Text>
            </View>
            <View style={styles.noteNeutralChip}>
              <Text style={styles.noteNeutralChipText}>
                {currentDispute.adminNotes?.[0]?.date ?? '09 Oct 2026, 10:30'}
              </Text>
            </View>
            <View style={styles.noteInternalChip}>
              <ShieldLockIcon size={12} color={adminColors.brandDeep} />
              <Text style={styles.noteInternalChipText}>Internal only</Text>
            </View>
          </View>
        </View>

        {/* 7. Actions */}
        <Text style={styles.sectionHeader}>Actions</Text>
        <View style={styles.actionRowTwo}>
          <TouchableOpacity
            style={styles.actionCardBtn}
            onPress={() => {
              if (onViewTimeline) {
                onViewTimeline(currentDispute);
              } else {
                setActiveInlineAction((prev) => (prev === 'timeline' ? null : 'timeline'));
              }
            }}
            activeOpacity={0.75}
          >
            <ClockMilestoneIcon size={18} color={adminColors.brand} />
            <Text style={styles.actionCardBtnText}>View Timeline</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCardBtn}
            onPress={() => setActiveInlineAction((prev) => (prev === 'add_note' ? null : 'add_note'))}
            activeOpacity={0.75}
          >
            <PencilNoteIcon size={18} color={adminColors.brand} />
            <Text style={styles.actionCardBtnText}>Add Note</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.actionCardBtnFull}
          onPress={() => setActiveInlineAction((prev) => (prev === 'request_info' ? null : 'request_info'))}
          activeOpacity={0.75}
        >
          <MailQuestionIcon size={18} color={adminColors.brand} />
          <Text style={styles.actionCardBtnText}>Request Information</Text>
        </TouchableOpacity>

        {/* Disclaimer Card */}
        <View style={styles.disclaimerBox}>
          <SlashedProhibitionIcon size={18} color={adminColors.muted} />
          <Text style={styles.disclaimerText}>
            The Farmer Admin mediates. Refunds, compensation, penalties, account suspension and
            binding decisions are not available here.
          </Text>
        </View>

        {/* ─── Inline Action: Add Note ─── */}
        {activeInlineAction === 'add_note' && (
          <View style={styles.inlineActionCard}>
            <Text style={styles.inlineActionTitle}>Add Note</Text>

            <View style={styles.inlineTextareaWrapper}>
              <TextInput
                style={styles.inlineTextarea}
                placeholder="Record a mediation note"
                placeholderTextColor={adminColors.placeholder}
                multiline
                numberOfLines={4}
                value={noteText}
                onChangeText={setNoteText}
              />
              <View style={styles.resizeIndicator}>
                <ResizeGripIcon size={12} color={adminColors.muted} />
              </View>
            </View>

            <Text style={styles.inlineFieldLabel}>Visibility</Text>
            <TouchableOpacity
              style={styles.inlineDropdown}
              onPress={() => setShowVisibilityPicker((v) => !v)}
              activeOpacity={0.8}
            >
              <Text style={styles.inlineDropdownText}>{noteVisibility}</Text>
              <ChevronDownIcon size={16} color={adminColors.ink} />
            </TouchableOpacity>
            {showVisibilityPicker && (
              <View style={styles.pickerDropdownMenu}>
                {(['Internal only', 'All Parties'] as const).map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.pickerItem, noteVisibility === opt && styles.pickerItemActive]}
                    onPress={() => {
                      setNoteVisibility(opt);
                      setShowVisibilityPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        noteVisibility === opt && styles.pickerItemTextActive,
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={styles.inlineSaveBtn}
              onPress={handleSaveNote}
              activeOpacity={0.8}
            >
              <Text style={styles.inlineSaveBtnText}>Save Note</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.inlineCancelBtn}
              onPress={() => setActiveInlineAction(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.inlineCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── Inline Action: Request Information ─── */}
        {activeInlineAction === 'request_info' && (
          <View style={styles.inlineActionCard}>
            <Text style={styles.inlineActionTitle}>Request Information</Text>

            <Text style={styles.inlineFieldLabel}>Recipient</Text>
            <TouchableOpacity
              style={styles.inlineDropdown}
              onPress={() => setShowRecipientPicker((v) => !v)}
              activeOpacity={0.8}
            >
              <Text style={styles.inlineDropdownText}>{requestRecipient}</Text>
              <ChevronDownIcon size={16} color={adminColors.ink} />
            </TouchableOpacity>

            {showRecipientPicker && (
              <View style={styles.pickerDropdownMenu}>
                {[
                  'Ramesh Kumar (Farmer)',
                  'Procurement Team (TOHFA)',
                  'Nilgiris Collection Centre',
                ].map((recipient) => (
                  <TouchableOpacity
                    key={recipient}
                    style={[
                      styles.pickerItem,
                      requestRecipient === recipient && styles.pickerItemActive,
                    ]}
                    onPress={() => {
                      setRequestRecipient(recipient);
                      setShowRecipientPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        requestRecipient === recipient && styles.pickerItemTextActive,
                      ]}
                    >
                      {recipient}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.inlineFieldLabel}>
              Information Requested <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View style={styles.inlineTextareaWrapper}>
              <TextInput
                style={styles.inlineTextarea}
                placeholder="Specify information required from the party"
                placeholderTextColor={adminColors.placeholder}
                multiline
                numberOfLines={3}
                value={requestText}
                onChangeText={setRequestText}
              />
              <View style={styles.resizeIndicator}>
                <ResizeGripIcon size={12} color={adminColors.muted} />
              </View>
            </View>

            <Text style={styles.inlineFieldLabel}>Reason for Request (optional)</Text>
            <View style={styles.inlineTextareaWrapper}>
              <TextInput
                style={styles.inlineTextarea}
                placeholder="State reason or context"
                placeholderTextColor={adminColors.placeholder}
                multiline
                numberOfLines={3}
                value={requestReason}
                onChangeText={setRequestReason}
              />
              <View style={styles.resizeIndicator}>
                <ResizeGripIcon size={12} color={adminColors.muted} />
              </View>
            </View>

            <TouchableOpacity
              style={styles.inlineSaveBtn}
              onPress={handleSendRequest}
              activeOpacity={0.8}
            >
              <Text style={styles.inlineSaveBtnText}>Send Request</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.inlineCancelBtn}
              onPress={() => setActiveInlineAction(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.inlineCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ─── Fixed Bottom Bar with Resolve Dispute Action ─── */}
      <View style={styles.fixedBottomBar}>
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
                setShowResolveModal(true);
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
        <Text style={styles.screenIdCaption}>M10-S02 · Dispute Detail</Text>
      </View>

      {/* ─── Resolve Dispute Modal Fallback ─── */}
      <Modal
        visible={showResolveModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowResolveModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowResolveModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalCard}>
                <View style={styles.modalHeaderRow}>
                  <Text style={styles.modalTitle}>Resolve Dispute</Text>
                  <TouchableOpacity
                    onPress={() => setShowResolveModal(false)}
                    style={styles.modalCloseBtn}
                  >
                    <Text style={styles.modalCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalSubtitle}>
                  Confirming mutual resolution for dispute {currentDispute.id}:
                </Text>

                <TextInput
                  style={[styles.noteTextInput, { marginTop: adminSpacing.sm }]}
                  placeholder="Enter settlement summary / agreed outcome..."
                  placeholderTextColor={adminColors.placeholder}
                  multiline
                  numberOfLines={3}
                  value={resolutionText}
                  onChangeText={setResolutionText}
                />

                <View style={styles.modalBtnRow}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setShowResolveModal(false)}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalConfirmBtn, { backgroundColor: adminColors.brand }]}
                    onPress={handleConfirmResolution}
                  >
                    <Text style={styles.modalConfirmText}>Confirm Resolution</Text>
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
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalCard}>
                <View style={styles.modalHeaderRow}>
                  <Text style={styles.modalTitle}>{viewingAttachment}</Text>
                  <TouchableOpacity
                    onPress={() => setViewingAttachment(null)}
                    style={styles.modalCloseBtn}
                  >
                    <Text style={styles.modalCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.attachmentPreviewBox}>
                  <DocumentFileIcon size={48} color={adminColors.brand} />
                  <Text style={styles.attachmentPreviewText}>
                    Verified Document Preview: {viewingAttachment}
                  </Text>
                  <Text style={styles.attachmentPreviewSub}>
                    Attached by {currentDispute.raisedBy} for dispute evidence.
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.modalPrimaryDoneBtn}
                  onPress={() => setViewingAttachment(null)}
                >
                  <Text style={styles.modalPrimaryDoneText}>Close</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ─── Toast Feedback ─── */}
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
    width: 38,
    height: 38,
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
  headerSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
    marginTop: 2,
  },
  headerSubtitleText: {
    ...adminType.caption,
    color: adminColors.onBrand,
    opacity: 0.95,
  },
  headerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: adminColors.onBrand,
    opacity: 0.6,
  },
  headerStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 1.5,
    borderRadius: adminRadius.full,
    backgroundColor: adminOverlay.whitePill,
  },
  headerStatusBadgeText: {
    ...adminType.caption,
    fontSize: 10.5,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xxl,
  },
  sectionHeader: {
    ...adminType.sectionHead,
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.xs,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    marginBottom: adminSpacing.xs,
    ...adminShadow.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardDivider: {
    height: 1,
    backgroundColor: adminColors.canvas,
    marginVertical: adminSpacing.sm,
  },
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.sm,
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
    marginBottom: adminSpacing.sm,
  },
  fullWidthFieldLast: {
    marginBottom: 0,
  },
  fieldLabel: {
    ...adminType.caption,
    fontSize: 11,
    fontWeight: '700',
    color: adminColors.muted,
    marginBottom: 2,
  },
  fieldValue: {
    ...adminType.body,
    fontSize: 13.5,
    fontWeight: '700',
    color: adminColors.ink,
  },
  fieldValueId: {
    ...adminType.rowTitle,
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.ink,
  },
  fieldValueSubject: {
    ...adminType.body,
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.ink,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: adminRadius.full,
    borderWidth: 1,
  },
  statusIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    ...adminType.caption,
    fontSize: 11,
    fontWeight: '700',
  },

  // Farmer Card
  farmerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  avatarInitials: {
    ...adminType.rowTitle,
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.brand,
  },
  farmerNameText: {
    ...adminType.rowTitle,
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.ink,
  },
  farmerIdText: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    marginTop: 1,
  },
  zoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  // TOHFA Card
  deptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  maskedInfoNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    marginTop: adminSpacing.md,
  },
  maskedInfoText: {
    flex: 1,
    ...adminType.caption,
    fontSize: 11.5,
    fontWeight: '600',
    color: adminColors.muted,
  },

  // Description Card
  complaintBox: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    borderLeftWidth: 3,
    borderLeftColor: adminColors.brand,
  },
  descriptionBody: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
    lineHeight: 19,
  },
  linkedRecordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginTop: 2,
  },
  linkedRecordValue: {
    ...adminType.caption,
    fontSize: 12,
    fontWeight: '800',
    color: adminColors.brandDeep,
    flex: 1,
  },
  expectedOutcomeText: {
    ...adminType.body,
    fontSize: 12.5,
    color: adminColors.ink,
    lineHeight: 18,
    marginTop: 2,
  },

  // Evidence
  evidenceList: {
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.xs,
  },
  attachmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    ...adminShadow.sm,
  },
  attachmentIconBox: {
    width: 38,
    height: 38,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: adminSpacing.md,
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentTitle: {
    ...adminType.rowTitle,
    fontSize: 13.5,
    color: adminColors.ink,
  },
  attachmentMeta: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    marginTop: 2,
  },
  viewLinkBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.brand,
    backgroundColor: adminColors.card,
  },
  viewLinkText: {
    ...adminType.caption,
    fontSize: 11.5,
    fontWeight: '700',
    color: adminColors.brand,
  },

  // Admin Notes
  noteCardAccent: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderLeftWidth: 3.5,
    borderLeftColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    marginBottom: adminSpacing.xs,
    ...adminShadow.sm,
  },
  noteChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: adminSpacing.xs,
    marginTop: adminSpacing.sm,
  },
  noteNeutralChip: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  noteNeutralChipText: {
    ...adminType.caption,
    fontSize: 10.5,
    color: adminColors.muted,
    fontWeight: '600',
  },
  noteInternalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  noteInternalChipText: {
    ...adminType.caption,
    fontSize: 10.5,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },

  // Actions
  actionRowTwo: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.sm,
  },
  actionCardBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.xs,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    paddingVertical: 12,
    ...adminShadow.sm,
  },
  actionCardBtnFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.xs,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    paddingVertical: 12,
    marginBottom: adminSpacing.sm,
    ...adminShadow.sm,
  },
  actionCardBtnText: {
    ...adminType.rowTitle,
    fontSize: 13,
    color: adminColors.ink,
    fontWeight: '700',
  },

  // Disclaimer Box
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: adminSpacing.sm,
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginTop: adminSpacing.xs,
    marginBottom: adminSpacing.md,
  },
  disclaimerText: {
    flex: 1,
    ...adminType.caption,
    fontSize: 11.5,
    color: adminColors.muted,
    lineHeight: 16,
  },

  // Inline Forms
  inlineActionCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.brand,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.lg,
    ...adminShadow.md,
  },
  inlineActionTitle: {
    ...adminType.rowTitle,
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: adminSpacing.sm,
  },
  inlineFieldLabel: {
    ...adminType.caption,
    fontSize: 11.5,
    fontWeight: '700',
    color: adminColors.ink,
    marginTop: adminSpacing.xs,
    marginBottom: 4,
  },
  requiredStar: {
    color: adminColors.danger.text,
  },
  inlineTextareaWrapper: {
    position: 'relative',
    backgroundColor: adminColors.canvas,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    marginBottom: adminSpacing.sm,
  },
  inlineTextarea: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
    minHeight: 70,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    textAlignVertical: 'top',
  },
  resizeIndicator: {
    position: 'absolute',
    right: 4,
    bottom: 4,
  },
  inlineDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.canvas,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 10,
    marginBottom: adminSpacing.sm,
  },
  inlineDropdownText: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
  },
  pickerDropdownMenu: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.sm,
    overflow: 'hidden',
    ...adminShadow.sm,
  },
  pickerItem: {
    paddingVertical: 10,
    paddingHorizontal: adminSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.canvas,
  },
  pickerItemActive: {
    backgroundColor: adminColors.brandTint,
  },
  pickerItemText: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
  },
  pickerItemTextActive: {
    color: adminColors.brand,
    fontWeight: '700',
  },
  inlineSaveBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: adminSpacing.xs,
  },
  inlineSaveBtnText: {
    ...adminType.rowTitle,
    fontSize: 13.5,
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  inlineCancelBtn: {
    backgroundColor: 'transparent',
    borderRadius: adminRadius.md,
    paddingVertical: 9,
    alignItems: 'center',
    marginTop: 4,
  },
  inlineCancelBtnText: {
    ...adminType.caption,
    fontSize: 12.5,
    color: adminColors.muted,
  },

  // Fixed Bottom Bar
  fixedBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: adminColors.canvas,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    ...adminShadow.md,
  },
  resolvePrimaryBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: 13,
    alignItems: 'center',
  },
  resolveBtnDisabled: {
    backgroundColor: adminColors.border,
    opacity: 0.7,
  },
  resolvePrimaryBtnText: {
    ...adminType.rowTitle,
    fontSize: 14,
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  screenIdCaption: {
    ...adminType.caption,
    fontSize: 10.5,
    color: adminColors.muted,
    textAlign: 'center',
    marginTop: 4,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.lg,
  },
  modalCard: {
    width: '100%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    ...adminShadow.lg,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.sm,
  },
  modalTitle: {
    ...adminType.rowTitle,
    fontSize: 16,
    color: adminColors.ink,
    fontWeight: '800',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 18,
    color: adminColors.muted,
    fontWeight: '700',
  },
  modalSubtitle: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.muted,
    marginBottom: adminSpacing.xs,
  },
  noteTextInput: {
    backgroundColor: adminColors.canvas,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    marginTop: adminSpacing.md,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
  },
  modalCancelText: {
    ...adminType.caption,
    fontSize: 13,
    color: adminColors.ink,
    fontWeight: '700',
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: adminRadius.md,
    alignItems: 'center',
  },
  modalConfirmText: {
    ...adminType.caption,
    fontSize: 13,
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  attachmentPreviewBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.xl,
    marginVertical: adminSpacing.md,
  },
  attachmentPreviewText: {
    ...adminType.rowTitle,
    fontSize: 14,
    color: adminColors.ink,
    marginTop: adminSpacing.sm,
  },
  attachmentPreviewSub: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    textAlign: 'center',
    marginTop: 2,
  },
  modalPrimaryDoneBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: 11,
    alignItems: 'center',
  },
  modalPrimaryDoneText: {
    ...adminType.rowTitle,
    fontSize: 13.5,
    color: adminColors.onBrand,
    fontWeight: '700',
  },

  // Toast
  toastContainer: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: adminColors.toast.bg,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.sm,
    borderRadius: adminRadius.full,
    zIndex: 999,
    ...adminShadow.md,
  },
  toastText: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.toast.text,
    fontWeight: '700',
  },
});
