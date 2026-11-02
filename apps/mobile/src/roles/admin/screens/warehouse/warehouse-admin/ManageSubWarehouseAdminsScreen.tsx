/**
 * Manage Sub Warehouse Admins: the live SWA list, one SWA's detail and the
 * Create Sub Warehouse Admin wizard (information, warehouse assignment,
 * review, success).
 *
 * Gate (FINAL_LIST 155): Main-only. Both GET and POST
 * /admin/sub-warehouse-admins need `admin.sub_wh_admin.create` (MAIN all, SUB
 * none); without it a not-available note renders, nothing is fetched, the
 * create action is not offered and WarehouseAdminFlow refuses the route.
 *
 * BR-25: a SUB_WH_ADMIN has exactly one warehouse, so the wizard cannot reach
 * Review without one; the picker sends the server uuid from GET /warehouses.
 * The per-warehouse cap is `system_config.sub_wh_admin_max_per_warehouse`,
 * which the client cannot read, so the picker offers every active warehouse
 * and the server's 409 is shown as "this warehouse is full".
 *
 * The list (design M15-06) filters the fully loaded rows client-side by the
 * warehouse selector and the search box; see ./subAdminList.ts for why and for
 * the KPI definitions. Review's Create opens a confirm dialog and only its
 * Confirm sends the POST (./confirmCreateSubAdmin.ts).
 *
 * SPEC GAP: there is no update, deactivate or delete endpoint (the server's
 * sub-admins routes say so), so the old edit / status / responsibility items
 * were removed: the detail is read-only and the design's Responsibility
 * Summary (M15-07) is not drawn, as no endpoint exposes another role's
 * permission set. The list carries no mobile.
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import type { CreatedSubAdminDto, SubAdminDto } from '../../../api/subAdmins';
import { warehouseOptionName, type WarehouseOption } from '../../../api/warehouseList';
import { OverviewCardsGrid, OverviewDashboardCard } from '../../../components';
import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType, ADMIN_BUTTON_HEIGHT } from '../../../theme';
import { formatAdminDay } from '../../../utils/datetime';
import { AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { useWarehouseOptions } from '../shared/useWarehouseOptions';
import {
  Card,
  ChipGroup,
  EmptyState,
  InfoCard,
  InfoNote,
  ScopeHeader,
  SearchBar,
  SectionTitle,
  StatusBadge,
  SuccessCircleIcon,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { confirmCreateSubAdmin } from './confirmCreateSubAdmin';
import {
  createSubAdminErrorKey,
  hasDraftErrors,
  normalizeMobile,
  subAdminStatusLabel,
  subAdminStatusTone,
  toCreateSubAdminBody,
  validateSubAdminDraft,
  type SubAdminDraft,
} from './mappers';
import {
  filterSubAdmins,
  filterSubAdminsByWarehouse,
  filterUnstaffedWarehouses,
  swaKpiLabels,
  unstaffedInSelection,
} from './subAdminList';
import { useCreateSubAdmin, useSubAdmins } from './useWarehouseAdminData';
import { AddUserIcon, UserIcon, WAREHOUSE_ADMIN_CODES } from './WarehouseAdminParts';
import type { WarehouseScreenBaseProps } from './types';

type Step = 'list' | 'info' | 'assign' | 'review' | 'success' | 'detail';

/** Back from each step (list leaves the screen). */
const PREVIOUS: Record<Step, Step | null> = {
  list: null,
  info: 'list',
  assign: 'info',
  review: 'assign',
  success: 'list',
  detail: 'list',
};

const EMPTY_DRAFT: SubAdminDraft = { fullName: '', mobile: '', warehouseId: '' };

export type ManageSubWarehouseAdminsScreenProps = WarehouseScreenBaseProps;

