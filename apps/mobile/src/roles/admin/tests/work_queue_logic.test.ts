/**
 * Tohfa Admin Work Queue logic (screens/work-queue/workQueueLogic.ts): live
 * tasks from GET /admin/tasks (BR-77) mapped onto the design's task cards,
 * the design's filter fields mapped onto what the API carries, and the design
 * categories that have no task source yet kept as filters that yield nothing.
 */
import { describe, expect, it } from 'vitest';
import type { TaskItemDto } from '../api/tasks';
import {
  DEFAULT_WORK_QUEUE_FILTERS,
  TYPE_FILTERS,
  UNSOURCED_CATEGORIES,
  apiTaskTypeFor,
  applyWorkQueueFilters,
  STATUS_FILTERS,
  STATUS_LABEL,
  toWorkQueueCard,
  type WorkQueueCard,
} from '../screens/work-queue/workQueueLogic';
import { t } from '../i18n';

// 2026-11-11 10:00 IST (a Wednesday).
const NOW = new Date('2026-11-11T04:30:00.000Z');

function dto(over: Partial<TaskItemDto> = {}): TaskItemDto {
  return {
    itemKey: 'ORDER_PACK:00000000-0000-4000-8000-000000000001',
    type: 'ORDER_PACK',
    titleKey: 'task.order_pack.title',
    refType: 'ORDER',
    refId: '00000000-0000-4000-8000-000000000001',
    warehouseId: '00000000-0000-4000-8000-0000000000aa',
    createdAt: '2026-11-09T06:00:00.000Z',
    dueOn: null,
    params: {},
    state: 'OPEN',
    ...over,
  };
}

describe('task type filters', () => {
  it('keeps the design categories first, then every API task type', () => {
    expect(TYPE_FILTERS).toEqual([
      'all',
      'PURCHASE_EXCEPTION',
      'FARMER_APPLICATION',
      'AUDIT_FOLLOW_UP',
      'QUALITY_DISCREPANCY',
      'GOODS_RECEIPT_QC',
      'ORDER_PACK',
      'ORDER_DISPATCH',
      'ORDER_PICKUP_OTP',
      'RETURN_INSPECTION',
      'RETURN_APPROVAL',
    ]);
  });

  it('a design category with no backend source maps to no request (null); all maps to no type', () => {
    for (const c of UNSOURCED_CATEGORIES) expect(apiTaskTypeFor(c)).toBeNull();
    expect(apiTaskTypeFor('all')).toBeUndefined();
    expect(apiTaskTypeFor('ORDER_DISPATCH')).toBe('ORDER_DISPATCH');
  });

  it('design parity: the status options are the design\'s six, in its order, with no Done', () => {
    expect(STATUS_FILTERS).toEqual(['all', 'pending', 'exception', 'overdue', 'blocked', 'inReview']);
    expect(STATUS_FILTERS.map((s) => t(STATUS_LABEL[s]))).toEqual(['All', 'Pending', 'Exception', 'Overdue', 'Blocked', 'In review']);
  });
});

