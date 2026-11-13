/**
 * BR-142 (docs/rules.md): Create Password must actually be rendered when the
 * routing decision (`resolveRouteAfterAuth`) sends an account there.
 *
 * Regression guard. When App.tsx's render switch was split into
 * `routes/*Routes.tsx`, the `CreatePassword` branch was not carried over. The
 * farmer route registry then returned `undefined` for it, App.tsx fell through
 * to its last branch (the MainTabs dashboard), and a farmer with no password
 * landed on the dashboard after OTP and on every relaunch, even though
 * `/auth/me` said `hasPassword: false` and the routing function was correct.
 * Testing the routing function alone could not catch that, so this pins the
 * registry itself.
 *
 * Every screen module the registry imports is replaced by a named string
 * component, so only the routing is under test.
 */
import { describe, expect, it, vi } from 'vitest';
import type React from 'react';

vi.mock('../screens/auth/CreatePasswordScreen', () => ({ CreatePasswordScreen: 'CreatePasswordScreen' }));
vi.mock('../screens/auth/ApplicationStatusScreen', () => ({ ApplicationStatusScreen: 'ApplicationStatusScreen' }));
vi.mock('../screens/auth/ForgotPasswordScreen', () => ({ ForgotPasswordScreen: 'ForgotPasswordScreen' }));
vi.mock('../screens/auth/LoginScreen', () => ({ LoginScreen: 'LoginScreen' }));
vi.mock('../screens/auth/OtpScreen', () => ({ OtpScreen: 'OtpScreen' }));
vi.mock('../screens/auth/ResetPasswordScreen', () => ({ ResetPasswordScreen: 'ResetPasswordScreen' }));
vi.mock('../screens/auth/PasswordChangedSuccessScreen', () => ({
  PasswordChangedSuccessScreen: 'PasswordChangedSuccessScreen',
}));
vi.mock('../screens/auth/RoleSelectionScreen', () => ({ RoleSelectionScreen: 'RoleSelectionScreen' }));
vi.mock('../screens/auth/SplashScreen', () => ({ SplashScreen: 'SplashScreen' }));
vi.mock('../screens/auth/WelcomeScreen', () => ({ WelcomeScreen: 'WelcomeScreen' }));
vi.mock('../screens/registration/RegistrationFlowScreen', () => ({
  RegistrationFlowScreen: 'RegistrationFlowScreen',
}));

import { renderAuthRoute } from '../routes/authRoutes';
import type { FarmerRouteContext } from '../routes/types';
import type { ScreenName } from '../routes/routeParams';

function ctx(screen: ScreenName, navigate = vi.fn()): FarmerRouteContext {
  return {
    screen,
    params: {},
    navigate,
    goBack: vi.fn(),
    nav: {} as FarmerRouteContext['nav'],
    selections: {} as FarmerRouteContext['selections'],
  };
}

describe('BR-142: the farmer route registry renders Create Password', () => {
  it('BR-142e: renders CreatePasswordScreen for the CreatePassword route, never undefined (which falls through to the dashboard)', () => {
    const element = renderAuthRoute(ctx('CreatePassword')) as React.ReactElement | undefined;
    expect(element).toBeDefined();
    expect(element?.type).toBe('CreatePasswordScreen');
  });

  it('BR-142f: Create Password forwards its onward route (from /auth/me) to navigate', () => {
    const navigate = vi.fn();
    const element = renderAuthRoute(ctx('CreatePassword', navigate)) as React.ReactElement<{
      onNavigate: (s: string, p?: Record<string, unknown>) => void;
    }>;
    element.props.onNavigate('MainTabs');
    expect(navigate).toHaveBeenCalledWith('MainTabs', undefined);
  });
});
