/**
 * Pure display helpers for AuditDetailsFarmerRecordsScreen. No react-native,
 * so plain-Node vitest covers them (../../tests/audit_details_farmer_records.test.tsx).
 *
 * The design (origin/Superadmin-main) is a mock: every value in it is a made-up
 * sample — an audit code, an auditor's name, a sketch file name. This module
 * ports its FIELD SET, not its values. Each row carries a `source`:
 *
 *   'audit'   GET /admin/audits/{id}            (useAuditDetail)
 *   'farmer'  GET /admin/farmers/{id}           (useFarmer)
 *   'docs'    GET /admin/farmers/{id}/documents (useFarmerDocuments)
 *   'cert'    GET /admin/certifications?farmerId=
 *   'gap'     no endpoint supplies it
 *
 * A 'gap' row is NEVER dropped and NEVER invented: it renders with
 * ADMIN_NO_VALUE, exactly as the design itself renders "—" for the fields it
 * has no value for (External organization, Notes). A backed row falls back to
 * the same dash while its query is in flight or when the server sent null.
 */
import type {
  AuditDetailDto,
  AuditFindingDto,
  AuditStatus,
  AuditSummaryDto,
} from '../../api/audits';
import type { CertificationDto } from '../../api/certifications';
import type { FarmerDetailView, FarmerDocumentView } from '../../api/farmerTypes';
import { t, type TranslationKey } from '../../i18n';
import { formatAdminDay, formatAdminTime } from '../../utils/datetime';
import { ADMIN_NO_VALUE } from '../../utils/noValue';

/** Keys of i18n/auditDetailsRecords.en.json. */
export type AuditRecordsKey = `admin.audits.records.${string}`;

/**
 * t() for this screen's catalogue, registered in i18n/index.ts separately, so
 * the key is widened to string first; an unknown key renders as itself.
 */
export function tr(key: AuditRecordsKey, params?: Record<string, string | number>): string {
  return t(key as string as TranslationKey, params);
}

/** Which call backs a row; 'gap' means no endpoint supplies it (see the docblock). */
export type RowSource = 'audit' | 'farmer' | 'docs' | 'cert' | 'gap';

export interface RecordRow {
  /** Stable across renders and used as the testID suffix. */
  id: string;
  label: string;
  value: string;
  source: RowSource;
}

/** '' and null both mean "nothing to show", which is the dash, never an empty row. */
export function orDash(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ADMIN_NO_VALUE;
  const s = String(value).trim();
  return s === '' ? ADMIN_NO_VALUE : s;
}

/** The one row builder: a 'gap' row is forced to the dash whatever is passed. */
function row(id: string, label: string, value: string | number | null | undefined, source: RowSource): RecordRow {
  return { id, label, value: source === 'gap' ? ADMIN_NO_VALUE : orDash(value), source };
}

/** "25 Sep 2026, 10:00 AM", or the dash. */
export function dayAndTime(iso: string | null | undefined): string {
  if (iso === null || iso === undefined || iso === '') return ADMIN_NO_VALUE;
  const day = formatAdminDay(iso);
  const time = formatAdminTime(iso);
  if (day === '') return ADMIN_NO_VALUE;
  return time === '' ? day : `${day}, ${time}`;
}

/** "25 Sep 2026" from a YYYY-MM-DD or an instant, or the dash. */
export function dayOnly(iso: string | null | undefined): string {
  if (iso === null || iso === undefined || iso === '') return ADMIN_NO_VALUE;
  const day = formatAdminDay(iso.length === 10 ? `${iso}T00:00:00+05:30` : iso);
  return day === '' ? ADMIN_NO_VALUE : day;
}

export function statusLabel(status: AuditStatus | undefined): string {
  return status === undefined ? ADMIN_NO_VALUE : tr(`admin.audits.records.status.${status}`);
}

export function auditTypeLabel(type: 'INTERNAL' | 'EXTERNAL' | undefined): string {
  return type === undefined ? ADMIN_NO_VALUE : tr(`admin.audits.records.type.${type}`);
}

function typeLabel(audit: AuditDetailDto | undefined): string {
  return auditTypeLabel(audit?.auditType);
}

