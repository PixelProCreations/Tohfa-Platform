/**
 * Live data for the audit screens: thin wrappers over the admin hooks
 * (../../api/hooks.ts) and the audits client (../../api/audits.ts). No
 * branching lives here; the DTOs are passed through unmapped so no field the
 * screens may need is lost.
 *
 * Keys: `adminKeys.scoped('audits', undefined, { resource, ... })`. Audits are
 * scoped by the caller's ZONE on the server, not by a warehouse, so every key
 * uses the 'all' warehouse slot; the query cache is per session
 * (SessionQueryProvider), so one admin's rows never answer the next admin's
 * query. Every write invalidates the whole `adminKeys.module('audits')` prefix,
 * because one transition changes the list row, the detail, the compliance
 * counts and the calendar at once, and targeting a subset would leave one of
 * them stale. Unset filters are null so the key shape is stable.
 */
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';
import {
  bulkRescheduleAudits,
  cancelAudit,
  clearAuditRedFlag,
  completeAudit,
  createAudit,
  createAuditFinding,
  getAudit,
  getAuditCompliance,
  getAuditReportUrl,
  getAuditTierThresholds,
  listAudits,
  redFlagAudit,
  setAuditScores,
  startAudit,
  updateAudit,
  updateAuditFinding,
  updateAuditTierThresholds,
  type AuditBulkRescheduleBody,
  type AuditClearRedFlagBody,
  type AuditCompleteBody,
  type AuditComplianceParams,
  type AuditCreateBody,
  type AuditDetailDto,
  type AuditFindingCreateBody,
  type AuditFindingUpdateBody,
  type AuditReasonBody,
  type AuditReportVariant,
  type AuditScoresBody,
  type AuditStartBody,
  type AuditSummaryDto,
  type AuditUpdateBody,
  type ListAuditsParams,
  type TierBandsBody,
} from '../../api/audits';
import { useAdminMutation, useAdminQuery, useCursorList, type CursorList } from '../../api/hooks';
import { adminKeys } from '../../api/queryKeys';
import { newInspectionProgress, runInspection, type InspectionInput, type InspectionProgress } from './auditActions';

export const AUDITS_MODULE = 'audits';

/** List filters: everything GET /admin/audits takes except the cursor, which the list owns. */
export type AuditListFilters = Omit<ListAuditsParams, 'cursor'>;

/** Compliance filters: the counts follow fiscalYear/zoneId; complianceStatus/cursor/limit only shape the farmers page. */
export type AuditComplianceFilters = AuditComplianceParams;

/** The prefix every audit write invalidates. */
const AUDITS_PREFIX = adminKeys.module(AUDITS_MODULE);

function identity(dto: AuditSummaryDto): AuditSummaryDto {
  return dto;
}

export const auditKeys = {
  list: (filters: AuditListFilters) =>
    adminKeys.scoped(AUDITS_MODULE, undefined, {
      resource: 'list',
      farmerId: filters.farmerId ?? null,
      zoneId: filters.zoneId ?? null,
      status: filters.status === undefined ? null : filters.status.join(','),
      type: filters.type ?? null,
      fiscalYear: filters.fiscalYear ?? null,
      quarter: filters.quarter ?? null,
      scheduledFrom: filters.scheduledFrom ?? null,
      scheduledTo: filters.scheduledTo ?? null,
      redFlagged: filters.redFlagged ?? null,
      overdue: filters.overdue ?? null,
      hasOpenMajorFindings: filters.hasOpenMajorFindings ?? null,
      sort: filters.sort ?? null,
      limit: filters.limit ?? null,
    }),
  compliance: (filters: AuditComplianceFilters) =>
    adminKeys.scoped(AUDITS_MODULE, undefined, {
      resource: 'compliance',
      fiscalYear: filters.fiscalYear ?? null,
      zoneId: filters.zoneId ?? null,
      complianceStatus: filters.complianceStatus ?? null,
      cursor: filters.cursor ?? null,
      limit: filters.limit ?? null,
    }),
  detail: (auditId: string | undefined) =>
    adminKeys.scoped(AUDITS_MODULE, undefined, { resource: 'detail', auditId: auditId ?? null }),
  /** Under the audits prefix on purpose: that is what every audit write invalidates, the tier PATCH included. */
  tierThresholds: () => adminKeys.scoped(AUDITS_MODULE, undefined, { resource: 'tierThresholds' }),
};

