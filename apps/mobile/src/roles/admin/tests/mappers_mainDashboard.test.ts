/**
 * Main Warehouse dashboard: the pure view-state helpers (screens/dashboard/
 * mappers_mainDashboard.ts). The dashboard must never draw a zero, "All
 * Warehouses Normal" or "No alerts" for a query that is still loading or has
 * failed (root CLAUDE.md 6, "report honestly"; BR-77, BR-78 for the alert and
 * task sources).
 */
import { describe, expect, it } from 'vitest';
import {
  FIGURE_PLACEHOLDER,
  combineSources,
  figureOrPlaceholder,
  sectionStatus,
} from '../screens/dashboard/mappers_mainDashboard';

const idle = { isLoading: false, isFetching: false, error: null, data: undefined };

describe('sectionStatus: which state a dashboard section draws', () => {
  it('BR-77: a query with no data yet is loading, never ready (no zeros while loading)', () => {
    expect(sectionStatus({ ...idle, isLoading: true, isFetching: true })).toBe('loading');
  });

  it('a query that has not started (disabled) is loading, not an empty success', () => {
    expect(sectionStatus(idle)).toBe('loading');
  });

  it('a failed query with no data is an error', () => {
    expect(sectionStatus({ ...idle, error: new Error('x') })).toBe('error');
  });

  it('a Retry in flight after an error shows loading, not the stale error', () => {
    expect(sectionStatus({ ...idle, error: new Error('x'), isFetching: true })).toBe('loading');
  });

  it('data on screen is ready, even an empty list (a real "no alerts" after a successful fetch)', () => {
    expect(sectionStatus({ ...idle, data: { items: [] } })).toBe('ready');
  });

  it('a failed or in-flight refresh does not blank data already on screen', () => {
    expect(sectionStatus({ ...idle, data: { items: [] }, error: new Error('x') })).toBe('ready');
    expect(sectionStatus({ ...idle, data: { items: [] }, isFetching: true })).toBe('ready');
  });
});

describe('combineSources: a section that needs several queries', () => {
  it('is ready only when every source is ready', () => {
    expect(combineSources(['ready', 'ready'])).toBe('ready');
    expect(combineSources(['ready', 'loading'])).toBe('loading');
    expect(combineSources([])).toBe('ready');
  });

  it('an error wins over loading, so a failed source is not hidden behind a slow one', () => {
    expect(combineSources(['loading', 'error', 'ready'])).toBe('error');
  });
});

describe('figureOrPlaceholder: a tile value', () => {
  it('shows the placeholder, never 0, until the source is ready', () => {
    expect(figureOrPlaceholder('loading', () => '0')).toBe(FIGURE_PLACEHOLDER);
    expect(figureOrPlaceholder('error', () => '0')).toBe(FIGURE_PLACEHOLDER);
  });

  it('formats the value once ready, and does not evaluate it before that', () => {
    let calls = 0;
    expect(figureOrPlaceholder('ready', () => { calls += 1; return '12'; })).toBe('12');
    figureOrPlaceholder('loading', () => { calls += 1; return '1'; });
    expect(calls).toBe(1);
  });
});
