import { describe, expect, it } from 'vitest';
import { parseMoney } from '@tohfa/shared-types';
import { createFulfilmentService, toAdminOrderDetail } from './fulfilment.service.js';
import type { FulfilmentRepo, AdminOrderDetailRecord } from './fulfilment.repo.js';
import { aScope, newId } from '../../test/factories.js';
import { createInMemoryIdempotencyStore } from '../../test/idempotencyStore.js';
import type { Executor } from '../../db/pool.js';

describe('Fulfilment Unit Tests (Mocked Repo & Serializer)', () => {
  const actor = {
    userId: newId(),
    roles: [{ code: 'MAIN_WH_ADMIN' as const }],
    farmerId: null,
    customerId: null,
  };

  const createBaseOrder = (overrides: Record<string, unknown> = {}) => ({
    id: newId(),
    orderNumber: 'TOH-2026-UNIT',
    status: 'PACKED' as const,
    channel: 'ONLINE' as const,
    fulfillmentType: 'PICKUP' as const,
    warehouseId: newId(),
    itemCount: 1,
    totalAmount: parseMoney('100.00'),
    paymentStatus: 'PAID',
    deliveryDate: null,
    placedAt: new Date().toISOString(),
    subtotal: parseMoney('100.00'),
    deliveryFee: parseMoney('0.00'),
    discount: parseMoney('0.00'),
    gstAmount: parseMoney('0.00'),
    deliverySlot: null,
    deliveryAddressId: null,
    deliveryPartnerId: null,
    otpRequired: false,
    cancellationReason: null,
    deliveredAt: null,
    items: [],
    ...overrides,
  });

  const fakeTx = {
    query: async (sql: string) => {
      if (sql.includes('delivery_partners')) {
        return {
          rows: [
            {
              id: '33333333-3333-4333-8333-333333333333',
              name: 'Swift Rider',
              is_active: true,
            },
          ],
          rowCount: 1,
        };
      }
      return { rows: [], rowCount: 1 };
    },
  } as unknown as Executor;

  it('dispatch guard: rejects PICKUP order with delivery partner (409 INVALID_STATE_TRANSITION)', async () => {
    const mockRepo = {
      findOrderForFulfilment: async () => createBaseOrder({ fulfillmentType: 'PICKUP', status: 'PACKED' }),
      updateOrderStatus: async () => 1,
    };

    const s = createFulfilmentService({
      repo: mockRepo as unknown as FulfilmentRepo,
      runTx: async (fn) => fn(fakeTx),
      idempotency: createInMemoryIdempotencyStore(),
    });

    await expect(
      s.dispatchOrder(
        actor,
        aScope(),
        newId(),
        { deliveryPartnerId: newId() },
        newId(),
      ),
    ).rejects.toMatchObject({
      code: 'INVALID_STATE_TRANSITION',
      status: 409,
    });
  });

  it('dispatch guard: rejects DELIVERY order without delivery partner (409 INVALID_STATE_TRANSITION)', async () => {
    const mockRepo = {
      findOrderForFulfilment: async () => createBaseOrder({ fulfillmentType: 'DELIVERY', status: 'PACKED' }),
      updateOrderStatus: async () => 1,
    };

    const s = createFulfilmentService({
      repo: mockRepo as unknown as FulfilmentRepo,
      runTx: async (fn) => fn(fakeTx),
      idempotency: createInMemoryIdempotencyStore(),
    });

    await expect(
      s.dispatchOrder(
        actor,
        aScope(),
        newId(),
        {},
        newId(),
      ),
    ).rejects.toMatchObject({
      code: 'INVALID_STATE_TRANSITION',
      status: 409,
    });
  });

  it('dispatch guard: rejects DELIVERY order when slot differs from customer-booked slot (409 INVALID_STATE_TRANSITION)', async () => {
    const mockRepo = {
      findOrderForFulfilment: async () =>
        createBaseOrder({
          fulfillmentType: 'DELIVERY',
          status: 'PACKED',
          deliverySlot: 'MORNING_8_12',
        }),
      updateOrderStatus: async () => 1,
    };

    const s = createFulfilmentService({
      repo: mockRepo as unknown as FulfilmentRepo,
      runTx: async (fn) => fn(fakeTx),
      idempotency: createInMemoryIdempotencyStore(),
    });

    await expect(
      s.dispatchOrder(
        actor,
        aScope(),
        newId(),
        {
          deliveryPartnerId: '33333333-3333-4333-8333-333333333333',
          slot: 'AFTERNOON_12_4',
        },
        newId(),
      ),
    ).rejects.toMatchObject({
      code: 'INVALID_STATE_TRANSITION',
      status: 409,
    });
  });

  it('dispatch guard: rejects non-PACKED pickup order (e.g. CONFIRMED) (409 INVALID_STATE_TRANSITION)', async () => {
    const mockRepo = {
      findOrderForFulfilment: async () =>
        createBaseOrder({
          fulfillmentType: 'PICKUP',
          status: 'CONFIRMED',
        }),
      updateOrderStatus: async () => 1,
    };

    const s = createFulfilmentService({
      repo: mockRepo as unknown as FulfilmentRepo,
      runTx: async (fn) => fn(fakeTx),
      idempotency: createInMemoryIdempotencyStore(),
    });

    await expect(
      s.dispatchOrder(
        actor,
        aScope(),
        newId(),
        {},
        newId(),
      ),
    ).rejects.toMatchObject({
      code: 'INVALID_STATE_TRANSITION',
      status: 409,
    });
  });

  it('toAdminOrderDetail serializer: passes deliveryAddress and partner for DELIVERY orders, nulls them for PICKUP orders', () => {
    const sampleRecord: AdminOrderDetailRecord = {
      id: newId(),
      orderNumber: 'TOH-SER-001',
      channel: 'ONLINE',
      status: 'OUT_FOR_DELIVERY',
      fulfilmentType: 'DELIVERY',
      pickupType: 'HOME_DELIVERY',
      notes: null,
      paymentMethod: 'WALLET',
      paymentStatus: 'PAID',
      warehouseId: newId(),
      warehouseName: 'Nilgiri Central',
      customerId: newId(),
      customerCode: 'CUST-001',
      customerName: 'Ramesh',
      customerMobile: '+919876543210',
      walkInName: null,
      walkInMobile: null,
      items: [],
      subtotal: parseMoney('200.00'),
      deliveryFee: parseMoney('40.00'),
      discount: parseMoney('0.00'),
      gstAmount: parseMoney('10.00'),
      totalAmount: parseMoney('250.00'),
      invoice: null,
      deliveryDate: '2026-11-20',
      deliverySlot: 'MORNING_8_12',
      deliveryAddress: {
        line1: '123 Tea Garden',
        line2: 'Plot 4',
        city: 'Ooty',
        district: 'Nilgiris',
        state: 'Tamil Nadu',
        pincode: '643001',
        lat: 11.41,
        lng: 76.70,
      },
      deliveryPartner: {
        id: newId(),
        name: 'Express Rider',
        phone: '+919999999999',
        vehicleRef: 'TN-43-1111',
      },
      otpRequired: false,
      otpVerifiedAt: null,
      timeline: [],
      placedAt: '2026-11-16T10:00:00Z',
      packedAt: '2026-11-16T11:00:00Z',
      completedAt: null,
      cancelledAt: null,
    };

    // 1. DELIVERY order
    const deliveryDto = toAdminOrderDetail(sampleRecord);
    expect(deliveryDto.fulfilmentType).toBe('DELIVERY');
    expect(deliveryDto.deliveryAddress).toEqual({
      line1: '123 Tea Garden',
      line2: 'Plot 4',
      city: 'Ooty',
      district: 'Nilgiris',
      state: 'Tamil Nadu',
      pincode: '643001',
      lat: 11.41,
      lng: 76.7,
    });
    expect(deliveryDto.deliveryPartner).toMatchObject({
      name: 'Express Rider',
    });

    // 2. PICKUP order: deliveryAddress and deliveryPartner must be nulled
    const pickupRecord: AdminOrderDetailRecord = {
      ...sampleRecord,
      fulfilmentType: 'PICKUP',
      pickupType: 'WAREHOUSE_PICKUP',
      status: 'READY_FOR_PICKUP',
    };
    const pickupDto = toAdminOrderDetail(pickupRecord);
    expect(pickupDto.fulfilmentType).toBe('PICKUP');
    expect(pickupDto.deliveryAddress).toBeNull();
    expect(pickupDto.deliveryPartner).toBeNull();
  });
});
