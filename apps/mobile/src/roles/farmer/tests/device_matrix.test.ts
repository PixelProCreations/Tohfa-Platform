import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import '../polyfills';
import { formatSafeCurrency, formatSafeDate } from '../polyfills';

describe('User Story 51 (S-51): Farmer Mobile Baselines & Device Matrix', () => {
  // Post-merge: android/ and ios/ are the ONE shared native project for every
  // role, 4 levels above this tests/ dir (tests -> farmer -> roles -> src ->
  // apps/mobile), not 2 as when farmer-mobile was its own standalone app.
  it('verifies Android build config matches baseline Android 8.0 (API 26)', () => {
    const buildGradlePath = path.resolve(__dirname, '../../../../android/build.gradle');
    const appBuildGradlePath = path.resolve(__dirname, '../../../../android/app/build.gradle');
    const gradlePropsPath = path.resolve(__dirname, '../../../../android/gradle.properties');

    expect(fs.existsSync(buildGradlePath)).toBe(true);
    expect(fs.existsSync(appBuildGradlePath)).toBe(true);
    expect(fs.existsSync(gradlePropsPath)).toBe(true);

    const buildGradle = fs.readFileSync(buildGradlePath, 'utf8');
    const appBuildGradle = fs.readFileSync(appBuildGradlePath, 'utf8');
    const gradleProps = fs.readFileSync(gradlePropsPath, 'utf8');

    expect(buildGradle).toMatch(/minSdkVersion\s*=\s*26/);
    // RN 0.88: Hermes is no longer configured by `project.ext.react.enableHermes`
    // (a pre-0.71 map the Gradle plugin no longer reads). The real mechanism is
    // `hermesEnabled=true` in gradle.properties, which app/build.gradle reads to
    // link hermes-android, and the New Architecture flag the RN 0.88 runtime requires.
    expect(appBuildGradle).toMatch(/apply plugin:\s*"com\.facebook\.react"/);
    expect(appBuildGradle).toMatch(
      /if\s*\(hermesEnabled\.toBoolean\(\)\)\s*\{\s*implementation\("com\.facebook\.react:hermes-android"\)/,
    );
    expect(gradleProps).toMatch(/^hermesEnabled=true$/m);
    expect(gradleProps).toMatch(/^newArchEnabled=true$/m);
  });

  it('verifies iOS Podfile matches baseline iOS 15.1 (RN 0.88 minimum) with Hermes enabled', () => {
    const podfilePath = path.resolve(__dirname, '../../../../ios/Podfile');
    expect(fs.existsSync(podfilePath)).toBe(true);

    const podfile = fs.readFileSync(podfilePath, 'utf8');
    expect(podfile).toMatch(/platform\s*:ios,\s*['"]15\.1['"]/);
    expect(podfile).toMatch(/:hermes_enabled\s*=>\s*true/);

    // The Xcode project's own deployment target must agree with the Podfile.
    const pbxprojPath = path.resolve(__dirname, '../../../../ios/TohfaMobile.xcodeproj/project.pbxproj');
    const pbxproj = fs.readFileSync(pbxprojPath, 'utf8');
    const targets = [...pbxproj.matchAll(/IPHONEOS_DEPLOYMENT_TARGET = ([0-9.]+);/g)].map((m) => m[1]);
    expect(targets.length).toBeGreaterThan(0);
    expect(new Set(targets)).toEqual(new Set(['15.1']));
  });

  it('validates runtime polyfills for legacy engines (API 26 / iOS 13)', () => {
    // 1. Array.prototype.at
    const arr = [10, 20, 30];
    expect(arr.at(-1)).toBe(30);
    expect(arr.at(0)).toBe(10);
    expect(arr.at(10)).toBeUndefined();

    // 2. String.prototype.at
    const str = 'TOHFA';
    expect(str.at(-1)).toBe('A');
    expect(str.at(0)).toBe('T');

    // 3. Object.hasOwn
    const obj = { key: 'val' };
    expect(Object.hasOwn(obj, 'key')).toBe(true);
    expect(Object.hasOwn(obj, 'nonexistent')).toBe(false);

    // 4. structuredClone
    const original = { id: 1, nested: { value: 'farm' } };
    const cloned = structuredClone(original);
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned.nested).not.toBe(original.nested);

    // 5. formatSafeCurrency
    expect(formatSafeCurrency('1500')).toContain('1,500');
    expect(formatSafeCurrency('0')).toContain('0');

    // 6. formatSafeDate
    const dateFormatted = formatSafeDate('2026-09-09T10:00:00Z');
    expect(dateFormatted).toBeTruthy();
  });
});
