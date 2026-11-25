/**
 * Types for the optional native packages that are not installed in this
 * checkout (see ./index.ts). Only the surface this app calls is declared.
 * react-native-razorpay is declared in src/env.d.ts. When a real package is
 * installed, delete its block here so the package's own types are used.
 */

declare module '@react-native-firebase/app' {
  export function getApps(): unknown[];
}

declare module '@react-native-firebase/messaging' {
  type Messaging = object;
  type Unsubscribe = () => void;
  interface RemoteMessage {
    messageId?: string | undefined;
    notification?: { title?: string | undefined; body?: string | undefined } | undefined;
    data?: Record<string, unknown> | undefined;
  }
  export const AuthorizationStatus: {
    readonly NOT_DETERMINED: -1;
    readonly DENIED: 0;
    readonly AUTHORIZED: 1;
    readonly PROVISIONAL: 2;
    readonly EPHEMERAL: 3;
  };
  export function getMessaging(): Messaging;
  export function hasPermission(messaging: Messaging): Promise<number>;
  export function requestPermission(messaging: Messaging): Promise<number>;
  export function getToken(messaging: Messaging): Promise<string>;
  export function deleteToken(messaging: Messaging): Promise<void>;
  export function onTokenRefresh(messaging: Messaging, listener: (token: string) => void): Unsubscribe;
  export function onMessage(messaging: Messaging, listener: (message: RemoteMessage) => void): Unsubscribe;
  export function onNotificationOpenedApp(messaging: Messaging, listener: (message: RemoteMessage) => void): Unsubscribe;
  export function getInitialNotification(messaging: Messaging): Promise<RemoteMessage | null>;
}

declare module 'react-native-image-picker' {
  export interface Asset {
    base64?: string | undefined;
    uri?: string | undefined;
    type?: string | undefined;
    fileName?: string | undefined;
    fileSize?: number | undefined;
    width?: number | undefined;
    height?: number | undefined;
  }
  export interface ImagePickerResponse {
    didCancel?: boolean | undefined;
    errorCode?: 'camera_unavailable' | 'permission' | 'others' | undefined;
    errorMessage?: string | undefined;
    assets?: Asset[] | undefined;
  }
  export interface ImageLibraryOptions {
    mediaType: 'photo' | 'video' | 'mixed';
    selectionLimit?: number;
    includeBase64?: boolean;
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  }
  export function launchImageLibrary(options: ImageLibraryOptions): Promise<ImagePickerResponse>;
  export function launchCamera(options: ImageLibraryOptions): Promise<ImagePickerResponse>;
}

declare module '@react-native-community/geolocation' {
  type ErrorCallback = (err: { code?: number; message?: string }) => void;
  const Geolocation: {
    requestAuthorization(success?: () => void, error?: ErrorCallback): void;
    getCurrentPosition(
      success: (pos: { coords: { latitude: number; longitude: number } }) => void,
      error?: ErrorCallback,
      options?: { enableHighAccuracy?: boolean; timeout?: number; maximumAge?: number },
    ): void;
    watchPosition(success: (pos: unknown) => void, error?: ErrorCallback, options?: unknown): number;
    clearWatch(watchId: number): void;
    stopObserving(): void;
  };
  export default Geolocation;
}

declare module 'react-native-qrcode-svg' {
  import type { ReactElement } from 'react';
  export default function QRCode(props: { value?: string; size?: number }): ReactElement | null;
}
