/**
 * screens/warehouse/customers/mappers.ts: the customers API rows -> the
 * customer screens' types.
 *
 * Money is integer paise end to end (the API's Money strings go through
 * @tohfa/shared-types parseMoney/toPaise) and weights integer grams, so no
 * float touches either. Every enum the spec gives (customer status and type,
 * order status, wallet status, wallet transaction type, return status, ticket
 * status, category and priority) has an exhaustive table with a fallback for a
 * value the app does not know yet.
 *
 * What the server decides is shown as sent, never recomputed: the masked
 * mobile (BR-92), the issue reference (BR-91h), the wallet balance (BR-93e).
 * The customer uuid and the human code stay separate: the uuid is the only key.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Money } from '@tohfa/shared-types';
import { describe, expect, it } from 'vitest';
import type {
  AdminCustomerDetailDto,
  AdminCustomerIssueDto,
  AdminCustomerListItemDto,
  AdminCustomerOrderDto,
  AdminCustomerPurchaseDto,
  AdminCustomerSupportTicketDetailDto,
  AdminCustomerSupportTicketDto,
  AdminCustomerWalletSummaryDto,
  CustomerStatus,
  CustomerType,
  ReturnStatus,
  SupportTicketCategory,
  SupportTicketPriority,
  SupportTicketStatus,
  WalletStatus,
  WalletTransactionDto,
  WalletTransactionType,
} from '../api/customers';
import type { AdminOrderStatus } from '../api/orders';
import { t } from '../i18n';
import {
  CUSTOMER_STATUS_TABLE,
  CUSTOMER_TYPE_TABLE,
  ISSUE_STATUS_TABLE,
  ORDER_CATEGORY_TABLE,
  TICKET_CATEGORY_TABLE,
  TICKET_PRIORITY_TABLE,
  TICKET_STATUS_TABLE,
  WALLET_STATUS_TABLE,
  WALLET_TXN_TYPE_TABLE,
  contactActions,
  customerIdParam,
  customerSearchQuery,
  customerStatusOf,
  customerSummary,
  issueStatusOf,
  mobileLabel,
  supportReplyBody,
  ticketStatusOf,
  toCustomerIssueRow,
  toCustomerOrderRow,
  toCustomerProfile,
  toCustomerRecord,
  toCustomerWallet,
  toPurchaseRow,
  toSupportTicketDetail,
  toSupportTicketRow,
  toWalletScreenTransaction,
  toWalletTxnRow,
  walletTxnTypeOf,
} from '../screens/warehouse/customers/mappers';
import { DETAIL_STATUS_TABLE } from '../screens/warehouse/orders/mappers';

const CUSTOMER = '55555555-5555-4555-8555-555555555555';
const WH = '11111111-1111-4111-8111-111111111111';
const ORDER = '22222222-2222-4222-8222-222222222222';
const CROP = '66666666-6666-4666-8666-666666666666';
const WALLET = '33333333-3333-4333-8333-333333333333';
const TXN = '44444444-4444-4444-8444-444444444444';
const TICKET = '77777777-7777-4777-8777-777777777777';
const ISSUE = '7a1b2c3d-0000-4000-8000-000000000001';
const NOW = new Date('2026-10-13T06:30:00Z'); // 12:00 IST

/** A Money literal (the API sends these strings). */
const m = (value: string): Money => value as Money;

function listItem(over: Partial<AdminCustomerListItemDto> = {}): AdminCustomerListItemDto {
  return {
    id: CUSTOMER,
    customerCode: 'CUS-00291',
    name: 'Rajesh Kumar',
    mobileMasked: '******3210',
    customerType: 'RETAIL',
    status: 'ACTIVE',
    isNew: false,
    preferredWarehouseId: WH,
    totalOrders: 12,
    lastActivityAt: '2026-10-12T04:30:00Z',
    piiMasked: true,
    createdAt: '2026-01-12T04:30:00Z',
    ...over,
  };
}

function detail(over: Partial<AdminCustomerDetailDto> = {}): AdminCustomerDetailDto {
  return {
    id: CUSTOMER,
    customerCode: 'CUS-00291',
    name: 'Rajesh Kumar',
    mobileMasked: '******3210',
    customerType: 'RETAIL',
    businessName: null,
    status: 'ACTIVE',
    isNew: false,
    preferredWarehouseId: WH,
    totalOrders: 12,
    lifetimeValue: m('8450.30'),
    walletBalance: m('1250.10'),
    lastOrderAt: '2026-10-12T04:30:00Z',
    lastActivityAt: '2026-10-12T04:30:00Z',
    piiMasked: true,
    createdAt: '2026-01-12T04:30:00Z',
    ...over,
  } as AdminCustomerDetailDto;
}

