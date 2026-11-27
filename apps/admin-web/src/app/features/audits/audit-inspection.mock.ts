/**
 * UI-only placeholder data — replace with API when this screen is integrated.
 *
 * Section state for the Audit Inspection overview (designs 78 and 93), chosen per audit. The
 * overview's "completed" variant (design 93) is not a mode switch: it is what the screen renders when
 * every section's status is COMPLETED. This file decides which audits have that data:
 *
 * - An audit whose status (from `mockAuditById`, audit.mock.ts) is COMPLETED gets all 12 sections
 *   COMPLETED with no required fields left — e.g. AUD-2026-0049 and AUD-2026-0059 (design 75 rows).
 * - Every other audit gets the design 78 sections (all Not Started).
 *
 * When integrated, section progress comes from the audit record (`GET /admin/audits/{id}`) rather than
 * from the audit status — see docs/openapi.yaml.
 */
import { mockAuditById, mockInspectionSections } from './audit.mock';
import type { AuditInspectionSection } from './audit.types';

/** Fresh copies of the inspection sections for an audit (callers may hold them as local state). */
export function mockInspectionSectionsForAudit(
  auditId: string,
  submittedThisSession = false,
): AuditInspectionSection[] {
  const sections = mockInspectionSections();
  if (!submittedThisSession && mockAuditById(auditId).status !== 'COMPLETED') return sections;
  return sections.map((s) => ({ ...s, status: 'COMPLETED', requiredFieldsLeft: 0 }));
}
