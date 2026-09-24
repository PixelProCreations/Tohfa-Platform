import React, { useState } from 'react';
import {
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
import { authPalette as P, colors } from '../../theme';

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

function EggIcon({ size = 20, color = '#B45309', fill }: { size?: number; color?: string; fill?: string }) {
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

function CurdIcon({ size = 20, color = '#2563EB' }: { size?: number; color?: string }) {
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

function PaneerIcon({ size = 20, color = '#D97706' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="5" width="16" height="14" rx="3" stroke={color} strokeWidth="2" />
      <Path d="M4 12h16M12 5v14" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function ButterIcon({ size = 20, color = '#CA8A04' }: { size?: number; color?: string }) {
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

function GheeIcon({ size = 20, color = '#EA580C' }: { size?: number; color?: string }) {
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

function ButtermilkIcon({ size = 20, color = '#0284C7' }: { size?: number; color?: string }) {
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

function CheeseIcon({ size = 20, color = '#DB2777' }: { size?: number; color?: string }) {
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

function InfoCircleIcon({ size = 18, color = '#0284C7' }: { size?: number; color?: string }) {
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

function ChevronRightIcon({ size = 16, color = '#9CA3AF' }: { size?: number; color?: string }) {
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

function PlusIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
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
    badgeBg: '#EFF6FF',
    accentColor: '#2563EB',
  },
  {
    id: 'paneer',
    title: 'Paneer (Cottage Cheese)',
    category: 'Fresh Cheese',
    unit: 'Kg',
    defaultUnitLabel: 'Kg',
    subtitle: 'Fresh soft curd or pressed paneer blocks',
    badgeBg: '#FEF3C7',
    accentColor: '#D97706',
  },
  {
    id: 'butter',
    title: 'Butter / Makhan',
    category: 'Churned Dairy',
    unit: 'Kg',
    defaultUnitLabel: 'Kg',
    subtitle: 'Traditional bilona or cultured fresh butter',
    badgeBg: '#FEF9C3',
    accentColor: '#CA8A04',
  },
  {
    id: 'ghee',
    title: 'Desi Ghee (Clarified Butter)',
    category: 'Artisanal Dairy',
    unit: 'L',
    defaultUnitLabel: 'Liters',
    subtitle: 'Slow-cooked aromatic pure cow or buffalo ghee',
    badgeBg: '#FFEDD5',
    accentColor: '#EA580C',
  },
  {
    id: 'buttermilk',
    title: 'Buttermilk / Chaas / Moru',
    category: 'Dairy Beverage',
    unit: 'L',
    defaultUnitLabel: 'Liters',
    subtitle: 'Fresh seasoned or plain churned buttermilk',
    badgeBg: '#E0F2FE',
    accentColor: '#0284C7',
  },
  {
    id: 'cheese',
    title: 'Farm Cheese',
    category: 'Artisanal Cheese',
    unit: 'Kg',
    defaultUnitLabel: 'Kg',
    subtitle: 'Artisanal cheddar, mozzarella, or goat cheese',
    badgeBg: '#FDF2F8',
    accentColor: '#DB2777',
  },
  {
    id: 'eggs',
    title: 'Eggs (Poultry / Country)',
    category: 'Poultry Produce',
    unit: 'Eggs',
    defaultUnitLabel: 'Count',
    subtitle: 'Daily flock egg collection & harvest count',
    badgeBg: '#FEF3C7',
    accentColor: '#B45309',
  },
];

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

interface FlockEggItem {
  id: string;
  name: string;
  subtitle: string;
  count: number;
  hensCount: number;
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

interface AvailableFlock {
  id: string;
  name: string;
  subtitle: string;
  hensCount: number;
}

const AVAILABLE_ANIMALS: AvailableAnimal[] = [
  { id: 'a1', name: 'Lakshmi', type: 'Cow', breed: 'Jersey', code: 'C-014', iconType: 'cow' },
  { id: 'a2', name: 'Ganga', type: 'Cow', breed: 'HF Cross', code: 'C-015', iconType: 'cow' },
  { id: 'a3', name: 'Malli', type: 'Goat', breed: 'Malabari', code: 'G-021', iconType: 'paw' },
  { id: 'a4', name: 'Kaveri', type: 'Buffalo', breed: 'Murrah', code: 'B-007', iconType: 'cow' },
];

const AVAILABLE_FLOCKS: AvailableFlock[] = [
  { id: 'f1', name: 'Backyard flock', subtitle: '18 hens · logged daily as a group', hensCount: 18 },
  { id: 'f2', name: 'Layer Flock B', subtitle: '25 hens · Cage-free shed 2', hensCount: 25 },
  { id: 'f3', name: 'Country Hen Group', subtitle: '12 hens · Free-range orchard', hensCount: 12 },
];

const SESSIONS_MILK: string[] = ['Morning (AM)', 'Evening (PM)', 'Afternoon (Noon)'];
const SESSIONS_EGGS: string[] = ['Morning collection', 'Afternoon collection', 'Evening collection'];

const MILK_SOURCES = ['Pure Cow Milk (A2)', 'Pure Buffalo Milk', 'Mixed Farm Dairy', 'Goat Milk'];
const PANEER_TYPES = ['Soft Fresh Curd', 'Firm Pressed Blocks', 'Spiced / Herbed Paneer'];
const BUTTER_TYPES = ['Desi White Makhan', 'Cultured Salted', 'Cultured Unsalted'];
const GHEE_METHODS = ['Traditional Vedic Bilona', 'Direct Cream Simmered', 'Slow Cooked A2'];
const BUTTERMILK_TYPES = ['Plain Churned Chaas', 'Spiced Masala Moru', 'Mint Coriander Refresh'];
const CHEESE_TYPES = ['Farm Mozzarella', 'Mild Cheddar', 'Gouda', 'Fresh Feta / Cottage'];

export function DairyProduceScreen({ onBack }: DairyProduceScreenProps): React.JSX.Element {
  // Production stats state
  const [animals, setAnimals] = useState<AnimalMilkItem[]>([
    { id: 'a1', name: 'Lakshmi', breed: 'Jersey', type: 'Cow', yieldLiters: 9.5, sessions: 2, iconType: 'cow' },
    { id: 'a2', name: 'Ganga', breed: 'HF Cross', type: 'Cow', yieldLiters: 6.0, sessions: 2, iconType: 'cow' },
    { id: 'a3', name: 'Malli', breed: 'Malabari', type: 'Goat', yieldLiters: 3.0, sessions: 2, iconType: 'paw' },
  ]);

  const [flocks, setFlocks] = useState<FlockEggItem[]>([
    { id: 'f1', name: 'Backyard flock', subtitle: '18 hens · logged daily as a group', count: 24, hensCount: 18 },
  ]);

  const [valueAddedProduce, setValueAddedProduce] = useState<ValueAddedProduceItem[]>([
    { id: 'va1', type: 'paneer', name: 'Fresh Paneer', quantity: 2.5, unit: 'Kg', batchInfo: 'A2 Cow Milk (15 L used) · Firm Pressed', date: 'Today' },
    { id: 'va2', type: 'curd', name: 'Farm Curd (Dahi)', quantity: 6.0, unit: 'Kg', batchInfo: 'Morning Batch · Buffalo Milk', date: 'Today' },
    { id: 'va3', type: 'ghee', name: 'Desi A2 Ghee', quantity: 1.2, unit: 'L', batchInfo: 'Bilona Traditional · Batch #GH-22', date: 'Today' },
  ]);

  // History logs
  const [historyLogs, setHistoryLogs] = useState<ProduceHistoryLog[]>([
    { id: 'h1', productType: 'milk', title: 'Lakshmi (Cow · Jersey)', subtitle: 'Morning (AM) · Fat 4.4%', quantityFormatted: '5.5 L', time: '06:30 AM', date: 'Today' },
    { id: 'h2', productType: 'milk', title: 'Lakshmi (Cow · Jersey)', subtitle: 'Evening (PM) · Fat 4.2%', quantityFormatted: '4.0 L', time: '05:45 PM', date: 'Today' },
    { id: 'h3', productType: 'milk', title: 'Ganga (Cow · HF Cross)', subtitle: 'Morning (AM) · Fat 3.9%', quantityFormatted: '3.5 L', time: '06:45 AM', date: 'Today' },
    { id: 'h4', productType: 'milk', title: 'Malli (Goat · Malabari)', subtitle: 'Morning (AM)', quantityFormatted: '1.8 L', time: '07:15 AM', date: 'Today' },
    { id: 'h5', productType: 'paneer', title: 'Fresh Paneer', subtitle: 'A2 Cow Milk · Firm Pressed', quantityFormatted: '2.5 Kg', time: '09:30 AM', date: 'Today' },
    { id: 'h6', productType: 'curd', title: 'Farm Curd (Dahi)', subtitle: 'Morning Batch · Buffalo Milk', quantityFormatted: '6.0 Kg', time: '10:15 AM', date: 'Today' },
    { id: 'h7', productType: 'ghee', title: 'Desi A2 Ghee', subtitle: 'Bilona Vedic Method', quantityFormatted: '1.2 L', time: '11:00 AM', date: 'Today' },
    { id: 'h8', productType: 'eggs', title: 'Backyard flock', subtitle: 'Morning collection', quantityFormatted: '18 eggs', time: '08:00 AM', date: 'Today' },
    { id: 'h9', productType: 'eggs', title: 'Backyard flock', subtitle: 'Evening collection', quantityFormatted: '6 eggs', time: '05:15 PM', date: 'Today' },
  ]);

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

  // Safely resolved current selections
  const currentAnimal: AvailableAnimal = AVAILABLE_ANIMALS[selectedAnimalIndex] ?? AVAILABLE_ANIMALS[0]!;
  const currentFlock: AvailableFlock = AVAILABLE_FLOCKS[selectedFlockIndex] ?? AVAILABLE_FLOCKS[0]!;
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
        return <CurdIcon size={size} color="#2563EB" />;
      case 'paneer':
        return <PaneerIcon size={size} color="#D97706" />;
      case 'butter':
        return <ButterIcon size={size} color="#CA8A04" />;
      case 'ghee':
        return <GheeIcon size={size} color="#EA580C" />;
      case 'buttermilk':
        return <ButtermilkIcon size={size} color="#0284C7" />;
      case 'cheese':
        return <CheeseIcon size={size} color="#DB2777" />;
      case 'eggs':
        return <EggIcon size={size} color="#B45309" fill="#B45309" />;
      default:
        return <DropIcon size={size} color={colors.brandGreen} />;
    }
  };

  // Save Unified Production Log
  const handleSaveProductionLog = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (selectedProduct === 'milk') {
      const qty = parseFloat(milkQuantity.trim());
      if (isNaN(qty) || qty <= 0) {
        Alert.alert('Invalid Quantity', 'Please enter a valid milk quantity in liters.');
        return;
      }
      const animal = currentAnimal;
      setAnimals((prev) => {
        const existing = prev.find((a) => a.id === animal.id);
        if (existing) {
          return prev.map((a) =>
            a.id === animal.id
              ? { ...a, yieldLiters: parseFloat((a.yieldLiters + qty).toFixed(1)), sessions: a.sessions + 1 }
              : a,
          );
        } else {
          return [
            ...prev,
            {
              id: animal.id,
              name: animal.name,
              breed: animal.breed,
              type: animal.type,
              yieldLiters: parseFloat(qty.toFixed(1)),
              sessions: 1,
              iconType: animal.iconType,
            },
          ];
        }
      });
      const fatInfo = fatPercentage.trim() ? ` · Fat ${fatPercentage}%` : '';
      setHistoryLogs((prev) => [
        {
          id: `h_${Date.now()}`,
          productType: 'milk',
          title: `${animal.name} (${animal.type} · ${animal.breed})`,
          subtitle: `${selectedMilkSession}${fatInfo}`,
          quantityFormatted: `${qty} L`,
          time: timeStr,
          date: 'Today',
        },
        ...prev,
      ]);
      Alert.alert('Milk Logged', `Successfully logged ${qty} L milk for ${animal.name}.`);
      setMilkQuantity('');
      setFatPercentage('');
    } else if (selectedProduct === 'eggs') {
      const count = parseInt(eggCount.trim(), 10);
      if (isNaN(count) || count <= 0) {
        Alert.alert('Invalid Count', 'Please enter a valid good egg count.');
        return;
      }
      const flock = currentFlock;
      setFlocks((prev) => {
        const existing = prev.find((f) => f.id === flock.id);
        if (existing) {
          return prev.map((f) =>
            f.id === flock.id ? { ...f, count: f.count + count } : f,
          );
        } else {
          return [
            ...prev,
            {
              id: flock.id,
              name: flock.name,
              subtitle: flock.subtitle,
              count: count,
              hensCount: flock.hensCount,
            },
          ];
        }
      });
      const dmgInfo = damagedEggCount.trim() ? ` (${damagedEggCount} damaged)` : '';
      setHistoryLogs((prev) => [
        {
          id: `h_${Date.now()}`,
          productType: 'eggs',
          title: flock.name,
          subtitle: `${selectedEggSession}${dmgInfo}`,
          quantityFormatted: `${count} eggs`,
          time: timeStr,
          date: 'Today',
        },
        ...prev,
      ]);
      Alert.alert('Eggs Logged', `Successfully logged ${count} eggs for ${flock.name}.`);
      setEggCount('');
      setDamagedEggCount('');
    } else {
      // Value-added dairy (curd, paneer, butter, ghee, buttermilk, cheese)
      let qtyStr = '';
      let titleName = currentProductMeta.title;
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

      setValueAddedProduce((prev) => [
        {
          id: `va_${Date.now()}`,
          type: selectedProduct,
          name: titleName,
          quantity: qty,
          unit: currentProductMeta.unit,
          batchInfo: batchInfo || 'Batch Today',
          date: 'Today',
        },
        ...prev,
      ]);

      setHistoryLogs((prev) => [
        {
          id: `h_${Date.now()}`,
          productType: selectedProduct,
          title: titleName,
          subtitle: batchInfo || produceNotes || 'Farm Log',
          quantityFormatted: `${qty} ${currentProductMeta.unit}`,
          time: timeStr,
          date: 'Today',
        },
        ...prev,
      ]);

      Alert.alert('Produce Logged', `Successfully recorded ${qty} ${currentProductMeta.unit} of ${titleName}.`);
      setCurdQuantity('');
      setPaneerQuantity('');
      setButterQuantity('');
      setGheeQuantity('');
      setButtermilkQuantity('');
      setCheeseQuantity('');
    }

    setProduceNotes('');
    setIsLogModalOpen(false);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

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
            <ArrowBackIcon size={20} color="#111827" />
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
            <View style={[styles.summaryIconBox, { backgroundColor: '#FFEDD5' }]}>
              <GheeIcon size={18} color="#EA580C" />
            </View>
            <Text style={styles.summaryNumber}>{totalValueAddToday.toFixed(1)}</Text>
            <Text style={styles.summaryLabel}>Dairy products</Text>
          </View>

          {/* Eggs Summary Card */}
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconBox, { backgroundColor: '#FEF3C7' }]}>
              <EggIcon size={18} color="#B45309" fill="#B45309" />
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
                <PlusIcon size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.logDropdownBtnText}>+ Log Production</Text>
            </View>
            <View style={{ transform: [{ rotate: isLogProduceDropdownOpen ? '180deg' : '0deg' }] }}>
              <ChevronDownIcon size={18} color="#FFFFFF" />
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
                      <ChevronRightIcon size={16} color="#9CA3AF" />
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
                <View style={[styles.itemIconBadge, { backgroundColor: meta?.badgeBg || '#F3F4F6' }]}>
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
              <View style={[styles.itemIconBadge, { backgroundColor: '#FEF3C7' }]}>
                <EggIcon size={20} color="#B45309" fill="#B45309" />
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
            <InfoCircleIcon size={18} color="#0284C7" />
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
                <ChevronDownIcon size={18} color="#6B7280" />
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
                    <ChevronDownIcon size={18} color="#6B7280" />
                  </TouchableOpacity>

                  {isAnimalDropdownOpen && (
                    <View style={styles.dropdownMenu}>
                      {AVAILABLE_ANIMALS.map((animal, idx) => {
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
                    <ChevronDownIcon size={18} color="#6B7280" />
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
                    placeholderTextColor="#9CA3AF"
                    value={milkQuantity}
                    onChangeText={setMilkQuantity}
                  />

                  {/* Fat % */}
                  <Text style={[styles.inputLabel, { marginTop: 14 }]}>Fat % / SNF (Optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="decimal-pad"
                    placeholder="e.g. 4.2"
                    placeholderTextColor="#9CA3AF"
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
                    <ChevronDownIcon size={18} color="#6B7280" />
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
                    placeholderTextColor="#9CA3AF"
                    value={curdQuantity}
                    onChangeText={setCurdQuantity}
                  />

                  <Text style={[styles.inputLabel, { marginTop: 14 }]}>Raw Milk Converted (Liters)</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="decimal-pad"
                    placeholder="e.g. 6.0"
                    placeholderTextColor="#9CA3AF"
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
                    <ChevronDownIcon size={18} color="#6B7280" />
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
                    placeholderTextColor="#9CA3AF"
                    value={paneerQuantity}
                    onChangeText={setPaneerQuantity}
                  />

                  <Text style={[styles.inputLabel, { marginTop: 14 }]}>Raw Milk Used (Liters)</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="decimal-pad"
                    placeholder="e.g. 15.0"
                    placeholderTextColor="#9CA3AF"
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
                    <ChevronDownIcon size={18} color="#6B7280" />
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
                    placeholderTextColor="#9CA3AF"
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
                    <ChevronDownIcon size={18} color="#6B7280" />
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
                    placeholderTextColor="#9CA3AF"
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
                    <ChevronDownIcon size={18} color="#6B7280" />
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
                    placeholderTextColor="#9CA3AF"
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
                    <ChevronDownIcon size={18} color="#6B7280" />
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
                    placeholderTextColor="#9CA3AF"
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
                      <View style={[styles.miniBadge, { backgroundColor: '#FEF3C7' }]}>
                        <EggIcon size={16} color="#B45309" fill="#B45309" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.dropdownSelectedText}>{currentFlock.name}</Text>
                        <Text style={styles.dropdownSelectedSub}>{currentFlock.subtitle}</Text>
                      </View>
                    </View>
                    <ChevronDownIcon size={18} color="#6B7280" />
                  </TouchableOpacity>

                  {isFlockDropdownOpen && (
                    <View style={styles.dropdownMenu}>
                      {AVAILABLE_FLOCKS.map((flock, idx) => {
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
                              <Text style={[styles.menuItemTitle, isSelected && { color: '#8D5B18', fontWeight: '700' }]}>
                                {flock.name}
                              </Text>
                              <Text style={styles.menuItemSub}>{flock.subtitle}</Text>
                            </View>
                            {isSelected && <CheckIcon size={18} color="#8D5B18" />}
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
                    <ChevronDownIcon size={18} color="#6B7280" />
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
                            <Text style={[styles.menuItemTitle, isSelected && { color: '#8D5B18', fontWeight: '700' }]}>
                              {session}
                            </Text>
                            {isSelected && <CheckIcon size={18} color="#8D5B18" />}
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
                    placeholderTextColor="#9CA3AF"
                    value={eggCount}
                    onChangeText={setEggCount}
                  />

                  <Text style={[styles.inputLabel, { marginTop: 14 }]}>Damaged / Cracked Count (Optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="number-pad"
                    placeholder="e.g. 0"
                    placeholderTextColor="#9CA3AF"
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
                placeholderTextColor="#9CA3AF"
                value={produceNotes}
                onChangeText={setProduceNotes}
              />
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsLogModalOpen(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSaveBtn, { backgroundColor: colors.brandGreen }]}
                onPress={handleSaveProductionLog}
              >
                <Text style={styles.modalSaveBtnText}>Save {currentProductMeta.title} Log</Text>
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
                      <View style={[styles.itemIconBadge, { backgroundColor: meta?.badgeBg || '#F3F4F6' }]}>
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
    backgroundColor: '#FAFAFA',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
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
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
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
    shadowColor: '#000',
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
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  logDropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderTopWidth: 0,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownCategoryHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
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
    fontSize: 10.5,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
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
    fontSize: 14.5,
    fontWeight: '700',
    color: '#111827',
  },
  logOptionSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  logDropdownDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
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
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  historyLinkText: {
    fontSize: 13,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    gap: 12,
    shadowColor: '#000',
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
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  itemSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
    marginTop: 2,
  },
  itemRightCol: {
    alignItems: 'flex-end',
  },
  itemStatBig: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  itemStatSub: {
    fontSize: 11,
    fontWeight: '400',
    color: '#6B7280',
    marginTop: 2,
  },

  /* Info Callout */
  infoCallout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
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
    fontSize: 12.5,
    color: '#1E40AF',
    lineHeight: 18,
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
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
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },

  /* Form Elements in Modals */
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
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
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  dropdownSelectedSub: {
    fontSize: 11,
    color: '#6B7280',
  },
  dropdownMenu: {
    marginTop: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
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
    borderBottomColor: '#F3F4F6',
  },
  dropdownMenuItemActive: {
    backgroundColor: colors.brandGreenLight,
  },
  menuItemTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#111827',
  },
  menuItemSub: {
    fontSize: 11,
    color: '#6B7280',
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
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  modalSaveBtn: {
    flex: 1.4,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSaveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
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
    backgroundColor: '#F3F4F6',
  },
  filterTabBtnActive: {
    backgroundColor: colors.brandGreen,
  },
  filterTabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  filterTabBtnTextActive: {
    color: '#FFFFFF',
  },

  /* History Cards */
  historyItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  historyTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#111827',
  },
  historySub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  historyValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
});