function order(over: Partial<AdminCustomerOrderDto> = {}): AdminCustomerOrderDto {
  return {
    id: ORDER,
    orderNumber: 'ORD-00251',
    channel: 'DIRECT',
    status: 'PICKED_UP',
    paymentStatus: 'PAID',
    paymentMethod: 'CASH',
    warehouseId: WH,
    itemCount: 3,
    totalAmount: m('850.50'),
    invoiceNumber: 'INV-2026-00251',
    placedAt: '2026-10-12T04:30:00Z',
    completedAt: '2026-10-12T05:00:00Z',
    ...over,
  };
}

function purchase(over: Partial<AdminCustomerPurchaseDto> = {}): AdminCustomerPurchaseDto {
  return {
    orderId: ORDER,
    orderNumber: 'ORD-00251',
    channel: 'DIRECT',
    warehouseId: WH,
    productId: CROP,
    productName: 'Tomato',
    grade: 'GRADE_1',
    qtyKg: '2.250',
    unitPrice: m('40.10'),
    lineTotal: m('90.23'),
    purchasedAt: '2026-10-12T04:30:00Z',
    ...over,
  };
}

function wallet(over: Partial<AdminCustomerWalletSummaryDto> = {}): AdminCustomerWalletSummaryDto {
  return {
    customerId: CUSTOMER,
    walletId: WALLET,
    balance: m('1250.10'),
    currency: 'INR',
    status: 'ACTIVE',
    transactionCount: 4,
    lastTransactionAt: '2026-10-12T04:30:00Z',
    ...over,
  };
}

function txn(over: Partial<WalletTransactionDto> = {}): WalletTransactionDto {
  return {
    id: TXN,
    walletId: WALLET,
    txnType: 'ORDER_DEBIT',
    amount: m('-750.20'),
    balanceAfter: m('500.10'),
    refType: 'order',
    refId: ORDER,
    fiscalCashTag: null,
    warehouseId: WH,
    performedBy: null,
    performedAt: '2026-10-12T04:30:00Z',
    remarks: null,
    ...over,
  };
}

function issue(over: Partial<AdminCustomerIssueDto> = {}): AdminCustomerIssueDto {
  return {
    id: ISSUE,
    kind: 'RETURN',
    reference: 'RET-7A1B2C3D',
    orderId: ORDER,
    orderNumber: 'ORD-00251',
    status: 'PENDING',
    reason: 'Tomatoes were bruised',
    createdAt: '2026-10-12T04:30:00Z',
    resolvedAt: null,
    ...over,
  };
}

function ticket(over: Partial<AdminCustomerSupportTicketDto> = {}): AdminCustomerSupportTicketDto {
  return {
    id: TICKET,
    ticketNumber: 'TKT-00104',
    categoryCode: 'LATE',
    subject: 'Pickup was delayed',
    status: 'IN_PROGRESS',
    priority: 'NORMAL',
    messageCount: 2,
    resolvedAt: null,
    createdAt: '2026-10-12T04:30:00Z',
    updatedAt: '2026-10-12T05:30:00Z',
    ...over,
  };
}

function ticketDetail(over: Partial<AdminCustomerSupportTicketDetailDto> = {}): AdminCustomerSupportTicketDetailDto {
  return {
    ...ticket(),
    description: 'I waited 40 minutes.',
    messages: [
      {
        id: '88888888-8888-4888-8888-000000000001',
        ticketId: TICKET,
        senderUserId: CUSTOMER,
        senderRole: 'CUSTOMER',
        message: 'Where is my order?',
        isInternal: false,
        redacted: false,
        attachmentUrl: null,
        createdAt: '2026-10-12T04:30:00Z',
      },
      {
        id: '88888888-8888-4888-8888-000000000002',
        ticketId: TICKET,
        senderUserId: WH,
        senderRole: 'SUB_WH_ADMIN',
        message: 'Packed from [redacted] stock.',
        isInternal: true,
        redacted: true,
        attachmentUrl: 'support/photo.jpg',
        createdAt: '2026-10-12T05:30:00Z',
      },
    ],
    ...over,
  };
}

// ─── Status tables ───────────────────────────────────────────────────────────

