/**
 * Farmer Detail (Farmers Management): the team design's 9-tab profile
 * (tofhafarmfin-rbac AdminFarmerDetailScreen) on live data.
 *
 * This file is the shell: access, the queries, the active tab, the sub-views
 * (Edit Rating, inline Edit Profile) and the design modals. Each tab, the
 * header and the modals live in ./detail/, and every decision they draw is a
 * pure function in ./detail/model.ts (tests: farmerDetail_model.test.ts,
 * farmerDetail_wiring.test.ts).
 *
 * Access is the `can` prop (permissions/can.ts), code-only and FAIL CLOSED:
 * no `can` means nothing is permitted. Without `farmer.profile.view_all` the
 * screen shows a neutral not-available state and no query is given an id, so
 * nothing is fetched. Scope is server-side (BR-108a): a farmer outside the
 * caller's scope is a 404, shown as "not found"; nothing filters by zone.
 *
 * Backward compatible with the Dev mounts (roles/farmer/App.tsx, the Super
 * and Tohfa dashboards): `farmer` is still accepted, but only its `id` is used;
 * the profile itself always comes from GET /admin/farmers/{id}. `onDisable` is
 * still accepted but never called: Disable/Deactivate are DESIGN-ONLY until an
 * endpoint exists.
 *
 * Dev behaviour kept: the Android BackHandler, the mobile-ui ScreenStatusBar /
 * SafeAreaView wrappers, the locked mobile and masked Aadhaar rows, the rating
 * tier capsule and the "Open Farm Map" button.
 */
import React, { useEffect, useReducer, useState } from 'react';
import { BackHandler, RefreshControl, ScrollView, TouchableOpacity, Text, View } from 'react-native';
import { SafeAreaView, ScreenStatusBar } from '@tohfa/mobile-ui';
import {
  useFarmer,
  useFarmerBankAccounts,
  useFarmerDocuments,
  useFarmerRating,
  useFarmerSubscription,
  useVerifyFarmerDocument,
} from '../../api/farmerHooks';
import { t } from '../../i18n';
import type { Can } from '../../permissions/can';
import { adminColors } from '../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';
import { AdminEditFarmerScreen } from './AdminEditFarmerScreen';
import { AccountModals } from './detail/AccountModals';
import { DetailTabBar, HeaderBanner, ProfileSummaryCard } from './detail/DetailHeader';
import { EditRatingView } from './detail/EditRatingView';
import { FarmLandTab } from './detail/FarmLandTab';
import { EditBoxIcon } from './detail/icons';
import { KycTab } from './detail/KycTab';
import {
  DESIGN_ACTION_IDLE,
  designActionReducer,
  farmerDetailAccess,
  farmerDetailFetchIds,
  farmerDetailViewState,
  normalizeDetailTab,
  type DesignActionKind,
  type FarmerDetailTab,
  type FarmerDetailTabType,
} from './detail/model';
import { AuditTab, HistoryTab, ProductListingTab, SoilTab, SubscriptionTab } from './detail/OtherTabs';
import { PersonalTab } from './detail/PersonalTab';
import { RatingsTab } from './detail/RatingsTab';
import { RecordModals } from './detail/RecordModals';
import { detailStyles as s } from './detail/styles';

export type { FarmerDetailTab, FarmerDetailTabType } from './detail/model';

/** What a caller already holds about the farmer (e.g. a list row). Only the id is read. */
export interface AdminFarmerRef {
  id: string;
}

export interface AdminFarmerDetailScreenProps {
  /** The farmer uuid. Takes precedence over `farmer.id`. */
  farmerId?: string | undefined;
  /** Kept for the existing mounts: only `farmer.id` is used, never its other (fixture) fields. */
  farmer?: AdminFarmerRef | undefined;
  /** The caller's warehouse, for the query keys (BR-30); scope itself is server-side. */
  warehouseId?: string | undefined;
  /** Permission check (permissions/can.ts). Missing => nothing is permitted. */
  can?: Can | undefined;
  onBack: () => void;
  /** Opens the edit screen; without it the edit form opens inline (as in the design). */
  onEdit?: ((currentTab: FarmerDetailTabType) => void) | undefined;
  /** Accepted for compatibility; never called (Disable is DESIGN-ONLY, no endpoint yet). */
  onDisable?: (() => void) | undefined;
  onOpenFarmMap?: (() => void) | undefined;
  onOpenKycReview?: (() => void) | undefined;
  onOpenRatingScorecard?: (() => void) | undefined;
  initialTab?: FarmerDetailTabType | undefined;
  onTabChange?: ((tab: FarmerDetailTabType) => void) | undefined;
  /** Accepted for compatibility with the design's prop list; the Audit tab has no history link yet. */
  onNavigateAuditHistory?: (() => void) | undefined;
}

