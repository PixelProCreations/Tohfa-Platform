/**
 * Change own password — `POST /auth/me/change-password`
 * (`auth.password.change_own`).
 *
 * On 204 the server has revoked EVERY session of the account, this device's
 * included; `changePassword` already cleared the local tokens and this screen
 * hands straight to `onPasswordChanged`, which must sign the user out to the
 * login screen. On failure nothing changes: the old password still works.
 *
 * No client-side length/complexity rule: the spec's 10..128 bound is the
 * server's to enforce (root CLAUDE.md §2.7); a 422 shows a policy message.
 * A wrong current password is a 401 from the server and gets its own copy.
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Input } from '@tohfa/mobile-ui';
import { useAdminMutation } from '../../../api/hooks';
import { changePassword } from '../../../api/profile';
import { t } from '../../../i18n';
import { adminTheme } from '../../../theme';
import { InfoSection } from '../shared/InfoSection';
import { ScreenHeader } from '../shared/ScreenHeader';
import {
  changePasswordErrorKey,
  isPasswordFormValid,
  validatePasswordForm,
  type PasswordForm,
  type PasswordFormErrors,
} from './mappers';

const { colors, spacing, typography } = adminTheme;

export function ChangePasswordScreen(props: {
  onBack: () => void;
  onPasswordChanged: () => void;
}): React.JSX.Element {
  const [form, setForm] = useState<PasswordForm>({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState<PasswordFormErrors>({});
  const mutation = useAdminMutation(changePassword, { onSuccess: props.onPasswordChanged });

  const set = (field: keyof PasswordForm) => (value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => {
      const { [field]: _cleared, ...rest } = e;
      return rest;
    });
  };

  const submit = (): void => {
    const found = validatePasswordForm(form);
    setErrors(found);
    if (!isPasswordFormValid(found) || mutation.isPending) return;
    mutation.mutate({ currentPassword: form.currentPassword, newPassword: form.newPassword });
  };

  const err = (field: keyof PasswordForm): string | undefined => {
    const key = errors[field];
    return key === undefined ? undefined : t(key);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <ScreenHeader title={t('admin.profile.password.title')} onBack={props.onBack} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }} keyboardShouldPersistTaps="handled">
        <Text style={{ color: colors.onSurfaceVariant, fontSize: typography.bodySmall }}>
          {t('admin.profile.password.signOutNotice')}
        </Text>
        <InfoSection>
          <Input
            label={t('admin.profile.password.current')}
            value={form.currentPassword}
            onChangeText={set('currentPassword')}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
            editable={!mutation.isPending}
            error={err('currentPassword')}
          />
          <Input
            label={t('admin.profile.password.new')}
            value={form.newPassword}
            onChangeText={set('newPassword')}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            editable={!mutation.isPending}
            error={err('newPassword')}
          />
          <Input
            label={t('admin.profile.password.confirm')}
            value={form.confirmPassword}
            onChangeText={set('confirmPassword')}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            editable={!mutation.isPending}
            error={err('confirmPassword')}
          />
        </InfoSection>
        {mutation.isError ? (
          <Text accessibilityLiveRegion="polite" style={{ color: colors.error, fontSize: typography.bodySmall }}>
            {t(changePasswordErrorKey(mutation.error))}
          </Text>
        ) : null}
        <Button
          title={t('admin.profile.password.submit')}
          loading={mutation.isPending}
          disabled={mutation.isPending}
          onPress={submit}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
