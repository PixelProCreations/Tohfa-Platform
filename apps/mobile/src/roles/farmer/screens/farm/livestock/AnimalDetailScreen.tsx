import React, { useState } from 'react';
import {
  Alert,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { ErrorState, Skeleton, ScreenStatusBar } from '@tohfa/mobile-ui';
import { authPalette as P, colors, radius, spacing, typography } from '../../../theme';
import { t, type TranslationKey } from '../../../../../i18n/farmer';
import { formatErrorMessage } from '../../../../../shell/api/client';
import {
  createBreedingRecord,
  createFeedLog,
  createFeedPlan,
  createHealthRecord,
  createHousingRecord,
  createHygieneLog,
  createProductionLog,
  type AnimalGender,
  type AnimalResponse,
  type AnimalSource,
  type AnimalSpecies,
  type BreedingRecordType,
  type HealthRecordType,
  type OrganicStatus,
} from '../../../api/livestock';
import { type AnimalFormData } from './RegisterAnimalScreen';
import {
  APPETITE_OPTIONS,
  BREEDING_METHOD_OPTIONS,
  BREEDING_RECORD_TYPE_OPTIONS,
  CHECKUP_TYPE_OPTIONS,
  DELIVERY_TYPE_OPTIONS,
  DEWORMING_ROUTE_OPTIONS,
  EGG_GRADE_OPTIONS,
  EGG_SESSION_OPTIONS,
  EGG_SHELL_OPTIONS,
  EXAMINATION_METHOD_OPTIONS,
  FEED_ITEM_UNIT_OPTIONS,
  GENDER_OPTIONS,
  GESTATION_UNIT_OPTIONS,
  GRAZING_UNIT_OPTIONS,
  HEALTH_RECORD_TYPE_OPTIONS,
  HEALTH_STATUS_OPTIONS,
  HOUSING_TYPE_OPTIONS,
  INSEMINATION_TYPE_OPTIONS,
  MANURE_COLLECTION_OPTIONS,
  MANURE_COMPOST_OPTIONS,
  MANURE_MOISTURE_OPTIONS,
  MEAT_CUT_OPTIONS,
  MEAT_GRADE_OPTIONS,
  MILK_APPEARANCE_OPTIONS,
  MILK_GRADE_OPTIONS,
  OBSERVED_REACTION_OPTIONS,
  PREGNANCY_CHECK_TYPE_OPTIONS,
  PREGNANCY_RESULT_OPTIONS,
  PRODUCTION_TYPE_OPTIONS,
  PRODUCTION_UNIT_LABELS,
  PRODUCTION_UNIT_OPTIONS,
  SESSION_OPTIONS,
  SPACE_UNIT_OPTIONS,
  TARGET_PARASITE_OPTIONS,
  TEMPERATURE_UNIT_OPTIONS,
  TREATMENT_DOSAGE_UNIT_OPTIONS,
  TREATMENT_FREQUENCY_OPTIONS,
  TREATMENT_ROUTE_OPTIONS,
  TREATMENT_TYPE_OPTIONS,
  VACCINATION_ROUTE_OPTIONS,
  VACCINE_DOSE_UNIT_OPTIONS,
  WATER_SOURCE_OPTIONS,
  WEIGHT_UNIT_OPTIONS,
  WOOL_CONDITION_OPTIONS,
  WOOL_GRADE_OPTIONS,
  WOOL_SHEARING_OPTIONS,
  buildCalvingBody,
  buildCheckupBody,
  buildDewormingBody,
  buildFeedLogBody,
  buildFeedPlanBody,
  buildHeatBody,
  buildHousingRecordBody,
  buildHygieneLogBody,
  buildInseminationBody,
  buildPregnancyCheckBody,
  buildProductionLogBody,
  buildTreatmentBody,
  buildVaccinationBody,
  FEED_LOG_UNIT_OPTIONS,
  FEED_TYPE_OPTIONS,
  fieldErrorMessage,
  optionLabel,
  optionValues,
  parseFormDate,
  treatmentHasWithdrawal,
  type BuildResult,
  type ProductionFormType,
  type YesNo,
} from './animalRecordForms';
import {
  breedingCycleNumber,
  calvingRows,
  deriveCurrentCycle,
  feedLogAmount,
  feedReferenceView,
  feedTypeLabel,
  formatDayMonth,
  formatRegisterFormDate,
  housingStandardView,
  housingTypeLabel,
  localTodayIso,
  milkSeries,
  productionRow,
  sparklinePath,
  spaceUnitLabel,
  splitHealthRecords,
  todayMilk,
} from './animalRecordView';
import {
  useAnimal,
  useAnimalBreedingRecords,
  useAnimalFeedLogs,
  useAnimalFeedPlan,
  useAnimalHealthRecords,
  useAnimalHousing,
  useAnimalHygieneLogs,
  useAnimalMilkWindow,
  useAnimalProductionLogs,
  useSireOptions,
  type PagedRecords,
} from './useAnimalRecords';
import {
  attachmentSizeParts,
  pickAnimalAttachment,
  uploadAnimalAttachment,
  type PickedAttachment,
} from './animalAttachment';

// ── SVG Icons ────────────────────────────────────────────────────────────────

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

function PencilEditIcon({ size = 18, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function HeaderTagIcon({ size = 18, color = P.twGray600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="7" cy="7" r="1.5" fill={color} />
    </Svg>
  );
}

function PawPrintIcon({ size = 26, color = P.twAmber800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="14.5" r="4.5" fill={color} />
      <Circle cx="6.5" cy="10" r="2.2" fill={color} />
      <Circle cx="17.5" cy="10" r="2.2" fill={color} />
      <Circle cx="9.5" cy="6" r="2" fill={color} />
      <Circle cx="14.5" cy="6" r="2" fill={color} />
    </Svg>
  );
}

// ── Tab Bar Icons ────────────────────────────────────────────────────────────

function TabHealthIcon({ size = 16, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="5" width="7" height="15" rx="1.5" stroke={color} strokeWidth="2" />
      <Line x1="7.5" y1="2" x2="7.5" y2="5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Rect x="13" y="8" width="7" height="12" rx="1.5" stroke={color} strokeWidth="2" />
      <Line x1="16.5" y1="5" x2="16.5" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function TabFeedIcon({ size = 16, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TabBreedingIcon({ size = 16, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TabProductionIcon({ size = 16, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 6l-9.5 9.5-5-5L1 18"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M17 6h6v6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TabHousingIcon({ size = 16, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 22V12h6v10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── Health Tab Icons ─────────────────────────────────────────────────────────

function LeafIcon({ size = 18, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M2 21c0-3 1.85-5.36 5.08-6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ProhibitedCircleIcon({ size = 18, color = P.twRed600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Line x1="5.6" y1="5.6" x2="18.4" y2="18.4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function VaccineVialsIcon({ size = 18, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="7" width="6" height="13" rx="1.5" stroke={color} strokeWidth="2" />
      <Line x1="7" y1="3" x2="7" y2="7" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Rect x="14" y="9" width="6" height="11" rx="1.5" stroke={color} strokeWidth="2" />
      <Line x1="17" y1="5" x2="17" y2="9" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="12" x2="10" y2="12" stroke={color} strokeWidth="1.5" />
      <Line x1="14" y1="14" x2="20" y2="14" stroke={color} strokeWidth="1.5" />
    </Svg>
  );
}

function DewormingBottleIcon({ size = 18, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="6" width="14" height="15" rx="3" stroke={color} strokeWidth="2" />
      <Rect x="8" y="2" width="8" height="4" rx="1" stroke={color} strokeWidth="2" />
      <Line x1="12" y1="10" x2="12" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="9" y1="13" x2="15" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function StethoscopeIcon({ size = 20, color = P.twBlue700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4.5 3v5a5.5 5.5 0 0 0 11 0V3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10 13.5v3.5a3 3 0 0 0 6 0V15"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="16" cy="13" r="2" stroke={color} strokeWidth="2" />
      <Path d="M3 3h3M14 3h3" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ── Feed Tab Icons ───────────────────────────────────────────────────────────

function SproutFodderIcon({ size = 18, color = P.twAmber800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 21V10" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M12 10a5 5 0 0 0-5-5M12 10a5 5 0 0 1 5-5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="21" x2="20" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ConcentrateMeshIcon({ size = 18, color = P.twAmber800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="8" cy="8" r="1.5" fill={color} />
      <Circle cx="12" cy="8" r="1.5" fill={color} />
      <Circle cx="16" cy="8" r="1.5" fill={color} />
      <Circle cx="8" cy="12" r="1.5" fill={color} />
      <Circle cx="12" cy="12" r="1.5" fill={color} />
      <Circle cx="16" cy="12" r="1.5" fill={color} />
      <Circle cx="8" cy="16" r="1.5" fill={color} />
      <Circle cx="12" cy="16" r="1.5" fill={color} />
      <Circle cx="16" cy="16" r="1.5" fill={color} />
    </Svg>
  );
}

function CalfCowIcon({ size = 18, color = P.twAmber800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 5l2 3h6l2-3M6 9a6 6 0 0 0 12 0V8H6v1zM9 13h.01M15 13h.01M10 17h4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PlusCircleGreenIcon({ size = 17, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 8v8M8 12h8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ── Production Tab Icons ─────────────────────────────────────────────────────

function MilkDropletIcon({ size = 18, color = P.twBlue600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ── Housing Tab Icons ────────────────────────────────────────────────────────

function BarnOutlineIcon({ size = 18, color = P.twAmber800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V10z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 22V13h6v9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ShieldCheckBadgeIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2l2.4 2 3.1-.3 1.2 2.9 3 1-.5 3.1 1.8 2.6-2 2.4.3 3.1-2.9 1.2-1 3-3.1-.5-2.6 1.8-2.4-2-3.1.3-1.2-2.9-3-1 .5-3.1-1.8-2.6 2-2.4-.3-3.1 2.9-1.2 1-3 3.1.5L12 2z"
        stroke={colors.brandGreen}
        strokeWidth="1.8"
      />
      <Path d="M8.5 12l2.5 2.5 5-5" stroke={colors.brandGreen} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BroomCleaningIcon({ size = 17, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3v10M7 17l5-4 5 4M6 21h12M5 18l1.5 3M19 18l-1.5 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── Add Health Record Modal Icons ───────────────────────────────────────────

function GreenBackArrowIcon({ size = 22, color = P.twGreen700 }: { size?: number; color?: string }) {
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

function GenderSymbolIcon({ size = 12, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Circle cx="8" cy="6" r="4" stroke={color} strokeWidth="1.6" />
      <Line x1="8" y1="10" x2="8" y2="15" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Line x1="5.5" y1="12.5" x2="10.5" y2="12.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

function FormCalendarIcon({ size = 18, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="3" stroke={color} strokeWidth="2" />
      <Line x1="3" y1="9" x2="21" y2="9" stroke={color} strokeWidth="2" />
      <Line x1="8" y1="2" x2="8" y2="5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="16" y1="2" x2="16" y2="5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="8" cy="14" r="1" fill={color} />
      <Circle cx="12" cy="14" r="1" fill={color} />
      <Circle cx="16" cy="14" r="1" fill={color} />
    </Svg>
  );
}

function FormChevronDownIcon({ size = 18, color = P.twGray500 }: { size?: number; color?: string }) {
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

function FormCloseIcon({ size = 16, color = P.twGray600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6l12 12"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FormPlusIcon({ size = 16, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5v14M5 12h14"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FormClockIcon({ size = 18, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 7v5l3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function AttachmentPaperclipIcon({ size = 18, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ReceiptDocIcon({ size = 36 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <Rect width="36" height="36" rx="8" fill={P.twRed100} />
      <Path
        d="M11 9h10l4 4v14H11V9z"
        fill={P.twRed200}
        stroke={P.twRed600}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <Path d="M21 9v4h4" stroke={P.twRed600} strokeWidth="1.2" strokeLinejoin="round" />
      <Line x1="14" y1="17" x2="22" y2="17" stroke={P.twRed600} strokeWidth="1.2" strokeLinecap="round" />
      <Line x1="14" y1="20" x2="22" y2="20" stroke={P.twRed600} strokeWidth="1.2" strokeLinecap="round" />
      <Line x1="14" y1="23" x2="19" y2="23" stroke={P.twRed600} strokeWidth="1.2" strokeLinecap="round" />
    </Svg>
  );
}

function FormCheckmarkIcon({ size = 18, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BandaidCrossIcon({ size = 16, color = P.twOrange600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17.657 6.343a4 4 0 0 1 0 5.657L12 17.657l-5.657-5.657a4 4 0 0 1 5.657-5.657l5.657 5.657z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6.343 6.343a4 4 0 0 0 0 5.657L12 17.657l5.657-5.657a4 4 0 0 0-5.657-5.657L6.343 6.343z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="12" r="1.5" fill={color} />
    </Svg>
  );
}

function MedicalCrossIcon({ size = 16, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="4" stroke={color} strokeWidth="1.8" />
      <Path d="M12 7v10M7 12h10" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function TrashIcon({ size = 18, color = P.twRed500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="10" y1="11" x2="10" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="14" y1="11" x2="14" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function PlusCircleOutlineIcon({ size = 18, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 8v8M8 12h8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function PeopleGroupIcon({ size = 16, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="7" r="3.5" stroke={color} strokeWidth="1.8" />
      <Path d="M2 20v-1.5a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4V20" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="17" cy="9" r="2.5" stroke={color} strokeWidth="1.8" />
      <Path d="M21 20v-1a3 3 0 0 0-2.5-3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

// ── Enum display / API mapping ──────────────────────────────────────────────
// Explicit switches (not `.toUpperCase() as X`) so a future enum addition on
// either side fails to compile instead of silently mismatching.

/** Display label of a species (translated). */
const SPECIES_LABEL_KEYS: Record<AnimalSpecies, TranslationKey> = {
  CATTLE: 'farmer.livestock.detail.species.CATTLE',
  BUFFALO: 'farmer.livestock.detail.species.BUFFALO',
  GOAT: 'farmer.livestock.detail.species.GOAT',
  POULTRY: 'farmer.livestock.detail.species.POULTRY',
  SHEEP: 'farmer.livestock.detail.species.SHEEP',
};

/**
 * AnimalFormData.species for RegisterAnimalScreen / EditAnimalScreen, which
 * parse this English value (an inter-screen data contract, never rendered).
 */
function speciesFormValue(v: AnimalSpecies): string {
  switch (v) {
    case 'CATTLE':
      return 'Cattle';
    case 'BUFFALO':
      return 'Buffalo';
    case 'GOAT':
      return 'Goat';
    case 'POULTRY':
      return 'Poultry';
    case 'SHEEP':
      return 'Sheep';
  }
}

/** AnimalFormData.gender (English form value, never rendered — see speciesFormValue). */
function genderFormValue(v: AnimalGender): 'Female' | 'Male' {
  return v === 'MALE' ? 'Male' : 'Female';
}

function sourceToFormValue(v: AnimalSource): 'born_on_farm' | 'purchased' {
  return v === 'PURCHASED' ? 'purchased' : 'born_on_farm';
}

function organicStatusToFormValue(v: OrganicStatus): 'Organic' | 'Transitioning' | 'Conventional' {
  switch (v) {
    case 'ORGANIC':
      return 'Organic';
    case 'TRANSITIONING':
      return 'Transitioning';
    case 'CONVENTIONAL':
      return 'Conventional';
  }
}

function statusBadgeLabelFor(animal: AnimalResponse): string {
  if (animal.organicStatus === 'ORGANIC') {
    return animal.source === 'BORN_ON_FARM'
      ? t('farmer.livestock.list.statusBornOrganic')
      : t('farmer.livestock.list.statusFullyOrganic');
  }
  if (animal.organicStatus === 'TRANSITIONING') {
    return t('farmer.livestock.list.statusTransitioning');
  }
  return t('farmer.livestock.list.statusConventional');
}

/** `YYYY-MM-DD` parsed as a LOCAL calendar date, never `new Date(iso)`. */
function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map((part) => parseInt(part, 10));
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function isWithdrawalActive(withdrawalUntil: string | null): boolean {
  return withdrawalUntil !== null && withdrawalUntil >= todayIso();
}

/** Short age label ("4 yr", "8 mo") computed client-side from `dateOfBirth`. */
function computeAgeShort(dateOfBirth: string | null): string {
  if (!dateOfBirth) return t('farmer.livestock.list.ageUnknown');
  const birth = parseIsoDate(dateOfBirth);
  const now = new Date();
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months -= 1;
  if (months < 0) return t('farmer.livestock.list.ageNewborn');
  if (months < 12) return t('farmer.livestock.list.ageMonths', { count: Math.max(months, 0) });
  return t('farmer.livestock.list.ageYears', { count: Math.floor(months / 12) });
}

/** "12 Jul" with the translated month (farmer.audits.monthShort.*). */
function formatShortDate(iso: string): string {
  return formatDayMonth(iso);
}

function daysUntil(iso: string): number {
  const target = parseIsoDate(iso).getTime();
  const today = parseIsoDate(todayIso()).getTime();
  return Math.max(0, Math.round((target - today) / (1000 * 60 * 60 * 24)));
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface AnimalDetailProps {
  /** Required to load anything; when missing the screen shows an error state (no stand-in animal). */
  animalId?: string | undefined;
  /** Route-param display hints; the fetched animal always wins. */
  animalName?: string | undefined;
  animalCode?: string | undefined;
  species?: string | undefined;
  breed?: string | undefined;
  gender?: string | undefined;
  age?: string | undefined;
  statusBadge?: string | undefined;
  onBack?: () => void;
  onNavigateToEdit?: (animalData: AnimalFormData) => void;
  onNavigateToSale?: () => void;
  /** Opens the Register Animal form pre-filled for a newborn (BR-138 calving). */
  onNavigateToRegisterOffspring?: (prefill: Partial<AnimalFormData>) => void;
}

type TabKey = 'Health' | 'Feed' | 'Breeding' | 'Production' | 'Housing';

/** The add-record modal's attachment: a real picked file, uploaded on save. */
type AttachmentState = PickedAttachment | null;

/** Footer row for a paginated section: "Show more" while the API says there is more. */
function ShowMoreRow({ list, testID }: { list: PagedRecords<unknown>; testID: string }): React.JSX.Element | null {
  if (!list.hasMore) return null;
  return (
    <TouchableOpacity
      style={styles.showMoreBtn}
      onPress={list.loadMore}
      disabled={list.loadingMore}
      accessibilityRole="button"
      testID={testID}
    >
      <Text style={styles.sectionHeaderAddText}>
        {list.loadMoreError
          ? t('farmer.livestock.detail.common.loadMoreFailed')
          : t('farmer.livestock.detail.common.showMore')}
      </Text>
    </TouchableOpacity>
  );
}

/** Loading / error+Retry block for one tab section. */
function SectionState({ list, testID }: { list: PagedRecords<unknown>; testID: string }): React.JSX.Element | null {
  switch (list.state) {
    case 'loading':
    case 'idle':
      return (
        <View style={styles.whiteCardContainer} testID={`${testID}.loading`}>
          <Skeleton width="100%" height={spacing.xxxl} borderRadius={radius.lg} />
        </View>
      );
    case 'error':
      return (
        <View testID={`${testID}.error`}>
          <ErrorState onRetry={list.retry} />
        </View>
      );
    default:
      return null;
  }
}

/** "Please fix the following" block above a modal's buttons. */
function FormErrors({ errors, testID }: { errors: string[]; testID: string }): React.JSX.Element | null {
  if (errors.length === 0) return null;
  return (
    <View style={styles.formErrorBox} testID={testID} accessibilityLiveRegion="polite">
      <Text style={styles.formErrorTitle}>{t('farmer.livestock.detail.common.errorsTitle')}</Text>
      {errors.map((message) => (
        <Text key={message} style={styles.formErrorText}>
          {message}
        </Text>
      ))}
    </View>
  );
}

export function AnimalDetailScreen({
  animalId,
  animalName,
  animalCode,
  species,
  breed,
  gender,
  age,
  statusBadge,
  onBack,
  onNavigateToEdit,
  onNavigateToSale,
  onNavigateToRegisterOffspring,
}: AnimalDetailProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TabKey>('Health');

  // ── Real data: the animal plus each tab's records (fetched when the tab is first opened) ──
  const animalState = useAnimal(animalId);
  const animal = animalState.animal;
  const healthList = useAnimalHealthRecords(animalId, activeTab === 'Health');
  const breedingList = useAnimalBreedingRecords(animalId, activeTab === 'Breeding');
  const feedPlanList = useAnimalFeedPlan(animalId, activeTab === 'Feed');
  const feedLogList = useAnimalFeedLogs(animalId, activeTab === 'Feed');
  const productionList = useAnimalProductionLogs(animalId, activeTab === 'Production');
  const milkWindow = useAnimalMilkWindow(animalId, activeTab === 'Production');
  const housingList = useAnimalHousing(animalId, activeTab === 'Housing');
  const hygieneList = useAnimalHygieneLogs(animalId, activeTab === 'Housing');
  const [saving, setSaving] = useState(false);

  // Health Records state & Add Health Record Modal
  const [isAddHealthModalVisible, setIsAddHealthModalVisible] = useState(false);
  const [isRecordTypeDropdownOpen, setIsRecordTypeDropdownOpen] = useState(false);
  const [recordType, setRecordType] = useState<HealthRecordType>('DEWORMING');

  // ── Deworming fields ──
  const [dewormDate, setDewormDate] = useState('');
  const [dewormProductName, setDewormProductName] = useState('');
  const [activeIngredient, setActiveIngredient] = useState('');
  const [targetParasite, setTargetParasite] = useState<string>('INTERNAL_WORMS');
  const [isDewormTargetDropdownOpen, setIsDewormTargetDropdownOpen] = useState(false);
  const [dewormDose, setDewormDose] = useState('0');
  const [dewormDoseUnit, setDewormDoseUnit] = useState<string>('ML');
  const [isDewormDoseUnitDropdownOpen, setIsDewormDoseUnitDropdownOpen] = useState(false);
  const [dewormAdminRoute, setDewormAdminRoute] = useState<string>('ORAL');
  const [isDewormAdminRouteDropdownOpen, setIsDewormAdminRouteDropdownOpen] = useState(false);
  const [dewormAnimalWeight, setDewormAnimalWeight] = useState('0');
  const [dewormWeightUnit, setDewormWeightUnit] = useState<string>('KG');
  const [isDewormWeightUnitDropdownOpen, setIsDewormWeightUnitDropdownOpen] = useState(false);
  const [dewormBatchNumber, setDewormBatchNumber] = useState('');
  const [dewormExpiryDate, setDewormExpiryDate] = useState('');
  const [dewormAdministeredBy, setDewormAdministeredBy] = useState('');
  const [dewormNextDueDate, setDewormNextDueDate] = useState('');
  const [dewormObservedReaction, setDewormObservedReaction] = useState('');
  const [isDewormReactionDropdownOpen, setIsDewormReactionDropdownOpen] = useState(false);
  const [dewormNotes, setDewormNotes] = useState('');

  // ── Treatment fields ──
  const [treatmentDate, setTreatmentDate] = useState('');
  const [treatmentType, setTreatmentType] = useState<string>('MEDICATION');
  const [isTreatmentTypeDropdownOpen, setIsTreatmentTypeDropdownOpen] = useState(false);
  const [conditionDiagnosis, setConditionDiagnosis] = useState('');
  const [treatmentSymptoms, setTreatmentSymptoms] = useState('');
  const [treatmentDescription, setTreatmentDescription] = useState('');
  const [treatmentMedicineName, setTreatmentMedicineName] = useState('');
  const [treatmentDosage, setTreatmentDosage] = useState('0');
  const [treatmentDosageUnit, setTreatmentDosageUnit] = useState<string>('GRAM');
  const [isTreatmentDosageUnitDropdownOpen, setIsTreatmentDosageUnitDropdownOpen] = useState(false);
  const [treatmentRoute, setTreatmentRoute] = useState<string>('TOPICAL');
  const [isTreatmentRouteDropdownOpen, setIsTreatmentRouteDropdownOpen] = useState(false);
  const [treatmentFrequency, setTreatmentFrequency] = useState<string>('TWICE_DAILY');
  const [isTreatmentFrequencyDropdownOpen, setIsTreatmentFrequencyDropdownOpen] = useState(false);
  const [treatmentStartDate, setTreatmentStartDate] = useState('');
  const [treatmentEndDate, setTreatmentEndDate] = useState('');
  const [milkWithdrawalRequired, setMilkWithdrawalRequired] = useState<YesNo>('NO');
  const [milkWithdrawalStartDate, setMilkWithdrawalStartDate] = useState('');
  const [milkWithdrawalEndDate, setMilkWithdrawalEndDate] = useState('');
  const [withdrawalReason, setWithdrawalReason] = useState('');
  const [meatWithdrawalRequired, setMeatWithdrawalRequired] = useState<YesNo>('NO');
  const [meatWithdrawalEndDate, setMeatWithdrawalEndDate] = useState('');
  const [prescribedBy, setPrescribedBy] = useState('');
  const [treatmentAdministeredBy, setTreatmentAdministeredBy] = useState('');
  const [treatmentNotes, setTreatmentNotes] = useState('');

  // ── Vaccination fields ──
  const [recordDate, setRecordDate] = useState('');
  const [veterinarian, setVeterinarian] = useState('');
  const [vaccineName, setVaccineName] = useState('');
  const [dose, setDose] = useState('0');
  const [doseUnit, setDoseUnit] = useState<string>('ML');
  const [isDoseUnitDropdownOpen, setIsDoseUnitDropdownOpen] = useState(false);
  const [adminRoute, setAdminRoute] = useState<string>('INJECTION_IM');
  const [isAdminRouteDropdownOpen, setIsAdminRouteDropdownOpen] = useState(false);
  const [batchNumber, setBatchNumber] = useState('');
  const [nextVaccinationDate, setNextVaccinationDate] = useState('');
  const [notes, setNotes] = useState('');

  // ── Checkup fields ──
  const [recordTime, setRecordTime] = useState('');
  const [checkupType, setCheckupType] = useState('');
  const [isCheckupTypeDropdownOpen, setIsCheckupTypeDropdownOpen] = useState(false);
  const [vetClinic, setVetClinic] = useState('');
  const [bodyTemp, setBodyTemp] = useState('0');
  const [bodyTempUnit, setBodyTempUnit] = useState<string>('C');
  const [isTempUnitDropdownOpen, setIsTempUnitDropdownOpen] = useState(false);
  const [bodyWeight, setBodyWeight] = useState('0');
  const [bodyWeightUnit, setBodyWeightUnit] = useState<string>('KG');
  const [isWeightUnitDropdownOpen, setIsWeightUnitDropdownOpen] = useState(false);
  const [generalHealthStatus, setGeneralHealthStatus] = useState<string>('NORMAL');
  const [isHealthStatusDropdownOpen, setIsHealthStatusDropdownOpen] = useState(false);
  const [appetite, setAppetite] = useState<string>('NORMAL');
  const [isAppetiteDropdownOpen, setIsAppetiteDropdownOpen] = useState(false);
  const [activeLevel, setActiveLevel] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [examinationFindings, setExaminationFindings] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatmentRequired, setTreatmentRequired] = useState<YesNo>('NO');
  const [followUpRequired, setFollowUpRequired] = useState<YesNo>('NO');
  const [followUpDate, setFollowUpDate] = useState('');
  const [recommendedActions, setRecommendedActions] = useState('');

  // ── Shared Attachments ──
  const [attachment, setAttachment] = useState<AttachmentState>(null);
  const [healthErrors, setHealthErrors] = useState<string[]>([]);

  /**
   * Picks a real file for a modal's attachment slot. Cancelling is not an
   * error; anything else is shown to the farmer, never papered over with a
   * fabricated attachment.
   */
  const handlePickAttachment = async (
    setFile: (file: AttachmentState) => void,
    setErrors: (errors: string[]) => void,
  ): Promise<void> => {
    const outcome = await pickAnimalAttachment();
    switch (outcome.kind) {
      case 'picked':
        setFile(outcome.file);
        break;
      case 'tooLarge':
        setErrors([t('farmer.livestock.detail.attachment.tooLarge')]);
        break;
      case 'failed':
        setErrors([t('farmer.livestock.detail.attachment.pickFailed')]);
        break;
      default:
        break; // cancelled: not an error
    }
  };

  const attachmentSizeLabel = (file: PickedAttachment): string => {
    const size = attachmentSizeParts(file.sizeBytes);
    if (size === null) return '';
    return size.unit === 'KB'
      ? t('farmer.livestock.detail.attachment.sizeKb', { size: size.value })
      : t('farmer.livestock.detail.attachment.sizeMb', { size: size.value });
  };

  /**
   * Shared save pipeline for every modal: validate (nothing is sent on a
   * validation error), upload the attachment if any, POST, then refresh.
   * Returns true when the record was saved.
   */
  const submitRecord = async <B,>(
    built: BuildResult<B>,
    setErrors: (errors: string[]) => void,
    file: AttachmentState,
    post: (body: B) => Promise<unknown>,
  ): Promise<boolean> => {
    if (!built.ok) {
      setErrors(built.errors.map(fieldErrorMessage));
      return false;
    }
    setErrors([]);
    setSaving(true);
    try {
      let body: B = built.body;
      if (file !== null) {
        try {
          const attachmentUploadId = await uploadAnimalAttachment(file);
          body = { ...body, attachmentUploadId };
        } catch {
          setErrors([t('farmer.livestock.detail.attachment.uploadFailed')]);
          return false;
        }
      }
      await post(body);
      return true;
    } catch (err: unknown) {
      setErrors([formatErrorMessage(err, t('farmer.livestock.detail.common.saveFailed'))]);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHealthRecord = async (): Promise<void> => {
    if (!animalId || saving) return;
    let saved = false;
    let movedWithdrawal = false;
    const post = (body: Parameters<typeof createHealthRecord>[1]) => createHealthRecord(animalId, body);
    if (recordType === 'VACCINATION') {
      saved = await submitRecord(
        buildVaccinationBody({
          recordDate,
          veterinarian,
          vaccineName,
          dose,
          doseUnit,
          route: adminRoute,
          batchNumber,
          nextDueDate: nextVaccinationDate,
          notes,
        }),
        setHealthErrors,
        attachment,
        post,
      );
    } else if (recordType === 'DEWORMING') {
      saved = await submitRecord(
        buildDewormingBody({
          recordDate: dewormDate,
          productName: dewormProductName,
          activeIngredient,
          targetParasite,
          dose: dewormDose,
          doseUnit: dewormDoseUnit,
          route: dewormAdminRoute,
          animalWeight: dewormAnimalWeight,
          weightUnit: dewormWeightUnit,
          batchNumber: dewormBatchNumber,
          expiryDate: dewormExpiryDate,
          administeredBy: dewormAdministeredBy,
          nextDueDate: dewormNextDueDate,
          observedReaction: dewormObservedReaction,
          notes: dewormNotes,
        }),
        setHealthErrors,
        attachment,
        post,
      );
    } else if (recordType === 'TREATMENT') {
      const built = buildTreatmentBody({
        recordDate: treatmentDate,
        treatmentType,
        condition: conditionDiagnosis,
        symptoms: treatmentSymptoms,
        description: treatmentDescription,
        medicineName: treatmentMedicineName,
        dosage: treatmentDosage,
        dosageUnit: treatmentDosageUnit,
        route: treatmentRoute,
        frequency: treatmentFrequency,
        startDate: treatmentStartDate,
        endDate: treatmentEndDate,
        milkWithdrawalRequired,
        milkWithdrawalStart: milkWithdrawalStartDate,
        milkWithdrawalEnd: milkWithdrawalEndDate,
        withdrawalReason,
        meatWithdrawalRequired,
        meatWithdrawalEnd: meatWithdrawalEndDate,
        prescribedBy,
        administeredBy: treatmentAdministeredBy,
        notes: treatmentNotes,
      });
      movedWithdrawal = built.ok && treatmentHasWithdrawal(built.body);
      saved = await submitRecord(built, setHealthErrors, attachment, post);
    } else {
      saved = await submitRecord(
        buildCheckupBody({
          recordDate,
          time: recordTime,
          checkupType,
          veterinarian,
          clinic: vetClinic,
          bodyTemp,
          bodyTempUnit,
          bodyWeight,
          bodyWeightUnit,
          healthStatus: generalHealthStatus,
          appetite,
          activityLevel: activeLevel,
          symptoms,
          findings: examinationFindings,
          diagnosis,
          treatmentRequired,
          followUpRequired,
          followUpDate,
          recommendedActions,
        }),
        setHealthErrors,
        attachment,
        post,
      );
    }
    if (!saved) return;
    healthList.refresh();
    // BR-137: a withdrawal window moves the animal's withdrawalUntil server-side,
    // so the banner / red dot must come from a fresh GET of the animal.
    if (movedWithdrawal) animalState.refresh();
    setAttachment(null);
    setIsAddHealthModalVisible(false);
    Alert.alert(t('farmer.livestock.detail.common.savedTitle'),
      t('farmer.livestock.detail.health.savedBody', { name: displayName }),
    );
  };

  // ── Feed Reference state & Modal ──
  const [isAddFeedModalVisible, setIsAddFeedModalVisible] = useState(false);
  const [feedPlanName, setFeedPlanName] = useState('');
  const [feedType, setFeedType] = useState<string>('GREEN_FODDER');
  const [isFeedTypeDropdownOpen, setIsFeedTypeDropdownOpen] = useState(false);
  const [feedSource, setFeedSource] = useState('');
  const [dailyGrazingDuration, setDailyGrazingDuration] = useState('');
  const [dailyGrazingUnit, setDailyGrazingUnit] = useState<string>('HOURS_PER_DAY');
  const [isGrazingUnitDropdownOpen, setIsGrazingUnitDropdownOpen] = useState(false);
  const [waterSource, setWaterSource] = useState('');
  const [isWaterSourceDropdownOpen, setIsWaterSourceDropdownOpen] = useState(false);
  const [feedStartTime, setFeedStartTime] = useState('');
  const [feedEndTime, setFeedEndTime] = useState('');
  const [feedItems, setFeedItems] = useState<Array<{ id: string; name: string; amount: string; unit: string; isUnitOpen?: boolean }>>([
    { id: 'f1', name: '', amount: '', unit: 'KG_PER_DAY' },
  ]);
  const [feedNotes, setFeedNotes] = useState('');
  const [feedAttachment, setFeedAttachment] = useState<AttachmentState>(null);
  const [feedErrors, setFeedErrors] = useState<string[]>([]);

  const handleAddFeedItem = () => {
    setFeedItems((prev) => [
      ...prev,
      { id: `fi_${Date.now()}`, name: '', amount: '', unit: 'KG_PER_DAY' },
    ]);
  };

  const handleRemoveFeedItem = (id: string) => {
    setFeedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateFeedItemName = (id: string, name: string) => {
    setFeedItems((prev) => prev.map((item) => (item.id === id ? { ...item, name } : item)));
  };

  const handleUpdateFeedItemAmount = (id: string, amount: string) => {
    setFeedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, amount } : item))
    );
  };

  const handleToggleFeedItemUnit = (id: string) => {
    setFeedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isUnitOpen: !item.isUnitOpen } : item))
    );
  };

  const handleSelectFeedItemUnit = (id: string, unit: string) => {
    setFeedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, unit, isUnitOpen: false } : item))
    );
  };

  const handleSaveFeedReference = async (): Promise<void> => {
    if (!animalId || saving) return;
    const saved = await submitRecord(
      buildFeedPlanBody({
        planName: feedPlanName,
        feedType,
        source: feedSource,
        grazingDuration: dailyGrazingDuration,
        grazingUnit: dailyGrazingUnit,
        waterSource,
        startTime: feedStartTime,
        endTime: feedEndTime,
        items: feedItems,
        notes: feedNotes,
      }),
      setFeedErrors,
      feedAttachment,
      (body) => createFeedPlan(animalId, body),
    );
    if (!saved) return;
    feedPlanList.refresh();
    setFeedAttachment(null);
    setIsAddFeedModalVisible(false);
    Alert.alert(t('farmer.livestock.detail.common.savedTitle'),
      t('farmer.livestock.detail.feed.savedBody', { name: displayName }),
    );
  };

  // ── Daily feed log state & Modal (POST .../feed-logs) ──
  const [isAddFeedLogModalVisible, setIsAddFeedLogModalVisible] = useState(false);
  const [feedLogDate, setFeedLogDate] = useState('');
  const [feedLogType, setFeedLogType] = useState<string>('GREEN_FODDER');
  const [isFeedLogTypeDropdownOpen, setIsFeedLogTypeDropdownOpen] = useState(false);
  const [feedLogQuantity, setFeedLogQuantity] = useState('');
  const [feedLogUnit, setFeedLogUnit] = useState<string>('KG');
  const [isFeedLogUnitDropdownOpen, setIsFeedLogUnitDropdownOpen] = useState(false);
  const [feedLogNotes, setFeedLogNotes] = useState('');
  const [feedLogErrors, setFeedLogErrors] = useState<string[]>([]);

  const openFeedLogModal = (): void => {
    // Pre-filled with today; the farmer can change it (the date is required in the form).
    setFeedLogDate(localTodayIso());
    setFeedLogQuantity('');
    setFeedLogNotes('');
    setFeedLogErrors([]);
    setIsAddFeedLogModalVisible(true);
  };

  const handleSaveFeedLog = async (): Promise<void> => {
    if (!animalId || saving) return;
    const saved = await submitRecord(
      buildFeedLogBody({
        fedOn: feedLogDate,
        feedType: feedLogType,
        quantity: feedLogQuantity,
        unit: feedLogUnit,
        notes: feedLogNotes,
      }),
      setFeedLogErrors,
      null,
      (body) => createFeedLog(animalId, body),
    );
    if (!saved) return;
    feedLogList.refresh();
    setIsAddFeedLogModalVisible(false);
    Alert.alert(t('farmer.livestock.detail.common.savedTitle'),
      t('farmer.livestock.detail.feed.logSavedBody', { name: displayName }),
    );
  };

  // ── Breeding Records state & Modal ──
  const [isAddBreedingModalVisible, setIsAddBreedingModalVisible] = useState(false);
  const [breedingRecordType, setBreedingRecordType] = useState<BreedingRecordType>('HEAT');
  const [isBreedingRecordTypeDropdownOpen, setIsBreedingRecordTypeDropdownOpen] = useState(false);

  // Heat cycle fields
  const [heatRecordDate, setHeatRecordDate] = useState('');
  const [breedingMethod, setBreedingMethod] = useState<string>('ARTIFICIAL_INSEMINATION');
  const [isBreedingMethodDropdownOpen, setIsBreedingMethodDropdownOpen] = useState(false);
  const [sireBull, setSireBull] = useState('');
  const [isSireBullDropdownOpen, setIsSireBullDropdownOpen] = useState(false);
  const [semenStrawRef, setSemenStrawRef] = useState('');
  const [heatTechnician, setHeatTechnician] = useState('');
  const [observedHeatSigns, setObservedHeatSigns] = useState('');

  // Insemination fields
  const [insemDate, setInsemDate] = useState('');
  const [insemTime, setInsemTime] = useState('');
  const [insemType, setInsemType] = useState<string>('ARTIFICIAL');
  const [insemLocation, setInsemLocation] = useState('');
  const [insemTechnician, setInsemTechnician] = useState('');
  const [insemObservedHeatSigns, setInsemObservedHeatSigns] = useState('');

  // Pregnancy check fields
  const [pregnancyDate, setPregnancyDate] = useState('');
  const [checkType, setCheckType] = useState<string>('ROUTINE');
  const [pregnancyResult, setPregnancyResult] = useState<string>('POSITIVE');
  const [isPregnancyResultDropdownOpen, setIsPregnancyResultDropdownOpen] = useState(false);
  const [examMethod, setExamMethod] = useState<string>('ULTRASOUND');
  const [isExamMethodDropdownOpen, setIsExamMethodDropdownOpen] = useState(false);
  const [pregnancyLocation, setPregnancyLocation] = useState('');
  const [pregnancyGestationUnit, setPregnancyGestationUnit] = useState<string>('MONTHS');
  const [isGestationUnitDropdownOpen, setIsGestationUnitDropdownOpen] = useState(false);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [nextCheckDate, setNextCheckDate] = useState('');
  const [pregnancyFindings, setPregnancyFindings] = useState('');

  // Calving fields
  const [calvingDate, setCalvingDate] = useState('');
  const [calvingTime, setCalvingTime] = useState('');
  const [calvingOutcome, setCalvingOutcome] = useState<string>('LIVE_BIRTH');
  const [noOfOffspring, setNoOfOffspring] = useState('1');
  const [deliveryType, setDeliveryType] = useState<string>('NORMAL');
  const [isDeliveryTypeDropdownOpen, setIsDeliveryTypeDropdownOpen] = useState(false);
  const [calvingFindings, setCalvingFindings] = useState('');
  const [offspringName, setOffspringName] = useState('');
  const [offspringGender, setOffspringGender] = useState<AnimalGender>('FEMALE');
  const [birthWeight, setBirthWeight] = useState('');
  const [birthWeightUnit, setBirthWeightUnit] = useState<string>('KG');
  const [isBirthWeightUnitDropdownOpen, setIsBirthWeightUnitDropdownOpen] = useState(false);

  // Breeding shared attachment
  const [breedingAttachment, setBreedingAttachment] = useState<AttachmentState>(null);
  const [breedingErrors, setBreedingErrors] = useState<string[]>([]);

  // Sires are the herd's own male animals of this species, plus an external / AI option.
  const herdSires = useSireOptions(animal?.species, isAddBreedingModalVisible);
  const SIRE_EXTERNAL = t('farmer.livestock.detail.breedingForm.sireExternal');
  const SIRE_BULL_OPTIONS = [...herdSires, SIRE_EXTERNAL];

  const handleSaveBreedingRecord = async (): Promise<void> => {
    if (!animalId || saving || !canAddBreeding) return;
    const post = (body: Parameters<typeof createBreedingRecord>[1]) => createBreedingRecord(animalId, body);
    let saved: boolean;
    if (breedingRecordType === 'HEAT') {
      saved = await submitRecord(
        buildHeatBody({
          recordDate: heatRecordDate,
          breedingMethod,
          sire: sireBull,
          semenStrawRef,
          technician: heatTechnician,
          heatSigns: observedHeatSigns,
        }),
        setBreedingErrors,
        breedingAttachment,
        post,
      );
    } else if (breedingRecordType === 'INSEMINATION') {
      saved = await submitRecord(
        buildInseminationBody({
          recordDate: insemDate,
          time: insemTime,
          inseminationType: insemType,
          location: insemLocation,
          technician: insemTechnician,
          heatSigns: insemObservedHeatSigns,
        }),
        setBreedingErrors,
        breedingAttachment,
        post,
      );
    } else if (breedingRecordType === 'PREGNANCY_CHECK') {
      saved = await submitRecord(
        buildPregnancyCheckBody({
          recordDate: pregnancyDate,
          checkType,
          result: pregnancyResult,
          examinationMethod: examMethod,
          location: pregnancyLocation,
          expectedDeliveryDate,
          nextCheckDate,
          findings: pregnancyFindings,
        }),
        setBreedingErrors,
        null,
        post,
      );
    } else {
      saved = await submitRecord(
        buildCalvingBody({
          recordDate: calvingDate,
          time: calvingTime,
          outcome: calvingOutcome,
          offspringCount: noOfOffspring,
          deliveryType,
          offspringName,
          offspringGender,
          birthWeight,
          birthWeightUnit,
          findings: calvingFindings,
        }),
        setBreedingErrors,
        null,
        post,
      );
    }
    if (!saved) return;
    breedingList.refresh();
    setBreedingAttachment(null);
    setIsAddBreedingModalVisible(false);
    Alert.alert(t('farmer.livestock.detail.common.savedTitle'),
      t('farmer.livestock.detail.breeding.savedBody', { name: displayName }),
    );
  };

  // ── Production Records state & Modal ──
  const [isAddProductionModalVisible, setIsAddProductionModalVisible] = useState(false);
  const [productionType, setProductionType] = useState<ProductionFormType>('MILK');
  const [isProductionTypeDropdownOpen, setIsProductionTypeDropdownOpen] = useState(false);
  const [productionDate, setProductionDate] = useState('');
  const [productionNotes, setProductionNotes] = useState('');
  const [isProductRestricted, setIsProductRestricted] = useState(false);
  const [productionErrors, setProductionErrors] = useState<string[]>([]);

  // Milk fields
  const [milkingSession, setMilkingSession] = useState<string>('MORNING');
  const [isMilkingSessionDropdownOpen, setIsMilkingSessionDropdownOpen] = useState(false);
  const [milkYield, setMilkYield] = useState('');
  const [milkYieldUnit, setMilkYieldUnit] = useState<string>('L');
  const [isMilkYieldUnitDropdownOpen, setIsMilkYieldUnitDropdownOpen] = useState(false);
  const [milkFat, setMilkFat] = useState('');
  const [qualityGrade, setQualityGrade] = useState<string>('GRADE_A');
  const [isQualityGradeDropdownOpen, setIsQualityGradeDropdownOpen] = useState(false);
  const [milkAppearance, setMilkAppearance] = useState<string>('NORMAL');
  const [isMilkAppearanceDropdownOpen, setIsMilkAppearanceDropdownOpen] = useState(false);

  // Eggs fields
  const [eggCollectionSession, setEggCollectionSession] = useState<string>('MORNING');
  const [isEggSessionDropdownOpen, setIsEggSessionDropdownOpen] = useState(false);
  const [eggCount, setEggCount] = useState('');
  const [eggUnit, setEggUnit] = useState<string>('PIECES');
  const [isEggUnitDropdownOpen, setIsEggUnitDropdownOpen] = useState(false);
  const [damagedEggs, setDamagedEggs] = useState('');
  const [eggGrade, setEggGrade] = useState<string>('A_LARGE');
  const [isEggGradeDropdownOpen, setIsEggGradeDropdownOpen] = useState(false);
  const [eggShellQuality, setEggShellQuality] = useState<string>('CLEAN_NORMAL');
  const [isEggShellDropdownOpen, setIsEggShellDropdownOpen] = useState(false);

  // Meat fields
  const [meatFacility, setMeatFacility] = useState('');
  const [meatDressedWeight, setMeatDressedWeight] = useState('');
  const [meatWeightUnit, setMeatWeightUnit] = useState<string>('KG');
  const [isMeatWeightUnitDropdownOpen, setIsMeatWeightUnitDropdownOpen] = useState(false);
  const [meatLiveWeight, setMeatLiveWeight] = useState('');
  const [meatLiveWeightUnit, setMeatLiveWeightUnit] = useState<string>('KG');
  const [isMeatLiveWeightUnitDropdownOpen, setIsMeatLiveWeightUnitDropdownOpen] = useState(false);
  const [meatCutCategory, setMeatCutCategory] = useState<string>('WHOLE_CARCASS');
  const [isMeatCutDropdownOpen, setIsMeatCutDropdownOpen] = useState(false);
  const [meatGrade, setMeatGrade] = useState<string>('PRIME');
  const [isMeatGradeDropdownOpen, setIsMeatGradeDropdownOpen] = useState(false);

  // Wool fields
  const [woolSession, setWoolSession] = useState<string>('FULL_FLEECE');
  const [isWoolSessionDropdownOpen, setIsWoolSessionDropdownOpen] = useState(false);
  const [woolWeight, setWoolWeight] = useState('');
  const [woolWeightUnit, setWoolWeightUnit] = useState<string>('KG');
  const [isWoolWeightUnitDropdownOpen, setIsWoolWeightUnitDropdownOpen] = useState(false);
  const [woolStapleLength, setWoolStapleLength] = useState('');
  const [woolGrade, setWoolGrade] = useState<string>('FINE');
  const [isWoolGradeDropdownOpen, setIsWoolGradeDropdownOpen] = useState(false);
  const [woolCondition, setWoolCondition] = useState<string>('CLEAN_SOUND');
  const [isWoolConditionDropdownOpen, setIsWoolConditionDropdownOpen] = useState(false);

  // Manure fields
  const [manureCollectionType, setManureCollectionType] = useState<string>('DAILY_SCRAPINGS');
  const [isManureCollectionTypeDropdownOpen, setIsManureCollectionTypeDropdownOpen] = useState(false);
  const [manureQuantity, setManureQuantity] = useState('');
  const [manureUnit, setManureUnit] = useState<string>('KG');
  const [isManureUnitDropdownOpen, setIsManureUnitDropdownOpen] = useState(false);
  const [manureMoisture, setManureMoisture] = useState<string>('SEMI_DRY');
  const [isManureMoistureDropdownOpen, setIsManureMoistureDropdownOpen] = useState(false);
  const [manureCompostingStatus, setManureCompostingStatus] = useState<string>('RAW');
  const [isManureCompostingDropdownOpen, setIsManureCompostingDropdownOpen] = useState(false);
  const [manureStorageLocation, setManureStorageLocation] = useState('');


  /** Form fields with no API column, kept as labelled note lines so nothing typed is lost. */
  const productionDetails = (): Array<{ label: string; value: string }> => {
    switch (productionType) {
      case 'MILK':
        return [
          {
            label: t('farmer.livestock.detail.productionDetail.milkAppearance'),
            value: optionLabel(MILK_APPEARANCE_OPTIONS, milkAppearance),
          },
        ];
      case 'EGGS':
        return [
          { label: t('farmer.livestock.detail.productionDetail.damagedEggs'), value: damagedEggs },
          { label: t('farmer.livestock.detail.productionDetail.shellQuality'), value: optionLabel(EGG_SHELL_OPTIONS, eggShellQuality) },
        ];
      case 'MEAT':
        return [
          { label: t('farmer.livestock.detail.productionDetail.facility'), value: meatFacility },
          {
            label: t('farmer.livestock.detail.productionDetail.liveWeight'),
            value: meatLiveWeight ? `${meatLiveWeight} ${optionLabel(PRODUCTION_UNIT_LABELS, meatLiveWeightUnit)}` : '',
          },
          { label: t('farmer.livestock.detail.productionDetail.cutCategory'), value: optionLabel(MEAT_CUT_OPTIONS, meatCutCategory) },
        ];
      case 'WOOL':
        return [
          { label: t('farmer.livestock.detail.productionDetail.shearing'), value: optionLabel(WOOL_SHEARING_OPTIONS, woolSession) },
          { label: t('farmer.livestock.detail.productionDetail.stapleLength'), value: woolStapleLength },
          { label: t('farmer.livestock.detail.productionDetail.woolCondition'), value: optionLabel(WOOL_CONDITION_OPTIONS, woolCondition) },
        ];
      case 'MANURE':
        return [
          {
            label: t('farmer.livestock.detail.productionDetail.collectionType'),
            value: optionLabel(MANURE_COLLECTION_OPTIONS, manureCollectionType),
          },
          { label: t('farmer.livestock.detail.productionDetail.moisture'), value: optionLabel(MANURE_MOISTURE_OPTIONS, manureMoisture) },
          {
            label: t('farmer.livestock.detail.productionDetail.compostingStatus'),
            value: optionLabel(MANURE_COMPOST_OPTIONS, manureCompostingStatus),
          },
          { label: t('farmer.livestock.detail.productionDetail.storageLocation'), value: manureStorageLocation },
        ];
    }
  };

  const handleSaveProductionRecord = async (): Promise<void> => {
    if (!animalId || saving) return;
    const byType: Record<ProductionFormType, { quantity: string; unit: string; session?: string; grade?: string }> = {
      // Quality grade has no API enum: the translated label is stored as the free-text qualityGrade.
      MILK: {
        quantity: milkYield,
        unit: milkYieldUnit,
        session: milkingSession,
        grade: optionLabel(MILK_GRADE_OPTIONS, qualityGrade),
      },
      EGGS: {
        quantity: eggCount,
        unit: eggUnit,
        session: eggCollectionSession,
        grade: optionLabel(EGG_GRADE_OPTIONS, eggGrade),
      },
      MEAT: { quantity: meatDressedWeight, unit: meatWeightUnit, grade: optionLabel(MEAT_GRADE_OPTIONS, meatGrade) },
      WOOL: { quantity: woolWeight, unit: woolWeightUnit, grade: optionLabel(WOOL_GRADE_OPTIONS, woolGrade) },
      MANURE: { quantity: manureQuantity, unit: manureUnit },
    };
    const picked = byType[productionType];
    const saved = await submitRecord(
      buildProductionLogBody({
        animalId,
        productionType,
        date: productionDate,
        quantity: picked.quantity,
        unit: picked.unit,
        ...(picked.session !== undefined ? { session: picked.session } : {}),
        ...(picked.grade !== undefined ? { qualityGrade: picked.grade } : {}),
        ...(productionType === 'MILK' ? { fatPercent: milkFat } : {}),
        // BR-139: the server forces this true while the animal is under withdrawal.
        restrictedFromSale: isProductRestricted,
        notes: productionNotes,
        details: productionDetails(),
      }),
      setProductionErrors,
      null,
      createProductionLog,
    );
    if (!saved) return;
    productionList.refresh();
    milkWindow.refresh();
    setIsAddProductionModalVisible(false);
    Alert.alert(t('farmer.livestock.detail.common.savedTitle'),
      t('farmer.livestock.detail.production.savedBody', { name: displayName }),
    );
  };

  // ── Housing Details state & Modal ──
  const [isAddHousingModalVisible, setIsAddHousingModalVisible] = useState(false);
  const [housingType, setHousingType] = useState<string>('BARN');
  const [isHousingTypeDropdownOpen, setIsHousingTypeDropdownOpen] = useState(false);
  const [housingBarnName, setHousingBarnName] = useState('');
  const [housingLocation, setHousingLocation] = useState('');
  const [indoorSpace, setIndoorSpace] = useState('');
  const [indoorSpaceUnit, setIndoorSpaceUnit] = useState<string>('SQ_FT');
  const [isIndoorSpaceUnitDropdownOpen, setIsIndoorSpaceUnitDropdownOpen] = useState(false);
  const [outdoorSpace, setOutdoorSpace] = useState('');
  const [outdoorSpaceUnit, setOutdoorSpaceUnit] = useState<string>('SQ_FT');
  const [isOutdoorSpaceUnitDropdownOpen, setIsOutdoorSpaceUnitDropdownOpen] = useState(false);
  const [housingStartDate, setHousingStartDate] = useState('');
  const [housingNotes, setHousingNotes] = useState('');
  const [housingAttachment, setHousingAttachment] = useState<AttachmentState>(null);
  const [housingErrors, setHousingErrors] = useState<string[]>([]);

  const handleSaveHousingDetails = async (): Promise<void> => {
    if (!animalId || saving) return;
    const saved = await submitRecord(
      buildHousingRecordBody({
        housingType,
        housingName: housingBarnName,
        location: housingLocation,
        indoorSpace,
        indoorUnit: indoorSpaceUnit,
        outdoorSpace,
        outdoorUnit: outdoorSpaceUnit,
        startDate: housingStartDate,
        notes: housingNotes,
      }),
      setHousingErrors,
      housingAttachment,
      (body) => createHousingRecord(animalId, body),
    );
    if (!saved) return;
    housingList.refresh();
    setHousingAttachment(null);
    setIsAddHousingModalVisible(false);
    Alert.alert(t('farmer.livestock.detail.common.savedTitle'),
      t('farmer.livestock.detail.housing.savedBody', { name: displayName }),
    );
  };

  // ── Hygiene log state & Modal (POST .../hygiene-logs) ──
  const [isAddHygieneModalVisible, setIsAddHygieneModalVisible] = useState(false);
  const [hygieneActivity, setHygieneActivity] = useState('');
  const [hygieneDate, setHygieneDate] = useState('');
  const [hygieneNotes, setHygieneNotes] = useState('');
  const [hygieneErrors, setHygieneErrors] = useState<string[]>([]);

  const openHygieneModal = (): void => {
    setHygieneActivity('');
    setHygieneDate(localTodayIso());
    setHygieneNotes('');
    setHygieneErrors([]);
    setIsAddHygieneModalVisible(true);
  };

  const handleSaveHygieneLog = async (): Promise<void> => {
    if (!animalId || saving) return;
    const saved = await submitRecord(
      buildHygieneLogBody({ activity: hygieneActivity, performedOn: hygieneDate, notes: hygieneNotes }),
      setHygieneErrors,
      null,
      (body) => createHygieneLog(animalId, body),
    );
    if (!saved) return;
    hygieneList.refresh();
    setIsAddHygieneModalVisible(false);
    Alert.alert(t('farmer.livestock.detail.common.savedTitle'),
      t('farmer.livestock.detail.housing.hygieneSavedBody', { name: displayName }),
    );
  };

  // Real, authoritative values once loaded; the route-param props above only
  // cover the brief window before the GET resolves.
  const displayName = animal?.name ?? animal?.tag ?? animalName ?? '';
  const displayCode = animal?.tag ?? animalCode ?? '';
  const displaySpecies = animal ? t(SPECIES_LABEL_KEYS[animal.species]) : (species ?? '');
  const displayBreed = animal?.breed ?? breed ?? '';
  const displayGender = animal ? optionLabel(GENDER_OPTIONS, animal.gender) : (gender ?? '');
  const displayAge = animal ? computeAgeShort(animal.dateOfBirth) : (age ?? '');
  const displayStatusBadge = animal ? statusBadgeLabelFor(animal) : (statusBadge ?? '');
  const withdrawalActive = animal ? isWithdrawalActive(animal.withdrawalUntil) : false;
  // BR-138: breeding records exist only for female animals (the server 422s a MALE animal).
  const canAddBreeding = animal?.gender === 'FEMALE';

  const today = localTodayIso();
  const healthSections = splitHealthRecords(healthList.items);
  const currentCycle = deriveCurrentCycle(breedingList.items, today);
  const cycleNumber = breedingCycleNumber(breedingList.items, breedingList.hasMore);
  const calvings = calvingRows(breedingList.items);
  const currentFeedPlan = feedPlanList.items[0];
  const feedReference = currentFeedPlan ? feedReferenceView(currentFeedPlan) : null;
  // The housing list is startDate DESC with limit 1: its only row is the current housing.
  const currentHousing = housingList.items[0];
  const housingStandard = housingList.firstPage
    ? housingStandardView(currentHousing, housingList.firstPage.spaceStandard)
    : null;
  const milkToday = todayMilk(milkWindow.items, today);
  const milkTrend = milkSeries(milkWindow.items, today);

  const tabLists: Record<TabKey, Array<PagedRecords<unknown>>> = {
    Health: [healthList],
    Feed: [feedPlanList, feedLogList],
    Breeding: [breedingList],
    Production: [productionList, milkWindow],
    Housing: [housingList, hygieneList],
  };
  const tabRefreshing = tabLists[activeTab].some((list) => list.refreshing);
  const handleRefresh = (): void => {
    animalState.refresh();
    for (const list of tabLists[activeTab]) list.refresh();
  };

  const handleEdit = () => {
    if (!animal) return;
    if (onNavigateToEdit) {
      const formData: AnimalFormData = {
        id: animal.id,
        tag: animal.tag,
        name: animal.name ?? undefined,
        species: speciesFormValue(animal.species),
        breed: animal.breed ?? '',
        gender: genderFormValue(animal.gender),
        dob: animal.dateOfBirth ? formatRegisterFormDate(animal.dateOfBirth) : '',
        source: sourceToFormValue(animal.source),
        purchaseDate: animal.purchasedOn ? formatRegisterFormDate(animal.purchasedOn) : undefined,
        sourceFarm: animal.sourceFarm ?? undefined,
        organicStatus: organicStatusToFormValue(animal.organicStatus),
      };
      onNavigateToEdit(formData);
    } else {
      Alert.alert(t('farmer.livestock.detail.a11y.edit'),
        t('farmer.livestock.detail.a11y.editFallbackBody', { name: displayName, code: displayCode }),
      );
    }
  };

  const handleMoreOptions = () => {
    if (onNavigateToSale) {
      onNavigateToSale();
    } else {
      Alert.alert(t('farmer.livestock.detail.a11y.optionsTitle'),
        t('farmer.livestock.detail.a11y.optionsBody', { name: displayName, code: displayCode }),
        [
          { text: t('farmer.livestock.detail.a11y.editProfile'), onPress: handleEdit },
          { text: t('farmer.livestock.detail.common.cancel'), style: 'cancel' },
        ],
      );
    }
  };

  /**
   * Opens the real Register Animal form pre-filled for a newborn of this
   * animal: same species, born on farm, born on the calving date.
   */
  const openRegisterOffspring = (calvingIso: string | undefined, gender: AnimalGender | null): void => {
    if (!onNavigateToRegisterOffspring || !animal) return;
    onNavigateToRegisterOffspring({
      species: speciesFormValue(animal.species),
      breed: animal.breed ?? '',
      gender: genderFormValue(gender ?? 'FEMALE'),
      dob: calvingIso ? formatRegisterFormDate(calvingIso) : '',
      source: 'born_on_farm',
      organicStatus: organicStatusToFormValue(animal.organicStatus),
      ...(offspringName.trim() ? { name: offspringName.trim() } : {}),
    });
  };

  const handleRegisterOffspring = () => {
    const calvingIso = parseFormDate(calvingDate) ?? undefined;
    setIsAddBreedingModalVisible(false);
    openRegisterOffspring(calvingIso, offspringGender);
  };

  // Compute slider thumb offset
  const getSliderThumbStyle = () => {
    switch (activeTab) {
      case 'Health':
        return { alignSelf: 'flex-start' as const };
      case 'Feed':
        return { alignSelf: 'center' as const, transform: [{ translateX: -20 }] };
      case 'Breeding':
        return { alignSelf: 'center' as const };
      case 'Production':
        return { alignSelf: 'center' as const, transform: [{ translateX: 20 }] };
      case 'Housing':
        return { alignSelf: 'flex-end' as const };
    }
  };

  // Load-state checks use `!==` / `switch`: animal_detail_i18n.test.ts reads `=== '<lowercase>'` as an English label.
  const animalPending =
    animalState.state !== 'ready' && animalState.state !== 'error' && (animalState.state !== 'idle' || animal === null);
  if (animalPending) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenStatusBar barStyle="dark-content" backgroundColor={P.white} />
        <View style={styles.screenLoading} testID="animalDetail.loading">
          <Skeleton width="100%" height={58} borderRadius={16} />
          <Skeleton width="100%" height={40} borderRadius={20} />
          <Skeleton width="100%" height={140} borderRadius={16} />
        </View>
      </SafeAreaView>
    );
  }

  if ((animalState.state !== 'ready' && animalState.state !== 'idle') || animal === null) {
    // A missing id (no route param) is an error state — never a stand-in animal.
    const missingId = !animalId;
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenStatusBar barStyle="dark-content" backgroundColor={P.white} />
        <View style={styles.screenError} testID="animalDetail.error">
          <ErrorState
            error={missingId ? undefined : animalState.error}
            {...(missingId ? { message: t('farmer.livestock.detail.missingAnimal') } : { onRetry: animalState.retry })}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={P.white} />
      <View style={styles.container}>
        {/* ── Top Header Bar ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.circleHeaderBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.livestock.detail.a11y.back')}
          >
            <ArrowBackIcon size={20} color={P.deepGreen} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{displayName}</Text>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.circleHeaderBtn}
              onPress={handleEdit}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.livestock.detail.a11y.edit')}
            >
              <PencilEditIcon size={18} color={colors.brandGreen} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.circleHeaderBtn}
              onPress={onNavigateToSale || handleMoreOptions}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.livestock.detail.a11y.saleTransferCull')}
            >
              <HeaderTagIcon size={18} color={P.twGray600} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={tabRefreshing} onRefresh={handleRefresh} />}
        >
          {/* ── Animal Profile Header Card ── */}
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarCircle}>
                <PawPrintIcon size={26} color={P.twAmber800} />
              </View>
              {withdrawalActive && <View style={styles.alertBadgeDot} testID="animalDetail.withdrawalDot" />}
            </View>

            <View style={styles.profileInfoCol}>
              <Text style={styles.profileCode}>{displayCode}</Text>
              <Text style={styles.profileSubtitle}>
                {displaySpecies} · {displayBreed} · {displayGender} · {displayAge}
              </Text>
            </View>

            <View style={styles.statusBadgePill}>
              <Text style={styles.statusBadgeText}>{displayStatusBadge}</Text>
            </View>
          </View>

          {/* ── Horizontal Navigation Tabs ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabScrollContent}
            style={styles.tabScrollView}
          >
            {/* Health Tab */}
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'Health' && styles.tabButtonActive]}
              onPress={() => setActiveTab('Health')}
              activeOpacity={0.8}
              testID="animalDetail.tab.Health"
            >
              <TabHealthIcon size={16} color={activeTab === 'Health' ? P.white : P.twGray700} />
              <Text style={[styles.tabButtonText, activeTab === 'Health' && styles.tabButtonTextActive]}>
                {t('farmer.livestock.detail.tab.health')}
              </Text>
            </TouchableOpacity>

            {/* Feed Tab */}
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'Feed' && styles.tabButtonActive]}
              onPress={() => setActiveTab('Feed')}
              activeOpacity={0.8}
              testID="animalDetail.tab.Feed"
            >
              <TabFeedIcon size={16} color={activeTab === 'Feed' ? P.white : P.twGray700} />
              <Text style={[styles.tabButtonText, activeTab === 'Feed' && styles.tabButtonTextActive]}>
                {t('farmer.livestock.detail.tab.feed')}
              </Text>
            </TouchableOpacity>

            {/* Breeding Tab */}
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'Breeding' && styles.tabButtonActive]}
              onPress={() => setActiveTab('Breeding')}
              activeOpacity={0.8}
              testID="animalDetail.tab.Breeding"
            >
              <TabBreedingIcon size={16} color={activeTab === 'Breeding' ? P.white : P.twGray700} />
              <Text
                style={[styles.tabButtonText, activeTab === 'Breeding' && styles.tabButtonTextActive]}
              >
                {t('farmer.livestock.detail.tab.breeding')}
              </Text>
            </TouchableOpacity>

            {/* Production Tab */}
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'Production' && styles.tabButtonActive]}
              onPress={() => setActiveTab('Production')}
              activeOpacity={0.8}
              testID="animalDetail.tab.Production"
            >
              <TabProductionIcon
                size={16}
                color={activeTab === 'Production' ? P.white : P.twGray700}
              />
              <Text
                style={[styles.tabButtonText, activeTab === 'Production' && styles.tabButtonTextActive]}
              >
                {t('farmer.livestock.detail.tab.production')}
              </Text>
            </TouchableOpacity>

            {/* Housing Tab */}
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'Housing' && styles.tabButtonActive]}
              onPress={() => setActiveTab('Housing')}
              activeOpacity={0.8}
              testID="animalDetail.tab.Housing"
            >
              <TabHousingIcon size={16} color={activeTab === 'Housing' ? P.white : P.twGray700} />
              <Text
                style={[styles.tabButtonText, activeTab === 'Housing' && styles.tabButtonTextActive]}
              >
                {t('farmer.livestock.detail.tab.housing')}
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Carousel / Tab position scroll indicator */}
          <View style={styles.scrollIndicatorRow}>
            <View style={styles.arrowTriangleLeft} />
            <View style={styles.sliderTrack}>
              <View style={[styles.sliderThumb, getSliderThumbStyle()]} />
            </View>
            <View style={styles.arrowTriangleRight} />
          </View>

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* TAB 1: HEALTH                                                      */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'Health' && (
            <View style={styles.tabContentContainer}>
              {/* Top Bar with Add Button */}
              <View style={styles.healthTopBar}>
                <View style={styles.healthTopBarTitleCol}>
                  <Text style={styles.healthTopBarTitle}>{t('farmer.livestock.detail.health.title')}</Text>
                  <Text style={styles.healthTopBarSubtitle}>{t('farmer.livestock.detail.health.subtitle')}</Text>
                </View>
                <TouchableOpacity
                  style={styles.addHealthButton}
                  onPress={() => setIsAddHealthModalVisible(true)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={t('farmer.livestock.detail.health.addRecord')}
                  testID="animalDetail.health.add"
                >
                  <FormPlusIcon size={15} color={P.white} />
                  <Text style={styles.addHealthButtonText}>{t('farmer.livestock.detail.common.add')}</Text>
                </TouchableOpacity>
              </View>

              {/* Notice 1: Organic Standard */}
              <View style={styles.organicNoticeCard}>
                <View style={styles.organicNoticeIconCol}>
                  <LeafIcon size={18} color={colors.brandGreen} />
                </View>
                <Text style={styles.organicNoticeText}>{t('farmer.livestock.detail.health.organicNotice')}</Text>
              </View>

              {/* Notice 2: withdrawal alert — from animal.withdrawalUntil (BR-137 moves it on a treatment save) */}
              {withdrawalActive && animal.withdrawalUntil && (
                <View style={styles.withdrawalAlertCard} testID="animalDetail.withdrawalBanner">
                  <View style={styles.withdrawalLeftAccentBar} />
                  <View style={styles.withdrawalCardInner}>
                    <View style={styles.withdrawalHeaderRow}>
                      <ProhibitedCircleIcon size={19} color={P.twOrange700} />
                      <Text style={styles.withdrawalTitle}>{t('farmer.livestock.detail.health.withdrawalTitle')}</Text>
                    </View>
                    <Text style={styles.withdrawalBody}>
                      {t('farmer.livestock.detail.health.withdrawalBody', {
                        date: formatShortDate(animal.withdrawalUntil),
                        count: daysUntil(animal.withdrawalUntil),
                      })}
                    </Text>
                  </View>
                </View>
              )}

              {healthList.state !== 'ready' ? (
                <SectionState list={healthList} testID="animalDetail.health" />
              ) : (
                <>
                  {/* Section: VACCINATIONS */}
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionHeaderTitle}>{t('farmer.livestock.detail.health.vaccinations')}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setRecordType('VACCINATION');
                        setIsAddHealthModalVisible(true);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityRole="button"
                      accessibilityLabel={t('farmer.livestock.detail.health.addRecord')}
                      testID="animalDetail.health.addVaccination"
                    >
                      <Text style={styles.sectionHeaderAddText}>{t('farmer.livestock.detail.common.addInline')}</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.whiteCardContainer}>
                    {healthSections.vaccinations.length === 0 ? (
                      <Text style={styles.itemSubtitle} testID="animalDetail.health.empty.vaccinations">
                        {t('farmer.livestock.detail.health.emptyVaccinations')}
                      </Text>
                    ) : (
                      healthSections.vaccinations.map((vac, idx) => (
                        <React.Fragment key={vac.id}>
                          {idx > 0 && <View style={styles.dividerLine} />}
                          <View style={styles.itemRow} testID={`animalDetail.health.vaccination:${vac.id}`}>
                            <View style={styles.greenIconSquare}>
                              <VaccineVialsIcon size={17} color={colors.brandGreen} />
                            </View>
                            <View style={styles.itemMainCol}>
                              <Text style={styles.itemTitle}>{vac.title}</Text>
                              <Text style={styles.itemSubtitle}>{vac.subtitle}</Text>
                            </View>
                            {vac.nextBadge ? (
                              <View style={styles.dueDateBadge}>
                                <Text style={styles.dueDateBadgeText}>{vac.nextBadge}</Text>
                              </View>
                            ) : null}
                          </View>
                        </React.Fragment>
                      ))
                    )}
                  </View>

                  {/* Section: DEWORMING */}
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionHeaderTitle}>{t('farmer.livestock.detail.health.deworming')}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setRecordType('DEWORMING');
                        setIsAddHealthModalVisible(true);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityRole="button"
                      accessibilityLabel={t('farmer.livestock.detail.health.addRecord')}
                      testID="animalDetail.health.addDeworming"
                    >
                      <Text style={styles.sectionHeaderAddText}>{t('farmer.livestock.detail.common.addInline')}</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.whiteCardContainer}>
                    {healthSections.dewormings.length === 0 ? (
                      <Text style={styles.itemSubtitle} testID="animalDetail.health.empty.deworming">
                        {t('farmer.livestock.detail.health.emptyDeworming')}
                      </Text>
                    ) : (
                      healthSections.dewormings.map((dew, idx) => (
                        <React.Fragment key={dew.id}>
                          {idx > 0 && <View style={styles.dividerLine} />}
                          <View style={styles.itemRow} testID={`animalDetail.health.deworming:${dew.id}`}>
                            <View style={styles.greenIconSquare}>
                              <DewormingBottleIcon size={17} color={colors.brandGreen} />
                            </View>
                            <View style={styles.itemMainCol}>
                              <Text style={styles.itemTitle}>{dew.title}</Text>
                              <Text style={styles.itemSubtitle}>{dew.subtitle}</Text>
                            </View>
                            {dew.nextBadge ? (
                              <View style={styles.dueDateBadge}>
                                <Text style={styles.dueDateBadgeText}>{dew.nextBadge}</Text>
                              </View>
                            ) : null}
                          </View>
                        </React.Fragment>
                      ))
                    )}
                  </View>

                  {/* Section: CHECKUP & TREATMENT */}
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionHeaderTitle}>{t('farmer.livestock.detail.health.checkupTreatment')}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setRecordType('TREATMENT');
                        setIsAddHealthModalVisible(true);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityRole="button"
                      accessibilityLabel={t('farmer.livestock.detail.health.addRecord')}
                      testID="animalDetail.health.addTreatment"
                    >
                      <Text style={styles.sectionHeaderAddText}>{t('farmer.livestock.detail.common.addInline')}</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.whiteCardContainer}>
                    {healthSections.checkups.length === 0 ? (
                      <Text style={styles.itemSubtitle} testID="animalDetail.health.empty.checkups">
                        {t('farmer.livestock.detail.health.emptyCheckups')}
                      </Text>
                    ) : (
                      healthSections.checkups.map((chk, idx) => (
                        <React.Fragment key={chk.id}>
                          {idx > 0 && <View style={styles.dividerLine} />}
                          <View style={styles.checkupCardContent} testID={`animalDetail.health.checkup:${chk.id}`}>
                            <View style={styles.checkupHeaderRow}>
                              <View style={styles.checkupTitleWithIcon}>
                                <StethoscopeIcon size={18} color={P.twBlue700} />
                                <Text style={styles.checkupTitle}>{chk.title}</Text>
                              </View>
                              {chk.doctor ? <Text style={styles.checkupDoctor}>{chk.doctor}</Text> : null}
                            </View>
                            {chk.description ? <Text style={styles.checkupDescription}>{chk.description}</Text> : null}
                          </View>
                        </React.Fragment>
                      ))
                    )}
                  </View>
                  <ShowMoreRow list={healthList} testID="animalDetail.health.showMore" />
                </>
              )}
            </View>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* TAB 2: FEED                                                        */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'Feed' && (
            <View style={styles.tabContentContainer}>
              {/* Top Bar with Add Button */}
              <View style={styles.healthTopBar}>
                <View style={styles.healthTopBarTitleCol}>
                  <Text style={styles.healthTopBarTitle}>{t('farmer.livestock.detail.feed.title')}</Text>
                  <Text style={styles.healthTopBarSubtitle}>{t('farmer.livestock.detail.feed.subtitle')}</Text>
                </View>
                <TouchableOpacity
                  style={styles.addHealthButton}
                  onPress={() => setIsAddFeedModalVisible(true)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={t('farmer.livestock.detail.feed.addReference')}
                  testID="animalDetail.feed.add"
                >
                  <FormPlusIcon size={15} color={P.white} />
                  <Text style={styles.addHealthButtonText}>{t('farmer.livestock.detail.common.add')}</Text>
                </TouchableOpacity>
              </View>

              {/* Section: FEED REFERENCE — the newest feed plan is the current one */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeaderTitle}>{t('farmer.livestock.detail.feed.reference')}</Text>
                <TouchableOpacity
                  onPress={() => setIsAddFeedModalVisible(true)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel={t('farmer.livestock.detail.feed.addReference')}
                >
                  <Text style={styles.sectionHeaderAddText}>{t('farmer.livestock.detail.common.addInline')}</Text>
                </TouchableOpacity>
              </View>
              {feedPlanList.state !== 'ready' ? (
                <SectionState list={feedPlanList} testID="animalDetail.feed.plan" />
              ) : feedReference === null ? (
                <View style={styles.whiteCardContainer}>
                  <Text style={styles.itemSubtitle} testID="animalDetail.feed.noPlan">
                    {t('farmer.livestock.detail.feed.noPlan')}
                  </Text>
                </View>
              ) : (
                <View style={styles.whiteCardContainer} testID="animalDetail.feed.reference">
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>{t('farmer.livestock.detail.feed.feedType')}</Text>
                    <Text style={styles.tableValueBold}>{feedReference.feedType}</Text>
                  </View>
                  <View style={styles.dividerLine} />
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>{t('farmer.livestock.detail.feed.source')}</Text>
                    <Text style={styles.tableValueBold}>
                      {feedReference.source ?? t('farmer.livestock.detail.feed.notRecorded')}
                    </Text>
                  </View>
                  <View style={styles.dividerLine} />
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>{t('farmer.livestock.detail.feed.grazing')}</Text>
                    <Text style={styles.tableValueBold}>
                      {feedReference.grazing ?? t('farmer.livestock.detail.feed.notRecorded')}
                    </Text>
                  </View>
                  <View style={styles.dividerLine} />
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>{t('farmer.livestock.detail.feed.waterSource')}</Text>
                    <View style={styles.waterSourceValRow}>
                      <Text style={styles.tableValueBold}>{feedReference.waterSource}</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Section: DAILY FEED LOG — its own "+ Add" opens the feed-LOG modal (never the feed-plan one) */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeaderTitle}>{t('farmer.livestock.detail.feed.dailyLog')}</Text>
                <TouchableOpacity
                  onPress={openFeedLogModal}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel={t('farmer.livestock.detail.feed.addLog')}
                  testID="animalDetail.feed.addLog"
                >
                  <Text style={styles.sectionHeaderAddText}>{t('farmer.livestock.detail.common.addInline')}</Text>
                </TouchableOpacity>
              </View>
              {feedLogList.state !== 'ready' ? (
                <SectionState list={feedLogList} testID="animalDetail.feed.logs" />
              ) : (
                <View style={styles.whiteCardContainer}>
                  {feedLogList.items.length === 0 ? (
                    <Text style={styles.itemSubtitle} testID="animalDetail.feed.noLogs">
                      {t('farmer.livestock.detail.feed.noLogs')}
                    </Text>
                  ) : (
                    feedLogList.items.map((log, idx) => (
                      <React.Fragment key={log.id}>
                        {idx > 0 && <View style={styles.dividerLine} />}
                        <View style={styles.itemRow} testID={`animalDetail.feed.log:${log.id}`}>
                          <View style={styles.tanIconSquare}>
                            {log.feedType === 'CONCENTRATE_MIX' ? (
                              <ConcentrateMeshIcon size={18} color={P.twAmber800} />
                            ) : (
                              <SproutFodderIcon size={18} color={P.twAmber800} />
                            )}
                          </View>
                          <View style={styles.itemMainCol}>
                            <Text style={styles.itemTitle}>{feedTypeLabel(log.feedType)}</Text>
                            <Text style={styles.itemSubtitle}>{formatShortDate(log.fedOn)}</Text>
                          </View>
                          <Text style={styles.itemAmountBold}>{feedLogAmount(log.quantity, log.unit)}</Text>
                        </View>
                      </React.Fragment>
                    ))
                  )}
                </View>
              )}
              <ShowMoreRow list={feedLogList} testID="animalDetail.feed.showMore" />
            </View>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* TAB 3: BREEDING                                                    */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'Breeding' && (
            <View style={styles.tabContentContainer}>
              {/* Top Bar with Add Button — BR-138: female animals only */}
              <View style={styles.healthTopBar}>
                <View style={styles.healthTopBarTitleCol}>
                  <Text style={styles.healthTopBarTitle}>{t('farmer.livestock.detail.breeding.title')}</Text>
                  <Text style={styles.healthTopBarSubtitle}>{t('farmer.livestock.detail.breeding.subtitle')}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.addHealthButton, !canAddBreeding && styles.addButtonDisabled]}
                  onPress={() => setIsAddBreedingModalVisible(true)}
                  disabled={!canAddBreeding}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !canAddBreeding }}
                  accessibilityLabel={t('farmer.livestock.detail.breeding.addRecord')}
                  testID="animalDetail.breeding.add"
                >
                  <FormPlusIcon size={15} color={P.white} />
                  <Text style={styles.addHealthButtonText}>{t('farmer.livestock.detail.common.add')}</Text>
                </TouchableOpacity>
              </View>
              {!canAddBreeding && (
                <Text style={styles.footnoteCaption} testID="animalDetail.breeding.femaleOnly">
                  {t('farmer.livestock.detail.breeding.femaleOnly')}
                </Text>
              )}

              {/* Section: CURRENT CYCLE — latest heat/insemination + latest pregnancy check */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeaderTitle}>{t('farmer.livestock.detail.breeding.currentCycle')}</Text>
                {canAddBreeding && (
                  <TouchableOpacity
                    onPress={() => {
                      setBreedingRecordType('HEAT');
                      setIsAddBreedingModalVisible(true);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.livestock.detail.breeding.addRecord')}
                  >
                    <Text style={styles.sectionHeaderAddText}>{t('farmer.livestock.detail.common.addInline')}</Text>
                  </TouchableOpacity>
                )}
              </View>
              {breedingList.state !== 'ready' ? (
                <SectionState list={breedingList} testID="animalDetail.breeding" />
              ) : (
                <>
                  <View style={styles.whiteCardContainer} testID="animalDetail.breeding.currentCycle">
                    {/* 1 + CALVING records (breedingCycleNumber); hidden until every breeding page is loaded. */}
                    {cycleNumber !== null ? (
                      <Text style={styles.cycleNumberText} testID="animalDetail.breeding.cycleNumber">
                        {t('farmer.livestock.detail.breeding.cycleNumber', { n: cycleNumber })}
                      </Text>
                    ) : null}
                    {currentCycle === null ? (
                      <Text style={styles.itemSubtitle}>{t('farmer.livestock.detail.breeding.noCycle')}</Text>
                    ) : (
                      <>
                        <View style={styles.cycleTopRow}>
                          <View style={styles.pregnantBadgePill}>
                            <Text style={styles.pregnantBadgeText}>{currentCycle.statusLabel}</Text>
                          </View>
                        </View>

                        <View style={styles.cycleGridRow}>
                          {/* Left column: Bred */}
                          <View style={styles.cycleGridCol}>
                            <Text style={styles.cycleGridLabel}>{t('farmer.livestock.detail.breeding.bred')}</Text>
                            <Text style={styles.cycleGridValBold}>
                              {currentCycle.bred?.date ?? t('farmer.livestock.detail.breeding.notRecorded')}
                            </Text>
                            {currentCycle.bred ? (
                              <Text style={styles.cycleGridSubtext}>{currentCycle.bred.method}</Text>
                            ) : null}
                          </View>

                          {/* Right column: Expected delivery (from the pregnancy check) */}
                          <View style={styles.cycleGridCol}>
                            <Text style={styles.cycleGridLabel}>
                              {t('farmer.livestock.detail.breeding.expectedDelivery')}
                            </Text>
                            <Text style={styles.cycleGridValBold}>
                              {currentCycle.expectedDelivery?.date ?? t('farmer.livestock.detail.breeding.notRecorded')}
                            </Text>
                            {currentCycle.expectedDelivery ? (
                              <Text style={styles.cycleGridCountdown}>{currentCycle.expectedDelivery.countdown}</Text>
                            ) : null}
                          </View>
                        </View>
                      </>
                    )}
                  </View>

                  {/* Section: CALVING HISTORY */}
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionHeaderTitle}>{t('farmer.livestock.detail.breeding.calvingHistory')}</Text>
                    {canAddBreeding && (
                      <TouchableOpacity
                        onPress={() => {
                          setBreedingRecordType('CALVING');
                          setIsAddBreedingModalVisible(true);
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityRole="button"
                        accessibilityLabel={t('farmer.livestock.detail.breeding.addRecord')}
                        testID="animalDetail.breeding.addCalving"
                      >
                        <Text style={styles.sectionHeaderAddText}>{t('farmer.livestock.detail.common.addInline')}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {calvings.length === 0 ? (
                    <View style={styles.whiteCardContainer}>
                      <Text style={styles.itemSubtitle} testID="animalDetail.breeding.noCalving">
                        {t('farmer.livestock.detail.breeding.noCalving')}
                      </Text>
                    </View>
                  ) : (
                    calvings.map((calving) => (
                      <View
                        key={calving.id}
                        style={styles.whiteCardContainer}
                        testID={`animalDetail.breeding.calving:${calving.id}`}
                      >
                        <View style={styles.calvingHeaderRow}>
                          <CalfCowIcon size={19} color={P.twAmber800} />
                          <Text style={styles.calvingTitle}>{calving.title}</Text>
                        </View>

                        <Text style={styles.calvingDescription}>{calving.description}</Text>

                        {calving.canRegisterOffspring && onNavigateToRegisterOffspring ? (
                          <TouchableOpacity
                            style={styles.registerOffspringBtn}
                            onPress={() => openRegisterOffspring(calving.recordDate, calving.offspringGender)}
                            activeOpacity={0.8}
                            accessibilityRole="button"
                            testID={`animalDetail.breeding.registerOffspring:${calving.id}`}
                          >
                            <PlusCircleGreenIcon size={18} color={colors.brandGreen} />
                            <Text style={styles.registerOffspringBtnText}>
                              {t('farmer.livestock.detail.breeding.registerOffspring')}
                            </Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    ))
                  )}
                  <ShowMoreRow list={breedingList} testID="animalDetail.breeding.showMore" />
                </>
              )}
            </View>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* TAB 4: PRODUCTION                                                  */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'Production' && (
            <View style={styles.tabContentContainer}>
              {/* Top Bar with Add Button */}
              <View style={styles.healthTopBar}>
                <View style={styles.healthTopBarTitleCol}>
                  <Text style={styles.healthTopBarTitle}>{t('farmer.livestock.detail.production.title')}</Text>
                  <Text style={styles.healthTopBarSubtitle}>{t('farmer.livestock.detail.production.subtitle')}</Text>
                </View>
                <TouchableOpacity
                  style={styles.addHealthButton}
                  onPress={() => setIsAddProductionModalVisible(true)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={t('farmer.livestock.detail.production.addRecord')}
                  testID="animalDetail.production.add"
                >
                  <FormPlusIcon size={15} color={P.white} />
                  <Text style={styles.addHealthButtonText}>{t('farmer.livestock.detail.common.add')}</Text>
                </TouchableOpacity>
              </View>

              {/* Milk Yield Summary Card — today's MILK logs + a 7-day series of real daily totals */}
              {milkWindow.state !== 'ready' ? (
                <SectionState list={milkWindow} testID="animalDetail.production.milk" />
              ) : (
                <View style={styles.whiteCardContainer}>
                  <View style={styles.yieldSummaryHeader}>
                    <Text style={styles.yieldSummaryLabel}>{t('farmer.livestock.detail.production.milkToday')}</Text>
                    <View style={styles.gradeBadgePill}>
                      <Text style={styles.gradeBadgeText}>
                        {milkToday.sessions === 1
                          ? t('farmer.livestock.detail.production.sessionOne')
                          : t('farmer.livestock.detail.production.sessions', { count: milkToday.sessions })}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.yieldNumberRow} testID="animalDetail.production.todayYield">
                    <Text style={styles.yieldBigNumber}>{milkToday.litres}</Text>
                    <Text style={styles.yieldUnitText}>{t('farmer.livestock.detail.unit.LITERS')}</Text>
                  </View>

                  {milkTrend !== null && (
                    <>
                      <View style={styles.sparklineContainer} testID="animalDetail.production.sparkline">
                        <Svg width="100%" height={36} viewBox="0 0 260 36">
                          <Path
                            d={sparklinePath(milkTrend)}
                            fill="none"
                            stroke={colors.brandGreen}
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </Svg>
                      </View>
                      <Text style={styles.last7DaysText}>{t('farmer.livestock.detail.production.last7Days')}</Text>
                    </>
                  )}
                </View>
              )}

              {/* Withdrawal Warning Alert */}
              {withdrawalActive && animal.withdrawalUntil && (
                <View style={styles.productionAlertCard}>
                  <ProhibitedCircleIcon size={17} color={P.twOrange700} />
                  <Text style={styles.productionAlertText}>
                    {t('farmer.livestock.detail.production.underWithdrawal', {
                      date: formatShortDate(animal.withdrawalUntil),
                    })}
                  </Text>
                </View>
              )}

              {/* Section: PRODUCTION LOG — every product logged for this animal, in its real unit */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeaderTitle}>{t('farmer.livestock.detail.production.log')}</Text>
                <TouchableOpacity
                  onPress={() => setIsAddProductionModalVisible(true)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel={t('farmer.livestock.detail.production.addRecord')}
                >
                  <Text style={styles.sectionHeaderAddText}>{t('farmer.livestock.detail.common.addInline')}</Text>
                </TouchableOpacity>
              </View>
              {productionList.state !== 'ready' ? (
                <SectionState list={productionList} testID="animalDetail.production.logs" />
              ) : productionList.items.length === 0 ? (
                <View style={styles.whiteCardContainer}>
                  <Text style={styles.itemSubtitle} testID="animalDetail.production.noLogs">
                    {t('farmer.livestock.detail.production.noLogs')}
                  </Text>
                </View>
              ) : (
                <View style={styles.whiteCardContainer}>
                  {productionList.items.map((log, idx) => {
                    const row = productionRow(log);
                    return (
                      <React.Fragment key={row.id}>
                        <View style={styles.itemRow} testID={`animalDetail.production.row:${row.id}`}>
                          <View style={styles.blueIconSquare}>
                            <MilkDropletIcon size={17} color={P.twBlue600} />
                          </View>
                          <View style={styles.itemMainCol}>
                            <Text style={styles.itemTitle}>{row.title}</Text>
                            {row.subtitle ? <Text style={styles.itemSubtitle}>{row.subtitle}</Text> : null}
                            {row.restricted ? (
                              <Text
                                style={styles.restrictedText}
                                testID={`animalDetail.production.row:${row.id}.restricted`}
                              >
                                {t('farmer.livestock.detail.production.restricted')}
                              </Text>
                            ) : null}
                          </View>
                          <Text style={styles.itemAmountBold}>{row.amount}</Text>
                        </View>
                        {idx < productionList.items.length - 1 && <View style={styles.dividerLine} />}
                      </React.Fragment>
                    );
                  })}
                </View>
              )}
              <ShowMoreRow list={productionList} testID="animalDetail.production.showMore" />
            </View>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* TAB 5: HOUSING                                                     */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'Housing' && (
            <View style={styles.tabContentContainer}>
              {/* Top Bar with Add Button */}
              <View style={styles.healthTopBar}>
                <View style={styles.healthTopBarTitleCol}>
                  <Text style={styles.healthTopBarTitle}>{t('farmer.livestock.detail.housing.title')}</Text>
                  <Text style={styles.healthTopBarSubtitle}>{t('farmer.livestock.detail.housing.subtitle')}</Text>
                </View>
                <TouchableOpacity
                  style={styles.addHealthButton}
                  onPress={() => setIsAddHousingModalVisible(true)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={t('farmer.livestock.detail.housing.addRecord')}
                  testID="animalDetail.housing.add"
                >
                  <FormPlusIcon size={15} color={P.white} />
                  <Text style={styles.addHealthButtonText}>{t('farmer.livestock.detail.common.add')}</Text>
                </TouchableOpacity>
              </View>

              {/* Section: HOUSING — the newest housing record is the current one */}
              <Text style={styles.sectionHeaderTitle}>{t('farmer.livestock.detail.housing.section')}</Text>
              {housingList.state !== 'ready' ? (
                <SectionState list={housingList} testID="animalDetail.housing.record" />
              ) : currentHousing === undefined ? (
                <View style={styles.whiteCardContainer}>
                  <Text style={styles.itemSubtitle} testID="animalDetail.housing.noRecord">
                    {t('farmer.livestock.detail.housing.noRecord')}
                  </Text>
                </View>
              ) : (
                <View style={styles.whiteCardContainer} testID="animalDetail.housing.card">
                  <View style={styles.housingHeaderRow}>
                    <BarnOutlineIcon size={18} color={P.twAmber800} />
                    <Text style={styles.housingHeaderTitle}>
                      {t('farmer.livestock.detail.housing.cardTitle', {
                        type: housingTypeLabel(currentHousing.housingType),
                        name: currentHousing.housingName,
                      })}
                    </Text>
                  </View>

                  {/* 2 Stat metric boxes */}
                  <View style={styles.housingBoxesRow}>
                    <View style={styles.housingMetricBox}>
                      <View style={styles.metricValRow}>
                        <Text style={styles.metricValNumber}>{currentHousing.indoorSpacePerAnimal.value}</Text>
                        <Text style={styles.metricValUnit}>
                          {spaceUnitLabel(currentHousing.indoorSpacePerAnimal.unit)}
                        </Text>
                      </View>
                      <Text style={styles.metricValLabel}>{t('farmer.livestock.detail.housing.perAnimal')}</Text>
                    </View>

                    {/* BR-140: the server's indoor space standard (system_config), never a constant */}
                    {housingStandard !== null ? (
                      <View style={styles.housingMetricBox} testID="animalDetail.housing.standard">
                        <View style={styles.metricValRow}>
                          <Text style={styles.metricValNumber}>
                            {t('farmer.livestock.detail.housing.standardValue', { value: housingStandard.value })}
                          </Text>
                          <Text style={styles.metricValUnit}>{housingStandard.unit}</Text>
                        </View>
                        <Text style={styles.metricValLabel}>{t('farmer.livestock.detail.housing.standardLabel')}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              )}

              {/* BR-140 verdict for the current (newest startDate) housing record: the server's
                  meetsIndoorSpaceStandard, one standard for every species. Shown only once the list
                  (and with it the standard) has loaded; a 503 shows the section error above instead. */}
              {housingList.state !== 'ready' || housingStandard === null ? null : (() => {
                switch (housingStandard.verdict) {
                  case 'meets':
                    return (
                      <View style={styles.welfareNoticeCard} testID="animalDetail.housing.verdict.meets">
                        <ShieldCheckBadgeIcon size={20} />
                        <View style={styles.welfareNoticeCol}>
                          <Text style={styles.welfareNoticeTitle}>{t('farmer.livestock.detail.housing.verdict.meetsTitle')}</Text>
                          <Text style={styles.welfareNoticeSubtitle}>
                            {t('farmer.livestock.detail.housing.verdict.meetsBody', {
                              value: housingStandard.value,
                              unit: housingStandard.unit,
                            })}
                          </Text>
                        </View>
                      </View>
                    );
                  case 'below':
                    return (
                      <View style={styles.housingWarningCard} testID="animalDetail.housing.verdict.below">
                        <ProhibitedCircleIcon size={20} color={P.twOrange700} />
                        <View style={styles.welfareNoticeCol}>
                          <Text style={styles.housingWarningTitle}>{t('farmer.livestock.detail.housing.verdict.belowTitle')}</Text>
                          <Text style={styles.housingWarningSubtitle}>
                            {t('farmer.livestock.detail.housing.verdict.belowBody', {
                              value: housingStandard.value,
                              unit: housingStandard.unit,
                            })}
                          </Text>
                        </View>
                      </View>
                    );
                  default:
                    return (
                      <View style={styles.housingNeutralCard} testID="animalDetail.housing.verdict.notRecorded">
                        <View style={styles.welfareNoticeCol}>
                          <Text style={styles.housingNeutralTitle}>
                            {t('farmer.livestock.detail.housing.verdict.notRecordedTitle')}
                          </Text>
                          <Text style={styles.welfareNoticeSubtitle}>
                            {t('farmer.livestock.detail.housing.verdict.notRecordedBody', {
                              value: housingStandard.value,
                              unit: housingStandard.unit,
                            })}
                          </Text>
                        </View>
                      </View>
                    );
                }
              })()}

              {/* Section: HYGIENE LOG — "+ Add" opens the hygiene-log modal */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeaderTitle}>{t('farmer.livestock.detail.housing.hygieneLog')}</Text>
                <TouchableOpacity
                  onPress={openHygieneModal}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel={t('farmer.livestock.detail.housing.addHygiene')}
                  testID="animalDetail.housing.addHygiene"
                >
                  <Text style={styles.sectionHeaderAddText}>{t('farmer.livestock.detail.common.addInline')}</Text>
                </TouchableOpacity>
              </View>
              {hygieneList.state !== 'ready' ? (
                <SectionState list={hygieneList} testID="animalDetail.housing.hygiene" />
              ) : (
                <View style={styles.whiteCardContainer}>
                  {hygieneList.items.length === 0 ? (
                    <Text style={styles.itemSubtitle} testID="animalDetail.housing.noHygiene">
                      {t('farmer.livestock.detail.housing.noHygiene')}
                    </Text>
                  ) : (
                    hygieneList.items.map((log, idx) => (
                      <React.Fragment key={log.id}>
                        {idx > 0 && <View style={styles.dividerLine} />}
                        <View style={styles.itemRow} testID={`animalDetail.housing.hygiene:${log.id}`}>
                          <View style={styles.greenIconSquare}>
                            <BroomCleaningIcon size={17} color={colors.brandGreen} />
                          </View>
                          <View style={styles.itemMainCol}>
                            <Text style={styles.itemTitle}>{log.activity}</Text>
                            <Text style={styles.itemSubtitle}>{formatShortDate(log.performedOn)}</Text>
                          </View>
                        </View>
                      </React.Fragment>
                    ))
                  )}
                </View>
              )}
              <ShowMoreRow list={hygieneList} testID="animalDetail.housing.showMore" />
            </View>
          )}
        </ScrollView>
      </View>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ADD HEALTH RECORD MODAL                                            */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={isAddHealthModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsAddHealthModalVisible(false)}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <StatusBar barStyle="dark-content" backgroundColor={P.white} />

          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalBackBtn}
              onPress={() => setIsAddHealthModalVisible(false)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.livestock.detail.a11y.back')}
            >
              <GreenBackArrowIcon size={24} color={P.deepGreen} />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>{t('farmer.livestock.detail.health.addRecord')}</Text>
          </View>

          <ScrollView
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Animal Summary Card */}
            <View style={styles.modalAnimalCard}>
              <View style={styles.modalAvatarCircle}>
                <PawPrintIcon size={22} color={P.twAmber800} />
                <View style={styles.modalAvatarDot} />
              </View>
              <View style={styles.modalAnimalInfoCol}>
                <Text style={styles.modalAnimalName}>{displayName}</Text>
                <View style={styles.modalAnimalSubtitleRow}>
                  <Text style={styles.modalAnimalSubtitle}>
                    {displaySpecies} · {displayBreed} ·{' '}
                  </Text>
                  <GenderSymbolIcon size={12} color={P.twGray500} />
                  <Text style={styles.modalAnimalSubtitle}> · {displayAge}</Text>
                </View>
              </View>
              <View style={styles.modalStatusBadgePill}>
                <Text style={styles.modalStatusBadgeText}>{displayStatusBadge}</Text>
              </View>
            </View>

            {/* Record type */}
            <View style={styles.formGroup} accessibilityLabel={t('farmer.livestock.detail.healthForm.recordType')}>
              <Text style={styles.formLabel}>
                {t('farmer.livestock.detail.healthForm.recordType')} <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.formDropdownTrigger}
                onPress={() => setIsRecordTypeDropdownOpen(!isRecordTypeDropdownOpen)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={t('farmer.livestock.detail.a11y.selectRecordType')}
              >
                <Text style={styles.formDropdownSelectedText}>{optionLabel(HEALTH_RECORD_TYPE_OPTIONS, recordType)}</Text>
                <FormChevronDownIcon size={18} color={P.twGray500} />
              </TouchableOpacity>
              {isRecordTypeDropdownOpen && (
                <View style={styles.formDropdownMenu}>
                  {optionValues(HEALTH_RECORD_TYPE_OPTIONS).map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.formDropdownItem,
                        recordType === option && styles.formDropdownItemActive,
                      ]}
                      onPress={() => {
                        setRecordType(option);
                        setIsRecordTypeDropdownOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.formDropdownItemText,
                          recordType === option && styles.formDropdownItemTextActive,
                        ]}
                      >
                        {optionLabel(HEALTH_RECORD_TYPE_OPTIONS, option)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* ══════════════════════════════════════════════════ */}
            {/* CHECKUP FIELDS                                      */}
            {/* ══════════════════════════════════════════════════ */}
            {recordType === 'CHECKUP' && (
              <>
                {/* Checkup date + Time (side by side) */}
                <View style={styles.formRowHalf}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>{t('farmer.livestock.detail.healthForm.checkupDate')}</Text>
                    <View style={styles.formInputContainer}>
                      <FormCalendarIcon size={18} color={P.twGray500} />
                      <TextInput
                        style={styles.formInputWithIcon}
                        value={recordDate}
                        onChangeText={setRecordDate}
                        placeholder={t('farmer.livestock.detail.common.datePlaceholder')}
                        placeholderTextColor={P.twGray400}
                      />
                    </View>
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.time')}</Text>
                    <View style={styles.formInputContainer}>
                      <TextInput
                        style={[styles.formInputWithIcon, { flex: 1 }]}
                        value={recordTime}
                        onChangeText={setRecordTime}
                        placeholder={t('farmer.livestock.detail.common.timePlaceholder')}
                        placeholderTextColor={P.twGray400}
                      />
                      <FormClockIcon size={18} color={P.twGray500} />
                    </View>
                  </View>
                </View>

                {/* Checkup Type dropdown */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    {t('farmer.livestock.detail.field.checkupType')} <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.formDropdownTrigger}
                    onPress={() => setIsCheckupTypeDropdownOpen(!isCheckupTypeDropdownOpen)}
                    activeOpacity={0.8}
                  >
                    <Text style={checkupType ? styles.formDropdownSelectedText : styles.formDropdownPlaceholder}>
                      {optionLabel(CHECKUP_TYPE_OPTIONS, checkupType) || t('farmer.livestock.detail.common.selectType')}
                    </Text>
                    <FormChevronDownIcon size={18} color={P.twGray500} />
                  </TouchableOpacity>
                  {isCheckupTypeDropdownOpen && (
                    <View style={styles.formDropdownMenu}>
                      {optionValues(CHECKUP_TYPE_OPTIONS).map((option) => (
                        <TouchableOpacity
                          key={option}
                          style={[
                            styles.formDropdownItem,
                            checkupType === option && styles.formDropdownItemActive,
                          ]}
                          onPress={() => {
                            setCheckupType(option);
                            setIsCheckupTypeDropdownOpen(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.formDropdownItemText,
                              checkupType === option && styles.formDropdownItemTextActive,
                            ]}
                          >
                            {optionLabel(CHECKUP_TYPE_OPTIONS, option)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Veterinarian name */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    {t('farmer.livestock.detail.healthForm.veterinarianName')} <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.formTextInput}
                    value={veterinarian}
                    onChangeText={setVeterinarian}
                    placeholder=""
                    placeholderTextColor={P.twGray400}
                  />
                </View>

                {/* Veterinary clinic */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    {t('farmer.livestock.detail.healthForm.veterinaryClinic')} <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.formTextInput}
                    value={vetClinic}
                    onChangeText={setVetClinic}
                    placeholder=""
                    placeholderTextColor={P.twGray400}
                  />
                </View>

                {/* Body temperature + Body Weight (side by side) */}
                <View style={styles.formRowHalf}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.bodyTemperature')}</Text>
                    <View style={styles.doseRow}>
                      <View style={[styles.doseValueContainer, { flex: 1.2 }]}>
                        <TextInput
                          style={styles.formTextInput}
                          value={bodyTemp}
                          onChangeText={setBodyTemp}
                          keyboardType="decimal-pad"
                          placeholder="0"
                          placeholderTextColor={P.twGray400}
                        />
                      </View>
                      <TouchableOpacity
                        style={[styles.doseUnitContainer, { flex: 1 }]}
                        onPress={() => setIsTempUnitDropdownOpen(!isTempUnitDropdownOpen)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.formDropdownSelectedText}>{optionLabel(TEMPERATURE_UNIT_OPTIONS, bodyTempUnit)}</Text>
                        <FormChevronDownIcon size={14} color={P.twGray500} />
                      </TouchableOpacity>
                    </View>
                    {isTempUnitDropdownOpen && (
                      <View style={styles.formDropdownMenu}>
                        {optionValues(TEMPERATURE_UNIT_OPTIONS).map((u) => (
                          <TouchableOpacity
                            key={u}
                            style={[styles.formDropdownItem, bodyTempUnit === u && styles.formDropdownItemActive]}
                            onPress={() => { setBodyTempUnit(u); setIsTempUnitDropdownOpen(false); }}
                          >
                            <Text style={[styles.formDropdownItemText, bodyTempUnit === u && styles.formDropdownItemTextActive]}>{optionLabel(TEMPERATURE_UNIT_OPTIONS, u)}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.bodyWeight')}</Text>
                    <View style={styles.doseRow}>
                      <View style={[styles.doseValueContainer, { flex: 1.2 }]}>
                        <TextInput
                          style={styles.formTextInput}
                          value={bodyWeight}
                          onChangeText={setBodyWeight}
                          keyboardType="decimal-pad"
                          placeholder="0"
                          placeholderTextColor={P.twGray400}
                        />
                      </View>
                      <TouchableOpacity
                        style={[styles.doseUnitContainer, { flex: 1 }]}
                        onPress={() => setIsWeightUnitDropdownOpen(!isWeightUnitDropdownOpen)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.formDropdownSelectedText}>{optionLabel(WEIGHT_UNIT_OPTIONS, bodyWeightUnit)}</Text>
                        <FormChevronDownIcon size={14} color={P.twGray500} />
                      </TouchableOpacity>
                    </View>
                    {isWeightUnitDropdownOpen && (
                      <View style={styles.formDropdownMenu}>
                        {optionValues(WEIGHT_UNIT_OPTIONS).map((u) => (
                          <TouchableOpacity
                            key={u}
                            style={[styles.formDropdownItem, bodyWeightUnit === u && styles.formDropdownItemActive]}
                            onPress={() => { setBodyWeightUnit(u); setIsWeightUnitDropdownOpen(false); }}
                          >
                            <Text style={[styles.formDropdownItemText, bodyWeightUnit === u && styles.formDropdownItemTextActive]}>{optionLabel(WEIGHT_UNIT_OPTIONS, u)}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>

                {/* General health status + Appetite (side by side) */}
                <View style={styles.formRowHalf}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>{t('farmer.livestock.detail.healthForm.generalHealthStatus')}</Text>
                    <TouchableOpacity
                      style={styles.formDropdownTrigger}
                      onPress={() => setIsHealthStatusDropdownOpen(!isHealthStatusDropdownOpen)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.formDropdownSelectedText}>{optionLabel(HEALTH_STATUS_OPTIONS, generalHealthStatus)}</Text>
                      <FormChevronDownIcon size={16} color={P.twGray500} />
                    </TouchableOpacity>
                    {isHealthStatusDropdownOpen && (
                      <View style={styles.formDropdownMenu}>
                        {optionValues(HEALTH_STATUS_OPTIONS).map((opt) => (
                          <TouchableOpacity
                            key={opt}
                            style={[styles.formDropdownItem, generalHealthStatus === opt && styles.formDropdownItemActive]}
                            onPress={() => { setGeneralHealthStatus(opt); setIsHealthStatusDropdownOpen(false); }}
                          >
                            <Text style={[styles.formDropdownItemText, generalHealthStatus === opt && styles.formDropdownItemTextActive]}>{optionLabel(HEALTH_STATUS_OPTIONS, opt)}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>{t('farmer.livestock.detail.healthForm.appetite')}</Text>
                    <TouchableOpacity
                      style={styles.formDropdownTrigger}
                      onPress={() => setIsAppetiteDropdownOpen(!isAppetiteDropdownOpen)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.formDropdownSelectedText}>{optionLabel(APPETITE_OPTIONS, appetite)}</Text>
                      <FormChevronDownIcon size={16} color={P.twGray500} />
                    </TouchableOpacity>
                    {isAppetiteDropdownOpen && (
                      <View style={styles.formDropdownMenu}>
                        {optionValues(APPETITE_OPTIONS).map((opt) => (
                          <TouchableOpacity
                            key={opt}
                            style={[styles.formDropdownItem, appetite === opt && styles.formDropdownItemActive]}
                            onPress={() => { setAppetite(opt); setIsAppetiteDropdownOpen(false); }}
                          >
                            <Text style={[styles.formDropdownItemText, appetite === opt && styles.formDropdownItemTextActive]}>{optionLabel(APPETITE_OPTIONS, opt)}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>

                {/* Active level */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.activityLevel')}</Text>
                  <TextInput
                    style={styles.formTextInput}
                    value={activeLevel}
                    onChangeText={setActiveLevel}
                    placeholder=""
                    placeholderTextColor={P.twGray400}
                  />
                </View>

                {/* Symptoms / Observations */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t('farmer.livestock.detail.healthForm.symptomsObservations')}</Text>
                  <TextInput
                    style={styles.formNotesInput}
                    value={symptoms}
                    onChangeText={setSymptoms}
                    multiline
                    placeholder=""
                    placeholderTextColor={P.twGray400}
                    textAlignVertical="top"
                  />
                </View>

                {/* Examination findings */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t('farmer.livestock.detail.healthForm.examinationFindings')}</Text>
                  <TextInput
                    style={styles.formNotesInput}
                    value={examinationFindings}
                    onChangeText={setExaminationFindings}
                    multiline
                    placeholder=""
                    placeholderTextColor={P.twGray400}
                    textAlignVertical="top"
                  />
                </View>

                {/* Diagnosis / suspected condition */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t('farmer.livestock.detail.healthForm.diagnosis')}</Text>
                  <TextInput
                    style={styles.formNotesInput}
                    value={diagnosis}
                    onChangeText={setDiagnosis}
                    multiline
                    placeholder=""
                    placeholderTextColor={P.twGray400}
                    textAlignVertical="top"
                  />
                </View>

                {/* Treatment required + Follow-up required (side by side) */}
                <View style={styles.formRowHalf}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>{t('farmer.livestock.detail.healthForm.treatmentRequired')}</Text>
                    <View style={styles.yesNoRow}>
                      <TouchableOpacity
                        style={[styles.yesNoPill, treatmentRequired === 'YES' && styles.yesNoPillActive]}
                        onPress={() => setTreatmentRequired('YES')}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.yesNoPillText, treatmentRequired === 'YES' && styles.yesNoPillTextActive]}>{t('farmer.livestock.detail.option.yesNo.YES')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.yesNoPill, treatmentRequired === 'NO' && styles.yesNoPillActive]}
                        onPress={() => setTreatmentRequired('NO')}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.yesNoPillText, treatmentRequired === 'NO' && styles.yesNoPillTextActive]}>{t('farmer.livestock.detail.option.yesNo.NO')}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>{t('farmer.livestock.detail.healthForm.followUpRequired')}</Text>
                    <View style={styles.yesNoRow}>
                      <TouchableOpacity
                        style={[styles.yesNoPill, followUpRequired === 'YES' && styles.yesNoPillActive]}
                        onPress={() => setFollowUpRequired('YES')}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.yesNoPillText, followUpRequired === 'YES' && styles.yesNoPillTextActive]}>{t('farmer.livestock.detail.option.yesNo.YES')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.yesNoPill, followUpRequired === 'NO' && styles.yesNoPillActive]}
                        onPress={() => setFollowUpRequired('NO')}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.yesNoPillText, followUpRequired === 'NO' && styles.yesNoPillTextActive]}>{t('farmer.livestock.detail.option.yesNo.NO')}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Follow-up date */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    {t('farmer.livestock.detail.field.followUpDate')} <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <View style={styles.formInputContainer}>
                    <FormCalendarIcon size={18} color={P.twGray500} />
                    <TextInput
                      style={styles.formInputWithIcon}
                      value={followUpDate}
                      onChangeText={setFollowUpDate}
                      placeholder={t('farmer.livestock.detail.common.datePlaceholder')}
                      placeholderTextColor={P.twGray400}
                    />
                  </View>
                </View>

                {/* Recommended actions */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.recommendedActions')}</Text>
                  <TextInput
                    style={styles.formNotesInput}
                    value={recommendedActions}
                    onChangeText={setRecommendedActions}
                    multiline
                    placeholder=""
                    placeholderTextColor={P.twGray400}
                    textAlignVertical="top"
                  />
                </View>
              </>
            )}

            {/* ══════════════════════════════════════════════════ */}
            {/* DEWORMING FIELDS                                    */}
            {/* ══════════════════════════════════════════════════ */}
            {recordType === 'DEWORMING' && (
              <>
                {/* Deworming date * */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    {t('farmer.livestock.detail.healthForm.dewormingDate')} <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <View style={styles.formInputContainer}>
                    <FormCalendarIcon size={18} color={P.twGray500} />
                    <TextInput
                      style={styles.formInputWithIcon}
                      value={dewormDate}
                      onChangeText={setDewormDate}
                      placeholder={t('farmer.livestock.detail.common.datePlaceholder')}
                      placeholderTextColor={P.twGray400}
                    />
                  </View>
                </View>

                {/* Deworming product name * */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    {t('farmer.livestock.detail.healthForm.dewormingProductName')} <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.formTextInput}
                    value={dewormProductName}
                    onChangeText={setDewormProductName}
                    placeholder=""
                    placeholderTextColor={P.twGray400}
                  />
                </View>

                {/* Active ingredient */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.activeIngredient')}</Text>
                  <TextInput
                    style={styles.formTextInput}
                    value={activeIngredient}
                    onChangeText={setActiveIngredient}
                    placeholder=""
                    placeholderTextColor={P.twGray400}
                  />
                </View>

                {/* Target parasite (Chip dropdown) */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t('farmer.livestock.detail.healthForm.targetParasite')}</Text>
                  <TouchableOpacity
                    style={styles.chipDropdownTrigger}
                    onPress={() => setIsDewormTargetDropdownOpen(!isDewormTargetDropdownOpen)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.chipWrapRow}>
                      {targetParasite ? (
                        <View style={styles.tagChip}>
                          <Text style={styles.tagChipText}>{optionLabel(TARGET_PARASITE_OPTIONS, targetParasite)}</Text>
                          <TouchableOpacity
                            onPress={() => setTargetParasite('')}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            style={styles.tagChipClose}
                          >
                            <FormCloseIcon size={12} color={P.twGray700} />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <Text style={styles.formDropdownPlaceholder}>{t('farmer.livestock.detail.healthForm.selectParasite')}</Text>
                      )}
                    </View>
                    <FormChevronDownIcon size={18} color={P.twGray500} />
                  </TouchableOpacity>
                  {isDewormTargetDropdownOpen && (
                    <View style={styles.formDropdownMenu}>
                      {optionValues(TARGET_PARASITE_OPTIONS).map((p) => (
                        <TouchableOpacity
                          key={p}
                          style={[styles.formDropdownItem, targetParasite === p && styles.formDropdownItemActive]}
                          onPress={() => {
                            setTargetParasite(p);
                            setIsDewormTargetDropdownOpen(false);
                          }}
                        >
                          <Text style={[styles.formDropdownItemText, targetParasite === p && styles.formDropdownItemTextActive]}>
                            {optionLabel(TARGET_PARASITE_OPTIONS, p)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Dose + Administration route (side-by-side) */}
                <View style={styles.formRowHalf}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.dose')}</Text>
                    <View style={styles.doseRow}>
                      <View style={[styles.doseValueContainer, { flex: 1.2 }]}>
                        <TextInput
                          style={styles.formTextInput}
                          value={dewormDose}
                          onChangeText={setDewormDose}
                          keyboardType="decimal-pad"
                          placeholder="0"
                          placeholderTextColor={P.twGray400}
                        />
                      </View>
                      <TouchableOpacity
                        style={[styles.doseUnitContainer, { flex: 1 }]}
                        onPress={() => setIsDewormDoseUnitDropdownOpen(!isDewormDoseUnitDropdownOpen)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.formDropdownSelectedText}>{optionLabel(VACCINE_DOSE_UNIT_OPTIONS, dewormDoseUnit)}</Text>
                        <FormChevronDownIcon size={16} color={P.twGray500} />
                      </TouchableOpacity>
                    </View>
                    {isDewormDoseUnitDropdownOpen && (
                      <View style={styles.formDropdownMenu}>
                        {optionValues(VACCINE_DOSE_UNIT_OPTIONS).map((u) => (
                          <TouchableOpacity
                            key={u}
                            style={[styles.formDropdownItem, dewormDoseUnit === u && styles.formDropdownItemActive]}
                            onPress={() => {
                              setDewormDoseUnit(u);
                              setIsDewormDoseUnitDropdownOpen(false);
                            }}
                          >
                            <Text style={[styles.formDropdownItemText, dewormDoseUnit === u && styles.formDropdownItemTextActive]}>
                              {optionLabel(VACCINE_DOSE_UNIT_OPTIONS, u)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>

                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>{t('farmer.livestock.detail.healthForm.administrationRoute')}</Text>
                    <TouchableOpacity
                      style={styles.formDropdownTrigger}
                      onPress={() => setIsDewormAdminRouteDropdownOpen(!isDewormAdminRouteDropdownOpen)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.formDropdownSelectedText}>{optionLabel(DEWORMING_ROUTE_OPTIONS, dewormAdminRoute)}</Text>
                      <FormChevronDownIcon size={16} color={P.twGray500} />
                    </TouchableOpacity>
                    {isDewormAdminRouteDropdownOpen && (
                      <View style={styles.formDropdownMenu}>
                        {optionValues(DEWORMING_ROUTE_OPTIONS).map((r) => (
                          <TouchableOpacity
                            key={r}
                            style={[styles.formDropdownItem, dewormAdminRoute === r && styles.formDropdownItemActive]}
                            onPress={() => {
                              setDewormAdminRoute(r);
                              setIsDewormAdminRouteDropdownOpen(false);
                            }}
                          >
                            <Text style={[styles.formDropdownItemText, dewormAdminRoute === r && styles.formDropdownItemTextActive]}>
                              {optionLabel(DEWORMING_ROUTE_OPTIONS, r)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>

                {/* Animal weight + Batch / Lot number (side-by-side) */}
                <View style={styles.formRowHalf}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.animalWeight')}</Text>
                    <View style={styles.doseRow}>
                      <View style={[styles.doseValueContainer, { flex: 1.2 }]}>
                        <TextInput
                          style={styles.formTextInput}
                          value={dewormAnimalWeight}
                          onChangeText={setDewormAnimalWeight}
                          keyboardType="decimal-pad"
                          placeholder="0"
                          placeholderTextColor={P.twGray400}
                        />
                      </View>
                      <TouchableOpacity
                        style={[styles.doseUnitContainer, { flex: 1 }]}
                        onPress={() => setIsDewormWeightUnitDropdownOpen(!isDewormWeightUnitDropdownOpen)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.formDropdownSelectedText}>{optionLabel(WEIGHT_UNIT_OPTIONS, dewormWeightUnit)}</Text>
                        <FormChevronDownIcon size={16} color={P.twGray500} />
                      </TouchableOpacity>
                    </View>
                    {isDewormWeightUnitDropdownOpen && (
                      <View style={styles.formDropdownMenu}>
                        {optionValues(WEIGHT_UNIT_OPTIONS).map((u) => (
                          <TouchableOpacity
                            key={u}
                            style={[styles.formDropdownItem, dewormWeightUnit === u && styles.formDropdownItemActive]}
                            onPress={() => {
                              setDewormWeightUnit(u);
                              setIsDewormWeightUnitDropdownOpen(false);
                            }}
                          >
                            <Text style={[styles.formDropdownItemText, dewormWeightUnit === u && styles.formDropdownItemTextActive]}>
                              {optionLabel(WEIGHT_UNIT_OPTIONS, u)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>

                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.batchNumber')}</Text>
                    <TextInput
                      style={styles.formTextInput}
                      value={dewormBatchNumber}
                      onChangeText={setDewormBatchNumber}
                      placeholder=""
                      placeholderTextColor={P.twGray400}
                    />
                  </View>
                </View>

                {/* Expiry date + Administered by (side-by-side) */}
                <View style={styles.formRowHalf}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.expiryDate')}</Text>
                    <View style={styles.formInputContainer}>
                      <FormCalendarIcon size={18} color={P.twGray500} />
                      <TextInput
                        style={styles.formInputWithIcon}
                        value={dewormExpiryDate}
                        onChangeText={setDewormExpiryDate}
                        placeholder={t('farmer.livestock.detail.common.datePlaceholder')}
                        placeholderTextColor={P.twGray400}
                      />
                    </View>
                  </View>

                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.administeredBy')}</Text>
                    <TextInput
                      style={styles.formTextInput}
                      value={dewormAdministeredBy}
                      onChangeText={setDewormAdministeredBy}
                      placeholder=""
                      placeholderTextColor={P.twGray400}
                    />
                  </View>
                </View>

                {/* Next due date + Observed reaction (side-by-side) */}
                <View style={styles.formRowHalf}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.nextDueDate')}</Text>
                    <View style={styles.formInputContainer}>
                      <FormCalendarIcon size={18} color={P.twGray500} />
                      <TextInput
                        style={styles.formInputWithIcon}
                        value={dewormNextDueDate}
                        onChangeText={setDewormNextDueDate}
                        placeholder={t('farmer.livestock.detail.common.datePlaceholder')}
                        placeholderTextColor={P.twGray400}
                      />
                    </View>
                  </View>

                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>{t('farmer.livestock.detail.healthForm.observedReaction')}</Text>
                    <TouchableOpacity
                      style={styles.formDropdownTrigger}
                      onPress={() => setIsDewormReactionDropdownOpen(!isDewormReactionDropdownOpen)}
                      activeOpacity={0.8}
                    >
                      <Text style={dewormObservedReaction ? styles.formDropdownSelectedText : styles.formDropdownPlaceholder}>
                        {optionLabel(OBSERVED_REACTION_OPTIONS, dewormObservedReaction) || t('farmer.livestock.detail.healthForm.selectReaction')}
                      </Text>
                      <FormChevronDownIcon size={16} color={P.twGray500} />
                    </TouchableOpacity>
                    {isDewormReactionDropdownOpen && (
                      <View style={styles.formDropdownMenu}>
                        {optionValues(OBSERVED_REACTION_OPTIONS).map((react) => (
                          <TouchableOpacity
                            key={react}
                            style={[styles.formDropdownItem, dewormObservedReaction === react && styles.formDropdownItemActive]}
                            onPress={() => {
                              setDewormObservedReaction(react);
                              setIsDewormReactionDropdownOpen(false);
                            }}
                          >
                            <Text style={[styles.formDropdownItemText, dewormObservedReaction === react && styles.formDropdownItemTextActive]}>
                              {optionLabel(OBSERVED_REACTION_OPTIONS, react)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>

                {/* Notes */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.notes')}</Text>
                  <TextInput
                    style={styles.formNotesInput}
                    value={dewormNotes}
                    onChangeText={setDewormNotes}
                    multiline
                    placeholder=""
                    placeholderTextColor={P.twGray400}
                    textAlignVertical="top"
                  />
                </View>
              </>
            )}

            {/* ══════════════════════════════════════════════════ */}
            {/* TREATMENT FIELDS                                    */}
            {/* ══════════════════════════════════════════════════ */}
            {recordType === 'TREATMENT' && (
              <>
                {/* ── Treatment Section 1: Treatment Information ── */}
                <View style={styles.sectionBanner}>
                  <BandaidCrossIcon size={16} color={P.twOrange600} />
                  <Text style={styles.sectionBannerText}>{t('farmer.livestock.detail.treatmentForm.sectionTreatment')}</Text>
                </View>

                {/* Treatment date + Treatment Type (side-by-side) */}
                <View style={styles.formRowHalf}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>{t('farmer.livestock.detail.treatmentForm.treatmentDate')}</Text>
                    <View style={styles.formInputContainer}>
                      <FormCalendarIcon size={18} color={P.twGray500} />
                      <TextInput
                        style={styles.formInputWithIcon}
                        value={treatmentDate}
                        onChangeText={setTreatmentDate}
                        testID="healthForm.treatmentDate"
                        placeholder={t('farmer.livestock.detail.common.datePlaceholder')}
                        placeholderTextColor={P.twGray400}
                      />
                    </View>
                  </View>

                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>{t('farmer.livestock.detail.treatmentForm.treatmentType')}</Text>
                    <TouchableOpacity
                      style={styles.formDropdownTrigger}
                      onPress={() => setIsTreatmentTypeDropdownOpen(!isTreatmentTypeDropdownOpen)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.formDropdownSelectedText}>{optionLabel(TREATMENT_TYPE_OPTIONS, treatmentType)}</Text>
                      <FormChevronDownIcon size={16} color={P.twGray500} />
                    </TouchableOpacity>
                    {isTreatmentTypeDropdownOpen && (
                      <View style={styles.formDropdownMenu}>
                        {optionValues(TREATMENT_TYPE_OPTIONS).map((value) => (
                          <TouchableOpacity
                            key={value}
                            style={[styles.formDropdownItem, treatmentType === value && styles.formDropdownItemActive]}
                            onPress={() => {
                              setTreatmentType(value);
                              setIsTreatmentTypeDropdownOpen(false);
                            }}
                          >
                            <Text style={[styles.formDropdownItemText, treatmentType === value && styles.formDropdownItemTextActive]}>
                              {optionLabel(TREATMENT_TYPE_OPTIONS, value)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>

                {/* Condition / diagnosis * */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    {t('farmer.livestock.detail.field.condition')} <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.formTextInput}
                    value={conditionDiagnosis}
                    onChangeText={setConditionDiagnosis}
                    testID="healthForm.condition"
                    placeholder=""
                    placeholderTextColor={P.twGray400}
                  />
                </View>

                {/* Symptoms */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.symptoms')}</Text>
                  <TextInput
                    style={styles.formTextInput}
                    value={treatmentSymptoms}
                    onChangeText={setTreatmentSymptoms}
                    placeholder=""
                    placeholderTextColor={P.twGray400}
                  />
                </View>

                {/* Treatment description * */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    {t('farmer.livestock.detail.field.description')} <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.formTextInput}
                    value={treatmentDescription}
                    onChangeText={setTreatmentDescription}
                    testID="healthForm.description"
                    placeholder=""
                    placeholderTextColor={P.twGray400}
                  />
                </View>

                {/* ── Treatment Section 2: Medication Details ── */}
                <View style={styles.sectionBanner}>
                  <MedicalCrossIcon size={16} color={colors.brandGreen} />
                  <Text style={styles.sectionBannerText}>{t('farmer.livestock.detail.treatmentForm.sectionMedication')}</Text>
                </View>

                {/* Medicine name + Dosage (side-by-side) */}
                <View style={styles.formRowHalf}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.medicineName')}</Text>
                    <TextInput
                      style={styles.formTextInput}
                      value={treatmentMedicineName}
                      onChangeText={setTreatmentMedicineName}
                      placeholder=""
                      placeholderTextColor={P.twGray400}
                    />
                  </View>

                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.dosage')}</Text>
                    <View style={styles.doseRow}>
                      <View style={[styles.doseValueContainer, { flex: 1.2 }]}>
                        <TextInput
                          style={styles.formTextInput}
                          value={treatmentDosage}
                          onChangeText={setTreatmentDosage}
                          keyboardType="decimal-pad"
                          placeholder="0"
                          placeholderTextColor={P.twGray400}
                        />
                      </View>
                      <TouchableOpacity
                        style={[styles.doseUnitContainer, { flex: 1 }]}
                        onPress={() => setIsTreatmentDosageUnitDropdownOpen(!isTreatmentDosageUnitDropdownOpen)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.formDropdownSelectedText}>{optionLabel(TREATMENT_DOSAGE_UNIT_OPTIONS, treatmentDosageUnit)}</Text>
                        <FormChevronDownIcon size={16} color={P.twGray500} />
                      </TouchableOpacity>
                    </View>
                    {isTreatmentDosageUnitDropdownOpen && (
                      <View style={styles.formDropdownMenu}>
                        {optionValues(TREATMENT_DOSAGE_UNIT_OPTIONS).map((u) => (
                          <TouchableOpacity
                            key={u}
                            style={[styles.formDropdownItem, treatmentDosageUnit === u && styles.formDropdownItemActive]}
                            onPress={() => {
                              setTreatmentDosageUnit(u);
                              setIsTreatmentDosageUnitDropdownOpen(false);
                            }}
                          >
                            <Text style={[styles.formDropdownItemText, treatmentDosageUnit === u && styles.formDropdownItemTextActive]}>
                              {optionLabel(TREATMENT_DOSAGE_UNIT_OPTIONS, u)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>

                {/* Administration route + Frequency (side-by-side) */}
                <View style={styles.formRowHalf}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>{t('farmer.livestock.detail.healthForm.administrationRoute')}</Text>
                    <TouchableOpacity
                      style={styles.formDropdownTrigger}
                      onPress={() => setIsTreatmentRouteDropdownOpen(!isTreatmentRouteDropdownOpen)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.formDropdownSelectedText}>{optionLabel(TREATMENT_ROUTE_OPTIONS, treatmentRoute)}</Text>
                      <FormChevronDownIcon size={16} color={P.twGray500} />
                    </TouchableOpacity>
                    {isTreatmentRouteDropdownOpen && (
                      <View style={styles.formDropdownMenu}>
                        {optionValues(TREATMENT_ROUTE_OPTIONS).map((r) => (
                          <TouchableOpacity
                            key={r}
                            style={[styles.formDropdownItem, treatmentRoute === r && styles.formDropdownItemActive]}
                            onPress={() => {
                              setTreatmentRoute(r);
                              setIsTreatmentRouteDropdownOpen(false);
                            }}
                          >
                            <Text style={[styles.formDropdownItemText, treatmentRoute === r && styles.formDropdownItemTextActive]}>
                              {optionLabel(TREATMENT_ROUTE_OPTIONS, r)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>

                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>{t('farmer.livestock.detail.treatmentForm.frequency')}</Text>
                    <TouchableOpacity
                      style={styles.formDropdownTrigger}
                      onPress={() => setIsTreatmentFrequencyDropdownOpen(!isTreatmentFrequencyDropdownOpen)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.formDropdownSelectedText}>{optionLabel(TREATMENT_FREQUENCY_OPTIONS, treatmentFrequency)}</Text>
                      <FormChevronDownIcon size={16} color={P.twGray500} />
                    </TouchableOpacity>
                    {isTreatmentFrequencyDropdownOpen && (
                      <View style={styles.formDropdownMenu}>
                        {optionValues(TREATMENT_FREQUENCY_OPTIONS).map((f) => (
                          <TouchableOpacity
                            key={f}
                            style={[styles.formDropdownItem, treatmentFrequency === f && styles.formDropdownItemActive]}
                            onPress={() => {
                              setTreatmentFrequency(f);
                              setIsTreatmentFrequencyDropdownOpen(false);
                            }}
                          >
                            <Text style={[styles.formDropdownItemText, treatmentFrequency === f && styles.formDropdownItemTextActive]}>
                              {optionLabel(TREATMENT_FREQUENCY_OPTIONS, f)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>

                {/* Start date + End date (side-by-side) */}
                <View style={styles.formRowHalf}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.startDate')}</Text>
                    <View style={styles.formInputContainer}>
                      <FormCalendarIcon size={18} color={P.twGray500} />
                      <TextInput
                        style={styles.formInputWithIcon}
                        value={treatmentStartDate}
                        onChangeText={setTreatmentStartDate}
                        placeholder={t('farmer.livestock.detail.common.datePlaceholder')}
                        placeholderTextColor={P.twGray400}
                      />
                    </View>
                  </View>

                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>{t('farmer.livestock.detail.treatmentForm.endDate')}</Text>
                    <View style={styles.formInputContainer}>
                      <FormCalendarIcon size={18} color={P.twGray500} />
                      <TextInput
                        style={styles.formInputWithIcon}
                        value={treatmentEndDate}
                        onChangeText={setTreatmentEndDate}
                        placeholder={t('farmer.livestock.detail.common.datePlaceholder')}
                        placeholderTextColor={P.twGray400}
                      />
                    </View>
                  </View>
                </View>

                {/* ── Treatment Section 3: withdrawal Information ── */}
                <View style={styles.sectionBanner}>
                  <BandaidCrossIcon size={16} color={P.twOrange600} />
                  <Text style={styles.sectionBannerText}>{t('farmer.livestock.detail.treatmentForm.sectionWithdrawal')}</Text>
                </View>

                {/* Milk withdrawal required? */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t('farmer.livestock.detail.treatmentForm.milkWithdrawalRequired')}</Text>
                  <View style={styles.radioRow}>
                    <TouchableOpacity
                      style={styles.radioOption}
                      onPress={() => setMilkWithdrawalRequired('YES')}
                      testID="healthForm.milkWithdrawalYes"
                      activeOpacity={0.7}
                    >
                      <View style={[styles.radioCircle, milkWithdrawalRequired === 'YES' && styles.radioCircleSelected]}>
                        {milkWithdrawalRequired === 'YES' && <View style={styles.radioInnerDot} />}
                      </View>
                      <Text style={styles.radioLabel}>{t('farmer.livestock.detail.option.yesNo.YES')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.radioOption}
                      onPress={() => setMilkWithdrawalRequired('NO')}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.radioCircle, milkWithdrawalRequired === 'NO' && styles.radioCircleSelected]}>
                        {milkWithdrawalRequired === 'NO' && <View style={styles.radioInnerDot} />}
                      </View>
                      <Text style={styles.radioLabel}>{t('farmer.livestock.detail.option.yesNo.NO')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Start date + End date (side-by-side) */}
                <View style={styles.formRowHalf}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.startDate')}</Text>
                    <View style={styles.formInputContainer}>
                      <FormCalendarIcon size={18} color={P.twGray500} />
                      <TextInput
                        style={styles.formInputWithIcon}
                        value={milkWithdrawalStartDate}
                        onChangeText={setMilkWithdrawalStartDate}
                        testID="healthForm.milkWithdrawalStart"
                        placeholder={t('farmer.livestock.detail.common.datePlaceholder')}
                        placeholderTextColor={P.twGray400}
                      />
                    </View>
                  </View>

                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>{t('farmer.livestock.detail.treatmentForm.endDate')}</Text>
                    <View style={styles.formInputContainer}>
                      <FormCalendarIcon size={18} color={P.twGray500} />
                      <TextInput
                        style={styles.formInputWithIcon}
                        value={milkWithdrawalEndDate}
                        onChangeText={setMilkWithdrawalEndDate}
                        testID="healthForm.milkWithdrawalEnd"
                        placeholder={t('farmer.livestock.detail.common.datePlaceholder')}
                        placeholderTextColor={P.twGray400}
                      />
                    </View>
                  </View>
                </View>

                {/* Reason */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t('farmer.livestock.detail.treatmentForm.reason')}</Text>
                  <TextInput
                    style={styles.formTextInput}
                    value={withdrawalReason}
                    onChangeText={setWithdrawalReason}
                    placeholder=""
                    placeholderTextColor={P.twGray400}
                  />
                </View>

                {/* Meat withdrawal required? */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t('farmer.livestock.detail.treatmentForm.meatWithdrawalRequired')}</Text>
                  <View style={styles.radioRow}>
                    <TouchableOpacity
                      style={styles.radioOption}
                      onPress={() => setMeatWithdrawalRequired('YES')}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.radioCircle, meatWithdrawalRequired === 'YES' && styles.radioCircleSelected]}>
                        {meatWithdrawalRequired === 'YES' && <View style={styles.radioInnerDot} />}
                      </View>
                      <Text style={styles.radioLabel}>{t('farmer.livestock.detail.option.yesNo.YES')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.radioOption}
                      onPress={() => setMeatWithdrawalRequired('NO')}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.radioCircle, meatWithdrawalRequired === 'NO' && styles.radioCircleSelected]}>
                        {meatWithdrawalRequired === 'NO' && <View style={styles.radioInnerDot} />}
                      </View>
                      <Text style={styles.radioLabel}>{t('farmer.livestock.detail.option.yesNo.NO')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {meatWithdrawalRequired === 'YES' && (
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>{t('farmer.livestock.detail.treatmentForm.meatWithdrawalEnd')}</Text>
                    <View style={styles.formInputContainer}>
                      <FormCalendarIcon size={18} color={P.twGray500} />
                      <TextInput
                        style={styles.formInputWithIcon}
                        value={meatWithdrawalEndDate}
                        onChangeText={setMeatWithdrawalEndDate}
                        testID="healthForm.meatWithdrawalEnd"
                        placeholder={t('farmer.livestock.detail.form.datePlaceholder')}
                        placeholderTextColor={P.twGray400}
                      />
                    </View>
                  </View>
                )}

                {/* ── Treatment Section 4: Additional Details ── */}
                <View style={styles.sectionBanner}>
                  <MedicalCrossIcon size={16} color={colors.brandGreen} />
                  <Text style={styles.sectionBannerText}>{t('farmer.livestock.detail.common.additionalDetails')}</Text>
                </View>

                {/* Prescribed by + Administered by (side-by-side) */}
                <View style={styles.formRowHalf}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.prescribedBy')}</Text>
                    <TextInput
                      style={styles.formTextInput}
                      value={prescribedBy}
                      onChangeText={setPrescribedBy}
                      placeholder=""
                      placeholderTextColor={P.twGray400}
                    />
                  </View>

                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.administeredBy')}</Text>
                    <TextInput
                      style={styles.formTextInput}
                      value={treatmentAdministeredBy}
                      onChangeText={setTreatmentAdministeredBy}
                      placeholder=""
                      placeholderTextColor={P.twGray400}
                    />
                  </View>
                </View>

                {/* Notes */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.notes')}</Text>
                  <TextInput
                    style={styles.formNotesInput}
                    value={treatmentNotes}
                    onChangeText={setTreatmentNotes}
                    multiline
                    placeholder=""
                    placeholderTextColor={P.twGray400}
                    textAlignVertical="top"
                  />
                </View>
              </>
            )}

            {/* ══════════════════════════════════════════════════ */}
            {/* VACCINATION FIELDS                                 */}
            {/* ══════════════════════════════════════════════════ */}
            {recordType === 'VACCINATION' && (
              <>
                {/* Record date * */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    {t('farmer.livestock.detail.field.recordDate')} <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <View style={styles.formInputContainer}>
                    <FormCalendarIcon size={18} color={P.twGray500} />
                    <TextInput
                      style={styles.formInputWithIcon}
                      value={recordDate}
                      onChangeText={setRecordDate}
                      testID="healthForm.vaccinationDate"
                      placeholder={t('farmer.livestock.detail.form.datePlaceholder')}
                      placeholderTextColor={P.twGray400}
                    />
                  </View>
                </View>

                {/* Veterinarian */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.veterinarian')}</Text>
                  <TextInput
                    style={styles.formTextInput}
                    value={veterinarian}
                    onChangeText={setVeterinarian}
                    placeholder=""
                    placeholderTextColor={P.twGray400}
                  />
                </View>

                {/* Vaccine name */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.vaccineName')}</Text>
                  <TextInput
                    style={styles.formTextInput}
                    value={vaccineName}
                    onChangeText={setVaccineName}
                    testID="healthForm.vaccineName"
                    placeholder=""
                    placeholderTextColor={P.twGray400}
                  />
                </View>

                {/* Dose */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.dose')}</Text>
                  <View style={styles.doseRow}>
                    <View style={styles.doseValueContainer}>
                      <TextInput
                        style={styles.formTextInput}
                        value={dose}
                        onChangeText={setDose}
                        keyboardType="decimal-pad"
                        placeholder="0"
                        placeholderTextColor={P.twGray400}
                      />
                    </View>
                    <TouchableOpacity
                      style={styles.doseUnitContainer}
                      onPress={() => setIsDoseUnitDropdownOpen(!isDoseUnitDropdownOpen)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.formDropdownSelectedText}>{optionLabel(VACCINE_DOSE_UNIT_OPTIONS, doseUnit)}</Text>
                      <FormChevronDownIcon size={18} color={P.twGray500} />
                    </TouchableOpacity>
                  </View>
                  {isDoseUnitDropdownOpen && (
                    <View style={styles.formDropdownMenu}>
                      {optionValues(VACCINE_DOSE_UNIT_OPTIONS).map((unit) => (
                        <TouchableOpacity
                          key={unit}
                          style={[styles.formDropdownItem, doseUnit === unit && styles.formDropdownItemActive]}
                          onPress={() => {
                            setDoseUnit(unit);
                            setIsDoseUnitDropdownOpen(false);
                          }}
                        >
                          <Text style={[styles.formDropdownItemText, doseUnit === unit && styles.formDropdownItemTextActive]}>
                            {optionLabel(VACCINE_DOSE_UNIT_OPTIONS, unit)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Administration route */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t('farmer.livestock.detail.healthForm.administrationRoute')}</Text>
                  <TouchableOpacity
                    style={styles.formDropdownTrigger}
                    onPress={() => setIsAdminRouteDropdownOpen(!isAdminRouteDropdownOpen)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.formDropdownSelectedText}>{optionLabel(VACCINATION_ROUTE_OPTIONS, adminRoute)}</Text>
                    <FormChevronDownIcon size={18} color={P.twGray500} />
                  </TouchableOpacity>
                  {isAdminRouteDropdownOpen && (
                    <View style={styles.formDropdownMenu}>
                      {optionValues(VACCINATION_ROUTE_OPTIONS).map((route) => (
                        <TouchableOpacity
                          key={route}
                          style={[styles.formDropdownItem, adminRoute === route && styles.formDropdownItemActive]}
                          onPress={() => {
                            setAdminRoute(route);
                            setIsAdminRouteDropdownOpen(false);
                          }}
                        >
                          <Text style={[styles.formDropdownItemText, adminRoute === route && styles.formDropdownItemTextActive]}>
                            {optionLabel(VACCINATION_ROUTE_OPTIONS, route)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Batch / Lot number */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.batchNumber')}</Text>
                  <TextInput
                    style={styles.formTextInput}
                    value={batchNumber}
                    onChangeText={setBatchNumber}
                    placeholder=""
                    placeholderTextColor={P.twGray400}
                  />
                </View>

                {/* Next vaccination date */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t('farmer.livestock.detail.healthForm.nextVaccinationDate')}</Text>
                  <View style={styles.formInputContainer}>
                    <FormCalendarIcon size={18} color={P.twGray500} />
                    <TextInput
                      style={styles.formInputWithIcon}
                      value={nextVaccinationDate}
                      onChangeText={setNextVaccinationDate}
                      testID="healthForm.nextVaccinationDate"
                      placeholder={t('farmer.livestock.detail.form.datePlaceholder')}
                      placeholderTextColor={P.twGray400}
                    />
                  </View>
                </View>

                {/* Notes */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.notes')}</Text>
                  <TextInput
                    style={styles.formNotesInput}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    placeholder=""
                    placeholderTextColor={P.twGray400}
                    textAlignVertical="top"
                  />
                </View>
              </>
            )}

            {/* ══════════════════════════════════════════════════ */}
            {/* ATTACHMENT SECTION (Shared across all record types)*/}
            {/* ══════════════════════════════════════════════════ */}
            {/* Attachment (optional) */}
            <View style={styles.formGroup} accessibilityLabel={t('farmer.livestock.detail.attachment.title')}>
              <View style={styles.attachmentLabelRow}>
                <AttachmentPaperclipIcon size={16} color={P.twGray600} />
                <Text style={styles.formLabel}>{t('farmer.livestock.detail.attachment.title')}</Text>
              </View>
              <TouchableOpacity
                style={styles.attachmentAddBox}
                onPress={() => void handlePickAttachment(setAttachment, setHealthErrors)}
                testID="healthForm.attach"
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t('farmer.livestock.detail.attachment.add')}
              >
                <View style={styles.attachmentAddBoxInner}>
                  <View style={styles.attachmentAddCircleBtn}>
                    <FormPlusIcon size={18} color={colors.brandGreen} />
                  </View>
                  <View>
                    <Text style={styles.attachmentAddTitle}>{t('farmer.livestock.detail.attachment.add')}</Text>
                    <Text style={styles.attachmentAddSubtitle}>{t('farmer.livestock.detail.attachment.hint')}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {attachment && (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t('farmer.livestock.detail.attachment.label')}</Text>
                <View style={styles.attachmentCard}>
                  <View style={styles.attachmentLeft}>
                    <ReceiptDocIcon size={36} />
                    <View style={styles.attachmentMetaCol}>
                      <Text style={styles.attachmentFilename}>{attachment.name}</Text>
                      <Text style={styles.attachmentSize}>{attachmentSizeLabel(attachment)}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.attachmentRemoveBtn}
                    onPress={() => setAttachment(null)}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.livestock.detail.attachment.remove')}
                  >
                    <FormCloseIcon size={16} color={P.twGray600} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <FormErrors errors={healthErrors} testID="healthForm.errors" />

            {/* Form Bottom Action Buttons */}
            <View style={styles.modalActionButtonsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsAddHealthModalVisible(false)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={t('farmer.livestock.detail.common.cancel')}
              >
                <Text style={styles.cancelBtnText}>{t('farmer.livestock.detail.common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnBusy]}
                onPress={() => void handleSaveHealthRecord()}
                disabled={saving}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ disabled: saving, busy: saving }}
                accessibilityLabel={t('farmer.livestock.detail.common.save')}
                testID="healthForm.save"
              >
                <View style={styles.saveBtnRow}>
                  <FormCheckmarkIcon size={18} color={P.white} />
                  <Text style={styles.saveBtnText}>
                    {saving ? t('farmer.livestock.detail.common.saving') : t('farmer.livestock.detail.common.save')}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ADD FEED REFERENCE MODAL                                           */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={isAddFeedModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsAddFeedModalVisible(false)}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <StatusBar barStyle="dark-content" backgroundColor={P.white} />

          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalBackBtn}
              onPress={() => setIsAddFeedModalVisible(false)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.livestock.detail.a11y.back')}
            >
              <GreenBackArrowIcon size={24} color={P.deepGreen} />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>{t('farmer.livestock.detail.feed.addReference')}</Text>
          </View>

          <ScrollView
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Animal Summary Card */}
            <View style={styles.modalAnimalCard}>
              <View style={styles.modalAvatarCircle}>
                <PawPrintIcon size={22} color={P.twAmber800} />
                <View style={styles.modalAvatarDot} />
              </View>
              <View style={styles.modalAnimalInfoCol}>
                <Text style={styles.modalAnimalName}>{displayName}</Text>
                <View style={styles.modalAnimalSubtitleRow}>
                  <Text style={styles.modalAnimalSubtitle}>
                    {displaySpecies} · {displayBreed} ·{' '}
                  </Text>
                  <GenderSymbolIcon size={12} color={P.twGray500} />
                  <Text style={styles.modalAnimalSubtitle}> · {displayAge}</Text>
                </View>
              </View>
              <View style={styles.modalStatusBadgePill}>
                <Text style={styles.modalStatusBadgeText}>{displayStatusBadge}</Text>
              </View>
            </View>

            {/* Feed plan name */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.planName')}</Text>
              <TextInput
                style={styles.formTextInput}
                value={feedPlanName}
                onChangeText={setFeedPlanName}
                placeholder=""
                placeholderTextColor={P.twGray400}
              />
            </View>

            {/* Feed Type * (Dropdown) */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                {t('farmer.livestock.detail.field.feedType')} <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.formDropdownTrigger}
                onPress={() => setIsFeedTypeDropdownOpen(!isFeedTypeDropdownOpen)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={t('farmer.livestock.detail.a11y.selectFeedType')}
              >
                <Text style={styles.formDropdownSelectedText}>{optionLabel(FEED_TYPE_OPTIONS, feedType)}</Text>
                <FormChevronDownIcon size={18} color={P.twGray500} />
              </TouchableOpacity>
              {isFeedTypeDropdownOpen && (
                <View style={styles.formDropdownMenu}>
                  {optionValues(FEED_TYPE_OPTIONS).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.formDropdownItem,
                        feedType === type && styles.formDropdownItemActive,
                      ]}
                      onPress={() => {
                        setFeedType(type);
                        setIsFeedTypeDropdownOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.formDropdownItemText,
                          feedType === type && styles.formDropdownItemTextActive,
                        ]}
                      >
                        {optionLabel(FEED_TYPE_OPTIONS, type)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Source */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.feedSource')}</Text>
              <TextInput
                style={styles.formTextInput}
                value={feedSource}
                onChangeText={setFeedSource}
                placeholder=""
                placeholderTextColor={P.twGray400}
              />
            </View>

            {/* Daily grazing duration (Value + hours/day dropdown) */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.grazingDuration')}</Text>
              <View style={styles.doseRow}>
                <View style={[styles.doseValueContainer, { flex: 1.2 }]}>
                  <TextInput
                    style={styles.formTextInput}
                    value={dailyGrazingDuration}
                    onChangeText={setDailyGrazingDuration}
                    keyboardType="decimal-pad"
                    placeholder=""
                    placeholderTextColor={P.twGray400}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.doseUnitContainer, { flex: 1.2 }]}
                  onPress={() => setIsGrazingUnitDropdownOpen(!isGrazingUnitDropdownOpen)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.formDropdownSelectedText}>{optionLabel(GRAZING_UNIT_OPTIONS, dailyGrazingUnit)}</Text>
                  <FormChevronDownIcon size={16} color={P.twGray500} />
                </TouchableOpacity>
              </View>
              {isGrazingUnitDropdownOpen && (
                <View style={styles.formDropdownMenu}>
                  {optionValues(GRAZING_UNIT_OPTIONS).map((u) => (
                    <TouchableOpacity
                      key={u}
                      style={[styles.formDropdownItem, dailyGrazingUnit === u && styles.formDropdownItemActive]}
                      onPress={() => {
                        setDailyGrazingUnit(u);
                        setIsGrazingUnitDropdownOpen(false);
                      }}
                    >
                      <Text style={[styles.formDropdownItemText, dailyGrazingUnit === u && styles.formDropdownItemTextActive]}>
                        {optionLabel(GRAZING_UNIT_OPTIONS, u)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Water source * (Dropdown) */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                {t('farmer.livestock.detail.field.waterSource')} <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.formDropdownTrigger}
                onPress={() => setIsWaterSourceDropdownOpen(!isWaterSourceDropdownOpen)}
                testID="feedForm.waterSourceTrigger"
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={t('farmer.livestock.detail.a11y.selectWaterSource')}
              >
                <Text style={waterSource ? styles.formDropdownSelectedText : styles.formDropdownPlaceholder}>
                  {optionLabel(WATER_SOURCE_OPTIONS, waterSource) || t('farmer.livestock.detail.common.selectType')}
                </Text>
                <FormChevronDownIcon size={18} color={P.twGray500} />
              </TouchableOpacity>
              {isWaterSourceDropdownOpen && (
                <View style={styles.formDropdownMenu}>
                  {optionValues(WATER_SOURCE_OPTIONS).map((ws) => (
                    <TouchableOpacity
                      key={ws}
                      testID={`feedForm.waterSource:${ws}`}
                      style={[
                        styles.formDropdownItem,
                        waterSource === ws && styles.formDropdownItemActive,
                      ]}
                      onPress={() => {
                        setWaterSource(ws);
                        setIsWaterSourceDropdownOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.formDropdownItemText,
                          waterSource === ws && styles.formDropdownItemTextActive,
                        ]}
                      >
                        {optionLabel(WATER_SOURCE_OPTIONS, ws)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Start Time + End time (side-by-side) */}
            <View style={styles.formRowHalf}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.startTime')}</Text>
                <View style={styles.formInputContainer}>
                  <FormCalendarIcon size={18} color={P.twGray500} />
                  <TextInput
                    style={styles.formInputWithIcon}
                    value={feedStartTime}
                    onChangeText={setFeedStartTime}
                    placeholder=""
                    placeholderTextColor={P.twGray400}
                  />
                </View>
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.endTime')}</Text>
                <View style={styles.formInputContainer}>
                  <FormCalendarIcon size={18} color={P.twGray500} />
                  <TextInput
                    style={styles.formInputWithIcon}
                    value={feedEndTime}
                    onChangeText={setFeedEndTime}
                    placeholder=""
                    placeholderTextColor={P.twGray400}
                  />
                </View>
              </View>
            </View>

            {/* Daily feed items */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.feedItems')}</Text>
              <View style={styles.feedItemsContainer}>
                {feedItems.map((item, index) => (
                  <View key={item.id} style={styles.feedItemBlock}>
                    <TextInput
                      style={styles.feedItemNameText}
                      value={item.name}
                      onChangeText={(val) => handleUpdateFeedItemName(item.id, val)}
                      placeholder={t('farmer.livestock.detail.feed.itemNamePlaceholder')}
                      placeholderTextColor={P.twGray400}
                      testID={`feedForm.itemName:${index}`}
                    />
                    <View style={styles.feedItemRow}>
                      <TextInput
                        style={[styles.formTextInput, { flex: 1.5 }]}
                        value={item.amount}
                        onChangeText={(val) => handleUpdateFeedItemAmount(item.id, val)}
                        testID={`feedForm.itemAmount:${index}`}
                        keyboardType="decimal-pad"
                        placeholder=""
                        placeholderTextColor={P.twGray400}
                      />
                      <TouchableOpacity
                        style={[styles.doseUnitContainer, { flex: 1.2 }]}
                        onPress={() => handleToggleFeedItemUnit(item.id)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.formDropdownSelectedText}>{optionLabel(FEED_ITEM_UNIT_OPTIONS, item.unit)}</Text>
                        <FormChevronDownIcon size={16} color={P.twGray500} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.feedItemDeleteBtn}
                        onPress={() => handleRemoveFeedItem(item.id)}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={t('farmer.livestock.detail.a11y.deleteFeedItem', { n: index + 1 })}
                      >
                        <TrashIcon size={18} color={P.twRed500} />
                      </TouchableOpacity>
                    </View>
                    {item.isUnitOpen && (
                      <View style={styles.formDropdownMenu}>
                        {optionValues(FEED_ITEM_UNIT_OPTIONS).map((u) => (
                          <TouchableOpacity
                            key={u}
                            style={[styles.formDropdownItem, item.unit === u && styles.formDropdownItemActive]}
                            onPress={() => handleSelectFeedItemUnit(item.id, u)}
                          >
                            <Text style={[styles.formDropdownItemText, item.unit === u && styles.formDropdownItemTextActive]}>
                              {optionLabel(FEED_ITEM_UNIT_OPTIONS, u)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>

            {/* Notes */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.notes')}</Text>
              <TextInput
                style={styles.formNotesInput}
                value={feedNotes}
                onChangeText={setFeedNotes}
                multiline
                placeholder=""
                placeholderTextColor={P.twGray400}
                textAlignVertical="top"
              />
            </View>

            {/* Attachment Document */}
            <View style={styles.formGroup}>
              <View style={styles.attachmentLabelRow}>
                <AttachmentPaperclipIcon size={16} color={P.twGray600} />
                <Text style={styles.formLabel}>{t('farmer.livestock.detail.attachment.title')}</Text>
              </View>
              <TouchableOpacity
                style={styles.attachmentAddBox}
                onPress={() => void handlePickAttachment(setFeedAttachment, setFeedErrors)}
                testID="feedForm.attach"
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t('farmer.livestock.detail.attachment.add')}
              >
                <View style={styles.attachmentAddBoxInner}>
                  <View style={styles.attachmentAddCircleBtn}>
                    <FormPlusIcon size={18} color={colors.brandGreen} />
                  </View>
                  <View>
                    <Text style={styles.attachmentAddTitle}>{t('farmer.livestock.detail.attachment.add')}</Text>
                    <Text style={styles.attachmentAddSubtitle}>{t('farmer.livestock.detail.attachment.hint')}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {feedAttachment && (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t('farmer.livestock.detail.attachment.label')}</Text>
                <View style={styles.attachmentCard}>
                  <View style={styles.attachmentLeft}>
                    <ReceiptDocIcon size={36} />
                    <View style={styles.attachmentMetaCol}>
                      <Text style={styles.attachmentFilename}>{feedAttachment.name}</Text>
                      <Text style={styles.attachmentSize}>{attachmentSizeLabel(feedAttachment)}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.attachmentRemoveBtn}
                    onPress={() => setFeedAttachment(null)}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.livestock.detail.attachment.remove')}
                  >
                    <FormCloseIcon size={16} color={P.twGray600} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* + Add feed item button */}
            <TouchableOpacity
              style={styles.addFeedItemBtn}
              onPress={handleAddFeedItem}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.livestock.detail.feedForm.addItem')}
            >
              <PlusCircleOutlineIcon size={18} color={colors.brandGreen} />
              <Text style={styles.addFeedItemBtnText}>{t('farmer.livestock.detail.feedForm.addItem')}</Text>
            </TouchableOpacity>

            <FormErrors errors={feedErrors} testID="feedForm.errors" />

            {/* Form Bottom Action Buttons */}
            <View style={styles.modalActionButtonsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsAddFeedModalVisible(false)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={t('farmer.livestock.detail.common.cancel')}
              >
                <Text style={styles.cancelBtnText}>{t('farmer.livestock.detail.common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnBusy]}
                onPress={() => void handleSaveFeedReference()}
                disabled={saving}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ disabled: saving, busy: saving }}
                accessibilityLabel={t('farmer.livestock.detail.common.save')}
                testID="feedForm.save"
              >
                <View style={styles.saveBtnRow}>
                  <FormCheckmarkIcon size={18} color={P.white} />
                  <Text style={styles.saveBtnText}>
                    {saving ? t('farmer.livestock.detail.common.saving') : t('farmer.livestock.detail.common.save')}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 3: ADD BREEDING RECORD                                       */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={isAddBreedingModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsAddBreedingModalVisible(false)}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <StatusBar barStyle="dark-content" backgroundColor={P.white} />

          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalBackBtn}
              onPress={() => setIsAddBreedingModalVisible(false)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.livestock.detail.a11y.back')}
            >
              <GreenBackArrowIcon size={24} color={P.deepGreen} />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>{t('farmer.livestock.detail.breeding.addRecord')}</Text>
          </View>

          <ScrollView
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Animal Summary Card */}
            <View style={styles.modalAnimalCard}>
              <View style={styles.modalAvatarCircle}>
                <PawPrintIcon size={22} color={P.twAmber800} />
                <View style={styles.modalAvatarDot} />
              </View>
              <View style={styles.modalAnimalInfoCol}>
                <Text style={styles.modalAnimalName}>{displayName}</Text>
                <View style={styles.modalAnimalSubtitleRow}>
                  <Text style={styles.modalAnimalSubtitle}>
                    {displaySpecies} · {displayBreed} ·{' '}
                  </Text>
                  <GenderSymbolIcon size={12} color={P.twGray500} />
                  <Text style={styles.modalAnimalSubtitle}> · {displayAge}</Text>
                </View>
              </View>
              <View style={styles.modalStatusBadgePill}>
                <Text style={styles.modalStatusBadgeText}>{displayStatusBadge}</Text>
              </View>
            </View>

            {/* Record Type * (Dropdown) */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                {t('farmer.livestock.detail.breedingForm.recordType')} <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.formDropdownTrigger}
                onPress={() => setIsBreedingRecordTypeDropdownOpen(!isBreedingRecordTypeDropdownOpen)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={t('farmer.livestock.detail.a11y.selectRecordType')}
              >
                <Text style={styles.formDropdownSelectedText}>{optionLabel(BREEDING_RECORD_TYPE_OPTIONS, breedingRecordType)}</Text>
                <FormChevronDownIcon size={18} color={P.twGray500} />
              </TouchableOpacity>
              {isBreedingRecordTypeDropdownOpen && (
                <View style={styles.formDropdownMenu}>
                  {optionValues(BREEDING_RECORD_TYPE_OPTIONS).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.formDropdownItem,
                        breedingRecordType === type && styles.formDropdownItemActive,
                      ]}
                      onPress={() => {
                        setBreedingRecordType(type);
                        setIsBreedingRecordTypeDropdownOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.formDropdownItemText,
                          breedingRecordType === type && styles.formDropdownItemTextActive,
                        ]}
                      >
                        {optionLabel(BREEDING_RECORD_TYPE_OPTIONS, type)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* ── Form 1: Heat cycle ── */}
            {breedingRecordType === 'HEAT' && (
              <>
                {/* Record date * */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    {t('farmer.livestock.detail.field.recordDate')} <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <View style={styles.formInputContainer}>
                    <FormCalendarIcon size={18} color={P.twGray500} />
                    <TextInput
                      style={styles.formInputWithIcon}
                      value={heatRecordDate}
                      onChangeText={setHeatRecordDate}
                      testID="breedingForm.heatDate"
                      placeholder=""
                      placeholderTextColor={P.twGray400}
                    />
                  </View>
                </View>

                {/* Breeding method * */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    {t('farmer.livestock.detail.field.breedingMethod')} <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.formDropdownTrigger}
                    onPress={() => setIsBreedingMethodDropdownOpen(!isBreedingMethodDropdownOpen)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.livestock.detail.a11y.selectBreedingMethod')}
                  >
                    <Text style={styles.formDropdownSelectedText}>{optionLabel(BREEDING_METHOD_OPTIONS, breedingMethod)}</Text>
                    <FormChevronDownIcon size={18} color={P.twGray500} />
                  </TouchableOpacity>
                  {isBreedingMethodDropdownOpen && (
                    <View style={styles.formDropdownMenu}>
                      {optionValues(BREEDING_METHOD_OPTIONS).map((bm) => (
                        <TouchableOpacity
                          key={bm}
                          style={[
                            styles.formDropdownItem,
                            breedingMethod === bm && styles.formDropdownItemActive,
                          ]}
                          onPress={() => {
                            setBreedingMethod(bm);
                            setIsBreedingMethodDropdownOpen(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.formDropdownItemText,
                              breedingMethod === bm && styles.formDropdownItemTextActive,
                            ]}
                          >
                            {optionLabel(BREEDING_METHOD_OPTIONS, bm)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Sire / Bull * */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    {t('farmer.livestock.detail.field.sire')} <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.formDropdownTrigger}
                    onPress={() => setIsSireBullDropdownOpen(!isSireBullDropdownOpen)}
                    testID="breedingForm.sireTrigger"
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.livestock.detail.a11y.selectBull')}
                  >
                    <Text style={sireBull ? styles.formDropdownSelectedText : styles.formDropdownPlaceholder}>
                      {sireBull || t('farmer.livestock.detail.breedingForm.selectSire')}
                    </Text>
                    <FormChevronDownIcon size={18} color={P.twGray500} />
                  </TouchableOpacity>
                  {isSireBullDropdownOpen && (
                    <View style={styles.formDropdownMenu}>
                      {SIRE_BULL_OPTIONS.map((bull) => (
                        <TouchableOpacity
                          key={bull}
                          testID={bull === SIRE_EXTERNAL ? 'breedingForm.sireExternal' : `breedingForm.sire:${bull}`}
                          style={[
                            styles.formDropdownItem,
                            sireBull === bull && styles.formDropdownItemActive,
                          ]}
                          onPress={() => {
                            setSireBull(bull);
                            setIsSireBullDropdownOpen(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.formDropdownItemText,
                              sireBull === bull && styles.formDropdownItemTextActive,
                            ]}
                          >
                            {bull}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Semen / Straw reference */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.semenStrawRef')}</Text>
                  <TextInput
                    style={styles.formTextInput}
                    value={semenStrawRef}
                    onChangeText={setSemenStrawRef}
                    placeholder=""
                    placeholderTextColor={P.twGray400}
                  />
                </View>

                {/* Technician */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.technician')}</Text>
                  <TextInput
                    style={styles.formTextInput}
                    value={heatTechnician}
                    onChangeText={setHeatTechnician}
                    placeholder=""
                    placeholderTextColor={P.twGray400}
                  />
                </View>

                {/* Observed heat signs */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.heatSigns')}</Text>
                  <TextInput
                    style={styles.formNotesInput}
                    value={observedHeatSigns}
                    onChangeText={setObservedHeatSigns}
                    multiline
                    placeholder=""
                    placeholderTextColor={P.twGray400}
                    textAlignVertical="top"
                  />
                </View>

                {/* Attachment Document */}
                <View style={styles.formGroup}>
                  <View style={styles.attachmentLabelRow}>
                    <AttachmentPaperclipIcon size={16} color={P.twGray600} />
                    <Text style={styles.formLabel}>{t('farmer.livestock.detail.attachment.title')}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.attachmentAddBox}
                    onPress={() => void handlePickAttachment(setBreedingAttachment, setBreedingErrors)}
                testID="breedingForm.attach"
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.livestock.detail.attachment.add')}
                  >
                    <View style={styles.attachmentAddBoxInner}>
                      <View style={styles.attachmentAddCircleBtn}>
                        <FormPlusIcon size={18} color={colors.brandGreen} />
                      </View>
                      <View>
                        <Text style={styles.attachmentAddTitle}>{t('farmer.livestock.detail.attachment.add')}</Text>
                        <Text style={styles.attachmentAddSubtitle}>{t('farmer.livestock.detail.attachment.hint')}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>

                {breedingAttachment && (
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>{t('farmer.livestock.detail.attachment.label')}</Text>
                    <View style={styles.attachmentCard}>
                      <View style={styles.attachmentLeft}>
                        <ReceiptDocIcon size={36} />
                        <View style={styles.attachmentMetaCol}>
                          <Text style={styles.attachmentFilename}>{breedingAttachment.name}</Text>
                          <Text style={styles.attachmentSize}>{attachmentSizeLabel(breedingAttachment)}</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.attachmentRemoveBtn}
                        onPress={() => setBreedingAttachment(null)}
                        accessibilityRole="button"
                        accessibilityLabel={t('farmer.livestock.detail.attachment.remove')}
                      >
                        <FormCloseIcon size={16} color={P.twGray600} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </>
            )}

            {/* ── Form 2: Insemination ── */}
            {breedingRecordType === 'INSEMINATION' && (
              <>
                {/* Insemination date * & Time */}
                <View style={styles.formRowHalf}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>
                      {t('farmer.livestock.detail.breedingForm.inseminationDate')} <Text style={styles.requiredAsterisk}>*</Text>
                    </Text>
                    <View style={styles.formInputContainer}>
                      <FormCalendarIcon size={18} color={P.twGray500} />
                      <TextInput
                        style={styles.formInputWithIcon}
                        value={insemDate}
                        onChangeText={setInsemDate}
                        placeholder=""
                        placeholderTextColor={P.twGray400}
                      />
                    </View>
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>{t('farmer.livestock.detail.breedingForm.time')}</Text>
                    <View style={styles.formInputContainer}>
                      <TextInput
                        style={[styles.formInputWithIcon, { flex: 1 }]}
                        value={insemTime}
                        onChangeText={setInsemTime}
                        placeholder=""
                        placeholderTextColor={P.twGray400}
                      />
                      <FormClockIcon size={18} color={P.twGray500} />
                    </View>
                  </View>
                </View>

                {/* Insemination type * (Vertical Stacked Radio) */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    {t('farmer.livestock.detail.breedingForm.inseminationType')} <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <View style={{ gap: 12, marginTop: 4 }}>
                    <TouchableOpacity
                      style={styles.radioOption}
                      onPress={() => setInsemType('ARTIFICIAL')}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.radioCircle, insemType === 'ARTIFICIAL' && styles.radioCircleSelected]}>
                        {insemType === 'ARTIFICIAL' && <View style={styles.radioInnerDot} />}
                      </View>
                      <Text style={styles.radioLabel}>{optionLabel(INSEMINATION_TYPE_OPTIONS, 'ARTIFICIAL')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.radioOption}
                      onPress={() => setInsemType('NATURAL')}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.radioCircle, insemType === 'NATURAL' && styles.radioCircleSelected]}>
                        {insemType === 'NATURAL' && <View style={styles.radioInnerDot} />}
                      </View>
                      <Text style={styles.radioLabel}>{optionLabel(INSEMINATION_TYPE_OPTIONS, 'NATURAL')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Location */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.location')}</Text>
                  <TextInput
                    style={styles.formTextInput}
                    value={insemLocation}
                    onChangeText={setInsemLocation}
                    placeholder=""
                    placeholderTextColor={P.twGray400}
                  />
                </View>

                {/* Technician */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.technician')}</Text>
                  <TextInput
                    style={styles.formTextInput}
                    value={insemTechnician}
                    onChangeText={setInsemTechnician}
                    placeholder=""
                    placeholderTextColor={P.twGray400}
                  />
                </View>

                {/* Observed heat signs */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.heatSigns')}</Text>
                  <TextInput
                    style={styles.formNotesInput}
                    value={insemObservedHeatSigns}
                    onChangeText={setInsemObservedHeatSigns}
                    multiline
                    placeholder=""
                    placeholderTextColor={P.twGray400}
                    textAlignVertical="top"
                  />
                </View>

                {/* Attachment Document */}
                <View style={styles.formGroup}>
                  <View style={styles.attachmentLabelRow}>
                    <AttachmentPaperclipIcon size={16} color={P.twGray600} />
                    <Text style={styles.formLabel}>{t('farmer.livestock.detail.attachment.title')}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.attachmentAddBox}
                    onPress={() => void handlePickAttachment(setBreedingAttachment, setBreedingErrors)}
                testID="breedingForm.attach"
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.livestock.detail.attachment.add')}
                  >
                    <View style={styles.attachmentAddBoxInner}>
                      <View style={styles.attachmentAddCircleBtn}>
                        <FormPlusIcon size={18} color={colors.brandGreen} />
                      </View>
                      <View>
                        <Text style={styles.attachmentAddTitle}>{t('farmer.livestock.detail.attachment.add')}</Text>
                        <Text style={styles.attachmentAddSubtitle}>{t('farmer.livestock.detail.attachment.hint')}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>

                {breedingAttachment && (
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>{t('farmer.livestock.detail.attachment.label')}</Text>
                    <View style={styles.attachmentCard}>
                      <View style={styles.attachmentLeft}>
                        <ReceiptDocIcon size={36} />
                        <View style={styles.attachmentMetaCol}>
                          <Text style={styles.attachmentFilename}>{breedingAttachment.name}</Text>
                          <Text style={styles.attachmentSize}>{attachmentSizeLabel(breedingAttachment)}</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.attachmentRemoveBtn}
                        onPress={() => setBreedingAttachment(null)}
                        accessibilityRole="button"
                        accessibilityLabel={t('farmer.livestock.detail.attachment.remove')}
                      >
                        <FormCloseIcon size={16} color={P.twGray600} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </>
            )}

            {/* ── Form 3: Pregnancy check ── */}
            {breedingRecordType === 'PREGNANCY_CHECK' && (
              <>
                {/* Pregnancy date * */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    {t('farmer.livestock.detail.breedingForm.pregnancyDate')} <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <View style={styles.formInputContainer}>
                    <FormCalendarIcon size={18} color={P.twGray500} />
                    <TextInput
                      style={styles.formInputWithIcon}
                      value={pregnancyDate}
                      onChangeText={setPregnancyDate}
                      placeholder=""
                      placeholderTextColor={P.twGray400}
                    />
                  </View>
                </View>

                {/* Check type * (Horizontal Radio Row) */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    {t('farmer.livestock.detail.breedingForm.checkType')} <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <View style={styles.radioRow}>
                    <TouchableOpacity
                      style={styles.radioOption}
                      onPress={() => setCheckType('ROUTINE')}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.radioCircle, checkType === 'ROUTINE' && styles.radioCircleSelected]}>
                        {checkType === 'ROUTINE' && <View style={styles.radioInnerDot} />}
                      </View>
                      <Text style={styles.radioLabel}>{optionLabel(PREGNANCY_CHECK_TYPE_OPTIONS, 'ROUTINE')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.radioOption}
                      onPress={() => setCheckType('CONFIRMATION')}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.radioCircle, checkType === 'CONFIRMATION' && styles.radioCircleSelected]}>
                        {checkType === 'CONFIRMATION' && <View style={styles.radioInnerDot} />}
                      </View>
                      <Text style={styles.radioLabel}>{optionLabel(PREGNANCY_CHECK_TYPE_OPTIONS, 'CONFIRMATION')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Result * */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    {t('farmer.livestock.detail.breedingForm.result')} <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.formDropdownTrigger}
                    onPress={() => setIsPregnancyResultDropdownOpen(!isPregnancyResultDropdownOpen)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.livestock.detail.a11y.selectResult')}
                  >
                    <Text style={styles.formDropdownSelectedText}>{optionLabel(PREGNANCY_RESULT_OPTIONS, pregnancyResult)}</Text>
                    <FormChevronDownIcon size={18} color={P.twGray500} />
                  </TouchableOpacity>
                  {isPregnancyResultDropdownOpen && (
                    <View style={styles.formDropdownMenu}>
                      {optionValues(PREGNANCY_RESULT_OPTIONS).map((res) => (
                        <TouchableOpacity
                          key={res}
                          style={[
                            styles.formDropdownItem,
                            pregnancyResult === res && styles.formDropdownItemActive,
                          ]}
                          onPress={() => {
                            setPregnancyResult(res);
                            setIsPregnancyResultDropdownOpen(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.formDropdownItemText,
                              pregnancyResult === res && styles.formDropdownItemTextActive,
                            ]}
                          >
                            {optionLabel(PREGNANCY_RESULT_OPTIONS, res)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Examination method * */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    {t('farmer.livestock.detail.breedingForm.examinationMethod')} <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.formDropdownTrigger}
                    onPress={() => setIsExamMethodDropdownOpen(!isExamMethodDropdownOpen)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.livestock.detail.a11y.selectExaminationMethod')}
                  >
                    <Text style={styles.formDropdownSelectedText}>{optionLabel(EXAMINATION_METHOD_OPTIONS, examMethod)}</Text>
                    <FormChevronDownIcon size={18} color={P.twGray500} />
                  </TouchableOpacity>
                  {isExamMethodDropdownOpen && (
                    <View style={styles.formDropdownMenu}>
                      {optionValues(EXAMINATION_METHOD_OPTIONS).map((em) => (
                        <TouchableOpacity
                          key={em}
                          style={[
                            styles.formDropdownItem,
                            examMethod === em && styles.formDropdownItemActive,
                          ]}
                          onPress={() => {
                            setExamMethod(em);
                            setIsExamMethodDropdownOpen(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.formDropdownItemText,
                              examMethod === em && styles.formDropdownItemTextActive,
                            ]}
                          >
                            {optionLabel(EXAMINATION_METHOD_OPTIONS, em)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Location + months dropdown */}
                <View style={styles.formRowHalf}>
                  <View style={[styles.formGroup, { flex: 1.2 }]}>
                    <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.location')}</Text>
                    <TextInput
                      style={styles.formTextInput}
                      value={pregnancyLocation}
                      onChangeText={setPregnancyLocation}
                      placeholder=""
                      placeholderTextColor={P.twGray400}
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}> </Text>
                    <TouchableOpacity
                      style={styles.formDropdownTrigger}
                      onPress={() => setIsGestationUnitDropdownOpen(!isGestationUnitDropdownOpen)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={t('farmer.livestock.detail.a11y.selectDurationUnit')}
                    >
                      <Text style={styles.formDropdownSelectedText}>{optionLabel(GESTATION_UNIT_OPTIONS, pregnancyGestationUnit)}</Text>
                      <FormChevronDownIcon size={18} color={P.twGray500} />
                    </TouchableOpacity>
                    {isGestationUnitDropdownOpen && (
                      <View style={styles.formDropdownMenu}>
                        {optionValues(GESTATION_UNIT_OPTIONS).map((u) => (
                          <TouchableOpacity
                            key={u}
                            style={[
                              styles.formDropdownItem,
                              pregnancyGestationUnit === u && styles.formDropdownItemActive,
                            ]}
                            onPress={() => {
                              setPregnancyGestationUnit(u);
                              setIsGestationUnitDropdownOpen(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.formDropdownItemText,
                                pregnancyGestationUnit === u && styles.formDropdownItemTextActive,
                              ]}
                            >
                              {optionLabel(GESTATION_UNIT_OPTIONS, u)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>

                {/* Expected delivery date */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.expectedDeliveryDate')}</Text>
                  <View style={styles.formInputContainer}>
                    <FormCalendarIcon size={18} color={P.twGray500} />
                    <TextInput
                      style={styles.formInputWithIcon}
                      value={expectedDeliveryDate}
                      onChangeText={setExpectedDeliveryDate}
                      placeholder=""
                      placeholderTextColor={P.twGray400}
                    />
                  </View>
                </View>

                {/* Next check date * */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    {t('farmer.livestock.detail.field.nextCheckDate')} <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <View style={styles.formInputContainer}>
                    <FormCalendarIcon size={18} color={P.twGray500} />
                    <TextInput
                      style={styles.formInputWithIcon}
                      value={nextCheckDate}
                      onChangeText={setNextCheckDate}
                      placeholder=""
                      placeholderTextColor={P.twGray400}
                    />
                  </View>
                </View>

                {/* Findings / Notes */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t('farmer.livestock.detail.breedingForm.findingsNotes')}</Text>
                  <TextInput
                    style={styles.formNotesInput}
                    value={pregnancyFindings}
                    onChangeText={setPregnancyFindings}
                    multiline
                    placeholder=""
                    placeholderTextColor={P.twGray400}
                    textAlignVertical="top"
                  />
                </View>
              </>
            )}

            {/* ── Form 4: Calving ── */}
            {breedingRecordType === 'CALVING' && (
              <>
                {/* Calving date * */}
                <View style={styles.formRowHalf}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>
                      {t('farmer.livestock.detail.breedingForm.calvingDate')} <Text style={styles.requiredAsterisk}>*</Text>
                    </Text>
                    <View style={styles.formInputContainer}>
                      <FormCalendarIcon size={18} color={P.twGray500} />
                      <TextInput
                        style={styles.formInputWithIcon}
                        value={calvingDate}
                        testID="breedingForm.calvingDate"
                        onChangeText={setCalvingDate}
                        placeholder={t('farmer.livestock.detail.common.datePlaceholder')}
                        placeholderTextColor={P.twGray400}
                      />
                    </View>
                  </View>
                  {/* Optional calving time, HH:MM 24-hour — sent as calvingTime (same parser as the insemination time) */}
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.calvingTime')}</Text>
                    <View style={styles.formInputContainer}>
                      <TextInput
                        style={[styles.formInputWithIcon, { flex: 1 }]}
                        value={calvingTime}
                        testID="breedingForm.calvingTime"
                        onChangeText={setCalvingTime}
                        keyboardType="numbers-and-punctuation"
                        placeholder={t('farmer.livestock.detail.common.timePlaceholder')}
                        placeholderTextColor={P.twGray400}
                      />
                      <FormClockIcon size={18} color={P.twGray500} />
                    </View>
                  </View>
                </View>

                {/* Calving Outcome * */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    {t('farmer.livestock.detail.breedingForm.calvingOutcome')} <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <View style={styles.radioRow}>
                    <TouchableOpacity
                      style={styles.radioOption}
                      onPress={() => setCalvingOutcome('LIVE_BIRTH')}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.radioCircle, calvingOutcome === 'LIVE_BIRTH' && styles.radioCircleSelected]}>
                        {calvingOutcome === 'LIVE_BIRTH' && <View style={styles.radioInnerDot} />}
                      </View>
                      <Text style={styles.radioLabel}>{t('farmer.livestock.detail.breedingForm.liveBirth')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.radioOption}
                      onPress={() => setCalvingOutcome('STILLBIRTH')}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.radioCircle, calvingOutcome === 'STILLBIRTH' && styles.radioCircleSelected]}>
                        {calvingOutcome === 'STILLBIRTH' && <View style={styles.radioInnerDot} />}
                      </View>
                      <Text style={styles.radioLabel}>{t('farmer.livestock.detail.breedingForm.stillbirth')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.radioOption}
                      onPress={() => setCalvingOutcome('OTHER')}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.radioCircle, calvingOutcome === 'OTHER' && styles.radioCircleSelected]}>
                        {calvingOutcome === 'OTHER' && <View style={styles.radioInnerDot} />}
                      </View>
                      <Text style={styles.radioLabel}>{t('farmer.livestock.detail.breedingForm.otherOutcome')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* No of Offspring & Delivery type */}
                <View style={styles.formRowHalf}>
                  <View style={[styles.formGroup, { flex: 1.2 }]}>
                    <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.offspringCount')}</Text>
                    <TextInput
                      style={styles.formTextInput}
                      value={noOfOffspring}
                      onChangeText={setNoOfOffspring}
                      keyboardType="numeric"
                      placeholder=""
                      placeholderTextColor={P.twGray400}
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>{t('farmer.livestock.detail.breedingForm.deliveryType')}</Text>
                    <TouchableOpacity
                      style={styles.formDropdownTrigger}
                      onPress={() => setIsDeliveryTypeDropdownOpen(!isDeliveryTypeDropdownOpen)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={t('farmer.livestock.detail.a11y.selectDeliveryType')}
                    >
                      <Text style={styles.formDropdownSelectedText}>{optionLabel(DELIVERY_TYPE_OPTIONS, deliveryType)}</Text>
                      <FormChevronDownIcon size={18} color={P.twGray500} />
                    </TouchableOpacity>
                    {isDeliveryTypeDropdownOpen && (
                      <View style={styles.formDropdownMenu}>
                        {optionValues(DELIVERY_TYPE_OPTIONS).map((dt) => (
                          <TouchableOpacity
                            key={dt}
                            style={[
                              styles.formDropdownItem,
                              deliveryType === dt && styles.formDropdownItemActive,
                            ]}
                            onPress={() => {
                              setDeliveryType(dt);
                              setIsDeliveryTypeDropdownOpen(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.formDropdownItemText,
                                deliveryType === dt && styles.formDropdownItemTextActive,
                              ]}
                            >
                              {optionLabel(DELIVERY_TYPE_OPTIONS, dt)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>

                {/* Findings / Notes */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t('farmer.livestock.detail.breedingForm.findingsNotes')}</Text>
                  <TextInput
                    style={styles.formNotesInput}
                    value={calvingFindings}
                    onChangeText={setCalvingFindings}
                    multiline
                    placeholder=""
                    placeholderTextColor={P.twGray400}
                    textAlignVertical="top"
                  />
                </View>

                {/* Section Banner: Additional Details */}
                <View style={styles.sectionBanner}>
                  <PeopleGroupIcon size={16} color={colors.brandGreen} />
                  <Text style={styles.sectionBannerText}>{t('farmer.livestock.detail.common.additionalDetails')}</Text>
                </View>

                {/* Offspring name */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.offspringName')}</Text>
                  <TextInput
                    style={styles.formTextInput}
                    value={offspringName}
                    onChangeText={setOffspringName}
                    placeholder=""
                    placeholderTextColor={P.twGray400}
                  />
                </View>

                {/* Offspring gender */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t('farmer.livestock.detail.breedingForm.offspringGender')}</Text>
                  <View style={styles.radioRow}>
                    <TouchableOpacity
                      style={styles.radioOption}
                      onPress={() => setOffspringGender('MALE')}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.radioCircle, offspringGender === 'MALE' && styles.radioCircleSelected]}>
                        {offspringGender === 'MALE' && <View style={styles.radioInnerDot} />}
                      </View>
                      <Text style={styles.radioLabel}>{t('farmer.livestock.detail.gender.MALE')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.radioOption}
                      onPress={() => setOffspringGender('FEMALE')}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.radioCircle, offspringGender === 'FEMALE' && styles.radioCircleSelected]}>
                        {offspringGender === 'FEMALE' && <View style={styles.radioInnerDot} />}
                      </View>
                      <Text style={styles.radioLabel}>{t('farmer.livestock.detail.gender.FEMALE')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Birth weight + kg dropdown */}
                <View style={styles.formRowHalf}>
                  <View style={[styles.formGroup, { flex: 1.2 }]}>
                    <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.birthWeight')}</Text>
                    <TextInput
                      style={styles.formTextInput}
                      value={birthWeight}
                      onChangeText={setBirthWeight}
                      keyboardType="decimal-pad"
                      placeholder=""
                      placeholderTextColor={P.twGray400}
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}> </Text>
                    <TouchableOpacity
                      style={styles.formDropdownTrigger}
                      onPress={() => setIsBirthWeightUnitDropdownOpen(!isBirthWeightUnitDropdownOpen)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={t('farmer.livestock.detail.a11y.selectBirthWeightUnit')}
                    >
                      <Text style={styles.formDropdownSelectedText}>{optionLabel(WEIGHT_UNIT_OPTIONS, birthWeightUnit)}</Text>
                      <FormChevronDownIcon size={18} color={P.twGray500} />
                    </TouchableOpacity>
                    {isBirthWeightUnitDropdownOpen && (
                      <View style={styles.formDropdownMenu}>
                        {optionValues(WEIGHT_UNIT_OPTIONS).map((u) => (
                          <TouchableOpacity
                            key={u}
                            style={[
                              styles.formDropdownItem,
                              birthWeightUnit === u && styles.formDropdownItemActive,
                            ]}
                            onPress={() => {
                              setBirthWeightUnit(u);
                              setIsBirthWeightUnitDropdownOpen(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.formDropdownItemText,
                                birthWeightUnit === u && styles.formDropdownItemTextActive,
                              ]}
                            >
                              {optionLabel(WEIGHT_UNIT_OPTIONS, u)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>

                {/* Register as New Animal button — opens the real Register Animal form, pre-filled */}
                {onNavigateToRegisterOffspring ? (
                  <TouchableOpacity
                    style={styles.addFeedItemBtn}
                    onPress={handleRegisterOffspring}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.livestock.detail.breedingForm.registerNewAnimal')}
                  >
                    <PlusCircleOutlineIcon size={18} color={colors.brandGreen} />
                    <Text style={styles.addFeedItemBtnText}>
                      {t('farmer.livestock.detail.breedingForm.registerNewAnimal')}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </>
            )}

            <FormErrors errors={breedingErrors} testID="breedingForm.errors" />

            {/* Form Bottom Action Buttons */}
            <View style={styles.modalActionButtonsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsAddBreedingModalVisible(false)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={t('farmer.livestock.detail.common.cancel')}
              >
                <Text style={styles.cancelBtnText}>{t('farmer.livestock.detail.common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnBusy]}
                onPress={() => void handleSaveBreedingRecord()}
                disabled={saving}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ disabled: saving, busy: saving }}
                accessibilityLabel={t('farmer.livestock.detail.common.save')}
                testID="breedingForm.save"
              >
                <View style={styles.saveBtnRow}>
                  <FormCheckmarkIcon size={18} color={P.white} />
                  <Text style={styles.saveBtnText}>
                    {saving ? t('farmer.livestock.detail.common.saving') : t('farmer.livestock.detail.common.save')}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 4: ADD PRODUCTION RECORD                                     */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={isAddProductionModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsAddProductionModalVisible(false)}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <StatusBar barStyle="dark-content" backgroundColor={P.white} />

          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalBackBtn}
              onPress={() => setIsAddProductionModalVisible(false)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.livestock.detail.a11y.back')}
            >
              <GreenBackArrowIcon size={24} color={P.deepGreen} />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>{t('farmer.livestock.detail.production.addRecord')}</Text>
          </View>

          <ScrollView
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Animal Summary Card */}
            <View style={styles.modalAnimalCard}>
              <View style={styles.modalAvatarCircle}>
                <PawPrintIcon size={22} color={P.twAmber800} />
                <View style={styles.modalAvatarDot} />
              </View>
              <View style={styles.modalAnimalInfoCol}>
                <Text style={styles.modalAnimalName}>{displayName}</Text>
                <View style={styles.modalAnimalSubtitleRow}>
                  <Text style={styles.modalAnimalSubtitle}>
                    {displaySpecies} · {displayBreed} ·{' '}
                  </Text>
                  <GenderSymbolIcon size={12} color={P.twGray500} />
                  <Text style={styles.modalAnimalSubtitle}> · {displayAge}</Text>
                </View>
              </View>
              <View style={styles.modalStatusBadgePill}>
                <Text style={styles.modalStatusBadgeText}>{displayStatusBadge}</Text>
              </View>
            </View>

            {/* Production type * */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                {t('farmer.livestock.detail.productionForm.productionType')} <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.formDropdownTrigger}
                onPress={() => setIsProductionTypeDropdownOpen(!isProductionTypeDropdownOpen)}
                testID="productionForm.typeTrigger"
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={t('farmer.livestock.detail.a11y.selectProductionType')}
              >
                <Text style={styles.formDropdownSelectedText}>{optionLabel(PRODUCTION_TYPE_OPTIONS, productionType)}</Text>
                <FormChevronDownIcon size={18} color={P.twGray500} />
              </TouchableOpacity>
              {isProductionTypeDropdownOpen && (
                <View style={styles.formDropdownMenu}>
                  {optionValues(PRODUCTION_TYPE_OPTIONS).map((type) => (
                    <TouchableOpacity
                      key={type}
                      testID={`productionForm.type:${type}`}
                      style={[
                        styles.formDropdownItem,
                        productionType === type && styles.formDropdownItemActive,
                      ]}
                      onPress={() => {
                        setProductionType(type);
                        setIsProductionTypeDropdownOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.formDropdownItemText,
                          productionType === type && styles.formDropdownItemTextActive,
                        ]}
                      >
                        {optionLabel(PRODUCTION_TYPE_OPTIONS, type)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Production date * */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                {t('farmer.livestock.detail.field.productionDate')} <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <View style={styles.formInputContainer}>
                <FormCalendarIcon size={18} color={P.twGray500} />
                <TextInput
                  style={styles.formInputWithIcon}
                  value={productionDate}
                  onChangeText={setProductionDate}
                  testID="productionForm.date"
                  placeholder=""
                  placeholderTextColor={P.twGray400}
                />
              </View>
            </View>

            {/* ── Type 1: Milk ── */}
            {productionType === 'MILK' && (
              <>
                {/* Milking session * */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    {t('farmer.livestock.detail.productionForm.milkingSession')} <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.formDropdownTrigger}
                    onPress={() => setIsMilkingSessionDropdownOpen(!isMilkingSessionDropdownOpen)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.livestock.detail.a11y.selectMilkingSession')}
                  >
                    <Text style={styles.formDropdownSelectedText}>{optionLabel(SESSION_OPTIONS, milkingSession)}</Text>
                    <FormChevronDownIcon size={18} color={P.twGray500} />
                  </TouchableOpacity>
                  {isMilkingSessionDropdownOpen && (
                    <View style={styles.formDropdownMenu}>
                      {optionValues(SESSION_OPTIONS).map((ses) => (
                        <TouchableOpacity
                          key={ses}
                          style={[
                            styles.formDropdownItem,
                            milkingSession === ses && styles.formDropdownItemActive,
                          ]}
                          onPress={() => {
                            setMilkingSession(ses);
                            setIsMilkingSessionDropdownOpen(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.formDropdownItemText,
                              milkingSession === ses && styles.formDropdownItemTextActive,
                            ]}
                          >
                            {optionLabel(SESSION_OPTIONS, ses)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Milk yield * (Value + Unit side by side) */}
                <View style={styles.formRowHalf}>
                  <View style={[styles.formGroup, { flex: 1.4 }]}>
                    <Text style={styles.formLabel}>
                      {t('farmer.livestock.detail.productionForm.milkYield')} <Text style={styles.requiredAsterisk}>*</Text>
                    </Text>
                    <TextInput
                      style={styles.formTextInput}
                      value={milkYield}
                      onChangeText={setMilkYield}
                      keyboardType="decimal-pad"
                      placeholder=""
                      placeholderTextColor={P.twGray400}
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}> </Text>
                    <TouchableOpacity
                      style={styles.formDropdownTrigger}
                      onPress={() => setIsMilkYieldUnitDropdownOpen(!isMilkYieldUnitDropdownOpen)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={t('farmer.livestock.detail.a11y.selectMilkYieldUnit')}
                    >
                      <Text style={styles.formDropdownSelectedText}>{optionLabel(PRODUCTION_UNIT_LABELS, milkYieldUnit)}</Text>
                      <FormChevronDownIcon size={18} color={P.twGray500} />
                    </TouchableOpacity>
                    {isMilkYieldUnitDropdownOpen && (
                      <View style={styles.formDropdownMenu}>
                        {PRODUCTION_UNIT_OPTIONS.MILK.map((u) => (
                          <TouchableOpacity
                            key={u}
                            style={[
                              styles.formDropdownItem,
                              milkYieldUnit === u && styles.formDropdownItemActive,
                            ]}
                            onPress={() => {
                              setMilkYieldUnit(u);
                              setIsMilkYieldUnitDropdownOpen(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.formDropdownItemText,
                                milkYieldUnit === u && styles.formDropdownItemTextActive,
                              ]}
                            >
                              {optionLabel(PRODUCTION_UNIT_LABELS, u)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>

                {/* Milk fat % */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.fatPercent')}</Text>
                  <TextInput
                    style={styles.formTextInput}
                    value={milkFat}
                    onChangeText={setMilkFat}
                    keyboardType="decimal-pad"
                    placeholder=""
                    placeholderTextColor={P.twGray400}
                  />
                </View>

                {/* Quality grade * */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    {t('farmer.livestock.detail.field.qualityGrade')} <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.formDropdownTrigger}
                    onPress={() => setIsQualityGradeDropdownOpen(!isQualityGradeDropdownOpen)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.livestock.detail.a11y.selectQualityGrade')}
                  >
                    <Text style={styles.formDropdownSelectedText}>{optionLabel(MILK_GRADE_OPTIONS, qualityGrade)}</Text>
                    <FormChevronDownIcon size={18} color={P.twGray500} />
                  </TouchableOpacity>
                  {isQualityGradeDropdownOpen && (
                    <View style={styles.formDropdownMenu}>
                      {optionValues(MILK_GRADE_OPTIONS).map((g) => (
                        <TouchableOpacity
                          key={g}
                          style={[
                            styles.formDropdownItem,
                            qualityGrade === g && styles.formDropdownItemActive,
                          ]}
                          onPress={() => {
                            setQualityGrade(g);
                            setIsQualityGradeDropdownOpen(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.formDropdownItemText,
                              qualityGrade === g && styles.formDropdownItemTextActive,
                            ]}
                          >
                            {optionLabel(MILK_GRADE_OPTIONS, g)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Milk appearance */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t('farmer.livestock.detail.productionDetail.milkAppearance')}</Text>
                  <TouchableOpacity
                    style={styles.formDropdownTrigger}
                    onPress={() => setIsMilkAppearanceDropdownOpen(!isMilkAppearanceDropdownOpen)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.livestock.detail.a11y.selectMilkAppearance')}
                  >
                    <Text style={styles.formDropdownSelectedText}>{optionLabel(MILK_APPEARANCE_OPTIONS, milkAppearance)}</Text>
                    <FormChevronDownIcon size={18} color={P.twGray500} />
                  </TouchableOpacity>
                  {isMilkAppearanceDropdownOpen && (
                    <View style={styles.formDropdownMenu}>
                      {optionValues(MILK_APPEARANCE_OPTIONS).map((app) => (
                        <TouchableOpacity
                          key={app}
                          style={[
                            styles.formDropdownItem,
                            milkAppearance === app && styles.formDropdownItemActive,
                          ]}
                          onPress={() => {
                            setMilkAppearance(app);
                            setIsMilkAppearanceDropdownOpen(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.formDropdownItemText,
                              milkAppearance === app && styles.formDropdownItemTextActive,
                            ]}
                          >
                            {optionLabel(MILK_APPEARANCE_OPTIONS, app)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Is milk restricted from sale? */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t('farmer.livestock.detail.productionForm.milkRestricted')}</Text>
                  <View style={styles.restrictionToggleRow}>
                    <TouchableOpacity
                      style={[
                        styles.restrictionToggleBtn,
                        !isProductRestricted && styles.restrictionToggleBtnActive,
                      ]}
                      onPress={() => setIsProductRestricted(false)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={t('farmer.livestock.detail.option.yesNo.NO')}
                    >
                      <Text
                        style={[
                          styles.restrictionToggleBtnText,
                          !isProductRestricted && styles.restrictionToggleBtnTextActive,
                        ]}
                      >
                        {t('farmer.livestock.detail.option.yesNo.NO')}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.restrictionToggleBtn,
                        isProductRestricted && styles.restrictionToggleBtnActive,
                      ]}
                      onPress={() => setIsProductRestricted(true)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={t('farmer.livestock.detail.option.yesNo.YES')}
                    >
                      <Text
                        style={[
                          styles.restrictionToggleBtnText,
                          isProductRestricted && styles.restrictionToggleBtnTextActive,
                        ]}
                      >
                        {t('farmer.livestock.detail.option.yesNo.YES')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}

            {/* ── Type 2: Eggs ── */}
            {productionType === 'EGGS' && (
              <>
                {/* Collection session * */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    {t('farmer.livestock.detail.productionForm.collectionSession')} <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.formDropdownTrigger}
                    onPress={() => setIsEggSessionDropdownOpen(!isEggSessionDropdownOpen)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.livestock.detail.a11y.selectCollectionSession')}
                  >
                    <Text style={styles.formDropdownSelectedText}>{optionLabel(EGG_SESSION_OPTIONS, eggCollectionSession)}</Text>
                    <FormChevronDownIcon size={18} color={P.twGray500} />
                  </TouchableOpacity>
                  {isEggSessionDropdownOpen && (
                    <View style={styles.formDropdownMenu}>
                      {optionValues(EGG_SESSION_OPTIONS).map((ses) => (
                        <TouchableOpacity
                          key={ses}
                          style={[
                            styles.formDropdownItem,
                            eggCollectionSession === ses && styles.formDropdownItemActive,
                          ]}
                          onPress={() => {
                            setEggCollectionSession(ses);
                            setIsEggSessionDropdownOpen(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.formDropdownItemText,
                              eggCollectionSession === ses && styles.formDropdownItemTextActive,
                            ]}
                          >
                            {optionLabel(EGG_SESSION_OPTIONS, ses)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Egg count * */}
                <View style={styles.formRowHalf}>
                  <View style={[styles.formGroup, { flex: 1.4 }]}>
                    <Text style={styles.formLabel}>
                      {t('farmer.livestock.detail.productionForm.eggCount')} <Text style={styles.requiredAsterisk}>*</Text>
                    </Text>
                    <TextInput
                      style={styles.formTextInput}
                      value={eggCount}
                      onChangeText={setEggCount}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={P.twGray400}
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1.1 }]}>
                    <Text style={styles.formLabel}> </Text>
                    <TouchableOpacity
                      style={styles.formDropdownTrigger}
                      onPress={() => setIsEggUnitDropdownOpen(!isEggUnitDropdownOpen)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={t('farmer.livestock.detail.a11y.selectEggUnit')}
                    >
                      <Text style={styles.formDropdownSelectedText}>{optionLabel(PRODUCTION_UNIT_LABELS, eggUnit)}</Text>
                      <FormChevronDownIcon size={18} color={P.twGray500} />
                    </TouchableOpacity>
                    {isEggUnitDropdownOpen && (
                      <View style={styles.formDropdownMenu}>
                        {PRODUCTION_UNIT_OPTIONS.EGGS.map((u) => (
                          <TouchableOpacity
                            key={u}
                            style={[
                              styles.formDropdownItem,
                              eggUnit === u && styles.formDropdownItemActive,
                            ]}
                            onPress={() => {
                              setEggUnit(u);
                              setIsEggUnitDropdownOpen(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.formDropdownItemText,
                                eggUnit === u && styles.formDropdownItemTextActive,
                              ]}
                            >
                              {optionLabel(PRODUCTION_UNIT_LABELS, u)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>

                {/* Damaged / Broken eggs */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t('farmer.livestock.detail.productionDetail.damagedEggs')}</Text>
                  <TextInput
                    style={styles.formTextInput}
                    value={damagedEggs}
                    onChangeText={setDamagedEggs}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={P.twGray400}
                  />
                </View>

                {/* Egg size / Grade * */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    {t('farmer.livestock.detail.productionForm.eggGrade')} <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.formDropdownTrigger}
                    onPress={() => setIsEggGradeDropdownOpen(!isEggGradeDropdownOpen)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.livestock.detail.a11y.selectEggGrade')}
                  >
                    <Text style={styles.formDropdownSelectedText}>{optionLabel(EGG_GRADE_OPTIONS, eggGrade)}</Text>
                    <FormChevronDownIcon size={18} color={P.twGray500} />
                  </TouchableOpacity>
                  {isEggGradeDropdownOpen && (
                    <View style={styles.formDropdownMenu}>
                      {optionValues(EGG_GRADE_OPTIONS).map((g) => (
                        <TouchableOpacity
                          key={g}
                          style={[
                            styles.formDropdownItem,
                            eggGrade === g && styles.formDropdownItemActive,
                          ]}
                          onPress={() => {
                            setEggGrade(g);
                            setIsEggGradeDropdownOpen(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.formDropdownItemText,
                              eggGrade === g && styles.formDropdownItemTextActive,
                            ]}
                          >
                            {optionLabel(EGG_GRADE_OPTIONS, g)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Shell quality */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t('farmer.livestock.detail.productionDetail.shellQuality')}</Text>
                  <TouchableOpacity
                    style={styles.formDropdownTrigger}
                    onPress={() => setIsEggShellDropdownOpen(!isEggShellDropdownOpen)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.livestock.detail.a11y.selectShellQuality')}
                  >
                    <Text style={styles.formDropdownSelectedText}>{optionLabel(EGG_SHELL_OPTIONS, eggShellQuality)}</Text>
                    <FormChevronDownIcon size={18} color={P.twGray500} />
                  </TouchableOpacity>
                  {isEggShellDropdownOpen && (
                    <View style={styles.formDropdownMenu}>
                      {optionValues(EGG_SHELL_OPTIONS).map((sq) => (
                        <TouchableOpacity
                          key={sq}
                          style={[
                            styles.formDropdownItem,
                            eggShellQuality === sq && styles.formDropdownItemActive,
                          ]}
                          onPress={() => {
                            setEggShellQuality(sq);
                            setIsEggShellDropdownOpen(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.formDropdownItemText,
                              eggShellQuality === sq && styles.formDropdownItemTextActive,
                            ]}
                          >
                            {optionLabel(EGG_SHELL_OPTIONS, sq)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Are eggs restricted from sale? */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t('farmer.livestock.detail.productionForm.eggsRestricted')}</Text>
                  <View style={styles.restrictionToggleRow}>
                    <TouchableOpacity
                      style={[
                        styles.restrictionToggleBtn,
                        !isProductRestricted && styles.restrictionToggleBtnActive,
                      ]}
                      onPress={() => setIsProductRestricted(false)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={t('farmer.livestock.detail.option.yesNo.NO')}
                    >
                      <Text
                        style={[
                          styles.restrictionToggleBtnText,
                          !isProductRestricted && styles.restrictionToggleBtnTextActive,
                        ]}
                      >
                        {t('farmer.livestock.detail.option.yesNo.NO')}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.restrictionToggleBtn,
                        isProductRestricted && styles.restrictionToggleBtnActive,
                      ]}
                      onPress={() => setIsProductRestricted(true)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={t('farmer.livestock.detail.option.yesNo.YES')}
                    >
                      <Text
                        style={[
                          styles.restrictionToggleBtnText,
                          isProductRestricted && styles.restrictionToggleBtnTextActive,
                        ]}
                      >
                        {t('farmer.livestock.detail.option.yesNo.YES')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}

            {/* ── Type 3: Meat ── */}
            {productionType === 'MEAT' && (
              <>
                {/* Processing facility / Location * */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    {t('farmer.livestock.detail.productionForm.facility')} <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.formTextInput}
                    value={meatFacility}
                    onChangeText={setMeatFacility}
                    placeholder={t('farmer.livestock.detail.productionForm.facilityPlaceholder')}
                    placeholderTextColor={P.twGray400}
                  />
                </View>

                {/* Dressed weight / Yield * */}
                <View style={styles.formRowHalf}>
                  <View style={[styles.formGroup, { flex: 1.4 }]}>
                    <Text style={styles.formLabel}>
                      {t('farmer.livestock.detail.productionForm.dressedWeight')} <Text style={styles.requiredAsterisk}>*</Text>
                    </Text>
                    <TextInput
                      style={styles.formTextInput}
                      value={meatDressedWeight}
                      testID="productionForm.meatWeight"
                      onChangeText={setMeatDressedWeight}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={P.twGray400}
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}> </Text>
                    <TouchableOpacity
                      style={styles.formDropdownTrigger}
                      onPress={() => setIsMeatWeightUnitDropdownOpen(!isMeatWeightUnitDropdownOpen)}
                      testID="productionForm.meatUnitTrigger"
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={t('farmer.livestock.detail.a11y.selectWeightUnit')}
                    >
                      <Text style={styles.formDropdownSelectedText}>{optionLabel(PRODUCTION_UNIT_LABELS, meatWeightUnit)}</Text>
                      <FormChevronDownIcon size={18} color={P.twGray500} />
                    </TouchableOpacity>
                    {isMeatWeightUnitDropdownOpen && (
                      <View style={styles.formDropdownMenu}>
                        {PRODUCTION_UNIT_OPTIONS.MEAT.map((u) => (
                          <TouchableOpacity
                            key={u}
                            style={[
                              styles.formDropdownItem,
                              meatWeightUnit === u && styles.formDropdownItemActive,
                            ]}
                            testID={`productionForm.meatUnit:${u}`}
                            onPress={() => {
                              setMeatWeightUnit(u);
                              setIsMeatWeightUnitDropdownOpen(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.formDropdownItemText,
                                meatWeightUnit === u && styles.formDropdownItemTextActive,
                              ]}
                            >
                              {optionLabel(PRODUCTION_UNIT_LABELS, u)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>

                {/* Live weight */}
                <View style={styles.formRowHalf}>
                  <View style={[styles.formGroup, { flex: 1.4 }]}>
                    <Text style={styles.formLabel}>{t('farmer.livestock.detail.productionForm.liveWeight')}</Text>
                    <TextInput
                      style={styles.formTextInput}
                      value={meatLiveWeight}
                      onChangeText={setMeatLiveWeight}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={P.twGray400}
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}> </Text>
                    <TouchableOpacity
                      style={styles.formDropdownTrigger}
                      onPress={() => setIsMeatLiveWeightUnitDropdownOpen(!isMeatLiveWeightUnitDropdownOpen)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={t('farmer.livestock.detail.a11y.selectLiveWeightUnit')}
                    >
                      <Text style={styles.formDropdownSelectedText}>{optionLabel(PRODUCTION_UNIT_LABELS, meatLiveWeightUnit)}</Text>
                      <FormChevronDownIcon size={18} color={P.twGray500} />
                    </TouchableOpacity>
                    {isMeatLiveWeightUnitDropdownOpen && (
                      <View style={styles.formDropdownMenu}>
                        {PRODUCTION_UNIT_OPTIONS.MEAT.map((u) => (
                          <TouchableOpacity
                            key={u}
                            style={[
                              styles.formDropdownItem,
                              meatLiveWeightUnit === u && styles.formDropdownItemActive,
                            ]}
                            onPress={() => {
                              setMeatLiveWeightUnit(u);
                              setIsMeatLiveWeightUnitDropdownOpen(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.formDropdownItemText,
                                meatLiveWeightUnit === u && styles.formDropdownItemTextActive,
                              ]}
                            >
                              {optionLabel(PRODUCTION_UNIT_LABELS, u)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>

                {/* Meat cut / Category * */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    {t('farmer.livestock.detail.productionForm.meatCut')} <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.formDropdownTrigger}
                    onPress={() => setIsMeatCutDropdownOpen(!isMeatCutDropdownOpen)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.livestock.detail.a11y.selectMeatCut')}
                  >
                    <Text style={styles.formDropdownSelectedText}>{optionLabel(MEAT_CUT_OPTIONS, meatCutCategory)}</Text>
                    <FormChevronDownIcon size={18} color={P.twGray500} />
                  </TouchableOpacity>
                  {isMeatCutDropdownOpen && (
                    <View style={styles.formDropdownMenu}>
                      {optionValues(MEAT_CUT_OPTIONS).map((c) => (
                        <TouchableOpacity
                          key={c}
                          style={[
                            styles.formDropdownItem,
                            meatCutCategory === c && styles.formDropdownItemActive,
                          ]}
                          onPress={() => {
                            setMeatCutCategory(c);
                            setIsMeatCutDropdownOpen(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.formDropdownItemText,
                              meatCutCategory === c && styles.formDropdownItemTextActive,
                            ]}
                          >
                            {optionLabel(MEAT_CUT_OPTIONS, c)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Quality inspection grade */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t('farmer.livestock.detail.productionForm.inspectionGrade')}</Text>
                  <TouchableOpacity
                    style={styles.formDropdownTrigger}
                    onPress={() => setIsMeatGradeDropdownOpen(!isMeatGradeDropdownOpen)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.livestock.detail.a11y.selectInspectionGrade')}
                  >
                    <Text style={styles.formDropdownSelectedText}>{optionLabel(MEAT_GRADE_OPTIONS, meatGrade)}</Text>
                    <FormChevronDownIcon size={18} color={P.twGray500} />
                  </TouchableOpacity>
                  {isMeatGradeDropdownOpen && (
                    <View style={styles.formDropdownMenu}>
                      {optionValues(MEAT_GRADE_OPTIONS).map((g) => (
                        <TouchableOpacity
                          key={g}
                          style={[
                            styles.formDropdownItem,
                            meatGrade === g && styles.formDropdownItemActive,
                          ]}
                          onPress={() => {
                            setMeatGrade(g);
                            setIsMeatGradeDropdownOpen(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.formDropdownItemText,
                              meatGrade === g && styles.formDropdownItemTextActive,
                            ]}
                          >
                            {optionLabel(MEAT_GRADE_OPTIONS, g)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Is meat restricted from sale? */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t('farmer.livestock.detail.productionForm.meatRestricted')}</Text>
                  <View style={styles.restrictionToggleRow}>
                    <TouchableOpacity
                      style={[
                        styles.restrictionToggleBtn,
                        !isProductRestricted && styles.restrictionToggleBtnActive,
                      ]}
                      onPress={() => setIsProductRestricted(false)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={t('farmer.livestock.detail.option.yesNo.NO')}
                    >
                      <Text
                        style={[
                          styles.restrictionToggleBtnText,
                          !isProductRestricted && styles.restrictionToggleBtnTextActive,
                        ]}
                      >
                        {t('farmer.livestock.detail.option.yesNo.NO')}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.restrictionToggleBtn,
                        isProductRestricted && styles.restrictionToggleBtnActive,
                      ]}
                      onPress={() => setIsProductRestricted(true)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={t('farmer.livestock.detail.option.yesNo.YES')}
                    >
                      <Text
                        style={[
                          styles.restrictionToggleBtnText,
                          isProductRestricted && styles.restrictionToggleBtnTextActive,
                        ]}
                      >
                        {t('farmer.livestock.detail.option.yesNo.YES')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}

            {/* ── Type 4: Wool ── */}
            {productionType === 'WOOL' && (
              <>
                {/* Shearing session * */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    {t('farmer.livestock.detail.productionForm.shearingSession')} <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.formDropdownTrigger}
                    onPress={() => setIsWoolSessionDropdownOpen(!isWoolSessionDropdownOpen)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.livestock.detail.a11y.selectShearingSession')}
                  >
                    <Text style={styles.formDropdownSelectedText}>{optionLabel(WOOL_SHEARING_OPTIONS, woolSession)}</Text>
                    <FormChevronDownIcon size={18} color={P.twGray500} />
                  </TouchableOpacity>
                  {isWoolSessionDropdownOpen && (
                    <View style={styles.formDropdownMenu}>
                      {optionValues(WOOL_SHEARING_OPTIONS).map((ses) => (
                        <TouchableOpacity
                          key={ses}
                          style={[
                            styles.formDropdownItem,
                            woolSession === ses && styles.formDropdownItemActive,
                          ]}
                          onPress={() => {
                            setWoolSession(ses);
                            setIsWoolSessionDropdownOpen(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.formDropdownItemText,
                              woolSession === ses && styles.formDropdownItemTextActive,
                            ]}
                          >
                            {optionLabel(WOOL_SHEARING_OPTIONS, ses)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Fleece weight * */}
                <View style={styles.formRowHalf}>
                  <View style={[styles.formGroup, { flex: 1.4 }]}>
                    <Text style={styles.formLabel}>
                      {t('farmer.livestock.detail.productionForm.fleeceWeight')} <Text style={styles.requiredAsterisk}>*</Text>
                    </Text>
                    <TextInput
                      style={styles.formTextInput}
                      value={woolWeight}
                      onChangeText={setWoolWeight}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={P.twGray400}
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}> </Text>
                    <TouchableOpacity
                      style={styles.formDropdownTrigger}
                      onPress={() => setIsWoolWeightUnitDropdownOpen(!isWoolWeightUnitDropdownOpen)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={t('farmer.livestock.detail.a11y.selectWeightUnit')}
                    >
                      <Text style={styles.formDropdownSelectedText}>{optionLabel(PRODUCTION_UNIT_LABELS, woolWeightUnit)}</Text>
                      <FormChevronDownIcon size={18} color={P.twGray500} />
                    </TouchableOpacity>
                    {isWoolWeightUnitDropdownOpen && (
                      <View style={styles.formDropdownMenu}>
                        {PRODUCTION_UNIT_OPTIONS.WOOL.map((u) => (
                          <TouchableOpacity
                            key={u}
                            style={[
                              styles.formDropdownItem,
                              woolWeightUnit === u && styles.formDropdownItemActive,
                            ]}
                            onPress={() => {
                              setWoolWeightUnit(u);
                              setIsWoolWeightUnitDropdownOpen(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.formDropdownItemText,
                                woolWeightUnit === u && styles.formDropdownItemTextActive,
                              ]}
                            >
                              {optionLabel(PRODUCTION_UNIT_LABELS, u)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>

                {/* Staple length (cm) */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t('farmer.livestock.detail.productionDetail.stapleLength')}</Text>
                  <TextInput
                    style={styles.formTextInput}
                    value={woolStapleLength}
                    onChangeText={setWoolStapleLength}
                    keyboardType="decimal-pad"
                    placeholder={t('farmer.livestock.detail.productionForm.stapleLengthPlaceholder')}
                    placeholderTextColor={P.twGray400}
                  />
                </View>

                {/* Wool grade / Micron * */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    {t('farmer.livestock.detail.productionForm.woolGrade')} <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.formDropdownTrigger}
                    onPress={() => setIsWoolGradeDropdownOpen(!isWoolGradeDropdownOpen)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.livestock.detail.a11y.selectWoolGrade')}
                  >
                    <Text style={styles.formDropdownSelectedText}>{optionLabel(WOOL_GRADE_OPTIONS, woolGrade)}</Text>
                    <FormChevronDownIcon size={18} color={P.twGray500} />
                  </TouchableOpacity>
                  {isWoolGradeDropdownOpen && (
                    <View style={styles.formDropdownMenu}>
                      {optionValues(WOOL_GRADE_OPTIONS).map((g) => (
                        <TouchableOpacity
                          key={g}
                          style={[
                            styles.formDropdownItem,
                            woolGrade === g && styles.formDropdownItemActive,
                          ]}
                          onPress={() => {
                            setWoolGrade(g);
                            setIsWoolGradeDropdownOpen(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.formDropdownItemText,
                              woolGrade === g && styles.formDropdownItemTextActive,
                            ]}
                          >
                            {optionLabel(WOOL_GRADE_OPTIONS, g)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Fleece condition */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t('farmer.livestock.detail.productionForm.fleeceCondition')}</Text>
                  <TouchableOpacity
                    style={styles.formDropdownTrigger}
                    onPress={() => setIsWoolConditionDropdownOpen(!isWoolConditionDropdownOpen)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.livestock.detail.a11y.selectFleeceCondition')}
                  >
                    <Text style={styles.formDropdownSelectedText}>{optionLabel(WOOL_CONDITION_OPTIONS, woolCondition)}</Text>
                    <FormChevronDownIcon size={18} color={P.twGray500} />
                  </TouchableOpacity>
                  {isWoolConditionDropdownOpen && (
                    <View style={styles.formDropdownMenu}>
                      {optionValues(WOOL_CONDITION_OPTIONS).map((c) => (
                        <TouchableOpacity
                          key={c}
                          style={[
                            styles.formDropdownItem,
                            woolCondition === c && styles.formDropdownItemActive,
                          ]}
                          onPress={() => {
                            setWoolCondition(c);
                            setIsWoolConditionDropdownOpen(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.formDropdownItemText,
                              woolCondition === c && styles.formDropdownItemTextActive,
                            ]}
                          >
                            {optionLabel(WOOL_CONDITION_OPTIONS, c)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Is wool restricted from sale? */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t('farmer.livestock.detail.productionForm.woolRestricted')}</Text>
                  <View style={styles.restrictionToggleRow}>
                    <TouchableOpacity
                      style={[
                        styles.restrictionToggleBtn,
                        !isProductRestricted && styles.restrictionToggleBtnActive,
                      ]}
                      onPress={() => setIsProductRestricted(false)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={t('farmer.livestock.detail.option.yesNo.NO')}
                    >
                      <Text
                        style={[
                          styles.restrictionToggleBtnText,
                          !isProductRestricted && styles.restrictionToggleBtnTextActive,
                        ]}
                      >
                        {t('farmer.livestock.detail.option.yesNo.NO')}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.restrictionToggleBtn,
                        isProductRestricted && styles.restrictionToggleBtnActive,
                      ]}
                      onPress={() => setIsProductRestricted(true)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={t('farmer.livestock.detail.option.yesNo.YES')}
                    >
                      <Text
                        style={[
                          styles.restrictionToggleBtnText,
                          isProductRestricted && styles.restrictionToggleBtnTextActive,
                        ]}
                      >
                        {t('farmer.livestock.detail.option.yesNo.YES')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}

            {/* ── Type 5: Manure ── */}
            {productionType === 'MANURE' && (
              <>
                {/* Collection type * */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    {t('farmer.livestock.detail.productionDetail.collectionType')} <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.formDropdownTrigger}
                    onPress={() => setIsManureCollectionTypeDropdownOpen(!isManureCollectionTypeDropdownOpen)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.livestock.detail.a11y.selectCollectionType')}
                  >
                    <Text style={styles.formDropdownSelectedText}>{optionLabel(MANURE_COLLECTION_OPTIONS, manureCollectionType)}</Text>
                    <FormChevronDownIcon size={18} color={P.twGray500} />
                  </TouchableOpacity>
                  {isManureCollectionTypeDropdownOpen && (
                    <View style={styles.formDropdownMenu}>
                      {optionValues(MANURE_COLLECTION_OPTIONS).map((value) => (
                        <TouchableOpacity
                          key={value}
                          style={[
                            styles.formDropdownItem,
                            manureCollectionType === value && styles.formDropdownItemActive,
                          ]}
                          onPress={() => {
                            setManureCollectionType(value);
                            setIsManureCollectionTypeDropdownOpen(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.formDropdownItemText,
                              manureCollectionType === value && styles.formDropdownItemTextActive,
                            ]}
                          >
                            {optionLabel(MANURE_COLLECTION_OPTIONS, value)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Quantity collected * */}
                <View style={styles.formRowHalf}>
                  <View style={[styles.formGroup, { flex: 1.4 }]}>
                    <Text style={styles.formLabel}>
                      {t('farmer.livestock.detail.productionForm.quantityCollected')} <Text style={styles.requiredAsterisk}>*</Text>
                    </Text>
                    <TextInput
                      style={styles.formTextInput}
                      value={manureQuantity}
                      onChangeText={setManureQuantity}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={P.twGray400}
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1.1 }]}>
                    <Text style={styles.formLabel}> </Text>
                    <TouchableOpacity
                      style={styles.formDropdownTrigger}
                      onPress={() => setIsManureUnitDropdownOpen(!isManureUnitDropdownOpen)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={t('farmer.livestock.detail.a11y.selectQuantityUnit')}
                    >
                      <Text style={styles.formDropdownSelectedText}>{optionLabel(PRODUCTION_UNIT_LABELS, manureUnit)}</Text>
                      <FormChevronDownIcon size={18} color={P.twGray500} />
                    </TouchableOpacity>
                    {isManureUnitDropdownOpen && (
                      <View style={styles.formDropdownMenu}>
                        {PRODUCTION_UNIT_OPTIONS.MANURE.map((u) => (
                          <TouchableOpacity
                            key={u}
                            style={[
                              styles.formDropdownItem,
                              manureUnit === u && styles.formDropdownItemActive,
                            ]}
                            onPress={() => {
                              setManureUnit(u);
                              setIsManureUnitDropdownOpen(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.formDropdownItemText,
                                manureUnit === u && styles.formDropdownItemTextActive,
                              ]}
                            >
                              {optionLabel(PRODUCTION_UNIT_LABELS, u)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>

                {/* Moisture level */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t('farmer.livestock.detail.productionForm.moistureLevel')}</Text>
                  <TouchableOpacity
                    style={styles.formDropdownTrigger}
                    onPress={() => setIsManureMoistureDropdownOpen(!isManureMoistureDropdownOpen)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.livestock.detail.a11y.selectMoistureLevel')}
                  >
                    <Text style={styles.formDropdownSelectedText}>{optionLabel(MANURE_MOISTURE_OPTIONS, manureMoisture)}</Text>
                    <FormChevronDownIcon size={18} color={P.twGray500} />
                  </TouchableOpacity>
                  {isManureMoistureDropdownOpen && (
                    <View style={styles.formDropdownMenu}>
                      {optionValues(MANURE_MOISTURE_OPTIONS).map((m) => (
                        <TouchableOpacity
                          key={m}
                          style={[
                            styles.formDropdownItem,
                            manureMoisture === m && styles.formDropdownItemActive,
                          ]}
                          onPress={() => {
                            setManureMoisture(m);
                            setIsManureMoistureDropdownOpen(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.formDropdownItemText,
                              manureMoisture === m && styles.formDropdownItemTextActive,
                            ]}
                          >
                            {optionLabel(MANURE_MOISTURE_OPTIONS, m)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Composting status * */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    {t('farmer.livestock.detail.productionDetail.compostingStatus')} <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.formDropdownTrigger}
                    onPress={() => setIsManureCompostingDropdownOpen(!isManureCompostingDropdownOpen)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.livestock.detail.a11y.selectCompostingStatus')}
                  >
                    <Text style={styles.formDropdownSelectedText}>{optionLabel(MANURE_COMPOST_OPTIONS, manureCompostingStatus)}</Text>
                    <FormChevronDownIcon size={18} color={P.twGray500} />
                  </TouchableOpacity>
                  {isManureCompostingDropdownOpen && (
                    <View style={styles.formDropdownMenu}>
                      {optionValues(MANURE_COMPOST_OPTIONS).map((s) => (
                        <TouchableOpacity
                          key={s}
                          style={[
                            styles.formDropdownItem,
                            manureCompostingStatus === s && styles.formDropdownItemActive,
                          ]}
                          onPress={() => {
                            setManureCompostingStatus(s);
                            setIsManureCompostingDropdownOpen(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.formDropdownItemText,
                              manureCompostingStatus === s && styles.formDropdownItemTextActive,
                            ]}
                          >
                            {optionLabel(MANURE_COMPOST_OPTIONS, s)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Storage / Bin location */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t('farmer.livestock.detail.productionForm.storageLocation')}</Text>
                  <TextInput
                    style={styles.formTextInput}
                    value={manureStorageLocation}
                    onChangeText={setManureStorageLocation}
                    placeholder={t('farmer.livestock.detail.productionForm.storagePlaceholder')}
                    placeholderTextColor={P.twGray400}
                  />
                </View>

                {/* Is manure restricted from use/sale? */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t('farmer.livestock.detail.productionForm.manureRestricted')}</Text>
                  <View style={styles.restrictionToggleRow}>
                    <TouchableOpacity
                      style={[
                        styles.restrictionToggleBtn,
                        !isProductRestricted && styles.restrictionToggleBtnActive,
                      ]}
                      onPress={() => setIsProductRestricted(false)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={t('farmer.livestock.detail.option.yesNo.NO')}
                    >
                      <Text
                        style={[
                          styles.restrictionToggleBtnText,
                          !isProductRestricted && styles.restrictionToggleBtnTextActive,
                        ]}
                      >
                        {t('farmer.livestock.detail.option.yesNo.NO')}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.restrictionToggleBtn,
                        isProductRestricted && styles.restrictionToggleBtnActive,
                      ]}
                      onPress={() => setIsProductRestricted(true)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={t('farmer.livestock.detail.option.yesNo.YES')}
                    >
                      <Text
                        style={[
                          styles.restrictionToggleBtnText,
                          isProductRestricted && styles.restrictionToggleBtnTextActive,
                        ]}
                      >
                        {t('farmer.livestock.detail.option.yesNo.YES')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}

            {/* Notes */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.notes')}</Text>
              <TextInput
                style={styles.formNotesInput}
                value={productionNotes}
                onChangeText={setProductionNotes}
                multiline
                placeholder=""
                placeholderTextColor={P.twGray400}
                textAlignVertical="top"
              />
            </View>

            {/* Attachment Document */}
            <View style={styles.formGroup}>
              <View style={styles.attachmentLabelRow}>
                <AttachmentPaperclipIcon size={16} color={P.twGray600} />
                <Text style={styles.formLabel}>{t('farmer.livestock.detail.attachment.title')}</Text>
              </View>
              <View
                style={[styles.attachmentAddBox, styles.attachmentAddBoxDisabled]}
                accessibilityState={{ disabled: true }}
                testID="productionForm.attachmentDisabled"
              >
                <View style={styles.attachmentAddBoxInner}>
                  <View style={styles.attachmentAddCircleBtn}>
                    <FormPlusIcon size={18} color={P.twGray400} />
                  </View>
                  <View style={styles.attachmentDisabledCol}>
                    <Text style={styles.attachmentAddTitle}>{t('farmer.livestock.detail.attachment.add')}</Text>
                    <Text style={styles.attachmentAddSubtitle}>
                      {t('farmer.livestock.detail.production.attachmentUnsupported')}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* + Add Production button */}
            <TouchableOpacity
              style={styles.addFeedItemBtn}
              onPress={() => void handleSaveProductionRecord()}
              disabled={saving}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.livestock.detail.production.addRecord')}
            >
              <PlusCircleOutlineIcon size={18} color={colors.brandGreen} />
              <Text style={styles.addFeedItemBtnText}>{t('farmer.livestock.detail.production.addRecord')}</Text>
            </TouchableOpacity>

            <FormErrors errors={productionErrors} testID="productionForm.errors" />

            {/* Form Bottom Action Buttons */}
            <View style={styles.modalActionButtonsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsAddProductionModalVisible(false)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={t('farmer.livestock.detail.common.cancel')}
              >
                <Text style={styles.cancelBtnText}>{t('farmer.livestock.detail.common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnBusy]}
                onPress={() => void handleSaveProductionRecord()}
                disabled={saving}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ disabled: saving, busy: saving }}
                accessibilityLabel={t('farmer.livestock.detail.common.save')}
                testID="productionForm.save"
              >
                <View style={styles.saveBtnRow}>
                  <FormCheckmarkIcon size={18} color={P.white} />
                  <Text style={styles.saveBtnText}>
                    {saving ? t('farmer.livestock.detail.common.saving') : t('farmer.livestock.detail.common.save')}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 5: ADD HOUSING DETAILS                                       */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={isAddHousingModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsAddHousingModalVisible(false)}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalBackBtn}
              onPress={() => setIsAddHousingModalVisible(false)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.livestock.detail.a11y.back')}
            >
              <GreenBackArrowIcon size={24} color={P.deepGreen} />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>{t('farmer.livestock.detail.housing.addRecord')}</Text>
          </View>

          <ScrollView
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Animal Summary Card */}
            <View style={styles.modalAnimalCard}>
              <View style={styles.modalAvatarCircle}>
                <PawPrintIcon size={22} color={P.twAmber800} />
                <View style={styles.modalAvatarDot} />
              </View>
              <View style={styles.modalAnimalInfoCol}>
                <Text style={styles.modalAnimalName}>{displayName}</Text>
                <View style={styles.modalAnimalSubtitleRow}>
                  <Text style={styles.modalAnimalSubtitle}>
                    {displaySpecies} · {displayBreed} ·{' '}
                  </Text>
                  <GenderSymbolIcon size={12} color={P.twGray500} />
                  <Text style={styles.modalAnimalSubtitle}> · {displayAge}</Text>
                </View>
              </View>
              <View style={styles.modalStatusBadgePill}>
                <Text style={styles.modalStatusBadgeText}>{displayStatusBadge}</Text>
              </View>
            </View>

            {/* Housing Type * (Dropdown) */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                {t('farmer.livestock.detail.field.housingType')} <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.formDropdownTrigger}
                onPress={() => setIsHousingTypeDropdownOpen(!isHousingTypeDropdownOpen)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={t('farmer.livestock.detail.a11y.selectHousingType')}
              >
                <Text style={styles.formDropdownSelectedText}>{optionLabel(HOUSING_TYPE_OPTIONS, housingType)}</Text>
                <FormChevronDownIcon size={18} color={P.twGray500} />
              </TouchableOpacity>
              {isHousingTypeDropdownOpen && (
                <View style={styles.formDropdownMenu}>
                  {optionValues(HOUSING_TYPE_OPTIONS).map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.formDropdownItem,
                        housingType === item && styles.formDropdownItemActive,
                      ]}
                      onPress={() => {
                        setHousingType(item);
                        setIsHousingTypeDropdownOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.formDropdownItemText,
                          housingType === item && styles.formDropdownItemTextActive,
                        ]}
                      >
                        {optionLabel(HOUSING_TYPE_OPTIONS, item)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Housing / Barn name * */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                {t('farmer.livestock.detail.housingForm.housingName')} <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TextInput
                style={styles.formTextInput}
                value={housingBarnName}
                testID="housingForm.name"
                onChangeText={setHousingBarnName}
                placeholder=""
                placeholderTextColor={P.twGray400}
              />
            </View>

            {/* Location */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.location')}</Text>
              <TextInput
                style={styles.formTextInput}
                value={housingLocation}
                onChangeText={setHousingLocation}
                placeholder=""
                placeholderTextColor={P.twGray400}
              />
            </View>

            {/* Indoor space per animal * */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                {t('farmer.livestock.detail.field.indoorSpace')} <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <View style={styles.formRowHalf}>
                <View style={{ flex: 1.5 }}>
                  <TextInput
                    style={styles.formTextInput}
                    value={indoorSpace}
                    testID="housingForm.indoorSpace"
                    onChangeText={setIndoorSpace}
                    keyboardType="decimal-pad"
                    placeholder=""
                    placeholderTextColor={P.twGray400}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <TouchableOpacity
                    style={styles.formDropdownTrigger}
                    onPress={() => setIsIndoorSpaceUnitDropdownOpen(!isIndoorSpaceUnitDropdownOpen)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.livestock.detail.a11y.selectIndoorSpaceUnit')}
                  >
                    <Text style={styles.formDropdownSelectedText}>{optionLabel(SPACE_UNIT_OPTIONS, indoorSpaceUnit)}</Text>
                    <FormChevronDownIcon size={18} color={P.twGray500} />
                  </TouchableOpacity>
                  {isIndoorSpaceUnitDropdownOpen && (
                    <View style={styles.formDropdownMenu}>
                      {optionValues(SPACE_UNIT_OPTIONS).map((opt) => (
                        <TouchableOpacity
                          key={opt}
                          style={[
                            styles.formDropdownItem,
                            indoorSpaceUnit === opt && styles.formDropdownItemActive,
                          ]}
                          onPress={() => {
                            setIndoorSpaceUnit(opt);
                            setIsIndoorSpaceUnitDropdownOpen(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.formDropdownItemText,
                              indoorSpaceUnit === opt && styles.formDropdownItemTextActive,
                            ]}
                          >
                            {optionLabel(SPACE_UNIT_OPTIONS, opt)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Outdoor / grazing space * */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                {t('farmer.livestock.detail.housingForm.outdoorSpace')} <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <View style={styles.formRowHalf}>
                <View style={{ flex: 1.5 }}>
                  <TextInput
                    style={styles.formTextInput}
                    value={outdoorSpace}
                    testID="housingForm.outdoorSpace"
                    onChangeText={setOutdoorSpace}
                    keyboardType="decimal-pad"
                    placeholder=""
                    placeholderTextColor={P.twGray400}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <TouchableOpacity
                    style={styles.formDropdownTrigger}
                    onPress={() => setIsOutdoorSpaceUnitDropdownOpen(!isOutdoorSpaceUnitDropdownOpen)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.livestock.detail.a11y.selectOutdoorSpaceUnit')}
                  >
                    <Text style={styles.formDropdownSelectedText}>{optionLabel(SPACE_UNIT_OPTIONS, outdoorSpaceUnit)}</Text>
                    <FormChevronDownIcon size={18} color={P.twGray500} />
                  </TouchableOpacity>
                  {isOutdoorSpaceUnitDropdownOpen && (
                    <View style={styles.formDropdownMenu}>
                      {optionValues(SPACE_UNIT_OPTIONS).map((opt) => (
                        <TouchableOpacity
                          key={opt}
                          style={[
                            styles.formDropdownItem,
                            outdoorSpaceUnit === opt && styles.formDropdownItemActive,
                          ]}
                          onPress={() => {
                            setOutdoorSpaceUnit(opt);
                            setIsOutdoorSpaceUnitDropdownOpen(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.formDropdownItemText,
                              outdoorSpaceUnit === opt && styles.formDropdownItemTextActive,
                            ]}
                          >
                            {optionLabel(SPACE_UNIT_OPTIONS, opt)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Start date * */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                {t('farmer.livestock.detail.field.startDate')} <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <View style={styles.formInputContainer}>
                <FormCalendarIcon size={18} color={P.twGray500} />
                <TextInput
                  style={styles.formInputWithIcon}
                  value={housingStartDate}
                  testID="housingForm.startDate"
                  onChangeText={setHousingStartDate}
                  placeholder=""
                  placeholderTextColor={P.twGray400}
                />
              </View>
            </View>

            {/* Notes */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.notes')}</Text>
              <TextInput
                style={styles.formNotesInput}
                value={housingNotes}
                onChangeText={setHousingNotes}
                placeholder=""
                placeholderTextColor={P.twGray400}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Attachment Document */}
            <View style={styles.formGroup}>
              <View style={styles.attachmentLabelRow}>
                <AttachmentPaperclipIcon size={16} color={P.twGray600} />
                <Text style={styles.formLabel}>{t('farmer.livestock.detail.attachment.title')}</Text>
              </View>
              <TouchableOpacity
                style={styles.attachmentAddBox}
                onPress={() => void handlePickAttachment(setHousingAttachment, setHousingErrors)}
                testID="housingForm.attach"
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t('farmer.livestock.detail.attachment.add')}
              >
                <View style={styles.attachmentAddBoxInner}>
                  <View style={styles.attachmentAddCircleBtn}>
                    <FormPlusIcon size={18} color={colors.brandGreen} />
                  </View>
                  <View>
                    <Text style={styles.attachmentAddTitle}>{t('farmer.livestock.detail.attachment.add')}</Text>
                    <Text style={styles.attachmentAddSubtitle}>{t('farmer.livestock.detail.attachment.hint')}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {housingAttachment && (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t('farmer.livestock.detail.attachment.label')}</Text>
                <View style={styles.attachmentCard}>
                  <View style={styles.attachmentLeft}>
                    <ReceiptDocIcon size={36} />
                    <View style={styles.attachmentMetaCol}>
                      <Text style={styles.attachmentFilename}>{housingAttachment.name}</Text>
                      <Text style={styles.attachmentSize}>{attachmentSizeLabel(housingAttachment)}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.attachmentRemoveBtn}
                    onPress={() => setHousingAttachment(null)}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.livestock.detail.attachment.remove')}
                  >
                    <FormCloseIcon size={16} color={P.twGray600} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* + Add Housing button */}
            <TouchableOpacity
              style={styles.addFeedItemBtn}
              onPress={() => void handleSaveHousingDetails()}
              disabled={saving}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.livestock.detail.housing.addRecord')}
            >
              <PlusCircleOutlineIcon size={18} color={colors.brandGreen} />
              <Text style={styles.addFeedItemBtnText}>{t('farmer.livestock.detail.housing.addRecord')}</Text>
            </TouchableOpacity>

            <FormErrors errors={housingErrors} testID="housingForm.errors" />

            {/* Form Bottom Action Buttons */}
            <View style={styles.modalActionButtonsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsAddHousingModalVisible(false)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={t('farmer.livestock.detail.common.cancel')}
              >
                <Text style={styles.cancelBtnText}>{t('farmer.livestock.detail.common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnBusy]}
                onPress={() => void handleSaveHousingDetails()}
                disabled={saving}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ disabled: saving, busy: saving }}
                accessibilityLabel={t('farmer.livestock.detail.common.save')}
                testID="housingForm.save"
              >
                <View style={styles.saveBtnRow}>
                  <FormCheckmarkIcon size={18} color={P.white} />
                  <Text style={styles.saveBtnText}>
                    {saving ? t('farmer.livestock.detail.common.saving') : t('farmer.livestock.detail.common.save')}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 6: ADD DAILY FEED LOG (POST .../feed-logs)                   */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={isAddFeedLogModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsAddFeedLogModalVisible(false)}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalBackBtn}
              onPress={() => setIsAddFeedLogModalVisible(false)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.livestock.detail.a11y.back')}
            >
              <GreenBackArrowIcon size={24} color={P.deepGreen} />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>{t('farmer.livestock.detail.feed.addLog')}</Text>
          </View>

          <ScrollView
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Feeding date * */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                {t('farmer.livestock.detail.field.fedOn')} <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <View style={styles.formInputContainer}>
                <FormCalendarIcon size={18} color={P.twGray500} />
                <TextInput
                  style={styles.formInputWithIcon}
                  value={feedLogDate}
                  testID="feedLogForm.date"
                  onChangeText={setFeedLogDate}
                  placeholder={t('farmer.livestock.detail.common.datePlaceholder')}
                  placeholderTextColor={P.twGray400}
                />
              </View>
            </View>

            {/* Feed type * (dropdown of the API enum, translated labels) */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                {t('farmer.livestock.detail.field.feedType')} <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.formDropdownTrigger}
                onPress={() => setIsFeedLogTypeDropdownOpen(!isFeedLogTypeDropdownOpen)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={t('farmer.livestock.detail.field.feedType')}
                testID="feedLogForm.feedTypeTrigger"
              >
                <Text style={styles.formDropdownSelectedText}>{optionLabel(FEED_TYPE_OPTIONS, feedLogType)}</Text>
                <FormChevronDownIcon size={18} color={P.twGray500} />
              </TouchableOpacity>
              {isFeedLogTypeDropdownOpen && (
                <View style={styles.formDropdownMenu}>
                  {optionValues(FEED_TYPE_OPTIONS).map((value) => (
                    <TouchableOpacity
                      key={value}
                      style={[styles.formDropdownItem, feedLogType === value && styles.formDropdownItemActive]}
                      onPress={() => {
                        setFeedLogType(value);
                        setIsFeedLogTypeDropdownOpen(false);
                      }}
                      testID={`feedLogForm.feedType:${value}`}
                    >
                      <Text style={[styles.formDropdownItemText, feedLogType === value && styles.formDropdownItemTextActive]}>
                        {optionLabel(FEED_TYPE_OPTIONS, value)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Quantity * + unit * */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                {t('farmer.livestock.detail.field.quantity')} <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <View style={styles.formRowHalf}>
                <View style={styles.formFlexWide}>
                  <TextInput
                    style={styles.formTextInput}
                    value={feedLogQuantity}
                    testID="feedLogForm.quantity"
                    onChangeText={setFeedLogQuantity}
                    keyboardType="decimal-pad"
                    placeholderTextColor={P.twGray400}
                  />
                </View>
                <View style={styles.formFlexNarrow}>
                  <TouchableOpacity
                    style={styles.formDropdownTrigger}
                    onPress={() => setIsFeedLogUnitDropdownOpen(!isFeedLogUnitDropdownOpen)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.livestock.detail.field.unit')}
                    testID="feedLogForm.unitTrigger"
                  >
                    <Text style={styles.formDropdownSelectedText}>{optionLabel(FEED_LOG_UNIT_OPTIONS, feedLogUnit)}</Text>
                    <FormChevronDownIcon size={18} color={P.twGray500} />
                  </TouchableOpacity>
                  {isFeedLogUnitDropdownOpen && (
                    <View style={styles.formDropdownMenu}>
                      {optionValues(FEED_LOG_UNIT_OPTIONS).map((value) => (
                        <TouchableOpacity
                          key={value}
                          style={[styles.formDropdownItem, feedLogUnit === value && styles.formDropdownItemActive]}
                          onPress={() => {
                            setFeedLogUnit(value);
                            setIsFeedLogUnitDropdownOpen(false);
                          }}
                          testID={`feedLogForm.unit:${value}`}
                        >
                          <Text
                            style={[styles.formDropdownItemText, feedLogUnit === value && styles.formDropdownItemTextActive]}
                          >
                            {optionLabel(FEED_LOG_UNIT_OPTIONS, value)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Notes */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.notes')}</Text>
              <TextInput
                style={styles.formNotesInput}
                value={feedLogNotes}
                testID="feedLogForm.notes"
                onChangeText={setFeedLogNotes}
                placeholderTextColor={P.twGray400}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <FormErrors errors={feedLogErrors} testID="feedLogForm.errors" />

            <View style={styles.modalActionButtonsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsAddFeedLogModalVisible(false)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={t('farmer.livestock.detail.common.cancel')}
                testID="feedLogForm.cancel"
              >
                <Text style={styles.cancelBtnText}>{t('farmer.livestock.detail.common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnBusy]}
                onPress={() => void handleSaveFeedLog()}
                disabled={saving}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ disabled: saving, busy: saving }}
                accessibilityLabel={t('farmer.livestock.detail.common.save')}
                testID="feedLogForm.save"
              >
                <View style={styles.saveBtnRow}>
                  <FormCheckmarkIcon size={18} color={P.white} />
                  <Text style={styles.saveBtnText}>
                    {saving ? t('farmer.livestock.detail.common.saving') : t('farmer.livestock.detail.common.save')}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 7: ADD HYGIENE LOG (POST .../hygiene-logs)                   */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={isAddHygieneModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsAddHygieneModalVisible(false)}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalBackBtn}
              onPress={() => setIsAddHygieneModalVisible(false)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.livestock.detail.a11y.back')}
            >
              <GreenBackArrowIcon size={24} color={P.deepGreen} />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>{t('farmer.livestock.detail.housing.addHygiene')}</Text>
          </View>

          <ScrollView
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Activity * */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                {t('farmer.livestock.detail.field.activity')} <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TextInput
                style={styles.formTextInput}
                value={hygieneActivity}
                testID="hygieneForm.activity"
                onChangeText={setHygieneActivity}
                placeholder={t('farmer.livestock.detail.hygieneForm.activityPlaceholder')}
                placeholderTextColor={P.twGray400}
              />
            </View>

            {/* Date performed * */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                {t('farmer.livestock.detail.field.performedOn')} <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <View style={styles.formInputContainer}>
                <FormCalendarIcon size={18} color={P.twGray500} />
                <TextInput
                  style={styles.formInputWithIcon}
                  value={hygieneDate}
                  testID="hygieneForm.date"
                  onChangeText={setHygieneDate}
                  placeholder={t('farmer.livestock.detail.common.datePlaceholder')}
                  placeholderTextColor={P.twGray400}
                />
              </View>
            </View>

            {/* Notes */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.notes')}</Text>
              <TextInput
                style={styles.formNotesInput}
                value={hygieneNotes}
                testID="hygieneForm.notes"
                onChangeText={setHygieneNotes}
                placeholderTextColor={P.twGray400}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <FormErrors errors={hygieneErrors} testID="hygieneForm.errors" />

            <View style={styles.modalActionButtonsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsAddHygieneModalVisible(false)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={t('farmer.livestock.detail.common.cancel')}
                testID="hygieneForm.cancel"
              >
                <Text style={styles.cancelBtnText}>{t('farmer.livestock.detail.common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnBusy]}
                onPress={() => void handleSaveHygieneLog()}
                disabled={saving}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ disabled: saving, busy: saving }}
                accessibilityLabel={t('farmer.livestock.detail.common.save')}
                testID="hygieneForm.save"
              >
                <View style={styles.saveBtnRow}>
                  <FormCheckmarkIcon size={18} color={P.white} />
                  <Text style={styles.saveBtnText}>
                    {saving ? t('farmer.livestock.detail.common.saving') : t('farmer.livestock.detail.common.save')}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Flex ratios for a value + unit row in the feed-log modal (ratios, not spacing).
  formFlexWide: { flex: 1.5 },
  formFlexNarrow: { flex: 1 },
  // ── Real-data states (loading / error / show more / form errors) ──
  screenLoading: {
    padding: spacing.input,
    gap: spacing.md,
  },
  screenError: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  showMoreBtn: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  formErrorBox: {
    backgroundColor: P.twRed50,
    borderColor: P.twRed200,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  formErrorTitle: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.twRed700,
  },
  formErrorText: {
    fontSize: typography.bodySmall,
    color: P.twRed700,
  },
  restrictedText: {
    fontSize: typography.bodySmall,
    fontWeight: '600',
    color: P.twOrange700,
    marginTop: spacing.xs,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  saveBtnBusy: {
    opacity: 0.7,
  },
  attachmentAddBoxDisabled: {
    opacity: 0.6,
  },
  attachmentDisabledCol: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: P.white,
  },
  container: {
    flex: 1,
    backgroundColor: P.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
    backgroundColor: P.white,
  },
  circleHeaderBtn: {
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
  headerTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: P.nearBlack,
    letterSpacing: -0.2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },

  // Profile Header Card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatarCircle: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: P.paleCreamBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBadgeDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: P.twOrange600,
    borderWidth: 2,
    borderColor: P.white,
  },
  profileInfoCol: {
    flex: 1,
  },
  profileCode: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.twGray700,
    marginBottom: 2,
  },
  profileSubtitle: {
    fontSize: typography.body,
    color: P.twGray500,
  },
  statusBadgePill: {
    backgroundColor: colors.brandGreenLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: colors.brandGreen,
  },

  // Horizontal Tabs
  tabScrollView: {
    marginBottom: 10,
  },
  tabScrollContent: {
    gap: 8,
    paddingVertical: 2,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: P.twGray100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  tabButtonActive: {
    backgroundColor: colors.brandGreen,
  },
  tabButtonText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray700,
  },
  tabButtonTextActive: {
    color: P.white,
  },

  // Scroll Indicator Bar
  scrollIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  arrowTriangleLeft: {
    width: 0,
    height: 0,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderRightWidth: 6,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: P.twGray400,
  },
  arrowTriangleRight: {
    width: 0,
    height: 0,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderLeftWidth: 6,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: P.twGray400,
  },
  sliderTrack: {
    width: 140,
    height: 6,
    borderRadius: 3,
    backgroundColor: P.twGray200,
    overflow: 'hidden',
  },
  sliderThumb: {
    width: 80,
    height: 6,
    borderRadius: 3,
    backgroundColor: P.twGray500,
  },

  // Generic Containers
  tabContentContainer: {
    gap: 12,
  },
  sectionHeaderTitle: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.twGray500,
    letterSpacing: 0.8,
    marginTop: 8,
  },
  whiteCardContainer: {
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  greenIconSquare: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.brandGreenLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tanIconSquare: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: P.paleCreamBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  blueIconSquare: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: P.blue50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemMainCol: {
    flex: 1,
  },
  itemTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.nearBlack,
  },
  itemSubtitle: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    marginTop: 2,
  },
  itemAmountBold: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.nearBlack,
  },
  dueDateBadge: {
    backgroundColor: P.twGray100,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  dueDateBadgeText: {
    fontSize: typography.bodySmall,
    fontWeight: '600',
    color: P.twGray600,
  },
  dividerLine: {
    height: 1,
    backgroundColor: P.twGray100,
    marginVertical: 8,
  },

  // ── Health Styles ──
  organicNoticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: P.sageTintBg,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: P.sageBorder,
  },
  organicNoticeIconCol: {
    marginTop: 1,
  },
  organicNoticeText: {
    flex: 1,
    fontSize: typography.bodySmall,
    lineHeight: 18,
    color: P.twGray700,
    fontWeight: '500',
  },
  withdrawalAlertCard: {
    flexDirection: 'row',
    backgroundColor: P.twOrange50,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: P.twOrange200,
  },
  withdrawalLeftAccentBar: {
    width: 4,
    backgroundColor: P.twOrange600,
  },
  withdrawalCardInner: {
    flex: 1,
    padding: 14,
    gap: 4,
  },
  withdrawalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  withdrawalTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.twOrange700,
  },
  withdrawalBody: {
    fontSize: typography.bodySmall,
    color: P.twGray600,
    lineHeight: 18,
    paddingLeft: 27,
  },
  boldText: {
    fontWeight: '700',
    color: P.nearBlack,
  },
  checkupCardContent: {
    paddingVertical: 4,
    gap: 6,
  },
  checkupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkupTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkupTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.nearBlack,
  },
  checkupDoctor: {
    fontSize: typography.bodySmall,
    color: P.twGray400,
  },
  checkupDescription: {
    fontSize: typography.bodySmall,
    color: P.twGray600,
    lineHeight: 18,
    marginTop: 2,
  },

  // ── Feed Styles ──
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  tableLabel: {
    fontSize: typography.body,
    color: P.twGray500,
  },
  tableValueBold: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.nearBlack,
  },
  waterSourceValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footnoteCaption: {
    fontSize: typography.bodySmall,
    color: P.twGray400,
    lineHeight: 16,
    paddingHorizontal: 4,
    marginTop: -2,
  },

  // ── Breeding Styles ──
  cycleTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  pregnantBadgePill: {
    backgroundColor: colors.brandGreenLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  pregnantBadgeText: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: colors.brandGreen,
  },
  cycleCountText: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    fontWeight: '500',
  },
  cycleGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cycleGridCol: {
    flex: 1,
    gap: 2,
  },
  cycleGridLabel: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
  },
  cycleGridValBold: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.nearBlack,
    marginTop: 2,
  },
  cycleGridSubtext: {
    fontSize: typography.bodySmall,
    color: P.twGray400,
  },
  cycleGridCountdown: {
    fontSize: typography.bodySmall,
    color: colors.brandGreen,
    fontWeight: '600',
  },
  calvingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  calvingTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.nearBlack,
  },
  calvingDescription: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    marginBottom: 14,
  },
  registerOffspringBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: colors.brandGreen,
    borderRadius: 12,
    paddingVertical: 11,
    backgroundColor: P.white,
  },
  registerOffspringBtnText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.brandGreen,
  },

  // ── Production Styles ──
  yieldSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  yieldSummaryLabel: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
  },
  gradeBadgePill: {
    backgroundColor: colors.brandGreenLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  gradeBadgeText: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: colors.brandGreen,
  },
  yieldNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 8,
  },
  yieldBigNumber: {
    fontSize: typography.headline,
    fontWeight: '700',
    color: P.nearBlack,
  },
  yieldUnitText: {
    fontSize: typography.bodyLarge,
    fontWeight: '600',
    color: P.twGray500,
  },
  sparklineContainer: {
    height: 36,
    marginVertical: 4,
  },
  last7DaysText: {
    fontSize: typography.bodySmall,
    color: P.twGray400,
    marginTop: 4,
  },
  productionAlertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: P.twOrange50,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: P.twOrange200,
  },
  productionAlertText: {
    fontSize: typography.bodySmall,
    fontWeight: '600',
    color: P.twOrange700,
  },

  // ── Housing Styles ──
  housingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  housingHeaderTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.nearBlack,
  },
  housingBoxesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  housingMetricBox: {
    flex: 1,
    backgroundColor: P.twGray50,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: P.twGray100,
  },
  metricValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  metricValNumber: {
    fontSize: typography.title,
    fontWeight: '700',
    color: P.nearBlack,
  },
  metricValUnit: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    fontWeight: '500',
  },
  metricValLabel: {
    fontSize: typography.bodySmall,
    color: P.twGray400,
    marginTop: 4,
  },
  welfareNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: P.sageTintBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: P.sageBorder,
  },
  welfareNoticeCol: {
    flex: 1,
    gap: 2,
  },
  welfareNoticeTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.brandGreen,
  },
  welfareNoticeSubtitle: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
  },
  // BR-140 "below the standard": the same orange warning family as the withdrawal alert.
  housingWarningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: P.twOrange50,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: P.twOrange200,
  },
  housingWarningTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.twOrange700,
  },
  housingWarningSubtitle: {
    fontSize: typography.bodySmall,
    color: P.twOrange700,
  },
  // BR-140 "not recorded": neutral grey, no verdict colour.
  housingNeutralCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: P.twGray50,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: P.twGray100,
  },
  housingNeutralTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.twGray600,
  },
  cycleNumberText: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.twGray600,
    marginBottom: spacing.sm,
  },

  // ── Health Top Bar ──
  healthTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    marginBottom: 6,
  },
  healthTopBarTitleCol: {
    flex: 1,
  },
  healthTopBarTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.nearBlack,
  },
  healthTopBarSubtitle: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    marginTop: 1,
  },
  addHealthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.brandGreen,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: colors.brandGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  addHealthButtonText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.white,
  },

  // ── Add Health Record Modal Styles ──
  modalSafeArea: {
    flex: 1,
    backgroundColor: P.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
    gap: 12,
  },
  modalBackBtn: {
    padding: 4,
    marginLeft: -4,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: P.twGray900,
  },
  modalScrollView: {
    flex: 1,
    backgroundColor: P.white,
  },
  modalScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 36,
    gap: 14,
  },
  modalAnimalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 16,
    padding: 12,
    gap: 12,
  },
  modalAvatarContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalAnimalInfoCol: {
    flex: 1,
  },
  modalAnimalName: {
    fontSize: 16,
    fontWeight: '700',
    color: P.nearBlack,
    marginBottom: 2,
  },
  modalAnimalSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalAnimalSubtitle: {
    fontSize: 12,
    color: P.twGray500,
  },
  formGroup: {
    gap: 6,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: P.twGray700,
  },
  requiredAsterisk: {
    color: P.twRed600,
    fontWeight: '700',
  },
  formDropdownPlaceholder: {
    fontSize: 15,
    color: P.twGray400,
  },
  formRowHalf: {
    flexDirection: 'row',
    gap: 12,
  },
  yesNoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  yesNoPill: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.twGray100,
    borderWidth: 1,
    borderColor: P.twGray200,
  },
  yesNoPillActive: {
    backgroundColor: colors.brandGreenLight,
    borderColor: colors.brandGreen,
  },
  yesNoPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: P.twGray600,
  },
  yesNoPillTextActive: {
    color: colors.brandGreen,
    fontWeight: '700',
  },
  attachmentLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  attachmentAddBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: P.twGray300,
    borderRadius: 14,
    padding: 16,
    backgroundColor: P.white,
  },
  attachmentAddBoxInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  attachmentAddCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: colors.brandGreen,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.white,
  },
  attachmentAddTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: P.nearBlack,
    marginBottom: 2,
  },
  attachmentAddSubtitle: {
    fontSize: 12,
    color: P.twGray500,
  },
  modalAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: P.paleCreamBg,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  modalAvatarDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: P.twOrange600,
  },
  sectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: P.twGreen50,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 14,
  },
  sectionBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: P.twGray800,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginTop: 6,
    marginBottom: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: P.twGray400,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.white,
  },
  radioCircleSelected: {
    borderColor: colors.brandGreen,
  },
  radioInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.brandGreen,
  },
  radioLabel: {
    fontSize: 14,
    color: P.twGray800,
    fontWeight: '500',
  },
  chipDropdownTrigger: {
    height: 48,
    borderWidth: 1,
    borderColor: P.twGray300,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: P.white,
  },
  chipWrapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.twGray200,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 6,
  },
  tagChipText: {
    fontSize: 13,
    color: P.twGray800,
    fontWeight: '500',
  },
  tagChipClose: {
    padding: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 8,
  },
  sectionHeaderAddText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.brandGreen,
  },
  modalStatusBadgePill: {
    backgroundColor: colors.brandGreenLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modalStatusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brandGreen,
  },
  formInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: P.twGray300,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: P.white,
  },
  formInputWithIcon: {
    flex: 1,
    fontSize: 15,
    color: P.nearBlack,
    paddingVertical: 0,
    paddingLeft: 8,
  },
  formTextInput: {
    height: 48,
    borderWidth: 1,
    borderColor: P.twGray300,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: P.nearBlack,
    backgroundColor: P.white,
  },
  formDropdownTrigger: {
    height: 48,
    borderWidth: 1,
    borderColor: P.twGray300,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: P.white,
  },
  formDropdownSelectedText: {
    fontSize: 15,
    color: P.nearBlack,
  },
  formDropdownMenu: {
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
    elevation: 3,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  formDropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  formDropdownItemActive: {
    backgroundColor: colors.brandGreenLight,
  },
  formDropdownItemText: {
    fontSize: 14,
    color: P.twGray800,
  },
  formDropdownItemTextActive: {
    color: colors.brandGreen,
    fontWeight: '700',
  },
  doseRow: {
    flexDirection: 'row',
    gap: 10,
  },
  doseValueContainer: {
    flex: 1.8,
  },
  doseUnitContainer: {
    flex: 1.2,
    height: 48,
    borderWidth: 1,
    borderColor: P.twGray300,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: P.white,
  },
  formNotesInput: {
    height: 80,
    borderWidth: 1,
    borderColor: P.twGray300,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: P.nearBlack,
    backgroundColor: P.white,
  },
  attachmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: P.twGray50,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 12,
    padding: 10,
  },
  attachmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  attachmentMetaCol: {
    flex: 1,
  },
  attachmentFilename: {
    fontSize: 13,
    fontWeight: '600',
    color: P.nearBlack,
  },
  attachmentSize: {
    fontSize: 12,
    color: P.twGray500,
    marginTop: 2,
  },
  attachmentRemoveBtn: {
    padding: 8,
  },
  attachmentUploadBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: P.twGray300,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.twGray50,
  },
  attachmentUploadText: {
    fontSize: 13,
    color: colors.brandGreen,
    fontWeight: '600',
  },
  saveBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalActionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    marginBottom: 16,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: P.twGray300,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.white,
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: P.twGray700,
  },
  saveBtn: {
    flex: 1,
    height: 48,
    backgroundColor: colors.brandGreen,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: P.white,
  },
  feedItemsContainer: {
    backgroundColor: P.paleSkyBg,
    borderRadius: 14,
    padding: 14,
    marginTop: 6,
  },
  feedItemBlock: {
    marginBottom: 10,
  },
  feedItemNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: P.nearBlack,
    marginBottom: 6,
  },
  feedItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  feedItemDeleteBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: P.red50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addFeedItemBtn: {
    height: 48,
    borderWidth: 1.5,
    borderColor: colors.brandGreen,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: P.white,
    marginTop: 6,
    marginBottom: 14,
  },
  addFeedItemBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.brandGreen,
  },
  restrictionToggleRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  restrictionToggleBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.twGray300,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restrictionToggleBtnActive: {
    backgroundColor: colors.brandGreen,
    borderColor: colors.brandGreen,
  },
  restrictionToggleBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: P.nearBlack,
  },
  restrictionToggleBtnTextActive: {
    color: P.white,
  },
});
