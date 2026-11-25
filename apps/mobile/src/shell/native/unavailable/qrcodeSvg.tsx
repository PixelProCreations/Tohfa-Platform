/**
 * Stand-in for react-native-qrcode-svg; see ./index.ts. Renders nothing.
 *
 * Unlike the others this one is pure JS (it draws through react-native-svg,
 * which IS in the APK), so installing it needs `pnpm add` only, no native
 * rebuild.
 */
export default function QRCode(_props: { value?: string; size?: number }): null {
  return null;
}
