/**
 * Manage Sub Warehouse Admins: the SWA list, one SWA's detail and the Create
 * Sub Warehouse Admin wizard (information, warehouse assignment, review,
 * confirm, success).
 *
 * Gate (FINAL_LIST 155): Main-only. The screen AND the Create SWA wizard need
 * `admin.sub_wh_admin.create` (MAIN all, SUB none); without it a
 * not-available note renders and WarehouseAdminFlow refuses the route.
 * BR-25: a SUB_WH_ADMIN must have a warehouse, so the wizard cannot reach
 * Review without one. Creation is a local mock (no SWA create call is wired;
 * SPEC_GAPS W4x-3). Assignment options are the seeded warehouses with no SWA,
 * not the old hard-coded 'Gudalur Market'.
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { adminColors, adminRadius, adminSpacing, adminType, ADMIN_BUTTON_HEIGHT } from '../../../theme';
import {
  Card,
  ChipGroup,
  EmptyState,
  InfoCard,
  InfoNote,
  KpiRow,
  ScopeHeader,
  SectionTitle,
  SuccessCircleIcon,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { adminWarehouseLabel, adminWarehouseName, SUB_WAREHOUSE_ADMINS, WAREHOUSE_ADMIN_ROWS } from './fixtures';
import { AddUserIcon, UserIcon, WAREHOUSE_ADMIN_CODES } from './WarehouseAdminParts';
import type { SubWarehouseAdminItem, WarehouseAdminRow, WarehouseScreenBaseProps } from './types';

type Step = 'list' | 'info' | 'assign' | 'review' | 'confirm' | 'success' | 'detail';

const TITLE: Record<Step, string> = {
  list: 'Sub Warehouse Admins',
  info: 'Create Sub Warehouse Admin',
  assign: 'Create Sub Warehouse Admin',
  review: 'Create Sub Warehouse Admin',
  confirm: 'Create Sub Warehouse Admin',
  success: 'Admin Created',
  detail: 'Sub Warehouse Admin',
};

/** Back from each step (list and detail leave / return to the list). */
const PREVIOUS: Record<Step, Step | null> = {
  list: null,
  info: 'list',
  assign: 'info',
  review: 'assign',
  confirm: 'review',
  success: 'list',
  detail: 'list',
};

export interface ManageSubWarehouseAdminsScreenProps extends WarehouseScreenBaseProps {
  admins?: readonly SubWarehouseAdminItem[] | undefined;
  warehouses?: readonly WarehouseAdminRow[] | undefined;
}

