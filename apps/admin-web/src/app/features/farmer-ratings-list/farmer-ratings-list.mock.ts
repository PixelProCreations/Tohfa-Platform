/**
 * Placeholder data for the Farmer Ratings list (UI only). Same farmers as the Farmer Directory mock.
 * Tier thresholds are configured server-side (farmer.rating.configure_tiers); these labels are demo.
 */
export interface FarmerRatingRow {
  readonly id: string;
  readonly farmerCode: string;
  readonly name: string;
  readonly zone: string;
  readonly rating: number | null;
  readonly tier: string | null;
}

export const FARMER_RATINGS_MOCK: readonly FarmerRatingRow[] = [
  { id: 'FMR-00124', farmerCode: 'FMR-00124', name: 'Ramesh Kumar', zone: 'Coonoor', rating: 4.5, tier: 'Gold' },
  { id: 'FMR-00142', farmerCode: 'FMR-00142', name: 'Lakshmi Devi', zone: 'Kotagiri', rating: 4.8, tier: 'Platinum' },
  { id: 'FMR-00156', farmerCode: 'FMR-00156', name: 'Selvam Raj', zone: 'Ooty', rating: null, tier: null },
  { id: 'FMR-00098', farmerCode: 'FMR-00098', name: 'Murugan Devi', zone: 'Coonoor', rating: 4.2, tier: 'Silver' },
  { id: 'FMR-00171', farmerCode: 'FMR-00171', name: 'Priya Nair', zone: 'Gudalur', rating: 4.6, tier: 'Gold' },
];
