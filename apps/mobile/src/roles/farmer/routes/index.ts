import type React from 'react';
import { renderAuthRoute } from './authRoutes';
import { renderListingRoute } from './listingRoutes';
import { renderProfileRoute } from './profileRoutes';
import { renderFarmRoute } from './farmRoutes';
import { renderDiaryRoute } from './diaryRoutes';
import { renderSoilRoute } from './soilRoutes';
import { renderAssetRoute } from './assetRoutes';
import { renderLivestockRoute } from './livestockRoutes';
import { renderWorkforceRoute } from './workforceRoutes';
import { renderWalletRoute } from './walletRoutes';
import { renderLearningRoute } from './learningRoutes';
import type { FarmerRouteContext, FarmerRouteRenderer } from './types';

export type { FarmerRouteContext } from './types';

/**
 * The farmer route registry, by domain. Each route key belongs to exactly one
 * domain, so the order only decides who is asked first.
 *
 * Admin, warehouse and customer routes are not here: the cross-role import
 * guard allows only App.tsx to import from roles/admin and roles/customer, and
 * several source-pinned tests read those render branches from App.tsx.
 */
const FARMER_ROUTE_RENDERERS: readonly FarmerRouteRenderer[] = [
  renderAuthRoute,
  renderListingRoute,
  renderProfileRoute,
  renderFarmRoute,
  renderDiaryRoute,
  renderSoilRoute,
  renderAssetRoute,
  renderLivestockRoute,
  renderWorkforceRoute,
  renderWalletRoute,
  renderLearningRoute,
];

/** The farmer screen for `ctx.screen`, or undefined when no farmer route renders it. */
export function renderFarmerRoute(ctx: FarmerRouteContext): React.JSX.Element | undefined {
  for (const render of FARMER_ROUTE_RENDERERS) {
    const element = render(ctx);
    if (element !== undefined) return element;
  }
  return undefined;
}