export function ManageSubWarehouseAdminsScreen({
  scope,
  can,
  onBack,
  admins = SUB_WAREHOUSE_ADMINS,
  warehouses = WAREHOUSE_ADMIN_ROWS,
}: ManageSubWarehouseAdminsScreenProps) {
  const [step, setStep] = useState<Step>('list');
  const [list, setList] = useState<readonly SubWarehouseAdminItem[]>(admins);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [adminName, setAdminName] = useState('');
  const [warehouseId, setWarehouseId] = useState<string>('');

  if (!can(WAREHOUSE_ADMIN_CODES.swaCreate)) {
    return (
      <WalletScreen title="Sub Warehouse Admins" onBack={onBack}>
        <EmptyState title="Not available" subtitle="Managing Sub Warehouse Admins needs admin.sub_wh_admin.create." />
      </WalletScreen>
    );
  }

  const assigned = new Set(list.map((a) => a.warehouseId));
  const openWarehouses = warehouses.filter((w) => !assigned.has(w.warehouseId)).map((w) => w.warehouseId);
  const selected = list.find((a) => a.id === selectedId);

  const back = () => {
    const prev = PREVIOUS[step];
    if (prev === null) onBack();
    else setStep(prev);
  };
  const startCreate = () => {
    setAdminName('');
    setWarehouseId(openWarehouses[0] ?? '');
    setStep('info');
  };
  const create = () => {
    const id = `SWA-${String(list.length + 1).padStart(3, '0')}`;
    setList((prev) => [
      ...prev,
      { id, name: adminName.trim() || 'New Admin', warehouseId, status: 'Pending', responsibilities: ['Goods Receiving', 'Inventory', 'Orders'] },
    ]);
    setStep('success');
  };

  const footer = (() => {
    switch (step) {
      case 'list':
        return (
          <WalletFooter>
            <WalletButton label="Create Sub Warehouse Admin" icon={<AddUserIcon />} onPress={startCreate} disabled={openWarehouses.length === 0} />
          </WalletFooter>
        );
      case 'info':
        return (
          <WalletFooter>
            <WalletButton label="Next: Warehouse Assignment" onPress={() => setStep('assign')} disabled={adminName.trim() === ''} />
            <WalletButton label="Cancel" variant="neutral" onPress={() => setStep('list')} />
          </WalletFooter>
        );
      case 'assign':
        return (
          <WalletFooter>
            {/* BR-25: no SWA without a warehouse. */}
            <WalletButton label="Next: Review" onPress={() => setStep('review')} disabled={warehouseId === ''} />
            <WalletButton label="Back" variant="neutral" onPress={back} />
          </WalletFooter>
        );
      case 'review':
        return (
          <WalletFooter>
            <WalletButton label="Create" onPress={() => setStep('confirm')} />
            <WalletButton label="Back" variant="neutral" onPress={back} />
          </WalletFooter>
        );
      case 'success':
        return (
          <WalletFooter>
            <WalletButton label="Back to Sub Warehouse Admins" onPress={() => setStep('list')} />
          </WalletFooter>
        );
      default:
        return undefined;
    }
  })();

  return (
    <WalletScreen title={TITLE[step]} onBack={back} headerExtra={<ScopeHeader scope={scope} />} footer={footer}>
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        {step === 'list' ? (
          <>
            <KpiRow
              items={[
                { value: String(list.length), label: 'TOTAL SWAs' },
                { value: String(list.filter((a) => a.status === 'Pending').length), label: 'PENDING', tone: 'warning' },
                { value: String(openWarehouses.length), label: 'UNASSIGNED', tone: 'danger' },
              ]}
            />
            {list.map((a) => (
              <TouchableOpacity
                key={a.id}
                style={styles.row}
                onPress={() => {
                  setSelectedId(a.id);
                  setStep('detail');
                }}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <View style={styles.avatar}>
                  <UserIcon />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.rowTitle}>{a.name}</Text>
                  <Text style={styles.rowMeta}>
                    {a.id} · {adminWarehouseLabel(a.warehouseId)} · {a.status}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            {openWarehouses.map((id) => (
              <View key={id} style={styles.row}>
                <View style={[styles.avatar, styles.avatarMuted]}>
                  <UserIcon color={adminColors.muted} crossed />
                </View>
                <View style={styles.flex}>
                  <Text style={[styles.rowTitle, styles.mutedText]}>Unassigned</Text>
                  <Text style={styles.rowMeta}>{adminWarehouseLabel(id)} · No SWA</Text>
                </View>
              </View>
            ))}
          </>
        ) : null}

        {step === 'info' ? (
          <>
            <SectionTitle>Admin Information</SectionTitle>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Full name"
              placeholderTextColor={adminColors.placeholder}
              value={adminName}
              onChangeText={setAdminName}
              accessibilityLabel="Admin full name"
            />
          </>
        ) : null}

        {step === 'assign' ? (
          <>
            <SectionTitle>Warehouse Assignment</SectionTitle>
            {openWarehouses.length === 0 ? (
              <EmptyState title="Every warehouse has an SWA" />
            ) : (
              <ChipGroup options={openWarehouses} value={warehouseId} onChange={setWarehouseId} labelOf={adminWarehouseLabel} />
            )}
          </>
        ) : null}

        {step === 'review' ? (
          <>
            <SectionTitle>Review</SectionTitle>
            <InfoCard
              rows={[
                [
                  { label: 'Name', value: adminName.trim() || 'New Admin' },
                  { label: 'Assigned Warehouse', value: adminWarehouseName(warehouseId) },
                ],
              ]}
            />
          </>
        ) : null}

        {step === 'confirm' ? (
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Create Sub Warehouse Admin?</Text>
            <WalletButton label="Confirm" variant="outline" onPress={create} />
          </View>
        ) : null}

        {step === 'success' ? (
          <Card centered>
            <SuccessCircleIcon />
            <Text style={styles.successTitle}>Sub Warehouse Admin Created</Text>
          </Card>
        ) : null}

        {step === 'detail' && selected ? (
          <>
            <Card centered>
              <View style={styles.avatar}>
                <UserIcon />
              </View>
              <Text style={styles.rowTitle}>{selected.name}</Text>
              <Text style={styles.rowMeta}>
                Admin ID: {selected.id} · {selected.status}
              </Text>
            </Card>
            <SectionTitle>Warehouse Assignment</SectionTitle>
            <InfoCard rows={[[{ label: 'Assigned Warehouse', value: adminWarehouseName(selected.warehouseId) }]]} />
            <SectionTitle>Responsibility Summary</SectionTitle>
            <View style={styles.pillRow}>
              {selected.responsibilities.map((r) => (
                <View key={r} style={styles.pill}>
                  <Text style={styles.pillText}>{r}</Text>
                </View>
              ))}
            </View>
            <InfoNote tone="warning">
              This summarizes the SWA&apos;s existing warehouse scope, not new permissions granted from here.
            </InfoNote>
            <InfoNote tone="danger">No status-changing action here beyond what the permission matrix confirms.</InfoNote>
          </>
        ) : null}
      </ScrollView>
    </WalletScreen>
  );
}

const AVATAR = 44;

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  rowMeta: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },
  mutedText: { color: adminColors.muted },
  inputLabel: { ...adminType.rowTitle, color: adminColors.muted, marginBottom: adminSpacing.xs },
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
  confirmCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.brand,
    padding: adminSpacing.lg,
    gap: adminSpacing.lg,
    marginTop: adminSpacing.md,
  },
  confirmTitle: { ...adminType.sectionHead, color: adminColors.brandDeep },
  successTitle: { ...adminType.sectionHead, color: adminColors.ink, marginTop: adminSpacing.md },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: adminSpacing.sm },
  pill: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
  },
  pillText: { ...adminType.caption, color: adminColors.ink },
});
