import { useEffect, useState } from 'react';

import DocumentPicker from '../../../../native/documentPicker';
import { t } from '../../../../../../i18n/farmer';
import { formatErrorMessage } from '../../../../../../shell/api/client';
import { getFarms, getPlots } from '../../../../api/farms';
import {
  createPestDetection,
  listPestLibrary,
  uploadPestPhoto,
  type CreatePestDetectionInput,
  type PestDetection,
  type PestLibraryEntry,
} from '../../../../api/pest';
import { formatDisplayDate, toIsoDate } from './dateUtils';
import { appAlert } from '@tohfa/mobile-ui';

// No crop-tracking API exists yet (known gap, out of scope here), so this
// stays a free-text picker, same as LogPestTreatmentScreen's crop/zone
// picker -- the crop half is sent as `cropLabel` (free text, 0024) below,
// never as a `farmCropId`. The zone half isn't sent at all: this screen has
// no real zone picker (see the farmId/plotId resolution in usePestDetections),
// so the detection is always logged against the farm's first zone regardless
// of what's picked here; the card/detail views show the *real* zone name
// (`plotName`) rather than this free-text guess.
export const CROP_ZONE_OPTIONS = [
  'Carrot — Nantes, Zone 1',
  'Beetroot, Zone 2',
  'Cabbage, Zone 3',
  'Tomato, Zone 2',
  'Beans, Zone 1',
];

export type PestSeverity = 'Low' | 'Medium' | 'High';

interface UseReportFormArgs {
  resolvedFarmId: string;
  plotId: string;
  setResolvedFarmId: (id: string) => void;
  setPlotId: (id: string) => void;
  /** Called after a detection is created, before the form resets. */
  onCreated: (created: PestDetection) => void;
}

