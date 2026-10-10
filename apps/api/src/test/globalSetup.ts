/**
 * Vitest globalSetup: runs ONCE in the main process, before any worker fork is
 * created and before any test file (hence any pg pool) is loaded. Throwing here
 * aborts the whole run instead of failing every file separately.
 *
 * The per-file setup (`setup.ts`) repeats the check against the final env
 * (after its local-default is applied) as defence in depth.
 */
import { assertSafeTestDatabase } from './dbSafety.js';

export default function globalSetup(): void {
  // vitest is by definition a test run, whatever NODE_ENV the shell exported.
  assertSafeTestDatabase({ ...process.env, NODE_ENV: 'test' });
}
