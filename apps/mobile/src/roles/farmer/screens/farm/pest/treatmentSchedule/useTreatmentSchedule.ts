import { useCallback, useEffect, useReducer } from 'react';

import { formatErrorMessage } from '../../../../../../shell/api/client';
import { getFarms, getPlots } from '../../../../api/farms';
import {
  createPestTreatmentReminder,
  listPestDetections,
  listPestTreatmentReminders,
  updatePestTreatmentReminder,
  type CreatePestTreatmentReminderInput,
  type PestTreatmentReminder,
} from '../../../../api/pest';
import { formatDisplayDate, formatIsoDisplay, toIsoDate } from './dateUtils';
import { ts } from './i18n';
import { initialScheduleState, scheduleReducer, type ScheduleState } from './scheduleReducer';
import { appAlert } from '@tohfa/mobile-ui';

export function useTreatmentSchedule(farmId: string | undefined, plotId: string | undefined) {
  const [state, dispatch] = useReducer(scheduleReducer, undefined, () => initialScheduleState(farmId, plotId));
  const { resolvedFarmId, resolvedPlotId } = state;

  const patch = useCallback((p: Partial<ScheduleState>) => dispatch({ type: 'patch', patch: p }), []);

  // Resolve farm + zone (first of each) when not threaded down from the hub.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      patch({ contextLoading: true, contextError: null });
      try {
        let fid = farmId;
        if (!fid) {
          const farms = await getFarms();
          fid = farms[0]?.id;
        }
        if (!fid) {
          if (!cancelled) patch({ contextError: ts('farmer.treatmentSchedule.error.noFarm') });
          return;
        }
        let pid = plotId;
        if (!pid) {
          const plots = await getPlots(fid);
          pid = plots[0]?.id;
        }
        if (!pid) {
          if (!cancelled) patch({ contextError: ts('farmer.treatmentSchedule.error.noZone') });
          return;
        }
        if (!cancelled) patch({ resolvedFarmId: fid, resolvedPlotId: pid });
      } catch (err) {
        if (!cancelled) {
          patch({ contextError: formatErrorMessage(err, ts('farmer.pestManagement.error.loadFarm')) });
        }
      } finally {
        if (!cancelled) patch({ contextLoading: false });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [farmId, plotId, patch]);

  const loadReminders = useCallback(async () => {
    if (!resolvedFarmId || !resolvedPlotId) return;
    patch({ remindersLoading: true, remindersError: null });
    try {
      const items = await listPestTreatmentReminders(resolvedFarmId, resolvedPlotId);
      patch({ reminders: items });
    } catch (err) {
      patch({ remindersError: formatErrorMessage(err, ts('farmer.treatmentSchedule.error.loadReminders')) });
    } finally {
      patch({ remindersLoading: false });
    }
  }, [resolvedFarmId, resolvedPlotId, patch]);

  useEffect(() => {
    void loadReminders();
  }, [loadReminders]);

  // Live pest detections for the "Linked Detection" picker.
  useEffect(() => {
    if (!resolvedFarmId || !resolvedPlotId) return;
    let cancelled = false;
    void (async () => {
      try {
        const items = await listPestDetections(resolvedFarmId, resolvedPlotId);
        if (!cancelled) patch({ detections: items });
      } catch {
        // Non-fatal -- the picker just offers "None" if detections can't be fetched.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [resolvedFarmId, resolvedPlotId, patch]);

  const linkedDetection = state.linkedDetectionId
    ? state.detections.find((d) => d.id === state.linkedDetectionId) ?? null
    : null;

  const linkedDetectionLabel = linkedDetection
    ? ts('farmer.treatmentSchedule.detection.label', {
        pest: linkedDetection.pestName,
        date: formatIsoDisplay(linkedDetection.detectedOn),
      })
    : ts('farmer.treatmentSchedule.detection.none');

  const handleSaveReminder = async () => {
    if (!state.treatmentName.trim()) {
      appAlert(
        ts('farmer.logPestTreatment.alert.requiredTitle'),
        ts('farmer.treatmentSchedule.alert.enterName'),
        undefined,
        { tone: 'error' },
      );
      return;
    }
    patch({ saving: true, saveError: null });
    try {
      // Same resilient on-demand resolution as AddWorkerScreen.tsx /
      // PestManagementScreen.tsx: resolve farmId/plotId here if the
      // background effect has not landed yet, rather than failing Save on
      // that race.
      let saveFarmId = resolvedFarmId;
      let savePlotId = resolvedPlotId;
      if (!saveFarmId || !savePlotId) {
        const farms = await getFarms();
        const fid = farms[0]?.id;
        if (fid) {
          const plots = await getPlots(fid);
          const pid = plots[0]?.id;
          if (pid) {
            saveFarmId = fid;
            savePlotId = pid;
            patch({ resolvedFarmId: fid, resolvedPlotId: pid });
          }
        }
      }
      if (!saveFarmId || !savePlotId) {
        appAlert(
          ts('farmer.pestManagement.alert.noFarmTitle'),
          ts('farmer.treatmentSchedule.alert.noFarmMessage'),
          undefined,
          { tone: 'error' },
        );
        patch({ saving: false });
        return;
      }

      // Payload values are API enums / user text, independent of locale.
      const body: CreatePestTreatmentReminderInput = {
        title: state.treatmentName.trim(),
        dueDate: toIsoDate(state.calDate),
        repeatInterval: state.repeatOption,
        ...(linkedDetection ? { detectionId: linkedDetection.id, targetPest: linkedDetection.pestName } : {}),
        ...(state.notes.trim() ? { notes: state.notes.trim() } : {}),
      };
      const created = await createPestTreatmentReminder(saveFarmId, savePlotId, body);
      dispatch({ type: 'savedReminder', reminder: created });
    } catch (err) {
      patch({ saveError: formatErrorMessage(err, ts('farmer.treatmentSchedule.error.saveFailed')) });
    } finally {
      patch({ saving: false });
    }
  };

  const handleToggleReminderStatus = async (reminder: PestTreatmentReminder) => {
    if (!resolvedFarmId || !resolvedPlotId) return;
    const nextStatus = reminder.status === 'Upcoming' ? 'Completed' : 'Upcoming';
    try {
      const updated = await updatePestTreatmentReminder(resolvedFarmId, resolvedPlotId, reminder.id, {
        status: nextStatus,
      });
      dispatch({ type: 'replaceReminder', reminder: updated });
      // The toggle moves the reminder to the other tab -- it can otherwise
      // look identical to the item being deleted. Confirm what happened and
      // where to find it, rather than leaving this silent.
      appAlert(
        nextStatus === 'Completed'
          ? ts('farmer.treatmentSchedule.alert.markedCompleteTitle')
          : ts('farmer.treatmentSchedule.alert.movedUpcomingTitle'),
        nextStatus === 'Completed'
          ? ts('farmer.treatmentSchedule.alert.nowCompleted', { title: updated.title })
          : ts('farmer.treatmentSchedule.alert.nowUpcoming', { title: updated.title }),
        undefined,
        { tone: 'success' },
      );
    } catch (err) {
      appAlert(
        ts('farmer.pestManagement.alert.couldNotUpdateTitle'),
        formatErrorMessage(err, ts('farmer.pestManagement.error.tryAgain')),
        undefined,
        { tone: 'error' },
      );
    }
  };

  const handleApplyDate = () => {
    patch({ scheduledDate: formatDisplayDate(state.calDate), isCalendarOpen: false });
  };

  return {
    state,
    patch,
    dispatch,
    linkedDetectionLabel,
    handleSaveReminder,
    handleToggleReminderStatus,
    handleApplyDate,
  };
}
