import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { t } from '../../../../i18n/farmer';
import { ErrorState } from '@tohfa/mobile-ui';
import { LockIcon } from '../../assets/icons/AssetIcons';
import { fetchMe, resolveRouteAfterAuth, setInitialPassword } from '../../api/auth';
import { ApiError, formatErrorMessage } from '../../../../shell/api/client';
import { authPalette as P, typography } from '../../theme';
import { NewPasswordForm } from './NewPasswordForm';

interface CreatePasswordScreenProps {
  onNavigate: (
    screen: ReturnType<typeof resolveRouteAfterAuth>['name'],
    params?: Record<string, string | number | undefined>,
  ) => void;
}

/**
 * BR-142: the first password of an account that signed in by OTP and has none
 * (`GET /auth/me` `hasPassword: false`). Reached from `resolveRouteAfterAuth`,
 * so every sign-in path and the Splash session restore land here first.
 *
 * Deliberately not skippable: there is no back control, App.tsx starts a fresh
 * back stack on this screen and treats it as a root (Android back leaves the
 * app rather than reaching a role shell), and the next cold start resolves the
 * same `/auth/me` and comes back here until a password is set.
 */
export const CreatePasswordScreen: React.FC<CreatePasswordScreenProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /** Continue exactly like any other sign-in: the role route from a fresh /auth/me. */
  async function continueToRoleRoute() {
    const me = await fetchMe();
    const route = resolveRouteAfterAuth(me);
    onNavigate(route.name, route.params);
  }

  async function handleCreate(password: string) {
    setLoading(true);
    setErrorMsg(null);
    try {
      try {
        await setInitialPassword({ newPassword: password });
      } catch (err: unknown) {
        // Set meanwhile (another device, or a retried request whose first
        // attempt did land): the account has a password, which is the goal.
        if (!(err instanceof ApiError && err.is('PASSWORD_ALREADY_SET'))) throw err;
      }
      await continueToRoleRoute();
    } catch (err: unknown) {
      if (err instanceof ApiError && err.is('VALIDATION_FAILED')) {
        setErrorMsg(t('farmer.auth.password.policy'));
      } else {
        setErrorMsg(formatErrorMessage(err, t('error.generic')));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.iconCircle}>
        <LockIcon size={32} color={P.primary} />
      </View>

      <Text style={styles.title}>{t('farmer.auth.createPassword.title')}</Text>
      <Text style={styles.subtitle}>{t('farmer.auth.createPassword.subtitle')}</Text>

      {errorMsg ? (
        <View style={styles.errorWrap}>
          <ErrorState message={errorMsg} onRetry={() => setErrorMsg(null)} />
        </View>
      ) : null}

      <NewPasswordForm
        submitLabel={t('farmer.auth.createPassword.submit')}
        loading={loading}
        onSubmit={(password) => void handleCreate(password)}
        onMismatch={() => setErrorMsg(t('farmer.auth.password.mismatch'))}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: P.bg,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: P.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 76,
  },
  title: {
    fontSize: typography.title,
    fontWeight: '800',
    color: P.ink,
    textAlign: 'center',
    marginTop: 24,
  },
  subtitle: {
    fontSize: typography.bodySmall,
    lineHeight: 19,
    color: P.muted,
    textAlign: 'center',
    marginTop: 8,
  },
  errorWrap: {
    marginTop: 24,
  },
});
