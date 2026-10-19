/**
 * Notification preferences of the signed-in warehouse admin (FINAL_LIST #80),
 * for Main and Sub.
 *
 * Was SubWarehouseNotificationSettingsScreen (fourteen separate useState
 * switches). Gate: none on the client; the server enforces
 * notification.own.admin_preferences (`all` for every admin role).
 *
 * Live (plan phase 8, BR-82): the switches are GET
 * /notification-preferences/admin (all 14 categories; a category never
 * changed is on). The switches edit a local draft; Save sends one PATCH per
 * CHANGED category (there is no bulk endpoint) and the screen then shows what
 * the server stored. Reset to Default sets every category on and saves it the
 * same way. The master switch is the IN_APP_MASTER category: while it is off,
 * the others are greyed (the server stores them regardless).
 *
 * Note (docs/rules.md open contradiction 28): no admin event is mapped to
 * these categories yet, so they are stored preferences the dispatcher does not
 * consult today.
 */
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { adminErrorKey } from '../../../api/errors';
import { t } from '../../../i18n';
import { adminColors, adminSpacing, adminType } from '../../../theme';
import { AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import { Card, InfoNote, SectionTitle, WalletButton, WalletScreen } from '../wallet-cashtopup/WalletParts';
import {
  changedPreferences,
  defaultPreferenceState,
  NOTIFICATION_PREFERENCE_GROUPS,
  type PreferenceState,
} from './mappers';
import { MenuCard, profileLayout, SaveIcon, StatusRow } from './ProfileParts';
import type { WarehouseScreenBaseProps } from './types';
import type { PreferenceChange } from './useProfileData';

export interface NotificationSettingsScreenProps extends WarehouseScreenBaseProps {
  /** The stored preferences (GET /notification-preferences/admin); undefined until they load. */
  preferences?: PreferenceState | undefined;
  isLoading?: boolean | undefined;
  error?: unknown;
  onRetry?: (() => void) | undefined;
  onRefresh?: (() => void) | undefined;
  isRefreshing?: boolean | undefined;
  /** PATCH each changed category. Without it the switches are read-only. */
  onSave?: ((changes: readonly PreferenceChange[]) => void) | undefined;
  isSaving?: boolean | undefined;
  saveError?: unknown;
}

export function NotificationSettingsScreen({
  onBack,
  preferences,
  isLoading = false,
  error,
  onRetry,
  onRefresh,
  isRefreshing = false,
  onSave,
  isSaving = false,
  saveError,
}: NotificationSettingsScreenProps) {
  const [draft, setDraft] = useState<PreferenceState | undefined>(preferences);

  // The server's state replaces the draft whenever it (re)loads, e.g. after a save.
  useEffect(() => {
    setDraft(preferences);
  }, [preferences]);

  const state = preferences !== undefined && draft !== undefined ? 'ready' : queryViewState({ isLoading, error, itemCount: 0 });
  if (state !== 'ready' || preferences === undefined || draft === undefined) {
    return (
      <WalletScreen title="Notification Settings" onBack={onBack}>
        {state === 'loading' ? <AdminLoadingState /> : <AdminErrorState error={error} onRetry={onRetry} />}
      </WalletScreen>
    );
  }

  const saved = preferences;
  const current = draft;
  const editable = onSave !== undefined && !isSaving;
  const changes = changedPreferences(saved, current);
  const inApp = current.IN_APP_MASTER;
  const set = (category: keyof PreferenceState, enabled: boolean) => setDraft({ ...current, [category]: enabled });

  const save = () => {
    if (onSave && changes.length > 0 && !isSaving) onSave(changes);
  };

  const resetDefaults = () => {
    const defaults = defaultPreferenceState();
    setDraft(defaults);
    const resetChanges = changedPreferences(saved, defaults);
    if (onSave && resetChanges.length > 0 && !isSaving) onSave(resetChanges);
  };

  return (
    <WalletScreen title="Notification Settings" onBack={onBack}>
      <ScrollView
        contentContainerStyle={profileLayout.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={onRefresh ? <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} /> : undefined}
      >
        <Card>
          <View style={styles.masterRow}>
            <View style={styles.masterText}>
              <Text style={styles.masterTitle}>Receive In-App Notifications</Text>
              <Text style={styles.masterSubtitle}>Master toggle for alerts & sound</Text>
            </View>
            <PreferenceSwitch value={inApp} disabled={!editable} onValueChange={(next) => set('IN_APP_MASTER', next)} />
          </View>
        </Card>

        {NOTIFICATION_PREFERENCE_GROUPS.map((group) => (
          <React.Fragment key={group.titleKey}>
            <SectionTitle>{t(group.titleKey)}</SectionTitle>
            <MenuCard>
              {group.items.map((item) => (
                <StatusRow
                  key={item.category}
                  label={t(item.labelKey)}
                  right={
                    <PreferenceSwitch
                      value={current[item.category]}
                      disabled={!inApp || !editable}
                      onValueChange={(next) => set(item.category, next)}
                    />
                  }
                />
              ))}
            </MenuCard>
          </React.Fragment>
        ))}

        {saveError !== null && saveError !== undefined ? (
          <View style={styles.error}>
            <InfoNote tone="danger">{t(adminErrorKey(saveError))}</InfoNote>
          </View>
        ) : null}

        {onSave ? (
          <View style={styles.actions}>
            <WalletButton label="Reset to Default" variant="neutral" onPress={resetDefaults} disabled={isSaving} />
            <WalletButton
              label={isSaving ? t('profile.notifications.saving') : 'Save Preferences'}
              icon={<SaveIcon />}
              onPress={save}
              disabled={isSaving || changes.length === 0}
            />
          </View>
        ) : null}
      </ScrollView>
    </WalletScreen>
  );
}

function PreferenceSwitch({
  value,
  onValueChange,
  disabled = false,
}: {
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: adminColors.border, true: adminColors.brand }}
      thumbColor={adminColors.card}
    />
  );
}

const styles = StyleSheet.create({
  masterRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.md },
  masterText: { flex: 1 },
  masterTitle: { ...adminType.rowTitle, color: adminColors.ink },
  masterSubtitle: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },
  error: { marginTop: adminSpacing.lg },
  actions: { gap: adminSpacing.sm, marginTop: adminSpacing.xl },
});
