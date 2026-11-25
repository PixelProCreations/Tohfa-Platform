/**
 * Q&A Chat routes (Antigravity Brief 03 / BR-59u).
 * Surfaces:
 *   - Farmer: /v1/farmers/me/qa
 *   - Admin:  /v1/admin/qa
 */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import {
  answerIdParams,
  askQuestionBody,
  listQuestionsQuery,
  moderateContentBody,
  postAnswerBody,
  questionIdParams,
  updateAnswerBody,
  updateQuestionBody,
} from './qa-chat.schema.js';
import { qaChatService } from './qa-chat.service.js';

export const farmerQaRouter: Router = Router();
export const adminQaRouter: Router = Router();

// ============================================================================
// Farmer Surface: /v1/farmers/me/qa
// ============================================================================

// GET /v1/farmers/me/qa/questions
farmerQaRouter.get(
  '/questions',
  requireAuth,
  requirePermission('farmer.learning.view'),
  validate({ query: listQuestionsQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const query = getValidated(req, 'query', listQuestionsQuery);
    res.json(await qaChatService.listQuestions(scope, query));
  }),
);

// POST /v1/farmers/me/qa/questions
farmerQaRouter.post(
  '/questions',
  requireAuth,
  requirePermission('farmer.learning.qa_participate'),
  validate({ body: askQuestionBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const body = getValidated(req, 'body', askQuestionBody);
    const created = await qaChatService.askQuestion(scope, body);
    res.status(201).json(created);
  }),
);

// GET /v1/farmers/me/qa/questions/:id
farmerQaRouter.get(
  '/questions/:id',
  requireAuth,
  requirePermission('farmer.learning.view'),
  validate({ params: questionIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', questionIdParams);
    res.json(await qaChatService.getQuestion(scope, id));
  }),
);

// PATCH /v1/farmers/me/qa/questions/:id (edit own question)
farmerQaRouter.patch(
  '/questions/:id',
  requireAuth,
  requirePermission('farmer.learning.qa_participate'),
  validate({ params: questionIdParams, body: updateQuestionBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', questionIdParams);
    const patch = getValidated(req, 'body', updateQuestionBody);
    res.json(await qaChatService.updateQuestion(scope, id, patch));
  }),
);

// DELETE /v1/farmers/me/qa/questions/:id (delete own question)
farmerQaRouter.delete(
  '/questions/:id',
  requireAuth,
  requirePermission('farmer.learning.qa_participate'),
  validate({ params: questionIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', questionIdParams);
    await qaChatService.deleteQuestion(scope, id);
    res.status(204).end();
  }),
);

// POST /v1/farmers/me/qa/questions/:id/answers
farmerQaRouter.post(
  '/questions/:id/answers',
  requireAuth,
  requirePermission('farmer.learning.qa_participate'),
  validate({ params: questionIdParams, body: postAnswerBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', questionIdParams);
    const body = getValidated(req, 'body', postAnswerBody);
    const created = await qaChatService.postAnswer(scope, id, body);
    res.status(201).json(created);
  }),
);

// PATCH /v1/farmers/me/qa/answers/:id (edit own answer)
farmerQaRouter.patch(
  '/answers/:id',
  requireAuth,
  requirePermission('farmer.learning.qa_participate'),
  validate({ params: answerIdParams, body: updateAnswerBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', answerIdParams);
    const patch = getValidated(req, 'body', updateAnswerBody);
    res.json(await qaChatService.updateAnswer(scope, id, patch));
  }),
);

// DELETE /v1/farmers/me/qa/answers/:id (delete own answer)
farmerQaRouter.delete(
  '/answers/:id',
  requireAuth,
  requirePermission('farmer.learning.qa_participate'),
  validate({ params: answerIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', answerIdParams);
    await qaChatService.deleteAnswer(scope, id);
    res.status(204).end();
  }),
);

// ============================================================================
// Admin Surface: /v1/admin/qa
// ============================================================================

