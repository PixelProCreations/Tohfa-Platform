import { useCallback, useEffect, useState } from 'react';

import { t } from '../../../../../../i18n/farmer';
import { formatErrorMessage } from '../../../../../../shell/api/client';
import { getFarms, getPlots } from '../../../../api/farms';
import {
  listPestDetections,
  listPestLibrary,
  listPestTreatmentLogs,
  listPestTreatmentReminders,
  updatePestDetection,
  type PestDetection,
  type PestTreatmentLog,
  type UpdatePestDetectionInput,
} from '../../../../api/pest';
import { formatIsoDisplayShort } from './dateUtils';
import { appAlert } from '@tohfa/mobile-ui';

export type DetectionFilterTab = 'All' | 'Ongoing' | 'Resolved' | 'Recurring';

/**
 * Data layer of PestManagementScreen: farm/zone resolution, next-treatment
 * stat, detections list, and the detail view's reference/treatment history.
 *
 * `detailActive` is true while the detail view is showing; the detail fetch
 * only runs then.
 */
export function usePestDetections(farmId: string | undefined, detailActive: boolean) {
  // ── Farm / zone context this screen's data is scoped to ──
  // No zone picker is drawn anywhere in this mock's UI, so -- same "no
  // create-form UI to invent" limit UploadNewSoilTestScreen.tsx documents for
  // soil -- pest data here is logged against the farm's first zone.
  const [resolvedFarmId, setResolvedFarmId] = useState(farmId ?? '');
  const [plotId, setPlotId] = useState('');
  const [plotName, setPlotName] = useState('');
  const [contextLoading, setContextLoading] = useState(true);
  const [contextError, setContextError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setContextLoading(true);
      setContextError(null);
      try {
        let fid = farmId;
        if (!fid) {
          const farms = await getFarms();
          fid = farms[0]?.id;
        }
        if (!fid) {
          if (!cancelled) setContextError(t('farmer.pestManagement.error.noFarm'));
          return;
        }
        const plots = await getPlots(fid);
        const firstPlot = plots[0];
        if (!firstPlot) {
          if (!cancelled) setContextError(t('farmer.pestManagement.error.noZones'));
          return;
        }
        if (!cancelled) {
          setResolvedFarmId(fid);
          setPlotId(firstPlot.id);
          setPlotName(firstPlot.name);
        }
      } catch (err) {
        if (!cancelled) setContextError(formatErrorMessage(err, t('farmer.pestManagement.error.loadFarm')));
      } finally {
        if (!cancelled) setContextLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [farmId]);

  // ── Next Treatment hub stat: earliest upcoming reminder's due date ──
  const [nextTreatmentLabel, setNextTreatmentLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!resolvedFarmId || !plotId) return;
    let cancelled = false;
    void (async () => {
      try {
        const reminders = await listPestTreatmentReminders(resolvedFarmId, plotId);
        const upcoming = reminders
          .filter((r) => r.status === 'Upcoming')
          .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
        if (!cancelled) setNextTreatmentLabel(upcoming[0] ? formatIsoDisplayShort(upcoming[0].dueDate) : null);
      } catch {
        if (!cancelled) setNextTreatmentLabel(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [resolvedFarmId, plotId]);

  // ── Detections ──
  const [selectedDetection, setSelectedDetection] = useState<PestDetection | null>(null);
  const [detections, setDetections] = useState<PestDetection[]>([]);
  const [detectionsLoading, setDetectionsLoading] = useState(false);
  const [detectionsError, setDetectionsError] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<DetectionFilterTab>('All');

  const loadDetections = useCallback(async () => {
    if (!resolvedFarmId || !plotId) return;
    setDetectionsLoading(true);
    setDetectionsError(null);
    try {
      const items = await listPestDetections(resolvedFarmId, plotId);
      setDetections(items);
    } catch (err) {
      setDetectionsError(formatErrorMessage(err, t('farmer.pestManagement.error.loadDetections')));
    } finally {
      setDetectionsLoading(false);
    }
  }, [resolvedFarmId, plotId]);

  useEffect(() => {
    void loadDetections();
  }, [loadDetections]);

  // ── Detection detail view: reference treatments (from the pest library) and
  // this detection's own treatment history (this plot's treatment logs, filtered
  // to the ones recorded against it). ──
  const [referenceTreatments, setReferenceTreatments] = useState<string[]>([]);
  const [detailTreatmentHistory, setDetailTreatmentHistory] = useState<PestTreatmentLog[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!detailActive || !selectedDetection || !resolvedFarmId || !plotId) return;
    let cancelled = false;
    void (async () => {
      setDetailLoading(true);
      try {
        const [libraryMatches, logs] = await Promise.all([
          listPestLibrary({ q: selectedDetection.pestName }),
          listPestTreatmentLogs(resolvedFarmId, plotId),
        ]);
        if (cancelled) return;
        setReferenceTreatments(libraryMatches[0]?.organicTreatments ?? []);
        setDetailTreatmentHistory(logs.filter((l) => l.detectionId === selectedDetection.id));
      } catch {
        if (!cancelled) {
          setReferenceTreatments([]);
          setDetailTreatmentHistory([]);
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [detailActive, selectedDetection, resolvedFarmId, plotId]);

  const applyDetectionUpdate = async (input: UpdatePestDetectionInput) => {
    if (!resolvedFarmId || !plotId || !selectedDetection) return;
    try {
      const updated = await updatePestDetection(resolvedFarmId, plotId, selectedDetection.id, input);
      setSelectedDetection(updated);
      setDetections((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    } catch (err) {
      appAlert(
        t('farmer.pestManagement.alert.couldNotUpdateTitle'),
        formatErrorMessage(err, t('farmer.pestManagement.error.tryAgain')),
        undefined,
        { tone: 'error' },
      );
    }
  };

  const activeCount = detections.filter((d) => d.status === 'Ongoing' || d.status === 'Recurring').length;
  const resolvedCount = detections.filter((d) => d.status === 'Resolved').length;
  const filteredDetections = detections.filter((d) => {
    if (filterTab === 'All') return true;
    return d.status === filterTab;
  });

  return {
    resolvedFarmId,
    setResolvedFarmId,
    plotId,
    setPlotId,
    plotName,
    contextLoading,
    contextError,
    nextTreatmentLabel,
    selectedDetection,
    setSelectedDetection,
    detections,
    setDetections,
    detectionsLoading,
    detectionsError,
    filterTab,
    setFilterTab,
    referenceTreatments,
    detailTreatmentHistory,
    detailLoading,
    applyDetectionUpdate,
    activeCount,
    resolvedCount,
    filteredDetections,
  };
}

export type PestDetectionsState = ReturnType<typeof usePestDetections>;