/** State + handlers for the "Report New Detection" modal and its calendar overlay. */
export function useReportForm({ resolvedFarmId, plotId, setResolvedFarmId, setPlotId, onCreated }: UseReportFormArgs) {
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [newCropZone, setNewCropZone] = useState('Carrot — Nantes, Zone 1');
  const [isCropPickerOpen, setIsCropPickerOpen] = useState(false);
  const [newPestType, setNewPestType] = useState('');
  const [selectedPestLibraryId, setSelectedPestLibraryId] = useState<string | undefined>(undefined);
  const [pestSuggestions, setPestSuggestions] = useState<PestLibraryEntry[]>([]);
  const [isPestSuggestionsOpen, setIsPestSuggestionsOpen] = useState(false);
  const [newSeverity, setNewSeverity] = useState<PestSeverity>('Low');
  const [newDate, setNewDate] = useState('18 Sep 2026');
  const [newNotes, setNewNotes] = useState('');
  const [newPhoto, setNewPhoto] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [savingDetection, setSavingDetection] = useState(false);
  const [saveDetectionError, setSaveDetectionError] = useState<string | null>(null);

  // Calendar Modal for Date Detected
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarDate, setCalendarDate] = useState<Date>(new Date(2026, 8, 18));
  const [calendarYear, setCalendarYear] = useState<number>(2026);
  const [calendarMonth, setCalendarMonth] = useState<number>(8);
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);

  // Live search against the pest library as the farmer types in "Pest Type"
  // (the field already carried a search icon + "Chosen manually from the
  // Pest Library" copy in the original mock, but was never wired to a real
  // suggestion list). Debounced so quick typing doesn't fire a query per
  // keystroke. A free-text pest not in the library is still accepted --
  // `selectedPestLibraryId` just stays unset, matching the "no
  // auto-detection" disclaimer's own point that this is farmer-driven, not
  // enforced.
  useEffect(() => {
    if (selectedPestLibraryId) return; // just picked one; don't re-search it
    const query = newPestType.trim();
    if (query.length < 2) {
      setPestSuggestions([]);
      setIsPestSuggestionsOpen(false);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const results = await listPestLibrary({ q: query });
          if (!cancelled) {
            setPestSuggestions(results);
            setIsPestSuggestionsOpen(results.length > 0);
          }
        } catch {
          if (!cancelled) {
            setPestSuggestions([]);
            setIsPestSuggestionsOpen(false);
          }
        }
      })();
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [newPestType, selectedPestLibraryId]);

  const handleSelectPestSuggestion = (entry: PestLibraryEntry) => {
    setNewPestType(entry.name);
    setSelectedPestLibraryId(entry.id);
    setIsPestSuggestionsOpen(false);
  };

  const handlePestTypeChange = (text: string) => {
    setNewPestType(text);
    setSelectedPestLibraryId(undefined);
  };

  const handlePestTypeFocus = () => {
    if (pestSuggestions.length > 0 && !selectedPestLibraryId) setIsPestSuggestionsOpen(true);
  };

  const handlePickPhoto = async () => {
    try {
      const picked = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.images],
        copyTo: 'cachesDirectory',
      });
      setNewPhoto({
        uri: picked.fileCopyUri ?? picked.uri,
        name: picked.name ?? 'pest_photo.jpg',
        type: picked.type ?? 'image/jpeg',
      });
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        appAlert(
          t('farmer.pestManagement.alert.attachPhotoTitle'),
          formatErrorMessage(err, t('farmer.pestManagement.error.tryAgain')),
          undefined,
          { tone: 'error' },
        );
      }
    }
  };

  const handleSaveDetection = async () => {
    if (!newPestType.trim()) {
      appAlert(t('farmer.pestManagement.alert.requiredTitle'), t('farmer.pestManagement.alert.requiredMessage'), undefined, { tone: 'error' });
      return;
    }
    setSavingDetection(true);
    setSaveDetectionError(null);
    try {
      // Same resilient on-demand resolution as AddWorkerScreen.tsx: rather
      // than failing Save on a farmId/plotId race against the background
      // getFarms()/getPlots() effect, resolve it here if it hasn't landed yet.
      let saveFarmId = resolvedFarmId;
      let savePlotId = plotId;
      if (!saveFarmId || !savePlotId) {
        const farms = await getFarms();
        const fid = farms[0]?.id;
        if (fid) {
          const plots = await getPlots(fid);
          const pid = plots[0]?.id;
          if (pid) {
            saveFarmId = fid;
            savePlotId = pid;
            setResolvedFarmId(fid);
            setPlotId(pid);
          }
        }
      }
      if (!saveFarmId || !savePlotId) {
        appAlert(t('farmer.pestManagement.alert.noFarmTitle'), t('farmer.pestManagement.alert.noFarmMessage'), undefined, { tone: 'error' });
        setSavingDetection(false);
        return;
      }

      let photoUploadId: string | undefined;
      if (newPhoto) {
        try {
          const uploaded = await uploadPestPhoto(newPhoto.uri, newPhoto.name, newPhoto.type);
          photoUploadId = uploaded.uploadId;
        } catch {
          // Non-fatal: the detection itself is still worth logging.
        }
      }

      // Same split the original mock used before this screen was wired to the
      // API: the "Crop/Zone" picker is one combined string, and only the crop
      // half is meaningful data to persist (see CROP_ZONE_OPTIONS above for
      // why the zone half isn't sent).
      const cropLabel = newCropZone.split(',')[0]?.trim() || newCropZone;
      const body: CreatePestDetectionInput = {
        pestName: newPestType.trim(),
        ...(selectedPestLibraryId ? { pestLibraryId: selectedPestLibraryId } : {}),
        cropLabel,
        severity: newSeverity,
        detectedOn: toIsoDate(calendarDate),
        ...(newNotes.trim() ? { notes: newNotes.trim() } : {}),
        ...(photoUploadId ? { photoUploadId } : {}),
      };
      const created = await createPestDetection(saveFarmId, savePlotId, body);

      onCreated(created);
      setIsReportModalVisible(false);
      setNewPestType('');
      setSelectedPestLibraryId(undefined);
      setPestSuggestions([]);
      setIsPestSuggestionsOpen(false);
      setNewNotes('');
      setNewPhoto(null);
      appAlert(
        t('farmer.pestManagement.alert.reportedTitle'),
        t('farmer.pestManagement.alert.reportedMessage', { pest: created.pestName }),
        undefined,
        { tone: 'success' },
      );
    } catch (err) {
      setSaveDetectionError(formatErrorMessage(err, t('farmer.pestManagement.error.saveDetection')));
    } finally {
      setSavingDetection(false);
    }
  };

  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((y) => y - 1);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((y) => y + 1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  };

  const handleApplyCalendarDate = () => {
    setNewDate(formatDisplayDate(calendarDate));
    setIsCalendarOpen(false);
  };

  const handleSelectYear = (y: number) => {
    setCalendarYear(y);
    setCalendarDate(
      new Date(y, calendarMonth, Math.min(calendarDate.getDate(), new Date(y, calendarMonth + 1, 0).getDate())),
    );
    setIsYearPickerOpen(false);
  };

  return {
    isReportModalVisible,
    setIsReportModalVisible,
    newCropZone,
    setNewCropZone,
    isCropPickerOpen,
    setIsCropPickerOpen,
    newPestType,
    pestSuggestions,
    isPestSuggestionsOpen,
    newSeverity,
    setNewSeverity,
    newDate,
    newNotes,
    setNewNotes,
    newPhoto,
    setNewPhoto,
    savingDetection,
    saveDetectionError,
    isCalendarOpen,
    setIsCalendarOpen,
    calendarDate,
    setCalendarDate,
    calendarYear,
    calendarMonth,
    isYearPickerOpen,
    setIsYearPickerOpen,
    handleSelectPestSuggestion,
    handlePestTypeChange,
    handlePestTypeFocus,
    handlePickPhoto,
    handleSaveDetection,
    handlePrevMonth,
    handleNextMonth,
    handleApplyCalendarDate,
    handleSelectYear,
  };
}

export type ReportFormState = ReturnType<typeof useReportForm>;
