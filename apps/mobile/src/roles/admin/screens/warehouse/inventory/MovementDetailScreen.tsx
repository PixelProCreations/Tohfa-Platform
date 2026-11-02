/**
 * Movement Detail (design M3-16, route M3S15): one stock ledger row.
 *
 * Opened from a Stock Ledger row (GET /admin/stock-ledger,
 * inventory.stock_ledger.view_own). There is no per-id ledger read, so the
 * flow hands this screen the row the user tapped (movementParam) and the
 * screen asks the server for nothing. Without a row (a deep link) it shows
 * "not found".
 *
 * Read-only by design: the ledger is append-only (BR-37). The fields are the
 * ones the row carries (movementDetailRows); the movement code, the
 * from / to warehouse pair and the performer's name are not in the API and
 * are not drawn. The sample timeline, photo and voucher of the old design
 * screens had no data behind them and are gone.
 */
import React from 'react';
import { ScrollView } from 'react-native';
import { t } from '../../../i18n';
import {
  EmptyState,
  InfoCard,
  InfoNote,
  ScopeHeader,
  SectionTitle,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { movementDetailRows } from './movementDetailMappers';
import type { InventoryScreenBaseProps, StockMovementRow } from './types';

export interface MovementDetailScreenProps extends InventoryScreenBaseProps {
  /** The tapped ledger row; undefined when the route carried none. */
  movement: StockMovementRow | undefined;
  /** The row's warehouse, named from the scope or GET /warehouses; undefined hides the field. */
  warehouseName: string | undefined;
}

export function MovementDetailScreen({ scope, onBack, movement, warehouseName }: MovementDetailScreenProps) {
  // The movement's own warehouse in the pill (the Main view otherwise reads "all warehouses").
  const header = <ScopeHeader scope={scope} label={warehouseName} />;

  if (movement === undefined) {
    return (
      <WalletScreen title={t('inventory.movementDetail.title')} onBack={onBack} headerExtra={header}>
        <EmptyState title={t('inventory.movementDetail.notFound')} />
      </WalletScreen>
    );
  }

  return (
    <WalletScreen
      title={t('inventory.movementDetail.title')}
      subtitle={movement.typeLabel}
      onBack={onBack}
      headerExtra={header}
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <SectionTitle>{t('inventory.movementDetail.section')}</SectionTitle>
        <InfoCard rows={movementDetailRows(movement, warehouseName)} />
        {movement.remarks === undefined ? null : (
          <>
            <SectionTitle>{t('inventory.movementDetail.remarks')}</SectionTitle>
            <InfoNote tone="info">{movement.remarks}</InfoNote>
          </>
        )}
        <InfoNote tone="brandSoft">{t('inventory.movementDetail.ledgerNote')}</InfoNote>
      </ScrollView>
    </WalletScreen>
  );
}
