import { createRequire } from 'node:module';
import type http from 'node:http';

const req = createRequire(import.meta.url);
const realSupertest = req('supertest');

export const activeServers = new Set<http.Server>();

export async function closeAllTestServers(): Promise<void> {
  const closing: Promise<void>[] = [];
  for (const server of activeServers) {
    closing.push(new Promise<void>((resolve) => server.close(() => resolve())));
  }
  activeServers.clear();
  await Promise.all(closing);
}

function getOrCreateServer(app: unknown): unknown {
  if (typeof app === 'function') {
    const fnApp = app as { __testServer?: http.Server; listen?: (port: number) => http.Server };
    if (!fnApp.__testServer && typeof fnApp.listen === 'function') {
      const server = fnApp.listen(0);
      fnApp.__testServer = server;
      activeServers.add(server);
    }
    if (fnApp.__testServer) {
      return fnApp.__testServer;
    }
  }
  return app;
}

export function supertestWrapper(app: unknown, options?: unknown) {
  const target = getOrCreateServer(app);
  return realSupertest(target, options);
}

Object.assign(supertestWrapper, realSupertest);

(supertestWrapper as unknown as { agent: (app: unknown, options?: unknown) => unknown }).agent = function (
  app: unknown,
  options?: unknown,
) {
  const target = getOrCreateServer(app);
  return realSupertest.agent(target, options);
};

export default supertestWrapper;

