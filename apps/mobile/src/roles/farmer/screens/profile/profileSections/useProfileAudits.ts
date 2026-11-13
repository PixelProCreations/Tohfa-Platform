import { useCallback, useEffect, useRef, useState } from 'react';
import {
  auditDisplayDate,
  deriveAuditsOverview,
  listAllMyAudits,
  type FarmerAuditSummary,
} from '../../../api/audits';
import {
  auditCountdown,
  selectNextAudit,
  type WidgetState,
} from '../../dashboard/dashboardWidgets';
import { auditPillValue } from './profileHelpers';

/** Audits load independently of the other cards so a failure here never blanks the screen. */
export function useProfileAudits() {
  const [auditsState, setAuditsState] = useState<WidgetState<FarmerAuditSummary[]>>({
    kind: 'loading',
  });

  const loadAudits = useCallback(async (signal?: AbortSignal) => {
    try {
      const items = await listAllMyAudits(signal);
      if (signal?.aborted) return;
      setAuditsState({ kind: 'ready', data: items });
    } catch (error) {
      if (signal?.aborted) return;
      setAuditsState({ kind: 'error', error });
    }
  }, []);

  const auditsController = useRef<AbortController | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    auditsController.current = controller;
    void loadAudits(controller.signal);
    return () => controller.abort();
  }, [loadAudits]);

  const retryAudits = useCallback(() => {
    auditsController.current?.abort();
    const controller = new AbortController();
    auditsController.current = controller;
    setAuditsState({ kind: 'loading' });
    void loadAudits(controller.signal);
  }, [loadAudits]);

  // Real derived audit values -- the fallback-to-empty-array keeps every
  // expression below safe to evaluate during the loading/error states too.
  const auditItems = auditsState.kind === 'ready' ? auditsState.data : [];
  const nextAudit = auditsState.kind === 'ready' ? selectNextAudit(auditItems) : null;
  const pastAudits = [...auditItems]
    .filter((a) => a.status === 'COMPLETED')
    .sort((a, b) => Date.parse(auditDisplayDate(b)) - Date.parse(auditDisplayDate(a)));
  const auditsDoneThisYear =
    auditsState.kind === 'ready' ? deriveAuditsOverview(auditItems).doneThisYear : 0;
  const auditQuickStatValue =
    auditsState.kind === 'ready' ? auditPillValue(auditCountdown(nextAudit, new Date())) : '—';

  return {
    auditsState,
    retryAudits,
    auditItems,
    nextAudit,
    pastAudits,
    auditsDoneThisYear,
    auditQuickStatValue,
  };
}
