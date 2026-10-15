export interface InspectionSectionItem {
  id: number;
  title: string;
  requiredLeft: string;
}

export const INSPECTION_SECTIONS: InspectionSectionItem[] = [
  { id: 1, title: 'Farmer Contact Verification', requiredLeft: '1 required field left' },
  { id: 2, title: 'FMB & Land Verification', requiredLeft: '1 required field left' },
  { id: 3, title: 'Farm Details Verification', requiredLeft: '1 required field left' },
  { id: 4, title: 'Certification Verification', requiredLeft: '2 required fields left' },
  { id: 5, title: 'Soil Testing & Soil Report', requiredLeft: '1 required field left' },
  { id: 6, title: 'Water Source & Water pH Testing', requiredLeft: '1 required field left' },
  { id: 7, title: 'Farm Practices Checklist', requiredLeft: '4 required fields left' },
  { id: 8, title: 'Documents & Evidence', requiredLeft: 'Not started' },
  { id: 9, title: 'Inspection Observations & Findings', requiredLeft: 'Not started' },
  { id: 10, title: 'Farmer Admin Assessment', requiredLeft: '1 required field left' },
  { id: 11, title: 'Farmer Rating', requiredLeft: 'Rate the farmer based on the audit inspection.' },
];

export const ALL_CROPS = [
  'Beans',
  'Beetroot',
  'Cabbage',
  'Carrot',
  'Cauliflower',
  'Garlic',
  'Peas',
  'Potato',
  'Radish',
  'Tomato',
];

export const ALL_PLOTS = ['Plot A', 'Plot B', 'Plot C'];

export const ALL_WATER_SOURCES = ['Open Well', 'Borewell'];

export const ALL_STEP6_WATER_SOURCES = ['Open Well 1', 'Borewell 1'];
export const ALL_WATER_USE_PURPOSES = ['Drinking', 'Irrigation', 'Livestock', 'Processing'];

export interface Step6WaterSourceEntry {
  id: string;
  sourceName: string;
  sourceType: string;
  location: string;
  usePurposes: string[];
  verification: string;
  condition: string;
  testDate: string;
  testingMethod: string;
  testingDevice: string;
  uploadedReport: string | null;
  phMeasurementStatus: string;
  testVerificationStatus: string;
  notes: string;
}

export type Step7SectionKey = 'farmDoc' | 'organicPractices' | 'cropMgmt' | 'inputUsage';

export interface Step7SectionData {
  inspectionResult: string;
  notes: string;
  evidence: string;
  uploadedFile: { name: string; size: string } | null;
}

export const STEP7_SECTIONS_CONFIG: {
  key: Step7SectionKey;
  title: string;
}[] = [
  { key: 'farmDoc', title: 'FARM DOCUMENTATION' },
  { key: 'organicPractices', title: 'ORGANIC PRACTICES' },
  { key: 'cropMgmt', title: 'CROP MANAGEMENT' },
  { key: 'inputUsage', title: 'INPUT USAGE' },
];

export const STEP7_INSPECTION_RESULTS = [
  'Select...',
  'Compliant',
  'Non-Compliant',
  'Not Applicable',
] as const;

export const STEP7_EXISTING_EVIDENCES = [
  'FMB Sketch (on file)',
  'PGS Organic Certificate (on file)',
];

export interface Step8EvidenceEntry {
  id: string;
  category: string;
  relatedSection: string;
  documentType: string;
  uploadedFile: { name: string; size: string } | null;
  verificationStatus: string;
  missingReason: string;
  notes: string;
}

export const STEP8_EVIDENCE_CATEGORIES = [
  'Select...',
  'Documentation',
  'Photo Evidence',
  'Test Report',
  'Other',
] as const;

export const STEP8_DOCUMENT_TYPES = [
  'Select...',
  'PDF',
  'Image',
  'Scanned Copy',
] as const;

export const STEP8_VERIFICATION_STATUSES = [
  'Select...',
  'Verified',
  'Could Not Verify',
] as const;

export const STEP8_MISSING_REASONS = [
  'Select...',
  'Not Applicable',
  'Farmer Did Not Provide',
  'Lost / Misplaced',
] as const;

