/**
 * BR-69 -- registration step bodies are validated, and an application with no located
 * land can be neither submitted nor approved.
 *
 * The defect this pins (found by a QA run): PATCH /applications/:id/steps/:step validated
 * only the path, so `{"locations":[]}` overwrote a good saved boundary, submit (which only
 * checked the two document types) let it through, and approval produced a VERIFIED farmer
 * with ZERO farms. Everything below goes through the REAL router and the REAL database:
 * a mocked repo cannot observe a query that never ran.
 */
import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { pool } from '../../db/pool.js';
import { databaseReady, describeIfDatabase } from '../../test/factories.js';
import {
  isRealPastDate,
  registrationStepBodySchemas,
  step1PersonalSchema,
  step3LocationSchema,
} from './farmer-applications.schema.js';

const CLOSED_RING = [
  [76.6948, 11.41],
  [76.6953, 11.41],
  [76.6953, 11.4105],
  [76.6948, 11.4105],
  [76.6948, 11.41],
];

/** What Step1Personal.tsx really sends (DD / MM / YYYY dob, Title-case gender, `mobile`). */
const MOBILE_STEP1 = {
  fullName: 'Devika R',
  mobile: '+919812345678',
  dob: '21 / 05 / 1990',
  gender: 'Female',
  aadhaarLast4: '0123',
  addressLine1: '4 Tea Estate Road',
  village: 'Kotagiri',
  taluk: 'Kotagiri',
  district: 'The Nilgiris',
  pincode: '643217',
};

/** What Step2FarmDetails.tsx really sends. */
const MOBILE_STEP2 = {
  farmName: 'Blue Hills Organic',
  typeOfFarming: 'Mixed vegetables',
  experienceYears: 8,
  totalAreaAcres: 2,
  numberOfFarms: 1,
};

/** What Step3Location.tsx's commitActiveLocation really sends for a drawn parcel. */
const MOBILE_LOCATION = {
  id: 'farm-lq2x9k-ab12cd34',
  label: 'Home plot',
  areaAcres: 2.4,
  gpsCaptured: true,
  latitude: 11.4102,
  longitude: 76.695,
  calculatedAreaAcres: 2.43,
  calculatedAreaHectares: 0.98,
  fmbPolygon: { type: 'Polygon', coordinates: [CLOSED_RING] },
  village: 'Ithalar',
  taluk: 'Ooty',
  district: 'The Nilgiris',
};

const MOBILE_DOCS = {
  documents: [
    { docType: 'ID_PROOF', fileUrl: 'https://blob.example/id.pdf', fileName: 'id.pdf', docSubType: 'Aadhaar Card' },
    { docType: 'FARM_DOC', fileUrl: 'https://blob.example/patta.pdf', fileName: 'patta.pdf', docSubType: 'Patta' },
  ],
};

let mobileCounter = 0;
function freshMobile(): string {
  mobileCounter += 1;
  return `+9197${(Date.now() % 1_000_000).toString().padStart(6, '0')}${String(mobileCounter).padStart(2, '0')}`;
}

