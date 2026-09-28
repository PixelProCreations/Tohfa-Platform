import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import DocumentPicker, { type DocumentPickerResponse } from 'react-native-document-picker';
import { t } from '../../../../i18n/farmer';
import { extractFieldErrors, formatErrorMessage } from '../../../../shell/api/client';
import { authPalette as P, typography } from '../../theme';
import {
  fromPaise,
  toPaise,
  multiply,
  sum,
  parseMoney,
  format as formatMoney,
  type Money,
} from '@tohfa/shared-types';
import {
  createDiaryEntry,
  attachDiaryPhoto,
  type CreateDiaryEntryInput,
  type DiaryWorkerInput,
  type AttachDiaryPhotoInput,
} from '../../api/farmDiary';
import { signUpload } from '../../api/registration';
import { uploadWithResume } from '../../api/uploader';
import type { CropItem } from './ProduceCalendarScreen';

// ─────────────────────────────────────────────
// Inline Vector Icons
// ─────────────────────────────────────────────

function ArrowBackIcon({ size = 18, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function WaterDropletOutlineIcon({ size = 20, color = P.sky600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function UsersGroupIcon({ size = 16, color = P.twGreen800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path
        d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CloseRedIcon({ size = 14, color = P.twRed500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6l12 12"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CloseWhiteIcon({ size = 10, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6l12 12"
        stroke={color}
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronDownIcon({ size = 18, color = P.slate500 }: { size?: number; color?: string }) {
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

function PlusCircleIcon({ size = 18, color = P.twGreen800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Line x1="12" y1="8" x2="12" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="12" x2="16" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CameraIcon({ size = 16, color = P.slate600 }: { size?: number; color?: string }) {
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

function CameraPlusIcon({ size = 22, color = P.twGreen800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="12" y1="11" x2="12" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="9.5" y1="13.5" x2="14.5" y2="13.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function MicrophoneIcon({ size = 16, color = P.slate600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PlayIcon({ size = 14, color = P.twGreen800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 3l14 9-14 9V3z"
        fill={color}
      />
    </Svg>
  );
}

function NotesIcon({ size = 16, color = P.slate600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="6" x2="20" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="18" x2="14" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CheckmarkIcon({ size = 16, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={color}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Types & Initial Data
// ─────────────────────────────────────────────

interface WorkerEntry {
  id: string;
  initials: string;
  name: string;
  role: string;
  hoursWorked: string;
  /** Integer paise (root CLAUDE.md §2.2) — never a rupee float. */
  wageRatePaise: number;
  /**
   * Raw rupee text the farmer is typing (e.g. "80." mid-edit). `wageRatePaise`
   * only updates once this parses cleanly via `parseMoney` — see
   * `handleWageInputChange` — so a half-typed value never corrupts the paise
   * total used for `totalCost` below (root CLAUDE.md §2.2).
   */
  wageRateInput: string;
  task: string;
}

/** Initials for the avatar circle, derived live from the editable name rather
 * than stored — a stored value would go stale the moment the farmer edits
 * the name. */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

const IRRIGATION_METHODS = [
  'Drip',
  'Sprinkler',
  'Flood',
  'Furrow',
  'Basin',
  'Sub-surface Drip',
] as const;

type IrrigationMethod = (typeof IRRIGATION_METHODS)[number];

/** Display labels are translated; the canonical English value above is only used as a key. */
const IRRIGATION_METHOD_LABEL_KEYS = {
  Drip: 'farmer.farmDiary.newEntry.step3.irrigationMethod.drip',
  Sprinkler: 'farmer.farmDiary.newEntry.step3.irrigationMethod.sprinkler',
  Flood: 'farmer.farmDiary.newEntry.step3.irrigationMethod.flood',
  Furrow: 'farmer.farmDiary.newEntry.step3.irrigationMethod.furrow',
  Basin: 'farmer.farmDiary.newEntry.step3.irrigationMethod.basin',
  'Sub-surface Drip': 'farmer.farmDiary.newEntry.step3.irrigationMethod.subSurfaceDrip',
} as const;

function irrigationMethodLabel(method: string): string {
  return t(IRRIGATION_METHOD_LABEL_KEYS[method as IrrigationMethod] ?? IRRIGATION_METHOD_LABEL_KEYS.Drip);
}

// No fake seed data: the workforce section starts empty and only ever holds
// what the farmer actually adds via "Add Worker" (see handleAddWorker below).
const INITIAL_WORKERS: WorkerEntry[] = [];

/** The only mime types `AttachDiaryPhotoInput.mimeType` (farmDiary.ts) accepts.
 * A narrower set than the backend's `ALLOWED_MIME_TYPES` (which also allows
 * `application/pdf` for documents, not relevant to diary photos). */
const ALLOWED_PHOTO_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
type AllowedPhotoMimeType = (typeof ALLOWED_PHOTO_MIME_TYPES)[number];
function isAllowedPhotoMimeType(value: string): value is AllowedPhotoMimeType {
  return (ALLOWED_PHOTO_MIME_TYPES as readonly string[]).includes(value);
}

/** A photo the farmer picked, in flight through pick → upload → attach. */
interface DiaryPhotoDraft {
  id: string;
  /** The picked file's own uri — shown immediately, before/regardless of upload. */
  localUri: string;
  uploading: boolean;
  progress: number;
  error: string | null;
  /** Populated once the upload finishes; only a photo with all three set is
   * eligible for `attachDiaryPhoto` in handleSave. */
  storageKey: string | null;
  mimeType: AllowedPhotoMimeType | null;
  sizeBytes: number | null;
}

const WAVEFORM_BARS = [10, 16, 22, 12, 18, 14, 20];

export interface NewFarmDiaryEntryStep3ScreenProps {
  crop?: CropItem | null;
  /** Required for the create call. Missing means the Step 1 → 3 navigation lost it. */
  plotId?: string | undefined;
  /** Only present when Step 1 had several active crops and the farmer picked one. */
  farmCropId?: string | undefined;
  categoryKey?: string | undefined;
  subActivityKey?: string | undefined;
  /** Display-only labels for the summary banner, carried forward from Steps 1 and 2. */
  entryCategory?: string | undefined;
  entrySubActivity?: string | undefined;
  fieldZone?: string | undefined;
  cropName?: string | undefined;
  onBack?: () => void;
  onCancel?: () => void;
  onDone?: () => void;
  onSave?: () => void;
}

/** Mirrors the server's zod bound on `minutes` (farm-diary.schema.ts). */
const MAX_MINUTES = 1440;

function toWorkerInputs(
  workers: WorkerEntry[],
  paymentStatus: 'Pending' | 'Paid',
): DiaryWorkerInput[] {
  return workers.map((w) => ({
    name: w.name,
    role: w.role,
    hoursWorked: parseFloat(w.hoursWorked) || 0,
    // The UI already holds integer paise (root CLAUDE.md §2.2); pass through as-is.
    wageRatePaise: w.wageRatePaise,
    paymentStatus: paymentStatus === 'Paid' ? 'PAID' : 'PENDING',
  }));
}

export function NewFarmDiaryEntryStep3Screen({
  crop,
  plotId,
  farmCropId,
  categoryKey,
  subActivityKey,
  entryCategory = '',
  entrySubActivity = '',
  fieldZone = '',
  cropName: cropNameProp,
  onBack,
  onCancel,
  onDone,
  onSave,
}: NewFarmDiaryEntryStep3ScreenProps): React.JSX.Element {
  const cropName = cropNameProp ?? crop?.name ?? '';

  // A missing id here is a navigation bug, not something to mock around: surface
  // it and refuse to save rather than posting a half-formed entry.
  const missingIds = [
    !plotId ? t('farmer.farmDiary.newEntry.step3.missingField') : null,
    !categoryKey ? t('farmer.farmDiary.newEntry.step3.missingCategory') : null,
    !subActivityKey ? t('farmer.farmDiary.newEntry.step3.missingSubActivity') : null,
  ].filter((x): x is string => x !== null);
  const missingIdsLabel = missingIds.join(', ');
  // Dev-facing identifiers, kept separate from the translated `missingIdsLabel` above so this
  // diagnostic log stays in English regardless of the active locale.
  const missingIdsDevLabel = [
    !plotId ? 'field' : null,
    !categoryKey ? 'category' : null,
    !subActivityKey ? 'sub-activity' : null,
  ]
    .filter((x): x is string => x !== null)
    .join(', ');
  useEffect(() => {
    if (missingIdsDevLabel) {
      console.warn(
        `NewFarmDiaryEntryStep3Screen mounted without: ${missingIdsDevLabel}. ` +
          'The Step 1/2 navigation params were lost.',
      );
    }
  }, [missingIdsDevLabel]);

  // Details State
  const [irrigationMethod, setIrrigationMethod] = useState<string>('Drip');
  const [isMethodModalOpen, setIsMethodModalOpen] = useState<boolean>(false);
  const [timeSpent, setTimeSpent] = useState<string>('45');

  // Submit State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Workforce State
  // Off by default: the worker list below is still placeholder data with no
  // real entry UI, and leaving the toggle on would persist fabricated labour
  // rows (and labour cost) on every save.
  const [isWorkforceEnabled, setIsWorkforceEnabled] = useState<boolean>(false);
  const [workers, setWorkers] = useState<WorkerEntry[]>(INITIAL_WORKERS);
  const [paymentStatus, setPaymentStatus] = useState<'Pending' | 'Paid'>('Pending');

  // Attachments State
  const [photos, setPhotos] = useState<DiaryPhotoDraft[]>([]);
  const [notes, setNotes] = useState<string>('');

  const handleRemoveWorker = (workerId: string) => {
    setWorkers((prev) => prev.filter((w) => w.id !== workerId));
  };

  const updateWorker = (workerId: string, patch: Partial<WorkerEntry>) => {
    setWorkers((prev) => prev.map((w) => (w.id === workerId ? { ...w, ...patch } : w)));
  };

  /**
   * `wageRatePaise` only updates when `text` parses cleanly. A mid-edit value
   * ("80.", empty) is left showing in `wageRateInput` without touching the
   * paise figure `totalCost` below (and the eventual `DiaryWorkerInput`) is
   * computed from — see `WorkerEntry.wageRateInput`'s docblock.
   */
  const handleWageInputChange = (workerId: string, text: string) => {
    setWorkers((prev) =>
      prev.map((w) => {
        if (w.id !== workerId) return w;
        try {
          const parsed = parseMoney(text);
          return { ...w, wageRateInput: text, wageRatePaise: toPaise(parsed) };
        } catch {
          return { ...w, wageRateInput: text };
        }
      }),
    );
  };

  const handleAddWorker = () => {
    const newId = `w_${Date.now()}`;
    // A genuinely blank row -- no fabricated name/role/task. The farmer fills
    // this in with the real editable fields below.
    setWorkers((prev) => [
      ...prev,
      {
        id: newId,
        initials: '',
        name: '',
        role: '',
        hoursWorked: '',
        wageRatePaise: 0,
        wageRateInput: '',
        task: '',
      },
    ]);
  };

  /** A worker row missing a required field, or whose wage doesn't currently
   * parse to something above zero, blocks Save (mirrors `missingIds` below). */
  const isWorkerRowInvalid = (w: WorkerEntry): boolean => {
    if (!w.name.trim() || !w.hoursWorked.trim()) return true;
    const trimmedWage = w.wageRateInput.trim();
    if (!trimmedWage) return true;
    try {
      return toPaise(parseMoney(trimmedWage)) <= 0;
    } catch {
      return true;
    }
  };

  const handleRemovePhoto = (photoId: string) => {
    // uploadWithResume exposes no abort mechanism (see apps/mobile/src/roles/farmer/api/uploader.ts) --
    // an in-flight upload for a removed photo is simply ignored: its state update
    // below finds no matching id and is a no-op.
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  const handleAddPhoto = async () => {
    let picked: DocumentPickerResponse;
    try {
      picked = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.images],
        // Android hands back a `content://` URI, which `fetch()` cannot read on-device --
        // its native networking layer only speaks http(s), so attempting to fetch it fails
        // outright with "Failed to construct 'Response': status 0" (no HTTP semantics ever
        // apply). `copyTo` makes the picker copy the file into the app's own cache dir and
        // expose a real `file://` path via `fileCopyUri`, which `fetch()` can read normally.
        copyTo: 'cachesDirectory',
      });
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        setSubmitError(t('farmer.farmDiary.newEntry.step3.photoPickError'));
      }
      return;
    }

    const photoId = `photo_${Date.now()}_${Math.round(Math.random() * 1e6)}`;
    const localUri = picked.fileCopyUri ?? picked.uri;
    const rawContentType = picked.type ?? '';

    setPhotos((prev) => [
      ...prev,
      {
        id: photoId,
        localUri,
        uploading: true,
        progress: 0,
        error: null,
        storageKey: null,
        mimeType: null,
        sizeBytes: null,
      },
    ]);

    if (!isAllowedPhotoMimeType(rawContentType)) {
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === photoId
            ? { ...p, uploading: false, error: t('farmer.farmDiary.newEntry.step3.photoUnsupportedType') }
            : p,
        ),
      );
      return;
    }

    try {
      // Read file bytes first -- needed for the upload either way, and the server's
      // signUploadBody schema requires an exact sizeBytes (max 25 MiB), which
      // `picked.size` can't be trusted for (react-native-document-picker types it as
      // `number | null`). Using the real byte length is both simpler than a null
      // fallback and strictly more accurate than picker-reported metadata.
      const fileResp = await fetch(picked.fileCopyUri ?? picked.uri);
      const buffer = await fileResp.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      const signed = await signUpload({
        purpose: 'DIARY_PHOTO',
        fileName: picked.name ?? 'diary_photo.jpg',
        contentType: rawContentType,
        sizeBytes: bytes.length,
      });

      await uploadWithResume({
        uploadUrl: signed.uploadUrl,
        fileUrl: signed.fileUrl,
        resumable: signed.resumable ?? false,
        data: bytes,
        contentType: rawContentType,
        headers: signed.headers,
        method: signed.method,
        onProgress: (pct) => {
          setPhotos((prev) => prev.map((p) => (p.id === photoId ? { ...p, progress: pct } : p)));
        },
      });

      const storageKey = signed.storageKey;

      setPhotos((prev) =>
        prev.map((p) =>
          p.id === photoId
            ? {
                ...p,
                uploading: false,
                progress: 100,
                storageKey,
                mimeType: rawContentType,
                sizeBytes: bytes.length,
                error: storageKey
                  ? null
                  : t('farmer.farmDiary.newEntry.step3.photoUploadError'),
              }
            : p,
        ),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('farmer.farmDiary.newEntry.step3.photoUploadError');
      setPhotos((prev) =>
        prev.map((p) => (p.id === photoId ? { ...p, uploading: false, error: msg } : p)),
      );
    }
  };

  // Calculations
  const totalCombinedHours = workers.reduce(
    (acc, w) => acc + (parseFloat(w.hoursWorked) || 0),
    0,
  );
  // Paise-safe: multiply each worker's rate by their (fractional) hours, then
  // sum exactly across workers — no raw float multiply-and-accumulate
  // (root CLAUDE.md §2.2, packages/shared-types/src/money.ts docblock).
  const perWorkerCosts: Money[] = workers.map((w) =>
    multiply(fromPaise(w.wageRatePaise), parseFloat(w.hoursWorked) || 0),
  );
  const totalCost: Money = sum(perWorkerCosts);
  const displayTotalCost = formatMoney(totalCost, { symbol: false });

  const handleSave = async () => {
    if (isSubmitting) return;
    setSubmitError('');
    setFieldErrors({});

    if (!plotId || !categoryKey || !subActivityKey) {
      setSubmitError(
        t('farmer.farmDiary.newEntry.step3.missingIdsError', { missing: missingIdsLabel }),
      );
      return;
    }

    const minutes = Number(timeSpent.trim());
    if (!Number.isInteger(minutes) || minutes <= 0 || minutes > MAX_MINUTES) {
      setFieldErrors({
        minutes: t('farmer.farmDiary.newEntry.step3.minutesValidationError', { max: MAX_MINUTES }),
      });
      return;
    }

    if (isWorkforceEnabled && workers.length > 0 && workers.some(isWorkerRowInvalid)) {
      setFieldErrors({
        workers: t('farmer.farmDiary.newEntry.step3.workerValidationError'),
      });
      return;
    }

    const trimmedNotes = notes.trim();
    const input: CreateDiaryEntryInput = {
      plotId,
      ...(farmCropId ? { farmCropId } : {}),
      categoryKey,
      subActivityKey,
      minutes,
      ...(trimmedNotes ? { notes: trimmedNotes } : {}),
      // SPECIFICATION GAP: no BR-xx rule or openapi schema defines this key yet —
      // activityFields is free-form by design (farm-diary.schema.ts), so this is
      // safe to send, but "irrigationMethod" as a key name isn't documented
      // anywhere else. Flagged for the team. The irrigation-method field itself is
      // shown unconditionally above (not gated on category), so it's sent the
      // same way here.
      activityFields: { irrigationMethod },
      // Omitted entirely (not []) when the toggle is off or nobody was added.
      ...(isWorkforceEnabled && workers.length > 0
        ? { workers: toWorkerInputs(workers, paymentStatus) }
        : {}),
      // Voice notes are mock UI only -- no audio-recording library has been chosen
      // for this project yet (a separate dependency decision), so voiceNoteKey/
      // voiceNoteDurationS are deliberately left out rather than fabricated.
    };

    setIsSubmitting(true);
    let createdEntryId: string;
    try {
      const createdEntry = await createDiaryEntry(input);
      createdEntryId = createdEntry.id;
    } catch (err: unknown) {
      setSubmitError(formatErrorMessage(err, t('farmer.farmDiary.newEntry.step3.saveError')));
      setFieldErrors(extractFieldErrors(err));
      setIsSubmitting(false);
      return;
    }

    // The entry now exists. Attach every photo that finished uploading (photos
    // still in flight or errored already block Save via isSaveDisabled, so this
    // only ever excludes a photo the farmer removed mid-upload).
    const readyPhotos = photos.filter(
      (p): p is DiaryPhotoDraft & { storageKey: string; mimeType: AllowedPhotoMimeType; sizeBytes: number } =>
        p.storageKey !== null && p.mimeType !== null && p.sizeBytes !== null,
    );
    let failedAttachCount = 0;
    await Promise.all(
      readyPhotos.map(async (p) => {
        const attachInput: AttachDiaryPhotoInput = {
          storageKey: p.storageKey,
          mimeType: p.mimeType,
          sizeBytes: p.sizeBytes,
        };
        try {
          await attachDiaryPhoto(createdEntryId, attachInput);
        } catch {
          failedAttachCount += 1;
        }
      }),
    );

    setIsSubmitting(false);

    if (failedAttachCount > 0) {
      // The diary entry itself was created successfully -- don't pretend the
      // whole save failed, but don't silently drop the photo failure either.
      setSubmitError(
        t('farmer.farmDiary.newEntry.step3.photoAttachPartialFailure', { count: failedAttachCount }),
      );
      return;
    }

    if (onSave) {
      onSave();
    } else if (onDone) {
      onDone();
    }
  };

  const handleExit = onCancel ?? onBack;
  const isSaveDisabled =
    isSubmitting ||
    missingIds.length > 0 ||
    photos.some((p) => p.uploading) ||
    (isWorkforceEnabled && workers.length > 0 && workers.some(isWorkerRowInvalid));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* ── Top Header ── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.navCircleButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.farmDiary.common.goBackLabel')}
          >
            <ArrowBackIcon size={18} color={P.twGreen700} />
          </TouchableOpacity>

          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>{t('farmer.farmDiary.common.newEntryTitle')}</Text>
            <Text style={styles.headerSubtitle}>{t('farmer.farmDiary.newEntry.step3.subtitle')}</Text>
          </View>

          <TouchableOpacity
            onPress={handleExit}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.common.cancel')}
          >
            <Text style={styles.cancelBtnText}>{t('farmer.common.cancel')}</Text>
          </TouchableOpacity>
        </View>

        {/* ── 3-Segment Progress Bar (All 3 Active) ── */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressSegment, styles.progressActive]} />
          <View style={[styles.progressSegment, styles.progressActive]} />
          <View style={[styles.progressSegment, styles.progressActive]} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. Top Summary Banner Card ── */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconBox}>
            <WaterDropletOutlineIcon size={20} color={P.twGreen700} />
          </View>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryTitle}>
              {[entrySubActivity, cropName].filter(Boolean).join(' · ')}
            </Text>
            <Text style={styles.summarySubtitle}>
              {[entryCategory, fieldZone].filter(Boolean).join(' · ')}
            </Text>
          </View>
        </View>

        {missingIds.length > 0 && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>
              {t('farmer.farmDiary.newEntry.step3.missingIdsBanner', { missing: missingIdsLabel })}
            </Text>
          </View>
        )}

        {/* ── 2. Irrigation Details Section ── */}
        <Text style={styles.sectionHeading}>{t('farmer.farmDiary.newEntry.step3.irrigationDetailsHeading')}</Text>

        {/* Irrigation method Dropdown */}
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>
            {t('farmer.farmDiary.newEntry.step3.irrigationMethodLabel')} <Text style={styles.requiredAsterisk}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.dropdownBox}
            activeOpacity={0.8}
            onPress={() => setIsMethodModalOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.farmDiary.newEntry.step3.selectIrrigationMethodLabel')}
          >
            <Text style={styles.dropdownSelectedText}>{irrigationMethodLabel(irrigationMethod)}</Text>
            <ChevronDownIcon size={18} color={P.slate500} />
          </TouchableOpacity>
        </View>

        {/* Time spent */}
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>
            {t('farmer.farmDiary.newEntry.step3.timeSpentLabel')} <Text style={styles.requiredAsterisk}>*</Text>
          </Text>
          <View style={styles.timeSpentBox}>
            <TextInput
              style={styles.timeSpentInput}
              value={timeSpent}
              onChangeText={setTimeSpent}
              keyboardType="numeric"
              maxLength={4}
            />
            <Text style={styles.timeSpentUnit}>{t('farmer.farmDiary.newEntry.step3.minutesUnit')}</Text>
          </View>
          {fieldErrors['minutes'] ? (
            <Text style={styles.fieldErrorText}>{fieldErrors['minutes']}</Text>
          ) : null}
        </View>

        {/* ── 3. WORKFORCE Card ── */}
        <View style={styles.workforceCard}>
          {/* Workforce Header */}
          <View style={styles.workforceHeader}>
            <View style={styles.workforceTitleRow}>
              <UsersGroupIcon size={18} color={P.twGreen800} />
              <Text style={styles.workforceTitle}>{t('farmer.farmDiary.newEntry.step3.workforceTitle')}</Text>
            </View>
            <Switch
              value={isWorkforceEnabled}
              onValueChange={setIsWorkforceEnabled}
              trackColor={{ false: P.slate300, true: P.twGreen800 }}
              thumbColor={P.white}
            />
          </View>

          <Text style={styles.workforceSubtitle}>{t('farmer.farmDiary.newEntry.step3.workforceSubtitle')}</Text>

          {isWorkforceEnabled && (
            <>
              {/* Workers List */}
              {workers.map((worker) => (
                <View key={worker.id} style={styles.workerItemBox}>
                  {/* Worker Top Row */}
                  <View style={styles.workerTopRow}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>{getInitials(worker.name)}</Text>
                    </View>
                    <View style={styles.workerInfoBox}>
                      <TextInput
                        style={styles.workerNameInput}
                        value={worker.name}
                        onChangeText={(text) => updateWorker(worker.id, { name: text })}
                        placeholder={t('farmer.farmDiary.newEntry.step3.workerNamePlaceholder')}
                        placeholderTextColor={P.slate400}
                      />
                      <Text style={styles.workerRole}>{worker.role}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveWorker(worker.id)}
                      activeOpacity={0.7}
                      style={styles.removeWorkerBtn}
                      accessibilityRole="button"
                      accessibilityLabel={t('farmer.farmDiary.newEntry.step3.removeWorkerLabel', { name: worker.name })}
                    >
                      <CloseRedIcon size={14} color={P.twRed500} />
                    </TouchableOpacity>
                  </View>

                  {/* Stat Boxes Row */}
                  <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>{t('farmer.farmDiary.newEntry.step3.hoursWorkedLabel')}</Text>
                      <View style={styles.statInputRow}>
                        <TextInput
                          style={styles.statValueInput}
                          value={worker.hoursWorked}
                          onChangeText={(text) => updateWorker(worker.id, { hoursWorked: text })}
                          keyboardType="numeric"
                          maxLength={5}
                          placeholder="0.0"
                          placeholderTextColor={P.slate400}
                        />
                        <Text style={styles.statUnit}>{t('farmer.farmDiary.newEntry.step3.hrsUnit')}</Text>
                      </View>
                    </View>

                    <View style={[styles.statBox, styles.wageStatBox]}>
                      <Text style={styles.wageStatLabel}>{t('farmer.farmDiary.newEntry.step3.wageRateLabel')}</Text>
                      <View style={styles.statInputRow}>
                        <Text style={styles.wageStatUnit}>₹</Text>
                        <TextInput
                          style={styles.wageValueInput}
                          value={worker.wageRateInput}
                          onChangeText={(text) => handleWageInputChange(worker.id, text)}
                          keyboardType="numeric"
                          maxLength={8}
                          placeholder="0.00"
                          placeholderTextColor={P.twGreen700}
                        />
                        <Text style={styles.wageStatUnit}>{t('farmer.farmDiary.newEntry.step3.perHrUnit')}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Task Dropdown */}
                  <TouchableOpacity
                    style={styles.taskDropdown}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={worker.task}
                  >
                    <Text style={styles.taskDropdownText} numberOfLines={1}>
                      {worker.task}
                    </Text>
                    <ChevronDownIcon size={16} color={P.slate500} />
                  </TouchableOpacity>
                </View>
              ))}

              {/* Add Worker Dashed Button */}
              <TouchableOpacity
                style={styles.addWorkerButton}
                onPress={handleAddWorker}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={t('farmer.farmDiary.newEntry.step3.addWorkerButton')}
              >
                <PlusCircleIcon size={18} color={P.twGreen800} />
                <Text style={styles.addWorkerButtonText}>{t('farmer.farmDiary.newEntry.step3.addWorkerButton')}</Text>
              </TouchableOpacity>

              {workers.some(isWorkerRowInvalid) ? (
                <Text style={styles.fieldErrorText}>
                  {t('farmer.farmDiary.newEntry.step3.workerValidationError')}
                </Text>
              ) : null}

              {/* Total Labour Cost Dark Banner */}
              <View style={styles.totalCostBanner}>
                <View style={styles.totalCostLeft}>
                  <Text style={styles.totalCostTitle}>{t('farmer.farmDiary.newEntry.step3.totalLabourCostLabel')}</Text>
                  <Text style={styles.totalCostSubtitle}>
                    {t('farmer.farmDiary.newEntry.step3.totalLabourCostSubtitle', {
                      count: workers.length,
                      hours: totalCombinedHours.toFixed(1),
                    })}
                  </Text>
                </View>
                <Text style={styles.totalCostAmount}>₹ {displayTotalCost}</Text>
              </View>

              {/* Payment Status Segmented Control */}
              <View style={styles.paymentStatusRow}>
                <Text style={styles.paymentStatusLabel}>{t('farmer.farmDiary.newEntry.step3.paymentStatusLabel')}</Text>
                <View style={styles.paymentPillGroup}>
                  <TouchableOpacity
                    style={[
                      styles.paymentPill,
                      paymentStatus === 'Pending' && styles.paymentPillPendingActive,
                    ]}
                    onPress={() => setPaymentStatus('Pending')}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.farmDiary.newEntry.step3.paymentPending')}
                  >
                    <Text
                      style={[
                        styles.paymentPillText,
                        paymentStatus === 'Pending' && styles.paymentPillTextPendingActive,
                      ]}
                    >
                      {t('farmer.farmDiary.newEntry.step3.paymentPending')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.paymentPill,
                      paymentStatus === 'Paid' && styles.paymentPillPaidActive,
                    ]}
                    onPress={() => setPaymentStatus('Paid')}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.farmDiary.newEntry.step3.paymentPaid')}
                  >
                    <Text
                      style={[
                        styles.paymentPillText,
                        paymentStatus === 'Paid' && styles.paymentPillTextPaidActive,
                      ]}
                    >
                      {t('farmer.farmDiary.newEntry.step3.paymentPaid')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </View>

        {/* ── 4. Photos Section ── */}
        <View style={styles.attachmentSection}>
          <View style={styles.attachmentHeaderRow}>
            <CameraIcon size={16} color={P.slate600} />
            <Text style={styles.attachmentHeaderTitle}>{t('farmer.farmDiary.newEntry.step3.photosTitle')}</Text>
          </View>

          <View style={styles.photosGridRow}>
            {photos.map((photo) => (
              <View
                key={photo.id}
                style={[styles.photoThumbWrapper, photo.error ? styles.photoThumbWrapperError : null]}
              >
                <Image source={{ uri: photo.localUri }} style={styles.photoThumbImage} />
                {photo.uploading ? (
                  <View style={styles.photoUploadOverlay}>
                    <ActivityIndicator size="small" color={P.white} />
                  </View>
                ) : null}
                <TouchableOpacity
                  style={styles.photoRemoveBadge}
                  onPress={() => handleRemovePhoto(photo.id)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={t('farmer.farmDiary.newEntry.step3.removePhotoLabel')}
                >
                  <CloseWhiteIcon size={8} color={P.white} />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addPhotoCard}
              onPress={() => {
                void handleAddPhoto();
              }}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.farmDiary.newEntry.step3.addPhotoLabel')}
            >
              <CameraPlusIcon size={22} color={P.twGreen800} />
            </TouchableOpacity>
          </View>

          {photos.some((p) => p.error) ? (
            <Text style={styles.fieldErrorText}>
              {photos.find((p) => p.error)?.error}
            </Text>
          ) : null}
        </View>

        {/* ── 5. Voice Note Section ── */}
        <View style={styles.attachmentSection}>
          <View style={styles.attachmentHeaderRow}>
            <MicrophoneIcon size={16} color={P.slate600} />
            <Text style={styles.attachmentHeaderTitle}>{t('farmer.farmDiary.newEntry.step3.voiceNoteTitle')}</Text>
          </View>

          <View style={styles.voiceNoteCard}>
            <TouchableOpacity
              style={styles.voicePlayBtn}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.farmDiary.newEntry.step3.playVoiceNoteLabel')}
            >
              <PlayIcon size={13} color={P.twGreen800} />
            </TouchableOpacity>

            <View style={styles.waveformContainer}>
              {WAVEFORM_BARS.map((height, i) => (
                <View
                  key={`bar_${i}`}
                  style={[styles.waveformBar, { height }]}
                />
              ))}
            </View>

            <Text style={styles.voiceDurationText}>0:14</Text>
          </View>
        </View>

        {/* ── 6. Notes Section ── */}
        <View style={styles.attachmentSection}>
          <View style={styles.attachmentHeaderRow}>
            <NotesIcon size={16} color={P.slate600} />
            <Text style={styles.attachmentHeaderTitle}>{t('farmer.farmDiary.newEntry.step3.notesTitle')}</Text>
          </View>

          <TextInput
            style={styles.notesTextInput}
            placeholder={t('farmer.farmDiary.newEntry.step3.notesPlaceholder')}
            placeholderTextColor={P.slate400}
            value={notes}
            onChangeText={setNotes}
            multiline
            textAlignVertical="top"
          />
        </View>

        {submitError ? (
          <View style={styles.errorBanner} accessibilityLiveRegion="polite">
            <Text style={styles.errorBannerText}>{submitError}</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* ── Bottom Sticky Action Bar ── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={t('farmer.common.back')}
        >
          <Text style={styles.backButtonText}>{t('farmer.common.back')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, isSaveDisabled && styles.saveButtonDisabled]}
          onPress={() => {
            void handleSave();
          }}
          disabled={isSaveDisabled}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t('farmer.farmDiary.newEntry.step3.saveEntryButton')}
          accessibilityState={{ disabled: isSaveDisabled, busy: isSubmitting }}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={P.white} />
          ) : (
            <CheckmarkIcon size={16} color={P.white} />
          )}
          <Text style={styles.saveButtonText}>
            {isSubmitting
              ? t('farmer.farmDiary.newEntry.step3.saving')
              : t('farmer.farmDiary.newEntry.step3.saveEntryButton')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Irrigation Method Selection Modal ── */}
      <Modal
        visible={isMethodModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsMethodModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsMethodModalOpen(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalHeading}>{t('farmer.farmDiary.newEntry.step3.selectIrrigationMethodModalTitle')}</Text>
            {IRRIGATION_METHODS.map((method) => {
              const isSelected = irrigationMethod === method;
              return (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.modalOption,
                    isSelected && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setIrrigationMethod(method);
                    setIsMethodModalOpen(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={irrigationMethodLabel(method)}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      isSelected && styles.modalOptionTextSelected,
                    ]}
                  >
                    {irrigationMethodLabel(method)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.white,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: P.white,
    borderBottomWidth: 1,
    borderBottomColor: P.slate100,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navCircleButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.slate200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBox: {
    flex: 1,
    marginLeft: 14,
  },
  headerTitle: {
    color: P.slate900,
    fontSize: typography.bodyLarge,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: P.slate500,
    fontSize: typography.bodySmall,
    marginTop: 2,
  },
  cancelBtnText: {
    color: P.slate600,
    fontSize: typography.body,
    fontWeight: '600',
  },

  /* 3-Segment Progress */
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  progressSegment: {
    flex: 1,
    height: 3.5,
    borderRadius: 2,
  },
  progressActive: {
    backgroundColor: P.twGreen700,
  },

  scrollContainer: {
    flex: 1,
    backgroundColor: P.white,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 110,
  },

  /* Summary Card */
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.mintTintBg,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  summaryIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryContent: {
    marginLeft: 12,
    flex: 1,
  },
  summaryTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.slate900,
  },
  summarySubtitle: {
    fontSize: typography.bodySmall,
    color: P.slate500,
    marginTop: 2,
  },

  /* Section Headings */
  sectionHeading: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: P.slate500,
    letterSpacing: 0.6,
    marginBottom: 12,
  },

  /* Form Fields */
  fieldBlock: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.slate800,
    marginBottom: 8,
  },
  requiredAsterisk: {
    color: P.twRed500,
    fontWeight: '700',
  },

  /* Dropdown Box */
  dropdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: P.slate200,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    backgroundColor: P.white,
  },
  dropdownSelectedText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.slate900,
  },

  /* Time Spent Input */
  timeSpentBox: {
    width: 140,
    height: 46,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: P.twGreen800,
    backgroundColor: P.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  timeSpentInput: {
    fontSize: typography.bodyLarge,
    fontWeight: '800',
    color: P.slate900,
    padding: 0,
    margin: 0,
  },
  timeSpentUnit: {
    fontSize: typography.bodySmall,
    color: P.slate600,
    marginLeft: 6,
    fontWeight: '500',
  },

  /* Workforce Container */
  workforceCard: {
    borderWidth: 1.5,
    borderColor: P.twGreen800,
    borderRadius: 16,
    padding: 16,
    backgroundColor: P.white,
    marginBottom: 22,
  },
  workforceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  workforceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  workforceTitle: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.twGreen800,
    letterSpacing: 0.5,
  },
  workforceSubtitle: {
    fontSize: typography.bodySmall,
    color: P.slate500,
    marginTop: 4,
    marginBottom: 14,
  },

  /* Worker Card */
  workerItemBox: {
    backgroundColor: P.white,
    marginBottom: 14,
  },
  workerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: P.avatarMintBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.twGreen800,
  },
  workerInfoBox: {
    flex: 1,
    marginLeft: 10,
  },
  workerNameInput: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.slate900,
    padding: 0,
    margin: 0,
  },
  workerRole: {
    fontSize: typography.caption,
    color: P.slate500,
    marginTop: 1,
  },
  removeWorkerBtn: {
    padding: 6,
  },

  /* Stats Row */
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  statBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: P.slate200,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: P.white,
  },
  statLabel: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: P.slate400,
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  statUnit: {
    fontSize: typography.caption,
    fontWeight: '500',
    color: P.slate500,
  },
  statInputRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  statValueInput: {
    fontSize: typography.body,
    fontWeight: '800',
    color: P.slate900,
    padding: 0,
    margin: 0,
    minWidth: 32,
  },

  wageStatBox: {
    backgroundColor: P.mintTintBg,
    borderColor: P.mintTintBg,
  },
  wageStatLabel: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: P.twGreen800,
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  wageValueInput: {
    fontSize: typography.body,
    fontWeight: '800',
    color: P.twGreen900,
    padding: 0,
    margin: 0,
    minWidth: 44,
  },
  wageStatUnit: {
    fontSize: typography.caption,
    fontWeight: '500',
    color: P.twGreen800,
  },

  /* Task Dropdown */
  taskDropdown: {
    borderWidth: 1,
    borderColor: P.slate200,
    borderRadius: 12,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    backgroundColor: P.white,
  },
  taskDropdownText: {
    fontSize: typography.bodySmall,
    fontWeight: '600',
    color: P.slate800,
    flex: 1,
  },

  /* Add Worker Button */
  addWorkerButton: {
    height: 42,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: P.twGreen800,
    backgroundColor: P.mintTintBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
    marginBottom: 14,
  },
  addWorkerButtonText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.twGreen800,
  },

  /* Total Cost Banner */
  totalCostBanner: {
    backgroundColor: P.darkForestBanner,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalCostLeft: {
    flex: 1,
  },
  totalCostTitle: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.white,
  },
  totalCostSubtitle: {
    fontSize: typography.caption,
    color: P.slate300,
    marginTop: 2,
  },
  totalCostAmount: {
    fontSize: typography.bodyLarge,
    fontWeight: '800',
    color: P.white,
  },

  /* Payment Status */
  paymentStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  paymentStatusLabel: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.slate800,
  },
  paymentPillGroup: {
    flexDirection: 'row',
    backgroundColor: P.slate100,
    borderRadius: 8,
    padding: 2,
  },
  paymentPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  paymentPillPendingActive: {
    backgroundColor: P.twAmber100,
  },
  paymentPillPaidActive: {
    backgroundColor: P.twGreen100,
  },
  paymentPillText: {
    fontSize: typography.bodySmall,
    fontWeight: '600',
    color: P.slate500,
  },
  paymentPillTextPendingActive: {
    color: P.twAmber800,
    fontWeight: '700',
  },
  paymentPillTextPaidActive: {
    color: P.twGreen800,
    fontWeight: '700',
  },

  /* Attachments (Photos, Voice Note, Notes) */
  attachmentSection: {
    marginBottom: 20,
  },
  attachmentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  attachmentHeaderTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.slate700,
  },

  /* Photos Grid */
  photosGridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  photoThumbWrapper: {
    width: 68,
    height: 68,
    borderRadius: 12,
    position: 'relative',
    overflow: 'visible',
  },
  photoThumbWrapperError: {
    borderWidth: 1.5,
    borderColor: P.twRed500,
  },
  photoThumbImage: {
    width: 68,
    height: 68,
    borderRadius: 12,
  },
  photoUploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: P.slate800,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: P.white,
  },
  addPhotoCard: {
    width: 68,
    height: 68,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: P.twGreen500,
    backgroundColor: P.twGreen50,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Voice Note Player */
  voiceNoteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: P.slate200,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: P.white,
  },
  voicePlayBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: P.mintTintBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveformContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 14,
  },
  waveformBar: {
    width: 14,
    borderRadius: 3,
    backgroundColor: P.waveformBarBg,
  },
  voiceDurationText: {
    fontSize: typography.bodySmall,
    fontWeight: '500',
    color: P.slate500,
    marginLeft: 10,
  },

  /* Notes Text Input */
  notesTextInput: {
    borderWidth: 1,
    borderColor: P.slate200,
    borderRadius: 14,
    backgroundColor: P.white,
    minHeight: 70,
    padding: 12,
    fontSize: typography.bodySmall,
    color: P.slate900,
  },

  /* Bottom Bar */
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: P.white,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: P.slate100,
  },
  backButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.slate200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.white,
  },
  backButtonText: {
    color: P.slate800,
    fontSize: typography.body,
    fontWeight: '700',
  },
  saveButton: {
    flex: 1.5,
    height: 48,
    borderRadius: 12,
    backgroundColor: P.twGreen800,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: P.white,
    fontSize: typography.body,
    fontWeight: '700',
  },

  /* Errors */
  errorBanner: {
    backgroundColor: P.twRed50,
    borderWidth: 1,
    borderColor: P.twRed200,
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
  },
  errorBannerText: {
    fontSize: typography.bodySmall,
    color: P.twRed700,
    lineHeight: 18,
  },
  fieldErrorText: {
    fontSize: typography.caption,
    color: P.twRed700,
    marginTop: 6,
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: P.white,
    borderRadius: 16,
    padding: 18,
    elevation: 6,
  },
  modalHeading: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.slate900,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 4,
  },
  modalOptionSelected: {
    backgroundColor: P.twGreen50,
  },
  modalOptionText: {
    fontSize: typography.body,
    color: P.slate800,
    fontWeight: '500',
  },
  modalOptionTextSelected: {
    color: P.twGreen800,
    fontWeight: '700',
  },
});
