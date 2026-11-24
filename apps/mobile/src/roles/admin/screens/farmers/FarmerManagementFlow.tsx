import React, { useEffect, useMemo, useState } from 'react';
import { type Can } from '../../permissions/can';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { useFarmerList } from '../../api/farmerHooks';
import {
  AdminAllFarmersScreen,
  type ApplicationListItem,
  type FarmerListItem,
} from './AdminAllFarmersScreen';
import { toDesignFarmerItem } from './allFarmersMappers';
import { AdminFarmerDetailScreen, type FarmerDetailTabType } from './AdminFarmerDetailScreen';
import { AdminFarmMapScreen } from './AdminFarmMapScreen';
import { AdminRatingScorecardScreen } from './AdminRatingScorecardScreen';
import { AdminEditRatingCategoriesScreen } from './AdminEditRatingCategoriesScreen';
import { AdminEditFarmerScreen } from './AdminEditFarmerScreen';
import { AdminAddFarmerScreen } from './AdminAddFarmerScreen';
import { AdminComplianceTiersScreen } from '../certifications/AdminComplianceTiersScreen';
import { AdminCertVerificationScreen } from '../certifications/AdminCertVerificationScreen';
import { AuditDetailRecordScreen } from '../audits/AuditDetailRecordScreen';
import {
  FarmerAuditHistoryScreen,
  type AuditHistoryRecord,
} from '../audits/FarmerAuditHistoryScreen';
import { AdminApplicationDetailScreen } from '../registration/AdminApplicationDetailScreen';
import {
  SuperAdminVerificationComplianceScreen,
  type ComplianceFarmer,
} from './SuperAdminVerificationComplianceScreen';
import { SuperAdminFarmRecordsListScreen } from './SuperAdminFarmRecordsListScreen';
import { FarmerBankAccountDetailsScreen } from './FarmerBankAccountDetailsScreen';
import { FarmerPayoutDetailScreen, type PayoutDetailItem } from './FarmerPayoutDetailScreen';

export type FarmerManagementSubView =
  | 'overview'
  | 'all_farmers'
  | 'compliance'
  | 'records_list'
  | 'records'
  | 'applications'
  | 'application_detail'
  | 'farmer_detail'
  | 'map'
  | 'scorecard'
  | 'edit_rating_categories'
  | 'cert_verification'
  | 'audit_record'
  | 'audit_history'
  | 'edit_farmer'
  | 'add_farmer'
  | 'compliance_tiers'
  | 'payout_bank_details'
  | 'payout_detail';

export interface FarmerManagementFlowProps {
  can?: Can | undefined;
  role?: string | undefined;
  userScope?: unknown;
  onBack?: (() => void) | undefined;
  initialTab?: 'farmers' | 'applications' | undefined;
  onNavigateTab?: ((tab: string) => void) | undefined;
  initialSubScreen?: FarmerManagementSubView | undefined;
  initialFarmer?: FarmerListItem | undefined;
  onSubViewChange?: ((subView: FarmerManagementSubView) => void) | undefined;
  onOpenApprovalInbox?: (() => void) | undefined;
}

