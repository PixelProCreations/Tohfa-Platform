import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
import DocumentPicker from 'react-native-document-picker';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { Skeleton } from '@tohfa/mobile-ui';
import { authPalette as P, colors, typography } from '../../../theme';
import { formatErrorMessage } from '../../../../../shell/api/client';
import { getFarms, getPlots } from '../../../api/farms';
import {
  createPestDetection,
  listPestDetections,
  listPestLibrary,
  listPestTreatmentLogs,
  listPestTreatmentReminders,
  updatePestDetection,
  uploadPestPhoto,
  type CreatePestDetectionInput,
  type PestDetection,
  type PestLibraryEntry,
  type PestTreatmentLog,
  type UpdatePestDetectionInput,
} from '../../../api/pest';
import { PestLibraryScreen } from './PestLibraryScreen';
import { TreatmentScheduleScreen } from './TreatmentScheduleScreen';
import { WeatherRiskAnalyticsScreen } from './WeatherRiskAnalyticsScreen';

// ── Vector Icons ─────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = P.deepGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CloseIcon({ size = 20, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightIcon({ size = 18, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 16, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronLeftIcon({ size = 18, color = P.deepGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PestBugIcon({ size = 24, color = P.red600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 7.5a3 3 0 0 1 6 0v0.5H9V7.5z" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M8 4L6.5 2M16 4l1.5-2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Rect x="7" y="8" width="10" height="11" rx="5" stroke={color} strokeWidth="1.8" />
      <Line x1="12" y1="11" x2="12" y2="19" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="12" cy="15" r="1.2" fill={color} />
      <Path
        d="M7 11.5H3.5M20.5 11.5H17M7 15H3.5M20.5 15H17M7 18.5l-3 1.5M20 20l-3-1.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function BookLibraryIcon({ size = 22, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CalendarScheduleIcon({ size = 22, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M12 14v4M10 16h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function WeatherAnalyticsIcon({ size = 22, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 17l6-6 4 4 8-8"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M17 7h4v4" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CameraIcon({ size = 26, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function SearchIcon({ size = 16, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Line x1="16.5" y1="16.5" x2="21" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function InfoCircleIcon({ size = 16, color = P.googleBlue }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Line x1="12" y1="8" x2="12" y2="8.01" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      <Line x1="12" y1="11" x2="12" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CalendarIcon({ size = 18, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CheckIcon({ size = 18, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 13l4 4L19 7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface PestManagementScreenProps {
  /**
   * Threaded down like SoilManagementScreen's farmId when a caller already has
   * one; resolved locally (first farm, via `getFarms()`) when this screen is the
   * root of the pest subtree -- App.tsx's `navigate('PestManagement')` passes no
   * farmId today, the same situation SoilManagementScreen resolves for its own
   * subtree on mount.
   */
  farmId?: string | undefined;
  onBack?: () => void;
  onNavigateToSchedule?: ((farmId: string) => void) | undefined;
  onNavigateToPestLibrary?: ((farmId: string) => void) | undefined;
  onNavigateToWeatherRisk?: ((farmId: string) => void) | undefined;
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
] as const;

function formatDisplayDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = MONTHS_SHORT[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

/** `Date` -> the `YYYY-MM-DD` the API's `dateSchema` requires (pest.schema.ts). */
function toIsoDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** `YYYY-MM-DD` (or any ISO datetime) -> the `DD Mon YYYY` this screen displays. */
function formatIsoDisplay(iso: string): string {
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  if (isNaN(d.getTime())) return iso;
  return formatDisplayDate(d);
}

/** `YYYY-MM-DD` -> the `DD Mon` short form the "Next Treatment" stat card used (e.g. "21 Sep"). */
function formatIsoDisplayShort(iso: string): string {
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  if (isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS_SHORT[d.getMonth()]}`;
}

export function PestManagementScreen({
  farmId,
  onBack,
  onNavigateToSchedule,
  onNavigateToPestLibrary,
  onNavigateToWeatherRisk,
}: PestManagementScreenProps): React.JSX.Element {
  // Navigation view: 'hub' | 'log' | 'detail' | 'library' | 'schedule' | 'weatherRisk'
  const [currentView, setCurrentView] = useState<'hub' | 'log' | 'detail' | 'library' | 'schedule' | 'weatherRisk'>('hub');

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
          if (!cancelled) setContextError('No farm found. Add a farm before managing pests.');
          return;
        }
        const plots = await getPlots(fid);
        const firstPlot = plots[0];
        if (!firstPlot) {
          if (!cancelled) setContextError('This farm has no zones yet. Add a zone before logging pest data.');
          return;
        }
        if (!cancelled) {
          setResolvedFarmId(fid);
          setPlotId(firstPlot.id);
          setPlotName(firstPlot.name);
        }
      } catch (err) {
        if (!cancelled) setContextError(formatErrorMessage(err, 'Could not load your farm.'));
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
  const [filterTab, setFilterTab] = useState<'All' | 'Ongoing' | 'Resolved' | 'Recurring'>('All');

  const loadDetections = useCallback(async () => {
    if (!resolvedFarmId || !plotId) return;
    setDetectionsLoading(true);
    setDetectionsError(null);
    try {
      const items = await listPestDetections(resolvedFarmId, plotId);
      setDetections(items);
    } catch (err) {
      setDetectionsError(formatErrorMessage(err, 'Could not load pest detections.'));
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
    if (currentView !== 'detail' || !selectedDetection || !resolvedFarmId || !plotId) return;
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
  }, [currentView, selectedDetection, resolvedFarmId, plotId]);

  // Report Modal State
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [newCropZone, setNewCropZone] = useState('Carrot — Nantes, Zone 1');
  const [isCropPickerOpen, setIsCropPickerOpen] = useState(false);
  const [newPestType, setNewPestType] = useState('');
  const [selectedPestLibraryId, setSelectedPestLibraryId] = useState<string | undefined>(undefined);
  const [pestSuggestions, setPestSuggestions] = useState<PestLibraryEntry[]>([]);
  const [isPestSuggestionsOpen, setIsPestSuggestionsOpen] = useState(false);
  const [newSeverity, setNewSeverity] = useState<'Low' | 'Medium' | 'High'>('Low');
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

  // No crop-tracking API exists yet (known gap, out of scope here), so this
  // stays a free-text picker, same as LogPestTreatmentScreen's crop/zone
  // picker -- the crop half is sent as `cropLabel` (free text, 0024) below,
  // never as a `farmCropId`. The zone half isn't sent at all: this screen has
  // no real zone picker (see the farmId/plotId resolution effect above), so
  // the detection is always logged against the farm's first zone regardless
  // of what's picked here; the card/detail views show the *real* zone name
  // (`plotName`) rather than this free-text guess.
  const cropZoneOptions = [
    'Carrot — Nantes, Zone 1',
    'Beetroot, Zone 2',
    'Cabbage, Zone 3',
    'Tomato, Zone 2',
    'Beans, Zone 1',
  ];

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
        Alert.alert('Could Not Attach Photo', formatErrorMessage(err, 'Please try again.'));
      }
    }
  };

  const handleSaveDetection = async () => {
    if (!newPestType.trim()) {
      Alert.alert('Required Field', 'Please enter or select a pest type.');
      return;
    }
    setSavingDetection(true);
    setSaveDetectionError(null);
    try {
      // Same resilient on-demand resolution as AddWorkerScreen.tsx: rather
      // than failing Save on a farmId/plotId race against this screen's own
      // background getFarms()/getPlots() effect, resolve it here if it
      // hasn't landed yet.
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
        Alert.alert('No Farm Found', 'Add a farm and a zone before reporting a detection.');
        setSavingDetection(false);
        return;
      }

      if (newPhoto) {
        try {
          await uploadPestPhoto(newPhoto.uri, newPhoto.name, newPhoto.type);
          // Spec gap (see pest.ts's uploadPestPhoto docblock): the photo is
          // uploaded for safekeeping but photoUploadId cannot be linked yet.
        } catch {
          // Non-fatal: the detection itself is still worth logging.
        }
      }

      // Same split the original mock used before this screen was wired to the
      // API: the "Crop/Zone" picker is one combined string, and only the crop
      // half is meaningful data to persist (see the cropZoneOptions comment
      // above for why the zone half isn't sent).
      const cropLabel = newCropZone.split(',')[0]?.trim() || newCropZone;
      const body: CreatePestDetectionInput = {
        pestName: newPestType.trim(),
        ...(selectedPestLibraryId ? { pestLibraryId: selectedPestLibraryId } : {}),
        cropLabel,
        severity: newSeverity,
        detectedOn: toIsoDate(calendarDate),
        ...(newNotes.trim() ? { notes: newNotes.trim() } : {}),
      };
      const created = await createPestDetection(saveFarmId, savePlotId, body);

      setDetections((prev) => [created, ...prev]);
      setIsReportModalVisible(false);
      setSelectedDetection(created);
      setNewPestType('');
      setSelectedPestLibraryId(undefined);
      setPestSuggestions([]);
      setIsPestSuggestionsOpen(false);
      setNewNotes('');
      setNewPhoto(null);
      setCurrentView('log');
      Alert.alert('Detection Reported', `${created.pestName} detection has been logged successfully.`);
    } catch (err) {
      setSaveDetectionError(formatErrorMessage(err, 'Could not save this detection.'));
    } finally {
      setSavingDetection(false);
    }
  };

  const applyDetectionUpdate = async (input: UpdatePestDetectionInput) => {
    if (!resolvedFarmId || !plotId || !selectedDetection) return;
    try {
      const updated = await updatePestDetection(resolvedFarmId, plotId, selectedDetection.id, input);
      setSelectedDetection(updated);
      setDetections((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    } catch (err) {
      Alert.alert('Could Not Update', formatErrorMessage(err, 'Please try again.'));
    }
  };

  const handleToggleResolved = () => {
    if (!selectedDetection) return;
    if (selectedDetection.status === 'Resolved') {
      void applyDetectionUpdate({ status: 'Ongoing' });
      Alert.alert('Reopened Detection', 'Status updated to Ongoing.');
      return;
    }
    // Closes the gap between the mock and what WeatherRiskAnalyticsScreen's
    // effectiveness stat needs: `resolutionEffective` is the farmer's own
    // after-the-fact assessment (BR-38), never guessed by the client.
    Alert.alert(
      'Mark Resolved',
      'Did your treatment work?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'No, not effective',
          onPress: () => {
            void applyDetectionUpdate({ status: 'Resolved', resolutionEffective: false });
            Alert.alert('Marked as Resolved', 'Status updated to Resolved.');
          },
        },
        {
          text: 'Yes, effective',
          onPress: () => {
            void applyDetectionUpdate({ status: 'Resolved', resolutionEffective: true });
            Alert.alert('Marked as Resolved', 'Status updated to Resolved.');
          },
        },
      ],
    );
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

  const activeCount = detections.filter((d) => d.status === 'Ongoing' || d.status === 'Recurring').length;
  const resolvedCount = detections.filter((d) => d.status === 'Resolved').length;

  const filteredDetections = detections.filter((d) => {
    if (filterTab === 'All') return true;
    return d.status === filterTab;
  });

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* ──────────────────────────────────────────────────────────────────────────
          VIEW 1: PEST MANAGEMENT HUB (Screenshots 1 & 2)
      ────────────────────────────────────────────────────────────────────────── */}
      {currentView === 'hub' && (
        <View style={styles.container}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.hubScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header with back button */}
            <View style={styles.hubHeaderRow}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={onBack}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Back"
              >
                <ArrowBackIcon size={20} color={P.deepGreen} />
              </TouchableOpacity>
            </View>

            {/* Central Icon & Title */}
            <View style={styles.hubTitleSection}>
              <View style={styles.hubIconBadge}>
                <PestBugIcon size={28} color={colors.brandGreen} />
              </View>
              <Text style={styles.hubMainTitle}>Pest Management</Text>
              <Text style={styles.hubSubtitle}>
                Detection log, pest library, and treatment schedule — all in one place.
              </Text>
            </View>

            {contextError ? (
              <Text style={styles.loadErrorText}>{contextError}</Text>
            ) : (
              <>
                {/* Stats Row */}
                <View style={styles.statsRow}>
                  <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{contextLoading ? '—' : activeCount}</Text>
                    <Text style={styles.statLabel}>Active Detections</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{nextTreatmentLabel ?? '—'}</Text>
                    <Text style={styles.statLabel}>Next Treatment</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{contextLoading ? '—' : resolvedCount}</Text>
                    <Text style={styles.statLabel}>Resolved</Text>
                  </View>
                </View>
              </>
            )}

            {/* Features List */}
            <Text style={styles.sectionHeaderTitle}>FEATURES</Text>

            <View style={styles.featuresList}>
              {/* Feature 1: Detection Log */}
              <TouchableOpacity
                style={styles.featureCard}
                activeOpacity={0.8}
                onPress={() => setCurrentView('log')}
              >
                <View style={[styles.featureIconBox, { backgroundColor: P.forestGreen }]}>
                  <PestBugIcon size={22} color={P.white} />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureCode}>FR-F07-B</Text>
                  <Text style={styles.featureTitle}>Detection Log</Text>
                  <Text style={styles.featureDesc}>Photos, severity, and resolution status for every report</Text>
                </View>
                <ChevronRightIcon size={18} color={P.twGray400} />
              </TouchableOpacity>

              {/* Feature 2: Pest Library */}
              <TouchableOpacity
                style={styles.featureCard}
                activeOpacity={0.8}
                onPress={() => {
                  if (onNavigateToPestLibrary) {
                    onNavigateToPestLibrary(resolvedFarmId);
                  } else {
                    setCurrentView('library');
                  }
                }}
              >
                <View style={[styles.featureIconBox, { backgroundColor: colors.brandGreen }]}>
                  <BookLibraryIcon size={22} color={P.white} />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureCode}>FR-F07-C</Text>
                  <Text style={styles.featureTitle}>Pest Library</Text>
                  <Text style={styles.featureDesc}>Common pests, symptoms, seasonal risk, treatments</Text>
                </View>
                <ChevronRightIcon size={18} color={P.twGray400} />
              </TouchableOpacity>

              {/* Feature 3: Treatment Schedule */}
              <TouchableOpacity
                style={styles.featureCard}
                activeOpacity={0.8}
                onPress={() => {
                  if (onNavigateToSchedule) {
                    onNavigateToSchedule(resolvedFarmId);
                  } else {
                    setCurrentView('schedule');
                  }
                }}
              >
                <View style={[styles.featureIconBox, { backgroundColor: P.orange800 }]}>
                  <CalendarScheduleIcon size={22} color={P.white} />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureCode}>FR-F07-D</Text>
                  <Text style={styles.featureTitle}>Treatment Schedule</Text>
                  <Text style={styles.featureDesc}>Farmer-set reminders for applying treatments</Text>
                </View>
                <ChevronRightIcon size={18} color={P.twGray400} />
              </TouchableOpacity>

              {/* Feature 4: Weather Risk & Analytics */}
              <TouchableOpacity
                style={styles.featureCard}
                activeOpacity={0.8}
                onPress={() => {
                  if (onNavigateToWeatherRisk) {
                    onNavigateToWeatherRisk(resolvedFarmId);
                  } else {
                    setCurrentView('weatherRisk');
                  }
                }}
              >
                <View style={[styles.featureIconBox, { backgroundColor: P.googleBlue }]}>
                  <WeatherAnalyticsIcon size={22} color={P.white} />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureCode}>FR-F07-E</Text>
                  <Text style={styles.featureTitle}>Weather Risk & Analytics</Text>
                  <Text style={styles.featureDesc}>Risk notes and season-wise detection trends</Text>
                </View>
                <ChevronRightIcon size={18} color={P.twGray400} />
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Floating Report Detection CTA */}
          <View style={styles.floatingButtonContainer}>
            <TouchableOpacity
              style={[styles.reportCtaButton, (contextLoading || !!contextError) && { opacity: 0.6 }]}
              activeOpacity={0.85}
              onPress={() => setIsReportModalVisible(true)}
              disabled={contextLoading || !!contextError}
            >
              <Text style={styles.reportCtaPlus}>+</Text>
              <Text style={styles.reportCtaText}>Report Detection</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          VIEW 2: DETECTION LOG (Screenshot 3)
      ────────────────────────────────────────────────────────────────────────── */}
      {currentView === 'log' && (
        <View style={styles.container}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.logScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.logHeaderRow}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrentView('hub')}
                activeOpacity={0.7}
              >
                <ArrowBackIcon size={20} color={P.deepGreen} />
              </TouchableOpacity>
              <View style={styles.logHeaderTitleCol}>
                <Text style={styles.logHeaderTitle}>Detection Log</Text>
                <Text style={styles.logHeaderSubtitle}>
                  {activeCount} active · {resolvedCount} resolved
                </Text>
              </View>
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterTabsRow}>
              {(['All', 'Ongoing', 'Resolved', 'Recurring'] as const).map((tab) => {
                const isActive = filterTab === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.filterTabPill, isActive && styles.filterTabPillActive]}
                    onPress={() => setFilterTab(tab)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                      {tab}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Detections List */}
            {detectionsLoading ? (
              <View style={{ gap: 12 }}>
                <Skeleton height={90} width="100%" />
                <Skeleton height={90} width="100%" />
              </View>
            ) : detectionsError ? (
              <Text style={styles.loadErrorText}>{detectionsError}</Text>
            ) : filteredDetections.length === 0 ? (
              <Text style={styles.treatmentHistoryEmpty}>No detections logged yet.</Text>
            ) : (
              <View style={styles.detectionsList}>
                {filteredDetections.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.detectionCard}
                    activeOpacity={0.85}
                    onPress={() => {
                      setSelectedDetection(item);
                      setCurrentView('detail');
                    }}
                  >
                    <View style={styles.detectionIconBox}>
                      <PestBugIcon size={22} color={colors.brandGreen} />
                    </View>

                    <View style={styles.detectionMainCol}>
                      <Text style={styles.detectionName}>{item.pestName}</Text>
                      <Text style={styles.detectionSub}>
                        {[item.cropLabel, plotName, formatIsoDisplay(item.detectedOn)].filter(Boolean).join(' · ')}
                      </Text>
                      <View style={styles.badgesRow}>
                        <View
                          style={[
                            styles.severityBadge,
                            item.severity === 'High' && styles.severityBadgeHigh,
                            item.severity === 'Medium' && styles.severityBadgeMed,
                            item.severity === 'Low' && styles.severityBadgeLow,
                          ]}
                        >
                          <Text
                            style={[
                              styles.severityBadgeText,
                              item.severity === 'High' && styles.severityBadgeTextHigh,
                              item.severity === 'Medium' && styles.severityBadgeTextMed,
                              item.severity === 'Low' && styles.severityBadgeTextLow,
                            ]}
                          >
                            {item.severity}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.statusBadge,
                            item.status === 'Resolved' && styles.statusBadgeResolved,
                            item.status === 'Recurring' && styles.statusBadgeRecurring,
                            item.status === 'Ongoing' && styles.statusBadgeOngoing,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              item.status === 'Resolved' && styles.statusBadgeTextResolved,
                              item.status === 'Recurring' && styles.statusBadgeTextRecurring,
                              item.status === 'Ongoing' && styles.statusBadgeTextOngoing,
                            ]}
                          >
                            {item.status}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Floating Report Detection CTA */}
          <View style={styles.floatingButtonContainer}>
            <TouchableOpacity
              style={styles.reportCtaButton}
              activeOpacity={0.85}
              onPress={() => setIsReportModalVisible(true)}
            >
              <Text style={styles.reportCtaPlus}>+</Text>
              <Text style={styles.reportCtaText}>Report Detection</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          VIEW 3: DETECTION DETAIL (Screenshot 5)
      ────────────────────────────────────────────────────────────────────────── */}
      {currentView === 'detail' && selectedDetection && (
        <View style={styles.container}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.detailScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.detailHeaderRow}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrentView('log')}
                activeOpacity={0.7}
              >
                <ArrowBackIcon size={20} color={P.deepGreen} />
              </TouchableOpacity>
              <Text style={styles.detailHeaderTitle}>Detection Detail</Text>
            </View>

            {/* Hero Image / Banner Card */}
            <View style={styles.detailHeroBanner}>
              <PestBugIcon size={56} color={P.deepGreen} />
            </View>

            {/* Title & Scientific Name */}
            <View style={styles.detailMetaCard}>
              <Text style={styles.detailPestTitle}>{selectedDetection.pestName}</Text>
              {selectedDetection.scientificName ? (
                <Text style={styles.detailScientificName}>{selectedDetection.scientificName}</Text>
              ) : null}
              <Text style={styles.detailCropDate}>
                {[selectedDetection.cropLabel, plotName].filter(Boolean).join(' · ')}
                {selectedDetection.cropLabel || plotName ? ' · ' : ''}
                Detected {formatIsoDisplay(selectedDetection.detectedOn)}
              </Text>
              {selectedDetection.notes ? (
                <Text style={styles.detailCropDate}>{selectedDetection.notes}</Text>
              ) : null}

              <View style={styles.badgesRow}>
                <View
                  style={[
                    styles.severityBadge,
                    selectedDetection.severity === 'High' && styles.severityBadgeHigh,
                    selectedDetection.severity === 'Medium' && styles.severityBadgeMed,
                    selectedDetection.severity === 'Low' && styles.severityBadgeLow,
                  ]}
                >
                  <Text
                    style={[
                      styles.severityBadgeText,
                      selectedDetection.severity === 'High' && styles.severityBadgeTextHigh,
                      selectedDetection.severity === 'Medium' && styles.severityBadgeTextMed,
                      selectedDetection.severity === 'Low' && styles.severityBadgeTextLow,
                    ]}
                  >
                    {selectedDetection.severity} Severity
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    selectedDetection.status === 'Resolved' && styles.statusBadgeResolved,
                    selectedDetection.status === 'Recurring' && styles.statusBadgeRecurring,
                    selectedDetection.status === 'Ongoing' && styles.statusBadgeOngoing,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      selectedDetection.status === 'Resolved' && styles.statusBadgeTextResolved,
                      selectedDetection.status === 'Recurring' && styles.statusBadgeTextRecurring,
                      selectedDetection.status === 'Ongoing' && styles.statusBadgeTextOngoing,
                    ]}
                  >
                    {selectedDetection.status}
                  </Text>
                </View>
              </View>
            </View>

            {/* Reference Treatments Card */}
            <View style={styles.detailSectionCard}>
              <Text style={styles.cardHeaderTitle}>REFERENCE TREATMENTS FOR THIS PEST</Text>
              {detailLoading ? (
                <Skeleton height={40} width="100%" />
              ) : referenceTreatments.length > 0 ? (
                referenceTreatments.map((t, idx) => (
                  <View key={idx} style={styles.referenceTreatmentItem}>
                    <Text style={styles.referenceTreatmentName}>{t}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.treatmentHistoryEmpty}>No matching pest library entry found.</Text>
              )}

              <View style={styles.detailCalloutBox}>
                <InfoCircleIcon size={14} color={P.twGray500} />
                <Text style={styles.detailCalloutText}>
                  Reference list from the Pest Library — farmer selects and logs treatment manually.
                </Text>
              </View>
            </View>

            {/* Treatment History Card */}
            <View style={styles.detailSectionCard}>
              <Text style={styles.cardHeaderTitle}>TREATMENT HISTORY</Text>
              {detailLoading ? (
                <Skeleton height={40} width="100%" />
              ) : detailTreatmentHistory.length > 0 ? (
                detailTreatmentHistory.map((th) => (
                  <View key={th.id} style={styles.treatmentHistoryItem}>
                    <Text style={styles.treatmentHistoryName}>{th.treatment}</Text>
                    <Text style={styles.treatmentHistoryDate}>{formatIsoDisplay(th.appliedOn)}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.treatmentHistoryEmpty}>No further treatment logged</Text>
              )}
            </View>

            <View style={{ height: 90 }} />
          </ScrollView>

          {/* Bottom Dual Actions */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.scheduleButton}
              activeOpacity={0.8}
              onPress={() => {
                if (onNavigateToSchedule) {
                  onNavigateToSchedule(resolvedFarmId);
                } else {
                  setCurrentView('schedule');
                }
              }}
            >
              <CalendarIcon size={18} color={P.twGray700} />
              <Text style={styles.scheduleButtonText}>Schedule</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.markResolvedButton,
                selectedDetection.status === 'Resolved' && styles.markResolvedButtonActive,
              ]}
              activeOpacity={0.85}
              onPress={handleToggleResolved}
            >
              <CheckIcon size={18} color={P.white} />
              <Text style={styles.markResolvedButtonText}>
                {selectedDetection.status === 'Resolved' ? 'Reopen Case' : 'Mark Resolved'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          VIEW 4: PEST LIBRARY (Screen 70)
      ────────────────────────────────────────────────────────────────────────── */}
      {currentView === 'library' && (
        <PestLibraryScreen
          farmId={resolvedFarmId || undefined}
          onBack={() => setCurrentView('hub')}
          onNavigateToSchedule={() => {
            if (onNavigateToSchedule) {
              onNavigateToSchedule(resolvedFarmId);
            } else {
              setCurrentView('schedule');
            }
          }}
        />
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          VIEW 5: TREATMENT SCHEDULE (Screen 43G / FR-F07-D)
      ────────────────────────────────────────────────────────────────────────── */}
      {currentView === 'schedule' && (
        <TreatmentScheduleScreen
          farmId={resolvedFarmId || undefined}
          plotId={plotId || undefined}
          onBack={() => setCurrentView('hub')}
        />
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          VIEW 6: WEATHER RISK & ANALYTICS (FR-F07-E)
      ────────────────────────────────────────────────────────────────────────── */}
      {currentView === 'weatherRisk' && (
        <WeatherRiskAnalyticsScreen farmId={resolvedFarmId || undefined} onBack={() => setCurrentView('hub')} />
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          MODAL: REPORT NEW DETECTION (Screenshot 4)
      ────────────────────────────────────────────────────────────────────────── */}
      <Modal
        visible={isReportModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsReportModalVisible(false)}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setIsReportModalVisible(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <CloseIcon size={20} color={P.twGray700} />
            </TouchableOpacity>
            <View style={styles.modalHeaderTitleCol}>
              <Text style={styles.modalMainTitle}>Report New Detection</Text>
              <Text style={styles.modalSubtitle}>{newCropZone}</Text>
            </View>
          </View>

          <ScrollView
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalFormContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Add Photo Dashed Box */}
            {newPhoto ? (
              <View style={styles.photoPreviewRow}>
                <View style={styles.photoThumbContainer}>
                  <Image source={{ uri: newPhoto.uri }} style={styles.photoThumb} />
                  <TouchableOpacity
                    style={styles.removePhotoBtn}
                    onPress={() => setNewPhoto(null)}
                    accessibilityRole="button"
                    accessibilityLabel="Remove photo"
                  >
                    <CloseIcon size={12} color={P.white} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.photoUploadBox}
                activeOpacity={0.8}
                onPress={() => void handlePickPhoto()}
              >
                <CameraIcon size={28} color={colors.brandGreen} />
                <Text style={styles.photoUploadText}>Add Photo</Text>
              </TouchableOpacity>
            )}

            {/* Crop / Zone Dropdown */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Crop / Zone</Text>
              <TouchableOpacity
                style={styles.dropdownInput}
                activeOpacity={0.8}
                onPress={() => setIsCropPickerOpen(true)}
              >
                <Text style={styles.dropdownValueText}>{newCropZone}</Text>
                <ChevronDownIcon size={16} color={P.twGray500} />
              </TouchableOpacity>
            </View>

            {/* Pest Type with Search Input */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Pest Type <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <View style={styles.searchInputBox}>
                <SearchIcon size={16} color={P.twGray400} />
                <TextInput
                  style={styles.searchTextInput}
                  value={newPestType}
                  onChangeText={(text) => {
                    setNewPestType(text);
                    setSelectedPestLibraryId(undefined);
                  }}
                  onFocus={() => {
                    if (pestSuggestions.length > 0 && !selectedPestLibraryId) setIsPestSuggestionsOpen(true);
                  }}
                  placeholder="e.g. Aphids"
                  placeholderTextColor={P.twGray400}
                />
              </View>
              {isPestSuggestionsOpen && pestSuggestions.length > 0 ? (
                <View style={styles.pestSuggestionsBox}>
                  {pestSuggestions.map((entry) => (
                    <TouchableOpacity
                      key={entry.id}
                      style={styles.pestSuggestionRow}
                      onPress={() => handleSelectPestSuggestion(entry)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.pestSuggestionName}>{entry.name}</Text>
                      {entry.scientificName ? (
                        <Text style={styles.pestSuggestionScientific}>{entry.scientificName}</Text>
                      ) : null}
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
              <View style={styles.infoCallout}>
                <InfoCircleIcon size={16} color={P.googleBlue} />
                <Text style={styles.infoCalloutText}>
                  Chosen manually from the Pest Library — no auto-detection from the photo.
                </Text>
              </View>
            </View>

            {/* Severity Segmented Toggle */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Severity <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <View style={styles.severityToggleRow}>
                {(['Low', 'Medium', 'High'] as const).map((sev) => {
                  const isSel = newSeverity === sev;
                  return (
                    <TouchableOpacity
                      key={sev}
                      style={[
                        styles.severityToggleBtn,
                        isSel && sev === 'Low' && styles.severityToggleBtnLowActive,
                        isSel && sev === 'Medium' && styles.severityToggleBtnMedActive,
                        isSel && sev === 'High' && styles.severityToggleBtnHighActive,
                      ]}
                      onPress={() => setNewSeverity(sev)}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          styles.severityToggleText,
                          isSel && styles.severityToggleTextActive,
                        ]}
                      >
                        {sev}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Date Detected with Calendar Picker */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Date Detected <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dropdownInput}
                activeOpacity={0.8}
                onPress={() => setIsCalendarOpen(true)}
              >
                <Text style={styles.dropdownValueText}>{newDate}</Text>
                <CalendarIcon size={18} color={P.twGray500} />
              </TouchableOpacity>
            </View>

            {/* Notes */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Notes</Text>
              <TextInput
                style={styles.notesInput}
                value={newNotes}
                onChangeText={setNewNotes}
                placeholder="Optional notes"
                placeholderTextColor={P.twGray400}
                multiline
                numberOfLines={3}
              />
            </View>

            {saveDetectionError ? <Text style={styles.saveErrorText}>{saveDetectionError}</Text> : null}
          </ScrollView>

          {/* Modal Bottom Actions */}
          <View style={styles.modalBottomBar}>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setIsReportModalVisible(false)}
              disabled={savingDetection}
            >
              <Text style={styles.modalCancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalSaveBtn, savingDetection && { opacity: 0.7 }]}
              activeOpacity={0.85}
              onPress={() => void handleSaveDetection()}
              disabled={savingDetection}
            >
              {savingDetection ? (
                <ActivityIndicator size="small" color={P.white} />
              ) : (
                <>
                  <CheckIcon size={18} color={P.white} />
                  <Text style={styles.modalSaveBtnText}>Save Detection</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* ── In-Modal Crop / Zone Selector Overlay ── */}
          {isCropPickerOpen && (
            <View style={styles.inModalOverlay}>
              <TouchableOpacity
                style={StyleSheet.absoluteFill}
                activeOpacity={1}
                onPress={() => setIsCropPickerOpen(false)}
              />
              <View style={styles.modalCard}>
                <View style={styles.modalCardHeader}>
                  <Text style={styles.modalCardTitle}>Select Crop / Zone</Text>
                  <TouchableOpacity onPress={() => setIsCropPickerOpen(false)}>
                    <CloseIcon size={18} color={P.twGray500} />
                  </TouchableOpacity>
                </View>
                {cropZoneOptions.map((opt) => {
                  const isSelected = newCropZone === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.modalCardOption, isSelected && styles.modalCardOptionSelected]}
                      onPress={() => {
                        setNewCropZone(opt);
                        setIsCropPickerOpen(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[styles.modalCardOptionText, isSelected && styles.modalCardOptionTextSelected]}
                      >
                        {opt}
                      </Text>
                      {isSelected && <CheckIcon size={18} color={P.twGreen700} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── In-Modal Dynamic Calendar Picker Overlay ── */}
          {isCalendarOpen && (
            <View style={styles.inModalOverlay}>
              <TouchableOpacity
                style={StyleSheet.absoluteFill}
                activeOpacity={1}
                onPress={() => setIsCalendarOpen(false)}
              />
              <View style={styles.calModalCard}>
                {/* Header */}
                <View style={styles.calHeader}>
                  <Text style={styles.calFieldBadge}>Date Detected</Text>
                  <Text style={styles.calSelectedDateTitle}>
                    {calendarDate.getDate()} {MONTHS_FULL[calendarDate.getMonth()]} {calendarYear}
                  </Text>
                </View>

                {/* Navigation Row */}
                <View style={styles.calMonthNav}>
                  <TouchableOpacity
                    style={styles.calNavBtn}
                    onPress={handlePrevMonth}
                    accessibilityLabel="Previous month"
                  >
                    <ChevronLeftIcon size={18} color={P.deepGreen} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.calMonthYearBtn}
                    onPress={() => setIsYearPickerOpen(!isYearPickerOpen)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.calMonthYearLabel}>
                      {MONTHS_FULL[calendarMonth]} {calendarYear}
                    </Text>
                    <ChevronDownIcon size={14} color={P.deepGreen} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.calNavBtn}
                    onPress={handleNextMonth}
                    accessibilityLabel="Next month"
                  >
                    <ChevronRightIcon size={18} color={P.deepGreen} />
                  </TouchableOpacity>
                </View>

                {/* Year Quick Selector */}
                {isYearPickerOpen ? (
                  <View style={styles.yearGridContainer}>
                    <ScrollView style={styles.yearScrollView} showsVerticalScrollIndicator={false}>
                      <View style={styles.yearGrid}>
                        {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => {
                          const isSel = calendarYear === y;
                          return (
                            <TouchableOpacity
                              key={`yr-${y}`}
                              style={[styles.yearChip, isSel && styles.yearChipActive]}
                              onPress={() => {
                                setCalendarYear(y);
                                setCalendarDate(
                                  new Date(
                                    y,
                                    calendarMonth,
                                    Math.min(
                                      calendarDate.getDate(),
                                      new Date(y, calendarMonth + 1, 0).getDate(),
                                    ),
                                  ),
                                );
                                setIsYearPickerOpen(false);
                              }}
                            >
                              <Text style={[styles.yearChipText, isSel && styles.yearChipTextActive]}>
                                {y}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </ScrollView>
                  </View>
                ) : (
                  <>
                    {/* Weekdays Row */}
                    <View style={styles.calWeekdaysRow}>
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((dayName) => (
                        <Text key={dayName} style={styles.calWeekdayText}>
                          {dayName}
                        </Text>
                      ))}
                    </View>

                    {/* Days Grid */}
                    <View style={styles.calDaysGrid}>
                      {Array.from({ length: new Date(calendarYear, calendarMonth, 1).getDay() }).map((_, idx) => (
                        <View key={`empty-${idx}`} style={styles.calDayCellEmpty} />
                      ))}
                      {Array.from({ length: new Date(calendarYear, calendarMonth + 1, 0).getDate() }).map((_, idx) => {
                        const day = idx + 1;
                        const isSelected =
                          calendarDate.getFullYear() === calendarYear &&
                          calendarDate.getMonth() === calendarMonth &&
                          calendarDate.getDate() === day;
                        const isToday =
                          new Date().getFullYear() === calendarYear &&
                          new Date().getMonth() === calendarMonth &&
                          new Date().getDate() === day;

                        return (
                          <TouchableOpacity
                            key={`day-${day}`}
                            style={styles.calDayCell}
                            onPress={() => setCalendarDate(new Date(calendarYear, calendarMonth, day))}
                          >
                            <View
                              style={[
                                styles.calDayInner,
                                isSelected && styles.calDayInnerSelected,
                                !isSelected && isToday && styles.calDayInnerToday,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.calDayText,
                                  isSelected && styles.calDayTextSelected,
                                  !isSelected && isToday && styles.calDayTextToday,
                                ]}
                              >
                                {day}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </>
                )}

                {/* Actions */}
                <View style={styles.calFooterActions}>
                  <TouchableOpacity style={styles.calCancelBtn} onPress={() => setIsCalendarOpen(false)}>
                    <Text style={styles.calCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.calApplyBtn} onPress={handleApplyCalendarDate}>
                    <Text style={styles.calApplyBtnText}>Apply Date</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: P.lightSurfaceAlt,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },

  // ── Hub Styles ──
  hubScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 90,
  },
  hubHeaderRow: {
    marginBottom: 6,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  hubTitleSection: {
    alignItems: 'center',
    marginBottom: 14,
  },
  hubIconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.brandGreenLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  hubMainTitle: {
    fontSize: typography.title,
    fontWeight: '800',
    color: P.deepGreen,
    marginBottom: 4,
  },
  hubSubtitle: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minHeight: 74,
    backgroundColor: P.white,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: P.twGray100,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  statNumber: {
    fontSize: typography.bodyLarge,
    fontWeight: '800',
    color: P.nearBlack,
    marginBottom: 2,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: P.twGray500,
    textAlign: 'center',
    lineHeight: 13,
  },
  sectionHeaderTitle: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.twGray500,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  featuresList: {
    gap: 10,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderRadius: 14,
    padding: 13,
    borderWidth: 1,
    borderColor: P.twGray100,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureContent: {
    flex: 1,
  },
  featureCode: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: P.twGray400,
    marginBottom: 2,
  },
  featureTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.nearBlack,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    lineHeight: 16,
  },

  // ── Floating CTA ──
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  reportCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.deepGreen,
    height: 46,
    paddingHorizontal: 22,
    borderRadius: 23,
    shadowColor: P.deepGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    gap: 8,
  },
  reportCtaPlus: {
    fontSize: typography.title,
    fontWeight: '700',
    color: P.white,
    lineHeight: 22,
  },
  reportCtaText: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.white,
  },

  // ── In-Modal Overlays ──
  inModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 30,
  },

  // ── Log View Styles ──
  logScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 90,
  },
  logHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logHeaderTitleCol: {
    marginLeft: 14,
  },
  logHeaderTitle: {
    fontSize: typography.title,
    fontWeight: '800',
    color: P.deepGreen,
  },
  logHeaderSubtitle: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    marginTop: 2,
  },
  filterTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  filterTabPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
  },
  filterTabPillActive: {
    backgroundColor: colors.brandGreen,
    borderColor: colors.brandGreen,
  },
  filterTabText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray700,
  },
  filterTabTextActive: {
    color: P.white,
    fontWeight: '700',
  },
  detectionsList: {
    gap: 12,
  },
  detectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: P.twGray100,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  detectionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: P.twGreen50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  detectionMainCol: {
    flex: 1,
  },
  detectionName: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.nearBlack,
    marginBottom: 2,
  },
  detectionSub: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    marginBottom: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  severityBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: P.twGray100,
  },
  severityBadgeHigh: {
    backgroundColor: P.red50,
  },
  severityBadgeMed: {
    backgroundColor: P.amber50,
  },
  severityBadgeLow: {
    backgroundColor: P.twGreen50,
  },
  severityBadgeText: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: P.twGray700,
  },
  severityBadgeTextHigh: {
    color: P.red600,
  },
  severityBadgeTextMed: {
    color: P.amber600,
  },
  severityBadgeTextLow: {
    color: colors.brandGreen,
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: P.twGray100,
  },
  statusBadgeResolved: {
    backgroundColor: P.twGreen50,
  },
  statusBadgeRecurring: {
    backgroundColor: P.amber50,
  },
  statusBadgeOngoing: {
    backgroundColor: P.sky100,
  },
  statusBadgeText: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: P.twGray700,
  },
  statusBadgeTextResolved: {
    color: colors.brandGreen,
  },
  statusBadgeTextRecurring: {
    color: P.amber600,
  },
  statusBadgeTextOngoing: {
    color: P.googleBlue,
  },

  // ── Detail View Styles ──
  detailScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  detailHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailHeaderTitle: {
    fontSize: typography.title,
    fontWeight: '800',
    color: P.deepGreen,
    marginLeft: 14,
  },
  detailHeroBanner: {
    height: 140,
    borderRadius: 16,
    backgroundColor: colors.brandGreenLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  detailMetaCard: {
    backgroundColor: P.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: P.twGray100,
    marginBottom: 16,
  },
  detailPestTitle: {
    fontSize: typography.title,
    fontWeight: '800',
    color: P.nearBlack,
    marginBottom: 2,
  },
  detailScientificName: {
    fontSize: typography.body,
    fontStyle: 'italic',
    color: P.twGray500,
    marginBottom: 6,
  },
  detailCropDate: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    marginBottom: 12,
  },
  detailSectionCard: {
    backgroundColor: P.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: P.twGray100,
    marginBottom: 16,
  },
  cardHeaderTitle: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.twGray500,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  referenceTreatmentItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  referenceTreatmentName: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.nearBlack,
    marginBottom: 2,
  },
  referenceTreatmentNotes: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
  },
  detailCalloutBox: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    backgroundColor: P.twGray100,
    alignItems: 'flex-start',
  },
  detailCalloutText: {
    flex: 1,
    fontSize: typography.bodySmall,
    color: P.twGray600,
    lineHeight: 16,
  },
  treatmentHistoryItem: {
    paddingVertical: 10,
  },
  treatmentHistoryName: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.nearBlack,
    marginBottom: 2,
  },
  treatmentHistoryDate: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
  },
  treatmentHistoryEmpty: {
    fontSize: typography.body,
    color: P.twGray500,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: P.white,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: P.twGray100,
    flexDirection: 'row',
    gap: 12,
  },
  scheduleButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.twGray300,
    backgroundColor: P.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  scheduleButtonText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.twGray700,
  },
  markResolvedButton: {
    flex: 1.2,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.brandGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  markResolvedButtonActive: {
    backgroundColor: P.twGray700,
  },
  markResolvedButtonText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.white,
  },

  // ── Modal Styles ──
  modalSafeArea: {
    flex: 1,
    backgroundColor: P.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalHeaderTitleCol: {
    flex: 1,
  },
  modalMainTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '800',
    color: P.deepGreen,
  },
  modalSubtitle: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    marginTop: 2,
  },
  modalScrollView: {
    flex: 1,
  },
  modalFormContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16,
  },
  photoUploadBox: {
    height: 100,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: P.twGray300,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.lightSurfaceAlt,
    gap: 8,
  },
  photoUploadText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray600,
  },
  photoPreviewRow: {
    flexDirection: 'row',
  },
  photoThumbContainer: {
    position: 'relative',
  },
  photoThumb: {
    width: 100,
    height: 100,
    borderRadius: 16,
    backgroundColor: P.twGray100,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.twGray700,
  },
  requiredAsterisk: {
    color: P.red600,
  },
  dropdownInput: {
    height: 48,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownValueText: {
    fontSize: typography.body,
    fontWeight: '500',
    color: P.nearBlack,
  },
  searchInputBox: {
    height: 46,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchTextInput: {
    flex: 1,
    fontSize: typography.body,
    color: P.nearBlack,
  },
  pestSuggestionsBox: {
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 12,
    marginTop: 4,
    overflow: 'hidden',
  },
  pestSuggestionRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  pestSuggestionName: {
    fontSize: typography.body,
    fontWeight: '500',
    color: P.nearBlack,
  },
  pestSuggestionScientific: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    fontStyle: 'italic',
    marginTop: 2,
  },
  infoCallout: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: P.blue50,
    padding: 10,
    borderRadius: 10,
    alignItems: 'flex-start',
    marginTop: 4,
  },
  infoCalloutText: {
    flex: 1,
    fontSize: typography.bodySmall,
    color: P.googleBlue,
    lineHeight: 16,
  },
  severityToggleRow: {
    flexDirection: 'row',
    backgroundColor: P.twGray100,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  severityToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  severityToggleBtnLowActive: {
    backgroundColor: colors.brandGreen,
  },
  severityToggleBtnMedActive: {
    backgroundColor: P.amber600,
  },
  severityToggleBtnHighActive: {
    backgroundColor: P.red600,
  },
  severityToggleText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray600,
  },
  severityToggleTextActive: {
    color: P.white,
    fontWeight: '700',
  },
  notesInput: {
    minHeight: 70,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: typography.body,
    color: P.nearBlack,
    textAlignVertical: 'top',
  },
  modalBottomBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: P.twGray100,
    gap: 12,
    backgroundColor: P.white,
  },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.twGray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray700,
  },
  modalSaveBtn: {
    flex: 1.5,
    height: 48,
    borderRadius: 12,
    backgroundColor: P.deepGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modalSaveBtnText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.white,
  },
  saveErrorText: {
    fontSize: typography.bodySmall,
    fontWeight: '600',
    color: P.red600,
  },
  loadErrorText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.red600,
    marginBottom: 16,
  },

  // Dropdown Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: P.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 8,
  },
  modalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  modalCardTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.nearBlack,
  },
  modalCardOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 6,
  },
  modalCardOptionSelected: {
    backgroundColor: P.twGreen50,
  },
  modalCardOptionText: {
    fontSize: typography.body,
    color: P.twGray700,
    fontWeight: '500',
  },
  modalCardOptionTextSelected: {
    fontWeight: '700',
    color: P.deepGreen,
  },

  // Calendar Modal
  calModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: P.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  calHeader: {
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
    paddingBottom: 12,
    marginBottom: 14,
  },
  calFieldBadge: {
    fontSize: typography.caption,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.brandGreen,
    marginBottom: 4,
  },
  calSelectedDateTitle: {
    fontSize: typography.title,
    fontWeight: '800',
    color: P.nearBlack,
  },
  calMonthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  calNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: P.twGray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calMonthYearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: P.twGray100,
  },
  calMonthYearLabel: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.deepGreen,
  },
  yearGridContainer: {
    height: 180,
  },
  yearScrollView: {
    flex: 1,
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 4,
  },
  yearChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: P.twGray100,
    borderWidth: 1,
    borderColor: P.twGray200,
    minWidth: 64,
    alignItems: 'center',
  },
  yearChipActive: {
    backgroundColor: P.deepGreen,
    borderColor: P.deepGreen,
  },
  yearChipText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray800,
  },
  yearChipTextActive: {
    color: P.white,
    fontWeight: '700',
  },
  calWeekdaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calWeekdayText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.twGray400,
  },
  calDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calDayCell: {
    width: '14.28%',
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDayCellEmpty: {
    width: '14.28%',
    height: 38,
  },
  calDayInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDayInnerSelected: {
    backgroundColor: P.deepGreen,
  },
  calDayInnerToday: {
    borderWidth: 1.5,
    borderColor: P.deepGreen,
  },
  calDayText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray800,
  },
  calDayTextSelected: {
    fontWeight: '700',
    color: P.white,
  },
  calDayTextToday: {
    color: P.deepGreen,
    fontWeight: '700',
  },
  calFooterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: P.twGray100,
  },
  calCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.twGray300,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.white,
  },
  calCancelBtnText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray700,
  },
  calApplyBtn: {
    flex: 1.4,
    height: 44,
    borderRadius: 12,
    backgroundColor: P.deepGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calApplyBtnText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.white,
  },
});