export const STEP8_RELATED_SECTIONS = [
  'Farmer Contact Verification',
  'FMB & Land Verification',
  'Farm Details Verification',
  'Certification Verification',
  'Soil Testing & Soil Report',
  'Water Source & Water pH Testing',
  'Farm Practices Checklist',
  'Documents & Evidence',
  'Inspection Observations & Findings',
  'Farmer Admin Assessment',
];

export interface Step9ObservationEntry {
  id: string;
  relatedSection: string;
  category: string;
  observation: string;
  followUpRecommendation: string;
  recommendationNotes: string;
  evidenceReference: string;
  followUpRequired: string;
}

export const STEP9_OBSERVATION_CATEGORIES = [
  'Select...',
  'Documentation Gap',
  'Practice Concern',
  'Positive Observation',
  'Other',
] as const;

export const STEP9_FOLLOWUP_RECOMMENDATIONS = [
  'Select...',
  'Re-visit Recommended',
  'Farmer Guidance Needed',
  'No Action Needed',
] as const;

export const STEP9_FOLLOWUP_REQUIRED_OPTIONS = [
  'Select...',
  'Yes',
  'No',
] as const;

// ─── Step 10 Constants (Farmer Admin Assessment - Screenshots 1 to 5) ───
export const STEP10_OVERALL_ASSESSMENT_OPTIONS = [
  'Select...',
  'Satisfactory',
  'Needs Improvement',
  'Unsatisfactory',
] as const;

export const STEP10_FOLLOWUP_REQUIRED_OPTIONS = [
  'Select...',
  'Yes',
  'No',
] as const;

export const STEP10_RECOMMENDATION_OPTIONS = [
  'Select...',
  'Continue Certification',
  'Re-audit Required',
  'Escalate to Senior Auditor',
] as const;

// ─── Step 11 Constants (Farmer Rating - Screenshots 1 to 4) ───
export interface Step11RatingCategory {
  id: string;
  title: string;
  iconName: 'verified' | 'layers' | 'tractor' | 'leaf' | 'fruit' | 'qr' | 'users' | 'landmark' | 'store' | 'lightbulb';
  previousAudit: string;
}

export const STEP11_RATING_CATEGORIES: Step11RatingCategory[] = [
  { id: 'cert', title: 'Certification & Compliance', iconName: 'verified', previousAudit: '8/10' },
  { id: 'soil', title: 'Soil & Land Management', iconName: 'layers', previousAudit: '7/10' },
  { id: 'farm', title: 'Farming Practices', iconName: 'tractor', previousAudit: '7/10' },
  { id: 'env', title: 'Environmental Sustainability', iconName: 'leaf', previousAudit: '6/10' },
  { id: 'yield', title: 'Produce Quality & Yield', iconName: 'fruit', previousAudit: '8/10' },
  { id: 'trace', title: 'Traceability & Transparency', iconName: 'qr', previousAudit: '7/10' },
  { id: 'social', title: 'Social & Labor Practices', iconName: 'users', previousAudit: '6/10' },
  { id: 'financial', title: 'Financial & Operational', iconName: 'landmark', previousAudit: '8/10' },
  { id: 'market', title: 'Market & Buyer Relations', iconName: 'store', previousAudit: '6/10' },
  { id: 'innovation', title: 'Innovation & Improvement', iconName: 'lightbulb', previousAudit: '5/10' },
];

export interface AuditScheduleRecord {
  id: string;
  badge: 'Completed' | 'Upcoming' | 'Scheduled' | 'In Progress' | 'Cancelled' | 'Rescheduled';
  farmerName: string;
  farmerId?: string | undefined;
  farmingType?: string | undefined;
  yearsOrganic?: number | undefined;
  farm: string;
  type: 'Internal' | 'External' | 'Field Visit';
  date: string;
  assignedText?: string | undefined;
  auditor?: string | undefined;
  dateBucket?: 'Today' | 'This Week' | 'This Month' | 'Custom' | undefined;
  score?: string | undefined;
  majorFindings?: number | undefined;
  minorFindings?: number | undefined;
  redFlags?: number | undefined;
  year?: '2026' | '2025' | '2024' | undefined;
  remarks?: string | undefined;
  inference?: string | undefined;
  timeline?: Array<{ title: string; date: string; iconType: 'calendar' | 'inspection' | 'completed' }> | undefined;
  pgsOrganic?: { status: string; renewalDate: string } | undefined;
  npop?: { status: string; renewalDate: string } | undefined;
  previousSummary?: { date: string; score: string } | undefined;
}

