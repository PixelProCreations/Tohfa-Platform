/**
 * Edit Farmer Profile (Farmers Management): the team design's single long
 * form with a sticky Cancel / Save bar (tofhafarmfin-rbac
 * AdminEditFarmerScreen), on live data. Sections live in ./edit/, decisions in
 * ./edit/model.ts (tests: farmerEdit_model.test.ts, farmerDetail_wiring.test.ts).
 *
 * Gate: `farmer.profile.edit` (+ view_all to load the profile), via the `can`
 * prop, FAIL CLOSED. Without it the screen shows a not-available state and
 * fetches nothing. The PATCH is built by buildFarmerPatch (BR-33a: the mobile
 * is sent only by a holder of `farmer.profile.edit_locked_field`; the Aadhaar
 * is never sent from this form). Fields the PATCH cannot change are shown
 * read-only. The rating is not on this form (BR-06e).
 *
 * Save asks "Save changes to this farmer?" first (owner request); only the
 * pop-up's Save button sends the PATCH. Validation errors and "nothing has
 * changed" still show inline without the pop-up. Success is reported to the
 * host (onSaved / onSave) only after the server answered; the host shows the
 * "Changes Saved" toast.
 *
 * Backward compatible with roles/farmer/App.tsx: `farmer` (only its id and
 * name are read), `initialTab` and `onSave(updated, tab)` keep their shape;
 * `updated` is the caller's own object with the name the server stored, so
 * the App's "Changes Saved" toast keeps working. `onSaved` hands the saved
 * profile view to new callers. `onNavigateToEditCategories` is accepted but
 * unused (category editing is BR-06e territory).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, BackHandler, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, ScreenStatusBar } from '@tohfa/mobile-ui';
import { adminErrorKey } from '../../api/errors';
import { useFarmer, useFarmerDocuments, useUpdateFarmer } from '../../api/farmerHooks';
import { toEditFarmerForm, toFarmerDetail } from '../../api/farmerMappers';
import type { EditFarmerFormValues, FarmerDetailView } from '../../api/farmerTypes';
import { t, type TranslationKey } from '../../i18n';
import type { Can } from '../../permissions/can';
import { adminColors } from '../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';
import { HeaderBanner } from './detail/DetailHeader';
import { farmerDetailAccess, farmerDetailViewState, type FarmerDetailTabType } from './detail/model';
import { detailStyles as ds } from './detail/styles';
import {
  AddressSection,
  Disclaimer,
  DocumentsSection,
  IdentitySection,
  PersonalSection,
  PlotsSection,
  ZoneFarmSection,
} from './edit/EditSections';
import { editFormErrors, editPatch, farmerEditAccess, farmerEditFetchId, savedFarmerRef } from './edit/model';
import { editStyles as e } from './edit/styles';

/** What a caller already holds about the farmer. `name` is replaced by the saved name in onSave. */
export interface EditFarmerRef {
  id: string;
  name: string;
}

export interface AdminEditFarmerScreenProps<T extends EditFarmerRef = EditFarmerRef> {
  /** The farmer uuid. Takes precedence over `farmer.id`. */
  farmerId?: string | undefined;
  /** Kept for the existing mounts: only `id` (and `name`, for onSave) are read. */
  farmer?: T | undefined;
  warehouseId?: string | undefined;
  /** Permission check (permissions/can.ts). Missing => nothing is permitted. */
  can?: Can | undefined;
  /** The detail tab the edit was opened from; handed back in onSave/onSaved. */
  initialTab?: FarmerDetailTabType | undefined;
  onBack: () => void;
  /** App.tsx's contract: the caller's object with the saved name, and the tab. Called only when `farmer` was passed. */
  onSave?: ((updatedFarmer: T, activeTab: FarmerDetailTabType) => void) | undefined;
  /** The saved profile as the server returned it. */
  onSaved?: ((farmer: FarmerDetailView, activeTab: FarmerDetailTabType) => void) | undefined;
  /** Accepted for compatibility; unused. */
  onNavigateToEditCategories?: (() => void) | undefined;
}

