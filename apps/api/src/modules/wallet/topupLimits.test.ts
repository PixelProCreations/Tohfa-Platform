import { describe, expect, it } from 'vitest';
import { resolveTopupLimits } from './topupLimits.js';

describe('BR-193: top-up limits', () => {
  it('BR-193: missing config falls back to documented defaults', () => {
    expect(resolveTopupLimits(undefined, undefined)).toEqual({ min: '100.00', max: '50000.00' });
  });
  it('BR-193: configured money strings and numbers are used', () => {
    expect(resolveTopupLimits('50.00', 20000)).toEqual({ min: '50.00', max: '20000.00' });
  });
  it('BR-193: a min above max is ignored in favour of the defaults', () => {
    expect(resolveTopupLimits('900.00', '100.00')).toEqual({ min: '100.00', max: '50000.00' });
  });
});
