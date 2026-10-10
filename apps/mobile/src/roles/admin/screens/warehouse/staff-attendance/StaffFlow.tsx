/**
 * In-module navigator for the warehouse staff & attendance screens (design
 * module M14).
 *
 *   Staff -> Staff Detail -> Edit Staff Profile (form / confirm / success)
 *                         -> Attendance History (attendance summary tap)
 *   Staff -> Attendance -> Attendance Detail
 *                       -> Attendance History
 *
 * The screens used to be stitched three times (App.tsx keys, the Sub shell's
 * show* flags and Main's own nested MainWarehouseStaff* / MainWarehouseAttendance
 * screens), none of which passed `scope` / `can`. This flow owns the stack, so
 * every step gets the viewer's scope and `can`.
 *
 * Gate: the roster routes (Staff, StaffDetail, EditStaffProfile) need
 * `warehouse.staff.list_view` (MAIN all, SUB own). navigate() refuses them
 * without it and the screens render a not-available note if opened directly.
 * Attendance has no code (ungated, SPEC_GAPS W4t-3).
 *
 * Route keys are the old App.tsx keys without the 'SubWarehouse' prefix; the
 * old 'SubWarehouseTodayAttendance' key opens Attendance on the 'All' chip.
 */
import React, { useEffect, useState } from 'react';

import { AttendanceDetailScreen } from './AttendanceDetailScreen';
import { AttendanceHistoryScreen } from './AttendanceHistoryScreen';
import { AttendanceScreen } from './AttendanceScreen';
import { EditStaffProfileScreen } from './EditStaffProfileScreen';
import { StaffDetailScreen } from './StaffDetailScreen';
import { STAFF_ROSTER_CODE, StaffScreen } from './StaffScreen';
import type { PermissionCheck, StaffRoute, StaffRouteParams, WarehouseScope, WarehouseTab } from './types';

interface StaffStackEntry {
  screen: StaffRoute;
  params?: StaffRouteParams | undefined;
}

/** Routes that show the warehouse roster and need STAFF_ROSTER_CODE. */
const ROSTER_ROUTES: readonly StaffRoute[] = ['Staff', 'StaffDetail', 'EditStaffProfile'];

/** True when `can` allows opening `route` (roster routes need warehouse.staff.list_view). */
export function canOpenStaffRoute(route: StaffRoute, can: PermissionCheck): boolean {
  return !ROSTER_ROUTES.includes(route) || can(STAFF_ROSTER_CODE);
}

export interface StaffFlowProps {
  scope: WarehouseScope;
  can: PermissionCheck;
  initialScreen?: StaffRoute | undefined;
  initialParams?: StaffRouteParams | undefined;
  /** Leave the module (pressed back on its first screen). */
  onBack: () => void;
  onTabChange?: ((tab: WarehouseTab) => void) | undefined;
}

export function StaffFlow({ scope, can, initialScreen = 'Staff', initialParams, onBack, onTabChange }: StaffFlowProps) {
  const [stack, setStack] = useState<StaffStackEntry[]>(() => [{ screen: initialScreen, params: initialParams }]);

  // A host that re-targets the open module restarts the stack, as the other
  // area flows do. Keyed on the param values, not the object, so a host that
  // builds the params inline does not reset it on every render.
  const presetKey = `${initialParams?.staff?.id ?? ''}|${initialParams?.record?.id ?? ''}|${initialParams?.attendanceFilter ?? ''}`;
  useEffect(() => {
    setStack([{ screen: initialScreen, params: initialParams }]);
    // initialParams is read through presetKey on purpose (see above).
  }, [initialScreen, presetKey]);

  const current = stack[stack.length - 1] ?? { screen: initialScreen, params: initialParams };
  const params: StaffRouteParams = current.params ?? {};

  const navigate = (screen: StaffRoute, nextParams?: StaffRouteParams) => {
    if (!canOpenStaffRoute(screen, can)) return;
    setStack((prev) => [...prev, { screen, params: nextParams }]);
  };
  const back = () => {
    if (stack.length > 1) setStack((prev) => prev.slice(0, -1));
    else onBack();
  };
  /** Success "Back to Staff List": drop the edit and detail entries. */
  const backToStaffList = () => {
    const index = stack.map((e) => e.screen).lastIndexOf('Staff');
    if (index >= 0) setStack((prev) => prev.slice(0, index + 1));
    else onBack();
  };

  const common = { scope, can, onBack: back, onTabChange };

  switch (current.screen) {
    case 'Staff':
      return (
        <StaffScreen
          {...common}
          onSelectStaff={(staff) => navigate('StaffDetail', { staff })}
          onNavigateToAttendance={() => navigate('Attendance', { attendanceFilter: 'All' })}
          onNavigateToHistory={() => navigate('AttendanceHistory')}
        />
      );
    case 'StaffDetail':
      return (
        <StaffDetailScreen
          {...common}
          staff={params.staff}
          onEditProfile={(staff) => navigate('EditStaffProfile', { staff })}
          onViewAttendanceHistory={() => navigate('AttendanceHistory')}
        />
      );
    case 'EditStaffProfile':
      return <EditStaffProfileScreen {...common} staff={params.staff} onSave={backToStaffList} />;
    case 'Attendance':
      return (
        <AttendanceScreen
          {...common}
          initialFilter={params.attendanceFilter}
          onSelectRecord={(record) => navigate('AttendanceDetail', { record })}
          onNavigateToHistory={() => navigate('AttendanceHistory')}
        />
      );
    case 'AttendanceDetail':
      return <AttendanceDetailScreen {...common} record={params.record} />;
    case 'AttendanceHistory':
      return (
        <AttendanceHistoryScreen
          {...common}
          onNavigateToToday={() => {
            // Back to the overview when History was opened from it; otherwise open it.
            const prev = stack[stack.length - 2];
            if (prev?.screen === 'Attendance') back();
            else navigate('Attendance', { attendanceFilter: 'All' });
          }}
        />
      );
    default:
      return null;
  }
}
