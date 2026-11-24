import React from 'react';
import {
  AdminAllFarmersScreen,
  type FarmerListItem,
} from './AdminAllFarmersScreen';
import { type Can } from '../../permissions/can';

export interface SuperAdminFarmersManagementScreenProps {
  can?: Can | undefined;
  role?: string | undefined;
  onBack?: (() => void) | undefined;
  onSelectFarmer: (farmer: FarmerListItem) => void;
  onOpenAllFarmers?: ((statusFilter?: 'All' | 'Active' | 'Inactive', showFilter?: boolean) => void) | undefined;
  onOpenSubscriptionOverview?: (() => void) | undefined;
  onOpenApprovalInbox?: (() => void) | undefined;
  onOpenFarmRecords?: (() => void) | undefined;
  onOpenVerificationCompliance?: (() => void) | undefined;
  onOpenApplications?: (() => void) | undefined;
  onAddFarmer?: (() => void) | undefined;
}

export function SuperAdminFarmersManagementScreen({
  can,
  role = 'SUPER_ADMIN',
  onBack,
  onSelectFarmer,
  onOpenAllFarmers: _onOpenAllFarmers,
  onOpenSubscriptionOverview,
  onOpenApprovalInbox,
  onOpenFarmRecords,
  onOpenVerificationCompliance,
  onOpenApplications,
  onAddFarmer,
}: SuperAdminFarmersManagementScreenProps): React.JSX.Element {
  return (
    <AdminAllFarmersScreen
      role={role}
      can={can}
      title="Farmers Management"
      onBack={onBack}
      onSelectFarmer={onSelectFarmer}
      onOpenFarmRecords={onOpenFarmRecords}
      onOpenVerificationCompliance={onOpenVerificationCompliance}
      onOpenApplications={onOpenApplications}
      onAddFarmer={onAddFarmer}
      onOpenApprovalInbox={onOpenApprovalInbox}
      onOpenSubscriptionOverview={onOpenSubscriptionOverview}
    />
  );
}
