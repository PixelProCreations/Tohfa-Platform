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

// ─── Step 11 Constants (Add External Audit - Screenshots 1 & 3) ───
export const STEP11_AUDIT_TYPES = [
  'Select Audit Type',
  'NPOP Certification Audit',
  'PGS-India External Audit',
  'Third-Party Organic Certification',
  'GlobalG.A.P. Audit',
  'Fair Trade Certification',
  'ISO 22000 Food Safety Audit',
  'State Agriculture Department Inspection',
  'Other',
] as const;

// ─── Step 12 Constants (Farmer Rating - Screenshot 4) ───
export interface Step11RatingCategory {
  id: string;
  title: string;
  iconName: 'verified' | 'layers' | 'tractor' | 'leaf' | 'fruit' | 'qr' | 'users' | 'landmark' | 'store' | 'lightbulb';
  previousAudit: string;
}
export type Step12RatingCategory = Step11RatingCategory;

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

export const STEP12_RATING_CATEGORIES = STEP11_RATING_CATEGORIES;

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
    badge: 'Cancelled',
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
    remarks: 'Cancelled audit notation.',
    inference: 'Audit was cancelled.',
    timeline: [
      { title: 'Audit Started', date: '15 Oct 2026, 9:40 AM', iconType: 'calendar' },
      { title: 'Inspection', date: '15 Oct 2026, 10:15 AM', iconType: 'inspection' },
      { title: 'Findings Recorded', date: 'Cancelled', iconType: 'completed' },
    ],
    pgsOrganic: { status: 'Active', renewalDate: '12 Jun 2027' },
    npop: { status: 'Active', renewalDate: '01 Mar 2027' },
    previousSummary: { date: '15 Jul 2026', score: '0/100' },
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
    assignedText: '',
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
    badge: 'In Progress',
    farmerName: 'Kumar',
    farmerId: 'FR-00318',
    farmingType: 'Organic',
    yearsOrganic: 5,
    farm: 'Ooty Farm 03',
    type: 'External',
    date: '20 Oct 2026',
    assignedText: 'Assigned Auditor',
    auditor: 'External Inspector',
    dateBucket: 'Today',
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
    id: 'AUD-2026-0049',
    badge: 'Completed',
    farmerName: 'Meena',
    farmerId: 'FR-00105',
    farmingType: 'Organic',
    yearsOrganic: 4,
    farm: 'Coonoor, Zone A',
    type: 'Internal',
    date: '24 Sep 2026',
    assignedText: 'Auditor S. Mohan',
    auditor: 'S. Mohan',
    dateBucket: 'Today',
    year: '2026',
    score: '91/100',
    majorFindings: 0,
    minorFindings: 0,
    redFlags: 0,
    remarks: 'View only · completed audits are never rescheduled or overwritten',
    inference: 'Completed audit with full compliance.',
    timeline: [
      { title: 'Audit Scheduled', date: '10 Sep 2026', iconType: 'calendar' },
      { title: 'Inspection', date: '24 Sep 2026, 10:00 AM', iconType: 'inspection' },
      { title: 'Audit Completed', date: '24 Sep 2026, 1:00 PM', iconType: 'completed' },
    ],
    pgsOrganic: { status: 'Active', renewalDate: '24 Sep 2027' },
    npop: { status: 'Active', renewalDate: '15 Nov 2026' },
    previousSummary: { date: '24 Sep 2026', score: '91/100' },
  },
];

// ─── Module 9: Disputes & Mediation Fixtures ─────────────────────────────────

export type DisputeStatus = 'Under Review' | 'Awaiting TOHFA' | 'Awaiting Farmer' | 'Open' | 'Escalated' | 'Resolved';
export type DisputeCategory =
  | 'Payment & Payout'
  | 'Purchase & Collection'
  | 'Produce Quality & Rejection'
  | 'Audit & Documentation';

export interface DisputeEvidence {
  id: string;
  type: 'Document' | 'Image';
  title: string;
  meta: string;
}

export interface DisputeAdminNote {
  id: string;
  text: string;
  author: string;
  date: string;
  isInternal?: boolean | undefined;
}

export const RESOLUTION_OUTCOME_OPTIONS = [
  'Select an outcome',
  'Resolved — Clarification Provided',
  'Resolved — Corrective Action Recorded',
  'Awaiting Farmer Information',
  'Awaiting TOHFA Response',
  'Escalated to TOHFA Admin',
  'Unable to Resolve — Further Review Required',
] as const;

export const TOHFA_RESPONSE_OPTIONS = [
  'No TOHFA response recorded',
  'Response received & noted',
  'Clarification provided by procurement team',
  'Payment correction verified on file',
] as const;