export function categoryLabel(code: string): string {
  return t(`farmerDetail.rating.category.${code}` as TranslationKey);
}

// ─── Header / summary card ────────────────────────────────────────────────────

/**
 * The audit's human code. We hold only the uuid: `AuditDetail` has no code
 * field, so the code the design prints has nothing behind it. GAP.
 */
export function auditCode(): string {
  return ADMIN_NO_VALUE;
}

export function headerSubtitle(audit: AuditDetailDto | undefined): string {
  if (audit === undefined) return ADMIN_NO_VALUE;
  const parts = [audit.farmerName, audit.zoneName, statusLabel(audit.status)].filter(
    (p): p is string => typeof p === 'string' && p.trim() !== '',
  );
  return parts.length === 0 ? ADMIN_NO_VALUE : parts.join(' · ');
}

/** Farmer name plus the tohfa farmer code, the pair the design's summary row shows. */
function farmerAndCode(audit: AuditDetailDto | undefined): string {
  if (audit === undefined) return ADMIN_NO_VALUE;
  const code = orDash(audit.tohfaFarmerId);
  return `${orDash(audit.farmerName)} · ${code}`;
}

export function summaryRows(audit: AuditDetailDto | undefined): RecordRow[] {
  return [
    row('summary.auditType', tr('admin.audits.records.summary.auditType'), typeLabel(audit), 'audit'),
    row('summary.scheduled', tr('admin.audits.records.summary.scheduled'), dayAndTime(audit?.scheduledFor), 'audit'),
    row('summary.farmer', tr('admin.audits.records.summary.farmer'), farmerAndCode(audit), 'audit'),
    row('summary.farmZone', tr('admin.audits.records.summary.farmZone'), audit?.farmName ?? audit?.zoneName, 'audit'),
    row('summary.auditor', tr('admin.audits.records.summary.auditor'), audit?.auditorName, 'audit'),
    // GAP: AuditDetail carries no participant list.
    row('summary.participants', tr('admin.audits.records.summary.participants'), null, 'gap'),
    // GAP: AuditDetail carries no purpose field; quarter is not a purpose.
    row('summary.purpose', tr('admin.audits.records.summary.purpose'), null, 'gap'),
    // `updatedAt` is backed; the design's "· Demo TOHFA Admin" (updatedByName) is not.
    row('summary.lastUpdated', tr('admin.audits.records.summary.lastUpdated'), dayAndTime(audit?.updatedAt), 'audit'),
    row('summary.updatedBy', tr('admin.audits.records.summary.lastUpdated'), null, 'gap'),
  ];
}

// ─── Details tab ──────────────────────────────────────────────────────────────

export function overviewRows(audit: AuditDetailDto | undefined): RecordRow[] {
  return [
    row('overview.schedule', tr('admin.audits.records.overview.schedule'), dayAndTime(audit?.scheduledFor), 'audit'),
    // GAP: no duration is scheduled or returned (the design's "· 120 min").
    row('overview.duration', tr('admin.audits.records.overview.schedule'), null, 'gap'),
    row('overview.auditType', tr('admin.audits.records.overview.auditType'), typeLabel(audit), 'audit'),
    row('overview.status', tr('admin.audits.records.overview.status'), statusLabel(audit?.status), 'audit'),
    row('overview.purpose', tr('admin.audits.records.overview.purpose'), null, 'gap'),
    row(
      'overview.quarter',
      tr('admin.audits.records.overview.quarter'),
      audit === undefined ? null : `Q${audit.quarter} ${audit.fiscalYear}`,
      'audit',
    ),
    row('overview.leadAuditor', tr('admin.audits.records.overview.leadAuditor'), audit?.auditorName, 'audit'),
    row('overview.externalOrg', tr('admin.audits.records.overview.externalOrg'), audit?.externalAgencyName, 'audit'),
    row('overview.notes', tr('admin.audits.records.overview.notes'), audit?.summary, 'audit'),
  ];
}

