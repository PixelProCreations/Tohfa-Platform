/**
 * Shared Farmers flow (Module 1 phase 3A), rendered with every screen stubbed
 * so the test pins what the flow hands each screen: the REAL row id (never a
 * fixture), the caller's own `can` (never `() => true`), and where back,
 * save and reject lead. The screens themselves are covered by their own tests
 * (farmersList_*, farmerDetail_*, applications_*).
 */
import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';

function stub(name: string) {
  return (props: Record<string, unknown>) => React.createElement(name, props);
}
vi.mock('../screens/farmers/list/FarmersListScreen', () => ({ FarmersListScreen: stub('FarmersList') }));
vi.mock('../screens/farmers/AdminFarmerDetailScreen', () => ({ AdminFarmerDetailScreen: stub('FarmerDetail') }));
vi.mock('../screens/farmers/AdminEditFarmerScreen', () => ({ AdminEditFarmerScreen: stub('EditFarmer') }));
vi.mock('../screens/farmers/AdminFarmMapScreen', () => ({ AdminFarmMapScreen: stub('FarmMap') }));
vi.mock('../screens/farmers/AdminRatingScorecardScreen', () => ({ AdminRatingScorecardScreen: stub('Scorecard') }));
vi.mock('../screens/certifications/AdminKycReviewScreen', () => ({ AdminKycReviewScreen: stub('KycReview') }));
vi.mock('../screens/certifications/AdminCertVerificationScreen', () => ({ AdminCertVerificationScreen: stub('CertVerification') }));
vi.mock('../screens/certifications/AdminComplianceTiersScreen', () => ({ AdminComplianceTiersScreen: stub('ComplianceTiers') }));
vi.mock('../screens/registration/AdminPendingApplicationsScreen', () => ({ AdminPendingApplicationsScreen: stub('PendingApps') }));
vi.mock('../screens/registration/AdminApplicationDetailScreen', () => ({ AdminApplicationDetailScreen: stub('ApplicationDetail') }));
vi.mock('../screens/registration/AdminApplicationRejectScreen', () => ({ AdminApplicationRejectScreen: stub('ApplicationReject') }));
vi.mock('../components/TohfaToast', () => ({ TohfaToast: stub('Toast') }));

import { FarmersFlow } from '../screens/farmers/FarmersFlow';
import { t } from '../i18n';
import { makeCan } from '../permissions/can';

const TOHFA_LIKE = makeCan([
  'farmer.profile.view_all',
  'farmer.profile.edit',
  'farmer.document.view',
  'farmer.rating.view',
  'certification.view',
  'farmer.application.list_pending',
  'farmer.application.view',
]);
const WAREHOUSE_LIKE = makeCan(['farmer.profile.view_all', 'farmer.rating.view']);

const ROW = { id: 'uuid-live-farmer-7', name: 'Live Farmer', farmerCode: 'TOHFA-F-7' };
const LEGACY = { id: 'uuid-live-farmer-7', name: 'Live Farmer', code: 'TOHFA-F-7', initials: 'LF', location: '', status: 'ACTIVE', rating: null };

function mount(el: React.ReactElement): ReactTestRenderer {
  let tree: ReactTestRenderer | undefined;
  act(() => {
    tree = renderer.create(el);
  });
  return tree!;
}

function screen(tree: ReactTestRenderer): ReactTestInstance {
  // Each stub renders one host element named after the screen it stands for.
  const [host] = tree.root.findAll((n) => typeof n.type === 'string');
  expect(host).toBeDefined();
  return host!;
}

interface ToastProp {
  type: string;
  title: string;
  message: string;
}

/** The flow's one toast host (rendered after the screen, so screen() above still finds the screen first). */
function toastHost(tree: ReactTestRenderer): ReactTestInstance {
  const hosts = tree.root.findAll((n) => String(n.type) === 'Toast');
  expect(hosts).toHaveLength(1);
  return hosts[0]!;
}

function shownToast(tree: ReactTestRenderer): ToastProp | null {
  return (toastHost(tree).props['toast'] as ToastProp | null) ?? null;
}