/** Cursor-paged audits for the calendar, history and compliance drill-downs. */
export function useAuditList(filters: AuditListFilters = {}, options: { enabled?: boolean } = {}): CursorList<AuditSummaryDto> {
  const map = useCallback(identity, []);
  return useCursorList(
    auditKeys.list(filters),
    (cursor, signal) => listAudits({ ...filters, cursor }, signal),
    map,
    options,
  );
}

/**
 * The compliance summary (counts + one farmers page). A plain query, not a
 * cursor list: the counts are the point and the farmers page is paged by
 * passing `cursor` in the filters.
 */
export function useAuditCompliance(filters: AuditComplianceFilters = {}) {
  return useAdminQuery(auditKeys.compliance(filters), (signal) => getAuditCompliance(filters, signal));
}

/** One audit with its score sheet and findings; nothing is fetched without an id. */
export function useAuditDetail(auditId: string | undefined) {
  return useAdminQuery(
    auditKeys.detail(auditId),
    (signal) => getAudit(auditId ?? '', signal),
    { enabled: auditId !== undefined && auditId !== '' },
  );
}

/**
 * Resolve the report to a signed URL on demand. A mutation, not a query, on
 * purpose: the signed URL lives 5 minutes, so caching it would hand a screen a
 * dead link; every tap asks the server again. Invalidates nothing.
 */
export function useAuditReport(auditId: string | undefined) {
  return useAdminMutation({
    mutationFn: (variant: AuditReportVariant = 'generated') => getAuditReportUrl(auditId ?? '', variant),
  });
}

export interface AuditIdVars {
  auditId: string;
}

export interface UpdateAuditVars extends AuditIdVars {
  body: AuditUpdateBody;
}

export interface AuditReasonVars extends AuditIdVars {
  body: AuditReasonBody;
}

export interface StartAuditVars extends AuditIdVars {
  body?: AuditStartBody;
}

export interface CompleteAuditVars extends AuditIdVars {
  body?: AuditCompleteBody;
}

export interface SaveAuditScoresVars extends AuditIdVars {
  body: AuditScoresBody;
}

export interface LogAuditFindingVars extends AuditIdVars {
  body: AuditFindingCreateBody;
}

export interface UpdateAuditFindingVars extends AuditIdVars {
  findingId: string;
  body: AuditFindingUpdateBody;
}

export interface ClearRedFlagVars extends AuditIdVars {
  body?: AuditClearRedFlagBody;
}

/** Schedule an audit (BR-03). */
export function useCreateAudit() {
  return useAdminMutation({
    mutationFn: (body: AuditCreateBody) => createAudit(body),
    invalidates: [AUDITS_PREFIX],
  });
}

/** Reschedule / reassign a SCHEDULED audit. */
export function useUpdateAudit() {
  return useAdminMutation({
    mutationFn: ({ auditId, body }: UpdateAuditVars) => updateAudit(auditId, body),
    invalidates: [AUDITS_PREFIX],
  });
}

/** Cancel an audit, freeing its quarter (BR-03a). */
export function useCancelAudit() {
  return useAdminMutation({
    mutationFn: ({ auditId, body }: AuditReasonVars) => cancelAudit(auditId, body),
    invalidates: [AUDITS_PREFIX],
  });
}

/** SCHEDULED -> IN_PROGRESS. */
export function useStartAudit() {
  return useAdminMutation({
    mutationFn: ({ auditId, body }: StartAuditVars) => startAudit(auditId, body),
    invalidates: [AUDITS_PREFIX],
  });
}

/** IN_PROGRESS -> COMPLETED (BR-04, BR-05, BR-06). */
export function useCompleteAudit() {
  return useAdminMutation({
    mutationFn: ({ auditId, body }: CompleteAuditVars) => completeAudit(auditId, body),
    invalidates: [AUDITS_PREFIX],
  });
}

