/**
 * Unit tests for tasks mappers (BR-77, BR-78).
 */
import { describe, expect, it } from 'vitest';
import type { TaskItemDto, TaskSummaryDto } from '../api/tasks';
import {
  formatTaskDetails,
  formatTaskDue,
  formatTaskTitle,
  mapTaskBadgeLabel,
  mapTaskDestination,
  summarizeTaskCounts,
} from '../screens/warehouse/dashboard-home-more/mappers_tasks';

const SAMPLE_TASK: TaskItemDto = {
  itemKey: 'goods_receipt_qc:7f0c6a53-9d1e-4f6e-8a55-1f6b2d0f5a11',
  type: 'GOODS_RECEIPT_QC',
  titleKey: 'task.goods_receipt_qc.title',
  refType: 'GOODS_RECEIPT',
  refId: '7f0c6a53-9d1e-4f6e-8a55-1f6b2d0f5a11',
  warehouseId: '11111111-1111-4111-8111-111111111111',
  createdAt: '2026-10-13T10:00:00Z',
  dueOn: '2026-10-14',
  params: { grnNumber: 'GR-1024', grossQtyKg: '95.000' },
  state: 'OPEN',
};

describe('mappers_tasks.ts (BR-77, BR-78)', () => {
  describe('mapTaskDestination (BR-77)', () => {
    it('maps GOODS_RECEIPT_QC to receiving module with refId', () => {
      const dest = mapTaskDestination(SAMPLE_TASK);
      expect(dest.module).toBe('receiving');
      expect(dest.refId).toBe('7f0c6a53-9d1e-4f6e-8a55-1f6b2d0f5a11');
    });

    it('maps RETURN_* tasks to returns module with refId', () => {
      const returnTask: TaskItemDto = { ...SAMPLE_TASK, type: 'RETURN_INSPECTION', refType: 'RETURN_REQUEST' };
      const dest = mapTaskDestination(returnTask);
      expect(dest.module).toBe('returns');
      expect(dest.refId).toBe(SAMPLE_TASK.refId);
    });

    it('maps ORDER_* tasks to orders module with refId', () => {
      const orderTask: TaskItemDto = { ...SAMPLE_TASK, type: 'ORDER_PACK', refType: 'ORDER' };
      const dest = mapTaskDestination(orderTask);
      expect(dest.module).toBe('orders');
      expect(dest.refId).toBe(SAMPLE_TASK.refId);
    });
  });

  describe('mapTaskBadgeLabel (BR-77)', () => {
    it('returns human-readable badge labels for all task types', () => {
      expect(mapTaskBadgeLabel('GOODS_RECEIPT_QC')).toBe('QC Pending');
      expect(mapTaskBadgeLabel('ORDER_PACK')).toBe('Packing');
      expect(mapTaskBadgeLabel('ORDER_DISPATCH')).toBe('Dispatch');
      expect(mapTaskBadgeLabel('ORDER_PICKUP_OTP')).toBe('Pickup OTP');
      expect(mapTaskBadgeLabel('RETURN_INSPECTION')).toBe('Return Inspection');
      expect(mapTaskBadgeLabel('RETURN_APPROVAL')).toBe('Return Approval');
    });
  });

  describe('formatTaskDue (BR-77)', () => {
    it('echoes due date when present, never invents one when null', () => {
      expect(formatTaskDue('2026-10-14')).toBe('Due 14 Oct');
      expect(formatTaskDue(null)).toBeNull();
    });
  });

  describe('summarizeTaskCounts (BR-77)', () => {
    it('aggregates category counts from open tasks summary without drift', () => {
      const summary: TaskSummaryDto = {
        open: 11,
        byType: {
          ORDER_PACK: 3,
          ORDER_DISPATCH: 2,
          ORDER_PICKUP_OTP: 1,
          GOODS_RECEIPT_QC: 3,
          RETURN_INSPECTION: 1,
          RETURN_APPROVAL: 1,
        },
      };
      const counts = summarizeTaskCounts(summary);
      expect(counts.ordersActionable).toBe(6);
      expect(counts.readyForPickup).toBe(1);
      expect(counts.qcPending).toBe(3);
      expect(counts.returnsPending).toBe(2);
    });
  });

  describe('formatTaskTitle and formatTaskDetails (BR-77)', () => {
    it('formats title with badge and ref code', () => {
      expect(formatTaskTitle(SAMPLE_TASK)).toBe('QC Pending · GR-1024');
      const orderTask: TaskItemDto = {
        ...SAMPLE_TASK,
        type: 'ORDER_PACK',
        params: { orderNumber: 'ORD-501', produce: 'Tomato', grossQtyKg: '20.000' },
      };
      expect(formatTaskTitle(orderTask)).toBe('Packing · ORD-501');
      expect(formatTaskDetails(orderTask)).toBe('Tomato · 20.000 KG');
    });

    it('returns null details when no parameters provide details', () => {
      const bareTask: TaskItemDto = { ...SAMPLE_TASK, params: {} };
      expect(formatTaskTitle(bareTask)).toBe('QC Pending');
      expect(formatTaskDetails(bareTask)).toBeNull();
    });
  });
});


