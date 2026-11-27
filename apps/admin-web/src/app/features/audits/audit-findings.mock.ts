/**
 * UI-only placeholder data for Audit Inspection & Findings (design 77) — replace with API when this
 * screen is integrated.
 *
 * Shapes follow docs/openapi.yaml `AuditDetail`:
 * - `categoryScores`: always 10 `AuditCategoryScore` rows in `rating_categories` order;
 *   `score` is null for a category not yet scored ("incomplete, not zero" — BR-06), max 10 each.
 * - `findings`: `AuditFinding` rows (severity MAJOR | MINOR | OBSERVATION, optional categoryCode,
 *   correctiveAction, dueDate). Counts on screen mirror `AuditFindingCounts` (computed at read time).
 * - Evidence per category is design-only: the API has no per-category evidence (only the audit's
 *   optional `reportUpload`) — a specification gap. `evidenceCount` is therefore a placeholder.
 * - Total = direct sum of the 10 scores (0–100, BR-04 / BR-06); the tier is resolved only after the
 *   audit is COMPLETED (`AuditTier` is null until then) from rating_tier_config (BR-04a / BR-04b).
 *
 * Design 77 (AUD-2026-0034, Scheduled) shows every category "Not scored", no evidence and no findings;
 * every audit id gets that state here, because no design shows a scored findings sheet.
 */
import { AUDIT_RATING_CATEGORIES } from './audit.mock';
import type { AuditFindingSeverity, AuditRatingCategoryCode } from './audit.types';

export interface AuditCategoryScoreRow {
  readonly categoryCode: AuditRatingCategoryCode;
  /** null = not scored yet (BR-06), never 0. */
  readonly score: number | null;
  readonly maxScore: number;
  readonly remarks: string | null;
  /** Design-only (see header). */
  readonly evidenceCount: number;
}

export interface AuditFindingRow {
  readonly id: string;
  readonly severity: AuditFindingSeverity;
  readonly categoryCode: AuditRatingCategoryCode | null;
  readonly description: string;
  readonly correctiveAction: string | null;
  /** YYYY-MM-DD or null. */
  readonly dueDate: string | null;
}

export interface AuditFindingsSheet {
  readonly auditId: string;
  readonly categoryScores: readonly AuditCategoryScoreRow[];
  readonly findings: readonly AuditFindingRow[];
}

/** The score sheet and findings for an audit id (fresh copy; design 77 state for every id). */
export function mockAuditFindingsSheet(auditId: string): AuditFindingsSheet {
  return {
    auditId,
    categoryScores: AUDIT_RATING_CATEGORIES.map((c) => ({
      categoryCode: c.code,
      score: null,
      maxScore: c.maxScore,
      remarks: null,
      evidenceCount: 0,
    })),
    findings: [],
  };
}
