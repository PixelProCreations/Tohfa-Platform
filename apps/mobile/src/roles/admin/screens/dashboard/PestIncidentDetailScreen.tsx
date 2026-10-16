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
  View,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { adminColors, adminOverlay, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';
import { IncidentItem } from './FarmerPestIncidentsScreen';

// ─── Icons ───────────────────────────────────────────────────────────────────

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

function LockIcon({ size = 16, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="4"
        y="10"
        width="16"
        height="12"
        rx="2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7 10V7a5 5 0 0 1 10 0v3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronDownIcon({ size = 18, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9l6 6 6-6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Component Props ──────────────────────────────────────────────────────────

export interface PestIncidentDetailScreenProps {
  incident?: IncidentItem | undefined;
  onBack: () => void;
  onViewPest?: () => void;
  onViewApplicationGuide?: () => void;
}

export function PestIncidentDetailScreen({
  incident,
  onBack,
}: PestIncidentDetailScreenProps) {
  // Determine display values matching Screenshots 1, 2, 3
  const displayId = incident?.id
    ? incident.id === 'PEST-00421'
      ? 'INC-2026-0007'
      : incident.id
    : 'INC-2026-0007';

  const displayFarmer = incident?.farmer ?? 'Ramesh Kumar';
  const displayCrop = incident?.crop === 'Carrot' ? 'Tomato' : (incident?.crop ?? 'Tomato');
  const displayReportId = displayId;
  const displayReportedTime = '13 Oct 2026, 08:30';
  const displayPlot = 'PLT-00124-1';
  const displayField = `${displayCrop} · Field 1`;
  const displayGrowthStage = 'Not provided';
  const displayFarmerDesc = 'Demo farmer report (placeholder).';
  const displayPhotos = 'none uploaded';

  // Interactive state
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

  // Modal open states
  const [showPestModal, setShowPestModal] = useState(false);
  const [showTreatmentModal, setShowTreatmentModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewNoteInput, setReviewNoteInput] = useState('');

  // Pest options for Tomato
  const tomatoPestOptions = [
    'Aphid (Aphidoidea)',
    'Tomato Fruit Borer (Helicoverpa armigera)',
    'Whitefly (Bemisia tabaci)',
    'Early Blight (Alternaria solani)',
  ];

  // Treatment options
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
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header ─── */}
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

      {/* ─── Scroll Container ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 1 · Report information ─── */}
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

        {/* ─── 2 · Identification ─── */}
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

        {/* ─── 3 · Treatment ─── */}
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

        {/* ─── 4 · Resolution ─── */}
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

        {/* ─── History ─── */}
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
      </ScrollView>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* POPUP 1: LINK PEST OR DISEASE (Screenshot 1)                         */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showPestModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.popupCard}>
            {/* Title */}
            <Text style={styles.popupTitle}>Link pest or disease</Text>

            {/* Inner Beige Summary Card */}
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

            {/* Field Label with red asterisk */}
            <Text style={styles.popupFieldLabel}>
              Pest or disease (published, recorded for this crop){' '}
              <Text style={{ color: adminColors.danger.text }}>*</Text>
            </Text>

            {/* Select Dropdown Box */}
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

            {/* Dropdown Options List */}
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

            {/* Caption Note */}
            <Text style={styles.popupHelperNote}>
              Only entries recorded for {displayCrop} are offered. Nothing is matched by name.
            </Text>

            {/* Action Buttons Row */}
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

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* POPUP 2: LINK TREATMENT GUIDE (Screenshot 2)                        */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showTreatmentModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTreatmentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.popupCard}>
            {/* Title */}
            <Text style={styles.popupTitle}>Link treatment guide</Text>

            {/* Inner Beige Summary Card */}
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

            {/* If no pest linked yet, show exact warning box from Screenshot 2 */}
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

            {/* Caption Note */}
            <Text style={styles.popupHelperNote}>
              The guide carries its own verified dosage and timing. None is worked out from the severity.
            </Text>

            {/* Action Buttons Row */}
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

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* POPUP 3: RECORD REVIEW NOTE (Screenshot 3)                          */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showReviewModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.popupCard}>
            {/* Title */}
            <Text style={styles.popupTitle}>Record review note</Text>

            {/* Field Label with red asterisk */}
            <Text style={styles.popupFieldLabel}>
              Review note <Text style={{ color: adminColors.danger.text }}>*</Text>
            </Text>

            {/* Multiline TextInput Box */}
            <TextInput
              style={styles.popupReviewInput}
              value={reviewNoteInput}
              onChangeText={setReviewNoteInput}
              placeholder=""
              placeholderTextColor={adminColors.muted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            {/* Subtext */}
            <Text style={styles.popupHelperNote}>
              Your name and the time are recorded. The farmer's report is not changed.
            </Text>

            {/* Action Buttons Row */}
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
    </SafeAreaView>
  );
}