describe('status tables', () => {
  it('cover every spec value, with a fallback for an unknown one', () => {
    const customerStatuses: readonly CustomerStatus[] = ['ACTIVE', 'INACTIVE'];
    const customerTypes: readonly CustomerType[] = ['RETAIL', 'B2B', 'HORECA'];
    const walletStatuses: readonly WalletStatus[] = ['ACTIVE', 'FROZEN', 'CLOSED'];
    const txnTypes: readonly WalletTransactionType[] = [
      'TOPUP_CASH',
      'TOPUP_DIGITAL',
      'ORDER_DEBIT',
      'ORDER_REFUND',
      'PAYOUT_DEBIT',
      'SALE_CREDIT',
      'SUBSCRIPTION_DEBIT',
      'ADJUSTMENT',
    ];
    const returnStatuses: readonly ReturnStatus[] = ['PENDING', 'INSPECTED', 'APPROVED', 'REJECTED', 'REFUND_PENDING_BANK', 'REFUNDED'];
    const ticketStatuses: readonly SupportTicketStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
    const categories: readonly SupportTicketCategory[] = ['QUALITY', 'QUANTITY', 'MISSING', 'WRONG_ITEM', 'DAMAGED', 'LATE', 'PAYMENT', 'OTHER'];
    const priorities: readonly SupportTicketPriority[] = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
    expect(Object.keys(CUSTOMER_STATUS_TABLE).sort()).toEqual([...customerStatuses].sort());
    expect(Object.keys(CUSTOMER_TYPE_TABLE).sort()).toEqual([...customerTypes].sort());
    expect(Object.keys(WALLET_STATUS_TABLE).sort()).toEqual([...walletStatuses].sort());
    expect(Object.keys(WALLET_TXN_TYPE_TABLE).sort()).toEqual([...txnTypes].sort());
    expect(Object.keys(ISSUE_STATUS_TABLE).sort()).toEqual([...returnStatuses].sort());
    expect(Object.keys(TICKET_STATUS_TABLE).sort()).toEqual([...ticketStatuses].sort());
    expect(Object.keys(TICKET_CATEGORY_TABLE).sort()).toEqual([...categories].sort());
    expect(Object.keys(TICKET_PRIORITY_TABLE).sort()).toEqual([...priorities].sort());
    expect(customerStatusOf('SUSPENDED')).toBe('unknown');
    expect(walletTxnTypeOf('CASHBACK')).toBe('unknown');
    expect(issueStatusOf('ESCALATED')).toBe('unknown');
    expect(ticketStatusOf('INVESTIGATING')).toBe('unknown');
  });

  it('an order status uses the order area table; every one of its statuses has a tab bucket', () => {
    const statuses: readonly AdminOrderStatus[] = Object.keys(DETAIL_STATUS_TABLE) as AdminOrderStatus[];
    expect(statuses).toHaveLength(10);
    for (const status of statuses) expect(ORDER_CATEGORY_TABLE).toHaveProperty(DETAIL_STATUS_TABLE[status]);
    expect(ORDER_CATEGORY_TABLE).toHaveProperty('unknown');
    expect(toCustomerOrderRow(order({ status: 'PICKED_UP' }), NOW).category).toBe('Completed');
    expect(toCustomerOrderRow(order({ status: 'CANCELLED' }), NOW).category).toBe('Cancelled');
    expect(toCustomerOrderRow(order({ status: 'READY_FOR_PICKUP' }), NOW).category).toBe('Active');
    expect(toCustomerOrderRow(order({ status: 'LOST' as AdminOrderStatus }), NOW).category).toBeNull();
  });
});

// ─── Ids and search ──────────────────────────────────────────────────────────

describe('ids and search', () => {
  it('a customer route param must be a uuid; a CUS- code is not an id the API can look up', () => {
    expect(customerIdParam(CUSTOMER)).toBe(CUSTOMER);
    expect(customerIdParam('CUS-00291')).toBeUndefined();
    expect(customerIdParam(undefined)).toBeUndefined();
  });

  it('keeps the uuid and the human code separate', () => {
    const row = toCustomerRecord(listItem(), NOW);
    expect(row.id).toBe(CUSTOMER);
    expect(row.code).toBe('CUS-00291');
  });

  it('q is trimmed, never blank and at most 100 characters (BR-92h)', () => {
    expect(customerSearchQuery('  Ravi ')).toBe('Ravi');
    expect(customerSearchQuery('   ')).toBeUndefined();
    expect(customerSearchQuery('')).toBeUndefined();
    expect(customerSearchQuery('x'.repeat(120))).toHaveLength(100);
  });
});

