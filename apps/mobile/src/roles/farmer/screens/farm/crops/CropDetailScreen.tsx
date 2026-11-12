import React, { useEffect } from 'react';
import { BackHandler, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { ErrorState, Skeleton, ScreenStatusBar } from '@tohfa/mobile-ui';
import { fromPaise, format as formatMoney } from '@tohfa/shared-types';
import { t } from '../../../../../i18n/farmer';
import { authPalette as P, radius, spacing } from '../../../theme';
import type { DiaryEntrySummary } from '../../../api/farmDiary';
import type { CropItem } from './ProduceCalendarScreen';
import { CropDetailsSection } from './cropDetail/CropDetailsSection';
import { CropHeroCard } from './cropDetail/CropHeroCard';
import { LinkedRecordsSection } from './cropDetail/LinkedRecordsSection';
import { RecentDiarySection } from './cropDetail/RecentDiarySection';
import { daysBetween, formatGradeLabel, formatIsoDisplay } from './cropDetail/format';
import { useCropDetail } from './cropDetail/useCropDetail';

// Preset-mode fallbacks shown when no real farm_crops row backs the screen.
const FALLBACK_DAYS_OLD = 88;
const FALLBACK_DAYS_TO_HARVEST = 3;
const RECENT_DIARY_LIMIT = 2;
const HERO_SKELETON_HEIGHT = 220;
const CARD_SKELETON_HEIGHT = 160;

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

  const cropId = crop?.id;
  const { farmCrop, cropPlot, diaryEntries, loadingCrop, cropError, loadCropDetail } = useCropDetail(cropId);

  const preset = getCropPreset(crop);
  const lifecycle = getCropLifecycle(crop);

  const plantedOnDate = farmCrop?.plantedOn ? new Date(farmCrop.plantedOn) : null;
  const expectedHarvestOnDate = farmCrop?.expectedHarvestOn ? new Date(farmCrop.expectedHarvestOn) : null;

  const title = farmCrop
    ? t('farmer.cropDetail.title', { crop: farmCrop.cropName, variety: farmCrop.seedVariety ?? farmCrop.cropName })
    : crop
      ? t('farmer.cropDetail.title', { crop: crop.name, variety: crop.variety })
      : t('farmer.cropDetail.title', {
        crop: t('farmer.cropDetail.fallback.cropName'),
        variety: preset.defaultVariety,
      });
  const subtitle = farmCrop
    ? t('farmer.cropDetail.subtitle', {
      zone: cropPlot?.name ?? crop?.zone ?? '',
      variety: farmCrop.seedVariety ?? farmCrop.cropName,
    })
    : crop
      ? t('farmer.cropDetail.subtitle', { zone: crop.zone, variety: crop.variety })
      : t('farmer.cropDetail.subtitle', {
        zone: t('farmer.cropDetail.fallback.zone'),
        variety: preset.defaultVariety,
      });
  const daysOld = farmCrop
    ? plantedOnDate
      ? Math.max(0, daysBetween(plantedOnDate, new Date()))
      : 0
    : (crop?.daysOld ?? FALLBACK_DAYS_OLD);
  const daysToHarvest = farmCrop
    ? expectedHarvestOnDate
      ? daysBetween(new Date(), expectedHarvestOnDate)
      : 0
    : (crop?.statusDays ?? FALLBACK_DAYS_TO_HARVEST);
  const grade = farmCrop?.expectedGrade ? farmCrop.expectedGrade.replace('GRADE_', '') : preset.grade;
  const zoneArea = farmCrop
    ? `${cropPlot?.name ?? '—'}${cropPlot?.areaAcres !== null && cropPlot?.areaAcres !== undefined
      ? ` · ${cropPlot.areaAcres} ${t('farmer.cropDetail.unit.acres')}`
      : ''
    }`
    : crop
      ? `${crop.zoneShort} · ${crop.area}`
      : t('farmer.cropDetail.fallback.zoneArea');
  const varietyCompany = farmCrop
    ? `${farmCrop.seedVariety ?? '—'} · ${farmCrop.seedCompany ?? '—'}`
    : crop
      ? `${crop.variety} · ${preset.company}`
      : `${preset.defaultVariety} · ${preset.company}`;
  const seedUsedCost = farmCrop
    ? `${farmCrop.seedQuantity ?? '—'}${farmCrop.seedQuantityUnit ? ` ${farmCrop.seedQuantityUnit}` : ''} · ${farmCrop.seedCostPaise !== null ? formatMoney(fromPaise(farmCrop.seedCostPaise)) : '—'
    }`
    : preset.seedUsedCost;
  const plantedOn = farmCrop ? formatIsoDisplay(farmCrop.plantedOn) : preset.plantedOn;
  const expectedHarvest = farmCrop ? formatIsoDisplay(farmCrop.expectedHarvestOn) : preset.expectedHarvest;
  const expectedQty = farmCrop
    ? `${farmCrop.expectedYieldKg ?? '—'} ${t('farmer.cropDetail.unit.kg')}${farmCrop.expectedGrade ? ` · ${formatGradeLabel(farmCrop.expectedGrade)}` : ''
    }`
    : preset.expectedQty;

  const mostRecentDiaryEntry = diaryEntries?.reduce<DiaryEntrySummary | null>(
    (latest, entry) => (!latest || entry.loggedAt > latest.loggedAt ? entry : latest),
    null,
  );
  const diarySummaryText =
    diaryEntries === null || diaryEntries === undefined
      ? preset.diarySummary
      : diaryEntries.length === 0
        ? t('farmer.crops.detail.diaryNone')
        : t('farmer.crops.detail.diarySummary', {
          count: diaryEntries.length,
          days: mostRecentDiaryEntry ? Math.max(0, daysBetween(new Date(mostRecentDiaryEntry.loggedAt), new Date())) : 0,
        });
  const recentDiaryEntries = (diaryEntries ?? [])
    .slice()
    .sort((a, b) => (a.loggedAt < b.loggedAt ? 1 : -1))
    .slice(0, RECENT_DIARY_LIMIT);
  const heroImageUri = resolveHeroImageUri(crop, preset);
  const thumbnailUri = resolveThumbnailUri(crop, preset);

  // Growth Lifecycle calculations
  const totalCycleDays = lifecycle.totalDays;

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

  if (cropId && loadingCrop) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Skeleton width="100%" height={HERO_SKELETON_HEIGHT} borderRadius={radius.xl} />
          <Skeleton width="100%" height={CARD_SKELETON_HEIGHT} borderRadius={radius.xl} />
          <Skeleton width="100%" height={CARD_SKELETON_HEIGHT} borderRadius={radius.xl} />
        </View>
      </SafeAreaView>
    );
  }

  if (cropId && cropError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <ErrorState error={cropError} onRetry={loadCropDetail} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenStatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <CropHeroCard
          heroImageUri={heroImageUri}
          thumbnailUri={thumbnailUri}
          title={title}
          subtitle={subtitle}
          daysOld={daysOld}
          daysToHarvest={daysToHarvest}
          grade={grade}
          onBack={onBack}
          onEdit={onEdit}
        />

        {/* Content body below hero */}
        <View style={styles.bodyContent}>
          <CropDetailsSection
            farmCrop={farmCrop}
            currentStage={currentStage}
            zoneArea={zoneArea}
            varietyCompany={varietyCompany}
            seedUsedCost={seedUsedCost}
            plantedOn={plantedOn}
            expectedHarvest={expectedHarvest}
            expectedQty={expectedQty}
          />

          <LinkedRecordsSection
            achievedMilestonesCount={achievedMilestonesCount}
            milestonesTotal={milestones.length}
            milestonesPercent={milestonesPercent}
            diarySummaryText={diarySummaryText}
            inputsSummary={preset.inputsSummary}
            workforceSummary={preset.workforceSummary}
            npkSummary={preset.npkSummary}
            onNavigateToMilestones={onNavigateToMilestones}
            onNavigateToDiary={onNavigateToDiary}
            onNavigateToInputs={onNavigateToInputs}
            onNavigateToWorkforce={onNavigateToWorkforce}
            onNavigateToNPK={onNavigateToNPK}
          />

          <RecentDiarySection
            hasFarmCrop={farmCrop !== null}
            recentDiaryEntries={recentDiaryEntries}
            onNavigateToDiary={onNavigateToDiary}
          />

          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>
    </View>
  );
}

// Stylesheet (strictly no raw hex literals)

const SCROLL_PADDING_BOTTOM = 40;
const LOADING_GAP = 14;
const ERROR_PADDING = 24;
const BODY_PADDING_TOP = 18;
const BOTTOM_SPACER_HEIGHT = 30;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: P.paleStoneBg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SCROLL_PADDING_BOTTOM,
  },
  loadingContainer: {
    flex: 1,
    padding: spacing.lg,
    gap: LOADING_GAP,
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    padding: ERROR_PADDING,
    justifyContent: 'center',
  },
  bodyContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: BODY_PADDING_TOP,
  },
  bottomSpacer: {
    height: BOTTOM_SPACER_HEIGHT,
  },
});
