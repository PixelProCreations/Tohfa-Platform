/**
 * AuditManagementFlow's state machine with every child screen stubbed. Pins:
 * management is the default, the real API id of a picked row reaches the
 * detail / form screens, detail opens the inspection overview, back returns
 * to the screen the user came from, and every audit screen the flow owns is
 * reachable from the hub (an export is not wiring).
 */
import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act } from 'react-test-renderer';

const h = vi.hoisted(() => {
  const stub = (name: string) => {
    const C = (_props: Record<string, unknown>) => null;
    C.displayName = name;
    return C;
  };
  return { stub };
});

vi.mock('./AuditManagementScreen', () => ({ AuditManagementScreen: h.stub('AuditManagementScreen') }));
vi.mock('./AuditScheduleAssignmentScreen', () => ({ AuditScheduleAssignmentScreen: h.stub('AuditScheduleAssignmentScreen') }));
vi.mock('./ScheduleAuditFormScreen', () => ({ ScheduleAuditFormScreen: h.stub('ScheduleAuditFormScreen') }));
vi.mock('../dashboard/AuditScheduleScreen', () => ({ AuditScheduleScreen: h.stub('AuditScheduleScreen') }));
vi.mock('../dashboard/AuditInspectionOverviewScreen', () => ({
  AuditInspectionOverviewScreen: h.stub('AuditInspectionOverviewScreen'),
}));
vi.mock('./AuditHistoryComplianceScreen', () => ({
  AuditHistoryComplianceScreen: h.stub('AuditHistoryComplianceScreen'),
}));
vi.mock('./GenerateAuditReportScreen', () => ({ GenerateAuditReportScreen: h.stub('GenerateAuditReportScreen') }));
vi.mock('./AuditReportsTierConfigScreen', () => ({
  AuditReportsTierConfigScreen: h.stub('AuditReportsTierConfigScreen'),
}));
vi.mock('./AuditReportHistoryScreen', () => ({ AuditReportHistoryScreen: h.stub('AuditReportHistoryScreen') }));
vi.mock('./AuditDetailsFarmerRecordsScreen', () => ({
  AuditDetailsFarmerRecordsScreen: h.stub('AuditDetailsFarmerRecordsScreen'),
}));

import { AuditManagementFlow, type AuditSubScreen } from './AuditManagementFlow';
import { AuditManagementScreen } from './AuditManagementScreen';
import { AuditScheduleAssignmentScreen } from './AuditScheduleAssignmentScreen';
import { ScheduleAuditFormScreen } from './ScheduleAuditFormScreen';
import { AuditScheduleScreen } from '../dashboard/AuditScheduleScreen';
import { AuditInspectionOverviewScreen } from '../dashboard/AuditInspectionOverviewScreen';
import { AuditHistoryComplianceScreen } from './AuditHistoryComplianceScreen';
import { GenerateAuditReportScreen } from './GenerateAuditReportScreen';
import { AuditReportsTierConfigScreen } from './AuditReportsTierConfigScreen';
import { AuditReportHistoryScreen } from './AuditReportHistoryScreen';
import { AuditDetailsFarmerRecordsScreen } from './AuditDetailsFarmerRecordsScreen';
import { makeCan } from '../../permissions/can';

const AUDIT_ID = '7f9c1e2a-0000-4000-8000-000000000001';
const can = makeCan(['audit.view', 'audit.schedule']);

type Props = Record<string, unknown>;

function mount(extra: { initialScreen?: AuditSubScreen; onBack?: () => void } = {}) {
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(<AuditManagementFlow can={can} onBack={extra.onBack ?? vi.fn()} initialScreen={extra.initialScreen} />);
  });
  return tree;
}

function only(tree: renderer.ReactTestRenderer, C: React.ElementType): Props {
  return tree.root.findByType(C).props as Props;
}

function call(fn: unknown, ...args: unknown[]) {
  act(() => {
    (fn as (...a: unknown[]) => void)(...args);
  });
}

