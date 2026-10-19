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
 *
 * Data is live and owned here (API integration plan, phase 8): each route's
 * container below fetches through ./useProfileData.ts and passes the result to
 * the screen. The account routes act on the caller from the token. The
 * warehouse routes read profileWarehouseId(scope, selected): a Sub scope is
 * always its own warehouse uuid (BR-30); Main reads a pick only when it is a
 * uuid (its selector still lists sample codes until the Main phase).
 *
 * Change password: a success revokes every session of the account on the
 * server, this one included, so the flow signs out at once (`onLogout`).
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFlowBack } from '../useFlowBack';

import { AboutScreen } from './AboutScreen';
import { ContactScreen } from './ContactScreen';
import { DocumentsScreen } from './DocumentsScreen';
import { HelpSupportScreen } from './HelpSupportScreen';
import { NotificationSettingsScreen } from './NotificationSettingsScreen';
import { OperatingInfoScreen } from './OperatingInfoScreen';
import { SecurityScreen } from './SecurityScreen';
import { SessionSecurityScreen } from './SessionSecurityScreen';
import { SettingsScreen, type SettingsChildRoute } from './SettingsScreen';
import { StorageInfoScreen, type StorageStatusFilter } from './StorageInfoScreen';
import { UserProfileScreen } from './UserProfileScreen';
import { WarehouseInfoScreen } from './WarehouseInfoScreen';
import { WarehouseSettingsScreen } from './WarehouseSettingsScreen';
import { IssueSubmittedScreen, ReportIssueScreen } from '../storage-ops';
import { PROFILE_WAREHOUSES } from './warehouseFixtures';
import { profileWarehouseId, toOperatingWeek } from './mappers';
import type {
  FaqCategory,
  PermissionCheck,
  ProfileRoute,
  WarehouseScope,
  WarehouseScreenBaseProps,
  WarehouseSelectionProps,
  WarehouseTab,
} from './types';
import {
  useAccount,
  useAdminHelp,
  useChangePassword,
  useMySessions,
  useNotificationPreferences,
  useSaveLanguage,
  useSaveName,
  useSavePreferences,
  useStorageLocations,
  useWarehouseCapacity,
  useWarehouseProfile,
} from './useProfileData';

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

// ─── Live routes (plan phase 8) ──────────────────────────────────────────────
// Each route's container fetches through ./useProfileData.ts and passes the
// result to the screen; the screens hold no samples.

interface LiveSettingsProps {
  base: WarehouseScreenBaseProps;
  initialView?: 'hub' | 'changePassword' | undefined;
  onOpen?: ((route: SettingsChildRoute) => void) | undefined;
  onLogout?: (() => void) | undefined;
}

function LiveSettingsRoute({ base, initialView, onOpen, onLogout }: LiveSettingsProps) {
  const change = useChangePassword();
  // A changed password revokes EVERY session on the server, this one included
  // (docs/openapi.yaml changeOwnPassword): sign out at once, never stay on a
  // dead session.
  const signOutAfterPasswordChange = () => {
    if (onLogout) onLogout();
  };
  return (
    <SettingsScreen
      {...base}
      initialView={initialView}
      onOpen={onOpen}
      onLogout={onLogout}
      onSubmitPassword={change.run}
      isChangingPassword={change.isPending}
      passwordError={change.error}
      onPasswordChanged={onLogout ? signOutAfterPasswordChange : undefined}
    />
  );
}

interface LiveUserProfileProps {
  base: WarehouseScreenBaseProps;
  onChangePassword: () => void;
  onLogout?: (() => void) | undefined;
}

function LiveUserProfileRoute({ base, onChangePassword, onLogout }: LiveUserProfileProps) {
  const account = useAccount(base.scope);
  const saveName = useSaveName();
  const saveLanguage = useSaveLanguage();
  return (
    <UserProfileScreen
      {...base}
      profile={account.profile}
      isLoading={account.isLoading}
      error={account.error}
      onRetry={account.refresh}
      onRefresh={account.refresh}
      isRefreshing={account.isRefreshing}
      onSaveName={saveName.run}
      isSavingName={saveName.isPending}
      saveNameError={saveName.error}
      onChangeLanguage={(locale) => saveLanguage.run(locale)}
      isSavingLanguage={saveLanguage.isPending}
      languageError={saveLanguage.error}
      onChangePassword={onChangePassword}
      onLogout={onLogout}
    />
  );
}

