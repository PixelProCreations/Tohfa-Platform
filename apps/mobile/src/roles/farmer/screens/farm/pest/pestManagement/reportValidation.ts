/** Rules for the Report Detection modal (docs/openapi.yaml PestDetectionCreate: pestName 1..120, notes <= 2000). */
import { maxLength, required, type FieldRules } from '../../../../utils/validation';

export type ReportDetectionField = 'pestType' | 'notes';

export const REPORT_DETECTION_FIELD_ORDER: readonly ReportDetectionField[] = ['pestType', 'notes'];

export const REPORT_DETECTION_RULES: FieldRules<ReportDetectionField> = {
  pestType: [required(), maxLength(120)],
  notes: [maxLength(2000)],
};
