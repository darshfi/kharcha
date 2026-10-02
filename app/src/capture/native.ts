import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';
import type { CaptureBridge } from './types';

// This module is intentionally optional: Expo Go and iOS can still run the app.
export const captureNative: CaptureBridge | null = Platform.OS === 'android'
  ? requireOptionalNativeModule<CaptureBridge>('TransactionCapture') : null;

/** Call synchronously when the authenticated user changes, including sign-out. */
export function setCaptureUser(userId: string | null): void {
  captureNative?.setActiveUser(userId);
}