export function AdminFarmerDetailScreen({
  farmerId: farmerIdProp,
  farmer: farmerRef,
  warehouseId,
  can,
  onBack,
  onEdit,
  onOpenFarmMap,
  onOpenKycReview,
  onOpenRatingScorecard,
  initialTab,
  onTabChange,
}: AdminFarmerDetailScreenProps) {
  const farmerId = farmerIdProp ?? farmerRef?.id;
  const access = farmerDetailAccess(can);
  const ids = farmerDetailFetchIds(access, farmerId);

  const live = useFarmer(warehouseId, ids.farmer);
  const documents = useFarmerDocuments(warehouseId, ids.documents);
  const bank = useFarmerBankAccounts(warehouseId, ids.bankAccounts);
  const subscription = useFarmerSubscription(warehouseId, ids.subscription);
  const rating = useFarmerRating(warehouseId, ids.rating);
  const verify = useVerifyFarmerDocument(ids.documents);

  const [activeTab, setActiveTab] = useState<FarmerDetailTab>(normalizeDetailTab(initialTab));
  const [editingRating, setEditingRating] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [designAction, dispatch] = useReducer(designActionReducer, DESIGN_ACTION_IDLE);

  useEffect(() => {
    setActiveTab(normalizeDetailTab(initialTab));
  }, [initialTab]);

  // Dev behaviour: the Android back button leaves the sub-view first, then the screen.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (editingRating) setEditingRating(false);
      else onBack();
      return true;
    });
    return () => sub.remove();
  }, [onBack, editingRating]);

  const selectTab = (tab: FarmerDetailTab) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  const openDesignAction = (kind: DesignActionKind, record: string) => dispatch({ type: 'open', kind, record });

  // A disabled query must never be refetched (TanStack's refetch ignores `enabled`): refresh only what is permitted.
  const refreshAll = () => {
    if (ids.farmer !== undefined) live.refresh();
    if (ids.documents !== undefined) documents.refresh();
    if (ids.bankAccounts !== undefined) bank.refresh();
    if (ids.subscription !== undefined) subscription.refresh();
    if (ids.rating !== undefined) rating.refresh();
  };

  const view = farmerDetailViewState({
    canView: access.canView,
    hasFarmerId: farmerId !== undefined,
    isLoading: live.isLoading,
    error: live.error,
    hasFarmer: live.farmer !== undefined,
  });
  const farmer = live.farmer;

  if (editingProfile && access.canEdit && farmerId !== undefined) {
    return (
      <AdminEditFarmerScreen
        farmerId={farmerId}
        warehouseId={warehouseId}
        can={can}
        initialTab={activeTab}
        onBack={() => setEditingProfile(false)}
        onSaved={() => setEditingProfile(false)}
      />
    );
  }

  if (view === 'ready' && farmer !== undefined && editingRating && access.canEditRating) {
    return (
      <SafeAreaView style={s.root}>
        <EditRatingView farmer={farmer} rating={rating.rating} onBack={() => setEditingRating(false)} />
      </SafeAreaView>
    );
  }

  const isRatings = activeTab === 'Ratings';
  const showEdit = access.canEdit && !isRatings && farmer !== undefined;
  const showRatingBar = view === 'ready' && isRatings && access.canEditRating;

  return (
    <SafeAreaView style={s.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      <HeaderBanner
        title={isRatings ? t('farmerDetail.header.rating') : t('farmerDetail.header.profile')}
        subtitle={isRatings && farmer !== undefined ? t('farmerDetail.header.subtitle', { name: farmer.name, code: farmer.farmerCode }) : undefined}
        onBack={onBack}
        onEdit={showEdit ? () => (onEdit !== undefined ? onEdit(activeTab) : setEditingProfile(true)) : undefined}
      />

      {view !== 'ready' || farmer === undefined ? (
        <ScrollView style={s.scroll} contentContainerStyle={[s.scrollContent, s.stateWrap]}>
          {view === 'denied' ? (
            <AdminEmptyState title={t('farmerDetail.state.denied')} />
          ) : view === 'notFound' ? (
            <AdminEmptyState title={t('farmerDetail.state.notFound')} />
          ) : view === 'error' ? (
            <AdminErrorState error={live.error} onRetry={live.refresh} />
          ) : (
            <AdminLoadingState />
          )}
        </ScrollView>
      ) : (
        <ScrollView
          style={s.scroll}
          contentContainerStyle={[s.scrollContent, showRatingBar && s.scrollContentWithBar]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={live.isRefreshing} onRefresh={refreshAll} tintColor={adminColors.brand} />}
        >
          <ProfileSummaryCard farmer={farmer} onOpenKycReview={onOpenKycReview} onOpenRatingScorecard={onOpenRatingScorecard} />
          <DetailTabBar active={activeTab} onSelect={selectTab} />

          {activeTab === 'Personal' ? (
            <PersonalTab
              farmer={farmer}
              access={access}
              onDeactivate={() => openDesignAction('deactivate', farmer.name)}
              onDisable={() => openDesignAction('disable', farmer.name)}
            />
          ) : null}
          {activeTab === 'Farm & land' ? (
            <FarmLandTab farmer={farmer} access={access} onDesignAction={openDesignAction} onOpenFarmMap={onOpenFarmMap} />
          ) : null}
          {activeTab === 'Soil' ? <SoilTab farmer={farmer} access={access} onDesignAction={openDesignAction} /> : null}
          {activeTab === 'Product listing' ? <ProductListingTab /> : null}
          {activeTab === 'KYC' ? <KycTab access={access} documents={documents} bank={bank} verify={verify} /> : null}
          {activeTab === 'Ratings' ? <RatingsTab farmer={farmer} access={access} live={rating} /> : null}
          {activeTab === 'Subscription' ? <SubscriptionTab access={access} live={subscription} /> : null}
          {activeTab === 'Audit' ? <AuditTab farmer={farmer} /> : null}
          {activeTab === 'History' ? <HistoryTab /> : null}
        </ScrollView>
      )}

      {showRatingBar ? (
        <View style={s.bottomBar}>
          <TouchableOpacity
            style={s.bottomBarButton}
            onPress={() => setEditingRating(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('farmerDetail.rating.edit')}
          >
            <EditBoxIcon />
            <Text style={s.bottomBarButtonText}>{t('farmerDetail.rating.edit')}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {farmer !== undefined ? (
        <>
          {access.canDeactivate || access.canDisable ? <AccountModals farmer={farmer} state={designAction} dispatch={dispatch} /> : null}
          {access.canUseRecordDesignActions ? <RecordModals state={designAction} dispatch={dispatch} /> : null}
        </>
      ) : null}
    </SafeAreaView>
  );
}
