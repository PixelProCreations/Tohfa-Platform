/**
 * In-module navigator for Profile & settings:
 * home -> edit | password | sessions | notifications | help.
 *
 * Every sub-screen is opened only when its availability feature is visible
 * (endpoint exists + rbac.json grant). Deliberately absent (see
 * ../availability.ts): terminating one of your own sessions (no endpoint;
 * the Super-Admin-only terminate is for another admin's session), admin
 * support tickets (not built, BR-82), and any failed-login history (no API).
 *
 * Signing out is the host's job; the flow receives `signOut` (built in
 * TohfaAdminApp from the host's `onSignOut`). A successful password change
 * MUST end in `signOut.afterPasswordChange()` — the server has already
 * revoked every session of the account.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { BackHandler } from 'react-native';
import { EmptyState } from '@tohfa/mobile-ui';
import type { LocaleDto } from '../../../api/profile';
import { t } from '../../../i18n';
import { useAdminSession } from '../../../session/AdminSession';
import type { AdminSignOut } from '../../../session/signOut';
import { isWarehouseFeatureVisible } from '../availability';
import { ChangePasswordScreen } from './ChangePasswordScreen';
import { EditProfileScreen } from './EditProfileScreen';
import { HelpScreen } from './HelpScreen';
import type { ProfileModel } from './mappers';
import { NotificationSettingsScreen } from './NotificationSettingsScreen';
import { ProfileHomeScreen, type ProfileDestination } from './ProfileHomeScreen';
import { SessionsScreen } from './SessionsScreen';

export interface ProfileFlowProps {
  onExit: () => void;
  signOut: AdminSignOut;
}

type Route = { screen: 'home' } | { screen: ProfileDestination; profile: ProfileModel };

export function ProfileFlow(props: ProfileFlowProps): React.JSX.Element {
  const { can } = useAdminSession();
  const [stack, setStack] = useState<Route[]>([{ screen: 'home' }]);
  const { onExit } = props;

  const back = useCallback(() => {
    if (stack.length > 1) setStack((s) => s.slice(0, -1));
    else onExit();
  }, [stack.length, onExit]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      back();
      return true;
    });
    return () => sub.remove();
  }, [back]);

  // Presentation only; the server re-checks auth.principal.view_own.
  if (!isWarehouseFeatureVisible('profileView', can)) {
    return <EmptyState title={t('admin.errors.FORBIDDEN')} />;
  }

  const current = stack[stack.length - 1] ?? { screen: 'home' };
  const locale: LocaleDto | null = current.screen === 'home' ? null : current.profile.preferredLocale;

  switch (current.screen) {
    case 'edit':
      return <EditProfileScreen profile={current.profile} onBack={back} onSaved={back} />;
    case 'password':
      return (
        <ChangePasswordScreen
          onBack={back}
          onPasswordChanged={() => void props.signOut.afterPasswordChange()}
        />
      );
    case 'sessions':
      return <SessionsScreen onBack={back} />;
    case 'notifications':
      return <NotificationSettingsScreen onBack={back} />;
    case 'help':
      return <HelpScreen locale={locale} onBack={back} />;
    case 'home':
      return (
        <ProfileHomeScreen
          onBack={back}
          onOpen={(screen, profile) => setStack((s) => [...s, { screen, profile }])}
          onSignOut={() => void props.signOut.signOut()}
        />
      );
  }
}
