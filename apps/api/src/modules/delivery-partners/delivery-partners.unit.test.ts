import { describe, expect, it, vi } from 'vitest';
import { createDeliveryPartnersService } from './delivery-partners.service.js';
import type { DeliveryPartnersRepo, DeliveryPartnerRecord } from './delivery-partners.repo.js';
import type { Executor } from '../../db/pool.js';

describe('DeliveryPartnersService Unit Tests (Mocked Repo)', () => {
  const samplePartner: DeliveryPartnerRecord = {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Fast Courier',
    phone: '+919876543210',
    vehicleRef: 'TN-43-1234',
    isActive: true,
    createdAt: new Date('2026-01-01T10:00:00Z'),
    updatedAt: new Date('2026-01-02T10:00:00Z'),
    deletedAt: null,
  };

  it('list(status) queries repo and maps records to DTOs', async () => {
    const mockRepo: Partial<DeliveryPartnersRepo> = {
      list: vi.fn().mockResolvedValue([samplePartner]),
    };
    const mockDb = {} as unknown as Executor;

    const service = createDeliveryPartnersService({
      repo: mockRepo as DeliveryPartnersRepo,
      db: mockDb,
    });

    const result = await service.list('active');
    expect(mockRepo.list).toHaveBeenCalledWith(mockDb, 'active');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: samplePartner.id,
      name: samplePartner.name,
      phone: samplePartner.phone,
      vehicleRef: samplePartner.vehicleRef,
      isActive: true,
      createdAt: '2026-01-01T10:00:00.000Z',
      updatedAt: '2026-01-02T10:00:00.000Z',
    });
  });

  it('getById throws 404 when partner is not found or soft deleted', async () => {
    const mockRepo: Partial<DeliveryPartnersRepo> = {
      findById: vi.fn().mockResolvedValue(null),
    };
    const mockDb = {} as unknown as Executor;

    const service = createDeliveryPartnersService({
      repo: mockRepo as DeliveryPartnersRepo,
      db: mockDb,
    });

    await expect(service.getById('non-existent-id')).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    });

    // Also throws 404 when partner has deletedAt set
    mockRepo.findById = vi.fn().mockResolvedValue({
      ...samplePartner,
      deletedAt: new Date(),
    });

    await expect(service.getById(samplePartner.id)).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    });
  });

  it('getById returns partner DTO when partner exists and is not deleted', async () => {
    const mockRepo: Partial<DeliveryPartnersRepo> = {
      findById: vi.fn().mockResolvedValue(samplePartner),
    };
    const mockDb = {} as unknown as Executor;

    const service = createDeliveryPartnersService({
      repo: mockRepo as DeliveryPartnersRepo,
      db: mockDb,
    });

    const result = await service.getById(samplePartner.id);
    expect(result.id).toBe(samplePartner.id);
    expect(result.name).toBe('Fast Courier');
  });
});
