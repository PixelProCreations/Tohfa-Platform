import React, { useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar } from '@tohfa/mobile-ui';

import { adminColors, adminOverlay, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';
import type { IncidentItem } from './FarmerPestIncidentsScreen';
import {
  BackArrowIcon,
  LockIcon,
  ChevronDownIcon,
} from './inputsIcons';

export interface PestIncidentDetailScreenProps {
  incident?: IncidentItem | undefined;
  linkedPestName?: string | undefined;
  linkedTreatmentName?: string | undefined;
  onBack: () => void;
  onViewFarmer?: () => void;
  onViewPest?: () => void;
  onViewApplicationGuide?: () => void;
  onOpenFilters?: () => void;
}

export function PestIncidentDetailScreen({
  incident,
  linkedPestName: _linkedPestName,
  linkedTreatmentName: _linkedTreatmentName,
  onBack,
}: PestIncidentDetailScreenProps): React.JSX.Element {
  const displayId =
    incident?.displayId ?? (incident?.id === 'PI-0101' ? 'PI-2026-0007' : (incident?.id ?? 'PI-2026-0007'));

  const displayFarmer = incident?.farmer ?? 'Ramesh Kumar';
  const displayCrop = incident?.crop ?? 'Tomato';
  const displayReportId = incident?.displayReportId ?? 'INC-2026-0007';
  const displayReportedTime = '13 Oct 2026, 08:30';
  const displayPlot = 'PLT-00124-1';
  const displayField = `${displayCrop} · Field 1`;
  const displayGrowthStage = 'Not provided';
  const displayFarmerDesc = 'Demo farmer report (placeholder).';
  const displayPhotos = 'none uploaded';

  const [linkedPest, setLinkedPest] = useState<string>('Not linked');
  const [selectedPestDraft, setSelectedPestDraft] = useState<string>('');
  const [isPestDropdownOpen, setIsPestDropdownOpen] = useState(false);

  const [identificationNotes, setIdentificationNotes] = useState<string>('—');
  const [linkedTreatment, setLinkedTreatment] = useState<string>('None linked');
  const [selectedTreatmentDraft, setSelectedTreatmentDraft] = useState<string>('');
  const [isTreatmentDropdownOpen, setIsTreatmentDropdownOpen] = useState(false);

  const [status] = useState<string>('Ongoing');
  const [resolutionNotes, setResolutionNotes] = useState<string>('—');
  const [historyList, setHistoryList] = useState<Array<{ date: string; author: string; note: string }>>([
    {
      date: '13 Oct 2026, 08:30',
      author: displayFarmer,
      note: 'Reported: Incident reported by the farmer',
    },
  ]);

  const [showPestModal, setShowPestModal] = useState(false);
  const [showTreatmentModal, setShowTreatmentModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewNoteInput, setReviewNoteInput] = useState('');

  const tomatoPestOptions = [
    'Aphid (Aphidoidea)',
    'Tomato Fruit Borer (Helicoverpa armigera)',
    'Whitefly (Bemisia tabaci)',
    'Early Blight (Alternaria solani)',
  ];

  const treatmentOptions = [
    'TG-001 · Neem Oil Extract 3% (Foliar Spray)',
    'TG-004 · Bt (Bacillus thuringiensis) Spray',
    'TG-009 · Sticky Yellow Traps & Pheromones',
    'TG-012 · Copper Oxychloride 50 WP',
  ];

  const handleOpenPestModal = () => {
    setSelectedPestDraft(linkedPest !== 'Not linked' ? linkedPest : '');
    setIsPestDropdownOpen(false);
    setShowPestModal(true);
  };

  const handleConfirmLinkPest = () => {
    if (selectedPestDraft) {
      setLinkedPest(selectedPestDraft);
      setIdentificationNotes(`Catalog confirmed: ${selectedPestDraft}`);
    }
    setShowPestModal(false);
  };

  const handleOpenTreatmentModal = () => {
    setSelectedTreatmentDraft(linkedTreatment !== 'None linked' ? linkedTreatment : '');
    setIsTreatmentDropdownOpen(false);
    setShowTreatmentModal(true);
  };

  const handleConfirmLinkTreatment = () => {
    if (selectedTreatmentDraft && linkedPest !== 'Not linked') {
      setLinkedTreatment(selectedTreatmentDraft);
    }
    setShowTreatmentModal(false);
  };

  const handleSaveReviewNote = () => {
    if (!reviewNoteInput.trim()) return;
    const now = '16 Oct 2026, 12:15';
    setResolutionNotes(reviewNoteInput.trim());
    setHistoryList((prev) => [
      ...prev,
      {
        date: now,
        author: 'TOHFA Admin',
        note: `Review note: ${reviewNoteInput.trim()}`,
      },
    ]);
    setReviewNoteInput('');
    setShowReviewModal(false);
  };

  return (
    <View style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{displayId}</Text>
        </View>

        <Text style={styles.headerSubtitle}>
          {displayFarmer} · {displayCrop}
        </Text>
      </View>

      {/* Scroll Container */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* 1 · Report information */}
        <Text style={styles.sectionHeading}>1 · Report information</Text>
        <View style={styles.card}>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Incident</Text>
            <Text style={styles.tableValueBold}>{displayReportId}</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Reported</Text>
            <Text style={styles.tableValueBold}>{displayReportedTime}</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Farmer and farm</Text>
            <Text style={styles.tableValueBold}>
              {displayFarmer} · {displayPlot}
            </Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Crop and field</Text>
            <Text style={styles.tableValueBold}>{displayField}</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Growth stage</Text>
            <Text style={styles.tableValueBold}>{displayGrowthStage}</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Farmer's description</Text>
            <Text style={styles.tableValueBold}>{displayFarmerDesc}</Text>
          </View>

          <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.tableLabel}>Photos</Text>
            <Text style={styles.tableValueBold}>{displayPhotos}</Text>
          </View>
        </View>

        {/* 2 · Identification */}
        <Text style={styles.sectionHeading}>2 · Identification</Text>
        <View style={styles.card}>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Pest or disease</Text>
            <Text style={styles.tableValueBold}>{linkedPest}</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Severity (as reported)</Text>
            <Text style={styles.tableValueBold}>Medium</Text>
          </View>

          <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.tableLabel}>Identification notes</Text>
            <Text style={styles.tableValueBold}>{identificationNotes}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.outlineActionBtn}
          onPress={handleOpenPestModal}
          activeOpacity={0.8}
        >
          <Text style={styles.outlineActionBtnText}>Link Pest / Disease</Text>
        </TouchableOpacity>

        {/* 3 · Treatment */}
        <Text style={styles.sectionHeading}>3 · Treatment</Text>
        <View style={styles.card}>
          <View style={styles.tableRowTreatment}>
            <Text style={styles.tableLabel}>Linked treatment guide</Text>
            <Text style={styles.tableValueBold}>{linkedTreatment}</Text>
          </View>
          <Text style={styles.treatmentHint}>
            Link a pest or disease to see the guides for it.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.outlineActionBtn}
          onPress={handleOpenTreatmentModal}
          activeOpacity={0.8}
        >
          <Text style={styles.outlineActionBtnText}>Link Treatment Guide</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.followUpTitle}>Follow-up from the farmer</Text>
          <Text style={styles.followUpText}>No follow-up has been submitted.</Text>
        </View>

        {/* 4 · Resolution */}
        <Text style={styles.sectionHeading}>4 · Resolution</Text>
        <View style={styles.card}>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Status</Text>
            <Text style={styles.tableValueBold}>{status}</Text>
          </View>

          <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.tableLabel}>Resolution notes</Text>
            <Text style={styles.tableValueBold}>{resolutionNotes}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.outlineActionBtn}
          onPress={() => setShowReviewModal(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.outlineActionBtnText}>Record Admin Review Note</Text>
        </TouchableOpacity>

        <Text style={styles.resolutionDisclaimer}>
          Whether the TOHFA Admin may mark an incident resolved is not defined, so only the farmer's follow-up changes the status.
        </Text>

        {/* History */}
        <Text style={styles.sectionHeading}>History</Text>
        {historyList.map((hist, idx) => (
          <View key={idx} style={[styles.card, { marginBottom: 12 }]}>
            <Text style={styles.historyMeta}>
              {hist.date} · {hist.author}
            </Text>
            <Text style={styles.historyNote}>{hist.note}</Text>
          </View>
        ))}

        {/* Append-only card */}
        <View style={styles.appendOnlyCard}>
          <LockIcon size={16} color={adminColors.muted} />
          <Text style={styles.appendOnlyText}>The history is append-only.</Text>
        </View>

        <View style={{ height: 40 }} />
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* POPUP 1: LINK PEST OR DISEASE */}
      <Modal
        visible={showPestModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.popupCard}>
            <Text style={styles.popupTitle}>Link pest or disease</Text>

            <View style={styles.popupInnerSummaryCard}>
              <View style={styles.popupSummaryRow}>
                <Text style={styles.popupSummaryLabel}>Incident</Text>
                <Text style={styles.popupSummaryValue}>{displayReportId}</Text>
              </View>
              <View style={[styles.popupSummaryRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.popupSummaryLabel}>Crop</Text>
                <Text style={styles.popupSummaryValue}>{displayCrop}</Text>
              </View>
            </View>

            <Text style={styles.popupFieldLabel}>
              Pest or disease (published, recorded for this crop){' '}
              <Text style={{ color: adminColors.danger.text }}>*</Text>
            </Text>

            <TouchableOpacity
              style={styles.popupSelectBox}
              onPress={() => setIsPestDropdownOpen(!isPestDropdownOpen)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.popupSelectText,
                  !selectedPestDraft && { color: adminColors.muted },
                ]}
              >
                {selectedPestDraft || 'Select...'}
              </Text>
              <ChevronDownIcon size={18} color={adminColors.ink} />
            </TouchableOpacity>

            {isPestDropdownOpen && (
              <View style={styles.popupDropdownMenu}>
                {tomatoPestOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={styles.popupDropdownOption}
                    onPress={() => {
                      setSelectedPestDraft(opt.split(' (')[0] ?? opt);
                      setIsPestDropdownOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.popupDropdownOptionText}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.popupHelperNote}>
              Only entries recorded for {displayCrop} are offered. Nothing is matched by name.
            </Text>

            <View style={styles.popupActionRow}>
              <TouchableOpacity
                style={styles.popupLinkBtn}
                onPress={handleConfirmLinkPest}
                activeOpacity={0.8}
              >
                <Text style={styles.popupLinkBtnText}>Link</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.popupCancelBtn}
                onPress={() => setShowPestModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.popupCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* POPUP 2: LINK TREATMENT GUIDE */}
      <Modal
        visible={showTreatmentModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTreatmentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.popupCard}>
            <Text style={styles.popupTitle}>Link treatment guide</Text>

            <View style={styles.popupInnerSummaryCard}>
              <View style={styles.popupSummaryRow}>
                <Text style={styles.popupSummaryLabel}>Incident</Text>
                <Text style={styles.popupSummaryValue}>{displayReportId}</Text>
              </View>
              <View style={styles.popupSummaryRow}>
                <Text style={styles.popupSummaryLabel}>Crop</Text>
                <Text style={styles.popupSummaryValue}>{displayCrop}</Text>
              </View>
              <View style={[styles.popupSummaryRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.popupSummaryLabel}>Pest or disease</Text>
                <Text style={styles.popupSummaryValue}>{linkedPest}</Text>
              </View>
            </View>

            {linkedPest === 'Not linked' ? (
              <View style={styles.popupWarningBox}>
                <Text style={styles.popupWarningText}>Link a pest or disease first.</Text>
              </View>
            ) : (
              <>
                <Text style={styles.popupFieldLabel}>
                  Treatment guide{' '}
                  <Text style={{ color: adminColors.danger.text }}>*</Text>
                </Text>

                <TouchableOpacity
                  style={styles.popupSelectBox}
                  onPress={() => setIsTreatmentDropdownOpen(!isTreatmentDropdownOpen)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.popupSelectText,
                      !selectedTreatmentDraft && { color: adminColors.muted },
                    ]}
                  >
                    {selectedTreatmentDraft || 'Select...'}
                  </Text>
                  <ChevronDownIcon size={18} color={adminColors.ink} />
                </TouchableOpacity>

                {isTreatmentDropdownOpen && (
                  <View style={styles.popupDropdownMenu}>
                    {treatmentOptions.map((tOpt) => (
                      <TouchableOpacity
                        key={tOpt}
                        style={styles.popupDropdownOption}
                        onPress={() => {
                          setSelectedTreatmentDraft(tOpt.split(' · ')[1] ?? tOpt);
                          setIsTreatmentDropdownOpen(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.popupDropdownOptionText}>{tOpt}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            )}

            <Text style={styles.popupHelperNote}>
              The guide carries its own verified dosage and timing. None is worked out from the severity.
            </Text>

            <View style={styles.popupActionRow}>
              <TouchableOpacity
                style={styles.popupLinkBtn}
                onPress={handleConfirmLinkTreatment}
                activeOpacity={0.8}
              >
                <Text style={styles.popupLinkBtnText}>Link</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.popupCancelBtn}
                onPress={() => setShowTreatmentModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.popupCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* POPUP 3: RECORD REVIEW NOTE */}
      <Modal
        visible={showReviewModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.popupCard}>
            <Text style={styles.popupTitle}>Record review note</Text>

            <Text style={styles.popupFieldLabel}>
              Review note <Text style={{ color: adminColors.danger.text }}>*</Text>
            </Text>

            <TextInput
              style={styles.popupReviewInput}
              value={reviewNoteInput}
              onChangeText={setReviewNoteInput}
              placeholder=""
              placeholderTextColor={adminColors.placeholder}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <Text style={styles.popupHelperNote}>
              Your name and the time are recorded. The farmer's report is not changed.
            </Text>

            <View style={styles.popupActionRow}>
              <TouchableOpacity
                style={styles.popupLinkBtn}
                onPress={handleSaveReviewNote}
                activeOpacity={0.8}
              >
                <Text style={styles.popupLinkBtnText}>Save Note</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.popupCancelBtn}
                onPress={() => setShowReviewModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.popupCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: Platform.OS === 'android' ? 6 : 8,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    paddingRight: adminSpacing.sm,
    paddingVertical: adminSpacing.xs,
    marginRight: 6,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  headerSubtitle: {
    ...adminType.caption,
    color: adminColors.onBrand,
    opacity: 0.95,
    marginTop: 6,
    paddingLeft: 34,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginTop: 18,
    marginBottom: 8,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  tableRowTreatment: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 6,
  },
  tableLabel: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    flex: 1,
  },
  tableValueBold: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
    textAlign: 'right',
  },
  treatmentHint: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 2,
  },
  outlineActionBtn: {
    backgroundColor: adminColors.card,
    height: 48,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  outlineActionBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brand,
  },
  followUpTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: 4,
  },
  followUpText: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  resolutionDisclaimer: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    lineHeight: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  historyMeta: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: 4,
  },
  historyNote: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },
  appendOnlyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
    gap: 8,
    marginTop: 4,
  },
  appendOnlyText: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  popupCard: {
    backgroundColor: adminColors.card,
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 22,
    width: '100%',
    maxWidth: 400,
    ...adminShadow.lg,
  },
  popupTitle: {
    ...adminType.title,
    color: adminColors.ink,
    marginBottom: 16,
  },
  popupInnerSummaryCard: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  popupSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  popupSummaryLabel: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
  popupSummaryValue: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },
  popupFieldLabel: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 8,
  },
  popupSelectBox: {
    height: 48,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  popupSelectText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  popupDropdownMenu: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginTop: -4,
    marginBottom: 8,
    overflow: 'hidden',
    ...adminShadow.sm,
  },
  popupDropdownOption: {
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  popupDropdownOptionText: {
    ...adminType.body,
    fontWeight: '600',
    color: adminColors.ink,
  },
  popupWarningBox: {
    backgroundColor: adminColors.warning.bg,
    borderRadius: adminRadius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  popupWarningText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.warning.text,
  },
  popupReviewInput: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 12,
    ...adminType.body,
    color: adminColors.ink,
    height: 104,
    marginBottom: 8,
  },
  popupHelperNote: {
    ...adminType.caption,
    color: adminColors.muted,
    lineHeight: 16,
    marginBottom: 20,
  },
  popupActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  popupLinkBtn: {
    flex: 1,
    height: 48,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupLinkBtnText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  popupCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupCancelBtnText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
});