describe('toWorkQueueCard', () => {
  it('maps type, reference, person, produce and dates from the API only', () => {
    const card = toWorkQueueCard(
      dto({ params: { orderNumber: 'ORD-77', customerName: 'Meena', produce: 'Carrot', qtyKg: '12.500' }, dueOn: '2026-11-13' }),
      NOW,
    );
    expect(card.title).toBe(t('workQueue.type.ORDER_PACK'));
    expect(card.code).toBe('ORD-77');
    expect(card.person).toBe('Meena');
    expect(card.detail).toContain('Carrot');
    expect(card.status).toBe('pending');
    expect(card.createdLine).toContain('2026');
    expect(card.createdLine).toContain('13');
    expect(card.destination).toBe('orders');
  });

  it('never invents a person, code, detail or due date', () => {
    const card = toWorkQueueCard(dto({ type: 'GOODS_RECEIPT_QC', refType: 'GOODS_RECEIPT' }), NOW);
    expect(card.person).toBeNull();
    expect(card.code).toBeNull();
    expect(card.detail).toBeNull();
    expect(card.createdLine).not.toMatch(/Due/);
    expect(card.destination).toBe('receiving');
  });

  it('is overdue when open and the due day is before today (IST); done when the caller marked it', () => {
    expect(toWorkQueueCard(dto({ dueOn: '2026-11-10' }), NOW).status).toBe('overdue');
    expect(toWorkQueueCard(dto({ dueOn: '2026-11-11' }), NOW).status).toBe('pending');
    expect(toWorkQueueCard(dto({ dueOn: '2026-11-01', state: 'DONE' }), NOW).status).toBe('done');
    expect(toWorkQueueCard(dto({ type: 'RETURN_APPROVAL', refType: 'RETURN_REQUEST' }), NOW).destination).toBe('returns');
  });
});

describe('applyWorkQueueFilters', () => {
  const cards: WorkQueueCard[] = [
    toWorkQueueCard(dto({ itemKey: 'a', dueOn: '2026-11-10', createdAt: '2026-11-01T00:00:00Z', params: { orderNumber: 'ORD-A' } }), NOW),
    toWorkQueueCard(dto({ itemKey: 'b', dueOn: '2026-11-11', createdAt: '2026-11-02T00:00:00Z', params: { orderNumber: 'ORD-B' } }), NOW),
    toWorkQueueCard(dto({ itemKey: 'c', dueOn: '2026-11-15', createdAt: '2026-11-03T00:00:00Z', params: { orderNumber: 'ORD-C' } }), NOW),
    toWorkQueueCard(dto({ itemKey: 'd', dueOn: '2026-11-20', createdAt: '2026-11-04T00:00:00Z', params: { customerName: 'Kavya' } }), NOW),
    toWorkQueueCard(dto({ itemKey: 'e', dueOn: null, createdAt: '2026-11-05T00:00:00Z' }), NOW),
  ];
  const keys = (list: WorkQueueCard[]) => list.map((c) => c.itemKey);
  const run = (over: Partial<typeof DEFAULT_WORK_QUEUE_FILTERS>, q = '') =>
    keys(applyWorkQueueFilters(cards, { ...DEFAULT_WORK_QUEUE_FILTERS, ...over }, q, NOW));

  it('defaults: every card, due date first (no due date last), then newest', () => {
    expect(run({})).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('sorts by created date either way, and by due date then oldest', () => {
    expect(run({ sort: 'newest' })).toEqual(['e', 'd', 'c', 'b', 'a']);
    expect(run({ sort: 'oldest' })).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(run({ sort: 'dueOldest' })).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('status pending / overdue split the open list by due date', () => {
    expect(run({ status: 'overdue' })).toEqual(['a']);
    expect(run({ status: 'pending' })).toEqual(['b', 'c', 'd', 'e']);
  });

  it('design parity: Exception / Blocked / In review match no task (the API has none of those states)', () => {
    for (const status of ['exception', 'blocked', 'inReview'] as const) expect(run({ status })).toEqual([]);
  });

  it('due date windows (IST): today, this week (Mon-Sun), overdue, next 7 days; no due date never matches', () => {
    expect(run({ due: 'today' })).toEqual(['b']);
    expect(run({ due: 'thisWeek' })).toEqual(['a', 'b', 'c']);
    expect(run({ due: 'overdue' })).toEqual(['a']);
    expect(run({ due: 'next7' })).toEqual(['b', 'c']);
  });

  it('search matches reference, person and type', () => {
    expect(run({}, 'ord-c')).toEqual(['c']);
    expect(run({}, 'kavya')).toEqual(['d']);
    expect(run({}, t('workQueue.type.ORDER_PACK'))).toHaveLength(5);
  });
});