// ─── List and summary ────────────────────────────────────────────────────────

describe('toCustomerRecord / customerSummary', () => {
  it('maps a row: status, orders, last activity', () => {
    const row = toCustomerRecord(listItem(), NOW);
    expect(row.name).toBe('Rajesh Kumar');
    expect(row.status).toBe('active');
    expect(row.statusLabel).toBe(t('customers.status.active'));
    expect(row.totalOrders).toBe(12);
    expect(row.lastActivityLabel).toBe(t('datetime.yesterday'));
  });

  it('no last activity shows as no value, never as a date', () => {
    expect(toCustomerRecord(listItem({ lastActivityAt: null }), NOW).lastActivityLabel).toBe(t('customers.noValue'));
  });

  it('the KPIs are the server summary over the whole visible set; null before it loads', () => {
    expect(customerSummary({ total: 1248, active: 1105, new: 24 })).toEqual({ total: 1248, active: 1105, new: 24 });
    expect(customerSummary(undefined)).toBeNull();
  });
});

// ─── BR-92 masking ───────────────────────────────────────────────────────────

describe('BR-92 / BR-92a: masked PII', () => {
  it('BR-92: shows the masked mobile exactly as the server sent it', () => {
    expect(toCustomerRecord(listItem({ mobileMasked: '******3210' }), NOW).mobileMasked).toBe('******3210');
    // A fully masked short number is shown as is too (BR-92e), never padded or reformatted.
    expect(toCustomerRecord(listItem({ mobileMasked: '****' }), NOW).mobileMasked).toBe('****');
    const profile = toCustomerProfile(detail({ mobileMasked: '********1234' }), NOW);
    expect(mobileLabel(profile)).toBe('********1234');
  });

  it('BR-92a: when piiMasked, the call and email actions are hidden and no contact is kept', () => {
    // Even if a server bug sent the full values alongside piiMasked: true, they are not kept.
    const leaky = detail({ piiMasked: true, mobile: '9876543210', email: 'rajesh@example.com' } as Partial<AdminCustomerDetailDto>);
    const profile = toCustomerProfile(leaky, NOW);
    expect(contactActions(profile)).toEqual({ call: false, email: false });
    expect(profile.contact).toEqual({ mobile: null, email: null });
    expect(mobileLabel(profile)).toBe('******3210');
    expect(JSON.stringify(profile)).not.toContain('9876543210');
    expect(JSON.stringify(profile)).not.toContain('rajesh@example.com');
  });

  it('an unmasked (scope all) profile offers call and email when the server sent them', () => {
    const profile = toCustomerProfile(
      detail({ piiMasked: false, mobile: '9876543210', email: 'rajesh@example.com' } as Partial<AdminCustomerDetailDto>),
      NOW,
    );
    expect(contactActions(profile)).toEqual({ call: true, email: true });
    expect(mobileLabel(profile)).toBe('9876543210');
    expect(contactActions(toCustomerProfile(detail({ piiMasked: false, mobile: '9876543210', email: null } as Partial<AdminCustomerDetailDto>), NOW))).toEqual({
      call: true,
      email: false,
    });
  });

  it('a list row never keeps a full mobile or e-mail', () => {
    const row = toCustomerRecord(listItem({ mobile: '9876543210', email: 'rajesh@example.com' } as Partial<AdminCustomerListItemDto>), NOW);
    expect(JSON.stringify(row)).not.toContain('9876543210');
    expect(JSON.stringify(row)).not.toContain('rajesh@example.com');
  });
});

// ─── Money ───────────────────────────────────────────────────────────────────

