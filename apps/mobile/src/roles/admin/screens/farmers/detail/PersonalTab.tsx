/**
 * Personal tab (team design): the details table, the account lifecycle card
 * and the Deactivate / Disable buttons.
 *
 * The table carries Dev's locked mobile and masked Aadhaar rows (BR-33b: last
 * four digits only). Deactivate shows only with `farmer.account.deactivate`
 * (not in rbac.json yet, so hidden for everyone) and Disable only with
 * `farmer.account.disable`. Both open DESIGN-ONLY modals (./AccountModals.tsx).
 */
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import type { FarmerDetailView } from '../../../api/farmerTypes';
import { t } from '../../../i18n';
import { lifecycleEvents, personalRows, type FarmerDetailAccess } from './model';
import { DetailsTable, EmptyCard, SectionTitle } from './parts';
import { detailStyles as s } from './styles';

export function PersonalTab({
  farmer,
  access,
  onDeactivate,
  onDisable,
}: {
  farmer: FarmerDetailView;
  access: FarmerDetailAccess;
  onDeactivate: () => void;
  onDisable: () => void;
}) {
  const events = lifecycleEvents(farmer);
  const showActions = access.canDeactivate || access.canDisable;
  return (
    <>
      <DetailsTable rows={personalRows(farmer)} />

      <SectionTitle>{t('farmerDetail.lifecycle.title')}</SectionTitle>
      {events.length === 0 ? (
        <EmptyCard text={t('farmerDetail.lifecycle.empty')} />
      ) : (
        events.map((e) => (
          <View key={`${e.label}-${e.time}`} style={s.lifecycleCard}>
            <Text style={s.lifecycleTime}>{e.time}</Text>
            <Text style={s.lifecycleStatus}>{e.label}</Text>
          </View>
        ))
      )}

      {showActions ? (
        <View style={s.actionButtonsRow}>
          {access.canDeactivate ? (
            <TouchableOpacity style={s.deactivateBtn} onPress={onDeactivate} activeOpacity={0.8} accessibilityRole="button">
              <Text style={s.deactivateBtnText}>{t('farmerDetail.account.deactivate')}</Text>
            </TouchableOpacity>
          ) : null}
          {access.canDisable ? (
            <TouchableOpacity style={s.disableBtn} onPress={onDisable} activeOpacity={0.8} accessibilityRole="button">
              <Text style={s.disableBtnText}>{t('farmerDetail.account.disable')}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </>
  );
}
