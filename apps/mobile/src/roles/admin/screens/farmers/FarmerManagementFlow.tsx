import React, { useState } from 'react';
import type { Can } from '../../permissions/can';
import {
  AdminAllFarmersScreen,
  type ApplicationListItem,
  type FarmerListItem,
} from './AdminAllFarmersScreen';
import { AdminFarmerDetailScreen } from './AdminFarmerDetailScreen';
import { AdminFarmMapScreen } from './AdminFarmMapScreen';
import { AdminRatingScorecardScreen } from './AdminRatingScorecardScreen';
import { AdminApplicationDetailScreen } from '../registration/AdminApplicationDetailScreen';

export interface FarmerManagementFlowProps {
  can?: Can;
  role?: string;
  userScope?: {
    zoneId?: string | undefined;
    warehouseId?: string | undefined;
  } | undefined;
  initialFarmer?: FarmerListItem | null | undefined;
  initialTab?: 'farmers' | 'applications' | undefined;
  initialSubScreen?: 'detail' | 'map' | 'scorecard' | null | undefined;
  onBack: () => void;
  onNavigateTab?: (tab: string) => void;
}

/**
 * FarmerManagementFlow
 *
 * Consolidated single flow for farmer and application lifecycle:
 * AdminAllFarmersScreen -> AdminFarmerDetailScreen -> AdminFarmMapScreen -> AdminRatingScorecardScreen
 * Handles application review via AdminApplicationDetailScreen.
 *
 * Replaces duplicate state-machine ternaries across Super Admin, Tohfa Admin,
 * Farmer Admin, and Warehouse Admin shells.
 */
export function FarmerManagementFlow({
  can,
  role = 'SUPER_ADMIN',
  userScope,
  initialFarmer = null,
  initialTab,
  initialSubScreen = null,
  onBack,
  onNavigateTab,
}: FarmerManagementFlowProps): React.JSX.Element {
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerListItem | null>(initialFarmer);
  const [farmerSubScreen, setFarmerSubScreen] = useState<'detail' | 'map' | 'scorecard' | null>(
    initialSubScreen
  );
  const [selectedApp, setSelectedApp] = useState<ApplicationListItem | null>(null);

  // Application detail review
  if (selectedApp) {
    return (
      <AdminApplicationDetailScreen
        application={selectedApp}
        can={can}
        role={role}
        onBack={() => setSelectedApp(null)}
        onApprove={() => setSelectedApp(null)}
        onReject={() => setSelectedApp(null)}
      />
    );
  }

  // Farm Map
  if (farmerSubScreen === 'map' && selectedFarmer) {
    return (
      <AdminFarmMapScreen
        farmer={selectedFarmer}
        onBack={() => setFarmerSubScreen(null)}
      />
    );
  }

  // Rating Scorecard
  if (farmerSubScreen === 'scorecard' && selectedFarmer) {
    return (
      <AdminRatingScorecardScreen
        farmer={selectedFarmer}
        onBack={() => setFarmerSubScreen(null)}
        onOpenComplianceTiers={() => {}}
      />
    );
  }

  // Farmer Detail
  if (selectedFarmer) {
    return (
      <AdminFarmerDetailScreen
        farmer={selectedFarmer}
        can={can}
        role={role}
        userScope={userScope}
        onBack={() => {
          setSelectedFarmer(null);
          setFarmerSubScreen(null);
        }}
        onOpenFarmMap={() => setFarmerSubScreen('map')}
        onOpenRatingScorecard={() => setFarmerSubScreen('scorecard')}
      />
    );
  }

  // All Farmers list & Applications
  return (
    <AdminAllFarmersScreen
      can={can}
      role={role}
      userScope={userScope}
      initialTab={initialTab}
      showBottomNav={false}
      onBack={onBack}
      onSelectFarmer={(farmer) => {
        setSelectedFarmer(farmer);
      }}
      onReviewApplication={(app) => {
        setSelectedApp(app);
      }}
      onNavigateTab={(tab) => {
        if (onNavigateTab) onNavigateTab(tab);
      }}
    />
  );
}

export default FarmerManagementFlow;