export function farmerRows(audit: AuditDetailDto | undefined, farmer: FarmerDetailView | undefined): RecordRow[] {
  return [
    row('farmer.name', tr('admin.audits.records.farmer.name'), farmer?.name ?? audit?.farmerName, 'audit'),
    row('farmer.id', tr('admin.audits.records.farmer.id'), farmer?.farmerCode ?? audit?.tohfaFarmerId, 'audit'),
    // GAP: FarmerDetailView.farmingType is typed null — the profile API sends none.
    row('farmer.farmingType', tr('admin.audits.records.farmer.farmingType'), null, 'gap'),
    row('farmer.zone', tr('admin.audits.records.farmer.zone'), farmer?.zoneName ?? audit?.zoneName, 'audit'),
    row('farmer.registered', tr('admin.audits.records.farmer.registered'), dayOnly(farmer?.registeredAt), 'farmer'),
    row('farmer.contact', tr('admin.audits.records.farmer.contact'), farmer?.mobile, 'farmer'),
  ];
}

/** The primary land location, else the first; undefined when the profile has none. */
export function primaryLocation(farmer: FarmerDetailView | undefined) {
  if (farmer === undefined) return undefined;
  return farmer.landLocations.find((l) => l.isPrimary) ?? farmer.landLocations[0];
}

export function farmLandRows(audit: AuditDetailDto | undefined, farmer: FarmerDetailView | undefined): RecordRow[] {
  const loc = primaryLocation(farmer);
  const locationText =
    loc === undefined
      ? (audit?.farmName ?? audit?.zoneName ?? null)
      : [loc.name, loc.village ?? loc.district].filter((p) => p !== null && p !== '').join(', ');
  const rows: RecordRow[] = [
    row('farmLand.location', tr('admin.audits.records.farmLand.location'), locationText, 'farmer'),
    // GAP: no FMB sketch file is exposed; `hasBoundary` is a flag, not a document.
    row('farmLand.fmbSketch', tr('admin.audits.records.farmLand.fmbSketch'), null, 'gap'),
  ];
  const plots = loc?.plots ?? [];
  for (const plot of plots) {
    rows.push(
      // GAP inside a backed row: the plot's NAME is backed, its PLT-… code is not.
      row(
        `farmLand.plot.${plot.id}`,
        tr('admin.audits.records.farmLand.plot', { name: plot.name }),
        plot.areaAcres === null ? null : tr('admin.audits.records.farmLand.acres', { acres: plot.areaAcres }),
        'farmer',
      ),
    );
  }
  return rows;
}

export function certificationRows(cert: CertificationDto | undefined): RecordRow[] {
  const typeText =
    cert === undefined
      ? null
      : cert.certType === 'OTHER'
        ? (cert.customTypeName ?? tr('admin.audits.records.cert.typeOTHER'))
        : tr(`admin.audits.records.cert.type${cert.certType}` as AuditRecordsKey);
  const expired = cert !== undefined && typeof cert.daysToExpiry === 'number' && cert.daysToExpiry < 0;
  return [
    row('cert.type', tr('admin.audits.records.cert.type'), typeText, 'cert'),
    row(
      'cert.status',
      tr('admin.audits.records.cert.status'),
      cert === undefined ? null : tr(expired ? 'admin.audits.records.cert.expired' : 'admin.audits.records.cert.active'),
      'cert',
    ),
    row('cert.certifiedDate', tr('admin.audits.records.cert.certifiedDate'), dayOnly(cert?.issuedOn), 'cert'),
    row('cert.expiryDate', tr('admin.audits.records.cert.expiryDate'), dayOnly(cert?.expiresOn), 'cert'),
    row('cert.reference', tr('admin.audits.records.cert.reference'), cert?.certNumber, 'cert'),
    row(
      'cert.verification',
      tr('admin.audits.records.cert.verification'),
      cert === undefined ? null : tr(`admin.audits.records.cert.status${cert.verificationStatus}` as AuditRecordsKey),
      'cert',
    ),
  ];
}

export interface DocumentCard {
  id: string;
  title: string;
  /** "On file" / "Not on file". */
  subtitle: string;
  onFile: boolean;
  source: RowSource;
}

