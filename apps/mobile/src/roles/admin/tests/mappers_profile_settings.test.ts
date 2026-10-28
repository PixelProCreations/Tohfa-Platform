import { describe, expect, it } from 'vitest';
import type { CurrentUserDto, HelpArticleDto, MySessionDto } from '../api/profile';
import type { StorageLocationDto, WarehouseDto } from '../api/warehouses';
import type { WarehouseDocumentDto } from '../api/warehouseDocuments';
import {
  mapCurrentUserDtoToProfile,
  mapHelpArticleDtoToFaq,
  mapMySessionDtoToSession,
  mapStorageLocationDtoToItem,
  mapWarehouseDocumentDtoToItem,
  mapWarehouseDtoToProfileInfo,
} from '../screens/warehouse/profile-settings/mappers';

describe('profile-settings mappers', () => {
  it('maps CurrentUserDto to AdminAccountProfile', () => {
    const userDto: CurrentUserDto = {
      id: 'usr-1',
      fullName: 'Suresh Kumar',
      mobile: '+919876543210',
      email: 'suresh@tohfa.in',
      userType: 'admin',
      preferredLocale: 'en',
      status: 'ACTIVE',
      createdAt: '2026-01-15T00:00:00.000Z',
      lastLoginAt: '2026-09-25T08:00:00.000Z',
      roles: [{ code: 'SUB_WH_ADMIN', warehouseId: 'WH-COON', warehouseName: 'Coonoor Warehouse' }],
    };

    const profile = mapCurrentUserDtoToProfile(userDto, { warehouseId: 'WH-COON', warehouseName: 'Coonoor Warehouse' });
    expect(profile.fullName).toBe('Suresh Kumar');
    expect(profile.adminId).toBe('usr-1');
    expect(profile.mobileNumber).toBe('+919876543210');
    expect(profile.email).toBe('suresh@tohfa.in');
    expect(profile.status).toBe('Active');
    expect(profile.warehouseLabel).toBe('Coonoor Warehouse');
  });

  it('maps WarehouseDto to WarehouseProfileInfo', () => {
    const whDto: WarehouseDto = {
      id: 'WH-COON',
      code: 'WH-COO-001',
      name: 'Coonoor Warehouse',
      type: 'SUB',
      address: '12 Bedford Road',
      city: 'Coonoor',
      pincode: '643101',
      latitude: 11.353,
      longitude: 76.7959,
      capacityKg: '50000.000',
      contactPhone: '+919876543210',
      isActive: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const info = mapWarehouseDtoToProfileInfo(whDto);
    expect(info.warehouseId).toBe('WH-COON');
    expect(info.warehouseName).toBe('Coonoor Warehouse');
    expect(info.code).toBe('WH-COO-001');
    expect(info.status).toBe('Active');
    expect(info.kind).toBe('Sub Warehouse');
    expect(info.region).toBe('Coonoor');
    expect(info.address).toBe('12 Bedford Road');
  });

  it('maps StorageLocationDto to StorageLocationItem enforcing used-kg negative rule', () => {
    const locDto: StorageLocationDto = {
      id: 'loc-1',
      warehouseId: 'WH-COON',
      code: 'LOC-A1',
      name: 'Rack A1',
      locationType: 'Cold Storage',
      capacityKg: '1000.000',
      isActive: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: null,
    };

    const item = mapStorageLocationDtoToItem(locDto);
    expect(item.id).toBe('loc-1');
    expect(item.name).toBe('Rack A1');
    expect(item.type).toBe('Cold Storage');
    expect(item.capacityKg).toBe(1000);
    // Negative rule: Storage location hierarchy/used-kg -> '—' or 0
    expect(item.currentKg).toBe(0);
  });

  it('maps WarehouseDocumentDto to WarehouseDocItem', () => {
    const docDto: WarehouseDocumentDto = {
      id: 'doc-1',
      warehouseId: 'WH-COON',
      docType: 'FSSAI',
      title: 'FSSAI Food Safety License',
      documentNumber: 'FSSAI-2026-001',
      issueDate: '2026-01-01',
      expiryDate: '2026-12-31',
      status: 'EXPIRING_SOON',
      uploadId: 'upl-1',
      uploadedBy: 'usr-1',
      archivedAt: null,
      archivedBy: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: null,
    };

    const item = mapWarehouseDocumentDtoToItem(docDto);
    expect(item.id).toBe('doc-1');
    expect(item.name).toBe('FSSAI Food Safety License');
    expect(item.code).toBe('FSSAI-2026-001');
    expect(item.status).toBe('Expiring Soon');
    expect(item.category).toBe('Compliance');
  });

  it('maps MySessionDto to CurrentSessionInfo', () => {
    const sessionDto: MySessionDto = {
      id: 'sess-1234567890',
      platform: 'android',
      userAgent: 'TOHFA Android App',
      issuedAt: '2026-09-25T08:00:00.000Z',
      lastSeenAt: '2026-09-25T09:30:00.000Z',
      lastSeenIp: '192.168.1.1',
      expiresAt: '2026-10-25T08:00:00.000Z',
    };

    const info = mapMySessionDtoToSession(sessionDto);
    expect(info.device).toBe('ANDROID');
    expect(info.browser).toBe('TOHFA Android App');
    expect(info.location).toBe('192.168.1.1');
    expect(info.sessionId).toContain('sess-123');
  });

  it('maps HelpArticleDto to FaqItem', () => {
    const articleDto: HelpArticleDto = {
      id: 'art-1',
      category: 'Warehouse Operations',
      locale: 'en',
      title: 'How do I perform goods receipt?',
      body: 'Scan the barcode on the truck delivery slip.',
      sortOrder: 1,
    };

    const faq = mapHelpArticleDtoToFaq(articleDto);
    expect(faq.id).toBe('art-1');
    expect(faq.category).toBe('Warehouse Operations');
    expect(faq.question).toBe('How do I perform goods receipt?');
    expect(faq.answer).toBe('Scan the barcode on the truck delivery slip.');
  });
});