export function AdminEditFarmerScreen<T extends EditFarmerRef = EditFarmerRef>({
  farmerId: farmerIdProp,
  farmer: farmerRef,
  warehouseId,
  can,
  initialTab = 'Personal',
  onBack,
  onSave,
  onSaved,
}: AdminEditFarmerScreenProps<T>) {
  const farmerId = farmerIdProp ?? farmerRef?.id;
  const access = farmerEditAccess(can);
  const detailAccess = farmerDetailAccess(can);
  const live = useFarmer(warehouseId, farmerEditFetchId(access, farmerId));
  const documents = useFarmerDocuments(warehouseId, access.canEdit && detailAccess.canViewDocuments ? farmerId : undefined);
  const update = useUpdateFarmer(farmerId);

  const initial = useMemo(() => (live.dto === undefined ? undefined : toEditFarmerForm(live.dto)), [live.dto]);
  const [values, setValues] = useState<EditFarmerFormValues | undefined>(undefined);
  const [formErrors, setFormErrors] = useState<TranslationKey[]>([]);
  const [noChanges, setNoChanges] = useState(false);

  // Fill the form once, when the profile first arrives; a background refetch must not wipe the admin's typing.
  useEffect(() => {
    if (initial !== undefined) setValues((prev) => prev ?? initial);
  }, [initial]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => sub.remove();
  }, [onBack]);

  const setField = <K extends keyof EditFarmerFormValues>(key: K, value: EditFarmerFormValues[K]) => {
    setValues((prev) => (prev === undefined ? prev : { ...prev, [key]: value }));
    setFormErrors([]);
    setNoChanges(false);
    update.reset();
  };

  const handleSave = () => {
    if (initial === undefined || values === undefined || update.isPending) return;
    const errors = editFormErrors(values);
    setFormErrors(errors);
    if (errors.length > 0) return;
    const patch = editPatch(initial, values, access);
    if (patch === null) {
      setNoChanges(true);
      return;
    }
    const send = () =>
      update.run(patch, (dto) => {
        const saved = toFarmerDetail(dto);
        onSaved?.(saved, initialTab);
        if (farmerRef !== undefined && onSave !== undefined) onSave(savedFarmerRef(farmerRef, dto.fullName), initialTab);
        if (onSaved === undefined && (farmerRef === undefined || onSave === undefined)) onBack();
      });
    Alert.alert(t('farmerDetail.edit.saveConfirm.title'), t('farmerDetail.edit.saveConfirm.message'), [
      { text: t('farmerDetail.edit.saveConfirm.cancel'), style: 'cancel' },
      { text: t('farmerDetail.edit.saveConfirm.confirm'), onPress: send },
    ]);
  };

  const view = farmerDetailViewState({
    canView: access.canEdit,
    hasFarmerId: farmerId !== undefined,
    isLoading: live.isLoading,
    error: live.error,
    hasFarmer: live.farmer !== undefined,
  });
  const farmer = live.farmer;
  const saveError = update.error !== null && update.error !== undefined ? t(adminErrorKey(update.error)) : null;

  return (
    <SafeAreaView style={ds.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      <HeaderBanner title={t('farmerDetail.edit.title')} onBack={onBack} />

      {view !== 'ready' || farmer === undefined || values === undefined ? (
        <ScrollView style={ds.scroll} contentContainerStyle={[ds.scrollContent, ds.stateWrap]}>
          {view === 'denied' ? (
            <AdminEmptyState title={t('farmerDetail.edit.denied')} />
          ) : view === 'notFound' ? (
            <AdminEmptyState title={t('farmerDetail.state.notFound')} />
          ) : view === 'error' ? (
            <AdminErrorState error={live.error} onRetry={live.refresh} />
          ) : (
            <AdminLoadingState />
          )}
        </ScrollView>
      ) : (
        <>
          <ScrollView style={ds.scroll} contentContainerStyle={e.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <PersonalSection values={values} setField={setField} access={access} />
            <IdentitySection farmer={farmer} />
            <AddressSection values={values} setField={setField} />
            <ZoneFarmSection farmer={farmer} />
            <PlotsSection farmer={farmer} />
            <DocumentsSection documents={documents.documents} detailAccess={detailAccess} />
            <Disclaimer />
          </ScrollView>

          <View style={e.bottomBar}>
            {formErrors.map((key) => (
              <Text key={key} style={e.barMessage}>
                {t(key)}
              </Text>
            ))}
            {saveError !== null ? <Text style={e.barMessage}>{saveError}</Text> : null}
            {noChanges ? <Text style={e.barInfo}>{t('farmerDetail.edit.noChanges')}</Text> : null}
            <View style={e.bottomRow}>
              <TouchableOpacity style={e.cancelBtn} onPress={onBack} activeOpacity={0.8} accessibilityRole="button">
                <Text style={e.cancelBtnText}>{t('farmerDetail.edit.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[e.saveBtn, update.isPending && e.saveBtnDisabled]}
                onPress={handleSave}
                disabled={update.isPending}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <Text style={e.saveBtnText}>{update.isPending ? t('farmerDetail.edit.saving') : t('farmerDetail.edit.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
