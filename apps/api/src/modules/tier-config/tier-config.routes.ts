/**
 * Tier threshold configuration (BR-04, BR-111). Wiring only:
 * requireAuth -> requirePermission -> validate -> handler.
 *
 * Mounted by app.ts at /v1/admin. Both routes write the same store (`rating_tier_config`): BR-04
 * gives farm ratings and audits one scale. They differ only in their permission code, which the
 * service also records as the audit row's action code.
 */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import { tierBandsBody } from './tier-config.schema.js';
import { tierConfigService } from './tier-config.service.js';

export const tierConfigRouter: Router = Router();

for (const [path, permission] of [
  ['/rating-tiers', 'farmer.rating.configure_tiers'],
  ['/audit-tier-thresholds', 'audit.tier.configure_thresholds'],
] as const) {
  tierConfigRouter.patch(
    path,
    requireAuth,
    requirePermission(permission),
    validate({ body: tierBandsBody }),
    asyncHandler(async (req, res) => {
      const scope = requireScope(req.scope);
      res.json(await tierConfigService.replaceTiers(scope, getValidated(req, 'body', tierBandsBody)));
    }),
  );
}
