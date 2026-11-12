import type React from 'react';
import type { FarmerSelections } from '../hooks/useFarmerSelections';
import type { NavigationState } from '../hooks/useNavigationState';
import type { GoBack, Navigate, NavParams, ScreenName } from './routeParams';

/**
 * Everything a farmer route needs from the app root to render its screen.
 * App.tsx builds one per render; the route files never hold state.
 */
export interface FarmerRouteContext {
  screen: ScreenName;
  params: NavParams;
  navigate: Navigate;
  goBack: GoBack;
  /** Raw setters, for the one flow that rewrites the whole stack (CreateListingStep2). */
  nav: Pick<NavigationState, 'setHistory' | 'setCurrentTab' | 'setParams' | 'setScreen'>;
  selections: FarmerSelections;
}

/**
 * Renders the screen for `ctx.screen` when the route belongs to this domain,
 * or returns undefined so the next domain (and finally App.tsx) is asked.
 */
export type FarmerRouteRenderer = (ctx: FarmerRouteContext) => React.JSX.Element | undefined;