/**
 * The three document cards the design shows. Only the certificate's document
 * is backed (`Certification.documentUrl`); an FMB sketch and an external-audit
 * file have no endpoint, so their cards render "Not on file" rather than a
 * sample file name.
 */
export function documentCards(cert: CertificationDto | undefined): DocumentCard[] {
  const certOnFile = typeof cert?.documentUrl === 'string' && cert.documentUrl !== '';
  return [
    {
      id: 'doc.fmb',
      title: tr('admin.audits.records.doc.fmbSketch'),
      subtitle: tr('admin.audits.records.doc.notOnFile'),
      onFile: false,
      source: 'gap',
    },
    {
      id: 'doc.cert',
      title: tr('admin.audits.records.doc.pgsCertificate'),
      subtitle: tr(certOnFile ? 'admin.audits.records.doc.onFile' : 'admin.audits.records.doc.notOnFile'),
      onFile: certOnFile,
      source: 'cert',
    },
    {
      id: 'doc.external',
      title: tr('admin.audits.records.doc.externalAudit'),
      subtitle: tr('admin.audits.records.doc.notOnFile'),
      onFile: false,
      source: 'gap',
    },
  ];
}

/** The certification preview modal's body: the design's popup, with no sample values. */
export interface CertDocDetail {
  title: string;
  reference: string;
  statusText: string;
  rows: RecordRow[];
  fileText: string;
}

export function certDocDetail(cert: CertificationDto | undefined, farmer: FarmerDetailView | undefined): CertDocDetail {
  const loc = primaryLocation(farmer);
  return {
    title: tr('admin.audits.records.doc.pgsCertificate'),
    reference: orDash(cert?.certNumber),
    statusText:
      cert === undefined ? ADMIN_NO_VALUE : tr(`admin.audits.records.cert.status${cert.verificationStatus}` as AuditRecordsKey),
    rows: [
      row('docModal.category', tr('admin.audits.records.docModal.category'), tr('admin.audits.records.docModal.categoryCert'), 'cert'),
      row(
        'docModal.standard',
        tr('admin.audits.records.docModal.standard'),
        cert === undefined ? null : (cert.customTypeName ?? cert.certType),
        'cert',
      ),
      row('docModal.validFrom', tr('admin.audits.records.docModal.validFrom'), dayOnly(cert?.issuedOn), 'cert'),
      row('docModal.validUntil', tr('admin.audits.records.docModal.validUntil'), dayOnly(cert?.expiresOn), 'cert'),
      row('docModal.issuingBody', tr('admin.audits.records.docModal.issuingBody'), cert?.issuingBody, 'cert'),
      row('docModal.farmPlot', tr('admin.audits.records.docModal.farmPlot'), loc?.name, 'farmer'),
    ],
    // GAP: no file name or size is returned with a certificate document.
    fileText: ADMIN_NO_VALUE,
  };
}

export interface PreviousAuditCard {
  id: string;
  /** The uuid is not a code, so the dash stands in for the code the design prints here. */
  title: string;
  meta: string;
  score: string;
}

export function previousAuditCards(audits: AuditSummaryDto[], currentAuditId: string | undefined): PreviousAuditCard[] {
  return audits
    .filter((a) => a.id !== currentAuditId)
    .map((a) => ({
      id: a.id,
      title: `${auditCode()} · ${auditTypeLabel(a.auditType)}`,
      meta: `${dayOnly(a.scheduledFor)} · ${tr('admin.audits.records.previous.findings', {
        major: a.findingCounts?.major ?? null,
        minor: a.findingCounts?.minor ?? null,
      })}`,
      score:
        a.totalScore === null
          ? ADMIN_NO_VALUE
          : tr('admin.audits.records.previous.score', { score: a.totalScore, max: a.maxScore }),
    }));
}

const DOC_ROWS: ReadonlyArray<{ id: string; labelKey: AuditRecordsKey; docType: string | null }> = [
  { id: 'documents.identity', labelKey: 'admin.audits.records.documents.identityProof', docType: 'ID_PROOF' },
  { id: 'documents.land', labelKey: 'admin.audits.records.documents.landOwnership', docType: 'FARM_DOC' },
  // GAP: no soil-report document type exists on the farmer record.
  { id: 'documents.soil', labelKey: 'admin.audits.records.documents.soilReport', docType: null },
];

