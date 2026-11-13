import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import {
  customerColors,
  customerFonts,
  customerShadow,
  customerSpacing,
} from '../theme';
import { CustomerFloatingNav, CustomerActiveTab } from '../components/CustomerFloatingNav';
import dashboardBannerHarvest from '../assets/images/dashboard_banner_harvest.png';
import bannerFarmFreshVegetables from '../assets/images/banner_farm_fresh_vegetables.png';
import tohfaMarketLogo from '../assets/images/tohfa_market_logo.png';
import { CategoryImages, ProductImages, SectionBadges } from '../assets/images/products';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HomeScreenProps {
  onNavigate?: (screen: string, params?: Record<string, unknown>) => void;
}

// ── SVG ICONS FOR LOADING BUFFER (EXACT FIGMA SPEC) ─────────────────────────

const DetailedCeleryHerbIcon = () => (
  <Svg width={36} height={36} viewBox="0 0 36 36" fill="none">
    <Path
      d="M18 31V16M18 24C14 20 10 19 8 16M18 21C22 18 26 17 28 14"
      stroke="#4CAF50"
      strokeWidth={1.8}
      strokeLinecap="round"
    />
    <Path
      d="M18 16C16 13 14 10 15 7C17 5 19 6 18 9C20 6 23 7 22 10C21 13 19 14 18 16Z"
      stroke="#4CAF50"
      strokeWidth={1.6}
      strokeLinejoin="round"
      fill="#C8E6C9"
      fillOpacity={0.6}
    />
    <Path
      d="M8 16C6 14 5 11 7 9C9 8 10 10 10 12C11 9 14 10 13 13C12 15 10 16 8 16Z"
      stroke="#4CAF50"
      strokeWidth={1.5}
      strokeLinejoin="round"
      fill="#C8E6C9"
      fillOpacity={0.5}
    />
    <Path
      d="M28 14C30 12 31 9 29 7C27 6 26 8 26 10C25 7 22 8 23 11C24 13 26 14 28 14Z"
      stroke="#4CAF50"
      strokeWidth={1.5}
      strokeLinejoin="round"
      fill="#C8E6C9"
      fillOpacity={0.5}
    />
  </Svg>
);

const DetailedOrangeWithSliceIcon = () => (
  <Svg width={46} height={46} viewBox="0 0 46 46" fill="none">
    <Circle cx={19} cy={26} r={14} stroke="#2E7D32" strokeWidth={2.2} />
    <Path
      d="M19 12C20 8 24 6 28 7C28 11 25 14 21 13"
      stroke="#2E7D32"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="#81C784"
    />
    <Path d="M21 13L25 9.5" stroke="#2E7D32" strokeWidth={1.4} strokeLinecap="round" />
    <Path
      d="M25 21C33 22 38 27 37 35C30 36 24 31 25 21Z"
      stroke="#2E7D32"
      strokeWidth={2.2}
      strokeLinejoin="round"
      fill="#E8F5E9"
    />
    <Path
      d="M27 24C31 25 35 29 34 33M28 27L32 30M30 25L33 28"
      stroke="#2E7D32"
      strokeWidth={1.5}
      strokeLinecap="round"
    />
  </Svg>
);

