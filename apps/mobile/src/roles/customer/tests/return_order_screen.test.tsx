/**
 * Return order: eligible orders and lines come from the API; the request is
 * POST /orders/{orderId}/returns { reason, items[{orderItemId, qty}], note, photoUploadIds }.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { act } from 'react-test-renderer';
import type { QueryClient } from '@tanstack/react-query';

vi.mock('react-native', async () => (await import('./helpers/rnMock')).rnMock());
vi.mock('react-native-svg', async () => (await import('./helpers/rnMock')).svgMock());
const support = vi.hoisted(() => ({
  pickIssuePhotos: vi.fn(),
  uploadIssuePhoto: vi.fn(),
}));
vi.mock('../api/support', () => support);

import * as client from '../../../shell/api/client';
import { ReturnOrderScreen } from '../screens/ReturnOrderScreen';
import { byTestId, flush, hasTestId, mockGet, newQueryClient, press, problem, renderWith, textOf } from './helpers/harness';

const ORDER = {
  id: 'o1', orderNumber: 'TOH-2026-0000001', status: 'DELIVERED', fulfillmentType: 'DELIVERY', totalAmount: '200.00', placedAt: '2026-11-10T04:00:00Z',
  thumbnails: [], subtotal: '200.00', itemCount: 2,
  items: [
    { id: 'oi1', productId: 'p1', name: 'Carrot', grade: 'GRADE_1', qtyKg: '2.000', unitPrice: '69.00', lineTotal: '138.00' },
    { id: 'oi2', productId: 'p2', name: 'Beans', grade: 'GRADE_2', qtyKg: '1.000', unitPrice: '62.00', lineTotal: '62.00' },
  ],
};

let qc: QueryClient;
beforeEach(() => {
  qc = newQueryClient();
  client.setAccessToken('token');
  mockGet({
    '/orders/o1': ORDER,
    '/orders': { items: [ORDER, { ...ORDER, id: 'o2', status: 'CONFIRMED' }], page: { nextCursor: null, hasMore: false } },
  });
});
afterEach(() => {
  client.setAccessToken(null);
  vi.restoreAllMocks();
});

describe('ReturnOrderScreen', () => {
  it('shows the order lines from the API (no sample data)', async () => {
    const root = await renderWith(qc, <ReturnOrderScreen initialOrderId="o1" />);
    const t = textOf(root);
    expect(t).toContain('TOH-2026-0000001');
    expect(t).toContain('Carrot');
    expect(t).toContain('Beans');
    expect(t).not.toMatch(/Fresh apples|ORD-2026|RET-2026/);
  });

  it('posts orderItemId + kg qty + reason + note + uploaded photo ids', async () => {
    support.pickIssuePhotos.mockResolvedValue({ photos: [{ uri: 'file://a.jpg', base64: 'AA', type: 'image/jpeg', fileName: 'a.jpg' }], rejected: 0 });
    support.uploadIssuePhoto.mockResolvedValue('upload-1');
    const post = vi.spyOn(client.api, 'post').mockResolvedValue({
      id: 'ret-1234567890', orderId: 'o1', status: 'PENDING', reason: 'x', note: null, photos: [], createdAt: 'x', updatedAt: null, items: [],
    } as never);
    const onNavigate = vi.fn();
    const root = await renderWith(qc, <ReturnOrderScreen initialOrderId="o1" onNavigate={onNavigate} />);
    await press(root, 'return-item-oi2'); // deselect Beans
    await press(root, 'return-dec-oi1'); // 2 kg -> 1.5 kg
    await act(async () => byTestId(root, 'return-note').props.onChangeText('Two were mouldy'));
    await press(root, 'return-add-photo');
    await flush();
    expect(hasTestId(root, 'return-photo')).toBe(true);
    await press(root, 'return-submit');
    expect(post).toHaveBeenCalledWith('/orders/o1/returns', {
      reason: 'Quality issue (damaged / spoiled)',
      items: [{ orderItemId: 'oi1', qty: '1.500' }],
      note: 'Two were mouldy',
      photoUploadIds: ['upload-1'],
    });
    expect(textOf(root)).toContain('PENDING');
  });

  it('shows the 409 not-delivered message and 422 line errors inline', async () => {
    vi.spyOn(client.api, 'post')
      .mockRejectedValueOnce(problem(409, 'INVALID_STATE_TRANSITION'))
      .mockRejectedValueOnce(problem(422, 'VALIDATION_FAILED', { errors: { 'body.items.0.qty': ['Exceeds the returnable quantity'] } }));
    const root = await renderWith(qc, <ReturnOrderScreen initialOrderId="o1" />);
    await press(root, 'return-submit');
    expect(textOf(root)).toContain('only after it is delivered or picked up');
    await press(root, 'return-submit');
    expect(hasTestId(root, 'return-error')).toBe(true);
  });

  it('defaults to the first eligible order when none is passed', async () => {
    const root = await renderWith(qc, <ReturnOrderScreen />);
    await flush();
    expect(textOf(root)).toContain('TOH-2026-0000001');
  });
});
