/**
 * Shared types for the warehouse storage-ops screens (design module M4).
 * Part A: storage location detail / assignment, capacity
 * and (Main only) warehouse performance. Part B: operational issues, the
 * report-issue form, warehouse activity and the operations hub.
 *
 * One set of screens serves both warehouse roles. Every live endpoint takes
 * ONE warehouse uuid: a Sub scope always uses scope.warehouseId, the Main view
 * the warehouse picked in the header (StorageWarehouse.tsx). `can` (a
 * docs/rbac.json code check) only decides what to render; the server enforces
 * every action again (CLAUDE.md 2.1).
 *
 * Permissions:
 *   - Storage locations: read `inventory.batch.view` (SUB own); create / edit
 *     `warehouse.storage_location.manage` (SUB none).
 *   - Storage location assignment: `inventory.batch.assign` (MAIN all, SUB all).
 *   - Capacity: read `warehouse.own.view`; set `warehouse.capacity.set` (SUB none).
 *   - Performance: `warehouse.all.view` (SUB none).
 *   - Operational issues: `warehouse.issue.view` / `warehouse.issue.manage` (SUB own).
 *   - Activity feed: `warehouse.activity.view` (SUB own).
 */
import type { ActivityRow } from './mappers';

export type {
  PermissionCheck,
  WarehouseNavigate,
  WarehouseScope,
  WarehouseScreenBaseProps,
  WarehouseTab,
} from '../finance-expenses/types';
export type { StorageLocationItem, StorageType } from '../profile-settings/types';

/** Severity of an operational issue (absorbed Main Report Operational Issue form). */
export type IssueSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

/**
 * The Report an Issue form serves two paths: the Help & Support request
 * ('support') and a warehouse floor issue ('operational', which adds the
 * absorbed Main fields: warehouse, location / rack, issue category, severity).
 */
export type ReportIssueMode = 'support' | 'operational';

/**
 * Module that owns an activity's record; the detail screen links there
 * ("every transaction links to its owning module rather than duplicating the
 * record", absorbed Main Today's Operations).
 */
export type ActivityModule =
  | 'receiving'
  | 'storage'
  | 'verification'
  | 'operational_issue'
  | 'orders'
  | 'cash'
  | 'qc'
  | 'staff';

/** Activity log date preset: Today (the folded Today's Operations) or the full history. */
export type ActivityPreset = 'Today' | 'All';

/** Screens of the storage-ops flow (old App.tsx keys without the 'SubWarehouse' prefix). */
export type StorageRoute =
  | 'StorageLocationDetail'
  | 'StorageLocationAssignment'
  | 'Capacity'
  | 'Performance'
  | 'Operations'
  | 'Activity'
  | 'ActivityDetail'
  | 'OperationalIssues'
  | 'OperationalIssueDetail'
  | 'ReportIssue'
  | 'IssueSubmitted'
  | 'StorageLocations';

export interface StorageRouteParams {
  /** Warehouse Activity date preset (default 'All'; 'Today' = the old Today's Operations). */
  activityPreset?: ActivityPreset | undefined;
  /** Activity detail: legacy id param (there is no detail endpoint, so it opens nothing on its own). */
  activityId?: string | undefined;
  /** Activity detail: the feed row to show (BR-104 has no detail route). */
  activity?: ActivityRow | undefined;
  /** Operational issue detail. */
  issueId?: string | undefined;
  /** Report an Issue / Request Submitted path (default 'support'). */
  reportMode?: ReportIssueMode | undefined;
  /** Report an Issue: preselected support category. */
  issueCategory?: string | undefined;
  /** Request Submitted: the id the form returned (an operational issue's number). */
  submittedId?: string | undefined;
  locationId?: string | undefined;
  /** Storage Location Assignment: the batch being put away. */
  batchId?: string | undefined;
  productName?: string | undefined;
  quantity?: string | undefined;
  /**
   * Main view: the warehouse uuid to open on (a non-uuid such as an old
   * fixture id is ignored). A Sub scope always uses its own.
   */
  warehouseId?: string | undefined;
}
