import type { TabType } from './data';

export const TABS: TabType[] = ['Videos', 'Blog', 'Groups', 'Trainings'];

/** Translation suffix for each tab label / search placeholder. */
export const TAB_LABEL_KEY: Record<TabType, string> = {
  Videos: 'tab.videos',
  Blog: 'tab.blog',
  Groups: 'tab.groups',
  Trainings: 'tab.trainings',
};
export const TAB_PLACEHOLDER_KEY: Record<TabType, string> = {
  Videos: 'search.videos',
  Blog: 'search.articles',
  Groups: 'search.groups',
  Trainings: 'search.trainings',
};

/** Translucent black overlays used over thumbnails and behind the modal. No token exists. */
export const OVERLAY = {
  scrim: 'rgba(0,0,0,0.6)',
  featuredBadge: 'rgba(0, 0, 0, 0.45)',
  featuredDuration: 'rgba(0, 0, 0, 0.65)',
  videoDuration: 'rgba(0, 0, 0, 0.7)',
} as const;

export const SP = {
  hair: 1,
  xxs: 2,
  xs: 3,
  sm: 4,
  md: 6,
  s7: 7,
  lg: 8,
  xl: 10,
  s12: 12,
  s14: 14,
  s16: 16,
  s18: 18,
  s20: 20,
  s24: 24,
  s30: 30,
  s40: 40,
} as const;

export const RAD = {
  r3: 3,
  r4: 4,
  r5: 5,
  r6: 6,
  r10: 10,
  r12: 12,
  r14: 14,
  r16: 16,
  r18: 18,
  r19: 19,
  r22: 22,
} as const;

export const DIM = {
  backButton: 38,
  backButtonRadius: 19,
  searchHeight: 46,
  featuredThumbHeight: 185,
  featuredPlay: 52,
  featuredPlayRadius: 26,
  videoThumbW: 82,
  videoThumbH: 58,
  groupIcon: 44,
  groupIconRadius: 22,
  closeCircle: 32,
  closeCircleRadius: 16,
  hairline: 1,
  bottomSpacer: 40,
} as const;

export const ICON = {
  header: 18,
  search: 18,
  clear: 16,
  featuredPlay: 24,
  verified: 14,
  videoPlay: 24,
  book: 14,
  group: 22,
  calendar: 14,
  modalClose: 18,
} as const;

export const SHADOW = {
  opacitySubtle: 0.04,
  opacityLight: 0.05,
  opacityTab: 0.07,
  opacityCard: 0.06,
  opacityPlay: 0.25,
  radiusSm: 2,
  radiusMd: 3,
  radiusCard: 4,
  radiusLg: 6,
  radiusXl: 8,
  offset1: 1,
  offset2: 2,
  offset4: 4,
  elev1: 1,
  elev2: 2,
  elev3: 3,
  elev6: 6,
} as const;

export const LINE = {
  l17: 17,
  l18: 18,
  l19: 19,
  l20: 20,
  l21: 21,
  l22: 22,
  l23: 23,
  l24: 24,
} as const;

export const LETTER = { tight: -0.2, badge: 0.6, section: 0.8 } as const;
