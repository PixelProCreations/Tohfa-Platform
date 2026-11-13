import { useCallback, useEffect, useMemo, useReducer } from 'react';
import DocumentPicker from '../../../../native/documentPicker';
import { formatErrorMessage } from '../../../../../../shell/api/client';
import { getFarms, getPlots } from '../../../../api/farms';
import { signUpload } from '../../../../api/registration';
import { uploadWithResume } from '../../../../api/uploader';
import { createSoilTest, type CreateSoilTestInput, type LimeStatus } from '../../../../api/soil';
import {
  BYTES_FALLBACK,
  BYTES_PER_MB,
  DEFAULT_REPORT_FILE_NAME,
  PRESET_WATER_SOURCES_SEPARATOR,
} from './constants';
import { addOneYear, formatSoilDate, toIsoDate } from './dateUtils';
import { st } from './i18n';
import { useFieldValidation } from '../../../../utils/validation';
import { SOIL_TEST_FIELD_ORDER, soilTestRules } from './validation';

const SIZE_DECIMALS = 1;
const MIME_PDF = 'application/pdf';
const MIME_IMAGE = 'image/jpeg';

export interface SavedSoilTestData {
  testDate: string;
  nextDue: string;
  ph: number;
  oc: number;
  ec: number;
  tds?: number | null | undefined;
  nitrogen?: number | null | undefined;
  phosphorus?: number | null | undefined;
  potassium?: number | null | undefined;
  limeStatus: string;
  waterSources?: string | undefined;
  documentName?: string | undefined;
}

export interface AttachedDoc {
  name: string;
  size: string;
  uri: string;
}

export type TextFieldName =
  | 'testDate'
  | 'nextDue'
  | 'organicCarbon'
  | 'ph'
  | 'ec'
  | 'tds'
  | 'nitrogen'
  | 'phosphorus'
  | 'potassium'
  | 'limeStatus';

export interface SoilTestFormState {
  // Form values
  testDate: string;
  nextDue: string;
  organicCarbon: string;
  ph: string;
  ec: string;
  tds: string;
  nitrogen: string;
  phosphorus: string;
  potassium: string;
  limeStatus: string;
  attachedDoc: AttachedDoc | null;
  // Plot / farm context
  plotId: string;
  plotLoading: boolean;
  plotLoadError: string | null;
  waterSourcesText: string;
  // Submission
  saving: boolean;
  saveError: string | null;
  docPickError: string | null;
  savedSuccess: SavedSoilTestData | null;
  // Pickers
  testDatePickerVisible: boolean;
  nextDuePickerVisible: boolean;
  limePickerVisible: boolean;
}

const initialState: SoilTestFormState = {
  testDate: '',
  nextDue: '',
  organicCarbon: '',
  ph: '',
  ec: '',
  tds: '',
  nitrogen: '',
  phosphorus: '',
  potassium: '',
  limeStatus: '',
  attachedDoc: null,
  plotId: '',
  plotLoading: true,
  plotLoadError: null,
  // Placeholder shown until the farm's real water sources load.
  waterSourcesText: ['Borewell', 'Rainwater harvesting'].join(PRESET_WATER_SOURCES_SEPARATOR),
  saving: false,
  saveError: null,
  docPickError: null,
  savedSuccess: null,
  testDatePickerVisible: false,
  nextDuePickerVisible: false,
  limePickerVisible: false,
};

type Action = { type: 'patch'; patch: Partial<SoilTestFormState> };

function reducer(state: SoilTestFormState, action: Action): SoilTestFormState {
  return { ...state, ...action.patch };
}

interface Options {
  farmId: string;
  onBack?: (() => void) | undefined;
  onSave?: (() => void) | undefined;
}

/**
 * All state and side effects of the Upload Soil Test screen.
 *
 * Twenty-odd independent `useState`s were collapsed into one reducer so the
 * save/load flows update related fields (loading + error + plot id, saving +
 * error) together instead of as a cascade of separate renders.
 */
