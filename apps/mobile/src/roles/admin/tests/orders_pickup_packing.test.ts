/**
 * M5-07 Packing and M5-10 Pickup Verification (designs 061 and 064).
 *
 * Both designs add a checklist that is a counter aid only: it records nothing
 * and is never sent (the pack body is the whole order, the verify step makes
 * no request). The Pickup Verification design also shows the order's payment
 * status, which AdminOrderDetail carries (`paymentStatus`).
 *
 * The rules live in pure mappers (orders/mappers.ts) and are tested directly.
 * Hooks and JSX cannot render in this plain-Node vitest, so the wiring is
 * pinned by reading the sources, as order_invoice_wiring.test.ts does.
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { AdminOrderDetailDto } from '../api/orders';
import { t } from '../i18n';
import {
  packingChecklist,
  pickupSummaryFields,
  pickupVerificationChecklist,
  toOrderDetail,
} from '../screens/warehouse/orders/mappers';

const SRC = path.join(__dirname, '..', '..', '..');
const read = (rel: string) => fs.readFileSync(path.join(SRC, rel), 'utf8');
/** The source without comments, so the "never drawn" checks read code only. */
const code = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const ORDERS = 'roles/admin/screens/warehouse/orders';
const PACKING = read(`${ORDERS}/PackingScreen.tsx`);
const PICKUP = read(`${ORDERS}/PickupOtpScreen.tsx`);

/** The body of a top-level function declaration (up to the next top-level declaration). */
function functionBody(source: string, name: string): string {
  const start = source.indexOf(`function ${name}(`);
  expect(start, `function ${name} not found`).toBeGreaterThanOrEqual(0);
  const rest = source.slice(start + 1);
  const next = rest.search(/\n(export )?(function|const|interface|type) /);
  return next === -1 ? rest : rest.slice(0, next);
}

const WH = '11111111-1111-4111-8111-111111111111';
const ORDER = '22222222-2222-4222-8222-222222222222';
const NOW = new Date('2026-10-13T06:30:00Z');

function detail(overrides: Partial<AdminOrderDetailDto> = {}): AdminOrderDetailDto {
  return {
    id: ORDER,
    orderNumber: 'TOH-2026-0084412',
    channel: 'ONLINE',
    status: 'READY_FOR_PICKUP',
    fulfilmentType: 'PICKUP',
    paymentMethod: 'WALLET',
    paymentStatus: 'PAID',
    warehouse: { id: WH, name: 'Coonoor' },
    buyer: { kind: 'CUSTOMER', customerId: null, customerCode: null, name: 'Meena S.', mobileMasked: '******3210' },
    items: [
      {
        productId: '44444444-4444-4444-8444-444444444444',
        name: 'Carrot',
        grade: 'GRADE_1',
        qtyKg: '0.125',
        unitPrice: '40.00',
        gstRate: '0.00',
        gstAmount: '0.00',
        lineTotal: '5.00',
      },
    ],
    totals: { subtotal: '5.00', deliveryFee: '0.00', discount: '0.00', gst: '0.00', total: '5.00' },
    invoice: null,
    fulfilment: { deliveryDate: null, deliverySlot: null, otpRequired: true, otpVerifiedAt: null },
    timeline: [],
    placedAt: '2026-10-13T04:35:00Z',
    packedAt: '2026-10-13T05:00:00Z',
    completedAt: null,
    cancelledAt: null,
    ...overrides,
  } as AdminOrderDetailDto;
}

// ─── M5-07 Packing ───────────────────────────────────────────────────────────