const DetailedEggIcon = () => (
  <Svg width={36} height={36} viewBox="0 0 36 36" fill="none">
    <Path
      d="M18 5C13 5 9 12 9 20C9 26 13 31 18 31C23 31 27 26 27 20C27 12 23 5 18 5Z"
      stroke="#4CAF50"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const HeartSvg = ({ filled = false }: { filled?: boolean }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      fill={filled ? '#EF4444' : 'none'}
      stroke={filled ? '#EF4444' : '#9CA3AF'}
      strokeWidth={1.6}
    />
  </Svg>
);

// Flying Grocery Bag with Wings SVG (Section 2)
const FlyingBagWithWingsSvg = () => (
  <Svg width={74} height={64} viewBox="0 0 80 70" fill="none">
    <Path
      d="M14 26C8 18 12 8 26 10C24 16 22 22 18 28"
      stroke="#D4A373"
      strokeWidth={2}
      fill="#FAEDCD"
      strokeLinecap="round"
    />
    <Path
      d="M66 26C72 18 68 8 54 10C56 16 58 22 62 28"
      stroke="#D4A373"
      strokeWidth={2}
      fill="#FAEDCD"
      strokeLinecap="round"
    />
    <Path
      d="M18 54C16 50 20 46 25 46C27 42 33 42 36 45C39 43 45 44 46 48C50 48 53 52 50 56C48 58 22 58 18 54Z"
      fill="#E0F2FE"
      opacity={0.8}
    />
    <Path
      d="M26 24L28 52C28 54 30 56 32 56H48C50 56 52 54 52 52L54 24H26Z"
      fill="#D4A373"
      stroke="#BC6C25"
      strokeWidth={1.5}
    />
    <Path
      d="M34 24V18C34 16 36 14 40 14C44 14 46 16 46 18V24"
      stroke="#BC6C25"
      strokeWidth={2}
      strokeLinecap="round"
    />
    <Path
      d="M36 40C38 34 44 32 44 32C44 32 44 38 40 42C38 44 36 42 36 40Z"
      fill="#2E7D32"
    />
  </Svg>
);

// Product Card interface
interface ProductCardData {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  unit: string;
  rating: number;
  emoji: string;
  image?: any;
}

// ── FULL PRODUCT CATALOG BY SECTION (EXACT FIGMA EXTRACTED IMAGES) ──────────

const FOR_YOU_ITEMS: ProductCardData[] = [
  { id: 'fy1', name: 'Watermelon', price: 60, originalPrice: 86, unit: 'kg', rating: 4.5, emoji: '🍉', image: ProductImages.foryouWatermelon },
  { id: 'fy2', name: 'Green Curly Lettuce', price: 60, originalPrice: 86, unit: 'kg', rating: 4.6, emoji: '🥬', image: ProductImages.foryouLettuce },
  { id: 'fy3', name: 'Strawberries', price: 60, originalPrice: 86, unit: 'kg', rating: 4.6, emoji: '🍓', image: ProductImages.foryouStrawberries },
  { id: 'fy4', name: 'Fresh Tomatoes', price: 60, originalPrice: 86, unit: 'kg', rating: 4.5, emoji: '🍅', image: ProductImages.foryouTomatoes },
  { id: 'fy5', name: 'Sweet Mango', price: 60, originalPrice: 86, unit: 'kg', rating: 4.7, emoji: '🥭', image: ProductImages.foryouMango },
  { id: 'fy6', name: 'Brinjal', price: 60, originalPrice: 86, unit: 'kg', rating: 4.6, emoji: '🍆', image: ProductImages.foryouBrinjal },
  { id: 'fy7', name: 'Sweet Corn', price: 60, originalPrice: 86, unit: 'piece', rating: 4.7, emoji: '🌽', image: ProductImages.foryouSweetCorn },
  { id: 'fy8', name: 'Fresh Kiwi', price: 60, originalPrice: 86, unit: 'kg', rating: 4.8, emoji: '🥝', image: ProductImages.foryouKiwi },
  { id: 'fy9', name: 'Broccoli', price: 60, originalPrice: 86, unit: 'kg', rating: 4.6, emoji: '🥦', image: ProductImages.foryouBroccoli },
  { id: 'fy10', name: 'Fresh Carrot', price: 60, originalPrice: 86, unit: 'kg', rating: 4.6, emoji: '🥕', image: ProductImages.foryouCarrot },
];

const VEGETABLE_ITEMS: ProductCardData[] = [
  { id: 'veg1', name: 'Potato', price: 60, originalPrice: 86, unit: 'kg', rating: 4.5, emoji: '🥔', image: ProductImages.vegPotato },
  { id: 'veg2', name: 'Fresh Carrot', price: 60, originalPrice: 86, unit: 'kg', rating: 4.6, emoji: '🥕', image: ProductImages.vegCarrot },
  { id: 'veg3', name: 'Beetroot', price: 60, originalPrice: 86, unit: 'kg', rating: 4.6, emoji: '🥬', image: ProductImages.vegBeetroot },
  { id: 'veg4', name: 'Broccoli', price: 60, originalPrice: 86, unit: 'kg', rating: 4.7, emoji: '🥦', image: ProductImages.vegBroccoli },
  { id: 'veg5', name: 'Cauliflower', price: 60, originalPrice: 86, unit: 'kg', rating: 4.5, emoji: '🥬', image: ProductImages.vegCauliflower },
  { id: 'veg6', name: 'Pumpkin', price: 60, originalPrice: 86, unit: 'kg', rating: 4.5, emoji: '🎃', image: ProductImages.vegPumpkin },
];

const FRUIT_ITEMS: ProductCardData[] = [
  { id: 'fr1', name: 'Apple', price: 60, originalPrice: 86, unit: 'kg', rating: 4.5, emoji: '🍎', image: ProductImages.fruitApple },
  { id: 'fr2', name: 'Orange', price: 60, originalPrice: 86, unit: 'kg', rating: 4.6, emoji: '🍊', image: ProductImages.fruitOrange },
  { id: 'fr3', name: 'Banana Robusta', price: 60, originalPrice: 86, unit: 'dozen', rating: 4.8, emoji: '🍌', image: ProductImages.fruitBanana },
  { id: 'fr4', name: 'Pomegranate', price: 60, originalPrice: 86, unit: 'kg', rating: 4.7, emoji: '🍎', image: ProductImages.fruitPomegranate },
  { id: 'fr5', name: 'Grapes', price: 60, originalPrice: 86, unit: 'kg', rating: 4.6, emoji: '🍇', image: ProductImages.fruitGrapes },
];

const DRY_FRUITS_ITEMS: ProductCardData[] = [
  { id: 'df1', name: 'Jumbo Figs', price: 60, originalPrice: 86, unit: 'g', rating: 4.5, emoji: '🌰', image: ProductImages.dryfruitFig },
  { id: 'df2', name: 'Raisin Indian Bold', price: 60, originalPrice: 86, unit: 'g', rating: 4.6, emoji: '🥣', image: ProductImages.dryfruitRaisinBold },
  { id: 'df3', name: 'Raisin Munakka', price: 60, originalPrice: 86, unit: 'g', rating: 4.6, emoji: '🥣', image: ProductImages.dryfruitRaisinMunakka },
  { id: 'df4', name: 'Whole Cashews', price: 60, originalPrice: 86, unit: 'g', rating: 4.7, emoji: '🥜', image: ProductImages.dryfruitCashew },
  { id: 'df5', name: 'Iranian Pistachio', price: 60, originalPrice: 86, unit: 'g', rating: 4.6, emoji: '🥜', image: ProductImages.dryfruitPistachio },
  { id: 'df6', name: 'California Almonds', price: 60, originalPrice: 86, unit: 'g', rating: 4.8, emoji: '🥜', image: ProductImages.dryfruitAlmond },
  { id: 'df7', name: 'Walnut Kernels', price: 60, originalPrice: 86, unit: 'g', rating: 4.7, emoji: '🥣', image: ProductImages.dryfruitWalnut },
];

const DAIRY_ITEMS: ProductCardData[] = [
  { id: 'da1', name: 'Milk', price: 60, originalPrice: 86, unit: 'L', rating: 4.5, emoji: '🥛', image: ProductImages.dairyMilk },
  { id: 'da2', name: 'Eggs', price: 60, originalPrice: 86, unit: 'piece', rating: 4.5, emoji: '🥚', image: ProductImages.dairyEggs },
  { id: 'da3', name: 'Curd (Dahi)', price: 60, originalPrice: 86, unit: 'g', rating: 4.6, emoji: '🥣', image: ProductImages.dairyCurd },
  { id: 'da4', name: 'Spiced Buttermilk', price: 60, originalPrice: 86, unit: 'L', rating: 4.7, emoji: '🥛', image: ProductImages.dairyButtermilk },
  { id: 'da5', name: 'White Butter', price: 60, originalPrice: 86, unit: 'g', rating: 4.6, emoji: '🧈', image: ProductImages.dairyButter },
  { id: 'da6', name: 'Desi Cow Ghee', price: 60, originalPrice: 86, unit: 'g', rating: 4.9, emoji: '🍯', image: ProductImages.dairyGhee },
  { id: 'da7', name: 'Fresh Paneer', price: 60, originalPrice: 86, unit: 'g', rating: 4.7, emoji: '🧀', image: ProductImages.dairyPaneer },
  { id: 'da8', name: 'Artisan Cheese', price: 60, originalPrice: 86, unit: 'g', rating: 4.6, emoji: '🧀', image: ProductImages.dairyCheese },
  { id: 'da9', name: 'Fresh Cream', price: 60, originalPrice: 86, unit: 'g', rating: 4.6, emoji: '🥛', image: ProductImages.dairyFreshCream },
];

const GRAIN_ITEMS: ProductCardData[] = [
  { id: 'gr1', name: 'Rice (raw)', price: 60, originalPrice: 86, unit: 'kg', rating: 4.6, emoji: '🍚', image: ProductImages.grainRawRice },
  { id: 'gr2', name: 'Brown rice', price: 60, originalPrice: 86, unit: 'kg', rating: 4.6, emoji: '🌾', image: ProductImages.grainBrownRice },
  { id: 'gr3', name: 'Wheat', price: 60, originalPrice: 86, unit: 'kg', rating: 4.6, emoji: '🌾', image: ProductImages.grainWheat },
  { id: 'gr4', name: 'Ragi (Finger millet)', price: 60, originalPrice: 86, unit: 'kg', rating: 4.5, emoji: '🌾', image: ProductImages.grainRagi },
  { id: 'gr5', name: 'Little millet (samai)', price: 60, originalPrice: 86, unit: 'kg', rating: 4.6, emoji: '🌾', image: ProductImages.grainLittleMillet },
  { id: 'gr6', name: 'Foxtail millet (thinai)', price: 60, originalPrice: 86, unit: 'kg', rating: 4.6, emoji: '🌾', image: ProductImages.grainFoxtailMillet },
  { id: 'gr7', name: 'Barnyard millet', price: 60, originalPrice: 86, unit: 'kg', rating: 4.5, emoji: '🌾', image: ProductImages.grainBarnyardMillet },
  { id: 'gr8', name: 'Kodo millet (varagu)', price: 60, originalPrice: 86, unit: 'kg', rating: 4.6, emoji: '🌾', image: ProductImages.grainKodoMillet },
  { id: 'gr9', name: 'Pearl millet (bajra)', price: 60, originalPrice: 86, unit: 'kg', rating: 4.6, emoji: '🌾', image: ProductImages.grainPearlMillet },
  { id: 'gr10', name: 'Sorghum', price: 60, originalPrice: 86, unit: 'kg', rating: 4.5, emoji: '🌾', image: ProductImages.grainSorghum },
  { id: 'gr11', name: 'Maize', price: 60, originalPrice: 86, unit: 'kg', rating: 4.5, emoji: '🌽', image: ProductImages.grainMaize },
  { id: 'gr12', name: 'Oats', price: 60, originalPrice: 86, unit: 'pack', rating: 4.6, emoji: '🥣', image: ProductImages.grainOats },
];

const FRESH_COMBOS_ITEMS: ProductCardData[] = [
  { id: 'fc1', name: 'ABC Combo', price: 60, originalPrice: 86, unit: 'pack', rating: 4.6, emoji: '🥗', image: ProductImages.comboAbc },
  { id: 'fc2', name: 'Baingan Bharta', price: 60, originalPrice: 86, unit: 'pack', rating: 4.6, emoji: '🍆', image: ProductImages.comboBainganBharta },
  { id: 'fc3', name: 'Beat the Heat', price: 60, originalPrice: 86, unit: 'pack', rating: 4.6, emoji: '🥒', image: ProductImages.comboBeatHeat },
  { id: 'fc4', name: 'Oil Combo', price: 60, originalPrice: 86, unit: 'pack', rating: 4.5, emoji: '🍾', image: ProductImages.comboOil },
  { id: 'fc5', name: 'Flour Combo', price: 60, originalPrice: 86, unit: 'pack', rating: 4.5, emoji: '🥡', image: ProductImages.comboFlour },
];

const SPREADS_ITEMS: ProductCardData[] = [
  { id: 'sp1', name: 'Basil Pesto', price: 60, originalPrice: 86, unit: 'portion', rating: 4.6, emoji: '🥣', image: ProductImages.spreadBasilPesto },
  { id: 'sp2', name: 'Beetroot Hummus', price: 60, originalPrice: 86, unit: 'portion', rating: 4.6, emoji: '🥣', image: ProductImages.spreadBeetrootHummus },
  { id: 'sp3', name: 'Chilli Mango Dressing', price: 60, originalPrice: 86, unit: 'portion', rating: 4.6, emoji: '🥣', image: ProductImages.spreadChilliMango },
  { id: 'sp4', name: 'Garlic Hummus', price: 60, originalPrice: 86, unit: 'portion', rating: 4.5, emoji: '🥣', image: ProductImages.spreadGarlicHummus },
  { id: 'sp5', name: 'Guacamole', price: 60, originalPrice: 86, unit: 'portion', rating: 4.6, emoji: '🥣', image: ProductImages.spreadGuacamole },
  { id: 'sp6', name: 'Honey Mustard', price: 60, originalPrice: 86, unit: 'portion', rating: 4.6, emoji: '🥣', image: ProductImages.spreadHoneyMustard },
  { id: 'sp7', name: 'Thai Dressing', price: 60, originalPrice: 86, unit: 'portion', rating: 4.6, emoji: '🥣', image: ProductImages.spreadThaiDressing },
  { id: 'sp8', name: 'Vinaigrette Salad Dressing', price: 60, originalPrice: 86, unit: 'portion', rating: 4.6, emoji: '🥣', image: ProductImages.spreadVinaigrette },
];

const SPICES_ITEMS: ProductCardData[] = [
  { id: 'sc1', name: 'Black pepper', price: 60, originalPrice: 86, unit: 'kg', rating: 4.6, emoji: '🧂', image: ProductImages.spiceBlackPepper },
  { id: 'sc2', name: 'Cardamom', price: 60, originalPrice: 86, unit: 'pack', rating: 4.5, emoji: '🧂', image: ProductImages.spiceCardamom },
  { id: 'sc3', name: 'Cloves', price: 60, originalPrice: 86, unit: 'pack', rating: 4.6, emoji: '🧂', image: ProductImages.spiceCloves },
  { id: 'sc4', name: 'Cinnamon', price: 60, originalPrice: 86, unit: 'pack', rating: 4.7, emoji: '🧂', image: ProductImages.spiceCinnamon },
  { id: 'sc5', name: 'Turmeric', price: 60, originalPrice: 86, unit: 'kg', rating: 4.6, emoji: '🧂', image: ProductImages.spiceTurmeric },
  { id: 'sc6', name: 'Ginger fresh', price: 60, originalPrice: 86, unit: 'kg', rating: 4.5, emoji: '🧂', image: ProductImages.spiceGingerFresh },
  { id: 'sc7', name: 'Dry ginger', price: 60, originalPrice: 86, unit: 'pack', rating: 4.6, emoji: '🧂', image: ProductImages.spiceDryGinger },
  { id: 'sc8', name: 'Dry red chilli', price: 60, originalPrice: 86, unit: 'kg', rating: 4.6, emoji: '🌶️', image: ProductImages.spiceDryRedChilli },
  { id: 'sc9', name: 'Coriander seeds', price: 60, originalPrice: 86, unit: 'kg', rating: 4.5, emoji: '🧂', image: ProductImages.spiceCorianderSeeds },
  { id: 'sc10', name: 'Cumin', price: 60, originalPrice: 86, unit: 'kg', rating: 4.6, emoji: '🧂', image: ProductImages.spiceCumin },
  { id: 'sc11', name: 'Mustard seeds', price: 60, originalPrice: 86, unit: 'kg', rating: 4.5, emoji: '🧂', image: ProductImages.spiceMustardSeeds },
];

const SOAKED_ITEMS: ProductCardData[] = [
  { id: 'so1', name: 'Soaked afghan Figs', price: 60, originalPrice: 86, unit: 'portion', rating: 4.5, emoji: '🥄', image: ProductImages.soakedFig },
  { id: 'so2', name: 'Soaked Afghan Munakka', price: 60, originalPrice: 86, unit: 'portion', rating: 4.6, emoji: '🥄', image: ProductImages.soakedMunakka },
  { id: 'so3', name: 'Soaked Black Chana', price: 60, originalPrice: 86, unit: 'portion', rating: 4.6, emoji: '🥄', image: ProductImages.soakedBlackChana },
  { id: 'so4', name: 'Soaked Walnuts', price: 60, originalPrice: 86, unit: 'portion', rating: 4.7, emoji: '🥄', image: ProductImages.soakedWalnuts },
  { id: 'so5', name: 'Soaked Jeera', price: 60, originalPrice: 86, unit: 'portion', rating: 4.5, emoji: '🥄', image: ProductImages.soakedJeera },
];

const BREADS_ITEMS: ProductCardData[] = [
  { id: 'br1', name: 'Milk Bread', price: 60, originalPrice: 86, unit: 'loaf', rating: 4.6, emoji: '🍞', image: ProductImages.breadMilk },
  { id: 'br2', name: 'Multigrain Loaf', price: 60, originalPrice: 86, unit: 'loaf', rating: 4.6, emoji: '🥖', image: ProductImages.breadMultigrain },
  { id: 'br3', name: 'Sandwich Bread', price: 60, originalPrice: 86, unit: 'loaf', rating: 4.5, emoji: '🍞', image: ProductImages.breadSandwich },
  { id: 'br4', name: 'Sourdough Loaf', price: 60, originalPrice: 86, unit: 'loaf', rating: 4.7, emoji: '🍞', image: ProductImages.breadSourdough },
];

const FLOUR_ITEMS: ProductCardData[] = [
  { id: 'fl1', name: 'Whole Wheat Flour', price: 60, originalPrice: 86, unit: 'loaf', rating: 4.6, emoji: '🥡', image: ProductImages.flourWheat },
  { id: 'fl2', name: 'Ragi Flour', price: 60, originalPrice: 86, unit: 'loaf', rating: 4.6, emoji: '🥡', image: ProductImages.flourRagi },
  { id: 'fl3', name: 'Rice Flour', price: 60, originalPrice: 86, unit: 'loaf', rating: 4.6, emoji: '🥡', image: ProductImages.flourRice },
  { id: 'fl4', name: 'Maize Flour', price: 60, originalPrice: 86, unit: 'loaf', rating: 4.5, emoji: '🥡', image: ProductImages.flourMaize },
  { id: 'fl5', name: 'Foxtail Millet Flour', price: 60, originalPrice: 86, unit: 'loaf', rating: 4.5, emoji: '🥡', image: ProductImages.flourFoxtail },
];

const EXOTIC_ITEMS: ProductCardData[] = [
  { id: 'ex1', name: 'Baby corn', price: 60, originalPrice: 86, unit: 'pack', rating: 4.6, emoji: '🌽', image: ProductImages.exoticBabycorn },
  { id: 'ex2', name: 'Cabbage Purple', price: 60, originalPrice: 86, unit: 'pack', rating: 4.6, emoji: '🥬', image: ProductImages.exoticCabbagePurple },
  { id: 'ex3', name: 'Fresh Celery', price: 60, originalPrice: 86, unit: 'bunch', rating: 4.7, emoji: '🌿', image: ProductImages.exoticCelery },
  { id: 'ex4', name: 'Cherry Tomato', price: 60, originalPrice: 86, unit: 'pack', rating: 4.7, emoji: '🍅', image: ProductImages.exoticCherryTomato },
  { id: 'ex5', name: 'Thai Chilli', price: 60, originalPrice: 86, unit: 'pack', rating: 4.6, emoji: '🌶️', image: ProductImages.exoticChilliThai },
  { id: 'ex6', name: 'Thai Ginger', price: 60, originalPrice: 86, unit: 'pack', rating: 4.5, emoji: '🧄', image: ProductImages.exoticGingerThai },
  { id: 'ex7', name: 'Fresh Rosemary', price: 60, originalPrice: 86, unit: 'bunch', rating: 4.6, emoji: '🌿', image: ProductImages.exoticRosemary },
];

const SWEET_NATURE_ITEMS: ProductCardData[] = [
  { id: 'sn1', name: 'Natural Honey', price: 60, originalPrice: 86, unit: 'g', rating: 4.6, emoji: '🍯', image: ProductImages.sweetHoney },
  { id: 'sn2', name: 'Forest Honey', price: 60, originalPrice: 86, unit: 'g', rating: 4.6, emoji: '🍯', image: ProductImages.sweetForestHoney },
  { id: 'sn3', name: 'Palm Jaggery', price: 60, originalPrice: 86, unit: 'g', rating: 4.8, emoji: '🪵', image: ProductImages.sweetPalmJaggery },
  { id: 'sn4', name: 'Country Jaggery', price: 60, originalPrice: 86, unit: 'g', rating: 4.6, emoji: '🪵', image: ProductImages.sweetCountryJaggery },
  { id: 'sn5', name: 'Cane Jaggery', price: 60, originalPrice: 86, unit: 'g', rating: 4.6, emoji: '🪵', image: ProductImages.sweetCaneJaggery },
];

const HERBS_GREENS_ITEMS: ProductCardData[] = [
  { id: 'hg1', name: 'Thyme', price: 60, originalPrice: 86, unit: 'bunch', rating: 4.6, emoji: '🌿', image: ProductImages.herbThyme },
  { id: 'hg2', name: 'Coriander leaves', price: 60, originalPrice: 86, unit: 'bunch', rating: 4.6, emoji: '🌱', image: ProductImages.herbCoriander },
  { id: 'hg3', name: 'Mint leaves', price: 60, originalPrice: 86, unit: 'bunch', rating: 4.6, emoji: '🍃', image: ProductImages.herbMint },
  { id: 'hg4', name: 'Spring Onion', price: 60, originalPrice: 86, unit: 'bunch', rating: 4.5, emoji: '🌱', image: ProductImages.herbSpringOnion },
  { id: 'hg5', name: 'Spinach (Palak)', price: 60, originalPrice: 86, unit: 'bunch', rating: 4.7, emoji: '🥬', image: ProductImages.herbSpinach },
  { id: 'hg6', name: 'Lettuce', price: 60, originalPrice: 86, unit: 'bunch', rating: 4.6, emoji: '🥬', image: ProductImages.herbLettuce },
  { id: 'hg7', name: 'Celery', price: 60, originalPrice: 86, unit: 'bunch', rating: 4.6, emoji: '🌿', image: ProductImages.herbCelery },
  { id: 'hg8', name: 'Parsley', price: 60, originalPrice: 86, unit: 'bunch', rating: 4.6, emoji: '🌿', image: ProductImages.herbParsley },
  { id: 'hg9', name: 'Amaranth', price: 60, originalPrice: 86, unit: 'bunch', rating: 4.5, emoji: '🌱', image: ProductImages.herbAmaranth },
  { id: 'hg10', name: 'Kale', price: 60, originalPrice: 86, unit: 'bunch', rating: 4.7, emoji: '🥬', image: ProductImages.herbKale },
  { id: 'hg11', name: 'Rosemary', price: 60, originalPrice: 86, unit: 'bunch', rating: 4.6, emoji: '🌿', image: ProductImages.herbRosemary },
];

const EVERYDAY_KITCHEN_ITEMS: ProductCardData[] = [
  { id: 'ek1', name: 'Garlic Paste', price: 60, originalPrice: 86, unit: 'pack', rating: 4.6, emoji: '🧄', image: ProductImages.kitchenGarlicPaste },
  { id: 'ek2', name: 'Ginger Paste', price: 60, originalPrice: 86, unit: 'pack', rating: 4.6, emoji: '🧄', image: ProductImages.kitchenGingerPaste },
  { id: 'ek3', name: 'Ginger & Garlic Paste', price: 60, originalPrice: 86, unit: 'pack', rating: 4.6, emoji: '🧄', image: ProductImages.kitchenGingerGarlicPaste },
  { id: 'ek4', name: 'Onion Tomato Gravy', price: 60, originalPrice: 86, unit: 'pack', rating: 4.5, emoji: '🥫', image: ProductImages.kitchenOnionTomatoGravy },
  { id: 'ek5', name: 'Tomato Gravy', price: 60, originalPrice: 86, unit: 'pack', rating: 4.6, emoji: '🥫', image: ProductImages.kitchenTomatoGravy },
  { id: 'ek6', name: 'Tomato Puree', price: 60, originalPrice: 86, unit: 'pack', rating: 4.6, emoji: '🥫', image: ProductImages.kitchenTomatoPuree },
  { id: 'ek7', name: 'Onion Tomato Masala', price: 60, originalPrice: 86, unit: 'pack', rating: 4.6, emoji: '🥫', image: ProductImages.kitchenOnionTomatoMasala },
];

const TEA_COFFEE_ITEMS: ProductCardData[] = [
  { id: 'tc1', name: 'Nilgiri Green Tea', price: 60, originalPrice: 86, unit: 'kg', rating: 4.6, emoji: '🍵', image: ProductImages.teaNilgiriGreen },
  { id: 'tc2', name: 'Nilgiri Black Tea', price: 60, originalPrice: 86, unit: 'kg', rating: 4.6, emoji: '☕', image: ProductImages.teaNilgiriBlack },
  { id: 'tc3', name: 'Orthodox Tea', price: 60, originalPrice: 86, unit: 'dozen', rating: 4.6, emoji: '🍵', image: ProductImages.teaOrthodox },
  { id: 'tc4', name: 'Arabica Coffee Beans', price: 60, originalPrice: 86, unit: 'kg', rating: 4.5, emoji: '☕', image: ProductImages.coffeeArabicaBeans },
  { id: 'tc5', name: 'Robusta Coffee Beans', price: 60, originalPrice: 86, unit: 'kg', rating: 4.6, emoji: '☕', image: ProductImages.coffeeRobustaBeans },
  { id: 'tc6', name: 'Organic Arabica Beans', price: 60, originalPrice: 86, unit: 'kg', rating: 4.5, emoji: '☕', image: ProductImages.coffeeOrganicBeans },
  { id: 'tc7', name: 'Instant Coffee', price: 60, originalPrice: 86, unit: 'pack', rating: 4.6, emoji: '☕', image: ProductImages.coffeeInstant },
  { id: 'tc8', name: 'Masala Tea Blend', price: 60, originalPrice: 86, unit: 'kg', rating: 4.5, emoji: '🍵', image: ProductImages.teaMasalaBlend },
  { id: 'tc9', name: 'Green Tea Powder', price: 60, originalPrice: 86, unit: 'piece', rating: 4.6, emoji: '🍵', image: ProductImages.teaGreenPowder },
];

const FRESH_JUICES_ITEMS: ProductCardData[] = [
  { id: 'fj1', name: 'ABC Juice', price: 60, originalPrice: 86, unit: 'bottle', rating: 4.6, emoji: '🥤', image: ProductImages.juiceAbc },
  { id: 'fj2', name: 'Coconut Water', price: 60, originalPrice: 86, unit: 'bottle', rating: 4.6, emoji: '🥥', image: ProductImages.juiceCoconutWater },
  { id: 'fj3', name: 'PAM Juice', price: 60, originalPrice: 86, unit: 'bottle', rating: 4.7, emoji: '🥤', image: ProductImages.juicePam },
  { id: 'fj4', name: 'Pineapple Cold-Pressed', price: 60, originalPrice: 86, unit: 'bottle', rating: 4.8, emoji: '🍍', image: ProductImages.juicePineapple },
  { id: 'fj5', name: 'Watermelon Fresh', price: 60, originalPrice: 86, unit: 'bottle', rating: 4.6, emoji: '🍉', image: ProductImages.juiceWatermelon },
];

const NATURES_OILS_ITEMS: ProductCardData[] = [
  { id: 'no1', name: 'Groundnut Oil', price: 60, originalPrice: 86, unit: 'L', rating: 4.6, emoji: '🫒', image: ProductImages.oilGroundnut },
  { id: 'no2', name: 'Coconut Oil', price: 60, originalPrice: 86, unit: 'L', rating: 4.6, emoji: '🥥', image: ProductImages.oilCoconut },
  { id: 'no3', name: 'Sesame Gingelly Oil', price: 60, originalPrice: 86, unit: 'L', rating: 4.7, emoji: '🫒', image: ProductImages.oilSesame },
  { id: 'no4', name: 'Pure Sunflower Oil', price: 60, originalPrice: 86, unit: 'L', rating: 4.6, emoji: '🌻', image: ProductImages.oilSunflower },
  { id: 'no5', name: 'Mustard Oil', price: 60, originalPrice: 86, unit: 'L', rating: 4.5, emoji: '🫒', image: ProductImages.oilMustard },
];

const FLOWERS_ITEMS: ProductCardData[] = [
  { id: 'flw1', name: 'Rose', price: 60, originalPrice: 86, unit: 'bunch', rating: 4.6, emoji: '🌹', image: ProductImages.flowerRose },
  { id: 'flw2', name: 'Jasmine', price: 60, originalPrice: 86, unit: 'pack', rating: 4.6, emoji: '🌸', image: ProductImages.flowerJasmine },
  { id: 'flw3', name: 'Marigold Garland', price: 60, originalPrice: 86, unit: 'bunch', rating: 4.5, emoji: '🌼', image: ProductImages.flowerMarigold },
  { id: 'flw4', name: 'Chrysanthemum', price: 60, originalPrice: 86, unit: 'bunch', rating: 4.6, emoji: '🌺', image: ProductImages.flowerChrysanthemum },
  { id: 'flw5', name: 'Carnation', price: 60, originalPrice: 86, unit: 'bunch', rating: 4.6, emoji: '🌸', image: ProductImages.flowerCarnation },
  { id: 'flw6', name: 'Gerbera', price: 60, originalPrice: 86, unit: 'bunch', rating: 4.6, emoji: '🌼', image: ProductImages.flowerGerbera },
  { id: 'flw7', name: 'Aster', price: 60, originalPrice: 86, unit: 'bunch', rating: 4.5, emoji: '🌸', image: ProductImages.flowerAster },
  { id: 'flw8', name: 'Seasonal Blossom', price: 60, originalPrice: 86, unit: 'bunch', rating: 4.6, emoji: '💐', image: ProductImages.flowerSeasonal },
];

const CATEGORY_CIRCLES = [
  { id: 'c1', label: 'Vegetables', image: CategoryImages.vegetables },
  { id: 'c2', label: 'Fruit', image: CategoryImages.fruit },
  { id: 'c3', label: 'Dairy', image: CategoryImages.dairy },
  { id: 'c4', label: 'Grains', image: CategoryImages.grains },
  { id: 'c5', label: 'Dry Fruits', image: CategoryImages.dryFruits },
  { id: 'c6', label: 'Fresh Combos', image: CategoryImages.freshCombos },
  { id: 'c7', label: 'Breads', image: CategoryImages.breads },
  { id: 'c8', label: 'Fresh Juices', image: CategoryImages.freshJuices },
  { id: 'c9', label: 'Everyday Kitchen', image: CategoryImages.everydayKitchen },
  { id: 'c10', label: 'Rare & Exotic', image: CategoryImages.rareExotic },
  { id: 'c11', label: 'Flour', image: CategoryImages.flour },
  { id: 'c12', label: 'Sweet Nature', image: CategoryImages.sweetNature },
  { id: 'c13', label: 'Herbs & Greens', image: CategoryImages.herbsGreens },
  { id: 'c14', label: 'Spices', image: CategoryImages.spices },
  { id: 'c15', label: 'Soaked', image: CategoryImages.soaked },
  { id: 'c16', label: 'Tea & Coffee', image: CategoryImages.teaCoffee },
  { id: 'c17', label: 'Spreads', image: CategoryImages.spreads },
  { id: 'c18', label: 'Flowers', image: CategoryImages.flowers },
];

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const [isLoadingBuffer, setIsLoadingBuffer] = useState(true);
  const [activeTab, setActiveTab] = useState<CustomerActiveTab>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(2);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [apartmentName, setApartmentName] = useState('');

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();

    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        setIsLoadingBuffer(false);
      });
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  const handleTabChange = (tab: CustomerActiveTab) => {
    setActiveTab(tab);
    if (tab === 'cart') {
      onNavigate?.('Cart');
    } else if (tab === 'profile') {
      setShowProfileModal(true);
    }
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleAddToCart = () => {
    setCartCount(prev => prev + 1);
  };

  // Reusable Product Card Component matching exact Figma dimensions (width 142, height 168, title below)
  const renderProductCard = (item: ProductCardData) => {
    const isFav = favorites.includes(item.id);
    return (
      <View key={item.id} style={styles.productCardContainer}>
        <View style={[styles.productCard, customerShadow.subtle]}>
          {/* Top Card Row: Star Rating on Left, Heart on Right */}
          <View style={styles.cardHeaderRow}>
            <View style={styles.ratingBadge}>
              <Text style={styles.starIcon}>★ </Text>
              <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => toggleFavorite(item.id)}
              style={styles.heartButton}
              accessibilityLabel="Add to favorites"
            >
              <HeartSvg filled={isFav} />
            </TouchableOpacity>
          </View>

          {/* Center Product Graphic (Real extracted clean Figma photo) */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleAddToCart}
            style={styles.cardImageCenter}
          >
            {item.image ? (
              <Image
                source={item.image}
                style={styles.productCardImage}
                resizeMode="contain"
              />
            ) : (
              <Text style={styles.productEmoji}>{item.emoji}</Text>
            )}
          </TouchableOpacity>

          {/* Bottom Pricing & Unit */}
          <View style={styles.cardPriceRow}>
            <Text style={styles.priceBold}>₹ {item.price}</Text>
            <Text style={styles.priceStrikethrough}>₹ {item.originalPrice}</Text>
            <Text style={styles.unitText}>{item.unit}</Text>
          </View>
        </View>

        {/* Product Name placed OUTSIDE below the card */}
        <Text style={styles.cardProductName} numberOfLines={1}>
          {item.name}
        </Text>
      </View>
    );
  };

  // Coming Soon Card at the end of each section's horizontal carousel
  const renderComingSoonCard = (keyPrefix: string) => (
    <View key={`${keyPrefix}-coming-soon`} style={styles.productCardContainer}>
      <View style={[styles.productCard, styles.comingSoonCard]}>
        <Image
          source={ProductImages.cardComingSoon}
          style={styles.comingSoonImage}
          resizeMode="contain"
        />
      </View>
      <View style={{ height: 20 }} />
    </View>
  );

  // Reusable Section Header matching Figma: centered editorial title, corner floating deco badge
  const renderSectionHeader = (
    title: string,
    badgeImage?: any,
    floatPosition: 'left' | 'right' = 'right'
  ) => (
    <View style={styles.sectionHeaderWrap}>
      {badgeImage && floatPosition === 'left' && (
        <View style={[styles.floatingDecoBadge, styles.floatLeft]}>
          <Image
            source={badgeImage}
            style={styles.floatingDecoImage}
            resizeMode="contain"
          />
        </View>
      )}
      <Text style={styles.sectionEditorialTitle}>{title}</Text>
      {badgeImage && floatPosition === 'right' && (
        <View style={[styles.floatingDecoBadge, styles.floatRight]}>
          <Image
            source={badgeImage}
            style={styles.floatingDecoImage}
            resizeMode="contain"
          />
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. TOP HEADER BANNER (390 x 290 HUG - EXACT FIGMA IMAGE 1) ─────── */}
        <View style={styles.bannerContainer}>
          <Image
            source={dashboardBannerHarvest}
            style={styles.bannerImage}
            resizeMode="cover"
          />

          <View style={styles.bannerOverlay} pointerEvents="box-none">
            <View style={styles.bannerTopRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowProfileModal(true)}
                style={styles.profileTouchTarget}
                accessibilityLabel="Open Profile"
              />
              <View style={styles.topRightActions}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowWalletModal(true)}
                  style={styles.circleTouchTarget}
                  accessibilityLabel="Wallet"
                />
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => onNavigate?.('Cart')}
                  style={styles.circleTouchTarget}
                  accessibilityLabel="Favorites"
                />
              </View>
            </View>

            <View style={styles.categoriesTouchRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {}}
                style={styles.categoryCircleHit}
                accessibilityLabel="Just Arrived"
              />
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {}}
                style={styles.categoryCircleHit}
                accessibilityLabel="Pesticide Free"
              />
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {}}
                style={styles.categoryCircleHit}
                accessibilityLabel="Seasonal Favs"
              />
            </View>
          </View>
        </View>

        {/* ── 2. LOADING BUFFER WHEN OPENING (FIGMA IMAGE 2: 254 x 130 HUG) ─── */}
        {isLoadingBuffer && (
          <Animated.View style={[styles.loadingBufferBox, { opacity: fadeAnim }]}>
            <View style={styles.cardsRow}>
              <View style={styles.sideCard}>
                <DetailedCeleryHerbIcon />
              </View>
              <Animated.View style={[styles.centerActiveCard, { transform: [{ scale: pulseAnim }] }]}>
                <DetailedOrangeWithSliceIcon />
              </Animated.View>
              <View style={styles.sideCard}>
                <DetailedEggIcon />
              </View>
            </View>
            <Text style={styles.loadingText}>Loading your fresh market</Text>
          </Animated.View>
        )}

        {/* ── 3. FULL SCROLLABLE DASHBOARD SECTIONS (FIGMA EXACT FLOW) ──────── */}
        {!isLoadingBuffer && (
          <View style={styles.catalogSectionsWrap}>
            {/* ── SECTION 2: WE'RE NOT IN YOUR AREA YET CARD ────────────────── */}
            <View style={[styles.areaRequestCard, customerShadow.subtle]}>
              <View style={styles.areaRequestLeft}>
                <Text style={styles.areaRequestTitle}>We're not in your area yet</Text>
                <Text style={styles.areaRequestSubtitle}>
                  Request your apartment and we'll let you know when we launch nearby.
                </Text>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setShowRequestModal(true)}
                  style={styles.requestNowButton}
                >
                  <Text style={styles.requestNowText}>Request now</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.areaRequestRight}>
                <FlyingBagWithWingsSvg />
              </View>
            </View>

            {/* ── SECTION 3: FRESH FINDS FOR YOU (CATEGORY CIRCLES) ─────────── */}
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionEditorialTitle}>Fresh Finds for You</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryCirclesRow}
              >
                {CATEGORY_CIRCLES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    activeOpacity={0.75}
                    onPress={() => {}}
                    style={styles.categoryCircleItem}
                  >
                    <View style={styles.categoryCircleOuter}>
                      {cat.image ? (
                        <Image
                          source={cat.image}
                          style={styles.categoryCircleImg}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={styles.categoryCircleEmoji}>{cat.emoji}</Text>
                      )}
                    </View>
                    <Text style={styles.categoryCircleLabel}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* ── SECTION 4: PROMO BANNER (FARM FRESH VEGETABLES) ──────────── */}
            <View style={styles.promoBannerWrap}>
              <Image
                source={bannerFarmFreshVegetables}
                style={styles.promoBannerImage}
                resizeMode="cover"
              />
            </View>

            {/* ── SECTION 5: "FOR YOU" CAROUSEL (390 x 210 HUG) ─────────────── */}
            <View style={styles.sectionWrap}>
              {renderSectionHeader('For you')}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cardsHorizontalScroll}
              >
                {FOR_YOU_ITEMS.map(renderProductCard)}
                {renderComingSoonCard('foryou')}
              </ScrollView>
            </View>

            {/* ── SECTION 6: "VEGETABLES" CAROUSEL ───────────────────────────── */}
            <View style={styles.sectionWrap}>
              {renderSectionHeader('Vegetables', SectionBadges.vegetables, 'right')}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cardsHorizontalScroll}
              >
                {VEGETABLE_ITEMS.map(renderProductCard)}
                {renderComingSoonCard('veg')}
              </ScrollView>
            </View>

            {/* ── SECTION 7: "FRUITS" CAROUSEL ───────────────────────────────── */}
            <View style={styles.sectionWrap}>
              {renderSectionHeader('Fruits', SectionBadges.fruits, 'left')}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cardsHorizontalScroll}
              >
                {FRUIT_ITEMS.map(renderProductCard)}
                {renderComingSoonCard('fruit')}
              </ScrollView>
            </View>

            {/* ── SECTION 8: "DRY FRUITS & NUTS" CAROUSEL ────────────────────── */}
            <View style={styles.sectionWrap}>
              {renderSectionHeader('Dry fruits & Nuts', SectionBadges.dryFruits, 'right')}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cardsHorizontalScroll}
              >
                {DRY_FRUITS_ITEMS.map(renderProductCard)}
                {renderComingSoonCard('dryfruit')}
              </ScrollView>
            </View>

            {/* ── SECTION 9: "DAIRY" CAROUSEL ────────────────────────────────── */}
            <View style={styles.sectionWrap}>
              {renderSectionHeader('Dairy', SectionBadges.dairy, 'left')}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cardsHorizontalScroll}
              >
                {DAIRY_ITEMS.map(renderProductCard)}
                {renderComingSoonCard('dairy')}
              </ScrollView>
            </View>

            {/* ── SECTION 10: "GRAINS" CAROUSEL ──────────────────────────────── */}
            <View style={styles.sectionWrap}>
              {renderSectionHeader('Grains', SectionBadges.grains, 'right')}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cardsHorizontalScroll}
              >
                {GRAIN_ITEMS.map(renderProductCard)}
                {renderComingSoonCard('grain')}
              </ScrollView>
            </View>

            {/* ── SECTION 11: "FRESH COMBOS" CAROUSEL ────────────────────────── */}
            <View style={styles.sectionWrap}>
              {renderSectionHeader('Fresh Combos', SectionBadges.freshCombos, 'right')}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cardsHorizontalScroll}
              >
                {FRESH_COMBOS_ITEMS.map(renderProductCard)}
                {renderComingSoonCard('combo')}
              </ScrollView>
            </View>

            {/* ── SECTION 12: "TEA & COFFEE" CAROUSEL ────────────────────────── */}
            <View style={styles.sectionWrap}>
              {renderSectionHeader('Tea & Coffee', SectionBadges.teaCoffee, 'left')}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cardsHorizontalScroll}
              >
                {TEA_COFFEE_ITEMS.map(renderProductCard)}
                {renderComingSoonCard('tea')}
              </ScrollView>
            </View>

            {/* ── SECTION 13: "SPREADS" CAROUSEL ─────────────────────────────── */}
            <View style={styles.sectionWrap}>
              {renderSectionHeader('Spreads', SectionBadges.spreads, 'right')}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cardsHorizontalScroll}
              >
                {SPREADS_ITEMS.map(renderProductCard)}
                {renderComingSoonCard('spread')}
              </ScrollView>
            </View>

            {/* ── SECTION 14: "SPICES" CAROUSEL ──────────────────────────────── */}
            <View style={styles.sectionWrap}>
              {renderSectionHeader('Spices', SectionBadges.spices, 'left')}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cardsHorizontalScroll}
              >
                {SPICES_ITEMS.map(renderProductCard)}
                {renderComingSoonCard('spice')}
              </ScrollView>
            </View>

            {/* ── SECTION 15: "SOAKED" CAROUSEL ──────────────────────────────── */}
            <View style={styles.sectionWrap}>
              {renderSectionHeader('Soaked', SectionBadges.soaked, 'right')}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cardsHorizontalScroll}
              >
                {SOAKED_ITEMS.map(renderProductCard)}
                {renderComingSoonCard('soaked')}
              </ScrollView>
            </View>

            {/* ── SECTION 16: "BREADS" CAROUSEL ──────────────────────────────── */}
            <View style={styles.sectionWrap}>
              {renderSectionHeader('Breads', SectionBadges.breads, 'left')}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cardsHorizontalScroll}
              >
                {BREADS_ITEMS.map(renderProductCard)}
                {renderComingSoonCard('bread')}
              </ScrollView>
            </View>

            {/* ── SECTION 17: "FLOUR" CAROUSEL ───────────────────────────────── */}
            <View style={styles.sectionWrap}>
              {renderSectionHeader('Flour', SectionBadges.flour, 'right')}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cardsHorizontalScroll}
              >
                {FLOUR_ITEMS.map(renderProductCard)}
                {renderComingSoonCard('flour')}
              </ScrollView>
            </View>

            {/* ── SECTION 18: "RARE & EXOTIC" CAROUSEL ───────────────────────── */}
            <View style={styles.sectionWrap}>
              {renderSectionHeader('Exotics', SectionBadges.exotics, 'left')}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cardsHorizontalScroll}
              >
                {EXOTIC_ITEMS.map(renderProductCard)}
                {renderComingSoonCard('exotic')}
              </ScrollView>
            </View>

            {/* ── SECTION 19: "SWEET NATURE" CAROUSEL ────────────────────────── */}
            <View style={styles.sectionWrap}>
              {renderSectionHeader('Sweet Nature', SectionBadges.sweetNature, 'right')}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cardsHorizontalScroll}
              >
                {SWEET_NATURE_ITEMS.map(renderProductCard)}
                {renderComingSoonCard('sweet')}
              </ScrollView>
            </View>

            {/* ── SECTION 20: "HERBS & GREENS" CAROUSEL ──────────────────────── */}
            <View style={styles.sectionWrap}>
              {renderSectionHeader('Herbs & Greens', SectionBadges.herbsGreens, 'left')}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cardsHorizontalScroll}
              >
                {HERBS_GREENS_ITEMS.map(renderProductCard)}
                {renderComingSoonCard('herbs')}
              </ScrollView>
            </View>

            {/* ── SECTION 21: "EVERYDAY KITCHEN" CAROUSEL ────────────────────── */}
            <View style={styles.sectionWrap}>
              {renderSectionHeader('Everyday kitchen', SectionBadges.everydayKitchen, 'right')}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cardsHorizontalScroll}
              >
                {EVERYDAY_KITCHEN_ITEMS.map(renderProductCard)}
                {renderComingSoonCard('kitchen')}
              </ScrollView>
            </View>

            {/* ── SECTION 22: "FRESH JUICES" CAROUSEL ────────────────────────── */}
            <View style={styles.sectionWrap}>
              {renderSectionHeader('Fresh Juices', SectionBadges.freshJuices, 'left')}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cardsHorizontalScroll}
              >
                {FRESH_JUICES_ITEMS.map(renderProductCard)}
                {renderComingSoonCard('juice')}
              </ScrollView>
            </View>

            {/* ── SECTION 23: "NATURE'S OILS" CAROUSEL ───────────────────────── */}
            <View style={styles.sectionWrap}>
              {renderSectionHeader("Nature's Oils", SectionBadges.naturesOils, 'right')}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cardsHorizontalScroll}
              >
                {NATURES_OILS_ITEMS.map(renderProductCard)}
                {renderComingSoonCard('oil')}
              </ScrollView>
            </View>

            {/* ── SECTION 24: "FLOWERS" CAROUSEL ─────────────────────────────── */}
            <View style={styles.sectionWrap}>
              {renderSectionHeader('Flowers', SectionBadges.flowers, 'left')}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cardsHorizontalScroll}
              >
                {FLOWERS_ITEMS.map(renderProductCard)}
                {renderComingSoonCard('flower')}
              </ScrollView>
            </View>

            {/* ── 24. FOOTER BRANDING CARD (EXACT FIGMA SPEC: IMAGE 5) ──────── */}
            <View style={styles.footerBrandingCard}>
              <View style={styles.footerLogoRow}>
                <Image
                  source={tohfaMarketLogo}
                  style={styles.footerLogoImage}
                  resizeMode="contain"
                />
                <View style={styles.footerGoldenLine} />
              </View>
              <Text style={styles.footerSubtitle}>
                Freshly sourced from local farmers, thoughtfully delivered to your home.
              </Text>
            </View>
          </View>
        )}

        {/* Extra bottom padding to ensure floating nav doesn't overlap content */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── FLOATING DYNAMIC NAVIGATION (EXACT FIGMA SPEC: 60 Hug x 246) ───── */}
      <CustomerFloatingNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        cartBadgeCount={cartCount}
      />

      {/* ── PROFILE MODAL ──────────────────────────────────────────────────── */}
      <Modal visible={showProfileModal} transparent={true} animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.profileAvatarLarge}>
                <Text style={styles.profileAvatarText}>M</Text>
              </View>
              <View style={styles.profileHeaderText}>
                <Text style={styles.profileName}>Meena</Text>
                <Text style={styles.profilePhone}>+91 9090202033</Text>
                <Text style={styles.profileAddress}>110, Rajeshwari Nagar, Coimbatore</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowProfileModal(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.profileDivider} />

            <View style={styles.profileSection}>
              <Text style={styles.profileSectionTitle}>Preferences</Text>
              <View style={styles.prefBadgesRow}>
                <View style={styles.prefBadge}><Text style={styles.prefBadgeText}>🌱 Vegetarian</Text></View>
                <View style={styles.prefBadge}><Text style={styles.prefBadgeText}>💪 High protein</Text></View>
                <View style={styles.prefBadge}><Text style={styles.prefBadgeText}>🛡️ Pesticide-free</Text></View>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                setShowProfileModal(false);
                onNavigate?.('Cart');
              }}
              style={styles.profileActionBtn}
            >
              <Text style={styles.profileActionText}>View My Cart ({cartCount} items)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                setShowProfileModal(false);
                onNavigate?.('SignOut');
              }}
              style={[styles.profileActionBtn, styles.profileSignOutBtn]}
            >
              <Text style={[styles.profileActionText, { color: '#EF4444' }]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── WALLET MODAL ───────────────────────────────────────────────────── */}
      <Modal visible={showWalletModal} transparent={true} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.walletCard}>
            <Text style={styles.walletTitle}>TOHFA Fresh Wallet</Text>
            <Text style={styles.walletBalance}>₹1,250.00</Text>
            <Text style={styles.walletSubtitle}>Available balance for 1-click organic checkout</Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setShowWalletModal(false)}
              style={styles.walletDoneBtn}
            >
              <Text style={styles.walletDoneText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── REQUEST APARTMENT MODAL ────────────────────────────────────────── */}
      <Modal visible={showRequestModal} transparent={true} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.requestCard}>
            <Text style={styles.requestTitle}>Request Your Area</Text>
            <Text style={styles.requestDesc}>
              Tell us your building or gated community name in Coimbatore. We prioritize launches based on demand!
            </Text>
            <TextInput
              style={styles.requestInput}
              placeholder="e.g. Green Meadows, RS Puram"
              placeholderTextColor="#9CA3AF"
              value={apartmentName}
              onChangeText={setApartmentName}
            />
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setShowRequestModal(false)}
              style={styles.requestSubmitBtn}
            >
              <Text style={styles.requestSubmitText}>Submit Request</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF9',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 110,
  },

  // ── 1. TOP BANNER (390 x 290 HUG - FIGMA IMAGE 1) ─────────────────────────
  bannerContainer: {
    width: '100%',
    height: 290,
    position: 'relative',
    backgroundColor: '#0F172A',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  bannerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 54,
  },
  profileTouchTarget: {
    width: 170,
    height: 50,
  },
  topRightActions: {
    flexDirection: 'row',
    gap: 12,
  },
  circleTouchTarget: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  categoriesTouchRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    height: 94,
    paddingHorizontal: 8,
  },
  categoryCircleHit: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },

  // ── 2. LOADING BUFFER (254 x 130 HUG - FIGMA IMAGE 2) ────────────────────
  loadingBufferBox: {
    width: 254,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 64,
    marginBottom: 40,
  },
  cardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginBottom: 18,
  },
  sideCard: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: 'rgba(232, 245, 233, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.35,
  },
  centerActiveCard: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  loadingText: {
    fontFamily: customerFonts.regular,
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  // ── 3. FULL CATALOG SECTIONS ──────────────────────────────────────────────
  catalogSectionsWrap: {
    paddingTop: 16,
  },

  // Section 2: "We're not in your area yet" Card
  areaRequestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 20,
  },
  areaRequestLeft: {
    flex: 1,
    paddingRight: 10,
  },
  areaRequestTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 19,
    color: '#1F2937',
    marginBottom: 4,
  },
  areaRequestSubtitle: {
    fontFamily: customerFonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: '#6B7280',
    marginBottom: 12,
  },
  requestNowButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#164E2E',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  requestNowText: {
    fontFamily: customerFonts.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  areaRequestRight: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Section 3: "Fresh Finds for You" Category Circles
  sectionWrap: {
    marginBottom: 24,
  },
  sectionHeaderWrap: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    minHeight: 38,
  },
  sectionEditorialTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 22,
    color: '#1F2937',
    textAlign: 'center',
  },
  floatingDecoBadge: {
    position: 'absolute',
    top: -6,
    zIndex: 2,
  },
  floatLeft: {
    left: 16,
  },
  floatRight: {
    right: 16,
  },
  floatingDecoImage: {
    width: 44,
    height: 44,
  },
  categoryCirclesRow: {
    paddingHorizontal: 16,
    gap: 16,
  },
  categoryCircleItem: {
    alignItems: 'center',
    width: 72,
  },
  categoryCircleOuter: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  categoryCircleImg: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  categoryCircleEmoji: {
    fontSize: 32,
  },
  categoryCircleLabel: {
    fontFamily: customerFonts.semibold,
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
  },

  // Section 4: Promo Banner (Farm Fresh Vegetables)
  promoBannerWrap: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
  },
  promoBannerImage: {
    width: '100%',
    aspectRatio: 390 / 210,
    borderRadius: 20,
  },

  // ── PRODUCT CARDS CAROUSEL (390 x 210 HUG - FIGMA IMAGES 4 & 5) ───────────
  cardsHorizontalScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  productCardContainer: {
    width: 142,
    alignItems: 'center',
  },
  productCard: {
    width: 142,
    height: 168,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  comingSoonCard: {
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  comingSoonImage: {
    width: 110,
    height: 124,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  starIcon: {
    fontSize: 10,
  },
  ratingText: {
    fontFamily: customerFonts.bold,
    fontSize: 11,
    color: '#1F2937',
  },
  heartButton: {
    padding: 2,
  },
  cardImageCenter: {
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productCardImage: {
    width: 96,
    height: 72,
  },
  productEmoji: {
    fontSize: 48,
  },
  cardPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceBold: {
    fontFamily: customerFonts.bold,
    fontSize: 14,
    color: '#111827',
    marginRight: 4,
  },
  priceStrikethrough: {
    fontFamily: customerFonts.regular,
    fontSize: 11,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginRight: 'auto',
  },
  unitText: {
    fontFamily: customerFonts.regular,
    fontSize: 11,
    color: '#6B7280',
  },
  cardProductName: {
    fontFamily: customerFonts.semibold,
    fontSize: 12,
    color: '#1F2937',
    marginTop: 6,
    textAlign: 'center',
    width: 140,
  },

    // ── 24. FOOTER BRANDING CARD (EXACT 350 x 246 HUG FROM FIGMA) ─────────────
  footerBrandingCard: {
    width: '92%',
    maxWidth: 350,
    height: 246,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 24,
    marginTop: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  footerLogoRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  footerLogoImage: {
    width: 125,
    height: 48,
  },
  footerGoldenLine: {
    flex: 1,
    height: 3.5,
    backgroundColor: '#E5A93C',
    marginLeft: 16,
    marginBottom: 8,
    borderRadius: 2,
  },
  footerSubtitle: {
    fontFamily: customerFonts.regular,
    fontSize: 15,
    lineHeight: 23,
    color: '#4B5563',
    marginTop: 10,
    textAlign: 'left',
  },

  // ── MODAL STYLES ──────────────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatarLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: customerColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  profileAvatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  profileHeaderText: {
    flex: 1,
  },
  profileName: {
    fontFamily: customerFonts.editorial,
    fontSize: 22,
    color: '#1F2937',
  },
  profilePhone: {
    fontFamily: customerFonts.regular,
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  profileAddress: {
    fontFamily: customerFonts.regular,
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 1,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 18,
    color: '#6B7280',
  },
  profileDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 18,
  },
  profileSection: {
    marginBottom: 20,
  },
  profileSectionTitle: {
    fontFamily: customerFonts.bold,
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 8,
  },
  prefBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  prefBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  prefBadgeText: {
    fontSize: 12,
    color: '#374151',
    fontFamily: customerFonts.regular,
  },
  profileActionBtn: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  profileActionText: {
    fontFamily: customerFonts.bold,
    fontSize: 14,
    color: customerColors.brand,
  },
  profileSignOutBtn: {
    backgroundColor: '#FEE2E2',
  },
  walletCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 32,
    marginBottom: 200,
    padding: 24,
    alignItems: 'center',
  },
  walletTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 22,
    color: '#1F2937',
    marginBottom: 6,
  },
  walletBalance: {
    fontFamily: customerFonts.bold,
    fontSize: 32,
    color: customerColors.brand,
    marginVertical: 12,
  },
  walletSubtitle: {
    fontFamily: customerFonts.regular,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  walletDoneBtn: {
    backgroundColor: customerColors.brand,
    paddingHorizontal: 36,
    paddingVertical: 10,
    borderRadius: 20,
  },
  walletDoneText: {
    color: '#FFFFFF',
    fontFamily: customerFonts.bold,
    fontSize: 14,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 24,
    marginBottom: 180,
    padding: 22,
  },
  requestTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 22,
    color: '#1F2937',
    marginBottom: 6,
  },
  requestDesc: {
    fontFamily: customerFonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: '#6B7280',
    marginBottom: 16,
  },
  requestInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: customerFonts.regular,
    color: '#1F2937',
    marginBottom: 16,
  },
  requestSubmitBtn: {
    backgroundColor: customerColors.brand,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  requestSubmitText: {
    color: '#FFFFFF',
    fontFamily: customerFonts.bold,
    fontSize: 14,
  },
});
