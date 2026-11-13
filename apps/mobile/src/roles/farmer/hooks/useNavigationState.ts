import { useState } from 'react';
import type { NavParams, ScreenName, StackEntry, TabName } from '../routes/routeParams';

/**
 * The app root's navigation state: the current screen and its params, the
 * farmer tab under MainTabs, and the history stack. Only state lives here; the
 * transitions (navigate / goBack / exitFlow) stay in App.tsx, next to the
 * permission gate and session handling they depend on.
 */
export function useNavigationState() {
  const [screen, setScreen] = useState<ScreenName>('Splash');
  // Navigation history stack: keeps true chronological breadcrumbs so back buttons
  // always return to the actual prior screen without getting trapped in loops.
  const [history, setHistory] = useState<StackEntry[]>([]);
  const [currentTab, setCurrentTab] = useState<TabName>('Home');
  const [params, setParams] = useState<NavParams>({});
  return { screen, setScreen, history, setHistory, currentTab, setCurrentTab, params, setParams };
}

export type NavigationState = ReturnType<typeof useNavigationState>;
