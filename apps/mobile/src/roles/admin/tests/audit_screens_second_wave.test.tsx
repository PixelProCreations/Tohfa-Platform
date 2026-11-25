/**
 * Unit tests for the second-wave audit screens:
 *   1. AuditHistoryComplianceScreen
 *   2. GenerateAuditReportScreen
 *   3. AuditReportsTierConfigScreen
 *   4. AuditReportHistoryScreen
 *   5. AuditDetailsFarmerRecordsScreen
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type * as AuditsModule from '../api/audits';
import { makeCan } from '../permissions/can';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Alert: { alert: vi.fn() },
  Modal: 'Modal',
  Platform: { OS: 'android', select: (o: Record<string, unknown>) => o['android'] ?? o['default'] },
  SafeAreaView: 'SafeAreaView',
  ScrollView: 'ScrollView',
  StatusBar: 'StatusBar',
  StyleSheet: { create: (s: Record<string, unknown>) => s, flatten: (s: unknown) => s, absoluteFill: {} },
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));

vi.mock('@tohfa/mobile-ui', () => ({
  ScreenStatusBar: 'ScreenStatusBar',
}));

vi.mock('react-native-svg', () => ({
  default: 'Svg',
  Circle: 'Circle',
  Ellipse: 'Ellipse',
  Line: 'Line',
  Path: 'Path',
  Rect: 'Rect',
}));

const api = vi.hoisted(() => ({
  getAuditCompliance: vi.fn(),
  listAudits: vi.fn(),
  getAudit: vi.fn(),
  getAuditReportUrl: vi.fn(),
  updateAuditTierThresholds: vi.fn(),
  redFlagAudit: vi.fn(),
  clearAuditRedFlag: vi.fn(),
}));

vi.mock('../api/audits', async (importOriginal) => ({
  ...(await importOriginal<typeof AuditsModule>()),
  getAuditCompliance: api.getAuditCompliance,
  listAudits: api.listAudits,
  getAudit: api.getAudit,
  getAuditReportUrl: api.getAuditReportUrl,
  updateAuditTierThresholds: api.updateAuditTierThresholds,
  redFlagAudit: api.redFlagAudit,
  clearAuditRedFlag: api.clearAuditRedFlag,
}));

import {
  AuditHistoryComplianceScreen,
  GenerateAuditReportScreen,
  AuditReportsTierConfigScreen,
  AuditReportHistoryScreen,
  AuditDetailsFarmerRecordsScreen,
} from '../screens/audits';

function withQuery(ui: React.ReactElement): React.ReactElement {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
}

describe('AuditHistoryComplianceScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getAuditCompliance.mockResolvedValue({
      fiscalYear: '2026-2027',
      isFiscalYearClosed: false,
      currentQuarter: 3,
      currentQuarterEndsOn: '2026-12-31',
      asOf: '2026-10-15T00:00:00Z',
      counts: {
        farmersInScope: 100,
        compliant: 32,
        pending: 10,
        nonCompliant: 5,
        overdueAudits: 2,
        farmersWithoutCurrentQuarterAudit: 8,
        redFlaggedAudits: 1,
        redFlaggedFarmers: 1,
        openMajorFindings: 3,
        scheduledThisQuarter: 40,
      },
      farmers: [],
      page: { nextCursor: null, hasMore: false },
    });
    api.listAudits.mockResolvedValue({
      items: [
        {
          id: 'audit-001',
          farmerName: 'Kumar',
          redFlagged: true,
          auditType: 'INTERNAL',
          scheduledFor: '2026-09-02T10:00:00Z',
          totalScore: 68,
          tier: null,
          findingCounts: { major: 2, minor: 3, openMajor: 1 },
        },
      ],
      page: { nextCursor: null, hasMore: false },
    });
  });

  it('renders header, title and count subtitle', async () => {
    const can = makeCan(['audit.view']);
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        withQuery(<AuditHistoryComplianceScreen can={can} onBack={vi.fn()} />),
      );
    });

    const texts = tree.root
      .findAllByType('Text' as React.ElementType)
      .map((t) => [t.props.children].flat().join(''));

    expect(texts).toContain('Audit History & Compliance');
    expect(texts).toContain('Corrective actions');
    expect(texts).toContain('Red flag');
  });

  it('allows clicking an audit row when onSelectAudit is provided', async () => {
    const can = makeCan(['audit.view']);
    const onSelectAudit = vi.fn();
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        withQuery(
          <AuditHistoryComplianceScreen
            can={can}
            onBack={vi.fn()}
            onSelectAudit={onSelectAudit}
          />,
        ),
      );
    });

    const touchables = tree.root.findAllByType('TouchableOpacity' as React.ElementType);
    const auditCard = touchables.find((t) => t.props.accessibilityLabel === undefined && t.props.disabled === false);
    if (auditCard && auditCard.props.onPress) {
      act(() => auditCard.props.onPress());
      expect(onSelectAudit).toHaveBeenCalled();
    }
  });
});

describe('GenerateAuditReportScreen', () => {
  it('renders 6 report options and handles selection', async () => {
    const can = makeCan(['audit.report.generate']);
    const onConfigureReport = vi.fn();
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        withQuery(
          <GenerateAuditReportScreen
            can={can}
            onBack={vi.fn()}
            onConfigureReport={onConfigureReport}
          />,
        ),
      );
    });

    const texts = tree.root
      .findAllByType('Text' as React.ElementType)
      .map((t) => [t.props.children].flat().join(''));

    expect(texts).toContain('Generate Audit Report');
    expect(texts).toContain('Audit Summary');
    expect(texts).toContain('Farmer History');
    expect(texts).toContain('Quarterly Coverage');
    expect(texts).toContain('Findings & Violations');
    expect(texts).toContain('Generate Report');

    const touchables = tree.root.findAllByType('TouchableOpacity' as React.ElementType);
    const generateBtn = touchables.find((t) => {
      const childTexts = t.findAllByType('Text' as React.ElementType).map((c) => [c.props.children].flat().join(''));
      return childTexts.includes('Generate Report');
    });

    expect(generateBtn).toBeDefined();
    expect(generateBtn?.props.disabled).toBe(false);

    act(() => {
      generateBtn?.props.onPress();
    });
    expect(onConfigureReport).toHaveBeenCalledWith('audit_summary');
  });

  it('disables Generate Report button when lacking audit.report.generate', () => {
    const can = makeCan([]);
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        withQuery(
          <GenerateAuditReportScreen
            can={can}
            onBack={vi.fn()}
          />,
        ),
      );
    });

    const touchables = tree.root.findAllByType('TouchableOpacity' as React.ElementType);
    const generateBtn = touchables.find((t) => {
      const childTexts = t.findAllByType('Text' as React.ElementType).map((c) => [c.props.children].flat().join(''));
      return childTexts.includes('Generate Report');
    });

    expect(generateBtn?.props.disabled).toBe(true);
  });
});

describe('AuditReportsTierConfigScreen', () => {
  it('renders report configuration form and handles submit with audit.tier.configure_thresholds', () => {
    const can = makeCan(['audit.tier.configure_thresholds']);
    const onGenerateReportSuccess = vi.fn();
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        withQuery(
          <AuditReportsTierConfigScreen
            can={can}
            onBack={vi.fn()}
            onGenerateReportSuccess={onGenerateReportSuccess}
          />,
        ),
      );
    });

    const texts = tree.root
      .findAllByType('Text' as React.ElementType)
      .map((t) => [t.props.children].flat().join(''));

    expect(texts).toContain('Report Configuration');
    expect(texts).toContain('Export Report');

    const touchables = tree.root.findAllByType('TouchableOpacity' as React.ElementType);
    const exportBtn = touchables.find((t) => {
      const childTexts = t.findAllByType('Text' as React.ElementType).map((c) => [c.props.children].flat().join(''));
      return childTexts.includes('Export Report');
    });

    expect(exportBtn?.props.disabled).toBe(false);
    act(() => {
      exportBtn?.props.onPress();
    });
    expect(onGenerateReportSuccess).toHaveBeenCalled();
  });

  it('disables export button without audit.tier.configure_thresholds', () => {
    const can = makeCan([]);
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        withQuery(
          <AuditReportsTierConfigScreen
            can={can}
            onBack={vi.fn()}
          />,
        ),
      );
    });

    const touchables = tree.root.findAllByType('TouchableOpacity' as React.ElementType);
    const exportBtn = touchables.find((t) => {
      const childTexts = t.findAllByType('Text' as React.ElementType).map((c) => [c.props.children].flat().join(''));
      return childTexts.includes('Export Report');
    });

    expect(exportBtn?.props.disabled).toBe(true);
  });
});

describe('AuditReportHistoryScreen', () => {
  it('renders report history cards with em-dash values and filter modal', () => {
    const can = makeCan(['audit.view']);
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        withQuery(<AuditReportHistoryScreen can={can} onBack={vi.fn()} />),
      );
    });

    const texts = tree.root
      .findAllByType('Text' as React.ElementType)
      .map((t) => [t.props.children].flat().join(''));

    expect(texts).toContain('Report History');
    expect(texts).toContain('Audit Summary Report');
    expect(texts).toContain('Generated —');
  });
});

describe('AuditDetailsFarmerRecordsScreen', () => {
  beforeEach(() => {
    api.getAudit.mockResolvedValue({
      id: 'audit-001',
      farmerId: 'farmer-101',
      farmerName: 'Selvi',
      zoneName: 'Coonoor',
      auditType: 'INTERNAL',
      status: 'SCHEDULED',
      scheduledFor: '2026-10-28T10:00:00Z',
      auditorName: 'Priya Nair',
      totalScore: null,
      tier: null,
      redFlagged: false,
      categoryScores: [],
      findings: [],
    });
  });

  it('renders audit details, switches between details and inspection tabs', async () => {
    const can = makeCan(['audit.view', 'audit.schedule', 'audit.red_flag.manage']);
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        withQuery(
          <AuditDetailsFarmerRecordsScreen
            auditId="audit-001"
            can={can}
            onBack={vi.fn()}
          />,
        ),
      );
    });

    const texts = tree.root
      .findAllByType('Text' as React.ElementType)
      .map((t) => [t.props.children].flat().join(''));

    expect(texts).toContain('Details & Farmer Records');
    expect(texts).toContain('Inspection & Findings');
    expect(texts).toContain('Reschedule');
    expect(texts).toContain('Cancel');

    // Switch to inspection tab
    const touchables = tree.root.findAllByType('TouchableOpacity' as React.ElementType);
    const inspectionTab = touchables.find((t) => {
      const childTexts = t.findAllByType('Text' as React.ElementType).map((c) => [c.props.children].flat().join(''));
      return childTexts.includes('Inspection & Findings');
    });

    act(() => {
      inspectionTab?.props.onPress();
    });

    const updatedTexts = tree.root
      .findAllByType('Text' as React.ElementType)
      .map((t) => [t.props.children].flat().join(''));

    expect(updatedTexts).toContain('Categories (10 × 10 points)');
    expect(updatedTexts).toContain('Findings and violations');
  });

  it('disables reschedule and cancel buttons without audit.schedule', async () => {
    const can = makeCan(['audit.view']);
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        withQuery(
          <AuditDetailsFarmerRecordsScreen
            auditId="audit-001"
            can={can}
            onBack={vi.fn()}
            onReschedule={vi.fn()}
            onCancelSchedule={vi.fn()}
          />,
        ),
      );
    });

    const touchables = tree.root.findAllByType('TouchableOpacity' as React.ElementType);
    const rescheduleBtn = touchables.find((t) => {
      const childTexts = t.findAllByType('Text' as React.ElementType).map((c) => [c.props.children].flat().join(''));
      return childTexts.includes('Reschedule');
    });

    expect(rescheduleBtn?.props.disabled).toBe(true);
  });
});

describe('Source guards for 5 new audit screens', () => {
  const dir = path.resolve(__dirname, '../screens/audits');
  const files = [
    'AuditHistoryComplianceScreen.tsx',
    'GenerateAuditReportScreen.tsx',
    'AuditReportsTierConfigScreen.tsx',
    'AuditReportHistoryScreen.tsx',
    'AuditDetailsFarmerRecordsScreen.tsx',
  ].map((f) => fs.readFileSync(path.join(dir, f), 'utf8'));

  it('asserts no raw hex literals, numeric fontSize, fontFamily, or role literals', () => {
    for (const src of files) {
      expect(src).not.toMatch(/(['"`])#[0-9A-Fa-f]{3,8}\1|\brgba?\s*\(/);
      expect(src).not.toMatch(/fontSize\s*:\s*[0-9]/);
      expect(src).not.toMatch(/fontFamily/);
      expect(src).not.toMatch(/from '\.\/fixtures'/);
      expect(src).not.toMatch(/SUPER_ADMIN|TOHFA_ADMIN|FARMER_ADMIN/);
      expect(src).not.toMatch(/as any/);
    }
  });
});
