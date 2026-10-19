import React, { useMemo, useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Polygon, Rect } from 'react-native-svg';

import { adminColors, adminOverlay, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';
import { t } from '../../i18n';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Exact Gavel / Mediation Icon Matching Screenshot 4 (1000% Match)
export function ExactGavelIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Sound block base at bottom left */}
      <Rect x="3.5" y="19.2" width="8.8" height="2.2" rx="0.4" fill={color} />
      {/* Upper slanted mallet block */}
      <Polygon points="3.0,8.0 9.8,1.2 11.8,3.2 5.0,10.0" fill={color} />
      {/* Lower slanted mallet block (parallel) */}
      <Polygon points="5.8,10.8 12.6,4.0 14.6,6.0 7.8,12.8" fill={color} />
      {/* Mallet handle pointing down-right */}
      <Polygon points="10.4,10.2 12.0,8.6 19.8,16.4 18.2,18.0" fill={color} />
    </Svg>
  );
}

function PulseTrendIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 16L8 11L12 15L18 8L22 12"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="8" cy="11" r="1.5" fill={color} />
      <Circle cx="12" cy="15" r="1.5" fill={color} />
      <Circle cx="18" cy="8" r="1.5" fill={color} />
    </Svg>
  );
}

function BellNotifIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M13.73 21a2 2 0 01-3.46 0" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Line x1="16.5" y1="16.5" x2="21.5" y2="21.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 18, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 6h16M4 12h16M4 18h16M8 4v4M16 10v4M10 16v4"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BlockCircleIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Line x1="5.6" y1="5.6" x2="18.4" y2="18.4" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function CalendarIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" />
      <Circle cx="8" cy="14" r="1" fill={color} />
      <Circle cx="12" cy="14" r="1" fill={color} />
      <Circle cx="16" cy="14" r="1" fill={color} />
      <Circle cx="8" cy="18" r="1" fill={color} />
      <Circle cx="12" cy="18" r="1" fill={color} />
    </Svg>
  );
}