export const FOLLOWUP_REQUIRED_OPTIONS = [
  'Select',
  'None',
  'Farmer Follow-up',
  'TOHFA Follow-up',
  'Secondary Inspection',
] as const;

export type DisputeTimelineEventType = 'status' | 'note' | 'evidence';

export interface DisputeTimelineEvent {
  id: string;
  type: DisputeTimelineEventType;
  title: string;
  description: string;
  author: string;
  timestamp: string;
  attachmentTitle?: string | undefined;
}

export interface DisputeItem {
  id: string;
  status: DisputeStatus;
  category: DisputeCategory;
  title: string;
  raisedBy: string;
  otherParty: string;
  createdDate: string;
  lastActivityDate: string;
  description: string;
  disputeType?: string | undefined;
  assignedAdmin?: string | undefined;
  farmerId?: string | undefined;
  farmName?: string | undefined;
  zone?: string | undefined;
  tohfaDepartment?: string | undefined;
  tohfaRepresentative?: string | undefined;
  incidentDate?: string | undefined;
  linkedRecord?: string | undefined;
  expectedOutcome?: string | undefined;
  evidence?: DisputeEvidence[] | undefined;
  adminNotes?: DisputeAdminNote[] | undefined;
  resolutionNote?: string | undefined;
  timeline?: { date: string; action: string; actor: string }[] | undefined;
  detailedTimeline?: DisputeTimelineEvent[] | undefined;
}

