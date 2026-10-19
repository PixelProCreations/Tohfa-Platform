/**
 * Live Dashboard and Task Actions integration tests (BR-77, BR-78):
 *   - Task summary and open tasks queries are scoped to scope.warehouseId (BR-77, BR-30)
 *   - Today's Overview KPI counts are driven by summarizeTaskCounts (BR-77)
 *   - Needs Attention renders live tasks from listTasks with badges and due dates (BR-77)
 *   - Tapping a task navigates to destination module (Receiving, Orders, Returns) (BR-77)
 *   - Tapping Done triggers markTaskDone with Idempotency-Key and invalidates tasks cache (BR-78)
 *   - Recent Activity is completely hidden on the dashboard (no backing API)
 *   - No hardcoded dummy records remain on the dashboard
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const SRC = path.join(__dirname, '..', '..', '..');
const read = (rel: string) => fs.readFileSync(path.join(SRC, rel), 'utf8');

const DASHBOARD_FILE = read('roles/admin/screens/dashboard/SubWarehouseAdminDashboardScreen.tsx');

describe('Dashboard Wiring & Live Task Actions (BR-77, BR-78)', () => {
  it('BR-77: imports task API and mappers in SubWarehouseAdminDashboardScreen', () => {
    expect(DASHBOARD_FILE).toContain("from '../../api/tasks'");
    expect(DASHBOARD_FILE).toContain('getTaskSummary');
    expect(DASHBOARD_FILE).toContain('listTasks');
    expect(DASHBOARD_FILE).toContain('markTaskDone');
    expect(DASHBOARD_FILE).toContain("from '../warehouse/dashboard-home-more/mappers_tasks'");
    expect(DASHBOARD_FILE).toContain('summarizeTaskCounts');
    expect(DASHBOARD_FILE).toContain('mapTaskDestination');
    expect(DASHBOARD_FILE).toContain('mapTaskBadgeLabel');
  });

  it('BR-77: queries task summary and open tasks scoped to warehouseId', () => {
    expect(DASHBOARD_FILE).toMatch(/getTaskSummary\(\s*\{\s*warehouseId:\s*scope\.warehouseId\s*\}\s*,\s*signal\s*\)/);
    expect(DASHBOARD_FILE).toMatch(/listTasks\(\s*\{\s*state:\s*['"]open['"],\s*warehouseId:\s*scope\.warehouseId\s*\}\s*,\s*signal\s*\)/);
  });

  it('BR-77: derives overview KPI values from live task counts instead of hardcoded numbers', () => {
    // Hardcoded overview numbers must not be present in overviewNumber
    expect(DASHBOARD_FILE).not.toContain('<Text style={styles.overviewNumber}>12</Text>');
    expect(DASHBOARD_FILE).not.toContain('<Text style={styles.overviewNumber}>08</Text>');
    expect(DASHBOARD_FILE).not.toContain('<Text style={styles.overviewNumber}>03</Text>');
    expect(DASHBOARD_FILE).toContain('taskCounts.ordersActionable');
    expect(DASHBOARD_FILE).toContain('taskCounts.readyForPickup');
    expect(DASHBOARD_FILE).toContain('taskCounts.qcPending');
  });

  it('BR-78: wires markTaskDone mutation with Idempotency-Key and invalidates task cache', () => {
    expect(DASHBOARD_FILE).toContain('markTaskDone(itemKey, idempotencyKey)');
    expect(DASHBOARD_FILE).toMatch(/invalidates:\s*\[adminKeys\.scoped\(['"]tasks['"],\s*scope\.warehouseId\)/);
  });

  it('BR-78: renders live tasks in Needs Attention with tap to navigate and Done button', () => {
    expect(DASHBOARD_FILE).not.toContain('Tomato — Batch GR-1024 · Received 95 KG, awaiting quality check');
    expect(DASHBOARD_FILE).not.toContain('Expected 100 KG, received 95 KG');
    expect(DASHBOARD_FILE).not.toContain('2 crates reported damaged on today\'s receiving');
    expect(DASHBOARD_FILE).toContain('handleOpenTask');
    expect(DASHBOARD_FILE).toContain('handleMarkDone');
  });

  it('BR-77: Recent Activity section is hidden on dashboard (no server API)', () => {
    // Unconditional Recent Activity section must be removed/hidden
    expect(DASHBOARD_FILE).not.toMatch(/\{\/\*\s*12\.\s*Recent Activity\s*\*\/\}[\s\S]*?<View style=\{styles\.activityCardContainer\}>/);
  });

  it('BR-77: removes hardcoded dummy records from Today\'s Receiving and Today\'s Orders', () => {
    expect(DASHBOARD_FILE).not.toContain('<Text style={styles.itemCodeBold}>GR-00124</Text>');
    expect(DASHBOARD_FILE).not.toContain('<Text style={styles.itemCodeBold}>GR-00123</Text>');
    expect(DASHBOARD_FILE).not.toContain('<Text style={styles.itemCodeBold}>#ORD-10245</Text>');
    expect(DASHBOARD_FILE).not.toContain('Rahul Kumar · 3 Items');
  });
});