function call(tree: ReactTestRenderer, prop: string, ...args: unknown[]) {
  const fn = screen(tree).props[prop] as ((...a: unknown[]) => void) | undefined;
  expect(fn, `${String(screen(tree).type)}.${prop}`).toBeTypeOf('function');
  act(() => fn!(...args));
}

describe('FarmersFlow: farmers path', () => {
  it('list -> detail passes the REAL row id and the caller\'s own can', () => {
    const tree = mount(<FarmersFlow can={TOHFA_LIKE} onBack={vi.fn()} warehouseId="wh-1" />);
    expect(screen(tree).type).toBe('FarmersList');
    expect(screen(tree).props['can']).toBe(TOHFA_LIKE);
    expect(screen(tree).props['warehouseId']).toBe('wh-1');
    call(tree, 'onSelectFarmer', LEGACY, ROW);
    const detail = screen(tree);
    expect(detail.type).toBe('FarmerDetail');
    expect(detail.props['farmerId']).toBe('uuid-live-farmer-7');
    expect(detail.props['farmerId']).not.toBe('farmer-001');
    expect(detail.props['can']).toBe(TOHFA_LIKE);
    expect(detail.props['warehouseId']).toBe('wh-1');
  });

  it('detail -> edit -> saved returns to the detail on the same tab; edit back also returns', () => {
    const tree = mount(<FarmersFlow can={TOHFA_LIKE} onBack={vi.fn()} />);
    call(tree, 'onSelectFarmer', LEGACY, ROW);
    call(tree, 'onEdit', 'KYC');
    expect(screen(tree).type).toBe('EditFarmer');
    expect(screen(tree).props['farmerId']).toBe('uuid-live-farmer-7');
    expect(screen(tree).props['initialTab']).toBe('KYC');
    call(tree, 'onSaved', {}, 'KYC');
    expect(screen(tree).type).toBe('FarmerDetail');
    expect(screen(tree).props['initialTab']).toBe('KYC');
    call(tree, 'onEdit', 'Personal');
    call(tree, 'onBack');
    expect(screen(tree).type).toBe('FarmerDetail');
  });

  it('back from the detail shows the list again; back from the list leaves the flow', () => {
    const onBack = vi.fn();
    const tree = mount(<FarmersFlow can={TOHFA_LIKE} onBack={onBack} />);
    call(tree, 'onSelectFarmer', LEGACY, ROW);
    call(tree, 'onBack');
    expect(screen(tree).type).toBe('FarmersList');
    expect(onBack).not.toHaveBeenCalled();
    call(tree, 'onBack');
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('the satellite screens get the selected farmer\'s live legacy item, never a fixture', () => {
    const tree = mount(<FarmersFlow can={TOHFA_LIKE} onBack={vi.fn()} />);
    call(tree, 'onSelectFarmer', LEGACY, ROW);
    call(tree, 'onOpenFarmMap');
    expect(screen(tree).type).toBe('FarmMap');
    expect(screen(tree).props['farmer']).toBe(LEGACY);
    call(tree, 'onBack');
    call(tree, 'onOpenKycReview');
    expect(screen(tree).type).toBe('KycReview');
    call(tree, 'onGoToCertificationVerification');
    expect(screen(tree).type).toBe('CertVerification');
    expect(screen(tree).props['farmer']).toBe(LEGACY);
  });

  it('a warehouse-like grant gets no KYC review button (farmer.document.view is not held)', () => {
    const tree = mount(<FarmersFlow can={WAREHOUSE_LIKE} onBack={vi.fn()} />);
    call(tree, 'onSelectFarmer', LEGACY, ROW);
    expect(screen(tree).props['onOpenKycReview']).toBeUndefined();
    expect(screen(tree).props['onOpenRatingScorecard']).toBeTypeOf('function');
    expect(screen(tree).props['onOpenFarmMap']).toBeTypeOf('function');
  });

  it('no rating-edit route is wired (BR-06e)', () => {
    const tree = mount(<FarmersFlow can={TOHFA_LIKE} onBack={vi.fn()} />);
    call(tree, 'onSelectFarmer', LEGACY, ROW);
    call(tree, 'onOpenRatingScorecard');
    expect(screen(tree).type).toBe('Scorecard');
    expect(screen(tree).props['onEditCategories']).toBeUndefined();
  });

  it('passes the list nav through and keeps it off by default', () => {
    const nav = vi.fn();
    const tree = mount(<FarmersFlow can={TOHFA_LIKE} onBack={vi.fn()} />);
    expect(screen(tree).props['showBottomNav']).toBe(false);
    const withNav = mount(<FarmersFlow can={TOHFA_LIKE} onBack={vi.fn()} showBottomNav onNavigateTab={nav} />);
    expect(screen(withNav).props['showBottomNav']).toBe(true);
    expect(screen(withNav).props['onNavigateTab']).toBe(nav);
  });
});

describe('FarmersFlow: applications path', () => {
  it('application -> review (real id) -> reject -> confirmed returns to the list on the applications tab', () => {
    const tree = mount(<FarmersFlow can={TOHFA_LIKE} onBack={vi.fn()} />);
    call(tree, 'onReviewApplication', { id: 'uuid-app-42' });
    expect(screen(tree).type).toBe('ApplicationDetail');
    expect(screen(tree).props['applicationId']).toBe('uuid-app-42');
    expect(screen(tree).props['can']).toBe(TOHFA_LIKE);
    expect(screen(tree).props['onApprove']).toBeUndefined();
    expect(screen(tree).props['onRequestMoreInfo']).toBeUndefined();
    call(tree, 'onReject');
    expect(screen(tree).type).toBe('ApplicationReject');
    expect(screen(tree).props['applicationId']).toBe('uuid-app-42');
    call(tree, 'onConfirmReject', 'reason', 'details', {});
    expect(screen(tree).type).toBe('FarmersList');
    expect(screen(tree).props['initialTab']).toBe('applications');
  });

  it('reject back returns to the review; review back returns to the list', () => {
    const tree = mount(<FarmersFlow can={TOHFA_LIKE} onBack={vi.fn()} />);
    call(tree, 'onReviewApplication', { id: 'uuid-app-42' });
    call(tree, 'onReject');
    call(tree, 'onBack');
    expect(screen(tree).type).toBe('ApplicationDetail');
    call(tree, 'onBack');
    expect(screen(tree).type).toBe('FarmersList');
  });

  it('the pending-queue entry opens the queue; a picked item opens its review by id; back from the queue leaves', () => {
    const onBack = vi.fn();
    const tree = mount(<FarmersFlow can={TOHFA_LIKE} onBack={onBack} entry="pendingApplications" />);
    expect(screen(tree).type).toBe('PendingApps');
    call(tree, 'onSelectApplication', { id: 'uuid-app-5' });
    expect(screen(tree).props['applicationId']).toBe('uuid-app-5');
    call(tree, 'onBack');
    expect(screen(tree).type).toBe('PendingApps');
    call(tree, 'onBack');
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe('FarmersFlow: success toasts (only after the server agreed)', () => {
  it('shows no toast until a screen reports a success', () => {
    const tree = mount(<FarmersFlow can={TOHFA_LIKE} onBack={vi.fn()} />);
    expect(shownToast(tree)).toBeNull();
    call(tree, 'onSelectFarmer', LEGACY, ROW);
    call(tree, 'onEdit', 'Personal');
    // Leaving the form without a save (Cancel, or a refused PATCH that never calls onSaved) shows nothing.
    call(tree, 'onBack');
    expect(shownToast(tree)).toBeNull();
  });

  it("edit saved shows 'Changes Saved' with the saved name, on the detail it returns to", () => {
    const tree = mount(<FarmersFlow can={TOHFA_LIKE} onBack={vi.fn()} />);
    call(tree, 'onSelectFarmer', LEGACY, ROW);
    call(tree, 'onEdit', 'Personal');
    expect(shownToast(tree)).toBeNull();
    call(tree, 'onSaved', { name: 'Lakshmi Devi' }, 'Personal');
    expect(screen(tree).type).toBe('FarmerDetail');
    expect(shownToast(tree)).toEqual({
      type: 'approve',
      title: t('farmersEntry.toast.saved.title'),
      message: t('farmersEntry.toast.saved.message', { name: 'Lakshmi Devi' }),
    });
    expect(t('farmersEntry.toast.saved.title')).toBe('Changes Saved');
  });

  it("approve success shows 'Application Approved' with the applicant's name", () => {
    const tree = mount(<FarmersFlow can={TOHFA_LIKE} onBack={vi.fn()} />);
    call(tree, 'onReviewApplication', { id: 'uuid-app-42' });
    expect(shownToast(tree)).toBeNull();
    call(tree, 'onApproved', { id: 'uuid-app-42', fullName: 'Revathi Selvam', status: 'APPROVED' });
    // The review stays open on its in-place Approved state.
    expect(screen(tree).type).toBe('ApplicationDetail');
    expect(shownToast(tree)).toEqual({
      type: 'approve',
      title: t('farmersEntry.toast.approved.title'),
      message: t('farmersEntry.toast.approved.message', { name: 'Revathi Selvam' }),
    });
    expect(t('farmersEntry.toast.approved.title')).toBe('Application Approved');
  });

  it("reject success returns to the applications list and the 'Application Rejected' toast is still shown there", () => {
    const tree = mount(<FarmersFlow can={TOHFA_LIKE} onBack={vi.fn()} />);
    call(tree, 'onReviewApplication', { id: 'uuid-app-42' });
    call(tree, 'onReject');
    expect(shownToast(tree)).toBeNull();
    call(tree, 'onConfirmReject', 'Duplicate application', 'Already registered.', { id: 'uuid-app-42', fullName: 'Revathi Selvam', status: 'REJECTED' });
    expect(screen(tree).type).toBe('FarmersList');
    expect(screen(tree).props['initialTab']).toBe('applications');
    expect(shownToast(tree)).toEqual({
      type: 'reject',
      title: t('farmersEntry.toast.rejected.title'),
      message: t('farmersEntry.toast.rejected.message', { name: 'Revathi Selvam', reason: 'Duplicate application' }),
    });
    expect(t('farmersEntry.toast.rejected.title')).toBe('Application Rejected');
  });

  it('an applicant with no name on the result gets the nameless wording, never a fixture name', () => {
    const tree = mount(<FarmersFlow can={TOHFA_LIKE} onBack={vi.fn()} />);
    call(tree, 'onReviewApplication', { id: 'uuid-app-42' });
    call(tree, 'onApproved', { id: 'uuid-app-42', fullName: null, status: 'APPROVED' });
    expect(shownToast(tree)?.message).toBe(t('farmersEntry.toast.approved.messageNoName'));
    call(tree, 'onReject');
    call(tree, 'onConfirmReject', 'Other reason', 'x', { id: 'uuid-app-42', fullName: null, status: 'REJECTED' });
    expect(shownToast(tree)?.message).toBe(t('farmersEntry.toast.rejected.messageNoName', { reason: 'Other reason' }));
  });

  it('the toast survives navigation inside the flow and is cleared by its dismiss', () => {
    const tree = mount(<FarmersFlow can={TOHFA_LIKE} onBack={vi.fn()} />);
    call(tree, 'onSelectFarmer', LEGACY, ROW);
    call(tree, 'onEdit', 'Personal');
    call(tree, 'onSaved', { name: 'Lakshmi Devi' }, 'Personal');
    call(tree, 'onBack');
    expect(screen(tree).type).toBe('FarmersList');
    expect(shownToast(tree)?.title).toBe(t('farmersEntry.toast.saved.title'));
    const dismiss = toastHost(tree).props['onDismiss'] as () => void;
    act(() => dismiss());
    expect(shownToast(tree)).toBeNull();
  });

  it('the pending-queue entry hosts the same toast', () => {
    const tree = mount(<FarmersFlow can={TOHFA_LIKE} onBack={vi.fn()} entry="pendingApplications" />);
    call(tree, 'onSelectApplication', { id: 'uuid-app-5' });
    call(tree, 'onReject');
    call(tree, 'onConfirmReject', 'Other reason', 'x', { id: 'uuid-app-5', fullName: 'Revathi Selvam', status: 'REJECTED' });
    expect(screen(tree).type).toBe('PendingApps');
    expect(shownToast(tree)?.type).toBe('reject');
  });
});