function LiveNotificationSettingsRoute({ base }: { base: WarehouseScreenBaseProps }) {
  const prefs = useNotificationPreferences(base.scope);
  const save = useSavePreferences();
  // A failed save may have stored some categories before it stopped: re-read
  // what the server holds, once per failure.
  const refreshedFor = useRef<unknown>(null);
  useEffect(() => {
    if (save.error === null || save.error === undefined || save.error === refreshedFor.current) return;
    refreshedFor.current = save.error;
    prefs.refresh();
  });
  return (
    <NotificationSettingsScreen
      {...base}
      preferences={prefs.preferences}
      isLoading={prefs.isLoading}
      error={prefs.error}
      onRetry={prefs.refresh}
      onRefresh={prefs.refresh}
      isRefreshing={prefs.isRefreshing}
      onSave={(changes) => save.run(changes)}
      isSaving={save.isPending}
      saveError={save.error}
    />
  );
}

function LiveSessionSecurityRoute({ base, onLogout }: { base: WarehouseScreenBaseProps; onLogout?: (() => void) | undefined }) {
  const sessions = useMySessions(base.scope);
  return (
    <SessionSecurityScreen
      {...base}
      sessions={sessions.sessions}
      isLoading={sessions.isLoading}
      error={sessions.error}
      onRetry={sessions.refresh}
      onRefresh={sessions.refresh}
      isRefreshing={sessions.isRefreshing}
      onLogout={onLogout}
    />
  );
}

function LiveHelpSupportRoute({ base, onReportIssue }: { base: WarehouseScreenBaseProps; onReportIssue: (category: FaqCategory) => void }) {
  const help = useAdminHelp(base.scope);
  return (
    <HelpSupportScreen
      {...base}
      help={help.help}
      isLoading={help.isLoading}
      error={help.error}
      onRetry={help.refresh}
      onRefresh={help.refresh}
      isRefreshing={help.isRefreshing}
      onReportIssue={onReportIssue}
    />
  );
}

interface LiveWarehouseProps {
  base: WarehouseScreenBaseProps;
  selection: WarehouseSelectionProps;
  /** profileWarehouseId(scope, selected): the uuid to read, or undefined (nothing to ask for). */
  warehouseId: string | undefined;
}

function LiveWarehouseInfoRoute({ base, selection, warehouseId, onOpen }: LiveWarehouseProps & { onOpen: (route: ProfileRoute) => void }) {
  const warehouse = useWarehouseProfile(warehouseId);
  const capacity = useWarehouseCapacity(warehouseId);
  const locations = useStorageLocations(warehouseId, {});
  return (
    <WarehouseInfoScreen
      {...base}
      {...selection}
      onOpen={onOpen}
      profile={warehouse.warehouse}
      capacity={capacity.capacity}
      locationCount={locations.total}
      unavailable={warehouseId === undefined}
      isLoading={warehouse.isLoading}
      error={warehouse.error}
      onRetry={warehouse.refresh}
      onRefresh={() => {
        warehouse.refresh();
        capacity.refresh();
        locations.refresh();
      }}
      isRefreshing={warehouse.isRefreshing}
    />
  );
}

/**
 * Storage Information with live data. Exported for InventoryFlow's M3S08
 * route, which renders the same screen for the scope's warehouse.
 */
export function LiveStorageInfo({
  base,
  selection,
  warehouseId,
  onSelectLocation,
}: LiveWarehouseProps & { onSelectLocation?: ((locationId: string) => void) | undefined }) {
  const [statusFilter, setStatusFilter] = useState<StorageStatusFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const capacity = useWarehouseCapacity(warehouseId);
  const locations = useStorageLocations(warehouseId, {
    isActive: statusFilter === 'All' ? undefined : statusFilter === 'Active',
    q: searchQuery,
  });
  return (
    <StorageInfoScreen
      {...base}
      {...selection}
      onSelectLocation={onSelectLocation}
      locations={locations.locations}
      total={locations.total}
      capacity={capacity.capacity}
      statusFilter={statusFilter}
      onStatusFilterChange={setStatusFilter}
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
      unavailable={warehouseId === undefined}
      isLoading={locations.isLoading}
      error={locations.error}
      onRetry={locations.refresh}
      onRefresh={() => {
        capacity.refresh();
        locations.refresh();
      }}
      isRefreshing={locations.isRefreshing}
      onLoadMore={locations.loadMore}
      hasMore={locations.hasMore}
    />
  );
}