export const INITIAL_DISPUTES: DisputeItem[] = [
  {
    id: 'DIS-2026-0042',
    status: 'Under Review',
    category: 'Payment & Payout',
    title: 'Farmer rating question',
    raisedBy: 'Ramesh Kumar',
    otherParty: 'Procurement Team (TOHFA)',
    createdDate: '08 Oct 2026',
    lastActivityDate: '09 Oct 2026',
    disputeType: '',
    assignedAdmin: 'Suresh Kumar',
    farmerId: 'FMR-00124',
    farmName: 'Ramesh Organic Farm',
    zone: 'Coonoor',
    tohfaDepartment: 'Procurement Team',
    tohfaRepresentative: 'Anitha R',
    description:
      'The payment for the carrot batch delivered on 6 October was lower than the accepted price and I was not told why.',
    incidentDate: '06 Oct 2026',
    linkedRecord: 'Purchase Order PO-2026-00124',
    expectedOutcome:
      'A clear explanation of the difference, and a correction if it was a mistake.',
    evidence: [
      {
        id: 'ev-1',
        type: 'Document',
        title: 'Payment statement',
        meta: 'Document · 08 Oct 2026 · by Ramesh Kumar',
      },
      {
        id: 'ev-2',
        type: 'Image',
        title: 'Carrot batch photo',
        meta: 'Image · 08 Oct 2026 · by Ramesh Kumar',
      },
    ],
    adminNotes: [
      {
        id: 'note-1',
        text: 'Spoke to the farmer. The accepted price matches the purchase order; the difference needs a TOHFA explanation.',
        author: 'Suresh Kumar',
        date: '09 Oct 2026, 10:30',
        isInternal: true,
      },
    ],
    timeline: [
      { date: '08 Oct 2026', action: 'Dispute filed by farmer', actor: 'Ramesh Kumar' },
      { date: '09 Oct 2026', action: 'Mediation desk assigned review to TOHFA Procurement', actor: 'Mediation Desk' },
      { date: '09 Oct 2026', action: 'Grading audit sheets retrieved for cross-check', actor: 'Procurement Team' },
    ],
    detailedTimeline: [
      {
        id: 'tle-1',
        type: 'status',
        title: 'Dispute submitted',
        description: 'Ramesh Kumar submitted a dispute about a payment.',
        author: 'Ramesh Kumar',
        timestamp: '08 Oct 2026, 09:12',
      },
      {
        id: 'tle-2',
        type: 'evidence',
        title: 'Evidence added',
        description: 'Payment statement was attached.',
        author: 'Ramesh Kumar',
        timestamp: '08 Oct 2026, 09:14',
        attachmentTitle: 'Payment statement',
      },
      {
        id: 'tle-3',
        type: 'evidence',
        title: 'Evidence added',
        description: 'Carrot batch photo was attached.',
        author: 'Ramesh Kumar',
        timestamp: '08 Oct 2026, 09:15',
        attachmentTitle: 'Carrot batch photo',
      },
      {
        id: 'tle-4',
        type: 'status',
        title: 'Status changed to Under Review',
        description: 'The Farmer Admin started reviewing the dispute.',
        author: 'Suresh Kumar',
        timestamp: '09 Oct 2026, 10:05',
      },
      {
        id: 'tle-5',
        type: 'note',
        title: 'Mediation note added',
        description: 'Mediation note recorded (internal).',
        author: 'Suresh Kumar',
        timestamp: '09 Oct 2026, 10:30',
      },
    ],
  },
  {
    id: 'DIS-2026-0043',
    status: 'Awaiting TOHFA',
    category: 'Payment & Payout',
    title: 'Payment delay for accepted produce',
    raisedBy: 'Meena',
    otherParty: 'Procurement Team (TOHFA)',
    createdDate: '05 Oct 2026',
    lastActivityDate: '09 Oct 2026',
    description:
      'Accepted 180kg carrots at Ooty Collection Centre on 02 Oct 2026. Payment milestone exceeded standard 48hr window. Waiting on TOHFA finance disbursement clearance.',
    timeline: [
      { date: '05 Oct 2026', action: 'Dispute submitted for delayed payout', actor: 'Meena' },
      { date: '07 Oct 2026', action: 'Warehouse receipt confirmed valid by Ooty Hub', actor: 'Collection Team' },
      { date: '09 Oct 2026', action: 'Escalated to finance disbursement desk', actor: 'Procurement Team' },
    ],
  },
  {
    id: 'DIS-2026-0044',
    status: 'Open',
    category: 'Purchase & Collection',
    title: 'Collection delay at the Ooty centre',
    raisedBy: 'Kumar',
    otherParty: 'Collection Team (TOHFA)',
    createdDate: '03 Oct 2026',
    lastActivityDate: '04 Oct 2026',
    description:
      'Truck arrival delayed by 5 hours at harvest gate, leading to potential dehydration of sensitive leafy vegetables. Requesting priority morning collection schedule.',
    timeline: [
      { date: '03 Oct 2026', action: 'Grievance recorded by farmer', actor: 'Kumar' },
      { date: '04 Oct 2026', action: 'Logistics team notified to adjust transport route', actor: 'Collection Team' },
    ],
  },
  {
    id: 'DIS-2026-0045',
    status: 'Open',
    category: 'Purchase & Collection',
    title: 'Transport cost deducted from payout',
    raisedBy: 'Lakshmi',
    otherParty: 'Collection Team (TOHFA)',
    createdDate: '07 Oct 2026',
    lastActivityDate: '07 Oct 2026',
    description:
      'Deduction of ₹450 made on transport handling contrary to free cooperative collection terms for Grade 1 produce in Kotagiri sector.',
    timeline: [
      { date: '07 Oct 2026', action: 'Dispute filed with receipt deduction proof', actor: 'Lakshmi' },
      { date: '07 Oct 2026', action: 'Sent to logistics auditor for deduction verification', actor: 'Mediation Desk' },
    ],
  },
  {
    id: 'DIS-2026-0046',
    status: 'Escalated',
    category: 'Produce Quality & Rejection',
    title: 'Grade assigned to a produce listing',
    raisedBy: 'Selvi',
    otherParty: 'Quality Control Team (TOHFA)',
    createdDate: '01 Oct 2026',
    lastActivityDate: '08 Oct 2026',
    description:
      'Listing lot PL-001245 was marked Grade 2 by Secondary Hub inspector without photo evidence. Re-inspection requested under PGS organic guidelines.',
    timeline: [
      { date: '01 Oct 2026', action: 'Initial grade appeal filed', actor: 'Selvi' },
      { date: '04 Oct 2026', action: 'Secondary hub inspector maintained Grade 2 ruling', actor: 'Quality Control' },
      { date: '08 Oct 2026', action: 'Farmer escalated to Senior Mediation Panel', actor: 'Selvi' },
    ],
  },
  {
    id: 'DIS-2026-0038',
    status: 'Resolved',
    category: 'Audit & Documentation',
    title: 'Audit report clarification',
    raisedBy: 'Ramesh Kumar',
    otherParty: 'Audit Team (TOHFA)',
    createdDate: '20 Sep 2026',
    lastActivityDate: '28 Sep 2026',
    description:
      'Finding 3 on field buffer zone marking was marked non-compliant. Farmer submitted GPS-tagged photos showing updated boundary signs. Re-evaluated to full compliance.',
    resolutionNote: 'Audit score reinstated to 8.8/10. Buffer zone certified.',
    timeline: [
      { date: '20 Sep 2026', action: 'Dispute raised regarding buffer zone marking', actor: 'Ramesh Kumar' },
      { date: '25 Sep 2026', action: 'Photographic evidence verified by auditor', actor: 'Audit Team' },
      { date: '28 Sep 2026', action: 'Case resolved & score updated', actor: 'Senior Auditor' },
    ],
  },
];

