/**
 * Stand-in for @react-native-firebase/app; see ./index.ts. No native Firebase
 * app exists, so push.ts sees push as "not configured" and never touches
 * messaging.
 */
export function getApps(): unknown[] {
  return [];
}
