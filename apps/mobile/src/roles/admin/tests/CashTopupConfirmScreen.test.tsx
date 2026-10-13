import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type * as ClientModule from '../../../shell/api/client';

vi.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  ScrollView: 'ScrollView',
  Pressable: 'Pressable',
  StyleSheet: { create: (s: Record<string, unknown>) => s, hairlineWidth: 1 },
}));

vi.mock('@tohfa/mobile-ui', () => ({
  Button: 'Button',
  Icon: 'Icon',
  EmptyState: 'EmptyState',
}));

vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return { ...actual, request: vi.fn() };
});

import { ApiError, NetworkError, request } from '../../../shell/api/client';
import { useIdempotencyKey, type IdempotencyKeyHandle } from '../api/hooks';
import type { CashTopupBody, WalletTransactionDto } from '../api/wallet';
import { t } from '../i18n';
import { CashTopupConfirmScreen } from '../screens/warehouse/wallet/CashTopupConfirmScreen';
import type { TopupCustomer, ValidCashTopup } from '../screens/warehouse/wallet/mappers';

const requestMock = vi.mocked(request);

const WAREHOUSE = '3f1b7c2e-2a44-4f0e-9b1a-6b0d2f0f1a01';
const customer: TopupCustomer = {
  customerId: '6f0c2d1e-1111-4222-8333-944455556666',
  name: 'Meena R',
  customerCode: 'CUST-0042',
  mobileMasked: '98XXXXXX10',
  walletBalancePaise: 125050,
};
const value: ValidCashTopup = { amountPaise: 500000, fiscalTag: 'COON-0001', remarks: null };
const body: CashTopupBody = {
  amount: '5000.00' as CashTopupBody['amount'],
  warehouseId: WAREHOUSE,
  fiscalCashTag: 'COON-0001',
};
const txn: WalletTransactionDto = {
  id: '9e8d7c6b-5a49-4382-8716-a5b4c3d2e1f0',
  walletId: '1a2b3c4d-5e6f-4708-8192-a3b4c5d6e7f8',
  txnType: 'TOPUP_CASH',
  amount: '5000.00',
  balanceAfter: '6250.50',
  refType: 'TOPUP',
  refId: '2b3c4d5e-6f70-4812-8934-5a6b7c8d9e0f',
  fiscalCashTag: 'COON-0001',
  warehouseId: WAREHOUSE,
  performedBy: null,
  performedAt: '2026-10-13T10:15:00.000Z',
  remarks: null,
};

async function flush(): Promise<void> {
  for (let i = 0; i < 5; i += 1) {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 5));
    });
  }
}

function setup(onSuccess: (t: WalletTransactionDto) => void) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: 0 } } });
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  let handle!: IdempotencyKeyHandle;
  function Host(): React.JSX.Element {
    handle = useIdempotencyKey();
    return (
      <CashTopupConfirmScreen
        customer={customer}
        value={value}
        body={body}
        warehouseId={WAREHOUSE}
        idempotency={handle}
        onBack={() => undefined}
        onSuccess={onSuccess}
      />
    );
  }
  let r!: ReactTestRenderer;
  act(() => {
    r = renderer.create(
      <QueryClientProvider client={client}>
        <Host />
      </QueryClientProvider>,
    );
  });
  const submitButton = (): ReactTestInstance =>
    r.root.findAll((n) => (n.type as unknown) === 'Button')[0]!;
  const texts = (): string[] =>
    r.root.findAll((n) => (n.type as unknown) === 'Text').map((n) => String(n.props.children));
  return { r, submitButton, texts, handle: () => handle, invalidate };
}

beforeEach(() => {
  requestMock.mockReset();
});

describe('CashTopupConfirmScreen — the money-moving submit', () => {
  it('BR-18: POSTs the exact path/body with an Idempotency-Key, reuses it on an identical retry, and shows the server error copy', async () => {
    requestMock.mockRejectedValueOnce(new NetworkError('wifi dropped'));
    requestMock.mockResolvedValueOnce(txn);
    const onSuccess = vi.fn();
    const s = setup(onSuccess);

    await act(async () => {
      s.submitButton().props.onPress();
    });
    await flush();
    expect(s.texts()).toContain(t('admin.wallet.topup.errors.uncertain'));
    expect(onSuccess).not.toHaveBeenCalled();

    await act(async () => {
      s.submitButton().props.onPress(); // retry
    });
    await flush();

    expect(requestMock).toHaveBeenCalledTimes(2);
    const [p1, o1] = requestMock.mock.calls[0]!;
    const [p2, o2] = requestMock.mock.calls[1]!;
    expect(p1).toBe(`/admin/wallets/${customer.customerId}/cash-topup`);
    expect(p2).toBe(p1);
    expect(o1?.method).toBe('POST');
    expect(o1?.body).toEqual({ amount: '5000.00', warehouseId: WAREHOUSE, fiscalCashTag: 'COON-0001' });
    expect(o1?.idempotencyKey).toEqual(expect.any(String));
    expect(o2?.idempotencyKey).toBe(o1?.idempotencyKey);

    // The server's ledger row is handed on, untouched (real transaction id).
    expect(onSuccess).toHaveBeenCalledWith(txn);
    // After success the key is released: the next top-up is a new operation.
    expect(s.handle().keyFor({ customerId: customer.customerId, ...body })).not.toBe(o1?.idempotencyKey);
    // Wallet, customers and daily summary are refreshed under this warehouse.
    expect(s.invalidate.mock.calls.map((c) => c[0]?.queryKey)).toEqual([
      ['admin', 'wh', WAREHOUSE, 'wallet'],
      ['admin', 'wh', WAREHOUSE, 'customers'],
      ['admin', 'wh', WAREHOUSE, 'dailySummary'],
    ]);
  });

  it('the submit button is disabled while the request is in flight, and a second press sends nothing', async () => {
    let resolve!: (v: WalletTransactionDto) => void;
    requestMock.mockImplementationOnce(() => new Promise((r) => (resolve = r as never)));
    const s = setup(vi.fn());

    await act(async () => {
      s.submitButton().props.onPress();
    });
    await flush();
    expect(s.submitButton().props.disabled).toBe(true);
    await act(async () => {
      s.submitButton().props.onPress();
    });
    expect(requestMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolve(txn);
    });
    await flush();
  });

  it('BR-19: a server 422 CASH_LIMIT_EXCEEDED is shown with its own copy and nothing is reported as credited', async () => {
    requestMock.mockRejectedValueOnce(
      new ApiError({ type: 'about:blank', title: 'cap', status: 422, code: 'CASH_LIMIT_EXCEEDED' } as never),
    );
    const onSuccess = vi.fn();
    const s = setup(onSuccess);
    await act(async () => {
      s.submitButton().props.onPress();
    });
    await flush();
    expect(s.texts()).toContain(t('admin.errors.CASH_LIMIT_EXCEEDED'));
    expect(onSuccess).not.toHaveBeenCalled();
    expect(s.invalidate).not.toHaveBeenCalled();
  });
});
