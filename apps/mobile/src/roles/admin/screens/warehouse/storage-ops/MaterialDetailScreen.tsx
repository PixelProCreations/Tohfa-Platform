/**
 * Material Detail: one warehouse material with its quantities and history.
 *
 * Gate (FINAL_LIST 130): Add Stock, Receive and Issue need
 * `inventory.material_handling.manage` (MAIN all, SUB own); without it the
 * screen is read-only.
 *
 * Absorbs Main MaterialDetailScreen (pair M4-S06): the Receive / Issue actions.
 * The Main shell confirmed them with two alerts; those confirmations moved here
 * (local mock until a material movement endpoint exists, SPEC_GAPS W4u-1).
 * Sub's material history and Add Stock stay. The warehouse comes from the
 * material record, never a hard-coded name.
 *
 * Scope: a material outside the viewer's warehouse is "not found" (no 403
 * leak, CLAUDE.md 2.1), Main sees every warehouse's materials.
 */
// Design id: M4-S06
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import {
  EmptyState,
  inScope,
  InfoCard,
  PermissionNote,
  SectionTitle,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { MATERIAL_HISTORY, MATERIALS, storageWarehouseName } from './fixtures';
import { ActionTile, ActionTileRow, IssueIcon, PlusIcon, ReceiveIcon, STORAGE_CODES } from './StorageParts';
import type { MaterialHistoryEntry, MaterialItem, WarehouseScreenBaseProps } from './types';

export interface MaterialDetailScreenProps extends WarehouseScreenBaseProps {
  materialId?: string | undefined;
  materials?: readonly MaterialItem[] | undefined;
  history?: readonly MaterialHistoryEntry[] | undefined;
  onAddStock?: (() => void) | undefined;
}

export function MaterialDetailScreen({
  scope,
  can,
  onBack,
  materialId,
  materials = MATERIALS,
  history = MATERIAL_HISTORY,
  onAddStock,
}: MaterialDetailScreenProps) {
  const material = materials.find((m) => m.id === materialId && inScope(scope, m.warehouseId));
  if (!material) {
    return (
      <WalletScreen title="Material Detail" onBack={onBack}>
        <EmptyState title="Material not found" subtitle="It may belong to another warehouse or have been removed." />
      </WalletScreen>
    );
  }

  const canManage = can(STORAGE_CODES.materialManage);
  const available = material.current - material.reserved;
  const entries = history.filter((h) => h.materialId === material.id);

  const confirmReceive = () =>
    Alert.alert('Receive Material', `Record new incoming stock for ${material.name}.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm Receive', onPress: () => Alert.alert('Recorded', `Incoming stock recorded for ${material.code}.`) },
    ]);
  const confirmIssue = () =>
    Alert.alert('Issue Material', `Issue ${material.name} to the packing line.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm Issue', onPress: () => Alert.alert('Recorded', `Issue recorded for ${material.code}.`) },
    ]);

  return (
    <WalletScreen
      title="Material Detail"
      subtitle={`${material.name} · ${material.code}`}
      onBack={onBack}
      footer={
        canManage && onAddStock ? (
          <WalletFooter>
            <WalletButton label="Add Stock" icon={<PlusIcon />} onPress={onAddStock} />
          </WalletFooter>
        ) : undefined
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <SectionTitle>Material Information</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: 'Material Name', value: material.name },
              { label: 'Material ID', value: material.code },
            ],
            [
              { label: 'Category', value: material.category },
              { label: 'Unit', value: material.unit },
            ],
            [{ label: 'Status', value: material.status }],
          ]}
        />

        <SectionTitle>Quantity</SectionTitle>
        <View style={styles.qtyRow}>
          {[
            { label: 'CURRENT', value: material.current },
            { label: 'RESERVED', value: material.reserved },
            { label: 'AVAILABLE', value: available },
          ].map((q) => (
            <View key={q.label} style={styles.qtyCard}>
              <Text style={styles.qtyValue}>{q.value}</Text>
              <Text style={styles.qtyLabel}>{q.label}</Text>
            </View>
          ))}
        </View>

        {canManage ? (
          <ActionTileRow>
            <ActionTile label="Receive" icon={<ReceiveIcon />} onPress={confirmReceive} />
            <ActionTile label="Issue" icon={<IssueIcon />} onPress={confirmIssue} />
          </ActionTileRow>
        ) : (
          <PermissionNote>View only. Receiving, issuing and adding stock needs material handling access.</PermissionNote>
        )}

        <SectionTitle>Warehouse</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: 'Warehouse', value: storageWarehouseName(material.warehouseId) },
              { label: 'Storage Location', value: material.storageLocation },
            ],
          ]}
        />

        <SectionTitle>Material History</SectionTitle>
        {entries.length === 0 ? (
          <EmptyState title="No movements yet" />
        ) : (
          entries.map((entry) => (
            <View key={entry.id} style={styles.historyCard}>
              <Text style={styles.historyTitle}>{entry.kind}</Text>
              <Text style={styles.historyDesc}>
                {entry.quantity} {material.unit} · {entry.detail}
              </Text>
              <View style={styles.historyFooter}>
                <Text style={styles.historyMeta}>By {entry.by}</Text>
                <Text style={styles.historyMeta}>{entry.at}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  qtyRow: { flexDirection: 'row', gap: 10, marginBottom: adminSpacing.lg },
  qtyCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 20,
    alignItems: 'center',
  },
  qtyValue: { ...adminType.kpiValue, color: adminColors.ink, marginBottom: adminSpacing.xs },
  qtyLabel: { ...adminType.caption, color: adminColors.muted },
  historyCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
  },
  historyTitle: { ...adminType.sectionHead, color: adminColors.warning.text, marginBottom: 6 },
  historyDesc: { ...adminType.body, color: adminColors.ink, marginBottom: adminSpacing.md },
  historyFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  historyMeta: { ...adminType.rowMeta, color: adminColors.muted },
});
