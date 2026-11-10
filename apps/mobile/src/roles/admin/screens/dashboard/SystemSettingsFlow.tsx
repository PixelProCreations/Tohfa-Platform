import React, { useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function ArrowBackIcon({
  size = 22,
  color = adminColors.onBrand,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PlusCircleWhiteIcon() {
  return (
    <Svg width={36} height={36} viewBox="0 0 36 36" fill="none">
      <Circle cx="18" cy="18" r="18" fill="rgba(255, 255, 255, 0.25)" />
      <Path
        d="M18 11v14M11 18h14"
        stroke={adminColors.onBrand}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function PencilWhiteIcon({
  size = 20,
  color = adminColors.onBrand,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
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

function ChevronRightIcon({
  size = 18,
  color = adminColors.placeholder,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18l6-6-6-6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronDownIcon({
  size = 16,
  color = adminColors.ink,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9l6 6 6-6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ThreeDotsVerticalIcon({ color = adminColors.ink }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="5" r="2" fill={color} />
      <Circle cx="12" cy="12" r="2" fill={color} />
      <Circle cx="12" cy="19" r="2" fill={color} />
    </Svg>
  );
}

function CopyIcon({ size = 16, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="9" y="9" width="13" height="13" rx="2" stroke={color} strokeWidth="1.8" />
      <Path
        d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"
        stroke={color}
        strokeWidth="1.8"
      />
    </Svg>
  );
}

function GlobeIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.8" />
      <Path
        d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"
        stroke={color}
        strokeWidth="1.8"
      />
    </Svg>
  );
}

function KeyIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="7.5" cy="15.5" r="4.5" stroke={color} strokeWidth="1.8" />
      <Path
        d="M11 12l8.5-8.5M16 6l3 3M14 8l2 2"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function EyeOffIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChatBubbleIcon({
  size = 18,
  color = adminColors.muted,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path
        d="M9 10h.01M12 10h.01M15 10h.01"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function LinkChainIcon({
  size = 18,
  color = adminColors.muted,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Path
        d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function LockSecurityIcon({
  size = 18,
  color = adminColors.brand,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" stroke={color} strokeWidth="1.8" />
      <Path d="M7 11V7a5 5 0 0110 0v4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function WarningTriangleIcon({
  size = 22,
  color = adminColors.brand,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 9v4M12 17h.01" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    </Svg>
  );
}

function SignalWifiIcon({
  size = 18,
  color = adminColors.brand,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function RegenerateIcon({
  size = 16,
  color = adminColors.onBrand,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 4v6h-6M1 20v-6h6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Hub Screen Icons
function HubGearIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={adminColors.brand} strokeWidth="2" />
      <Path
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
        stroke={adminColors.brand}
        strokeWidth="1.8"
      />
    </Svg>
  );
}

function HubAuditLogIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="3" width="16" height="18" rx="2" stroke={adminColors.brand} strokeWidth="2" />
      <Path
        d="M8 8h8M8 12h8M8 16h5"
        stroke={adminColors.brand}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function HubExportIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
        stroke={adminColors.brand}
        strokeWidth="1.8"
      />
      <Path
        d="M14 2v6h6M12 18v-6M9 15l3 3 3-3"
        stroke={adminColors.brand}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function HubIntegrationIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 18l6-6-6-6M8 6l-6 6 6 6"
        stroke={adminColors.brand}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function HubDatabaseIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Ellipse cx="12" cy="5" rx="9" ry="3" stroke={adminColors.brand} strokeWidth="1.8" />
      <Path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" stroke={adminColors.brand} strokeWidth="1.8" />
      <Path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" stroke={adminColors.brand} strokeWidth="1.8" />
    </Svg>
  );
}

// Integration Keys Icons
function SmsChatIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
        stroke={adminColors.brand}
        strokeWidth="1.8"
      />
      <Path
        d="M9 10h.01M12 10h.01M15 10h.01"
        stroke={adminColors.brand}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function EmailEnvelopeIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect
        x="2"
        y="4"
        width="20"
        height="16"
        rx="2"
        stroke={adminColors.brand}
        strokeWidth="1.8"
      />
      <Path d="M22 6l-10 7L2 6" stroke={adminColors.brand} strokeWidth="1.8" />
    </Svg>
  );
}

function PaymentCardIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect
        x="2"
        y="5"
        width="20"
        height="14"
        rx="2"
        stroke={adminColors.brand}
        strokeWidth="1.8"
      />
      <Path d="M2 10h20M6 15h4" stroke={adminColors.brand} strokeWidth="1.8" />
    </Svg>
  );
}

function GstTaxInvoiceIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 00-2 2v16l3-2 3 2 3-2 3 2 3-2 3 2V8l-6-6z"
        stroke={adminColors.brand}
        strokeWidth="1.8"
      />
      <Path d="M8 9h4M8 13h8" stroke={adminColors.brand} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function CloudStorageIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"
        stroke={adminColors.brand}
        strokeWidth="1.8"
      />
    </Svg>
  );
}

function CalendarRangeIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3"
        y="4"
        width="18"
        height="18"
        rx="2"
        stroke={adminColors.muted}
        strokeWidth="1.8"
      />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={adminColors.muted} strokeWidth="1.8" />
    </Svg>
  );
}

// ─── Interfaces & Mock Data ───────────────────────────────────────────────────

export interface AuditLogRecord {
  id: string;
  logId: string;
  title: string;
  subtitle: string;
  timestamp: string;
  actionType: 'Create' | 'Update' | 'Generate' | 'Export';
  iconType: 'user_created' | 'settings_updated' | 'api_key' | 'audit_export';
  module: string;
  performedBy: string;
  affectedUser?: string;
  ipAddress: string;
  deviceBrowser: string;
  changeDetails: {
    name?: string;
    role?: string;
    phone?: string;
    warehouse?: string;
    status?: string;
    summary?: string;
  };
}

const INITIAL_AUDIT_LOGS: AuditLogRecord[] = [
  {
    id: 'log-1',
    logId: 'LOG-20261010-1124-7842',
    title: 'User Created',
    subtitle: 'farmer "FAR-034" created',
    timestamp: '10 Oct 2026, 11:24 AM',
    actionType: 'Create',
    iconType: 'user_created',
    module: 'User Management',
    performedBy: 'SA-001 (Super Admin)',
    affectedUser: 'FAR-034',
    ipAddress: '103.82.45.20',
    deviceBrowser: 'Windows - Chrome 142.0',
    changeDetails: {
      name: 'Ramesh Kumar',
      role: 'Farmer',
      phone: '+91 98765 43210',
      warehouse: 'Coonoor',
      status: 'Active',
    },
  },
  {
    id: 'log-2',
    logId: 'LOG-20261010-1124-7841',
    title: 'Settings Updated',
    subtitle: 'Session timeout changed to 30 minutes',
    timestamp: '10 Oct 2026, 11:24 AM',
    actionType: 'Update',
    iconType: 'settings_updated',
    module: 'System Configuration',
    performedBy: 'SA-001 (Super Admin)',
    ipAddress: '103.82.45.20',
    deviceBrowser: 'Windows - Chrome 142.0',
    changeDetails: {
      summary: 'Session timeout value adjusted from 15 minutes to 30 minutes.',
    },
  },
  {
    id: 'log-3',
    logId: 'LOG-20261009-1718-4521',
    title: 'API Key Generated',
    subtitle: 'New integration key created (Inventory Sync)',
    timestamp: '09 Oct 2026, 05:18 PM',
    actionType: 'Generate',
    iconType: 'api_key',
    module: 'Integration Keys',
    performedBy: 'SA-001 (Super Admin)',
    ipAddress: '103.82.45.20',
    deviceBrowser: 'MacOS - Safari 17.1',
    changeDetails: {
      summary: 'API Token generated with read-write permissions for warehouse inventory sync.',
    },
  },
  {
    id: 'log-4',
    logId: 'LOG-20261010-1124-7839',
    title: 'Audit Log Exported',
    subtitle: 'Exported audit log (P4) - 2,560 records',
    timestamp: '10 Oct 2026, 11:24 AM',
    actionType: 'Export',
    iconType: 'audit_export',
    module: 'Audit Logs',
    performedBy: 'SA-001 (Super Admin)',
    ipAddress: '103.82.45.20',
    deviceBrowser: 'Windows - Chrome 142.0',
    changeDetails: {
      summary: 'Exported audit log dataset (P4 security tier) covering 2,560 total system events.',
    },
  },
];

export interface IntegrationKeyItem {
  id: string;
  name: string;
  subtitle: string;
  icon: 'sms' | 'email' | 'payment' | 'gst' | 'cloud' | 'api';
  status: 'Connected' | 'Not Connected';
  provider?: string;
  apiKey?: string;
  senderId?: string;
  apiEndpoint?: string;
  webhookUrl?: string;
  createdOn?: string;
  lastUsed?: string;
  allowedUses?: string[];
  maintenanceMode?: boolean;
}

const INITIAL_INTEGRATION_KEYS: IntegrationKeyItem[] = [
  {
    id: 'int-1',
    name: 'SMS Service',
    subtitle: 'For notifications & alerts',
    icon: 'sms',
    status: 'Connected',
    provider: 'Exotel',
    apiKey: 'sk_live_98371928472918',
    senderId: 'TOHFA',
    apiEndpoint: 'https://api.exotel.com/v1',
    webhookUrl: 'https://api.tohfa.com/webhooks/sms',
    createdOn: '15 Sep 2026, 11:20 AM',
    lastUsed: '27 Oct 2026, 04:36 PM',
    allowedUses: ['OTP / Verification'],
    maintenanceMode: true,
  },
  {
    id: 'int-2',
    name: 'Email Service',
    subtitle: 'For system emails & reports',
    icon: 'email',
    status: 'Connected',
    provider: 'SendGrid',
    apiKey: 'SG.live_83921849182391',
    senderId: 'noreply@tohfa.com',
    apiEndpoint: 'https://api.sendgrid.com/v3',
    createdOn: '10 Sep 2026, 09:15 AM',
    lastUsed: '27 Oct 2026, 03:10 PM',
    allowedUses: ['System Alerts', 'Marketing Messages'],
    maintenanceMode: false,
  },
  {
    id: 'int-3',
    name: 'Payment Gateway',
    subtitle: 'For Payouts & transitions',
    icon: 'payment',
    status: 'Connected',
    provider: 'RazorpayX',
    apiKey: 'rzp_live_73819284729182',
    senderId: 'TOHFA_PAY',
    apiEndpoint: 'https://api.razorpay.com/v1',
    createdOn: '01 Sep 2026, 10:00 AM',
    lastUsed: '27 Oct 2026, 05:00 PM',
    allowedUses: ['Payment Notifications', 'Data Sync'],
    maintenanceMode: false,
  },
  {
    id: 'int-4',
    name: 'GST / e-invoice',
    subtitle: 'For invoice & tax compliance',
    icon: 'gst',
    status: 'Not Connected',
    provider: 'ClearTax',
    apiEndpoint: 'https://api.cleartax.com/v2',
    allowedUses: ['Data Sync'],
    maintenanceMode: false,
  },
  {
    id: 'int-5',
    name: 'Storage (Cloud)',
    subtitle: 'For Backup & file storage',
    icon: 'cloud',
    status: 'Connected',
    provider: 'Google Cloud Storage',
    apiEndpoint: 'https://storage.googleapis.com',
    createdOn: '15 Aug 2026, 08:30 AM',
    lastUsed: '27 Oct 2026, 04:45 PM',
    allowedUses: ['Data Sync'],
    maintenanceMode: false,
  },
  {
    id: 'int-6',
    name: 'External API',
    subtitle: 'For third-party integrations',
    icon: 'api',
    status: 'Connected',
    provider: 'Tohfa Open API',
    apiEndpoint: 'https://api.tohfa.com/v1',
    createdOn: '20 Aug 2026, 11:00 AM',
    lastUsed: '27 Oct 2026, 02:20 PM',
    allowedUses: ['OTP / Verification', 'Data Sync'],
    maintenanceMode: false,
  },
];

export interface SystemSettingsFlowProps {
  onBack: () => void;
  can: (code: string) => boolean;
  role?: string | undefined;
  initialScreen?:
    'hub' | 'config' | 'audit_logs' | 'integration_keys' | 'emergency_export' | undefined;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SystemSettingsFlow({
  onBack,
  can: _can,
  role: _role = 'SUPER_ADMIN',
  initialScreen = 'hub',
}: SystemSettingsFlowProps): React.JSX.Element {
  const [currentScreen, setCurrentScreen] = useState<
    | 'hub'
    | 'config'
    | 'audit_logs'
    | 'log_details'
    | 'filter_logs'
    | 'integration_keys'
    | 'add_integration'
    | 'integration_detail'
    | 'edit_integration'
    | 'emergency_export'
  >(initialScreen);

  const [logs, setLogs] = useState<AuditLogRecord[]>(INITIAL_AUDIT_LOGS);
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);
  const [activeMenuLog, setActiveMenuLog] = useState<AuditLogRecord | null>(null);

  // Integrations State
  const [integrations, setIntegrations] = useState<IntegrationKeyItem[]>(INITIAL_INTEGRATION_KEYS);
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationKeyItem | null>(
    INITIAL_INTEGRATION_KEYS[0] ?? null,
  );
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testProgress, setTestProgress] = useState(60);

  // Add / Edit Integration Form State
  const [formServiceName, setFormServiceName] = useState('');
  const [formIntegrationType, setFormIntegrationType] = useState('Select integration type');
  const [formServiceProvider, setFormServiceProvider] = useState('Select service provider');
  const [formApiEndpoint, setFormApiEndpoint] = useState('https://api.example.com/v1');
  const [formApiKey, setFormApiKey] = useState('******************');
  const [formSenderId, setFormSenderId] = useState('');
  const [formWebhookUrl, setFormWebhookUrl] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formAllowedUses, setFormAllowedUses] = useState<string[]>(['OTP / Verification']);

  // Emergency Database Export Form State
  const [exportReason, setExportReason] = useState('Select reason');
  const [exportAdditionalDetails, setExportAdditionalDetails] = useState('');
  const [exportOptionsSelected, setExportOptionsSelected] = useState<string[]>([
    'Full Database (Recommended)',
  ]);

  // System Configuration States
  const [sessionTimeout, setSessionTimeout] = useState('30 Minutes');
  const [maxLoginAttempts, setMaxLoginAttempts] = useState('Farmer Admin');
  const [forcePasswordChange, setForcePasswordChange] = useState(true);
  const [platformFee, setPlatformFee] = useState('2.00');
  const [transactionFee, setTransactionFee] = useState('₹ 10.00');
  const [certWarning, setCertWarning] = useState('30 Days Before');
  const [remindSuperAdmin, setRemindSuperAdmin] = useState(true);
  const [remindTohfaAdmin, setRemindTohfaAdmin] = useState(false);
  const [remindWarehouseAdmin, setRemindWarehouseAdmin] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowDateExport, setAllowDateExport] = useState(true);

  // Filter Screen States
  const [filterDateRange, setFilterDateRange] = useState('01 Oct 2026 - 31 Oct 2026');
  const [filterUserRole, setFilterUserRole] = useState('All Users');
  const [filterActionType, setFilterActionType] = useState('All Actions');
  const [filterModule, setFilterModule] = useState('All Modules');

  // Active Dropdown Modal State
  const [activeDropdown, setActiveDropdown] = useState<{
    title: string;
    options: string[];
    selected: string;
    onSelect: (val: string) => void;
  } | null>(null);

  const handleCopyLogId = (textToCopy: string) => {
    Alert.alert('Copied', `"${textToCopy}" copied to clipboard.`);
  };

  const handleDeleteLog = (logItem: AuditLogRecord) => {
    Alert.alert(
      'Delete Log (Admin only)',
      `Are you sure you want to delete log ${logItem.logId}? This action is irreversible.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setLogs((prev) => prev.filter((l) => l.id !== logItem.id));
            setActiveMenuLog(null);
            Alert.alert('Deleted', 'Audit log deleted successfully.');
          },
        },
      ],
    );
  };

  const toggleFormAllowedUse = (useItem: string) => {
    setFormAllowedUses((prev) =>
      prev.includes(useItem) ? prev.filter((x) => x !== useItem) : [...prev, useItem],
    );
  };

  const toggleExportOption = (option: string) => {
    setExportOptionsSelected((prev) =>
      prev.includes(option) ? prev.filter((x) => x !== option) : [...prev, option],
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // SCREEN 1: SYSTEM SETTINGS & AUDIT LOG HUB (Image 1, Left Phone)
  // ─────────────────────────────────────────────────────────────────────────────
  if (currentScreen === 'hub') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBackBtn} onPress={onBack} activeOpacity={0.75}>
            <ArrowBackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>System Settings & Audit Log</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionHeaderTitle}>System Settings</Text>

          {/* 1. System Configuration */}
          <TouchableOpacity
            style={styles.hubCard}
            activeOpacity={0.75}
            onPress={() => setCurrentScreen('config')}
          >
            <View style={styles.hubIconBox}>
              <HubGearIcon />
            </View>
            <View style={styles.hubTextBox}>
              <Text style={styles.hubCardTitle}>System Configuration</Text>
              <Text style={styles.hubCardSubtitle}>
                Session, fees, certificate expiry and other system settings
              </Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>

          {/* 2. Audit Log */}
          <TouchableOpacity
            style={styles.hubCard}
            activeOpacity={0.75}
            onPress={() => setCurrentScreen('audit_logs')}
          >
            <View style={styles.hubIconBox}>
              <HubAuditLogIcon />
            </View>
            <View style={styles.hubTextBox}>
              <Text style={styles.hubCardTitle}>Audit Log</Text>
              <Text style={styles.hubCardSubtitle}>
                View user actives with filters and detailed information
              </Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>

          {/* 3. Export Audit Log */}
          <TouchableOpacity
            style={styles.hubCard}
            activeOpacity={0.75}
            onPress={() => {
              Alert.alert(
                'Export Audit Log',
                'Choose format to export filtered audit logs (P4, P5):',
                [
                  {
                    text: 'CSV (.csv)',
                    onPress: () =>
                      Alert.alert('Export Started', 'Audit log CSV download has started.'),
                  },
                  {
                    text: 'PDF (.pdf)',
                    onPress: () =>
                      Alert.alert('Export Started', 'Audit log PDF download has started.'),
                  },
                  {
                    text: 'JSON (.json)',
                    onPress: () =>
                      Alert.alert('Export Started', 'Audit log JSON download has started.'),
                  },
                  { text: 'Cancel', style: 'cancel' },
                ],
              );
            }}
          >
            <View style={styles.hubIconBox}>
              <HubExportIcon />
            </View>
            <View style={styles.hubTextBox}>
              <Text style={styles.hubCardTitle}>Export Audit Log</Text>
              <Text style={styles.hubCardSubtitle}>Export filtered audit audit logs (P4,P5)</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>

          {/* 4. Integration Keys */}
          <TouchableOpacity
            style={styles.hubCard}
            activeOpacity={0.75}
            onPress={() => setCurrentScreen('integration_keys')}
          >
            <View style={styles.hubIconBox}>
              <HubIntegrationIcon />
            </View>
            <View style={styles.hubTextBox}>
              <Text style={styles.hubCardTitle}>Integration Keys</Text>
              <Text style={styles.hubCardSubtitle}>Manage connected services and API keys</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>

          {/* 5. Emergency Database Export */}
          <TouchableOpacity
            style={styles.hubCard}
            activeOpacity={0.75}
            onPress={() => setCurrentScreen('emergency_export')}
          >
            <View style={styles.hubIconBox}>
              <HubDatabaseIcon />
            </View>
            <View style={styles.hubTextBox}>
              <Text style={styles.hubCardTitle}>Emergency Database Export</Text>
              <Text style={styles.hubCardSubtitle}>
                Export raw database with reason and warning
              </Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SCREEN 2: SYSTEM CONFIGURATION (Image 1, Right Phone)
  // ─────────────────────────────────────────────────────────────────────────────
  if (currentScreen === 'config') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={() => setCurrentScreen('hub')}
            activeOpacity={0.75}
          >
            <ArrowBackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>System Configuration</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Section 1: Session & Security */}
          <Text style={styles.sectionHeaderTitle}>1. Session & Security</Text>
          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>Session Timeout *</Text>
            <TouchableOpacity
              style={styles.selectInput}
              activeOpacity={0.8}
              onPress={() =>
                setActiveDropdown({
                  title: 'Select Session Timeout',
                  options: ['15 Minutes', '30 Minutes', '60 Minutes', '120 Minutes'],
                  selected: sessionTimeout,
                  onSelect: (val) => setSessionTimeout(val),
                })
              }
            >
              <Text style={styles.selectInputText}>{sessionTimeout}</Text>
              <ChevronDownIcon />
            </TouchableOpacity>

            <Text style={[styles.fieldLabel, { marginTop: adminSpacing.md }]}>
              Max Login Attempts *
            </Text>
            <TouchableOpacity
              style={styles.selectInput}
              activeOpacity={0.8}
              onPress={() =>
                setActiveDropdown({
                  title: 'Select Max Login Attempts',
                  options: ['Farmer Admin', '3 Attempts', '5 Attempts', '10 Attempts'],
                  selected: maxLoginAttempts,
                  onSelect: (val) => setMaxLoginAttempts(val),
                })
              }
            >
              <Text style={styles.selectInputText}>{maxLoginAttempts}</Text>
              <ChevronDownIcon />
            </TouchableOpacity>

            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchLabel}>Force Password Change</Text>
                <Text style={styles.switchSubLabel}>(After 90 days)</Text>
              </View>
              <Switch
                value={forcePasswordChange}
                onValueChange={setForcePasswordChange}
                trackColor={{ false: adminColors.border, true: adminColors.brand }}
                thumbColor={adminColors.card}
              />
            </View>
          </View>

          {/* Section 2: Fees & Charges */}
          <Text style={[styles.sectionHeaderTitle, { marginTop: adminSpacing.xl }]}>
            2. Fees & Charges
          </Text>
          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>Platform Fee (%) *</Text>
            <View style={styles.inputWithSuffix}>
              <TextInput
                style={styles.textInputInner}
                value={platformFee}
                onChangeText={setPlatformFee}
                keyboardType="decimal-pad"
              />
              <Text style={styles.suffixText}>%</Text>
            </View>

            <Text style={[styles.fieldLabel, { marginTop: adminSpacing.md }]}>
              Transaction Fee (Per Transaction) *
            </Text>
            <TouchableOpacity
              style={styles.selectInput}
              activeOpacity={0.8}
              onPress={() =>
                setActiveDropdown({
                  title: 'Transaction Fee',
                  options: ['₹ 5.00', '₹ 10.00', '₹ 15.00', '₹ 20.00'],
                  selected: transactionFee,
                  onSelect: (val) => setTransactionFee(val),
                })
              }
            >
              <Text style={styles.selectInputText}>{transactionFee}</Text>
              <ChevronDownIcon />
            </TouchableOpacity>
          </View>

          {/* Section 3: Certificate & Compliance */}
          <Text style={[styles.sectionHeaderTitle, { marginTop: adminSpacing.xl }]}>
            3. Certificate & Compliance
          </Text>
          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>Certificate Expiry Warning *</Text>
            <TouchableOpacity
              style={styles.selectInput}
              activeOpacity={0.8}
              onPress={() =>
                setActiveDropdown({
                  title: 'Certificate Expiry Warning',
                  options: ['15 Days Before', '30 Days Before', '45 Days Before', '60 Days Before'],
                  selected: certWarning,
                  onSelect: (val) => setCertWarning(val),
                })
              }
            >
              <Text style={styles.selectInputText}>{certWarning}</Text>
              <ChevronDownIcon />
            </TouchableOpacity>

            <Text style={[styles.fieldLabel, { marginTop: adminSpacing.md }]}>
              Send Reminder To
            </Text>
            <View style={styles.checkboxGrid}>
              <TouchableOpacity
                style={styles.checkboxItem}
                activeOpacity={0.8}
                onPress={() => setRemindSuperAdmin(!remindSuperAdmin)}
              >
                <View style={[styles.checkboxBox, remindSuperAdmin && styles.checkboxBoxActive]}>
                  {remindSuperAdmin && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Super Admin</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxItem}
                activeOpacity={0.8}
                onPress={() => setRemindTohfaAdmin(!remindTohfaAdmin)}
              >
                <View style={[styles.checkboxBox, remindTohfaAdmin && styles.checkboxBoxActive]}>
                  {remindTohfaAdmin && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>TOHFA Admin</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.checkboxItem, { marginTop: adminSpacing.sm }]}
              activeOpacity={0.8}
              onPress={() => setRemindWarehouseAdmin(!remindWarehouseAdmin)}
            >
              <View style={[styles.checkboxBox, remindWarehouseAdmin && styles.checkboxBoxActive]}>
                {remindWarehouseAdmin && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Warehouse Admin</Text>
            </TouchableOpacity>
          </View>

          {/* Section 4: Other Settings */}
          <Text style={[styles.sectionHeaderTitle, { marginTop: adminSpacing.xl }]}>
            4. Other Settings
          </Text>
          <View style={styles.formGroup}>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>System Maintenance Mode</Text>
              <Switch
                value={maintenanceMode}
                onValueChange={setMaintenanceMode}
                trackColor={{ false: adminColors.border, true: adminColors.brand }}
                thumbColor={adminColors.card}
              />
            </View>

            <View style={[styles.switchRow, { marginTop: adminSpacing.md }]}>
              <Text style={styles.switchLabel}>Allow Date Export (P4, P5)</Text>
              <Switch
                value={allowDateExport}
                onValueChange={setAllowDateExport}
                trackColor={{ false: adminColors.border, true: adminColors.brand }}
                thumbColor={adminColors.card}
              />
            </View>
          </View>

          {/* Bottom Dual Action Buttons */}
          <View style={styles.configBottomRow}>
            <TouchableOpacity
              style={styles.resetButton}
              activeOpacity={0.8}
              onPress={() => {
                setSessionTimeout('30 Minutes');
                setMaxLoginAttempts('Farmer Admin');
                setForcePasswordChange(true);
                setPlatformFee('2.00');
                setTransactionFee('₹ 10.00');
                setCertWarning('30 Days Before');
                setRemindSuperAdmin(true);
                setRemindTohfaAdmin(false);
                setRemindWarehouseAdmin(false);
                setMaintenanceMode(false);
                setAllowDateExport(true);
                Alert.alert('Reset', 'Configuration reset to defaults.');
              }}
            >
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveButton}
              activeOpacity={0.8}
              onPress={() => {
                Alert.alert(
                  'Settings Saved',
                  'System configuration has been successfully updated.',
                );
              }}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {renderDropdownModal()}
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SCREEN 3: AUDIT LOG (Image 2)
  // ─────────────────────────────────────────────────────────────────────────────
  if (currentScreen === 'audit_logs') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={() => setCurrentScreen('hub')}
            activeOpacity={0.75}
          >
            <ArrowBackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Audit Log</Text>
          <TouchableOpacity
            style={{ padding: 4 }}
            activeOpacity={0.8}
            onPress={() => setCurrentScreen('filter_logs')}
          >
            <PlusCircleWhiteIcon />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Filter Bar */}
          <View style={styles.filterBar}>
            <Text style={styles.filterBarTitle}>1. Filter</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => setLogs(INITIAL_AUDIT_LOGS)}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          </View>

          {/* Audit Logs List */}
          {logs.map((item) => {
            const isUserCreated = item.iconType === 'user_created';
            const isSettingsUpdated = item.iconType === 'settings_updated';
            const isApiKey = item.iconType === 'api_key';
            const isAuditExport = item.iconType === 'audit_export';

            const iconBg = isUserCreated
              ? '#E8F8F0'
              : isSettingsUpdated
                ? '#FDECEE'
                : isApiKey
                  ? '#FEF7E6'
                  : '#E6F6F4';

            const iconColor = isUserCreated
              ? adminColors.success.text
              : isSettingsUpdated
                ? adminColors.danger.text
                : isApiKey
                  ? adminColors.warning.text
                  : '#0D824B';

            return (
              <View key={item.id} style={styles.logCard}>
                <View style={[styles.logIconBox, { backgroundColor: iconBg }]}>
                  {isUserCreated && (
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M12 5v14M5 12h14"
                        stroke={iconColor}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                    </Svg>
                  )}
                  {isSettingsUpdated && (
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
                        stroke={iconColor}
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <Path
                        d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                        stroke={iconColor}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  )}
                  {isApiKey && (
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                      <Circle cx="7.5" cy="15.5" r="4.5" stroke={iconColor} strokeWidth="2" />
                      <Path
                        d="M11 12l8.5-8.5M16 6l3 3M14 8l2 2"
                        stroke={iconColor}
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </Svg>
                  )}
                  {isAuditExport && (
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
                        stroke={iconColor}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  )}
                </View>

                <TouchableOpacity
                  style={{ flex: 1 }}
                  activeOpacity={0.8}
                  onPress={() => {
                    setSelectedLog(item);
                    setCurrentScreen('log_details');
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={styles.logTitle}>{item.title}</Text>
                    <Text style={styles.logTimestamp}>{item.timestamp}</Text>
                  </View>
                  <Text style={styles.logSubtitle}>{item.subtitle}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.moreDotsBtn}
                  activeOpacity={0.7}
                  onPress={() => setActiveMenuLog(item)}
                >
                  <ThreeDotsVerticalIcon />
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>

        {/* 3-Dots Popup Menu Modal */}
        <Modal
          visible={activeMenuLog !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setActiveMenuLog(null)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setActiveMenuLog(null)}
          >
            <View style={styles.menuPopupCard}>
              <TouchableOpacity
                style={styles.menuItemRow}
                onPress={() => {
                  if (activeMenuLog) {
                    setSelectedLog(activeMenuLog);
                    setActiveMenuLog(null);
                    setCurrentScreen('log_details');
                  }
                }}
              >
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                    stroke={adminColors.ink}
                    strokeWidth="1.8"
                  />
                  <Circle cx="12" cy="12" r="3" stroke={adminColors.ink} strokeWidth="1.8" />
                </Svg>
                <Text style={styles.menuItemText}>View Details</Text>
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity
                style={styles.menuItemRow}
                onPress={() => {
                  if (activeMenuLog) {
                    handleCopyLogId(activeMenuLog.logId);
                    setActiveMenuLog(null);
                  }
                }}
              >
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
                    stroke={adminColors.ink}
                    strokeWidth="1.8"
                  />
                  <Path
                    d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                    stroke={adminColors.ink}
                    strokeWidth="1.8"
                  />
                </Svg>
                <Text style={styles.menuItemText}>Copy Log ID</Text>
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity
                style={styles.menuItemRow}
                onPress={() => {
                  Alert.alert(
                    'Download Log (JSON)',
                    `Exported ${activeMenuLog?.logId}.json successfully.`,
                  );
                  setActiveMenuLog(null);
                }}
              >
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
                    stroke={adminColors.ink}
                    strokeWidth="1.8"
                  />
                </Svg>
                <Text style={styles.menuItemText}>Download Log (JSON)</Text>
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity
                style={styles.menuItemRow}
                onPress={() => {
                  Alert.alert(
                    'Download Log (PDF)',
                    `Exported ${activeMenuLog?.logId}.pdf successfully.`,
                  );
                  setActiveMenuLog(null);
                }}
              >
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
                    stroke={adminColors.ink}
                    strokeWidth="1.8"
                  />
                  <Path
                    d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
                    stroke={adminColors.ink}
                    strokeWidth="1.8"
                  />
                </Svg>
                <Text style={styles.menuItemText}>Download Log (PDF)</Text>
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity
                style={styles.menuItemRow}
                onPress={() => {
                  if (activeMenuLog) handleDeleteLog(activeMenuLog);
                }}
              >
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
                    stroke={adminColors.danger.text}
                    strokeWidth="1.8"
                  />
                </Svg>
                <Text style={[styles.menuItemText, { color: adminColors.danger.text }]}>
                  Delete Log (Admin only)
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SCREEN 4: LOG DETAILS (Image 3, Left Phone)
  // ─────────────────────────────────────────────────────────────────────────────
  if (currentScreen === 'log_details' && selectedLog) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={() => setCurrentScreen('audit_logs')}
            activeOpacity={0.75}
          >
            <ArrowBackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Log Details</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Section 1: Integration Details */}
          <Text style={styles.sectionHeaderTitle}>1. Integration Details</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>LOG ID</Text>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                activeOpacity={0.7}
                onPress={() => handleCopyLogId(selectedLog.logId)}
              >
                <Text style={[styles.detailValue, { fontWeight: '700' }]}>{selectedLog.logId}</Text>
                <CopyIcon />
              </TouchableOpacity>
            </View>
            <View style={styles.detailDivider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Action Type</Text>
              <Text style={styles.detailValue}>{selectedLog.actionType}</Text>
            </View>
            <View style={styles.detailDivider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Module</Text>
              <Text style={styles.detailValue}>{selectedLog.module}</Text>
            </View>
            <View style={styles.detailDivider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Performed By</Text>
              <Text style={styles.detailValue}>{selectedLog.performedBy}</Text>
            </View>
            <View style={styles.detailDivider} />

            {selectedLog.affectedUser && (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Affected User</Text>
                  <Text style={styles.detailValue}>{selectedLog.affectedUser}</Text>
                </View>
                <View style={styles.detailDivider} />
              </>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>IP Address</Text>
              <Text style={styles.detailValue}>{selectedLog.ipAddress}</Text>
            </View>
            <View style={styles.detailDivider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Device / Browser</Text>
              <Text style={styles.detailValue}>{selectedLog.deviceBrowser}</Text>
            </View>
            <View style={styles.detailDivider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date & Time</Text>
              <Text style={styles.detailValue}>{selectedLog.timestamp}</Text>
            </View>
          </View>

          {/* Section 2: Change Details */}
          <Text style={[styles.sectionHeaderTitle, { marginTop: adminSpacing.xl }]}>
            2. Change Details
          </Text>
          <View style={styles.detailCard}>
            <Text style={styles.changeSubhead}>User created with the following details:</Text>
            <View style={{ marginTop: adminSpacing.md, gap: adminSpacing.sm }}>
              {selectedLog.changeDetails.name && (
                <View style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletKey}>Name:</Text>
                  <Text style={styles.bulletVal}>{selectedLog.changeDetails.name}</Text>
                </View>
              )}
              {selectedLog.changeDetails.role && (
                <View style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletKey}>Role:</Text>
                  <Text style={styles.bulletVal}>{selectedLog.changeDetails.role}</Text>
                </View>
              )}
              {selectedLog.changeDetails.phone && (
                <View style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletKey}>Phone:</Text>
                  <Text style={styles.bulletVal}>{selectedLog.changeDetails.phone}</Text>
                </View>
              )}
              {selectedLog.changeDetails.warehouse && (
                <View style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletKey}>Warehouse:</Text>
                  <Text style={styles.bulletVal}>{selectedLog.changeDetails.warehouse}</Text>
                </View>
              )}
              {selectedLog.changeDetails.status && (
                <View style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletKey}>Status:</Text>
                  <Text style={styles.bulletVal}>{selectedLog.changeDetails.status}</Text>
                </View>
              )}
              {selectedLog.changeDetails.summary && (
                <View style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletKey}>Summary:</Text>
                  <Text style={styles.bulletVal}>{selectedLog.changeDetails.summary}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Dual Action Buttons */}
          <View style={styles.logDetailBottomRow}>
            <TouchableOpacity
              style={styles.downloadOutlineBtn}
              activeOpacity={0.8}
              onPress={() =>
                Alert.alert('Download Log', `Downloading ${selectedLog.logId}.json...`)
              }
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
                  stroke={adminColors.brand}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={styles.downloadOutlineBtnText}>Download Log (JSON)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.downloadSolidBtn}
              activeOpacity={0.8}
              onPress={() => Alert.alert('Download Log', `Downloading ${selectedLog.logId}.pdf...`)}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
                  stroke={adminColors.onBrand}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M14 2v6h6"
                  stroke={adminColors.onBrand}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={styles.downloadSolidBtnText}>Download Log (PDF)</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SCREEN 5: AUDIT LOG FILTER (Image 3, Right Phone)
  // ─────────────────────────────────────────────────────────────────────────────
  if (currentScreen === 'filter_logs') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={() => setCurrentScreen('audit_logs')}
            activeOpacity={0.75}
          >
            <ArrowBackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Audit Log</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.filterBar}>
            <Text style={styles.filterBarTitle}>1. Filter</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                setFilterDateRange('01 Oct 2026 - 31 Oct 2026');
                setFilterUserRole('All Users');
                setFilterActionType('All Actions');
                setFilterModule('All Modules');
              }}
            >
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>Date Range</Text>
            <TouchableOpacity
              style={styles.selectInput}
              activeOpacity={0.8}
              onPress={() =>
                setActiveDropdown({
                  title: 'Select Date Range',
                  options: ['Today', 'Last 7 Days', '01 Oct 2026 - 31 Oct 2026', 'Custom Range'],
                  selected: filterDateRange,
                  onSelect: (val) => setFilterDateRange(val),
                })
              }
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <CalendarRangeIcon />
                <Text style={styles.selectInputText}>{filterDateRange}</Text>
              </View>
              <ChevronDownIcon />
            </TouchableOpacity>

            <Text style={[styles.fieldLabel, { marginTop: adminSpacing.md }]}>User / Role</Text>
            <TouchableOpacity
              style={styles.selectInput}
              activeOpacity={0.8}
              onPress={() =>
                setActiveDropdown({
                  title: 'Select User / Role',
                  options: [
                    'All Users',
                    'Super Admin',
                    'Farmer Admin',
                    'Warehouse Admin',
                    'Farmers',
                  ],
                  selected: filterUserRole,
                  onSelect: (val) => setFilterUserRole(val),
                })
              }
            >
              <Text style={styles.selectInputText}>{filterUserRole}</Text>
              <ChevronDownIcon />
            </TouchableOpacity>

            <Text style={[styles.fieldLabel, { marginTop: adminSpacing.md }]}>Action Type</Text>
            <TouchableOpacity
              style={styles.selectInput}
              activeOpacity={0.8}
              onPress={() =>
                setActiveDropdown({
                  title: 'Select Action Type',
                  options: ['All Actions', 'Create', 'Update', 'Generate', 'Export', 'Delete'],
                  selected: filterActionType,
                  onSelect: (val) => setFilterActionType(val),
                })
              }
            >
              <Text style={styles.selectInputText}>{filterActionType}</Text>
              <ChevronDownIcon />
            </TouchableOpacity>

            <Text style={[styles.fieldLabel, { marginTop: adminSpacing.md }]}>Module</Text>
            <TouchableOpacity
              style={styles.selectInput}
              activeOpacity={0.8}
              onPress={() =>
                setActiveDropdown({
                  title: 'Select Module',
                  options: [
                    'All Modules',
                    'User Management',
                    'System Configuration',
                    'Integration Keys',
                    'Audit Logs',
                    'Market & Pricing',
                    'Sales & Orders',
                  ],
                  selected: filterModule,
                  onSelect: (val) => setFilterModule(val),
                })
              }
            >
              <Text style={styles.selectInputText}>{filterModule}</Text>
              <ChevronDownIcon />
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.configBottomRow}>
            <TouchableOpacity
              style={styles.resetButton}
              activeOpacity={0.8}
              onPress={() => {
                setFilterDateRange('01 Oct 2026 - 31 Oct 2026');
                setFilterUserRole('All Users');
                setFilterActionType('All Actions');
                setFilterModule('All Modules');
              }}
            >
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveButton}
              activeOpacity={0.8}
              onPress={() => {
                setCurrentScreen('audit_logs');
              }}
            >
              <Text style={styles.saveButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {renderDropdownModal()}
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SCREEN 6: INTEGRATION KEYS (Image 4 & 5 previous chat)
  // ─────────────────────────────────────────────────────────────────────────────
  if (currentScreen === 'integration_keys') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={() => setCurrentScreen('hub')}
            activeOpacity={0.75}
          >
            <ArrowBackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Integration Keys</Text>
          <TouchableOpacity
            style={{ padding: 4 }}
            activeOpacity={0.8}
            onPress={() => {
              setFormServiceName('');
              setFormIntegrationType('Select integration type');
              setFormServiceProvider('Select service provider');
              setFormApiEndpoint('https://api.example.com/v1');
              setFormApiKey('******************');
              setFormSenderId('');
              setFormWebhookUrl('');
              setFormIsActive(true);
              setFormAllowedUses(['OTP / Verification']);
              setCurrentScreen('add_integration');
            }}
          >
            <PlusCircleWhiteIcon />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionHeaderTitle}>Integration Keys</Text>

          {integrations.map((item) => {
            const isConnected = item.status === 'Connected';
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.integrationCard}
                activeOpacity={0.8}
                onPress={() => {
                  setSelectedIntegration(item);
                  setIsTestingConnection(false);
                  setCurrentScreen('integration_detail');
                }}
              >
                <View style={styles.integrationIconBox}>
                  {item.icon === 'sms' && <SmsChatIcon />}
                  {item.icon === 'email' && <EmailEnvelopeIcon />}
                  {item.icon === 'payment' && <PaymentCardIcon />}
                  {item.icon === 'gst' && <GstTaxInvoiceIcon />}
                  {item.icon === 'cloud' && <CloudStorageIcon />}
                  {item.icon === 'api' && <HubIntegrationIcon />}
                </View>

                <View style={styles.integrationTextBox}>
                  <Text style={styles.integrationCardTitle}>{item.name}</Text>
                  <Text style={styles.integrationCardSubtitle}>{item.subtitle}</Text>
                </View>

                <View
                  style={[
                    styles.statusPill,
                    isConnected ? styles.statusPillConnected : styles.statusPillDisconnected,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      isConnected ? styles.statusTextConnected : styles.statusTextDisconnected,
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>

                <ChevronRightIcon />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SCREEN 7: ADD INTEGRATION (Image 1 & 2 in this chat)
  // ─────────────────────────────────────────────────────────────────────────────
  if (currentScreen === 'add_integration') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={() => setCurrentScreen('integration_keys')}
            activeOpacity={0.75}
          >
            <ArrowBackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Integration</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Basic Details */}
          <Text style={styles.sectionHeaderTitle}>1. Basic Details</Text>
          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>Service name *</Text>
            <TextInput
              style={styles.textInputBox}
              placeholder="enter service name."
              placeholderTextColor={adminColors.placeholder}
              value={formServiceName}
              onChangeText={setFormServiceName}
            />

            <Text style={[styles.fieldLabel, { marginTop: adminSpacing.md }]}>
              Integration Type *
            </Text>
            <TouchableOpacity
              style={styles.selectInput}
              activeOpacity={0.8}
              onPress={() =>
                setActiveDropdown({
                  title: 'Select Integration Type',
                  options: [
                    'SMS Service',
                    'Email Service',
                    'Payment Gateway',
                    'GST / Tax Service',
                    'Cloud Storage',
                    'External REST API',
                  ],
                  selected: formIntegrationType,
                  onSelect: (val) => setFormIntegrationType(val),
                })
              }
            >
              <Text
                style={[
                  styles.selectInputText,
                  formIntegrationType.startsWith('Select') && { color: adminColors.placeholder },
                ]}
              >
                {formIntegrationType}
              </Text>
              <ChevronDownIcon />
            </TouchableOpacity>

            <Text style={[styles.fieldLabel, { marginTop: adminSpacing.md }]}>
              Service Provider *
            </Text>
            <TouchableOpacity
              style={styles.selectInput}
              activeOpacity={0.8}
              onPress={() =>
                setActiveDropdown({
                  title: 'Select Service Provider',
                  options: [
                    'Exotel',
                    'Twilio',
                    'SendGrid',
                    'RazorpayX',
                    'ClearTax',
                    'AWS S3',
                    'Google Cloud Storage',
                  ],
                  selected: formServiceProvider,
                  onSelect: (val) => setFormServiceProvider(val),
                })
              }
            >
              <Text
                style={[
                  styles.selectInputText,
                  formServiceProvider.startsWith('Select') && { color: adminColors.placeholder },
                ]}
              >
                {formServiceProvider}
              </Text>
              <ChevronDownIcon />
            </TouchableOpacity>
          </View>

          {/* 2. Configuration */}
          <Text style={[styles.sectionHeaderTitle, { marginTop: adminSpacing.xl }]}>
            2. Configuration
          </Text>
          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>API Endpoint *</Text>
            <View style={styles.inputWithLeadingIcon}>
              <GlobeIcon />
              <TextInput
                style={styles.textInputInner}
                value={formApiEndpoint}
                onChangeText={setFormApiEndpoint}
                placeholder="https://api.example.com/v1"
                placeholderTextColor={adminColors.placeholder}
                autoCapitalize="none"
              />
            </View>

            <Text style={[styles.fieldLabel, { marginTop: adminSpacing.md }]}>
              API Key / Client Secret *
            </Text>
            <View style={styles.inputWithLeadingIcon}>
              <KeyIcon />
              <TextInput
                style={styles.textInputInner}
                value={formApiKey}
                onChangeText={setFormApiKey}
                secureTextEntry
                placeholder="******************"
                placeholderTextColor={adminColors.placeholder}
              />
              <EyeOffIcon />
            </View>

            <Text style={[styles.fieldLabel, { marginTop: adminSpacing.md }]}>Sender ID *</Text>
            <View style={styles.inputWithLeadingIcon}>
              <ChatBubbleIcon />
              <TextInput
                style={styles.textInputInner}
                value={formSenderId}
                onChangeText={setFormSenderId}
                placeholder="Enter sender ID (e.g., TOHFA)"
                placeholderTextColor={adminColors.placeholder}
              />
            </View>
            <Text style={styles.fieldHelpText}>ⓘ Required for SMS Service only.</Text>

            <Text style={[styles.fieldLabel, { marginTop: adminSpacing.md }]}>
              Webhook URL (Optional) *
            </Text>
            <View style={styles.inputWithLeadingIcon}>
              <LinkChainIcon />
              <TextInput
                style={styles.textInputInner}
                value={formWebhookUrl}
                onChangeText={setFormWebhookUrl}
                placeholder="https://yourdomain.com/webhook"
                placeholderTextColor={adminColors.placeholder}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* 3. Settings */}
          <Text style={[styles.sectionHeaderTitle, { marginTop: adminSpacing.xl }]}>
            3. Settings
          </Text>
          <View style={styles.formGroup}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View>
                <Text style={styles.switchLabel}>Active</Text>
                <Text style={styles.switchSubLabel}>
                  Enable this integration to make it available for use.
                </Text>
              </View>
              <Switch
                value={formIsActive}
                onValueChange={setFormIsActive}
                trackColor={{ false: adminColors.border, true: adminColors.brand }}
                thumbColor={adminColors.card}
              />
            </View>
          </View>

          {/* 4. Allowed Uses */}
          <Text style={[styles.sectionHeaderTitle, { marginTop: adminSpacing.xl }]}>
            4. Allowed Uses *
          </Text>
          <View style={styles.formGroup}>
            {[
              'OTP / Verification',
              'System Alerts',
              'Marketing Messages',
              'Payment Notifications',
              'Data  Sync',
            ].map((u) => {
              const checked = formAllowedUses.includes(u);
              return (
                <TouchableOpacity
                  key={u}
                  style={[styles.checkboxItem, { paddingVertical: 6 }]}
                  activeOpacity={0.8}
                  onPress={() => toggleFormAllowedUse(u)}
                >
                  <View style={[styles.checkboxBox, checked && styles.checkboxBoxActive]}>
                    {checked && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>{u}</Text>
                </TouchableOpacity>
              );
            })}

            {/* Role access notice box */}
            <View style={styles.roleAccessBox}>
              <LockSecurityIcon />
              <Text style={styles.roleAccessText}>
                Role access is controlled by assigned permissions.
              </Text>
            </View>
          </View>

          {/* Bottom Dual Action Bar */}
          <View style={styles.configBottomRow}>
            <TouchableOpacity
              style={styles.resetButton}
              activeOpacity={0.8}
              onPress={() => setCurrentScreen('integration_keys')}
            >
              <Text style={styles.resetButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveButton}
              activeOpacity={0.8}
              onPress={() => {
                if (!formServiceName.trim()) {
                  Alert.alert('Required', 'Please enter a valid service name.');
                  return;
                }
                const newIntegration: IntegrationKeyItem = {
                  id: `int-${Date.now()}`,
                  name: formServiceName,
                  subtitle: formIntegrationType,
                  icon: formIntegrationType.includes('SMS')
                    ? 'sms'
                    : formIntegrationType.includes('Email')
                      ? 'email'
                      : 'api',
                  status: formIsActive ? 'Connected' : 'Not Connected',
                  provider: formServiceProvider,
                  apiEndpoint: formApiEndpoint,
                  senderId: formSenderId,
                  allowedUses: formAllowedUses,
                  maintenanceMode: false,
                };
                setIntegrations((prev) => [newIntegration, ...prev]);
                Alert.alert(
                  'Integration Created',
                  `Service "${formServiceName}" created successfully.`,
                );
                setCurrentScreen('integration_keys');
              }}
            >
              <Text style={styles.saveButtonText}>Save Integration</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {renderDropdownModal()}
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SCREEN 8: INTEGRATION DETAIL & TEST CONNECTION (Image 3 in this chat)
  // ─────────────────────────────────────────────────────────────────────────────
  if (currentScreen === 'integration_detail' && selectedIntegration) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={() => setCurrentScreen('integration_keys')}
            activeOpacity={0.75}
          >
            <ArrowBackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{selectedIntegration.name}</Text>
          <TouchableOpacity
            style={{ padding: 6 }}
            activeOpacity={0.8}
            onPress={() => {
              setFormServiceName(selectedIntegration.name);
              setFormServiceProvider(selectedIntegration.provider ?? 'Exotel');
              setFormApiEndpoint(selectedIntegration.apiEndpoint ?? 'https://api.exotel.com/v1');
              setFormSenderId(selectedIntegration.senderId ?? 'TOHFA');
              setFormApiKey('******************');
              setFormIsActive(selectedIntegration.status === 'Connected');
              setFormAllowedUses(selectedIntegration.allowedUses ?? ['OTP / Verification']);
              setCurrentScreen('edit_integration');
            }}
          >
            <PencilWhiteIcon />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Integration Details */}
          <Text style={styles.sectionHeaderTitle}>1. Integration Details</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Service Provider</Text>
              <Text style={[styles.detailValue, { fontWeight: '600' }]}>
                {selectedIntegration.provider ?? 'Exotel'}
              </Text>
            </View>
            <View style={styles.detailDivider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Integration Key</Text>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                activeOpacity={0.7}
                onPress={() =>
                  handleCopyLogId(selectedIntegration.apiKey ?? 'sk_live_98371928472918')
                }
              >
                <Text style={styles.detailValue}>sk_live_****************</Text>
                <CopyIcon />
              </TouchableOpacity>
            </View>
            <View style={styles.detailDivider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Sender ID</Text>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                activeOpacity={0.7}
                onPress={() => handleCopyLogId(selectedIntegration.senderId ?? 'TOHFA')}
              >
                <Text style={[styles.detailValue, { fontWeight: '600' }]}>
                  {selectedIntegration.senderId ?? 'TOHFA'}
                </Text>
                <CopyIcon />
              </TouchableOpacity>
            </View>
            <View style={styles.detailDivider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>API Endpoint</Text>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                activeOpacity={0.7}
                onPress={() =>
                  handleCopyLogId(selectedIntegration.apiEndpoint ?? 'https://api.exotel.com/v1')
                }
              >
                <Text style={styles.detailValue}>
                  {selectedIntegration.apiEndpoint ?? 'https://api.exotel.com/v1'}
                </Text>
                <CopyIcon />
              </TouchableOpacity>
            </View>
            <View style={styles.detailDivider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Created On</Text>
              <Text style={styles.detailValue}>
                {selectedIntegration.createdOn ?? '15 Sep 2026, 11:20 AM'}
              </Text>
            </View>
            <View style={styles.detailDivider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Last Used</Text>
              <Text style={styles.detailValue}>
                {selectedIntegration.lastUsed ?? '27 Oct 2026, 04:36 PM'}
              </Text>
            </View>
          </View>

          {/* 1. Configuration */}
          <Text style={[styles.sectionHeaderTitle, { marginTop: adminSpacing.xl }]}>
            1. Configuration
          </Text>
          <View style={styles.formGroup}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text style={styles.switchLabel}>System Maintenance Mode</Text>
              <Switch
                value={selectedIntegration.maintenanceMode ?? true}
                onValueChange={(val) => {
                  setSelectedIntegration((prev) =>
                    prev ? { ...prev, maintenanceMode: val } : null,
                  );
                }}
                trackColor={{ false: adminColors.border, true: adminColors.brand }}
                thumbColor={adminColors.card}
              />
            </View>

            <View
              style={{
                height: 1,
                backgroundColor: adminColors.border,
                marginVertical: adminSpacing.md,
              }}
            />

            <Text style={[styles.fieldLabel, { marginBottom: adminSpacing.sm }]}>Allowed Uses</Text>
            {['OTP /Verification', 'System Alerts', 'Marketing Messages'].map((useItem) => {
              const isChecked = (selectedIntegration.allowedUses ?? ['OTP / Verification']).some(
                (u) =>
                  u.toLowerCase().replace(/\s/g, '') === useItem.toLowerCase().replace(/\s/g, ''),
              );
              return (
                <View key={useItem} style={[styles.checkboxItem, { paddingVertical: 4 }]}>
                  <View style={[styles.checkboxBox, isChecked && styles.checkboxBoxActive]}>
                    {isChecked && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>{useItem}</Text>
                </View>
              );
            })}
          </View>

          {/* Testing Connection Progress Card (shown when testing) */}
          {isTestingConnection && (
            <View style={styles.testingCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: adminSpacing.sm }}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke={adminColors.success.text}
                    strokeWidth="2.5"
                    strokeDasharray="30 15"
                  />
                </Svg>
                <Text style={styles.testingTitle}>Testing Connection...</Text>
              </View>
              <Text style={styles.testingSubtitle}>
                Please wait, we're verifying the integration.
              </Text>

              {/* Progress Bar (60%) */}
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${testProgress}%` }]} />
              </View>
            </View>
          )}

          {/* Bottom Actions */}
          {!isTestingConnection ? (
            <View style={styles.configBottomRow}>
              <TouchableOpacity
                style={styles.testConnectionOutlineBtn}
                activeOpacity={0.8}
                onPress={() => {
                  setIsTestingConnection(true);
                  setTestProgress(60);
                }}
              >
                <SignalWifiIcon />
                <Text style={styles.testConnectionOutlineBtnText}>Test Connection</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                activeOpacity={0.8}
                onPress={() => {
                  setFormServiceName(selectedIntegration.name);
                  setFormServiceProvider(selectedIntegration.provider ?? 'Exotel');
                  setFormApiEndpoint(
                    selectedIntegration.apiEndpoint ?? 'https://api.exotel.com/v1',
                  );
                  setFormSenderId(selectedIntegration.senderId ?? 'TOHFA');
                  setFormApiKey('******************');
                  setFormIsActive(selectedIntegration.status === 'Connected');
                  setFormAllowedUses(selectedIntegration.allowedUses ?? ['OTP / Verification']);
                  setCurrentScreen('edit_integration');
                }}
              >
                <Text style={styles.saveButtonText}>Edit Integration</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.saveButton, { marginTop: adminSpacing.xl }]}
              activeOpacity={0.8}
              onPress={() => {
                setIsTestingConnection(false);
                Alert.alert(
                  'Connection Verified',
                  `${selectedIntegration.name} is online and operational (Latency: 48ms).`,
                );
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Circle cx="12" cy="12" r="10" stroke={adminColors.onBrand} strokeWidth="2.2" />
                  <Path
                    d="M8 12l3 3 5-5"
                    stroke={adminColors.onBrand}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                <Text style={styles.saveButtonText}>Done</Text>
              </View>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SCREEN 9: EDIT INTEGRATION (Image 4 in this chat)
  // ─────────────────────────────────────────────────────────────────────────────
  if (currentScreen === 'edit_integration' && selectedIntegration) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={() => setCurrentScreen('integration_detail')}
            activeOpacity={0.75}
          >
            <ArrowBackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Integration</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Card */}
          <View style={styles.integrationCard}>
            <View style={styles.integrationIconBox}>
              <SmsChatIcon />
            </View>
            <View style={styles.integrationTextBox}>
              <Text style={styles.integrationCardTitle}>{selectedIntegration.name}</Text>
              <Text style={styles.integrationCardSubtitle}>{selectedIntegration.subtitle}</Text>
            </View>
            <View style={[styles.statusPill, styles.statusPillConnected]}>
              <Text style={[styles.statusPillText, styles.statusTextConnected]}>
                {selectedIntegration.status}
              </Text>
            </View>
          </View>

          {/* Form Fields */}
          <View style={[styles.formGroup, { marginTop: adminSpacing.sm }]}>
            <Text style={styles.fieldLabel}>Service Name *</Text>
            <TextInput
              style={styles.textInputBox}
              value={formServiceName}
              onChangeText={setFormServiceName}
            />

            <Text style={[styles.fieldLabel, { marginTop: adminSpacing.md }]}>
              Service Provider *
            </Text>
            <TouchableOpacity
              style={styles.selectInput}
              activeOpacity={0.8}
              onPress={() =>
                setActiveDropdown({
                  title: 'Select Service Provider',
                  options: ['Exotel', 'Twilio', 'SendGrid', 'RazorpayX', 'ClearTax'],
                  selected: formServiceProvider,
                  onSelect: (val) => setFormServiceProvider(val),
                })
              }
            >
              <Text style={styles.selectInputText}>{formServiceProvider}</Text>
              <ChevronDownIcon />
            </TouchableOpacity>

            <Text style={[styles.fieldLabel, { marginTop: adminSpacing.md }]}>API Key *</Text>
            <View style={styles.inputWithLeadingIcon}>
              <TextInput
                style={styles.textInputInner}
                value="sk_live_****************"
                editable={false}
              />
              <EyeOffIcon />
            </View>

            <Text style={[styles.fieldLabel, { marginTop: adminSpacing.md }]}>
              API Key / Client Secret *
            </Text>
            <View style={{ flexDirection: 'row', gap: adminSpacing.sm, alignItems: 'center' }}>
              <View style={[styles.inputWithLeadingIcon, { flex: 1 }]}>
                <KeyIcon />
                <TextInput
                  style={styles.textInputInner}
                  value="******************"
                  secureTextEntry
                  editable={false}
                />
                <EyeOffIcon />
              </View>

              <TouchableOpacity
                style={styles.regenerateBtn}
                activeOpacity={0.8}
                onPress={() => {
                  Alert.alert(
                    'Regenerate Key',
                    'Are you sure you want to regenerate this API key? The previous key will be immediately revoked.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Regenerate',
                        style: 'destructive',
                        onPress: () =>
                          Alert.alert('Success', 'New integration secret generated and saved.'),
                      },
                    ],
                  );
                }}
              >
                <RegenerateIcon />
                <Text style={styles.regenerateBtnText}>Regenerate</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.fieldHelpText}>
              ⓘ A new key will revoke the previous key instantly.
            </Text>

            <Text style={[styles.fieldLabel, { marginTop: adminSpacing.md }]}>Sender ID *</Text>
            <View style={styles.inputWithLeadingIcon}>
              <ChatBubbleIcon />
              <TextInput
                style={styles.textInputInner}
                value={formSenderId}
                onChangeText={setFormSenderId}
              />
            </View>

            <Text style={[styles.fieldLabel, { marginTop: adminSpacing.md }]}>API Endpoint *</Text>
            <View style={styles.inputWithLeadingIcon}>
              <LinkChainIcon />
              <TextInput
                style={styles.textInputInner}
                value={formApiEndpoint}
                onChangeText={setFormApiEndpoint}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Active</Text>
              <Switch
                value={formIsActive}
                onValueChange={setFormIsActive}
                trackColor={{ false: adminColors.border, true: adminColors.brand }}
                thumbColor={adminColors.card}
              />
            </View>

            <Text style={[styles.fieldLabel, { marginTop: adminSpacing.md }]}>Allowed Uses *</Text>
            {[
              'OTP / Verification',
              'System Alerts',
              'Marketing Messages',
              'Payment Notifications',
              'Data  Sync',
            ].map((u) => {
              const checked = formAllowedUses.includes(u);
              return (
                <TouchableOpacity
                  key={u}
                  style={[styles.checkboxItem, { paddingVertical: 5 }]}
                  activeOpacity={0.8}
                  onPress={() => toggleFormAllowedUse(u)}
                >
                  <View style={[styles.checkboxBox, checked && styles.checkboxBoxActive]}>
                    {checked && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>{u}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Bottom Dual Action Bar */}
          <View style={styles.configBottomRow}>
            <TouchableOpacity
              style={styles.resetButton}
              activeOpacity={0.8}
              onPress={() => setCurrentScreen('integration_detail')}
            >
              <Text style={styles.resetButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveButton}
              activeOpacity={0.8}
              onPress={() => {
                setIntegrations((prev) =>
                  prev.map((i) =>
                    i.id === selectedIntegration.id
                      ? {
                          ...i,
                          name: formServiceName,
                          provider: formServiceProvider,
                          apiEndpoint: formApiEndpoint,
                          senderId: formSenderId,
                          status: formIsActive ? 'Connected' : 'Not Connected',
                          allowedUses: formAllowedUses,
                        }
                      : i,
                  ),
                );
                setSelectedIntegration((prev) =>
                  prev
                    ? {
                        ...prev,
                        name: formServiceName,
                        provider: formServiceProvider,
                        apiEndpoint: formApiEndpoint,
                        senderId: formSenderId,
                        status: formIsActive ? 'Connected' : 'Not Connected',
                        allowedUses: formAllowedUses,
                      }
                    : null,
                );
                Alert.alert(
                  'Integration Updated',
                  `${formServiceName} settings saved successfully.`,
                );
                setCurrentScreen('integration_detail');
              }}
            >
              <Text style={styles.saveButtonText}>Save Integration</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {renderDropdownModal()}
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SCREEN 10: EMERGENCY DATABASE EXPORT (Image 5 in this chat)
  // ─────────────────────────────────────────────────────────────────────────────
  if (currentScreen === 'emergency_export') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={() => setCurrentScreen('hub')}
            activeOpacity={0.75}
          >
            <ArrowBackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Emergency Database Export</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Warning Box */}
          <View style={styles.emergencyWarningBox}>
            <WarningTriangleIcon color={adminColors.brand} />
            <Text style={styles.emergencyWarningText}>
              This will export the complete raw database. Use only for emergency, audit or
              client-approved requests.
            </Text>
          </View>

          {/* 1. Export */}
          <Text style={[styles.sectionHeaderTitle, { marginTop: adminSpacing.lg }]}>1. Export</Text>
          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>Export Reason*</Text>
            <TouchableOpacity
              style={styles.selectInput}
              activeOpacity={0.8}
              onPress={() =>
                setActiveDropdown({
                  title: 'Select Export Reason',
                  options: [
                    'Audit Compliance',
                    'Emergency Server Migration',
                    'Disaster Recovery Backup',
                    'External Security Review',
                  ],
                  selected: exportReason,
                  onSelect: (val) => setExportReason(val),
                })
              }
            >
              <Text
                style={[
                  styles.selectInputText,
                  exportReason.startsWith('Select') && { color: adminColors.placeholder },
                ]}
              >
                {exportReason}
              </Text>
              <ChevronDownIcon />
            </TouchableOpacity>

            <Text style={[styles.fieldLabel, { marginTop: adminSpacing.md }]}>
              Additional Details *
            </Text>
            <TextInput
              style={styles.multiLineTextArea}
              multiline
              numberOfLines={4}
              maxLength={250}
              placeholder="Enter context, authorization ticket ID, or audit scope."
              placeholderTextColor={adminColors.placeholder}
              value={exportAdditionalDetails}
              onChangeText={setExportAdditionalDetails}
            />
            <Text style={styles.charCountText}>{exportAdditionalDetails.length} / 250</Text>
          </View>

          {/* 2. Export Options */}
          <Text style={[styles.sectionHeaderTitle, { marginTop: adminSpacing.xl }]}>
            2. Export Options
          </Text>
          <View style={styles.formGroup}>
            {[
              'Full Database (Recommended)',
              'Date Only (Without System Files)',
              'Include Logs',
              'Compress (ZIP)',
            ].map((opt) => {
              const isChecked = exportOptionsSelected.includes(opt);
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.checkboxItem, { paddingVertical: 6 }]}
                  activeOpacity={0.8}
                  onPress={() => toggleExportOption(opt)}
                >
                  <View style={[styles.checkboxBox, isChecked && styles.checkboxBoxActive]}>
                    {isChecked && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>{opt}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Bottom Action Button */}
          <TouchableOpacity
            style={[styles.saveButton, { marginTop: adminSpacing.xl, height: 50 }]}
            activeOpacity={0.8}
            onPress={() => {
              if (exportReason.startsWith('Select')) {
                Alert.alert('Required', 'Please select an export reason.');
                return;
              }
              Alert.alert(
                'Confirm Emergency Database Dump',
                `Export Reason: ${exportReason}\nOptions: ${exportOptionsSelected.join(', ')}\n\nA secure encrypted archive will be generated and signed with your Super Admin key. Proceed?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Confirm & Export',
                    style: 'destructive',
                    onPress: () => {
                      Alert.alert(
                        'Database Export Generated',
                        'Raw database archive encrypted and downloaded successfully. High-priority audit record logged.',
                      );
                      setCurrentScreen('hub');
                    },
                  },
                ],
              );
            }}
          >
            <Text style={styles.saveButtonText}>Export Database</Text>
          </TouchableOpacity>
        </ScrollView>

        {renderDropdownModal()}
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // REUSABLE DROPDOWN MODAL
  // ─────────────────────────────────────────────────────────────────────────────
  function renderDropdownModal() {
    if (!activeDropdown) return null;
    return (
      <Modal
        visible
        transparent
        animationType="fade"
        onRequestClose={() => setActiveDropdown(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActiveDropdown(null)}
        >
          <View style={styles.dropdownModalCard}>
            <Text style={styles.dropdownModalTitle}>{activeDropdown.title}</Text>
            {activeDropdown.options.map((opt) => {
              const isSelected = activeDropdown.selected === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.dropdownOptionRow, isSelected && styles.dropdownOptionRowActive]}
                  activeOpacity={0.75}
                  onPress={() => {
                    activeDropdown.onSelect(opt);
                    setActiveDropdown(null);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownOptionText,
                      isSelected && styles.dropdownOptionTextActive,
                    ]}
                  >
                    {opt}
                  </Text>
                  {isSelected && (
                    <Text style={{ color: adminColors.brand, fontWeight: '700' }}>✓</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    );
  }

  return <View />;
}

// ─── Stylesheet ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 12,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...adminShadow.sm,
  },
  headerBackBtn: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    includeFontPadding: false,
    textAlign: 'left',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xxl * 1.5,
  },
  sectionHeaderTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: adminSpacing.md,
  },

  // Hub Cards
  hubCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  hubIconBox: {
    width: 44,
    height: 44,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: adminSpacing.md,
  },
  hubTextBox: {
    flex: 1,
    paddingRight: adminSpacing.xs,
  },
  hubCardTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  hubCardSubtitle: {
    ...adminType.body,
    color: adminColors.muted,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },

  // Form Fields
  formGroup: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  fieldLabel: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '600',
    fontSize: 13,
    marginBottom: adminSpacing.xs,
  },
  textInputBox: {
    height: 46,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    paddingHorizontal: adminSpacing.md,
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 14,
  },
  selectInput: {
    height: 46,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    paddingHorizontal: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectInputText: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 14,
  },
  inputWithLeadingIcon: {
    height: 46,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  inputWithSuffix: {
    height: 46,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.md,
  },
  textInputInner: {
    flex: 1,
    height: 46,
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 14,
  },
  suffixText: {
    ...adminType.body,
    color: adminColors.muted,
    fontWeight: '600',
    fontSize: 14,
  },
  fieldHelpText: {
    ...adminType.body,
    color: adminColors.muted,
    fontSize: 12,
    marginTop: 6,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: adminSpacing.md,
    marginTop: adminSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  switchLabel: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '600',
    fontSize: 13,
  },
  switchSubLabel: {
    ...adminType.body,
    color: adminColors.muted,
    fontSize: 12,
    marginTop: 1,
  },

  // Checkboxes
  checkboxGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xl,
    marginTop: adminSpacing.xs,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: adminRadius.sm,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxActive: {
    borderColor: adminColors.brand,
    backgroundColor: adminColors.brand,
  },
  checkmark: {
    color: adminColors.onBrand,
    fontSize: 12,
    fontWeight: '800',
  },
  checkboxLabel: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 13,
  },

  // Role Access Notice Box
  roleAccessBox: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    marginTop: adminSpacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  roleAccessText: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },

  // Dual Buttons Row
  configBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
    marginTop: adminSpacing.xl,
  },
  resetButton: {
    flex: 1,
    height: 46,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    height: 46,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
    fontSize: 14,
    fontWeight: '700',
  },

  // Audit Log List
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.md,
  },
  filterBarTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    fontSize: 14,
    fontWeight: '700',
  },
  clearAllText: {
    ...adminType.body,
    color: adminColors.brand,
    fontWeight: '600',
    fontSize: 13,
  },
  logCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  logIconBox: {
    width: 42,
    height: 42,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: adminSpacing.md,
  },
  logTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  logTimestamp: {
    ...adminType.body,
    color: adminColors.muted,
    fontSize: 11,
  },
  logSubtitle: {
    ...adminType.body,
    color: adminColors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  moreDotsBtn: {
    padding: adminSpacing.xs,
    marginLeft: adminSpacing.sm,
  },

  // 3-dots Menu Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.xl,
  },
  menuPopupCard: {
    width: '85%',
    maxWidth: 280,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingVertical: adminSpacing.sm,
    ...adminShadow.md,
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
  },
  menuItemText: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 14,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginHorizontal: adminSpacing.md,
  },

  // Log Details Screen
  detailCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: adminSpacing.xs,
  },
  detailLabel: {
    ...adminType.body,
    color: adminColors.muted,
    fontSize: 13,
  },
  detailValue: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 13,
    fontWeight: '500',
  },
  detailDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: adminSpacing.xs,
  },
  changeSubhead: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '600',
    fontSize: 13,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: adminColors.brand,
  },
  bulletKey: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '600',
    fontSize: 13,
    width: 80,
  },
  bulletVal: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 13,
  },
  logDetailBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
    marginTop: adminSpacing.xl,
  },
  downloadOutlineBtn: {
    flex: 1,
    height: 46,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.brand,
    backgroundColor: adminColors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  downloadOutlineBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brand,
    fontSize: 12,
    fontWeight: '700',
  },
  downloadSolidBtn: {
    flex: 1,
    height: 46,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  downloadSolidBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
    fontSize: 12,
    fontWeight: '700',
  },

  // Integration Keys Cards
  integrationCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  integrationIconBox: {
    width: 44,
    height: 44,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: adminSpacing.md,
  },
  integrationTextBox: {
    flex: 1,
    paddingRight: adminSpacing.xs,
  },
  integrationCardTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  integrationCardSubtitle: {
    ...adminType.body,
    color: adminColors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 4,
    borderRadius: adminRadius.full,
    marginRight: adminSpacing.sm,
  },
  statusPillConnected: {
    backgroundColor: '#E6F8EF',
  },
  statusPillDisconnected: {
    backgroundColor: '#FDECEE',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextConnected: {
    color: '#0D824B',
  },
  statusTextDisconnected: {
    color: '#D92D20',
  },

  // Test Connection Progress Card
  testingCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    marginTop: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  testingTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  testingSubtitle: {
    ...adminType.body,
    color: adminColors.muted,
    fontSize: 12,
    marginTop: 4,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.border,
    marginTop: adminSpacing.md,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: adminColors.success.text,
    borderRadius: adminRadius.full,
  },
  testConnectionOutlineBtn: {
    flex: 1,
    height: 46,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  testConnectionOutlineBtnText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontSize: 13,
    fontWeight: '600',
  },
  regenerateBtn: {
    height: 46,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  regenerateBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
    fontSize: 13,
    fontWeight: '700',
  },

  // Emergency Database Export
  emergencyWarningBox: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    flexDirection: 'row',
    gap: adminSpacing.md,
    alignItems: 'flex-start',
  },
  emergencyWarningText: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
    fontWeight: '500',
  },
  multiLineTextArea: {
    height: 100,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    padding: adminSpacing.md,
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  charCountText: {
    ...adminType.body,
    color: adminColors.muted,
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },

  // Dropdown Selection Modal
  dropdownModalCard: {
    width: '85%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    ...adminShadow.md,
  },
  dropdownModalTitle: {
    ...adminType.title,
    color: adminColors.ink,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: adminSpacing.md,
  },
  dropdownOptionRow: {
    paddingVertical: adminSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownOptionRowActive: {
    backgroundColor: adminColors.brandTint,
    paddingHorizontal: adminSpacing.sm,
    borderRadius: adminRadius.sm,
  },
  dropdownOptionText: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 14,
  },
  dropdownOptionTextActive: {
    color: adminColors.brand,
    fontWeight: '700',
  },
});