/** Upsert category scores (BR-06). */
export function useSaveAuditScores() {
  return useAdminMutation({
    mutationFn: ({ auditId, body }: SaveAuditScoresVars) => setAuditScores(auditId, body),
    invalidates: [AUDITS_PREFIX],
  });
}

/** Log a finding (BR-05). */
export function useLogAuditFinding() {
  return useAdminMutation({
    mutationFn: ({ auditId, body }: LogAuditFindingVars) => createAuditFinding(auditId, body),
    invalidates: [AUDITS_PREFIX],
  });
}

/** Edit or resolve a finding (BR-05). */
export function useUpdateAuditFinding() {
  return useAdminMutation({
    mutationFn: ({ auditId, findingId, body }: UpdateAuditFindingVars) => updateAuditFinding(auditId, findingId, body),
    invalidates: [AUDITS_PREFIX],
  });
}

/** Red-flag a COMPLETED audit (BR-05b). */
export function useRaiseRedFlag() {
  return useAdminMutation({
    mutationFn: ({ auditId, body }: AuditReasonVars) => redFlagAudit(auditId, body),
    invalidates: [AUDITS_PREFIX],
  });
}

/** Clear an audit's red flag (BR-05b). */
export function useClearRedFlag() {
  return useAdminMutation({
    mutationFn: ({ auditId, body }: ClearRedFlagVars) => clearAuditRedFlag(auditId, body),
    invalidates: [AUDITS_PREFIX],
  });
}

/** Reschedule several audits; read `failedCount` / `results` for the partial outcome. */
export function useBulkRescheduleAudits() {
  return useAdminMutation({
    mutationFn: (body: AuditBulkRescheduleBody) => bulkRescheduleAudits(body),
    invalidates: [AUDITS_PREFIX],
  });
}

/**
 * The tier generation now in effect (BR-147a): four contiguous bands over
 * 0-100. The read carries the same permission as the write
 * (audit.tier.configure_thresholds) and answers 403, not an empty result, so a
 * screen passes `enabled: false` when the caller cannot configure (BR-147b).
 *
 * Its key sits under the audits prefix, so the tier PATCH below — which
 * invalidates that prefix — refetches it and the form shows what was saved.
 */
export function useAuditTierThresholds(options: { enabled?: boolean } = {}) {
  return useAdminQuery(auditKeys.tierThresholds(), (signal) => getAuditTierThresholds(signal), options);
}

/**
 * Replace the tier bands. Tiers are resolved at read time, so every audit read
 * (and its tier) refetches; farm-rating screens keyed elsewhere are untouched
 * here, their stored ratings keep their stored tier.
 */
export function useUpdateAuditTierThresholds() {
  return useAdminMutation({
    mutationFn: (body: TierBandsBody) => updateAuditTierThresholds(body),
    invalidates: [AUDITS_PREFIX],
  });
}

/**
 * Submit an inspection: start, scores, finding, complete (see runInspection
 * for the order and the partial-failure rule). One progress record lives for
 * the lifetime of the screen, so a retry after a failure resumes instead of
 * repeating a non-idempotent step.
 *
 * Unlike the other writes, the audits prefix is invalidated on failure too:
 * a failed run can still have started the audit or saved its scores, and the
 * detail the screen reads must show that.
 */
export function useInspectAudit() {
  const queryClient = useQueryClient();
  const progressRef = useRef<InspectionProgress | null>(null);
  if (progressRef.current === null) progressRef.current = newInspectionProgress();
  const progress = progressRef.current;
  return useAdminMutation<InspectionInput, AuditDetailDto>({
    mutationFn: async (input) => {
      try {
        return await runInspection(input, progress, {
          startAudit: (id) => startAudit(id),
          setAuditScores: (id, body) => setAuditScores(id, body),
          createAuditFinding: (id, body) => createAuditFinding(id, body),
          completeAudit: (id) => completeAudit(id),
          getAudit: (id) => getAudit(id),
        });
      } finally {
        void queryClient.invalidateQueries({ queryKey: AUDITS_PREFIX });
      }
    },
    invalidates: [AUDITS_PREFIX],
  });
}
