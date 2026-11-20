import type { FarmerListItem } from './list/legacyFarmerListItem';

export interface ApplicationListItem {
  id: string;
  name: string;
  applicantName: string;
  code: string;
  status: 'Pending' | 'Correction Required' | 'Approved' | 'Rejected';
  phone: string;
  address: string;
  zone: string;
  farmingType: string;
  crops: string;
  submittedDate: string;
  approvedDate?: string;
  kycStatus: string;
  farmSize: string;
  soilType: string;
  landArea: string;
  fmbSketch: string;
  reviewNotes: string;
  identityProofNumber: string;
  identityProofStatus: 'Pending' | 'Verified';
}

export type DemoFarmerItem = FarmerListItem & {
  farmerId?: string;
  crops?: string;
  zone?: string;
  farmingType?: string;
  kycVerifiedText?: string;
  kycStatus?: string;
  hasExpiredCert?: boolean;
};

export const DEMO_ALL_FARMERS: DemoFarmerItem[] = [
  {
    id: 'fmr-00124',
    name: 'Ramesh Kumar',
    code: 'FR-00124',
    initials: 'RK',
    farmName: 'Mixed vegetable farm.',
    location: 'Coonoor',
    farmingType: 'Organic',
    status: 'ACTIVE',
    rating: 4.6,
    ratingTier: 'Excellent',
    mobile: '+91 90000 20000',
    aadhaar: 'XXXX XXXX 4821',
    memberSince: '10 Jan 2026',
    subscription: 'Active · Paid',
    kycVerifiedText: 'KYC Verified',
    certStatus: 'Expired',
    hasExpiredCert: true,
  },
  {
    id: 'fmr-00131',
    name: 'Selvi',
    code: 'FR-00131',
    initials: 'S',
    farmName: 'Organic Tea & Veggies',
    location: 'Coonoor',
    farmingType: 'Organic',
    status: 'ACTIVE',
    rating: 4.3,
    ratingTier: 'Excellent',
    mobile: '+91 98765 43211',
    aadhaar: 'XXXX XXXX 1928',
    memberSince: '15 Feb 2026',
    subscription: 'Active · Paid',
    kycVerifiedText: 'KYC Verified',
    certStatus: 'Verified',
    hasExpiredCert: false,
  },
  {
    id: 'fmr-00118',
    name: 'Kumar',
    code: 'FR-00118',
    initials: 'K',
    farmName: 'Ooty Hills Organic',
    location: 'Ooty',
    farmingType: 'Organic',
    status: 'ACTIVE',
    rating: 4.1,
    ratingTier: 'Good',
    mobile: '+91 98765 11800',
    aadhaar: 'XXXX XXXX 7701',
    memberSince: '05 Jan 2026',
    subscription: 'Pending',
    kycVerifiedText: 'KYC Verified',
    certStatus: 'Pending',
    hasExpiredCert: false,
  },
  {
    id: 'fmr-00140',
    name: 'Vijay Anand',
    code: 'FR-00140',
    initials: 'VA',
    farmName: 'Wild Eden Organic Farms',
    location: 'Ooty',
    farmingType: 'Natural',
    status: 'ACTIVE',
    rating: 4.5,
    ratingTier: 'Excellent',
    mobile: '+91 98765 43210',
    aadhaar: 'XXXX XXXX 7654',
    memberSince: 'Mar 2025',
    subscription: 'Active · Paid',
    kycVerifiedText: 'KYC Verified',
    certStatus: 'Verified',
    hasExpiredCert: false,
  },
  {
    id: 'fmr-00109',
    name: 'Revathi',
    code: 'FR-00109',
    initials: 'R',
    farmName: 'Kotagiri Tea Estate',
    location: 'Kotagiri',
    farmingType: 'Organic',
    status: 'DISABLED',
    rating: 3.5,
    ratingTier: 'Good',
    mobile: '+91 98765 88990',
    aadhaar: 'XXXX XXXX 7701',
    memberSince: '05 Jan 2026',
    subscription: 'Inactive',
    kycVerifiedText: 'KYC Verified',
    certStatus: 'Expired',
    hasExpiredCert: true,
  },
  {
    id: 'fmr-00145',
    name: 'Murugan P',
    code: 'FR-00145',
    initials: 'MP',
    farmName: 'Coonoor Valley Spices',
    location: 'Coonoor',
    farmingType: 'Natural',
    status: 'ACTIVE',
    rating: 4.2,
    ratingTier: 'Good',
    mobile: '+91 98765 22334',
    aadhaar: 'XXXX XXXX 3341',
    memberSince: '20 Jan 2026',
    subscription: 'Pending',
    kycVerifiedText: 'KYC Verified',
    certStatus: 'Pending',
    hasExpiredCert: false,
  },
  {
    id: 'fmr-00152',
    name: 'Lakshmi Narayanan',
    code: 'FR-00152',
    initials: 'LN',
    farmName: 'Highland Organic Estate',
    location: 'Coonoor',
    farmingType: 'Organic',
    status: 'DISABLED',
    rating: 3.8,
    ratingTier: 'Good',
    mobile: '+91 98765 77665',
    aadhaar: 'XXXX XXXX 9912',
    memberSince: '12 Dec 2025',
    subscription: 'Inactive',
    kycVerifiedText: 'KYC Verified',
    certStatus: 'Verified',
    hasExpiredCert: false,
  },
];

export const DEMO_APPLICATIONS: ApplicationListItem[] = [
  {
    id: 'app-2026-0101',
    name: 'Sathish Kumar',
    applicantName: 'Sathish Kumar',
    code: 'APP-2026-0101',
    status: 'Pending',
    phone: '+91 99801 00100',
    address: 'Thottam Street, Ooty',
    zone: 'Ooty',
    farmingType: 'Natural',
    crops: 'Carrot, Cabbage',
    submittedDate: '05 Oct 2026',
    approvedDate: '10 Oct 2026',
    kycStatus: 'Pending Verification',
    farmSize: '2.0 acre',
    soilType: 'Loam',
    landArea: '2.0 acre',
    fmbSketch: 'fmb-0101.pdf',
    reviewNotes: 'Waiting on document verification.',
    identityProofNumber: 'XXXX XXXX 4821',
    identityProofStatus: 'Pending',
  },
];
