/**
 * UI-only, in-memory record of audits whose inspection was submitted in this session (step 12).
 * Nothing persists: a reload forgets it. Replace with the audit record's section progress when the
 * overview is integrated with the API.
 */
import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuditCompletionService {
  private readonly ids = signal<ReadonlySet<string>>(new Set());

  isCompleted(auditId: string): boolean {
    return this.ids().has(auditId);
  }

  markCompleted(auditId: string): void {
    this.ids.update((s) => new Set(s).add(auditId));
  }
}
