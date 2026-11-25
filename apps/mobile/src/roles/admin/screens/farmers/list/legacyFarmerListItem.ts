/**
 * The legacy farmer shape, moved out of Dev's AdminAllFarmersScreen.tsx
 * (phase 2B). Kept only because the satellite screens of other modules (farm
 * map, rating scorecard, edit rating categories, KYC review, cert
 * verification) still type their `farmer` prop with it. FarmersFlow hands
 * them the item the list builds from the live row (toLegacyFarmerListItem:
 * real id, name and code, nothing invented). The demo rows that used to live
 * here (DEMO_ALL_FARMERS) were removed in phase 3A with the last fixture
 * fallback in roles/farmer/App.tsx. Delete this type once those screens read
 * the live farmer.
 */
export interface FarmerListItem {
  id: string;
  name: string;
  code: string;
  initials: string;
  farmName?: string;
  location: string;
  status: 'ACTIVE' | 'DISABLED';
  rating: number | null;
  ratingTier?: string;
  mobile?: string;
  aadhaar?: string;
  memberSince?: string;
  subscription?: string;
  farmSize?: string;
  fmbZones?: string;
  primaryCrops?: string;
  soilType?: string;
  irrigation?: string;
  aadhaarStatus?: 'Verified' | 'Pending' | 'Uploaded';
  pattaStatus?: 'Verified' | 'Pending' | 'Uploaded';
  passbookStatus?: 'Verified' | 'Pending' | 'Uploaded';
  certStatus?: 'Verified' | 'Pending' | 'Expired';
  kycNotes?: string;
}
