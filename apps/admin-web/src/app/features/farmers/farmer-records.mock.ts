/**
 * UI-only placeholder data — replace with API when this tab is integrated.
 *
 * Nothing here comes from docs/openapi.yaml: the API has no farmer-records (diary) endpoints yet, so
 * these interfaces are local to the Farmer Records tab and the values reproduce the approved design
 * screen (SA-M3-S10, Farmer Records — Diary). When the tab is integrated, the shapes belong in
 * docs/openapi.yaml first and the route gets its own `requirePermission` code in docs/rbac.json.
 * Photos are represented by a count only; the tab renders a neutral placeholder tile, never an image.
 */

export interface FarmerDiaryPlot {
  readonly name: string;
  readonly areaAcres: number;
}

export interface FarmerDiaryWorkforce {
  readonly workers: number;
  readonly hoursEach: number;
}

/** One diary entry card, newest first. */
export interface FarmerDiaryEntry {
  readonly id: string;
  /** Activity category, e.g. "Nutrient", "Weed". */
  readonly category: string;
  /** Activity performed, e.g. "Compost application". */
  readonly activity: string;
  /** ISO date (yyyy-MM-dd). */
  readonly date: string;
  readonly plot: FarmerDiaryPlot;
  readonly durationMinutes: number;
  readonly linkedCrop: string | null;
  readonly workforce: FarmerDiaryWorkforce | null;
  readonly photoCount: number;
  readonly addedBy: string;
  /** True when an admin recorded the entry on the farmer's behalf; false for the farmer's own entry. */
  readonly onBehalf: boolean;
}

export const FARMER_DIARY_MOCK: readonly FarmerDiaryEntry[] = [
  {
    id: 'diary-2',
    category: 'Nutrient',
    activity: 'Compost application',
    date: '2026-10-26',
    plot: { name: 'Plot 2', areaAcres: 1.2 },
    durationMinutes: 90,
    linkedCrop: 'Tomato',
    workforce: { workers: 2, hoursEach: 4 },
    photoCount: 2,
    addedBy: 'Demo Super Admin',
    onBehalf: true,
  },
  {
    id: 'diary-1',
    category: 'Weed',
    activity: 'Hand weeding',
    date: '2026-10-24',
    plot: { name: 'Plot 1', areaAcres: 1.8 },
    durationMinutes: 120,
    linkedCrop: null,
    workforce: null,
    photoCount: 0,
    addedBy: 'Ramesh Kumar',
    onBehalf: false,
  },
];
