/**
 * Warehouse Documents and Warehouse Settings mappers (BR-105, BR-66, BR-80, BR-30):
 * screens/warehouse/profile-settings/mappers_documents.ts and mappers_settings.ts. Pure.
 */
import { describe, expect, it } from 'vitest';
import type { WarehouseDocumentDetailDto, WarehouseDocumentDto } from '../api/warehouseDocuments';
import {
  canManageDocument,
  documentEditBody,
  documentFormOf,
  documentStatusLabel,
  filterParam,
  isCalendarDate,
  openableFileUrl,
  toDocumentDetailView,
  toDocumentView,
} from '../screens/warehouse/profile-settings/mappers_documents';
import {
  capacityInputOf,
  operatingHoursBody,
  operatingHoursFormOf,
  parseCapacityInput,
  parsePhoneInput,
  pickWarehouseId,
} from '../screens/warehouse/profile-settings/mappers_settings';

const WH = '3f1b7c2e-2a44-4f0e-9b1a-6b0d2f0f1a01';
const WH2 = '7c1b7c2e-2a44-4f0e-9b1a-6b0d2f0f1a02';

function doc(over: Partial<WarehouseDocumentDto> = {}): WarehouseDocumentDto {
  return {
    id: '9a8b7c6d-1111-4222-8333-444455556666',
    warehouseId: WH,
    docType: 'FSSAI',
    title: 'FSSAI Storage Licence',
    documentNumber: 'FS-123',
    issueDate: '2025-02-15',
    expiryDate: '2028-02-14',
    status: 'ACTIVE',
    uploadId: '0f0e0d0c-aaaa-4bbb-8ccc-dddddddddddd',
    uploadedBy: '1f0e0d0c-aaaa-4bbb-8ccc-dddddddddddd',
    archivedAt: null,
    archivedBy: null,
    createdAt: '2026-01-10T05:00:00Z',
    updatedAt: null,
    ...over,
  };
}

describe('document rows (BR-105)', () => {
  it('BR-105: shows the server-derived status as sent, never recomputed from the dates', () => {
    // An expiry far in the future but the server says EXPIRING_SOON: the server wins.
    const view = toDocumentView(doc({ status: 'EXPIRING_SOON', expiryDate: '2099-01-01' }));
    expect(view.status).toBe('EXPIRING_SOON');
    expect(view.statusLabel).toBe('Expiring Soon');
    expect(view.statusTone).toBe('warning');
    expect(toDocumentView(doc({ status: 'EXPIRED' })).statusTone).toBe('danger');
  });

  it('an unknown status or type still renders with a fallback label', () => {
    const view = toDocumentView(doc({ status: 'LAPSED' as never, docType: 'PERMIT' as never }));
    expect(view.status).toBeNull();
    expect(view.statusLabel).toBe('Unknown');
    expect(view.docType).toBeNull();
    expect(view.docTypeLabel).toBe('Document');
    expect(documentStatusLabel(undefined)).toBe('Unknown');
  });

  it('formats the dates and builds the date line', () => {
    const view = toDocumentView(doc());
    expect(view.issueLabel).toBe('15 Feb 2025');
    expect(view.expiryLabel).toBe('14 Feb 2028');
    expect(view.dateLine).toBe('Issued 15 Feb 2025 · Expires 14 Feb 2028');
    expect(toDocumentView(doc({ issueDate: null, expiryDate: null })).dateLine).toBe('No dates recorded');
    expect(toDocumentView(doc({ expiryDate: null })).dateLine).toBe('Issued 15 Feb 2025 · No expiry date');
  });

  it('BR-105: an archived document is never editable; edit needs warehouse.document.manage', () => {
    const archived = toDocumentView(doc({ status: 'ARCHIVED', archivedAt: '2026-05-01T00:00:00Z' }));
    expect(archived.isArchived).toBe(true);
    expect(canManageDocument(archived, true)).toBe(false);
    const live = toDocumentView(doc());
    expect(canManageDocument(live, true)).toBe(true);
    expect(canManageDocument(live, false)).toBe(false);
  });

  it('BR-105: the file opens only through a signed URL; a deleted upload has none', () => {
    const detail: WarehouseDocumentDetailDto = { ...doc(), fileUrl: 'https://blob.example/x?sig=1', mimeType: 'application/pdf' };
    expect(openableFileUrl(detail)).toBe('https://blob.example/x?sig=1');
    expect(toDocumentDetailView(detail).hasFile).toBe(true);
    const gone: WarehouseDocumentDetailDto = { ...doc(), fileUrl: null, mimeType: null };
    expect(openableFileUrl(gone)).toBeNull();
    expect(toDocumentDetailView(gone).hasFile).toBe(false);
  });

  it('a chip value maps to the query param (ALL = no filter)', () => {
    expect(filterParam('ALL')).toBeUndefined();
    expect(filterParam('EXPIRED')).toBe('EXPIRED');
  });
});

