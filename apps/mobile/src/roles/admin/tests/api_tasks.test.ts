/**
 * roles/admin/api/tasks.ts: the tasks API (docs/openapi.yaml tag Platform):
 *   GET /admin/tasks                task.own.view (BR-77)
 *   GET /admin/tasks/summary        task.own.view (BR-77)
 *   POST /admin/tasks/{itemKey}/done task.own.view (BR-78)
 *
 * Shell client is mocked (same pattern as api_reports.test.ts and api_finance.test.ts).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as ClientModule from '../../../shell/api/client';

vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return {
    ...actual,
    request: vi.fn(async () => ({ items: [], page: { hasMore: false }, open: 0, byType: {} })),
  };
});

import { request } from '../../../shell/api/client';
import {
  ERROR_CODES,
  getTaskSummary,
  listTasks,
  markTaskDone,
  type TaskType,
} from '../api/tasks';
import { hasKey } from '../i18n';

const requestMock = vi.mocked(request);

const OWN_WAREHOUSE = '11111111-1111-4111-8111-111111111111';

describe('roles/admin/api/tasks.ts (HTTP contract, BR-77, BR-78)', () => {
  beforeEach(() => {
    requestMock.mockReset();
    requestMock.mockResolvedValue({ items: [], page: { hasMore: false }, open: 0, byType: {} });
  });

  describe('GET /admin/tasks/summary (BR-77)', () => {
    it('sends GET /admin/tasks/summary with warehouseId', async () => {
      await getTaskSummary({ warehouseId: OWN_WAREHOUSE });
      expect(requestMock).toHaveBeenCalledTimes(1);
      const [path, init] = requestMock.mock.calls[0]!;
      expect(path).toContain('/admin/tasks/summary');
      expect(path).toContain(`warehouseId=${OWN_WAREHOUSE}`);
      expect(init?.method).toBe('GET');
    });
  });

  describe('GET /admin/tasks (BR-77)', () => {
    it('sends GET /admin/tasks with query params', async () => {
      await listTasks({
        type: 'ORDER_PACK',
        warehouseId: OWN_WAREHOUSE,
        state: 'open',
        cursor: 'cur-123',
        limit: 20,
      });
      expect(requestMock).toHaveBeenCalledTimes(1);
      const [path, init] = requestMock.mock.calls[0]!;
      expect(path).toContain('/admin/tasks');
      expect(path).toContain('type=ORDER_PACK');
      expect(path).toContain(`warehouseId=${OWN_WAREHOUSE}`);
      expect(path).toContain('state=open');
      expect(path).toContain('cursor=cur-123');
      expect(path).toContain('limit=20');
      expect(init?.method).toBe('GET');
    });
  });

  describe('POST /admin/tasks/{itemKey}/done (BR-78)', () => {
    it('sends POST /admin/tasks/{itemKey}/done with Idempotency-Key header', async () => {
      const itemKey = 'order_pack:6f0c6a53-9d1e-4f6e-8a55-1f6b2d0f5a11';
      const idempotencyKey = 'idem-task-done-123';
      await markTaskDone(itemKey, idempotencyKey);
      expect(requestMock).toHaveBeenCalledTimes(1);
      const [path, init] = requestMock.mock.calls[0]!;
      expect(path).toBe(`/admin/tasks/${encodeURIComponent(itemKey)}/done`);
      expect(init?.method).toBe('POST');
      expect(init?.idempotencyKey).toBe(idempotencyKey);
    });
  });

  describe('ERROR_CODES (i18n completeness, BR-77)', () => {
    it('every declared ERROR_CODE exists in roles/admin/i18n error dictionary', () => {
      for (const code of ERROR_CODES) {
        expect(hasKey(`admin.error.${code}`)).toBe(true);
      }
    });
  });
});
