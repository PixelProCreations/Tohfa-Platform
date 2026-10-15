/**
 * Source scan: the inter-warehouse transfer screens read and write the live
 * /warehouse-transfers API, hold no demo rows, ETA, driver or dispatch
 * literals, use real warehouse uuids, and gate their actions through
 * transferActions / canInitiateTransfer. Hooks and JSX cannot render in this
 * plain-Node vitest, so the wiring is pinned by reading the sources, as
 * returns_wiring.test.ts does. The rules themselves are tested on the mappers
 * (mappers_transfers.test.ts) and the API module (api_transfers.test.ts).
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const DIR = path.join(__dirname, '..', 'screens', 'warehouse', 'transfers');
const read = (name: string) => fs.readFileSync(path.join(DIR, name), 'utf8');
const code = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const SCREENS = [
  'InterWarehouseTransferScreen.tsx',
  'TransferDetailScreen.tsx',
  'InitiateNewTransferScreen.tsx',
  'TransferReceivingScreen.tsx',
  'TransferReceivingInspectionScreen.tsx',
  'TransfersFlow.tsx',
  'TransferParts.tsx',
  'useTransfersData.ts',
  'mappers.ts',
];

describe('transfers wiring', () => {
  it('the transfer fixtures are deleted and no demo dispatch, ETA or fixture warehouse id remains', () => {
    for (const name of SCREENS) {
      const src = code(read(name));
      expect({ name, fixtures: /from '\.\/fixtures'/.test(src) }).toEqual({ name, fixtures: false });
      expect({ name, demo: /DEMO_DISPATCH|TRANSFER_WAREHOUSES|TRANSFER_PRODUCE_OPTIONS|WH-OOTY|ETA/.test(src) }).toEqual({ name, demo: false });
    }
    expect(fs.existsSync(path.join(DIR, 'fixtures.ts'))).toBe(false);
  });

  it('the data hooks call the real transfer, batch and warehouse APIs', () => {
    const data = read('useTransfersData.ts');
    for (const fn of ['listWarehouseTransfers', 'getWarehouseTransfer', 'createWarehouseTransfer', 'approveWarehouseTransfer', 'receiveWarehouseTransfer', 'cancelWarehouseTransfer', 'listBatches', 'useWarehouseOptions']) {
      expect(data).toContain(fn);
    }
    expect(data).toMatch(/invalidates: WRITE_INVALIDATES/);
  });

  it('every stock-moving write sends an Idempotency-Key from useIdempotencyKey', () => {
    for (const name of ['InitiateNewTransferScreen.tsx', 'TransferDetailScreen.tsx', 'TransferReceivingInspectionScreen.tsx']) {
      const src = code(read(name));
      expect(src).toMatch(/useIdempotencyKey\(\)/);
      expect(src).toMatch(/idempotencyKey: \w+\.keyFor\(/);
    }
  });

  it('actions are gated through the tested helpers, never a role check', () => {
    expect(code(read('TransferDetailScreen.tsx'))).toMatch(/transferActions\(scope, can, transfer\)/);
    expect(code(read('TransferReceivingInspectionScreen.tsx'))).toMatch(/transferActions\(scope, can, transfer\)\.receive/);
    expect(code(read('InitiateNewTransferScreen.tsx'))).toMatch(/canInitiateTransfer\(can\)/);
    expect(code(read('InterWarehouseTransferScreen.tsx'))).toMatch(/canInitiateTransfer\(can\)/);
    for (const name of SCREENS) expect(code(read(name))).not.toMatch(/SUPER_ADMIN|MAIN_WH_ADMIN|SUB_WH_ADMIN/);
  });

  it('list screens use the shared async states', () => {
    for (const name of ['InterWarehouseTransferScreen.tsx', 'TransferReceivingScreen.tsx', 'InitiateNewTransferScreen.tsx']) {
      const src = code(read(name));
      expect(src).toMatch(/queryViewState\(/);
      expect(src).toMatch(/AdminErrorState/);
    }
  });
});