// ─── Styles (Strictly Conforming to PR #117 Admin Theme Tokens) ───────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },

  // Terracotta Header
  header: {
    backgroundColor: adminColors.brand,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.lg,
    paddingHorizontal: adminSpacing.lg,
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
    fontWeight: '800',
  },
  headerSubtitle: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.onBrand,
    opacity: 0.95,
    marginTop: 6,
    fontWeight: '500',
    paddingLeft: 34,
  },

  // Scroll Container
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl,
  },

  // Section Heading
  sectionHeading: {
    ...adminType.sectionHead,
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginTop: 18,
    marginBottom: 8,
  },

  // Cards
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },

  // Table Rows inside Card
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F0ECE4',
  },
  tableRowTreatment: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 6,
  },
  tableLabel: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.muted,
    flex: 1,
  },
  tableValueBold: {
    ...adminType.body,
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
    textAlign: 'right',
  },

  // Treatment hint
  treatmentHint: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
    marginTop: 2,
  },

  // Outline Action Buttons (e.g. 'Link Pest / Disease')
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
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.brand,
  },

  // Follow-up card
  followUpTitle: {
    ...adminType.body,
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: 4,
  },
  followUpText: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
  },

  // Resolution disclaimer
  resolutionDisclaimer: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    lineHeight: 16,
    marginTop: 8,
    marginBottom: 8,
  },

  // History entries
  historyMeta: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    marginBottom: 4,
  },
  historyNote: {
    ...adminType.body,
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.ink,
  },

  // Append-only card
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
    fontSize: 12,
    color: adminColors.muted,
    fontWeight: '500',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // POPUP STYLES (Exact Match to Screenshots 1, 2, 3)
  // ═══════════════════════════════════════════════════════════════════════════

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
    ...adminType.sectionHead,
    fontSize: 18,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: 16,
  },

  // Inner beige card (Screenshots 1 & 2)
  popupInnerSummaryCard: {
    backgroundColor: '#FAF5EE',
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
    borderBottomColor: '#EDE6DB',
  },
  popupSummaryLabel: {
    ...adminType.body,
    fontSize: 13,
    color: '#736B63',
  },
  popupSummaryValue: {
    ...adminType.body,
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
  },

  // Field label
  popupFieldLabel: {
    ...adminType.caption,
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 8,
  },

  // Dropdown select box (Screenshots 1 & 2)
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
    fontSize: 14,
    color: adminColors.ink,
  },

  // Dropdown menu options
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
    borderBottomColor: '#F0ECE4',
  },
  popupDropdownOptionText: {
    ...adminType.body,
    fontSize: 13,
    fontWeight: '600',
    color: adminColors.ink,
  },

  // Warning box (Screenshot 2: "Link a pest or disease first.")
  popupWarningBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: adminRadius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  popupWarningText: {
    ...adminType.body,
    fontSize: 13,
    fontWeight: '800',
    color: '#B45309',
  },

  // Review note textarea (Screenshot 3)
  popupReviewInput: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 12,
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
    height: 104,
    marginBottom: 8,
  },

  // Helper note
  popupHelperNote: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    lineHeight: 16,
    marginBottom: 20,
  },

  // Action buttons row (Screenshots 1, 2, 3)
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
    ...adminType.body,
    fontSize: 14,
    fontWeight: '700',
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
    ...adminType.body,
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
  },
});
