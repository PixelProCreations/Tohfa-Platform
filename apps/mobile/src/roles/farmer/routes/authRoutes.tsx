import React from 'react';
import { ApplicationStatusScreen } from '../screens/auth/ApplicationStatusScreen';
import { CreatePasswordScreen } from '../screens/auth/CreatePasswordScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { OtpScreen } from '../screens/auth/OtpScreen';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';
import { PasswordChangedSuccessScreen } from '../screens/auth/PasswordChangedSuccessScreen';
import { RoleSelectionScreen } from '../screens/auth/RoleSelectionScreen';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { RegistrationFlowScreen } from '../screens/registration/RegistrationFlowScreen';
import type { FarmerRouteRenderer } from './types';

/** Splash, welcome, sign-in, OTP, password reset and registration. */
export const renderAuthRoute: FarmerRouteRenderer = ({ screen, params, navigate, goBack }) => {
  switch (screen) {
    case 'Splash':
      return <SplashScreen onNavigate={(s, p) => navigate(s, p)} />;
    case 'Welcome':
      return <WelcomeScreen onNavigate={(s) => navigate(s)} />;
    case 'Login':
      return (
        <LoginScreen
          onNavigate={(s, p) => navigate(s, p)}
          initialMobile={typeof params['initialMobile'] === 'string' ? params['initialMobile'] : undefined}
          initialMode={params['initialMode'] === 'password' ? 'password' : 'otp'}
        />
      );
    case 'RoleSelection':
      return <RoleSelectionScreen onNavigate={(s) => navigate(s)} />;
    case 'Register':
      return <RegistrationFlowScreen onNavigate={(s, p) => navigate(s, p)} onBack={goBack} />;
    case 'Otp':
      return (
        <OtpScreen
          mobile={String(params['mobile'] ?? '')}
          challengeId={typeof params['challengeId'] === 'string' ? params['challengeId'] : undefined}
          resendAvailableAt={
            typeof params['resendAvailableAt'] === 'string'
              ? params['resendAvailableAt']
              : undefined
          }
          attemptsRemaining={
            typeof params['attemptsRemaining'] === 'number'
              ? params['attemptsRemaining']
              : undefined
          }
          purpose={
            (params['purpose'] as 'LOGIN' | 'PASSWORD_RESET' | undefined) ?? 'LOGIN'
          }
          linkToken={typeof params['linkToken'] === 'string' ? params['linkToken'] : undefined}
          mockCode={typeof params['mockCode'] === 'string' ? params['mockCode'] : undefined}
          onNavigate={(s, p) => navigate(s, p)}
        />
      );
    case 'ForgotPassword':
      return (
        <ForgotPasswordScreen
          onNavigate={(s, p) => navigate(s, p)}
          initialMobile={typeof params['mobile'] === 'string' ? params['mobile'] : undefined}
          mode={params['mode'] === 'first_time' ? 'first_time' : 'forgot'}
        />
      );
    case 'ResetPassword':
      return (
        <ResetPasswordScreen
          challengeId={String(params['challengeId'] ?? '')}
          code={String(params['code'] ?? '')}
          onNavigate={(s) => navigate(s)}
        />
      );
    case 'CreatePassword':
      // BR-142: where resolveRouteAfterAuth sends an account with no password
      // (OTP sign-in, Splash session restore, social login). Must be rendered
      // here: a route no renderer claims falls through to App.tsx's MainTabs
      // branch, which put a passwordless farmer straight on the dashboard.
      return <CreatePasswordScreen onNavigate={(s, p) => navigate(s, p)} />;
    case 'PasswordChangedSuccess':
      return <PasswordChangedSuccessScreen onNavigate={(s) => navigate(s)} />;
    case 'ApplicationStatus':
      return (
        <ApplicationStatusScreen
          applicationId={String(params['applicationId'] ?? 'DEMO-APP-001')}
          onNavigate={(s, p) => navigate(s, p)}
        />
      );
    default:
      return undefined;
  }
};
