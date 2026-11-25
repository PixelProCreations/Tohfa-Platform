/**
 * Communities routes (Antigravity Brief 01 / BR-59s).
 * Mounted under /v1/admin/communities.
 * Guarded by community.group.moderate (SUPER_ADMIN, TOHFA_ADMIN, FARMER_ADMIN: all).
 */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import {
  communityGroupsQuery,
  communityIdParams,
  communityMembersQuery,
  createCommunityBody,
  listCommunitiesQuery,
  updateCommunityBody,
} from './communities.schema.js';
import { communitiesService } from './communities.service.js';

export const adminCommunitiesRouter: Router = Router();

// GET /v1/admin/communities
adminCommunitiesRouter.get(
  '/',
  requireAuth,
  requirePermission('community.group.moderate'),
  validate({ query: listCommunitiesQuery }),
  asyncHandler(async (req, res) => {
    const query = getValidated(req, 'query', listCommunitiesQuery);
    res.json(await communitiesService.listCommunities(query));
  }),
);

// POST /v1/admin/communities
adminCommunitiesRouter.post(
  '/',
  requireAuth,
  requirePermission('community.group.moderate'),
  validate({ body: createCommunityBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const body = getValidated(req, 'body', createCommunityBody);
    const created = await communitiesService.createCommunity(scope, body);
    res.status(201).json(created);
  }),
);

// GET /v1/admin/communities/:id
adminCommunitiesRouter.get(
  '/:id',
  requireAuth,
  requirePermission('community.group.moderate'),
  validate({ params: communityIdParams }),
  asyncHandler(async (req, res) => {
    const { id } = getValidated(req, 'params', communityIdParams);
    res.json(await communitiesService.getCommunity(id));
  }),
);

// PATCH /v1/admin/communities/:id
adminCommunitiesRouter.patch(
  '/:id',
  requireAuth,
  requirePermission('community.group.moderate'),
  validate({ params: communityIdParams, body: updateCommunityBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', communityIdParams);
    const patch = getValidated(req, 'body', updateCommunityBody);
    res.json(await communitiesService.updateCommunity(scope, id, patch));
  }),
);

// POST /v1/admin/communities/:id/archive
adminCommunitiesRouter.post(
  '/:id/archive',
  requireAuth,
  requirePermission('community.group.moderate'),
  validate({ params: communityIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', communityIdParams);
    res.json(await communitiesService.archiveCommunity(scope, id));
  }),
);

// GET /v1/admin/communities/:id/groups
adminCommunitiesRouter.get(
  '/:id/groups',
  requireAuth,
  requirePermission('community.group.moderate'),
  validate({ params: communityIdParams, query: communityGroupsQuery }),
  asyncHandler(async (req, res) => {
    const { id } = getValidated(req, 'params', communityIdParams);
    const query = getValidated(req, 'query', communityGroupsQuery);
    res.json(await communitiesService.listCommunityGroups(id, query));
  }),
);

// GET /v1/admin/communities/:id/members
adminCommunitiesRouter.get(
  '/:id/members',
  requireAuth,
  requirePermission('community.group.moderate'),
  validate({ params: communityIdParams, query: communityMembersQuery }),
  asyncHandler(async (req, res) => {
    const { id } = getValidated(req, 'params', communityIdParams);
    const query = getValidated(req, 'query', communityMembersQuery);
    res.json(await communitiesService.listCommunityMembers(id, query));
  }),
);
