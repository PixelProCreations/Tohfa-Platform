/**
 * PricingFlow: the ONE Market & Pricing flow every admin host mounts.
 *
 *   home ──▶ ceiling ──▶ history (crop from ceiling row)
 *    │   └──▶ retail  ──▶ markup breakdown (row from retail card)
 *    └──▶ categories
 *    └──▶ history (no crop; user picks in the screen)
 *
 * Who sees what is decided entirely by `can` (from GET /auth/me). No role
 * strings here. Fail-closed: a missing `can` renders not-available states in
 * every child screen and makes no requests.
 *
 * RBAC (from docs/rbac.json):
 *   SUPER_ADMIN  pricing.fair_price.view + .set + pricing.retail_price.view + .set
 *   TOHFA_ADMIN  pricing.fair_price.view + pricing.retail_price.view
 *   FARMER_ADMIN pricing.fair_price.view + pricing.retail_price.view (view level)
 *   MAIN/SUB_WH  pricing.fair_price.view (view) + pricing.retail_price.view (view)
 */
import React, { useState } from 'react';
import type { Can } from '../../permissions/can';
import type { RetailPriceRowView } from '../../api/pricingTypes';
import { MarketPricingHomeScreen } from './home/MarketPricingHomeScreen';
import { FairPriceCeilingScreen } from './ceiling/FairPriceCeilingScreen';
import type { PricingCropSelection } from './ceiling/pricingLogic';
import { PriceHistoryScreen } from './history/PriceHistoryScreen';
import { RetailPricingScreen } from './retail/RetailPricingScreen';
import { CategoriesGradesScreen } from './categories/CategoriesGradesScreen';
import { MarkupPricingBreakdownScreen } from './markup/MarkupBreakdownScreen';

export interface PricingFlowProps {
  /** The signed-in admin's permission check (makeCan(/auth/me permissions)). Required: no default grant exists. */
  can: Can;
  /** Leaves the flow (back from its root screen). */
  onBack: () => void;
  /** The caller's warehouse, for query cache keys only; scoping is server-side. */
  warehouseId?: string | undefined;
}

type PricingRoute =
  | { screen: 'home' }
  | { screen: 'ceiling' }
  | { screen: 'history'; crop?: PricingCropSelection; from?: 'ceiling' }
  | { screen: 'retail' }
  | { screen: 'categories' }
  | { screen: 'markup'; row?: RetailPriceRowView };

export function PricingFlow({ can, onBack, warehouseId }: PricingFlowProps) {
  const [route, setRoute] = useState<PricingRoute>({ screen: 'home' });

  if (route.screen === 'ceiling') {
    return (
      <FairPriceCeilingScreen
        can={can}
        warehouseId={warehouseId}
        onBack={() => setRoute({ screen: 'home' })}
        onNavigateToHistory={(crop) => setRoute({ screen: 'history', crop, from: 'ceiling' })}
        onNavigateToRetailPricing={() => setRoute({ screen: 'retail' })}
      />
    );
  }

  if (route.screen === 'history') {
    const from = route.from;
    return (
      <PriceHistoryScreen
        can={can}
        warehouseId={warehouseId}
        crop={route.crop}
        onBack={() => setRoute(from === 'ceiling' ? { screen: 'ceiling' } : { screen: 'home' })}
      />
    );
  }

  if (route.screen === 'retail') {
    return (
      <RetailPricingScreen
        can={can}
        warehouseId={warehouseId}
        onBack={() => setRoute({ screen: 'home' })}
        onSelectBreakdown={(row) => setRoute({ screen: 'markup', row })}
      />
    );
  }

  if (route.screen === 'categories') {
    return (
      <CategoriesGradesScreen
        can={can}
        onBack={() => setRoute({ screen: 'home' })}
      />
    );
  }

  if (route.screen === 'markup') {
    return (
      <MarkupPricingBreakdownScreen
        can={can}
        row={route.row}
        onBack={() => setRoute({ screen: 'retail' })}
      />
    );
  }

  // home (default)
  return (
    <MarketPricingHomeScreen
      can={can}
      warehouseId={warehouseId}
      onBack={onBack}
      onNavigateToFairPrice={() => setRoute({ screen: 'ceiling' })}
      onNavigateToRetailPricing={() => setRoute({ screen: 'retail' })}
      onNavigateToCategories={() => setRoute({ screen: 'categories' })}
      onNavigateToPriceHistory={() => setRoute({ screen: 'history' })}
      onNavigateOverview={() => setRoute({ screen: 'retail' })}
      onSetFairPriceCeiling={() => setRoute({ screen: 'ceiling' })}
      onBulkUpdateCeilings={() => setRoute({ screen: 'ceiling' })}
    />
  );
}
