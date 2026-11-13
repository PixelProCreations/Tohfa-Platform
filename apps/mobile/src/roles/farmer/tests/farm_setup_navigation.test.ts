/**
 * Regression: Profile -> "Farm & FMB" -> Edit FMB. "Save Zones navigates to the
 * Field Context screen", and the farmer could never get out of the setup except
 * by pressing Back three times.
 *
 * Root cause: the setup is FMB Sketch -> (Save FMB) Field Context -> (Save)
 * Zones, each step pushing the next onto App.tsx's history. Zones' "Save Zones"
 * was wired to `goBack`, which pops ONE entry -- straight back to Field
 * Context, whose Save pushes Zones again: a Zones <-> Field Context loop.
 * (The screen was first wired to navigate('MainTabs'); commit eb60e222 swapped
 * every handler to goBack, which is right for Back but not for the last
 * step's Save.) "Save Zones" now leaves the whole setup and returns to where
 * the farmer entered it.
 *
 * App.tsx imports react-native, so this test drives the same push/pop rules
 * App.tsx's `navigate` / `goBack` / `exitFlow` apply, through the pure helper
 * they share, and pins the App.tsx wiring by source.
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { FARM_SETUP_FLOW, emptyHistoryBackTarget, popPastFlow } from '../utils/navigationSession';

const APP_SOURCE = fs.readFileSync(path.join(__dirname, '..', 'App.tsx'), 'utf8');

interface Entry {
  screen: string;
  tab?: string;
}

/** A tiny model of App.tsx's history: navigate pushes the current screen, goBack pops one. */
function makeNav(start: Entry) {
  let current: Entry = start;
  let history: Entry[] = [];
  return {
    get current() {
      return current;
    },
    get history() {
      return history;
    },
    navigate(screen: string) {
      history = [...history, current];
      current = { screen };
    },
    goBack() {
      const previous = history[history.length - 1];
      if (previous) {
        history = history.slice(0, -1);
        current = previous;
      }
    },
    exitFlow(flow: readonly string[]) {
      const { target, rest } = popPastFlow(history, flow);
      history = rest;
      current = target ?? { screen: emptyHistoryBackTarget(current.screen) ?? 'MainTabs' };
    },
  };
}

/** The handler each App.tsx render branch passes for `prop` (text up to the end of that line). */
function handlerFor(screen: string, prop: string): string {
  const start = APP_SOURCE.indexOf(`screen === '${screen}' ? (`);
  expect(start).toBeGreaterThan(-1);
  const end = APP_SOURCE.indexOf('/>', start);
  const block = APP_SOURCE.slice(start, end);
  const match = block.match(new RegExp(`${prop}=\\{([^\\n]*)\\}\\s*$`, 'm'));
  expect(match, `${screen} ${prop}`).not.toBeNull();
  return (match as RegExpMatchArray)[1] as string;
}

describe('Profile Farm & FMB setup navigation', () => {
  it('Save FMB -> Save -> Save Zones returns to the Profile tab with an empty stack', () => {
    const nav = makeNav({ screen: 'MainTabs', tab: 'Profile' });
    nav.navigate('FMBSketch');
    nav.navigate('FieldContext'); // Save FMB
    nav.navigate('Zones'); // Field Context Save
    nav.exitFlow(FARM_SETUP_FLOW); // Save Zones
    expect(nav.current).toEqual({ screen: 'MainTabs', tab: 'Profile' });
    expect(nav.history).toEqual([]);
  });

  it('repeating the setup never grows the history', () => {
    const nav = makeNav({ screen: 'MainTabs', tab: 'Profile' });
    for (let round = 0; round < 5; round += 1) {
      nav.navigate('FMBSketch');
      nav.navigate('FieldContext');
      nav.navigate('Zones');
      nav.exitFlow(FARM_SETUP_FLOW);
      expect(nav.history).toEqual([]);
      expect(nav.current.screen).toBe('MainTabs');
    }
  });

  it('Back pops exactly one step: Zones -> Field Context -> FMB Sketch -> Profile', () => {
    const nav = makeNav({ screen: 'MainTabs', tab: 'Profile' });
    nav.navigate('FMBSketch');
    nav.navigate('FieldContext');
    nav.navigate('Zones');
    const seen: string[] = [];
    for (let i = 0; i < 3; i += 1) {
      nav.goBack();
      seen.push(nav.current.screen);
    }
    expect(seen).toEqual(['FieldContext', 'FMBSketch', 'MainTabs']);
    expect(nav.history).toEqual([]);
  });

  it('Back from Field Context to FMB Sketch and Save FMB again does not stack duplicates', () => {
    const nav = makeNav({ screen: 'MainTabs', tab: 'Profile' });
    nav.navigate('FMBSketch');
    nav.navigate('FieldContext');
    nav.goBack();
    nav.navigate('FieldContext');
    expect(nav.history.map((e) => e.screen)).toEqual(['MainTabs', 'FMBSketch']);
  });

  it('exits to the screen before the setup, whatever that is, and falls back to MainTabs with no history', () => {
    expect(popPastFlow([{ screen: 'MainTabs' }, { screen: 'Notifications' }, { screen: 'FMBSketch' }, { screen: 'FieldContext' }], FARM_SETUP_FLOW)).toEqual({
      target: { screen: 'Notifications' },
      rest: [{ screen: 'MainTabs' }],
    });
    expect(popPastFlow([{ screen: 'FieldContext' }], FARM_SETUP_FLOW)).toEqual({ target: undefined, rest: [] });
    const nav = makeNav({ screen: 'Zones' });
    nav.exitFlow(FARM_SETUP_FLOW);
    expect(nav.current.screen).toBe('MainTabs');
  });

  it('App.tsx wires Save Zones to leave the setup, and every Back to a single pop', () => {
    expect(handlerFor('Zones', 'onSave')).toBe('() => exitFlow(FARM_SETUP_FLOW)');
    expect(handlerFor('Zones', 'onNavigateBack')).toBe('goBack');
    expect(handlerFor('FieldContext', 'onNavigateBack')).toBe('goBack');
    expect(handlerFor('FMBSketch', 'onNavigateBack')).toBe('goBack');
    expect(handlerFor('FMBSketch', 'onNavigateToFieldContext')).toBe("(farmId) => navigate('FieldContext', { farmId })");
  });

  it("FMB Sketch: Edit zones opens Zones for the farm, the same way Field Context's Save does", () => {
    expect(handlerFor('FMBSketch', 'onNavigateToZones')).toBe("(farmId) => navigate('Zones', { farmId })");
  });

  it('FMB Sketch: Back from Zones opened by Edit zones returns to FMB Sketch; Save Zones still leaves the setup', () => {
    const back = makeNav({ screen: 'MainTabs', tab: 'Profile' });
    back.navigate('FMBSketch');
    back.navigate('Zones'); // Edit zones
    back.goBack();
    expect(back.current.screen).toBe('FMBSketch');
    expect(back.history).toEqual([{ screen: 'MainTabs', tab: 'Profile' }]);

    const save = makeNav({ screen: 'MainTabs', tab: 'Profile' });
    save.navigate('FMBSketch');
    save.navigate('Zones'); // Edit zones
    save.exitFlow(FARM_SETUP_FLOW); // Save Zones
    expect(save.current).toEqual({ screen: 'MainTabs', tab: 'Profile' });
    expect(save.history).toEqual([]);
  });
});
