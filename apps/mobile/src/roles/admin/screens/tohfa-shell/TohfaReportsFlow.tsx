/**
 * The Tohfa Admin reports area, opened from the More menu's Reports row. It is
 * the same AdminReportsMainScreen and sub-screens the old shell's Reports tab
 * mounted, moved here unchanged so TohfaAdminDashboardScreen stays a thin
 * host. `onBack` from the main screen leaves the area; a sub-screen's back
 * (button or Android back) returns to the main screen first.
 */
import React, { useState } from 'react';
import {
  AdminReportsMainScreen,
  AnalyticsDashboardScreen,
  FarmerPerformanceReportScreen,
  WarehouseOpsReportScreen,
  ReportBuilderScreen,
  SystemAlertsScreen,
  AnnouncementsScreen,
  AllRecentReportsScreen,
} from '../reports';
import { PLStatementScreen } from '../finance';
import { useFlowBack } from '../warehouse/useFlowBack';

type ReportsSubScreen =
  | 'analytics'
  | 'pl'
  | 'farmerPerformance'
  | 'warehouseOps'
  | 'builder'
  | 'alerts'
  | 'announcements'
  | 'allRecent';

export interface TohfaReportsFlowProps {
  onBack: () => void;
}

export function TohfaReportsFlow({ onBack }: TohfaReportsFlowProps) {
  const [sub, setSub] = useState<ReportsSubScreen | null>(null);
  const toMain = () => setSub(null);

  // Android back pops a sub-screen; on the main screen it falls through to the shell.
  useFlowBack(() => {
    if (sub === null) return false;
    setSub(null);
    return true;
  });

  switch (sub) {
    case 'analytics':
      return <AnalyticsDashboardScreen onBack={toMain} />;
    case 'pl':
      return <PLStatementScreen onBack={toMain} />;
    case 'farmerPerformance':
      return <FarmerPerformanceReportScreen onBack={toMain} />;
    case 'warehouseOps':
      return <WarehouseOpsReportScreen onBack={toMain} />;
    case 'allRecent':
      return (
        <AllRecentReportsScreen
          onBack={toMain}
          onOpenPLReport={() => setSub('pl')}
          onOpenFarmerPerformanceReport={() => setSub('farmerPerformance')}
          onOpenWarehouseOpsReport={() => setSub('warehouseOps')}
        />
      );
    case 'builder':
      return (
        <ReportBuilderScreen
          onBack={toMain}
          onGenerate={(type) => {
            if (type === 'pl') setSub('pl');
            else if (type === 'farmer') setSub('farmerPerformance');
            else if (type === 'warehouse') setSub('warehouseOps');
          }}
        />
      );
    case 'alerts':
      return <SystemAlertsScreen onBack={toMain} />;
    case 'announcements':
      return <AnnouncementsScreen onBack={toMain} />;
    default:
      return (
        <AdminReportsMainScreen
          onBack={onBack}
          onOpenPLReport={() => setSub('pl')}
          onOpenFarmerPerformanceReport={() => setSub('farmerPerformance')}
          onOpenWarehouseOpsReport={() => setSub('warehouseOps')}
          onOpenAnalyticsDashboard={() => setSub('analytics')}
          onOpenReportBuilder={() => setSub('builder')}
          onOpenAllRecentReports={() => setSub('allRecent')}
          onOpenSystemAlerts={() => setSub('alerts')}
          onOpenAnnouncements={() => setSub('announcements')}
        />
      );
  }
}
