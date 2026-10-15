/**
 * Refuse U+0000 anywhere in a request, once, before any handler or SQL runs.
 *
 * WHY: PostgreSQL `text` cannot hold a 0x00 byte. A NUL in any free-text field,
 * query value or cursor used to pass the route's own zod schema (a `z.string()`
 * accepts it) and fail inside the driver, which the error handler can only
 * render as 500 INTERNAL. Fixing it per schema would have to be remembered in
 * every module forever, and the older routers parse inline with no `validate()`
 * at all, so the guard is mounted ONCE in createApp(), right after the body
 * parsers and before every router. Everything the parsers decoded is walked: an
 * escaped `\u0000` in a JSON body (already a real NUL after parsing), `%00` in a
 * query string or form body, and `%00` in the URL path (a route param).
 *
 * NOT COVERED (nothing there reaches a text column):
 *  - the raw Buffer body of POST /v1/webhooks/razorpay: it is HMAC-verified and
 *    parsed inside its handler, and only the signed payload is trusted;
 *  - request headers: Node's HTTP parser already refuses a NUL in a header;
 *  - multipart bodies: the API has no multipart parser (uploads use signed URLs).
 *    A future multipart parser must run before this guard or call it itself.
 *
 * The 422 names the offending field path (`body.fullName`, `query.cursor`,
 * `body.items.1.tags.0`) and never echoes a value.
 */
import type { RequestHandler } from 'express';
import { AppError } from './problem.js';

const NUL = '\u0000';
/** Keep the response bounded however many fields a hostile client poisons. */
const MAX_REPORTED_PATHS = 20;
const KEY_PLACEHOLDER = '(key containing NUL)';
const MESSAGE = 'Must not contain a NUL (U+0000) character.';

/**
 * Every path under `root` whose string value, or object key, contains U+0000.
 * Iterative on purpose: a 1 MB JSON body can nest hundreds of thousands of
 * arrays, and recursion would turn that into a stack overflow, a 500.
 */
export function findNulPaths(root: unknown, rootPath: string): string[] {
  const found: string[] = [];
  const stack: Array<{ value: unknown; path: string }> = [{ value: root, path: rootPath }];

  while (stack.length > 0 && found.length < MAX_REPORTED_PATHS) {
    const { value, path } = stack.pop()!;
    if (typeof value === 'string') {
      if (value.includes(NUL)) found.push(path);
    } else if (Array.isArray(value)) {
      for (let i = value.length - 1; i >= 0; i -= 1) stack.push({ value: value[i], path: `${path}.${i}` });
    } else if (value !== null && typeof value === 'object' && !Buffer.isBuffer(value)) {
      for (const [key, child] of Object.entries(value)) {
        if (key.includes(NUL)) {
          // The key itself is attacker text: name its position, not its content.
          found.push(`${path}.${KEY_PLACEHOLDER}`);
        } else {
          stack.push({ value: child, path: `${path}.${key}` });
        }
      }
    }
  }
  return found.slice(0, MAX_REPORTED_PATHS);
}

/** `%00` in the path decodes to NUL in req.params. Matches the encoded form only: `%2500` is the text "%00". */
const ENCODED_NUL_IN_PATH = /%00/i;

export const rejectNulBytes: RequestHandler = (req, _res, next) => {
  const paths = [
    ...(ENCODED_NUL_IN_PATH.test(req.path) ? ['params'] : []),
    ...findNulPaths(req.query, 'query'),
    ...findNulPaths(req.body, 'body'),
  ].slice(0, MAX_REPORTED_PATHS);

  if (paths.length === 0) {
    next();
    return;
  }

  const errors: Record<string, string[]> = {};
  for (const path of paths) errors[path] = [MESSAGE];
  next(
    new AppError('VALIDATION_FAILED', {
      status: 422,
      detail: 'One or more fields contain a NUL (U+0000) character, which is not allowed.',
      errors,
    }),
  );
};
