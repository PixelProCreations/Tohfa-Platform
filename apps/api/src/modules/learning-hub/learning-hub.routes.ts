import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import {
  createArticleBody,
  createGroupBody,
  createTrainingBody,
  createVideoBody,
  learningIdParams,
  listArticlesQuery,
  listGroupsQuery,
  listTrainingsQuery,
  listVideosQuery,
  updateArticleBody,
  updateGroupBody,
  updateTrainingBody,
  updateVideoBody,
} from './learning-hub.schema.js';
import { learningHubService } from './learning-hub.service.js';

// ── Farmer Routes (Mounted under /v1/farmers/me) ─────────────────────────────
export const farmerLearningRouter: Router = Router();

// GET /v1/farmers/me/learning/articles
farmerLearningRouter.get(
  '/learning/articles',
  requireAuth,
  requirePermission('farmer.learning.view'),
  validate({ query: listArticlesQuery }),
  asyncHandler(async (req, res) => {
    const query = getValidated(req, 'query', listArticlesQuery);
    res.json(await learningHubService.listArticles(query));
  }),
);

// GET /v1/farmers/me/learning/articles/:id
farmerLearningRouter.get(
  '/learning/articles/:id',
  requireAuth,
  requirePermission('farmer.learning.view'),
  validate({ params: learningIdParams }),
  asyncHandler(async (req, res) => {
    const { id } = getValidated(req, 'params', learningIdParams);
    res.json(await learningHubService.getArticle(id));
  }),
);

// GET /v1/farmers/me/learning/videos
farmerLearningRouter.get(
  '/learning/videos',
  requireAuth,
  requirePermission('farmer.learning.view'),
  validate({ query: listVideosQuery }),
  asyncHandler(async (req, res) => {
    const query = getValidated(req, 'query', listVideosQuery);
    res.json(await learningHubService.listVideos(query));
  }),
);

// GET /v1/farmers/me/learning/trainings
farmerLearningRouter.get(
  '/learning/trainings',
  requireAuth,
  requirePermission('farmer.learning.view'),
  validate({ query: listTrainingsQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const query = getValidated(req, 'query', listTrainingsQuery);
    res.json(await learningHubService.listTrainings(query, scope.farmerId));
  }),
);

// POST /v1/farmers/me/learning/trainings/:id/enroll
farmerLearningRouter.post(
  '/learning/trainings/:id/enroll',
  requireAuth,
  requirePermission('farmer.learning.participate_own'),
  validate({ params: learningIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', learningIdParams);
    res.json(await learningHubService.enrollTraining(scope, id));
  }),
);

// DELETE /v1/farmers/me/learning/trainings/:id/enroll
farmerLearningRouter.delete(
  '/learning/trainings/:id/enroll',
  requireAuth,
  requirePermission('farmer.learning.participate_own'),
  validate({ params: learningIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', learningIdParams);
    await learningHubService.unenrollTraining(scope, id);
    res.status(204).end();
  }),
);

// GET /v1/farmers/me/learning/groups
farmerLearningRouter.get(
  '/learning/groups',
  requireAuth,
  requirePermission('farmer.learning.view'),
  validate({ query: listGroupsQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const query = getValidated(req, 'query', listGroupsQuery);
    res.json(await learningHubService.listGroups(query, scope.farmerId));
  }),
);

// POST /v1/farmers/me/learning/groups/:id/join
farmerLearningRouter.post(
  '/learning/groups/:id/join',
  requireAuth,
  requirePermission('farmer.learning.participate_own'),
  validate({ params: learningIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', learningIdParams);
    res.json(await learningHubService.joinGroup(scope, id));
  }),
);

// DELETE /v1/farmers/me/learning/groups/:id/leave
farmerLearningRouter.delete(
  '/learning/groups/:id/leave',
  requireAuth,
  requirePermission('farmer.learning.participate_own'),
  validate({ params: learningIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', learningIdParams);
    await learningHubService.leaveGroup(scope, id);
    res.status(204).end();
  }),
);

// ── Admin Routes (Mounted under /v1/admin) ───────────────────────────────────
export const adminLearningRouter: Router = Router();

