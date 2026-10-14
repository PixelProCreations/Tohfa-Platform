import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { ErrorState, Skeleton } from '@tohfa/mobile-ui';
import { authPalette as P, colors, typography } from '../../../theme';
import { t } from '../../../../../i18n/farmer';
import { extractFieldErrors, formatErrorMessage } from '../../../../../shell/api/client';
import {
  createProductionLog,
  listAnimals,
  listProductionLogs,
  DAIRY_PRODUCT_UNITS,
  type AnimalResponse,
  type DairyProductType as ApiDairyProductType,
  type ProductionLogResponse,
} from '../../../api/livestock';

// ─────────────────────────────────────────────
// Inline SVG Icons
// ─────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = P.twGray800 }: { size?: number; color?: string }) {
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

function DropIcon({ size = 20, color = colors.brandGreen, fill }: { size?: number; color?: string; fill?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill || 'none'}
      />
    </Svg>
  );
}

function EggIcon({ size = 20, color = P.twAmber700, fill }: { size?: number; color?: string; fill?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3C8.5 3 5.5 8.5 5.5 14.5a6.5 6.5 0 0 0 13 0C18.5 8.5 15.5 3 12 3z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill || 'none'}
      />
    </Svg>
  );
}

function CurdIcon({ size = 20, color = P.twBlue600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 10c0 5 3.5 9 8 9s8-4 8-9H4z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M7 6c1.5 2 3.5 2 5 0s3.5-2 5 0" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="10" x2="20" y2="10" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function PaneerIcon({ size = 20, color = P.twAmber600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="5" width="16" height="14" rx="3" stroke={color} strokeWidth="2" />
      <Path d="M4 12h16M12 5v14" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function ButterIcon({ size = 20, color = P.amberDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 13l4-7h10l4 7v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M7 6v7M17 6v7" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function GheeIcon({ size = 20, color = P.twOrange600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9c0-2.2 2.7-4 6-4s6 1.8 6 4v9a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V9z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path d="M8 5V3h8v2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="12" cy="14" r="2.5" fill={color} />
    </Svg>
  );
}

function ButtermilkIcon({ size = 20, color = P.sky600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 3h10l-1.5 15a3 3 0 0 1-3 2.8h-1a3 3 0 0 1-3-2.8L7 3z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 8h6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="12" cy="13" r="1.5" fill={color} />
    </Svg>
  );
}

function CheeseIcon({ size = 20, color = P.pink800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 18h16a1 1 0 0 0 1-1V8.5L12 4 3 11v6a1 1 0 0 0 1 1z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="8" cy="13" r="1.5" fill={color} />
      <Circle cx="14" cy="11" r="1.2" fill={color} />
      <Circle cx="16" cy="15" r="1.5" fill={color} />
    </Svg>
  );
}

function CowIcon({ size = 22, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M7 10h.01M17 10h.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M9 14h6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M3 6L1 4M21 6l2-2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="10" cy="14" r="1" fill={color} />
      <Circle cx="14" cy="14" r="1" fill={color} />
    </Svg>
  );
}

function PawIcon({ size = 20, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="15" r="4.2" fill={color} />
      <Circle cx="6.5" cy="10" r="2" fill={color} />
      <Circle cx="10" cy="5.5" r="2" fill={color} />
      <Circle cx="14" cy="5.5" r="2" fill={color} />
      <Circle cx="17.5" cy="10" r="2" fill={color} />
    </Svg>
  );
}

function InfoCircleIcon({ size = 18, color = P.sky600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Line x1="12" y1="16" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="12" cy="8" r="1" fill={color} />
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

function ChevronRightIcon({ size = 16, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckIcon({ size = 18, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PlusIcon({ size = 18, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Types & Product Meta
// ─────────────────────────────────────────────

export type DairyProductType =
  | 'milk'
  | 'curd'
  | 'paneer'
  | 'butter'
  | 'ghee'
  | 'buttermilk'
  | 'cheese'
  | 'eggs';

export interface DairyProductMeta {
  id: DairyProductType;
  title: string;
  category: string;
  unit: string;
  defaultUnitLabel: string;
  subtitle: string;
  badgeBg: string;
  accentColor: string;
}

export const DAIRY_PRODUCTS: DairyProductMeta[] = [
  {
    id: 'milk',
    title: 'Fresh Milk',
    category: 'Fresh Dairy',
    unit: 'L',
    defaultUnitLabel: 'Liters',
    subtitle: 'Cow, goat, or buffalo milking session yield',
    badgeBg: colors.brandGreenLight,
    accentColor: colors.brandGreen,
  },
  {
    id: 'curd',
    title: 'Curd / Dahi',
    category: 'Cultured Dairy',
    unit: 'Kg',
    defaultUnitLabel: 'Kg',
    subtitle: 'Fresh homemade or farm-cultured curd batch',
    badgeBg: P.twBlue50,
    accentColor: P.twBlue600,
  },
  {
    id: 'paneer',
    title: 'Paneer (Cottage Cheese)',
    category: 'Fresh Cheese',
    unit: 'Kg',
    defaultUnitLabel: 'Kg',
    subtitle: 'Fresh soft curd or pressed paneer blocks',
    badgeBg: P.twAmber100,
    accentColor: P.twAmber600,
  },
  {
    id: 'butter',
    title: 'Butter / Makhan',
    category: 'Churned Dairy',
    unit: 'Kg',
    defaultUnitLabel: 'Kg',
    subtitle: 'Traditional bilona or cultured fresh butter',
    badgeBg: P.twAmber100,
    accentColor: P.amberDeep,
  },
  {
    id: 'ghee',
    title: 'Desi Ghee (Clarified Butter)',
    category: 'Artisanal Dairy',
    unit: 'L',
    defaultUnitLabel: 'Liters',
    subtitle: 'Slow-cooked aromatic pure cow or buffalo ghee',
    badgeBg: P.twOrange100,
    accentColor: P.twOrange600,
  },
  {
    id: 'buttermilk',
    title: 'Buttermilk / Chaas / Moru',
    category: 'Dairy Beverage',
    unit: 'L',
    defaultUnitLabel: 'Liters',
    subtitle: 'Fresh seasoned or plain churned buttermilk',
    badgeBg: P.sky100,
    accentColor: P.sky600,
  },
  {
    id: 'cheese',
    title: 'Farm Cheese',
    category: 'Artisanal Cheese',
    unit: 'Kg',
    defaultUnitLabel: 'Kg',
    subtitle: 'Artisanal cheddar, mozzarella, or goat cheese',
    badgeBg: P.palePinkBg,
    accentColor: P.pink800,
  },
  {
    id: 'eggs',
    title: 'Eggs (Poultry / Country)',
    category: 'Poultry Produce',
    unit: 'Eggs',
    defaultUnitLabel: 'Count',
    subtitle: 'Daily flock egg collection & harvest count',
    badgeBg: P.twAmber100,
    accentColor: P.twAmber700,
  },
];

/** Local product ids -> the real backend enum (livestock.schema.ts). */
const PRODUCT_TYPE_TO_API: Record<DairyProductType, ApiDairyProductType> = {
  milk: 'MILK',
  curd: 'CURD',
  paneer: 'PANEER',
  butter: 'BUTTER',
  ghee: 'GHEE',
  buttermilk: 'BUTTERMILK',
  cheese: 'CHEESE',
  eggs: 'EGGS',
};

const API_PRODUCT_TYPE_TO_LOCAL: Record<ApiDairyProductType, DairyProductType> = {
  MILK: 'milk',
  CURD: 'curd',
  PANEER: 'paneer',
  BUTTER: 'butter',
  GHEE: 'ghee',
  BUTTERMILK: 'buttermilk',
  CHEESE: 'cheese',
  EGGS: 'eggs',
};

/** `CATTLE`/`BUFFALO` display as "Cow" in this screen's milking UI, matching
 *  how a dairy farmer actually talks about their herd; `GOAT` stays "Goat". */
function dairyAnimalTypeLabel(species: AnimalResponse['species']): 'Cow' | 'Goat' | 'Buffalo' {
  if (species === 'GOAT') return 'Goat';
  if (species === 'BUFFALO') return 'Buffalo';
  return 'Cow';
}

function dairyAnimalIconType(species: AnimalResponse['species']): 'cow' | 'paw' {
  return species === 'GOAT' ? 'paw' : 'cow';
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

function formatLogDate(iso: string): string {
  if (iso === todayIso()) return 'Today';
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const d = parseIsoDate(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function formatLogTime(createdAt: string): string {
  return new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** A raw production log -> the produce-history row this screen renders,
 *  resolving the animal's display name (milk logs only -- eggs/value-added
 *  logs carry no `animalId`) against whichever animal list the caller has
 *  in hand at that moment. */
function toHistoryLog(log: ProductionLogResponse, animalsList: AnimalResponse[]): ProduceHistoryLog {
  const localType = API_PRODUCT_TYPE_TO_LOCAL[log.productType];
  const meta = DAIRY_PRODUCTS.find((p) => p.id === localType);
  const animal = log.animalId ? animalsList.find((a) => a.id === log.animalId) : undefined;
  return {
    id: log.id,
    productType: localType,
    title: animal ? (animal.name ?? animal.tag) : (meta?.title ?? log.productType),
    subtitle: log.notes ?? log.batchInfo ?? (log.sessions ? `${log.sessions} sessions` : ''),
    quantityFormatted: `${log.quantity} ${meta?.unit ?? log.unit}`,
    time: formatLogTime(log.createdAt),
    date: formatLogDate(log.loggedOn),
  };
}

interface AnimalMilkItem {
  id: string;
  name: string;
  breed: string;
  type: 'Cow' | 'Goat' | 'Buffalo';
  yieldLiters: number;
  sessions: number;
  iconType: 'cow' | 'paw';
}

interface ValueAddedProduceItem {
  id: string;
  type: DairyProductType;
  name: string;
  quantity: number;
  unit: string;
  batchInfo: string;
  date: string;
}

// Note: the mock's `hensCount` was purely decorative -- never actually
// rendered anywhere in this screen's JSX (only ever assigned/read
// internally) -- and livestock_animals has no such field, so it is dropped
// here rather than invented on the backend (root CLAUDE.md's "specification
// gap" doctrine).
interface FlockEggItem {
  id: string;
  name: string;
  subtitle: string;
  count: number;
}

interface ProduceHistoryLog {
  id: string;
  productType: DairyProductType;
  title: string;
  subtitle: string;
  quantityFormatted: string;
  time: string;
  date: string;
}

export interface DairyProduceScreenProps {
  onBack?: () => void;
}

// ─────────────────────────────────────────────
// Component Data Constants
// ─────────────────────────────────────────────

interface AvailableAnimal {
  id: string;
  name: string;
  type: 'Cow' | 'Goat' | 'Buffalo';
  breed: string;
  code: string;
  iconType: 'cow' | 'paw';
}

// No backend concept of a "flock" separate from an animal record — a
// registered POULTRY-species animal (its `tag` as the flock name, its
// `notes` for farmer-entered context such as hen count) IS the flock here,
// the same way one operation's land is one or more registered plots rather
// than a separate entity (root CLAUDE.md's farm-land-locations doctrine).
interface AvailableFlock {
  id: string;
  name: string;
  subtitle: string;
}

const SESSIONS_MILK: string[] = ['Morning (AM)', 'Evening (PM)', 'Afternoon (Noon)'];
const SESSIONS_EGGS: string[] = ['Morning collection', 'Afternoon collection', 'Evening collection'];

const MILK_SOURCES = ['Pure Cow Milk (A2)', 'Pure Buffalo Milk', 'Mixed Farm Dairy', 'Goat Milk'];
const PANEER_TYPES = ['Soft Fresh Curd', 'Firm Pressed Blocks', 'Spiced / Herbed Paneer'];
const BUTTER_TYPES = ['Desi White Makhan', 'Cultured Salted', 'Cultured Unsalted'];
const GHEE_METHODS = ['Traditional Vedic Bilona', 'Direct Cream Simmered', 'Slow Cooked A2'];
const BUTTERMILK_TYPES = ['Plain Churned Chaas', 'Spiced Masala Moru', 'Mint Coriander Refresh'];
const CHEESE_TYPES = ['Farm Mozzarella', 'Mild Cheddar', 'Gouda', 'Fresh Feta / Cottage'];

export function DairyProduceScreen({ onBack }: DairyProduceScreenProps): React.JSX.Element {
  // Real herd data, fetched once on mount.
  const [dairyAnimals, setDairyAnimals] = useState<AnimalResponse[]>([]);
  const [poultryAnimals, setPoultryAnimals] = useState<AnimalResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<unknown | null>(null);

  // Production stats state -- seeded from real data once it loads (see the
  // `load()` effect below), then kept in sync locally as the farmer logs
  // more produce in this session (mirrors how the mock behaved, but backed
  // by the server's own response for each save instead of fabricated deltas).
  const [animals, setAnimals] = useState<AnimalMilkItem[]>([]);
  const [flocks, setFlocks] = useState<FlockEggItem[]>([]);
  const [valueAddedProduce, setValueAddedProduce] = useState<ValueAddedProduceItem[]>([]);
  const [historyLogs, setHistoryLogs] = useState<ProduceHistoryLog[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [animalsResult, logsResult] = await Promise.all([listAnimals(), listProductionLogs()]);
      const dairy = animalsResult.items.filter(
        (a) => a.species === 'CATTLE' || a.species === 'BUFFALO' || a.species === 'GOAT',
      );
      const poultry = animalsResult.items.filter((a) => a.species === 'POULTRY');
      setDairyAnimals(dairy);
      setPoultryAnimals(poultry);

      const today = todayIso();
      const todaysLogs = logsResult.items.filter((log) => log.loggedOn === today);

      // Section 1: milk by animal, today -- real, since milk logs always carry an animalId.
      const milkByAnimal = new Map<string, { yieldLiters: number; sessions: number }>();
      todaysLogs
        .filter((log) => log.productType === 'MILK' && log.animalId)
        .forEach((log) => {
          const key = log.animalId as string;
          const prev = milkByAnimal.get(key) ?? { yieldLiters: 0, sessions: 0 };
          milkByAnimal.set(key, {
            yieldLiters: prev.yieldLiters + log.quantity,
            sessions: prev.sessions + (log.sessions ?? 1),
          });
        });
      setAnimals(
        dairy.map((a) => {
          const stats = milkByAnimal.get(a.id) ?? { yieldLiters: 0, sessions: 0 };
          return {
            id: a.id,
            name: a.name ?? a.tag,
            breed: a.breed ?? '',
            type: dairyAnimalTypeLabel(a.species),
            yieldLiters: stats.yieldLiters,
            sessions: stats.sessions,
            iconType: dairyAnimalIconType(a.species),
          };
        }),
      );

      // Section 3: egg production -- eggs are logged flock-level with no
      // animalId (livestock.schema.ts's createProductionLogBody docblock), so
      // server truth has no per-flock breakdown; each flock starts at 0 and
      // only reflects what gets logged in this session (see handleSaveProductionLog).
      setFlocks(poultry.map((a) => ({ id: a.id, name: a.name ?? a.tag, subtitle: a.notes ?? a.tag, count: 0 })));

      // Section 2: value-added dairy/eggs logged today -- fully real.
      setValueAddedProduce(
        todaysLogs
          .filter((log) => log.productType !== 'MILK')
          .map((log) => {
            const localType = API_PRODUCT_TYPE_TO_LOCAL[log.productType];
            const meta = DAIRY_PRODUCTS.find((p) => p.id === localType);
            return {
              id: log.id,
              type: localType,
              name: meta?.title ?? log.productType,
              quantity: log.quantity,
              unit: meta?.unit ?? log.unit,
              batchInfo: log.notes ?? log.batchInfo ?? '',
              date: 'Today',
            };
          }),
      );

      setHistoryLogs(logsResult.items.map((log) => toHistoryLog(log, animalsResult.items)));
    } catch (err: unknown) {
      setLoadError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Main Log Production dropdown & modal states
  const [isLogProduceDropdownOpen, setIsLogProduceDropdownOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<DairyProductType>('milk');
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);

  // History modal state & filter
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'milk' | 'value_add' | 'eggs'>('all');

  // Dynamic Form State Inputs:
  // 1. Milk
  const [selectedAnimalIndex, setSelectedAnimalIndex] = useState(0);
  const [selectedMilkSession, setSelectedMilkSession] = useState(SESSIONS_MILK[0] ?? 'Morning (AM)');
  const [milkQuantity, setMilkQuantity] = useState('');
  const [fatPercentage, setFatPercentage] = useState('');
  const [isAnimalDropdownOpen, setIsAnimalDropdownOpen] = useState(false);
  const [isMilkSessionDropdownOpen, setIsMilkSessionDropdownOpen] = useState(false);

  // 2. Curd
  const [curdQuantity, setCurdQuantity] = useState('');
  const [curdMilkUsed, setCurdMilkUsed] = useState('');
  const [curdMilkSource, setCurdMilkSource] = useState(MILK_SOURCES[0] ?? 'Pure Cow Milk (A2)');
  const [isCurdSourceDropdownOpen, setIsCurdSourceDropdownOpen] = useState(false);

  // 3. Paneer
  const [paneerQuantity, setPaneerQuantity] = useState('');
  const [paneerMilkUsed, setPaneerMilkUsed] = useState('');
  const [paneerType, setPaneerType] = useState(PANEER_TYPES[1] ?? 'Firm Pressed Blocks');
  const [isPaneerTypeDropdownOpen, setIsPaneerTypeDropdownOpen] = useState(false);

  // 4. Butter
  const [butterQuantity, setButterQuantity] = useState('');
  const [butterType, setButterType] = useState(BUTTER_TYPES[0] ?? 'Desi White Makhan');
  const [isButterTypeDropdownOpen, setIsButterTypeDropdownOpen] = useState(false);

  // 5. Ghee
  const [gheeQuantity, setGheeQuantity] = useState('');
  const [gheeMethod, setGheeMethod] = useState(GHEE_METHODS[0] ?? 'Traditional Vedic Bilona');
  const [isGheeMethodDropdownOpen, setIsGheeMethodDropdownOpen] = useState(false);

  // 6. Buttermilk
  const [buttermilkQuantity, setButtermilkQuantity] = useState('');
  const [buttermilkType, setButtermilkType] = useState(BUTTERMILK_TYPES[0] ?? 'Plain Churned Chaas');
  const [isButtermilkTypeDropdownOpen, setIsButtermilkTypeDropdownOpen] = useState(false);

  // 7. Cheese
  const [cheeseQuantity, setCheeseQuantity] = useState('');
  const [cheeseType, setCheeseType] = useState(CHEESE_TYPES[0] ?? 'Farm Mozzarella');
  const [isCheeseTypeDropdownOpen, setIsCheeseTypeDropdownOpen] = useState(false);

  // 8. Eggs
  const [selectedFlockIndex, setSelectedFlockIndex] = useState(0);
  const [selectedEggSession, setSelectedEggSession] = useState(SESSIONS_EGGS[0] ?? 'Morning collection');
  const [eggCount, setEggCount] = useState('');
  const [damagedEggCount, setDamagedEggCount] = useState('');
  const [isFlockDropdownOpen, setIsFlockDropdownOpen] = useState(false);
  const [isEggSessionDropdownOpen, setIsEggSessionDropdownOpen] = useState(false);

  // Common notes
  const [produceNotes, setProduceNotes] = useState('');

  // Real pickers, derived from this farmer's own herd (dairy species for
  // milk, POULTRY for flock-level egg collection -- see AvailableFlock's
  // docblock for why a POULTRY animal record IS the flock here).
  const availableAnimals: AvailableAnimal[] = dairyAnimals.map((a) => ({
    id: a.id,
    name: a.name ?? a.tag,
    type: dairyAnimalTypeLabel(a.species),
    breed: a.breed ?? '',
    code: a.tag,
    iconType: dairyAnimalIconType(a.species),
  }));
  const availableFlocks: AvailableFlock[] = poultryAnimals.map((a) => ({
    id: a.id,
    name: a.name ?? a.tag,
    subtitle: a.notes ?? a.tag,
  }));

  const EMPTY_ANIMAL: AvailableAnimal = {
    id: '',
    name: t('farmer.livestock.dairyProduce.noAnimalsOption'),
    type: 'Cow',
    breed: '',
    code: '',
    iconType: 'cow',
  };
  const EMPTY_FLOCK: AvailableFlock = { id: '', name: t('farmer.livestock.dairyProduce.noFlocksOption'), subtitle: '' };

  // Safely resolved current selections
  const currentAnimal: AvailableAnimal = availableAnimals[selectedAnimalIndex] ?? availableAnimals[0] ?? EMPTY_ANIMAL;
  const currentFlock: AvailableFlock = availableFlocks[selectedFlockIndex] ?? availableFlocks[0] ?? EMPTY_FLOCK;
  const currentProductMeta: DairyProductMeta =
    DAIRY_PRODUCTS.find((p) => p.id === selectedProduct) ?? DAIRY_PRODUCTS[0]!;

  // Calculate totals
  const totalMilkToday = animals.reduce((sum, a) => sum + a.yieldLiters, 0);
  const totalEggsToday = flocks.reduce((sum, f) => sum + f.count, 0);
  const totalValueAddToday = valueAddedProduce.reduce((sum, va) => sum + va.quantity, 0);

  // Helper to open modal for specific product
  const handleOpenLogModal = (prod: DairyProductType) => {
    setSelectedProduct(prod);
    setIsLogProduceDropdownOpen(false);
    setIsProductPickerOpen(false);
    setIsLogModalOpen(true);
  };

  // Helper to render icon for any product
  const renderProductIcon = (prod: DairyProductType, size: number = 20) => {
    switch (prod) {
      case 'milk':
        return <DropIcon size={size} color={colors.brandGreen} fill={colors.brandGreen} />;
      case 'curd':
        return <CurdIcon size={size} color={P.twBlue600} />;
      case 'paneer':
        return <PaneerIcon size={size} color={P.twAmber600} />;
      case 'butter':
        return <ButterIcon size={size} color={P.amberDeep} />;
      case 'ghee':
        return <GheeIcon size={size} color={P.twOrange600} />;
      case 'buttermilk':
        return <ButtermilkIcon size={size} color={P.sky600} />;
      case 'cheese':
        return <CheeseIcon size={size} color={P.pink800} />;
      case 'eggs':
        return <EggIcon size={size} color={P.twAmber700} fill={P.twAmber700} />;
      default:
        return <DropIcon size={size} color={colors.brandGreen} />;
    }
  };

  // Save Unified Production Log
  const handleSaveProductionLog = async () => {
    if (isSaving) return;
    setSaveError('');

    if (selectedProduct === 'milk') {
      if (availableAnimals.length === 0 || !currentAnimal.id) {
        setSaveError(t('farmer.livestock.dairyProduce.noAnimalsError'));
        return;
      }
      const qty = parseFloat(milkQuantity.trim());
      if (isNaN(qty) || qty <= 0) {
        Alert.alert('Invalid Quantity', 'Please enter a valid milk quantity in liters.');
        return;
      }
      const animal = currentAnimal;
      setIsSaving(true);
      try {
        const created = await createProductionLog({
          animalId: animal.id,
          productType: 'MILK',
          quantity: qty,
          unit: DAIRY_PRODUCT_UNITS.MILK,
          sessions: 1,
          notes: [selectedMilkSession, fatPercentage.trim() ? `Fat ${fatPercentage.trim()}%` : null]
            .filter(Boolean)
            .join(' · '),
        });
        setAnimals((prev) =>
          prev.map((a) =>
            a.id === animal.id
              ? { ...a, yieldLiters: parseFloat((a.yieldLiters + created.quantity).toFixed(1)), sessions: a.sessions + 1 }
              : a,
          ),
        );
        setHistoryLogs((prev) => [toHistoryLog(created, [...dairyAnimals, ...poultryAnimals]), ...prev]);
        Alert.alert('Milk Logged', `Successfully logged ${created.quantity} L milk for ${animal.name}.`);
        setMilkQuantity('');
        setFatPercentage('');
        setProduceNotes('');
        setIsLogModalOpen(false);
      } catch (err: unknown) {
        setSaveError(formatErrorMessage(err, t('farmer.livestock.dairyProduce.saveError')));
      } finally {
        setIsSaving(false);
      }
      return;
    }

    if (selectedProduct === 'eggs') {
      if (availableFlocks.length === 0 || !currentFlock.id) {
        setSaveError(t('farmer.livestock.dairyProduce.noFlocksError'));
        return;
      }
      const count = parseInt(eggCount.trim(), 10);
      if (isNaN(count) || count <= 0) {
        Alert.alert('Invalid Count', 'Please enter a valid good egg count.');
        return;
      }
      const flock = currentFlock;
      const dmgInfo = damagedEggCount.trim() ? `${damagedEggCount.trim()} damaged` : null;
      setIsSaving(true);
      try {
        // Eggs are flock-level: `animalId` is deliberately omitted (see
        // AvailableFlock's docblock + livestock.schema.ts) -- the flock's
        // identity is preserved in `notes` instead, since createProductionLogBody
        // has no dedicated flock field.
        const created = await createProductionLog({
          productType: 'EGGS',
          quantity: count,
          unit: DAIRY_PRODUCT_UNITS.EGGS,
          notes: [flock.name, selectedEggSession, dmgInfo].filter(Boolean).join(' · '),
        });
        setFlocks((prev) =>
          prev.map((f) => (f.id === flock.id ? { ...f, count: f.count + created.quantity } : f)),
        );
        setHistoryLogs((prev) => [
          { ...toHistoryLog(created, [...dairyAnimals, ...poultryAnimals]), title: flock.name },
          ...prev,
        ]);
        Alert.alert('Eggs Logged', `Successfully logged ${created.quantity} eggs for ${flock.name}.`);
        setEggCount('');
        setDamagedEggCount('');
        setProduceNotes('');
        setIsLogModalOpen(false);
      } catch (err: unknown) {
        setSaveError(formatErrorMessage(err, t('farmer.livestock.dairyProduce.saveError')));
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // Value-added dairy (curd, paneer, butter, ghee, buttermilk, cheese)
    let qtyStr = '';
    const titleName = currentProductMeta.title;
    let batchInfo = '';

    switch (selectedProduct) {
      case 'curd':
        qtyStr = curdQuantity.trim();
        batchInfo = `${curdMilkSource}${curdMilkUsed ? ` (${curdMilkUsed} L milk)` : ''}`;
        break;
      case 'paneer':
        qtyStr = paneerQuantity.trim();
        batchInfo = `${paneerType}${paneerMilkUsed ? ` · ${paneerMilkUsed} L milk` : ''}`;
        break;
      case 'butter':
        qtyStr = butterQuantity.trim();
        batchInfo = butterType;
        break;
      case 'ghee':
        qtyStr = gheeQuantity.trim();
        batchInfo = gheeMethod;
        break;
      case 'buttermilk':
        qtyStr = buttermilkQuantity.trim();
        batchInfo = buttermilkType;
        break;
      case 'cheese':
        qtyStr = cheeseQuantity.trim();
        batchInfo = cheeseType;
        break;
    }

    const qty = parseFloat(qtyStr);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Invalid Quantity', `Please enter a valid quantity for ${titleName}.`);
      return;
    }

    const apiType = PRODUCT_TYPE_TO_API[selectedProduct];
    setIsSaving(true);
    try {
      const created = await createProductionLog({
        productType: apiType,
        quantity: qty,
        unit: DAIRY_PRODUCT_UNITS[apiType],
        ...(batchInfo ? { batchInfo } : {}),
        ...(produceNotes.trim() ? { notes: produceNotes.trim() } : {}),
      });

      setValueAddedProduce((prev) => [
        {
          id: created.id,
          type: selectedProduct,
          name: titleName,
          quantity: created.quantity,
          unit: currentProductMeta.unit,
          batchInfo: batchInfo || 'Batch Today',
          date: 'Today',
        },
        ...prev,
      ]);

      setHistoryLogs((prev) => [
        { ...toHistoryLog(created, [...dairyAnimals, ...poultryAnimals]), title: titleName },
        ...prev,
      ]);

      Alert.alert('Produce Logged', `Successfully recorded ${created.quantity} ${currentProductMeta.unit} of ${titleName}.`);
      setCurdQuantity('');
      setPaneerQuantity('');
      setButterQuantity('');
      setGheeQuantity('');
      setButtermilkQuantity('');
      setCheeseQuantity('');
      setProduceNotes('');
      setIsLogModalOpen(false);
    } catch (err: unknown) {
      setSaveError(formatErrorMessage(err, t('farmer.livestock.dairyProduce.saveError')));
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar barStyle="dark-content" backgroundColor={P.white} />
        <View style={{ padding: 16, gap: 12 }}>
          <Skeleton width="100%" height={42} borderRadius={21} />
          <Skeleton width="100%" height={80} borderRadius={14} />
          <Skeleton width="100%" height={56} borderRadius={14} />
          <Skeleton width="100%" height={56} borderRadius={14} />
        </View>
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar barStyle="dark-content" backgroundColor={P.white} />
        <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
          <ErrorState error={loadError} onRetry={() => void load()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top Header ── */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ArrowBackIcon size={20} color={P.twGray900} />
          </TouchableOpacity>
          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle}>Dairy & Produce</Text>
            <Text style={styles.headerSubtitle}>Milk, value-added dairy & egg production</Text>
          </View>
        </View>

        {/* ── Summary Stats Cards (3 Columns) ── */}
        <View style={styles.summaryRow}>
          {/* Milk Summary Card */}
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconBox, { backgroundColor: colors.brandGreenLight }]}>
              <DropIcon size={18} color={colors.brandGreen} fill={colors.brandGreen} />
            </View>
            <Text style={styles.summaryNumber}>{totalMilkToday.toFixed(1)} L</Text>
            <Text style={styles.summaryLabel}>Milk today</Text>
          </View>

          {/* Dairy Value Add Card */}
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconBox, { backgroundColor: P.twOrange100 }]}>
              <GheeIcon size={18} color={P.twOrange600} />
            </View>
            <Text style={styles.summaryNumber}>{totalValueAddToday.toFixed(1)}</Text>
            <Text style={styles.summaryLabel}>Dairy products</Text>
          </View>

          {/* Eggs Summary Card */}
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconBox, { backgroundColor: P.twAmber100 }]}>
              <EggIcon size={18} color={P.twAmber700} fill={P.twAmber700} />
            </View>
            <Text style={styles.summaryNumber}>{totalEggsToday}</Text>
            <Text style={styles.summaryLabel}>Eggs today</Text>
          </View>
        </View>

        {/* ── Action Dropdown: Log Produce ── */}
        <View style={styles.logDropdownContainer}>
          <TouchableOpacity
            style={[styles.logDropdownBtn, isLogProduceDropdownOpen && styles.logDropdownBtnActive]}
            activeOpacity={0.88}
            onPress={() => setIsLogProduceDropdownOpen((prev) => !prev)}
            accessibilityRole="button"
            accessibilityLabel="Log Production Dropdown"
          >
            <View style={styles.logDropdownBtnLeft}>
              <View style={styles.logDropdownIconBadge}>
                <PlusIcon size={16} color={P.white} />
              </View>
              <Text style={styles.logDropdownBtnText}>+ Log Production</Text>
            </View>
            <View style={{ transform: [{ rotate: isLogProduceDropdownOpen ? '180deg' : '0deg' }] }}>
              <ChevronDownIcon size={18} color={P.white} />
            </View>
          </TouchableOpacity>

          {/* Expanded Dropdown with all Dairy & Farm Products */}
          {isLogProduceDropdownOpen && (
            <View style={styles.logDropdownMenu}>
              <Text style={styles.dropdownCategoryHeader}>SELECT DAIRY / PRODUCE TO LOG</Text>
              {DAIRY_PRODUCTS.map((prod, index) => {
                return (
                  <React.Fragment key={prod.id}>
                    <TouchableOpacity
                      style={styles.logDropdownOption}
                      activeOpacity={0.7}
                      onPress={() => handleOpenLogModal(prod.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Log ${prod.title}`}
                    >
                      <View style={[styles.logOptionIconBox, { backgroundColor: prod.badgeBg }]}>
                        {renderProductIcon(prod.id, 18)}
                      </View>
                      <View style={styles.logOptionTextBox}>
                        <View style={styles.optionTitleRow}>
                          <Text style={styles.logOptionTitle}>{prod.title}</Text>
                          <Text style={styles.optionCategoryTag}>{prod.category}</Text>
                        </View>
                        <Text style={styles.logOptionSub} numberOfLines={1}>
                          {prod.subtitle}
                        </Text>
                      </View>
                      <ChevronRightIcon size={16} color={P.twGray400} />
                    </TouchableOpacity>
                    {index < DAIRY_PRODUCTS.length - 1 && <View style={styles.logDropdownDivider} />}
                  </React.Fragment>
                );
              })}
            </View>
          )}
        </View>

        {/* ── Section 1: Milk by Animal (Today) ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>MILK BY ANIMAL (TODAY)</Text>
          <TouchableOpacity
            onPress={() => {
              setHistoryFilter('milk');
              setIsHistoryModalOpen(true);
            }}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <Text style={styles.historyLinkText}>History</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listContainer}>
          {animals.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={[styles.itemIconBadge, { backgroundColor: colors.brandGreenLight }]}>
                {item.iconType === 'cow' ? (
                  <CowIcon size={20} color={colors.brandGreen} />
                ) : (
                  <PawIcon size={18} color={colors.brandGreen} />
                )}
              </View>

              <View style={styles.itemTextCol}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemSubtitle}>
                  {item.type} · {item.breed}
                </Text>
              </View>

              <View style={styles.itemRightCol}>
                <Text style={styles.itemStatBig}>{item.yieldLiters.toFixed(1)} L</Text>
                <Text style={styles.itemStatSub}>{item.sessions} sessions</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Section 2: Value-Added Dairy Products ── */}
        <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
          <Text style={styles.sectionHeaderTitle}>VALUE-ADDED DAIRY & BYPRODUCTS</Text>
          <TouchableOpacity
            onPress={() => {
              setHistoryFilter('value_add');
              setIsHistoryModalOpen(true);
            }}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <Text style={styles.historyLinkText}>History</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listContainer}>
          {valueAddedProduce.map((item) => {
            const meta = DAIRY_PRODUCTS.find((p) => p.id === item.type);
            return (
              <View key={item.id} style={styles.itemCard}>
                <View style={[styles.itemIconBadge, { backgroundColor: meta?.badgeBg || P.twGray100 }]}>
                  {renderProductIcon(item.type, 20)}
                </View>

                <View style={styles.itemTextCol}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemSubtitle} numberOfLines={1}>
                    {item.batchInfo}
                  </Text>
                </View>

                <View style={styles.itemRightCol}>
                  <Text style={styles.itemStatBig}>
                    {item.quantity} {item.unit}
                  </Text>
                  <Text style={styles.itemStatSub}>{item.date}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* ── Section 3: Egg Production (Flock) ── */}
        <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
          <Text style={styles.sectionHeaderTitle}>EGG PRODUCTION (FLOCK)</Text>
          <TouchableOpacity
            onPress={() => {
              setHistoryFilter('eggs');
              setIsHistoryModalOpen(true);
            }}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <Text style={styles.historyLinkText}>History</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listContainer}>
          {flocks.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={[styles.itemIconBadge, { backgroundColor: P.twAmber100 }]}>
                <EggIcon size={20} color={P.twAmber700} fill={P.twAmber700} />
              </View>

              <View style={styles.itemTextCol}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
              </View>

              <View style={styles.itemRightCol}>
                <Text style={styles.itemStatBig}>{item.count}</Text>
                <Text style={styles.itemStatSub}>eggs</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Info Notice Callout Box ── */}
        <View style={styles.infoCallout}>
          <View style={styles.infoIconCol}>
            <InfoCircleIcon size={18} color={P.sky600} />
          </View>
          <Text style={styles.infoText}>
            Logging daily dairy batches and poultry collections ensures end-to-end traceability for your TOHFA PGS Organic marketplace certification.
          </Text>
        </View>
      </ScrollView>

      {/* ─────────────────────────────────────────────
          DYNAMIC MODAL: LOG ANY DAIRY/FARM PRODUCE
          ───────────────────────────────────────────── */}
      <Modal visible={isLogModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Log {currentProductMeta.title}</Text>
                <Text style={styles.modalSub}>
                  Record daily farm yield & production details
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setIsLogModalOpen(false)}
                accessibilityRole="button"
              >
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
              {/* Product Type Switcher in Modal */}
              <Text style={styles.inputLabel}>Product Category</Text>
              <TouchableOpacity
                style={styles.dropdownTrigger}
                activeOpacity={0.8}
                onPress={() => setIsProductPickerOpen(!isProductPickerOpen)}
              >
                <View style={styles.dropdownSelectedRow}>
                  <View style={[styles.miniBadge, { backgroundColor: currentProductMeta.badgeBg }]}>
                    {renderProductIcon(selectedProduct, 16)}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dropdownSelectedText}>{currentProductMeta.title}</Text>
                    <Text style={styles.dropdownSelectedSub}>{currentProductMeta.category}</Text>
                  </View>
                </View>
                <ChevronDownIcon size={18} color={P.twGray500} />
              </TouchableOpacity>

              {/* Product Picker Dropdown Options */}
              {isProductPickerOpen && (
                <View style={styles.dropdownMenu}>
                  {DAIRY_PRODUCTS.map((prod) => {
                    const isSelected = selectedProduct === prod.id;
                    return (
                      <TouchableOpacity
                        key={prod.id}
                        style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemActive]}
                        onPress={() => {
                          setSelectedProduct(prod.id);
                          setIsProductPickerOpen(false);
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                          <View style={[styles.miniBadge, { backgroundColor: prod.badgeBg }]}>
                            {renderProductIcon(prod.id, 15)}
                          </View>
                          <Text style={[styles.menuItemTitle, isSelected && { color: colors.brandGreen, fontWeight: '700' }]}>
                            {prod.title}
                          </Text>
                        </View>
                        {isSelected && <CheckIcon size={18} color={colors.brandGreen} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* ─────────────────────────────────────────────
                  DYNAMIC FORM FIELDS BASED ON PRODUCT
                  ───────────────────────────────────────────── */}

              {/* 1. FRESH MILK */}
              {selectedProduct === 'milk' && (
                <>
                  {/* Select Lactating Animal */}
                  <Text style={[styles.inputLabel, { marginTop: 14 }]}>Select Animal (Lactating)</Text>
                  <TouchableOpacity
                    style={styles.dropdownTrigger}
                    activeOpacity={0.8}
                    onPress={() => {
                      setIsAnimalDropdownOpen(!isAnimalDropdownOpen);
                      setIsMilkSessionDropdownOpen(false);
                    }}
                  >
                    <View style={styles.dropdownSelectedRow}>
                      <View style={[styles.miniBadge, { backgroundColor: colors.brandGreenLight }]}>
                        {currentAnimal.iconType === 'cow' ? (
                          <CowIcon size={16} color={colors.brandGreen} />
                        ) : (
                          <PawIcon size={14} color={colors.brandGreen} />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.dropdownSelectedText}>{currentAnimal.name}</Text>
                        <Text style={styles.dropdownSelectedSub}>
                          {currentAnimal.type} · {currentAnimal.breed} ({currentAnimal.code})
                        </Text>
                      </View>
                    </View>
                    <ChevronDownIcon size={18} color={P.twGray500} />
                  </TouchableOpacity>

                  {isAnimalDropdownOpen && (
                    <View style={styles.dropdownMenu}>
                      {availableAnimals.map((animal, idx) => {
                        const isSelected = selectedAnimalIndex === idx;
                        return (
                          <TouchableOpacity
                            key={animal.id}
                            style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemActive]}
                            onPress={() => {
                              setSelectedAnimalIndex(idx);
                              setIsAnimalDropdownOpen(false);
                            }}
                          >
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.menuItemTitle, isSelected && { color: colors.brandGreen, fontWeight: '700' }]}>
                                {animal.name}
                              </Text>
                              <Text style={styles.menuItemSub}>
                                {animal.type} · {animal.breed} · {animal.code}
                              </Text>
                            </View>
                            {isSelected && <CheckIcon size={18} color={colors.brandGreen} />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  {/* Milking Session */}
                  <Text style={[styles.inputLabel, { marginTop: 14 }]}>Milking Session</Text>
                  <TouchableOpacity
                    style={styles.dropdownTrigger}
                    activeOpacity={0.8}
                    onPress={() => {
                      setIsMilkSessionDropdownOpen(!isMilkSessionDropdownOpen);
                      setIsAnimalDropdownOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownSelectedText}>{selectedMilkSession}</Text>
                    <ChevronDownIcon size={18} color={P.twGray500} />
                  </TouchableOpacity>

                  {isMilkSessionDropdownOpen && (
                    <View style={styles.dropdownMenu}>
                      {SESSIONS_MILK.map((session) => {
                        const isSelected = selectedMilkSession === session;
                        return (
                          <TouchableOpacity
                            key={session}
                            style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemActive]}
                            onPress={() => {
                              setSelectedMilkSession(session);
                              setIsMilkSessionDropdownOpen(false);
                            }}
                          >
                            <Text style={[styles.menuItemTitle, isSelected && { color: colors.brandGreen, fontWeight: '700' }]}>
                              {session}
                            </Text>
                            {isSelected && <CheckIcon size={18} color={colors.brandGreen} />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  {/* Milk Quantity */}
                  <Text style={[styles.inputLabel, { marginTop: 14 }]}>Milk Quantity (Liters) *</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="decimal-pad"
                    placeholder="e.g. 5.5"
                    placeholderTextColor={P.twGray400}
                    value={milkQuantity}
                    onChangeText={setMilkQuantity}
                  />

                  {/* Fat % */}
                  <Text style={[styles.inputLabel, { marginTop: 14 }]}>Fat % / SNF (Optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="decimal-pad"
                    placeholder="e.g. 4.2"
                    placeholderTextColor={P.twGray400}
                    value={fatPercentage}
                    onChangeText={setFatPercentage}
                  />
                </>
              )}

              {/* 2. CURD / DAHI */}
              {selectedProduct === 'curd' && (
                <>
                  <Text style={[styles.inputLabel, { marginTop: 14 }]}>Milk Source Batch</Text>
                  <TouchableOpacity
                    style={styles.dropdownTrigger}
                    activeOpacity={0.8}
                    onPress={() => setIsCurdSourceDropdownOpen(!isCurdSourceDropdownOpen)}
                  >
                    <Text style={styles.dropdownSelectedText}>{curdMilkSource}</Text>
                    <ChevronDownIcon size={18} color={P.twGray500} />
                  </TouchableOpacity>

                  {isCurdSourceDropdownOpen && (
                    <View style={styles.dropdownMenu}>
                      {MILK_SOURCES.map((src) => {
                        const isSelected = curdMilkSource === src;
                        return (
                          <TouchableOpacity
                            key={src}
                            style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemActive]}
                            onPress={() => {
                              setCurdMilkSource(src);
                              setIsCurdSourceDropdownOpen(false);
                            }}
                          >
                            <Text style={[styles.menuItemTitle, isSelected && { color: colors.brandGreen, fontWeight: '700' }]}>
                              {src}
                            </Text>
                            {isSelected && <CheckIcon size={18} color={colors.brandGreen} />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  <Text style={[styles.inputLabel, { marginTop: 14 }]}>Curd / Dahi Yield (Kg) *</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="decimal-pad"
                    placeholder="e.g. 5.0"
                    placeholderTextColor={P.twGray400}
                    value={curdQuantity}
                    onChangeText={setCurdQuantity}
                  />

                  <Text style={[styles.inputLabel, { marginTop: 14 }]}>Raw Milk Converted (Liters)</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="decimal-pad"
                    placeholder="e.g. 6.0"
                    placeholderTextColor={P.twGray400}
                    value={curdMilkUsed}
                    onChangeText={setCurdMilkUsed}
                  />
                </>
              )}

              {/* 3. PANEER */}
              {selectedProduct === 'paneer' && (
                <>
                  <Text style={[styles.inputLabel, { marginTop: 14 }]}>Paneer Texture & Variety</Text>
                  <TouchableOpacity
                    style={styles.dropdownTrigger}
                    activeOpacity={0.8}
                    onPress={() => setIsPaneerTypeDropdownOpen(!isPaneerTypeDropdownOpen)}
                  >
                    <Text style={styles.dropdownSelectedText}>{paneerType}</Text>
                    <ChevronDownIcon size={18} color={P.twGray500} />
                  </TouchableOpacity>

                  {isPaneerTypeDropdownOpen && (
                    <View style={styles.dropdownMenu}>
                      {PANEER_TYPES.map((t) => {
                        const isSelected = paneerType === t;
                        return (
                          <TouchableOpacity
                            key={t}
                            style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemActive]}
                            onPress={() => {
                              setPaneerType(t);
                              setIsPaneerTypeDropdownOpen(false);
                            }}
                          >
                            <Text style={[styles.menuItemTitle, isSelected && { color: colors.brandGreen, fontWeight: '700' }]}>
                              {t}
                            </Text>
                            {isSelected && <CheckIcon size={18} color={colors.brandGreen} />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  <Text style={[styles.inputLabel, { marginTop: 14 }]}>Paneer Weight / Yield (Kg) *</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="decimal-pad"
                    placeholder="e.g. 2.5"
                    placeholderTextColor={P.twGray400}
                    value={paneerQuantity}
                    onChangeText={setPaneerQuantity}
                  />

                  <Text style={[styles.inputLabel, { marginTop: 14 }]}>Raw Milk Used (Liters)</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="decimal-pad"
                    placeholder="e.g. 15.0"
                    placeholderTextColor={P.twGray400}
                    value={paneerMilkUsed}
                    onChangeText={setPaneerMilkUsed}
                  />
                </>
              )}

              {/* 4. BUTTER / MAKHAN */}
              {selectedProduct === 'butter' && (
                <>
                  <Text style={[styles.inputLabel, { marginTop: 14 }]}>Butter Style & Method</Text>
                  <TouchableOpacity
                    style={styles.dropdownTrigger}
                    activeOpacity={0.8}
                    onPress={() => setIsButterTypeDropdownOpen(!isButterTypeDropdownOpen)}
                  >
                    <Text style={styles.dropdownSelectedText}>{butterType}</Text>
                    <ChevronDownIcon size={18} color={P.twGray500} />
                  </TouchableOpacity>

                  {isButterTypeDropdownOpen && (
                    <View style={styles.dropdownMenu}>
                      {BUTTER_TYPES.map((b) => {
                        const isSelected = butterType === b;
                        return (
                          <TouchableOpacity
                            key={b}
                            style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemActive]}
                            onPress={() => {
                              setButterType(b);
                              setIsButterTypeDropdownOpen(false);
                            }}
                          >
                            <Text style={[styles.menuItemTitle, isSelected && { color: colors.brandGreen, fontWeight: '700' }]}>
                              {b}
                            </Text>
                            {isSelected && <CheckIcon size={18} color={colors.brandGreen} />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  <Text style={[styles.inputLabel, { marginTop: 14 }]}>Butter Yield (Kg) *</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="decimal-pad"
                    placeholder="e.g. 3.0"
                    placeholderTextColor={P.twGray400}
                    value={butterQuantity}
                    onChangeText={setButterQuantity}
                  />
                </>
              )}

              {/* 5. GHEE */}
              {selectedProduct === 'ghee' && (
                <>
                  <Text style={[styles.inputLabel, { marginTop: 14 }]}>Clarification Method</Text>
                  <TouchableOpacity
                    style={styles.dropdownTrigger}
                    activeOpacity={0.8}
                    onPress={() => setIsGheeMethodDropdownOpen(!isGheeMethodDropdownOpen)}
                  >
                    <Text style={styles.dropdownSelectedText}>{gheeMethod}</Text>
                    <ChevronDownIcon size={18} color={P.twGray500} />
                  </TouchableOpacity>

                  {isGheeMethodDropdownOpen && (
                    <View style={styles.dropdownMenu}>
                      {GHEE_METHODS.map((g) => {
                        const isSelected = gheeMethod === g;
                        return (
                          <TouchableOpacity
                            key={g}
                            style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemActive]}
                            onPress={() => {
                              setGheeMethod(g);
                              setIsGheeMethodDropdownOpen(false);
                            }}
                          >
                            <Text style={[styles.menuItemTitle, isSelected && { color: colors.brandGreen, fontWeight: '700' }]}>
                              {g}
                            </Text>
                            {isSelected && <CheckIcon size={18} color={colors.brandGreen} />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  <Text style={[styles.inputLabel, { marginTop: 14 }]}>Pure Ghee Yield (Liters) *</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="decimal-pad"
                    placeholder="e.g. 1.5"
                    placeholderTextColor={P.twGray400}
                    value={gheeQuantity}
                    onChangeText={setGheeQuantity}
                  />
                </>
              )}

              {/* 6. BUTTERMILK */}
              {selectedProduct === 'buttermilk' && (
                <>
                  <Text style={[styles.inputLabel, { marginTop: 14 }]}>Buttermilk Flavor & Style</Text>
                  <TouchableOpacity
                    style={styles.dropdownTrigger}
                    activeOpacity={0.8}
                    onPress={() => setIsButtermilkTypeDropdownOpen(!isButtermilkTypeDropdownOpen)}
                  >
                    <Text style={styles.dropdownSelectedText}>{buttermilkType}</Text>
                    <ChevronDownIcon size={18} color={P.twGray500} />
                  </TouchableOpacity>

                  {isButtermilkTypeDropdownOpen && (
                    <View style={styles.dropdownMenu}>
                      {BUTTERMILK_TYPES.map((bm) => {
                        const isSelected = buttermilkType === bm;
                        return (
                          <TouchableOpacity
                            key={bm}
                            style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemActive]}
                            onPress={() => {
                              setButtermilkType(bm);
                              setIsButtermilkTypeDropdownOpen(false);
                            }}
                          >
                            <Text style={[styles.menuItemTitle, isSelected && { color: colors.brandGreen, fontWeight: '700' }]}>
                              {bm}
                            </Text>
                            {isSelected && <CheckIcon size={18} color={colors.brandGreen} />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  <Text style={[styles.inputLabel, { marginTop: 14 }]}>Quantity (Liters) *</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="decimal-pad"
                    placeholder="e.g. 10.0"
                    placeholderTextColor={P.twGray400}
                    value={buttermilkQuantity}
                    onChangeText={setButtermilkQuantity}
                  />
                </>
              )}

              {/* 7. CHEESE */}
              {selectedProduct === 'cheese' && (
                <>
                  <Text style={[styles.inputLabel, { marginTop: 14 }]}>Cheese Variety</Text>
                  <TouchableOpacity
                    style={styles.dropdownTrigger}
                    activeOpacity={0.8}
                    onPress={() => setIsCheeseTypeDropdownOpen(!isCheeseTypeDropdownOpen)}
                  >
                    <Text style={styles.dropdownSelectedText}>{cheeseType}</Text>
                    <ChevronDownIcon size={18} color={P.twGray500} />
                  </TouchableOpacity>

                  {isCheeseTypeDropdownOpen && (
                    <View style={styles.dropdownMenu}>
                      {CHEESE_TYPES.map((c) => {
                        const isSelected = cheeseType === c;
                        return (
                          <TouchableOpacity
                            key={c}
                            style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemActive]}
                            onPress={() => {
                              setCheeseType(c);
                              setIsCheeseTypeDropdownOpen(false);
                            }}
                          >
                            <Text style={[styles.menuItemTitle, isSelected && { color: colors.brandGreen, fontWeight: '700' }]}>
                              {c}
                            </Text>
                            {isSelected && <CheckIcon size={18} color={colors.brandGreen} />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  <Text style={[styles.inputLabel, { marginTop: 14 }]}>Cheese Yield (Kg) *</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="decimal-pad"
                    placeholder="e.g. 1.8"
                    placeholderTextColor={P.twGray400}
                    value={cheeseQuantity}
                    onChangeText={setCheeseQuantity}
                  />
                </>
              )}

              {/* 8. EGGS */}
              {selectedProduct === 'eggs' && (
                <>
                  <Text style={[styles.inputLabel, { marginTop: 14 }]}>Select Flock / Bird Group</Text>
                  <TouchableOpacity
                    style={styles.dropdownTrigger}
                    activeOpacity={0.8}
                    onPress={() => {
                      setIsFlockDropdownOpen(!isFlockDropdownOpen);
                      setIsEggSessionDropdownOpen(false);
                    }}
                  >
                    <View style={styles.dropdownSelectedRow}>
                      <View style={[styles.miniBadge, { backgroundColor: P.twAmber100 }]}>
                        <EggIcon size={16} color={P.twAmber700} fill={P.twAmber700} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.dropdownSelectedText}>{currentFlock.name}</Text>
                        <Text style={styles.dropdownSelectedSub}>{currentFlock.subtitle}</Text>
                      </View>
                    </View>
                    <ChevronDownIcon size={18} color={P.twGray500} />
                  </TouchableOpacity>

                  {isFlockDropdownOpen && (
                    <View style={styles.dropdownMenu}>
                      {availableFlocks.map((flock, idx) => {
                        const isSelected = selectedFlockIndex === idx;
                        return (
                          <TouchableOpacity
                            key={flock.id}
                            style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemActive]}
                            onPress={() => {
                              setSelectedFlockIndex(idx);
                              setIsFlockDropdownOpen(false);
                            }}
                          >
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.menuItemTitle, isSelected && { color: P.brownDeep2, fontWeight: '700' }]}>
                                {flock.name}
                              </Text>
                              <Text style={styles.menuItemSub}>{flock.subtitle}</Text>
                            </View>
                            {isSelected && <CheckIcon size={18} color={P.brownDeep2} />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  <Text style={[styles.inputLabel, { marginTop: 14 }]}>Collection Session</Text>
                  <TouchableOpacity
                    style={styles.dropdownTrigger}
                    activeOpacity={0.8}
                    onPress={() => {
                      setIsEggSessionDropdownOpen(!isEggSessionDropdownOpen);
                      setIsFlockDropdownOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownSelectedText}>{selectedEggSession}</Text>
                    <ChevronDownIcon size={18} color={P.twGray500} />
                  </TouchableOpacity>

                  {isEggSessionDropdownOpen && (
                    <View style={styles.dropdownMenu}>
                      {SESSIONS_EGGS.map((session) => {
                        const isSelected = selectedEggSession === session;
                        return (
                          <TouchableOpacity
                            key={session}
                            style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemActive]}
                            onPress={() => {
                              setSelectedEggSession(session);
                              setIsEggSessionDropdownOpen(false);
                            }}
                          >
                            <Text style={[styles.menuItemTitle, isSelected && { color: P.brownDeep2, fontWeight: '700' }]}>
                              {session}
                            </Text>
                            {isSelected && <CheckIcon size={18} color={P.brownDeep2} />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  <Text style={[styles.inputLabel, { marginTop: 14 }]}>Good Eggs Count *</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="number-pad"
                    placeholder="e.g. 24"
                    placeholderTextColor={P.twGray400}
                    value={eggCount}
                    onChangeText={setEggCount}
                  />

                  <Text style={[styles.inputLabel, { marginTop: 14 }]}>Damaged / Cracked Count (Optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="number-pad"
                    placeholder="e.g. 0"
                    placeholderTextColor={P.twGray400}
                    value={damagedEggCount}
                    onChangeText={setDamagedEggCount}
                  />
                </>
              )}

              {/* Common Notes */}
              <Text style={[styles.inputLabel, { marginTop: 14 }]}>Notes & Batch Remarks (Optional)</Text>
              <TextInput
                style={[styles.textInput, { height: 60, textAlignVertical: 'top' }]}
                multiline
                placeholder="e.g. Organic feed provided, excellent texture"
                placeholderTextColor={P.twGray400}
                value={produceNotes}
                onChangeText={setProduceNotes}
              />

              {saveError ? (
                <View style={styles.saveErrorBanner} accessibilityLiveRegion="polite">
                  <Text style={styles.saveErrorBannerText}>{saveError}</Text>
                </View>
              ) : null}
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsLogModalOpen(false)}
                disabled={isSaving}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSaveBtn, { backgroundColor: colors.brandGreen }, isSaving && { opacity: 0.6 }]}
                onPress={() => void handleSaveProductionLog()}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={P.white} />
                ) : (
                  <Text style={styles.modalSaveBtnText}>Save {currentProductMeta.title} Log</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────
          UNIFIED HISTORY MODAL
          ───────────────────────────────────────────── */}
      <Modal visible={isHistoryModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '82%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Production History</Text>
                <Text style={styles.modalSub}>Detailed record logs & batches</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setIsHistoryModalOpen(false)}
              >
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterTabsRow}>
              {(['all', 'milk', 'value_add', 'eggs'] as const).map((tab) => {
                const isSelected = historyFilter === tab;
                const tabLabel =
                  tab === 'all'
                    ? 'All'
                    : tab === 'milk'
                    ? 'Milk'
                    : tab === 'value_add'
                    ? 'Dairy Value-Add'
                    : 'Eggs';
                return (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.filterTabBtn, isSelected && styles.filterTabBtnActive]}
                    onPress={() => setHistoryFilter(tab)}
                  >
                    <Text style={[styles.filterTabBtnText, isSelected && styles.filterTabBtnTextActive]}>
                      {tabLabel}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {historyLogs
                .filter((log) => {
                  if (historyFilter === 'all') return true;
                  if (historyFilter === 'milk') return log.productType === 'milk';
                  if (historyFilter === 'eggs') return log.productType === 'eggs';
                  return log.productType !== 'milk' && log.productType !== 'eggs';
                })
                .map((log) => {
                  const meta = DAIRY_PRODUCTS.find((p) => p.id === log.productType);
                  return (
                    <View key={log.id} style={styles.historyItemCard}>
                      <View style={[styles.itemIconBadge, { backgroundColor: meta?.badgeBg || P.twGray100 }]}>
                        {renderProductIcon(log.productType, 18)}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.historyTitle}>{log.title}</Text>
                        <Text style={styles.historySub}>
                          {log.subtitle} · {log.time} · {log.date}
                        </Text>
                      </View>
                      <Text style={styles.historyValue}>{log.quantityFormatted}</Text>
                    </View>
                  );
                })}
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalSaveBtn, { marginTop: 16, backgroundColor: colors.brandGreen }]}
              onPress={() => setIsHistoryModalOpen(false)}
            >
              <Text style={styles.modalSaveBtnText}>Close History</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: P.grey50,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },

  /* Header */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
    marginTop: 4,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.title,
    fontWeight: '800',
    color: P.twGray900,
  },
  headerSubtitle: {
    fontSize: typography.body,
    fontWeight: '400',
    color: P.twGray500,
    marginTop: 2,
  },

  /* 3 Summary Cards Row */
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: P.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: 12,
    alignItems: 'center',
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  summaryIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  summaryNumber: {
    fontSize: typography.bodyLarge,
    fontWeight: '800',
    color: P.twGray900,
  },
  summaryLabel: {
    fontSize: typography.caption,
    fontWeight: '500',
    color: P.twGray500,
    marginTop: 2,
    textAlign: 'center',
  },

  /* Action Dropdown */
  logDropdownContainer: {
    marginBottom: 24,
  },
  logDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.brandGreen,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  logDropdownBtnActive: {
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  logDropdownBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logDropdownIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logDropdownBtnText: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.white,
  },
  logDropdownMenu: {
    backgroundColor: P.white,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderTopWidth: 0,
    paddingVertical: 8,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownCategoryHeader: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: P.twGray400,
    letterSpacing: 0.6,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  logDropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 12,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionCategoryTag: {
    fontSize: typography.caption,
    color: P.twGray500,
    backgroundColor: P.twGray100,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  logOptionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logOptionTextBox: {
    flex: 1,
  },
  logOptionTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.twGray900,
  },
  logOptionSub: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    marginTop: 2,
  },
  logDropdownDivider: {
    height: 1,
    backgroundColor: P.twGray100,
    marginHorizontal: 16,
  },

  /* Section Header */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionHeaderTitle: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.twGray500,
    letterSpacing: 0.5,
  },
  historyLinkText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.brandGreen,
  },

  /* Lists & Cards */
  listContainer: {
    gap: 10,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: 14,
    gap: 12,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  itemIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTextCol: {
    flex: 1,
  },
  itemName: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.twGray900,
  },
  itemSubtitle: {
    fontSize: typography.bodySmall,
    fontWeight: '400',
    color: P.twGray500,
    marginTop: 2,
  },
  itemRightCol: {
    alignItems: 'flex-end',
  },
  itemStatBig: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.twGray900,
  },
  itemStatSub: {
    fontSize: typography.caption,
    fontWeight: '400',
    color: P.twGray500,
    marginTop: 2,
  },

  /* Info Callout */
  infoCallout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: P.twBlue50,
    borderWidth: 1,
    borderColor: P.blue100,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    marginTop: 20,
  },
  infoIconCol: {
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: typography.bodySmall,
    color: P.twBlue800,
    lineHeight: 18,
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: P.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  modalTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: P.twGray900,
  },
  modalSub: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: P.twGray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.twGray500,
  },

  /* Form Elements in Modals */
  inputLabel: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray700,
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: P.twGray300,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: typography.body,
    color: P.twGray900,
    backgroundColor: P.twGray50,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: P.twGray300,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: P.twGray50,
  },
  dropdownSelectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  miniBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownSelectedText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray900,
  },
  dropdownSelectedSub: {
    fontSize: typography.caption,
    color: P.twGray500,
  },
  dropdownMenu: {
    marginTop: 6,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  dropdownMenuItemActive: {
    backgroundColor: colors.brandGreenLight,
  },
  menuItemTitle: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray900,
  },
  menuItemSub: {
    fontSize: typography.caption,
    color: P.twGray500,
    marginTop: 1,
  },

  modalActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.twGray300,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray600,
  },
  modalSaveBtn: {
    flex: 1.4,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSaveBtnText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.white,
  },

  /* Save error banner (inside the log modal) */
  saveErrorBanner: {
    backgroundColor: P.twRed50,
    borderWidth: 1,
    borderColor: P.twRed200,
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
  },
  saveErrorBannerText: {
    fontSize: typography.bodySmall,
    color: P.twRed700,
    lineHeight: 18,
  },

  /* History Filter Tabs */
  filterTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterTabBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: P.twGray100,
  },
  filterTabBtnActive: {
    backgroundColor: colors.brandGreen,
  },
  filterTabBtnText: {
    fontSize: typography.bodySmall,
    fontWeight: '600',
    color: P.twGray600,
  },
  filterTabBtnTextActive: {
    color: P.white,
  },

  /* History Cards */
  historyItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
    gap: 12,
  },
  historyTitle: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray900,
  },
  historySub: {
    fontSize: typography.caption,
    color: P.twGray500,
    marginTop: 1,
  },
  historyValue: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.twGray900,
  },
});