export function useSoilTestForm({ farmId, onBack, onSave }: Options) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const patch = useCallback(
    (p: Partial<SoilTestFormState>) => dispatch({ type: 'patch', patch: p }),
    [],
  );

  const fieldValues = useMemo(
    () => ({
      testDate: state.testDate,
      nextDue: state.nextDue,
      organicCarbon: state.organicCarbon,
      ph: state.ph,
      ec: state.ec,
      tds: state.tds,
      nitrogen: state.nitrogen,
      phosphorus: state.phosphorus,
      potassium: state.potassium,
    }),
    [
      state.testDate,
      state.nextDue,
      state.organicCarbon,
      state.ph,
      state.ec,
      state.tds,
      state.nitrogen,
      state.phosphorus,
      state.potassium,
    ],
  );
  const rules = useMemo(() => soilTestRules(state.testDate), [state.testDate]);
  const validation = useFieldValidation({ values: fieldValues, rules, order: SOIL_TEST_FIELD_ORDER });

  // No plot picker exists in this mock's UI, so the test is logged against the
  // farm's first plot (multi-plot farms cannot pick a different zone here).
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!farmId) {
        patch({ plotLoadError: st('error.noFarm'), plotLoading: false });
        return;
      }
      patch({ plotLoading: true, plotLoadError: null });
      try {
        const [plots, farms] = await Promise.all([getPlots(farmId), getFarms().catch(() => [])]);
        if (cancelled) return;
        const currentFarm = farms.find((f) => f.id === farmId);
        if (currentFarm && currentFarm.waterSources && currentFarm.waterSources.length > 0) {
          patch({
            waterSourcesText: currentFarm.waterSources.join(PRESET_WATER_SOURCES_SEPARATOR),
          });
        }
        const firstPlot = plots[0];
        if (!firstPlot) {
          patch({ plotLoadError: st('error.noZones') });
        } else {
          patch({ plotId: firstPlot.id });
        }
      } catch (err) {
        if (!cancelled) {
          patch({ plotLoadError: formatErrorMessage(err, st('error.loadZones')) });
        }
      } finally {
        if (!cancelled) patch({ plotLoading: false });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [farmId, patch]);

  const setField = useCallback(
    (name: TextFieldName, value: string) => patch({ [name]: value }),
    [patch],
  );

  const handleSuccessModalClose = () => {
    patch({ savedSuccess: null });
    if (onSave) {
      onSave();
    } else if (onBack) {
      onBack();
    }
  };

  const handleSelectTestDate = (date: Date) => {
    // Auto-suggest next due date as test date + 1 year (editable).
    patch({
      testDate: formatSoilDate(date),
      nextDue: formatSoilDate(addOneYear(date)),
      testDatePickerVisible: false,
    });
  };

  const handleSelectNextDue = (date: Date) => {
    patch({ nextDue: formatSoilDate(date), nextDuePickerVisible: false });
  };

  const handlePickDocument = async () => {
    try {
      const picked = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.pdf, DocumentPicker.types.images],
        copyTo: 'cachesDirectory',
      });
      const sizeMB = ((picked.size ?? BYTES_FALLBACK) / BYTES_PER_MB).toFixed(SIZE_DECIMALS);
      const isPdf = (picked.name ?? '').toLowerCase().endsWith('.pdf');
      patch({
        attachedDoc: {
          name: picked.name ?? DEFAULT_REPORT_FILE_NAME,
          size: st('lab.meta', {
            size: sizeMB,
            kind: st(isPdf ? 'lab.kind.pdf' : 'lab.kind.image'),
          }),
          uri: picked.fileCopyUri ?? picked.uri,
        },
        docPickError: null,
      });
    } catch (err) {
      // User cancelling the picker is not an error -- just leave attachedDoc
      // untouched. Any other failure must be shown to the farmer, never
      // papered over with a fabricated "attached" document (that previously
      // let the UI claim a real file was attached when nothing was picked).
      if (!DocumentPicker.isCancel(err)) {
        patch({ docPickError: formatErrorMessage(err, st('error.attachDocument')) });
      }
    }
  };

  const handleSave = async () => {
    const {
      testDate,
      nextDue,
      organicCarbon,
      ph,
      ec,
      tds,
      nitrogen,
      phosphorus,
      potassium,
      limeStatus,
      attachedDoc,
      plotId,
      waterSourcesText,
    } = state;
    patch({ saveError: null });

    // Per-field messages render under each input; the banner below stays for the
    // blank-required / unparseable-date backstops.
    if (!validation.validateAll().valid) return;

    if (!testDate.trim() || !nextDue.trim() || !organicCarbon.trim() || !ph.trim() || !ec.trim()) {
      patch({ saveError: st('error.requiredFields') });
      return;
    }

    const isoTestDate = toIsoDate(testDate);
    const isoNextDue = toIsoDate(nextDue);
    if (!isoTestDate || !isoNextDue) {
      patch({ saveError: st('error.invalidDate') });
      return;
    }
    if (!farmId || !plotId) {
      patch({ saveError: st('error.noZoneForTest') });
      return;
    }

    patch({ saving: true, saveError: null });
    try {
      // Best-effort lab report upload. POST /uploads/sign returns the
      // uploads-table row id (`id`) alongside the signed target, so it can be
      // linked to this soil test record as `labReportUploadId` -- soil.service.ts's
      // requireOwnUpload looks it up by primary key and rejects anything the
      // caller doesn't own.
      let labReportUploadId: string | undefined;
      if (attachedDoc) {
        try {
          const fileResp = await fetch(attachedDoc.uri);
          const buffer = await fileResp.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          const contentType = attachedDoc.name.toLowerCase().endsWith('.pdf')
            ? MIME_PDF
            : MIME_IMAGE;
          const signed = await signUpload({
            purpose: 'SOIL_TEST_REPORT',
            fileName: attachedDoc.name,
            contentType,
            sizeBytes: bytes.length,
          });
          await uploadWithResume({
            uploadUrl: signed.uploadUrl,
            fileUrl: signed.fileUrl,
            resumable: signed.resumable ?? false,
            data: bytes,
            contentType,
            headers: signed.headers,
            method: signed.method,
          });
          labReportUploadId = signed.id;
        } catch {
          // Non-fatal: the soil test record itself is still worth saving even
          // if the report upload failed.
        }
      }

      const body: CreateSoilTestInput = {
        testDate: isoTestDate,
        nextDueDate: isoNextDue,
        organicCarbonPct: parseFloat(organicCarbon),
        ph: parseFloat(ph),
        ecDsPerM: parseFloat(ec),
        ...(tds.trim() ? { tdsPpm: Math.round(parseFloat(tds)) } : {}),
        ...(nitrogen.trim() ? { nitrogenKgPerHa: parseFloat(nitrogen) } : {}),
        ...(phosphorus.trim() ? { phosphorusKgPerHa: parseFloat(phosphorus) } : {}),
        ...(potassium.trim() ? { potassiumKgPerHa: parseFloat(potassium) } : {}),
        ...(limeStatus ? { limeStatus: limeStatus as LimeStatus } : {}),
        ...(labReportUploadId ? { labReportUploadId } : {}),
      };

      const saved = await createSoilTest(farmId, plotId, body);

      patch({
        savedSuccess: {
          testDate,
          nextDue,
          ph: saved.ph,
          oc: saved.organicCarbonPct,
          ec: saved.ecDsPerM,
          tds: saved.tdsPpm ?? (tds.trim() ? parseFloat(tds) : null),
          nitrogen: saved.nitrogenKgPerHa ?? (nitrogen.trim() ? parseFloat(nitrogen) : null),
          phosphorus:
            saved.phosphorusKgPerHa ?? (phosphorus.trim() ? parseFloat(phosphorus) : null),
          potassium: saved.potassiumKgPerHa ?? (potassium.trim() ? parseFloat(potassium) : null),
          limeStatus: saved.limeStatus || limeStatus,
          waterSources: waterSourcesText,
          documentName: attachedDoc?.name,
        },
      });
    } catch (err) {
      patch({ saveError: formatErrorMessage(err, st('error.save')) });
    } finally {
      patch({ saving: false });
    }
  };

  return {
    state,
    patch,
    validation,
    setField,
    handleSuccessModalClose,
    handleSelectTestDate,
    handleSelectNextDue,
    handlePickDocument,
    handleSave,
  };
}