describeIfDatabase('BR-69: registration step validation (real router, real database)', () => {
  const app = createApp();

  afterAll(async () => {
    await pool.end().catch(() => undefined);
  });

  async function newApplication(): Promise<{ id: string; mobile: string }> {
    const mobile = freshMobile();
    const res = await request(app).post('/v1/farmers/applications').send({ mobile, fullName: 'Devika R' });
    expect(res.status).toBe(201);
    return { id: res.body.id as string, mobile };
  }

  const patchStep = (id: string, step: number, body: unknown) =>
    request(app).patch(`/v1/farmers/applications/${id}/steps/${step}`).send(body as object);

  async function storedStep3(id: string): Promise<unknown> {
    const r = await pool.query<{ step3_location: unknown }>(
      `SELECT step3_location FROM farmer_applications WHERE id = $1`,
      [id],
    );
    return r.rows[0]!.step3_location;
  }

  async function adminToken(): Promise<string> {
    const { signAccessToken } = await import('../../auth/jwt.js');
    // A REAL users row: approval writes status history with the actor as a foreign key, so the
    // factory's fixed id would 500 on any database that was not seeded with exactly that user.
    const admin = await pool.query<{ id: string }>(
      `SELECT u.id FROM users u JOIN user_roles ur ON ur.user_id = u.id JOIN roles r ON r.id = ur.role_id
        WHERE r.code = 'SUPER_ADMIN' AND u.deleted_at IS NULL ORDER BY u.created_at LIMIT 1`,
    );
    return signAccessToken({
      sub: admin.rows[0]!.id,
      roles: [{ code: 'SUPER_ADMIN' }],
      farmerId: null,
      customerId: null,
    });
  }

  async function ready(): Promise<boolean> {
    return (await databaseReady('farmer_applications')) && (await databaseReady('farmers'));
  }

  it('BR-69a: step 3 with an empty locations list is 422 and the previously saved boundary survives (the QA reproduction)', async () => {
    if (!(await ready())) return;
    const { id } = await newApplication();

    const good = await patchStep(id, 3, { locations: [MOBILE_LOCATION] });
    expect(good.status).toBe(200);

    const bad = await patchStep(id, 3, { locations: [] });
    expect(bad.status).toBe(422);
    expect(bad.body.code).toBe('VALIDATION_FAILED');
    expect(Object.keys(bad.body.errors)).toContain('body.locations');

    // The write must not have happened at all: the earlier boundary is still stored.
    const stored = (await storedStep3(id)) as { locations: Array<{ id: string; fmbPolygon: unknown }> };
    expect(stored.locations).toHaveLength(1);
    expect(stored.locations[0]!.id).toBe(MOBILE_LOCATION.id);
    expect(stored.locations[0]!.fmbPolygon).toBeTruthy();
  });

  it('BR-69a: step 3 payloads that are not a { locations: [...] } object are 422, never normalised to an empty list', async () => {
    if (!(await ready())) return;
    const { id } = await newApplication();
    await patchStep(id, 3, { locations: [MOBILE_LOCATION] });

    for (const body of [{}, { locations: 'x' }, { locations: null }, { latitude: 11.4, longitude: 76.7 }, []]) {
      const res = await patchStep(id, 3, body);
      expect(res.status, JSON.stringify(body)).toBe(422);
      expect(res.body.code).toBe('VALIDATION_FAILED');
    }
    const stored = (await storedStep3(id)) as { locations: unknown[] };
    expect(stored.locations).toHaveLength(1);
  });

  it('BR-69b: submit refuses an application whose step 3 has no location, naming step 3, and leaves it a draft', async () => {
    if (!(await ready())) return;
    const { id } = await newApplication();
    // Documents are complete: the ONLY thing missing is located land.
    expect((await patchStep(id, 4, MOBILE_DOCS)).status).toBe(200);

    const res = await request(app).post(`/v1/farmers/applications/${id}/submit`).send();
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_FAILED');
    expect(res.body.detail).toMatch(/step 3/i);
    expect(res.body.meta.missingSteps).toContain(3);

    const row = await pool.query<{ is_draft: boolean; status: string }>(
      `SELECT is_draft, status::text AS status FROM farmer_applications WHERE id = $1`,
      [id],
    );
    expect(row.rows[0]).toEqual({ is_draft: true, status: 'SUBMITTED' });
  });

  it('BR-69b: submit refuses a location that carries neither a boundary nor a GPS position', async () => {
    if (!(await ready())) return;
    const { id } = await newApplication();
    expect((await patchStep(id, 4, MOBILE_DOCS)).status).toBe(200);
    expect(
      (await patchStep(id, 3, { locations: [{ id: 'loc-a', label: 'Home plot', areaAcres: 2 }] })).status,
    ).toBe(200);

    const res = await request(app).post(`/v1/farmers/applications/${id}/submit`).send();
    expect(res.status).toBe(422);
    expect(res.body.detail).toMatch(/step 3/i);
  });

  it('BR-69b: submit re-validates STORED step 3 data, so a row saved before this fix cannot sneak through', async () => {
    if (!(await ready())) return;
    const { id } = await newApplication();
    expect((await patchStep(id, 4, MOBILE_DOCS)).status).toBe(200);
    // Simulate a legacy row: written when the route accepted anything.
    await pool.query(`UPDATE farmer_applications SET step3_location = $2::jsonb WHERE id = $1`, [
      id,
      JSON.stringify({ locations: [{ foo: 'bar' }] }),
    ]);

    const res = await request(app).post(`/v1/farmers/applications/${id}/submit`).send();
    expect(res.status).toBe(422);
    expect(res.body.detail).toMatch(/step 3/i);
  });

  it('BR-69b: submit still names the missing documents when step 3 is fine', async () => {
    if (!(await ready())) return;
    const { id } = await newApplication();
    expect((await patchStep(id, 3, { locations: [MOBILE_LOCATION] })).status).toBe(200);

    const res = await request(app).post(`/v1/farmers/applications/${id}/submit`).send();
    expect(res.status).toBe(422);
    expect(res.body.meta.missingDocuments).toEqual(['ID_PROOF', 'FARM_DOC']);
    expect(res.body.meta.missingSteps).toEqual([4]);
  });

  it('BR-69c: approving an application with zero farm locations is 422 and writes no user, farmer, farm, status change or audit row', async () => {
    if (!(await ready())) return;
    const { id, mobile } = await newApplication();
    expect((await patchStep(id, 1, MOBILE_STEP1)).status).toBe(200);
    expect((await patchStep(id, 4, MOBILE_DOCS)).status).toBe(200);
    // The end state of the QA run: past submit with step 3 empty. Force it with SQL because the
    // fixed submit route no longer lets an application get here (and legacy rows still may).
    await pool.query(
      `UPDATE farmer_applications SET status = 'AUDIT', is_draft = false, step3_location = '{"locations":[]}'::jsonb WHERE id = $1`,
      [id],
    );
    const auditBefore = await pool.query(
      `SELECT count(*)::int AS n FROM audit_log WHERE action_code = 'farmer.application.approve' AND entity_id = $1`,
      [id],
    );

    const res = await request(app)
      .post(`/v1/admin/farmer-applications/${id}/approve`)
      .set('Authorization', `Bearer ${await adminToken()}`)
      .send({});
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_FAILED');
    expect(res.body.detail).toMatch(/location/i);

    const users = await pool.query(`SELECT 1 FROM users WHERE mobile = $1`, [mobile]);
    expect(users.rowCount).toBe(0);
    const farmers = await pool.query(
      `SELECT 1 FROM farmers f JOIN users u ON u.id = f.user_id WHERE u.mobile = $1`,
      [mobile],
    );
    expect(farmers.rowCount).toBe(0);
    const row = await pool.query<{ status: string; farmer_id: string | null }>(
      `SELECT status::text AS status, farmer_id FROM farmer_applications WHERE id = $1`,
      [id],
    );
    expect(row.rows[0]).toEqual({ status: 'AUDIT', farmer_id: null });
    const auditAfter = await pool.query(
      `SELECT count(*)::int AS n FROM audit_log WHERE action_code = 'farmer.application.approve' AND entity_id = $1`,
      [id],
    );
    expect(auditAfter.rows[0].n).toBe(auditBefore.rows[0].n);
  });

  it('BR-69c: approving an application whose step 3 was never captured is 422 too', async () => {
    if (!(await ready())) return;
    const { id, mobile } = await newApplication();
    await pool.query(`UPDATE farmer_applications SET status = 'AUDIT', is_draft = false WHERE id = $1`, [id]);

    const res = await request(app)
      .post(`/v1/admin/farmer-applications/${id}/approve`)
      .set('Authorization', `Bearer ${await adminToken()}`)
      .send({});
    expect(res.status).toBe(422);
    const users = await pool.query(`SELECT 1 FROM users WHERE mobile = $1`, [mobile]);
    expect(users.rowCount).toBe(0);
  });

  it('BR-69: a complete application made of the mobile app\'s real payloads goes draft -> submit -> approve and ends with one farm', async () => {
    if (!(await ready())) return;
    const { id, mobile } = await newApplication();

    expect((await patchStep(id, 1, { ...MOBILE_STEP1, mobile })).status).toBe(200);
    expect((await patchStep(id, 2, MOBILE_STEP2)).status).toBe(200);
    expect((await patchStep(id, 3, { locations: [MOBILE_LOCATION] })).status).toBe(200);
    expect((await patchStep(id, 4, MOBILE_DOCS)).status).toBe(200);
    expect((await patchStep(id, 5, { confirmed: true })).status).toBe(200);

    const submit = await request(app).post(`/v1/farmers/applications/${id}/submit`).send();
    expect(submit.status).toBe(200);
    expect(submit.body.status).toBe('DOCS_REVIEW');

    await pool.query(`UPDATE farmer_applications SET status = 'AUDIT' WHERE id = $1`, [id]);
    const approve = await request(app)
      .post(`/v1/admin/farmer-applications/${id}/approve`)
      .set('Authorization', `Bearer ${await adminToken()}`)
      .send({});
    expect(approve.status).toBe(200);

    const farms = await pool.query(
      `SELECT count(*)::int AS n FROM farms fa JOIN farmers f ON f.id = fa.farmer_id JOIN users u ON u.id = f.user_id WHERE u.mobile = $1`,
      [mobile],
    );
    expect(farms.rows[0].n).toBe(1);
  });

  it('BR-69: draft saves stay partial -- each step accepts a body that carries only some of its fields', async () => {
    if (!(await ready())) return;
    const { id } = await newApplication();
    expect((await patchStep(id, 1, { fullName: 'Devika R' })).status).toBe(200);
    expect((await patchStep(id, 1, { aadhaarLast4: '0123' })).status).toBe(200);
    expect((await patchStep(id, 2, { farmName: 'Blue Hills Organic' })).status).toBe(200);
    expect((await patchStep(id, 2, {})).status).toBe(200);
    // The Step 4 "skip" button sends an empty list.
    expect((await patchStep(id, 4, { documents: [] })).status).toBe(200);
    expect((await patchStep(id, 5, {})).status).toBe(200);
  });

  it('BR-69d: the mobile app\'s dob/gender shapes and an ISO dob are accepted; the full Aadhaar number is still accepted-and-stripped, never stored (BR-33b)', async () => {
    if (!(await ready())) return;
    const { id } = await newApplication();
    for (const dob of ['21 / 05 / 1990', '21/05/1990', '1990-05-21']) {
      expect((await patchStep(id, 1, { dob })).status, dob).toBe(200);
    }
    for (const gender of ['Male', 'Female', 'Other', 'MALE', 'UNDISCLOSED']) {
      expect((await patchStep(id, 1, { gender })).status, gender).toBe(200);
    }
    const res = await patchStep(id, 1, { aadhaarNumber: '234567890123', aadhaarLast4: '0123' });
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toContain('234567890123');
    const stored = await pool.query(`SELECT step1_personal::text AS s FROM farmer_applications WHERE id = $1`, [id]);
    expect(stored.rows[0].s).not.toContain('234567890123');
  });

  it.each([
    ['aadhaarLast4 of 3 digits', { aadhaarLast4: '012' }],
    ['aadhaarLast4 of 5 digits', { aadhaarLast4: '01234' }],
    ['aadhaarLast4 with letters', { aadhaarLast4: '01a3' }],
    ['aadhaarLast4 as a number', { aadhaarLast4: 1234 }],
    ['a 12-digit number in aadhaarLast4', { aadhaarLast4: '234567890123' }],
    ['dob that is not a date', { dob: 'yesterday' }],
    ['dob 31 Feb', { dob: '2000-02-31' }],
    ['dob 31/02/2000', { dob: '31 / 02 / 2000' }],
    ['dob in the future', { dob: '2999-01-01' }],
    ['dob in the future (mobile shape)', { dob: '01 / 01 / 2999' }],
    ['gender outside the set', { gender: 'Robot' }],
    ['pincode with a leading zero', { pincode: '043217' }],
    ['mobile not E.164', { mobile: '9812345678' }],
    ['fullName of one character', { fullName: 'D' }],
  ])('BR-69e: step 1 rejects %s with 422 and does not echo the value', async (_name, body) => {
    if (!(await ready())) return;
    const { id } = await newApplication();
    const res = await patchStep(id, 1, body);
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_FAILED');
    const key = Object.keys(body)[0]!;
    expect(Object.keys(res.body.errors)).toContain(`body.${key}`);
    // Sensitive input must never come back in the problem body.
    const raw = String(Object.values(body)[0]);
    if (key === 'aadhaarLast4' || key === 'dob') {
      expect(JSON.stringify(res.body)).not.toContain(raw);
    }
  });

  it.each([
    [1, { fullName: 'Devika R', surprise: true }],
    [2, { farmName: 'Blue Hills', surprise: true }],
    [3, { locations: [MOBILE_LOCATION], surprise: true }],
    [3, { locations: [{ ...MOBILE_LOCATION, surprise: true }] }],
    [3, { locations: [{ ...MOBILE_LOCATION, fmbPolygon: { type: 'Polygon', coordinates: [CLOSED_RING], surprise: 1 } }] }],
    [4, { documents: MOBILE_DOCS.documents, surprise: true }],
    [4, { documents: [{ ...MOBILE_DOCS.documents[0]!, surprise: true }] }],
    [5, { confirmed: true, surprise: true }],
  ])('BR-69f: step %i rejects an unknown key with 422 (%#)', async (step, body) => {
    if (!(await ready())) return;
    const { id } = await newApplication();
    const res = await patchStep(id, step, body);
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_FAILED');
    expect(JSON.stringify(res.body.errors)).toMatch(/surprise/);
  });

  it.each([
    ['a location with no label', { ...MOBILE_LOCATION, label: '' }],
    ['a location with a blank label', { ...MOBILE_LOCATION, label: '   ' }],
    ['a location with no id', { ...MOBILE_LOCATION, id: undefined }],
    ['a location with no areaAcres', { ...MOBILE_LOCATION, areaAcres: undefined }],
    ['a location with zero areaAcres', { ...MOBILE_LOCATION, areaAcres: 0 }],
    ['a location with string areaAcres', { ...MOBILE_LOCATION, areaAcres: '2' }],
    ['latitude above 90', { ...MOBILE_LOCATION, latitude: 91 }],
    ['longitude below -180', { ...MOBILE_LOCATION, longitude: -181 }],
    ['a polygon vertex with longitude out of range', { ...MOBILE_LOCATION, fmbPolygon: { type: 'Polygon', coordinates: [[[200, 11], [76, 11], [76, 12], [200, 11]]] } }],
    ['a polygon vertex with latitude out of range', { ...MOBILE_LOCATION, fmbPolygon: { type: 'Polygon', coordinates: [[[76, 95], [76, 11], [77, 12], [76, 95]]] } }],
    ['an unclosed polygon ring', { ...MOBILE_LOCATION, fmbPolygon: { type: 'Polygon', coordinates: [CLOSED_RING.slice(0, 4)] } }],
    ['a polygon ring with fewer than 4 positions', { ...MOBILE_LOCATION, fmbPolygon: { type: 'Polygon', coordinates: [[[76, 11], [77, 11], [76, 11]]] } }],
    ['a polygon with no ring', { ...MOBILE_LOCATION, fmbPolygon: { type: 'Polygon', coordinates: [] } }],
    ['a polygon of the wrong GeoJSON type', { ...MOBILE_LOCATION, fmbPolygon: { type: 'Point', coordinates: [CLOSED_RING] } }],
  ])('BR-69g: step 3 rejects %s with 422 and keeps what was saved', async (_name, location) => {
    if (!(await ready())) return;
    const { id } = await newApplication();
    expect((await patchStep(id, 3, { locations: [MOBILE_LOCATION] })).status).toBe(200);

    const res = await patchStep(id, 3, { locations: [location] });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_FAILED');
    const stored = (await storedStep3(id)) as { locations: Array<{ id: string }> };
    expect(stored.locations).toHaveLength(1);
    expect(stored.locations[0]!.id).toBe(MOBILE_LOCATION.id);
  });

  it.each([
    [2, { experienceYears: -1 }],
    [2, { experienceYears: 2.5 }],
    [2, { totalAreaAcres: 0 }],
    [2, { numberOfFarms: 0 }],
    [2, { farmName: '' }],
    [2, { primaryCrops: 'Carrot' }],
    [4, { documents: [{ docType: 'PASSPORT', fileUrl: 'https://blob.example/a.pdf' }] }],
    [4, { documents: [{ docType: 'ID_PROOF', fileUrl: 'not a url' }] }],
    [4, { documents: 'x' }],
    [5, { confirmed: 'yes' }],
  ])('BR-69g: step %i rejects %j with 422', async (step, body) => {
    if (!(await ready())) return;
    const { id } = await newApplication();
    const res = await patchStep(id, step, body);
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_FAILED');
  });

  it('BR-69: a body that is not a JSON object is refused on every step (an array 422 here, a bare scalar 400 from the global body parser) and nothing is saved', async () => {
    if (!(await ready())) return;
    const { id } = await newApplication();
    for (const step of [1, 2, 3, 4, 5]) {
      const asArray = await patchStep(id, step, [{ fullName: 'Devika R' }]);
      expect(asArray.status, `array, step ${step}`).toBe(422);
      const asScalar = await request(app)
        .patch(`/v1/farmers/applications/${id}/steps/${step}`)
        .set('Content-Type', 'application/json')
        .send('"just a string"');
      expect(asScalar.status, `scalar, step ${step}`).toBe(400);
    }
    const row = await pool.query<{ completed_steps: number[] }>(
      `SELECT completed_steps FROM farmer_applications WHERE id = $1`,
      [id],
    );
    expect(row.rows[0]!.completed_steps).toEqual([]);
  });
});