// GET /v1/admin/qa/questions
adminQaRouter.get(
  '/questions',
  requireAuth,
  requirePermission('learning.admin.manage'),
  validate({ query: listQuestionsQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const query = getValidated(req, 'query', listQuestionsQuery);
    res.json(await qaChatService.listQuestions(scope, query));
  }),
);

// POST /v1/admin/qa/questions
adminQaRouter.post(
  '/questions',
  requireAuth,
  requirePermission('farmer.learning.qa_participate'),
  validate({ body: askQuestionBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const body = getValidated(req, 'body', askQuestionBody);
    const created = await qaChatService.askQuestion(scope, body);
    res.status(201).json(created);
  }),
);

// GET /v1/admin/qa/questions/:id
adminQaRouter.get(
  '/questions/:id',
  requireAuth,
  requirePermission('learning.admin.manage'),
  validate({ params: questionIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', questionIdParams);
    res.json(await qaChatService.getQuestion(scope, id));
  }),
);

// PATCH /v1/admin/qa/questions/:id (edit question)
adminQaRouter.patch(
  '/questions/:id',
  requireAuth,
  requirePermission('farmer.learning.qa_participate'),
  validate({ params: questionIdParams, body: updateQuestionBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', questionIdParams);
    const patch = getValidated(req, 'body', updateQuestionBody);
    res.json(await qaChatService.updateQuestion(scope, id, patch));
  }),
);

// DELETE /v1/admin/qa/questions/:id (moderate: delete question)
adminQaRouter.delete(
  '/questions/:id',
  requireAuth,
  requirePermission('community.group.moderate'),
  validate({ params: questionIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', questionIdParams);
    await qaChatService.deleteQuestion(scope, id);
    res.status(204).end();
  }),
);

// POST /v1/admin/qa/questions/:id/answers
adminQaRouter.post(
  '/questions/:id/answers',
  requireAuth,
  requirePermission('farmer.learning.qa_participate'),
  validate({ params: questionIdParams, body: postAnswerBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', questionIdParams);
    const body = getValidated(req, 'body', postAnswerBody);
    const created = await qaChatService.postAnswer(scope, id, body);
    res.status(201).json(created);
  }),
);

// PATCH /v1/admin/qa/answers/:id (edit answer)
adminQaRouter.patch(
  '/answers/:id',
  requireAuth,
  requirePermission('farmer.learning.qa_participate'),
  validate({ params: answerIdParams, body: updateAnswerBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', answerIdParams);
    const patch = getValidated(req, 'body', updateAnswerBody);
    res.json(await qaChatService.updateAnswer(scope, id, patch));
  }),
);

// DELETE /v1/admin/qa/answers/:id (moderate: delete answer)
adminQaRouter.delete(
  '/answers/:id',
  requireAuth,
  requirePermission('community.group.moderate'),
  validate({ params: answerIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', answerIdParams);
    await qaChatService.deleteAnswer(scope, id);
    res.status(204).end();
  }),
);

// PATCH /v1/admin/qa/questions/:id/moderate (block/unblock)
adminQaRouter.patch(
  '/questions/:id/moderate',
  requireAuth,
  requirePermission('community.group.moderate'),
  validate({ params: questionIdParams, body: moderateContentBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', questionIdParams);
    const patch = getValidated(req, 'body', moderateContentBody);
    res.json(await qaChatService.moderateQuestion(scope, id, patch));
  }),
);

// PATCH /v1/admin/qa/answers/:id/moderate (block/unblock)
adminQaRouter.patch(
  '/answers/:id/moderate',
  requireAuth,
  requirePermission('community.group.moderate'),
  validate({ params: answerIdParams, body: moderateContentBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', answerIdParams);
    const patch = getValidated(req, 'body', moderateContentBody);
    res.json(await qaChatService.moderateAnswer(scope, id, patch));
  }),
);
