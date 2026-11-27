/**
 * Audit inspection step 10 — Schedule Upcoming Audit (design 88). UI ONLY.
 *
 * Route: AUDIT_ROUTES.step(id, 10). The form lives in AuditStepAuditReportFormComponent (shared with
 * step 11); see that file for behaviour. Save (when valid) navigates to step 11, Add External Audit.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AuditStepAuditReportFormComponent } from './audit-step-10-audit-report-form.component';

@Component({
  selector: 'tohfa-audit-step-10-schedule',
  standalone: true,
  imports: [AuditStepAuditReportFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: block; }'],
  template: `<tohfa-audit-step-audit-report-form auditType="INTERNAL" />`,
})
export class AuditStep10ScheduleComponent {}