describe('money is exact integer paise', () => {
  it('lifetime value and wallet balance', () => {
    const profile = toCustomerProfile(detail({ lifetimeValue: m('1234567.89'), walletBalance: m('0.30') }), NOW);
    expect(profile.lifetimeValuePaise).toBe(123456789);
    expect(profile.walletBalancePaise).toBe(30);
    expect(profile.lifetimeValueLabel).toBe('₹12,34,567.89');
  });

  it('a value that is not Money shows as no value, never 0', () => {
    const profile = toCustomerProfile(detail({ walletBalance: m('abc') as never }), NOW);
    expect(profile.walletBalancePaise).toBeNull();
    expect(profile.walletBalanceLabel).toBe(t('customers.noValue'));
  });

  it('an order total', () => {
    const row = toCustomerOrderRow(order({ totalAmount: m('0.30') }), NOW);
    expect(row.totalPaise).toBe(30);
  });

  it('a purchase line: unit price, line total and quantity in grams', () => {
    const row = toPurchaseRow(purchase(), NOW);
    expect(row.unitPricePaise).toBe(4010);
    expect(row.lineTotalPaise).toBe(9023);
    expect(row.qtyGrams).toBe(2250);
  });

  it('a wallet transaction keeps its own sign; the previous balance is balanceAfter - amount, in paise', () => {
    const debit = toWalletTxnRow(txn({ amount: m('-750.20'), balanceAfter: m('500.10') }), NOW);
    expect(debit.amountPaise).toBe(-75020);
    expect(debit.direction).toBe('debit');
    expect(debit.balanceAfterPaise).toBe(50010);
    expect(debit.previousBalancePaise).toBe(125030);
    const credit = toWalletTxnRow(txn({ txnType: 'TOPUP_CASH', amount: m('0.10'), balanceAfter: m('0.30'), fiscalCashTag: 'FT-1' }), NOW);
    expect(credit.direction).toBe('credit');
    expect(credit.previousBalancePaise).toBe(20);
  });

  it('BR-93e: the wallet balance is the server balance, shown as sent', () => {
    const view = toCustomerWallet(wallet({ balance: m('1250.10') }), NOW);
    expect(view.balancePaise).toBe(125010);
    expect(view.balanceLabel).toBe('₹1,250.10');
  });
});

// ─── Orders and purchases ────────────────────────────────────────────────────

describe('orders and purchases', () => {
  it('an order row keeps the order uuid (for the order detail) apart from its number, and the invoice number', () => {
    const row = toCustomerOrderRow(order(), NOW);
    expect(row.id).toBe(ORDER);
    expect(row.orderNumber).toBe('ORD-00251');
    expect(row.invoiceNumber).toBe('INV-2026-00251');
    expect(row.itemsLabel).toBe(t('orders.items.many', { count: 3 }));
    expect(toCustomerOrderRow(order({ invoiceNumber: null }), NOW).invoiceNumber).toBeNull();
  });

  it('purchases stay line level: one row per line, keyed to its order, no invoice-level row', () => {
    const lines = [purchase(), purchase({ productName: 'Carrot', productId: '66666666-6666-4666-8666-000000000002' })];
    const rows = lines.map((line) => toPurchaseRow(line, NOW));
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.orderId)).toEqual([ORDER, ORDER]);
    expect(rows.map((r) => r.productName)).toEqual(['Tomato', 'Carrot']);
    expect(Object.keys(rows[0] ?? {})).not.toContain('invoiceNo');
    expect(rows[0]?.lineLabel).toBe(t('inventory.product.label', { product: 'Tomato', grade: t('inventory.grade.GRADE_1') }));
  });
});

// ─── Wallet ──────────────────────────────────────────────────────────────────

describe('wallet', () => {
  it('maps the summary status and count', () => {
    const view = toCustomerWallet(wallet({ status: 'FROZEN', transactionCount: 4 }), NOW);
    expect(view.status).toBe('frozen');
    expect(view.transactionCount).toBe(4);
  });

  it('a wallet row becomes the wallet screen record with display strings from paise', () => {
    const record = toWalletScreenTransaction(toWalletTxnRow(txn(), NOW));
    expect(record.transactionId).toBe(TXN);
    expect(record.amount).toBe('-₹750.20');
    expect(record.newBalance).toBe('₹500.10');
    expect(record.previousBalance).toBe('₹1,250.30');
    expect(record.type).toBe(t('customers.wallet.txn.ORDER_DEBIT'));
  });
});

// ─── Issues ──────────────────────────────────────────────────────────────────

describe('issues', () => {
  it('BR-91h: shows the issue reference exactly as the server derived it, keyed by the id', () => {
    // A reference that is not what the app would derive from the id proves it is not recomputed.
    const row = toCustomerIssueRow(issue({ reference: 'RET-DEADBEEF' }), NOW);
    expect(row.reference).toBe('RET-DEADBEEF');
    expect(row.id).toBe(ISSUE);
  });

  it('BR-91h: refundAmount is absent until an inspection; then exact paise', () => {
    expect(toCustomerIssueRow(issue(), NOW).refundPaise).toBeNull();
    expect(toCustomerIssueRow(issue(), NOW).refundLabel).toBeNull();
    expect(toCustomerIssueRow(issue({ refundAmount: m('200.50') }), NOW).refundPaise).toBe(20050);
  });

  it('resolvedAt null means still open', () => {
    expect(toCustomerIssueRow(issue(), NOW).resolvedLabel).toBeNull();
    expect(toCustomerIssueRow(issue({ status: 'REFUNDED', resolvedAt: '2026-10-12T05:00:00Z' }), NOW).resolvedLabel).not.toBeNull();
  });
});

