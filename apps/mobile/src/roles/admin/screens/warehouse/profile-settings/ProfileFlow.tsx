/**
 * In-module navigator for the warehouse account screens (design module M16,
 * part A): Settings hub -> Profile / Notification Settings / Security / Change
 * Password / Session & Security / Help & Support / About.
 *
 * This navigation was stitched inside SubWarehouseSettingsScreen (a
 * `currentScreen` switch that drew every child), the Main twin
 * MainWarehouseProfileScreen (editing / password / sign-out flags) and the
 * hosts (App.tsx 'SubWarehouseSettings' / 'SubWarehouseHelpSupport', MoreScreen
 * and the shells' showSettings flags). It lives here now and takes `scope` +
 * `can`, so every host renders the same flow: App.tsx and the Sub shell with
 * the Sub warehouse scope, the Main shell with MAIN_WAREHOUSE_SCOPE.
 *
 * Logout goes to the host (`onLogout`, normally its login route). Report an
 * issue also goes to the host (`onReportIssue`): the form lives outside this
 * module, and Help & Support offers it only with support.ticket.create_own.
 *
 * Part B adds the warehouse-facing screens (design module M15): Warehouse
 * Profile -> Storage / Operating / Contact / Documents, and the Main-only
 * Warehouse Settings (route-guarded on warehouse.capacity.set). These were
 * stitched inside SubWarehouseProfileScreen (an `activeSubScreen` switch), the
 * App.tsx keys SubWarehouseProfile / SubWarehouseStorageInfo / ... and the
 * shells' showProfile / showStorageInfo / storage_locations /
 * warehouse_settings views. For Main, the flow keeps the selector's warehouse
 * pick so Profile -> Storage shows the same warehouse. A storage location's
 * detail stays with the host (`onSelectStorageLocation`).
 */
import React, { useEffect, useState } from 'react';
import { BackHandler } from 'react-native';

import { AboutScreen } from './AboutScreen';
import { ContactScreen } from './ContactScreen';
import { DocumentsScreen } from './DocumentsScreen';
import { HelpSupportScreen } from './HelpSupportScreen';
import { NotificationSettingsScreen } from './NotificationSettingsScreen';
import { OperatingInfoScreen } from './OperatingInfoScreen';
import { SecurityScreen } from './SecurityScreen';
import { SessionSecurityScreen } from './SessionSecurityScreen';
import { SettingsScreen } from './SettingsScreen';
import { StorageInfoScreen } from './StorageInfoScreen';
import { UserProfileScreen } from './UserProfileScreen';
import { WarehouseInfoScreen } from './WarehouseInfoScreen';
import { WarehouseSettingsScreen } from './WarehouseSettingsScreen';
import { PROFILE_WAREHOUSES } from './warehouseFixtures';
import type { FaqCategory, PermissionCheck, ProfileRoute, WarehouseScope, WarehouseTab } from './types';

export interface ProfileFlowProps {
  scope: WarehouseScope;
  can: PermissionCheck;
  initialScreen?: ProfileRoute | undefined;
  /** Leave the module (pressed back on its first screen). */
  onBack: () => void;
  /** Sign out from Settings, Profile (Main) or Session & Security. */
  onLogout?: (() => void) | undefined;
  /** Open the host's report-issue form (Help & Support; needs support.ticket.create_own). */
  onReportIssue?: ((category: FaqCategory) => void) | undefined;
  onTabChange?: ((tab: WarehouseTab) => void) | undefined;
  /** Warehouses for the Main selector (ignored for a Sub scope). */
  warehouseOptions?: readonly WarehouseScope[] | undefined;
  /** Main: warehouse picked when the flow opens (e.g. the one the host was showing). */
  initialWarehouseId?: string | undefined;
  /** Open a storage location's detail (host-owned). Without it Storage cards are not tappable. */
  onSelectStorageLocation?: ((locationId: string) => void) | undefined;
}

export function ProfileFlow({
  scope,
  can,
  initialScreen = 'Settings',
  onBack,
  onLogout,
  onReportIssue,
  onTabChange,
  warehouseOptions = PROFILE_WAREHOUSES,
  initialWarehouseId,
  onSelectStorageLocation,
}: ProfileFlowProps) {
  const [stack, setStack] = useState<ProfileRoute[]>(() => [initialScreen]);
  // Main's selector pick, shared by the warehouse-facing screens of the flow.
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(initialWarehouseId);

  // A host that re-targets the open module restarts the stack, as the other area flows do.
  useEffect(() => {
    setStack([initialScreen]);
  }, [initialScreen]);

  const current = stack[stack.length - 1] ?? initialScreen;
  const navigate = (screen: ProfileRoute) => setStack((prev) => [...prev, screen]);
  const back = () => {
    if (stack.length > 1) setStack((prev) => prev.slice(0, -1));
    else onBack();
  };

  // Hardware back walks the flow's own stack.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      back();
      return true;
    });
    return () => sub.remove();
  });

  const common = { scope, can, onBack: back, onTabChange };
  const selection = { warehouseOptions, selectedWarehouseId, onSelectWarehouse: setSelectedWarehouseId };

  switch (current) {
    case 'Settings':
      return <SettingsScreen key="settings" {...common} onOpen={navigate} onLogout={onLogout} />;
    case 'ChangePassword':
      // The Settings screen's inline change-password state; back leaves it. The
      // distinct key gives it fresh state rather than reusing the hub instance.
      return <SettingsScreen key="change-password" {...common} initialView="changePassword" onLogout={onLogout} />;
    case 'UserProfile':
      return <UserProfileScreen {...common} onChangePassword={() => navigate('ChangePassword')} onLogout={onLogout} />;
    case 'NotificationSettings':
      return <NotificationSettingsScreen {...common} />;
    case 'Security':
      return (
        <SecurityScreen
          {...common}
          onChangePassword={() => navigate('ChangePassword')}
          onViewSessionSecurity={() => navigate('SessionSecurity')}
        />
      );
    case 'SessionSecurity':
      return <SessionSecurityScreen {...common} onLogout={onLogout} />;
    case 'HelpSupport':
      return <HelpSupportScreen {...common} onReportIssue={onReportIssue} />;
    case 'About':
      return <AboutScreen {...common} />;
    case 'WarehouseProfile':
      return <WarehouseInfoScreen {...common} {...selection} onOpen={navigate} />;
    case 'StorageInfo':
      return <StorageInfoScreen {...common} {...selection} onSelectLocation={onSelectStorageLocation} />;
    case 'OperatingInfo':
      return <OperatingInfoScreen {...common} {...selection} />;
    case 'Contact':
      return <ContactScreen {...common} {...selection} />;
    case 'Documents':
      return <DocumentsScreen {...common} {...selection} />;
    case 'WarehouseSettings':
      // Main-only: the screen itself is route-guarded on warehouse.capacity.set
      // (a permission note without it), so every host gets the same guard.
      return <WarehouseSettingsScreen {...common} {...selection} />;
    default:
      return null;
  }
}
