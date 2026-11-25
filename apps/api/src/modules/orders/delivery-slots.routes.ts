import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../../db/pool.js';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import { warehouseVisible } from '../../rbac/warehouseScope.js';
import { deliverySlots } from './orders.schema.js';

export const deliverySlotsQuerySchema = z.object({
  warehouseId: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const adminDeliverySlotsRouter: Router = Router();

adminDeliverySlotsRouter.use(requireAuth);
adminDeliverySlotsRouter.use(requirePermission('order.list.view_all'));

adminDeliverySlotsRouter.get(
  '/',
  validate({ query: deliverySlotsQuerySchema }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const query = getValidated(req, 'query', deliverySlotsQuerySchema);

    // Cross-scope reads return empty array, not data
    if (query.warehouseId && !warehouseVisible(scope, query.warehouseId)) {
      return res.status(200).json([]);
    }

    const capacityMap = new Map<string, { capacityOrders: number; bookedOrders: number; isActive: boolean }>();

    if (query.warehouseId && query.date) {
      const rows = await pool.query<{
        slot: string;
        capacity_orders: number;
        booked_orders: number;
        is_active: boolean;
      }>(
        `SELECT slot::text, capacity_orders, booked_orders, is_active
           FROM delivery_slots
          WHERE warehouse_id = $1 AND slot_date = $2`,
        [query.warehouseId, query.date],
      );
      for (const row of rows.rows) {
        capacityMap.set(row.slot, {
          capacityOrders: row.capacity_orders,
          bookedOrders: row.booked_orders,
          isActive: row.is_active,
        });
      }
    }

    const result = deliverySlots.map((slot) => {
      const cap = capacityMap.get(slot);
      const capacityOrders = cap ? cap.capacityOrders : 0;
      const bookedOrders = cap ? cap.bookedOrders : 0;
      const availableOrders = Math.max(0, capacityOrders - bookedOrders);
      const isActive = cap ? cap.isActive : true;

      return {
        slot,
        capacityOrders,
        bookedOrders,
        availableOrders,
        isActive,
      };
    });

    res.status(200).json(result);
  }),
);
