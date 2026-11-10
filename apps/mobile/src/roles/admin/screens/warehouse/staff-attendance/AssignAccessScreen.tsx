/**
 * Assign & Access Screen (Matching Image 2, Image 3, Image 4, Image 5)
 * Manages admin user role assignment and 19 module permissions:
 * - 5-column table: #, Module, Permissions, Access, Expiry
 * - Permissions dropdown menu matching Image 4
 * - Permission Access modal (Permanent vs Time-bound) matching Image 5
 * Strictly adheres to Admin Design Tokens.
 */
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
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import { adminColors, adminShadow, adminSpacing, adminType } from '../../../theme';
import type { WarehouseScreenBaseProps } from './types';

export interface AssignAccessScreenProps extends WarehouseScreenBaseProps {
  role?: string | undefined;
  initialRoleName?: string | undefined;
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function BackArrowWhiteIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={adminColors.onBrand}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronDownIcon({ color = adminColors.ink }: { color?: string }) {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9l6 6 6-6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CloseIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#9CA3AF" strokeWidth="1.8" />
      <Path
        d="M15 9l-6 6M9 9l6 6"
        stroke="#9CA3AF"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function CalendarCheckGreenIcon() {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3"
        y="4"
        width="18"
        height="18"
        rx="2"
        stroke="#10B981"
        strokeWidth="1.8"
      />
      <Path
        d="M16 2v4M8 2v4M3 10h18"
        stroke="#10B981"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Path
        d="M9 15l2 2 4-4"
        stroke="#10B981"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CalendarBlueSmallIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3"
        y="4"
        width="18"
        height="18"
        rx="2"
        stroke="#1E429F"
        strokeWidth="1.8"
      />
      <Path
        d="M16 2v4M8 2v4M3 10h18"
        stroke="#1E429F"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function CalendarIcon({ color = adminColors.muted }: { color?: string | undefined } = {}) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3"
        y="4"
        width="18"
        height="18"
        rx="2"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path
        d="M16 2v4M8 2v4M3 10h18"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ClockIcon({ color = adminColors.muted }: { color?: string | undefined } = {}) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Path d="M12 7v5l3 2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Module Icons Matching Image 3 ────────────────────────────────────────────

function ModuleIcon({ type }: { type: string }) {
  const color = adminColors.brand;
  switch (type) {
    case 'grid':
      return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Rect x="3" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.8" />
          <Rect x="14" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.8" />
          <Rect x="14" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.8" />
          <Rect x="3" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.8" />
        </Svg>
      );
    case 'users':
      return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Circle cx="9" cy="7" r="3.5" stroke={color} strokeWidth="1.8" />
          <Path d="M16 11a3 3 0 00-3-3M3 20c0-3 2.5-5 6-5s6 2 6 5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </Svg>
      );
    case 'produce':
      return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Circle cx="6" cy="17" r="3" stroke={color} strokeWidth="1.8" />
          <Circle cx="18" cy="15" r="5" stroke={color} strokeWidth="1.8" />
          <Path d="M9 17h4M12 9h4l2 6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </Svg>
      );
    case 'audit':
      return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="1.8" />
          <Path d="M16 2v4M8 2v4M3 10h18M8 14l2 2 4-4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'leaf':
      return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Path d="M12 21a9 9 0 009-9c0-6-9-9-9-9s-9 3-9 9a9 9 0 009 9z" stroke={color} strokeWidth="1.8" />
          <Path d="M12 21V12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </Svg>
      );
    case 'rupee':
      return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
          <Path d="M8 7h8M8 11h5a2.5 2.5 0 000-5H8M8 11l6 6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </Svg>
      );
    case 'store':
      return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Path d="M3 9l2-5h14l2 5M3 9h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
          <Path d="M3 9c0 1.5 1.5 2.5 3 2.5s3-1 3-2.5c0 1.5 1.5 2.5 3 2.5s3-1 3-2.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
        </Svg>
      );
    case 'cart':
      return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Circle cx="9" cy="20" r="1.5" fill={color} />
          <Circle cx="18" cy="20" r="1.5" fill={color} />
          <Path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'sales':
      return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Path d="M4 7h16v13a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
          <Path d="M8 7V4a2 2 0 012-2h4a2 2 0 012 2v3M9 12h6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </Svg>
      );
    case 'warehouse':
      return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Path d="M3 21h18M3 9l9-5 9 5v12H3V9z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
          <Path d="M9 21v-7h6v7" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
        </Svg>
      );
    case 'finance':
      return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
          <Path d="M12 6v12M15 9.5a2.5 2.5 0 00-2.5-2.5h-1a2.5 2.5 0 000 5h1a2.5 2.5 0 010 5h-1A2.5 2.5 0 019 14.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </Svg>
      );
    case 'invoice':
      return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Rect x="4" y="3" width="16" height="18" rx="2" stroke={color} strokeWidth="1.8" />
          <Line x1="8" y1="8" x2="16" y2="8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <Line x1="8" y1="12" x2="16" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <Line x1="8" y1="16" x2="12" y2="16" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </Svg>
      );
    case 'returns':
      return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Path d="M3 10h10a5 5 0 015 5v2M3 10l5-5M3 10l5 5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'bell':
      return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'id_card':
      return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth="1.8" />
          <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth="1.6" />
          <Path d="M7 18c0-2 2-3.5 5-3.5s5 1.5 5 3.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
        </Svg>
      );
    case 'document':
      return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
          <Path d="M14 2v6h6M8 13h8M8 17h5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </Svg>
      );
    case 'gear':
      return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.8" />
          <Path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke={color} strokeWidth="1.6" />
        </Svg>
      );
    default:
      return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="8" stroke={color} strokeWidth="1.8" />
        </Svg>
      );
  }
}

