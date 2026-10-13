/**
 * Edit own profile — `PATCH /auth/me` (`auth.profile.edit_own`, BR-82).
 *
 * Only `fullName` and `preferredLocale` are editable. Mobile and e-mail are
 * shown read-only and are never sent (BR-33: either key is 403 FIELD_LOCKED
 * and nothing is applied). Only changed fields go out; with no change the
 * Save button stays disabled (an empty body is a 422). Name bounds are the
 * server's ("unconfirmed default" 2..120): the client trims and lets the
 * server's 422 speak.
 *
 * NOTE: the admin catalogue is English-only, so changing the preferred
 * language does not change this app's UI language (copy says so).
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Input } from '@tohfa/mobile-ui';
import { adminErrorKey } from '../../../api/errors';
import { useAdminMutation } from '../../../api/hooks';
import { LOCALES, updateMe, type LocaleDto } from '../../../api/profile';
import { adminKeys } from '../../../api/queryKeys';
import { t } from '../../../i18n';
import { useAdminSession } from '../../../session/AdminSession';
import { adminTheme } from '../../../theme';
import { FilterChips } from '../shared/FilterChips';
import { InfoRow, InfoSection } from '../shared/InfoSection';
import { ScreenHeader } from '../shared/ScreenHeader';
import { buildProfilePatch, localeLabelKey, type ProfileModel } from './mappers';
import { PROFILE_RESOURCE } from './ProfileHomeScreen';

const { colors, spacing, typography } = adminTheme;

export function EditProfileScreen(props: {
  profile: ProfileModel;
  onBack: () => void;
  onSaved: () => void;
}): React.JSX.Element {
  const { scope } = useAdminSession();
  const [fullName, setFullName] = useState(props.profile.fullName);
  const [locale, setLocale] = useState<LocaleDto | null>(props.profile.preferredLocale);

  const original = { fullName: props.profile.fullName, preferredLocale: props.profile.preferredLocale };
  const patch = buildProfilePatch(original, { fullName, preferredLocale: locale });

  const mutation = useAdminMutation(updateMe, {
    // The session query is GET /auth/me too: refresh it so the name updates everywhere.
    invalidate: [adminKeys.resource(scope.warehouseId, PROFILE_RESOURCE), adminKeys.session()],
    onSuccess: props.onSaved,
  });

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <ScreenHeader title={t('admin.profile.edit.title')} onBack={props.onBack} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }} keyboardShouldPersistTaps="handled">
        <InfoSection>
          <Input
            label={t('admin.profile.field.fullName')}
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            editable={!mutation.isPending}
          />
          <Text style={{ color: colors.onSurfaceVariant, fontSize: typography.bodySmall }}>
            {t('admin.profile.edit.languageLabel')}
          </Text>
        </InfoSection>
        <FilterChips<LocaleDto>
          accessibilityLabel={t('admin.profile.edit.languageLabel')}
          options={LOCALES.map((l) => ({ key: l, value: l, label: t(localeLabelKey(l)) }))}
          selectedKey={locale ?? ''}
          onSelect={(l) => {
            if (!mutation.isPending) setLocale(l);
          }}
        />
        <Text style={{ color: colors.onSurfaceVariant, fontSize: typography.caption }}>
          {t('admin.profile.edit.languageHint')}
        </Text>
        <InfoSection>
          <InfoRow
            label={t('admin.profile.field.mobile')}
            value={props.profile.mobile ?? t('admin.profile.notProvided')}
            tone="muted"
          />
          <InfoRow
            label={t('admin.profile.field.email')}
            value={props.profile.email ?? t('admin.profile.notProvided')}
            tone="muted"
            hint={t('admin.profile.lockedHint')}
          />
        </InfoSection>
        {mutation.isError ? (
          <Text accessibilityLiveRegion="polite" style={{ color: colors.error, fontSize: typography.bodySmall }}>
            {t(adminErrorKey(mutation.error))}
          </Text>
        ) : null}
        {patch === null ? (
          <Text style={{ color: colors.onSurfaceVariant, fontSize: typography.bodySmall }}>
            {t('admin.profile.edit.noChanges')}
          </Text>
        ) : null}
        <Button
          title={t('admin.common.save')}
          loading={mutation.isPending}
          disabled={patch === null || mutation.isPending}
          onPress={() => {
            if (patch !== null) mutation.mutate(patch);
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