/**
 * The design's three "Farmer record" rows. The label is the record's kind; the
 * value says whether it is on file, which is what the list actually answers.
 */
export function documentRows(documents: FarmerDocumentView[] | undefined): RecordRow[] {
  return DOC_ROWS.map((spec) => {
    if (spec.docType === null) return row(spec.id, tr(spec.labelKey), null, 'gap');
    const hit = documents?.find((d) => d.docType === spec.docType);
    return row(
      spec.id,
      tr(spec.labelKey),
      hit === undefined ? null : tr(`admin.audits.records.doc.onFile`),
      'docs',
    );
  });
}

export interface CategoryScoreRow {
  id: string;
  label: string;
  score: string;
  remarks: string;
  /** GAP: no per-category evidence is returned. */
  evidence: string;
}

export function categoryScoreRows(audit: AuditDetailDto | undefined): CategoryScoreRow[] {
  const scores = audit?.categoryScores ?? [];
  return scores.map((s) => ({
    id: `category.${s.categoryCode}`,
    label: categoryLabel(s.categoryCode),
    score: s.score === null ? ADMIN_NO_VALUE : t('farmerDetail.rating.categoryScore', { score: s.score, max: s.maxScore }),
    remarks: orDash(s.remarks),
    evidence: ADMIN_NO_VALUE,
  }));
}

export interface CorrectiveActionCard {
  id: string;
  /** GAP: findings carry no CA-… code. */
  code: string;
  closed: boolean;
  statusText: string;
  findingText: string;
  actionText: string;
  responsibleText: string;
  evidenceText: string;
  outcomeText: string;
}

/** A finding with a corrective action is the design's corrective-action card. */
export function correctiveActionCards(audit: AuditDetailDto | undefined): CorrectiveActionCard[] {
  const findings: AuditFindingDto[] = audit?.findings ?? [];
  return findings
    .filter((f) => f.correctiveAction !== null && f.correctiveAction !== '')
    .map((f) => {
      const closed = f.resolvedAt !== null;
      return {
        id: `corrective.${f.id}`,
        code: ADMIN_NO_VALUE,
        closed,
        statusText: tr(closed ? 'admin.audits.records.corrective.closed' : 'admin.audits.records.corrective.open'),
        findingText: tr('admin.audits.records.corrective.finding', {
          severity: f.severity,
          category: f.categoryCode === null ? ADMIN_NO_VALUE : categoryLabel(f.categoryCode),
        }),
        actionText: tr('admin.audits.records.corrective.action', { action: orDash(f.correctiveAction) }),
        // GAP: no responsible person is recorded on a finding; the due date is backed.
        responsibleText: tr('admin.audits.records.corrective.responsible', {
          person: ADMIN_NO_VALUE,
          due: dayOnly(f.dueDate),
        }),
        // GAP: no completion evidence is returned.
        evidenceText: tr('admin.audits.records.corrective.evidence', { evidence: ADMIN_NO_VALUE }),
        // GAP: no review outcome is returned; the closed date is backed.
        outcomeText: tr('admin.audits.records.corrective.outcome', {
          outcome: ADMIN_NO_VALUE,
          closed: dayOnly(f.resolvedAt),
        }),
      };
    });
}

export function redFlagRows(audit: AuditDetailDto | undefined): RecordRow[] {
  const flagged = audit?.redFlagged ?? false;
  return [
    row(
      'redFlag.status',
      tr('admin.audits.records.redFlag.status'),
      audit === undefined
        ? null
        : tr(flagged ? 'admin.audits.records.redFlag.flagged' : 'admin.audits.records.redFlag.notFlagged'),
      'audit',
    ),
    row('redFlag.reason', tr('admin.audits.records.redFlag.reason'), audit?.redFlagReason, 'audit'),
    row('redFlag.actionBy', tr('admin.audits.records.redFlag.actionBy'), audit?.redFlaggedByName, 'audit'),
    row('redFlag.timestamp', tr('admin.audits.records.redFlag.timestamp'), dayAndTime(audit?.redFlaggedAt), 'audit'),
    row('redFlag.minor', tr('admin.audits.records.redFlag.minorFindings'), audit?.findingCounts?.minor, 'audit'),
    row('redFlag.major', tr('admin.audits.records.redFlag.majorFindings'), audit?.findingCounts?.major, 'audit'),
    // GAP: no red-flag history list is returned, only the current flag.
    row('redFlag.history', tr('admin.audits.records.redFlag.historyUnavailable'), null, 'gap'),
  ];
}

