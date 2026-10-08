import { Router } from 'express';
import { requireActor, requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { requirePermission } from '../../rbac/requirePermission.js';
import { farmerDocumentsService } from './farmer-documents.service.js';

export const farmerDocumentsRouter: Router = Router();

farmerDocumentsRouter.get(
  '/',
  requireAuth,
  requirePermission('farmer.documents.view_own'),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const result = await farmerDocumentsService.getMyDocuments(actor);
    res.status(200).json(result);
  }),
);
