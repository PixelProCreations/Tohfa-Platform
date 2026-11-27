/**
 * Audit inspection step 11 — Add External Audit (design 89). UI ONLY.
 *
 * Route: AUDIT_ROUTES.step(id, 11). The form lives in AuditStepAuditReportFormComponent (shared with
 * step 10); see that file for behaviour. Only the title, pill, information-card heading and the card
 * layout differ from step 10.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AuditStepAuditReportFormComponent } from './audit-step-10-audit-report-form.component';

@Component({
  selector: 'tohfa-audit-step-11-external',
  standalone: true,
  imports: [AuditStepAuditReportFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: block; }'],
  template: `<tohfa-audit-step-audit-report-form auditType="EXTERNAL" />`,
})
export class AuditStep11ExternalComponent {}
