/**
 * Vitest globalSetup: runs ONCE in the main process, before any worker fork is
 * created and before any test file (hence any pg pool) is loaded. Throwing here
 * aborts the whole run instead of failing every file separately.
 *
 * The per-file setup (`setup.ts`) repeats the check against the final env
 * (after its local-default is applied) as defence in depth.
 */
import { assertSafeTestDatabase } from './dbSafety.js';
import {
  purgeNonSeedWarehouses,
  purgeNonSeedUsers,
  purgeNonSeedFarmerApplications,
  purgeNonSeedZones,
  purgeNonSeedDeliveryPartners,
  purgeNonSeedMarketDays,
  purgeNonSeedStockAdjustmentEvidence,
  purgeNonSeedWarehouseStaffDetails,
  purgeNonSeedPaymentMethods,
  purgeNonSeedAdminReports,
} from './committedFixtureCleanup.js';

export default async function globalSetup(): Promise<() => Promise<void>> {
  // vitest is by definition a test run, whatever NODE_ENV the shell exported.
  assertSafeTestDatabase({ ...process.env, NODE_ENV: 'test' });

  const dbUrl = process.env['DATABASE_URL'];
  if (dbUrl) {
    const { Client } = await import('pg');
    const client = new Client({ connectionString: dbUrl });
    await client.connect();
    try {
      await purgeNonSeedWarehouses(client);
      await purgeNonSeedUsers(client);
      await purgeNonSeedFarmerApplications(client);
      await purgeNonSeedZones(client);
      await purgeNonSeedDeliveryPartners(client);
      await purgeNonSeedMarketDays(client);
      await purgeNonSeedStockAdjustmentEvidence(client);
      await purgeNonSeedWarehouseStaffDetails(client);
      await purgeNonSeedPaymentMethods(client);
      await purgeNonSeedAdminReports(client);
    } finally {
      await client.end().catch(() => {});
    }
  }

  return async () => {
    if (dbUrl) {
      const { Client } = await import('pg');
      const client = new Client({ connectionString: dbUrl });
      await client.connect();
      try {
        await purgeNonSeedWarehouses(client);
        await purgeNonSeedUsers(client);
        await purgeNonSeedFarmerApplications(client);
        await purgeNonSeedZones(client);
        await purgeNonSeedDeliveryPartners(client);
        await purgeNonSeedMarketDays(client);
        await purgeNonSeedStockAdjustmentEvidence(client);
        await purgeNonSeedWarehouseStaffDetails(client);
        await purgeNonSeedPaymentMethods(client);
        await purgeNonSeedAdminReports(client);
      } finally {
        await client.end().catch(() => {});
      }
    }

    const [{ closePool }, { closeRedis }, { closeAllTestServers }] = await Promise.all([
      import('../db/pool.js'),
      import('../redis.js'),
      import('./supertestWrapper.js'),
    ]);
    await Promise.allSettled([closePool(), closeRedis(), closeAllTestServers()]);
  };
}
