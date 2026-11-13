import { colors, authPalette as P } from '../../../theme';

// Static mock course/blog/workshop content: this is DATA, not UI copy, so it is
// intentionally not translated. Moved verbatim from LearningHubScreen.

export type TabType = 'Videos' | 'Blog' | 'Groups' | 'Trainings';

export interface VideoItem {
  id: string;
  title: string;
  author: string;
  date: string;
  duration: string;
  bgColor: string;
  isFeatured?: boolean;
  description?: string;
}

export const FEATURED_VIDEO: VideoItem = {
  id: 'v-feat',
  title: 'Drip irrigation setup for terraced carrot beds',
  author: 'TOHFA Field Team',
  date: '20 Jul 2026',
  duration: '6:30',
  bgColor: P.greenDeep1,
  isFeatured: true,
  description:
    'A complete step-by-step field guide on laying drip emitter lines along slope contours in terraced vegetable plots to prevent erosion and achieve 40% water savings.',
};

export const LATEST_VIDEOS: VideoItem[] = [
  {
    id: 'v-1',
    title: 'Making jeevamrut: 5-day fermentation',
    author: 'Muthu K.',
    date: '14 Jul 2026',
    duration: '8:15',
    bgColor: colors.brandGreen,
    description:
      'Master the traditional formula for organic microbial bio-fertilizer using local cow dung, urine, jaggery, and pulse flour.',
  },
  {
    id: 'v-2',
    title: 'Neem oil spray — correct dilution',
    author: 'Dr. Anand',
    date: '09 Jul 2026',
    duration: '4:50',
    bgColor: P.greenDeep4,
    description:
      'Learn the precise oil-to-water ratio with natural soap emulsifier to protect cruciferous crops from whitefly and aphids without leaf burn.',
  },
  {
    id: 'v-3',
    title: 'Vermicompost bed maintenance',
    author: 'TOHFA Field Team',
    date: '02 Jul 2026',
    duration: '11:20',
    bgColor: P.brownDeep1,
    description:
      'Techniques for regulating moisture levels, temperature checks, and gentle worm harvesting for high-potency organic castings.',
  },
  {
    id: 'v-4',
    title: 'Companion planting for pest defense',
    author: 'Kavitha R.',
    date: '28 Jun 2026',
    duration: '7:40',
    bgColor: P.greenDeep1,
    description:
      'Interplanting marigolds and basil alongside tomato rows to repel nematodes and attract beneficial pollinator insects.',
  },
];

export interface BlogArticle {
  id: string;
  title: string;
  readTime: string;
  author: string;
  date: string;
  snippet: string;
  tag: string;
}

export const BLOG_ARTICLES: BlogArticle[] = [
  {
    id: 'b-1',
    title: 'Organic pest management techniques for monsoon hill farming',
    readTime: '5 min read',
    author: 'Dr. Anand · TOHFA Agronomist',
    date: '18 Jul 2026',
    snippet:
      'Excessive humidity during rains increases fungal spores. Discover preventive biological foliar sprays to safeguard your cabbage and carrot crops.',
    tag: 'Pest Control',
  },
  {
    id: 'b-2',
    title: 'Soil organic carbon: How green manuring doubles your harvest quality',
    readTime: '4 min read',
    author: 'TOHFA Field Team',
    date: '11 Jul 2026',
    snippet:
      'Planting Sunn hemp and Dhaincha during short transition intervals replenishes root zone nitrogen naturally.',
    tag: 'Soil Health',
  },
  {
    id: 'b-3',
    title: 'Maximizing farmgate value with Grade 1 sorting standards',
    readTime: '6 min read',
    author: 'Priya Sundaram',
    date: '05 Jul 2026',
    snippet:
      'Simple post-harvest washing and sizing practices that guarantee top ceiling prices on the TOHFA Marketplace.',
    tag: 'Market Guide',
  },
];

export interface TrainingWorkshop {
  id: string;
  title: string;
  date: string;
  time: string;
  mode: 'In-Field' | 'Online Webinar';
  location: string;
  instructor: string;
  isRegistered?: boolean;
}

export const INITIAL_TRAININGS: TrainingWorkshop[] = [
  {
    id: 't-1',
    title: 'Hands-on Terraced Drip Maintenance Workshop',
    date: '25 Jul 2026',
    time: '10:00 AM - 1:00 PM',
    mode: 'In-Field',
    location: 'TOHFA Model Farm, Ooty Zone 2',
    instructor: 'TOHFA Field Engineering Team',
    isRegistered: true,
  },
  {
    id: 't-2',
    title: 'Advanced Jeevamrut & Bio-formulations Masterclass',
    date: '01 Aug 2026',
    time: '2:30 PM - 4:00 PM',
    mode: 'Online Webinar',
    location: 'Interactive Live Session',
    instructor: 'Dr. Anand (Lead Agronomist)',
    isRegistered: false,
  },
  {
    id: 't-3',
    title: 'Audit Preparation & Digital Farm Diary Best Practices',
    date: '08 Aug 2026',
    time: '11:00 AM - 12:30 PM',
    mode: 'Online Webinar',
    location: 'Interactive Live Session',
    instructor: 'Meenakshi K. (Compliance Officer)',
    isRegistered: false,
  },
];
