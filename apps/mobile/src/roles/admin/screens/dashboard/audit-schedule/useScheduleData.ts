/**
 * The Audit Schedule screen's reads, composed from screens/audits/useAuditsData.
 * A null query (a filter the API cannot express) disables the list, so the
 * screen shows the empty result rather than an unfiltered one.
 */
import { useEffect, useMemo } from 'react';
import type { AuditSummaryDto } from '../../../api/audits';
import type { CursorList } from '../../../api/hooks';
import { useAuditCompliance, useAuditList } from '../../audits/useAuditsData';
import { dayRange, exactCount, istDateOf, type IstDate, type ListQuery } from './scheduleFormat';

export function useQueryList(query: ListQuery): CursorList<AuditSummaryDto> {
  return useAuditList(query ?? {}, { enabled: query !== null });
}

/** The calendar needs every audit of the month for its dots, so it walks all pages. */
export function useWholeList(query: ListQuery): CursorList<AuditSummaryDto> {
  const list = useQueryList(query);
  const { hasMore, isLoading, loadMore } = list;
  useEffect(() => {
    if (hasMore && !isLoading) loadMore();
  }, [hasMore, isLoading, loadMore]);
  return list;
}

export interface FieldVisitKpis {
  upcoming: number | null;
  today: number | null;
  pending: number | null;
  completed: number | null;
}

/**
 * The four Farmer Admin KPI cards. PENDING is the compliance summary's
 * `overdueAudits` (SCHEDULED/IN_PROGRESS past their date). The other three
 * have no count endpoint: each is read off a list and shown only when the
 * whole list fits in its pages (exactCount), otherwise the dash.
 */
export function useFieldVisitKpis(enabled: boolean, now: Date): FieldVisitKpis {
  const today = istDateOf(now) as IstDate;
  const nowIso = now.toISOString();
  const upcomingQuery = useMemo<ListQuery>(
    () => (enabled ? { status: ['SCHEDULED'], scheduledFrom: nowIso, limit: 100 } : null),
    [enabled, nowIso],
  );
  const todayQuery = useMemo<ListQuery>(
    () => (enabled ? { ...dayRange(today), limit: 100 } : null),
    [enabled, today.year, today.month, today.day],
  );
  const completedQuery = useMemo<ListQuery>(() => (enabled ? { status: ['COMPLETED'], limit: 100 } : null), [enabled]);
  const upcoming = useQueryList(upcomingQuery);
  const todayList = useQueryList(todayQuery);
  const completed = useQueryList(completedQuery);
  const compliance = useAuditCompliance({ limit: 1 });
  return {
    upcoming: enabled ? exactCount(upcoming) : null,
    today: enabled ? exactCount(todayList) : null,
    pending: enabled && compliance.data !== undefined ? compliance.data.counts.overdueAudits : null,
    completed: enabled ? exactCount(completed) : null,
  };
}

/** The farmer's last COMPLETED audit before this one, for "Previous Audit Summary". */
export function usePreviousAudit(audit: AuditSummaryDto | undefined): AuditSummaryDto | undefined {
  const query = useMemo<ListQuery>(
    () =>
      audit === undefined
        ? null
        : { farmerId: audit.farmerId, status: ['COMPLETED'], scheduledTo: audit.scheduledFor, sort: '-scheduledFor', limit: 2 },
    [audit],
  );
  const list = useQueryList(query);
  return list.items.find((a) => audit !== undefined && a.id !== audit.id);
}

/** The newest COMPLETED audit in scope, which the calendar's "Reports" quick action opens. */
export function useLatestCompletedAudit(enabled: boolean): AuditSummaryDto | undefined {
  const query = useMemo<ListQuery>(
    () => (enabled ? { status: ['COMPLETED'], sort: '-scheduledFor', limit: 1 } : null),
    [enabled],
  );
  return useQueryList(query).items[0];
}