export function ManageSubWarehouseAdminsScreen(props: ManageSubWarehouseAdminsScreenProps) {
  if (!props.can(WAREHOUSE_ADMIN_CODES.swaCreate)) {
    return (
      <WalletScreen title={t('warehouseAdmin.swa.title')} onBack={props.onBack}>
        <EmptyState title={t('warehouseAdmin.notAvailable.title')} subtitle={t('warehouseAdmin.swa.notAvailable')} />
      </WalletScreen>
    );
  }
  return <ManageSubWarehouseAdminsContent {...props} />;
}

function titleOf(step: Step): string {
  if (step === 'list') return t('warehouseAdmin.swa.title');
  if (step === 'success') return t('warehouseAdmin.swa.success.title');
  if (step === 'detail') return t('warehouseAdmin.swa.detail.title');
  return t('warehouseAdmin.swa.create.title');
}

function ManageSubWarehouseAdminsContent({ scope, can, onBack }: ManageSubWarehouseAdminsScreenProps) {
  const [step, setStep] = useState<Step>('list');
  const [selected, setSelected] = useState<SubAdminDto | undefined>(undefined);
  const [draft, setDraft] = useState<SubAdminDraft>(EMPTY_DRAFT);
  const [showErrors, setShowErrors] = useState(false);
  const [created, setCreated] = useState<CreatedSubAdminDto | undefined>(undefined);
  /** The list's warehouse selector; undefined is "All Warehouses". */
  const [warehouseFilter, setWarehouseFilter] = useState<string | undefined>(undefined);
  const [query, setQuery] = useState('');

  const admins = useSubAdmins(true);
  const warehouses = useWarehouseOptions({ enabled: can(WAREHOUSE_ADMIN_CODES.allView) });
  const activeOptions = useMemo(() => warehouses.options.filter((o) => o.isActive), [warehouses.options]);
  const create = useCreateSubAdmin();

  const list = admins.data ?? [];
  const nameOf = (warehouseId: string) => warehouseOptionName(warehouses.options, warehouseId) ?? t('warehouseAdmin.figure.unavailable');
  // Create starts from every warehouse that has no SWA, whatever the list is filtered to.
  const unstaffed = admins.data === undefined ? [] : unstaffedInSelection(warehouses.options, admins.data, undefined);
  const errors = validateSubAdminDraft(draft);

  // List view: the selector first, then the search (see ./subAdminList.ts).
  const adminRows = filterSubAdmins(filterSubAdminsByWarehouse(list, warehouseFilter), query, nameOf);
  const unstaffedRows = filterUnstaffedWarehouses(unstaffedInSelection(warehouses.options, list, warehouseFilter), query);
  // A failed warehouse read is a failed figure, never "no warehouse is unassigned".
  const warehouseSource = {
    data: warehouses.isLoading || warehouses.error ? undefined : warehouses.options,
    isLoading: warehouses.isLoading,
    error: warehouses.error,
  };
  const kpi = swaKpiLabels({
    admins: { data: admins.data, isLoading: admins.isLoading, error: admins.error },
    warehouses: warehouseSource,
    warehouseId: warehouseFilter,
  });
  const selectorOptions = warehouses.options.map((o: WarehouseOption) => ({ warehouseId: o.warehouseId, warehouseName: o.warehouseName }));

  const back = () => {
    const prev = PREVIOUS[step];
    if (prev === null) onBack();
    else setStep(prev);
  };
  const startCreate = () => {
    setDraft({ ...EMPTY_DRAFT, warehouseId: unstaffed[0]?.warehouseId ?? '' });
    setShowErrors(false);
    setCreated(undefined);
    create.reset();
    setStep('info');
  };
  const goNext = (next: Step, fields: readonly (keyof SubAdminDraft)[]) => {
    if (hasDraftErrors(errors, fields)) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    setStep(next);
  };
  const submit = () => {
    if (hasDraftErrors(errors, ['fullName', 'mobile', 'warehouseId'])) {
      setShowErrors(true);
      return;
    }
    create.mutate(toCreateSubAdminBody(draft), {
      onSuccess: (row) => {
        setCreated(row);
        setStep('success');
      },
    });
  };
  // Review's Create only opens the confirm; its Confirm is the one caller of submit (BR-25, BR-81).
  const confirmCreate = () =>
    confirmCreateSubAdmin({ name: draft.fullName.trim(), warehouse: nameOf(draft.warehouseId) }, submit);
  const fieldError = (field: keyof SubAdminDraft) => {
    const key = errors[field];
    return showErrors && key !== undefined ? <Text style={styles.fieldError}>{t(key)}</Text> : null;
  };

  const footer = (() => {
    switch (step) {
      case 'list':
        return admins.data !== undefined ? (
          <WalletFooter>
            <WalletButton label={t('warehouseAdmin.swa.create.action')} icon={<AddUserIcon />} onPress={startCreate} />
          </WalletFooter>
        ) : undefined;
      case 'info':
        return (
          <WalletFooter>
            <WalletButton label={t('warehouseAdmin.swa.create.nextAssign')} onPress={() => goNext('assign', ['fullName', 'mobile'])} />
            <WalletButton label={t('warehouseAdmin.swa.create.cancel')} variant="neutral" onPress={() => setStep('list')} />
          </WalletFooter>
        );
      case 'assign':
        return (
          <WalletFooter>
            {/* BR-25: no SWA without a warehouse. */}
            <WalletButton
              label={t('warehouseAdmin.swa.create.nextReview')}
              onPress={() => goNext('review', ['warehouseId'])}
              disabled={draft.warehouseId === ''}
            />
            <WalletButton label={t('warehouseAdmin.swa.create.back')} variant="neutral" onPress={back} />
          </WalletFooter>
        );
      case 'review':
        return (
          <WalletFooter>
            <WalletButton
              label={create.isPending ? t('warehouseAdmin.swa.create.submitting') : t('warehouseAdmin.swa.create.submit')}
              onPress={confirmCreate}
              disabled={create.isPending}
            />
            <WalletButton label={t('warehouseAdmin.swa.create.back')} variant="neutral" onPress={back} disabled={create.isPending} />
          </WalletFooter>
        );
      case 'success':
        return (
          <WalletFooter>
            <WalletButton label={t('warehouseAdmin.swa.success.back')} onPress={() => setStep('list')} />
          </WalletFooter>
        );
      default:
        return undefined;
    }
  })();

  return (
    <WalletScreen
      title={titleOf(step)}
      onBack={back}
      headerExtra={
        <ScopeHeader
          scope={scope}
          label={t('warehouseAdmin.scope.all')}
          warehouseOptions={selectorOptions}
          selectedWarehouseId={warehouseFilter}
          onSelectWarehouse={step === 'list' && selectorOptions.length > 0 ? setWarehouseFilter : undefined}
        />
      }
      footer={footer}
    >
      {step === 'list' && admins.data === undefined ? (
        admins.isLoading ? (
          <AdminLoadingState />
        ) : (
          <AdminErrorState error={admins.error} onRetry={admins.refresh} />
        )
      ) : null}
      {step !== 'list' || admins.data !== undefined ? (
        <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {step === 'list' ? (
            <>
              <OverviewCardsGrid style={styles.kpiGrid}>
                <OverviewDashboardCard value={kpi.total} title={t('warehouseAdmin.swa.kpi.total')} icon="pickup" />
                <OverviewDashboardCard value={kpi.active} title={t('warehouseAdmin.swa.kpi.active')} icon="pickup" tone="success" />
                <OverviewDashboardCard value={kpi.pendingAssignment} title={t('warehouseAdmin.swa.kpi.pendingAssignment')} icon="inventory" tone="warning" />
                <OverviewDashboardCard value={kpi.attention} title={t('warehouseAdmin.swa.kpi.attention')} icon="alert" tone="danger" />
              </OverviewCardsGrid>
              <SearchBar value={query} onChangeText={setQuery} placeholder={t('warehouseAdmin.swa.search.placeholder')} />
              {list.length === 0 ? <EmptyState title={t('warehouseAdmin.swa.empty.title')} subtitle={t('warehouseAdmin.swa.empty.subtitle')} /> : null}
              {list.length > 0 && adminRows.length === 0 && unstaffedRows.length === 0 ? <EmptyState title={t('warehouseAdmin.swa.search.noMatch')} /> : null}
              {adminRows.map((a) => (
                <TouchableOpacity
                  key={`${a.userId}-${a.warehouseId}`}
                  style={styles.row}
                  onPress={() => {
                    setSelected(a);
                    setStep('detail');
                  }}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                >
                  <View style={styles.avatar}>
                    <UserIcon />
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.rowTitle}>{a.fullName}</Text>
                    <Text style={styles.rowMeta}>
                      {t('warehouseAdmin.swa.rowMeta', {
                        code: a.adminCode ?? t('warehouseAdmin.figure.unavailable'),
                        warehouse: nameOf(a.warehouseId),
                      })}
                    </Text>
                  </View>
                  <StatusBadge label={subAdminStatusLabel(a.status)} tone={subAdminStatusTone(a.status)} />
                </TouchableOpacity>
              ))}
              {unstaffedRows.map((w) => (
                <View key={w.warehouseId} style={styles.row}>
                  <View style={[styles.avatar, styles.avatarMuted]}>
                    <UserIcon color={adminColors.muted} crossed />
                  </View>
                  <View style={styles.flex}>
                    <Text style={[styles.rowTitle, styles.mutedText]}>{t('warehouseAdmin.swa.unassigned')}</Text>
                    <Text style={styles.rowMeta}>{t('warehouseAdmin.swa.unassignedMeta', { warehouse: w.warehouseName })}</Text>
                  </View>
                  <StatusBadge label={t('warehouseAdmin.swa.unassignedBadge')} tone="warning" />
                </View>
              ))}
              <InfoNote tone="info">{t('warehouseAdmin.swa.noEditNote')}</InfoNote>
            </>
          ) : null}

          {step === 'info' ? (
            <>
              <SectionTitle>{t('warehouseAdmin.swa.create.infoSection')}</SectionTitle>
              <Text style={styles.inputLabel}>{t('warehouseAdmin.swa.field.name')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('warehouseAdmin.swa.field.namePlaceholder')}
                placeholderTextColor={adminColors.placeholder}
                value={draft.fullName}
                onChangeText={(fullName) => setDraft((d) => ({ ...d, fullName }))}
                accessibilityLabel={t('warehouseAdmin.swa.field.name')}
              />
              {fieldError('fullName')}
              <Text style={[styles.inputLabel, styles.inputSpaced]}>{t('warehouseAdmin.swa.field.mobile')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('warehouseAdmin.swa.field.mobilePlaceholder')}
                placeholderTextColor={adminColors.placeholder}
                value={draft.mobile}
                onChangeText={(mobile) => setDraft((d) => ({ ...d, mobile }))}
                keyboardType="phone-pad"
                autoComplete="tel"
                accessibilityLabel={t('warehouseAdmin.swa.field.mobile')}
              />
              {fieldError('mobile')}
              <Text style={styles.hint}>{t('warehouseAdmin.swa.field.passwordHint')}</Text>
            </>
          ) : null}

          {step === 'assign' ? (
            <>
              <SectionTitle>{t('warehouseAdmin.swa.create.assignSection')}</SectionTitle>
              {warehouses.isLoading ? <AdminLoadingState /> : null}
              {!warehouses.isLoading && warehouses.error ? <AdminErrorState error={warehouses.error} onRetry={warehouses.refresh} /> : null}
              {!warehouses.isLoading && !warehouses.error && activeOptions.length === 0 ? (
                <EmptyState title={t('warehouseAdmin.swa.create.noWarehouses')} />
              ) : null}
              {activeOptions.length > 0 ? (
                <ChipGroup
                  options={activeOptions.map((o) => o.warehouseId)}
                  value={draft.warehouseId}
                  onChange={(warehouseId) => setDraft((d) => ({ ...d, warehouseId }))}
                  labelOf={nameOf}
                />
              ) : null}
              {fieldError('warehouseId')}
              <Text style={styles.hint}>{t('warehouseAdmin.swa.create.capHint')}</Text>
            </>
          ) : null}

          {step === 'review' ? (
            <>
              <SectionTitle>{t('warehouseAdmin.swa.create.reviewSection')}</SectionTitle>
              <InfoCard
                rows={[
                  [
                    { label: t('warehouseAdmin.swa.field.name'), value: draft.fullName.trim() },
                    { label: t('warehouseAdmin.swa.field.mobile'), value: normalizeMobile(draft.mobile) },
                  ],
                  [{ label: t('warehouseAdmin.swa.field.warehouse'), value: nameOf(draft.warehouseId) }],
                ]}
              />
              {create.error ? <InfoNote tone="danger">{t(createSubAdminErrorKey(create.error))}</InfoNote> : null}
            </>
          ) : null}

          {step === 'success' && created ? (
            <Card centered>
              <SuccessCircleIcon />
              <Text style={styles.successTitle}>{t('warehouseAdmin.swa.success.heading')}</Text>
              <Text style={styles.rowMeta}>
                {t('warehouseAdmin.swa.success.body', { name: created.fullName, code: created.adminCode, warehouse: nameOf(created.warehouseId) })}
              </Text>
              <Text style={styles.hint}>{t('warehouseAdmin.swa.field.passwordHint')}</Text>
            </Card>
          ) : null}

          {step === 'detail' && selected ? (
            <>
              <Card centered>
                <View style={styles.avatar}>
                  <UserIcon />
                </View>
                <Text style={styles.rowTitle}>{selected.fullName}</Text>
                <StatusBadge label={subAdminStatusLabel(selected.status)} tone={subAdminStatusTone(selected.status)} />
              </Card>
              <InfoCard
                rows={[
                  [
                    { label: t('warehouseAdmin.swa.field.adminCode'), value: selected.adminCode ?? t('warehouseAdmin.figure.unavailable') },
                    { label: t('warehouseAdmin.swa.field.warehouse'), value: nameOf(selected.warehouseId) },
                  ],
                  [{ label: t('warehouseAdmin.swa.field.assignedOn'), value: formatAdminDay(selected.assignedAt) || t('warehouseAdmin.figure.unavailable') }],
                ]}
              />
              <InfoNote tone="warning">{t('warehouseAdmin.swa.noEditNote')}</InfoNote>
            </>
          ) : null}
        </ScrollView>
      ) : null}
    </WalletScreen>
  );
}

const AVATAR = 44;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  kpiGrid: { marginBottom: adminSpacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMuted: { backgroundColor: adminColors.canvas },
  rowTitle: { ...adminType.rowTitle, color: adminColors.ink },
  rowMeta: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xs },
  mutedText: { color: adminColors.muted },
  inputLabel: { ...adminType.rowTitle, color: adminColors.muted, marginBottom: adminSpacing.xs },
  inputSpaced: { marginTop: adminSpacing.md },
  input: {
    ...adminType.body,
    color: adminColors.ink,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    height: ADMIN_BUTTON_HEIGHT,
    paddingHorizontal: adminSpacing.md,
  },
  fieldError: { ...adminType.caption, color: adminColors.danger.text, marginTop: adminSpacing.xs },
  hint: { ...adminType.caption, color: adminColors.muted, marginTop: adminSpacing.md },
  successTitle: { ...adminType.sectionHead, color: adminColors.ink, marginTop: adminSpacing.md },
});
