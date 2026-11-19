import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import renderer from 'react-test-renderer';
import { tokens } from '@tohfa/design-tokens';
import { FarmerFontProvider, isFarmerFontScreen, patchForwardRef } from '../theme/FarmerFont';

// Real react-native is Flow source and cannot load under vitest; the patch only needs forwardRef objects.
vi.mock('react-native', () => ({}));

// Stand-in for react-native's Text: a forwardRef object whose render echoes the style it receives.
function makeFakeText() {
  return React.forwardRef<unknown, { style?: unknown }>((props, _ref) =>
    React.createElement('Text', { style: props.style }),
  );
}

function styleOf(el: React.ReactElement): unknown {
  let tree!: renderer.ReactTestRenderer;
  renderer.act(() => {
    tree = renderer.create(el);
  });
  return (tree.toJSON() as { props: { style?: unknown } }).props.style;
}

describe('FarmerFontProvider + Text.render patch', () => {
  const Fake = makeFakeText();
  expect(patchForwardRef(Fake)).toBe(true);

  it('patching twice is a no-op', () => {
    expect(patchForwardRef(Fake)).toBe(false);
  });

  it('is a no-op outside the provider (customer/admin trees)', () => {
    const style = { fontWeight: '700', fontSize: 14 };
    expect(styleOf(<Fake style={style} />)).toBe(style);
  });

  it('is a no-op under a provider that is disabled', () => {
    const style = { fontWeight: '700' };
    expect(
      styleOf(
        <FarmerFontProvider enabled={false}>
          <Fake style={style} />
        </FarmerFontProvider>,
      ),
    ).toBe(style);
  });

  it('applies Poppins and strips fontWeight inside an enabled provider', () => {
    expect(
      styleOf(
        <FarmerFontProvider enabled>
          <Fake style={[{ fontSize: 14 }, { fontWeight: '700' }]} />
        </FarmerFontProvider>,
      ),
    ).toEqual({ fontSize: 14, fontFamily: tokens.fontFamily.bold });
  });

  it('never overrides an explicit fontFamily inside the provider', () => {
    const style = { fontFamily: 'MaterialSymbolsOutlined' };
    expect(
      styleOf(
        <FarmerFontProvider enabled>
          <Fake style={style} />
        </FarmerFontProvider>,
      ),
    ).toEqual(style);
  });

  it('ignores targets that are not forwardRef objects (mocked react-native)', () => {
    expect(patchForwardRef('Text')).toBe(false);
    expect(patchForwardRef(undefined)).toBe(false);
  });
});

describe('isFarmerFontScreen', () => {
  it('enables farmer screens', () => {
    for (const s of ['Splash', 'Login', 'MainTabs', 'CropDetail', 'Wallet', 'AnimalDetail']) {
      expect(isFarmerFontScreen(s)).toBe(true);
    }
  });

  it('keeps the customer app and every admin/warehouse screen outside the provider', () => {
    for (const s of [
      'CustomerMain',
      'AdminMain',
      'Unsupported',
      'SuperAdminDashboard',
      'SubWarehouseAdminDashboard',
      'WarehouseMore',
      'AdminAllFarmers',
      'SalesChannelOverview',
      'MarketPricingHome',
      'ListingApprovalQueue',
    ]) {
      expect(isFarmerFontScreen(s)).toBe(false);
    }
  });
});
