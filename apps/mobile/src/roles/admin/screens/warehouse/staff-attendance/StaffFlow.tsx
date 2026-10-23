/**
 * In-module navigator for the warehouse staff & attendance screens (design
 * module M14), live against /admin/warehouse-staff and /admin/staff-attendance.
 *
 *   Staff -> Staff Detail -> Edit Staff Profile (form / confirm / success)
 *                         -> Attendance History (this member)
 *         -> Add Staff (Edit Staff Profile in create mode)
 *   Staff -> Attendance -> Attendance Detail ({ staffId, date })
 *                       -> Attendance History -> Attendance Detail (a By Date row)
 *
 * Gate (docs/rbac.json; BR-83: a Sub Warehouse Admin holds none of these):
 *   Staff, StaffDetail                         admin.staff.list_view
 *   EditStaffProfile                           admin.staff.manage
 *   Attendance, AttendanceDetail, History      admin.staff.attendance.view
 * navigate() refuses a route without its code and each screen renders a
 * not-available note if opened directly; the server enforces all of it again.
 *
 * `onAssignDelivery` is accepted for host compatibility but unused: the staff
 * record has no driver type and no delivery assignment exists in the API.
 */
import React, { useEffect, useState } from 'react';
import { useFlowBack } from '../useFlowBack';

import { AttendanceDetailScreen } from './AttendanceDetailScreen';
import { AttendanceHistoryScreen } from './AttendanceHistoryScreen';
import { AttendanceScreen } from './AttendanceScreen';
import { EditStaffProfileScreen } from './EditStaffProfileScreen';
import { StaffDetailScreen } from './StaffDetailScreen';
import { canOpenStaffRoute } from './mappers';
import { StaffScreen } from './StaffScreen';
import type { PermissionCheck, StaffMember, StaffRoute, StaffRouteParams, WarehouseScope, WarehouseTab } from './types';

interface StaffStackEntry {
  screen: StaffRoute;
  params?: StaffRouteParams | undefined;
}

export { canOpenStaffRoute };

export interface StaffFlowProps {
  scope: WarehouseScope;
  can: PermissionCheck;
  initialScreen?: StaffRoute | undefined;
  initialParams?: StaffRouteParams | undefined;
  /** Leave the module (pressed back on its first screen). */
  onBack: () => void;
  onTabChange?: ((tab: WarehouseTab) => void) | undefined;
  /** Unused (no delivery assignment in the API); kept so existing hosts still compile. */
  onAssignDelivery?: ((driver?: StaffMember) => void) | undefined;
}

export function StaffFlow({
  scope,
  can,
  initialScreen = 'Staff',
  initialParams,
  onBack,
  onTabChange,
}: StaffFlowProps) {
  const [stack, setStack] = useState<StaffStackEntry[]>(() => [{ screen: initialScreen, params: initialParams }]);

  // A host that re-targets the open module restarts the stack, as the other
  // area flows do. Keyed on the param values, not the object, so a host that
  // builds the params inline does not reset it on every render.
  const presetKey = `${initialParams?.staff?.id ?? ''}|${initialParams?.record?.staffId ?? ''}|${initialParams?.record?.date ?? ''}|${initialParams?.attendanceFilter ?? ''}|${initialParams?.historyStaffId ?? ''}`;
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

  // Hardware back pops this flow's stack; at its root the host's listener handles it.
  useFlowBack(() => {
    if (stack.length <= 1) return false;
    back();
    return true;
  });
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
          onAddStaff={() => navigate('EditStaffProfile', {})}
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
          onViewAttendanceHistory={(staff) => navigate('AttendanceHistory', { historyStaffId: staff.id, historyStaffName: staff.name })}
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
          staffId={params.historyStaffId}
          staffName={params.historyStaffName}
          onSelectRecord={(record) => navigate('AttendanceDetail', { record })}
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