// ─── 19 Module Items Matching Image 3 ─────────────────────────────────────────

export type PermissionLevel =
  | 'View'
  | 'View, Add'
  | 'View, Edit'
  | 'View, Add, Edit'
  | 'View, Update'
  | 'View, Manage'
  | 'View, Create'
  | 'View, Approve'
  | 'View, Export';

export const PERMISSION_OPTIONS: PermissionLevel[] = [
  'View',
  'View, Add',
  'View, Edit',
  'View, Add, Edit',
  'View, Update',
  'View, Manage',
  'View, Create',
  'View, Approve',
  'View, Export',
];

interface ModulePermissionItem {
  id: number;
  name: string;
  iconType: string;
  permission: PermissionLevel;
  enabled: boolean;
  accessType: 'Permanent' | 'Time-bound';
  expiryDate?: string | undefined;
}

const INITIAL_19_MODULES: ModulePermissionItem[] = [
  { id: 1, name: 'Role-based dashboards', iconType: 'grid', permission: 'View', enabled: true, accessType: 'Permanent' },
  { id: 2, name: 'Farmers Management', iconType: 'users', permission: 'View', enabled: true, accessType: 'Permanent' },
  { id: 3, name: 'Produce Control', iconType: 'produce', permission: 'View', enabled: true, accessType: 'Permanent' },
  { id: 4, name: 'Audit Management', iconType: 'audit', permission: 'View', enabled: false, accessType: 'Permanent' },
  { id: 5, name: 'Input & Pest', iconType: 'leaf', permission: 'View', enabled: true, accessType: 'Permanent' },
  { id: 6, name: 'Market & Pricing', iconType: 'rupee', permission: 'View', enabled: true, accessType: 'Permanent' },
  { id: 7, name: 'Market & Pricing', iconType: 'store', permission: 'View', enabled: false, accessType: 'Permanent' },
  { id: 8, name: 'Purchase', iconType: 'cart', permission: 'View', enabled: false, accessType: 'Permanent' },
  { id: 9, name: 'Sales', iconType: 'sales', permission: 'View', enabled: true, accessType: 'Time-bound', expiryDate: '31 Dec 2026' },
  { id: 10, name: 'Inventory & Warehouse', iconType: 'warehouse', permission: 'View', enabled: false, accessType: 'Permanent' },
  { id: 11, name: 'Accounts & Finance', iconType: 'finance', permission: 'View', enabled: false, accessType: 'Permanent' },
  { id: 12, name: 'Billing & Invoices', iconType: 'invoice', permission: 'View', enabled: true, accessType: 'Time-bound', expiryDate: '31 Dec 2026' },
  { id: 13, name: 'Returns & Issues', iconType: 'returns', permission: 'View', enabled: false, accessType: 'Permanent' },
  { id: 14, name: 'Warehouse Finance', iconType: 'finance', permission: 'View', enabled: false, accessType: 'Permanent' },
  { id: 15, name: 'Reports', iconType: 'document', permission: 'View', enabled: false, accessType: 'Permanent' },
  { id: 16, name: 'Notifications & Reports', iconType: 'bell', permission: 'View', enabled: true, accessType: 'Time-bound', expiryDate: '31 Dec 2026' },
  { id: 17, name: 'Workforce & Staff', iconType: 'id_card', permission: 'View', enabled: false, accessType: 'Permanent' },
  { id: 18, name: 'Warehouse Management', iconType: 'warehouse', permission: 'View', enabled: false, accessType: 'Permanent' },
  { id: 19, name: 'Settings & Profile', iconType: 'gear', permission: 'View', enabled: true, accessType: 'Permanent' },
];

