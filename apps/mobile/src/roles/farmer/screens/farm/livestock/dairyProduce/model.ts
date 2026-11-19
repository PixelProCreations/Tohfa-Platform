import { authPalette as P, colors } from '../../../../theme';
import { t, type TranslationKey } from '../../../../../../i18n/farmer';
import type {
  AnimalResponse,
  DairyProductType as ApiDairyProductType,
  ProductionLogResponse,
} from '../../../../api/livestock';

// ─────────────────────────────────────────────
// i18n key helper
// ─────────────────────────────────────────────

const NS = 'farmer.dairyProduceScreen';

/** Every key this screen owns lives under one namespace; dynamic ids (product,
 *  option, month) are interpolated into it, hence the single cast here rather
 *  than at every call site. */
export function dp(suffix: string): TranslationKey {
  return `${NS}.${suffix}` as TranslationKey;
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

/** Display strings (title / category / subtitle) are resolved at render time
 *  through `productTitle` & co so a locale switch is honoured. */
export interface DairyProductMeta {
  id: DairyProductType;
  unit: string;
  defaultUnitLabel: string;
  badgeBg: string;
  accentColor: string;
}

export const DAIRY_PRODUCTS: DairyProductMeta[] = [
  { id: 'milk', unit: 'L', defaultUnitLabel: 'Liters', badgeBg: colors.brandGreenLight, accentColor: colors.brandGreen },
  { id: 'curd', unit: 'Kg', defaultUnitLabel: 'Kg', badgeBg: P.twBlue50, accentColor: P.twBlue600 },
  { id: 'paneer', unit: 'Kg', defaultUnitLabel: 'Kg', badgeBg: P.twAmber100, accentColor: P.twAmber600 },
  { id: 'butter', unit: 'Kg', defaultUnitLabel: 'Kg', badgeBg: P.twAmber100, accentColor: P.amberDeep },
  { id: 'ghee', unit: 'L', defaultUnitLabel: 'Liters', badgeBg: P.twOrange100, accentColor: P.twOrange600 },
  { id: 'buttermilk', unit: 'L', defaultUnitLabel: 'Liters', badgeBg: P.sky100, accentColor: P.sky600 },
  { id: 'cheese', unit: 'Kg', defaultUnitLabel: 'Kg', badgeBg: P.palePinkBg, accentColor: P.pink800 },
  { id: 'eggs', unit: 'Eggs', defaultUnitLabel: 'Count', badgeBg: P.twAmber100, accentColor: P.twAmber700 },
];

export const productTitle = (id: DairyProductType): string => t(dp(`product.${id}.title`));
export const productCategory = (id: DairyProductType): string => t(dp(`product.${id}.category`));
export const productSubtitle = (id: DairyProductType): string => t(dp(`product.${id}.subtitle`));

/** Local product ids -> the real backend enum (livestock.schema.ts). */
export const PRODUCT_TYPE_TO_API: Record<DairyProductType, ApiDairyProductType> = {
  milk: 'MILK',
  curd: 'CURD',
  paneer: 'PANEER',
  butter: 'BUTTER',
  ghee: 'GHEE',
  buttermilk: 'BUTTERMILK',
  cheese: 'CHEESE',
  eggs: 'EGGS',
};

export const API_PRODUCT_TYPE_TO_LOCAL: Record<ApiDairyProductType, DairyProductType> = {
  MILK: 'milk',
  CURD: 'curd',
  PANEER: 'paneer',
  BUTTER: 'butter',
  GHEE: 'ghee',
  BUTTERMILK: 'buttermilk',
  CHEESE: 'cheese',
  EGGS: 'eggs',
};

// ─────────────────────────────────────────────
// Row / picker shapes
// ─────────────────────────────────────────────

export type DairyAnimalType = 'Cow' | 'Goat' | 'Buffalo';

export interface AnimalMilkItem {
  id: string;
  name: string;
  breed: string;
  type: DairyAnimalType;
  yieldLiters: number;
  sessions: number;
  iconType: 'cow' | 'paw';
}

export interface ValueAddedProduceItem {
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
export interface FlockEggItem {
  id: string;
  name: string;
  subtitle: string;
  count: number;
}

export interface ProduceHistoryLog {
  id: string;
  productType: DairyProductType;
  title: string;
  subtitle: string;
  quantityFormatted: string;
  time: string;
  date: string;
}

export interface AvailableAnimal {
  id: string;
  name: string;
  type: DairyAnimalType;
  breed: string;
  code: string;
  iconType: 'cow' | 'paw';
}

// No backend concept of a "flock" separate from an animal record — a
// registered POULTRY-species animal (its `tag` as the flock name, its
// `notes` for farmer-entered context such as hen count) IS the flock here,
// the same way one operation's land is one or more registered plots rather
// than a separate entity (root CLAUDE.md's farm-land-locations doctrine).
export interface AvailableFlock {
  id: string;
  name: string;
  subtitle: string;
}

export type HistoryFilter = 'all' | 'milk' | 'value_add' | 'eggs';

// ─────────────────────────────────────────────
// Dropdown option catalogues (ids are stable; labels come from i18n)
// ─────────────────────────────────────────────

export type OptionGroup =
  | 'milkSession'
  | 'eggSession'
  | 'milkSource'
  | 'paneerType'
  | 'butterType'
  | 'gheeMethod'
  | 'buttermilkType'
  | 'cheeseType';

export const OPTION_IDS: Record<OptionGroup, readonly string[]> = {
  milkSession: ['morningAm', 'eveningPm', 'afternoonNoon'],
  eggSession: ['morning', 'afternoon', 'evening'],
  milkSource: ['cowA2', 'buffalo', 'mixed', 'goat'],
  paneerType: ['softFresh', 'firmPressed', 'spiced'],
  butterType: ['desiWhite', 'culturedSalted', 'culturedUnsalted'],
  gheeMethod: ['bilona', 'creamSimmered', 'slowCookedA2'],
  buttermilkType: ['plain', 'masala', 'mint'],
  cheeseType: ['mozzarella', 'cheddar', 'gouda', 'feta'],
};

/** Canonical English labels for the strings persisted to the API (log notes /
 *  batchInfo). These must NOT go through `t()`: what is saved cannot depend on
 *  the user's locale. UI labels use `optionLabel`. */
const API_OPTION_LABELS: Record<OptionGroup, Record<string, string>> = {
  milkSession: { morningAm: 'Morning (AM)', eveningPm: 'Evening (PM)', afternoonNoon: 'Afternoon (Noon)' },
  eggSession: { morning: 'Morning collection', afternoon: 'Afternoon collection', evening: 'Evening collection' },
  milkSource: {
    cowA2: 'Pure Cow Milk (A2)',
    buffalo: 'Pure Buffalo Milk',
    mixed: 'Mixed Farm Dairy',
    goat: 'Goat Milk',
  },
  paneerType: { softFresh: 'Soft Fresh Curd', firmPressed: 'Firm Pressed Blocks', spiced: 'Spiced / Herbed Paneer' },
  butterType: { desiWhite: 'Desi White Makhan', culturedSalted: 'Cultured Salted', culturedUnsalted: 'Cultured Unsalted' },
  gheeMethod: { bilona: 'Traditional Vedic Bilona', creamSimmered: 'Direct Cream Simmered', slowCookedA2: 'Slow Cooked A2' },
  buttermilkType: { plain: 'Plain Churned Chaas', masala: 'Spiced Masala Moru', mint: 'Mint Coriander Refresh' },
  cheeseType: { mozzarella: 'Farm Mozzarella', cheddar: 'Mild Cheddar', gouda: 'Gouda', feta: 'Fresh Feta / Cottage' },
};

export const apiOptionLabel = (group: OptionGroup, id: string): string => API_OPTION_LABELS[group][id] ?? id;

export const optionLabel = (group: OptionGroup, id: string): string => t(dp(`option.${group}.${id}`));

// ─────────────────────────────────────────────
// Value-added dairy product config (drives one data-driven form)
// ─────────────────────────────────────────────

export type ValueAddedType = Exclude<DairyProductType, 'milk' | 'eggs'>;

export interface ValueAddedConfig {
  group: OptionGroup;
  defaultVariant: string;
  /** curd & paneer also record the raw milk converted. */
  hasMilkUsed: boolean;
}

export const VALUE_ADDED_TYPES: readonly ValueAddedType[] = [
  'curd',
  'paneer',
  'butter',
  'ghee',
  'buttermilk',
  'cheese',
];

export const VALUE_ADDED_CONFIG: Record<ValueAddedType, ValueAddedConfig> = {
  curd: { group: 'milkSource', defaultVariant: 'cowA2', hasMilkUsed: true },
  paneer: { group: 'paneerType', defaultVariant: 'firmPressed', hasMilkUsed: true },
  butter: { group: 'butterType', defaultVariant: 'desiWhite', hasMilkUsed: false },
  ghee: { group: 'gheeMethod', defaultVariant: 'bilona', hasMilkUsed: false },
  buttermilk: { group: 'buttermilkType', defaultVariant: 'plain', hasMilkUsed: false },
  cheese: { group: 'cheeseType', defaultVariant: 'mozzarella', hasMilkUsed: false },
};

export function isValueAddedType(p: DairyProductType): p is ValueAddedType {
  return p !== 'milk' && p !== 'eggs';
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** `CATTLE`/`BUFFALO` display as "Cow" in this screen's milking UI, matching
 *  how a dairy farmer actually talks about their herd; `GOAT` stays "Goat". */
export function dairyAnimalTypeLabel(species: AnimalResponse['species']): DairyAnimalType {
  if (species === 'GOAT') return 'Goat';
  if (species === 'BUFFALO') return 'Buffalo';
  return 'Cow';
}

export const animalTypeText = (type: DairyAnimalType): string => t(dp(`animalType.${type.toLowerCase()}`));

export function dairyAnimalIconType(species: AnimalResponse['species']): 'cow' | 'paw' {
  return species === 'GOAT' ? 'paw' : 'cow';
}

/** `YYYY-MM-DD` parsed as a LOCAL calendar date, never `new Date(iso)`. */
function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map((part) => parseInt(part, 10));
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function formatLogDate(iso: string): string {
  if (iso === todayIso()) return t(dp('date.today'));
  const d = parseIsoDate(iso);
  return `${d.getDate()} ${t(dp(`month.${d.getMonth() + 1}`))}`;
}

function formatLogTime(createdAt: string): string {
  return new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** A raw production log -> the produce-history row this screen renders,
 *  resolving the animal's display name (milk logs only -- eggs/value-added
 *  logs carry no `animalId`) against whichever animal list the caller has
 *  in hand at that moment. */
export function toHistoryLog(log: ProductionLogResponse, animalsList: AnimalResponse[]): ProduceHistoryLog {
  // Only dairy logs reach here (non-dairy MEAT/WOOL/MANURE logs are filtered out on load).
  const localType = API_PRODUCT_TYPE_TO_LOCAL[log.productType as ApiDairyProductType];
  const meta = DAIRY_PRODUCTS.find((p) => p.id === localType);
  const animal = log.animalId ? animalsList.find((a) => a.id === log.animalId) : undefined;
  return {
    id: log.id,
    productType: localType,
    title: animal ? (animal.name ?? animal.tag) : meta ? productTitle(meta.id) : log.productType,
    subtitle: log.notes ?? log.batchInfo ?? (log.sessions ? t(dp('list.sessions'), { count: log.sessions }) : ''),
    quantityFormatted: `${log.quantity} ${meta?.unit ?? log.unit}`,
    time: formatLogTime(log.createdAt),
    date: formatLogDate(log.loggedOn),
  };
}
