import React, { useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

const P = {
  bg: '#FAF8F5',
  cardBg: '#FFFFFF',
  cardBorder: '#F2ECE4',
  ink: '#1A1412',
  titleBrown: '#662208',
  subtitle: '#827871',
  orange: '#F0562A',
  orangeBg: '#FFECE8',
  textSecondary: '#6B6560',
  greenSuccess: '#16A34A',
  greenLight: '#EAF7EE',
  greenBar: '#2E7D32',
  blueIconBg: '#EBF3FA',
  blueIcon: '#1D6399',
  purpleIconBg: '#F3E8FF',
  purpleIcon: '#7E22CE',
  amberIconBg: '#FEF3E2',
  amberIcon: '#B45309',
};

export type TimeframeFilter = 'This Month' | 'Last Quarter' | 'Year to Date';
export type ClusterFilter = 'All Clusters' | 'Ooty Central' | 'Kotagiri' | 'Coonoor' | 'Gudalur';

export interface AppTrendItem {
  label: string;
  value: number;
  count: number;
}

export interface RatingTrendItem {
  label: string;
  value: number;
  rating: string;
}

export interface CropBreakdownItem {
  name: string;
  volume: string;
  pct: number;
  color: string;
}

export interface FarmerRosterItem {
  id: string;
  name: string;
  code: string;
  zone: string;
  crop: string;
  yieldMT: string;
  rating: number;
  status: string;
  cert: string;
  payout: string;
}

export interface FarmerPerformanceData {
  newApps: string;
  newAppsTrend: string;
  avgRating: string;
  avgRatingSub: string;
  ratingTrend: string;
  approvedListings: string;
  approvedTrend: string;
  activeFarmers: string;
  activeTrend: string;
  payoutsDisbursed: string;
  payoutsTrend: string;
  organicCert: string;
  organicTrend: string;
  appTrendH1: string;
  appTrendData: AppTrendItem[];
  ratingTrendTag: string;
  ratingTrendData: RatingTrendItem[];
  totalYieldSubtitle: string;
  cropBreakdown: CropBreakdownItem[];
  disbursedAmt: string;
  escrowAmt: string;
  holdAmt: string;
  farmersList: FarmerRosterItem[];
}

export interface FarmerPerformanceReportScreenProps {
  onBack: () => void;
}

export function FarmerPerformanceReportScreen({ onBack }: FarmerPerformanceReportScreenProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeFilter>('This Month');
  const [selectedCluster, setSelectedCluster] = useState<ClusterFilter>('All Clusters');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedFarmerDetail, setSelectedFarmerDetail] = useState<FarmerRosterItem | null>(null);

  const timeframes: TimeframeFilter[] = ['This Month', 'Last Quarter', 'Year to Date'];
  const clusters: ClusterFilter[] = ['All Clusters', 'Ooty Central', 'Kotagiri', 'Coonoor', 'Gudalur'];

  // ─── Dynamic Multi-Filter Data Resolution (15 Distinct Combinations) ────────
  const PERFORMANCE_DATA_MATRIX: Record<ClusterFilter, Record<TimeframeFilter, FarmerPerformanceData>> = {
    'All Clusters': {
      'This Month': {
        newApps: '42',
        newAppsTrend: '↑ 18% vs last mo',
        avgRating: '7.12',
        avgRatingSub: '/10',
        ratingTrend: '↑ 6% rating index',
        approvedListings: '36',
        approvedTrend: '↑ 12% live catalog',
        activeFarmers: '184',
        activeTrend: '↑ 9% retention',
        payoutsDisbursed: '₹42.8L',
        payoutsTrend: '99.4% on-time',
        organicCert: '92.4%',
        organicTrend: 'PGS & NPOP',
        appTrendH1: '+18% MoM Gain',
        appTrendData: [
          { label: 'Week 1', value: 35, count: 8 },
          { label: 'Week 2', value: 48, count: 11 },
          { label: 'Week 3', value: 42, count: 9 },
          { label: 'Week 4', value: 62, count: 14 },
        ],
        ratingTrendTag: 'Avg: 7.12 pts',
        ratingTrendData: [
          { label: 'W1', value: 65, rating: '6.8' },
          { label: 'W2', value: 70, rating: '7.0' },
          { label: 'W3', value: 72, rating: '7.2' },
          { label: 'W4', value: 76, rating: '7.5' },
        ],
        totalYieldSubtitle: 'Total 165.6 MT aggregated across all 4 Nilgiris clusters this month',
        cropBreakdown: [
          { name: 'Carrots', volume: '84.2 MT', pct: 51, color: P.orange },
          { name: 'Hill Potatoes', volume: '42.6 MT', pct: 26, color: '#D97706' },
          { name: 'Specialty Tea Leaf', volume: '24.0 MT', pct: 15, color: P.greenBar },
          { name: 'Beetroot & Exotic Greens', volume: '14.8 MT', pct: 8, color: '#7E22CE' },
        ],
        disbursedAmt: '₹38.6L',
        escrowAmt: '₹3.2L',
        holdAmt: '₹1.0L',
        farmersList: [
          { id: 'f-1', name: 'Vijay Anand', code: '#TOHFA-F-00234', zone: 'Kotagiri', crop: 'Carrots', yieldMT: '22.8 MT', rating: 8.9, status: 'Active', cert: 'PGS Verified', payout: '₹4,85,000' },
          { id: 'f-2', name: 'R. Murugan', code: '#TOHFA-F-00142', zone: 'Ooty', crop: 'Nilgiris Carrots', yieldMT: '18.4 MT', rating: 8.5, status: 'Active', cert: 'PGS Verified', payout: '₹3,92,000' },
          { id: 'f-3', name: 'S. Lakshmi', code: '#TOHFA-F-00098', zone: 'Coonoor', crop: 'Hill Tea & Greens', yieldMT: '14.2 MT', rating: 7.8, status: 'Active', cert: 'PGS Verified', payout: '₹2,64,000' },
          { id: 'f-4', name: 'A. Prakash', code: '#TOHFA-F-00311', zone: 'Gudalur', crop: 'Spices & Ginger', yieldMT: '12.6 MT', rating: 7.5, status: 'Active', cert: 'PGS Verified', payout: '₹2,10,000' },
          { id: 'f-5', name: 'K. Selvam', code: '#TOHFA-F-00189', zone: 'Kotagiri', crop: 'Potatoes', yieldMT: '11.0 MT', rating: 7.2, status: 'Pending', cert: 'NPOP Pending', payout: '₹1,45,000' },
        ],
      },
      'Last Quarter': {
        newApps: '128',
        newAppsTrend: '↑ 24% QoQ',
        avgRating: '7.45',
        avgRatingSub: '/10',
        ratingTrend: '↑ 8% rating index',
        approvedListings: '98',
        approvedTrend: '↑ 18% live catalog',
        activeFarmers: '196',
        activeTrend: '↑ 14% retention',
        payoutsDisbursed: '₹1.24 Cr',
        payoutsTrend: '99.6% on-time',
        organicCert: '94.2%',
        organicTrend: 'PGS & NPOP',
        appTrendH1: '+42% Q2 Growth',
        appTrendData: [
          { label: 'Jul', value: 48, count: 36 },
          { label: 'Aug', value: 58, count: 44 },
          { label: 'Sep', value: 68, count: 48 },
        ],
        ratingTrendTag: 'Avg: 7.45 pts',
        ratingTrendData: [
          { label: 'Jul', value: 71, rating: '7.1' },
          { label: 'Aug', value: 75, rating: '7.5' },
          { label: 'Sep', value: 78, rating: '7.8' },
        ],
        totalYieldSubtitle: 'Total 468.4 MT aggregated across all 4 Nilgiris clusters in Q2',
        cropBreakdown: [
          { name: 'Carrots', volume: '240.0 MT', pct: 51, color: P.orange },
          { name: 'Hill Potatoes', volume: '124.8 MT', pct: 27, color: '#D97706' },
          { name: 'Specialty Tea Leaf', volume: '68.0 MT', pct: 15, color: P.greenBar },
          { name: 'Beetroot & Exotic Greens', volume: '35.6 MT', pct: 7, color: '#7E22CE' },
        ],
        disbursedAmt: '₹1.12 Cr',
        escrowAmt: '₹9.2L',
        holdAmt: '₹2.8L',
        farmersList: [
          { id: 'f-1', name: 'Vijay Anand', code: '#TOHFA-F-00234', zone: 'Kotagiri', crop: 'Carrots', yieldMT: '64.2 MT', rating: 9.1, status: 'Active', cert: 'PGS Verified', payout: '₹14,20,000' },
          { id: 'f-2', name: 'R. Murugan', code: '#TOHFA-F-00142', zone: 'Ooty', crop: 'Nilgiris Carrots', yieldMT: '52.6 MT', rating: 8.7, status: 'Active', cert: 'PGS Verified', payout: '₹11,40,000' },
          { id: 'f-3', name: 'S. Lakshmi', code: '#TOHFA-F-00098', zone: 'Coonoor', crop: 'Hill Tea & Greens', yieldMT: '41.0 MT', rating: 8.0, status: 'Active', cert: 'PGS Verified', payout: '₹7,80,000' },
          { id: 'f-4', name: 'A. Prakash', code: '#TOHFA-F-00311', zone: 'Gudalur', crop: 'Spices & Ginger', yieldMT: '36.4 MT', rating: 7.7, status: 'Active', cert: 'PGS Verified', payout: '₹6,15,000' },
        ],
      },
      'Year to Date': {
        newApps: '380',
        newAppsTrend: '↑ 38% YoY',
        avgRating: '7.82',
        avgRatingSub: '/10',
        ratingTrend: '↑ 12% rating index',
        approvedListings: '284',
        approvedTrend: '↑ 32% live catalog',
        activeFarmers: '215',
        activeTrend: '↑ 22% retention',
        payoutsDisbursed: '₹3.82 Cr',
        payoutsTrend: '99.8% on-time',
        organicCert: '96.0%',
        organicTrend: 'PGS & NPOP',
        appTrendH1: '+58% Annual Gain',
        appTrendData: [
          { label: 'Q1', value: 52, count: 85 },
          { label: 'Q2', value: 65, count: 115 },
          { label: 'Q3', value: 74, count: 135 },
          { label: 'Q4', value: 82, count: 145 },
        ],
        ratingTrendTag: 'Avg: 7.82 pts',
        ratingTrendData: [
          { label: 'Q1', value: 72, rating: '7.2' },
          { label: 'Q2', value: 76, rating: '7.6' },
          { label: 'Q3', value: 80, rating: '8.0' },
          { label: 'Q4', value: 85, rating: '8.5' },
        ],
        totalYieldSubtitle: 'Total 1,420 MT aggregated across all 4 Nilgiris clusters YTD',
        cropBreakdown: [
          { name: 'Carrots', volume: '720.0 MT', pct: 51, color: P.orange },
          { name: 'Hill Potatoes', volume: '380.0 MT', pct: 27, color: '#D97706' },
          { name: 'Specialty Tea Leaf', volume: '210.0 MT', pct: 15, color: P.greenBar },
          { name: 'Beetroot & Exotic Greens', volume: '110.0 MT', pct: 7, color: '#7E22CE' },
        ],
        disbursedAmt: '₹3.48 Cr',
        escrowAmt: '₹26.0L',
        holdAmt: '₹8.0L',
        farmersList: [
          { id: 'f-1', name: 'Vijay Anand', code: '#TOHFA-F-00234', zone: 'Kotagiri', crop: 'Carrots', yieldMT: '185.0 MT', rating: 9.3, status: 'Active', cert: 'PGS Verified', payout: '₹42,50,000' },
          { id: 'f-2', name: 'R. Murugan', code: '#TOHFA-F-00142', zone: 'Ooty', crop: 'Nilgiris Carrots', yieldMT: '154.0 MT', rating: 8.9, status: 'Active', cert: 'PGS Verified', payout: '₹35,20,000' },
          { id: 'f-3', name: 'S. Lakshmi', code: '#TOHFA-F-00098', zone: 'Coonoor', crop: 'Hill Tea & Greens', yieldMT: '118.0 MT', rating: 8.2, status: 'Active', cert: 'PGS Verified', payout: '₹23,40,000' },
        ],
      },
    },
    'Ooty Central': {
      'This Month': {
        newApps: '16',
        newAppsTrend: '↑ 14% Highland',
        avgRating: '8.24',
        avgRatingSub: '/10',
        ratingTrend: '★ Top Nilgiris Tier',
        approvedListings: '14',
        approvedTrend: '↑ 10% Ooty Hub',
        activeFarmers: '68',
        activeTrend: '98% Retention',
        payoutsDisbursed: '₹15.8L',
        payoutsTrend: '100% on-time',
        organicCert: '97.2%',
        organicTrend: 'PGS Verified',
        appTrendH1: '+14% MoM Ooty',
        appTrendData: [
          { label: 'Week 1', value: 25, count: 3 },
          { label: 'Week 2', value: 45, count: 5 },
          { label: 'Week 3', value: 35, count: 4 },
          { label: 'Week 4', value: 40, count: 4 },
        ],
        ratingTrendTag: 'Avg: 8.24 pts',
        ratingTrendData: [
          { label: 'W1', value: 78, rating: '8.0' },
          { label: 'W2', value: 82, rating: '8.2' },
          { label: 'W3', value: 84, rating: '8.3' },
          { label: 'W4', value: 86, rating: '8.5' },
        ],
        totalYieldSubtitle: 'Total 58.4 MT harvested from Ooty Central growers this month',
        cropBreakdown: [
          { name: 'Nilgiris Carrots', volume: '38.0 MT', pct: 65, color: P.orange },
          { name: 'Hill Potatoes', volume: '14.0 MT', pct: 24, color: '#D97706' },
          { name: 'Crisp Exotic Greens', volume: '6.4 MT', pct: 11, color: '#7E22CE' },
        ],
        disbursedAmt: '₹14.6L',
        escrowAmt: '₹1.2L',
        holdAmt: '₹0.0',
        farmersList: [
          { id: 'f-2', name: 'R. Murugan', code: '#TOHFA-F-00142', zone: 'Ooty', crop: 'Nilgiris Carrots', yieldMT: '18.4 MT', rating: 8.5, status: 'Active', cert: 'PGS Verified', payout: '₹3,92,000' },
          { id: 'f-6', name: 'K. Ramanathan', code: '#TOHFA-F-00155', zone: 'Ooty', crop: 'Highland Potatoes', yieldMT: '14.2 MT', rating: 8.3, status: 'Active', cert: 'PGS Verified', payout: '₹2,85,000' },
          { id: 'f-7', name: 'M. Sivakumar', code: '#TOHFA-F-00178', zone: 'Ooty', crop: 'Crisp Carrots', yieldMT: '11.8 MT', rating: 8.6, status: 'Active', cert: 'PGS Verified', payout: '₹2,42,000' },
        ],
      },
      'Last Quarter': {
        newApps: '46',
        newAppsTrend: '↑ 22% Highland',
        avgRating: '8.38',
        avgRatingSub: '/10',
        ratingTrend: '★ Q2 Leader',
        approvedListings: '39',
        approvedTrend: '↑ 16% Ooty Hub',
        activeFarmers: '74',
        activeTrend: '99% Retention',
        payoutsDisbursed: '₹46.5L',
        payoutsTrend: '100% on-time',
        organicCert: '98.1%',
        organicTrend: 'PGS Verified',
        appTrendH1: '+34% Q2 Surge',
        appTrendData: [
          { label: 'Jul', value: 38, count: 12 },
          { label: 'Aug', value: 50, count: 16 },
          { label: 'Sep', value: 56, count: 18 },
        ],
        ratingTrendTag: 'Avg: 8.38 pts',
        ratingTrendData: [
          { label: 'Jul', value: 81, rating: '8.2' },
          { label: 'Aug', value: 84, rating: '8.4' },
          { label: 'Sep', value: 87, rating: '8.6' },
        ],
        totalYieldSubtitle: 'Total 172.5 MT harvested from Ooty Central growers in Q2',
        cropBreakdown: [
          { name: 'Nilgiris Carrots', volume: '110.2 MT', pct: 64, color: P.orange },
          { name: 'Hill Potatoes', volume: '42.8 MT', pct: 25, color: '#D97706' },
          { name: 'Crisp Exotic Greens', volume: '19.5 MT', pct: 11, color: '#7E22CE' },
        ],
        disbursedAmt: '₹42.8L',
        escrowAmt: '₹3.7L',
        holdAmt: '₹0.0',
        farmersList: [
          { id: 'f-2', name: 'R. Murugan', code: '#TOHFA-F-00142', zone: 'Ooty', crop: 'Nilgiris Carrots', yieldMT: '52.6 MT', rating: 8.7, status: 'Active', cert: 'PGS Verified', payout: '₹11,40,000' },
          { id: 'f-6', name: 'K. Ramanathan', code: '#TOHFA-F-00155', zone: 'Ooty', crop: 'Highland Potatoes', yieldMT: '41.5 MT', rating: 8.5, status: 'Active', cert: 'PGS Verified', payout: '₹8,90,000' },
          { id: 'f-7', name: 'M. Sivakumar', code: '#TOHFA-F-00178', zone: 'Ooty', crop: 'Crisp Carrots', yieldMT: '34.2 MT', rating: 8.8, status: 'Active', cert: 'PGS Verified', payout: '₹7,45,000' },
        ],
      },
      'Year to Date': {
        newApps: '132',
        newAppsTrend: '↑ 36% Annual',
        avgRating: '8.52',
        avgRatingSub: '/10',
        ratingTrend: '★ Nilgiris Excellence',
        approvedListings: '118',
        approvedTrend: '↑ 28% Ooty Hub',
        activeFarmers: '82',
        activeTrend: '100% Retention',
        payoutsDisbursed: '₹1.42 Cr',
        payoutsTrend: '100% on-time',
        organicCert: '99.0%',
        organicTrend: 'PGS Gold Verified',
        appTrendH1: '+52% YTD Volume',
        appTrendData: [
          { label: 'Q1', value: 45, count: 28 },
          { label: 'Q2', value: 58, count: 38 },
          { label: 'Q3', value: 68, count: 44 },
          { label: 'Q4', value: 72, count: 48 },
        ],
        ratingTrendTag: 'Avg: 8.52 pts',
        ratingTrendData: [
          { label: 'Q1', value: 80, rating: '8.1' },
          { label: 'Q2', value: 83, rating: '8.3' },
          { label: 'Q3', value: 86, rating: '8.6' },
          { label: 'Q4', value: 89, rating: '8.9' },
        ],
        totalYieldSubtitle: 'Total 510 MT harvested from Ooty Central growers YTD',
        cropBreakdown: [
          { name: 'Nilgiris Carrots', volume: '325.0 MT', pct: 64, color: P.orange },
          { name: 'Hill Potatoes', volume: '128.0 MT', pct: 25, color: '#D97706' },
          { name: 'Crisp Exotic Greens', volume: '57.0 MT', pct: 11, color: '#7E22CE' },
        ],
        disbursedAmt: '₹1.32 Cr',
        escrowAmt: '₹9.4L',
        holdAmt: '₹0.6L',
        farmersList: [
          { id: 'f-2', name: 'R. Murugan', code: '#TOHFA-F-00142', zone: 'Ooty', crop: 'Nilgiris Carrots', yieldMT: '154.0 MT', rating: 8.9, status: 'Active', cert: 'PGS Verified', payout: '₹35,20,000' },
          { id: 'f-6', name: 'K. Ramanathan', code: '#TOHFA-F-00155', zone: 'Ooty', crop: 'Highland Potatoes', yieldMT: '122.0 MT', rating: 8.7, status: 'Active', cert: 'PGS Verified', payout: '₹27,80,000' },
          { id: 'f-7', name: 'M. Sivakumar', code: '#TOHFA-F-00178', zone: 'Ooty', crop: 'Crisp Carrots', yieldMT: '102.5 MT', rating: 8.9, status: 'Active', cert: 'PGS Verified', payout: '₹23,10,000' },
        ],
      },
    },
    'Kotagiri': {
      'This Month': {
        newApps: '14',
        newAppsTrend: '↑ 20% Ridge Zone',
        avgRating: '7.78',
        avgRatingSub: '/10',
        ratingTrend: '★ Precision Quality',
        approvedListings: '12',
        approvedTrend: '↑ 15% Kotagiri',
        activeFarmers: '52',
        activeTrend: '96% Retention',
        payoutsDisbursed: '₹12.4L',
        payoutsTrend: '99.2% on-time',
        organicCert: '93.5%',
        organicTrend: 'PGS Audited',
        appTrendH1: '+20% MoM Kotagiri',
        appTrendData: [
          { label: 'Week 1', value: 24, count: 3 },
          { label: 'Week 2', value: 36, count: 4 },
          { label: 'Week 3', value: 30, count: 3 },
          { label: 'Week 4', value: 42, count: 4 },
        ],
        ratingTrendTag: 'Avg: 7.78 pts',
        ratingTrendData: [
          { label: 'W1', value: 72, rating: '7.4' },
          { label: 'W2', value: 76, rating: '7.7' },
          { label: 'W3', value: 78, rating: '7.8' },
          { label: 'W4', value: 81, rating: '8.1' },
        ],
        totalYieldSubtitle: 'Total 46.2 MT harvested from Kotagiri Ridge growers this month',
        cropBreakdown: [
          { name: 'Carrots', volume: '26.0 MT', pct: 56, color: P.orange },
          { name: 'Hill Potatoes', volume: '16.0 MT', pct: 35, color: '#D97706' },
          { name: 'Salad Greens', volume: '4.2 MT', pct: 9, color: '#7E22CE' },
        ],
        disbursedAmt: '₹11.2L',
        escrowAmt: '₹1.0L',
        holdAmt: '₹0.2L',
        farmersList: [
          { id: 'f-1', name: 'Vijay Anand', code: '#TOHFA-F-00234', zone: 'Kotagiri', crop: 'Carrots', yieldMT: '22.8 MT', rating: 8.9, status: 'Active', cert: 'PGS Verified', payout: '₹4,85,000' },
          { id: 'f-5', name: 'K. Selvam', code: '#TOHFA-F-00189', zone: 'Kotagiri', crop: 'Potatoes', yieldMT: '11.0 MT', rating: 7.2, status: 'Pending', cert: 'NPOP Pending', payout: '₹1,45,000' },
          { id: 'f-8', name: 'B. Karthik', code: '#TOHFA-F-00210', zone: 'Kotagiri', crop: 'Organic Potatoes', yieldMT: '9.4 MT', rating: 7.6, status: 'Active', cert: 'PGS Verified', payout: '₹1,95,000' },
        ],
      },
      'Last Quarter': {
        newApps: '41',
        newAppsTrend: '↑ 28% Ridge Zone',
        avgRating: '7.92',
        avgRatingSub: '/10',
        ratingTrend: '★ Quality Benchmark',
        approvedListings: '35',
        approvedTrend: '↑ 22% Kotagiri',
        activeFarmers: '57',
        activeTrend: '97% Retention',
        payoutsDisbursed: '₹36.8L',
        payoutsTrend: '99.5% on-time',
        organicCert: '94.8%',
        organicTrend: 'PGS Audited',
        appTrendH1: '+42% Q2 Volume',
        appTrendData: [
          { label: 'Jul', value: 36, count: 11 },
          { label: 'Aug', value: 45, count: 14 },
          { label: 'Sep', value: 52, count: 16 },
        ],
        ratingTrendTag: 'Avg: 7.92 pts',
        ratingTrendData: [
          { label: 'Jul', value: 75, rating: '7.6' },
          { label: 'Aug', value: 78, rating: '7.9' },
          { label: 'Sep', value: 82, rating: '8.2' },
        ],
        totalYieldSubtitle: 'Total 134.0 MT harvested from Kotagiri Ridge growers in Q2',
        cropBreakdown: [
          { name: 'Carrots', volume: '75.0 MT', pct: 56, color: P.orange },
          { name: 'Hill Potatoes', volume: '46.8 MT', pct: 35, color: '#D97706' },
          { name: 'Salad Greens', volume: '12.2 MT', pct: 9, color: '#7E22CE' },
        ],
        disbursedAmt: '₹33.5L',
        escrowAmt: '₹2.8L',
        holdAmt: '₹0.5L',
        farmersList: [
          { id: 'f-1', name: 'Vijay Anand', code: '#TOHFA-F-00234', zone: 'Kotagiri', crop: 'Carrots', yieldMT: '64.2 MT', rating: 9.1, status: 'Active', cert: 'PGS Verified', payout: '₹14,20,000' },
          { id: 'f-5', name: 'K. Selvam', code: '#TOHFA-F-00189', zone: 'Kotagiri', crop: 'Potatoes', yieldMT: '32.0 MT', rating: 7.5, status: 'Active', cert: 'PGS Verified', payout: '₹4,20,000' },
          { id: 'f-8', name: 'B. Karthik', code: '#TOHFA-F-00210', zone: 'Kotagiri', crop: 'Organic Potatoes', yieldMT: '27.5 MT', rating: 7.9, status: 'Active', cert: 'PGS Verified', payout: '₹5,60,000' },
        ],
      },
      'Year to Date': {
        newApps: '118',
        newAppsTrend: '↑ 39% Ridge Zone',
        avgRating: '8.15',
        avgRatingSub: '/10',
        ratingTrend: '★ Certified Leader',
        approvedListings: '102',
        approvedTrend: '↑ 34% Kotagiri',
        activeFarmers: '63',
        activeTrend: '98% Retention',
        payoutsDisbursed: '₹1.12 Cr',
        payoutsTrend: '99.7% on-time',
        organicCert: '96.2%',
        organicTrend: 'PGS Verified',
        appTrendH1: '+61% YTD Expansion',
        appTrendData: [
          { label: 'Q1', value: 42, count: 24 },
          { label: 'Q2', value: 54, count: 32 },
          { label: 'Q3', value: 64, count: 38 },
          { label: 'Q4', value: 70, count: 42 },
        ],
        ratingTrendTag: 'Avg: 8.15 pts',
        ratingTrendData: [
          { label: 'Q1', value: 76, rating: '7.8' },
          { label: 'Q2', value: 79, rating: '8.0' },
          { label: 'Q3', value: 82, rating: '8.3' },
          { label: 'Q4', value: 86, rating: '8.6' },
        ],
        totalYieldSubtitle: 'Total 388 MT harvested from Kotagiri Ridge growers YTD',
        cropBreakdown: [
          { name: 'Carrots', volume: '217.0 MT', pct: 56, color: P.orange },
          { name: 'Hill Potatoes', volume: '135.0 MT', pct: 35, color: '#D97706' },
          { name: 'Salad Greens', volume: '36.0 MT', pct: 9, color: '#7E22CE' },
        ],
        disbursedAmt: '₹1.04 Cr',
        escrowAmt: '₹6.8L',
        holdAmt: '₹1.4L',
        farmersList: [
          { id: 'f-1', name: 'Vijay Anand', code: '#TOHFA-F-00234', zone: 'Kotagiri', crop: 'Carrots', yieldMT: '185.0 MT', rating: 9.3, status: 'Active', cert: 'PGS Verified', payout: '₹42,50,000' },
          { id: 'f-5', name: 'K. Selvam', code: '#TOHFA-F-00189', zone: 'Kotagiri', crop: 'Potatoes', yieldMT: '94.0 MT', rating: 7.7, status: 'Active', cert: 'PGS Verified', payout: '₹12,40,000' },
          { id: 'f-8', name: 'B. Karthik', code: '#TOHFA-F-00210', zone: 'Kotagiri', crop: 'Organic Potatoes', yieldMT: '82.0 MT', rating: 8.2, status: 'Active', cert: 'PGS Verified', payout: '₹16,80,000' },
        ],
      },
    },
    'Coonoor': {
      'This Month': {
        newApps: '8',
        newAppsTrend: '↑ 14% Slopes',
        avgRating: '7.54',
        avgRatingSub: '/10',
        ratingTrend: '★ Tea Valley Hub',
        approvedListings: '6',
        approvedTrend: '↑ 8% Catalog',
        activeFarmers: '44',
        activeTrend: '92% Retention',
        payoutsDisbursed: '₹9.2L',
        payoutsTrend: '98.8% on-time',
        organicCert: '90.5%',
        organicTrend: 'Organic Tea SLA',
        appTrendH1: '+12% MoM Coonoor',
        appTrendData: [
          { label: 'Week 1', value: 18, count: 2 },
          { label: 'Week 2', value: 24, count: 2 },
          { label: 'Week 3', value: 20, count: 2 },
          { label: 'Week 4', value: 28, count: 2 },
        ],
        ratingTrendTag: 'Avg: 7.54 pts',
        ratingTrendData: [
          { label: 'W1', value: 70, rating: '7.2' },
          { label: 'W2', value: 73, rating: '7.4' },
          { label: 'W3', value: 75, rating: '7.6' },
          { label: 'W4', value: 78, rating: '7.8' },
        ],
        totalYieldSubtitle: 'Total 34.8 MT harvested from Coonoor slopes this month',
        cropBreakdown: [
          { name: 'Specialty Tea Leaf', volume: '20.4 MT', pct: 59, color: P.greenBar },
          { name: 'Hill Greens', volume: '8.4 MT', pct: 24, color: '#7E22CE' },
          { name: 'Carrots & Beets', volume: '6.0 MT', pct: 17, color: P.orange },
        ],
        disbursedAmt: '₹8.4L',
        escrowAmt: '₹0.6L',
        holdAmt: '₹0.2L',
        farmersList: [
          { id: 'f-3', name: 'S. Lakshmi', code: '#TOHFA-F-00098', zone: 'Coonoor', crop: 'Hill Tea & Greens', yieldMT: '14.2 MT', rating: 7.8, status: 'Active', cert: 'PGS Verified', payout: '₹2,64,000' },
          { id: 'f-9', name: 'N. Thangavel', code: '#TOHFA-F-00102', zone: 'Coonoor', crop: 'Specialty Tea Leaf', yieldMT: '10.4 MT', rating: 7.5, status: 'Active', cert: 'PGS Verified', payout: '₹1,98,000' },
          { id: 'f-10', name: 'P. Geetha', code: '#TOHFA-F-00115', zone: 'Coonoor', crop: 'Organic Slopes Tea', yieldMT: '8.2 MT', rating: 7.4, status: 'Active', cert: 'PGS Verified', payout: '₹1,56,000' },
        ],
      },
      'Last Quarter': {
        newApps: '24',
        newAppsTrend: '↑ 20% Slopes',
        avgRating: '7.70',
        avgRatingSub: '/10',
        ratingTrend: '★ Hill Tea Growth',
        approvedListings: '19',
        approvedTrend: '↑ 14% Catalog',
        activeFarmers: '48',
        activeTrend: '94% Retention',
        payoutsDisbursed: '₹27.4L',
        payoutsTrend: '99.0% on-time',
        organicCert: '92.4%',
        organicTrend: 'Organic Tea SLA',
        appTrendH1: '+29% Q2 Volume',
        appTrendData: [
          { label: 'Jul', value: 24, count: 7 },
          { label: 'Aug', value: 30, count: 8 },
          { label: 'Sep', value: 35, count: 9 },
        ],
        ratingTrendTag: 'Avg: 7.70 pts',
        ratingTrendData: [
          { label: 'Jul', value: 72, rating: '7.4' },
          { label: 'Aug', value: 76, rating: '7.7' },
          { label: 'Sep', value: 80, rating: '8.0' },
        ],
        totalYieldSubtitle: 'Total 98.6 MT harvested from Coonoor slopes in Q2',
        cropBreakdown: [
          { name: 'Specialty Tea Leaf', volume: '58.2 MT', pct: 59, color: P.greenBar },
          { name: 'Hill Greens', volume: '23.8 MT', pct: 24, color: '#7E22CE' },
          { name: 'Carrots & Beets', volume: '16.6 MT', pct: 17, color: P.orange },
        ],
        disbursedAmt: '₹25.0L',
        escrowAmt: '₹1.8L',
        holdAmt: '₹0.6L',
        farmersList: [
          { id: 'f-3', name: 'S. Lakshmi', code: '#TOHFA-F-00098', zone: 'Coonoor', crop: 'Hill Tea & Greens', yieldMT: '41.0 MT', rating: 8.0, status: 'Active', cert: 'PGS Verified', payout: '₹7,80,000' },
          { id: 'f-9', name: 'N. Thangavel', code: '#TOHFA-F-00102', zone: 'Coonoor', crop: 'Specialty Tea Leaf', yieldMT: '30.5 MT', rating: 7.8, status: 'Active', cert: 'PGS Verified', payout: '₹5,80,000' },
          { id: 'f-10', name: 'P. Geetha', code: '#TOHFA-F-00115', zone: 'Coonoor', crop: 'Organic Slopes Tea', yieldMT: '24.2 MT', rating: 7.6, status: 'Active', cert: 'PGS Verified', payout: '₹4,60,000' },
        ],
      },
      'Year to Date': {
        newApps: '72',
        newAppsTrend: '↑ 32% Slopes',
        avgRating: '7.94',
        avgRatingSub: '/10',
        ratingTrend: '★ Mountain Reserve',
        approvedListings: '56',
        approvedTrend: '↑ 25% Catalog',
        activeFarmers: '52',
        activeTrend: '96% Retention',
        payoutsDisbursed: '₹82.6L',
        payoutsTrend: '99.4% on-time',
        organicCert: '94.6%',
        organicTrend: 'Organic Certified',
        appTrendH1: '+48% YTD Yield',
        appTrendData: [
          { label: 'Q1', value: 28, count: 15 },
          { label: 'Q2', value: 36, count: 20 },
          { label: 'Q3', value: 42, count: 22 },
          { label: 'Q4', value: 46, count: 24 },
        ],
        ratingTrendTag: 'Avg: 7.94 pts',
        ratingTrendData: [
          { label: 'Q1', value: 74, rating: '7.5' },
          { label: 'Q2', value: 77, rating: '7.8' },
          { label: 'Q3', value: 81, rating: '8.1' },
          { label: 'Q4', value: 84, rating: '8.4' },
        ],
        totalYieldSubtitle: 'Total 282 MT harvested from Coonoor slopes YTD',
        cropBreakdown: [
          { name: 'Specialty Tea Leaf', volume: '166.0 MT', pct: 59, color: P.greenBar },
          { name: 'Hill Greens', volume: '68.0 MT', pct: 24, color: '#7E22CE' },
          { name: 'Carrots & Beets', volume: '48.0 MT', pct: 17, color: P.orange },
        ],
        disbursedAmt: '₹76.5L',
        escrowAmt: '₹4.6L',
        holdAmt: '₹1.5L',
        farmersList: [
          { id: 'f-3', name: 'S. Lakshmi', code: '#TOHFA-F-00098', zone: 'Coonoor', crop: 'Hill Tea & Greens', yieldMT: '118.0 MT', rating: 8.2, status: 'Active', cert: 'PGS Verified', payout: '₹23,40,000' },
          { id: 'f-9', name: 'N. Thangavel', code: '#TOHFA-F-00102', zone: 'Coonoor', crop: 'Specialty Tea Leaf', yieldMT: '86.0 MT', rating: 8.0, status: 'Active', cert: 'PGS Verified', payout: '₹17,20,000' },
          { id: 'f-10', name: 'P. Geetha', code: '#TOHFA-F-00115', zone: 'Coonoor', crop: 'Organic Slopes Tea', yieldMT: '68.0 MT', rating: 7.9, status: 'Active', cert: 'PGS Verified', payout: '₹13,50,000' },
        ],
      },
    },
    'Gudalur': {
      'This Month': {
        newApps: '4',
        newAppsTrend: '↑ 25% Spice Hub',
        avgRating: '7.15',
        avgRatingSub: '/10',
        ratingTrend: '★ Spices Growing',
        approvedListings: '4',
        approvedTrend: '↑ 33% Verified',
        activeFarmers: '20',
        activeTrend: '88% Retention',
        payoutsDisbursed: '₹5.4L',
        payoutsTrend: '99.0% on-time',
        organicCert: '86.8%',
        organicTrend: 'Transition PGS',
        appTrendH1: '+10% MoM Gudalur',
        appTrendData: [
          { label: 'Week 1', value: 12, count: 1 },
          { label: 'Week 2', value: 16, count: 1 },
          { label: 'Week 3', value: 14, count: 1 },
          { label: 'Week 4', value: 20, count: 1 },
        ],
        ratingTrendTag: 'Avg: 7.15 pts',
        ratingTrendData: [
          { label: 'W1', value: 65, rating: '6.8' },
          { label: 'W2', value: 68, rating: '7.0' },
          { label: 'W3', value: 70, rating: '7.2' },
          { label: 'W4', value: 74, rating: '7.4' },
        ],
        totalYieldSubtitle: 'Total 22.0 MT harvested from Gudalur valley this month',
        cropBreakdown: [
          { name: 'Spices & Fresh Ginger', volume: '12.6 MT', pct: 57, color: P.greenBar },
          { name: 'Black Pepper', volume: '6.0 MT', pct: 27, color: '#D97706' },
          { name: 'Valley Tea Slopes', volume: '3.4 MT', pct: 16, color: P.orange },
        ],
        disbursedAmt: '₹5.0L',
        escrowAmt: '₹0.3L',
        holdAmt: '₹0.1L',
        farmersList: [
          { id: 'f-4', name: 'A. Prakash', code: '#TOHFA-F-00311', zone: 'Gudalur', crop: 'Spices & Ginger', yieldMT: '12.6 MT', rating: 7.5, status: 'Active', cert: 'PGS Verified', payout: '₹2,10,000' },
          { id: 'f-11', name: 'D. Joseph', code: '#TOHFA-F-00325', zone: 'Gudalur', crop: 'Organic Pepper', yieldMT: '6.4 MT', rating: 7.1, status: 'Active', cert: 'PGS Verified', payout: '₹1,05,000' },
          { id: 'f-12', name: 'R. Venu', code: '#TOHFA-F-00340', zone: 'Gudalur', crop: 'Fresh Cardamom', yieldMT: '4.2 MT', rating: 7.0, status: 'Active', cert: 'PGS Verified', payout: '₹82,000' },
        ],
      },
      'Last Quarter': {
        newApps: '12',
        newAppsTrend: '↑ 30% Spice Hub',
        avgRating: '7.32',
        avgRatingSub: '/10',
        ratingTrend: '★ Valley Expansion',
        approvedListings: '11',
        approvedTrend: '↑ 40% Verified',
        activeFarmers: '23',
        activeTrend: '91% Retention',
        payoutsDisbursed: '₹16.2L',
        payoutsTrend: '99.2% on-time',
        organicCert: '89.5%',
        organicTrend: 'Transition PGS',
        appTrendH1: '+32% Q2 Expansion',
        appTrendData: [
          { label: 'Jul', value: 18, count: 3 },
          { label: 'Aug', value: 24, count: 4 },
          { label: 'Sep', value: 28, count: 5 },
        ],
        ratingTrendTag: 'Avg: 7.32 pts',
        ratingTrendData: [
          { label: 'Jul', value: 69, rating: '7.1' },
          { label: 'Aug', value: 72, rating: '7.3' },
          { label: 'Sep', value: 76, rating: '7.6' },
        ],
        totalYieldSubtitle: 'Total 64.8 MT harvested from Gudalur valley in Q2',
        cropBreakdown: [
          { name: 'Spices & Fresh Ginger', volume: '37.0 MT', pct: 57, color: P.greenBar },
          { name: 'Black Pepper', volume: '17.5 MT', pct: 27, color: '#D97706' },
          { name: 'Valley Tea Slopes', volume: '10.3 MT', pct: 16, color: P.orange },
        ],
        disbursedAmt: '₹15.1L',
        escrowAmt: '₹0.9L',
        holdAmt: '₹0.2L',
        farmersList: [
          { id: 'f-4', name: 'A. Prakash', code: '#TOHFA-F-00311', zone: 'Gudalur', crop: 'Spices & Ginger', yieldMT: '36.4 MT', rating: 7.7, status: 'Active', cert: 'PGS Verified', payout: '₹6,15,000' },
          { id: 'f-11', name: 'D. Joseph', code: '#TOHFA-F-00325', zone: 'Gudalur', crop: 'Organic Pepper', yieldMT: '18.5 MT', rating: 7.3, status: 'Active', cert: 'PGS Verified', payout: '₹3,20,000' },
          { id: 'f-12', name: 'R. Venu', code: '#TOHFA-F-00340', zone: 'Gudalur', crop: 'Fresh Cardamom', yieldMT: '12.0 MT', rating: 7.2, status: 'Active', cert: 'PGS Verified', payout: '₹2,45,000' },
        ],
      },
      'Year to Date': {
        newApps: '36',
        newAppsTrend: '↑ 45% Spice Hub',
        avgRating: '7.58',
        avgRatingSub: '/10',
        ratingTrend: '★ PGS Full Certified',
        approvedListings: '32',
        approvedTrend: '↑ 50% Verified',
        activeFarmers: '27',
        activeTrend: '93% Retention',
        payoutsDisbursed: '₹48.5L',
        payoutsTrend: '99.5% on-time',
        organicCert: '92.2%',
        organicTrend: 'PGS Verified',
        appTrendH1: '+58% YTD Expansion',
        appTrendData: [
          { label: 'Q1', value: 20, count: 7 },
          { label: 'Q2', value: 26, count: 9 },
          { label: 'Q3', value: 32, count: 11 },
          { label: 'Q4', value: 36, count: 13 },
        ],
        ratingTrendTag: 'Avg: 7.58 pts',
        ratingTrendData: [
          { label: 'Q1', value: 71, rating: '7.2' },
          { label: 'Q2', value: 74, rating: '7.5' },
          { label: 'Q3', value: 77, rating: '7.8' },
          { label: 'Q4', value: 80, rating: '8.1' },
        ],
        totalYieldSubtitle: 'Total 192 MT harvested from Gudalur valley YTD',
        cropBreakdown: [
          { name: 'Spices & Fresh Ginger', volume: '110.0 MT', pct: 57, color: P.greenBar },
          { name: 'Black Pepper', volume: '52.0 MT', pct: 27, color: '#D97706' },
          { name: 'Valley Tea Slopes', volume: '30.0 MT', pct: 16, color: P.orange },
        ],
        disbursedAmt: '₹45.2L',
        escrowAmt: '₹2.5L',
        holdAmt: '₹0.8L',
        farmersList: [
          { id: 'f-4', name: 'A. Prakash', code: '#TOHFA-F-00311', zone: 'Gudalur', crop: 'Spices & Ginger', yieldMT: '108.0 MT', rating: 7.9, status: 'Active', cert: 'PGS Verified', payout: '₹18,40,000' },
          { id: 'f-11', name: 'D. Joseph', code: '#TOHFA-F-00325', zone: 'Gudalur', crop: 'Organic Pepper', yieldMT: '54.0 MT', rating: 7.5, status: 'Active', cert: 'PGS Verified', payout: '₹9,40,000' },
          { id: 'f-12', name: 'R. Venu', code: '#TOHFA-F-00340', zone: 'Gudalur', crop: 'Fresh Cardamom', yieldMT: '35.0 MT', rating: 7.4, status: 'Active', cert: 'PGS Verified', payout: '₹7,20,000' },
        ],
      },
    },
  };

  const currentData =
    PERFORMANCE_DATA_MATRIX[selectedCluster]?.[selectedTimeframe] ??
    PERFORMANCE_DATA_MATRIX['All Clusters']['This Month'];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={P.bg} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        {/* ─── Top Header Navigation Bar ──────────────────────────────────────── */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Back to Reports"
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M15 19L8 12L15 5"
                stroke="#2B2523"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>

          <View style={styles.headerRightActions}>
            <TouchableOpacity
              style={styles.headerActionBtnWhite}
              onPress={() => setShowExportModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.headerActionBtnWhiteText}>⬆ Export</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerActionBtnOrange}
              onPress={() => setShowShareModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.headerActionBtnOrangeText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Page Title Header ──────────────────────────────────────────────── */}
        <View style={styles.headerBlock}>
          <Text style={styles.pageTitle}>Farmer Performance</Text>
          <Text style={styles.pageSubtitle}>
            Comprehensive yield, ratings, payouts & cluster analytics
          </Text>
        </View>

        {/* ─── Timeframe Selector Pills (This Month, Last Quarter, Year to Date) ─ */}
        <View style={styles.filterPillsRow}>
          {timeframes.map((t) => {
            const isActive = selectedTimeframe === t;
            return (
              <TouchableOpacity
                key={t}
                style={[styles.timeframePill, isActive && styles.timeframePillActive]}
                onPress={() => setSelectedTimeframe(t)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.timeframePillText,
                    isActive && styles.timeframePillTextActive,
                  ]}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── Cluster Selector Pills (All Clusters, Ooty, Kotagiri, etc.) ───── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.clusterPillsScroll}
        >
          {clusters.map((c) => {
            const isSelected = selectedCluster === c;
            return (
              <TouchableOpacity
                key={c}
                style={[styles.clusterPill, isSelected && styles.clusterPillActive]}
                onPress={() => setSelectedCluster(c)}
                activeOpacity={0.8}
              >
                <Text style={[styles.clusterPillText, isSelected && styles.clusterPillTextActive]}>
                  {c}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ─── 6 Dynamic KPI Metric Cards ─────────────────────────────────────── */}
        <View style={styles.kpiGrid}>
          {/* 1. New Applications */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>New Applications</Text>
            <Text style={styles.kpiNumber}>{currentData.newApps}</Text>
            <Text style={styles.kpiTrendGreen}>{currentData.newAppsTrend}</Text>
          </View>

          {/* 2. Avg Farm Rating */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Average Farm Rating</Text>
            <Text style={styles.kpiNumber}>
              {currentData.avgRating}
              <Text style={styles.kpiSubNumber}>{currentData.avgRatingSub}</Text>
            </Text>
            <Text style={styles.kpiTrendGreen}>{currentData.ratingTrend}</Text>
          </View>

          {/* 3. Approved Listings */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Approved Listings</Text>
            <Text style={styles.kpiNumber}>{currentData.approvedListings}</Text>
            <Text style={styles.kpiTrendGreen}>{currentData.approvedTrend}</Text>
          </View>

          {/* 4. Active Farmers */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Active Farmers</Text>
            <Text style={styles.kpiNumber}>{currentData.activeFarmers}</Text>
            <Text style={styles.kpiTrendGreen}>{currentData.activeTrend}</Text>
          </View>

          {/* 5. Total Payouts Disbursed */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Payouts Disbursed</Text>
            <Text style={styles.kpiNumber}>{currentData.payoutsDisbursed}</Text>
            <Text style={styles.kpiTrendGreen}>{currentData.payoutsTrend}</Text>
          </View>

          {/* 6. Organic Certified */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Organic Certified</Text>
            <Text style={styles.kpiNumber}>{currentData.organicCert}</Text>
            <Text style={styles.kpiTrendSub}>{currentData.organicTrend}</Text>
          </View>
        </View>

        {/* ─── Chart 1: Application Trend ─────────────────────────────────────── */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeaderRow}>
            <Text style={styles.chartTitle}>Application Trend ({selectedTimeframe})</Text>
            <Text style={styles.chartMetricTag}>{currentData.appTrendH1}</Text>
          </View>
          <View style={styles.barChartContainer}>
            {currentData.appTrendData.map((d, i) => (
              <View key={i} style={styles.barCol}>
                <Text style={styles.barValText}>{d.count}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { height: Math.min(75, d.value), backgroundColor: P.greenBar }]} />
                </View>
                <Text style={styles.barLabel}>{d.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ─── Chart 2: Rating Trend ─────────────────────────────────────────── */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeaderRow}>
            <Text style={styles.chartTitle}>Rating Trend ({selectedCluster})</Text>
            <Text style={styles.chartMetricTag}>{currentData.ratingTrendTag}</Text>
          </View>
          <View style={styles.barChartContainer}>
            {currentData.ratingTrendData.map((d, i) => (
              <View key={i} style={styles.barCol}>
                <Text style={styles.barValText}>{d.rating}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { height: Math.min(75, d.value), backgroundColor: P.orange }]} />
                </View>
                <Text style={styles.barLabel}>{d.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ─── Dynamic Crop Yield & Harvest Breakdown ─────────────────────────── */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardHeaderTitle}>Harvest Yield Breakdown ({selectedCluster})</Text>
          <Text style={styles.cardHeaderSubtitle}>{currentData.totalYieldSubtitle}</Text>

          <View style={styles.produceList}>
            {currentData.cropBreakdown.map((crop, idx) => (
              <View key={idx} style={styles.produceRow}>
                <View style={styles.produceMetaRow}>
                  <Text style={styles.produceName}>{crop.name}</Text>
                  <Text style={styles.produceVolume}>{crop.volume}</Text>
                </View>
                <View style={styles.produceProgressTrack}>
                  <View
                    style={[
                      styles.produceProgressBar,
                      { width: `${crop.pct}%`, backgroundColor: crop.color },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ─── Dynamic Farmer Settlement & Payout Status ──────────────────────── */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeaderTitle}>Payout Settlement Health</Text>
            <View style={styles.tagGreen}>
              <Text style={styles.tagGreenText}>
                {selectedCluster === 'Ooty Central' ? '100% On-Time' : '99.4% SLA'}
              </Text>
            </View>
          </View>

          <View style={styles.payoutHealthRow}>
            <View style={styles.payoutCol}>
              <Text style={styles.payoutAmt}>{currentData.disbursedAmt}</Text>
              <Text style={styles.payoutStatusLabel}>✓ Disbursed (UPI/Bank)</Text>
            </View>
            <View style={styles.payoutCol}>
              <Text style={styles.payoutAmtAmber}>{currentData.escrowAmt}</Text>
              <Text style={styles.payoutStatusLabel}>⌛ Escrow Clearance</Text>
            </View>
            <View style={styles.payoutCol}>
              <Text style={styles.payoutAmtMuted}>{currentData.holdAmt}</Text>
              <Text style={styles.payoutStatusLabel}>⚑ Verification Hold</Text>
            </View>
          </View>
        </View>

        {/* ─── Filtered Top Farmers Table ─────────────────────────────────────── */}
        <View style={styles.tableCard}>
          <View style={styles.tableHeaderRow}>
            <View>
              <Text style={styles.tableTitle}>Top Farmers ({selectedCluster})</Text>
              <Text style={styles.tableSubtitle}>
                Filtered by {selectedCluster} · {selectedTimeframe}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  'Full Roster',
                  `Loading roster for ${selectedCluster} (${currentData.activeFarmers} Active Farmers)...`
                )
              }
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllText}>View All {currentData.activeFarmers}</Text>
            </TouchableOpacity>
          </View>

          {/* Table Column Headers */}
          <View style={styles.columnHeaderRow}>
            <Text style={[styles.colLabel, { flex: 2 }]}>Farmer</Text>
            <Text style={[styles.colLabel, { flex: 1.2 }]}>Zone</Text>
            <Text style={[styles.colLabel, { flex: 1.2 }]}>Produce</Text>
            <Text style={[styles.colLabel, { flex: 1, textAlign: 'center' }]}>Rating</Text>
            <Text style={[styles.colLabel, { flex: 1.2, textAlign: 'right' }]}>Status</Text>
          </View>

          {/* Table Rows */}
          {currentData.farmersList.map((f) => (
            <TouchableOpacity
              key={f.id}
              style={styles.tableRow}
              onPress={() => setSelectedFarmerDetail(f)}
              activeOpacity={0.7}
            >
              <View style={{ flex: 2 }}>
                <Text style={styles.cellTextBold} numberOfLines={1}>{f.name}</Text>
                <Text style={styles.cellTextCode}>{f.code}</Text>
              </View>

              <Text style={[styles.cellTextMuted, { flex: 1.2 }]} numberOfLines={1}>{f.zone}</Text>

              <View style={{ flex: 1.2 }}>
                <Text style={styles.cellTextProduce} numberOfLines={1}>{f.crop}</Text>
                <Text style={styles.cellTextYield}>{f.yieldMT}</Text>
              </View>

              <View style={{ flex: 1, alignItems: 'center' }}>
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingBadgeText}>★ {f.rating}</Text>
                </View>
              </View>

              <View style={{ flex: 1.2, alignItems: 'flex-end' }}>
                <View
                  style={[
                    styles.statusPill,
                    f.status === 'Active' ? styles.statusPillActive : styles.statusPillPending,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      f.status === 'Active' ? styles.statusPillTextActive : styles.statusPillTextPending,
                    ]}
                  >
                    {f.status}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* ─── Farmer Detail Inspection Modal ─────────────────────────────────── */}
      <Modal
        visible={!!selectedFarmerDetail}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedFarmerDetail(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.tagGreen}>
                <Text style={styles.tagGreenText}>{selectedFarmerDetail?.cert}</Text>
              </View>
              <Text style={styles.modalRating}>★ {selectedFarmerDetail?.rating}/10</Text>
            </View>

            <Text style={styles.modalTitle}>{selectedFarmerDetail?.name}</Text>
            <Text style={styles.modalSub}>{selectedFarmerDetail?.code} · {selectedFarmerDetail?.zone} Zone</Text>

            <View style={styles.modalDivider} />

            <View style={styles.farmerDetailGrid}>
              <View style={styles.farmerDetailItem}>
                <Text style={styles.detailLabel}>Primary Crop</Text>
                <Text style={styles.detailVal}>{selectedFarmerDetail?.crop}</Text>
              </View>
              <View style={styles.farmerDetailItem}>
                <Text style={styles.detailLabel}>Selected Harvest</Text>
                <Text style={styles.detailVal}>{selectedFarmerDetail?.yieldMT}</Text>
              </View>
              <View style={styles.farmerDetailItem}>
                <Text style={styles.detailLabel}>Settled Payout</Text>
                <Text style={styles.detailVal}>{selectedFarmerDetail?.payout}</Text>
              </View>
              <View style={styles.farmerDetailItem}>
                <Text style={styles.detailLabel}>Status</Text>
                <Text style={styles.detailVal}>{selectedFarmerDetail?.status}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => setSelectedFarmerDetail(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── Export Modal ───────────────────────────────────────────────────── */}
      <Modal visible={showExportModal} transparent animationType="fade" onRequestClose={() => setShowExportModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Export Farmer Performance Report</Text>
            <Text style={styles.modalSub}>
              Download {selectedCluster} report for {selectedTimeframe} ({currentData.activeFarmers} farmers).
            </Text>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => {
                setShowExportModal(false);
                Alert.alert('Downloaded', `Farmer_Performance_${selectedCluster.replace(/\s+/g, '_')}_${selectedTimeframe.replace(/\s+/g, '_')}.pdf saved to files.`);
              }}
            >
              <Text style={styles.modalBtnText}>Download PDF Statement</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DDD', marginTop: 10 }]}
              onPress={() => {
                setShowExportModal(false);
                Alert.alert('Exported', `Farmer_Performance_${selectedCluster.replace(/\s+/g, '_')}.xlsx saved to files.`);
              }}
            >
              <Text style={[styles.modalBtnText, { color: P.ink }]}>Export Excel (XLSX)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── Share Modal ────────────────────────────────────────────────────── */}
      <Modal visible={showShareModal} transparent animationType="fade" onRequestClose={() => setShowShareModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Share Farmer Performance</Text>
            <Text style={styles.modalSub}>Send {selectedCluster} report link to regional cluster officers and FPO leads.</Text>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => {
                setShowShareModal(false);
                Alert.alert('Shared', 'Report link copied to clipboard.');
              }}
            >
              <Text style={styles.modalBtnText}>Copy Link & Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: P.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 80,
  },

  // Header Bar
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: P.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#EFE7DE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  headerRightActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionBtnWhite: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E0D8',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  headerActionBtnWhiteText: {
    fontSize: 13,
    fontWeight: '700',
    color: P.ink,
  },
  headerActionBtnOrange: {
    backgroundColor: P.orange,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
  },
  headerActionBtnOrangeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Title Block
  headerBlock: {
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: P.titleBrown,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 13.5,
    color: P.subtitle,
    lineHeight: 18,
  },

  // Timeframe Pills
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  timeframePill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: P.cardBorder,
  },
  timeframePillActive: {
    backgroundColor: P.orange,
    borderColor: P.orange,
  },
  timeframePillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: P.textSecondary,
  },
  timeframePillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Cluster Scroll
  clusterPillsScroll: {
    flexDirection: 'row',
    paddingVertical: 4,
    marginBottom: 16,
  },
  clusterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: P.cardBorder,
    marginRight: 8,
  },
  clusterPillActive: {
    backgroundColor: '#FFF1EB',
    borderColor: P.orange,
  },
  clusterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: P.textSecondary,
  },
  clusterPillTextActive: {
    color: P.orange,
    fontWeight: '700',
  },

  // 6 KPI Grid
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: P.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.cardBorder,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  kpiLabel: {
    fontSize: 12,
    color: P.subtitle,
    fontWeight: '600',
    marginBottom: 6,
  },
  kpiNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: P.ink,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  kpiSubNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: P.subtitle,
  },
  kpiTrendGreen: {
    fontSize: 11,
    fontWeight: '700',
    color: P.greenSuccess,
  },
  kpiTrendSub: {
    fontSize: 11,
    fontWeight: '600',
    color: P.textSecondary,
  },

  // Charts
  chartCard: {
    backgroundColor: P.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.cardBorder,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: P.ink,
  },
  chartMetricTag: {
    fontSize: 11.5,
    fontWeight: '700',
    color: P.greenSuccess,
  },
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 110,
    paddingTop: 8,
    paddingBottom: 4,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barValText: {
    fontSize: 10,
    fontWeight: '700',
    color: P.textSecondary,
    marginBottom: 4,
  },
  barTrack: {
    height: 75,
    width: 26,
    backgroundColor: '#F7F5F0',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
  },
  barLabel: {
    fontSize: 11,
    color: P.subtitle,
    marginTop: 6,
    fontWeight: '500',
  },

  // Section Cards
  sectionCard: {
    backgroundColor: P.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.cardBorder,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: P.ink,
    marginBottom: 2,
  },
  cardHeaderSubtitle: {
    fontSize: 12,
    color: P.subtitle,
    marginBottom: 14,
  },

  // Crop Produce List
  produceList: {
    gap: 12,
  },
  produceRow: {},
  produceMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  produceName: {
    fontSize: 13,
    fontWeight: '600',
    color: P.ink,
  },
  produceVolume: {
    fontSize: 13,
    fontWeight: '700',
    color: P.textSecondary,
  },
  produceProgressTrack: {
    height: 7,
    backgroundColor: '#F3EFE9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  produceProgressBar: {
    height: '100%',
    borderRadius: 4,
  },

  // Payout Settlement Health
  payoutHealthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 12,
  },
  payoutCol: {
    alignItems: 'center',
  },
  payoutAmt: {
    fontSize: 15,
    fontWeight: '800',
    color: P.greenSuccess,
    marginBottom: 2,
  },
  payoutAmtAmber: {
    fontSize: 15,
    fontWeight: '800',
    color: P.amberIcon,
    marginBottom: 2,
  },
  payoutAmtMuted: {
    fontSize: 15,
    fontWeight: '800',
    color: P.textSecondary,
    marginBottom: 2,
  },
  payoutStatusLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: P.subtitle,
  },

  // Table Card
  tableCard: {
    backgroundColor: P.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.cardBorder,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: P.ink,
  },
  tableSubtitle: {
    fontSize: 12,
    color: P.subtitle,
    marginTop: 2,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: P.greenSuccess,
  },
  columnHeaderRow: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F0E8',
    marginBottom: 6,
  },
  colLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: P.textSecondary,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FAF8F5',
  },
  cellTextBold: {
    fontSize: 13,
    fontWeight: '700',
    color: P.ink,
  },
  cellTextCode: {
    fontSize: 10.5,
    color: P.subtitle,
  },
  cellTextMuted: {
    fontSize: 12.5,
    color: P.textSecondary,
  },
  cellTextProduce: {
    fontSize: 12,
    fontWeight: '600',
    color: P.ink,
  },
  cellTextYield: {
    fontSize: 10.5,
    color: P.subtitle,
  },
  ratingBadge: {
    backgroundColor: '#FEF3E2',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ratingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusPillActive: {
    backgroundColor: '#EAF7EE',
  },
  statusPillPending: {
    backgroundColor: '#FEF3E2',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusPillTextActive: {
    color: '#166534',
  },
  statusPillTextPending: {
    color: '#B45309',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 22,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tagGreen: {
    backgroundColor: '#EAF7EE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagGreenText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  modalRating: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: P.ink,
    marginBottom: 2,
  },
  modalSub: {
    fontSize: 12.5,
    color: P.subtitle,
    marginBottom: 12,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#F3EFE9',
    marginBottom: 14,
  },
  farmerDetailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  farmerDetailItem: {
    width: '47%',
  },
  detailLabel: {
    fontSize: 11.5,
    color: P.subtitle,
    marginBottom: 2,
  },
  detailVal: {
    fontSize: 14,
    fontWeight: '700',
    color: P.ink,
  },
  modalBtn: {
    backgroundColor: P.orange,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default FarmerPerformanceReportScreen;