// ─── Support ─────────────────────────────────────────────────────────────────

describe('support tickets', () => {
  it('maps a ticket row; IN_PROGRESS is the API word for the stored INVESTIGATING', () => {
    const row = toSupportTicketRow(ticket(), NOW);
    expect(row.ticketNumber).toBe('TKT-00104');
    expect(row.status).toBe('inProgress');
    expect(row.categoryLabel).toBe(t('customers.support.category.LATE'));
  });

  it('a thread keeps the server order, flags internal and redacted messages, and offers a reply unless CLOSED', () => {
    const view = toSupportTicketDetail(ticketDetail(), NOW);
    expect(view.messages.map((m) => m.fromCustomer)).toEqual([true, false]);
    expect(view.messages[1]?.isInternal).toBe(true);
    expect(view.messages[1]?.redacted).toBe(true);
    expect(view.messages[1]?.body).toBe('Packed from [redacted] stock.');
    expect(view.canReply).toBe(true);
    expect(toSupportTicketDetail(ticketDetail({ status: 'CLOSED' }), NOW).canReply).toBe(false);
  });

  it('BR-97: the reply body is the trimmed message only; blank or over 2000 characters is no body', () => {
    expect(supportReplyBody('  Refund issued.  ')).toEqual({ message: 'Refund issued.' });
    expect(supportReplyBody('   ')).toBeNull();
    expect(supportReplyBody('x'.repeat(2001))).toBeNull();
    expect(supportReplyBody('x'.repeat(2000))).toEqual({ message: 'x'.repeat(2000) });
  });
});

// ─── BR-16 ───────────────────────────────────────────────────────────────────

describe('BR-16: farm-anonymous', () => {
  const FARM = {
    farmerId: '99999999-9999-4999-8999-999999999999',
    farmerName: 'Murugan',
    farmName: 'Green Acres Estate',
    village: 'Kil Kotagiri',
    gps: '11.4,76.7',
    batchCode: 'BATCH-XYZ-9',
  };
  const SECRETS = ['99999999-9999', 'Murugan', 'Green Acres', 'Kil Kotagiri', '11.4,76.7', 'BATCH-XYZ-9'];

  it('the mappers copy no farm or farmer field, even when a record carries them', () => {
    const views = [
      toCustomerRecord({ ...listItem(), ...FARM } as AdminCustomerListItemDto, NOW),
      toCustomerProfile({ ...detail(), ...FARM } as AdminCustomerDetailDto, NOW),
      toCustomerOrderRow({ ...order(), ...FARM } as AdminCustomerOrderDto, NOW),
      toPurchaseRow({ ...purchase(), ...FARM } as AdminCustomerPurchaseDto, NOW),
      toWalletTxnRow({ ...txn(), ...FARM } as WalletTransactionDto, NOW),
      toCustomerIssueRow({ ...issue(), ...FARM } as AdminCustomerIssueDto, NOW),
      toSupportTicketDetail(
        { ...ticketDetail(), ...FARM, messages: ticketDetail().messages.map((m) => ({ ...m, ...FARM })) } as AdminCustomerSupportTicketDetailDto,
        NOW,
      ),
    ];
    for (const view of views) {
      const json = JSON.stringify(view);
      for (const secret of SECRETS) expect({ secret, leaked: json.includes(secret) }).toEqual({ secret, leaked: false });
      expect(json).not.toMatch(/"(farm|farmer|village|gps|batch)\w*"\s*:/i);
    }
  });

  it('the mapper source reads no farm or farmer property', () => {
    const source = fs.readFileSync(path.join(__dirname, '..', 'screens', 'warehouse', 'customers', 'mappers.ts'), 'utf8');
    expect(source).not.toMatch(/\.\s*(farm|farmer|village|gps|batch)\w*/i);
    expect(source).not.toMatch(/\[\s*['"](farm|farmer|village|gps|batch)\w*['"]\s*\]/i);
  });
});
