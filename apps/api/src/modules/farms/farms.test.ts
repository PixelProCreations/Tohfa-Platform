/**
 * Two layers of test, always (see apps/api/CLAUDE.md):
 *
 *  1. SCHEMA + SERVICE tests with a fake repo. Fast, no I/O. This is where
 *     BR-36 (own-data ownership) is actually asserted: a farm/plot belonging
 *     to a different farmer must 404, never 403, never leak a field.
 *
 *  2. ONE integration test against a real pool, proving the PostGIS
 *     boundary round-trips through Postgres (ST_GeomFromGeoJSON /
 *     ST_AsGeoJSON), not just that the SQL typechecks. Wrapped in a
 *     transaction that rolls back, so it leaves no residue.
 */
import { describe, expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import { AppError } from '../../http/problem.js';
import type { Executor } from '../../db/pool.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { createFarmsService } from './farms.service.js';
import type {
  Farm,
  FarmPatch,
  FarmsRepo,
  FarmWithPlotCount,
  InsertFarmParams,
  InsertPlotParams,
  Plot,
  PlotPatch,
} from './farms.repo.js';
import {
  createFarmBody,
  createPlotBody,
  geoJsonPolygonSchema,
  updateFarmBody,
  updatePlotBody,
} from './farms.schema.js';
import { IDS, aScope, databaseReady, describeIfDatabase, newId } from '../../test/factories.js';

// ---------------------------------------------------------------------------
// fixtures
// ---------------------------------------------------------------------------

const FARMER_A = IDS.farmer;
const FARMER_B = newId();
const USER_A = IDS.userFarmer;

function farmerScope(overrides: Partial<ResolvedScope> = {}): ResolvedScope {
  return aScope({
    level: ScopeLevel.OWN,
    permission: 'farmer.farm.manage_own',
    roleCode: RoleCode.FARMER,
    userId: USER_A,
    farmerId: FARMER_A,
    ...overrides,
  });
}

/**
 * A `FARMER` scope with no `farmerId` at all — mirrors what
 * requirePermission.ts#resolveScope produces when `actor.farmerId === null`
 * (e.g. a token minted before farmer approval finished). Built by DELETING
 * the key, not by setting it to `undefined`: `exactOptionalPropertyTypes`
 * treats those as different, and only the former matches what production
 * code actually produces (`ResolvedScope.farmerId` is `string | undefined`,
 * conditionally spread in — never explicitly `undefined`).
 */
function farmerScopeWithoutFarmerId(): ResolvedScope {
  const scope = farmerScope();
  const { farmerId: _farmerId, ...rest } = scope;
  return rest as ResolvedScope;
}

const SQUARE_POLYGON = {
  type: 'Polygon' as const,
  coordinates: [
    [
      [76.69, 11.41],
      [76.7, 11.41],
      [76.7, 11.42],
      [76.69, 11.42],
      [76.69, 11.41],
    ],
  ],
};

function aFarm(overrides: Partial<Farm> = {}): Farm {
  return {
    id: newId(),
    farmerId: FARMER_A,
    name: 'Home plot',
    surveyNumber: null,
    areaAcres: 2.5,
    centroidLat: null,
    centroidLng: null,
    boundary: null,
    boundaryAreaAcres: null,
    boundaryDrawnBy: null,
    boundaryDrawnAt: null,
    boundaryVersion: 0,
    address: null,
    village: 'Kodanad',
    taluk: 'Kotagiri',
    district: 'The Nilgiris',
    isPrimary: true,
    waterSources: [],
    landBoundaryContext: [],
    notes: null,
    createdAt: '2026-04-01T06:00:00.000Z',
    updatedAt: null,
    ...overrides,
  };
}

function aPlot(overrides: Partial<Plot> = {}): Plot {
  return {
    id: newId(),
    farmId: newId(),
    name: 'North bed',
    areaAcres: 0.4,
    soilType: null,
    sunExposure: null,
    irrigationType: null,
    createdAt: '2026-04-01T06:00:00.000Z',
    updatedAt: null,
    ...overrides,
  };
}

/** Executor good enough for writeAuditLog's raw INSERT (bypasses the fake repo). */
const auditDb: Executor = {
  query: async () => ({ rows: [{ id: newId() }], rowCount: 1 }) as never,
};

interface RepoCalls {
  listByScope: Array<{ sql: string; params: unknown[] }>;
  findByIdIds: string[];
  insert: InsertFarmParams[];
  update: Array<{ farmId: string; patch: FarmPatch }>;
  softDelete: string[];
  listPlots: string[];
  findPlotByIdArgs: Array<{ farmId: string; plotId: string }>;
  insertPlot: InsertPlotParams[];
  updatePlot: Array<{ farmId: string; plotId: string; patch: PlotPatch }>;
  deletePlot: Array<{ farmId: string; plotId: string }>;
}

interface FakeRepoOptions {
  farms?: Farm[];
  plots?: Plot[];
  /** Throws this from insertPlot/updatePlot to simulate the UNIQUE(farm_id, name) violation. */
  plotNameConflict?: boolean;
}

function fakeRepo(options: FakeRepoOptions = {}): { repo: FarmsRepo; calls: RepoCalls } {
  const farms = new Map(options.farms?.map((f) => [f.id, f]) ?? []);
  const plots = new Map(options.plots?.map((p) => [p.id, p]) ?? []);
  const calls: RepoCalls = {
    listByScope: [],
    findByIdIds: [],
    insert: [],
    update: [],
    softDelete: [],
    listPlots: [],
    findPlotByIdArgs: [],
    insertPlot: [],
    updatePlot: [],
    deletePlot: [],
  };

  const repo: FarmsRepo = {
    async listByScope(_db, scope) {
      calls.listByScope.push({ sql: scope.sql, params: scope.params });
      const items: FarmWithPlotCount[] = [...farms.values()].map((f) => ({
        ...f,
        plotCount: [...plots.values()].filter((p) => p.farmId === f.id).length,
      }));
      return items;
    },
    async findById(_db, farmId) {
      calls.findByIdIds.push(farmId);
      return farms.get(farmId) ?? null;
    },
    async insert(_db, params) {
      calls.insert.push(params);
      const farm = aFarm({
        farmerId: params.farmerId,
        name: params.name,
        areaAcres: params.areaAcres,
        village: params.village,
        taluk: params.taluk,
        district: params.district ?? 'The Nilgiris',
        boundary: params.boundary,
        boundaryAreaAcres: params.boundaryAreaAcres,
        boundaryDrawnBy: params.boundaryDrawnBy,
        boundaryDrawnAt: params.boundaryDrawnBy === null ? null : '2026-04-01T06:00:00.000Z',
        isPrimary: false,
      });
      farms.set(farm.id, farm);
      return farm;
    },
    async update(_db, farmId, patch) {
      calls.update.push({ farmId, patch });
      const existing = farms.get(farmId);
      if (existing === undefined) return null;
      const updated: Farm = {
        ...existing,
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.areaAcres !== undefined ? { areaAcres: patch.areaAcres } : {}),
        ...(patch.village !== undefined ? { village: patch.village } : {}),
        ...(patch.taluk !== undefined ? { taluk: patch.taluk } : {}),
        ...(patch.district !== undefined ? { district: patch.district } : {}),
        ...(patch.waterSources !== undefined ? { waterSources: patch.waterSources } : {}),
        ...(patch.landBoundaryContext !== undefined
          ? { landBoundaryContext: patch.landBoundaryContext }
          : {}),
        ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
        ...(patch.boundaryUpdate !== undefined
          ? {
              boundary: patch.boundaryUpdate.geojson,
              boundaryAreaAcres: patch.boundaryUpdate.boundaryAreaAcres,
              boundaryDrawnBy: patch.boundaryUpdate.drawnBy,
              boundaryDrawnAt: patch.boundaryUpdate.geojson === null ? null : '2026-05-01T00:00:00.000Z',
              boundaryVersion: existing.boundaryVersion + 1,
            }
          : {}),
      };
      farms.set(farmId, updated);
      return updated;
    },
    async softDelete(_db, farmId) {
      calls.softDelete.push(farmId);
      if (!farms.has(farmId)) return false;
      farms.delete(farmId);
      return true;
    },
    async listPlots(_db, farmId) {
      calls.listPlots.push(farmId);
      return [...plots.values()].filter((p) => p.farmId === farmId);
    },
    async findPlotById(_db, farmId, plotId) {
      calls.findPlotByIdArgs.push({ farmId, plotId });
      const plot = plots.get(plotId);
      return plot !== undefined && plot.farmId === farmId ? plot : null;
    },
    async insertPlot(_db, params) {
      calls.insertPlot.push(params);
      if (options.plotNameConflict === true) {
        throw Object.assign(new Error('duplicate key value violates unique constraint'), {
          code: '23505',
        });
      }
      const plot = aPlot({
        farmId: params.farmId,
        name: params.name,
        areaAcres: params.areaAcres,
        soilType: params.soilType,
        sunExposure: params.sunExposure,
        irrigationType: params.irrigationType,
      });
      plots.set(plot.id, plot);
      return plot;
    },
    async updatePlot(_db, farmId, plotId, patch) {
      calls.updatePlot.push({ farmId, plotId, patch });
      if (options.plotNameConflict === true) {
        throw Object.assign(new Error('duplicate key value violates unique constraint'), {
          code: '23505',
        });
      }
      const existing = plots.get(plotId);
      if (existing === undefined || existing.farmId !== farmId) return null;
      const updated: Plot = { ...existing, ...patch };
      plots.set(plotId, updated);
      return updated;
    },
    async deletePlot(_db, farmId, plotId) {
      calls.deletePlot.push({ farmId, plotId });
      const existing = plots.get(plotId);
      if (existing === undefined || existing.farmId !== farmId) return false;
      plots.delete(plotId);
      return true;
    },
  };

  return { repo, calls };
}

