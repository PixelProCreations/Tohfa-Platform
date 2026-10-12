/**
 * Routers of the warehouse-ops modules, as mounted by app.ts.
 *
 *  - `warehouseOpsRouter`  at /v1/warehouses: storage locations (BR-79), profile edit (BR-80) and
 *                          performance (BR-80). app.ts mounts the existing warehousesRouter first; none of
 *                          these paths collides with its `/:id`, `/:id/capacity` routes except the new
 *                          `PATCH /:id`, which the existing router does not define.
 *  - `subAdminsRouter`     at /v1/admin/sub-warehouse-admins (BR-81).
 */
import { Router } from 'express';
import { storageLocationsRouter } from './storage-locations.routes.js';
import { warehousePerformanceRouter } from './warehouse-performance.routes.js';
import { warehouseProfileRouter } from './warehouse-profile.routes.js';

export const warehouseOpsRouter: Router = Router();
warehouseOpsRouter.use(storageLocationsRouter);
warehouseOpsRouter.use(warehouseProfileRouter);
warehouseOpsRouter.use(warehousePerformanceRouter);

/** BR-81, mounted at /v1/admin/sub-warehouse-admins. */
export { subAdminsRouter } from './sub-admins.routes.js';