/** GAP: no activity / status-history endpoint backs the design's timeline. */
export function activityRows(): RecordRow[] {
  return [row('activity.timeline', tr('admin.audits.records.activity.unavailable'), null, 'gap')];
}

// ─── Inspection tab ───────────────────────────────────────────────────────────

export function inspectionHeaderRows(audit: AuditDetailDto | undefined): RecordRow[] {
  return [
    row('inspection.audit', tr('admin.audits.records.inspection.audit'), auditCode(), 'gap'),
    row('inspection.farmerFarm', tr('admin.audits.records.inspection.farmerFarm'), farmerAndCode(audit), 'audit'),
    row('inspection.auditType', tr('admin.audits.records.inspection.auditType'), typeLabel(audit), 'audit'),
    row('inspection.auditDate', tr('admin.audits.records.inspection.auditDate'), dayOnly(audit?.scheduledFor), 'audit'),
    row('inspection.leadAuditor', tr('admin.audits.records.inspection.leadAuditor'), audit?.auditorName, 'audit'),
    row('inspection.status', tr('admin.audits.records.inspection.status'), statusLabel(audit?.status), 'audit'),
  ];
}

export function inspectionSummaryRows(audit: AuditDetailDto | undefined): RecordRow[] {
  const scores = audit?.categoryScores ?? [];
  const scored = scores.filter((s) => s.score !== null).length;
  return [
    row(
      'inspection.totalScore',
      tr('admin.audits.records.inspection.totalScore'),
      audit === undefined || audit.totalScore === null
        ? null
        : tr('admin.audits.records.inspection.totalScoreValue', { score: audit.totalScore, max: audit.maxScore }),
      'audit',
    ),
    row(
      'inspection.categoriesScored',
      tr('admin.audits.records.inspection.categoriesScored'),
      scores.length === 0
        ? null
        : tr('admin.audits.records.inspection.categoriesScoredValue', { scored, total: scores.length }),
      'audit',
    ),
    row('inspection.major', tr('admin.audits.records.inspection.majorFindings'), audit?.findingCounts?.major, 'audit'),
    row('inspection.minor', tr('admin.audits.records.inspection.minorFindings'), audit?.findingCounts?.minor, 'audit'),
    // GAP: no evidence is counted or returned.
    row('inspection.evidenceCount', tr('admin.audits.records.inspection.evidenceCount'), null, 'gap'),
    row(
      'inspection.tier',
      tr('admin.audits.records.inspection.complianceTier'),
      audit?.tier === null || audit?.tier === undefined
        ? null
        : tr('admin.audits.records.inspection.tierValue', { tier: audit.tier }),
      'audit',
    ),
  ];
}

// ─── Gating ───────────────────────────────────────────────────────────────────

/**
 * BR-05b: an audit can be red-flagged only once it is COMPLETED — the server
 * answers 409 on any other status. The design draws the card on a SCHEDULED
 * audit, so the card stays (it is the record of the flag) but the control that
 * would raise one is withheld until the audit is completed, rather than being
 * offered into an error.
 *
 * Clearing is allowed whenever a flag is actually set, so an audit that was
 * flagged and then moved on is not left stuck.
 */
export function canRaiseRedFlagNow(audit: AuditDetailDto | undefined, hasPermission: boolean): boolean {
  return hasPermission && audit !== undefined && audit.status === 'COMPLETED' && !audit.redFlagged;
}

export function canClearRedFlagNow(audit: AuditDetailDto | undefined, hasPermission: boolean): boolean {
  return hasPermission && audit !== undefined && audit.redFlagged;
}