function service(options: FakeRepoOptions = {}) {
  const { repo, calls } = fakeRepo(options);
  const svc = createFarmsService({
    repo,
    db: auditDb,
    runTx: async (fn) => fn(auditDb),
  });
  return { svc, calls };
}

// ---------------------------------------------------------------------------
// schema validation
// ---------------------------------------------------------------------------

describe('farms.schema validation', () => {
  it('createFarmBody requires a name', () => {
    expect(createFarmBody.safeParse({}).success).toBe(false);
  });

  it('createFarmBody rejects an unknown field (.strict())', () => {
    const result = createFarmBody.safeParse({ name: 'Home plot', farmerId: 'sneaky' });
    expect(result.success).toBe(false);
  });

  it('createFarmBody rejects a non-positive areaAcres', () => {
    expect(createFarmBody.safeParse({ name: 'Home plot', areaAcres: 0 }).success).toBe(false);
    expect(createFarmBody.safeParse({ name: 'Home plot', areaAcres: -1 }).success).toBe(false);
  });

  it('createFarmBody accepts a valid GeoJSON boundary', () => {
    const result = createFarmBody.safeParse({ name: 'Home plot', boundary: SQUARE_POLYGON });
    expect(result.success).toBe(true);
  });

  it('geoJsonPolygonSchema rejects a non-Polygon type', () => {
    expect(geoJsonPolygonSchema.safeParse({ type: 'Point', coordinates: [76.69, 11.41] }).success).toBe(
      false,
    );
  });

  it('updateFarmBody accepts an explicit null boundary (clears it) and an empty body (no-op)', () => {
    expect(updateFarmBody.safeParse({ boundary: null }).success).toBe(true);
    expect(updateFarmBody.safeParse({}).success).toBe(true);
  });

  it('updateFarmBody rejects a non-Polygon boundary payload', () => {
    expect(updateFarmBody.safeParse({ boundary: { foo: 'bar' } }).success).toBe(false);
  });

  it('createPlotBody requires a name and rejects unknown fields', () => {
    expect(createPlotBody.safeParse({}).success).toBe(false);
    expect(createPlotBody.safeParse({ name: 'North bed', boundary: SQUARE_POLYGON }).success).toBe(false);
  });

  it('updatePlotBody accepts a partial update', () => {
    expect(updatePlotBody.safeParse({ sunExposure: 'Full sun' }).success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// list
// ---------------------------------------------------------------------------

describe('farmsService.list', () => {
  it('scopes the query to the caller farmer id, never returns TRUE for an own scope', async () => {
    const { svc, calls } = service();
    await svc.list(farmerScope());

    expect(calls.listByScope[0]?.sql).toContain('f.farmer_id = $1');
    expect(calls.listByScope[0]?.params).toEqual([FARMER_A]);
  });

  it('fails closed (SQL FALSE) when an own-scoped actor has no farmerId at all', async () => {
    const { svc, calls } = service();
    await svc.list(farmerScopeWithoutFarmerId());

    expect(calls.listByScope[0]?.sql).toBe('FALSE');
  });

  it('returns the plotCount the repo computed, per farm', async () => {
    const farm = aFarm({ farmerId: FARMER_A });
    const plot = aPlot({ farmId: farm.id });
    const { svc } = service({ farms: [farm], plots: [plot] });

    const result = await svc.list(farmerScope());

    expect(result).toHaveLength(1);
    expect(result[0]?.plotCount).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// create
// ---------------------------------------------------------------------------

describe('farmsService.create', () => {
  it('inserts under the caller own farmerId, with is_primary never settable via this endpoint', async () => {
    const { svc, calls } = service();
    const body = createFarmBody.parse({ name: 'Second parcel', areaAcres: 1.2 });

    await svc.create(farmerScope(), body);

    expect(calls.insert[0]?.farmerId).toBe(FARMER_A);
    // The repo interface has no is_primary parameter at all for create — the
    // service cannot set it even if it wanted to; the DB default + the
    // uq_farms_primary unique index are what actually enforce this.
    expect(calls.insert[0]).not.toHaveProperty('isPrimary');
  });

  it('stamps boundaryDrawnBy only when a boundary is supplied', async () => {
    const { svc, calls } = service();

    await svc.create(farmerScope(), createFarmBody.parse({ name: 'No boundary yet' }));
    expect(calls.insert[0]?.boundaryDrawnBy).toBeNull();

    await svc.create(
      farmerScope(),
      createFarmBody.parse({ name: 'Drawn', boundary: SQUARE_POLYGON }),
    );
    expect(calls.insert[1]?.boundaryDrawnBy).toBe(USER_A);
  });

  it('raises NOT_FOUND rather than inserting when the actor has no farmerId', async () => {
    const { svc, calls } = service();

    await expect(
      svc.create(farmerScopeWithoutFarmerId(), createFarmBody.parse({ name: 'x' })),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(calls.insert).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// update — ownership (BR-36) and boundary semantics
// ---------------------------------------------------------------------------

describe('farmsService.update — BR-36 own-data ownership', () => {
  it('BR-36: a farm belonging to another farmer 404s, never leaks, never 403s', async () => {
    const otherFarm = aFarm({ farmerId: FARMER_B });
    const { svc, calls } = service({ farms: [otherFarm] });

    const error = await svc
      .update(farmerScope(), otherFarm.id, updateFarmBody.parse({ name: 'Hijacked' }))
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe('NOT_FOUND');
    expect((error as AppError).status).toBe(404);
    // The ownership check must reject BEFORE any write is attempted.
    expect(calls.update).toHaveLength(0);
  });

  it('BR-36: a farm id that does not exist at all 404s the same way', async () => {
    const { svc } = service();
    await expect(
      svc.update(farmerScope(), newId(), updateFarmBody.parse({ name: 'Ghost' })),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('updates only the fields present in the body', async () => {
    const farm = aFarm({ farmerId: FARMER_A, name: 'Old name', village: 'Kodanad' });
    const { svc, calls } = service({ farms: [farm] });

    await svc.update(farmerScope(), farm.id, updateFarmBody.parse({ name: 'New name' }));

    expect(calls.update[0]?.patch).toEqual({ name: 'New name' });
  });

  it('a supplied boundary sets drawnBy/area and increments boundaryVersion', async () => {
    const farm = aFarm({ farmerId: FARMER_A, boundaryVersion: 2 });
    const { svc, calls } = service({ farms: [farm] });

    const updated = await svc.update(
      farmerScope(),
      farm.id,
      updateFarmBody.parse({ boundary: SQUARE_POLYGON, calculatedAreaAcres: 2.63 }),
    );

    expect(calls.update[0]?.patch.boundaryUpdate).toEqual({
      geojson: SQUARE_POLYGON,
      boundaryAreaAcres: 2.63,
      drawnBy: USER_A,
    });
    expect(updated.boundaryVersion).toBe(3);
  });

  it('boundary: null clears the boundary AND everything derived from it', async () => {
    const farm = aFarm({
      farmerId: FARMER_A,
      boundary: SQUARE_POLYGON,
      boundaryAreaAcres: 2.63,
      boundaryDrawnBy: USER_A,
      boundaryVersion: 1,
    });
    const { svc, calls } = service({ farms: [farm] });

    const updated = await svc.update(farmerScope(), farm.id, updateFarmBody.parse({ boundary: null }));

    expect(calls.update[0]?.patch.boundaryUpdate).toEqual({
      geojson: null,
      boundaryAreaAcres: null,
      drawnBy: null,
    });
    expect(updated.boundary).toBeNull();
    expect(updated.boundaryVersion).toBe(2);
  });

  it('omitting boundary entirely leaves it untouched (no boundaryUpdate patch at all)', async () => {
    const farm = aFarm({ farmerId: FARMER_A, boundary: SQUARE_POLYGON });
    const { svc, calls } = service({ farms: [farm] });

    await svc.update(farmerScope(), farm.id, updateFarmBody.parse({ name: 'Renamed' }));

    expect(calls.update[0]?.patch).not.toHaveProperty('boundaryUpdate');
  });
});

// ---------------------------------------------------------------------------
// remove
// ---------------------------------------------------------------------------

describe('farmsService.remove', () => {
  it('BR-36: cannot soft-delete a farm belonging to another farmer', async () => {
    const otherFarm = aFarm({ farmerId: FARMER_B });
    const { svc, calls } = service({ farms: [otherFarm] });

    await expect(svc.remove(farmerScope(), otherFarm.id)).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(calls.softDelete).toHaveLength(0);
  });

  it('soft-deletes an own farm', async () => {
    const farm = aFarm({ farmerId: FARMER_A });
    const { svc, calls } = service({ farms: [farm] });

    await svc.remove(farmerScope(), farm.id);

    expect(calls.softDelete).toEqual([farm.id]);
  });
});

// ---------------------------------------------------------------------------
// plots — ownership is checked by joining through the parent farm
// ---------------------------------------------------------------------------

describe('farmsService plots — BR-36 ownership via the parent farm', () => {
  it('BR-36: listPlots 404s for a farm belonging to another farmer', async () => {
    const otherFarm = aFarm({ farmerId: FARMER_B });
    const { svc, calls } = service({ farms: [otherFarm] });

    await expect(svc.listPlots(farmerScope(), otherFarm.id)).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(calls.listPlots).toHaveLength(0);
  });

  it('lists the zones under an own farm', async () => {
    const farm = aFarm({ farmerId: FARMER_A });
    const plot = aPlot({ farmId: farm.id });
    const { svc } = service({ farms: [farm], plots: [plot] });

    const plots = await svc.listPlots(farmerScope(), farm.id);

    expect(plots).toEqual([plot]);
  });

  it('createPlot: BR-36 rejects before inserting when the farm is not the caller own', async () => {
    const otherFarm = aFarm({ farmerId: FARMER_B });
    const { svc, calls } = service({ farms: [otherFarm] });

    await expect(
      svc.createPlot(farmerScope(), otherFarm.id, createPlotBody.parse({ name: 'North bed' })),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(calls.insertPlot).toHaveLength(0);
  });

  it('createPlot: happy path inserts under the given farmId', async () => {
    const farm = aFarm({ farmerId: FARMER_A });
    const { svc, calls } = service({ farms: [farm] });

    const plot = await svc.createPlot(farmerScope(), farm.id, createPlotBody.parse({ name: 'North bed' }));

    expect(plot.farmId).toBe(farm.id);
    expect(calls.insertPlot[0]?.farmId).toBe(farm.id);
  });

  it('createPlot: a duplicate zone name on the same farm surfaces as CONFLICT, not 500', async () => {
    const farm = aFarm({ farmerId: FARMER_A });
    const { svc } = service({ farms: [farm], plotNameConflict: true });

    await expect(
      svc.createPlot(farmerScope(), farm.id, createPlotBody.parse({ name: 'North bed' })),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it('updatePlot: BR-36 — a plot that exists but under a foreign farm 404s', async () => {
    const myFarm = aFarm({ farmerId: FARMER_A });
    const otherFarm = aFarm({ farmerId: FARMER_B });
    const plotOnOtherFarm = aPlot({ farmId: otherFarm.id });
    const { svc, calls } = service({ farms: [myFarm, otherFarm], plots: [plotOnOtherFarm] });

    // Actor supplies THEIR OWN farmId with SOMEONE ELSE'S plotId — the join
    // through farm_id must reject this, not fall back to a global plot lookup.
    await expect(
      svc.updatePlot(farmerScope(), myFarm.id, plotOnOtherFarm.id, updatePlotBody.parse({ name: 'x' })),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(calls.updatePlot).toHaveLength(0);
  });

  it('updatePlot: happy path', async () => {
    const farm = aFarm({ farmerId: FARMER_A });
    const plot = aPlot({ farmId: farm.id, sunExposure: null });
    const { svc } = service({ farms: [farm], plots: [plot] });

    const updated = await svc.updatePlot(
      farmerScope(),
      farm.id,
      plot.id,
      updatePlotBody.parse({ sunExposure: 'Full sun' }),
    );

    expect(updated.sunExposure).toBe('Full sun');
  });

  it('removePlot: BR-36 rejects before deleting when the farm is not the caller own', async () => {
    const otherFarm = aFarm({ farmerId: FARMER_B });
    const plot = aPlot({ farmId: otherFarm.id });
    const { svc, calls } = service({ farms: [otherFarm], plots: [plot] });

    await expect(svc.removePlot(farmerScope(), otherFarm.id, plot.id)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
    expect(calls.deletePlot).toHaveLength(0);
  });

  it('removePlot: happy path hard-deletes', async () => {
    const farm = aFarm({ farmerId: FARMER_A });
    const plot = aPlot({ farmId: farm.id });
    const { svc, calls } = service({ farms: [farm], plots: [plot] });

    await svc.removePlot(farmerScope(), farm.id, plot.id);

    expect(calls.deletePlot).toEqual([{ farmId: farm.id, plotId: plot.id }]);
  });
});

// ---------------------------------------------------------------------------
// integration — real Postgres/PostGIS round-trip
// ---------------------------------------------------------------------------

describeIfDatabase('farmsService (integration against PostgreSQL/PostGIS)', () => {
  it('creates a farm with a real GeoJSON boundary, reads it back, adds a plot, updates it, deletes it', async () => {
    if (!(await databaseReady('farms')) || !(await databaseReady('plots'))) {
      console.warn('[skip] farms/plots tables not reachable — run `docker compose up -d && pnpm db:migrate`');
      return;
    }

    const { pool } = await import('../../db/pool.js');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const userId = newId();
      const mobile = `+9198${Math.floor(10000000 + Math.random() * 89999999)}`;
      await client.query(
        `INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1, $2, $3, 'FARMER', 'ACTIVE')`,
        [userId, mobile, 'Integration Test Farmer'],
      );

      const farmerId = newId();
      await client.query(
        `INSERT INTO farmers (id, user_id, tohfa_farmer_id) VALUES ($1, $2, $3)`,
        [farmerId, userId, `TOHFA-TEST-${farmerId.slice(0, 8)}`],
      );

      const scope = farmerScope({ farmerId, userId });
      const svc = createFarmsService({
        db: client,
        runTx: async (fn) => fn(client),
      });

      // 1. create with a real boundary polygon.
      const created = await svc.create(
        scope,
        createFarmBody.parse({ name: 'Integration Farm', areaAcres: 3, boundary: SQUARE_POLYGON }),
      );
      expect(created.boundary).toEqual(SQUARE_POLYGON);
      expect(created.boundaryDrawnBy).toBe(userId);
      expect(created.boundaryVersion).toBe(0); // create never bumps the version, only PATCH does

      // 2. list — proves plotCount joins correctly (zero plots yet).
      const afterCreate = await svc.list(scope);
      const listed = afterCreate.find((f) => f.id === created.id);
      expect(listed?.plotCount).toBe(0);
      expect(listed?.boundary).toEqual(SQUARE_POLYGON);

      // 3. add a plot (zone).
      const plot = await svc.createPlot(
        scope,
        created.id,
        createPlotBody.parse({ name: 'Zone A', soilType: 'Loam', sunExposure: 'Full sun' }),
      );
      expect(plot.farmId).toBe(created.id);

      const plots = await svc.listPlots(scope, created.id);
      expect(plots.map((p) => p.id)).toEqual([plot.id]);

      // 4. update the plot.
      const updatedPlot = await svc.updatePlot(
        scope,
        created.id,
        plot.id,
        updatePlotBody.parse({ sunExposure: 'Partial' }),
      );
      expect(updatedPlot.sunExposure).toBe('Partial');

      // 5. update the farm's boundary — round-trips through ST_GeomFromGeoJSON
      // / ST_AsGeoJSON again, and bumps boundary_version.
      const REDRAWN = {
        type: 'Polygon' as const,
        coordinates: [
          [
            [76.68, 11.4],
            [76.71, 11.4],
            [76.71, 11.43],
            [76.68, 11.43],
            [76.68, 11.4],
          ],
        ],
      };
      const redrawn = await svc.update(
        scope,
        created.id,
        updateFarmBody.parse({ boundary: REDRAWN, calculatedAreaAcres: 5.1 }),
      );
      expect(redrawn.boundary).toEqual(REDRAWN);
      expect(redrawn.boundaryAreaAcres).toBe(5.1);
      expect(redrawn.boundaryVersion).toBe(1);

      // 6. clear the boundary.
      const cleared = await svc.update(scope, created.id, updateFarmBody.parse({ boundary: null }));
      expect(cleared.boundary).toBeNull();
      expect(cleared.boundaryAreaAcres).toBeNull();
      expect(cleared.boundaryDrawnBy).toBeNull();
      expect(cleared.boundaryVersion).toBe(2);

      // 7. delete the plot, then the farm.
      await svc.removePlot(scope, created.id, plot.id);
      expect(await svc.listPlots(scope, created.id)).toEqual([]);

      await svc.remove(scope, created.id);
      const afterDelete = await svc.list(scope);
      expect(afterDelete.some((f) => f.id === created.id)).toBe(false);

      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });
});