export function FarmerManagementFlow({
  can,
  role,
  userScope,
  onBack,
  initialTab,
  onNavigateTab: _onNavigateTab,
  initialSubScreen,
  initialFarmer,
  onSubViewChange,
  onOpenApprovalInbox,
}: FarmerManagementFlowProps): React.JSX.Element {
  const [subView, setSubView] = useState<FarmerManagementSubView>(
    initialSubScreen ?? (initialTab === 'applications' ? 'applications' : 'overview'),
  );
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerListItem | null>(
    initialFarmer ?? null,
  );
  const [selectedApplication, setSelectedApplication] = useState<ApplicationListItem | null>(null);
  const [farmerDetailInitialTab, setFarmerDetailInitialTab] =
    useState<FarmerDetailTabType>('Personal');
  const [farmerDetailReturnView, setFarmerDetailReturnView] =
    useState<FarmerManagementSubView>('overview');
  const [scorecardReturnView, setScorecardReturnView] =
    useState<FarmerManagementSubView>('farmer_detail');
  const [auditHistoryReturnView, setAuditHistoryReturnView] =
    useState<FarmerManagementSubView>('compliance');
  const [auditRecordReturnView, setAuditRecordReturnView] =
    useState<FarmerManagementSubView>('compliance');
  const [selectedAuditRecord, setSelectedAuditRecord] = useState<AuditHistoryRecord | null>(null);
  const [selectedComplianceMeta, setSelectedComplianceMeta] = useState<ComplianceFarmer | null>(null);
  const [selectedPayout, _setSelectedPayout] = useState<PayoutDetailItem | null>(null);
  const [allFarmersStatusFilter, _setAllFarmersStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [allFarmersShowFilter, setAllFarmersShowFilter] = useState(false);

  useEffect(() => {
    onSubViewChange?.(subView);
  }, [subView, onSubViewChange]);

  const isSuperAdmin = role === 'SUPER_ADMIN';
  const hasPermission = (perm: string) => isSuperAdmin || (can ? can(perm) : false);

  const warehouseId = (userScope as { warehouseId?: string } | undefined)?.warehouseId;
  const farmerListQuery = useFarmerList(warehouseId);
  // The live rows through the honest mapper (what the API sent, or an absent field): no fixture, no guessed rating, tier or farm name.
  const allFarmers: FarmerListItem[] = useMemo(
    () => farmerListQuery.items.map(toDesignFarmerItem),
    [farmerListQuery.items],
  );

  const handleSelectFarmer = (farmer: FarmerListItem) => {
    setSelectedFarmer(farmer);
    setFarmerDetailInitialTab('Personal');
    setFarmerDetailReturnView('overview');
    setSubView('farmer_detail');
  };

  /**
   * Opens a farmer's detail from a compliance card. The card carries the real
   * farmer id, so the live farmer is looked up, not rebuilt from the card's
   * display strings; a card whose farmer is no longer loaded opens nothing.
   */
  const openFromCompliance = (cFarmer: ComplianceFarmer, tab: FarmerDetailTabType) => {
    const live = allFarmers.find((f) => f.id === cFarmer.id);
    if (live === undefined) return;
    setSelectedComplianceMeta(cFarmer);
    setSelectedFarmer(live);
    setFarmerDetailInitialTab(tab);
    setFarmerDetailReturnView('compliance');
    setSubView('farmer_detail');
  };

  const handleViewCompliance = (cFarmer: ComplianceFarmer) => {
    if (!hasPermission('certification.view') && !hasPermission('farmer.document.verify')) return;
    openFromCompliance(cFarmer, 'Verification & Compliance');
  };

  const handleViewCertificate = (cFarmer: ComplianceFarmer) => {
    if (
      !hasPermission('farmer.document.view') &&
      !hasPermission('farmer.document.verify') &&
      !hasPermission('certification.view')
    ) {
      return;
    }
    openFromCompliance(cFarmer, 'KYC');
  };

  const handleViewRatingDetails = (cFarmer: ComplianceFarmer) => {
    if (!hasPermission('farmer.rating.view') && !hasPermission('farmer.profile.view_all')) return;
    openFromCompliance(cFarmer, 'Ratings');
  };

  const handleViewAuditRecord = (cFarmer: ComplianceFarmer) => {
    if (!hasPermission('audit.view') && !hasPermission('farmer.profile.view_all')) return;
    openFromCompliance(cFarmer, 'Farmer Records');
  };

  const handleViewHistory = (cFarmer: ComplianceFarmer) => {
    if (!hasPermission('audit.view') && !hasPermission('farmer.profile.view_all')) return;
    openFromCompliance(cFarmer, 'History');
  };

  if (subView === 'records_list') {
    return (
      <SuperAdminFarmRecordsListScreen
        farmers={allFarmers}
        isLoading={farmerListQuery.isLoading}
        error={farmerListQuery.error}
        onRetry={farmerListQuery.refresh}
        onBack={() => setSubView('overview')}
        onSelectRecord={(farmer) => {
          setSelectedFarmer(farmer);
          setFarmerDetailInitialTab('Farmer Records');
          setFarmerDetailReturnView('records_list');
          setSubView('farmer_detail');
        }}
        onAddRecord={() => setSubView('add_farmer')}
      />
    );
  }

  if (subView === 'records' && selectedFarmer) {
    return (
      <AdminFarmerDetailScreen
        farmer={selectedFarmer}
        initialTab="Farmer Records"
        can={can}
        onBack={() => setSubView('overview')}
        onOpenFarmMap={() => setSubView('map')}
        onOpenRatingScorecard={() => {
          setScorecardReturnView('records');
          setSubView('scorecard');
        }}
        onNavigateAuditHistory={() => {
          setAuditHistoryReturnView('records');
          setSubView('audit_history');
        }}
        onEdit={() => setSubView('edit_farmer')}
      />
    );
  }

  if (subView === 'compliance') {
    return (
      <SuperAdminVerificationComplianceScreen
        can={can}
        role={role}
        farmers={farmerListQuery.items}
        isLoading={farmerListQuery.isLoading}
        error={farmerListQuery.error}
        onRetry={farmerListQuery.refresh}
        hasMore={farmerListQuery.hasMore}
        warehouseId={warehouseId}
        onBack={() => setSubView('overview')}
        onViewCompliance={handleViewCompliance}
        onViewCertificate={handleViewCertificate}
        onViewRatingDetails={handleViewRatingDetails}
        onViewAuditRecord={handleViewAuditRecord}
        onViewHistory={handleViewHistory}
      />
    );
  }

  if (subView === 'cert_verification' && selectedFarmer) {
    return (
      <AdminCertVerificationScreen
        farmer={selectedFarmer}
        onBack={() => setSubView('compliance')}
      />
    );
  }

  if (subView === 'audit_record' && selectedFarmer) {
    // The compliance card's score only belongs to the farmer it was read for.
    const meta = selectedComplianceMeta?.id === selectedFarmer.id ? selectedComplianceMeta : null;
    return (
      <AuditDetailRecordScreen
        farmerName={selectedFarmer.name}
        farmId={selectedFarmer.code ?? selectedFarmer.id}
        quarterTitle={selectedAuditRecord?.title ?? ADMIN_NO_VALUE}
        date={selectedAuditRecord?.date ?? ADMIN_NO_VALUE}
        auditor={selectedAuditRecord?.auditor ?? ADMIN_NO_VALUE}
        type={selectedAuditRecord?.type ?? ADMIN_NO_VALUE}
        score={meta?.ratingScore ?? ADMIN_NO_VALUE}
        record={selectedAuditRecord}
        onBack={() => setSubView(auditRecordReturnView)}
      />
    );
  }

  if (subView === 'audit_history' && selectedFarmer) {
    return (
      <FarmerAuditHistoryScreen
        farmerName={selectedFarmer.name}
        farmId={selectedFarmer.code ?? selectedFarmer.id}
        zone={selectedFarmer.location ?? ADMIN_NO_VALUE}
        onBack={() => setSubView(auditHistoryReturnView)}
        onSelectAuditRecord={(rec) => {
          setSelectedAuditRecord(rec);
          setAuditRecordReturnView('audit_history');
          setSubView('audit_record');
        }}
      />
    );
  }

  if (subView === 'compliance_tiers') {
    return (
      <AdminComplianceTiersScreen
        onBack={() => setSubView(selectedFarmer ? 'scorecard' : 'compliance')}
      />
    );
  }

  if (subView === 'map' && selectedFarmer) {
    return (
      <AdminFarmMapScreen
        farmer={selectedFarmer}
        onBack={() => setSubView('farmer_detail')}
      />
    );
  }

  if (subView === 'scorecard' && selectedFarmer) {
    return (
      <AdminRatingScorecardScreen
        farmer={selectedFarmer}
        onBack={() => setSubView(scorecardReturnView)}
        onOpenComplianceTiers={() => setSubView('compliance_tiers')}
        onEditCategories={() => setSubView('edit_rating_categories')}
      />
    );
  }

  if (subView === 'edit_rating_categories' && selectedFarmer) {
    return (
      <AdminEditRatingCategoriesScreen
        farmer={selectedFarmer}
        onBack={() => setSubView('scorecard')}
        onSave={() => setSubView('scorecard')}
      />
    );
  }

  if (subView === 'payout_bank_details' && selectedFarmer) {
    return (
      <FarmerBankAccountDetailsScreen
        farmerName={selectedFarmer.name}
        farmerId={selectedFarmer.code ?? selectedFarmer.id}
        role={role}
        can={can}
        onBack={() => setSubView('farmer_detail')}
      />
    );
  }

  if (subView === 'payout_detail' && selectedFarmer) {
    return (
      <FarmerPayoutDetailScreen
        payout={selectedPayout ?? undefined}
        farmerName={selectedFarmer.name}
        farmerId={selectedFarmer.code ?? selectedFarmer.id}
        role={role}
        onBack={() => setSubView('farmer_detail')}
      />
    );
  }

  if (subView === 'add_farmer') {
    return (
      <AdminAddFarmerScreen
        onBack={() => setSubView('overview')}
        onCreated={(f) => {
          // Only what the server sent: a farmer just created has no rating yet, so the dash, not a starting score or tier.
          setSelectedFarmer({
            id: f.id,
            code: f.tohfaFarmerId,
            name: f.fullName,
            initials: f.fullName.slice(0, 2).toUpperCase(),
            location: f.address.village ?? ADMIN_NO_VALUE,
            status: f.accountStatus,
            rating: f.rating.overallRating,
            ...(f.rating.ratingTier === null ? {} : { ratingTier: f.rating.ratingTier.label }),
          });
          setFarmerDetailInitialTab('Personal');
          setFarmerDetailReturnView('overview');
          setSubView('farmer_detail');
        }}
      />
    );
  }

  if (subView === 'edit_farmer' && selectedFarmer) {
    return (
      <AdminEditFarmerScreen
        farmer={selectedFarmer}
        can={can}
        onBack={() => setSubView('farmer_detail')}
        onSave={(_updated) => setSubView('farmer_detail')}
      />
    );
  }

  if (subView === 'application_detail' && selectedApplication) {
    return (
      <AdminApplicationDetailScreen
        applicationId={selectedApplication.id}
        can={can}
        onBack={() => {
          setSelectedApplication(null);
          setSubView('applications');
        }}
        onApprove={() => {
          setSelectedApplication(null);
          setSubView('applications');
        }}
        onReject={() => {
          setSelectedApplication(null);
          setSubView('applications');
        }}
      />
    );
  }

  if (subView === 'all_farmers') {
    return (
      <AdminAllFarmersScreen
        showBottomNav={false}
        initialTab="farmers"
        initialStatusFilter={allFarmersStatusFilter}
        initialShowFilter={allFarmersShowFilter}
        can={can}
        role={role}
        userScope={userScope as { zoneId?: string; warehouseId?: string } | undefined}
        onBack={() => {
          setAllFarmersShowFilter(false);
          setSubView('overview');
        }}
        onSelectFarmer={(farmer) => {
          setSelectedFarmer(farmer);
          setFarmerDetailInitialTab('Personal');
          setFarmerDetailReturnView('all_farmers');
          setSubView('farmer_detail');
        }}
        onReviewApplication={(app) => {
          setSelectedApplication(app);
          setSubView('application_detail');
        }}
      />
    );
  }

  if (subView === 'applications') {
    return (
      <AdminAllFarmersScreen
        showBottomNav={false}
        initialTab="applications"
        onBack={() => setSubView('overview')}
        onSelectFarmer={handleSelectFarmer}
        onReviewApplication={(app) => {
          setSelectedApplication(app);
          setSubView('application_detail');
        }}
      />
    );
  }

  if (subView === 'farmer_detail' && selectedFarmer) {
    return (
      <AdminFarmerDetailScreen
        farmer={selectedFarmer}
        initialTab={farmerDetailInitialTab}
        can={can}
        onBack={() => {
          if (farmerDetailReturnView === 'overview') {
            setSelectedFarmer(null);
          }
          setSubView(farmerDetailReturnView);
        }}
        onOpenFarmMap={() => setSubView('map')}
        onOpenRatingScorecard={() => {
          setScorecardReturnView('farmer_detail');
          setSubView('scorecard');
        }}
        onNavigateAuditHistory={() => {
          setAuditHistoryReturnView('farmer_detail');
          setSubView('audit_history');
        }}
        onEdit={() => setSubView('edit_farmer')}
      />
    );
  }

  // Primary entry screen: shared RBAC-driven AdminAllFarmersScreen
  return (
    <AdminAllFarmersScreen
      showBottomNav={false}
      role={role}
      can={can}
      userScope={userScope as { zoneId?: string; warehouseId?: string } | undefined}
      onBack={onBack}
      onSelectFarmer={handleSelectFarmer}
      onReviewApplication={(app) => {
        setSelectedApplication(app);
        setSubView('application_detail');
      }}
      onOpenFarmRecords={() => setSubView('records_list')}
      onOpenVerificationCompliance={() => setSubView('compliance')}
      onOpenApplications={() => setSubView('applications')}
      onAddFarmer={() => setSubView('add_farmer')}
      onOpenApprovalInbox={onOpenApprovalInbox}
      // No farmer is chosen yet, and none is invented: the admin picks one from the live list.
      onOpenSubscriptionOverview={() => setSubView('all_farmers')}
    />
  );
}
