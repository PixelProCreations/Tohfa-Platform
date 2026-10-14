import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SEED_DIR } from '../paths.js';
import { SEED_KINDS, planSeeds } from './runner.js';

const ALL = [
  '001_reference.sql',
  '002_permissions.js',
  '003_dev_users.sql',
  '004_demo.js',
  '005_crop_rotation_seed.sql',
  '006_pest_library_seed.sql',
];

describe('planSeeds', () => {
  it('default: runs only 001 + 002 and says why the others were skipped', () => {
    const plan = planSeeds(ALL, {});
    expect(plan.run).toEqual(['001_reference.sql', '002_permissions.js']);
    expect(plan.skipped.map((s) => s.file)).toEqual([
      '003_dev_users.sql',
      '004_demo.js',
      '005_crop_rotation_seed.sql',
      '006_pest_library_seed.sql',
    ]);
    expect(plan.skipped[0]?.reason).toContain('SEED_DEV_USERS=true');
  });

  it('SEED_DEV_USERS=true: runs everything in filename order', () => {
    expect(planSeeds(ALL, { SEED_DEV_USERS: 'true' }).run).toEqual(ALL);
  });

  it('only the exact string "true" enables dev seeds', () => {
    for (const value of ['1', 'yes', 'TRUE', '']) {
      expect(planSeeds(ALL, { SEED_DEV_USERS: value }).run).toHaveLength(2);
    }
  });

  it('refuses SEED_DEV_USERS=true when NODE_ENV=production, and is fine without it', () => {
    expect(() => planSeeds(ALL, { SEED_DEV_USERS: 'true', NODE_ENV: 'production' })).toThrow(/production/);
    expect(planSeeds(ALL, { NODE_ENV: 'production' }).run).toHaveLength(2);
  });

  it('fails loudly on a seed file nobody classified', () => {
    expect(() => planSeeds([...ALL, '007_new.sql'], {})).toThrow(/007_new\.sql/);
  });

  it('every seed file in db/seed is classified', () => {
    const files = readdirSync(SEED_DIR).filter((f) => f.endsWith('.sql') || f.endsWith('.js'));
    expect(files.filter((f) => SEED_KINDS[f] === undefined)).toEqual([]);
  });
});