describe('document metadata edit (BR-105)', () => {
  const original = toDocumentView(doc());

  it('sends only the changed fields', () => {
    const form = { ...documentFormOf(original), title: '  FSSAI Licence  ' };
    expect(documentEditBody(original, form)).toEqual({ body: { title: 'FSSAI Licence' } });
  });

  it('a cleared number or date is sent as null', () => {
    const form = { ...documentFormOf(original), documentNumber: ' ', expiryDate: '' };
    expect(documentEditBody(original, form)).toEqual({ body: { documentNumber: null, expiryDate: null } });
  });

  it('BR-105: refuses an expiry before the issue date, an unreal date, a blank title and no change', () => {
    const base = documentFormOf(original);
    expect(documentEditBody(original, { ...base, expiryDate: '2024-01-01' })).toEqual({ errorKey: 'warehouseDocs.edit.error.expiryBeforeIssue' });
    expect(documentEditBody(original, { ...base, issueDate: '2026-02-30' })).toEqual({ errorKey: 'warehouseDocs.edit.error.date' });
    expect(documentEditBody(original, { ...base, title: '   ' })).toEqual({ errorKey: 'warehouseDocs.edit.error.title' });
    expect(documentEditBody(original, base)).toEqual({ errorKey: 'warehouseDocs.edit.error.noChanges' });
  });

  it('isCalendarDate accepts only real YYYY-MM-DD days', () => {
    expect(isCalendarDate('2028-02-29')).toBe(true);
    expect(isCalendarDate('2027-02-29')).toBe(false);
    expect(isCalendarDate('15-02-2025')).toBe(false);
  });
});

describe('warehouse settings forms (BR-66, BR-80)', () => {
  it('BR-66: capacity stays a decimal string; grouping is dropped, nothing is rounded', () => {
    expect(parseCapacityInput(' 30,000.5 ')).toEqual({ value: '30000.5' });
    expect(parseCapacityInput('12,34,567')).toEqual({ value: '1234567' });
    expect(parseCapacityInput('1.2345')).toEqual({ errorKey: 'warehouseSettings.capacity.error.format' });
    expect(parseCapacityInput('0.000')).toEqual({ errorKey: 'warehouseSettings.capacity.error.zero' });
    expect(parseCapacityInput('-5')).toEqual({ errorKey: 'warehouseSettings.capacity.error.format' });
    expect(parseCapacityInput('')).toEqual({ errorKey: 'warehouseSettings.capacity.error.required' });
  });

  it('the stored capacity becomes the input without trailing zeros', () => {
    expect(capacityInputOf('30000.000')).toBe('30000');
    expect(capacityInputOf('12.500')).toBe('12.5');
    expect(capacityInputOf(null)).toBe('');
  });

  it('BR-80: the phone must be E.164; blank clears it', () => {
    expect(parsePhoneInput('+91 94421 80010')).toEqual({ value: '+919442180010' });
    expect(parsePhoneInput('  ')).toEqual({ value: null });
    expect(parsePhoneInput('94421 80010')).toEqual({ errorKey: 'warehouseSettings.phone.error.format' });
  });

  it('BR-80: the stored week round-trips; an unknown shape starts all-closed and unconfigured', () => {
    const stored = {
      mon: { closed: false, open: '09:00', close: '18:00' },
      tue: { closed: true },
      wed: { closed: true },
      thu: { closed: true },
      fri: { closed: true },
      sat: { closed: false, open: '09:00', close: '13:00' },
      sun: { closed: true },
    };
    const form = operatingHoursFormOf(stored);
    expect(form.configured).toBe(true);
    expect(operatingHoursBody(form.days)).toEqual({ value: stored });
    const unknown = operatingHoursFormOf({ mon: '9-6' });
    expect(unknown.configured).toBe(false);
    expect(unknown.days.every((d) => !d.isOpen)).toBe(true);
    expect(operatingHoursFormOf(null).configured).toBe(false);
  });

  it('BR-80: an open day needs HH:MM times with open before close (9:00 is padded)', () => {
    const days = operatingHoursFormOf(null).days.map((d) => (d.day === 'mon' ? { ...d, isOpen: true, open: '9:00', close: '17:30' } : d));
    const ok = operatingHoursBody(days);
    expect('value' in ok && ok.value.mon).toEqual({ closed: false, open: '09:00', close: '17:30' });
    const reversed = days.map((d) => (d.day === 'mon' ? { ...d, open: '18:00', close: '09:00' } : d));
    expect(operatingHoursBody(reversed)).toEqual({ errorKey: 'warehouseSettings.hours.error.order', day: 'mon' });
    const bad = days.map((d) => (d.day === 'mon' ? { ...d, open: '9am' } : d));
    expect(operatingHoursBody(bad)).toEqual({ errorKey: 'warehouseSettings.hours.error.format', day: 'mon' });
  });
});

describe('which warehouse (BR-30)', () => {
  const options = [{ warehouseId: WH }, { warehouseId: WH2 }];

  it('BR-30: a Sub scope is always its own warehouse, whatever was picked', () => {
    expect(pickWarehouseId({ warehouseId: WH2 }, options, WH)).toBe(WH2);
  });

  it('Main uses a real pick, else the first real warehouse; a sample code is never sent', () => {
    expect(pickWarehouseId({}, options, WH2)).toBe(WH2);
    expect(pickWarehouseId({}, options, 'WH-OOTY')).toBe(WH);
    expect(pickWarehouseId({}, [], 'WH-OOTY')).toBeUndefined();
  });
});