function ChevronDownIcon({ size = 16, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DocumentIcon({ size = 20, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UploadFileIcon({ size = 20, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 2v6h6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 18v-6M9 15l3-3 3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ProhibitionIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Line x1="5.6" y1="5.6" x2="18.4" y2="18.4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function SubmissionUploadIcon({ size = 18, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Path d="M12 15V9M9 12l3-3 3 3" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ExchangeArrowsIcon({ size = 18, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M7 8h10M14 5l3 3-3 3" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M17 16H7M10 19l-3-3 3-3" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function QuestionCircleIcon({ size = 18, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Path
        d="M9.5 9.5a2.5 2.5 0 014.5 1.5c0 1.5-2 2-2 3M12 17h.01"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function NotePencilIcon({ size = 18, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckCircleIcon({ size = 18, color = adminColors.success.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M8 12l2.5 2.5L16 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ResizeHandleIcon({ size = 12, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <Line x1="10" y1="4" x2="4" y2="10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="11" y1="8" x2="8" y2="11" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

function CloseIcon({ size = 18, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TargetDotIcon({ size = 18, color = '#C46E26' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="8" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="12" r="3" fill={color} />
    </Svg>
  );
}

function PaperclipIcon({ size = 18, color = '#C46E26' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ImageIcon({ size = 20, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="3" stroke={color} strokeWidth="2" />
      <Circle cx="8.5" cy="8.5" r="1.5" fill={color} />
      <Path d="M21 15l-5-5L5 21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}


// ─── Data Types ──────────────────────────────────────────────────────────────

export type DisputeStatus =
  | 'Open'
  | 'Under Review'
  | 'Awaiting Information'
  | 'Awaiting TOHFA'
  | 'Mediation in Progress'
  | 'Escalated'
  | 'Resolved'
  | 'Closed';

export type DisputeType =
  | 'Payment & Payout'
  | 'Purchase & Collection'
  | 'Produce Quality & Rejection'
  | 'Audit & Documentation'
  | 'Contract & Terms';

export interface DisputeTimelineEntry {
  id: string;
  type: 'submission' | 'status' | 'info' | 'note' | 'evidence';
  title: string;
  description: string;
  timestamp: string;
  attachmentTitle?: string;
  attachmentType?: string;
}

export interface DisputeAdminNote {
  id: string;
  author: string;
  date: string;
  visibility: 'Internal only' | 'Visible to Farmer' | 'Visible to TOHFA' | 'Visible to all parties';
  content: string;
}

export interface DisputeAttachment {
  id: string;
  title: string;
  type: string;
  date: string;
  author: string;
}

export interface DisputeItem {
  id: string;
  status: DisputeStatus;
  type: DisputeType;
  subject: string;
  title: string;
  category: string;
  createdDate: string;
  lastUpdatedDate: string;
  assignedAdmin: string;
  farmer: {
    name: string;
    farmerId: string;
    farm: string;
    zone: string;
  };
  tohfa: {
    department: string;
    representative: string;
  };
  description: string;
  incidentDate: string;
  linkedRecord: string;
  expectedOutcome: string;
  evidence: DisputeAttachment[];
  adminNotes: DisputeAdminNote[];
  timeline: DisputeTimelineEntry[];
}

// ─── Mock Data (Matching Screenshots 1, 2, 3, 4, 5) ──────────────────────────

const INITIAL_DISPUTES: DisputeItem[] = [
  {
    id: 'DIS-2026-0042',
    status: 'Under Review',
    type: 'Payment & Payout',
    subject: 'Farmer rating question',
    title: 'Farmer rating question',
    category: 'Payment & Payout',
    createdDate: '08 Oct 2026',
    lastUpdatedDate: '09 Oct 2026',
    assignedAdmin: 'Suresh Kumar',
    farmer: {
      name: 'Ramesh Kumar',
      farmerId: 'FMR-00124',
      farm: 'Ramesh Organic Farm',
      zone: 'Coonoor',
    },
    tohfa: {
      department: 'Procurement Team',
      representative: 'Anitha R',
    },
    description:
      'The payment for the carrot batch delivered on 6 October was lower than the accepted price and I was not told why.',
    incidentDate: '06 Oct 2026',
    linkedRecord: 'Purchase Order PO-2026-00124',
    expectedOutcome: 'A clear explanation of the difference, and a correction if it was a mistake.',
    evidence: [
      {
        id: 'ATT-42-1',
        title: 'Payment statement',
        type: 'Document',
        date: '08 Oct 2026',
        author: 'Ramesh Kumar',
      },
      {
        id: 'ATT-42-2',
        title: 'Carrot batch photo',
        type: 'Image',
        date: '08 Oct 2026',
        author: 'Ramesh Kumar',
      },
    ],
    adminNotes: [
      {
        id: 'NOTE-42-1',
        author: 'Suresh Kumar',
        date: '09 Oct 2026, 10:30',
        visibility: 'Internal only',
        content:
          'Spoke to the farmer. The accepted price matches the purchase order; the difference needs a TOHFA explanation.',
      },
    ],
    timeline: [
      {
        id: 'TL-42-1',
        type: 'submission',
        title: 'Dispute submitted',
        description: 'Ramesh Kumar submitted a dispute about a payment.',
        timestamp: 'Ramesh Kumar · 08 Oct 2026, 09:12',
      },
      {
        id: 'TL-42-2',
        type: 'evidence',
        title: 'Evidence added',
        description: 'Payment statement was attached.',
        timestamp: 'Ramesh Kumar · 08 Oct 2026, 09:14',
        attachmentTitle: 'Payment statement',
        attachmentType: 'Document',
      },
      {
        id: 'TL-42-3',
        type: 'evidence',
        title: 'Evidence added',
        description: 'Carrot batch photo was attached.',
        timestamp: 'Ramesh Kumar · 08 Oct 2026, 09:15',
        attachmentTitle: 'Carrot batch photo',
        attachmentType: 'Image',
      },
      {
        id: 'TL-42-4',
        type: 'status',
        title: 'Status changed to Under Review',
        description: 'The Farmer Admin started reviewing the dispute.',
        timestamp: 'Suresh Kumar · 09 Oct 2026, 10:05',
      },
      {
        id: 'TL-42-5',
        type: 'note',
        title: 'Mediation note added',
        description: 'Mediation note recorded (internal).',
        timestamp: 'Suresh Kumar · 09 Oct 2026, 10:30',
      },
    ],
  },
  {
    id: 'DIS-2026-0043',
    status: 'Awaiting TOHFA',
    type: 'Payment & Payout',
    subject: 'Payment delay for accepted produce',
    title: 'Payment delay for accepted produce',
    category: 'Payment & Payout',
    createdDate: '05 Oct 2026',
    lastUpdatedDate: '09 Oct 2026',
    assignedAdmin: 'Suresh Kumar',
    farmer: {
      name: 'Meena',
      farmerId: 'FMR-00177',
      farm: 'Meena Natural Farm',
      zone: 'Coonoor',
    },
    tohfa: {
      department: 'Procurement Team',
      representative: 'Not assigned',
    },
    description:
      'Produce accepted on 28 September has not been paid. I would like to know when payment will be made.',
    incidentDate: '28 Sep 2026',
    linkedRecord: 'Purchase Order PO-2026-00118',
    expectedOutcome: 'Payment, or a clear date for payment.',
    evidence: [
      {
        id: 'ATT-43-1',
        title: 'Acceptance receipt',
        type: 'Document',
        date: '05 Oct 2026',
        author: 'Meena',
      },
    ],
    adminNotes: [],
    timeline: [
      {
        id: 'TL-43-1',
        type: 'submission',
        title: 'Dispute submitted',
        description: 'Meena submitted a dispute about a payment delay.',
        timestamp: 'Meena · 05 Oct 2026, 11:20',
      },
      {
        id: 'TL-43-2',
        type: 'status',
        title: 'Status changed to Under Review',
        description: 'The Farmer Admin started reviewing the dispute.',
        timestamp: 'Suresh Kumar · 06 Oct 2026, 09:00',
      },
      {
        id: 'TL-43-3',
        type: 'info',
        title: 'Information requested',
        description: 'Asked the Procurement Team for the payment schedule for this purchase.',
        timestamp: 'Suresh Kumar · 06 Oct 2026, 09:30',
      },
      {
        id: 'TL-43-4',
        type: 'status',
        title: 'Status changed to Awaiting TOHFA',
        description: 'Waiting for a response from TOHFA.',
        timestamp: 'Suresh Kumar · 06 Oct 2026, 09:30',
      },
    ],
  },
  {
    id: 'DIS-2026-0044',
    status: 'Open',
    type: 'Purchase & Collection',
    subject: 'Collection delay at the Ooty centre',
    title: 'Collection delay at the Ooty centre',
    category: 'Purchase & Collection',
    createdDate: '03 Oct 2026',
    lastUpdatedDate: '04 Oct 2026',
    assignedAdmin: 'Suresh Kumar',
    farmer: {
      name: 'Kumar',
      farmerId: 'FMR-00122',
      farm: 'Nilgiri Highlands Farm',
      zone: 'Ooty Central',
    },
    tohfa: {
      department: 'Collection Team',
      representative: 'Not assigned',
    },
    description:
      'Collection truck scheduled for 03 Oct morning arrived 8 hours late causing partial spoilage of green leafy vegetables.',
    incidentDate: '03 Oct 2026',
    linkedRecord: 'Purchase Order PO-2026-00112',
    expectedOutcome: 'Compensation for damaged portion and revised collection schedule protocol.',
    evidence: [
      {
        id: 'ATT-44-1',
        title: 'Center Gate Entry Slip',
        type: 'Document',
        date: '03 Oct 2026',
        author: 'Kumar',
      },
    ],
    adminNotes: [],
    timeline: [
      {
        id: 'TL-44-1',
        type: 'submission',
        title: 'Dispute submitted',
        description: 'Kumar logged delay notification for Ooty transit hub collection.',
        timestamp: 'Kumar · 03 Oct 2026, 17:45',
      },
    ],
  },
  {
    id: 'DIS-2026-0045',
    status: 'Open',
    type: 'Purchase & Collection',
    subject: 'Transport cost deducted from payout',
    title: 'Transport cost deducted from payout',
    category: 'Purchase & Collection',
    createdDate: '07 Oct 2026',
    lastUpdatedDate: '07 Oct 2026',
    assignedAdmin: 'Suresh Kumar',
    farmer: {
      name: 'Lakshmi',
      farmerId: 'FMR-00189',
      farm: 'Sunshine Eco Fields',
      zone: 'Kotagiri',
    },
    tohfa: {
      department: 'Collection Team',
      representative: 'Not assigned',
    },
    description:
      'Rs 450 deducted for farm-gate transport when terms stated free cooperative logistics for harvest above 50 kg.',
    incidentDate: '06 Oct 2026',
    linkedRecord: 'Purchase Order PO-2026-00130',
    expectedOutcome: 'Reimbursement of Rs 450 deduction and adjustment on invoice.',
    evidence: [
      {
        id: 'ATT-45-1',
        title: 'Freight Deduction Slip',
        type: 'Document',
        date: '07 Oct 2026',
        author: 'Lakshmi',
      },
    ],
    adminNotes: [],
    timeline: [
      {
        id: 'TL-45-1',
        type: 'submission',
        title: 'Dispute submitted',
        description: 'Lakshmi reported unauthorized freight deduction.',
        timestamp: 'Lakshmi · 07 Oct 2026, 14:10',
      },
    ],
  },
  {
    id: 'DIS-2026-0046',
    status: 'Escalated',
    type: 'Produce Quality & Rejection',
    subject: 'Grade assigned to a produce listing',
    title: 'Grade assigned to a produce listing',
    category: 'Produce Quality & Rejection',
    createdDate: '01 Oct 2026',
    lastUpdatedDate: '08 Oct 2026',
    assignedAdmin: 'Suresh Kumar',
    farmer: {
      name: 'Selvi',
      farmerId: 'FMR-00109',
      farm: 'Selvi Hilltop Farm',
      zone: 'Gudalur',
    },
    tohfa: {
      department: 'Quality Control Team',
      representative: 'Anand QC Lead',
    },
    description:
      'Bell pepper lot graded as Grade B due to minor surface marks. Farmer claims marks meet organic standards without internal defect.',
    incidentDate: '30 Sep 2026',
    linkedRecord: 'Purchase Order PO-2026-00105',
    expectedOutcome: 'Re-inspection by senior agricultural auditor and Grade A reinstatement.',
    evidence: [
      {
        id: 'ATT-46-1',
        title: 'QC Assessment Photos',
        type: 'Document',
        date: '01 Oct 2026',
        author: 'Selvi',
      },
    ],
    adminNotes: [],
    timeline: [
      {
        id: 'TL-46-1',
        type: 'submission',
        title: 'Dispute submitted',
        description: 'Selvi disputed Grade B classification.',
        timestamp: 'Selvi · 01 Oct 2026, 12:00',
      },
      {
        id: 'TL-46-2',
        type: 'status',
        title: 'Status changed to Escalated',
        description: 'Escalated to Quality Control senior supervisor for lot specimen check.',
        timestamp: 'Suresh Kumar · 08 Oct 2026, 16:30',
      },
    ],
  },
  {
    id: 'DIS-2026-0038',
    status: 'Resolved',
    type: 'Audit & Documentation',
    subject: 'Audit report clarification',
    title: 'Audit report clarification',
    category: 'Audit & Documentation',
    createdDate: '20 Sep 2026',
    lastUpdatedDate: '28 Sep 2026',
    assignedAdmin: 'Suresh Kumar',
    farmer: {
      name: 'Ramesh Kumar',
      farmerId: 'FMR-00142',
      farm: 'Green Valley Organic',
      zone: 'Ooty North',
    },
    tohfa: {
      department: 'Audit Team',
      representative: 'Priya Auditor',
    },
    description:
      'Clarification requested on composting boundary compliance remark in the annual organic certification audit.',
    incidentDate: '18 Sep 2026',
    linkedRecord: 'Audit AUD-2026-0004',
    expectedOutcome: 'Clarification appended to audit certificate confirming compliant buffer.',
    evidence: [
      {
        id: 'ATT-38-1',
        title: 'Signed Buffer Survey Plan',
        type: 'Document',
        date: '22 Sep 2026',
        author: 'Ramesh Kumar',
      },
    ],
    adminNotes: [],
    timeline: [
      {
        id: 'TL-38-1',
        type: 'submission',
        title: 'Dispute submitted',
        description: 'Clarification submitted by Ramesh Kumar.',
        timestamp: 'Ramesh Kumar · 20 Sep 2026, 09:30',
      },
      {
        id: 'TL-38-2',
        type: 'status',
        title: 'Status changed to Resolved',
        description: 'Buffer clarification validated and appended to formal certification.',
        timestamp: 'Suresh Kumar · 28 Sep 2026, 15:00',
      },
    ],
  },
];

export interface DisputesMediationScreenProps {
  onBack?: () => void;
  onOpenNotifications?: () => void;
  onNavigateFarmerProfile?: (farmerId: string) => void;
}

export function DisputesMediationScreen({
  onBack,
  onOpenNotifications,
}: DisputesMediationScreenProps) {
  // Dispute Database State
  const [disputes, setDisputes] = useState<DisputeItem[]>(INITIAL_DISPUTES);

  // Navigation State
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);
  const [detailViewMode, setDetailViewMode] = useState<'detail' | 'timeline' | 'resolution'>('detail');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('Any');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('Any');
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [farmerFilter, setFarmerFilter] = useState('');
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');
  const [lastActivityFrom, setLastActivityFrom] = useState('');
  const [lastActivityTo, setLastActivityTo] = useState('');

  // Interactive Form States inside Detail Screen
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [noteVisibility, setNoteVisibility] = useState<
    'Internal only' | 'Visible to Farmer' | 'Visible to TOHFA' | 'Visible to all parties'
  >('Internal only');

  const [isRequestingInfo, setIsRequestingInfo] = useState(false);
  const [requestRecipient, setRequestRecipient] = useState<string>('Meena (Farmer)');
  const [informationRequested, setInformationRequested] = useState('');
  const [requestReason, setRequestReason] = useState('');

  // Dispute Resolution Screen State (Matching Current Screenshots 1, 2, 3, 4)
  const [resolutionOutcome, setResolutionOutcome] = useState('Select an outcome');
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [tohfaResponse] = useState('No TOHFA response recorded');
  const [followUpRequired, setFollowUpRequired] = useState('Select');
  const [attachedFile, setAttachedFile] = useState<string | null>(null);
  const [isOutcomeDropdownOpen, setIsOutcomeDropdownOpen] = useState(false);
  const [isFollowUpDropdownOpen, setIsFollowUpDropdownOpen] = useState(false);
  const [resolutionValidationHint, setResolutionValidationHint] = useState<string | null>(null);

  // Auxiliary Preview Modal (Attachment / Linked Record)
  const [previewModal, setPreviewModal] = useState<{ title: string; content: string } | null>(null);

  // Dedicated Rich Attachment Modal with Close Button
  interface AttachmentModalData {
    title: string;
    fileType: string;
    fileSize: string;
    fileName: string;
    uploadedBy: string;
    uploadedDate: string;
    linkedDispute: string;
    linkedPo: string;
    description: string;
    verificationStatus: string;
    securityStatus: string;
  }

  const [attachmentModal, setAttachmentModal] = useState<AttachmentModalData | null>(null);

  const handleOpenAttachment = (title: string) => {
    if (title.toLowerCase().includes('carrot')) {
      setAttachmentModal({
        title: 'Carrot batch photo',
        fileType: 'Image · JPEG',
        fileSize: '3.8 MB',
        fileName: 'carrot_batch_inspection_00124.jpg',
        uploadedBy: 'Ramesh Kumar (Farmer)',
        uploadedDate: '08 Oct 2026, 09:15',
        linkedDispute: currentDispute?.id || 'DIS-2026-0042',
        linkedPo: currentDispute?.linkedRecord || 'Purchase Order PO-2026-00124',
        description:
          'High-resolution photograph of harvested Grade A carrots packed and weighed at farm collection site before transport dispatch.',
        verificationStatus: 'Verified by Farmer Admin',
        securityStatus: 'Passed digital integrity check',
      });
    } else if (title.toLowerCase().includes('payment')) {
      setAttachmentModal({
        title: 'Payment statement',
        fileType: 'Document · PDF',
        fileSize: '1.4 MB',
        fileName: 'bank_statement_payment_oct2026.pdf',
        uploadedBy: 'Ramesh Kumar (Farmer)',
        uploadedDate: '08 Oct 2026, 09:14',
        linkedDispute: currentDispute?.id || 'DIS-2026-0042',
        linkedPo: currentDispute?.linkedRecord || 'Purchase Order PO-2026-00124',
        description:
          'Bank credit advice showing net received payout of Rs 14,200 against expected invoice sum of Rs 17,800 for carrot delivery.',
        verificationStatus: 'Verified by Farmer Admin',
        securityStatus: 'Passed digital integrity check',
      });
    } else {
      setAttachmentModal({
        title,
        fileType: 'Document · PDF',
        fileSize: '2.1 MB',
        fileName: `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_record.pdf`,
        uploadedBy: currentDispute ? `${currentDispute.farmer.name} (Farmer)` : 'Authorized User',
        uploadedDate: currentDispute?.createdDate || '08 Oct 2026',
        linkedDispute: currentDispute?.id || 'DIS-2026-0042',
        linkedPo: currentDispute?.linkedRecord || 'Purchase Order PO-2026-00124',
        description: 'Official file attachment provided during dispute submission and mediation review.',
        verificationStatus: 'Verified by Farmer Admin',
        securityStatus: 'Passed digital integrity check',
      });
    }
  };

  const renderAttachmentModal = () => {
    if (!attachmentModal) return null;

    return (
      <Modal
        visible={attachmentModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setAttachmentModal(null)}
      >
        <View style={styles.modalOverlay}>
          {/* Backdrop tap to dismiss */}
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setAttachmentModal(null)}
            activeOpacity={1}
            accessibilityLabel="Close modal backdrop"
          />

          <View style={styles.attachmentModalCard}>
            {/* Header with Title, Subtitle, and Top-Right Close 'X' Button */}
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.attachmentModalTitle}>{attachmentModal.title}</Text>
                <Text style={styles.attachmentModalSubtitle}>
                  {attachmentModal.fileType} · {attachmentModal.fileSize}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setAttachmentModal(null)}
                activeOpacity={0.7}
                style={styles.attachmentModalCloseIconBtn}
                accessibilityLabel="Close attachment preview"
              >
                <CloseIcon size={20} color={adminColors.ink} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {/* Visual Document / Photo Inspection Preview Frame */}
              {attachmentModal.title.toLowerCase().includes('payment') ? (
                <View style={styles.previewDocumentBox}>
                  <View style={styles.previewDocHeaderRow}>
                    <Text style={styles.previewDocHeaderTitle}>TOHFA PROCUREMENT SETTLEMENT</Text>
                    <View style={styles.previewVerifiedBadge}>
                      <Text style={styles.previewVerifiedBadgeText}>LEDGER AUDITED</Text>
                    </View>
                  </View>

                  <View style={styles.previewDocRow}>
                    <Text style={styles.previewDocLabel}>Contract PO Value</Text>
                    <Text style={styles.previewDocValue}>₹17,800.00</Text>
                  </View>
                  <View style={styles.previewDocRow}>
                    <Text style={styles.previewDocLabel}>Bank Net Credited</Text>
                    <Text style={styles.previewDocValue}>₹14,200.00</Text>
                  </View>
                  <View style={[styles.previewDocRow, styles.previewDiscrepancyRow]}>
                    <Text style={[styles.previewDocLabel, { color: adminColors.danger.text, fontWeight: '700' }]}>
                      Payment Shortfall
                    </Text>
                    <Text style={[styles.previewDocValue, { color: adminColors.danger.text, fontWeight: '800' }]}>
                      -₹3,600.00
                    </Text>
                  </View>

                  <View style={styles.previewDocMetaRow}>
                    <Text style={styles.previewDocSmallMeta}>
                      A/C: SBI ****4291 · Ref: UTR/SBIN/20261008/8892147
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.previewPhotoBox}>
                  <View style={styles.previewDocHeaderRow}>
                    <Text style={styles.previewDocHeaderTitle}>FIELD BATCH INSPECTION</Text>
                    <View style={styles.previewVerifiedBadge}>
                      <Text style={styles.previewVerifiedBadgeText}>GEO-TAGGED</Text>
                    </View>
                  </View>
                  <Text style={styles.previewPhotoSubject}>Grade A Nilgiri Carrots · Batch PO-2026-00124</Text>
                  <Text style={styles.previewPhotoSubMeta}>
                    6 standard harvest crates · 120 kg gross weight · Recorded at farm dispatch gate
                  </Text>
                </View>
              )}

              {/* Metadata details table */}
              <View style={styles.attachmentDetailsCard}>
                <View style={styles.attachmentDetailRow}>
                  <Text style={styles.attachmentDetailLabel}>File Name</Text>
                  <Text style={styles.attachmentDetailValueBold}>{attachmentModal.fileName}</Text>
                </View>
                <View style={styles.attachmentDetailRow}>
                  <Text style={styles.attachmentDetailLabel}>Uploaded By</Text>
                  <Text style={styles.attachmentDetailValue}>{attachmentModal.uploadedBy}</Text>
                </View>
                <View style={styles.attachmentDetailRow}>
                  <Text style={styles.attachmentDetailLabel}>Uploaded On</Text>
                  <Text style={styles.attachmentDetailValue}>{attachmentModal.uploadedDate}</Text>
                </View>
                <View style={styles.attachmentDetailRow}>
                  <Text style={styles.attachmentDetailLabel}>Linked Dispute</Text>
                  <Text style={styles.attachmentDetailValueBold}>{attachmentModal.linkedDispute}</Text>
                </View>
                <View style={styles.attachmentDetailRow}>
                  <Text style={styles.attachmentDetailLabel}>Linked Record</Text>
                  <Text style={styles.attachmentDetailValueBold}>{attachmentModal.linkedPo}</Text>
                </View>
                <View style={styles.attachmentDetailRow}>
                  <Text style={styles.attachmentDetailLabel}>Verification</Text>
                  <Text style={[styles.attachmentDetailValue, { color: adminColors.success.text, fontWeight: '700' }]}>
                    {attachmentModal.verificationStatus}
                  </Text>
                </View>
                <View style={[styles.attachmentDetailRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.attachmentDetailLabel}>Security</Text>
                  <Text style={[styles.attachmentDetailValue, { color: adminColors.brandDeep, fontWeight: '600' }]}>
                    {attachmentModal.securityStatus}
                  </Text>
                </View>
              </View>

              {/* Description / Note */}
              <View style={styles.attachmentNotesBox}>
                <Text style={styles.attachmentNotesHeading}>Attachment Description</Text>
                <Text style={styles.attachmentNotesText}>{attachmentModal.description}</Text>
              </View>
            </ScrollView>

            {/* Bottom Full-width Terracotta Close Button */}
            <TouchableOpacity
              style={styles.attachmentModalCloseBtn}
              onPress={() => setAttachmentModal(null)}
              activeOpacity={0.85}
              accessibilityLabel="Close attachment modal"
            >
              <Text style={styles.attachmentModalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };


  // Timeline Filter Pill State
  const [timelineFilter, setTimelineFilter] = useState<
    'All Activity' | 'Notes' | 'Evidence Updates' | 'Status Changes'
  >('All Activity');

  // Find currently selected dispute
  const currentDispute = useMemo(() => {
    if (!selectedDisputeId) return null;
    return disputes.find((d) => d.id === selectedDisputeId) || null;
  }, [selectedDisputeId, disputes]);

  // Status Badge Styling Helper
  const getStatusBadgeStyle = (status: DisputeStatus) => {
    switch (status) {
      case 'Open':
        return {
          bg: adminColors.brandTint,
          text: adminColors.brandDeep,
        };
      case 'Under Review':
      case 'Mediation in Progress':
        return {
          bg: adminColors.info.bg,
          text: adminColors.info.text,
        };
      case 'Awaiting Information':
      case 'Awaiting TOHFA':
        return {
          bg: adminColors.warning.bg,
          text: adminColors.warning.text,
        };
      case 'Escalated':
        return {
          bg: adminColors.danger.bg,
          text: adminColors.danger.text,
        };
      case 'Resolved':
      case 'Closed':
        return {
          bg: adminColors.success.bg,
          text: adminColors.success.text,
        };
      default:
        return {
          bg: adminColors.canvas,
          text: adminColors.ink,
        };
    }
  };

  // Filtered Disputes
  const filteredDisputes = useMemo(() => {
    return disputes.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = item.id.toLowerCase().includes(q);
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesFarmer = item.farmer.name.toLowerCase().includes(q);
        const matchesOther = item.tohfa.department.toLowerCase().includes(q);
        if (!matchesId && !matchesTitle && !matchesFarmer && !matchesOther) {
          return false;
        }
      }

      if (selectedTypeFilter !== 'Any') {
        if (selectedTypeFilter === 'Farmer vs Farmer') {
          const isFarmerVsFarmer = !item.tohfa.department.includes('TOHFA') && !item.tohfa.department.includes('Team');
          if (!isFarmerVsFarmer) return false;
        } else if (selectedTypeFilter === 'Farmer vs TOHFA') {
          const isFarmerVsTohfa = item.tohfa.department.includes('TOHFA') || item.tohfa.department.includes('Team');
          if (!isFarmerVsTohfa) return false;
        } else if (item.type !== selectedTypeFilter) {
          return false;
        }
      }

      if (selectedStatusFilter !== 'Any') {
        if (selectedStatusFilter === 'Awaiting Information') {
          if (item.status !== 'Awaiting Information' && item.status !== 'Awaiting TOHFA') {
            return false;
          }
        } else if (selectedStatusFilter === 'Mediation in Progress') {
          if (item.status !== 'Mediation in Progress' && item.status !== 'Under Review') {
            return false;
          }
        } else if (item.status !== selectedStatusFilter) {
          return false;
        }
      }

      if (farmerFilter.trim()) {
        const f = farmerFilter.toLowerCase();
        if (!item.farmer.name.toLowerCase().includes(f)) {
          return false;
        }
      }

      return true;
    });
  }, [disputes, searchQuery, selectedTypeFilter, selectedStatusFilter, farmerFilter]);

  // Counts for KPI Summary
  const kpiCounts = useMemo(() => {
    return {
      open: disputes.filter((d) => d.status === 'Open').length,
      underReview: disputes.filter((d) => d.status === 'Under Review').length,
      awaiting: disputes.filter((d) => d.status === 'Awaiting Information' || d.status === 'Awaiting TOHFA').length,
      resolved: disputes.filter((d) => d.status === 'Resolved' || d.status === 'Closed').length,
    };
  }, [disputes]);

  // Handler: Add Note
  const handleSaveNote = () => {
    if (!noteContent.trim() || !selectedDisputeId) return;

    const newNote: DisputeAdminNote = {
      id: `NOTE-${Date.now()}`,
      author: 'Suresh Kumar (Farmer Admin)',
      date: 'Today, 10:45',
      visibility: noteVisibility,
      content: noteContent.trim(),
    };

    const newTimelineEntry: DisputeTimelineEntry = {
      id: `TL-NOTE-${Date.now()}`,
      type: 'note',
      title: 'Mediation note recorded',
      description: noteContent.trim(),
      timestamp: `Suresh Kumar · Today, 10:45 (${noteVisibility})`,
    };

    setDisputes((prev) =>
      prev.map((d) => {
        if (d.id === selectedDisputeId) {
          return {
            ...d,
            adminNotes: [newNote, ...d.adminNotes],
            timeline: [...d.timeline, newTimelineEntry],
            lastUpdatedDate: 'Today',
          };
        }
        return d;
      })
    );

    setNoteContent('');
    setIsAddingNote(false);
  };

  // Handler: Request Information
  const handleSendInformationRequest = () => {
    if (!informationRequested.trim() || !selectedDisputeId) return;

    const newTimelineEntry: DisputeTimelineEntry = {
      id: `TL-REQ-${Date.now()}`,
      type: 'info',
      title: 'Information requested',
      description: `Requested from ${requestRecipient}: ${informationRequested.trim()}${
        requestReason.trim() ? ` (Reason: ${requestReason.trim()})` : ''
      }`,
      timestamp: 'Suresh Kumar · Today, 11:00',
    };

    const targetStatus: DisputeStatus =
      requestRecipient.includes('Farmer') ? 'Awaiting Information' : 'Awaiting TOHFA';

    setDisputes((prev) =>
      prev.map((d) => {
        if (d.id === selectedDisputeId) {
          return {
            ...d,
            status: targetStatus,
            timeline: [...d.timeline, newTimelineEntry],
            lastUpdatedDate: 'Today',
          };
        }
        return d;
      })
    );

    setInformationRequested('');
    setRequestReason('');
    setIsRequestingInfo(false);
  };

  // Handler: Dispute Resolution Review (From Screenshots 1 & 2)
  const handleReviewResolution = () => {
    if (resolutionOutcome === 'Select an outcome') {
      setResolutionValidationHint('Please select a resolution outcome.');
      return;
    }
    if (!resolutionSummary.trim()) {
      setResolutionValidationHint('Please enter a resolution summary.');
      return;
    }

    setResolutionValidationHint(null);

    // Map outcome to status
    let targetStatus: DisputeStatus = 'Resolved';
    if (resolutionOutcome.includes('Awaiting Farmer Information')) {
      targetStatus = 'Awaiting Information';
    } else if (resolutionOutcome.includes('Awaiting TOHFA Response')) {
      targetStatus = 'Awaiting TOHFA';
    } else if (resolutionOutcome.includes('Escalated to TOHFA Admin')) {
      targetStatus = 'Escalated';
    } else if (resolutionOutcome.includes('Unable to Resolve')) {
      targetStatus = 'Under Review';
    }

    const newTimelineEntry: DisputeTimelineEntry = {
      id: `TL-RES-${Date.now()}`,
      type: 'status',
      title: `Resolution Proposed: ${resolutionOutcome}`,
      description: `${resolutionSummary.trim()}${actionTaken.trim() ? ` · Action: ${actionTaken.trim()}` : ''}`,
      timestamp: 'Suresh Kumar · Today, 11:30',
    };

    setDisputes((prev) =>
      prev.map((d) => {
        if (d.id === selectedDisputeId) {
          return {
            ...d,
            status: targetStatus,
            timeline: [...d.timeline, newTimelineEntry],
            lastUpdatedDate: 'Today',
          };
        }
        return d;
      })
    );

    // Return to detail view
    setDetailViewMode('detail');
  };

  // Active filter count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedTypeFilter !== 'Any') count++;
    if (selectedStatusFilter !== 'Any') count++;
    if (farmerFilter.trim()) count++;
    if (createdFrom.trim() || createdTo.trim()) count++;
    if (lastActivityFrom.trim() || lastActivityTo.trim()) count++;
    return count;
  }, [selectedTypeFilter, selectedStatusFilter, farmerFilter, createdFrom, createdTo, lastActivityFrom, lastActivityTo]);

  const handleResetFilters = () => {
    setSelectedTypeFilter('Any');
    setSelectedStatusFilter('Any');
    setFarmerFilter('');
    setCreatedFrom('');
    setCreatedTo('');
    setLastActivityFrom('');
    setLastActivityTo('');
    setIsTypeDropdownOpen(false);
    setIsStatusDropdownOpen(false);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN: DISPUTE RESOLUTION SCREEN (Matching Current Screenshots 1, 2, 3, 4)
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentDispute && detailViewMode === 'resolution') {
    const outcomeOptions = [
      'Select an outcome',
      'Resolved — Clarification Provided',
      'Resolved — Corrective Action Recorded',
      'Awaiting Farmer Information',
      'Awaiting TOHFA Response',
      'Escalated to TOHFA Admin',
      'Unable to Resolve — Further Review Required',
    ];

    const followUpOptions = ['Select', 'Yes', 'No'];

    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Terracotta Header (Screenshot 1) */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.headerBackBtn}
              onPress={() => setDetailViewMode('detail')}
              activeOpacity={0.7}
              accessibilityLabel="Back to Dispute Detail"
            >
              <BackArrowIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>

            <View style={styles.headerCenterColumn}>
              <Text style={styles.headerTitle}>Dispute Resolution</Text>
              <Text style={styles.headerSubtitle}>
                {currentDispute.id} · {currentDispute.status}
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.detailScrollPad}
          showsVerticalScrollIndicator={false}
        >
          {/* Dispute Summary Section (Screenshot 1) */}
          <Text style={styles.sectionHeader}>Dispute summary</Text>
          <View style={styles.detailCard}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Dispute</Text>
                <Text style={styles.fieldValueBold}>{currentDispute.id}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Status</Text>
                <Text style={styles.fieldValueBold}>{currentDispute.status}</Text>
              </View>
            </View>

            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Farmer</Text>
                <Text style={styles.fieldValueBold}>{currentDispute.farmer.name}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Category</Text>
                <Text style={styles.fieldValueBold}>{currentDispute.category}</Text>
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Subject</Text>
              <Text style={styles.fieldValueBold}>{currentDispute.subject}</Text>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Original complaint</Text>
              <Text style={styles.bodyDescriptionText}>{currentDispute.description}</Text>
            </View>

            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>TOHFA reference</Text>
                <Text style={styles.fieldValueBold}>{currentDispute.linkedRecord}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Evidence</Text>
                <Text style={styles.fieldValueBold}>{currentDispute.evidence.length} attached</Text>
              </View>
            </View>
          </View>

          {/* Previous mediation notes Section (Image 4 Left Screen) */}
          <Text style={styles.sectionHeader}>Previous mediation notes</Text>
          <View style={styles.detailCard}>
            <Text style={styles.bodyDescriptionText}>
              {currentDispute.adminNotes?.[0]?.content ??
                'Spoke to the farmer. The accepted price matches the purchase order; the difference needs a TOHFA explanation.'}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: adminColors.ink }}>
                {currentDispute.adminNotes?.[0]?.author ?? 'Suresh Kumar'}
              </Text>
              <Text style={{ fontSize: 12, color: adminColors.muted }}>
                {currentDispute.adminNotes?.[0]?.date ?? '09 Oct 2026, 10:30'}
              </Text>
            </View>
          </View>

          {/* Outcome Section (Screenshot 1 & 2) */}
          <Text style={styles.sectionHeader}>Outcome</Text>
          <View style={styles.detailCard}>
            {/* Field: Resolution Outcome */}
            <Text style={styles.fieldLabel}>
              Resolution Outcome <Text style={{ color: adminColors.danger.text }}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.customSelectBox}
              onPress={() => {
                setIsOutcomeDropdownOpen(!isOutcomeDropdownOpen);
                setIsFollowUpDropdownOpen(false);
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.customSelectText,
                  resolutionOutcome === 'Select an outcome' && { color: adminColors.placeholder },
                ]}
              >
                {resolutionOutcome}
              </Text>
              <ChevronDownIcon size={16} color={adminColors.ink} />
            </TouchableOpacity>

            {/* Dropdown Menu Options (Screenshot 3) */}
            {isOutcomeDropdownOpen && (
              <View style={styles.dropdownMenuBox}>
                {outcomeOptions.map((opt, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.dropdownMenuItem,
                      i === 0 && styles.dropdownMenuHeaderItem,
                      resolutionOutcome === opt && i !== 0 && styles.dropdownMenuItemActive,
                    ]}
                    onPress={() => {
                      setResolutionOutcome(opt);
                      setIsOutcomeDropdownOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dropdownMenuItemText,
                        i === 0 && styles.dropdownMenuHeaderText,
                        resolutionOutcome === opt && i !== 0 && styles.dropdownMenuItemTextActive,
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.orangeNoticeSubtext}>Proposed — Requires TOHFA Approval</Text>

            {/* Field: Resolution Summary */}
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
              Resolution Summary <Text style={{ color: adminColors.danger.text }}>*</Text>
            </Text>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textAreaInput}
                placeholder=""
                placeholderTextColor={adminColors.placeholder}
                value={resolutionSummary}
                onChangeText={setResolutionSummary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <View style={styles.resizeHandleContainer}>
                <ResizeHandleIcon size={12} color={adminColors.muted} />
              </View>
            </View>

            {/* Field: Action Taken */}
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Action Taken</Text>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textAreaInput}
                placeholder=""
                placeholderTextColor={adminColors.placeholder}
                value={actionTaken}
                onChangeText={setActionTaken}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              <View style={styles.resizeHandleContainer}>
                <ResizeHandleIcon size={12} color={adminColors.muted} />
              </View>
            </View>

            {/* Field: TOHFA Response */}
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>TOHFA Response</Text>
            <View style={[styles.customSelectBox, { backgroundColor: adminColors.canvas }]}>
              <Text style={[styles.customSelectText, { color: adminColors.muted }]}>{tohfaResponse}</Text>
              <ChevronDownIcon size={16} color={adminColors.muted} />
            </View>

            {/* Field: Follow-up Required */}
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Follow-up Required</Text>
            <TouchableOpacity
              style={styles.customSelectBox}
              onPress={() => {
                setIsFollowUpDropdownOpen(!isFollowUpDropdownOpen);
                setIsOutcomeDropdownOpen(false);
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.customSelectText,
                  followUpRequired === 'Select' && { color: adminColors.placeholder },
                ]}
              >
                {followUpRequired}
              </Text>
              <ChevronDownIcon size={16} color={adminColors.ink} />
            </TouchableOpacity>

            {/* Dropdown Menu Options (Screenshot 4) */}
            {isFollowUpDropdownOpen && (
              <View style={styles.dropdownMenuBox}>
                {followUpOptions.map((opt, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.dropdownMenuItem,
                      i === 0 && styles.dropdownMenuHeaderItem,
                      followUpRequired === opt && i !== 0 && styles.dropdownMenuItemActive,
                    ]}
                    onPress={() => {
                      setFollowUpRequired(opt);
                      setIsFollowUpDropdownOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dropdownMenuItemText,
                        i === 0 && styles.dropdownMenuHeaderText,
                        followUpRequired === opt && i !== 0 && styles.dropdownMenuItemTextActive,
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Field: Supporting Attachment (optional) */}
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Supporting Attachment (optional)</Text>
            <TouchableOpacity
              style={styles.dashedUploadBox}
              onPress={() => {
                if (attachedFile) {
                  setAttachedFile(null);
                } else {
                  setAttachedFile('Mediation_Agreement_DIS0043.pdf');
                }
              }}
              activeOpacity={0.75}
            >
              <UploadFileIcon size={20} color={adminColors.brandDeep} />
              <Text style={styles.uploadBoxText}>
                {attachedFile ? `Attached: ${attachedFile} (Tap to remove)` : 'Upload file'}
              </Text>
            </TouchableOpacity>

            {resolutionValidationHint && (
              <Text style={styles.validationErrorText}>{resolutionValidationHint}</Text>
            )}
          </View>

          <View style={{ height: 110 }} />
        </ScrollView>

        {/* Pinned Bottom Action Buttons (Screenshot 1 & 2) */}
        <View style={styles.fixedBottomBarTwoButtons}>
          <TouchableOpacity
            style={styles.primaryResolveBtn}
            onPress={handleReviewResolution}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryResolveBtnText}>Review</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelOutlinedBtn}
            onPress={() => setDetailViewMode('detail')}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelOutlinedBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN: DISPUTE TIMELINE SCREEN (Matching Screenshot 5)
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentDispute && detailViewMode === 'timeline') {
    const filteredTimeline = currentDispute.timeline.filter((entry) => {
      if (timelineFilter === 'All Activity') return true;
      if (timelineFilter === 'Notes') return entry.type === 'note' || entry.type === 'info';
      if (timelineFilter === 'Evidence Updates') return entry.type === 'evidence' || entry.type === 'submission';
      if (timelineFilter === 'Status Changes') return entry.type === 'status';
      return true;
    });

    const getTimelineIcon = (entryType: string, title: string) => {
      const lower = title.toLowerCase();
      if (entryType === 'submission' || lower.includes('submitted')) {
        return <TargetDotIcon size={18} color="#C46E26" />;
      }
      if (entryType === 'evidence' || lower.includes('evidence')) {
        return <PaperclipIcon size={18} color="#C46E26" />;
      }
      if (lower.includes('status changed') || entryType === 'status') {
        return <ExchangeArrowsIcon size={18} color="#C46E26" />;
      }
      if (entryType === 'note' || lower.includes('note')) {
        return <NotePencilIcon size={18} color="#C46E26" />;
      }
      if (lower.includes('resolved')) {
        return <CheckCircleIcon size={18} color={adminColors.success.text} />;
      }
      return <ExchangeArrowsIcon size={18} color="#C46E26" />;
    };

    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Terracotta Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.headerBackBtn}
              onPress={() => setDetailViewMode('detail')}
              activeOpacity={0.7}
              accessibilityLabel="Back to Dispute Detail"
            >
              <BackArrowIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>

            <View style={styles.headerCenterColumn}>
              <Text style={styles.headerTitle}>{t('farmerDisputes.timeline.title') || 'Dispute Timeline'}</Text>
              <Text style={styles.headerSubtitle}>
                {currentDispute.id} · {currentDispute.status}
              </Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.timelineScrollPad} showsVerticalScrollIndicator={false}>
          {/* Filter Pills Row */}
          <View style={styles.timelineFilterPillsRow}>
            <TouchableOpacity
              style={[styles.timelineFilterPill, timelineFilter === 'All Activity' && styles.timelineFilterPillActive]}
              onPress={() => setTimelineFilter('All Activity')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.timelineFilterPillText,
                  timelineFilter === 'All Activity' && styles.timelineFilterPillTextActive,
                ]}
              >
                All Activity
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.timelineFilterPill, timelineFilter === 'Notes' && styles.timelineFilterPillActive]}
              onPress={() => setTimelineFilter('Notes')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.timelineFilterPillText,
                  timelineFilter === 'Notes' && styles.timelineFilterPillTextActive,
                ]}
              >
                Notes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.timelineFilterPill, timelineFilter === 'Evidence Updates' && styles.timelineFilterPillActive]}
              onPress={() => setTimelineFilter('Evidence Updates')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.timelineFilterPillText,
                  timelineFilter === 'Evidence Updates' && styles.timelineFilterPillTextActive,
                ]}
              >
                Evidence Updates
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.timelineFilterPillsRow, { marginTop: 8 }]}>
            <TouchableOpacity
              style={[styles.timelineFilterPill, timelineFilter === 'Status Changes' && styles.timelineFilterPillActive]}
              onPress={() => setTimelineFilter('Status Changes')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.timelineFilterPillText,
                  timelineFilter === 'Status Changes' && styles.timelineFilterPillTextActive,
                ]}
              >
                Status Changes
              </Text>
            </TouchableOpacity>
          </View>

          {/* Vertical Timeline Items */}
          <View style={styles.verticalTimelineContainer}>
            {filteredTimeline.map((item, idx) => {
              const isLast = idx === filteredTimeline.length - 1;

              return (
                <View key={item.id} style={styles.timelineRow}>
                  <View style={styles.timelineLeftColumn}>
                    <View style={styles.timelineBadgeCircle}>
                      {getTimelineIcon(item.type, item.title)}
                    </View>
                    {!isLast && <View style={styles.timelineConnectingLine} />}
                  </View>

                  <View style={styles.timelineRightContent}>
                    <Text style={styles.timelineEventTitle}>{item.title}</Text>
                    <Text style={styles.timelineEventDesc}>{item.description}</Text>
                    <Text style={styles.timelineEventMeta}>{item.timestamp}</Text>

                    {item.attachmentTitle && (
                      <View style={styles.timelineAttachmentCard}>
                        <View style={styles.timelineAttachmentLeft}>
                          <PaperclipIcon size={16} color="#A05A1C" />
                          <Text style={styles.timelineAttachmentTitle}>{item.attachmentTitle}</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.timelineViewAttachmentBtn}
                          onPress={() => handleOpenAttachment(item.attachmentTitle!)}
                          activeOpacity={0.75}
                        >
                          <Text style={styles.timelineViewAttachmentBtnText}>View Attachment</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          <Text style={styles.timelineFooterNote}>
            Only events that were actually recorded are shown. Opening this screen adds nothing to the record.
          </Text>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Dedicated Rich Attachment Modal with Close Button */}
        {renderAttachmentModal()}
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN: DISPUTE DETAIL VIEW
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentDispute) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Terracotta Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.headerBackBtn}
              onPress={() => {
                setSelectedDisputeId(null);
                setIsAddingNote(false);
                setIsRequestingInfo(false);
              }}
              activeOpacity={0.7}
              accessibilityLabel="Back to disputes list"
            >
              <BackArrowIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>

            <View style={styles.headerCenterColumn}>
              <Text style={styles.headerTitle}>{t('farmerDisputes.detail.title') || 'Dispute Detail'}</Text>
              <Text style={styles.headerSubtitle}>
                {currentDispute.id} · {currentDispute.status}
              </Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.detailScrollPad} showsVerticalScrollIndicator={false}>
          {/* Dispute Overview Section */}
          <Text style={styles.sectionHeader}>{t('farmerDisputes.overview.section') || 'Dispute Overview'}</Text>
          <View style={styles.detailCard}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Dispute ID</Text>
                <Text style={styles.fieldValueBold}>{currentDispute.id}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Dispute Type</Text>
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Subject</Text>
              <Text style={styles.fieldValueBold}>{currentDispute.subject}</Text>
            </View>

            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Category</Text>
                <Text style={styles.fieldValueBold}>{currentDispute.category}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Status</Text>
                <Text style={styles.fieldValueBold}>{currentDispute.status}</Text>
              </View>
            </View>

            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Created</Text>
                <Text style={styles.fieldValueBold}>{currentDispute.createdDate}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Last Updated</Text>
                <Text style={styles.fieldValueBold}>{currentDispute.lastUpdatedDate}</Text>
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Assigned Admin</Text>
              <Text style={styles.fieldValueBold}>{currentDispute.assignedAdmin}</Text>
            </View>
          </View>

          {/* Farmer Section */}
          <Text style={styles.sectionHeader}>Farmer</Text>
          <View style={styles.detailCard}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Name</Text>
                <Text style={styles.fieldValueBold}>{currentDispute.farmer.name}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Farmer ID</Text>
                <Text style={styles.fieldValueBold}>{currentDispute.farmer.farmerId}</Text>
              </View>
            </View>

            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Farm</Text>
                <Text style={styles.fieldValueBold}>{currentDispute.farmer.farm}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Zone</Text>
                <Text style={styles.fieldValueBold}>{currentDispute.farmer.zone}</Text>
              </View>
            </View>
          </View>

          {/* TOHFA Section */}
          <Text style={styles.sectionHeader}>TOHFA</Text>
          <View style={styles.detailCard}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Department</Text>
                <Text style={styles.fieldValueBold}>{currentDispute.tohfa.department}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Representative</Text>
                <Text style={styles.fieldValueBold}>{currentDispute.tohfa.representative}</Text>
              </View>
            </View>
          </View>

          <View style={styles.maskedNoteCard}>
            <Text style={styles.maskedNoteText}>
              Contact details are masked and shown only where you are authorized.
            </Text>
          </View>

          {/* Dispute Description Section */}
          <Text style={styles.sectionHeader}>Dispute Description</Text>
          <View style={styles.detailCard}>
            <Text style={styles.bodyDescriptionText}>{currentDispute.description}</Text>
          </View>

          {/* Description Metadata Card */}
          <View style={styles.detailCard}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Incident Date</Text>
                <Text style={styles.fieldValueBold}>{currentDispute.incidentDate}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Linked Record</Text>
                <TouchableOpacity
                  onPress={() =>
                    setPreviewModal({
                      title: 'Linked Procurement Record',
                      content: `Record: ${currentDispute.linkedRecord}\nFarmer: ${currentDispute.farmer.name} (${currentDispute.farmer.farmerId})\nZone: ${currentDispute.farmer.zone}\nStatus: Verified in Ledger`,
                    })
                  }
                  activeOpacity={0.7}
                >
                  <Text style={styles.linkedRecordLink}>{currentDispute.linkedRecord}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Expected Outcome</Text>
              <Text style={styles.fieldValueBold}>{currentDispute.expectedOutcome}</Text>
            </View>
          </View>

          {/* Evidence & Attachments Section */}
          <Text style={styles.sectionHeader}>Evidence & Attachments</Text>
          {currentDispute.evidence.map((att) => (
            <View key={att.id} style={styles.attachmentCard}>
              <View style={styles.attachmentLeft}>
                {att.type.toLowerCase().includes('image') ? (
                  <ImageIcon size={22} color={adminColors.brandDeep} />
                ) : (
                  <DocumentIcon size={22} color={adminColors.brandDeep} />
                )}
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.attachmentTitle}>{att.title}</Text>
                  <Text style={styles.attachmentMeta}>
                    {att.type} · {att.date} · by {att.author}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => handleOpenAttachment(att.title)}
                activeOpacity={0.7}
              >
                <Text style={styles.attachmentViewLink}>View</Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* Admin Notes Section */}
          <Text style={styles.sectionHeader}>Admin Notes</Text>
          <View style={styles.detailCard}>
            {currentDispute.adminNotes.length === 0 ? (
              <Text style={styles.noNotesText}>No notes yet.</Text>
            ) : (
              currentDispute.adminNotes.map((note) => (
                <View key={note.id} style={styles.noteItemBox}>
                  <Text style={styles.noteContentText}>{note.content}</Text>
                  <View style={styles.noteBadgesRow}>
                    <View style={styles.noteAuthorPill}>
                      <Text style={styles.noteAuthorPillText}>{note.author}</Text>
                    </View>
                    <View style={styles.noteDatePill}>
                      <Text style={styles.noteDatePillText}>{note.date}</Text>
                    </View>
                    <View style={styles.noteVisibilityPillInternal}>
                      <Text style={styles.noteVisibilityPillTextInternal}>{note.visibility}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Actions Section */}
          <Text style={styles.sectionHeader}>Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionOutlineBtn}
              onPress={() => setDetailViewMode('timeline')}
              activeOpacity={0.75}
            >
              <Text style={styles.actionOutlineBtnText}>View Timeline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionOutlineBtn}
              onPress={() => {
                setIsAddingNote(!isAddingNote);
                setIsRequestingInfo(false);
              }}
              activeOpacity={0.75}
            >
              <Text style={styles.actionOutlineBtnText}>Add Note</Text>
            </TouchableOpacity>
          </View>

          {/* Full-width Request Information Button (Image 2) */}
          <TouchableOpacity
            style={styles.requestInfoOutlineBtn}
            onPress={() => {
              setIsRequestingInfo(!isRequestingInfo);
              setIsAddingNote(false);
            }}
            activeOpacity={0.75}
          >
            <Text style={styles.requestInfoOutlineBtnText}>Request Information</Text>
          </TouchableOpacity>

          {/* INLINE PANEL: ADD NOTE */}
          {isAddingNote && (
            <View style={styles.inlineOrangePanel}>
              <Text style={styles.inlinePanelTitle}>Add Note</Text>

              <View style={styles.textAreaContainer}>
                <TextInput
                  style={styles.textAreaInput}
                  placeholder="Record a mediation note"
                  placeholderTextColor={adminColors.placeholder}
                  value={noteContent}
                  onChangeText={setNoteContent}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                <View style={styles.resizeHandleContainer}>
                  <ResizeHandleIcon size={12} color={adminColors.muted} />
                </View>
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Visibility</Text>
              <View style={styles.customSelectBox}>
                <Text style={styles.customSelectText}>{noteVisibility}</Text>
                <ChevronDownIcon size={16} color={adminColors.ink} />
              </View>

              <TouchableOpacity
                style={styles.greenOutlineBtn}
                onPress={handleSaveNote}
                activeOpacity={0.8}
              >
                <Text style={styles.greenOutlineBtnText}>Save Note</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelNeutralBtn}
                onPress={() => {
                  setNoteContent('');
                  setIsAddingNote(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelNeutralBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* INLINE PANEL: REQUEST INFORMATION */}
          {isRequestingInfo && (
            <View style={styles.inlineOrangePanel}>
              <Text style={styles.inlinePanelTitle}>Request Information</Text>

              <Text style={[styles.fieldLabel, { marginTop: 8 }]}>
                Recipient <Text style={{ color: adminColors.danger.text }}>*</Text>
              </Text>
              <View style={styles.customSelectBox}>
                <Text style={styles.customSelectText}>{requestRecipient}</Text>
                <ChevronDownIcon size={16} color={adminColors.ink} />
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
                Information Requested <Text style={{ color: adminColors.danger.text }}>*</Text>
              </Text>
              <View style={styles.textAreaContainer}>
                <TextInput
                  style={styles.textAreaInput}
                  placeholder=""
                  placeholderTextColor={adminColors.placeholder}
                  value={informationRequested}
                  onChangeText={setInformationRequested}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                <View style={styles.resizeHandleContainer}>
                  <ResizeHandleIcon size={12} color={adminColors.muted} />
                </View>
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Reason for Request (optional)</Text>
              <View style={styles.textAreaContainer}>
                <TextInput
                  style={styles.textAreaInput}
                  placeholder=""
                  placeholderTextColor={adminColors.placeholder}
                  value={requestReason}
                  onChangeText={setRequestReason}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
                <View style={styles.resizeHandleContainer}>
                  <ResizeHandleIcon size={12} color={adminColors.muted} />
                </View>
              </View>

              <TouchableOpacity
                style={styles.greenOutlineBtn}
                onPress={handleSendInformationRequest}
                activeOpacity={0.8}
              >
                <Text style={styles.greenOutlineBtnText}>Send Request</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelNeutralBtn}
                onPress={() => {
                  setInformationRequested('');
                  setRequestReason('');
                  setIsRequestingInfo(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelNeutralBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* The Farmer Admin mediates disclaimer banner (Image 2) */}
          <View style={styles.disclaimerCard}>
            <BlockCircleIcon size={18} color={adminColors.muted} />
            <Text style={styles.disclaimerText}>
              The Farmer Admin mediates. Refunds, compensation, penalties, account suspension and binding decisions are not available here.
            </Text>
          </View>

          <View style={{ height: 90 }} />
        </ScrollView>

        {/* Pinned Bottom Bar: Resolve Dispute (Navigates to Dispute Resolution Screen!) */}
        <View style={styles.fixedBottomBar}>
          <TouchableOpacity
            style={styles.primaryResolveBtn}
            onPress={() => {
              setDetailViewMode('resolution');
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryResolveBtnText}>{t('farmerDisputes.resolve') || 'Resolve Dispute'}</Text>
          </TouchableOpacity>
        </View>

        {/* AUXILIARY PREVIEW MODAL */}
        <Modal
          visible={previewModal !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setPreviewModal(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.previewModalBox}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalSheetTitle}>{previewModal?.title}</Text>
                <TouchableOpacity onPress={() => setPreviewModal(null)} activeOpacity={0.7}>
                  <CloseIcon size={20} color={adminColors.ink} />
                </TouchableOpacity>
              </View>
              <Text style={styles.previewModalContent}>{previewModal?.content}</Text>
              <TouchableOpacity
                style={[styles.primaryResolveBtn, { marginTop: 18 }]}
                onPress={() => setPreviewModal(null)}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryResolveBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Dedicated Rich Attachment Modal with Close Button */}
        {renderAttachmentModal()}
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN LIST SCREEN (Module 10 Home)
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Terracotta Header with Back Button, Exact Gavel Icon & Notifications */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {onBack && (
            <TouchableOpacity
              style={styles.headerBackBtn}
              onPress={onBack}
              activeOpacity={0.7}
              accessibilityLabel="Back to Dashboard"
            >
              <BackArrowIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
          )}

          <View style={styles.headerCenterColumn}>
            <View style={styles.titleWithIcon}>
              <ExactGavelIcon size={22} color={adminColors.onBrand} />
              <Text style={styles.headerTitle}>{t('farmerDisputes.title') || 'Disputes & Mediation'}</Text>
            </View>
            <Text style={styles.headerSubtitle}>
              {t('farmerDisputes.subtitle') || 'Review farmer disputes and coordinate resolutions'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.bellBtn}
            onPress={onOpenNotifications}
            activeOpacity={0.8}
            accessibilityLabel="Notifications"
          >
            <BellNotifIcon size={20} color={adminColors.onBrand} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} color={adminColors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('farmerDisputes.searchPlaceholder') || 'Dispute ID, farmer name, or keyword'}
            placeholderTextColor={adminColors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <CloseIcon size={16} color={adminColors.muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filters Button Pill */}
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setFilterModalVisible(true)}
          activeOpacity={0.8}
        >
          <FilterSlidersIcon size={18} color={adminColors.brandDeep} />
          <Text style={styles.filterBtnText}>
            {t('farmerDisputes.filters') || 'Filters'}
            {activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
          </Text>
        </TouchableOpacity>

        {/* Dispute Count Header */}
        <Text style={styles.disputeCountText}>{filteredDisputes.length} disputes</Text>

        {/* List of Dispute Cards */}
        {filteredDisputes.map((dispute) => {
          const badgeStyle = getStatusBadgeStyle(dispute.status);

          return (
            <View key={dispute.id} style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardIdText}>{dispute.id}</Text>
                <PulseTrendIcon size={24} color={adminColors.brand} />
              </View>

              <View style={styles.badgesRow}>
                <View style={[styles.badge, { backgroundColor: badgeStyle.bg }]}>
                  <Text style={[styles.badgeText, { color: badgeStyle.text }]}>{dispute.status}</Text>
                </View>
                <View style={[styles.badge, styles.typeBadge]}>
                  <Text style={styles.typeBadgeText}>{dispute.type}</Text>
                </View>
              </View>

              <Text style={styles.cardTitle}>{dispute.title}</Text>

              <View style={styles.metaLine}>
                <Text style={styles.metaLabelText}>
                  Raised by: <Text style={styles.metaValueText}>{dispute.farmer.name}</Text>
                </Text>
              </View>

              <View style={styles.metaLine}>
                <Text style={styles.metaLabelText}>
                  Other party: <Text style={styles.metaValueText}>{dispute.tohfa.department} (TOHFA)</Text>
                </Text>
              </View>

              <Text style={styles.createdDateText}>
                Created {dispute.createdDate} · Last activity {dispute.lastUpdatedDate}
              </Text>

              <TouchableOpacity
                style={styles.viewDetailsBtn}
                onPress={() => {
                  setSelectedDisputeId(dispute.id);
                  setDetailViewMode('detail');
                  setIsAddingNote(false);
                  setIsRequestingInfo(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.viewDetailsText}>View Details</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* FILTERS MODAL BOTTOM SHEET */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            onPress={() => setFilterModalVisible(false)}
            activeOpacity={1}
          />
          <View style={styles.filterBottomSheet}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.filterTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)} activeOpacity={0.7}>
                <CloseIcon size={20} color={adminColors.ink} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterFormScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.filterFieldLabel}>Dispute Type</Text>
              <TouchableOpacity
                style={styles.pickerWrap}
                onPress={() => {
                  setIsTypeDropdownOpen(!isTypeDropdownOpen);
                  setIsStatusDropdownOpen(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.pickerValueText}>{selectedTypeFilter}</Text>
                <ChevronDownIcon size={16} color={adminColors.ink} />
              </TouchableOpacity>

              {isTypeDropdownOpen && (
                <View style={styles.filterDropdownMenuBox}>
                  {(['Any', 'Farmer vs Farmer', 'Farmer vs TOHFA'] as const).map((type) => {
                    const isSelected = selectedTypeFilter === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.filterDropdownItem,
                          isSelected && styles.filterDropdownItemActive,
                        ]}
                        onPress={() => {
                          setSelectedTypeFilter(type);
                          setIsTypeDropdownOpen(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.filterDropdownItemText,
                            isSelected && styles.filterDropdownItemTextActive,
                          ]}
                        >
                          {type}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <Text style={styles.filterFieldLabel}>Status</Text>
              <TouchableOpacity
                style={styles.pickerWrap}
                onPress={() => {
                  setIsStatusDropdownOpen(!isStatusDropdownOpen);
                  setIsTypeDropdownOpen(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.pickerValueText}>{selectedStatusFilter}</Text>
                <ChevronDownIcon size={16} color={adminColors.ink} />
              </TouchableOpacity>

              {isStatusDropdownOpen && (
                <View style={styles.filterDropdownMenuBox}>
                  {(
                    [
                      'Any',
                      'Open',
                      'Under Review',
                      'Awaiting Information',
                      'Mediation in Progress',
                      'Resolved',
                      'Closed',
                    ] as const
                  ).map((status) => {
                    const isSelected = selectedStatusFilter === status;
                    return (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.filterDropdownItem,
                          isSelected && styles.filterDropdownItemActive,
                        ]}
                        onPress={() => {
                          setSelectedStatusFilter(status);
                          setIsStatusDropdownOpen(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.filterDropdownItemText,
                            isSelected && styles.filterDropdownItemTextActive,
                          ]}
                        >
                          {status}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <Text style={styles.filterNoticeText}>
                Statuses are a proposed list, pending TOHFA confirmation.
              </Text>

              <Text style={styles.filterFieldLabel}>Party / Farmer</Text>
              <View style={styles.filterInputRow}>
                <TextInput
                  style={styles.filterTextInput}
                  placeholder="Any farmer"
                  placeholderTextColor={adminColors.placeholder}
                  value={farmerFilter}
                  onChangeText={setFarmerFilter}
                />
                <SearchIcon size={16} color={adminColors.muted} />
              </View>

              <View style={styles.dateRow}>
                <View style={styles.dateCol}>
                  <Text style={styles.filterFieldLabel}>Created from</Text>
                  <View style={styles.filterDateInputWrap}>
                    <TextInput
                      style={styles.filterDateInput}
                      placeholder="dd-mm-yyyy"
                      placeholderTextColor={adminColors.placeholder}
                      value={createdFrom}
                      onChangeText={setCreatedFrom}
                    />
                    <CalendarIcon size={16} color={adminColors.muted} />
                  </View>
                </View>

                <View style={styles.dateCol}>
                  <Text style={styles.filterFieldLabel}>Created to</Text>
                  <View style={styles.filterDateInputWrap}>
                    <TextInput
                      style={styles.filterDateInput}
                      placeholder="dd-mm-yyyy"
                      placeholderTextColor={adminColors.placeholder}
                      value={createdTo}
                      onChangeText={setCreatedTo}
                    />
                    <CalendarIcon size={16} color={adminColors.muted} />
                  </View>
                </View>
              </View>

              <View style={styles.dateRow}>
                <View style={styles.dateCol}>
                  <Text style={styles.filterFieldLabel}>Last activity from</Text>
                  <View style={styles.filterDateInputWrap}>
                    <TextInput
                      style={styles.filterDateInput}
                      placeholder="dd-mm-yyyy"
                      placeholderTextColor={adminColors.placeholder}
                      value={lastActivityFrom}
                      onChangeText={setLastActivityFrom}
                    />
                    <CalendarIcon size={16} color={adminColors.muted} />
                  </View>
                </View>

                <View style={styles.dateCol}>
                  <Text style={styles.filterFieldLabel}>Last activity to</Text>
                  <View style={styles.filterDateInputWrap}>
                    <TextInput
                      style={styles.filterDateInput}
                      placeholder="dd-mm-yyyy"
                      placeholderTextColor={adminColors.placeholder}
                      value={lastActivityTo}
                      onChangeText={setLastActivityTo}
                    />
                    <CalendarIcon size={16} color={adminColors.muted} />
                  </View>
                </View>
              </View>

              <View style={styles.filterActionButtonsRow}>
                <TouchableOpacity
                  style={styles.applyFilterBtn}
                  onPress={() => setFilterModalVisible(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.applyFilterBtnText}>Apply Filters</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.resetFilterBtn}
                  onPress={handleResetFilters}
                  activeOpacity={0.8}
                >
                  <Text style={styles.resetFilterBtnText}>Reset</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelFilterBtn}
                  onPress={() => setFilterModalVisible(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelFilterBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── STYLES (Strictly conforming to PR #117 Admin Theme Tokens) ───────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerBackBtn: {
    paddingRight: adminSpacing.sm,
    paddingTop: 3,
    marginRight: 6,
  },
  headerCenterColumn: {
    flex: 1,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontWeight: '800',
  },
  headerSubtitle: {
    ...adminType.caption,
    color: adminColors.onBrand,
    opacity: 0.9,
    marginTop: 4,
  },
  bellBtn: {
    width: 38,
    height: 38,
    borderRadius: adminRadius.full,
    backgroundColor: adminOverlay.whitePill,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
  },
  detailScrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
  },
  timelineScrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
  },

  // Search & Filter
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.sm,
  },
  searchInput: {
    ...adminType.body,
    flex: 1,
    marginLeft: adminSpacing.sm,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignSelf: 'stretch',
    marginBottom: adminSpacing.md,
  },
  filterBtnText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.brandDeep,
    marginLeft: adminSpacing.sm,
  },

  // KPI Metrics
  kpiScroll: {
    marginHorizontal: -adminSpacing.lg,
    marginBottom: adminSpacing.md,
  },
  kpiScrollPad: {
    paddingHorizontal: adminSpacing.lg,
    gap: adminSpacing.sm,
  },
  kpiCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    minWidth: 160,
  },
  kpiLabel: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.muted,
  },
  kpiValue: {
    ...adminType.kpiValue,
    color: adminColors.ink,
    marginVertical: 4,
    fontWeight: '800',
  },
  kpiSub: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  disputeCountText: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: adminSpacing.sm,
  },

  // Main Card Styles
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardIdText: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.ink,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: adminRadius.sm,
  },
  badgeText: {
    ...adminType.caption,
    fontWeight: '700',
  },
  typeBadge: {
    backgroundColor: adminColors.canvas,
  },
  typeBadgeText: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.muted,
  },
  cardTitle: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: 8,
  },
  metaLine: {
    marginTop: 2,
  },
  metaLabelText: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  metaValueText: {
    ...adminType.caption,
    color: adminColors.ink,
    fontWeight: '600',
  },
  createdDateText: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 6,
  },
  viewDetailsBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  viewDetailsText: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },

  // Section Headers inside Detail Screen
  sectionHeader: {
    ...adminType.sectionHead,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginTop: 14,
    marginBottom: 8,
  },
  detailCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: 6,
  },
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  col: {
    flex: 1,
  },
  fieldBlock: {
    marginBottom: 12,
  },
  fieldLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: 3,
  },
  fieldValueBold: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '700',
  },
  maskedNoteCard: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.sm,
    marginTop: 6,
    marginBottom: 8,
  },
  maskedNoteText: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  bodyDescriptionText: {
    ...adminType.body,
    color: adminColors.ink,
    lineHeight: 20,
  },
  linkedRecordLink: {
    ...adminType.body,
    color: adminColors.brandDeep,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  // Evidence Card
  attachmentCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  attachmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  attachmentTitle: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },
  attachmentMeta: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 2,
  },
  attachmentViewLink: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.brandDeep,
    marginLeft: 12,
  },

  // Admin Notes Card
  noNotesText: {
    ...adminType.body,
    color: adminColors.muted,
  },
  noteItemBox: {
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    paddingBottom: 8,
    marginBottom: 8,
  },
  noteHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  noteAuthorText: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.ink,
  },
  noteVisibilityBadge: {
    backgroundColor: adminColors.canvas,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: adminRadius.xs,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  noteVisibilityBadgeText: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  noteContentText: {
    ...adminType.body,
    color: adminColors.ink,
    marginBottom: 4,
  },
  noteDateText: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  noteBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  noteAuthorPill: {
    backgroundColor: '#F0EDE9',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: adminRadius.full,
  },
  noteAuthorPillText: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.ink,
  },
  noteDatePill: {
    backgroundColor: '#F0EDE9',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: adminRadius.full,
  },
  noteDatePillText: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  noteVisibilityPillInternal: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: adminRadius.full,
  },
  noteVisibilityPillTextInternal: {
    ...adminType.caption,
    color: '#1565C0',
    fontWeight: '700',
  },

  // Actions Section
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  actionOutlineBtn: {
    flex: 1,
    height: 44,
    borderRadius: adminRadius.full,
    borderWidth: 1.5,
    borderColor: adminColors.brandDeep,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
  },
  actionFullWidthBtn: {
    width: '100%',
    height: 44,
    borderRadius: adminRadius.full,
    borderWidth: 1.5,
    borderColor: adminColors.brandDeep,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
    marginBottom: 10,
  },
  actionOutlineBtnText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginTop: 6,
    marginBottom: 16,
  },
  disclaimerText: {
    ...adminType.caption,
    color: adminColors.muted,
    marginLeft: 10,
    flex: 1,
    lineHeight: 18,
  },

  // Inline Forms
  inlineOrangePanel: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    padding: adminSpacing.md,
    marginBottom: 14,
  },
  inlinePanelTitle: {
    ...adminType.sectionHead,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: 8,
  },
  textAreaContainer: {
    position: 'relative',
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
  },
  textAreaInput: {
    ...adminType.body,
    color: adminColors.ink,
    padding: adminSpacing.sm,
    minHeight: 80,
  },
  resizeHandleContainer: {
    position: 'absolute',
    right: 4,
    bottom: 4,
  },
  customSelectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    height: 44,
    backgroundColor: adminColors.card,
    marginBottom: 6,
  },
  customSelectText: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '600',
  },
  orangeNoticeSubtext: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.brandDeep,
    marginBottom: 6,
  },

  // Dropdown Menu popup in Resolution Screen
  dropdownMenuBox: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: 10,
    overflow: 'hidden',
    ...adminShadow.sm,
  },
  dropdownMenuItem: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  dropdownMenuHeaderItem: {
    backgroundColor: adminColors.muted,
  },
  dropdownMenuHeaderText: {
    ...adminType.caption,
    color: adminColors.card,
    fontWeight: '700',
  },
  dropdownMenuItemActive: {
    backgroundColor: adminColors.muted,
  },
  dropdownMenuItemText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  dropdownMenuItemTextActive: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },

  // Dashed upload file box
  dashedUploadBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
    borderStyle: 'dashed',
    borderRadius: adminRadius.md,
    height: 48,
    backgroundColor: adminColors.card,
    gap: 8,
  },
  uploadBoxText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },
  validationErrorText: {
    ...adminType.caption,
    color: adminColors.danger.text,
    fontWeight: '700',
    marginTop: 8,
  },

  greenOutlineBtn: {
    height: 44,
    borderRadius: adminRadius.full,
    borderWidth: 1.5,
    borderColor: adminColors.success.text,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    backgroundColor: adminColors.card,
  },
  greenOutlineBtnText: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.success.text,
  },
  cancelNeutralBtn: {
    height: 44,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    backgroundColor: adminColors.card,
  },
  cancelNeutralBtnText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },

  // Fixed Bottom Bar
  fixedBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: adminColors.canvas,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    ...adminShadow.md,
  },
  fixedBottomBarTwoButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: adminColors.canvas,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.lg,
    gap: 8,
    ...adminShadow.md,
  },
  primaryResolveBtn: {
    backgroundColor: adminColors.brand,
    height: 48,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryResolveBtnText: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  cancelOutlinedBtn: {
    backgroundColor: adminColors.card,
    height: 44,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelOutlinedBtnText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },

  // Timeline Screen
  timelineFilterPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timelineFilterPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  timelineFilterPillActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  timelineFilterPillText: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.ink,
  },
  timelineFilterPillTextActive: {
    color: adminColors.onBrand,
  },
  verticalTimelineContainer: {
    marginTop: 20,
    paddingLeft: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 80,
  },
  timelineLeftColumn: {
    width: 32,
    alignItems: 'center',
  },
  timelineBadgeCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: adminColors.brandTint,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timelineConnectingLine: {
    width: 2,
    flex: 1,
    backgroundColor: adminColors.border,
    marginTop: 2,
    marginBottom: -4,
  },
  timelineRightContent: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 20,
  },
  timelineEventTitle: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 2,
  },
  timelineEventDesc: {
    ...adminType.caption,
    color: adminColors.ink,
    marginBottom: 4,
    lineHeight: 18,
  },
  timelineEventMeta: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  timelineFooterNote: {
    ...adminType.caption,
    color: adminColors.muted,
    lineHeight: 18,
    marginTop: 18,
  },
  timelineAttachmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
  },
  timelineAttachmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    paddingRight: 8,
  },
  timelineAttachmentTitle: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },
  timelineViewAttachmentBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: adminRadius.full,
    borderWidth: 1.5,
    borderColor: '#C46E26',
    backgroundColor: adminColors.card,
  },
  timelineViewAttachmentBtnText: {
    ...adminType.caption,
    fontWeight: '700',
    color: '#C46E26',
  },

  // Modals & Bottom Sheets
  modalOverlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  filterBottomSheet: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: adminRadius.xl,
    borderTopRightRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl,
    maxHeight: '85%',
    ...adminShadow.lg,
  },
  previewModalBox: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    marginHorizontal: adminSpacing.lg,
    marginBottom: 'auto',
    marginTop: 'auto',
    padding: adminSpacing.lg,
    ...adminShadow.lg,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalSheetTitle: {
    ...adminType.sectionHead,
    fontWeight: '800',
    color: adminColors.ink,
  },
  previewModalContent: {
    ...adminType.body,
    color: adminColors.ink,
    lineHeight: 22,
    marginVertical: 12,
  },

  // Dedicated Attachment Modal
  attachmentModalCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    marginHorizontal: adminSpacing.lg,
    marginBottom: 'auto',
    marginTop: 'auto',
    padding: adminSpacing.lg,
    ...adminShadow.lg,
    maxHeight: '80%',
  },
  attachmentModalTitle: {
    ...adminType.sectionHead,
    fontWeight: '800',
    color: adminColors.ink,
  },
  attachmentModalSubtitle: {
    ...adminType.caption,
    color: adminColors.brandDeep,
    fontWeight: '700',
    marginTop: 2,
  },
  attachmentModalCloseIconBtn: {
    padding: 4,
  },
  attachmentDetailsCard: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginVertical: 12,
  },
  attachmentDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  attachmentDetailLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    fontWeight: '600',
  },
  attachmentDetailValue: {
    ...adminType.caption,
    color: adminColors.ink,
  },
  attachmentDetailValueBold: {
    ...adminType.caption,
    color: adminColors.ink,
    fontWeight: '700',
  },
  attachmentNotesBox: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 12,
    marginBottom: 16,
  },
  attachmentNotesHeading: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 4,
  },
  attachmentNotesText: {
    ...adminType.caption,
    color: adminColors.ink,
    lineHeight: 18,
  },
  attachmentModalCloseBtn: {
    backgroundColor: adminColors.brand,
    height: 46,
    borderRadius: adminRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentModalCloseBtnText: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  previewDocumentBox: {
    backgroundColor: '#FAF7F2',
    borderRadius: adminRadius.lg,
    borderWidth: 1.5,
    borderColor: '#E6D7C8',
    padding: 12,
    marginTop: 6,
    marginBottom: 8,
  },
  previewPhotoBox: {
    backgroundColor: '#F3F6F2',
    borderRadius: adminRadius.lg,
    borderWidth: 1.5,
    borderColor: '#D4E2D2',
    padding: 12,
    marginTop: 6,
    marginBottom: 8,
  },
  previewDocHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E6D7C8',
    paddingBottom: 6,
  },
  previewDocHeaderTitle: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.brandDeep,
    letterSpacing: 0.5,
  },
  previewVerifiedBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: adminRadius.xs,
  },
  previewVerifiedBadgeText: {
    ...adminType.caption,
    fontWeight: '800',
    color: '#2E7D32',
    fontSize: 10,
  },
  previewDocRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  previewDiscrepancyRow: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    borderRadius: adminRadius.xs,
    marginVertical: 4,
  },
  previewDocLabel: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  previewDocValue: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.ink,
  },
  previewDocMetaRow: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E6D7C8',
  },
  previewDocSmallMeta: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 11,
  },
  previewPhotoSubject: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 4,
  },
  previewPhotoSubMeta: {
    ...adminType.caption,
    color: adminColors.muted,
    lineHeight: 16,
  },

  // Filter Form Controls
  filterTitle: {
    ...adminType.sectionHead,
    fontWeight: '800',
    color: adminColors.ink,
  },
  filterFormScroll: {
    marginTop: 8,
  },
  filterFieldLabel: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.ink,
    marginTop: 10,
    marginBottom: 4,
  },
  pickerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    backgroundColor: adminColors.card,
  },
  pickerValueText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  filterDropdownMenuBox: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.ink,
    marginTop: -1,
    marginBottom: 6,
    zIndex: 20,
    overflow: 'hidden',
  },
  filterDropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: adminSpacing.md,
    backgroundColor: adminColors.card,
  },
  filterDropdownItemActive: {
    backgroundColor: adminColors.muted,
  },
  filterDropdownItemText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  filterDropdownItemTextActive: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  filterNoticeText: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 4,
  },
  filterInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    backgroundColor: adminColors.card,
  },
  filterTextInput: {
    ...adminType.body,
    flex: 1,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateCol: {
    flex: 1,
  },
  filterDateInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.sm,
    backgroundColor: adminColors.card,
  },
  filterDateInput: {
    ...adminType.caption,
    flex: 1,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  filterActionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
    marginBottom: 10,
  },
  applyFilterBtn: {
    flex: 1.2,
    height: 44,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
  },
  applyFilterBtnText: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  resetFilterBtn: {
    flex: 1,
    height: 44,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
  },
  resetFilterBtnText: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  cancelFilterBtn: {
    flex: 1,
    height: 44,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
  },
  cancelFilterBtnText: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  requestInfoOutlineBtn: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#C8651B',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  requestInfoOutlineBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#C8651B',
  },
});