export function AssignAccessScreen({
  onBack,
  initialRoleName = 'Farmer Admin',
}: AssignAccessScreenProps) {
  const [selectedUser, setSelectedUser] = useState('Meena V (meen.v@tohfa.org)');
  const [assignedRole, setAssignedRole] = useState(initialRoleName);
  const [roleType, setRoleType] = useState('Permanant');
  const [modules, setModules] = useState<ModulePermissionItem[]>(INITIAL_19_MODULES);
  const [selectAll, setSelectAll] = useState(false);

  // Pickers & Modals
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);

  // Active module for Permission Level Dropdown Modal (Image 4)
  const [activeModuleForPerm, setActiveModuleForPerm] = useState<ModulePermissionItem | null>(null);

  // Active module for Permission Access Modal (Image 5)
  const [activeModuleForAccess, setActiveModuleForAccess] = useState<ModulePermissionItem | null>(null);
  const [accessMode, setAccessMode] = useState<'Permanent' | 'Time-bound'>('Permanent');
  const [expiryDate, setExpiryDate] = useState('20 Oct 2026');
  const [reminder, setReminder] = useState('Notify before 1 days');
  const [expiryTime, setExpiryTime] = useState('After 1 Hour');
  const [reason, setReason] = useState('');

  // When turning switch ON, open Permission Access Modal (Image 5)
  const handleToggleSwitch = (m: ModulePermissionItem, nextValue: boolean) => {
    if (nextValue) {
      setModules((prev) => prev.map((item) => (item.id === m.id ? { ...item, enabled: true } : item)));
      setActiveModuleForAccess(m);
      setAccessMode(m.accessType || 'Permanent');
      setReason('');
    } else {
      setModules((prev) => prev.map((item) => (item.id === m.id ? { ...item, enabled: false } : item)));
    }
  };

  const handleSelectAll = () => {
    const nextVal = !selectAll;
    setSelectAll(nextVal);
    setModules((prev) => prev.map((m) => ({ ...m, enabled: nextVal })));
  };

  const handleOpenAccessModal = (m: ModulePermissionItem) => {
    setActiveModuleForAccess(m);
    setAccessMode(m.accessType || 'Permanent');
    setReason('');
  };

  const handleApplyAccess = () => {
    if (activeModuleForAccess) {
      setModules((prev) =>
        prev.map((m) =>
          m.id === activeModuleForAccess.id
            ? {
                ...m,
                enabled: true,
                accessType: accessMode,
                expiryDate: accessMode === 'Time-bound' ? '31 Dec 2026' : undefined,
              }
            : m
        )
      );
    }
    setActiveModuleForAccess(null);
  };

  const handleSave = () => {
    Alert.alert(
      'Access Permissions Saved',
      'Permissions for ' + selectedUser + ' as ' + assignedRole + ' have been updated successfully.',
      [{ text: 'OK', onPress: onBack }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <BackArrowWhiteIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assign & Access</Text>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Select Admin User */}
        <Text style={styles.fieldLabel}>
          Select Admin User <Text style={styles.asterisk}>*</Text>
        </Text>
        <TouchableOpacity
          style={styles.dropdownSelector}
          onPress={() => setShowUserPicker(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.dropdownText}>{selectedUser}</Text>
          <ChevronDownIcon color={adminColors.muted} />
        </TouchableOpacity>

        {/* Two Columns: Assign Role & Type */}
        <View style={styles.twoColRow}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.fieldLabel}>
              Assign Role <Text style={styles.asterisk}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.dropdownSelector}
              onPress={() => setShowRolePicker(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownText}>{assignedRole}</Text>
              <ChevronDownIcon color={adminColors.muted} />
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.fieldLabel}>
              Assign Role <Text style={styles.asterisk}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.dropdownSelector}
              onPress={() => setShowTypePicker(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownText}>{roleType}</Text>
              <ChevronDownIcon color={adminColors.muted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Card: Module Permissions (16 Modules) */}
        <View style={styles.moduleCard}>
          <View style={styles.moduleHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <ModuleIcon type="grid" />
              <Text style={styles.moduleSectionTitle}>
                Module Permissions <Text style={styles.moduleCount}>(16 Modules)</Text>
              </Text>
            </View>

            <TouchableOpacity
              style={styles.selectAllRow}
              onPress={handleSelectAll}
              activeOpacity={0.8}
            >
              <Text style={styles.selectAllLabel}>Select: </Text>
              <View style={[styles.checkbox, selectAll && styles.checkboxActive]}>
                {selectAll && <View style={styles.checkboxInner} />}
              </View>
              <Text style={styles.selectAllText}>All</Text>
            </TouchableOpacity>
          </View>

          {/* 5-Column Table Header Matching Image 3 */}
          <View style={styles.tableHeadRow}>
            <Text style={[styles.thText, { width: 22 }]}>#</Text>
            <Text style={[styles.thText, { flex: 1 }]}>Module</Text>
            <Text style={[styles.thText, { width: 78, textAlign: 'center' }]}>Permissions</Text>
            <Text style={[styles.thText, { width: 52, textAlign: 'center' }]}>Access</Text>
            <Text style={[styles.thText, { width: 80, textAlign: 'center' }]}>Expiry</Text>
          </View>

          {/* Table Rows (19 Modules matching Image 3) */}
          {modules.map((m) => (
            <View key={m.id} style={styles.tableRow}>
              {/* Col 1: # */}
              <View style={styles.numBadge}>
                <Text style={styles.numBadgeText}>{m.id}</Text>
              </View>

              {/* Col 2: Module */}
              <View style={styles.moduleInfoCol}>
                <View style={styles.moduleIconBox}>
                  <ModuleIcon type={m.iconType} />
                </View>
                <Text style={styles.moduleNameText} numberOfLines={2}>
                  {m.name}
                </Text>
              </View>

              {/* Col 3: Permissions Dropdown Button */}
              <View style={styles.permCol}>
                <TouchableOpacity
                  style={styles.permDropdown}
                  activeOpacity={0.7}
                  onPress={() => setActiveModuleForPerm(m)}
                >
                  <Text style={styles.permText} numberOfLines={1}>
                    {m.permission}
                  </Text>
                  <ChevronDownIcon color={adminColors.muted} />
                </TouchableOpacity>
              </View>

              {/* Col 4: Access Switch */}
              <View style={styles.accessCol}>
                <Switch
                  value={m.enabled}
                  onValueChange={(val) => handleToggleSwitch(m, val)}
                  trackColor={{ false: '#D1D5DB', true: '#F97316' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {/* Col 5: Expiry Badge / Dash */}
              <View style={styles.expiryCol}>
                {m.enabled ? (
                  <TouchableOpacity
                    onPress={() => handleOpenAccessModal(m)}
                    activeOpacity={0.7}
                  >
                    {m.accessType === 'Time-bound' ? (
                      <View style={styles.pillTimeBound}>
                        <CalendarBlueSmallIcon />
                        <Text style={styles.pillTimeBoundText}>
                          {m.expiryDate || '31 Dec 2026'}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.pillPermanent}>
                        <Text style={styles.pillPermanentText}>Permanent</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.dashText}>-</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Dual Bottom Buttons */}
        <View style={styles.bottomButtonsRow}>
          <TouchableOpacity style={styles.cancelOutlineBtn} onPress={onBack} activeOpacity={0.8}>
            <Text style={styles.cancelOutlineBtnText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveAccessBtn} onPress={handleSave} activeOpacity={0.85}>
            <Text style={styles.saveAccessBtnText}>Save Access</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ─── Modal 1: Permission Access Modal (Image 5 Exact UI) ─── */}
      <Modal visible={activeModuleForAccess !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.accessModalCard}>
            {/* Close Button */}
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setActiveModuleForAccess(null)}
              activeOpacity={0.7}
            >
              <CloseIcon />
            </TouchableOpacity>

            {/* Icon Header */}
            <View style={styles.calendarCircleIconBox}>
              <CalendarCheckGreenIcon />
            </View>

            <Text style={styles.accessModalTitle}>Permission Access</Text>
            <Text style={styles.accessModalSub}>
              Set how long the user can access the selected module(s).
            </Text>

            {/* Radio Selection: Permanent vs Time-bound */}
            <View style={styles.radioRow}>
              <TouchableOpacity
                style={[styles.accessRadioPill, accessMode === 'Permanent' && styles.accessRadioPillActive]}
                onPress={() => setAccessMode('Permanent')}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.radioDotOuter,
                    accessMode === 'Permanent' && styles.radioDotOuterActive,
                  ]}
                >
                  {accessMode === 'Permanent' && <View style={styles.radioDotInner} />}
                </View>
                <Text
                  style={[
                    styles.accessRadioText,
                    accessMode === 'Permanent' && styles.accessRadioTextActive,
                  ]}
                >
                  Permanent Access
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.accessRadioPill, accessMode === 'Time-bound' && styles.accessRadioPillActive]}
                onPress={() => setAccessMode('Time-bound')}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.radioDotOuter,
                    accessMode === 'Time-bound' && styles.radioDotOuterActive,
                  ]}
                >
                  {accessMode === 'Time-bound' && <View style={styles.radioDotInner} />}
                </View>
                <Text
                  style={[
                    styles.accessRadioText,
                    accessMode === 'Time-bound' && styles.accessRadioTextActive,
                  ]}
                >
                  Time-bound Access
                </Text>
              </TouchableOpacity>
            </View>

            {/* Form Fields Card */}
            <View style={styles.timeBoundFormCard}>
              {/* Expiry Date */}
              <Text style={[styles.modalFieldLabel, accessMode === 'Permanent' && styles.modalFieldLabelDisabled]}>
                Expiry Date {accessMode === 'Time-bound' ? <Text style={styles.asterisk}>*</Text> : <Text style={styles.disabledTag}>(Disabled for permanent)</Text>}
              </Text>
              <TouchableOpacity
                style={[styles.modalInputBox, accessMode === 'Permanent' && styles.modalInputBoxDisabled]}
                disabled={accessMode === 'Permanent'}
                activeOpacity={0.7}
                onPress={() => {
                  if (accessMode === 'Time-bound') {
                    setExpiryDate((prev) => (prev === '20 Oct 2026' ? '31 Dec 2026' : '20 Oct 2026'));
                  }
                }}
              >
                <Text style={[styles.modalInputText, accessMode === 'Permanent' && styles.modalInputTextDisabled]}>
                  {accessMode === 'Permanent' ? 'Permanent (No expiry)' : expiryDate}
                </Text>
                <CalendarIcon color={accessMode === 'Permanent' ? '#9CA3AF' : adminColors.brand} />
              </TouchableOpacity>

              {/* Access Reminder */}
              <Text style={[styles.modalFieldLabel, accessMode === 'Permanent' && styles.modalFieldLabelDisabled]}>
                Access Reminder (Optional) {accessMode === 'Permanent' && <Text style={styles.disabledTag}>(Disabled for permanent)</Text>}
              </Text>
              <TouchableOpacity
                style={[styles.modalInputBox, accessMode === 'Permanent' && styles.modalInputBoxDisabled]}
                disabled={accessMode === 'Permanent'}
                activeOpacity={0.7}
                onPress={() => {
                  if (accessMode === 'Time-bound') {
                    setReminder((prev) => (prev === 'Notify before 1 days' ? 'Notify before 2 days' : 'Notify before 1 days'));
                  }
                }}
              >
                <Text style={[styles.modalInputText, accessMode === 'Permanent' && styles.modalInputTextDisabled]}>
                  {accessMode === 'Permanent' ? 'N/A' : reminder}
                </Text>
                <ChevronDownIcon color={accessMode === 'Permanent' ? '#9CA3AF' : adminColors.muted} />
              </TouchableOpacity>

              {/* Expiry Time */}
              <Text style={[styles.modalFieldLabel, accessMode === 'Permanent' && styles.modalFieldLabelDisabled]}>
                Expiry Time {accessMode === 'Time-bound' ? <Text style={styles.asterisk}>*</Text> : <Text style={styles.disabledTag}>(Disabled for permanent)</Text>}
              </Text>
              <TouchableOpacity
                style={[styles.modalInputBox, accessMode === 'Permanent' && styles.modalInputBoxDisabled]}
                disabled={accessMode === 'Permanent'}
                activeOpacity={0.7}
                onPress={() => {
                  if (accessMode === 'Time-bound') {
                    setExpiryTime((prev) => (prev === 'After 1 Hour' ? 'End of Day (06:00 PM)' : 'After 1 Hour'));
                  }
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <ClockIcon color={accessMode === 'Permanent' ? '#9CA3AF' : undefined} />
                  <Text style={[styles.modalInputText, accessMode === 'Permanent' && styles.modalInputTextDisabled]}>
                    {accessMode === 'Permanent' ? 'N/A' : expiryTime}
                  </Text>
                </View>
                <ChevronDownIcon color={accessMode === 'Permanent' ? '#9CA3AF' : adminColors.muted} />
              </TouchableOpacity>

              {/* Reason for Changes */}
              <Text style={styles.modalFieldLabel}>Reason for Changes</Text>
              <TextInput
                style={styles.modalTextArea}
                value={reason}
                onChangeText={setReason}
                placeholder="Enter reason for access change..."
                placeholderTextColor={adminColors.muted}
                multiline
                numberOfLines={2}
                maxLength={200}
              />
              <Text style={styles.charCount}>{reason.length} / 200</Text>
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setActiveModuleForAccess(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalApplyBtn}
                onPress={handleApplyAccess}
                activeOpacity={0.85}
              >
                <Text style={styles.modalApplyBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Modal 2: Permissions Dropdown Menu (Image 4 Exact UI) ─── */}
      <Modal visible={activeModuleForPerm !== null} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActiveModuleForPerm(null)}
        >
          <View style={styles.permDropdownMenu}>
            {PERMISSION_OPTIONS.map((p, index) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.permMenuItem,
                  index < PERMISSION_OPTIONS.length - 1 && styles.permMenuItemDivider,
                  activeModuleForPerm?.permission === p && styles.permMenuItemActive,
                ]}
                onPress={() => {
                  if (activeModuleForPerm) {
                    setModules((prev) =>
                      prev.map((item) =>
                        item.id === activeModuleForPerm.id ? { ...item, permission: p } : item
                      )
                    );
                  }
                  setActiveModuleForPerm(null);
                }}
              >
                <Text
                  style={[
                    styles.permMenuText,
                    activeModuleForPerm?.permission === p && styles.permMenuTextActive,
                  ]}
                >
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ─── Pickers for User, Role, Type ─── */}
      <Modal visible={showUserPicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowUserPicker(false)}
        >
          <View style={styles.permDropdownMenu}>
            {[
              'Meena V (meen.v@tohfa.org)',
              'Rajesh Kumar (rajesh@tohfa.org)',
              'Anitha Raghavan (anitha@tohfa.org)',
              'Karthik Kumar (karthik@tohfa.org)',
              'Suresh Mani (suresh@tohfa.org)',
            ].map((u, idx, arr) => (
              <TouchableOpacity
                key={u}
                style={[styles.permMenuItem, idx < arr.length - 1 && styles.permMenuItemDivider]}
                onPress={() => {
                  setSelectedUser(u);
                  setShowUserPicker(false);
                }}
              >
                <Text style={styles.permMenuText}>{u}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showRolePicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRolePicker(false)}
        >
          <View style={styles.permDropdownMenu}>
            {[
              'Super Admin',
              'TOHFA Admin',
              'Farmer Admin',
              'Main Warehouse Admin',
              'Sub warehouse Admin',
              'Farmer',
              'Customer',
            ].map((r, idx, arr) => (
              <TouchableOpacity
                key={r}
                style={[styles.permMenuItem, idx < arr.length - 1 && styles.permMenuItemDivider]}
                onPress={() => {
                  setAssignedRole(r);
                  setShowRolePicker(false);
                }}
              >
                <Text style={styles.permMenuText}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showTypePicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTypePicker(false)}
        >
          <View style={styles.permDropdownMenu}>
            {['Permanant', 'Contract', 'Temporary', 'Probation'].map((t, idx, arr) => (
              <TouchableOpacity
                key={t}
                style={[styles.permMenuItem, idx < arr.length - 1 && styles.permMenuItemDivider]}
                onPress={() => {
                  setRoleType(t);
                  setShowTypePicker(false);
                }}
              >
                <Text style={styles.permMenuText}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: adminColors.brand,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 12,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontSize: 20,
  },
  container: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 36,
  },

  fieldLabel: {
    ...adminType.rowMeta,
    color: adminColors.ink,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 6,
    fontSize: 12,
  },
  asterisk: {
    color: '#EF4444',
  },
  dropdownSelector: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: adminColors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  dropdownText: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 13,
  },
  twoColRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },

  // Module Card
  moduleCard: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EBE3D9',
    padding: 14,
    marginTop: 6,
    marginBottom: 16,
    ...adminShadow.sm,
  },
  moduleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3EFEA',
  },
  moduleSectionTitle: {
    color: adminColors.brandDeep,
    fontSize: 13.5,
    fontWeight: '700',
  },
  moduleCount: {
    color: adminColors.muted,
    fontWeight: '500',
  },
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  selectAllLabel: {
    fontSize: 11,
    color: adminColors.muted,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxActive: {
    borderColor: adminColors.brand,
    backgroundColor: adminColors.brand,
  },
  checkboxInner: {
    width: 6,
    height: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  selectAllText: {
    fontSize: 11,
    color: adminColors.ink,
    fontWeight: '600',
  },

  // Table
  tableHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3EFEA',
  },
  thText: {
    color: adminColors.brandDeep,
    fontWeight: '700',
    fontSize: 11,
  },

  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F3EFEA',
  },
  numBadge: {
    width: 22,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  numBadgeText: {
    color: adminColors.ink,
    fontSize: 12,
    fontWeight: '700',
  },
  moduleInfoCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 4,
  },
  moduleIconBox: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleNameText: {
    flex: 1,
    color: adminColors.ink,
    fontSize: 12,
    fontWeight: '600',
  },
  permCol: {
    width: 78,
    alignItems: 'center',
  },
  permDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    width: '100%',
    backgroundColor: '#FFFFFF',
  },
  permText: {
    color: adminColors.ink,
    fontSize: 11,
    fontWeight: '500',
  },
  accessCol: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expiryCol: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillPermanent: {
    backgroundColor: '#DEF7EC',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillPermanentText: {
    color: '#03543F',
    fontSize: 10,
    fontWeight: '700',
  },
  pillTimeBound: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E1EFFE',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  pillTimeBoundText: {
    color: '#1E429F',
    fontSize: 9.5,
    fontWeight: '700',
  },
  dashText: {
    color: adminColors.muted,
    fontSize: 14,
    fontWeight: '600',
  },

  // Dual bottom buttons
  bottomButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelOutlineBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: adminColors.card,
    borderWidth: 1.2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelOutlineBtnText: {
    color: adminColors.ink,
    fontWeight: '700',
    fontSize: 14,
  },
  saveAccessBtn: {
    flex: 1.3,
    height: 48,
    borderRadius: 12,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveAccessBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },

  // Modal Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  // Permission Access Modal Card (Image 5)
  accessModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    ...adminShadow.lg,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
    zIndex: 10,
  },
  calendarCircleIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DEF7EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 10,
  },
  accessModalTitle: {
    color: '#1F2937',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  accessModalSub: {
    color: '#6B7280',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  radioRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginBottom: 14,
  },
  accessRadioPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 6,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  accessRadioPillActive: {
    borderColor: adminColors.brand,
    backgroundColor: adminColors.brand,
  },
  radioDotOuter: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDotOuterActive: {
    borderColor: '#FFFFFF',
  },
  radioDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  accessRadioText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 11.5,
  },
  accessRadioTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  timeBoundFormCard: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    marginBottom: 16,
  },
  modalFieldLabel: {
    color: '#374151',
    fontWeight: '700',
    fontSize: 11.5,
    marginTop: 6,
    marginBottom: 4,
  },
  modalInputBox: {
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginBottom: 4,
  },
  modalInputBoxDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    opacity: 0.65,
  },
  modalFieldLabelDisabled: {
    color: '#9CA3AF',
  },
  disabledTag: {
    color: '#9CA3AF',
    fontSize: 10.5,
    fontWeight: '400',
  },
  modalInputText: {
    color: '#1F2937',
    fontSize: 12,
  },
  modalInputTextDisabled: {
    color: '#9CA3AF',
  },
  modalTextArea: {
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    textAlignVertical: 'top',
    color: '#1F2937',
    fontSize: 12,
  },
  charCount: {
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 2,
    fontSize: 10,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    color: '#374151',
    fontWeight: '700',
    fontSize: 13.5,
  },
  modalApplyBtn: {
    flex: 1.2,
    height: 44,
    borderRadius: 10,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalApplyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13.5,
  },

  // Permissions Dropdown Menu (Image 4 Exact UI)
  permDropdownMenu: {
    width: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    ...adminShadow.lg,
  },
  permMenuItem: {
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  permMenuItemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  permMenuItemActive: {
    backgroundColor: '#FFF7ED',
  },
  permMenuText: {
    fontSize: 13.5,
    color: '#4B5563',
    fontWeight: '500',
  },
  permMenuTextActive: {
    color: adminColors.brand,
    fontWeight: '700',
  },
});