// No database needed: these run on every `pnpm test`, not only when DATABASE_URL is set.
describe('BR-69: registration step schemas (pure)', () => {
  it('BR-69a: step 3 rejects an empty location list and every non-object shape', () => {
    expect(step3LocationSchema.safeParse({ locations: [] }).success).toBe(false);
    expect(step3LocationSchema.safeParse({}).success).toBe(false);
    expect(step3LocationSchema.safeParse([MOBILE_LOCATION]).success).toBe(false);
    expect(step3LocationSchema.safeParse({ locations: [MOBILE_LOCATION] }).success).toBe(true);
  });

  it('BR-69d: isRealPastDate accepts both wire shapes and rejects impossible, future and garbage dates', () => {
    const now = new Date('2026-10-10T12:00:00Z');
    expect(isRealPastDate('1990-05-21', now)).toBe(true);
    expect(isRealPastDate('21 / 05 / 1990', now)).toBe(true);
    expect(isRealPastDate('29/02/2024', now)).toBe(true);
    expect(isRealPastDate('29/02/2023', now)).toBe(false);
    expect(isRealPastDate('2000-13-01', now)).toBe(false);
    expect(isRealPastDate('2026-10-10', now)).toBe(true);
    expect(isRealPastDate('2026-10-11', now)).toBe(false);
    expect(isRealPastDate('', now)).toBe(false);
    expect(isRealPastDate('not a date', now)).toBe(false);
  });

  it('BR-69e: a rejected aadhaarLast4 or dob never echoes the submitted value in its message', () => {
    const result = step1PersonalSchema.safeParse({ aadhaarLast4: '98765', dob: '2999-12-31' });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.success ? {} : result.error.issues)).not.toMatch(/98765|2999/);
  });

  it('BR-33b: the step-1 schema drops a full aadhaarNumber instead of passing it on', () => {
    const result = step1PersonalSchema.safeParse({ aadhaarNumber: '234567890123', aadhaarLast4: '0123' });
    expect(result.success).toBe(true);
    expect(result.success && JSON.stringify(result.data)).not.toContain('234567890123');
  });

  it('BR-69f: every step schema is strict', () => {
    for (const step of [1, 2, 3, 4, 5] as const) {
      const base = step === 3 ? { locations: [MOBILE_LOCATION] } : step === 4 ? { documents: [] } : {};
      expect(registrationStepBodySchemas[step].safeParse({ ...base, surprise: 1 }).success, `step ${step}`).toBe(false);
    }
  });
});
