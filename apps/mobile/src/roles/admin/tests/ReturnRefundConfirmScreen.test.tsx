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
  Badge: 'Badge',
  EmptyState: 'EmptyState',
}));

vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return { ...actual, request: vi.fn() };
});

import { ApiError, NetworkError, request } from '../../../shell/api/client';
import { useIdempotencyKey, type IdempotencyKeyHandle } from '../api/hooks';
import type { ReturnRefundResultDto, ReturnRequestDto } from '../api/returns';
import { t } from '../i18n';
import { ReturnRefundConfirmScreen } from '../screens/warehouse/returns/ReturnRefundConfirmScreen';
import { refundIdempotencyFingerprint, toReturnDetail, type RefundResult } from '../screens/warehouse/returns/mappers';

const requestMock = vi.mocked(request);

const WAREHOUSE = '3f1b7c2e-2a44-4f0e-9b1a-6b0d2f0f1a01';
const RETURN_ID = '0a1b2c3d-4e5f-4061-8728-394a5b6c7d8e';
const dto: ReturnRequestDto = {
  id: RETURN_ID,
  orderId: '1b2c3d4e-5f60-4172-8839-4a5b6c7d8e9f',
  customerId: '6f0c2d1e-1111-4222-8333-944455556666',
  warehouseId: WAREHOUSE,
  status: 'APPROVED',
  reason: 'Leaves wilted',
  note: null,
  createdAt: '2026-10-12T05:30:00.000Z',
  updatedAt: null,
  items: [
    {
      id: '7e8f9a0b-1c2d-4e3f-8a4b-5c6d7e8f9a0b',
      orderItemId: '5d6e7f80-9a1b-4c2d-8e3f-4a5b6c7d8e9f',
      requestedQty: '1.500',
      acceptedQty: '1.250',
      damagedQty: '0.000',
      condition: 'GOOD',
    },
  ],
};
const result: ReturnRefundResultDto = {
  returnRequest: { ...dto, status: 'REFUNDED' },
  walletTransactionId: '9e8d7c6b-5a49-4382-8716-a5b4c3d2e1f0',
  amount: '112.50',
};

async function flush(): Promise<void> {
  for (let i = 0; i < 5; i += 1) {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 5));
    });
  }
}

function setup(onSuccess: (r: RefundResult) => void) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: 0 } } });
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  let handle!: IdempotencyKeyHandle;
  function Host(): React.JSX.Element {
    handle = useIdempotencyKey();
    return (
      <ReturnRefundConfirmScreen
        detail={toReturnDetail(dto)}
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

describe('ReturnRefundConfirmScreen — the wallet refund money write (BR-61)', () => {
  it('BR-61: POSTs /refund/wallet with an Idempotency-Key, reuses it on a retry after a network drop, and hands on the server result in paise', async () => {
    requestMock.mockRejectedValueOnce(new NetworkError('wifi dropped'));
    requestMock.mockResolvedValueOnce(result);
    const onSuccess = vi.fn();
    const s = setup(onSuccess);

    await act(async () => {
      s.submitButton().props.onPress();
    });
    await flush();
    expect(s.texts()).toContain(t('admin.returns.refund.errors.uncertain'));
    expect(onSuccess).not.toHaveBeenCalled();

    await act(async () => {
      s.submitButton().props.onPress(); // retry
    });
    await flush();

    expect(requestMock).toHaveBeenCalledTimes(2);
    const [p1, o1] = requestMock.mock.calls[0]!;
    const [p2, o2] = requestMock.mock.calls[1]!;
    expect(p1).toBe(`/admin/returns/${RETURN_ID}/refund/wallet`);
    expect(p2).toBe(p1);
    expect(o1?.method).toBe('POST');
    expect(o1?.idempotencyKey).toEqual(expect.any(String));
    expect(o2?.idempotencyKey).toBe(o1?.idempotencyKey);

    expect(onSuccess).toHaveBeenCalledTimes(1);
    const got = onSuccess.mock.calls[0]![0] as RefundResult;
    expect(got.amountPaise).toBe(11250);
    expect(got.walletTransactionId).toBe(result.walletTransactionId);
    // After success the key is released: a later refund is a new operation.
    expect(s.handle().keyFor(refundIdempotencyFingerprint(RETURN_ID))).not.toBe(o1?.idempotencyKey);
    // Returns (list/detail/history), wallet and customer caches refresh under this warehouse.
    expect(s.invalidate.mock.calls.map((c) => c[0]?.queryKey)).toEqual([
      ['admin', 'wh', WAREHOUSE, 'returns'],
      ['admin', 'wh', WAREHOUSE, 'wallet'],
      ['admin', 'wh', WAREHOUSE, 'customers'],
    ]);
  });

  it('the submit button is disabled while the refund is in flight, and a second press sends nothing', async () => {
    let resolve!: (v: ReturnRefundResultDto) => void;
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
      resolve(result);
    });
    await flush();
  });

  it('BR-61: a 409 INVALID_STATE_TRANSITION is shown with returns copy, nothing is reported as refunded and nothing is invalidated', async () => {
    requestMock.mockRejectedValueOnce(
      new ApiError({ type: 'about:blank', title: 'x', status: 409, code: 'INVALID_STATE_TRANSITION' } as never),
    );
    const onSuccess = vi.fn();
    const s = setup(onSuccess);
    await act(async () => {
      s.submitButton().props.onPress();
    });
    await flush();
    expect(s.texts()).toContain(t('admin.returns.errors.INVALID_STATE_TRANSITION'));
    expect(onSuccess).not.toHaveBeenCalled();
    expect(s.invalidate).not.toHaveBeenCalled();
  });
});
