/**
 * Module 14 (Warehouse Staff and Attendance). Wiring only: requireAuth -> requirePermission ->
 * validate -> handler.
 *
 * Two routers, mounted by app.ts:
 *  - `adminWarehouseStaffRouter`   at /v1/admin/warehouse-staff
 *  - `adminStaffAttendanceRouter`  at /v1/admin/staff-attendance
 *
 * Permission codes must exist in docs/rbac.json; requirePermission throws at import time on a typo.
 * Reads of the roster use the existing admin.staff.list_view (Sub = none); the write and the
 * attendance codes are documented spec gaps (admin.staff.manage, admin.staff.attendance.*).
 * Every route here returns or needs staff names, so a Sub Warehouse Admin, who cannot list staff
 * (owner decision 2026-10-11), holds none of these codes and gets 403 on all of them. The grants
 * in docs/rbac.json are the single source of truth: no role check lives in the service.
 */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import {
  attendanceDateParams,
  attendanceSummaryQuery,
  bulkAttendanceBody,
  createStaffBody,
  listAttendanceQuery,
  listStaffQuery,
  markAttendanceBody,
  rollCallQuery,
  staffDayParams,
  staffIdParams,
  updateStaffBody,
} from './warehouse-staff.schema.js';
import { warehouseStaffService } from './warehouse-staff.service.js';

export const adminWarehouseStaffRouter: Router = Router();
export const adminStaffAttendanceRouter: Router = Router();

// POST /v1/admin/warehouse-staff
adminWarehouseStaffRouter.post(
  '/',
  requireAuth,
  requirePermission('admin.staff.manage'),
  validate({ body: createStaffBody }),
  asyncHandler(async (req, res) => {
    const body = getValidated(req, 'body', createStaffBody);
    res.status(201).json(await warehouseStaffService.createStaff(requireScope(req.scope), body));
  }),
);

// GET /v1/admin/warehouse-staff
adminWarehouseStaffRouter.get(
  '/',
  requireAuth,
  requirePermission('admin.staff.list_view'),
  validate({ query: listStaffQuery }),
  asyncHandler(async (req, res) => {
    const query = getValidated(req, 'query', listStaffQuery);
    res.json(await warehouseStaffService.listStaff(requireScope(req.scope), query));
  }),
);

// GET /v1/admin/warehouse-staff/:id
adminWarehouseStaffRouter.get(
  '/:id',
  requireAuth,
  requirePermission('admin.staff.list_view'),
  validate({ params: staffIdParams }),
  asyncHandler(async (req, res) => {
    const { id } = getValidated(req, 'params', staffIdParams);
    res.json(await warehouseStaffService.getStaff(requireScope(req.scope), id));
  }),
);

// PATCH /v1/admin/warehouse-staff/:id
adminWarehouseStaffRouter.patch(
  '/:id',
  requireAuth,
  requirePermission('admin.staff.manage'),
  validate({ params: staffIdParams, body: updateStaffBody }),
  asyncHandler(async (req, res) => {
    const { id } = getValidated(req, 'params', staffIdParams);
    const body = getValidated(req, 'body', updateStaffBody);
    res.json(await warehouseStaffService.updateStaff(requireScope(req.scope), id, body));
  }),
);

// POST /v1/admin/warehouse-staff/:id/deactivate
adminWarehouseStaffRouter.post(
  '/:id/deactivate',
  requireAuth,
  requirePermission('admin.staff.manage'),
  validate({ params: staffIdParams }),
  asyncHandler(async (req, res) => {
    const { id } = getValidated(req, 'params', staffIdParams);
    res.json(await warehouseStaffService.deactivateStaff(requireScope(req.scope), id));
  }),
);

// GET /v1/admin/staff-attendance/roll-call
adminStaffAttendanceRouter.get(
  '/roll-call',
  requireAuth,
  requirePermission('admin.staff.attendance.view'),
  validate({ query: rollCallQuery }),
  asyncHandler(async (req, res) => {
    const query = getValidated(req, 'query', rollCallQuery);
    res.json(await warehouseStaffService.rollCall(requireScope(req.scope), query));
  }),
);

// GET /v1/admin/staff-attendance/summary
adminStaffAttendanceRouter.get(
  '/summary',
  requireAuth,
  requirePermission('admin.staff.attendance.view'),
  validate({ query: attendanceSummaryQuery }),
  asyncHandler(async (req, res) => {
    const query = getValidated(req, 'query', attendanceSummaryQuery);
    res.json(await warehouseStaffService.attendanceSummary(requireScope(req.scope), query));
  }),
);

// GET /v1/admin/staff-attendance
adminStaffAttendanceRouter.get(
  '/',
  requireAuth,
  requirePermission('admin.staff.attendance.view'),
  validate({ query: listAttendanceQuery }),
  asyncHandler(async (req, res) => {
    const query = getValidated(req, 'query', listAttendanceQuery);
    res.json(await warehouseStaffService.listAttendance(requireScope(req.scope), query));
  }),
);

// PUT /v1/admin/staff-attendance/dates/:date  (bulk mark for one day)
adminStaffAttendanceRouter.put(
  '/dates/:date',
  requireAuth,
  requirePermission('admin.staff.attendance.mark'),
  validate({ params: attendanceDateParams, body: bulkAttendanceBody }),
  asyncHandler(async (req, res) => {
    const { date } = getValidated(req, 'params', attendanceDateParams);
    const body = getValidated(req, 'body', bulkAttendanceBody);
    res.json(await warehouseStaffService.markAttendanceBulk(requireScope(req.scope), date, body));
  }),
);

// PUT /v1/admin/staff-attendance/staff/:staffId/:date  (mark one staff member for one day)
adminStaffAttendanceRouter.put(
  '/staff/:staffId/:date',
  requireAuth,
  requirePermission('admin.staff.attendance.mark'),
  validate({ params: staffDayParams, body: markAttendanceBody }),
  asyncHandler(async (req, res) => {
    const { staffId, date } = getValidated(req, 'params', staffDayParams);
    const body = getValidated(req, 'body', markAttendanceBody);
    const { attendance, created } = await warehouseStaffService.markAttendance(requireScope(req.scope), staffId, date, body);
    res.status(created ? 201 : 200).json(attendance);
  }),
);

// GET /v1/admin/staff-attendance/staff/:staffId/:date/history
adminStaffAttendanceRouter.get(
  '/staff/:staffId/:date/history',
  requireAuth,
  requirePermission('admin.staff.attendance.view'),
  validate({ params: staffDayParams }),
  asyncHandler(async (req, res) => {
    const { staffId, date } = getValidated(req, 'params', staffDayParams);
    res.json(await warehouseStaffService.attendanceHistory(requireScope(req.scope), staffId, date));
  }),
);
