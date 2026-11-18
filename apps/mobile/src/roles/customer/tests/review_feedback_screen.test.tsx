/**
 * Review & feedback: one review per order (POST /orders/{id}/review) with
 * orderItemId line ratings and the API tag enum; 409 duplicate is handled.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { act } from 'react-test-renderer';
import type { QueryClient } from '@tanstack/react-query';

vi.mock('react-native', async () => (await import('./helpers/rnMock')).rnMock());
vi.mock('react-native-svg', async () => (await import('./helpers/rnMock')).svgMock());

import * as client from '../../../shell/api/client';
import { ReviewFeedbackScreen, REVIEW_TAG_OPTIONS } from '../screens/ReviewFeedbackScreen';
import { REVIEW_TAGS } from '../api/reviews';
import { byTestId, hasTestId, mockGet, newQueryClient, press, problem, renderWith, textOf } from './helpers/harness';

const ORDER = {
  id: 'o1', orderNumber: 'TOH-2026-0000001', status: 'PICKED_UP', fulfillmentType: 'PICKUP', totalAmount: '138.00', placedAt: '2026-11-10T04:00:00Z',
  thumbnails: [], subtotal: '138.00', itemCount: 1,
  items: [{ id: 'oi1', productId: 'p1', name: 'Carrot', grade: 'GRADE_1', qtyKg: '2.000', unitPrice: '69.00', lineTotal: '138.00' }],
};
const REVIEW = { id: 'r1', orderId: 'o1', rating: 4, tags: ['FRESHNESS'], comment: 'Crisp', items: [{ orderItemId: 'oi1', productId: 'p1', name: 'Carrot', grade: 'GRADE_1', rating: 5, comment: null }], createdAt: 'x' };

let qc: QueryClient;
let reviewRoute: unknown;
beforeEach(() => {
  qc = newQueryClient();
  client.setAccessToken('token');
  reviewRoute = problem(404, 'NOT_FOUND');
  mockGet({
    '/orders/o1/review': () => reviewRoute,
    '/orders/o1': ORDER,
    '/orders': { items: [ORDER], page: { nextCursor: null, hasMore: false } },
  });
});
afterEach(() => {
  client.setAccessToken(null);
  vi.restoreAllMocks();
});

describe('ReviewFeedbackScreen', () => {
  it('maps every chip onto the API tag vocabulary', () => {
    expect(REVIEW_TAG_OPTIONS.map((o) => o.tag).sort()).toEqual([...REVIEW_TAGS].sort());
  });

  it('renders the order lines from the API (no sample data)', async () => {
    const root = await renderWith(qc, <ReviewFeedbackScreen orderId="o1" />);
    expect(textOf(root)).toContain('TOH-2026-0000001');
    expect(textOf(root)).toContain('Carrot');
    expect(textOf(root)).not.toMatch(/Royal Gala|Fresh apples|ORD-2026/);
  });

  it('submits rating, enum tags, comment and orderItemId line ratings', async () => {
    const post = vi.spyOn(client.api, 'post').mockResolvedValue(REVIEW as never);
    const root = await renderWith(qc, <ReviewFeedbackScreen orderId="o1" />);
    await press(root, 'item-star-oi1-5');
    await press(root, 'overall-star-4');
    await press(root, 'tag-FRESHNESS');
    await press(root, 'tag-PACKAGING');
    await act(async () => byTestId(root, 'review-comment').props.onChangeText('Crisp and fresh'));
    await press(root, 'review-submit');
    expect(post).toHaveBeenCalledWith('/orders/o1/review', {
      rating: 4,
      tags: ['FRESHNESS', 'PACKAGING'],
      comment: 'Crisp and fresh',
      items: [{ orderItemId: 'oi1', rating: 5 }],
    });
    expect(textOf(root)).toContain('has been submitted successfully');
  });

  it('a 409 duplicate shows "already reviewed"', async () => {
    vi.spyOn(client.api, 'post').mockRejectedValue(problem(409, 'CONFLICT'));
    const root = await renderWith(qc, <ReviewFeedbackScreen orderId="o1" />);
    await press(root, 'overall-star-5');
    await press(root, 'review-submit');
    expect(textOf(root)).toContain('already reviewed');
  });

  it('an existing review is shown read-only (no submit)', async () => {
    reviewRoute = REVIEW;
    const root = await renderWith(qc, <ReviewFeedbackScreen orderId="o1" />);
    expect(hasTestId(root, 'review-submit')).toBe(false);
    expect(textOf(root)).toContain('Your review');
    expect(byTestId(root, 'review-comment').props.value).toBe('Crisp');
  });
});
