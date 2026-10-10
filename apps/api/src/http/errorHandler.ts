/**
 * Terminal Express error middleware. Must be registered LAST in app.ts.
 *
 * Responsibilities:
 *  - translate AppError / ZodError / unknown throwables into problem+json
 *  - log at the right level (4xx = warn, 5xx = error)
 *  - never leak an internal message or stack to the client
 */
import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { config } from '../config.js';
import { logger } from '../logger.js';
import { reportError } from '../obs/sentry.js';
import { AppError, internalProblem } from './problem.js';

export const PROBLEM_CONTENT_TYPE = 'application/problem+json';

/** 404 fallback. Register after all routes, before `errorHandler`. */
export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(new AppError('NOT_FOUND', { detail: 'No route matches this path and method.' }));
};

export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  // Express requires the 4-arity signature; if headers already went out the
  // only correct move is to hand it back so the connection is destroyed.
  if (res.headersSent) {
    next(error);
    return;
  }

  const instance = req.originalUrl;

  if (error instanceof ZodError) {
    const appError = zodToAppError(error);
    logger.warn({ err: error, code: appError.code, path: instance }, 'request validation failed');
    res.status(appError.status).type(PROBLEM_CONTENT_TYPE).json(appError.toProblem(instance));
    return;
  }

  const bodyError = bodyParserToAppError(error);
  if (bodyError !== null) {
    // The client sent something unreadable: a 4xx, so warn-level and never reported to Sentry.
    // The parser's own message can quote the offending bytes, so it is logged but not returned.
    logger.warn({ err: error, code: bodyError.code, path: instance }, 'request body rejected');
    res.status(bodyError.status).type(PROBLEM_CONTENT_TYPE).json(bodyError.toProblem(instance));
    return;
  }

  if (error instanceof AppError) {
    const problem = error.toProblem(instance);
    if (error.status >= 500) {
      logger.error({ err: error, code: error.code, path: instance }, 'request failed');
      reportError({
        error,
        tags: { code: error.code, env: config.NODE_ENV, path: stripQuery(instance) },
      });
    } else {
      logger.warn({ code: error.code, path: instance, detail: error.detail }, 'request rejected');
    }
    res.status(error.status).type(PROBLEM_CONTENT_TYPE).json(problem);
    return;
  }

  // Anything else is a bug. Log everything, tell the client nothing.
  logger.error({ err: error, path: instance }, 'unhandled error');
  reportError({ error, tags: { env: config.NODE_ENV, path: stripQuery(instance) } });
  res.status(500).type(PROBLEM_CONTENT_TYPE).json(internalProblem(instance));
};

/**
 * Failure types the `body-parser` / `raw-body` / `http-errors` stack attaches as `error.type`
 * (express.json and express.urlencoded). Matching on this exact list, plus a 4xx status,
 * keeps an unrelated error that happens to carry a `status` out of the client-error path.
 */
const BODY_PARSER_ERROR_TYPES: ReadonlySet<string> = new Set([
  'entity.parse.failed',
  'entity.verify.failed',
  'entity.too.large',
  'parameters.too.many',
  'request.aborted',
  'request.size.invalid',
  'stream.encoding.set',
  'charset.unsupported',
  'encoding.unsupported',
]);

/** Fixed, body-free explanations; never the parser's message, which can quote the payload. */
const BODY_PARSER_DETAIL: Record<string, string> = {
  'entity.parse.failed': 'The request body is not valid JSON.',
  'entity.too.large': 'The request body exceeds the maximum allowed size.',
  'parameters.too.many': 'The request body has too many parameters.',
  'charset.unsupported': 'The request body charset is not supported.',
  'encoding.unsupported': 'The request Content-Encoding is not supported.',
  'request.aborted': 'The request was aborted before the body was fully received.',
};

/**
 * Map a body-parser failure to a client error, or `null` when `error` is not one.
 *  - too large                          -> 413 PAYLOAD_TOO_LARGE
 *  - anything else body-parser rejects  -> BAD_REQUEST, with the status body-parser chose
 *                                          (400, or 415 for an unsupported charset/encoding).
 */
export function bodyParserToAppError(error: unknown): AppError | null {
  if (typeof error !== 'object' || error === null) return null;
  const { type, status, statusCode, code } = error as {
    type?: unknown;
    status?: unknown;
    statusCode?: unknown;
    code?: unknown;
  };
  const httpStatus = typeof status === 'number' ? status : statusCode;
  if (typeof httpStatus !== 'number' || httpStatus < 400 || httpStatus > 499) return null;

  // A corrupt gzip/deflate body: body-parser passes zlib's error through with status 400 and a
  // `Z_*` code but no `type`.
  if (type === undefined && httpStatus === 400 && typeof code === 'string' && code.startsWith('Z_')) {
    return new AppError('BAD_REQUEST', { detail: 'The request body could not be decompressed.', cause: error });
  }
  if (typeof type !== 'string' || !BODY_PARSER_ERROR_TYPES.has(type)) return null;

  const detail = BODY_PARSER_DETAIL[type] ?? 'The request body could not be read.';
  if (httpStatus === 413) {
    return new AppError('PAYLOAD_TOO_LARGE', { detail, cause: error });
  }
  return new AppError('BAD_REQUEST', { status: httpStatus, detail, cause: error });
}

/** Drop the query string so Sentry groups by route, not by attacker-controlled params. */
function stripQuery(path: string): string {
  const q = path.indexOf('?');
  return q === -1 ? path : path.slice(0, q);
}

/** Flatten a ZodError into the `errors` map of a VALIDATION_FAILED problem. */
export function zodToAppError(error: ZodError): AppError {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join('.') : '(root)';
    const bucket = errors[key];
    if (bucket === undefined) {
      errors[key] = [issue.message];
    } else {
      bucket.push(issue.message);
    }
  }
  return new AppError('VALIDATION_FAILED', {
    detail: 'One or more fields are invalid.',
    errors,
  });
}
