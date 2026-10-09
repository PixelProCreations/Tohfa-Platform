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
 */
import React, { useEffect, useState } from 'react';
import { BackHandler } from 'react-native';

import { AboutScreen } from './AboutScreen';
import { HelpSupportScreen } from './HelpSupportScreen';
import { NotificationSettingsScreen } from './NotificationSettingsScreen';
import { SecurityScreen } from './SecurityScreen';
import { SessionSecurityScreen } from './SessionSecurityScreen';
import { SettingsScreen } from './SettingsScreen';
import { UserProfileScreen } from './UserProfileScreen';
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
}

export function ProfileFlow({
  scope,
  can,
  initialScreen = 'Settings',
  onBack,
  onLogout,
  onReportIssue,
  onTabChange,
}: ProfileFlowProps) {
  const [stack, setStack] = useState<ProfileRoute[]>(() => [initialScreen]);

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
    default:
      return null;
  }
}