export const INITIAL_SCHEDULE_RECORDS: AuditScheduleRecord[] = [
  {
    id: 'AUD-2026-0042',
    badge: 'Upcoming',
    farmerName: 'Ramesh Kumar',
    farmerId: 'FR-00241',
    farmingType: 'Organic',
    yearsOrganic: 6,
    farm: 'Ooty Farm 01',
    type: 'Internal',
    date: '15 Oct 2026',
    score: '0/100',
    majorFindings: 0,
    minorFindings: 1,
    redFlags: 0,
    year: '2026',
    assignedText: 'Assigned Auditor',
    auditor: 'Suresh Kumar',
    dateBucket: 'Today',
    remarks: 'Minor pest-management notation on plot 2; farmer advised on organic treatment and has since addressed it.',
    inference: 'Farm continues to meet organic certification standards. Recommended for continued certification with routine follow-up at next quarterly audit.',
    timeline: [
      { title: 'Audit Started', date: '15 Oct 2026, 9:40 AM', iconType: 'calendar' },
      { title: 'Inspection', date: '15 Oct 2026, 10:15 AM', iconType: 'inspection' },
      { title: 'Findings Recorded', date: 'Pending', iconType: 'completed' },
    ],
    pgsOrganic: { status: 'Active', renewalDate: '12 Jun 2027' },
    npop: { status: 'Active', renewalDate: '01 Mar 2027' },
    previousSummary: { date: '15 Jul 2026', score: '0/100' },
  },
  {
    id: 'AUD-2026-0035',
    badge: 'Completed',
    farmerName: 'Selvi',
    farmerId: 'FR-00192',
    farmingType: 'Organic',
    yearsOrganic: 4,
    farm: 'Coonoor Farm',
    type: 'External',
    date: '10 Apr 2026',
    score: '91/100',
    majorFindings: 0,
    minorFindings: 0,
    redFlags: 0,
    year: '2026',
    assignedText: 'External',
    auditor: 'External Inspector',
    dateBucket: 'Today',
    remarks: 'Full bio-input and documentation compliance maintained on all plots.',
    inference: 'Annual organic compliance audit completed with high rating.',
    timeline: [
      { title: 'Audit Scheduled', date: '25 Mar 2026', iconType: 'calendar' },
      { title: 'Inspection', date: '10 Apr 2026, 9:30 AM', iconType: 'inspection' },
      { title: 'Audit Completed', date: '10 Apr 2026, 12:00 PM', iconType: 'completed' },
    ],
    pgsOrganic: { status: 'Active', renewalDate: '24 Sep 2027' },
    npop: { status: 'Active', renewalDate: '15 Nov 2026' },
    previousSummary: { date: '10 Apr 2026', score: '91/100' },
  },
  {
    id: 'FV-2026-0018',
    badge: 'Scheduled',
    farmerName: 'Selvi',
    farmerId: 'FR-00192',
    farmingType: 'Organic',
    yearsOrganic: 4,
    farm: 'Coonoor Farm',
    type: 'Field Visit',
    date: '08 Oct 2026',
    dateBucket: 'Today',
    year: '2026',
    assignedText: 'Assigned Auditor',
    auditor: 'Selvi / Field Officer',
    score: '85/100',
    majorFindings: 0,
    minorFindings: 0,
    redFlags: 0,
    remarks: 'Routine pre-harvest inspection.',
    inference: 'Satisfactory adherence.',
    timeline: [
      { title: 'Audit Scheduled', date: '01 Oct 2026', iconType: 'calendar' },
      { title: 'Inspection', date: '08 Oct 2026, 10:00 AM', iconType: 'inspection' },
      { title: 'Audit Completed', date: 'Pending', iconType: 'completed' },
    ],
    pgsOrganic: { status: 'Active', renewalDate: '24 Sep 2027' },
    npop: { status: 'Active', renewalDate: '15 Nov 2026' },
    previousSummary: { date: '10 Aug 2026', score: '85/100' },
  },
  {
    id: 'AUD-2026-0039',
    badge: 'Upcoming',
    farmerName: 'Kumar',
    farmerId: 'FR-00318',
    farmingType: 'Organic',
    yearsOrganic: 5,
    farm: 'Ooty Farm 03',
    type: 'External',
    date: '20 Oct 2026',
    assignedText: 'Assigned Auditor',
    auditor: 'External Inspector',
    dateBucket: 'This Week',
    year: '2026',
    score: '78/100',
    majorFindings: 0,
    minorFindings: 2,
    redFlags: 0,
    remarks: 'Pre-audit documentation verification required.',
    inference: 'Recommended for follow-up review.',
    timeline: [
      { title: 'Audit Scheduled', date: '10 Oct 2026', iconType: 'calendar' },
      { title: 'Inspection', date: '20 Oct 2026, 11:00 AM', iconType: 'inspection' },
      { title: 'Audit Completed', date: 'Pending', iconType: 'completed' },
    ],
    pgsOrganic: { status: 'Active', renewalDate: '18 May 2027' },
    npop: { status: 'Active', renewalDate: '12 Aug 2027' },
    previousSummary: { date: '02 Jun 2026', score: '78/100' },
  },
  {
    id: 'FV-2026-0022',
    badge: 'Scheduled',
    farmerName: 'Vijay Anand',
    farmerId: 'FR-00288',
    farmingType: 'Natural',
    yearsOrganic: 3,
    farm: 'Kotagiri Farm',
    type: 'Field Visit',
    date: '24 Oct 2026',
    assignedText: 'Assigned Auditor',
    auditor: 'Field Officer',
    dateBucket: 'This Week',
    year: '2026',
    score: '82/100',
    majorFindings: 0,
    minorFindings: 1,
    redFlags: 0,
    remarks: 'Soil conservation practice assessment scheduled.',
    inference: 'On track for regular certification.',
    timeline: [
      { title: 'Audit Scheduled', date: '14 Oct 2026', iconType: 'calendar' },
      { title: 'Inspection', date: '24 Oct 2026, 2:00 PM', iconType: 'inspection' },
      { title: 'Audit Completed', date: 'Pending', iconType: 'completed' },
    ],
    pgsOrganic: { status: 'Active', renewalDate: '10 Jan 2027' },
    npop: { status: 'Active', renewalDate: '05 Apr 2027' },
    previousSummary: { date: '14 May 2026', score: '82/100' },
  },
  {
    id: 'AUD-2026-0045',
    badge: 'In Progress',
    farmerName: 'Meena Krishnan',
    farmerId: 'FR-00412',
    farmingType: 'Organic',
    yearsOrganic: 7,
    farm: 'Coonoor Farm 02',
    type: 'Internal',
    date: '28 Oct 2026',
    assignedText: 'Assigned Auditor',
    auditor: 'Assigned Auditor',
    dateBucket: 'This Month',
    year: '2026',
    score: '90/100',
    majorFindings: 0,
    minorFindings: 0,
    redFlags: 0,
    remarks: 'Field audit in progress.',
    inference: 'High adherence to standards.',
    timeline: [
      { title: 'Audit Scheduled', date: '18 Oct 2026', iconType: 'calendar' },
      { title: 'Inspection', date: '28 Oct 2026, 10:00 AM', iconType: 'inspection' },
      { title: 'Audit Completed', date: 'Pending', iconType: 'completed' },
    ],
    pgsOrganic: { status: 'Active', renewalDate: '19 Oct 2027' },
    npop: { status: 'Active', renewalDate: '22 Feb 2027' },
    previousSummary: { date: '21 Jun 2026', score: '90/100' },
  },
];