describe('AuditManagementFlow', () => {
  it('renders the management screen by default with can and the host onBack', () => {
    const onBack = vi.fn();
    const tree = mount({ onBack });
    const props = only(tree, AuditManagementScreen);
    expect(props.can).toBe(can);
    call(props.onBack);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('schedule assignment passes the row id on to the detail screen, and back returns there', () => {
    const tree = mount();
    call(only(tree, AuditManagementScreen).onOpenSchedule);
    const assignment = only(tree, AuditScheduleAssignmentScreen);
    expect(assignment.can).toBe(can);
    call(assignment.onViewSchedule, { id: AUDIT_ID });

    const detail = only(tree, AuditScheduleScreen);
    expect(detail).toMatchObject({ initialAuditId: AUDIT_ID, initialView: 'detail', can });
    call(detail.onBack);
    only(tree, AuditScheduleAssignmentScreen);
  });

  it('edit from the schedule list opens the form on the row id', () => {
    const tree = mount({ initialScreen: 'scheduleAssignment' });
    call(only(tree, AuditScheduleAssignmentScreen).onEditSchedule, { id: AUDIT_ID });
    const form = only(tree, ScheduleAuditFormScreen);
    expect(form).toMatchObject({ initialAuditId: AUDIT_ID, can });
    call(form.onBack);
    only(tree, AuditScheduleAssignmentScreen);
  });

  it('an audit picked on management opens its detail, then the inspection overview', () => {
    const tree = mount();
    call(only(tree, AuditManagementScreen).onSelectAuditItem, { id: AUDIT_ID });
    call(only(tree, AuditScheduleScreen).onOpenInspection, AUDIT_ID);
    const overview = only(tree, AuditInspectionOverviewScreen);
    expect(overview).toMatchObject({ record: { id: AUDIT_ID }, can });
    call(overview.onBack);
    expect(only(tree, AuditScheduleScreen).initialAuditId).toBe(AUDIT_ID);
  });

  // These five screens were exported but referenced by nothing, which made
  // them unreachable in the running app. Each case walks the taps a user
  // makes, so a screen that falls out of the flow again fails here.
  it('the hub opens audit history & compliance, and back returns to the hub', () => {
    const tree = mount();
    call(only(tree, AuditManagementScreen).onOpenHistory);
    const history = only(tree, AuditHistoryComplianceScreen);
    expect(history.can).toBe(can);
    call(history.onBack);
    only(tree, AuditManagementScreen);
  });

  it('an audit picked in history opens the farmer records detail on that id, and back returns to history', () => {
    const tree = mount();
    call(only(tree, AuditManagementScreen).onOpenHistory);
    call(only(tree, AuditHistoryComplianceScreen).onSelectAudit, { id: AUDIT_ID });
    const details = only(tree, AuditDetailsFarmerRecordsScreen);
    expect(details).toMatchObject({ auditId: AUDIT_ID, can });
    call(details.onBack);
    only(tree, AuditHistoryComplianceScreen);
  });

  it('farmer records edit opens the schedule form, and back returns to farmer records', () => {
    const tree = mount();
    call(only(tree, AuditManagementScreen).onOpenHistory);
    call(only(tree, AuditHistoryComplianceScreen).onSelectAudit, { id: AUDIT_ID });
    call(only(tree, AuditDetailsFarmerRecordsScreen).onEditSchedule);
    const form = only(tree, ScheduleAuditFormScreen);
    expect(form.initialAuditId).toBe(AUDIT_ID);
    call(form.onBack);
    only(tree, AuditDetailsFarmerRecordsScreen);
  });

  it('the hub opens generate report, which opens the tier config, which goes back to generate report', () => {
    const tree = mount();
    call(only(tree, AuditManagementScreen).onOpenGenerateReport);
    const generate = only(tree, GenerateAuditReportScreen);
    expect(generate.can).toBe(can);
    call(generate.onConfigureReport, 'audit_summary');
    const tier = only(tree, AuditReportsTierConfigScreen);
    expect(tier.can).toBe(can);
    call(tier.onBack);
    only(tree, GenerateAuditReportScreen);
  });

  it('generating from the tier config opens report history, and back returns to the tier config', () => {
    const tree = mount({ initialScreen: 'generateReport' });
    call(only(tree, GenerateAuditReportScreen).onGenerateReport, 'audit_summary');
    call(only(tree, AuditReportsTierConfigScreen).onGenerateReportSuccess);
    const reportHistory = only(tree, AuditReportHistoryScreen);
    expect(reportHistory.can).toBe(can);
    call(reportHistory.onBack);
    only(tree, AuditReportsTierConfigScreen);
  });

  it('report history opened from the hub returns to the hub, not to the tier config', () => {
    const tree = mount();
    call(only(tree, AuditManagementScreen).onOpenReportHistory);
    call(only(tree, AuditReportHistoryScreen).onBack);
    only(tree, AuditManagementScreen);
  });
});
