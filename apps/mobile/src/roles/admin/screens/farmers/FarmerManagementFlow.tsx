import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { type Can } from '../../permissions/can';
import {
  AdminAllFarmersScreen,
  type ApplicationListItem,
  type FarmerListItem,
  DEMO_ALL_FARMERS,
} from './AdminAllFarmersScreen';
import { AdminFarmerDetailScreen, type FarmerDetailTabType } from './AdminFarmerDetailScreen';
import { AdminFarmMapScreen } from './AdminFarmMapScreen';
import { AdminRatingScorecardScreen } from './AdminRatingScorecardScreen';
import { AdminEditRatingCategoriesScreen } from './AdminEditRatingCategoriesScreen';
import { AdminEditFarmerScreen } from './AdminEditFarmerScreen';
import { AdminComplianceTiersScreen } from '../certifications/AdminComplianceTiersScreen';
import { AdminCertVerificationScreen } from '../certifications/AdminCertVerificationScreen';
import { AuditDetailRecordScreen } from '../audits/AuditDetailRecordScreen';
import {
  FarmerAuditHistoryScreen,
  type AuditHistoryRecord,
} from '../audits/FarmerAuditHistoryScreen';
import { AdminApplicationDetailScreen } from '../registration/AdminApplicationDetailScreen';
import { SuperAdminFarmersManagementScreen } from './SuperAdminFarmersManagementScreen';
import {
  SuperAdminVerificationComplianceScreen,
  type ComplianceFarmer,
} from './SuperAdminVerificationComplianceScreen';
import { SuperAdminFarmRecordsListScreen } from './SuperAdminFarmRecordsListScreen';

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
  | 'compliance_tiers';

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
  const [allFarmersStatusFilter, setAllFarmersStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [allFarmersShowFilter, setAllFarmersShowFilter] = useState(false);

  useEffect(() => {
    onSubViewChange?.(subView);
  }, [subView, onSubViewChange]);

  const isSuperAdmin = role === 'SUPER_ADMIN';
  const hasPermission = (perm: string) => isSuperAdmin || (can ? can(perm) : false);

  const handleSelectFarmer = (farmer: FarmerListItem) => {
    setSelectedFarmer(farmer);
    setFarmerDetailInitialTab('Personal');
    setFarmerDetailReturnView('overview');
    setSubView('farmer_detail');
  };

  const matchComplianceFarmer = (cFarmer: ComplianceFarmer): FarmerListItem => {
    const base =
      DEMO_ALL_FARMERS.find(
        (f) =>
          f.code === cFarmer.farmerId ||
          (f as any).farmerId === cFarmer.farmerId ||
          f.name.toLowerCase() === cFarmer.name.toLowerCase() ||
          f.id === cFarmer.id,
      ) ?? DEMO_ALL_FARMERS[0]!;
    const initials = cFarmer.name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    const numericRating = parseFloat(cFarmer.ratingScore);
    return {
      ...base,
      id: cFarmer.id,
      name: cFarmer.name,
      initials: initials || base.initials || 'FA',
      code: cFarmer.farmerId,
      location: cFarmer.zone,
      zone: cFarmer.zone,
      farmingType: cFarmer.certificationType,
      kycVerifiedText: cFarmer.kycStatus === 'Verified' ? 'KYC Verified' : cFarmer.kycStatus,
      rating: Number.isFinite(numericRating)
        ? Math.min(5, Math.max(1, Number((numericRating / 20).toFixed(1))))
        : (base.rating ?? null),
    };
  };

  const handleViewCompliance = (cFarmer: ComplianceFarmer) => {
    if (!hasPermission('certification.view') && !hasPermission('farmer.document.verify')) return;
    setSelectedComplianceMeta(cFarmer);
    setSelectedFarmer(matchComplianceFarmer(cFarmer));
    setFarmerDetailInitialTab('Verification & Compliance');
    setFarmerDetailReturnView('compliance');
    setSubView('farmer_detail');
  };

  const handleViewCertificate = (cFarmer: ComplianceFarmer) => {
    if (
      !hasPermission('farmer.document.view') &&
      !hasPermission('farmer.document.verify') &&
      !hasPermission('certification.view')
    ) {
      return;
    }
    setSelectedComplianceMeta(cFarmer);
    setSelectedFarmer(matchComplianceFarmer(cFarmer));
    setFarmerDetailInitialTab('KYC');
    setFarmerDetailReturnView('compliance');
    setSubView('farmer_detail');
  };

  const handleViewRatingDetails = (cFarmer: ComplianceFarmer) => {
    if (!hasPermission('farmer.rating.view') && !hasPermission('farmer.profile.view_all')) return;
    setSelectedComplianceMeta(cFarmer);
    setSelectedFarmer(matchComplianceFarmer(cFarmer));
    setFarmerDetailInitialTab('Ratings');
    setFarmerDetailReturnView('compliance');
    setSubView('farmer_detail');
  };

  const handleViewAuditRecord = (cFarmer: ComplianceFarmer) => {
    if (!hasPermission('audit.view') && !hasPermission('farmer.profile.view_all')) return;
    setSelectedComplianceMeta(cFarmer);
    setSelectedFarmer(matchComplianceFarmer(cFarmer));
    setFarmerDetailInitialTab('Farmer Records');
    setFarmerDetailReturnView('compliance');
    setSubView('farmer_detail');
  };

  const handleViewHistory = (cFarmer: ComplianceFarmer) => {
    if (!hasPermission('audit.view') && !hasPermission('farmer.profile.view_all')) return;
    setSelectedComplianceMeta(cFarmer);
    setSelectedFarmer(matchComplianceFarmer(cFarmer));
    setFarmerDetailInitialTab('History');
    setFarmerDetailReturnView('compliance');
    setSubView('farmer_detail');
  };

  if (subView === 'records_list') {
    return (
      <SuperAdminFarmRecordsListScreen
        onBack={() => setSubView('overview')}
        onSelectRecord={(farmer) => {
          setSelectedFarmer(farmer);
          setFarmerDetailInitialTab('Farmer Records');
          setFarmerDetailReturnView('records_list');
          setSubView('farmer_detail');
        }}
      />
    );
  }

  if (subView === 'records') {
    return (
      <AdminFarmerDetailScreen
        farmer={selectedFarmer ?? DEMO_ALL_FARMERS[0]}
        initialTab="Farmer Records"
        can={can}
        role={role}
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
    return (
      <AuditDetailRecordScreen
        farmerName={selectedFarmer.name}
        farmId={selectedFarmer.code ?? selectedFarmer.id ?? 'FMR-00124'}
        quarterTitle={selectedAuditRecord?.title ?? `Q2 2026 Audit — ${selectedComplianceMeta?.ratingScore ?? '82/100'}`}
        date={selectedAuditRecord?.date ?? selectedComplianceMeta?.lastUpdated ?? '26 Oct 2026'}
        auditor={selectedAuditRecord?.auditor ?? 'AgriCert Co.'}
        type={selectedAuditRecord?.type ?? selectedComplianceMeta?.certificationType ?? 'Internal'}
        score={selectedComplianceMeta?.ratingScore ?? '82 / 100'}
        record={selectedAuditRecord}
        onBack={() => setSubView(auditRecordReturnView)}
      />
    );
  }

  if (subView === 'audit_history' && selectedFarmer) {
    return (
      <FarmerAuditHistoryScreen
        farmerName={selectedFarmer.name}
        farmId={selectedFarmer.code ?? selectedFarmer.id ?? 'FMR-00124'}
        zone={selectedFarmer.location ?? 'Coonoor, Nilgiris'}
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

  if (subView === 'add_farmer' || (subView === 'edit_farmer' && selectedFarmer)) {
    return (
      <AdminEditFarmerScreen
        farmer={selectedFarmer ?? DEMO_ALL_FARMERS[0]!}
        isAdd={subView === 'add_farmer'}
        role={role}
        can={can}
        onBack={() => setSubView(selectedFarmer ? 'farmer_detail' : 'overview')}
        onSave={(_updated) => setSubView(selectedFarmer ? 'farmer_detail' : 'overview')}
      />
    );
  }

  if (subView === 'application_detail' && selectedApplication) {
    return (
      <AdminApplicationDetailScreen
        application={selectedApplication}
        onBack={() => {
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
        role={role}
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

  // Primary entry screen:
  // For SUPER_ADMIN, display SuperAdminFarmersManagementScreen (matching Image 2 Screen 1)
  // For other roles, mount the standard AdminAllFarmersScreen
  if (role === 'SUPER_ADMIN') {
    return (
      <SuperAdminFarmersManagementScreen
        can={can}
        role={role}
        onBack={onBack}
        onSelectFarmer={handleSelectFarmer}
        onOpenAllFarmers={(statusFilter = 'All', showFilter = false) => {
          setAllFarmersStatusFilter(statusFilter);
          setAllFarmersShowFilter(showFilter);
          setSubView('all_farmers');
        }}
        onOpenSubscriptionOverview={() => {
          setSelectedFarmer(DEMO_ALL_FARMERS[0] ?? null);
          setFarmerDetailInitialTab('Subscription');
          setFarmerDetailReturnView('overview');
          setSubView('farmer_detail');
        }}
        onOpenApprovalInbox={onOpenApprovalInbox}
        onOpenFarmRecords={() => setSubView('records_list')}
        onOpenVerificationCompliance={() => setSubView('compliance')}
        onOpenApplications={() => setSubView('applications')}
        onAddFarmer={() => setSubView('add_farmer')}
      />
    );
  }

  return (
    <AdminAllFarmersScreen
      showBottomNav={false}
      onBack={onBack}
      onSelectFarmer={handleSelectFarmer}
      onReviewApplication={(app) => {
        setSelectedApplication(app);
        setSubView('application_detail');
      }}
    />
  );
}