describe('M5-07 Packing: the generic packing checklist (design 061)', () => {
  it('is the three checks the design shows, in order, each an i18n label', () => {
    const checks = packingChecklist();
    expect(checks.map((check) => check.key)).toEqual(['productSelected', 'quantityVerified', 'gradeVerified']);
    expect(checks.map((check) => check.label)).toEqual([
      t('orders.packing.check.productSelected'),
      t('orders.packing.check.quantityVerified'),
      t('orders.packing.check.gradeVerified'),
    ]);
    for (const check of checks) expect(check.label).not.toMatch(/^orders\./);
  });

  it('BR-99: carries no batch reference, and the packing screen draws no batch id', () => {
    for (const check of packingChecklist()) expect(JSON.stringify(check)).not.toMatch(/batch/i);
    expect(code(PACKING)).not.toMatch(/batch/i);
  });

  it('is rendered on the packing step, above the per-line ticks now titled "Order Items"', () => {
    const step = functionBody(PACKING, 'PackingStepView');
    expect(step).toMatch(/packingChecklist\(\)\.map\(/);
    expect(step).toMatch(/t\('orders\.packing\.orderItems'\)/);
    expect(step.indexOf('packingChecklist()')).toBeLessThan(step.indexOf("t('orders.packing.orderItems')"));
  });

  it('records nothing: the pack body is still the whole order, with no checklist in it', () => {
    expect(PACKING).toMatch(/pack\.run\(\{\}, \(\) => setPackedHere\(true\)\)/);
    expect(code(PACKING)).not.toMatch(/pack\.run\(\{ ?\w/);
  });
});

// ─── M5-10 Pickup Verification ───────────────────────────────────────────────

describe('M5-10 Pickup Verification: the Payment row (AdminOrderDetail.paymentStatus)', () => {
  it('the order summary shows the payment status the server sent', () => {
    const fields = pickupSummaryFields(toOrderDetail(detail({ paymentStatus: 'PAID' }), NOW));
    expect(fields.find((field) => field.key === 'payment')).toEqual({
      key: 'payment',
      label: t('orders.pickup.field.payment'),
      value: t('orders.payment.status.PAID'),
    });
  });

  it('keeps the existing summary rows (items, total, pickup warehouse) and adds payment last', () => {
    const fields = pickupSummaryFields(toOrderDetail(detail(), NOW));
    expect(fields.map((field) => field.key)).toEqual(['items', 'total', 'warehouse', 'payment']);
    expect(fields.find((field) => field.key === 'warehouse')?.value).toBe('Coonoor');
  });

  it('an unknown payment status shows no value, never a guess', () => {
    const fields = pickupSummaryFields(toOrderDetail(detail({ paymentStatus: 'SOMETHING_NEW' as never }), NOW));
    expect(fields.find((field) => field.key === 'payment')?.value).toBe(t('orders.noValue'));
  });

  it('BR-92: no summary field carries the customer mobile, masked or not', () => {
    const fields = pickupSummaryFields(toOrderDetail(detail(), NOW));
    expect(JSON.stringify(fields)).not.toMatch(/3210|mobile|phone/i);
  });

  it('the verify step renders the summary fields', () => {
    expect(functionBody(PICKUP, 'VerifyStep')).toMatch(/pickupSummaryFields\(order\)/);
  });
});

describe('M5-10 Pickup Verification: the verification checklist (display only)', () => {
  it('Customer identified is the clerk\'s own tick; Order packed comes from the order status', () => {
    const ready = toOrderDetail(detail({ status: 'READY_FOR_PICKUP' }), NOW);
    expect(pickupVerificationChecklist(ready, false)).toEqual([
      { key: 'customerIdentified', label: t('orders.pickup.check.customerIdentified'), checked: false, tickable: true },
      { key: 'orderPacked', label: t('orders.pickup.check.orderPacked'), checked: true, tickable: false },
    ]);
    expect(pickupVerificationChecklist(ready, true)[0]?.checked).toBe(true);
  });

  it('Order packed stays unticked for an order that was never packed', () => {
    for (const status of ['CONFIRMED', 'PENDING_PAYMENT', 'CANCELLED', 'SOMETHING_NEW'] as const) {
      const order = toOrderDetail(detail({ status: status as AdminOrderDetailDto['status'] }), NOW);
      expect({ status, packed: pickupVerificationChecklist(order, true)[1]?.checked }).toEqual({ status, packed: false });
    }
    const packed = toOrderDetail(detail({ status: 'PACKED' }), NOW);
    expect(pickupVerificationChecklist(packed, false)[1]?.checked).toBe(true);
  });

  it('records nothing and gates nothing: the verify step makes no request and Continue stays ungated', () => {
    const verify = functionBody(PICKUP, 'VerifyStep');
    expect(verify).toMatch(/pickupVerificationChecklist\(order, customerIdentified\)/);
    expect(verify).not.toMatch(/\.run\(|useOrderAction|onContinue=\{.*customerIdentified/);
    expect(verify).toMatch(/onPress=\{onContinue\}/);
  });
});
