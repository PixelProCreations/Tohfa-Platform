/**
 * Audit Details & Farmer Records (M3-S03a), ported from the design on
 * origin/Superadmin-main. The design is a mock: it hardcodes an audit code, an
 * auditor, a sketch file and a certificate. This screen ports its LAYOUT and
 * its FIELD SET and fills them from live reads; a field with no endpoint behind
 * it renders ADMIN_NO_VALUE, exactly as the design itself dashes the fields it
 * has no value for. Which field is backed by what, and which are gaps, is
 * stated once in ./auditDetailsRecordsFormat.ts — not repeated here.
 *
 * Reads: GET /admin/audits/{id} (audit.view), and, for the farmer record the
 * design shows beside it, GET /admin/farmers/{id} (farmer.view),
 * .../documents (farmer.document.view), GET /admin/certifications?farmerId=
 * (certification.view) and GET /admin/audits?farmerId= for Previous Audits.
 * The four composed reads are enabled only while the Details tab is open and
 * the caller holds the permission, so the Inspection tab costs one request.
 *
 * Tab placement follows the DESIGN, not this file's previous shape: Category
 * Scores, Corrective actions, Red flag and Activity sit on Details.
 *
 * BR-05b: red-flagging is COMPLETED-only on the server. The card stays where
 * the design draws it (it is the record of the flag) but the control that
 * raises one appears only when the audit is COMPLETED, so it cannot be tapped
 * into a 409 — see canRaiseRedFlagNow.
 */
