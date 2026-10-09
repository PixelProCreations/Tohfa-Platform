/**
 * Shared types for the Main Warehouse returns (RMA) screens.
 *
 * The "Inspection Saved" and "Return Approved" confirmation screens used to be
 * two copy-paste files (MainWarehouseInspectionSavedScreen /
 * MainWarehouseReturnApprovedScreen) differing only in title, message and CTA.
 * One ReturnResultScreen now takes a `variant` prop.
 */

/** Which RMA step just completed. */
export type ReturnResultVariant = 'INSPECTION_SAVED' | 'RETURN_APPROVED';
