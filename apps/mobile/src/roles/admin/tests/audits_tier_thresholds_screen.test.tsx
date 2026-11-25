/**
 * AuditReportsTierConfigScreen reads the tier generation now in effect
 * (GET /admin/audit-tier-thresholds, docs/openapi.yaml `getAuditTierThresholds`)
 * and fills its Tier filter from it, instead of offering a placeholder for a
 * value the server can supply.
 *
 * BR-147a: the GET returns the current generation, four contiguous bands over
 * 0-100. BR-147b: the read needs `audit.tier.configure_thresholds`, so a caller
 * without it must not issue the request at all.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type * as AuditsModule from '../api/audits';
import { makeCan } from '../permissions/can';
import { t } from '../i18n';

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

vi.mock('react-native-svg', () => ({
  default: 'Svg',
  Circle: 'Circle',
  Ellipse: 'Ellipse',
  Line: 'Line',
  Path: 'Path',
  Rect: 'Rect',
}));

const api = vi.hoisted(() => ({
  getAuditTierThresholds: vi.fn(),
  updateAuditTierThresholds: vi.fn(),
}));

vi.mock('../api/audits', async (importOriginal) => ({
  ...(await importOriginal<typeof AuditsModule>()),
  getAuditTierThresholds: api.getAuditTierThresholds,
  updateAuditTierThresholds: api.updateAuditTierThresholds,
}));

import { AuditReportsTierConfigScreen } from '../screens/audits';
import { useAuditTierThresholds, useUpdateAuditTierThresholds } from '../screens/audits/useAuditsData';

const GENERATION: AuditsModule.TierBandsGenerationDto = {
  effectiveFrom: '2026-04-01',
  tiers: [
    { code: 'POOR', label: 'Poor', minScore: 0, maxScore: 40, sortOrder: 1 },
    { code: 'MODERATE', label: 'Moderate', minScore: 40, maxScore: 60, sortOrder: 2 },
    { code: 'GOOD', label: 'Good', minScore: 60, maxScore: 80, sortOrder: 3 },
    { code: 'EXCELLENT', label: 'Excellent', minScore: 80, maxScore: null, sortOrder: 4 },
  ],
};

function withQuery(ui: React.ReactElement): React.ReactElement {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
}

async function settle(): Promise<void> {
  for (let i = 0; i < 6; i += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
}

function texts(tree: renderer.ReactTestRenderer): string[] {
  return tree.root.findAllByType('Text' as React.ElementType).map((n) => [n.props.children].flat().join(''));
}

function pressTierDropdown(tree: renderer.ReactTestRenderer): void {
  const trigger = tree.root
    .findAllByType('TouchableOpacity' as React.ElementType)
    .find((n) => n.props.accessibilityLabel === t('admin.audits.tierConfig.field.tier'));
  if (trigger === undefined) throw new Error('the Tier field has no dropdown trigger');
  act(() => {
    trigger.props.onPress();
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  api.getAuditTierThresholds.mockResolvedValue(GENERATION);
  api.updateAuditTierThresholds.mockResolvedValue(GENERATION);
});

describe('AuditReportsTierConfigScreen tier thresholds', () => {
  it('BR-147a: reads the current audit tier generation and prefills the form', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        withQuery(
          <AuditReportsTierConfigScreen
            can={makeCan(['audit.tier.configure_thresholds'])}
            onBack={vi.fn()}
          />,
        ),
      );
    });
    await settle();

    expect(api.getAuditTierThresholds).toHaveBeenCalled();
    pressTierDropdown(tree);
    const rendered = texts(tree);
    for (const tier of GENERATION.tiers) expect(rendered).toContain(tier.label);
  });

  it('BR-147a: a band the server sends without a label renders an em-dash, never a sample value', async () => {
    api.getAuditTierThresholds.mockResolvedValue({
      effectiveFrom: '2026-04-01',
      tiers: [{ code: 'POOR', label: '', minScore: 0, maxScore: 100, sortOrder: 1 }],
    });
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        withQuery(
          <AuditReportsTierConfigScreen
            can={makeCan(['audit.tier.configure_thresholds'])}
            onBack={vi.fn()}
          />,
        ),
      );
    });
    await settle();

    pressTierDropdown(tree);
    expect(texts(tree)).toContain('—');
  });

  it('BR-147b: does not read the thresholds without audit.tier.configure_thresholds', async () => {
    await act(async () => {
      renderer.create(
        withQuery(<AuditReportsTierConfigScreen can={makeCan([])} onBack={vi.fn()} />),
      );
    });
    await settle();

    expect(api.getAuditTierThresholds).not.toHaveBeenCalled();
  });
});

describe('useAuditTierThresholds', () => {
  it('BR-147: a successful PATCH invalidates the generation, so the form shows what was saved', async () => {
    let save: ((body: AuditsModule.TierBandsBody) => void) | undefined;

    function Harness(): React.JSX.Element | null {
      useAuditTierThresholds();
      const mutation = useUpdateAuditTierThresholds();
      save = mutation.mutate;
      return null;
    }

    await act(async () => {
      renderer.create(withQuery(<Harness />));
    });
    await settle();
    expect(api.getAuditTierThresholds).toHaveBeenCalledTimes(1);

    await act(async () => {
      save?.({ tiers: GENERATION.tiers.map(({ code, label, minScore, maxScore }) => ({ code, label, minScore, maxScore })) });
    });
    await settle();

    expect(api.updateAuditTierThresholds).toHaveBeenCalledTimes(1);
    expect(api.getAuditTierThresholds).toHaveBeenCalledTimes(2);
  });
});
