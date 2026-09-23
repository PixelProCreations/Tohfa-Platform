import React, { useEffect, useState } from 'react';
import {
  BackHandler,
  ImageBackground,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { authPalette as P } from '../../theme';
import type { CropItem } from './ProduceCalendarScreen';

// ─────────────────────────────────────────────
// Inline Vector Icons (strictly no emojis, no raw hex)
// ─────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = P.white }: { size?: number; color?: string }) {
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

function PencilEditIcon({ size = 15, color = P.white }: { size?: number; color?: string }) {
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

function ChevronLeftIcon({ size = 18, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 18l-6-6 6-6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronRightIcon({ size = 18, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18l6-6-6-6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckCircleSolidIcon({ size = 18, color = P.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" fill={color} />
      <Path
        d="M8 12.5l2.8 2.8L16 9.5"
        stroke={P.white}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckMiniIcon({ size = 14, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 13l4 4L19 7"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SproutActiveIcon({ size = 18, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21v-8M12 13c0-3.5 2.5-6.5 6.5-6.5 0 4-3 6.5-6.5 6.5zM12 15c0-3-2-5.5-5.5-5.5 0 3.5 2.2 5.5 5.5 5.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TaskDotIcon({ size = 10, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="6" fill={color} />
    </Svg>
  );
}

function ThermometerIcon({ size = 13, color = P.twOrange600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DropletIcon({ size = 13, color = P.twBlue600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SparklesIcon({ size = 13, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FlagMilestoneIcon({ size = 16, color = P.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TargetMetricIcon({ size = 15, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Circle cx="12" cy="12" r="5" stroke={color} strokeWidth="1.8" />
      <Circle cx="12" cy="12" r="1.5" fill={color} />
    </Svg>
  );
}

function CalendarIcon({ size = 18, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="3" stroke={color} strokeWidth="2" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function BeakerIcon({ size = 18, color = P.twOrange600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 3h6M10 3v5l-6 10a2 2 0 0 0 1.7 3h12.6a2 2 0 0 0 1.7-3l-6-10V3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="7" y1="15" x2="17" y2="15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

function WorkforceUsersIcon({ size = 18, color = P.twBlue600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" />
      <Path
        d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function AnalyticsChartIcon({ size = 18, color = P.twOrange600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 20h18M6 16l4-6 4 4 6-8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect x="5" y="14" width="2" height="6" rx="0.5" fill={color} />
      <Rect x="11" y="11" width="2" height="9" rx="0.5" fill={color} />
      <Rect x="17" y="7" width="2" height="13" rx="0.5" fill={color} />
    </Svg>
  );
}

function SproutDiaryIcon({ size = 16, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="16" rx="3" stroke={color} strokeWidth="1.8" />
      <Path
        d="M12 16v-5M12 11c0-2 1.5-3.5 3.5-3.5 0 2-1.5 3.5-3.5 3.5zM12 13c0-1.8-1.2-3-3-3 0 1.8 1.2 3 3 3z"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CompostIcon({ size = 16, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Path
        d="M8 12c0-2.2 1.8-4 4-4 1.5 0 2.8.8 3.5 2M16 12c0 2.2-1.8 4-4 4-1.5 0-2.8-.8-3.5-2"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Crop Lifecycles & Agronomic Stages
// ─────────────────────────────────────────────

export interface GrowthStage {
  id: string;
  stageNumber: number;
  name: string;
  startDay: number;
  endDay: number;
  description: string;
  keyTasks: string[];
  optimalConditions: {
    temp: string;
    moisture: string;
    nutrients: string;
  };
}

export interface CropLifecycleData {
  totalDays: number;
  stages: GrowthStage[];
}

export const CROP_LIFECYCLES: Record<string, CropLifecycleData> = {
  carrot: {
    totalDays: 90,
    stages: [
      {
        id: 'c1',
        stageNumber: 1,
        name: 'Germination & Emergence',
        startDay: 1,
        endDay: 14,
        description: 'Seed emergence and radicle development; fine root anchoring in friable soil.',
        keyTasks: ['Maintain even soil surface moisture', 'Check for crusting and pre-emergence weeds'],
        optimalConditions: { temp: '15–22°C', moisture: '70–80%', nutrients: 'Low N, High P' },
      },
      {
        id: 'c2',
        stageNumber: 2,
        name: 'Vegetative Growth & Foliage',
        startDay: 15,
        endDay: 40,
        description: 'Rapid leaf development (4–8 true feathery leaves); primary taproot elongation.',
        keyTasks: ['Thin seedlings to 5–6 cm spacing', 'Early shallow weeding & mild fertigation'],
        optimalConditions: { temp: '18–24°C', moisture: '65–70%', nutrients: 'Balanced NPK' },
      },
      {
        id: 'c3',
        stageNumber: 3,
        name: 'Root Bulking & Thickening',
        startDay: 41,
        endDay: 70,
        description: 'Taproot diameter expansion and core accumulation; carotenoid pigment synthesis.',
        keyTasks: ['Boost potassium & phosphorus fertigation', 'Monitor moisture to avoid root cracking'],
        optimalConditions: { temp: '16–22°C', moisture: '60–70%', nutrients: 'High K, Low N' },
      },
      {
        id: 'c4',
        stageNumber: 4,
        name: 'Root Maturation & Sweetening',
        startDay: 71,
        endDay: 85,
        description: 'Sugar and starch accumulation; tip rounding and uniform vibrant orange color.',
        keyTasks: ['Brix testing (target 8–10°)', 'Reduce irrigation to enhance shelf life & flavor'],
        optimalConditions: { temp: '15–20°C', moisture: '50–60%', nutrients: 'Micro-nutrients (B, Ca)' },
      },
      {
        id: 'c5',
        stageNumber: 5,
        name: 'Harvest Ready',
        startDay: 86,
        endDay: 90,
        description: 'Peak root weight and market grade reached. Crown is level and firm.',
        keyTasks: ['Test pull sample roots for Grade A grading', 'Prepare crate packaging and cold storage'],
        optimalConditions: { temp: 'Cool morning', moisture: 'Dry surface', nutrients: 'Harvest window' },
      },
    ],
  },
  tomato: {
    totalDays: 95,
    stages: [
      {
        id: 't1',
        stageNumber: 1,
        name: 'Transplant & Establishment',
        startDay: 1,
        endDay: 20,
        description: 'Root system establishment and vegetative adaptation to field soil.',
        keyTasks: ['Provide drip irrigation with root stimulator', 'Inspect for cutworms and transplant shock'],
        optimalConditions: { temp: '20–28°C', moisture: '70–75%', nutrients: 'High P for root growth' },
      },
      {
        id: 't2',
        stageNumber: 2,
        name: 'Vegetative Canopy & Branching',
        startDay: 21,
        endDay: 45,
        description: 'Strong stem thickening, lateral branching, and vibrant green foliage growth.',
        keyTasks: ['Staking and string trellis support', 'Prune lower suckers & apply balanced NPK'],
        optimalConditions: { temp: '22–30°C', moisture: '65–70%', nutrients: 'Balanced 19:19:19' },
      },
      {
        id: 't3',
        stageNumber: 3,
        name: 'Flowering & Fruit Set',
        startDay: 46,
        endDay: 65,
        description: 'First and second flower clusters blooming; pollination and young berry formation.',
        keyTasks: ['Foliar Calcium & Boron spray to prevent blossom end rot', 'Regulate humidity for pollination'],
        optimalConditions: { temp: '20–26°C', moisture: '60–65%', nutrients: 'High P + Boron + Ca' },
      },
      {
        id: 't4',
        stageNumber: 4,
        name: 'Fruit Bulking & Color Break',
        startDay: 66,
        endDay: 85,
        description: 'Fruit sizing, firm skin formation, and lycopene turning from green to red.',
        keyTasks: ['Potassium nitrate fertigation', 'Scout for fruit borers and blight prevention'],
        optimalConditions: { temp: '20–28°C', moisture: '60–65%', nutrients: 'High K (0:0:50)' },
      },
      {
        id: 't5',
        stageNumber: 5,
        name: 'Harvest Ready',
        startDay: 86,
        endDay: 95,
        description: 'Uniform red/firm ripe state ready for multiple harvest pickings.',
        keyTasks: ['Morning hand-picking at breaker or firm-red stage', 'Sort by size and crate packing'],
        optimalConditions: { temp: 'Cool morning', moisture: 'Even moisture', nutrients: 'Grade A sorting' },
      },
    ],
  },
  cabbage: {
    totalDays: 80,
    stages: [
      {
        id: 'cb1',
        stageNumber: 1,
        name: 'Transplant & Establishment',
        startDay: 1,
        endDay: 15,
        description: 'Seedlings establish root contact and resume active vegetative leaf production.',
        keyTasks: ['Light irrigation & gap filling', 'Apply prophylactic bio-fungicide drench'],
        optimalConditions: { temp: '16–22°C', moisture: '70–75%', nutrients: 'High P starter' },
      },
      {
        id: 'cb2',
        stageNumber: 2,
        name: 'Frame & Cupping Stage',
        startDay: 16,
        endDay: 35,
        description: 'Broad wrapper leaves expand outwards; central rosette begins cupping upwards.',
        keyTasks: ['Top-dress with nitrogen fertigation', 'Monitor for diamondback moth & aphids'],
        optimalConditions: { temp: '15–20°C', moisture: '65–70%', nutrients: 'High N' },
      },
      {
        id: 'cb3',
        stageNumber: 3,
        name: 'Head Formation',
        startDay: 36,
        endDay: 60,
        description: 'Inner leaves curl tightly inwards forming the compact dense central head.',
        keyTasks: ['Maintain continuous soil moisture', 'Apply micronutrient foliar spray (B, Mo)'],
        optimalConditions: { temp: '15–18°C', moisture: '70%', nutrients: 'Balanced NPK + Ca' },
      },
      {
        id: 'cb4',
        stageNumber: 4,
        name: 'Head Bulking & Firming',
        startDay: 61,
        endDay: 75,
        description: 'Head reaches full density and firmness; outer wrapper leaves glossy.',
        keyTasks: ['Test head firmness by light pressure', 'Reduce watering to prevent head splitting'],
        optimalConditions: { temp: '14–18°C', moisture: '55–60%', nutrients: 'High K' },
      },
      {
        id: 'cb5',
        stageNumber: 5,
        name: 'Harvest Ready',
        startDay: 76,
        endDay: 80,
        description: 'Heads are rock solid, heavy, and ready for clean base cutting.',
        keyTasks: ['Cut head with 2–3 wrapper leaves', 'Transfer directly to shade/crates'],
        optimalConditions: { temp: 'Cool conditions', moisture: 'Dry foliage', nutrients: 'Grade A sorting' },
      },
    ],
  },
  potato: {
    totalDays: 100,
    stages: [
      {
        id: 'p1',
        stageNumber: 1,
        name: 'Sprout & Emergence',
        startDay: 1,
        endDay: 20,
        description: 'Sprouts emerge from seed tubers and develop root systems and initial shoots.',
        keyTasks: ['Maintain moisture without waterlogging', 'Apply starter fertilizer & check emergence'],
        optimalConditions: { temp: '15–20°C', moisture: '65–75%', nutrients: 'High P, Medium N' },
      },
      {
        id: 'p2',
        stageNumber: 2,
        name: 'Vegetative Canopy & Stolons',
        startDay: 21,
        endDay: 45,
        description: 'Vigorous vine canopy growth; stolons begin extending underground from stems.',
        keyTasks: ['First earthing-up (hilling) around stems', 'Fertigate with balanced NPK + Zinc'],
        optimalConditions: { temp: '18–24°C', moisture: '65–70%', nutrients: 'Balanced NPK' },
      },
      {
        id: 'p3',
        stageNumber: 3,
        name: 'Tuber Initiation',
        startDay: 46,
        endDay: 65,
        description: 'Stolon tips swell into marble-sized young tubers; flower buds may appear.',
        keyTasks: ['Second earthing-up to prevent greening', 'Switch to high potassium fertilizer'],
        optimalConditions: { temp: '16–20°C', moisture: '70–75%', nutrients: 'High K, Low N' },
      },
      {
        id: 'p4',
        stageNumber: 4,
        name: 'Tuber Bulking',
        startDay: 66,
        endDay: 90,
        description: 'Rapid cell enlargement and starch accumulation in tubers underground.',
        keyTasks: ['Consistent irrigation to prevent tuber deformities', 'Monitor for late blight symptoms'],
        optimalConditions: { temp: '15–18°C', moisture: '65–70%', nutrients: 'K2SO4 fertigation' },
      },
      {
        id: 'p5',
        stageNumber: 5,
        name: 'Maturation & Harvest Ready',
        startDay: 91,
        endDay: 100,
        description: 'Vines yellow/senesce; tuber skin sets and hardens for storage.',
        keyTasks: ['Dehaulming (vine cutting) 10 days before digging', 'Digging & curing in dark shade'],
        optimalConditions: { temp: '14–18°C', moisture: 'Dry soil', nutrients: 'Skin curing' },
      },
    ],
  },
  radish: {
    totalDays: 40,
    stages: [
      {
        id: 'r1',
        stageNumber: 1,
        name: 'Germination & Emergence',
        startDay: 1,
        endDay: 7,
        description: 'Quick seed sprout and cotyledon unfolding; taproot descends into soil.',
        keyTasks: ['Maintain damp topsoil', 'Scout for flea beetles'],
        optimalConditions: { temp: '15–22°C', moisture: '70–80%', nutrients: 'Light starter' },
      },
      {
        id: 'r2',
        stageNumber: 2,
        name: 'Foliage & Root Elongation',
        startDay: 8,
        endDay: 20,
        description: 'True leaves expand and taproot starts rapid linear growth and swelling.',
        keyTasks: ['Thinning to 8–10 cm spacing', 'Shallow hoeing and light fertigation'],
        optimalConditions: { temp: '15–20°C', moisture: '65–70%', nutrients: 'Balanced NPK' },
      },
      {
        id: 'r3',
        stageNumber: 3,
        name: 'Root Bulking & Thickening',
        startDay: 21,
        endDay: 35,
        description: 'Root thickens uniformly with crisp, pungent flesh and smooth white skin.',
        keyTasks: ['Steady irrigation to avoid pithiness or splitting', 'Apply soluble potash'],
        optimalConditions: { temp: '14–18°C', moisture: '60–65%', nutrients: 'High K' },
      },
      {
        id: 'r4',
        stageNumber: 4,
        name: 'Harvest Ready',
        startDay: 36,
        endDay: 40,
        description: 'Roots reach optimal size, crispness, and market weight.',
        keyTasks: ['Harvest promptly to prevent bolting/fibrousness', 'Wash, bunch, and crate'],
        optimalConditions: { temp: 'Cool morning', moisture: 'Easy pull', nutrients: 'Grade A bunching' },
      },
    ],
  },
  beans: {
    totalDays: 70,
    stages: [
      {
        id: 'b1',
        stageNumber: 1,
        name: 'Germination & Seedling',
        startDay: 1,
        endDay: 12,
        description: 'Cotyledons emerge and first trifoliate leaves open; rhizobia nodulation starts.',
        keyTasks: ['Moist seedbed without overwatering', 'Check for stem fly or damping off'],
        optimalConditions: { temp: '20–26°C', moisture: '65–70%', nutrients: 'Rhizobium + P' },
      },
      {
        id: 'b2',
        stageNumber: 2,
        name: 'Vegetative Growth & Bushing',
        startDay: 13,
        endDay: 30,
        description: 'Vigorous foliage formation, node development, and branching.',
        keyTasks: ['Staking/trellis setup for pole varieties', 'Weed management and light hoeing'],
        optimalConditions: { temp: '20–28°C', moisture: '60–65%', nutrients: 'P & K boost' },
      },
      {
        id: 'b3',
        stageNumber: 3,
        name: 'Flowering & Pod Initiation',
        startDay: 31,
        endDay: 45,
        description: 'Abundant flower clusters opening; self-pollination and tiny pods forming.',
        keyTasks: ['Avoid water stress during peak bloom', 'Foliar spray of micronutrients'],
        optimalConditions: { temp: '20–25°C', moisture: '65%', nutrients: 'Boron + Ca + K' },
      },
      {
        id: 'b4',
        stageNumber: 4,
        name: 'Pod Development & Filling',
        startDay: 46,
        endDay: 65,
        description: 'Pods elongate and flesh thickens with tender, succulent seeds.',
        keyTasks: ['Regular picking of mature pods stimulates further flowering', 'Pest scouting for pod borers'],
        optimalConditions: { temp: '20–26°C', moisture: '60–65%', nutrients: 'Potash' },
      },
      {
        id: 'b5',
        stageNumber: 5,
        name: 'Harvest Ready',
        startDay: 66,
        endDay: 70,
        description: 'Tender, snap-fresh green pods at optimal culinary tenderness.',
        keyTasks: ['Hand-pick every 2–3 days', 'Grading for straight, blemish-free pods'],
        optimalConditions: { temp: 'Morning harvest', moisture: 'Crisp snap', nutrients: 'Grade A sorting' },
      },
    ],
  },
  wheat: {
    totalDays: 120,
    stages: [
      {
        id: 'w1',
        stageNumber: 1,
        name: 'Germination & Seedling',
        startDay: 1,
        endDay: 20,
        description: 'Coleoptile emergence and root establishment; 3–4 seedling leaves.',
        keyTasks: ['Maintain initial soil moisture for even emergence', 'Pre-emergence weed control'],
        optimalConditions: { temp: '15–20°C', moisture: '65–70%', nutrients: 'Starter P + N' },
      },
      {
        id: 'w2',
        stageNumber: 2,
        name: 'Tillering & Crown Rooting',
        startDay: 21,
        endDay: 45,
        description: 'Crown root initiation (CRI) and multiple productive tillers emerging.',
        keyTasks: ['Critical first irrigation (CRI stage)', 'First urea top-dressing'],
        optimalConditions: { temp: '16–22°C', moisture: '70%', nutrients: 'High N' },
      },
      {
        id: 'w3',
        stageNumber: 3,
        name: 'Jointing & Stem Elongation',
        startDay: 46,
        endDay: 70,
        description: 'Rapid upward culm growth, flag leaf emergence, and spikelet initiation.',
        keyTasks: ['Second irrigation at late jointing', 'Scout for rust and aphid infestation'],
        optimalConditions: { temp: '18–24°C', moisture: '65%', nutrients: 'Balanced NPK' },
      },
      {
        id: 'w4',
        stageNumber: 4,
        name: 'Heading & Grain Filling',
        startDay: 71,
        endDay: 100,
        description: 'Ears emerge from boot; pollination occurs and grains fill with starch.',
        keyTasks: ['Third irrigation during grain filling', 'Avoid terminal heat stress'],
        optimalConditions: { temp: '20–25°C', moisture: '60%', nutrients: 'Potash spray' },
      },
      {
        id: 'w5',
        stageNumber: 5,
        name: 'Maturity & Harvest Ready',
        startDay: 101,
        endDay: 120,
        description: 'Grains harden with <14% moisture content; straw turns golden yellow.',
        keyTasks: ['Grain moisture test with moisture meter', 'Combine harvesting and threshing'],
        optimalConditions: { temp: 'Warm, dry weather', moisture: '<14% grain', nutrients: 'Grade A golden' },
      },
    ],
  },
};

function getCropLifecycle(crop?: CropItem | null): CropLifecycleData {
  if (!crop) return CROP_LIFECYCLES.carrot!;
  const key = (crop.cropType ?? crop.name ?? 'carrot').toLowerCase();
  for (const [name, lifecycle] of Object.entries(CROP_LIFECYCLES)) {
    if (key.includes(name)) return lifecycle;
  }
  return CROP_LIFECYCLES.carrot!;
}

// ─────────────────────────────────────────────
// Crop Milestones & Deliverables
// ─────────────────────────────────────────────

export interface CropMilestone {
  id: string;
  milestoneNumber: number;
  title: string;
  day: number;
  targetDate: string;
  category: string;
  target: string;
  actual?: string;
  status: 'achieved' | 'active' | 'upcoming';
  note: string;
}

export const CROP_MILESTONES_MAP: Record<string, CropMilestone[]> = {
  carrot: [
    {
      id: 'cm1',
      milestoneNumber: 1,
      title: 'Direct Sowing & Bed Preparation',
      day: 0,
      targetDate: '20 Apr 2026',
      category: 'Establishment',
      target: '300 g Nantes seed across 0.4 ha',
      actual: '100% bed coverage completed',
      status: 'achieved',
      note: 'Fine tilth bed prepared; zero soil crusting observed.',
    },
    {
      id: 'cm2',
      milestoneNumber: 2,
      title: 'Seedling Emergence & Stand Count',
      day: 12,
      targetDate: '2 May 2026',
      category: 'Emergence',
      target: 'Stand count > 90% uniformity',
      actual: '94% emergence rate recorded',
      status: 'achieved',
      note: 'Uniform radicle emergence across all 4 raised beds.',
    },
    {
      id: 'cm3',
      milestoneNumber: 3,
      title: 'First Thinning & Weed Clearance',
      day: 25,
      targetDate: '15 May 2026',
      category: 'Field Care',
      target: '5–6 cm plant-to-plant spacing',
      actual: 'Optimized spacing & clean bed',
      status: 'achieved',
      note: 'Prevented root tangling and inter-plant competition.',
    },
    {
      id: 'cm4',
      milestoneNumber: 4,
      title: 'Taproot Bulking & Potash Boost',
      day: 55,
      targetDate: '14 Jun 2026',
      category: 'Nutrition',
      target: 'Core diameter > 1.5 cm · High K',
      actual: '1.8 cm avg diameter reached',
      status: 'achieved',
      note: 'Potassium nitrate fertigation applied smoothly.',
    },
    {
      id: 'cm5',
      milestoneNumber: 5,
      title: 'Brix Sugar & Tip Rounding Test',
      day: 88,
      targetDate: '17 Jul 2026 (Today)',
      category: 'Quality',
      target: 'Brix sugar level ≥ 8.5°',
      actual: '8.8° Brix measured (Grade A)',
      status: 'active',
      note: 'Sample pulled: cylindrical roots with blunt tip.',
    },
    {
      id: 'cm6',
      milestoneNumber: 6,
      title: 'Harvest Ready & Cold Chain Dispatch',
      day: 90,
      targetDate: '20 Jul 2026',
      category: 'Harvest',
      target: '1,100 kg Grade A produce',
      actual: 'Pending harvest window in 2 days',
      status: 'upcoming',
      note: 'Crate packaging and washing station pre-booked.',
    },
  ],
  tomato: [
    {
      id: 'tm1',
      milestoneNumber: 1,
      title: 'Seedling Transplanting & Basal Dose',
      day: 0,
      targetDate: '2 Jun 2026',
      category: 'Establishment',
      target: '1,200 plants in 0.4 ha',
      actual: '100% transplanted',
      status: 'achieved',
      note: 'Basal compost + biofertilizer drench applied.',
    },
    {
      id: 'tm2',
      milestoneNumber: 2,
      title: 'Staking & Trellis Support Setup',
      day: 20,
      targetDate: '22 Jun 2026',
      category: 'Support',
      target: 'Stakes & twine on 100% vines',
      actual: 'Fully trellised',
      status: 'achieved',
      note: 'Supported upright growth to prevent soil contact.',
    },
    {
      id: 'tm3',
      milestoneNumber: 3,
      title: 'First Flowering & Pollination Set',
      day: 45,
      targetDate: '17 Jul 2026 (Today)',
      category: 'Flowering',
      target: '≥ 6 blooms per cluster',
      actual: '7 blooms avg with high fruit set',
      status: 'active',
      note: 'Boron + Calcium foliar spray applied.',
    },
    {
      id: 'tm4',
      milestoneNumber: 4,
      title: 'Fruit Sizing & Color Breaker Stage',
      day: 70,
      targetDate: '11 Aug 2026',
      category: 'Bulking',
      target: 'Fruit diameter > 60 mm',
      actual: 'On track',
      status: 'upcoming',
      note: 'High potassium drip scheduled.',
    },
    {
      id: 'tm5',
      milestoneNumber: 5,
      title: 'Multiple Pickings & Market Dispatch',
      day: 95,
      targetDate: '5 Sep 2026',
      category: 'Harvest',
      target: '1,800 kg Grade A yield',
      actual: 'Expected Grade A',
      status: 'upcoming',
      note: 'Crates prepared for cold transport.',
    },
  ],
  cabbage: [
    {
      id: 'cbm1',
      milestoneNumber: 1,
      title: 'Field Transplanting & Establishment',
      day: 0,
      targetDate: '26 Jun 2026',
      category: 'Establishment',
      target: '1,500 seedlings established',
      actual: '100% establishment',
      status: 'achieved',
      note: 'Zero transplant shock observed.',
    },
    {
      id: 'cbm2',
      milestoneNumber: 2,
      title: 'Wrapper Leaf Cupping & Frame',
      day: 25,
      targetDate: '21 Jul 2026 (Today)',
      category: 'Growth',
      target: 'Rosette diameter > 30 cm',
      actual: 'Strong frame established',
      status: 'active',
      note: 'Nitrogen top-dressing applied.',
    },
    {
      id: 'cbm3',
      milestoneNumber: 3,
      title: 'Central Head Solidification',
      day: 55,
      targetDate: '20 Aug 2026',
      category: 'Head Bulking',
      target: 'Dense compact core',
      actual: 'Scheduled',
      status: 'upcoming',
      note: 'Moisture maintenance to prevent split.',
    },
    {
      id: 'cbm4',
      milestoneNumber: 4,
      title: 'Grade A Head Harvest',
      day: 80,
      targetDate: '14 Sep 2026',
      category: 'Harvest',
      target: '1,500 kg solid heads',
      actual: 'Expected Grade A',
      status: 'upcoming',
      note: 'Clean base cut with wrapper leaves.',
    },
  ],
  potato: [
    {
      id: 'pm1',
      milestoneNumber: 1,
      title: 'Tuber Planting & Furrow Ridging',
      day: 0,
      targetDate: '10 May 2026',
      category: 'Planting',
      target: '1,200 kg seed tubers',
      actual: '100% planted',
      status: 'achieved',
      note: 'Well-drained loose furrows.',
    },
    {
      id: 'pm2',
      milestoneNumber: 2,
      title: 'First Earthing Up (Hilling)',
      day: 30,
      targetDate: '9 Jun 2026',
      category: 'Hilling',
      target: '15 cm soil ridges over stems',
      actual: 'Completed',
      status: 'achieved',
      note: 'Protected stolons from direct sunlight.',
    },
    {
      id: 'pm3',
      milestoneNumber: 3,
      title: 'Tuber Initiation & K2SO4 Drip',
      day: 65,
      targetDate: '14 Jul 2026 (Today)',
      category: 'Bulking',
      target: '6–8 tubers per plant',
      actual: '7 tubers average recorded',
      status: 'active',
      note: 'Soluble sulfate of potash applied.',
    },
    {
      id: 'pm4',
      milestoneNumber: 4,
      title: 'Dehaulming & Skin Curing',
      day: 90,
      targetDate: '8 Aug 2026',
      category: 'Curing',
      target: 'Skin hardening in dry soil',
      actual: 'Scheduled',
      status: 'upcoming',
      note: 'Foliage cut 10 days before digging.',
    },
    {
      id: 'pm5',
      milestoneNumber: 5,
      title: 'Main Digging & Grade A Storage',
      day: 100,
      targetDate: '18 Aug 2026',
      category: 'Harvest',
      target: '3,200 kg high-grade tubers',
      actual: 'Expected Grade A',
      status: 'upcoming',
      note: 'Dark curing sheds prepared.',
    },
  ],
  wheat: [
    {
      id: 'wm1',
      milestoneNumber: 1,
      title: 'Seed Drilling & Starter NPK',
      day: 0,
      targetDate: '15 Nov 2025',
      category: 'Sowing',
      target: '40 kg certified seed',
      actual: 'Completed',
      status: 'achieved',
      note: 'Line sowing with seed-cum-fertilizer drill.',
    },
    {
      id: 'wm2',
      milestoneNumber: 2,
      title: 'Crown Root Irrigation (CRI)',
      day: 21,
      targetDate: '6 Dec 2025',
      category: 'Irrigation',
      target: '100% field flood/sprinkler CRI',
      actual: 'Completed',
      status: 'achieved',
      note: 'Critical root anchor stage secured.',
    },
    {
      id: 'wm3',
      milestoneNumber: 3,
      title: 'Jointing & Flag Leaf Emergence',
      day: 55,
      targetDate: '9 Jan 2026',
      category: 'Tillering',
      target: '≥ 4 productive tillers/plant',
      actual: '4.5 tillers avg',
      status: 'achieved',
      note: 'Urea top-dressing + rust check completed.',
    },
    {
      id: 'wm4',
      milestoneNumber: 4,
      title: 'Heading & Grain Milk Filling',
      day: 85,
      targetDate: '8 Feb 2026 (Today)',
      category: 'Grain Set',
      target: 'Ear density > 350 spikes/m²',
      actual: '380 spikes/m² recorded',
      status: 'active',
      note: 'Potash foliar spray applied.',
    },
    {
      id: 'wm5',
      milestoneNumber: 5,
      title: 'Combine Harvest & Moisture < 14%',
      day: 120,
      targetDate: '15 Mar 2026',
      category: 'Harvest',
      target: '2,200 kg golden grain',
      actual: 'Pending harvest window',
      status: 'upcoming',
      note: 'Moisture tester calibrated.',
    },
  ],
  radish: [
    {
      id: 'rm1',
      milestoneNumber: 1,
      title: 'Direct Sowing on Ridges',
      day: 0,
      targetDate: '1 Jul 2026',
      category: 'Sowing',
      target: '200 g seed on raised beds',
      actual: 'Completed',
      status: 'achieved',
      note: 'Fine soil bed prepared.',
    },
    {
      id: 'rm2',
      milestoneNumber: 2,
      title: 'Thinning & Spacing 8 cm',
      day: 10,
      targetDate: '11 Jul 2026',
      category: 'Thinning',
      target: '8–10 cm spacing',
      actual: 'Completed',
      status: 'achieved',
      note: 'Prevented root overcrowding.',
    },
    {
      id: 'rm3',
      milestoneNumber: 3,
      title: 'Root Thickening & Potash Drip',
      day: 25,
      targetDate: '26 Jul 2026 (Today)',
      category: 'Bulking',
      target: 'Root diameter > 3 cm',
      actual: 'Crisp, solid white root',
      status: 'active',
      note: 'Irrigation calibrated to prevent pithiness.',
    },
    {
      id: 'rm4',
      milestoneNumber: 4,
      title: 'Fresh Pull Harvest & Bunching',
      day: 40,
      targetDate: '10 Aug 2026',
      category: 'Harvest',
      target: '900 kg Grade A radishes',
      actual: 'Expected Grade A',
      status: 'upcoming',
      note: 'Washing and crate packing scheduled.',
    },
  ],
  beans: [
    {
      id: 'bm1',
      milestoneNumber: 1,
      title: 'Seed Inoculation & Sowing',
      day: 0,
      targetDate: '15 May 2026',
      category: 'Sowing',
      target: '500 g treated seed',
      actual: 'Completed',
      status: 'achieved',
      note: 'Rhizobium inoculation applied.',
    },
    {
      id: 'bm2',
      milestoneNumber: 2,
      title: 'Staking & Trellis Support',
      day: 20,
      targetDate: '4 Jun 2026',
      category: 'Support',
      target: '100% vines supported',
      actual: 'Completed',
      status: 'achieved',
      note: 'Vines guided along trellis strings.',
    },
    {
      id: 'bm3',
      milestoneNumber: 3,
      title: 'Peak Flowering & Pod Initiation',
      day: 40,
      targetDate: '24 Jun 2026',
      category: 'Flowering',
      target: 'Abundant flower clusters',
      actual: 'High pod set recorded',
      status: 'achieved',
      note: 'Micronutrient spray applied.',
    },
    {
      id: 'bm4',
      milestoneNumber: 4,
      title: 'Pod Elongation & Succulence Test',
      day: 60,
      targetDate: '14 Jul 2026 (Today)',
      category: 'Quality',
      target: 'Pod length > 12 cm with tender snap',
      actual: 'Snap-fresh tender pods',
      status: 'active',
      note: 'Picking interval: every 3 days.',
    },
    {
      id: 'bm5',
      milestoneNumber: 5,
      title: 'Final Harvest & Grade A Sorting',
      day: 70,
      targetDate: '25 Jul 2026',
      category: 'Harvest',
      target: '1,200 kg snap beans',
      actual: 'Expected Grade A',
      status: 'upcoming',
      note: 'Direct farm gate dispatch.',
    },
  ],
};

function getCropMilestones(crop?: CropItem | null): CropMilestone[] {
  if (!crop) return CROP_MILESTONES_MAP.carrot!;
  const key = (crop.cropType ?? crop.name ?? 'carrot').toLowerCase();
  for (const [name, milestones] of Object.entries(CROP_MILESTONES_MAP)) {
    if (key.includes(name)) return milestones;
  }
  return CROP_MILESTONES_MAP.carrot!;
}

// ─────────────────────────────────────────────
// Crops Presets & High-Res Imagery
// ─────────────────────────────────────────────

export interface CropPreset {
  hero: string;
  thumb: string;
  defaultVariety: string;
  company: string;
  seedUsedCost: string;
  plantedOn: string;
  expectedHarvest: string;
  expectedQty: string;
  grade: string;
  diarySummary: string;
  inputsSummary: string;
  workforceSummary: string;
  npkSummary: string;
}

export const CROP_PRESETS: Record<string, CropPreset> = {
  carrot: {
    hero: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=1200&auto=format&fit=crop&q=85',
    thumb: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&auto=format&fit=crop&q=85',
    defaultVariety: 'Nantes',
    company: 'Namdhari',
    seedUsedCost: '300 g · ₹ 420',
    plantedOn: '20 Apr 2026',
    expectedHarvest: '20 Jul 2026',
    expectedQty: '1,100 kg · Grade A',
    grade: 'A',
    diarySummary: '14 logged · last 2 days ago',
    inputsSummary: '6 fertigation · 2 pest treatments',
    workforceSummary: '38 h logged · ₹ 6,400 labour',
    npkSummary: '2 of 5 nutrients running low',
  },
  tomato: {
    hero: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=1200&auto=format&fit=crop&q=85',
    thumb: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&auto=format&fit=crop&q=85',
    defaultVariety: 'Roma',
    company: 'Namdhari',
    seedUsedCost: '250 g · ₹ 480',
    plantedOn: '2 Jun 2026',
    expectedHarvest: '16 Aug 2026',
    expectedQty: '1,800 kg · Grade A',
    grade: 'A',
    diarySummary: '10 logged · last 1 day ago',
    inputsSummary: '4 fertigation · 1 pest check',
    workforceSummary: '28 h logged · ₹ 4,800 labour',
    npkSummary: 'Optimal balance',
  },
  cabbage: {
    hero: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=1200&auto=format&fit=crop&q=85',
    thumb: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=400&auto=format&fit=crop&q=85',
    defaultVariety: 'Green Coronet',
    company: 'Mahyco',
    seedUsedCost: '150 g · ₹ 350',
    plantedOn: '26 Jun 2026',
    expectedHarvest: '3 Sep 2026',
    expectedQty: '1,500 kg · Grade A',
    grade: 'A',
    diarySummary: '6 logged · last 3 days ago',
    inputsSummary: '2 fertigation · Organic compost',
    workforceSummary: '18 h logged · ₹ 3,100 labour',
    npkSummary: 'High nitrogen absorption',
  },
  potato: {
    hero: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=1200&auto=format&fit=crop&q=85',
    thumb: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&auto=format&fit=crop&q=85',
    defaultVariety: 'Kufri Jyoti',
    company: 'CPRI',
    seedUsedCost: '1,200 kg · ₹ 8,400',
    plantedOn: '10 May 2026',
    expectedHarvest: '18 Aug 2026',
    expectedQty: '3,200 kg · Grade A',
    grade: 'A',
    diarySummary: '8 logged · last 4 days ago',
    inputsSummary: '3 fertigation · Earthing up',
    workforceSummary: '42 h logged · ₹ 7,200 labour',
    npkSummary: 'Potassium replenishment needed',
  },
  radish: {
    hero: 'https://images.unsplash.com/photo-1593105544559-ecb03bf76f82?w=1200&auto=format&fit=crop&q=85',
    thumb: 'https://images.unsplash.com/photo-1593105544559-ecb03bf76f82?w=400&auto=format&fit=crop&q=85',
    defaultVariety: 'White Long',
    company: 'Syngenta',
    seedUsedCost: '200 g · ₹ 260',
    plantedOn: '1 Jul 2026',
    expectedHarvest: '10 Aug 2026',
    expectedQty: '900 kg · Grade A',
    grade: 'A',
    diarySummary: '4 logged · last 1 day ago',
    inputsSummary: '2 fertigation · Thinning done',
    workforceSummary: '14 h logged · ₹ 2,400 labour',
    npkSummary: 'Balanced moisture & phosphorus',
  },
  beans: {
    hero: 'https://images.unsplash.com/photo-1567375698348-5d9d5ae99de0?w=1200&auto=format&fit=crop&q=85',
    thumb: 'https://images.unsplash.com/photo-1567375698348-5d9d5ae99de0?w=400&auto=format&fit=crop&q=85',
    defaultVariety: 'French Bush',
    company: 'Seminis',
    seedUsedCost: '500 g · ₹ 520',
    plantedOn: '15 May 2026',
    expectedHarvest: '25 Jul 2026',
    expectedQty: '1,200 kg · Grade A',
    grade: 'A',
    diarySummary: '9 logged · last 2 days ago',
    inputsSummary: '4 fertigation · Staking complete',
    workforceSummary: '26 h logged · ₹ 4,500 labour',
    npkSummary: 'High nitrogen fixation',
  },
  wheat: {
    hero: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=1200&auto=format&fit=crop&q=85',
    thumb: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&auto=format&fit=crop&q=85',
    defaultVariety: 'Sharbati HD-2967',
    company: 'IARI',
    seedUsedCost: '40 kg · ₹ 1,800',
    plantedOn: '15 Nov 2025',
    expectedHarvest: '25 Mar 2026',
    expectedQty: '2,200 kg · Grade A',
    grade: 'A',
    diarySummary: '12 logged · last 1 day ago',
    inputsSummary: '3 irrigations · 2 top-dressing',
    workforceSummary: '32 h logged · ₹ 5,600 labour',
    npkSummary: 'Nitrogen top-dressing optimal',
  },
};

function getCropPreset(crop?: CropItem | null): CropPreset {
  if (!crop) return CROP_PRESETS.carrot!;
  const key = (crop.cropType ?? crop.name ?? 'carrot').toLowerCase();
  for (const [name, preset] of Object.entries(CROP_PRESETS)) {
    if (key.includes(name)) return preset;
  }
  return CROP_PRESETS.carrot!;
}

function resolveHeroImageUri(crop?: CropItem | null, preset?: CropPreset): string {
  const defaultHero = preset?.hero ?? CROP_PRESETS.carrot!.hero;
  if (!crop?.imageUri) return defaultHero;
  // If provided URI has a small resolution parameter, replace it with 1200
  if (crop.imageUri.includes('w=')) {
    return crop.imageUri.replace(/w=\d+/, 'w=1200');
  }
  return crop.imageUri;
}

function resolveThumbnailUri(crop?: CropItem | null, preset?: CropPreset): string {
  const defaultThumb = preset?.thumb ?? CROP_PRESETS.carrot!.thumb;
  if (!crop?.imageUri) return defaultThumb;
  if (crop.imageUri.includes('w=')) {
    return crop.imageUri.replace(/w=\d+/, 'w=400');
  }
  return crop.imageUri;
}

export interface CropDetailScreenProps {
  crop?: CropItem | null;
  onBack?: () => void;
  onEdit?: () => void;
  onNavigateToDiary?: () => void;
  onNavigateToInputs?: () => void;
  onNavigateToWorkforce?: () => void;
  onNavigateToNPK?: () => void;
  onNavigateToMilestones?: () => void;
}

export function CropDetailScreen({
  crop,
  onBack,
  onEdit,
  onNavigateToDiary,
  onNavigateToInputs,
  onNavigateToWorkforce,
  onNavigateToNPK,
  onNavigateToMilestones,
}: CropDetailScreenProps): React.JSX.Element {
  // Listen for hardware back button on Android
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (onBack) {
        onBack();
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [onBack]);

  const preset = getCropPreset(crop);
  const lifecycle = getCropLifecycle(crop);
  const title = crop ? `${crop.name} — ${crop.variety}` : `Carrot — ${preset.defaultVariety}`;
  const subtitle = crop ? `${crop.zone} · ${crop.variety} seed` : `Zone 1 — Upper Field · ${preset.defaultVariety} seed`;
  const daysOld = crop?.daysOld ?? 88;
  const daysToHarvest = crop?.statusDays ?? 3;
  const grade = preset.grade;
  const zoneArea = crop ? `${crop.zoneShort} · ${crop.area}` : 'Zone 1 · 0.4 ha';
  const varietyCompany = crop ? `${crop.variety} · ${preset.company}` : `${preset.defaultVariety} · ${preset.company}`;
  const seedUsedCost = preset.seedUsedCost;
  const plantedOn = preset.plantedOn;
  const expectedHarvest = preset.expectedHarvest;
  const expectedQty = preset.expectedQty;
  const heroImageUri = resolveHeroImageUri(crop, preset);
  const thumbnailUri = resolveThumbnailUri(crop, preset);

  // Growth Lifecycle calculations
  const totalCycleDays = lifecycle.totalDays;
  const progressPercent = Math.min(100, Math.max(0, Math.round((daysOld / totalCycleDays) * 100)));

  // Identify current active stage
  let activeStageIndex = lifecycle.stages.findIndex(
    (st) => daysOld >= st.startDay && daysOld <= st.endDay
  );
  if (activeStageIndex === -1) {
    activeStageIndex = daysOld > totalCycleDays ? lifecycle.stages.length - 1 : 0;
  }
  const currentStage = lifecycle.stages[activeStageIndex] ?? lifecycle.stages[0];

  // Milestones summary for linked records card
  const milestones = getCropMilestones(crop);
  const achievedMilestonesCount = milestones.filter((m) => m.status === 'achieved').length;
  const milestonesPercent = milestones.length > 0 ? Math.round((achievedMilestonesCount / milestones.length) * 100) : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top Hero Banner with Background Image ── */}
        <ImageBackground
          source={{ uri: heroImageUri }}
          style={styles.heroBackground}
          imageStyle={styles.heroBackgroundImage}
        >
          {/* Dark gradient overlay */}
          <View style={styles.heroOverlay}>
            <SafeAreaView style={styles.heroSafeArea}>
              {/* Navigation row: Back `<` and `Edit` */}
              <View style={styles.heroNavRow}>
                <TouchableOpacity
                  style={styles.heroBackButton}
                  onPress={onBack}
                  activeOpacity={0.7}
                  hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                >
                  <ArrowBackIcon size={20} color={P.white} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.heroEditButton}
                  onPress={onEdit}
                  activeOpacity={0.7}
                  hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                  accessibilityRole="button"
                  accessibilityLabel="Edit crop details"
                >
                  <PencilEditIcon size={14} color={P.white} />
                  <Text style={styles.heroEditText}>Edit</Text>
                </TouchableOpacity>
              </View>

              {/* Crop Title & Thumbnail Row */}
              <View style={styles.heroCropInfoRow}>
                <View style={styles.heroThumbnailWrapper}>
                  <Image source={{ uri: thumbnailUri }} style={styles.heroThumbnail} />
                </View>

                <View style={styles.heroTitleCol}>
                  <Text style={styles.heroCropTitle}>{title}</Text>
                  <Text style={styles.heroCropSubtitle}>{subtitle}</Text>
                </View>
              </View>

              {/* 3 Glassmorphism Stat Cards */}
              <View style={styles.heroStatsRow}>
                <View style={styles.glassStatCard}>
                  <Text style={styles.glassStatValue}>{daysOld}</Text>
                  <Text style={styles.glassStatLabel}>Days old</Text>
                </View>

                <View style={styles.glassStatCard}>
                  <Text style={styles.glassStatValue}>{daysToHarvest}</Text>
                  <Text style={styles.glassStatLabel}>Days to harvest</Text>
                </View>

                <View style={styles.glassStatCard}>
                  <Text style={styles.glassStatValue}>{grade}</Text>
                  <Text style={styles.glassStatLabel}>Expected grade</Text>
                </View>
              </View>
            </SafeAreaView>
          </View>
        </ImageBackground>

        {/* ── Content Body below Hero ── */}
        <View style={styles.bodyContent}>
          {/* ── Section 1: CROP DETAILS ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>CROP DETAILS</Text>
          </View>

          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Current stage</Text>
              <Text style={styles.detailValueStage}>
                Stage {currentStage?.stageNumber} ({currentStage?.name})
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Zone · Area</Text>
              <Text style={styles.detailValue}>{zoneArea}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Variety · Company</Text>
              <Text style={styles.detailValue}>{varietyCompany}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Seed used · Cost</Text>
              <Text style={styles.detailValue}>{seedUsedCost}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Planted on</Text>
              <Text style={styles.detailValue}>{plantedOn}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Expected harvest</Text>
              <Text style={styles.detailValue}>{expectedHarvest}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Expected quantity</Text>
              <Text style={styles.detailValue}>{expectedQty}</Text>
            </View>
          </View>

          {/* ── Section: LINKED RECORDS ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>LINKED RECORDS</Text>
          </View>

          <View style={styles.linkedRecordsList}>
            {/* Crop milestones */}
            <TouchableOpacity
              style={styles.linkedRecordCard}
              onPress={onNavigateToMilestones}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="View crop milestones"
            >
              <View style={[styles.linkedIconBadge, { backgroundColor: P.twGreen100 }]}>
                <FlagMilestoneIcon size={18} color={P.brandGreen} />
              </View>

              <View style={styles.linkedTextCol}>
                <Text style={styles.linkedTitle}>Crop milestones</Text>
                <Text style={styles.linkedSubtitle}>
                  {achievedMilestonesCount} of {milestones.length} completed · {milestonesPercent}% on track
                </Text>
              </View>

              <ChevronRightIcon size={18} color={P.twGray400} />
            </TouchableOpacity>

            {/* Diary entries */}
            <TouchableOpacity
              style={styles.linkedRecordCard}
              onPress={onNavigateToDiary}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="View diary entries"
            >
              <View style={[styles.linkedIconBadge, { backgroundColor: P.twGreen100 }]}>
                <CalendarIcon size={18} color={P.twGreen700} />
              </View>

              <View style={styles.linkedTextCol}>
                <Text style={styles.linkedTitle}>Diary entries</Text>
                <Text style={styles.linkedSubtitle}>{preset.diarySummary}</Text>
              </View>

              <ChevronRightIcon size={18} color={P.twGray400} />
            </TouchableOpacity>

            {/* Inputs applied */}
            <TouchableOpacity
              style={styles.linkedRecordCard}
              onPress={onNavigateToInputs}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="View inputs applied"
            >
              <View style={[styles.linkedIconBadge, { backgroundColor: P.twOrange100 }]}>
                <BeakerIcon size={18} color={P.twOrange600} />
              </View>

              <View style={styles.linkedTextCol}>
                <Text style={styles.linkedTitle}>Inputs applied</Text>
                <Text style={styles.linkedSubtitle}>{preset.inputsSummary}</Text>
              </View>

              <ChevronRightIcon size={18} color={P.twGray400} />
            </TouchableOpacity>

            {/* Workforce hours */}
            <TouchableOpacity
              style={styles.linkedRecordCard}
              onPress={onNavigateToWorkforce}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="View workforce hours"
            >
              <View style={[styles.linkedIconBadge, { backgroundColor: P.twBlue50 }]}>
                <WorkforceUsersIcon size={18} color={P.twBlue600} />
              </View>

              <View style={styles.linkedTextCol}>
                <Text style={styles.linkedTitle}>Workforce hours</Text>
                <Text style={styles.linkedSubtitle}>{preset.workforceSummary}</Text>
              </View>

              <ChevronRightIcon size={18} color={P.twGray400} />
            </TouchableOpacity>

            {/* NPK contribution */}
            <TouchableOpacity
              style={[styles.linkedRecordCard, styles.npkCard]}
              onPress={onNavigateToNPK}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="View NPK contribution"
            >
              <View style={[styles.linkedIconBadge, { backgroundColor: P.twOrange100 }]}>
                <AnalyticsChartIcon size={18} color={P.twOrange600} />
              </View>

              <View style={styles.linkedTextCol}>
                <Text style={styles.linkedTitle}>NPK contribution</Text>
                <Text style={styles.npkAlertSubtitle}>{preset.npkSummary}</Text>
              </View>

              <ChevronRightIcon size={18} color={P.twOrange600} />
            </TouchableOpacity>
          </View>

          {/* ── Section: RECENT DIARY ENTRIES ── */}
          <View style={styles.diarySectionHeader}>
            <Text style={styles.sectionTitle}>RECENT DIARY ENTRIES</Text>
            <TouchableOpacity onPress={onNavigateToDiary} activeOpacity={0.7}>
              <Text style={styles.viewAllText}>View all</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.recentDiaryList}>
            {/* Entry 1 */}
            <TouchableOpacity
              style={styles.recentDiaryItem}
              onPress={onNavigateToDiary}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="View Weeding diary entry"
            >
              <View style={[styles.diaryIconBadge, { backgroundColor: P.twGreen100 }]}>
                <SproutDiaryIcon size={16} color={P.twGreen700} />
              </View>

              <View style={styles.diaryTextCol}>
                <Text style={styles.diaryActivityTitle}>Weeding</Text>
                <Text style={styles.diaryActivityTime}>15 Jul · 06:45 AM</Text>
              </View>

              <Text style={styles.diaryDurationText}>50m</Text>
            </TouchableOpacity>

            {/* Entry 2 */}
            <TouchableOpacity
              style={styles.recentDiaryItem}
              onPress={onNavigateToDiary}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="View Manure application diary entry"
            >
              <View style={[styles.diaryIconBadge, { backgroundColor: P.twGreen100 }]}>
                <CompostIcon size={16} color={P.twGreen700} />
              </View>

              <View style={styles.diaryTextCol}>
                <Text style={styles.diaryActivityTitle}>Manure application</Text>
                <Text style={styles.diaryActivityTime}>15 Jul · 11:00 AM</Text>
              </View>

              <Text style={styles.diaryDurationText}>1h 15m</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────
// Stylesheet (strictly no raw hex literals)
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: P.paleStoneBg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroBackground: {
    width: '100%',
    minHeight: 330,
  },
  heroBackgroundImage: {
    resizeMode: 'cover',
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  heroSafeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 32) + 8 : 8,
  },
  heroNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 16,
  },
  heroBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 22,
    gap: 6,
  },
  heroEditText: {
    color: P.white,
    fontSize: 14,
    fontWeight: '700',
  },
  heroCropInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroThumbnailWrapper: {
    width: 52,
    height: 52,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    backgroundColor: P.twGray100,
  },
  heroThumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroTitleCol: {
    marginLeft: 14,
    flex: 1,
  },
  heroCropTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: P.white,
    letterSpacing: -0.3,
  },
  heroCropSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 4,
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  glassStatCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  glassStatValue: {
    fontSize: 22,
    fontWeight: '800',
    color: P.white,
  },
  glassStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  heroLifecycleBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 10,
  },
  heroLifecycleTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  heroStageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  heroStageBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: P.white,
    letterSpacing: -0.1,
  },
  heroProgressPercentText: {
    fontSize: 12,
    fontWeight: '800',
    color: P.white,
  },
  heroProgressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  heroProgressBarFill: {
    height: '100%',
    backgroundColor: P.leafGreen,
    borderRadius: 3,
  },
  bodyContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  sectionHeader: {
    marginBottom: 10,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: P.twGray500,
    letterSpacing: 0.8,
  },
  detailsCard: {
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 20,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: P.twGray500,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: P.ink,
    fontWeight: '700',
  },
  detailValueStage: {
    fontSize: 13,
    color: P.brandGreen,
    fontWeight: '800',
    backgroundColor: P.twGreen50,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: P.twGreen300,
  },
  divider: {
    height: 1,
    backgroundColor: P.twGray100,
  },

  // ── Crop Milestones (Accordion Structure) Styles ──
  milestonesSectionHeader: {
    marginBottom: 12,
    marginTop: 4,
  },
  lifecycleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  milestoneHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  milestoneAchievedBadge: {
    backgroundColor: P.twGreen50,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.twGreen300,
  },
  milestoneAchievedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: P.twGreen800,
  },
  stepperContainerCard: {
    backgroundColor: P.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.twGray200,
    paddingTop: 16,
    paddingHorizontal: 14,
    paddingBottom: 14,
    marginBottom: 20,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    paddingHorizontal: 6,
    paddingTop: 2,
    paddingBottom: 14,
  },
  stepperTrackBackground: {
    position: 'absolute',
    top: 20,
    left: 22,
    right: 22,
    height: 3,
    backgroundColor: P.twGray200,
    borderRadius: 1.5,
    zIndex: 0,
  },
  stepperTrackFill: {
    height: 3,
    backgroundColor: P.brandGreen,
    borderRadius: 1.5,
  },
  stepNodeTouchable: {
    alignItems: 'center',
    zIndex: 1,
    paddingHorizontal: 2,
  },
  stepNodeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: P.twGray300,
  },
  stepNodeCircleAchieved: {
    backgroundColor: P.brandGreen,
    borderColor: P.brandGreen,
    shadowColor: P.brandGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  stepNodeCircleActive: {
    backgroundColor: P.twGreen50,
    borderColor: P.brandGreen,
    borderWidth: 2,
  },
  stepNodeCircleUpcoming: {
    backgroundColor: P.twGray100,
    borderColor: P.twGray300,
  },
  stepNodeCircleSelected: {
    borderColor: P.brandGreen,
    borderWidth: 2.5,
    shadowColor: P.brandGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  stepNodeNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: P.twGray500,
  },
  stepNodeNumberSelected: {
    color: P.brandGreen,
    fontWeight: '800',
  },
  stepNodeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: P.twGray400,
    marginTop: 5,
  },
  stepNodeLabelActive: {
    color: P.twGreen700,
    fontWeight: '700',
  },
  stepNodeLabelSelected: {
    color: P.brandGreen,
    fontWeight: '800',
  },
  stepNodeActivePill: {
    width: 14,
    height: 3,
    backgroundColor: P.brandGreen,
    borderRadius: 1.5,
    marginTop: 3,
  },
  selectedMilestoneCard: {
    backgroundColor: P.twGray50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: 14,
    marginTop: 4,
  },
  selectedMilestoneHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  selectedMilestoneTitleCol: {
    flex: 1,
  },
  selectedMilestoneTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: P.ink,
    letterSpacing: -0.3,
    lineHeight: 21,
    marginTop: 4,
    marginBottom: 4,
  },
  milestoneDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  selectedMilestoneDate: {
    fontSize: 11.5,
    color: P.twGray500,
    fontWeight: '500',
  },
  milestoneTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  milestoneNumberText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: P.twGray400,
    letterSpacing: 0.5,
  },
  milestoneCategoryPill: {
    backgroundColor: P.twGray200,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  milestoneCategoryText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: P.twGray600,
  },
  completeActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: P.twGreen50,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: P.twGreen300,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  completeActionButtonAchieved: {
    backgroundColor: P.brandGreen,
    borderColor: P.brandGreen,
  },
  completeActionButtonText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: P.twGreen700,
  },
  completeActionButtonTextAchieved: {
    fontSize: 11.5,
    fontWeight: '700',
    color: P.white,
  },
  uncompletedCircleIcon: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.2,
    borderColor: P.twGreen600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneDeliverablesGrid: {
    gap: 8,
    marginBottom: 10,
  },
  milestoneDeliverableCard: {
    backgroundColor: P.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: 11,
  },
  milestoneDeliverableCardAchieved: {
    backgroundColor: P.twGreen50,
    borderColor: P.twGreen100,
  },
  deliverableCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  deliverableCardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: P.twGray500,
    letterSpacing: 0.4,
  },
  deliverableCardLabelAchieved: {
    color: P.twGreen700,
  },
  deliverableCardValue: {
    fontSize: 13,
    fontWeight: '600',
    color: P.ink,
    lineHeight: 18,
  },
  deliverableCardValueAchieved: {
    color: P.twGreen900,
    fontWeight: '700',
  },
  milestoneObservationCard: {
    backgroundColor: P.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: 11,
    marginBottom: 12,
  },
  observationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  observationHeaderTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: P.twGray600,
    letterSpacing: 0.2,
  },
  observationCardText: {
    fontSize: 12,
    lineHeight: 17,
    color: P.twGray600,
    fontStyle: 'italic',
  },
  stepperNavControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: P.twGray200,
  },
  stepperNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: P.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: P.twGray200,
  },
  stepperNavBtnDisabled: {
    backgroundColor: P.twGray50,
    borderColor: P.twGray100,
    opacity: 0.5,
  },
  stepperNavBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: P.twGreen700,
  },
  stepperNavBtnTextDisabled: {
    color: P.twGray300,
  },
  stepperNavCounterText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: P.twGray500,
  },
  linkedRecordsList: {
    gap: 12,
    marginBottom: 22,
  },
  linkedRecordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: P.twGray200,
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  npkCard: {
    borderColor: P.twOrange200,
  },
  linkedIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkedTextCol: {
    flex: 1,
    marginLeft: 14,
  },
  linkedTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: P.ink,
  },
  linkedSubtitle: {
    fontSize: 12,
    color: P.twGray500,
    marginTop: 2,
  },
  npkAlertSubtitle: {
    fontSize: 12,
    color: P.twOrange600,
    fontWeight: '600',
    marginTop: 2,
  },
  diarySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 4,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: P.twGreen700,
  },
  recentDiaryList: {
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    overflow: 'hidden',
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  recentDiaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  diaryIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diaryTextCol: {
    flex: 1,
    marginLeft: 12,
  },
  diaryActivityTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: P.ink,
  },
  diaryActivityTime: {
    fontSize: 12,
    color: P.twGray400,
    marginTop: 2,
  },
  diaryDurationText: {
    fontSize: 14,
    fontWeight: '700',
    color: P.twGreen700,
  },
  bottomSpacer: {
    height: 30,
  },
});