function LiveOperatingInfoRoute({ base, selection, warehouseId }: LiveWarehouseProps) {
  const warehouse = useWarehouseProfile(warehouseId);
  const week = useMemo(() => toOperatingWeek(warehouse.operatingHours, new Date()), [warehouse.operatingHours]);
  return (
    <OperatingInfoScreen
      {...base}
      {...selection}
      profile={warehouse.warehouse}
      week={week}
      unavailable={warehouseId === undefined}
      isLoading={warehouse.isLoading}
      error={warehouse.error}
      onRetry={warehouse.refresh}
      onRefresh={warehouse.refresh}
      isRefreshing={warehouse.isRefreshing}
    />
  );
}

function LiveContactRoute({ base, selection, warehouseId }: LiveWarehouseProps) {
  const warehouse = useWarehouseProfile(warehouseId);
  return (
    <ContactScreen
      {...base}
      {...selection}
      profile={warehouse.warehouse}
      unavailable={warehouseId === undefined}
      isLoading={warehouse.isLoading}
      error={warehouse.error}
      onRetry={warehouse.refresh}
      onRefresh={warehouse.refresh}
      isRefreshing={warehouse.isRefreshing}
    />
  );
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
  const [reportCategory, setReportCategory] = useState<FaqCategory>('Warehouse Operations');
  const [submittedTicketId, setSubmittedTicketId] = useState<string>('SUP-00246');

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
  // Always handled: at the root back() hands over to the host through onBack.
  useFlowBack(() => {
    back();
    return true;
  });

  const common: WarehouseScreenBaseProps = { scope, can, onBack: back, onTabChange };
  const selection: WarehouseSelectionProps = { warehouseOptions, selectedWarehouseId, onSelectWarehouse: setSelectedWarehouseId };
  // BR-30: the warehouse every warehouse-facing route reads.
  const warehouseId = profileWarehouseId(scope, selectedWarehouseId);

  switch (current) {
    case 'Settings':
      return <LiveSettingsRoute key="settings" base={common} onOpen={navigate} onLogout={onLogout} />;
    case 'ChangePassword':
      // The Settings screen's inline change-password state; back leaves it. The
      // distinct key gives it fresh state rather than reusing the hub instance.
      return <LiveSettingsRoute key="change-password" base={common} initialView="changePassword" onLogout={onLogout} />;
    case 'UserProfile':
      return <LiveUserProfileRoute base={common} onChangePassword={() => navigate('ChangePassword')} onLogout={onLogout} />;
    case 'NotificationSettings':
      return <LiveNotificationSettingsRoute base={common} />;
    case 'Security':
      return (
        <SecurityScreen
          {...common}
          onChangePassword={() => navigate('ChangePassword')}
          onViewSessionSecurity={() => navigate('SessionSecurity')}
        />
      );
    case 'SessionSecurity':
      return <LiveSessionSecurityRoute base={common} onLogout={onLogout} />;
    case 'HelpSupport':
      return (
        <LiveHelpSupportRoute
          base={common}
          onReportIssue={(cat) => {
            setReportCategory(cat);
            if (onReportIssue) {
              onReportIssue(cat);
            } else {
              navigate('ReportIssue');
            }
          }}
        />
      );
    case 'ReportIssue':
      return (
        <ReportIssueScreen
          {...common}
          mode="support"
          initialCategory={reportCategory}
          onSubmit={(submittedId) => {
            setSubmittedTicketId(submittedId);
            navigate('IssueSubmitted');
          }}
        />
      );
    case 'IssueSubmitted': {
      const returnToHelp = () => {
        setStack((prev) => {
          const helpIdx = prev.lastIndexOf('HelpSupport');
          return helpIdx >= 0 ? prev.slice(0, helpIdx + 1) : ['HelpSupport'];
        });
      };
      return (
        <IssueSubmittedScreen
          {...common}
          mode="support"
          submittedId={submittedTicketId}
          onBack={returnToHelp}
          onDone={returnToHelp}
        />
      );
    }
    case 'About':
      return <AboutScreen {...common} />;
    case 'WarehouseProfile':
      return <LiveWarehouseInfoRoute base={common} selection={selection} warehouseId={warehouseId} onOpen={navigate} />;
    case 'StorageInfo':
      return <LiveStorageInfo base={common} selection={selection} warehouseId={warehouseId} onSelectLocation={onSelectStorageLocation} />;
    case 'OperatingInfo':
      return <LiveOperatingInfoRoute base={common} selection={selection} warehouseId={warehouseId} />;
    case 'Contact':
      return <LiveContactRoute base={common} selection={selection} warehouseId={warehouseId} />;
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