// POST /v1/admin/learning/articles
adminLearningRouter.post(
  '/learning/articles',
  requireAuth,
  requirePermission('learning.admin.manage'),
  validate({ body: createArticleBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const body = getValidated(req, 'body', createArticleBody);
    const created = await learningHubService.createArticle(scope, body);
    res.status(201).json(created);
  }),
);

// PATCH /v1/admin/learning/articles/:id
adminLearningRouter.patch(
  '/learning/articles/:id',
  requireAuth,
  requirePermission('learning.admin.manage'),
  validate({ params: learningIdParams, body: updateArticleBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', learningIdParams);
    const patch = getValidated(req, 'body', updateArticleBody);
    res.json(await learningHubService.updateArticle(scope, id, patch));
  }),
);

// DELETE /v1/admin/learning/articles/:id
adminLearningRouter.delete(
  '/learning/articles/:id',
  requireAuth,
  requirePermission('learning.admin.manage'),
  validate({ params: learningIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', learningIdParams);
    await learningHubService.deleteArticle(scope, id);
    res.status(204).end();
  }),
);

// POST /v1/admin/learning/videos
adminLearningRouter.post(
  '/learning/videos',
  requireAuth,
  requirePermission('learning.admin.manage'),
  validate({ body: createVideoBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const body = getValidated(req, 'body', createVideoBody);
    const created = await learningHubService.createVideo(scope, body);
    res.status(201).json(created);
  }),
);

// PATCH /v1/admin/learning/videos/:id
adminLearningRouter.patch(
  '/learning/videos/:id',
  requireAuth,
  requirePermission('learning.admin.manage'),
  validate({ params: learningIdParams, body: updateVideoBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', learningIdParams);
    const patch = getValidated(req, 'body', updateVideoBody);
    res.json(await learningHubService.updateVideo(scope, id, patch));
  }),
);

// DELETE /v1/admin/learning/videos/:id
adminLearningRouter.delete(
  '/learning/videos/:id',
  requireAuth,
  requirePermission('learning.admin.manage'),
  validate({ params: learningIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', learningIdParams);
    await learningHubService.deleteVideo(scope, id);
    res.status(204).end();
  }),
);

// POST /v1/admin/learning/trainings
adminLearningRouter.post(
  '/learning/trainings',
  requireAuth,
  requirePermission('learning.admin.manage'),
  validate({ body: createTrainingBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const body = getValidated(req, 'body', createTrainingBody);
    const created = await learningHubService.createTraining(scope, body);
    res.status(201).json(created);
  }),
);

// PATCH /v1/admin/learning/trainings/:id
adminLearningRouter.patch(
  '/learning/trainings/:id',
  requireAuth,
  requirePermission('learning.admin.manage'),
  validate({ params: learningIdParams, body: updateTrainingBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', learningIdParams);
    const patch = getValidated(req, 'body', updateTrainingBody);
    res.json(await learningHubService.updateTraining(scope, id, patch));
  }),
);

// DELETE /v1/admin/learning/trainings/:id
adminLearningRouter.delete(
  '/learning/trainings/:id',
  requireAuth,
  requirePermission('learning.admin.manage'),
  validate({ params: learningIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', learningIdParams);
    await learningHubService.deleteTraining(scope, id);
    res.status(204).end();
  }),
);

// POST /v1/admin/learning/groups
adminLearningRouter.post(
  '/learning/groups',
  requireAuth,
  requirePermission('learning.admin.manage'),
  validate({ body: createGroupBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const body = getValidated(req, 'body', createGroupBody);
    const created = await learningHubService.createGroup(scope, body);
    res.status(201).json(created);
  }),
);

// PATCH /v1/admin/learning/groups/:id
adminLearningRouter.patch(
  '/learning/groups/:id',
  requireAuth,
  requirePermission('learning.admin.manage'),
  validate({ params: learningIdParams, body: updateGroupBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', learningIdParams);
    const patch = getValidated(req, 'body', updateGroupBody);
    res.json(await learningHubService.updateGroup(scope, id, patch));
  }),
);

// DELETE /v1/admin/learning/groups/:id
adminLearningRouter.delete(
  '/learning/groups/:id',
  requireAuth,
  requirePermission('learning.admin.manage'),
  validate({ params: learningIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', learningIdParams);
    await learningHubService.deleteGroup(scope, id);
    res.status(204).end();
  }),
);