import React, { useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar } from '@tohfa/mobile-ui';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import type { Can } from '../../permissions/can';
import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import { PencilEditIcon } from '../../components/AdminIcons';
import { useCertificationList } from '../../api/certificationHooks';
import { useFarmer, useFarmerDocuments } from '../../api/farmerHooks';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { useAuditDetail, useAuditList, useClearRedFlag, useRaiseRedFlag } from './useAuditsData';
import {
  activityRows,
  auditCode,
  canClearRedFlagNow,
  canRaiseRedFlagNow,
  categoryScoreRows,
  certDocDetail,
  certificationRows,
  correctiveActionCards,
  documentCards,
  documentRows,
  farmLandRows,
  farmerRows,
  headerSubtitle,
  inspectionHeaderRows,
  inspectionSummaryRows,
  overviewRows,
  previousAuditCards,
  orDash,
  redFlagRows,
  statusLabel,
  summaryRows,
  tr,
  type RecordRow,
} from './auditDetailsRecordsFormat';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CloseIcon({ size = 20, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DocumentFileIcon({ size = 20, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <Path d="M14 2v6h6" stroke={color} strokeWidth="1.9" strokeLinejoin="round" />
      <Line x1="8" y1="13" x2="16" y2="13" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <Line x1="8" y1="17" x2="13" y2="17" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    </Svg>
  );
}

function LockHistoryIcon({ size = 16, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="11" width="14" height="10" rx="2" stroke={color} strokeWidth="1.9" />
      <Path d="M8 11V7a4 4 0 0 1 8 0v4" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    </Svg>
  );
}

function VerifiedSealIcon({ size = 24, color = adminColors.success.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth="2" />
      <Path d="M8 12l2.5 2.5 5.5-5.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Small building blocks ───────────────────────────────────────────────────

/** One label/value line. The testID carries the row id so a gap row can be pinned. */
function TableRow({ row, last }: { row: RecordRow; last?: boolean }) {
  return (
    <>
      <View style={styles.tableRow}>
        <Text style={styles.tableLabel}>{row.label}</Text>
        <Text style={styles.tableValue} testID={`auditRecords.value.${row.id}`}>
          {row.value}
        </Text>
      </View>
      {last === true ? null : <View style={styles.tableDivider} />}
    </>
  );
}

function RowTable({ rows }: { rows: RecordRow[] }) {
  return (
    <View style={styles.cardContainer}>
      {rows.map((r, i) => (
        <TableRow key={r.id} row={r} last={i === rows.length - 1} />
      ))}
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.sectionBlock}>
      <Text style={styles.sectionHeading}>{title}</Text>
      {children}
    </View>
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────

export interface AuditDetailsFarmerRecordsScreenProps {
  auditId?: string | undefined;
  can?: Can | undefined;
  /** Role string accepted for backward compatibility; gating uses `can` only. */
  role?: string | undefined;
  onBack: () => void;
  onEditSchedule?: (() => void) | undefined;
  onReschedule?: (() => void) | undefined;
  onCancelSchedule?: (() => void) | undefined;
  onOpenFarmerProfile?: ((farmerId?: string) => void) | undefined;
}

export function AuditDetailsFarmerRecordsScreen({
  auditId,
  can,
  onBack,
  onEditSchedule,
  onReschedule,
  onCancelSchedule,
  onOpenFarmerProfile,
}: AuditDetailsFarmerRecordsScreenProps): React.JSX.Element {
  const canSchedule = can ? can('audit.schedule') : true;
  const canRedFlag = can ? can('audit.red_flag.manage') : true;
  const canViewFarmer = can ? can('farmer.view') : true;
  const canViewCerts = can ? can('certification.view') : true;

  const [topTab, setTopTab] = useState<'details' | 'inspection'>('details');
  const [showRedFlagModal, setShowRedFlagModal] = useState(false);
  const [showCertDoc, setShowCertDoc] = useState(false);
  const [redFlagReason, setRedFlagReason] = useState('');

  const { data: audit } = useAuditDetail(auditId);
  const farmerId = audit?.farmerId;
  // The composed reads only matter on the Details tab; an unopened tab costs nothing.
  const onDetails = topTab === 'details';
  const { farmer } = useFarmer(undefined, onDetails && canViewFarmer ? farmerId : undefined);
  const { documents } = useFarmerDocuments(undefined, onDetails && canViewFarmer ? farmerId : undefined);
  const certs = useCertificationList(
    undefined,
    { farmerId },
    { enabled: onDetails && canViewCerts && farmerId !== undefined },
  );
  const previous = useAuditList(
    { farmerId, sort: '-scheduledFor' },
    { enabled: onDetails && farmerId !== undefined },
  );

  const raiseRedFlag = useRaiseRedFlag();
  const clearRedFlag = useClearRedFlag();

  const cert = certs.items[0];
  const showRaise = canRaiseRedFlagNow(audit, canRedFlag);
  const showClear = canClearRedFlagNow(audit, canRedFlag);
  const certDoc = certDocDetail(cert, farmer);
  const scoreRows = categoryScoreRows(audit);
  const correctives = correctiveActionCards(audit);
  const prevCards = previousAuditCards(previous.items, auditId);

  const handleSubmitRedFlag = () => {
    if (auditId === undefined || redFlagReason.trim() === '') return;
    raiseRedFlag.mutate(
      { auditId, body: { reason: redFlagReason.trim() } },
      {
        onSuccess: () => {
          setShowRedFlagModal(false);
          setRedFlagReason('');
        },
      },
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ── Header ── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={tr('admin.audits.records.back')}
          >
            <BackArrowIcon />
          </TouchableOpacity>

          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {tr(topTab === 'inspection' ? 'admin.audits.records.titleInspection' : 'admin.audits.records.title')}
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {headerSubtitle(audit)}
            </Text>
          </View>

          {onEditSchedule && canSchedule ? (
            <TouchableOpacity
              style={styles.headerEditBtn}
              onPress={onEditSchedule}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={tr('admin.audits.records.editSchedule')}
            >
              <PencilEditIcon size={20} color={adminColors.onBrand} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Summary card ── */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeaderRow}>
            <Text style={styles.summaryAuditId}>{auditCode()}</Text>
            <View style={audit?.redFlagged === true ? styles.statusBadgeRed : styles.statusBadgeScheduled}>
              <Text style={audit?.redFlagged === true ? styles.statusBadgeRedText : styles.statusBadgeScheduledText}>
                {statusLabel(audit?.status)}
              </Text>
            </View>
          </View>
          {summaryRows(audit).map((r, i, arr) => (
            <TableRow key={r.id} row={r} last={i === arr.length - 1} />
          ))}
        </View>

        {/* ── Segmented toggle ── */}
        <View style={styles.segmentedToggleContainer}>
          <TouchableOpacity
            style={[styles.segmentBtn, topTab === 'details' && styles.segmentBtnActive]}
            onPress={() => setTopTab('details')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, topTab === 'details' && styles.segmentTextActive]}>
              {tr('admin.audits.records.tab.details')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, topTab === 'inspection' && styles.segmentBtnActive]}
            onPress={() => setTopTab('inspection')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, topTab === 'inspection' && styles.segmentTextActive]}>
              {tr('admin.audits.records.tab.inspection')}
            </Text>
          </TouchableOpacity>
        </View>

        {topTab === 'details' ? (
          <>
            <Section title={tr('admin.audits.records.section.overview')}>
              <RowTable rows={overviewRows(audit)} />
            </Section>

            <Section title={tr('admin.audits.records.section.farmer')}>
              <View style={styles.cardContainer}>
                {farmerRows(audit, farmer).map((r) => (
                  <TableRow key={r.id} row={r} />
                ))}
                <View style={styles.linksRow}>
                  {onOpenFarmerProfile ? (
                    <TouchableOpacity onPress={() => onOpenFarmerProfile(farmerId)} activeOpacity={0.7}>
                      <Text style={styles.boldBrownLink}>{tr('admin.audits.records.farmer.openProfile')}</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
              <Text style={styles.sectionCaption}>{tr('admin.audits.records.farmer.caption')}</Text>
            </Section>

            <Section title={tr('admin.audits.records.section.farmLand')}>
              <RowTable rows={farmLandRows(audit, farmer)} />
              <Text style={styles.sectionCaption}>{tr('admin.audits.records.farmLand.caption')}</Text>
            </Section>

            <Section title={tr('admin.audits.records.section.certifications')}>
              <View style={styles.cardContainer}>
                {certificationRows(cert).map((r) => (
                  <TableRow key={r.id} row={r} />
                ))}
                <TouchableOpacity
                  style={styles.singleLinkContainer}
                  onPress={() => setShowCertDoc(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.boldBrownLink}>{tr('admin.audits.records.cert.openRecord')}</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.sectionCaption}>{tr('admin.audits.records.cert.caption')}</Text>

              {documentCards(cert).map((card) => (
                <React.Fragment key={card.id}>
                  {card.id === 'doc.external' ? (
                    <Text style={styles.subSectionHeading}>{tr('admin.audits.records.doc.externalHeading')}</Text>
                  ) : null}
                  <View style={styles.documentCard}>
                    <View style={styles.docLeftCol}>
                      <DocumentFileIcon />
                      <View style={styles.docTextGroup}>
                        <Text style={styles.docTitle}>{card.title}</Text>
                        <Text style={styles.docSub} testID={`auditRecords.doc.${card.id}`}>
                          {card.subtitle}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.viewDocBtn, !card.onFile && styles.btnDisabled]}
                      onPress={() => setShowCertDoc(true)}
                      disabled={!card.onFile}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.viewDocBtnText}>{tr('admin.audits.records.doc.view')}</Text>
                    </TouchableOpacity>
                  </View>
                </React.Fragment>
              ))}
            </Section>

            <Section title={tr('admin.audits.records.section.previousAudits')}>
              {prevCards.length === 0 ? (
                <View style={styles.cardContainer}>
                  <Text style={styles.emptyCardText}>{tr('admin.audits.records.previous.none')}</Text>
                </View>
              ) : (
                <View style={styles.previousAuditsList}>
                  {prevCards.map((p) => (
                    <View key={p.id} style={styles.prevAuditCard}>
                      <View style={styles.prevAuditTopRow}>
                        <Text style={styles.prevAuditTitle}>{p.title}</Text>
                        <Text style={styles.prevAuditScore}>{p.score}</Text>
                      </View>
                      <Text style={styles.prevAuditMeta}>{p.meta}</Text>
                    </View>
                  ))}
                </View>
              )}
            </Section>

            <Section title={tr('admin.audits.records.section.documents')}>
              <View style={styles.cardContainer}>
                {documentRows(documents).map((r, i, arr) => (
                  <React.Fragment key={r.id}>
                    <View style={styles.tableRow}>
                      <Text style={styles.tableLabel}>{tr('admin.audits.records.documents.farmerRecord')}</Text>
                      <Text style={styles.tableValue}>{r.label}</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={styles.tableLabel} />
                      <Text style={styles.tableValue} testID={`auditRecords.value.${r.id}`}>
                        {r.value}
                      </Text>
                    </View>
                    {i < arr.length - 1 ? <View style={styles.tableDivider} /> : null}
                  </React.Fragment>
                ))}
              </View>
              <Text style={styles.sectionCaption}>{tr('admin.audits.records.documents.caption')}</Text>
            </Section>

            {/* Design places Category Scores on the Details tab. */}
            <Section title={tr('admin.audits.records.section.categoryScores')}>
              <View style={styles.cardContainer}>
                {scoreRows.length === 0 ? (
                  <Text style={styles.emptyCardText}>{ADMIN_NO_VALUE}</Text>
                ) : (
                  scoreRows.map((s, i) => (
                    <React.Fragment key={s.id}>
                      <View style={styles.tableRow}>
                        <Text style={styles.tableLabel}>{s.label}</Text>
                        <Text style={styles.tableValue}>{s.score}</Text>
                      </View>
                      {i < scoreRows.length - 1 ? <View style={styles.tableDivider} /> : null}
                    </React.Fragment>
                  ))
                )}
              </View>
            </Section>

            <Section title={tr('admin.audits.records.section.corrective')}>
              {correctives.length === 0 ? (
                <View style={styles.cardContainer}>
                  <Text style={styles.emptyCardText}>{tr('admin.audits.records.corrective.none')}</Text>
                </View>
              ) : (
                correctives.map((c) => (
                  <View key={c.id} style={styles.cardContainer}>
                    <View style={styles.correctiveActionTopRow}>
                      <Text style={styles.correctiveActionCode}>{c.code}</Text>
                      <View style={c.closed ? styles.closedBadge : styles.openBadge}>
                        <Text style={c.closed ? styles.closedBadgeText : styles.openBadgeText}>{c.statusText}</Text>
                      </View>
                    </View>
                    <Text style={styles.correctiveActionMeta}>{c.findingText}</Text>
                    <Text style={styles.correctiveActionMeta}>{c.actionText}</Text>
                    <Text style={styles.correctiveActionMeta}>{c.responsibleText}</Text>
                    <Text style={styles.correctiveActionMeta}>{c.evidenceText}</Text>
                    <Text style={styles.correctiveActionMeta}>{c.outcomeText}</Text>
                  </View>
                ))
              )}
            </Section>

            <Section title={tr('admin.audits.records.section.redFlag')}>
              <RowTable rows={redFlagRows(audit)} />

              {showClear ? (
                <TouchableOpacity
                  style={styles.redFlagClearBtn}
                  testID="auditRecords.redFlag.clear"
                  onPress={() => {
                    if (auditId !== undefined) clearRedFlag.mutate({ auditId });
                  }}
                  disabled={clearRedFlag.isPending}
                  activeOpacity={0.75}
                >
                  <Text style={styles.redFlagClearBtnText}>{tr('admin.audits.records.redFlag.clear')}</Text>
                </TouchableOpacity>
              ) : null}

              {showRaise ? (
                <TouchableOpacity
                  style={styles.redFlagDashedBtn}
                  testID="auditRecords.redFlag.raise"
                  onPress={() => setShowRedFlagModal(true)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.redFlagDashedBtnText}>{tr('admin.audits.records.redFlag.raise')}</Text>
                </TouchableOpacity>
              ) : null}

              {/* BR-05b: say why the control is absent rather than offering a 409. */}
              {canRedFlag && !showRaise && !showClear ? (
                <Text style={styles.sectionCaption}>{tr('admin.audits.records.redFlag.completedOnly')}</Text>
              ) : null}
            </Section>

            <Section title={tr('admin.audits.records.section.activity')}>
              <View style={styles.activityList}>
                <RowTable rows={activityRows()} />
                <View style={styles.historyNoticeCard}>
                  <LockHistoryIcon />
                  <Text style={styles.historyNoticeText}>{tr('admin.audits.records.activity.appendOnly')}</Text>
                </View>
              </View>
            </Section>
          </>
        ) : (
          <View style={styles.inspectionContainer}>
            <RowTable rows={inspectionHeaderRows(audit)} />

            <Section title={tr('admin.audits.records.inspection.categories')}>
              <Text style={styles.sectionCaption}>{tr('admin.audits.records.inspection.categoriesCaption')}</Text>
              <View style={styles.categoriesList}>
                {scoreRows.length === 0 ? (
                  <View style={styles.cardContainer}>
                    <Text style={styles.emptyCardText}>{ADMIN_NO_VALUE}</Text>
                  </View>
                ) : (
                  scoreRows.map((s) => (
                    <View key={s.id} style={styles.categoryCard}>
                      <View style={styles.categoryCardTopRow}>
                        <Text style={styles.categoryCardTitle}>{s.label}</Text>
                        <Text style={styles.categoryMaxPoints}>{tr('admin.audits.records.inspection.max', { max: 10 })}</Text>
                      </View>
                      <View style={styles.categoryDashedDivider} />
                      <View style={styles.tableRow}>
                        <Text style={styles.tableLabel}>{tr('admin.audits.records.inspection.score')}</Text>
                        <Text style={styles.tableValue}>{s.score}</Text>
                      </View>
                      <View style={styles.categoryDashedDivider} />
                      <View style={styles.tableRow}>
                        <Text style={styles.tableLabel}>{tr('admin.audits.records.categoryScores.remarks')}</Text>
                        <Text style={styles.tableValue}>{s.remarks}</Text>
                      </View>
                      <View style={styles.categoryDashedDivider} />
                      <Text style={styles.categoryEvidenceText}>
                        {tr('admin.audits.records.categoryScores.evidence', { value: s.evidence })}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            </Section>

            <Section title={tr('admin.audits.records.inspection.findings')}>
              {audit !== undefined && audit.findings.length === 0 ? (
                <Text style={styles.sectionCaption}>{tr('admin.audits.records.inspection.noFindings')}</Text>
              ) : null}
              <View style={styles.metricTilesRow}>
                <View style={styles.metricTile}>
                  <Text style={styles.metricTileTitle}>{tr('admin.audits.records.inspection.majorFindings')}</Text>
                  <Text style={styles.metricTileValue}>
                    {orDash(audit?.findingCounts?.major)}
                  </Text>
                </View>
                <View style={styles.metricTile}>
                  <Text style={styles.metricTileTitle}>{tr('admin.audits.records.inspection.minorFindings')}</Text>
                  <Text style={styles.metricTileValue}>
                    {orDash(audit?.findingCounts?.minor)}
                  </Text>
                </View>
              </View>
            </Section>

            <Section title={tr('admin.audits.records.inspection.summary')}>
              <RowTable rows={inspectionSummaryRows(audit)} />
            </Section>
          </View>
        )}
      </ScrollView>

      {/* ── Bottom action bar: Edit schedule · Reschedule · Cancel ── */}
      {topTab === 'details' ? (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.editScheduleBtn, !canSchedule && styles.btnDisabled]}
            testID="auditRecords.action.editSchedule"
            onPress={onEditSchedule}
            disabled={!canSchedule || onEditSchedule === undefined}
            activeOpacity={0.8}
          >
            <Text style={styles.editScheduleBtnText}>{tr('admin.audits.records.action.editSchedule')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.rescheduleBtn, !canSchedule && styles.btnDisabled]}
            testID="auditRecords.action.reschedule"
            onPress={onReschedule}
            disabled={!canSchedule || onReschedule === undefined}
            activeOpacity={0.8}
          >
            <Text style={styles.rescheduleBtnText}>{tr('admin.audits.records.action.reschedule')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cancelBtn, !canSchedule && styles.btnDisabled]}
            testID="auditRecords.action.cancel"
            onPress={onCancelSchedule}
            disabled={!canSchedule || onCancelSchedule === undefined}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelBtnText}>{tr('admin.audits.records.action.cancel')}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* ── Certification document preview ── */}
      <Modal visible={showCertDoc} transparent animationType="fade" onRequestClose={() => setShowCertDoc(false)}>
        <View style={styles.modalOverlay} testID="auditRecords.certDocModal">
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowCertDoc(false)} />

          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <VerifiedSealIcon />
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {certDoc.title}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowCertDoc(false)}
                activeOpacity={0.7}
                style={styles.modalCloseIconBtn}
                accessibilityRole="button"
                accessibilityLabel={tr('admin.audits.records.docModal.closeLabel')}
              >
                <CloseIcon />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContentScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.docOverviewBox}>
                <View style={styles.docBadgeRow}>
                  <Text style={styles.docRefCode}>{certDoc.reference}</Text>
                  <View style={styles.docVerifiedPill}>
                    <Text style={styles.docVerifiedPillText}>{certDoc.statusText}</Text>
                  </View>
                </View>
                {certDoc.rows.map((r, i, arr) => (
                  <React.Fragment key={r.id}>
                    <View style={styles.modalTableRow}>
                      <Text style={styles.modalTableLabel}>{r.label}</Text>
                      <Text style={styles.modalTableValue} testID={`auditRecords.value.${r.id}`}>
                        {r.value}
                      </Text>
                    </View>
                    {i < arr.length - 1 ? <View style={styles.modalTableDivider} /> : null}
                  </React.Fragment>
                ))}
              </View>

              <View style={styles.digitalSealCard}>
                <DocumentFileIcon size={24} color={adminColors.brand} />
                <View style={styles.digitalSealTextCol}>
                  <Text style={styles.digitalSealTitle}>{tr('admin.audits.records.docModal.attached')}</Text>
                  <Text style={styles.digitalSealSub}>{certDoc.fileText}</Text>
                  <Text style={styles.digitalSealStatus}>{tr('admin.audits.records.docModal.vault')}</Text>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.modalBottomCloseBtn} onPress={() => setShowCertDoc(false)} activeOpacity={0.8}>
              <Text style={styles.modalBottomCloseBtnText}>{tr('admin.audits.records.docModal.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Red-flag modal ── */}
      <Modal
        visible={showRedFlagModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRedFlagModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowRedFlagModal(false)} />

          <View style={styles.redFlagSheet}>
            <Text style={styles.redFlagSheetTitle}>{tr('admin.audits.records.redFlag.modalTitle')}</Text>

            <View style={styles.redFlagAuditBox}>
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>{tr('admin.audits.records.redFlag.audit')}</Text>
                <Text style={styles.redFlagBoldVal}>{auditCode()}</Text>
              </View>
              <View style={styles.tableDivider} />
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>{tr('admin.audits.records.redFlag.farm')}</Text>
                <Text style={styles.redFlagBoldVal}>{audit?.farmName ?? audit?.farmerName ?? ADMIN_NO_VALUE}</Text>
              </View>
              <View style={styles.tableDivider} />
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>{tr('admin.audits.records.redFlag.minorFindings')}</Text>
                <Text style={styles.redFlagBoldVal}>
                  {orDash(audit?.findingCounts?.minor)}
                </Text>
              </View>
              <View style={styles.tableDivider} />
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>{tr('admin.audits.records.redFlag.majorFindings')}</Text>
                <Text style={styles.redFlagBoldVal}>
                  {orDash(audit?.findingCounts?.major)}
                </Text>
              </View>
            </View>

            <Text style={styles.inputLabelRequired}>{tr('admin.audits.records.redFlag.reasonLabel')}</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder={tr('admin.audits.records.redFlag.reasonPlaceholder')}
              placeholderTextColor={adminColors.muted}
              multiline
              numberOfLines={4}
              value={redFlagReason}
              onChangeText={setRedFlagReason}
            />

            <View style={styles.redFlagModalBtnRow}>
              <TouchableOpacity
                style={[styles.submitRedFlagBtn, redFlagReason.trim() === '' && styles.btnDisabled]}
                testID="auditRecords.redFlag.submit"
                onPress={handleSubmitRedFlag}
                disabled={raiseRedFlag.isPending || redFlagReason.trim() === ''}
                activeOpacity={0.8}
              >
                <Text style={styles.submitRedFlagBtnText}>
                  {tr(raiseRedFlag.isPending ? 'admin.audits.records.redFlag.submitting' : 'admin.audits.records.redFlag.raise')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelRedFlagBtn}
                onPress={() => setShowRedFlagModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelRedFlagBtnText}>{tr('admin.audits.records.redFlag.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminColors.canvas },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.md,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  headerBackBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  headerTitleCol: { flex: 1 },
  headerTitle: { ...adminType.title, color: adminColors.onBrand },
  headerSubtitle: { ...adminType.rowMeta, color: adminColors.onBrand, opacity: 0.9, marginTop: 1 },
  headerEditBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl * 2,
  },

  summaryCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.sm,
  },
  summaryAuditId: { ...adminType.rowTitle, color: adminColors.ink },
  statusBadgeScheduled: {
    backgroundColor: adminColors.info.bg,
    borderRadius: adminRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadgeScheduledText: { ...adminType.caption, color: adminColors.info.text },
  statusBadgeRed: {
    backgroundColor: adminColors.danger.bg,
    borderRadius: adminRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadgeRedText: { ...adminType.caption, color: adminColors.danger.text },

  tableRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  tableLabel: { ...adminType.caption, color: adminColors.muted },
  tableValue: { ...adminType.body, color: adminColors.ink, textAlign: 'right', flex: 1, marginLeft: 12 },
  tableDivider: { height: 1, backgroundColor: adminColors.border, opacity: 0.5 },

  segmentedToggleContainer: {
    flexDirection: 'row',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 3,
    marginBottom: adminSpacing.md,
  },
  segmentBtn: { flex: 1, paddingVertical: 9, alignItems: 'center', justifyContent: 'center', borderRadius: adminRadius.md },
  segmentBtnActive: { backgroundColor: adminColors.brand },
  segmentText: { ...adminType.caption, color: adminColors.ink },
  segmentTextActive: { color: adminColors.onBrand },

  sectionBlock: { marginBottom: adminSpacing.lg },
  sectionHeading: { ...adminType.sectionHead, color: adminColors.brandDeep, marginBottom: adminSpacing.xs },
  subSectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.xs,
  },
  cardContainer: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  sectionCaption: { ...adminType.caption, color: adminColors.muted, marginTop: 4 },
  linksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  singleLinkContainer: { marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: adminColors.border },
  boldBrownLink: { ...adminType.caption, color: adminColors.brandDeep },
  emptyCardText: { ...adminType.body, color: adminColors.muted },

  documentCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    ...adminShadow.sm,
  },
  docLeftCol: { flexDirection: 'row', alignItems: 'center', columnGap: 10, flex: 1 },
  docTextGroup: { flex: 1 },
  docTitle: { ...adminType.rowTitle, color: adminColors.ink },
  docSub: { ...adminType.caption, color: adminColors.muted },
  viewDocBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.brandDeep,
    backgroundColor: adminColors.card,
  },
  viewDocBtnText: { ...adminType.caption, color: adminColors.brandDeep },

  previousAuditsList: { rowGap: 8 },
  prevAuditCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  prevAuditTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  prevAuditTitle: { ...adminType.rowTitle, color: adminColors.ink },
  prevAuditScore: { ...adminType.rowTitle, color: adminColors.ink },
  prevAuditMeta: { ...adminType.caption, color: adminColors.muted, marginTop: 2 },

  correctiveActionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  correctiveActionCode: { ...adminType.rowTitle, color: adminColors.ink },
  closedBadge: {
    backgroundColor: adminColors.success.bg,
    borderRadius: adminRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  closedBadgeText: { ...adminType.caption, color: adminColors.success.text },
  openBadge: {
    backgroundColor: adminColors.warning.bg,
    borderRadius: adminRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  openBadgeText: { ...adminType.caption, color: adminColors.warning.text },
  correctiveActionMeta: { ...adminType.caption, color: adminColors.muted, marginTop: 2 },

  activityList: { rowGap: 8 },
  historyNoticeCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: adminColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },
  historyNoticeText: { ...adminType.caption, color: adminColors.muted },

  inspectionContainer: { rowGap: adminSpacing.md },
  categoriesList: { rowGap: 10, marginTop: 8 },
  categoryCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  categoryCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 6,
  },
  categoryCardTitle: { ...adminType.rowTitle, color: adminColors.ink },
  categoryMaxPoints: { ...adminType.caption, color: adminColors.muted },
  categoryDashedDivider: {
    height: 1,
    borderWidth: 0.8,
    borderColor: adminColors.border,
    borderStyle: 'dashed',
    marginVertical: 4,
  },
  categoryEvidenceText: { ...adminType.caption, color: adminColors.muted, paddingTop: 4 },
  metricTilesRow: { flexDirection: 'row', columnGap: 10, marginTop: 8 },
  metricTile: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  metricTileTitle: { ...adminType.caption, color: adminColors.ink, marginBottom: 6 },
  metricTileValue: { ...adminType.title, color: adminColors.ink },

  bottomBar: {
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 10,
    flexDirection: 'row',
    columnGap: 8,
  },
  editScheduleBtn: {
    flex: 1.2,
    height: 44,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editScheduleBtnText: { ...adminType.rowTitle, color: adminColors.onBrand },
  rescheduleBtn: {
    flex: 1.1,
    height: 44,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rescheduleBtnText: { ...adminType.rowTitle, color: adminColors.brandDeep },
  cancelBtn: {
    flex: 0.9,
    height: 44,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.danger.text,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: { ...adminType.rowTitle, color: adminColors.danger.text },
  btnDisabled: { opacity: 0.5 },

  redFlagDashedBtn: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: adminColors.danger.text,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.sm,
  },
  redFlagDashedBtnText: { ...adminType.rowTitle, color: adminColors.danger.text },
  redFlagClearBtn: {
    backgroundColor: adminColors.brandDeep,
    borderRadius: adminRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.sm,
  },
  redFlagClearBtnText: { ...adminType.rowTitle, color: adminColors.onBrand },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: adminOverlay.scrim },
  modalBackdrop: { flex: 1 },
  modalSheet: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: adminRadius.xl,
    borderTopRightRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.md,
  },
  modalHeaderLeft: { flexDirection: 'row', alignItems: 'center', columnGap: 8, flex: 1 },
  modalTitle: { ...adminType.sectionHead, color: adminColors.ink, flex: 1 },
  modalCloseIconBtn: { padding: 4 },
  modalContentScroll: { marginBottom: adminSpacing.md },
  docOverviewBox: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  docBadgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  docRefCode: { ...adminType.rowTitle, color: adminColors.ink },
  docVerifiedPill: {
    backgroundColor: adminColors.success.bg,
    borderRadius: adminRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  docVerifiedPillText: { ...adminType.caption, color: adminColors.success.text },
  modalTableRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  modalTableLabel: { ...adminType.caption, color: adminColors.muted },
  modalTableValue: { ...adminType.body, color: adminColors.ink, textAlign: 'right', flex: 1, marginLeft: 12 },
  modalTableDivider: { height: 1, backgroundColor: adminColors.border, opacity: 0.5 },
  digitalSealCard: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 12,
  },
  digitalSealTextCol: { flex: 1 },
  digitalSealTitle: { ...adminType.rowTitle, color: adminColors.brandDeep },
  digitalSealSub: { ...adminType.caption, color: adminColors.ink, marginTop: 1 },
  digitalSealStatus: { ...adminType.caption, color: adminColors.muted, marginTop: 2 },
  modalBottomCloseBtn: {
    height: 44,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.xs,
  },
  modalBottomCloseBtnText: { ...adminType.rowTitle, color: adminColors.onBrand },

  redFlagSheet: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: adminRadius.xl,
    borderTopRightRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
  },
  redFlagSheetTitle: { ...adminType.sectionHead, color: adminColors.ink, marginBottom: adminSpacing.md },
  redFlagAuditBox: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  redFlagBoldVal: { ...adminType.body, color: adminColors.ink },
  inputLabelRequired: { ...adminType.caption, color: adminColors.ink, marginBottom: 6 },
  reasonInput: {
    height: 80,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.canvas,
    padding: adminSpacing.sm,
    color: adminColors.ink,
    textAlignVertical: 'top',
    marginBottom: adminSpacing.md,
  },
  redFlagModalBtnRow: { flexDirection: 'row', columnGap: 10 },
  submitRedFlagBtn: {
    flex: 1,
    height: 44,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitRedFlagBtnText: { ...adminType.rowTitle, color: adminColors.ink },
  cancelRedFlagBtn: {
    flex: 1,
    height: 44,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelRedFlagBtnText: { ...adminType.rowTitle, color: adminColors.muted },
});
